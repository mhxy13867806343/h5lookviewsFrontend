import { defineStore } from 'pinia'
import dayjs from 'dayjs'

// 类型定义
interface UserInfo {
  id: string | number
  nickname: string
  avatar: string
  email?: string
  phone?: string
  isVip?: boolean
}

interface UserState {
  userInfo: UserInfo | null
  token: string
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
    isLoggedIn: false
  }),

  actions: {
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      this.isLoggedIn = true
    },

    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    logout() {
      this.userInfo = null
      this.token = ''
      this.isLoggedIn = false
      localStorage.removeItem('token')
    }
  }
})

// 购物车相关类型
interface CartItem {
  id: string | number
  name: string
  price: number
  quantity: number
  image?: string
  [key: string]: any
}

interface CartState {
  cartItems: CartItem[]
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cartItems: []
  }),

  getters: {
    cartCount: (state): number => state.cartItems.reduce((total, item) => total + item.quantity, 0),
    totalPrice: (state): number => state.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  },

  actions: {
    addToCart(product: Omit<CartItem, 'quantity'>) {
      const existingItem = this.cartItems.find(item => item.id === product.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.cartItems.push({ ...product, quantity: 1 })
      }
    },

    removeFromCart(productId: string | number) {
      const index = this.cartItems.findIndex(item => item.id === productId)
      if (index > -1) {
        this.cartItems.splice(index, 1)
      }
    },

    updateQuantity(productId: string | number, quantity: number) {
      const item = this.cartItems.find(item => item.id === productId)
      if (item) {
        item.quantity = quantity
      }
    }
  }
})