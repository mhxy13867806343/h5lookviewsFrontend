<template>
  <div class="search">
    <van-nav-bar title="搜索" left-arrow @click-left="handleBack" />
    
    <div class="search-content">
      <!-- 搜索框 -->
      <div class="search-box">
        <van-search
          v-model="searchValue"
          placeholder="搜索内容"
          @search="onSearch"
          @clear="onClear"
          show-action
        >
          <template #action>
            <div @click="onSearch">搜索</div>
          </template>
        </van-search>
      </div>
      
      <!-- 搜索条件 -->
      <div class="search-filters">
        <!-- 搜索类型 -->
        <div class="filter-section">
          <div class="filter-title">搜索类型</div>
          <van-radio-group v-model="searchType" direction="horizontal">
            <van-radio name="posts" checked-color="#1989fa">动态</van-radio>
            <van-radio name="notes" checked-color="#1989fa">笔记</van-radio>
            <van-radio name="friends" checked-color="#1989fa">好友</van-radio>
          </van-radio-group>
        </div>
        
        <!-- 时间筛选 (仅动态和笔记) -->
        <div v-if="searchType !== 'friends'" class="filter-section">
          <div class="filter-title">时间范围</div>
          <van-cell 
            title="选择时间段" 
            :value="timeRangeText"
            is-link 
            @click="showTimePicker = true"
          />
        </div>
        
        <!-- 高级筛选 -->
        <div class="filter-section">
          <van-cell 
            title="高级筛选" 
            is-link 
            @click="showAdvancedFilter = true"
          >
            <template #right-icon>
              <van-icon name="setting-o" />
            </template>
          </van-cell>
        </div>
      </div>
      
      <!-- 搜索结果 -->
      <div class="search-results">
        <div v-if="!hasSearched" class="search-tips">
          <van-empty description="输入关键词开始搜索">
            <div class="recent-searches" v-if="recentSearches.length">
              <div class="recent-title">最近搜索</div>
              <van-tag 
                v-for="(item, index) in recentSearches" 
                :key="index"
                @click="searchValue = item; onSearch()"
                class="recent-tag"
              >
                {{ item }}
              </van-tag>
            </div>
          </van-empty>
        </div>
        
        <div v-else-if="isSearching" class="loading">
          <van-loading>搜索中...</van-loading>
        </div>
        
        <div v-else-if="searchResults.length === 0" class="no-results">
          <van-empty description="没有找到相关内容" />
        </div>
        
        <div v-else>
          <!-- 动态结果 -->
          <div v-if="searchType === 'posts'" class="results-list">
            <div class="result-header">
              <span>找到 {{ searchResults.length }} 条动态</span>
            </div>
            <div 
              v-for="post in searchResults" 
              :key="post.id"
              class="result-item post-item"
              @click="viewPost(post)"
            >
              <div class="post-header">
                <van-image
                  :src="post.avatar"
                  round
                  width="32"
                  height="32"
                  class="avatar"
                >
                  <template #error>
                    <van-icon name="user-circle-o" size="32" />
                  </template>
                </van-image>
                <div class="post-info">
                  <div class="username">{{ post.username }}</div>
                  <div class="time">{{ formatTime(post.createTime) }}</div>
                </div>
              </div>
              <div class="post-content">
                <p>{{ highlightText(post.content, searchValue) }}</p>
                <div v-if="post.location" class="location">
                  <van-icon name="location-o" />
                  <span>{{ post.location }}</span>
                </div>
              </div>
              <div class="post-stats">
                <span>{{ post.likeCount || 0 }} 赞</span>
                <span>{{ post.commentCount || 0 }} 评论</span>
              </div>
            </div>
          </div>
          
          <!-- 笔记结果 -->
          <div v-if="searchType === 'notes'" class="results-list">
            <div class="result-header">
              <span>找到 {{ searchResults.length }} 篇笔记</span>
            </div>
            <div 
              v-for="note in searchResults" 
              :key="note.id"
              class="result-item note-item"
              @click="viewNote(note)"
            >
              <div class="note-header">
                <div class="note-title">{{ note.title || '无标题' }}</div>
                <div class="note-time">{{ formatTime(note.createTime) }}</div>
              </div>
              <div class="note-content">
                <p>{{ highlightText(note.content.slice(0, 150), searchValue) }}{{ note.content.length > 150 ? '...' : '' }}</p>
              </div>
              <div class="note-meta">
                <van-tag size="small" :color="note.categoryColor">{{ note.category }}</van-tag>
                <span class="word-count">{{ note.content.length }} 字</span>
              </div>
            </div>
          </div>
          
          <!-- 好友结果 -->
          <div v-if="searchType === 'friends'" class="results-list">
            <div class="result-header">
              <span>找到 {{ searchResults.length }} 位好友</span>
            </div>
            <div 
              v-for="friend in searchResults" 
              :key="friend.id"
              class="result-item friend-item"
              @click="viewFriend(friend)"
            >
              <van-image
                :src="friend.avatar"
                round
                width="48"
                height="48"
                class="friend-avatar"
              >
                <template #error>
                  <van-icon name="user-circle-o" size="48" />
                </template>
              </van-image>
              <div class="friend-info">
                <div class="friend-name">{{ highlightText(friend.name, searchValue) }}</div>
                <div class="friend-desc">{{ friend.signature || '这个人很懒，什么都没写' }}</div>
                <div class="friend-stats">
                  <span>{{ friend.postsCount || 0 }} 动态</span>
                  <span>{{ friend.notesCount || 0 }} 笔记</span>
                </div>
              </div>
              <van-button size="small" type="primary">查看</van-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 时间选择器 -->
    <van-popup v-model:show="showTimePicker" position="bottom">
      <van-picker
        :columns="timeColumns"
        title="选择时间"
        @confirm="onTimeConfirm"
        @cancel="showTimePicker = false"
      />
    </van-popup>
    
    <!-- 高级筛选 -->
    <van-popup v-model:show="showAdvancedFilter" position="bottom">
      <div class="advanced-filter">
        <van-nav-bar title="高级筛选" left-text="取消" right-text="确认" @click-left="showAdvancedFilter = false" @click-right="applyAdvancedFilter" />
        
        <van-cell-group>
          <van-field label="关键词" v-model="advancedFilters.keyword" placeholder="输入关键词" />
          
          <van-cell title="排序方式" :value="sortOptions.find(opt => opt.value === advancedFilters.sortBy)?.label">
            <template #right-icon>
              <van-radio-group v-model="advancedFilters.sortBy" direction="horizontal">
                <van-radio v-for="option in sortOptions" :key="option.value" :name="option.value">
                  {{ option.label }}
                </van-radio>
              </van-radio-group>
            </template>
          </van-cell>
          
          <van-cell v-if="searchType !== 'friends'" title="包含图片" :value="advancedFilters.hasImages ? '是' : '否'">
            <template #right-icon>
              <van-switch v-model="advancedFilters.hasImages" />
            </template>
          </van-cell>
          
          <van-cell v-if="searchType === 'notes'" title="最小字数">
            <template #right-icon>
              <van-stepper v-model="advancedFilters.minWords" min="0" max="20000" step="100" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { showSuccessToast } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const searchValue = ref('')
