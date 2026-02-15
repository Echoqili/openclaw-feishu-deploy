# 快速开始指南

## 5 分钟快速部署

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 配置

编辑 `config.json` 文件，填写飞书群 ID：

```json
{
  "feishuChatIds": ["your_chat_id_here"]
}
```

### 步骤 3: 获取飞书群 ID

```bash
node -e "const sender = require('./feishu_sender'); new sender().getChatList().then(console.log);"
```

### 步骤 4: 测试运行

```bash
npm run test
```

### 步骤 5: 启动定时任务

```bash
npm start
```

## 一键部署（服务器）

```bash
chmod +x deploy_news_bot.sh
./deploy_news_bot.sh
```

## 常用命令

```bash
# 测试运行（立即执行一次）
npm run test

# 执行一次（不启动定时）
npm run once

# 启动定时任务
npm start

# 后台运行
nohup node main.js > logs/bot.log 2>&1 &

# 使用 PM2 运行
pm2 start main.js --name news-bot
```

## 配置说明

### 必填配置

1. **火山引擎 API Key** (已配置)
   - `volcanoApiKey`: `YOUR_VOLCANO_API_KEY_HERE`

2. **飞书应用信息** (已配置)
   - `feishuAppId`: `YOUR_FEISHU_APP_ID_HERE`
   - `feishuAppSecret`: `YOUR_FEISHU_APP_SECRET_HERE`

3. **飞书群 ID** (需要填写)
   - `feishuChatIds`: `["chat_id_1", "chat_id_2"]`

### 可选配置

- `newsLimit`: 新闻数量限制（默认 30）
- `cronExpression`: 定时任务时间（默认每天 10:00）

## 故障排查

### 1. 检查网络连接

```bash
curl https://www.myzaker.com/
```

### 2. 测试各个模块

```bash
# 测试新闻抓取
npm run crawl

# 测试新闻分类
npm run classify

# 测试图片生成
npm run generate

# 测试飞书连接
npm run feishu
```

### 3. 查看日志

```bash
# 查看最新日志
tail -f logs/news-$(date +%Y-%m-%d).json

# 查看服务日志（如果使用 systemd）
journalctl -u news-bot -f
```

## 下一步

- 📖 阅读完整文档: [README_NEWS_BOT.md](./README_NEWS_BOT.md)
- 🔧 自定义配置: 修改 `config.json`
- 🎨 自定义图片样式: 编辑 `image_generator.js`
- 📰 添加新闻源: 编辑 `news_crawler.js`
