<template>
  <div class="favorites">
    <van-nav-bar 
      title="收藏夹" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="search" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <!-- 收藏统计 -->
    <div class="favorites-stats">
      <van-grid :column-num="3" :border="false">
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-number">{{ totalFavorites }}</div>
            <div class="stat-label">总收藏</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-number">{{ thisWeekFavorites }}</div>
            <div class="stat-label">本周新增</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-number">{{ favoriteCategories }}</div>
            <div class="stat-label">涉及分类</div>
          </div>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 筛选和排序 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item 
          v-model="sortType" 
          :options="sortOptions"
          @change="onSortChange"
        />
        <van-dropdown-item 
          v-model="categoryFilter" 
          :options="categoryOptions"
          @change="onCategoryChange"
        />
        <van-dropdown-item 
          v-model="timeFilter" 
          :options="timeOptions"
          @change="onTimeChange"
        />
      </van-dropdown-menu>
    </div>

    <!-- 收藏笔记列表 -->
    <div class="favorites-list">
      <div v-if="filteredFavorites.length">
        <div 
          v-for="note in filteredFavorites" 
          :key="note.id" 
          class="favorite-item"
          @click="viewNote(note)"
        >
          <div class="favorite-main">
            <div class="favorite-header">
              <h3 class="note-title">{{ note.title }}</h3>
              <div class="favorite-time">
                <van-icon name="star" color="#ffb300" />
                <span>{{ formatTime(note.favoriteTime) }}</span>
              </div>
            </div>
            
            <p class="note-excerpt">{{ note.excerpt }}</p>
            
            <div class="note-meta">
              <van-tag 
                :color="note.category.color" 
                size="mini" 
                plain
              >
                {{ note.category.name }}
              </van-tag>
              
              <div class="note-stats">
                <span class="stat-item">
                  <van-icon name="eye-o" />
                  {{ note.views }}
                </span>
                <span class="stat-item">
                  <van-icon name="good-job-o" />
                  {{ note.likes }}
                </span>
              </div>
            </div>
            
            <!-- 收藏理由 -->
            <div v-if="note.favoriteReason" class="favorite-reason">
              <van-icon name="chat-o" />
              <span>{{ note.favoriteReason }}</span>
            </div>
          </div>
          
          <div class="favorite-actions">
            <van-icon 
              name="star" 
              color="#ffb300"
              @click.stop="removeFavorite(note)"
            />
            <van-icon 
              name="ellipsis" 
              @click.stop="showNoteActions(note)"
            />
          </div>
        </div>
        
        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <van-button 
            type="default" 
            size="small" 
            :loading="loading"
            @click="loadMore"
          >
            加载更多
          </van-button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <van-empty description="还没有收藏任何笔记">
          <van-button 
            type="primary" 
            size="small"
            @click="goToExplore"
          >
            去发现好内容
          </van-button>
        </van-empty>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top">
      <div class="search-popup">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索收藏的笔记..."
          autofocus
          @search="onSearch"
          @cancel="showSearch = false"
        />
        
        <!-- 快速筛选标签 -->
        <div class="quick-filters">
          <van-tag
            v-for="tag in quickFilterTags"
            :key="tag.value"
            :type="selectedQuickFilter === tag.value ? 'primary' : 'default'"
            size="medium"
            @click="applyQuickFilter(tag.value)"
          >
            {{ tag.label }}
          </van-tag>
        </div>
      </div>
    </van-popup>

    <!-- 笔记操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="noteActions"
      @select="onActionSelect"
    />

    <!-- 取消收藏确认 -->
    <van-dialog
      v-model:show="showRemoveDialog"
      title="取消收藏"
      message="确定要取消收藏这篇笔记吗？"
      show-cancel-button
      @confirm="confirmRemoveFavorite"
    >
      <template #default>
        <div class="remove-dialog-content">
          <p>确定要取消收藏这篇笔记吗？</p>
          <van-field
            v-model="removeReason"
            placeholder="可以说说取消收藏的原因（可选）"
            type="textarea"
            rows="2"
            maxlength="100"
            show-word-limit
          />
        </div>
      </template>
    </van-dialog>
  </div>
