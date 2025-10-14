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
          @click="focusCommentInput"
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
        placeholder="写下你的想法..."
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

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/store'
import { useShare } from '../hooks/useShare.js'
import { useReport } from '../hooks/useReport.js'
import { showSuccessToast, showConfirmDialog, showImagePreview, showToast } from 'vant'
import dayjs from 'dayjs'
import ReportDialog from '../components/ReportDialog.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const noteId = route.params.id
const commentInputRef = ref(null)

// 响应式数据
const noteInfo = ref(null)
const relatedNotes = ref([])
const comments = ref([])
const commentText = ref('')
const isFollowed = ref(false)
const followLoading = ref(false)
const likeLoading = ref(false)
const collectLoading = ref(false)
const commentLoading = ref(false)
const showActionSheet = ref(false)

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

// 计算属性
const isAuthor = computed(() => {
  return noteInfo.value && userStore.user && noteInfo.value.author.id === userStore.user.id
})

// 操作菜单
const actionSheetActions = computed(() => {
  const actions = []
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
const handleBack = () => {
  router.back()
}

const goToUserProfile = (userId = null) => {
  const targetUserId = userId || noteInfo.value.author.id
  router.push(`/user/${targetUserId}`)
}

const goToNote = (id) => {
  router.push(`/note/${id}`)
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

const handleCollect = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  collectLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (noteInfo.value.isCollected) {
      noteInfo.value.isCollected = false
      noteInfo.value.collectsCount = Math.max(0, (noteInfo.value.collectsCount || 1) - 1)
      showSuccessToast('已取消收藏')
    } else {
      noteInfo.value.isCollected = true
      noteInfo.value.collectsCount = (noteInfo.value.collectsCount || 0) + 1
      showSuccessToast('收藏成功')
    }
  } finally {
    collectLoading.value = false
  }
}

const handleShare = () => {
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
      isLiked: false
    }
    
    comments.value.unshift(newComment)
    noteInfo.value.commentsCount = (noteInfo.value.commentsCount || 0) + 1
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
      showConfirmDialog({
        title: '确认拉黑',
        message: '拉黑后将无法查看该用户的内容',
      }).then(() => {
        showSuccessToast('已拉黑该用户')
      })
      break
  }
}



const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 初始化数据
const initNoteData = () => {
  // 模拟笔记详情数据
  noteInfo.value = {
    id: noteId,
    title: '如何制作美味的意大利面',
    author: {
      id: 'user123',
      nickname: '美食达人小王',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
    },
    content: `
      <p>今天给大家分享一个制作美味意大利面的方法，这是我在意大利学到的正宗做法。</p>
      
      <h3>准备材料：</h3>
      <ul>
        <li>意大利面条 200g</li>
        <li>番茄酱 3大勺</li>
        <li>大蒜 2瓣</li>
        <li>洋葱 半个</li>
        <li>橄榄油 适量</li>
        <li>帕尔马干酪 适量</li>
        <li>罗勒叶 几片</li>
      </ul>
      
      <h3>制作步骤：</h3>
      <ol>
        <li>将水烧开，加入适量盐，下入意大利面条煮8-10分钟至软硬适中</li>
        <li>热锅下橄榄油，爆香蒜蓉和洋葱丝</li>
        <li>加入番茄酱炒匀，调味</li>
        <li>将煮好的面条加入锅中，快速翻炒均匀</li>
        <li>撒上帕尔马干酪和罗勒叶即可</li>
      </ol>
      
      <p>这样做出来的意大利面口感丰富，酸甜适中，非常适合家庭制作。大家可以根据自己的喜好调整配料。</p>
    `,
    tags: ['美食', '意大利面', '家常菜', '烹饪技巧'],
    images: [
      'https://img.yzcdn.cn/vant/cat.jpeg',
      'https://img.yzcdn.cn/vant/cat.jpeg'
    ],
    location: '上海·浦东新区',
    category: '美食烹饪',
    createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likesCount: 128,
    commentsCount: 23,
    collectsCount: 45,
    viewsCount: 856,
    isLiked: false,
    isCollected: false
  }
  
  // 模拟相关笔记
  relatedNotes.value = [
    {
      id: 'note2',
      title: '法式焗蜗牛的制作方法',
      summary: '正宗法式料理，在家也能做',
      cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
      author: {
        nickname: '法式料理师傅'
      },
      likesCount: 89
    },
    {
      id: 'note3',
      title: '如何挑选新鲜的海鲜',
      summary: '海鲜挑选的小技巧分享',
      cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
      author: {
        nickname: '海鲜达人'
      },
      likesCount: 156
    }
  ]
  
  // 模拟评论数据
  comments.value = [
    {
      id: 1,
      author: {
        id: 'user456',
        nickname: '美食爱好者',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      content: '太棒了！按照这个方法做出来的意大利面真的很好吃，谢谢分享！',
      createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likesCount: 8,
      isLiked: false
    },
    {
      id: 2,
      author: {
        id: 'user789',
        nickname: '厨房小白',
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      content: '请问番茄酱用什么牌子的比较好？',
      createTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likesCount: 3,
      isLiked: true
    }
  ]
  
  // 模拟关注状态
  isFollowed.value = Math.random() > 0.5
}

onMounted(() => {
  initNoteData()
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