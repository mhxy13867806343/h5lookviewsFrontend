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
              :name="getTypeIcon()" 
              :color="getTypeColor()"
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
import { showFailToast } from 'vant'
import { messageApi } from '@/api'
import type { Message as BackendMessage, PageResponse } from '@/types/api'

// 类型定义
// 后端消息映射到本组件使用的消息结构
interface MessageUI {
  id: string
  type: 'dynamics'
  user: {
    id: string
    nickname: string
    avatar: string
  }
  createTime: string
  content: string
  targetId?: string
  targetType?: 'post' | 'note' | 'comment'
  relatedPost?: {
    content: string
    images?: string[]
  }
}

// 事件定义
const emit = defineEmits<{
  'item-click': [message: MessageUI]
  'remove': [messageId: string]
  'clear-all': []
}>()

// 响应式数据
const loading = ref<boolean>(false)
const loadingMore = ref<boolean>(false)
const finished = ref<boolean>(false)
const messages = ref<MessageUI[]>([])
const currentPage = ref<number>(1)

// 获取消息类型图标
const getTypeIcon = (): string => {
  // 由于后端未区分具体动作类型，这里统一使用提醒图标
  return 'bell'
}

// 获取消息类型颜色
const getTypeColor = (): string => {
  return '#969799'
}

// 获取消息文本
const getMessageText = (message: MessageUI): string => {
  return message.content || '有新的动态消息'
}

// 格式化时间
const formatTime = (time: string): string => {
  return formatRelativeTime(time)
}

// 加载消息数据
const mapToUI = (m: BackendMessage): MessageUI => ({
  id: m.id,
  type: 'dynamics',
  user: {
    id: m.user.id,
    nickname: m.user.nickname,
    avatar: m.user.avatar
  },
  createTime: m.createTime,
  content: m.content,
  targetId: m.targetId,
  targetType: m.targetType
})

const loadMessages = async (page = 1) => {
  if (page === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const res = await messageApi.getMessages('dynamics', { page, pageSize: 10 })
    const list = (res.data.list || []).map(mapToUI)
    if (page === 1) {
      messages.value = list
    } else {
      messages.value.push(...list)
    }
    // 根据返回的分页信息判断是否结束
    finished.value = res.data.page * res.data.pageSize >= res.data.total || list.length < res.data.pageSize
  } catch (error) {
    console.error('加载动态消息失败:', error)
    showFailToast('加载动态消息失败')
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
const removeItem = async (id: string) => {
  try {
    await messageApi.deleteMessage(id)
    messages.value = messages.value.filter(item => item.id !== id)
  } catch (error) {
    console.error('删除动态消息失败:', error)
    showFailToast('删除失败')
  }
}

// 清空所有消息
const clearAll = async () => {
  try {
    await messageApi.clearMessages('dynamics')
    messages.value = []
    currentPage.value = 1
    finished.value = false
  } catch (error) {
    console.error('清空动态消息失败:', error)
    showFailToast('清空失败')
  }
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