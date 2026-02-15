/**
 * 新闻抓取与推送主程序
 * 整合所有模块，实现定时任务
 */

const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const NewsCrawler = require('./news_crawler');
const NewsClassifier = require('./news_classifier');
const ImageGenerator = require('./image_generator');
const FeishuSender = require('./feishu_sender');

class NewsBot {
  constructor(config = {}) {
    // 初始化各模块
    this.crawler = new NewsCrawler();
    this.classifier = new NewsClassifier({
      apiKey: config.volcanoApiKey,
      apiSecret: config.volcanoApiSecret,
      endpoint: config.volcanoEndpoint
    });
    this.imageGenerator = new ImageGenerator({
      outputDir: config.outputDir || './output'
    });
    this.sender = new FeishuSender({
      appId: config.feishuAppId,
      appSecret: config.feishuAppSecret
    });

    this.config = config;
    this.chatIds = config.feishuChatIds || [];
    this.isRunning = false;
  }

  /**
   * 执行完整的新闻抓取和推送流程
   */
  async run() {
    if (this.isRunning) {
      console.log('任务正在运行中，跳过本次执行');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n========================================');
      console.log('开始执行新闻抓取和推送任务');
      console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log('========================================\n');

      // 1. 抓取新闻
      console.log('[1/5] 开始抓取新闻...');
      const newsList = await this.crawler.fetchLatestNews(this.config.newsLimit || 30);
      console.log(`抓取到 ${newsList.length} 条新闻\n`);

      if (newsList.length === 0) {
        console.log('未抓取到新闻，任务结束');
        return;
      }

      // 2. 分类新闻
      console.log('[2/5] 开始分类新闻...');
      const classifiedNews = await this.classifier.classifyNewsBatch(newsList);
      console.log(`分类完成 ${classifiedNews.length} 条新闻\n`);

      // 3. 生成摘要
      console.log('[3/5] 生成新闻摘要...');
      const summaryData = await this.classifier.generateDailySummary(classifiedNews);
      console.log('摘要生成完成\n');

      // 4. 生成图片
      console.log('[4/5] 生成新闻图片...');
      const imagePath = await this.imageGenerator.generateNewsImage(summaryData);
      console.log(`图片生成成功: ${imagePath}\n`);

      // 5. 推送到飞书
      console.log('[5/5] 推送到飞书...');
      if (this.chatIds.length > 0) {
        const results = await this.sender.sendToMultipleChats(
          this.chatIds,
          summaryData,
          imagePath
        );
        
        const successCount = results.filter(r => r.success).length;
        console.log(`推送完成: 成功 ${successCount}/${results.length}\n`);
      } else {
        console.log('警告: 未配置飞书群ID，跳过推送\n');
      }

      // 6. 保存日志
      await this.saveLog({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000,
        newsCount: newsList.length,
        summaryData
      });

      console.log('========================================');
      console.log('任务执行完成！');
      console.log(`总耗时: ${(Date.now() - startTime) / 1000} 秒`);
      console.log('========================================\n');

    } catch (error) {
      console.error('任务执行失败:', error);
      await this.saveLog({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        error: error.message
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 启动定时任务
   * 默认每天10:00执行
   */
  startScheduledTask(cronExpression = '0 10 * * *') {
    console.log(`启动定时任务，执行时间: ${cronExpression}`);
    console.log('当前时间:', new Date().toLocaleString('zh-CN'));
    
    // 创建定时任务
    this.task = cron.schedule(cronExpression, async () => {
      await this.run();
    }, {
      timezone: 'Asia/Shanghai'
    });

    console.log('定时任务已启动，等待执行...\n');
  }

  /**
   * 停止定时任务
   */
  stopScheduledTask() {
    if (this.task) {
      this.task.stop();
      console.log('定时任务已停止');
    }
  }

  /**
   * 保存日志
   */
  async saveLog(logData) {
    try {
      const logDir = './logs';
      await fs.mkdir(logDir, { recursive: true });
      
      const filename = `news-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(logDir, filename);
      
      // 读取现有日志
      let logs = [];
      try {
        const data = await fs.readFile(filepath, 'utf-8');
        logs = JSON.parse(data);
      } catch (e) {
        // 文件不存在，创建新日志
      }
      
      // 添加新日志
      logs.push(logData);
      
      // 保存
      await fs.writeFile(filepath, JSON.stringify(logs, null, 2));
      console.log(`日志已保存: ${filepath}`);
    } catch (error) {
      console.error('保存日志失败:', error.message);
    }
  }

  /**
   * 测试运行（不设置定时）
   */
  async test() {
    console.log('测试模式运行...\n');
    await this.run();
  }
}

// 主函数
async function main() {
  // 加载配置
  const config = {
    // 火山引擎配置
    volcanoApiKey: process.env.VOLCANO_API_KEY || 'YOUR_VOLCANO_API_KEY_HERE',
    volcanoApiSecret: process.env.VOLCANO_API_SECRET || '',
    volcanoEndpoint: process.env.VOLCANO_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    
    // 飞书配置
    feishuAppId: process.env.FEISHU_APP_ID || 'YOUR_FEISHU_APP_ID_HERE',
    feishuAppSecret: process.env.FEISHU_APP_SECRET || 'YOUR_FEISHU_APP_SECRET_HERE',
    feishuChatIds: (process.env.FEISHU_CHAT_IDS || '').split(',').filter(Boolean),
    
    // 其他配置
    newsLimit: parseInt(process.env.NEWS_LIMIT || '30'),
    outputDir: process.env.OUTPUT_DIR || './output'
  };

  // 从配置文件加载（如果存在）
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configFile = await fs.readFile(configPath, 'utf-8');
    const fileConfig = JSON.parse(configFile);
    Object.assign(config, fileConfig);
    console.log('已加载配置文件');
  } catch (e) {
    console.log('未找到配置文件，使用默认配置');
  }

  // 创建机器人实例
  const bot = new NewsBot(config);

  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    // 测试模式
    await bot.test();
    process.exit(0);
  } else if (args.includes('--once')) {
    // 执行一次
    await bot.run();
    process.exit(0);
  } else {
    // 启动定时任务
    const cronExpression = process.env.CRON_EXPRESSION || '0 10 * * *';
    bot.startScheduledTask(cronExpression);
    
    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n接收到停止信号...');
      bot.stopScheduledTask();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n接收到停止信号...');
      bot.stopScheduledTask();
      process.exit(0);
    });
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动
if (require.main === module) {
  main().catch(console.error);
}

module.exports = NewsBot;
