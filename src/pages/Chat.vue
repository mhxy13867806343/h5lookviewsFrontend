<template>
  <div class="chat-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      :title="chatUser.nickname" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="ellipsis" @click="showMoreActions = true" />
      </template>
    </van-nav-bar>

    <!-- 聊天消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        :class="['message-item', { 'own-message': message.isOwn }]"
      >
        <!-- 时间分隔符 -->
        <div v-if="message.showTime" class="time-divider">
          {{ formatMessageTime(message.timestamp) }}
        </div>
        
        <div class="message-content">
          <!-- 头像 -->
          <van-image
            v-if="!message.isOwn"
            :src="chatUser.avatar"
            round
            width="40"
            height="40"
            fit="cover"
            class="message-avatar"
          />
          
          <!-- 消息气泡 -->
          <div class="message-bubble">
            <!-- 文本消息 -->
            <div v-if="message.type === 'text'" class="text-message">
              {{ message.content }}
            </div>
            
            <!-- 图片消息 -->
            <div v-else-if="message.type === 'image'" class="image-message">
              <van-image
                :src="message.content"
                width="200"
                height="150"
                fit="cover"
                @click="previewImage(message.content)"
              />
            </div>
            
            <!-- 语音消息 -->
            <div v-else-if="message.type === 'voice'" class="voice-message" @click="playVoice(message)">
              <van-icon name="volume-o" />
              <div class="voice-duration">{{ message.duration }}''</div>
              <div class="voice-waves">
                <span v-for="i in 5" :key="i" class="wave-bar"></span>
              </div>
            </div>
            
            <!-- 消息状态 -->
            <div v-if="message.isOwn" class="message-status">
              <van-loading v-if="message.status === 'sending'" size="12" />
              <van-icon v-else-if="message.status === 'sent'" name="success" size="12" />
              <van-icon v-else-if="message.status === 'failed'" name="warning-o" size="12" color="red" />
            </div>
          </div>
          
          <!-- 自己的头像 -->
          <van-image
            v-if="message.isOwn"
            :src="userStore.user?.avatar"
            round
            width="40"
            height="40"
            fit="cover"
            class="message-avatar"
          />
        </div>
      </div>
      
      <!-- 正在输入指示器 -->
      <div v-if="isTyping" class="typing-indicator">
        <van-image
          :src="chatUser.avatar"
          round
          width="40"
          height="40"
          fit="cover"
          class="message-avatar"
        />
        <div class="typing-bubble">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入工具栏 -->
    <div class="chat-input-toolbar">
      <div class="input-main-area">
        <!-- 左侧按钮组 -->
        <div class="left-buttons">
          <van-button 
            type="default" 
            size="large"
            plain
            @click="toggleVoiceMode"
            class="voice-toggle-btn"
            
          >
            <van-icon :name="isVoiceMode ? 'more-o' : 'volume-o'" size="20" />
          </van-button>
        </div>
        
        <!-- 中间输入区域 -->
        <div class="input-center">
          <!-- 文字输入模式 -->
          <div v-if="!isVoiceMode" class="text-input-container">
            <van-field
              v-model="inputText"
              placeholder="输入消息..."
              type="textarea"
              rows="1"
              autosize
              class="message-input"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              @keyup.enter.prevent="sendMessage"
            />
          </div>
          
          <!-- 语音输入模式 -->
          <div v-else class="voice-input-container">
            <van-button 
              class="voice-record-btn"
              :class="{ 'recording': isRecording }"
              @touchstart="startRecording"
              @touchend="stopRecording"
              @touchcancel="cancelRecording"
              block
              round
            >
              {{ isRecording ? '松开发送' : '按住说话' }}
            </van-button>
          </div>
        </div>
        
        <!-- 右侧按钮组 -->
        <div class="right-buttons">
          <van-button 
            v-if="!isVoiceMode"
            type="default" 
            size="large"
            plain
            @click="showEmojiPanel = !showEmojiPanel"
            class="emoji-btn"
          >
            <van-icon name="smile-o" size="20" />
          </van-button>
          
          <van-button 
            v-if="!isVoiceMode && !inputText.trim()"
            type="default" 
            size="large"
            plain
            @click="showMorePanel = !showMorePanel"
            class="more-btn"
          >
            <van-icon name="plus" size="20" />
          </van-button>
          
          <van-button 
            v-if="!isVoiceMode && inputText.trim()"
            type="primary" 
            size="large"
            @click="sendMessage"
            class="send-btn"
          >
            发送
          </van-button>
        </div>
      </div>
      
      <!-- 表情面板 -->
      <div v-if="showEmojiPanel" class="emoji-panel">
        <div class="emoji-grid">
          <span 
            v-for="emoji in emojiList" 
            :key="emoji"
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </span>
        </div>
      </div>
      
      <!-- 更多功能面板 -->
      <div v-if="showMorePanel" class="more-panel">
        <div class="more-actions">
          <div class="action-item" @click="selectImage">
            <van-icon name="photo-o" />
            <span>相册</span>
          </div>
          <div class="action-item" @click="takePhoto">
            <van-icon name="photograph" />
            <span>拍照</span>
          </div>
          <div class="action-item" @click="selectFile">
            <van-icon name="folder-o" />
            <span>文件</span>
          </div>
          <div class="action-item" @click="shareLocation">
            <van-icon name="location-o" />
            <span>位置</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 更多操作菜单 -->
    <van-action-sheet
      v-model:show="showMoreActions"
      :actions="moreActions"
      @select="onMoreActionSelect"
    />
    
    <!-- 文件选择器 -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/store'
