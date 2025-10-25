<template>
  <div class="comments-messages">
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
          
          <!-- 评论类型图标 -->
          <div class="comment-type-icon">
            <van-icon 
              :name="getCommentTypeIcon(message.commentType)" 
              color="#1989fa"
              size="12"
            />
          </div>
        </div>

        <div class="message-content">
          <div class="message-header">
            <span class="user-name">{{ message.user.nickname }}</span>
            <span class="message-time">{{ formatTime(message.createTime) }}</span>
          </div>
          
          <div class="comment-action">
            {{ getCommentActionText(message.commentType) }}
          </div>
          
          <div class="comment-content">
            "{{ message.commentContent }}"
          </div>
          
          <!-- 被评论的内容预览 -->
          <div class="target-content">
            <div class="target-info">
              <van-icon :name="getTargetIcon(message.targetType)" size="14" />
              <span>{{ getTargetTypeText(message.targetType) }}</span>
            </div>
            <div class="target-preview">
              <div class="target-text">{{ message.targetContent }}</div>
              <van-image
                v-if="message.targetImage"
                :src="message.targetImage"
                width="50"
                height="50"
                fit="cover"
                radius="4"
              />
            </div>
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
      description="暂无评论消息"
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
interface CommentMessage {
  id: string
  type: 'comment' | 'reply' | 'mention'
  user: {
    id: string
    nickname: string
    avatar: string
    isVip?: boolean
  }
  content: string
  createTime: string
  targetType: 'post' | 'note' | 'comment'
  targetTitle: string
  targetId: string
}

// 事件定义
const emit = defineEmits<{
  'item-click': [message: CommentMessage]
  'remove': [messageId: string]
  'clear-all': []
}>()

// 响应式数据
const loading = ref<boolean>(false)
const loadingMore = ref<boolean>(false)
const finished = ref<boolean>(false)
const messages = ref<CommentMessage[]>([])
const currentPage = ref<number>(1)

// 获取评论类型图标
const getCommentTypeIcon = (type: CommentMessage['type']): string => {
  const icons: Record<CommentMessage['type'], string> = {
    comment: 'comment-o',
    reply: 'chat-o',
    mention: 'at'
  }
  return icons[type] || 'comment-o'
}

// 获取评论动作文本
const getCommentActionText = (type: CommentMessage['type']): string => {
  const actions: Record<CommentMessage['type'], string> = {
    comment: '评论了你的',
    reply: '回复了你的评论',
    mention: '在评论中提到了你'
  }
  return actions[type] || '评论了你的'
}

// 获取目标类型图标
const getTargetIcon = (type: CommentMessage['targetType']): string => {
  const icons: Record<CommentMessage['targetType'], string> = {
    post: 'photo-o',
    note: 'notes-o',
    comment: 'comment-o'
  }
  return icons[type] || 'photo-o'
}

// 获取目标类型文本
const getTargetTypeText = (type) => {
  const texts = {
    post: '动态',
    note: '笔记',
    comment: '评论'
  }
  return texts[type] || '内容'
}

// 格式化时间
const formatTime = (time) => {
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
    
    // 模拟评论消息数据
    const mockMessages = [
      {
        id: `comment_${page}_1`,
        commentType: 'comment',
        user: {
          id: 'user001',
          nickname: '热心网友',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        commentContent: '写得很好，学到了很多！',
        targetType: 'note',
        targetId: 'note001',
        targetContent: '如何提高工作效率的10个小技巧',
        targetImage: null,
        createTime: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: `comment_${page}_2`,
        commentType: 'reply',
        user: {
          id: 'user002',
          nickname: '小王同学',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        commentContent: '确实如此，我也有同样的感受',
        targetType: 'post',
        targetId: 'post001',
        targetContent: '今天的日落真美',
        targetImage: 'https://img.yzcdn.cn/vant/cat.jpeg',
        createTime: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: `comment_${page}_3`,
        commentType: 'mention',
        user: {
          id: 'user003',
          nickname: '设计师小李',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
        },
        commentContent: '@你 这个设计思路很棒，可以参考一下',
        targetType: 'post',
        targetId: 'post002',
        targetContent: '分享一个UI设计作品',
        targetImage: 'https://img.yzcdn.cn/vant/cat.jpeg',
        createTime: new Date(Date.now() - 5 * 60 * 60 * 1000)
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
    console.error('加载评论消息失败:', error)
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
  console.log('CommentsMessages mounted, isDataLoaded:', isDataLoaded.value)
  if (!isDataLoaded.value) {
    console.log('首次加载数据')
    loadMessages()
    isDataLoaded.value = true
  } else {
    console.log('数据已加载，跳过重新加载')
  }
})

// keep-alive 失活时
onDeactivated(() => {
  console.log('CommentsMessages deactivated')
})

// 暴露方法给父组件
defineExpose({
  removeItem,
  clearAll,
  forceReload
})
</script>

<style scoped>
.comments-messages {
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
  
  .comment-type-icon {
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
  
  .comment-action {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
  }
  
  .comment-content {
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: var(--spacing-sm);
    font-style: italic;
    padding: var(--spacing-xs);
    background: var(--background-primary);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid var(--primary-color);
  }
  
  .target-content {
    .target-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
    
    .target-preview {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs);
      background: var(--background-primary);
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
      
      .target-text {
        flex: 1;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
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