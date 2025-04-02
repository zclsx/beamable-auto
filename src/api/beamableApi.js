import fetch from "node-fetch";
import logger from "../utils/logger.js";
import { DEFAULT_HEADERS, API_ENDPOINTS, API_ACTIONS } from "../config/constants.js";

/**
 * Beamable API 请求类
 * 封装所有与Beamable服务器的通信
 */
class BeamableAPI {
  constructor() {
    this.baseUrl = API_ENDPOINTS.BASE_URL;
    this.headers = { ...DEFAULT_HEADERS };
  }

  /**
   * 构建请求头
   * @param {string} cookie - Cookie字符串
   * @param {string} action - API操作标识
   * @returns {Object} 构建好的请求头
   */
  buildHeaders(cookie, action) {
    return {
      ...this.headers,
      Cookie: cookie,
      "next-action": action
    };
  }

  /**
   * 发送请求
   * @param {string} url - 请求URL
   * @param {string} method - 请求方法
   * @param {Object} headers - 请求头
   * @param {string} body - 请求体
   * @param {Object} agent - 代理代理
   * @param {number} accountId - 账号ID
   * @returns {Promise<Response>} - 响应对象
   */
  async sendRequest(url, method, headers, body, agent, accountId) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        agent,
        body
      });
      
      // 简化日志，不显示响应内容
      if (response.ok) {
        return response;
      } else {
        throw new Error(`HTTP错误: ${response.status}`);
      }
    } catch (error) {
      logger.error(`请求失败: ${error.message}`, accountId);
      throw error;
    }
  }

  /**
   * 点击任务
   * @param {string} questId - 任务ID
   * @param {string} cookie - Cookie字符串
   * @param {Object} agent - 代理代理
   * @param {string} questBody - 请求体
   * @param {number} accountId - 账号ID
   * @param {string} questName - 任务名称
   * @returns {Promise<boolean>} - 是否成功
   */
  async clickQuest(questId, cookie, agent, questBody, accountId, questName) {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.QUESTS}/${questId}`;
      const headers = this.buildHeaders(cookie, API_ACTIONS.CLICK_QUEST);
      
      await this.sendRequest(url, 'POST', headers, questBody, agent, accountId);
      // 只输出简化的任务名称，不输出请求数据
      logger.info(`已点击任务: ${questName || questId}`, accountId);
      return true;
    } catch (error) {
      logger.error(`点击任务失败: ${questName || questId}`, accountId);
      return false;
    }
  }

  /**
   * 完成任务
   * @param {string} questId - 任务ID
   * @param {string} cookie - Cookie字符串
   * @param {Object} agent - 代理代理
   * @param {string} questBody - 请求体
   * @param {number} accountId - 账号ID
   * @param {string} questName - 任务名称
   * @returns {Promise<boolean>} - 是否成功
   */
  async completeQuest(questId, cookie, agent, questBody, accountId, questName) {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.QUESTS}/${questId}`;
      const headers = this.buildHeaders(cookie, API_ACTIONS.COMPLETE_QUEST);
      
      await this.sendRequest(url, 'POST', headers, questBody, agent, accountId);
      // 只输出简化的任务名称，不输出请求数据
      logger.success(`已完成任务: ${questName || questId}`, accountId);
      return true;
    } catch (error) {
      logger.error(`完成任务失败: ${questName || questId}`, accountId);
      return false;
    }
  }

  /**
   * 每日签到
   * @param {string} cookie - Cookie字符串
   * @param {Object} agent - 代理代理
   * @param {number} accountId - 账号ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async dailyCheckIn(cookie, agent, accountId) {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.DAILY_CHECK_IN}`;
      const headers = this.buildHeaders(cookie, API_ACTIONS.DAILY_CHECK_IN);
      
      await this.sendRequest(url, 'POST', headers, `[346,"dailycheckin"]`, agent, accountId);
      logger.success(`每日签到成功`, accountId);
      return true;
    } catch (error) {
      logger.error(`每日签到失败`, accountId);
      return false;
    }
  }

  /**
   * 检查新任务
   * @param {string} gistUrl - GitHub Gist URL
   * @returns {Promise<Array>} - 任务数组
   */
  async checkRemoteQuests(gistUrl) {
    try {
      const response = await fetch(gistUrl, {
        method: "GET",
      });
      
      const res = await response.text();
      if (!res || res === 'none') {
        return [];
      }
      
      return res.trim().split('\n').map(quest => quest.trim());
    } catch (error) {
      logger.error(`检查远程任务失败: ${error.message}`);
      return [];
    }
  }
}

// 创建单例实例
const beamableApi = new BeamableAPI();

export default beamableApi; 