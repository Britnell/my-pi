#!/usr/bin/env python
"""Persistent Kokoro-7M-Distill TTS server with queued playback.

Loads model once. POST /tts {"text", "play": true} generates the wav and
enqueues it for playback — a single worker plays files one at a time, so
multiple agents can't speak simultaneously.
"""
import itertools
import json
import queue
import subprocess
import sys
import threading
import time
import wave
from http.server import BaseHTTPRequestHandler, HTTPServer

import numpy as np
import onnxruntime as ort
from misaki.en import G2P
from misaki.espeak import EspeakFallback
from kokoro_onnx.tokenizer import Tokenizer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
VOICES_DIR = "/home/tommy/code/agent/voice"

print("Loading Kokoro-7M-Distill...", flush=True)
t0 = time.time()
g2p = G2P(fallback=EspeakFallback(british=False))
tok = Tokenizer()
style = np.fromfile(f"{VOICES_DIR}/af_heart-7m.bin", dtype=np.float32).reshape(-1, 256)
sess = ort.InferenceSession(f"{VOICES_DIR}/kokoro-7m.onnx", providers=["CPUExecutionProvider"])
print(f"Model loaded {time.time()-t0:.1f}s", flush=True)

play_queue: "queue.Queue[str]" = queue.Queue()
counter = itertools.count()


def player_loop():
    while True:
        path = play_queue.get()
        try:
            subprocess.run(["pw-play", path], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"playback failed for {path}: {e}", flush=True)


threading.Thread(target=player_loop, daemon=True).start()


def tts(text, out):
    phonemes, _ = g2p(text)
    ids = [0] + [i for i in map(tok.vocab.get, list(phonemes)) if i is not None] + [0]
    tokens = np.array(ids, dtype=np.int64)[None, :]
    wav, _ = sess.run(None, {
        "input_ids": tokens,
        "style": style[min(len(ids) - 3, 509)][None, :],
        "speed": np.array([1.0], dtype=np.float32),
    })
    audio = np.clip(wav.flatten(), -1, 1)
    with wave.open(out, "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(24000)
        f.writeframes((audio * 32767).astype("int16").tobytes())


class Handler(BaseHTTPRequestHandler):
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {"ok": True})
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/tts":
            self._json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))
            out = data.get("out") or f"/tmp/voice-{next(counter)}.wav"
            tts(data["text"], out)
            if data.get("play", True):
                play_queue.put(out)
                self._json(200, {"ok": True, "out": out, "queued": play_queue.qsize()})
            else:
                self._json(200, {"ok": True, "out": out, "queued": None})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def log_message(self, *args):
        pass


HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
