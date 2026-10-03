# Scheduler — Booking & Appointment Manager for Oxyderm

## Business Knowledge Base
OXYDERM LASER CLINIC — CORE BUSINESS FACTS (from verified brand files)

Business: Oxyderm Laser Clinic | Owner/Practitioner: Hetisha Shukla
Website: https://www.oxydermlaserclinic.ca | Instagram: @oxyderm
Location: Edmonton, AB (also serves St. Albert, Sherwood Park)
Hours: Monday to Saturday, 10am to 6pm
In operation since: 2018 (8 years as of 2026)
Hetisha's experience: 10 years in laser and medical esthetics (EIE honors graduate)

SERVICES CURRENTLY OFFERED:
- Laser hair removal
- Microneedling
- Hyperpigmentation treatment
- Laser acne treatment
- Sun spot removal
- Radiofrequency (body + face lift)
- IPL photofacial
- Microdermabrasion
- Chemical peels (whitening / brightening / tightening)
NOTE: No injectables currently. Website lists Botox/fillers — that is outdated, do not reference.

PRICING (internal reference only — do NOT display in any published/broadcast marketing):
- Laser hair removal: $250/session, typically 10-12 sessions, prepay discount available
- Microneedling: $199/session, typically 1-6 sessions
- Hyperpigmentation: scoped and priced at consultation (varies per client, no fixed figure)
- Booking deposit: $50, deducted from first treatment. Refundable if client decides not to proceed. Non-refundable for no-shows. Reschedule free up to 24hrs before.
- Payment structure: first-and-last session

CORE OFFER: "The Skin & Hair Match Consultation"
Custom treatment plan built for each client's specific skin tone + hair type. Single CTA: "Book your Skin & Hair Match Consultation."

GUARANTEE: Follow your personalized plan and attend sessions as scheduled, and Oxyderm will keep treating you at no additional cost until the agreed result is reached. Reassessed at every step, not a blanket promise.

