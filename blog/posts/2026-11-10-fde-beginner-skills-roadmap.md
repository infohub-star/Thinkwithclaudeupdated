---
title: Forward Deployed Engineer Skills: A Beginner's Roadmap
description: Learn the three core skills of a Forward Deployed Engineer: translating business problems, building production AI and proving it works, plus a 90-day plan.
date: 2026-11-10
slug: fde-beginner-skills-roadmap
keywords: forward deployed engineer, FDE skills, FDE roadmap for beginners, production AI, AI evaluation, discovery session, FDE interview
series: fde-essentials
part: 2
level: Basics
---
Most companies now have AI tools. Very few have AI running inside the work that actually matters, such as approving claims, answering customers or planning stock. Most projects stop at a demo that impressed people once and then went nowhere.

This is Part 2 of FDE Essentials for Coders. In Part 1, What a Forward Deployed Engineer Does, and How AI Got Here, we covered what the role is. Here we look at the skills behind it: how an FDE finds the real problem, builds something that survives real use, and proves it keeps working. We end with a 90-day plan you can start this week.

## In one minute

- The gap between "we tried AI" and "AI runs our process" is mostly a translation problem between business people and engineers. FDEs close it.
- The role has three tracks: translate the problem, build the solution, own it in production.
- A working demo is the starting line. Real data, real users and real failures come next.
- Healthy servers do not mean good answers. You need ongoing evaluation and regression tests to catch quality drops before the client does.

## Why the role exists: the production gap

"Production" means the AI is part of a core business process and its output is used for real decisions. A proof of concept (a small trial to show an idea can work) is not production.

Projects stall in between because engineers think about latency (response time) and model choice, while clients think about legacy databases, unhappy customers, regulations and cost. They talk past each other.

An FDE speaks both languages. A simple way to hold the idea: code without business context is a science project, and business context without code is just an idea. The FDE brings both.

### The four pillars

| Pillar | What it means in practice |
|---|---|
| Embed | Work inside the client's world and domain, not from a distant back office |
| Translate | Turn a complaint like "our inventory data is always a day behind" into a system design |
| Ship | Write real code: data pipelines, API integrations, business logic |
| Own | Run, check and fix the system after launch. No handing it "over the fence" |

One point beginners often miss: an FDE is a post-sales role. A solution architect helps win the deal with demos. The FDE makes the solution work after the contract is signed.

That mix of high client contact and high coding is rare, which is why demand spans finance, healthcare, retail, manufacturing and enterprise software.

## The three-track model

Think of the FDE as a bridge with three spans.

| Track | Nickname | Core question |
|---|---|---|
| A. Business-to-technical translation | The translator | What is the real problem, and is AI worth it here? |
| B. Production AI engineering | The builder | How do we build it well with today's AI tools? |
| C. Evaluation, reliability, deployment | The owner | How do we prove it works and keep it safe? |

Skip track A and you build something nobody needs. Skip track C and it breaks on day one. Consultants and product people usually start strong in A, engineers in B, and DevOps or QA people in C. Aim to be T-shaped: deep in one track, competent in the other two.

### A day in the life

Picture a logistics company buried in support tickets about shipping delays. The FDE starts with a discovery call: fewer tickets or faster replies? What data exists? What counts as success? Next comes design, including whether RAG is needed. RAG (retrieval-augmented generation) means the AI looks up the company's own documents before answering. Then testing: correct answers, no invented policies, sensible handling of off-topic questions. By evening there's an incident. The bot quotes a wrong policy because an outdated PDF was loaded. Replace it, refresh, redeploy, and send a short status update.

The lesson: building the wrong thing perfectly is still failure. And if you built it, you run it and fix it.

## Skill 1: Business translation

Start with the outcome, not the technology. A four-step way to break down a goal:

1. **Find the real outcome.** "Use AI" isn't one. "Cut claim processing time and repetitive manual work while keeping accuracy and human oversight" is.
2. **Map the current workflow.** For insurance claims: submit, verify documents, check the policy, decide, notify.
3. **Find the AI opportunity.** The repetitive document step: pull out key details, summarise, flag what's missing or unusual.
4. **Design the smallest valuable intervention.** AI prepares the summary and flags issues. A person still makes the decision. Measure, then expand.

In a discovery session, you're turning a technology request into a brief you can build. Listen for the business goal, the current workflow, the main pain point, where AI can truly help, and the success metric.

| Client says | FDE asks |
|---|---|
| "We need an AI agent" | Which task actually needs improving? |
| "Automate claims" | Which part is manual today? |
| "Make it faster" | How fast is it now? That number is your baseline. |
| "Use an LLM" | Where would AI add value? |

