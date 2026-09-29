"use strict";

/* ======================================================
   VISIONCHESS — TRAINING ENGINE (ULTRA + RADIO + LOCAL)
====================================================== */

const $ = id => document.getElementById(id);

const KEYS = {
    stats: "visionchess-stats-v3",
    history: "visionchess-history-v3",
    theme: "visionchess-theme-v3",
    board: "visionchess-board-v3",
    sound: "visionchess-sound-v3",
    volume: "visionchess-volume-v3",
    labels: "visionchess-labels-v3",
    ticks: "visionchess-ticks-v3",
    achievements: "visionchess-achievements-v3",
    daily: "visionchess-daily-v3",
    xp: "visionchess-xp-v3"
};

const MUSIC_KEYS = {
    volume: "visionchess-music-volume-v2",
    track: "visionchess-music-track-v2",
    open: "visionchess-music-open-v2",
    source: "visionchess-music-source-v2"
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const TIPS = [
    "Accuracy first, speed second. Smooth recognition becomes fast recognition.",
    "Learn the files from a to h. Knowing the board structure builds confidence.",
    "The center of the board is your reference point. Visualize each square.",
    "Do not rush every answer. Build a reliable connection between files and ranks.",
    "Short daily practice sessions help develop faster coordinate recognition.",
    "Recognize a square instantly instead of counting every file and rank.",
    "Look at the board as a complete grid. Train your eyes to move naturally.",
    "Consistency is the secret. A few focused minutes can build a lasting habit.",
    "In knight mode, trace the L-shape: two squares one way, one square sideways.",
    "Lo-fi beats and board vision — a calm mind sees clearly."
];

const MODE_LABELS = {
    find: "FIND THE SQUARE",
    name: "NAME THE SQUARE",
    knight: "KNIGHT VISION"
};

const MISSION_STEPS = {
    find: [
        { title: "Read the coordinate", text: "Look at the square displayed above the board." },
        { title: "Find it on the board", text: "Identify the correct file and rank, then click it." },
        { title: "Build your accuracy", text: "Correct answers advance to the next target. Keep your streak alive." }
    ],
    name: [
        { title: "Read the highlighted square", text: "A square on the board will pulse with color." },
        { title: "Choose the coordinate", text: "Pick the correct file and rank from the four options below." },
        { title: "Trust your instinct", text: "The faster you recognize, the stronger your vision becomes." }
    ],
    knight: [
        { title: "See the knight", text: "A knight appears on the source square shown above." },
        { title: "Click every legal jump", text: "Tap all squares a knight could move to. Miss none." },
        { title: "Complete the set", text: "When every legal jump is found, the next position appears." }
    ]
};

const ACHIEVEMENTS = [
    { id: "first",      icon: "✦", title: "First Light",    desc: "First correct answer",          check: s => s.totalCorrect >= 1 },
    { id: "streak10",   icon: "♨", title: "On Fire",        desc: "10 correct in a row",           check: s => s.bestStreak >= 10 },
    { id: "streak25",   icon: "⚡", title: "Unstoppable",   desc: "25 correct in a row",           check: s => s.bestStreak >= 25 },
    { id: "correct100", icon: "♛", title: "Century",        desc: "100 total correct",             check: s => s.totalCorrect >= 100 },
    { id: "correct500", icon: "♚", title: "Vision Master",  desc: "500 total correct",             check: s => s.totalCorrect >= 500 },
    { id: "session20",  icon: "◈", title: "Sharp Eye",      desc: "20 correct in one session",     check: s => s.personalBest >= 20 },
    { id: "session40",  icon: "▥", title: "Grand Vision",   desc: "40 correct in one session",     check: s => s.personalBest >= 40 },
    { id: "sessions10", icon: "◷", title: "Dedicated",      desc: "10 training sessions",          check: s => s.totalSessions >= 10 },
    { id: "sessions50", icon: "◎", title: "Committed",      desc: "50 training sessions",          check: s => s.totalSessions >= 50 },
    { id: "perfect",    icon: "♞", title: "Flawless",       desc: "100% accuracy, 15+ correct",    check: s => (s.flawless || 0) >= 1 }
];

const DEFAULT_STATS = {
    totalCorrect: 0,
    bestStreak: 0,
    personalBest: 0,
    totalSessions: 0,
    flawless: 0
};

const DAILY_TARGET = 50;

/* Chill radio playlist — random lo-fi / chill live streams on YouTube */
const MUSIC_TRACKS = [
    { id: "jfKfPfyJRdk", name: "Lofi Girl · Beats to Relax" },
    { id: "4xDzrJKXOOY", name: "Synthwave Radio · Retro Chill" },
    { id: "lTRiuFIWV54", name: "Lofi Hip Hop · Study Beats" },
    { id: "5yx6BWlEVcY", name: "Chillhop Essentials" },
    { id: "n61ULEU7CO0", name: "Lofi Beats · Deep Focus" },
    { id: "7NOSDKb0HlU", name: "Coffee Shop Radio" },
    { id: "0vv7VcHVWSE", name: "Jazz Lofi · Smooth Grooves" }
];

/* IndexedDB settings for local music storage */
const IDB_NAME = "visionchess-music-db";
const IDB_STORE = "tracks";
const IDB_VERSION = 1;


/* ======================================================
   STORAGE HELPERS
====================================================== */

function load(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("Could not save data:", error);
    }
}

function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}


/* ======================================================
   STATE
====================================================== */

let stats = { ...DEFAULT_STATS, ...(load(KEYS.stats, {}) || {}) };
let history = load(KEYS.history, []);
if (!Array.isArray(history)) history = [];

let unlocked = load(KEYS.achievements, []);
if (!Array.isArray(unlocked)) unlocked = [];

let xp = Number(load(KEYS.xp, 0)) || 0;

let daily = load(KEYS.daily, null);
if (!daily || daily.date !== todayKey()) {
    daily = { date: todayKey(), count: 0, target: DAILY_TARGET };
    save(KEYS.daily, daily);
}

const game = {
    mode: "find",
    running: false,
    paused: false,
    completed: false,
    duration: 60,
    timeLeft: 60,
    correct: 0,
    mistakes: 0,
    streak: 0,
    bestStreak: 0,
    target: null,
    knightSource: null,
    knightRemaining: [],
    knightFound: [],
    targetIndex: 0,
    timer: null,
    feedbackTimer: null,
    toastTimer: null,
    sound: true,
    volume: 0.5,
    labels: false,
    ticks: true,
    lastTickSecond: -1,
    typeBuffer: ""
};

let audioContext = null;


/* ======================================================
   SOUND
====================================================== */

function playSound(type = "correct") {
    if (!game.sound) return;
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;

        if (!audioContext) audioContext = new AC();
        if (audioContext.state === "suspended") audioContext.resume();

        const now = audioContext.currentTime;
        const master = audioContext.createGain();
        master.connect(audioContext.destination);

        const volume = Math.max(0, Math.min(1, game.volume));
        let frequencies = [660, 880];
        let duration = 0.18;

        if (type === "wrong") { frequencies = [220]; duration = 0.16; }
        else if (type === "finish") { frequencies = [523, 659, 784, 1046]; duration = 0.55; }
        else if (type === "tick") { frequencies = [880]; duration = 0.06; }
        else if (type === "achievement") { frequencies = [784, 988, 1318]; duration = 0.5; }
        else if (type === "start") { frequencies = [440, 660]; duration = 0.2; }

        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const g = audioContext.createGain();
            osc.connect(g);
            g.connect(master);
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + index * 0.07);

            const startAt = now + index * 0.07;
            const endAt = startAt + duration / frequencies.length + 0.05;

            g.gain.setValueAtTime(0.0001, startAt);
            g.gain.exponentialRampToValueAtTime(Math.max(0.02, 0.14 * volume), startAt + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, endAt);

            osc.start(startAt);
            osc.stop(endAt + 0.03);
        });
    } catch (error) {
        console.warn("Audio unavailable:", error);
    }
}


