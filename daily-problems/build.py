#!/usr/bin/env python3
"""Build the /daily-problems/ section from daily-problems/data/*.json.

Usage (from repo root):  python3 daily-problems/build.py
Writes daily-problems/index.html, daily-problems/<slug>/index.html,
and adds the URLs to sitemap.xml. Safe to re-run.
"""
import glob, html, json, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEC = os.path.join(ROOT, "daily-problems")
BASE = "https://www.thinkwithclaude.com"
SECTION = "Daily Problems"
TAGLINE = "One real Indian startup problem a day, and exactly how to build the fix with Claude."
CAL = "https://calendly.com/infohub-connectwithshantanu/claude-session"
AUTHOR = {"@type": "Person", "name": "Shantanu Anand", "jobTitle": "AI Trainer & Consultant",
          "url": BASE + "/", "sameAs": ["https://www.linkedin.com/in/claudewithshantanu/"]}

CSS = """*{box-sizing:border-box}
body{margin:0;background:#F7F9FC;color:#1A1A1A;font:17px/1.75 'Inter',sans-serif}
a{color:#004AAD}
.top{background:#fff;border-bottom:1px solid rgba(15,23,42,.08)}
.top-in{max-width:1100px;margin:0 auto;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#0B1B33;font:700 16px 'DM Sans',sans-serif}
.mark{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#004AAD,#F5B301);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
.navl{display:flex;gap:18px;align-items:center;font-size:14px}.navl a{text-decoration:none;color:#333}
.cta{background:#004AAD;color:#fff !important;padding:9px 16px;border-radius:999px;font-weight:600}
.w{max-width:780px;margin:0 auto;padding:48px 20px 64px}
.kick{font:700 12px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#004AAD}.kick a{text-decoration:none}
h1{font:700 clamp(30px,5vw,44px)/1.15 'DM Sans',sans-serif;color:#0B1B33;margin:10px 0 14px}
.lead{font-size:19px;color:#2A2F38;margin:0 0 18px}
.by{font-size:13.5px;color:#5B6472;margin:0 0 22px}.by a{text-decoration:none;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 26px}
.chip{font-size:13px;font-weight:600;color:#004AAD;background:#EEF4FF;border-radius:999px;padding:6px 12px}
.chip.score{background:#FFF4D6;color:#8A5A00}
article h2{font:700 26px/1.25 'DM Sans',sans-serif;color:#0B1B33;margin:44px 0 12px}
article h3{font:700 19px/1.3 'DM Sans',sans-serif;color:#0B1B33;margin:26px 0 8px}
article p,article li{color:#2A2F38}article li{margin:8px 0}
.pitch{margin:16px 0;padding:16px 20px;background:#EEF4FF;border-left:4px solid #004AAD;border-radius:10px;font-size:18px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin:14px 0}
.tile{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:14px;padding:16px}
.tile b{display:block;font:700 16px 'DM Sans',sans-serif;color:#0B1B33;margin-bottom:4px}.tile span{font-size:15px;line-height:1.6;color:#4A4A4A}
ol.plan{padding-left:20px}ol.plan b{color:#0B1B33}
.pwrap{position:relative}
pre{background:#0B1B33;color:#E8EEF8;border-radius:12px;padding:18px;overflow:auto;font:14px/1.6 ui-monospace,Menlo,monospace;white-space:pre-wrap}
.copy{position:absolute;top:10px;right:10px;background:#fff;color:#004AAD;border:0;border-radius:8px;padding:6px 12px;font:600 13px 'Inter',sans-serif;cursor:pointer}
.warn{background:#FFF8E6;border:1px solid #F5D78A;border-radius:12px;padding:14px 16px;font-size:15px}
.src{font-size:15px}.note{font-size:13.5px;color:#5B6472}
.list{display:grid;gap:16px}
.card{display:block;background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:20px;text-decoration:none;transition:border-color .2s,box-shadow .2s}
.card:hover{border-color:#004AAD;box-shadow:0 8px 24px rgba(0,74,173,.10)}
.card b{display:block;font:700 20px/1.3 'DM Sans',sans-serif;color:#0B1B33;margin-bottom:6px}
.card span{color:#4A4A4A;font-size:15px;line-height:1.6}
.card small{display:block;color:#6B6B6B;font-size:13px;margin-top:10px}
.box{margin-top:44px;background:#0B1B33;color:#fff;border-radius:18px;padding:26px}
.box h2{color:#fff;font:700 22px 'DM Sans',sans-serif;margin:0 0 8px}.box p{color:#C9D3E3;margin:0 0 16px;font-size:16px}
.btn{display:inline-block;background:#fff;color:#004AAD;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;margin:0 8px 8px 0}
.btn.alt{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35)}
.foot{text-align:center;color:#6B6B6B;font-size:13px;padding:24px}
@media(max-width:640px){.navl a:not(.cta){display:none}}"""

