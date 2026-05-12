/**
 * QbinAI 每日资讯 - 工具函数库
 */

/**
 * 解析 Markdown 文件的 front-matter (JSON 格式)
 * @param {string} content - Markdown 文件完整内容
 * @returns {object|null} - { metadata: {...}, body: "..." } 或 null
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  try {
    const metadata = JSON.parse(match[1]);
    const body = match[2];
    return { metadata, body };
  } catch (e) {
    console.error('解析 front-matter 失败:', e);
    return null;
  }
}

/**
 * 渲染 Markdown 为 HTML
 * @param {string} mdContent - Markdown 格式文本
 * @returns {string} - 渲染后的 HTML
 */
function renderMarkdown(mdContent) {
  if (typeof marked === 'undefined') {
    console.error('marked.js 未加载');
    return mdContent;
  }
  
  // 配置 marked
  marked.setOptions({
    gfm: true,        // GitHub 风格 Markdown
    breaks: true,     // 换行转为 <br>
    headerIds: true,  // 标题添加 id
    mangle: false     // 不转义邮件地址
  });
  
  return marked.parse(mdContent);
}

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @param {string} format - 输出格式 ('full', 'short')
 * @returns {string} - 格式化后的日期
 */
function formatDate(dateStr, format = 'full') {
  const date = new Date(dateStr);
  
  if (format === 'short') {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 获取文章列表（从 articles.json）
 * @returns {Promise<Array>} - 文章元数据数组
 */
async function getArticlesList() {
  try {
    const response = await fetch('articles.json');
    if (!response.ok) {
      throw new Error('无法加载 articles.json');
    }
    const articles = await response.json();
    return articles;
  } catch (e) {
    console.error('获取文章列表失败:', e);
    return [];
  }
}

/**
 * 加载单篇文章的 Markdown 内容
 * @param {string} filename - 文章文件名 (不含 .md 后缀)
 * @returns {Promise<object|null>} - { metadata, body } 或 null
 */
async function loadArticle(filename) {
  try {
    const response = await fetch(`articles/${filename}.md`);
    if (!response.ok) {
      throw new Error(`无法加载文章: ${filename}`);
    }
    const content = await response.text();
    return parseFrontMatter(content);
  } catch (e) {
    console.error('加载文章失败:', e);
    return null;
  }
}

/**
 * 生成文章卡片 HTML
 * @param {object} article - 文章元数据
 * @param {boolean} featured - 是否为特色文章
 * @returns {string} - 卡片 HTML
 */
function generateArticleCard(article, featured = false) {
  const tagsHtml = article.tags.map(tag => 
    `<span class="tag">${tag}</span>`
  ).join('');
  
  const excerpt = article.excerpt || '暂无摘要';
  const coverStyle = article.cover 
    ? `style="background-image: url('${article.cover}')"` 
    : '';
  const coverClass = article.cover ? 'has-cover' : '';
  
  return `
    <article class="article-card ${featured ? 'featured' : ''} ${coverClass}" ${coverStyle}>
      <div class="card-content">
        <div class="card-meta">
          <time datetime="${article.date}">${formatDate(article.date, 'short')}</time>
          <div class="card-tags">${tagsHtml}</div>
        </div>
        <h2 class="card-title">
          <a href="article.html?article=${article.filename}">${article.title}</a>
        </h2>
        <p class="card-excerpt">${excerpt}</p>
      </div>
    </article>
  `;
}

/**
 * 获取 URL 参数
 * @param {string} name - 参数名
 * @returns {string|null} - 参数值
 */
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 导出函数（兼容模块化和非模块化环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseFrontMatter,
    renderMarkdown,
    formatDate,
    getArticlesList,
    loadArticle,
    generateArticleCard,
    getUrlParam
  };
}
