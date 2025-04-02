/**
 * HTTP请求头
 */
export const DEFAULT_HEADERS = {
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

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  BASE_URL: 'https://hub.beamable.network',
  QUESTS: '/modules/questsold',
  DAILY_CHECK_IN: '/modules/dailycheckin'
};

/**
 * API 操作标识
 */
export const API_ACTIONS = {
  CLICK_QUEST: "eef77ac1785cc4d8ca64fb769a7cc5e0bc594592",
  COMPLETE_QUEST: "bbbd8d0791d8eb36a310384fa0d2b41763f342ed",
  DAILY_CHECK_IN: "d93df389f759877e49b020b7ff454db350580fc7"
};

/**
 * 任务资源信息
 */
export const QUEST_RESOURCES = {
  RESOURCE_ID: 4543,
  PROJECT_ID: 80,
  POINTS_REWARD: 500
};

/**
 * GitHub Gist配置
 */
export const GIST_URLS = {
  NEW_QUESTS: "https://gist.githubusercontent.com/hthodev/d34feb751b2314dd8abdfa4f1b2b60a4/raw/beamable_quest.txt",
  COMPLETE_QUESTS: "https://gist.githubusercontent.com/hthodev/ce040c0cb8cc5a3e0a01b47556237225/raw/beamable_complete_quest.txt"
};

/**
 * 延迟时间配置(毫秒)
 */
export const DELAYS = {
  BETWEEN_REQUESTS: 500,
  BEFORE_CLAIM: 10000,
  BETWEEN_ACCOUNTS: 5000,
  DAILY_REPEAT: 24 * 60 * 60 * 1000,
  ERROR_RETRY: 60 * 60 * 1000
};

/**
 * 任务类型
 */
export const QUEST_TYPES = {
  CLICK_LINK: "ClickLink"
}; 