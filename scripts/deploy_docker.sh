#!/bin/bash

set -e

PROJECT_NAME="news-bot"
COMPOSE_FILE="docker-compose.yml"

echo "========================================"
echo "OpenClaw 新闻机器人 - Docker 部署脚本"
echo "========================================"
echo ""

# 检查 docker 和 docker compose
echo "[0/5] 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif docker-compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose 未安装"
    exit 1
fi
echo "✅ Docker 环境检查通过 ($COMPOSE_CMD)"
echo ""

# 检查 .env 文件
echo "[1/5] 检查环境变量文件..."
if [ ! -f ".env" ]; then
    echo "❌ 未找到 .env 文件"
    echo "请先创建 .env 文件并配置环境变量"
    exit 1
fi
echo "✅ .env 文件存在"
echo ""

# 拉取最新代码
echo "[2/5] 拉取最新代码..."
git pull origin docker
if [ $? -ne 0 ]; then
    echo "⚠️  代码拉取失败或没有远程分支，继续使用当前代码"
fi
echo "✅ 代码准备完成"
echo ""

# 构建镜像
echo "[3/5] 构建 Docker 镜像..."
$COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败"
    exit 1
fi
echo "✅ 镜像构建成功"
echo ""

# 停止并移除旧容器
echo "[4/5] 停止旧容器..."
$COMPOSE_CMD -f $COMPOSE_FILE down
if [ $? -ne 0 ]; then
    echo "⚠️  停止旧容器时出现问题，继续部署"
fi
echo "✅ 旧容器已停止"
echo ""

# 启动新容器
echo "[5/5] 启动新容器..."
$COMPOSE_CMD -f $COMPOSE_FILE up -d
if [ $? -ne 0 ]; then
    echo "❌ 容器启动失败"
    exit 1
fi
echo "✅ 容器启动成功"
echo ""

echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "查看日志: $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
echo "查看状态: $COMPOSE_CMD -f $COMPOSE_FILE ps"
echo "停止服务: $COMPOSE_CMD -f $COMPOSE_FILE down"
echo "重启服务: $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "测试运行: $COMPOSE_CMD -f $COMPOSE_FILE exec news-bot node src/main.js --once"
echo ""
