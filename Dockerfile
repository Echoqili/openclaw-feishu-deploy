FROM node:22-slim

# 安装中文字体和基础依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-cjk \
    fontconfig \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装生产依赖（使用 npm install 以兼容可能不同步的 lock 文件）
RUN npm install --omit=dev

# 复制源代码
COPY src ./src

# 创建必要的目录（配置通过环境变量注入）
RUN mkdir -p config output history logs

# 设置时区
ENV TZ=Asia/Shanghai

# 启动命令
CMD ["node", "src/main.js"]
