import { HttpsProxyAgent } from "https-proxy-agent";
import logger from "../utils/logger.js";
import beamableApi from "../api/beamableApi.js";
import { delay } from "../utils/helpers.js";
import { QUEST_RESOURCES, DELAYS, GIST_URLS, QUEST_TYPES } from "../config/constants.js";
import { PREDEFINED_QUESTS } from "../config/questData.js";
import fetch from 'node-fetch';

/**
 * 任务管理类
 * 处理所有任务相关的逻辑
 */
class TaskManager {
  constructor() {
    this.completedQuests = new Set();
    this.taskQueue = [];
    this.questRegistry = new Map();  // 存储所有任务的注册表
    this.initializeQuests();
  }

  /**
   * 初始化任务管理器
   */
  async initialize() {
    try {
      // 获取已完成任务列表
      const completedQuestsData = await beamableApi.checkRemoteQuests(GIST_URLS.COMPLETED_QUESTS);
      this.completedQuests = new Set(completedQuestsData);
      logger.info(`已加载${this.completedQuests.size}个已完成任务`);
      
      // 获取新任务列表
      await this.loadNewTasks();
    } catch (error) {
      logger.error(`任务管理器初始化失败: ${error.message}`);
    }
  }

  /**
   * 加载新任务
   */
  async loadNewTasks() {
    try {
      const newQuestsData = await beamableApi.checkRemoteQuests(GIST_URLS.NEW_QUESTS);
      
      if (newQuestsData.length > 0) {
        logger.info(`发现${newQuestsData.length}个新任务`);
        // 添加到任务队列
        newQuestsData.forEach(questId => {
          if (!this.completedQuests.has(questId)) {
            this.taskQueue.push(questId);
          }
        });
      }
      
      // 如果任务队列为空，添加预定义任务
      if (this.taskQueue.length === 0) {
        this.loadPredefinedTasks();
      }
    } catch (error) {
      logger.error(`加载新任务失败: ${error.message}`);
      // 如果远程任务加载失败，加载预定义任务
      this.loadPredefinedTasks();
    }
  }

  /**
   * 加载预定义任务
   */
  loadPredefinedTasks() {
    PREDEFINED_QUESTS.forEach(quest => {
      if (!this.completedQuests.has(quest.id)) {
        this.taskQueue.push(quest.id);
      }
    });
    logger.info(`已加载${this.taskQueue.length}个预定义任务`);
  }

  /**
   * 处理单个账号的所有任务
   * @param {string} cookie - Cookie字符串
   * @param {string} proxy - 代理地址
   * @param {number} accountId - 账号ID
   */
  async processAccountTasks(cookie, proxy, accountId) {
    try {
      logger.info(`开始处理账号 ${accountId} 的任务`);
      
      // 设置代理
      const agent = proxy ? new HttpsProxyAgent(proxy) : null;
      
      // 执行每日签到
      await beamableApi.dailyCheckIn(cookie, agent, accountId);
      
      // 处理所有任务
      for (const questId of this.taskQueue) {
        if (this.completedQuests.has(questId)) {
          logger.info(`任务 ${questId} 已完成，跳过`, accountId);
          continue;
        }
        
        await this.processTask(questId, cookie, agent, accountId);
        
        // 任务间延迟
        await delay(DELAYS.BETWEEN_TASKS);
      }
      
      logger.success(`账号 ${accountId} 的所有任务处理完成`);
    } catch (error) {
      logger.error(`处理账号 ${accountId} 任务时出错: ${error.message}`);
    }
  }

  /**
   * 处理单个任务
   * @param {string} questId - 任务ID
   * @param {string} cookie - Cookie字符串
   * @param {Object} agent - 代理代理
   * @param {number} accountId - 账号ID
   */
  async processTask(questId, cookie, agent, accountId) {
    try {
      logger.info(`开始处理任务 ${questId}`, accountId);
      
      // 构建任务请求体
      const questBody = this.buildQuestBody(questId, QUEST_TYPES.CLICK_LINK);
      
      // 点击任务
      const clickResult = await beamableApi.clickQuest(questId, cookie, agent, questBody, accountId);
      if (!clickResult) {
        logger.warn(`点击任务 ${questId} 失败，跳过`, accountId);
        return;
      }
      
      // 模拟任务完成耗时
      await delay(DELAYS.TASK_COMPLETION);
      
      // 完成任务
      const completeResult = await beamableApi.completeQuest(questId, cookie, agent, questBody, accountId);
      if (completeResult) {
        logger.success(`任务 ${questId} 完成 +${QUEST_RESOURCES.POINTS} 积分`, accountId);
        this.completedQuests.add(questId);
      } else {
        logger.warn(`完成任务 ${questId} 失败`, accountId);
      }
    } catch (error) {
      logger.error(`处理任务 ${questId} 时出错: ${error.message}`, accountId);
    }
  }

