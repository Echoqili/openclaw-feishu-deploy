FROM node:22-alpine

# 安装 canvas 依赖和中文字体
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    wqy-zenhei \
    fontconfig

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制源代码
COPY src ./src

# 创建必要的目录（配置通过环境变量注入）
RUN mkdir -p config output history logs

# 设置时区
ENV TZ=Asia/Shanghai

# 启动命令
CMD ["node", "src/main.js"]
