/* Service worker — Rosario en el Auto.
   Dos cachés:
   - core-<VERSION>: index, jsons, ícono (se renueva con cada versión del paquete)
   - clips-v1: clips MP3 (nombres con hash de contenido → nunca cambian; se
     conserva entre versiones para no re-descargar 100+ MB) */
const VERSION = "b241fbffba";
const CORE = "core-" + VERSION;
const CLIPS = "clips-v1";
const NUCLEO = ["./", "index.html", "manifest.webmanifest", "icono.svg",
                "contenido.json", "manifiesto.json", "precache.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(NUCLEO)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(n => n.startsWith("core-") && n !== CORE)
                             .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const esClip = url.pathname.includes("/clips/");
  e.respondWith((async () => {
    const cache = await caches.open(esClip ? CLIPS : CORE);
    const enCache = await cache.match(e.request, { ignoreSearch: true });
    if (enCache) return enCache;
    const resp = await fetch(e.request);
    if (resp && resp.ok) cache.put(e.request, resp.clone());
    return resp;
  })());
});
