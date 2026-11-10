// Service worker: cache de todo o "app shell" para funcionamento 100% offline.
// Requisições cross-origin (envio para o Apps Script) nunca passam por aqui,
// então a sincronização sempre usa a rede diretamente.

const CACHE_NOME = "bfshow-pesquisa-v3";

const ARQUIVOS_PARA_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/datetime.js",
  "./js/db.js",
  "./js/csv.js",
  "./js/sync.js",
  "./js/app.js",
  "../shared/fonts/geist-400.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só intercepta GET do mesmo domínio (o app shell). Tudo mais (POST de
  // sincronização, chamadas de outra origem) segue direto para a rede.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(req)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_NOME).then((cache) => cache.put(req, copia));
          }
          return resposta;
        })
        .catch(() => cacheado);
    })
  );
});
