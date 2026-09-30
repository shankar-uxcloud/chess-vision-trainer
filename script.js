"use strict";

/* ======================================================
   CHESS VISION TRAINER — ENGINE v3.2
   + Both-view dual mode
   + Random pieces on board
   + Shuffle-bag random coordinates
====================================================== */

const $ = id => document.getElementById(id);

const KEYS = {
    stats: "cvt-stats-v3",
    history: "cvt-history-v3",
    theme: "cvt-theme-v3",
    board: "cvt-board-v3",
    flip: "cvt-flip-v3",
    perspective: "cvt-perspective-v3",
    labels: "cvt-labels-v3",
    coords: "cvt-coords-v3",
    pieces: "cvt-pieces-v3",
    sound: "cvt-sound-v3",
    volume: "cvt-volume-v3",
    ticks: "cvt-ticks-v3",
    boardSize: "cvt-boardsize-v3",
    achievements: "cvt-achievements-v3",
    daily: "cvt-daily-v3",
    xp: "cvt-xp-v3",
    onboarded: "cvt-onboarded-v3"
};

const MUSIC_KEYS = {
    volume: "cvt-music-vol-v3",
    track: "cvt-music-track-v3",
    open: "cvt-music-open-v3",
    source: "cvt-music-src-v3",
    lastLocal: "cvt-music-last-v3",
    position: "cvt-music-pos-v3",
    widget: "cvt-music-widget-v3"
};

const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = [8,7,6,5,4,3,2,1];

const TIPS = [
    "Accuracy first, speed second. Smooth recognition becomes fast recognition.",
    "Learn the files from a to h. Board structure builds confidence.",
    "The center is your reference point. Visualize each square from it.",
    "Do not rush every answer. Build a reliable file-to-rank connection.",
    "Short daily sessions develop faster coordinate recognition.",
    "Recognize a square instantly instead of counting file and rank.",
    "Look at the board as a complete grid. Train your eyes to move naturally.",
    "Consistency is the secret. A few focused minutes each day compounds.",
    "In knight mode, trace the L-shape: two squares one way, one sideways.",
    "Both-view mode is the real test: know every square from both sides."
];

const MODE_INFO = {
    square:     { label: "Square Vision",       sub: "Find the coordinate on the board." },
    coordinate: { label: "Coordinate Trainer",  sub: "Name the highlighted square." },
    reverse:    { label: "Reverse Coordinates", sub: "Pick the correct coordinate." },
    knight:     { label: "Knight Vision",       sub: "Find every legal knight jump." },
    blindfold:  { label: "Blindfold Training",  sub: "No coordinates — pure visualization." },
    color:      { label: "Color Recognition",   sub: "Is the square light or dark?" },
    custom:     { label: "Custom Practice",     sub: "Your configuration." }
};

const MISSION_STEPS = {
    square: [
        { title: "Read the coordinate", text: "Look at the square shown above the board." },
        { title: "Find it on the board", text: "Identify the file and rank, then click the square." },
        { title: "Keep your streak", text: "Correct answers advance the target. Build accuracy." }
    ],
    coordinate: [
        { title: "Read the highlighted square", text: "A square on the board pulses with color." },
        { title: "Choose the coordinate", text: "Pick the correct file and rank from four options." },
        { title: "Trust your instinct", text: "Faster recognition means stronger vision." }
    ],
    reverse: [
        { title: "Note the highlighted square", text: "Its coordinate is hidden from the board." },
        { title: "Pick from six options", text: "Choose the correct algebraic notation." },
        { title: "Stay sharp", text: "Six choices demand precise recall." }
    ],
    knight: [
        { title: "See the knight", text: "A knight appears on the source square." },
        { title: "Click every legal jump", text: "Tap all squares a knight could move to." },
        { title: "Complete the set", text: "When every jump is found, the next position appears." }
    ],
    blindfold: [
        { title: "Coordinates only", text: "Board labels and coordinates are hidden." },
        { title: "Visualize the square", text: "Picture the file and rank in your mind." },
        { title: "Click the board", text: "Trust your mental map — click where it is." }
    ],
    color: [
        { title: "Read the coordinate", text: "A coordinate is shown above the board." },
        { title: "Determine the color", text: "Is that square light or dark?" },
        { title: "Choose quickly", text: "Pattern recognition beats calculation." }
    ],
    custom: [
        { title: "Your rules", text: "Duration, mode, and difficulty are up to you." },
        { title: "Train with focus", text: "Pick the mode you want to sharpen." },
        { title: "Track progress", text: "Every session contributes to your stats." }
    ]
};

const ACHIEVEMENTS = [
    { id: "first",    icon: "✦", title: "First Light",     desc: "Answer your first question correctly.",        check: s => s.totalCorrect >= 1 },
    { id: "streak10", icon: "♨", title: "Warming Up",       desc: "10 correct answers in a row.",                 check: s => s.bestStreak >= 10 },
    { id: "streak25", icon: "⚡", title: "Unstoppable",      desc: "25 correct answers in a row.",                 check: s => s.bestStreak >= 25 },
    { id: "streak50", icon: "◈", title: "Locked In",        desc: "50 correct answers in a row.",                 check: s => s.bestStreak >= 50 },
    { id: "c100",     icon: "♛", title: "Century",          desc: "100 correct answers total.",                   check: s => s.totalCorrect >= 100 },
    { id: "c500",     icon: "♚", title: "Vision Master",    desc: "500 correct answers total.",                   check: s => s.totalCorrect >= 500 },
    { id: "c1000",    icon: "◉", title: "Grandmaster Eye",  desc: "1000 correct answers total.",                  check: s => s.totalCorrect >= 1000 },
    { id: "sess20",   icon: "▥", title: "Sharp Eye",        desc: "20 correct in one session.",                   check: s => s.personalBest >= 20 },
    { id: "sess40",   icon: "◎", title: "Grand Vision",     desc: "40 correct in one session.",                   check: s => s.personalBest >= 40 },
    { id: "sess10",   icon: "◷", title: "Dedicated",        desc: "Complete 10 sessions.",                        check: s => s.totalSessions >= 10 },
    { id: "sess50",   icon: "◆", title: "Committed",        desc: "Complete 50 sessions.",                        check: s => s.totalSessions >= 50 },
    { id: "perfect",  icon: "♞", title: "Flawless",         desc: "100% accuracy with 15+ correct in a session.", check: s => (s.flawless || 0) >= 1 }
];

const DEFAULT_STATS = {
    totalCorrect: 0,
    totalMistakes: 0,
    bestStreak: 0,
    personalBest: 0,
    totalSessions: 0,
    flawless: 0,
    totalTime: 0,
    totalQuestions: 0
};

const DAILY_TARGET = 50;

/* ======================================================
   SHUFFLE BAG — unbiased random square generation
====================================================== */
const squareBag = {
    pool: [],
    reset() {
        this.pool = [];
        for (const f of FILES) for (const r of RANKS) this.pool.push(f + r);
        this.shuffle();
    },
    shuffle() {
        for (let i = this.pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = this.pool[i];
            this.pool[i] = this.pool[j];
            this.pool[j] = t;
        }
    },
    next(exclude) {
        if (!this.pool.length) this.reset();
        if (exclude && this.pool.length > 1 && this.pool[0] === exclude) {
            const j = 1 + Math.floor(Math.random() * (this.pool.length - 1));
            const t = this.pool[0];
            this.pool[0] = this.pool[j];
            this.pool[j] = t;
        }
        return this.pool.shift();
    }
};
squareBag.reset();

/* Piece glyphs */
const PIECE_GLYPHS_WHITE = ["♔","♕","♖","♗","♘","♙"];
const PIECE_GLYPHS_BLACK = ["♚","♛","♜","♝","♞","♟"];
const PIECE_COUNT = 10;

const MUSIC_STREAM = [
    { id: "jfKfPfyJRdk", name: "Lofi Girl · Beats to Relax" },
    { id: "4xDzrJKXOOY", name: "Synthwave Radio · Retro Chill" },
    { id: "lTRiuFIWV54", name: "Lofi Hip Hop · Study Beats" },
    { id: "5yx6BWlEVcY", name: "Chillhop Essentials" },
    { id: "n61ULEU7CO0", name: "Lofi Beats · Deep Focus" },
    { id: "7NOSDKb0HlU", name: "Coffee Shop Radio" },
    { id: "0vv7VcHVWSE", name: "Jazz Lofi · Smooth Grooves" }
];

const IDB_NAME = "cvt-music-db";
const IDB_STORE = "tracks";
const IDB_VERSION = 1;

/* ======================================================
   STORAGE
====================================================== */
function load(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
}

function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn("Save failed:", e); }
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
    daily = { date: todayKey(), count: 0 };
    save(KEYS.daily, daily);
}

const game = {
    mode: "square",
    perspective: "white",     // white | black | mixed | both
    // Dual-mode state
    dualActive: false,
    dualStep: 0,              // 0 or 1 — which sub-answer we are on
    dualTarget: null,         // coordinate being resolved in dual mode
    // Pieces
    piecesEnabled: false,
    pieces: {},               // { square: { color, glyph } }
    // Session
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
    questionIndex: 0,
    questionStartTime: 0,
    reactionTimes: [],
    timer: null,
    feedbackTimer: null,
    toastTimer: null,
    countdownTimer: null,
    sound: true,
    volume: 0.6,
    ticks: true,
    lastTick: -1
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

        const vol = Math.max(0, Math.min(1, game.volume));
        let freqs = [660, 880];
        let dur = 0.18;

        if (type === "wrong") { freqs = [220, 180]; dur = 0.2; }
        else if (type === "finish") { freqs = [523, 659, 784, 1046]; dur = 0.55; }
        else if (type === "tick") { freqs = [880]; dur = 0.06; }
        else if (type === "achievement") { freqs = [784, 988, 1318]; dur = 0.5; }
        else if (type === "start") { freqs = [440, 660]; dur = 0.2; }
        else if (type === "count") { freqs = [523]; dur = 0.12; }
        else if (type === "flip") { freqs = [587, 784]; dur = 0.18; }

        freqs.forEach((f, i) => {
            const osc = audioContext.createOscillator();
            const g = audioContext.createGain();
            osc.connect(g);
            g.connect(master);
            osc.type = "sine";
            const startAt = now + i * 0.06;
            const endAt = startAt + dur / freqs.length + 0.05;
            osc.frequency.setValueAtTime(f, startAt);
            g.gain.setValueAtTime(0.0001, startAt);
            g.gain.exponentialRampToValueAtTime(Math.max(0.02, 0.12 * vol), startAt + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, endAt);
            osc.start(startAt);
            osc.stop(endAt + 0.03);
        });
    } catch (e) { console.warn("Audio:", e); }
}

