import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置 dayjs 插件
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 格式化日期
export const formatDate = (date: string | Date | number, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

// 格式化时间
export const formatDateTime = (date: string | Date | number): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化相对时间
export const formatRelativeTime = (date: string | Date | number): string => {
  return dayjs(date).fromNow()
}

// 格式化价格
export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      if (timeout) clearTimeout(timeout)
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  let inThrottle: boolean
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 生成随机ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    Object.keys(obj).forEach(key => {
      (cloned as any)[key] = deepClone((obj as any)[key])
    })
    return cloned
  }
  return obj
}

// 本地存储工具
export const storage = {
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },
  
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },
  
  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}

// 验证工具
export const validators = {
  email: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  },
  
  phone: (phone: string): boolean => {
    const re = /^1[3-9]\d{9}$/
    return re.test(phone)
  },
  
  password: (password: string): boolean => {
    return password.length >= 6
  },
  
  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== ''
  }
}