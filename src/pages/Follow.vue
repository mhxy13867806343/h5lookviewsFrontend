<template>
  <div class="follow-page">
    <van-nav-bar :title="pageTitle" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="search" @click="showSearch = !showSearch" />
      </template>
    </van-nav-bar>
    
    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索用户"
        @search="onSearch"
        @clear="onClearSearch"
      />
    </div>
    
    <!-- 标签页切换 -->
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="关注" name="following">
        <div class="follow-list">
          <div v-if="followingLoading" class="loading-wrapper">
            <van-loading size="24px">加载中...</van-loading>
          </div>
          <div v-else-if="filteredFollowing.length === 0" class="empty-wrapper">
            <van-empty description="暂无关注的用户" />
          </div>
          <div v-else>
            <van-cell-group>
              <van-cell
                v-for="user in filteredFollowing"
                :key="user.id"
                :title="user.nickname"
                :label="user.signature"
                @click="goToUserProfile(user.id)"
              >
                <template #icon>
                  <van-image
                    :src="user.avatar"
                    round
                    width="40"
                    height="40"
                    class="user-avatar"
                  />
                </template>
                <template #right-icon>
                  <van-button
                    size="small"
                    :type="user.isFollowed ? 'default' : 'primary'"
                    @click.stop="toggleFollow(user)"
                  >
                    {{ user.isFollowed ? '已关注' : '关注' }}
                  </van-button>
                </template>
              </van-cell>
            </van-cell-group>
          </div>
        </div>
      </van-tab>
      
      <van-tab title="粉丝" name="followers">
        <div class="follow-list">
          <div v-if="followersLoading" class="loading-wrapper">
            <van-loading size="24px">加载中...</van-loading>
          </div>
          <div v-else-if="filteredFollowers.length === 0" class="empty-wrapper">
            <van-empty description="暂无粉丝" />
          </div>
          <div v-else>
            <van-cell-group>
              <van-cell
                v-for="user in filteredFollowers"
                :key="user.id"
                :title="user.nickname"
                :label="user.signature"
                @click="goToUserProfile(user.id)"
              >
                <template #icon>
                  <van-image
                    :src="user.avatar"
                    round
                    width="40"
                    height="40"
                    class="user-avatar"
                  />
                </template>
                <template #right-icon>
                  <van-button
                    size="small"
                    :type="user.isFollowed ? 'default' : 'primary'"
                    @click.stop="toggleFollow(user)"
                  >
                    {{ user.isFollowed ? '已关注' : '关注' }}
                  </van-button>
                </template>
              </van-cell>
            </van-cell-group>
            
            <!-- 互相关注标识 -->
            <div class="mutual-follow-tip" v-if="mutualFollowCount > 0">
              <van-notice-bar
                :text="`${mutualFollowCount} 位用户与你互相关注`"
                left-icon="friends-o"
                color="#1989fa"
                background="#ecf5ff"
              />
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showConfirmDialog } from 'vant'

const router = useRouter()
const route = useRoute()

// 响应式数据
const activeTab = ref('following')
const showSearch = ref(false)
const searchKeyword = ref('')
const followingLoading = ref(false)
const followersLoading = ref(false)

// 关注列表数据
const followingList = ref([
  {
    id: 1,
    nickname: '小明同学',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '热爱生活，热爱编程',
    isFollowed: true,
    followTime: '2024-10-01'
  },
  {
    id: 2,
    nickname: '设计师小李',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: 'UI/UX设计师，分享设计心得',
    isFollowed: true,
    followTime: '2024-09-28'
  },
  {
    id: 3,
    nickname: '摄影爱好者',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '用镜头记录美好瞬间',
    isFollowed: true,
    followTime: '2024-09-25'
  },
  {
    id: 4,
    nickname: '美食达人',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '探索各地美食文化',
    isFollowed: true,
    followTime: '2024-09-20'
  }
])

// 粉丝列表数据
const followersList = ref([
  {
    id: 5,
    nickname: '粉丝用户A',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '你的忠实粉丝',
    isFollowed: false,
    followTime: '2024-10-10'
  },
  {
    id: 6,
    nickname: '粉丝用户B',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '喜欢你的内容',
    isFollowed: true,
    followTime: '2024-10-08'
  },
  {
    id: 7,
    nickname: '新关注者',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '刚刚关注了你',
    isFollowed: false,
    followTime: '2024-10-12'
  },
  {
    id: 1,
    nickname: '小明同学',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    signature: '热爱生活，热爱编程',
    isFollowed: true,
    followTime: '2024-10-01'
  }
])

