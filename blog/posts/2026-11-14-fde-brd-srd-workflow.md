---
title: The FDE Workflow: From BRD and SRD to an AI-Built Solution
description: Learn the 11-step FDE workflow, from requirements, BRD and SRD to diagrams, prototypes and AI-built code, plus what an FDE owns when AI writes it.
date: 2026-11-14
slug: fde-brd-srd-workflow
keywords: FDE workflow, forward deployed engineer, BRD vs SRD, business requirements document, software requirements document, AI-built solutions, requirements gathering
series: fde-essentials
part: 6
level: Intermediate
---
A training institute in Pune has a simple complaint. Every week its staff answer the same calls, WhatsApp messages and emails: "When does the next AI batch start?" The website never shows upcoming batches, so people keep asking.

Any AI coding assistant could produce a "batches" page in minutes. So what is left for a forward deployed engineer (FDE) to do? This is Part 6 of FDE Essentials for Coders and the first Intermediate part. It walks through the full FDE workflow, from the first customer conversation to a live, monitored solution, and shows where the real work sits. It assumes you have read the Basics parts, especially Part 1, What a Forward Deployed Engineer Does, and Part 2, Forward Deployed Engineer Skills: A Beginner's Roadmap.

## In one minute

- The FDE workflow has 11 steps: requirements, BRD, SRD, diagrams, prototype, tech stack, build, test, deploy, monitor and improve.
- A **BRD** says what the business needs. An **SRD** says what the software must do to meet that need.
- Get customer sign-off at each stage before moving to the next one.
- AI writes most of the code. The FDE owns understanding the customer, integrating safely and keeping quality high after launch.

## The 11-step FDE workflow

Here is the full sequence. Think of it like building a house: you agree on what the family needs, draw plans, show a model, pick materials, and only then start construction. After move-in, you still fix leaks.

1. **Requirements gathering**: talk to the customer and understand the problem.
2. **Business Requirements Document (BRD)**: write down what the business needs. A Product Requirements Document (PRD) can also fill this slot.
3. **Software Requirements Document (SRD)**: translate the business need into software terms.
4. **UML diagrams**: draw use-case diagrams, flows and other pictures of the system. UML (Unified Modeling Language) is a standard set of diagram types for software.
5. **UI design or prototype**: show the customer what it will look like and get approval.
6. **Tech stack decision**: choose the languages, frameworks, database and cloud.
7. **Build**: use prompt engineering and AI tools to generate the solution.
8. **Test**: check it works, often with AI-written test scripts.
9. **Deploy**: ship it through CI/CD (continuous integration and delivery, an automated pipeline that tests and releases code) to a cloud such as AWS, Azure or GCP.
10. **Monitor**: watch the application's health in production.
11. **Feedback and improvement**: collect customer feedback and iterate.

Notice that steps 1 to 6 happen before any code. That is deliberate.

## Walking through the batch-page example

### Step 1: Requirements gathering

The FDE meets the institute and pins down three things:

- **Problem**: the website hides upcoming batches, so staff field repeated queries.
- **Solution**: a page listing upcoming courses with dates and details.
- **Target users**: students, working professionals, freshers and the institute's training coordinators.

This step needs clear, simple communication, not technical depth. Your job is to hear the real problem, not to propose a framework.

### Step 2: The BRD

A BRD usually has six parts:

1. Project objective
2. Business requirements
3. Detailed information to show (course name, start date, duration, timing, trainer)
4. Visible output (what the user actually sees)
5. Target users
6. Expected outcome (fewer repeat queries, easier sign-ups)

### Step 3: The SRD

The SRD answers "what software do we need?" It lists the technology stack, functional requirements (what the system does), expected output, any registration form, and non-functional requirements (how well it does it: speed, security, uptime). In most companies, architects guide these choices; the FDE drafts and coordinates.

| | BRD | SRD |
|---|---|---|
| Question it answers | What does the business need? | What must the software do? |
| Main reader | Customer and business stakeholders | Architects and engineers |
| Typical content | Objective, users, data to show, expected outcome | Stack, functional and non-functional requirements, forms, outputs |
| Who shapes it | FDE with the customer | FDE with company architects |

### Step 4: Flows and diagrams

Two diagrams do most of the work here:

- **System flow**: how the components (website, backend, database) talk to each other.
- **User flow**: a student opens the website → sees new batches → selects a course → views details → registers.

The FDE shares these with the customer and collects feedback before going further. A wrong arrow on a diagram costs minutes to fix. The same mistake in code costs days.

### Step 5: Prototype and tech stack

