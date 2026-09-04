#!/usr/bin/env python3
"""Square Sync Agent - pulls customers, appointments, revenue from Square dashboard.
Uses browser session (logged in) via CDP. Falls back gracefully if page changes."""
import sqlite3, os, json
from datetime import datetime

DB = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    return conn

def log_revenue(gross, transactions, date=None):
    conn = db(); c = conn.cursor()
    date = date or datetime.now().strftime('%Y-%m-%d')
    c.execute("INSERT INTO revenue (date, gross_sales, transactions) VALUES (?,?,?)",
              (date, gross, transactions))
    c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('square_sync','revenue',?)",
              (json.dumps({'date': date, 'gross': gross}),))
    conn.commit(); conn.close()
    print(f"Logged revenue {date}: ${gross} ({transactions} txns)")

if __name__ == '__main__':
    # Browser automation part runs through browser_exec with CDP.
    # This script handles the DB side once data is scraped.
    print("Square sync: run browser scrape separately, then call log_revenue()")
    report()
