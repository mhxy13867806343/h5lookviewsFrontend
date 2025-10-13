<template>
  <div class="chat-list">
    <van-nav-bar title="私信" left-arrow @click-left="handleBack">
      <template #right>
        <van-icon name="add" @click="showNewChat = true" />
      </template>
    </van-nav-bar>

    <div class="chat-list-content">
      <!-- 搜索栏 -->
      <van-search
        v-model="searchKeyword"
        placeholder="搜索聊天记录"
        @search="handleSearch"
        @clear="handleClear"
      />

      <!-- 聊天列表 -->
      <div class="chat-items">
        <div 
          v-for="chat in filteredChats" 
          :key="chat.id"
          class="chat-item"
          @click="enterChat(chat)"
        >
          <div class="chat-avatar">
            <van-image
              :src="chat.avatar"
              round
              width="50"
              height="50"
              fit="cover"
            />
            <div v-if="chat.unreadCount > 0" class="unread-badge">
              {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
            </div>
            <div v-if="chat.isOnline" class="online-dot"></div>
          </div>
          
          <div class="chat-info">
            <div class="chat-header">
              <div class="chat-name">{{ chat.name }}</div>
              <div class="chat-time">{{ formatTime(chat.lastMessageTime) }}</div>
            </div>
            <div class="chat-preview">
              <div class="last-message">
                <span v-if="chat.lastMessage.type === 'text'">{{ chat.lastMessage.content }}</span>
                <span v-else-if="chat.lastMessage.type === 'image'" class="message-type">[图片]</span>
                <span v-else-if="chat.lastMessage.type === 'voice'" class="message-type">[语音]</span>
                <span v-else class="message-type">[{{ chat.lastMessage.type }}]</span>
              </div>
              <van-icon 
                v-if="!chat.notificationEnabled" 
                name="volume-o" 
                class="mute-icon" 
              />
            </div>
          </div>
          
          <van-swipe-cell>
            <template #right>
              <van-button 
                square 
                type="primary" 
                text="置顶"
                @click.stop="toggleTop(chat)"
              />
              <van-button 
                square 
                type="warning" 
                text="免打扰"
                @click.stop="toggleMute(chat)"
              />
              <van-button 
                square 
                type="danger" 
                text="删除"
                @click.stop="deleteChat(chat)"
              />
            </template>
          </van-swipe-cell>
        </div>
      </div>

      <!-- 空状态 -->
      <van-empty 
        v-if="filteredChats.length === 0" 
        description="暂无聊天记录"
      >
        <van-button type="primary" @click="showNewChat = true">
          开始聊天
        </van-button>
      </van-empty>
    </div>

    <!-- 新建聊天弹窗 -->
    <van-popup v-model:show="showNewChat" position="bottom" :style="{ height: '70%' }">
      <div class="new-chat-popup">
        <div class="new-chat-header">
          <span>选择联系人</span>
          <van-icon name="cross" @click="showNewChat = false" />
        </div>
        
        <van-search
          v-model="contactSearchKeyword"
          placeholder="搜索用户"
          @search="searchContacts"
        />
        
        <div class="contact-list">
          <div 
            v-for="contact in filteredContacts" 
            :key="contact.id"
            class="contact-item"
            @click="startNewChat(contact)"
          >
            <van-image
              :src="contact.avatar"
              round
              width="40"
              height="40"
              fit="cover"
            />
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
              <div class="contact-desc">{{ contact.signature || '暂无签名' }}</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showSuccessToast, showConfirmDialog } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const searchKeyword = ref('')
const contactSearchKeyword = ref('')
const showNewChat = ref(false)
const chats = ref([])
const contacts = ref([])

// 计算属性
const filteredChats = computed(() => {
  if (!searchKeyword.value) return chats.value
  return chats.value.filter(chat => 
    chat.name.includes(searchKeyword.value) || 
    chat.lastMessage.content.includes(searchKeyword.value)
  )
})

const filteredContacts = computed(() => {
  if (!contactSearchKeyword.value) return contacts.value
  return contacts.value.filter(contact => 
    contact.name.includes(contactSearchKeyword.value)
  )
})

// 方法
const handleBack = () => {
  router.back()
}

const handleSearch = (keyword) => {
  // 搜索功能已通过计算属性实现
}

const handleClear = () => {
  searchKeyword.value = ''
}

const enterChat = (chat) => {
  // 标记为已读
  chat.unreadCount = 0
  // 跳转到聊天页面
  router.push(`/chat/${chat.userId}`)
}

