// 繁體中文語言包
export default {
  common: {
    confirm: '確認',
    cancel: '取消',
    save: '保存',
    delete: '刪除',
    edit: '編輯',
    search: '搜索',
    loading: '加載中...',
    noData: '暫無數據',
    back: '返回',
    submit: '提交',
    reset: '重置',
    success: '成功',
    fail: '失敗',
    tip: '提示',
  },

  nav: {
    home: '首頁',
    square: '廣場',
    publish: '發布',
    messages: '消息',
    profile: '我的',
  },

  settings: {
    title: '設置',
    accountInfo: '賬號信息',
    personalInfo: '個人信息',
    accountSecurity: '賬號安全',
    privacySettings: '隱私設置',
    
    generalSettings: '通用設置',
    viewHistory: '瀏覽歷史',
    messageNotification: '消息通知',
    darkMode: '夜間模式',
    languageSettings: '語言設置',
    
    cacheStorage: '緩存與存儲',
    cacheSize: '緩存大小',
    clearCache: '清除緩存',
    
    helpFeedback: '幫助與反饋',
    helpCenter: '幫助中心',
    feedback: '意見反饋',
    aboutUs: '關於我們',
    
    versionInfo: '版本信息',
    currentVersion: '當前版本',
    checkUpdate: '檢查更新',
    
    logout: '退出登錄',
    confirmLogout: '確定要退出登錄嗎？',
    confirmLogoutBtn: '確認退出',
    logoutSuccess: '已退出登錄',
    
    darkModeOn: '已開啟夜間模式',
    darkModeOff: '已關閉夜間模式',
    languageChanged: '已切換為{lang}',
    
    clearCacheTitle: '確認清除緩存',
    clearCacheMessage: '清除緩存後，部分數據需要重新加載，是否繼續？',
    confirmClear: '確認清除',
    cacheCleared: '緩存已清除',
    
    checkingUpdate: '正在檢查更新...',
    updateFound: '發現新版本',
    updateMessage: '更新內容：\n- 優化用戶體驗\n- 修復已知問題\n- 新增更多功能',
    updateNow: '立即更新',
    downloading: '開始下載更新...',
    latestVersion: '當前已是最新版本',
    
    developerMode: '🎉 開發者模式',
    easterEgg: '恭喜發現彩蛋！',
    clickMore: '再點擊 {count} 次',
    awesome: '太棒了',
  },

  viewHistory: {
    title: '瀏覽歷史',
    searchPlaceholder: '搜索歷史記錄',
    clearAll: '清空',
    confirmClearTitle: '確認清空',
    confirmClearMessage: '確定要清空所有瀏覽歷史嗎？',
    confirmClearBtn: '確認清空',
    historyCleared: '已清空瀏覽歷史',
    deleteSuccess: '刪除成功',
    noHistory: '暫無瀏覽歷史',
    viewedAt: '瀏覽於',
    
    types: {
      note: '筆記',
      post: '動態',
      user: '用戶',
      category: '分類',
      search: '搜索',
      other: '其他',
    },
  },

  feedback: {
    title: '意見反饋',
    feedbackType: '反饋類型',
    feedbackContent: '反饋內容',
    contentPlaceholder: '請詳細描述您的問題或建議，我們會認真處理每一條反饋...',
    uploadImages: '上傳圖片',
    uploadTip: '最多可上傳3張圖片',
    contactInfo: '聯繫方式',
    contactPlaceholder: '請留下您的聯繫方式，方便我們回復',
    submit: '提交反饋',
    
    types: {
      bug: '功能異常',
      suggestion: '功能建議',
      performance: '性能問題',
      other: '其他問題',
    },
    
    faq: '常見問題',
    faqItems: {
      q1: '如何修改個人信息？',
      a1: '進入「我的」-「編輯資料」即可修改個人信息',
      q2: '如何發布筆記？',
      a2: '點擊底部導航欄的「+」按鈕即可發布筆記',
      q3: '如何聯繫客服？',
      a3: '可以通過下方的聯繫方式聯繫我們',
    },
    
    contactWays: '聯繫方式',
    email: '郵箱',
    wechat: '微信',
    qqGroup: 'QQ群',
    
    submitSuccess: '反饋提交成功',
    submitFail: '提交失敗，請稍後重試',
    contentRequired: '請填寫反饋內容',
  },

  helpCenter: {
    title: '幫助中心',
    searchPlaceholder: '搜索幫助內容',
    hotQuestions: '熱門問題',
    featureGuide: '功能指南',
    accountRelated: '賬號相關',
    securityPrivacy: '安全與隱私',
    contactSupport: '聯繫客服',
    helpful: '有幫助',
    notHelpful: '沒幫助',
    thanksFeedback: '感謝您的反饋',
    
    hot: {
      q1: '如何發布筆記？',
      a1: '點擊底部導航欄的「+」按鈕，選擇筆記類型，編寫內容後點擊發布即可。',
      q2: '如何關注其他用戶？',
      a2: '進入用戶主頁，點擊「關注」按鈕即可關注該用戶。',
      q3: '如何收藏筆記？',
      a3: '在筆記詳情頁點擊底部的「收藏」按鈕即可收藏筆記。',
      q4: '如何修改密碼？',
      a4: '進入「設置」-「賬號安全」-「修改密碼」進行修改。',
      q5: '如何清除緩存？',
      a5: '進入「設置」-「清除緩存」即可清除應用緩存。',
    },
    
    guide: {
      publish: '發布筆記',
      publishStep1: '點擊底部「+」按鈕',
      publishStep2: '選擇筆記類型和話題',
      publishStep3: '編寫內容並發布',
      
      interact: '互動交流',
      interactStep1: '瀏覽感興趣的內容',
      interactStep2: '點讚、評論、收藏',
      interactStep3: '關注喜歡的作者',
      
      manage: '管理內容',
      manageStep1: '進入個人主頁',
      manageStep2: '查看已發布內容',
      manageStep3: '編輯或刪除內容',
    },
    
    account: {
      q1: '忘記密碼怎麼辦？',
      a1: '在登錄頁點擊「忘記密碼」，通過手機號或郵箱重置密碼。',
      q2: '如何修改個人信息？',
      a2: '進入「我的」-「編輯資料」即可修改昵稱、頭像等信息。',
      q3: '如何註銷賬號？',
      a3: '請聯繫客服進行賬號註銷操作，註銷後數據將無法恢復。',
    },
    
    security: {
      q1: '如何設置隱私？',
      a1: '進入「設置」-「隱私設置」可以設置誰可以看你的主頁、誰可以評論等。',
      q2: '如何舉報違規內容？',
      a2: '在違規內容頁面點擊右上角「...」-「舉報」即可舉報。',
      q3: '如何屏蔽用戶？',
      a3: '在用戶主頁點擊右上角「...」-「屏蔽」即可屏蔽該用戶。',
      q4: '賬號安全建議',
      a4: '建議定期修改密碼，不要與他人分享賬號信息，開啟二步驗證。',
    },
  },

  login: {
    title: '登錄',
    username: '用戶名',
    password: '密碼',
    loginBtn: '登錄',
    register: '註冊賬號',
    forgotPassword: '忘記密碼',
    loginSuccess: '登錄成功',
  },

  register: {
    title: '註冊',
    username: '用戶名',
    password: '密碼',
    confirmPassword: '確認密碼',
    registerBtn: '註冊',
    haveAccount: '已有賬號',
    toLogin: '去登錄',
    registerSuccess: '註冊成功',
  },
}
