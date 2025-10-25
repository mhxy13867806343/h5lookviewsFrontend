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

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showImagePreview, showSuccessToast, showConfirmDialog } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const finished = ref(false)
const sending = ref(false)
const inputText = ref('')
const messages = ref([])
const chatUser = ref(null)
const messagesContainer = ref(null)
const showMoreActions = ref(false)
const showMoreOptions = ref(false)

// 更多操作选项
const moreActions = [
  { name: '查看用户资料', value: 'profile' },
  { name: '清空聊天记录', value: 'clear' },
  { name: '举报用户', value: 'report' },
  { name: '拉黑用户', value: 'block' }
]

// 输入选项
const inputOptions = [
  { name: '相册', value: 'album', icon: 'photo-o' },
  { name: '拍照', value: 'camera', icon: 'photograph' },
  { name: '语音', value: 'voice', icon: 'volume-o' }
]

// 获取用户ID
const userId = computed(() => route.params.userId)

// 格式化消息时间
const formatMessageTime = (time) => {
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
const loadMessages = async () => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟聊天数据
    const mockMessages = [
      {
        id: 'msg_1',
        type: 'text',
        content: '你好！',
        isSelf: false,
        createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'read',
        showTime: true
      },
      {
        id: 'msg_2',
        type: 'text',
        content: '你好，有什么可以帮助你的吗？',
        isSelf: true,
        createTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
        status: 'read',
        showTime: false
      },
      {
        id: 'msg_3',
        type: 'text',
        content: '我想了解一下这个产品的详细信息',
        isSelf: false,
        createTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: 'read',
        showTime: true
      },
      {
        id: 'msg_4',
        type: 'image',
        content: 'https://img.yzcdn.cn/vant/cat.jpeg',
        isSelf: true,
        createTime: new Date(Date.now() - 30 * 60 * 1000),
        status: 'read',
        showTime: true
      }
    ]
    
    messages.value = [...mockMessages, ...messages.value]
    finished.value = true
    
  } catch (error) {
    console.error('加载聊天记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    chatUser.value = {
      id: userId.value,
      nickname: '张小明',
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      isOnline: true
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim()) return
  
  const messageContent = inputText.value.trim()
  inputText.value = ''
  
  // 创建新消息
  const newMessage = {
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
  
  // 模拟发送
  sending.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    newMessage.status = 'sent'
    
    // 模拟对方回复
    setTimeout(() => {
      const replyMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'text',
        content: '收到，我来为你详细介绍一下',
        isSelf: false,
        createTime: new Date(),
        status: 'read',
        showTime: false
      }
      messages.value.push(replyMessage)
      nextTick(() => scrollToBottom())
    }, 2000)
    
  } catch (error) {
    newMessage.status = 'failed'
  } finally {
    sending.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
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
        messages.value = []
        showSuccessToast('聊天记录已清空')
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
const handleBack = () => {
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