/**
 * Square Bookings API wrapper for the Oxyderm Automation Engine.
 * Reads SQUARE_ACCESS_TOKEN from process.env (loaded from ~/.oxyderm/secrets.env
 * before the engine starts — see the launchd plist / start script).
 *
 * HONEST NOTE: this hits the real Square production API. Test carefully.
 * Location ID and team member ID are the clinic's real, confirmed values
 * (verified live against Square's API on 2026-09-02).
 */
const https = require('https');

const SQUARE_BASE = 'connect.squareup.com';
const SQUARE_VERSION = '2024-01-17';
const LOCATION_ID = 'SA5CTAH41JNY2';
const TEAM_MEMBER_ID = 'SA5CTAH41JNY2'; // confirmed: Hetisha's team member entry shares this id with the location

function getToken() {
  const t = process.env.SQUARE_ACCESS_TOKEN;
  if (!t) throw new Error('SQUARE_ACCESS_TOKEN not set in environment');
  return t;
}

function squareRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SQUARE_BASE,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Square-Version': SQUARE_VERSION,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      timeout: 15000
    }, (res) => {
      let chunks = '';
      res.on('data', c => { chunks += c; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(chunks || '{}'); } catch (e) { parsed = { raw: chunks }; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Square API timeout')); });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ---------- customer lookup / creation ----------
async function findOrCreateCustomer({ name, phone, email }) {
  if (phone) {
    const search = await squareRequest('POST', '/v2/customers/search', {
      query: { filter: { phone_number: { exact: phone } } }
    });
    const found = (search.body.customers || [])[0];
    if (found) return { ok: true, customer: found, created: false };
  }
  const [given_name, ...rest] = (name || 'Guest').split(' ');
  const family_name = rest.join(' ') || undefined;
  const create = await squareRequest('POST', '/v2/customers', {
    given_name, family_name, phone_number: phone || undefined, email_address: email || undefined
  });
  if (create.statusCode >= 200 && create.statusCode < 300) {
    return { ok: true, customer: create.body.customer, created: true };
  }
  return { ok: false, error: create.body.errors || create.body };
}

// ---------- catalog lookup ----------
async function findServiceVariation(serviceName) {
  const list = await squareRequest('GET', '/v2/catalog/list?types=ITEM');
  const items = list.body.objects || [];
  const nameLower = serviceName.toLowerCase();
  for (const obj of items) {
    const item = obj.item_data || {};
    if (item.name && item.name.toLowerCase().includes(nameLower)) {
      const variation = (item.variations || [])[0];
      if (variation) {
        return {
          ok: true,
          serviceName: item.name,
          serviceVariationId: variation.id,
          serviceVariationVersion: variation.version,
          durationMinutes: (variation.item_variation_data && variation.item_variation_data.service_duration)
            ? Math.round(variation.item_variation_data.service_duration / 60000) : 30
        };
      }
    }
  }
  return { ok: false, error: `No service found matching "${serviceName}". Ask the client to confirm the exact treatment name.` };
}

// ---------- create booking ----------
async function createBooking({ name, phone, email, serviceName, startAtISO, sellerNote }) {
  const cust = await findOrCreateCustomer({ name, phone, email });
  if (!cust.ok) return { ok: false, error: 'Could not find or create customer', detail: cust.error };

  const svc = await findServiceVariation(serviceName);
  if (!svc.ok) return { ok: false, error: svc.error };

  const resp = await squareRequest('POST', '/v2/bookings', {
    booking: {
      location_id: LOCATION_ID,
      customer_id: cust.customer.id,
      start_at: startAtISO,
      seller_note: sellerNote || 'Booked via Sarah (Oxyderm OS virtual assistant)',
      appointment_segments: [{
        duration_minutes: svc.durationMinutes,
        service_variation_id: svc.serviceVariationId,
        team_member_id: TEAM_MEMBER_ID,
        service_variation_version: svc.serviceVariationVersion
      }]
    }
  });

  if (resp.statusCode >= 200 && resp.statusCode < 300) {
    return { ok: true, booking: resp.body.booking, customer: cust.customer, service: svc.serviceName };
  }
  return { ok: false, error: resp.body.errors || resp.body };
}

// ---------- cancel booking ----------
async function cancelBooking({ bookingId, reason }) {
  const get = await squareRequest('GET', `/v2/bookings/${bookingId}`);
  if (get.statusCode !== 200) return { ok: false, error: `Booking ${bookingId} not found` };
  const version = get.body.booking.version;

  const resp = await squareRequest('POST', `/v2/bookings/${bookingId}/cancel`, {
    booking_version: version
  });
  if (resp.statusCode >= 200 && resp.statusCode < 300) {
    return { ok: true, booking: resp.body.booking, reason: reason || 'cancelled via Sarah' };
  }
  return { ok: false, error: resp.body.errors || resp.body };
}

// ---------- reschedule booking (cancel + recreate, Square has no direct "move" for segments) ----------
async function rescheduleBooking({ bookingId, newStartAtISO }) {
  const get = await squareRequest('GET', `/v2/bookings/${bookingId}`);
  if (get.statusCode !== 200) return { ok: false, error: `Booking ${bookingId} not found` };
  const booking = get.body.booking;

  const resp = await squareRequest('PUT', `/v2/bookings/${bookingId}`, {
    booking: {
      version: booking.version,
      start_at: newStartAtISO
    }
  });
  if (resp.statusCode >= 200 && resp.statusCode < 300) {
    return { ok: true, booking: resp.body.booking };
  }
  return { ok: false, error: resp.body.errors || resp.body };
}

// ---------- search bookings (for "find my booking to cancel/reschedule") ----------
async function findBookingsByCustomerPhone(phone) {
  const search = await squareRequest('POST', '/v2/customers/search', {
    query: { filter: { phone_number: { exact: phone } } }
  });
  const customer = (search.body.customers || [])[0];
  if (!customer) return { ok: false, error: 'No customer found with that phone number' };

  const now = new Date().toISOString();
  const list = await squareRequest('GET', `/v2/bookings?customer_id=${customer.id}&location_id=${LOCATION_ID}&limit=10`);
  const upcoming = (list.body.bookings || []).filter(b => b.status !== 'CANCELLED_BY_SELLER' && b.status !== 'CANCELLED_BY_CUSTOMER' && b.start_at > now);
  return { ok: true, customer, bookings: upcoming };
}

module.exports = {
  findOrCreateCustomer,
  findServiceVariation,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  findBookingsByCustomerPhone,
  LOCATION_ID,
  TEAM_MEMBER_ID
};
