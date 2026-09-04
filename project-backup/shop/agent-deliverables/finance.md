# FINANCE — Unit Economics & Shipping Model

# Oxyderm Laser Clinic Edmonton — ClearChoice & Oceuticals Unit Economics

## Step-by-Step Arithmetic

### Methodology

- **Cost** = Retail Price × 50% (2× keystone means cost = 50% of MSRP)
- **Gross Margin ($)** = Retail Price − Cost
- **Gross Margin (%)** = Gross Margin ($) ÷ Retail Price × 100
- **Break-even units/month** = $200 ad spend ÷ Gross Margin ($) per unit *(rounded up to nearest whole unit)*

---

## Table 1 — Product-Level Unit Economics

| Product | Retail (CAD) | Cost (50%) | Gross Margin ($) | Gross Margin (%) | Break-even Units/mo @ $200 Ad Spend |
|---|---|---|---|---|---|
| Gentle Foaming Cleanser | $104.00 | $52.00 | $52.00 | 50.00% | ⌈200 ÷ 52⌉ = **4 units** |
| Mandelic Cleanser | $145.00 | $72.50 | $72.50 | 50.00% | ⌈200 ÷ 72.50⌉ = **3 units** |
| Sport Shield SPF45 | $88.00 | $44.00 | $44.00 | 50.00% | ⌈200 ÷ 44⌉ = **5 units** |
| Hyaluronic Drops | $128.00 | $64.00 | $64.00 | 50.00% | ⌈200 ÷ 64⌉ = **4 units** |
| Copper Peptide Infusion | $164.00 | $82.00 | $82.00 | 50.00% | ⌈200 ÷ 82⌉ = **3 units** |
| Vita-C Serum | $156.00 | $78.00 | $78.00 | 50.00% | ⌈200 ÷ 78⌉ = **3 units** |
| Oceuticals Marine Barrier | $148.00 | $74.00 | $74.00 | 50.00% | ⌈200 ÷ 74⌉ = **3 units** |

> **Note:** Because all products are priced at exactly 2× keystone (cost = 50% of retail), gross margin % is uniformly **50%** across the entire line. Break-even unit count is the only differentiator driven by absolute price point.

---

## Table 2 — Free Shipping Threshold Modelling

### Background Arithmetic

When a customer hits the free shipping threshold, Oxyderm **absorbs** the $12 flat shipping cost. This erodes net margin. We must find the **minimum Average Order Value (AOV)** at which a free-shipping order still yields ≥ 40% net margin.

**Formula:**

```
Net Margin (%) = (AOV × Gross Margin % − Shipping Cost Absorbed) ÷ AOV
```

Solving for AOV at exactly 40% net margin, given Gross Margin % = 50%:

```
0.40 = (AOV × 0.50 − 12) ÷ AOV
0.40 × AOV = 0.50 × AOV − 12
12 = 0.50 × AOV − 0.40 × AOV
12 = 0.10 × AOV
AOV = 12 ÷ 0.10 = $120.00
```

**→ Any free-shipping order must average $120.00 AOV or more to maintain 40% net margin.**

---

### Threshold Scenario Analysis

| Scenario | Free Shipping Trigger | Shipping Cost to Oxyderm | Gross Margin % (line avg) | Min AOV for 40% Net Margin | Net Margin at Threshold AOV | Net Margin at $150 AOV | Net Margin at $200 AOV |
|---|---|---|---|---|---|---|---|
| **No Free Shipping** | Never | $0 absorbed | 50% | N/A — customer pays $12 | 50.0% | 50.0% | 50.0% |
| **Threshold: $75 CAD** | Orders ≥ $75 | $12 absorbed | 50% | **$120.00** | 40.0% | 42.0% | 44.0% |
| **Threshold: $100 CAD** | Orders ≥ $100 | $12 absorbed | 50% | **$120.00** | 40.0% | 42.0% | 44.0% |

> The **minimum AOV formula is threshold-agnostic** — the break-even AOV is always $120 regardless of whether the threshold is set at $75 or $100. What differs is *how many orders* qualify, and therefore the **volume of margin erosion risk**.

---

## Table 3 — Net Margin by AOV at Each Threshold

**Formula per row:** Net Margin % = (AOV × 0.50 − 12) ÷ AOV × 100

| AOV (CAD) | Gross Profit | Net After $12 Shipping | Net Margin % | Meets 40% Target? |
|---|---|---|---|---|
| $75.00 | $37.50 | $25.50 | 34.0% | ❌ No |
| $88.00 (SPF45) | $44.00 | $32.00 | 36.4% | ❌ No |
| $100.00 | $50.00 | $38.00 | 38.0% | ❌ No |
| $104.00 (Cleanser) | $52.00 | $40.00 | 38.5% | ❌ No |
| $120.00 ✅ | $60.00 | $48.00 | **40.0%** | ✅ Break-even |
| $128.00 (Hydro) | $64.00 | $52.00 | 40.6% | ✅ Yes |
| $145.00 (Mandelic) | $72.50 | $60.50 | 41.7% | ✅ Yes |
| $148.00 (Marine) | $74.00 | $62.00 | 41.9% | ✅ Yes |
| $156.00 (Vita-C) | $78.00 | $66.00 | 42.3% | ✅ Yes |
| $164.00 (Peptide) | $82.00 | $70.00 | 42.7% | ✅ Yes |
| $200.00 | $100.00 | $88.00 | 44.0% | ✅ Yes |

---

## Table 4 — Threshold Risk Summary & Recommendation

| Free Shipping Threshold | Risk Level | Single-SKU Orders That Qualify Below Break-even AOV | Strategic Recommendation |
|---|---|---|---|
| **$75 CAD** | 🔴 High | SPF45 ($88), Cleanser ($104) — both trigger free shipping but fall *below* $120 break-even AOV | **Not recommended** without minimum AOV guard or bundle requirement |
| **$100 CAD** | 🟡 Medium | Cleanser ($104) barely qualifies; still below $120 AOV break-even | Acceptable **only if** bundling is encouraged; add "Add $16 more for free shipping" nudge to push to $120+ |
| **$120+ AOV enforced** | 🟢 Low | Only orders ≥ $120 receive free shipping | **Recommended floor** — aligns free shipping trigger exactly with net margin protection |

---

## Key Takeaways

1. **Uniform 50% gross margin** across all SKUs — the 2× keystone pricing model is clean and consistent.
2. **$200/month ad spend breaks even at 3–5 units** depending on SKU, with premium SKUs (Peptide, Vita-C, Marine) most efficient.
3. **Free shipping at $75 is margin-destructive** for single-SKU orders of the three lowest-priced products (SPF45, Cleanser, Mandelic below bundle).
4. **Free shipping at $100 is marginal** — the $104 Cleanser barely clears the threshold but still falls $16 short of the $120 AOV needed to hit 40% net.
5. **Recommended policy:** Set free shipping at **$120 CAD** (or use a $100 threshold with an in-cart upsell nudge) to protect the 40% net margin floor on every qualifying order.

---

[SARAH HANDSHAKE: FINANCE]