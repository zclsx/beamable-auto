import fs from "fs/promises";
import fetch from "node-fetch";
import logger from "./logger.js";

/**
 * 读取代理和Cookie文件
 * @returns {Promise<{proxies: string[], cookies: string[]}>} 代理和Cookie数组
 */
export async function readFiles() {
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

/**
 * 测试代理速度和状态
 * @param {Object} agent - 代理代理实例
 * @returns {Promise<Object>} 测试结果
 */
export async function checkProxySpeed(agent) {
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

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 