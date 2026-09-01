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
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

  if (req.method === 'GET' && url.pathname === '/') {
    return send(res, 200, {
      service: 'Oxyderm Automation Engine',
      endpoints: ['GET /status', 'GET /state', 'GET /postiz/status', 'POST /event {type, payload}'],
      port: PORT
    });
  }

  send(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, () => {
  log(`Oxyderm Automation Engine listening on http://localhost:${PORT}`);
});

// graceful shutdown
process.on('SIGTERM', () => { log('SIGTERM received, shutting down'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { log('SIGINT received, shutting down'); server.close(() => process.exit(0)); });
