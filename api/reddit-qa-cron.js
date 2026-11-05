// Vercel cron: /api/reddit-qa-cron  — runs daily at 7:00 AM IST (see vercel.json)
//
// 1. Reads the last 24h of top posts from AI subreddits + r/popular (AI topics only)
// 2. Keeps posts that are questions, ranks them by comment count
// 3. Claude rewrites each question in plain words and writes an original answer
// 4. Commits qa/data.json, index.html (homepage section) and ai-questions/index.html
//    to GitHub in ONE commit -> Vercel redeploys the site automatically
//
// Env vars (Vercel -> Settings -> Environment Variables):
//   ANTHROPIC_API_KEY     (required, already set for /api/xray)
//   GITHUB_TOKEN          (required) fine-grained token, repo Thinkwithclaudeupdated, "Contents: Read and write"
//   CRON_SECRET           (required) any long random string; Vercel sends it to this endpoint on every cron run
//   REDDIT_CLIENT_ID      (recommended) from reddit.com/prefs/apps -> "script" app
//   ANTHROPIC_WORKSPACE_ID (needed for the web-search fallback if your key isn't scoped to a workspace)
//   REDDIT_CLIENT_SECRET  (recommended) same app. Without these Reddit often blocks server requests.
//
// Manual run:  https://www.thinkwithclaude.com/api/reddit-qa-cron?key=<CRON_SECRET>
//              add &dry=1 to preview the picks without publishing

const { injectSection, renderArchive } = require('./_qa.js');

