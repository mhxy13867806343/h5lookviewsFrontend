<template>
  <div class="settings-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="t('settings.title')"
      left-arrow
      @click-left="handleBack"
      fixed
      placeholder
    />

    <!-- 设置列表 -->
    <div class="settings-content">
      <!-- 账号信息 -->
      <van-cell-group :title="t('settings.accountInfo')" inset>
        <van-cell 
          :title="t('settings.personalInfo')" 
          is-link 
          @click="router.push('/edit-profile')"
        >
          <template #icon>
            <van-icon name="contact" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.accountSecurity')" 
          is-link
          @click="handleAccountSecurity"
        >
          <template #icon>
            <van-icon name="shield-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.privacySettings')" 
          is-link
          @click="handlePrivacySetting"
        >
          <template #icon>
            <van-icon name="eye-o" class="cell-icon" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 通用设置 -->
      <van-cell-group :title="t('settings.generalSettings')" inset>
        <van-cell 
          :title="t('settings.viewHistory')" 
          is-link
          @click="router.push('/view-history')"
        >
          <template #icon>
            <van-icon name="clock-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.messageNotification')"
          is-link
          @click="router.push('/messages')"
        >
          <template #icon>
            <van-icon name="bell" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.darkMode')"
        >
          <template #icon>
            <van-icon name="star-o" class="cell-icon" />
          </template>
          <template #right-icon>
            <van-switch 
              v-model="darkMode" 
              size="20" 
              @change="onDarkModeChange"
              @click.stop
            />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.languageSettings')" 
          is-link
          :value="currentLanguage"
          @click="showLanguagePicker"
        >
          <template #icon>
            <van-icon name="globe-o" class="cell-icon" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 缓存与存储 -->
      <van-cell-group :title="t('settings.cacheStorage')" inset>
        <van-cell 
          :title="t('settings.cacheSize')" 
          :value="cacheSize"
        >
          <template #icon>
            <van-icon name="cluster-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.clearCache')" 
          is-link
          @click="handleClearCache"
        >
          <template #icon>
            <van-icon name="delete-o" class="cell-icon" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 帮助与反馈 -->
      <van-cell-group :title="t('settings.helpFeedback')" inset>
        <van-cell 
          :title="t('settings.helpCenter')" 
          is-link
          @click="router.push('/help-center')"
        >
          <template #icon>
            <van-icon name="question-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.feedback')" 
          is-link
          @click="router.push('/feedback')"
        >
          <template #icon>
            <van-icon name="chat-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.aboutUs')" 
          is-link
          @click="showAbout"
        >
          <template #icon>
            <van-icon name="info-o" class="cell-icon" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 版本信息 -->
      <van-cell-group :title="t('settings.versionInfo')" inset>
        <van-cell 
          :title="t('settings.currentVersion')" 
          :value="version"
          @click="handleVersionClick"
          clickable
        >
          <template #icon>
            <van-icon name="label-o" class="cell-icon" />
          </template>
        </van-cell>
        <van-cell 
          :title="t('settings.checkUpdate')" 
          is-link
          @click="handleCheckUpdate"
        >
          <template #icon>
            <van-icon name="upgrade" class="cell-icon" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 退出登录按钮 -->
      <div class="logout-section">
        <van-button 
          block 
          round 
          type="danger" 
          @click="handleLogout"
          class="logout-button"
        >
          {{ t('settings.logout') }}
        </van-button>
      </div>
    </div>

    <!-- 语言选择弹出层 -->
    <van-action-sheet
      v-model:show="showLanguageSheet"
      :actions="languageActions"
      :cancel-text="t('common.cancel')"
      close-on-click-action
      @select="onLanguageSelect"
    />

    <!-- 关于我们弹出层 -->
    <van-popup
      v-model:show="showAboutPopup"
      round
      closeable
      :style="{ padding: '20px', width: '80%', maxWidth: '400px' }"
    >
      <div class="about-content">
        <div class="about-logo">
          <van-icon name="star-o" size="60" color="#1989fa" />
        </div>
        <h2 class="about-title">H5 Lookviews</h2>
        <p class="about-version">版本 {{ version }}</p>
        <p class="about-desc">
          一款优雅的笔记分享社区应用，让知识分享更简单、更美好。
        </p>
        <div class="about-info">
          <p><strong>开发团队：</strong>前端开发团队</p>
          <p><strong>技术栈：</strong>Vue 3 + TypeScript + Vant 4</p>
          <p><strong>更新时间：</strong>{{ updateTime }}</p>
        </div>
        <div class="about-links">
          <van-button 
            plain 
            type="primary" 
            size="small"
            @click="openGithub"
          >
            <van-icon name="github" /> GitHub
          </van-button>
          <van-button 
            plain 
            type="primary" 
            size="small"
            @click="showToast('功能开发中')"
          >
            <van-icon name="service-o" /> 联系我们
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showSuccessToast, showToast, showDialog } from 'vant'
import { useUserStore } from '../stores/store'
import { appConfig } from '../config/app'
import { SUPPORT_LOCALES, setLocale, getCurrentLocaleName, type Locale } from '../i18n'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

