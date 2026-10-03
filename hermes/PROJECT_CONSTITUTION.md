# AGENCY OS — PROJECT CONSTITUTION (Hermes must obey)

## Product
Dashboard control panel for Oxyderm / Agency OS.
Engine is source of truth for booking/clients/publish when online.
UI must never fake success when engine is offline.

## Non-negotiables
1. One ticket at a time (TICKET.md).
2. Do not change PUBLISH_WEBHOOK, PUBLISH_AUTH, or payload shape unless ticket says.
3. ENGINE_BASE = http://localhost:4790
4. SARAH_WORKER = https://agency-os-engine.dev-agencyos.workers.dev/api/oxyderm/sarah
5. org_id on any new data model.
6. Voice (mic + TTS) is BROWSER-ONLY. Must work with zero API calls.
7. Chat answers may call Sarah worker/engine; voice capture/playback must not depend on them.

## File map (do not invent new top-level apps)
- index.html = main dashboard (or path TICKET specifies)
- hermes/HERMES_RULES.md
- hermes/MEMORY.md
- hermes/TICKET.md
- hermes/ACCEPTANCE.md
- hermes/PROJECT_CONSTITUTION.md  (this file)

## P1 voice architecture (locked)
- SpeechRecognition / webkitSpeechRecognition = input
- speechSynthesis = output
- No fetch() required for mic start/stop/transcript/TTS
- If API down: still record voice → put text in input → user can see text; reply may show offline message

## Definition of done
Acceptance checkboxes pass on a real browser test by human.
MEMORY.md Day Log updated.

## Build method — 4 roles, sequential (A→B→C→D)
| Pass | Role | Allowed | Forbidden |
|------|------|---------|-----------|
| A | Architect | Read constitution + ticket only; list files to touch | No code |
| B | Implementer | Edit only listed files | No new features |
| C | QA | Run acceptance checklist; fix only failures | No refactors |
| D | Memory clerk | Update MEMORY.md only | No code |

Never skip A→B→C→D. Never combine passes.
