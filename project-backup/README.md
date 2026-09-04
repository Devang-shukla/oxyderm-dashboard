# Project backup (2026-09-04)

Backup of the rest of the Oxyderm-Build project (outside the live `dashboard/`
app) and the Hermes brain scripts, so a second machine (Oxyderm desktop) can
pull the same state instead of it only living on this Mac.

## What's here
- `api/`, `backend/`, `data/`, `logs/`, `output/`, `reports/`, `scripts/`,
  `shop/`, `video_scripts/` — copied from `Oxyderm-Build/` (siblings of this
  `dashboard/` repo root).
- `hermes-scripts/` — the Oxyderm-specific Hermes brain scripts from
  `~/.hermes/scripts/oxyderm-*.py` on the source machine (the actual "brain"
  logic: polling, task execution, daily reports, tunnel watching).

## What's NOT here (deliberately)
- `Oxyderm-Build/content/` (6.8GB of video/image media) — several files
  exceed GitHub's 100MB per-file limit and the total exceeds free Git LFS
  quota. Needs a separate storage decision.
- `~/.hermes/` core app, `node/`, `state.db`, `sessions/` (~4GB) — that's the
  reinstallable Hermes CLI tool itself plus a cross-project conversation
  database (not Oxyderm-specific, may include other projects' data).
- Any credentials: `~/.hermes/auth.json`, `~/.oxyderm/secrets.env`, etc.

## Redacted secrets
Two hardcoded API keys were found in these files and replaced with a
placeholder in this backup copy (the live files on the source machine were
left untouched):
- One key was in `hermes-scripts/oxyderm-brain.py`, `oxyderm-tasks.py`,
  `oxyderm-daily-report.py`, `oxyderm-tunnel-watcher.py`. The same key is
  also still hardcoded (unredacted) in this repo's own
  `engine/automationEngine.js` — that one predates this backup and wasn't
  changed here; flagged separately for rotation.
- A second, different key was in `backend/api.php`,
  `api/api.php.live-backup-20260902`, and several `reports/*.md` files.

Before running these scripts on a new machine, replace the placeholder with
the real key (get it from the source machine or rotate it) — they will not
authenticate against the live Brain API as committed here.
