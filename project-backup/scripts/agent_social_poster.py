#!/usr/bin/env python3
"""Lead Shaw Social Poster - queues approved content into Lead Shaw Social Planner.
Uses the logged-in browser session (via CDP) to create draft posts.
NOTE: Actual UI automation is handled by browser_exec; this script manages the queue."""
import sqlite3, os, json
from datetime import datetime

DB = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    return conn

def get_queue():
    conn = db()
    items = conn.execute("""SELECT * FROM content_calendar 
                            WHERE status='approved' AND piece_type IN ('reel','gbp_post')""")
    rows = [dict(r) for r in items.fetchall()]
    conn.close()
    return rows

def mark_scheduled(content_id, leadshaw_id=None):
    conn = db(); c = conn.cursor()
    c.execute("UPDATE content_calendar SET status='scheduled', leadshaw_post_id=? WHERE id=?",
              (leadshaw_id, content_id))
    c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('social_poster','queued_to_leadshaw',?)",
              (json.dumps({'content_id': content_id, 'ls_id': leadshaw_id}),))
    conn.commit(); conn.close()

def report():
    queue = get_queue()
    print(f"{len(queue)} approved pieces ready for Lead Shaw scheduling:")
    for q in queue:
        print(f"  #{q['id']} [{q['scheduled_for']}] {q['piece_type']}: {q['title']}")

if __name__ == '__main__':
    report()
