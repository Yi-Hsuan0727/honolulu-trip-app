// Minimal service worker: makes the app installable and lets the app shell
// (markup, styles, fonts, icons) load instantly / offline. API calls always
// go to the network first since schedule/prep/post data changes.
const CACHE = 'oahu-trip-shell-v1';
const SHELL_FILES = [
  '/', '/index.html', '/styles.css', '/app.js', '/manifest.json',
  '/vendor/fonts/quicksand.css', '/vendor/fonts/plus-jakarta-sans.css',
  '/vendor/phosphor/duotone/style.css', '/vendor/phosphor/bold/style.css',
  '/vendor/leaflet/leaflet.css', '/vendor/leaflet/leaflet.js',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API + uploaded photos: always fetch fresh, don't cache (editable, changing data)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((cache) => cache.put(event.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
