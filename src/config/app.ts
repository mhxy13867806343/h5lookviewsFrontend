/**
 * 应用配置文件
 */

import packageJson from '../../package.json'

export interface AppConfig {
  name: string
  version: string
  description: string
  author: string
  homepage: string
  repository: string
  updateTime: string
  buildTime: string
}

export const appConfig: AppConfig = {
  // 应用名称
  name: 'H5 Lookviews',
  
  // 版本号（从 package.json 读取）
  version: packageJson.version || '1.0.0',
  
  // 应用描述
  description: '一款优雅的笔记分享社区应用',
  
  // 作者
  author: '前端开发团队',
  
  // 主页
  homepage: packageJson.homepage || 'https://github.com/mhxy13867806343/h5lookviewsFrontend',
  
  // 仓库地址
  repository: 'https://github.com/mhxy13867806343/h5lookviewsFrontend',
  
  // 最后更新时间
  updateTime: '2024-01-15',
  
  // 构建时间（在构建时动态生成）
  buildTime: new Date().toISOString()
}

// 应用主题配置
export interface ThemeConfig {
  primaryColor: string
  successColor: string
  warningColor: string
  dangerColor: string
}

export const themeConfig: ThemeConfig = {
  primaryColor: '#1989fa',
  successColor: '#07c160',
  warningColor: '#ff976a',
  dangerColor: '#ee0a24'
}

// 缓存配置
export interface CacheConfig {
  maxHistoryCount: number
  maxCacheSize: number
  cacheExpire: number
}

export const cacheConfig: CacheConfig = {
  // 最大浏览历史记录数
  maxHistoryCount: 100,
  
  // 最大缓存大小（KB）
  maxCacheSize: 10240,
  
  // 缓存过期时间（毫秒）
  cacheExpire: 7 * 24 * 60 * 60 * 1000 // 7天
}

// API 配置
export interface ApiConfig {
  baseURL: string
  timeout: number
  withCredentials: boolean
}

export const apiConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  withCredentials: true
}

// 功能开关配置
export interface FeatureFlags {
  enableDarkMode: boolean
  enableNotification: boolean
  enableI18n: boolean
  enablePWA: boolean
}

export const featureFlags: FeatureFlags = {
  // 是否启用夜间模式
  enableDarkMode: true,
  
  // 是否启用消息通知
  enableNotification: true,
  
  // 是否启用国际化
  enableI18n: true,
  
  // 是否启用 PWA
  enablePWA: false
}

export default {
  appConfig,
  themeConfig,
  cacheConfig,
  apiConfig,
  featureFlags
}