Next comes a UI design for approval. Once the customer says yes, the stack is confirmed: for example, a React frontend, a REST API backend (a standard way for the page to request data from the server), a MongoDB database and a chosen cloud. Stack choices usually follow company standards and management input. The FDE recommends; they rarely decide alone.

### Step 6: Build with AI

Now the documents pay off. Everything from steps 1 to 5 is combined into one detailed build prompt. This prompt can run to hundreds of lines, and it is often drafted with an LLM itself. You paste it into an AI coding assistant inside your code editor, let it generate the project, then ask it to run the app and open the local URL so you can check it.

The quality of what comes out depends almost entirely on how clear the BRD, SRD and diagrams were. Vague documents produce vague software.

### Step 7: Test, deploy, monitor, improve

- **Test**: AI-generated Playwright scripts (Playwright is a tool that clicks through a website automatically, like a robot user).
- **Deploy**: Git, Jenkins, Docker, Kubernetes and cloud virtual machines such as EC2, wired together through CI/CD.
- **Monitor**: health checks, logs and dashboards, for example with Grafana or a log analytics service.
- **Improve**: gather feedback from the institute and its students, then iterate.

One practical note: in real projects, BRDs, SRDs and designs are not pictures in a slide deck. Generate them as Markdown (.md) files with AI tools, so they can be versioned, searched and fed straight into the build prompt.

## "If AI writes the code, what does an FDE do?"

Generating code is the easy part. The hard parts are the ones AI cannot do on its own:

- Understanding the customer's **existing, often messy** system.
- Gathering and documenting the right requirements.
- Integrating the new piece **without disturbing the existing architecture**.
- Testing, deploying, monitoring and improving with the customer over time.

Picture this: Company X built a retailer's website. Company Y is hired to add a chatbot. Y's FDE must first learn how X's system works, then add the bot without breaking anything. No prompt can skip that discovery.

Agents also show up on the operations side. An agent (an AI that can take actions using tools, not just answer questions) can watch a production system, spot an issue, call the right tools to fix it and restart services. That automates routine incident response, but someone still has to design, permission and supervise it.

## Skills this workflow asks for

| Area | Expected depth |
|---|---|
| Communication and requirements | Strong |
| Python (with libraries like NumPy and Pandas) | Solid basics; it underpins most AI work |
| Frontend, backend, databases, cloud, DevOps | Awareness: know what each piece is and how it fits |
| Prompt engineering | Strong; it is how you direct AI to build |
| Agents, testing, deployment | Practical familiarity |

Interviews tend to test breadth and problem-solving. Can you document requirements? Can you diagnose an issue in any layer? Deep expertise in one framework matters less. Part 2 covers how to build this breadth step by step.

## What this teaches about the FDE role

1. **Documents are the product before the product.** The BRD, SRD and diagrams become the prompt that builds the software.
2. **Sign-off at every stage saves rework.** Change is cheap on paper and expensive in code.
3. **The FDE recommends, the organisation decides.** Stack and architecture follow company standards and architects.
4. **Integration is the real skill.** Fitting into someone else's messy system is where FDEs earn their place.
5. **Launch is the middle, not the end.** Monitoring and feedback are part of the job.

## A prompt to draft your BRD and SRD

Use this with ChatGPT, Claude or Gemini to turn a client problem into first drafts.

```
Role: You are a senior forward deployed engineer who writes clear requirement documents.

Ask: From the client notes below, draft (1) a BRD with six sections: project objective,
business requirements, detailed information to show, visible output, target users and
expected outcome; and (2) an SRD with tech stack options, functional requirements,
non-functional requirements, forms and expected output. Then list a user flow as arrows
and 5 open questions I must confirm with the client before building.

Context: [Paste the client's problem, users, current system and any constraints.]

Tone: Plain, precise English. Use Markdown headings. Mark every assumption clearly.
```

## FAQs

**What is the difference between a BRD and an SRD?**
A BRD describes what the business needs and why, in business language. An SRD turns that into software terms: the stack, functional and non-functional requirements, and outputs engineers will build.

**Do forward deployed engineers still need to code if AI writes it?**
They need enough coding knowledge to direct AI, review its output and integrate it safely. Python basics and awareness across frontend, backend, databases and cloud are the usual bar.

**Why get customer approval before building?**
Each approval (BRD, diagrams, prototype) catches misunderstandings while they are cheap to fix. Skipping sign-off means rebuilding later.

## Try this today

1. Pick a small, real problem at work, like a page or report people keep asking about, and write its six-part BRD in a Markdown file.
2. Run the prompt above on your notes and compare the AI's SRD and user flow with what you would have written.
3. Note the five open questions it raises and decide which you would ask the customer first.

Next in FDE Essentials for Coders: Part 7, Sales AI Ep. 2: Requirements, Data and Architecture.
