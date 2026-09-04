#!/usr/bin/env python3
"""
Oxyderm Tunnel Watcher

Cloudflare Quick Tunnels (`cloudflared tunnel --url ...`) get a NEW random
subdomain every time the process restarts. This script tails the tunnel's
log for that URL and pushes it to the live HostGator backend so the
dashboard (running anywhere, not just this Mac) can look up the current
address instead of relying on a hardcoded localhost URL.

Runs on a short interval via cron. Idempotent — safe to run repeatedly.
"""
import re
import json
import urllib.request

LOG_PATH = "/Users/genesis/Desktop/Oxyderm-Build/data/cloudflared-tunnel.log"
API_URL = "http://api.oxydermlaserclinic.ca/api.php"
API_KEY = "REDACTED_SET_VIA_SECRETS_ENV"

TUNNEL_URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")


def get_current_tunnel_url():
    """Reads the LAST tunnel URL announced in the log (most recent tunnel
    session — a restart produces a new URL further down in the file)."""
    try:
        with open(LOG_PATH) as f:
            content = f.read()
    except FileNotFoundError:
        return None
    matches = TUNNEL_URL_RE.findall(content)
    return matches[-1] if matches else None


def post_url(url):
    payload = json.dumps({"action": "engine_url_set", "url": url}).encode()
    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Content-Type": "application/json", "X-API-Key": API_KEY,
                 "User-Agent": "curl/8.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[ERROR] Failed to post tunnel URL: {e}")
        return None


def main():
    url = get_current_tunnel_url()
    if not url:
        print("[WARN] No tunnel URL found in log yet — tunnel may still be starting.")
        return
    resp = post_url(url)
    if resp and resp.get("ok"):
        print(f"[OK] Backend now points to: {url}")
    else:
        print(f"[ERROR] Backend update failed for: {url}")


if __name__ == "__main__":
    main()