/* ======================================================
   TOAST
====================================================== */

function toast(message) {
    $("toastMessage").textContent = message;
    $("toast").classList.add("show");

    clearTimeout(game.toastTimer);
    game.toastTimer = setTimeout(() => {
        $("toast").classList.remove("show");
    }, 2400);
}


/* ======================================================
   INDEXEDDB — LOCAL MUSIC STORAGE
====================================================== */

function openMusicDb() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) {
            reject(new Error("IndexedDB not supported"));
            return;
        }
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE, { keyPath: "id" });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbAddTrack(file) {
    const db = await openMusicDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);

        const id = "local-" + Date.now() + "-" +
            Math.random().toString(36).slice(2, 8);

        const record = {
            id,
            name: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Untitled",
            type: file.type || "audio/mpeg",
            size: file.size,
            addedAt: Date.now(),
            blob: file
        };

        const req = store.add(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetAllTracks() {
    const db = await openMusicDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function dbDeleteTrack(id) {
    const db = await openMusicDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}


/* ======================================================
   CHILL RADIO (YouTube Stream + Local Files)
====================================================== */

const music = {
    // Stream (YouTube)
    yt: null,
    ytReady: false,
    ytApiLoaded: false,
    streamPlaying: false,
    streamIndex: 0,

    // Local
    localTracks: [],
    localIndex: 0,
    localPlaying: false,
    localObjectUrl: null,
    audioEl: null,

    // Shared
    volume: 0.4,
    panelOpen: false,
    source: "stream"
};

function loadYouTubeAPI() {
    if (music.ytApiLoaded) return;
    music.ytApiLoaded = true;

    if (window.YT && window.YT.Player) {
        createYtPlayer();
        return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
    createYtPlayer();
};

function createYtPlayer() {
    if (!window.YT || !window.YT.Player) return;
    if (music.yt) return;

    try {
        music.yt = new window.YT.Player("ytPlayerHidden", {
            height: "1",
            width: "1",
            videoId: MUSIC_TRACKS[music.streamIndex].id,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                rel: 0
            },
            events: {
                onReady: onYtReady,
                onStateChange: onYtStateChange,
                onError: onYtError
            }
        });
    } catch (err) {
        console.warn("YT player creation failed:", err);
    }
}

function onYtReady() {
    music.ytReady = true;
    if (music.yt && music.yt.setVolume) {
        music.yt.setVolume(Math.round(music.volume * 100));
    }
    updateMusicUI();
}

function onYtStateChange(event) {
    if (!window.YT) return;
    if (event.data === window.YT.PlayerState.PLAYING) {
        music.streamPlaying = true;
    } else if (
        event.data === window.YT.PlayerState.PAUSED ||
        event.data === window.YT.PlayerState.ENDED
    ) {
        music.streamPlaying = false;
    }
    updateMusicUI();
}

function onYtError() {
    if (music.source !== "stream") return;
    toast("Track unavailable — playing another.");
    nextStreamTrack();
}

/* ---------- Stream controls ---------- */

function playStream() {
    if (!music.ytReady || !music.yt) {
        toast("Radio is still loading...");
        return;
    }
    try { music.yt.playVideo(); } catch (e) { console.warn(e); }
}

function pauseStream() {
    if (!music.ytReady || !music.yt) return;
    try { music.yt.pauseVideo(); } catch (e) { console.warn(e); }
}

function setStreamTrack(index, autoplay) {
    const total = MUSIC_TRACKS.length;
    music.streamIndex = ((index % total) + total) % total;
    save(MUSIC_KEYS.track, music.streamIndex);
    updateMusicUI();

    if (!music.ytReady || !music.yt) return;
    try {
        const id = MUSIC_TRACKS[music.streamIndex].id;
        if (autoplay && music.yt.loadVideoById) music.yt.loadVideoById(id);
        else if (music.yt.cueVideoById) music.yt.cueVideoById(id);
    } catch (e) {
        console.warn(e);
    }
}

function nextStreamTrack() {
    // Random shuffle (never the same twice in a row)
    let next = music.streamIndex;
    if (MUSIC_TRACKS.length > 1) {
        while (next === music.streamIndex) {
            next = Math.floor(Math.random() * MUSIC_TRACKS.length);
        }
    }
    setStreamTrack(next, true);
    toast(`♪ ${MUSIC_TRACKS[music.streamIndex].name}`);
}

function prevStreamTrack() {
    setStreamTrack(music.streamIndex - 1, true);
}

/* ---------- Local controls ---------- */

async function loadLocalTracks() {
    try {
        music.localTracks = await dbGetAllTracks();
        music.localTracks.sort((a, b) => a.addedAt - b.addedAt);
    } catch (err) {
        console.warn("Local track load failed:", err);
        music.localTracks = [];
    }
    renderLocalTracks();
}

function playLocalIndex(index) {
    if (!music.localTracks.length) return;

    const total = music.localTracks.length;
    music.localIndex = ((index % total) + total) % total;
    const track = music.localTracks[music.localIndex];

    if (!music.audioEl) return;

    // Revoke old object URL
    if (music.localObjectUrl) {
        URL.revokeObjectURL(music.localObjectUrl);
        music.localObjectUrl = null;
    }

    try {
        const url = URL.createObjectURL(track.blob);
        music.localObjectUrl = url;
        music.audioEl.src = url;
        music.audioEl.volume = music.volume;
        music.audioEl.play().catch(err => {
            console.warn("Playback failed:", err);
        });
    } catch (err) {
        console.warn("Could not play local track:", err);
        toast("Could not play that file.");
    }

    updateMusicUI();
    renderLocalTracks();
}

function pauseLocal() {
    if (!music.audioEl) return;
    music.audioEl.pause();
}

function toggleLocal() {
    if (!music.audioEl) return;
    if (music.localPlaying) {
        pauseLocal();
    } else {
        if (!music.audioEl.src) {
            if (!music.localTracks.length) {
                toast("No local tracks yet — add files first.");
                return;
            }
            playLocalIndex(music.localIndex);
        } else {
            music.audioEl.play().catch(err => console.warn(err));
        }
    }
}

function nextLocalTrack() {
    if (!music.localTracks.length) return;
    playLocalIndex(music.localIndex + 1);
}

function prevLocalTrack() {
    if (!music.localTracks.length) return;
    playLocalIndex(music.localIndex - 1);
}

/* ---------- Shared music controls ---------- */

function musicIsPlaying() {
    return music.source === "stream" ? music.streamPlaying : music.localPlaying;
}

function togglePlay() {
    if (music.source === "stream") {
        if (music.streamPlaying) pauseStream();
        else playStream();
    } else {
        toggleLocal();
    }
}

function nextTrack() {
    if (music.source === "stream") nextStreamTrack();
    else nextLocalTrack();
}

function prevTrack() {
    if (music.source === "stream") prevStreamTrack();
    else prevLocalTrack();
}

function setMusicVolume(vol) {
    music.volume = Math.max(0, Math.min(1, vol));
    save(MUSIC_KEYS.volume, music.volume);

    if (music.yt && music.yt.setVolume) {
        music.yt.setVolume(Math.round(music.volume * 100));
    }
    if (music.audioEl) {
        music.audioEl.volume = music.volume;
    }

    const volVal = $("musicVolVal");
    if (volVal) volVal.textContent = `${Math.round(music.volume * 100)}%`;
}

function switchSource(source) {
    if (!["stream", "local"].includes(source)) return;
    if (music.source === source) return;

    // Pause the other source
    if (source === "local") {
        pauseStream();
    } else {
        pauseLocal();
    }

    music.source = source;
    save(MUSIC_KEYS.source, source);

    document.querySelectorAll(".music-tab").forEach(tab => {
        const active = tab.dataset.source === source;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    $("musicLocalSection").classList.toggle("hidden", source !== "local");

    updateMusicUI();
}

function updateMusicUI() {
    const source = music.source;

    // Now playing label + name
    const nowLabel = $("musicNowLabel");
    const nameEl = $("musicTrackName");

    if (source === "stream") {
        if (nowLabel) nowLabel.textContent = "NOW PLAYING · STREAM";
        if (nameEl) nameEl.textContent = MUSIC_TRACKS[music.streamIndex].name;
        if ($("musicFootText")) $("musicFootText").textContent = "♞ Train with chill beats";
    } else {
        if (nowLabel) nowLabel.textContent = "NOW PLAYING · LOCAL";
        if (nameEl) {
            const track = music.localTracks[music.localIndex];
            nameEl.textContent = track ? track.name : "No local tracks yet";
        }
        if ($("musicFootText")) $("musicFootText").textContent = "♞ Your music, your board";
    }

    // Play button
    const playBtn = $("musicPlay");
    if (playBtn) playBtn.textContent = musicIsPlaying() ? "❚❚" : "▶";

    // FAB + topbar indicator
    const fab = $("musicFab");
    if (fab) fab.classList.toggle("playing", musicIsPlaying());

    const topBtn = $("musicTopBtn");
    if (topBtn) topBtn.classList.toggle("playing", musicIsPlaying());
}

function openMusicPanel() {
    const panel = $("musicPanel");
    const fab = $("musicFab");
    if (!panel || !fab) return;
    panel.classList.remove("hidden");
    fab.classList.add("active");
    music.panelOpen = true;
    save(MUSIC_KEYS.open, true);
}

function closeMusicPanel() {
    const panel = $("musicPanel");
    const fab = $("musicFab");
    if (!panel || !fab) return;
    panel.classList.add("hidden");
    fab.classList.remove("active");
    music.panelOpen = false;
    save(MUSIC_KEYS.open, false);
}

function toggleMusicPanel() {
    if (music.panelOpen) closeMusicPanel();
    else openMusicPanel();
}

/* ---------- Local tracks UI ---------- */

function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

function renderLocalTracks() {
    const list = $("musicTrackList");
    const countEl = $("musicTrackCount");
    if (!list) return;

    if (countEl) countEl.textContent = music.localTracks.length;

    list.innerHTML = "";

    if (!music.localTracks.length) {
        list.innerHTML = `
            <div class="music-empty">
                <span>♪</span>
                No local tracks yet.<br>
                Click <strong>+ Add files</strong> to import MP3s, WAVs, and more.
            </div>
        `;
        return;
    }

    music.localTracks.forEach((track, index) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "music-track-item" +
            (index === music.localIndex && music.source === "local" ? " active" : "");
        item.dataset.id = track.id;

        const icon = document.createElement("div");
        icon.className = "music-track-icon";
        icon.textContent = index === music.localIndex && music.localPlaying ? "❚❚" : "♪";

        const meta = document.createElement("div");
        meta.className = "music-track-meta";

        const name = document.createElement("div");
        name.className = "music-track-name";
        name.textContent = track.name;

        const size = document.createElement("div");
        size.className = "music-track-size";
        const ext = (track.type || "").split("/")[1] || "audio";
        size.textContent = `${formatBytes(track.size)} · ${ext.toUpperCase()}`;

        meta.append(name, size);

        const del = document.createElement("button");
        del.type = "button";
        del.className = "music-track-del";
        del.setAttribute("aria-label", "Remove track");
        del.textContent = "×";
        del.addEventListener("click", event => {
            event.stopPropagation();
            removeLocalTrack(track.id);
        });

        item.append(icon, meta, del);

        item.addEventListener("click", () => {
            if (music.source !== "local") switchSource("local");
            playLocalIndex(index);
        });

        list.appendChild(item);
    });
}

async function addLocalFiles(files) {
    if (!files || !files.length) return;

    // Detect IndexedDB availability
    try {
        await openMusicDb();
    } catch (err) {
        toast("Local storage not available in this browser.");
        return;
    }

    let added = 0;
    let skipped = 0;

    for (const file of files) {
        if (!file.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name)) {
            skipped++;
            continue;
        }

        // Soft size cap (30 MB per file)
        if (file.size > 30 * 1024 * 1024) {
            const ok = confirm(`"${file.name}" is ${formatBytes(file.size)}. Add anyway?`);
            if (!ok) { skipped++; continue; }
        }

        try {
            const record = await dbAddTrack(file);
            music.localTracks.push(record);
            added++;
        } catch (err) {
            console.warn("Add failed:", err);
            skipped++;
        }
    }

    music.localTracks.sort((a, b) => a.addedAt - b.addedAt);
    renderLocalTracks();

    if (added) {
        toast(`Added ${added} track${added > 1 ? "s" : ""}${skipped ? ` · ${skipped} skipped` : ""}.`);
        // Auto-switch to Local tab so the user sees what they added
        if (music.source !== "local") switchSource("local");
    } else if (skipped) {
        toast("No audio files added.");
    }
}

async function removeLocalTrack(id) {
    const track = music.localTracks.find(t => t.id === id);
    if (!track) return;

    if (!confirm(`Remove "${track.name}" from your local tracks?`)) return;

    try {
        await dbDeleteTrack(id);
    } catch (err) {
        console.warn(err);
    }

    const wasActive = music.source === "local" && music.localTracks[music.localIndex]?.id === id;

    music.localTracks = music.localTracks.filter(t => t.id !== id);

    if (wasActive) {
        pauseLocal();
        if (music.localObjectUrl) {
            URL.revokeObjectURL(music.localObjectUrl);
            music.localObjectUrl = null;
        }
        if (music.audioEl) music.audioEl.src = "";
    }

    if (music.localIndex >= music.localTracks.length) {
        music.localIndex = Math.max(0, music.localTracks.length - 1);
    }

    renderLocalTracks();
    updateMusicUI();
    toast("Track removed.");
}

/* ---------- Init ---------- */

function setupMusic() {
    // Restore settings
    music.volume = Number(load(MUSIC_KEYS.volume, 0.4));
    if (isNaN(music.volume)) music.volume = 0.4;

    music.streamIndex = Number(load(MUSIC_KEYS.track, 0)) || 0;
    if (music.streamIndex < 0 || music.streamIndex >= MUSIC_TRACKS.length) {
        music.streamIndex = 0;
    }

    music.source = load(MUSIC_KEYS.source, "stream");
    if (!["stream", "local"].includes(music.source)) music.source = "stream";

    // Audio element for local files
    music.audioEl = $("localAudio");
    if (music.audioEl) {
        music.audioEl.volume = music.volume;

        music.audioEl.addEventListener("play", () => {
            music.localPlaying = true;
            updateMusicUI();
            renderLocalTracks();
        });
        music.audioEl.addEventListener("pause", () => {
            music.localPlaying = false;
            updateMusicUI();
            renderLocalTracks();
        });
        music.audioEl.addEventListener("ended", () => {
            // Auto-advance to next local track
            if (music.localTracks.length > 1) {
                playLocalIndex(music.localIndex + 1);
            } else {
                music.localPlaying = false;
                updateMusicUI();
                renderLocalTracks();
            }
        });
        music.audioEl.addEventListener("error", () => {
            console.warn("Local audio error");
            music.localPlaying = false;
            updateMusicUI();
        });
    }

    // Volume slider
    const volEl = $("musicVolume");
    if (volEl) {
        volEl.value = String(Math.round(music.volume * 100));
        volEl.addEventListener("input", e => {
            setMusicVolume(Number(e.target.value) / 100);
        });
    }
    const volVal = $("musicVolVal");
    if (volVal) volVal.textContent = `${Math.round(music.volume * 100)}%`;

    // FAB + panel
    const fab = $("musicFab");
    if (fab) fab.addEventListener("click", toggleMusicPanel);

    const closeBtn = $("musicCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeMusicPanel);

    const topBtn = $("musicTopBtn");
    if (topBtn) {
        topBtn.addEventListener("click", () => {
            if (!music.panelOpen) openMusicPanel();
            else closeMusicPanel();
        });
    }

    // Transport
    const playBtn = $("musicPlay");
    if (playBtn) playBtn.addEventListener("click", togglePlay);

    const nextBtn = $("musicNext");
    if (nextBtn) nextBtn.addEventListener("click", nextTrack);

    const prevBtn = $("musicPrev");
    if (prevBtn) prevBtn.addEventListener("click", prevTrack);

    // Source tabs
    document.querySelectorAll(".music-tab").forEach(tab => {
        tab.addEventListener("click", () => switchSource(tab.dataset.source));
    });

    // Local file input
    const addBtn = $("musicAddBtn");
    const fileInput = $("musicFileInput");
    if (addBtn && fileInput) {
        addBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", async event => {
            const files = Array.from(event.target.files || []);
            await addLocalFiles(files);
            event.target.value = "";
        });
    }

    // Apply initial source state
    document.querySelectorAll(".music-tab").forEach(tab => {
        const active = tab.dataset.source === music.source;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    $("musicLocalSection").classList.toggle("hidden", music.source !== "local");

    // Restore panel open state
    const wasOpen = load(MUSIC_KEYS.open, false);
    if (wasOpen) openMusicPanel();

    // Load local tracks from IndexedDB (async)
    loadLocalTracks().then(() => updateMusicUI());

    updateMusicUI();

    // Init YouTube API (only after first user interaction if we want to be safe,
    // but loading the script itself is fine)
    loadYouTubeAPI();
}


/* ======================================================
   COORDINATES AND BOARD
====================================================== */

function createCoordinates() {
    $("topCoordinates").innerHTML = "";
    $("bottomCoordinates").innerHTML = "";
    $("leftCoordinates").innerHTML = "";
    $("rightCoordinates").innerHTML = "";

    FILES.forEach(file => {
        ["topCoordinates", "bottomCoordinates"].forEach(id => {
            const el = document.createElement("span");
            el.textContent = file;
            $(id).appendChild(el);
        });
    });

    RANKS.forEach(rank => {
        ["leftCoordinates", "rightCoordinates"].forEach(id => {
            const el = document.createElement("span");
            el.textContent = rank;
            $(id).appendChild(el);
        });
    });
}

function createBoard() {
    const board = $("chessboard");
    board.innerHTML = "";

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const file = FILES[col];
            const rank = RANKS[row];
            const coordinate = `${file}${rank}`;

            const square = document.createElement("button");
            square.type = "button";
            square.className =
                "square " + ((row + col) % 2 === 0 ? "light" : "dark");
            square.dataset.square = coordinate;
            square.setAttribute("role", "gridcell");
            square.setAttribute("aria-label", `Square ${coordinate}`);
            square.setAttribute("aria-pressed", "false");
            square.disabled = true;

            const label = document.createElement("span");
            label.className = "square-label";
            label.textContent = coordinate;
            square.appendChild(label);

            square.addEventListener("click", () => handleSquare(coordinate, square));
            board.appendChild(square);
        }
    }
}

function clearHighlights() {
    document.querySelectorAll(".square").forEach(square => {
        square.classList.remove(
            "last-correct",
            "last-wrong",
            "target-highlight",
            "knight-source",
            "knight-found"
        );
        square.setAttribute("aria-pressed", "false");
    });
}

function enableBoard(enabled) {
    document.querySelectorAll(".square").forEach(square => {
        square.disabled = !enabled;
    });
}

function highlightSquare(coordinate, className) {
    const sq = document.querySelector(`.square[data-square="${coordinate}"]`);
    if (sq) sq.classList.add(className);
}


/* ======================================================
   THEMES
====================================================== */

function setAppearance(theme) {
    const allowed = ["dark", "light", "neon"];
    if (!allowed.includes(theme)) theme = "dark";
    document.body.dataset.theme = theme;
    $("appearanceTheme").value = theme;
    save(KEYS.theme, theme);
}

function setBoardTheme(theme) {
    const allowed = ["rose", "classic", "wood", "blue", "purple", "pink"];
    if (!allowed.includes(theme)) theme = "rose";
    document.body.dataset.board = theme;
    $("boardTheme").value = theme;
    save(KEYS.board, theme);
}

function setLabels(enabled) {
    game.labels = !!enabled;
    document.body.classList.toggle("show-labels", game.labels);
    $("labelsToggle").checked = game.labels;
    save(KEYS.labels, game.labels);
}


/* ======================================================
   KNIGHT LOGIC
====================================================== */

function knightMoves(coord) {
    const fileIdx = FILES.indexOf(coord[0]);
    const rankIdx = RANKS.indexOf(Number(coord[1]));
    const offsets = [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
    ];
    const valid = [];
    for (const [df, dr] of offsets) {
        const f = fileIdx + df;
        const r = rankIdx + dr;
        if (f >= 0 && f < 8 && r >= 0 && r < 8) {
            valid.push(`${FILES[f]}${RANKS[r]}`);
        }
    }
    return valid;
}

function randomSquare() {
    const file = FILES[Math.floor(Math.random() * 8)];
    const rank = RANKS[Math.floor(Math.random() * 8)];
    return `${file}${rank}`;
}


/* ======================================================
   TARGET GENERATION
====================================================== */

function generateTarget() {
    if (game.mode === "find") generateFindTarget();
    else if (game.mode === "name") generateNameTarget();
    else if (game.mode === "knight") generateKnightTarget();
}

function generateFindTarget() {
    let coordinate;
    let attempts = 0;
    do {
        coordinate = randomSquare();
        attempts++;
    } while (coordinate === game.target && attempts < 20);

    game.target = coordinate;
    game.targetIndex++;

    $("targetLabelText").textContent = "FIND THIS SQUARE";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = coordinate;
    $("targetHint").textContent = "Click the matching square on the board.";
    $("targetFeedback").textContent = "";
    $("targetNumber").textContent = `TARGET / ${String(game.targetIndex).padStart(2, "0")}`;

    $("choiceGrid").classList.add("hidden");
    $("choiceGrid").innerHTML = "";
    $("typeBuffer").textContent = "";

    $("targetPanel").classList.remove("correct", "wrong");
    clearHighlights();
}

function generateNameTarget() {
    const coordinate = randomSquare();
    game.target = coordinate;
    game.targetIndex++;

    $("targetLabelText").textContent = "NAME THIS SQUARE";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = "?";
    $("targetHint").textContent = "Which coordinate is highlighted?";
    $("targetFeedback").textContent = "";
    $("targetNumber").textContent = `TARGET / ${String(game.targetIndex).padStart(2, "0")}`;

    $("targetPanel").classList.remove("correct", "wrong");
    clearHighlights();
    highlightSquare(coordinate, "target-highlight");

    const choices = new Set([coordinate]);
    while (choices.size < 4) choices.add(randomSquare());
    const arr = Array.from(choices).sort(() => Math.random() - 0.5);

    const grid = $("choiceGrid");
    grid.innerHTML = "";
    grid.classList.remove("hidden");

    arr.forEach(coord => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.textContent = coord;
        btn.dataset.choice = coord;
        btn.addEventListener("click", () => handleChoice(coord, btn));
        grid.appendChild(btn);
    });

    $("typeBuffer").textContent = "";
}

