#!/usr/bin/env python3
"""
Oxyderm AI Brain — Hermes Polling Script
Runs every 60s via Hermes cron (no_agent=False so Hermes LLM answers).
Fetches pending questions from HostGator, answers via hermes CLI, writes back.
"""

import os
import sys
import json
import subprocess
import urllib.request
import datetime

API_URL = "http://api.oxydermlaserclinic.ca/api.php"
API_KEY = "REDACTED_SET_VIA_SECRETS_ENV"

# Fallback source when Hermes is rate-limited/unreachable: Devang's own Claude Pro
# subscription via the Claude Code CLI in headless/print mode. Separate OAuth session
# and quota from Hermes, so it survives Hermes being down.
CLAUDE_CLI = "/Users/genesis/.local/bin/claude"

SYSTEM_PROMPT = """You are the AI Decision Brain for Oxyderm Laser Clinic in Edmonton, Canada. You have complete knowledge of the clinic: LHR and microneedling services only, Hetisha as owner/staff and clinic face, brand navy #00172D gold #c9a96e, phone 780-221-9872, website oxydermlaserclinic.ca, shop shop.oxydermlaserclinic.ca, Square bookings, Instagram/TikTok/Facebook/GBP/YouTube social channels, Meta ads via PLAI, GoHighLevel CRM, HostGator hosting, Make.com automation. Target: women 22-45 Edmonton. LHR membership $199.99/month, gross margin 62-67%, target CAC under $40.

Answer the question directly and specifically. Be the decision-maker. Identify which agent owns this task. No em-dashes. No emojis. No fluff."""

AGENT_CONTEXT = {
    "scheduler": "You are answering for the Scheduling Agent. Focus on: appointments, posting schedule, booking windows, daily ops, Square calendar.",
    "editor": "You are answering for the Video Editor Agent. Focus on: scripts, thumbnails, TOFU/MOFU/BOFU cuts, avatar video production, Synthesia/HeyGen.",
    "social": "You are answering for the Social Media Agent. Focus on: captions, hooks, hashtags, platform strategy for Instagram/TikTok/Facebook/GBP.",
    "finance": "You are answering for the Finance Agent. Focus on: revenue, margins, CAC, LTV, Square payments, membership pricing.",
    "client": "You are answering for the Client Care Agent. Focus on: intake, post-treatment follow-up, rebooking, review generation, retention.",
    "marketing": "You are answering for the Marketing Agent. Focus on: funnels, Meta ads, PLAI optimization, offers, retargeting.",
    "research": "You are answering for the Research Agent. Focus on: Edmonton market, competitors, keywords, content gaps.",
    "general": "You are answering as the general AI decision-maker. Handle anything not covered by a specific agent."
}


def api_call(action, data=None):
    payload = json.dumps({"action": action, **(data or {})}).encode()
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
            "User-Agent": "curl/8.0",  # HostGator WAF returns 406 on Python's default urllib UA
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[ERROR] API call failed ({action}): {e}", file=sys.stderr)
        return None


def build_prompt(agent, question, context=None):
    agent_ctx = AGENT_CONTEXT.get(agent, AGENT_CONTEXT["general"])
    prompt = f"{SYSTEM_PROMPT}\n\n{agent_ctx}\n\nQuestion: {question}"
    if context:
        prompt += f"\n\nContext: {json.dumps(context)}"
    return prompt


def ask_claude_pro(prompt):
    """Fallback: Devang's own Claude Pro subscription via the Claude Code CLI, headless
    mode. Strips ANTHROPIC_API_KEY/ANTHROPIC_BASE_URL from the subprocess env -- if either
    leaks in from the cron environment it silently redirects the CLI off the OAuth Pro
    session and back onto a 401 (this exact failure mode is what broke the CLI before it
    was fixed 2026-09-03; a `/logout` + `/login` was needed once, this just prevents a
    recurrence). Returns None on any failure so the caller falls through to the offline
    message instead of raising.
    """
    env = {k: v for k, v in os.environ.items() if k not in ("ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL")}
    try:
        result = subprocess.run(
            [CLAUDE_CLI, "-p", prompt, "--output-format", "json"],
            capture_output=True, text=True, timeout=120, env=env
        )
        if result.returncode != 0 or not result.stdout.strip():
            return None
        data = json.loads(result.stdout)
        if data.get("is_error") or not data.get("result"):
            return None
        return data["result"].strip()
    except Exception:
        return None


