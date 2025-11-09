<template>
  <div class="contact-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="联系人详情"
      left-arrow
      @click-left="goBack"
    >
      <template #right>
        <van-icon name="edit" @click="editContact" />
      </template>
    </van-nav-bar>

    <!-- 加载状态 -->
    <van-loading v-if="loading" class="loading" />

    <!-- 联系人信息 -->
    <div v-else-if="contact" class="contact-content">
      <!-- 头像和基本信息 -->
      <div class="header-section">
        <van-image
          :src="contact.avatar"
          round
          width="80"
          height="80"
          fit="cover"
          class="avatar"
        >
          <template #error>
            <van-icon name="user-o" size="80" />
          </template>
        </van-image>
        <div class="basic-info">
          <h2 class="name">{{ contact.name }}</h2>
          <p class="remark" v-if="contact.remark">{{ contact.remark }}</p>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="info-section">
        <van-cell-group :border="false">
          <van-cell title="手机号" :value="contact.phone" is-link @click="callPhone">
            <template #icon>
              <van-icon name="phone-o" class="cell-icon" />
            </template>
            <template #right-icon>
              <van-icon name="phone-o" color="#07c160" />
            </template>
          </van-cell>

          <van-cell
            v-if="contact.email"
            title="邮箱"
            :value="contact.email"
            is-link
            @click="sendEmail"
          >
            <template #icon>
              <van-icon name="envelop-o" class="cell-icon" />
            </template>
          </van-cell>

          <van-cell
            v-if="contact.company"
            title="公司"
            :value="contact.company"
          >
            <template #icon>
              <van-icon name="cluster-o" class="cell-icon" />
            </template>
          </van-cell>

          <van-cell
            title="添加时间"
            :value="formatDate(contact.createTime)"
          >
            <template #icon>
              <van-icon name="clock-o" class="cell-icon" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <van-button
          type="primary"
          block
          icon="chat-o"
          @click="sendMessage"
        >
          发送消息
        </van-button>
        <van-button
          block
          icon="video-o"
          @click="videoCall"
          class="mt-12"
        >
          视频通话
        </van-button>
      </div>

      <!-- 更多操作 -->
      <div class="more-section">
        <van-cell-group :border="false">
          <van-cell
            title="设置备注和标签"
            is-link
            @click="setRemark"
          />
          <van-cell
            title="朋友圈权限"
            is-link
            @click="setMomentsPermission"
          />
          <van-cell
            title="加入黑名单"
            @click="addToBlacklist"
          />
        </van-cell-group>
      </div>

      <!-- 删除按钮 -->
      <div class="delete-section">
        <van-button
          type="danger"
          block
          @click="deleteContact"
        >
          删除联系人
        </van-button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <van-dialog
      v-model:show="showEditDialog"
      title="编辑联系人"
      show-cancel-button
      @confirm="saveContact"
    >
      <van-form class="edit-form">
        <van-field
          v-model="editForm.name"
          label="姓名"
          placeholder="请输入姓名"
          required
        />
        <van-field
          v-model="editForm.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          required
        />
        <van-field
          v-model="editForm.remark"
          label="备注"
          placeholder="请输入备注"
        />
        <van-field
          v-model="editForm.email"
          label="邮箱"
          placeholder="请输入邮箱"
          type="email"
        />
        <van-field
          v-model="editForm.company"
          label="公司"
          placeholder="请输入公司"
        />
      </van-form>
    </van-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'

// 联系人类型定义
interface Contact {
  id: number
  name: string
  phone: string
  avatar: string
  remark?: string
  email?: string
  company?: string
  createTime?: number
}

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const contact = ref<Contact | null>(null)
const showEditDialog = ref(false)
const editForm = ref<Partial<Contact>>({})

// 加载联系人详情
const loadContactDetail = async () => {
  try {
    const contactId = Number(route.params.id)
    
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    contact.value = {
      id: contactId,
      name: '张三',
      phone: '13800138001',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: '好朋友',
      email: 'zhangsan@example.com',
      company: '某某科技有限公司',
      createTime: Date.now() - 86400000 * 30 // 30天前
    }
    
    loading.value = false
  } catch (error) {
    showToast('加载失败')
    loading.value = false
  }
}

// 格式化日期
const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '-'
  
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// 返回
const goBack = () => {
  router.back()
}

// 编辑联系人
const editContact = () => {
  if (contact.value) {
    editForm.value = { ...contact.value }
    showEditDialog.value = true
  }
}

// 保存编辑
const saveContact = () => {
  if (!editForm.value.name || !editForm.value.phone) {
    showToast('请填写必填项')
    return
  }
  
  if (contact.value) {
    contact.value = {
      ...contact.value,
      ...editForm.value
    } as Contact
    showToast('修改成功')
  }
  
  showEditDialog.value = false
}

// 拨打电话
const callPhone = () => {
  if (contact.value?.phone) {
    window.location.href = `tel:${contact.value.phone}`
  }
}

// 发送邮件
const sendEmail = () => {
  if (contact.value?.email) {
    window.location.href = `mailto:${contact.value.email}`
  }
}

// 发送消息
const sendMessage = () => {
  if (contact.value) {
    router.push({
      name: 'ChatDetail',
      params: { userId: contact.value.id }
    })
  }
}

// 视频通话
const videoCall = () => {
  showToast('视频通话功能开发中')
}

// 设置备注
const setRemark = () => {
  editContact()
}

// 设置朋友圈权限
const setMomentsPermission = () => {
  showToast('朋友圈权限设置开发中')
}

// 加入黑名单
const addToBlacklist = async () => {
  try {
    await showConfirmDialog({
      title: '加入黑名单',
      message: '加入黑名单后将不再收到对方的消息'
    })
    
    showToast('已加入黑名单')
  } catch {
    // 用户取消
  }
}

// 删除联系人
const deleteContact = async () => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除联系人"${contact.value?.name}"吗？`
    })
    
    showToast('删除成功')
    setTimeout(() => {
      router.back()
    }, 500)
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadContactDetail()
})
</script>

<style lang="scss" scoped>
.contact-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 16px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.contact-content {
  .header-section {
    background-color: #fff;
    padding: 32px 16px;
    text-align: center;
    margin-bottom: 12px;

    .avatar {
      margin-bottom: 16px;
    }

    .basic-info {
      .name {
        font-size: 24px;
        font-weight: 600;
        color: #323233;
        margin-bottom: 8px;
      }

      .remark {
        font-size: 14px;
        color: #969799;
      }
    }
  }

  .info-section {
    margin-bottom: 12px;

    .cell-icon {
      margin-right: 8px;
      font-size: 18px;
    }
  }

  .action-section {
    padding: 0 16px;
    margin-bottom: 12px;

    .mt-12 {
      margin-top: 12px;
    }
  }

  .more-section {
    margin-bottom: 12px;
  }

  .delete-section {
    padding: 0 16px;
    margin-top: 24px;
  }
}

.edit-form {
  padding: 16px 0;
}
</style>
