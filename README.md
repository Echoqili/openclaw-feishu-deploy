# OpenClaw 飞书新闻推送机器人

## 项目简介

OpenClaw 是一个自动化的新闻抓取、分类、摘要生成并通过飞书推送的智能机器人系统。它能够定时从网络抓取新闻，利用 AI 进行分类和情感分析，精选重要新闻，生成摘要和图片，并推送到指定的飞书群组。

## 功能特性

- **自动化新闻抓取**：定时从网络获取最新新闻
- **AI 新闻分类**：利用火山引擎 API 对新闻进行分类和情感分析
- **智能新闻精选**：基于重要程度和情感倾向自动筛选重要新闻
- **自动摘要生成**：生成每日新闻摘要
- **新闻图片生成**：自动生成包含新闻摘要的图片
- **飞书推送**：将新闻摘要和图片推送到指定的飞书群组
- **历史记录管理**：记录已发送的新闻，避免重复推送
- **定时任务**：默认每天 10:30 和 22:30 执行
- **日志记录**：详细的执行日志，便于排查问题

## 技术栈

- **Node.js**：运行环境
- **axios**：网络请求
- **cheerio**：HTML 解析
- **node-cron**：定时任务
- **canvas**：图片生成
- **dotenv**：环境变量管理
- **moment**：时间处理
- **lodash**：工具函数
- **火山引擎 API**：新闻分类和摘要生成
- **飞书 API**：消息推送

## 安装和配置

### 前提条件

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本
- 火山引擎 API 账号（用于新闻分类和摘要生成）
- 飞书开发者账号（用于消息推送）

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone <仓库地址>
   cd openclaw-feishu-deploy
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置环境变量**

   复制 `.env.example` 文件为 `.env`，并填写相关配置：

   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，填写以下内容：

   ```env
   # 火山引擎配置
   VOLCANO_API_KEY=your_volcano_api_key
   VOLCANO_API_SECRET=your_volcano_api_secret
   VOLCANO_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions
   VOLCANO_MODEL=ep-20240101000000000000000000000000000

   # 飞书配置
   FEISHU_APP_ID=your_feishu_app_id
   FEISHU_APP_SECRET=your_feishu_app_secret
   FEISHU_CHAT_IDS=chat_id1,chat_id2

   # 其他配置
   NEWS_LIMIT=50
   SELECTED_LIMIT=20
   OUTPUT_DIR=./output
   HISTORY_DIR=./history
   MAX_HISTORY_DAYS=7
   CRON_EXPRESSION=0 10,22 * * *
   ```

4. **配置 config.json**

   复制 `config.json.example` 文件为 `config.json`，并填写相关配置：

   ```bash
   cp config.json.example config.json
   ```

   编辑 `config.json` 文件，填写以下内容：

   ```json
   {
     "volcanoApiKey": "your_volcano_api_key",
     "volcanoApiSecret": "your_volcano_api_secret",
     "volcanoEndpoint": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
     "volcanoModel": "ep-20240101000000000000000000000000000",
     "feishuAppId": "your_feishu_app_id",
     "feishuAppSecret": "your_feishu_app_secret",
     "feishuChatIds": ["chat_id1", "chat_id2"],
     "newsLimit": 50,
     "selectedLimit": 20,
     "outputDir": "./output",
     "historyDir": "./history",
     "maxHistoryDays": 7
   }
   ```

## 使用方法

### 启动服务

```bash
# 启动定时任务（默认每天 10:30 和 22:30 执行）
npm start

# 或使用脚本
./start.sh  # Linux/Mac
start.bat   # Windows
```

### 测试运行

```bash
# 测试模式运行（执行一次后退出）
npm test

# 或
node main.js --test
```

### 手动执行一次

```bash
# 执行一次后退出
npm run once

# 或
node main.js --once
```

### 单独运行各个模块

```bash
# 运行新闻抓取模块
npm run crawl

# 运行新闻分类模块
npm run classify

# 运行图片生成模块
npm run generate

# 运行飞书推送模块
npm run feishu
```

## 项目结构