function generateKnightTarget() {
    let source;
    let attempts = 0;
    do {
        source = randomSquare();
        attempts++;
    } while (
        (source === game.knightSource || knightMoves(source).length < 2) &&
        attempts < 40
    );

    game.knightSource = source;
    game.target = source;
    game.targetIndex++;
    game.knightRemaining = knightMoves(source);
    game.knightFound = [];

    $("targetLabelText").textContent = "KNIGHT JUMPS FROM";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = source;
    $("targetHint").textContent = "Click every square this knight can move to.";
    $("targetFeedback").textContent = "";
    $("targetNumber").textContent = `TARGET / ${String(game.targetIndex).padStart(2, "0")}`;

    $("choiceGrid").classList.add("hidden");
    $("choiceGrid").innerHTML = "";
    $("typeBuffer").textContent = "";

    $("targetPanel").classList.remove("correct", "wrong");
    clearHighlights();
    highlightSquare(source, "knight-source");
}

function resetTarget() {
    game.target = null;
    game.knightSource = null;
    game.knightRemaining = [];
    game.knightFound = [];
    game.targetIndex = 0;

    $("targetCoordinate").classList.add("muted");
    $("targetCoordinate").textContent = "—";
    $("targetHint").textContent = "Start your session to begin.";
    $("targetFeedback").textContent = "";
    $("targetNumber").textContent = "TARGET / 00";
    $("targetLabelText").textContent = "FIND THIS SQUARE";

    $("targetPanel").classList.remove("correct", "wrong");
    $("choiceGrid").classList.add("hidden");
    $("choiceGrid").innerHTML = "";
    $("typeBuffer").textContent = "";

    clearHighlights();
}


