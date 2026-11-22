/* Offline cache for the home-screen web app. Cache name changes with the content, so updates are picked up automatically. */
const PREFIX = 'qatmaras-';
const CACHE = PREFIX + '29326b3d7a';
const PRECACHE = [
 "apple-touch-icon.png",
 "fonts/files/amiri-arabic-400-normal.woff2",
 "fonts/files/amiri-arabic-700-normal.woff2",
 "fonts/files/amiri-latin-400-normal.woff2",
 "fonts/files/amiri-latin-700-normal.woff2",
 "fonts/files/aref-ruqaa-arabic-400-normal.woff2",
 "fonts/files/aref-ruqaa-arabic-700-normal.woff2",
 "fonts/files/aref-ruqaa-latin-400-normal.woff2",
 "fonts/files/aref-ruqaa-latin-700-normal.woff2",
 "fonts/files/cairo-arabic-400-normal.woff2",
 "fonts/files/cairo-arabic-600-normal.woff2",
 "fonts/files/cairo-arabic-700-normal.woff2",
 "fonts/files/cairo-arabic-800-normal.woff2",
 "fonts/files/cairo-latin-400-normal.woff2",
 "fonts/files/cairo-latin-600-normal.woff2",
 "fonts/files/cairo-latin-700-normal.woff2",
 "fonts/files/cairo-latin-800-normal.woff2",
 "fonts/files/noto-kufi-arabic-arabic-400-normal.woff2",
 "fonts/files/noto-kufi-arabic-arabic-600-normal.woff2",
 "fonts/files/noto-kufi-arabic-arabic-800-normal.woff2",
 "fonts/files/noto-kufi-arabic-latin-400-normal.woff2",
 "fonts/files/noto-kufi-arabic-latin-600-normal.woff2",
 "fonts/files/noto-kufi-arabic-latin-800-normal.woff2",
 "fonts/files/noto-naskh-arabic-arabic-400-normal.woff2",
 "fonts/files/noto-naskh-arabic-arabic-500-normal.woff2",
 "fonts/files/noto-naskh-arabic-arabic-600-normal.woff2",
 "fonts/files/noto-naskh-arabic-arabic-700-normal.woff2",
 "fonts/files/noto-naskh-arabic-latin-400-normal.woff2",
 "fonts/files/noto-naskh-arabic-latin-500-normal.woff2",
 "fonts/files/noto-naskh-arabic-latin-600-normal.woff2",
 "fonts/files/noto-naskh-arabic-latin-700-normal.woff2",
 "fonts/fonts.css",
 "icons/apple-touch-icon-120.png",
 "icons/apple-touch-icon-152.png",
 "icons/apple-touch-icon-167.png",
 "icons/apple-touch-icon-180.png",
 "icons/favicon-32.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-512.png",
 "index.html",
 "manifest.webmanifest",
 "pwa-shim.js"
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(PRECACHE.map(function (u) {
        return fetch(new Request(u, { cache: 'reload' })).then(function (res) {
          if (!res.ok) throw new Error('precache failed: ' + u + ' ' + res.status);
          return cache.put(u, res);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;           // never intercept other sites
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (req.mode === 'navigate') return caches.match('index.html');
      return fetch(req)['catch'](function () { return new Response('', { status: 504 }); });
    })
  );
});