/* ======================================================
   TOAST
====================================================== */
function toast(msg) {
    $("toastMessage").textContent = msg;
    $("toast").classList.add("show");
    clearTimeout(game.toastTimer);
    game.toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}

/* ======================================================
   INDEXEDDB
====================================================== */
function openDb() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) return reject(new Error("No IndexedDB"));
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
async function dbAdd(file) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const id = "t-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
        const rec = {
            id,
            name: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Track",
            type: file.type || "audio/mpeg",
            size: file.size,
            addedAt: Date.now(),
            blob: file
        };
        const req = store.add(rec);
        req.onsuccess = () => resolve(rec);
        req.onerror = () => reject(req.error);
    });
}
async function dbAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}
async function dbDel(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const req = tx.objectStore(IDB_STORE).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/* ======================================================
   MUSIC
====================================================== */
const music = {
    yt: null, ytReady: false, ytApiLoaded: false,
    streamPlaying: false, streamIndex: 0,
    localTracks: [], localIndex: 0, localPlaying: false,
    localUrl: null, audioEl: null,
    volume: 0.4, panelOpen: false, source: "stream"
};

function loadYtApi() {
    if (music.ytApiLoaded) return;
    music.ytApiLoaded = true;
    if (window.YT && window.YT.Player) { createYt(); return; }
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
}
window.onYouTubeIframeAPIReady = function () { createYt(); };

function createYt() {
    if (!window.YT || !window.YT.Player || music.yt) return;
    try {
        music.yt = new window.YT.Player("ytPlayerHidden", {
            height: "1", width: "1",
            videoId: MUSIC_STREAM[music.streamIndex].id,
            playerVars: {
                autoplay: 0, controls: 0, disablekb: 1, fs: 0,
                iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0
            },
            events: {
                onReady: () => {
                    music.ytReady = true;
                    if (music.yt.setVolume) music.yt.setVolume(Math.round(music.volume * 100));
                    updateMusicUI();
                },
                onStateChange: e => {
                    if (!window.YT) return;
                    if (e.data === window.YT.PlayerState.PLAYING) music.streamPlaying = true;
                    else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) music.streamPlaying = false;
                    updateMusicUI();
                },
                onError: () => {
                    if (music.source !== "stream") return;
                    toast("Track unavailable — playing another.");
                    nextStream();
                }
            }
        });
    } catch (e) { console.warn("YT:", e); }
}
function playStream() {
    if (!music.ytReady || !music.yt) { toast("Radio is loading..."); return; }
    try { music.yt.playVideo(); } catch (e) { console.warn(e); }
}
function pauseStream() {
    if (!music.ytReady || !music.yt) return;
    try { music.yt.pauseVideo(); } catch (e) { console.warn(e); }
}
function setStream(idx, autoplay) {
    const total = MUSIC_STREAM.length;
    music.streamIndex = ((idx % total) + total) % total;
    save(MUSIC_KEYS.track, music.streamIndex);
    updateMusicUI();
    if (!music.ytReady || !music.yt) return;
    try {
        const id = MUSIC_STREAM[music.streamIndex].id;
        if (autoplay && music.yt.loadVideoById) music.yt.loadVideoById(id);
        else if (music.yt.cueVideoById) music.yt.cueVideoById(id);
    } catch (e) { console.warn(e); }
}
function nextStream() {
    let n = music.streamIndex;
    if (MUSIC_STREAM.length > 1) {
        while (n === music.streamIndex) n = Math.floor(Math.random() * MUSIC_STREAM.length);
    }
    setStream(n, true);
    toast("♪ " + MUSIC_STREAM[music.streamIndex].name);
}
function prevStream() { setStream(music.streamIndex - 1, true); }

async function loadLocal() {
    try { music.localTracks = (await dbAll()).sort((a, b) => a.addedAt - b.addedAt); }
    catch { music.localTracks = []; }
    renderLocal();
}
function playLocalIdx(idx) {
    if (!music.localTracks.length) return;
    const total = music.localTracks.length;
    music.localIndex = ((idx % total) + total) % total;
    const track = music.localTracks[music.localIndex];
    if (!music.audioEl) return;
    if (music.localUrl) { URL.revokeObjectURL(music.localUrl); music.localUrl = null; }
    try {
        const url = URL.createObjectURL(track.blob);
        music.localUrl = url;
        music.audioEl.src = url;
        music.audioEl.volume = music.volume;
        music.audioEl.play().catch(e => console.warn(e));
        save(MUSIC_KEYS.lastLocal, track.id);
    } catch (e) { console.warn(e); }
    updateMusicUI();
    renderLocal();
}
function pauseLocal() { if (music.audioEl) music.audioEl.pause(); }
function toggleLocal() {
    if (!music.audioEl) return;
    if (music.localPlaying) pauseLocal();
    else if (!music.audioEl.src) {
        if (!music.localTracks.length) { toast("No local tracks — add files first."); return; }
        playLocalIdx(music.localIndex);
    } else music.audioEl.play().catch(e => console.warn(e));
}
function nextLocal() { if (music.localTracks.length) playLocalIdx(music.localIndex + 1); }
function prevLocal() { if (music.localTracks.length) playLocalIdx(music.localIndex - 1); }

function isMusicPlaying() { return music.source === "stream" ? music.streamPlaying : music.localPlaying; }
function togglePlay() {
    if (music.source === "stream") music.streamPlaying ? pauseStream() : playStream();
    else toggleLocal();
}
function nextMusic() { music.source === "stream" ? nextStream() : nextLocal(); }
function prevMusic() { music.source === "stream" ? prevStream() : prevLocal(); }

function setMusicVol(v) {
    music.volume = Math.max(0, Math.min(1, v));
    save(MUSIC_KEYS.volume, music.volume);
    if (music.yt && music.yt.setVolume) music.yt.setVolume(Math.round(music.volume * 100));
    if (music.audioEl) music.audioEl.volume = music.volume;
    const el = $("musicVolVal");
    if (el) el.textContent = Math.round(music.volume * 100) + "%";
}

