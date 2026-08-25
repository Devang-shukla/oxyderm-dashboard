#!/usr/bin/python3
"""
Fetch 7 days of Square bookings and write schedule.json
Run once every morning via cron (7am).
"""
import json, os, sys, urllib.request, urllib.error, re
from datetime import datetime, timezone, timedelta

TOKEN = os.environ.get('SQUARE_ACCESS_TOKEN', '')
if not TOKEN:
    try:
        for line in open(os.path.expanduser('~/.oxyderm/secrets.env')):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                if k.strip() == 'SQUARE_ACCESS_TOKEN':
                    TOKEN = v.strip().strip('"')
    except Exception:
        pass

if not TOKEN:
    print("ERROR: No SQUARE_ACCESS_TOKEN found")
    sys.exit(1)

BASE = "https://connect.squareup.com/v2"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Square-Version": "2024-01-17", "Content-Type": "application/json"}

def sq_get(path):
    req = urllib.request.Request(BASE + path, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  API error {path}: {e}")
        return {}

# MDT = UTC-6
MDT = timezone(timedelta(hours=-6))
now_mdt = datetime.now(MDT)
week_start = now_mdt.replace(hour=0, minute=0, second=0, microsecond=0)
week_end   = week_start + timedelta(days=7)

start_z = week_start.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
end_z   = week_end.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

print(f"Fetching bookings {week_start.strftime('%b %d')} - {week_end.strftime('%b %d')} (MDT)...")

data = sq_get(f"/bookings?start_at_min={start_z}&start_at_max={end_z}&limit=100")
bookings = data.get('bookings', [])
print(f"  Found {len(bookings)} bookings")

# Collect unique customer IDs
customer_ids = list(set(b.get('customer_id','') for b in bookings if b.get('customer_id')))

# Batch fetch customers
customers = {}
for cid in customer_ids:
    cd = sq_get(f"/customers/{cid}")
    c = cd.get('customer', {})
    customers[cid] = {
        "name": f"{c.get('given_name','')} {c.get('family_name','')}".strip() or "Unknown",
        "email": c.get('email_address', ''),
        "phone": c.get('phone_number', ''),
    }

def ordinal(n):
    if n is None: return "Unknown visit"
    s = {1:'1st',2:'2nd',3:'3rd'}.get(n % 10 if n % 100 not in [11,12,13] else 0, f'{n}th')
    return s + ' visit'

# Group by date
by_date = {}
for b in sorted(bookings, key=lambda x: x.get('start_at','')):
    status = b.get('status','')
    if status in ('CANCELLED_BY_SELLER', 'CANCELLED_BY_BUYER'):
        continue

    cid = b.get('customer_id','')
    cust = customers.get(cid, {"name": "Unknown", "email": "", "phone": ""})

    start_utc = datetime.strptime(b['start_at'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    start_mdt = start_utc.astimezone(MDT)
    date_key  = start_mdt.strftime('%Y-%m-%d')
    date_label = start_mdt.strftime('%A, %B %d')
    time_str  = start_mdt.strftime('%I:%M %p').lstrip('0')

    seg = b.get('appointment_segments', [{}])[0]
    duration = seg.get('duration_minutes', 60)
    note = b.get('seller_note', '')

    tx_match = re.search(r'Tx\s*(\d+)', note, re.IGNORECASE)
    visit_num = int(tx_match.group(1)) if tx_match else None

    area_match = re.search(r'Treatment area[:\s]+(.+?)(?:\n|$)', note, re.IGNORECASE)
    areas = area_match.group(1).strip() if area_match else ''

    paid_match = re.search(r'Paid[^\n$]*\$[\d.]+[^\n]*', note, re.IGNORECASE)
    balance_match = re.search(r'[Bb]alance[^\n$]*\$[\d.]+[^\n]*', note, re.IGNORECASE)
    payment_note = ''
    if paid_match:
        payment_note = paid_match.group(0).strip()[:100]
    if balance_match:
        payment_note += (' | ' if payment_note else '') + balance_match.group(0).strip()[:100]

    flags = []
    if '17 yrs' in note or 'minor' in note.lower():
        flags.append('Minor - parent in room')
    if 'no face' in note.lower() or 'no social' in note.lower():
        flags.append('No face on social media')
    if 'google review' in note.lower():
        flags.append('Left Google review')

    entry = {
        "time": time_str,
        "date": date_key,
        "date_label": date_label,
        "name": cust["name"],
        "phone": cust["phone"],
        "email": cust["email"],
        "service": "Laser Hair Removal" if ('lhr' in note.lower() or 'laser' in areas.lower()) else "Treatment",
        "areas": areas,
        "duration_min": duration,
        "visit": ordinal(visit_num),
        "visit_num": visit_num,
        "payment": payment_note or "See Square",
        "flags": flags,
        "raw_note": note[:500],
        "status": status,
        "booking_id": b.get('id',''),
    }

    if date_key not in by_date:
        by_date[date_key] = {"date": date_key, "label": date_label, "appointments": []}
    by_date[date_key]["appointments"].append(entry)
    print(f"  {date_label} {time_str}: {cust['name']} | {ordinal(visit_num)}")

# Also flatten today
today_key = week_start.strftime('%Y-%m-%d')
today_appts = by_date.get(today_key, {}).get('appointments', [])

output = {
    "fetched_at": datetime.now(MDT).strftime('%I:%M %p MDT'),
    "today": today_key,
    "week_start": week_start.strftime('%Y-%m-%d'),
    "week_end": (week_end - timedelta(days=1)).strftime('%Y-%m-%d'),
    "appointments": today_appts,   # today only (backward compat)
    "week": list(by_date.values()), # full 7 days
    "total_week": sum(len(v['appointments']) for v in by_date.values()),
}

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schedule.json')
with open(out_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSchedule saved: {out_path}")
print(f"Today: {len(today_appts)} | Week total: {output['total_week']}")
