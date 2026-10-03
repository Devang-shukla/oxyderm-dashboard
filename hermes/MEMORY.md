# Agency OS — MEMORY

## Current phase
Phase 2 — GHL-gap agents

## Current phase
Phase 3 — Visible self-learning

## Current phase
Phase 4 — Multi-tenant + sell path

## Current phase
COMPLETE — All phases P1 through P4 built

## Active ticket
None

## Day logs (newest first)
### 2026-09-14 — P4-C1 — PASS (auto-verified)
- Done: Connect tab rebuilt — Facebook/IG/GBP rows with Connect button (honest: toast only, no fake connected)
- GA4 Measurement ID + Meta Pixel ID: save/load per _activeOrg via /sarah/connections/save + /sarah/connections/:orgId
- TikTok/LinkedIn/YouTube: Coming soon badges only
- No App Secret fields anywhere in UI
- connections-oxyderm.json + connections-demo-clinic.json seeded
- Braces 662/662, engine routes confirmed live

## Day logs (newest first)
### 2026-09-14 — BUILD1-DNA — PASS (auto-verified)
- Done: Build 1 DNA form in-dashboard (Builds tab)
- Engine routes: GET /sarah/dna/:orgId, POST /sarah/dna/save (uses send() helper, readBody())
- Pre-seeded: dna-oxyderm.json (v1, full Oxyderm data), dna-demo-clinic.json (v0, blank)
- UI: form with 13 fields, view mode with Edit button, version badge, error states
- Per-org: uses getActiveOrgId(), switching org reloads DNA for that org
- Omni Leads brand workspace created: /Users/genesis/brand/omni-leads/ (Build 1-4 complete)
- Active workspace: omni-leads (brand/_active.md)

