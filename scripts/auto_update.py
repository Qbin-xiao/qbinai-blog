#!/usr/bin/env python3
"""
QbinAI 每日资讯 - 自动更新脚本
每天自动抓取 AI 新闻并生成 Markdown 文章
"""

import os
import json
from datetime import datetime, timedelta
import requests

# 配置
NEWS_API_KEY = 'YOUR_NEWSAPI_KEY'  # 从 https://newsapi.org/ 获取（免费）
BLOG_DIR = 'd:/workbuddy/qbinai-blog'
ARTICLES_DIR = os.path.join(BLOG_DIR, 'articles')
ARTICLES_JSON = os.path.join(BLOG_DIR, 'articles.json')

def fetch_ai_news():
    """
    从 NewsAPI 抓取 AI 相关新闻
    需要注册获取免费 API Key：https://newsapi.org/register
    """
    if NEWS_API_KEY == 'YOUR_NEWSAPI_KEY':
        print("请先配置 NEWS_API_KEY")
        print("前往 https://newsapi.org/ 注册获取免费 API Key")
        return []
    
    url = "https://newsapi.org/v2/everything"
    params = {
        'q': 'artificial intelligence OR AI OR machine learning OR deep learning',
        'language': 'en',
        'sortBy': 'publishedAt',
        'from': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
        'apiKey': NEWS_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'ok':
            return data['articles'][:5]  # 取前 5 篇
        else:
            print(f"API 错误: {data.get('message', '未知错误')}")
            return []
    except Exception as e:
        print(f"抓取新闻失败: {e}")
        return []

def generate_markdown_article(article):
    """
    根据新闻数据生成 Markdown 文章
    """
    # 解析日期
    pub_date = datetime.strptime(article['publishedAt'], '%Y-%m-%dT%H:%M:%SZ')
    date_str = pub_date.strftime('%Y-%m-%d')
    filename = f"{date_str}-{article['title'][:30].replace(' ', '-').lower()}"
    
    # 生成 front-matter (JSON 格式)
    front_matter = {
        "title": article['title'],
        "date": date_str,
        "tags": ["AI", "资讯"],
        "excerpt": article['description'] or '今日 AI 资讯更新'
    }
    
    # 生成 Markdown 内容
    md_content = f"""---
{json.dumps(front_matter, ensure_ascii=False, indent=2)}
---

# {article['title']}

{page_content}

## 原文链接

[{article['source']['name']}]({article['url']})

---

**相关链接**：
- [原文]({article['url']})
"""

    return filename, md_content

def update_articles_json(new_article):
    """
    更新 articles.json 文件
    """
    try:
        with open(ARTICLES_JSON, 'r', encoding='utf-8') as f:
            articles = json.load(f)
    except FileNotFoundError:
        articles = []
    
    # 添加新文章到开头
    articles.insert(0, new_article)
    
    # 写回文件
    with open(ARTICLES_JSON, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

def main():
    print("开始抓取 AI 新闻...")
    
    # 抓取新闻
    articles = fetch_ai_news()
    
    if not articles:
        print("未抓取到新闻")
        return
    
    print(f"抓取到 {len(articles)} 篇新闻")
    
    # 生成 Markdown 文章
    for article in articles:
        try:
            filename, md_content = generate_markdown_article(article)
            
            # 保存 Markdown 文件
            filepath = os.path.join(ARTICLES_DIR, f"{filename}.md")
            
            # 检查文件是否已存在
            if os.path.exists(filepath):
                print(f"文章已存在: {filename}")
                continue
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(md_content)
            
            print(f"已生成文章: {filename}")
            
            # 更新 articles.json
            new_article_meta = {
                "filename": filename,
                "title": article['title'],
                "date": datetime.strptime(article['publishedAt'], '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%d'),
                "tags": ["AI", "资讯"],
                "excerpt": article['description'] or '今日 AI 资讯更新'
            }
            update_articles_json(new_article_meta)
            
        except Exception as e:
            print(f"处理文章失败: {e}")
            continue
    
    print("完成！")

if __name__ == '__main__':
    main()