/* ======================================================
   TIMER AND PROGRESS
====================================================== */

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function updateTimer() {
    $("timerDisplay").textContent = formatTime(game.timeLeft);
    $("timerDisplay").style.color =
        game.timeLeft <= 10 && game.running && !game.paused
            ? "var(--red)"
            : "var(--accent)";
}

function updateProgress() {
    const elapsed = game.duration - game.timeLeft;
    const percentage = Math.min(100, Math.max(0, (elapsed / game.duration) * 100));
    $("progressFill").style.width = `${percentage}%`;
    $("progressText").textContent = `${Math.round(percentage)}%`;
}

function runTimer() {
    clearInterval(game.timer);
    game.timer = setInterval(() => {
        if (!game.running || game.paused) return;

        game.timeLeft = Math.max(0, game.timeLeft - 1);
        updateTimer();
        updateProgress();

        if (
            game.ticks &&
            game.timeLeft <= 10 &&
            game.timeLeft > 0 &&
            game.timeLeft !== game.lastTickSecond
        ) {
            game.lastTickSecond = game.timeLeft;
            playSound("tick");
        }

        if (game.timeLeft === 0) finishTraining();
    }, 1000);
}


/* ======================================================
   ACCURACY / LIVE STATS
====================================================== */

function accuracy() {
    const attempts = game.correct + game.mistakes;
    if (attempts === 0) return 100;
    return Math.round((game.correct / attempts) * 100);
}

