# OpenClaw 飞书机器人部署指南

## 服务器信息
- 服务器IP: 43.143.207.242
- 系统: OPENCLOUDOS (Linux)
- 密码: P/[KY}+wa7?2|uc

## 部署步骤

### 第一步: 连接服务器并执行部署脚本

1. 使用SSH连接到服务器:
```bash
ssh root@43.143.207.242
# 输入密码: P/[KY}+wa7?2|uc
```

2. 上传并执行部署脚本:
```bash
# 上传 deploy_openclaw.sh 到服务器
# 然后执行:
chmod +x deploy_openclaw.sh
./deploy_openclaw.sh
```

### 第二步: 配置飞书开放平台应用

1. 访问飞书开放平台: https://open.feishu.cn/

2. 创建自建应用:
   - 点击"创建企业自建应用"
   - 填写应用名称(如: OpenClaw机器人)
   - 选择应用类型: 机器人
   - 创建应用

3. 获取凭证信息:
   - 进入应用详情页
   - 在"凭证与基础信息"中获取:
     * App ID
     * App Secret

4. 配置机器人权限:
   - 进入"权限管理"
   - 添加以下权限:
     * `im:message` - 接收消息
     * `im:message:send_as_bot` - 发送消息
     * `im:message:group_at_msg` - 群组@消息
     * `im:chat` - 聊天权限

5. 配置事件订阅:
   - 进入"事件订阅"
   - 订阅以下事件:
     * `im.message.receive_v1` - 接收消息事件
   - 设置请求URL:
     * `http://43.143.207.242:18789/webhook/feishu`
   - 保存并验证(需要先启动OpenClaw服务)

6. 发布应用:
   - 进入"版本管理与发布"
   - 点击"创建版本"
   - 选择"全员可用"
   - 发布应用

### 第三步: 配置OpenClaw连接飞书

1. 启动OpenClaw配置:
```bash
openclaw config
```

2. 按照提示选择:
   - 选择: Local
   - 选择: Channels
   - 选择: Configure Feishu

3. 输入飞书应用信息:
   - App ID: (从飞书开放平台获取)
   - App Secret: (从飞书开放平台获取)
   - Encrypt Key: (可选,如飞书应用配置了加密)
   - Verification Token: (可选,如飞书应用配置了验证令牌)

4. 配置完成后,保存配置

### 第四步: 启动OpenClaw服务

1. 启动Gateway服务:
```bash
openclaw gateway --port 18789 --verbose
```

2. 验证服务运行:
```bash
# 检查端口是否监听
netstat -tlnp | grep 18789
```

3. 设置为后台运行(推荐):
```bash
# 使用nohup
nohup openclaw gateway --port 18789 > /tmp/openclaw.log 2>&1 &

# 或使用systemd (需要创建service文件)
```

### 第五步: 将机器人添加到飞书群组

1. 在飞书中打开目标群组

2. 点击群设置 → 添加机器人

3. 搜索并添加你创建的应用

4. 机器人添加成功后,即可在群中@机器人进行对话

## 常见问题排查

### 问题1: 飞书事件订阅验证失败
**原因**: OpenClaw服务未启动或端口未开放

**解决**:
```bash
# 检查服务是否运行
ps aux | grep openclaw

# 检查端口是否监听
netstat -tlnp | grep 18789

# 检查防火墙
firewall-cmd --list-ports
firewall-cmd --add-port=18789/tcp --permanent
firewall-cmd --reload
```

### 问题2: 机器人无法接收消息
**原因**: 飞书权限未配置或事件未订阅

**解决**:
- 检查飞书应用权限是否已添加
- 检查事件订阅是否已启用
- 检查机器人是否已添加到群组

### 问题3: 机器人无法发送消息
**原因**: 发送消息权限未配置

**解决**:
- 在飞书开放平台添加 `im:message:send_as_bot` 权限
- 重新发布应用

### 问题4: OpenClaw服务自动停止
**原因**: 可能是内存不足或配置错误

**解决**:
```bash
# 查看日志
tail -f /tmp/openclaw.log

# 检查系统资源
free -h
df -h

# 重启服务
pkill openclaw
nohup openclaw gateway --port 18789 > /tmp/openclaw.log 2>&1 &
```

## 高级配置

### 配置AI模型

编辑配置文件 `~/.openclaw/openclaw.json`:
```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  },
  "channels": {
    "feishu": {
      "appId": "your_app_id",
      "appSecret": "your_app_secret"
    }
  }
}
```

### 配置系统服务(推荐)

创建systemd服务文件 `/etc/systemd/system/openclaw.service`:
```ini
[Unit]
Description=OpenClaw Gateway Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/openclaw gateway --port 18789
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用并启动服务:
```bash
systemctl daemon-reload
systemctl enable openclaw
systemctl start openclaw
systemctl status openclaw
```

### 配置防火墙

```bash
# 开放端口
firewall-cmd --add-port=18789/tcp --permanent
firewall-cmd --reload

# 验证
firewall-cmd --list-ports
```

## 监控和维护

### 查看日志
```bash
# 实时查看日志
tail -f /tmp/openclaw.log

# 查看最近100行
tail -n 100 /tmp/openclaw.log
```

### 检查服务状态
```bash
# 检查进程
ps aux | grep openclaw

# 检查端口
netstat -tlnp | grep 18789

# 检查systemd服务状态
systemctl status openclaw
```

### 重启服务
```bash
# 使用systemd
systemctl restart openclaw

# 或手动重启
pkill openclaw
nohup openclaw gateway --port 18789 > /tmp/openclaw.log 2>&1 &
```

## 参考资源

- OpenClaw官方文档: https://docs.openclaw.ai/
- OpenClaw GitHub: https://github.com/openclaw/openclaw
- 飞书开放平台: https://open.feishu.cn/
- 飞书插件: @m1heng-clawd/feishu

## 联系支持

如遇到问题,可以:
1. 查看OpenClaw文档: https://docs.openclaw.ai/
2. 查看OpenClaw GitHub Issues
3. 加入OpenClaw社区Discord
