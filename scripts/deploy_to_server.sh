#!/bin/bash

echo "========================================"
echo "OpenClaw 新闻机器人 - 服务器部署脚本"
echo "========================================"
echo ""

# 进入项目目录
cd /root/openclaw-feishu-deploy || exit 1

echo "[1/5] 拉取最新代码..."
git pull origin dev
if [ $? -ne 0 ]; then
    echo "❌ 代码拉取失败"
    exit 1
fi
echo "✅ 代码拉取成功"
echo ""

echo "[2/5] 安装依赖..."
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装成功"
echo ""

echo "[3/5] 检查配置文件..."
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，请复制示例文件并配置"
    echo "    cp .env.example .env"
    echo "    vi .env"
    exit 1
fi

if [ ! -f "config/config.json" ]; then
    echo "⚠️  未找到 config.json，请复制示例文件并配置"
    echo "    cp config/config.json.example config/config.json"
    echo "    vi config/config.json"
    exit 1
fi
echo "✅ 配置文件检查通过"
echo ""

echo "[4/5] 停止旧服务..."
pm2 stop news-bot 2>/dev/null || true
pm2 delete news-bot 2>/dev/null || true
echo "✅ 旧服务已停止"
echo ""

echo "[5/5] 启动新服务..."
pm2 start src/main.js --name news-bot
if [ $? -ne 0 ]; then
    echo "❌ 服务启动失败"
    exit 1
fi

pm2 save
echo "✅ 新服务已启动"
echo ""

echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "查看日志：pm2 logs news-bot"
echo "查看状态：pm2 status"
echo "重启服务：pm2 restart news-bot"
echo ""
