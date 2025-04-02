import { HttpsProxyAgent } from "https-proxy-agent";
import fs from "fs/promises";
import logger from "../utils/logger.js";
import { checkProxySpeed, delay } from "../utils/helpers.js";
import { DELAYS } from "../config/constants.js";
import beamableApi from "../api/beamableApi.js";
import taskManager from "./taskManager.js";

/**
 * 账户管理类
 * 处理多账户和代理相关逻辑
 */
class AccountManager {
  constructor() {
    this.accounts = [];
    this.proxies = [];
  }

  /**
   * 初始化账户管理器
   * @param {boolean} dailyCheckInOnly - 是否仅执行每日签到
   */
  async initialize(dailyCheckInOnly = false) {
    try {
      logger.info("正在初始化账户管理器...");
      
      // 读取cookies和代理
      await this.loadAccountsAndProxies();
      
      if (this.accounts.length === 0) {
        logger.error("未找到账户信息，请检查cookies.txt文件");
        return false;
      }
      
      logger.info(`已加载 ${this.accounts.length} 个账户`);
      logger.info(`已加载 ${this.proxies.length} 个代理`);
      
      // 在完整模式下加载任务信息
      if (!dailyCheckInOnly) {
        this.loadTaskData();
      }
      
      return true;
    } catch (error) {
      logger.error(`初始化失败: ${error.message}`);
      return false;
    }
  }

  // 读取账户和代理文件
  async loadAccountsAndProxies() {
    try {
      // 读取cookies
      const cookiesData = await fs.readFile("cookies.txt", "utf-8");
      this.accounts = cookiesData.trim().split("\n")
        .filter(line => line.trim() && !line.startsWith("#")) // 过滤掉空行和注释
        .map(cookie => cookie.trim());
      
      // 读取代理
      try {
        const proxiesData = await fs.readFile("proxies.txt", "utf-8");
        this.proxies = proxiesData.trim().split("\n")
          .filter(line => line.trim() && !line.startsWith("#")) // 过滤掉空行和注释
          .map(proxy => proxy.trim());
      } catch (error) {
        // 代理文件不存在不影响程序运行
        logger.warn("未找到代理文件或文件为空");
      }
    } catch (error) {
      logger.error(`读取文件失败: ${error.message}`);
      throw error;
    }
  }

  // 加载任务数据
  async loadTaskData() {
    try {
      // 检查任务更新
      try {
        await taskManager.checkNewQuests();
      } catch (error) {
        logger.error(`检查远程任务失败: ${error.message}`);
      }
      
      try {
        const completedTasks = await taskManager.checkNewCompleteQuests();
        logger.info(`已加载${completedTasks.length}个已完成任务`);
      } catch (error) {
        logger.error(`检查已完成任务失败: ${error.message}`);
      }
    } catch (error) {
      logger.error(`加载任务数据失败: ${error.message}`);
    }
  }

  /**
   * 测试所有代理连接
   */
  async testProxies() {
    if (this.proxies.length === 0) return;
    
    logger.info("开始测试代理连接...");
    const proxyResults = [];
    
    for (let i = 0; i < this.proxies.length; i++) {
      const proxy = this.proxies[i];
      logger.info(`测试代理 ${i+1}/${this.proxies.length}: ${proxy}`);
      
      try {
        const agent = new HttpsProxyAgent(proxy);
        const result = await checkProxySpeed(agent);
        
        proxyResults.push({
          proxy,
          status: result.status,
          time: result.time,
          index: i
        });
        
        logger.info(`代理 ${i+1} 测试结果: ${result.status}, 耗时: ${result.time}ms`);
      } catch (error) {
        logger.info(`代理 ${i+1} 测试失败: ${error.message}`);
        proxyResults.push({
          proxy,
          status: 'error',
          time: Infinity,
          index: i
        });
      }
    }
    
    // 按速度排序代理
    proxyResults.sort((a, b) => {
      if (a.status === 'success' && b.status === 'success') {
        return a.time - b.time;
      }
      if (a.status === 'success') return -1;
      if (b.status === 'success') return 1;
      return a.index - b.index;
    });
    
    // 重新排序代理列表
    this.proxies = proxyResults.map(result => result.proxy);
    logger.info("代理测试完成，已按速度排序");
  }

