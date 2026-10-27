#!/usr/bin/env python3
"""Build the ThinkwithClaude articles section.

Source:  blog/posts/YYYY-MM-DD-slug.md  (front matter + Markdown body)
Output:  blog/<slug>/index.html, blog/index.html, sitemap.xml

Front matter (between --- lines):
  title:        Article title (also the <h1>)
  description:  One-sentence meta description (max ~155 chars)
  date:         YYYY-MM-DD
  slug:         url-friendly-slug
  keywords:     comma, separated, keywords   (optional)

Run:  python3 blog/build.py
Needs: pip install markdown
"""
import html, json, os, re, sys, datetime
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "blog")
POSTS = os.path.join(BLOG, "posts")
SITE = "https://www.thinkwithclaude.com"
AUTHOR = "Shantanu Anand"
CALENDLY = "https://calendly.com/infohub-connectwithshantanu/claude-session"

CSS = """
*{box-sizing:border-box}
body{margin:0;background:#F7F9FC;color:#1A1A1A;font:17px/1.75 'Inter',sans-serif}
a{color:#004AAD}
.top{background:#fff;border-bottom:1px solid rgba(15,23,42,.08)}
.top-in{max-width:1100px;margin:0 auto;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#0B1B33;font:700 16px 'DM Sans',sans-serif}
.mark{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#004AAD,#F5B301);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
.navl{display:flex;gap:18px;align-items:center;font-size:14px}
.navl a{text-decoration:none;color:#333}
.cta{background:#004AAD;color:#fff !important;padding:9px 16px;border-radius:999px;font-weight:600}
.w{max-width:760px;margin:0 auto;padding:48px 20px 64px}
.kick{font:700 12px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#004AAD}
h1{font:700 clamp(30px,5vw,44px)/1.15 'DM Sans',sans-serif;color:#0B1B33;margin:10px 0 14px}
.meta{color:#5B6472;font-size:14px;margin-bottom:30px}
article h2{font:700 26px/1.25 'DM Sans',sans-serif;color:#0B1B33;margin:40px 0 12px}
article h3{font:700 20px/1.3 'DM Sans',sans-serif;color:#0B1B33;margin:28px 0 10px}
article p,article li{color:#2A2F38}
article blockquote{margin:20px 0;padding:14px 18px;background:#EEF4FF;border-left:4px solid #004AAD;border-radius:8px}
article pre{background:#0B1B33;color:#E8EEF8;border-radius:12px;padding:16px;overflow:auto;font:14px/1.6 ui-monospace,Menlo,monospace;white-space:pre-wrap}
article code{background:#EEF2F7;padding:2px 6px;border-radius:5px;font-size:.9em}
article pre code{background:none;padding:0}
article table{border-collapse:collapse;width:100%;font-size:15px}
article th,article td{border:1px solid rgba(15,23,42,.12);padding:8px 10px;text-align:left}
.box{margin-top:44px;background:#0B1B33;color:#fff;border-radius:18px;padding:26px}
.box h2{color:#fff;font:700 22px 'DM Sans',sans-serif;margin:0 0 8px}
.box p{color:#C9D3E3;margin:0 0 16px;font-size:16px}
.btn{display:inline-block;background:#fff;color:#004AAD;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;margin:0 8px 8px 0}
.btn.alt{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35)}
.list{display:grid;gap:16px}
.card{display:block;background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:20px;text-decoration:none;transition:border-color .2s,box-shadow .2s}
.card:hover{border-color:#004AAD;box-shadow:0 8px 24px rgba(0,74,173,.10)}
.card b{display:block;font:700 20px/1.3 'DM Sans',sans-serif;color:#0B1B33;margin-bottom:6px}
.card span{color:#4A4A4A;font-size:15px;line-height:1.6}
.card small{display:block;color:#6B6B6B;font-size:13px;margin-top:10px}
.foot{text-align:center;color:#6B6B6B;font-size:13px;padding:24px}
@media(max-width:640px){.navl a:not(.cta){display:none}}
"""

HEAD = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{extra}<link rel="canonical" href="{url}">
<meta property="og:type" content="{ogtype}"><meta property="og:title" content="{ogtitle}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script type="text/javascript">(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","yyn121dz14");</script>
<style>{css}</style>
{schema}</head><body>
<header class="top"><div class="top-in">
  <a class="brand" href="/"><span class="mark">SA</span>ThinkwithClaude</a>
  <nav class="navl"><a href="/">Home</a><a href="/blog/">Articles</a><a class="cta" href="{cal}" target="_blank" rel="noopener">Book free call</a></nav>
