<template>
  <div class="view-history-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="浏览历史"
      left-arrow
      @click-left="handleBack"
      fixed
      placeholder
    >
      <template #right>
        <van-icon 
          name="delete-o" 
          size="18"
          @click="showClearConfirm"
          v-if="historyList.length > 0"
        />
      </template>
    </van-nav-bar>

    <!-- 搜索框 -->
    <div class="search-container" v-if="historyList.length > 0">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索浏览历史"
        shape="round"
        @search="onSearch"
        @clear="onClearSearch"
      />
    </div>

    <!-- 历史记录列表 -->
    <div class="history-list" v-if="filteredHistory.length > 0">
      <van-swipe-cell 
        v-for="item in filteredHistory" 
        :key="item.id"
      >
        <div class="history-item" @click="handleVisit(item)">
          <!-- 左侧图标 -->
          <div class="item-icon">
            <van-icon 
              :name="getPageIcon(item.type)" 
              size="24"
              :color="getPageColor(item.type)"
            />
          </div>

          <!-- 中间内容 -->
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span class="item-type">{{ getPageTypeName(item.type) }}</span>
              <span class="item-time">{{ formatTime(item.visitTime) }}</span>
            </div>
            <div class="item-desc" v-if="item.description">
              {{ item.description }}
            </div>
          </div>

          <!-- 右侧箭头 -->
          <div class="item-arrow">
            <van-icon name="arrow" color="#c8c9cc" />
          </div>
        </div>

        <template #right>
          <van-button 
            square 
            text="删除" 
            type="danger" 
            class="delete-button"
            @click="handleDelete(item.id)"
          />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 空状态 -->
    <van-empty
      v-else
      :image="emptyImage"
      :description="searchKeyword ? '未找到相关记录' : '暂无浏览历史'"
    >
      <van-button 
        v-if="!searchKeyword" 
        round 
        type="primary" 
        class="bottom-button"
        @click="router.push('/home')"
      >
        去逛逛
      </van-button>
    </van-empty>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import dayjs from 'dayjs'
import { 
  getViewHistory, 
  removeViewHistory, 
  clearViewHistory,
  saveViewHistory,
  type ViewHistoryItem 
} from '../utils/viewHistory'

const router = useRouter()

// 响应式数据
const searchKeyword = ref<string>('')
const historyList = ref<ViewHistoryItem[]>([])
const emptyImage = 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png'

// 计算属性 - 过滤后的历史记录
const filteredHistory = computed<ViewHistoryItem[]>(() => {
  if (!searchKeyword.value) {
    return historyList.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return historyList.value.filter(item => 
    item.title.toLowerCase().includes(keyword) ||
    item.description?.toLowerCase().includes(keyword) ||
    getPageTypeName(item.type).toLowerCase().includes(keyword)
  )
})

// 方法
const handleBack = (): void => {
  router.back()
}

// 获取页面图标
const getPageIcon = (type: ViewHistoryItem['type']): string => {
  const iconMap: Record<ViewHistoryItem['type'], string> = {
    note: 'notes-o',
    post: 'photo-o',
    user: 'user-o',
    category: 'apps-o',
    search: 'search',
    other: 'records'
  }
  return iconMap[type] || 'records'
}

// 获取页面颜色
const getPageColor = (type: ViewHistoryItem['type']): string => {
  const colorMap: Record<ViewHistoryItem['type'], string> = {
    note: '#ff6b6b',
    post: '#4ecb73',
    user: '#1989fa',
    category: '#ff976a',
    search: '#7232dd',
    other: '#969799'
  }
  return colorMap[type] || '#969799'
}

// 获取页面类型名称
const getPageTypeName = (type: ViewHistoryItem['type']): string => {
  const nameMap: Record<ViewHistoryItem['type'], string> = {
    note: '笔记',
    post: '帖子',
    user: '用户',
    category: '分类',
    search: '搜索',
    other: '其他'
  }
  return nameMap[type] || '未知'
}

// 格式化时间
const formatTime = (time: string): string => {
  const now = dayjs()
  const visitTime = dayjs(time)
  const diffMinutes = now.diff(visitTime, 'minute')
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  
  const diffHours = now.diff(visitTime, 'hour')
  if (diffHours < 24) return `${diffHours}小时前`
  
  const diffDays = now.diff(visitTime, 'day')
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  if (now.year() === visitTime.year()) {
    return visitTime.format('MM-DD HH:mm')
  }
  
  return visitTime.format('YYYY-MM-DD')
}

// 访问历史记录
const handleVisit = (item: ViewHistoryItem): void => {
  // 更新访问时间
  item.visitTime = new Date().toISOString()
  saveViewHistory(historyList.value)
  
  // 跳转到对应页面
  router.push(item.path)
}

// 删除单条记录
const handleDelete = (id: string): void => {
  showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这条浏览记录吗？',
  }).then(() => {
    historyList.value = historyList.value.filter(item => item.id !== id)
    removeViewHistory(id)
    showSuccessToast('删除成功')
  }).catch(() => {
    // 用户取消删除
  })
}

