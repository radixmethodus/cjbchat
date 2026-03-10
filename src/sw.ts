/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Push notification handler — only show when no app window is focused
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "New message";
  const options: NotificationOptions = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: data.url || "/" },
    tag: "pc-msg-" + Date.now(),
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // If any app window is focused/visible, skip the notification
        const hasVisibleClient = clients.some(
          (c) => c.visibilityState === "visible"
        );
        if (hasVisibleClient) return;
        return self.registration.showNotification(title, options);
      })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
