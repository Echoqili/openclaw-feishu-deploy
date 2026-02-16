#!/bin/bash

echo "========================================="
echo "新闻抓取与飞书推送系统"
echo "========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装 Node.js"
    echo "请先安装 Node.js 22 或更高版本"
    exit 1
fi

echo "Node.js 版本: $(node -v)"
echo ""

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
    echo ""
fi

# 检查配置
if [ ! -f "config.json" ]; then
    echo "警告: 未找到 config.json 配置文件"
    echo "请复制 config.json.example 并填写配置"
    exit 1
fi

# 创建必要的目录
mkdir -p output
mkdir -p logs

echo "启动服务..."
echo ""

# 启动
node main.js
