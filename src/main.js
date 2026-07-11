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
const NewsHistory = require('./news_history');

/**
 * 进程锁文件路径
 */
const LOCK_FILE = path.join(process.env.OUTPUT_DIR || './output', '.news-bot.lock');

class NewsBot {
  constructor(config = {}) {
    // 初始化各模块
    this.crawler = new NewsCrawler();
    this.classifier = new NewsClassifier({
      apiKey: config.aiApiKey,
      apiSecret: config.aiApiSecret,
      endpoint: config.aiEndpoint,
      model: config.aiModel
    });
    this.imageGenerator = new ImageGenerator({
      outputDir: config.outputDir || './output',
      maxDisplayItems: config.selectedLimit || 30
    });
    this.sender = new FeishuSender({
      appId: config.feishuAppId,
      appSecret: config.feishuAppSecret
    });
    this.history = new NewsHistory({
      historyDir: config.historyDir || './history',
      maxHistoryDays: config.maxHistoryDays || 7,
      cloudbaseEnv: config.cloudbaseEnv || null,
      cloudbaseSecretId: config.cloudbaseSecretId || null,
      cloudbaseSecretKey: config.cloudbaseSecretKey || null,
      cloudbaseCollection: 'news_history'
    });

    this.config = config;
    this.chatIds = config.feishuChatIds || [];
    this.isRunning = false;
    this.historyInitialized = false;
    this.lockAcquired = false;
  }

  /**
   * 初始化历史记录
   */
  async ensureHistoryInit() {
    if (!this.historyInitialized) {
      await this.history.init();
      this.historyInitialized = true;
    }
  }

