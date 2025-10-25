import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { showToast } from 'vant'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 添加token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示loading
    showToast({
      type: 'loading',
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 隐藏loading
    showToast.clear()
    
    const { data } = response
    
    // 根据业务状态码处理
    if (data.code === 200) {
      return data.data
    } else if (data.code === 401) {
      // token过期，跳转登录
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期'))
    } else {
      showToast({
        type: 'fail',
        message: data.message || '请求失败'
      })
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    // 隐藏loading
    showToast.clear()
    
    let message = '网络错误'
    
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `连接错误${status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接异常'
    }
    
    showToast({
      type: 'fail',
      message
    })
    
    console.error('响应错误:', error)
    return Promise.reject(error)
  }
)

export default request