<template>
  <div class="layout">
    <div class="content">
      <router-view />
    </div>
    <van-tabbar v-model="active" @change="onTabChange">
      <van-tabbar-item icon="friends-o" to="/home">动态</van-tabbar-item>
      <van-tabbar-item icon="label-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="contact" to="/contacts">通讯录</van-tabbar-item>
      <van-tabbar-item icon="delete-o" to="/cart">回收站</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script lang="ts" setup>
// 响应式数据
const route = useRoute()
const active = ref<number>(0)

// 方法
const onTabChange = (index: number): void => {
  active.value = index
}

// 根据当前路由设置激活的tab
const setActiveTab = (): void => {
  const path = route.path
  if (path === '/home') active.value = 0
  else if (path === '/category') active.value = 1
  else if (path === '/contacts') active.value = 2
  else if (path === '/cart') active.value = 3
  else if (path === '/profile') active.value = 4
}

setActiveTab()
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