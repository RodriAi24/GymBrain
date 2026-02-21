const CACHE_NAME = 'gymbrain-v10';

// Instalar y guardar en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/', '/index.html']);
    })
  );
  self.skipWaiting();
});

// Limpiar cachés viejos al activar
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

// ESTRATEGIA: Network First (Primero internet, si falla usa el caché)
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
