/**
 * 新闻抓取模块
 * 从 ZAKER 网站抓取最新新闻
 */

const axios = require('axios');
const cheerio = require('cheerio');

class NewsCrawler {
  constructor() {
    this.baseUrl = 'https://www.myzaker.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * 抓取 ZAKER 首页新闻
   * @param {number} limit - 抓取新闻数量限制
   * @returns {Array} 新闻列表
   */
  async fetchHomePageNews(limit = 30) {
    try {
      console.log(`正在抓取 ZAKER 首页新闻...`);
      
      const response = await axios.get(this.baseUrl, {
        headers: this.headers,
        timeout: 30000 // 增加到30秒
      });

      const $ = cheerio.load(response.data);
      const newsList = [];

      // 解析首页新闻列表
      // ZAKER 的页面结构可能需要根据实际情况调整
      $('.news-item, .article-item, .feed-item, [class*="news"], [class*="article"]').each((index, element) => {
        if (newsList.length >= limit) return false;

        const $item = $(element);
        
        // 提取标题
        const title = $item.find('h1, h2, h3, .title, [class*="title"]').text().trim() ||
                     $item.find('a').attr('title') || 
                     $item.text().trim();
        
        // 提取链接 - 优化链接提取逻辑
        let link = '';
        const $links = $item.find('a');
        $links.each((i, el) => {
          const href = $(el).attr('href') || '';
          // 优先选择包含 article 或 news 的链接
          if (href.includes('/article/') || href.includes('/news/')) {
            link = href;
            return false; // 找到就停止
          }
          // 其次选择完整的URL
          if (!link && href.startsWith('http')) {
            link = href;
          }
        });
        
        // 规范化链接
        let fullLink = '';
        if (link) {
          if (link.startsWith('http://') || link.startsWith('https://')) {
            fullLink = link;
          } else if (link.startsWith('//')) {
            fullLink = 'https:' + link;
          } else if (link.startsWith('/')) {
            fullLink = this.baseUrl + link;
          }
        }
        
        // 提取描述
        const description = $item.find('.desc, .summary, [class*="desc"], p').text().trim();
        
        // 提取来源
        const source = $item.find('.source, .author, [class*="source"]').text().trim() || 'ZAKER';
        
        // 提取图片
        const image = $item.find('img').attr('src') || 
                     $item.find('img').attr('data-src') || '';

        // 只保留有有效链接的新闻
        if (title && title.length > 5 && fullLink && fullLink !== this.baseUrl) {
          // 提取发布时间
          const timeText = $item.find('.time, .date, [class*="time"], [class*="date"]').text().trim();
          const publishTime = this.parsePublishTime(timeText);
          
          newsList.push({
            title,
            link: fullLink,
            description,
            source,
            image,
            publishTime: publishTime || new Date().toISOString(),
            crawlTime: new Date().toISOString()
          });
        }
      });

      // 如果上述选择器没有匹配到，尝试其他方式
      if (newsList.length === 0) {
        console.log('尝试备用解析方式...');
        
        $('a').each((index, element) => {
          if (newsList.length >= limit) return false;
          
          const $link = $(element);
          const title = $link.text().trim();
          const href = $link.attr('href');
          
          if (title && title.length > 10 && href && (href.includes('/article') || href.includes('/news'))) {
            newsList.push({
              title,
              link: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
              description: '',
              source: 'ZAKER',
              image: '',
              publishTime: new Date().toISOString(),
              crawlTime: new Date().toISOString()
            });
          }
        });
      }

      console.log(`成功抓取 ${newsList.length} 条新闻`);
      return newsList;
    } catch (error) {
      console.error('抓取新闻失败:', error.message);
      throw error;
    }
  }

  /**
   * 抓取指定分类新闻
   * @param {string} category - 分类名称
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchCategoryNews(category = 'hot', limit = 20) {
    try {
      const categoryUrl = `${this.baseUrl}/channel/${category}`;
      console.log(`正在抓取 ${category} 分类新闻...`);
      
      const response = await axios.get(categoryUrl, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const newsList = [];

      // 根据分类页面结构解析
      $('.news-item, .article-item, li').each((index, element) => {
        if (newsList.length >= limit) return false;

        const $item = $(element);
        const title = $item.find('a').text().trim() || $item.text().trim();
        const link = $item.find('a').attr('href') || '';

        if (title && title.length > 5) {
          newsList.push({
            title,
            link: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
            description: '',
            source: 'ZAKER',
            image: '',
            category,
            crawlTime: new Date().toISOString()
          });
        }
      });

      return newsList;
    } catch (error) {
      console.error(`抓取 ${category} 分类新闻失败:`, error.message);
      return [];
    }
  }

  /**
   * 获取新闻详情
   * @param {string} url - 新闻链接
   * @returns {Object} 新闻详情
   */
  async fetchNewsDetail(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const title = $('h1, .title, [class*="title"]').first().text().trim();
      const content = $('.content, .article-content, [class*="content"]').text().trim();
      const publishTime = $('.time, .date, [class*="time"]').text().trim();
      const author = $('.author, .source, [class*="author"]').text().trim();

      return {
        title,
        content: content.substring(0, 1000), // 限制内容长度
        publishTime,
        author,
        url
      };
    } catch (error) {
      console.error('获取新闻详情失败:', error.message);
      return null;
    }
  }

