/* Service worker — Rosario en el Auto.
   Dos cachés:
   - core-<VERSION>: index, jsons, ícono (se renueva con cada versión del paquete)
   - clips-v1: clips MP3 de voz/silencio y pistas de música de fondo (nombres
     con hash de contenido → nunca cambian; se conserva entre versiones para
     no re-descargar 100+ MB) */
const VERSION = "114bcf3765";
const CORE = "core-" + VERSION;
const CLIPS = "clips-v1";
const NUCLEO = ["./", "index.html", "manifest.webmanifest", "icono.svg",
                "contenido.json", "manifiesto.json", "precache.json"];
// musica.json puede no existir todavía (pistas aún no cargadas): se pide
// aparte para que su ausencia no tumbe la instalación del service worker.
const OPCIONAL = ["musica.json"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CORE);
    await c.addAll(NUCLEO);
    await Promise.all(OPCIONAL.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
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
  const esClip = url.pathname.includes("/clips/") || url.pathname.includes("/musica/");
  e.respondWith((async () => {
    const cache = await caches.open(esClip ? CLIPS : CORE);
    const enCache = await cache.match(e.request, { ignoreSearch: true });
    if (enCache) return enCache;
    const resp = await fetch(e.request);
    if (resp && resp.ok) cache.put(e.request, resp.clone());
    return resp;
  })());
});
