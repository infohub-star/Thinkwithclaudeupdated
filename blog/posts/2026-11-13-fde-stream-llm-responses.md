---
title: How to Stream LLM Responses Like ChatGPT: An FDE Guide
description: Learn how to stream LLM responses word by word, from SSE vs WebSockets to backend buffers and browser rendering, so your AI app feels fast to users.
date: 2026-11-13
slug: fde-stream-llm-responses
keywords: stream LLM responses, forward deployed engineer, server-sent events, SSE vs WebSockets, time to first token, ChatGPT-style streaming, AI chatbot frontend
series: fde-essentials
part: 5
level: Basics
---
A client demos their new AI chatbot to the leadership team. Someone types a question, and the screen just sits there for eight seconds with a "typing…" dot. Then a wall of text drops in at once. The feedback is instant: "It feels slow. Why is ChatGPT faster?"

ChatGPT usually isn't faster at thinking. It simply shows you the answer as it is being written. This is Part 5 of FDE Essentials for Coders, and it explains how to stream LLM responses the same way, end to end. No prior knowledge is assumed, though Part 4, How LLMs Work: Tokens, Attention and Temperature, will help if you want to know where tokens come from.

## In one minute

- An LLM always **generates** its answer one token at a time. Whether you **deliver** it piece by piece or all at once is a separate choice you make.
- Streaming cuts the wait before users see something (time to first token). It does not make the full answer finish any sooner.
- For chat, use **SSE (Server-Sent Events)** over plain HTTP. WebSockets work but are more than you need.
- Both hops must stream: AI provider to your backend, and your backend to the browser. Buffer the chunks so you can still save complete chat history.

## Generation vs. delivery

Think of a chef plating a thali. The dishes are cooked one by one either way. The question is whether the waiter brings each katori to your table as it is ready, or waits until the whole plate is done.

An LLM (large language model, the AI behind tools like ChatGPT, Claude and Gemini) works the same way. It produces a **token** (a small chunk of text, often a word or part of one) at a time: "The capital of India is" → "New" → "Delhi" → ".". That is generation, and it never changes.

Delivery is up to you:

- **Non-streamed** is the default for most API calls (an API is how your code talks to the AI provider). The provider waits until the full answer is ready, say eight seconds, and sends it as one block.
- **Streamed** means the provider forwards pieces as soon as they exist. This is why ChatGPT's own app feels quick.

The usual path looks like this: **browser (or a test tool like Postman) → your backend → AI provider → LLM**. The provider sits in the middle handling login keys, usage limits and request checks.

## Two numbers that explain "slow"

When a client says the bot is slow, find out which of these two they mean.

| Metric | What it means | Does streaming change it? |
|---|---|---|
| Time to First Token (TTFT) | How long until the first piece appears. Usually the longest single wait, because the model first has to read and process your whole input. | Yes, in effect. Users start reading after TTFT instead of after the full answer. |
| Total generation time | How long the entire answer takes to produce | No. It is the same either way. |

So streaming improves **perceived** speed, not real speed. That is worth saying plainly to a client, so nobody expects a cheaper or faster model as a side effect.

### How does the model know when to stop?

Three things end an answer:

1. **Your instructions**, such as "answer in about 1,000 words".
2. **End-of-sequence markers** the model saw in training, which teach it how human writing naturally finishes.
3. **Hard limits**, such as a maximum token setting or a full context window (the most text the model can handle in one go).

### Chunks, not tokens

You might expect to receive one token per message. In practice, providers send **chunks**: whatever tokens were ready in a small time window. One chunk might hold one token, the next might hold four. Your app should not depend on chunk size. All that matters is that the user stops staring at a blank screen.

## SSE vs. WebSockets: pick the lighter tool

There are two common ways to push data from a server to a browser.

| | SSE (Server-Sent Events) | WebSockets |
|---|---|---|
| Direction | Client sends one request; server replies with many small events over one open connection | Two-way: either side can send at any time |
| Protocol | Plain HTTP | Starts as HTTP, then switches to its own protocol |
| Weight | Lightweight | Heavier setup |
| Fit for LLM chat | Good: the user always speaks first, the server only replies | Works, but unnecessary |

Chat is a request followed by a reply, so SSE is the natural fit. According to the source material, virtually all major model APIs use SSE for streaming.

