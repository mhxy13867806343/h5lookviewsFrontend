import { computed } from 'vue'
import { useCartStore } from '@/stores/store.js'
import { showSuccessToast } from 'vant'

export function useCart() {
  const cartStore = useCartStore()

  const cartCount = computed(() => cartStore.cartCount)
  const totalPrice = computed(() => cartStore.totalPrice)

  const addToCart = (product) => {
    cartStore.addToCart(product)
    showSuccessToast('已加入购物车')
  }

  const removeFromCart = (productId) => {
    cartStore.removeFromCart(productId)
    showSuccessToast('已移除商品')
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    cartStore.updateQuantity(productId, quantity)
  }

  const clearCart = () => {
    cartStore.cartItems.splice(0)
    showSuccessToast('购物车已清空')
  }

  return {
    cartStore,
    cartCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }
}