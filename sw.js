// 网络优先:有网时永远取最新的页面与 data.json,断网时才用缓存,
// 这样更新网站内容后,手机上的 app 下次打开就会看到新数据。
const CACHE = 'wjy-drames-v9';
const CORE = [
  './',
  'index.html',
  'data.json',
  'manifest.webmanifest',
  'banner.jpg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req,{cache:'no-cache'}) // 绕过浏览器自己的缓存(GitHub Pages 默认缓存约 10 分钟),每次都向服务器确认最新版
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
