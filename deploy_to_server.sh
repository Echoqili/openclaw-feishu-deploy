#!/bin/bash

# 服务器信息
SERVER_IP="43.143.207.242"
SERVER_USER="root"
PROJECT_DIR="/root/openclaw-feishu-deploy"

echo "========================================="
echo "部署新闻推送系统到服务器"
echo "========================================="
echo ""

# 连接服务器并执行部署
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'

echo "连接到服务器成功！"
echo ""

# 检查项目目录
if [ ! -d "/root/openclaw-feishu-deploy" ]; then
    echo "克隆项目..."
    cd /root
    git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
    cd openclaw-feishu-deploy
else
    echo "更新项目代码..."
    cd /root/openclaw-feishu-deploy
    git pull origin master
fi

echo ""
echo "检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    yum install -y nodejs
fi

echo "Node.js 版本: $(node -v)"
echo ""

echo "安装系统依赖（canvas 需要）..."
yum install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel 2>/dev/null || true

echo ""
echo "安装项目依赖..."
npm config set registry https://registry.npmmirror.com/
npm install

echo ""
echo "创建必要目录..."
mkdir -p output logs

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""

ENDSSH

echo ""
echo "部署脚本执行完成！"