A cautionary case: an e-commerce team asked for fewer support tickets got a very accurate chatbot, yet ticket volume barely moved. Most tickets were "where is my order?" because customers weren't told about delays. Proactive delivery updates fixed the cause, not the symptom.

## Skill 2: Production AI engineering

A prototype uses small, clean data, a handful of users and manual testing. Production brings scanned PDFs, handwriting, missing fields, thousands of users, continuous testing and costs that grow with volume. The question changes from "can this work?" to "can this work reliably?"

Consider a claim extractor that handled clean samples well. In production, a scanned claim came through as poor text, the model guessed, weak validation let it pass, and wrong fields reached the claims system. No single part failed. The system did.

To harden a basic RAG setup, you add safeguards around the same idea:

1. Better ingestion: parse, clean, split into chunks, store.
2. Better retrieval: filter and rank so the right context comes back.
3. Context checks: did we find anything relevant at all?
4. Controlled generation: clear instructions and a fixed output format.
5. Retry and recovery: limited retries, a fallback path, human review for bad output.
6. Logging and monitoring: volume, success rate, errors, response time.

AI agents (systems that take several steps and use tools on their own) need the same care, plus checkpoints between steps so a wrong move leads to recovery or a safe stop.

## Skill 3: Evaluation and reliability

Imagine a dashboard showing near-perfect uptime and fast responses, with one line: "AI quality: not measured." A policy document changes, answers go out of date, and nothing alerts. The first warning is an angry client call. Monitoring tells you the system is running. Evaluation tells you whether it's doing its job.

A simple continuous loop:

1. Build a **golden test set**: representative questions with the expected behaviour decided in advance.
2. Run them through the app.
3. Score correctness, relevance, grounding (is the answer backed by the source?) and format.
4. Compare with the last baseline and alert on drops.
5. Find the cause, fix it, re-test and set a new baseline.

Use quick rule checks for objective things, such as "is the order ID present?" or "is it under 100 words?". Use **LLM-as-a-judge** (a second model scoring answers against a written rubric) for things like relevance and completeness.

**Regression testing** catches changes that quietly make things worse. Say someone edits the prompt to "make answers shorter". Spot checks look fine, but key policy details disappear. A full automated suite catches it and blocks the release. The mindset: don't ask how to make sure nothing goes wrong. Ask how you'll spot it before the user does.

## The FDE interview, briefly

Expect three stages: behavioural fit (can you be trusted with customers?), a technical deep dive (scale, cost, security, failures, proving quality), and a decomposition case where you clarify, break down, prioritise, evaluate and deploy, without jumping straight to "LLM plus RAG plus agents".

## Your 90-day plan

| Days | Phase | Focus |
|---|---|---|
| 1-30 | Strengthen | Pick your weakest track and set one measurable challenge |
| 31-60 | Build | Make something you can show; break down one vague problem each week |
| 61-90 | Apply | Tailor your CV and portfolio, apply for junior FDE roles, do mock interviews |

Give it 60-90 focused minutes a day. By day 90 you should be able to say what you built, why, how you evaluated it and what you learned.

## What this teaches about the FDE role

- Start from the business outcome and the current workflow, never from the tool.
- Look for the smallest change that moves the success metric, and keep a human in the loop at first.
- Production AI is a system: ingestion, validation, recovery, logging, monitoring and evaluation around the model.
- Technical accuracy is not business success. Measure the business result.
- Evaluate continuously, so you find problems before your client does.

## A prompt to plan your own discovery session

```
Role: You are a senior Forward Deployed Engineer coaching a beginner.
Ask: Help me prepare a discovery session. Give me (1) 8 questions covering
business goal, current workflow, pain point, AI opportunity and success
metric, (2) a simple map of today's workflow, and (3) the smallest AI
intervention worth trying first, with a human still making the decision.
Context: The client request is "[paste request]". The team is [team].
Today the work is done by [how it happens now]. Known data: [data sources].
Tone: Plain English, practical, no jargon without a one-line definition.
```

This works the same way in ChatGPT, Claude or Gemini.

## FAQs

**What are the core skills of a Forward Deployed Engineer?**
Three tracks: translating business problems into technical plans, building production AI systems, and evaluating and running them reliably after launch.

**Is an FDE a pre-sales role?**
No. Solution architects help win the deal. FDEs make the solution work in the client's real environment after the contract is signed.

**Why do AI demos fail in production?**
Real data is messier, there are far more users, and failures chain together. Production needs validation, recovery, monitoring and ongoing evaluation around the model.

## Try this today

1. Score yourself from 1 to 5 on each track: translate, build, own. Circle the lowest.
2. Take one vague AI request from your workplace and run it through the four-step breakdown above.
3. Write five test questions with expected answers for any AI tool your team already uses.

Next in FDE Essentials for Coders: Part 3, FDE-100 Class 1: Getting Paid in the AI Era.
