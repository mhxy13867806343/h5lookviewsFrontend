<template>
  <div class="post-detail">
    <van-nav-bar 
      title="动态详情" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="ellipsis" @click="showActionSheet = true" />
      </template>
    </van-nav-bar>

    <div class="post-detail-content" v-if="postInfo">
      <!-- 作者信息 -->
      <div class="author-info" @click="goToUserProfile">
        <van-image
          :src="postInfo.author.avatar"
          round
          width="40"
          height="40"
          fit="cover"
        />
        <div class="author-details">
          <h4>{{ postInfo.author.nickname }}</h4>
          <p>{{ formatTime(postInfo.createTime) }}</p>
        </div>
        <van-button 
          v-if="!isAuthor && !isFollowed" 
          type="primary" 
          size="mini"
          @click.stop="handleFollow"
          :loading="followLoading"
        >
          关注
        </van-button>
      </div>

      <!-- 动态内容 -->
      <div class="post-content">
        <p class="post-text">{{ postInfo.content }}</p>
        
        <!-- 图片展示 -->
        <div v-if="postInfo.images && postInfo.images.length" class="post-images">
          <van-image
            v-for="(image, index) in postInfo.images"
            :key="index"
            :src="image"
            fit="cover"
            @click="previewImages(postInfo.images, index)"
          />
        </div>

        <!-- 位置信息 -->
        <div v-if="postInfo.location" class="post-location">
          <van-icon name="location-o" />
          <span>{{ postInfo.location }}</span>
        </div>
      </div>

      <!-- 互动数据 -->
      <div class="post-stats">
        <div class="stats-item">
          <van-icon name="good-job-o" />
          <span>{{ postInfo.likesCount || 0 }}人点赞</span>
        </div>
        <div class="stats-item">
          <van-icon name="comment-o" />
          <span>{{ postInfo.commentsCount || 0 }}条评论</span>
        </div>
        <div class="stats-item">
          <van-icon name="star-o" />
          <span>{{ postInfo.collectsCount || 0 }}次收藏</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="post-actions">
        <van-button 
          :type="postInfo.isLiked ? 'danger' : 'default'" 
          :icon="postInfo.isLiked ? 'good-job' : 'good-job-o'"
          @click="handleLike"
          :loading="likeLoading"
        >
          {{ postInfo.isLiked ? '已赞' : '点赞' }}
        </van-button>
        
        <van-button 
          type="default" 
          icon="comment-o"
          @click="focusCommentInput"
        >
          评论
        </van-button>
        
        <van-button 
          :type="postInfo.isCollected ? 'warning' : 'default'"
          :icon="postInfo.isCollected ? 'star' : 'star-o'"
          @click="handleCollect"
          :loading="collectLoading"
        >
          {{ postInfo.isCollected ? '已收藏' : '收藏' }}
        </van-button>
        
        <van-button 
          type="default" 
          icon="share-o"
          @click="handleShare"
        >
          分享
        </van-button>
      </div>

      <!-- 评论区域 -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>评论 ({{ comments.length }})</h3>
        </div>
        
        <div class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment-item"
          >
            <van-image
              :src="comment.author.avatar"
              round
              width="32"
              height="32"
              fit="cover"
              @click="goToUserProfile(comment.author.id)"
            />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author.nickname }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
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
              </div>
              
              <!-- 回复列表 -->
              <div v-if="comment.replies && comment.replies.length" class="replies-list">
                <div 
                  v-for="reply in comment.replies" 
                  :key="reply.id" 
                  class="reply-item"
                >
                  <span class="reply-author">{{ reply.author.nickname }}</span>
                  <span class="reply-target" v-if="reply.replyTo">回复 {{ reply.replyTo.nickname }}</span>
                  <span class="reply-content">: {{ reply.content }}</span>
                  <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <van-empty v-if="!comments.length" description="暂无评论，快来抢沙发吧~" />
      </div>
    </div>

    <!-- 评论输入框 -->
    <div class="comment-input-bar">
      <van-field
        ref="commentInputRef"
        v-model="commentText"
        placeholder="写下你的评论..."
        type="textarea"
        rows="1"
        autosize
        maxlength="200"
        show-word-limit
      />
      <van-button 
        type="primary" 
        size="small"
        @click="submitComment"
        :disabled="!commentText.trim()"
        :loading="commentLoading"
      >
        发送
      </van-button>
    </div>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="onActionSelect"
    />

    <!-- 分享面板 -->
    <van-share-sheet
      v-model:show="showShareSheet"
      title="立即分享给好友"
      :options="shareOptions"
      @select="onShareSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showSuccessToast, showConfirmDialog, showImagePreview, showToast } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const postId = route.params.id
