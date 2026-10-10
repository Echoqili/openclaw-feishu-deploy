/**
 * 新闻抓取模块
 * 使用各新闻站官方 JSON 接口获取最新新闻（稳定性远高于 HTML 解析）
 *
 * 数据源（按优先级）：
 *  1. 新浪新闻滚动接口  https://news.sina.com.cn/roll/
 *  2. 头条热榜          https://www.toutiao.com/hot-event/hot-board/
 *  3. 澎湃新闻          https://www.thepaper.cn/
 *  4. 百度热搜          https://top.baidu.com/board?tab=realtime
 */

const axios = require('axios');

class NewsCrawler {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive'
    };
    this.timeout = parseInt(process.env.CRAWL_TIMEOUT || '15000', 10);

    // 数据源列表：fetchLatestNews 会按顺序尝试，直到凑够数量
    this.sources = [
      { name: '新浪新闻', fn: this.fetchSinaRollNews.bind(this) },
      { name: '头条热榜', fn: this.fetchToutiaoHotNews.bind(this) },
      { name: '澎湃新闻', fn: this.fetchThepaperNews.bind(this) },
      { name: '百度热搜', fn: this.fetchBaiduHotNews.bind(this) }
    ];
  }

  /**
   * 综合抓取方法 - 并行抓取各数据源，按来源交错合并，保证多样性
   * @param {number} totalLimit - 总数量限制
   * @returns {Array} 新闻列表
   */
  async fetchLatestNews(totalLimit = 30) {
    // 每个源多抓一些，保证去重后仍够总数
    const perSourceLimit = Math.max(totalLimit, Math.ceil((totalLimit * 2) / this.sources.length));

    const settled = await Promise.allSettled(
      this.sources.map(source => source.fn(perSourceLimit))
    );

    const allNews = [];
    settled.forEach((result, i) => {
      const name = this.sources[i].name;
      if (result.status === 'fulfilled') {
        console.log(`${name} 获取: ${result.value.length} 条`);
        allNews.push(...result.value);
      } else {
        console.error(`${name} 抓取失败:`, result.reason?.message);
      }
    });

    const uniqueNews = this.removeDuplicates(allNews);
    console.log(`总共抓取 ${uniqueNews.length} 条新闻（去重后）`);

    if (uniqueNews.length === 0) {
      throw new Error('所有新闻源都无法访问');
    }

    return this.interleaveBySource(uniqueNews).slice(0, totalLimit);
  }

  /**
   * 按来源轮询交错，保证最终列表来源多样
   * @param {Array} newsList - 去重后的新闻列表
   * @returns {Array} 交错后的列表
   */
  interleaveBySource(newsList) {
    const queues = new Map();
    for (const news of newsList) {
      const key = news.source || '未知来源';
      if (!queues.has(key)) queues.set(key, []);
      queues.get(key).push(news);
    }

    const result = [];
    while (result.length < newsList.length) {
      let added = false;
      for (const queue of queues.values()) {
        if (queue.length) {
          result.push(queue.shift());
          added = true;
        }
      }
      if (!added) break;
    }
    return result;
  }

  /**
   * 新浪滚动新闻接口
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchSinaRollNews(limit = 30) {
    const response = await axios.get('https://feed.mix.sina.com.cn/api/roll/get', {
      params: { pageid: 153, lid: 2509, k: '', num: Math.min(limit * 2, 50), page: 1 },
      headers: this.headers,
      timeout: this.timeout
    });

    const items = response.data?.result?.data || [];
    return this.normalizeList(items, '新浪新闻', item => ({
      title: (item.title || '').trim(),
      link: (item.url || item.wapurl || '').trim(),
      description: (item.intro || '').trim(),
      source: (item.media_name || '新浪新闻').trim(),
      image: item.image || '',
      publishTime: item.intime
        ? new Date(parseInt(item.intime) * 1000).toISOString()
        : new Date().toISOString()
    }), limit);
  }

  /**
   * 头条热榜接口
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchToutiaoHotNews(limit = 30) {
    const response = await axios.get('https://www.toutiao.com/hot-event/hot-board/', {
      params: { origin: 'toutiao_pc' },
      headers: { ...this.headers, Referer: 'https://www.toutiao.com/' },
      timeout: this.timeout
    });

    const items = response.data?.data || [];
    return this.normalizeList(items, '头条热榜', item => ({
      title: (item.Title || '').trim(),
      link: (item.Url || '').trim(),
      description: '',
      source: '头条热榜',
      image: item.Image?.url || '',
      publishTime: new Date().toISOString()
    }), limit);
  }

  /**
   * 澎湃新闻热点接口
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchThepaperNews(limit = 30) {
    const response = await axios.get('https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar', {
      headers: this.headers,
      timeout: this.timeout
    });

    // hotNews 可能直接是数组，也可能是 { list: [...] } 包裹
    const hot = response.data?.data?.hotNews;
    const hotList = Array.isArray(hot) ? hot : (hot?.list || []);
    return this.normalizeList(hotList, '澎湃新闻', item => ({
      title: (item.name || item.displayName || '').trim(),
      link: item.contId ? `https://www.thepaper.cn/newsDetail_forward_${item.contId}` : '',
      description: '',
      source: '澎湃新闻',
      image: item.pic || '',
      publishTime: this.parsePublishTime(item.pubTime) || new Date().toISOString()
    }), limit);
  }

  /**
   * 百度热搜（页面内嵌 JSON）
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchBaiduHotNews(limit = 30) {
    const response = await axios.get('https://top.baidu.com/board', {
      params: { tab: 'realtime' },
      headers: { ...this.headers, Referer: 'https://www.baidu.com/' },
      timeout: this.timeout
    });

    const match = String(response.data).match(/<!--s-data:([\s\S]*?)-->/);
    if (!match) {
      throw new Error('未找到页面数据');
    }

    const parsed = JSON.parse(match[1]);
    const cards = parsed?.data?.cards || [];
    const hotCard = cards.find(card => card.component === 'hotList');
    const items = hotCard?.content || [];

    return this.normalizeList(items, '百度热搜', item => ({
      title: (item.query || '').trim(),
      link: (item.appUrl || item.rawUrl || item.url || '').trim(),
      description: (item.desc || '').trim(),
      source: '百度热搜',
      image: item.img || '',
      publishTime: new Date().toISOString()
    }), limit);
  }

  /**
   * 标准化并过滤新闻列表
   * @param {Array} items - 原始条目
   * @param {string} defaultSource - 默认来源
   * @param {Function} mapper - 字段映射函数
   * @param {number} limit - 数量限制
   * @returns {Array} 标准化后的新闻列表
   */
  normalizeList(items, defaultSource, mapper, limit) {
    const result = [];
    for (const item of items) {
      if (result.length >= limit) break;
      if (!item || typeof item !== 'object') continue;

      const news = mapper(item);
      // 基础有效性校验：标题和链接必须有效
      if (!news.title || news.title.length <= 5 || !news.link || !news.link.startsWith('http')) {
        continue;
      }

      result.push({
        ...news,
        source: news.source || defaultSource,
        crawlTime: new Date().toISOString()
      });
    }
    return result;
  }

  /**
   * 解析发布时间
   * @param {string} timeText - 时间文本（如 "18小时前"、"2026-10-10 15:20"）
   * @returns {string|null} ISO时间字符串
   */
  parsePublishTime(timeText) {
    if (!timeText) return null;

    const now = new Date();

    // 相对时间：X分钟前
    const minutesMatch = timeText.match(/(\d+)\s*分钟前/);
    if (minutesMatch) {
      return new Date(now - parseInt(minutesMatch[1]) * 60 * 1000).toISOString();
    }

    // 相对时间：X小时前
    const hoursMatch = timeText.match(/(\d+)\s*小时前/);
    if (hoursMatch) {
      return new Date(now - parseInt(hoursMatch[1]) * 60 * 60 * 1000).toISOString();
    }

    // 相对时间：X天前
    const daysMatch = timeText.match(/(\d+)\s*天前/);
    if (daysMatch) {
      return new Date(now - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000).toISOString();
    }

    // "YYYY-MM-DD HH:MM"
    const fullMatch = timeText.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s*(\d{1,2}):(\d{2})/);
    if (fullMatch) {
      return new Date(
        parseInt(fullMatch[1]),
        parseInt(fullMatch[2]) - 1,
        parseInt(fullMatch[3]),
        parseInt(fullMatch[4]),
        parseInt(fullMatch[5])
      ).toISOString();
    }

    return null;
  }

  /**
   * 去重（按标题，忽略空白差异）
   * @param {Array} newsList - 新闻列表
   * @returns {Array} 去重后的列表
   */
  removeDuplicates(newsList) {
    const seen = new Set();
    return newsList.filter(news => {
      const key = news.title.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// 导出模块
module.exports = NewsCrawler;

// 测试代码
if (require.main === module) {
  const crawler = new NewsCrawler();
  crawler.fetchLatestNews(30)
    .then(news => {
      console.log('\n抓取结果示例:');
      news.slice(0, 5).forEach((n, i) => {
        console.log(`${i + 1}. [${n.source}] ${n.title}`);
        console.log(`   ${n.link}`);
      });
    })
    .catch(err => {
      console.error('测试失败:', err);
      process.exit(1);
    });
}
