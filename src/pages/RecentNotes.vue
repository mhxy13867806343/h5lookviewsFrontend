<template>
  <div class="recent-notes">
    <van-nav-bar 
      title="最近编辑" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="filter-o" @click="showFilterPopup = true" />
      </template>
    </van-nav-bar>

    <!-- 时间筛选 -->
    <div class="time-filter">
      <van-tabs v-model:active="activeTab" @change="onTabChange">
        <van-tab title="今天" name="today"></van-tab>
        <van-tab title="昨天" name="yesterday"></van-tab>
        <van-tab title="本周" name="week"></van-tab>
        <van-tab title="本月" name="month"></van-tab>
      </van-tabs>
    </div>

    <!-- 笔记列表 -->
    <div class="notes-list">
      <div v-if="groupedNotes.length">
        <div 
          v-for="group in groupedNotes" 
          :key="group.date" 
          class="note-group"
        >
          <div class="group-header">
            <h3>{{ group.dateLabel }}</h3>
            <span class="note-count">{{ group.notes.length }} 篇</span>
          </div>
          
          <div class="group-notes">
            <div 
              v-for="note in group.notes" 
              :key="note.id" 
              class="note-item"
              @click="viewNote(note)"
            >
              <div class="note-main">
                <div class="note-header">
                  <h4 class="note-title">{{ note.title }}</h4>
                  <div class="note-time">
                    <van-icon name="clock-o" />
                    <span>{{ formatTime(note.updateTime) }}</span>
                  </div>
                </div>
                
                <p class="note-content">{{ note.excerpt }}</p>
                
                <div class="note-meta">
                  <van-tag 
                    :color="note.category.color" 
                    size="mini" 
                    plain
                  >
                    {{ note.category.name }}
                  </van-tag>
                  
                  <div class="edit-info">
                    <van-icon name="edit" />
                    <span>编辑了 {{ getEditCount(note) }} 次</span>
                  </div>
                </div>
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
        </div>
      </div>
      
      <!-- 空状态 -->
      <van-empty 
        v-else 
        description="该时间段内没有编辑过的笔记" 
        image="search"
      />
    </div>

    <!-- 筛选弹窗 -->
    <van-popup v-model:show="showFilterPopup" position="bottom" round>
      <div class="filter-popup">
        <van-nav-bar title="筛选条件" left-text="重置" @click-left="resetFilter">
          <template #right>
            <van-button type="primary" size="small" @click="applyFilter">
              确定
            </van-button>
          </template>
        </van-nav-bar>
        
        <div class="filter-content">
          <!-- 分类筛选 -->
          <div class="filter-section">
            <h4>笔记分类</h4>
            <van-checkbox-group v-model="selectedCategories">
              <van-checkbox
                v-for="category in categories"
                :key="category.id"
                :name="category.id"
                shape="square"
              >
                <div class="category-option">
                  <div 
                    class="category-color"
                    :style="{ backgroundColor: category.color }"
                  ></div>
                  <span>{{ category.name }}</span>
                </div>
              </van-checkbox>
            </van-checkbox-group>
          </div>
          
          <!-- 编辑次数筛选 -->
          <div class="filter-section">
            <h4>编辑次数</h4>
            <van-radio-group v-model="editCountFilter">
              <van-radio name="all">全部</van-radio>
              <van-radio name="single">仅编辑1次</van-radio>
              <van-radio name="multiple">编辑多次</van-radio>
              <van-radio name="frequent">频繁编辑(5次以上)</van-radio>
            </van-radio-group>
          </div>
          
          <!-- 排序方式 -->
          <div class="filter-section">
            <h4>排序方式</h4>
            <van-radio-group v-model="sortBy">
              <van-radio name="updateTime">最近编辑时间</van-radio>
              <van-radio name="editCount">编辑次数</van-radio>
              <van-radio name="title">标题排序</van-radio>
            </van-radio-group>
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showConfirmDialog, showToast } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const notes = ref([])
const activeTab = ref('today')
const showFilterPopup = ref(false)
const showActionSheet = ref(false)
const currentNote = ref(null)

// 筛选条件
const selectedCategories = ref([])
const editCountFilter = ref('all')
const sortBy = ref('updateTime')

const categories = ref([
  { id: 1, name: '生活随记', color: '#74b9ff' },
  { id: 2, name: '工作学习', color: '#00b894' },
  { id: 3, name: '美食分享', color: '#fdcb6e' },
  { id: 4, name: '旅行游记', color: '#fd79a8' },
  { id: 5, name: '读书笔记', color: '#6c5ce7' },
  { id: 6, name: '运动健身', color: '#e17055' },
])

const noteActions = [
  { name: '继续编辑', value: 'edit' },
  { name: '查看历史', value: 'history' },
  { name: '复制链接', value: 'copy' },
  { name: '分享笔记', value: 'share' },
  { name: '删除笔记', value: 'delete', color: '#ee0a24' },
  { name: '取消', value: 'cancel' },
]

// 计算属性
const filteredNotes = computed(() => {
  let result = notes.value

  // 时间筛选
  const now = dayjs()
  switch (activeTab.value) {
    case 'today':
      result = result.filter(note => 
        now.isSame(dayjs(note.updateTime), 'day')
      )
      break
    case 'yesterday':
      result = result.filter(note => 
        now.subtract(1, 'day').isSame(dayjs(note.updateTime), 'day')
      )
      break
    case 'week':
      result = result.filter(note => 
        now.isSame(dayjs(note.updateTime), 'week')
      )
      break
    case 'month':
      result = result.filter(note => 
        now.isSame(dayjs(note.updateTime), 'month')
      )
      break
  }

  // 分类筛选
  if (selectedCategories.value.length > 0) {
    result = result.filter(note => 
      selectedCategories.value.includes(note.category.id)
    )
  }

  // 编辑次数筛选
  switch (editCountFilter.value) {
    case 'single':
      result = result.filter(note => note.editCount === 1)
      break
    case 'multiple':
      result = result.filter(note => note.editCount > 1 && note.editCount <= 5)
      break
    case 'frequent':
      result = result.filter(note => note.editCount > 5)
      break
  }

  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'updateTime':
        return new Date(b.updateTime) - new Date(a.updateTime)
      case 'editCount':
        return b.editCount - a.editCount
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  return result
})

