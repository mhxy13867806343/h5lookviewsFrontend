<template>
  <div class="login">
    <van-nav-bar
      title="登录"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />
    
    <div class="login-container">
      <div class="logo">
        <van-icon name="shop-o" size="60" color="#1989fa" />
        <h2>欢迎回来</h2>
      </div>

      <van-form @submit="onSubmit">
        <van-field
          v-model="form.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请填写用户名' }]"
          left-icon="user-o"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请填写密码' }]"
          left-icon="lock"
        />
        
        <div class="login-options">
          <van-checkbox v-model="rememberMe">记住我</van-checkbox>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <div class="login-actions">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            登录
          </van-button>
          
          <div class="register-link">
            还没有账号？
            <router-link to="/register">立即注册</router-link>
          </div>
        </div>
      </van-form>

      <div class="other-login">
        <van-divider>其他登录方式</van-divider>
        <div class="other-login-buttons">
          <van-button icon="wechat" type="success" @click="wechatLogin">
            微信登录
          </van-button>
          <van-button icon="qq" type="warning" @click="qqLogin">
            QQ登录
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/store'
import { showSuccessToast, showFailToast } from 'vant'

// 定义表单类型
interface LoginForm {
  username: string
  password: string
}

// 响应式数据
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const loading = ref<boolean>(false)
const rememberMe = ref<boolean>(false)

const form = ref<LoginForm>({
  username: '',
  password: ''
})

// 方法
const onSubmit = async (values: LoginForm): Promise<void> => {
  loading.value = true
  
  // 模拟登录请求
  setTimeout(() => {
    if (values.username && values.password) {
      // 模拟登录成功
      userStore.setUserInfo({
        id: 1,
        username: values.username,
        email: `${values.username}@example.com`
      })
      userStore.setToken('mock-token-12345')
      
      showSuccessToast('登录成功')
      router.push('/home')
    } else {
      showFailToast('用户名或密码错误')
    }
    loading.value = false
  }, 1000)
}

const wechatLogin = (): void => {
  showSuccessToast('微信登录功能开发中')
}

const qqLogin = (): void => {
  showSuccessToast('QQ登录功能开发中')
}
</script>

<style lang="scss" scoped>
.login {
  background-color: var(--background-primary);
  min-height: 100%;
  padding-bottom: var(--spacing-xl);
}

.login-container {
  padding: var(--spacing-xl) var(--spacing-lg);
}

.logo {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  
  h2 {
    margin-top: var(--spacing-lg);
    color: var(--text-primary);
    font-size: var(--font-size-xxl);
    font-weight: 600;
  }
}

.login-options {
  @include flex-between;
  margin: var(--spacing-lg) 0;
}

.forgot-password {
  color: var(--primary-color);
  text-decoration: none;
  font-size: var(--font-size-sm);
  
  &:hover {
    text-decoration: underline;
  }
}

.login-actions {
  margin-top: var(--spacing-xl);
}

.register-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  
  a {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.other-login {
  margin-top: var(--spacing-xxl);
}

.other-login-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
</style>