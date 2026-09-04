# Deployment & Configuration Guide

**Date:** August 26, 2026  
**Status:** Ready for Production

---

## Deployment Checklist

### GitHub Pages (Dashboard Frontend)

**Already Live:** https://devang-shukla.github.io/oxyderm-dashboard/

**To update dashboard:**
```bash
cd ~/Desktop/Oxyderm-Build/dashboard
git add index.html
git commit -m "Sarah upgrade: real-time appointments, web search, conversation persistence"
git push origin main
# Live in ~1 minute
```

**Test:**
```bash
curl -s https://devang-shukla.github.io/oxyderm-dashboard/ | grep -i "sarah\|agent" | head -5
```

---

### HostGator Backend (API + MySQL)

**Endpoint (pending DNS):** https://oxydermshop.com/api/api.php

#### Step 1: Add DNS Records

**Where:** cPanel → Zone Editor → oxydermshop.com

**Add these records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 192.185.4.152 | 14400 |
| A | www | 192.185.4.152 | 14400 |

**Wait 5-30 minutes for propagation.**

**Verify:**
```bash
nslookup oxydermshop.com
# Should return: 192.185.4.152

dig oxydermshop.com +short
# Should return: 192.185.4.152
```

#### Step 2: Upload API PHP File

**File:** `~/Desktop/Oxyderm-Build/api/api.php`

**Target:** `/home2/oxydenic/public_html/oxydermshop.com/api/api.php`

**Via cPanel File Manager (Recommended):**
1. Login to HostGator → cPanel
2. File Manager → Navigate to `/home2/oxydenic/public_html/`
3. Create folder: `oxydermshop.com` (if not exists)
4. Inside that folder, create: `api` folder
5. Upload `api.php` into the `api` folder
6. Set permissions to 644

**Via Command Line (if FTP works):**
```bash
scp ~/Desktop/Oxyderm-Build/api/api.php \
  oxydenic@gator4140.hostgator.com:/home2/oxydenic/public_html/oxydermshop.com/api/api.php
```

**Via cPanel UAPI (if available):**
```bash
source ~/.oxyderm/secrets.env
curl -s -H "Authorization: cpanel oxydenic:$HOSTGATOR_CPANEL_API" \
  -F "file=@$HOME/Desktop/Oxyderm-Build/api/api.php" \
  "https://gator4140.hostgator.com:2083/execute/Fileman/upload_files?dir=%2Fhome2%2Foxydenic%2Fpublic_html%2Foxydermshop.com%2Fapi&overwrite=1"
```

#### Step 3: Test API Health

**After DNS propagates and file is uploaded:**

```bash
# Test health check
curl -s 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV&action=health' | jq .

# Expected response:
# { "ok": true, "timestamp": "2026-08-26T...", "database": "connected" }
```

#### Step 4: Sync Initial Data

**Load today's appointments from schedule.json:**

```bash
# Read schedule.json
APPTS=$(cat ~/Desktop/Oxyderm-Build/dashboard/schedule.json | jq '.appointments[]' | jq -s '.')

# Send to API
curl -s -X POST 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV' \
  -H 'Content-Type: application/json' \
  -d "{\"action\": \"appointments_sync\", \"appointments\": $APPTS}" | jq .

# Expected response:
# { "ok": true, "synced": 19 }
```

#### Step 5: Set Up Automatic Daily Sync (Cron)

**Create sync script:** `/home2/oxydenic/public_html/oxydermshop.com/sync-schedule.php`

```php
<?php
// sync-schedule.php - Runs daily via cron to load appointments from Square
require 'api/api.php'; // Reuse API functions

// TODO: Fetch from Square API using SQUARE_ACCESS_TOKEN
// For now, manually add appointments via dashboard

// After Square integration is live, this will:
// 1. Call Square Appointments API
// 2. Format appointments
// 3. Call api.php with appointments_sync action
?>
```

**Add cron job (cPanel → Cron Jobs):**

| Minute | Hour | Day | Month | Day of Week | Command |
|--------|------|-----|-------|-------------|---------|
| 0 | 7 | * | * | * | `/usr/bin/curl -s 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV&action=health'` |

This verifies API is alive each morning. After Square integration, upgrade to call `appointments_sync`.

