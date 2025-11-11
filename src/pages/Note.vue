<template>
  <div class="note">
    <van-nav-bar :title="isEditing ? '编辑笔记' : '写笔记'" left-arrow @click-left="handleBack">
      <template #right>
        <van-button 
          type="primary" 
          size="small" 
          @click="saveNote"
          :loading="saving"
        >
          {{ isEditing ? '更新' : '保存' }}
        </van-button>
      </template>
    </van-nav-bar>
    
    <div class="note-content">
      <!-- 标题输入 -->
      <van-field
        v-model="noteData.title"
        placeholder="请输入笔记标题（可选）"
        class="title-input"
        maxlength="100"
        show-word-limit
      />
      
      <!-- 内容输入 -->
      <van-field
        v-model="noteData.content"
        type="textarea"
        placeholder="开始写下你的想法..."
        :maxlength="20000"
        show-word-limit
        autosize
        class="content-input"
      />
      
      <!-- 分类选择 -->
      <div class="category-section">
        <van-cell 
          title="选择分类" 
          :value="selectedCategory?.name || '未分类'"
          is-link 
          @click="showCategoryPicker = true"
        >
          <template #icon>
            <div 
              class="category-color"
              :style="{ backgroundColor: selectedCategory?.color || '#ddd' }"
            ></div>
          </template>
        </van-cell>
      </div>
      
      <!-- 定时发布 -->
      <div class="timing-section">
        <van-cell>
          <template #title>
            <div class="timing-title">
              <van-icon name="clock-o" />
              <span>定时发布</span>
            </div>
          </template>
          <template #right-icon>
            <van-switch 
              v-model="timingEnabled" 
              size="20px"
              @change="onTimingToggle"
            />
          </template>
        </van-cell>
        
        <van-cell 
          v-if="timingEnabled"
          title="发布时间" 
          :value="scheduledTime ? dayjs(scheduledTime).format('YYYY-MM-DD HH:mm:ss') : '选择时间'"
          is-link 
          @click="showTimePicker = true"
        >
          <template #icon>
            <van-icon name="clock" color="#1989fa" />
          </template>
        </van-cell>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button 
          block 
          type="default" 
          @click="saveDraft"
          :loading="savingDraft"
        >
          临时保存
        </van-button>
        <van-button 
          block 
          type="primary" 
          @click="saveNote"
          :loading="saving"
          class="save-btn"
        >
          {{ timingEnabled ? (isEditing ? '更新定时笔记' : '设置定时发布') : (isEditing ? '更新笔记' : '保存笔记') }}
        </van-button>
      </div>
      
      <!-- 草稿提示 -->
      <div v-if="hasDraft" class="draft-tip">
        <van-notice-bar
          left-icon="info-o"
          text="检测到未保存的草稿"
        >
          <template #right-icon>
            <van-button size="mini" @click="loadDraft">恢复</van-button>
          </template>
        </van-notice-bar>
      </div>
    </div>
    
    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom">
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>
    
    <!-- 时间选择器 -->
    <van-popup v-model:show="showTimePicker" position="bottom">
      <van-picker
        title="选择发布时间"
        :columns="timeColumns"
        :default-index="getDefaultTimeIndex()"
        @confirm="onTimeConfirm"
        @cancel="showTimePicker = false"
      />
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showConfirmDialog, showFailToast } from 'vant'
import dayjs from 'dayjs'
import { noteApi } from '@/api/index'
import type { Note } from '@/types/api'

const router = useRouter()
const route = useRoute()

// 响应式数据
const noteData = reactive({
  id: null,
  title: '',
  content: '',
  categoryId: null,
  createTime: null,
  updateTime: null
})

// 类型定义
interface Category {
  id: number
  name: string
  color: string
}

interface CategoryColumn {
  text: string
  value: number
  color: string
}

const saving = ref<boolean>(false)
const savingDraft = ref<boolean>(false)
const showCategoryPicker = ref<boolean>(false)
const showTimePicker = ref<boolean>(false)
const isEditing = ref<boolean>(false)
const hasDraft = ref<boolean>(false)
const timingEnabled = ref<boolean>(false)
const scheduledTime = ref<Date | null>(null)

// 分类数据
const categories = ref<Category[]>([
  { id: 1, name: '生活随记', color: '#74b9ff' },
  { id: 2, name: '工作学习', color: '#00b894' },
  { id: 3, name: '美食分享', color: '#fdcb6e' },
  { id: 4, name: '旅行游记', color: '#e84393' },
  { id: 5, name: '读书笔记', color: '#6c5ce7' },
  { id: 6, name: '未分类', color: '#ddd' }
])

// 计算属性
const selectedCategory = computed<Category>(() => {
  return categories.value.find(cat => cat.id === noteData.categoryId) || categories.value[5]
})

const categoryColumns = computed<CategoryColumn[]>(() => {
  return categories.value.map(cat => ({
    text: cat.name,
    value: cat.id,
    color: cat.color
  }))
})