### The trap: there are two streams

This is where many first attempts fail. There are two hops:

1. **AI provider → your backend**
2. **Your backend → the browser**

If your backend collects the whole stream into one string and only then replies, the user still waits the full time. Both hops have to stream.

## Building it: backend first

Start from a normal chat endpoint, for example `POST /api/chat`, that sends a system prompt (standing instructions for the model) plus the user's message and returns the reply as text.

To stream, you change one idea: instead of asking the AI library for "the full content", you ask it for "a stream of content". The catch is that a stream is not a normal string, so the return type of your service and your controller (the code that answers web requests) must change too.

| Language | Stream type you return |
|---|---|
| Java (Spring / Reactor) | `Flux<String>` |
| JavaScript / Node | `ReadableStream` |
| Python | Async iterator (`async for`) |

Test it in Postman with a long prompt, such as "Write a 1,000-word essay, one sentence per line". If streaming works, you will see the reply arrive bit by bit.

### Keeping chat history

Streaming creates a new problem. Chat history (the record of earlier messages you send back to the model so it remembers the conversation) expects complete assistant replies. But you now only have pieces.

The fix is a **buffer**: a running text holder. Append each chunk to it as it passes through to the user, and when the stream finishes, save the full text into history. The user gets speed, and your memory stays whole.

## Then the frontend

In a typical chat page, the line that kills streaming is `await response.text()`. It waits for the entire reply before doing anything. Instead, read the response with a stream reader:

```javascript
const reader = res.body.getReader();
const decoder = new TextDecoder();          // bytes to text
while (true) {
  const { value, done } = await reader.read();
  if (done) break;                          // last chunk received
  bubble.textContent += decoder.decode(value, { stream: true });
  scrollToBottom();
}
```

A few details make it feel polished:

- Data arrives as raw bytes, so decode it into text first.
- Hide the "typing…" indicator the moment the first chunk lands.
- Append every chunk into the **same** message bubble. A new bubble per chunk looks broken.
- Auto-scroll as the text grows.

## What this teaches about the FDE role

1. **Separate real speed from felt speed.** Many "it's slow" complaints are about TTFT, and the fix is delivery, not a new model.
2. **Choose the simplest tool that fits.** SSE beats WebSockets here because the conversation pattern is one-way after each question.
3. **Trace the whole path.** A feature can work at the provider and still fail in your backend or browser. Check every hop.
4. **Protect the data while improving the experience.** The buffer shows you can add streaming without breaking chat history.
5. **Concepts travel across stacks.** The example used Java, but you will often land in a client's unfamiliar language. Stream types, buffering and chunked rendering exist everywhere.

## A prompt to plan streaming for a client

```text
Role: You are a senior Forward Deployed Engineer reviewing an AI chat app.
Ask: Create a step-by-step plan to add ChatGPT-style streaming. Cover the
provider-to-backend hop, the backend-to-browser hop, how to keep complete
chat history, and frontend changes. List what to test at each step.
Context: Backend is [language/framework, e.g. Python FastAPI]. Frontend is
[e.g. plain JavaScript]. Users complain the bot "feels slow" and replies
take about [X] seconds to appear. Chat history is stored in [where].
Tone: Practical and clear. Explain any technical term in one line.
```

This works in ChatGPT, Claude or Gemini.

## FAQs

**Does streaming make an LLM answer faster?**
No. Total generation time stays the same. Streaming shows the first words sooner, so the app feels much faster to users.

**Should I use SSE or WebSockets for an AI chatbot?**
SSE in most cases. Chat is one request followed by one reply, and SSE handles that over plain HTTP with less setup. WebSockets suit true two-way traffic.

**Why does my chatbot still wait for the full answer after I enabled streaming?**
Usually one hop is not streaming. Either the backend gathers the whole reply before sending it, or the frontend uses `response.text()` instead of a stream reader.

## Try this today

1. Open any AI chat tool you use and time how long it takes for the first word to appear, then for the full answer. That gap is what streaming hides.
2. Find the chat code in a project you have access to and search for `response.text()` or a "get full content" call. Mark where each hop would need to change.
3. Run the prompt above for that project and save the plan as your checklist.

Next in FDE Essentials for Coders: Part 6, The FDE Workflow: BRD, SRD, Design and AI-Built Solutions.