---

## Database Configuration

### Tables Auto-Created

On first API call, these tables are created automatically:

```sql
agent_memory        -- Agent learned knowledge
conversations       -- Every Sarah interaction
appointments        -- Daily appointments from Square
clients             -- Full client database (2,749 records)
```

### Manual Database Setup (if needed)

**SSH to HostGator:**
```bash
ssh oxydenic@gator4140.hostgator.com
mysql -u oxydenic_ai -p oxydenic_WP3DT
```

**Manually create tables:**
```sql
CREATE TABLE agent_memory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  content LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source VARCHAR(50) DEFAULT 'user',
  UNIQUE KEY unique_agent_category (agent_id, category),
  INDEX idx_agent (agent_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create other tables similarly...
```

### Backup Database

**Automatic:** HostGator backs up daily (stored 30 days).

**Manual backup:**
```bash
mysqldump -u oxydenic_ai -p oxydenic_WP3DT > ~/oxyderm_backup_$(date +%Y%m%d).sql
```

---

## Environment Variables & Secrets

**Location:** `~/.oxyderm/secrets.env`

**Required for API to work:**
```bash
HOSTGATOR_DB_HOST=localhost
HOSTGATOR_DB_NAME=oxydenic_WP3DT
HOSTGATOR_DB_USER=oxydenic_ai
HOSTGATOR_DB_PASS=!3n0vD4*XW+SU!pH
```

**In PHP script (on HostGator):**
```php
// These use environment or hardcoded defaults
$DB_HOST = getenv('HOSTGATOR_DB_HOST') ?: 'localhost';
$DB_NAME = getenv('HOSTGATOR_DB_NAME') ?: 'oxydenic_WP3DT';
$DB_USER = getenv('HOSTGATOR_DB_USER') ?: 'oxydenic_ai';
$DB_PASS = getenv('HOSTGATOR_DB_PASS') ?: 'PASSWORD';
$API_KEY = 'REDACTED_SET_VIA_SECRETS_ENV';
```

**API Key:** Can be changed in `api.php` line 25:
```php
$API_KEY = 'REDACTED_SET_VIA_SECRETS_ENV'; // Change this
```

---

## Testing Post-Deployment

### 1. Health Check
```bash
curl 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV&action=health' | jq
```

### 2. Load Appointments Today
```bash
curl 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV&action=appointments_today' | jq
```

### 3. Search Clients
```bash
curl -X POST 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV' \
  -H 'Content-Type: application/json' \
  -d '{"action":"client_search","query":"harpreet"}' | jq
```

### 4. Save a Conversation
```bash
curl -X POST 'https://oxydermshop.com/api/api.php?key=REDACTED_SET_VIA_SECRETS_ENV' \
  -H 'Content-Type: application/json' \
  -d '{"action":"conversation_save","user_input":"Who is next?","sarah_response":"Morgan at 12pm.","session":"test"}' | jq
```

### 5. Check Dashboard
Open in browser:
```
https://devang-shukla.github.io/oxyderm-dashboard/
```

**Verify:**
- Appointments load (check browser console for "Loaded N appointments from API")
- Sarah responds to questions
- Microphone works (if on HTTPS)
- Agent chat functional

---

## Troubleshooting Deployment

### DNS Not Propagating

**Symptom:** `curl` returns "Could not resolve host"

**Fix:**
1. Check nameservers: `dig oxydermshop.com NS`
2. Should show: `ns8279.hostgator.com`, `ns8280.hostgator.com`
3. If not, verify in HostGator account nameservers are set correctly
4. Wait 24 hours for global propagation (usually 5-30 min)

### API Returns 500 Error

**Symptom:** `curl` returns `{"error": "Database connection failed"}`

**Fixes:**
1. Check `api.php` is at correct path: `/home2/oxydenic/public_html/oxydermshop.com/api/api.php`
2. Verify MySQL credentials in `api.php` match `secrets.env`
3. Test MySQL: `mysql -h localhost -u oxydenic_ai -p oxydenic_WP3DT -e "SELECT 1"`
4. Check file permissions: `chmod 644 api.php`

### Dashboard Won't Load Appointments

**Symptom:** Schedule tab shows "No appointments" or "Thinking..."

