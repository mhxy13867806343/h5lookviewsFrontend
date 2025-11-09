<template>
  <div class="help-center-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="帮助中心"
      left-arrow
      @click-left="handleBack"
      fixed
      placeholder
    />

    <!-- 搜索框 -->
    <div class="search-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索帮助内容"
        shape="round"
        @search="onSearch"
      />
    </div>

    <div class="help-content">
      <!-- 热门问题 -->
      <van-cell-group inset title="🔥 热门问题">
        <van-collapse v-model="activeHotNames" accordion>
          <van-collapse-item
            v-for="item in filteredHotQuestions"
            :key="item.id"
            :title="item.question"
            :name="item.id"
          >
            <div class="answer-content">
              <div class="answer-text">{{ item.answer }}</div>
              <div class="answer-actions">
                <van-button 
                  plain 
                  size="small" 
                  type="primary"
                  @click="handleHelpful(item.id)"
                >
                  <van-icon name="good-job-o" /> 有帮助
                </van-button>
                <van-button 
                  plain 
                  size="small"
                  @click="handleNotHelpful(item.id)"
                >
                  <van-icon name="close" /> 没帮助
                </van-button>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </van-cell-group>

      <!-- 功能指南 -->
      <van-cell-group inset title="📖 功能指南">
        <van-collapse v-model="activeGuideNames">
          <van-collapse-item
            v-for="item in filteredGuides"
            :key="item.id"
            :title="item.title"
            :name="item.id"
          >
            <div class="guide-content">
              <div class="guide-steps">
                <div 
                  v-for="(step, index) in item.steps" 
                  :key="index"
                  class="step-item"
                >
                  <div class="step-number">{{ index + 1 }}</div>
                  <div class="step-text">{{ step }}</div>
                </div>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </van-cell-group>

      <!-- 账号相关 -->
      <van-cell-group inset title="👤 账号相关">
        <van-collapse v-model="activeAccountNames">
          <van-collapse-item
            v-for="item in filteredAccountQuestions"
            :key="item.id"
            :title="item.question"
            :name="item.id"
          >
            <div class="answer-content">
              <div class="answer-text">{{ item.answer }}</div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </van-cell-group>

      <!-- 安全与隐私 -->
      <van-cell-group inset title="🔒 安全与隐私">
        <van-collapse v-model="activeSecurityNames">
          <van-collapse-item
            v-for="item in filteredSecurityQuestions"
            :key="item.id"
            :title="item.question"
            :name="item.id"
          >
            <div class="answer-content">
              <div class="answer-text">{{ item.answer }}</div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </van-cell-group>

      <!-- 联系客服 -->
      <van-cell-group inset title="💬 联系客服">
        <van-cell 
          title="在线客服" 
          is-link
          @click="showToast('客服功能开发中')"
        >
          <template #icon>
            <van-icon name="service-o" class="cell-icon" />
          </template>
          <template #label>
            工作时间：9:00-21:00
          </template>
        </van-cell>
        <van-cell 
          title="意见反馈" 
          is-link
          @click="router.push('/feedback')"
        >
          <template #icon>
            <van-icon name="chat-o" class="cell-icon" />
          </template>
          <template #label>
            提交问题或建议
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 空状态 -->
      <van-empty
        v-if="isSearching && allFilteredResults.length === 0"
        description="未找到相关帮助内容"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'

const router = useRouter()

// 搜索
const searchKeyword = ref<string>('')
const isSearching = computed(() => searchKeyword.value.trim().length > 0)

// 折叠面板
const activeHotNames = ref<string[]>([])
const activeGuideNames = ref<string[]>([])
const activeAccountNames = ref<string[]>([])
const activeSecurityNames = ref<string[]>([])

// 热门问题
interface Question {
  id: string
  question: string
  answer: string
}

const hotQuestions = ref<Question[]>([
  {
    id: 'hot1',
    question: '如何发布笔记？',
    answer: '点击底部导航栏中间的"+"按钮，选择"发布笔记"，填写标题和内容，可以添加图片和标签，最后点击"发布"按钮即可。'
  },
  {
    id: 'hot2',
    question: '如何收藏笔记？',
    answer: '在笔记详情页面，点击右下角的收藏图标（星标）即可收藏。您可以在"我的-收藏"中查看所有收藏的笔记。取消收藏只需再次点击收藏图标。'
  },
  {
    id: 'hot3',
    question: '如何查看浏览历史？',
    answer: '进入"我的"页面，点击右上角设置图标，然后选择"浏览历史"即可查看您访问过的所有页面记录。支持搜索和删除历史记录。'
  },
  {
    id: 'hot4',
    question: '如何关注其他用户？',
    answer: '进入用户主页，点击"关注"按钮即可关注该用户。关注后可以在"关注"页面看到该用户发布的最新内容。'
  },
  {
    id: 'hot5',
    question: '忘记密码怎么办？',
    answer: '在登录页面点击"忘记密码"，输入注册时绑定的手机号或邮箱，按提示进行身份验证后即可重置密码。'
  }
])

