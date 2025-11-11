<template>
  <div class="note-detail">
    <van-nav-bar 
      title="笔记详情" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="ellipsis" @click="showActionSheet = true" />
      </template>
    </van-nav-bar>

    <div class="note-detail-content" v-if="noteInfo">
      <!-- 作者信息 -->
      <div class="author-info" @click="goToUserProfile">
        <van-image
          :src="noteInfo.author.avatar"
          round
          width="40"
          height="40"
          fit="cover"
        />
        <div class="author-details">
          <h4>{{ noteInfo.author.nickname }}</h4>
          <p>{{ formatTime(noteInfo.createTime) }}</p>
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

      <!-- 笔记内容 -->
      <div class="note-content">
        <h2 class="note-title">{{ noteInfo.title }}</h2>
        
        <!-- 笔记标签 -->
        <div v-if="noteInfo.tags && noteInfo.tags.length" class="note-tags">
          <van-tag 
            v-for="tag in noteInfo.tags" 
            :key="tag"
            type="primary"
            plain
            size="small"
          >
            # {{ tag }}
          </van-tag>
        </div>
        
        <!-- 笔记正文 -->
        <div class="note-body" v-html="noteInfo.content"></div>
        
        <!-- 笔记图片 -->
        <div v-if="noteInfo.images && noteInfo.images.length" class="note-images">
          <van-image
            v-for="(image, index) in noteInfo.images"
            :key="index"
            :src="image"
            fit="cover"
            @click="previewImages(noteInfo.images, index)"
          />
        </div>

        <!-- 位置信息 -->
        <div v-if="noteInfo.location" class="note-location">
          <van-icon name="location-o" />
          <span>{{ noteInfo.location }}</span>
        </div>

        <!-- 笔记分类 -->
        <div v-if="noteInfo.category" class="note-category">
          <van-icon name="bookmark-o" />
          <span>{{ noteInfo.category }}</span>
        </div>
      </div>

      <!-- 互动数据 -->
      <div class="note-stats">
        <div class="stats-item">
          <van-icon name="good-job-o" />
          <span>{{ noteInfo.likesCount || 0 }}人点赞</span>
        </div>
        <div class="stats-item">
          <van-icon name="comment-o" />
          <span>{{ noteInfo.commentsCount || 0 }}条评论</span>
        </div>
        <div class="stats-item">
          <van-icon name="star-o" />
          <span>{{ noteInfo.collectsCount || 0 }}次收藏</span>
        </div>
        <div class="stats-item">
          <van-icon name="eye-o" />
          <span>{{ noteInfo.viewsCount || 0 }}次浏览</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="note-actions">
        <van-button 
          :type="noteInfo.isLiked ? 'danger' : 'default'" 
          :icon="noteInfo.isLiked ? 'good-job' : 'good-job-o'"
          @click="handleLike"
          :loading="likeLoading"
        >
          {{ noteInfo.isLiked ? '已赞' : '点赞' }}
        </van-button>
        
        <van-button 
          type="default" 
          icon="comment-o"
          @click="() => {}"
        >
          评论
        </van-button>
        
        <van-button 
          :type="noteInfo.isCollected ? 'warning' : 'default'"
          :icon="noteInfo.isCollected ? 'star' : 'star-o'"
          @click="handleCollect"
          :loading="collectLoading"
        >
          {{ noteInfo.isCollected ? '已收藏' : '收藏' }}
        </van-button>
        
        <van-button 
          type="default" 
          icon="share-o"
          @click="handleShare"
        >
          分享
        </van-button>
      </div>

      <!-- 相关笔记推荐 -->
      <div v-if="relatedNotes.length" class="related-notes">
        <h3>相关笔记</h3>
        <div class="related-list">
          <div 
            v-for="note in relatedNotes" 
            :key="note.id"
            class="related-item"
            @click="goToNote(note.id)"
          >
            <van-image
              :src="note.cover"
              width="60"
              height="60"
              fit="cover"
            />
            <div class="related-info">
              <h4>{{ note.title }}</h4>
              <p>{{ note.summary }}</p>
              <div class="related-meta">
                <span>{{ note.author.nickname }}</span>
                <span>{{ note.likesCount }}赞</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论区域 -->
      <CommentComponent
        :target-id="noteId"
        target-type="note"
        :comment-count="noteInfo?.commentsCount || 0"
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
      title="分享到"
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
import { noteApi } from '@/api'

