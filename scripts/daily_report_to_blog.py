#!/usr/bin/env python3
"""
QbinAI 每日资讯 - 日报转博客文章脚本

从 WorkBuddy 自动化生成的 AI 日报 Markdown 文件中，
按分类拆分为独立博客文章，更新 articles.json 和 rss.xml，
并自动 git push 到 GitHub 触发 Pages 重建。

用法:
    python daily_report_to_blog.py                    # 处理今天
    python daily_report_to_blog.py 2026-05-12         # 处理指定日期
    python daily_report_to_blog.py --dry-run          # 预览模式，不写入文件
    python daily_report_to_blog.py --no-push          # 生成文章但不推送
"""

import json
import os
import re
import sys
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── 加载配置 ──────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "config.json"

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

BLOG_DIR = Path(CONFIG["blog_dir"])
ARTICLES_DIR = Path(CONFIG["articles_dir"])
ARTICLES_JSON = Path(CONFIG["articles_json"])
RSS_XML = Path(CONFIG["rss_xml"])
SITE_URL = CONFIG["site_url"]
SITE_TITLE = CONFIG["site_title"]
SITE_DESCRIPTION = CONFIG["site_description"]
SITE_AUTHOR = CONFIG["site_author"]
RSS_MAX_ITEMS = CONFIG.get("rss_max_items", 20)
SKIP_SECTIONS = CONFIG.get("skip_sections", [])

REPORT_DIR = Path(CONFIG["daily_report_dir"])
REPORT_PREFIX = CONFIG["daily_report_prefix"]
REPORT_SUFFIX = CONFIG["daily_report_suffix"]

# 北京时区
BJT = timezone(timedelta(hours=8))


# ── 工具函数 ──────────────────────────────────────────────

def find_daily_report(date_str: str) -> Path | None:
    """查找指定日期的日报文件"""
    filename = f"{REPORT_PREFIX}{date_str.replace('-', '')}{REPORT_SUFFIX}"
    filepath = REPORT_DIR / filename
    if filepath.exists():
        return filepath
    return None


def parse_daily_report(content: str) -> list[dict]:
    """
    解析日报内容，按 ## 分割为分类段落。

    返回:
        [{"emoji": "🤖", "heading": "AI智能体（AI Agents）", "body": "..."}]
    """
    sections = []
    # 匹配 ## 开头的行
    pattern = re.compile(r'^(## .+)$', re.MULTILINE)
    splits = list(pattern.finditer(content))

    for i, match in enumerate(splits):
        heading_line = match.group(1).strip()
        # 提取分类标识：## 后紧跟的第一个 emoji 序列
        # 用简单方式：取 ## 后到第一个中文/英文字符之前的部分
        emoji_match = re.match(r'##\s*(.+?)\s', heading_line)
        if emoji_match:
            candidate = emoji_match.group(1).strip()
            # 判断是否以 emoji 开头（非 ASCII 首字符，长度 ≤ 4）
            if candidate and len(candidate) <= 4 and not candidate[0].isascii():
                emoji = candidate
            else:
                # 尝试按已知的分类 emoji 匹配
                for known_emoji in CONFIG["category_mappings"].keys():
                    if known_emoji in heading_line:
                        emoji = known_emoji
                        break
        if not emoji:
            # 兜底：直接遍历已知 emoji 匹配
            for known_emoji in CONFIG["category_mappings"].keys():
                if known_emoji in heading_line:
                    emoji = known_emoji
                    break

        # 段落内容：当前 ## 到下一个 ## 之间
        start = match.end()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(content)
        body = content[start:end].strip()

        # 去掉开头的 --- 分隔线
        body = re.sub(r'^---\s*\n?', '', body)

        sections.append({
            "emoji": emoji,
            "heading": heading_line.replace(f"## {emoji} ", "").strip(),
            "body": body,
        })

    return sections


def extract_keywords_from_section(heading: str, body: str, max_items: int = 2) -> str:
    """从分类标题和正文中提取关键词，用于生成文章标题"""
    # 尝试从正文前几条中提取括号内标题
    titles = re.findall(r'\*\*\[(.+?)\]\*\*', body)
    if titles:
        keywords = []
        for t in titles[:max_items]:
            # 去掉冒号及后面的内容，取关键词
            kw = re.split(r'[：:]', t)[0].strip()
            if kw:
                # 智能截断：保留完整单词，总长 ≤ 20 字符
                if len(kw) > 20:
                    words = kw.split()
                    truncated = ""
                    for w in words:
                        if len(truncated) + len(w) + 1 <= 20:
                            truncated += w + " "
                        else:
                            break
                    kw = truncated.strip() or kw[:15]
                # 去掉末尾的标点
                kw = kw.rstrip("·、 ")
                if kw:
                    keywords.append(kw)
        if keywords:
            return "、".join(keywords)

    # fallback：用分类标题
    return heading


