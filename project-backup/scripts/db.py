#!/usr/bin/env python3
"""Oxyderm Agency OS - Database schema + init"""
import sqlite3, os, json
from datetime import datetime

DB_PATH = os.path.expanduser('~/Desktop/Oxyderm-Build/data/oxyderm.db')

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init():
    conn = get_db()
    c = conn.cursor()
    
    c.executescript('''
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        config_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY,
        leadshaw_id TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        source TEXT,
        concerns TEXT,
        stage TEXT DEFAULT 'new',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_contacted TEXT
    );
    
    CREATE TABLE IF NOT EXISTS pipeline_history (
        id INTEGER PRIMARY KEY,
        contact_id INTEGER,
        from_stage TEXT,
        to_stage TEXT,
        changed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY,
        contact_id INTEGER,
        service TEXT,
        scheduled_for TEXT,
        status TEXT DEFAULT 'scheduled',
        reminder_sent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS content_calendar (
        id INTEGER PRIMARY KEY,
        client_id INTEGER DEFAULT 1,
        piece_type TEXT,          -- blog | youtube | reel | story | gbp_post | graphic
        title TEXT,
        brief TEXT,
        script_or_body TEXT,
        status TEXT DEFAULT 'draft',  -- draft | pending_approval | approved | scheduled | posted
        scheduled_for TEXT,
        platform_targets TEXT,    -- json list
        leadshaw_post_id TEXT,
        url TEXT,
        metrics_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY,
        keyword TEXT,
        intent TEXT,              -- informational | commercial | local
        monthly_volume_est INTEGER,
        difficulty_est INTEGER,
        target_page TEXT,
        used_in_content INTEGER DEFAULT 0,
        discovered_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS social_metrics (
        id INTEGER PRIMARY KEY,
        platform TEXT,
        post_id TEXT,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        leads_attributed INTEGER DEFAULT 0,
        captured_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS revenue (
        id INTEGER PRIMARY KEY,
        date TEXT,
        gross_sales REAL,
        transactions INTEGER,
        source TEXT DEFAULT 'square'
    );
    
    CREATE TABLE IF NOT EXISTS agent_log (
        id INTEGER PRIMARY KEY,
        agent TEXT,
        action TEXT,
        detail TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        assigned_to TEXT,
        task_type TEXT,
        payload_json TEXT,
        status TEXT DEFAULT 'queued',  -- queued | running | done | failed
        result TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
    );
    
    -- Seed default client
    INSERT OR IGNORE INTO clients (id, name) 
    SELECT 1, 'Oxyderm Laser Clinic'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 1);
    ''')
    
    # load and seed keywords for Oxyderm
    profile_path = os.path.expanduser('~/Desktop/Oxyderm-Build/data/client-profile.json')
    if os.path.exists(profile_path):
        with open(profile_path) as f:
            profile = json.load(f)
        seed_keywords = [
            ("laser hair removal edmonton", "local", 880, 35),
            ("laser hair removal cost edmonton", "commercial", 320, 30),
            ("bikini laser hair removal edmonton", "local", 140, 25),
            ("acne scar treatment edmonton", "local", 260, 32),
            ("microneedling edmonton", "local", 480, 28),
            ("microneedling with prp edmonton", "commercial", 170, 25),
            ("hollywood carbon facial edmonton", "commercial", 90, 15),
            ("ipl photofacial edmonton", "local", 130, 22),
            ("best laser clinic edmonton", "commercial", 210, 38),
            ("chemical peel edmonton", "local", 190, 24),
            ("skin brightening facial edmonton", "commercial", 70, 18),
            ("botox edmonton", "commercial", 1300, 55),
            ("how many laser sessions for hair removal", "informational", 590, 20),
            ("does laser hair removal hurt", "informational", 720, 25),
            ("laser hair removal before and after", "informational", 480, 30),
        ]
        for kw, intent, vol, diff in seed_keywords:
            c.execute("INSERT OR IGNORE INTO keywords (keyword, intent, monthly_volume_est, difficulty_est) VALUES (?,?,?,?)",
                      (kw, intent, vol, diff))
    
    conn.commit()
    conn.close()
    print("DB initialized at", DB_PATH)

if __name__ == '__main__':
    init()