```
openclaw-feishu-deploy/
├── src/                # 源代码目录
│   ├── main.js         # 主程序
│   ├── news_crawler.js # 新闻抓取模块
│   ├── news_classifier.js # 新闻分类模块
│   ├── image_generator.js # 图片生成模块
│   ├── feishu_sender.js # 飞书推送模块
│   └── news_history.js # 历史记录管理模块
├── scripts/            # 脚本目录
│   ├── start.sh        # Linux/Mac 启动脚本
│   ├── start.bat       # Windows 启动脚本
│   ├── deploy_openclaw.sh # 部署脚本
│   ├── deploy_news_bot.sh # 新闻机器人部署脚本
│   ├── deploy_to_server.sh # 服务器部署脚本
│   ├── quick_deploy.sh # 快速部署脚本
│   ├── setup.sh        # 安装脚本
│   ├── configure_openclaw.sh # 配置脚本
│   ├── deploy_and_test.sh # 部署和测试脚本
│   └── test_openclaw.sh # 测试脚本
├── docs/               # 文档目录
│   ├── DEPLOYMENT_GUIDE.md # 部署指南
│   ├── DEPLOY_TEST_GUIDE.md # 部署测试指南
│   ├── LESSONS_LEARNED.md # 经验教训
│   ├── MIGRATION_GUIDE.md # 迁移指南
│   ├── QUICKSTART.md   # 快速开始指南
│   ├── README_NEWS_BOT.md # 新闻机器人说明
│   └── SERVER_DEPLOY_GUIDE.md # 服务器部署指南
├── config/             # 配置目录
│   ├── .env.example    # 环境变量配置示例
│   ├── config.json     # 配置文件
│   └── config.json.example # 配置文件示例
├── history/            # 历史记录目录
│   └── sent_news.json  # 已发送的新闻记录
├── output/             # 生成的图片输出目录
├── logs/               # 日志目录
├── .env                # 环境变量配置（本地）
├── package.json        # 项目配置和依赖
├── package-lock.json   # 依赖锁定文件
└── README.md           # 项目说明（本文档）
```

## 配置说明

### 火山引擎配置

- `VOLCANO_API_KEY`：火山引擎 API 密钥
- `VOLCANO_API_SECRET`：火山引擎 API 密钥密码
- `VOLCANO_ENDPOINT`：火山引擎 API 端点
- `VOLCANO_MODEL`：使用的火山引擎模型 ID

### 飞书配置

- `FEISHU_APP_ID`：飞书应用 ID
- `FEISHU_APP_SECRET`：飞书应用密钥
- `FEISHU_CHAT_IDS`：飞书群组 ID，多个 ID 用逗号分隔

### 其他配置

- `NEWS_LIMIT`：每次抓取的新闻数量限制
- `SELECTED_LIMIT`：精选的新闻数量限制
- `OUTPUT_DIR`：生成的图片输出目录
- `HISTORY_DIR`：历史记录目录
- `MAX_HISTORY_DAYS`：历史记录保留天数
- `CRON_EXPRESSION`：定时任务表达式，默认每天 10:30 和 22:30 执行

## 部署指南

### 本地部署

1. 按照「安装和配置」步骤完成设置
2. 执行 `npm start` 启动服务

### 服务器部署

1. 按照「安装和配置」步骤完成设置
2. 使用 `./deploy_to_server.sh` 脚本部署到服务器
3. 配置服务器的定时任务或使用 PM2 等进程管理工具确保服务持续运行

### Docker 部署

（可选）如果需要使用 Docker 部署，请参考 `DEPLOYMENT_GUIDE.md` 文件。

## 开发和测试

### 开发环境设置

```bash
# 安装开发依赖
npm install --save-dev nodemon

# 启动开发模式（自动重启）
npm run dev
```

### 测试

```bash
# 运行测试
npm test

# 运行特定模块测试
node news_crawler.js # 测试新闻抓取
node news_classifier.js # 测试新闻分类
node image_generator.js # 测试图片生成
node feishu_sender.js # 测试飞书推送
```

## 常见问题

### 1. 新闻抓取失败

- 检查网络连接
- 检查新闻源网站是否可访问
- 查看日志文件了解具体错误

### 2. 分类失败

- 检查火山引擎 API 配置是否正确
- 检查 API 密钥是否有效
- 查看日志文件了解具体错误

### 3. 飞书推送失败

- 检查飞书应用配置是否正确
- 检查应用是否有发送消息的权限
- 检查群组 ID 是否正确
- 查看日志文件了解具体错误

### 4. 图片生成失败

- 检查 Canvas 依赖是否正确安装
- 检查输出目录是否存在且有写入权限
- 查看日志文件了解具体错误

## 日志管理

日志文件存储在 `logs/` 目录下，按日期命名，格式为 `news-YYYY-MM-DD.json`。

日志包含以下信息：
- 执行开始和结束时间
- 执行耗时
- 新闻统计（总新闻数、新增新闻数、精选新闻数）
- 摘要数据
- 错误信息（如果有）

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进本项目。

## 联系方式

如果您有任何问题或建议，请通过以下方式联系我们：

- Issue 追踪：[项目 Issues 页面](https://github.com/yourusername/openclaw-feishu-deploy/issues)
- 电子邮件：your.email@example.com

---

**OpenClaw - 让新闻推送更智能**