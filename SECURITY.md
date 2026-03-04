# 安全部署指南

## 敏感信息管理

本项目已将敏感配置信息从代码中分离，请按照以下步骤安全部署：

### 1. 本地开发环境

```bash
# 1. 复制环境变量示例文件
cp .env.example .env

# 2. 编辑 .env 文件，填入真实值
# - 火山引擎 API Key
# - 飞书 App ID 和 Secret
# - 腾讯云 CloudBase 配置（可选）

# 3. .env 文件已被 .gitignore 忽略，不会被提交
```

### 2. 服务器部署（Docker）

#### 方式一：使用环境变量

```bash
docker run -d \
  --name news-bot \
  -e VOLCANO_API_KEY=your_key \
  -e VOLCANO_API_SECRET=your_secret \
  -e FEISHU_APP_ID=your_app_id \
  -e FEISHU_APP_SECRET=your_app_secret \
  -e FEISHU_CHAT_IDS=chat_id_1,chat_id_2 \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/logs:/app/logs \
  news-bot:latest
```

#### 方式二：使用配置文件

```bash
# 1. 在服务器上创建配置文件
cat > /root/news-bot/config.json << 'EOF'
{
  "volcanoApiKey": "your_api_key",
  "volcanoApiSecret": "your_api_secret",
  "feishuAppId": "your_app_id",
  "feishuAppSecret": "your_app_secret",
  "feishuChatIds": ["chat_id_1", "chat_id_2"]
}
EOF

# 2. 设置文件权限（仅所有者可读）
chmod 600 /root/news-bot/config.json

# 3. 挂载配置文件启动容器
docker run -d \
  --name news-bot \
  -v /root/news-bot/config.json:/app/config/config.json \
  news-bot:latest
```

### 3. Gitee/GitHub 仓库安全

#### 已添加到 .gitignore 的文件：
- `.env` - 环境变量文件
- `config/config.json` - 配置文件
- `output/` - 输出文件
- `history/` - 历史记录
- `logs/` - 日志文件

#### 如果不小心提交了敏感信息：

1. **立即删除敏感文件**
```bash
git rm --cached .env
git rm --cached config/config.json
git commit -m "移除敏感配置文件"
```

2. **修改历史中的密钥**（如果已推送）
   - 使用 BFG Repo-Cleaner 或 git filter-branch
   - 或重新创建仓库

3. **轮换所有泄露的密钥**
   - 火山引擎 API Key
   - 飞书 App Secret
   - 腾讯云密钥

### 4. 配置文件说明

#### .env 文件示例：
```bash
VOLCANO_API_KEY=YOUR_VOLCANO_API_KEY_HERE
VOLCANO_API_SECRET=your_secret
FEISHU_APP_ID=cli_xxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxx
FEISHU_CHAT_IDS=oc_xxxxxxxx,oc_yyyyyyyy
```

#### config.json 示例：
```json
{
  "volcanoApiKey": "your_api_key",
  "volcanoApiSecret": "your_secret",
  "feishuAppId": "your_app_id",
  "feishuAppSecret": "your_app_secret",
  "feishuChatIds": ["chat_id_1", "chat_id_2"],
  "newsLimit": 50,
  "selectedLimit": 30
}
```

### 5. 最佳实践

- ✅ 永远不要将 `.env` 或 `config.json` 提交到版本控制
- ✅ 使用 `.env.example` 作为配置模板
- ✅ 定期轮换密钥
- ✅ 使用最小权限原则配置密钥
- ✅ 在 CI/CD 中使用环境变量或密钥管理服务
- ✅ 生产环境使用密钥管理服务（如 AWS Secrets Manager）

### 6. 密钥获取

- **火山引擎**: https://console.volcengine.com/ark
- **飞书开放平台**: https://open.feishu.cn/
- **腾讯云 CloudBase**: https://console.cloud.tencent.com/cloudbase
