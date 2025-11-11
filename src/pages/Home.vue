<template>
  <div 
    class="home" 
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <van-nav-bar title="动态" fixed>
      <template #right>
        <van-dropdown-menu>
          <van-dropdown-item>
            <template #title>
              <van-icon name="ellipsis" />
            </template>
            <van-cell title="发布动态" icon="edit" @click="goToPublish" />
            <van-cell title="发布笔记" icon="notes-o" @click="goToNote" />
            <van-cell title="笔记广场" icon="friends-o" @click="goToNoteSquare" />
            <van-cell title="搜索" icon="search" @click="showSearchMode" />
          </van-dropdown-item>
        </van-dropdown-menu>
      </template>
    </van-nav-bar>
    
    <van-search
      v-show="showSearch"
      v-model="searchValue"
      placeholder="搜索笔记内容"
      @search="onSearch"
      @cancel="showSearch = false"
    />

    <!-- 笔记列表 -->
    <div class="notes-list">
      <div 
        v-for="note in filteredNotes" 
        :key="note.id" 
        class="note-item"
        @click="viewNote(note)"
      >
        <div class="note-header">
          <van-image
            :src="note.avatar"
            round
            width="40"
            height="40"
            class="avatar"
            @click.stop="viewUserProfile(note.userId)"
          >
            <template #error>
              <van-icon name="user-circle-o" size="40" />
            </template>
          </van-image>
          <div class="user-info" @click.stop="viewUserProfile(note.userId)">
            <div class="username">{{ note.username }}</div>
            <div class="time">{{ formatTime(note.createTime) }}</div>
          </div>
          <van-icon name="ellipsis" class="more-btn" @click.stop="showMoreActions(note)" />
        </div>
        
        <div class="note-content">
          <p class="text">{{ note.content }}</p>
          <div v-if="note.images && note.images.length" class="images">
            <van-image
              v-for="(img, index) in note.images"
              :key="index"
              :src="img"
              width="80"
              height="80"
              class="note-image"
              @click.stop="previewImage(note.images, index)"
            />
          </div>
          <div v-if="note.location" class="location">
            <van-icon name="location-o" />
            <span>{{ note.location }}</span>
          </div>
        </div>
        
        <div class="note-actions">
          <div class="action-item" @click.stop="toggleLike(note)">
            <van-icon :name="note.isLiked ? 'good-job' : 'good-job-o'" :color="note.isLiked ? '#ee0a24' : ''" />
            <span>{{ note.likeCount || 0 }}</span>
          </div>
          <div class="action-item" @click.stop="showComments(note)">
            <van-icon name="chat-o" />
            <span>{{ note.commentCount || 0 }}</span>
          </div>
          <div class="action-item" @click.stop="shareNote(note)">
            <van-icon name="share-o" />
            <span>分享</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <van-loading v-if="loading" class="loading-more">加载中...</van-loading>
    
    <!-- 空状态 -->
    <van-empty v-if="!loading && filteredNotes.length === 0" description="暂无动态" />

    <!-- 分享面板 -->
    <van-share-sheet
      v-model:show="showShareSheet"
      title="分享到"
      :options="shareOptions"
      @select="onShareSelect"
      @cancel="onShareCancel"
    />

    <!-- 更多操作面板 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="moreActions"
      @select="onActionSelect"
    />

    <!-- 举报对话框 -->
    <ReportDialog
      v-model:show="showReportTypeDialog"
      :report-types="reportTypes"
      :loading="reportLoading"
      @submit="submitReport"
      @cancel="showReportTypeDialog = false"
    />

    <!-- 评论弹窗 -->
    <van-popup v-model:show="showCommentPopup" position="bottom" :style="{ height: '70%' }">
      <div class="comment-popup">
        <van-nav-bar 
          title="评论" 
          left-text="取消" 
          @click-left="showCommentPopup = false"
        />
        
        <CommentComponent
          v-if="currentNote"
          :target-id="currentNote.id"
          target-type="post"
          @comment-count-change="handleCommentCountChange"
        />
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { showSuccessToast, showImagePreview, showDialog, showConfirmDialog, showFailToast } from 'vant'
import { useShare } from '../hooks/useShare'
import { useReport } from '../hooks/useReport'
import { useComment } from '../hooks/useComment'
import { postApi } from '@/api'
import ReportDialog from '../components/ReportDialog.vue'
import CommentComponent from '../components/CommentComponent.vue'
import dayjs from 'dayjs'

