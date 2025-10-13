<template>
  <div class="user-detail">
    <van-nav-bar 
      :title="isCurrentUser ? '我的主页' : '用户主页'" 
      left-arrow 
      @click-left="handleBack"
    >
      <template #right>
        <van-icon 
          v-if="!isCurrentUser" 
          name="ellipsis" 
          @click="showActionSheet = true" 
        />
      </template>
    </van-nav-bar>

    <div class="user-detail-content">
      <!-- 用户信息卡片 -->
      <div class="user-info-card">
        <div class="user-header">
          <div class="avatar-section">
            <van-image
              :src="userInfo&&userInfo.avatar"
              round
              width="80"
              height="80"
              fit="cover"
              @click="previewAvatar"
            />
            <div v-if="userInfo.isVip" class="vip-badge">VIP</div>
          </div>
          
          <div class="user-basic-info">
            <div class="username-row">
              <h2>{{ userInfo.nickname }}</h2>
              <van-tag v-if="userInfo.gender === 'male'" type="primary" size="mini">♂</van-tag>
              <van-tag v-if="userInfo.gender === 'female'" type="danger" size="mini">♀</van-tag>
            </div>
            <p class="user-id">ID: {{ userInfo.id }}</p>
            <p class="signature">{{ userInfo.signature || '这个人很懒，什么都没留下~' }}</p>
          </div>
          
          <div class="action-buttons" v-if="!isCurrentUser">
            <van-button 
              :type="isFollowed ? 'default' : 'primary'" 
              size="small"
              @click="handleFollow"
              :loading="followLoading"
            >
              {{ isFollowed ? '已关注' : '关注' }}
            </van-button>
            <van-button 
              type="default" 
              size="small" 
              icon="chat-o"
              @click="handleChat"
            >
              私信
            </van-button>
          </div>
        </div>
        
        <!-- 用户统计 -->
        <div class="user-stats">
          <div class="stat-item" @click="showFollowList('followers')">
            <div class="stat-number">{{ userInfo.followersCount }}</div>
            <div class="stat-label">粉丝</div>
          </div>
          <div class="stat-item" @click="showFollowList('following')">
            <div class="stat-number">{{ userInfo.followingCount }}</div>
            <div class="stat-label">关注</div>
          </div>
          <div class="stat-item" @click="showPostList">
            <div class="stat-number">{{ userInfo.postsCount }}</div>
            <div class="stat-label">动态</div>
          </div>
          <div class="stat-item" @click="showLikesList">
            <div class="stat-number">{{ userInfo.likesCount }}</div>
            <div class="stat-label">获赞</div>
          </div>
        </div>
        
        <!-- 用户标签 -->
        <div class="user-tags" v-if="userInfo.tags && userInfo.tags.length">
          <div class="tags-title">个人标签</div>
          <div class="tags-list">
            <van-tag 
              v-for="tag in userInfo.tags" 
              :key="tag"
              type="primary"
              plain
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </van-tag>
          </div>
        </div>
      </div>
      
      <!-- 内容切换标签 -->
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="动态" name="posts">
          <div class="posts-list">
            <div 
              v-for="post in posts" 
              :key="post.id" 
              class="post-item"
              @click="viewPost(post)"
            >
              <div class="post-header">
                <div class="post-time">{{ formatTime(post.createTime) }}</div>
                <van-icon name="ellipsis" @click.stop="showPostActions(post)" />
              </div>
              
              <div class="post-content">
                <p>{{ post.content }}</p>
                <div v-if="post.images && post.images.length" class="post-images">
                  <van-image
                    v-for="(image, index) in post.images.slice(0, 3)"
                    :key="index"
                    :src="image"
                    width="60"
                    height="60"
                    fit="cover"
                    @click.stop="previewImages(post.images, index)"
                  />
                  <div v-if="post.images.length > 3" class="more-images">
                    +{{ post.images.length - 3 }}
                  </div>
                </div>
              </div>
              
              <div class="post-actions">
                <div class="action-item" @click.stop="handleLike(post)">
                  <van-icon 
                    :name="post.isLiked ? 'good-job' : 'good-job-o'" 
                    :color="post.isLiked ? '#ff976a' : '#969799'"
                  />
                  <span :class="{ 'liked': post.isLiked }">{{ post.likesCount || '点赞' }}</span>
                </div>
                <div class="action-item" @click.stop="handleComment(post)">
                  <van-icon name="comment-o" />
                  <span>{{ post.commentsCount || '评论' }}</span>
                </div>
                <div class="action-item" @click.stop="handleCollect(post)">
                  <van-icon 
                    :name="post.isCollected ? 'star' : 'star-o'"
                    :color="post.isCollected ? '#ffb300' : '#969799'"
                  />
                  <span :class="{ 'collected': post.isCollected }">{{ post.collectsCount || '收藏' }}</span>
                </div>
                <div class="action-item" @click.stop="handleShare(post)">
                  <van-icon name="share-o" />
                  <span>分享</span>
                </div>
              </div>
            </div>
            
            <!-- 加载更多 -->
            <div v-if="hasMorePosts" class="load-more">
              <van-button 
                type="default" 
                size="small" 
                :loading="loadingPosts"
                @click="loadMorePosts"
              >
                加载更多
              </van-button>
            </div>
            
            <!-- 空状态 -->
            <van-empty v-if="!posts.length && !loadingPosts" description="暂无动态" />
          </div>
        </van-tab>
        
        <van-tab title="收藏" name="collections">
          <div class="collections-list">
            <div 
              v-for="item in collections" 
              :key="item.id" 
              class="collection-item"
              @click="viewCollection(item)"
            >
              <van-image
                :src="item.cover"
                width="60"
                height="60"
                fit="cover"
              />
              <div class="collection-info">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
                <div class="collection-meta">
                  <span>{{ item.itemsCount }}个内容</span>
                  <span>{{ formatTime(item.updateTime) }}</span>
                </div>
              </div>
            </div>
            
            <van-empty v-if="!collections.length" description="暂无收藏" />
          </div>
        </van-tab>
        
        <van-tab title="点赞" name="likes">
          <div class="likes-list">
            <div 
              v-for="item in likes" 
              :key="item.id" 
              class="like-item"
              @click="viewLikedPost(item)"
            >
              <div class="like-content">
                <p>{{ item.content }}</p>
                <div class="like-meta">
                  <span>@{{ item.author }}</span>
                  <span>{{ formatTime(item.likeTime) }}</span>
                </div>
              </div>
              <van-image
                v-if="item.cover"
                :src="item.cover"
                width="60"
                height="60"
                fit="cover"
              />
            </div>
            
            <van-empty v-if="!likes.length" description="暂无点赞记录" />
          </div>
        </van-tab>
      </van-tabs>
    </div>
    
    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="onActionSelect"
    />
    
    <!-- 评论弹窗 -->
    <van-popup v-model:show="showCommentPopup" position="bottom" :style="{ height: '70%' }">
      <div class="comment-popup">
        <div class="comment-header">
          <span>评论</span>
          <van-icon name="cross" @click="showCommentPopup = false" />
        </div>
        
        <div class="comments-list">
          <div v-for="comment in currentComments" :key="comment.id" class="comment-item">
            <van-image
              :src="comment.avatar"
              round
              width="32"
              height="32"
              fit="cover"
            />
            <div class="comment-content">
              <div class="comment-user">{{ comment.nickname }}</div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-meta">
                <span>{{ formatTime(comment.createTime) }}</span>
                <span @click="likeComment(comment)" :class="{ 'liked': comment.isLiked }">
                  <van-icon name="good-job-o" />
                  {{ comment.likesCount || '' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="comment-input">
          <van-field
            v-model="commentText"
            placeholder="说点什么..."
            type="textarea"
            rows="2"
          />
          <van-button 
            type="primary" 
            size="small"
            @click="submitComment"
            :disabled="!commentText.trim()"
          >
            发送
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showSuccessToast, showConfirmDialog, showImagePreview } from 'vant'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userId = route.params.id
const isCurrentUser = computed(() => userId === userStore.user?.id)

// 响应式数据
const userInfo = ref({})
const isFollowed = ref(false)
const followLoading = ref(false)
const activeTab = ref('posts')
const posts = ref([])
const collections = ref([])
const likes = ref([])
const hasMorePosts = ref(true)
const loadingPosts = ref(false)
const showActionSheet = ref(false)
const showCommentPopup = ref(false)
const currentComments = ref([])
const commentText = ref('')
const currentPost = ref(null)

// 操作菜单
const actionSheetActions = [
  { name: '举报用户', value: 'report' },
  { name: '拉黑用户', value: 'block' },
  { name: '取消', value: 'cancel' },
]

// 方法
const handleBack = () => {
  router.back()
}

const previewAvatar = () => {
  showImagePreview([userInfo.value.avatar])
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  followLoading.value = true
  try {
    // 模拟关注/取消关注API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isFollowed.value) {
      isFollowed.value = false
      userInfo.value.followersCount--
      showSuccessToast('已取消关注')
    } else {
      isFollowed.value = true
      userInfo.value.followersCount++
      showSuccessToast('关注成功')
    }
  } finally {
    followLoading.value = false
  }
}

