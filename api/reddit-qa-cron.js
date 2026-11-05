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

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${new URL(url).host}: HTTP ${r.status}`);
  return r.json();
}

// Hacker News: most-commented AI threads from the last 48h
async function hackerNews() {
  const since = Math.floor(Date.now() / 1000) - 48 * 3600;
  const out = [];
  for (const q of ['AI', 'ChatGPT', 'Claude', 'LLM', 'OpenAI', 'Gemini', 'AI agents']) {
    const p = new URLSearchParams({ query: q, tags: 'story', numericFilters: `created_at_i>${since},num_comments>15`, hitsPerPage: '20' });
    const d = await getJson('https://hn.algolia.com/api/v1/search?' + p);
    for (const h of d.hits || []) {
      if (!h.title || !AI_WORDS.test(h.title)) continue;
      out.push({ id: 'hn' + h.objectID, sub: 'Hacker News', title: h.title.replace(/^Ask HN:\s*/i, ''), body: (h.story_text || '').replace(/<[^>]+>/g, ' ').slice(0, 800), comments: h.num_comments, url: `https://news.ycombinator.com/item?id=${h.objectID}` });
    }
  }
  return out;
}

// OpenAI Developer Forum: today's most active topics
async function openaiForum() {
  const d = await getJson('https://community.openai.com/top.json?period=daily');
  return (d.topic_list?.topics || []).filter(t => !t.pinned && !t.closed).map(t => ({
    id: 'oai' + t.id, sub: 'OpenAI Community', title: t.title, body: (t.excerpt || '').slice(0, 800),
    comments: Math.max(0, (t.posts_count || 1) - 1), url: `https://community.openai.com/t/${t.slug}/${t.id}`
  }));
}

// Stack Exchange GenAI site: newest well-discussed questions
async function stackExchange() {
  const since = Math.floor(Date.now() / 1000) - 72 * 3600;
  const d = await getJson(`https://api.stackexchange.com/2.3/questions?site=genai&sort=activity&order=desc&fromdate=${since}&pagesize=30`);
  const dec = t => String(t).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return (d.items || []).map(q => ({ id: 'se' + q.question_id, sub: 'GenAI Stack Exchange', title: dec(q.title), body: '', comments: (q.answer_count || 0), url: q.link }));
}

async function candidates(seen) {
  const errors = [], pools = [];
  for (const [name, fn, take] of [['Hacker News', hackerNews, 7], ['OpenAI Community', openaiForum, 6], ['GenAI Stack Exchange', stackExchange, 4]]) {
    try {
      const list = (await fn()).filter(p => !seen.has(p.id));
      const uniq = [...new Map(list.map(p => [p.id, p])).values()];
      // questions first, then the most discussed
      uniq.sort((a, b) => (QUESTION.test(b.title) - QUESTION.test(a.title)) || (b.comments - a.comments));
      pools.push(...uniq.slice(0, take));
    } catch (e) { errors.push(`${name}: ${e.message || e}`); }
  }
  const list = pools.sort((a, b) => b.comments - a.comments);
  return { list, errors, source: 'communities' };
}

async function writeAnswers(posts) {
  const prompt = `You write the daily "AI questions, answered" section for ThinkwithClaude, the site of Shantanu Anand, a practical AI trainer in India who teaches professionals to use ChatGPT, Claude, Gemini and Copilot at work.

Below are today's most-discussed AI threads from Hacker News, the OpenAI Developer Forum and GenAI Stack Exchange (sorted by comment count). Pick the ${PER_DAY} best for a busy professional audience, preferring higher comment counts and mixing sources when quality allows. Prefer threads that are, or can honestly be framed as, a practical question someone would ask. Skip anything that is drama, a rant, a meme, politics, a pure news reaction, a bug report only the vendor can answer, or that needs real-time facts you can't verify.

For each pick:
- "q": the question rewritten in your own plain words, max 110 characters, ends with "?". Never copy the post wording.
- "a": an original, genuinely useful answer, 80 to 140 words, plain text, up to 2 short paragraphs separated by a blank line. Concrete and practical, written for a busy professional. Do not quote or summarise the original thread. Avoid specific prices, usage limits, release dates or version numbers that may change; if those matter, say to check the tool's current docs. No hype, no em dashes, no mention of the source site.
- "id": the post id, unchanged.

Return ONLY a JSON array like [{"id":"...","q":"...","a":"..."}] in rank order.

Posts:
${JSON.stringify(posts.map(p => ({ id: p.id, sub: p.sub, comments: p.comments, title: p.title, body: p.body.slice(0, 600) })))}`;

  let arr = null, last = '';
  for (let attempt = 0; attempt < 3 && !arr; attempt++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: claudeHeaders(),
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) { last = 'Claude API ' + r.status + ': ' + (await r.text()).slice(0, 200); continue; }
    const body = await r.json();
    const text = (body.content || []).map(c => c.text || '').join('');
    try { arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)); }
    catch (e) { last = `Could not read Claude's answer (stop: ${body.stop_reason}): ${text.slice(0, 160)}`; }
  }
  if (!arr) throw new Error(last);
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