def generate_article_md(section: dict, date_str: str, mapping: dict) -> tuple[str, dict, str]:
    """
    根据分类段落生成博客文章 Markdown。

    返回: (filename, metadata, md_content)
    """
    slug = mapping["slug"]
    tags = mapping["tags"]
    filename = f"{date_str}-{slug}"

    # 生成标题
    keywords = extract_keywords_from_section(section["heading"], section["body"])
    title_template = mapping["title_template"]
    title = title_template.format(keywords=keywords)

    # 生成 excerpt（第一个条目，截断到 150 字）
    first_item = re.search(r'-\s*\*\*(.+?)\*\*\*\*(.+?)\*', section["body"])
    if first_item:
        excerpt = (first_item.group(1) + "：" + first_item.group(2))[:150]
    else:
        # fallback
        first_line = section["body"].split("\n")[0] if section["body"] else ""
        excerpt = re.sub(r'[-*\[\]]', '', first_line).strip()[:150]

    # 构建正文 Markdown
    body_md = section["body"]

    # 处理条目格式：保留原有格式
    # 确保每个条目之间有空行（marked.js 的 breaks: true 需要）
    body_md = re.sub(r'\n- ', '\n\n- ', body_md)
    body_md = body_md.strip()

    # 构建 front-matter (JSON 格式)
    front_matter = {
        "title": title,
        "date": date_str,
        "tags": tags,
        "excerpt": excerpt,
    }

    md_content = f"""---
{json.dumps(front_matter, ensure_ascii=False, indent=2)}
---

# {title}

{body_md}
"""

    metadata = {
        "filename": filename,
        "title": title,
        "date": date_str,
        "tags": tags,
        "excerpt": excerpt,
    }

    return filename, metadata, md_content


def update_articles_json(new_entries: list[dict]):
    """将新文章条目插入 articles.json 头部"""
    if not new_entries:
        return

    try:
        with open(ARTICLES_JSON, "r", encoding="utf-8") as f:
            articles = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        articles = []

    # 检查重复
    existing_filenames = {a["filename"] for a in articles}
    for entry in reversed(new_entries):
        if entry["filename"] not in existing_filenames:
            articles.insert(0, entry)

    with open(ARTICLES_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)


def update_rss_xml(new_entries: list[dict]):
    """将新文章条目插入 rss.xml"""
    if not new_entries or not RSS_XML.exists():
        return

    with open(RSS_XML, "r", encoding="utf-8") as f:
        rss_content = f.read()

    now_bjt = datetime.now(BJT)
    rfc822_now = now_bjt.strftime("%a, %d %b %Y %H:%M:%S +0800")

    # 为每个新条目生成 RSS item
    new_items = []
    for entry in new_entries:
        item_link = f"{SITE_URL}/article.html?article={entry['filename']}"
        item = f"""    <item>
      <title><![CDATA[{entry['title']}]]></title>
      <link>{item_link}</link>
      <guid>{item_link}</guid>
      <pubDate>{rfc822_now}</pubDate>
      <description><![CDATA[{entry['excerpt']}]]></description>
    </item>"""

        # 检查是否已存在
        if entry['filename'] not in rss_content:
            new_items.append(item)

    if not new_items:
        return

    # 插入到 <channel> 中第一个 </item> 之前（或 <channel> 标签之后）
    items_str = "\n".join(new_items)

    # 查找 </item> 或 </channel>
    if "</item>" in rss_content:
        insert_pos = rss_content.index("</item>") + len("</item>")
        rss_content = rss_content[:insert_pos] + "\n" + items_str + rss_content[insert_pos:]
    elif "</channel>" in rss_content:
        insert_pos = rss_content.index("</channel>")
        rss_content = rss_content[:insert_pos] + "\n  " + items_str + "\n" + rss_content[insert_pos:]
    else:
        print("⚠️ rss.xml 格式异常，跳过更新")
        return

    # 更新 lastBuildDate
    rss_content = re.sub(
        r'<lastBuildDate>[^<]*</lastBuildDate>',
        f'<lastBuildDate>{rfc822_now}</lastBuildDate>',
        rss_content
    )

    # 限制 item 数量
    item_pattern = re.compile(r'<item>.*?</item>', re.DOTALL)
    items = item_pattern.findall(rss_content)
    if len(items) > RSS_MAX_ITEMS:
        # 保留前 RSS_MAX_ITEMS 个（最新的）
        kept = items[:RSS_MAX_ITEMS]
        # 重建 item 部分
        for item in items[RSS_MAX_ITEMS:]:
            rss_content = rss_content.replace(item, "", 1)

    with open(RSS_XML, "w", encoding="utf-8") as f:
        f.write(rss_content)


