<template>
  <div class="recyclebin">
    <van-nav-bar title="回收站" />
    
    <div class="recyclebin-content">
      <van-empty v-if="deletedNotes.length === 0" description="回收站为空">
        <van-button type="primary" @click="goToHome">
          去写笔记
        </van-button>
      </van-empty>

      <div v-else>
        <div class="tips">
          <van-notice-bar
            left-icon="info-o"
            text="回收站中的笔记将在30天后自动永久删除"
          />
        </div>
        
        <div class="deleted-notes-list">
          <van-swipe-cell 
            v-for="note in deletedNotes" 
            :key="note.id"
            class="note-item"
          >
            <template #left>
              <van-button 
                square 
                type="primary" 
                text="恢复" 
                class="action-button"
                @click="restoreNote(note)" 
              />
            </template>
            
            <div class="note-card" @click="previewNote(note)">
              <div class="note-header">
                <div class="note-title">{{ note.title || '无标题' }}</div>
                <div class="delete-time">{{ formatDeleteTime(note.deleteTime) }}</div>
              </div>
              <div class="note-content">{{ note.content.slice(0, 100) }}{{ note.content.length > 100 ? '...' : '' }}</div>
              <div class="note-meta">
                <van-tag size="small" :color="note.categoryColor">{{ note.category }}</van-tag>
                <span class="original-time">{{ formatTime(note.createTime) }}</span>
              </div>
            </div>
            
            <template #right>
              <van-button 
                square 
                type="danger" 
                text="永久删除" 
                class="action-button"
                @click="permanentDelete(note)" 
              />
            </template>
          </van-swipe-cell>
        </div>

        <van-action-bar>
          <van-action-bar-button type="warning" text="清空回收站" @click="clearRecycleBin" />
          <van-action-bar-button type="primary" text="批量恢复" @click="batchRestore" />
        </van-action-bar>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showConfirmDialog } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()

// 模拟已删除的笔记数据
const deletedNotes = ref([
  {
    id: 1,
    title: '今天的心情',
    content: '今天天气很好，心情也很好。去公园走了走，看到了很多美丽的花朵。生活中总有很多值得珍惜的美好瞬间。',
    category: '生活随记',
    categoryColor: '#74b9ff',
    createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deleteTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2,
    title: '学习笔记',
    content: 'Vue3 的 Composition API 真的很好用，可以让代码组织得更加清晰。今天学习了 ref 和 reactive 的区别。',
    category: '工作学习',
    categoryColor: '#00b894',
    createTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    deleteTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 3,
    title: '',
    content: '今天做了一道新菜，味道还不错。分享一下制作过程：先准备食材，然后...',
    category: '美食分享',
    categoryColor: '#fdcb6e',
    createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deleteTime: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
])

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatDeleteTime = (time) => {
  const now = dayjs()
  const deleteTime = dayjs(time)
  const diffDays = now.diff(deleteTime, 'day')
  
  if (diffDays === 0) {
    const diffHours = now.diff(deleteTime, 'hour')
    if (diffHours === 0) {
      const diffMinutes = now.diff(deleteTime, 'minute')
      return `${diffMinutes}分钟前删除`
    }
    return `${diffHours}小时前删除`
  }
  
  return `${diffDays}天前删除`
}

// 方法
const goToHome = () => {
  router.push('/home')
}

const restoreNote = (note) => {
  showConfirmDialog({
    title: '恢复笔记',
    message: `确定要恢复笔记"${note.title || '无标题'}"吗？`,
  }).then(() => {
    const index = deletedNotes.value.findIndex(n => n.id === note.id)
    if (index !== -1) {
      deletedNotes.value.splice(index, 1)
      showSuccessToast('笔记已恢复')
    }
  }).catch(() => {
    // 用户取消
  })
}

const permanentDelete = (note) => {
  showConfirmDialog({
    title: '永久删除',
    message: `确定要永久删除笔记"${note.title || '无标题'}"吗？删除后无法找回。`,
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    const index = deletedNotes.value.findIndex(n => n.id === note.id)
    if (index !== -1) {
      deletedNotes.value.splice(index, 1)
      showSuccessToast('笔记已永久删除')
    }
  }).catch(() => {
    // 用户取消
  })
}

const previewNote = (note) => {
  showSuccessToast(`预览笔记: ${note.title || '无标题'}`)
}

const clearRecycleBin = () => {
  showConfirmDialog({
    title: '清空回收站',
    message: '确定要清空回收站吗？所有笔记将被永久删除，无法找回。',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    deletedNotes.value = []
    showSuccessToast('回收站已清空')
  }).catch(() => {
    // 用户取消
  })
}

const batchRestore = () => {
  showConfirmDialog({
    title: '批量恢复',
    message: '确定要恢复回收站中的所有笔记吗？',
  }).then(() => {
    const count = deletedNotes.value.length
    deletedNotes.value = []
    showSuccessToast(`已恢复 ${count} 篇笔记`)
  }).catch(() => {
    // 用户取消
  })
}
</script>

<style lang="scss" scoped>
.recyclebin {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.recyclebin-content {
  padding: var(--spacing-sm);
}

.tips {
  margin-bottom: var(--spacing-md);
}

.deleted-notes-list {
  margin-bottom: 50px; // 为 action-bar 留空间
}

.note-item {
  margin-bottom: var(--spacing-sm);
  
  .action-button {
    height: 100%;
  }
}

.note-card {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

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
  
  .delete-time {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }
}

.note-content {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-sm);
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .original-time {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }
}
</style>