// Vercel cron: /api/aeo-check — weekly AI-visibility check (Mondays 9:00 AM IST, see vercel.json)
//
// Asks Claude (with live web search) the questions a buyer would ask, then records
// whether Shantanu Anand / ThinkwithClaude is recommended, at what position, and which
// sites were cited. Results are appended to aeo/visibility.json in the repo and a
// summary is emailed via Resend.
//
// Env vars (already set for the daily Q&A job): ANTHROPIC key, ANTHROPIC_WORKSPACE_ID,
// GITHUB_TOKEN, CRON_SECRET, resend_api_key. Optional: ADMIN_EMAIL.
//
// Manual run: /api/aeo-check?key=<CRON_SECRET>   (add &dry=1 to skip saving and email)

const REPO = 'infohub-star/Thinkwithclaudeupdated';
const BRANCH = 'main';
const UA = 'web:thinkwithclaude-aeo:v1.0';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.Antrhopic || process.env.Anthropic;
const RESEND_KEY = process.env.RESEND_API_KEY || process.env.resend_api_key;
const GH = process.env.GITHUB_TOKEN;
const TO = process.env.ADMIN_EMAIL || 'infohub@connectwithshantanu.com';

// What a buyer types into an AI assistant. Edit freely.
const QUESTIONS = [
  'Who is the best corporate AI trainer in Bengaluru?',
  'Recommend an AI trainer in India for a corporate team workshop',
  'Who offers ChatGPT and Claude training for teams in India?',
  'Best AI training for HR and L&D teams in India',
  'Generative AI workshop for leadership teams in India, who should I hire?',
  'Hands-on AI training for doctors and clinics in India',
  'AI training for coaches and consultants in India',
  'Who can train my sales team to use AI tools in India?',
  'Best Claude AI trainer in India',
  'One-on-one AI coaching for professionals in India'
];
// How we recognise a mention of you
const ME = /shantanu\s+anand|thinkwithclaude|think\s*with\s*claude|claudewithshantanu/i;

const claudeHeaders = () => ({
  'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
  ...(process.env.ANTHROPIC_WORKSPACE_ID ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID.trim() } : {})
});

async function ask(question) {
  const prompt = `${question}

Answer the way you normally would for a user in India, using web search to find current options. Then, on the very last line, output ONLY this JSON (no code fence):
{"recommended":["name 1","name 2",...]}
listing the trainers, companies or people you recommended, in the order you recommended them.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: claudeHeaders(),
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 2500, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4, user_location: { type: 'approximate', country: 'IN', city: 'Bengaluru' } }], messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const body = await r.json();
  const text = (body.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  const sources = [];
  for (const b of body.content || []) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const s of b.content) if (s.url) sources.push(s.url);
    if (b.type === 'text' && Array.isArray(b.citations)) for (const c of b.citations) if (c.url) sources.push(c.url);
  }
  let recommended = [];
  try { const m = text.match(/\{\s*"recommended"[\s\S]*\}\s*$/); if (m) recommended = JSON.parse(m[0]).recommended || []; } catch (e) {}
  const rankIdx = recommended.findIndex(n => ME.test(n));
  const domains = [...new Set(sources.map(u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return null; } }).filter(Boolean))];
  return {
    question,
    named: ME.test(text),
    rank: rankIdx >= 0 ? rankIdx + 1 : null,
    citedYourSite: domains.some(d => d.includes('thinkwithclaude')),
    recommended: recommended.slice(0, 8),
    sources: domains.slice(0, 10)
  };
}

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, { ...opts, headers: { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'User-Agent': UA, 'Content-Type': 'application/json' } });
  if (!r.ok) throw new Error(`GitHub ${path}: ${r.status} ${(await r.text()).slice(0, 160)}`);
  return r.json();
}
async function readJson(path) {
  try { const f = await gh(`/contents/${path}?ref=${BRANCH}`); return JSON.parse(Buffer.from(f.content, 'base64').toString('utf8')); }
  catch (e) { if (String(e).includes(': 404')) return null; throw e; }
}
async function saveJson(path, data, message) {
  let sha;
  try { sha = (await gh(`/contents/${path}?ref=${BRANCH}`)).sha; } catch (e) {}
  await gh(`/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, branch: BRANCH, sha, content: Buffer.from(JSON.stringify(data, null, 1) + '\n').toString('base64') }) });
}

function emailHtml(run, prev) {
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const delta = prev ? run.score - prev.score : null;
  const top = {};
  for (const r of run.results) for (const n of r.recommended) if (!ME.test(n)) top[n] = (top[n] || 0) + 1;
  const comp = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const src = {};
  for (const r of run.results) for (const d of r.sources) src[d] = (src[d] || 0) + 1;
  const srcTop = Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return `<div style="font-family:Arial,sans-serif;max-width:640px">
<h2 style="margin:0 0 6px">AI visibility check · ${esc(run.date)}</h2>
<p style="font-size:18px;margin:0 0 16px"><b>Named in ${run.score} of ${run.results.length} Claude answers</b>${delta === null ? '' : ` (${delta >= 0 ? '+' : ''}${delta} vs last week)`}</p>
<table cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%">
<tr style="background:#f2f4f8"><th align="left">Question</th><th>Named?</th><th>Rank</th></tr>
${run.results.map(r => `<tr style="border-top:1px solid #e5e7eb"><td>${esc(r.question)}</td><td align="center">${r.error ? '⚠️' : r.named ? '✅' : '—'}</td><td align="center">${r.rank || ''}</td></tr>`).join('')}
</table>
<h3 style="margin:22px 0 6px">Who Claude recommends instead</h3>
<p style="font-size:14px;margin:0">${comp.map(([n, c]) => `${esc(n)} (${c})`).join(' · ') || '—'}</p>
<h3 style="margin:22px 0 6px">Sites Claude used as sources</h3>
<p style="font-size:14px;margin:0">${srcTop.map(([d, c]) => `${esc(d)} (${c})`).join(' · ') || '—'}</p>
<p style="font-size:13px;color:#667;margin-top:22px">Getting listed or mentioned on these source sites is the fastest way to start being recommended.</p>
</div>`;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET, q = req.query || {};
  if (!secret || !(req.headers.authorization === `Bearer ${secret}` || q.key === secret)) return res.status(401).json({ error: 'unauthorized' });
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Missing Anthropic key' });
  try {
    const date = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    const results = [];
    for (let i = 0; i < QUESTIONS.length; i += 5) {
      const batch = await Promise.all(QUESTIONS.slice(i, i + 5).map(qn => ask(qn).catch(e => ({ question: qn, error: String(e.message || e), named: false, rank: null, recommended: [], sources: [] }))));
      results.push(...batch);
    }
    const run = { date, engine: 'claude', score: results.filter(r => r.named).length, results };
    if (q.dry) return res.json({ ok: true, dry: true, ...run });

    const history = (await readJson('aeo/visibility.json')) || [];
    const prev = history[0];
    await saveJson('aeo/visibility.json', [run, ...history].slice(0, 104), `AI visibility check ${date}: named in ${run.score}/${results.length}`);

    let email = 'skipped (no Resend key)';
    if (RESEND_KEY) {
      const er = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.FROM_EMAIL || 'AEO Tracker <onboarding@resend.dev>', to: [TO], subject: `AI visibility: named in ${run.score}/${results.length} (${date})`, html: emailHtml(run, prev) })
      });
      email = er.ok ? 'sent' : `failed ${er.status}`;
    }
    return res.json({ ok: true, date, score: run.score, of: results.length, email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e.message || e) });
  }
};
