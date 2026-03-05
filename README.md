

# OpenClaw 飞书新闻推送机器人

[![Docker](https://img.shields.io/docker/pulls/news-bot/openclaw-feishu-deploy?style=flat-square)](https://hub.docker.com/r/news-bot/openclaw-feishu-deploy)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green?style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-%E7%A0%81%E5%8C%96%E5%BC%80%E5%8F%91-orange?style=flat-square)](https://gitee.com/sun_53/openclaw-feishu-deploy)

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
- 🐳 **Docker 部署** - 支持容器化部署

## 快速开始

### 前置要求

- Node.js 14.0+ / npm 6.0+
- 火山引擎 API 账号
- 飞书开发者账号

### 本地部署

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

### Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  news-bot:
    image: news-bot:latest
    build: .
    restart: always
    volumes:
      - ./config:/app/config
      - ./output:/app/output
      - ./history:/app/history
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
```

```bash
docker-compose up -d
```

## 配置说明

### 环境变量 (.env)

| 变量 | 说明 | 必需 | 默认值 |
|-----|------|-----|-------|
| `VOLCANO_API_KEY` | 火山引擎 API 密钥 | ✅ | - |
| `VOLCANO_API_SECRET` | 火山引擎 API 密钥密码 | ✅ | - |
| `VOLCANO_ENDPOINT` | API 端点 | ✅ | - |
| `VOLCANO_MODEL` | 使用的模型 ID | ✅ | - |
| `FEISHU_APP_ID` | 飞书应用 ID | ✅ | - |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | ✅ | - |
| `FEISHU_CHAT_IDS` | 飞书群组 ID（逗号分隔） | ✅ | - |
| `NEWS_LIMIT` | 抓取新闻数量限制 | ❌ | 50 |
| `SELECTED_LIMIT` | 精选新闻数量限制 | ❌ | 20 |
| `CRON_EXPRESSION` | 定时任务表达式 | ❌ | `0 10,22 * * *` |

### 火山引擎配置

1. 登录 [火山引擎控制台](https://www.volcengine.com/)
2. 创建 API Key 和 Secret
3. 选择合适的模型 endpoint

### 飞书配置

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 添加权限：`im:chat:message:send_as_bot`
5. 创建群聊并获取 Chat ID

### 定时任务

默认执行时间：`0 10,22 * * *`（每天 10:30 和 22:30）

CRON 表达式格式：
```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6)
* * * * *
```

常用示例：
- `0 10,22 * * *` - 每天 10:00 和 22:00
- `0 8 * * *` - 每天 8:00
- `*/30 * * * *` - 每 30 分钟

## 使用命令

```bash
npm start          # 启动定时任务
npm test           # 测试运行（执行一次）
npm run once       # 手动执行一次
npm run dev        # 开发模式（自动重启）

# 单独运行各个模块
npm run crawl      # 仅抓取新闻
npm run classify   # 仅分类新闻
npm run generate   # 仅生成图片
npm run feishu     # 仅推送飞书
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
├── scripts/                  # 脚本目录
│   ├── start.sh            # Linux/Mac 启动脚本
│   ├── start.bat           # Windows 启动脚本
│   └── deploy_*.sh         # 部署脚本
├── docs/                    # 文档目录
├── config/                  # 配置目录
│   └── config.json         # 配置文件
├── logs/                    # 日志目录
├── output/                  # 图片输出目录
├── history/                 # 历史记录目录
├── Dockerfile              # Docker 配置
├── docker-compose.yml      # Docker Compose 配置
└── package.json            # 项目配置
```

## 新闻源

项目默认支持以下新闻源，按优先级依次尝试：

1. **ZAKER** - https://www.myzaker.com/
2. **新浪新闻** - https://news.sina.com.cn/
3. **网易新闻** - https://news.163.com/
4. **腾讯新闻** - https://news.qq.com/

## 日志管理

日志文件存储在 `logs/` 目录下，按日期命名：

```
logs/
└── news-2026-03-05.json
```

日志内容包含：
- 执行时间
- 抓取新闻数量
- 分类结果
- 推送状态
- 错误信息（如有）

查看实时日志：
```bash
# 本地
tail -f logs/news-$(date +%Y-%m-%d).json

# Docker
docker logs -f news-bot
```

## 常见问题

### 新闻抓取数量少或失败
- 检查网络连接
- 新闻源网站可能有反爬机制
- 查看日志了解具体错误
- 项目已配置多新闻源自动降级

### 分类/推送失败
- 检查 API 配置是否正确
- 检查飞书应用权限
- 查看日志文件排查问题

### Docker 部署问题
- 确保端口未被占用
- 检查数据卷挂载权限
- 查看容器日志排查问题

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
- 🐳 Docker Hub：https://hub.docker.com/r/news-bot/openclaw-feishu-deploy

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE) 文件

---

**OpenClaw - 让新闻推送更智能**