function updateLiveStats() {
    $("sessionCorrect").textContent = String(game.correct).padStart(2, "0");
    $("sessionAccuracy").innerHTML = `${accuracy()}<small>%</small>`;
    $("sessionAccuracy").style.color =
        accuracy() >= 80 ? "var(--green)" : "var(--orange)";
    $("sessionStreak").textContent = String(game.streak).padStart(2, "0");
}

function updateDashboard() {
    $("totalCorrect").textContent = stats.totalCorrect || 0;
    $("bestStreak").textContent = stats.bestStreak || 0;
    $("personalBest").textContent = stats.personalBest || 0;
    $("sidebarBest").textContent = stats.personalBest || 0;
    $("totalSessions").textContent = stats.totalSessions || 0;
}


/* ======================================================
   XP / LEVEL
====================================================== */

function levelInfo(totalXp) {
    const level = Math.floor(totalXp / 250) + 1;
    const intoLevel = totalXp - (level - 1) * 250;
    const toNext = 250 - intoLevel;
    return { level, intoLevel, toNext, progress: intoLevel / 250 };
}

function levelTitle(level) {
    if (level >= 20) return "Grandmaster";
    if (level >= 15) return "Master";
    if (level >= 10) return "Strategist";
    if (level >= 7) return "Tactician";
    if (level >= 4) return "Apprentice";
    return "Novice";
}

function updateLevelUI() {
    const info = levelInfo(xp);
    $("levelLabel").textContent = `LEVEL ${info.level}`;
    $("levelNext").textContent = `${info.toNext} XP TO NEXT`;
    $("levelBarFill").style.width = `${info.progress * 100}%`;
    $("profileTitle").textContent = levelTitle(info.level);
    $("profileXp").textContent = `${xp} XP · Level ${info.level}`;
}

function addXp(amount) {
    if (amount <= 0) return;
    xp += amount;
    save(KEYS.xp, xp);
    updateLevelUI();
}


/* ======================================================
   DAILY GOAL
====================================================== */

function updateDailyUI() {
    const pct = Math.min(1, daily.count / DAILY_TARGET);
    const circumference = 2 * Math.PI * 33;
    $("goalRingFill").style.strokeDashoffset = String(circumference * (1 - pct));
    $("goalPercent").textContent = `${Math.round(pct * 100)}%`;
    $("goalCurrent").textContent = daily.count;
    $("goalTarget").textContent = DAILY_TARGET;
}

function bumpDaily(amount = 1) {
    if (daily.date !== todayKey()) {
        daily = { date: todayKey(), count: 0, target: DAILY_TARGET };
    }
    daily.count += amount;
    save(KEYS.daily, daily);
    updateDailyUI();
}


/* ======================================================
   ACHIEVEMENTS
====================================================== */

function renderAchievements() {
    const grid = $("achievementsGrid");
    grid.innerHTML = "";

    ACHIEVEMENTS.forEach(a => {
        const unlockedFlag = unlocked.includes(a.id);
        const el = document.createElement("div");
        el.className = "achievement" + (unlockedFlag ? " unlocked" : "");

        const icon = document.createElement("div");
        icon.className = "achievement-icon";
        icon.textContent = a.icon;

        const text = document.createElement("div");
        text.className = "achievement-text";

        const title = document.createElement("strong");
        title.textContent = a.title;

        const desc = document.createElement("span");
        desc.textContent = a.desc;

        text.append(title, desc);
        el.append(icon, text);
        grid.appendChild(el);
    });

    $("achievementCount").textContent = `${unlocked.length} / ${ACHIEVEMENTS.length}`;
}

function checkAchievements() {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(a => {
        if (!unlocked.includes(a.id) && a.check(stats)) {
            unlocked.push(a.id);
            newlyUnlocked.push(a);
        }
    });

    if (newlyUnlocked.length) {
        save(KEYS.achievements, unlocked);
        renderAchievements();
        newlyUnlocked.forEach((a, i) => {
            setTimeout(() => {
                toast(`✦ Achievement unlocked: ${a.title}`);
                playSound("achievement");
                fireConfetti(40);
            }, i * 400);
        });
    }
}


/* ======================================================
   CONFETTI
====================================================== */

