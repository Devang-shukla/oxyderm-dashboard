#!/usr/bin/env python3
"""
Pulls ALL Square customers (paginated) into a local JSON cache for fast
name-based lookup, since Square's search API doesn't do fuzzy full-name
search well and 6000+ individual API calls would be slow + rate-limited.

Note: customers imported via old MERGE operations (circa 2022) have
corrupted given_name fields (a timestamp string instead of a real name).
Those records are excluded from the name-lookup index — we can't reliably
match by name against garbage data. Fresh/DIRECTORY-sourced customers have
clean names and ARE included.
"""
import os
import json
import re
import time
import urllib.request

API_URL = "https://connect.squareup.com/v2/customers"
OUT_PATH = "/Users/genesis/Desktop/Oxyderm-Build/data/form_extraction/square_customers_cache.json"

TIMESTAMP_NAME_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4},")


def get_token():
    # Read from the same secrets.env the rest of the system uses
    with open(os.path.expanduser("~/.oxyderm/secrets.env")) as f:
        for line in f:
            if line.startswith("SQUARE_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("SQUARE_ACCESS_TOKEN not found in secrets.env")


def fetch_all_customers(token):
    customers = []
    cursor = None
    page = 0
    while True:
        page += 1
        url = f"{API_URL}?limit=100"
        if cursor:
            url += f"&cursor={cursor}"
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {token}",
            "Square-Version": "2024-01-17"
        })
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
        batch = data.get("customers", [])
        customers.extend(batch)
        print(f"  page {page}: +{len(batch)} (total {len(customers)})", flush=True)
        cursor = data.get("cursor")
        if not cursor:
            break
        time.sleep(0.2)  # be polite to Square's rate limits
    return customers


def build_name_index(customers):
    """Maps normalized full name -> customer record, skipping corrupted names."""
    index = {}
    skipped_corrupt = 0
    for c in customers:
        given = (c.get("given_name") or "").strip()
        family = (c.get("family_name") or "").strip()
        if not given and not family:
            continue
        if TIMESTAMP_NAME_RE.match(given):
            skipped_corrupt += 1
            continue
        full_name = f"{given} {family}".strip().lower()
        full_name = re.sub(r"\s+", " ", full_name)
        index[full_name] = {
            "id": c.get("id"),
            "given_name": given,
            "family_name": family,
            "email_address": c.get("email_address"),
            "phone_number": c.get("phone_number"),
        }
    return index, skipped_corrupt


def main():
    token = get_token()
    print("Fetching all Square customers...", flush=True)
    customers = fetch_all_customers(token)
    print(f"Total customers fetched: {len(customers)}", flush=True)

    index, skipped = build_name_index(customers)
    print(f"Name index built: {len(index)} usable entries, {skipped} skipped (corrupted names)", flush=True)

    with open(OUT_PATH, "w") as f:
        json.dump(index, f)
    print(f"Saved to: {OUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