// 类型定义
interface SearchResult {
  id: string
  type: 'post' | 'note' | 'user'
  title: string
  content: string
  author?: string
  avatar?: string
  createTime: string
}

const searchType = ref<'posts' | 'notes' | 'friends'>('posts')
const selectedTime = ref<string>('')
const showTimePicker = ref<boolean>(false)
const showAdvancedFilter = ref<boolean>(false)
const hasSearched = ref<boolean>(false)
const isSearching = ref<boolean>(false)
const searchResults = ref<SearchResult[]>([])
const recentSearches = ref<string[]>(['Vue3', '生活随记', '工作笔记', '小明'])

// 高级筛选
const advancedFilters = reactive({
  keyword: '',
  sortBy: 'time', // time, relevance, popularity
  hasImages: false,
  minWords: 0
})

const sortOptions = [
  { label: '时间', value: 'time' },
  { label: '相关度', value: 'relevance' },
  { label: '热度', value: 'popularity' }
]

// 模拟数据
const mockPosts = [
  {
    id: 1,
    username: '小明',
    avatar: '',
    content: '今天天气真好，出去走走心情都变好了！Vue3 的学习也有新进展。',
    location: '北京·朝阳公园',
    createTime: new Date(2025, 9, 15), // 2025-10
    likeCount: 12,
    commentCount: 3
  },
  {
    id: 2,
    username: '小红',
    avatar: '',
    content: '分享一下我的生活随记，今天做了一道新菜。',
    location: '上海·徐汇区',
    createTime: new Date(2025, 10, 5), // 2025-11
    likeCount: 8,
    commentCount: 5
  }
]

