<template>
  <div class="chats-messages">
    <!-- 操作栏 -->
    <div class="action-bar" v-if="messages.length > 0">
      <van-button 
        type="danger" 
        size="small" 
        plain
        @click="$emit('clear-all')"
      >
        清空全部
      </van-button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-list">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message-item"
        @click="$emit('item-click', message)"
      >
        <div class="message-avatar">
          <van-image
            :src="message.user.avatar"
            round
            width="50"
            height="50"
            fit="cover"
          >
            <template #error>
              <van-icon name="user-circle-o" size="50" />
            </template>
          </van-image>
          
          <!-- 在线状态 -->
          <div 
            class="online-status" 
            :class="{ 'online': message.user.isOnline }"
          ></div>
          
          <!-- 未读消息数 -->
          <van-badge 
            v-if="message.unreadCount > 0"
            :content="message.unreadCount > 99 ? '99+' : message.unreadCount"
            class="unread-badge"
          />
        </div>

        <div class="message-content">
          <div class="message-header">
            <div class="user-info">
              <span class="user-name">{{ message.user.nickname }}</span>
              <van-tag 
                v-if="message.user.isVip" 
                type="warning" 
                size="mini"
                class="vip-tag"
              >
                VIP
              </van-tag>
            </div>
            <span class="message-time">{{ formatTime(message.lastMessageTime) }}</span>
          </div>
          
          <div class="last-message">
            <span class="message-type" v-if="message.lastMessage.type !== 'text'">
              {{ getMessageTypeText(message.lastMessage.type) }}
            </span>
            <span class="message-text">{{ getLastMessageText(message.lastMessage) }}</span>
          </div>
        </div>

        <div class="message-actions">
          <van-icon 
            name="cross" 
            @click.stop="$emit('remove', message)"
            class="remove-btn"
          />
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <van-empty 
      v-if="!loading && messages.length === 0"
      description="暂无私信消息"
      image="https://img.yzcdn.cn/vant/custom-empty-image.png"
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" class="loading-center">加载中...</van-loading>

    <!-- 分页加载 -->
    <van-list
      v-if="messages.length > 0"
      v-model:loading="loadingMore"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'

// 事件定义
const emit = defineEmits(['item-click', 'remove', 'clear-all'])

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const messages = ref([])
const currentPage = ref(1)

// 获取消息类型文本
const getMessageTypeText = (type) => {
  const types = {
    image: '[图片]',
    voice: '[语音]',
    video: '[视频]',
    file: '[文件]'
  }
  return types[type] || ''
}

// 获取最后一条消息文本
const getLastMessageText = (lastMessage) => {
  if (lastMessage.type === 'text') {
    return lastMessage.content
  }
  return getMessageTypeText(lastMessage.type)
}

// 格式化时间
const formatTime = (time) => {
  const now = dayjs()
  const messageTime = dayjs(time)
  
  if (now.diff(messageTime, 'day') === 0) {
    return messageTime.format('HH:mm')
  } else if (now.diff(messageTime, 'day') === 1) {
    return '昨天'
  } else if (now.diff(messageTime, 'day') < 7) {
    return messageTime.format('dddd')
  } else {
    return messageTime.format('MM/DD')
  }
}

// 加载消息数据
const loadMessages = async (page = 1) => {
  if (page === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟私信消息数据
    const mockMessages = [
      {
        id: `chat_${page}_1`,
        userId: 'user001',
        user: {
          id: 'user001',
          nickname: '张小明',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          isOnline: true,
          isVip: true
        },
        unreadCount: 3,
        lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
        lastMessage: {
          type: 'text',
          content: '你好，请问这个产品还有库存吗？'
        }
      },
      {
        id: `chat_${page}_2`,
        userId: 'user002',
        user: {
          id: 'user002',
          nickname: '李小红',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          isOnline: false,
          isVip: false
        },
        unreadCount: 0,
        lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        lastMessage: {
          type: 'image',
          content: ''
        }
      },
      {
        id: `chat_${page}_3`,
        userId: 'user003',
        user: {
          id: 'user003',
          nickname: '王小刚',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          isOnline: true,
          isVip: false
        },
        unreadCount: 1,
        lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lastMessage: {
          type: 'text',
          content: '谢谢你的帮助！'
        }
      }
    ]

    if (page === 1) {
      messages.value = mockMessages
    } else {
      messages.value.push(...mockMessages)
    }

    // 模拟分页结束
    if (page >= 3) {
      finished.value = true
    }

  } catch (error) {
    console.error('加载私信消息失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!finished.value) {
    currentPage.value++
    loadMessages(currentPage.value)
  }
}

// 删除单条消息
const removeItem = (id) => {
  messages.value = messages.value.filter(item => item.id !== id)
}

// 清空所有消息
const clearAll = () => {
  messages.value = []
  currentPage.value = 1
  finished.value = false
}

// 暴露方法给父组件
defineExpose({
  removeItem,
  clearAll
})

// 页面初始化
onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.chats-messages {
  padding: var(--spacing-md);
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

.messages-list {
  .message-item {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--background-secondary);
    border-radius: var(--border-radius-md);
    margin-bottom: var(--spacing-sm);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: var(--background-hover);
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}

.message-avatar {
  position: relative;
  flex-shrink: 0;
  
  .online-status {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-secondary);
    border: 2px solid var(--background-secondary);
    
    &.online {
      background: #07c160;
    }
  }
  
  .unread-badge {
    position: absolute;
    top: -5px;
    right: -5px;
  }
}

.message-content {
  flex: 1;
  min-width: 0;
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
    
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      
      .user-name {
        font-weight: 500;
        color: var(--text-primary);
        font-size: var(--font-size-md);
      }
      
      .vip-tag {
        transform: scale(0.8);
      }
    }
    
    .message-time {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
  }
  
  .last-message {
    display: flex;
    align-items: center;
    
    .message-type {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      margin-right: var(--spacing-xs);
    }
    
    .message-text {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
  }
}

.message-actions {
  display: flex;
  align-items: flex-start;
  
  .remove-btn {
    color: var(--text-secondary);
    padding: var(--spacing-xs);
    cursor: pointer;
    
    &:hover {
      color: var(--danger-color);
    }
  }
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}
</style>