  /**
   * 带重试的请求方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @param {number} retries - 重试次数
   * @returns {Object} 响应数据
   */
  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          ...options,
          timeout: options.timeout || 30000
        });
        return response;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        console.log(`请求失败，第 ${i + 1} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
      }
    }
  }

  /**
   * 抓取备用新闻源 - 新浪新闻
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchSinaNews(limit = 30) {
    try {
      console.log('正在抓取新浪新闻...');
      const response = await this.fetchWithRetry('https://news.sina.com.cn/', {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      const newsList = [];

      // 解析新浪新闻
      $('a[href*="news.sina"], a[href*="sina.com.cn"]').each((index, element) => {
        if (newsList.length >= limit) return false;

        const $link = $(element);
        const title = $link.text().trim();
        const href = $link.attr('href');

        if (title && title.length > 10 && href && href.startsWith('http')) {
          newsList.push({
            title,
            link: href,
            description: '',
            source: '新浪新闻',
            image: '',
            publishTime: new Date().toISOString(),
            crawlTime: new Date().toISOString()
          });
        }
      });

      console.log(`从新浪新闻抓取 ${newsList.length} 条`);
      return newsList;
    } catch (error) {
      console.error('抓取新浪新闻失败:', error.message);
      return [];
    }
  }

  /**
   * 抓取备用新闻源 - 网易新闻
   * @param {number} limit - 数量限制
   * @returns {Array} 新闻列表
   */
  async fetchNetEaseNews(limit = 30) {
    try {
      console.log('正在抓取网易新闻...');
      const response = await this.fetchWithRetry('https://news.163.com/', {
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      const newsList = [];

      // 解析网易新闻
      $('a[href*="163.com"], a[href*="news.163"]').each((index, element) => {
        if (newsList.length >= limit) return false;

        const $link = $(element);
        const title = $link.text().trim();
        const href = $link.attr('href');

        if (title && title.length > 10 && href && href.startsWith('http')) {
          newsList.push({
            title,
            link: href,
            description: '',
            source: '网易新闻',
            image: '',
            publishTime: new Date().toISOString(),
            crawlTime: new Date().toISOString()
          });
        }
      });

      console.log(`从网易新闻抓取 ${newsList.length} 条`);
      return newsList;
    } catch (error) {
      console.error('抓取网易新闻失败:', error.message);
      return [];
    }
  }

  /**
   * 综合抓取方法 - 获取最新热门新闻（带重试和备用源）
   * @param {number} totalLimit - 总数量限制
   * @returns {Array} 新闻列表
   */
  async fetchLatestNews(totalLimit = 30) {
    const allNews = [];
    
    // 1. 尝试 ZAKER
    try {
      console.log('尝试抓取 ZAKER 新闻...');
      const zakerNews = await this.fetchHomePageNews(totalLimit);
      allNews.push(...zakerNews);
    } catch (error) {
      console.error('ZAKER 抓取失败:', error.message);
    }

    // 2. 如果 ZAKER 失败或数量不足，尝试新浪新闻
    if (allNews.length < totalLimit) {
      try {
        console.log('尝试抓取新浪新闻...');
        const sinaNews = await this.fetchSinaNews(totalLimit - allNews.length);
        allNews.push(...sinaNews);
      } catch (error) {
        console.error('新浪新闻抓取失败:', error.message);
      }
    }

    // 3. 如果还不够，尝试网易新闻
    if (allNews.length < totalLimit) {
      try {
        console.log('尝试抓取网易新闻...');
        const netEaseNews = await this.fetchNetEaseNews(totalLimit - allNews.length);
        allNews.push(...netEaseNews);
      } catch (error) {
        console.error('网易新闻抓取失败:', error.message);
      }
    }

    // 4. 如果还不够，尝试抓取热门分类
    if (allNews.length < totalLimit) {
      try {
        const hotNews = await this.fetchCategoryNews('hot', totalLimit - allNews.length);
        allNews.push(...hotNews);
      } catch (error) {
        console.error('分类新闻抓取失败:', error.message);
      }
    }

    // 去重
    const uniqueNews = this.removeDuplicates(allNews);
    
    console.log(`总共抓取 ${uniqueNews.length} 条新闻`);
    
    if (uniqueNews.length === 0) {
      throw new Error('所有新闻源都无法访问');
    }

    return uniqueNews.slice(0, totalLimit);
  }

  /**
   * 解析发布时间
   * @param {string} timeText - 时间文本
   * @returns {string} ISO时间字符串
   */
  parsePublishTime(timeText) {
    if (!timeText) return null;
    
    const now = new Date();
    
    // 处理相对时间：X分钟前、X小时前
    const minutesMatch = timeText.match(/(\d+)\s*分钟前/);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      return new Date(now - minutes * 60 * 1000).toISOString();
    }
    
    const hoursMatch = timeText.match(/(\d+)\s*小时前/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      return new Date(now - hours * 60 * 60 * 1000).toISOString();
    }
    
    // 处理"今天 HH:MM"
    const todayMatch = timeText.match(/今天\s*(\d{1,2}):(\d{2})/);
    if (todayMatch) {
      const date = new Date(now);
      date.setHours(parseInt(todayMatch[1]), parseInt(todayMatch[2]), 0, 0);
      return date.toISOString();
    }
    
    // 处理"昨天 HH:MM"
    const yesterdayMatch = timeText.match(/昨天\s*(\d{1,2}):(\d{2})/);
    if (yesterdayMatch) {
      const date = new Date(now - 24 * 60 * 60 * 1000);
      date.setHours(parseInt(yesterdayMatch[1]), parseInt(yesterdayMatch[2]), 0, 0);
      return date.toISOString();
    }
    
    // 处理"MM-DD HH:MM"
    const dateMatch = timeText.match(/(\d{1,2})-(\d{1,2})\s*(\d{1,2}):(\d{2})/);
    if (dateMatch) {
      const date = new Date(now.getFullYear(), parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]));
      date.setHours(parseInt(dateMatch[3]), parseInt(dateMatch[4]), 0, 0);
      return date.toISOString();
    }
    
    // 处理"YYYY-MM-DD HH:MM"
    const fullMatch = timeText.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s*(\d{1,2}):(\d{2})/);
    if (fullMatch) {
      const date = new Date(
        parseInt(fullMatch[1]),
        parseInt(fullMatch[2]) - 1,
        parseInt(fullMatch[3]),
        parseInt(fullMatch[4]),
        parseInt(fullMatch[5])
      );
      return date.toISOString();
    }
    
    return null;
  }

  /**
   * 去重
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
  crawler.fetchLatestNews(20)
    .then(news => {
      console.log('\n抓取结果:');
      console.log(JSON.stringify(news, null, 2));
    })
    .catch(err => {
      console.error('测试失败:', err);
    });
}
