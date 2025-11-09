#!/bin/bash

echo "🌍 开始安装 vue-i18n 国际化依赖..."
echo ""

# 检查 npm 是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

# 安装 vue-i18n
echo "📦 正在安装 vue-i18n@9..."
npm install vue-i18n@9

# 检查安装是否成功
if [ -d "node_modules/vue-i18n" ]; then
    echo ""
    echo "✅ vue-i18n 安装成功！"
    echo ""
    echo "📝 支持的语言:"
    echo "  🇨🇳 简体中文 (zh-CN)"
    echo "  🇹🇼 繁體中文 (zh-TW)"
    echo "  🇺🇸 English (en-US)"
    echo "  🇯🇵 日本語 (ja-JP)"
    echo ""
    echo "🚀 下一步:"
    echo "  1. 运行 npm run dev 启动开发服务器"
    echo "  2. 访问设置页面测试语言切换功能"
    echo "  3. 查看 i18n-setup.md 了解更多使用方法"
    echo ""
else
    echo ""
    echo "❌ 安装失败，请手动运行: npm install vue-i18n@9"
    exit 1
fi