</template>

<script lang="ts" setup>
import { showSuccessToast, showConfirmDialog, showToast } from 'vant'
import dayjs from 'dayjs'

// 类型定义
interface FavoriteNote {
  id: number
  title: string
  content: string
  category: number
  categoryName: string
  author: string
  authorAvatar: string
  favoriteTime: string
  createTime: string
  updateTime: string
  likeCount: number
  commentCount: number
  isPrivate: boolean
}

interface CategoryOption {
  text: string
  value: string | number
}

interface TimeOption {
  text: string
  value: string
}

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const favorites = ref<FavoriteNote[]>([])
const loading = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const showSearch = ref<boolean>(false)
const showActionSheet = ref<boolean>(false)
const showRemoveDialog = ref<boolean>(false)
const searchKeyword = ref<string>('')
const currentNote = ref<FavoriteNote | null>(null)
const removeReason = ref<string>('')
const selectedQuickFilter = ref<string>('')

// 筛选和排序
const sortType = ref<string>('favoriteTime')
const categoryFilter = ref<string>('all')
const timeFilter = ref<string>('all')

const sortOptions = [
  { text: '收藏时间', value: 'favoriteTime' },
  { text: '创建时间', value: 'createTime' },
  { text: '更新时间', value: 'updateTime' },
  { text: '热度排序', value: 'popularity' },
]

const categoryOptions = ref<CategoryOption[]>([
  { text: '全部分类', value: 'all' },
  { text: '生活随记', value: 1 },
  { text: '工作学习', value: 2 },
  { text: '美食分享', value: 3 },
  { text: '旅行游记', value: 4 },
  { text: '读书笔记', value: 5 },
  { text: '运动健身', value: 6 },
])

const timeOptions = [
  { text: '全部时间', value: 'all' },
  { text: '最近一周', value: 'week' },
  { text: '最近一月', value: 'month' },
  { text: '最近三月', value: 'quarter' },
  { text: '今年收藏', value: 'year' },
]

const quickFilterTags = [
  { label: '最近收藏', value: 'recent' },
  { label: '高赞笔记', value: 'popular' },
  { label: '长篇内容', value: 'long' },
  { label: '有图片', value: 'images' },
]

const noteActions = [
  { name: '查看笔记', value: 'view' },
  { name: '分享笔记', value: 'share' },
  { name: '复制链接', value: 'copy' },
  { name: '添加标签', value: 'tag' },
  { name: '取消收藏', value: 'unfavorite', color: '#ee0a24' },
  { name: '取消', value: 'cancel' },
]

// 计算属性
const totalFavorites = computed<number>(() => favorites.value.length)

const thisWeekFavorites = computed<number>(() => {
  const oneWeekAgo = dayjs().subtract(1, 'week')
  return favorites.value.filter(note => 
    dayjs(note.favoriteTime).isAfter(oneWeekAgo)
  ).length
})

const favoriteCategories = computed<number>(() => {
  const categories = new Set(favorites.value.map(note => note.category))
  return categories.size
})

