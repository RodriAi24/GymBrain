const CACHE_NAME = 'gb-v9';
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE_NAME).then(c => c.addAll(['./', './index.html']))
));
self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(res => res || fetch(e.request))
));
