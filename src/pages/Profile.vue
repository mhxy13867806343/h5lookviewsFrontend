<template>
  <div class="profile">
    <van-nav-bar title="个人中心" />

    <div class="profile-content">
      <!-- 用户信息 -->
      <div class="user-info" v-if="userStore.isLoggedIn">
        <div class="avatar" @click="viewMyProfile">
          <van-image
            :src="userStore.user.avatar"
            round
            width="80"
            height="80"
            fit="cover"
          />
        </div>
        <div class="user-details">
          <h3>{{ userStore.user.nickname }}</h3>
          <p>{{ userStore.user.signature || '暂无个性签名' }}</p>
        </div>
        <van-icon name="edit" class="edit-icon" @click="editProfile" />
      </div>

      <!-- 未登录状态 -->
      <div class="login-prompt" v-else>
        <van-empty description="请先登录">
          <van-button type="primary" @click="goToLogin">
            立即登录
          </van-button>
        </van-empty>
      </div>

      <!-- 登录后的功能菜单 -->
      <div v-if="userStore.isLoggedIn" class="menu-list">
        <van-cell-group>
          <van-cell title="每日签到" icon="calendar-o" is-link @click="goToCheckIn" />
          <van-cell title="发现用户" icon="friends-o" is-link @click="goToDiscoverUsers" />
          <van-cell title="我的动态" icon="like-o" is-link @click="goToMyPosts" />
          <van-cell title="我的笔记" icon="notes-o" is-link @click="goToMyNotes" />
          <van-cell title="个人信息" icon="manager-o" is-link @click="editProfile" />
          <van-cell title="退出登录" icon="sign" is-link @click="logout" />
        </van-cell-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showSuccessToast, showConfirmDialog } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 方法
const goToLogin = () => {
  router.push('/login')
}

const goToCheckIn = () => {
  router.push('/checkin')
}

const goToDiscoverUsers = () => {
  showSuccessToast('发现用户功能开发中')
}

const viewMyProfile = () => {
  router.push(`/user/${userStore.user.id}`)
}

const editProfile = () => {
  showSuccessToast('编辑个人信息功能')
}

const goToMyPosts = () => {
  showSuccessToast('查看我的动态')
}

const goToMyNotes = () => {
  showSuccessToast('查看我的笔记')
}

const logout = () => {
  showConfirmDialog({
    title: '退出登录',
    message: '确定要退出登录吗？',
  }).then(() => {
    userStore.logout()
    showSuccessToast('已退出登录')
    router.push('/home')
  }).catch(() => {
    // 用户取消
  })
}
</script>

<style lang="scss" scoped>
.profile {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.profile-content {
  padding: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
  position: relative;
  color: white;

  .avatar {
    margin-right: var(--spacing-md);
  }

  .user-details {
    flex: 1;

    h3 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-lg);
      font-weight: bold;
    }

    p {
      margin: 0;
      opacity: 0.8;
      font-size: var(--font-size-sm);
    }
  }

  .edit-icon {
    color: white;
    font-size: 20px;
    opacity: 0.8;
  }
}

.login-prompt {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.menu-list {
  :deep(.van-cell__left-icon) {
    color: var(--primary-color);
    margin-right: var(--spacing-sm);
  }
}
</style>