const CACHE = 'offline-fallback';

self.addEventListener('install', e => {
  console.log("The Service Worker is being installed.");
  e.waitUntil(async () => {
    const cache = await self.caches.open(CACHE);
    await cache.addAll(['/', '/index.html']);
    return self.skipWaiting();
  });
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request).then((response) => {
        if (event.request.method === 'POST') return response;
        return caches.open(CACHE).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
