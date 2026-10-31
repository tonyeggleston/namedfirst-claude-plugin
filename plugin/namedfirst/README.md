# NamedFirst for Claude Code

Written by NamedFirst (AIGENT, LLC). Free, MIT licensed.

NamedFirst is a service for businesses that want to be named when ChatGPT, Claude, Gemini or Perplexity answer "who should I hire for this." This plugin carries three small pieces of that work into Claude Code: the buyer-question generator we ship, the honesty checklist we hold our own pages to, and a reader for a NamedFirst baseline report.

It is a distribution channel and a toolbox. **It measures nothing.** It never asks an engine a question and never reports whether any business is named. A measurement asks each engine separately, with its own search, more than once, and the [$149 NamedFirst baseline](https://namedfirst.commandmodule.com/#pricing) is where that happens.

## Install

Inside Claude Code:

```
/plugin marketplace add tonyeggleston/namedfirst-claude-plugin
/plugin install namedfirst@namedfirst
```

The question generator needs Node.js 18.3 or newer. It installs nothing and makes no network request.

## What is in it

- **buyer-questions** (also `/namedfirst:questions`): give it a business name, the city or area served and what the business does, and it prints the questions a buyer asks an engine before hiring a business like yours. Each question is graded `yes` (counted), `intel` (a competitor is named in it) or `brand` (your own name is in it). About 72 questions come from those three answers and 100 from four products and three competitors. It is the same generator file the free NamedFirst Baseline Kit uses.
- **honesty-check**: a plain-language checklist for reading an AI-visibility, SEO, GEO or AEO pitch, or your own copy, with a one-line reason under each item and eight questions to ask any seller. The sourced version is the [Before you buy guide](https://namedfirst.commandmodule.com/before-you-buy).
- **read-your-baseline**: for a NamedFirst customer with a report. It connects Claude Code to the read-only endpoint for that report (`https://namedfirst.commandmodule.com/mcp/<slug>`) so you can ask what the baseline says, which questions went unnamed and which sources the engines listed. Every answer comes from the locked record the report page is built from.

## What it does not do

It does not answer the buyer questions for you and grade the answer. A model answering from the session it runs in, once, signed in, with no search, is not a measurement of any engine. It does not produce one number for how visible a business is. It does not promise a rank or a date.

## Who wrote it

NamedFirst, a product of AIGENT, LLC, at [namedfirst.commandmodule.com](https://namedfirst.commandmodule.com). Questions to hello@commandmodule.com.
