import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import zhTW from './locales/zh-TW'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'

// 支持的语言列表
export const SUPPORT_LOCALES = [
  { name: '简体中文', value: 'zh-CN' },
  { name: '繁體中文', value: 'zh-TW' },
  { name: 'English', value: 'en-US' },
  { name: '日本語', value: 'ja-JP' },
] as const

// 语言类型
export type Locale = typeof SUPPORT_LOCALES[number]['value']

// 获取浏览器语言
function getBrowserLocale(): Locale {
  const browserLang = navigator.language.toLowerCase()
  
  // 精确匹配
  const exactMatch = SUPPORT_LOCALES.find(
    locale => locale.value.toLowerCase() === browserLang
  )
  if (exactMatch) return exactMatch.value
  
  // 模糊匹配（只匹配语言代码，忽略国家代码）
  const langCode = browserLang.split('-')[0]
  const fuzzyMatch = SUPPORT_LOCALES.find(
    locale => locale.value.toLowerCase().startsWith(langCode)
  )
  if (fuzzyMatch) return fuzzyMatch.value
  
  // 默认返回简体中文
  return 'zh-CN'
}

// 从本地存储获取语言设置
function getStoredLocale(): Locale {
  const stored = localStorage.getItem('language') as Locale
  if (stored && SUPPORT_LOCALES.some(locale => locale.value === stored)) {
    return stored
  }
  return getBrowserLocale()
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getStoredLocale(), // 默认语言
  fallbackLocale: 'zh-CN', // 回退语言
  globalInjection: true, // 全局注入 $t 函数
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
    'ja-JP': jaJP,
  },
})

// 切换语言的辅助函数
export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  localStorage.setItem('language', locale)
  
  // 更新 HTML lang 属性
  document.documentElement.lang = locale
}

// 获取当前语言名称
export function getCurrentLocaleName(): string {
  const current = i18n.global.locale.value
  return SUPPORT_LOCALES.find(locale => locale.value === current)?.name || '简体中文'
}

export default i18n
