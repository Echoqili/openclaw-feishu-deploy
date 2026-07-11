# Render 部署指南

本文档详细说明如何将 OpenClaw 新闻机器人部署到 Render 平台。

---

## 一、前提条件

### 1.1 账户准备

| 平台 | 要求 | 说明 |
|------|------|------|
| Render | 注册账户 | [https://render.com](https://render.com)（免费 Starter 计划可用） |
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

## 四、Render 部署

### 步骤 1：连接 GitHub 仓库

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 **New +** → **Background Worker**
3. 选择 **Build and deploy from a Git repository**
4. 输入 GitHub 仓库地址：`https://github.com/Echoqili/openclaw-feishu-deploy`
5. 点击 **Connect**

### 步骤 2：配置服务

Render 会自动读取 [render.yaml](render.yaml) 配置：

| 配置项 | 值 |
|--------|-----|
| **服务类型** | Background Worker |
| **服务名称** | `openclaw-news-bot` |
| **运行时** | Docker |
| **Dockerfile 路径** | `./Dockerfile` |
| **计划** | Starter（免费） |
| **时区** | Asia/Shanghai |

### 步骤 3：设置环境变量

在 **Environment** 标签页中添加以下 Secret：

```bash
# AI 模型配置（必填）
AI_API_KEY=你的NVIDIA_API_KEY

# 飞书配置（必填）
FEISHU_APP_ID=你的飞书AppID
FEISHU_APP_SECRET=你的飞书AppSecret

# 可选配置（保持默认即可）
# NEWS_LIMIT=50
# SELECTED_LIMIT=20
# CRON_EXPRESSION=30 10,22 * * *
```

> **注意**：`FEISHU_CHAT_IDS` 不需要配置，机器人会自动获取所有已加入的群并推送。

### 步骤 4：启动部署

点击 **Create Background Worker**，Render 会自动：
1. 克隆仓库
2. 构建 Docker 镜像（包含 Node.js、canvas 依赖、中文字体）
3. 启动容器

---

## 五、验证部署

### 5.1 查看日志

在 Render Dashboard 中：
1. 进入 `openclaw-news-bot` 服务页面
2. 点击 **Logs** 标签页
3. 确认服务启动成功，无报错

成功启动日志示例：
```
启动定时任务，执行时间：30 10,22 * * *
当前时间: 2026/7/11 10:00:00
定时任务已启动，等待执行...

执行时间说明:
  - 早上 10:30
  - 晚上 22:30
```

### 5.2 手动测试

如需立即测试一次（不等待定时），在 **Shell** 标签页执行：

```bash
npm run once
```

### 5.3 检查飞书消息

等待定时任务执行（默认每天 10:30 和 22:30），检查飞书群是否收到新闻推送卡片。

---

## 六、环境变量说明

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
| `CRON_EXPRESSION` | 定时任务表达式 | `30 10,22 * * *` |
| `TZ` | 时区 | `Asia/Shanghai` |

### 定时任务表达式说明

默认 `30 10,22 * * *` 表示：
- 每天上午 10:30 执行一次
- 每天晚上 22:30 执行一次

如需修改，参考 cron 表达式格式：
```
分 时 日 月 周
```

---

## 七、注意事项

### 7.1 存储问题

Render 的文件系统是**临时的**（重启后会丢失），但本项目设计支持两种模式：

**模式 A：本地存储（默认）**
- 新闻历史记录保存在本地 `history/` 目录
- 每次重启后历史记录会重置，可能导致重复推送

**模式 B：CloudBase 云数据库（推荐）**

如需持久化存储，添加以下环境变量：

```bash
CLOUDBASE_ENV=你的云开发环境ID
CLOUDBASE_SECRET_ID=你的云开发SecretID
CLOUDBASE_SECRET_KEY=你的云开发SecretKey
```

### 7.2 免费计划限制

- Render Starter 计划有每月 750 小时免费额度
- 超出额度后会暂停服务
- 如需持续运行，建议升级到付费计划

### 7.3 网络访问

确保以下域名可访问：
- `https://integrate.api.nvidia.com`（NVIDIA API）
- `https://open.feishu.cn`（飞书 API）
- `https://www.myzaker.com`（新闻源）

### 7.4 飞书权限

如果机器人无法获取群列表或发送消息，请检查：
1. 权限是否已申请并通过审批
2. 机器人是否已加入目标群聊
3. App ID 和 App Secret 是否正确

---

## 八、故障排查

### 问题 1：部署失败

**原因**：Docker 构建失败

**解决方案**：
- 检查 Dockerfile 是否存在语法错误
- 检查网络连接是否正常
- 查看 **Events** 和 **Logs** 获取详细错误信息

### 问题 2：无法获取飞书访问令牌

**原因**：App ID 或 App Secret 错误

**解决方案**：
- 确认环境变量中的 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 正确
- 确认飞书应用已启用

### 问题 3：新闻推送失败

**原因**：权限不足或群聊未添加机器人

**解决方案**：
- 确认机器人已加入目标群聊
- 确认飞书应用已申请 `im:message` 和 `im:chat` 权限
- 检查飞书开放平台的权限审批状态

### 问题 4：重复推送新闻

**原因**：历史记录丢失（Render 文件系统临时）

**解决方案**：
- 配置 CloudBase 云数据库实现持久化存储
- 参考 [7.1 存储问题](#71-存储问题)

---

## 九、更新部署

如需更新代码：

1. 在本地提交并推送到 GitHub
2. Render 会自动检测到代码变更并触发重新部署
3. 等待部署完成即可

---

## 十、相关文件

| 文件 | 说明 |
|------|------|
| [render.yaml](render.yaml) | Render 部署配置 |
| [Dockerfile](Dockerfile) | Docker 镜像构建配置 |
| [src/main.js](src/main.js) | 主程序入口 |
| [src/feishu_sender.js](src/feishu_sender.js) | 飞书推送模块 |
| [.env.example](.env.example) | 环境变量配置示例 |

---

## 十一、支持

如有问题，请查看项目文档或提交 Issue。
