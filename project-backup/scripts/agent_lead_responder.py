#!/usr/bin/env python3
"""Lead Responder Agent - speed-to-lead + follow-up sequences.
Run via cron every 5 min. Sends templated replies, moves pipeline stages."""
import sqlite3, os, json
from datetime import datetime

DB = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')
CLINIC = {"name": "Oxyderm Laser Clinic", "phone": "780-863-7561", "site": "oxydermlaserclinic.ca"}

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    return conn

INSTANT_REPLY = """Hi {name}, thank you for reaching out to {clinic}! 💜

We received your interest in {concerns_text} and would love to help.

Fastest way to get started: book a FREE consultation at {site}/contact or reply here with your availability.

Questions? Call us: {phone}
— The {clinic} Team"""

FOLLOWUP_DAY1 = """Hi {name}! Quick follow-up from {clinic} 😊

Still thinking about {concerns_short}? Most clients see visible results within a few sessions — and consultations are completely free.

Want me to grab you a spot this week? Just reply YES and we'll find a time that works."""

FOLLOWUP_DAY7 = """Hi {name}, last note from {clinic}!

Your free consultation is still waiting for you 📅 No pressure — but summer skin starts now, and {concerns_short} treatments book up fast this season.

Book anytime: {site}/contact or call {phone}. Hope to see you soon!"""

CONCERN_SHORT = {
    'laser hair removal': 'laser hair removal',
    'acne': 'acne treatment',
    'microneedling': 'skin rejuvenation',
}

def concern_text(concerns):
    if not concerns: return 'our treatments'
    items = [c.strip() for c in concerns.split(',')]
    return CONCERN_SHORT.get(items[0], items[0]) if items else 'our treatments'

def process_new_leads():
    conn = db(); c = conn.cursor()
    leads = c.execute("SELECT * FROM contacts WHERE stage='new' AND (last_contacted IS NULL)").fetchall()
    sent = 0
    for lead in leads:
        msg = INSTANT_REPLY.format(
            name=(lead['name'] or 'there').split()[0],
            clinic=CLINIC['name'], phone=CLINIC['phone'], site=CLINIC['site'],
            concerns_text=concern_text(lead['concerns']))
        # Log the message (actual send goes through Lead Shaw Conversations once wired)
        c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('lead_responder','instant_reply_sent',?)",
                  (json.dumps({'to': lead['email'] or lead['phone'], 'message': msg[:100]}),))
        c.execute("UPDATE contacts SET stage='contacted', last_contacted=CURRENT_TIMESTAMP WHERE id=?", (lead['id'],))
        c.execute("INSERT INTO pipeline_history (contact_id, from_stage, to_stage) VALUES (?, 'new', 'contacted')", (lead['id'],))
        sent += 1
    conn.commit(); conn.close()
    if sent: print(f"[{datetime.now()}] Sent {sent} instant replies")

def process_followups():
    conn = db(); c = conn.cursor()
    day1 = c.execute("""SELECT * FROM contacts WHERE stage='contacted' 
                        AND last_contacted <= datetime('now','-1 day') 
                        AND last_contacted > datetime('now','-2 day')""").fetchall()
    for lead in day1:
        msg = FOLLOWUP_DAY1.format(name=(lead['name'] or 'there').split()[0],
                                   clinic=CLINIC['name'],
                                   concerns_short=concern_text(lead['concerns']))
        c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('lead_responder','followup_day1',?)",
                  (json.dumps({'to': lead['email'] or lead['phone']}),))
    
    day7 = c.execute("""SELECT * FROM contacts WHERE stage='contacted' 
                        AND last_contacted <= datetime('now','-7 days')""").fetchall()
    for lead in day7:
        msg = FOLLOWUP_DAY7.format(name=(lead['name'] or 'there').split()[0],
                                   clinic=CLINIC['name'], phone=CLINIC['phone'], site=CLINIC['site'],
                                   concerns_short=concern_text(lead['concerns']))
        c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('lead_responder','followup_day7',?)",
                  (json.dumps({'to': lead['email'] or lead['phone']}),))
        c.execute("UPDATE contacts SET stage='nurture' WHERE id=?", (lead['id'],))
        c.execute("INSERT INTO pipeline_history (contact_id, from_stage, to_stage) VALUES (?, 'contacted', 'nurture')", (lead['id'],))
    
    total = len(day1) + len(day7)
    conn.commit(); conn.close()
    if total: print(f"[{datetime.now()}] Sent {total} follow-ups")

if __name__ == '__main__':
    process_new_leads()
    process_followups()
