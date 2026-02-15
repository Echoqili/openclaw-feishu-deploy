#!/bin/bash

echo "========================================="
echo "新闻抓取与飞书推送系统 - 完整部署"
echo "========================================="

# 1. 检查系统环境
echo "[1/6] 检查系统环境..."
uname -a
cat /etc/os-release

# 2. 安装Node.js (需要≥22版本)
echo ""
echo "[2/6] 检查并安装Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo "当前Node.js版本: $(node -v)"
    if [ "$NODE_VERSION" -lt 22 ]; then
        echo "Node.js版本过低,需要≥22版本,正在升级..."
        curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
        yum install -y nodejs
    else
        echo "Node.js版本符合要求"
    fi
else
    echo "未安装Node.js,正在安装Node.js 22..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    yum install -y nodejs
fi

# 验证Node.js版本
echo "Node.js版本: $(node -v)"
echo "npm版本: $(npm -v)"

# 3. 安装系统依赖（用于 canvas 模块）
echo ""
echo "[3/6] 安装系统依赖..."
if command -v yum &> /dev/null; then
    yum install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
elif command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
fi

# 4. 安装项目依赖
echo ""
echo "[4/6] 安装项目依赖..."
npm config set registry https://registry.npmmirror.com/
npm install

# 5. 创建配置文件
echo ""
echo "[5/6] 创建配置文件..."
mkdir -p ~/.news-bot
mkdir -p output
mkdir -p logs

if [ ! -f "config.json" ]; then
    cat > config.json << 'EOF'
{
  "volcanoApiKey": "YOUR_VOLCANO_API_KEY_HERE",
  "volcanoApiSecret": "",
  "volcanoEndpoint": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  "feishuAppId": "YOUR_FEISHU_APP_ID_HERE",
  "feishuAppSecret": "YOUR_FEISHU_APP_SECRET_HERE",
  "feishuChatIds": [],
  "newsLimit": 30,
  "outputDir": "./output",
  "cronExpression": "0 10 * * *"
}
EOF
    echo "已创建默认配置文件 config.json"
else
    echo "配置文件已存在"
fi

# 6. 配置 systemd 服务（可选）
echo ""
echo "[6/6] 配置系统服务..."
read -p "是否配置为系统服务？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_FILE="/etc/systemd/system/news-bot.service"
    WORK_DIR=$(pwd)
    
    cat > $SERVICE_FILE << EOF
[Unit]
Description=News Bot Service - 自动新闻抓取与飞书推送
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WORK_DIR
ExecStart=/usr/bin/node main.js
Restart=on-failure
RestartSec=10
StandardOutput=append:$WORK_DIR/logs/service.log
StandardError=append:$WORK_DIR/logs/service-error.log

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable news-bot
    
    echo "系统服务配置完成！"
    echo ""
    echo "管理命令："
    echo "  启动: systemctl start news-bot"
    echo "  停止: systemctl stop news-bot"
    echo "  状态: systemctl status news-bot"
    echo "  日志: journalctl -u news-bot -f"
fi

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "配置信息:"
echo "  - 火山引擎 API Key: 已配置"
echo "  - 飞书 App ID: YOUR_FEISHU_APP_ID_HERE"
echo "  - 飞书 App Secret: 已配置"
echo "  - 定时任务: 每天 10:00"
echo ""
echo "重要提示:"
echo "  1. 请修改 config.json 文件，填写飞书群 ID"
echo "  2. 获取飞书群 ID: node -e \"const s=require('./feishu_sender');new s().getChatList().then(console.log)\""
echo ""
echo "测试运行:"
echo "  npm run test"
echo ""
echo "启动服务:"
echo "  如果配置了系统服务: systemctl start news-bot"
echo "  否则: nohup node main.js > logs/bot.log 2>&1 &"
echo ""
echo "查看日志:"
echo "  tail -f logs/news-*.json"
echo ""
echo "========================================="