const handleChat = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push(`/chat/${userId}`)
}

const showFollowList = (type) => {
  showSuccessToast(`查看${type === 'followers' ? '粉丝' : '关注'}列表`)
}

const showPostList = () => {
  activeTab.value = 'posts'
}

const showLikesList = () => {
  activeTab.value = 'likes'
}

const viewPost = (post) => {
  router.push(`/post/${post.id}`)
}

const showPostActions = (post) => {
  showSuccessToast('动态操作菜单')
}

const previewImages = (images, index) => {
  showImagePreview({
    images,
    startPosition: index,
  })
}

const handleLike = async (post) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    if (post.isLiked) {
      post.isLiked = false
      post.likesCount = Math.max(0, (post.likesCount || 1) - 1)
      showSuccessToast('已取消点赞')
    } else {
      post.isLiked = true
      post.likesCount = (post.likesCount || 0) + 1
      showSuccessToast('点赞成功')
    }
  } catch (error) {
    showSuccessToast('操作失败')
  }
}

const handleComment = (post) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  currentPost.value = post
  loadComments(post.id)
  showCommentPopup.value = true
}

const handleCollect = async (post) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    if (post.isCollected) {
      post.isCollected = false
      post.collectsCount = Math.max(0, (post.collectsCount || 1) - 1)
      showSuccessToast('已取消收藏')
    } else {
      post.isCollected = true
      post.collectsCount = (post.collectsCount || 0) + 1
      showSuccessToast('收藏成功')
    }
  } catch (error) {
    showSuccessToast('操作失败')
  }
}

