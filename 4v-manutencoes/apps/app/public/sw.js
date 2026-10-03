/* 4V Documentos service worker: opens fast and works with a weak signal.
   Pages: network first, cached copy when offline. Hashed assets (/assets/*): cache first.
   Login/logout and anything that isn't a 200 are never cached. */
const CACHE = 'v4docs-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/logo.png', '/icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/login') || url.pathname.startsWith('/logout')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      // The login page comes back as 401: show it, never cache it.
      if (res.ok && !res.redirected) caches.open(CACHE).then(c => c.put('/', res.clone()));
      return res;
    }).catch(() => caches.match('/').then(r => r || Response.error())));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
