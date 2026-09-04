#!/bin/bash
# Oxyderm - Fetch Square schedule daily at 7am
# Runs as no_agent cron — no LLM needed, just execute and report

set -e

cd /Users/genesis/Desktop/Oxyderm-Build/dashboard

# Load secrets (Square API key etc.)
source ~/.oxyderm/secrets.env 2>/dev/null || true

# Run the Python fetch script
echo "=== Fetching Square schedule $(date) ==="
/usr/bin/python3 fetch_schedule.py

# Count appointments found
APPTS=$(python3 -c "
import json
with open('schedule.json') as f:
    d = json.load(f)
appts = d.get('appointments', [])
today = d.get('today', '')
today_appts = [a for a in appts if a.get('date','') == today]
print(f'Today ({today}): {len(today_appts)} appointments, Total: {len(appts)}')
" 2>/dev/null || echo "Could not read schedule.json")

echo "$APPTS"

# Push to git
git add schedule.json 2>/dev/null && \
git commit -m "Daily schedule update $(date +%Y-%m-%d)" 2>/dev/null && \
git push 2>/dev/null && \
echo "Git push: success" || echo "Git push: skipped (no changes or error)"

echo "=== Done ==="
echo "$APPTS"
