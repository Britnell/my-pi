#!/usr/bin/env python3
"""Tiny CDP client for the running chromium (--remote-debugging-port=9222)."""
import json, sys, urllib.request, uuid
import websocket

def targets():
        try:
            return json.load(urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=10))
        except Exception as e:
            raise SystemExit(f"cdp: cannot connect to 127.0.0.1:9222 ({e}) — is chromium running with --remote-debugging-port=9222?")

def get_tab(match=None):
    for t in targets():
        if t["type"] == "page" and (match is None or match in t["url"]):
            return t
    raise SystemExit("no matching tab")

class Tab:
    def __init__(self, t):
        self.ws = websocket.create_connection(
            t["webSocketDebuggerUrl"], timeout=60, suppress_origin=True)
        self.id = 0
    def send(self, method, **params):
        self.id += 1
        mid = self.id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg["result"]
    def eval(self, expr, await_promise=False):
        r = self.send("Runtime.evaluate", expression=expr,
                      awaitPromise=await_promise, returnByValue=True)
        if r.get("exceptionDetails"):
            raise RuntimeError(r["exceptionDetails"]["exception"]["description"])
        return r["result"]["value"]

if __name__ == "__main__":
    match = sys.argv[1] if len(sys.argv) > 1 else None
    tab = Tab(get_tab(match))
    print(tab.eval(sys.argv[2]))
