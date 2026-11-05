// Shared renderer for the "Today's AI questions" section and the /ai-questions/ archive.
// Used by api/reddit-qa-cron.js (daily) and qa/build.js (local rebuild).
// Files starting with "_" inside /api are not exposed as endpoints on Vercel.

const SITE = 'https://www.thinkwithclaude.com';
const CAL = 'https://calendly.com/infohub-connectwithshantanu/claude-session';
const START = '<!-- QA-STRIP:START -->';
const END = '<!-- QA-STRIP:END -->';
const ANCHOR = '<!-- WHO THIS IS FOR -->'; // slim strip sits right under the client-logo strip

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paras = t => String(t || '').split(/\n{2,}/).map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
const plain = t => String(t || '').replace(/\s+/g, ' ').trim();
const niceDate = d => new Date(d + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const fmtNum = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);

function faqSchema(items) {
  const data = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map(i => ({ '@type': 'Question', name: plain(i.q), acceptedAnswer: { '@type': 'Answer', text: plain(i.a) } }))
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

const AUTHOR = 'Shantanu Anand';
const AUTHOR_ROLE = 'AI Trainer & Consultant';
const LINKEDIN = 'https://www.linkedin.com/in/claudewithshantanu/';
const PERSON = { '@type': 'Person', name: AUTHOR, jobTitle: AUTHOR_ROLE, url: SITE + '/', sameAs: [LINKEDIN] };
const TRAIN = `<p class="rq-train">Want your team doing this hands-on? <a href="/#inquiry">See Shantanu's AI training →</a></p>`;
const byline = d => `<p class="rq-by">Answered by <a href="${LINKEDIN}" target="_blank" rel="noopener">${AUTHOR}</a>, ${esc(AUTHOR_ROLE)}${d ? ' · ' + esc(niceDate(d)) : ''}</p>`;

const STOP = new Set('a an the i my me we our you your is are am be do does did can could should would will to of for in on at by with and or but it its this that these those so if about from into than then how what why which when where who'.split(' '));
function slugify(q) {
  const words = String(q).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/);
  const lead = ['how', 'what', 'why', 'which', 'when', 'should', 'can', 'is'].includes(words[0]) ? [words[0]] : [];
  const core = words.slice(lead.length).filter(w => !STOP.has(w));
  return [...lead, ...core].slice(0, 8).join('-').slice(0, 70).replace(/-+$/, '') || 'question';
}
// Give every item a stable, unique slug (kept in data.json once assigned)
function withSlugs(data) {
  const used = new Set(data.filter(i => i.slug).map(i => i.slug));
  for (const i of [...data].reverse()) {
    if (i.slug) continue;
    let s = slugify(i.q), k = 2;
    while (used.has(s)) s = slugify(i.q) + '-' + k++;
    used.add(s); i.slug = s;
  }
  return data;
}
const qUrl = i => `/ai-questions/${i.slug}/`;

function item(i, n, open) {
  return `<details class="rq-item"${open ? ' open' : ''}>
<summary><span class="rq-n">${n}</span><span class="rq-qw"><span class="rq-q">${esc(i.q)}</span></span><span class="rq-chev" aria-hidden="true"></span></summary>
<div class="rq-a">${paras(i.a)}${byline()}<p class="rq-links"><a href="${qUrl(i)}">Open this answer →</a></p>${TRAIN}</div>
</details>`;
}

