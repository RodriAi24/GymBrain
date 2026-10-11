// GymBrain · service worker
// Subilo en la MISMA carpeta que el HTML de la app, junto a manifest.json e icon-180/192/512.png.
const CACHE = 'gymbrain-v24-1';
const IMG_CACHE = 'gymbrain-photos-v1';
const EXTRA = ['./', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png',
  // Mapa muscular 3D: así anda sin señal en el gym
  './models/musculos.glb', './vendor/three/three.module.min.js', './vendor/three/jsm/loaders/GLTFLoader.js', './vendor/three/jsm/utils/BufferGeometryUtils.js',
  './vendor/three/jsm/libs/meshopt_decoder.module.js', './vendor/three/jsm/environments/RoomEnvironment.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(EXTRA.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Fotos de ejercicios (free-exercise-db): caché primero, así se ven sin señal en el gym una vez vistas
  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.includes('/free-exercise-db/')) {
    e.respondWith(caches.open(IMG_CACHE).then(c => c.match(req).then(m => m || fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // App: red primero, caché como respaldo (funciona offline con cualquier nombre de archivo)
  e.respondWith(fetch(req).then(r => { if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
    .catch(() => caches.match(req).then(m => m || (req.mode === 'navigate' ? caches.open(CACHE).then(c => c.keys().then(ks => { const k = ks.find(x => x.url.endsWith('.html') || x.url.endsWith('/')); return k ? c.match(k) : undefined; })) : undefined))));
});
