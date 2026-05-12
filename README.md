# QbinAI 每日资讯 - 个人博客

基于纯 HTML/CSS/JS 的个人博客，支持搜索、分页、RSS 订阅和评论系统。

## ✨ 功能特性

- ✅ **文章列表**（杂志式布局，特色文章大卡片展示）
- ✅ **文章详情**（Markdown 渲染 + 代码高亮）
- ✅ **标签分类**（标签云 + 按标签筛选）
- ✅ **关于页面**（博客介绍、技术栈）
- ✅ **搜索功能**（全文搜索：标题、摘要、标签）
- ✅ **分页加载**（每页 5 篇文章）
- ✅ **RSS 订阅**（`rss.xml`）
- ✅ **评论系统**（Giscus，需要配置）
- ✅ **响应式设计**（适配桌面、平板、手机）
- ✅ **自动更新**（Python 脚本 + GitHub Actions）

## 🚀 本地运行

### 方法 1：Python HTTP 服务器（推荐）

```bash
cd d:\workbuddy\qbinai-blog
python -m http.server 8000
```

访问：http://localhost:8000

### 方法 2：VS Code Live Server

1. 安装 Live Server 扩展
2. 右键 `index.html` → Open with Live Server

## 📂 项目结构

```
qbinai-blog/
├── index.html          # 首页（文章列表 + 搜索 + 分页）
├── article.html        # 文章详情页（Markdown 渲染 + Giscus 评论）
├── tags.html          # 标签分类页（标签云 + 筛选）
├── about.html         # 关于页面
├── rss.xml            # RSS 订阅文件
├── css/
│   └── style.css     # 全局样式（杂志式布局）
├── js/
│   ├── config.js     # 配置文件（Giscus 等）
│   ├── utils.js      # 工具函数
│   ├── main.js       # 首页逻辑（搜索 + 分页）
│   ├── article.js    # 文章详情逻辑
│   └── tags.js       # 标签页面逻辑
├── articles/         # Markdown 文章目录
│   ├── 2026-05-11-ai-breakthrough.md
│   ├── 2026-05-10-new-model-release.md
│   └── ...
├── articles.json     # 文章索引文件
└── scripts/
    └── auto_update.py  # 自动更新脚本
```

## 📝 添加新文章

### 方法 1：手动添加

1. 在 `articles/` 目录创建新的 Markdown 文件
2. 文件命名格式：`YYYY-MM-DD-title.md`（如 `2026-05-12-new-ai-model.md`）
3. 添加 front-matter（JSON 格式）：
   ```markdown
   ---
   {
     "title": "文章标题",
     "date": "2026-05-12",
     "tags": ["AI", "标签2"],
     "excerpt": "文章摘要"
   }
   ---
   
   # 文章正文
   ...
   ```
4. 更新 `articles.json`，添加文章元数据

### 方法 2：自动更新（需要配置）

1. 注册 NewsAPI：https://newsapi.org/register（免费）
2. 获取 API Key
3. 编辑 `scripts/auto_update.py`，将 `YOUR_NEWSAPI_KEY` 替换为你的 API Key
4. 运行脚本：
   ```bash
   cd scripts
   python auto_update.py
   ```

### 方法 3：GitHub Actions 自动更新

1. 将博客部署到 GitHub Pages
2. 在 GitHub 仓库设置中，添加 Secret：`NEWS_API_KEY`（你的 NewsAPI Key）
3. GitHub Actions 将每天北京时间 08:00 自动运行脚本并更新博客

## 🔧 配置 Giscus 评论系统

Giscus 是基于 GitHub Discussions 的评论系统，需要：

1. **创建 GitHub 仓库**（如 `qbinai/qbinai.github.io`）
2. **启用 Discussions**：仓库 Settings → Features → Discussions ✅
3. **安装 Giscus App**：https://github.com/apps/giscus
4. **获取配置信息**：访问 https://giscus.app/zh-CN 获取：
   - Repository name（如 `qbinai/qbinai.github.io`）
   - Repository ID
   - Discussion category name（如 `Announcements`）
   - Discussion category ID
5. **更新配置文件** `js/config.js`：
   ```javascript
   giscus: {
     enabled: true,  // 改为 true
     repo: 'qbinai/qbinai.github.io',  // 替换为你的仓库
     repoId: 'your-repo-id',  // 替换为你的 Repo ID
     category: 'Announcements',
     categoryId: 'your-category-id',  // 替换为你的 Category ID
     // ... 其他配置
   }
   ```

## 🌐 部署到 GitHub Pages

1. 创建 GitHub 仓库（如 `qbinai/qbinai.github.io`）
2. 推送代码：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/qbinai/qbinai.github.io.git
   git push -u origin main
   ```
3. 启用 GitHub Pages：仓库 Settings → Pages → Source → main 分支
4. 访问：`https://qbinai.github.io`

## 🧪 测试清单

- [ ] 首页加载正常，文章列表显示
- [ ] 搜索功能正常（输入关键词，检查筛选结果）
- [ ] 分页功能正常（点击页码，检查文章切换）
- [ ] 点击文章标题，跳转到详情页
- [ ] 文章详情页 Markdown 渲染正常
- [ ] 代码块有语法高亮
- [ ] 标签分类页标签云显示正常
- [ ] 点击标签，筛选该标签的文章
- [ ] 关于页面显示正常
- [ ] RSS 订阅文件可访问（`http://localhost:8000/rss.xml`）
- [ ] （可选）Giscus 评论系统正常（如果已配置）

## 📚 技术栈

- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **Markdown 渲染**：[marked.js](https://marked.js.org/)
- **代码高亮**：[highlight.js](https://highlightjs.org/)
- **评论系统**：[Giscus](https://giscus.app/zh-CN)
- **自动更新**：Python + NewsAPI + GitHub Actions

## 🔗 相关链接

- [marked.js 文档](https://marked.js.org/)
- [Giscus 配置指南](https://giscus.app/zh-CN)
- [NewsAPI 文档](https://newsapi.org/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 📄 许可证

MIT License

---

**开发者**：QbinAI  
**更新时间**：2026-05-12