const filteredFavorites = computed<FavoriteNote[]>(() => {
  let result = favorites.value

  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(note => 
      note.title.toLowerCase().includes(keyword) ||
      note.content.toLowerCase().includes(keyword) ||
      (note.favoriteReason && note.favoriteReason.toLowerCase().includes(keyword))
    )
  }

  // 分类筛选
  if (categoryFilter.value !== 'all') {
    result = result.filter(note => note.category.id === categoryFilter.value)
  }

  // 时间筛选
  if (timeFilter.value !== 'all') {
    const now = dayjs()
    result = result.filter(note => {
      const favoriteTime = dayjs(note.favoriteTime)
      switch (timeFilter.value) {
        case 'week':
          return favoriteTime.isAfter(now.subtract(1, 'week'))
        case 'month':
          return favoriteTime.isAfter(now.subtract(1, 'month'))
        case 'quarter':
          return favoriteTime.isAfter(now.subtract(3, 'month'))
        case 'year':
          return favoriteTime.isSame(now, 'year')
        default:
          return true
      }
    })
  }

  // 快速筛选
  if (selectedQuickFilter.value) {
    switch (selectedQuickFilter.value) {
      case 'recent':
        result = result.filter(note => 
          dayjs(note.favoriteTime).isAfter(dayjs().subtract(3, 'day'))
        )
        break
      case 'popular':
        result = result.filter(note => note.likes > 20)
        break
      case 'long':
        result = result.filter(note => note.content.length > 500)
        break
      case 'images':
        result = result.filter(note => note.images && note.images.length > 0)
        break
    }
  }

  // 排序
  result.sort((a, b) => {
    switch (sortType.value) {
      case 'favoriteTime':
        return new Date(b.favoriteTime) - new Date(a.favoriteTime)
      case 'createTime':
        return new Date(b.createTime) - new Date(a.createTime)
      case 'updateTime':
        return new Date(b.updateTime) - new Date(a.updateTime)
      case 'popularity':
        return (b.views + b.likes) - (a.views + a.likes)
      default:
        return 0
    }
  })

  return result
})

// 方法
const handleBack = (): void => {
  router.back()
}

const viewNote = (note: FavoriteNote): void => {
  router.push(`/note/${note.id}`)
}

const removeFavorite = (note: FavoriteNote): void => {
  currentNote.value = note
  showRemoveDialog.value = true
}

const confirmRemoveFavorite = () => {
  const index = favorites.value.findIndex(n => n.id === currentNote.value.id)
  if (index > -1) {
    favorites.value.splice(index, 1)
    showSuccessToast('已取消收藏')
  }
  showRemoveDialog.value = false
  removeReason.value = ''
}

const showNoteActions = (note: FavoriteNote): void => {
  currentNote.value = note
  showActionSheet.value = true
}

const onSortChange = (): void => {
  // 排序变化时重新加载数据
}

const onCategoryChange = (): void => {
  // 分类筛选变化时重新加载数据
}

const onTimeChange = (): void => {
  // 时间筛选变化时重新加载数据
}

const onSearch = (): void => {
  showSearch.value = false
}

const applyQuickFilter = (filterValue: string): void => {
  if (selectedQuickFilter.value === filterValue) {
    selectedQuickFilter.value = ''
  } else {
    selectedQuickFilter.value = filterValue
  }
}

const goToExplore = (): void => {
  router.push('/note-square')
}

const loadMore = async (): Promise<void> => {
  if (loading.value) return

  loading.value = true
  try {
    // 模拟加载更多数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const moreFavorites = generateMockFavorites(10)
    favorites.value.push(...moreFavorites)
    
    // 模拟没有更多数据
    if (favorites.value.length >= 50) {
      hasMore.value = false
    }
  } finally {
    loading.value = false
  }
}

const onActionSelect = (action: { name: string }): void => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'view':
      viewNote(currentNote.value)
      break
    case 'share':
      showSuccessToast('分享功能开发中')
      break
    case 'copy':
      showSuccessToast('链接已复制')
      break
    case 'tag':
      showSuccessToast('标签功能开发中')
      break
    case 'unfavorite':
      removeFavorite(currentNote.value)
      break
  }
}

const formatTime = (time: string): string => {
  const now = dayjs()
  const noteTime = dayjs(time)
  
  if (now.diff(noteTime, 'day') === 0) {
    return '今天 ' + noteTime.format('HH:mm')
  } else if (now.diff(noteTime, 'day') === 1) {
    return '昨天 ' + noteTime.format('HH:mm')
  } else if (now.diff(noteTime, 'year') === 0) {
    return noteTime.format('MM-DD HH:mm')
  } else {
    return noteTime.format('YYYY-MM-DD')
  }
}

