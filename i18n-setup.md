# 国际化（i18n）安装说明

## 📦 安装依赖

项目已配置好 vue-i18n 国际化支持，但需要安装依赖包：

```bash
# 方式 1：安装所有依赖（推荐）
npm install

# 方式 2：只安装 vue-i18n
npm install vue-i18n@9
```

## ✅ 验证安装

安装完成后，运行以下命令验证：

```bash
# 检查依赖是否安装成功
npm list vue-i18n

# 类型检查
npm run type-check

# 启动开发服务器
npm run dev
```

## 🌍 支持的语言

- 🇨🇳 简体中文 (zh-CN)
- 🇹🇼 繁體中文 (zh-TW)  
- 🇺🇸 English (en-US)
- 🇯🇵 日本語 (ja-JP)

## 📁 文件结构

```
src/i18n/
├── index.ts              # i18n 配置入口
└── locales/
    ├── zh-CN.ts         # 简体中文语言包
    ├── zh-TW.ts         # 繁体中文语言包
    ├── en-US.ts         # 英文语言包
    └── ja-JP.ts         # 日文语言包
```

## 🔧 使用方法

### 在组件中使用

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div>{{ t('common.confirm') }}</div>
  <button>{{ t('settings.logout') }}</button>
</template>
```

### 切换语言

```typescript
import { setLocale } from '@/i18n'

// 切换到英文
setLocale('en-US')

// 切换到日文
setLocale('ja-JP')
```

## 🎯 已国际化的页面

- ✅ Settings.vue - 设置页面（完整国际化）
- ⏳ 其他页面待国际化

## 🐛 常见问题

### Q: 类型检查报错 "Cannot find module 'vue-i18n'"

**A:** 运行 `npm install` 安装依赖

### Q: 页面显示 translation key 而不是文本

**A:** 检查语言包中是否有对应的翻译键值

### Q: 如何添加新的翻译

**A:** 在 `src/i18n/locales/` 对应的语言文件中添加新的键值对

## 📝 下一步

1. 运行 `npm install` 安装依赖
2. 启动开发服务器测试国际化功能
3. 在设置页面切换语言体验效果