def git_commit_push(date_str: str):
    """git add, commit, push"""
    try:
        subprocess.run(["git", "add", "."], cwd=BLOG_DIR, check=True, capture_output=True, text=True)

        # 检查是否有变更
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=BLOG_DIR, capture_output=True, text=True
        )
        if not result.stdout.strip():
            print("✅ 没有需要提交的变更")
            return True

        subprocess.run(
            ["git", "commit", "-m", f"自动更新：每日 AI 资讯 {date_str}"],
            cwd=BLOG_DIR, check=True, capture_output=True, text=True
        )

        result = subprocess.run(
            ["git", "push"],
            cwd=BLOG_DIR, capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"⚠️ git push 失败: {result.stderr}")
            return False

        print("✅ 已推送到 GitHub")
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️ git 操作失败: {e.stderr}")
        return False


def process_daily_report(date_str: str, dry_run: bool = False, no_push: bool = False) -> bool:
    """主处理逻辑"""
    print(f"\n{'='*60}")
    print(f"📰 QbinAI 博客自动更新 - {date_str}")
    print(f"{'='*60}\n")

    # 1. 查找日报文件
    report_path = find_daily_report(date_str)
    if not report_path:
        # 尝试前一天的日期（日报可能在次日生成）
        yesterday = (datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
        report_path = find_daily_report(yesterday)
        if report_path:
            print(f"📌 未找到 {date_str} 的日报，使用 {yesterday} 的日报: {report_path.name}")
        else:
            print(f"❌ 未找到日报文件（尝试了 {date_str} 和 {yesterday}）")
            return False
    else:
        print(f"📄 日报文件: {report_path}")

    # 2. 读取并解析日报
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()

    sections = parse_daily_report(content)
    print(f"📊 解析到 {len(sections)} 个分类段落\n")

    # 3. 映射分类并生成文章
    category_mappings = CONFIG["category_mappings"]
    processed_slugs = set()  # 避免重复（合并的分类）
    new_entries = []

    for section in sections:
        emoji = section["emoji"]

        # 跳过指定分类（亮点速评、附注等）
        if emoji in SKIP_SECTIONS:
            print(f"  ⏭️  跳过分类: {emoji} {section['heading']}")
            continue

        # 查找映射
        mapping = category_mappings.get(emoji)
        if not mapping:
            print(f"  ⚠️  未找到映射: {emoji} {section['heading']}")
            continue

        slug = mapping["slug"]

        # 合并分类处理（📊行业 + 🔬技术）
        if slug in processed_slugs:
            # 找到之前生成的文件，追加内容
            print(f"  🔗 合并分类: {emoji} {section['heading']} → {slug}")
            existing_file = ARTICLES_DIR / f"{date_str}-{slug}.md"
            if existing_file.exists() and not dry_run:
                with open(existing_file, "r", encoding="utf-8") as f:
                    existing_content = f.read()

                # 去掉末尾的 ``` 或空行
                body_md = section["body"].strip()
                body_md = re.sub(r'\n- ', '\n\n- ', body_md)
                existing_content = existing_content.rstrip() + "\n\n" + body_md + "\n"

                with open(existing_file, "w", encoding="utf-8") as f:
                    f.write(existing_content)
            continue

        processed_slugs.add(slug)

        # 生成文章
        filename, metadata, md_content = generate_article_md(section, date_str, mapping)

        article_path = ARTICLES_DIR / f"{filename}.md"

        # 检查是否已存在
        if article_path.exists():
            print(f"  ⏭️  已存在，跳过: {filename}.md")
            continue

        print(f"  ✏️  生成文章: {filename}.md")
        print(f"      标题: {metadata['title']}")

        if dry_run:
            print(f"      [DRY RUN] 预览:\n{md_content[:200]}...")
            new_entries.append(metadata)
        else:
            # 写入文件
            with open(article_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            new_entries.append(metadata)

    if not new_entries:
        print("\n✅ 没有新文章需要生成")
        return True

    print(f"\n📝 共生成 {len(new_entries)} 篇新文章")

    if dry_run:
        print("\n🔍 [DRY RUN] 预览模式，不写入文件、不更新索引、不推送")
        return True

    # 4. 更新 articles.json
    print("\n📋 更新 articles.json...")
    update_articles_json(new_entries)

    # 5. 更新 rss.xml
    print("📋 更新 rss.xml...")
    update_rss_xml(new_entries)

    # 6. Git 提交推送
    if no_push:
        print("\n⚠️ --no-push 模式，跳过 git push")
        print("   手动推送: cd d:/workbuddy/qbinai-blog && git add . && git commit -m '自动更新' && git push")
        return True

    print("\n🚀 推送到 GitHub...")
    return git_commit_push(date_str)


def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    no_push = "--no-push" in args

    # 过滤掉 flag 参数
    date_args = [a for a in args if not a.startswith("--")]

    if date_args:
        date_str = date_args[0]
    else:
        # 默认使用今天日期（北京时间）
        date_str = datetime.now(BJT).strftime("%Y-%m-%d")

    # 验证日期格式
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        print(f"❌ 日期格式错误: {date_str}，请使用 YYYY-MM-DD 格式")
        sys.exit(1)

    success = process_daily_report(date_str, dry_run=dry_run, no_push=no_push)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
