<template>
  <div class="feedback-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="意见反馈"
      left-arrow
      @click-left="handleBack"
      fixed
      placeholder
    />

    <div class="feedback-content">
      <!-- 反馈类型选择 -->
      <van-cell-group inset title="反馈类型">
        <van-radio-group v-model="feedbackType">
          <van-cell 
            v-for="item in feedbackTypes" 
            :key="item.value"
            :title="item.label"
            clickable
            @click="feedbackType = item.value"
          >
            <template #right-icon>
              <van-radio :name="item.value" />
            </template>
          </van-cell>
        </van-radio-group>
      </van-cell-group>

      <!-- 反馈内容 -->
      <van-cell-group inset title="反馈内容">
        <van-field
          v-model="feedbackContent"
          rows="6"
          autosize
          type="textarea"
          maxlength="500"
          placeholder="请详细描述您遇到的问题或建议，我们会认真对待每一条反馈"
          show-word-limit
        />
      </van-cell-group>

      <!-- 上传图片 -->
      <van-cell-group inset title="上传图片（可选）">
        <div class="upload-section">
          <van-uploader
            v-model="fileList"
            multiple
            :max-count="3"
            :after-read="afterRead"
          >
            <template #default>
              <div class="upload-button">
                <van-icon name="photograph" size="24" />
                <div class="upload-text">上传图片</div>
              </div>
            </template>
          </van-uploader>
          <div class="upload-tip">最多上传3张图片，每张不超过5MB</div>
        </div>
      </van-cell-group>

      <!-- 联系方式 -->
      <van-cell-group inset title="联系方式（可选）">
        <van-field
          v-model="contactInfo"
          placeholder="手机号/邮箱/微信，方便我们及时回复"
          maxlength="50"
        />
      </van-cell-group>

      <!-- 常见问题 -->
      <van-cell-group inset title="常见问题">
        <van-collapse v-model="activeNames" accordion>
          <van-collapse-item 
            v-for="item in faqList" 
            :key="item.id"
            :title="item.question"
            :name="item.id"
          >
            <div class="faq-answer">{{ item.answer }}</div>
          </van-collapse-item>
        </van-collapse>
      </van-cell-group>

      <!-- 联系我们 -->
      <van-cell-group inset title="其他联系方式">
        <van-cell 
          title="客服邮箱" 
          value="feedback@lookviews.com"
          @click="copyText('feedback@lookviews.com')"
        >
          <template #icon>
            <van-icon name="envelop-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          title="客服微信" 
          value="lookviews_support"
          @click="copyText('lookviews_support')"
        >
          <template #icon>
            <van-icon name="chat-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          title="QQ交流群" 
          value="123456789"
          @click="copyText('123456789')"
        >
          <template #icon>
            <van-icon name="friends-o" class="cell-icon" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <van-button 
          type="primary" 
          block 
          round 
          :loading="submitting"
          @click="handleSubmit"
        >
          提交反馈
        </van-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import type { UploaderFileListItem } from 'vant'

const router = useRouter()

// 反馈类型
interface FeedbackType {
  label: string
  value: string
}

const feedbackTypes = ref<FeedbackType[]>([
  { label: '功能建议', value: 'suggestion' },
  { label: '问题反馈', value: 'bug' },
  { label: '使用咨询', value: 'question' },
  { label: '其他', value: 'other' }
])

// 表单数据
const feedbackType = ref<string>('suggestion')
const feedbackContent = ref<string>('')
const contactInfo = ref<string>('')
const fileList = ref<UploaderFileListItem[]>([])
const submitting = ref<boolean>(false)

// 常见问题
const activeNames = ref<string[]>([])
interface FAQ {
  id: string
  question: string
  answer: string
}

const faqList = ref<FAQ[]>([
  {
    id: '1',
    question: '如何发布笔记？',
    answer: '点击底部导航栏中间的"+"按钮，选择"发布笔记"，填写标题和内容后即可发布。'
  },
  {
    id: '2',
    question: '如何收藏笔记？',
    answer: '在笔记详情页面，点击右下角的收藏图标即可收藏。您可以在"我的-收藏"中查看所有收藏的笔记。'
  },
  {
    id: '3',
    question: '如何查看浏览历史？',
    answer: '进入"设置"页面，点击"浏览历史"即可查看您访问过的所有页面记录。'
  },
  {
    id: '4',
    question: '如何修改个人信息？',
    answer: '进入"我的"页面，点击头像或昵称，即可进入个人信息编辑页面进行修改。'
  },
  {
    id: '5',
    question: '如何删除自己的笔记？',
    answer: '在笔记详情页面，点击右上角菜单按钮，选择"删除"即可删除自己发布的笔记。'
  },
  {
    id: '6',
    question: '遇到不良内容怎么办？',
    answer: '您可以点击内容右上角的举报按钮，选择举报原因提交。我们会在24小时内处理。'
  }
])

// 方法
const handleBack = (): void => {
  router.back()
}

// 图片上传后的回调
const afterRead = (file: UploaderFileListItem | UploaderFileListItem[]): void => {
  console.log('上传的文件：', file)
  showToast('图片上传成功')
}

// 复制文本
const copyText = (text: string): void => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showSuccessToast('已复制到剪贴板')
    }).catch(() => {
      showToast('复制失败，请手动复制')
    })
  } else {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      showSuccessToast('已复制到剪贴板')
    } catch (err) {
      showToast('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

// 提交反馈
const handleSubmit = async (): Promise<void> => {
  if (!feedbackContent.value.trim()) {
    showToast('请填写反馈内容')
    return
  }

  submitting.value = true
  
  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 构建反馈数据
    const feedbackData = {
      type: feedbackType.value,
      content: feedbackContent.value,
      contact: contactInfo.value,
      images: fileList.value.map(item => item.url || item.content),
      submitTime: new Date().toISOString()
    }
    
    console.log('提交的反馈：', feedbackData)
    
    // 保存到本地存储（实际项目中应该发送到服务器）
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]')
    feedbacks.unshift(feedbackData)
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks))
    
    showSuccessToast('提交成功，感谢您的反馈！')
    
    // 延迟返回
    setTimeout(() => {
      router.back()
    }, 1000)
  } catch (error) {
    showToast('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.feedback-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

.feedback-content {
  padding-top: 8px;
}

.cell-icon {
  margin-right: 12px;
  font-size: 18px;
}

:deep(.van-cell-group) {
  margin-bottom: 12px;
}

.upload-section {
  padding: 12px 16px;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: #f7f8fa;
  border-radius: 8px;
  border: 1px dashed #dcdee0;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}

.faq-answer {
  padding: 12px;
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
  background: #f7f8fa;
  border-radius: 4px;
}

.submit-section {
  margin: 24px 16px;
}

:deep(.van-button) {
  height: 44px;
  font-size: 16px;
}
</style>
