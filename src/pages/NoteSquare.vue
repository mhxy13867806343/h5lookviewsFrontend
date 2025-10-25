<template>
  <div class="note-square">
    <van-nav-bar title="笔记广场" left-arrow @click-left="handleBack">
      <template #right>
        <div class="navbar-actions">
          <van-icon name="plus" @click="goToNewNote" class="action-icon" />
          <van-icon name="search" @click="goToSearch" class="action-icon" />
        </div>
      </template>
    </van-nav-bar>
    
    <div class="note-square-content">
      <!-- 分类筛选 -->
      <div class="category-filter">
        <van-tabs v-model:active="activeCategory" @change="onCategoryChange" sticky>
          <van-tab title="全部" name="all" />
          <van-tab title="生活" name="life" />
          <van-tab title="学习" name="study" />
          <van-tab title="美食" name="food" />
          <van-tab title="旅行" name="travel" />
          <van-tab title="读书" name="book" />
        </van-tabs>
      </div>
      
      <!-- 笔记列表 -->
      <div class="notes-list">
        <div 
          v-for="note in filteredNotes" 
          :key="note.id" 
          class="note-card"
          @click="viewNoteDetail(note)"
        >
          <!-- 作者信息 -->
          <div class="note-author">
            <van-image
              :src="note.author.avatar"
              round
              width="36"
              height="36"
              class="author-avatar"
            >
              <template #error>
                <van-icon name="user-circle-o" size="36" />
              </template>
            </van-image>
            <div class="author-info">
              <div class="author-name">{{ note.author.name }}</div>
              <div class="publish-time">{{ formatTime(note.createTime) }}</div>
            </div>
            <van-button 
              size="small" 
              :type="note.author.isFollowed ? 'default' : 'primary'"
              @click.stop="toggleFollow(note.author)"
            >
              {{ note.author.isFollowed ? '已关注' : '关注' }}
            </van-button>
          </div>
          
          <!-- 笔记内容 -->
          <div class="note-content">
            <h3 class="note-title">{{ note.title || '无标题' }}</h3>
            <p class="note-text">{{ note.content.slice(0, 200) }}{{ note.content.length > 200 ? '...' : '' }}</p>
            
            <!-- 笔记图片 -->
            <div v-if="note.images && note.images.length" class="note-images">
              <van-image
                v-for="(img, index) in note.images.slice(0, 3)"
                :key="index"
                :src="img"
                width="80"
                height="80"
                fit="cover"
                class="note-image"
                @click.stop="previewImages(note.images, index)"
              />
              <div v-if="note.images.length > 3" class="more-images">
                +{{ note.images.length - 3 }}
              </div>
            </div>
            
            <!-- 分类标签 -->
            <div class="note-tags">
              <van-tag size="small" :color="note.categoryColor">{{ note.category }}</van-tag>
              <van-tag size="small" type="default">{{ note.content.length }}字</van-tag>
            </div>
          </div>
          
          <!-- 互动区域 -->
          <div class="note-actions">
            <div class="action-item" @click.stop="toggleLike(note)">
              <van-icon 
                :name="note.isLiked ? 'good-job' : 'good-job-o'" 
                :color="note.isLiked ? '#ee0a24' : ''"
              />
              <span>{{ note.likeCount || 0 }}</span>
            </div>
            <div class="action-item" @click.stop="showComments(note)">
              <van-icon name="chat-o" />
              <span>{{ note.commentCount || 0 }}</span>
            </div>
            <div class="action-item" @click.stop="toggleCollect(note)">
              <van-icon 
                :name="note.isCollected ? 'star' : 'star-o'" 
                :color="note.isCollected ? '#ff976a' : ''"
              />
              <span>{{ note.collectCount || 0 }}</span>
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
      <van-empty v-if="!loading && filteredNotes.length === 0" description="暂无笔记" />
    </div>
    
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
          target-type="note"
          @comment-count-change="handleCommentCountChange"
        />
      </div>
    </van-popup>

    <!-- 分享面板 -->
    <van-share-sheet
      v-model:show="showShareSheet"
      title="分享到"
      :options="shareOptions"
      @select="onShareSelect"
      @cancel="onShareCancel"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showImagePreview } from 'vant'
import { useShare } from '../hooks/useShare.js'
import { useComment } from '../hooks/useComment.js'
import CommentComponent from '../components/CommentComponent.vue'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const activeCategory = ref('all')
const loading = ref(false)
const showCommentPopup = ref(false)
const currentNote = ref(null)

// 使用分享 hooks
const {
  showShareSheet,
  shareOptions,
  onShareSelect,
  onShareCancel,
  shareNote: shareNoteWithHook
} = useShare()

// 使用评论 hooks
const { comments } = useComment()

