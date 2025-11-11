<template>
  <div class="chat-detail">
    <!-- 导航栏 -->
    <van-nav-bar 
      :title="chatUser?.nickname || '私信'" 
      left-text="返回" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="ellipsis" @click="showMoreActions = true" />
      </template>
    </van-nav-bar>

    <!-- 聊天消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多消息了"
        @load="loadMessages"
        direction="up"
      >
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-wrapper"
          :class="{ 'own-message': message.isSelf }"
        >
          <!-- 时间分割线 -->
          <div v-if="message.showTime" class="time-divider">
            {{ formatMessageTime(message.createTime) }}
          </div>

          <div class="message-item">
            <!-- 头像 -->
            <van-image
              v-if="!message.isSelf"
              :src="chatUser?.avatar"
              round
              width="36"
              height="36"
              fit="cover"
              class="message-avatar"
            >
              <template #error>
                <van-icon name="user-circle-o" size="36" />
              </template>
            </van-image>

            <!-- 消息内容 -->
            <div class="message-content">
              <!-- 文本消息 -->
              <div 
                v-if="message.type === 'text'" 
                class="message-bubble text-message"
                :class="{ 'self': message.isSelf }"
              >
                {{ message.content }}
              </div>

              <!-- 图片消息 -->
              <div 
                v-else-if="message.type === 'image'" 
                class="message-bubble image-message"
                :class="{ 'self': message.isSelf }"
              >
                <van-image
                  :src="message.content"
                  width="200"
                  height="200"
                  fit="cover"
                  radius="8"
                  @click="previewImage(message.content)"
                />
              </div>

              <!-- 语音消息 -->
              <div 
                v-else-if="message.type === 'voice'" 
                class="message-bubble voice-message"
                :class="{ 'self': message.isSelf }"
                @click="playVoice(message)"
              >
                <van-icon name="volume-o" />
                <span>{{ message.duration }}''</span>
                <div class="voice-waves">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>

              <!-- 消息状态 -->
              <div v-if="message.isSelf" class="message-status">
                <van-icon 
                  v-if="message.status === 'sending'" 
                  name="clock-o" 
                  color="#969799" 
                />
                <van-icon 
                  v-else-if="message.status === 'sent'" 
                  name="success" 
                  color="#07c160" 
                />
                <van-icon 
                  v-else-if="message.status === 'read'" 
                  name="checked" 
                  color="#1989fa" 
                />
                <van-icon 
                  v-else-if="message.status === 'failed'" 
                  name="warning-o" 
                  color="#ee0a24" 
                />
              </div>
            </div>

            <!-- 自己的头像 -->
            <van-image
              v-if="message.isSelf"
              :src="userStore.user?.avatar"
              round
              width="36"
              height="36"
              fit="cover"
              class="message-avatar"
            >
              <template #error>
                <van-icon name="user-circle-o" size="36" />
              </template>
            </van-image>
          </div>
        </div>
      </van-list>
    </div>

    <!-- 输入栏 -->
    <div class="chat-input">
      <van-field
        v-model="inputText"
        placeholder="输入消息..."
        type="textarea"
        rows="1"
        autosize
        maxlength="500"
        @keyup.enter="sendMessage"
      >
        <template #left-icon>
          <van-icon name="plus" @click="showMoreOptions = true" />
        </template>
        <template #button>
          <van-button 
            type="primary" 
            size="small"
            @click="sendMessage"
            :disabled="!inputText.trim()"
            :loading="sending"
          >
            发送
          </van-button>
        </template>
      </van-field>
    </div>

    <!-- 更多操作弹窗 -->
    <van-action-sheet
      v-model:show="showMoreActions"
      :actions="moreActions"
      @select="onMoreActionSelect"
      cancel-text="取消"
    />

    <!-- 更多输入选项 -->
    <van-action-sheet
      v-model:show="showMoreOptions"
      :actions="inputOptions"
      @select="onInputOptionSelect"
      cancel-text="取消"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showImagePreview, showSuccessToast, showConfirmDialog, showFailToast } from 'vant'
import dayjs from 'dayjs'
import { chatApi, userApi } from '@/api/index'
import type { PageResponse, ChatMessage as ApiChatMessage, User as ApiUser } from '@/types/api'

