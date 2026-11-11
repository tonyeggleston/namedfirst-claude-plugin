---
name: read-your-baseline
description: Read a NamedFirst baseline report from inside Claude Code. For a NamedFirst customer who has a report link. Use when the user shares a namedfirst.commandmodule.com/reports link, asks what their baseline says, which questions the business was not named on, or which sources the engines listed. It reads the locked record and measures nothing.
---

# Read your baseline

Written by NamedFirst (AIGENT, LLC). This skill is for a NamedFirst customer who already has a baseline report. It reads that report through a read-only connection and measures nothing.

The report comes with the [$149 NamedFirst baseline](https://namedfirst.commandmodule.com/#pricing).

## What it connects to

The report lives at `https://namedfirst.commandmodule.com/reports/<slug>`. The slug is the last part of that address. The read-only endpoint for the same report is:

```
https://namedfirst.commandmodule.com/mcp/<slug>
```

Add it to Claude Code with this command, with the customer's own slug in place of `<slug>`:

```
claude mcp add --transport http namedfirst https://namedfirst.commandmodule.com/mcp/<slug>
```

Adding a connection changes the customer's own Claude Code configuration, so the customer runs that command in their own terminal and starts a new session so the tools appear. Do not run it for them and do not guess a slug. If the tools below are not available, give the customer the command and stop there.

Every answer is read from the same locked model file the report page is built from. The client computes nothing. The address carries the access: anyone who holds the link can read the report, the same as the report link today. Treat it as private.

## The tools

- `baseline_summary`: no arguments. The summary of the baseline, per engine, with the stability figure.
- `questions`: optional `category`, optional `named` (`any` or `none`). The question list, filtered by one question category and by whether the business was named. Read the tool's own description for how it counts across engines.
- `question_detail`: takes an `id`. One question in full, as the report holds it.
- `lost_questions`: no arguments. The questions the report counts as lost.
- `sources`: optional `engine`. The sources the engines listed, for one engine or for all.
- `names_given`: optional `engine`, optional `limit`. Every business each engine named, with how many answers named each. Older reports hold no list and say so.

Start with `baseline_summary`. Use the others to answer the follow-up the customer asks.

## How to report what it returns

- Give each engine on its own line with its own count of questions. Never average the engines into one number, and never ask a tool for one.
- Print the stability figure beside any rate. One run is noise, which is why the summary carries it. The same question can come back different on a different pass.
- When the summary marks a count as a floor or as not recorded, say so beside the number.
- Say once that an API answer with search stands in for the app a buyer uses and can differ from it.
- Quote only what the tools return. Do not add a prediction, a target or a promise about where the business will be named next.
- A question graded `brand` has the business's own name in it and is outside every named rate. A question graded `intel` names a competitor and is outside every count. Leave both out of any rate you state.

## When the customer wants to act on it

Point to the report's own plan for the order of work. For the questions in `lost_questions`, offer to draft a plain, countable fix for the customer to review: a page that answers the question in the buyer's own words, or a profile field filled in. Draft only from facts the customer gives you or their own site shows, and invent no number, credential or competitor claim. The customer reviews and publishes it.
