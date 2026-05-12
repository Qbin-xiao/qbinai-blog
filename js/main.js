/**
 * QbinAI 每日资讯 - 首页逻辑（含搜索 + 分页）
 */

// 全局变量
let allArticles = [];  // 所有文章
let filteredArticles = [];  // 筛选后的文章（搜索后）
let currentPage = 1;  // 当前页码
const articlesPerPage = 5;  // 每页显示文章数

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
  await loadAndDisplayArticles();
  initSearch();
  initPagination();
});

/**
 * 加载并显示文章列表
 */
async function loadAndDisplayArticles() {
  const articlesGrid = document.getElementById('articlesGrid');
  
  try {
    // 获取文章列表（优先 fetch，失败则使用内嵌数据）
    allArticles = await getArticlesListWithFallback();
    
    if (!allArticles || allArticles.length === 0) {
      articlesGrid.innerHTML = '<div class="no-results">暂无文章</div>';
      return;
    }
    
    // 按日期排序（最新的在前）
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 初始化筛选后的文章（初始为全部）
    filteredArticles = [...allArticles];
    
    // 显示第一页
    displayArticlesPage(1);
    
    // 更新分页控件
    updatePaginationControls();
    
  } catch (error) {
    console.error('加载文章失败:', error);
    articlesGrid.innerHTML = '<div class="no-results">加载失败，请刷新重试</div>';
  }
}

/**
 * 获取文章列表（带 fallback，支持 file:// 协议直接打开）
 */
async function getArticlesListWithFallback() {
  // 优先尝试 fetch
  try {
    const data = await getArticlesList();
    if (data && data.length > 0) return data;
  } catch (e) {
    console.warn('fetch 失败，使用内嵌数据:', e.message);
  }

  // fallback：返回内嵌文章列表
  return [
    {
      "filename": "2026-05-11-ai-breakthrough",
      "title": "AI 技术突破：新一代多模态模型发布",
      "date": "2026-05-11",
      "tags": ["AI", "多模态", "技术突破"],
      "excerpt": "今日，多家科技公司同时发布新一代多模态 AI 模型，在图像理解、视频生成和语音交互方面取得重大突破。"
    },
    {
      "filename": "2026-05-10-new-model-release",
      "title": "开源大模型新纪元：性能超越 GPT-4",
      "date": "2026-05-10",
      "tags": ["开源", "大语言模型", "GPT-4"],
      "excerpt": "一款全新的开源大语言模型在多项基准测试中超越 GPT-4，标志着开源 AI 进入新纪元。"
    },
    {
      "filename": "2026-05-09-ai-applications",
      "title": "AI 在各行业的应用案例精选",
      "date": "2026-05-09",
      "tags": ["AI 应用", "行业案例", "数字化转型"],
      "excerpt": "从医疗诊断到金融风控，从智能制造到创意设计，AI 正在重塑各行各业的工作方式。"
    },
    {
      "filename": "2026-05-08-machine-learning-trends",
      "title": "机器学习趋势解读：2026 年最值得关注的 5 个方向",
      "date": "2026-05-08",
      "tags": ["机器学习", "趋势", "技术展望"],
      "excerpt": "本文深度解析 2026 年机器学习领域的五大趋势，包括联邦学习、自监督学习和神经符号集成等。"
    },
    {
      "filename": "2026-05-07-ai-ethics",
      "title": "AI 伦理与治理：全球监管框架对比",
      "date": "2026-05-07",
      "tags": ["AI 伦理", "监管", "政策"],
      "excerpt": "随着 AI 技术的快速发展，各国纷纷出台监管框架。本文对比欧盟、美国、中国等地的 AI 治理策略。"
    }
  ];
}

/**
 * 显示指定页的文章
 * @param {number} page - 页码
 */
function displayArticlesPage(page) {
  const articlesGrid = document.getElementById('articlesGrid');
  currentPage = page;
  
  // 计算起始和结束索引
  const startIndex = (page - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const pageArticles = filteredArticles.slice(startIndex, endIndex);
  
  if (pageArticles.length === 0) {
    articlesGrid.innerHTML = '<div class="no-results">未找到文章</div>';
    return;
  }
  
  // 生成文章卡片 HTML
  let cardsHtml = '';
  pageArticles.forEach((article, index) => {
    // 第一篇文章（在每页中）为特色文章
    const isFeatured = index === 0 && page === 1;
    cardsHtml += generateArticleCard(article, isFeatured);
  });
  
  // 插入到网格中
  articlesGrid.innerHTML = cardsHtml;
  
  // 更新搜索结果计数
  updateSearchResultsCount();
}

/**
 * 更新分页控件
 */
function updatePaginationControls() {
  const pagination = document.getElementById('pagination');
  
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let paginationHtml = '';
  
  // 上一页按钮
  paginationHtml += `
    <button class="page-btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''}>
      上一页
    </button>
  `;
  
  // 页码按钮
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      paginationHtml += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHtml += `<span class="page-ellipsis">...</span>`;
    }
  }
  
  // 下一页按钮
  paginationHtml += `
    <button class="page-btn" id="nextBtn" ${currentPage === totalPages ? 'disabled' : ''}>
      下一页
    </button>
  `;
  
  pagination.innerHTML = paginationHtml;
  
  // 绑定分页按钮事件
  bindPaginationEvents();
}

/**
 * 绑定分页按钮事件
 */
function bindPaginationEvents() {
  // 页码按钮
  document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page'));
      displayArticlesPage(page);
      updatePaginationControls();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  
  // 上一页按钮
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        displayArticlesPage(currentPage - 1);
        updatePaginationControls();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  // 下一页按钮
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
      if (currentPage < totalPages) {
        displayArticlesPage(currentPage + 1);
        updatePaginationControls();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

/**
 * 初始化搜索功能
 */
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  
  if (!searchInput) return;
  
  // 搜索输入框事件
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    // 显示/隐藏清除按钮
    if (searchClear) {
      searchClear.style.display = query ? 'block' : 'none';
    }
    
    // 执行搜索
    performSearch(query);
  });
  
  // 清除按钮事件
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      performSearch('');
    });
  }
}

/**
 * 执行搜索
 * @param {string} query - 搜索关键词
 */
function performSearch(query) {
  if (!query) {
    // 清空搜索，显示所有文章
    filteredArticles = [...allArticles];
  } else {
    // 筛选文章（标题、摘要、标签）
    filteredArticles = allArticles.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(query);
      const excerptMatch = article.excerpt && article.excerpt.toLowerCase().includes(query);
      const tagMatch = article.tags && article.tags.some(tag => 
        tag.toLowerCase().includes(query)
      );
      
      return titleMatch || excerptMatch || tagMatch;
    });
  }
  
  // 重置到第一页
  currentPage = 1;
  
  // 显示结果
  displayArticlesPage(1);
  updatePaginationControls();
}

/**
 * 更新搜索结果计数
 */
function updateSearchResultsCount() {
  // 移除旧的计数显示
  const oldCount = document.querySelector('.search-results-count');
  if (oldCount) {
    oldCount.remove();
  }
  
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const query = searchInput.value.trim();
  if (!query) return;
  
  // 创建计数显示
  const countDiv = document.createElement('div');
  countDiv.className = 'search-results-count';
  countDiv.textContent = `找到 ${filteredArticles.length} 篇相关文章`;
  
  // 插入到文章网格之前
  const articlesGrid = document.getElementById('articlesGrid');
  articlesGrid.parentNode.insertBefore(countDiv, articlesGrid);
}

// 导出函数（如果在模块化环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadAndDisplayArticles,
    performSearch,
    displayArticlesPage
  };
}