// 注册组件
defineOptions({
  components: {
    ReportDialog
  }
})

const router = useRouter()

// 类型定义
interface Note {
  id: string
  title: string
  content: string
  images?: string[]
  user: {
    id: string
    nickname: string
    avatar: string
  }
  likeCount: number
  commentCount: number
  shareCount: number
  isLiked: boolean
  createTime: string
}

const searchValue = ref<string>('')
const showSearch = ref<boolean>(false)
const loading = ref<boolean>(false)
const showActionSheet = ref<boolean>(false)
const showCommentPopup = ref<boolean>(false)
const currentNote = ref<Note | null>(null)

// 长按相关
const longPressTimer = ref<NodeJS.Timeout | null>(null)
const isLongPress = ref<boolean>(false)

// 使用分享 hooks
const {
  showShareSheet,
  shareOptions,
  onShareSelect,
  onShareCancel,
  sharePost
} = useShare()

// 使用举报 hooks
const {
  showReportDialog: showReportTypeDialog,
  reportTypes,
  reportLoading,
  submitReport,
  showReportConfirm,
  resetReportState
} = useReport()

// 使用评论 hooks
const { comments } = useComment()

// 类型定义
interface HomeNote {
  id: number
  userId: string
  username: string
  avatar: string
  content: string
  images: string[]
  location: string
  createTime: Date
  likeCount: number
  commentCount: number
  isLiked: boolean
}

// 动态数据
const notes = ref<HomeNote[]>([])

// 加载动态列表
const fetchPosts = async (keyword?: string) => {
  try {
    loading.value = true
    const res = await postApi.getPosts({ page: 1, pageSize: 20, keyword })
    notes.value = (res.list || []).map(p => ({
      id: Number(p.id),
      userId: p.user?.id || p.userId,
      username: p.user?.nickname || '',
      avatar: p.user?.avatar || '',
      content: p.content,
      images: p.images || [],
      location: '',
      createTime: new Date(p.createTime),
      likeCount: p.likeCount || 0,
      commentCount: p.commentCount || 0,
      isLiked: !!p.isLiked
    }))
  } catch (e) {
    showFailToast('加载动态失败')
  } finally {
    loading.value = false
  }
}

// 搜索过滤
const filteredNotes = computed(() => {
  if (!searchValue.value) return notes.value
  return notes.value.filter(note => 
    note.content.includes(searchValue.value) || 
    note.username.includes(searchValue.value)
  )
})

