# 新闻抓取与飞书推送系统

自动抓取 ZAKER 新闻、智能分类、生成摘要图片，并通过飞书机器人定时推送。

## 功能特性

- ✅ **新闻抓取**: 自动抓取 ZAKER 网站最新新闻
- ✅ **智能分类**: 使用 GLM-4.7 大模型对新闻进行智能分类
- ✅ **图片生成**: 自动生成精美的新闻摘要图片
- ✅ **定时推送**: 每天 10:30 和 22:30 自动推送到飞书群
- ✅ **多群支持**: 支持同时推送到多个飞书群

## 系统架构

```
┌─────────────┐
│ 新闻抓取模块 │ ──> ZAKER 网站
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 新闻分类模块 │ ──> GLM-4.7 大模型
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 图片生成模块 │ ──> Canvas 绘图
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 飞书推送模块 │ ──> 飞书开放平台 API
└─────────────┘
```

## 快速开始

### 1. 安装依赖

```bash
# 安装 Node.js 依赖
npm install
```

### 2. 配置

复制配置文件模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必要配置：

```env
# 火山引擎配置
VOLCANO_API_KEY=your_api_key
VOLCANO_API_SECRET=your_api_secret

# 飞书配置
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_CHAT_IDS=chat_id_1,chat_id_2

# 定时任务（每天10:30和22:30执行）
CRON_EXPRESSION=30 10,22 * * *
```

或直接编辑 `config.json`：

```json
{
  "volcanoApiKey": "your_api_key",
  "volcanoApiSecret": "your_api_secret",
  "feishuAppId": "your_app_id",
  "feishuAppSecret": "your_app_secret",
  "feishuChatIds": ["chat_id_1", "chat_id_2"],
  "newsLimit": 30,
  "cronExpression": "0 10 * * *"
}
```

### 3. 获取飞书群 ID

#### 方法一：通过 API 获取

```bash
node -e "const sender = require('./feishu_sender'); new sender().getChatList().then(console.log);"
```

#### 方法二：通过飞书开放平台

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入应用 → 开发管理 → 机器人
3. 在群组中添加机器人
4. 查看群组信息获取 `chat_id`

### 4. 运行

#### 测试模式

```bash
npm run test
# 或
node main.js --test
```

#### 执行一次

```bash
node main.js --once
```

#### 启动定时任务

```bash
npm start
# 或
node main.js
```

## 使用说明

### 命令参数

```bash
# 测试模式（立即执行一次）
node main.js --test

# 执行一次（不启动定时任务）
node main.js --once

# 启动定时任务
node main.js
```

### 定时任务配置

使用 cron 表达式配置定时任务：

```bash
# 每天 10:30 和 22:30
CRON_EXPRESSION=30 10,22 * * *

# 每天 9:00 和 18:00
CRON_EXPRESSION=0 9,18 * * *

# 每小时执行一次
CRON_EXPRESSION=0 * * * *
```

Cron 表达式格式：

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期几 (0 - 7, 0 和 7 都是周日)
│ │ │ │ │
* * * * *
```

### 单独测试各模块

```bash
# 测试新闻抓取
node news_crawler.js

# 测试新闻分类
node news_classifier.js

# 测试图片生成
node image_generator.js

# 测试飞书连接
node feishu_sender.js
```

## 模块说明

### 1. 新闻抓取模块 (`news_crawler.js`)

- 从 ZAKER 网站抓取最新新闻
- 支持抓取首页和分类页面
- 自动去重
- 支持获取新闻详情

### 2. 新闻分类模块 (`news_classifier.js`)

- 使用 GLM-4.7 模型进行智能分类
- 自动提取关键词、摘要
- 分析重要程度和情感倾向
- 生成每日摘要报告

### 3. 图片生成模块 (`image_generator.js`)

- 使用 Canvas 绘制精美的新闻摘要图片
- 支持自定义主题颜色
- 自动排版和文本换行
- 输出 PNG 格式图片

### 4. 飞书推送模块 (`feishu_sender.js`)

- 支持发送文本、卡片、图片消息
- 自动管理访问令牌
- 支持多群推送
- 完善的错误处理

### 5. 主程序 (`main.js`)

- 整合所有模块
- 管理定时任务
- 日志记录
- 错误处理

## 配置飞书应用

### 1. 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击「创建企业自建应用」
3. 填写应用名称和描述
4. 创建成功后获取 `App ID` 和 `App Secret`

### 2. 配置权限

在应用管理页面，添加以下权限：

- `im:message` - 接收消息
- `im:message:send_as_bot` - 发送消息
- `im:chat` - 获取群组信息
- `im:chat:read` - 读取群组信息

### 3. 配置事件订阅（可选）

如需接收用户消息，配置事件订阅：

- 事件：`im.message.receive_v1`
- 地址：`http://your-server:18789/webhook/feishu`