const commentInputRef = ref(null)

// 响应式数据
const postInfo = ref(null)
const comments = ref([])
const commentText = ref('')
const isFollowed = ref(false)
const followLoading = ref(false)
const likeLoading = ref(false)
const collectLoading = ref(false)
const commentLoading = ref(false)
const showActionSheet = ref(false)
const showShareSheet = ref(false)

// 计算属性
const isAuthor = computed(() => {
  return postInfo.value && userStore.user && postInfo.value.author.id === userStore.user.id
})

// 操作菜单
const actionSheetActions = computed(() => {
  const actions = []
  if (isAuthor.value) {
    actions.push(
      { name: '编辑动态', value: 'edit' },
      { name: '删除动态', value: 'delete', color: '#ee0a24' }
    )
  } else {
    actions.push(
      { name: '举报动态', value: 'report' },
      { name: '拉黑用户', value: 'block' }
    )
  }
  actions.push({ name: '取消', value: 'cancel' })
  return actions
})

// 分享选项
const shareOptions = [
  { name: '复制链接', icon: 'link', value: 'copy' },
]

// 方法
const handleBack = () => {
  router.back()
}

const goToUserProfile = (userId = null) => {
  const targetUserId = userId || postInfo.value.author.id
  router.push(`/user/${targetUserId}`)
}

const previewImages = (images, index) => {
  showImagePreview({
    images,
    startPosition: index,
  })
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  followLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isFollowed.value) {
      isFollowed.value = false
      showSuccessToast('已取消关注')
    } else {
      isFollowed.value = true
      showSuccessToast('关注成功')
    }
  } finally {
    followLoading.value = false
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  likeLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (postInfo.value.isLiked) {
      postInfo.value.isLiked = false
      postInfo.value.likesCount = Math.max(0, (postInfo.value.likesCount || 1) - 1)
      showSuccessToast('已取消点赞')
    } else {
      postInfo.value.isLiked = true
      postInfo.value.likesCount = (postInfo.value.likesCount || 0) + 1
      showSuccessToast('点赞成功')
    }
  } finally {
    likeLoading.value = false
  }
}

const handleCollect = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  collectLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (postInfo.value.isCollected) {
      postInfo.value.isCollected = false
      postInfo.value.collectsCount = Math.max(0, (postInfo.value.collectsCount || 1) - 1)
      showSuccessToast('已取消收藏')
    } else {
      postInfo.value.isCollected = true
      postInfo.value.collectsCount = (postInfo.value.collectsCount || 0) + 1
      showSuccessToast('收藏成功')
    }
  } finally {
    collectLoading.value = false
  }
}

const handleShare = () => {
  showShareSheet.value = true
}

const focusCommentInput = () => {
  nextTick(() => {
    commentInputRef.value?.focus()
  })
}

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (!commentText.value.trim()) {
    showToast('请输入评论内容')
    return
  }
  
  commentLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newComment = {
      id: Date.now(),
      author: {
        id: userStore.user.id,
        nickname: userStore.user.nickname,
        avatar: userStore.user.avatar
      },
      content: commentText.value.trim(),
      createTime: new Date(),
      likesCount: 0,
      isLiked: false,
      replies: []
    }
    
    comments.value.unshift(newComment)
    postInfo.value.commentsCount = (postInfo.value.commentsCount || 0) + 1
    commentText.value = ''
    
    showSuccessToast('评论成功')
  } finally {
    commentLoading.value = false
  }
}

const likeComment = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    if (comment.isLiked) {
      comment.isLiked = false
      comment.likesCount = Math.max(0, comment.likesCount - 1)
    } else {
      comment.isLiked = true
      comment.likesCount = (comment.likesCount || 0) + 1
    }
  } catch (error) {
    showToast('操作失败')
  }
}

const replyComment = (comment) => {
  showToast('回复功能开发中')
}

const onActionSelect = (action) => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'edit':
      showToast('编辑动态功能开发中')
      break
    case 'delete':
      showConfirmDialog({
        title: '确认删除',
        message: '删除后无法恢复，确定要删除这条动态吗？',
      }).then(() => {
        showSuccessToast('删除成功')
        router.back()
      })
      break
    case 'report':
      showToast('举报功能开发中')
      break
    case 'block':
      showConfirmDialog({
        title: '确认拉黑',
        message: '拉黑后将无法查看该用户的动态',
      }).then(() => {
        showSuccessToast('已拉黑该用户')
      })
      break
  }
}

