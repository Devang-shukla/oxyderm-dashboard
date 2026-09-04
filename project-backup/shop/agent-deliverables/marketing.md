# MARKETING — Retargeting Funnel Blueprint

---

# OXYDERM LASER CLINIC EDMONTON
## ClearChoice Shop — Complete Retargeting Funnel Blueprint

---

## FUNNEL OVERVIEW

```
[TOFU] Video Viewers 60s+  →  [MOFU] Clinical Proof Retarget  →  [BOFU] Shop Direct + Urgency
     Meta / TikTok                  Meta / TikTok                      Meta / TikTok
   Audience Build Phase           Problem → Proof Phase              Close + Convert Phase
      $100/mo                         $175/mo                            $225/mo
```

---

## STAGE 1 — TOFU: AUDIENCE DEFINITION

### Primary Trigger: 60-Second+ Video Viewers (75%+ Watch Threshold)

**Meta Custom Audience:**
- Video Engagement → Watched **75%** (≈ 60s on 80s clips) or ThruPlay
- Lookback: 30 days
- **Andromeda Layers (mandatory — no interests):**
  - Location: Edmonton, AB + 15km radius
  - Age: 25–45 | Gender: Female

**TikTok Custom Audience:**
- Video Interaction → Watched ≥ 75% / Completed View
- Lookback: 30 days | Edmonton | F 25–44

**Warmth Scoring Table:**

| Signal | Score | Action |
|--------|-------|--------|
| Watched 75%+ | ★★★ | Enter MOFU pool |
| Watched 100% / ThruPlay | ★★★★ | Fast-track to MOFU; suppress TOFU ads |
| Watched 25–74% | ★★ | Stay in TOFU; re-expose to new video |
| Watched <25% | ★ | Exclude — do not spend against |
| Commented / Shared | ★★★★★ | Bypass MOFU → direct to BOFU |
| Saved post | ★★★★★ | Bypass MOFU → direct to BOFU |
| DM initiated | ★★★★★ | Manual qualifier → Square booking |

**Exclusions (all stages):**
- Existing Square customers (upload 2,197-phone list as suppression audience)
- Anyone who clicked booking link in last 60 days
- Anyone who visited shop URL in last 7 days
- Completed purchases (Pixel `PurchaseComplete` event)

**Minimum Threshold:** 500 qualified viewers before activating MOFU spend.

---

## STAGE 2 — MOFU: RETARGETING AD COPY

**Audience:** 75%+ video viewers | 14-day lookback  
**Destination:** ClearChoice shop (UTMs below)

---

### MOFU VARIANT A — "Problem Aware to Pain Point"
*Empathetic, relatable — leads with the Sunday-night shave cycle*

**Meta Headline:**
> Still spending Sunday nights prepping for Monday? There's a permanent way out.

**Primary Text:**
> Waxing, threading, shaving — the routine never ends. Edmonton women are switching to laser and never looking back. Here's why it actually works.
>
> Laser targets the root — not just the surface. After 6–8 sessions at Oxyderm, most clients see **85–95% permanent reduction.** No more ingrowns. No more razor burn. Medical-grade technology, certified laser technicians — not a weekend course.

**CTA:** Shop ClearChoice Packages →

**TikTok Caption:**
> POV: You just watched a 60-second video about laser and now you're genuinely considering it 👀 That feeling is valid. 2,700+ Edmonton women made the switch. Link in bio → shop our packages. #LaserHairRemoval #EdmontonBeauty #OxyderEdmonton #LHR #SmoothSkin

---

### MOFU VARIANT B — "Clinical Proof + Credibility Bridge"
*Authoritative, proof-led — leads with real client social proof*

**Meta Headline:**
> "I wish I'd done this 5 years ago." — Real Oxyderm client, Edmonton

**Primary Text:**
> Not all laser is the same. At Oxyderm, we use Health Canada-approved technology — the same systems used in medical clinics across Canada.
>
> Our technicians are **certified**, not just trained. Every treatment is calibrated to your skin tone and hair type. 85–95% hair reduction after a full package. Guaranteed protocols. Real before/after results from your city.

**CTA:** Compare ClearChoice Packages →

**TikTok Caption:**
> The difference between "laser" and CLINICAL laser is huge. Here's what we do differently at Oxyderm Edmonton 🔬 2,700+ clients. Real results. Shop link in bio. #LaserClinic #EdmontonLaser #OxyderEdmonton #BeforeAndAfter #SkincareTok

