---
title: What a Forward Deployed Engineer Does, and How AI Got Here
description: New to FDE work? Learn what a Forward Deployed Engineer does, how to turn "build us a chatbot" into a real requirement, and how AI reached today's LLMs.
date: 2026-11-06
slug: fde-what-forward-deployed-engineer-does
keywords: forward deployed engineer, what is an FDE, FDE role, history of AI, how LLMs came about, transformers and attention, AI chatbot requirements
series: fde-essentials
part: 1
level: Basics
---
Your manager walks over and says, "We need an AI chatbot." It sounds like a task. It isn't one yet. It's a wish, and someone has to turn it into something that can be built, tested and trusted.

That someone is often a Forward Deployed Engineer (FDE). This is Part 1 of FDE Essentials for Coders, so we start from zero: what the role is, how an FDE thinks through a real request, and the short history of AI you need to understand why today's tools work the way they do.

## In one minute

- An FDE works inside the client's world, frames the problem, builds the solution and helps put it into real use.
- "Build us a chatbot" is a vague statement. The real requirement is a business outcome, such as faster answers without losing accuracy.
- Rule-based bots, classic machine learning and a plain large language model (LLM) each fall short on their own. An LLM given company context works.
- AI moved from if/else rules to machine learning, to neural networks, to transformers. Transformers plus powerful hardware made today's LLMs possible.

## What "Forward Deployed" actually means

Both words in the title are easy to misread.

**Deployed** does not mean pushing code to a server. It means the *engineer* is placed where the real problem lives: with the client, the department or the operations team. They watch how work actually happens and learn the constraints first-hand.

**Forward** is about how early they get involved. A regular developer usually picks up a well-defined ticket written by a product manager. An FDE goes a step earlier. They take a raw request, shape it into a clear requirement, pitch a solution, write the code and ship it to production.

So an FDE is part consultant, part engineer and part owner.

## A real example: 50,000 support queries a day

Picture an e-commerce company that gets around 50,000 customer support queries a day. Most are familiar: "Where is my order?", "I got the wrong product", "Can I return this after 15 days?"

A large team answers them today. That's expensive. Customers wait in queues. Simple questions bury urgent ones. And people can't work around the clock.

Management says, "We need an AI chatbot." An FDE doesn't start building. They ask what outcome the business wants. Here, it's this:

> Reduce the time it takes to resolve customer problems, without reducing accuracy or customer trust.

That sentence is the requirement. "Chatbot" was just one guess at a solution.

### Weighing the options like an FDE

With the outcome clear, the FDE compares approaches honestly:

| Option | How it works | Why it falls short |
|---|---|---|
| Rule-based bot | Matches keywords, e.g. "refund" shows the refund policy | People phrase things in endless ways ("Track my package", "Mera order kahan hai?"). You can never write enough rules. |
| ML classifier | Learns from labelled examples to sort queries into categories | It can label a query as "refund" but can't write a helpful reply. |
| General-purpose LLM | A model such as ChatGPT, Claude or Gemini writes natural replies | It doesn't know *your* policies. It may confidently say "30-day returns" when yours is 7 days. |
| LLM + company context | The LLM gets the question plus your policies, the order status and past conversation | Accurate, natural and grounded in company data |

The winning answer isn't "use the newest model". It's "give the model the right information".

## How AI got here: a short history

The history explains why each option fails the way it does. You need the intuition, not the dates.

### Can machines think?

Computers were built to compute. Clear input, exact instructions, the same output every time: 2 + 2 is always 4. Human intelligence is different. We read sarcasm and emotion, handle unfamiliar problems and decide with missing information.

Around 1950, Alan Turing turned "can machines think?" into a test. A judge chats by text with a hidden human and a hidden machine. If the judge can't tell which is which, the machine passes. The key idea is **mimicry**: a machine can imitate understanding without having it. Convincing is not the same as correct, which is why AI chatbots warn you they can make mistakes.

In 1955, John McCarthy and colleagues coined the term "Artificial Intelligence", and it became a field of its own.

### Stage 1: rule-based AI

The first approach was facts plus rules, written as if/else logic (a chain of "if this, then that" checks). For example: if the item arrived within 7 days, and it's damaged, and it's returnable, then approve the refund.

A 1960s program called ELIZA chatted convincingly using pattern rules like "I am feeling X" → "Why are you feeling X?" It felt human, but it was all rules. Rule-based systems break on **natural language processing (NLP)**, meaning getting computers to handle human language, because people never type in neat, predictable formats.

### Stage 2: machine learning

