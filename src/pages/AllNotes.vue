<template>
  <div class="all-notes">
    <van-nav-bar 
      title="全部笔记" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="search" @click="showSearch = true" />
      </template>
    </van-nav-bar>

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
      </van-dropdown-menu>
    </div>

    <!-- 笔记列表 -->
    <div class="notes-list">
      <div 
        v-for="note in filteredNotes" 
        :key="note.id" 
        class="note-item"
        @click="viewNote(note)"
      >
        <div class="note-header">
          <h3 class="note-title">{{ note.title }}</h3>
          <div class="note-meta">
            <van-tag 
              :color="note.category.color" 
              size="mini" 
              plain
            >
              {{ note.category.name }}
            </van-tag>
            <span class="note-time">{{ formatTime(note.updateTime) }}</span>
          </div>
        </div>
        
        <div class="note-content">
          <p class="note-excerpt">{{ note.excerpt }}</p>
          <div v-if="note.images && note.images.length" class="note-images">
            <van-image
              v-for="(image, index) in note.images.slice(0, 3)"
              :key="index"
              :src="image"
              width="60"
              height="60"
              fit="cover"
              radius="4"
            />
            <div v-if="note.images.length > 3" class="more-images">
              +{{ note.images.length - 3 }}
            </div>
          </div>
        </div>
        
        <div class="note-footer">
          <div class="note-stats">
            <span class="stat-item">
              <van-icon name="eye-o" />
              {{ note.views }}
            </span>
            <span class="stat-item">
              <van-icon name="good-job-o" />
              {{ note.likes }}
            </span>
            <span class="stat-item">
              <van-icon name="comment-o" />
              {{ note.comments }}
            </span>
          </div>
          
          <div class="note-actions">
            <van-icon 
              :name="note.isFavorite ? 'star' : 'star-o'"
              :color="note.isFavorite ? '#ffb300' : '#969799'"
              @click.stop="toggleFavorite(note)"
            />
            <van-icon 
              name="ellipsis" 
              @click.stop="showNoteActions(note)"
            />
          </div>
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
      
      <!-- 空状态 -->
      <van-empty v-if="!filteredNotes.length && !loading" description="暂无笔记" />
    </div>

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top">
      <div class="search-popup">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索笔记标题、内容..."
          autofocus
          @search="onSearch"
          @cancel="showSearch = false"
        />
        
        <!-- 搜索历史 -->
        <div v-if="searchHistory.length && !searchKeyword" class="search-history">
          <div class="history-header">
            <span>搜索历史</span>
            <van-icon name="delete-o" @click="clearHistory" />
          </div>
          <div class="history-tags">
            <van-tag
              v-for="item in searchHistory"
              :key="item"
              size="medium"
              @click="searchKeyword = item; onSearch(item)"
            >
              {{ item }}
            </van-tag>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 笔记操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="noteActions"
      @select="onActionSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import { showSuccessToast, showConfirmDialog } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

// 响应式数据
const notes = ref([])
const loading = ref(false)
const hasMore = ref(true)
const showSearch = ref(false)
const showActionSheet = ref(false)
const searchKeyword = ref('')
const searchHistory = ref(['Vue学习笔记', '旅行攻略', '美食制作'])
const currentNote = ref(null)

// 筛选和排序
const sortType = ref('updateTime')
const categoryFilter = ref('all')

// 分类映射，用于从分类名称获取分类ID
const categoryNameMap = {
  '生活随记': 1,
  '工作学习': 2,
  '美食分享': 3,
  '旅行游记': 4,
  '读书笔记': 5,
  '运动健身': 6,
}

const sortOptions = [
  { text: '最近更新', value: 'updateTime' },
  { text: '创建时间', value: 'createTime' },
  { text: '标题排序', value: 'title' },
  { text: '热度排序', value: 'popularity' },
]