  /**
   * 获取进程锁
   */
  async acquireLock() {
    try {
      // 创建锁目录
      const lockDir = path.dirname(LOCK_FILE);
      await fs.mkdir(lockDir, { recursive: true });
      
      // 尝试创建锁文件
      const lockContent = `${process.pid}\n${new Date().toISOString()}`;
      await fs.writeFile(LOCK_FILE, lockContent, { flag: 'wx' });
      
      this.lockAcquired = true;
      console.log('✓ 进程锁已获取');
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') {
        // 锁文件已存在，读取内容检查锁是否过期
        try {
          const lockContent = await fs.readFile(LOCK_FILE, 'utf-8');
          const lines = lockContent.trim().split('\n');
          const lockPid = parseInt(lines[0]);
          const lockTime = new Date(lines[1]);
          
          // 如果锁超过 1 小时，认为已过期
          const lockAge = Date.now() - lockTime.getTime();
          if (lockAge > 60 * 60 * 1000) {
            console.log('⚠️ 检测到过期锁，强制获取');
            await fs.unlink(LOCK_FILE);
            return this.acquireLock();
          }
          
          // 检查进程是否还在运行
          try {
            process.kill(lockPid, 0); // 0 表示不发送信号，只检查进程是否存在
            console.log(`⚠️ 另一个进程正在运行 (PID: ${lockPid})，本次执行跳过`);
            return false;
          } catch (e) {
            // 进程不存在，可以获取锁
            console.log('⚠️ 检测到孤儿锁，重新获取');
            await fs.unlink(LOCK_FILE);
            return this.acquireLock();
          }
        } catch (e) {
          console.error('读取锁文件失败:', e.message);
          return false;
        }
      }
      throw error;
    }
  }

  /**
   * 释放进程锁
   */
  async releaseLock() {
    if (this.lockAcquired) {
      try {
        await fs.unlink(LOCK_FILE);
        console.log('✓ 进程锁已释放');
        this.lockAcquired = false;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('释放锁失败:', error.message);
        }
      }
    }
  }

  /**
   * 执行完整的新闻抓取和推送流程
   */
  async run() {
    // 尝试获取进程锁
    const lockAcquired = await this.acquireLock();
    if (!lockAcquired) {
      console.log('⚠️ 无法获取进程锁，跳过本次执行');
      return;
    }

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

      // 初始化历史记录
      await this.ensureHistoryInit();

      // 1. 抓取新闻
      console.log('[1/6] 开始抓取新闻...');
      const allNewsList = await this.crawler.fetchLatestNews(this.config.newsLimit || 50);
      console.log(`抓取到 ${allNewsList.length} 条新闻\n`);

      if (allNewsList.length === 0) {
        console.log('未抓取到新闻，任务结束');
        return;
      }

      // 2. 过滤已发送的新闻（去重）
      console.log('[2/6] 过滤已发送新闻...');
      const newNewsList = this.history.filterUnsent(allNewsList);
      console.log(`筛选出 ${newNewsList.length} 条新新闻\n`);

      if (newNewsList.length === 0) {
        console.log('没有新新闻，任务结束');
        return;
      }

      // 3. 分类新闻
      console.log('[3/6] 开始分类新闻...');
      const classifiedNews = await this.classifier.classifyNewsBatch(newNewsList);
      console.log(`分类完成 ${classifiedNews.length} 条新闻\n`);

      // 4. 精选新闻
      console.log('[4/6] 精选重要新闻...');
      const selectedNews = this.selectBestNews(classifiedNews, this.config.selectedLimit || 20);
      console.log(`精选出 ${selectedNews.length} 条新闻\n`);

      if (selectedNews.length === 0) {
        console.log('没有符合条件的新闻，任务结束');
        return;
      }

      // 5. 生成摘要
      console.log('[5/6] 生成新闻摘要...');
      const summaryData = await this.classifier.generateDailySummary(selectedNews);
      console.log('摘要生成完成\n');

      // 6. 生成图片
      console.log('[6/6] 生成新闻图片...');
      const imagePath = await this.imageGenerator.generateNewsImage(summaryData);
      console.log(`图片生成成功: ${imagePath}\n`);

      // 7. 推送到飞书
      console.log('[7/7] 推送到飞书...');
      let targetChatIds = this.chatIds;
      
      // 如果未配置群ID，自动获取群列表
      if (targetChatIds.length === 0) {
        console.log('未配置飞书群ID，正在自动获取群列表...');
        try {
          const chatList = await this.sender.getChatList();
          targetChatIds = chatList.map(chat => chat.chat_id).filter(Boolean);
          console.log(`自动获取到 ${targetChatIds.length} 个群: ${targetChatIds.join(', ')}`);
        } catch (error) {
          console.error('获取群列表失败:', error.message);
          console.log('跳过推送\n');
          return;
        }
      }

      if (targetChatIds.length > 0) {
        const results = await this.sender.sendToMultipleChats(
          targetChatIds,
          summaryData,
          imagePath
        );
        
        const successCount = results.filter(r => r.success).length;
        console.log(`推送完成: 成功 ${successCount}/${results.length}\n`);

        // 推送成功后标记为已发送
        if (successCount > 0) {
          await this.history.markAsSent(selectedNews);
        }
      } else {
        console.log('警告: 未找到可推送的飞书群，跳过推送\n');
      }

      // 8. 保存日志
      await this.saveLog({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000,
        totalNews: allNewsList.length,
        newNews: newNewsList.length,
        selectedNews: selectedNews.length,
        summaryData
      });

      console.log('========================================');
      console.log('任务执行完成！');
      console.log(`总耗时: ${(Date.now() - startTime) / 1000} 秒`);
      console.log(`新闻统计: 总计 ${allNewsList.length} 条 -> 新增 ${newNewsList.length} 条 -> 精选 ${selectedNews.length} 条`);
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
      // 释放进程锁
      await this.releaseLock();
    }
  }

  /**
   * 精选最佳新闻
   * @param {Array} classifiedNews - 已分类的新闻列表
   * @param {number} limit - 数量限制
   * @returns {Array} 精选的新闻列表
   */
  selectBestNews(classifiedNews, limit = 20) {
    // 按重要程度和情感倾向排序
    const importanceScore = { '高': 3, '中': 2, '低': 1 };
    const sentimentScore = { '正面': 2, '中性': 1, '负面': 0.5 };

    const scored = classifiedNews.map(news => {
      const importance = news.classification?.importance || '中';
      const sentiment = news.classification?.sentiment || '中性';
      
      const score = 
        (importanceScore[importance] || 1) * 10 + 
        (sentimentScore[sentiment] || 1) * 5;

      return { ...news, score };
    });

    // 按分数排序
    scored.sort((a, b) => b.score - a.score);

    // 选择各分类的代表性新闻（确保多样性）
    const selected = [];
    const categoryCount = {};
    const maxPerCategory = 5; // 每个分类最多5条

    for (const news of scored) {
      if (selected.length >= limit) break;

      const category = news.classification?.category || '其他';
      
      // 确保每个分类不超过最大数量
      if (!categoryCount[category]) {
        categoryCount[category] = 0;
      }

      if (categoryCount[category] < maxPerCategory) {
        selected.push(news);
        categoryCount[category]++;
      }
    }

    console.log(`精选新闻分类分布: ${JSON.stringify(categoryCount)}`);
    
    return selected;
  }

  /**
   * 启动定时任务
   * 默认每天10:30和22:30执行
   */
  startScheduledTask(cronExpression = '30 10,22 * * *') {
    console.log(`启动定时任务，执行时间：${cronExpression}`);
    console.log('当前时间:', new Date().toLocaleString('zh-CN'));
    
    // 检查是否已有定时任务在运行
    if (this.task) {
      console.log('定时任务已在运行，跳过启动');
      return;
    }
    
    // 创建定时任务
    this.task = cron.schedule(cronExpression, async () => {
      await this.run();
    }, {
      timezone: 'Asia/Shanghai',
      scheduled: true
    });

    console.log('定时任务已启动，等待执行...\n');
    console.log('执行时间说明:');
    console.log('  - 早上 10:30');
    console.log('  - 晚上 22:30');
    console.log('');
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
    // AI 模型配置（默认 NVIDIA，兼容火山引擎旧配置）
    aiApiKey: process.env.AI_API_KEY || process.env.VOLCANO_API_KEY || '',
    aiApiSecret: process.env.AI_API_SECRET || process.env.VOLCANO_API_SECRET || '',
    aiEndpoint: process.env.AI_ENDPOINT || process.env.VOLCANO_ENDPOINT || 'https://integrate.api.nvidia.com/v1/chat/completions',
    aiModel: process.env.AI_MODEL || process.env.VOLCANO_MODEL || 'meta/llama-3.1-70b-instruct',

    // 飞书配置
    feishuAppId: process.env.FEISHU_APP_ID || '',
    feishuAppSecret: process.env.FEISHU_APP_SECRET || '',
    feishuChatIds: (process.env.FEISHU_CHAT_IDS || '').split(',').filter(Boolean),

    // 其他配置
    newsLimit: parseInt(process.env.NEWS_LIMIT || '50'),
    selectedLimit: parseInt(process.env.SELECTED_LIMIT || '30'),
    outputDir: process.env.OUTPUT_DIR || './output',
    historyDir: process.env.HISTORY_DIR || './history',
    maxHistoryDays: parseInt(process.env.MAX_HISTORY_DAYS || '7')
  };

  // 从配置文件加载（如果存在）
  try {
    const configPath = path.join(__dirname, '../config/config.json');
    const configFile = await fs.readFile(configPath, 'utf-8');
    const fileConfig = JSON.parse(configFile);
    Object.assign(config, fileConfig);
    console.log('已加载配置文件');
  } catch (e) {
    console.log('未找到配置文件，使用默认配置');
  }

  // 兼容旧版配置文件中的火山引擎字段
  config.aiApiKey = config.aiApiKey || config.volcanoApiKey || '';
  config.aiApiSecret = config.aiApiSecret || config.volcanoApiSecret || '';
  config.aiEndpoint = config.aiEndpoint || config.volcanoEndpoint || '';
  config.aiModel = config.aiModel || config.volcanoModel || '';

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
    // 启动定时任务（每天10:30和22:30）
    const cronExpression = process.env.CRON_EXPRESSION || '30 10,22 * * *';
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
