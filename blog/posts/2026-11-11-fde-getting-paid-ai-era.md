---
title: How Forward Deployed Engineers Get Paid in the AI Era
description: Why AI projects stall while developers struggle for work, and how a Forward Deployed Engineer earns by closing that gap with a platform and a vertical.
date: 2026-11-11
slug: fde-getting-paid-ai-era
keywords: forward deployed engineer, FDE career, deployment gap, vertical AI agent, system of record, vendor-neutral FDE, AI consulting career
series: fde-essentials
part: 3
level: Basics
---
Two things are happening at once. Many developers are finding it harder to get hired, and yet most company AI projects still fail to deliver business value. If AI is this capable, why are both sides stuck, and where does a Forward Deployed Engineer earn a living in between?

This is Part 3 of FDE Essentials for Coders. Part 1, What a Forward Deployed Engineer Does, and How AI Got Here, explained the role. Part 2, Forward Deployed Engineer Skills: A Beginner's Roadmap, covered the skills. This part is about the money side: why the demand exists, who pays for FDE work, and what an independent engineer needs to compete.

## In one minute

- The "deployment gap" is the space between capable AI and businesses that cannot turn it into results. FDEs are paid to close it.
- The FDE model only makes sense when the product is technical, the customer is less technical, and the FDE brings a platform to build on.
- AI vendors use FDEs partly for lock-in. Consultancies respond by building industry-specific agents.
- To compete on your own you need a platform, a chosen industry (a "vertical"), and skills that run from the business problem all the way to proving value.

## The deployment gap

Look at the two trends side by side.

| Trend | Why it is happening |
|---|---|
| Developers struggle to find jobs | Coding agents (AI tools that write, test and ship code) and strong language models now do much of the hand-coding work developers did for decades. The job is changing. |
| Most company AI projects fail | The source cites a widely quoted MIT study putting this at about 95%. The models work. The problem is that nobody connects the technology to the business. |

The **deployment gap** is the distance between "the AI works" and "the AI is making us money". It is not a technology problem. It is a translation and delivery problem, and that is exactly the work an FDE does.

## Where the FDE idea came from

The model was popularised by Palantir in the mid-2000s. Its products were very technical and its customers often were not, so the company embedded engineers directly with clients. "Forward deployed" is a military phrase: working out in the field, not back at base.

The idea is older than the title. Solutions engineers, field engineers and sales engineers did similar work. What is new is that large tech companies and AI labs are now adopting the model openly.

### The two conditions that make it work

An FDE is worth paying for only when two things are true:

1. **The product is technical and the customer is less technical.** An expert customer can do the work themselves.
2. **The FDE brings a platform.** A platform is software you can build other software on, like a database. An email app is not a platform, because you cannot build products on top of it. Think of the platform as the FDE's toolkit suitcase. Without one, every project starts from zero, which is too slow and too costly.

The FDE then works with the client's own staff, who know their business best. The work can be on-site, remote or a mix.

### What AI changed

Older software was deterministic: same input, same output. AI is **non-deterministic**, meaning the same question asked three times can return three different answers. So an FDE today manages prompts, rules, safety guardrails (limits that stop the AI from doing harmful or off-topic things) and the client's data. They often build something new for each client instead of just switching on existing features.

## Who pays, and why

Picture an AI company sending an FDE to a car manufacturer that is excellent at cars but new to AI.

- **The customer gets** a skilled engineer working next to its team, and an AI project that actually succeeds.
- **The vendor gets** lock-in. Once solutions are built on its platform, the customer keeps paying for years, even if the FDE time itself was discounted.

That is why AI vendors like the model. It is a sales and retention strategy as much as a service.

## The layers of an AI solution

To see where an independent FDE can fit, it helps to separate the layers.

| Layer | What it is | Examples |
|---|---|---|
| LLM (the brain) | The language model itself | Claude, GPT, Gemini and open models |
| Harness, or general agent | Everything around the model that makes it useful: tool use, memory, guardrails, reasoning loops | ChatGPT, Claude.ai, Claude Code, Codex, agent toolkits |
| Vertical agent or platform | A domain-specific solution built on a harness, for one industry or function | Tax, accounting or sales agents |