import { showSuccessToast, showImagePreview, showConfirmDialog } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userId = route.params.userId

// 响应式数据
const chatUser = ref({})
const messages = ref([])
const inputText = ref('')
const isVoiceMode = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const isTyping = ref(false)
const showEmojiPanel = ref(false)
const showMorePanel = ref(false)
const showMoreActions = ref(false)
const messagesContainer = ref(null)
const fileInput = ref(null)

// 录音相关
let recordingTimer = null
let typingTimer = null

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣'
]

// 更多操作菜单
const moreActions = [
  { name: '查看聊天信息', value: 'info' },
  { name: '清空聊天记录', value: 'clear' },
  { name: '举报用户', value: 'report' },
  { name: '取消', value: 'cancel' }
]

// 方法
const handleBack = (): void => {
  router.back()
}

const formatMessageTime = (timestamp: string | Date): string => {
  const now = dayjs()
  const messageTime = dayjs(timestamp)
  
  if (now.diff(messageTime, 'day') === 0) {
    return messageTime.format('HH:mm')
  } else if (now.diff(messageTime, 'day') === 1) {
    return '昨天 ' + messageTime.format('HH:mm')
  } else {
    return messageTime.format('MM-DD HH:mm')
  }
}

const scrollToBottom = (): void => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = (): void => {
  if (!inputText.value.trim()) return
  
  const message = {
    id: Date.now(),
    type: 'text',
    content: inputText.value.trim(),
    timestamp: new Date(),
    isOwn: true,
    status: 'sending',
    showTime: shouldShowTime()
  }
  
  messages.value.push(message)
  inputText.value = ''
  scrollToBottom()
  
  // 模拟发送状态变化
  setTimeout(() => {
    message.status = 'sent'
    
    // 模拟对方回复
    setTimeout(() => {
      simulateReply()
    }, 1000 + Math.random() * 2000)
  }, 500)
}

const shouldShowTime = () => {
  if (messages.value.length === 0) return true
  
  const lastMessage = messages.value[messages.value.length - 1]
  const now = new Date()
  
  return now - lastMessage.timestamp > 5 * 60 * 1000 // 5分钟
}

const simulateReply = (): void => {
  const replies = [
    '收到！',
    '好的呢～',
    '哈哈哈',
    '明白了',
    '没问题',
    '😊',
    '👍',
    '等等我看看',
    '这个不错',
    '同意'
  ]
  
  const reply = {
    id: Date.now(),
    type: 'text',
    content: replies[Math.floor(Math.random() * replies.length)],
    timestamp: new Date(),
    isOwn: false,
    showTime: shouldShowTime()
  }
  
  // 显示正在输入
  isTyping.value = true
  scrollToBottom()
  
  setTimeout(() => {
    isTyping.value = false
    messages.value.push(reply)
    scrollToBottom()
  }, 1000 + Math.random() * 1000)
}

const toggleVoiceMode = () => {
  isVoiceMode.value = !isVoiceMode.value
  showEmojiPanel.value = false
  showMorePanel.value = false
  
  // 确保切换到文本模式时能正常输入
  if (!isVoiceMode.value) {
    nextTick(() => {
      const input = document.querySelector('.message-input input') || document.querySelector('.message-input textarea')
      if (input) {
        input.focus()
      }
    })
  }
}

