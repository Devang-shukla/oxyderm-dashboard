#!/usr/bin/env python3
"""Content Engine - generates weekly content calendar using Claude.
Creates: 2 blogs, 3 YouTube scripts, 3 reels, GBP posts. Run via cron Sundays."""
import sqlite3, os, json, subprocess, sys
from datetime import datetime, timedelta

DB = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    return conn

def claude(prompt, timeout=300):
    try:
        r = subprocess.run(['claude', '-p', prompt], capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception as e:
        return f"ERROR: {e}"

def week_dates():
    today = datetime.now()
    monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)
    return [(monday + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]

PLAN_PROMPT = """You are the content strategist for Oxyderm Laser Clinic (oxydermlaserclinic.ca), Edmonton AB. Phone: 780-863-7561.

Services: laser hair removal, acne laser treatment, microneedling+PRP, Hollywood carbon facial, IPL photofacial, botox/fillers, chemical peels, skin brightening, radio frequency tightening.

ICP: Women 25-45 Edmonton, interested in hair removal/skin aesthetics; men 25-40 back/chest LHR; brides; event prep.

Target keywords: {keywords}

Create next week's content plan. Return ONLY valid JSON (no markdown fences) as a list:
[{{\"day\": \"Mon\", \"type\": \"youtube|blog|reel|gbp_post\", \"title\": \"...\", \"brief\": \"1-sentence brief\", \"hook_or_keyword\": \"primary keyword or hook\"}}]

Requirements: 2 blogs (Tue/Fri), 3 YouTube (Mon/Wed/Sat), 3 reels, 2 GBP posts. Mix educational + local-intent + promotional. No medical claims/guarantees."""

def generate_week():
    conn = db(); c = conn.cursor()
    kws = [r['keyword'] for r in c.execute("SELECT keyword FROM keywords WHERE used_in_content=0 ORDER BY monthly_volume_est DESC LIMIT 10").fetchall()]
    kw_str = ', '.join(kws) if kws else 'laser hair removal edmonton, microneedling edmonton'
    
    print(f"Asking Claude for content plan (keywords: {kw_str[:80]}...)...")
    raw = claude(PLAN_PROMPT.format(keywords=kw_str))
    
    # strip potential markdown fences
    clean = raw.strip()
    if clean.startswith('```'):
        clean = re.sub(r'^```(json)?\n?|\n```$', '', clean)
    try:
        plan = json.loads(clean)
    except json.JSONDecodeError:
        print("Claude returned invalid JSON, saving raw output")
        with open(os.path.expanduser('~/Desktop/Oxyderm-Build/logs/claude_raw_' + datetime.now().strftime('%H%M') + '.txt'), 'w') as f:
            f.write(raw)
        return
    
    dates = week_dates()
    day_map = {'Mon':0,'Tue':1,'Wed':2,'Thu':3,'Fri':4,'Sat':5,'Sun':6}
    added = 0
    for item in plan:
        sched = dates[day_map.get(item.get('day','Mon'), 0)]
        c.execute("""INSERT INTO content_calendar (piece_type,title,brief,status,scheduled_for,platform_targets)
                     VALUES (?,?,?,?,?,?)""",
                  (item.get('type'), item.get('title'), item.get('brief'),
                   'pending_approval', sched,
                   json.dumps(['instagram','facebook'] if item['type']=='reel' else ['website' if item['type']=='blog' else 'youtube'])))
        added += 1
    
    # mark keywords used
    for kw in kws:
        c.execute("UPDATE keywords SET used_in_content=1 WHERE keyword=?", (kw,))
    
    conn.commit(); conn.close()
    print(f"Added {added} pieces to calendar (pending approval)")

if __name__ == '__main__':
    import re
    generate_week()
