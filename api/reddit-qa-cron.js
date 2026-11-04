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

async function candidates(seen) {
  const token = await redditToken();
  const all = [], errors = [];
  for (const sub of [...AI_SUBS, TRENDING]) {
    try {
      for (const p of await topPosts(sub, token)) {
        const text = `${p.title} ${p.selftext || ''}`;
        const flairQ = /question|help/i.test(p.link_flair_text || '');
        if (p.over_18 || p.stickied || p.removed_by_category) continue;
        if (!(QUESTION.test(p.title.trim()) || flairQ)) continue;
        if (sub === TRENDING && !AI_WORDS.test(text)) continue;
        if (seen.has(p.id)) continue;
        all.push({ id: p.id, sub: p.subreddit, title: p.title, body: (p.selftext || '').slice(0, 1200), comments: p.num_comments, url: 'https://www.reddit.com' + p.permalink });
      }
    } catch (e) { errors.push(String(e.message || e)); }
  }
  const uniq = [...new Map(all.map(p => [p.id, p])).values()].sort((a, b) => b.comments - a.comments);
  return { list: uniq.slice(0, 14), errors };
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
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error('Claude API ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const text = (await r.json()).content.map(c => c.text || '').join('');
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
  const byId = new Map(posts.map(p => [p.id, p]));
  return arr.filter(x => byId.has(x.id) && x.q && x.a).slice(0, PER_DAY)
    .map(x => { const p = byId.get(x.id); return { id: p.id, q: x.q.trim(), a: x.a.trim(), sub: p.sub, comments: p.comments, url: p.url }; });
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
    const { list, errors } = await candidates(seen);
    if (list.length < 3) return res.status(502).json({ error: 'Not enough questions found', found: list.length, errors });

    const picks = (await writeAnswers(list)).map(i => ({ date: today, ...i }));
    if (!picks.length) return res.status(502).json({ error: 'Claude returned no usable answers' });
    if (q.dry) return res.json({ ok: true, dry: true, picks, errors });

    const next = [...picks, ...data.filter(i => i.date !== today)].slice(0, 1500);
    const index = await readFile('index.html');
    const sha = await commit({
      'qa/data.json': JSON.stringify(next, null, 1) + '\n',
      'index.html': injectSection(index, next),
      'ai-questions/index.html': renderArchive(next)
    }, `Daily AI questions: ${today} (${picks.length} answered)`);

    return res.json({ ok: true, date: today, published: picks.map(p => p.q), commit: sha, errors });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