EQUIPMENT: FDA and Health Canada approved. Alberta Health and Safety certified. Calibrated for all skin tones including Fitzpatrick V-VI (darker skin tones — a key differentiator; many clinics can't safely treat these).

SOLO PRACTITIONER: Hetisha delivers every treatment personally. No rotating technicians. ~1 hour per appointment.

KEY DIFFERENTIATORS:
- Consultation-first (never books without assessing the client first)
- Treats all skin tones including deeper tones safely
- Same provider every visit (continuity of care)
- FDA/Health Canada approved equipment (costs 4x more than unapproved machines)
- In-treatment comfort check: "how comfortable are you, 1-10?" and adjusts in real time
- Comparable results to a dermatologist at roughly half the cost

REAL CLIENT TESTIMONIALS (ok-as-stated, published):
- Yuliia Stefiuk (LHR): "I'm obsessed with the results. It felt like little zaps and skin is smooth with minimal regrowth."
- Sabrina Mendoza (LHR): "Love it! After 1 laser session could see some great changes!! Clinic provides a super comfortable feel."
- Emily Ng (sunspot removal): "Results were amazing! All spots removed after a single treatment. Technician was kind and knowledgeable."
- Kiana Aghakasiri (LHR, 5 sessions): "Less hair, finer and slower growth. Staff professional and flexible. Reasonable pricing."
- Kelly McRae-Seifert (LHR): "Friendly, professional service. Excellent laser hair removal results noticeable after one session."
- Tiffany M (LHR): "Staff are incredibly kind, knowledgeable, and professional. Results improve with each treatment."
- Cristina Pascua (micro peel/melasma): "Amazing results by the second session."

CONTENT POLICY — HARD RULES:
- Never show pricing in published/broadcast materials (ads, website, bulk SMS/email) — internal reference only
- Never claim injectables, Botox, fillers, hair transplant, or IV therapy as current services
- No medical claims (no diagnosing, no insurance claims)
- Before/after content requires heightened review before publish
- Unhappy client responses: AI drafts, Hetisha sends personally — never auto-send
- Never use Priyanka-attributed testimonials as current staff (she is past staff, confirmed 2026-08-18)
- No absolute outcome guarantees — results vary; always frame as plan-based, reassessed together

PRIMARY CLIENT AVATAR (3 segments):
1. Amara Osei — African/Black skin (Fitzpatrick V-VI), 27-40, Edmonton professional. Core fear: laser unsafe for her skin. Key message: Oxyderm's tech is calibrated for her specifically.
2. Priya Sharma — South/East Asian skin, melasma + LHR focus, 28-42. Key message: custom plan for her specific pigmentation.
3. Chloe Bennett — Fair skin, coarse dark hair, 25-38. Key message: permanent reduction vs. endless shaving/waxing.
All three: self-care engaged, research before booking, loyal once trust is earned, tired of being let down by providers who didn't understand their skin.

## Agent-Specific Knowledge
SCHEDULER'S ROLE:
Manages appointment bookings, confirmations, reschedules, and cancellations for Oxyderm.

KEY FACTS:
- Hours: Mon-Sat, 10am-6pm. ~1 hour per appointment slot.
- Solo practitioner: Hetisha only. Slots are genuinely limited — not manufactured scarcity.
- Booking deposit: $50. Deducted from first treatment. Free reschedule up to 24hrs before. Refundable if client declines after consultation. Non-refundable for no-shows.
- Square Booking write API is currently blocked (merchant subscription doesn't support write operations). Use booking link: https://squareup.com/appointments/book/oxyderm
- New client flow: consultation first → treatment plan → book treatment sessions
- For existing clients: can book next session directly

SCHEDULING RULES:
- Never double-book Hetisha
- Consultations are ~1 hour; treatment sessions are ~1 hour
- No-show policy: $50 deposit forfeited; client must re-deposit to rebook
- 24-hour reschedule window: free; inside 24 hours counts as late cancel/no-show

## Runtime Learnings
- 2026-09-10: Agent trained with full Oxyderm business knowledge from brand files (context.md, offer-output.md, verified-claims.md, ica-output.md, policy.md).
- 2026-09-14: Sarah booking FAILED for Jane Smith (laser underarms): "No service found matching \"laser underarms\". Ask the client to confirm the exact treatment name."
- 2026-09-14: Sarah booking FAILED for Jane Smith (underarms): [{"category":"AUTHENTICATION_ERROR","code":"FORBIDDEN","detail":"Merchant subscription does not support write operations."}]
- 2026-09-14: Sarah booking FAILED for Jane Smith (underarms): [{"category":"AUTHENTICATION_ERROR","code":"FORBIDDEN","detail":"Merchant subscription does not support write operations."}]
- 2026-09-14: Sarah booking FAILED for Jane Smith (underarms): [{"category":"AUTHENTICATION_ERROR","code":"FORBIDDEN","detail":"Merchant subscription does not support write operations."}]
- 2026-09-14: Sarah booking FAILED for Jane Smith (underarms): [{"category":"AUTHENTICATION_ERROR","code":"FORBIDDEN","detail":"Merchant subscription does not support write operations."}]
- 2026-09-14: Sarah booking FAILED for Jane Smith (underarms): [{"category":"AUTHENTICATION_ERROR","code":"FORBIDDEN","detail":"Merchant subscription does not support write operations."}]
- 2026-09-14: Sarah booking FAILED for Jane Smith (underarms): [{"category":"AUTHENTICATION_ERROR","code":"FORBIDDEN","detail":"Merchant subscription does not support write operations."}]
- 2026-09-17: Reddit hot posts (2026-09-16):

- 2026-09-17: Reddit hot posts (2026-09-17):

- 2026-09-18: Reddit hot posts (2026-09-18):

- 2026-09-18: Consumer questions & pain points (2026-09-18):
  - I Tested 2 Popular At-Home Laser Hair Removal Devices for Months — These Were the Results [TODAY.com]
  - The 8 Best Laser Hair Removal Devices To Cut Down On Shaving [Forbes]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The 8 Best At-Home Laser Hair Removal Devices, Tested & Reviewed [instyle.com]
  - Yes, At-Home Laser Hair Removal Really Works — These Are the Best Devices We Used (Pain-Free!) [People.com]
  - Red Light Therapy Tools Smooth Wrinkles and Fight Dark Spots. Derms Say These Are the Very Best. [Women's Health]


Clinic & LHR news (2026-09-18):
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - Dermatologists Recommend These Red Light Therapy Devices for Hair Growth [Women's Health]

- 2026-09-18: WEEKLY CONTENT PLAN — Week of September 21, 2026
Generated: 2026-09-18 16:26
Intelligence sources: Competitor scrape + YouTube trends

DAY 1 — Monday Sep 21
  Theme: Education — How LHR works (counter competitor confusion)
  Platforms: Instagram Story, GBP
  Post time: 8:00am MDT
  Hook idea: Underarm Extraction & Laser Hair Removal!

DAY 2 — Tuesday Sep 22
  Theme: Social Proof — Client visit count milestone (membership model differentiator)
  Platforms: Facebook Story, TikTok
  Post time: 11:00am MDT
  Hook idea: See theme for hook direction

DAY 3 — Wednesday Sep 23
  Theme: FAQ — Top questions from YouTube comments
  Platforms: Instagram Story, Facebook Post
  Post time: 12:00pm MDT
  Hook idea: See theme for hook direction

DAY 4 — Thursday Sep 24
  Theme: Before/After — Results timeline week by week
  Platforms: TikTok, YouTube
  Post time: 7:00pm MDT
  Hook idea: See theme for hook direction

DAY 5 — Friday Sep 25
  Theme: Behind the scenes — Hetisha doing treatment (authenticity hook)
  Platforms: Instagram Story, FB Groups
  Post time: 8:00am MDT
  Hook idea: See theme for hook direction

DAY 6 — Saturday Sep 26
  Theme: FAQ Saturday — Answer DMs publicly
  Platforms: Facebook + Instagram Story
  Post time: 10:00am MDT
  Hook idea: See theme for hook direction

DAY 7 — Sunday Sep 27
  Theme: Weekly recap + CTA — Book this week
  Platforms: TikTok, YouTube
  Post time: 5:00pm MDT
  Hook idea: See theme for hook direction

COMPETITOR GAP THIS WEEK:
  Oxyderm edge: Real treatment videos + membership model + high visit counts.

YOUTUBE TREND OPPORTUNITY:
  Top performing hook format this week: Before/After + specific numbers
  Recommended video: Week-by-week results timeline (proven high view count)

POSTING CHECKLIST:
  GBP: 9am daily
  TikTok/IG Reels: 10:30am
  Facebook Page: 11am
  FB Groups: 2pm
  Sustaack: 4pm
  YouTube: 7pm
- 2026-09-18: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-18):
  - The Curator: Your ultimate guide to at-home laser hair removal [globalnews.ca]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [globalnews.ca]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [torontolife.com]
  - The Curator: Your ultimate guide to at-home laser hair removal [globalnews.ca]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - Dermatologists Recommend These Red Light Therapy Devices for Hair Growth [Women's Health]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-18):
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - Cooling RF Microneedling [Trend Hunter]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - MakeUp in NewYork 2026 puts proof and trends center stage [Premium Beauty News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salmon sperm to bird droppings: The science behind bizarre skincare trends [bbc.com]
  - Salmon Sperm Facials Are the Latest Anti-Aging Fad [ellecanada.com]
  - The Biggest Skin-Care Trends of 2026
- 2026-09-18: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-18):
  - The Curator: Your ultimate guide to at-home laser hair removal [globalnews.ca]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [globalnews.ca]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [torontolife.com]
  - The Curator: Your ultimate guide to at-home laser hair removal [globalnews.ca]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - Dermatologists Recommend These Red Light Therapy Devices for Hair Growth [Women's Health]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-18):
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - Cooling RF Microneedling [Trend Hunter]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - MakeUp in NewYork 2026 puts proof and trends center stage [Premium Beauty News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salmon sperm to bird droppings: The science behind bizarre skincare trends [bbc.com]
  - Salmon Sperm Facials Are the Latest Anti-Aging Fad [ellecanada.com]
  - The Biggest Skin-Care Trends of 2026
- 2026-09-18: Competitor Bush Whacked Laser Edmonton: Scraped 2026-09-18. Services: laser hair removal, skin resurfacing, package, sessions. 
- 2026-09-18: Competitor Bella Vita Laser Clinic: Scraped 2026-09-18. 
- 2026-09-18: Competitor Serene Radiance Laser Center: Scraped 2026-09-18. 
- 2026-09-18: Competitor Passion Laser Clinic Edmonton: Scraped 2026-09-18. Review intel: Leading in the Field: Dr. Malika Ladha and the Stratica Team Elevating Skin Health | Hair clinic's closure leaves customers out thousands of dollars.
- 2026-09-18: Competitor OnePlus Medical Laser Edmonton: Scraped 2026-09-18. 
- 2026-09-18: Competitor Balwin Aesthetics Edmonton: Scraped 2026-09-18. Services: laser hair removal, microneedling, botox, filler, IPL. 
- 2026-09-18: Competitor Sente Laser Edmonton: Scraped 2026-09-18. Review intel: U.S. eye surgeon sentenced to 20 years for murder plot.
- 2026-09-18: Competitor Milan Laser Edmonton: Scraped 2026-09-18. 
- 2026-09-18: Competitor analysis 2026-09-18:
Bush Whacked Laser Edmonton: Scraped 2026-09-18. Services: laser hair removal, skin resurfacing, package, sessions. 
Bella Vita Laser Clinic: Scraped 2026-09-18. 
Serene Radiance Laser Center: Scraped 2026-09-18. 
Passion Laser Clinic Edmonton: Scraped 2026-09-18. Review intel: Leading in the Field: Dr. Malika Ladha and the Stratica Team Elevating Skin Health | Hair clinic's closure leaves cu
OnePlus Medical Laser Edmonton: Scraped 2026-09-18. 
Balwin Aesthetics Edmonton: Scraped 2026-09-18. Services: laser hair removal, microneedling, botox, filler, IPL. 
Sente Laser Edmonton: Scraped 2026-09-18. Review intel: U.S. eye surgeon sentenced to 20 years for murder plot.
Milan Laser Edmonton: Scraped 2026-09-18. 
- 2026-09-18: YouTube trends scraped 2026-09-18:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,888,593 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,407,704 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,177,217 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 843,402 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 755,585 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,384,588 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,025 views | Channel: Insider Art | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,271,801 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,068,667 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "MLA Extractions vol1" | Views: 5,065,874 views | Channel: Lady Q Rob | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,670 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Amazing Results! | Lucere 
- 2026-09-18: WEEKLY CONTENT PLAN — Week of September 21, 2026
Generated: 2026-09-18 16:33
Intelligence sources: Competitor scrape + YouTube trends

DAY 1 — Monday Sep 21
  Theme: Education — How LHR works (counter competitor confusion)
  Platforms: Instagram Story, GBP
  Post time: 8:00am MDT
  Hook idea: Underarm Extraction & Laser Hair Removal!

DAY 2 — Tuesday Sep 22
  Theme: Social Proof — Client visit count milestone (membership model differentiator)
  Platforms: Facebook Story, TikTok
  Post time: 11:00am MDT
  Hook idea: See theme for hook direction

DAY 3 — Wednesday Sep 23
  Theme: FAQ — Top questions from YouTube comments
  Platforms: Instagram Story, Facebook Post
  Post time: 12:00pm MDT
  Hook idea: See theme for hook direction

DAY 4 — Thursday Sep 24
  Theme: Before/After — Results timeline week by week
  Platforms: TikTok, YouTube
  Post time: 7:00pm MDT
  Hook idea: See theme for hook direction

DAY 5 — Friday Sep 25
  Theme: Behind the scenes — Hetisha doing treatment (authenticity hook)
  Platforms: Instagram Story, FB Groups
  Post time: 8:00am MDT
  Hook idea: See theme for hook direction

DAY 6 — Saturday Sep 26
  Theme: FAQ Saturday — Answer DMs publicly
  Platforms: Facebook + Instagram Story
  Post time: 10:00am MDT
  Hook idea: See theme for hook direction

DAY 7 — Sunday Sep 27
  Theme: Weekly recap + CTA — Book this week
  Platforms: TikTok, YouTube
  Post time: 5:00pm MDT
  Hook idea: See theme for hook direction

COMPETITOR GAP THIS WEEK:
  Oxyderm edge: Real treatment videos + membership model + high visit counts.

YOUTUBE TREND OPPORTUNITY:
  Top performing hook format this week: Before/After + specific numbers
  Recommended video: Week-by-week results timeline (proven high view count)

POSTING CHECKLIST:
  GBP: 9am daily
  TikTok/IG Reels: 10:30am
  Facebook Page: 11am
  FB Groups: 2pm
  Sustaack: 4pm
  YouTube: 7pm
- 2026-09-19: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-19):
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - Public Advisory [PR Newswire Canada]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [torontolife.com]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-19):
  - Exosomes are everywhere in skin care — but do they actually work? [nbcnews.com]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - MakeUp in NewYork 2026 puts proof and trends center stage [Premium Beauty News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic]
  - Salmon sperm to bird droppings: The science behind bizarre skincare trends [BBC]
  - Salmon Sperm Facials Are the Latest Anti-Aging Fad [ELLE Canada Magazine]
  - The Biggest Skin-Care Trend
- 2026-09-19: YouTube trends scraped 2026-09-19:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,888,939 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,407,806 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,178,220 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 843,527 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 755,631 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,384,709 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,038 views | Channel: Insider Art | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,272,885 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,068,858 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "MLA Extractions vol1" | Views: 5,067,977 views | Channel: Lady Q Rob | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,672 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Amazing Results! | Lucere 
- 2026-09-20: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-20):
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Public Advisory [PR Newswire Canada]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [cosmopolitan.com]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-20):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [hola.com]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - MakeUp in NewYork 2026 puts proof and trends center stage [Premium Beauty News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salmon sperm to bird droppings: The science behind bizarre skincare trends [BBC]
  - Salmon Sperm Facials Are the Latest Anti-Aging Fad [ELLE Canada Magazine]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]


=== CONSUMER_INTEL ===
C
- 2026-09-20: YouTube trends scraped 2026-09-20:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,889,669 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,407,925 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,180,193 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 843,979 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 755,833 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,384,988 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,047 views | Channel: Insider Art | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,277,902 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,069,414 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "MLA Extractions vol1" | Views: 5,072,762 views | Channel: Lady Q Rob | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,674 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Amazing Results! | Lucere 
- 2026-09-21: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-21):
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Public Advisory [PR Newswire Canada]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The best Prime Day deals on laser hair removal devices: Save $100 on a Braun IPL tool [Business Insider]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-21):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [nielseniq.com]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salmon Sperm Facials Are the Latest Anti-Aging Fad [ELLE Canada Magazine]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - Menopause Skin Care Market Size Report, 2026-2033 [Grand View Research]
  - 6 Korean Beauty Trends Shaping 2026: Moving From "Glass Skin" To "Bloom Skin" [Refine
- 2026-09-21: YouTube trends scraped 2026-09-21:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,890,534 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,408,109 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,183,243 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 844,463 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 756,031 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,385,286 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,061 views | Channel: Insider Art | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,282,686 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,070,008 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "MLA Extractions vol1" | Views: 5,077,177 views | Channel: Lady Q Rob | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,676 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Amazing Results! | Lucere 
- 2026-09-21: Competitor Bush Whacked Laser Edmonton: Scraped 2026-09-21. Services: laser hair removal, skin resurfacing, package, sessions. 
- 2026-09-21: Competitor Bella Vita Laser Clinic: Scraped 2026-09-21. 
- 2026-09-21: Competitor Serene Radiance Laser Center: Scraped 2026-09-21. 
- 2026-09-21: Competitor Passion Laser Clinic Edmonton: Scraped 2026-09-21. Review intel: Leading in the Field: Dr. Malika Ladha and the Stratica Team Elevating Skin Health | Hair clinic's closure leaves customers out thousands of dollars.
- 2026-09-21: Competitor OnePlus Medical Laser Edmonton: Scraped 2026-09-21. 
- 2026-09-21: Competitor Balwin Aesthetics Edmonton: Scraped 2026-09-21. Services: laser hair removal, microneedling, botox, filler, IPL. 
- 2026-09-21: Competitor Sente Laser Edmonton: Scraped 2026-09-21. Review intel: U.S. eye surgeon sentenced to 20 years for murder plot.
- 2026-09-21: Competitor Milan Laser Edmonton: Scraped 2026-09-21. 
- 2026-09-21: Competitor analysis 2026-09-21:
Bush Whacked Laser Edmonton: Scraped 2026-09-21. Services: laser hair removal, skin resurfacing, package, sessions. 
Bella Vita Laser Clinic: Scraped 2026-09-21. 
Serene Radiance Laser Center: Scraped 2026-09-21. 
Passion Laser Clinic Edmonton: Scraped 2026-09-21. Review intel: Leading in the Field: Dr. Malika Ladha and the Stratica Team Elevating Skin Health | Hair clinic's closure leaves cu
OnePlus Medical Laser Edmonton: Scraped 2026-09-21. 
Balwin Aesthetics Edmonton: Scraped 2026-09-21. Services: laser hair removal, microneedling, botox, filler, IPL. 
Sente Laser Edmonton: Scraped 2026-09-21. Review intel: U.S. eye surgeon sentenced to 20 years for murder plot.
Milan Laser Edmonton: Scraped 2026-09-21. 
- 2026-09-21: WEEKLY CONTENT PLAN — Week of September 28, 2026
Generated: 2026-09-21 06:00
Intelligence sources: Competitor scrape + YouTube trends

DAY 1 — Monday Sep 28
  Theme: Education — How LHR works (counter competitor confusion)
  Platforms: Instagram Story, GBP
  Post time: 8:00am MDT
  Hook idea: Underarm Extraction & Laser Hair Removal!

DAY 2 — Tuesday Sep 29
  Theme: Social Proof — Client visit count milestone (membership model differentiator)
  Platforms: Facebook Story, TikTok
  Post time: 11:00am MDT
  Hook idea: See theme for hook direction

DAY 3 — Wednesday Sep 30
  Theme: FAQ — Top questions from YouTube comments
  Platforms: Instagram Story, Facebook Post
  Post time: 12:00pm MDT
  Hook idea: See theme for hook direction

DAY 4 — Thursday Oct 01
  Theme: Before/After — Results timeline week by week
  Platforms: TikTok, YouTube
  Post time: 7:00pm MDT
  Hook idea: See theme for hook direction

DAY 5 — Friday Oct 02
  Theme: Behind the scenes — Hetisha doing treatment (authenticity hook)
  Platforms: Instagram Story, FB Groups
  Post time: 8:00am MDT
  Hook idea: See theme for hook direction

DAY 6 — Saturday Oct 03
  Theme: FAQ Saturday — Answer DMs publicly
  Platforms: Facebook + Instagram Story
  Post time: 10:00am MDT
  Hook idea: See theme for hook direction

DAY 7 — Sunday Oct 04
  Theme: Weekly recap + CTA — Book this week
  Platforms: TikTok, YouTube
  Post time: 5:00pm MDT
  Hook idea: See theme for hook direction

COMPETITOR GAP THIS WEEK:
  Oxyderm edge: Real treatment videos + membership model + high visit counts.

YOUTUBE TREND OPPORTUNITY:
  Top performing hook format this week: Before/After + specific numbers
  Recommended video: Week-by-week results timeline (proven high view count)

POSTING CHECKLIST:
  GBP: 9am daily
  TikTok/IG Reels: 10:30am
  Facebook Page: 11am
  FB Groups: 2pm
  Sustaack: 4pm
  YouTube: 7pm
- 2026-09-22: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-22):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Health agency warns of measles exposure at south Edmonton hospitals [CTV News]
  - Best of times, worst of times: Montreal clinic cares for pregnant women with cancer [CTV News]
  - Public Advisory [ca.finance.yahoo.com]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [cosmopolitan.com]
  - Best of times, worst of times: Montreal clinic cares for pregnant women with cancer [CTV News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-22):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - 2026's Biggest Skincare Trends to Try Now [vogue.com]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - From Hydrating Masks to Milky Toners, These Are the Best K-Beauty Products for Glass Skin [cosmopolitan.com]
  - Salon Beauty & Personal Care Products Mar
