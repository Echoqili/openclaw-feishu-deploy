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
        timeout: 10000
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
        
        // 提取链接
        const link = $item.find('a').attr('href') || '';
        const fullLink = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
        
        // 提取描述
        const description = $item.find('.desc, .summary, [class*="desc"], p').text().trim();
        
        // 提取来源
        const source = $item.find('.source, .author, [class*="source"]').text().trim() || 'ZAKER';
        
        // 提取图片
        const image = $item.find('img').attr('src') || 
                     $item.find('img').attr('data-src') || '';

        if (title && title.length > 5) {
          newsList.push({
            title,
            link: fullLink,
            description,
            source,
            image,
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
   * 综合抓取方法 - 获取最新热门新闻
   * @param {number} totalLimit - 总数量限制
   * @returns {Array} 新闻列表
   */
  async fetchLatestNews(totalLimit = 30) {
    try {
      // 先尝试抓取首页
      let newsList = await this.fetchHomePageNews(totalLimit);
      
      // 如果首页新闻不足，尝试抓取热门分类
      if (newsList.length < totalLimit) {
        const hotNews = await this.fetchCategoryNews('hot', totalLimit - newsList.length);
        newsList = [...newsList, ...hotNews];
      }

      // 去重
      const uniqueNews = this.removeDuplicates(newsList);
      
      return uniqueNews.slice(0, totalLimit);
    } catch (error) {
      console.error('综合抓取失败:', error.message);
      throw error;
    }
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
