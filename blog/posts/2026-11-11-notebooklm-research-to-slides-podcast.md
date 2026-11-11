---
title: Turn Research into Slides and a Podcast with NotebookLM
description: A simple NotebookLM (now Gemini Notebook) workflow to turn reports and notes into a slide deck and an audio overview you can check, edit and share.
date: 2026-11-11
slug: notebooklm-research-to-slides-podcast
keywords: NotebookLM slides, NotebookLM podcast, Gemini Notebook, audio overview, turn research into slides, repurpose reports with AI, NotebookLM workflow India
---
You finished a 40-page market report last month. Your team skimmed the summary, your manager asked for "a few slides", and the sales team wants something they can listen to on the way to a client. So the same research now needs three formats, and you have one evening.

Google's NotebookLM is built for this. You give it your own documents, and it builds a slide deck and an audio overview that sounds like a short podcast, grounded in those sources. Here is a simple workflow to go from one report to slides and audio, and to check the output before anyone else sees it.

## First, a quick name change

In July 2026 Google renamed NotebookLM to **Gemini Notebook**. It is the same product with the same notebooks, and the old address now redirects to the new one. Most people still search for "NotebookLM", so this article uses both names.

Features and limits change often and differ between the free plan and paid Google AI plans. What follows is the picture as of November 2026, so check what your own account shows.

## Why NotebookLM is good for repurposing

ChatGPT, Claude and Gemini can all summarise a document you upload, and they do it well. NotebookLM is different in one useful way: it is built around a fixed set of sources. You create a notebook, add your files, and everything it produces is based on those files, with citations you can click to see where a point came from.

That makes it a good fit when the content already exists and you just need it in a new shape.

You can add PDFs, Google Docs and Slides, Word and PowerPoint files, website links, YouTube videos with captions, pasted text and audio files. For a typical work project, that covers your report, your meeting notes and a couple of reference articles.

## The workflow: one report, three outputs

Let's take a real-feeling example. Priya runs L&D at a mid-sized company in Bengaluru. She has a 30-page internal survey report on how employees use AI at work, plus her own notes from five team interviews. She needs a deck for the leadership meeting and a short audio briefing for managers.

### Step 1: Build a clean notebook

Create a new notebook and add only the sources that matter. Priya adds the survey report and her interview notes. She leaves out old drafts and unrelated articles.

This matters more than any prompt. Five versions of the same report give muddled output. One topic, final versions, nothing extra.

Before you generate anything, ask a few questions in the chat to test that it has understood the material:

```
Role: You are a research analyst reviewing my sources.
Ask: List the 5 most important findings in these sources, with the page or section each comes from.
Context: This is an internal survey on how our employees use AI at work. The audience is our leadership team.
Tone: Plain and factual. No opinions beyond what the sources say.
```

If the five findings match what you expected, move on. If something important is missing, you have learned it before building a deck around it.

### Step 2: Generate the slide deck

Open the **Studio** panel and choose **Slide Deck**. You can pick a format, the length, the output language and which sources to use, and you can describe what you want.

There are two formats. A **detailed deck** is meant to be read on its own, so it carries more text. **Presenter slides** are lighter and assume you will talk over them. For a leadership meeting where you are presenting, presenter slides are usually the better choice. For a deck you will email, pick the detailed one.

The description box is where most people under-invest. Here is what Priya writes:

```
Role: You are a presentation designer for a corporate leadership team.
Ask: Create a 10-slide deck on our employee AI usage survey. Open with the 3 key findings, then cover adoption by department, the main concerns employees raised, and 3 recommendations.
Context: The audience is our CXOs. They have 15 minutes and want decisions, not detail. Use only the survey report and the interview notes.
Tone: Clear, confident and brief. One idea per slide.
```

When the deck is ready, read every slide against the source. Click the citations where a number appears. If a slide is wrong or weak, use the revise option to give instructions slide by slide and generate a revised version. You can also delete and reorder slides.

### Step 3: Know the export limits

You can download the deck as a PDF or as a PowerPoint file. One catch: at the time of writing, each slide in the PowerPoint file is an image, so you cannot edit the text directly. Direct export to Google Slides is not available yet.

So treat the deck as a strong first draft. Copy its structure into your company template, or share the PDF if it is good enough.

### Step 4: Create the audio overview

Back in Studio, choose **Audio Overview**. This creates a conversation between AI hosts discussing your sources. It is the "podcast" people talk about.

You can usually choose a format and a length:

- **Deep Dive**: a longer two-host discussion. Good for managers who want the full picture on a commute.
- **Brief**: a short single-voice summary. Good as a two-minute update.
- **Critique**: feedback on your material. Useful before you present, not for sharing.
- **Debate**: two sides argue the issue. Good for a topic where leadership must choose between options.

You can also tell it what to focus on:

```
Role: You are hosting a short internal briefing for people managers.
Ask: Focus on what managers should do differently in the next 3 months based on this survey. Skip the methodology.
Context: Listeners are team leads across sales, operations and support. Many are new to AI tools.
Tone: Practical and encouraging. Explain any technical term in one line.
```

Audio overviews are available in more than 80 languages. If your team prefers a regional language, check whether yours is listed, then listen to the full output before sharing, because quality can vary.

Priya shares a Brief with managers and keeps a Deep Dive for herself to spot gaps before the meeting.

## Check before you share

NotebookLM stays close to your sources, but it is not perfect. It can drop an important caveat, merge two separate findings, or present a small sample as a firm trend. Before anything leaves your laptop, do these three checks:

1. **Numbers**: every figure on a slide or in the audio should match the source. Click the citation.
2. **Emphasis**: does the output stress what you would stress? AI often gives equal weight to minor and major points.
3. **Confidentiality**: if you share a notebook or an audio link, think about who can open it. Don't upload documents your company does not allow in external tools. Check your IT policy first, especially for HR, client or patient data.

## Other outputs worth knowing

The same notebook can produce more than slides and audio. **Video overviews** turn your sources into a narrated video. **Mind maps** show how the ideas connect. **Reports** such as a briefing doc or study guide can be exported to Google Docs. **Infographics**, **flashcards** and **quizzes** are useful for training.

## When to use something else

For fresh research or brainstorming, ChatGPT, Claude or Gemini in a normal chat may serve you better. For a fully editable, on-brand deck, you will still finish in PowerPoint or Google Slides. Use NotebookLM to get the structure and story right fast, then polish in your template.

## FAQs

**Is NotebookLM free?**
Yes, there is a free version with usage limits. Paid Google AI plans raise the limits, allow more sources per notebook and add some extra features. Check the current plan details on your account.

**Can I edit the slides NotebookLM makes?**
You can ask it to revise slides, delete them and reorder them. At the time of writing, the PowerPoint export saves each slide as an image, so you cannot edit the text directly in PowerPoint.

**Is the audio overview accurate?**
It is based only on your sources, which keeps it close to the material, but it can still miss caveats or blur details. Listen to the full audio and check it against the source before sharing.

## Try this today

1. Pick one report or set of notes you already have, and add it to a new notebook with no other sources.
2. Ask the chat for the five key findings with citations, then generate a 10-slide presenter deck using the RACT prompt above.
3. Create a Brief audio overview, listen to all of it, and share it with one colleague for feedback before a wider release.
