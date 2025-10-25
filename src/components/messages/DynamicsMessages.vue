<template>
  <div class="dynamics-messages">
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
            width="40"
            height="40"
            fit="cover"
          >
            <template #error>
              <van-icon name="user-circle-o" size="40" />
            </template>
          </van-image>
          
          <!-- 消息类型图标 -->
          <div class="message-type-icon">
            <van-icon 
              :name="getTypeIcon(message.type)" 
              :color="getTypeColor(message.type)"
              size="14"
            />
          </div>
        </div>

        <div class="message-content">
          <div class="message-header">
            <span class="user-name">{{ message.user.nickname }}</span>
            <span class="message-time">{{ formatTime(message.createTime) }}</span>
          </div>
          
          <div class="message-text">
            {{ getMessageText(message) }}
          </div>
          
          <!-- 相关动态预览 -->
          <div class="related-content" v-if="message.relatedPost">
            <div class="related-text">{{ message.relatedPost.content }}</div>
            <van-image
              v-if="message.relatedPost.images && message.relatedPost.images.length > 0"
              :src="message.relatedPost.images[0]"
              width="60"
              height="60"
              fit="cover"
              radius="4"
            />
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
      description="暂无动态消息"
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

<script lang="ts" setup>
import { formatRelativeTime } from '../../utils/index'

// 类型定义
interface Message {
  id: string
  type: 'like' | 'comment' | 'share' | 'follow'
  user: {
    id: string
    nickname: string
    avatar: string
  }
  createTime: string
  commentText?: string
  targetId?: string
}

// 事件定义
const emit = defineEmits<{
  'item-click': [message: Message]
  'remove': [messageId: string]
  'clear-all': []
}>()

// 响应式数据
const loading = ref<boolean>(false)
const loadingMore = ref<boolean>(false)
const finished = ref<boolean>(false)
const messages = ref<Message[]>([])
const currentPage = ref<number>(1)

// 获取消息类型图标
const getTypeIcon = (type: Message['type']): string => {
  const icons: Record<Message['type'], string> = {
    like: 'good-job',
    comment: 'comment',
    share: 'share',
    follow: 'add-o'
  }
  return icons[type] || 'bell'
}

// 获取消息类型颜色
const getTypeColor = (type: Message['type']): string => {
  const colors: Record<Message['type'], string> = {
    like: '#ff976a',
    comment: '#1989fa',
    share: '#07c160',
    follow: '#ee0a24'
  }
  return colors[type] || '#969799'
}

// 获取消息文本
const getMessageText = (message: Message): string => {
  const texts: Record<Message['type'], string> = {
    like: `赞了你的动态`,
    comment: `评论了你的动态：${message.commentText || ''}`,
    share: `分享了你的动态`,
    follow: `关注了你`
  }
  return texts[message.type] || '有新的动态消息'
}

// 格式化时间
const formatTime = (time: string): string => {
  return formatRelativeTime(time)
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
    
    // 模拟动态消息数据
    const mockMessages = [
      {
        id: `dynamics_${page}_1`,
        type: 'like',
        user: {
          id: 'user001',
          nickname: '小明',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        relatedPost: {
          id: 'post001',
          content: '今天天气真不错，出去走走~',
          images: ['https://img.yzcdn.cn/vant/cat.jpeg']
        }
      },
      {
        id: `dynamics_${page}_2`,
        type: 'comment',
        user: {
          id: 'user002',
          nickname: '小红',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        commentText: '说得很有道理！',
        createTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        relatedPost: {
          id: 'post002',
          content: '分享一些学习心得...',
          images: []
        }
      },
      {
        id: `dynamics_${page}_3`,
        type: 'share',
        user: {
          id: 'user003',
          nickname: '小李',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        createTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        relatedPost: {
          id: 'post003',
          content: '美食分享：今天做的蛋糕',
          images: ['https://img.yzcdn.cn/vant/cat.jpeg']
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
    console.error('加载动态消息失败:', error)
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

// 数据是否已加载
const isDataLoaded = ref(false)

// 强制重新加载
const forceReload = () => {
  isDataLoaded.value = false
  messages.value = []
  currentPage.value = 1
  finished.value = false
  loadMessages()
  isDataLoaded.value = true
}

// 页面初始化
onMounted(() => {
  console.log('DynamicsMessages mounted, isDataLoaded:', isDataLoaded.value)
  if (!isDataLoaded.value) {
    console.log('首次加载数据')
    loadMessages()
    isDataLoaded.value = true
  } else {
    console.log('数据已加载，跳过重新加载')
  }
})

// 暴露方法给父组件
defineExpose({
  removeItem,
  clearAll,
  forceReload
})
</script>

<style scoped>
.dynamics-messages {
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
    gap: var(--spacing-sm);
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
  
  .message-type-icon {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: var(--background-secondary);
    border-radius: 50%;
    padding: 2px;
    border: 1px solid var(--border-color);
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
    
    .user-name {
      font-weight: 500;
      color: var(--text-primary);
      font-size: var(--font-size-md);
    }
    
    .message-time {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
  }
  
  .message-text {
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: var(--spacing-xs);
  }
  
  .related-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs);
    background: var(--background-primary);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-color);
    
    .related-text {
      flex: 1;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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