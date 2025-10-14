<template>
  <div class="blacklist">
    <van-nav-bar 
      title="拉黑名单" 
      left-arrow 
      @click-left="handleBack"
    />

    <div class="blacklist-content">
      <!-- 搜索框 -->
      <div class="search-section">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索用户昵称"
          @search="handleSearch"
          @clear="handleClear"
          show-action
        >
          <template #action>
            <div @click="handleSearch">搜索</div>
          </template>
        </van-search>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stats-item">
          <span class="count">{{ filteredBlacklist.length }}</span>
          <span class="label">已拉黑用户</span>
        </div>
      </div>

      <!-- 拉黑用户列表 -->
      <div class="user-list" v-if="filteredBlacklist.length > 0">
        <div 
          v-for="user in filteredBlacklist" 
          :key="user.id"
          class="user-item"
        >
          <div class="user-info" @click="goToUserProfile(user.id)">
            <van-image
              :src="user.avatar"
              round
              width="50"
              height="50"
              fit="cover"
            />
            <div class="user-details">
              <h4>{{ user.nickname }}</h4>
              <p>{{ user.signature || '暂无个性签名' }}</p>
              <div class="block-time">
                拉黑时间：{{ formatTime(user.blockTime) }}
              </div>
            </div>
          </div>
          <div class="user-actions">
            <van-button 
              type="danger" 
              size="small" 
              plain
              @click="handleUnblock(user)"
              :loading="unblockLoading === user.id"
            >
              移除
            </van-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <van-empty 
          :description="searchKeyword ? '未找到相关用户' : '暂无拉黑用户'"
          image="search"
        >
          <van-button 
            v-if="searchKeyword" 
            type="primary" 
            size="small"
            @click="handleClear"
          >
            清除搜索
          </van-button>
        </van-empty>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-section">
        <van-loading size="24px">加载中...</van-loading>
      </div>
    </div>

    <!-- 移除确认弹窗 -->
    <van-dialog
      v-model:show="showUnblockDialog"
      title="移除拉黑"
      :message="`确定要将 ${selectedUser?.nickname} 从拉黑名单中移除吗？移除后可以重新看到该用户的内容。`"
      show-cancel-button
      @confirm="confirmUnblock"
      @cancel="cancelUnblock"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlock } from '../hooks/useBlock.js'
import { showSuccessToast, showToast } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const loading = ref(false)
const showUnblockDialog = ref(false)
const selectedUser = ref(null)
const unblockLoading = ref(null)

// 使用拉黑 hooks
const { 
  blacklist, 
  getBlacklistUsers, 
  unblockUser,
  isLoading 
} = useBlock()

// 计算属性
const filteredBlacklist = computed(() => {
  if (!searchKeyword.value.trim()) {
    return blacklist.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return blacklist.value.filter(user => 
    user.nickname.toLowerCase().includes(keyword) ||
    (user.signature && user.signature.toLowerCase().includes(keyword))
  )
})

// 方法
const handleBack = () => {
  router.back()
}

const handleSearch = () => {
  // 搜索功能通过计算属性实现，这里可以添加搜索统计等逻辑
  if (searchKeyword.value.trim()) {
    showToast(`搜索"${searchKeyword.value}"`)
  }
}

const handleClear = () => {
  searchKeyword.value = ''
}

const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

const handleUnblock = (user) => {
  selectedUser.value = user
  showUnblockDialog.value = true
}

const confirmUnblock = async () => {
  if (!selectedUser.value) return
  
  unblockLoading.value = selectedUser.value.id
  
  try {
    await unblockUser(selectedUser.value)
    showSuccessToast(`已将 ${selectedUser.value.nickname} 移出拉黑名单`)
  } catch (error) {
    showToast('移除失败，请重试')
  } finally {
    unblockLoading.value = null
    showUnblockDialog.value = false
    selectedUser.value = null
  }
}

const cancelUnblock = () => {
  showUnblockDialog.value = false
  selectedUser.value = null
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    await getBlacklistUsers()
  } catch (error) {
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped>
.blacklist {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.blacklist-content {
  padding: var(--spacing-sm);
}

.search-section {
  margin-bottom: var(--spacing-md);
  
  :deep(.van-search__action) {
    color: var(--primary-color);
    font-size: var(--font-size-md);
  }
}

.stats-section {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  text-align: center;
  
  .stats-item {
    .count {
      font-size: var(--font-size-xl);
      font-weight: bold;
      color: var(--primary-color);
      margin-right: var(--spacing-xs);
    }
    
    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
  }
}

.user-list {
  .user-item {
    display: flex;
    align-items: center;
    background: var(--background-secondary);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    
    .user-info {
      display: flex;
      align-items: center;
      flex: 1;
      cursor: pointer;
      
      .user-details {
        flex: 1;
        margin-left: var(--spacing-sm);
        
        h4 {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--text-primary);
          font-size: var(--font-size-md);
          font-weight: 500;
        }
        
        p {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          line-height: 1.4;
        }
        
        .block-time {
          color: var(--text-tertiary);
          font-size: var(--font-size-xs);
        }
      }
    }
    
    .user-actions {
      margin-left: var(--spacing-sm);
    }
    
    &:hover .user-info {
      opacity: 0.8;
    }
  }
}

.empty-state {
  padding: var(--spacing-xl) 0;
  text-align: center;
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-secondary);
}

// 响应式设计
@media (max-width: 480px) {
  .user-item {
    .user-info .user-details {
      h4 {
        font-size: var(--font-size-sm);
      }
      
      p {
        font-size: var(--font-size-xs);
      }
      
      .block-time {
        font-size: 10px;
      }
    }
    
    .user-actions {
      .van-button {
        font-size: var(--font-size-xs);
        padding: 4px 8px;
      }
    }
  }
}

// 暗色主题支持
@media (prefers-color-scheme: dark) {
  .blacklist {
    background-color: var(--dark-background-primary);
  }
  
  .stats-section,
  .user-item {
    background: var(--dark-background-secondary);
    border: 1px solid var(--dark-border-color);
  }
}
</style>