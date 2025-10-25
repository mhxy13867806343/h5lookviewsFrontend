<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">
        <van-icon name="warning-o" size="80" color="#ff6b6b" />
      </div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-message">抱歉，您访问的页面不存在或已被删除</p>
      <div class="error-actions">
        <van-button 
          type="primary" 
          size="large" 
          @click="goHome"
          class="home-btn"
        >
          返回首页
        </van-button>
        <van-button 
          size="large" 
          @click="goBack"
          class="back-btn"
        >
          返回上页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter()

const goHome = (): void => {
  router.push('/')
}

const goBack = (): void => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style lang="scss" scoped>
.not-found-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.not-found-content {
  text-align: center;
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  width: 100%;
}

.error-icon {
  margin-bottom: var(--spacing-lg);
}

.error-code {
  font-size: 72px;
  font-weight: bold;
  color: #ff6b6b;
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin: var(--spacing-md) 0;
  font-weight: 600;
}

.error-message {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.home-btn {
  background: var(--gradient-primary);
  border: none;
}

.back-btn {
  background: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

@media (min-width: 480px) {
  .error-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .home-btn,
  .back-btn {
    flex: 1;
    max-width: 120px;
  }
}
</style>