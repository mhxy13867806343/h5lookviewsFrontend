import { ref, reactive } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'
import dayjs from 'dayjs'

/**
 * 拉黑功能 hooks
 */
export function useBlock() {
  // 响应式数据
  const blockLoading = ref(false)
  const blockedUsers = ref(new Set()) // 已拉黑用户ID集合
  const blacklist = ref([]) // 黑名单详细信息列表
  const isLoading = ref(false)
  
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
      
      // 添加到详细黑名单列表
      const blacklistItem = {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || 'https://img.yzcdn.cn/vant/cat.jpeg',
        signature: user.signature || '',
        blockTime: new Date(),
        blockContext: context
      }
      blacklist.value.unshift(blacklistItem) // 新拉黑的用户放在最前面
      
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
   * 获取黑名单列表
   * @returns {Array} 黑名单用户ID数组
   */
  const getBlockedUsers = () => {
    return Array.from(blockedUsers.value)
  }

  /**
   * 获取黑名单用户详细信息
   */
  const getBlacklistUsers = async () => {
    isLoading.value = true
    
    try {
      // 模拟API调用获取黑名单详细信息
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 模拟黑名单数据
      const mockBlacklistData = [
        {
          id: 'user001',
          nickname: '烦人的用户',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          signature: '总是发一些无聊的内容',
          blockTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
          blockContext: 'post'
        },
        {
          id: 'user002', 
          nickname: '广告机器人',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          signature: '专门发广告的账号',
          blockTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
          blockContext: 'user'
        },
        {
          id: 'user003',
          nickname: '恶意评论者',
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          signature: '喜欢恶意评论别人',
          blockTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
          blockContext: 'note'
        }
      ]
      
      // 更新黑名单数据
      blacklist.value = mockBlacklistData
      
      // 同步更新 blockedUsers Set
      blockedUsers.value.clear()
      mockBlacklistData.forEach(user => {
        blockedUsers.value.add(user.id)
      })
      
      return blacklist.value
    } catch (error) {
      console.error('获取黑名单失败:', error)
      showFailToast('获取黑名单失败')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 从黑名单中移除用户（解除拉黑）
   * @param {Object} user - 用户信息对象
   */
  const unblockUser = async (user) => {
    if (!user || !user.id) {
      showFailToast('用户信息不完整')
      return { success: false }
    }

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 从黑名单中移除
      blockedUsers.value.delete(user.id)
      blacklist.value = blacklist.value.filter(item => item.id !== user.id)
      
      // 可以在这里调用实际的API
      // await api.unblockUser(user.id)
      
      return {
        success: true,
        userId: user.id,
        user
      }
    } catch (error) {
      console.error('解除拉黑失败:', error)
      showFailToast('解除拉黑失败')
      
      return {
        success: false,
        error: error.message,
        userId: user.id
      }
    }
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
    blockLoading,
    blockedUsers,
    blacklist,
    isLoading,
    blockState,
    
    // 方法
    showBlockConfirm,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers,
    getBlacklistUsers,
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