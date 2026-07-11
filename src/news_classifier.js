/**
 * 新闻分类模块
 * 使用大模型对新闻进行智能分类
 */

const axios = require('axios');

class NewsClassifier {
  constructor(config = {}) {
    // 优先使用通用 AI 配置（NVIDIA 等），未配置时回退到火山引擎兼容配置
    this.apiKey = config.apiKey || process.env.AI_API_KEY || process.env.VOLCANO_API_KEY || '';
    this.apiSecret = config.apiSecret || process.env.AI_API_SECRET || process.env.VOLCANO_API_SECRET || '';
    this.endpoint = config.endpoint || process.env.AI_ENDPOINT || process.env.VOLCANO_ENDPOINT || 'https://integrate.api.nvidia.com/v1/chat/completions';
    this.model = config.model || process.env.AI_MODEL || process.env.VOLCANO_MODEL || 'meta/llama-3.1-70b-instruct';
    this.batchSize = config.batchSize || parseInt(process.env.CLASSIFY_BATCH_SIZE || '15', 10);

    // 预定义新闻分类
    this.categories = [
      '科技',
      '财经',
      '体育',
      '娱乐',
      '政治',
      '社会',
      '国际',
      '教育',
      '健康',
      '汽车',
      '房产',
      '军事',
      '文化',
      '旅游',
      '美食',
      '其他'
    ];
  }