function switchSource(src) {
    if (!["stream", "local"].includes(src) || music.source === src) return;
    if (src === "local") pauseStream();
    else { pauseLocal(); saveMusicPos(); }
    music.source = src;
    save(MUSIC_KEYS.source, src);
    document.querySelectorAll(".music-tab").forEach(t => {
        const on = t.dataset.source === src;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("musicLocalSection").classList.toggle("hidden", src !== "local");
    updateMusicUI();
    clampWidget();
}

function updateMusicUI() {
    const labelEl = $("musicNowLabel");
    const trackEl = $("musicTrackName");
    if (music.source === "stream") {
        if (labelEl) labelEl.textContent = "NOW PLAYING · STREAM";
        if (trackEl) trackEl.textContent = MUSIC_STREAM[music.streamIndex].name;
        if ($("musicFootText")) $("musicFootText").textContent = "♞ Train with chill beats";
    } else {
        if (labelEl) labelEl.textContent = "NOW PLAYING · LOCAL";
        if (trackEl) {
            const t = music.localTracks[music.localIndex];
            trackEl.textContent = t ? t.name : "No local tracks";
        }
        if ($("musicFootText")) $("musicFootText").textContent = "♞ Your music · saved locally";
    }
    const pb = $("musicPlay");
    if (pb) pb.textContent = isMusicPlaying() ? "❚❚" : "▶";
    const fab = $("musicFab");
    if (fab) fab.classList.toggle("playing", isMusicPlaying());
    const tb = $("musicTopBtn");
    if (tb) tb.classList.toggle("playing", isMusicPlaying());
}

function openPanel() {
    $("musicPanel").classList.remove("hidden");
    $("musicFab").classList.add("active");
    music.panelOpen = true;
    save(MUSIC_KEYS.open, true);
    requestAnimationFrame(() => { clampWidget(); applyWidgetPos(); });
}
function closePanel() {
    $("musicPanel").classList.add("hidden");
    $("musicFab").classList.remove("active");
    music.panelOpen = false;
    save(MUSIC_KEYS.open, false);
}
function togglePanel() { music.panelOpen ? closePanel() : openPanel(); }

function fmtBytes(b) {
    if (!b) return "0 KB";
    const kb = b / 1024;
    if (kb < 1024) return kb.toFixed(0) + " KB";
    return (kb / 1024).toFixed(1) + " MB";
}
function renderLocal() {
    const list = $("musicTrackList");
    const cnt = $("musicTrackCount");
    if (!list) return;
    if (cnt) cnt.textContent = music.localTracks.length;
    list.innerHTML = "";
    if (!music.localTracks.length) {
        list.innerHTML = '<div class="music-empty"><span>♪</span>No local tracks yet. Click <strong>+ Add</strong> to import MP3s, WAVs, and more.</div>';
        return;
    }
    music.localTracks.forEach((t, i) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "music-track-item" + (i === music.localIndex && music.source === "local" ? " active" : "");
        item.dataset.id = t.id;
        const icon = document.createElement("div");
        icon.className = "music-track-icon";
        icon.textContent = (i === music.localIndex && music.localPlaying) ? "❚❚" : "♪";
        const meta = document.createElement("div");
        meta.className = "music-track-meta";
        const name = document.createElement("div");
        name.className = "music-track-name";
        name.textContent = t.name;
        const size = document.createElement("div");
        size.className = "music-track-size";
        const ext = (t.type || "").split("/")[1] || "audio";
        size.textContent = fmtBytes(t.size) + " · " + ext.toUpperCase();
        meta.append(name, size);
        const del = document.createElement("button");
        del.type = "button";
        del.className = "music-track-del";
        del.textContent = "×";
        del.setAttribute("aria-label", "Remove track");
        del.addEventListener("click", e => { e.stopPropagation(); removeLocal(t.id); });
        item.append(icon, meta, del);
        item.addEventListener("click", () => {
            if (music.source !== "local") switchSource("local");
            playLocalIdx(i);
        });
        list.appendChild(item);
    });
}
async function addLocalFiles(files) {
    if (!files || !files.length) return;
    try { await openDb(); } catch { toast("Local storage unavailable."); return; }
    let added = 0, skipped = 0;
    for (const f of files) {
        if (!f.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(f.name)) { skipped++; continue; }
        if (f.size > 30 * 1024 * 1024) {
            if (!confirm('"' + f.name + '" is ' + fmtBytes(f.size) + '. Add anyway?')) { skipped++; continue; }
        }
        try {
            music.localTracks.push(await dbAdd(f));
            added++;
        } catch (e) {
            if (e && e.name === "QuotaExceededError") { toast("Storage full. Remove some tracks."); break; }
            skipped++;
        }
    }
    music.localTracks.sort((a, b) => a.addedAt - b.addedAt);
    renderLocal();
    if (added) {
        toast("Saved " + added + " track" + (added > 1 ? "s" : "") + (skipped ? " · " + skipped + " skipped" : "") + ".");
        if (music.source !== "local") switchSource("local");
    } else if (skipped) toast("No audio files added.");
}
async function removeLocal(id) {
    const t = music.localTracks.find(x => x.id === id);
    if (!t) return;
    if (!confirm('Remove "' + t.name + '"?')) return;
    try { await dbDel(id); } catch (e) { console.warn(e); }
    const wasActive = music.source === "local" && music.localTracks[music.localIndex]?.id === id;
    music.localTracks = music.localTracks.filter(x => x.id !== id);
    if (wasActive) {
        pauseLocal();
        if (music.localUrl) { URL.revokeObjectURL(music.localUrl); music.localUrl = null; }
        if (music.audioEl) music.audioEl.src = "";
    }
    if (music.localIndex >= music.localTracks.length) music.localIndex = Math.max(0, music.localTracks.length - 1);
    renderLocal();
    updateMusicUI();
    toast("Track removed.");
}
function saveMusicPos() {
    if (music.source !== "local" || !music.audioEl || !music.audioEl.src) return;
    const t = music.localTracks[music.localIndex];
    if (!t) return;
    save(MUSIC_KEYS.lastLocal, t.id);
    save(MUSIC_KEYS.position, { id: t.id, time: music.audioEl.currentTime || 0, updatedAt: Date.now() });
}
async function restoreLocal() {
    const lastId = load(MUSIC_KEYS.lastLocal, null);
    if (!lastId) return;
    const idx = music.localTracks.findIndex(x => x.id === lastId);
    if (idx < 0) return;
    music.localIndex = idx;
    const t = music.localTracks[idx];
    try {
        if (music.localUrl) { URL.revokeObjectURL(music.localUrl); music.localUrl = null; }
        const url = URL.createObjectURL(t.blob);
        music.localUrl = url;
        music.audioEl.src = url;
        music.audioEl.volume = music.volume;
        const pos = load(MUSIC_KEYS.position, null);
        if (pos && pos.id === t.id && pos.time > 1 && Date.now() - (pos.updatedAt || 0) < 24 * 60 * 60 * 1000) {
            const seek = () => {
                try { music.audioEl.currentTime = pos.time; } catch {}
                music.audioEl.removeEventListener("loadedmetadata", seek);
            };
            music.audioEl.addEventListener("loadedmetadata", seek);
        }
    } catch (e) { console.warn(e); }
    renderLocal();
    updateMusicUI();
}

/* ======================================================
   DRAGGABLE WIDGET
====================================================== */
const drag = {
    offsetX: 0, offsetY: 0,
    dragging: false, moved: false,
    justDragged: false, pointerId: null,
    startX: 0, startY: 0,
    startOffsetX: 0, startOffsetY: 0
};
function applyWidgetPos() {
    const w = $("musicWidget");
    if (w) w.style.transform = "translate(" + drag.offsetX + "px, " + drag.offsetY + "px)";
}
function clampWidget() {
    const w = $("musicWidget");
    if (!w) return;
    const r = w.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight, m = 10;
    let dx = 0, dy = 0;
    if (r.left < m) dx = m - r.left;
    if (r.right > vw - m) dx = (vw - m) - r.right;
    if (r.top < m) dy = m - r.top;
    if (r.bottom > vh - m) dy = (vh - m) - r.bottom;
    if (dx || dy) { drag.offsetX += dx; drag.offsetY += dy; applyWidgetPos(); }
}
function saveWidgetPos() { save(MUSIC_KEYS.widget, { x: drag.offsetX, y: drag.offsetY }); }
function resetWidgetPos() {
    drag.offsetX = 0; drag.offsetY = 0;
    applyWidgetPos(); saveWidgetPos();
    toast("Music position reset.");
}
function setupDrag() {
    const w = $("musicWidget");
    const fab = $("musicFab");
    if (!w || !fab) return;
    const saved = load(MUSIC_KEYS.widget, { x: 0, y: 0 });
    drag.offsetX = Number(saved.x) || 0;
    drag.offsetY = Number(saved.y) || 0;
    applyWidgetPos();

    const THRESH = 5;
    function onDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        drag.dragging = true;
        drag.moved = false;
        drag.pointerId = e.pointerId;
        drag.startX = e.clientX;
        drag.startY = e.clientY;
        drag.startOffsetX = drag.offsetX;
        drag.startOffsetY = drag.offsetY;
        w.classList.add("dragging");
        try { fab.setPointerCapture(e.pointerId); } catch {}
    }
    function onMove(e) {
        if (!drag.dragging || e.pointerId !== drag.pointerId) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < THRESH) return;
        drag.moved = true;
        drag.offsetX = drag.startOffsetX + dx;
        drag.offsetY = drag.startOffsetY + dy;
        applyWidgetPos();
    }
    function onUp(e) {
        if (!drag.dragging || e.pointerId !== drag.pointerId) return;
        drag.dragging = false;
        drag.pointerId = null;
        w.classList.remove("dragging");
        if (drag.moved) {
            clampWidget();
            saveWidgetPos();
            drag.justDragged = true;
            setTimeout(() => drag.justDragged = false, 60);
        }
    }
    fab.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    fab.addEventListener("click", e => {
        if (drag.justDragged) { e.preventDefault(); e.stopPropagation(); return; }
        togglePanel();
    }, true);
    const rb = $("musicResetPos");
    if (rb) rb.addEventListener("click", resetWidgetPos);
    window.addEventListener("resize", () => { clampWidget(); saveWidgetPos(); });
}

async function setupMusic() {
    music.volume = Number(load(MUSIC_KEYS.volume, 0.4));
    if (isNaN(music.volume)) music.volume = 0.4;
    music.streamIndex = Number(load(MUSIC_KEYS.track, 0)) || 0;
    if (music.streamIndex < 0 || music.streamIndex >= MUSIC_STREAM.length) music.streamIndex = 0;
    music.source = load(MUSIC_KEYS.source, "stream");
    if (!["stream", "local"].includes(music.source)) music.source = "stream";

    music.audioEl = $("localAudio");
    if (music.audioEl) {
        music.audioEl.volume = music.volume;
        music.audioEl.addEventListener("play", () => { music.localPlaying = true; updateMusicUI(); renderLocal(); });
        music.audioEl.addEventListener("pause", () => { music.localPlaying = false; saveMusicPos(); updateMusicUI(); renderLocal(); });
        music.audioEl.addEventListener("ended", () => {
            if (music.localTracks.length > 1) playLocalIdx(music.localIndex + 1);
            else { music.localPlaying = false; updateMusicUI(); renderLocal(); }
        });
        music.audioEl.addEventListener("timeupdate", () => {
            const t = Math.floor(music.audioEl.currentTime);
            if (t > 0 && t % 5 === 0) saveMusicPos();
        });
        music.audioEl.addEventListener("error", () => { music.localPlaying = false; updateMusicUI(); });
    }

    const volEl = $("musicVolume");
    if (volEl) {
        volEl.value = String(Math.round(music.volume * 100));
        volEl.addEventListener("input", e => setMusicVol(Number(e.target.value) / 100));
    }
    const vv = $("musicVolVal");
    if (vv) vv.textContent = Math.round(music.volume * 100) + "%";

    const tb = $("musicTopBtn");
    if (tb) tb.addEventListener("click", () => music.panelOpen ? closePanel() : openPanel());
    const cb = $("musicCloseBtn");
    if (cb) cb.addEventListener("click", closePanel);
    const pb = $("musicPlay");
    if (pb) pb.addEventListener("click", togglePlay);
    const nb = $("musicNext");
    if (nb) nb.addEventListener("click", nextMusic);
    const prb = $("musicPrev");
    if (prb) prb.addEventListener("click", prevMusic);

    document.querySelectorAll(".music-tab").forEach(t => {
        t.addEventListener("click", () => switchSource(t.dataset.source));
    });

    const ab = $("musicAddBtn");
    const fi = $("musicFileInput");
    if (ab && fi) {
        ab.addEventListener("click", () => fi.click());
        fi.addEventListener("change", async e => {
            const files = Array.from(e.target.files || []);
            await addLocalFiles(files);
            e.target.value = "";
        });
    }

    document.querySelectorAll(".music-tab").forEach(t => {
        const on = t.dataset.source === music.source;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("musicLocalSection").classList.toggle("hidden", music.source !== "local");

    setupDrag();
    if (load(MUSIC_KEYS.open, false)) openPanel();
    await loadLocal();
    if (music.localTracks.length) await restoreLocal();
    updateMusicUI();
    loadYtApi();
}

/* ======================================================
   BOARD
====================================================== */
function buildCoords() {
    ["topCoordinates","bottomCoordinates","leftCoordinates","rightCoordinates"].forEach(id => {
        const el = $(id); if (el) el.innerHTML = "";
    });
    FILES.forEach(f => {
        ["topCoordinates","bottomCoordinates"].forEach(id => {
            const el = document.createElement("span");
            el.textContent = f;
            $(id).appendChild(el);
        });
    });
    RANKS.forEach(r => {
        ["leftCoordinates","rightCoordinates"].forEach(id => {
            const el = document.createElement("span");
            el.textContent = r;
            $(id).appendChild(el);
        });
    });
}
function buildBoard() {
    const b = $("chessboard");
    b.innerHTML = "";
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const file = FILES[col];
            const rank = RANKS[row];
            const coord = file + rank;
            const sq = document.createElement("button");
            sq.type = "button";
            sq.className = "square " + ((row + col) % 2 === 0 ? "light" : "dark");
            sq.dataset.square = coord;
            sq.setAttribute("role", "gridcell");
            sq.setAttribute("aria-label", "Square " + coord);
            sq.disabled = true;
            const lbl = document.createElement("span");
            lbl.className = "square-label";
            lbl.textContent = coord;
            sq.appendChild(lbl);
            sq.addEventListener("click", () => handleSquare(coord, sq));
            b.appendChild(sq);
        }
    }
    renderPieces();
}

