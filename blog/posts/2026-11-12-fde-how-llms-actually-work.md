---
title: How LLMs Work: Tokens, Attention and Temperature for FDEs
description: Learn how LLMs work, from tokens and embeddings to attention and temperature, in plain English, so you can explain and tune AI for clients as an FDE.
date: 2026-11-12
slug: fde-how-llms-actually-work
keywords: how LLMs work, forward deployed engineer, tokens and embeddings, self-attention explained, transformer model, LLM temperature, next token prediction
series: fde-essentials
part: 4
level: Basics
---
A client asks you a simple question: "Why did the chatbot give two different answers to the same question?" If you are a Forward Deployed Engineer, you need a clear answer, and that means knowing how LLMs work under the hood. Not the maths, just the moving parts.

This is Part 4 of FDE Essentials for Coders. Part 1, What a Forward Deployed Engineer Does, and How AI Got Here, ended with the arrival of today's LLMs. This part opens the box. No prior knowledge is assumed.

## In one minute

- An LLM (large language model) is, at heart, a next-token predictor. It guesses the next small chunk of text, adds it, and repeats.
- Text is first turned into numbers (tokens and token IDs), then into embeddings, which are lists of numbers that capture meaning.
- Attention lets each word take its meaning from the words around it. Transformer layers stack attention many times.
- Sampling and temperature decide how predictable or creative the answer is, which explains why answers vary.

## The next-word game

Try finishing this: "I drink coffee every..." Morning, evening and day all fit. Now add context: "I work remotely as a software engineer and I drink coffee before going to..." Most people now say "my desk".

More context narrows the likely next word. An LLM does the same: given "The capital of India is", it predicts "Delhi", adds it, and keeps going until it decides to stop.

For an FDE, this is the first practical lesson: good prompts and good grounding data work because they narrow the prediction.

## Step 1: Tokenization turns text into numbers

Neural networks (the software at the core of an LLM) only work with numbers. So a separate program called a **tokenizer**, not part of the model itself, converts your prompt in two steps:

1. **Split** the text into **tokens**, which are chunks of characters, often including the space before a word.
2. **Map** each token to a **token ID**, a number that works like a roll number. A bigger ID does not mean anything "more". The same token always gets the same ID.

### Why not one token per word, or per letter?

| Approach | Upside | Problem |
|---|---|---|
| One token per word | Simple | The vocabulary explodes: automatic, automate, automation, automatically... |
| One token per character | Tiny vocabulary | Every sentence becomes very long to process |
| Sub-word chunks (what models use) | Reuses pieces like "auto" | Rare words and many non-English names split into several tokens |

Newer models usually have richer vocabularies, so they need fewer tokens for the same text. And "1 token equals 4 characters" is only a rough estimate: every model has its own tokenizer. This matters for client budgets, because **token counts drive cost**.

### Order and context still matter

"Dog bites man" and "Man bites dog" use the same tokens, so the model also needs positions. And "bank" has one ID whether it means money or a river, so meaning must come from context.

## Step 2: Embeddings turn tokens into meaning

An **embedding** is a list of numbers that places a word in a "meaning space".

Imagine scoring words on four made-up dimensions: royalty, food, living and technology, each from 0 to 1. "King" would score high on royalty and living. "Banana" would score high on food. "Laptop" would score high on technology. King and Queen would sit close together; Banana would be far away.

Real LLMs learn thousands of unlabelled dimensions on their own during training. Humans cannot fully read them, but they let the model compare meanings.

When you build RAG systems later in this series (retrieval-augmented generation, where the AI looks up documents before answering), embeddings are how relevant text is found.

## Step 3: Attention lets words borrow meaning

Take this sentence: "Rohit gave Aditya his laptop because his laptop was broken." The first "his" means Rohit. The second means Aditya. A word alone means little; its meaning comes from the words around it.

**Attention** is the step where, for each token, the model asks: which other tokens matter for me, and how much? It does not pick just one. It blends them, for example giving the second "his" a large weight on Aditya, a smaller one on Rohit, and tiny weights on the rest.

### Query, Key and Value

Attention uses three vectors (lists of numbers) for each token. Think of a web search:

