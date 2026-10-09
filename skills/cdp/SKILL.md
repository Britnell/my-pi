---
name: cdp
description: |
  Control or inspect a running Chromium/Chrome browser via the Chrome DevTools
  Protocol (CDP) on --remote-debugging-port=9222. Use when the user wants to
  evaluate JS in a tab, read console/page state of a dev browser, interact with
  the browser the user is testing in, or mentions CDP. Requires the browser to
  be running with remote debugging enabled.
---

# cdp

Evaluate JavaScript in a tab of the user's running Chromium (port 9222) and
print the result. Good for inspecting live page state, DOM, or app internals
while the user tests in their browser.

## Usage

```bash
python3 <skill-dir>/scripts/cdp.py [url-substring] 'js expression'
```

- `url-substring` optional; picks the first tab whose URL contains it
  (otherwise first page tab).
- Expression result is printed as JSON (`returnByValue`).
- Needs `websocket-client` (`python3 -c "import websocket"`), already present
  on this machine.

## Examples

```bash
# current URL and title of first tab
python3 <skill-dir>/scripts/cdp.py '' 'JSON.stringify({url: location.href, title: document.title})'

# read state from the localhost dev tab
python3 <skill-dir>/scripts/cdp.py localhost 'document.querySelector("#root")?.outerHTML?.slice(0,500)'
```

## Notes

- If no tab matches or connection fails, ensure Chromium runs with
  `--remote-debugging-port=9222`.
- If it's not running, ask the user to start it, e.g.:
  `chromium --remote-debugging-port=9222` (optionally with a separate
  `--user-data-dir=/tmp/chromium-debug` to avoid profile lock).
- List tabs: `curl http://127.0.0.1:9222/json`.
- Read-only by default; prefer evaluating expressions that don't mutate page
  state unless the user asks.