const categoryOptions = ref([
  { text: '全部分类', value: 'all' },
  { text: '生活随记', value: 1 },
  { text: '工作学习', value: 2 },
  { text: '美食分享', value: 3 },
  { text: '旅行游记', value: 4 },
  { text: '读书笔记', value: 5 },
  { text: '运动健身', value: 6 },
])

const noteActions = [
  { name: '编辑笔记', value: 'edit' },
  { name: '复制链接', value: 'copy' },
  { name: '分享笔记', value: 'share' },
  { name: '移动到分类', value: 'move' },
  { name: '删除笔记', value: 'delete', color: '#ee0a24' },
  { name: '取消', value: 'cancel' },
]

// 计算属性
const filteredNotes = computed(() => {
  let result = notes.value

  // 分类筛选
  if (categoryFilter.value !== 'all') {
    result = result.filter(note => note.category.id === categoryFilter.value)
  }

  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(note => 
      note.title.toLowerCase().includes(keyword) ||
      note.content.toLowerCase().includes(keyword)
    )
  }

  // 排序
  result.sort((a, b) => {
    switch (sortType.value) {
      case 'updateTime':
        return new Date(b.updateTime) - new Date(a.updateTime)
      case 'createTime':
        return new Date(b.createTime) - new Date(a.createTime)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'popularity':
        return (b.views + b.likes) - (a.views + a.likes)
      default:
        return 0
    }
  })

  return result
})

// 方法
const handleBack = () => {
  router.back()
}

const viewNote = (note) => {
  router.push(`/note/${note.id}`)
}

const toggleFavorite = async (note) => {
  try {
    note.isFavorite = !note.isFavorite
    showSuccessToast(note.isFavorite ? '已添加到收藏' : '已取消收藏')
  } catch (error) {
    showToast('操作失败')
  }
}

const showNoteActions = (note) => {
  currentNote.value = note
  showActionSheet.value = true
}

const onSortChange = () => {
  // 排序变化时重新加载数据
}

const onCategoryChange = () => {
  // 分类筛选变化时重新加载数据
}

const onSearch = (keyword) => {
  if (keyword && !searchHistory.value.includes(keyword)) {
    searchHistory.value.unshift(keyword)
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
  }
  showSearch.value = false
}

const clearHistory = () => {
  searchHistory.value = []
}

const loadMore = async () => {
  if (loading.value) return

  loading.value = true
  try {
    // 模拟加载更多数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const moreNotes = generateMockNotes(10)
    notes.value.push(...moreNotes)
    
    // 模拟没有更多数据
    if (notes.value.length >= 50) {
      hasMore.value = false
    }
  } finally {
    loading.value = false
  }
}

const onActionSelect = (action) => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'edit':
      router.push(`/note/edit/${currentNote.value.id}`)
      break
    case 'copy':
      showSuccessToast('链接已复制')
      break
    case 'share':
      showSuccessToast('分享功能开发中')
      break
    case 'move':
      showSuccessToast('移动功能开发中')
      break
    case 'delete':
      showConfirmDialog({
        title: '确认删除',
        message: '删除后无法恢复，确定要删除这篇笔记吗？',
      }).then(() => {
        const index = notes.value.findIndex(n => n.id === currentNote.value.id)
        if (index > -1) {
          notes.value.splice(index, 1)
          showSuccessToast('删除成功')
        }
      })
      break
  }
}

const formatTime = (time) => {
  const now = dayjs()
  const noteTime = dayjs(time)
  
  if (now.diff(noteTime, 'day') === 0) {
    return noteTime.format('HH:mm')
  } else if (now.diff(noteTime, 'day') === 1) {
    return '昨天 ' + noteTime.format('HH:mm')
  } else if (now.diff(noteTime, 'year') === 0) {
    return noteTime.format('MM-DD HH:mm')
  } else {
    return noteTime.format('YYYY-MM-DD')
  }
}