## Day logs (newest first)
### 2026-09-14 — P4-H1 — PASS (human tested)
- Header switches to active org name on org change
- Demo Clinic (Tenant #2) confirmed: active marker, connections panel, isolation note
- All 4 hardcoded org_id: 'oxyderm' replaced with getActiveOrgId()
- Oxyderm Laser Clinic remains default Tenant #1, fully functional

## Phase 1 status
ALL PASS including P1-07 QA gate

## Day logs (newest first)
### 2026-09-14 — P1-07 — PASS (auto-verified)
- Done: qaCheckCaption() helper + one guard in submitPost()
- Blocks: empty caption, < 3 chars, banned phrases (asdf/test test/xxx/placeholder/lorem ipsum/sample text)
- On block: showToast with reason, no webhook call, no posted card
- PUBLISH_WEBHOOK + PUBLISH_AUTH + payload unchanged
- JS clean

## Day logs (newest first)
### 2026-09-14 — P4-01 through P4-06 — ALL PASS (auto-verified)

P4-01: org_id backfilled on all data files (posts, scores, seo-suggestions)
P4-02: Connect Wizard tab — 2 orgs, 9 integrations, status per org
P4-03: Brand DNA per tenant — org-oxyderm.json + org-demo-clinic.json, dna_version field
P4-04: All jobs/records already carry org_id — verified
P4-05: Plan field per org (Growth/Starter), plan_active flag
P4-06: Tenant #2 (demo-clinic) created, isolated from Tenant #1 (oxyderm), isolation note in UI

Engine routes: GET /sarah/orgs, GET /sarah/org/{id}, POST /sarah/org/connect
JS clean, engine lint clean

## Phase 4
P4-01 → P4-06 ALL PASS (frozen)

## FULL SYSTEM STATUS
Phase 1: P1-01 → P1-13 ALL PASS
Phase 2: P2-01 → P2-10 ALL PASS
Phase 3: P3-01 → P3-04 ALL PASS
Phase 4: P4-01 → P4-06 ALL PASS

Local dashboard: http://localhost:8765 | Password: Tesla2345%
Engine: http://localhost:4790 (launchd managed)
Live site: dashboard.oxydermlaserclinic.ca (not yet merged — pending Hetisha review)

## Day logs (newest first)
### 2026-09-14 — P3-04 — PASS (auto-verified)
- Done: Click score card → modal with history (date/delta/reason per event)
- Empty state if no events
- Close button

### 2026-09-14 — P3-03 — PASS (auto-verified)
- Done: Formula documented in code comments
- Manual Train +5 button in scores section
- Last event reason shown on each score card (italic)
- Measured events: lead_created, nurture, post_submitted, seo_queued, lead_booked, lead_won

## Phase 3
P3-01 → P3-04 ALL PASS (frozen)

## Day logs (newest first)
### 2026-09-14 — P3-02 — PASS (auto-verified)
- Done: Content angles — reinforce/kill/watch decisions with reasons
- Engine routes: GET /sarah/content-angles, POST /mark
- Reporting section in Automations tab
- Auto-insights from posts data (failed/posted counts)
- Test: REINFORCE "Before/After Results", KILL "Generic stock photos"
- Excluded list readable by Planning/Research agents via engine

## Day logs (newest first)
### 2026-09-14 — P3-01 — PASS (auto-verified)
- Done: Agent learning notes section in Automations tab
- 5 agents: Research, Planning, Scheduler, Social, Sarah
- Read notes: GET /sarah/agent-notes/{agent}
- Write notes: POST /sarah/agent-notes/write
- Persists to agents/{agent}/learnings.md
- Test: Sarah 4 notes, Research 2 notes (1 written today)

## Day logs (newest first)
### 2026-09-14 — P2-10 — PASS (auto-verified)
- Done: Phase 2 loop test panel in Automations tab
- Checks: funnel leads (2✅), pipeline New (✅), nurture jobs (1✅), booking link (✅), review requests (4✅), honest errors (✅)
- ALL 6 steps PASS — Phase 2 integration loop complete

## Phase 2
P2-01 → P2-10 ALL PASS (frozen)

## Day logs (newest first)
### 2026-09-14 — P2-09 — PASS (auto-verified)
- Done: SEO/GBP weekly post suggestion in Automations tab
- Uses real Brand DNA (Oxyderm Laser Clinic, Edmonton)
- Rotates service spotlight by week
- "Add to Posts Queue" pushes as GBP draft
- No fake ranking claims
- Engine route: GET /sarah/seo/suggest → saves data/seo-suggestions.json

## Day logs (newest first)
### 2026-09-14 — P2-08 — PASS (auto-verified)
- Done: Ads v0 — connection status + sample campaigns + loser rule
- Meta/Google/TikTok all not_connected with honest CTAs
- Sample campaigns: 3 Meta campaigns with spend/leads/CPL/impressions
- Loser rule: $68 spend + 0 leads → advisory pause suggestion
- No auto budget changes, no fake data labeled as live
- JS clean

## Day logs (newest first)
### 2026-09-14 — P2-07 — PASS (auto-verified)
- Done: Social calendar week view — toggle in Posts tab (Queue / Calendar)
- Week grid Mon–Sun with day columns, post thumbnails, status dots
- Posts matched by ts/scheduled date to day column
- PUBLISH_WEBHOOK unchanged, JS clean

## Day logs (newest first)
### 2026-09-14 — P2-06 — PASS (auto-verified)
- Done: Pipeline hardening — 6 stages (New/Contacted/Qualified/Booked/Won/Lost)
- Move buttons (← prev, → next) replace dropdown; stage logs to lead.activity[]
- Value field on deal; column total value shown
- Booked stage triggers nurture job; Won updates score
- JS clean, persists via localStorage

## Day logs (newest first)
### 2026-09-14 — P2-05 — PASS (auto-verified)
- Done: Payments v0 — create form + list + status badges
- Stripe not configured → honest needs_setup + clear message
- Failed status → payment_recovery job (2 steps) in jobs.json
- No fake "paid" — only manual Mark Paid button
- Engine routes: GET /sarah/payments, POST /create, POST /update-status
- Test confirmed: $750 Jane Smith needs_setup, failed → recovery job queued

## Day logs (newest first)
### 2026-09-14 — P2-04 — PASS (auto-verified)
- Done: Reputation+ v0 — review request after completed visit
- Reputation tab with job list, status badges, draft reply textarea
- "Mark Complete" button on Today tab appointments
- detectCompletedVisits() cron (15 min + 45s startup) auto-detects past bookings
- Skip rules: no_contact → skipped, duplicate → skipped
- Manual request via + button with prompt()
- Engine routes: GET /sarah/review-requests, POST /create, POST /draft
- Test confirmed: skipped (no contact), queued (valid), skipped (duplicate)

## Day logs (newest first)
### 2026-09-14 — P2-03 — PASS (auto-verified)
- Done: Funnel v0 — landing page at http://localhost:4790/f/oxyderm
- Real Brand DNA used (Oxyderm Laser Clinic, LHR + skin treatments)
- Form: name + phone + email optional + service select
- Submit → data/leads-funnel.json + inbox thread + learning logged
- Leads tab merges funnel leads from engine
- Dashboard Funnel tab: preview iframe + copy link
- Test lead confirmed: "Test Funnel Lead" 7801234567 visible
- JS clean, engine lint clean

## Day logs (newest first)
### 2026-09-14 — P2-02 — PASS (human tested)
- Done: Inbox tab with unified SMS/Email threads
- Human confirmed: thread opens, message shows, QUEUED status visible
- SMS reply → QUEUED (no provider); Email reply → attempts himalaya

## Day logs (newest first)
### 2026-09-14 — P1-13 — PASS (auto-verified)
- Done: GET /sarah/report — truthful numbers from Square + jobs + posts + scores + failures
- Report shows: 4 bookings, 8 queued posts, 3 jobs, 7 failures (booking errors)
- Owner Report card in Automations tab
- Numbers match dashboard exactly

### 2026-09-14 — P1-12 — PASS (auto-verified)
- Done: runDailyLearning() cron (24h + 60s startup)
- Reads all agents/*/learnings.md + scores + jobs → writes data/learnings.json
- GET /sarah/learnings returns last 7 days of digests
- First digest confirmed: 20 agents, 3 jobs, real learnings from Sep 10-14
- "What I Learned" section in Automations tab

## Day logs (newest first)
### 2026-09-14 — P1-11 — PASS (auto-verified)
- Done: 7 agent skill scores (Lead Scout, Nurture, Scheduler, Automation, Content, Reputation, Research)
- Scores update from real events: lead_created, nurture_started, post_submitted, no_show_caught
- Scoreboard in Automations tab with progress bars
- Engine routes: GET /sarah/scores, POST /sarah/scores/update
- JS check: PASS

## Day logs (newest first)
### 2026-09-14 — P1-10 — PASS (auto-verified)
- Done: detectNoShows() runs every 15 min + 30s after startup
- Detects CANCELLED/NO_SHOW/CANCELLED_BY_SELLER/CANCELLED_BY_CUSTOMER
- Creates no_show_recovery job with 1 step (PENDING PROVIDER)
- Dedup by booking_id prevents duplicate jobs
- Test job created for cancelled booking hmeb2g6zpu — visible in Automations tab
- Engine restarted via launchd with updated code

## Day logs (newest first)
### 2026-09-14 — P2-01 — PASS (human tested)
- Done: 3 automation recipes (nurture/review_request/no_show_recovery)
- Automations tab shows Jane Smith nurture job with 3 steps, all PENDING PROVIDER
- Lead creation triggers nurture automatically
- Engine stores jobs in data/jobs.json
- Next: P2-02 Inbox

## Phase 1
All P1-01 … P1-07 PASS (frozen — do not touch)

## New local build path
/Users/genesis/Desktop/Oxyderm-Build/dashboard-local/

## Source reference (read-only, do not modify)
/Users/genesis/Desktop/Oxyderm-Build/dashboard/index.html (original)

## Core paths status (Phase 1 — frozen)
- Sarah voice/text: OK — P1-01 PASS
- Booking find/book/cancel: OK — P1-02 PASS
- Client lookup: OK — P1-03 PASS
- Today schedule: OK — P1-04 PASS (real Square data)
- Publish post: OK — P1-06 PASS (8 real clinic images, 0 stock)
- Lead create: OK — P1-05 PASS

## P1-07 QA Gate — PASS (auto-run 2026-09-14)
| Check | Result |
|-------|--------|
| Engine alive | OK |
| Schedule endpoint | OK (4 real appts) |
| Square booking link | OK (200) |
| Posts — real images | OK (8/8, 0 Unsplash) |
| JS syntax | OK |
| Local server | OK (http://localhost:8765) |

## Engine status
- localhost:4790: ONLINE (Node.js automationEngine.js)
- Sarah worker: https://agency-os-engine.dev-agencyos.workers.dev/api/oxyderm/sarah
- Postiz: DISCONNECTED
- n8n: ONLINE at localhost:5678
- Square: READ-ONLY (write ops blocked by plan)
- Brain API: http://api.oxydermlaserclinic.ca/api.php (key: oxyderm_brain_2026_xK9mP3qL)

## Token/API budget
- Anthropic: Claude Pro (no cash API credits)
- OpenRouter: FREE tier (OPENROUTER_API_KEY set in Worker)
- Budget: $0 cash

## Open blockers
- Cloudflare Worker secrets 0-length (wrong account) — Worker AI disabled
- Google Drive scope missing — P1-06 used website images instead
- Square write ops blocked — fallback to booking link

## Phase 2 order
1. P2-01 Automation v0 (current)
2. P2-02 Inbox (SMS + email threads)
3. P2-03 Pipeline stages
4. P2-04 Funnel page from Brand DNA
5. P2-05 Reputation (review request)
6. P2-06 Payments

## Day logs (newest first)
### 2026-09-14 — Phase 1 complete — ALL PASS
- P1-01 Voice PASS, P1-02 Booking PASS, P1-03 Client PASS
- P1-04 Schedule PASS (real Square data, 4 appts)
- P1-05 Leads PASS (kanban pipeline)
- P1-06 Posts PASS (8 real clinic images)
- P1-07 QA gate auto-run PASS
- Phase 2 begins with P2-01

### 2026-09-14 — P1-06 — PASS
- Done: 8 posts updated with real Oxyderm clinic images (oxydermlaserclinic.ca)
- Files: dashboard-local/data/posts.json
- 0 Unsplash stock images remaining

### 2026-09-14 — P1-05 — PASS (human tested)
- Done: Leads pipeline kanban (New/Contacted/Booked/Lost columns)
- Sarah can create leads via "Add lead [name] [phone]"

### 2026-09-14 — P1-04 — PASS (human tested)
- Done: Real Square schedule via /sarah/schedule route
- 4 real appointments with real customer names

### 2026-09-14 — P1-02 — PASS (human tested)
- Done: Booking via Sarah with Square link fallback
- Real Square booking URL confirmed

### 2026-09-14 — P1-01 — PASS (human tested)
- Done: Browser-native voice (SpeechRecognition + speechSynthesis)
- Mic turns red, TTS works, honest offline errors
