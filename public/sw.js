const CACHE_NAME = "cjchat-v1";
const SHELL_URLS = ["/", "/index.html"];

// Install: cache app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  // Skip supabase API calls
  if (request.url.includes("supabase")) return;

  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
  } else if (request.destination === "script" || request.destination === "style" || request.destination === "font") {
    e.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
  }
});

// Push notification
self.addEventListener("push", (e) => {
  if (!e.data) return;

  try {
    const data = e.data.json();
    e.waitUntil(
      self.registration.showNotification(data.title || "CJ's Chat", {
        body: data.body || "New message",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { url: data.url || "/" },
        tag: `room-${data.url || "A"}`,
        renotify: true,
      })
    );
  } catch {
    // ignore malformed push
  }
});

// Notification click: open/focus app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
