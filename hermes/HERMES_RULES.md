# HERMES STANDING ORDERS — AGENCY OS

1. One ticket ID only. No next ticket until acceptance PASS + MEMORY updated.
2. No new agents/tables/routes unless ticket requires. No webhook/auth changes unless ticket says.
3. Read MEMORY before coding. Append Day Log after. Never delete past logs.
4. Engine offline = degrade. Never fake book/post/lead success.
5. Every reply: Ticket ID; files changed; acceptance PASS/FAIL; MEMORY YES/NO; blockers.
6. Regression on Sarah/booking/posts/schedule/client = FAIL.
7. Done = human checks all ACCEPTANCE boxes AND MEMORY has PASS Day Log.

## CRITICAL CONSTRAINT (added 2026-09-12)
- DO NOT touch dashboard.oxydermlaserclinic.ca (live site) at all.
- ALL work goes into a NEW local build: /Users/genesis/Desktop/Oxyderm-Build/dashboard-local/
- Only merge to live after Hetisha reviews and approves the local version.
- Localhost: open index.html directly in browser (file://) — no server needed.

## ENGINE ENDPOINTS (read-only reference)
- ENGINE_BASE: http://localhost:4790
- SARAH_WORKER: https://agency-os-engine.dev-agencyos.workers.dev/api/oxyderm/sarah
- PUBLISH_WEBHOOK: https://automation.oxydermlaserclinic.ca/webhook/oxyderm-publish
