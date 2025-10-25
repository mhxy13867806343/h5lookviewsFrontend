<template>
  <div class="comment-component">
    <!-- 评论列表 -->
    <div class="comments-list">
      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="comment-item"
      >
        <!-- 主评论 -->
        <div class="comment-main">
          <van-image
            :src="comment.author.avatar"
            round
            width="36"
            height="36"
            fit="cover"
            @click="goToUserProfile(comment.author.id)"
          />
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author.nickname }}</span>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </div>
            
            <!-- 回复内容 -->
            <div class="comment-text">
              <span v-if="comment.replyTo" class="reply-target">
                回复 @{{ comment.replyTo.nickname }}：
              </span>
              {{ comment.content }}
            </div>
            
            <!-- 评论操作 -->
            <div class="comment-actions">
              <span 
                class="comment-like"
                :class="{ 'liked': comment.isLiked }"
                @click="likeComment(comment)"
              >
                <van-icon name="good-job-o" />
                {{ comment.likesCount || '' }}
              </span>
              <span class="comment-reply" @click="replyComment(comment)">
                回复
              </span>
              <span 
                v-if="canDeleteComment(comment)"
                class="comment-delete" 
                @click="deleteComment(comment)"
              >
                删除
              </span>
            </div>
          </div>
        </div>

        <!-- 二级回复列表 -->
        <div v-if="comment.replies && comment.replies.length" class="replies-list level-2">
          <div 
            v-for="reply in comment.replies" 
            :key="reply.id"
            class="reply-item"
          >
            <van-image
              :src="reply.author.avatar"
              round
              width="32"
              height="32"
              fit="cover"
              @click="goToUserProfile(reply.author.id)"
            />
            <div class="reply-content">
              <div class="reply-header">
                <span class="reply-author">{{ reply.author.nickname }}</span>
                <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
              </div>
              
              <div class="reply-text">
                <span v-if="reply.replyTo" class="reply-target">
                  回复 @{{ reply.replyTo.nickname }}：
                </span>
                {{ reply.content }}
              </div>
              
              <div class="reply-actions">
                <span 
                  class="reply-like"
                  :class="{ 'liked': reply.isLiked }"
                  @click="likeComment(reply)"
                >
                  <van-icon name="good-job-o" />
                  {{ reply.likesCount || '' }}
                </span>
                <span class="reply-reply" @click="replyComment(reply, comment)">
                  回复
                </span>
                <span 
                  v-if="canDeleteComment(reply)"
                  class="reply-delete" 
                  @click="deleteComment(reply, comment)"
                >
                  删除
                </span>
              </div>
            </div>

            <!-- 三级回复列表 -->
            <div v-if="reply.subReplies && reply.subReplies.length" class="sub-replies-list level-3">
              <div 
                v-for="subReply in reply.subReplies" 
                :key="subReply.id"
                class="sub-reply-item"
              >
                <van-image
                  :src="subReply.author.avatar"
                  round
                  width="28"
                  height="28"
                  fit="cover"
                  @click="goToUserProfile(subReply.author.id)"
                />
                <div class="sub-reply-content">
                  <div class="sub-reply-header">
                    <span class="sub-reply-author">{{ subReply.author.nickname }}</span>
                    <span class="sub-reply-time">{{ formatTime(subReply.createTime) }}</span>
                  </div>
                  
                  <div class="sub-reply-text">
                    <span v-if="subReply.replyTo" class="reply-target">
                      回复 @{{ subReply.replyTo.nickname }}：
                    </span>
                    {{ subReply.content }}
                  </div>
                  
                  <div class="sub-reply-actions">
                    <span 
                      class="sub-reply-like"
                      :class="{ 'liked': subReply.isLiked }"
                      @click="likeComment(subReply)"
                    >
                      <van-icon name="good-job-o" />
                      {{ subReply.likesCount || '' }}
                    </span>
                    <span class="sub-reply-reply" @click="replyComment(subReply, comment, reply)">
                      回复
                    </span>
                    <span 
                      v-if="canDeleteComment(subReply)"
                      class="sub-reply-delete" 
                      @click="deleteComment(subReply, comment, reply)"
                    >
                      删除
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 查看更多回复 -->
        <div 
          v-if="comment.hasMoreReplies" 
          class="load-more-replies"
          @click="loadMoreReplies(comment)"
        >
          查看更多回复 ({{ comment.totalRepliesCount - comment.replies.length }})
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <van-empty 
      v-if="!comments.length && !loading" 
      description="暂无评论，快来抢沙发吧~" 
      image="comment"
    />

    <!-- 加载状态 -->
    <van-loading 
      v-if="loading" 
      type="spinner" 
      color="#1989fa"
      class="loading-center"
    >
      加载中...
    </van-loading>

    <!-- 评论输入框 -->
    <div class="comment-input-container">
      <van-field
        ref="commentInputRef"
        v-model="commentText"
        :placeholder="replyPlaceholder"
        type="textarea"
        rows="1"
        autosize
        maxlength="500"
        show-word-limit
        class="comment-input"
      />
      <div class="input-actions">
        <van-button 
          v-if="currentReply"
          type="default" 
          size="small"
          @click="cancelReply"
        >
          取消回复
        </van-button>
        <van-button 
          type="primary" 
          size="small"
          @click="submitComment"
          :disabled="!commentText.trim()"
          :loading="submitLoading"
        >
          {{ currentReply ? '回复' : '评论' }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/store'
import { showSuccessToast, showConfirmDialog, showToast } from 'vant'
import dayjs from 'dayjs'

const props = defineProps({
  // 目标类型：post, note, comment
  targetType: {
    type: String,
    required: true,
    validator: value => ['post', 'note', 'comment'].includes(value)
  },
  // 目标ID
  targetId: {
    type: [String, Number],
    required: true
  },
  // 评论列表
  comments: {
    type: Array,
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否可以评论
  canComment: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'submit-comment',
  'like-comment',
  'delete-comment',
  'load-more-replies',
  'go-to-user'
])

const router = useRouter()
const userStore = useUserStore()
const commentInputRef = ref(null)

// 响应式数据
const commentText = ref('')
const submitLoading = ref(false)
const currentReply = ref(null) // 当前回复的评论信息
const replyChain = ref([]) // 回复链：[主评论, 二级评论, 三级评论]

// 计算属性
const replyPlaceholder = computed(() => {
  if (!currentReply.value) {
    return `写下你对这个${props.targetType === 'post' ? '动态' : '笔记'}的看法...`
  }
  return `回复 @${currentReply.value.author.nickname}...`
})

// 方法
const goToUserProfile = (userId) => {
  emit('go-to-user', userId)
}

const formatTime = (time) => {
  const now = new Date()
  const commentTime = new Date(time)
  const diff = now - commentTime
  
  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  } else {
    return dayjs(time).format('MM-DD HH:mm')
  }
}

const canDeleteComment = (comment) => {
  return userStore.isLoggedIn && 
         userStore.user && 
         comment.author.id === userStore.user.id
}

const likeComment = (comment) => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  
  emit('like-comment', {
    comment,
    targetType: props.targetType,
    targetId: props.targetId
  })
}

