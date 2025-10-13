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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showImagePreview, ActionSheet, ShareSheet } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()

const searchValue = ref('')
const showSearch = ref(false)
const loading = ref(false)

// 长按相关
const longPressTimer = ref(null)
const isLongPress = ref(false)

// 模拟笔记数据
const notes = ref([
  {
    id: 1,
    userId: 'user001',
    username: '小明',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    content: '今天天气真好，出去走走心情都变好了！生活中总有很多美好的瞬间值得记录。',
    images: [],
    location: '北京·朝阳公园',
    createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likeCount: 12,
    commentCount: 3,
    isLiked: false
  },
  {
    id: 2,
    userId: 'user002',
    username: '小红',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    content: '今天学会了一道新菜，味道还不错！分享给大家～',
    images: ['https://img.yzcdn.cn/vant/cat.jpeg'],
    location: '上海·徐汇区',
    createTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    likeCount: 8,
    commentCount: 5,
    isLiked: true
  },
  {
    id: 3,
    userId: 'user003',
    username: '阿强',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    content: '工作再忙也要记得照顾好自己，健康最重要！',
    images: [],
    location: '深圳·南山区',
    createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likeCount: 15,
    commentCount: 2,
    isLiked: false
  },
  {
    id: 4,
    userId: 'user004',
    username: '小李',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    content: '周末读了一本好书，推荐给大家。书中有句话特别喜欢：生活不只是眼前的苟且，还有诗和远方。',
    images: ['https://img.yzcdn.cn/vant/cat.jpeg', 'https://img.yzcdn.cn/vant/cat.jpeg'],
    location: '广州·天河区',
    createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likeCount: 20,
    commentCount: 8,
    isLiked: true
  }
])

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
const onSearch = (value) => {
  showSuccessToast(`搜索: ${value}`)
}

// 点赞
const toggleLike = (note) => {
  note.isLiked = !note.isLiked
  note.likeCount += note.isLiked ? 1 : -1
  showSuccessToast(note.isLiked ? '已点赞' : '已取消点赞')
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
  showSuccessToast(`查看评论: ${note.commentCount}条`)
}

// 分享动态
const shareNote = (note) => {
  ShareSheet({
    title: '立即分享给好友',
    options: [
      { name: '复制链接', icon: 'link' }
    ],
    onSelect: async (option) => {
      if (option.name === '复制链接') {
        try {
          const url = `${window.location.origin}/post/${note.id}`
          await navigator.clipboard.writeText(url)
          showSuccessToast('链接已复制到剪贴板')
        } catch (error) {
          // 兜底方案
          const textArea = document.createElement('textarea')
          textArea.value = `${window.location.origin}/post/${note.id}`
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          showSuccessToast('链接已复制到剪贴板')
        }
      }
    }
  })
}

// 更多操作
const showMoreActions = (note) => {
  ActionSheet({
    actions: [
      { name: '举报', color: '#ee0a24' },
      { name: '不感兴趣' },
      { name: '取消' }
    ],
    onSelect: (action) => {
      showSuccessToast(`选择了: ${action.name}`)
    }
  })
}

// 预览图片
const previewImage = (images, startPosition) => {
  showImagePreview({
    images,
    startPosition
  })
}

onMounted(() => {
  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
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
</style>