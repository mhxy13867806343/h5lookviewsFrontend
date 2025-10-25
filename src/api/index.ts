import request from '@/utils/request'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Message,
  ChatMessage,
  Post,
  Note,
  PageParams,
  PageResponse
} from '@/types/api'

// 用户相关API
export const userApi = {
  // 登录
  login: (data: LoginRequest) => 
    request.post<LoginResponse>('/auth/login', data),
  
  // 注册
  register: (data: RegisterRequest) => 
    request.post<User>('/auth/register', data),
  
  // 获取用户信息
  getUserInfo: () => 
    request.get<User>('/user/info'),
  
  // 更新用户信息
  updateUserInfo: (data: Partial<User>) => 
    request.put<User>('/user/info', data),
  
  // 获取用户详情
  getUserDetail: (userId: string) => 
    request.get<User>(`/user/${userId}`),
}

// 消息相关API
export const messageApi = {
  // 获取消息列表
  getMessages: (type: 'dynamics' | 'chats' | 'comments', params: PageParams) => 
    request.get<PageResponse<Message>>(`/messages/${type}`, { params }),
  
  // 标记消息已读
  markAsRead: (messageId: string) => 
    request.put(`/messages/${messageId}/read`),
  
  // 删除消息
  deleteMessage: (messageId: string) => 
    request.delete(`/messages/${messageId}`),
  
  // 清空消息
  clearMessages: (type: 'dynamics' | 'chats' | 'comments') => 
    request.delete(`/messages/${type}/clear`),
}

// 聊天相关API
export const chatApi = {
  // 获取聊天列表
  getChatList: (params: PageParams) => 
    request.get<PageResponse<ChatMessage>>('/chats', { params }),
  
  // 获取聊天记录
  getChatHistory: (userId: string, params: PageParams) => 
    request.get<PageResponse<ChatMessage>>(`/chats/${userId}`, { params }),
  
  // 发送消息
  sendMessage: (userId: string, data: { content: string; type: string }) => 
    request.post<ChatMessage>(`/chats/${userId}/send`, data),
  
  // 删除聊天记录
  deleteChat: (userId: string) => 
    request.delete(`/chats/${userId}`),
}

// 帖子相关API
export const postApi = {
  // 获取帖子列表
  getPosts: (params: PageParams & { category?: string; keyword?: string }) => 
    request.get<PageResponse<Post>>('/posts', { params }),
  
  // 获取帖子详情
  getPostDetail: (postId: string) => 
    request.get<Post>(`/posts/${postId}`),
  
  // 创建帖子
  createPost: (data: Partial<Post>) => 
    request.post<Post>('/posts', data),
  
  // 更新帖子
  updatePost: (postId: string, data: Partial<Post>) => 
    request.put<Post>(`/posts/${postId}`, data),
  
  // 删除帖子
  deletePost: (postId: string) => 
    request.delete(`/posts/${postId}`),
  
  // 点赞帖子
  likePost: (postId: string) => 
    request.post(`/posts/${postId}/like`),
  
  // 取消点赞
  unlikePost: (postId: string) => 
    request.delete(`/posts/${postId}/like`),
}

// 笔记相关API
export const noteApi = {
  // 获取笔记列表
  getNotes: (params: PageParams & { category?: string; keyword?: string }) => 
    request.get<PageResponse<Note>>('/notes', { params }),
  
  // 获取笔记详情
  getNoteDetail: (noteId: string) => 
    request.get<Note>(`/notes/${noteId}`),
  
  // 创建笔记
  createNote: (data: Partial<Note>) => 
    request.post<Note>('/notes', data),
  
  // 更新笔记
  updateNote: (noteId: string, data: Partial<Note>) => 
    request.put<Note>(`/notes/${noteId}`, data),
  
  // 删除笔记
  deleteNote: (noteId: string) => 
    request.delete(`/notes/${noteId}`),
  
  // 收藏笔记
  collectNote: (noteId: string) => 
    request.post(`/notes/${noteId}/collect`),
  
  // 取消收藏
  uncollectNote: (noteId: string) => 
    request.delete(`/notes/${noteId}/collect`),
}

// 文件上传API
export const uploadApi = {
  // 上传图片
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<{ url: string }>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 上传文件
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<{ url: string; name: string; size: number }>('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}