HEAD_FONTS = '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">'
CLARITY = '<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","yyn121dz14");</script>'


def e(s):
    return html.escape(str(s), quote=True)


def md(s):
    """Escape, then allow **bold** and [text](https://url)."""
    s = e(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
               r'<a href="\2" target="_blank" rel="noopener nofollow">\1</a>', s)
    return s


def nice_date(d):
    return datetime.date.fromisoformat(d).strftime("%-d %B %Y")


def page(title, desc, url, body, ld, og_type="article"):
    t = e(title + " | ThinkwithClaude")
    lds = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t}</title>
<meta name="description" content="{e(desc)}">
<meta name="author" content="Shantanu Anand">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}"><meta property="og:title" content="{t}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="{t}"><meta name="twitter:description" content="{e(desc)}">
{HEAD_FONTS}
{CLARITY}
<style>{CSS}</style>
{lds}
</head><body>
<header class="top"><div class="top-in">
  <a class="brand" href="/"><span class="mark">SA</span>ThinkwithClaude</a>
  <nav class="navl"><a href="/">Home</a><a href="/blog/">Articles</a><a href="/ai-questions/">AI Q&amp;A</a><a href="/trending-ai-tools/">AI Tools Today</a><a href="/daily-problems/">{SECTION}</a><a class="cta" href="{CAL}" target="_blank" rel="noopener">Book free call</a></nav>
</div></header>
<main class="w">
{body}
<div class="box">
  <h2>Want to build things like this with Claude?</h2>
  <p>Hands-on Claude training for founders, professionals and teams, online or in person anywhere in India. Get the training details, or book a free 20-minute call.</p>
  <a class="btn" href="/#inquiry">Get training details</a><a class="btn alt" href="{CAL}" target="_blank" rel="noopener">Book a free call</a>
</div>
</main>
<div class="foot">© {datetime.date.today().year} ThinkwithClaude · Shantanu Anand, AI Trainer &amp; Consultant</div>
<script>document.querySelectorAll('.copy').forEach(b=>b.onclick=()=>{{navigator.clipboard.writeText(b.nextElementSibling.innerText).then(()=>{{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1500)}})}})</script>
</body></html>
"""


def brief_page(b, others):
    url = f"{BASE}/daily-problems/{b['slug']}/"
    tiles = lambda rows: '<div class="grid">' + "".join(
        f'<div class="tile"><b>{e(n)}</b><span>{md(t)}</span></div>' for n, t in rows) + "</div>"
    body = f"""<div class="kick"><a href="/daily-problems/">{SECTION}</a> · {nice_date(b['date'])}</div>
