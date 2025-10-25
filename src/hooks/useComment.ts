import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '../stores/store'

// 类型定义
interface Comment {
  id: string
  content: string
  user: {
    id: string
    nickname: string
    avatar: string
  }
  createTime: string
  likeCount: number
  isLiked: boolean
  replies?: Comment[]
  replyCount?: number
  parentId?: string
}

interface CommentParams {
  content: string
  parentId?: string
  replyToUserId?: string
}

/**
 * 评论功能 Hook
 * 提供评论的增删改查、点赞、回复等功能
 */
export function useComment(targetType: string, targetId: string) {
  const userStore = useUserStore()
  
  // 响应式数据
  const comments = ref<Comment[]>([])
  const loading = ref<boolean>(false)
  const submitting = ref<boolean>(false)
  const totalCount = ref<number>(0)
  const hasMore = ref<boolean>(true)
  const page = ref<number>(1)
  const pageSize = ref<number>(20)

  // 计算属性
  const canComment = computed(() => userStore.isLoggedIn)

  // 获取评论列表
  const getComments = async (refresh = false) => {
    if (loading.value) return
    
    loading.value = true
    
    try {
      // 如果是刷新，重置页码
      if (refresh) {
        page.value = 1
        comments.value = []
      }
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 模拟评论数据
      const mockComments = generateMockComments(page.value, pageSize.value)
      
      if (refresh) {
        comments.value = mockComments
      } else {
        comments.value.push(...mockComments)
      }
      
      // 更新分页信息
      totalCount.value = 50 // 模拟总数
      hasMore.value = comments.value.length < totalCount.value
      page.value += 1
      
      return true
    } catch (error) {
      console.error('获取评论失败:', error)
      showFailToast('获取评论失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 提交评论
  const submitComment = async (commentData) => {
    if (submitting.value) return false
    
    submitting.value = true
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newComment = {
        id: Date.now(),
        author: {
          id: userStore.user.id,
          nickname: userStore.user.nickname,
          avatar: userStore.user.avatar
        },
        content: commentData.content,
        createTime: new Date(),
        likesCount: 0,
        isLiked: false,
        replies: [],
        hasMoreReplies: false,
        totalRepliesCount: 0,
        replyTo: commentData.replyTo || null
      }
      
      // 根据回复链确定插入位置
      if (commentData.replyChain && commentData.replyChain.length > 0) {
        insertReply(newComment, commentData.replyChain)
      } else {
        // 主评论，插入到列表开头
        comments.value.unshift(newComment)
        totalCount.value += 1
      }
      
      showSuccessToast('评论成功')
      return true
    } catch (error) {
      console.error('评论失败:', error)
      showFailToast('评论失败')
      return false
    } finally {
      submitting.value = false
    }
  }

  // 插入回复到正确位置
  const insertReply = (newReply, replyChain) => {
    const [mainComment, secondComment, thirdComment] = replyChain
    
    // 找到主评论
    const mainIndex = comments.value.findIndex(c => c.id === mainComment.id)
    if (mainIndex === -1) return
    
    if (!secondComment) {
      // 回复主评论
      if (!comments.value[mainIndex].replies) {
        comments.value[mainIndex].replies = []
      }
      comments.value[mainIndex].replies.push(newReply)
      comments.value[mainIndex].totalRepliesCount += 1
    } else if (!thirdComment) {
      // 回复二级评论
      const replyIndex = comments.value[mainIndex].replies.findIndex(r => r.id === secondComment.id)
      if (replyIndex !== -1) {
        if (!comments.value[mainIndex].replies[replyIndex].subReplies) {
          comments.value[mainIndex].replies[replyIndex].subReplies = []
        }
        comments.value[mainIndex].replies[replyIndex].subReplies.push(newReply)
        comments.value[mainIndex].totalRepliesCount += 1
      }
    } else {
      // 回复三级评论（插入到三级评论列表）
      const replyIndex = comments.value[mainIndex].replies.findIndex(r => r.id === secondComment.id)
      if (replyIndex !== -1) {
        if (!comments.value[mainIndex].replies[replyIndex].subReplies) {
          comments.value[mainIndex].replies[replyIndex].subReplies = []
        }
        comments.value[mainIndex].replies[replyIndex].subReplies.push(newReply)
        comments.value[mainIndex].totalRepliesCount += 1
      }
    }
  }

  // 点赞评论
  const likeComment = async (commentData) => {
    const { comment } = commentData
    
    if (!userStore.isLoggedIn) {
      showFailToast('请先登录')
      return false
    }
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 更新本地状态
      if (comment.isLiked) {
        comment.isLiked = false
        comment.likesCount = Math.max(0, comment.likesCount - 1)
      } else {
        comment.isLiked = true
        comment.likesCount = (comment.likesCount || 0) + 1
      }
      
      return true
    } catch (error) {
      console.error('点赞失败:', error)
      showFailToast('操作失败')
      return false
    }
  }

  // 删除评论
  const deleteComment = async (deleteData) => {
    const { comment, parentComment, grandParentComment } = deleteData
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (!parentComment) {
        // 删除主评论
        const index = comments.value.findIndex(c => c.id === comment.id)
        if (index !== -1) {
          comments.value.splice(index, 1)
          totalCount.value -= 1
        }
      } else if (!grandParentComment) {
        // 删除二级评论
        const mainIndex = comments.value.findIndex(c => c.id === parentComment.id)
        if (mainIndex !== -1) {
          const replyIndex = comments.value[mainIndex].replies.findIndex(r => r.id === comment.id)
          if (replyIndex !== -1) {
            comments.value[mainIndex].replies.splice(replyIndex, 1)
            comments.value[mainIndex].totalRepliesCount -= 1
          }
        }
      } else {
        // 删除三级评论
        const mainIndex = comments.value.findIndex(c => c.id === grandParentComment.id)
        if (mainIndex !== -1) {
          const replyIndex = comments.value[mainIndex].replies.findIndex(r => r.id === parentComment.id)
          if (replyIndex !== -1) {
            const subReplyIndex = comments.value[mainIndex].replies[replyIndex].subReplies.findIndex(sr => sr.id === comment.id)
            if (subReplyIndex !== -1) {
              comments.value[mainIndex].replies[replyIndex].subReplies.splice(subReplyIndex, 1)
              comments.value[mainIndex].totalRepliesCount -= 1
            }
          }
        }
      }
      
      showSuccessToast('删除成功')
      return true
    } catch (error) {
      console.error('删除失败:', error)
      showFailToast('删除失败')
      return false
    }
  }

  // 加载更多回复
  const loadMoreReplies = async (loadData) => {
    const { comment } = loadData
    
    try {
      loading.value = true
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 模拟更多回复数据
      const moreReplies = generateMockReplies(3)
      
      // 找到对应的主评论并添加回复
      const mainIndex = comments.value.findIndex(c => c.id === comment.id)
      if (mainIndex !== -1) {
        comments.value[mainIndex].replies.push(...moreReplies)
        comments.value[mainIndex].hasMoreReplies = comments.value[mainIndex].replies.length < comments.value[mainIndex].totalRepliesCount
      }
      
      return true
    } catch (error) {
      console.error('加载更多回复失败:', error)
      showFailToast('加载失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 生成模拟评论数据
  const generateMockComments = (page, limit) => {
    const mockUsers = [
      { id: 'user1', nickname: 'Halifax', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      { id: 'user2', nickname: '用户826193207', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      { id: 'user3', nickname: '小明', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      { id: 'user4', nickname: '小红', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      { id: 'user5', nickname: '技术达人', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' }
    ]
    
    const mockContents = [
      '当前服务器资源紧张，为避免对您造业务影响，我们已暂停 API 服务充值。存量充值金额可继续调用，敬请谅解！',
      '用不了，也充不了钱了呢',
      '是的，被攻击挂了',
      '一直给我提示：The server is busy. Please try again later.',
      '这个功能很实用，感谢分享！',
      '有没有更详细的教程？',
      '我也遇到了同样的问题',
      '已解决，谢谢！'
    ]
    
    const comments = []
    const startIndex = (page - 1) * limit
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      const content = mockContents[Math.floor(Math.random() * mockContents.length)]
      
      const comment = {
        id: `comment_${startIndex + i + 1}`,
        author: user,
        content,
        createTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        likesCount: Math.floor(Math.random() * 20),
        isLiked: Math.random() > 0.7,
        replies: [],
        hasMoreReplies: false,
        totalRepliesCount: 0
      }
      
      // 随机生成一些回复
      if (Math.random() > 0.6) {
        const replyCount = Math.floor(Math.random() * 3) + 1
        comment.replies = generateMockReplies(replyCount)
        comment.totalRepliesCount = comment.replies.length
        
        // 随机决定是否有更多回复
        if (Math.random() > 0.8) {
          comment.hasMoreReplies = true
          comment.totalRepliesCount += Math.floor(Math.random() * 5) + 1
        }
      }
      
      comments.push(comment)
    }
    
    return comments
  }

  // 生成模拟回复数据
  const generateMockReplies = (count) => {
    const mockUsers = [
      { id: 'user1', nickname: 'Halifax', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      { id: 'user2', nickname: '用户826193207', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      { id: 'user3', nickname: '小明', avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' }
    ]
    
    const replyContents = [
      '是的，被攻击挂了',
      '我也想去！',
      '同感',
      '谢谢分享',
      '有道理',
      '学到了'
    ]
    
    const replies = []
    
    for (let i = 0; i < count; i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      const content = replyContents[Math.floor(Math.random() * replyContents.length)]
      
      const reply = {
        id: `reply_${Date.now()}_${i}`,
        author: user,
        content,
        createTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
        likesCount: Math.floor(Math.random() * 10),
        isLiked: Math.random() > 0.8,
        replyTo: Math.random() > 0.5 ? mockUsers[0] : null,
        subReplies: []
      }
      
      // 随机生成一些三级回复
      if (Math.random() > 0.8) {
        const subReplyCount = Math.floor(Math.random() * 2) + 1
        for (let j = 0; j < subReplyCount; j++) {
          const subUser = mockUsers[Math.floor(Math.random() * mockUsers.length)]
          const subReply = {
            id: `subreply_${Date.now()}_${i}_${j}`,
            author: subUser,
            content: replyContents[Math.floor(Math.random() * replyContents.length)],
            createTime: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
            likesCount: Math.floor(Math.random() * 5),
            isLiked: Math.random() > 0.9,
            replyTo: reply.author
          }
          reply.subReplies.push(subReply)
        }
      }
      
      replies.push(reply)
    }
    
    return replies
  }

  // 刷新评论列表
  const refreshComments = () => {
    return getComments(true)
  }

  // 加载更多评论
  const loadMoreComments = () => {
    if (hasMore.value && !loading.value) {
      return getComments(false)
    }
    return Promise.resolve(false)
  }

  return {
    // 状态
    comments,
    loading,
    submitting,
    totalCount,
    hasMore,
    canComment,
    
    // 方法
    getComments,
    refreshComments,
    loadMoreComments,
    submitComment,
    likeComment,
    deleteComment,
    loadMoreReplies
  }
}