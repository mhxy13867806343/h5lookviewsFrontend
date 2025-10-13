# H5 LookViews Frontend

基于 Vite5 + Vant UI + Vue3 的移动端商城项目

## 🚀 技术栈

- **Vite5** - 现代化构建工具
- **Vue3** - 使用 Composition API
- **Vant4** - 移动端 UI 组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **SCSS** - 样式预处理器
- **dayjs** - 日期处理库

## 📁 项目结构

```
src/
├── pages/          # 页面组件
│   ├── Home.vue    # 首页
│   ├── Category.vue # 分类页
│   ├── Cart.vue    # 购物车
│   ├── Profile.vue # 个人中心
│   ├── Login.vue   # 登录页
│   └── Register.vue # 注册页
├── stores/         # Pinia 状态管理
├── hooks/          # Vue 组合式函数
├── styles/         # 全局样式
├── utils/          # 工具函数
├── Layout.vue      # 布局组件
├── router.js       # 路由配置
└── main.js         # 应用入口
```

## ✨ 功能特性

### 主要页面
- **首页**: 搜索、轮播图、分类菜单、商品展示
- **分类页**: 侧边栏分类导航、子分类展示
- **购物车**: 商品管理、数量调整、价格计算
- **个人中心**: 用户信息、功能菜单

### 认证系统
- **登录**: 表单验证、第三方登录选项
- **注册**: 完整注册流程、用户协议

### 技术亮点
- 📱 移动端优先设计
- 🎨 SCSS 全局变量和 mixins
- 🔄 组件自动导入
- 📦 代码分割和压缩
- ⚡ 热重载开发体验

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 📱 页面预览

项目运行在 http://localhost:3000

- 底部 Tabbar 导航切换
- 响应式移动端布局  
- Vant UI 组件集成
- 完整的用户交互流程

## 🎯 生产优化

- Gzip 压缩
- 代码分割
- Tree Shaking
- 资源优化
- 现代化 JavaScript

---

*Created with Vite5 + Vue3 + Vant4*