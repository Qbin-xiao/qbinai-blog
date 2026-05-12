/**
 * QbinAI 每日资讯 - 文章详情页逻辑
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
  await loadArticleContent();
  
  // 加载 Giscus 评论（如果启用）
  if (typeof CONFIG !== 'undefined' && CONFIG.giscus && CONFIG.giscus.enabled) {
    loadGiscus();
  }
});

/**
 * 加载并显示文章内容
 */
async function loadArticleContent() {
  const articleTitle = document.getElementById('articleTitle');
  const articleMeta = document.getElementById('articleMeta');
  const articleDate = document.getElementById('articleDate');
  const articleTags = document.getElementById('articleTags');
  const articleContent = document.getElementById('articleContent');
  
  // 获取文章文件名
  const filename = getUrlParam('article');
  
  if (!filename) {
    articleTitle.textContent = '文章未找到';
    articleContent.innerHTML = '<p>请检查 URL 是否正确</p>';
    return;
  }
  
  try {
    // 加载文章（优先 fetch，失败则使用内嵌数据）
    let result = null;
    try {
      result = await loadArticle(filename);
    } catch (e) {
      console.warn('fetch 失败，尝试内嵌数据:', e.message);
    }
    
    // 如果 fetch 失败，使用内嵌文章数据
    if (!result) {
      result = getEmbeddedArticle(filename);
    }
    
    if (!result) {
      throw new Error('文章未找到');
    }
    
    const { metadata, body } = result;
    
    // 更新页面标题
    document.title = `${metadata.title} - QbinAI 每日资讯`;
    articleTitle.textContent = metadata.title;
    
    // 更新日期
    articleDate.textContent = formatDate(metadata.date);
    articleDate.setAttribute('datetime', metadata.date);
    
    // 更新标签
    const tagsHtml = metadata.tags.map(tag => 
      `<a href="tags.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`
    ).join('');
    articleTags.innerHTML = tagsHtml;
    
    // 渲染 Markdown 内容
    const htmlContent = renderMarkdown(body);
    articleContent.innerHTML = htmlContent;
    
    // 高亮代码块
    if (typeof hljs !== 'undefined') {
      setTimeout(() => {
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
        });
      }, 100);
    }
    
  } catch (error) {
    console.error('加载文章失败:', error);
    articleTitle.textContent = '加载失败';
    articleContent.innerHTML = '<p>无法加载文章，请稍后重试</p>';
  }
}

/**
 * 加载 Giscus 评论系统
 */
function loadGiscus() {
  if (typeof CONFIG === 'undefined' || !CONFIG.giscus || !CONFIG.giscus.enabled) {
    return;
  }
  
  const giscusContainer = document.getElementById('giscus-script-placeholder');
  if (!giscusContainer) return;
  
  // 创建 Giscus script
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', CONFIG.giscus.repo);
  script.setAttribute('data-repo-id', CONFIG.giscus.repoId);
  script.setAttribute('data-category', CONFIG.giscus.category);
  script.setAttribute('data-category-id', CONFIG.giscus.categoryId);
  script.setAttribute('data-mapping', CONFIG.giscus.mapping);
  script.setAttribute('data-strict', CONFIG.giscus.reactionsEnabled ? '1' : '0');
  script.setAttribute('data-reactions-enabled', CONFIG.giscus.reactionsEnabled ? '1' : '0');
  script.setAttribute('data-emit-metadata', CONFIG.giscus.emitMetadata ? '1' : '0');
  script.setAttribute('data-input-position', CONFIG.giscus.inputPosition);
  script.setAttribute('data-theme', CONFIG.giscus.theme);
  script.setAttribute('data-lang', CONFIG.giscus.lang);
  script.setAttribute('crossorigin', 'anonymous');
  script.async = true;
  
  // 替换 placeholder
  giscusContainer.parentNode.replaceChild(script, giscusContainer);
}

// 导出函数（如果在模块化环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadArticleContent,
    loadGiscus
  };
}

