#!/bin/bash

echo "========================================="
echo "OpenClaw 飞书机器人部署脚本"
echo "========================================="

# 1. 检查系统环境
echo "[1/7] 检查系统环境..."
uname -a
cat /etc/os-release

# 2. 安装Node.js (需要≥22版本)
echo ""
echo "[2/7] 检查并安装Node.js..."
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

# 3. 安装OpenClaw
echo ""
echo "[3/7] 安装OpenClaw..."
# 设置npm镜像加速
echo "设置npm镜像加速..."
npm config set registry https://registry.npmmirror.com/
npm install -g openclaw@latest

# 验证安装
openclaw --version || echo "OpenClaw安装完成"

# 4. 安装飞书插件
echo ""
echo "[4/7] 安装OpenClaw飞书插件..."
openclaw plugins install @m1heng-clawd/feishu || echo "飞书插件安装可能需要手动执行: openclaw plugins install @m1heng-clawd/feishu"

# 5. 创建配置目录
echo ""
echo "[5/7] 创建配置目录..."
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace/skills

# 6. 显示后续步骤
echo ""
echo "[6/7] 部署准备完成!"
echo ""
echo "========================================="
echo "后续配置步骤:"
echo "========================================="
echo ""
echo "1. 配置飞书开放平台应用:"
echo "   - 访问 https://open.feishu.cn/"
echo "   - 创建自建应用"
echo "   - 获取 App ID 和 App Secret"
echo "   - 配置机器人权限:"
echo "     * im:message (接收消息)"
echo "     * im:message:send_as_bot (发送消息)"
echo "   - 配置事件订阅:"
echo "     * im.message.receive_v1 (接收消息)"
echo "   - 设置消息推送地址:"
echo "     * http://YOUR_SERVER_IP:18789/webhook/feishu"
echo ""
echo "2. 配置OpenClaw:"
echo "   openclaw config"
echo "   依次选择: Local → Channels → Configure Feishu"
echo "   输入飞书应用的 App ID 和 App Secret"
echo ""
echo "3. 配置完成后启动服务:"
echo "   openclaw gateway --port 18789 --verbose"
echo ""
echo "4. 将机器人添加到飞书群组:"
echo "   - 在飞书群中添加机器人应用"
echo "   - 机器人即可接收和回复群消息"
echo ""
echo "========================================="

# 7. 检查安装状态
echo ""
echo "[7/7] 安装状态检查..."
which openclaw && echo "✓ OpenClaw已安装" || echo "✗ OpenClaw未安装"
node --version && echo "✓ Node.js已安装" || echo "✗ Node.js未安装"

echo ""
echo "部署脚本执行完成!"