/* ======================================================
   PIECES — random pieces on board for context
====================================================== */
function generatePieces() {
    game.pieces = {};
    if (!game.piecesEnabled) { renderPieces(); return; }

    const occupied = new Set();
    let attempts = 0;
    while (Object.keys(game.pieces).length < PIECE_COUNT && attempts < 200) {
        attempts++;
        const sq = randomSquare();
        if (occupied.has(sq)) continue;
        occupied.add(sq);
        const color = Math.random() < 0.5 ? "white" : "black";
        const glyph = color === "white"
            ? PIECE_GLYPHS_WHITE[Math.floor(Math.random() * PIECE_GLYPHS_WHITE.length)]
            : PIECE_GLYPHS_BLACK[Math.floor(Math.random() * PIECE_GLYPHS_BLACK.length)];
        game.pieces[sq] = { color, glyph };
    }
    renderPieces();
}

function renderPieces() {
    document.querySelectorAll(".piece").forEach(p => p.remove());
    if (!game.piecesEnabled) return;
    Object.keys(game.pieces).forEach(sq => {
        const sqEl = document.querySelector('.square[data-square="' + sq + '"]');
        if (!sqEl) return;
        const p = game.pieces[sq];
        const el = document.createElement("span");
        el.className = "piece piece-" + p.color;
        el.textContent = p.glyph;
        el.setAttribute("aria-hidden", "true");
        sqEl.appendChild(el);
    });
}

function setPiecesEnabled(on) {
    game.piecesEnabled = !!on;
    save(KEYS.pieces, game.piecesEnabled);
    const pt = $("piecesToggle");
    if (pt) pt.checked = game.piecesEnabled;
    if (game.piecesEnabled) generatePieces();
    else { game.pieces = {}; renderPieces(); }
}

/* ======================================================
   BOARD HELPERS
====================================================== */
function clearHighlights() {
    document.querySelectorAll(".square").forEach(sq => {
        sq.classList.remove("last-correct","last-wrong","target-highlight","knight-source","knight-found");
    });
}
function enableBoard(on) {
    document.querySelectorAll(".square").forEach(sq => { sq.disabled = !on; });
}
function hl(coord, cls) {
    const sq = document.querySelector('.square[data-square="' + coord + '"]');
    if (sq) sq.classList.add(cls);
}
function isLightSquare(coord) {
    const f = FILES.indexOf(coord[0]);
    const r = RANKS.indexOf(Number(coord[1]));
    return (f + r) % 2 === 0;
}
function knightMoves(coord) {
    const fi = FILES.indexOf(coord[0]);
    const ri = RANKS.indexOf(Number(coord[1]));
    const off = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
    const out = [];
    for (const [df, dr] of off) {
        const f = fi + df, r = ri + dr;
        if (f >= 0 && f < 8 && r >= 0 && r < 8) out.push(FILES[f] + RANKS[r]);
    }
    return out;
}
function randomSquare() {
    return FILES[Math.floor(Math.random() * 8)] + RANKS[Math.floor(Math.random() * 8)];
}
function nextTarget() {
    return squareBag.next(game.target);
}

/* ======================================================
   BOARD VIEW / PERSPECTIVE
====================================================== */
function setPerspective(p) {
    if (!["white", "black", "mixed", "both"].includes(p)) p = "white";
    game.perspective = p;
    save(KEYS.perspective, p);

    document.querySelectorAll(".perspective-btn").forEach(b => {
        const on = b.dataset.perspective === p;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
    });

    // Update flip immediately when not running
    if (!game.running) applyFlipForQuestion(true);

    // Sync flip toggle in settings
    const ft = $("flipToggle");
    if (ft) {
        if (p === "white") { ft.checked = false; ft.disabled = false; }
        else if (p === "black") { ft.checked = true; ft.disabled = false; }
        else { ft.disabled = true; }
    }
}

/* Called at the start of every question.
   white -> never flip. black -> always flip. mixed -> 50/50.
   both -> handled by dual-mode logic. */
function applyFlipForQuestion(force) {
    let flip;
    if (game.perspective === "white") flip = false;
    else if (game.perspective === "black") flip = true;
    else if (game.perspective === "mixed") flip = Math.random() < 0.5;
    else flip = false; // both mode starts in white view

    const current = document.body.dataset.flip === "true";
    if (force || flip !== current) {
        document.body.dataset.flip = flip ? "true" : "false";
        save(KEYS.flip, flip);
    }
}

function setBoardFlip(flip) {
    document.body.dataset.flip = flip ? "true" : "false";
    save(KEYS.flip, flip);
}

/* ======================================================
   DUAL MODE ("Both" board view)
====================================================== */
function isDualMode() {
    return game.perspective === "both";
}

function updateDualIndicator() {
    const el = $("dualIndicator");
    if (!el) return;
    if (!isDualMode() || !game.running) {
        el.classList.add("hidden");
        el.classList.remove("step-2");
        return;
    }
    el.classList.remove("hidden");
    const step = game.dualStep + 1; // 1 or 2
    const label = step === 1 ? "WHITE VIEW" : "BLACK VIEW";
    el.classList.toggle("step-2", step === 2);
    el.innerHTML =
        '<span class="dual-dot"></span>' +
        '<span class="dual-text">' + step + ' / 2 · ' + label + '</span>';
}

/* ======================================================
   TARGETS
====================================================== */
function genTarget() {
    // Reset dual-mode state for a new question
    game.dualStep = 0;
    game.dualTarget = null;

    // Choose board orientation first
    if (isDualMode()) {
        // Both mode always starts in white view for each new question
        setBoardFlip(false);
    } else {
        applyFlipForQuestion(false);
    }

    game.questionStartTime = Date.now();
    const mode = game.mode;
    if (mode === "square" || mode === "blindfold") genSquareTarget();
    else if (mode === "coordinate") genNameTarget(4);
    else if (mode === "reverse") genNameTarget(6);
    else if (mode === "knight") genKnightTarget();
    else if (mode === "color") genColorTarget();
    else genSquareTarget();

    updateDualIndicator();
}

function updateQuestionNumber() {
    $("targetNumber").textContent = "QUESTION " + String(game.questionIndex).padStart(2, "0");
}

function genSquareTarget() {
    const coord = nextTarget();
    game.target = coord;
    if (isDualMode()) game.dualTarget = coord;
    game.questionIndex++;
    updateQuestionNumber();

    $("targetLabelText").textContent = isDualMode() ? "FIND IN BOTH VIEWS" : "FIND THIS SQUARE";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = coord;
    $("targetHint").textContent = isDualMode()
        ? "Click this square from white's view."
        : "Click the matching square on the board.";
    $("targetFeedback").textContent = "";
    $("choiceGrid").classList.add("hidden");
    $("choiceGrid").innerHTML = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
}

function genNameTarget(count) {
    const coord = nextTarget();
    game.target = coord;
    game.questionIndex++;
    updateQuestionNumber();

    $("targetLabelText").textContent = game.mode === "reverse" ? "IDENTIFY THIS SQUARE" : "NAME THIS SQUARE";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = "?";
    $("targetHint").textContent = "Which coordinate is highlighted?";
    $("targetFeedback").textContent = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
    hl(coord, "target-highlight");

    const choices = new Set([coord]);
    let tries = 0;
    while (choices.size < count && tries < 50) { choices.add(randomSquare()); tries++; }
    const arr = Array.from(choices).sort(() => Math.random() - 0.5);

    const grid = $("choiceGrid");
    grid.innerHTML = "";
    grid.classList.remove("hidden");
    grid.style.gridTemplateColumns = count > 4 ? "repeat(3, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))";

    arr.forEach(c => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.textContent = c;
        btn.dataset.choice = c;
        btn.addEventListener("click", () => handleChoice(c, btn));
        grid.appendChild(btn);
    });
}

function genKnightTarget() {
    let src = nextTarget();
    let tries = 0;
    while (knightMoves(src).length < 2 && tries < 40) {
        src = nextTarget();
        tries++;
    }
    game.knightSource = src;
    game.target = src;
    game.questionIndex++;
    game.knightRemaining = knightMoves(src);
    game.knightFound = [];

    updateQuestionNumber();
    $("targetLabelText").textContent = "KNIGHT JUMPS FROM";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = src;
    $("targetHint").textContent = "Click every square this knight can move to.";
    $("targetFeedback").textContent = "";
    $("choiceGrid").classList.add("hidden");
    $("choiceGrid").innerHTML = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
    hl(src, "knight-source");
}

function genColorTarget() {
    const coord = nextTarget();
    game.target = coord;
    game.questionIndex++;
    updateQuestionNumber();

    $("targetLabelText").textContent = "SQUARE COLOR";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = coord;
    $("targetHint").textContent = "Is this square light or dark?";
    $("targetFeedback").textContent = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();

    const grid = $("choiceGrid");
    grid.innerHTML = "";
    grid.classList.remove("hidden");
    grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";

    [["light","Light"],["dark","Dark"]].forEach(([val, label]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.textContent = label;
        btn.dataset.choice = val;
        btn.addEventListener("click", () => handleColorChoice(val, btn));
        grid.appendChild(btn);
    });
}

function resetTarget() {
    game.target = null;
    game.knightSource = null;
    game.knightRemaining = [];
    game.knightFound = [];
    game.questionIndex = 0;
    game.dualStep = 0;
    game.dualTarget = null;
    $("targetCoordinate").classList.add("muted");
    $("targetCoordinate").textContent = "—";
    $("targetHint").textContent = "Press Start to begin your session.";
    $("targetFeedback").textContent = "";
    $("targetNumber").textContent = "QUESTION 00";
    $("targetLabelText").textContent = "FIND THIS SQUARE";
    $("targetPanel").classList.remove("correct","wrong");
    $("choiceGrid").classList.add("hidden");
    $("choiceGrid").innerHTML = "";
    $("dualIndicator").classList.add("hidden");
    $("dualIndicator").classList.remove("step-2");
    clearHighlights();
}

