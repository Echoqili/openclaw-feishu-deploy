# Vercel 部署指南

本文档说明如何将 OpenClaw 新闻机器人部署到 Vercel Serverless 平台。

---

## 一、前提条件

| 平台 | 要求 | 说明 |
|------|------|------|
| Vercel | 注册账户 | [https://vercel.com](https://vercel.com)（Hobby 免费版可用） |
| GitHub / Gitee | 仓库已推送 | 本项目推荐使用 GitHub 与 Vercel 集成 |
| AI 平台 | API Key | Agnes AI、SenseNova、火山引擎、NVIDIA 等支持 OpenAI 兼容接口的平台均可 |
| 飞书 | 开发者账号 | 用于创建企业自建应用并推送消息 |

---

## 二、飞书机器人准备

### 2.1 创建企业自建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击 **创建应用** → **企业自建应用**
3. 填写应用信息：
   - 应用名称：`OpenClaw News Bot`
   - 应用描述：`自动新闻抓取、分类与推送机器人`
4. 点击 **创建**

### 2.2 获取凭证

在 **凭证与基础信息** 页面获取：

- **App ID**：`cli_xxxxxxxxxxxxxx`
- **App Secret**：`xxxxxxxxxxxxxxxxxxxx`

### 2.3 启用机器人

1. 左侧菜单点击 **机器人**
2. 开启 **启用机器人** 开关

### 2.4 添加权限

左侧菜单点击 **权限管理**，添加以下权限并申请审批：

| 权限名 | 说明 |
|--------|------|
| `im:message` | 发送消息 |
| `im:message:send_as_bot` | 以机器人身份发送消息 |
| `im:chat:readonly` | 读取群列表（可选，若未开通需手动填写 `FEISHU_CHAT_IDS`） |

### 2.5 将机器人加入群聊

1. 打开目标飞书群
2. 群设置 → **群机器人** → **添加机器人**
3. 搜索并选择 `OpenClaw News Bot`

> 如果未开通 `im:chat:readonly` 权限，请在 `.env` / Vercel 环境变量中填写 `FEISHU_CHAT_IDS`（群 ID，多个用英文逗号分隔）。

---

## 三、AI 模型配置

本项目使用 OpenAI 兼容格式的 Chat Completions 接口。以 Agnes AI 为例：

```bash
AI_API_KEY=sk-xxxxxxxxxxxxxxxx
AI_ENDPOINT=https://apihub.agnes-ai.com/v1/chat/completions
AI_MODEL=agnes-2.0-flash
```

其他平台只要替换 `AI_ENDPOINT`、`AI_MODEL` 和 `AI_API_KEY` 即可。

---

## 四、Vercel 部署

### 4.1 导入仓库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New** → **Project**
3. 选择 `openclaw-feishu-deploy` 仓库，点击 **Import**

### 4.2 配置项目

- **Framework Preset**：`Other`
- **Build Command**：留空（无需构建）
- **Output Directory**：留空
- Node.js 版本由 `vercel.json` / `package.json` 指定为 `24.x`

### 4.3 设置环境变量

在 **Environment Variables** 中添加：

```bash
# AI 配置（必填）
AI_API_KEY=你的_API_KEY
AI_ENDPOINT=https://apihub.agnes-ai.com/v1/chat/completions
AI_MODEL=agnes-2.0-flash

# 飞书配置（必填）
FEISHU_APP_ID=cli_xxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx
FEISHU_CHAT_IDS=oc_xxxxxxxxxxxxxxxx          # 若未开通群列表权限则必填

# 可选配置（Vercel Hobby 建议 NEWS_LIMIT=30 以内，避免 60 秒超时）
NEWS_LIMIT=30
SELECTED_LIMIT=30
MAX_HISTORY_DAYS=7
```

### 4.4 部署

点击 **Deploy**，等待部署完成。成功后会得到类似 `https://openclaw-news-bot.vercel.app` 的域名。

---

## 五、配置 Vercel KV（持久化历史记录）

Vercel Serverless 的 `/tmp` 目录在每次调用后会被清空，若不配置持久化存储，每次调用都会重复推送同一批新闻。

推荐使用 **Vercel Redis（Official Redis for Vercel）**：

1. 进入 Vercel 项目 → **Storage** → **Create Database**
2. 选择 **Redis**（Official Redis for Vercel）
3. 按提示创建数据库并 **Connect** 到当前项目
4. Vercel 会自动注入以下环境变量：
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
5. 重新部署项目

> 代码会自动检测这些变量并优先使用 Vercel KV；未配置时回退到本地 `/tmp/history`。

---

## 六、验证部署

部署完成后访问：

```
https://your-vercel-domain.vercel.app/api/news
```

成功响应：

```json
{
  "success": true,
  "message": "新闻推送任务执行完成",
  "timestamp": "2026-07-11T10:30:00.000Z"
}
```

然后检查飞书群是否收到新闻卡片。

---

## 七、定时任务配置

Vercel Serverless 不支持 `node-cron`，需要外部触发器定时访问 `/api/news`。

### 推荐：CronJob.org（免费）

1. 注册 [CronJob.org](https://cron-job.org)
2. 创建新任务：
   - **URL**：`https://your-vercel-domain.vercel.app/api/news`
   - **Schedule**：`30 10,22 * * *`（每天 10:30 和 22:30，北京时间）
3. 保存并启用

### 备选：GitHub Actions

创建 `.github/workflows/daily-news.yml`：

```yaml
name: Daily News Push
on:
  schedule:
    - cron: '30 2,14 * * *'  # UTC，对应北京时间 10:30 和 22:30
jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger News API
        run: curl -s -X GET https://your-vercel-domain.vercel.app/api/news
```

---

## 八、环境变量说明

### 必填变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `AI_API_KEY` | AI 平台 API Key | `sk-xxxxxxxxxxxxxxxx` |
| `AI_ENDPOINT` | Chat Completions 接口地址 | `https://apihub.agnes-ai.com/v1/chat/completions` |
| `AI_MODEL` | 模型名称 | `agnes-2.0-flash` |
| `FEISHU_APP_ID` | 飞书应用 ID | `cli_xxxxxxxxxxxxxx` |
| `FEISHU_APP_SECRET` | 飞书应用 Secret | `xxxxxxxxxxxxxxxxxxxx` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `FEISHU_CHAT_IDS` | 飞书群 ID（多个逗号分隔） | 自动获取（需权限） |
| `NEWS_LIMIT` | 每次抓取新闻数量 | `30`（Vercel Hobby 建议 ≤30） |
| `SELECTED_LIMIT` | 精选新闻数量 | `30` |
| `MAX_HISTORY_DAYS` | 历史记录保留天数 | `7` |
| `CLASSIFY_BATCH_SIZE` | 每次分类的新闻条数 | `15` |

### KV 自动注入变量

Vercel Redis 创建后自动提供，无需手动填写：

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

---

## 九、注意事项

### 9.1 Serverless 限制（Hobby 计划）

- **执行时间上限**：`60` 秒（`vercel.json` 已配置）
- **内存**：`512` MB（`vercel.json` 已配置）
- **Node.js 版本**：`24.x`（`package.json` / `vercel.json` 已配置）
- **冷启动**：首次请求可能需要几秒

### 9.2 避免重复推送

- 必须配置 **Vercel KV** 持久化历史记录
- 未配置 KV 时，历史记录保存在 `/tmp/history`，每次调用后丢失

### 9.3 网络访问

确保 Vercel 函数可访问：

- AI 平台域名（如 `apihub.agnes-ai.com`）
- 飞书 API（`open.feishu.cn`）
- 新闻源（`myzaker.com`、`news.sina.com.cn` 等）

---

## 十、故障排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 部署失败 | Node 版本或依赖错误 | 检查 `package.json`、`vercel.json`，查看 Build Logs |
| `/api/news` 返回 500 | 函数超时或代码报错 | 查看 Functions Logs；确认 `AI_API_KEY`、`FEISHU_APP_ID` 已设置 |
| 飞书未收到消息 | 机器人未进群 / 权限未审批 | 确认机器人已加入群聊，权限已审批 |
| 重复推送 | 未配置 KV | 按第 5 步配置 Vercel Redis |
| 精选数量不足 30 条 | API 限流或新闻重复 | 检查 AI 平台额度；增大 `NEWS_LIMIT` 或等待更多新鲜新闻 |

---

## 十一、相关文件

| 文件 | 说明 |
|------|------|
| [vercel.json](vercel.json) | Vercel 函数配置 |
| [api/news.js](api/news.js) | `/api/news` 入口 |
| [src/main.js](src/main.js) | 主程序 |
| [src/news_history.js](src/news_history.js) | 历史记录 / KV 支持 |
