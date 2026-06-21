const CACHE_NAME = 'sport-lounge-v2';
const STATIC_CACHE = 'static-v2';
const NAV_CACHE = 'nav-v2';

const PRECACHE_URLS = [
  '/sport-loungev3/',
  '/sport-loungev3/index.html',
  '/sport-loungev3/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE && k !== NAV_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-only for API
  if (url.pathname.includes('/api/')) return;

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico|gif)(\?.*)?$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          if (hit) return hit;
          return fetch(request).then((res) => {
            if (res.status === 200) cache.put(request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // Network-first for navigation (with fallback to cached)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(NAV_CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request).then((cached) => cached || caches.match('/sport-loungev3/index.html')))
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((res) => {
        if (res.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