// 模拟笔记数据
const notes = ref([
  {
    id: 1,
    title: 'Vue3 学习心得分享',
    content: 'Vue3 的 Composition API 真的很好用，可以让代码组织得更加清晰。今天学习了 ref 和 reactive 的区别，还有 computed 的使用方法。特别是在处理复杂逻辑时，Composition API 的优势非常明显，代码复用性也更强。推荐大家都来学习一下！',
    category: '学习',
    categoryColor: '#00b894',
    images: [],
    author: {
      id: 1,
      name: '前端小王',
      avatar: '',
      isFollowed: false
    },
    createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likeCount: 25,
    commentCount: 8,
    collectCount: 12,
    isLiked: false,
    isCollected: false
  },
  {
    id: 2,
    title: '今日美食制作记录',
    content: '今天尝试做了红烧肉，按照奶奶的秘方，用冰糖炒糖色，再加入老抽和生抽调色。肉质软烂，肥而不腻，瘦而不柴。配上一碗白米饭，简直是人间美味！分享一下制作过程和心得，希望大家也能做出美味的红烧肉。',
    category: '美食',
    categoryColor: '#fdcb6e',
    images: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
    author: {
      id: 2,
      name: '美食达人小李',
      avatar: '',
      isFollowed: true
    },
    createTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    likeCount: 42,
    commentCount: 15,
    collectCount: 28,
    isLiked: true,
    isCollected: true
  },
  {
    id: 3,
    title: '西藏之行感悟',
    content: '这次西藏之行真的让我收获很多。站在布达拉宫前，感受着那份庄严与神圣；走在八廓街上，体验着浓郁的藏族文化；在纳木错湖边，被那纯净的美景深深震撼。旅行不仅仅是看风景，更是一次心灵的洗礼。推荐大家有机会一定要去西藏走走。',
    category: '旅行',
    categoryColor: '#e84393',
    images: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
    author: {
      id: 3,
      name: '旅行摄影师',
      avatar: '',
      isFollowed: false
    },
    createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likeCount: 68,
    commentCount: 22,
    collectCount: 45,
    isLiked: false,
    isCollected: false
  },
  {
    id: 4,
    title: '《人类简史》读书笔记',
    content: '最近读完了尤瓦尔·赫拉利的《人类简史》，真的是一本让人思考的好书。作者从独特的角度解读了人类发展史，特别是关于认知革命、农业革命和科学革命的论述，让我对人类文明有了全新的认识。书中提到的一些观点很有启发性，比如虚构的力量如何推动人类合作等。',
    category: '读书',
    categoryColor: '#6c5ce7',
    images: ['https://via.placeholder.com/300x200'],
    author: {
      id: 4,
      name: '书虫小张',
      avatar: '',
      isFollowed: false
    },
    createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likeCount: 31,
    commentCount: 12,
    collectCount: 18,
    isLiked: false,
    isCollected: false
  },
  {
    id: 5,
    title: '周末生活随记',
    content: '周末的阳光特别好，和朋友们一起去公园野餐。准备了三明治、水果和饮料，在草地上铺个毯子，聊天、游戏、拍照，度过了愉快的下午时光。生活中这样简单的快乐时刻其实是最珍贵的，让人感到满足和幸福。',
    category: '生活',
    categoryColor: '#74b9ff',
    images: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
    author: {
      id: 5,
      name: '生活记录者',
      avatar: '',
      isFollowed: true
    },
    createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likeCount: 19,
    commentCount: 6,
    collectCount: 8,
    isLiked: false,
    isCollected: false
  }
])



// 计算属性
const filteredNotes = computed(() => {
  if (activeCategory.value === 'all') return notes.value
  
  const categoryMap = {
    life: '生活',
    study: '学习',
    food: '美食',
    travel: '旅行',
    book: '读书'
  }
  
  return notes.value.filter(note => note.category === categoryMap[activeCategory.value])
})



// 方法
const handleBack = () => {
  router.back()
}

const goToSearch = () => {
  router.push('/search')
}

const goToNewNote = () => {
  router.push('/note')
}

const onCategoryChange = () => {
  // 分类变化时的处理
}

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

const toggleFollow = (author) => {
  author.isFollowed = !author.isFollowed
  showSuccessToast(author.isFollowed ? '已关注' : '已取消关注')
}

const toggleLike = (note) => {
  note.isLiked = !note.isLiked
  note.likeCount += note.isLiked ? 1 : -1
  showSuccessToast(note.isLiked ? '已点赞' : '已取消点赞')
}

const toggleCollect = (note) => {
  note.isCollected = !note.isCollected
  note.collectCount += note.isCollected ? 1 : -1
  showSuccessToast(note.isCollected ? '已收藏' : '已取消收藏')
}

// 分享笔记 - 使用 hooks 中的方法
const shareNote = (note) => {
  shareNoteWithHook(note)
}

const showComments = (note) => {
  currentNote.value = note
  showCommentPopup.value = true
}

const handleCommentCountChange = (newCount) => {
  if (currentNote.value) {
    currentNote.value.commentCount = newCount
  }
}



const viewNoteDetail = (note) => {
  router.push(`/note/${note.id}`)
}

const previewImages = (images, startPosition) => {
  showImagePreview({
    images,
    startPosition
  })
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>
.note-square {
  background-color: var(--background-primary);
  min-height: 100vh;
  
  .navbar-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    
    .action-icon {
      font-size: 18px;
      color: var(--text-primary);
      cursor: pointer;
      padding: var(--spacing-xs);
      
      &:hover {
        color: var(--primary-color);
      }
    }
  }
}

.note-square-content {
  padding-bottom: var(--spacing-lg);
}

.category-filter {
  background: var(--background-secondary);
  
  :deep(.van-tabs__nav) {
    background: var(--background-secondary);
  }
  
  :deep(.van-tab) {
    color: var(--text-secondary);
  }
  
  :deep(.van-tab--active) {
    color: var(--primary-color);
  }
}

.notes-list {
  padding: var(--spacing-sm);
}

.note-card {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.note-author {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  
  .author-avatar {
    margin-right: var(--spacing-sm);
  }
  
  .author-info {
    flex: 1;
    
    .author-name {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: var(--spacing-xs);
    }
    
    .publish-time {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.note-content {
  margin-bottom: var(--spacing-md);
  
  .note-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
    line-height: var(--line-height-tight);
  }
  
  .note-text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .note-images {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
    position: relative;
    
    .note-image {
      border-radius: var(--border-radius-sm);
      cursor: pointer;
    }
    
    .more-images {
      position: absolute;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      font-size: var(--font-size-sm);
    }
  }
  
  .note-tags {
    display: flex;
    gap: var(--spacing-xs);
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