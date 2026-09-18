// GymBrain · service worker
// Subilo en la MISMA carpeta que el HTML de la app, junto a manifest.json e icon-180/192/512.png.
// Funciona sin importar cómo se llame el archivo HTML (GymBrain.html, index.html, etc.).
const CACHE = 'gymbrain-v20-2';
const EXTRA = ['./', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

// Cachea cada archivo por separado: si alguno falta, la instalación NO falla.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(EXTRA.map(u => c.add(u).catch(() => null)))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Red primero, caché como respaldo. Si se pide una página y no hay red ni caché exacta,
// devuelve la última página cacheada (así la app abre offline con cualquier nombre de archivo).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req).then(m => {
      if (m) return m;
      if (req.mode === 'navigate') return caches.keys().then(() => caches.open(CACHE))
        .then(c => c.keys().then(ks => { const page = ks.find(k => k.url.endsWith('.html') || k.url.endsWith('/')); return page ? c.match(page) : undefined; }));
    }))
  );
});