const toggleTop = (chat) => {
  chat.isTop = !chat.isTop
  showSuccessToast(chat.isTop ? '已置顶' : '已取消置顶')
  // 重新排序
  sortChats()
}

const toggleMute = (chat) => {
  chat.notificationEnabled = !chat.notificationEnabled
  showSuccessToast(chat.notificationEnabled ? '已开启通知' : '已开启免打扰')
}

const deleteChat = (chat) => {
  showConfirmDialog({
    title: '删除聊天',
    message: '确定要删除这个聊天记录吗？',
  }).then(() => {
    const index = chats.value.findIndex(c => c.id === chat.id)
    if (index > -1) {
      chats.value.splice(index, 1)
      showSuccessToast('已删除聊天记录')
    }
  })
}

const startNewChat = (contact) => {
  showNewChat.value = false
  router.push(`/chat/${contact.id}`)
}

const searchContacts = (keyword) => {
  // 搜索联系人功能已通过计算属性实现
}

const formatTime = (time) => {
  const now = dayjs()
  const messageTime = dayjs(time)
  
  if (now.isSame(messageTime, 'day')) {
    return messageTime.format('HH:mm')
  } else if (now.subtract(1, 'day').isSame(messageTime, 'day')) {
    return '昨天'
  } else if (now.isSame(messageTime, 'year')) {
    return messageTime.format('MM-DD')
  } else {
    return messageTime.format('YYYY-MM-DD')
  }
}

const sortChats = () => {
  chats.value.sort((a, b) => {
    // 置顶的排在前面
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    // 按最后消息时间排序
    return dayjs(b.lastMessageTime).valueOf() - dayjs(a.lastMessageTime).valueOf()
  })
}

// 初始化数据
const initChats = () => {
  chats.value = [
    {
      id: 'chat001',
      userId: 'user001',
      name: '小明',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      lastMessage: {
        type: 'text',
        content: '你好，最近怎么样？'
      },
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 2,
      isOnline: true,
      isTop: false,
      notificationEnabled: true
    },
    {
      id: 'chat002',
      userId: 'user002',
      name: '小红',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      lastMessage: {
        type: 'image',
        content: '[图片]'
      },
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      isOnline: false,
      isTop: true,
      notificationEnabled: true
    },
    {
      id: 'chat003',
      userId: 'user003',
      name: '阿强',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      lastMessage: {
        type: 'text',
        content: '明天见面聊吧'
      },
      lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      unreadCount: 0,
      isOnline: true,
      isTop: false,
      notificationEnabled: false
    }
  ]
  sortChats()
}

const initContacts = () => {
  contacts.value = [
    {
      id: 'user004',
      name: '小李',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      signature: '热爱生活，热爱工作'
    },
    {
      id: 'user005',
      name: '小张',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      signature: '摄影爱好者'
    },
    {
      id: 'user006',
      name: '小王',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      signature: '美食达人'
    }
  ]
}

onMounted(() => {
  initChats()
  initContacts()
})
</script>

<style lang="scss" scoped>
.chat-list {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.chat-list-content {
  padding-bottom: 60px;
}

.chat-items {
  padding: var(--spacing-sm);
}

.chat-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  
  &:hover {
    background-color: var(--background-primary);
  }
  
  .chat-avatar {
    position: relative;
    margin-right: var(--spacing-md);
    
    .unread-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff976a;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
    }
    
    .online-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #52c41a;
      border: 2px solid white;
      border-radius: 50%;
    }
  }
  
  .chat-info {
    flex: 1;
    
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
      
      .chat-name {
        font-size: var(--font-size-md);
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .chat-time {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
    
    .chat-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .last-message {
        flex: 1;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        
        .message-type {
          color: var(--primary-color);
        }
      }
      
      .mute-icon {
        margin-left: var(--spacing-xs);
        color: var(--text-secondary);
        font-size: 14px;
      }
    }
  }
}

.new-chat-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .new-chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    font-size: var(--font-size-lg);
  }
  
  .contact-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
    
    .contact-item {
      display: flex;
      align-items: center;
      padding: var(--spacing-md);
      background: var(--background-secondary);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-sm);
      cursor: pointer;
      
      &:hover {
        background-color: var(--background-primary);
      }
      
      .contact-info {
        margin-left: var(--spacing-md);
        flex: 1;
        
        .contact-name {
          font-size: var(--font-size-md);
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }
        
        .contact-desc {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
      }
    }
  }
}
</style>