/* ======================================================
   ANSWER HANDLING
====================================================== */
function recordReaction() {
    if (game.questionStartTime) {
        const rt = Date.now() - game.questionStartTime;
        if (rt > 0 && rt < 30000) game.reactionTimes.push(rt);
    }
}

function handleSquare(coord, sq) {
    if (!game.running || game.paused || !game.target) return;
    if (game.mode === "square" || game.mode === "blindfold") {
        if (coord === game.target) {
            if (isDualMode()) correctDual(sq);
            else correctFind(sq);
        } else wrongSquare(sq);
    } else if (game.mode === "knight") {
        if (coord === game.knightSource || game.knightFound.includes(coord)) return;
        if (game.knightRemaining.includes(coord)) correctKnight(coord, sq);
        else wrongSquare(sq);
    }
}

/* Dual-mode step handler */
function correctDual(sq) {
    // First correct in a dual pair → flip and ask for second
    if (game.dualStep === 0) {
        game.dualStep = 1;

        // Visual feedback for first half
        sq.classList.add("last-correct");
        $("targetPanel").classList.add("correct");
        $("targetFeedback").textContent = "✓ WHITE SIDE · NOW FIND IT FROM BLACK";
        $("targetFeedback").style.color = "var(--green)";
        $("targetHint").textContent = "Board is flipping — click " + game.target + " again.";
        playSound("correct");

        // Flip the board
        setTimeout(() => {
            setBoardFlip(true);
            playSound("flip");
            updateDualIndicator();
        }, 300);

        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => {
            if (!game.running) return;
            $("targetPanel").classList.remove("correct");
            clearHighlights();
        }, 700);
        return;
    }

    // Second correct → count the full question, advance
    game.dualStep = 0;
    game.dualTarget = null;
    onCorrectBase();
    clearHighlights();
    sq.classList.add("last-correct");
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ BOTH SIDES COMPLETE";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    updateDualIndicator();

    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("correct");
        genTarget();
    }, 500);
}

function handleChoice(coord, btn) {
    if (!game.running || game.paused) return;
    if (game.mode !== "coordinate" && game.mode !== "reverse") return;
    if (coord === game.target) { btn.classList.add("correct"); correctName(btn); }
    else {
        btn.classList.add("wrong");
        game.mistakes++;
        game.streak = 0;
        updateLive();
        playSound("wrong");
        $("targetPanel").classList.add("wrong");
        $("targetFeedback").textContent = "✕ WRONG";
        $("targetFeedback").style.color = "var(--red)";
        setTimeout(() => btn.classList.remove("wrong"), 500);
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => {
            if (!game.running) return;
            $("targetPanel").classList.remove("wrong");
            $("targetFeedback").textContent = "";
        }, 500);
    }
}

function handleColorChoice(val, btn) {
    if (!game.running || game.paused || !game.target) return;
    const isLight = isLightSquare(game.target);
    const correct = (val === "light" && isLight) || (val === "dark" && !isLight);
    if (correct) { btn.classList.add("correct"); correctColor(btn); }
    else {
        btn.classList.add("wrong");
        game.mistakes++;
        game.streak = 0;
        updateLive();
        playSound("wrong");
        $("targetPanel").classList.add("wrong");
        $("targetFeedback").textContent = "✕ WRONG";
        $("targetFeedback").style.color = "var(--red)";
        setTimeout(() => btn.classList.remove("wrong"), 500);
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => {
            if (!game.running) return;
            $("targetPanel").classList.remove("wrong");
            $("targetFeedback").textContent = "";
        }, 500);
    }
}

function onCorrectBase() {
    recordReaction();
    game.correct++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);
    updateLive();
    updateDashboard();
    bumpDaily(1);
    save(KEYS.stats, stats);
    playSound("correct");
    if (game.streak > 0 && game.streak % 5 === 0) toast(game.streak + " in a row!");
}

function correctFind(sq) {
    onCorrectBase();
    clearHighlights();
    sq.classList.add("last-correct");
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("correct");
        genTarget();
    }, 320);
}

function correctName(btn) {
    onCorrectBase();
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    setTimeout(() => btn.classList.remove("correct"), 400);
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("correct");
        genTarget();
    }, 480);
}

function correctColor(btn) {
    onCorrectBase();
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    setTimeout(() => btn.classList.remove("correct"), 400);
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("correct");
        genTarget();
    }, 420);
}

function correctKnight(coord, sq) {
    game.knightFound.push(coord);
    game.knightRemaining = game.knightRemaining.filter(c => c !== coord);
    sq.classList.add("knight-found");
    game.correct++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);
    updateLive();
    updateDashboard();
    bumpDaily(1);
    save(KEYS.stats, stats);

    if (game.knightRemaining.length === 0) {
        recordReaction();
        $("targetPanel").classList.add("correct");
        $("targetFeedback").textContent = "✓ ALL JUMPS FOUND";
        $("targetFeedback").style.color = "var(--green)";
        $("targetHint").textContent = "Next knight coming...";
        playSound("correct");
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => {
            if (!game.running) return;
            $("targetPanel").classList.remove("correct");
            genTarget();
        }, 480);
    } else {
        playSound("correct");
        $("targetHint").textContent =
            game.knightFound.length + " / " +
            (game.knightFound.length + game.knightRemaining.length) + " jumps found.";
    }
}

function wrongSquare(sq) {
    game.mistakes++;
    stats.totalMistakes++;
    game.streak = 0;
    clearHighlights();
    if (game.mode === "knight" && game.knightSource) {
        hl(game.knightSource, "knight-source");
        game.knightFound.forEach(c => hl(c, "knight-found"));
    }
    sq.classList.add("last-wrong");
    $("targetPanel").classList.add("wrong");
    $("targetFeedback").textContent = "✕ TRY AGAIN";
    $("targetFeedback").style.color = "var(--red)";

    if (game.mode === "square" || game.mode === "blindfold") {
        if (isDualMode()) {
            const view = game.dualStep === 0 ? "white" : "black";
            $("targetHint").textContent = "That was " + sq.dataset.square + ". Find " + game.target + " from the " + view + " view.";
        } else {
            $("targetHint").textContent = "That was " + sq.dataset.square + ". Find " + game.target + ".";
        }
    } else if (game.mode === "knight") {
        $("targetHint").textContent = sq.dataset.square + " is not a legal jump. Keep looking.";
    }

    updateLive();
    playSound("wrong");

    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("wrong");
        $("targetFeedback").textContent = "";
        if (game.mode === "square" || game.mode === "blindfold") {
            if (isDualMode()) {
                const view = game.dualStep === 0 ? "white" : "black";
                $("targetHint").textContent = "Find " + game.target + " from the " + view + " view.";
            } else {
                $("targetHint").textContent = "Try again — find the correct square.";
            }
            clearHighlights();
        } else if (game.mode === "knight") {
            $("targetHint").textContent =
                game.knightFound.length + " / " +
                (game.knightFound.length + game.knightRemaining.length) + " jumps found.";
            sq.classList.remove("last-wrong");
        }
    }, 520);
}

/* ======================================================
   TIMER + PROGRESS
====================================================== */
function fmtTime(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
}
function updateTimer() {
    $("timerDisplay").textContent = fmtTime(game.timeLeft);
    $("timerDisplay").style.color =
        game.timeLeft <= 10 && game.running && !game.paused ? "var(--red)" : "var(--gold)";
}
function updateProgress() {
    const elapsed = game.duration - game.timeLeft;
    const pct = Math.min(100, Math.max(0, (elapsed / game.duration) * 100));
    $("progressFill").style.width = pct + "%";
    $("progressText").textContent = Math.round(pct) + "%";
}
function accuracy() {
    const attempts = game.correct + game.mistakes;
    if (attempts === 0) return 100;
    return Math.round((game.correct / attempts) * 100);
}
function updateLive() {
    $("sessionCorrect").textContent = String(game.correct).padStart(2, "0");
    $("sessionAccuracy").innerHTML = accuracy() + "<small>%</small>";
    $("sessionAccuracy").style.color = accuracy() >= 80 ? "var(--green)" : "var(--gold)";
    $("sessionStreak").textContent = String(game.streak).padStart(2, "0");
}
function updateDashboard() {
    $("statStreak").textContent = stats.bestStreak || 0;
    $("statBest").textContent = stats.personalBest || 0;
    $("statSessions").textContent = stats.totalSessions || 0;
    const totalAtt = stats.totalCorrect + (stats.totalMistakes || 0);
    $("statAccuracy").textContent = totalAtt > 0 ? Math.round(stats.totalCorrect / totalAtt * 100) + "%" : "—";
    $("totalCorrect").textContent = stats.totalCorrect || 0;
    $("bestStreak").textContent = stats.bestStreak || 0;
    $("personalBest").textContent = stats.personalBest || 0;
    $("totalSessions").textContent = stats.totalSessions || 0;
    $("sidebarBest").textContent = stats.personalBest || 0;
}

/* ======================================================
   XP / LEVEL
====================================================== */
function levelInfo(x) {
    const level = Math.floor(x / 250) + 1;
    const into = x - (level - 1) * 250;
    return { level, into, toNext: 250 - into, progress: into / 250 };
}
function levelTitle(l) {
    if (l >= 20) return "Grandmaster";
    if (l >= 15) return "Master";
    if (l >= 10) return "Strategist";
    if (l >= 7) return "Tactician";
    if (l >= 4) return "Apprentice";
    return "Novice";
}
function updateLevelUI() {
    const info = levelInfo(xp);
    $("levelLabel").textContent = "LEVEL " + info.level;
    $("levelNext").textContent = info.toNext + " XP TO NEXT";
    $("levelBarFill").style.width = (info.progress * 100) + "%";
    $("profileTitle").textContent = levelTitle(info.level);
    $("profileXp").textContent = xp + " XP · Level " + info.level;
}
function addXp(n) { if (n <= 0) return; xp += n; save(KEYS.xp, xp); updateLevelUI(); }

/* ======================================================
   DAILY GOAL
====================================================== */
function updateDailyUI() {
    const pct = Math.min(1, daily.count / DAILY_TARGET);
    const c = 2 * Math.PI * 33;
    $("goalRingFill").style.strokeDashoffset = String(c * (1 - pct));
    $("goalPercent").textContent = Math.round(pct * 100) + "%";
    $("goalCurrent").textContent = daily.count;
    $("goalTarget").textContent = DAILY_TARGET;
    $("sidebarGoalCount").textContent = daily.count;
    $("sidebarGoalTarget").textContent = DAILY_TARGET;
    $("sidebarGoalFill").style.width = (pct * 100) + "%";
}
function bumpDaily(n) {
    if (daily.date !== todayKey()) daily = { date: todayKey(), count: 0 };
    daily.count += n;
    save(KEYS.daily, daily);
    updateDailyUI();
}

