# 服务器部署指南

## 服务器信息
- IP: 43.143.207.242
- 用户: root
- 密码: P/[KY}+wa7?2|uc
- 项目目录: /root/openclaw-feishu-deploy

## 部署步骤

### 1. 连接服务器

```bash
ssh root@43.143.207.242
# 输入密码: P/[KY}+wa7?2|uc
```

### 2. 克隆或更新项目

```bash
# 如果是首次部署
cd /root
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy

# 如果已存在，更新代码
cd /root/openclaw-feishu-deploy
git pull origin master
```

### 3. 安装 Node.js（如果未安装）

```bash
# 检查 Node.js 版本
node -v

# 如果未安装或版本过低，执行安装
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs
```

### 4. 安装系统依赖（canvas 模块需要）

```bash
yum install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
```

### 5. 安装项目依赖

```bash
npm config set registry https://registry.npmmirror.com/
npm install
```

### 6. 创建必要目录

```bash
mkdir -p output logs
```

### 7. 验证配置

```bash
# 查看配置文件
cat config.json

# 确认飞书群ID已配置
```

### 8. 测试运行

```bash
# 测试模式（立即执行一次）
node main.js --test
```

### 9. 启动定时任务

```bash
# 前台运行（测试用）
node main.js

# 后台运行（推荐）
nohup node main.js > logs/bot.log 2>&1 &

# 或使用 PM2（推荐）
npm install -g pm2
pm2 start main.js --name news-bot
pm2 save
pm2 startup
```

## 快速部署脚本

服务器上执行：

```bash
cd /root
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy
chmod +x deploy_news_bot.sh
./deploy_news_bot.sh
```

## 管理命令

### 查看运行状态

```bash
# 查看进程
ps aux | grep main.js

# 查看端口
netstat -tlnp | grep node

# 查看日志
tail -f logs/bot.log
tail -f logs/news-$(date +%Y-%m-%d).json
```

### 停止服务

```bash
# 查找进程ID
ps aux | grep main.js

# 停止进程
kill <PID>

# 或使用 PM2
pm2 stop news-bot
```

### 重启服务

```bash
# 手动重启
pkill -f main.js
nohup node main.js > logs/bot.log 2>&1 &

# 或使用 PM2
pm2 restart news-bot
```

## 测试命令

```bash
# 测试新闻抓取
node news_crawler.js

# 测试新闻分类
node news_classifier.js

# 测试图片生成
node image_generator.js

# 测试飞书连接
node feishu_sender.js

# 完整测试
node main.js --test
```

## 配置 systemd 服务（可选）

创建服务文件：

```bash
cat > /etc/systemd/system/news-bot.service << 'EOF'
[Unit]
Description=News Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/openclaw-feishu-deploy
ExecStart=/usr/bin/node main.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

启动服务：

```bash
systemctl daemon-reload
systemctl enable news-bot
systemctl start news-bot
systemctl status news-bot
```

## 故障排查

### 1. 依赖安装失败

```bash
# 清除缓存重新安装
rm -rf node_modules
npm install
```

### 2. Canvas 模块编译失败

```bash
# 安装所有依赖
yum groupinstall "Development Tools"
yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel

# 重新编译
npm rebuild canvas
```

### 3. 飞书推送失败

```bash
# 检查网络
curl -v https://open.feishu.cn/

# 测试飞书 API
node -e "const s = require('./feishu_sender'); new s().getChatList().then(console.log);"
```

### 4. 查看详细日志

```bash
# 实时日志
tail -f logs/bot.log

# 查看错误
grep -i error logs/bot.log
```

## 定时任务说明

- **默认时间**: 每天 10:00
- **修改时间**: 编辑 `config.json` 中的 `cronExpression`
- **Cron 表达式**: `分 时 日 月 星期`
  - `0 10 * * *` - 每天 10:00
  - `0 9,18 * * *` - 每天 9:00 和 18:00
  - `0 */6 * * *` - 每 6 小时

## 监控建议

```bash
# 设置日志轮转
cat > /etc/logrotate.d/news-bot << 'EOF'
/root/openclaw-feishu-deploy/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF

# 设置监控脚本
cat > /root/monitor.sh << 'EOF'
#!/bin/bash
if ! pgrep -f "node main.js" > /dev/null; then
    cd /root/openclaw-feishu-deploy
    nohup node main.js > logs/bot.log 2>&1 &
    echo "服务已重启" >> logs/monitor.log
fi
EOF

chmod +x /root/monitor.sh

# 添加到 crontab（每 5 分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/monitor.sh") | crontab -
```

## 备份配置

```bash
# 备份配置文件
cp config.json config.json.backup

# 定期备份
crontab -e
# 添加: 0 2 * * * cp /root/openclaw-feishu-deploy/config.json /root/backup/config.json.$(date +\%Y\%m\%d)
```
