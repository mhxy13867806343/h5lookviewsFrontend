<template>
  <div class="edit-profile">
    <van-nav-bar 
      title="编辑资料" 
      left-arrow 
      right-text="保存"
      @click-left="handleBack"
      @click-right="saveProfile"
    />

    <div class="edit-content">
      <!-- 头像编辑 -->
      <div class="avatar-section">
        <van-cell title="头像" center>
          <template #right-icon>
            <div class="avatar-container" @click="changeAvatar">
              <van-image
                :src="formData.avatar"
                round
                width="60"
                height="60"
                fit="cover"
              />
              <div class="avatar-overlay">
                <van-icon name="photograph" />
              </div>
            </div>
          </template>
        </van-cell>
      </div>

      <!-- 基本信息编辑 -->
      <van-cell-group title="基本信息">
        <van-field
          v-model="formData.nickname"
          label="昵称"
          placeholder="请输入昵称"
          maxlength="20"
          show-word-limit
          required
        />
        <van-field
          v-model="formData.signature"
          label="个性签名"
          placeholder="请输入个性签名"
          type="textarea"
          rows="3"
          maxlength="100"
          show-word-limit
        />
        <van-field
          v-model="formData.location"
          label="所在地"
          placeholder="请输入所在地"
          maxlength="50"
        />
        <van-field
          v-model="formData.birthday"
          label="生日"
          placeholder="请选择生日"
          readonly
          @click="showBirthdayPicker = true"
        />
        <van-field
          v-model="formData.gender"
          label="性别"
          placeholder="请选择性别"
          readonly
          @click="showGenderPicker = true"
        />
      </van-cell-group>

      <!-- 标签编辑 -->
      <van-cell-group title="个人标签">
        <van-cell>
          <template #title>
            <div class="tags-header">
              <span>我的标签</span>
              <span class="tag-count">({{ formData.tags.length }}/6)</span>
            </div>
          </template>
          <template #default>
            <div class="tags-container">
              <div class="current-tags">
                <div 
                  v-for="(tag, index) in formData.tags" 
                  :key="index" 
                  class="tag-item"
                >
                  <span class="tag-text">{{ tag }}</span>
                  <van-icon name="cross" @click="removeTag(index)" />
                </div>
                <div 
                  v-if="formData.tags.length === 0" 
                  class="empty-tags"
                >
                  暂无标签，点击下方添加
                </div>
              </div>
              
              <!-- 添加标签 -->
              <div class="add-tag-section">
                <div class="tag-input">
                  <van-field 
                    v-model="newTag" 
                    placeholder="输入标签内容" 
                    maxlength="20"
                    @keyup.enter="addTag"
                  />
                  <van-button 
                    type="primary" 
                    size="small" 
                    @click="addTag" 
                    :disabled="!canAddTag"
                  >
                    添加
                  </van-button>
                </div>
              </div>

              <!-- 推荐标签 -->
              <div class="recommended-tags">
                <div class="recommended-title">推荐标签</div>
                <div class="tags-grid">
                  <div 
                    v-for="tag in availableRecommendedTags" 
                    :key="tag" 
                    class="recommended-tag"
                    @click="addRecommendedTag(tag)"
                  >
                    {{ tag }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 隐私设置 -->
      <van-cell-group title="隐私设置">
        <van-cell title="允许陌生人查看我的动态">
          <template #right-icon>
            <van-switch v-model="formData.allowStrangerView" />
          </template>
        </van-cell>
        <van-cell title="允许陌生人私信我">
          <template #right-icon>
            <van-switch v-model="formData.allowStrangerMessage" />
          </template>
        </van-cell>
        <van-cell title="显示在线状态">
          <template #right-icon>
            <van-switch v-model="formData.showOnlineStatus" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 头像选择弹窗 -->
    <van-action-sheet
      v-model:show="showAvatarSheet"
      title="选择头像"
      :actions="avatarActions"
      @select="onAvatarSelect"
    />

    <!-- 生日选择器 -->
    <van-popup v-model:show="showBirthdayPicker" position="bottom">
      <van-date-picker
        v-model="birthdayDate"
        title="选择生日"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onBirthdayConfirm"
        @cancel="showBirthdayPicker = false"
      />
    </van-popup>

    <!-- 性别选择器 -->
    <van-action-sheet
      v-model:show="showGenderPicker"
      title="选择性别"
      :actions="genderActions"
      @select="onGenderSelect"
    />

    <!-- 图片上传组件 -->
    <van-uploader
      ref="uploaderRef"
      v-model="fileList"
      :after-read="afterRead"
      :max-count="1"
      :preview-image="false"
      style="display: none;"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/store'
import { showSuccessToast, showToast, showConfirmDialog, showImagePreview } from 'vant'


// 类型定义
interface ProfileFormData {
  avatar: string
  nickname: string
  signature: string
  location: string
  birthday: string
  gender: string
  tags: string[]
  allowStrangerView: boolean
  allowStrangerMessage: boolean
  showOnlineStatus: boolean
}

interface AvatarAction {
  name: string
  value: string
}

interface GenderAction {
  name: string
  value: string
}

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const formData = ref<ProfileFormData>({
  avatar: '',
  nickname: '',
  signature: '',
  location: '',
  birthday: '',
  gender: '',
  tags: [],
  allowStrangerView: true,
  allowStrangerMessage: true,
  showOnlineStatus: true
})

const newTag = ref<string>('')
const showAvatarSheet = ref<boolean>(false)
const showBirthdayPicker = ref<boolean>(false)
const showGenderPicker = ref<boolean>(false)
const fileList = ref<File[]>([])
const uploaderRef = ref<any>(null)

// 推荐标签
const recommendedTags = ref<string[]>([
  '热爱生活', '美食达人', '旅行家', '读书人', '摄影爱好者', '运动健将',
  '音乐发烧友', '电影迷', '游戏玩家', '宠物达人', '时尚达人', '技术宅',
  '咖啡控', '甜品控', '健身达人', '瑜伽爱好者', '画画爱好者', '手工达人',
  '花艺师', '烘焙师', '茶艺师', '收藏家', '极简主义', '文艺青年'
])

// 日期相关
const birthdayDate = ref<string[]>(['2000', '01', '01'])
const minDate: Date = new Date(1950, 0, 1)
const maxDate: Date = new Date()

// 头像操作选项
const avatarActions: AvatarAction[] = [
  { name: '拍照', value: 'camera' },
  { name: '从相册选择', value: 'album' },
  { name: '查看大图', value: 'preview' },
  { name: '取消', value: 'cancel' }
]

// 性别选项
const genderActions: GenderAction[] = [
  { name: '男', value: '男' },
  { name: '女', value: '女' },
  { name: '保密', value: '保密' },
  { name: '取消', value: 'cancel' }
]

// 计算属性
const canAddTag = computed<boolean>(() => {
  return newTag.value.trim() && 
         newTag.value.trim().length <= 20 && 
         formData.value.tags.length < 6 && 
         !formData.value.tags.includes(newTag.value.trim())
})

const availableRecommendedTags = computed<string[]>(() => {
  return recommendedTags.value.filter(tag => 
    !formData.value.tags.includes(tag) && formData.value.tags.length < 6
  ).slice(0, 12) // 只显示前12个
})

// 方法
const handleBack = (): void => {
  if (hasChanges()) {
    showConfirmDialog({
      title: '确认离开',
      message: '您有未保存的更改，确定要离开吗？',
    }).then(() => {
      router.back()
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.back()
  }
}

const hasChanges = (): boolean => {
  const original = userStore.userInfo
  return (
    formData.value.nickname !== (original?.nickname || '') ||
    formData.value.signature !== (original?.signature || '') ||
    formData.value.location !== (original?.location || '') ||
    formData.value.avatar !== (original?.avatar || '') ||
    JSON.stringify(formData.value.tags) !== JSON.stringify((original as any)?.tags || [])
  )
}

const saveProfile = async (): Promise<void> => {
  if (!formData.value.nickname.trim()) {
    showToast('请输入昵称')
    return
  }

  try {
    // 模拟保存API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 更新用户store
    if (userStore.userInfo) {
      Object.assign(userStore.userInfo, formData.value)
    }
    
    showSuccessToast('保存成功')
    router.back()
  } catch (error) {
    showToast('保存失败，请重试')
  }
}

// 头像相关方法
const changeAvatar = (): void => {
  showAvatarSheet.value = true
}

const onAvatarSelect = (action: AvatarAction): void => {
  showAvatarSheet.value = false
  
  switch (action.value) {
    case 'camera':
    case 'album':
      // 触发文件选择
      uploaderRef.value?.chooseFile()
      break
    case 'preview':
      // 预览头像
      showImagePreview({
        images: [formData.value.avatar],
        startPosition: 0,
      })
      break
  }
}

const afterRead = (file: { file: File }): void => {
  // 模拟上传头像
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target?.result) {
      formData.value.avatar = e.target.result as string
      showSuccessToast('头像上传成功')
    }
  }
  reader.readAsDataURL(file.file)
}

// 生日相关方法
const onBirthdayConfirm = (date: string[]): void => {
  const [year, month, day] = date
  formData.value.birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  showBirthdayPicker.value = false
}

// 性别相关方法
const onGenderSelect = (action: GenderAction): void => {
  showGenderPicker.value = false
  if (action.value !== 'cancel') {
    formData.value.gender = action.value
  }
}

// 标签相关方法
const addTag = (): void => {
  if (canAddTag.value) {
    formData.value.tags.push(newTag.value.trim())
    newTag.value = ''
    showToast('标签添加成功')
  }
}

const removeTag = (index: number): void => {
  formData.value.tags.splice(index, 1)
  showToast('标签删除成功')
}

const addRecommendedTag = (tag: string): void => {
  if (!formData.value.tags.includes(tag) && formData.value.tags.length < 6) {
    formData.value.tags.push(tag)
    showToast('标签添加成功')
  } else if (formData.value.tags.length >= 6) {
    showToast('最多只能添加6个标签')
  }
}

// 初始化数据
const initData = (): void => {
  const user = userStore.userInfo
  if (user) {
    formData.value = {
      avatar: user.avatar || 'https://img.yzcdn.cn/vant/cat.jpeg',
      nickname: user.nickname || '',
      signature: user.signature || '',
      location: user.location || '',
      birthday: user.birthday || '',
      gender: user.gender || '',
      tags: [...(user.tags || [])],
      allowStrangerView: user.allowStrangerView ?? true,
      allowStrangerMessage: user.allowStrangerMessage ?? true,
      showOnlineStatus: user.showOnlineStatus ?? true
    }
  }
}

onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped>
.edit-profile {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.edit-content {
  padding: var(--spacing-sm);
}

.avatar-section {
  margin-bottom: var(--spacing-md);
  
  .avatar-container {
    position: relative;
    cursor: pointer;
    
    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      
      .van-icon {
        color: white;
        font-size: 20px;
      }
    }
    
    &:hover .avatar-overlay {
      opacity: 1;
    }
  }
}

.tags-container {
  width: 100%;
  
  .tags-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    
    .tag-count {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
  
  .current-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    min-height: 40px;
    
    .tag-item {
      display: flex;
      align-items: center;
      background: var(--primary-color-light);
      border-radius: 16px;
      padding: 4px 12px;
      font-size: var(--font-size-sm);
      color: var(--primary-color);
      
      .tag-text {
        margin-right: 4px;
      }
      
      .van-icon {
        font-size: 14px;
        color: var(--primary-color);
        cursor: pointer;
      }
    }
    
    .empty-tags {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      text-align: center;
      padding: 20px 0;
      width: 100%;
    }
  }
  
  .add-tag-section {
    margin-bottom: var(--spacing-md);
    
    .tag-input {
      display: flex;
      gap: var(--spacing-xs);
      align-items: flex-end;
      
      .van-field {
        flex: 1;
      }
    }
  }
  
  .recommended-tags {
    .recommended-title {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }
    
    .tags-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-xs);
      
      .recommended-tag {
        background: var(--background-secondary);
        border-radius: 16px;
        padding: 6px 12px;
        text-align: center;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid var(--border-color);
        
        &:active {
          background: var(--primary-color-light);
          color: var(--primary-color);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .tags-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .recommended-tag {
    font-size: 12px !important;
    padding: 4px 8px !important;
  }
}

// 暗色主题支持
@media (prefers-color-scheme: dark) {
  .edit-profile {
    background-color: var(--dark-background-primary);
  }
  
  .tag-item {
    background: var(--dark-primary-color-light) !important;
    color: var(--dark-primary-color) !important;
  }
  
  .recommended-tag {
    background: var(--dark-background-secondary) !important;
    border-color: var(--dark-border-color) !important;
    color: var(--dark-text-secondary) !important;
    
    &:active {
      background: var(--dark-primary-color-light) !important;
      color: var(--dark-primary-color) !important;
    }
  }
}
</style>