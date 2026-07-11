# Vercel 部署指南

本文档详细说明如何将 OpenClaw 新闻机器人部署到 Vercel 平台。

---

## 一、前提条件

### 1.1 账户准备

| 平台 | 要求 | 说明 |
|------|------|------|
| Vercel | 注册账户 | [https://vercel.com](https://vercel.com)（免费版可用） |
| GitHub | 仓库已推送 | 代码已在 GitHub 上（本项目：`https://github.com/Echoqili/openclaw-feishu-deploy`） |
| NVIDIA NGC | API Key | [https://ngc.nvidia.com](https://ngc.nvidia.com) 获取免费 API Key |

### 1.2 飞书机器人准备

机器人创建后会**自动获取所有加入的群列表并推送**，无需手动配置群 ID。

---

## 二、飞书机器人创建

### 步骤 1：创建企业自建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击 **创建应用** → **企业自建应用**
3. 填写应用信息：
   - 应用名称：`OpenClaw News Bot`
   - 应用描述：`自动新闻抓取、分类与推送机器人`
   - 应用图标：选择一个合适的图标
4. 点击 **创建**

### 步骤 2：获取凭证

创建成功后，在 **凭证与基础信息** 页面获取：

- **App ID**：`cli_xxxxxxxxxxxxxx`
- **App Secret**：`xxxxxxxxxxxxxxxxxxxx`

### 步骤 3：添加机器人能力

1. 在左侧菜单点击 **机器人**
2. 开启 **启用机器人** 开关
3. 点击 **添加机器人头像**（可选）

### 步骤 4：添加权限

1. 在左侧菜单点击 **权限管理**
2. 添加以下权限：

| 权限名称 | 权限说明 | 权限范围 |
|----------|----------|----------|
| `im:message` | 发送消息 | 全部 |
| `im:message:readonly` | 读取消息 | 全部 |
| `im:chat` | 群聊管理 | 全部 |
| `im:chat:readonly` | 读取群列表 | 全部 |

3. 点击 **申请权限**，等待管理员审批

### 步骤 5：将机器人加入群聊

在飞书客户端中：
1. 打开目标群聊
2. 点击群设置 → **群机器人**
3. 点击 **添加机器人** → 搜索并选择 `OpenClaw News Bot`

---

## 三、NVIDIA API Key 获取

1. 访问 [NVIDIA NGC](https://ngc.nvidia.com)
2. 使用 NVIDIA 账号登录（无账号需注册）
3. 访问 [API Keys 页面](https://ngc.nvidia.com/setup/api-key)
4. 点击 **Generate API Key**
5. 复制生成的 API Key（格式：`nvapi-xxxxxxxxxxxxxxxx`）

---

## 四、Vercel 部署

### 步骤 1：连接 GitHub 仓库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New** → **Project**
3. 在 **Import Git Repository** 页面搜索并选择 `openclaw-feishu-deploy`
4. 点击 **Import**

### 步骤 2：配置项目

在配置页面：

- **Project Name**：`openclaw-news-bot`（自动填充）
- **Framework Preset**：选择 `Other`
- **Build Command**：留空（无需构建）
- **Output Directory**：留空

### 步骤 3：设置环境变量

在 **Environment Variables** 部分添加以下变量：

```bash
# AI 模型配置（必填）
AI_API_KEY=你的NVIDIA_API_KEY
AI_ENDPOINT=https://integrate.api.nvidia.com/v1/chat/completions
AI_MODEL=meta/llama-3.1-70b-instruct

# 飞书配置（必填）
FEISHU_APP_ID=你的飞书AppID
FEISHU_APP_SECRET=你的飞书AppSecret

# 可选配置（保持默认即可）
NEWS_LIMIT=50
SELECTED_LIMIT=20
TZ=Asia/Shanghai
```

> **注意**：`FEISHU_CHAT_IDS` 不需要配置，机器人会自动获取所有已加入的群并推送。

### 步骤 4：部署

点击 **Deploy**，Vercel 会自动：
1. 克隆仓库
2. 安装依赖（npm install）
3. 部署 API 函数

部署成功后，你会看到类似这样的域名：`https://openclaw-news-bot.vercel.app`

---

## 五、验证部署

### 5.1 测试 API 端点

部署成功后，访问以下 URL 测试新闻推送：

```
https://your-vercel-domain.vercel.app/api/news
```

成功响应示例：
```json
{
  "success": true,
  "message": "新闻推送任务执行完成",
  "timestamp": "2026-07-11T10:30:00.000Z"
}
```

### 5.2 查看日志

在 Vercel Dashboard 中：
1. 进入项目页面
2. 点击 **Functions** 标签页
3. 点击 `/api/news` 函数查看执行日志

### 5.3 检查飞书消息

测试 API 后，检查飞书群是否收到新闻推送卡片。

---

## 六、定时任务配置

Vercel Serverless Functions 是按需执行的，需要外部触发器来定时调用。

### 方案一：使用 Vercel Cron Jobs（推荐）

1. 在 Vercel Dashboard 中进入项目
2. 点击 **Settings** → **Cron Jobs**
3. 点击 **Add Cron Job**
4. 配置：
   - **Name**：`daily-news-push`
   - **Path**：`/api/news`
   - **Schedule**：`30 10,22 * * *`（每天 10:30 和 22:30）
   - **Region**：选择离你最近的区域

### 方案二：使用外部定时任务服务

如果 Vercel Cron Jobs 不可用，可以使用以下免费服务：

| 服务 | 说明 | 免费限制 |
|------|------|----------|
| [CronJob.org](https://cron-job.org) | 免费定时任务服务 | 无限制 |
| [EasyCron](https://www.easycron.com) | 免费定时任务服务 | 100 次/月 |
| [GitHub Actions](https://github.com) | 使用 GitHub Actions 定时触发 | 2000 分钟/月 |

### GitHub Actions 定时触发配置

创建 `.github/workflows/daily-news.yml`：

```yaml
name: Daily News Push
on:
  schedule:
    - cron: '30 2,14 * * *'  # UTC 时间，对应北京时间 10:30 和 22:30
jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger News API
        run: |
          curl -s -X GET ${{ secrets.VERCEL_API_URL }}/api/news
```

在 GitHub 仓库 **Settings** → **Secrets and variables** → **Actions** 中添加：
- `VERCEL_API_URL`: `https://your-vercel-domain.vercel.app`

---

## 七、环境变量说明

### 必填变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `AI_API_KEY` | NVIDIA API Key | `nvapi-xxxxxxxxxxxxxxxx` |
| `FEISHU_APP_ID` | 飞书应用 ID | `cli_xxxxxxxxxxxxxx` |
| `FEISHU_APP_SECRET` | 飞书应用 Secret | `xxxxxxxxxxxxxxxxxxxx` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `AI_ENDPOINT` | AI API 端点 | `https://integrate.api.nvidia.com/v1/chat/completions` |
| `AI_MODEL` | AI 模型名称 | `meta/llama-3.1-70b-instruct` |
| `NEWS_LIMIT` | 每次抓取新闻数量 | `50` |
| `SELECTED_LIMIT` | 精选新闻数量 | `20` |
| `TZ` | 时区 | `Asia/Shanghai` |

---

## 八、注意事项

### 8.1 Serverless 函数限制

Vercel Serverless Functions 有以下限制：
- **执行时间限制**：最长 300 秒（5 分钟）
- **内存限制**：免费版 1024 MB
- **冷启动时间**：首次请求可能需要几秒

### 8.2 存储问题

Vercel 的 `/tmp` 目录是临时的（每次调用会重置），但本项目设计支持两种模式：

**模式 A：本地存储（默认）**
- 新闻历史记录保存在 `/tmp/history`
- 每次执行后历史记录会丢失，可能导致重复推送

**模式 B：CloudBase 云数据库（推荐）**

如需持久化存储，添加以下环境变量：

```bash
CLOUDBASE_ENV=你的云开发环境ID
CLOUDBASE_SECRET_ID=你的云开发SecretID
CLOUDBASE_SECRET_KEY=你的云开发SecretKey
```

### 8.3 免费计划限制

- Vercel Hobby 计划有每月 100 GB 带宽限制
- Serverless Functions 有每月 1000 次免费调用
- 超出限制后会暂停服务

### 8.4 网络访问

确保以下域名可访问：
- `https://integrate.api.nvidia.com`（NVIDIA API）
- `https://open.feishu.cn`（飞书 API）
- `https://www.myzaker.com`（新闻源）

---

## 九、故障排查

### 问题 1：部署失败

**原因**：依赖安装失败或配置错误

**解决方案**：
- 检查 `package.json` 是否存在语法错误
- 检查网络连接是否正常
- 查看 **Deployments** 和 **Functions** 获取详细错误信息

### 问题 2：API 调用返回 500

**原因**：函数执行超时或代码错误

**解决方案**：
- 查看函数日志获取详细错误信息
- 检查环境变量是否正确配置
- 确保 `AI_API_KEY`、`FEISHU_APP_ID`、`FEISHU_APP_SECRET` 不为空

### 问题 3：新闻推送失败

**原因**：权限不足或群聊未添加机器人

**解决方案**：
- 确认机器人已加入目标群聊
- 确认飞书应用已申请 `im:message` 和 `im:chat` 权限
- 检查飞书开放平台的权限审批状态

### 问题 4：重复推送新闻

**原因**：历史记录丢失（Serverless 临时存储）

**解决方案**：
- 配置 CloudBase 云数据库实现持久化存储
- 参考 [8.2 存储问题](#82-存储问题)

---

## 十、更新部署

如需更新代码：

1. 在本地提交并推送到 GitHub
2. Vercel 会自动检测到代码变更并触发重新部署
3. 等待部署完成即可

---

## 十一、相关文件

| 文件 | 说明 |
|------|------|
| [vercel.json](vercel.json) | Vercel 部署配置 |
| [api/news.js](api/news.js) | Vercel API 端点 |
| [src/main.js](src/main.js) | 主程序入口 |
| [src/feishu_sender.js](src/feishu_sender.js) | 飞书推送模块 |
| [.env.example](.env.example) | 环境变量配置示例 |

---

## 十二、支持

如有问题，请查看项目文档或提交 Issue。
