<template>
  <div class="contacts-page">
    <!-- 头部搜索栏 - 固定在顶部 -->
    <div class="header-fixed">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索联系人"
        @search="onSearch"
        @clear="onClearSearch"
      />
    </div>

    <!-- 联系人列表 -->
    <div class="contacts-list">
      <!-- 索引栏 -->
      <van-index-bar 
        :index-list="indexList"
        @select="onIndexSelect"
        @change="onIndexChange"
      >
        <template v-for="letter in indexList" :key="letter">
          <van-index-anchor :index="letter" v-if="groupedContacts[letter]?.length" />
          <van-swipe-cell
            v-for="contact in groupedContacts[letter]"
            :key="contact.id"
          >
            <div class="contact-item" @click="viewDetail(contact)">
              <van-image
                :src="contact.avatar"
                round
                width="40"
                height="40"
                fit="cover"
              >
                <template #error>
                  <van-icon name="user-o" size="40" />
                </template>
              </van-image>
              <div class="contact-info">
                <div class="name">{{ contact.name }}</div>
                <div class="remark" v-if="contact.remark">{{ contact.remark }}</div>
              </div>
              <van-icon name="arrow" class="arrow-icon" />
            </div>
            
            <!-- 右滑操作 -->
            <template #right>
              <van-button
                square
                text="编辑"
                type="primary"
                class="swipe-btn"
                @click="editContact(contact)"
              />
              <van-button
                square
                text="删除"
                type="danger"
                class="swipe-btn"
                @click="deleteContact(contact)"
              />
            </template>
          </van-swipe-cell>
        </template>
      </van-index-bar>

      <!-- 空状态 -->
      <van-empty
        v-if="filteredContacts.length === 0"
        :description="searchKeyword ? '未找到相关联系人' : '暂无联系人'"
      />
    </div>

    <!-- 索引提示 -->
    <transition name="fade">
      <div v-if="showIndexHint" class="index-hint">
        {{ currentIndex }}
      </div>
    </transition>

    <!-- 添加联系人按钮 -->
    <div class="add-btn" @click="addContact">
      <van-icon name="plus" size="24" />
    </div>

    <!-- 编辑/添加联系人弹窗 -->
    <van-dialog
      v-model:show="showEditDialog"
      :title="editingContact.id ? '编辑联系人' : '添加联系人'"
      show-cancel-button
      @confirm="saveContact"
    >
      <van-form class="edit-form">
        <van-field
          v-model="editingContact.name"
          label="姓名"
          placeholder="请输入姓名"
          required
        />
        <van-field
          v-model="editingContact.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          required
        />
        <van-field
          v-model="editingContact.remark"
          label="备注"
          placeholder="请输入备注"
        />
        <van-field
          v-model="editingContact.email"
          label="邮箱"
          placeholder="请输入邮箱"
          type="email"
        />
        <van-field
          v-model="editingContact.company"
          label="公司"
          placeholder="请输入公司"
        />
      </van-form>
    </van-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
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
  pinyin?: string // 拼音首字母
}

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const contacts = ref<Contact[]>([])
const showEditDialog = ref(false)
const editingContact = ref<Partial<Contact>>({})
const showIndexHint = ref(false)
const currentIndex = ref('')
let hideTimer: number | null = null

// 索引列表 A-Z 和 #
const indexList = computed(() => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  return ['#', ...letters]
})

// 过滤后的联系人列表
const filteredContacts = computed(() => {
  if (!searchKeyword.value) return contacts.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return contacts.value.filter(contact => {
    return (
      contact.name.toLowerCase().includes(keyword) ||
      contact.phone.includes(keyword) ||
      (contact.remark && contact.remark.toLowerCase().includes(keyword)) ||
      (contact.pinyin && contact.pinyin.toLowerCase().includes(keyword))
    )
  })
})

// 按首字母分组的联系人
const groupedContacts = computed(() => {
  const groups: Record<string, Contact[]> = {}
  
  // 初始化所有分组
  indexList.value.forEach(letter => {
    groups[letter] = []
  })
  
  filteredContacts.value.forEach(contact => {
    const firstLetter = (contact.pinyin?.[0] || '#').toUpperCase()
    const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#'
    if (groups[key]) {
      groups[key].push(contact)
    } else {
      groups['#'].push(contact)
    }
  })
  
  return groups
})

// 获取拼音首字母(简化版,实际项目建议使用 pinyin-pro 库)
const getPinyin = (name: string): string => {
  // 简化处理,仅作示例,实际应使用专业拼音库
  const firstChar = name.charAt(0)
  const code = firstChar.charCodeAt(0)
  
  // 简单判断是否为中文
  if (code >= 0x4e00 && code <= 0x9fa5) {
    // 这里应该使用真实的拼音转换库
    // 为了演示,返回随机字母
    return String.fromCharCode(65 + Math.floor(Math.random() * 26))
  }
  
  return firstChar.toUpperCase()
}