| Vector | Search analogy | Role for each token |
|---|---|---|
| Query (Q) | What you type in the search box | "What information am I looking for?" |
| Key (K) | The index of each page | "What kind of information do I offer?" |
| Value (V) | The content of the page | "Here is what I can actually contribute." |

For the word "on" in "The cat sat on the mat", the model compares the Query of "on" with the Key of every other word. "Mat" scores high, "cat" medium, "the" low. Those scores become weights, and the new, context-aware version of "on" is a weighted mix of everyone's Values. This repeats for every token. Three vectors exist because each token plays three roles at once: asking, offering and contributing.

## Step 4: Transformers stack attention

A **transformer layer** is a block that performs this self-attention. Models stack many of them, finding simple links in early layers and complex references later, like editing a photo in stages.

By the final layer, the last token of your prompt carries the context of the whole sentence. At this point nothing has been written yet. The model has only understood the input.

## Step 5: Picking the next token

Now the model generates:

1. It takes the final vector of the last token.
2. It compares that vector with every token in its vocabulary, which can run to around 100,000 tokens. Each comparison gives a raw score called a **logit**.
3. A function called **softmax** turns those scores into probabilities that add up to 100%. For example, Delhi 90%, Kolkata 5%, and so on.
4. It chooses one token, adds it to the text, and runs the whole process again.

The weights behind those probabilities are learned from huge amounts of data, and even the builders cannot fully explain how specific numbers arise.

## Why answers vary: sampling and temperature

This is the answer to your client's question.

| Method | How it picks | Effect |
|---|---|---|
| Greedy | Always takes the most likely token | Same input, same output |
| Sampling | Like a lottery: a 50% token gets 50 tickets, a 40% token gets 40 | Varied, more natural replies |

**Temperature** adjusts the scores before softmax:

- **Temperature 1:** no change.
- **Below 1 (say 0.5):** the top choice dominates. Output is more consistent and less creative.
- **Above 1 (say 2):** more options become likely. Output is more varied and creative.

Because sampling can occasionally pick an unlikely, possibly inappropriate token, production systems add **guardrails**, which are checks that stop such outputs from reaching users.

## What this teaches about the FDE role

- **Context is your main lever.** Better prompts and grounded data narrow predictions, which is why you invest in both.
- **Tokens are a budget line.** Cost depends on the model's tokenizer, so estimate with the real tool, not the 4-character rule.
- **Tune temperature to the task.** Low for policy answers, reports and data extraction; higher for brainstorming and copy.
- **Explain variation honestly.** Clients trust you more when you can say why answers differ and what you have done to control it.
- **Plan guardrails from day one.** Sampling makes rare bad outputs possible, so safety checks are part of the design.

## A prompt to explain LLMs to a client

```
Role: You are a Forward Deployed Engineer preparing for a client meeting.
Ask: Write a 5-minute plain-English explanation of how our AI assistant
produces answers, covering tokens, context, why answers can vary, and how
temperature and guardrails are set for this use case. End with 3 questions
the client should answer so we can choose the right settings.
Context: The client is [industry, e.g. a Pune hospital's admin team]. The
assistant will be used for [task, e.g. answering staff policy questions].
They are worried about [concern, e.g. inconsistent answers and cost].
Tone: Calm, non-technical, no jargon without a one-line explanation.
```

This works in ChatGPT, Claude or Gemini.

## FAQs

**How do LLMs work in simple terms?**
They predict the next token from all the text before it, add that token, and repeat. Tokenization, embeddings and attention help the model understand context before each prediction.

**What is the difference between a token and an embedding?**
A token is a chunk of text with an ID number. An embedding is a longer list of numbers that represents what that token means in context.

**What does temperature do in an LLM?**
It controls randomness. Low temperature gives consistent, predictable answers. High temperature gives more varied and creative ones.

## Try this today

1. Open a tokenizer tool and paste a sentence with an Indian name or a long technical word. Count how many tokens it becomes.
2. Ask your favourite AI assistant the same factual question three times and note any differences. Then ask it a creative question three times and compare.
3. Run the prompt above for a real or imagined client and save the explanation for your next discovery call.

Next in FDE Essentials for Coders: Part 5, FDE Course 6: ChatGPT-Style Streaming.