</div></header>
"""

FOOT = """<div class="foot">© {year} ThinkwithClaude · Shantanu Anand, AI Trainer &amp; Consultant</div>
</body></html>
"""

CTA = """<div class="box">
  <h2>Want your team to work like this?</h2>
  <p>Hands-on AI training for professionals and teams, online or in person anywhere in India. Get the training details on WhatsApp, or book a free 20-minute call.</p>
  <a class="btn" href="/#inquiry">Get training details</a><a class="btn alt" href="{cal}" target="_blank" rel="noopener">Book a free call</a>
</div>"""


def parse(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.S)
    if not m:
        sys.exit(f"Missing front matter: {path}")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip().lower()] = v.strip().strip('"').strip("'")
    for k in ("title", "description", "date", "slug"):
        if not meta.get(k):
            sys.exit(f"{path}: front matter needs '{k}'")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", meta["slug"]):
        sys.exit(f"{path}: slug must be lowercase-words-with-hyphens")
    datetime.date.fromisoformat(meta["date"])
    body = m.group(2).strip()
    body = re.sub(r"^#\s+.*\n+", "", body)  # the title is rendered as h1 already
    meta["html"] = markdown.markdown(body, extensions=["extra", "sane_lists"])
    return meta


def nice_date(d):
    return datetime.date.fromisoformat(d).strftime("%-d %B %Y")


def esc(s):
    return html.escape(s, quote=True)


def build():
    posts = [parse(os.path.join(POSTS, f)) for f in sorted(os.listdir(POSTS)) if f.endswith(".md")]
    slugs = [p["slug"] for p in posts]
    if len(slugs) != len(set(slugs)):
        sys.exit("Duplicate slugs in blog/posts")
    today = datetime.date.today().isoformat()
    posts = [p for p in posts if p["date"] <= today]  # never publish future-dated posts early
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    year = datetime.date.today().year

    for p in posts:
        url = f"{SITE}/blog/{p['slug']}/"
        schema = {
            "@context": "https://schema.org", "@type": "BlogPosting",
            "headline": p["title"], "description": p["description"],
            "datePublished": p["date"], "dateModified": p["date"],
            "author": {"@type": "Person", "name": AUTHOR, "url": "https://www.linkedin.com/in/claudewithshantanu/"},
            "publisher": {"@type": "Organization", "name": "ThinkwithClaude", "url": SITE},
            "mainEntityOfPage": url,
        }
        extra = f'<meta name="keywords" content="{esc(p["keywords"])}">\n' if p.get("keywords") else ""
        page = HEAD.format(
            title=esc(p["title"]) + " | ThinkwithClaude", desc=esc(p["description"]), url=url,
            ogtype="article", ogtitle=esc(p["title"]), extra=extra, css=CSS, cal=CALENDLY,
            schema='<script type="application/ld+json">' + json.dumps(schema) + "</script>\n",
        )
        page += f"""<main class="w">
<div class="kick">Article</div>
<h1>{esc(p['title'])}</h1>
<div class="meta">By {AUTHOR} · {nice_date(p['date'])}</div>
<article>
{p['html']}
</article>
{CTA.format(cal=CALENDLY)}
<p style="margin-top:26px"><a href="/blog/">← All articles</a></p>
</main>
""" + FOOT.format(year=year)
        out = os.path.join(BLOG, p["slug"])
        os.makedirs(out, exist_ok=True)
        open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)

    cards = "\n".join(
        f'<a class="card" href="/blog/{p["slug"]}/"><b>{esc(p["title"])}</b><span>{esc(p["description"])}</span><small>{nice_date(p["date"])}</small></a>'
        for p in posts
    ) or '<p>The first article is on its way. Check back soon.</p>'
    idx = HEAD.format(
        title="AI at Work Articles | ThinkwithClaude",
        desc="Practical articles on using AI tools like ChatGPT, Claude and Gemini at work, by AI trainer Shantanu Anand.",
        url=f"{SITE}/blog/", ogtype="website", ogtitle="AI at Work Articles | ThinkwithClaude", extra="", css=CSS, cal=CALENDLY, schema="",
    )
    idx += f"""<main class="w">
<div class="kick">Articles</div>
<h1>AI at work, explained simply</h1>
<p class="meta">Practical guides on using AI for everyday work, by {AUTHOR}</p>
<div class="list">
{cards}
</div>
</main>
""" + FOOT.format(year=year)
    open(os.path.join(BLOG, "index.html"), "w", encoding="utf-8").write(idx)

    urls = [(f"{SITE}/", today), (f"{SITE}/blog/", posts[0]["date"] if posts else today)]
    urls += [(f"{SITE}/blog/{p['slug']}/", p["date"]) for p in posts]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls)
    sm += "</urlset>\n"
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(sm)
    print(f"Built {len(posts)} article(s)")


if __name__ == "__main__":
    build()