const startRecording = (): void => {
  isRecording.value = true
  recordingTime.value = 0
  
  recordingTimer = setInterval(() => {
    recordingTime.value++
    if (recordingTime.value >= 60) {
      stopRecording()
    }
  }, 1000)
}

const stopRecording = (): void => {
  if (!isRecording.value) return
  
  isRecording.value = false
  clearInterval(recordingTimer)
  
  if (recordingTime.value < 1) {
    showSuccessToast('录音时间太短')
    return
  }
  
  // 发送语音消息
  const voiceMessage = {
    id: Date.now(),
    type: 'voice',
    content: 'voice_message_url',
    duration: recordingTime.value,
    timestamp: new Date(),
    isOwn: true,
    status: 'sending',
    showTime: shouldShowTime()
  }
  
  messages.value.push(voiceMessage)
  scrollToBottom()
  
  setTimeout(() => {
    voiceMessage.status = 'sent'
  }, 500)
}

const cancelRecording = () => {
  isRecording.value = false
  clearInterval(recordingTimer)
  recordingTime.value = 0
}

const insertEmoji = (emoji: string): void => {
  inputText.value += emoji
}

const handleInputFocus = () => {
  showEmojiPanel.value = false
  showMorePanel.value = false
  setTimeout(scrollToBottom, 300)
}

const handleInputBlur = () => {
  // 延迟隐藏面板，避免点击面板时立即隐藏
  setTimeout(() => {
    showEmojiPanel.value = false
    showMorePanel.value = false
  }, 200)
}

const selectImage = () => {
  showMorePanel.value = false
  fileInput.value.click()
}

const takePhoto = () => {
  showMorePanel.value = false
  showSuccessToast('拍照功能开发中')
}

const selectFile = () => {
  showMorePanel.value = false
  showSuccessToast('文件功能开发中')
}

const shareLocation = () => {
  showMorePanel.value = false
  showSuccessToast('位置功能开发中')
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    showSuccessToast('请选择图片文件')
    return
  }
  
  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageMessage = {
      id: Date.now(),
      type: 'image',
      content: e.target.result,
      timestamp: new Date(),
      isOwn: true,
      status: 'sending',
      showTime: shouldShowTime()
    }
    
    messages.value.push(imageMessage)
    scrollToBottom()
    
    setTimeout(() => {
      imageMessage.status = 'sent'
    }, 500)
  }
  reader.readAsDataURL(file)
  
  // 清空文件输入
  event.target.value = ''
}

const previewImage = (imageSrc) => {
  showImagePreview([imageSrc])
}

const playVoice = (message) => {
  showSuccessToast('播放语音')
}

const onMoreActionSelect = (action) => {
  showMoreActions.value = false
  
  switch (action.value) {
    case 'info':
      showSuccessToast('查看聊天信息')
      break
    case 'clear':
      showConfirmDialog({
        title: '清空聊天记录',
        message: '确定要清空所有聊天记录吗？',
      }).then(() => {
        messages.value = []
        showSuccessToast('聊天记录已清空')
      })
      break
    case 'report':
      showSuccessToast('举报功能开发中')
      break
  }
}

// 初始化数据
const initChatData = () => {
  // 确保初始状态为文本输入模式
  isVoiceMode.value = false
  
  // 模拟聊天用户信息
  chatUser.value = {
    id: userId,
    nickname: '聊天用户',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg'
  }
  
  // 模拟历史聊天记录
  messages.value = [
    {
      id: 1,
      type: 'text',
      content: '你好！',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isOwn: false,
      showTime: true
    },
    {
      id: 2,
      type: 'text',
      content: '嗨，你好呀！',
      timestamp: new Date(Date.now() - 9 * 60 * 1000),
      isOwn: true,
      status: 'sent'
    },
    {
      id: 3,
      type: 'text',
      content: '最近怎么样？',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isOwn: false
    },
    {
      id: 4,
      type: 'text',
      content: '挺好的，你呢？',
      timestamp: new Date(Date.now() - 7 * 60 * 1000),
      isOwn: true,
      status: 'sent'
    }
  ]
}

onMounted(() => {
  initChatData()
  scrollToBottom()
})

onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  if (typingTimer) {
    clearInterval(typingTimer)
  }
})
</script>

