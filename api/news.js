const NewsBot = require('../src/main');

module.exports = async (req) => {
  const { method } = req;

  if (method !== 'GET' && method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed', status: 405 }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const config = {
      aiApiKey: process.env.AI_API_KEY || process.env.VOLCANO_API_KEY || '',
      aiApiSecret: process.env.AI_API_SECRET || process.env.VOLCANO_API_SECRET || '',
      aiEndpoint: process.env.AI_ENDPOINT || process.env.VOLCANO_ENDPOINT || 'https://integrate.api.nvidia.com/v1/chat/completions',
      aiModel: process.env.AI_MODEL || process.env.VOLCANO_MODEL || 'meta/llama-3.1-70b-instruct',
      
      feishuAppId: process.env.FEISHU_APP_ID || '',
      feishuAppSecret: process.env.FEISHU_APP_SECRET || '',
      feishuChatIds: (process.env.FEISHU_CHAT_IDS || '').split(',').filter(Boolean),
      
      newsLimit: parseInt(process.env.NEWS_LIMIT || '50'),
      selectedLimit: parseInt(process.env.SELECTED_LIMIT || '20'),
      outputDir: '/tmp/output',
      historyDir: '/tmp/history',
      maxHistoryDays: parseInt(process.env.MAX_HISTORY_DAYS || '7'),
      
      cloudbaseEnv: process.env.CLOUDBASE_ENV || null,
      cloudbaseSecretId: process.env.CLOUDBASE_SECRET_ID || null,
      cloudbaseSecretKey: process.env.CLOUDBASE_SECRET_KEY || null
    };

    const bot = new NewsBot(config);
    await bot.run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '新闻推送任务执行完成',
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('News bot execution failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
