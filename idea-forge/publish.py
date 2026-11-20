#!/usr/bin/env python3
"""Daily Idea Forge publisher, run by .github/workflows/daily-idea.yml.

Takes the first item under "## Up next" in idea-forge/queue.md, asks Claude
to write a full ib-item HTML block, injects it at the top of the
#idea-forge section in index.html, updates the JSON-LD schema, and moves
the item to "## Published".

Needs: ANTHROPIC_API_KEY env var; pip install anthropic
Exits 0 without changes when there is nothing to publish.
"""
import datetime, json, os, re, sys
import anthropic

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
QUEUE = os.path.join(ROOT, "idea-forge", "queue.md")
MODEL = os.environ.get("IDEA_MODEL", "claude-opus-5-5")
SITE  = "https://www.thinkwithclaude.com"

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
today = datetime.datetime.now(IST).date().isoformat()

BANNED = ["game-changer", "game changer", "revolutionize", "revolutionise",
          "unlock", "delve", "fast-paced world"]


def log(msg):
    print(msg, flush=True)


# ── 1. Take the first queue item ─────────────────────────────────────────────

queue_text = open(QUEUE, encoding="utf-8").read()
m = re.search(r"## Up next\s*\n(.*?)(?=\n## Published)", queue_text, re.S)
if not m or not m.group(1).strip():
    log("WARNING: the queue is empty. Add ideas to idea-forge/queue.md. Nothing published.")
    sys.exit(0)

section = m.group(1)
item_m = re.search(
    r"(^- Idea:.*?(?=^- Idea:|^### Idea:|\Z)|^### Idea:.*?(?=^- Idea:|^### Idea:|\Z))",
    section, re.S | re.M
)
if not item_m:
    log("WARNING: could not parse a queue item. Nothing published.")
    sys.exit(0)

raw_item = item_m.group(1).strip()
log(f"Queue item: {raw_item[:120]}")


# ── 2. Ask Claude to write the idea entry ─────────────────────────────────────

SYSTEM = """You write concise, honest, practical business idea entries for thinkwithclaude.com/The Idea Forge.
Each entry follows a strict HTML template. You never use banned words.
Return ONLY the JSON object — no markdown fences, no commentary."""

PROMPT = f"""Write a complete Idea Forge entry for this idea:

{raw_item}

Return a single JSON object with these exact keys:
{{
  "anchor_id": "kebab-case-id",
  "summary_question": "How can ...? (the <summary> line, phrased as a question)",
  "one_line_answer": "One clear sentence answer (the ib-answer paragraph).",
  "problem": "1–2 sentences: the core problem.",
  "who_faces_it": "1–2 sentences: who in India faces it and why it matters.",
  "the_idea": "1–2 sentences: what the business actually does.",
  "how_ai_helps": "1–2 sentences: specific AI use case.",
  "how_to_start": ["Step 1 sentence.", "Step 2 sentence.", "...up to 6 steps"],
  "costs_and_risks": "2–3 sentences: main costs, main risks.",
  "faq": [
    {{"q": "Question?", "a": "Answer sentence."}},
    {{"q": "Question?", "a": "Answer sentence."}}
  ],
  "check_it_yourself": "2–3 sentences: concrete verification steps the reader can do themselves."
}}

Rules:
- summary_question must start with "How can" or "Can" or "What" or similar
- Banned words (never use): {", ".join(BANNED)}
- Keep every field tight and plain — no fluff, no hype
- faq must have exactly 2 entries
- anchor_id must be unique, lowercase, hyphens only"""

client = anthropic.Anthropic()
log("Calling Claude...")
resp = client.messages.create(
    model=MODEL,
    max_tokens=1500,
    system=SYSTEM,
    messages=[{"role": "user", "content": PROMPT}]
)
raw_json = resp.content[0].text.strip()
# strip accidental fences
raw_json = re.sub(r"^```[a-z]*\n?", "", raw_json)
raw_json = re.sub(r"\n?```$", "", raw_json)

try:
    idea = json.loads(raw_json)
except json.JSONDecodeError as e:
    log(f"ERROR: Claude returned invalid JSON: {e}\n{raw_json[:400]}")
    sys.exit(1)

log(f"Anchor id: {idea['anchor_id']}")


