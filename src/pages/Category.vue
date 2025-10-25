<template>
  <div class="category">
    <van-nav-bar title="笔记分类">
      <template #right>
        <van-button type="primary" size="small" @click="showAddCategory = true">
          新增
        </van-button>
      </template>
    </van-nav-bar>
    
    <div>
      <!-- 分类列表 -->
      <div class="category-list">
        <van-cell-group>
          <van-cell
            v-for="category in categories"
            :key="category.id"
            :title="category.name"
            :label="`${category.count} 篇笔记`"
            is-link
            @click="viewCategoryNotes(category)"
            class="category-item"
          >
            <template #icon>
              <div 
                class="category-color"
                :style="{ backgroundColor: category.color }"
              ></div>
            </template>
            <template #right-icon>
              <van-icon 
                name="edit" 
                @click.stop="editCategory(category)"
                class="edit-icon"
              />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 统计信息 -->
      <div class="stats">
        <van-grid :column-num="3" :border="false">
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-number">{{ totalNotes }}</div>
              <div class="stat-label">总笔记</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-number">{{ categories.length }}</div>
              <div class="stat-label">分类数</div>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="stat-item">
              <div class="stat-number">{{ todayNotes }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <van-cell-group title="快捷操作">
          <van-cell 
            title="全部笔记" 
            icon="notes-o" 
            is-link 
            @click="viewAllNotes"
          />
          <van-cell 
            title="最近编辑" 
            icon="clock-o" 
            is-link 
            @click="viewRecentNotes"
          />
          <van-cell 
            title="收藏夹" 
            icon="star-o" 
            is-link 
            @click="viewFavorites"
          />
        </van-cell-group>
      </div>
    </div>

    <!-- 新增分类弹窗 -->
    <van-popup v-model:show="showAddCategory" position="bottom">
      <div class="add-category-form">
        <van-nav-bar title="新增分类" left-text="取消" @click-left="showAddCategory = false">
          <template #right>
            <van-button type="primary" size="small" @click="addCategory">
              保存
            </van-button>
          </template>
        </van-nav-bar>
        
        <div class="form-content">
          <van-field
            v-model="newCategory.name"
            label="分类名称"
            placeholder="请输入分类名称"
            required
            :rules="[{ required: true, message: '请填写分类名称' }]"
          />
          <van-field label="分类颜色">
            <template #input>
              <div class="color-picker">
                <div
                  v-for="color in colorOptions"
                  :key="color"
                  class="color-option"
                  :class="{ active: newCategory.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="newCategory.color = color"
                ></div>
              </div>
            </template>
          </van-field>
        </div>
      </div>
    </van-popup>

    <!-- 编辑分类弹窗 -->
    <van-popup v-model:show="showEditCategory" position="bottom">
      <div class="edit-category-form">
        <van-nav-bar title="编辑分类" left-text="取消" @click-left="showEditCategory = false">
          <template #right>
            <van-button type="primary" size="small" @click="saveEditCategory">
              保存
            </van-button>
          </template>
        </van-nav-bar>
        
        <div class="form-content">
          <van-field
            v-model="editingCategory.name"
            label="分类名称"
            placeholder="请输入分类名称"
            required
            :rules="[{ required: true, message: '请填写分类名称' }]"
          />
          <van-field label="分类颜色">
            <template #input>
              <div class="color-picker">
                <div
                  v-for="color in colorOptions"
                  :key="color"
                  class="color-option"
                  :class="{ active: editingCategory.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="editingCategory.color = color"
                ></div>
              </div>
            </template>
          </van-field>
          
          <!-- 删除按钮 -->
          <div class="delete-section">
            <van-button 
              type="danger" 
              block 
              @click="deleteCategory"
              :disabled="getCurrentCategoryCount() > 0"
            >
              删除分类
              <span v-if="getCurrentCategoryCount() > 0" class="delete-tip">
                (该分类下还有笔记，无法删除)
              </span>
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive } from 'vue'
import { showSuccessToast, showFailToast, showDialog } from 'vant'
import { useRouter } from 'vue-router'

const showAddCategory = ref(false)
const showEditCategory = ref(false)
const router = useRouter()

const categories = ref([
  { id: 1, name: '生活随记', color: '#74b9ff', count: 12 },
  { id: 2, name: '工作学习', color: '#00b894', count: 8 },
  { id: 3, name: '美食分享', color: '#fdcb6e', count: 5 },
  { id: 4, name: '旅行游记', color: '#fd79a8', count: 3 },
  { id: 5, name: '读书笔记', color: '#6c5ce7', count: 15 },
  { id: 6, name: '运动健身', color: '#e17055', count: 6 },
])

const newCategory = reactive({
  name: '',
  color: '#74b9ff'
})

const editingCategory = reactive({
  id: null,
  name: '',
  color: '#74b9ff'
})

