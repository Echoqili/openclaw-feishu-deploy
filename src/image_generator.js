/**
 * 图片生成模块
 * 使用 Canvas 生成新闻摘要图片
 */

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs').promises;
const path = require('path');

class ImageGenerator {
  constructor(config = {}) {
    this.width = config.width || 1080;
    this.height = config.height || 2560;
    this.outputDir = config.outputDir || './output';
    this.fontPath = config.fontPath || null;
    this.maxDisplayItems = config.maxDisplayItems || 30;

    // 颜色主题
    this.colors = {
      background: '#1a1a2e',
      primary: '#16213e',
      secondary: '#0f3460',
      accent: '#e94560',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      categoryColors: {
        '科技': '#4CAF50',
        '财经': '#2196F3',
        '体育': '#FF9800',
        '娱乐': '#9C27B0',
        '政治': '#F44336',
        '社会': '#795548',
        '国际': '#3F51B5',
        '教育': '#009688',
        '健康': '#4DB6AC',
        '汽车': '#607D8B',
        '房产': '#8D6E63',
        '军事': '#D32F2F',
        '文化': '#BA68C8',
        '旅游': '#4DD0E1',
        '美食': '#FFB74D',
        '其他': '#9E9E9E'
      }
    };
  }

  /**
   * 初始化字体
   */
  async initFonts() {
    try {
      // 分别加载 Regular 和 Bold 中文字体
      // 优先使用项目内置字体，保证 Vercel 等无系统字体环境也能正常显示中文
      const bundledRegular = path.join(__dirname, '..', 'assets', 'fonts', 'LXGWWenKai-Regular.ttf');
      const bundledBold = path.join(__dirname, '..', 'assets', 'fonts', 'LXGWWenKai-Bold.ttf');

      const regularFonts = [
        bundledRegular,
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/wqy-zenhei/wqy-zenhei.ttc',
        '/usr/share/fonts/wqy/wqy-zenhei.ttc',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        'C:\\Windows\\Fonts\\msyh.ttc',
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Hiragino Sans GB.ttc'
      ];

      const boldFonts = [
        bundledBold,
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        'C:\\Windows\\Fonts\\msyhbd.ttc'
      ];

      let regularLoaded = false;
      for (const fontPath of regularFonts) {
        try {
          await fs.access(fontPath);
          GlobalFonts.registerFromPath(fontPath, 'CustomFont');
          console.log(`✓ 加载常规字体成功: ${fontPath}`);
          regularLoaded = true;
          break;
        } catch (e) {
          // 字体不存在或注册失败，继续尝试下一个
        }
      }

      let boldLoaded = false;
      for (const fontPath of boldFonts) {
        try {
          await fs.access(fontPath);
          GlobalFonts.registerFromPath(fontPath, 'CustomFontBold');
          console.log(`✓ 加载粗体字体成功: ${fontPath}`);
          boldLoaded = true;
          break;
        } catch (e) {
          // 字体不存在或注册失败，继续尝试下一个
        }
      }

      if (!regularLoaded && !boldLoaded) {
        throw new Error('未找到可用的中文字体，图片将显示乱码');
      }
      if (!regularLoaded) {
        throw new Error('未找到常规中文字体');
      }
    } catch (error) {
      console.error('字体加载失败:', error.message);
      throw error;
    }
  }