const groupedNotes = computed(() => {
  const groups = {}
  
  filteredNotes.value.forEach(note => {
    const date = dayjs(note.updateTime).format('YYYY-MM-DD')
    if (!groups[date]) {
      groups[date] = {
        date,
        dateLabel: formatDateLabel(note.updateTime),
        notes: []
      }
    }
    groups[date].notes.push(note)
  })
  
  return Object.values(groups).sort((a, b) => 
    dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
  )
})

// 方法
const handleBack = () => {
  router.back()
}

const viewNote = (note) => {
  router.push(`/note/${note.id}`)
}

const onTabChange = () => {
  // 标签切换时可以重新加载数据
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

const resetFilter = () => {
  selectedCategories.value = []
  editCountFilter.value = 'all'
  sortBy.value = 'updateTime'
}

const applyFilter = () => {
  showFilterPopup.value = false
  // 筛选条件已经通过计算属性自动应用
}

const onActionSelect = (action) => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'edit':
      router.push(`/note/edit/${currentNote.value.id}`)
      break
    case 'history':
      showSuccessToast('查看编辑历史功能开发中')
      break
    case 'copy':
      showSuccessToast('链接已复制')
      break
    case 'share':
      showSuccessToast('分享功能开发中')
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
  return dayjs(time).format('HH:mm')
}

const formatDateLabel = (time) => {
  const now = dayjs()
  const noteTime = dayjs(time)
  
  if (now.isSame(noteTime, 'day')) {
    return '今天'
  } else if (now.subtract(1, 'day').isSame(noteTime, 'day')) {
    return '昨天'
  } else if (now.isSame(noteTime, 'week')) {
    return noteTime.format('dddd')
  } else if (now.isSame(noteTime, 'year')) {
    return noteTime.format('MM月DD日')
  } else {
    return noteTime.format('YYYY年MM月DD日')
  }
}

const getEditCount = (note) => {
  return note.editCount || 1
}

// 生成模拟数据
const generateMockNotes = () => {
  const titles = [
    '今天的工作总结', 'Vue3新特性学习', '美味早餐制作记录',
    '周末计划安排', '读书心得分享', '健身打卡记录',
    '项目进度更新', '学习笔记整理', '生活感悟随记'
  ]

  const contents = [
    '今天完成了几个重要的工作任务，感觉很有成就感...',
    '学习了Vue3的Composition API，确实比Options API更灵活...',
    '尝试做了新的早餐搭配，营养丰富又美味...',
    '计划这个周末去爬山，呼吸新鲜空气，放松心情...',
    '这本书给了我很多启发，值得反复阅读...',
    '坚持健身一个月了，身体状态明显改善...'
  ]

  const now = dayjs()
  const notes = []

  // 生成不同时间段的笔记
  for (let i = 0; i < 30; i++) {
    const randomHours = Math.floor(Math.random() * 24 * 7) // 最近7天内
    const updateTime = now.subtract(randomHours, 'hour').toDate()
    
    notes.push({
      id: i + 1,
      title: titles[Math.floor(Math.random() * titles.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      excerpt: contents[Math.floor(Math.random() * contents.length)].substring(0, 60) + '...',
      category: categories.value[Math.floor(Math.random() * categories.value.length)],
      createTime: new Date(updateTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updateTime,
      editCount: Math.floor(Math.random() * 10) + 1,
      isFavorite: Math.random() > 0.7,
    })
  }

  return notes.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
}

// 初始化数据
onMounted(() => {
  notes.value = generateMockNotes()
})
</script>

<style lang="scss" scoped>
.recent-notes {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.time-filter {
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
  
  :deep(.van-tabs__nav) {
    background: transparent;
  }
  
  :deep(.van-tab) {
    color: var(--text-secondary);
    
    &.van-tab--active {
      color: var(--primary-color);
    }
  }
}

.notes-list {
  padding: var(--spacing-sm);
}

.note-group {
  margin-bottom: var(--spacing-lg);
  
  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--background-secondary);
    border-radius: var(--border-radius-sm);
    margin-bottom: var(--spacing-sm);
    
    h3 {
      margin: 0;
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .note-count {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
  
  .group-notes {
    .note-item {
      display: flex;
      background: var(--background-secondary);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-xs);
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .note-main {
        flex: 1;
        
        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-sm);
          
          .note-title {
            margin: 0;
            font-size: var(--font-size-md);
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.4;
            flex: 1;
          }
          
          .note-time {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            margin-left: var(--spacing-sm);
            
            .van-icon {
              font-size: 12px;
            }
          }
        }
        
        .note-content {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--text-secondary);
          line-height: 1.5;
          font-size: var(--font-size-sm);
        }
        
        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .edit-info {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            
            .van-icon {
              font-size: 12px;
            }
          }
        }
      }
      
      .note-actions {
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
  }
}

.filter-popup {
  max-height: 80vh;
  
  .filter-content {
    padding: var(--spacing-md);
    
    .filter-section {
      margin-bottom: var(--spacing-lg);
      
      h4 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-md);
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .van-checkbox, .van-radio {
        margin-bottom: var(--spacing-sm);
        
        .category-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          
          .category-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
        }
      }
    }
  }
}
</style>