const mockNotes = [
  {
    id: 1,
    title: 'Vue3 学习笔记',
    content: 'Vue3 的 Composition API 真的很好用，可以让代码组织得更加清晰。今天学习了 ref 和 reactive 的区别，还有 computed 的使用方法。',
    category: '工作学习',
    categoryColor: '#00b894',
    createTime: new Date(2025, 9, 20), // 2025-10
  },
  {
    id: 2,
    title: '生活随记',
    content: '今天是个好天气，心情也特别好。记录一下生活中的美好瞬间，这些小确幸总是让人感到温暖。',
    category: '生活随记',
    categoryColor: '#74b9ff',
    createTime: new Date(2025, 10, 8), // 2025-11
  }
]

const mockFriends = [
  {
    id: 1,
    name: '小明',
    avatar: '',
    signature: '热爱生活，热爱编程',
    postsCount: 25,
    notesCount: 12
  },
  {
    id: 2,
    name: '小红',
    avatar: '',
    signature: '美食爱好者',
    postsCount: 18,
    notesCount: 8
  }
]

// 时间选择器数据
const timeColumns = [
  // 年份列
  Array.from({ length: 10 }, (_, i) => ({
    text: `${2020 + i}年`,
    value: 2020 + i
  })),
  // 月份列
  Array.from({ length: 12 }, (_, i) => ({
    text: `${i + 1}月`,
    value: i + 1
  }))
]

// 计算属性
const timeRangeText = computed(() => {
  if (!selectedTime.value) return '全部时间'
  return selectedTime.value
})

// 方法
const handleBack = () => {
  router.back()
}

const onSearch = async () => {
  if (!searchValue.value.trim()) {
    showSuccessToast('请输入搜索关键词')
    return
  }
  
  hasSearched.value = true
  isSearching.value = true
  
  // 添加到最近搜索
  if (!recentSearches.value.includes(searchValue.value)) {
    recentSearches.value.unshift(searchValue.value)
    if (recentSearches.value.length > 10) {
      recentSearches.value.pop()
    }
  }
  
  // 模拟搜索延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 执行搜索
  performSearch()
  
  isSearching.value = false
}

const performSearch = () => {
  const keyword = searchValue.value.toLowerCase()
  let results = []
  
  // 时间筛选
  const filterByTime = (item) => {
    if (!selectedTime.value) return true
    const itemMonth = dayjs(item.createTime).format('YYYY-MM')
    return itemMonth === selectedTime.value
  }
  
  switch (searchType.value) {
    case 'posts':
      results = mockPosts.filter(post => {
        const matchKeyword = post.content.toLowerCase().includes(keyword) || 
                            post.username.toLowerCase().includes(keyword)
        const matchTime = filterByTime(post)
        const matchImages = !advancedFilters.hasImages || (post.images && post.images.length > 0)
        return matchKeyword && matchTime && matchImages
      })
      break
      
    case 'notes':
      results = mockNotes.filter(note => {
        const matchKeyword = (note.title?.toLowerCase() || '').includes(keyword) || 
                            note.content.toLowerCase().includes(keyword) ||
                            note.category.toLowerCase().includes(keyword)
        const matchTime = filterByTime(note)
        const matchWords = note.content.length >= advancedFilters.minWords
        return matchKeyword && matchTime && matchWords
      })
      break
      
    case 'friends':
      results = mockFriends.filter(friend => {
        return friend.name.toLowerCase().includes(keyword) ||
               (friend.signature?.toLowerCase() || '').includes(keyword)
      })
      break
  }
  
  // 排序
  if (advancedFilters.sortBy === 'time') {
    results.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
  } else if (advancedFilters.sortBy === 'popularity' && searchType.value === 'posts') {
    results.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
  }
  
  searchResults.value = results
}