// 功能指南
interface Guide {
  id: string
  title: string
  steps: string[]
}

const guides = ref<Guide[]>([
  {
    id: 'guide1',
    title: '如何发布高质量笔记',
    steps: [
      '选择合适的分类标签，方便其他用户发现',
      '使用清晰的标题，简洁明了地概括内容',
      '添加配图可以提高阅读体验',
      '合理使用排版，使用段落和小标题',
      '添加相关标签，增加曝光度'
    ]
  },
  {
    id: 'guide2',
    title: '如何管理我的笔记',
    steps: [
      '进入"我的"页面，点击"我的笔记"',
      '可以查看所有已发布的笔记',
      '点击笔记可以进行编辑或删除',
      '支持批量管理和分类整理',
      '可以设置笔记的公开/私密状态'
    ]
  },
  {
    id: 'guide3',
    title: '如何提升笔记曝光',
    steps: [
      '选择热门话题和标签',
      '在活跃时间段发布（晚上7-10点）',
      '使用高质量图片吸引眼球',
      '积极与评论者互动',
      '定期更新和优化内容'
    ]
  }
])

// 账号相关
const accountQuestions = ref<Question[]>([
  {
    id: 'account1',
    question: '如何修改个人信息？',
    answer: '进入"我的"页面，点击头像或昵称，即可进入个人信息编辑页面。您可以修改头像、昵称、简介等信息。'
  },
  {
    id: 'account2',
    question: '如何更换手机号？',
    answer: '进入"设置-账号安全-更换手机号"，输入新手机号并完成验证即可更换。需要先验证原手机号。'
  },
  {
    id: 'account3',
    question: '如何注销账号？',
    answer: '进入"设置-账号安全-账号注销"，按照提示完成注销流程。注意：注销后数据将无法恢复，请谨慎操作。'
  }
])

// 安全与隐私
const securityQuestions = ref<Question[]>([
  {
    id: 'security1',
    question: '如何设置隐私权限？',
    answer: '进入"设置-隐私设置"，可以设置谁可以看你的主页、谁可以评论你的内容等权限。'
  },
  {
    id: 'security2',
    question: '如何拉黑用户？',
    answer: '进入该用户主页，点击右上角菜单，选择"拉黑"即可。被拉黑的用户将无法查看你的内容和给你发送消息。'
  },
  {
    id: 'security3',
    question: '如何举报不良内容？',
    answer: '在内容详情页点击右上角菜单，选择"举报"，选择举报原因并提交。我们会在24小时内处理。'
  },
  {
    id: 'security4',
    question: '账号安全建议',
    answer: '建议您：1.设置复杂密码；2.定期更换密码；3.绑定手机号和邮箱；4.开启登录保护；5.不要在公共设备保存密码。'
  }
])

// 过滤搜索结果
const filterByKeyword = <T extends { question?: string; title?: string; answer?: string }>(
  items: T[]
): T[] => {
  if (!searchKeyword.value.trim()) return items
  const keyword = searchKeyword.value.toLowerCase()
  return items.filter(item => 
    (item.question?.toLowerCase().includes(keyword)) ||
    (item.title?.toLowerCase().includes(keyword)) ||
    (item.answer?.toLowerCase().includes(keyword))
  )
}

const filteredHotQuestions = computed(() => filterByKeyword(hotQuestions.value))
const filteredGuides = computed(() => filterByKeyword(guides.value))
const filteredAccountQuestions = computed(() => filterByKeyword(accountQuestions.value))
const filteredSecurityQuestions = computed(() => filterByKeyword(securityQuestions.value))

const allFilteredResults = computed(() => [
  ...filteredHotQuestions.value,
  ...filteredGuides.value,
  ...filteredAccountQuestions.value,
  ...filteredSecurityQuestions.value
])

// 方法
const handleBack = (): void => {
  router.back()
}

const onSearch = (): void => {
  if (allFilteredResults.value.length === 0) {
    showToast('未找到相关帮助内容')
  }
}

const handleHelpful = (id: string): void => {
  showSuccessToast('感谢您的反馈')
}

const handleNotHelpful = (id: string): void => {
  showToast('抱歉没能帮到您，欢迎联系客服')
}
</script>

<style lang="scss" scoped>
.help-center-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

.search-section {
  background: #fff;
  padding: 8px 0;
  margin-bottom: 8px;
}

.help-content {
  padding-top: 0;
}

.cell-icon {
  margin-right: 12px;
  font-size: 18px;
}

:deep(.van-cell-group) {
  margin-bottom: 12px;
}

.answer-content {
  padding: 12px;
}

.answer-text {
  font-size: 14px;
  color: #646566;
  line-height: 1.8;
  margin-bottom: 12px;
}

.answer-actions {
  display: flex;
  gap: 12px;
}

.guide-content {
  padding: 12px;
}

.guide-steps {
  .step-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .step-number {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      background: #1989fa;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      margin-right: 12px;
    }

    .step-text {
      flex: 1;
      font-size: 14px;
      color: #646566;
      line-height: 24px;
    }
  }
}
</style>
