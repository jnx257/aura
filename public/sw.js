/*
 * Aura's service worker. It does three small things and nothing more:
 *  - shows a notification when a push arrives (the routine reminder),
 *  - opens the app on the right page when that notification is tapped,
 *  - when a page cannot load because there is no connection, shows a short offline page instead of the browser's.
 * It never caches the app's own pages or data: they are personal and always fetched fresh.
 */
const OFFLINE_CACHE = "aura-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // not JSON: fall back to the defaults below
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Aura", {
      body: data.body || "Sua rotina de hoje está esperando.",
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: data.tag || "aura-routine", // a newer reminder replaces an older one instead of piling up
      data: { url: data.url || "/hoje" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/hoje", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.navigate(url).then((w) => w && w.focus());
      return self.clients.openWindow(url);
    }),
  );
});