// 显示清空确认对话框
const showClearConfirm = (): void => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空所有浏览历史吗？此操作不可恢复。',
    confirmButtonText: '确定清空',
    confirmButtonColor: '#ee0a24',
  }).then(() => {
    handleClearAll()
  }).catch(() => {
    // 用户取消清空
  })
}

// 清空所有历史记录
const handleClearAll = (): void => {
  historyList.value = []
  searchKeyword.value = ''
  clearViewHistory()
  showSuccessToast('已清空浏览历史')
}

// 搜索
const onSearch = (): void => {
  // 搜索逻辑已在 computed 中实现
  if (filteredHistory.value.length === 0) {
    showToast('未找到相关记录')
  }
}

// 清除搜索
const onClearSearch = (): void => {
  searchKeyword.value = ''
}

// 加载历史记录
const loadHistory = (): void => {
  try {
    const history = getViewHistory()
    if (history.length > 0) {
      historyList.value = history
    } else {
      // 如果没有历史记录，生成一些模拟数据
      generateMockHistory()
    }
  } catch (error) {
    console.error('加载浏览历史失败:', error)
    generateMockHistory()
  }
}

// 生成模拟历史数据
const generateMockHistory = (): void => {
  const mockData: ViewHistoryItem[] = [
    {
      id: '1',
      type: 'note',
      title: 'Vue 3 组合式 API 最佳实践',
      description: '详细介绍 Vue 3 Composition API 的使用技巧和注意事项',
      path: '/note/1',
      visitTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'post',
      title: '今天的晚霞真美',
      description: '分享今天拍到的美丽晚霞照片',
      path: '/post/101',
      visitTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'user',
      title: '前端小李',
      description: '关注: 128 | 粉丝: 5.2K',
      path: '/user/88',
      visitTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      type: 'note',
      title: 'TypeScript 进阶技巧',
      description: '深入理解 TypeScript 的高级类型系统',
      path: '/note/2',
      visitTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      type: 'category',
      title: '前端开发',
      description: '前端技术相关的笔记和文章',
      path: '/category?type=frontend',
      visitTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '6',
      type: 'search',
      title: '搜索: React Hooks',
      description: '搜索关键词: React Hooks',
      path: '/search?q=React+Hooks',
      visitTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]
  
  historyList.value = mockData
  saveViewHistory(mockData)
}

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistory()
})
</script>

<style lang="scss" scoped>
.view-history-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

.search-container {
  background: #fff;
  padding: 8px 0;
  margin-bottom: 8px;
}

.history-list {
  background: #fff;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s;

  &:active {
    background-color: #f7f8fa;
  }

  .item-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f8fa;
    border-radius: 50%;
    margin-right: 12px;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-size: 15px;
    font-weight: 500;
    color: #323233;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #969799;
    margin-bottom: 4px;

    .item-type {
      padding: 2px 8px;
      background: #f2f3f5;
      border-radius: 10px;
      margin-right: 8px;
    }

    .item-time {
      flex-shrink: 0;
    }
  }

  .item-desc {
    font-size: 13px;
    color: #969799;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-arrow {
    flex-shrink: 0;
    margin-left: 8px;
  }
}

.delete-button {
  height: 100%;
}

.bottom-button {
  width: 160px;
  margin-top: 20px;
}

:deep(.van-swipe-cell) {
  &:not(:last-child) {
    .history-item {
      border-bottom: 1px solid #ebedf0;
    }
  }
}
</style>
