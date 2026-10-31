const CACHE = 'entry-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first (fresh files when online), cache fallback when offline.
function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const r = await Promise.race([fetch(req, {cache: 'no-cache'}), timeout(5000)]);
      if (r && r.ok) { cache.put(req, r.clone()); return r; }
      throw new Error('bad response');
    } catch (err) {
      const hit = await cache.match(req, {ignoreSearch: true});
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match('./index.html'); if (idx) return idx; }
      return Response.error();
    }
  })());
});