// 版本信息
const version = ref<string>(appConfig.version)
const updateTime = ref<string>(appConfig.updateTime)
const versionClickCount = ref<number>(0)
const versionClickTimer = ref<number | null>(null)

// 设置项
const darkMode = ref<boolean>(false)
const currentLanguage = ref<string>(getCurrentLocaleName())
const cacheSize = ref<string>(t('common.loading'))

// 弹出层
const showLanguageSheet = ref<boolean>(false)
const showAboutPopup = ref<boolean>(false)

// 语言选项
interface LanguageAction {
  name: string
  value: Locale
}

const languageActions = ref<LanguageAction[]>(SUPPORT_LOCALES.map(locale => ({
  name: locale.name,
  value: locale.value
})))
}

const languageActions = ref<LanguageAction[]>([
  { name: '简体中文', value: 'zh-CN' },
  { name: '繁體中文', value: 'zh-TW' },
  { name: 'English', value: 'en-US' },
  { name: '日本語', value: 'ja-JP' },
])

// 方法
const handleBack = (): void => {
  router.back()
}

// 夜间模式切换
const onDarkModeChange = (value: boolean): void => {
  const root = document.documentElement
  
  if (value) {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
    showToast(t('settings.darkModeOn'))
  } else {
    root.classList.remove('dark')
    root.removeAttribute('data-theme')
    showToast(t('settings.darkModeOff'))
  }
  
  // 保存设置到本地存储
  localStorage.setItem('darkMode', String(value))
  
  // 触发全局主题变化事件
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { dark: value } }))
}

// 显示语言选择器
const showLanguagePicker = (): void => {
  showLanguageSheet.value = true
}

// 语言选择
const onLanguageSelect = (action: LanguageAction): void => {
  currentLanguage.value = action.name
  setLocale(action.value)
  showSuccessToast(t('settings.languageChanged', { lang: action.name }))
}

// 计算缓存大小
const calculateCacheSize = (): void => {
  try {
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    // 转换为 KB
    const sizeInKB = (totalSize / 1024).toFixed(2)
    cacheSize.value = `${sizeInKB} KB`
  } catch (error) {
    cacheSize.value = '未知'
  }
}

// 清除缓存
const handleClearCache = (): void => {
  showConfirmDialog({
    title: t('settings.clearCacheTitle'),
    message: t('settings.clearCacheMessage'),
    confirmButtonText: t('settings.confirmClear'),
    confirmButtonColor: '#ee0a24',
  }).then(() => {
    // 保留必要的数据
    const userToken = localStorage.getItem('userToken')
    const userInfo = localStorage.getItem('userInfo')
    const darkModeSetting = localStorage.getItem('darkMode')
    const languageSetting = localStorage.getItem('language')
    
    // 清除所有缓存
    localStorage.clear()
    
    // 恢复必要的数据
    if (userToken) localStorage.setItem('userToken', userToken)
    if (userInfo) localStorage.setItem('userInfo', userInfo)
    if (darkModeSetting) localStorage.setItem('darkMode', darkModeSetting)
    if (languageSetting) localStorage.setItem('language', languageSetting)
    
    // 重新计算缓存大小
    calculateCacheSize()
    showSuccessToast(t('settings.cacheCleared'))
  }).catch(() => {
    // 用户取消
  })
}

// 版本号点击（连续点击7次触发彩蛋）
const handleVersionClick = (): void => {
  versionClickCount.value++
  
  // 清除之前的定时器
  if (versionClickTimer.value) {
    clearTimeout(versionClickTimer.value)
  }
  
  // 3秒内点击有效
  versionClickTimer.value = window.setTimeout(() => {
    versionClickCount.value = 0
  }, 3000)
  
  // 连续点击7次
  if (versionClickCount.value === 7) {
    versionClickCount.value = 0
    showDeveloperMode()
  } else if (versionClickCount.value === 5) {
    showToast(t('settings.clickMore', { count: 7 - versionClickCount.value }))
  }
}