const handleShare = (post) => {
  showSuccessToast('分享功能开发中')
}

const loadMorePosts = async () => {
  if (loadingPosts.value) return
  
  loadingPosts.value = true
  try {
    // 模拟加载更多数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const morePosts = [
      {
        id: Date.now() + Math.random(),
        content: '这是加载的更多动态内容...',
        createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        likesCount: Math.floor(Math.random() * 100),
        commentsCount: Math.floor(Math.random() * 50),
        collectsCount: Math.floor(Math.random() * 30),
        isLiked: Math.random() > 0.5,
        isCollected: Math.random() > 0.7,
      }
    ]
    
    posts.value.push(...morePosts)
    
    // 模拟没有更多数据
    if (posts.value.length >= 10) {
      hasMorePosts.value = false
    }
  } finally {
    loadingPosts.value = false
  }
}

const loadComments = async (postId) => {
  // 模拟加载评论数据
  currentComments.value = [
    {
      id: 1,
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      nickname: '用户A',
      content: '很棒的分享！',
      createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likesCount: 5,
      isLiked: false
    },
    {
      id: 2,
      avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
      nickname: '用户B',
      content: '学到了很多，谢谢分享',
      createTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likesCount: 3,
      isLiked: true
    }
  ]
}

const submitComment = async () => {
  if (!commentText.value.trim()) return
  
  try {
    // 模拟发送评论
    const newComment = {
      id: Date.now(),
      avatar: userStore.user&&userStore.user.avatar,
      nickname: userStore.user&&userStore.user.nickname,
      content: commentText.value,
      createTime: new Date(),
      likesCount: 0,
      isLiked: false
    }
    
    currentComments.value.unshift(newComment)
    commentText.value = ''
    
    // 更新动态的评论数
    if (currentPost.value) {
      currentPost.value.commentsCount = (currentPost.value.commentsCount || 0) + 1
    }
    
    showSuccessToast('评论成功')
  } catch (error) {
    showSuccessToast('评论失败')
  }
}