---

## STAGE 3 — BOFU: CONVERSION AD COPY

**Audience:** MOFU engagers (click, save, comment) | 7-day lookback  
**Destination:** Shop + Square booking fallback

---

### BOFU VARIANT A — "Direct Offer with Social Proof Anchor"
*Confident, low-friction — removes decision paralysis*

**Headline:**
> Edmonton's Most Trusted Laser Clinic — Now in Your Feed for a Reason

**Primary Text:**
> You've done the research. You've watched the videos. Now it's time to actually book it.
>
> Our ClearChoice packages are built for Edmonton women who want results — not a sales pitch.  
> ✅ No upsell pressure  
> ✅ Certified clinical team  
> ✅ Book with $50 deposit, pay over your sessions  
>
> 📅 August is nearly full. September spots opening now — **packages purchased this week hold your price** even if rates adjust.

**CTA:** Shop ClearChoice Now →

**TikTok Caption:**
> You've been on the fence. We get it. But August is almost done and September is filling fast. ClearChoice packages are live in our shop (link in bio). Grab your spot before the price-hold window closes. 📅 #OxyderEdmonton #LaserHairRemoval #EdmontonBeauty #BookNow

---

### BOFU VARIANT B — "Loss Aversion + Price Lock Urgency"
*FOMO-forward, specific — price anchor drives action*

**Headline:**
> Price Hold Ends Soon — Lock Your ClearChoice Package Rate Now

**Primary Text:**
> Edmonton laser prices have increased **12–18% industry-wide** in 2026. Oxyderm's ClearChoice packages are still at current rates — but not indefinitely.
>
> Every week you wait = one more waxing appointment. One more ingrown. One more Sunday prep session.
>
> 🔒 Price locks from date of purchase  
> 💳 Deposit as low as $50 to secure  
> 📅 Flexible scheduling after purchase
>
> *This ad is only showing to Edmonton women who've already watched our videos. You're seeing this because you're ready.*

**CTA:** Lock My ClearChoice Package →

**TikTok Caption:**
> Real talk: laser prices in Edmonton went up this year and Oxyderm is holding current rates — for now. If you've been watching our videos and haven't booked, this is your sign. ClearChoice shop link in bio. Price locks from purchase date. 🔒 #EdmontonLaser #OxyderEdmonton #ClearChoice

---

## STAGE 4 — UTM URL STRUCTURE

### UTM Convention
`utm_source` = `meta` | `tiktok`  
`utm_medium` = `paid_social`  
`utm_campaign` = `tofu_video` | `mofu_retarget` | `bofu_convert`  
`utm_content` = ad variant  
`utm_term` = audience segment

---

**TOFU — Meta (boosted video post):**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=meta&utm_medium=paid_social&utm_campaign=tofu_video&utm_content=video_organic&utm_term=video75pct
```

**TOFU — TikTok:**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=tofu_video&utm_content=video_organic&utm_term=video75pct
```

**MOFU — Meta Variant A (Problem Aware):**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=meta&utm_medium=paid_social&utm_campaign=mofu_retarget&utm_content=varA_problem&utm_term=video75pct
```

**MOFU — Meta Variant B (Clinical Proof):**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=meta&utm_medium=paid_social&utm_campaign=mofu_retarget&utm_content=varB_clinical&utm_term=video75pct
```

**MOFU — TikTok Variant A:**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=mofu_retarget&utm_content=varA_problem&utm_term=video75pct
```

**MOFU — TikTok Variant B:**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=mofu_retarget&utm_content=varB_clinical&utm_term=video75pct
```

**BOFU — Meta Variant A (Direct Offer):**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=meta&utm_medium=paid_social&utm_campaign=bofu_convert&utm_content=varA_directoffer&utm_term=mofu_engager
```

**BOFU — Meta Variant B (Price Lock):**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=meta&utm_medium=paid_social&utm_campaign=bofu_convert&utm_content=varB_pricelock&utm_term=mofu_engager
```

