#!/usr/bin/env python3
"""Daily article publisher, run by .github/workflows/daily-article.yml.

Takes the first item under "## Up next" in blog/queue.md, asks Claude (with web
search) to write it following blog/WRITING_GUIDE.md, checks it, saves it to
blog/posts/, rebuilds the blog and moves the item to "## Published".
The workflow commits and pushes the result.

Needs: ANTHROPIC_API_KEY env var; pip install anthropic markdown
Exits 0 without changes when there is nothing to publish.
"""
import datetime, os, re, subprocess, sys
import anthropic

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "blog")
POSTS = os.path.join(BLOG, "posts")
QUEUE = os.path.join(BLOG, "queue.md")
GUIDE = os.path.join(BLOG, "WRITING_GUIDE.md")
MODEL = os.environ.get("ARTICLE_MODEL", "claude-opus-5-5")
SITE = "https://www.thinkwithclaude.com"
BANNED = ["game-changer", "game changer", "revolutionize", "revolutionise", "unlock", "delve",
          "fast-paced world", "taj", "connectwithshantanu", "connect with shantanu"]

today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).date().isoformat()


def log(msg):
    print(msg, flush=True)


def front_matter(text):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.S)
    if not m:
        return None, None
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip().lower()] = v.strip()
    return meta, m.group(2)


# 1. Already published a daily article today? (series posts such as FDE Essentials don't count)
for f in os.listdir(POSTS):
    if f.startswith(today) and f.endswith(".md"):
        meta, _ = front_matter(open(os.path.join(POSTS, f), encoding="utf-8").read())
        if meta is not None and "series" not in meta:
            log(f"Already published today: {f}. Nothing to do.")
            sys.exit(0)

# 2. Take the first queue item
queue = open(QUEUE, encoding="utf-8").read()
m = re.search(r"## Up next\s*\n(.*?)(?=\n## Published)", queue, re.S)
if not m or not m.group(1).strip():
    log("WARNING: the queue is empty. Add topics to blog/queue.md. Nothing published.")
    sys.exit(0)
section = m.group(1)
item = re.search(r"(^- Topic:.*?(?=^- Topic:|^### Article:|\Z)|^### Article:.*?(?=^- Topic:|^### Article:|\Z))",
                 section, re.S | re.M)
if not item:
    log("WARNING: could not read the first queue item. Nothing published.")
    sys.exit(1)
item_text = item.group(1)
left_after = len(re.findall(r"^(- Topic:|### Article:)", section, re.M)) - 1
log(f"Writing: {item_text.splitlines()[0]}")

used_slugs = set()
for f in os.listdir(POSTS):
    if f.endswith(".md"):
        meta, _ = front_matter(open(os.path.join(POSTS, f), encoding="utf-8").read())
        if meta and meta.get("slug"):
            used_slugs.add(meta["slug"])

guide = open(GUIDE, encoding="utf-8").read()
system = f"""You write daily articles for the ThinkwithClaude blog. Follow this writing guide exactly:

{guide}

Extra rules:
- Today's date is {today}. Use web search to check every time-sensitive fact (tool features, plans, releases, model names) and do the keyword check from the guide. Leave out anything you cannot verify. Never invent statistics, studies, quotes, client stories or features.
- The article must be original. Do not mention YouTube creators or channels that may have inspired the topic.
- Do not use any of these words: {", ".join(BANNED)}. Never mention prices.
- These slugs are taken: {", ".join(sorted(used_slugs))}.
- Reply with ONLY the finished Markdown file, starting with the front matter, nothing before or after:
---
title: ...
description: ...
date: {today}
slug: ...
keywords: ...
---
<body with no H1, including a RACT prompt in a ``` code block, a "## FAQs" section with 3 Q&As, and a "## Try this today" section with 2-3 steps>"""


def check(text):
    meta, body = front_matter(text)
    if meta is None:
        return ["missing front matter"]
    errs = []
    for k in ("title", "description", "date", "slug", "keywords"):
        if not meta.get(k):
            errs.append(f"front matter needs '{k}'")
    if errs:
        return errs
    if len(meta["title"]) >= 65:
        errs.append(f"title is {len(meta['title'])} characters; must be under 65")
    if not 140 <= len(meta["description"]) <= 155:
        errs.append(f"description is {len(meta['description'])} characters; must be 140-155")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+){2,5}", meta["slug"]):
        errs.append("slug must be 3-6 lowercase words with hyphens")
    if meta["slug"] in used_slugs:
        errs.append("slug already used")
    if meta["date"] != today:
        errs.append(f"date must be {today}")
    words = len(body.split())
    if not 900 <= words <= 1450:
        errs.append(f"body is {words} words; must be 900-1,400")
    if re.search(r"^# ", body, re.M):
        errs.append("body must not contain an H1")
    if "```" not in body:
        errs.append("needs a RACT prompt in a code block")
    if not re.search(r"^## FAQs", body, re.M):
        errs.append('needs a "## FAQs" section')
    if not re.search(r"^##+ .*Try this today", body, re.M | re.I):
        errs.append('needs a "Try this today" section')
    low = text.lower()
    for w in BANNED:
        if w in low:
            errs.append(f'remove the word "{w}"')
    if re.search(r"(₹|rs\.?\s?\d|inr\s?\d|\$\d)", low):
        errs.append("remove prices")
    return errs


client = anthropic.Anthropic()
messages = [{"role": "user", "content": f"Write today's article from this queue item:\n\n{item_text}"}]
article = None
for attempt in range(3):
    resp = client.messages.create(
        model=MODEL, max_tokens=12000, system=system, messages=messages,
        tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 8}],
    )
    text = "".join(b.text for b in resp.content if b.type == "text").strip()
    start = text.find("---")
    text = text[start:].strip() + "\n" if start >= 0 else text
    errs = check(text)
    if not errs:
        article = text
        break
    log(f"Attempt {attempt + 1} failed checks: {errs}")
    messages += [{"role": "assistant", "content": text or "(empty)"},
                 {"role": "user", "content": "Fix these problems and reply with the full corrected file only: " + "; ".join(errs)}]

if not article:
    log("ERROR: the article failed the checks 3 times. Nothing published.")
    sys.exit(1)

meta, _ = front_matter(article)
path = os.path.join(POSTS, f"{today}-{meta['slug']}.md")
open(path, "w", encoding="utf-8").write(article)
subprocess.run([sys.executable, os.path.join(BLOG, "build.py")], check=True)

link = f"{SITE}/blog/{meta['slug']}/"
queue = queue.replace(item_text, "", 1)
queue = re.sub(r"(## Published\s*\n\n?)", lambda g: g.group(1) + f"- {today}: {meta['title']} - {link}\n", queue, count=1)
open(QUEUE, "w", encoding="utf-8").write(queue)

with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a") as out:
    out.write(f"title={meta['title']}\nlink={link}\nleft={left_after}\n")
log(f"Published: {meta['title']} -> {link}")
log(f"Topics left in queue: {left_after}")
if left_after <= 3:
    log("WARNING: 3 or fewer topics left. Add more to blog/queue.md.")
