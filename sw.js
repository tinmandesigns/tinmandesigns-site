const CACHE_NAME = "tinman-cache-v8";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/css/blog.css",
  "/blog/",
];

self.addEventListener("install", (event) => {
  // Force active
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Bypass the browser HTTP cache when precaching files so we guarantee the newest versions
      const requests = urlsToCache.map(
        (url) => new Request(url, { cache: "no-store" }),
      );
      return cache.addAll(requests);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  // Network-First strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      }),
  );
});