/* ======================================================
   ACHIEVEMENTS
====================================================== */
function renderAchievements() {
    const g = $("achievementsGrid");
    if (!g) return;
    g.innerHTML = "";
    ACHIEVEMENTS.forEach(a => {
        const on = unlocked.includes(a.id);
        const el = document.createElement("div");
        el.className = "achievement" + (on ? " unlocked" : "");
        el.innerHTML =
            '<div class="achievement-icon">' + a.icon + '</div>' +
            '<div class="achievement-text"><strong>' + a.title + '</strong><span>' + a.desc + '</span></div>';
        g.appendChild(el);
    });
    const sum = $("achievementSummary");
    if (sum) sum.textContent = unlocked.length + " of " + ACHIEVEMENTS.length + " unlocked";
}
function checkAchievements() {
    const newly = [];
    ACHIEVEMENTS.forEach(a => {
        if (!unlocked.includes(a.id) && a.check(stats)) {
            unlocked.push(a.id);
            newly.push(a);
        }
    });
    if (newly.length) {
        save(KEYS.achievements, unlocked);
        renderAchievements();
        newly.forEach((a, i) => setTimeout(() => {
            toast("✦ Unlocked: " + a.title);
            playSound("achievement");
            fireConfetti(50);
        }, i * 400));
    }
}

/* ======================================================
   CONFETTI
====================================================== */
let confettiRaf = null;
function fireConfetti(count) {
    count = count || 80;
    const canvas = $("confettiCanvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.classList.add("active");

    const colors = ["#3ddc97","#24b47e","#e8b458","#4a9eff","#a78bfa","#ff6b81"];
    const parts = [];
    for (let i = 0; i < count; i++) {
        parts.push({
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
            y: window.innerHeight / 2 - 50,
            vx: (Math.random() - 0.5) * 9,
            vy: Math.random() * -9 - 3,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 0.3,
            life: 0,
            max: 90 + Math.random() * 40
        });
    }
    const grav = 0.28;
    if (confettiRaf) cancelAnimationFrame(confettiRaf);
    function frame() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        let alive = 0;
        parts.forEach(p => {
            if (p.life > p.max) return;
            alive++;
            p.life++;
            p.x += p.vx; p.y += p.vy;
            p.vy += grav;
            p.vx *= 0.995;
            p.rot += p.vrot;
            const a = Math.max(0, 1 - p.life / p.max);
            ctx.save();
            ctx.globalAlpha = a;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
            ctx.restore();
        });
        if (alive > 0) confettiRaf = requestAnimationFrame(frame);
        else {
            cancelAnimationFrame(confettiRaf);
            confettiRaf = null;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            canvas.classList.remove("active");
        }
    }
    frame();
}

/* ======================================================
   SESSION
====================================================== */
function resetSession() {
    clearInterval(game.timer);
    clearTimeout(game.feedbackTimer);
    clearInterval(game.countdownTimer);
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
    game.lastTick = -1;
    game.reactionTimes = [];
    game.questionIndex = 0;
    game.dualStep = 0;
    game.dualTarget = null;

    $("sessionStateText").textContent = "READY";
    $("topStatus").textContent = "READY";
    $("startBtnText").textContent = "Start session";
    $("pauseBtn").textContent = "Pause";
    $("pauseBtn").disabled = true;
    $("pauseOverlay").classList.add("hidden");
    $("countdownOverlay").classList.add("hidden");
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

function startSession() {
    if (game.running) { finishSession(); return; }

    resetSession();
    squareBag.reset();

    if (game.mode === "blindfold") {
        document.body.setAttribute("data-labels", "false");
        document.body.setAttribute("data-coords", "hidden");
    } else {
        document.body.setAttribute("data-labels", load(KEYS.labels, false) ? "true" : "false");
        document.body.setAttribute("data-coords", load(KEYS.coords, true) !== false ? "visible" : "hidden");
    }

    // Pre-decide orientation for the first question
    if (isDualMode()) setBoardFlip(false);
    else applyFlipForQuestion(true);

    // Regenerate pieces for this session if enabled
    if (game.piecesEnabled) generatePieces();

    $("countdownOverlay").classList.remove("hidden");
    let count = 3;
    $("countdownNumber").textContent = count;
    playSound("count");

    clearInterval(game.countdownTimer);
    game.countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
            $("countdownNumber").textContent = count;
            playSound("count");
        } else {
            clearInterval(game.countdownTimer);
            $("countdownOverlay").classList.add("hidden");
            beginPlay();
        }
    }, 800);
}

function beginPlay() {
    game.duration = Number($("durationSelect").value) || 60;
    game.timeLeft = game.duration;
    game.running = true;
    game.paused = false;

    $("sessionStateText").textContent = "LIVE";
    $("topStatus").textContent = "TRAINING LIVE";
    $("startBtnText").textContent = "End session";
    $("pauseBtn").disabled = false;

    enableBoard(game.mode !== "coordinate" && game.mode !== "reverse" && game.mode !== "color");
    genTarget();
    updateLive();
    updateTimer();
    playSound("start");

    clearInterval(game.timer);
    game.timer = setInterval(tick, 1000);

    if (music.panelOpen && !isMusicPlaying()) {
        if (music.source === "stream" && music.ytReady) playStream();
        else if (music.source === "local" && music.localTracks.length) {
            if (!music.audioEl.src) playLocalIdx(music.localIndex);
            else music.audioEl.play().catch(() => {});
        }
    }
}

function tick() {
    if (!game.running || game.paused) return;
    game.timeLeft = Math.max(0, game.timeLeft - 1);
    updateTimer();
    updateProgress();
    if (game.ticks && game.timeLeft <= 10 && game.timeLeft > 0 && game.timeLeft !== game.lastTick) {
        game.lastTick = game.timeLeft;
        playSound("tick");
    }
    if (game.timeLeft === 0) finishSession();
}

function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    if (game.paused) {
        $("pauseOverlay").classList.remove("hidden");
        $("pauseBtn").textContent = "Resume";
        $("sessionStateText").textContent = "PAUSED";
        $("topStatus").textContent = "PAUSED";
        enableBoard(false);
    } else {
        $("pauseOverlay").classList.add("hidden");
        $("pauseBtn").textContent = "Pause";
        $("sessionStateText").textContent = "LIVE";
        $("topStatus").textContent = "TRAINING LIVE";
        enableBoard(game.mode !== "coordinate" && game.mode !== "reverse" && game.mode !== "color");
    }
}

function finishSession() {
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
    $("pauseBtn").textContent = "Pause";
    $("pauseOverlay").classList.add("hidden");
    enableBoard(false);
    $("targetPanel").classList.remove("correct","wrong");
    $("targetHint").textContent = "Session complete! Review your results below.";
    $("targetFeedback").textContent = "";
    $("choiceGrid").classList.add("hidden");
    $("dualIndicator").classList.add("hidden");
    clearHighlights();

    stats.totalSessions++;
    const prevBest = stats.personalBest || 0;
    const newRecord = game.correct > prevBest;
    stats.personalBest = Math.max(prevBest, game.correct);
    stats.bestStreak = Math.max(stats.bestStreak || 0, game.bestStreak);

    const acc = accuracy();
    if (acc === 100 && game.correct >= 15) stats.flawless = (stats.flawless || 0) + 1;

    stats.totalTime = (stats.totalTime || 0) + game.duration;
    stats.totalQuestions = (stats.totalQuestions || 0) + game.correct + game.mistakes;

    let gained = game.correct * 4;
    if (game.bestStreak >= 10) gained += 30;
    if (game.bestStreak >= 20) gained += 40;
    if (game.bestStreak >= 30) gained += 60;
    if (acc === 100 && game.correct >= 15) gained += 60;
    if (newRecord && game.correct > 0) gained += 25;
    if (isDualMode()) gained += Math.round(gained * 0.15); // dual bonus

    addXp(gained);

    const avgRt = game.reactionTimes.length
        ? Math.round(game.reactionTimes.reduce((a, b) => a + b, 0) / game.reactionTimes.length)
        : 0;

    const result = {
        correct: game.correct,
        mistakes: game.mistakes,
        accuracy: acc,
        bestStreak: game.bestStreak,
        duration: game.duration,
        mode: game.mode,
        perspective: game.perspective,
        xp: gained,
        avgReaction: avgRt,
        date: new Date().toISOString()
    };

    history.unshift(result);
    history = history.slice(0, 50);

    save(KEYS.stats, stats);
    save(KEYS.history, history);

    updateDashboard();
    renderHistory();
    renderAnalytics();
    updateLevelUI();
    checkAchievements();
    showResults(newRecord, gained, avgRt);

    playSound("finish");
    if (newRecord && game.correct > 0) fireConfetti(140);
    else if (game.correct >= 20) fireConfetti(80);

    $("resultsPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showResults(newRecord, gained) {
    $("resultCorrect").textContent = game.correct;
    $("resultAccuracy").textContent = accuracy() + "%";
    $("resultStreak").textContent = game.bestStreak;
    $("resultXp").textContent = "+" + gained;

    if (game.correct >= 30) {
        $("resultTitle").textContent = "Outstanding vision!";
        $("resultDescription").textContent = "Elite performance. Keep challenging yourself at this level.";
    } else if (game.correct >= 20) {
        $("resultTitle").textContent = "Excellent session!";
        $("resultDescription").textContent = "Your recognition speed is sharpening fast.";
    } else if (game.correct >= 10) {
        $("resultTitle").textContent = "Good progress!";
        $("resultDescription").textContent = "You are building reliable board vision. Stay consistent.";
    } else if (game.correct > 0) {
        $("resultTitle").textContent = "Well played!";
        $("resultDescription").textContent = "Every correct answer strengthens your vision.";
    } else {
        $("resultTitle").textContent = "Every session counts!";
        $("resultDescription").textContent = "Review the file and rank layout, then try again.";
    }

    $("newRecord").classList.toggle("hidden", !newRecord);
    $("resultsPanel").classList.remove("hidden");
}

/* ======================================================
   VIEW ROUTING
====================================================== */
const VIEW_TITLES = {
    dashboard: ["Home", "Dashboard"],
    training: ["Workspace", "Training"],
    analytics: ["Workspace", "Analytics"],
    achievements: ["Workspace", "Achievements"],
    settings: ["Workspace", "Settings"]
};

function setView(name) {
    if (!VIEW_TITLES[name]) name = "dashboard";
    document.body.dataset.view = name;
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.dataset.view === name));
    document.querySelectorAll(".nav-link").forEach(l => l.classList.toggle("active", l.dataset.nav === name));
    $("breadcrumbParent").textContent = VIEW_TITLES[name][0];
    $("breadcrumbCurrent").textContent = VIEW_TITLES[name][1];
    document.body.classList.remove("sidebar-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "analytics") renderAnalytics();
    if (name === "achievements") renderAchievements();
}

