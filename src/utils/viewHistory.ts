/**
 * 浏览历史记录工具
 */

export interface ViewHistoryItem {
  id: string
  type: 'note' | 'post' | 'user' | 'category' | 'search' | 'other'
  title: string
  description?: string
  path: string
  visitTime: string
  params?: Record<string, any>
}

const STORAGE_KEY = 'viewHistory'
const MAX_HISTORY_COUNT = 100

/**
 * 添加浏览历史记录
 * @param item 历史记录项（不含 id 和 visitTime）
 */
export const addViewHistory = (item: Omit<ViewHistoryItem, 'id' | 'visitTime'>): void => {
  try {
    const history = getViewHistory()
    
    // 检查是否已存在相同路径的记录
    const existingIndex = history.findIndex(h => h.path === item.path)
    
    if (existingIndex !== -1) {
      // 如果存在，更新访问时间和信息
      history[existingIndex] = {
        ...history[existingIndex],
        ...item,
        visitTime: new Date().toISOString()
      }
      // 将更新的记录移到最前面
      const [updatedItem] = history.splice(existingIndex, 1)
      history.unshift(updatedItem)
    } else {
      // 如果不存在，添加新记录
      const newItem: ViewHistoryItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        visitTime: new Date().toISOString()
      }
      history.unshift(newItem)
    }
    
    // 限制历史记录数量
    if (history.length > MAX_HISTORY_COUNT) {
      history.splice(MAX_HISTORY_COUNT)
    }
    
    saveViewHistory(history)
  } catch (error) {
    console.error('添加浏览历史失败:', error)
  }
}

/**
 * 获取所有浏览历史记录
 * @returns 历史记录列表
 */
export const getViewHistory = (): ViewHistoryItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as ViewHistoryItem[]
    }
    return []
  } catch (error) {
    console.error('获取浏览历史失败:', error)
    return []
  }
}

/**
 * 保存浏览历史记录
 * @param history 历史记录列表
 */
export const saveViewHistory = (history: ViewHistoryItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('保存浏览历史失败:', error)
  }
}

/**
 * 删除单条浏览历史记录
 * @param id 记录 ID
 */
export const removeViewHistory = (id: string): void => {
  try {
    const history = getViewHistory()
    const filtered = history.filter(item => item.id !== id)
    saveViewHistory(filtered)
  } catch (error) {
    console.error('删除浏览历史失败:', error)
  }
}

/**
 * 清空所有浏览历史记录
 */
export const clearViewHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('清空浏览历史失败:', error)
  }
}

/**
 * 搜索浏览历史记录
 * @param keyword 搜索关键词
 * @returns 匹配的历史记录列表
 */
export const searchViewHistory = (keyword: string): ViewHistoryItem[] => {
  try {
    const history = getViewHistory()
    const lowerKeyword = keyword.toLowerCase()
    
    return history.filter(item =>
      item.title.toLowerCase().includes(lowerKeyword) ||
      item.description?.toLowerCase().includes(lowerKeyword)
    )
  } catch (error) {
    console.error('搜索浏览历史失败:', error)
    return []
  }
}

/**
 * 获取最近访问的 N 条记录
 * @param count 记录数量
 * @returns 最近的历史记录列表
 */
export const getRecentViewHistory = (count: number = 10): ViewHistoryItem[] => {
  try {
    const history = getViewHistory()
    return history.slice(0, count)
  } catch (error) {
    console.error('获取最近浏览历史失败:', error)
    return []
  }
}

/**
 * 按类型获取浏览历史记录
 * @param type 页面类型
 * @returns 指定类型的历史记录列表
 */
export const getViewHistoryByType = (type: ViewHistoryItem['type']): ViewHistoryItem[] => {
  try {
    const history = getViewHistory()
    return history.filter(item => item.type === type)
  } catch (error) {
    console.error('获取指定类型浏览历史失败:', error)
    return []
  }
}
