<template>
  <div class="publish">
    <van-nav-bar :title="isTextOnlyMode ? '快捷发布' : '发布笔记'" left-text="取消" @click-left="goBack">
      <template #right>
        <van-button 
          type="primary" 
          size="small" 
          @click="publishNote"
          :loading="publishing"
        >
          发布
        </van-button>
      </template>
    </van-nav-bar>

    <div class="publish-content">
      <!-- 文本输入 -->
      <van-field
        v-model="noteContent"
        type="textarea"
        placeholder="分享你的想法..."
        :rows="8"
        autosize
        show-word-limit
        :maxlength="500"
        class="content-input"
      />

      <!-- 图片上传 -->
      <div class="image-upload" v-if="!isTextOnlyMode">
        <van-uploader
          v-model="imageList"
          multiple
          :max-count="9"
          :after-read="afterRead"
          :before-delete="beforeDelete"
        >
          <div class="upload-button">
            <van-icon name="photograph" size="24" />
            <span>添加图片</span>
          </div>
        </van-uploader>
      </div>

      <!-- 操作选项 -->
      <div class="options" v-if="!isTextOnlyMode">
        <van-cell-group>
          <van-cell 
            title="位置" 
            :value="location || '添加位置'"
            icon="location-o" 
            is-link 
            @click="selectLocation"
          />
          <van-cell 
            title="分类" 
            :value="selectedCategory?.name || '选择分类'"
            icon="label-o" 
            is-link 
            @click="selectCategory"
          />
          <van-cell title="可见性" icon="friends-o">
            <template #right-icon>
              <van-radio-group v-model="visibility" direction="horizontal">
                <van-radio name="public">所有人</van-radio>
                <van-radio name="friends">仅朋友</van-radio>
                <van-radio name="private">仅自己</van-radio>
              </van-radio-group>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 纯文本模式提示 -->
      <div class="text-only-tip" v-if="isTextOnlyMode">
        <van-notice-bar
          left-icon="info-o"
          text="当前为快捷发布模式，仅支持文本内容"
        />
      </div>
    </div>

    <!-- 位置选择弹窗 -->
    <van-popup v-model:show="showLocationPicker" position="bottom" v-if="!isTextOnlyMode">
      <div class="location-picker">
        <van-nav-bar title="选择位置" left-text="取消" @click-left="showLocationPicker = false">
          <template #right>
            <van-button type="primary" size="small" @click="confirmLocation">
              确定
            </van-button>
          </template>
        </van-nav-bar>
        <van-search v-model="locationSearch" placeholder="搜索位置" />
        <van-cell-group>
          <van-cell
            v-for="loc in locationOptions"
            :key="loc.id"
            :title="loc.name"
            :label="loc.address"
            clickable
            @click="tempLocation = loc"
            :class="{ active: tempLocation?.id === loc.id }"
          />
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 分类选择弹窗 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom" v-if="!isTextOnlyMode">
      <div class="category-picker">
        <van-nav-bar title="选择分类" left-text="取消" @click-left="showCategoryPicker = false">
          <template #right>
            <van-button type="primary" size="small" @click="confirmCategory">
              确定
            </van-button>
          </template>
        </van-nav-bar>
        <van-cell-group>
          <van-cell
            v-for="category in categories"
            :key="category.id"
            :title="category.name"
            clickable
            @click="tempCategory = category"
            :class="{ active: tempCategory?.id === category.id }"
          >
            <template #icon>
              <div 
                class="category-color"
                :style="{ backgroundColor: category.color }"
              ></div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'

const router = useRouter()
const route = useRoute()

// 检查是否为纯文本模式
const isTextOnlyMode = computed(() => route.query.mode === 'text-only')

// 响应式数据
const noteContent = ref('')
const imageList = ref([])
const location = ref('')
const selectedCategory = ref(null)
const visibility = ref('public')
const publishing = ref(false)

const showLocationPicker = ref(false)
const showCategoryPicker = ref(false)
const locationSearch = ref('')
const tempLocation = ref(null)
const tempCategory = ref(null)

// 模拟数据
const locationOptions = ref([
  { id: 1, name: '北京市朝阳区', address: '朝阳区三里屯' },
  { id: 2, name: '上海市黄浦区', address: '黄浦区南京路' },
  { id: 3, name: '深圳市南山区', address: '南山区科技园' },
])

const categories = ref([
  { id: 1, name: '生活随记', color: '#74b9ff' },
  { id: 2, name: '工作学习', color: '#00b894' },
  { id: 3, name: '美食分享', color: '#fdcb6e' },
  { id: 4, name: '旅行游记', color: '#fd79a8' },
])

// 方法
const goBack = () => {
  if (noteContent.value.trim() || imageList.value.length > 0) {
    showConfirmDialog({
      title: '确认离开',
      message: '当前内容尚未保存，确定离开吗？',
    }).then(() => {
      router.back()
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.back()
  }
}

const afterRead = (file) => {
  console.log('上传图片:', file)
}

const beforeDelete = (file, detail) => {
  return showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这张图片吗？',
  })
}

const selectLocation = () => {
  tempLocation.value = null
  showLocationPicker.value = true
}

const confirmLocation = () => {
  if (tempLocation.value) {
    location.value = tempLocation.value.name
  }
  showLocationPicker.value = false
}

const selectCategory = () => {
  tempCategory.value = selectedCategory.value
  showCategoryPicker.value = true
}

const confirmCategory = () => {
  if (tempCategory.value) {
    selectedCategory.value = tempCategory.value
  }
  showCategoryPicker.value = false
}

const publishNote = async () => {
  if (!noteContent.value.trim()) {
    showFailToast('请输入笔记内容')
    return
  }

  publishing.value = true
  
  try {
    // 模拟发布过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    showSuccessToast(isTextOnlyMode.value ? '快捷发布成功' : '发布成功')
    router.push('/home')
  } catch (error) {
    showFailToast('发布失败，请重试')
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  if (isTextOnlyMode.value) {
    showSuccessToast('已进入快捷发布模式')
  }
})
</script>

<style lang="scss" scoped>
.publish {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.publish-content {
  padding: var(--spacing-md);
}

.content-input {
  margin-bottom: var(--spacing-lg);
  
  :deep(.van-field__control) {
    min-height: 200px;
    font-size: var(--font-size-md);
    line-height: 1.6;
  }
}

.image-upload {
  margin-bottom: var(--spacing-lg);
  
  .upload-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border: 2px dashed var(--border-color);
    border-radius: var(--border-radius-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    
    span {
      margin-top: var(--spacing-xs);
    }
  }
}

.options {
  margin-bottom: var(--spacing-lg);
  
  :deep(.van-cell__left-icon) {
    color: var(--primary-color);
    margin-right: var(--spacing-sm);
  }
}

.text-only-tip {
  margin-bottom: var(--spacing-lg);
}

.location-picker,
.category-picker {
  .active {
    background-color: var(--background-secondary);
  }
  
  .category-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: var(--spacing-sm);
  }
}
</style>