// 生成模拟数据
const generateMockFavorites = (count: number = 20): FavoriteNote[] => {
  const categories = [
    { id: 1, name: '生活随记', color: '#74b9ff' },
    { id: 2, name: '工作学习', color: '#00b894' },
    { id: 3, name: '美食分享', color: '#fdcb6e' },
    { id: 4, name: '旅行游记', color: '#fd79a8' },
    { id: 5, name: '读书笔记', color: '#6c5ce7' },
    { id: 6, name: '运动健身', color: '#e17055' },
  ]

  const titles = [
    '超实用的生活小技巧', '前端开发最佳实践', '家常菜制作大全',
    '日本旅行攻略分享', '《原则》读书笔记', '健身入门指导',
    'Vue3项目实战经验', '时间管理的艺术', '意大利美食探索',
    '西藏自驾游记录', '投资理财心得', '瑜伽修身养心'
  ]

  const contents = [
    '这些生活小技巧真的很实用，可以让日常生活更便利...',
    '总结了前端开发中的一些最佳实践，希望对大家有帮助...',
    '分享一些简单易学的家常菜做法，营养美味又健康...',
    '详细的日本旅行攻略，包含交通、住宿、美食推荐...',
    '这本书给了我很多启发，关于原则和决策的思考...',
    '健身新手必看的入门指导，从基础动作开始学习...'
  ]

  const reasons = [
    '内容很实用，值得收藏', '写得很详细，以后会用到', '很有启发性的文章',
    '作者经验丰富，干货满满', '图文并茂，很容易理解', '正好是我需要的内容'
  ]

  return Array.from({ length: count }, (_, index) => ({
    id: Date.now() + index,
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    excerpt: contents[Math.floor(Math.random() * contents.length)].substring(0, 80) + '...',
    category: categories[Math.floor(Math.random() * categories.length)],
    createTime: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    favoriteTime: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
    views: Math.floor(Math.random() * 500) + 50,
    likes: Math.floor(Math.random() * 100) + 10,
    favoriteReason: Math.random() > 0.5 ? reasons[Math.floor(Math.random() * reasons.length)] : null,
    images: Math.random() > 0.6 ? ['https://img.yzcdn.cn/vant/cat.jpeg'] : []
  }))
}

// 初始化数据
onMounted(() => {
  favorites.value = generateMockFavorites()
})
</script>

<style lang="scss" scoped>
.favorites {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.favorites-stats {
  background: var(--background-secondary);
  margin: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md) 0;
  
  .stat-item {
    text-align: center;
    
    .stat-number {
      font-size: var(--font-size-xl);
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: var(--spacing-xs);
    }
    
    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.filter-bar {
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.favorites-list {
  padding: var(--spacing-sm);
}

.favorite-item {
  display: flex;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .favorite-main {
    flex: 1;
    
    .favorite-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-sm);
      
      .note-title {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.4;
        flex: 1;
      }
      
      .favorite-time {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--text-secondary);
        font-size: var(--font-size-xs);
        margin-left: var(--spacing-sm);
        
        span {
          white-space: nowrap;
        }
      }
    }
    
    .note-excerpt {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-secondary);
      line-height: 1.5;
      font-size: var(--font-size-md);
    }
    
    .note-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      
      .note-stats {
        display: flex;
        gap: var(--spacing-md);
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          
          .van-icon {
            font-size: 14px;
          }
        }
      }
    }
    
    .favorite-reason {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: rgba(255, 179, 0, 0.1);
      border-radius: var(--border-radius-sm);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-style: italic;
      
      .van-icon {
        color: #ffb300;
        font-size: 14px;
      }
    }
  }
  
  .favorite-actions {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    margin-left: var(--spacing-md);
    
    .van-icon {
      font-size: 18px;
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.empty-state {
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
}

.load-more {
  text-align: center;
  padding: var(--spacing-lg);
}

.search-popup {
  padding: var(--spacing-sm);
  
  .quick-filters {
    padding: var(--spacing-md);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    
    .van-tag {
      cursor: pointer;
    }
  }
}

.remove-dialog-content {
  padding: var(--spacing-md);
  
  p {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-primary);
  }
}
</style>