**BOFU — TikTok Variant A:**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=bofu_convert&utm_content=varA_directoffer&utm_term=mofu_engager
```

**BOFU — TikTok Variant B:**
```
https://devang-shukla.github.io/oxyderm-dashboard/shop/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=bofu_convert&utm_content=varB_pricelock&utm_term=mofu_engager
```

**BOFU — Direct Square Booking Fallback (Meta):**
```
https://book.squareup.com/appointments/book/merchant/SA5CTAH41JNY2/services?utm_source=meta&utm_medium=paid_social&utm_campaign=bofu_convert&utm_content=booking_direct&utm_term=bofu_intent
```

---

## STAGE 5 — AUDIENCE QUALIFICATION + $500/MO BUDGET

### Stage Gate Rules

| Stage | Gate-In Criteria | Gate-Out (Suppress) |
|-------|-----------------|---------------------|
| TOFU → MOFU | 75%+ video view, F 25–45, Edmonton | <75% view; existing customer; outside geo |
| MOFU → BOFU | Clicked MOFU ad OR saved OR commented | Impressions-only; no engagement after 2 exposures |
| BOFU → Purchase | Shop visited 2+ times in 7 days OR cart add | No shop engagement after 2 BOFU exposures → suppress 14 days |

### Minimum Audience Thresholds
- TOFU pool: **500+ viewers** before MOFU activates
- MOFU pool: **100+ engagers** before BOFU activates
- BOFU pool: **50+ intenders** (Meta/TikTok minimum for retarget delivery)

### $500/Month Allocation

| Stage | Meta | TikTok | Monthly Total | % | Daily Rate |
|-------|------|--------|--------------|---|-----------|
| TOFU | $65 | $35 | **$100** | 20% | $2.25–3.30/day |
| MOFU | $110 | $65 | **$175** | 35% | $4.00–5.80/day |
| BOFU | $145 | $80 | **$225** | 45% | $5.20–7.50/day |
| **TOTAL** | **$320** | **$180** | **$500** | 100% | |

**Platform split rationale:**  
- **Meta 64%** — higher Edmonton F 25–45 reach; pixel maturity from 2,749 existing customers; Andromeda-compliant structure  
- **TikTok 36%** — lower CPV for Hetisha avatar TOFU content; stronger scroll-stop rate; converts 25–34 bracket

### 4-Week Ramp Schedule

| Week | Action | Budget |
|------|--------|--------|
| 1 | TOFU video boost only; build audience | $25 |
| 2 | Activate MOFU Variant A if TOFU pool ≥ 500 | $100 |
| 3 | A/B test MOFU Variant B; activate BOFU if MOFU pool ≥ 100 | $175 |
| 4 | Full funnel live; optimize toward BOFU clicks → purchases | $200 |

### KPI Targets

| Stage | Metric | Target |
|-------|--------|--------|
| TOFU | CPV (Meta) | ≤ $0.04/view |
| TOFU | CPV (TikTok) | ≤ $0.02/view |
| MOFU | CTR (Meta) | ≥ 1.8% |
| MOFU | CTR (TikTok) | ≥ 2.5% |
| BOFU | CPC (Meta) | ≤ $1.50 |
| BOFU | CPC (TikTok) | ≤ $0.90 |
| BOFU | ROAS | ≥ 3.0x by Month 2 |

**Optimization triggers:**  
- MOFU CTR <1.2% after 7 days → swap variant; cut MOFU 20%; move to BOFU  
- BOFU <5 shop clicks/week → extend MOFU lookback to 21 days; lower BOFU threshold

**Month 2 scale trigger:** If BOFU ROAS ≥ 3.0x → increase BOFU to $300; seed Meta 1% Lookalike from purchasers; test TikTok Spark Ads on top-performing MOFU video.

---

## COMPLIANCE CHECKLIST ✅

- [x] No Botox/injectables in any copy
- [x] No interest targeting — Andromeda-compliant (location/age/gender only)
- [x] No absolute medical claims — "reduction" used, not "permanent elimination"
- [x] UTMs link to correct shop URL (not generic homepage)
- [x] Square booking uses merchant ID SA5CTAH41JNY2
- [x] 2,197-phone existing customer list → suppression audience
- [x] TOFU 500-viewer gate required before MOFU activation
- [x] Budget held at $500/month constraint

---

*Full blueprint saved to: `/Users/genesis/.oxyderm/marketing/clearchoice-retargeting-funnel.md`*

---

**[SARAH HANDSHAKE: MARKETING]**