<h1>{e(b['title'])}</h1>
<p class="lead">{md(b['summary'])}</p>
<p class="by">Written by <a href="https://www.linkedin.com/in/claudewithshantanu/" target="_blank" rel="noopener">Shantanu Anand</a>, AI Trainer &amp; Consultant · {nice_date(b['date'])}</p>
<div class="chips"><span class="chip">{e(b['industry'])}</span><span class="chip score">Itch Score {e(b['score'])}</span><span class="chip">Build time: a weekend</span></div>
<article>
<h2>The problem</h2>
<p><b>Who feels it:</b> {md(b['who'])}</p>
<ul>{''.join(f'<li>{md(x)}</li>' for x in b['facts'])}</ul>
<h3>Who's already working on it</h3>
<p>{md(b['players'])}</p>
<h2>The solution idea</h2>
<p class="pitch">{md(b['pitch'])}</p>
{tiles(b['features'])}
<h2>How Claude builds it</h2>
<h3>Which Claude capabilities do the work</h3>
{tiles(b['capabilities'])}
<h3>Weekend build plan</h3>
<ol class="plan">{''.join(f'<li><b>{e(w)}:</b> {md(t)}</li>' for w, t in b['plan'])}</ol>
<h3>Starter prompt for Claude Code</h3>
<div class="pwrap"><button class="copy" type="button">Copy</button><pre>{e(b['prompt'])}</pre></div>
<h2>Monetisation</h2>
<p class="note">Suggested pricing, not yet validated.</p>
<ul>{''.join(f'<li>{md(x)}</li>' for x in b['pricing'])}</ul>
<h2>Riskiest assumption, and how to test it</h2>
<p><b>Assumption:</b> {md(b['risk'])}</p>
<p><b>Test first:</b> {md(b['test'])}</p>
{f'<p class="warn">{md(b["caution"])}</p>' if b.get('caution') else ''}
</article>"""
    if others:
        body += '<h2 style="font:700 24px DM Sans,sans-serif;color:#0B1B33;margin:44px 0 10px">More daily problems</h2><ul>' + "".join(
            f'<li><a href="/daily-problems/{o["slug"]}/">{e(o["title"])}</a></li>' for o in others[:6]) + "</ul>"
    body += '<p style="margin-top:22px"><a href="/daily-problems/">← All daily problems</a></p>'
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": b["title"][:110],
           "description": b["summary"], "datePublished": b["date"] + "T09:00:00+05:30",
           "author": AUTHOR, "publisher": {"@type": "Organization", "name": "ThinkwithClaude", "url": BASE + "/"},
           "mainEntityOfPage": url, "about": b["industry"]},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
              {"@type": "ListItem", "position": 2, "name": SECTION, "item": BASE + "/daily-problems/"},
              {"@type": "ListItem", "position": 3, "name": b["title"], "item": url}]}]
    return page(b["title"], b["summary"], url, body, ld)


def hub_page(briefs):
    url = BASE + "/daily-problems/"
    cards = "".join(
        f'<a class="card" href="/daily-problems/{b["slug"]}/"><b>{e(b["title"])}</b><span>{md(b["summary"])}</span>'
        f'<small>{nice_date(b["date"])} · {e(b["industry"])} · Itch Score {e(b["score"])}</small></a>' for b in briefs)
    body = f"""<div class="kick">{SECTION}</div>
<h1>{SECTION}: build the fix with Claude</h1>
<p class="lead">{TAGLINE}</p>
<div class="list">{cards or '<p>The first problem is on its way.</p>'}</div>"""
    ld = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": SECTION, "description": TAGLINE, "url": url,
           "hasPart": [{"@type": "Article", "headline": b["title"][:110], "url": f"{BASE}/daily-problems/{b['slug']}/",
                        "datePublished": b["date"]} for b in briefs[:30]]}]
    return page(SECTION + ": build the fix with Claude", TAGLINE, url, body, ld, og_type="website")


def update_sitemap(briefs):
    p = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(p):
        return
    s = open(p, encoding="utf-8").read()
    s = re.sub(r"\s*<url><loc>https://www\.thinkwithclaude\.com/daily-problems/[^<]*</loc>.*?</url>", "", s)
    today = max([b["date"] for b in briefs] or [datetime.date.today().isoformat()])
    rows = [f"  <url><loc>{BASE}/daily-problems/</loc><lastmod>{today}</lastmod></url>"] + [
        f"  <url><loc>{BASE}/daily-problems/{b['slug']}/</loc><lastmod>{b['date']}</lastmod></url>" for b in briefs]
    s = s.replace("</urlset>", "\n".join(rows) + "\n</urlset>")
    open(p, "w", encoding="utf-8").write(s)


def main():
    briefs = [json.load(open(f, encoding="utf-8")) for f in glob.glob(os.path.join(SEC, "data", "*.json"))]
    briefs.sort(key=lambda b: (b["date"], b["slug"]), reverse=True)
    for b in briefs:
        d = os.path.join(SEC, b["slug"])
        os.makedirs(d, exist_ok=True)
        others = [o for o in briefs if o["slug"] != b["slug"]]
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(brief_page(b, others))
    open(os.path.join(SEC, "index.html"), "w", encoding="utf-8").write(hub_page(briefs))
    update_sitemap(briefs)
    print(f"Built {len(briefs)} brief(s) + hub.")


if __name__ == "__main__":
    main()
