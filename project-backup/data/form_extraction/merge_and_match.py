#!/usr/bin/env python3
"""
Merges the three extracted form datasets into ONE client-per-row marketing
sheet. Dedupes by normalized name, aggregates treatment history, matches
against the Square customer cache for phone/email, and flags rows where no
contact info could be found (excluded from final marketing sheet per
instruction: "if square denied don't include that").
"""
import json
import re
from collections import defaultdict
from datetime import datetime

BASE = "/Users/genesis/Desktop/Oxyderm-Build/data/form_extraction"

GARBAGE_NAMES = {"", "na", "n/a", "none", "date:", "test", "hetisha shukla", "hetisha"}


def normalize_name(name):
    if not name:
        return ""
    n = name.strip().lower()
    n = re.sub(r"\s+", " ", n)
    n = re.sub(r"[^a-z\s\-']", "", n)
    return n.strip()


def is_garbage(name):
    norm = normalize_name(name)
    if norm in GARBAGE_NAMES:
        return True
    if len(norm) < 2:
        return True
    # Reject names that are clearly form-field labels leaking through (e.g. "Ethnicity:")
    if ":" in (name or ""):
        return True
    return False


def load_jsonl(path):
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def load_square_cache():
    with open(f"{BASE}/square_customers_cache.json") as f:
        return json.load(f)


def main():
    treatment = load_jsonl(f"{BASE}/raw_treatment.jsonl")
    skin_chart = load_jsonl(f"{BASE}/raw_skin_chart.jsonl")
    medical = load_jsonl(f"{BASE}/raw_medical.jsonl")
    square_index = load_square_cache()

    print(f"Loaded: {len(treatment)} treatment, {len(skin_chart)} skin_chart, {len(medical)} medical")
    print(f"Square name index: {len(square_index)} entries")

    clients = defaultdict(lambda: {
        "name_variants": set(),
        "treatments": [],
        "membership_notes": set(),
        "ethnicity": None,
        "skin_type_number": None,
        "skin_colour_score": None,
        "form_submission_count": 0,
        "first_seen": None,
        "last_seen": None,
        "square_match": None,
    })

    def touch_date(bucket, date_str):
        if not date_str:
            return
        if bucket["first_seen"] is None or date_str < bucket["first_seen"]:
            bucket["first_seen"] = date_str
        if bucket["last_seen"] is None or date_str > bucket["last_seen"]:
            bucket["last_seen"] = date_str

    skipped_garbage = 0

    for r in treatment:
        name = r.get("name", "")
        if is_garbage(name):
            skipped_garbage += 1
            continue
        key = normalize_name(name)
        c = clients[key]
        c["name_variants"].add(name.strip())
        c["form_submission_count"] += 1
        area = r.get("treatment_area", "")
        if area:
            c["treatments"].append(area)
        if r.get("membership_note"):
            c["membership_notes"].add(r["membership_note"])
        touch_date(c, r.get("treatment_date") or r.get("_email_date", "")[:16])

    for r in skin_chart:
        name = r.get("name", "")
        if is_garbage(name):
            skipped_garbage += 1
            continue
        key = normalize_name(name)
        c = clients[key]
        c["name_variants"].add(name.strip())
        c["form_submission_count"] += 1
        if r.get("ethnicity") and not c["ethnicity"]:
            c["ethnicity"] = r["ethnicity"]
        if r.get("skin_type_number") and not c["skin_type_number"]:
            c["skin_type_number"] = r["skin_type_number"]
        if r.get("skin_colour_score") and not c["skin_colour_score"]:
            c["skin_colour_score"] = r["skin_colour_score"]
        touch_date(c, r.get("form_date") or r.get("_email_date", "")[:16])

    for r in medical:
        name = r.get("name", "")
        if is_garbage(name):
            skipped_garbage += 1
            continue
        key = normalize_name(name)
        c = clients[key]
        c["name_variants"].add(name.strip())
        c["form_submission_count"] += 1
        touch_date(c, r.get("form_date") or r.get("_email_date", "")[:16])

    print(f"Unique clients after dedup: {len(clients)} (skipped {skipped_garbage} garbage/invalid name rows)")

    # Match against Square for phone/email
    matched = 0
    for key, c in clients.items():
        sq = square_index.get(key)
        if sq:
            c["square_match"] = sq
            matched += 1
        else:
            # Try matching on first-name-only or reversed order as a fallback
            parts = key.split()
            if len(parts) >= 2:
                reversed_key = " ".join(reversed(parts))
                sq = square_index.get(reversed_key)
                if sq:
                    c["square_match"] = sq
                    matched += 1

    print(f"Matched to Square (phone/email found): {matched}/{len(clients)}")

    # Build final rows — ONLY include clients with a Square match (has phone or email)
    final_rows = []
    excluded_no_contact = 0
    for key, c in clients.items():
        sq = c["square_match"]
        if not sq or not (sq.get("phone_number") or sq.get("email_address")):
            excluded_no_contact += 1
            continue
        best_name = sorted(c["name_variants"], key=len, reverse=True)[0]
        # Dedupe treatment area mentions (they repeat heavily across visits, same wording)
        raw_areas = [t.strip() for t in c["treatments"] if t.strip()]
        seen_areas = set()
        unique_areas = []
        for area in raw_areas:
            norm = re.sub(r"\s+", " ", area.lower()).strip(" ,.")
            if norm and norm not in seen_areas:
                seen_areas.add(norm)
                unique_areas.append(area.strip(" ,."))
        treatments_summary = "; ".join(unique_areas)[:500]
        final_rows.append({
            "name": best_name,
            "phone": sq.get("phone_number") or "",
            "email": sq.get("email_address") or "",
            "treatments": treatments_summary,
            "treatment_visit_count": len(c["treatments"]),
            "membership_notes": " | ".join(c["membership_notes"])[:300],
            "ethnicity": c["ethnicity"] or "",
            "skin_type_number": c["skin_type_number"] or "",
            "first_form_date": c["first_seen"] or "",
            "last_form_date": c["last_seen"] or "",
            "total_form_submissions": c["form_submission_count"],
            "square_customer_id": sq.get("id", ""),
        })

    print(f"Excluded (no Square contact info found): {excluded_no_contact}")
    print(f"Final marketing-ready rows: {len(final_rows)}")

    with open(f"{BASE}/merged_clients.json", "w") as f:
        json.dump(final_rows, f, indent=2)
    print(f"Saved to: {BASE}/merged_clients.json")


if __name__ == "__main__":
    main()
