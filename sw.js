const CACHE_NAME = 'gymbrain-v16'; // ¡Actualizado a v16!

// Archivos vitales para que la app funcione 100% offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  // Imágenes de los músculos (asegurate de que los nombres coincidan con tus archivos)
  './hombros.png',
  './pecho.png',
  './espalda.png',
  './biceps.png',
  './triceps.png',
  './antebrazos.png',
  './core.png',
  './piernas.png',
  './gluteos.png'
];

// 1. Instalar y guardar en caché el paquete completo
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Limpiar cachés viejos al activar (ej: borra la v10 cuando instalás la v16)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ESTRATEGIA: Network First (Primero internet, si falla usa el caché)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Si hay internet y responde bien, guardamos una copia nueva en el caché
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return response;
      })
      .catch(() => {
        // Si no hay internet (falla el fetch), buscamos en el caché
        return caches.match(e.request);
      })
  );
});
