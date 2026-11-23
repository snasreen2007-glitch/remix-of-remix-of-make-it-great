const CACHE_NAME = "kisanai-offline-v5";

const OFFLINE_ROUTES = [
  "/",
  "/diagnose",
  "/library",
  "/history",
  "/saved",
  "/assistant",
  "/weather",
  "/calculator",
  "/yield-estimator",
  "/market",
  "/profile",
  "/profile/offline",
  "/notifications",
  "/help",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.svg",
  "/favicon.svg",
  "/models/rice_mobilenetv3.onnx",
  "/models/chilli_mobilenetv3.onnx",
  "/models/rice_hgb_model.json",
  "/models/chilli_hgb_model.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const core = ["/", "/manifest.webmanifest", "/favicon.ico", "/favicon.svg", "/logo.svg"];
        await Promise.allSettled(
          core.map(async (r) => {
            try {
              const res = await fetch(r);
              if (res && res.status === 200) await cache.put(r, res);
            } catch {}
          })
        );

        await Promise.allSettled(
          OFFLINE_ROUTES.filter((r) => !core.includes(r)).map(async (route) => {
            try {
              const res = await fetch(route);
              if (res && res.status === 200) {
                await cache.put(route, res);
              }
            } catch {}
          })
        );
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  // Navigations: network-first, fall back to cached shell when offline or deep route not on server
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
            return response;
          }
          if (response && (response.status === 404 || response.status >= 500)) {
            const cachedShell = await caches.match("/");
            if (cachedShell) return cachedShell;
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          if (cached) return cached;
          const fallback = await caches.match(request);
          if (fallback) return fallback;
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>KisanAI Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:sans-serif;padding:24px;text-align:center;background:#0f1a14;color:#fff;"><h2>KisanAI Offline</h2><p>You are currently offline. Please reconnect or return to home.</p><a href="/" style="color:#10b981;font-weight:bold;">Go Home</a></body></html>`,
            { headers: { "Content-Type": "text/html" } }
          );
        }),
    );
    return;
  }

  // Model weights and heavy binary assets: cache-first with network fallback
  if (request.url.includes("/models/") || request.url.includes("/fonts/")) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
      )
    );
    return;
  }

  // Application code (JS, CSS, SVGs): network-first so new releases appear immediately, cache fallback for offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(null, { status: 404, statusText: "Offline Not Found" });
      }),
  );
});
