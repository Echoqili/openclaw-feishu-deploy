/**
 * 新闻去重管理模块
 * 记录已发送的新闻，避免重复推送
 * 优先使用 CloudBase 数据库，失败时回退到本地文件
 */

const fs = require('fs').promises;
const path = require('path');

class NewsHistory {
  constructor(config = {}) {
    this.historyDir = config.historyDir || './history';
    this.historyFile = path.join(this.historyDir, 'sent_news.json');
    this.maxHistoryDays = config.maxHistoryDays || 7;
    this.history = new Map();
    
    // CloudBase 配置
    this.cloudbaseEnv = config.cloudbaseEnv || null;
    this.cloudbaseCollection = config.cloudbaseCollection || 'news_history';
    this.db = null;
    this.useCloudBase = false;
  }

  /**
   * 初始化历史记录
   */
  async init() {
    // 尝试初始化 CloudBase
    if (this.cloudbaseEnv) {
      try {
        const cloudbase = require('@cloudbase/node-sdk');
        const app = cloudbase.init({
          env: this.cloudbaseEnv
        });
        this.db = app.database();
        this.useCloudBase = true;
        console.log(`✓ CloudBase 数据库已连接: ${this.cloudbaseEnv}`);
      } catch (error) {
        console.warn('⚠ CloudBase 初始化失败，使用本地文件:', error.message);
        this.useCloudBase = false;
      }
    }

    // 加载历史记录
    await this.loadHistory();
    
    // 清理过期记录
    await this.cleanOldRecords();
    
    console.log(`加载历史记录: ${this.history.size} 条`);
  }

  /**
   * 加载历史记录（优先CloudBase）
   */
  async loadHistory() {
    if (this.useCloudBase) {
      try {
        // 从 CloudBase 加载
        const result = await this.db
          .collection(this.cloudbaseCollection)
          .limit(10000)
          .get();
        
        if (result.data && result.data.length > 0) {
          result.data.forEach(item => {
            this.history.set(item._id, {
              title: item.title,
              link: item.link,
              sentAt: item.sentAt,
              category: item.category
            });
          });
          console.log(`✓ 从 CloudBase 加载历史记录: ${result.data.length} 条`);
          return;
        }
      } catch (error) {
        console.warn('⚠ 从 CloudBase 加载失败，尝试本地文件:', error.message);
      }
    }

    // 从本地文件加载
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
      const data = await fs.readFile(this.historyFile, 'utf-8');
      const historyObj = JSON.parse(data);
      this.history = new Map(Object.entries(historyObj));
      console.log(`✓ 从本地文件加载历史记录: ${this.history.size} 条`);
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
   */
  isSent(news) {
    const key = this.generateKey(news);
    return this.history.has(key);
  }

  /**
   * 批量过滤已发送的新闻
   */
  filterUnsent(newsList) {
    const unsent = newsList.filter(news => !this.isSent(news));
    console.log(`过滤已发送新闻: ${newsList.length - unsent.length}/${newsList.length}`);
    return unsent;
  }

  /**
   * 标记新闻为已发送
   */
  async markAsSent(newsList) {
    const now = new Date().toISOString();
    
    const promises = newsList.map(async news => {
      const key = this.generateKey(news);
      const record = {
        title: news.title,
        link: news.link,
        sentAt: now,
        category: news.classification?.category
      };
      
      this.history.set(key, record);
      
      // 同步到 CloudBase
      if (this.useCloudBase) {
        try {
          await this.db
            .collection(this.cloudbaseCollection)
            .doc(key)
            .set({
              _id: key,
              ...record
            });
        } catch (error) {
          console.warn(`写入 CloudBase 失败 [${key}]:`, error.message);
        }
      }
    });
    
    await Promise.all(promises);
    
    // 同时保存到本地文件
    await this.save();
    console.log(`标记 ${newsList.length} 条新闻为已发送`);
  }

  /**
   * 生成新闻唯一键
   */
  generateKey(news) {
    const title = (news.title || '').toLowerCase().trim();
    const link = news.link || '';
    const str = title + link;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `news_${Math.abs(hash)}`;
  }

  /**
   * 保存历史记录到本地文件
   */
  async save() {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
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
        
        // 从 CloudBase 删除
        if (this.useCloudBase) {
          try {
            await this.db
              .collection(this.cloudbaseCollection)
              .doc(key)
              .remove();
          } catch (error) {
            console.warn(`删除 CloudBase 记录失败 [${key}]:`, error.message);
          }
        }
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
      byDate: {},
      storage: this.useCloudBase ? 'CloudBase' : 'Local File'
    };

    for (const [key, value] of this.history.entries()) {
      const category = value.category || '其他';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      const date = value.sentAt.split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }

    return stats;
  }

  /**
   * 获取最近发送的新闻
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
    
    if (this.useCloudBase) {
      try {
        // 删除集合中所有记录
        await this.db
          .collection(this.cloudbaseCollection)
          .where({
            _id: this.db.command.exists(true)
          })
          .remove();
        console.log('✓ CloudBase 历史记录已清空');
      } catch (error) {
        console.warn('清空 CloudBase 失败:', error.message);
      }
    }
    
    console.log('历史记录已清空');
  }
}

module.exports = NewsHistory;

// 测试代码
if (require.main === module) {
  const history = new NewsHistory({
    cloudbaseEnv: process.env.CLOUDBASE_ENV || 'your-cloudbase-env-id'
  });
  
  history.init()
    .then(() => {
      console.log('历史记录初始化成功');
      console.log('统计:', history.getStats());
    })
    .catch(console.error);
}
