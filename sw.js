const CACHE_NAME = "pipeline-ia-v2";
const CORE_ASSETS = ["./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("://") && !event.request.url.startsWith(self.location.origin)) return;

  // El HTML principal SIEMPRE va a la red primero (nunca debe quedar atascado en una versión vieja)
  if (event.request.mode === "navigate" || event.request.url.endsWith("/") || event.request.url.endsWith("index.html")) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Assets con hash en el nombre (CSS/JS de cada build) sí se cachean agresivo, son seguros
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});