const REPO = 'infohub-star/Thinkwithclaudeupdated';
const BRANCH = 'main';
const PER_DAY = 5;
const UA = 'web:thinkwithclaude-faq:v1.0';
const AI_SUBS = ['ClaudeAI', 'ChatGPT', 'OpenAI', 'PromptEngineering'];
const TRENDING = 'popular';
const AI_WORDS = /\b(ai|a\.i\.|chatgpt|gpt|claude|gemini|copilot|llm|openai|anthropic|prompt|prompting|chatbot|agent|automation|midjourney|perplexity|machine learning)\b/i;
const QUESTION = /\?\s*$|^(how|what|why|which|when|where|who|is|are|can|could|should|would|does|do|did|has|have|will|any|anyone|best way)\b/i;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.Antrhopic || process.env.Anthropic;
const GH = process.env.GITHUB_TOKEN;
const claudeHeaders = () => ({ 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', ...(process.env.ANTHROPIC_WORKSPACE_ID ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID.trim() } : {}) });

function istDate() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

async function redditToken() {
  const id = process.env.REDDIT_CLIENT_ID, secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  const r = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error('Reddit auth failed: ' + r.status);
  return (await r.json()).access_token;
}

async function topPosts(sub, token) {
  const url = token
    ? `https://oauth.reddit.com/r/${sub}/top?t=day&limit=100&raw_json=1`
    : `https://www.reddit.com/r/${sub}/top.json?t=day&limit=100&raw_json=1`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!r.ok) throw new Error(`r/${sub}: HTTP ${r.status}`);
  return ((await r.json()).data?.children || []).map(c => c.data);
}

function parseRss(xml, sub) {
  const out = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const title = (e.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const link = (e.match(/<link href="([^"]+)"/) || [])[1];
    const id = ((e.match(/<id>t3_(\w+)<\/id>/) || [])[1]);
    if (!title || !link || !id) continue;
    const dec = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    out.push({ id, subreddit: sub, title: dec(title), selftext: '', num_comments: null, permalink: link.replace('https://www.reddit.com', ''), link_flair_text: '' });
  }
  return out;
}

async function rssPosts(sub) {
  for (const host of ['https://www.reddit.com', 'https://old.reddit.com']) {
    const r = await fetch(`${host}/r/${sub}/top/.rss?t=day&limit=100`, { headers: { 'User-Agent': UA } });
    if (r.ok) return parseRss(await r.text(), sub);
  }
  throw new Error(`r/${sub}: RSS blocked`);
}

// Last resort: Claude searches the web for today's most-discussed Reddit questions.
async function searchPosts(seen) {
  const prompt = `Use web search to find question posts from the last 48 hours on these subreddits: r/ClaudeAI, r/ChatGPT, r/OpenAI, r/PromptEngineering, plus any trending AI question on Reddit. Prefer posts with many comments. Only include real posts you found, with their exact reddit.com URL. Return ONLY a JSON array of up to 14 items: [{"url":"https://www.reddit.com/r/.../comments/<id>/...","sub":"ClaudeAI","title":"exact post title","comments":123 or null if unknown}]`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: claudeHeaders(),
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 3000, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }], messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error('web search ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const text = (await r.json()).content.filter(c => c.type === 'text').map(c => c.text).join('');
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
  return arr.map(x => {
    const id = (String(x.url).match(/comments\/(\w+)/) || [])[1];
    return id && x.title ? { id, sub: String(x.sub || '').replace(/^r\//, ''), title: x.title, body: '', comments: Number(x.comments) || null, url: x.url } : null;
  }).filter(p => p && !seen.has(p.id));
}

async function candidates(seen) {
  let token = null;
  const all = [], errors = [];
  try { token = await redditToken(); } catch (e) { errors.push(String(e.message || e)); }
  for (const sub of [...AI_SUBS, TRENDING]) {
    let posts = null;
    try { posts = await topPosts(sub, token); } catch (e) { errors.push(String(e.message || e)); }
    if (!posts) { try { posts = await rssPosts(sub); } catch (e) { errors.push(String(e.message || e)); } }
    for (const p of posts || []) {
      const text = `${p.title} ${p.selftext || ''}`;
      const flairQ = /question|help/i.test(p.link_flair_text || '');
      if (p.over_18 || p.stickied || p.removed_by_category) continue;
      if (!(QUESTION.test(p.title.trim()) || flairQ)) continue;
      if (sub === TRENDING && !AI_WORDS.test(text)) continue;
      if (seen.has(p.id)) continue;
      all.push({ id: p.id, sub: p.subreddit, title: p.title, body: (p.selftext || '').slice(0, 1200), comments: p.num_comments, url: 'https://www.reddit.com' + p.permalink });
    }
  }
  let source = 'reddit';
  if (all.length < 3) {
    try { all.push(...await searchPosts(seen)); source = 'web-search'; } catch (e) { errors.push(String(e.message || e)); }
  }
  const uniq = [...new Map(all.map(p => [p.id, p])).values()].sort((a, b) => (b.comments || 0) - (a.comments || 0));
  return { list: uniq.slice(0, 14), errors, source };
}

async function writeAnswers(posts) {
  const prompt = `You write the daily "AI questions, answered" section for ThinkwithClaude, the site of Shantanu Anand, a practical AI trainer in India who teaches professionals to use ChatGPT, Claude, Gemini and Copilot at work.

Below are today's most-discussed question posts from Reddit (sorted by comment count). Pick the ${PER_DAY} best ones for a professional audience, preferring higher comment counts. Skip anything that is drama, a rant, a meme, politics, a pure news reaction, a bug report only the vendor can answer, or that needs real-time facts you can't verify.

For each pick:
- "q": the question rewritten in your own plain words, max 110 characters, ends with "?". Never copy the post wording.
- "a": an original, genuinely useful answer, 80 to 140 words, plain text, up to 2 short paragraphs separated by a blank line. Concrete and practical, written for a busy professional. Do not quote or summarise the Reddit thread. Avoid specific prices, usage limits, release dates or version numbers that may change; if those matter, say to check the tool's current docs. No hype, no em dashes, no mention of Reddit.
- "id": the post id, unchanged.

Return ONLY a JSON array like [{"id":"...","q":"...","a":"..."}] in rank order.

Posts:
${JSON.stringify(posts.map(p => ({ id: p.id, sub: p.sub, comments: p.comments, title: p.title, body: p.body.slice(0, 600) })))}`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: claudeHeaders(),
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error('Claude API ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const text = (await r.json()).content.map(c => c.text || '').join('');
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
  const byId = new Map(posts.map(p => [p.id, p]));
  return arr.filter(x => byId.has(x.id) && x.q && x.a).slice(0, PER_DAY)
    .map(x => { const p = byId.get(x.id); return { id: p.id, q: x.q.trim(), a: x.a.trim(), sub: p.sub, comments: p.comments || null, url: p.url }; });
}

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'User-Agent': UA, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (!r.ok) throw new Error(`GitHub ${path}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function readFile(path) {
  try {
    const f = await gh(`/contents/${path}?ref=${BRANCH}`);
    return Buffer.from(f.content, 'base64').toString('utf8');
  } catch (e) { if (String(e).includes(': 404')) return null; throw e; }
}

async function commit(files, message) {
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  const base = await gh(`/git/commits/${ref.object.sha}`);
  const tree = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })) }) });
  const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }) });
  await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) });
  return c.sha;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const q = req.query || {};
  const authed = secret && (req.headers.authorization === `Bearer ${secret}` || q.key === secret);
  if (!authed) return res.status(401).json({ error: 'unauthorized' });
  if (!ANTHROPIC_KEY || !GH) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY or GITHUB_TOKEN' });

  try {
    const today = istDate();
    const data = JSON.parse((await readFile('qa/data.json')) || '[]');
    if (data.some(i => i.date === today) && !q.force) return res.json({ ok: true, skipped: 'already published today' });

    const seen = new Set(data.map(i => i.id));
    const { list, errors, source } = await candidates(seen);
    if (list.length < 3) return res.status(502).json({ error: 'Not enough questions found', found: list.length, errors });

    const picks = (await writeAnswers(list)).map(i => ({ date: today, ...i }));
    if (!picks.length) return res.status(502).json({ error: 'Claude returned no usable answers' });
    if (q.dry) return res.json({ ok: true, dry: true, source, picks, errors });

    const next = [...picks, ...data.filter(i => i.date !== today)].slice(0, 1500);
    const index = await readFile('index.html');
    const sha = await commit({
      'qa/data.json': JSON.stringify(next, null, 1) + '\n',
      'index.html': injectSection(index, next),
      'ai-questions/index.html': renderArchive(next)
    }, `Daily AI questions: ${today} (${picks.length} answered)`);

    return res.json({ ok: true, date: today, source, published: picks.map(p => p.q), commit: sha, errors });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
