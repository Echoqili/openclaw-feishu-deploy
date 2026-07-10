/**
 * 飞书推送模块
 * 通过飞书机器人发送新闻摘要
 */

const axios = require('axios');
const fs = require('fs').promises;
const crypto = require('crypto');
const FormData = require('form-data');

class FeishuSender {
  constructor(config = {}) {
    this.appId = config.appId || process.env.FEISHU_APP_ID || '';
    this.appSecret = config.appSecret || process.env.FEISHU_APP_SECRET || '';
    this.baseURL = 'https://open.feishu.cn/open-apis';
    
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  /**
   * 获取访问令牌
   * @returns {string} access_token
   */
  async getAccessToken() {
    // 如果令牌未过期，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/auth/v3/tenant_access_token/internal`,
        {
          app_id: this.appId,
          app_secret: this.appSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token;
        // 令牌有效期通常为 2 小时，提前 5 分钟刷新
        this.tokenExpireTime = Date.now() + (response.data.expire - 300) * 1000;
        console.log('获取飞书访问令牌成功');
        return this.accessToken;
      } else {
        throw new Error(`获取令牌失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('获取访问令牌失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息
   * @param {string} receiveId - 接收者ID（用户ID或群ID）
   * @param {string} text - 文本内容
   * @param {string} receiveType - 接收类型：open_id, user_id, union_id, email, chat_id
   * @returns {Object} 发送结果
   */
  async sendTextMessage(receiveId, text, receiveType = 'chat_id') {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/im/v1/messages?receive_id_type=${receiveType}`,
        {
          receive_id: receiveId,
          msg_type: 'text',
          content: JSON.stringify({ text })
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        console.log('文本消息发送成功');
        return response.data;
      } else {
        throw new Error(`发送失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('发送文本消息失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 发送富文本消息（卡片消息）
   * @param {string} receiveId - 接收者ID
   * @param {Object} card - 卡片内容
   * @param {string} receiveType - 接收类型
   * @returns {Object} 发送结果
   */
  async sendCardMessage(receiveId, card, receiveType = 'chat_id') {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/im/v1/messages?receive_id_type=${receiveType}`,
        {
          receive_id: receiveId,
          msg_type: 'interactive',
          content: JSON.stringify(card)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        console.log('卡片消息发送成功');
        return response.data;
      } else {
        throw new Error(`发送失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('发送卡片消息失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 发送图片消息
   * @param {string} receiveId - 接收者ID
   * @param {string} imagePath - 图片文件路径
   * @param {string} receiveType - 接收类型
   * @returns {Object} 发送结果
   */
  async sendImageMessage(receiveId, imagePath, receiveType = 'chat_id') {
    try {
      // 1. 上传图片
      const imageKey = await this.uploadImage(imagePath);

      // 2. 发送图片消息
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/im/v1/messages?receive_id_type=${receiveType}`,
        {
          receive_id: receiveId,
          msg_type: 'image',
          content: JSON.stringify({ image_key: imageKey })
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        console.log('图片消息发送成功');
        return response.data;
      } else {
        throw new Error(`发送失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('发送图片消息失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 上传图片
   * @param {string} imagePath - 图片文件路径
   * @returns {string} image_key
   */
  async uploadImage(imagePath) {
    try {
      const token = await this.getAccessToken();
      const imageBuffer = await fs.readFile(imagePath);
      const imageName = imagePath.split('/').pop() || 'news.png';

      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: imageName,
        contentType: 'image/png'
      });
      formData.append('image_type', 'message');

      const response = await axios.post(
        `${this.baseURL}/im/v1/images`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...formData.getHeaders()
          }
        }
      );

      if (response.data.code === 0) {
        console.log('图片上传成功');
        return response.data.data.image_key;
      } else {
        throw new Error(`上传失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('上传图片失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 发送新闻摘要卡片（只发送一次，包含图片的卡片）
   * @param {string} receiveId - 接收者 ID
   * @param {Object} summaryData - 摘要数据
   * @param {string} imagePath - 图片路径
   * @returns {Object} 发送结果
   */
  async sendNewsSummary(receiveId, summaryData, imagePath = null) {
    try {
      // 构建带图片的卡片消息
      const card = this.buildNewsCard(summaryData, imagePath);
      
      // 发送卡片（只发送一次）
      return await this.sendCardMessage(receiveId, card);
    } catch (error) {
      console.error('发送新闻摘要失败:', error);
      throw error;
    }
  }

  /**
   * 构建新闻卡片
   * @param {Object} summaryData - 摘要数据
   * @param {string} imagePath - 图片路径（可选）
   * @returns {Object} 卡片对象
   */
  async buildNewsCard(summaryData, imagePath = null) {
    const elements = [];
    
    // 如果有图片，添加到卡片顶部
    if (imagePath) {
      try {
        const imageKey = await this.uploadImage(imagePath);
        elements.push({
          tag: 'img',
          img_key: imageKey,
          alt: '今日新闻摘要'
        });
      } catch (error) {
        console.error('卡片图片上传失败:', error.message);
        // 图片上传失败不影响卡片发送
      }
    }
    
    elements.push(
      {
        tag: 'div',
        text: {
          content: `📊 **今日新闻摘要**\n共精选 ${summaryData.stats.total} 条新闻`,
          tag: 'lark_md'
        }
      },
      {
        tag: 'hr'
      }
    );

    // 收集已显示的新闻标题（用于排除重复）
    const shownTitles = new Set();

    // 添加重要新闻（带链接）
    if (summaryData.importantNews && summaryData.importantNews.length > 0) {
      const importantText = summaryData.importantNews.map((news, index) => {
        shownTitles.add(news.title);
        if (news.link) {
          return `${index + 1}. <a href="${news.link}">${news.title}</a>`;
        }
        return `${index + 1}. ${news.title}`;
      }).join('\n');
      
      elements.push({
        tag: 'div',
        text: {
          content: `🔴 **重要新闻** (${summaryData.stats.highImportance}条)\n${importantText}`,
          tag: 'lark_md'
        }
      });
    }

    elements.push({
      tag: 'hr'
    });

    // 添加分类新闻（排除已显示的重要新闻）
    const categories = Object.entries(summaryData.groupedNews);
    categories.forEach(([category, newsList]) => {
      // 过滤掉已显示的新闻
      const filteredNews = newsList.filter(n => !shownTitles.has(n.title));
      if (filteredNews.length === 0) return;
      
      const newsText = filteredNews.map((news, index) => {
        shownTitles.add(news.title);
        if (news.link) {
          return `${index + 1}. <a href="${news.link}">${news.title}</a>`;
        }
        return `${index + 1}. ${news.title}`;
      }).join('\n');

      elements.push({
        tag: 'div',
        text: {
          content: `**【${category}】**(${filteredNews.length}条)\n${newsText}`,
          tag: 'lark_md'
        }
      });
    });

    // 添加底部
    elements.push(
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              content: '📰 查看更多新闻',
              tag: 'plain_text'
            },
            type: 'primary',
            url: 'https://www.myzaker.com/'
          }
        ]
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `数据来源: ZAKER | 更新时间: ${new Date().toLocaleString('zh-CN')}`
          }
        ]
      }
    );

    return {
      config: {
        wide_screen_mode: true
      },
      elements
    };
  }

  /**
   * 获取群列表
   * @returns {Array} 群列表
   */
  async getChatList() {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/im/v1/chats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            page_size: 50
          }
        }
      );

      if (response.data.code === 0) {
        return response.data.data.items;
      } else {
        throw new Error(`获取群列表失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('获取群列表失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 发送消息到多个群
   * @param {Array} chatIds - 群ID列表
   * @param {Object} summaryData - 摘要数据
   * @param {string} imagePath - 图片路径
   */
  async sendToMultipleChats(chatIds, summaryData, imagePath) {
    const results = [];
    
    for (const chatId of chatIds) {
      try {
        const result = await this.sendNewsSummary(chatId, summaryData, imagePath);
        results.push({ chatId, success: true, result });
        
        // 避免频率限制
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.push({ chatId, success: false, error: error.message });
      }
    }

    return results;
  }
}

// 导出模块
module.exports = FeishuSender;

// 测试代码
if (require.main === module) {
  const sender = new FeishuSender();
  
  // 测试获取访问令牌
  sender.getAccessToken()
    .then(token => {
      console.log('访问令牌:', token);
      return sender.getChatList();
    })
    .then(chats => {
      console.log('群列表:', chats);
    })
    .catch(err => {
      console.error('测试失败:', err);
    });
}
