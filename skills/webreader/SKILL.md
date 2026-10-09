---
name: webreader
description: FIRST CHOICE for reading any web page or fetching documentation. Use this before any other method (e.g. tavily-extract or bash curl) — only fall back to those if this skill fails. Fetches the URL with curl and converts the HTML to clean Markdown.
---

# webreader

Fetches a URL as clean Markdown. Default for reading any web page.

## Usage

```bash
<skill-dir>/scripts/curlmd <url> [html2text options...]
```

stdout is pure Markdown; debug stats go to stderr.
