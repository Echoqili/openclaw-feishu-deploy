@echo off
chcp 65001 > nul
echo =========================================
echo 新闻抓取与飞书推送系统
echo =========================================

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未安装 Node.js
    echo 请先安装 Node.js 22 或更高版本
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js 版本: %NODE_VERSION%
echo.

:: 安装依赖
if not exist "node_modules" (
    echo 安装依赖...
    call npm install
    echo.
)

:: 检查配置
if not exist "config.json" (
    echo 警告: 未找到 config.json 配置文件
    echo 请复制 config.json.example 并填写配置
    pause
    exit /b 1
)

:: 创建必要的目录
if not exist "output" mkdir output
if not exist "logs" mkdir logs

echo 启动服务...
echo.

:: 启动
node main.js
pause