function fireConfetti(count = 80) {
    const canvas = $("confettiCanvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#bd9aff", "#9970ef", "#52e5b0", "#ffb86c", "#78a9ff", "#ff718e"];
    const particles = [];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
            y: window.innerHeight / 2 - 40,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * -8 - 3,
            size: Math.random() * 7 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 0.3,
            life: 0,
            maxLife: 90 + Math.random() * 40
        });
    }

    let raf;
    const gravity = 0.28;

    function frame() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        let alive = 0;
        particles.forEach(p => {
            if (p.life > p.maxLife) return;
            alive++;
            p.life++;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += gravity;
            p.vx *= 0.995;
            p.rot += p.vrot;

            const alpha = Math.max(0, 1 - p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
            ctx.restore();
        });

        if (alive > 0) raf = requestAnimationFrame(frame);
        else {
            cancelAnimationFrame(raf);
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    cancelAnimationFrame(raf);
    frame();
}


/* ======================================================
   RESET SESSION
====================================================== */

function resetSession() {
    clearInterval(game.timer);
    clearTimeout(game.feedbackTimer);
    game.timer = null;
    game.running = false;
    game.paused = false;
    game.completed = false;

    game.duration = Number($("durationSelect").value) || 60;
    game.timeLeft = game.duration;

    game.correct = 0;
    game.mistakes = 0;
    game.streak = 0;
    game.bestStreak = 0;
    game.lastTickSecond = -1;
    game.typeBuffer = "";

    $("sessionStateText").textContent = "READY";
    $("topStatus").textContent = "TRAINING READY";
    $("startBtnText").textContent = "Start training";
    $("pauseBtnText").textContent = "Pause";
    $("pauseBtn").disabled = true;

    $("pauseOverlay").classList.add("hidden");

    $("resultsPanel").classList.add("hidden");
    $("newRecord").classList.add("hidden");

    $("sessionCorrect").textContent = "00";
    $("sessionAccuracy").innerHTML = "100<small>%</small>";
    $("sessionAccuracy").style.color = "var(--green)";
    $("sessionStreak").textContent = "00";

    updateTimer();
    updateProgress();
    resetTarget();

    enableBoard(false);
}


/* ======================================================
   START / PAUSE / FINISH
====================================================== */

function startTraining() {
    if (game.running) {
        finishTraining();
        return;
    }

    resetSession();

    game.duration = Number($("durationSelect").value) || 60;
    game.timeLeft = game.duration;
    game.running = true;
    game.paused = false;

    $("sessionStateText").textContent = "LIVE";
    $("topStatus").textContent = "TRAINING LIVE";
    $("startBtnText").textContent = "End session";
    $("pauseBtn").disabled = false;

    enableBoard(game.mode !== "name");

    generateTarget();
    updateLiveStats();
    updateTimer();

    runTimer();

    toast(`Session started · ${MODE_LABELS[game.mode]}`);
    playSound("start");

    // If the radio panel is open and nothing is playing, start the current source
    if (music.panelOpen && !musicIsPlaying()) {
        if (music.source === "stream" && music.ytReady) playStream();
        else if (music.source === "local" && music.localTracks.length) {
            if (!music.audioEl.src) playLocalIndex(music.localIndex);
            else music.audioEl.play().catch(() => {});
        }
    }
}

function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;

    if (game.paused) {
        $("pauseOverlay").classList.remove("hidden");
        $("pauseBtnText").textContent = "Resume";
        $("sessionStateText").textContent = "PAUSED";
        $("topStatus").textContent = "PAUSED";
        enableBoard(false);
    } else {
        $("pauseOverlay").classList.add("hidden");
        $("pauseBtnText").textContent = "Pause";
        $("sessionStateText").textContent = "LIVE";
        $("topStatus").textContent = "TRAINING LIVE";
        enableBoard(game.mode !== "name");
    }
}

function finishTraining() {
    if (!game.running) return;

    game.running = false;
    game.paused = false;
    game.completed = true;

    clearInterval(game.timer);
    clearTimeout(game.feedbackTimer);
    game.timer = null;

    $("sessionStateText").textContent = "COMPLETE";
    $("topStatus").textContent = "SESSION COMPLETE";
    $("startBtnText").textContent = "Train again";
    $("pauseBtn").disabled = true;
    $("pauseBtnText").textContent = "Pause";
    $("pauseOverlay").classList.add("hidden");

    enableBoard(false);
    $("targetPanel").classList.remove("correct", "wrong");
    $("targetHint").textContent = "Session completed! Review your results below.";
    $("targetFeedback").textContent = "";
    $("choiceGrid").classList.add("hidden");
    clearHighlights();

    stats.totalSessions++;

    const previousBest = stats.personalBest || 0;
    const newRecord = game.correct > previousBest;

    stats.personalBest = Math.max(previousBest, game.correct);
    stats.bestStreak = Math.max(stats.bestStreak || 0, game.bestStreak);

    const acc = accuracy();
    if (acc === 100 && game.correct >= 15) {
        stats.flawless = (stats.flawless || 0) + 1;
    }

    let gainedXp = game.correct * 4;
    if (game.bestStreak >= 10) gainedXp += 30;
    if (game.bestStreak >= 20) gainedXp += 40;
    if (acc === 100 && game.correct >= 15) gainedXp += 60;
    if (newRecord && game.correct > 0) gainedXp += 25;

    addXp(gainedXp);

    const result = {
        correct: game.correct,
        mistakes: game.mistakes,
        accuracy: acc,
        bestStreak: game.bestStreak,
        duration: game.duration,
        mode: game.mode,
        xp: gainedXp,
        date: new Date().toISOString()
    };

    history.unshift(result);
    history = history.slice(0, 10);

    save(KEYS.stats, stats);
    save(KEYS.history, history);

    updateDashboard();
    renderHistory();
    renderChart();
    updateLevelUI();
    checkAchievements();

    showResults(newRecord, gainedXp);

    playSound("finish");

    if (newRecord && game.correct > 0) fireConfetti(120);
    else if (game.correct >= 20) fireConfetti(70);

    $("resultsPanel").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* ======================================================
   ANSWER HANDLING
====================================================== */

function handleSquare(coordinate, square) {
    if (!game.running || game.paused || !game.target) return;

    if (game.mode === "find") {
        if (coordinate === game.target) correctFind(square);
        else wrongSquare(square);
    } else if (game.mode === "knight") {
        if (coordinate === game.knightSource) return;
        if (game.knightFound.includes(coordinate)) return;
        if (game.knightRemaining.includes(coordinate)) {
            correctKnightStep(coordinate, square);
        } else {
            wrongSquare(square);
        }
    }
}

function handleChoice(coord, btn) {
    if (!game.running || game.paused || game.mode !== "name") return;

    if (coord === game.target) {
        btn.classList.add("correct");
        correctName(btn);
    } else {
        btn.classList.add("wrong");
        game.mistakes++;
        game.streak = 0;
        updateLiveStats();
        playSound("wrong");

        $("targetPanel").classList.add("wrong");
        $("targetFeedback").textContent = "✕ WRONG";
        $("targetFeedback").style.color = "var(--red)";

        setTimeout(() => btn.classList.remove("wrong"), 500);
    }
}

function correctFind(square) {
    game.correct++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);

    clearHighlights();
    square.classList.add("last-correct");
    square.setAttribute("aria-pressed", "true");

    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Excellent! Next coordinate coming...";

    updateLiveStats();
    updateDashboard();
    bumpDaily(1);
    save(KEYS.stats, stats);
    playSound("correct");

    if (game.streak > 0 && game.streak % 5 === 0) toast(`${game.streak} in a row!`);

    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        generateTarget();
    }, 220);
}