import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const noteId = route.params.id
const noteIdStr = Array.isArray(noteId) ? noteId[0] : String(noteId)

// 类型定义
interface Author {
  id: string
  nickname: string
  avatar: string
}

interface NoteInfo {
  id: string
  title: string
  content: string
  images?: string[]
  tags?: string[]
  location?: string
  category?: string
  author: Author
  createTime: string | Date
  updateTime?: string
  likesCount?: number
  commentsCount?: number
  collectsCount?: number
  viewsCount?: number
  isLiked: boolean
  isCollected: boolean
}

interface RelatedNote {
  id: string
  title: string
  summary: string
  cover: string
  author: {
    nickname: string
  }
  likesCount: number
}

interface ActionSheetAction {
  name: string
  value: string
  color?: string
}

// 响应式数据
const noteInfo = ref<NoteInfo | null>(null)
const relatedNotes = ref<RelatedNote[]>([])
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
} = useComment('note', Array.isArray(noteId) ? noteId[0] : noteId)

// 使用拉黑 hooks
const { blockUser } = useBlock()

// 计算属性
const isAuthor = computed<boolean>(() => {
  return !!(noteInfo.value && userStore.userInfo && noteInfo.value.author.id === userStore.userInfo.id)
})

// 操作菜单
const actionSheetActions = computed<ActionSheetAction[]>(() => {
  const actions: ActionSheetAction[] = []
  if (isAuthor.value) {
    actions.push(
      { name: '编辑笔记', value: 'edit' },
      { name: '删除笔记', value: 'delete', color: '#ee0a24' }
    )
  } else {
    actions.push(
      { name: '举报笔记', value: 'report' },
      { name: '拉黑用户', value: 'block' }
    )
  }
  actions.push({ name: '取消', value: 'cancel' })
  return actions
})

// 方法
const handleBack = (): void => {
  router.back()
}

const goToUserProfile = (userId: string | null = null): void => {
  const targetUserId = userId || noteInfo.value?.author.id
  router.push(`/user/${targetUserId}`)
}

const goToNote = (id: string): void => {
  router.push(`/note/${id}`)
}

const previewImages = (images: string[], index: number): void => {
  showImagePreview({
    images,
    startPosition: index,
  })
}

const handleFollow = async (): Promise<void> => {
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

const handleLike = async (): Promise<void> => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  likeLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (noteInfo.value.isLiked) {
      noteInfo.value.isLiked = false
      noteInfo.value.likesCount = Math.max(0, (noteInfo.value.likesCount || 1) - 1)
      showSuccessToast('已取消点赞')
    } else {
      noteInfo.value.isLiked = true
      noteInfo.value.likesCount = (noteInfo.value.likesCount || 0) + 1
      showSuccessToast('点赞成功')
    }
  } finally {
    likeLoading.value = false
  }
}

const handleCollect = async (): Promise<void> => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  collectLoading.value = true
  try {
    if (noteInfo.value?.isCollected) {
      await noteApi.uncollectNote(noteIdStr)
      noteInfo.value.isCollected = false
      noteInfo.value.collectsCount = Math.max(0, (noteInfo.value.collectsCount || 1) - 1)
      showSuccessToast('已取消收藏')
    } else {
      await noteApi.collectNote(noteIdStr)
      noteInfo.value.isCollected = true
      noteInfo.value.collectsCount = (noteInfo.value.collectsCount || 0) - 0 + 1
      showSuccessToast('收藏成功')
    }
  } catch (e: any) {
    showFailToast(e?.message || '操作失败')
  } finally {
    collectLoading.value = false
  }
}

const handleShare = (): void => {
  if (noteInfo.value) {
    const shareData = {
      title: `${noteInfo.value.author.nickname}的笔记`,
      content: noteInfo.value.title,
      url: `${window.location.origin}/note/${noteId}`,
      type: 'note'
    }
    openShareSheet(shareData)
  }
}



