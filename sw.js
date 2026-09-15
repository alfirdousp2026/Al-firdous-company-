/* Service Worker لتطبيق الفردوس للنقل والتوريد
   يسمح بفتح التطبيق وتشغيله حتى بدون اتصال بالإنترنت (البيانات نفسها
   محفوظة أصلاً محليًا على الجهاز عبر localStorage، فلا حاجة لأي خادم). */

const CACHE_NAME = "ferdaws-app-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(ASSETS); })
      .catch(function(){ /* لو فشل تحميل أحد الملفات، لا نوقف التثبيت بالكامل */ })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

/* استراتيجية "المخزن أولاً، ثم التحديث في الخلفية" — تفتح فورًا من النسخة
   المحفوظة (تعمل بدون إنترنت)، وفي نفس الوقت تحاول جلب نسخة أحدث لتحديث
   المخزن المؤقت للمرة القادمة، دون أن تنتظر الصفحة الحالية ذلك. */
self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;
  if(event.request.url.indexOf(self.location.origin) !== 0) return; /* تجاهل طلبات المصادر الخارجية (خطوط، مكتبات CDN...) واتركها تُحمَّل من الشبكة مباشرة */

  event.respondWith(
    caches.match(event.request).then(function(cached){
      const networkFetch = fetch(event.request).then(function(response){
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || networkFetch;
    })
  );
});
