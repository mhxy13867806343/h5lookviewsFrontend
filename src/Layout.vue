<template>
  <div class="layout">
    <div class="content">
      <router-view />
    </div>
    <van-tabbar v-model="active" @change="onTabChange">
      <van-tabbar-item icon="friends-o" to="/home">动态</van-tabbar-item>
      <van-tabbar-item icon="label-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="delete-o" to="/cart">回收站</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'Layout',
  setup() {
    const route = useRoute()
    const active = ref(0)

    const onTabChange = (index) => {
      active.value = index
    }

    // 根据当前路由设置激活的tab
    const setActiveTab = () => {
      const path = route.path
      if (path === '/home') active.value = 0
      else if (path === '/category') active.value = 1
      else if (path === '/cart') active.value = 2
      else if (path === '/profile') active.value = 3
    }

    setActiveTab()

    return {
      active,
      onTabChange
    }
  }
}
</script>

<style lang="scss" scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--tabbar-height);
  background-color: var(--background-primary);
}
</style>