#!/bin/bash

echo "========================================="
echo "OpenClaw 测试脚本"
echo "========================================="

# 检查OpenClaw是否安装
echo "[1/5] 检查OpenClaw安装状态..."
if command -v openclaw &> /dev/null; then
    echo "✓ OpenClaw已安装"
    openclaw --version || echo "OpenClaw版本信息"
else
    echo "✗ OpenClaw未安装"
    echo "请先安装OpenClaw: npm install -g openclaw@latest"
    exit 1
fi

# 检查配置文件
echo ""
echo "[2/5] 检查配置文件..."
if [ -f ~/.openclaw/openclaw.json ]; then
    echo "✓ 配置文件存在"
    echo "配置文件大小: $(ls -lh ~/.openclaw/openclaw.json | awk '{print $5}')"
    
    # 检查配置文件内容
    echo ""
    echo "配置摘要:"
    cat ~/.openclaw/openclaw.json | grep -E '(model|apiKey|appId)' | head -10
else
    echo "✗ 配置文件不存在"
    echo "请先运行配置脚本: ./configure_openclaw.sh"
    exit 1
fi

# 检查火山引擎API Secret
echo ""
echo "[3/5] 检查火山引擎API配置..."
API_SECRET=$(grep -E '"apiSecret":' ~/.openclaw/openclaw.json | head -1 | awk -F'"' '{print $4}')
if [ -n "$API_SECRET" ] && [ "$API_SECRET" != "" ]; then
    echo "✓ 火山引擎API Secret已配置"
else
    echo "✗ 火山引擎API Secret未配置"
    echo "请在配置文件中添加API Secret"
    echo "编辑配置文件: vim ~/.openclaw/openclaw.json"
fi

# 检查端口
echo ""
echo "[4/5] 检查端口状态..."
PORT=18789
if lsof -i :$PORT &> /dev/null; then
    echo "✓ 端口 $PORT 已被占用(可能已启动)"
    lsof -i :$PORT
else
    echo "✗ 端口 $PORT 未被占用(服务未启动)"
    echo "请启动服务: openclaw gateway --port $PORT --verbose"
fi

# 测试命令
echo ""
echo "[5/5] 测试命令..."
echo "可用的OpenClaw命令:"
openclaw --help | head -20

echo ""
echo "========================================="
echo "测试完成!"
echo "========================================="
echo ""
echo "建议操作:"
echo "1. 确保火山引擎API Secret已配置"
echo "2. 启动OpenClaw服务: openclaw gateway --port 18789 --verbose"
echo "3. 测试模型: openclaw agent --message '你好，测试GLM-4.7模型'"
echo "4. 测试飞书: openclaw message send --to feishu --message '测试飞书连接'"
echo ""