function correctName(btn) {
    game.correct++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);

    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Excellent! Next square coming...";

    updateLiveStats();
    updateDashboard();
    bumpDaily(1);
    save(KEYS.stats, stats);
    playSound("correct");

    setTimeout(() => btn.classList.remove("correct"), 400);

    if (game.streak > 0 && game.streak % 5 === 0) toast(`${game.streak} in a row!`);

    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        generateTarget();
    }, 420);
}

function correctKnightStep(coordinate, square) {
    game.knightFound.push(coordinate);
    game.knightRemaining = game.knightRemaining.filter(c => c !== coordinate);

    square.classList.add("knight-found");

    game.correct++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);

    updateLiveStats();
    updateDashboard();
    bumpDaily(1);
    save(KEYS.stats, stats);

    if (game.knightRemaining.length === 0) {
        $("targetPanel").classList.add("correct");
        $("targetFeedback").textContent = "✓ ALL JUMPS FOUND";
        $("targetFeedback").style.color = "var(--green)";
        $("targetHint").textContent = "Nice! Next knight incoming...";
        playSound("correct");

        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => {
            if (!game.running) return;
            generateTarget();
        }, 420);
    } else {
        playSound("correct");
        $("targetHint").textContent =
            `${game.knightFound.length} / ${game.knightFound.length + game.knightRemaining.length} jumps found.`;
    }
}

function wrongSquare(square) {
    game.mistakes++;
    game.streak = 0;

    clearHighlights();

    if (game.mode === "knight" && game.knightSource) {
        highlightSquare(game.knightSource, "knight-source");
        game.knightFound.forEach(c => highlightSquare(c, "knight-found"));
    }

    square.classList.add("last-wrong");
    square.setAttribute("aria-pressed", "true");

    $("targetPanel").classList.add("wrong");
    $("targetFeedback").textContent = "✕ TRY AGAIN";
    $("targetFeedback").style.color = "var(--red)";

    if (game.mode === "find") {
        $("targetHint").textContent = `That was ${square.dataset.square}. Find ${game.target}.`;
    } else if (game.mode === "knight") {
        $("targetHint").textContent = `${square.dataset.square} is not a legal jump. Keep looking.`;
    }

    updateLiveStats();
    playSound("wrong");

    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("wrong");
        $("targetFeedback").textContent = "";

        if (game.mode === "find") {
            $("targetHint").textContent = "Try again — find the correct square.";
            clearHighlights();
        } else if (game.mode === "knight") {
            $("targetHint").textContent =
                `${game.knightFound.length} / ${game.knightFound.length + game.knightRemaining.length} jumps found.`;
            square.classList.remove("last-wrong");
        } else if (game.mode === "name") {
            clearHighlights();
            if (game.target) highlightSquare(game.target, "target-highlight");
        }
    }, 480);
}


/* ======================================================
   RESULTS
====================================================== */

function showResults(newRecord, gainedXp) {
    $("resultCorrect").textContent = game.correct;
    $("resultAccuracy").textContent = `${accuracy()}%`;
    $("resultStreak").textContent = game.bestStreak;
    $("resultXp").textContent = `+${gainedXp} XP earned`;
    $("resultMode").textContent = `MODE · ${MODE_LABELS[game.mode]}`;

    if (game.correct >= 30) {
        $("resultTitle").textContent = "Outstanding vision!";
        $("resultDescription").textContent =
            "Excellent work! Keep challenging yourself and maintain that accuracy.";
    } else if (game.correct >= 15) {
        $("resultTitle").textContent = "Excellent progress!";
        $("resultDescription").textContent =
            "You're building strong coordinate recognition. Keep practicing consistently.";
    } else if (game.correct > 0) {
        $("resultTitle").textContent = "Well played!";
        $("resultDescription").textContent =
            "Every correct answer counts. Keep developing your board vision.";
    } else {
        $("resultTitle").textContent = "Every session counts!";
        $("resultDescription").textContent =
            "Practice the files and ranks. Your next session is another opportunity.";
    }

    $("newRecord").classList.toggle("hidden", !newRecord);
    $("resultsPanel").classList.remove("hidden");
}


/* ======================================================
   HISTORY + CHART
====================================================== */

function renderHistory() {
    const container = $("historyList");
    container.innerHTML = "";

    if (!history.length) {
        container.innerHTML = `
            <div class="empty-history">
                <span>♞</span>
                <p>Your completed sessions will appear here.</p>
            </div>
        `;
        return;
    }

    history.forEach((session, index) => {
        const date = new Date(session.date);
        const dateText = date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
        });
        const timeText = date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
        });

        const item = document.createElement("div");
        item.className = "history-item";

        const icon = document.createElement("div");
        icon.className = "history-item-icon";
        icon.textContent = "♞";

        const info = document.createElement("div");
        info.className = "history-item-info";

        const title = document.createElement("strong");
        title.textContent = `Session ${history.length - index} · ${MODE_LABELS[session.mode || "find"].split(" ")[0]}`;

        const dateLabel = document.createElement("span");
        dateLabel.textContent = `${dateText} · ${timeText}`;

        info.append(title, dateLabel);

        const score = document.createElement("div");
        score.className = "history-item-score";

        const correct = document.createElement("strong");
        correct.textContent = session.correct;

        const accuracyLabel = document.createElement("span");
        accuracyLabel.textContent = `${session.accuracy}% accuracy`;

        score.append(correct, accuracyLabel);

        item.append(icon, info, score);
        container.appendChild(item);
    });
}

function renderChart() {
    const chart = $("historyChart");
    chart.innerHTML = "";

    if (!history.length) {
        chart.style.height = "40px";
        return;
    }

    chart.style.height = "68px";

    const recent = history.slice(0, 10).reverse();
    const max = Math.max(...recent.map(s => s.correct), 1);

    recent.forEach((session, i) => {
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        const heightPct = Math.max(6, (session.correct / max) * 100);
        bar.style.height = `${heightPct}%`;

        const label = document.createElement("span");
        label.textContent = session.correct;
        bar.appendChild(label);

        bar.title = `${session.correct} correct · ${session.accuracy}% accuracy`;

        bar.style.transitionDelay = `${i * 40}ms`;
        chart.appendChild(bar);
    });
}

function clearHistory() {
    if (!history.length) {
        toast("No session history to clear.");
        return;
    }
    if (!confirm(
        "Clear your recent session history? Your lifetime stats and personal best will remain."
    )) return;

    history = [];
    save(KEYS.history, history);
    renderHistory();
    renderChart();
    toast("Session history cleared.");
}


/* ======================================================
   NAVIGATION
====================================================== */

function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-link").forEach(item =>
                item.classList.remove("active")
            );
            link.classList.add("active");
            document.body.classList.remove("sidebar-open");
        });
    });

    $("mobileMenu").addEventListener("click", () => {
        document.body.classList.toggle("sidebar-open");
    });

    document.addEventListener("click", event => {
        if (
            document.body.classList.contains("sidebar-open") &&
            !event.target.closest(".sidebar") &&
            !event.target.closest("#mobileMenu")
        ) {
            document.body.classList.remove("sidebar-open");
        }
    });
}


/* ======================================================
   FULLSCREEN
====================================================== */

async function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch {
        toast("Fullscreen is not available in this browser.");
    }
}


/* ======================================================
   KEYBOARD SHORTCUTS
====================================================== */

function setupKeyboard() {
    document.addEventListener("keydown", event => {
        const target = event.target;
        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT"
        ) return;

        const key = event.key.toLowerCase();

        if (key === "r") {
            event.preventDefault();
            if (game.running) finishTraining();
            else startTraining();
            return;
        }

        if (event.code === "Space") {
            event.preventDefault();
            if (game.running) togglePause();
            else startTraining();
            return;
        }

        if (key === "f") {
            event.preventDefault();
            toggleFullscreen();
            return;
        }

        if (key === "m") {
            event.preventDefault();
            toggleMusicPanel();
            return;
        }

        if (event.key === "Escape") {
            document.body.classList.remove("sidebar-open");
            if (game.paused) togglePause();
            else if (game.running) togglePause();
        }
    });
}


