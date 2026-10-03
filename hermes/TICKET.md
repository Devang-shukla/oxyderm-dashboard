ID: P4-C1
Title: Connect tab — click-and-connect shell + GA4 + Meta Pixel per org

GOAL
Client (non-technical) can open Connect and either:
- Click Connect on Facebook / Instagram / Google Business and complete login when backend link exists, OR see honest Not connected + what happens next
- Paste GA4 Measurement ID (G-XXXX) and Meta Pixel ID and Save
All data stored per _activeOrg.

UI (Connect tab)
For active org show rows:
1) Facebook — status + Connect / Disconnect
2) Instagram — status + Connect / Disconnect
3) Google Business — status + Connect / Disconnect
4) GA4 — input Measurement ID + Save
5) Meta Pixel — input Pixel ID + Save
6) TikTok, LinkedIn, YouTube — badge "Coming soon" only

CLICK AND CONNECT BEHAVIOR
- If engine provides connect URL for that provider: open that flow
- If not wired yet: show "Backend link not configured yet" — never fake Connected
- Never ask for App ID, App Secret, or long-lived token in UI for social rows

GA4 + PIXEL
- Save ga4_measurement_id + meta_pixel_id to org connections record per _activeOrg
- Reload correct values when org switches

OUT OF SCOPE
- Full Meta App Review, real TikTok/LinkedIn OAuth
- Multi-webhook social router, DNA form, billing flags
- Changing PUBLISH_WEBHOOK, redesigning other tabs

DONE: All ACCEPTANCE items pass + MEMORY Day Log P4-C1