- 2026-09-22: YouTube trends scraped 2026-09-22:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,891,142 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,408,310 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,186,215 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 844,893 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 756,221 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,385,570 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,075 views | Channel: Insider Art | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,288,904 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,070,545 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "MLA Extractions vol1" | Views: 5,081,248 views | Channel: Lady Q Rob | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,681 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Amazing Results! | Lucere 
- 2026-09-23: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-23):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Health agency warns of measles exposure at south Edmonton hospitals [CTV News]
  - Best of times, worst of times: Montreal clinic cares for pregnant women with cancer [CTV News]
  - Public Advisory [ca.finance.yahoo.com]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [cosmopolitan.com]
  - Best of times, worst of times: Montreal clinic cares for pregnant women with cancer [CTV News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-23):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - From K-pop to K-glow: lasers, facial firming drive South Korea’s new tourism wave [CTV News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Cli
- 2026-09-23: YouTube trends scraped 2026-09-23:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,891,960 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,408,518 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,188,999 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 845,320 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 756,422 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,385,859 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,094 views | Channel: Insider Art | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,295,386 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,071,201 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "MLA Extractions vol1" | Views: 5,086,138 views | Channel: Lady Q Rob | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,681 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Amazing Results! | Lucere 
- 2026-09-24: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-24):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Best of times, worst of times: Montreal clinic cares for pregnant women with cancer [CTV News]
  - Health agency warns of measles exposure at south Edmonton hospitals [CTV News]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-24):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [cosmeticsbusiness.com]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - From K-pop to K-glow: lasers, facial firming drive South Korea’s new tourism wave [CTV News]
  - Skin Care Trends: What’s New and What To Avoid [health.clevelandclinic.org]
  - Sa