// 自动保存定时器
let autoSaveTimer = null

// 方法
const handleBack = () => {
  if (hasUnsavedChanges()) {
    showConfirmDialog({
      title: '提示',
      message: '你有未保存的内容，确定要离开吗？',
    }).then(() => {
      router.back()
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.back()
  }
}

const hasUnsavedChanges = () => {
  return noteData.title.trim() !== '' || noteData.content.trim() !== ''
}

const saveNote = async () => {
  if (!noteData.content.trim()) {
    showSuccessToast('请输入笔记内容')
    return
  }
  
  // 如果启用了定时发布，检查时间是否已选择
  if (timingEnabled.value && !scheduledTime.value) {
    showSuccessToast('请选择发布时间')
    return
  }
  
  // 验证定时时间
  if (timingEnabled.value && scheduledTime.value) {
    const selectedDate = dayjs(scheduledTime.value)
    const now = dayjs()
    const minTime = now.add(2, 'hour')
    const maxTime = now.add(10, 'day')
    
    if (selectedDate.isBefore(minTime)) {
      showSuccessToast('发布时间必须在2小时之后')
      return
    }
    
    if (selectedDate.isAfter(maxTime)) {
      showSuccessToast('发布时间不能超过10天')
      return
    }
  }
  
  saving.value = true
  try {
    const payload: Partial<Note> = {
      title: noteData.title,
      content: noteData.content,
      category: selectedCategory.value?.name || '未分类',
      isPublic: true
    }

    if (isEditing.value && noteData.id) {
      const { data } = await noteApi.updateNote(String(noteData.id), payload)
      noteData.updateTime = new Date(data.updateTime)
      showSuccessToast(timingEnabled.value ? `笔记已设置定时发布：${dayjs(scheduledTime.value).format('MM-DD HH:mm')}` : '笔记更新成功')
    } else {
      const { data } = await noteApi.createNote(payload)
      noteData.id = data.id as any
      noteData.createTime = new Date(data.createTime)
      noteData.updateTime = new Date(data.updateTime)
      showSuccessToast(timingEnabled.value ? `笔记已设置定时发布：${dayjs(scheduledTime.value).format('MM-DD HH:mm')}` : '笔记保存成功')
    }

    clearDraft()
    setTimeout(() => router.back(), 500)
  } catch (error) {
    console.error('保存笔记失败', error)
    showFailToast('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const saveDraft = async () => {
  if (!noteData.content.trim() && !noteData.title.trim()) {
    showSuccessToast('没有内容需要保存')
    return
  }
  
  savingDraft.value = true
  
  try {
    // 保存到本地存储
    const draftData = {
      title: noteData.title,
      content: noteData.content,
      categoryId: noteData.categoryId,
      saveTime: new Date().toISOString()
    }
    
    localStorage.setItem('note_draft', JSON.stringify(draftData))
    hasDraft.value = true
    
    showSuccessToast('草稿已保存')
  } catch (error) {
    showSuccessToast('草稿保存失败')
  } finally {
    savingDraft.value = false
  }
}

const loadDraft = () => {
  try {
    const draftData = JSON.parse(localStorage.getItem('note_draft') || '{}')
    if (draftData.title || draftData.content) {
      noteData.title = draftData.title || ''
      noteData.content = draftData.content || ''
      noteData.categoryId = draftData.categoryId || null
      showSuccessToast('草稿已恢复')
    }
  } catch (error) {
    showSuccessToast('草稿恢复失败')
  }
}

const clearDraft = () => {
  localStorage.removeItem('note_draft')
  hasDraft.value = false
}

const checkDraft = () => {
  try {
    const draft = localStorage.getItem('note_draft')
    hasDraft.value = !!draft
  } catch (error) {
    hasDraft.value = false
  }
}

const onCategoryConfirm = ({ selectedOptions }) => {
  noteData.categoryId = selectedOptions[0].value
  showCategoryPicker.value = false
}

// 定时发布相关方法
const onTimingToggle = (value) => {
  if (!value) {
    scheduledTime.value = null
  } else {
    // 启用定时发布时，设置默认时间为当前时间+2小时
    const defaultTime = dayjs().add(2, 'hour')
    scheduledTime.value = defaultTime.toDate()
  }
}

const getTimeColumns = () => {
  const now = dayjs()
  const minTime = now.add(2, 'hour')
  
  // 生成日期选项
  const dates = []
  for (let i = 0; i <= 10; i++) {
    const date = now.add(i, 'day')
    dates.push({
      text: date.format('MM月DD日'),
      value: date.format('YYYY-MM-DD')
    })
  }
  
  // 生成小时选项
  const hours = []
  const isToday = true // 简化逻辑，始终基于今天的最小时间
  const startHour = minTime.hour()
  
  for (let i = startHour; i < 24; i++) {
    hours.push({
      text: i.toString().padStart(2, '0') + '时',
      value: i
    })
  }
  
  // 其他日期的小时（0-23）
  for (let i = 0; i < startHour; i++) {
    hours.push({
      text: i.toString().padStart(2, '0') + '时',
      value: i
    })
  }
  
  // 生成分钟选项
  const minutes = []
  for (let i = 0; i < 60; i += 15) {
    minutes.push({
      text: i.toString().padStart(2, '0') + '分',
      value: i
    })
  }
  
  // 生成秒选项
  const seconds = []
  for (let i = 0; i < 60; i += 15) {
    seconds.push({
      text: i.toString().padStart(2, '0') + '秒',
      value: i
    })
  }
  
  return [dates, hours, minutes, seconds]
}

const timeColumns = computed(() => getTimeColumns())

const getDefaultTimeIndex = () => {
  const now = dayjs()
  const minTime = now.add(2, 'hour')
  
  // 默认选择今天
  const dateIndex = 0
  
  // 默认选择最小可选小时
  const hourIndex = 0
  
  // 默认选择最小可选分钟
  const minuteIndex = 0
  
  // 默认选择0秒
  const secondIndex = 0
  
  return [dateIndex, hourIndex, minuteIndex, secondIndex]
}

const onTimeConfirm = (event) => {
  if (!event || !event.selectedOptions || event.selectedOptions.length < 4) {
    showSuccessToast('请选择完整的时间')
    return
  }
  
  const [dateOption, hourOption, minuteOption, secondOption] = event.selectedOptions
  
  if (!dateOption || !hourOption || !minuteOption || !secondOption) {
    showSuccessToast('请选择完整的时间')
    return
  }
  
  const selectedDateTime = dayjs(`${dateOption.value} ${hourOption.value.toString().padStart(2, '0')}:${minuteOption.value.toString().padStart(2, '0')}:${secondOption.value.toString().padStart(2, '0')}`)
  
  const now = dayjs()
  const minTime = now.add(2, 'hour')
  const maxTime = now.add(10, 'day')
  
  if (selectedDateTime.isBefore(minTime)) {
    showSuccessToast('发布时间必须在2小时之后')
    return
  }
  
  if (selectedDateTime.isAfter(maxTime)) {
    showSuccessToast('发布时间不能超过10天')
    return
  }
  
  scheduledTime.value = selectedDateTime.toDate()
  showTimePicker.value = false
}

// 自动保存功能
const startAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges()) {
      saveDraft()
    }
  }, 30000) // 每30秒自动保存一次
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 生命周期
onMounted(() => {
  // 检查是否是编辑模式
  if (route.params.id) {
    isEditing.value = true
    loadNote(String(route.params.id))
  }
  
  // 检查草稿
  checkDraft()
  
  // 开始自动保存
  startAutoSave()
  
  // 设置默认分类
  if (!noteData.categoryId) {
    noteData.categoryId = 6 // 未分类
  }
})

onUnmounted(() => {
  stopAutoSave()
})

// 加载笔记详情
const loadNote = async (id: string) => {
  try {
    const { data } = await noteApi.getNoteDetail(id)
    noteData.id = data.id as any
    noteData.title = data.title || ''
    noteData.content = data.content || ''
    // 映射分类名称到ID
    const cat = categories.value.find(c => c.name === (data.category || '未分类'))
    noteData.categoryId = cat ? cat.id : 6
    noteData.createTime = new Date(data.createTime)
    noteData.updateTime = new Date(data.updateTime)
  } catch (e) {
    console.error('加载笔记失败', e)
    showFailToast('加载笔记失败')
  }
}
</script>

<style lang="scss" scoped>
.note {
  background-color: var(--background-primary);
  min-height: 100vh;
  
  :deep(.van-nav-bar) {
    background-color: var(--background-secondary);
  }
}

.note-content {
  padding: var(--spacing-md);
}

.title-input {
  margin-bottom: var(--spacing-md);
  
  :deep(.van-field__control) {
    font-size: var(--font-size-lg);
    font-weight: 500;
  }
}

.content-input {
  margin-bottom: var(--spacing-lg);
  
  :deep(.van-field__control) {
    min-height: 300px;
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
  }
}

.category-section {
  margin-bottom: var(--spacing-lg);
  
  .category-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: var(--spacing-sm);
  }
}

.timing-section {
  margin-bottom: var(--spacing-lg);
  
  .timing-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    
    .van-icon {
      color: var(--primary-color);
    }
  }
  
  :deep(.van-cell) {
    background-color: var(--background-secondary);
    border-radius: var(--border-radius-md);
    margin-bottom: var(--spacing-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  .save-btn {
    background: linear-gradient(135deg, var(--primary-color), #4facfe);
  }
}

.draft-tip {
  margin-top: var(--spacing-md);
}

:deep(.van-picker) {
  .van-picker-option {
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--color, #ddd);
      margin-right: 8px;
    }
  }
}
</style>