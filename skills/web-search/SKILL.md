---
name: web-search
description: Search the web or read web pages for information. Use for ANY web lookup — searching, finding docs, API facts, versions, error messages, or reading a URL. Never search or fetch the web yourself; always delegate to the researcher subagent.
---

# Web search

Delegate ALL web searches and web page reads to the **researcher** subagent, so your context stays clean while it reads. Pass it the question, any URLs to read, and what decision the answer feeds.

Its job:
1. Investigate against **primary sources** (official docs, source code, specs, first-party APIs), not secondary write-ups.
2. Return the answer directly, with source URLs cited.

For simple one-line lookups, run it in the foreground. For bigger research, launch it async and keep working.
