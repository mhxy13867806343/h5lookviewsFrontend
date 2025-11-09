# ⚠️ 紧急安装指南

## 问题说明

Vite 开发服务器报错：
```
Failed to resolve import "vue-i18n" from "src/i18n/index.ts"
```

**原因：** `vue-i18n` 依赖包未安装

## 🔧 解决方案（请手动执行）

### 方法 1：完整安装（推荐）

在项目根目录打开终端，执行：

```bash
# 进入项目目录
cd /Users/hooksvue/Desktop/h5lookviewsFrontend

# 安装所有依赖
npm install

# 等待安装完成后，启动开发服务器
npm run dev
```

### 方法 2：只安装 vue-i18n

```bash
# 进入项目目录
cd /Users/hooksvue/Desktop/h5lookviewsFrontend

# 只安装 vue-i18n
npm install vue-i18n@9

# 启动开发服务器
npm run dev
```

### 方法 3：使用 pnpm（如果有）

```bash
pnpm install vue-i18n@9
pnpm dev
```

## ✅ 验证安装成功

安装完成后，检查以下内容：

### 1. 检查依赖是否安装

```bash
npm list vue-i18n
```

应该看到：
```
vue-i18n@9.9.0
```

### 2. 检查文件是否存在

```bash
ls node_modules/vue-i18n
```

应该看到 vue-i18n 目录

### 3. 启动开发服务器

```bash
npm run dev
```

应该正常启动，没有报错

##  测试国际化功能

1. 打开浏览器访问 `http://localhost:5173`
2. 进入设置页面 `/settings`
3. 点击"语言设置"
4. 选择不同语言（简体中文、繁體中文、English、日本語）
5. 观察页面文本是否立即切换

## 🐛 如果还有问题

### 清除缓存重新安装

```bash
# 删除 node_modules 和锁文件
rm -rf node_modules
rm package-lock.json

# 清除 npm 缓存
npm cache clean --force

# 重新安装
npm install

# 启动
npm run dev
```

### 检查 Node.js 版本

```bash
node -v
npm -v
```

推荐：
- Node.js >= 16.0.0
- npm >= 8.0.0

## 📞 需要帮助？

如果安装失败，请提供以下信息：

1. Node.js 版本
2. npm 版本
3. 错误信息截图或日志
4. 操作系统信息

---

**注意：** 本项目国际化已完整配置，只需安装 vue-i18n 依赖包即可使用！
