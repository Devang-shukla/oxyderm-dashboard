#!/usr/bin/env python3
"""Oxyderm Agency OS - Local Dashboard Server (port 7777)"""
import sqlite3, os, json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB = os.path.expanduser('~/.oxyderm/data/oxyderm.db')
STATIC = os.path.expanduser('~/Desktop/Oxyderm-Build/dashboard')

def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def q(sql, params=()):
    conn = db()
    rows = [dict(r) for r in conn.execute(sql, params).fetchall()]
    conn.close()
    return rows

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    
    def _send(self, code, body, ctype='application/json'):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path in ('/', '/index.html'):
            with open(os.path.join(STATIC, 'index.html')) as f:
                return self._send(200, f.read(), 'text/html')
        
        if path == '/api/stats':
            stats = {}
            stats['new_leads'] = q("SELECT COUNT(*) n FROM contacts WHERE stage='new'")[0]['n']
            stats['total_contacts'] = q("SELECT COUNT(*) n FROM contacts")[0]['n']
            stats['pipeline'] = q("SELECT stage, COUNT(*) n FROM contacts GROUP BY stage")
            stats['content_pending'] = q("SELECT COUNT(*) n FROM content_calendar WHERE status='pending_approval'")[0]['n']
            stats['scheduled'] = q("SELECT COUNT(*) n FROM content_calendar WHERE status='scheduled'")[0]['n']
            stats['posted'] = q("SELECT COUNT(*) n FROM content_calendar WHERE status='posted'")[0]['n']
            stats['appointments_upcoming'] = q("SELECT COUNT(*) n FROM appointments WHERE status='scheduled' AND scheduled_for >= datetime('now')")[0]['n']
            kw = q("SELECT COUNT(*) n FROM keywords")[0]['n']
            stats['keywords_tracked'] = kw
            rev = q("SELECT COALESCE(SUM(gross_sales),0) s FROM revenue WHERE date >= date('now','-30 days')")[0]['s']
            stats['revenue_30d'] = rev
            return self._send(200, json.dumps(stats))
        
        if path == '/api/notifications':
            rows = q("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50")
            return self._send(200, json.dumps(rows))

        if path == '/api/contacts':
            return self._send(200, json.dumps(q("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100")))
        
        if path == '/api/content':
            return self._send(200, json.dumps(q("SELECT * FROM content_calendar ORDER BY scheduled_for DESC NULLS LAST, created_at DESC LIMIT 100")))
        
        if path == '/api/keywords':
            return self._send(200, json.dumps(q("SELECT * FROM keywords ORDER BY monthly_volume_est DESC")))
        
        if path.endswith('.html'):
            fname = os.path.basename(path)
            fpath = os.path.join(STATIC, fname)
            if os.path.exists(fpath):
                with open(fpath) as f:
                    return self._send(200, f.read(), 'text/html')

        if path.endswith('.js') or path.endswith('.css'):
            fname = os.path.basename(path)
            fpath = os.path.join(STATIC, fname)
            if os.path.exists(fpath):
                with open(fpath) as f:
                    return self._send(200, f.read(), 'application/javascript' if path.endswith('.js') else 'text/css')
        return self._send(404, '{"error":"not found"}')
    
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        try:
            data = json.loads(self.rfile.read(length) or b'{}')
        except:
            return self._send(400, '{"error":"bad json"}')
        
        path = urlparse(self.path).path
        
        # Lead webhook (from website forms)
        if path == '/api/lead':
            conn = db(); c = conn.cursor()
            c.execute("INSERT INTO contacts (name,email,phone,source,concerns) VALUES (?,?,?,?,?)",
                      (data.get('name'), data.get('email'), data.get('phone'), data.get('source','website'), ','.join(data.get('concerns',[]))))
            cid = c.lastrowid
            c.execute("INSERT INTO agent_log (agent,action,detail) VALUES ('lead_responder','new_lead',?)",
                      (json.dumps(data),))
            conn.commit(); conn.close()
            # Speed-to-lead task queued - responder cron picks it up
            return self._send(200, json.dumps({'ok': True, 'contact_id': cid}))
        
        if path == '/api/approve_content':
            cid = data.get('id')
            conn = db(); c = conn.cursor()
            c.execute("UPDATE content_calendar SET status='approved' WHERE id=?", (cid,))
            c.execute("INSERT INTO tasks (assigned_to,task_type,payload_json,status) VALUES ('social_poster','post_content',?,'queued')",
                      (json.dumps({'content_id': cid}),))
            conn.commit(); conn.close()
            return self._send(200, '{"ok":true}')
        
        return self._send(404, '{"error":"unknown"}')

if __name__ == '__main__':
    os.makedirs(STATIC, exist_ok=True)
    server = HTTPServer(('127.0.0.1', 7777), Handler)
    print('Oxyderm dashboard on http://localhost:7777')
    server.serve_forever()
