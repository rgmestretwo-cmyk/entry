const CACHE = 'entry-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(r => {
        if (r.ok && new URL(e.request.url).origin === location.origin) {
          const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return r;
      }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    })
  );
});
