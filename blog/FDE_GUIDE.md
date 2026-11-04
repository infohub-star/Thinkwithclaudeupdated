# Writing guide for FDE Essentials articles

On the site this section is called "FDE Essentials for Coders". It is separate from the daily
"Articles" list on /blog/ and has its own page at /fde-essentials/.

Used by the daily 10 AM IST FDE Essentials task. Also follow the brand rules in
blog/WRITING_GUIDE.md (author, tool-neutral, clients, never prices, never ConnectWithShantanu,
never Taj Hotels, no hype words).

## What the article is
A landing-page article that turns ONE source Google Doc (a technical FDE project or course)
into a clear, practical read. It is not a copy of the doc: rewrite fully in your own words,
reorganise around what the reader should understand and take away.

## Learning level
Match depth to the item's level. Basics: no assumed knowledge, more analogies, define everything.
Intermediate: assume the Basics parts; link back to them by name. Advanced: assume earlier parts,
go deeper on design trade-offs. Where useful, mention which earlier part covers a prerequisite.

## Audience
Coders and other professionals curious about Forward Deployed Engineering: aspiring FDEs, engineers moving into
client-facing AI work, consultants, product and delivery leads, and tech-aware managers in India.
Explain every technical term in one line the first time it appears.

## Accuracy
- Use only what the source doc supports. No invented stats, clients, quotes or results.
- Never name the original video creators, channels, courses or their promotions.
- Code: at most one short snippet (under 12 lines) only if it truly helps; prefer plain explanations.

## Structure
- 1,000-1,500 words. H2 sections (`##`), H3 where useful. No H1 in the body.
- Open with the client's problem or the core question in 2-3 sentences.
- A short "## In one minute" summary near the top (3-4 bullets).
- The middle follows the FDE journey in the doc (problem, design decisions and why, build, ship).
  Use at least one small table for a trade-off or comparison when the source has one.
- A "## What this teaches about the FDE role" section: the 3-5 transferable lessons.
- A copy-paste prompt in a code block, RACT style (Role, Ask, Context, Tone), that helps the reader
  apply the idea (e.g. plan a similar project, write a design doc, prepare discovery questions).
- "## FAQs" with 3 short Q&As (AEO).
- End with "## Try this today" (2-3 concrete steps) and one line pointing to the next part
  ("Next in FDE Essentials for Coders: Part N+1, <title>"), using the next part number in the learning order, not the next item that happens to remain in the queue.

## Front matter
```
---
title: <under 65 chars, includes the main keyword>
description: <140-155 chars, clear benefit>
date: <today YYYY-MM-DD IST>
slug: fde-<3-6 lowercase words>
keywords: <5-7, include "forward deployed engineer">
series: fde-essentials
part: <N from the queue>
level: <Basics | Intermediate | Advanced, from the queue>
---
```
