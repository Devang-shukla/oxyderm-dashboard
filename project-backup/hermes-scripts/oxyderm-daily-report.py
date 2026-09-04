#!/usr/bin/env python3
"""
Oxyderm Daily Decision Report
Runs at 8pm via Hermes cron.
Pulls all decisions from HostGator, formats report, sends to Dev via Telegram.
Output is delivered by Hermes cron directly to Telegram.
"""

import json
import urllib.request
import datetime

API_URL = "https://api.oxydermlaserclinic.ca/api.php"
API_KEY = "REDACTED_SET_VIA_SECRETS_ENV"


def api_call(action, data=None):
    payload = json.dumps({"action": action, **(data or {})}).encode()
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json", "X-API-Key": API_KEY, "User-Agent": "curl/8.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return None


def main():
    today     = datetime.date.today().strftime("%Y-%m-%d")
    since     = f"{today} 00:00:00"
    day_label = datetime.date.today().strftime("%A, %B %d")

    result = api_call("get_report", {"since": since})

    if not result or not result.get("ok"):
        print(f"**Oxyderm Daily Report — {day_label}**\n\nNo decisions logged today. Brain may be offline or no questions were asked.")
        return

    decisions = result.get("decisions", [])
    count     = result.get("count", 0)

    if count == 0:
        print(f"**Oxyderm Daily Report — {day_label}**\n\nNo activity today. No questions were asked through the dashboard.")
        return

    # Group by agent
    by_agent = {}
    for d in decisions:
        agent = d["agent"]
        if agent not in by_agent:
            by_agent[agent] = []
        by_agent[agent].append(d)

    # Count by decision type
    types = {}
    for d in decisions:
        t = d["decision_type"]
        types[t] = types.get(t, 0) + 1

    lines = []
    lines.append(f"**Oxyderm Brain — Daily Report**")
    lines.append(f"*{day_label}*")
    lines.append(f"")
    lines.append(f"**{count} decisions made today**")

    type_summary = " | ".join([f"{v} {k}" for k, v in types.items()])
    lines.append(f"Types: {type_summary}")
    lines.append("")

    agent_emojis = {
        "scheduler": "📅",
        "editor":    "🎬",
        "social":    "📣",
        "finance":   "💰",
        "client":    "👥",
        "marketing": "🚀",
        "research":  "🔍",
        "general":   "🧠"
    }

    for agent, items in by_agent.items():
        emoji = agent_emojis.get(agent, "🤖")
        lines.append(f"{emoji} **{agent.title()} Agent** ({len(items)} decisions)")
        for d in items:
            t = datetime.datetime.fromisoformat(d["created_at"]).strftime("%I:%M%p").lstrip("0").lower()
            q = d["question"][:80] + ("..." if len(d["question"]) > 80 else "")
            a = d["answer"][:120] + ("..." if len(d["answer"]) > 120 else "")
            flag = ""
            if d["decision_type"] == "action_required":
                flag = " [ACTION NEEDED]"
            elif d["decision_type"] == "escalate_to_dev":
                flag = " [NEEDS YOU]"
            lines.append(f"  `{t}`{flag} {q}")
            lines.append(f"  -> {a}")
            lines.append("")

    # Escalations that need Dev's attention
    escalations = [d for d in decisions if d["decision_type"] in ("escalate_to_dev", "action_required")]
    if escalations:
        lines.append(f"**{len(escalations)} item(s) need your attention:**")
        for d in escalations:
            lines.append(f"- [{d['agent'].title()}] {d['question'][:100]}")
        lines.append("")

    lines.append("---")
    lines.append("Built with Agency OS - AI Lead Builder")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
