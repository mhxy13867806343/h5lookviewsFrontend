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
          @click="() => {}"
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
      <CommentComponent
        :target-id="postId"
        target-type="post"
        :comment-count="postInfo?.commentsCount || 0"
        :comments="commentList"
        :loading="commentLoading"
        @submit-comment="submitCommentHook"
        @like-comment="likeCommentHook"
        @delete-comment="deleteCommentHook"
        @load-more-replies="loadMoreRepliesHook"
      />
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
      @cancel="onShareCancel"
    />

    <!-- 举报对话框 -->
    <ReportDialog 
      v-model:show="showReportDialog" 
      :report-types="reportTypes"
      :loading="reportLoading"
      @submit="submitReport"
      @cancel="showReportDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/store'
import { useShare } from '../hooks/useShare'
import { useReport } from '../hooks/useReport'
import { useComment } from '../hooks/useComment'
import { useBlock } from '../hooks/useBlock'
import { showSuccessToast, showConfirmDialog, showImagePreview, showToast, showFailToast } from 'vant'
import dayjs from 'dayjs'
import ReportDialog from '../components/ReportDialog.vue'
import CommentComponent from '../components/CommentComponent.vue'
import { postApi } from '@/api'

// 类型定义
interface PostInfo {
  id: string | number
  content: string
  images?: string[]
  location?: string
  createTime: string
  likeCount: number
  commentCount: number
  shareCount: number
  isLiked: boolean
  isCollected: boolean
  author: {
    id: string
    nickname: string
    avatar: string
  }
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const postId = route.params.id as string

// 响应式数据
const postInfo = ref<PostInfo | null>(null)
const isFollowed = ref<boolean>(false)
const followLoading = ref<boolean>(false)
const likeLoading = ref<boolean>(false)
const collectLoading = ref<boolean>(false)
const showActionSheet = ref<boolean>(false)

// 使用分享 hooks
const {
  showShareSheet,
  shareOptions,
  onShareSelect,
  onShareCancel,
  openShareSheet
} = useShare()

// 使用举报 hooks
const {
  showReportDialog,
  showReportConfirm,
  reportTypes,
  reportLoading,
  submitReport
} = useReport()

// 使用评论 hooks
const {
  comments: commentList,
  loading: commentLoading,
  submitComment: submitCommentHook,
  likeComment: likeCommentHook,
  deleteComment: deleteCommentHook,
  loadMoreReplies: loadMoreRepliesHook,
  getComments
} = useComment('post', postId)

// 使用拉黑 hooks
const { blockUser } = useBlock()

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
    if (!postInfo.value) return
    const idStr = String(postInfo.value.id)
    if (postInfo.value.isLiked) {
      await postApi.unlikePost(idStr)
      postInfo.value.isLiked = false
      ;(postInfo.value as any).likesCount = Math.max(0, ((postInfo.value as any).likesCount || 1) - 1)
      showSuccessToast('已取消点赞')
    } else {
      await postApi.likePost(idStr)
      postInfo.value.isLiked = true
      ;(postInfo.value as any).likesCount = ((postInfo.value as any).likesCount || 0) + 1
      showSuccessToast('点赞成功')
    }
  } catch (e) {
    showFailToast('操作失败，请稍后重试')
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
  if (postInfo.value) {
    const shareData = {
      title: `${postInfo.value.author.nickname}的动态`,
      content: postInfo.value.content,
      url: `${window.location.origin}/post/${postInfo.value.id}`,
      type: 'post'
    }
    openShareSheet(shareData)
  }
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
      if (postInfo.value) {
        showReportConfirm({
          id: postInfo.value.id,
          content: postInfo.value.content,
          author: postInfo.value.author
        }, 'post')
      }
      break
    case 'block':
      if (postInfo.value?.author) {
        blockUser(postInfo.value.author)
      }
      break
  }
}



const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 加载详情
const fetchPostDetail = async () => {
  try {
    const res = await postApi.getPostDetail(String(postId))
    postInfo.value = {
      id: res.id,
      author: {
        id: res.user?.id || res.userId,
        nickname: res.user?.nickname || '',
        avatar: res.user?.avatar || ''
      },
      content: res.content,
      images: res.images || [],
      location: '',
      createTime: res.createTime,
      likeCount: res.likeCount || 0,
      commentCount: res.commentCount || 0,
      shareCount: res.shareCount || 0,
      isLiked: !!res.isLiked,
      isCollected: false
    } as any
  } catch (e) {
    showFailToast('加载详情失败')
  }
}

onMounted(() => {
  fetchPostDetail()
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


</style>