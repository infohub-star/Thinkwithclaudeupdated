---
title: How an FDE Builds a Cold-Chain Logistics AI Assistant
description: Follow a Forward Deployed Engineer from a vague client ask to a secure AI assistant for logistics data, SOPs and weather, built and shipped to production.
date: 2026-11-04
slug: fde-cold-chain-logistics-ai-assistant
keywords: forward deployed engineer, FDE project, logistics AI assistant, text-to-SQL agent, RAG for SOPs, AI agent security
series: fde-essentials
part: 17
level: Advanced
---
A logistics client walks in and says one sentence: "We want to talk to our data." That's the whole brief. No spec, no API, just a username and password to an old database full of truck telemetry.

This is where a Forward Deployed Engineer (FDE) earns their title. An FDE sits with the client, turns a vague wish into a working system and stays until it runs safely in production. This capstone part of FDE Essentials for Coders walks through one complete project: a cold-chain logistics AI assistant, from the first conversation to deployment.

## In one minute

- The client has truck sensor data in a legacy SQL database and rules in an SOP document. They want answers in plain language.
- The FDE chooses an AI agent with three tools: one writes database queries, one searches the SOPs, one checks the weather.
- Safety is enforced in the database itself, through a read-only user, not by asking the AI nicely.
- Most of the work happens before coding: solution design, a technical design document and a business pitch.

## The starting point: dashboards nobody enjoys

The client moves perishable goods. GPS units, truck sensors and route data feed into a SQL Server database. People see that data through static BI dashboards.

The pain points are familiar to anyone who has worked in operations. Queries are manual. Dashboards don't change unless someone rebuilds them. Outside data such as weather isn't included. The company's standard operating procedures (SOPs) live in separate documents. And there's no record of who asked what.

The FDE's first job is to weigh the options honestly:

| Option | Strengths | Weaknesses |
|---|---|---|
| Better dashboard | Accurate, backed by clean queries | Steep learning curve: filters, charts and SOPs to learn first |
| AI chatbot (agent) | Ask in plain language, fewer steps, can combine data and SOPs | Needs careful engineering to stay accurate and safe |

The chatbot wins here because the real problem isn't missing charts. It's that a dispatcher handling a temperature alert has to check three places before acting.

## Brainstorm first, code later

Before touching code, the FDE sorts the client's information into two types.

**Structured data** is the telemetry: rows and columns with timestamps, locations, cargo temperature, delay risk and more. You can't paste tens of thousands of rows into an AI prompt, so the system needs to query the database.

**Unstructured data** is the SOP document, written in sentences. For example: cargo must stay between 0 and 4 °C; above that is a breach; call the driver to start backup cooling; if the delay is over an hour, divert to emergency cold storage. For text like this, the right tool is RAG (retrieval-augmented generation): the system finds the relevant passage and gives it to the AI to answer from.

The FDE also lists the questions people will ask: by location, by temperature, about the weather, combinations of these, and questions about the SOPs themselves. In a real project, you get this list from the client instead of guessing.

### Two ways to let AI read a database

| | Fixed tools (one per question type) | Text-to-SQL (the AI writes the query) |
|---|---|---|
| Flexibility | Limited: each new question needs a new tool | Wide: update the schema description instead |
| Risk | Predictable | A bad query returns nothing |
| Speed to prototype | Slower | Faster |

The project chooses text-to-SQL. The risk of a bad query is handled by a self-correcting agent: when a query fails, the agent reads the error and tries again with a simpler one.

## Safety lives in the database, not the prompt

This is the most transferable lesson in the project. You could tell the AI "never delete anything". But prompts can be ignored or tricked.

Instead, the FDE creates a dedicated database user that can only read a specific view (a filtered window onto the data). Even if someone types "delete the database", the credentials the agent uses physically can't do it. A quick test proves the point: reading through the view works, and reading the raw table returns "permission denied".

## Write it down before you build it

Next comes a technical design document, split into a high-level design (HLD, the big picture) and a low-level design (LLD, the details). It lets the team and any technical client staff review the plan before money is spent.

The design has three separate layers:

- **Presentation:** a simple web chat interface that only displays things.
- **Orchestration:** the AI agent that understands the question, picks tools and writes the answer.
- **Data:** the database (behind the read-only view), the SOP search index and a public weather service.

A typical flow: someone asks "Is shipment X on track?" The agent queries its location and temperature, checks the weather there, looks up the temperature rule in the SOP and combines all three into one answer with sources.

Two design rules stand out. If the weather service fails, the agent says so instead of inventing conditions. And every step the agent takes is written to an audit log inside the client's own database, so no data leaves their environment.

## Pitch it in business language

Business stakeholders don't need to hear about servers. The pitch deck stays simple: the problem (complex dashboards plus scattered SOPs), the bottleneck (a temperature drift takes several lookups before anyone acts), the solution shown with real or mock screenshots, and a governance slide covering the read-only access and audit log.

## The build, in plain terms

- **SOP search:** documents are cut into small overlapping pieces ("chunks"), with a different cutting method for Markdown, text, PDFs and spreadsheets. When a file changes, only that file's pieces are refreshed, and answers cite their source. If nothing matches, the agent says it can't find it.
- **Three tools:** query the telemetry database, search the SOPs, get the local weather.
- **The agent:** a loop where the AI reasons, calls a tool, reads the result and either calls another tool or answers. It remembers each chat session separately.
- **The interface:** a chat screen plus a restricted screen showing the audit logs.
- **Deployment:** the app and the database run on separate cloud servers. The database accepts traffic only from the app server. Every code push to the main branch deploys automatically.

## What this teaches about the FDE role

1. **A vague ask is the job, not a problem.** "Talk to our data" becomes a concrete design through questions.
2. **Pick the method to match the data.** Use queries for tables, RAG for documents and often both in one system.
3. **Enforce safety with permissions.** Least-privilege access beats prompt instructions.
4. **Design and pitch before you build.** The design document and the business deck are part of the work.
5. **Keep the client in control.** Audit logs stay in their environment, and the database stays hidden from the internet.

## A prompt to plan your own FDE project

```
Role: You are a senior Forward Deployed Engineer.
Ask: Help me turn a client's request into a solution plan. Give me (1) 8 discovery
questions to ask, (2) which of their data is structured vs. unstructured and how the
AI should reach each, (3) the main risks and how to control them in the system rather
than the prompt, and (4) a one-page outline for the technical design document.
Context: The client is a [industry] company. Their request: "[paste the request]".
Their data lives in [systems]. Users are [roles].
Tone: Clear and practical. Plain English, define technical terms briefly.
```

## FAQs

**What does a Forward Deployed Engineer do?**
An FDE works directly with a client to understand their problem, design an AI solution, build it and get it running safely in production. The role mixes consulting, engineering and ownership.

**When should an AI assistant use text-to-SQL instead of RAG?**
Use text-to-SQL for structured data in tables, where answers come from filtering and counting rows. Use RAG for written documents. Many real projects, like this one, need both.

**How do you stop an AI agent from changing a database?**
Give the agent its own database user with read-only access to a limited view. The database then blocks any change, whatever the AI is asked to do.

## Try this today

1. Pick one process at your work where people check two or three systems before acting. Write down the questions they ask.
2. Sort the information they use into structured (tables) and unstructured (documents).
3. Run the prompt above on that process and compare the plan with how the work happens today.

New to FDE work? Start with Part 1 of FDE Essentials for Coders, which explains what a Forward Deployed Engineer does, then work through the parts in order.