function setupNav() {
    document.querySelectorAll("[data-nav]").forEach(el => {
        el.addEventListener("click", e => {
            e.preventDefault();
            setView(el.dataset.nav);
        });
    });
    $("mobileMenu").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
    document.addEventListener("click", e => {
        if (document.body.classList.contains("sidebar-open") &&
            !e.target.closest(".sidebar") && !e.target.closest("#mobileMenu")) {
            document.body.classList.remove("sidebar-open");
        }
    });
    document.querySelectorAll("[data-action='quick-train']").forEach(el => {
        el.addEventListener("click", () => { setView("training"); setTimeout(() => startSession(), 320); });
    });
    document.querySelectorAll(".mode-card").forEach(el => {
        el.addEventListener("click", () => {
            setMode(el.dataset.mode);
            setView("training");
            setTimeout(() => startSession(), 320);
        });
    });
}

/* ======================================================
   MODE
====================================================== */
function setMode(mode) {
    if (!MODE_INFO[mode]) return;
    if (game.running) { toast("Finish the current session to change mode."); return; }

    game.mode = mode;
    document.querySelectorAll(".mode-btn").forEach(b => {
        const on = b.dataset.mode === mode;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
    });

    $("trainingTitle").textContent = MODE_INFO[mode].label;
    $("trainingSub").textContent = MODE_INFO[mode].sub;

    renderMission();
    resetSession();
}

function renderMission() {
    const steps = MISSION_STEPS[game.mode];
    const c = $("missionSteps");
    c.innerHTML = "";
    steps.forEach((s, i) => {
        const el = document.createElement("div");
        el.className = "mission-step";
        el.innerHTML =
            '<span class="step-number">' + String(i + 1).padStart(2, "0") + '</span>' +
            '<div><strong>' + s.title + '</strong><p>' + s.text + '</p></div>';
        c.appendChild(el);
    });
    $("missionTitle").textContent = MODE_INFO[game.mode].label;
}

/* ======================================================
   THEMES / SETTINGS
====================================================== */
function setTheme(t) {
    if (!["dark","light","neon","heavy"].includes(t)) t = "dark";
    document.body.dataset.theme = t;
    $("appearanceTheme").value = t;
    save(KEYS.theme, t);
}
function setBoardTheme(t) {
    if (!["emerald","walnut","ice","rose","midnight","classic"].includes(t)) t = "emerald";
    document.body.dataset.board = t;
    $("boardTheme").value = t;
    save(KEYS.board, t);
}
function setLabels(on) {
    document.body.dataset.labels = on ? "true" : "false";
    $("labelsToggle").checked = on;
    save(KEYS.labels, on);
}
function setCoords(on) {
    document.body.dataset.coords = on ? "visible" : "hidden";
    $("coordsToggle").checked = on;
    save(KEYS.coords, on);
}
function setBoardSize(pct) {
    const w = $("boardWrapper");
    if (w) w.style.maxWidth = (660 * pct / 100) + "px";
    $("boardSize").value = pct;
    save(KEYS.boardSize, pct);
}

function setupSettings() {
    $("appearanceTheme").addEventListener("change", e => {
        setTheme(e.target.value);
        toast("Theme: " + e.target.options[e.target.selectedIndex].text);
    });
    $("boardTheme").addEventListener("change", e => {
        setBoardTheme(e.target.value);
        toast("Board theme updated.");
    });
    $("boardSize").addEventListener("input", e => setBoardSize(Number(e.target.value)));

    $("labelsToggle").addEventListener("change", e => {
        setLabels(e.target.checked);
        toast(e.target.checked ? "Labels shown." : "Labels hidden.");
    });
    $("coordsToggle").addEventListener("change", e => {
        setCoords(e.target.checked);
        toast(e.target.checked ? "Coordinates shown." : "Coordinates hidden.");
    });

    $("piecesToggle").addEventListener("change", e => {
        setPiecesEnabled(e.target.checked);
        toast(e.target.checked ? "Pieces shown on board." : "Pieces hidden.");
    });

    $("flipToggle").addEventListener("change", e => {
        const on = e.target.checked;
        if (game.running) {
            e.target.checked = document.body.dataset.flip === "true";
            toast("Finish the current session first.");
            return;
        }
        if (game.perspective === "mixed" || game.perspective === "both") {
            e.target.checked = document.body.dataset.flip === "true";
            toast("Flip is controlled by Board View.");
            return;
        }
        setPerspective(on ? "black" : "white");
        toast(on ? "Black view." : "White view.");
    });

    $("soundToggle").addEventListener("change", e => {
        game.sound = e.target.checked;
        save(KEYS.sound, game.sound);
        if (game.sound) playSound("correct");
        toast(game.sound ? "Sound on." : "Sound off.");
    });
    $("volumeRange").addEventListener("input", e => {
        game.volume = Number(e.target.value) / 100;
        save(KEYS.volume, game.volume);
    });
    $("ticksToggle").addEventListener("change", e => {
        game.ticks = e.target.checked;
        save(KEYS.ticks, game.ticks);
        toast(game.ticks ? "Ticks on." : "Ticks off.");
    });
}

/* ======================================================
   ANALYTICS
====================================================== */
function renderAnalytics() {
    const total = stats.totalCorrect || 0;
    const totalAtt = total + (stats.totalMistakes || 0);
    const acc = totalAtt > 0 ? Math.round(total / totalAtt * 100) : 0;

    $("anTotal").textContent = total;
    $("anAccuracy").textContent = totalAtt > 0 ? acc + "%" : "—";

    const validRts = history.filter(h => h.avgReaction > 0);
    const avgRt = validRts.length
        ? Math.round(validRts.reduce((a, h) => a + h.avgReaction, 0) / validRts.length)
        : 0;
    $("anReaction").textContent = avgRt > 0 ? (avgRt / 1000).toFixed(2) + "s" : "—";

    const totalMin = Math.round((stats.totalTime || 0) / 60);
    $("anTime").textContent = totalMin >= 60
        ? Math.floor(totalMin / 60) + "h " + (totalMin % 60) + "m"
        : totalMin + "m";

    renderChartBars("chartCorrect", history.slice(0, 12).reverse().map(h => h.correct));
    renderChartBars("chartAccuracy", history.slice(0, 12).reverse().map(h => h.accuracy), 100);

    const modeCounts = {};
    history.forEach(h => { modeCounts[h.mode] = (modeCounts[h.mode] || 0) + h.correct; });
    const modeArr = Object.entries(modeCounts).map(([k, v]) => ({ label: k.slice(0, 4), val: v }));
    renderModeChart("chartModes", modeArr);

    renderActivityChart();
}

function renderChartBars(id, values, maxOverride) {
    const c = $(id);
    if (!c) return;
    c.innerHTML = "";
    if (!values.length) { c.innerHTML = '<div class="chart-empty">No sessions yet</div>'; return; }
    const max = maxOverride || Math.max(...values, 1);
    values.forEach((v, i) => {
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = Math.max(6, (v / max) * 100) + "%";
        const label = document.createElement("span");
        label.textContent = v;
        bar.appendChild(label);
        bar.style.transitionDelay = (i * 40) + "ms";
        c.appendChild(bar);
    });
}

function renderModeChart(id, arr) {
    const c = $(id);
    if (!c) return;
    c.innerHTML = "";
    if (!arr.length) { c.innerHTML = '<div class="chart-empty">No mode data yet</div>'; return; }
    const max = Math.max(...arr.map(a => a.val), 1);
    arr.forEach((a, i) => {
        const bar = document.createElement("div");
        bar.className = "chart-bar mode-bar";
        bar.style.height = Math.max(6, (a.val / max) * 100) + "%";
        const label = document.createElement("span");
        label.textContent = a.label;
        bar.appendChild(label);
        bar.title = a.label + ": " + a.val;
        bar.style.transitionDelay = (i * 40) + "ms";
        c.appendChild(bar);
    });
}

function renderActivityChart() {
    const c = $("chartActivity");
    if (!c) return;
    c.innerHTML = "";

    const days = {};
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
        days[k] = 0;
    }
    history.forEach(h => {
        const d = new Date(h.date);
        const k = d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
        if (k in days) days[k] += h.correct;
    });
    const entries = Object.entries(days);
    const max = Math.max(...entries.map(e => e[1]), 1);
    entries.forEach(([k, v], i) => {
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = Math.max(5, (v / max) * 100) + "%";
        const label = document.createElement("span");
        label.textContent = k.slice(-2);
        bar.appendChild(label);
        bar.title = k + ": " + v + " correct";
        bar.style.transitionDelay = (i * 30) + "ms";
        c.appendChild(bar);
    });
}

function renderHistory() {
    const list = $("historyList");
    const dash = $("dashboardHistory");
    if (list) list.innerHTML = "";
    if (dash) dash.innerHTML = "";

    if (!history.length) {
        const empty = '<div class="empty-state"><span>♞</span><p>No sessions yet — start training to record your first one.</p></div>';
        if (list) list.innerHTML = empty;
        if (dash) dash.innerHTML = empty;
        return;
    }

    const perspNames = { white: "White", black: "Black", mixed: "Mixed", both: "Both" };

    history.slice(0, 10).forEach((s, i) => {
        const d = new Date(s.date);
        const dateTxt = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const timeTxt = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        const modeLabel = MODE_INFO[s.mode] ? MODE_INFO[s.mode].label : "Training";
        const perspLabel = s.perspective && s.perspective !== "white"
            ? " · " + (perspNames[s.perspective] || s.perspective)
            : "";

        const html =
            '<div class="history-item-icon">♞</div>' +
            '<div class="history-item-info">' +
                '<strong>' + modeLabel + perspLabel + '</strong>' +
                '<span>' + dateTxt + ' · ' + timeTxt + ' · ' + Math.round(s.duration / 60) + 'm</span>' +
            '</div>' +
            '<div class="history-item-score">' +
                '<strong>' + s.correct + '</strong>' +
                '<span>' + s.accuracy + '% accuracy</span>' +
            '</div>';

        const item1 = document.createElement("div");
        item1.className = "history-item";
        item1.innerHTML = html;
        if (list) list.appendChild(item1);

        if (i < 5 && dash) {
            const item2 = document.createElement("div");
            item2.className = "history-item";
            item2.innerHTML = html;
            dash.appendChild(item2);
        }
    });
}

