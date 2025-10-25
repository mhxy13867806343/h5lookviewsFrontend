<template>
  <div class="profile">
    <van-nav-bar title="个人中心" />

    <div class="profile-content">
      <!-- 用户信息 -->
      <div class="user-info" v-if="userStore.isLoggedIn">
        <div class="avatar" @click="viewMyProfile">
          <van-image
            :src="userStore.user?.avatar"
            round
            width="80"
            height="80"
            fit="cover"
          />
        </div>
        <div class="user-details">
          <h3>{{ userStore.user?.nickname }}</h3>
          <p>{{ userStore.user?.signature || '暂无个性签名' }}</p>
          
          <!-- 用户标签显示 -->
          <div class="user-tags" v-if="userTags.length > 0">
            <span v-for="tag in userTags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            <span v-if="userTags.length > 3" class="more-tags">+{{ userTags.length - 3 }}</span>
          </div>
        </div>
        <van-icon name="edit" class="edit-icon" @click="editProfile" />
      </div>

      <!-- 用户统计 -->
      <div class="user-stats" v-if="userStore.isLoggedIn">
        <div class="stat-item" @click="goToFollow('followers')">
          <div class="stat-number">1234</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item" @click="goToFollow('following')">
          <div class="stat-number">567</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item" @click="goToMyPosts">
          <div class="stat-number">89</div>
          <div class="stat-label">动态</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">2345</div>
          <div class="stat-label">获赞</div>
        </div>
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
          <van-cell title="个人资料" icon="manager-o" is-link @click="editProfile" />
          <van-cell title="个人标签" icon="label-o" is-link @click="editTags" />
          <van-cell title="每日签到" icon="calendar-o" is-link @click="goToCheckIn" />
          <van-cell title="发现用户" icon="friends-o" is-link @click="goToDiscoverUsers" />
          <van-cell title="我的动态" icon="like-o" is-link @click="goToMyPosts" />
          <van-cell title="我的笔记" icon="notes-o" is-link @click="goToMyNotes" />
          <van-cell title="账号与安全" icon="shield-o" is-link />
          <van-cell title="消息中心" icon="chat-o" is-link @click="goToMessages">
            <template #right-icon>
              <van-badge v-if="unreadMessageCount > 0" :content="unreadMessageCount > 99 ? '99+' : unreadMessageCount" />
            </template>
          </van-cell>
          <van-cell title="隐私设置" icon="eye-o" is-link />
          <van-cell title="拉黑名单" icon="delete-o" is-link @click="goToBlacklist" />
          <van-cell title="退出登录" icon="sign" is-link @click="logout" />
        </van-cell-group>
      </div>
    </div>



    <!-- 编辑标签弹窗 -->
    <van-popup v-model:show="showEditTags" position="bottom" :style="{ height: '80%' }">
      <div class="edit-tags">
        <van-nav-bar title="编辑标签" left-text="取消" right-text="保存" 
          @click-left="showEditTags = false" @click-right="saveTags" />
        
        <div class="tags-content">
          <!-- 当前标签 -->
          <div class="current-tags">
            <h3>我的标签 ({{ userTags.length }}/6)</h3>
            <div class="tags-list">
              <div v-for="(tag, index) in userTags" :key="index" class="tag-item">
                <span class="tag-text">{{ tag }}</span>
                <van-icon name="cross" @click="removeTag(index)" />
              </div>
              <div v-if="userTags.length === 0" class="empty-tags">
                暂无标签，快来添加吧~
              </div>
            </div>
          </div>

          <!-- 添加新标签 -->
          <div class="add-tag">
            <h3>添加标签</h3>
            <div class="tag-input">
              <van-field 
                v-model="newTag" 
                placeholder="输入标签内容 (最多20字符)" 
                maxlength="20"
                :show-word-limit="true"
                @keyup.enter="addTag"
              />
              <van-button type="primary" size="small" @click="addTag" :disabled="!canAddTag">
                添加
              </van-button>
            </div>
          </div>

          <!-- 推荐标签 -->
          <div class="recommended-tags">
            <h3>推荐标签</h3>
            <div class="tags-grid">
              <div 
                v-for="tag in recommendedTags" 
                :key="tag" 
                class="recommended-tag"
                :class="{ disabled: userTags.includes(tag) || userTags.length >= 6 }"
                @click="addRecommendedTag(tag)"
              >
                {{ tag }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showSuccessToast, showConfirmDialog, showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 弹窗状态
const showEditTags = ref(false)

// 未读消息数量
const unreadMessageCount = ref(16)

// 标签相关数据
const userTags = ref(['热爱生活', '美食达人', '旅行家', '读书人'])
const newTag = ref('')
const recommendedTags = ref([
  '热爱生活', '美食达人', '旅行家', '读书人', '摄影爱好者', '运动健将',
  '音乐发烧友', '电影迷', '游戏玩家', '宠物达人', '时尚达人', '技术宅',
  '咖啡控', '甜品控', '健身达人', '瑜伽爱好者', '画画爱好者', '手工达人',
  '花艺师', '烘焙师', '茶艺师', '收藏家', '极简主义', '文艺青年'
])

// 计算属性
const canAddTag = computed(() => {
  return newTag.value.trim() && 
         newTag.value.trim().length <= 20 && 
         userTags.value.length < 6 && 
         !userTags.value.includes(newTag.value.trim())
})

// 基础方法
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
  router.push(`/user/${userStore.user?.id}`)
}

