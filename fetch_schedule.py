#!/usr/bin/python3
"""
Fetch today's real Square bookings and write schedule.json
Run once every morning via cron.
"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

TOKEN = os.environ.get('SQUARE_ACCESS_TOKEN', '')
if not TOKEN:
    env = {}
    try:
        for line in open(os.path.expanduser('~/.oxyderm/secrets.env')):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"')
        TOKEN = env.get('SQUARE_ACCESS_TOKEN', '')
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
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  API error {path}: {e}")
        return {}

# MDT = UTC-6
MDT = timezone(timedelta(hours=-6))
now_mdt = datetime.now(MDT)
today_start = now_mdt.replace(hour=0, minute=0, second=0, microsecond=0)
today_end   = today_start + timedelta(days=1)

start_z = today_start.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
end_z   = today_end.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

print(f"Fetching bookings for {today_start.strftime('%A %B %d, %Y')} (MDT)...")

data = sq_get(f"/bookings?start_at_min={start_z}&start_at_max={end_z}&limit=50")
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

# Fetch payment history per customer (last 20 orders)
def get_visit_count(customer_id):
    try:
        body = json.dumps({"location_ids": ["SA5CTAH41JNY2"], "customer_id": customer_id, "limit": 100}).encode()
        req = urllib.request.Request(BASE + "/orders/search", data=body, headers=HEADERS, method='POST')
        with urllib.request.urlopen(req, timeout=10) as r:
            od = json.loads(r.read())
        orders = od.get('orders', [])
        return len([o for o in orders if o.get('state') in ('COMPLETED', 'OPEN')])
    except Exception:
        return None

# Build schedule
schedule = []
for b in sorted(bookings, key=lambda x: x.get('start_at','')):
    status = b.get('status','')
    if status == 'CANCELLED_BY_SELLER' or status == 'CANCELLED_BY_BUYER':
        continue

    cid = b.get('customer_id','')
    cust = customers.get(cid, {"name": "Unknown", "email": "", "phone": ""})

    start_utc = datetime.strptime(b['start_at'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    start_mdt = start_utc.astimezone(MDT)
    time_str = start_mdt.strftime('%I:%M %p').lstrip('0')

    seg = b.get('appointment_segments', [{}])[0]
    duration = seg.get('duration_minutes', 60)

    note = b.get('seller_note', '')

    # Parse visit number from note (Tx7, Tx11, etc.)
    import re
    tx_match = re.search(r'Tx\s*(\d+)', note, re.IGNORECASE)
    visit_num = int(tx_match.group(1)) if tx_match else None

    # Determine visit suffix
    def ordinal(n):
        if n is None: return "Unknown visit"
        s = {1:'1st',2:'2nd',3:'3rd'}.get(n % 10 if n % 100 not in [11,12,13] else 0, f'{n}th')
        return s + ' visit'

    # Parse treatment areas
    area_match = re.search(r'Treatment area[:\s]+(.+?)(?:\n|$)', note, re.IGNORECASE)
    areas = area_match.group(1).strip() if area_match else ''

    # Parse payment from note
    paid_match = re.search(r'Paid[^\n$]*\$[\d.]+[^\n]*', note, re.IGNORECASE)
    balance_match = re.search(r'[Bb]alance[^\n$]*\$[\d.]+[^\n]*', note, re.IGNORECASE)
    payment_note = ''
    if paid_match:
        payment_note = paid_match.group(0).strip()[:100]
    if balance_match:
        payment_note += (' | ' if payment_note else '') + balance_match.group(0).strip()[:100]

    # Special flags
    flags = []
    if '17 yrs' in note or 'minor' in note.lower():
        flags.append('Minor - parent in room')
    if 'no face' in note.lower() or 'no social' in note.lower():
        flags.append('No face on social media')
    if 'google review' in note.lower():
        flags.append('Left Google review')

    schedule.append({
        "time": time_str,
        "name": cust["name"],
        "phone": cust["phone"],
        "email": cust["email"],
        "service": "Laser Hair Removal" if 'lhr' in note.lower() or 'laser' in areas.lower() or areas else "Treatment",
        "areas": areas,
        "duration_min": duration,
        "visit": ordinal(visit_num),
        "visit_num": visit_num,
        "payment": payment_note or "See Square",
        "flags": flags,
        "raw_note": note[:500],
        "status": status,
    })
    print(f"  {time_str}: {cust['name']} | {ordinal(visit_num)} | {areas[:60]}")

output = {
    "date": today_start.strftime('%A, %B %d, %Y'),
    "fetched_at": datetime.now(MDT).strftime('%I:%M %p MDT'),
    "appointments": schedule,
    "total": len(schedule),
    "revenue_today": sum(1 for a in schedule),  # placeholder
}

out_path = os.path.join(os.path.dirname(__file__), 'schedule.json')
with open(out_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSchedule saved to {out_path}")
print(f"Total appointments: {len(schedule)}")