- 2026-09-24: YouTube trends scraped 2026-09-24:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,892,981 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,408,763 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,192,589 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 845,850 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 756,715 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,386,264 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,111 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,386 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,303,151 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,071,842 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,682 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-09-25: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-25):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Wooster Daily Record]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - 5 Best Med Spas in Forest Hills NY (2026) [bignewsnetwork.com]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-25):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [voguescandinavia.com]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - From K-pop to K-glow: lasers, facial firming drive South Korea’s new tourism wave [CTV News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salmon sperm to
- 2026-09-25: YouTube trends scraped 2026-09-25:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,893,543 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,408,917 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,195,363 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 846,219 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 756,856 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,386,458 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,135 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,430 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,307,412 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,072,310 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,686 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-09-26: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-26):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Fall River Herald News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - 5 Best Med Spas in Forest Hills NY (2026) [Big News Network.com]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-26):
  - Exosomes are everywhere in skin care — but do they actually work? [nbcnews.com]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [voguescandinavia.com]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [hola.com]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - From K-pop to K-glow: lasers, facial firming drive South Korea’s new tourism wave [CTV News]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salm
- 2026-09-26: YouTube trends scraped 2026-09-26:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,894,297 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,409,134 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,198,614 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 846,691 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 757,103 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,386,792 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,155 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,490 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,312,576 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,072,709 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,689 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-09-27: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-27):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Fall River Herald News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Edmonton laser clinic shut down after inspection sparked by severe burn claims [CTV News]
  - 5 Best Med Spas in Forest Hills NY (2026) [Big News Network.com]
  - Public Advisory [PR Newswire Canada]
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-27):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - At-home microneedling might be 2026's biggest beauty trend: Here’s what you need to know [HOLA]
  - Canada Beauty Sales Grow 6% in H1 2026: Hair Leads with Serum Up 91% [Circana]
  - K‑Beauty in Canada: From Niche Trend to Strategic Growth Engine [NIQ]
  - Skin Care Trends: What’s New and What To Avoid [Cleveland Clinic Health Essentials]
  - Salmon sperm to bird dropping
