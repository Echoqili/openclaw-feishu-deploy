#!/bin/bash

echo "========================================="
echo "新闻推送系统 - 一键部署"
echo "========================================="
echo ""

# 项目目录
PROJECT_DIR="/root/openclaw-feishu-deploy"

# 1. 克隆或更新项目
echo "[1/6] 获取项目代码..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "克隆项目..."
    cd /root
    git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
    cd $PROJECT_DIR
else
    echo "更新项目..."
    cd $PROJECT_DIR
    git pull origin master
fi
echo ""

# 2. 检查并安装 Node.js
echo "[2/6] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 22..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    yum install -y nodejs
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo "当前 Node.js 版本: $(node -v)"
    if [ "$NODE_VERSION" -lt 22 ]; then
        echo "升级 Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
        yum install -y nodejs
    fi
fi
echo "Node.js 版本: $(node -v)"
echo ""

# 3. 安装系统依赖
echo "[3/6] 安装系统依赖..."
yum install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel 2>/dev/null || echo "部分依赖可能已安装"
echo ""

# 4. 安装项目依赖
echo "[4/6] 安装项目依赖..."
npm config set registry https://registry.npmmirror.com/
npm install
echo ""

# 5. 创建必要目录
echo "[5/6] 创建必要目录..."
mkdir -p output logs
echo ""

# 6. 显示配置信息
echo "[6/6] 检查配置..."
if [ -f "config.json" ]; then
    echo "配置文件已存在"
    echo ""
    echo "配置信息:"
    echo "  - 飞书群 ID: $(grep -o '"feishuChatIds": \[[^]]*\]' config.json)"
    echo "  - 定时任务: $(grep -o '"cronExpression": "[^"]*"' config.json)"
else
    echo "警告: 配置文件不存在"
fi
echo ""

echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "后续操作:"
echo ""
echo "1. 测试运行:"
echo "   node main.js --test"
echo ""
echo "2. 启动服务:"
echo "   nohup node main.js > logs/bot.log 2>&1 &"
echo ""
echo "3. 查看日志:"
echo "   tail -f logs/bot.log"
echo ""
echo "4. 使用 PM2 管理（推荐）:"
echo "   npm install -g pm2"
echo "   pm2 start main.js --name news-bot"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "========================================="
