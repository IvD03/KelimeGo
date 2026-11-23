// Версию увеличивать при обновлении приложения,
// чтобы браузер подхватил новые файлы
const CACHE = 'kartochki-v1';

const LOCAL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(LOCAL);
    // CDN может быть недоступен — не критично
    for (const url of CDN) {
      try { await cache.add(url); } catch (err) { console.warn('CDN cache skip:', url); }
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const resp = await fetch(e.request);
      if (resp.ok && e.request.url.startsWith('http')) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});