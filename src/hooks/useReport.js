import { ref } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'

/**
 * 举报功能 Hook
 * 提供通用的举报功能，包括举报类型选择、举报提交等
 */
export function useReport() {
  const showReportDialog = ref(false)
  const reportLoading = ref(false)
  const currentReportTarget = ref(null)

  // 举报类型选项
  const reportTypes = [
    { label: '垃圾营销', value: 'spam', description: '推广、营销等垃圾信息' },
    { label: '违法违规', value: 'illegal', description: '违反法律法规的内容' },
    { label: '色情低俗', value: 'vulgar', description: '色情、低俗、不雅内容' },
    { label: '恶意攻击', value: 'attack', description: '人身攻击、恶意中伤' },
    { label: '虚假信息', value: 'fake', description: '虚假、误导性信息' },
    { label: '侵权盗版', value: 'copyright', description: '侵犯他人版权、知识产权' },
    { label: '其他原因', value: 'other', description: '其他不当内容' }
  ]

  // 显示举报对话框
  const showReportConfirm = (target, targetType = 'post') => {
    currentReportTarget.value = { ...target, type: targetType }
    showReportDialog.value = true
  }

  // 提交举报
  const submitReport = async (reportData) => {
    reportLoading.value = true
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const fullReportData = {
        ...reportData,
        targetInfo: currentReportTarget.value,
        reportTime: new Date().toISOString()
      }
      
      console.log('举报数据:', fullReportData)
      
      showSuccessToast('举报成功，感谢您的反馈')
      showReportDialog.value = false
      currentReportTarget.value = null
      
      return true
    } catch (error) {
      console.error('举报失败:', error)
      showFailToast('举报失败，请稍后重试')
      return false
    } finally {
      reportLoading.value = false
    }
  }

  // 快速举报（常用类型）
  const quickReport = async (target, targetType, reportType) => {
    currentReportTarget.value = { ...target, type: targetType }
    return await submitReport(reportType)
  }

  // 举报用户
  const reportUser = (user) => {
    showReportConfirm(user, 'user')
  }

  // 举报帖子/动态
  const reportPost = (post) => {
    showReportConfirm(post, 'post')
  }

  // 举报评论
  const reportComment = (comment) => {
    showReportConfirm(comment, 'comment')
  }

  // 重置状态
  const resetReportState = () => {
    showReportDialog.value = false
    reportLoading.value = false
    currentReportTarget.value = null
  }

  return {
    // 状态
    showReportDialog,
    reportLoading,
    currentReportTarget,
    
    // 数据
    reportTypes,
    
    // 方法
    showReportConfirm,
    submitReport,
    quickReport,
    reportUser,
    reportPost,
    reportComment,
    resetReportState
  }
}