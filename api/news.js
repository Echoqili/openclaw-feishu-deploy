// Vercel serverless 环境只能写入 /tmp 目录
require('dotenv').config();

process.env.OUTPUT_DIR = process.env.OUTPUT_DIR || '/tmp/output';
process.env.HISTORY_DIR = process.env.HISTORY_DIR || '/tmp/history';

const fs = require('fs').promises;
const path = require('path');
const NewsBot = require('../src/main');

module.exports = async (req, res) => {
  const { method } = req;

  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', status: 405 });
  }

  try {
    // 清理可能残留的锁文件（Vercel 函数超时后不会自动释放）
    const lockFile = path.join(process.env.OUTPUT_DIR || '/tmp/output', '.news-bot.lock');
    try {
      await fs.unlink(lockFile);
      console.log('已清理残留锁文件');
    } catch (e) {
      // 锁文件不存在，忽略
    }

    const config = {
      aiApiKey: process.env.AI_API_KEY || process.env.VOLCANO_API_KEY || '',
      aiApiSecret: process.env.AI_API_SECRET || process.env.VOLCANO_API_SECRET || '',
      aiEndpoint: process.env.AI_ENDPOINT || process.env.VOLCANO_ENDPOINT || 'https://integrate.api.nvidia.com/v1/chat/completions',
      aiModel: process.env.AI_MODEL || process.env.VOLCANO_MODEL || 'meta/llama-3.1-70b-instruct',

      feishuAppId: process.env.FEISHU_APP_ID || '',
      feishuAppSecret: process.env.FEISHU_APP_SECRET || '',
      feishuChatIds: (process.env.FEISHU_CHAT_IDS || '').split(',').filter(Boolean),

      newsLimit: parseInt(process.env.NEWS_LIMIT || '50'),
      selectedLimit: parseInt(process.env.SELECTED_LIMIT || '30'),
      outputDir: '/tmp/output',
      historyDir: '/tmp/history',
      maxHistoryDays: parseInt(process.env.MAX_HISTORY_DAYS || '7'),

      cloudbaseEnv: process.env.CLOUDBASE_ENV || null,
      cloudbaseSecretId: process.env.CLOUDBASE_SECRET_ID || null,
      cloudbaseSecretKey: process.env.CLOUDBASE_SECRET_KEY || null
    };

    const bot = new NewsBot(config);
    await bot.run();

    return res.status(200).json({
      success: true,
      message: '新闻推送任务执行完成',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('News bot execution failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