const onShareSelect = async (option) => {
  showShareSheet.value = false
  
  switch (option.value) {
    case 'copy':
      try {
        const url = `${window.location.origin}/post/${postId}`
        await navigator.clipboard.writeText(url)
        showSuccessToast('链接已复制到剪贴板')
      } catch (error) {
        // 兜底方案
        const textArea = document.createElement('textarea')
        textArea.value = `${window.location.origin}/post/${postId}`
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        showSuccessToast('链接已复制到剪贴板')
      }
      break
  }
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 初始化数据
const initPostData = () => {
  // 模拟动态详情数据
  postInfo.value = {
    id: postId,
    author: {
      id: 'user123',
      nickname: '示例用户',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
    },
    content: '今天去了一个很美的地方，风景如画！分享给大家看看，希望大家也能有机会去体验一下大自然的美好。这里的空气特别清新，让人心情愉悦。',
    images: [
      'https://img.yzcdn.cn/vant/cat.jpeg',
      'https://img.yzcdn.cn/vant/cat.jpeg',
      'https://img.yzcdn.cn/vant/cat.jpeg'
    ],
    location: '杭州·西湖',
    createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likesCount: 45,
    commentsCount: 12,
    collectsCount: 8,
    isLiked: false,
    isCollected: false
  }
  
  // 模拟评论数据
  comments.value = [
    {
      id: 1,
      author: {
        id: 'user456',
        nickname: '评论用户A',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      content: '很棒的分享！这个地方确实很美，我也想去看看。',
      createTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      likesCount: 5,
      isLiked: false,
      replies: [
        {
          id: 11,
          author: {
            id: 'user789',
            nickname: '用户B'
          },
          replyTo: {
            nickname: '评论用户A'
          },
          content: '我也想去！',
          createTime: new Date(Date.now() - 30 * 60 * 1000)
        }
      ]
    },
    {
      id: 2,
      author: {
        id: 'user789',
        nickname: '评论用户B',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      content: '照片拍得真好，技术不错！',
      createTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      likesCount: 3,
      isLiked: true,
      replies: []
    }
  ]
  
  // 模拟关注状态
  isFollowed.value = Math.random() > 0.5
}

onMounted(() => {
  initPostData()
})
</script>

<style lang="scss" scoped>
.post-detail {
  background-color: var(--background-primary);
  min-height: 100vh;
  padding-bottom: 60px;
}

.post-detail-content {
  padding: var(--spacing-sm);
}

.author-info {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  cursor: pointer;
  
  .author-details {
    flex: 1;
    margin-left: var(--spacing-sm);
    
    h4 {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--text-primary);
      font-size: var(--font-size-md);
    }
    
    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
  }
}

.post-content {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  .post-text {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-primary);
    line-height: 1.6;
    font-size: var(--font-size-md);
  }
  
  .post-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    
    .van-image {
      aspect-ratio: 1;
      border-radius: var(--border-radius-sm);
    }
    
    &:has(.van-image:nth-child(1):nth-last-child(1)) {
      grid-template-columns: 1fr;
      max-width: 300px;
    }
    
    &:has(.van-image:nth-child(1):nth-last-child(2)) {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  .post-location {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    
    .van-icon {
      color: var(--primary-color);
    }
  }
}

.post-stats {
  display: flex;
  justify-content: space-around;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  .stats-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    
    .van-icon {
      color: var(--primary-color);
    }
  }
}

.post-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  
  .van-button {
    flex: 1;
  }
}

.comments-section {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  
  .comments-header {
    margin-bottom: var(--spacing-md);
    
    h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: var(--font-size-lg);
    }
  }
  
  .comment-item {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .comment-content {
      flex: 1;
      
      .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
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
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
        line-height: 1.4;
      }
      
      .comment-actions {
        display: flex;
        gap: var(--spacing-md);
        
        .comment-like, .comment-reply {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--text-secondary);
          font-size: var(--font-size-xs);
          cursor: pointer;
          
          &.liked {
            color: var(--primary-color);
          }
          
          &:hover {
            opacity: 0.8;
          }
        }
      }
      
      .replies-list {
        margin-top: var(--spacing-sm);
        padding-left: var(--spacing-md);
        border-left: 2px solid var(--border-color);
        
        .reply-item {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
          line-height: 1.4;
          
          .reply-author {
            color: var(--primary-color);
            font-weight: 500;
          }
          
          .reply-target {
            color: var(--text-secondary);
          }
          
          .reply-content {
            color: var(--text-primary);
          }
          
          .reply-time {
            margin-left: var(--spacing-sm);
          }
        }
      }
    }
  }
}

.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--background-secondary);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
  
  .van-field {
    flex: 1;
    background: var(--background-primary);
    border-radius: var(--border-radius-md);
  }
}
</style>