/**
 * QbinAI 每日资讯 - 标签分类页逻辑
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
  await initTagsPage();
});

/**
 * 初始化标签页面
 */
async function initTagsPage() {
  const tagsCloudView = document.getElementById('tagsCloudView');
  const articlesView = document.getElementById('articlesView');
  const tagsCloud = document.getElementById('tagsCloud');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const backBtn = document.getElementById('backBtn');
  const filteredArticles = document.getElementById('filteredArticles');
  
  // 加载文章列表
  const articles = await getArticlesList();
  
  if (!articles || articles.length === 0) {
    tagsCloud.innerHTML = '<div class="loading">暂无文章</div>';
    return;
  }
  
  // 收集所有标签并统计
  const tagCounts = {};
  articles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        if (!tagCounts[tag]) {
          tagCounts[tag] = { count: 0, articles: [] };
        }
        tagCounts[tag].count++;
        tagCounts[tag].articles.push(article);
      });
    }
  });
  
  // 生成标签云
  const tags = Object.keys(tagCounts);
  const maxCount = Math.max(...Object.values(tagCounts).map(t => t.count));
  
  let tagsHtml = '';
  tags.forEach(tag => {
    const count = tagCounts[tag].count;
    // 根据文章数量计算字体大小（最小 14px，最大 28px）
    const fontSize = 14 + (count / maxCount) * 14;
    tagsHtml += `
      <div class="tag-item" data-tag="${tag}" style="font-size: ${fontSize}px;">
        ${tag}
        <span class="count">${count}</span>
      </div>
    `;
  });
  
  tagsCloud.innerHTML = tagsHtml;
  
  // 绑定标签点击事件
  tagsCloud.querySelectorAll('.tag-item').forEach(item => {
    item.addEventListener('click', () => {
      const tag = item.getAttribute('data-tag');
      showArticlesByTag(tag, tagCounts[tag].articles);
    });
  });
  
  // 绑定返回按钮事件
  backBtn.addEventListener('click', () => {
    tagsCloudView.style.display = 'block';
    articlesView.style.display = 'none';
    pageTitle.textContent = '标签分类';
    pageSubtitle.textContent = '探索感兴趣的主题';
  });
  
  // 检查 URL 参数，如果有标签参数则直接显示该标签的文章
  const urlTag = getUrlParam('tag');
  if (urlTag && tagCounts[urlTag]) {
    showArticlesByTag(urlTag, tagCounts[urlTag].articles);
  }
}

/**
 * 显示指定标签的文章列表
 * @param {string} tag - 标签名
 * @param {Array} articles - 文章数组
 */
function showArticlesByTag(tag, articles) {
  const tagsCloudView = document.getElementById('tagsCloudView');
  const articlesView = document.getElementById('articlesView');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const filteredArticles = document.getElementById('filteredArticles');
  
  // 切换视图
  tagsCloudView.style.display = 'none';
  articlesView.style.display = 'block';
  
  // 更新页面标题
  pageTitle.textContent = `标签：${tag}`;
  pageSubtitle.textContent = `共 ${articles.length} 篇文章`;
  
  // 按日期排序（最新的在前）
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 生成文章卡片
  let cardsHtml = '';
  articles.forEach((article, index) => {
    const isFeatured = index === 0;
    cardsHtml += generateArticleCard(article, isFeatured);
  });
  
  filteredArticles.innerHTML = cardsHtml;
}