function clearHistory() {
    if (!history.length) { toast("No history to clear."); return; }
    openConfirm(
        "Clear session history?",
        "Your lifetime stats and personal best will remain.",
        () => {
            history = [];
            save(KEYS.history, history);
            renderHistory();
            renderAnalytics();
            toast("Session history cleared.");
        }
    );
}

/* ======================================================
   CONFIRM MODAL
====================================================== */
let confirmCallback = null;
function openConfirm(title, msg, cb) {
    $("confirmTitle").textContent = title;
    $("confirmMessage").textContent = msg;
    confirmCallback = cb;
    $("confirmOverlay").classList.remove("hidden");
}
function closeConfirm() {
    $("confirmOverlay").classList.add("hidden");
    confirmCallback = null;
}

/* ======================================================
   EXPORT / IMPORT / RESET
====================================================== */
function exportData() {
    const payload = {
        version: 3.2,
        exportedAt: new Date().toISOString(),
        stats, history, xp, unlocked, daily,
        settings: {
            theme: document.body.dataset.theme,
            board: document.body.dataset.board,
            perspective: game.perspective,
            flip: document.body.dataset.flip === "true",
            labels: document.body.dataset.labels === "true",
            coords: document.body.dataset.coords !== "hidden",
            pieces: game.piecesEnabled,
            sound: game.sound,
            volume: game.volume,
            ticks: game.ticks,
            boardSize: Number($("boardSize").value),
            musicVolume: music.volume,
            musicTrack: music.streamIndex,
            musicSource: music.source,
            musicWidget: { x: drag.offsetX, y: drag.offsetY }
        }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cvt-backup-" + todayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Backup exported.");
}

function importData(file) {
    const r = new FileReader();
    r.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== "object") throw new Error("Bad file");

            if (data.stats) { stats = { ...DEFAULT_STATS, ...data.stats }; save(KEYS.stats, stats); }
            if (Array.isArray(data.history)) { history = data.history.slice(0, 50); save(KEYS.history, history); }
            if (typeof data.xp === "number") { xp = data.xp; save(KEYS.xp, xp); }
            if (Array.isArray(data.unlocked)) { unlocked = data.unlocked; save(KEYS.achievements, unlocked); }
            if (data.daily && data.daily.date) { daily = data.daily; save(KEYS.daily, daily); }

            if (data.settings) {
                const s = data.settings;
                if (s.theme) setTheme(s.theme);
                if (s.board) setBoardTheme(s.board);
                if (s.perspective) setPerspective(s.perspective);
                else if (typeof s.flip === "boolean") setPerspective(s.flip ? "black" : "white");
                if (typeof s.labels === "boolean") setLabels(s.labels);
                if (typeof s.coords === "boolean") setCoords(s.coords);
                if (typeof s.pieces === "boolean") setPiecesEnabled(s.pieces);
                if (typeof s.sound === "boolean") { game.sound = s.sound; $("soundToggle").checked = s.sound; save(KEYS.sound, s.sound); }
                if (typeof s.volume === "number") { game.volume = s.volume; $("volumeRange").value = Math.round(s.volume * 100); save(KEYS.volume, s.volume); }
                if (typeof s.ticks === "boolean") { game.ticks = s.ticks; $("ticksToggle").checked = s.ticks; save(KEYS.ticks, s.ticks); }
                if (typeof s.boardSize === "number") setBoardSize(s.boardSize);
                if (typeof s.musicVolume === "number") { setMusicVol(s.musicVolume); const el = $("musicVolume"); if (el) el.value = Math.round(s.musicVolume * 100); }
                if (typeof s.musicTrack === "number") setStream(s.musicTrack, false);
                if (typeof s.musicSource === "string") switchSource(s.musicSource);
                if (s.musicWidget) {
                    drag.offsetX = Number(s.musicWidget.x) || 0;
                    drag.offsetY = Number(s.musicWidget.y) || 0;
                    applyWidgetPos();
                    saveWidgetPos();
                }
            }

            updateDashboard();
            updateLevelUI();
            updateDailyUI();
            renderAchievements();
            renderHistory();
            renderAnalytics();
            resetSession();
            toast("Backup imported.");
        } catch (err) {
            console.warn(err);
            toast("Import failed — invalid file.");
        }
    };
    r.readAsText(file);
}

function resetProgress() {
    openConfirm(
        "Reset all progress?",
        "This will permanently delete your stats, history, XP, and achievements.",
        () => {
            stats = { ...DEFAULT_STATS };
            history = [];
            unlocked = [];
            xp = 0;
            daily = { date: todayKey(), count: 0 };
            save(KEYS.stats, stats);
            save(KEYS.history, history);
            save(KEYS.achievements, unlocked);
            save(KEYS.xp, xp);
            save(KEYS.daily, daily);
            updateDashboard();
            updateLevelUI();
            updateDailyUI();
            renderAchievements();
            renderHistory();
            renderAnalytics();
            toast("Progress reset.");
        }
    );
}

/* ======================================================
   KEYBOARD
====================================================== */
function setupKeyboard() {
    document.addEventListener("keydown", e => {
        const t = e.target;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
        const k = e.key.toLowerCase();
        if (k === "r") {
            e.preventDefault();
            if (game.running) finishSession();
            else startSession();
        } else if (e.code === "Space") {
            e.preventDefault();
            if (game.running) togglePause();
            else startSession();
        } else if (k === "f") {
            e.preventDefault();
            toggleFullscreen();
        } else if (k === "m") {
            e.preventDefault();
            togglePanel();
        } else if (e.key === "Escape") {
            document.body.classList.remove("sidebar-open");
            if (game.paused) togglePause();
            else if (game.running) togglePause();
        }
    });
}

async function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
    } catch { toast("Fullscreen unavailable."); }
}

/* ======================================================
   ONBOARDING
====================================================== */
function checkOnboarding() {
    if (!load(KEYS.onboarded, false)) $("onboarding").classList.remove("hidden");
}
function completeOnboarding() {
    save(KEYS.onboarded, true);
    $("onboarding").classList.add("hidden");
    toast("Welcome! Choose a mode to begin.");
}

/* ======================================================
   DAILY TIP
====================================================== */
function setTip() {
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const el = $("tipText");
    if (el) el.textContent = TIPS[day % TIPS.length];
}

/* ======================================================
   INIT
====================================================== */
function init() {
    buildCoords();
    buildBoard();

    setTheme(load(KEYS.theme, "dark"));
    setBoardTheme(load(KEYS.board, "emerald"));
    setLabels(load(KEYS.labels, false));
    setCoords(load(KEYS.coords, true) !== false);
    setBoardSize(Number(load(KEYS.boardSize, 100)) || 100);

    // Pieces (restore before building board state)
    game.piecesEnabled = load(KEYS.pieces, false) === true;
    const pt = $("piecesToggle");
    if (pt) pt.checked = game.piecesEnabled;

    game.sound = load(KEYS.sound, true) !== false;
    $("soundToggle").checked = game.sound;

    game.volume = Number(load(KEYS.volume, 0.6));
    if (isNaN(game.volume)) game.volume = 0.6;
    $("volumeRange").value = Math.round(game.volume * 100);

    game.ticks = load(KEYS.ticks, true) !== false;
    $("ticksToggle").checked = game.ticks;

    $("startBtn").addEventListener("click", startSession);
    $("pauseBtn").addEventListener("click", togglePause);
    $("resumeBtn").addEventListener("click", togglePause);
    $("resultRestart").addEventListener("click", () => {
        startSession();
        $("training").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("durationSelect").addEventListener("change", () => {
        if (game.running) {
            $("durationSelect").value = game.duration;
            toast("Finish the current session first.");
            return;
        }
        resetSession();
    });

    document.querySelectorAll(".mode-btn").forEach(b => {
        b.addEventListener("click", () => setMode(b.dataset.mode));
    });

    // Perspective buttons (Board View)
    document.querySelectorAll(".perspective-btn").forEach(b => {
        b.addEventListener("click", () => {
            if (game.running) { toast("Finish the current session to change view."); return; }
            setPerspective(b.dataset.perspective);
            const labels = {
                white: "White's view",
                black: "Black's view",
                mixed: "Mixed view (flips randomly)",
                both: "Both views (find each square twice)"
            };
            toast("Board view: " + labels[b.dataset.perspective]);
        });
    });

    // Restore perspective setting
    setPerspective(load(KEYS.perspective, "white"));

    // If pieces were enabled, generate them now
    if (game.piecesEnabled) generatePieces();

    setupNav();
    setupSettings();
    setupKeyboard();

    $("confirmCancel").addEventListener("click", closeConfirm);
    $("confirmOk").addEventListener("click", () => {
        const cb = confirmCallback;
        closeConfirm();
        if (cb) cb();
    });

    $("onboardingStart").addEventListener("click", completeOnboarding);
    $("fullscreenBtn").addEventListener("click", toggleFullscreen);

    $("clearHistoryBtn").addEventListener("click", clearHistory);
    $("exportBtn").addEventListener("click", exportData);
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", e => {
        const f = e.target.files && e.target.files[0];
        if (f) importData(f);
        e.target.value = "";
    });
    $("resetBtn").addEventListener("click", resetProgress);

    setupMusic();

    setTip();
    renderMission();
    resetSession();
    updateDashboard();
    updateLevelUI();
    updateDailyUI();
    renderAchievements();
    renderHistory();
    renderAnalytics();

    window.addEventListener("beforeunload", saveMusicPos);

    checkOnboarding();

    console.log("Chess Vision Trainer v3.2 ready.");
}

document.addEventListener("DOMContentLoaded", init);