const goToMyPosts = () => {
  // 跳转到用户详情页的动态tab
  router.push(`/user/${userStore.user.id}`)
}

const goToMyNotes = () => {
  // 模拟跳转到笔记详情页
  router.push('/note/demo-note-1')
}

const goToBlacklist = () => {
  router.push('/blacklist')
}

const goToFollow = (tab = 'following') => {
  router.push(`/follow?tab=${tab}`)
}

const goToMessages = () => {
  router.push('/messages')
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

// 编辑资料相关方法
const editProfile = () => {
  router.push('/edit-profile')
}



// 标签相关方法
const editTags = () => {
  showEditTags.value = true
}

const addTag = () => {
  if (canAddTag.value) {
    userTags.value.push(newTag.value.trim())
    newTag.value = ''
    showToast('标签添加成功')
  }
}

const removeTag = (index) => {
  userTags.value.splice(index, 1)
  showToast('标签删除成功')
}

const addRecommendedTag = (tag) => {
  if (!userTags.value.includes(tag) && userTags.value.length < 6) {
    userTags.value.push(tag)
    showToast('标签添加成功')
  } else if (userTags.value.length >= 6) {
    showToast('最多只能添加6个标签')
  } else if (userTags.value.includes(tag)) {
    showToast('标签已存在')
  }
}

const saveTags = () => {
  // 这里可以调用API保存标签到服务器
  showEditTags.value = false
  showToast('标签保存成功')
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
      margin: 0 0 var(--spacing-xs) 0;
      opacity: 0.8;
      font-size: var(--font-size-sm);
    }
  }

  .user-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;

    .tag {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      color: white;
    }

    .more-tags {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      color: white;
    }
  }

  .edit-icon {
    color: white;
    font-size: 20px;
    opacity: 0.8;
  }
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  background: white;
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.stat-number {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
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



/* 标签编辑样式 */
.edit-tags {
  height: 100%;
  background: #f7f8fa;
}

.tags-content {
  padding: 16px;
  height: calc(100% - 46px);
  overflow-y: auto;
}

.current-tags, .add-tag, .recommended-tags {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.current-tags h3, .add-tag h3, .recommended-tags h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
}

.tag-item {
  display: flex;
  align-items: center;
  background: #f2f3f5;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  color: #646566;
}

.tag-text {
  margin-right: 4px;
}

.tag-item .van-icon {
  font-size: 12px;
  color: #969799;
  cursor: pointer;
}

.empty-tags {
  color: #969799;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.tag-input {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.tag-input .van-field {
  flex: 1;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.recommended-tag {
  background: #f2f3f5;
  border-radius: 16px;
  padding: 8px 12px;
  text-align: center;
  font-size: 14px;
  color: #646566;
  cursor: pointer;
  transition: all 0.3s;
}

.recommended-tag:not(.disabled):active {
  background: #e1e2e3;
}

.recommended-tag.disabled {
  background: #f7f8fa;
  color: #c8c9cc;
  cursor: not-allowed;
}
</style>