// 格式化时间
const formatTime = (time) => {
  const now = dayjs()
  const noteTime = dayjs(time)
  const diffMinutes = now.diff(noteTime, 'minute')
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`
  if (diffMinutes < 2880) return '昨天'
  return noteTime.format('MM-DD HH:mm')
}

// 跳转到发布页面
const goToPublish = () => {
  router.push('/publish')
}

// 跳转到笔记页面
const goToNote = () => {
  router.push('/note')
}

// 跳转到笔记广场
const goToNoteSquare = () => {
  router.push('/note-square')
}

// 显示搜索模式
const showSearchMode = () => {
  router.push('/search')
}

// 长按处理
const handleTouchStart = () => {
  isLongPress.value = false
  longPressTimer.value = setTimeout(() => {
    isLongPress.value = true
    // 长按2秒后进入纯文本发布模式
    router.push({
      path: '/publish',
      query: { mode: 'text-only' }
    })
    showSuccessToast('进入纯文本发布模式')
  }, 2000)
}

const handleTouchEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// 搜索
const onSearch = async (value) => {
  await fetchPosts(value)
}

// 点赞
const toggleLike = async (note) => {
  try {
    if (!note.id) return
    const idStr = String(note.id)
    if (note.isLiked) {
      await postApi.unlikePost(idStr)
      note.isLiked = false
      note.likeCount = Math.max(0, (note.likeCount || 1) - 1)
      showSuccessToast('已取消点赞')
    } else {
      await postApi.likePost(idStr)
      note.isLiked = true
      note.likeCount = (note.likeCount || 0) + 1
      showSuccessToast('点赞成功')
    }
  } catch (e) {
    showFailToast('操作失败，请稍后重试')
  }
}

// 查看用户详情
const viewUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 查看动态详情
const viewNote = (note) => {
  router.push(`/post/${note.id}`)
}

// 显示评论
const showComments = (note) => {
  currentNote.value = note
  showCommentPopup.value = true
}

// 处理评论数量变化
const handleCommentCountChange = (newCount) => {
  if (currentNote.value) {
    currentNote.value.commentCount = newCount
  }
}

// 分享动态 - 使用 hooks 中的方法
const shareNote = (note) => {
  sharePost(note)
}

// 更多操作
const showMoreActions = (note) => {
  currentNote.value = note
  showActionSheet.value = true
}

const moreActions = [
  { name: '举报', color: '#ee0a24' },
  { name: '不感兴趣' },
  { name: '取消' }
]

const onActionSelect = (action) => {
  showActionSheet.value = false
  
  switch (action.name) {
    case '举报':
      if (currentNote.value) {
        showReportConfirm({
          id: currentNote.value.id,
          content: currentNote.value.content,
          author: {
            id: currentNote.value.userId,
            nickname: currentNote.value.username
          }
        }, 'post')
      }
      break
    case '不感兴趣':
      if (currentNote.value) {
        showConfirmDialog({
          title: '确认操作',
          message: `确定要将"${currentNote.value.username}"的内容标记为不感兴趣吗？\n\n系统将减少推荐此类内容`,
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }).then(() => {
          // 用户确认后，从列表中移除这条笔记
          const noteIndex = notes.value.findIndex(note => note.id === currentNote.value.id)
          if (noteIndex > -1) {
            notes.value.splice(noteIndex, 1)
            showSuccessToast(`已标记为不感兴趣，将减少推荐此类内容`)
          }
        }).catch(() => {
          // 用户取消操作
        })
      }
      break
    default:
      break
  }
}



// 预览图片
const previewImage = (images, startPosition) => {
  showImagePreview({
    images,
    startPosition
  })
}

onMounted(() => {
  fetchPosts()
})
</script>

<style lang="scss" scoped>
.home {
  background-color: var(--background-primary);
  min-height: 100%;
  padding-top: 46px; // navbar height
}

.notes-list {
  padding: var(--spacing-sm);
}

.note-item {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.note-header {
  @include flex-between;
  margin-bottom: var(--spacing-md);
  
  .avatar {
    margin-right: var(--spacing-sm);
  }
  
  .user-info {
    flex: 1;
    
    .username {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: var(--spacing-xs);
    }
    
    .time {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
  
  .more-btn {
    color: var(--text-secondary);
    cursor: pointer;
  }
}

.note-content {
  .text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .images {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
    
    .note-image {
      border-radius: var(--border-radius-sm);
      cursor: pointer;
    }
  }
  
  .location {
    display: flex;
    align-items: center;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
    
    .van-icon {
      margin-right: var(--spacing-xs);
    }
  }
}

.note-actions {
  display: flex;
  justify-content: space-around;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  
  .action-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: var(--transition-base);
    
    &:hover {
      background-color: var(--background-primary);
    }
    
    .van-icon {
      font-size: var(--font-size-lg);
    }
    
    span {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.loading-more {
  text-align: center;
  padding: var(--spacing-lg);
}

.comment-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>