// GymBrain · respaldo en la nube (Cloudflare Worker + KV)
// El teléfono manda la copia ya cifrada (AES-GCM con una clave que solo vive en el celu).
// Acá no se puede leer nada: se guarda el blob, se versiona y se devuelve.
//
// Autenticación: el celu manda "Authorization: Bearer <token>". El token sale de la clave
// secreta, pero no sirve para descifrar. Guardamos solo el SHA-256 del token ("owner").
// La primera vez que alguien llama a /v1/claim, ese token queda como dueño (y nadie más).
// Si querés fijarlo a mano, cargá AUTH_HASH como secreto y el claim queda cerrado.

const MAX_BODY = 5 * 1024 * 1024; // 5 MB: la copia real pesa unos KB
const KEEP_DAYS = 30;             // una copia por día de los últimos 30 días, más una por mes para siempre

const enc = new TextEncoder();
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function same(a, b) { // comparación en tiempo constante
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}

function cors(req, env) {
  const o = req.headers.get('Origin') || '';
  const ok = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (ok.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
}
const json = (body, status, h) => new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// Un blob válido: { v:1, ts, n, iv, salt, ct } con iv/salt/ct en base64
function blobOk(b) {
  const b64 = x => typeof x === 'string' && x.length > 0 && /^[A-Za-z0-9+/=]+$/.test(x);
  return !!b && typeof b === 'object' && b.v === 1 && typeof b.ts === 'string' && !isNaN(Date.parse(b.ts))
    && Number.isInteger(b.n) && b.n >= 0 && b64(b.iv) && b64(b.salt) && b64(b.ct);
}

async function owner(env) { return env.AUTH_HASH || await env.GB.get('owner'); }
async function authed(req, env) {
  const m = /^Bearer ([A-Za-z0-9_-]{32,128})$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const hash = await sha256(m[1]); const own = await owner(env);
  return { hash, ok: !!own && same(hash, own), claimed: !!own };
}

async function prune(env) {
  const { keys } = await env.GB.list({ prefix: 'day:' });
  const days = keys.map(k => k.name).sort();
  await Promise.all(days.slice(0, Math.max(0, days.length - KEEP_DAYS)).map(k => env.GB.delete(k)));
}

export default {
  async fetch(req, env) {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url); const p = url.pathname.replace(/\/+$/, '');

    if (p === '/v1/ping') return json({ ok: true, claimed: !!(await owner(env)) }, 200, h);

    const a = await authed(req, env);
    if (!a) return json({ error: 'auth' }, 401, h);

    if (p === '/v1/claim' && req.method === 'POST') {
      if (a.ok) return json({ ok: true }, 200, h);
      if (a.claimed) return json({ error: 'claimed' }, 403, h);
      await env.GB.put('owner', a.hash);
      return json({ ok: true, claimed: true }, 200, h);
    }
    if (!a.ok) return json({ error: 'auth' }, 403, h);

    if (p === '/v1/backup' && req.method === 'GET') {
      const k = url.searchParams.get('snap') || 'latest';
      if (k !== 'latest' && !/^(day:\d{4}-\d{2}-\d{2}|month:\d{4}-\d{2})$/.test(k)) return json({ error: 'snap' }, 400, h);
      const b = await env.GB.get(k);
      return b ? new Response(b, { headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }) : json({ error: 'empty' }, 404, h);
    }

    if (p === '/v1/backup' && req.method === 'PUT') {
      const len = +(req.headers.get('Content-Length') || 0); if (len > MAX_BODY) return json({ error: 'size' }, 413, h);
      const txt = await req.text(); if (txt.length > MAX_BODY) return json({ error: 'size' }, 413, h);
      let b; try { b = JSON.parse(txt); } catch (e) { b = null; }
      if (!blobOk(b)) return json({ error: 'blob' }, 400, h);
      // Red de seguridad: una copia con menos sesiones que la guardada no pisa nada sin ?force=1
      const prev = await env.GB.get('latest', 'json');
      if (prev && b.n < prev.n && url.searchParams.get('force') !== '1') return json({ error: 'fewer', n: prev.n, ts: prev.ts }, 409, h);
      const meta = { metadata: { ts: b.ts, n: b.n } }; const d = b.ts.slice(0, 10);
      await Promise.all([env.GB.put('latest', txt, meta), env.GB.put('day:' + d, txt, meta), env.GB.put('month:' + d.slice(0, 7), txt, meta)]);
      await prune(env);
      return json({ ok: true, ts: b.ts, n: b.n }, 200, h);
    }

    if (p === '/v1/snaps' && req.method === 'GET') {
      const out = [];
      for (const prefix of ['day:', 'month:']) { const { keys } = await env.GB.list({ prefix }); keys.forEach(k => out.push({ key: k.name, ...(k.metadata || {}) })); }
      return json({ snaps: out.sort((x, y) => (y.ts || '').localeCompare(x.ts || '')) }, 200, h);
    }

    return json({ error: 'not found' }, 404, h);
  }
};
