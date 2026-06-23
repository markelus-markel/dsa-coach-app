// Digital Strong Abay — Coach App service worker
// MVP-1 объём: офлайн-доступ к самому приложению (app shell), не к данным API.
// Реальная очередь "посещаемость, отмеченная офлайн -> синхронизация" должна
// жить в IndexedDB на стороне приложения + Background Sync API здесь —
// в этом прототипе она симулируется в памяти (см. index.html, toggleOnline()).

const CACHE_NAME = 'dsa-coach-shell-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first для app shell, network-first для всего остального (когда появится реальный API)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const isShellRequest = APP_SHELL.some((path) => request.url.endsWith(path.replace('./', '')));

  if (isShellRequest) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Точка расширения: когда подключится реальный backend (см. implementation_pack.md,
  // раздел 5 API contract) — здесь должен появиться network-first с фоллбэком на
  // IndexedDB-кеш последних загруженных данных (roster, sessions) для офлайн-просмотра.
});

// Точка расширения: background sync для очереди "attendance, помеченная офлайн"
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'sync-attendance') {
//     event.waitUntil(flushAttendanceQueueFromIndexedDB());
//   }
// });
