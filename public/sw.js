// Minimal service worker: makes the app installable. The shell (markup,
// styles, fonts, icons) is cached ONLY as an offline fallback — every load
// tries the network first, so a fresh deploy is always what you see when
// you're online. (A cache-first strategy here previously meant browsers
// got stuck showing whatever version they first cached.)
const CACHE = 'oahu-trip-shell-v3';
const SHELL_FILES = [
  '/', '/index.html', '/styles.css', '/app.js', '/manifest.json',
  '/vendor/fonts/quicksand.css', '/vendor/fonts/plus-jakarta-sans.css', '/vendor/fonts/caveat.css',
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

  // API (includes photo blobs, served from /api/posts/:id/image): always
  // network, never cached — this is editable, changing data
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((cache) => cache.put(event.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
