const CACHE_NAME = '5b-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/ruffle.js',
  '/5b.swf',
  '/levels.txt',
  '/core.ruffle.0a7030ff7c360f6dee99.js',
  '/core.ruffle.e760cff211bad8506805.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS.map((u) => new Request(u, {cache: 'reload'})));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return null;
      })
    ))
  );
  self.clients.claim();
});

// A simple cache-first strategy with network fallback and cache update.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // If network response is valid, update cache
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        return null;
      });

      // Prefer cached, but fall back to network; if both fail, return cached if available
      return cached || fetchPromise.then((res) => res || cached);
    })
  );
});
