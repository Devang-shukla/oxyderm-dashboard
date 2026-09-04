#!/usr/bin/env python3
"""
Oxyderm Task Executor — Hermes Polling Script
Runs every few minutes via Hermes cron. Fetches pending open-ended tasks
(competitor research, report generation, etc.) from HostGator, runs them
through the hermes CLI WITH web search access, writes results back.

Distinct from oxyderm-brain.py (fast Q&A, no tools) — this is for tasks
that need real web research and can take longer (up to 5 min).
"""

import sys
import json
import subprocess
import urllib.request
import datetime
import os

API_URL = "http://api.oxydermlaserclinic.ca/api.php"
API_KEY = "REDACTED_SET_VIA_SECRETS_ENV"

SQUARE_LOCATION_ID = "SA5CTAH41JNY2"


def get_square_token():
    """Reads SQUARE_ACCESS_TOKEN from the same secrets.env the rest of the
    system uses. Returns None if unavailable — callers must handle that by
    omitting Square numbers rather than fabricating them."""
    try:
        secrets_path = os.path.expanduser("~/.oxyderm/secrets.env")
        with open(secrets_path) as f:
            for line in f:
                if line.startswith("SQUARE_ACCESS_TOKEN="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return None


def fetch_square_summary(days=7):
    """Real revenue + appointment counts from Square for the last N days.
    Returns None (not zeros) on any failure so callers can honestly say
    'not available' instead of reporting fabricated zeros as real data."""
    token = get_square_token()
    if not token:
        return None

    since = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")

    summary = {"period_days": days, "revenue_cents": 0, "payment_count": 0,
               "booking_count": 0, "new_customer_count": None, "source": "square_api_live"}

    # Payments (completed only) -> revenue
    try:
        cursor = None
        while True:
            url = (f"https://connect.squareup.com/v2/payments?location_id={SQUARE_LOCATION_ID}"
                   f"&begin_time={since}&end_time={now}&limit=100&sort_order=ASC")
            if cursor:
                url += f"&cursor={cursor}"
            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-01-17"
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
            for p in data.get("payments", []):
                if p.get("status") == "COMPLETED":
                    summary["revenue_cents"] += p.get("amount_money", {}).get("amount", 0)
                    summary["payment_count"] += 1
            cursor = data.get("cursor")
            if not cursor:
                break
    except Exception as e:
        print(f"[WARN] Square payments fetch failed: {e}", file=sys.stderr, flush=True)
        summary["revenue_cents"] = None
        summary["payment_count"] = None

    # Bookings -> appointment volume (List Bookings GET endpoint; the
    # POST /v2/bookings/search endpoint 404s on this account/API version)
    try:
        url = (f"https://connect.squareup.com/v2/bookings?location_id={SQUARE_LOCATION_ID}"
               f"&start_at_min={since}&start_at_max={now}&limit=100")
        count = 0
        while True:
            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-01-17"
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
            count += len(data.get("bookings", []))
            cursor = data.get("cursor")
            if not cursor:
                break
            url = (f"https://connect.squareup.com/v2/bookings?location_id={SQUARE_LOCATION_ID}"
                   f"&start_at_min={since}&start_at_max={now}&limit=100&cursor={cursor}")
        summary["booking_count"] = count
    except Exception as e:
        print(f"[WARN] Square bookings fetch failed: {e}", file=sys.stderr, flush=True)
        summary["booking_count"] = None

    if summary["revenue_cents"] is not None:
        summary["revenue_dollars"] = round(summary["revenue_cents"] / 100, 2)

    return summary

TASK_SYSTEM_PROMPT = """You are the Research & Task Execution Agent for Oxyderm Laser Clinic in Edmonton, Canada (LHR + microneedling clinic, owner/face Hetisha, brand navy #00172D gold #c9a96e). You have web search access.

For research tasks: search the web for real, current, verifiable information. Cite what you found. Never fabricate prices, reviews, addresses, or facts. If you cannot find something, say so explicitly rather than guessing.

For report/plan tasks: you will be given real operational numbers (customer profiles saved, links sent, lapsed clients, agent decisions, task counts, and — when available — live Square revenue/appointment/booking numbers) pulled directly from the live database and Square API. Build your report or plan strictly from those numbers plus any web research you do — never invent revenue figures, appointment counts, or other numbers not given to you or found via search. If a Square number is missing or null in the data, say explicitly that it was not available this run — do not guess or omit the caveat.

Produce a complete, usable report or answer, not a plan to do the work later. No em-dashes. No emojis. No fluff. Be specific and cite sources (URLs) for factual claims about competitors."""

REPORT_PROMPT_TEMPLATE = """Task type: {task_type}

Instructions: {instructions}

Real operational data for the last {days} days (from the live Oxyderm systems database and, when reachable, the Square API directly):
{data_json}

Note: social media engagement metrics are not yet tracked and are not in this data. If the instructions ask for those, say they are not available from this data source."""


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


def run_task(task_type, instructions):
    """Runs via hermes CLI with web tool access. Longer timeout than Q&A."""
    if task_type in ("report", "plan", "planning", "reporting"):
        report_data = api_call("report_data", {"days": 7})
        if report_data is None:
            report_data = {"error": "could not fetch report data"}
        square_data = fetch_square_summary(days=7)
        report_data["square"] = square_data if square_data is not None else {
            "error": "Square API unreachable or credentials missing this run — revenue/booking numbers not available"
        }
        data_json = json.dumps(report_data, indent=2)
        prompt = f"{TASK_SYSTEM_PROMPT}\n\n{REPORT_PROMPT_TEMPLATE.format(task_type=task_type, instructions=instructions, days=7, data_json=data_json)}"
    else:
        prompt = f"{TASK_SYSTEM_PROMPT}\n\nTask type: {task_type}\n\nInstructions: {instructions}"
    try:
        result = subprocess.run(
            ["hermes", "-t", "web", "-z", prompt],
            capture_output=True, text=True, timeout=280
        )
        if result.returncode == 0 and result.stdout.strip():
            return "done", result.stdout.strip()
        return "failed", f"hermes exited {result.returncode}: {result.stderr[-500:] if result.stderr else 'no output'}"
    except subprocess.TimeoutExpired:
        return "failed", f"Task timed out after 280s: {instructions[:150]}"
    except Exception as e:
        return "failed", f"Execution error: {e}"


def main():
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] Oxyderm Task Executor polling...", flush=True)

    result = api_call("task_get_pending")
    if not result or not result.get("ok"):
        print("[INFO] API unreachable or no response.", flush=True)
        return

    tasks = result.get("tasks", [])
    if not tasks:
        print("[INFO] No pending tasks.", flush=True)
        return

    print(f"[INFO] {len(tasks)} task(s) to run.", flush=True)

    for t in tasks:
        tid = t["id"]
        task_type = t["task_type"]
        instructions = t["instructions"]
        print(f"[Task#{tid}] {task_type}: {instructions[:80]}", flush=True)

        status, result_text = run_task(task_type, instructions)

        resp = api_call("task_complete", {
            "task_id": tid,
            "status": status,
            "result": result_text
        })

        if resp and resp.get("ok"):
            print(f"[Task#{tid}] {status}.", flush=True)
        else:
            print(f"[Task#{tid}] Failed to post result.", file=sys.stderr, flush=True)

    print(f"[{ts}] Task polling complete.", flush=True)


if __name__ == "__main__":
    main()
