$serverHost = "43.143.207.242"
$serverUser = "root"
$projectDir = "/root/openclaw-feishu-deploy"
$sshCmd = "ssh -o StrictHostKeyChecking=no $serverUser@$serverHost"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "部署新闻推送系统到服务器" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 在服务器上执行部署脚本
$script = @'
cd /root/openclaw-feishu-deploy

echo "========================================="
echo "停止旧容器..."
docker stop news-bot-docker 2>/dev/null || true
docker rm news-bot-docker 2>/dev/null || true

echo "删除旧镜像..."
docker rmi news-bot:latest 2>/dev/null || true

echo "========================================="
echo "构建新镜像..."
docker build -t news-bot:latest .

echo "========================================="
echo "启动新容器..."
docker run -d \
  --name news-bot-docker \
  -v $(pwd)/config/config.json:/app/config/config.json \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/logs:/app/logs \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  news-bot:latest

echo "========================================="
echo "容器状态:"
docker ps | grep news-bot

echo ""
echo "部署完成!"
echo "========================================="
'@

Write-Host "执行远程部署脚本..." -ForegroundColor Yellow
Write-Host ""

Invoke-Expression "$sshCmd `"$script`""

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "部署完成!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