/**
 * 获取内嵌文章数据（用于 file:// 协议直接打开）
 */
function getEmbeddedArticle(filename) {
  const articles = {
    "2026-05-11-ai-breakthrough": {
      metadata: {
        title: "AI 技术突破：新一代多模态模型发布",
        date: "2026-05-11",
        tags: ["AI", "多模态", "技术突破"]
      },
      body: `## AI 技术突破：新一代多模态模型发布

**发布日期：** 2026-05-11

### 概述

今日，多家科技公司同时发布新一代多模态 AI 模型，在图像理解、视频生成和语音交互方面取得重大突破。

### 关键进展

1. **图像理解** - 新模型在 ImageNet 上达到 95% 准确率
2. **视频生成** - 支持生成长达 5 分钟的连贯视频
3. **语音交互** - 延迟降低至 200ms 以内

### 代码示例

\`\`\`python
import AI

model = AI.load_model("omni-model-v2")
result = model.generate(video_prompt="一只猫在月球上跳舞")
print(result)
\`\`\`

> 这标志着 AI 从单一模态向真正多模态理解的重大跨越。

**相关链接：**
- [技术报告](https://example.com/tech-report)
- [演示视频](https://example.com/demo)
`
    },
    "2026-05-10-new-model-release": {
      metadata: {
        title: "开源大模型新纪元：性能超越 GPT-4",
        date: "2026-05-10",
        tags: ["开源", "大语言模型", "GPT-4"]
      },
      body: `## 开源大模型新纪元：性能超越 GPT-4

一款全新的开源大语言模型在多项基准测试中超越 GPT-4，标志着开源 AI 进入新纪元。

### 基准测试对比

| 基准测试 | GPT-4 | OpenModel-V3 |
|---------|-------|---------------|
| MMLU    | 86.4% | **88.2%** |
| HumanEval | 67% | **72%** |
| MATH    | 42% | **48%** |

这款模型的发布将极大降低 AI 应用门槛。
`
    },
    "2026-05-09-ai-applications": {
      metadata: {
        title: "AI 在各行业的应用案例精选",
        date: "2026-05-09",
        tags: ["AI 应用", "行业案例", "数字化转型"]
      },
      body: `## AI 在各行业的应用案例精选

从医疗诊断到金融风控，从智能制造到创意设计，AI 正在重塑各行各业的工作方式。

### 行业应用概览

- **医疗**：AI 辅助诊断准确率达 95%
- **金融**：风控模型减少 60% 欺诈损失
- **制造**：预测性维护降低 40% 停机时间
- **设计**：AI 生成设计稿效率提升 10 倍
`
    },
    "2026-05-08-machine-learning-trends": {
      metadata: {
        title: "机器学习趋势解读：2026 年最值得关注的 5 个方向",
        date: "2026-05-08",
        tags: ["机器学习", "趋势", "技术展望"]
      },
      body: `## 机器学习趋势解读：2026 年最值得关注的 5 个方向

本文深度解析 2026 年机器学习领域的五大趋势。

1. **联邦学习** - 隐私保护下的协同训练
2. **自监督学习** - 减少标注依赖
3. **神经符号集成** - 结合神经网络与符号推理
4. **高效模型** - 边缘设备部署
5. **可解释 AI** - 黑盒模型透明化
`
    },
    "2026-05-07-ai-ethics": {
      metadata: {
        title: "AI 伦理与治理：全球监管框架对比",
        date: "2026-05-07",
        tags: ["AI 伦理", "监管", "政策"]
      },
      body: `## AI 伦理与治理：全球监管框架对比

随着 AI 技术的快速发展，各国纷纷出台监管框架。

### 全球监管对比

| 地区 | 监管重点 | 生效时间 |
|------|---------|---------|
| 欧盟 | 风险分级管理 | 2025 |
| 美国 | 行业自律为主 | 进行中 |
| 中国 | 算法备案 + 安全评估 | 2023 |

本文对比欧盟、美国、中国等地的 AI 治理策略。
`
    }
  };
  
  return articles[filename] || null;
}
