// Vercel serverless function: /api/xray
// Env vars (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY  (required)  your Anthropic API key
//   RESEND_API_KEY     (for email alerts) free key from resend.com — emails you every new lead
//   ADMIN_EMAIL        (optional)  where alerts go; defaults to infohub@connectwithshantanu.com
//   FROM_EMAIL         (optional)  e.g. 'Leads <leads@thinkwithclaude.com>' once your domain is verified in Resend
//   LEAD_WEBHOOK_URL   (optional)  Google Apps Script / Make.com webhook that saves leads to your Sheet

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.Antrhopic || process.env.Anthropic;
const RESEND_KEY = process.env.RESEND_API_KEY || process.env.resend_api_key;
const hits = new Map(); // simple per-IP limit (resets when the function cold-starts)
const LIMIT = 5, WINDOW = 24 * 60 * 60 * 1000;

function limited(ip) {
  const now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  h.push(now); hits.set(ip, h);
  return h.length > LIMIT;
}

async function notifyAdmin(body) {
  if (!RESEND_KEY || !body.contact) return;
  const to = process.env.ADMIN_EMAIL || 'infohub@connectwithshantanu.com';
  const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const where = body.source === 'exit_offer' ? 'Exit popup' : 'AI job X-ray';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Website Leads <onboarding@resend.dev>',
        to: [to],
        subject: `New lead: ${String(body.job || 'Unknown job').slice(0, 60)}`,
        html: `<h2>New lead from your landing page</h2>
          <p><b>Contact:</b> ${esc(body.contact)}</p>
          <p><b>Job:</b> ${esc(body.job)}</p>
          <p><b>Came from:</b> ${where}</p>
          <p><b>Page:</b> ${esc(body.page)}</p>
          <p><b>Time (IST):</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>`
      })
    });
  } catch (_) {}
}

async function saveLead(body, ip) {
  await notifyAdmin(body);
  if (!process.env.LEAD_WEBHOOK_URL || !body.contact) return;
  try {
    await fetch(process.env.LEAD_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time: new Date().toISOString(), job: body.job, contact: body.contact,
        source: body.source, page: body.page, ip
      })
    });
  } catch (_) {}
}

const SYSTEM = `You are an AI workflow expert helping working professionals in India.
Given someone's job description, return ONLY valid JSON (no markdown) in this exact shape:
{"role":"short role noun, e.g. dermatologist","hours":number of hours per week AI could realistically save (4-12),
"wins":[4 short task names],
"workflows":[3 items: {"name":"short catchy name","saves":"X hrs/week","tools":[2-4 real, widely used tools e.g. Claude, ChatGPT, Canva, Google Sheets, WhatsApp Business, Notion, Zoom],"steps":[3 short practical steps]}],
"prompt":"one ready-to-copy prompt (under 60 words) for their most valuable task"}
Be specific to their job, practical, and non-technical. Hours across workflows should roughly add up to the total.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const job = String(body.job || '').slice(0, 300).trim();

  await saveLead(body, ip);
  if (body.leadOnly) return res.status(200).json({ ok: true });
  if (job.length < 3) return res.status(400).json({ error: 'Describe your job' });
  if (limited(ip)) return res.status(429).json({ error: 'Daily limit reached' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-5-5',
        max_tokens: 900,
        system: SYSTEM,
        messages: [{ role: 'user', content: `My job: ${job}` }]
      })
    });
    const data = await r.json();
    const text = (data.content || []).map(c => c.text || '').join('');
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return res.status(200).json(json);
  } catch (e) {
    return res.status(502).json({ error: 'AI unavailable' }); // page falls back to built-in examples
  }
}
