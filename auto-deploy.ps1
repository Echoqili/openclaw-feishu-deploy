$serverHost = "43.143.207.242"
$serverUser = "root"
$projectDir = "/root/openclaw-feishu-deploy"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "部署新闻推送系统 - 修复重复发送问题" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 提示输入密码
$securePassword = Read-Host "请输入服务器密码" -AsSecureString
$cred = New-Object System.Management.Automation.PSCredential($serverUser, $securePassword)

Write-Host ""
Write-Host "[1/3] 拉取最新代码..." -ForegroundColor Yellow

$pullCmd = @"
cd $projectDir
git pull gitee master
"@

ssh -o StrictHostKeyChecking=no $serverUser@$serverHost $pullCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "代码拉取失败！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] 重启容器..." -ForegroundColor Yellow

ssh -o StrictHostKeyChecking=no $serverUser@$serverHost "docker restart news-bot"

Write-Host ""
Write-Host "[3/3] 等待容器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "部署完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "查看容器状态：" -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no $serverUser@$serverHost "docker ps | grep news-bot"
Write-Host ""
Write-Host "查看实时日志（按 Ctrl+C 退出）：" -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no $serverUser@$serverHost "docker logs -f news-bot --tail 30"
