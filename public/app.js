const $ = (s) => document.querySelector(s);
let catalog = { rotations: [], songs: [] };
let queue = [];
let index = 0;
let yt = null;
let ready = false;
let deferredPrompt = null;

function istHour() {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  return Number(p.find((x) => x.type === "hour").value) % 24;
}

function activeRotation() {
  const h = istHour();
  return (
    catalog.rotations.find((r) => {
      if (r.start > r.end) return h >= r.start || h < r.end;
      return h >= r.start && h < r.end;
    }) || catalog.rotations[2]
  );
}

function songsFor(rotId) {
  return catalog.songs.filter((s) => s.rot === rotId);
}

function fmt(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function setNow(song) {
  const rot = catalog.rotations.find((r) => r.id === song.rot);
  $("#now-title").textContent = song.title;
  $("#now-meta").textContent = `${song.artist} · ${song.film} · ${song.year}`;
  $("#rot-label").textContent = rot ? `${rot.en} · ${rot.hours}` : "";
  $("#bar-title").textContent = `${song.title} · ${song.film}`;
  $("#thumb").src = `https://i.ytimg.com/vi/${song.yt}/hqdefault.jpg`;
  $("#thumb").alt = song.title;
  $("#live-text").textContent = `${rot?.en || "Radio"} · ${listeners()} listening`;
}

function listeners() {
  const base = 7 + (istHour() % 9);
  return base;
}

function loadAt(i, autoplay) {
  if (!queue.length) return;
  index = ((i % queue.length) + queue.length) % queue.length;
  const song = queue[index];
  setNow(song);
  if (yt && ready) {
    yt.loadVideoById(song.yt);
    if (!autoplay) yt.pauseVideo();
  }
}

window.onYouTubeIframeAPIReady = function () {
  yt = new YT.Player("yt", {
    height: "1",
    width: "1",
    playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
    events: {
      onReady() {
        ready = true;
        const song = queue[index];
        if (song) yt.cueVideoById(song.yt);
      },
      onStateChange(e) {
        if (e.data === YT.PlayerState.ENDED) loadAt(index + 1, true);
        const playing = e.data === YT.PlayerState.PLAYING;
        $("#toggle").textContent = playing ? "❚❚" : "▶";
        $("#play-big").textContent = playing ? "❚❚" : "▶";
      },
      onError() {
        loadAt(index + 1, true);
      },
    },
  });
};

function toggle() {
  if (!yt || !ready) return;
  const s = yt.getPlayerState();
  if (s === YT.PlayerState.PLAYING) yt.pauseVideo();
  else yt.playVideo();
}

function renderPlaylists() {
  const active = activeRotation();
  $("#plist").innerHTML = catalog.rotations
    .map(
      (r) => `
    <article class="${r.id === active.id ? "active" : ""}" data-rot="${r.id}">
      <p class="hours">${songsFor(r.id).length} songs · ${r.hours}</p>
      <h3>${r.hi}</h3>
      <p>${r.en}</p>
      <p class="s">${r.blurb}</p>
    </article>`
    )
    .join("");
  $("#plist").onclick = (e) => {
    const art = e.target.closest("[data-rot]");
    if (!art) return;
    queue = songsFor(art.dataset.rot);
    loadAt(0, true);
  };
}

function renderSongs() {
  $("#songlist").innerHTML = catalog.songs
    .map(
      (s, i) => `
    <li data-i="${i}">
      <span class="n">${String(i + 1).padStart(3, "0")}</span>
      <span><span class="t">${s.title}</span><div class="s">${s.film} · ${s.artist}</div></span>
      <span class="y">${s.year}</span>
    </li>`
    )
    .join("");
  $("#songlist").onclick = (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const song = catalog.songs[Number(li.dataset.i)];
    queue = catalog.songs.slice();
    loadAt(catalog.songs.indexOf(song), true);
  };
}

document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
    $(`#view-${btn.dataset.view}`).classList.add("on");
  };
});

$("#toggle").onclick = toggle;
$("#play-big").onclick = toggle;

$("#seek").oninput = () => {
  if (!yt || !ready) return;
  const d = yt.getDuration() || 0;
  yt.seekTo(($("#seek").value / 100) * d, true);
};

setInterval(() => {
  if (!yt || !ready) return;
  const d = yt.getDuration() || 0;
  const t = yt.getCurrentTime() || 0;
  if (d) $("#seek").value = String((t / d) * 100);
  $("#bar-sub").textContent = `${fmt(t)} / ${fmt(d)}`;
}, 500);

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $("#install").hidden = false;
});
$("#install-btn").onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("#install").hidden = true;
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

fetch("./songs.json")
  .then((r) => r.json())
  .then((data) => {
    catalog = data;
    const rot = activeRotation();
    queue = songsFor(rot.id);
    if (!queue.length) queue = catalog.songs.slice();
    index = Math.floor(Date.now() / 180000) % queue.length;
    setNow(queue[index]);
    renderPlaylists();
    renderSongs();
  });
