/**
 * 新闻去重管理模块
 * 记录已发送的新闻，避免重复推送
 */

const fs = require('fs').promises;
const path = require('path');

class NewsHistory {
  constructor(config = {}) {
    this.historyDir = config.historyDir || './history';
    this.historyFile = path.join(this.historyDir, 'sent_news.json');
    this.maxHistoryDays = config.maxHistoryDays || 7; // 保留7天的历史
    this.history = new Map();
  }

  /**
   * 初始化历史记录
   */
  async init() {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
      
      const data = await fs.readFile(this.historyFile, 'utf-8');
      const historyObj = JSON.parse(data);
      
      // 转换为 Map
      this.history = new Map(Object.entries(historyObj));
      
      // 清理过期记录
      await this.cleanOldRecords();
      
      console.log(`加载历史记录: ${this.history.size} 条`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('历史记录文件不存在，创建新的记录');
        this.history = new Map();
        await this.save();
      } else {
        throw error;
      }
    }
  }

  /**
   * 检查新闻是否已发送
   * @param {Object} news - 新闻对象
   * @returns {boolean} 是否已发送
   */
  isSent(news) {
    const key = this.generateKey(news);
    return this.history.has(key);
  }

  /**
   * 批量过滤已发送的新闻
   * @param {Array} newsList - 新闻列表
   * @returns {Array} 未发送的新闻列表
   */
  filterUnsent(newsList) {
    const unsent = newsList.filter(news => !this.isSent(news));
    console.log(`过滤已发送新闻: ${newsList.length - unsent.length}/${newsList.length}`);
    return unsent;
  }

  /**
   * 标记新闻为已发送
   * @param {Array} newsList - 新闻列表
   */
  async markAsSent(newsList) {
    const now = new Date().toISOString();
    
    newsList.forEach(news => {
      const key = this.generateKey(news);
      this.history.set(key, {
        title: news.title,
        link: news.link,
        sentAt: now,
        category: news.classification?.category
      });
    });
    
    await this.save();
    console.log(`标记 ${newsList.length} 条新闻为已发送`);
  }

  /**
   * 生成新闻唯一键
   * @param {Object} news - 新闻对象
   * @returns {string} 唯一键
   */
  generateKey(news) {
    // 使用标题和链接的组合作为唯一标识
    const title = (news.title || '').toLowerCase().trim();
    const link = news.link || '';
    
    // 简单的 hash 函数
    const str = title + link;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `news_${Math.abs(hash)}`;
  }

  /**
   * 保存历史记录到文件
   */
  async save() {
    try {
      const historyObj = Object.fromEntries(this.history);
      await fs.writeFile(
        this.historyFile, 
        JSON.stringify(historyObj, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('保存历史记录失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理过期记录
   */
  async cleanOldRecords() {
    const now = Date.now();
    const maxAge = this.maxHistoryDays * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [key, value] of this.history.entries()) {
      const sentTime = new Date(value.sentAt).getTime();
      if (now - sentTime > maxAge) {
        this.history.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`清理过期记录: ${cleaned} 条`);
      await this.save();
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.history.size,
      byCategory: {},
      byDate: {}
    };

    for (const [key, value] of this.history.entries()) {
      // 按分类统计
      const category = value.category || '其他';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // 按日期统计
      const date = value.sentAt.split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }

    return stats;
  }

  /**
   * 获取最近发送的新闻
   * @param {number} limit - 数量限制
   * @returns {Array} 最近的新闻列表
   */
  getRecent(limit = 10) {
    const all = Array.from(this.history.entries())
      .map(([key, value]) => ({ ...value, key }))
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    return all.slice(0, limit);
  }

  /**
   * 清空历史记录
   */
  async clear() {
    this.history.clear();
    await this.save();
    console.log('历史记录已清空');
  }
}

module.exports = NewsHistory;

// 测试代码
if (require.main === module) {
  const history = new NewsHistory();
  
  history.init()
    .then(() => {
      console.log('历史记录初始化成功');
      console.log('统计:', history.getStats());
    })
    .catch(console.error);
}
