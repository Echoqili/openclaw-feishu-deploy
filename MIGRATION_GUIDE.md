# 新闻推送系统迁移部署指南

## 一、项目概述

自动抓取 ZAKER 新闻、智能分类、生成摘要图片，并通过飞书机器人定时推送。

### 核心功能
- 新闻抓取（ZAKER）
- AI智能分类（火山引擎 GLM-4）
- 新闻摘要图片生成（Canvas）
- 飞书群消息推送
- 定时任务（每天10:30和22:30）

### 技术栈
- Node.js ≥ 22
- 火山引擎 API（GLM-4模型）
- 飞书开放平台 API
- Canvas（图片生成）
- node-cron（定时任务）

---

## 二、前置准备

### 1. 火山引擎配置

#### 创建推理端点
1. 登录 [火山引擎控制台](https://console.volcengine.com/ark)
2. 左侧菜单：**推理 → 在线推理**
3. 点击 **创建推理**
4. 选择模型：**GLM-4**
5. 配置完成后，复制 **端点ID**（格式：`ep-xxxxxxxxxx`）

#### 获取API Key
1. 左侧菜单：**API Key管理**
2. 创建或复制现有API Key

### 2. 飞书应用配置

#### 创建应用
1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 点击 **创建企业自建应用**
3. 填写应用名称，创建应用

#### 获取凭证
- 进入应用详情 → **凭证与基础信息**
- 复制 `App ID` 和 `App Secret`

#### 配置权限
进入 **权限管理**，添加以下权限：
| 权限名称 | 权限码 | 用途 |
|---------|--------|------|
| 接收消息 | `im:message` | 接收群消息 |
| 发送消息 | `im:message:send_as_bot` | 以机器人身份发送消息 |
| 获取群组信息 | `im:chat` | 获取群组列表 |
| 上传资源文件 | `im:resource:upload` | 上传图片 |
| 获取资源文件 | `im:resource` | 获取图片 |

#### 发布应用
1. 进入 **版本管理与发布**
2. 点击 **创建版本**
3. 选择 **全员可用**
4. 发布应用

#### 获取群ID
方法一：通过API获取
```bash
node -e "const s = require('./feishu_sender'); new s().getChatList().then(console.log);"
```

方法二：手动获取
1. 在飞书群中添加机器人
2. 通过飞书开放平台查看群组信息

### 3. 服务器要求

- 操作系统：Linux（推荐 CentOS/Ubuntu）
- Node.js：≥ 22
- 内存：≥ 1GB
- 磁盘：≥ 10GB

---

## 三、部署步骤

### 方式一：快速部署（推荐）

```bash
# 1. 克隆项目
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy

# 2. 安装依赖
npm install

# 3. 配置
cp config.json.example config.json
# 编辑 config.json，填写必要配置

# 4. 测试运行
npm run test

# 5. 启动服务
npm start
```

### 方式二：Docker部署

#### 创建 Dockerfile
```dockerfile
FROM node:22-alpine

# 安装 canvas 依赖
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# 创建必要目录
RUN mkdir -p output logs history

CMD ["node", "main.js"]
```

#### 构建和运行
```bash
# 构建镜像
docker build -t news-bot .

# 运行容器
docker run -d \
  --name news-bot \
  -v $(pwd)/config.json:/app/config.json \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/history:/app/history \
  news-bot
```

### 方式三：PM2部署（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start main.js --name news-bot

# 设置开机自启
pm2 save
pm2 startup

# 查看日志
pm2 logs news-bot

# 重启服务
pm2 restart news-bot

# 停止服务
pm2 stop news-bot
```

### 方式四：Systemd服务

创建服务文件 `/etc/systemd/system/news-bot.service`:
```ini
[Unit]
Description=News Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/openclaw-feishu-deploy
ExecStart=/usr/bin/node main.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
systemctl daemon-reload
systemctl enable news-bot
systemctl start news-bot
systemctl status news-bot
```

---

## 四、配置说明

### config.json 完整配置

```json
{
  "volcanoApiKey": "your_api_key",
  "volcanoApiSecret": "",
  "volcanoEndpoint": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  "volcanoModel": "ep-xxxxxxxxxx",
  
  "feishuAppId": "cli_xxxxxxxxxxxxxxxx",
  "feishuAppSecret": "xxxxxxxxxxxxxxxx",
  "feishuChatIds": ["oc_xxxxxxxxxxxxxxxx"],
  
  "newsLimit": 50,
  "selectedLimit": 30,
  "outputDir": "./output",
  "historyDir": "./history",
  "maxHistoryDays": 7,
  "cronExpression": "30 10,22 * * *"
}
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| volcanoApiKey | 火山引擎 API Key | 必填 |
| volcanoModel | 推理端点ID | 必填 |
| feishuAppId | 飞书应用ID | 必填 |
| feishuAppSecret | 飞书应用密钥 | 必填 |
| feishuChatIds | 飞书群ID列表 | 必填 |
| newsLimit | 抓取新闻数量 | 50 |
| selectedLimit | 精选新闻数量 | 30 |
| cronExpression | 定时任务时间 | 30 10,22 * * * |

---

## 五、验证部署

### 1. 检查服务状态

```bash
# PM2
pm2 status

# Systemd
systemctl status news-bot

# Docker
docker ps
```

### 2. 测试各模块

```bash
# 测试新闻抓取
npm run crawl

# 测试新闻分类
npm run classify

# 测试图片生成
npm run generate

# 测试飞书连接
npm run feishu

# 完整测试
npm run test
```

### 3. 查看日志

```bash
# PM2日志
pm2 logs news-bot

# 文件日志
tail -f logs/news-$(date +%Y-%m-%d).json
```

---

## 六、常见问题

### 问题1：Canvas模块安装失败

**原因**：缺少系统依赖

**解决方案**：
```bash
# Ubuntu/Debian
apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# CentOS/RHEL
yum install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
```

### 问题2：模型调用404错误

**原因**：使用了错误的模型名称

**解决方案**：
- 确保使用的是**推理端点ID**（如 `ep-xxxxxx`），而非模型名称（如 `glm-4.7`）
- 在火山引擎控制台确认端点已创建且状态正常

### 问题3：飞书图片上传失败

**原因**：缺少权限

**解决方案**：
- 添加 `im:resource:upload` 权限
- 重新发布应用版本

### 问题4：新闻链接无法跳转

**原因**：链接解析错误

**解决方案**：
- 确保使用最新版本代码
- 检查链接是否为完整URL

### 问题5：定时任务不执行

**原因**：时区配置错误

**解决方案**：
- 代码中已设置 `timezone: 'Asia/Shanghai'`
- 检查服务器时区是否正确

---

## 七、迁移流程

### 从旧服务器迁移到新服务器

#### 1. 备份数据
```bash
# 在旧服务器上执行
cd /path/to/openclaw-feishu-deploy
tar -czvf news-bot-backup.tar.gz \
  config.json \
  history/ \
  logs/
```

#### 2. 导出配置
记录以下信息：
- 火山引擎 API Key
- 火山引擎端点ID
- 飞书 App ID 和 Secret
- 飞书群ID列表

#### 3. 在新服务器部署
```bash
# 克隆代码
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy

# 安装依赖
npm install

# 恢复配置和数据
tar -xzvf news-bot-backup.tar.gz

# 测试
npm run test

# 启动服务
pm2 start main.js --name news-bot
pm2 save
```

#### 4. 停止旧服务
```bash
# 在旧服务器上
pm2 stop news-bot
pm2 delete news-bot
```

---

## 八、监控和维护

### 日志轮转

创建 `/etc/logrotate.d/news-bot`:
```
/path/to/openclaw-feishu-deploy/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

### 健康检查脚本

创建 `health_check.sh`:
```bash
#!/bin/bash
if ! pgrep -f "node main.js" > /dev/null; then
    cd /path/to/openclaw-feishu-deploy
    pm2 restart news-bot
    echo "$(date): 服务已重启" >> logs/health.log
fi
```

添加到crontab（每5分钟检查）:
```bash
*/5 * * * * /path/to/health_check.sh
```

---

## 九、安全建议

1. **敏感信息保护**
   - 不要将 `config.json` 提交到Git
   - 使用环境变量存储密钥

2. **网络安全**
   - 限制服务器端口访问
   - 使用HTTPS

3. **定期备份**
   - 备份 `history/` 目录
   - 备份 `config.json`

---

## 十、联系方式

- 项目地址：https://gitee.com/liccolicco/openclaw-feishu-deploy
- 问题反馈：提交 Issue