def ask_hermes(agent, question, context=None):
    """Answer via Hermes CLI (primary); falls back to Devang's Claude Pro CLI
    (ask_claude_pro) if Hermes fails, times out, or is rate-limited -- separate OAuth
    session/quota from Hermes, so it survives Hermes being down."""
    prompt = build_prompt(agent, question, context)

    try:
        # Timeout raised 60s -> 180s 2026-09-03: a bare "say OK" round-trip
        # already takes ~40s (fixed Hermes CLI startup overhead), so any real
        # question with the full system prompt attached was routinely
        # exceeding 60s and silently degrading to a useless "[Timeout]"
        # answer instead of the real one -- confirmed via a direct timed test,
        # not a hang.
        # Model pinned 2026-09-03: the unpinned default model hallucinates a
        # tool_call/tool_search response (asking which tool to invoke, e.g.
        # "web_search"/"x_search") instead of just answering, on ANY
        # system-prompt-styled input -- reproduced consistently, unrelated to
        # this script's specific wording. claude-sonnet-4-6 does not exhibit
        # this and answers correctly. Same root cause as the Morning Report /
        # Weekly Research cron fixes earlier today: an unpinned job silently
        # rides whatever the current default model is.
        result = subprocess.run(
            ["hermes", "-z", prompt, "--provider", "anthropic", "--model", "claude-sonnet-4-6"],
            capture_output=True, text=True, timeout=180
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        print(f"[WARN] Hermes gave no answer for {agent}, trying Claude Pro CLI fallback", file=sys.stderr, flush=True)
    except subprocess.TimeoutExpired:
        print(f"[WARN] Hermes timed out for {agent}, trying Claude Pro CLI fallback", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"[WARN] Hermes failed for {agent} ({e}), trying Claude Pro CLI fallback", file=sys.stderr, flush=True)

    fallback = ask_claude_pro(prompt)
    if fallback:
        return fallback

    return f"[Brain offline] Could not process question for {agent}: {question[:100]}. Both Hermes and Claude Pro CLI failed."


def classify_decision(answer):
    lower = answer.lower()
    if any(w in lower for w in ["book", "call client", "contact", "reach out now", "schedule now", "send message"]):
        return "action_required"
    if any(w in lower for w in ["dev needs to", "check with dev", "escalate", "i don't know", "unclear"]):
        return "escalate_to_dev"
    return "answer"


def main():
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] Oxyderm Brain polling...", flush=True)

    result = api_call("get_pending")
    if not result or not result.get("ok"):
        print("[INFO] API unreachable or no response.", flush=True)
        return

    questions = result.get("questions", [])
    count = len(questions)

    if count == 0:
        print("[INFO] No pending questions.", flush=True)
        return

    print(f"[INFO] {count} question(s) to answer.", flush=True)

    for q in questions:
        qid      = q["id"]
        agent    = q["agent"]
        question = q["question"]
        context  = q.get("context")

        print(f"[Q#{qid}] {agent}: {question[:80]}", flush=True)

        answer = ask_hermes(agent, question, context)
        dtype  = classify_decision(answer)

        resp = api_call("post_answer", {
            "question_id":   qid,
            "agent":         agent,
            "answer":        answer,
            "decision_type": dtype
        })

        if resp and resp.get("ok"):
            print(f"[Q#{qid}] Done. type={dtype}", flush=True)
        else:
            print(f"[Q#{qid}] Failed to post answer.", file=sys.stderr, flush=True)

    print(f"[{ts}] Polling complete.", flush=True)


if __name__ == "__main__":
    main()
