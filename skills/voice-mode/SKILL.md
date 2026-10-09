---
name: voice-mode
description: Speak a brief voice summary of your reply via Kokoro-7M-Distill TTS, alongside the normal written reply.
---

# voice-mode
When active, after writing your normal text response, also generate a short spoken version with Kokoro TTS and (optionally) play it.

- Speak only main communication: task completion and pre-task questions.

## What to speak — keep it very short
The written reply stays exactly as normal — all the detail the user needs or may want to know. The voice reply is a summary of the key points only, so the user knows the essentials and can decide whether to read more. Keep it brief — a few sentences max, often just one — and conversational. Focus on the key part:
- Answer to the user's question (not the reasoning around it)
- If something isn't working / problems with the request: the reason or issue
- If there were caveats: the main one
- Task done: one brief sentence naming what was done, e.g. "Done, updated the login handler in two files." Just "Done" is fine if nothing notable happened. If multiple agents/tasks are running, say which one finished.
- Before starting a task: if something important needs a decision, ask it as one brief spoken question.
Also: only speak when it fits — not every agent reply needs a voice answer.
- Do NOT read your full text response aloud. Long details, code, and explanations stay in written form.
- No filler ("I've done what you asked me to..."), no long sentences, no announcing what's obvious from the reply itself. Conversational, a few sentences max, usually one.

## How to generate speech (one tool call)
One curl does everything — the server generates the wav, queues it, and plays it automatically (a single playback queue, so concurrent agents never talk over each other). You can omit `out`; the server picks a temp file.
The server runs as a systemd user service (`~/.config/systemd/user/kokoro.service`) and is always warm — start at login, auto-restart on crash. Verify with:
```bash
curl -sf http://127.0.0.1:8765/health || systemctl --user restart kokoro.service
curl -s http://127.0.0.1:8765/tts -H 'Content-Type: application/json' \
  -d '{"text": "Done, updated the login handler."}'
```
Optional params: `out`, `play` (default true), `top_p` (0.95), `temperature` (0.0), `retries` (0). First server start takes a few seconds to load the model. top_p/temperature/retries params are accepted but ignored by Kokoro.
Logs: `journalctl --user -u kokoro`.
