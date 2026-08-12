self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("saloon-v1").then((c) =>
      c.addAll(["./", "./index.html", "./styles.css", "./app.js", "./songs.json", "./icon.png"])
    )
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