const SECTION_CSS = `<style>
#reddit-qa{padding-top:56px;padding-bottom:56px}
#reddit-qa .rq-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px}
#reddit-qa .rq-lead{max-width:600px;color:#4A4A4A;font-size:16px;line-height:1.65;margin:10px 0 0}
#reddit-qa .rq-date{font-size:13px;font-weight:600;color:#004AAD;background:#EEF4FF;border-radius:999px;padding:6px 12px;white-space:nowrap}
#reddit-qa .rq-list{display:grid;gap:12px;max-width:860px}
#reddit-qa .rq-item{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:16px;transition:border-color .2s,box-shadow .2s}
#reddit-qa .rq-item[open]{border-color:#004AAD;box-shadow:0 10px 28px rgba(0,74,173,.10)}
#reddit-qa summary{list-style:none;cursor:pointer;display:flex;align-items:flex-start;gap:14px;padding:18px 20px;min-height:56px}
#reddit-qa summary::-webkit-details-marker{display:none}
#reddit-qa summary::after{content:none !important;display:none !important}
#reddit-qa .rq-n{flex:none;width:30px;height:30px;border-radius:50%;background:#004AAD;color:#fff;font:700 14px/30px 'DM Sans',sans-serif;text-align:center}
#reddit-qa .rq-qw{flex:1;min-width:0}
#reddit-qa .rq-q{display:block;font:700 17px/1.4 'DM Sans',sans-serif;color:#0B1B33}
#reddit-qa .rq-meta{display:block;margin-top:4px;font-size:13px;color:#6B6B6B}
#reddit-qa .rq-chev{flex:none;width:10px;height:10px;margin-top:9px;border-right:2px solid #004AAD;border-bottom:2px solid #004AAD;transform:rotate(45deg);transition:transform .2s}
#reddit-qa .rq-item[open] .rq-chev{transform:rotate(-135deg);margin-top:13px}
#reddit-qa .rq-a{padding:0 20px 20px 64px;color:#2A2F38;font-size:15.5px;line-height:1.7}
#reddit-qa .rq-a p{margin:0 0 12px}
#reddit-qa .rq-src{font-size:14px;font-weight:600;color:#004AAD;text-decoration:none}
#reddit-qa .rq-all{display:inline-block;margin-top:22px;font-weight:600;color:#004AAD;text-decoration:none}
@media(max-width:640px){#reddit-qa summary{padding:16px;gap:12px}#reddit-qa .rq-a{padding:0 16px 18px}#reddit-qa .rq-q{font-size:16px}}
</style>`;

// Homepage block. Empty (renders nothing) until the first daily run.
function renderSection(data) {
  const latest = data.length ? data[0].date : null;
  const today = data.filter(i => i.date === latest).slice(0, 5);
  if (!today.length) return `${START}\n${END}`;
  return `${START}
${SECTION_CSS}
<div class="sec" id="reddit-qa">
  <div class="si">
    <div class="rq-head">
      <div>
        <div class="sec-label">Asked today</div>
        <div class="sec-title">Today's top AI questions, answered</div>
        <p class="rq-lead">The most-discussed AI questions across AI communities in the last 24 hours, with a straight, practical answer. Updated every morning.</p>
      </div>
      <span class="rq-date">${esc(niceDate(latest))}</span>
    </div>
    <div class="rq-list">
${today.map((i, k) => item(i, k + 1, k === 0)).join('\n')}
    </div>
    <a class="rq-all" href="/ai-questions/">Browse all past questions (${data.length}) →</a>
  </div>
</div>
${faqSchema(today)}
${END}`;
}

function renderStrip(data) {
  withSlugs(data);
  const latest = data.length ? data[0].date : null;
  const today = data.filter(i => i.date === latest).slice(0, 3);
  if (!today.length) return `${START}\n${END}`;
  return `${START}
<div class="qs-strip"><div class="qs-in"><span class="qs-lbl">🔥 Today's top AI questions</span><span class="qs-links">${today.map(i => `<a href="/ai-questions/${i.slug}/">${esc(i.q)}</a>`).join('<span class="qs-dot" aria-hidden="true">·</span>')}</span><a class="qs-all" href="/ai-questions/">See all →</a></div></div>
<style>
.qs-strip{background:#F2F6FF;border-bottom:1px solid rgba(0,74,173,.12);padding:12px 20px}
.qs-in{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:14px;font-size:14px;line-height:1.45}
.qs-lbl{flex:none;font-weight:700;color:#0B1B33 !important;white-space:nowrap}
.qs-links{flex:1;min-width:0;display:flex;align-items:center;gap:10px;overflow:hidden}
.qs-links a{color:#004AAD !important;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34%}
.qs-links a:hover{text-decoration:underline}
.qs-dot{color:#8A94A6}
.qs-all{flex:none;font-weight:700;color:#004AAD !important;text-decoration:none;white-space:nowrap}
@media(max-width:760px){.qs-in{flex-wrap:wrap;gap:6px 12px}.qs-lbl{width:100%}.qs-links{flex-direction:column;align-items:flex-start;gap:4px;width:100%}.qs-links a{max-width:100%}.qs-dot{display:none}}
</style>
${END}`;
}

function injectSection(indexHtml, data) {
  const block = renderStrip(data);
  if (indexHtml.includes(START) && indexHtml.includes(END)) {
    return indexHtml.replace(new RegExp(START + '[\\s\\S]*?' + END), () => block);
  }
  if (!indexHtml.includes(ANCHOR)) throw new Error('Anchor ' + ANCHOR + ' not found in index.html');
  return indexHtml.replace(ANCHOR, () => block + '\n\n' + ANCHOR);
}