  /**
   * 生成新闻摘要图片
   * @param {Object} summaryData - 摘要数据
   * @returns {string} 图片文件路径
   */
  async generateNewsImage(summaryData) {
    try {
      await this.initFonts();
      
      // 确保输出目录存在
      await fs.mkdir(this.outputDir, { recursive: true });

      const canvas = createCanvas(this.width, this.height);
      const ctx = canvas.getContext('2d');

      // 绘制背景
      this.drawBackground(ctx);

      // 绘制标题区域
      this.drawHeader(ctx, summaryData);

      // 绘制统计信息
      this.drawStats(ctx, summaryData.stats);

      // 收集已显示的新闻标题
      const shownTitles = new Set();
      let currentY = 320;

      // 绘制重要新闻
      currentY = this.drawImportantNews(ctx, summaryData.importantNews, summaryData.stats.highImportance, shownTitles, currentY);

      // 计算分类新闻剩余展示配额
      const remainingLimit = this.maxDisplayItems - shownTitles.size;

      // 绘制分类新闻（排除重要新闻）
      currentY = this.drawCategoryNews(ctx, summaryData.groupedNews, shownTitles, currentY, remainingLimit);

      // 绘制底部信息
      this.drawFooter(ctx);

      // 保存图片
      const filename = `news-${Date.now()}.png`;
      const filepath = path.join(this.outputDir, filename);
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(filepath, buffer);

      console.log(`图片生成成功: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('生成图片失败:', error.message);
      throw error;
    }
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.colors.background);
    gradient.addColorStop(0.5, this.colors.primary);
    gradient.addColorStop(1, this.colors.secondary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 添加装饰性元素
    ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
    ctx.beginPath();
    ctx.arc(this.width - 100, 200, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
    ctx.beginPath();
    ctx.arc(100, this.height - 200, 250, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制标题区域
   */
  drawHeader(ctx, summaryData) {
    const headerY = 60;

    // 主标题
    ctx.fillStyle = this.colors.text;
    ctx.font = '48px CustomFontBold, CustomFont, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('今日新闻摘要', this.width / 2, headerY);

    // 日期
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    ctx.fillStyle = this.colors.textSecondary;
    ctx.font = '24px CustomFont, CustomFontBold, Arial, sans-serif';
    ctx.fillText(dateStr, this.width / 2, headerY + 50);
  }

  /**
   * 绘制统计信息
   */
  drawStats(ctx, stats) {
    const startY = 170;
    const cardWidth = 350;
    const cardHeight = 100;
    const gap = 30;
    const startX = (this.width - (cardWidth * 2 + gap)) / 2;

    const statItems = [
      { label: '总计新闻', value: stats.total, color: this.colors.accent },
      { label: '重要新闻', value: stats.highImportance, color: '#FF9800' }
    ];

    statItems.forEach((item, index) => {
      const x = startX + (cardWidth + gap) * index;
      
      // 卡片背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.roundRect(ctx, x, startY, cardWidth, cardHeight, 10);
      
      // 数值
      ctx.fillStyle = item.color;
      ctx.font = '36px CustomFontBold, CustomFont, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.value, x + cardWidth / 2, startY + 45);
      
      // 标签
      ctx.fillStyle = this.colors.textSecondary;
      ctx.font = '20px CustomFont, CustomFontBold, Arial, sans-serif';
      ctx.fillText(item.label, x + cardWidth / 2, startY + 75);
    });
  }

  /**
   * 绘制重要新闻
   */
  drawImportantNews(ctx, importantNews, totalCount, shownTitles, startY) {
    if (!importantNews || importantNews.length === 0) return startY;

    const padding = 40;
    const cardWidth = this.width - padding * 2;
    let currentY = startY;
    
    // 限制图片上显示的重要新闻数量（不超过总展示上限）
    const displayNews = importantNews.slice(0, this.maxDisplayItems);
    const displayCount = displayNews.length;

    // 重要新闻标题
    ctx.fillStyle = '#FF9800';
    ctx.font = '26px CustomFontBold, CustomFont, Arial, sans-serif';
    ctx.textAlign = 'left';
    const displayText = displayCount < totalCount 
      ? `重要新闻 (展示${displayCount}条/共${totalCount}条)` 
      : `重要新闻 (${totalCount}条)`;
    ctx.fillText(displayText, padding, currentY);
    currentY += 30;

    // 绘制每条重要新闻
    displayNews.forEach((news, index) => {
      if (currentY > this.height - 120) return; // 防止超出画布
      
      shownTitles.add(news.title);

      // 序号
      ctx.fillStyle = '#FF9800';
      ctx.font = '18px CustomFontBold, CustomFont, Arial, sans-serif';
      ctx.fillText(`${index + 1}.`, padding + 10, currentY);

      // 标题
      ctx.fillStyle = this.colors.text;
      ctx.font = '18px CustomFont, CustomFontBold, Arial, sans-serif';
      const maxWidth = cardWidth - 60;
      const title = this.truncateText(ctx, news.title, maxWidth);
      ctx.fillText(title, padding + 40, currentY);
      currentY += 24;

      // 摘要
      if (news.classification?.summary) {
        ctx.fillStyle = this.colors.textSecondary;
        ctx.font = '14px CustomFont, CustomFontBold, Arial, sans-serif';
        const summary = this.truncateText(ctx, news.classification.summary, maxWidth - 20);
        ctx.fillText(summary, padding + 40, currentY);
        currentY += 22;
      }
    });

    return currentY + 12;
  }

  /**
   * 绘制分类新闻
   */
  drawCategoryNews(ctx, groupedNews, shownTitles, startY, remainingLimit = null) {
    const padding = 40;
    const cardWidth = this.width - padding * 2;
    let currentY = startY;
    let categoryRemaining = remainingLimit ?? this.maxDisplayItems;

    // 分隔线
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(padding, currentY, cardWidth, 2);
    currentY += 20;

    // 分类新闻
    const categories = Object.entries(groupedNews);
    categories.forEach(([category, newsList]) => {
      if (currentY > this.height - 150) return;
      if (categoryRemaining <= 0) return;

      // 过滤掉已显示的新闻
      const filteredNews = newsList.filter(n => !shownTitles.has(n.title));
      if (filteredNews.length === 0) return;

      // 限制每个分类在图片上显示的数量（最多8条，且不超过剩余配额）
      const displayNews = filteredNews.slice(0, Math.min(8, categoryRemaining));
      const displayCount = displayNews.length;
      categoryRemaining -= displayCount;
      const totalCount = filteredNews.length;

      // 分类标题
      const categoryColor = this.colors.categoryColors[category] || this.colors.categoryColors['其他'];
      ctx.fillStyle = categoryColor;
      ctx.font = '24px CustomFontBold, CustomFont, Arial, sans-serif';
      const categoryText = displayCount < totalCount 
        ? `【${category}】(展示${displayCount}条/共${totalCount}条)` 
        : `【${category}】(${totalCount}条)`;
      ctx.fillText(categoryText, padding, currentY);
      currentY += 28;

      // 绘制每条新闻
      displayNews.forEach((news, index) => {
        if (currentY > this.height - 100) return;
        
        shownTitles.add(news.title);

        // 序号
        ctx.fillStyle = categoryColor;
        ctx.font = '16px CustomFontBold, CustomFont, Arial, sans-serif';
        ctx.fillText(`${index + 1}.`, padding + 10, currentY);

        // 标题
        ctx.fillStyle = this.colors.text;
        ctx.font = '16px CustomFont, CustomFontBold, Arial, sans-serif';
        const maxWidth = cardWidth - 60;
        const title = this.truncateText(ctx, news.title, maxWidth);
        ctx.fillText(title, padding + 40, currentY);
        currentY += 22;

        // 摘要
        if (news.classification?.summary) {
          ctx.fillStyle = this.colors.textSecondary;
          ctx.font = '12px CustomFont, CustomFontBold, Arial, sans-serif';
          const summary = this.truncateText(ctx, news.classification.summary, maxWidth - 20);
          ctx.fillText(summary, padding + 40, currentY);
          currentY += 20;
        }
      });

      currentY += 10;
    });

    return currentY;
  }

  /**
   * 绘制底部信息
   */
  drawFooter(ctx) {
    ctx.fillStyle = this.colors.textSecondary;
    ctx.font = '16px CustomFont, CustomFontBold, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('数据来源: ZAKER | 由 AI 自动生成', this.width / 2, this.height - 40);
  }

  /**
   * 绘制圆角矩形
   */
  roundRect(ctx, x, y, width, height, radius, fillTop = true, fillBottom = true) {
    ctx.beginPath();
    
    if (fillTop) {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
    }
    
    if (fillBottom) {
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    } else {
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
    }
    
    if (fillTop) {
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 截断文本
   */
  truncateText(ctx, text, maxWidth) {
    if (!text) return '';
    
    let truncated = text;
    let width = ctx.measureText(truncated).width;
    
    while (width > maxWidth && truncated.length > 0) {
      truncated = truncated.substring(0, truncated.length - 1);
      width = ctx.measureText(truncated).width;
    }
    
    if (truncated !== text) {
      truncated += '...';
    }
    
    return truncated;
  }

  /**
   * 生成简单的文字图片（备用方案）
   * @param {string} text - 文字内容
   * @returns {string} 图片路径
   */
  async generateSimpleTextImage(text) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = this.colors.primary;
    ctx.fillRect(0, 0, 800, 400);

    // 文字
    ctx.fillStyle = this.colors.text;
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    
    // 自动换行
    const lines = this.wrapText(ctx, text, 750);
    const lineHeight = 35;
    const startY = (400 - lines.length * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 400, startY + index * lineHeight);
    });

    // 保存
    const filename = `text-${Date.now()}.png`;
    const filepath = path.join(this.outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);

    return filepath;
  }

  /**
   * 文字换行
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    words.forEach(char => {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}

// 导出模块
module.exports = ImageGenerator;

// 测试代码
if (require.main === module) {
  const generator = new ImageGenerator();
  
  const testData = {
    stats: {
      total: 50,
      highImportance: 10,
      positiveNews: 15
    },
    groupedNews: {
      '科技': [
        { title: '苹果发布最新AI芯片，性能提升50%', classification: { summary: '苹果新芯片集成强大AI能力' } },
        { title: '特斯拉自动驾驶再升级', classification: {} },
        { title: 'OpenAI推出GPT-5模型', classification: {} }
      ],
      '财经': [
        { title: 'A股市场今日大涨', classification: { summary: '沪指上涨2.5%' } },
        { title: '央行降准0.5个百分点', classification: {} }
      ],
      '体育': [
        { title: '中国男足世界杯预选赛获胜', classification: {} }
      ]
    }
  };

  generator.generateNewsImage(testData)
    .then(filepath => {
      console.log('测试图片生成成功:', filepath);
    })
    .catch(err => {
      console.error('测试失败:', err);
    });
}