Large consultancies are building at the third layer. Their pitch goes roughly like this: "Our agent already handles 80 to 90 percent of your tax work. Our FDE customises the rest in days." The client gets speed and a tailored result. The consultancy gets a subscription, and improvements from one client can flow back into the main product.

## The challenge for freelancers and small teams

If you walk in with the same vendor platform everyone else uses, the client will usually prefer that vendor's own FDE. To compete, the source points to two things.

1. **Your own platform or ecosystem.** The goal is to become a **vendor-neutral vertical FDE**: a specialist in one domain who is not tied to a single AI company, and who can swap models and harnesses, including open-source ones, depending on the job.
2. **Full-stack delivery.** Not just code. You identify the business problem, build and deploy with the people who will use it, and prove the value afterwards.

Beyond that, a working FDE also needs domain knowledge, governance (policies, SOPs and decisions from a steering committee), change management so people actually adopt the system, and awareness of the risk and compliance rules in that sector.

## Grounding AI in a "content system of record"

A **system of record** is the single trusted source for some kind of data, like an ERP for orders or a general ledger for accounts. The source extends the idea to knowledge.

If you simply ask an AI "teach me X", you hit four problems: the answers change each time, there is no clear start or end, there is no record of what you covered, and there is no teaching method. A **content system of record** is a curated, authoritative body of knowledge that both people and AI agents use, so answers stay grounded and consistent.

An easy analogy: a class preparing for an exam from one agreed study guide does better than thirty students asking a chatbot thirty different questions.

Many AI assistants can now connect to such sources through **MCP** (Model Context Protocol, an open standard for linking AI tools to outside data and services). In Claude.ai, for example, you add a custom connector with the provider's server address and sign-in details, authorise it, and then ask the assistant to answer from that source rather than from general memory. ChatGPT and Gemini offer their own ways to connect external data, so check what your tool supports.

## How to actually start earning

The source lays out two paths:

- **The easier path:** use existing tools and agents to deliver projects for clients. Steadier income, lower risk.
- **The harder path:** pick a vertical such as sales, accounting, supply chain, pharma or restaurants, and build a product on it. Bigger upside, more effort.

The advice is to start on the easy path and move up. Remote FDEs can also compete on cost against expensive on-site hires, as long as the quality matches.

## What this teaches about the FDE role

- Demand comes from the gap between AI capability and business results, not from the technology alone.
- An FDE without a platform is just a slow, expensive builder.
- Know whose interests are at stake: vendors want lock-in, clients want results, and you need both to trust you.
- Specialising in one industry is how individuals stand out against big firms.
- Governance, adoption and proving value are part of the job, not extras.

## A prompt to plan your FDE niche

```
Role: You are a career coach for engineers moving into Forward Deployed
Engineering work.
Ask: Help me choose one vertical to specialise in. Compare 3 industries I
could serve, and for each give: common business problems AI could solve,
the data and systems clients usually have, governance or compliance rules
to know, and one small first project I could deliver using existing tools.
Context: My background is [your skills and experience]. Industries I know
something about: [list]. I can work [remote / on-site / hybrid] from [city].
Tone: Practical and honest. Plain English. Flag where I would need to learn
more before pitching.
```

This works in ChatGPT, Claude or Gemini.

## FAQs

**Why do companies hire Forward Deployed Engineers?**
Because their AI projects stall between a working model and real business value. An FDE embeds with the team and builds a solution that actually gets used.

**Can a freelancer compete with big AI vendors as an FDE?**
Yes, by bringing a vendor-neutral platform, specialising in one industry, and owning delivery from problem definition to proven value.

**What is a vertical AI agent?**
An AI solution built for one industry or function, such as tax or sales, on top of a general agent. It handles most of the work out of the box and is customised for each client.

## Try this today

1. List three industries you already understand. Circle the one where you know the daily problems best.
2. Write down the platform or toolkit you would bring to a first client, even if it is just a set of tools you trust.
3. Run the prompt above and pick one small project you could offer within a month.

Next in FDE Essentials for Coders: Part 4, FDE Course 2: How LLMs Actually Work.
