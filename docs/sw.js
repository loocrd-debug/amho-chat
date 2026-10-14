// 암호쳇 서비스 워커: 푸시가 오면 숫자만 보여준다. 뜻은 이 파일에도, 서버에도 없다.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const body = d.body || "신호";
  e.waitUntil(self.registration.showNotification(d.title || "암호쳇", {
    body, tag: "amho-signal", renotify: true, icon: "/amho-chat/icons/icon-192.png", badge: "/amho-chat/icons/icon-192.png",
    data: { url: "/amho-chat/" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const w = list.find((c) => c.url.includes("/amho-chat"));
    return w ? w.focus() : self.clients.openWindow("/amho-chat/");
  }));
});
