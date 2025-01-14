const CACHE_NAME = "syr-tv-cache-v1";
const urlsToCache = [
  "/SYR-TV/",
  "/SYR-TV/index.html",
  "/SYR-TV/style.css",
  "/SYR-TV/script.js",
  "/SYR-TV/images/logo.png",
  "/SYR-TV/favicon-32x32.png",
  "/SYR-TV/favicon-16x16.png",
  "/SYR-TV/apple-touch-icon.png",
  // Add any other files to be cached
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If cached response exists, return it, otherwise fetch from network
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