// 类型定义
interface ChatMessage {
  id: string
  type: 'text' | 'image' | 'voice'
  content: string
  isSelf: boolean
  createTime: Date
  status: 'sending' | 'sent' | 'read' | 'failed'
  showTime: boolean
  duration?: string // 语音消息时长
}

interface ChatUser {
  id: string
  nickname: string
  avatar: string
  isOnline: boolean
}

interface ActionOption {
  name: string
  value: string
  icon?: string
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const loading = ref<boolean>(false)
const finished = ref<boolean>(false)
const sending = ref<boolean>(false)
const inputText = ref<string>('')
const messages = ref<ChatMessage[]>([])
const chatUser = ref<ChatUser | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const showMoreActions = ref<boolean>(false)
const showMoreOptions = ref<boolean>(false)

// 更多操作选项
const moreActions: ActionOption[] = [
  { name: '查看用户资料', value: 'profile' },
  { name: '清空聊天记录', value: 'clear' },
  { name: '举报用户', value: 'report' },
  { name: '拉黑用户', value: 'block' }
]

// 输入选项
const inputOptions: ActionOption[] = [
  { name: '相册', value: 'album', icon: 'photo-o' },
  { name: '拍照', value: 'camera', icon: 'photograph' },
  { name: '语音', value: 'voice', icon: 'volume-o' }
]

// 获取用户ID
const userId = computed<string>(() => route.params.userId as string)

// 格式化消息时间
const formatMessageTime = (time: Date): string => {
  const now = dayjs()
  const messageTime = dayjs(time)
  
  if (now.diff(messageTime, 'day') === 0) {
    return messageTime.format('HH:mm')
  } else if (now.diff(messageTime, 'day') === 1) {
    return `昨天 ${messageTime.format('HH:mm')}`
  } else {
    return messageTime.format('MM/DD HH:mm')
  }
}

// 加载聊天记录
// 分页参数（向上滚动加载历史）
const page = ref<number>(1)
const pageSize = ref<number>(20)
let total = 0

const mapApiMessage = (m: ApiChatMessage): ChatMessage => ({
  id: m.id,
  type: (m.type as any) || 'text',
  content: m.content,
  isSelf: m.userId === userStore.user?.id,
  createTime: new Date(m.createTime),
  status: 'read',
  showTime: false
})

const addShowTimeFlags = (list: ChatMessage[]): ChatMessage[] => {
  const sorted = [...list].sort((a, b) => a.createTime.getTime() - b.createTime.getTime())
  let lastTime: Date | null = null
  return sorted.map(msg => {
    const showTime = !lastTime || (msg.createTime.getTime() - lastTime.getTime()) > 10 * 60 * 1000
    lastTime = msg.createTime
    return { ...msg, showTime }
  })
}

const loadMessages = async (): Promise<void> => {
  if (loading.value || finished.value) return
  loading.value = true

  try {
    const { data } = await chatApi.getChatHistory(userId.value, { page: page.value, pageSize: pageSize.value })
    const list = (data?.list || []).map(mapApiMessage)
    total = data?.total || 0

    // 新页数据放在前面（向上加载）
    const combined = [...list, ...messages.value]
    messages.value = addShowTimeFlags(combined)

    // 更新分页
    const loaded = page.value * pageSize.value
    finished.value = loaded >= total || list.length === 0
    page.value += 1
  } catch (error) {
    console.error('加载聊天记录失败:', error)
    showFailToast('加载聊天记录失败')
  } finally {
    loading.value = false
  }
}

// 加载用户信息
const loadUserInfo = async (): Promise<void> => {
  try {
    const { data } = await userApi.getUserDetail(userId.value)
    chatUser.value = {
      id: data.id,
      nickname: data.nickname,
      avatar: data.avatar,
      isOnline: !!data.isOnline
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    showFailToast('加载用户信息失败')
  }
}

// 发送消息
const sendMessage = async (): Promise<void> => {
  if (!inputText.value.trim()) return
  
  const messageContent = inputText.value.trim()
  inputText.value = ''
  
  // 创建新消息
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    type: 'text',
    content: messageContent,
    isSelf: true,
    createTime: new Date(),
    status: 'sending',
    showTime: false
  }
  
  messages.value.push(newMessage)
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 发送到后端
  sending.value = true
  try {
    const { data } = await chatApi.sendMessage(userId.value, { content: messageContent, type: 'text' })
    // 用后端返回的消息更新当前消息
    newMessage.id = data.id
    newMessage.createTime = new Date(data.createTime)
    newMessage.status = 'sent'
  } catch (error) {
    newMessage.status = 'failed'
    showFailToast('发送失败')
  } finally {
    sending.value = false
  }
}

// 滚动到底部
const scrollToBottom = (): void => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 预览图片
const previewImage = (imageUrl) => {
  showImagePreview([imageUrl])
}

// 播放语音
const playVoice = (message) => {
  showSuccessToast('播放语音消息')
}

// 更多操作选择
const onMoreActionSelect = async (action) => {
  showMoreActions.value = false
  
  switch (action.value) {
    case 'profile':
      router.push(`/user/${userId.value}`)
      break
    case 'clear':
      try {
        await showConfirmDialog({
          title: '确认清空',
          message: '确定要清空聊天记录吗？此操作不可恢复。'
        })
        try {
          await chatApi.deleteChat(userId.value)
          messages.value = []
          showSuccessToast('聊天记录已清空')
        } catch (e) {
          showFailToast('清空失败，请稍后重试')
        }
      } catch {
        // 用户取消
      }
      break
    case 'report':
      showSuccessToast('举报功能开发中')
      break
    case 'block':
      try {
        await showConfirmDialog({
          title: '确认拉黑',
          message: '确定要拉黑该用户吗？'
        })
        showSuccessToast('已拉黑该用户')
        router.back()
      } catch {
        // 用户取消
      }
      break
  }
}

// 输入选项选择
const onInputOptionSelect = (option) => {
  showMoreOptions.value = false
  
  switch (option.value) {
    case 'album':
      showSuccessToast('选择相册功能开发中')
      break
    case 'camera':
      showSuccessToast('拍照功能开发中')
      break
    case 'voice':
      showSuccessToast('语音功能开发中')
      break
  }
}

// 返回处理
const handleBack = (): void => {
  // 如果是从消息页面跳转过来的，返回时保持tab状态
  if (route.query.from === 'messages' && route.query.tab) {
    router.push({
      path: '/messages',
      query: { tab: route.query.tab }
    })
  } else {
    router.back()
  }
}

// 页面初始化
onMounted(async () => {
  await loadUserInfo()
  await loadMessages()
  await nextTick()
  scrollToBottom()
})
</script>

<style scoped>
.chat-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.message-wrapper {
  margin-bottom: var(--spacing-md);
  
  &.own-message {
    .message-item {
      flex-direction: row-reverse;
    }
  }
}

.time-divider {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  margin: var(--spacing-lg) 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-color);
    z-index: 1;
  }
  
  &::after {
    content: attr(data-time);
    background: #f5f5f5;
    padding: 0 var(--spacing-sm);
    position: relative;
    z-index: 2;
  }
}

.message-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 70%;
  
  .own-message & {
    align-items: flex-end;
  }
}

.message-bubble {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  position: relative;
  
  &.text-message {
    background: var(--background-secondary);
    color: var(--text-primary);
    line-height: 1.4;
    
    &.self {
      background: var(--primary-color);
      color: white;
    }
  }
  
  &.image-message {
    padding: 0;
    background: transparent;
  }
  
  &.voice-message {
    background: var(--background-secondary);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-width: 80px;
    cursor: pointer;
    
    &.self {
      background: var(--primary-color);
      color: white;
    }
    
    .voice-waves {
      display: flex;
      gap: 2px;
      
      span {
        width: 2px;
        height: 12px;
        background: currentColor;
        border-radius: 1px;
        animation: wave 1s infinite;
        
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
}

.message-status {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.chat-input {
  background: var(--background-secondary);
  padding: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  
  :deep(.van-field) {
    background: var(--background-primary);
    border-radius: var(--border-radius-md);
  }
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.5);
  }
}
</style>