# ── 3. Build the HTML block ───────────────────────────────────────────────────

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

steps_html = "\n".join(f"<li>{esc(s)}</li>" for s in idea["how_to_start"])
faq_html = ""
for faq in idea["faq"]:
    faq_html += f"\n      <h4>{esc(faq['q'])}</h4>\n      <p>{esc(faq['a'])}</p>"

block = f"""
  <details class="ib-item" id="{idea['anchor_id']}">
    <summary>{esc(idea['summary_question'])}</summary>
    <p class="ib-answer">{esc(idea['one_line_answer'])}</p>
    <details class="ib-more">
    <summary>See full details</summary>
    <h3>The problem</h3>
    <p>{esc(idea['problem'])}</p>
    <h3>Who faces it in India, and why it matters</h3>
    <p>{esc(idea['who_faces_it'])}</p>
    <h3>The idea</h3>
    <p>{esc(idea['the_idea'])}</p>
    <h3>How AI can help</h3>
    <p>{esc(idea['how_ai_helps'])}</p>
    <h3>How to start</h3>
    <ol>{steps_html}</ol>
    <h3>Costs and risks</h3>
    <p>{esc(idea['costs_and_risks'])}</p>
    <h3>Common questions</h3>{faq_html}
      <h3>Check it yourself</h3>
    <p>{esc(idea['check_it_yourself'])}</p>
    </details>
  </details>
"""


# ── 4. Inject into index.html ─────────────────────────────────────────────────

html = open(INDEX, encoding="utf-8").read()

MARKER = "    <!-- NEWEST FIRST -->"
if MARKER not in html:
    log("ERROR: could not find insertion marker in index.html.")
    sys.exit(1)

html = html.replace(MARKER, MARKER + block, 1)
log("Injected idea block into index.html.")


# ── 5. Update JSON-LD ─────────────────────────────────────────────────────────

# Find the existing ItemList and prepend a new ListItem at position 1,
# shifting all existing positions by 1.

def bump_positions(match):
    items_text = match.group(0)
    # increment all "position": N
    def inc(m2):
        return f'"position": {int(m2.group(1)) + 1}'
    return re.sub(r'"position":\s*(\d+)', inc, items_text)

# bump existing positions inside itemListElement
html = re.sub(
    r'("itemListElement":\s*\[)(.*?)(\])',
    lambda m: m.group(1) + bump_positions(m) + m.group(3),
    html, count=1, flags=re.S
)

new_list_item = f"""        {{
          "@type": "ListItem",
          "position": 1,
          "name": "{idea['summary_question']}",
          "url": "{SITE}/#{idea['anchor_id']}"
        }},"""

html = re.sub(
    r'("itemListElement":\s*\[)',
    r'\1\n' + new_list_item,
    html, count=1
)

# Add two FAQ entries (main Q + first faq sub-Q)
new_faq_entries = f"""        {{
          "@type": "Question",
          "name": "{idea['summary_question']}",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "{idea['one_line_answer']}"
          }}
        }},
        {{
          "@type": "Question",
          "name": "{idea['faq'][0]['q']} ({idea['summary_question'].rstrip('?')})",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "{idea['faq'][0]['a']}"
          }}
        }},
        {{
          "@type": "Question",
          "name": "{idea['faq'][1]['q']} ({idea['summary_question'].rstrip('?')})",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "{idea['faq'][1]['a']}"
          }}
        }},"""

html = re.sub(
    r'("mainEntity":\s*\[)',
    r'\1\n' + new_faq_entries,
    html, count=1
)

open(INDEX, "w", encoding="utf-8").write(html)
log("Updated JSON-LD schema.")


# ── 6. Update queue.md ────────────────────────────────────────────────────────

published_line = f"- {today}: {idea['summary_question']} (#{idea['anchor_id']})\n"

# Remove the item from Up next
queue_text = queue_text.replace(raw_item, "", 1)

# Insert into Published
queue_text = re.sub(
    r"(## Published\s*\n)",
    r"\1" + published_line,
    queue_text
)

open(QUEUE, "w", encoding="utf-8").write(queue_text)
log(f"Queue updated. Published: {idea['summary_question']}")

# Output for the workflow commit message
print(f"::set-output name=title::{idea['summary_question']}")