const likeComment = async (comment) => {
  if (!userStore.isLoggedIn) return
  
  try {
    if (comment.isLiked) {
      comment.isLiked = false
      comment.likesCount = Math.max(0, comment.likesCount - 1)
    } else {
      comment.isLiked = true
      comment.likesCount = (comment.likesCount || 0) + 1
    }
  } catch (error) {
    showSuccessToast('操作失败')
  }
}

const viewCollection = (item) => {
  showSuccessToast('查看收藏详情')
}

const viewLikedPost = (item) => {
  showSuccessToast('查看点赞的动态')
}

const onActionSelect = (action) => {
  showActionSheet.value = false
  
  switch (action.value) {
    case 'report':
      showSuccessToast('举报功能开发中')
      break
    case 'block':
      showConfirmDialog({
        title: '确认拉黑',
        message: '拉黑后将无法查看该用户的动态',
      }).then(() => {
        showSuccessToast('已拉黑该用户')
      })
      break
  }
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 初始化数据
const initUserData = () => {
  // 模拟用户数据
  userInfo.value = {
    id: userId || '12345',
    nickname: isCurrentUser.value ? userStore.user?.nickname || '我的昵称' : '示例用户',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    signature: '热爱生活，热爱分享 🌟',
    gender: 'female',
    isVip: true,
    followersCount: 1234,
    followingCount: 567,
    postsCount: 89,
    likesCount: 2345,
    tags: ['摄影爱好者', '美食达人', '旅行家', '读书人']
  }
  
  // 模拟动态数据
  posts.value = [
    {
      id: 1,
      content: '今天去了一个很美的地方，风景如画！分享给大家看看 ✨',
      images: [
        'https://img.yzcdn.cn/vant/cat.jpeg',
        'https://img.yzcdn.cn/vant/cat.jpeg',
        'https://img.yzcdn.cn/vant/cat.jpeg'
      ],
      createTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likesCount: 45,
      commentsCount: 12,
      collectsCount: 8,
      isLiked: false,
      isCollected: true
    },
    {
      id: 2,
      content: '分享一个很棒的读书心得，这本书真的很值得推荐！',
      createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      likesCount: 23,
      commentsCount: 5,
      collectsCount: 3,
      isLiked: true,
      isCollected: false
    },
    {
      id: 3,
      content: '做了一道新菜，味道还不错呢～',
      images: ['https://img.yzcdn.cn/vant/cat.jpeg'],
      createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      likesCount: 67,
      commentsCount: 18,
      collectsCount: 15,
      isLiked: false,
      isCollected: false
    }
  ]
  
  // 模拟收藏数据
  collections.value = [
    {
      id: 1,
      title: '美食收藏',
      description: '收集了各种美食制作方法',
      cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
      itemsCount: 23,
      updateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      title: '旅行攻略',
      description: '精选旅行目的地和攻略',
      cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
      itemsCount: 15,
      updateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ]
  
  // 模拟点赞数据
  likes.value = [
    {
      id: 1,
      content: '很棒的摄影作品，构图很有意思',
      author: '摄影师小王',
      cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
      likeTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      content: '这个地方我也去过，确实很美！',
      author: '旅行达人',
      likeTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ]
  
  // 模拟关注状态
  if (!isCurrentUser.value) {
    isFollowed.value = Math.random() > 0.5
  }
}

onMounted(() => {
  initUserData()
})
</script>

<style lang="scss" scoped>
.user-detail {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.user-detail-content {
  padding-bottom: 60px;
}

.user-info-card {
  background: var(--background-secondary);
  margin: var(--spacing-sm);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  
  .user-header {
    display: flex;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
    
    .avatar-section {
      position: relative;
      margin-right: var(--spacing-md);
      
      .vip-badge {
        position: absolute;
        bottom: -5px;
        right: -5px;
        background: linear-gradient(45deg, #ffd700, #ffb300);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: bold;
      }
    }
    
    .user-basic-info {
      flex: 1;
      
      .username-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-xs);
        
        h2 {
          margin: 0;
          font-size: var(--font-size-lg);
          color: var(--text-primary);
        }
      }
      
      .user-id {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }
      
      .signature {
        margin: 0;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.4;
      }
    }
    
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      
      .van-button {
        min-width: 60px;
      }
    }
  }
  
  .user-stats {
    display: flex;
    justify-content: space-around;
    padding: var(--spacing-md) 0;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-md);
    
    .stat-item {
      text-align: center;
      cursor: pointer;
      
      .stat-number {
        font-size: var(--font-size-xl);
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: var(--spacing-xs);
      }
      
      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
  
  .user-tags {
    margin-top: var(--spacing-md);
    
    .tags-title {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }
    
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
      
      .tag-item {
        margin: 0;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 16px;
        padding: 4px 12px;
        font-size: 12px;
        
        &.van-tag--plain {
          background: rgba(64, 158, 255, 0.1);
          color: var(--primary-color);
          border: 1px solid rgba(64, 158, 255, 0.3);
        }
      }
    }
  }
}

.posts-list, .collections-list, .likes-list {
  padding: var(--spacing-sm);
}

.post-item {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  
  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    
    .post-time {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
    
    .van-icon {
      cursor: pointer;
      color: var(--text-secondary);
    }
  }
  
  .post-content {
    margin-bottom: var(--spacing-md);
    
    p {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
      line-height: 1.5;
    }
    
    .post-images {
      display: flex;
      gap: var(--spacing-xs);
      position: relative;
      
      .van-image {
        border-radius: var(--border-radius-sm);
      }
      
      .more-images {
        position: absolute;
        top: 0;
        right: 0;
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-sm);
      }
    }
  }
  
  .post-actions {
    display: flex;
    justify-content: space-around;
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
    
    .action-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      cursor: pointer;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      
      &:hover {
        opacity: 0.8;
      }
      
      span.liked {
        color: #ff976a;
      }
      
      span.collected {
        color: #ffb300;
      }
    }
  }
}

.collection-item, .like-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  
  .collection-info, .like-content {
    flex: 1;
    
    h4 {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--text-primary);
    }
    
    p {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
    
    .collection-meta, .like-meta {
      display: flex;
      gap: var(--spacing-md);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }
  }
}

.load-more {
  text-align: center;
  padding: var(--spacing-lg);
}

.comment-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
  }
  
  .comments-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
    
    .comment-item {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
      
      .comment-content {
        flex: 1;
        
        .comment-user {
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          font-weight: 500;
          margin-bottom: var(--spacing-xs);
        }
        
        .comment-text {
          color: var(--text-primary);
          line-height: 1.4;
          margin-bottom: var(--spacing-xs);
        }
        
        .comment-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          
          span.liked {
            color: #ff976a;
          }
        }
      }
    }
  }
  
  .comment-input {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    align-items: flex-end;
    
    .van-field {
      flex: 1;
    }
  }
}
</style>