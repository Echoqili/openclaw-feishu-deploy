# OpenClaw 飞书新闻推送机器人

[![Docker](https://img.shields.io/docker/pulls/news-bot/openclaw-feishu-deploy?style=flat-square)](https://hub.docker.com/r/news-bot/openclaw-feishu-deploy)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green?style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](LICENSE)

## 项目简介

OpenClaw 是一个自动化的新闻抓取、分类、摘要生成并通过飞书推送的智能机器人系统。它能够定时从网络抓取新闻，利用 AI 进行分类和情感分析，精选重要新闻，生成摘要和图片，并推送到指定的飞书群组。

## 功能特性

- 🤖 **自动化新闻抓取** - 定时从多个新闻源获取最新资讯
- 🧠 **AI 智能分类** - 利用火山引擎大模型进行新闻分类和情感分析
- ✨ **智能精选** - 基于重要程度和情感倾向自动筛选优质新闻
- 📝 **自动摘要** - 生成简洁的新闻摘要
- 🖼️ **图片生成** - 自动生成包含摘要的图片
- 📢 **飞书推送** - 推送到指定的飞书群组
- 📊 **历史管理** - 记录已发送新闻，避免重复推送
- ⏰ **定时任务** - 默认每天 10:30 和 22:30 执行

## 快速开始

### 前置要求

- Node.js 14.0+ / npm 6.0+
- 火山引擎 API 账号
- 飞书开发者账号

### 安装部署

```bash
# 克隆项目
git clone https://gitee.com/sun_53/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy

# 安装依赖
npm install

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 填写配置

# 启动服务
npm start
```

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t news-bot:latest .

# 运行容器
docker run -d \
  --name news-bot \
  --restart=always \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/logs:/app/logs \
  news-bot:latest
```

## 配置说明

### 环境变量 (.env)

| 变量 | 说明 | 必需 |
|-----|------|-----|
| `VOLCANO_API_KEY` | 火山引擎 API 密钥 | ✅ |
| `VOLCANO_API_SECRET` | 火山引擎 API 密钥密码 | ✅ |
| `VOLCANO_ENDPOINT` | API 端点 | ✅ |
| `VOLCANO_MODEL` | 使用的模型 ID | ✅ |
| `FEISHU_APP_ID` | 飞书应用 ID | ✅ |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | ✅ |
| `FEISHU_CHAT_IDS` | 飞书群组 ID（逗号分隔） | ✅ |
| `NEWS_LIMIT` | 抓取新闻数量限制 | ❌ |
| `SELECTED_LIMIT` | 精选新闻数量限制 | ❌ |
| `CRON_EXPRESSION` | 定时任务表达式 | ❌ |

### 定时任务

默认执行时间：`0 10,22 * * *`（每天 10:30 和 22:30）

可通过修改 `.env` 中的 `CRON_EXPRESSION` 自定义执行时间。

## 使用命令

```bash
npm start          # 启动定时任务
npm test           # 测试运行（执行一次）
npm run once       # 手动执行一次
npm run dev        # 开发模式（自动重启）
```

## 项目结构

```
openclaw-feishu-deploy/
├── src/
│   ├── main.js              # 主程序入口
│   ├── news_crawler.js      # 新闻抓取模块
│   ├── news_classifier.js   # 新闻分类模块
│   ├── image_generator.js   # 图片生成模块
│   ├── feishu_sender.js     # 飞书推送模块
│   └── news_history.js      # 历史记录管理
├── scripts/                 # 脚本目录
├── docs/                    # 文档目录
├── config/                  # 配置目录
├── logs/                    # 日志目录
└── output/                  # 图片输出目录
```

## 常见问题

### 新闻抓取数量少或失败
- 检查网络连接
- 查看日志了解具体错误
- 项目已配置多新闻源自动降级

### 分类/推送失败
- 检查 API 配置是否正确
- 检查飞书应用权限
- 查看日志文件排查问题

## 更新日志

### v1.1.1 (2026-03-01)
- 优化 Dockerfile，使用 Node.js 22 Alpine 镜像
- 添加数据卷挂载支持
- 配置容器自动重启策略

### v1.1.0 (2026-02-28)
- 优化新闻抓取模块，增加多种选择器策略
- 新增腾讯新闻源作为备用
- 增加去重机制

## 相关链接

- 🌐 项目地址：https://gitee.com/sun_53/openclaw-feishu-deploy
- 📖 部署文档：[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- 🐛 问题反馈：https://gitee.com/sun_53/openclaw-feishu-deploy/issues

## 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE) 文件

---

**OpenClaw - 让新闻推送更智能**
