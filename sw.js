const CACHE_NAME = 'dominiao-v17';
// Must match the exact URLs the page requests (including ?v=) so cache lookups hit.
const ASSETS = [
  './',
  './index.html',
  './css/styles.css?v=17',
  './js/app.js?v=17',
  './manifest.json',
  './fonts/inter.woff2',
  './fonts/jetbrains-mono.woff2',
  './fonts/instrument-serif.woff2',
  './fonts/instrument-serif-italic.woff2',
  './fonts/vt323.woff2'
];
// If the network hasn't answered by then, serve the cached copy instead of hanging.
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle our own GET requests; everything else goes straight to the network.
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Fonts never change: serve from cache, fetch only if missing.
  if (url.pathname.includes('/fonts/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetchAndCache(e.request))
    );
    return;
  }

  e.respondWith(networkFirst(e.request));
});

function fetchAndCache(request) {
  return fetch(request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    }
    return response;
  });
}

// Fresh copy when the server is healthy; cached copy when it is unreachable,
// erroring (e.g. Cloudflare 502/521 while the origin is down) or too slow.
async function networkFirst(request) {
  const cached = await caches.match(request) ||
    (request.mode === 'navigate' ? await caches.match('./index.html') : undefined);
  if (!cached) return fetchAndCache(request);

  const network = fetchAndCache(request).then(r => r.ok ? r : cached).catch(() => cached);
  const timeout = new Promise(resolve => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS));
  return Promise.race([network, timeout]);
}