Machine learning (ML) flips the approach. Instead of writing rules, you show the system examples, the way a child learns what a dog looks like.

- **Supervised learning:** the training data is labelled ("dog", "cat"). The model adjusts its internal settings, called **parameters**, then predicts on new data with a confidence score.
- **Unsupervised learning:** the data has no labels. The model groups similar items into clusters.

The catch is **feature engineering**: humans have to tell the model what to pay attention to. That takes effort, lets human mistakes creep in and doesn't scale. A dog-versus-cat model can't recognise faces without retraining.

### Stage 3: neural networks and deep learning

Some patterns are too complex for people to spell out. Is a support ticket urgent? It might depend on the word "urgent", a failed payment, repeated attempts and a locked account, each mattering a different, unknown amount:

```
urgency = w1·x1 + w2·x2 + w3·x3 + w4·x4 + ...
```

Here each x is a signal and each w is a **weight**, how much that signal counts. A **neural network** learns those weights itself by training on huge numbers of past examples. Networks have input, hidden and output layers, loosely inspired by neurons in the brain. Learning with many layers is called **deep learning**.

Images were cracked first, using convolutional neural networks (CNNs), which power things like phone face recognition and photo tagging. Text was much harder.

## Why language is so hard

Language is messy in ways images aren't:

- **Many ways to say one thing:** "Where is my order?" means the same as "Track my package".
- **Word order matters:** "Dog chased the man" is not "Man chased the dog".
- **Negation and questions:** "I'm hungry", "I'm not hungry" and "Am I hungry?" are very different.
- **References:** in "Aditya put the laptop on the table because it was heavy", *it* is the laptop.
- **Sarcasm:** "Great job, my order hasn't arrived in 15 days!" is a complaint.

Earlier attempts struggled. **Statistical (n-gram) models** counted which word usually follows another, but broke when the wording changed, say "refund" versus "reimbursement". **RNNs** (recurrent neural networks) read text word by word, keeping a running summary, like summarising a book on sticky notes. Early details faded over long passages, and they were slow.

## The breakthrough: transformers

In 2017, a research paper called "Attention Is All You Need" introduced the **transformer**. Instead of reading word by word, it looks at the whole passage at once. It uses **attention** to work out which other words matter for understanding each word.

Take "Aditya gave Rohit the laptop because he needed it for work." To understand *he*, the model scores every other word for relevance: high for Aditya and Rohit, low for "gave". Nobody writes those rules. The network learns them from billions of sentences.

Transformers plus powerful GPUs (graphics chips that are very good at the maths involved) made large language models possible. ChatGPT launched in late 2022. GPT stands for **Generative** (it creates text), **Pre-trained** (on huge amounts of data), **Transformer**.

## What this teaches about the FDE role

1. **Start from the business outcome, not the requested tool.** "Chatbot" was a guess. "Faster resolution without losing trust" is the target.
2. **Compare options honestly.** Write down why each approach fails before choosing one.
3. **Context beats raw model power.** An LLM that doesn't know your policies can cause real losses.
4. **Know the intuition behind the technology.** You don't need the maths, but knowing why rules and old models broke helps you design better systems.

## A prompt to turn a vague request into a requirement

```
Role: You are an experienced Forward Deployed Engineer.
Ask: Turn this vague request into a clear business requirement. Give me
(1) 6 questions to ask the client, (2) a one-sentence requirement focused on
the business outcome, and (3) a short table comparing a rule-based approach,
an ML classifier, a plain LLM and an LLM with company context for this case.
Context: The request is "[paste the request]". The team is [team/department].
Today the work is done by [how it happens now].
Tone: Plain English for a beginner. Define any technical term in one line.
```

## FAQs

**What is a Forward Deployed Engineer?**
An FDE works directly with a client or team, understands the real workflow and constraints, designs and builds the solution, and helps put it into everyday use.

**How is an FDE different from a regular software developer?**
A regular developer usually builds from a well-defined ticket. An FDE also frames the problem: they turn a raw request into a requirement, pitch the solution and then build and ship it.

**Why isn't a general-purpose LLM enough for a company chatbot?**
It doesn't know your policies, orders or customers. Without that context it can give confident but wrong answers. Giving it company data is what makes it reliable.

## Try this today

1. Think of one "we need AI for this" request you've heard at work. Write the business outcome behind it in one sentence.
2. List how a rule-based bot, an ML classifier and a plain LLM would each fall short for that case.
3. Run the prompt above and compare its requirement with the one you wrote.

Next in FDE Essentials for Coders: Part 2, Complete FDE Training Course for Beginners.