const PAGE_CSS = `*{box-sizing:border-box}
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
details.rq-item{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:14px;margin:0 0 10px}
details.rq-item[open]{border-color:#004AAD}
details.rq-item summary{list-style:none;cursor:pointer;display:flex;gap:12px;padding:16px 18px}
details.rq-item summary::-webkit-details-marker{display:none}
.rq-n{flex:none;width:28px;height:28px;border-radius:50%;background:#004AAD;color:#fff;font:700 13px/28px 'DM Sans',sans-serif;text-align:center}
.rq-qw{flex:1;min-width:0}.rq-q{display:block;font:700 17px/1.4 'DM Sans',sans-serif;color:#0B1B33}
.rq-meta{display:block;font-size:13px;color:#6B6B6B;margin-top:3px}.rq-chev{display:none}
.rq-a{padding:0 18px 16px 58px;font-size:15.5px;line-height:1.7;color:#2A2F38}.rq-a p{margin:0 0 10px}
.rq-src{font-size:14px;font-weight:600;text-decoration:none}
.rq-by{font-size:13.5px;color:#5B6472;margin:4px 0 8px}.rq-by a{color:#004AAD;text-decoration:none;font-weight:600}
.rq-links{margin:0 0 6px}.rq-links a{font-size:14px;font-weight:600;color:#004AAD;text-decoration:none}
.rq-train{font-size:14px;color:#2A2F38;background:#F2F6FF;border-radius:10px;padding:10px 12px;margin:10px 0 0}.rq-train a{font-weight:600;text-decoration:none}
.rq-one p{font-size:17px;line-height:1.75;color:#2A2F38}
.rq-rel{padding-left:18px}.rq-rel li{margin:8px 0}.rq-rel a{text-decoration:none;font-weight:500}
.rq-day{font:700 18px 'DM Sans',sans-serif;color:#0B1B33;margin:26px 0 10px}
.rq-past{font:700 24px 'DM Sans',sans-serif;color:#0B1B33;margin:44px 0 6px}
.rq-today{margin-top:8px}
.rq-badge{display:inline-block;font-size:13px;font-weight:600;color:#004AAD;background:#EEF4FF;border-radius:999px;padding:6px 12px;margin:0 0 14px}
@media(max-width:640px){.rq-a{padding:0 16px 16px}}`;

function renderArchive(data) {
  withSlugs(data);
  const days = [];
  for (const i of data) {
    let d = days.find(x => x.date === i.date);
    if (!d) days.push(d = { date: i.date, items: [] });
    d.items.push(i);
  }
  const url = `${SITE}/ai-questions/`;
  const desc = 'The most-discussed AI questions across AI communities each day, with clear, practical answers on ChatGPT, Claude, prompting and AI at work. Updated daily.';
  const [today, ...past] = days;
  const body = today ? `<section class="rq-today"><div class="rq-badge">Today · ${esc(niceDate(today.date))}</div>
${today.items.map((i, k) => item(i, k + 1, k === 0)).join('\n')}</section>
${past.length ? '<h2 class="rq-past">Earlier questions</h2>' + past.map(d => `<h3 class="rq-day">${esc(niceDate(d.date))}</h3>\n${d.items.map((i, k) => item(i, k + 1, false)).join('\n')}`).join('\n') : ''}`
    : '<p>The first questions arrive tomorrow morning.</p>';
  const schema = data.length ? ld({ '@context': 'https://schema.org', '@type': 'FAQPage', author: PERSON,
    mainEntity: data.slice(0, 100).map(i => ({ '@type': 'Question', name: plain(i.q), url: SITE + qUrl(i), acceptedAnswer: { '@type': 'Answer', text: plain(i.a), url: SITE + qUrl(i), author: PERSON } })) }) : '';
  return pageHead({ title: "Today's Top AI Questions, Answered | ThinkwithClaude", desc, url, schema }) + `<main class="w">
<div class="kick">Answered daily</div>
<h1>Today's top AI questions, answered</h1>
<p class="meta">Every morning Shantanu Anand, AI trainer and consultant, picks the most-discussed AI questions and answers them in plain English.</p>
${body}
${CTA_BOX}
</main>
` + foot();
}

function pageHead({ title, desc, url, ogtype = 'website', schema = '' }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${AUTHOR}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogtype}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","yyn121dz14");</script>
<style>${PAGE_CSS}</style>
${schema}
</head><body>
<header class="top"><div class="top-in">
  <a class="brand" href="/"><span class="mark">SA</span>ThinkwithClaude</a>
  <nav class="navl"><a href="/">Home</a><a href="/blog/">Articles</a><a href="/ai-questions/">AI Q&amp;A</a><a class="cta" href="${CAL}" target="_blank" rel="noopener">Book free call</a></nav>