  /**
   * 构建任务请求体
   * @param {string} questId - 任务ID
   * @param {string} questType - 任务类型
   * @returns {string} - 请求体
   */
  buildQuestBody(questId, questType) {
    return JSON.stringify([
      QUEST_RESOURCES.ID,
      questId,
      questType,
    ]);
  }

  // 初始化所有任务
  initializeQuests() {
    // 从预定义任务数据导入
    PREDEFINED_QUESTS.forEach(quest => {
      this.registerQuest(quest.id, {
        questName: quest.questName,
        link: quest.link
      });
    });
  }

  // 注册新任务
  registerQuest(questId, questInfo) {
    this.questRegistry.set(questId, {
      ...questInfo,
      questId,
      resourceId: 4543, // 所有任务共享相同的resourceId
      projectId: 80, // 所有任务共享相同的projectId
      pointsReward: 500 // 所有任务共享相同的奖励点数
    });
  }

  // 获取任务信息
  getQuestInfo(questId) {
    return this.questRegistry.get(questId);
  }

  // 获取所有任务ID
  getAllQuestIds() {
    return Array.from(this.questRegistry.keys());
  }

  // 生成点击任务的请求体
  generateClickQuestBody(questId) {
    const quest = this.getQuestInfo(questId);
    if (!quest) {
      throw new Error(`任务ID ${questId} 不存在`);
    }

    return `[{"questId":${questId},"rewards":[{"resource":{"resourceId":${quest.resourceId},"projectId":${quest.projectId},"name":"Points","imageUrl":"https://cdn.harbor.gg/project/80/eee511fd8300e15e2997d773e8fba93c4d495516b64b58b181c202d3a02eef3d.png","description":"","longDescription":"","createdAt":"^$D2024-12-12T03:31:24.000Z"},"amount":${quest.pointsReward}}],"questCompleted":false,"rewardClaimed":false,"questType":"ClickLink","questTypeName":"ClickLink","questName":"${quest.questName}","progress":1,"affirmType":{"questId":${questId},"affirm":"NonAffirmative"},"requires":0,"additional":{"questId":${questId},"link":"${quest.link}"},"showDescription":false,"description":"ex. 'This quest is for x and y'","claimBehaviour":"ClaimThroughDetailsPage","detailsBehaviour":"DetailsPage","needsDetailsPage":true},1614,"questsold",true,false]`;
  }

  // 生成完成任务的请求体
  generateCompleteQuestBody(questId) {
    const quest = this.getQuestInfo(questId);
    if (!quest) {
      throw new Error(`任务ID ${questId} 不存在`);
    }

    return `[{"questId":${questId},"rewards":[{"resource":{"resourceId":${quest.resourceId},"projectId":${quest.projectId},"name":"Points","imageUrl":"https://cdn.harbor.gg/project/80/eee511fd8300e15e2997d773e8fba93c4d495516b64b58b181c202d3a02eef3d.png","description":"","longDescription":"","createdAt":"^$D2024-12-12T03:31:24.000Z"},"amount":${quest.pointsReward}}],"questCompleted":true,"rewardClaimed":false,"questType":"ClickLink","questTypeName":"ClickLink","questName":"${quest.questName}","progress":2,"affirmType":{"questId":${questId},"affirm":"NonAffirmative"},"requires":0,"additional":{"questId":${questId},"link":"${quest.link}"},"showDescription":false,"description":"ex. 'This quest is for x and y'","claimBehaviour":"ClaimThroughDetailsPage","detailsBehaviour":"DetailsPage","needsDetailsPage":true},{"modulePath":"questsold"},false]`;
  }

  // 检查新任务
  async checkNewQuests() {
    try {
      const response = await fetch(GIST_URLS.NEW_QUESTS, {
        method: "GET",
      });
      
      const res = await response.text();
      if (!res || res === 'none') {
        logger.info("没有新任务");
        return [];
      }
      
      const quests = res.trim().split('\n').map(quest => quest.trim());
      logger.info(`发现 ${quests.length} 个新任务`);
      return quests;
    } catch (error) {
      logger.error(`检查新任务失败`);
      return [];
    }
  }

  // 检查新的完成任务
  async checkNewCompleteQuests() {
    try {
      const response = await fetch(GIST_URLS.COMPLETE_QUESTS, {
        method: "GET",
      });
      
      const res = await response.text();
      if (!res || res === 'none') {
        return [];
      }
      
      const quests = res.trim().split('\n').map(quest => quest.trim());
      logger.info(`发现 ${quests.length} 个新的完成任务`);
      return quests;
    } catch (error) {
      logger.error(`检查新的完成任务失败`);
      return [];
    }
  }
}

// 创建单例实例
const taskManager = new TaskManager();

export default taskManager; 