  /**
   * 调用大模型 API
   * @param {string} prompt - 提示词
   * @param {Object} options - 配置选项
   * @returns {string} 模型响应
   */
  async callModel(prompt, options = {}) {
    try {
      const response = await axios.post(this.endpoint, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的新闻分类助手，能够准确地对新闻进行分类和总结。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        ...options
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: parseInt(process.env.AI_TIMEOUT || '60000')
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('调用模型失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 对单条新闻进行分类
   * @param {Object} news - 新闻对象
   * @returns {Object} 分类结果
   */
  async classifySingleNews(news) {
    try {
      const prompt = `请分析以下新闻，并提供以下信息：

新闻标题：${news.title}
新闻描述：${news.description || '无描述'}

请严格按照以下JSON格式返回结果，不要添加任何其他文字：
{
  "category": "分类（从以下分类中选择一个最合适的：${this.categories.join('、')}）",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "新闻摘要（50字以内）",
  "importance": "重要程度（高/中/低）",
  "sentiment": "情感倾向（正面/中性/负面）"
}`;

      const response = await this.callModel(prompt, { temperature: 0.3 });
      
      // 提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          ...news,
          classification: result
        };
      }
      
      return {
        ...news,
        classification: {
          category: '其他',
          keywords: [],
          summary: news.title.substring(0, 50),
          importance: '中',
          sentiment: '中性'
        }
      };
    } catch (error) {
      console.error('分类失败:', error.message);
      return {
        ...news,
        classification: {
          category: '其他',
          keywords: [],
          summary: news.title.substring(0, 50),
          importance: '中',
          sentiment: '中性'
        }
      };
    }
  }

  /**
   * 对多条新闻进行一次 prompt 批量分类
   * @param {Array} newsList - 新闻列表（建议 5-15 条）
   * @returns {Array} 分类后的新闻列表
   */
  async classifyMultipleNews(newsList) {
    if (!newsList || newsList.length === 0) return [];

    const prompt = `请对以下 ${newsList.length} 条新闻进行分类和总结，按原始顺序返回 JSON 数组。

分类要求：
- category: 从以下分类中选择一个最合适的：${this.categories.join('、')}
- keywords: 关键词数组（3 个左右）
- summary: 新闻摘要（50 字以内）
- importance: 重要程度（高/中/低）
- sentiment: 情感倾向（正面/中性/负面）

新闻列表：
${newsList.map((news, index) => `${index + 1}. 标题：${news.title}\n描述：${news.description || '无描述'}`).join('\n\n')}

请严格返回以下格式的 JSON 数组，不要添加任何其他文字：
[
  {"category": "...", "keywords": ["..."], "summary": "...", "importance": "...", "sentiment": "..."},
  ...
]`;

    try {
      const response = await this.callModel(prompt, {
        temperature: 0.3,
        maxTokens: 500 + newsList.length * 200
      });

      // 提取 JSON 数组
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('未找到 JSON 数组');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length !== newsList.length) {
        throw new Error(`返回数组长度不匹配：期望 ${newsList.length}，实际 ${parsed?.length}`);
      }

      return newsList.map((news, index) => {
        const item = parsed[index] || {};
        return {
          ...news,
          classification: {
            category: this.categories.includes(item.category) ? item.category : '其他',
            keywords: Array.isArray(item.keywords) ? item.keywords : [],
            summary: (item.summary || news.title).substring(0, 50),
            importance: ['高', '中', '低'].includes(item.importance) ? item.importance : '中',
            sentiment: ['正面', '中性', '负面'].includes(item.sentiment) ? item.sentiment : '中性'
          }
        };
      });
    } catch (error) {
      console.error(`批量分类失败（${newsList.length}条）:`, error.message);
      // 回退到单条分类
      const fallbackResults = [];
      for (const news of newsList) {
        fallbackResults.push(await this.classifySingleNews(news));
      }
      return fallbackResults;
    }
  }

  /**
   * 批量分类新闻
   * @param {Array} newsList - 新闻列表
   * @returns {Array} 分类后的新闻列表
   */
  async classifyNewsBatch(newsList) {
    console.log(`开始对 ${newsList.length} 条新闻进行分类...`);

    const results = [];
    const batchSize = Math.max(1, this.batchSize);

    for (let i = 0; i < newsList.length; i += batchSize) {
      const batch = newsList.slice(i, i + batchSize);

      // 一次 prompt 批量分类
      const batchResults = await this.classifyMultipleNews(batch);
      results.push(...batchResults);

      console.log(`已分类 ${Math.min(i + batchSize, newsList.length)}/${newsList.length} 条新闻`);

      // 批次间短暂暂停，避免 RPM 限流
      if (i + batchSize < newsList.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('新闻分类完成！');
    return results;
  }

  /**
   * 生成每日新闻摘要
   * @param {Array} classifiedNews - 已分类的新闻
   * @returns {Object} 摘要报告
   */
  async generateDailySummary(classifiedNews) {
    try {
      // 按分类分组（所有新闻都放入分类）
      const groupedNews = {};
      classifiedNews.forEach(news => {
        const category = news.classification?.category || '其他';
        if (!groupedNews[category]) {
          groupedNews[category] = [];
        }
        groupedNews[category].push(news);
      });

      // 统计信息
      const stats = {
        total: classifiedNews.length,
        categories: Object.keys(groupedNews).map(cat => ({
          name: cat,
          count: groupedNews[cat].length
        })),
        highImportance: classifiedNews.filter(n => n.classification?.importance === '高').length,
        positiveNews: classifiedNews.filter(n => n.classification?.sentiment === '正面').length,
        negativeNews: classifiedNews.filter(n => n.classification?.sentiment === '负面').length
      };

      // 提取重要新闻（所有高重要度的新闻，最多25条）
      const importantNews = classifiedNews
        .filter(n => n.classification?.importance === '高')
        .slice(0, 25);

      // 提取正面新闻（所有正面新闻，统计用）
      const positiveNews = classifiedNews
        .filter(n => n.classification?.sentiment === '正面');

      // 生成摘要文本
      let summaryText = `📊 今日新闻摘要\n`;
      summaryText += `共抓取 ${stats.total} 条新闻\n\n`;
      
      Object.entries(groupedNews).forEach(([category, newsList]) => {
        summaryText += `\n【${category}】(${newsList.length}条)\n`;
        newsList.slice(0, 3).forEach((news, index) => {
          summaryText += `${index + 1}. ${news.title}\n`;
          if (news.classification?.summary) {
            summaryText += `   ${news.classification.summary}\n`;
          }
        });
      });

      return {
        stats,
        groupedNews,  // 保留所有分类新闻
        importantNews,
        positiveNews,
        summaryText,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('生成摘要失败:', error.message);
      throw error;
    }
  }

  /**
   * 智能筛选重要新闻
   * @param {Array} classifiedNews - 已分类的新闻
   * @param {number} limit - 数量限制
   * @returns {Array} 重要新闻列表
   */
  filterImportantNews(classifiedNews, limit = 10) {
    // 按重要程度排序
    const importanceOrder = { '高': 3, '中': 2, '低': 1 };
    
    const sorted = classifiedNews.sort((a, b) => {
      const importanceA = importanceOrder[a.classification?.importance] || 1;
      const importanceB = importanceOrder[b.classification?.importance] || 1;
      return importanceB - importanceA;
    });

    return sorted.slice(0, limit);
  }
}

// 导出模块
module.exports = NewsClassifier;

// 测试代码
if (require.main === module) {
  const fs = require('fs').promises;
  const path = require('path');
  
  async function test() {
    // 尝试从配置文件读取配置
    let config = {};
    
    try {
      const configPath = path.join(__dirname, '../config/config.json');
      const configFile = await fs.readFile(configPath, 'utf-8');
      const fileConfig = JSON.parse(configFile);
      config = {
        apiKey: fileConfig.aiApiKey || fileConfig.volcanoApiKey,
        apiSecret: fileConfig.aiApiSecret || fileConfig.volcanoApiSecret,
        endpoint: fileConfig.aiEndpoint || fileConfig.volcanoEndpoint,
        model: fileConfig.aiModel || fileConfig.volcanoModel
      };
      console.log('已加载配置文件');
    } catch (e) {
      console.log('未找到配置文件，使用默认配置');
    }
    
    const classifier = new NewsClassifier(config);
    
    const testNews = [
      {
        title: '苹果发布最新AI芯片，性能提升50%',
        description: '苹果公司今日发布最新M4芯片，集成AI处理能力...'
      },
      {
        title: '中国男足世界杯预选赛获胜',
        description: '中国男足在世预赛中2:0战胜对手...'
      }
    ];

    classifier.classifyNewsBatch(testNews)
      .then(results => {
        console.log('分类结果:');
        console.log(JSON.stringify(results, null, 2));
      })
      .catch(err => {
        console.error('测试失败:', err);
      });
  }
  
  test();
}
