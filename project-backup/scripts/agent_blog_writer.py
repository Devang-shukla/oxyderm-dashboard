#!/usr/bin/env python3
"""Blog Writer Agent - writes full blog posts for approved blog calendar items.
Run via cron or on-demand. Output saved to content/ folder as HTML-ready markdown."""
import sqlite3, os, subprocess, json
from datetime import datetime

DB = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')
OUT = os.path.expanduser('~/Desktop/Oxyderm-Build/content/blogs')

BLOG_PROMPT = """Write a complete SEO-optimized blog post for Oxyderm Laser Clinic (oxydermlaserclinic.ca), a laser clinic in Edmonton, AB. Phone: 780-863-7561.

Title: {title}
Brief: {brief}
Primary keyword: {keyword}

Requirements:
- 900-1200 words
- H2/H3 structure, short paragraphs, scannable
- Natural keyword usage (no stuffing)
- Local Edmonton references where natural
- End with a CTA: "Book your free consultation at oxydermlaserclinic.ca or call 780-863-7561"
- No medical guarantees; educational tone
- Include an FAQ section with 3 questions

Return ONLY the post in clean markdown (H1 title first). No commentary."""

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    return conn

def write_blogs():
    os.makedirs(OUT, exist_ok=True)
    conn = db(); c = conn.cursor()
    items = c.execute("SELECT * FROM content_calendar WHERE piece_type='blog' AND status='approved' AND script_or_body IS NULL").fetchall()
    
    if not items:
        print("No approved blogs awaiting writing")
        return
    
    for item in items:
        print(f"Writing: {item['title']}...")
        prompt = BLOG_PROMPT.format(title=item['title'], brief=item['brief'] or '', 
                                     keyword=(item['brief'] or 'laser hair removal edmonton')[:80])
        r = subprocess.run(['claude', '-p', prompt], capture_output=True, text=True, timeout=420)
        body = r.stdout.strip()
        
        if not body or body.startswith('ERROR'):
            print(f"  FAILED: {body[:100]}")
            continue
        
        slug = item['title'].lower().replace(' ', '-').replace('?','').replace(':','')[:60]
        fname = f"{item['scheduled_for']}_{slug}.md"
        with open(os.path.join(OUT, fname), 'w') as f:
            f.write(body)
        
        c.execute("UPDATE content_calendar SET script_or_body=?, status='pending_approval' WHERE id=?",
                  (body[:200] + '...[full text in file]', item['id']))
        c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('blog_writer','blog_written',?)", (fname,))
        conn.commit()
        print(f"  Saved: {fname} ({len(body)} chars)")
    
    conn.close()

if __name__ == '__main__':
    write_blogs()
