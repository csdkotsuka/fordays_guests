// FORDAYS パートナー手帳 Service Worker
// HTML/CSS の独自キャッシュはデプロイ更新時の CSS 読み込み不整合の原因になるため行わず、
// Cloudflare CDN とブラウザ標準キャッシュに任せて安定運用する。

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // 旧バージョンのキャッシュが残っていれば削除する
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// サーバーからの Web Push（締め切り・イベント返信のお願い）
self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: 'FORDAYS パートナー手帳', body: e.data && e.data.text() };
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'FORDAYS パートナー手帳', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
      tag: data.tag,
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
