#!/usr/bin/env node
/**
 * Oxyderm Automation Engine
 * ==========================
 * Zero-dependency Node.js HTTP server (built-ins only: http, fs, path, crypto).
 * Runs locally as a persistent background process (see launchd plist at
 * ~/Library/LaunchAgents/com.oxyderm.automation-engine.plist).
 *
 * HONEST ARCHITECTURE NOTE:
 * The dashboard (index.html) is a static file opened directly in a browser.
 * Browser localStorage is sandboxed per-origin and JS in the page cannot read
 * or write arbitrary files on disk. This engine is therefore a SEPARATE,
 * independent state store (data/*.json) — not automatically synced with the
 * browser's localStorage. The dashboard calls this engine via fetch() as
 * PROGRESSIVE ENHANCEMENT: if the engine is reachable (localhost:4790), events
 * also get logged/processed server-side (for real automations that must run
 * even when the browser tab isn't open, e.g. Square cron firing 'appointment-booked'
 * at 7am). If unreachable, the dashboard's own in-browser event bus (in index.html)
 * keeps working exactly as before — nothing regresses.
 *
 * Zero external SaaS dependencies for CRM/automation logic: no npm install
 * required. Social publishing dispatches to a LOCAL n8n instance (separate
 * process, not managed here) — see N8N_WEBHOOK_URL below. n8n itself must
 * have an active workflow listening on that webhook path, or dispatch calls
 * fail over to a local pending queue (never silently dropped, never faked
 * as sent).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, exec } = require('child_process');
const squareBooking = require('./squareBooking');

// ---------- Google Drive media helper ----------
// Uses service account at SA_KEY_PATH. No npm required — calls Drive REST API directly.
const SA_KEY_PATH = '/Users/genesis/Downloads/oxyderm-reporting-3b45e5c54c90.json';
const DRIVE_MEDIA_DIR = path.join(__dirname, '..', 'data', 'drive-media');

function getDriveToken() {
  // Generate a signed JWT and exchange for access token using Node built-ins only
  const sa = JSON.parse(fs.readFileSync(SA_KEY_PATH, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  const sig = sign.sign(sa.private_key, 'base64url');
  const jwt = `${header}.${claim}.${sig}`;

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).access_token); } catch(e) { reject(new Error('Token parse fail: ' + d)); }
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function driveGet(accessToken, urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com', path: urlPath, method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject); req.end();
  });
}

// Fetch newest media files from Drive (images + videos) not yet downloaded
async function fetchDriveMedia(limit = 5) {
  try {
    if (!fs.existsSync(SA_KEY_PATH)) return [];
    if (!fs.existsSync(DRIVE_MEDIA_DIR)) fs.mkdirSync(DRIVE_MEDIA_DIR, { recursive: true });

    const usedFile = path.join(DRIVE_MEDIA_DIR, 'used.json');
    const used = fs.existsSync(usedFile) ? JSON.parse(fs.readFileSync(usedFile, 'utf8')) : [];

    const token = await getDriveToken();
    const query = encodeURIComponent("(mimeType contains 'image/' or mimeType contains 'video/') and trashed=false");
    const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,webViewLink,webContentLink)');
    const listBuf = await driveGet(token, `/drive/v3/files?q=${query}&pageSize=50&orderBy=modifiedTime+desc&fields=${fields}`);
    const listData = JSON.parse(listBuf.toString());
    const files = (listData.files || []).filter(f => !used.includes(f.id)).slice(0, limit);

    const results = [];
    for (const f of files) {
      const ext = f.name.split('.').pop().toLowerCase();
      const localName = `${f.id}.${ext}`;
      const localPath = path.join(DRIVE_MEDIA_DIR, localName);

      if (!fs.existsSync(localPath)) {
        // Download file content
        const fileBuf = await driveGet(token, `/drive/v3/files/${f.id}?alt=media`);
        fs.writeFileSync(localPath, fileBuf);
      }

      results.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        localPath,
        webViewLink: f.webViewLink || '',
        modifiedTime: f.modifiedTime,
        isVideo: f.mimeType.startsWith('video/'),
        isImage: f.mimeType.startsWith('image/')
      });
    }
    return results;
  } catch (e) {
    return [];  // Never break the loop on Drive errors
  }
}

// Mark Drive files as used so the loop doesn't reuse them
function markDriveUsed(fileIds) {
  try {
    const usedFile = path.join(DRIVE_MEDIA_DIR, 'used.json');
    const used = fs.existsSync(usedFile) ? JSON.parse(fs.readFileSync(usedFile, 'utf8')) : [];
    const merged = [...new Set([...used, ...fileIds])];
    fs.writeFileSync(usedFile, JSON.stringify(merged));
  } catch(_) {}
}

const PORT = process.env.OXYDERM_ENGINE_PORT || 4790;
const DATA_DIR = path.join(__dirname, '..', 'data');
const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'automations.json');
const STATE_FILE = path.join(DATA_DIR, 'engine-state.json');
const POSTIZ_QUEUE_FILE = path.join(DATA_DIR, 'postiz-queue.json');
const LOG_FILE = path.join(DATA_DIR, 'engine.log');

// ---------- tiny JSON-file store helpers ----------
function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch (e) {}
  process.stdout.write(line);
}

// ---------- state ----------
function loadState() {
  return readJSON(STATE_FILE, {
    crmContacts: [],
    crmStages: ['Lead', 'Booked', 'Completed', 'Repeat'],
    runHistory: {} // workflowId -> [{ts, eventType, result}]
  });
}
function saveState(state) {
  writeJSON(STATE_FILE, state);
}

// ---------- n8n social dispatcher ----------
// Sends structured publish payloads to a local n8n webhook workflow. n8n runs
// as a separate local process (not managed by this engine) — reachable via
// N8N_WEBHOOK_URL. This REPLACES the old Postiz-only path: Postiz was never
// deployed successfully, whereas n8n is confirmed running locally, so this is
// the live dispatch path going forward. Postiz code below is kept only as a
// legacy fallback/reference — n8n is primary.
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/hermes-publish';

// Platform-to-webhook routing map — each key matches a platform slug sent in the webhook body
const N8N_PLATFORM_WEBHOOKS = {
  meta:       'http://localhost:5678/webhook/hermes-publish',
  instagram:  'http://localhost:5678/webhook/hermes-publish',
  facebook:   'http://localhost:5678/webhook/hermes-publish',
  threads:    'http://localhost:5678/webhook/oxyderm-threads',
  ads:        'http://localhost:5678/webhook/oxyderm-ads',
  insights:   'http://localhost:5678/webhook/oxyderm-insights',
  engagement: 'http://localhost:5678/webhook/oxyderm-engage',
  leads:      'http://localhost:5678/webhook/oxyderm-leads',
  shopping:   'http://localhost:5678/webhook/oxyderm-shopping',
  branded:    'http://localhost:5678/webhook/oxyderm-branded',
};
const SOCIAL_PLATFORMS = ['meta', 'tiktok', 'youtube', 'gbp', 'linkedin', 'x', 'reddit', 'substack'];
const SOCIAL_MEDIA_TYPES = ['REELS', 'STORIES', 'FEED'];

function buildPublishPayload(item) {
  // Normalizes an arbitrary post/item into the exact contract n8n expects.
  return {
    title: item.title || item.hook || '',
    caption: item.caption || '',
    media_url: item.media_url || item.mediaUrl || '',
    media_type: SOCIAL_MEDIA_TYPES.indexOf(item.media_type) > -1 ? item.media_type : 'FEED',
    subreddit: item.subreddit || null,
    booking_url: item.booking_url || item.checkoutUrl || null,
    platforms: Array.isArray(item.platforms) && item.platforms.length
      ? item.platforms.filter(p => SOCIAL_PLATFORMS.indexOf(p) > -1)
      : (item.platform ? mapLegacyPlatform(item.platform) : [])
  };
}

// Maps the dashboard's existing free-text platform names (e.g. "Instagram Reels",
// "TikTok", "Facebook Ads") onto the fixed platforms list n8n expects.
function mapLegacyPlatform(name) {
  const n = String(name).toLowerCase();
  if (n.includes('instagram') || n.includes('facebook')) return ['meta'];
  if (n.includes('tiktok')) return ['tiktok'];
  if (n.includes('youtube')) return ['youtube'];
  if (n.includes('google business')) return ['gbp'];
  if (n.includes('linkedin')) return ['linkedin'];
  if (n.includes(' x') || n === 'x' || n.includes('twitter')) return ['x'];
  if (n.includes('reddit')) return ['reddit'];
  if (n.includes('substack')) return ['substack'];
  return [];
}

function dispatchToN8n(item) {
  return new Promise((resolve) => {
    const payload = buildPublishPayload(item);
    const body = JSON.stringify(payload);
    const urlObj = new URL(N8N_WEBHOOK_URL);
    const httpMod = urlObj.protocol === 'https:' ? require('https') : require('http');
    const req = httpMod.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        log(`n8n dispatch -> HTTP ${res.statusCode} for platforms=[${payload.platforms.join(',')}]${ok ? '' : ' — ' + data.slice(0, 300)}`);
        resolve({ ok, statusCode: res.statusCode, body: data, payload });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', payload }); });
    req.on('error', (e) => {
      log(`n8n dispatch FAILED (${e.code || e.message}) — is n8n running and is the "${urlObj.pathname}" workflow active? Falling back to local queue.`);
      resolve({ ok: false, error: e.message, payload });
    });
    req.write(body);
    req.end();
  });
}

function enqueueLocalFallback(payload, reason) {
  const q = loadPostizQueue(); // reused as a generic local pending-publish queue
  q.pending.push({ ...payload, queuedAt: new Date().toISOString(), id: crypto.randomUUID(), fallbackReason: reason });
  savePostizQueue(q);
}

// ---------- Postiz shared rate limiter (30 req/hr) ----------
// Reads POSTIZ_URL / POSTIZ_API_KEY from process.env — never hardcoded.
// Since Postiz is not currently deployed (paused per team decision), this
// NEVER makes a live network call. It only enqueues + reports status.
function loadPostizQueue() {
  return readJSON(POSTIZ_QUEUE_FILE, { calls: [], pending: [] });
}
function savePostizQueue(q) {
  writeJSON(POSTIZ_QUEUE_FILE, q);
}
function postizStatus() {
  const configured = !!(process.env.POSTIZ_URL && process.env.POSTIZ_API_KEY);
  const q = loadPostizQueue();
  const oneHourAgo = Date.now() - 3600 * 1000;
  const recent = q.calls.filter(t => t > oneHourAgo);
  return {
    connected: false, // hard-coded false until a real health check ever succeeds — never fake this
    configured,
    requestsThisHour: recent.length,
    limit: 30,
    pendingQueue: q.pending.length,
    note: configured
      ? 'POSTIZ_URL/POSTIZ_API_KEY are set but instance is not confirmed reachable — treating as disconnected until a live health check passes.'
      : 'POSTIZ_URL / POSTIZ_API_KEY not set in environment — integration is wired but inert by design.'
  };
}
function canMakePostizCall() {
  const q = loadPostizQueue();
  const oneHourAgo = Date.now() - 3600 * 1000;
  const recent = q.calls.filter(t => t > oneHourAgo);
  return recent.length < 30;
}
function recordPostizCall() {
  const q = loadPostizQueue();
  const oneHourAgo = Date.now() - 3600 * 1000;
  q.calls = q.calls.filter(t => t > oneHourAgo);
  q.calls.push(Date.now());
  savePostizQueue(q);
}
function enqueuePostiz(item) {
  const q = loadPostizQueue();
  q.pending.push({ ...item, queuedAt: new Date().toISOString(), id: crypto.randomUUID() });
  savePostizQueue(q);
  log(`Postiz: queued locally (not connected) — ${item.type || 'post'}`);
  return { queued: true, connected: false, message: 'Postiz not connected — queued locally, will send once deployment completes.' };
}

// ---------- self-learning append ----------
function appendLearning(agentId, text) {
  const dir = path.join(AGENTS_DIR, agentId);
  const file = path.join(dir, 'learnings.md');
  try {
    fs.mkdirSync(dir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const line = `- ${date}: ${text}\n`;
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, `# ${agentId} — Learnings\n\n${line}`);
    } else {
      fs.appendFileSync(file, line);
    }
  } catch (e) {
    log(`WARN: could not append learning for ${agentId}: ${e.message}`);
  }
}

// ---------- workflow actions ----------
function runAction(workflow, payload, state) {
  const { action, params } = workflow;
  switch (action) {
    case 'tag-contact': {
      const contact = findOrTouchContact(state, payload);
      if (contact && params.tag && contact.tags.indexOf(params.tag) === -1) {
        contact.tags.push(params.tag);
      }
      return { ok: true, detail: `tagged ${payload.name || payload.contactId || 'contact'} with "${params.tag}"` };
    }
    case 'move-pipeline-stage': {
      const contact = findOrTouchContact(state, payload);
      if (contact) contact.stage = params.stage || contact.stage;
      return { ok: true, detail: `moved ${contact ? contact.name : 'contact'} to stage "${params.stage}"` };
    }
    case 'start-sequence': {
      return { ok: true, detail: `sequence enrollment requested (id=${params.sequenceId || payload.sequenceId || 'unspecified'}) — actual send remains stubbed pending email/SMS provider` };
    }
    case 'create-crm-contact': {
      const existing = state.crmContacts.find(c => (c.email && c.email === payload.email) || (c.phone && c.phone === payload.phone) || (c.name === payload.name));
      if (existing) return { ok: true, detail: `contact already existed: ${existing.name}` };
      const contact = {
        id: Date.now(),
        name: payload.name || 'Unknown',
        phone: payload.phone || '',
        email: payload.email || '',
        source: (params.sourcePrefix || '') + (payload.source || payload.funnelName || 'engine'),
        notes: payload.notes || '',
        stage: params.stage || 'Lead',
        created: new Date().toISOString(),
        tags: []
      };
      state.crmContacts.push(contact);
      return { ok: true, detail: `created CRM contact "${contact.name}" at stage "${contact.stage}"`, contact };
    }
    case 'enqueue-postiz': {
      // Legacy action name kept for backward compatibility with existing
      // automations.json workflows — now routes through n8n instead of Postiz.
      return { ok: true, detail: 'queued for n8n dispatch', async: true, payload };
    }
    default:
      return { ok: false, detail: `unknown action "${action}"` };
  }
}

function findOrTouchContact(state, payload) {
  let contact = state.crmContacts.find(c => (payload.contactId && c.id === payload.contactId) || (payload.name && c.name === payload.name) || (payload.phone && c.phone === payload.phone));
  if (!contact && payload.name) {
    contact = {
      id: Date.now(),
      name: payload.name,
      phone: payload.phone || '',
      email: payload.email || '',
      source: payload.source || 'engine',
      notes: '',
      stage: 'Lead',
      created: new Date().toISOString(),
      tags: []
    };
    state.crmContacts.push(contact);
  }
  return contact;
}

// ---------- event dispatch ----------
function fireEvent(eventType, payload) {
  const wfConfig = readJSON(WORKFLOWS_FILE, { workflows: [] });
  const state = loadState();
  const results = [];

  for (const wf of wfConfig.workflows) {
    if (!wf.enabled || wf.trigger !== eventType) continue;
    let result;
    try {
      result = runAction(wf, payload, state);
    } catch (e) {
      result = { ok: false, detail: `error: ${e.message}` };
    }
    if (!state.runHistory[wf.id]) state.runHistory[wf.id] = [];
    state.runHistory[wf.id].unshift({ ts: new Date().toISOString(), eventType, result });
    state.runHistory[wf.id] = state.runHistory[wf.id].slice(0, 20);
    results.push({ workflow: wf.name, ...result });
    log(`event=${eventType} workflow="${wf.name}" -> ${JSON.stringify(result)}`);

    // route learnings to the most relevant agent when identifiable
    const agentMap = {
      'new-lead': 'crm-pipeline',
      'appointment-booked': 'scheduler',
      'no-show': 'client',
      'pipeline-stage-change': 'crm-pipeline',
      'funnel-submission': 'forms-funnel',
      'post-push-requested': 'social'
    };
    const agentId = agentMap[eventType];
    if (agentId && result.ok) {
      appendLearning(agentId, `Workflow "${wf.name}" fired on ${eventType}: ${result.detail}`);
    }
  }

  saveState(state);
  return results;
}

// ---------- HTTP server ----------
function send(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Durable self-learning write, callable from the browser. Fixes the gap
  // where the dashboard's own appendLearning() only wrote to localStorage
  // (per-browser, never reached disk) — this route calls the SAME real
  // appendLearning() every server-side path already uses, so every agent's
  // learnings.md is the one true durable record regardless of where the
  // learning originated (browser click or server-side event).
  if (req.method === 'POST' && url.pathname === '/learn') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body || '{}');
        if (!item.agentId || !item.text) return send(res, 400, { ok: false, error: 'Required: agentId, text' });
        appendLearning(String(item.agentId).slice(0, 64), String(item.text).slice(0, 2000));
        send(res, 200, { ok: true });
      } catch (e) {
        send(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/status') {
    const state = loadState();
    return send(res, 200, {
      ok: true,
      uptime_s: process.uptime(),
      contacts: state.crmContacts.length,
      postiz: postizStatus(),
      workflows: readJSON(WORKFLOWS_FILE, { workflows: [] }).workflows.map(w => ({ id: w.id, name: w.name, enabled: w.enabled }))
    });
  }

  if (req.method === 'GET' && url.pathname === '/state') {
    return send(res, 200, loadState());
  }

  if (req.method === 'GET' && url.pathname === '/postiz/status') {
    return send(res, 200, postizStatus());
  }

  if (req.method === 'POST' && url.pathname === '/event') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (!parsed.type) return send(res, 400, { ok: false, error: 'missing "type"' });
        const results = fireEvent(parsed.type, parsed.payload || {});
        send(res, 200, { ok: true, results });
      } catch (e) {
        send(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/publish') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const item = JSON.parse(body || '{}');
        if (!canMakePostizCall()) { // shared 30/hr limiter, reused across all dispatch paths
          const payload = buildPublishPayload(item);
          enqueueLocalFallback(payload, 'rate-limit (30/hr) reached');
          return send(res, 429, { ok: false, queued: true, reason: 'rate-limit', message: 'Shared publish rate limit (30/hr) reached — queued locally, will retry.' });
        }
        recordPostizCall();
        const result = await dispatchToN8n(item);
        if (!result.ok) {
          enqueueLocalFallback(result.payload, result.error || `HTTP ${result.statusCode}`);
          appendLearning('social', `n8n dispatch failed (${result.error || result.statusCode}) for platforms=[${(result.payload.platforms||[]).join(',')}] — queued locally.`);
          return send(res, 502, { ok: false, queued: true, reason: result.error || 'n8n_error', message: 'n8n unreachable or workflow not active — queued locally, will retry.', detail: result.body });
        }
        appendLearning('social', `Published via n8n to platforms=[${(result.payload.platforms||[]).join(',')}]: "${(result.payload.title||result.payload.caption||'').slice(0,60)}"`);
        return send(res, 200, { ok: true, dispatched: true, n8n_status: result.statusCode });
      } catch (e) {
        return send(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/publish/status') {
    const q = loadPostizQueue();
    const oneHourAgo = Date.now() - 3600 * 1000;
    return send(res, 200, {
      n8nWebhookUrl: N8N_WEBHOOK_URL,
      requestsThisHour: q.calls.filter(t => t > oneHourAgo).length,
      limit: 30,
      pendingFallbackQueue: q.pending.length,
      platforms: SOCIAL_PLATFORMS
    });
  }

  // ---------- Sarah virtual-assistant endpoints (real Square Bookings API) ----------
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try { resolve(JSON.parse(body || '{}')); } catch (e) { reject(e); }
      });
    });
  }

  if (req.method === 'POST' && url.pathname === '/sarah/book') {
    readBody(req).then(async (item) => {
      try {
        if (!item.name || !item.serviceName || !item.startAtISO) {
          return send(res, 400, { ok: false, error: 'Required: name, serviceName, startAtISO (e.g. "2026-09-10T17:00:00Z")' });
        }
        const result = await squareBooking.createBooking(item);
        if (result.ok) {
          appendLearning('scheduler', `Sarah booked "${result.service}" for ${item.name} at ${item.startAtISO} (booking id ${result.booking.id}).`);
          fireEvent('appointment-booked', { name: item.name, phone: item.phone, source: 'sarah-chat' });
        } else {
          appendLearning('scheduler', `Sarah booking FAILED for ${item.name} (${item.serviceName}): ${JSON.stringify(result.error).slice(0,200)}`);
        }
        send(res, result.ok ? 200 : 400, result);
      } catch (e) {
        appendLearning('scheduler', `Sarah booking ERROR: ${e.message}`);
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/sarah/cancel') {
    readBody(req).then(async (item) => {
      try {
        if (!item.bookingId) return send(res, 400, { ok: false, error: 'Required: bookingId' });
        const result = await squareBooking.cancelBooking(item);
        if (result.ok) appendLearning('scheduler', `Sarah cancelled booking ${item.bookingId}: ${item.reason || 'no reason given'}.`);
        send(res, result.ok ? 200 : 400, result);
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/sarah/reschedule') {
    readBody(req).then(async (item) => {
      try {
        if (!item.bookingId || !item.newStartAtISO) return send(res, 400, { ok: false, error: 'Required: bookingId, newStartAtISO' });
        const result = await squareBooking.rescheduleBooking(item);
        if (result.ok) appendLearning('scheduler', `Sarah rescheduled booking ${item.bookingId} to ${item.newStartAtISO}.`);
        send(res, result.ok ? 200 : 400, result);
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/sarah/find-bookings') {
    readBody(req).then(async (item) => {
      try {
        if (!item.phone) return send(res, 400, { ok: false, error: 'Required: phone' });
        const result = await squareBooking.findBookingsByCustomerPhone(item.phone);
        send(res, result.ok ? 200 : 400, result);
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // ---------- Sarah agent handoff: proxy to the real HostGator Brain API ----------
  // This lets Sarah route a question to one of the 21 named agents (scheduler,
  // finance, client, marketing, research, social, editor, general) and get a
  // real Hermes-generated answer back, using the SAME backend the Agents tab
  // uses (fixed 2026-09-02: User-Agent 406 + wrong CLI flag bugs).
  const BRAIN_API_URL = 'http://api.oxydermlaserclinic.ca/api.php';
  const BRAIN_API_KEY = 'oxyderm_brain_2026_xK9mP3qL';

  function brainRequest(payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const req2 = http.request('http://api.oxydermlaserclinic.ca/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': BRAIN_API_KEY, 'User-Agent': 'curl/8.0', 'Content-Length': Buffer.byteLength(data) },
        timeout: 15000
      }, (r) => {
        let body = '';
        r.on('data', c => { body += c; });
        r.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({ ok: false, raw: body }); } });
      });
      req2.on('timeout', () => { req2.destroy(); reject(new Error('Brain API timeout')); });
      req2.on('error', reject);
      req2.write(data);
      req2.end();
    });
  }

  if (req.method === 'POST' && url.pathname === '/sarah/ask-agent') {
    readBody(req).then(async (item) => {
      try {
        if (!item.agent || !item.question) return send(res, 400, { ok: false, error: 'Required: agent, question' });
        const queued = await brainRequest({ action: 'ask', agent: item.agent, question: item.question, context: item.context || {} });
        if (!queued.ok) return send(res, 502, { ok: false, error: 'Brain API did not accept question', detail: queued });
        appendLearning(item.agent, `Sarah routed a question to this agent: "${item.question.slice(0,80)}" (question_id ${queued.question_id}). Run the Oxyderm Brain Poller cron to get the answer, then call /sarah/agent-answer?question_id=${queued.question_id}.`);
        send(res, 200, { ok: true, question_id: queued.question_id, status: 'pending', note: 'Poll GET /sarah/agent-answer?question_id=... in ~60s once the Oxyderm Brain Poller cron picks this up.' });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sarah/agent-answer') {
    var qid = url.searchParams.get('question_id');
    if (!qid) return send(res, 400, { ok: false, error: 'Required query param: question_id' });
    brainRequest({ action: 'get_answer', question_id: qid })
      .then(result => send(res, 200, result))
      .catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  // ── SARAH FAST ASK — called by api.php sarah_ask endpoint ──
  // Receives { question, system_prompt, agent } from HostGator.
  // Calls Hermes CLI with the Sarah system prompt prepended, returns
  // { answer: '...' } synchronously so api.php can return it to the browser.
  // Uses Claude Pro (Hermes subscription) — no direct Anthropic API billing.
  if (req.method === 'POST' && url.pathname === '/sarah-ask') {
    readBody(req).then(async (item) => {
      try {
        const question = (item.question || '').trim();
        const systemPrompt = (item.system_prompt || '').trim();
        if (!question) return send(res, 400, { ok: false, error: 'Required: question' });

        const agentId = (item.agentId || item.agent || 'sarah').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const BRAIN_URL = 'https://api.oxydermlaserclinic.ca/api.php';
        const BRAIN_KEY = 'oxyderm_brain_2026_xK9mP3qL';

        // ── Stage 1: Web search (Google News RSS — DDG instant API is deprecated) ─
        let webContext = '';
        try {
          const newsQuery = encodeURIComponent(question + ' Edmonton laser clinic');
          const newsUrl = 'https://news.google.com/rss/search?q=' + newsQuery + '&hl=en-CA&gl=CA&ceid=CA:en';
          const newsXml = await new Promise((resolve, reject) => {
            require('https').get(newsUrl, {
              timeout: 6000,
              headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
            }, (r) => {
              let d = '';
              r.on('data', c => d += c);
              r.on('end', () => resolve(d));
            }).on('error', reject).on('timeout', reject);
          }).catch(() => '');
          if (newsXml) {
            // Extract top 3 headlines from RSS
            const titles = [];
            const re = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g;
            let m; let count = 0;
            while ((m = re.exec(newsXml)) !== null && count < 4) {
              const t = (m[1] || m[2] || '').trim();
              if (t && t !== 'Google News' && !t.startsWith('Google News -')) {
                titles.push(t);
                count++;
              }
            }
            if (titles.length) webContext = '[Web News] ' + titles.join(' | ');
          }
        } catch(_) {}

        // ── Stage 2: HostGator brain (clinic knowledge) ───────────────────────
        let brainContext = '';
        try {
          const brainRes = await new Promise((resolve, reject) => {
            // Omit category: pull ALL brain memory for this agent (clinic_knowledge
            // AND cron-fed research: trending, competitor, market, youtube, weekly plan)
            const payload = JSON.stringify({ action: 'memory_get', agent: agentId });
            // Use parsed URL options — https.request() does not accept a full URL string
            const brainParsed = new URL(BRAIN_URL);
            const opts = {
              hostname: brainParsed.hostname,
              path: brainParsed.pathname + '?key=' + BRAIN_KEY,
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Key': BRAIN_KEY, 'User-Agent': 'curl/8.0', 'Content-Length': Buffer.byteLength(payload) },
              timeout: 8000
            };
            const pr = require('https').request(opts, (r) => {
              let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
            });
            pr.on('error', reject); pr.on('timeout', reject);
            pr.write(payload); pr.end();
          }).catch(() => ({}));
          if (brainRes && brainRes.ok && Array.isArray(brainRes.data) && brainRes.data.length) {
            const allEntries = brainRes.data.map(r => (r.content || '').trim()).filter(Boolean);
            if (allEntries.length) {
              // Score each entry by keyword overlap with the question
              const qWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
              const scored = allEntries.map(entry => {
                const el = entry.toLowerCase();
                const score = qWords.reduce((s, w) => s + (el.includes(w) ? 1 : 0), 0);
                return { entry, score };
              });
              scored.sort((a, b) => b.score - a.score);
              // Take top 3 most relevant, then build context within 1500 char limit
              let ctx = '';
              for (const { entry } of scored.slice(0, 3)) {
                if ((ctx + entry).length < 1500) ctx += (ctx ? ' | ' : '') + entry;
              }
              if (ctx) brainContext = '[Brain] ' + ctx;
            }
          }
        } catch(_) {}

        // ── Stage 3: Hermes (Claude Pro, no API cost) ────────────────────────
        const { exec } = require('child_process');
        const execOpts = {
          timeout: 90000,
          maxBuffer: 4 * 1024 * 1024,
          env: Object.assign({}, process.env, {
            PATH: '/Users/genesis/.hermes/hermes-agent/venv/bin:/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '')
          })
        };

        // Inject learnings.md for the requesting agent (if available)
        const learningsPath = path.join(AGENTS_DIR, agentId, 'learnings.md');
        let learnings = '';
        try {
          if (fs.existsSync(learningsPath)) {
            const raw = fs.readFileSync(learningsPath, 'utf8');
            learnings = raw.length > 6000 ? raw.slice(0, 6000) + '\n[...truncated]' : raw;
          }
        } catch (_) {}

        // Build full prompt: clinic identity anchor + web context + brain knowledge + learnings + question
        const sarahSystemPrompt = `You are Sarah, the virtual receptionist and consultation specialist for Oxyderm Laser Clinic in Edmonton.

CRITICAL PRICING & PROTOCOL:
- Single-area laser hair removal sessions start at $65 to $145 depending on the area. 6-session full-protocol packages are discounted up to 30%.
- When asked "How much?", give the baseline range immediately ($65-$145) and ask which area they are looking to treat (underarms, bikini/brazilian, legs, face, full body).
- Explain that we use medical-grade Lumenis Nd:YAG 1064nm laser technology with integrated sapphire contact cooling, making it completely safe and comfortable for all skin tones (Fitzpatrick I to VI).
- Always pivot to the complimentary 15-minute consultation and test pulse with Hetisha at oxydermlaserclinic.ca.

HANDLING RANDOM & UNSCRIPTED QUESTIONS (4-TIER RULES):
- Tier 1 (FAQs, Pain, Prep): Keep replies to 2-3 sentences. Explain sapphire cooling minimizes sensation to a mild snap. Prep is shave 24h before, no waxing/plucking for 4 weeks, no sun exposure for 2 weeks.
- Tier 2 (Medical / Skin Conditions / Pregnancy): Never diagnose or promise cures over chat. State that laser helps manage PCOS and ingrowns, but Hetisha assesses skin in-person before starting. Do not treat during pregnancy.
- Tier 3 (Custom deals, complaints, complex requests): State that Hetisha is currently treating clients back-to-back and will review and reach out personally around 6:30-7:00 PM MT.
- Tier 4 (Off-topic / Spam): Politely state you specialize in Oxyderm's laser hair removal and skincare, and ask how you can help with their skin goals.

RULES:
- Be warm, helpful, and concise (2-4 sentences).
- Do not use em-dashes. Use periods, commas, or colons.
- Always include the booking link: oxydermlaserclinic.ca`;
        const parts = [];
        parts.push(sarahSystemPrompt);
        if (webContext) parts.push('--- RECENT NEWS CONTEXT ---\n' + webContext + '\n--- END NEWS CONTEXT ---');
        if (brainContext) parts.push('--- CLINIC KNOWLEDGE BASE (USE THIS FOR ALL FACTS) ---\n' + brainContext + '\n--- END CLINIC KNOWLEDGE ---');
        if (learnings) parts.push('--- AGENT KNOWLEDGE BASE ---\n' + learnings + '\n--- END KNOWLEDGE BASE ---');
        if (systemPrompt) parts.push(systemPrompt);
        parts.push('Question from the dashboard: ' + question);
        const fullPrompt = parts.join('\n\n');

        const os = require('os');
        const tmpSA = path.join(os.tmpdir(), `oxyderm-sa-${Date.now()}.txt`);
        try { fs.writeFileSync(tmpSA, fullPrompt, 'utf8'); } catch(e) { return send(res, 500, { ok:false, error:'tmp write failed' }); }
        const shSA = `hermes -z "$(cat '${tmpSA}')"`;
        exec(shSA, execOpts, (err, stdout, stderr) => {
          try { fs.unlinkSync(tmpSA); } catch(_){}
          if (err && !stdout.trim()) {
            console.error('[sarah-ask] hermes error:', err.message);
            return send(res, 502, { ok: false, error: 'Hermes CLI error: ' + (err.message || 'unknown') });
          }
          const answer = stdout.trim();
          if (!answer) return send(res, 502, { ok: false, error: 'Hermes returned empty response' });
          send(res, 200, { answer });
        });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // Open-ended research/task execution (e.g. "research Bella Vita Laser pricing").
  // Distinct from ask-agent: this has real web search access and can take
  // several minutes, so it's polled via task_id instead of a fast Q&A loop.
  if (req.method === 'POST' && url.pathname === '/sarah/research-agent') {
    readBody(req).then(async (item) => {
      try {
        if (!item.instructions) return send(res, 400, { ok: false, error: 'Required: instructions' });
        const queued = await brainRequest({ action: 'task_create', task_type: item.task_type || 'research', instructions: item.instructions, requested_by: 'sarah' });
        if (!queued.ok) return send(res, 502, { ok: false, error: 'Brain API did not accept task', detail: queued });
        appendLearning('research', `Sarah queued a research task: "${item.instructions.slice(0,80)}" (task_id ${queued.task_id}). Runs via the Oxyderm Task Executor cron (every 3 min, real web search) — can take up to 5 min.`);
        send(res, 200, { ok: true, task_id: queued.task_id, status: 'pending', note: 'Poll GET /sarah/task-result?task_id=... — the Task Executor cron runs every 3 min and tasks can take up to 5 min with real web search.' });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sarah/task-result') {
    var tid = url.searchParams.get('task_id');
    if (!tid) return send(res, 400, { ok: false, error: 'Required query param: task_id' });
    brainRequest({ action: 'task_get', task_id: tid })
      .then(result => send(res, 200, result))
      .catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  // Customer memory (retargeting profile store) — upsert/lookup a known client
  // by phone number. Phone must be digits-only (no '+' prefix): HostGator's
  // WAF masks '+1XXXXXXXXXX'-formatted numbers in JSON responses, silently
  // corrupting lookups. Always strip non-digits before calling this.
  if (req.method === 'POST' && url.pathname === '/sarah/customer-memory') {
    readBody(req).then(async (item) => {
      try {
        if (!item.phone) return send(res, 400, { ok: false, error: 'Required: phone' });
        var digitsOnly = String(item.phone).replace(/\D/g, '');
        var payload = Object.assign({}, item, { action: 'customer_upsert', phone: digitsOnly });
        delete payload.phone_raw;
        const result = await brainRequest(payload);
        send(res, 200, result);
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // Schedule: fetch today's Square bookings with customer names
  // Builds: get all 5 builds data per org
  if (req.method === 'GET' && url.pathname.startsWith('/sarah/builds/')) {
    try {
      const orgId = url.pathname.split('/').pop();
      const buildsPath = path.join(__dirname, '../data/builds-' + orgId + '.json');
      if (!fs.existsSync(buildsPath)) return send(res, 200, { ok: true, builds: {} });
      return send(res, 200, { ok: true, builds: JSON.parse(fs.readFileSync(buildsPath, 'utf8')) });
    } catch(e) { return send(res, 500, { ok: false, error: e.message }); }
  }

  // Builds: save one step
  if (req.method === 'POST' && url.pathname === '/sarah/builds/save') {
    readBody(req).then(data => {
      try {
        const orgId = data.org_id || '';
        const step = data.step;
        const buildsPath = path.join(__dirname, '../data/builds-' + orgId + '.json');
        const existing = fs.existsSync(buildsPath) ? JSON.parse(fs.readFileSync(buildsPath, 'utf8')) : {};
        existing['build' + step] = Object.assign({}, data.data, { saved_at: new Date().toISOString() });
        fs.writeFileSync(buildsPath, JSON.stringify(existing, null, 2));
        send(res, 200, { ok: true, step, org_id: orgId });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(() => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Client: create new org with full onboarding data in one call
  if (req.method === 'POST' && url.pathname === '/sarah/client/create') {
    readBody(req).then(data => {
      try {
        const orgId = data.org_id;
        if (!orgId || !data.name) return send(res, 400, { ok: false, error: 'Required: org_id, name' });
        const dataDir = path.join(__dirname, '../data');

        // 1. Save org profile
        const orgPath = path.join(dataDir, 'org-' + orgId + '.json');
        const org = { org_id: orgId, name: data.name, plan: data.plan || 'Starter', plan_active: true,
          owner_name: data.owner_name || '', location: data.location || '',
          has_website: data.has_website || false, website_url: data.website_url || '',
          wp_url: data.wp_url || '', funnel_domain: data.funnel_domain || '',
          booking_type: data.booking_type || '', booking_url: data.booking_url || '',
          connections: {}, created_at: data.created_at || new Date().toISOString() };
        fs.writeFileSync(orgPath, JSON.stringify(org, null, 2));

        // 2. Save DNA
        const dnaPath = path.join(dataDir, 'dna-' + orgId + '.json');
        const dna = { org_id: orgId, version: 1, saved_at: new Date().toISOString(),
          business_name: data.name, owner_name: data.owner_name || '',
          location: data.location || '', primary_service: data.primary_service || '',
          voice_tone: 'professional', website_url: data.website_url || '',
          review_url: data.review_url || '' };
        fs.writeFileSync(dnaPath, JSON.stringify(dna, null, 2));

        // 3. Save connections (tracking + social handles)
        const connPath = path.join(dataDir, 'connections-' + orgId + '.json');
        const conn = { org_id: orgId, facebook: { status: 'not_connected' },
          instagram: { status: 'not_connected' }, google_gbp: { status: 'not_connected' },
          ga4_measurement_id: data.ga4_measurement_id || '',
          meta_pixel_id: data.meta_pixel_id || '',
          social_handles: data.social_handles || {},
          updated_at: new Date().toISOString() };
        fs.writeFileSync(connPath, JSON.stringify(conn, null, 2));

        send(res, 200, { ok: true, org_id: orgId, name: data.name });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(() => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Web Design: AI generation (funnel/website/quiz/blog/content)
  if (req.method === 'POST' && url.pathname === '/sarah/web-generate') {
    readBody(req).then(async data => {
      try {
        const { mode, prompt, org_id } = data;
        if (!prompt) return send(res, 400, { ok: false, error: 'Required: prompt' });

        // Try OpenRouter free tier
        const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
        if (!OPENROUTER_KEY) return send(res, 503, { ok: false, error: 'OPENROUTER_API_KEY not set in engine environment' });

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + OPENROUTER_KEY,
            'HTTP-Referer': 'http://localhost:4790',
            'X-Title': 'Omni Leads Agency OS'
          },
          body: JSON.stringify({
            model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
            messages: [
              { role: 'system', content: 'You are a conversion-focused web designer and copywriter for local service businesses. You follow brand voice, never invent prices or reviews, and always use the placeholders provided. No em-dashes in output.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
            temperature: 0.7
          })
        });

        if (!orRes.ok) {
          const errText = await orRes.text();
          return send(res, 502, { ok: false, error: 'OpenRouter error: ' + orRes.status + ' ' + errText.substring(0, 200) });
        }

        const orData = await orRes.json();
        const result = (orData.choices && orData.choices[0] && orData.choices[0].message && orData.choices[0].message.content) || '';
        if (!result) return send(res, 502, { ok: false, error: 'Empty response from AI' });

        // Try to split out HTML section if present
        var html = '';
        var notes = '';
        var htmlMatch = result.match(/```html([\s\S]*?)```/i);
        if (htmlMatch) html = htmlMatch[1].trim();

        send(res, 200, { ok: true, result, html, notes, mode, org_id });
      } catch(e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(() => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Connections: get per org (GA4, Pixel, social status)
  if (req.method === 'GET' && url.pathname.startsWith('/sarah/connections/')) {
    try {
      const orgId = url.pathname.split('/').pop() || '';
      const cPath = path.join(__dirname, '../data/connections-' + orgId + '.json');
      if (!fs.existsSync(cPath)) {
        return send(res, 200, { ok: true, connections: { org_id: orgId, facebook: {status:'not_connected'}, instagram: {status:'not_connected'}, google_gbp: {status:'not_connected'}, ga4_measurement_id: '', meta_pixel_id: '' } });
      }
      return send(res, 200, { ok: true, connections: JSON.parse(fs.readFileSync(cPath, 'utf8')) });
    } catch(e) { return send(res, 500, { ok: false, error: e.message }); }
  }

  // Connections: save GA4/Pixel IDs per org
  if (req.method === 'POST' && url.pathname === '/sarah/connections/save') {
    readBody(req).then(data => {
      try {
        const orgId = data.org_id || '';
        const cPath = path.join(__dirname, '../data/connections-' + orgId + '.json');
        const existing = fs.existsSync(cPath) ? JSON.parse(fs.readFileSync(cPath, 'utf8')) : { org_id: orgId };
        const updated = Object.assign({}, existing, {
          ga4_measurement_id: data.ga4_measurement_id !== undefined ? data.ga4_measurement_id : existing.ga4_measurement_id,
          meta_pixel_id: data.meta_pixel_id !== undefined ? data.meta_pixel_id : existing.meta_pixel_id,
          updated_at: new Date().toISOString()
        });
        fs.writeFileSync(cPath, JSON.stringify(updated, null, 2));
        send(res, 200, { ok: true, connections: updated });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(() => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Brand DNA: get per org
  if (req.method === 'GET' && url.pathname.startsWith('/sarah/dna/')) {
    try {
      const orgId = url.pathname.split('/').pop() || '';
      const dnaPath = path.join(__dirname, '../data/dna-' + orgId + '.json');
      if (!fs.existsSync(dnaPath)) {
        return send(res, 200, { ok: true, dna: { org_id: orgId, version: 0 } });
      }
      const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf8'));
      return send(res, 200, { ok: true, dna });
    } catch(e) {
      return send(res, 500, { ok: false, error: e.message });
    }
  }

  // Brand DNA: save per org
  if (req.method === 'POST' && url.pathname === '/sarah/dna/save') {
    readBody(req).then(data => {
      try {
        const orgId = data.org_id || '';
        const dnaPath = path.join(__dirname, '../data/dna-' + orgId + '.json');
        const existing = fs.existsSync(dnaPath) ? JSON.parse(fs.readFileSync(dnaPath, 'utf8')) : { version: 0 };
        const dna = Object.assign({}, existing, data, {
          version: (existing.version || 0) + 1,
          saved_at: new Date().toISOString()
        });
        fs.writeFileSync(dnaPath, JSON.stringify(dna, null, 2));
        send(res, 200, { ok: true, dna });
      } catch(e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // Org: get org profile + connections (Connect wizard)
  if (req.method === 'GET' && url.pathname.startsWith('/sarah/org/')) {
    try {
      const orgId = url.pathname.split('/').pop() || '';
      const orgPath = path.join(__dirname, '../data/org-' + orgId + '.json');
      if (!fs.existsSync(orgPath)) return send(res, 404, { ok: false, error: 'Org not found: ' + orgId });
      const org = JSON.parse(fs.readFileSync(orgPath, 'utf8'));
      send(res, 200, { ok: true, org });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Org: list all orgs
  if (req.method === 'GET' && url.pathname === '/sarah/orgs') {
    try {
      const dataDir = path.join(__dirname, '../data');
      const orgs = fs.readdirSync(dataDir)
        .filter(f => f.startsWith('org-') && f.endsWith('.json'))
        .map(f => {
          try { return JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')); } catch(e) { return null; }
        }).filter(Boolean);
      send(res, 200, { ok: true, orgs });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Org: update connection status
  if (req.method === 'POST' && url.pathname === '/sarah/org/connect') {
    readBody(req).then(item => {
      try {
        const orgId = item.org_id || '';
        const orgPath = path.join(__dirname, '../data/org-' + orgId + '.json');
        if (!fs.existsSync(orgPath)) return send(res, 404, { ok: false, error: 'Org not found' });
        const org = JSON.parse(fs.readFileSync(orgPath, 'utf8'));
        if (item.connection && item.status) {
          org.connections = org.connections || {};
          org.connections[item.connection] = item.status;
        }
        if (item.plan) org.plan = item.plan;
        fs.writeFileSync(orgPath, JSON.stringify(org, null, 2));
        send(res, 200, { ok: true, org_id: orgId, connections: org.connections });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Content angles: list + excluded
  if (req.method === 'GET' && url.pathname === '/sarah/content-angles') {
    try {
      const angPath = path.join(__dirname, '../data/content-angles.json');
      const angles = fs.existsSync(angPath) ? JSON.parse(fs.readFileSync(angPath, 'utf8')) : [];
      const postsPath = path.join(__dirname, '../data/posts.json');
      const posts = fs.existsSync(postsPath) ? JSON.parse(fs.readFileSync(postsPath, 'utf8')) : [];
      // Auto-detect angles from post data
      const failed = posts.filter(p => p.status === 'failed').map(p => (p.caption || '').slice(0, 60));
      const posted = posts.filter(p => p.status === 'posted').map(p => (p.caption || '').slice(0, 60));
      send(res, 200, { ok: true, angles, auto_insights: { failed_count: failed.length, posted_count: posted.length } });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Content angles: mark an angle
  if (req.method === 'POST' && url.pathname === '/sarah/content-angles/mark') {
    readBody(req).then(item => {
      try {
        if (!item.angle || !item.decision) return send(res, 400, { ok: false, error: 'Required: angle, decision (reinforce|kill|watch)' });
        const allowed = ['reinforce', 'kill', 'watch'];
        if (!allowed.includes(item.decision)) return send(res, 400, { ok: false, error: 'decision must be reinforce|kill|watch' });
        const angPath = path.join(__dirname, '../data/content-angles.json');
        const angles = fs.existsSync(angPath) ? JSON.parse(fs.readFileSync(angPath, 'utf8')) : [];
        const existing = angles.find(a => a.angle === item.angle);
        if (existing) {
          existing.decision = item.decision;
          existing.reason = item.reason || existing.reason;
          existing.updated_at = new Date().toISOString();
        } else {
          angles.unshift({ id: 'ang_' + Date.now(), org_id: 'oxyderm', angle: item.angle, decision: item.decision, reason: item.reason || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        }
        fs.writeFileSync(angPath, JSON.stringify(angles, null, 2));
        appendLearning('content-calendar', `Content angle "${item.angle}" marked ${item.decision}: ${item.reason || 'no reason'}`);
        send(res, 200, { ok: true, angle: item.angle, decision: item.decision });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Agent notes: read learnings for a specific agent
  if (req.method === 'GET' && url.pathname.startsWith('/sarah/agent-notes/')) {
    try {
      const agentId = url.pathname.split('/').pop();
      const lFile = path.join(AGENTS_DIR, agentId, 'learnings.md');
      if (!fs.existsSync(lFile)) return send(res, 404, { ok: false, error: 'Agent not found: ' + agentId });
      const lines = fs.readFileSync(lFile, 'utf8').split('\n')
        .filter(l => l.startsWith('- 20'))
        .slice(0, 20);
      send(res, 200, { ok: true, agent: agentId, notes: lines });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Agent notes: write today's learning note
  if (req.method === 'POST' && url.pathname === '/sarah/agent-notes/write') {
    readBody(req).then(item => {
      try {
        if (!item.agent || !item.note) return send(res, 400, { ok: false, error: 'Required: agent, note' });
        const agentId = item.agent.replace(/[^a-z0-9-]/g, '');
        const agentDir = path.join(AGENTS_DIR, agentId);
        fs.mkdirSync(agentDir, { recursive: true });
        const lFile = path.join(agentDir, 'learnings.md');
        const date = new Date().toISOString().slice(0, 10);
        const line = `- ${date}: ${String(item.note).slice(0, 500)}\n`;
        if (!fs.existsSync(lFile)) {
          fs.writeFileSync(lFile, `# ${agentId} — Learnings\n\n${line}`);
        } else {
          fs.appendFileSync(lFile, line);
        }
        send(res, 200, { ok: true, agent: agentId, date, note: item.note });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // SEO/GBP: generate weekly suggestion
  if (req.method === 'GET' && url.pathname === '/sarah/seo/suggest') {
    try {
      const sugPath = path.join(__dirname, '../data/seo-suggestions.json');
      const sug = fs.existsSync(sugPath) ? JSON.parse(fs.readFileSync(sugPath, 'utf8')) : {};
      const today = new Date().toISOString().slice(0, 10);
      const week = Math.ceil(new Date().getDate() / 7);

      // Read Brand DNA for real copy
      const dnaPath = '/Users/genesis/brand/oxyderm/context.md';
      let biz = 'Oxyderm Laser Clinic';
      let location = 'Edmonton, AB';
      let services = ['Laser Hair Removal', 'Microneedling', 'Skin Treatments'];
      if (fs.existsSync(dnaPath)) {
        const dna = fs.readFileSync(dnaPath, 'utf8');
        const nameMatch = dna.match(/Business name:\*\*\s*(.+)/i) || dna.match(/\*\*Business name:\*\*\s*(.+)/i);
        if (nameMatch) biz = nameMatch[1].trim();
        const locMatch = dna.match(/Location.*?:\s*(.+Edmonton[^\n]+)/i);
        if (locMatch) location = locMatch[1].trim().replace(/\*\*/g,'').slice(0,50);
      }

      // Rotate service spotlight by week
      const service = services[(week - 1) % services.length];
      const templates = [
        `✨ ${service} in ${location}\n\nAt ${biz}, we specialize in ${service.toLowerCase()} with real results and no pressure. Free consultation — book online today.\n\n📍 ${location} | oxydermlaserclinic.ca\n\n#${service.replace(/ /g,'')} #Edmonton #MedSpa`,
        `🌟 Fall is the perfect time to start ${service.toLowerCase()}!\n\n${biz} in ${location} is taking new clients. Permanent results, honest pricing, free consultation.\n\n👉 Book: oxydermlaserclinic.ca\n\n#${service.replace(/ /g,'')} #EdmontonBeauty`,
        `❓ Thinking about ${service.toLowerCase()}?\n\n${biz} offers free consultations so you can ask all your questions before committing. No pressure, just answers.\n\n📍 ${location} | Call or book online\n\n#${service.replace(/ /g,'')} #Edmonton`
      ];
      const text = templates[week % templates.length];

      const entry = { date: today, week, service, text, biz, location };
      fs.writeFileSync(sugPath, JSON.stringify(entry, null, 2));
      send(res, 200, { ok: true, suggestion: entry });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Payments: list
  if (req.method === 'GET' && url.pathname === '/sarah/payments') {
    try {
      const pmPath = path.join(__dirname, '../data/payments.json');
      const payments = fs.existsSync(pmPath) ? JSON.parse(fs.readFileSync(pmPath, 'utf8')) : [];
      send(res, 200, { ok: true, payments, stripe_configured: false });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Payments: create
  if (req.method === 'POST' && url.pathname === '/sarah/payments/create') {
    readBody(req).then(item => {
      try {
        if (!item.contact || !item.amount) return send(res, 400, { ok: false, error: 'Required: contact, amount' });
        const pmPath = path.join(__dirname, '../data/payments.json');
        const payments = fs.existsSync(pmPath) ? JSON.parse(fs.readFileSync(pmPath, 'utf8')) : [];
        const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY);
        const payment = {
          id: 'pay_' + Date.now(),
          org_id: 'oxyderm',
          contact: item.contact,
          phone: item.phone || '',
          email: item.email || '',
          amount: parseFloat(item.amount) || 0,
          currency: 'cad',
          description: item.description || 'Oxyderm service payment',
          payment_link: item.payment_link || '',
          status: stripeConfigured ? 'open' : 'needs_setup',
          stripe_link: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        // If Stripe configured, would generate link here — currently not configured
        payments.unshift(payment);
        fs.writeFileSync(pmPath, JSON.stringify(payments.slice(0, 500), null, 2));
        appendLearning('finance', `Payment request created for ${payment.contact}: $${payment.amount} CAD — status: ${payment.status}`);
        send(res, 200, { ok: true, id: payment.id, status: payment.status, stripe_configured: stripeConfigured, message: stripeConfigured ? 'Payment link generated' : 'Stripe not configured — add STRIPE_SECRET_KEY to enable payment links. Use the manual link field as a workaround.' });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Payments: update status (marks paid/failed/cancelled — never auto-marks paid)
  if (req.method === 'POST' && url.pathname === '/sarah/payments/update-status') {
    readBody(req).then(async (item) => {
      try {
        if (!item.id || !item.status) return send(res, 400, { ok: false, error: 'Required: id, status' });
        const allowed = ['open', 'paid', 'failed', 'cancelled'];
        if (!allowed.includes(item.status)) return send(res, 400, { ok: false, error: 'status must be: ' + allowed.join('|') });
        const pmPath = path.join(__dirname, '../data/payments.json');
        const payments = fs.existsSync(pmPath) ? JSON.parse(fs.readFileSync(pmPath, 'utf8')) : [];
        const pay = payments.find(p => p.id === item.id);
        if (!pay) return send(res, 404, { ok: false, error: 'Payment not found' });
        pay.status = item.status;
        pay.updated_at = new Date().toISOString();
        if (item.status === 'paid') pay.paid_at = new Date().toISOString();
        fs.writeFileSync(pmPath, JSON.stringify(payments, null, 2));
        // Failed → enqueue recovery job
        if (item.status === 'failed') {
          const jobsPath = path.join(__dirname, '../data/jobs.json');
          const jobs = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
          const now = new Date();
          const recoveryJob = {
            id: 'job_payfail_' + Date.now(),
            org_id: 'oxyderm',
            recipe: 'payment_recovery',
            payment_id: pay.id,
            lead_name: pay.contact,
            lead_phone: pay.phone,
            trigger: 'payment_failed',
            created_at: now.toISOString(),
            steps: [
              { step: 1, label: 'Failed payment follow-up', channel: 'sms', template: `Hi ${pay.contact}, your payment of $${pay.amount} CAD for Oxyderm didn't go through. Please retry: ${pay.payment_link || 'contact us at oxydermlaserclinic.ca'}`, scheduled_at: new Date(now.getTime() + 3600000).toISOString(), status: 'pending_provider' },
              { step: 2, label: 'Final follow-up', channel: 'email', template: `Hi ${pay.contact}, we noticed your payment of $${pay.amount} CAD is still outstanding. Please get in touch so we can help: info@oxydermlaserclinic.ca`, scheduled_at: new Date(now.getTime() + 86400000).toISOString(), status: 'pending_provider' }
            ]
          };
          jobs.unshift(recoveryJob);
          fs.writeFileSync(jobsPath, JSON.stringify(jobs.slice(0, 500), null, 2));
          appendLearning('finance', `Payment FAILED for ${pay.contact} $${pay.amount} — recovery job created`);
        }
        send(res, 200, { ok: true, id: pay.id, status: pay.status });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Review requests: list
  if (req.method === 'GET' && url.pathname === '/sarah/review-requests') {
    try {
      const rrPath = path.join(__dirname, '../data/review-requests.json');
      const rr = fs.existsSync(rrPath) ? JSON.parse(fs.readFileSync(rrPath, 'utf8')) : [];
      send(res, 200, { ok: true, requests: rr.slice(0, 100) });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Review requests: create manually (or from UI "Mark Complete")
  if (req.method === 'POST' && url.pathname === '/sarah/review-requests/create') {
    readBody(req).then(item => {
      try {
        const rrPath = path.join(__dirname, '../data/review-requests.json');
        const rr = fs.existsSync(rrPath) ? JSON.parse(fs.readFileSync(rrPath, 'utf8')) : [];
        // Skip rules
        if (!item.phone && !item.email) {
          rr.unshift({ id: 'rr_' + Date.now(), org_id: 'oxyderm', appointment_id: item.appointment_id || null, contact: item.contact || 'Unknown', phone: '', email: '', channel: 'none', status: 'skipped', skip_reason: 'no_contact', created_at: new Date().toISOString() });
          fs.writeFileSync(rrPath, JSON.stringify(rr.slice(0, 500), null, 2));
          return send(res, 200, { ok: true, status: 'skipped', reason: 'no_contact' });
        }
        // Dedup by appointment_id
        if (item.appointment_id && rr.find(r => r.appointment_id === item.appointment_id)) {
          return send(res, 200, { ok: true, status: 'skipped', reason: 'duplicate' });
        }
        // Get review URL from Brand DNA
        const dnaPath = '/Users/genesis/brand/oxyderm/context.md';
        let reviewUrl = 'https://g.page/r/oxyderm'; // fallback
        if (fs.existsSync(dnaPath)) {
          const dna = fs.readFileSync(dnaPath, 'utf8');
          const match = dna.match(/review.*url.*?:\s*(https?:\/\/\S+)/i) || dna.match(/(https:\/\/g\.page[^\s]+)/i);
          if (match) reviewUrl = match[1].trim();
        }
        const channel = item.email ? 'email' : 'sms';
        const rreq = {
          id: 'rr_' + Date.now(),
          org_id: 'oxyderm',
          appointment_id: item.appointment_id || null,
          contact: item.contact || item.phone || item.email,
          phone: item.phone || '',
          email: item.email || '',
          channel,
          message: `Hi ${item.contact || 'there'}, thank you for visiting Oxyderm! Would you mind sharing your experience? It helps us a lot: ${reviewUrl}`,
          review_url: reviewUrl,
          status: 'queued',
          draft_reply: '',
          created_at: new Date().toISOString()
        };
        rr.unshift(rreq);
        fs.writeFileSync(rrPath, JSON.stringify(rr.slice(0, 500), null, 2));
        appendLearning('marketing', `Review request queued for ${rreq.contact} (${channel}) — appointment ${item.appointment_id || 'manual'}`);
        send(res, 200, { ok: true, id: rreq.id, status: 'queued', channel });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Review requests: save draft reply
  if (req.method === 'POST' && url.pathname === '/sarah/review-requests/draft') {
    readBody(req).then(item => {
      try {
        if (!item.id || item.draft == null) return send(res, 400, { ok: false, error: 'Required: id, draft' });
        const rrPath = path.join(__dirname, '../data/review-requests.json');
        const rr = fs.existsSync(rrPath) ? JSON.parse(fs.readFileSync(rrPath, 'utf8')) : [];
        const entry = rr.find(r => r.id === item.id);
        if (!entry) return send(res, 404, { ok: false, error: 'Not found' });
        entry.draft_reply = String(item.draft).slice(0, 1000);
        entry.draft_saved_at = new Date().toISOString();
        fs.writeFileSync(rrPath, JSON.stringify(rr, null, 2));
        send(res, 200, { ok: true });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Funnel: list funnel leads
  if (req.method === 'GET' && url.pathname === '/sarah/funnel-leads') {
    try {
      const leadsPath = path.join(__dirname, '../data/leads-funnel.json');
      const leads = fs.existsSync(leadsPath) ? JSON.parse(fs.readFileSync(leadsPath, 'utf8')) : [];
      send(res, 200, { ok: true, leads });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Funnel: meta endpoint
  if (req.method === 'GET' && url.pathname === '/f/oxyderm/meta') {
    const dnaPath = '/Users/genesis/brand/oxyderm/context.md';
    send(res, 200, { ok: true, dna_missing: !fs.existsSync(dnaPath) });
    return;
  }

  // Funnel: serve landing page
  if (req.method === 'GET' && url.pathname === '/f/oxyderm') {
    const dnaPath = '/Users/genesis/brand/oxyderm/context.md';
    let biz = 'Oxyderm Laser Clinic';
    let offer = 'Laser Hair Removal & Skin Treatments';
    let value = 'Permanent results you can see. Free consultation.';
    let cta = 'Book My Free Consultation';
    let dnaMissing = false;

    if (fs.existsSync(dnaPath)) {
      const dna = fs.readFileSync(dnaPath, 'utf8');
      const nameMatch = dna.match(/Business name:\*\*\s*(.+)/i) || dna.match(/\*\*Business name:\*\*\s*(.+)/i);
      if (nameMatch) biz = nameMatch[1].trim();
    } else {
      dnaMissing = true;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${biz} — Free Consultation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#00172D;color:#f0f4f8;min-height:100vh}
.hero{padding:48px 24px 32px;text-align:center;max-width:600px;margin:0 auto}
.logo{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:24px}
.logo span{color:#c9a96e}
h1{font-size:28px;font-weight:800;line-height:1.2;margin-bottom:16px;color:#fff}
.value{font-size:17px;color:#c9a96e;margin-bottom:32px;font-weight:500}
.form-card{background:#001f3d;border:1px solid #1a3a5c;border-radius:16px;padding:28px 24px;max-width:480px;margin:0 auto 40px}
.form-title{font-size:18px;font-weight:700;margin-bottom:20px;color:#fff}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:600;color:#7a9ab8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}
.field input,
.field select{width:100%;padding:13px 14px;border-radius:10px;border:1px solid #1a3a5c;background:#002448;color:#f0f4f8;font-size:15px}
.field input:focus,.field select:focus{outline:none;border-color:#c9a96e}
.cta-btn{width:100%;padding:16px;border-radius:12px;border:none;background:#c9a96e;color:#000;font-size:16px;font-weight:800;cursor:pointer;margin-top:8px;letter-spacing:.2px}
.cta-btn:disabled{opacity:.6;cursor:not-allowed}
.msg{margin-top:12px;font-size:13px;text-align:center;min-height:20px}
.msg.success{color:#2ecc71}
.msg.error{color:#e74c3c}
${dnaMissing ? '.dna-hint{background:#1a2d1a;border:1px solid #2ecc71;border-radius:8px;padding:10px 14px;font-size:12px;color:#90e090;margin-bottom:20px;text-align:center}' : ''}
.trust{font-size:12px;color:#7a9ab8;text-align:center;margin-top:20px}
.footer{text-align:center;padding:20px;font-size:11px;color:#1a3a5c}
</style>
</head>
<body>
<div class="hero">
  <div class="logo">Oxy<span>derm</span></div>
  <h1>${offer}</h1>
  <div class="value">${value}</div>
  ${dnaMissing ? '<div class="dna-hint">⚠️ Complete Build 1 (Brand DNA) to replace these placeholders with your real copy.</div>' : ''}
  <div class="form-card">
    <div class="form-title">${cta}</div>
    <form id="lead-form">
      <div class="field"><label>Your Name *</label><input id="f-name" type="text" placeholder="Jane Smith" required></div>
      <div class="field"><label>Phone *</label><input id="f-phone" type="tel" placeholder="780-555-0000" required></div>
      <div class="field"><label>Email (optional)</label><input id="f-email" type="email" placeholder="jane@email.com"></div>
      <div class="field"><label>I'm interested in</label>
        <select id="f-service">
          <option>Laser Hair Removal</option>
          <option>Microneedling</option>
          <option>Hyperpigmentation Treatment</option>
          <option>Laser Acne Treatment</option>
          <option>Radiofrequency</option>
          <option>IPL Photofacial</option>
          <option>Skin Consultation</option>
        </select>
      </div>
      <button type="submit" class="cta-btn" id="submit-btn">${cta}</button>
      <div class="msg" id="form-msg"></div>
    </form>
  </div>
  <div class="trust">📍 Edmonton, AB &bull; Hetisha Shukla, Lead Medical Esthetician &bull; Free consultation, no pressure</div>
</div>
<div class="footer">Built with Agency OS</div>
<script>
document.getElementById('lead-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var btn = document.getElementById('submit-btn');
  var msg = document.getElementById('form-msg');
  var name = document.getElementById('f-name').value.trim();
  var phone = document.getElementById('f-phone').value.trim();
  var email = document.getElementById('f-email').value.trim();
  var service = document.getElementById('f-service').value;
  if (!name || !phone) { msg.textContent = 'Name and phone are required.'; msg.className = 'msg error'; return; }
  btn.disabled = true;
  btn.textContent = 'Sending...';
  msg.textContent = '';
  fetch('/f/oxyderm/submit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: name, phone: phone, email: email, service: service, org_id: 'oxyderm', source: 'funnel'})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.ok) {
      msg.textContent = '✅ Got it! We\\'ll be in touch within 24 hours.';
      msg.className = 'msg success';
      btn.textContent = 'Submitted!';
      document.getElementById('lead-form').reset();
    } else {
      msg.textContent = 'Error: ' + (d.error || 'Please try again.');
      msg.className = 'msg error';
      btn.disabled = false;
      btn.textContent = '${cta}';
    }
  })
  .catch(function(){
    msg.textContent = 'Could not connect. Please try again or call us directly.';
    msg.className = 'msg error';
    btn.disabled = false;
    btn.textContent = '${cta}';
  });
});
</script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Funnel: handle form submission
  if (req.method === 'POST' && url.pathname === '/f/oxyderm/submit') {
    readBody(req).then(async (item) => {
      try {
        if (!item.name || !item.phone) return send(res, 400, { ok: false, error: 'name and phone required' });

        // Save lead to funnel leads file
        const leadsPath = path.join(__dirname, '../data/leads-funnel.json');
        const leads = fs.existsSync(leadsPath) ? JSON.parse(fs.readFileSync(leadsPath, 'utf8')) : [];
        const lead = {
          id: 'fl_' + Date.now(),
          org_id: 'oxyderm',
          name: item.name,
          phone: item.phone.replace(/\D/g, ''),
          email: item.email || '',
          service: item.service || 'General enquiry',
          source: 'funnel',
          status: 'New',
          date: new Date().toISOString()
        };
        leads.unshift(lead);
        fs.writeFileSync(leadsPath, JSON.stringify(leads.slice(0, 1000), null, 2));

        // Create inbox thread
        const inboxPath = path.join(__dirname, '../data/inbox.json');
        const threads = fs.existsSync(inboxPath) ? JSON.parse(fs.readFileSync(inboxPath, 'utf8')) : [];
        const existing = threads.find(t => t.phone === lead.phone);
        if (!existing) {
          threads.unshift({ id: 'thread_f_' + Date.now(), org_id: 'oxyderm', contact: lead.name, phone: lead.phone, email: lead.email, channel: lead.phone ? 'sms' : 'email', human_takeover: false, messages: [{ id: 'msg_' + Date.now(), direction: 'inbound', body: 'Funnel lead: interested in ' + lead.service, channel: 'sms', at: new Date().toISOString(), status: 'received' }], last_message: 'Funnel lead: ' + lead.service, last_at: new Date().toISOString(), linked_lead: lead.id });
          fs.writeFileSync(inboxPath, JSON.stringify(threads, null, 2));
        }

        // Log learning
        appendLearning('forms-funnel', `Funnel lead received: ${lead.name} (${lead.phone}) — ${lead.service}`);

        send(res, 200, { ok: true, lead_id: lead.id });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Inbox: list all threads
  if (req.method === 'GET' && url.pathname === '/sarah/inbox') {
    try {
      const inboxPath = path.join(__dirname, '../data/inbox.json');
      const threads = fs.existsSync(inboxPath) ? JSON.parse(fs.readFileSync(inboxPath, 'utf8')) : [];
      send(res, 200, { ok: true, threads });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Inbox: send/queue a reply
  if (req.method === 'POST' && url.pathname === '/sarah/inbox/reply') {
    readBody(req).then(async (item) => {
      try {
        if (!item.thread_id || !item.body) return send(res, 400, { ok: false, error: 'Required: thread_id, body' });
        const inboxPath = path.join(__dirname, '../data/inbox.json');
        const threads = fs.existsSync(inboxPath) ? JSON.parse(fs.readFileSync(inboxPath, 'utf8')) : [];
        const thread = threads.find(t => t.id === item.thread_id);
        if (!thread) return send(res, 404, { ok: false, error: 'Thread not found' });

        const msg = { id: 'msg_' + Date.now(), direction: 'outbound', body: item.body, channel: thread.channel, at: new Date().toISOString(), status: 'queued' };

        // Attempt real send based on channel
        if (thread.channel === 'email' && thread.email) {
          try {
            const { exec } = require('child_process');
            const esc = s => String(s).replace(/'/g, "'\\''");
            const cmd = `himalaya message compose --to '${esc(thread.email)}' --subject '${esc(item.subject || 'Re: Oxyderm')}' --body '${esc(item.body)}' --send`;
            await new Promise((res2, rej) => exec(cmd, { timeout: 15000, env: Object.assign({}, process.env, { PATH: '/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '') }) }, (err) => err ? rej(err) : res2()));
            msg.status = 'sent';
          } catch(e) {
            msg.status = 'failed';
            msg.error = e.message;
          }
        }
        // SMS: no provider wired — stays queued
        thread.messages = thread.messages || [];
        thread.messages.push(msg);
        thread.last_message = item.body.slice(0, 80);
        thread.last_at = msg.at;
        fs.writeFileSync(inboxPath, JSON.stringify(threads, null, 2));
        send(res, 200, { ok: true, message_id: msg.id, status: msg.status });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Inbox: toggle human/bot mode per thread
  if (req.method === 'POST' && url.pathname === '/sarah/inbox/toggle-human') {
    readBody(req).then(item => {
      try {
        if (!item.thread_id) return send(res, 400, { ok: false, error: 'Required: thread_id' });
        const inboxPath = path.join(__dirname, '../data/inbox.json');
        const threads = fs.existsSync(inboxPath) ? JSON.parse(fs.readFileSync(inboxPath, 'utf8')) : [];
        const thread = threads.find(t => t.id === item.thread_id);
        if (!thread) return send(res, 404, { ok: false, error: 'Thread not found' });
        thread.human_takeover = item.human != null ? !!item.human : !thread.human_takeover;
        fs.writeFileSync(inboxPath, JSON.stringify(threads, null, 2));
        send(res, 200, { ok: true, thread_id: item.thread_id, human_takeover: thread.human_takeover });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Inbox: create or upsert a thread (called when lead/email is added)
  if (req.method === 'POST' && url.pathname === '/sarah/inbox/upsert') {
    readBody(req).then(item => {
      try {
        if (!item.contact && !item.phone && !item.email) return send(res, 400, { ok: false, error: 'Required: contact or phone or email' });
        const inboxPath = path.join(__dirname, '../data/inbox.json');
        const threads = fs.existsSync(inboxPath) ? JSON.parse(fs.readFileSync(inboxPath, 'utf8')) : [];
        const key = item.phone || item.email;
        let thread = threads.find(t => (item.phone && t.phone === item.phone) || (item.email && t.email === item.email));
        if (!thread) {
          thread = { id: 'thread_' + Date.now(), org_id: 'oxyderm', contact: item.contact || key, phone: item.phone || '', email: item.email || '', channel: item.phone ? 'sms' : 'email', human_takeover: false, messages: [], last_message: item.message || '', last_at: new Date().toISOString(), linked_lead: item.linked_lead || null };
          if (item.message) thread.messages.push({ id: 'msg_' + Date.now(), direction: 'inbound', body: item.message, channel: thread.channel, at: new Date().toISOString(), status: 'received' });
          threads.unshift(thread);
          fs.writeFileSync(inboxPath, JSON.stringify(threads, null, 2));
        }
        send(res, 200, { ok: true, thread_id: thread.id, created: true });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Owner Report: truthful numbers from all live data sources
  if (req.method === 'GET' && url.pathname === '/sarah/report') {
    (async () => {
      try {
        const https = require('https');
        const token = process.env.SQUARE_ACCESS_TOKEN;

        function sqGet(sqPath) {
          return new Promise((resolve, reject) => {
            if (!token) return resolve({ bookings: [], customers: [] });
            const opts = { hostname: 'connect.squareup.com', path: sqPath, method: 'GET', headers: { 'Authorization': 'Bearer ' + token, 'Square-Version': '2024-01-17' } };
            const r = https.request(opts, (res2) => { let b = ''; res2.on('data', c => b += c); res2.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } }); });
            r.on('error', e => resolve({}));
            r.end();
          });
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        // Fetch today's bookings from Square
        const bookData = await sqGet(`/v2/bookings?location_id=SA5CTAH41JNY2&start_at_min=${encodeURIComponent(startOfDay)}&start_at_max=${encodeURIComponent(endOfDay)}&limit=50`);
        const todayBookings = bookData.bookings || [];
        const bookedCount = todayBookings.filter(b => b.status === 'ACCEPTED').length;
        const cancelledCount = todayBookings.filter(b => ['CANCELLED','CANCELLED_BY_SELLER','CANCELLED_BY_CUSTOMER'].includes(b.status)).length;

        // Jobs
        const jobsPath = path.join(__dirname, '../data/jobs.json');
        const jobs = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
        const todayJobs = jobs.filter(j => j.created_at && j.created_at.startsWith(today.toISOString().slice(0,10)));

        // Posts
        const postsPath = path.join(__dirname, '../data/posts.json');
        const posts = fs.existsSync(postsPath) ? JSON.parse(fs.readFileSync(postsPath, 'utf8')) : [];
        const postedCount = posts.filter(p => p.status === 'posted').length;
        const queuedCount = posts.filter(p => p.status === 'queued').length;
        const failedPosts = posts.filter(p => p.status === 'failed').length;

        // Scores
        const scoresPath = path.join(__dirname, '../data/scores.json');
        const scores = fs.existsSync(scoresPath) ? JSON.parse(fs.readFileSync(scoresPath, 'utf8')) : [];
        const leadScore = (scores.find(s => s.agent === 'Lead Scout') || {}).score || 0;

        // Learnings — pull failures from scheduler agent
        const schedulerLearnings = path.join(__dirname, '../agents/scheduler/learnings.md');
        let failures = [];
        if (fs.existsSync(schedulerLearnings)) {
          const lines = fs.readFileSync(schedulerLearnings, 'utf8').split('\n');
          failures = lines.filter(l => l.includes('FAILED') && l.includes(today.toISOString().slice(0,10))).map(l => l.replace(/^- \d{4}-\d{2}-\d{2}: /, '').slice(0, 120));
        }

        const report = {
          ok: true,
          date: today.toISOString().slice(0,10),
          generated_at: today.toISOString(),
          bookings: { today: bookedCount, cancelled: cancelledCount },
          leads: { total_score_points: leadScore },
          posts: { posted: postedCount, queued: queuedCount, failed: failedPosts },
          automations: { jobs_today: todayJobs.length, recipes: [...new Set(todayJobs.map(j => j.recipe))] },
          failures: failures
        };

        send(res, 200, report);
      } catch(e) {
        send(res, 500, { ok: false, error: 'Report failed: ' + e.message });
      }
    })();
    return;
  }

  // Learnings: last 7 days of daily digests
  if (req.method === 'GET' && url.pathname === '/sarah/learnings') {
    try {
      const learnPath = path.join(__dirname, '../data/learnings.json');
      const learnings = fs.existsSync(learnPath) ? JSON.parse(fs.readFileSync(learnPath, 'utf8')) : [];
      send(res, 200, { ok: true, learnings: learnings.slice(0, 7) });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Scores: list agent skill scores
  if (req.method === 'GET' && url.pathname === '/sarah/scores') {
    try {
      const fs = require('fs');
      const path = __dirname + '/../data/scores.json';
      const scores = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : [];
      send(res, 200, { ok: true, scores });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // Scores: update an agent score from a real event
  if (req.method === 'POST' && url.pathname === '/sarah/scores/update') {
    readBody(req).then(item => {
      try {
        const fs = require('fs');
        const path = __dirname + '/../data/scores.json';
        const scores = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : [];
        const agent = scores.find(s => s.agent === item.agent || s.kpi === item.kpi);
        if (agent) {
          agent.score = (agent.score || 0) + (item.delta || 1);
          agent.events = agent.events || [];
          agent.events.unshift({ event: item.event, delta: item.delta || 1, at: new Date().toISOString() });
          agent.events = agent.events.slice(0, 50);
          agent.last_event = new Date().toISOString();
          fs.writeFileSync(path, JSON.stringify(scores, null, 2));
          send(res, 200, { ok: true, agent: agent.agent, score: agent.score });
        } else {
          send(res, 404, { ok: false, error: 'Agent not found: ' + item.agent });
        }
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  // Jobs: list all automation jobs
  if (req.method === 'GET' && url.pathname === '/sarah/jobs') {
    (async () => {
      try {
        const fs = require('fs');
        const jobsPath = __dirname + '/../data/jobs.json';
        const jobs = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
        send(res, 200, { ok: true, jobs: jobs.slice(0, 100) });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    })();
    return;
  }

  // Jobs: create a new automation job
  if (req.method === 'POST' && url.pathname === '/sarah/jobs/create') {
    readBody(req).then(async (job) => {
      try {
        const fs = require('fs');
        const jobsPath = __dirname + '/../data/jobs.json';
        const jobs = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
        // Dedup by id
        if (!jobs.find(j => j.id === job.id)) {
          jobs.unshift(job);
          fs.writeFileSync(jobsPath, JSON.stringify(jobs.slice(0, 500), null, 2));
        }
        send(res, 200, { ok: true, job_id: job.id });
      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sarah/schedule') {
    const https = require('https');
    const token = process.env.SQUARE_ACCESS_TOKEN;
    if (!token) return send(res, 503, { ok: false, error: 'SQUARE_ACCESS_TOKEN not set' });

    function sqGet(path) {
      return new Promise((resolve, reject) => {
        const opts = { hostname: 'connect.squareup.com', path, method: 'GET', headers: { 'Authorization': 'Bearer ' + token, 'Square-Version': '2024-01-17' } };
        const r = https.request(opts, (res2) => { let b = ''; res2.on('data', c => b += c); res2.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } }); });
        r.on('error', reject); r.end();
      });
    }

    (async () => {
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

        const [bookData, catData] = await Promise.all([
          sqGet(`/v2/bookings?location_id=SA5CTAH41JNY2&start_at_min=${encodeURIComponent(startOfDay)}&start_at_max=${encodeURIComponent(endOfDay)}&limit=50`),
          sqGet('/v2/catalog/list?types=ITEM')
        ]);

        const svcMap = {};
        for (const obj of catData.objects || []) {
          const item = obj.item_data || {};
          for (const v of item.variations || []) { svcMap[v.id] = item.name; }
        }

        const bookings = bookData.bookings || [];
        const enriched = await Promise.all(bookings.map(async (b) => {
          let customerName = 'Client'; let customerPhone = '';
          try {
            if (b.customer_id) {
              const cd = await sqGet('/v2/customers/' + b.customer_id);
              const c = cd.customer || {};
              const fn = (c.given_name || '').trim(); const ln = (c.family_name || '').trim();
              if (fn || ln) customerName = (fn + ' ' + ln).trim();
              const phones = c.phone_numbers || [];
              if (phones.length) customerPhone = phones[0].number || '';
            }
          } catch(e) {}
          const seg = (b.appointment_segments || [])[0] || {};
          const varId = seg.service_variation_id || '';
          return { id: b.id, start_at: b.start_at, status: b.status, customer_name: customerName, customer_phone: customerPhone, service_name: svcMap[varId] || 'Appointment', duration_minutes: seg.duration_minutes || 30 };
        }));

        send(res, 200, { ok: true, schedule: enriched, date: now.toISOString().slice(0, 10) });
      } catch(e) {
        send(res, 500, { ok: false, error: 'Schedule fetch failed: ' + e.message });
      }
    })();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sarah/customer-lookup') {
    var lookupPhone = (url.searchParams.get('phone') || '').replace(/\D/g, '');
    if (!lookupPhone) return send(res, 400, { ok: false, error: 'Required query param: phone' });
    brainRequest({ action: 'customer_get', phone: lookupPhone })
      .then(result => send(res, 200, result))
      .catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sarah/customer-lapsed') {
    var days = url.searchParams.get('days') || '60';
    brainRequest({ action: 'customer_lapsed', days: days })
      .then(result => send(res, 200, result))
      .catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  // Report / planning task creation — reuses the task_create pipeline but tagged
  // as 'report' or 'plan' so the executor pulls real operational numbers first.
  if (req.method === 'POST' && url.pathname === '/sarah/report-agent') {
    readBody(req).then(async (item) => {
      try {
        const taskType = item.task_type === 'plan' ? 'plan' : 'report';
        const instructions = item.instructions || (taskType === 'plan' ? 'Generate next week\'s content/marketing plan.' : 'Generate this week\'s operational summary report.');
        const queued = await brainRequest({ action: 'task_create', task_type: taskType, instructions, requested_by: 'sarah' });
        if (!queued.ok) return send(res, 502, { ok: false, error: 'Brain API did not accept task', detail: queued });
        send(res, 200, { ok: true, task_id: queued.task_id, status: 'pending', note: 'Poll GET /sarah/task-result?task_id=... — runs via the Task Executor cron (every 3 min), grounded in real database numbers.' });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // Video request queue — Sarah queues a topic, a human-supervised process (not
  // an unattended cron) picks it up later and drives the AI avatar video pipeline.
  if (req.method === 'POST' && url.pathname === '/sarah/video-request') {
    readBody(req).then(async (item) => {
      try {
        if (!item.topic) return send(res, 400, { ok: false, error: 'Required: topic' });
        const queued = await brainRequest({ action: 'video_request_create', topic: item.topic, video_type: item.video_type || 'avatar_reel', requested_by: 'sarah' });
        if (!queued.ok) return send(res, 502, { ok: false, error: 'Brain API did not accept video request', detail: queued });
        appendLearning('editor', `Sarah queued a video request: "${item.topic.slice(0,80)}" (video_request_id ${queued.video_request_id}). This needs a human-supervised session to actually produce (Google Vids avatar pipeline) — it will NOT auto-generate. Check with Devang to pick this up.`);
        send(res, 200, { ok: true, video_request_id: queued.video_request_id, status: 'pending', note: 'Video generation is human-supervised (multi-minute browser automation with quality checks), not automatic. This request is queued for Devang/the video agent to pick up.' });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sarah/video-request-list') {
    const statusFilter = url.searchParams.get('status') || '';
    brainRequest({ action: 'video_request_list', status: statusFilter })
      .then(result => send(res, 200, result))
      .catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  // Link library: verified real URLs (booking, review, promo, website, socials).
  // link_type is required; booking/promo accept optional service/stage/source/promo_code.
  if (req.method === 'GET' && url.pathname === '/sarah/link') {
    var linkType = url.searchParams.get('link_type');
    if (!linkType) return send(res, 400, { ok: false, error: 'Required query param: link_type (booking, review, website, instagram, facebook, promo)' });
    var linkPayload = {
      action: 'link_get',
      link_type: linkType,
      service: url.searchParams.get('service') || undefined,
      stage: url.searchParams.get('stage') || undefined,
      source: url.searchParams.get('source') || undefined,
      promo_code: url.searchParams.get('promo_code') || undefined
    };
    brainRequest(linkPayload)
      .then(result => send(res, 200, result))
      .catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  // Email: compose and send a NEW email to a recipient via himalaya (real Gmail send).
  if (req.method === 'POST' && url.pathname === '/sarah/email-send') {
    readBody(req).then(async (item) => {
      try {
        if (!item.to || !item.subject || !item.body) return send(res, 400, { ok: false, error: 'Required: to, subject, body' });
        const { exec } = require('child_process');
        const execOpts = { timeout: 20000, maxBuffer: 5 * 1024 * 1024, env: Object.assign({}, process.env, { PATH: '/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '') }) };
        // Escape single quotes for shell safety in each arg
        const esc = (s) => String(s).replace(/'/g, "'\\''");
        const cmd = `himalaya message compose --to '${esc(item.to)}' --subject '${esc(item.subject)}' --body '${esc(item.body)}' --send`;
        exec(cmd, execOpts, (err, stdout, stderr) => {
          if (err) return send(res, 502, { ok: false, error: 'himalaya send failed: ' + (stderr || err.message) });
          send(res, 200, { ok: true, sent_to: item.to, subject: item.subject });
        });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // Email: reply to a specific message by ID (himalaya envelope id from email-check).
  if (req.method === 'POST' && url.pathname === '/sarah/email-reply') {
    readBody(req).then(async (item) => {
      try {
        if (!item.message_id || !item.body) return send(res, 400, { ok: false, error: 'Required: message_id, body' });
        const { exec } = require('child_process');
        const execOpts = { timeout: 20000, maxBuffer: 5 * 1024 * 1024, env: Object.assign({}, process.env, { PATH: '/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '') }) };
        const esc = (s) => String(s).replace(/'/g, "'\\''");
        const cmd = `himalaya message reply '${esc(item.message_id)}' --body '${esc(item.body)}' --send`;
        exec(cmd, execOpts, (err, stdout, stderr) => {
          if (err) return send(res, 502, { ok: false, error: 'himalaya reply failed: ' + (stderr || err.message) });
          send(res, 200, { ok: true, replied_to: item.message_id });
        });
      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // Email: unread/important inbox summary via the himalaya CLI (info@oxydermlaserclinic.ca
  // Gmail, connected via App Password in macOS Keychain). Uses hermes CLI to summarize
  // because raw envelope JSON isn't useful to a human as-is.
  if (req.method === 'GET' && url.pathname === '/sarah/email-check') {
    const { exec } = require('child_process');
    const execOpts = { timeout: 20000, maxBuffer: 5 * 1024 * 1024, env: Object.assign({}, process.env, { PATH: '/Users/genesis/.hermes/hermes-agent/venv/bin:/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '') }) };
    const cmd = "himalaya --json envelope search 'not flag seen' order by date desc";
    exec(cmd, execOpts, (err, stdout, stderr) => {
      if (err) return send(res, 502, { ok: false, error: 'himalaya failed: ' + (stderr || err.message) });
      let parsed;
      try { parsed = JSON.parse(stdout); } catch (e) { return send(res, 502, { ok: false, error: 'could not parse himalaya output' }); }
      const envelopes = parsed.envelopes || [];
      if (envelopes.length === 0) return send(res, 200, { ok: true, unread_count: 0, summary: 'No unread emails.' });
      const brief = envelopes.slice(0, 15).map(e => `From: ${(e.from && e.from[0] && (e.from[0].name || e.from[0].email)) || 'unknown'} | Subject: ${e.subject} | Date: ${e.date}`).join('\n');
      const prompt = `You are summarizing unread emails for the Oxyderm Laser Clinic owner. Here are ${envelopes.length} unread email headers (subject/sender/date only, no body):\n\n${brief}\n\nGroup into: urgent/needs action today, client-related, routine/low-priority, spam/ignore. Be brief and specific. No em-dashes, no emojis, no fluff.`;
      const escaped = prompt.replace(/'/g, "'\\''");
      exec(`hermes -z '${escaped}'`, Object.assign({}, execOpts, { timeout: 60000 }), (err2, stdout2) => {
        if (err2) return send(res, 200, { ok: true, unread_count: envelopes.length, summary: 'Found ' + envelopes.length + ' unread emails but could not summarize (Hermes CLI error). Raw subjects: ' + envelopes.slice(0,10).map(e=>e.subject).join('; ') });
        send(res, 200, { ok: true, unread_count: envelopes.length, summary: stdout2.trim() });
      });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    return send(res, 200, {
      service: 'Oxyderm Automation Engine',
      endpoints: [
        'GET /status', 'GET /state', 'GET /postiz/status', 'POST /event {type, payload}',
        'POST /sarah/book {name, phone?, email?, serviceName, startAtISO, sellerNote?}',
        'POST /sarah/cancel {bookingId, reason?}',
        'POST /sarah/reschedule {bookingId, newStartAtISO}',
        'POST /sarah/find-bookings {phone}',
        'POST /sarah/ask-agent {agent, question, context?}',
        'GET /sarah/agent-answer?question_id=...',
        'POST /sarah/research-agent {instructions, task_type?}',
        'GET /sarah/task-result?task_id=...',
        'POST /sarah/customer-memory {phone, name?, email?, tags?, treatments?, retarget_notes?, consent_marketing?}',
        'GET /sarah/customer-lookup?phone=...',
        'GET /sarah/customer-lapsed?days=60',
        'GET /sarah/email-check',
        'GET /sarah/link?link_type=booking|review|website|instagram|facebook|promo&service?&stage?&source?&promo_code?',
        'POST /sarah/report-agent {task_type: report|plan, instructions?}',
        'POST /sarah/video-request {topic, video_type?}',
        'GET /sarah/video-request-list?status=',
        'POST /sarah/email-send {to, subject, body}',
        'POST /sarah/email-reply {message_id, body}'
      ],
      port: PORT
    });
  }

  // ── AGENTIC LOOP — Research → Plan → Create → Verify → Queue → Result ──
  // POST /run-loop { job, agent? }
  // Receives a natural-language job from Sarah or any agent tab.
  // Chains 6 sequential Claude Pro calls, each feeding the next.
  // On verify pass: POSTs result to api.php as a pending post (awaiting-hetisha).
  // On verify fail: returns the flagged issues so the caller can tell the user.
  // Sends Telegram notification when work is ready for review.
  if (req.method === 'POST' && url.pathname === '/run-loop') {
    readBody(req).then(async (item) => {
      try {
        const job = (item.job || '').trim();
        const requestingAgent = (item.agent || 'sarah').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (!job) return send(res, 400, { ok: false, error: 'Required: job' });

        const { exec } = require('child_process');
        const execOpts = {
          timeout: 180000,   // 3 min per step — hermes can take 60-90s on large prompts
          maxBuffer: 8 * 1024 * 1024,
          env: Object.assign({}, process.env, {
            PATH: '/Users/genesis/.hermes/hermes-agent/venv/bin:/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '')
          })
        };

        // Helper: run one hermes call via temp file (avoids ARG_MAX for large prompts)
        const { spawn } = require('child_process');
        const os = require('os');
        function hermesStep(prompt) {
          return new Promise((resolve, reject) => {
            // Write prompt to temp file; use shell $(cat file) to avoid ARG_MAX
            const tmpFile = path.join(os.tmpdir(), `oxyderm-loop-${Date.now()}.txt`);
            try { fs.writeFileSync(tmpFile, prompt, 'utf8'); } catch(e) { return reject(e); }
            const sh = `/bin/sh -c "hermes -z \\"\\$(cat '${tmpFile}')\\""`;
            exec(sh, execOpts, (err, stdout, stderr) => {
              try { fs.unlinkSync(tmpFile); } catch(_) {}
              const out = (stdout || '').trim();
              if (err && !out) return reject(new Error((stderr || err.message || 'hermes failed').slice(0,300)));
              resolve(out);
            });
            return; // prevent fall-through to old spawn code
          });
        }
        // hermesRun = alias (hermesStep now handles all sizes via temp file)
        function hermesRun(prompt) { return hermesStep(prompt); }

        // Load brand context files for grounding
        const brandDir = '/Users/genesis/brand/oxyderm';
        function readBrand(file) {
          try { return fs.readFileSync(path.join(brandDir, file), 'utf8').slice(0, 3000); } catch (_) { return ''; }
        }
        const verifiedClaims = readBrand('verified-claims.md');
        const voiceProfile   = readBrand('voice-profile.md');
        const policy         = readBrand('policy.md');
        const icaProfile     = readBrand('ica-output.md');

        // Load agent learnings
        function loadLearnings(agentId) {
          try {
            const p = path.join(AGENTS_DIR, agentId, 'learnings.md');
            if (!fs.existsSync(p)) return '';
            const raw = fs.readFileSync(p, 'utf8');
            return raw.length > 3000 ? raw.slice(0, 3000) + '\n[...truncated]' : raw;
          } catch (_) { return ''; }
        }

        // Announce start
        log(`[run-loop] START job="${job.slice(0,80)}" agent=${requestingAgent}`);
        send(res, 200, { ok: true, status: 'running', message: 'Loop started. Check Telegram for result.' });

        // Run async after responding so client is not blocked
        setImmediate(async () => {
          try {
            const loopId = Date.now().toString(36);

            // ── STEP 1: RESEARCH ──
            log(`[run-loop:${loopId}] Step 1 — Research`);
            const researchLearnings = loadLearnings('research') + '\n' + loadLearnings('trending') + '\n' + loadLearnings('competitor');
            const researchPrompt = `You are the Research Agent for Oxyderm Laser Clinic in Edmonton, Canada.
Oxyderm offers laser hair removal and microneedling. Owner/face: Hetisha. Brand: navy #00172D, gold #c9a96e.
ICA summary: ${icaProfile.slice(0,800)}

AGENT KNOWLEDGE:
${researchLearnings.slice(0,2000)}

JOB REQUESTED: ${job}

Your task is STEP 1 — RESEARCH ONLY.
Search your knowledge for: current trends, proven hooks, competitor gaps, and what performs best for this type of content in the Edmonton/Canada laser clinic market.
Return a structured research brief: 3-5 key findings, each with a clear hook angle and why it will resonate with Oxyderm's ICA.
Be specific. No fluff. No em-dashes. No emojis.`;

            const researchOutput = await hermesRun(researchPrompt);
            log(`[run-loop:${loopId}] Step 1 done (${researchOutput.length} chars)`);

            // ── STEP 2: PLAN ──
            log(`[run-loop:${loopId}] Step 2 — Plan`);
            const planLearnings = loadLearnings('planning') + '\n' + loadLearnings('content-calendar');
            const planPrompt = `You are the Content Calendar and Planning Agent for Oxyderm Laser Clinic Edmonton.
Brand voice: confident, warm, educational, never salesy. Hetisha is the face. Dark skin tones welcome, Fitzpatrick V-VI specialist.

AGENT KNOWLEDGE:
${planLearnings.slice(0,1500)}

RESEARCH FROM STEP 1:
${researchOutput.slice(0,2000)}

ORIGINAL JOB: ${job}

Your task is STEP 2 — PLAN ONLY.
Based on the research, create a concrete content plan:
- How many pieces (match what the job asked for)
- Format for each piece (Reel, Story, Post, Blog, etc.)
- Platform for each piece (Instagram, Facebook, TikTok, YouTube, GBP)
- Posting day (Mon/Tue/Wed/Thu/Fri/Sat/Sun)
- One-line brief for each piece (topic + angle + hook direction)

No content yet. Plan only. No em-dashes. No emojis.`;

            const planOutput = await hermesRun(planPrompt);
            log(`[run-loop:${loopId}] Step 2 done (${planOutput.length} chars)`);

            // ── STEP 3: CREATE ──
            log(`[run-loop:${loopId}] Step 3 — Create`);

            // Fetch real client media from Google Drive (heti.oxyderm@gmail.com)
            log(`[run-loop:${loopId}] Step 3a — Fetching Drive media`);
            const driveMedia = await fetchDriveMedia(5);
            log(`[run-loop:${loopId}] Step 3a — Drive media fetched: ${driveMedia.length} file(s)`);

            // Build media context string for the create prompt
            let mediaContext = '';
            if (driveMedia.length > 0) {
              const mediaList = driveMedia.map((m, i) =>
                `${i+1}. ${m.isVideo ? 'VIDEO' : 'IMAGE'}: ${m.name} | Drive link: ${m.webViewLink} | local: ${m.localPath}`
              ).join('\n');
              mediaContext = `\nREAL CLIENT MEDIA FROM GOOGLE DRIVE (use these for the post visuals):\n${mediaList}\n\nFor each content piece, specify which media file to use (by number above). If the media matches the caption topic, use it directly. If the media does NOT match the caption, specify: USE OPTION A — generate a branded overlay image using navy #00172D background, gold #c9a96e text, brand font Montserrat. Write the overlay text for Option A.\n`;
            } else {
              mediaContext = `\nNO DRIVE MEDIA AVAILABLE: For each piece, write an Option A branded image prompt: navy #00172D background, gold #c9a96e accent, Montserrat font. Include the overlay text and visual layout.\n`;
            }

            const createLearnings = loadLearnings('video-script') + '\n' + loadLearnings('social') + '\n' + loadLearnings('marketing');
            const createPrompt = `You are the Content Creation Agent for Oxyderm Laser Clinic Edmonton.
Write in Hetisha's voice: direct, warm, confident, educational. Never salesy. Never fabricate stats.

VERIFIED CLAIMS (only use facts from this list):
${verifiedClaims.slice(0,2000)}

AGENT KNOWLEDGE:
${createLearnings.slice(0,1500)}

CONTENT PLAN FROM STEP 2:
${planOutput.slice(0,2000)}
${mediaContext}
ORIGINAL JOB: ${job}

Your task is STEP 3 — CREATE THE CONTENT.
Write each piece in full. For Reels/Videos: full 30-second script with hook (0-3s), body (3-25s), CTA (25-30s).
For posts/captions: full caption with hook, body, CTA, 3-5 hashtags max.
For each piece include: platform, format, posting day, full content, and MEDIA ASSIGNMENT (which Drive file or Option A overlay).
No placeholders. No "[insert here]". Complete ready-to-post content only.
No em-dashes. No emojis unless the platform requires them (Instagram/TikTok captions only, max 3).`;

            const createOutput = await hermesRun(createPrompt);
            log(`[run-loop:${loopId}] Step 3 done (${createOutput.length} chars)`);

            // ── STEP 4: VERIFY ──
            log(`[run-loop:${loopId}] Step 4 — Verify`);
            const verifyPrompt = `You are the Brand Compliance Verifier for Oxyderm Laser Clinic Edmonton.
Your job is to check content against strict rules before it goes to Hetisha for approval.

VERIFIED CLAIMS (only facts on this list are allowed):
${verifiedClaims.slice(0,2000)}

BRAND VOICE RULES:
${voiceProfile.slice(0,1000)}

POLICY RULES:
${policy.slice(0,800)}

HARD RULES (flag ANY violation):
1. No em-dashes (use periods, commas, or colons instead)
2. No invented statistics, percentages, or numbers not in the verified claims list
3. No competitor clinic names used negatively
4. No medical claims beyond what is in verified-claims.md
5. No emojis in video scripts or blog content
6. CTA must point to booking (oxydermlaserclinic.ca or Square booking link) — no made-up URLs
7. Content must sound like Hetisha — warm, direct, educational

CONTENT TO VERIFY:
${createOutput.slice(0,3000)}

Return a JSON object with this exact structure:
{
  "passed": true or false,
  "pieces": [
    { "piece": "piece name or number", "pass": true/false, "issues": ["issue 1", "issue 2"] }
  ],
  "summary": "one sentence overall verdict",
  "fixed_content": "if any pieces failed, rewrite ONLY those pieces with issues fixed. If all passed, write NONE."
}`;

            const verifyRaw = await hermesRun(verifyPrompt);
            log(`[run-loop:${loopId}] Step 4 done`);

            // Parse verify result
            let verifyResult = { passed: false, summary: 'Verify parse error', pieces: [], fixed_content: '' };
            try {
              const jsonMatch = verifyRaw.match(/\{[\s\S]*\}/);
              if (jsonMatch) verifyResult = JSON.parse(jsonMatch[0]);
            } catch (_) {
              verifyResult.summary = 'Could not parse verify output. Raw: ' + verifyRaw.slice(0,200);
            }

            // Use fixed content if verifier rewrote anything
            const finalContent = (verifyResult.fixed_content && verifyResult.fixed_content !== 'NONE')
              ? verifyResult.fixed_content
              : createOutput;

            // ── STEP 5: QUEUE FOR REVIEW ──
            log(`[run-loop:${loopId}] Step 5 — Queue for review`);

            // Save result to a local review file the dashboard can read
            const reviewDir = path.join(__dirname, '..', 'data', 'review-queue');
            if (!fs.existsSync(reviewDir)) fs.mkdirSync(reviewDir, { recursive: true });
            const reviewFile = path.join(reviewDir, `${loopId}.json`);
            const reviewEntry = {
              id: loopId,
              created_at: new Date().toISOString(),
              job,
              requesting_agent: requestingAgent,
              status: 'awaiting-hetisha',
              research: researchOutput,
              plan: planOutput,
              content: finalContent,
              verify_passed: verifyResult.passed,
              verify_summary: verifyResult.summary,
              verify_pieces: verifyResult.pieces || [],
              drive_media: driveMedia.map(m => ({
                id: m.id,
                name: m.name,
                mimeType: m.mimeType,
                localPath: m.localPath,
                webViewLink: m.webViewLink,
                isVideo: m.isVideo,
                isImage: m.isImage
              }))
            };
            fs.writeFileSync(reviewFile, JSON.stringify(reviewEntry, null, 2));

            // Mark Drive files as used so next loop gets fresh media
            if (driveMedia.length > 0) markDriveUsed(driveMedia.map(m => m.id));

            // Also try to post to api.php so it appears on HostGator dashboard
            const BRAND_API_URL = 'http://api.oxydermlaserclinic.ca/api.php';
            const secrets = (() => {
              try {
                const lines = fs.readFileSync('/Users/genesis/.oxyderm/secrets.env', 'utf8').split('\n');
                const obj = {};
                lines.forEach(l => { const [k,...v] = l.split('='); if(k) obj[k.trim()] = v.join('=').trim(); });
                return obj;
              } catch(_) { return {}; }
            })();
            const apiKey = secrets.OXYDERM_API_KEY || secrets.API_KEY || '';

            if (apiKey) {
              try {
                const postPayload = JSON.stringify({
                  action: 'loop_result_create',
                  loop_id: loopId,
                  job,
                  content: finalContent.slice(0, 8000),
                  verify_passed: verifyResult.passed,
                  verify_summary: verifyResult.summary,
                  status: 'awaiting-hetisha',
                  requesting_agent: requestingAgent
                });
                const postReq = require('https').request(
                  { hostname: 'api.oxydermlaserclinic.ca', path: '/api.php', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'Content-Length': Buffer.byteLength(postPayload) }},
                  (r) => { log(`[run-loop:${loopId}] api.php loop_result_create → HTTP ${r.statusCode}`); }
                );
                postReq.on('error', e => log(`[run-loop:${loopId}] api.php post failed: ${e.message}`));
                postReq.write(postPayload);
                postReq.end();
              } catch(e) { log(`[run-loop:${loopId}] api.php post error: ${e.message}`); }
            }

            // ── STEP 6: RESULT — Telegram notification ──
            log(`[run-loop:${loopId}] Step 6 — Notify`);
            const verifyBadge = verifyResult.passed ? 'PASSED' : 'FLAGGED';
            const flaggedCount = (verifyResult.pieces || []).filter(p => !p.pass).length;
            const telegramMsg = [
              'Oxyderm Agent Loop Complete',
              `Job: ${job.slice(0,100)}`,
              `Verify: ${verifyBadge}${flaggedCount > 0 ? ` (${flaggedCount} piece(s) auto-fixed)` : ''}`,
              `Summary: ${verifyResult.summary}`,
              'Open dashboard, go to Review Queue tab to Approve, Deny, or Fix.',
              `Loop ID: ${loopId}`
            ].join('\n');

            // Send via hermes telegram delivery
            const esc2 = (s) => String(s).replace(/'/g, "'\\''");
            exec(`hermes -z 'Send this exact message to Telegram via the notification system: ${esc2(telegramMsg)}'`, execOpts, (err) => {
              if (err) log(`[run-loop:${loopId}] Telegram notify failed: ${err.message}`);
              else log(`[run-loop:${loopId}] Telegram notified`);
            });

            log(`[run-loop:${loopId}] COMPLETE. Review file: ${reviewFile}`);

          } catch (loopErr) {
            log(`[run-loop] LOOP ERROR: ${loopErr.message}`);
          }
        });

      } catch (e) {
        send(res, 500, { ok: false, error: e.message });
      }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // ── REVIEW QUEUE — list pending loop results for dashboard ──
  // GET /review-queue
  if (req.method === 'GET' && url.pathname === '/review-queue') {
    try {
      const reviewDir = path.join(__dirname, '..', 'data', 'review-queue');
      if (!fs.existsSync(reviewDir)) return send(res, 200, { ok: true, items: [] });
      const files = fs.readdirSync(reviewDir).filter(f => f.endsWith('.json'));
      const items = files.map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(reviewDir, f), 'utf8')); }
        catch(_) { return null; }
      }).filter(Boolean).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      send(res, 200, { ok: true, items });
    } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    return;
  }

  // ── REVIEW QUEUE ACTION — approve / deny / fix ──
  // POST /review-queue/action { loop_id, action: 'approve'|'deny'|'fix', note? }
  if (req.method === 'POST' && url.pathname === '/review-queue/action') {
    readBody(req).then(async (item) => {
      try {
        const loopId = (item.loop_id || '').trim();
        const action = (item.action || '').trim(); // approve | deny | fix
        const note   = (item.note || '').trim();
        if (!loopId || !action) return send(res, 400, { ok: false, error: 'Required: loop_id, action' });

        const reviewDir = path.join(__dirname, '..', 'data', 'review-queue');
        const reviewFile = path.join(reviewDir, `${loopId}.json`);
        if (!fs.existsSync(reviewFile)) return send(res, 404, { ok: false, error: 'Loop result not found' });

        const entry = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));

        if (action === 'approve') {
          entry.status = 'approved';
          entry.approved_at = new Date().toISOString();
          fs.writeFileSync(reviewFile, JSON.stringify(entry, null, 2));

          // Dispatch to n8n for publishing — route to correct webhook by platform
          // n8n Switch node routes on platforms array: ['meta'] → Meta (IG/FB)
          // caption field: queue items store as entry.caption or entry.content
          const captionText = (entry.caption || entry.content || '').slice(0, 2200);
          // media_url: prefer direct downloadUrl (public), fall back to media_url field set by dashboard
          const driveFile = entry.drive_media && entry.drive_media[0];
          const mediaUrl = entry.media_url ||
            (driveFile && (driveFile.downloadUrl || driveFile.thumbnailLink || '')) || '';
          const mediaType = (entry.media_type) ||
            ((entry.drive_media && entry.drive_media.some(m => m.isVideo)) ? 'REELS' : 'IMAGE');
          const platforms = entry.platforms || ['meta'];
          // Route to platform-specific webhook (first platform wins for routing)
          const primaryPlatform = (platforms[0] || 'meta').toLowerCase();
          const webhookPath = N8N_PLATFORM_WEBHOOKS[primaryPlatform] || N8N_WEBHOOK_URL;
          const webhookParsed = new URL(webhookPath);
          const n8nPayload = JSON.stringify({
            caption: captionText,
            media_type: mediaType,
            media_url: mediaUrl,
            platforms: platforms,
            job: entry.job,
            loop_id: loopId,
            source: 'run-loop'
          });
          try {
            const n8nReq = require('http').request(
              { hostname: webhookParsed.hostname, port: parseInt(webhookParsed.port||5678),
                path: webhookParsed.pathname, method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(n8nPayload) }},
              (r) => {
                let rb = '';
                r.on('data', c => rb += c);
                r.on('end', () => log(`[review-action] n8n dispatch → ${primaryPlatform} HTTP ${r.statusCode} ${rb.slice(0,200)}`));
              }
            );
            n8nReq.on('error', e => log(`[review-action] n8n dispatch failed: ${e.message}`));
            n8nReq.write(n8nPayload);
            n8nReq.end();
          } catch(e) { log(`[review-action] n8n error: ${e.message}`); }

          // Log to agent learnings
          appendLearning('social', `Loop ${loopId} approved: "${entry.job.slice(0,60)}"`);
          send(res, 200, { ok: true, status: 'approved', message: 'Approved and sent to n8n for publishing.' });

        } else if (action === 'deny') {
          entry.status = 'denied';
          entry.denied_at = new Date().toISOString();
          entry.deny_note = note;
          fs.writeFileSync(reviewFile, JSON.stringify(entry, null, 2));
          appendLearning(entry.requesting_agent, `Loop ${loopId} denied: "${note.slice(0,100)}"`);
          send(res, 200, { ok: true, status: 'denied' });

        } else if (action === 'fix') {
          // Re-run create step with the fix note added
          entry.status = 'fixing';
          entry.fix_note = note;
          fs.writeFileSync(reviewFile, JSON.stringify(entry, null, 2));

          send(res, 200, { ok: true, status: 'fixing', message: 'Fix requested. Rewriting content now. Check Telegram.' });

          setImmediate(async () => {
            try {
              const { exec } = require('child_process');
              const execOpts = {
                timeout: 60000, maxBuffer: 4 * 1024 * 1024,
                env: Object.assign({}, process.env, {
                  PATH: '/Users/genesis/.hermes/hermes-agent/venv/bin:/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '')
                })
              };
              const esc = (s) => String(s).replace(/'/g, "'\\''");
              const brandDir = '/Users/genesis/brand/oxyderm';
              const verifiedClaims = (() => { try { return fs.readFileSync(path.join(brandDir, 'verified-claims.md'), 'utf8').slice(0,2000); } catch(_){return '';} })();

              const originalContent = (entry.caption || entry.content || '').slice(0, 3000);
              const fixPrompt = `You are the Content Creation Agent for Oxyderm Laser Clinic Edmonton.
Rewrite the following content to fix the issues noted by the reviewer.

ORIGINAL CONTENT:
${originalContent}

REVIEWER FIX NOTE:
${note}

VERIFIED CLAIMS (stay within these facts only):
${verifiedClaims.slice(0,1500)}

Rewrite the full content with the issues fixed. Keep everything else the same. No em-dashes. No invented stats.`;

              const tmpFix = path.join(require('os').tmpdir(), `oxyderm-fix-${Date.now()}.txt`);
              fs.writeFileSync(tmpFix, fixPrompt, 'utf8');
              // Try primary (Claude) first, fall back to grok-3-mini, then llama free.
              // Explicit flags so the subprocess never waits blind if Claude is slow.
              const tryProviders = [
                `hermes --provider anthropic --model claude-sonnet-4-6 -z "$(cat '${tmpFix}')"`,
                `hermes --provider xai-oauth --model grok-3-mini -z "$(cat '${tmpFix}')"`,
                `hermes --provider openrouter --model meta-llama/llama-3.3-70b-instruct:free -z "$(cat '${tmpFix}')"`,
              ];
              const tryNext = (providers, attempt) => {
                if (!providers.length) {
                  // All providers failed — keep original, mark needs-fix
                  entry.caption = entry.caption || entry.content || '';
                  entry.content = entry.content || entry.caption;
                  entry.status = 'needs-fix';
                  entry.fix_error = 'All AI providers failed. Try again later.';
                  fs.writeFileSync(reviewFile, JSON.stringify(entry, null, 2));
                  return;
                }
                const shFix = providers[0];
                exec(shFix, { ...execOpts, timeout: 45000 }, (err, stdout) => {
                  try { if (attempt === 0) fs.unlinkSync(tmpFix); } catch(_){}
                  if (err || !stdout.trim()) {
                    log(`[fix] provider attempt ${attempt} failed (${err?.message || 'empty'}), trying next`);
                    return tryNext(providers.slice(1), attempt + 1);
                  }
                  const fixedContent = stdout.trim();
                  entry.caption = fixedContent;
                  entry.content = fixedContent;
                  entry.status = 'awaiting-hetisha';
                  entry.fixed_at = new Date().toISOString();
                  entry.fix_provider = attempt === 0 ? 'claude' : attempt === 1 ? 'grok' : 'llama';
                  fs.writeFileSync(reviewFile, JSON.stringify(entry, null, 2));
                  appendLearning(entry.requesting_agent, `Loop ${loopId} fixed via ${entry.fix_provider}: "${note.slice(0,80)}"`);
                  const telegramMsg = `Oxyderm: Content fixed (${entry.fix_provider}) and ready for re-review.\nJob: ${entry.job.slice(0,80)}\nLoop ID: ${loopId}\nOpen dashboard Review Queue.`;
                  exec(`hermes -z '${esc(`Send this exact message to Telegram: ${telegramMsg}`)}'`, execOpts, ()=>{});
                });
              };
              tryNext(tryProviders, 0);
              // eslint-disable-next-line no-unused-expressions
              void 0; // tryNext handles all state writes above
              // All writes handled inside tryNext above
            } catch(fixErr) { log(`[review-action/fix] error: ${fixErr.message}`); }
          });

        } else {
          send(res, 400, { ok: false, error: 'action must be approve, deny, or fix' });
        }

      } catch(e) { send(res, 500, { ok: false, error: e.message }); }
    }).catch(e => send(res, 400, { ok: false, error: 'invalid JSON body' }));
    return;
  }

  // GET /drain-queue — retry all locally-queued pending publish items
  if (req.method === 'GET' && url.pathname === '/drain-queue') {
    const q = loadPostizQueue();
    const pending = q.pending || [];
    if (!pending.length) return send(res, 200, { ok: true, drained: 0, message: 'Nothing pending.' });
    const results = [];
    let drained = 0;
    const drain = async () => {
      for (const item of pending) {
        if (!canMakePostizCall()) { results.push({ id: item.id, status: 'rate-limited' }); continue; }
        recordPostizCall();
        const r = await dispatchToN8n(item);
        if (r.ok) {
          drained++;
          results.push({ id: item.id, status: 'dispatched' });
        } else {
          results.push({ id: item.id, status: 'failed', error: r.error });
        }
      }
      // Remove successfully dispatched items from queue
      q.pending = pending.filter((_, i) => results[i]?.status !== 'dispatched');
      savePostizQueue(q);
      send(res, 200, { ok: true, drained, remaining: q.pending.length, results });
    };
    drain().catch(e => send(res, 500, { ok: false, error: e.message }));
    return;
  }

  send(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, () => {
  log(`Oxyderm Automation Engine listening on http://localhost:${PORT}`);
});

// ---- NO-SHOW DETECTION (runs every 15 min) ----
async function detectNoShows() {
  const https = require('https');
  const fs = require('fs');
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return;

  function sqGet(path) {
    return new Promise((resolve, reject) => {
      const opts = { hostname: 'connect.squareup.com', path, method: 'GET', headers: { 'Authorization': 'Bearer ' + token, 'Square-Version': '2024-01-17' } };
      const r = https.request(opts, (res2) => { let b = ''; res2.on('data', c => b += c); res2.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } }); });
      r.on('error', reject); r.end();
    });
  }

  try {
    // Fetch bookings from last 48h to catch recent no-shows
    const since = new Date(Date.now() - 48 * 3600000).toISOString();
    const until = new Date().toISOString();
    const data = await sqGet(`/v2/bookings?location_id=SA5CTAH41JNY2&start_at_min=${encodeURIComponent(since)}&start_at_max=${encodeURIComponent(until)}&limit=50`);
    const bookings = data.bookings || [];

    const jobsPath = __dirname + '/../data/jobs.json';
    const jobs = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
    const existingBookingIds = new Set(jobs.map(j => j.booking_id).filter(Boolean));

    let created = 0;
    for (const b of bookings) {
      const status = (b.status || '').toUpperCase();
      if ((status === 'CANCELLED' || status === 'NO_SHOW' || status === 'CANCELLED_BY_SELLER' || status === 'CANCELLED_BY_CUSTOMER') && !existingBookingIds.has(b.id)) {
        // Fetch customer name
        let customerName = 'Client';
        let customerPhone = '';
        try {
          if (b.customer_id) {
            const cd = await sqGet('/v2/customers/' + b.customer_id);
            const c = cd.customer || {};
            const fn = (c.given_name || '').trim();
            const ln = (c.family_name || '').trim();
            if (fn || ln) customerName = (fn + ' ' + ln).trim();
            const phones = c.phone_numbers || [];
            if (phones.length) customerPhone = phones[0].number || '';
          }
        } catch(e) {}

        const now = new Date();
        const job = {
          id: 'job_noshow_' + b.id,
          org_id: 'oxyderm',
          recipe: 'no_show_recovery',
          booking_id: b.id,
          lead_name: customerName,
          lead_phone: customerPhone,
          trigger: status === 'NO_SHOW' ? 'no_show' : 'cancelled',
          created_at: now.toISOString(),
          steps: [{
            step: 1,
            label: 'No-show recovery',
            channel: 'sms',
            template: `Hi ${customerName}, we missed you today! Life happens — rebook anytime: https://square.site/book/SA5CTAH41JNY2/oxyderm-laser-clinic-academy-edmonton-ab`,
            scheduled_at: new Date(now.getTime() + 3600000).toISOString(),
            status: 'pending_provider'
          }]
        };
        jobs.unshift(job);
        existingBookingIds.add(b.id);
        created++;
        log(`[no-show] Created recovery job for ${customerName} (booking ${b.id}, status ${status})`);
      }
    }

    if (created > 0) {
      fs.writeFileSync(jobsPath, JSON.stringify(jobs.slice(0, 500), null, 2));
      log(`[no-show] ${created} recovery job(s) created`);
    }
  } catch(e) {
    log(`[no-show] Detection failed: ${e.message}`);
  }
}

// Run no-show detection every 15 minutes
setInterval(() => { detectNoShows(); }, 15 * 60 * 1000);
// Also run once on startup after 30s
setTimeout(() => { detectNoShows(); }, 30000);

// ---- COMPLETED VISIT DETECTION (review request trigger) ----
async function detectCompletedVisits() {
  const https = require('https');
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return;

  function sqGet(sqPath) {
    return new Promise((resolve, reject) => {
      const opts = { hostname: 'connect.squareup.com', path: sqPath, method: 'GET', headers: { 'Authorization': 'Bearer ' + token, 'Square-Version': '2024-01-17' } };
      const r = https.request(opts, (res2) => { let b = ''; res2.on('data', c => b += c); res2.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } }); });
      r.on('error', reject); r.end();
    });
  }

  try {
    const rrPath = path.join(__dirname, '../data/review-requests.json');
    const rr = fs.existsSync(rrPath) ? JSON.parse(fs.readFileSync(rrPath, 'utf8')) : [];
    const existingApptIds = new Set(rr.map(r => r.appointment_id).filter(Boolean));

    // Look at bookings from last 48h that should be completed
    const since = new Date(Date.now() - 48 * 3600000).toISOString();
    const until = new Date(Date.now() - 3600000).toISOString(); // at least 1h ago
    const data = await sqGet(`/v2/bookings?location_id=SA5CTAH41JNY2&start_at_min=${encodeURIComponent(since)}&start_at_max=${encodeURIComponent(until)}&limit=50`);
    const bookings = data.bookings || [];

    let created = 0;
    for (const b of bookings) {
      const status = (b.status || '').toUpperCase();
      // ACCEPTED bookings whose end time has passed = completed visit
      if (status !== 'ACCEPTED') continue;
      if (existingApptIds.has(b.id)) continue;
      const seg = (b.appointment_segments || [])[0] || {};
      const dur = seg.duration_minutes || 30;
      const endTime = new Date(new Date(b.start_at).getTime() + dur * 60000);
      if (endTime > new Date()) continue; // not finished yet

      // Fetch customer contact
      let contact = 'Client'; let phone = ''; let email = '';
      try {
        if (b.customer_id) {
          const cd = await sqGet('/v2/customers/' + b.customer_id);
          const c = cd.customer || {};
          const fn = (c.given_name || '').trim(); const ln = (c.family_name || '').trim();
          if (fn || ln) contact = (fn + ' ' + ln).trim();
          const phones = c.phone_numbers || [];
          if (phones.length) phone = phones[0].number || '';
          const emails = c.email_addresses || [];
          if (emails.length) email = emails[0].address || '';
        }
      } catch(e) {}

      // Apply skip rules
      if (!phone && !email) {
        rr.unshift({ id: 'rr_' + Date.now(), org_id: 'oxyderm', appointment_id: b.id, contact, phone: '', email: '', channel: 'none', status: 'skipped', skip_reason: 'no_contact', created_at: new Date().toISOString() });
        existingApptIds.add(b.id);
        continue;
      }

      // Get review URL
      const dnaPath = '/Users/genesis/brand/oxyderm/context.md';
      let reviewUrl = 'https://g.page/r/oxyderm';
      if (fs.existsSync(dnaPath)) {
        const dna = fs.readFileSync(dnaPath, 'utf8');
        const match = dna.match(/(https:\/\/g\.page[^\s]+)/i);
        if (match) reviewUrl = match[1].trim();
      }

      const channel = email ? 'email' : 'sms';
      const rreq = { id: 'rr_' + Date.now(), org_id: 'oxyderm', appointment_id: b.id, contact, phone, email, channel, message: `Hi ${contact}, thank you for visiting Oxyderm! Would you mind sharing your experience? ${reviewUrl}`, review_url: reviewUrl, status: 'queued', draft_reply: '', created_at: new Date().toISOString() };
      rr.unshift(rreq);
      existingApptIds.add(b.id);
      created++;
      log(`[reputation] Review request queued for ${contact} (appt ${b.id})`);
    }

    if (created > 0 || rr.length !== (fs.existsSync(rrPath) ? JSON.parse(fs.readFileSync(rrPath, 'utf8')) : []).length) {
      fs.writeFileSync(rrPath, JSON.stringify(rr.slice(0, 500), null, 2));
    }
  } catch(e) {
    log(`[reputation] detectCompletedVisits failed: ${e.message}`);
  }
}

// Run completed visit detection every 15 min + 45s after startup
setInterval(() => { detectCompletedVisits(); }, 15 * 60 * 1000);
setTimeout(() => { detectCompletedVisits(); }, 45000);

// ---- DAILY LEARNING JOB ----
async function runDailyLearning() {
  const learnPath = path.join(__dirname, '../data/learnings.json');
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Load existing learning log
    const existing = fs.existsSync(learnPath) ? JSON.parse(fs.readFileSync(learnPath, 'utf8')) : [];
    // Don't duplicate today's entry
    if (existing.length && existing[0].date === today) return;

    // Collect learnings from all agent files (last 7 days of lines)
    const agentsDir = path.join(__dirname, '../agents');
    const cutoff = new Date(Date.now() - 7 * 24 * 3600000).toISOString().slice(0, 10);
    const agentSummaries = [];

    const agentFolders = fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir) : [];
    for (const folder of agentFolders) {
      const lFile = path.join(agentsDir, folder, 'learnings.md');
      if (!fs.existsSync(lFile)) continue;
      const lines = fs.readFileSync(lFile, 'utf8').split('\n')
        .filter(l => l.startsWith('- 20') && l.slice(2, 12) >= cutoff)
        .slice(0, 5);
      if (lines.length) agentSummaries.push({ agent: folder, recent: lines });
    }

    // Read score events
    const scoresPath = path.join(__dirname, '../data/scores.json');
    const scores = fs.existsSync(scoresPath) ? JSON.parse(fs.readFileSync(scoresPath, 'utf8')) : [];
    const scoresSummary = scores.filter(s => s.score > 0).map(s => `${s.agent}: ${s.score} pts`).join(', ');

    // Read recent jobs
    const jobsPath = path.join(__dirname, '../data/jobs.json');
    const jobs = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, 'utf8')) : [];
    const recentJobs = jobs.filter(j => j.created_at >= cutoff);
    const jobsSummary = recentJobs.length + ' automation job(s) created: ' +
      [...new Set(recentJobs.map(j => j.recipe))].join(', ');

    const entry = {
      date: today,
      summary: `Daily digest for ${today}`,
      scores: scoresSummary || 'No score events yet',
      jobs: jobsSummary,
      agent_learnings: agentSummaries,
      generated_at: new Date().toISOString()
    };

    existing.unshift(entry);
    fs.writeFileSync(learnPath, JSON.stringify(existing.slice(0, 30), null, 2));
    log(`[daily-learning] Digest written for ${today}: ${agentSummaries.length} agents, ${recentJobs.length} jobs`);
  } catch(e) {
    log(`[daily-learning] Failed: ${e.message}`);
  }
}

// Run daily learning job every 24h + once on startup after 60s
setInterval(() => { runDailyLearning(); }, 24 * 60 * 60 * 1000);
setTimeout(() => { runDailyLearning(); }, 60000);

// graceful shutdown
process.on('SIGTERM', () => { log('SIGTERM received, shutting down'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { log('SIGINT received, shutting down'); server.close(() => process.exit(0)); });
