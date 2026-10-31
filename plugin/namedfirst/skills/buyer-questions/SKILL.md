---
name: buyer-questions
description: Generate the list of questions a buyer asks an AI engine before hiring a business like the user's, each graded yes, intel or brand. About 72 questions from three answers, up to 100 with more. Use when the user wants buyer questions, an AI-visibility question list, or the questions a NamedFirst baseline would measure. This skill generates questions and measures nothing.
---

# Buyer questions

Written by NamedFirst (AIGENT, LLC). The generator is the same file the free NamedFirst Baseline Kit uses.

This skill generates questions and measures nothing. It never asks an engine anything and never reports who gets named.

## What you need from the user

Required, all three:

- the business name
- the city or area it serves
- what the business does in a buyer's own words, as a plain noun phrase with no article, such as "emergency plumber" or "office furniture dealer"

Optional, each one sharpens the list:

- products or services, up to four
- competitors, up to three
- one differentiator, such as "family owned"

If a required answer is missing, ask for it before running anything.

## Run the script

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/questions.mjs" --biz "…" --city "…" --what "…" [--products "a, b"] [--comps "a, b"] [--diff "…"] [--json]
```

Quote every value. Commas separate products and competitors. The script needs Node.js 18.3 or newer, installs nothing and makes no network request. `--json` prints the questions as a JSON array, which suits saving the list to a file.

## Show the result

Show the questions grouped by category, as the script prints them, with each question's grade beside it and the count per grade. Leave every question as written. If the user wants to add, drop or reword some, do that in a separate step and say which ones changed.

## The three grades

- `yes`: counted. Somebody asking this question is going to hire or buy, and the business could truthfully be the answer.
- `intel`: a competitor's name is in the question. It is measured for what it shows about that competitor, and it is never counted or turned into work to fix.
- `brand`: the business's own name is in the question. An engine answers it with the business by construction, so it never enters a named rate. It shows whether an engine knows the business and which sites it reads to describe it.

## How many questions

Three required answers give about 72 questions: 69 counted and 3 by name. Products, competitors and a differentiator add more. The list reaches 100 only at four products and three competitors, which gives 88 counted, 9 intel and 3 brand. The cap is 100.

## Do not answer the questions yourself

Do not answer these questions yourself and grade the answer. A model answering from the session it runs in, once, signed in, with no search, is not a measurement of any engine. If the user asks whether the business would be named, say this skill cannot tell them, and say that a measurement asks each engine separately, with its own search, more than once.

## Where the list goes next

The [$149 NamedFirst baseline](https://namedfirst.commandmodule.com/#pricing) measures a list like this one: about 100 questions on seven engines, three passes, locked as a record. The buyer can review the list first, and it runs as written if NamedFirst hears nothing by the next business morning.