  /**
   * 处理所有账户
   * @param {boolean} dailyCheckInOnly - 是否仅执行每日签到
   */
  async processAllAccounts(dailyCheckInOnly = false) {
    logger.info(`开始处理 ${this.accounts.length} 个账户`);
    
    for (let i = 0; i < this.accounts.length; i++) {
      const accountId = i + 1;
      const cookie = this.accounts[i];
      const proxy = i < this.proxies.length ? this.proxies[i] : null;
      
      logger.info(`开始处理账号 ${accountId} 的任务`);
      await this.processAccount(cookie, proxy, accountId, dailyCheckInOnly);
      
      // 账户之间添加短暂延迟
      if (i < this.accounts.length - 1) {
        await delay(DELAYS.BETWEEN_ACCOUNTS);
      }
    }
    
    logger.success("所有账户处理完成");
  }

  // 处理单个账户
  async processAccount(cookie, proxy, accountId, dailyCheckInOnly) {
    // 设置代理
    let agent = null;
    if (proxy) {
      try {
        agent = new HttpsProxyAgent(proxy);
      } catch (error) {
        logger.error(`代理设置失败: ${error.message}`, accountId);
      }
    }
    
    // 执行每日签到
    const dailyCheckInResult = await beamableApi.dailyCheckIn(cookie, agent, accountId);
    
    // 如果只需要每日签到，则结束
    if (dailyCheckInOnly) {
      return;
    }
    
    // 处理所有任务
    await this.processAllTasks(cookie, agent, accountId);
  }

  // 处理所有任务
  async processAllTasks(cookie, agent, accountId) {
    try {
      // 1. 处理常规任务
      await this.processRegularQuests(cookie, agent, accountId);
      
      // 2. 处理新任务
      await this.processNewQuests(cookie, agent, accountId);
      
      // 3. 等待一段时间后完成任务
      logger.info(`等待领取任务奖励...`, accountId);
      await delay(DELAYS.BEFORE_COMPLETE);
      
      // 4. 完成所有任务
      await this.completeAllQuests(cookie, agent, accountId);
    } catch (error) {
      logger.error(`处理任务失败: ${error.message}`, accountId);
    }
  }

  // 处理常规任务
  async processRegularQuests(cookie, agent, accountId) {
    const questIds = taskManager.getAllQuestIds();
    if (questIds.length === 0) {
      logger.info(`没有常规任务需要处理`, accountId);
      return;
    }
    
    for (const questId of questIds) {
      try {
        const questInfo = taskManager.getQuestInfo(questId);
        const questBody = taskManager.generateClickQuestBody(questId);
        
        // 传递任务名称给API，以便简化日志
        await beamableApi.clickQuest(questId, cookie, agent, questBody, accountId, questInfo.questName);
        await delay(DELAYS.BETWEEN_TASKS);
      } catch (error) {
        // 错误日志已在API模块处理
      }
    }
  }

  // 处理新任务
  async processNewQuests(cookie, agent, accountId) {
    const newQuests = await taskManager.checkNewQuests();
    if (newQuests.length === 0) return;
    
    for (const quest of newQuests) {
      try {
        const [questId, body] = quest.split('||');
        await beamableApi.clickQuest(questId, cookie, agent, body, accountId, `新任务-${questId}`);
        await delay(DELAYS.BETWEEN_TASKS);
      } catch (error) {
        // 错误日志已在API模块处理
      }
    }
  }

  // 完成所有任务
  async completeAllQuests(cookie, agent, accountId) {
    // 1. 完成常规任务
    const questIds = taskManager.getAllQuestIds();
    if (questIds.length > 0) {
      for (const questId of questIds) {
        try {
          const questInfo = taskManager.getQuestInfo(questId);
          const questBody = taskManager.generateCompleteQuestBody(questId);
          
          // 传递任务名称给API，以便简化日志
          await beamableApi.completeQuest(questId, cookie, agent, questBody, accountId, questInfo.questName);
          await delay(DELAYS.BETWEEN_TASKS);
        } catch (error) {
          // 错误日志已在API模块处理
        }
      }
    }
    
    // 2. 完成新任务
    await this.completeNewQuests(cookie, agent, accountId);
  }

  // 完成新任务
  async completeNewQuests(cookie, agent, accountId) {
    const newCompleteQuests = await taskManager.checkNewCompleteQuests();
    if (newCompleteQuests.length === 0) return;
    
    for (const quest of newCompleteQuests) {
      try {
        const [questId, body] = quest.split('||');
        await beamableApi.completeQuest(questId, cookie, agent, body, accountId, `新任务-${questId}`);
        await delay(DELAYS.BETWEEN_TASKS);
      } catch (error) {
        // 错误日志已在API模块处理
      }
    }
  }
}

// 创建单例实例
const accountManager = new AccountManager();

export default accountManager; 