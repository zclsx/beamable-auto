import chalk from "chalk";

/**
 * 日志系统类，提供不同级别的日志记录功能
 */
class Logger {
  constructor() {
    this.colors = {
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
      success: chalk.green,
      debug: chalk.magenta,
    };
    
    this.showTime = true;      // 是否显示时间
    this.showFullTime = false; // 是否显示完整时间戳
    this.showLevel = true;     // 是否显示日志级别
  }

  // 简化的时间格式
  getTimeString() {
    if (!this.showTime) return '';
    
    const now = new Date();
    
    if (this.showFullTime) {
      return `[${now.toISOString()}] `;
    } else {
      // 仅显示时:分:秒
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      return `[${hours}:${minutes}:${seconds}] `;
    }
  }

  /**
   * 通用日志方法
   * @param {string} message - 日志消息
   * @param {string} level - 日志级别
   * @param {number|null} accountId - 账号ID，多账号情况下使用
   */
  log(message, level = "info", accountId = null) {
    const timeStr = this.getTimeString();
    const levelStr = this.showLevel ? `[${level.toUpperCase()}] ` : '';
    const accountInfo = accountId ? `[账号${accountId}] ` : '';
    const color = this.colors[level] || chalk.white;
    
    console.log(color(`${timeStr}${levelStr}${accountInfo}${message}`));
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

// 创建单例实例
const logger = new Logger();

export default logger; 