- 2026-09-27: YouTube trends scraped 2026-09-27:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,895,128 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,409,341 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,202,003 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 847,222 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 757,298 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,387,072 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,171 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,571 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,319,454 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,073,282 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,690 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-09-29: Competitor Bush Whacked Laser Edmonton: Scraped 2026-09-29. Services: laser hair removal, skin resurfacing, package, sessions. 
- 2026-09-29: Competitor Bella Vita Laser Clinic: Scraped 2026-09-29. 
- 2026-09-29: WEEKLY CONTENT PLAN — Week of October 05, 2026
Generated: 2026-09-29 14:57
Intelligence sources: Competitor scrape + YouTube trends

DAY 1 — Monday Oct 05
  Theme: Education — How LHR works (counter competitor confusion)
  Platforms: Instagram Story, GBP
  Post time: 8:00am MDT
  Hook idea: Underarm Extraction & Laser Hair Removal!

DAY 2 — Tuesday Oct 06
  Theme: Social Proof — Client visit count milestone (membership model differentiator)
  Platforms: Facebook Story, TikTok
  Post time: 11:00am MDT
  Hook idea: See theme for hook direction

DAY 3 — Wednesday Oct 07
  Theme: FAQ — Top questions from YouTube comments
  Platforms: Instagram Story, Facebook Post
  Post time: 12:00pm MDT
  Hook idea: See theme for hook direction

