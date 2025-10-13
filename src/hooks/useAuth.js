import { computed } from 'vue'
import { useUserStore } from '@/stores/store.js'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'

export function useAuth() {
  const userStore = useUserStore()
  const router = useRouter()

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const userInfo = computed(() => userStore.userInfo)

  const login = async (credentials) => {
    try {
      // 模拟登录API调用
      await simulateApiCall(1000)
      
      if (credentials.username && credentials.password) {
        userStore.setUserInfo({
          id: Date.now(),
          username: credentials.username,
          email: `${credentials.username}@example.com`
        })
        userStore.setToken('mock-token-' + Date.now())
        
        showSuccessToast('登录成功')
        return true
      } else {
        showFailToast('用户名或密码错误')
        return false
      }
    } catch (error) {
      showFailToast('登录失败，请重试')
      return false
    }
  }

  const register = async (userData) => {
    try {
      // 模拟注册API调用
      await simulateApiCall(1500)
      
      userStore.setUserInfo({
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        phone: userData.phone
      })
      userStore.setToken('mock-token-' + Date.now())
      
      showSuccessToast('注册成功')
      return true
    } catch (error) {
      showFailToast('注册失败，请重试')
      return false
    }
  }

  const logout = () => {
    userStore.logout()
    showSuccessToast('已退出登录')
    router.push('/home')
  }

  const requireAuth = () => {
    if (!isLoggedIn.value) {
      router.push('/login')
      return false
    }
    return true
  }

  return {
    isLoggedIn,
    userInfo,
    login,
    register,
    logout,
    requireAuth
  }
}

// 模拟API调用
function simulateApiCall(delay) {
  return new Promise(resolve => setTimeout(resolve, delay))
}