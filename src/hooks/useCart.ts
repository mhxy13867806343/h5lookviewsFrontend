import { useCartStore } from '@/stores/store'
import { showSuccessToast } from 'vant'

// 类型定义
interface Product {
  id: string | number
  name: string
  price: number
  quantity?: number
  [key: string]: any
}

export function useCart() {
  const cartStore = useCartStore()

  const cartCount = computed(() => cartStore.cartCount)
  const totalPrice = computed(() => cartStore.totalPrice)

  const addToCart = (product: Product): void => {
    cartStore.addToCart(product)
    showSuccessToast('已加入购物车')
  }

  const removeFromCart = (productId: string | number): void => {
    cartStore.removeFromCart(productId)
    showSuccessToast('已移除商品')
  }

  const updateQuantity = (productId: string | number, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    cartStore.updateQuantity(productId, quantity)
  }

  const clearCart = (): void => {
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