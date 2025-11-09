/**
 * 浏览历史记录使用示例
 * 
 * 这个文件展示了如何在各个页面中使用浏览历史记录功能
 */

import { addViewHistory } from '../utils/viewHistory'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

// ============================================
// 示例 1: 在笔记详情页中记录访问历史
// ============================================
export const useNoteDetailHistory = () => {
  const route = useRoute()
  
  onMounted(() => {
    // 假设你已经获取了笔记详情数据
    const noteData = {
      id: route.params.id,
      title: '笔记标题',
      content: '笔记内容摘要...'
    }
    
    addViewHistory({
      type: 'note',
      title: noteData.title,
      description: noteData.content.substring(0, 50) + '...',
      path: `/note/${noteData.id}`
    })
  })
}

// ============================================
// 示例 2: 在帖子详情页中记录访问历史
// ============================================
export const usePostDetailHistory = () => {
  const route = useRoute()
  
  onMounted(() => {
    const postData = {
      id: route.params.id,
      title: '帖子标题',
      excerpt: '帖子摘要内容...'
    }
    
    addViewHistory({
      type: 'post',
      title: postData.title,
      description: postData.excerpt,
      path: `/post/${postData.id}`
    })
  })
}

// ============================================
// 示例 3: 在用户主页中记录访问历史
// ============================================
export const useUserDetailHistory = () => {
  const route = useRoute()
  
  onMounted(() => {
    const userData = {
      id: route.params.id,
      nickname: '用户昵称',
      followersCount: 1234,
      followingCount: 567
    }
    
    addViewHistory({
      type: 'user',
      title: userData.nickname,
      description: `关注: ${userData.followingCount} | 粉丝: ${userData.followersCount}`,
      path: `/user/${userData.id}`
    })
  })
}

// ============================================
// 示例 4: 在分类页面中记录访问历史
// ============================================
export const useCategoryHistory = () => {
  const route = useRoute()
  
  onMounted(() => {
    const categoryData = {
      id: route.query.id,
      name: '分类名称',
      description: '分类描述'
    }
    
    addViewHistory({
      type: 'category',
      title: categoryData.name,
      description: categoryData.description,
      path: `/category?id=${categoryData.id}`
    })
  })
}

// ============================================
// 示例 5: 在搜索页面中记录搜索历史
// ============================================
export const useSearchHistory = (keyword: string) => {
  addViewHistory({
    type: 'search',
    title: `搜索: ${keyword}`,
    description: `搜索关键词: ${keyword}`,
    path: `/search?q=${encodeURIComponent(keyword)}`
  })
}

// ============================================
// 示例 6: 通用的页面访问记录
// ============================================
export const recordPageView = (
  type: 'note' | 'post' | 'user' | 'category' | 'search' | 'other',
  title: string,
  path: string,
  description?: string
) => {
  addViewHistory({
    type,
    title,
    description,
    path
  })
}

// ============================================
// 在 Vue 组件中的完整使用示例
// ============================================
/*
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { addViewHistory } from '@/utils/viewHistory'

const route = useRoute()
const noteDetail = ref(null)

// 获取笔记详情
const fetchNoteDetail = async () => {
  // 模拟 API 调用
  const response = await api.getNoteDetail(route.params.id)
  noteDetail.value = response.data
  
  // 记录访问历史
  addViewHistory({
    type: 'note',
    title: response.data.title,
    description: response.data.content.substring(0, 100),
    path: route.fullPath
  })
}

onMounted(() => {
  fetchNoteDetail()
})
</script>
*/

// ============================================
// 最佳实践建议
// ============================================
/*
1. 在页面加载完成后记录访问历史
2. 确保有足够的页面信息（标题、描述等）再记录
3. 使用准确的页面类型分类
4. 提供有意义的描述信息
5. 路径应该包含必要的参数，以便能够正确跳转回该页面
6. 避免在同一个页面重复记录（工具函数会自动处理）
*/
