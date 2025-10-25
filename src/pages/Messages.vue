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
        <!-- 空内容，实际内容在下面统一渲染 -->
      </van-tab>
      
      <van-tab :title="getTabTitle('chats')" name="chats">
        <!-- 空内容，实际内容在下面统一渲染 -->
      </van-tab>
      
      <van-tab :title="getTabTitle('comments')" name="comments">
        <!-- 空内容，实际内容在下面统一渲染 -->
      </van-tab>
    </van-tabs>

    <!-- 所有组件都无条件渲染，确保实例不被销毁 -->
    <div class="tab-contents">
      <!-- 动态消息 -->
      <DynamicsMessages 
        v-show="activeTab === 'dynamics'"
        ref="dynamicsRef"
        @item-click="handleDynamicsClick"
        @remove="handleRemoveDynamics"
        @clear-all="handleClearAllDynamics"
      />
      
      <!-- 私信消息 -->
      <ChatsMessages 
        v-show="activeTab === 'chats'"
        ref="chatsRef"
        @item-click="handleChatClick"
        @remove="handleRemoveChat"
        @clear-all="handleClearAllChats"
      />
      
      <!-- 评论消息 -->
      <CommentsMessages 
        v-show="activeTab === 'comments'"
        ref="commentsRef"
        @item-click="handleCommentClick"
        @remove="handleRemoveComment"
        @clear-all="handleClearAllComments"
      />
    </div>

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

<script lang="ts" setup>
import { showConfirmDialog, showSuccessToast } from 'vant'
import { storage } from '../utils/index'
import DynamicsMessages from '../components/messages/DynamicsMessages.vue'
import ChatsMessages from '../components/messages/ChatsMessages.vue'
import CommentsMessages from '../components/messages/CommentsMessages.vue'

// 类型定义
type TabType = 'dynamics' | 'chats' | 'comments'

interface MessageCounts {
  dynamics: number
  chats: number
  comments: number
}

const router = useRouter()
const route = useRoute()

// 有效的tab名称
const validTabs: TabType[] = ['dynamics', 'chats', 'comments']

// 响应式数据 - 优先使用路由参数，否则从localStorage恢复
const getInitialTab = (): TabType => {
  // 优先级：路由参数 > localStorage > 默认值
  if (route.query.tab && validTabs.includes(route.query.tab as TabType)) {
    console.log('使用路由参数:', route.query.tab)
    return route.query.tab as TabType
  }
  const savedTab = storage.get<TabType>('messages-active-tab', 'dynamics')
  console.log('使用localStorage:', savedTab)
  // 确保savedTab也是有效的
  return validTabs.includes(savedTab!) ? savedTab! : 'dynamics'
}

const activeTab = ref<TabType>(getInitialTab())
const showSettings = ref<boolean>(false)

// 组件引用
const dynamicsRef = ref<InstanceType<typeof DynamicsMessages> | null>(null)
const chatsRef = ref<InstanceType<typeof ChatsMessages> | null>(null)
const commentsRef = ref<InstanceType<typeof CommentsMessages> | null>(null)

// 消息数量统计
const messageCounts = ref<MessageCounts>({
  dynamics: 5,
  chats: 3,
  comments: 8
})

// 计算标签标题（带角标）
const getTabTitle = (type: TabType): string => {
  const titles = {
    dynamics: '动态',
    chats: '私信',
    comments: '评论'
  }
  const count = messageCounts.value[type]
  return count > 0 ? `${titles[type]} (${count})` : titles[type]
}

// 标签页切换
const onTabChange = (name: TabType): void => {
  console.log('onTabChange 被调用:', name)
  activeTab.value = name
  // 保存当前选中的tab到localStorage
  storage.set('messages-active-tab', name)
  
  // 静默更新地址栏，不触发路由变化
  const url = new URL(window.location)
  url.searchParams.set('tab', name)
  window.history.replaceState({}, '', url)
}

// 动态消息处理
const handleDynamicsClick = (item: any): void => {
  router.push(`/post/${item.targetId}`)
}

const handleRemoveDynamics = async (item: any): Promise<void> => {
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

const handleClearAllDynamics = async (): Promise<void> => {
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
const handleChatClick = (item: any): void => {
  // 跳转时携带当前tab信息
  router.push({
    path: `/chat/${item.userId}`,
    query: { from: 'messages', tab: activeTab.value }
  })
}

const handleRemoveChat = async (item: any): Promise<void> => {
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

const handleClearAllChats = async (): Promise<void> => {
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

const handleRemoveComment = async (item: any): Promise<void> => {
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

const handleClearAllComments = async (): Promise<void> => {
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
const clearAllMessages = async (): Promise<void> => {
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
onMounted(async () => {
  console.log('页面初始化 - 当前activeTab:', activeTab.value)
  console.log('页面初始化 - 路由参数:', route.query.tab)
  
  // 等待DOM更新
  await nextTick()
  
  // 保存当前tab到localStorage（无论是来自路由参数还是localStorage）
  storage.set('messages-active-tab', activeTab.value)
  
  // 确保地址栏与当前tab同步（静默更新）
  if (route.query.tab !== activeTab.value) {
    const url = new URL(window.location)
    url.searchParams.set('tab', activeTab.value)
    window.history.replaceState({}, '', url)
  }
  
  console.log('初始化完成 - 最终activeTab:', activeTab.value)
})

// 监听路由变化，保持tab状态
watch(() => route.query.tab, (newTab: string | string[] | undefined) => {
  if (newTab && typeof newTab === 'string' && validTabs.includes(newTab as TabType)) {
    console.log('路由变化 - 切换到:', newTab)
    activeTab.value = newTab as TabType
    // 同时更新localStorage
    storage.set('messages-active-tab', newTab)
  }
})

// 监听activeTab变化，同步到localStorage
watch(activeTab, (newTab: TabType) => {
  storage.set('messages-active-tab', newTab)
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

/* tab内容区域 */
.tab-contents {
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