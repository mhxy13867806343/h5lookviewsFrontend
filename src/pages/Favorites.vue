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
                size="medium" 
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
import { showSuccessToast, showConfirmDialog, showToast, showFailToast } from 'vant'
import dayjs from 'dayjs'
import { noteApi } from '@/api/index'

// 类型定义
interface FavoriteNote {
  id: string
  title: string
  content: string
  excerpt?: string
  category: {
    id: number
    name: string
    color: string
  }
  categoryName?: string
  author?: string
  authorAvatar?: string
  favoriteTime: string
  createTime: string
  updateTime: string
  likeCount: number
  commentCount: number
  isPrivate: boolean
  images?: string[]
  views?: number
  likes?: number
  favoriteReason?: string
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
const categoryFilter = ref<number | 'all'>('all')
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
    result = result.filter(note => note.category.id === Number(categoryFilter.value))
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
        result = result.filter(note => (note.likes ?? 0) > 20)
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
        return new Date(b.favoriteTime).getTime() - new Date(a.favoriteTime).getTime()
      case 'createTime':
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      case 'updateTime':
        return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
      case 'popularity':
        return ((b.views ?? 0) + (b.likes ?? 0)) - ((a.views ?? 0) + (a.likes ?? 0))
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

const confirmRemoveFavorite = async () => {
  try {
    if (!currentNote.value) return
    await noteApi.uncollectNote(currentNote.value.id)
    const index = favorites.value.findIndex(n => n.id === currentNote.value!.id)
    if (index > -1) {
      favorites.value.splice(index, 1)
      showSuccessToast('已取消收藏')
    }
  } catch (e) {
    showFailToast('取消收藏失败，请稍后重试')
  } finally {
    showRemoveDialog.value = false
    removeReason.value = ''
  }
}

const showNoteActions = (note: FavoriteNote): void => {
  currentNote.value = note
  showActionSheet.value = true
}

const onSortChange = (): void => {
  // 排序变化无需请求后端，使用本地排序
}

const onCategoryChange = (): void => {
  // 分类筛选变化时重新加载数据
  page.value = 1
  favorites.value = []
  hasMore.value = true
  fetchFavorites()
}

const onTimeChange = (): void => {
  // 时间筛选变化时无需请求后端，使用本地筛选
}

const onSearch = (): void => {
  showSearch.value = false
  // 搜索后重新拉取第一页
  page.value = 1
  favorites.value = []
  hasMore.value = true
  fetchFavorites()
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
  if (loading.value || !hasMore.value) return
  await fetchFavorites()
}

const onActionSelect = (action: { name: string; value: string }): void => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'view':
      if (currentNote.value) viewNote(currentNote.value)
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
      if (currentNote.value) removeFavorite(currentNote.value)
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
// 分类映射
const categoryNameMap: Record<string, number> = {
  '生活随记': 1,
  '工作学习': 2,
  '美食分享': 3,
  '旅行游记': 4,
  '读书笔记': 5,
  '运动健身': 6,
}

const categoryColors: Record<number, string> = {
  1: '#74b9ff',
  2: '#00b894',
  3: '#fdcb6e',
  4: '#fd79a8',
  5: '#6c5ce7',
  6: '#e17055',
}

// 分页参数
const page = ref<number>(1)
const pageSize = ref<number>(20)
let total = 0

// 从后端加载收藏笔记
const fetchFavorites = async (): Promise<void> => {
  if (loading.value) return
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value, collected: true }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (categoryFilter.value !== 'all') {
      const name = Object.entries(categoryNameMap).find(([, id]) => id === categoryFilter.value)?.[0]
      if (name) params.category = name
    }

    const { data } = await noteApi.getNotes(params)
    total = data.total
    const mapped: FavoriteNote[] = data.list
      .filter((n: any) => n.isCollected) // 兜底过滤
      .map((n: any) => {
        const catId = categoryNameMap[n.category] ?? 0
        const color = categoryColors[catId] || '#ddd'
        const category = { id: catId, name: n.category, color }
        const content = n.content || ''
        return {
          id: String(n.id),
          title: n.title || '无标题',
          content,
          excerpt: content.substring(0, 80) + (content.length > 80 ? '...' : ''),
          category,
          categoryName: n.category,
          author: n.user?.nickname,
          authorAvatar: n.user?.avatar,
          favoriteTime: n.updateTime || n.createTime,
          createTime: n.createTime,
          updateTime: n.updateTime,
          likeCount: n.likeCount ?? 0,
          commentCount: n.commentCount ?? 0,
          isPrivate: !n.isPublic,
          images: n.images || [],
          views: 0,
          likes: n.likeCount ?? 0,
          favoriteReason: undefined
        }
      })
    favorites.value.push(...mapped)
    const loaded = favorites.value.length
    hasMore.value = loaded < total
    page.value += 1
  } catch (e) {
    console.error('加载收藏失败', e)
    showFailToast('加载收藏失败')
  } finally {
    loading.value = false
  }
}

// 初始化数据
onMounted(() => {
  fetchFavorites()
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