// 加载联系人数据
const loadContacts = () => {
  // 模拟数据 - 增加更多联系人覆盖各个字母
  const mockData: Contact[] = [
    {
      id: 1,
      name: '张三',
      phone: '13800138001',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: '同事',
      email: 'zhangsan@example.com',
      company: '某某科技',
      pinyin: 'Z'
    },
    {
      id: 2,
      name: '李四',
      phone: '13800138002',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: '朋友',
      email: 'lisi@example.com',
      pinyin: 'L'
    },
    {
      id: 3,
      name: 'Alice',
      phone: '13800138003',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      email: 'alice@example.com',
      pinyin: 'A'
    },
    {
      id: 4,
      name: '王五',
      phone: '13800138004',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: '客户',
      pinyin: 'W'
    },
    {
      id: 5,
      name: 'Bob',
      phone: '13800138005',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'B'
    },
    {
      id: 6,
      name: '陈六',
      phone: '13800138006',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: '合作伙伴',
      pinyin: 'C'
    },
    {
      id: 7,
      name: '赵七',
      phone: '13800138007',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'Z'
    },
    {
      id: 8,
      name: 'David',
      phone: '13800138008',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'D'
    },
    {
      id: 9,
      name: '孙八',
      phone: '13800138009',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'S'
    },
    {
      id: 10,
      name: '周九',
      phone: '13800138010',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: '老同学',
      pinyin: 'Z'
    },
    {
      id: 11,
      name: 'Emma',
      phone: '13800138011',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'E'
    },
    {
      id: 12,
      name: '吴十',
      phone: '13800138012',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'W'
    },
    {
      id: 13,
      name: 'Frank',
      phone: '13800138013',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'F'
    },
    {
      id: 14,
      name: '郑十一',
      phone: '13800138014',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'Z'
    },
    {
      id: 15,
      name: 'Grace',
      phone: '13800138015',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      pinyin: 'G'
    },
  ]
  
  contacts.value = mockData
}

// 搜索
const onSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 清空搜索
const onClearSearch = () => {
  searchKeyword.value = ''
}

// 索引选择
const onIndexSelect = (index: string | number) => {
  currentIndex.value = String(index)
  showIndexHint.value = true
  
  // 清除之前的定时器
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  
  // 2秒后隐藏提示
  hideTimer = window.setTimeout(() => {
    showIndexHint.value = false
  }, 2000)
}

// 索引变化 - 滚动时当前索引变化触发
const onIndexChange = (index: string | number) => {
  // 滚动时不显示大提示框，只更新高亮
  currentIndex.value = String(index)
}

// 查看联系人详情
const viewDetail = (contact: Contact) => {
  router.push({
    name: 'ContactDetail',
    params: { id: contact.id }
  })
}

// 添加联系人
const addContact = () => {
  editingContact.value = {}
  showEditDialog.value = true
}

// 编辑联系人
const editContact = (contact: Contact) => {
  editingContact.value = { ...contact }
  showEditDialog.value = true
}

// 保存联系人
const saveContact = () => {
  if (!editingContact.value.name || !editingContact.value.phone) {
    showToast('请填写必填项')
    return
  }
  
  if (editingContact.value.id) {
    // 更新联系人
    const index = contacts.value.findIndex(c => c.id === editingContact.value.id)
    if (index !== -1) {
      contacts.value[index] = {
        ...contacts.value[index],
        ...editingContact.value,
        pinyin: getPinyin(editingContact.value.name!)
      } as Contact
      showToast('修改成功')
    }
  } else {
    // 添加新联系人
    const newContact: Contact = {
      id: Date.now(),
      name: editingContact.value.name!,
      phone: editingContact.value.phone!,
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      remark: editingContact.value.remark,
      email: editingContact.value.email,
      company: editingContact.value.company,
      pinyin: getPinyin(editingContact.value.name!)
    }
    contacts.value.unshift(newContact)
    showToast('添加成功')
  }
  
  showEditDialog.value = false
}

// 删除联系人
const deleteContact = async (contact: Contact) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除联系人"${contact.name}"吗？`
    })
    
    const index = contacts.value.findIndex(c => c.id === contact.id)
    if (index !== -1) {
      contacts.value.splice(index, 1)
      showToast('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

onMounted(() => {
  loadContacts()
})

// 清理定时器
onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})
</script>

<style lang="scss" scoped>
.contacts-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
  position: relative;
}

.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  background-color: #f7f8fa;
  margin-top: 54px; /* 为固定头部留出空间 */
  padding-bottom: 80px; /* 为底部导航栏留出空间 */
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;

  &:active {
    background-color: #f2f3f5;
  }

  .contact-info {
    flex: 1;
    margin-left: 12px;
    overflow: hidden;

    .name {
      font-size: 16px;
      color: #323233;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .remark {
      font-size: 14px;
      color: #969799;
    }
  }

  .arrow-icon {
    color: #c8c9cc;
  }
}

.swipe-btn {
  height: 100%;
}

.add-btn {
  position: fixed;
  right: 16px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 999;

  &:active {
    transform: scale(0.95);
  }
}

.edit-form {
  padding: 16px 0;
}

// 索引提示
.index-hint {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 60px;
  font-weight: 700;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 自定义索引栏样式 - 放大字母
:deep(.van-index-bar__sidebar) {
  padding: 8px 4px;
}

:deep(.van-index-bar__index) {
  font-size: 13px !important;
  font-weight: 600;
  padding: 2px 8px;
  line-height: 18px;
  color: #1989fa;
}

:deep(.van-index-bar__index--active) {
  color: #fff !important;
  background-color: #1989fa;
  border-radius: 4px;
}
</style>
