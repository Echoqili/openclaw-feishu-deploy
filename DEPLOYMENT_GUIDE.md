# OpenClaw + Trae-CN + SSH MCP 完整部署指南

> 基于 Trae-CN IDE 和 SSH MCP 工具，实现 OpenClaw 新闻推送系统的开发、部署和运维全流程

---

## 📋 目录

- [项目简介](#项目简介)
- [环境准备](#环境准备)
- [本地开发配置](#本地开发配置)
- [SSH MCP 配置](#ssh-mcp-配置)
- [服务器部署](#服务器部署)
- [日常运维](#日常运维)
- [故障排查](#故障排查)
- [安全最佳实践](#安全最佳实践)

---

## 项目简介

### OpenClaw 是什么？

OpenClaw 是一个自动化的新闻抓取与推送系统，主要功能：

- 🕷️ **智能抓取**：从 ZAKER 等新闻源抓取最新新闻
- 🤖 **AI 分类**：使用火山引擎大模型对新闻进行分类和摘要
- 📊 **图片生成**：自动生成新闻摘要图片
- 📱 **飞书推送**：将新闻推送到飞书群聊
- ⏰ **定时任务**：每天 10:30 和 22:30 自动执行

### 技术栈

- **后端**：Node.js + Axios + Cheerio
- **AI 模型**：火山引擎方舟大模型
- **图片生成**：Canvas
- **推送平台**：飞书开放平台
- **部署方式**：Docker
- **开发工具**：Trae-CN IDE + SSH MCP

---

## 环境准备

### 1. 本地环境

#### 必装软件

```bash
# Node.js (推荐 v22+)
node -v

# Git
git --version

# Trae-CN IDE
# 下载地址：https://www.trae.cn/
```

#### 可选工具

```bash
# Windows Terminal (Windows 用户推荐)
# PowerShell 7+
```

### 2. 服务器环境

#### 基础要求

- 操作系统：Linux (Ubuntu/CentOS)
- Docker: 20.10+
- 内存：≥ 1GB
- 磁盘：≥ 10GB
- 网络：可访问外网

#### 检查 Docker

```bash
docker -v
docker-compose -v
```

### 3. SSH MCP 工具

#### 什么是 SSH MCP？

SSH MCP 是 Trae-CN 的 SSH 连接插件，支持：
- 远程服务器连接
- 命令执行和脚本运行
- 文件传输（SFTP）
- Docker 容器管理
- 后台任务执行

#### 安装和配置

**GitHub 仓库**: https://github.com/Echoqili/ssh-licco

**配置步骤**：

1. 在 Trae-CN 中配置 SSH 连接
2. 保存服务器信息（主机、端口、用户名、密码/密钥）
3. 连接后即可执行远程命令

**常用命令**：

```javascript
// 连接 SSH
mcp_ssh_ssh_connect({
  host: "your_server_ip",
  port: 22,
  username: "root",
  password: "your_password"  // 或使用 private_key_path
})

// 执行命令
mcp_ssh_ssh_execute({
  session_id: "session_id",
  command: "docker ps"
})

// 文件传输
mcp_ssh_ssh_file_transfer({
  session_id: "session_id",
  local_path: "./file.txt",
  remote_path: "/remote/path/file.txt",
  direction: "upload"  // 或 "download"
})

// 后台任务（如 Docker 构建）
mcp_ssh_ssh_background_task({
  session_id: "session_id",
  command: "docker build -t news-bot:latest ."
})
```

### 4. 第三方服务配置

#### 火山引擎（AI 模型）

1. 访问：https://console.volcengine.com/ark
2. 创建应用，获取 API Key
3. 记录 Endpoint 和 Model ID

#### 飞书开放平台（消息推送）

1. 访问：https://open.feishu.cn/
2. 创建企业应用
3. 获取 App ID 和 App Secret
4. 添加机器人到群聊，获取 Chat ID

#### 腾讯云 CloudBase（可选，历史记录存储）

1. 访问：https://console.cloud.tencent.com/cloudbase
2. 创建环境
3. 获取环境 ID 和密钥

---

## 本地开发配置

### 1. 克隆项目

```bash
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入真实配置
# Windows: notepad .env
# Linux/Mac: vim .env
```

#### .env 配置示例

```bash
# 火山引擎 API 配置
VOLCANO_API_KEY=your_api_key_here
VOLCANO_API_SECRET=your_api_secret_here
VOLCANO_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions
VOLCANO_MODEL=your_model_id_here

# 飞书机器人配置
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_CHAT_IDS=your_chat_id_1,your_chat_id_2

# 腾讯云 CloudBase 配置（可选）
CLOUDBASE_ENV=your_env_id_here
CLOUDBASE_SECRET_ID=your_secret_id_here
CLOUDBASE_SECRET_KEY=your_secret_key_here

# 新闻抓取配置
NEWS_LIMIT=50
SELECTED_LIMIT=30

# 定时任务配置
CRON_EXPRESSION=30 10,22 * * *
```

> ⚠️ **重要提示**：请将 `your_xxx_here` 替换为您自己的配置信息，不要使用示例中的值！

### 4. 本地测试

```bash
# 测试模式运行一次
npm run test

# 或手动执行一次
npm run once

# 开发模式（监听文件变化）
npm run dev
```

### 5. 在 Trae-CN 中开发

#### 打开项目

1. 启动 Trae-CN IDE
2. 文件 → 打开文件夹 → 选择项目目录

#### 常用快捷键

```
Ctrl+`          # 打开终端
Ctrl+Shift+P    # 命令面板
Ctrl+P          # 快速打开文件
F5              # 调试
Ctrl+S          # 保存
```

#### 配置调试

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动新闻机器人",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "once"],
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

---

## SSH MCP 配置

### 1. 什么是 SSH MCP？

SSH MCP 是 Trae-CN 的 SSH 连接工具，可以：
- 直接连接远程服务器
- 执行命令和脚本
- 传输文件
- 管理 Docker 容器

### 2. 配置 SSH 连接

#### 方式一：使用 MCP 工具配置

在 Trae-CN 中调用 SSH MCP 工具：

```javascript
// 配置 SSH 连接
mcp_ssh_ssh_config({
  host: "43.143.207.242",
  port: 22,
  username: "root",
  password: "your_password"
})
```

#### 方式二：手动配置

创建 SSH 配置文件 `~/.ssh/config`：

```bash
Host news-server
    HostName 43.143.207.242
    User root
    Port 22
    PasswordAuthentication yes
```

### 3. 连接服务器

```bash
# 使用 MCP 工具连接
mcp_ssh_ssh_connect({
  host: "43.143.207.242",
  username: "root",
  password: "your_password"
})

# 或使用命令行
ssh root@43.143.207.242
```

### 4. 常用 SSH MCP 命令

```javascript
// 执行远程命令
mcp_ssh_ssh_execute({
  session_id: "your_session_id",
  command: "docker ps"
})

// 文件传输
mcp_ssh_ssh_file_transfer({
  session_id: "your_session_id",
  local_path: "./config/config.json",
  remote_path: "/root/openclaw-feishu-deploy/config/config.json",
  direction: "upload"
})

// 后台任务（如 Docker 构建）
mcp_ssh_ssh_background_task({
  session_id: "your_session_id",
  command: "docker build -t news-bot:latest ."
})

// 检查任务状态
mcp_ssh_ssh_task_status({
  session_id: "your_session_id",
  task_id: "your_task_id"
})
```

---

## 服务器部署

### 方式一：使用 SSH MCP 部署（推荐）

#### 1. 连接服务器

```javascript
// 连接 SSH
const session = await mcp_ssh_ssh_connect({
  host: "43.143.207.242",
  username: "root",
  password: "your_password"
});
```

#### 2. 拉取最新代码

```javascript
await mcp_ssh_ssh_execute({
  session_id: session.session_id,
  command: `
    cd /root/openclaw-feishu-deploy
    git pull gitee master
  `
});
```

#### 3. 构建 Docker 镜像

```javascript
await mcp_ssh_ssh_execute({
  session_id: session.session_id,
  command: `
    cd /root/openclaw-feishu-deploy
    docker build -t news-bot:latest .
  `
});
```

#### 4. 重启容器

```javascript
await mcp_ssh_ssh_execute({
  session_id: session.session_id,
  command: `
    docker stop news-bot
    docker rm news-bot
    docker run -d \\
      --name news-bot \\
      -v /root/openclaw-feishu-deploy/config/config.json:/app/config/config.json \\
      -v /root/openclaw-feishu-deploy/output:/app/output \\
      -v /root/openclaw-feishu-deploy/history:/app/history \\
      -v /root/openclaw-feishu-deploy/logs:/app/logs \\
      -e TZ=Asia/Shanghai \\
      --restart unless-stopped \\
      news-bot:latest
  `
});
```

### 方式二：使用部署脚本

#### 创建部署脚本 `deploy.sh`

```bash
#!/bin/bash

echo "========================================="
echo "OpenClaw 新闻推送系统 - 一键部署脚本"
echo "========================================="

cd /root/openclaw-feishu-deploy

# 1. 拉取最新代码
echo "[1/4] 拉取最新代码..."
git pull gitee master

# 2. 停止旧容器
echo "[2/4] 停止旧容器..."
docker stop news-bot 2>/dev/null || true
docker rm news-bot 2>/dev/null || true

# 3. 构建新镜像
echo "[3/4] 构建新镜像..."
docker build -t news-bot:latest .

# 4. 启动新容器
echo "[4/4] 启动新容器..."
docker run -d \
  --name news-bot \
  -v $(pwd)/config/config.json:/app/config/config.json \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/logs:/app/logs \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  news-bot:latest

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "查看状态：docker ps | grep news-bot"
echo "查看日志：docker logs -f news-bot"
```

#### 执行部署

```bash
chmod +x deploy.sh
./deploy.sh
```

### 方式三：使用 Docker Compose

#### 创建 `docker-compose.yml`

```yaml
version: '3.8'

services:
  news-bot:
    image: news-bot:latest
    container_name: news-bot
    volumes:
      - ./config/config.json:/app/config/config.json
      - ./output:/app/output
      - ./history:/app/history
      - ./logs:/app/logs
    environment:
      - TZ=Asia/Shanghai
    restart: unless-stopped
```

#### 部署命令

```bash
# 构建并启动
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启
docker-compose restart

# 停止
docker-compose down
```

---

## 日常运维

### 1. 查看运行状态

```bash
# 查看容器状态
docker ps | grep news-bot

# 查看实时日志
docker logs -f news-bot

# 查看最近 100 行日志
docker logs --tail 100 news-bot

# 查看资源使用
docker stats news-bot
```

### 2. 手动执行任务

```bash
# 立即执行一次新闻抓取和推送
docker exec news-bot node src/main.js --once

# 测试模式
docker exec news-bot node src/main.js --test
```

### 3. 修改配置

```bash
# 编辑配置文件
vim /root/openclaw-feishu-deploy/config/config.json

# 重启容器使配置生效
docker restart news-bot
```

### 4. 更新代码

```bash
# 进入项目目录
cd /root/openclaw-feishu-deploy

# 拉取最新代码
git pull gitee master

# 重启容器（代码会自动生效）
docker restart news-bot
```

### 5. 数据管理

```bash
# 查看已发送新闻历史记录
cat /root/openclaw-feishu-deploy/history/sent_news.json

# 查看执行日志
cat /root/openclaw-feishu-deploy/logs/news-$(date +%Y-%m-%d).json

# 查看生成的图片
ls -lh /root/openclaw-feishu-deploy/output/
```

### 6. 备份配置

```bash
# 备份配置文件
cp /root/openclaw-feishu-deploy/config/config.json /backup/config-$(date +%Y%m%d).json

# 备份历史记录
tar -czf /backup/history-$(date +%Y%m%d).tar.gz /root/openclaw-feishu-deploy/history/
```

---

## 故障排查

### 问题 1：容器无法启动

```bash
# 查看错误日志
docker logs news-bot

# 检查配置文件
docker exec news-bot cat /app/config/config.json

# 检查端口占用
docker ps | grep news-bot
```

### 问题 2：无法抓取新闻

**症状**：日志显示 `getaddrinfo EAI_AGAIN www.myzaker.com`

**解决方案**：

```bash
# 检查容器网络
docker exec news-bot ping -c 2 www.baidu.com

# 检查 DNS 配置
docker exec news-bot cat /etc/resolv.conf

# 重启 Docker 服务
systemctl restart docker

# 重启容器
docker restart news-bot
```

### 问题 3：飞书推送失败

**症状**：日志显示 `获取飞书访问令牌失败`

**解决方案**：

```bash
# 检查配置
docker exec news-bot cat /app/config/config.json | grep feishu

# 验证 App ID 和 Secret
# 访问飞书开放平台：https://open.feishu.cn/

# 检查网络连接
docker exec news-bot curl -I https://open.feishu.cn
```

### 问题 4：AI 分类失败

**症状**：日志显示火山引擎 API 调用失败

**解决方案**：

```bash
# 检查 API Key 配置
docker exec news-bot cat /app/config/config.json | grep volcano

# 测试 API 连接
docker exec news-bot curl -X POST \
  https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"ep-20260228235730-b8l6d","messages":[{"role":"user","content":"test"}]}'
```

### 问题 5：图片生成失败

**症状**：日志显示字体加载失败

**解决方案**：

```bash
# 检查中文字体
docker exec news-bot ls /usr/share/fonts/

# 重新构建镜像（确保安装字体）
docker build --no-cache -t news-bot:latest .
```

### 问题 6：定时任务不执行

**解决方案**：

```bash
# 查看容器运行时间
docker inspect news-bot | grep StartedAt

# 检查时区设置
docker exec news-bot date

# 手动执行一次验证
docker exec news-bot node src/main.js --once

# 查看定时任务日志
docker logs news-bot | grep "定时任务"
```

---

## 安全最佳实践

### 1. 敏感信息管理

✅ **正确做法**：

```bash
# 使用环境变量
docker run -e VOLCANO_API_KEY=your_key news-bot

# 或使用本地配置文件（不提交到 Git）
vim config/config.json
chmod 600 config/config.json
```

❌ **错误做法**：

```bash
# 不要将配置文件提交到 Git
git add config/config.json  # ❌

# 不要在代码中硬编码密钥
const apiKey = "ff64f55a-..."  # ❌
```

### 2. Git 配置

#### .gitignore 配置

```gitignore
# 敏感配置文件
.env
config/config.json

# 输出文件
output/
history/
logs/

# 依赖
node_modules/
```

#### 如果已提交敏感信息

```bash
# 从 Git 历史中移除
git rm --cached config/config.json
git commit -m "移除敏感配置文件"

# 如果已推送到远程，需要重写历史或轮换密钥
```

### 3. 服务器安全

```bash
# 1. 配置防火墙
firewall-cmd --add-port=22/tcp --permanent
firewall-cmd --reload

# 2. 使用 SSH 密钥登录（替代密码）
ssh-keygen -t ed25519
ssh-copy-id root@your_server

# 3. 限制 SSH 登录
vim /etc/ssh/sshd_config
# PermitRootLogin prohibit-password
# PasswordAuthentication no

# 4. 定期更新系统
apt update && apt upgrade -y
```

### 4. Docker 安全

```bash
# 1. 使用只读文件系统（可选）
docker run --read-only news-bot

# 2. 限制资源使用
docker run --memory="512m" --cpus="1.0" news-bot

# 3. 使用非 root 用户
# 在 Dockerfile 中添加
USER node
```

### 5. 密钥轮换

建议每 3-6 个月轮换一次密钥：

1. 火山引擎 API Key
2. 飞书 App Secret
3. 腾讯云密钥
4. SSH 密钥

---

## 附录

### A. 常用命令速查

```bash
# 本地开发
npm install              # 安装依赖
npm run test            # 测试运行
npm run once            # 执行一次
npm run dev             # 开发模式

# Git 操作
git pull gitee master   # 拉取代码
git add .               # 添加文件
git commit -m "msg"     # 提交
git push gitee master   # 推送

# Docker 操作
docker ps               # 查看容器
docker logs -f news-bot # 查看日志
docker restart news-bot # 重启
docker exec -it news-bot sh  # 进入容器

# SSH MCP 操作
mcp_ssh_ssh_connect     # 连接服务器
mcp_ssh_ssh_execute     # 执行命令
mcp_ssh_ssh_file_transfer # 传输文件
```

### B. 配置文件说明

#### config.json 完整配置

```json
{
  "volcanoApiKey": "your_api_key_here",
  "volcanoApiSecret": "your_api_secret_here",
  "volcanoEndpoint": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  "volcanoModel": "your_model_id_here",
  "feishuAppId": "your_app_id_here",
  "feishuAppSecret": "your_app_secret_here",
  "feishuChatIds": ["your_chat_id_1", "your_chat_id_2"],
  "cloudbaseEnv": "your_env_id_here",
  "cloudbaseSecretId": "your_secret_id_here",
  "cloudbaseSecretKey": "your_secret_key_here",
  "newsLimit": 50,
  "selectedLimit": 30,
  "outputDir": "./output",
  "historyDir": "./history",
  "maxHistoryDays": 7,
  "cronExpression": "30 10,22 * * *"
}
```

> ⚠️ **重要提示**：配置文件中的敏感信息不应提交到 Git 仓库！

### C. 相关资源

- **项目仓库**：https://gitee.com/liccolicco/openclaw-feishu-deploy
- **Trae-CN 官网**：https://www.trae.cn/
- **SSH MCP 工具**：https://github.com/Echoqili/ssh-licco
- **火山引擎**：https://www.volcengine.com/
- **飞书开放平台**：https://open.feishu.cn/
- **Docker 文档**：https://docs.docker.com/

---

## 更新日志

- **2026-03-04**：优化新闻爬虫过滤规则，实现敏感信息隔离
- **2026-03-03**：修复 Docker 容器网络问题
- **2026-03-02**：添加 SSH MCP 部署支持
- **2026-03-01**：初始版本发布

---

**祝您使用愉快！** 🎉

如有问题，请提交 Issue 或联系开发者。