### 4. 发布应用

1. 在「版本管理与发布」页面
2. 点击「创建版本」
3. 选择「全员可用」
4. 发布应用

### 5. 添加机器人到群

1. 在飞书群中点击「设置」
2. 选择「添加机器人」
3. 搜索并添加你的应用

## 部署到服务器

### 方式一：直接运行

```bash
# 克隆项目
git clone <your-repo>
cd openclaw-feishu-deploy

# 安装依赖
npm install

# 配置
cp .env.example .env
vim .env

# 启动
nohup node main.js > news-bot.log 2>&1 &
```

### 方式二：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start main.js --name news-bot

# 查看日志
pm2 logs news-bot

# 停止
pm2 stop news-bot

# 重启
pm2 restart news-bot
```

### 方式三：使用 systemd

创建服务文件 `/etc/systemd/system/news-bot.service`：

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

## 监控和日志

### 查看日志

```bash
# 实时日志
tail -f logs/news-$(date +%Y-%m-%d).json

# PM2 日志
pm2 logs news-bot
```

### 日志格式

```json
{
  "startTime": "2026-02-15T10:00:00.000Z",
  "endTime": "2026-02-15T10:01:30.000Z",
  "duration": 90,
  "newsCount": 30,
  "summaryData": { ... }
}
```

## 故障排查

### 问题 1: 无法抓取新闻

**可能原因**:
- 网络连接问题
- ZAKER 网站结构变化

**解决方法**:
```bash
# 测试抓取
node news_crawler.js

# 检查网络
curl https://www.myzaker.com/
```

### 问题 2: 新闻分类失败

**可能原因**:
- 火山引擎 API 密钥错误
- API 调用频率限制

**解决方法**:
```bash
# 检查 API 配置
curl -X POST https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-4.7","messages":[{"role":"user","content":"测试"}]}'
```

### 问题 3: 图片生成失败

**可能原因**:
- canvas 模块依赖缺失
- 字体文件缺失

**解决方法**:
```bash
# 重新安装 canvas
npm rebuild canvas

# 安装系统依赖（Ubuntu/Debian）
apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 安装系统依赖（CentOS/RHEL）
yum install gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
```

### 问题 4: 飞书推送失败

**可能原因**:
- App ID 或 App Secret 错误
- 未配置推送群 ID
- 权限不足

**解决方法**:
```bash
# 测试飞书连接
node feishu_sender.js

# 检查配置
cat config.json | grep feishu
```

## 自定义开发

### 添加新的新闻源

编辑 `news_crawler.js`，添加新的抓取方法：

```javascript
async fetchFromCustomSource() {
  // 实现自定义抓取逻辑
}
```

### 自定义分类类别

编辑 `news_classifier.js`，修改 `categories` 数组：

```javascript
this.categories = [
  '科技', '财经', '体育', '娱乐', 
  // 添加自定义分类
  '自定义分类'
];
```

### 自定义图片样式

编辑 `image_generator.js`，修改颜色主题：

```javascript
this.colors = {
  background: '#1a1a2e',
  primary: '#16213e',
  // 自定义颜色
};
```

## 技术栈

- **Node.js** ≥ 22
- **Axios** - HTTP 请求
- **Cheerio** - HTML 解析
- **Canvas** - 图片生成
- **node-cron** - 定时任务
- **GLM-4.7** - 大语言模型

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。