// 生成模拟数据
const generateMockNotes = (count) => {
  const categories = [
    { id: 1, name: '生活随记', color: '#74b9ff' },
    { id: 2, name: '工作学习', color: '#00b894' },
    { id: 3, name: '美食分享', color: '#fdcb6e' },
    { id: 4, name: '旅行游记', color: '#fd79a8' },
    { id: 5, name: '读书笔记', color: '#6c5ce7' },
    { id: 6, name: '运动健身', color: '#e17055' },
  ]

  const titles = [
    '今天的美好生活', '工作中的小技巧', '美味的家常菜制作',
    '周末旅行小记', '这本书真的很棒', '晨跑的收获',
    'Vue3学习笔记', '如何提高工作效率', '意大利面制作方法',
    '杭州西湖一日游', '《人类简史》读后感', '健身房训练计划'
  ]

  const contents = [
    '今天过得很充实，分享一些生活中的小美好...',
    '在工作中发现了一些提高效率的方法，记录下来...',
    '学会了一道新菜，味道还不错，分享制作过程...',
    '这次旅行收获很多，风景很美，人也很好...',
    '读完这本书后有很多感悟，值得推荐给大家...',
    '坚持运动真的很重要，身体和心情都变好了...'
  ]

  return Array.from({ length: count }, (_, index) => ({
    id: Date.now() + index,
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    excerpt: contents[Math.floor(Math.random() * contents.length)].substring(0, 50) + '...',
    category: categories[Math.floor(Math.random() * categories.length)],
    createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updateTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    views: Math.floor(Math.random() * 200),
    likes: Math.floor(Math.random() * 50),
    comments: Math.floor(Math.random() * 20),
    isFavorite: Math.random() > 0.7,
    images: Math.random() > 0.6 ? ['https://img.yzcdn.cn/vant/cat.jpeg'] : []
  }))
}

// 初始化分类筛选
const initializeCategoryFilter = () => {
  // 从路由查询参数中获取分类信息
  const categoryParam = route.query.category
  
  if (categoryParam) {
    // 如果有分类参数，尝试找到对应的分类ID
    const categoryId = categoryNameMap[categoryParam]
    if (categoryId) {
      // 找到对应分类，设置筛选
      categoryFilter.value = categoryId
      return
    }
  }
  
  // 如果没有分类参数或没找到对应分类，检查是否有默认分类
  const firstCategory = categoryOptions.value.find(option => option.value !== 'all')
  if (firstCategory) {
    categoryFilter.value = firstCategory.value
  } else {
    // 最后的兜底，设置为全部分类
    categoryFilter.value = 'all'
  }
}

// 初始化数据
onMounted(() => {
  notes.value = generateMockNotes(20)
  initializeCategoryFilter()
})
</script>

<style lang="scss" scoped>
.all-notes {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.filter-bar {
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.notes-list {
  padding: var(--spacing-sm);
}

.note-item {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .note-header {
    margin-bottom: var(--spacing-sm);
    
    .note-title {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.4;
    }
    
    .note-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      .note-time {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }
    }
  }
  
  .note-content {
    margin-bottom: var(--spacing-md);
    
    .note-excerpt {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-secondary);
      line-height: 1.5;
      font-size: var(--font-size-md);
    }
    
    .note-images {
      display: flex;
      gap: var(--spacing-xs);
      position: relative;
      
      .more-images {
        position: absolute;
        right: 0;
        top: 0;
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: var(--font-size-sm);
      }
    }
  }
  
  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
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
    
    .note-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      
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
}

.load-more {
  text-align: center;
  padding: var(--spacing-lg);
}

.search-popup {
  padding: var(--spacing-sm);
  
  .search-history {
    padding: var(--spacing-md);
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      
      span {
        font-size: var(--font-size-md);
        color: var(--text-primary);
        font-weight: 500;
      }
      
      .van-icon {
        color: var(--text-secondary);
        cursor: pointer;
      }
    }
    
    .history-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
      
      .van-tag {
        cursor: pointer;
      }
    }
  }
}
</style>