</div></header>
`;
}
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const CTA_BOX = `<div class="box">
  <h2>Want your team to use AI like this?</h2>
  <p>Hands-on AI training for professionals and teams, online or in person anywhere in India. Get the training details on WhatsApp, or book a free 20-minute call.</p>
  <a class="btn" href="/#inquiry">Get training details</a><a class="btn alt" href="${CAL}" target="_blank" rel="noopener">Book a free call</a>
</div>`;
const foot = () => `<div class="foot">© ${new Date().getFullYear()} ThinkwithClaude · Shantanu Anand, AI Trainer &amp; Consultant</div>
</body></html>
`;

function renderQuestion(i, data) {
  const url = SITE + qUrl(i);
  const desc = plain(i.a).slice(0, 155).replace(/\s+\S*$/, '') + '…';
  const iso = i.date + 'T07:00:00+05:30';
  const schema = ld({
    '@context': 'https://schema.org', '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question', name: plain(i.q), text: plain(i.q), answerCount: 1, datePublished: iso, author: PERSON,
      acceptedAnswer: { '@type': 'Answer', text: plain(i.a), datePublished: iso, url, author: PERSON }
    }
  }) + '\n' + ld({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'AI Q&A', item: SITE + '/ai-questions/' },
      { '@type': 'ListItem', position: 3, name: plain(i.q), item: url }]
  });
  const related = data.filter(x => x.slug !== i.slug).slice(0, 6);
  return pageHead({ title: `${plain(i.q)} | ThinkwithClaude`, desc, url, ogtype: 'article', schema }) + `<main class="w">
<div class="kick"><a href="/ai-questions/" style="text-decoration:none">AI Q&amp;A</a></div>
<h1>${esc(i.q)}</h1>
${byline(i.date)}
<article class="rq-one">${paras(i.a)}</article>
${TRAIN}
${related.length ? `<h2 class="rq-past">More AI questions, answered</h2><ul class="rq-rel">${related.map(x => `<li><a href="${qUrl(x)}">${esc(x.q)}</a></li>`).join('')}</ul>` : ''}
<p style="margin-top:22px"><a href="/ai-questions/">← All AI questions</a></p>
${CTA_BOX}
</main>
` + foot();
}

function renderLlms(data) {
  const recent = data.slice(0, 60);
  return `# ThinkwithClaude

> ThinkwithClaude is the site of Shantanu Anand, an AI trainer and consultant based in Bengaluru, India. He runs hands-on AI training (ChatGPT, Claude, Gemini, Microsoft Copilot) for professionals, teams and founders, online or in person anywhere in India.

## Key pages
- [Home: AI training for professionals and teams](${SITE}/): sessions, results and how to book
- [AI Q&A](${SITE}/ai-questions/): the most-discussed AI questions each day, answered in plain English
- [Articles](${SITE}/blog/): practical guides on using AI at work
- [FDE for Coders](${SITE}/fde-essentials/): a series on Forward Deployed Engineering

## Recent AI questions answered by Shantanu Anand
${recent.map(i => `- [${plain(i.q)}](${SITE}${qUrl(i)})`).join('\n')}

## Contact
- Training enquiries: ${SITE}/#inquiry
- Email: partnerships@thinkwithclaude.com
`;
}

function updateSitemap(xml, data) {
  const today = data.length ? data[0].date : new Date().toISOString().slice(0, 10);
  let s = String(xml || '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n');
  s = s.replace(/\s*<url><loc>https:\/\/www\.thinkwithclaude\.com\/ai-questions\/[^<]*<\/loc><lastmod>[^<]*<\/lastmod><\/url>/g, '');
  const rows = [`  <url><loc>${SITE}/ai-questions/</loc><lastmod>${today}</lastmod></url>`]
    .concat(data.map(i => `  <url><loc>${SITE}${qUrl(i)}</loc><lastmod>${i.date}</lastmod></url>`));
  return s.replace('</urlset>', rows.join('\n') + '\n</urlset>');
}

// Every file the Q&A feature owns, ready to commit
function renderAll(data, sitemapXml, indexHtml) {
  withSlugs(data);
  const files = {
    'qa/data.json': JSON.stringify(data, null, 1) + '\n',
    'ai-questions/index.html': renderArchive(data),
    'llms.txt': renderLlms(data),
    'sitemap.xml': updateSitemap(sitemapXml, data)
  };
  for (const i of data) files[`ai-questions/${i.slug}/index.html`] = renderQuestion(i, data);
  if (indexHtml) files['index.html'] = injectSection(indexHtml, data);
  return files;
}

module.exports = { renderStrip, injectSection, renderArchive, renderSection, renderAll, withSlugs, START, END };
