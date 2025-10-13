import { ref } from 'vue'
import { showSuccessToast } from 'vant'

/**
 * 分享功能 Hook
 * @returns {Object} 分享相关的状态和方法
 */
export function useShare() {
  // 分享面板显示状态
  const showShareSheet = ref(false)
  
  // 当前分享的内容
  const currentShareItem = ref(null)
  
  // 分享选项配置
  const shareOptions = ref([
    [
      { name: '微信', icon: 'wechat' },
      { name: '微博', icon: 'weibo' },
      { name: 'QQ', icon: 'qq' },
      { name: '复制链接', icon: 'link' },
    ],
    [
      { name: '朋友圈', icon: 'wechat-moments' },
      { name: '钉钉', icon: 'share' },
      { name: '更多', icon: 'ellipsis' },
    ]
  ])

  /**
   * 复制文本到剪贴板
   * @param {string} text - 要复制的文本
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccessToast('链接已复制到剪贴板')
    } catch (error) {
      // 兜底方案 - 使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showSuccessToast('链接已复制到剪贴板')
    }
  }

  /**
   * 处理分享选择
   * @param {Object} option - 选择的分享选项
   * @param {number} index - 选项索引
   */
  const onShareSelect = async (option, index) => {
    const shareItem = currentShareItem.value
    if (!shareItem) return

    const { url, title, text } = shareItem
    
    switch (option.name) {
      case '微信':
        showSuccessToast('请在微信中选择联系人分享')
        break
        
      case '微博':
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
        window.open(weiboUrl, '_blank')
        break
        
      case 'QQ':
        showSuccessToast('请在QQ中选择好友分享')
        break
        
      case '朋友圈':
        showSuccessToast('请在微信朋友圈中分享')
        break
        
      case '钉钉':
        showSuccessToast('请在钉钉中选择联系人分享')
        break
        
      case '复制链接':
        await copyToClipboard(url)
        break
        
      case '更多':
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: text, 
              url: url
            })
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.log('分享失败:', error)
              showSuccessToast('分享失败，请重试')
            }
          }
        } else {
          showSuccessToast('您的浏览器不支持原生分享')
        }
        break
        
      default:
        showSuccessToast(`分享到${option.name}`)
    }
    
    // 关闭分享面板
    showShareSheet.value = false
  }

  /**
   * 取消分享
   */
  const onShareCancel = () => {
    showShareSheet.value = false
    currentShareItem.value = null
  }

  /**
   * 打开分享面板
   * @param {Object} shareData - 分享数据
   * @param {string} shareData.url - 分享链接
   * @param {string} shareData.title - 分享标题
   * @param {string} shareData.text - 分享描述文本
   */
  const openShareSheet = (shareData) => {
    currentShareItem.value = shareData
    showShareSheet.value = true
  }

  /**
   * 分享动态
   * @param {Object} post - 动态数据
   * @param {string|number} post.id - 动态ID
   * @param {string} post.username - 用户名
   * @param {string} post.content - 动态内容
   */
  const sharePost = (post) => {
    const shareData = {
      url: `${window.location.origin}/post/${post.id}`,
      title: '动态分享',
      text: `${post.username}：${post.content.slice(0, 50)}${post.content.length > 50 ? '...' : ''}`
    }
    openShareSheet(shareData)
  }

  /**
   * 分享笔记
   * @param {Object} note - 笔记数据
   * @param {string|number} note.id - 笔记ID
   * @param {Object} note.author - 作者信息
   * @param {string} note.author.name - 作者姓名
   * @param {string} note.title - 笔记标题
   * @param {string} note.content - 笔记内容
   */
  const shareNote = (note) => {
    const shareData = {
      url: `${window.location.origin}/note/${note.id}`,
      title: '笔记分享',
      text: `${note.author.name}：${note.title || note.content.slice(0, 50)}${(note.title || note.content).length > 50 ? '...' : ''}`
    }
    openShareSheet(shareData)
  }

  return {
    // 状态
    showShareSheet,
    shareOptions,
    currentShareItem,
    
    // 方法
    onShareSelect,
    onShareCancel,
    openShareSheet,
    sharePost,
    shareNote,
    copyToClipboard
  }
}