**Checks:**
1. Open browser console (F12)
2. Look for error messages
3. Check `API_BASE` is correct: `https://oxydermshop.com/api.php`
4. Verify API_KEY matches (both in `index.html` and `api.php`)
5. Test health check: `curl 'https://oxydermshop.com/api.php?key=...&action=health'`

### Microphone Not Working

**Symptom:** Microphone icon doesn't respond or says "Not supported"

**Fixes:**
1. Must be HTTPS (not HTTP)
2. Browser must support Web Speech API (Chrome, Safari, Edge)
3. Grant microphone permission when prompted
4. Check no other tab is using microphone
5. Try text input instead

### Conversations Not Saving

**Symptom:** Chats work but aren't stored in database

**Checks:**
1. Open browser console (F12)
2. API calls should show in Network tab
3. Check `apiCall()` function in `index.html` (line ~712)
4. Verify API_KEY in header matches server-side
5. Test directly: `curl -X POST 'https://oxydermshop.com/api.php...' ...`

---

## Rollback Plan

**If something breaks:**

1. **Dashboard:** Restore from backup
   ```bash
   cd ~/Desktop/Oxyderm-Build/dashboard
   cp index.html.backup index.html
   git add index.html
   git commit -m "Rollback to previous version"
   git push
   ```

2. **API:** Restore backup script
   ```bash
   cp ~/Desktop/Oxyderm-Build/api/api.php.backup \
      /home2/oxydenic/public_html/oxydermshop.com/api/api.php
   ```

3. **Database:** Restore from daily backup (HostGator cPanel)

---

## Performance Tuning (Post-Deployment)

### Caching Optimization

**Add to `api.php` headers:**
```php
header('Cache-Control: public, max-age=300'); // 5 min cache
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 300));
```

### Database Query Optimization

**Verify indexes exist:**
```sql
SHOW INDEX FROM agent_memory;
SHOW INDEX FROM conversations;
SHOW INDEX FROM appointments;
SHOW INDEX FROM clients;
```

**Add if missing:**
```sql
ALTER TABLE conversations ADD INDEX idx_session (session_id);
ALTER TABLE conversations ADD INDEX idx_created (created_at);
ALTER TABLE clients ADD INDEX idx_name (name);
ALTER TABLE clients ADD INDEX idx_visit_count (visit_count);
```

### Monitor API Load

**Check error logs on HostGator:**
```bash
tail -f /home2/oxydenic/logs/error_log
tail -f /home2/oxydenic/logs/access_log
```

---

## Security Best Practices

1. **Change API Key** from default before going live:
   ```php
   // api.php line 25
   $API_KEY = 'your_new_secret_key_here';
   // Update in index.html too: API_KEY = 'your_new_secret_key_here'
   ```

2. **Restrict API Access** (optional):
   ```php
   // Allow only dashboard domain
   if ($_SERVER['HTTP_ORIGIN'] !== 'https://devang-shukla.github.io') {
       http_response_code(403);
       exit;
   }
   ```

3. **Enable HTTPS Only:**
   - Already enabled for oxydermshop.com (HostGator auto-SSL)
   - Dashboard on GitHub Pages (auto-HTTPS)

4. **Backup Credentials:**
   - Never commit `secrets.env` to Git
   - Store offline in secure location
   - Share only via secure channel

---

## Monitoring & Maintenance

### Weekly

- [ ] Check database size (should grow ~1-5MB/week)
- [ ] Review error logs
- [ ] Verify cron jobs ran (Cron Log in cPanel)

### Monthly

- [ ] Export conversation data for analysis
- [ ] Verify backups are working
- [ ] Check for unused agent memory entries
- [ ] Update credentials if compromised

### Quarterly

- [ ] Review database performance
- [ ] Audit user permissions
- [ ] Update dependencies (PHP, MySQL)
- [ ] Review API logs for patterns

---

## Support Contact

**Technical Issues:**
- Check this deployment guide
- Review error logs in browser console (F12)
- Test API directly with curl

**Emergency:**
- Rollback to previous version (see Rollback Plan)
- Restore database from backup

---

**Deployed by:** Hermes AI Agent  
**Deployment Date:** August 26, 2026  
**Status:** Ready for Production (pending DNS propagation)