/* ======================================================
   MODE SWITCHING
====================================================== */

function setMode(mode) {
    if (!["find", "name", "knight"].includes(mode)) return;
    if (game.running) {
        toast("Finish the current session to change mode.");
        return;
    }

    game.mode = mode;

    document.querySelectorAll(".mode-btn").forEach(btn => {
        const active = btn.dataset.mode === mode;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    renderMissionSteps();
    resetSession();
}

function renderMissionSteps() {
    const steps = MISSION_STEPS[game.mode];
    const container = $("missionSteps");
    container.innerHTML = "";

    steps.forEach((step, i) => {
        const el = document.createElement("div");
        el.className = "mission-step";

        const num = document.createElement("span");
        num.className = "step-number";
        num.textContent = String(i + 1).padStart(2, "0");

        const body = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = step.title;
        const text = document.createElement("p");
        text.textContent = step.text;

        body.append(title, text);
        el.append(num, body);
        container.appendChild(el);
    });

    $("missionTitle").textContent = game.mode === "find"
        ? "How to train"
        : game.mode === "name"
            ? "Name the square"
            : "Knight vision";
}


/* ======================================================
   DAILY TIP
====================================================== */

function setDailyTip() {
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    $("tipText").textContent = TIPS[day % TIPS.length];
}


/* ======================================================
   EXPORT / IMPORT
====================================================== */

function exportData() {
    const payload = {
        version: 3,
        exportedAt: new Date().toISOString(),
        stats,
        history,
        xp,
        unlocked,
        daily,
        settings: {
            theme: document.body.dataset.theme,
            board: document.body.dataset.board,
            sound: game.sound,
            volume: game.volume,
            labels: game.labels,
            ticks: game.ticks,
            musicVolume: music.volume,
            musicTrack: music.streamIndex,
            musicSource: music.source
        }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `visionchess-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast("Backup exported. (Local music files are not included.)");
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== "object") throw new Error("Bad file");

            if (data.stats) {
                stats = { ...DEFAULT_STATS, ...data.stats };
                save(KEYS.stats, stats);
            }
            if (Array.isArray(data.history)) {
                history = data.history.slice(0, 10);
                save(KEYS.history, history);
            }
            if (typeof data.xp === "number") {
                xp = data.xp;
                save(KEYS.xp, xp);
            }
            if (Array.isArray(data.unlocked)) {
                unlocked = data.unlocked;
                save(KEYS.achievements, unlocked);
            }
            if (data.daily && data.daily.date) {
                daily = data.daily;
                save(KEYS.daily, daily);
            }
            if (data.settings) {
                if (data.settings.theme) setAppearance(data.settings.theme);
                if (data.settings.board) setBoardTheme(data.settings.board);
                if (typeof data.settings.sound === "boolean") {
                    game.sound = data.settings.sound;
                    $("soundToggle").checked = game.sound;
                    save(KEYS.sound, game.sound);
                }
                if (typeof data.settings.volume === "number") {
                    game.volume = data.settings.volume;
                    $("volumeRange").value = String(Math.round(game.volume * 100));
                    save(KEYS.volume, game.volume);
                }
                if (typeof data.settings.labels === "boolean") {
                    setLabels(data.settings.labels);
                }
                if (typeof data.settings.ticks === "boolean") {
                    game.ticks = data.settings.ticks;
                    $("ticksToggle").checked = game.ticks;
                    save(KEYS.ticks, game.ticks);
                }
                if (typeof data.settings.musicVolume === "number") {
                    setMusicVolume(data.settings.musicVolume);
                    const mv = $("musicVolume");
                    if (mv) mv.value = String(Math.round(music.volume * 100));
                }
                if (typeof data.settings.musicTrack === "number") {
                    setStreamTrack(data.settings.musicTrack, false);
                }
                if (typeof data.settings.musicSource === "string") {
                    switchSource(data.settings.musicSource);
                }
            }

            updateDashboard();
            updateLevelUI();
            updateDailyUI();
            renderAchievements();
            renderHistory();
            renderChart();
            resetSession();

            toast("Backup imported successfully.");
        } catch (err) {
            console.warn(err);
            toast("Import failed — invalid file.");
        }
    };
    reader.readAsText(file);
}


/* ======================================================
   INITIALIZE APP
====================================================== */

function init() {
    createCoordinates();
    createBoard();

    setAppearance(load(KEYS.theme, "dark"));
    setBoardTheme(load(KEYS.board, "rose"));
    setLabels(load(KEYS.labels, false));

    game.sound = load(KEYS.sound, true) !== false;
    $("soundToggle").checked = game.sound;

    game.volume = Number(load(KEYS.volume, 0.5));
    if (isNaN(game.volume)) game.volume = 0.5;
    $("volumeRange").value = String(Math.round(game.volume * 100));

    game.ticks = load(KEYS.ticks, true) !== false;
    $("ticksToggle").checked = game.ticks;

    // Training buttons
    $("startBtn").addEventListener("click", startTraining);
    $("pauseBtn").addEventListener("click", togglePause);
    $("resumeBtn").addEventListener("click", togglePause);

    $("resultRestart").addEventListener("click", () => {
        startTraining();
        $("training").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("durationSelect").addEventListener("change", () => {
        if (game.running) {
            $("durationSelect").value = game.duration;
            toast("Finish the current session to change duration.");
            return;
        }
        resetSession();
    });

    $("appearanceTheme").addEventListener("change", event => {
        setAppearance(event.target.value);
        toast("Appearance updated.");
    });

    $("boardTheme").addEventListener("change", event => {
        setBoardTheme(event.target.value);
        toast("Board theme updated.");
    });

    $("volumeRange").addEventListener("input", event => {
        game.volume = Number(event.target.value) / 100;
        save(KEYS.volume, game.volume);
    });

    $("volumeRange").addEventListener("change", () => {
        toast(`Volume: ${Math.round(game.volume * 100)}%`);
        if (game.sound) playSound("correct");
    });

    $("soundToggle").addEventListener("change", () => {
        game.sound = $("soundToggle").checked;
        save(KEYS.sound, game.sound);
        if (game.sound) playSound("correct");
        toast(game.sound ? "Sound enabled." : "Sound disabled.");
    });

    $("labelsToggle").addEventListener("change", () => {
        setLabels($("labelsToggle").checked);
        toast(game.labels ? "Square labels shown." : "Square labels hidden.");
    });

    $("ticksToggle").addEventListener("change", () => {
        game.ticks = $("ticksToggle").checked;
        save(KEYS.ticks, game.ticks);
        toast(game.ticks ? "Countdown ticks on." : "Countdown ticks off.");
    });

    document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    $("fullscreenBtn").addEventListener("click", toggleFullscreen);
    $("clearHistoryBtn").addEventListener("click", clearHistory);

    $("exportBtn").addEventListener("click", exportData);
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", event => {
        const file = event.target.files && event.target.files[0];
        if (file) importData(file);
        event.target.value = "";
    });

    setupNavigation();
    setupKeyboard();
    setupMusic();

    setDailyTip();
    renderMissionSteps();

    resetSession();
    updateDashboard();
    updateLevelUI();
    updateDailyUI();
    renderAchievements();
    renderHistory();
    renderChart();

    console.log("VisionChess initialized successfully.");
}

document.addEventListener("DOMContentLoaded", init);