const onClear = () => {
  searchValue.value = ''
  searchResults.value = []
  hasSearched.value = false
}

const onTimeConfirm = ({ selectedOptions }) => {
  const year = selectedOptions[0].value
  const month = selectedOptions[1].value
  selectedTime.value = `${year}-${String(month).padStart(2, '0')}`
  showTimePicker.value = false
  if (hasSearched.value) {
    performSearch()
  }
}

const applyAdvancedFilter = () => {
  showAdvancedFilter.value = false
  if (hasSearched.value) {
    performSearch()
  }
}

const highlightText = (text, keyword) => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const viewPost = (post) => {
  showSuccessToast(`查看动态: ${post.content.slice(0, 20)}...`)
}

const viewNote = (note) => {
  showSuccessToast(`查看笔记: ${note.title || '无标题'}`)
}

const viewFriend = (friend) => {
  showSuccessToast(`查看好友: ${friend.name}`)
}

// 监听搜索类型变化
watch(searchType, () => {
  if (hasSearched.value) {
    performSearch()
  }
})
</script>

<style lang="scss" scoped>
.search {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.search-content {
  padding: var(--spacing-sm);
}

.search-box {
  margin-bottom: var(--spacing-md);
}

.search-filters {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  .filter-section {
    margin-bottom: var(--spacing-md);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .filter-title {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  :deep(.van-radio-group) {
    display: flex;
    gap: var(--spacing-lg);
  }
}

.search-tips {
  text-align: center;
  padding: var(--spacing-xl) 0;
  
  .recent-searches {
    margin-top: var(--spacing-lg);
    
    .recent-title {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-sm);
    }
    
    .recent-tag {
      margin: var(--spacing-xs);
      cursor: pointer;
    }
  }
}

.loading {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.no-results {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.results-list {
  .result-header {
    padding: var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-sm);
  }
}

.result-item {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-sm);
  }
}

.post-item {
  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    
    .avatar {
      margin-right: var(--spacing-sm);
    }
    
    .post-info {
      flex: 1;
      
      .username {
        font-size: var(--font-size-md);
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }
      
      .time {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
  }
  
  .post-content {
    margin-bottom: var(--spacing-sm);
    
    p {
      line-height: var(--line-height-relaxed);
      margin-bottom: var(--spacing-xs);
      
      :deep(mark) {
        background-color: #fff3cd;
        padding: 2px 4px;
        border-radius: 2px;
      }
    }
    
    .location {
      display: flex;
      align-items: center;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      
      .van-icon {
        margin-right: var(--spacing-xs);
      }
    }
  }
  
  .post-stats {
    display: flex;
    gap: var(--spacing-md);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.note-item {
  .note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    
    .note-title {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .note-time {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
  
  .note-content {
    margin-bottom: var(--spacing-sm);
    
    p {
      line-height: var(--line-height-relaxed);
      color: var(--text-primary);
      
      :deep(mark) {
        background-color: #fff3cd;
        padding: 2px 4px;
        border-radius: 2px;
      }
    }
  }
  
  .note-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .word-count {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.friend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  
  .friend-avatar {
    flex-shrink: 0;
  }
  
  .friend-info {
    flex: 1;
    
    .friend-name {
      font-size: var(--font-size-md);
      font-weight: 500;
      margin-bottom: var(--spacing-xs);
      
      :deep(mark) {
        background-color: #fff3cd;
        padding: 2px 4px;
        border-radius: 2px;
      }
    }
    
    .friend-desc {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }
    
    .friend-stats {
      display: flex;
      gap: var(--spacing-md);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.advanced-filter {
  background: var(--background-primary);
  
  :deep(.van-nav-bar) {
    background: var(--background-secondary);
  }
  
  :deep(.van-cell-group) {
    margin: var(--spacing-md);
  }
}
</style>