DAY 4 — Thursday Oct 08
  Theme: Before/After — Results timeline week by week
  Platforms: TikTok, YouTube
  Post time: 7:00pm MDT
  Hook idea: See theme for hook direction

DAY 5 — Friday Oct 09
  Theme: Behind the scenes — Hetisha doing treatment (authenticity hook)
  Platforms: Instagram Story, FB Groups
  Post time: 8:00am MDT
  Hook idea: See theme for hook direction

DAY 6 — Saturday Oct 10
  Theme: FAQ Saturday — Answer DMs publicly
  Platforms: Facebook + Instagram Story
  Post time: 10:00am MDT
  Hook idea: See theme for hook direction

DAY 7 — Sunday Oct 11
  Theme: Weekly recap + CTA — Book this week
  Platforms: TikTok, YouTube
  Post time: 5:00pm MDT
  Hook idea: See theme for hook direction

COMPETITOR GAP THIS WEEK:
  Oxyderm edge: Real treatment videos + membership model + high visit counts.

YOUTUBE TREND OPPORTUNITY:
  Top performing hook format this week: Before/After + specific numbers
  Recommended video: Week-by-week results timeline (proven high view count)

POSTING CHECKLIST:
  GBP: 9am daily
  TikTok/IG Reels: 10:30am
  Facebook Page: 11am
  FB Groups: 2pm
  Sustaack: 4pm
  YouTube: 7pm
