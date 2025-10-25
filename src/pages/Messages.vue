<template>
  <div class="messages-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      title="消息" 
      left-text="返回" 
      left-arrow 
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="setting-o" @click="showSettings = true" />
      </template>
    </van-nav-bar>

    <!-- 标签页 -->
    <van-tabs 
      v-model:active="activeTab" 
      sticky 
      offset-top="46"
      @change="onTabChange"
    >
      <van-tab :title="getTabTitle('dynamics')" name="dynamics">
        <keep-alive>
          <DynamicsMessages 
            v-if="activeTab === 'dynamics'"
            ref="dynamicsRef"
            @item-click="handleDynamicsClick"
            @remove="handleRemoveDynamics"
            @clear-all="handleClearAllDynamics"
          />
        </keep-alive>
      </van-tab>
      
      <van-tab :title="getTabTitle('chats')" name="chats">
        <keep-alive>
          <ChatsMessages 
            v-if="activeTab === 'chats'"
            ref="chatsRef"
            @item-click="handleChatClick"
            @remove="handleRemoveChat"
            @clear-all="handleClearAllChats"
          />
        </keep-alive>
      </van-tab>
      
      <van-tab :title="getTabTitle('comments')" name="comments">
        <keep-alive>
          <CommentsMessages 
            v-if="activeTab === 'comments'"
            ref="commentsRef"
            @item-click="handleCommentClick"
            @remove="handleRemoveComment"
            @clear-all="handleClearAllComments"
          />
        </keep-alive>
      </van-tab>
    </van-tabs>

    <!-- 设置弹窗 -->
    <van-popup v-model:show="showSettings" position="bottom" :style="{ height: '40%' }">
      <div class="settings-popup">
        <van-nav-bar title="消息设置" left-text="取消" @click-left="showSettings = false" />
        
        <van-cell-group>
          <van-cell title="消息免打扰" is-link />
          <van-cell title="屏蔽陌生人消息" is-link />
          <van-cell title="清空所有消息" is-link @click="clearAllMessages" />
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import DynamicsMessages from '../components/messages/DynamicsMessages.vue'
import ChatsMessages from '../components/messages/ChatsMessages.vue'
import CommentsMessages from '../components/messages/CommentsMessages.vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const activeTab = ref('dynamics')
const showSettings = ref(false)

// 组件引用
const dynamicsRef = ref(null)
const chatsRef = ref(null)
const commentsRef = ref(null)

// 消息数量统计
const messageCounts = ref({
  dynamics: 5,
  chats: 3,
  comments: 8
})

// 计算标签标题（带角标）
const getTabTitle = (type) => {
  const titles = {
    dynamics: '动态',
    chats: '私信',
    comments: '评论'
  }
  const count = messageCounts.value[type]
  return count > 0 ? `${titles[type]} (${count})` : titles[type]
}

// 标签页切换
const onTabChange = (name) => {
  activeTab.value = name
  // 可以在这里添加切换时的逻辑，比如刷新数据
}

// 动态消息处理
const handleDynamicsClick = (item) => {
  router.push(`/post/${item.targetId}`)
}

const handleRemoveDynamics = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条动态消息吗？'
    })
    
    // 调用子组件的删除方法
    dynamicsRef.value?.removeItem(item.id)
    messageCounts.value.dynamics = Math.max(0, messageCounts.value.dynamics - 1)
    showSuccessToast('删除成功')
  } catch {
    // 用户取消
  }
}

const handleClearAllDynamics = async () => {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有动态消息吗？此操作不可恢复。'
    })
    
    dynamicsRef.value?.clearAll()
    messageCounts.value.dynamics = 0
    showSuccessToast('清空成功')
  } catch {
    // 用户取消
  }
}

// 私信消息处理
const handleChatClick = (item) => {
  // 跳转时携带当前tab信息
  router.push({
    path: `/chat/${item.userId}`,
    query: { from: 'messages', tab: activeTab.value }
  })
}

const handleRemoveChat = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除与该用户的私信记录吗？'
    })
    
    chatsRef.value?.removeItem(item.id)
    messageCounts.value.chats = Math.max(0, messageCounts.value.chats - 1)
    showSuccessToast('删除成功')
  } catch {
    // 用户取消
  }
}

const handleClearAllChats = async () => {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有私信记录吗？此操作不可恢复。'
    })
    
    chatsRef.value?.clearAll()
    messageCounts.value.chats = 0
    showSuccessToast('清空成功')
  } catch {
    // 用户取消
  }
}

// 评论消息处理
const handleCommentClick = (item) => {
  if (item.targetType === 'post') {
    router.push(`/post/${item.targetId}`)
  } else if (item.targetType === 'note') {
    router.push(`/note/${item.targetId}`)
  }
}

const handleRemoveComment = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条评论消息吗？'
    })
    
    commentsRef.value?.removeItem(item.id)
    messageCounts.value.comments = Math.max(0, messageCounts.value.comments - 1)
    showSuccessToast('删除成功')
  } catch {
    // 用户取消
  }
}

const handleClearAllComments = async () => {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有评论消息吗？此操作不可恢复。'
    })
    
    commentsRef.value?.clearAll()
    messageCounts.value.comments = 0
    showSuccessToast('清空成功')
  } catch {
    // 用户取消
  }
}

// 清空所有消息
const clearAllMessages = async () => {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有类型的消息吗？此操作不可恢复。'
    })
    
    // 清空所有子组件的数据
    dynamicsRef.value?.clearAll()
    chatsRef.value?.clearAll()
    commentsRef.value?.clearAll()
    
    // 重置计数
    messageCounts.value = {
      dynamics: 0,
      chats: 0,
      comments: 0
    }
    
    showSettings.value = false
    showSuccessToast('所有消息已清空')
  } catch {
    // 用户取消
  }
}

// 页面初始化
onMounted(() => {
  // 从路由参数获取默认标签页
  if (route.query.tab) {
    activeTab.value = route.query.tab
  }
})

// 监听路由变化，保持tab状态
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab
  }
})


</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: var(--background-primary);
  position: relative;
}

/* 导航栏固定样式 */
:deep(.van-nav-bar) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

/* tabs固定样式 */
:deep(.van-tabs) {
  position: sticky;
  top: 46px;
  z-index: 999;
}

:deep(.van-tabs__wrap) {
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.van-tab) {
  font-weight: 500;
}

:deep(.van-tab--active) {
  color: var(--primary-color);
}

/* 内容区域样式 */
:deep(.van-tabs__content) {
  background: var(--background-primary);
}

.settings-popup {
  height: 100%;
  background: var(--background-primary);
  
  .van-cell-group {
    margin-top: var(--spacing-md);
  }
}
</style>