<style lang="scss" scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
  
  .time-divider {
    text-align: center;
    margin: var(--spacing-lg) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  
  .message-item {
    margin-bottom: var(--spacing-md);
    
    &.own-message {
      .message-content {
        flex-direction: row-reverse;
        
        .message-bubble {
          background: #007aff;
          color: white;
          margin-right: var(--spacing-sm);
          margin-left: 0;
          
          &::before {
            display: none;
          }
          
          &::after {
            content: '';
            position: absolute;
            top: 10px;
            right: -8px;
            width: 0;
            height: 0;
            border-left: 8px solid #007aff;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
          }
        }
      }
    }
  }
  
  .message-content {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-xs);
    
    .message-avatar {
      flex-shrink: 0;
    }
    
    .message-bubble {
      position: relative;
      background: white;
      border-radius: 18px;
      padding: 12px 16px;
      max-width: 60%;
      margin-left: var(--spacing-sm);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      
      &::before {
        content: '';
        position: absolute;
        top: 10px;
        left: -8px;
        width: 0;
        height: 0;
        border-right: 8px solid white;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
      }
      
      .text-message {
        line-height: 1.4;
        word-break: break-word;
      }
      
      .image-message {
        .van-image {
          border-radius: 8px;
          cursor: pointer;
        }
      }
      
      .voice-message {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        cursor: pointer;
        min-width: 120px;
        
        .voice-duration {
          font-size: var(--font-size-sm);
        }
        
        .voice-waves {
          display: flex;
          gap: 2px;
          
          .wave-bar {
            width: 2px;
            height: 12px;
            background: currentColor;
            border-radius: 1px;
            animation: wave 1.5s ease-in-out infinite;
            
            &:nth-child(2) { animation-delay: 0.1s; }
            &:nth-child(3) { animation-delay: 0.2s; }
            &:nth-child(4) { animation-delay: 0.3s; }
            &:nth-child(5) { animation-delay: 0.4s; }
          }
        }
      }
      
      .message-status {
        margin-top: var(--spacing-xs);
        text-align: right;
      }
    }
  }
  
  .typing-indicator {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    
    .typing-bubble {
      background: white;
      border-radius: 18px;
      padding: 12px 16px;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 10px;
        left: -8px;
        width: 0;
        height: 0;
        border-right: 8px solid white;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
      }
      
      .typing-dots {
        display: flex;
        gap: 4px;
        
        span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ccc;
          animation: typing 1.4s infinite;
          
          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }
    }
  }
}

.chat-input-toolbar {
  background: white;
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-sm);
  
  .input-main-area {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-sm);
    
    .left-buttons, .right-buttons {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    
    .input-center {
      flex: 1;
      
      .text-input-container {
        .message-input {
          :deep(.van-field__control) {
            min-height: 40px;
            max-height: 120px;
            border-radius: 20px;
            background: #f7f8fa;
            border: none;
            padding: 10px 16px;
          }
          
          :deep(.van-field__body) {
            border: none;
            background: transparent;
          }
        }
      }
      
      .voice-input-container {
        .voice-record-btn {
          height: 40px;
          background: #f7f8fa;
          color: var(--text-primary);
          border: none;
          
          &.recording {
            background: #007aff;
            color: white;
          }
        }
      }
    }
    
    .voice-toggle-btn, .emoji-btn, .more-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: #666;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:active {
        background: rgba(0, 0, 0, 0.05);
      }
      
      .van-icon {
        color: #666;
      }
    }
    
    .send-btn {
      height: 40px;
      border-radius: 20px;
      padding: 0 16px;
      font-size: var(--font-size-sm);
    }
  }
  
  .emoji-panel {
    border-top: 1px solid var(--border-color);
    padding: var(--spacing-md);
    
    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: var(--spacing-sm);
      
      .emoji-item {
        font-size: 24px;
        text-align: center;
        cursor: pointer;
        padding: var(--spacing-xs);
        border-radius: 4px;
        
        &:hover {
          background: #f5f5f5;
        }
      }
    }
  }
  
  .more-panel {
    border-top: 1px solid var(--border-color);
    padding: var(--spacing-md);
    
    .more-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-md);
      
      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius-md);
        
        &:hover {
          background: #f5f5f5;
        }
        
        .van-icon {
          font-size: 24px;
          color: var(--text-primary);
        }
        
        span {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
      }
    }
  }
}

@keyframes wave {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>