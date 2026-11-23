const CACHE_NAME = "recetario-v5";        // archivos de la app
const API_CACHE = "recetario-api-v1";      // respuestas de TheMealDB (búsquedas)
const IMG_CACHE = "recetario-img-v1";      // fotos de las recetas
const KEEP = [CACHE_NAME, API_CACHE, IMG_CACHE];

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => !KEEP.includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Red primero; si falla (sin internet) responde con lo guardado.
function networkFirst(request, cacheName, fallbackUrl) {
  return fetch(request)
    .then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(cacheName).then(cache => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request).then(cached => cached || (fallbackUrl ? caches.match(fallbackUrl) : Response.error())));
}

// Caché primero (las fotos no cambian); si no está, la descarga y la guarda.
function cacheFirst(request, cacheName) {
  return caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && (response.ok || response.type === "opaque")) {
      const copy = response.clone();
      caches.open(cacheName).then(cache => cache.put(request, copy));
    }
    return response;
  }));
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Archivos propios de la app
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, CACHE_NAME, "./index.html"));
    return;
  }

  // API de recetas: se guarda cada búsqueda para poder repetirla sin internet
  if (url.hostname.endsWith("themealdb.com") && url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Fotos de recetas e ingredientes
  if (url.hostname.endsWith("themealdb.com") && url.pathname.startsWith("/images/")) {
    event.respondWith(cacheFirst(request, IMG_CACHE));
  }
  // Lo demás (p. ej. videos de YouTube) solo funciona con internet.
});
