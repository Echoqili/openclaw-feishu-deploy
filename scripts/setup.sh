#!/bin/bash

echo "========================================="
echo "新闻抓取与飞书推送系统 - 快速配置"
echo "========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装 Node.js"
    echo "请先安装 Node.js 22 或更高版本"
    echo ""
    echo "安装方法："
    echo "  curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -"
    echo "  yum install -y nodejs"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "Node.js 版本: $(node -v)"

if [ "$NODE_VERSION" -lt 22 ]; then
    echo "警告: Node.js 版本过低，建议升级到 22 或更高版本"
fi

echo ""
echo "[1/5] 安装依赖..."
npm install
echo ""

echo "[2/5] 创建配置文件..."
if [ ! -f "config.json" ]; then
    cat > config.json << 'EOF'
{
  "volcanoApiKey": "your_volcano_api_key",
  "volcanoApiSecret": "",
  "volcanoEndpoint": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  "feishuAppId": "your_feishu_app_id",
  "feishuAppSecret": "your_feishu_app_secret",
  "feishuChatIds": ["your_chat_id"],
  "newsLimit": 30,
  "outputDir": "./output",
  "cronExpression": "0 10 * * *"
}
EOF
    echo "已创建 config.json，请编辑此文件填写配置"
else
    echo "配置文件已存在"
fi
echo ""

echo "[3/5] 创建环境变量文件..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建 .env 文件，请编辑此文件填写配置"
else
    echo "环境变量文件已存在"
fi
echo ""

echo "[4/5] 创建必要目录..."
mkdir -p output
mkdir -p logs
echo "已创建 output 和 logs 目录"
echo ""

echo "[5/5] 设置执行权限..."
chmod +x start.sh
echo "已设置执行权限"
echo ""

echo "========================================="
echo "配置完成！"
echo "========================================="
echo ""
echo "后续步骤："
echo ""
echo "1. 编辑配置文件："
echo "   vim config.json"
echo "   或"
echo "   vim .env"
echo ""
echo "2. 填写以下必填配置："
echo "   - volcanoApiKey: 火山引擎 API Key"
echo "   - feishuAppId: 飞书应用 App ID"
echo "   - feishuAppSecret: 飞书应用 App Secret"
echo "   - feishuChatIds: 飞书群 ID（可以是多个）"
echo ""
echo "3. 获取飞书群 ID："
echo "   node -e \"const sender = require('./feishu_sender'); new sender().getChatList().then(console.log);\""
echo ""
echo "4. 测试运行："
echo "   npm run test"
echo "   或"
echo "   node main.js --test"
echo ""
echo "5. 启动定时任务："
echo "   npm start"
echo "   或"
echo "   ./start.sh"
echo ""
echo "6. 后台运行（推荐）："
echo "   nohup node main.js > news-bot.log 2>&1 &"
echo "   或使用 PM2："
echo "   pm2 start main.js --name news-bot"
echo ""
echo "========================================="
