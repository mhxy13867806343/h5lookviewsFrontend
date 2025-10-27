<template>
  <div class="register">
    <van-nav-bar
      title="注册"
      left-text="返回"
      left-arrow
      @click-left="$router.go(-1)"
    />
    
    <div class="register-container">
      <div class="logo">
        <van-icon name="add-square" size="60" color="#1989fa" />
        <h2>创建账号</h2>
      </div>

      <van-form @submit="onSubmit">
        <van-field
          v-model="form.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[
            { required: true, message: '请填写用户名' },
            { min: 3, message: '用户名至少3个字符' }
          ]"
          left-icon="user-o"
        />
        <van-field
          v-model="form.email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[
            { required: true, message: '请填写邮箱' },
            { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式' }
          ]"
          left-icon="envelop-o"
        />
        <van-field
          v-model="form.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[
            { required: true, message: '请填写手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]"
          left-icon="phone-o"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[
            { required: true, message: '请填写密码' },
            { min: 6, message: '密码至少6位' }
          ]"
          left-icon="lock"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validatePassword, message: '两次密码输入不一致' }
          ]"
          left-icon="lock"
        />
        
        <div class="agreement">
          <van-checkbox v-model="agreeTerms">
            我已阅读并同意
            <a href="#" @click.prevent="showTerms">《用户协议》</a>
            和
            <a href="#" @click.prevent="showPrivacy">《隐私政策》</a>
          </van-checkbox>
        </div>

        <div class="register-actions">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            :disabled="!agreeTerms"
          >
            注册
          </van-button>
          
          <div class="login-link">
            已有账号？
            <router-link to="/login">立即登录</router-link>
          </div>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '../stores/store'
import { showSuccessToast, showFailToast } from 'vant'

// 定义表单类型
interface RegisterForm {
  username: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

// 响应式数据
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const loading = ref<boolean>(false)
const agreeTerms = ref<boolean>(false)

const form = ref<RegisterForm>({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// 方法
const validatePassword = (value: string): boolean => {
  return value === form.value.password
}

const onSubmit = async (values: RegisterForm): Promise<void> => {
  if (!agreeTerms.value) {
    showFailToast('请先同意用户协议和隐私政策')
    return
  }

  loading.value = true
  
  // 模拟注册请求
  setTimeout(() => {
    // 模拟注册成功
    userStore.setUserInfo({
      id: Date.now(),
      username: values.username,
      email: values.email,
      phone: values.phone
    })
    userStore.setToken('mock-token-' + Date.now())
    
    showSuccessToast('注册成功')
    router.push('/home')
    loading.value = false
  }, 1500)
}

const showTerms = (): void => {
  showSuccessToast('用户协议页面开发中')
}

const showPrivacy = (): void => {
  showSuccessToast('隐私政策页面开发中')
}
</script>

<style lang="scss" scoped>
.register {
  background-color: var(--background-primary);
  min-height: 100%;
  padding-bottom: var(--spacing-xl);
}

.register-container {
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

.agreement {
  margin: var(--spacing-lg) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  
  a {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.register-actions {
  margin-top: var(--spacing-xl);
}

.login-link {
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
</style>