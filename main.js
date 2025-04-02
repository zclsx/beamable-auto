import fs from "fs/promises";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import chalk from "chalk";
import readline from 'readline/promises';

// ===========================================
// 日志系统优化
// ===========================================
class Logger {
  constructor() {
    this.colors = {
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
    success: chalk.green,
    debug: chalk.magenta,
  };
  }

  log(message, level = "info", accountId = null) {
    const now = new Date().toISOString();
    const color = this.colors[level] || chalk.white;
    const accountInfo = accountId ? `[Account ${accountId}] ` : '';
    console.log(color(`[${now}] [${level.toUpperCase()}]: ${accountInfo}${message}`));
  }

  info(message, accountId = null) {
    this.log(message, "info", accountId);
  }

  warn(message, accountId = null) {
    this.log(message, "warn", accountId);
  }

  error(message, accountId = null) {
    this.log(message, "error", accountId);
  }

  success(message, accountId = null) {
    this.log(message, "success", accountId);
  }

  debug(message, accountId = null) {
    this.log(message, "debug", accountId);
  }
}

const logger = new Logger();

// ===========================================
// HTTP请求头和工具函数
// ===========================================
const DEFAULT_HEADERS = {
  "accept": "text/x-component",
  "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
  "cache-control": "no-cache",
  "content-type": "text/plain;charset=UTF-8",
  "next-router-state-tree": "%5B%22%22%2C%7B%22children%22%3A%5B%22modules%22%2C%7B%22children%22%3A%5B%5B%22moduleIdOrPath%22%2C%22questsold%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%5B%22moduleNestedId1%22%2C%227129%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
  "origin": "https://hub.beamable.network",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "referer": "https://hub.beamable.network/modules/questsold/7129",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
};

// 文件读取函数
async function readFiles() {
  try {
  const proxyStr = await fs.readFile("proxies.txt", "utf-8");
  const proxies = proxyStr.trim().split("\n").map(proxy => proxy.trim());
  const cookieData = await fs.readFile("cookies.txt", "utf-8");
  const cookies = cookieData.trim().split("\n").map(cookie => cookie.trim());
  return { proxies, cookies };
    } catch (error) {
    logger.error(`文件读取错误: ${error.message}`);
    return { proxies: [], cookies: [] };
  }
}

