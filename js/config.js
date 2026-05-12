/**
 * QbinAI 博客配置文件
 * 
 * Giscus 配置说明：
 * 1. 在 GitHub 上创建仓库（如 qbinai/qbinai.github.io）
 * 2. 启用仓库的 Discussions 功能
 * 3. 安装 Giscus App：https://github.com/apps/giscus
 * 4. 将仓库信息填入下方配置
 */

const CONFIG = {
  // Giscus 配置
  giscus: {
    enabled: false,  // 设置为 true 启用评论
    repo: 'username/repo',  // 替换为你的 GitHub 仓库
    repoId: 'your-repo-id',  // 从 Giscus 网站获取
    category: 'Announcements',  // Discussion 分类名称
    categoryId: 'your-category-id',  // 从 Giscus 网站获取
    mapping: 'pathname',  // 如何映射文章到 Discussion
    reactionsEnabled: true,
    emitMetadata: false,
    inputPosition: 'bottom',
    theme: 'preferred_color_scheme',
    lang: 'zh-CN'
  },
  
  // RSS 配置
  rss: {
    enabled: true,
    siteUrl: 'https://qbin-xiao.github.io/qbinai-blog',
    title: 'QbinAI 每日资讯',
    description: '探索 AI 世界的前沿动态与技术突破',
    author: 'QbinAI'
  },
  
  // 自动更新配置
  autoUpdate: {
    enabled: false,  // 设置为 true 启用自动更新
    // 需要配置后端 API 或 GitHub Actions
    // 详见 docs/auto-update.md
  }
};

// 导出配置（兼容模块化环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
