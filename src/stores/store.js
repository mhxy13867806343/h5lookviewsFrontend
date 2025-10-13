import { defineStore } from 'pinia'
import dayjs from 'dayjs'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
    isLoggedIn: false
  }),

  actions: {
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.isLoggedIn = true
    },

    setToken(token) {
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

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: []
  }),

  getters: {
    cartCount: (state) => state.cartItems.reduce((total, item) => total + item.quantity, 0),
    totalPrice: (state) => state.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  },

  actions: {
    addToCart(product) {
      const existingItem = this.cartItems.find(item => item.id === product.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.cartItems.push({ ...product, quantity: 1 })
      }
    },

    removeFromCart(productId) {
      const index = this.cartItems.findIndex(item => item.id === productId)
      if (index > -1) {
        this.cartItems.splice(index, 1)
      }
    },

    updateQuantity(productId, quantity) {
      const item = this.cartItems.find(item => item.id === productId)
      if (item) {
        item.quantity = quantity
      }
    }
  }
})