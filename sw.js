// يخلي الموقع يشتغل مثل التطبيق: الصفحات تنجاب من النت أول (عشان تكون محدّثة) ولو ما فيه نت تطلع آخر نسخة محفوظة،
// والنماذج (PDF) والصور والخطوط تنحفظ أول ما تنفتح وتشتغل بعدها بدون نت.
const CACHE = "asc-v2";
const CORE = ["/", "/plans.js", "/plans.css", "/icon.svg", "/tools/logo-horizontal-color-on-navy.svg"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const keep = req => res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const local = url.origin === location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!local && !fonts) return;
  // الصفحات و plans.js: من النت أول
  if (req.mode === "navigate" || (local && /\.(html|js|css|webmanifest|ics|xml)$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(keep(req)).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("/"))));
    return;
  }
  // النماذج والصور والخطوط: من المحفوظ أول
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(keep(req))));
});
