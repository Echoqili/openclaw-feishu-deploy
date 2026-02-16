#!/bin/bash

# 新闻推送系统 - 服务器部署和测试脚本
# 服务器: 43.143.207.242
# 用户: root

echo "========================================="
echo "新闻推送系统 - 自动部署"
echo "========================================="
echo ""

PROJECT_DIR="/root/openclaw-feishu-deploy"

# 步骤 1: 检查并更新项目
echo "[步骤 1/7] 检查并更新项目..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "克隆项目..."
    cd /root
    git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
    cd $PROJECT_DIR
else
    echo "更新项目..."
    cd $PROJECT_DIR
    git fetch origin
    git reset --hard origin/master
fi
echo "✓ 项目已更新到最新版本"
echo ""

# 步骤 2: 检查 Node.js
echo "[步骤 2/7] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 22..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    yum install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "Node.js 版本: $(node -v)"

if [ "$NODE_VERSION" -lt 22 ]; then
    echo "升级 Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    yum install -y nodejs
fi
echo "✓ Node.js 已就绪"
echo ""

# 步骤 3: 安装系统依赖
echo "[步骤 3/7] 安装系统依赖..."
yum install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel 2>/dev/null
echo "✓ 系统依赖已安装"
echo ""

# 步骤 4: 安装项目依赖
echo "[步骤 4/7] 安装项目依赖..."
npm config set registry https://registry.npmmirror.com/
npm install --production
echo "✓ 项目依赖已安装"
echo ""

# 步骤 5: 创建必要目录
echo "[步骤 5/7] 创建必要目录..."
mkdir -p output logs history
echo "✓ 目录已创建"
echo ""

# 步骤 6: 显示配置
echo "[步骤 6/7] 检查配置..."
echo "配置信息:"
echo "  - 飞书群 ID: $(grep -o '"feishuChatIds": \[[^]]*\]' config.json)"
echo "  - 定时任务: $(grep -o '"cronExpression": "[^"]*"' config.json)"
echo "  - 新闻抓取数量: $(grep -o '"newsLimit": [0-9]*' config.json)"
echo "  - 精选数量: $(grep -o '"selectedLimit": [0-9]*' config.json)"
echo ""

# 步骤 7: 停止旧进程（如果存在）
echo "[步骤 7/7] 清理旧进程..."
pkill -f "node main.js" 2>/dev/null
sleep 2
echo "✓ 旧进程已清理"
echo ""

echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "功能特性:"
echo "  ✓ 每天 10:00 和 22:00 自动推送"
echo "  ✓ 新闻去重，不重复推送"
echo "  ✓ 智能精选，确保高质量内容"
echo "  ✓ 分类多样，覆盖多个领域"
echo ""
echo "接下来："
echo ""
echo "1. 立即测试运行:"
echo "   cd /root/openclaw-feishu-deploy"
echo "   node main.js --test"
echo ""
echo "2. 启动定时任务（后台运行）:"
echo "   nohup node main.js > logs/bot.log 2>&1 &"
echo ""
echo "3. 使用 PM2 管理（推荐）:"
echo "   pm2 start main.js --name news-bot"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. 查看日志:"
echo "   tail -f logs/bot.log"
echo ""
echo "========================================="