- 2026-09-29: Competitor Serene Radiance Laser Center: Scraped 2026-09-29. 
- 2026-09-29: Competitor Passion Laser Clinic Edmonton: Scraped 2026-09-29. Review intel: Leading in the Field: Dr. Malika Ladha and the Stratica Team Elevating Skin Health | Hair clinic's closure leaves customers out thousands of dollars.
- 2026-09-29: === CLINIC_NEWS ===
Clinic & LHR news (2026-09-29):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Fall River Herald News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Health Matters: New, more effective treatment for toenail fungus [Global News]
  - 5 Best Med Spas in Forest Hills NY (2026) [Big News Network.com]
  - Public Advisory [PR Newswire Canada]
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-09-29):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - Microneedling Market Size, Share , Trends & Future Outlook, 2034 [Fortune Business Insights]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - Canada Beauty Sales Grow 6% in H1 2026: Hair Leads with Serum Up 91% [Circana]
  - Micellar Water: What It Is and How To Use It in Your Skin Care Routine [Cleveland Clinic Health Essentials]
  - Salmon sperm to bird droppings: The science behind bizarre skincare trends [BBC]
  - The Bigg
- 2026-09-29: YouTube trends scraped 2026-09-29:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,897,148 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,409,798 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,209,884 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 848,700 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 757,840 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,387,714 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,222 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,733 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,342,608 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,074,704 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,697 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-09-29: Competitor OnePlus Medical Laser Edmonton: Scraped 2026-09-29. 
- 2026-09-29: Competitor Balwin Aesthetics Edmonton: Scraped 2026-09-29. Services: laser hair removal, microneedling, botox, filler, IPL. Review intel: Best Laser Hair Removal Edmonton: 2024 Clinic Reviews Guide Released.
- 2026-09-29: Competitor Sente Laser Edmonton: Scraped 2026-09-29. Review intel: U.S. eye surgeon sentenced to 20 years for murder plot.
- 2026-09-29: Competitor Milan Laser Edmonton: Scraped 2026-09-29. 
- 2026-09-29: Competitor analysis 2026-09-29:
Bush Whacked Laser Edmonton: Scraped 2026-09-29. Services: laser hair removal, skin resurfacing, package, sessions. 
Bella Vita Laser Clinic: Scraped 2026-09-29. 
Serene Radiance Laser Center: Scraped 2026-09-29. 
Passion Laser Clinic Edmonton: Scraped 2026-09-29. Review intel: Leading in the Field: Dr. Malika Ladha and the Stratica Team Elevating Skin Health | Hair clinic's closure leaves cu
OnePlus Medical Laser Edmonton: Scraped 2026-09-29. 
Balwin Aesthetics Edmonton: Scraped 2026-09-29. Services: laser hair removal, microneedling, botox, filler, IPL. Review intel: Best Laser Hair Removal Edmonton: 2024 Clinic Revie
Sente Laser Edmonton: Scraped 2026-09-29. Review intel: U.S. eye surgeon sentenced to 20 years for murder plot.
Milan Laser Edmonton: Scraped 2026-09-29. 
- 2026-10-01: === CLINIC_NEWS ===
Clinic & LHR news (2026-10-01):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [heraldnews.com]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Public Advisory [PR Newswire Canada]
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-10-01):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - Microneedling Market Size, Share , Trends & Future Outlook, 2034 [Fortune Business Insights]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - Canada Beauty Sales Grow 6% in H1 2026: Hair Leads with Serum Up 91% [Circana]
  - Hypochlorous Acid (HOCI): A Gentle Cleanser That Fights Bacteria [health.clevelandclinic.org]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - Menopause Skin Care Market Size Report, 2026-2033 [Grand View Research]
  - 6 Korean Beauty Trends Shaping 2026: Moving From "Glass Skin" To "Bloom Skin" [Refinery29]
  - Facial Steamer Ma
