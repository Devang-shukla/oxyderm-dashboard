#!/usr/bin/env python3
"""Weekly Report Agent - generates the Monday report from DB. Run Mondays 8am."""
import sqlite3, os, json
from datetime import datetime

DB = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')
OUT = os.path.expanduser('~/Desktop/Oxyderm-Build/content/reports')

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    return conn

def generate():
    os.makedirs(OUT, exist_ok=True)
    conn = db()
    week_ago = "datetime('now','-7 days')"
    
    new_leads = conn.execute(f"SELECT COUNT(*) n FROM contacts WHERE created_at >= {week_ago}").fetchone()['n']
    by_stage = [dict(r) for r in conn.execute("SELECT stage, COUNT(*) n FROM contacts GROUP BY stage").fetchall()]
    content = [dict(r) for r in conn.execute(f"SELECT status, COUNT(*) n FROM content_calendar WHERE created_at >= {week_ago} GROUP BY status").fetchall()]
    rev = conn.execute(f"SELECT COALESCE(SUM(gross_sales),0) s, COUNT(*) t FROM revenue WHERE date >= date('now','-7 days')").fetchone()
    agent_activity = [dict(r) for r in conn.execute(f"SELECT agent, action, COUNT(*) n FROM agent_log WHERE created_at >= {week_ago} GROUP BY agent, action").fetchall()]
    
    lines = [
        f"# Oxyderm Weekly Report — {datetime.now().strftime('%b %d, %Y')}",
        "",
        f"## Leads",
        f"- New this week: **{new_leads}**",
        f"- Pipeline: " + ", ".join(f"{r['stage']}: {r['n']}" for r in by_stage),
        "",
        "## Content",
    ]
    lines += [f"- {r['status'].replace('_',' ')}: {r['n']}" for r in content]
    lines += ["", f"## Revenue", f"- Week: ${rev['s']:.2f} ({rev['t']} transactions)", "", "## Agent Activity"]
    lines += [f"- {r['agent']}.{r['action']}: {r['n']}x" for r in agent_activity]
    
    fname = datetime.now().strftime('weekly_%Y%m%d.md')
    with open(os.path.join(OUT, fname), 'w') as f:
        f.write('\n'.join(lines))
    print(f"Report saved: {fname}")
    print('\n'.join(lines))

if __name__ == '__main__':
    generate()