const colorOptions = [
  '#74b9ff', '#00b894', '#fdcb6e', '#fd79a8', 
  '#6c5ce7', '#e17055', '#00cec9', '#a29bfe'
]

// 计算属性
const totalNotes = computed(() => {
  return categories.value.reduce((sum, cat) => sum + cat.count, 0)
})

const todayNotes = ref(3) // 模拟今日新增

// 方法
const viewCategoryNotes = (category) => {
  // 跳转到全部笔记页面，并传递分类参数
  router.push({ 
    path: '/all-notes', 
    query: { category: category.name } 
  })
}

const editCategory = (category) => {
  editingCategory.id = category.id
  editingCategory.name = category.name
  editingCategory.color = category.color
  showEditCategory.value = true
}

const saveEditCategory = () => {
  if (!editingCategory.name.trim()) {
    showFailToast('请输入分类名称')
    return
  }

  const categoryIndex = categories.value.findIndex(c => c.id === editingCategory.id)
  if (categoryIndex !== -1) {
    categories.value[categoryIndex].name = editingCategory.name
    categories.value[categoryIndex].color = editingCategory.color
    showSuccessToast('分类修改成功')
    showEditCategory.value = false
  }
}

const deleteCategory = () => {
  const currentCategory = categories.value.find(c => c.id === editingCategory.id)
  if (currentCategory && currentCategory.count > 0) {
    showFailToast('该分类下还有笔记，无法删除')
    return
  }

  showDialog({
    title: '确认删除',
    message: `确定要删除分类"${editingCategory.name}"吗？`,
    showCancelButton: true,
    confirmButtonColor: '#ee0a24',
  }).then(() => {
    const categoryIndex = categories.value.findIndex(c => c.id === editingCategory.id)
    if (categoryIndex !== -1) {
      categories.value.splice(categoryIndex, 1)
      showSuccessToast('分类删除成功')
      showEditCategory.value = false
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const addCategory = () => {
  if (!newCategory.name.trim()) {
    showFailToast('请输入分类名称')
    return
  }

  const newId = Math.max(...categories.value.map(c => c.id)) + 1
  categories.value.push({
    id: newId,
    name: newCategory.name,
    color: newCategory.color,
    count: 0
  })

  showSuccessToast('分类创建成功')
  newCategory.name = ''
  newCategory.color = '#74b9ff'
  showAddCategory.value = false
}

const viewAllNotes = () => {
  // 可以传递当前选中的分类信息，这里暂时不传递特定分类
  // 如果需要传递特定分类，可以这样做：
  // router.push({ path: '/all-notes', query: { category: '生活随记' } })
  router.push('/all-notes')
}

const viewRecentNotes = () => {
  router.push('/recent-notes')
}

const viewFavorites = () => {
  router.push('/favorites')
}

const getCurrentCategoryCount = () => {
  const currentCategory = categories.value.find(c => c.id === editingCategory.id)
  return currentCategory ? currentCategory.count : 0
}

const viewTrash = () => {
  showSuccessToast('查看回收站')
}
</script>

<style lang="scss" scoped>
.category {
  background-color: var(--background-primary);
  min-height: 100%;
}

.category-content {
  padding: var(--spacing-sm);
}
.van-cell {
  display: flex;
      align-items: anchor-center;
}

.category-list {
  margin-bottom: var(--spacing-lg);
  
  .category-item {
    :deep(.van-cell) {
      padding: var(--spacing-md) var(--spacing-lg);
      align-items: center;
    }
    
    :deep(.van-cell__left-icon) {
      margin-right: var(--spacing-sm);
    }
    
    :deep(.van-cell__title) {
      font-size: var(--font-size-md);
      font-weight: 500;
      color: var(--text-primary);
      padding-left: 10px;
    }
    
    :deep(.van-cell__label) {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-top: 4px;
    }
  }
  
  .category-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .edit-icon {
    color: var(--text-secondary);
    padding: var(--spacing-xs);
    
    &:hover {
      color: var(--primary-color);
    }
  }
}

.stats {
  margin-bottom: var(--spacing-lg);
  
  .stat-item {
    text-align: center;
    
    .stat-number {
      font-size: var(--font-size-xl);
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: var(--spacing-xs);
    }
    
    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.quick-actions {
  :deep(.van-cell__left-icon) {
    color: var(--primary-color);
    margin-right: var(--spacing-sm);
  }
}

.add-category-form,
.edit-category-form {
  .form-content {
    padding: var(--spacing-md);
  }
  
  .color-picker {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    
    .color-option {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      border: 3px solid transparent;
      transition: var(--transition-base);
      
      &.active {
        border-color: var(--text-primary);
        transform: scale(1.1);
      }
    }
  }
  
  .delete-section {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
    
    .delete-tip {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-left: var(--spacing-xs);
    }
  }
}
</style>