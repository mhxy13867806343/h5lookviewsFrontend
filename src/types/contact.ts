// 联系人相关类型定义

export interface Contact {
  id: number
  name: string
  phone: string
  avatar: string
  remark?: string
  email?: string
  company?: string
  pinyin?: string // 拼音首字母，用于索引排序
  createTime?: number
  tags?: string[] // 标签
}

export interface ContactGroup {
  letter: string
  contacts: Contact[]
}
