<template>
  <van-dialog
    v-model:show="showDialog"
    title="选择举报原因"
    :show-cancel-button="false"
    :before-close="handleBeforeClose"
    class="report-dialog"
    :close-on-click-overlay="false"
  >
    <div class="report-content">
      <div class="report-types-container">
        <div class="report-types">
          <div
            v-for="type in reportTypes"
            :key="type.value"
            class="report-type-item"
            :class="{ active: selectedType === type.value }"
            @click="selectedType = type.value"
          >
            <div class="type-header">
              <span class="type-label">{{ type.label }}</span>
              <van-icon 
                name="success" 
                v-show="selectedType === type.value"
                color="#1989fa"
              />
            </div>
            <div class="type-description">{{ type.description }}</div>
          </div>
        </div>
      </div>
      
      <!-- 其他原因的自定义输入 -->
      <div v-if="selectedType === 'other'" class="custom-reason">
        <van-field
          v-model="customReason"
          type="textarea"
          placeholder="请详细描述举报原因（选填）"
          rows="3"
          maxlength="200"
          show-word-limit
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <van-button 
          size="large" 
          type="default" 
          @click="handleCancel"
        >
          取消
        </van-button>
        <van-button 
          size="large" 
          type="primary" 
          :loading="loading"
          :disabled="!selectedType"
          @click="handleSubmit"
        >
          提交举报
        </van-button>
      </div>
    </template>
  </van-dialog>
</template>

<script lang="ts" setup>
// 类型定义
interface ReportType {
  id: string
  label: string
  description: string
}

interface ReportSubmitData {
  type: string
  customReason: string
}

// Props类型定义
interface Props {
  show: boolean
  reportTypes: ReportType[]
  loading: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  reportTypes: () => [],
  loading: false
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'submit': [data: ReportSubmitData]
  'cancel': []
}>()

const showDialog = ref<boolean>(false)
const selectedType = ref<string>('')
const customReason = ref<string>('')

// 监听外部传入的 show 状态
watch(() => props.show, (newVal: boolean) => {
  showDialog.value = newVal
})

// 监听内部 showDialog 状态变化
watch(showDialog, (newVal: boolean) => {
  emit('update:show', newVal)
  if (!newVal) {
    // 对话框关闭时重置状态
    selectedType.value = ''
    customReason.value = ''
  }
})

const handleSubmit = (): void => {
  if (!selectedType.value) return
  
  emit('submit', {
    type: selectedType.value,
    customReason: customReason.value
  })
}

const handleCancel = (): void => {
  emit('cancel')
  showDialog.value = false
}

const handleBeforeClose = (action: string): boolean => {
  if (action === 'cancel') {
    handleCancel()
  }
  return true
}
</script>

<style lang="scss" scoped>
.report-dialog {
  :deep(.van-dialog) {
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.van-dialog__header) {
    flex-shrink: 0;
  }
  
  :deep(.van-dialog__content) {
    flex: 1;
    max-height: 60vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0;
  }
  
  :deep(.van-dialog__footer) {
    flex-shrink: 0;
    padding: 0;
  }
}

.report-content {
  padding: var(--spacing-md);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.report-types-container {
  flex: 1;
  overflow-y: auto;
  max-height: 50vh;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
}

.report-types {
  max-height: none;
  
  .report-type-item {
    padding: var(--spacing-md);
    border-radius: var(--border-radius-md);
    margin-bottom: var(--spacing-sm);
    cursor: pointer;
    transition: var(--transition-base);
    border: 2px solid transparent;
    background-color: var(--background-secondary);
    
    &:hover {
      background-color: var(--background-primary);
    }
    
    &.active {
      border-color: var(--primary-color);
      background-color: rgba(25, 137, 250, 0.05);
    }
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .type-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
      
      .type-label {
        font-size: var(--font-size-md);
        font-weight: 500;
        color: var(--text-primary);
      }
    }
    
    .type-description {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      line-height: 1.4;
    }
  }
}

.custom-reason {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  
  .van-button {
    flex: 1;
  }
}
</style>