const replyComment = (comment, parentComment = null, grandParentComment = null) => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  
  currentReply.value = comment
  
  // 构建回复链
  if (grandParentComment) {
    // 三级回复
    replyChain.value = [grandParentComment, parentComment, comment]
  } else if (parentComment) {
    // 二级回复
    replyChain.value = [parentComment, comment]
  } else {
    // 一级回复
    replyChain.value = [comment]
  }
  
  // 聚焦输入框
  nextTick(() => {
    commentInputRef.value?.focus()
  })
}

const cancelReply = () => {
  currentReply.value = null
  replyChain.value = []
  commentText.value = ''
}

const deleteComment = (comment, parentComment = null, grandParentComment = null) => {
  showConfirmDialog({
    title: '确认删除',
    message: '删除后无法恢复，确定要删除这条评论吗？',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(() => {
    emit('delete-comment', {
      comment,
      parentComment,
      grandParentComment,
      targetType: props.targetType,
      targetId: props.targetId
    })
  }).catch(() => {
    // 用户取消
  })
}

const submitComment = () => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  
  if (!commentText.value.trim()) {
    showToast('请输入评论内容')
    return
  }
  
  submitLoading.value = true
  
  const commentData = {
    content: commentText.value.trim(),
    targetType: props.targetType,
    targetId: props.targetId,
    replyTo: currentReply.value,
    replyChain: replyChain.value
  }
  
  emit('submit-comment', commentData)
  
  // 重置状态
  commentText.value = ''
  currentReply.value = null
  replyChain.value = []
  submitLoading.value = false
}

const loadMoreReplies = (comment) => {
  emit('load-more-replies', {
    comment,
    targetType: props.targetType,
    targetId: props.targetId
  })
}

// 监听提交状态
watch(() => props.loading, (newVal) => {
  if (!newVal) {
    submitLoading.value = false
  }
})

// 暴露方法给父组件
defineExpose({
  focus: () => {
    nextTick(() => {
      commentInputRef.value?.focus()
    })
  },
  clearReply: () => {
    cancelReply()
  }
})
</script>

<style lang="scss" scoped>
.comment-component {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.comments-list {
  padding: var(--spacing-md);
}

.comment-item {
  margin-bottom: var(--spacing-lg);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.comment-main {
  display: flex;
  gap: var(--spacing-sm);
}

.comment-content {
  flex: 1;
  
  .comment-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
    
    .comment-author {
      font-weight: 500;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }
    
    .comment-time {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
    }
  }
  
  .comment-text {
    color: var(--text-primary);
    line-height: 1.5;
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-md);
    
    .reply-target {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
  
  .comment-actions {
    display: flex;
    gap: var(--spacing-lg);
    
    .comment-like, .comment-reply, .comment-delete {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        opacity: 0.8;
      }
      
      &.liked {
        color: var(--primary-color);
      }
    }
    
    .comment-delete {
      color: var(--danger-color);
    }
  }
}

.replies-list {
  margin-top: var(--spacing-md);
  padding-left: var(--spacing-xl);
  border-left: 2px solid var(--border-color);
  
  &.level-2 {
    .reply-item {
      margin-bottom: var(--spacing-md);
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.reply-item {
  display: flex;
  gap: var(--spacing-sm);
}

.reply-content {
  flex: 1;
  
  .reply-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
    
    .reply-author {
      font-weight: 500;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }
    
    .reply-time {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
    }
  }
  
  .reply-text {
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-sm);
    
    .reply-target {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
  
  .reply-actions {
    display: flex;
    gap: var(--spacing-lg);
    
    .reply-like, .reply-reply, .reply-delete {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        opacity: 0.8;
      }
      
      &.liked {
        color: var(--primary-color);
      }
    }
    
    .reply-delete {
      color: var(--danger-color);
    }
  }
}

.sub-replies-list {
  margin-top: var(--spacing-sm);
  padding-left: var(--spacing-lg);
  border-left: 1px solid var(--border-color);
  
  &.level-3 {
    .sub-reply-item {
      margin-bottom: var(--spacing-sm);
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.sub-reply-item {
  display: flex;
  gap: var(--spacing-xs);
}

.sub-reply-content {
  flex: 1;
  
  .sub-reply-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
    
    .sub-reply-author {
      font-weight: 500;
      color: var(--text-primary);
      font-size: var(--font-size-xs);
    }
    
    .sub-reply-time {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
    }
  }
  
  .sub-reply-text {
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-xs);
    
    .reply-target {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
  
  .sub-reply-actions {
    display: flex;
    gap: var(--spacing-md);
    
    .sub-reply-like, .sub-reply-reply, .sub-reply-delete {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        opacity: 0.8;
      }
      
      &.liked {
        color: var(--primary-color);
      }
    }
    
    .sub-reply-delete {
      color: var(--danger-color);
    }
  }
}

.load-more-replies {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-align: center;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-base);
  
  &:hover {
    background: var(--background-primary);
  }
}

.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xl);
}

.comment-input-container {
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-md);
  background: var(--background-primary);
  
  .comment-input {
    margin-bottom: var(--spacing-sm);
    background: var(--background-secondary);
    border-radius: var(--border-radius-md);
  }
  
  .input-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }
}
</style>