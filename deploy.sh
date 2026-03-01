#!/bin/bash

echo "========================================="
echo "部署新闻推送系统 - Docker 方式"
echo "========================================="
echo ""

cd /root/openclaw-feishu-deploy

echo "========================================="
echo "[1/4] 停止旧容器..."
echo "========================================="
docker stop news-bot-docker 2>/dev/null || echo "没有运行中的容器"
docker rm news-bot-docker 2>/dev/null || echo "没有已停止的容器"

echo ""
echo "========================================="
echo "[2/4] 删除旧镜像..."
echo "========================================="
docker rmi news-bot:latest 2>/dev/null || echo "镜像不存在"

echo ""
echo "========================================="
echo "[3/4] 构建新镜像..."
echo "========================================="
docker build -t news-bot:latest .

if [ $? -ne 0 ]; then
    echo "Docker 镜像构建失败!"
    exit 1
fi

echo ""
echo "========================================="
echo "[4/4] 启动新容器..."
echo "========================================="
docker run -d \
  --name news-bot-docker \
  -v $(pwd)/config/config.json:/app/config/config.json \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/logs:/app/logs \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  news-bot:latest

echo ""
echo "========================================="
echo "容器状态:"
echo "========================================="
docker ps | grep news-bot

echo ""
echo "========================================="
echo "部署完成!"
echo "========================================="
echo ""
echo "查看日志命令: docker logs -f news-bot-docker"
echo "停止服务命令: docker stop news-bot-docker"
