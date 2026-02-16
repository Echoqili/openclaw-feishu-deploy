# 🚀 部署和测试指南

## 一、服务器部署（自动）

```bash
# 1. 连接服务器
ssh root@43.143.207.242
# 密码: P/[KY}+wa7?2|uc

# 2. 下载部署脚本
cd /root
wget https://gitee.com/liccolicco/openclaw-feishu-deploy/raw/master/deploy_and_test.sh
# 或直接克隆项目
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
cd openclaw-feishu-deploy

# 3. 执行部署脚本
chmod +x deploy_and_test.sh
./deploy_and_test.sh
```

## 二、手动部署（可选）

```bash
# 连接服务器
ssh root@43.143.207.242

# 克隆或更新项目
cd /root
git clone https://gitee.com/liccolicco/openclaw-feishu-deploy.git
# 或: cd openclaw-feishu-deploy && git pull origin master

# 安装依赖
npm install

# 创建目录
mkdir -p output logs history

# 查看配置
cat config.json
```

## 三、立即测试

```bash
cd /root/openclaw-feishu-deploy

# 测试模式（立即执行一次）
node main.js --test
```

测试会执行以下操作：
1. ✅ 抓取 ZAKER 最新新闻（50条）
2. ✅ 过滤已发送的新闻（去重）
3. ✅ 使用 GLM-4.7 智能分类
4. ✅ 精选最佳新闻（20条）
5. ✅ 生成精美图片
6. ✅ 推送到飞书群

## 四、查看结果

### 1. 查看飞书群
检查你的飞书群是否收到消息，应该包含：
- 📊 新闻摘要图片
- 📋 新闻分类统计
- 🔗 新闻详情链接

### 2. 查看日志
```bash
# 实时日志
tail -f logs/bot.log

# 今天的详细日志
tail -f logs/news-$(date +%Y-%m-%d).json

# 历史记录
ls -lh history/
```

### 3. 查看生成的图片
```bash
ls -lh output/
```

## 五、启动定时任务

### 方式一：后台运行（简单）

```bash
cd /root/openclaw-feishu-deploy

# 启动
nohup node main.js > logs/bot.log 2>&1 &

# 查看进程
ps aux | grep main.js

# 查看日志
tail -f logs/bot.log
```

### 方式二：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd /root/openclaw-feishu-deploy
pm2 start main.js --name news-bot

# 查看状态
pm2 status

# 查看日志
pm2 logs news-bot

# 设置开机自启
pm2 save
pm2 startup
```

## 六、定时任务说明

- ⏰ **执行时间**: 每天 10:30 和 22:30
- 🔄 **去重机制**: 自动记录已发送新闻，7天内不重复
- 📊 **精选数量**: 每次推送约 20 条精选新闻
- 🎯 **质量保证**: 优先推送重要、正面的新闻

## 七、常用命令

```bash
# 查看运行状态
ps aux | grep main.js
pm2 status  # 如果使用 PM2

# 查看日志
tail -f logs/bot.log
pm2 logs news-bot  # 如果使用 PM2

# 重启服务
pkill -f main.js
nohup node main.js > logs/bot.log 2>&1 &
# 或
pm2 restart news-bot  # 如果使用 PM2

# 停止服务
pkill -f main.js
# 或
pm2 stop news-bot  # 如果使用 PM2

# 手动执行一次
node main.js --once
```

## 八、功能验证

### 验证去重功能
```bash
# 第一次运行
node main.js --test

# 查看历史记录
cat history/sent_news.json | grep -o '"title"' | wc -l

# 第二次运行（应该提示没有新新闻）
node main.js --test
```

### 验证定时任务
```bash
# 启动服务
pm2 start main.js --name news-bot

# 查看日志确认定时任务已启动
pm2 logs news-bot

# 应该看到:
# "启动定时任务，执行时间: 0 10,22 * * *"
# "执行时间说明: 早上 10:30, 晚上 22:30"
```

## 九、故障排查

### 问题 1: 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules
npm cache clean --force
npm install
```

### 问题 2: Canvas 模块编译失败
```bash
# 安装所有依赖
yum groupinstall "Development Tools"
yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel

# 重新编译
npm rebuild canvas
```

### 问题 3: 飞书推送失败
```bash
# 测试飞书连接
node -e "const s = require('./feishu_sender'); new s().getChatList().then(console.log);"

# 检查网络
curl -v https://open.feishu.cn/
```

### 问题 4: 新闻抓取失败
```bash
# 测试网络
curl -v https://www.myzaker.com/

# 单独测试抓取
node news_crawler.js
```

## 十、监控和维护

### 设置监控脚本
```bash
cat > /root/monitor_news.sh << 'EOF'
#!/bin/bash
if ! pgrep -f "node main.js" > /dev/null; then
    cd /root/openclaw-feishu-deploy
    nohup node main.js > logs/bot.log 2>&1 &
    echo "$(date): 服务已重启" >> logs/monitor.log
fi
EOF

chmod +x /root/monitor_news.sh

# 添加到 crontab（每5分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/monitor_news.sh") | crontab -
```

### 查看统计信息
```bash
# 查看历史记录统计
node -e "
const h = require('./news_history');
new h().init().then(() => {
  const stats = new h().getStats();
  console.log('统计:', stats);
});
"
```

## 📝 配置总结

当前配置：
- ✅ 飞书群 ID: `oc_your_chat_id_here`
- ✅ 定时任务: 每天 10:30 和 22:30
- ✅ 新闻抓取: 每次最多 50 条
- ✅ 精选推送: 每次最多 20 条
- ✅ 历史保留: 7 天
- ✅ 去重机制: 已启用

## 🎯 快速测试步骤

```bash
# 1. SSH 连接
ssh root@43.143.207.242

# 2. 进入目录
cd /root/openclaw-feishu-deploy

# 3. 拉取最新代码
git pull origin master

# 4. 安装依赖（如果需要）
npm install

# 5. 测试运行
node main.js --test

# 6. 查看飞书群确认消息

# 7. 启动定时任务
pm2 start main.js --name news-bot
pm2 save
```

完成！系统会每天自动在 10:30 和 22:30 推送精选新闻到你的飞书群。