const onActionSelect = (action: ActionSheetAction): void => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'edit':
      showToast('编辑笔记功能开发中')
      break
    case 'delete':
      showConfirmDialog({
        title: '确认删除',
        message: '删除后无法恢复，确定要删除这篇笔记吗？',
      }).then(() => {
        showSuccessToast('删除成功')
        router.back()
      })
      break
    case 'report':
      if (noteInfo.value) {
        showReportConfirm({
          id: noteInfo.value.id,
          content: noteInfo.value.title,
          author: noteInfo.value.author
        }, 'note')
      }
      break
    case 'block':
      if (noteInfo.value?.author) {
        blockUser(noteInfo.value.author)
      }
      break
  }
}



const formatTime = (time: string): string => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 加载笔记详情
const loadNoteDetail = async (): Promise<void> => {
  try {
    const res = await noteApi.getNoteDetail(noteIdStr)
    noteInfo.value = {
      id: res.id,
      title: res.title,
      content: res.content || '',
      images: res.images || [],
      tags: res.tags || [],
      category: res.category || '',
      author: {
        id: res.user?.id || res.userId,
        nickname: res.user?.nickname || '',
        avatar: res.user?.avatar || ''
      },
      createTime: res.createTime,
      likesCount: res.likeCount || 0,
      commentsCount: undefined,
      collectsCount: res.collectCount || 0,
      viewsCount: undefined,
      isLiked: !!res.isLiked,
      isCollected: !!res.isCollected
    }
  } catch (e) {
    showFailToast('加载笔记失败')
  }
}

// 加载相关笔记
const loadRelatedNotes = async (): Promise<void> => {
  try {
    const page = await noteApi.getNotes({ page: 1, pageSize: 5, category: noteInfo.value?.category || undefined })
    relatedNotes.value = (page?.list || [])
      .filter(n => n.id !== noteIdStr)
      .map(n => ({
        id: n.id,
        title: n.title,
        summary: (n.content || '').slice(0, 80),
        cover: (n.images && n.images.length > 0) ? n.images[0] : '',
        author: { nickname: n.user?.nickname || '' },
        likesCount: n.likeCount || 0
      }))
  } catch (e) {
    // 保持静默，相关笔记非关键路径
  }
}

onMounted(async () => {
  await loadNoteDetail()
  await loadRelatedNotes()
  try {
    await getComments()
  } catch {}
})
</script>

<style lang="scss" scoped>
.note-detail {
  background-color: var(--background-primary);
  min-height: 100vh;
  padding-bottom: 60px;
}

.note-detail-content {
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

.note-content {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  
  .note-title {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-primary);
    font-size: var(--font-size-xl);
    font-weight: bold;
    line-height: 1.4;
  }
  
  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-lg);
    
    .van-tag {
      margin: 0;
    }
  }
  
  .note-body {
    color: var(--text-primary);
    line-height: 1.8;
    font-size: var(--font-size-md);
    margin-bottom: var(--spacing-lg);
    
    :deep(h3) {
      color: var(--text-primary);
      font-size: var(--font-size-lg);
      margin: var(--spacing-lg) 0 var(--spacing-md) 0;
    }
    
    :deep(ul), :deep(ol) {
      padding-left: var(--spacing-lg);
      margin: var(--spacing-md) 0;
      
      li {
        margin-bottom: var(--spacing-xs);
        line-height: 1.6;
      }
    }
    
    :deep(p) {
      margin: var(--spacing-md) 0;
    }
  }
  
  .note-images {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    
    .van-image {
      aspect-ratio: 16/9;
      border-radius: var(--border-radius-sm);
    }
    
    &:has(.van-image:nth-child(1):nth-last-child(1)) {
      grid-template-columns: 1fr;
    }
  }
  
  .note-location, .note-category {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
    
    .van-icon {
      color: var(--primary-color);
    }
  }
}

.note-stats {
  display: flex;
  justify-content: space-around;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  .stats-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    
    .van-icon {
      color: var(--primary-color);
    }
  }
}

.note-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  
  .van-button {
    flex: 1;
  }
}

.related-notes {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  h3 {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
  }
  
  .related-item {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      opacity: 0.8;
    }
    
    .related-info {
      flex: 1;
      
      h4 {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-primary);
        font-size: var(--font-size-md);
      }
      
      p {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }
      
      .related-meta {
        display: flex;
        gap: var(--spacing-md);
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }
    }
  }
}


</style>