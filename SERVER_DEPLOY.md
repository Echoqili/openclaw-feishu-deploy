# OpenClaw 飞书新闻推送系统 - 服务器部署指南

## 方式一：使用部署脚本（推荐）

### 在服务器上执行以下命令：

```bash
# 1. 连接到服务器
ssh root@43.143.207.242

# 2. 进入项目目录
cd /root/openclaw-feishu-deploy

# 3. 停止旧容器
docker stop news-bot-docker
docker rm news-bot-docker

# 4. 删除旧镜像
docker rmi news-bot:latest

# 5. 构建新镜像
docker build -t news-bot:latest .

# 6. 启动新容器
docker run -d \
  --name news-bot-docker \
  -v $(pwd)/config/config.json:/app/config/config.json \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/logs:/app/logs \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  news-bot:latest

# 7. 查看状态
docker ps | grep news-bot

# 8. 查看日志
docker logs -f news-bot-docker
```

## 方式二：一键部署脚本

在服务器上执行：

```bash
curl -o deploy.sh https://gitee.com/liccolicco/openclaw-feishu-deploy/raw/master/deploy.sh && \
chmod +x deploy.sh && \
./deploy.sh
```

## 方式三：使用 docker-compose

在服务器上创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  news-bot:
    image: news-bot:latest
    container_name: news-bot-docker
    volumes:
      - ./config/config.json:/app/config/config.json
      - ./output:/app/output
      - ./history:/app/history
      - ./logs:/app/logs
    environment:
      - TZ=Asia/Shanghai
    restart: unless-stopped
```

然后执行：

```bash
docker-compose up -d
```

## 验证部署

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f news-bot-docker

# 进入容器
docker exec -it news-bot-docker sh
```

## 常用命令

```bash
# 停止服务
docker stop news-bot-docker

# 启动服务
docker start news-bot-docker

# 重启服务
docker restart news-bot-docker

# 查看日志
docker logs -f news-bot-docker

# 删除容器和镜像
docker stop news-bot-docker
docker rm news-bot-docker
docker rmi news-bot:latest
```

## 配置说明

确保 `config/config.json` 已配置正确的参数：

```json
{
  "volcanoApiKey": "你的火山引擎 API Key",
  "volcanoModel": "ep-20260228235730-b8l6d",
  "feishuAppId": "你的飞书 App ID",
  "feishuAppSecret": "你的飞书 App Secret",
  "feishuChatIds": ["你的飞书群 ID"]
}
```

## 故障排查

1. **容器无法启动**
   ```bash
   docker logs news-bot-docker
   ```

2. **检查配置文件**
   ```bash
   cat config/config.json
   ```

3. **检查端口占用**
   ```bash
   netstat -tlnp | grep docker
   ```

4. **重启 Docker 服务**
   ```bash
   systemctl restart docker
   ```
