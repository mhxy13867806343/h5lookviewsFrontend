import { useUserStore } from '@/stores/store'
import { showSuccessToast, showFailToast } from 'vant'
import { userApi } from '@/api'

// 类型定义
interface LoginCredentials {
  username: string
  password: string
}

interface UserInfo {
  id: number
  username: string
  email: string
}

export function useAuth() {
  const userStore = useUserStore()
  const router = useRouter()

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const userInfo = computed(() => userStore.userInfo)

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const res = await userApi.login({
        username: credentials.username,
        password: credentials.password
      })

      // 设置用户信息与 token
      userStore.setToken(res.token)
      userStore.setUserInfo({
        id: res.user.id,
        nickname: res.user.nickname,
        avatar: res.user.avatar,
        email: res.user.email,
        phone: res.user.phone,
        isVip: res.user.isVip
      })

      showSuccessToast('登录成功')
      return true
    } catch (error) {
      showFailToast('登录失败，请检查账号或网络')
      return false
    }
  }

  const register = async (userData: { username: string; password: string; confirmPassword: string; email?: string; phone?: string }): Promise<boolean> => {
    try {
      await userApi.register({
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        email: userData.email,
        phone: userData.phone
      })
      showSuccessToast('注册成功，请登录')
      router.push('/login')
      return true
    } catch (error) {
      showFailToast('注册失败，请检查信息或网络')
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

// 已移除模拟 API 调用