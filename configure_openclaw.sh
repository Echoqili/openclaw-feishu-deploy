#!/bin/bash

echo "========================================="
echo "OpenClaw 配置脚本 - 配置GLM-4.7模型和飞书"
echo "========================================="

# 创建配置目录
echo "[1/5] 创建配置目录..."
mkdir -p ~/.openclaw/workspace/skills

# 创建配置文件
echo "[2/5] 创建配置文件..."
cat > ~/.openclaw/openclaw.json << 'EOF'
{
  "agent": {
    "model": "volcengine/glm-4.7"
  },
  "models": {
    "volcengine": {
      "apiKey": "YOUR_VOLCANO_API_KEY_HERE",
      "apiSecret": "",
      "endpoint": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      "models": {
        "glm-4.7": {
          "name": "glm-4.7",
          "temperature": 0.7,
          "maxTokens": 8192
        }
      }
    }
  },
  "channels": {
    "feishu": {
      "appId": "YOUR_FEISHU_APP_ID_HERE",
      "appSecret": "YOUR_FEISHU_APP_SECRET_HERE"
    }
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0"
  }
}
EOF

echo "[3/5] 配置文件创建完成!"
echo ""
echo "========================================="
echo "配置信息摘要:"
echo "========================================="
echo "模型: volcengine/glm-4.7"
echo "火山引擎API Key: YOUR_VOLCANO_API_KEY_HERE"
echo "飞书App ID: YOUR_FEISHU_APP_ID_HERE"
echo "飞书App Secret: YOUR_FEISHU_APP_SECRET_HERE"
echo "服务端口: 18789"
echo ""
echo "========================================="
echo "后续步骤:"
echo "========================================="
echo "1. 请在火山引擎控制台获取API Secret"
echo "2. 将API Secret添加到配置文件中"
echo "3. 启动OpenClaw服务: openclaw gateway --port 18789 --verbose"
echo "4. 测试服务: openclaw agent --message '你好，测试GLM模型'"
echo ""
echo "========================================="
echo "配置完成!"
