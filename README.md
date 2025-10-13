# H5 LookViews 前端项目

基于 Vite5 + Vue3 + Vant4 构建的移动端社交应用前端项目。

## 🚀 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **UI 组件库**: Vant 4
- **路由管理**: Vue Router
- **状态管理**: Pinia
- **时间处理**: dayjs
- **样式预处理**: Sass
- **自动导入**: unplugin-auto-import + unplugin-vue-components

## 📱 功能特性

- **4个主要页面**: 首页、分类、购物车、个人中心
- **用户系统**: 登录、注册、个人资料管理
- **社交功能**: 聊天系统、笔记广场、发布内容
- **实用功能**: 搜索、签到、用户详情
- **移动端优化**: 响应式设计、触摸友好的交互

## 🛠 开发环境设置

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 📁 项目结构

```
src/
├── components/          # 公共组件
├── hooks/              # 自定义 Hooks
│   ├── useAuth.js      # 认证相关
│   ├── useCart.js      # 购物车相关
│   └── useTheme.js     # 主题相关
├── pages/              # 页面组件
│   ├── Home.vue        # 首页
│   ├── Category.vue    # 分类页
│   ├── Cart.vue        # 购物车
│   ├── Profile.vue     # 个人中心
│   ├── Login.vue       # 登录页
│   ├── Register.vue    # 注册页
│   ├── Chat.vue        # 聊天页面
│   ├── ChatList.vue    # 聊天列表
│   ├── NoteSquare.vue  # 笔记广场
│   ├── Publish.vue     # 发布内容
│   ├── Search.vue      # 搜索页面
│   ├── CheckIn.vue     # 签到页面
│   └── UserDetail.vue  # 用户详情
├── stores/             # Pinia 状态管理
├── styles/             # 样式文件
├── utils/              # 工具函数
├── router.js           # 路由配置
└── main.js            # 应用入口
```

## 🎨 主要页面

### 主页面 (Tabbar 导航)
- **首页**: 展示推荐内容和热门动态
- **分类**: 内容分类浏览
- **购物车**: 购物车管理
- **个人中心**: 用户信息和设置

### 功能页面
- **聊天系统**: 支持文字和语音消息
- **笔记广场**: 用户内容分享平台
- **搜索功能**: 全局内容搜索
- **用户系统**: 完整的认证和个人资料管理

## 🔧 配置说明

### Vite 配置特性
- 生产环境代码压缩和 Gzip 压缩
- 自动导入 Vue API 和 Vant 组件
- Sass 预处理器支持
- 开发服务器热更新

### 组件自动导入
项目配置了 Vant 组件的自动导入，无需手动引入即可使用所有 Vant 组件。

## 🌟 开发亮点

- **移动端优化**: 专为移动设备设计的 UI/UX
- **模块化开发**: 清晰的代码结构和组件划分
- **状态管理**: 使用 Pinia 进行高效的状态管理
- **类型安全**: 自动生成的类型定义文件
- **生产优化**: 代码分割、压缩和缓存优化

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请通过 GitHub Issues 联系我们。