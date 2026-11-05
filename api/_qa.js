// Shared renderer for the "Today's AI questions" section and the /ai-questions/ archive.
// Used by api/reddit-qa-cron.js (daily) and qa/build.js (local rebuild).
// Files starting with "_" inside /api are not exposed as endpoints on Vercel.

const SITE = 'https://www.thinkwithclaude.com';
const CAL = 'https://calendly.com/infohub-connectwithshantanu/claude-session';
const START = '<!-- REDDIT-QA:START -->';
const END = '<!-- REDDIT-QA:END -->';
const ANCHOR = '<!-- GALLERY -->'; // section is placed just before the gallery, after "For Teams"

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

function item(i, n, open) {
  return `<details class="rq-item"${open ? ' open' : ''}>
<summary><span class="rq-n">${n}</span><span class="rq-qw"><span class="rq-q">${esc(i.q)}</span><span class="rq-meta">${esc(i.sub)}${i.comments ? ' · ' + fmtNum(i.comments) + (i.sub === 'GenAI Stack Exchange' ? ' answers' : ' comments') : ' · trending'}</span></span><span class="rq-chev" aria-hidden="true"></span></summary>
<div class="rq-a">${paras(i.a)}<a class="rq-src" href="${esc(i.url)}" target="_blank" rel="noopener nofollow">See the original discussion →</a></div>
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

function injectSection(indexHtml, data) {
  const block = renderSection(data);
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
.rq-day{font:700 18px 'DM Sans',sans-serif;color:#0B1B33;margin:26px 0 10px}
.rq-past{font:700 24px 'DM Sans',sans-serif;color:#0B1B33;margin:44px 0 6px}
.rq-today{margin-top:8px}
.rq-badge{display:inline-block;font-size:13px;font-weight:600;color:#004AAD;background:#EEF4FF;border-radius:999px;padding:6px 12px;margin:0 0 14px}
@media(max-width:640px){.rq-a{padding:0 16px 16px}}`;

function renderArchive(data) {
  const year = new Date().getFullYear();
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
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Today's Top AI Questions, Answered | ThinkwithClaude</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="AI Questions, Answered Daily | ThinkwithClaude"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","yyn121dz14");</script>
<style>${PAGE_CSS}</style>
${data.length ? faqSchema(data.slice(0, 150)) : ''}
</head><body>
<header class="top"><div class="top-in">
  <a class="brand" href="/"><span class="mark">SA</span>ThinkwithClaude</a>
  <nav class="navl"><a href="/">Home</a><a href="/blog/">Articles</a><a href="/ai-questions/">AI Q&amp;A</a><a class="cta" href="${CAL}" target="_blank" rel="noopener">Book free call</a></nav>
</div></header>
<main class="w">
<div class="kick">Answered daily</div>
<h1>Today's top AI questions, answered</h1>
<p class="meta">Every morning we pick the most-discussed AI questions from Hacker News, the OpenAI Developer Forum and Stack Exchange and answer them in plain English · by Shantanu Anand</p>
${body}
<div class="box">
  <h2>Want your team to use AI like this?</h2>
  <p>Hands-on AI training for professionals and teams, online or in person anywhere in India. Get the training details on WhatsApp, or book a free 20-minute call.</p>
  <a class="btn" href="/#inquiry">Get training details</a><a class="btn alt" href="${CAL}" target="_blank" rel="noopener">Book a free call</a>
</div>
</main>
<div class="foot">© ${year} ThinkwithClaude · Shantanu Anand, AI Trainer &amp; Consultant</div>
</body></html>
`;
}

module.exports = { injectSection, renderArchive, renderSection, START, END };