// 计算属性
const pageTitle = computed(() => {
  const followingCount = followingList.value.length
  const followersCount = followersList.value.length
  return activeTab.value === 'following' 
    ? `关注 ${followingCount}` 
    : `粉丝 ${followersCount}`
})

const filteredFollowing = computed(() => {
  if (!searchKeyword.value) return followingList.value
  return followingList.value.filter(user => 
    user.nickname.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    user.signature.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const filteredFollowers = computed(() => {
  if (!searchKeyword.value) return followersList.value
  return followersList.value.filter(user => 
    user.nickname.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    user.signature.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const mutualFollowCount = computed(() => {
  const followingIds = followingList.value.map(user => user.id)
  return followersList.value.filter(user => followingIds.includes(user.id)).length
})

// 方法
const onTabChange = (name) => {
  activeTab.value = name
  searchKeyword.value = ''
  showSearch.value = false
}

const onSearch = (value) => {
  console.log('搜索用户:', value)
}

const onClearSearch = () => {
  searchKeyword.value = ''
}

const toggleFollow = async (user) => {
  try {
    if (user.isFollowed) {
      await showConfirmDialog({
        title: '确认取消关注',
        message: `确定要取消关注 ${user.nickname} 吗？`,
      })
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    user.isFollowed = !user.isFollowed
    
    if (user.isFollowed) {
      showSuccessToast('关注成功')
      // 如果在粉丝页面关注了用户，同时添加到关注列表
      if (activeTab.value === 'followers' && !followingList.value.find(u => u.id === user.id)) {
        followingList.value.unshift({ ...user, isFollowed: true })
      }
    } else {
      showSuccessToast('已取消关注')
      // 如果取消关注，从关注列表中移除
      if (activeTab.value === 'following') {
        const index = followingList.value.findIndex(u => u.id === user.id)
        if (index > -1) {
          followingList.value.splice(index, 1)
        }
      }
    }
  } catch (error) {
    // 用户取消操作
  }
}

const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

const loadFollowingData = async () => {
  followingLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    // followingList.value = data
  } catch (error) {
    showSuccessToast('加载失败')
  } finally {
    followingLoading.value = false
  }
}

const loadFollowersData = async () => {
  followersLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    // followersList.value = data
  } catch (error) {
    showSuccessToast('加载失败')
  } finally {
    followersLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  // 根据路由参数设置默认标签页
  if (route.query.tab) {
    activeTab.value = route.query.tab
  }
  
  // 加载数据
  if (activeTab.value === 'following') {
    loadFollowingData()
  } else {
    loadFollowersData()
  }
})
</script>

<style lang="scss" scoped>
.follow-page {
  background-color: var(--background-primary);
  min-height: 100vh;
  
  :deep(.van-nav-bar) {
    background-color: var(--background-secondary);
  }
}

.search-section {
  padding: var(--spacing-md);
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.follow-list {
  padding: var(--spacing-sm) 0;
  
  .loading-wrapper,
  .empty-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-xl) 0;
  }
  
  :deep(.van-cell-group) {
    margin: 0 var(--spacing-md);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }
  
  :deep(.van-cell) {
    padding: var(--spacing-md);
    
    &:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }
    
    .van-cell__title {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .van-cell__label {
      color: var(--text-secondary);
      margin-top: var(--spacing-xs);
      font-size: var(--font-size-sm);
    }
  }
  
  .user-avatar {
    margin-right: var(--spacing-md);
  }
}

.mutual-follow-tip {
  margin: var(--spacing-md);
  
  :deep(.van-notice-bar) {
    border-radius: var(--border-radius-md);
  }
}

:deep(.van-tabs) {
  .van-tabs__nav {
    background-color: var(--background-secondary);
  }
  
  .van-tab {
    color: var(--text-secondary);
    
    &.van-tab--active {
      color: var(--primary-color);
    }
  }
  
  .van-tabs__line {
    background-color: var(--primary-color);
  }
}

:deep(.van-button) {
  &.van-button--small {
    padding: 0 var(--spacing-sm);
    height: 28px;
    font-size: var(--font-size-sm);
  }
  
  &.van-button--default {
    background-color: var(--background-tertiary);
    color: var(--text-secondary);
    border-color: var(--border-color);
  }
}
</style>