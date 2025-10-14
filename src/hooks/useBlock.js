import { ref, reactive } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'

/**
 * 拉黑功能 hooks
 */
export function useBlock() {
  // 响应式数据
  const blockLoading = ref(false)
  const blockedUsers = ref(new Set()) // 已拉黑用户ID集合
  
  // 拉黑状态
  const blockState = reactive({
    isBlocking: false,
    currentUser: null
  })

  /**
   * 检查用户是否已被拉黑
   * @param {string} userId - 用户ID
   * @returns {boolean}
   */
  const isUserBlocked = (userId) => {
    return blockedUsers.value.has(userId)
  }

  /**
   * 显示拉黑确认对话框
   * @param {Object} user - 用户信息
   * @param {string} user.id - 用户ID
   * @param {string} user.nickname - 用户昵称
   * @param {string} context - 拉黑场景上下文 ('note'|'post'|'user')
   */
  const showBlockConfirm = (user, context = 'user') => {
    if (!user || !user.id) {
      showFailToast('用户信息不完整')
      return Promise.reject(new Error('用户信息不完整'))
    }

    // 如果用户已被拉黑，提示用户
    if (isUserBlocked(user.id)) {
      showFailToast('该用户已在黑名单中')
      return Promise.reject(new Error('用户已被拉黑'))
    }

    blockState.currentUser = user
    
    // 根据不同场景显示不同的确认消息
    const contextMessages = {
      note: '拉黑后将无法查看该用户的笔记内容',
      post: '拉黑后将无法查看该用户的动态',
      user: '拉黑后将无法查看该用户的所有内容'
    }

    const message = contextMessages[context] || contextMessages.user

    return showConfirmDialog({
      title: '确认拉黑',
      message: `确定要拉黑用户"${user.nickname || '该用户'}"吗？\n\n${message}`,
      confirmButtonText: '确认拉黑',
      confirmButtonColor: '#ee0a24',
      cancelButtonText: '取消'
    }).then(() => {
      return blockUser(user, context)
    })
  }

  /**
   * 执行拉黑操作
   * @param {Object} user - 用户信息
   * @param {string} context - 拉黑场景
   */
  const blockUser = async (user, context = 'user') => {
    if (blockLoading.value) return

    blockLoading.value = true
    blockState.isBlocking = true

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 添加到黑名单
      blockedUsers.value.add(user.id)
      
      // 可以在这里调用实际的API
      // await api.blockUser(user.id, context)
      
      showSuccessToast(`已拉黑用户"${user.nickname || '该用户'}"`)
      
      // 触发拉黑成功事件
      return {
        success: true,
        userId: user.id,
        context,
        user
      }
    } catch (error) {
      console.error('拉黑用户失败:', error)
      showFailToast('拉黑失败，请重试')
      
      return {
        success: false,
        error: error.message,
        userId: user.id,
        context
      }
    } finally {
      blockLoading.value = false
      blockState.isBlocking = false
      blockState.currentUser = null
    }
  }

  /**
   * 取消拉黑（解除拉黑）
   * @param {string} userId - 用户ID
   */
  const unblockUser = async (userId) => {
    if (!userId) return

    try {
      blockLoading.value = true
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从黑名单中移除
      blockedUsers.value.delete(userId)
      
      // 可以在这里调用实际的API
      // await api.unblockUser(userId)
      
      showSuccessToast('已解除拉黑')
      
      return {
        success: true,
        userId
      }
    } catch (error) {
      console.error('解除拉黑失败:', error)
      showFailToast('解除拉黑失败')
      
      return {
        success: false,
        error: error.message,
        userId
      }
    } finally {
      blockLoading.value = false
    }
  }

  /**
   * 获取黑名单列表
   * @returns {Array} 黑名单用户ID数组
   */
  const getBlockedUsers = () => {
    return Array.from(blockedUsers.value)
  }

  /**
   * 批量拉黑用户
   * @param {Array} userIds - 用户ID数组
   */
  const blockMultipleUsers = async (userIds) => {
    if (!Array.isArray(userIds) || userIds.length === 0) return

    try {
      blockLoading.value = true
      
      // 模拟批量API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 批量添加到黑名单
      userIds.forEach(userId => {
        blockedUsers.value.add(userId)
      })
      
      showSuccessToast(`已拉黑 ${userIds.length} 个用户`)
      
      return {
        success: true,
        blockedCount: userIds.length
      }
    } catch (error) {
      console.error('批量拉黑失败:', error)
      showFailToast('批量拉黑失败')
      
      return {
        success: false,
        error: error.message
      }
    } finally {
      blockLoading.value = false
    }
  }

  /**
   * 重置拉黑状态
   */
  const resetBlockState = () => {
    blockState.isBlocking = false
    blockState.currentUser = null
    blockLoading.value = false
  }

  /**
   * 清空黑名单（谨慎使用）
   */
  const clearBlockedUsers = () => {
    blockedUsers.value.clear()
    showSuccessToast('已清空黑名单')
  }

  return {
    // 响应式数据
    blockLoading: blockLoading,
    blockedUsers: blockedUsers,
    blockState,
    
    // 方法
    showBlockConfirm,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers,
    blockMultipleUsers,
    resetBlockState,
    clearBlockedUsers
  }
}

// 全局单例实例（可选，用于跨组件共享黑名单状态）
let globalBlockInstance = null

export function useGlobalBlock() {
  if (!globalBlockInstance) {
    globalBlockInstance = useBlock()
  }
  return globalBlockInstance
}