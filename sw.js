// Service worker mínimo: cachea el "shell" de la app (HTML/CSS/JS propios)
// para que abra rápido y sea instalable. El contenido (fotos, audio, video,
// datos de Supabase) siempre se pide en vivo — no se cachea, porque cambia
// todo el tiempo y vive en la nube.
//
// Estrategia "network-first" para el shell: siempre intenta traer la
// versión más nueva de internet primero, y solo usa la copia guardada si
// no hay conexión. Así, cuando actualizas el código (como ahora), el
// celular/navegador ve los cambios de inmediato en vez de quedarse con
// una versión vieja guardada.

const CACHE = 'nuestro-espacio-v4';
const ARCHIVOS_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/supabase-client.js',
  './manifest.json',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);

  // Solo aplicamos estrategia de caché a archivos propios (mismo origen,
  // sin llamadas a Supabase ni a servicios externos).
  if (url.origin !== self.location.origin) return;

  ev.respondWith(
    fetch(ev.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(ev.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(ev.request))
  );
});
