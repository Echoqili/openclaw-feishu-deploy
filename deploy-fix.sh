#!/bin/bash

echo "========================================="
echo "部署新闻推送系统 - 修复重复发送问题"
echo "========================================="

cd /root/openclaw-feishu-deploy

# 1. 拉取最新代码
echo "[1/3] 拉取最新代码..."
git pull gitee master

# 2. 重启容器（让新代码生效）
echo "[2/3] 重启容器..."
docker restart news-bot

# 3. 等待容器启动
echo "[3/3] 等待容器启动..."
sleep 5

# 4. 查看状态
echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "查看容器状态："
docker ps | grep news-bot
echo ""
echo "查看实时日志："
docker logs -f news-bot --tail 20