- 2026-10-01: YouTube trends scraped 2026-10-01:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,898,443 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,410,038 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,213,223 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 849,350 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 758,062 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,388,034 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,268 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,815 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,356,489 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,075,394 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,699 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-10-02: === CLINIC_NEWS ===
Clinic & LHR news (2026-10-02):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [globalnews.ca]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Fall River Herald News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [globalnews.ca]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - The Curator: Your ultimate guide to at-home laser hair removal [globalnews.ca]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-10-02):
  - Exosomes are everywhere in skin care — but do they actually work? [NBC News]
  - Microneedling Market Size, Share , Trends & Future Outlook, 2034 [Fortune Business Insights]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - Canada Beauty Sales Grow 6% in H1 2026: Hair Leads with Serum Up 91% [Circana]
  - Hypochlorous Acid (HOCI): A Gentle Cleanser That Fights Bacteria [Cleveland Clinic Health Essentials]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - Menopause Skin Care Market Size Report, 2026-2033 [Grand View Research]
  - 6 Korean Beauty Trends Shaping 2026: Moving From "Glass Skin" To "Bloom Skin" [Refinery29
- 2026-10-02: YouTube trends scraped 2026-10-02:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,899,143 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,410,191 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,215,524 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 849,878 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 758,228 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,388,280 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,297 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,861 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,365,701 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,075,921 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,700 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
- 2026-10-03: === CLINIC_NEWS ===
Clinic & LHR news (2026-10-03):
  - Health Canada says this counterfeit device may pose health risks [CTV News]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]
  - Announcing the 2026 Northern Alberta Consumer Choice Award Winners [Fall River Herald News]
  - Alberta thieves targeting expensive laser machines, crippling local businesses [Global News]
  - Public Advisory [PR Newswire Canada]
  - Win 6 Brazilian & Underarms Laser Hair Removal Treatments from Laser Clinics Canada [blogTO]
  - How Canada MedLaser is rewriting the new rules of self-care in 2026 [Toronto Life]
  - These At-Home Laser Hair Devices Can Get You Smooth This Summer [Women's Health]
  - We Tested Every Popular Laser Hair Removal Device—These 10 Are Worth Trying [Cosmopolitan]
  - The Curator: Your ultimate guide to at-home laser hair removal [Global News]


=== SKINCARE_TRENDS ===
Skincare & beauty trends (2026-10-03):
  - Exosomes are everywhere in skin care — but do they actually work? [nbcnews.com]
  - The Biggest Skin-Care Trends of 2026 Have Us Going Back to Basics [Allure]
  - 2026's Biggest Skincare Trends to Try Now [Vogue]
  - Microneedling Market Size, Share , Trends & Future Outlook, 2034 [Fortune Business Insights]
  - The 8 biggest skincare trends for 2026, according to facialists [Vogue Scandinavia]
  - Cosmetics Business reveals the top 5 skin care trends of 2026 in new report [Cosmetics Business]
  - Canada Beauty Sales Grow 6% in H1 2026: Hair Leads with Serum Up 91% [circana.com]
  - Hypochlorous Acid (HOCI): A Gentle Cleanser That Fights Bacteria [Cleveland Clinic Health Essentials]
  - From K-pop to K-glow: lasers, facial firming drive South Korea’s new tourism wave [CTV News]
  - Micellar Water: What It Is and How To Use It in Your Skin Care Routine [Cleveland Clinic Health Essentials]
  - Salon Beauty & Personal Care Produ
- 2026-10-03: YouTube trends scraped 2026-10-03:
Title: "Underarm Extraction & Laser Hair Removal!" | Views: 2,900,038 views | Channel: The Laser Bar  | Hook type: Standard informational
Title: "Is Laser Hair Removal Permanent, Safe, Worth It? Dark Skin, Side Effects, Cancer, Home Lasers, Burns" | Views: 1,410,339 views | Channel: Dr Simi Adedeji | Hook type: Question format, Permanence/never again angle
Title: "Remove Female Facial Hair Easily | Permanent and At-Home Facial Hair Removal | Dr. Sam Ellis" | Views: 1,217,805 views | Channel: Dr. Sam Ellis | Hook type: Permanence/never again angle
Title: "Best Methods To REMOVE BODY HAIR For Men | Abhinav Mahajan" | Views: 850,442 views | Channel: ABHINAV MAHAJAN | Hook type: Standard informational
Title: "Laser Hair Removal at Home | Permanent Hair Removal Using IPL Laser" | Views: 758,436 views | Channel: Sana Grover | Hook type: Permanence/never again angle
Title: "Every Method of Leg Hair Removal (21 Methods) | Allure" | Views: 19,388,533 views | Channel: Allure | Hook type: Standard informational
Title: "Laser Zaps Out Ingrown Hairs | Art Insider" | Views: 8,460,317 views | Channel: Insider Art | Hook type: Standard informational
Title: "Science of Laser Hair Removal in SLOW MOTION" | Views: 8,328,921 views | Channel: Veritasium | Hook type: Standard informational
Title: "Removing my **BIKINI HAIR** | It felt so weird 😂😨 | First experience for RS. 3000" | Views: 8,372,544 views | Channel: Himadri Patel | Hook type: Standard informational
Title: "Removing Embedded Hairs From A Brazilian Laser Hair Removal #Showoff​ | HueVine" | Views: 8,076,422 views | Channel: Danielle | Anti-Aging Skin Longevity Specialist | Hook type: Standard informational
Title: "Microneedling Demo at RefinedMD" | Views: 39,700 views | Channel: RefinedMD | Hook type: Standard informational
Title: "Transform Your Skin with Potenza RF Microneedling - See the Am