// 显示开发者模式
const showDeveloperMode = (): void => {
  showDialog({
    title: t('settings.developerMode'),
    message: `
      ${t('settings.easterEgg')}
      
      ${t('settings.versionInfo')}:
      - ${t('settings.currentVersion')}: ${version.value}
      - ${t('settings.checkUpdate')}: ${updateTime.value}
      - Tech Stack: Vue 3 + TypeScript
      - UI Framework: Vant 4
      - Build Tool: Vite
      
      You are the ${Math.floor(Math.random() * 1000)}th user to find this!
    `,
    confirmButtonText: t('settings.awesome'),
  }).then(() => {
    // 可以在这里添加开发者模式的特殊功能
  })
}

// 检查更新
const handleCheckUpdate = (): void => {
  showToast(t('settings.checkingUpdate'))
  
  // 模拟检查更新
  setTimeout(() => {
    const hasUpdate = Math.random() > 0.5
    
    if (hasUpdate) {
      showConfirmDialog({
        title: t('settings.updateFound'),
        message: `${t('settings.updateFound')} v${parseFloat(version.value) + 0.1}\n\n${t('settings.updateMessage')}`,
        confirmButtonText: t('settings.updateNow'),
      }).then(() => {
        showToast(t('settings.downloading'))
        // 实际项目中这里应该跳转到下载页面或触发更新流程
      }).catch(() => {
        // 用户取消更新
      })
    } else {
      showSuccessToast(t('settings.latestVersion'))
    }
  }, 1500)
}

// 账号安全
const handleAccountSecurity = (): void => {
  showDialog({
    title: '账号安全',
    message: '账号安全设置功能开发中\n\n将包含以下功能：\n- 修改密码\n- 绑定手机号\n- 绑定邮箱\n- 二步验证\n- 登录设备管理',
    confirmButtonText: '知道了',
  })
}

// 隐私设置
const handlePrivacySetting = (): void => {
  showDialog({
    title: '隐私设置',
    message: '隐私设置功能开发中\n\n将包含以下功能：\n- 谁可以看我的主页\n- 谁可以评论我的内容\n- 黑名单管理\n- 屏蔽设置',
    confirmButtonText: '知道了',
  })
}

// 显示关于我们
const showAbout = (): void => {
  showAboutPopup.value = true
}

// 打开 GitHub
const openGithub = (): void => {
  window.open(appConfig.repository, '_blank')
}

// 退出登录
const handleLogout = (): void => {
  showConfirmDialog({
    title: t('settings.logout'),
    message: t('settings.confirmLogout'),
    confirmButtonText: t('settings.confirmLogoutBtn'),
    confirmButtonColor: '#ee0a24',
    cancelButtonText: t('common.cancel'),
  }).then(() => {
    // 执行退出登录逻辑
    userStore.logout()
    showSuccessToast(t('settings.logoutSuccess'))
    
    // 延迟跳转到登录页
    setTimeout(() => {
      router.replace('/login')
    }, 500)
  }).catch(() => {
    // 用户取消退出
  })
}

// 加载设置
const loadSettings = (): void => {
  // 加载夜间模式设置
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    darkMode.value = true
    const root = document.documentElement
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  }
  
  // 加载语言设置（已由 i18n 自动处理）
  currentLanguage.value = getCurrentLocaleName()
  
  // 计算缓存大小
  calculateCacheSize()
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

.settings-content {
  padding-top: 8px;
}

.cell-icon {
  margin-right: 12px;
  font-size: 18px;
}

:deep(.van-cell-group) {
  margin-bottom: 12px;

  .van-cell {
    padding: 14px 16px;

    &::after {
      border-bottom: 1px solid #ebedf0;
    }

    &:last-child::after {
      border-bottom: none;
    }
  }
}

.logout-section {
  margin: 24px 16px;
}

.logout-button {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

// 关于我们弹出层样式
.about-content {
  text-align: center;
  padding: 10px;
}

.about-logo {
  margin-bottom: 16px;
}

.about-title {
  font-size: 24px;
  font-weight: bold;
  color: #323233;
  margin: 0 0 8px;
}

.about-version {
  font-size: 14px;
  color: #969799;
  margin: 0 0 16px;
}

.about-desc {
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
  margin: 0 0 20px;
  padding: 0 10px;
}

.about-info {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  text-align: left;

  p {
    margin: 8px 0;
    font-size: 13px;
    color: #646566;
    line-height: 1.5;

    strong {
      color: #323233;
      font-weight: 500;
    }
  }
}

.about-links {
  display: flex;
  gap: 12px;
  justify-content: center;

  .van-button {
    flex: 1;
    max-width: 140px;
  }
}

// 夜间模式样式
:global(.dark) {
  .settings-page {
    background: #1a1a1a;
  }

  .about-title {
    color: #e8e8e8;
  }

  .about-info {
    background: #2a2a2a;

    p strong {
      color: #e8e8e8;
    }
  }
}
</style>
