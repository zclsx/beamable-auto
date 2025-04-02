import logger from "./utils/logger.js";
import accountManager from "./modules/accountManager.js";
import { delay } from "./utils/helpers.js";
import { DELAYS } from "./config/constants.js";

/**
 * 程序主函数
 * @param {Object} options - 配置选项
 * @param {boolean} options.dailyCheckInOnly - 是否只执行每日签到
 * @param {boolean} options.testProxies - 是否测试代理
 * @param {boolean} options.loop - 是否循环执行
 */
async function main(options = {}) {
  const { dailyCheckInOnly = false, testProxies = true, loop = true } = options;
  
  try {
    logger.info("Beamable 自动化工具启动");
    logger.info(`模式: ${dailyCheckInOnly ? "仅签到" : "完整任务"}`);
    
    // 初始化账户管理器
    const initResult = await accountManager.initialize(dailyCheckInOnly);
    if (!initResult) {
      logger.error("初始化失败，程序退出");
      return;
    }
    
    // 测试代理
    if (testProxies && accountManager.proxies.length > 0) {
      await accountManager.testProxies();
    }
    
    do {
      // 处理所有账户
      await accountManager.processAllAccounts(dailyCheckInOnly);
      
      if (loop) {
        const waitTime = DELAYS.DAILY_LOOP / 1000 / 60 / 60;
        logger.info(`任务完成，将在 ${waitTime.toFixed(1)} 小时后再次执行`);
        await delay(DELAYS.DAILY_LOOP);
      }
    } while (loop);
    
    logger.success("程序执行完毕");
  } catch (error) {
    logger.error(`程序执行错误: ${error.message}`);
    logger.error(error.stack);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dailyCheckInOnly: args.includes("--daily-only"),
    testProxies: !args.includes("--no-proxy-test"),
    loop: !args.includes("--no-loop")
  };
  
  return options;
}

// 启动程序
main(parseArgs());

// 处理进程信号
process.on("SIGINT", () => {
  logger.info("接收到中断信号，正在退出...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  logger.error(`未捕获的异常: ${error.message}`);
  logger.error(error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`未处理的Promise拒绝: ${reason}`);
}); 