// 代理测试函数
async function checkProxySpeed(agent) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const testUrl = "https://icanhazip.com/";
  
  try {
    const response = await fetch(testUrl, {
        agent,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsedTime = Date.now() - startTime;
    return {
      status: 'success',
      time: elapsedTime,
      statusCode: response.status,
    };
    } catch (error) {
    return {
      status: 'error',
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// 任务管理模块
// ===========================================
class QuestManager {
  constructor() {
    this.questRegistry = new Map();  // 存储所有任务的注册表
    this.initializeQuests();
  }

  // 初始化所有任务
  initializeQuests() {
    this.registerQuest("7129", {
      questName: "Retweet, Like and Comment - GDC Schedule",
      link: "https://x.com/BeamableNetwork/status/1901989668947960223"
    });

    this.registerQuest("7117", {
      questName: "Retweet, Like and Comment - GDC is Here!",
      link: "https://x.com/Beamable/status/1901677776819917239"
    });

    this.registerQuest("7081", {
      questName: "Retweet, Like & Comment - Founder Introduction",
      link: "https://x.com/jradoff/status/1900616630041817119"
    });

    this.registerQuest("7075", {
      questName: "Retweet, Like and Comment - Evolution of Creator Economies",
      link: "https://x.com/Beamablenetwork/status/1900532368693416167"
    });

    this.registerQuest("7069", {
      questName: "Retweet, Like & Comment - First peek at Ninja Frog Gameplay",
      link: "https://x.com/PlayPudgyParty/status/1900215815191859469"
    });

    this.registerQuest("6975", {
      questName: "Retweet, Like and Comment - See you soon WolvesDEN",
      link: "https://x.com/Beamablenetwork/status/1900328521840443409"
    });

    this.registerQuest("6973", {
      questName: "Retweet, Like & Comment - Beamable and WolvesDAO at GDC",
      link: "https://x.com/Beamable/status/1900284795763974309"
    });

    this.registerQuest("6956", {
      questName: "Retweet, Like & Comment - Is This A Good Offer?",
      link: "https://x.com/Beamablenetwork/status/1899928563752853638"
    });

    this.registerQuest("6969", {
      questName: "Retweet, Like & Comment - Beamable Hub",
      link: "https://x.com/Beamable/status/1900230776051908677"
    });

    this.registerQuest("6955", {
      questName: "Retweet, Like & Comment - Web3 Game Development Livestream",
      link: "https://x.com/jradoff/status/1899807546766213581"
    });

    this.registerQuest("6948", {
      questName: "Retweet, Like and Comment on our sponsorship post from WolvesDAO!",
      link: "https://x.com/WolvesDAO/status/1899844715610353923"
    });

    this.registerQuest("6933", {
      questName: "Retweet, Like and Comment our latest tweet on Beamable Network",
      link: "https://x.com/Beamablenetwork/status/1899591317627494836"
    });

    this.registerQuest("6904", {
      questName: "Retweet, Like and Comment on our First Tweet on Beamable Network",
      link: "https://x.com/Beamablenetwork/status/1899226126352093354"
    });

    this.registerQuest("6866", {
      questName: "Retweet, Like and Comment on our GDC Founders & Investors Brunch Tweet",
      link: "https://x.com/Beamable/status/1899175498913128509"
    });

    this.registerQuest("6840", {
      questName: "Retweet, Like & Comment on our Dashboard Tweet",
      link: "https://x.com/Beamable/status/1897692463931740500"
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
      const response = await fetch(`https://gist.githubusercontent.com/hthodev/d34feb751b2314dd8abdfa4f1b2b60a4/raw/beamable_quest.txt`, {
        method: "GET",
      });
      logger.info("检查是否有新任务...");
  
      const res = await response.text();
      if (!res || res === 'none') {
        logger.info("没有新任务");
        return [];
      }
  
      const quests = res.trim().split('\n').map(quest => quest.trim());
      logger.info(`发现 ${quests.length} 个新任务`);
      return quests;
    } catch (error) {
      logger.error(`检查新任务失败: ${error.message}`);
      return [];
    }
  }

  // 检查新的完成任务
  async checkNewCompleteQuests() {
    try {
      const response = await fetch(`https://gist.githubusercontent.com/hthodev/ce040c0cb8cc5a3e0a01b47556237225/raw/beamable_complete_quest.txt`, {
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
      logger.error(`检查新的完成任务失败: ${error.message}`);
      return [];
    }
  }
}
// ===========================================
// API请求模块
// ===========================================
class BeamableAPI {
  constructor() {
    this.baseUrl = 'https://hub.beamable.network';
    this.headers = { ...DEFAULT_HEADERS };
  }

  // 构建请求头
  buildHeaders(cookie, action) {
    return {
      ...this.headers,
      Cookie: cookie,
      "next-action": action
    };
  }

  // 发送请求
  async sendRequest(url, method, headers, body, agent, accountId) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        agent,
        body
      });
      return response;
    } catch (error) {
      logger.error(`请求失败: ${error.message}`, accountId);
      throw error;
    }
  }

  // 点击任务
  async clickQuest(questId, cookie, agent, questBody, accountId) {
    try {
      const url = `${this.baseUrl}/modules/questsold/${questId}`;
      const headers = this.buildHeaders(cookie, "eef77ac1785cc4d8ca64fb769a7cc5e0bc594592");
      
      await this.sendRequest(url, 'POST', headers, questBody, agent, accountId);
      return true;
    } catch (error) {
      logger.error(`点击任务 ${questId} 失败: ${error.message}`, accountId);
      return false;
    }
  }

  // 完成任务
  async completeQuest(questId, cookie, agent, questBody, accountId) {
    try {
      const url = `${this.baseUrl}/modules/questsold/${questId}`;
      const headers = this.buildHeaders(cookie, "bbbd8d0791d8eb36a310384fa0d2b41763f342ed");
      
      await this.sendRequest(url, 'POST', headers, questBody, agent, accountId);
      return true;
    } catch (error) {
      logger.error(`完成任务 ${questId} 失败: ${error.message}`, accountId);
      return false;
    }
  }

  // 每日签到
  async dailyCheckIn(cookie, agent, accountId) {
    try {
      const url = `${this.baseUrl}/modules/dailycheckin`;
      const headers = this.buildHeaders(cookie, "d93df389f759877e49b020b7ff454db350580fc7");
      
      await this.sendRequest(url, 'POST', headers, `[346,"dailycheckin"]`, agent, accountId);
      logger.success(`每日签到成功`, accountId);
      return true;
    } catch (error) {
      logger.error(`每日签到失败: ${error.message}`, accountId);
      return false;
    }
  }
}

// ===========================================
// 账号管理模块
// ===========================================
class AccountManager {
  constructor(questManager, api) {
    this.questManager = questManager;
    this.api = api;
  }

  // 处理单个账号
  async processAccount(cookie, proxy, accountId) {
    logger.info(`开始处理账号 ${accountId}`, accountId);
    
    // 设置代理
    let agent = null;
    if (proxy) {
      try {
        agent = new HttpsProxyAgent(proxy);
        logger.info(`正在检查代理 ${proxy}`, accountId);
        const proxyStatus = await checkProxySpeed(agent);
        if (proxyStatus.status === 'success') {
          logger.info(`代理连接成功: ${proxy} - 速度: ${proxyStatus.time}ms - 状态: ${proxyStatus.statusCode}`, accountId);
        } else {
          logger.warn(`代理连接失败: ${proxy} - 错误: ${proxyStatus.error}`, accountId);
        }
    } catch (error) {
        logger.error(`代理设置失败: ${error.message}`, accountId);
      }
    }

    return { cookie, agent, accountId };
  }

  // 处理所有任务
  async processAllTasks(accountInfo, doTasks = true) {
    const { cookie, agent, accountId } = accountInfo;
    
    if (doTasks) {
      // 1. 处理常规任务
      await this.processRegularQuests(cookie, agent, accountId);
      
      // 2. 检查并处理新任务
      await this.processNewQuests(cookie, agent, accountId);
      
      // 3. 等待一段时间后完成任务
      logger.warn(`等待10秒钟后开始领取奖励...`, accountId);
      await delay(10000);
      
      // 4. 完成所有任务
      await this.completeAllQuests(cookie, agent, accountId);
    }
    
    // 5. 每日签到
    await this.api.dailyCheckIn(cookie, agent, accountId);
  }

  // 处理常规任务
  async processRegularQuests(cookie, agent, accountId) {
    const questIds = this.questManager.getAllQuestIds();
    logger.info(`开始处理 ${questIds.length} 个常规任务`, accountId);
    
    for (const questId of questIds) {
      try {
        const questInfo = this.questManager.getQuestInfo(questId);
        const questBody = this.questManager.generateClickQuestBody(questId);
        
        const success = await this.api.clickQuest(questId, cookie, agent, questBody, accountId);
        if (success) {
          logger.info(`已点击任务: ${questInfo.questName}`, accountId);
        }
        
        // 在请求之间添加短暂延迟，避免被检测为机器人
        await delay(500);
    } catch (error) {
        logger.error(`处理任务 ${questId} 时出错: ${error.message}`, accountId);
      }
    }
  }

  // 处理新任务
  async processNewQuests(cookie, agent, accountId) {
    const newQuests = await this.questManager.checkNewQuests();
    if (newQuests.length === 0) return;
    
    logger.info(`开始处理 ${newQuests.length} 个新任务`, accountId);
    
    for (const quest of newQuests) {
      try {
        const [questId, body] = quest.split('||');
        const success = await this.api.clickQuest(questId, cookie, agent, body, accountId);
        if (success) {
          logger.info(`已点击新任务: ${questId}`, accountId);
        }
        
        await delay(500);
    } catch (error) {
        logger.error(`处理新任务时出错: ${error.message}`, accountId);
      }
    }
  }

  // 完成所有任务
  async completeAllQuests(cookie, agent, accountId) {
    // 1. 完成常规任务
    const questIds = this.questManager.getAllQuestIds();
    logger.info(`开始完成 ${questIds.length} 个常规任务`, accountId);
    
    for (const questId of questIds) {
      try {
        const questInfo = this.questManager.getQuestInfo(questId);
        const questBody = this.questManager.generateCompleteQuestBody(questId);
        
        const success = await this.api.completeQuest(questId, cookie, agent, questBody, accountId);
        if (success) {
          logger.success(`已完成任务: ${questInfo.questName}`, accountId);
        }
        
        await delay(500);
      } catch (error) {
        logger.error(`完成任务 ${questId} 时出错: ${error.message}`, accountId);
      }
    }
    
    // 2. 检查并完成新任务
    await this.completeNewQuests(cookie, agent, accountId);
  }

  // 完成新任务
  async completeNewQuests(cookie, agent, accountId) {
    const newCompleteQuests = await this.questManager.checkNewCompleteQuests();
    if (newCompleteQuests.length === 0) return;
    
    logger.info(`开始完成 ${newCompleteQuests.length} 个新任务`, accountId);
    
    for (const quest of newCompleteQuests) {
      try {
        const [questId, body] = quest.split('||');
        const success = await this.api.completeQuest(questId, cookie, agent, body, accountId);
        if (success) {
          logger.success(`已完成新任务: ${questId}`, accountId);
        }
        
        await delay(500);
  } catch (error) {
        logger.error(`完成新任务时出错: ${error.message}`, accountId);
      }
    }
  }
}
// ===========================================
// 主程序入口
// ===========================================
async function main() {
  try {
    // 初始化组件
    const questManager = new QuestManager();
    const api = new BeamableAPI();
    const accountManager = new AccountManager(questManager, api);
    
    // 创建用户交互界面
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    // 打印欢迎信息
    console.log(chalk.cyan("========================================================"));
    console.log(chalk.cyan("      TOOL ĐƯỢC PHÁT TRIỂN BỞI: THIEN THO TRAN         "));
    console.log(chalk.cyan("Tham gia group facebook để nhận tool mới:"));
    console.log(chalk.cyan("https://www.facebook.com/groups/2072702003172443/"));
    console.log(chalk.cyan("========================================================"));
    
    // 获取用户操作选择
    const doTask = await rl.question('Bạn có muốn làm task không, hay chỉ daily mỗi ngày? (y/n): ');
    rl.close();
    
    logger.info(`用户选择: ${doTask === 'y' ? '执行所有任务' : '仅每日签到'}`);
    
    // 主循环
  while (true) {
      try {
        // 读取配置文件
    const { proxies, cookies } = await readFiles();

        if (cookies.length === 0) {
          logger.error("未找到账号信息，请检查cookies.txt文件");
          break;
        }
        
        logger.info(`读取到 ${cookies.length} 个账号，${proxies.length} 个代理`);
        
        // 处理每个账号
    for (let i = 0; i < cookies.length; i++) {
          const accountId = i + 1;
          const cookie = cookies[i];
          const proxy = i < proxies.length ? proxies[i] : null;
          
          // 处理账号
          const accountInfo = await accountManager.processAccount(cookie, proxy, accountId);
          
          // 处理所有任务
          await accountManager.processAllTasks(accountInfo, doTask === 'y');
          
          // 账号之间添加短暂延迟
          if (i < cookies.length - 1) {
            logger.info(`等待5秒钟后处理下一个账号...`, accountId);
            await delay(5000);
          }
        }
        
        // 等待24小时后再次执行
        logger.warn("所有账号处理完毕，等待24小时后再次执行");
        await delay(24 * 60 * 60 * 1000);
      } catch (error) {
        logger.error(`主循环发生错误: ${error.message}`);
        // 出错后等待1小时再次尝试
        logger.warn("等待1小时后重试...");
        await delay(60 * 60 * 1000);
      }
    }
  } catch (error) {
    logger.error(`程序初始化失败: ${error.message}`);
  }
}

// 启动程序
main();
