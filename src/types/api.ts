// 通用API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PageParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 用户相关类型
export interface User {
  id: string
  nickname: string
  avatar: string
  email?: string
  phone?: string
  isVip: boolean
  isOnline?: boolean
  createTime: string
  updateTime: string
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: User
}

// 注册请求
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  email?: string
  phone?: string
}

// 消息类型
export interface Message {
  id: string
  type: 'dynamics' | 'chats' | 'comments'
  userId: string
  user: User
  content: string
  createTime: string
  isRead: boolean
  targetId?: string
  targetType?: 'post' | 'note' | 'comment'
}

// 聊天消息
export interface ChatMessage {
  id: string
  userId: string
  user: User
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'file'
  createTime: string
  unreadCount?: number
  lastMessageTime?: string
  lastMessage?: {
    type: string
    content: string
  }
}

// 帖子类型
export interface Post {
  id: string
  userId: string
  user: User
  title: string
  content: string
  images?: string[]
  tags?: string[]
  likeCount: number
  commentCount: number
  shareCount: number
  isLiked: boolean
  createTime: string
  updateTime: string
}

// 笔记类型
export interface Note {
  id: string
  userId: string
  user: User
  title: string
  content: string
  images?: string[]
  tags?: string[]
  category: string
  isPublic: boolean
  likeCount: number
  collectCount: number
  isLiked: boolean
  isCollected: boolean
  createTime: string
  updateTime: string
}