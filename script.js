"use strict";

/* ======================================================
   CHESS VISION TRAINER — v3.8 (Mind Palace rebuild game)
====================================================== */

const $ = id => document.getElementById(id);

const KEYS = {
    stats: "cvt-stats-v3", history: "cvt-history-v3", theme: "cvt-theme-v3",
    board: "cvt-board-v3", flip: "cvt-flip-v3", perspective: "cvt-perspective-v3",
    labels: "cvt-labels-v3", coords: "cvt-coords-v3", pieces: "cvt-pieces-v3",
    sound: "cvt-sound-v3", volume: "cvt-volume-v3", ticks: "cvt-ticks-v3",
    boardSize: "cvt-boardsize-v3", achievements: "cvt-achievements-v3",
    daily: "cvt-daily-v3", xp: "cvt-xp-v3", onboarded: "cvt-onboarded-v3",
    preloaderSeen: "cvt-preloader-v1", answerRecords: "cvt-answer-records-v1",
    adaptive: "cvt-adaptive-v1", rating: "cvt-vision-rating-v1",
    dailyChallenge: "cvt-daily-challenge-v1"
};
const MUSIC_KEYS = {
    volume: "cvt-music-vol-v3", track: "cvt-music-track-v3", open: "cvt-music-open-v3",
    source: "cvt-music-src-v3", lastLocal: "cvt-music-last-v3",
    position: "cvt-music-pos-v3", widget: "cvt-music-widget-v3"
};
const MP_KEYS = { stats: "cvt-mp-stats-v2", difficulty: "cvt-mp-diff-v2" };

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
    "Both-view mode is the real test: know every square from both sides.",
    "Auto view trains you to switch perspective instantly.",
    "Mind Palace: see it once, then rebuild it in your mind."
];

const MODE_INFO = {
    square:     { label: "Square Vision",       sub: "Find the coordinate on the board." },
    coordinate: { label: "Coordinate Trainer",  sub: "Name the highlighted square." },
    reverse:    { label: "Reverse Coordinates", sub: "Pick the correct coordinate." },
    knight:     { label: "Knight Vision",       sub: "Find every legal knight jump." },
    blindfold:  { label: "Blindfold Training",  sub: "No coordinates — pure visualization." },
    color:      { label: "Color Recognition",   sub: "Is the square light or dark?" },
    custom:     { label: "Custom Practice",     sub: "Your configuration." },
    daily:      { label: "ChessVision Daily",   sub: "The same seeded challenge for everyone today." },
    mindpalace: { label: "Mind Palace",         sub: "Memorize the position, then rebuild it." }
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
    ],
    mindpalace: [
        { title: "Memorize", text: "A position flashes on the board for a few seconds. Study it." },
        { title: "Rebuild", text: "The board clears. Select pieces from the palette and place them back." },
        { title: "Check", text: "Press Check Position. Every square is validated — correct, wrong, missing, or extra." },
        { title: "Improve", text: "The board reveals the original. Difficulty adapts to your performance." }
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
    totalCorrect: 0, totalMistakes: 0, bestStreak: 0, personalBest: 0,
    totalSessions: 0, flawless: 0, totalTime: 0, totalQuestions: 0
};

const DAILY_TARGET = 50;

/* ---------- Utilities ---------- */
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
            const t = this.pool[i]; this.pool[i] = this.pool[j]; this.pool[j] = t;
        }
    },
    next(exclude) {
        if (!this.pool.length) this.reset();
        if (exclude && this.pool.length > 1 && this.pool[0] === exclude) {
            const j = 1 + Math.floor(Math.random() * (this.pool.length - 1));
            const t = this.pool[0]; this.pool[0] = this.pool[j]; this.pool[j] = t;
        }
        return this.pool.shift();
    }
};
squareBag.reset();

const PIECE_GLYPHS_WHITE = ["♔","♕","♖","♗","♘","♙"];
const PIECE_GLYPHS_BLACK = ["♚","♛","♜","♝","♞","♟"];
const PIECE_COUNT = 10;

/* ======================================================
   MIND PALACE
====================================================== */

const MP_DIFFICULTIES = [
    { id:"beginner",    name:"Beginner",    color:"#3ddc97", piecesMin:1, piecesMax:3,  memorize:8, multiplier:1.0 },
    { id:"focus",       name:"Focus",       color:"#5ea3ff", piecesMin:3, piecesMax:5,  memorize:6, multiplier:1.25 },
    { id:"memory",      name:"Memory",      color:"#a78bfa", piecesMin:5, piecesMax:7,  memorize:5, multiplier:1.5 },
    { id:"blindfold",   name:"Blindfold",   color:"#ff6b81", piecesMin:7, piecesMax:10, memorize:4, multiplier:2.0 },
    { id:"grandmaster", name:"Grandmaster", color:"#e8b458", piecesMin:10, piecesMax:16, memorize:3, multiplier:3.0 }
];

const MP_PIECE_GLYPHS = {
    wK:"♔", wQ:"♕", wR:"♖", wB:"♗", wN:"♘", wP:"♙",
    bK:"♚", bQ:"♛", bR:"♜", bB:"♝", bN:"♞", bP:"♟"
};
const MP_PIECE_NAMES = {
    wK:"White King", wQ:"White Queen", wR:"White Rook", wB:"White Bishop", wN:"White Knight", wP:"White Pawn",
    bK:"Black King", bQ:"Black Queen", bR:"Black Rook", bB:"Black Bishop", bN:"Black Knight", bP:"Black Pawn"
};

const MP_SESSION_ROUNDS = 10;

const mindPalace = {
    running: false,
    phase: "idle",                 // idle | memorize | rebuild | result | complete
    difficultyId: "beginner",
    currentDifficulty: null,
    currentPieceCount: 3,
    roundIndex: 0,
    sessionScore: 0,
    sessionCorrectPieces: 0,
    sessionTotalPieces: 0,
    sessionPerfect: 0,
    sessionStart: 0,
    streak: 0,
    originalPosition: {},
    playerPosition: {},
    actionHistory: [],
    selectedPiece: null,
    memorizeTimer: null,
    memorizeLeft: 0,
    reconstructionStart: 0,
    reconstructionTimer: null,
    reconstructionElapsed: 0,
    lastResult: null,
    perfectStreak: 0,
    failStreak: 0,
    stats: null
};

/* ---------- Persistence ---------- */
function loadMindPalaceStats() {
    const def = {
        bestScore:0, totalSessions:0, totalRounds:0, totalCorrectPieces:0,
        totalPieces:0, bestStreak:0, perfectRounds:0, totalTime:0,
        highestLevel:0, lastScore:0, lastAccuracy:0
    };
    try {
        const s = JSON.parse(localStorage.getItem(MP_KEYS.stats) || "null");
        return s ? { ...def, ...s } : def;
    } catch { return def; }
}
function saveMindPalaceStats() {
    try { localStorage.setItem(MP_KEYS.stats, JSON.stringify(mindPalace.stats)); } catch {}
}
function loadMindPalaceDifficulty() {
    try {
        const d = localStorage.getItem(MP_KEYS.difficulty);
        if (d && MP_DIFFICULTIES.find(x => x.id === d)) return d;
    } catch {}
    return "beginner";
}
function saveMindPalaceDifficulty(id) {
    try { localStorage.setItem(MP_KEYS.difficulty, id); } catch {}
}

/* ---------- Helpers ---------- */
function mpDifficulty(id) { return MP_DIFFICULTIES.find(d => d.id === id) || MP_DIFFICULTIES[0]; }
function mpDifficultyForCount(count) {
    for (const d of MP_DIFFICULTIES) if (count >= d.piecesMin && count <= d.piecesMax) return d;
    return count < 2 ? MP_DIFFICULTIES[0] : MP_DIFFICULTIES[MP_DIFFICULTIES.length - 1];
}
function mpGlyph(key) { return MP_PIECE_GLYPHS[key] || "?"; }
function mpName(key)  { return MP_PIECE_NAMES[key]  || "Piece"; }
function mpColor(key) { return key && key[0] === "w" ? "white" : "black"; }
function mpRandomSquare() { return FILES[Math.floor(Math.random()*8)] + RANKS[Math.floor(Math.random()*8)]; }

/* ---------- Position generation ---------- */
function generateMindPalacePosition(count) {
    const pos = {};
    const occupied = new Set();
    const chosen = [];

    // Guarantee sensible composition: at least a white king, add black king if ≥2
    chosen.push("wK");
    if (count >= 2) chosen.push("bK");

    // Build a shuffled pool of the remaining piece types
    const pool = ["wQ","wR","wB","wN","wP","bQ","bR","bB","bN","bP"];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let pi = 0;
    while (chosen.length < count && pi < pool.length) {
        chosen.push(pool[pi++]);
        if (pi === pool.length) {
            // If we still need more pieces, reshuffle and keep going
            pool.sort(() => Math.random() - 0.5);
            pi = 0;
        }
    }

    // Place each piece on a unique square
    for (const pk of chosen) {
        let sq, tries = 0;
        do { sq = mpRandomSquare(); tries++; } while (occupied.has(sq) && tries < 100);
        occupied.add(sq);
        pos[sq] = pk;
    }
    return pos;
}

/* ---------- Rendering MP pieces on the shared chessboard ---------- */
function clearMPPieces() {
    document.querySelectorAll("#chessboard .piece").forEach(p => p.remove());
}
function renderMPPosition(position) {
    clearMPPieces();
    Object.entries(position).forEach(([sq, pk]) => {
        const sqEl = document.querySelector(`.square[data-square="${sq}"]`);
        if (!sqEl) return;
        const el = document.createElement("span");
        el.className = "piece piece-" + mpColor(pk);
        el.textContent = mpGlyph(pk);
        el.setAttribute("aria-hidden", "true");
        sqEl.appendChild(el);
    });
}

/* ---------- UI updaters ---------- */
function updateMindPalaceUI() {
    const s = mindPalace.stats;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    const acc = s.totalPieces > 0 ? Math.round(s.totalCorrectPieces / s.totalPieces * 100) + "%" : "—";
    const avg = s.totalRounds > 0 ? (s.totalTime / s.totalRounds / 1000).toFixed(1) + "s" : "—";
    const lvl = MP_DIFFICULTIES[Math.min(s.highestLevel, MP_DIFFICULTIES.length - 1)].name;
    set("mpBestScore",     s.bestScore);
    set("mpSessions",      s.totalSessions);
    set("mpAccuracy",      acc);
    set("mpBestStreak",    s.bestStreak);
    set("mpPerfect",       s.perfectRounds);
    set("mpTotalRounds",   s.totalRounds);
    set("mpAvgRecall",     avg);
    set("mpHighestLevel",  lvl);
}
function updateMPDifficultyUI() {
    document.querySelectorAll("[data-mp-diff]").forEach(btn => {
        const on = btn.dataset.mpDiff === mindPalace.difficultyId;
        btn.classList.toggle("active", on);
    });
}
function setMindPalaceDifficulty(id) {
    if (!MP_DIFFICULTIES.find(d => d.id === id)) return;
    mindPalace.difficultyId = id;
    saveMindPalaceDifficulty(id);
    updateMPDifficultyUI();
}
function updateMPPhaseUI(badge, message) {
    const b = $("mpPhaseBadge");
    if (b) { b.textContent = badge; b.dataset.phase = badge.toLowerCase(); }
    const m = $("mpStatusLine");
    if (m) m.textContent = message;
    const rn = $("mpRoundNumber");
    if (rn) rn.textContent = `ROUND ${String(mindPalace.roundIndex).padStart(2, "0")} / ${MP_SESSION_ROUNDS}`;
}
function updateMPLiveStats() {
    // Correct = correct pieces across the session
    const c = $("sessionCorrect");
    if (c) c.textContent = String(mindPalace.sessionCorrectPieces).padStart(2, "0");

    const total = mindPalace.sessionTotalPieces;
    const acc = total > 0 ? Math.round(mindPalace.sessionCorrectPieces / total * 100) : 100;
    const a = $("sessionAccuracy");
    if (a) { a.innerHTML = acc + "<small>%</small>"; a.style.color = acc >= 80 ? "var(--green)" : "var(--gold)"; }

    const s = $("sessionStreak");
    if (s) s.textContent = String(mindPalace.streak).padStart(2, "0");

    const v = $("timerDisplay");
    if (v) { v.textContent = mindPalace.sessionScore; v.style.color = "var(--gold)"; }
}
function updateMPProgress() {
    const pct = Math.min(100, Math.round(mindPalace.roundIndex / MP_SESSION_ROUNDS * 100));
    const fill = $("progressFill");
    const txt = $("progressText");
    if (fill) fill.style.width = pct + "%";
    if (txt) txt.textContent = `ROUND ${mindPalace.roundIndex}/${MP_SESSION_ROUNDS}`;
}

/* ---------- Phase transitions ---------- */
function startMindPalaceSession() {
    mindPalace.running = true;
    mindPalace.phase = "idle";
    mindPalace.roundIndex = 0;
    mindPalace.sessionScore = 0;
    mindPalace.sessionCorrectPieces = 0;
    mindPalace.sessionTotalPieces = 0;
    mindPalace.sessionPerfect = 0;
    mindPalace.sessionStart = Date.now();
    mindPalace.streak = 0;
    mindPalace.perfectStreak = 0;
    mindPalace.failStreak = 0;

    // Starting piece count = midpoint of selected difficulty range
    const diff = mpDifficulty(mindPalace.difficultyId);
    mindPalace.currentPieceCount = Math.round((diff.piecesMin + diff.piecesMax) / 2);

    // UI
    $("sessionStateText").textContent = "MIND PALACE";
    $("topStatus").textContent = "MIND PALACE LIVE";
    $("startBtnText").textContent = "End session";
    $("pauseBtn").disabled = true;
    $("mpPanel").classList.remove("hidden");
    $("targetPanel").classList.add("hidden");
    $("mpDifficultyBar").classList.remove("hidden");
    $("perspectiveBar").classList.add("hidden");
    $("resultsPanel").classList.add("hidden");
    $("newRecord").classList.add("hidden");

    document.body.classList.add("mp-active", "mp-phase-memorize");

    clearHighlights();
    clearMPPieces();
    enableBoard(false);
    updateMPLiveStats();
    updateMPProgress();
    playSound("start");

    setTimeout(startMindPalaceRound, 500);
}

function startMindPalaceRound() {
    if (!mindPalace.running) return;
    mindPalace.roundIndex++;
    game.questionAttempts = 0;
    updateMPProgress();

    // Determine difficulty from current piece count
    const diff = mpDifficultyForCount(mindPalace.currentPieceCount);
    mindPalace.currentDifficulty = diff;
    mindPalace.memorizeLeft = diff.memorize;

    // Generate original position
    mindPalace.originalPosition = generateMindPalacePosition(mindPalace.currentPieceCount);
    mindPalace.playerPosition = {};
    mindPalace.actionHistory = [];
    mindPalace.selectedPiece = null;

    enterMemorizePhase();
}

function enterMemorizePhase() {
    mindPalace.phase = "memorize";
    document.body.classList.remove("mp-phase-rebuild", "mp-phase-result");
    document.body.classList.add("mp-phase-memorize");

    // Show original position
    renderMPPosition(mindPalace.originalPosition);
    enableBoard(false);

    // UI
    const diff = mindPalace.currentDifficulty;
    updateMPPhaseUI("MEMORIZE", `Study ${mindPalace.currentPieceCount} piece${mindPalace.currentPieceCount>1?"s":""} · ${diff.name} difficulty`);
    $("mpCountdown").classList.remove("hidden");
    $("mpCountdown").textContent = mindPalace.memorizeLeft;
    $("mpRebuildUI").classList.add("hidden");
    $("mpResults").classList.add("hidden");

    // Clear palette selection
    document.querySelectorAll(".mp-piece-btn").forEach(b => b.classList.remove("active"));

    playSound("tick");

    clearInterval(mindPalace.memorizeTimer);
    mindPalace.memorizeTimer = setInterval(() => {
        if (!mindPalace.running) return;
        mindPalace.memorizeLeft--;
        if (mindPalace.memorizeLeft > 0) {
            $("mpCountdown").textContent = mindPalace.memorizeLeft;
            playSound("tick");
        } else {
            clearInterval(mindPalace.memorizeTimer);
            enterRebuildPhase();
        }
    }, 1000);
}

function enterRebuildPhase() {
    mindPalace.phase = "rebuild";
    document.body.classList.remove("mp-phase-memorize");
    document.body.classList.add("mp-phase-rebuild");

    // Clear pieces from board — player sees empty
    clearMPPieces();
    clearHighlights();

    // Make board clickable
    enableBoard(true);

    // Start reconstruction timer (counts UP)
    mindPalace.reconstructionStart = Date.now();
    mindPalace.reconstructionElapsed = 0;
    const timerEl = $("mpTimer");
    if (timerEl) timerEl.textContent = "0.0s";
    clearInterval(mindPalace.reconstructionTimer);
    mindPalace.reconstructionTimer = setInterval(() => {
        if (!mindPalace.running || mindPalace.phase !== "rebuild") return;
        mindPalace.reconstructionElapsed = (Date.now() - mindPalace.reconstructionStart) / 1000;
        if (timerEl) timerEl.textContent = mindPalace.reconstructionElapsed.toFixed(1) + "s";
    }, 100);

    updateMPPhaseUI("REBUILD", "Place every piece where you remember it.");
    $("mpCountdown").classList.add("hidden");
    $("mpRebuildUI").classList.remove("hidden");
    $("mpResults").classList.add("hidden");

    playSound("start");
}

/* ---------- Board rebuild click handler ---------- */
function handleMindPalaceRebuildClick(coord) {
    if (mindPalace.phase !== "rebuild") return;
    if (!mindPalace.selectedPiece) {
        toast("Select a piece from the palette first.");
        return;
    }

    const sqEl = document.querySelector(`.square[data-square="${coord}"]`);
    if (!sqEl) return;

    if (mindPalace.selectedPiece === "erase") {
        if (!mindPalace.playerPosition[coord]) return;
        const prev = mindPalace.playerPosition[coord];
        delete mindPalace.playerPosition[coord];
        mindPalace.actionHistory.push({ square: coord, prev, next: null });
        const pEl = sqEl.querySelector(".piece");
        if (pEl) pEl.remove();
        playSound("flip");
        return;
    }

    const prev = mindPalace.playerPosition[coord] || null;
    const next = mindPalace.selectedPiece;
    if (prev === next) return;

    mindPalace.playerPosition[coord] = next;
    mindPalace.actionHistory.push({ square: coord, prev, next });

    // Update DOM
    const existing = sqEl.querySelector(".piece");
    if (existing) existing.remove();
    const el = document.createElement("span");
    el.className = "piece piece-" + mpColor(next);
    el.textContent = mpGlyph(next);
    el.setAttribute("aria-hidden", "true");
    sqEl.appendChild(el);

    playSound("correct");
}

function eraseMindPalacePiece(coord) {
    if (mindPalace.phase !== "rebuild") return;
    if (!mindPalace.playerPosition[coord]) return;
    const sqEl = document.querySelector(`.square[data-square="${coord}"]`);
    const prev = mindPalace.playerPosition[coord];
    delete mindPalace.playerPosition[coord];
    mindPalace.actionHistory.push({ square: coord, prev, next: null });
    const pEl = sqEl && sqEl.querySelector(".piece");
    if (pEl) pEl.remove();
    playSound("flip");
}

function undoMindPalaceAction() {
    if (mindPalace.phase !== "rebuild") return;
    const action = mindPalace.actionHistory.pop();
    if (!action) { toast("Nothing to undo."); return; }

    const sqEl = document.querySelector(`.square[data-square="${action.square}"]`);
    if (!sqEl) return;

    // Remove existing piece
    const existing = sqEl.querySelector(".piece");
    if (existing) existing.remove();

    if (action.prev) {
        mindPalace.playerPosition[action.square] = action.prev;
        const el = document.createElement("span");
        el.className = "piece piece-" + mpColor(action.prev);
        el.textContent = mpGlyph(action.prev);
        el.setAttribute("aria-hidden", "true");
        sqEl.appendChild(el);
    } else {
        delete mindPalace.playerPosition[action.square];
    }
    playSound("flip");
}

function clearMindPalacePlayer() {
    if (mindPalace.phase !== "rebuild") return;
    mindPalace.playerPosition = {};
    mindPalace.actionHistory = [];
    clearMPPieces();
    playSound("flip");
}

/* ---------- Check & validate ---------- */
function checkMindPalacePosition() {
    if (mindPalace.phase !== "rebuild") return;
    clearInterval(mindPalace.reconstructionTimer);

    const reconstructionTime = (Date.now() - mindPalace.reconstructionStart) / 1000;

    const original = mindPalace.originalPosition;
    const player   = mindPalace.playerPosition;

    const correct = [];
    const wrong   = [];
    const missing = [];
    const extra   = [];

    Object.entries(original).forEach(([sq, pk]) => {
        const got = player[sq];
        if (!got) { missing.push({ square: sq, piece: pk }); recordAnswer(sq, false, reconstructionTime * 1000); }
        else if (got === pk) { correct.push({ square: sq, piece: pk }); recordAnswer(sq, true, reconstructionTime * 1000); }
        else { wrong.push({ square: sq, expected: pk, got }); recordAnswer(sq, false, reconstructionTime * 1000); }
    });

    Object.entries(player).forEach(([sq, pk]) => {
        if (!original[sq]) { extra.push({ square: sq, piece: pk }); recordAnswer(sq, false, reconstructionTime * 1000); }
    });

    const total = Object.keys(original).length;
    const correctCount = correct.length;
    const isPerfect = correctCount === total && extra.length === 0 && wrong.length === 0;

    // Score
    const diff = mindPalace.currentDifficulty;
    let score = Math.round(correctCount * 20 * diff.multiplier);
    if (isPerfect) score += 50;
    if (reconstructionTime < 15) score += 10;
    else if (reconstructionTime < 30) score += 5;

    mindPalace.sessionScore += score;
    mindPalace.sessionCorrectPieces += correctCount;
    mindPalace.sessionTotalPieces += total;
    if (isPerfect) mindPalace.sessionPerfect++;

    // Streak
    if (isPerfect) mindPalace.streak++;
    else mindPalace.streak = 0;
    mindPalace.stats.bestStreak = Math.max(mindPalace.stats.bestStreak, mindPalace.streak);

    // Stats
    mindPalace.stats.totalRounds++;
    mindPalace.stats.totalCorrectPieces += correctCount;
    mindPalace.stats.totalPieces += total;
    mindPalace.stats.totalTime += reconstructionTime * 1000;
    mindPalace.stats.highestLevel = Math.max(mindPalace.stats.highestLevel, MP_DIFFICULTIES.indexOf(diff));
    if (isPerfect) mindPalace.stats.perfectRounds++;
    saveMindPalaceStats();

    // Adaptive difficulty
    if (isPerfect) {
        mindPalace.perfectStreak++;
        mindPalace.failStreak = 0;
        if (mindPalace.perfectStreak >= 2 && mindPalace.currentPieceCount < 16) {
            mindPalace.currentPieceCount++;
            mindPalace.perfectStreak = 0;
        }
    } else {
        mindPalace.perfectStreak = 0;
        mindPalace.failStreak++;
        if (mindPalace.failStreak >= 2 && mindPalace.currentPieceCount > 1) {
            mindPalace.currentPieceCount--;
            mindPalace.failStreak = 0;
        }
    }

    mindPalace.lastResult = {
        correct, wrong, missing, extra, isPerfect,
        reconstructionTime, total, correctCount,
        score
    };

    showMindPalaceResults();
    updateMPLiveStats();
}

function showMindPalaceResults() {
    mindPalace.phase = "result";
    document.body.classList.remove("mp-phase-rebuild");
    document.body.classList.add("mp-phase-result");

    const r = mindPalace.lastResult;

    // Show original position with highlights
    clearHighlights();
    renderMPPosition(mindPalace.originalPosition);

    // Mark correct / wrong / missing on the original position
    Object.entries(mindPalace.originalPosition).forEach(([sq, pk]) => {
        const sqEl = document.querySelector(`.square[data-square="${sq}"]`);
        if (!sqEl) return;
        const got = mindPalace.playerPosition[sq];
        if (got === pk) sqEl.classList.add("mp-correct-pick");
        else if (got) sqEl.classList.add("mp-user-pick");
        else sqEl.classList.add("mp-missing-pick");
    });
    // Mark extra pieces
    Object.entries(mindPalace.playerPosition).forEach(([sq, pk]) => {
        if (!mindPalace.originalPosition[sq]) {
            const sqEl = document.querySelector(`.square[data-square="${sq}"]`);
            if (sqEl) sqEl.classList.add("mp-extra-pick");
        }
    });

    // Phase UI
    updateMPPhaseUI("RESULT", r.isPerfect ? "Perfect memory!" : "Position complete.");

    // Results panel
    const pct = r.total > 0 ? Math.round(r.correctCount / r.total * 100) : 0;
    const titleEl = $("mpResultsTitle");
    titleEl.textContent = r.isPerfect ? "PERFECT MEMORY! 🔥" : "POSITION COMPLETE";
    titleEl.classList.toggle("perfect", r.isPerfect);

    $("mpResultsScore").textContent = `${r.correctCount} / ${r.total} pieces`;
    $("mpResultsAccuracy").textContent = `${pct}% accuracy`;
    $("mpResultsVision").textContent = `+${r.score} Vision · ${r.reconstructionTime.toFixed(1)}s`;

    const list = $("mpResultsList");
    list.innerHTML = "";
    r.correct.forEach(c => {
        list.innerHTML += `<div class="mp-result-row mp-result-correct">✓ ${mpName(c.piece)} — ${c.square}</div>`;
    });
    r.wrong.forEach(w => {
        list.innerHTML += `<div class="mp-result-row mp-result-wrong">✗ ${mpName(w.expected)} — correct: ${w.square} | you placed: ${mpName(w.got)}</div>`;
    });
    r.missing.forEach(m => {
        list.innerHTML += `<div class="mp-result-row mp-result-missing">⚠ ${mpName(m.piece)} — missing (was at ${m.square})</div>`;
    });
    r.extra.forEach(e => {
        list.innerHTML += `<div class="mp-result-row mp-result-extra">✗ Extra: ${mpName(e.piece)} at ${e.square}</div>`;
    });

    $("mpCountdown").classList.add("hidden");
    $("mpRebuildUI").classList.add("hidden");
    $("mpResults").classList.remove("hidden");
    enableBoard(false);

    // Sound & celebration
    if (r.isPerfect) { playSound("finish"); fireConfetti(80); }
    else playSound("wrong");
}

/* ---------- Next round / End session ---------- */
function nextMindPalaceRound() {
    if (!mindPalace.running) return;
    if (mindPalace.roundIndex >= MP_SESSION_ROUNDS) {
        endMindPalaceSession();
    } else {
        startMindPalaceRound();
    }
}

function endMindPalaceSession() {
    if (!mindPalace.running && mindPalace.phase !== "result") return;
    mindPalace.running = false;
    mindPalace.phase = "complete";

    clearInterval(mindPalace.memorizeTimer);
    clearInterval(mindPalace.reconstructionTimer);

    document.body.classList.remove("mp-active", "mp-phase-memorize", "mp-phase-rebuild", "mp-phase-result");
    clearMPPieces();
    clearHighlights();
    enableBoard(false);

    // Save stats
    const s = mindPalace.stats;
    s.totalSessions++;
    s.bestScore = Math.max(s.bestScore, mindPalace.sessionScore);
    s.lastScore = mindPalace.sessionScore;
    const acc = mindPalace.sessionTotalPieces > 0
        ? Math.round(mindPalace.sessionCorrectPieces / mindPalace.sessionTotalPieces * 100)
        : 0;
    s.lastAccuracy = acc;
    saveMindPalaceStats();

    // XP
    const xpGained = Math.max(20, Math.round(mindPalace.sessionScore / 4));
    addXp(xpGained);

    // History
    const duration = Math.round((Date.now() - mindPalace.sessionStart) / 1000);
    const result = {
        correct: mindPalace.sessionCorrectPieces,
        mistakes: mindPalace.sessionTotalPieces - mindPalace.sessionCorrectPieces,
        accuracy: acc,
        bestStreak: mindPalace.stats.bestStreak,
        duration,
        mode: "mindpalace",
        perspective: "white",
        xp: xpGained,
        visionScore: mindPalace.sessionScore,
        date: new Date().toISOString()
    };
    history.unshift(result);
    history = history.slice(0, 50);
    save(KEYS.history, history);
    renderHistory();
    renderAnalytics();

    // Show summary
    updateMPPhaseUI("COMPLETE", "Session finished.");
    const rn = $("mpRoundNumber");
    if (rn) rn.textContent = `FINAL · ${mindPalace.sessionScore} VISION`;

    // Fill results with session summary
    const titleEl = $("mpResultsTitle");
    titleEl.textContent = "🧠 SESSION COMPLETE";
    titleEl.classList.remove("perfect");
    $("mpResultsScore").textContent = `${mindPalace.sessionScore} Vision`;
    $("mpResultsAccuracy").textContent = `${acc}% accuracy`;
    $("mpResultsVision").textContent = `+${xpGained} XP · ${mindPalace.sessionPerfect}/${mindPalace.roundIndex} perfect`;
    const list = $("mpResultsList");
    list.innerHTML =
        `<div class="mp-result-row mp-result-correct">✓ ${mindPalace.sessionCorrectPieces} correct pieces across ${mindPalace.roundIndex} rounds</div>` +
        `<div class="mp-result-row mp-result-correct">✓ Best streak: ${mindPalace.stats.bestStreak}</div>` +
        `<div class="mp-result-row mp-result-correct">✓ Perfect rounds: ${mindPalace.sessionPerfect}</div>`;
    $("mpResults").classList.remove("hidden");
    $("mpRebuildUI").classList.add("hidden");
    $("mpCountdown").classList.add("hidden");

    const nextBtn = $("mpNextBtn");
    if (nextBtn) nextBtn.textContent = "Train again";

    $("sessionStateText").textContent = "COMPLETE";
    $("topStatus").textContent = "MIND PALACE COMPLETE";
    $("startBtnText").textContent = "Play again";

    updateMindPalaceUI();
    playSound("finish");
    if (mindPalace.sessionScore > 0) fireConfetti(120);
}

function abortMindPalaceSession() {
    if (!mindPalace.running && mindPalace.phase === "idle") return;
    mindPalace.running = false;
    mindPalace.phase = "idle";
    clearInterval(mindPalace.memorizeTimer);
    clearInterval(mindPalace.reconstructionTimer);
    document.body.classList.remove("mp-active", "mp-phase-memorize", "mp-phase-rebuild", "mp-phase-result");
    clearMPPieces();
    clearHighlights();
    enableBoard(false);
}

/* ---------- Init MP ---------- */
function initMindPalace() {
    mindPalace.stats = loadMindPalaceStats();
    mindPalace.difficultyId = loadMindPalaceDifficulty();

    // Difficulty buttons (both start view and training view)
    document.querySelectorAll("[data-mp-diff]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (mindPalace.running) { toast("Finish the current session to change difficulty."); return; }
            setMindPalaceDifficulty(btn.dataset.mpDiff);
            const d = mpDifficulty(btn.dataset.mpDiff);
            toast(`Difficulty: ${d.name}`);
        });
    });

    // Start view button
    const startBtn = $("mpStartBtn");
    if (startBtn) startBtn.addEventListener("click", () => {
        setView("training");
        setMode("mindpalace");
        setTimeout(() => startSession(), 320);
    });

    // Piece palette
    document.querySelectorAll(".mp-piece-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (mindPalace.phase !== "rebuild") return;
            if (btn.dataset.tool === "erase") {
                mindPalace.selectedPiece = "erase";
            } else if (btn.dataset.color && btn.dataset.type) {
                const letter = { king:"K", queen:"Q", rook:"R", bishop:"B", knight:"N", pawn:"P" }[btn.dataset.type];
                const prefix = btn.dataset.color === "white" ? "w" : "b";
                mindPalace.selectedPiece = prefix + letter;
            }
            document.querySelectorAll(".mp-piece-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Undo / Clear / Check buttons
    const undoBtn = $("mpUndoBtn");
    if (undoBtn) undoBtn.addEventListener("click", undoMindPalaceAction);
    const clearBtn = $("mpClearBtn");
    if (clearBtn) clearBtn.addEventListener("click", clearMindPalacePlayer);
    const checkBtn = $("mpCheckBtn");
    if (checkBtn) checkBtn.addEventListener("click", checkMindPalacePosition);
    const nextBtn = $("mpNextBtn");
    if (nextBtn) nextBtn.addEventListener("click", () => {
        if (mindPalace.phase === "complete") {
            mindPalace.phase = "idle";
            startMindPalaceSession();
        } else {
            nextMindPalaceRound();
        }
    });

    updateMPDifficultyUI();
    updateMindPalaceUI();
}

/* ======================================================
   MUSIC
====================================================== */
const MUSIC_STREAM = [
    { id:"jfKfPfyJRdk", name:"Lofi Girl · Beats to Relax" },
    { id:"4xDzrJKXOOY", name:"Synthwave Radio · Retro Chill" },
    { id:"lTRiuFIWV54", name:"Lofi Hip Hop · Study Beats" },
    { id:"5yx6BWlEVcY", name:"Chillhop Essentials" },
    { id:"n61ULEU7CO0", name:"Lofi Beats · Deep Focus" },
    { id:"7NOSDKb0HlU", name:"Coffee Shop Radio" },
    { id:"0vv7VcHVWSE", name:"Jazz Lofi · Smooth Grooves" }
];
const IDB_NAME = "cvt-music-db", IDB_STORE = "tracks", IDB_VERSION = 1;

/* Storage helpers */
function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn("Save failed:", e); }
}
function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function dailyDateKey() {
    const d = new Date();
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth()+1).padStart(2,"0") + "-" + String(d.getUTCDate()).padStart(2,"0");
}
function dailyChallengeNumber(dateKey) {
    const start = Date.UTC(2026, 0, 1);
    const current = Date.parse(dateKey + "T00:00:00Z");
    return Math.max(1, Math.floor((current - start) / 86400000) + 1);
}
function dailySeed(dateKey) {
    let seed = 2166136261;
    for (const char of dateKey) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
    return seed >>> 0;
}
function dailyRandom(seed) {
    return function () {
        seed += 0x6D2B79F5;
        let t = seed;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function buildDailySequence(dateKey) {
    const random = dailyRandom(dailySeed(dateKey));
    const squares = [];
    const pool = [];
    for (const file of FILES) for (const rank of RANKS) pool.push(file + rank);
    while (squares.length < 20 && pool.length) {
        const index = Math.floor(random() * pool.length);
        squares.push(pool.splice(index, 1)[0]);
    }
    return squares;
}
function dailyStateFor(dateKey) {
    if (!dailyChallenge || dailyChallenge.date !== dateKey) {
        dailyChallenge = { date: dateKey, attempts: [], streak: 0, lastCompletedDate: null };
        save(KEYS.dailyChallenge, dailyChallenge);
    }
    return dailyChallenge;
}
function dailyOfficialAttempt() {
    return dailyStateFor(dailyDateKey()).attempts.find(attempt => attempt.official) || null;
}

let stats = { ...DEFAULT_STATS, ...(load(KEYS.stats, {}) || {}) };
let history = load(KEYS.history, []);
if (!Array.isArray(history)) history = [];
let answerRecords = load(KEYS.answerRecords, []);
if (!Array.isArray(answerRecords)) answerRecords = [];
let adaptiveEnabled = load(KEYS.adaptive, false) === true;
let visionRating = load(KEYS.rating, null);
if (!visionRating || typeof visionRating !== "object") visionRating = { current: 1000, history: [] };
visionRating.current = Number.isFinite(Number(visionRating.current)) ? Math.round(Number(visionRating.current)) : 1000;
visionRating.history = Array.isArray(visionRating.history) ? visionRating.history : [];
let unlocked = load(KEYS.achievements, []);
if (!Array.isArray(unlocked)) unlocked = [];
let xp = Number(load(KEYS.xp, 0)) || 0;
let daily = load(KEYS.daily, null);
if (!daily || daily.date !== todayKey()) { daily = { date: todayKey(), count: 0 }; save(KEYS.daily, daily); }
let dailyChallenge = load(KEYS.dailyChallenge, null);
if (!dailyChallenge || typeof dailyChallenge !== "object" || !Array.isArray(dailyChallenge.attempts)) {
    dailyChallenge = { date: dailyDateKey(), attempts: [], streak: 0, lastCompletedDate: null };
}
dailyStateFor(dailyDateKey());

const game = {
    mode: "square", perspective: "white", autoSide: null,
    dualActive: false, dualStep: 0, dualTarget: null,
    piecesEnabled: false, pieces: {},
    running: false, paused: false, completed: false,
    duration: 60, timeLeft: 60,
    correct: 0, mistakes: 0, streak: 0, bestStreak: 0,
    target: null, knightSource: null, knightRemaining: [], knightFound: [],
    questionIndex: 0, questionStartTime: 0, questionAttempts: 0, reactionTimes: [], adaptiveRecentSquares: [],
    timer: null, feedbackTimer: null, toastTimer: null, countdownTimer: null,
    sound: true, volume: 0.6, ticks: true, lastTick: -1,
    dailyActive: false, dailyPractice: false, dailySequence: [], dailyStart: 0
};

let audioContext = null;

/* Preloader */
const PIECE_LAYOUT = [
    { r:0, c:0, glyph:"♜", color:"black" }, { r:0, c:3, glyph:"♜", color:"black" },
    { r:1, c:1, glyph:"♟", color:"black" }, { r:1, c:2, glyph:"♟", color:"black" },
    { r:2, c:1, glyph:"♙", color:"white" }, { r:2, c:2, glyph:"♙", color:"white" },
    { r:3, c:0, glyph:"♖", color:"white" }, { r:3, c:3, glyph:"♖", color:"white" }
];
function runPreloader() {
    const el = $("preloader"); if (!el) return;
    document.body.classList.add("preloading");
    document.documentElement.style.overflow = "hidden";
    const grid = $("preloaderGrid"), line = $("preloaderLine"), sub = $("preloaderSub");
    const barFill = $("preloaderBarFill"), percentEl = $("preloaderPercent");
    if (grid) {
        grid.innerHTML = "";
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            const sq = document.createElement("div");
            sq.className = "preloader-square " + ((r + c) % 2 === 0 ? "light" : "dark");
            grid.appendChild(sq);
        }
    }
    let done = false; const timers = [];
    function finish() {
        if (done) return; done = true; timers.forEach(clearTimeout);
        el.classList.add("done");
        document.body.classList.remove("preloading");
        document.documentElement.style.overflow = "";
        try { sessionStorage.setItem(KEYS.preloaderSeen, "1"); } catch {}
        setTimeout(() => { el.style.display = "none"; el.setAttribute("aria-hidden", "true"); }, 700);
    }
    el.addEventListener("click", () => {
        if (done) return; timers.forEach(clearTimeout);
        if (percentEl) percentEl.textContent = "100";
        if (barFill) barFill.style.width = "100%";
        if (line) line.classList.add("show");
        if (sub) sub.classList.add("show");
        setTimeout(finish, 350);
    }, { once: true });
    PIECE_LAYOUT.forEach((p, i) => {
        timers.push(setTimeout(() => {
            if (done || !grid) return;
            const sq = grid.children[p.r * 4 + p.c]; if (!sq) return;
            const piece = document.createElement("span");
            piece.className = "preloader-piece " + p.color;
            piece.textContent = p.glyph;
            sq.appendChild(piece);
        }, 140 + i * 200));
    });
    const piecesDone = 140 + PIECE_LAYOUT.length * 200 + 300;
    timers.push(setTimeout(() => { if (!done) { if (line) line.classList.add("show"); if (sub) sub.classList.add("show"); } }, piecesDone));
    timers.push(setTimeout(() => { if (!done) { if (line) line.classList.add("flash"); if (sub) sub.classList.add("flash"); } }, piecesDone + 500));
    timers.push(setTimeout(() => {
        if (done) return;
        if (line) line.classList.remove("flash"); if (sub) sub.classList.remove("flash");
        let n = 0;
        function step() {
            if (done) return;
            n++; if (n > 100) n = 100;
            if (percentEl) percentEl.textContent = String(n);
            if (barFill) barFill.style.width = n + "%";
            if (n < 100) timers.push(setTimeout(step, 14 + Math.pow(n/100, 3) * 48));
            else timers.push(setTimeout(finish, 2000));
        }
        step();
    }, piecesDone + 500 + 1650));
    timers.push(setTimeout(finish, 12000));
}

/* Sound */
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
        let freqs = [660, 880], dur = 0.18;
        if (type === "wrong") { freqs = [220, 180]; dur = 0.2; }
        else if (type === "finish") { freqs = [523, 659, 784, 1046]; dur = 0.55; }
        else if (type === "tick") { freqs = [880]; dur = 0.06; }
        else if (type === "achievement") { freqs = [784, 988, 1318]; dur = 0.5; }
        else if (type === "start") { freqs = [440, 660]; dur = 0.2; }
        else if (type === "count") { freqs = [523]; dur = 0.12; }
        else if (type === "flip") { freqs = [587, 784]; dur = 0.18; }
        else if (type === "side") { freqs = [784, 1046]; dur = 0.16; }
        freqs.forEach((f, i) => {
            const osc = audioContext.createOscillator();
            const g = audioContext.createGain();
            osc.connect(g); g.connect(master); osc.type = "sine";
            const startAt = now + i * 0.06;
            const endAt = startAt + dur / freqs.length + 0.05;
            osc.frequency.setValueAtTime(f, startAt);
            g.gain.setValueAtTime(0.0001, startAt);
            g.gain.exponentialRampToValueAtTime(Math.max(0.02, 0.12 * vol), startAt + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, endAt);
            osc.start(startAt); osc.stop(endAt + 0.03);
        });
    } catch (e) { console.warn("Audio:", e); }
}

function toast(msg) {
    const el = $("toastMessage"); if (el) el.textContent = msg;
    const t = $("toast"); if (!t) return;
    t.classList.add("show");
    clearTimeout(game.toastTimer);
    game.toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* IndexedDB music helpers */
function openDb() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) return reject(new Error("No IndexedDB"));
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath:"id" });
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
        const id = "t-" + Date.now() + "-" + Math.random().toString(36).slice(2,7);
        const rec = { id, name: file.name.replace(/\.[^.]+$/, "").slice(0,80) || "Track",
            type: file.type || "audio/mpeg", size: file.size, addedAt: Date.now(), blob: file };
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

/* Music player */
const music = {
    yt:null, ytReady:false, ytApiLoaded:false,
    streamPlaying:false, streamIndex:0,
    localTracks:[], localIndex:0, localPlaying:false,
    localUrl:null, audioEl:null,
    volume:0.4, panelOpen:false, source:"stream"
};
function loadYtApi() {
    if (music.ytApiLoaded) return;
    music.ytApiLoaded = true;
    if (window.YT && window.YT.Player) { createYt(); return; }
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true; document.head.appendChild(s);
}
window.onYouTubeIframeAPIReady = function () { createYt(); };
function createYt() {
    if (!window.YT || !window.YT.Player || music.yt) return;
    try {
        music.yt = new window.YT.Player("ytPlayerHidden", {
            height:"1", width:"1", videoId: MUSIC_STREAM[music.streamIndex].id,
            playerVars: { autoplay:0, controls:0, disablekb:1, fs:0, iv_load_policy:3, modestbranding:1, playsinline:1, rel:0 },
            events: {
                onReady: () => { music.ytReady = true; if (music.yt.setVolume) music.yt.setVolume(Math.round(music.volume*100)); updateMusicUI(); },
                onStateChange: e => {
                    if (!window.YT) return;
                    if (e.data === window.YT.PlayerState.PLAYING) music.streamPlaying = true;
                    else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) music.streamPlaying = false;
                    updateMusicUI();
                },
                onError: () => { if (music.source !== "stream") return; toast("Track unavailable."); nextStream(); }
            }
        });
    } catch (e) { console.warn("YT:", e); }
}
function playStream() { if (!music.ytReady || !music.yt) { toast("Radio is loading..."); return; } try { music.yt.playVideo(); } catch {} }
function pauseStream() { if (!music.ytReady || !music.yt) return; try { music.yt.pauseVideo(); } catch {} }
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
    } catch {}
}
function nextStream() {
    let n = music.streamIndex;
    if (MUSIC_STREAM.length > 1) while (n === music.streamIndex) n = Math.floor(Math.random() * MUSIC_STREAM.length);
    setStream(n, true); toast("♪ " + MUSIC_STREAM[music.streamIndex].name);
}
function prevStream() { setStream(music.streamIndex - 1, true); }
async function loadLocal() {
    try { music.localTracks = (await dbAll()).sort((a,b) => a.addedAt - b.addedAt); }
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
        music.audioEl.play().catch(() => {});
        save(MUSIC_KEYS.lastLocal, track.id);
    } catch {}
    updateMusicUI(); renderLocal();
}
function pauseLocal() { if (music.audioEl) music.audioEl.pause(); }
function toggleLocal() {
    if (!music.audioEl) return;
    if (music.localPlaying) pauseLocal();
    else if (!music.audioEl.src) {
        if (!music.localTracks.length) { toast("No local tracks."); return; }
        playLocalIdx(music.localIndex);
    } else music.audioEl.play().catch(() => {});
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
    if (music.yt && music.yt.setVolume) music.yt.setVolume(Math.round(music.volume*100));
    if (music.audioEl) music.audioEl.volume = music.volume;
    const el = $("musicVolVal"); if (el) el.textContent = Math.round(music.volume*100) + "%";
}
function switchSource(src) {
    if (!["stream","local"].includes(src) || music.source === src) return;
    if (src === "local") pauseStream();
    else { pauseLocal(); saveMusicPos(); }
    music.source = src; save(MUSIC_KEYS.source, src);
    document.querySelectorAll(".music-tab").forEach(t => {
        const on = t.dataset.source === src;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
    });
    const sec = $("musicLocalSection"); if (sec) sec.classList.toggle("hidden", src !== "local");
    updateMusicUI(); clampWidget();
}
function updateMusicUI() {
    const labelEl = $("musicNowLabel"), trackEl = $("musicTrackName");
    if (music.source === "stream") {
        if (labelEl) labelEl.textContent = "NOW PLAYING · STREAM";
        if (trackEl) trackEl.textContent = MUSIC_STREAM[music.streamIndex].name;
        const f = $("musicFootText"); if (f) f.textContent = "♞ Train with chill beats";
    } else {
        if (labelEl) labelEl.textContent = "NOW PLAYING · LOCAL";
        if (trackEl) { const t = music.localTracks[music.localIndex]; trackEl.textContent = t ? t.name : "No local tracks"; }
        const f = $("musicFootText"); if (f) f.textContent = "♞ Your music · saved locally";
    }
    const pb = $("musicPlay"); if (pb) pb.textContent = isMusicPlaying() ? "❚❚" : "▶";
    const fab = $("musicFab"); if (fab) fab.classList.toggle("playing", isMusicPlaying());
    const tb = $("musicTopBtn"); if (tb) tb.classList.toggle("playing", isMusicPlaying());
}
function openPanel() {
    const p = $("musicPanel"), fab = $("musicFab");
    if (p) p.classList.remove("hidden"); if (fab) fab.classList.add("active");
    music.panelOpen = true; save(MUSIC_KEYS.open, true);
    requestAnimationFrame(() => { clampWidget(); applyWidgetPos(); });
}
function closePanel() {
    const p = $("musicPanel"), fab = $("musicFab");
    if (p) p.classList.add("hidden"); if (fab) fab.classList.remove("active");
    music.panelOpen = false; save(MUSIC_KEYS.open, false);
}
function togglePanel() { music.panelOpen ? closePanel() : openPanel(); }
function fmtBytes(b) {
    if (!b) return "0 KB"; const kb = b / 1024;
    if (kb < 1024) return kb.toFixed(0) + " KB";
    return (kb/1024).toFixed(1) + " MB";
}
function renderLocal() {
    const list = $("musicTrackList"), cnt = $("musicTrackCount");
    if (!list) return; if (cnt) cnt.textContent = music.localTracks.length;
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
        const icon = document.createElement("div"); icon.className = "music-track-icon";
        icon.textContent = (i === music.localIndex && music.localPlaying) ? "❚❚" : "♪";
        const meta = document.createElement("div"); meta.className = "music-track-meta";
        const name = document.createElement("div"); name.className = "music-track-name"; name.textContent = t.name;
        const size = document.createElement("div"); size.className = "music-track-size";
        const ext = (t.type || "").split("/")[1] || "audio";
        size.textContent = fmtBytes(t.size) + " · " + ext.toUpperCase();
        meta.append(name, size);
        const del = document.createElement("button"); del.type = "button"; del.className = "music-track-del";
        del.textContent = "×"; del.setAttribute("aria-label", "Remove track");
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
        if (f.size > 30 * 1024 * 1024) { if (!confirm(`"${f.name}" is ${fmtBytes(f.size)}. Add anyway?`)) { skipped++; continue; } }
        try { music.localTracks.push(await dbAdd(f)); added++; }
        catch (e) { if (e && e.name === "QuotaExceededError") { toast("Storage full. Remove some tracks."); break; } skipped++; }
    }
    music.localTracks.sort((a,b) => a.addedAt - b.addedAt);
    renderLocal();
    if (added) { toast(`Saved ${added} track${added > 1 ? "s" : ""}.`);
        if (music.source !== "local") switchSource("local"); }
    else if (skipped) toast("No audio files added.");
}
async function removeLocal(id) {
    const t = music.localTracks.find(x => x.id === id); if (!t) return;
    if (!confirm(`Remove "${t.name}"?`)) return;
    try { await dbDel(id); } catch {}
    const wasActive = music.source === "local" && music.localTracks[music.localIndex]?.id === id;
    music.localTracks = music.localTracks.filter(x => x.id !== id);
    if (wasActive) { pauseLocal(); if (music.localUrl) { URL.revokeObjectURL(music.localUrl); music.localUrl = null; } if (music.audioEl) music.audioEl.src = ""; }
    if (music.localIndex >= music.localTracks.length) music.localIndex = Math.max(0, music.localTracks.length - 1);
    renderLocal(); updateMusicUI(); toast("Track removed.");
}
function saveMusicPos() {
    if (music.source !== "local" || !music.audioEl || !music.audioEl.src) return;
    const t = music.localTracks[music.localIndex]; if (!t) return;
    save(MUSIC_KEYS.lastLocal, t.id);
    save(MUSIC_KEYS.position, { id: t.id, time: music.audioEl.currentTime || 0, updatedAt: Date.now() });
}
async function restoreLocal() {
    const lastId = load(MUSIC_KEYS.lastLocal, null); if (!lastId) return;
    const idx = music.localTracks.findIndex(x => x.id === lastId); if (idx < 0) return;
    music.localIndex = idx; const t = music.localTracks[idx];
    try {
        if (music.localUrl) { URL.revokeObjectURL(music.localUrl); music.localUrl = null; }
        const url = URL.createObjectURL(t.blob); music.localUrl = url;
        music.audioEl.src = url; music.audioEl.volume = music.volume;
        const pos = load(MUSIC_KEYS.position, null);
        if (pos && pos.id === t.id && pos.time > 1 && Date.now() - (pos.updatedAt || 0) < 24*60*60*1000) {
            const seek = () => { try { music.audioEl.currentTime = pos.time; } catch {} music.audioEl.removeEventListener("loadedmetadata", seek); };
            music.audioEl.addEventListener("loadedmetadata", seek);
        }
    } catch {}
    renderLocal(); updateMusicUI();
}
const drag = { offsetX:0, offsetY:0, dragging:false, moved:false, justDragged:false, pointerId:null,
    startX:0, startY:0, startOffsetX:0, startOffsetY:0 };
function applyWidgetPos() { const w = $("musicWidget"); if (w) w.style.transform = `translate(${drag.offsetX}px, ${drag.offsetY}px)`; }
function clampWidget() {
    const w = $("musicWidget"); if (!w) return;
    const r = w.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, m = 10;
    let dx = 0, dy = 0;
    if (r.left < m) dx = m - r.left;
    if (r.right > vw - m) dx = (vw - m) - r.right;
    if (r.top < m) dy = m - r.top;
    if (r.bottom > vh - m) dy = (vh - m) - r.bottom;
    if (dx || dy) { drag.offsetX += dx; drag.offsetY += dy; applyWidgetPos(); }
}
function saveWidgetPos() { save(MUSIC_KEYS.widget, { x: drag.offsetX, y: drag.offsetY }); }
function resetWidgetPos() { drag.offsetX = 0; drag.offsetY = 0; applyWidgetPos(); saveWidgetPos(); toast("Music position reset."); }
function setupDrag() {
    const w = $("musicWidget"), fab = $("musicFab"); if (!w || !fab) return;
    const saved = load(MUSIC_KEYS.widget, { x:0, y:0 });
    drag.offsetX = Number(saved.x) || 0; drag.offsetY = Number(saved.y) || 0; applyWidgetPos();
    const THRESH = 5;
    function onDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        drag.dragging = true; drag.moved = false; drag.pointerId = e.pointerId;
        drag.startX = e.clientX; drag.startY = e.clientY;
        drag.startOffsetX = drag.offsetX; drag.startOffsetY = drag.offsetY;
        w.classList.add("dragging");
        try { fab.setPointerCapture(e.pointerId); } catch {}
    }
    function onMove(e) {
        if (!drag.dragging || e.pointerId !== drag.pointerId) return;
        const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < THRESH) return;
        drag.moved = true; drag.offsetX = drag.startOffsetX + dx; drag.offsetY = drag.startOffsetY + dy;
        applyWidgetPos();
    }
    function onUp(e) {
        if (!drag.dragging || e.pointerId !== drag.pointerId) return;
        drag.dragging = false; drag.pointerId = null; w.classList.remove("dragging");
        if (drag.moved) { clampWidget(); saveWidgetPos(); drag.justDragged = true; setTimeout(() => drag.justDragged = false, 60); }
    }
    fab.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    fab.addEventListener("click", e => {
        if (drag.justDragged) { e.preventDefault(); e.stopPropagation(); return; }
        togglePanel();
    }, true);
    const rb = $("musicResetPos"); if (rb) rb.addEventListener("click", resetWidgetPos);
    window.addEventListener("resize", () => { clampWidget(); saveWidgetPos(); });
}
async function setupMusic() {
    music.volume = Number(load(MUSIC_KEYS.volume, 0.4));
    if (isNaN(music.volume)) music.volume = 0.4;
    music.streamIndex = Number(load(MUSIC_KEYS.track, 0)) || 0;
    if (music.streamIndex < 0 || music.streamIndex >= MUSIC_STREAM.length) music.streamIndex = 0;
    music.source = load(MUSIC_KEYS.source, "stream");
    if (!["stream","local"].includes(music.source)) music.source = "stream";
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
    if (volEl) { volEl.value = String(Math.round(music.volume*100)); volEl.addEventListener("input", e => setMusicVol(Number(e.target.value)/100)); }
    const vv = $("musicVolVal"); if (vv) vv.textContent = Math.round(music.volume*100) + "%";
    const tb = $("musicTopBtn"); if (tb) tb.addEventListener("click", () => music.panelOpen ? closePanel() : openPanel());
    const cb = $("musicCloseBtn"); if (cb) cb.addEventListener("click", closePanel);
    const pb = $("musicPlay"); if (pb) pb.addEventListener("click", togglePlay);
    const nb = $("musicNext"); if (nb) nb.addEventListener("click", nextMusic);
    const prb = $("musicPrev"); if (prb) prb.addEventListener("click", prevMusic);
    document.querySelectorAll(".music-tab").forEach(t => t.addEventListener("click", () => switchSource(t.dataset.source)));
    const ab = $("musicAddBtn"), fi = $("musicFileInput");
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
    const sec = $("musicLocalSection"); if (sec) sec.classList.toggle("hidden", music.source !== "local");
    setupDrag();
    if (load(MUSIC_KEYS.open, false)) openPanel();
    await loadLocal();
    if (music.localTracks.length) await restoreLocal();
    updateMusicUI(); loadYtApi();
}

/* Board */
function buildCoords() {
    ["topCoordinates","bottomCoordinates","leftCoordinates","rightCoordinates"].forEach(id => { const el = $(id); if (el) el.innerHTML = ""; });
    FILES.forEach(f => ["topCoordinates","bottomCoordinates"].forEach(id => {
        const el = $(id); if (!el) return;
        const s = document.createElement("span"); s.textContent = f; el.appendChild(s);
    }));
    RANKS.forEach(r => ["leftCoordinates","rightCoordinates"].forEach(id => {
        const el = $(id); if (!el) return;
        const s = document.createElement("span"); s.textContent = r; el.appendChild(s);
    }));
}
function buildBoard() {
    const b = $("chessboard"); if (!b) return;
    b.innerHTML = "";
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const file = FILES[col], rank = RANKS[row], coord = file + rank;
            const sq = document.createElement("button");
            sq.type = "button";
            sq.className = "square " + ((row + col) % 2 === 0 ? "light" : "dark");
            sq.dataset.square = coord;
            sq.setAttribute("role", "gridcell");
            sq.setAttribute("aria-label", "Square " + coord);
            sq.setAttribute("aria-disabled", "true");
            const lbl = document.createElement("span"); lbl.className = "square-label"; lbl.textContent = coord;
            sq.appendChild(lbl);
            sq.addEventListener("click", e => { e.preventDefault(); handleSquare(coord, sq); });
            sq.addEventListener("contextmenu", e => {
                if (mindPalace.running && mindPalace.phase === "rebuild") { e.preventDefault(); eraseMindPalacePiece(coord); }
            });
            b.appendChild(sq);
        }
    }
    renderPieces();
}
function enableBoard(on) {
    document.querySelectorAll(".square").forEach(sq => sq.setAttribute("aria-disabled", on ? "false" : "true"));
}
function generatePieces() {
    game.pieces = {};
    if (!game.piecesEnabled) { renderPieces(); return; }
    const occupied = new Set(); let attempts = 0;
    while (Object.keys(game.pieces).length < PIECE_COUNT && attempts < 200) {
        attempts++;
        const sq = randomSquare(); if (occupied.has(sq)) continue;
        occupied.add(sq);
        const color = Math.random() < 0.5 ? "white" : "black";
        const glyph = color === "white"
            ? PIECE_GLYPHS_WHITE[Math.floor(Math.random()*PIECE_GLYPHS_WHITE.length)]
            : PIECE_GLYPHS_BLACK[Math.floor(Math.random()*PIECE_GLYPHS_BLACK.length)];
        game.pieces[sq] = { color, glyph };
    }
    renderPieces();
}
function renderPieces() {
    document.querySelectorAll(".piece").forEach(p => p.remove());
    if (!game.piecesEnabled) return;
    Object.keys(game.pieces).forEach(sq => {
        const sqEl = document.querySelector(`.square[data-square="${sq}"]`); if (!sqEl) return;
        const p = game.pieces[sq];
        const el = document.createElement("span");
        el.className = "piece piece-" + p.color;
        el.textContent = p.glyph;
        sqEl.appendChild(el);
    });
}
function setPiecesEnabled(on) {
    game.piecesEnabled = !!on;
    save(KEYS.pieces, game.piecesEnabled);
    const pt = $("piecesToggle"); if (pt) pt.checked = game.piecesEnabled;
    if (game.piecesEnabled) generatePieces();
    else { game.pieces = {}; renderPieces(); }
}
function clearHighlights() {
    document.querySelectorAll(".square").forEach(sq => {
        sq.classList.remove("last-correct","last-wrong","target-highlight","knight-source","knight-found",
            "mp-correct-pick","mp-user-pick","mp-missing-pick","mp-extra-pick");
    });
}
function hl(coord, cls) {
    const sq = document.querySelector(`.square[data-square="${coord}"]`); if (sq) sq.classList.add(cls);
}
function isLightSquare(coord) {
    const f = FILES.indexOf(coord[0]), r = RANKS.indexOf(Number(coord[1]));
    return (f + r) % 2 === 0;
}
function knightMoves(coord) {
    const fi = FILES.indexOf(coord[0]), ri = RANKS.indexOf(Number(coord[1]));
    const off = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
    const out = [];
    for (const [df, dr] of off) {
        const f = fi + df, r = ri + dr;
        if (f >= 0 && f < 8 && r >= 0 && r < 8) out.push(FILES[f] + RANKS[r]);
    }
    return out;
}
function randomSquare() { return FILES[Math.floor(Math.random()*8)] + RANKS[Math.floor(Math.random()*8)]; }
function nextTarget() {
    const target = adaptiveEnabled ? adaptiveTarget(game.target) : squareBag.next(game.target);
    if (adaptiveEnabled) {
        game.adaptiveRecentSquares.push(target);
        if (game.adaptiveRecentSquares.length > 12) game.adaptiveRecentSquares.shift();
    }
    return target;
}

function adaptiveTarget(exclude) {
    const squares = FILES.flatMap(file => RANKS.map(rank => file + rank));
    const valid = answerRecords.filter(r => r && squares.includes(r.targetSquare) && typeof r.correct === "boolean");
    const metrics = {};
    squares.forEach(square => { metrics[square] = { total: 0, correct: 0, recent: [] }; });
    valid.forEach(record => {
        const metric = metrics[record.targetSquare];
        metric.total++;
        if (record.correct) metric.correct++;
        metric.recent.push(record);
    });
    const cooldown = new Set(game.adaptiveRecentSquares.slice(-4));
    const candidates = squares.filter(square => square !== exclude && !cooldown.has(square));
    const pool = candidates.length >= 12 ? candidates : squares.filter(square => square !== exclude);
    const now = Date.now();
    const weighted = pool.map(square => {
        const metric = metrics[square];
        const accuracy = metric.total ? metric.correct / metric.total : 0.5;
        const recent = metric.recent.slice(-5);
        const recentMastery = recent.length >= 3 && recent.every(record => record.correct);
        const recentFailures = recent.filter(record => !record.correct).length;
        const ageHours = recent.length ? Math.max(0, (now - Date.parse(recent[recent.length - 1].timestamp)) / 3600000) : Infinity;
        const recencyBoost = Number.isFinite(ageHours) ? Math.max(0, 1 - ageHours / 72) : 0;
        let weight = 1 + (1 - accuracy) * 5 + Math.min(2, recentFailures * 0.45);
        if (recentMastery) weight *= Math.max(0.45, 1 - recencyBoost * 0.45);
        if (metric.total === 0) weight = 1.35;
        return { square, weight };
    });
    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let pick = Math.random() * totalWeight;
    for (const entry of weighted) {
        pick -= entry.weight;
        if (pick <= 0) return entry.square;
    }
    return weighted[weighted.length - 1].square;
}

/* Perspective */
function setPerspective(p) {
    if (!["white","black","mixed","both","auto"].includes(p)) p = "white";
    game.perspective = p;
    save(KEYS.perspective, p);
    document.body.dataset.perspective = p;
    document.querySelectorAll(".perspective-btn").forEach(b => {
        if (!b.dataset.perspective) return;
        const on = b.dataset.perspective === p;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (!game.running) {
        if (p === "auto" || p === "both") setBoardFlip(false);
        else applyFlipForQuestion(true);
    }
    applyTargetSide(false);
    const ft = $("flipToggle");
    if (ft) {
        if (p === "white") { ft.checked = false; ft.disabled = false; }
        else if (p === "black") { ft.checked = true; ft.disabled = false; }
        else ft.disabled = true;
    }
}
function applyFlipForQuestion(force) {
    let flip;
    if (game.perspective === "white") flip = false;
    else if (game.perspective === "black") flip = true;
    else if (game.perspective === "mixed") flip = Math.random() < 0.5;
    else flip = false;
    const current = document.body.dataset.flip === "true";
    if (force || flip !== current) {
        document.body.dataset.flip = flip ? "true" : "false";
        save(KEYS.flip, flip);
    }
}
function setBoardFlip(flip) { document.body.dataset.flip = flip ? "true" : "false"; save(KEYS.flip, flip); }
function isDualMode() { return game.perspective === "both"; }
function isAutoMode() { return game.perspective === "auto"; }
function pickAutoSide() { if (!isAutoMode()) { game.autoSide = null; return; } game.autoSide = game.autoSide === "white" ? "black" : "white"; }
function getCurrentSide() {
    switch (game.perspective) {
        case "white": return "white";
        case "black": return "black";
        case "mixed": return document.body.dataset.flip === "true" ? "black" : "white";
        case "both": return game.dualStep === 0 ? "white" : "black";
        case "auto": return game.autoSide || "white";
        default: return "white";
    }
}
function applyTargetSide(force) {
    const panel = $("targetPanel"), badge = $("sideBadge"), coord = $("targetCoordinate");
    if (!panel) return;
    const hasTarget = game.target !== null && game.running && game.mode !== "mindpalace";
    if (hasTarget) {
        const side = getCurrentSide();
        panel.dataset.side = side;
        if (badge) { badge.classList.remove("hidden"); badge.textContent = side === "white" ? "♔ WHITE" : "♚ BLACK"; badge.className = "side-badge " + side; }
        if (coord) { coord.classList.remove("side-swap"); void coord.offsetWidth; coord.classList.add("side-swap"); }
        if (force) playSound("side");
    } else {
        panel.removeAttribute("data-side");
        if (badge) badge.classList.add("hidden");
        if (coord) coord.classList.remove("side-swap");
    }
}
function updateDualIndicator() {
    const el = $("dualIndicator"); if (!el) return;
    if (!isDualMode() || !game.running) { el.classList.add("hidden"); el.classList.remove("step-2"); return; }
    el.classList.remove("hidden");
    const step = game.dualStep + 1;
    el.classList.toggle("step-2", step === 2);
    el.innerHTML = '<span class="dual-dot"></span><span class="dual-text">' + step + ' / 2 · ' + (step === 1 ? "WHITE VIEW" : "BLACK VIEW") + '</span>';
}

/* Targets */
function genTarget() {
    game.questionAttempts = 0;
    game.dualStep = 0; game.dualTarget = null;
    if (isDualMode() || isAutoMode()) setBoardFlip(false);
    else applyFlipForQuestion(false);
    pickAutoSide();
    game.questionStartTime = Date.now();
    const m = game.mode;
    if (m === "square" || m === "blindfold") genSquareTarget();
    else if (m === "coordinate") genNameTarget(4);
    else if (m === "reverse") genNameTarget(6);
    else if (m === "knight") genKnightTarget();
    else if (m === "color") genColorTarget();
    else genSquareTarget();
    applyTargetSide(false);
    updateDualIndicator();
}
function updateQuestionNumber() { const el = $("targetNumber"); if (el) el.textContent = "QUESTION " + String(game.questionIndex).padStart(2,"0"); }
function genSquareTarget() {
    const coord = game.dailyActive ? game.dailySequence[game.questionIndex] : nextTarget();
    game.target = coord;
    if (isDualMode()) game.dualTarget = coord;
    game.questionIndex++; updateQuestionNumber();
    $("targetLabelText").textContent = isDualMode() ? "FIND IN BOTH VIEWS" : "FIND THIS SQUARE";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = coord;
    $("targetHint").textContent = isDualMode() ? "Click this square from white's view." : "Click the matching square on the board.";
    $("targetFeedback").textContent = "";
    $("choiceGrid").classList.add("hidden"); $("choiceGrid").innerHTML = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
}
function genNameTarget(count) {
    const coord = nextTarget();
    game.target = coord;
    game.questionIndex++; updateQuestionNumber();
    $("targetLabelText").textContent = game.mode === "reverse" ? "IDENTIFY THIS SQUARE" : "NAME THIS SQUARE";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = "?";
    $("targetHint").textContent = "Which coordinate is highlighted?";
    $("targetFeedback").textContent = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
    hl(coord, "target-highlight");
    const choices = new Set([coord]); let tries = 0;
    while (choices.size < count && tries < 50) { choices.add(randomSquare()); tries++; }
    const arr = Array.from(choices).sort(() => Math.random() - 0.5);
    const grid = $("choiceGrid");
    grid.innerHTML = ""; grid.classList.remove("hidden");
    grid.style.gridTemplateColumns = count > 4 ? "repeat(3, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))";
    arr.forEach(c => {
        const btn = document.createElement("button"); btn.type = "button"; btn.className = "choice-btn";
        btn.textContent = c; btn.dataset.choice = c;
        btn.addEventListener("click", () => handleChoice(c, btn));
        grid.appendChild(btn);
    });
}
function genKnightTarget() {
    let src = nextTarget(), tries = 0;
    while (knightMoves(src).length < 2 && tries < 40) { src = nextTarget(); tries++; }
    game.knightSource = src; game.target = src; game.questionIndex++;
    game.knightRemaining = knightMoves(src); game.knightFound = [];
    updateQuestionNumber();
    $("targetLabelText").textContent = "KNIGHT JUMPS FROM";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = src;
    $("targetHint").textContent = "Click every square this knight can move to.";
    $("targetFeedback").textContent = "";
    $("choiceGrid").classList.add("hidden"); $("choiceGrid").innerHTML = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
    hl(src, "knight-source");
}
function genColorTarget() {
    const coord = nextTarget();
    game.target = coord;
    game.questionIndex++; updateQuestionNumber();
    $("targetLabelText").textContent = "SQUARE COLOR";
    $("targetCoordinate").classList.remove("muted");
    $("targetCoordinate").textContent = coord;
    $("targetHint").textContent = "Is this square light or dark?";
    $("targetFeedback").textContent = "";
    $("targetPanel").classList.remove("correct","wrong");
    clearHighlights();
    const grid = $("choiceGrid");
    grid.innerHTML = ""; grid.classList.remove("hidden"); grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    [["light","Light"],["dark","Dark"]].forEach(([val, label]) => {
        const btn = document.createElement("button"); btn.type = "button"; btn.className = "choice-btn";
        btn.textContent = label; btn.dataset.choice = val;
        btn.addEventListener("click", () => handleColorChoice(val, btn));
        grid.appendChild(btn);
    });
}
function resetTarget() {
    game.target = null; game.knightSource = null; game.knightRemaining = []; game.knightFound = [];
    game.questionIndex = 0; game.dualStep = 0; game.dualTarget = null;
    $("targetCoordinate").classList.add("muted");
    $("targetCoordinate").textContent = "—";
    $("targetCoordinate").classList.remove("side-swap");
    $("targetHint").textContent = "Press Start to begin your session.";
    $("targetFeedback").textContent = "";
    $("targetNumber").textContent = "QUESTION 00";
    $("targetLabelText").textContent = "FIND THIS SQUARE";
    $("targetPanel").classList.remove("correct","wrong");
    $("targetPanel").removeAttribute("data-side");
    $("choiceGrid").classList.add("hidden"); $("choiceGrid").innerHTML = "";
    $("dualIndicator").classList.add("hidden"); $("dualIndicator").classList.remove("step-2");
    $("sideBadge").classList.add("hidden");
    clearHighlights();
}

/* Answer handling */
function recordReaction() {
    let rt = 0;
    if (game.questionStartTime) {
        rt = Date.now() - game.questionStartTime;
        if (rt > 0 && rt < 30000) game.reactionTimes.push(rt);
    }
    return rt;
}
function answerDifficulty() {
    if (game.mode === "daily") return "daily";
    const duration = game.duration || Number($("durationSelect").value) || 60;
    if (game.mode === "mindpalace" && mindPalace.currentDifficulty) return mindPalace.currentDifficulty.name.toLowerCase();
    if (game.mode === "custom") return "custom";
    if (game.mode === "knight") return game.knightRemaining.length > 4 ? "advanced" : "standard";
    if (duration <= 45) return "fast";
    if (duration >= 120) return "endurance";
    return "standard";
}
function recordAnswer(targetSquare, correct, reactionTime) {
    if (!targetSquare || !FILES.includes(targetSquare[0]) || !RANKS.includes(Number(targetSquare[1]))) return;
    answerRecords.push({
        targetSquare,
        correct: !!correct,
        reactionTime: Math.max(0, Math.round(reactionTime)),
        mode: game.mode,
        timestamp: new Date().toISOString(),
        difficulty: answerDifficulty(),
        attempt: ++game.questionAttempts
    });
    if (answerRecords.length > 5000) answerRecords = answerRecords.slice(-5000);
    save(KEYS.answerRecords, answerRecords);
}
function handleSquare(coord, sq) {
    // Mind Palace: intercept clicks during rebuild phase
    if (mindPalace.running && mindPalace.phase === "rebuild") {
        handleMindPalaceRebuildClick(coord);
        return;
    }
    if (!game.running || game.paused || !game.target) return;
    if (sq && sq.getAttribute("aria-disabled") === "true") return;
    if (game.mode === "square" || game.mode === "blindfold" || game.mode === "daily") {
        if (coord === game.target) { if (isDualMode()) correctDual(sq); else correctFind(sq); }
        else wrongSquare(sq);
    } else if (game.mode === "knight") {
        if (coord === game.knightSource || game.knightFound.includes(coord)) return;
        if (game.knightRemaining.includes(coord)) correctKnight(coord, sq);
        else wrongSquare(sq);
    }
}
function correctDual(sq) {
    if (game.dualStep === 0) {
        game.dualStep = 1;
        recordAnswer(game.target, true, Date.now() - game.questionStartTime);
        sq.classList.add("last-correct");
        $("targetPanel").classList.add("correct");
        $("targetFeedback").textContent = "✓ WHITE SIDE · NOW FIND IT FROM BLACK";
        $("targetFeedback").style.color = "var(--green)";
        $("targetHint").textContent = "Board is flipping — click " + game.target + " again.";
        playSound("correct");
        setTimeout(() => { setBoardFlip(true); playSound("flip"); applyTargetSide(true); updateDualIndicator(); }, 300);
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("correct"); clearHighlights(); }, 700);
        return;
    }
    game.dualStep = 0; game.dualTarget = null;
    onCorrectBase(); clearHighlights();
    sq.classList.add("last-correct");
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ BOTH SIDES COMPLETE";
    $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    updateDualIndicator();
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("correct"); genTarget(); }, 500);
}
function handleChoice(coord, btn) {
    if (!game.running || game.paused) return;
    if (game.mode !== "coordinate" && game.mode !== "reverse") return;
    if (coord === game.target) { btn.classList.add("correct"); correctName(btn); }
    else {
        recordAnswer(game.target, false, Date.now() - game.questionStartTime);
        btn.classList.add("wrong");
        game.mistakes++; stats.totalMistakes++; game.streak = 0; updateLive(); playSound("wrong");
        $("targetPanel").classList.add("wrong");
        $("targetFeedback").textContent = "✕ WRONG"; $("targetFeedback").style.color = "var(--red)";
        setTimeout(() => btn.classList.remove("wrong"), 500);
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("wrong"); $("targetFeedback").textContent = ""; }, 500);
    }
}
function handleColorChoice(val, btn) {
    if (!game.running || game.paused || !game.target) return;
    const isLight = isLightSquare(game.target);
    const correct = (val === "light" && isLight) || (val === "dark" && !isLight);
    if (correct) { btn.classList.add("correct"); correctColor(btn); }
    else {
        recordAnswer(game.target, false, Date.now() - game.questionStartTime);
        btn.classList.add("wrong");
        game.mistakes++; stats.totalMistakes++; game.streak = 0; updateLive(); playSound("wrong");
        $("targetPanel").classList.add("wrong");
        $("targetFeedback").textContent = "✕ WRONG"; $("targetFeedback").style.color = "var(--red)";
        setTimeout(() => btn.classList.remove("wrong"), 500);
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("wrong"); $("targetFeedback").textContent = ""; }, 500);
    }
}
function onCorrectBase() {
    const reactionTime = recordReaction();
    recordAnswer(game.target, true, reactionTime);
    game.correct++; game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);
    updateLive(); updateDashboard(); bumpDaily(1);
    save(KEYS.stats, stats);
    playSound("correct");
    if (game.streak > 0 && game.streak % 5 === 0) toast(game.streak + " in a row!");
}
function correctFind(sq) {
    onCorrectBase(); clearHighlights();
    sq.classList.add("last-correct");
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT"; $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("correct");
        if (game.dailyActive && game.questionIndex >= game.dailySequence.length) finishSession();
        else genTarget();
    }, 320);
}
function correctName(btn) {
    onCorrectBase();
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT"; $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    setTimeout(() => btn.classList.remove("correct"), 400);
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("correct"); genTarget(); }, 480);
}
function correctColor(btn) {
    onCorrectBase();
    $("targetPanel").classList.add("correct");
    $("targetFeedback").textContent = "✓ CORRECT"; $("targetFeedback").style.color = "var(--green)";
    $("targetHint").textContent = "Next target coming...";
    setTimeout(() => btn.classList.remove("correct"), 400);
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("correct"); genTarget(); }, 420);
}
function correctKnight(coord, sq) {
    recordAnswer(coord, true, Date.now() - game.questionStartTime);
    game.knightFound.push(coord);
    game.knightRemaining = game.knightRemaining.filter(c => c !== coord);
    sq.classList.add("knight-found");
    game.correct++; game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    stats.totalCorrect++;
    stats.bestStreak = Math.max(stats.bestStreak, game.streak);
    updateLive(); updateDashboard(); bumpDaily(1);
    save(KEYS.stats, stats);
    if (game.knightRemaining.length === 0) {
        recordReaction();
        $("targetPanel").classList.add("correct");
        $("targetFeedback").textContent = "✓ ALL JUMPS FOUND"; $("targetFeedback").style.color = "var(--green)";
        $("targetHint").textContent = "Next knight coming...";
        playSound("correct");
        clearTimeout(game.feedbackTimer);
        game.feedbackTimer = setTimeout(() => { if (!game.running) return; $("targetPanel").classList.remove("correct"); genTarget(); }, 480);
    } else {
        playSound("correct");
        $("targetHint").textContent = game.knightFound.length + " / " + (game.knightFound.length + game.knightRemaining.length) + " jumps found.";
    }
}
function wrongSquare(sq) {
    recordAnswer(game.mode === "knight" ? sq.dataset.square : game.target, false, Date.now() - game.questionStartTime);
    game.mistakes++; stats.totalMistakes++; game.streak = 0;
    clearHighlights();
    if (game.mode === "knight" && game.knightSource) {
        hl(game.knightSource, "knight-source");
        game.knightFound.forEach(c => hl(c, "knight-found"));
    }
    sq.classList.add("last-wrong");
    $("targetPanel").classList.add("wrong");
    $("targetFeedback").textContent = "✕ TRY AGAIN"; $("targetFeedback").style.color = "var(--red)";
    if (game.mode === "square" || game.mode === "blindfold" || game.mode === "daily") {
        if (isDualMode()) {
            const view = game.dualStep === 0 ? "white" : "black";
            $("targetHint").textContent = "That was " + sq.dataset.square + ". Find " + game.target + " from the " + view + " view.";
        } else {
            const side = getCurrentSide();
            $("targetHint").textContent = "That was " + sq.dataset.square + ". Find " + game.target + " from " + (side === "white" ? "white's view" : "black's view") + ".";
        }
    } else if (game.mode === "knight") {
        $("targetHint").textContent = sq.dataset.square + " is not a legal jump. Keep looking.";
    }
    updateLive(); playSound("wrong");
    clearTimeout(game.feedbackTimer);
    game.feedbackTimer = setTimeout(() => {
        if (!game.running) return;
        $("targetPanel").classList.remove("wrong");
        $("targetFeedback").textContent = "";
        if (game.mode === "square" || game.mode === "blindfold" || game.mode === "daily") {
            if (isDualMode()) { const view = game.dualStep === 0 ? "white" : "black"; $("targetHint").textContent = "Find " + game.target + " from the " + view + " view."; }
            else $("targetHint").textContent = "Try again — find the correct square.";
            clearHighlights();
        } else if (game.mode === "knight") {
            $("targetHint").textContent = game.knightFound.length + " / " + (game.knightFound.length + game.knightRemaining.length) + " jumps found.";
            sq.classList.remove("last-wrong");
        }
    }, 520);
}

/* Timer / progress / analytics helpers */
function fmtTime(s) { const m = Math.floor(s/60), r = s%60; return String(m).padStart(2,"0") + ":" + String(r).padStart(2,"0"); }
function updateTimer() {
    const el = $("timerDisplay"); if (!el) return;
    if (game.mode === "mindpalace") return; // MP uses timerDisplay as score
    el.textContent = fmtTime(game.timeLeft);
    el.style.color = game.timeLeft <= 10 && game.running && !game.paused ? "var(--red)" : "var(--gold)";
}
function updateProgress() {
    if (game.mode === "mindpalace") return; // MP uses updateMPProgress
    const fill = $("progressFill"), txt = $("progressText"); if (!fill || !txt) return;
    const elapsed = game.duration - game.timeLeft;
    const pct = Math.min(100, Math.max(0, (elapsed / game.duration) * 100));
    fill.style.width = pct + "%";
    txt.textContent = Math.round(pct) + "%";
}
function accuracy() { const a = game.correct + game.mistakes; return a === 0 ? 100 : Math.round(game.correct / a * 100); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function calculateVisionRatingUpdate() {
    const attempts = game.correct + game.mistakes;
    const accuracyScore = attempts ? game.correct / attempts : 0;
    const reactionValues = game.reactionTimes.filter(rt => rt > 0 && rt < 30000);
    const averageReaction = reactionValues.length ? reactionValues.reduce((sum, rt) => sum + rt, 0) / reactionValues.length : 3000;
    const reactionScore = clamp(1 - (averageReaction - 450) / 2550, 0, 1);
    const consistencyScore = attempts ? clamp(game.bestStreak / Math.max(1, attempts) * 1.6, 0, 1) : 0;
    const difficultyScore = game.mode === "knight" ? .9 : game.mode === "reverse" ? .82 : game.mode === "blindfold" ? .86 : game.mode === "color" ? .68 : game.duration <= 45 ? .82 : game.duration >= 120 ? .76 : .7;
    const previous = visionRating.history.slice(-5);
    const recentScore = previous.length ? clamp(previous.reduce((sum, entry) => sum + Number(entry.performance || .5), 0) / previous.length, 0, 1) : accuracyScore;
    const performance = accuracyScore * .42 + reactionScore * .2 + difficultyScore * .13 + consistencyScore * .15 + recentScore * .1;
    const delta = Math.round(clamp((performance - .5) * 84, -42, 42));
    return { delta, performance, accuracy: accuracyScore, averageReaction };
}
function updateVisionRating() {
    const update = calculateVisionRatingUpdate();
    visionRating.current = clamp(Math.round(visionRating.current + update.delta), 400, 2400);
    visionRating.history.push({
        date: new Date().toISOString(),
        rating: visionRating.current,
        delta: update.delta,
        performance: Number(update.performance.toFixed(4)),
        mode: game.mode
    });
    visionRating.history = visionRating.history.slice(-100);
    save(KEYS.rating, visionRating);
    return update;
}
function ratingWeekChange() {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return visionRating.history.filter(entry => Date.parse(entry.date) >= cutoff)
        .reduce((sum, entry) => sum + (Number(entry.delta) || 0), 0);
}
function renderVisionRating() {
    const current = Math.round(visionRating.current || 1000);
    const week = ratingWeekChange();
    const weekText = (week >= 0 ? "+" : "") + week + " this week";
    ["visionRatingValue", "visionRatingLarge"].forEach(id => { const el = $(id); if (el) el.textContent = current; });
    ["visionRatingWeek", "visionRatingChange"].forEach(id => { const el = $(id); if (el) el.textContent = weekText; });
    const values = visionRating.history.slice(-20).map(entry => entry.rating);
    renderChartBars("chartRating", values, Math.max(1200, ...values));
}
function updateLive() {
    const c = $("sessionCorrect"), a = $("sessionAccuracy"), s = $("sessionStreak");
    if (c) c.textContent = String(game.correct).padStart(2,"0");
    if (a) { a.innerHTML = accuracy() + "<small>%</small>"; a.style.color = accuracy() >= 80 ? "var(--green)" : "var(--gold)"; }
    if (s) s.textContent = String(game.streak).padStart(2,"0");
}
function updateDashboard() {
    const totalAtt = stats.totalCorrect + (stats.totalMistakes || 0);
    const acc = totalAtt > 0 ? Math.round(stats.totalCorrect / totalAtt * 100) + "%" : "—";
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("statAccuracy", acc);
    set("statStreak",   stats.bestStreak  || 0);
    set("statBest",     stats.personalBest || 0);
    set("statSessions", stats.totalSessions || 0);
    set("sidebarBest",  stats.personalBest || 0);
}
function levelInfo(x) { const level = Math.floor(x/250) + 1; const into = x - (level-1)*250; return { level, into, toNext:250-into, progress: into/250 }; }
function levelTitle(l) {
    if (l >= 20) return "Grandmaster"; if (l >= 15) return "Master"; if (l >= 10) return "Strategist";
    if (l >= 7) return "Tactician"; if (l >= 4) return "Apprentice"; return "Novice";
}
function updateLevelUI() {
    const info = levelInfo(xp);
    const l = $("levelLabel"), n = $("levelNext"), b = $("levelBarFill"), pt = $("profileTitle"), px = $("profileXp");
    if (l) l.textContent = "LEVEL " + info.level;
    if (n) n.textContent = info.toNext + " XP TO NEXT";
    if (b) b.style.width = (info.progress * 100) + "%";
    if (pt) pt.textContent = levelTitle(info.level);
    if (px) px.textContent = xp + " XP · Level " + info.level;
}
function addXp(n) { if (n <= 0) return; xp += n; save(KEYS.xp, xp); updateLevelUI(); }
function updateDailyUI() {
    const pct = Math.min(1, daily.count / DAILY_TARGET), c = 2 * Math.PI * 33;
    const ring = $("goalRingFill"), gp = $("goalPercent"), gc = $("goalCurrent"), gt = $("goalTarget");
    const sgc = $("sidebarGoalCount"), sgt = $("sidebarGoalTarget"), sgf = $("sidebarGoalFill");
    if (ring) ring.style.strokeDashoffset = String(c * (1 - pct));
    if (gp) gp.textContent = Math.round(pct * 100) + "%";
    if (gc) gc.textContent = daily.count;
    if (gt) gt.textContent = DAILY_TARGET;
    if (sgc) sgc.textContent = daily.count;
    if (sgt) sgt.textContent = DAILY_TARGET;
    if (sgf) sgf.style.width = (pct * 100) + "%";
    renderDailyChallenge();
}
function bumpDaily(n) { if (daily.date !== todayKey()) daily = { date: todayKey(), count: 0 }; daily.count += n; save(KEYS.daily, daily); updateDailyUI(); }
function renderDailyChallenge() {
    const dateKey = dailyDateKey();
    const state = dailyStateFor(dateKey);
    const number = dailyChallengeNumber(dateKey);
    const official = state.attempts.find(attempt => attempt.official);
    const title = $("dailyChallengeTitle"), status = $("dailyChallengeStatus"), meta = $("dailyChallengeMeta");
    const button = $("dailyChallengeBtn");
    if (title) title.textContent = "ChessVision Daily #" + number;
    if (status) status.textContent = official
        ? official.score + "/40 · " + official.accuracy + "% accuracy · official result saved"
        : "20 deterministic questions for today's board-vision test.";
    if (meta) meta.textContent = official
        ? "Streak: " + (state.streak || 0) + " · Replay anytime as practice"
        : "Official attempt available";
    if (button) button.textContent = official ? "Replay as practice →" : "Play today's challenge →";
    const viewNumber = $("dailyViewNumber"), viewDescription = $("dailyViewDescription"), viewStats = $("dailyViewStats");
    if (viewNumber) viewNumber.textContent = "#" + number;
    if (viewDescription) viewDescription.textContent = official
        ? "Official result saved. Replay is available, but your first attempt remains the daily record."
        : "Complete the official attempt to set today's result.";
    if (viewStats) viewStats.innerHTML = official
        ? "<span><strong>" + official.score + "/40</strong> score</span><span><strong>" + official.accuracy + "%</strong> accuracy</span><span><strong>" + fmtTime(official.completionTime) + "</strong> time</span><span><strong>" + (state.streak || 0) + "</strong> streak</span>"
        : "<span><strong>20</strong> questions</span><span><strong>40</strong> points</span><span><strong>1</strong> official attempt</span>";
    const start = $("dailyViewStartBtn"), replay = $("dailyViewReplayBtn");
    if (start) { start.textContent = official ? "Official result saved" : "Play official attempt →"; start.disabled = !!official; }
    if (replay) replay.textContent = official ? "Replay as practice" : "Practice preview";
}
function renderAchievements() {
    const g = $("achievementsGrid"); if (!g) return; g.innerHTML = "";
    ACHIEVEMENTS.forEach(a => {
        const on = unlocked.includes(a.id);
        const el = document.createElement("div");
        el.className = "achievement" + (on ? " unlocked" : "");
        el.innerHTML = '<div class="achievement-icon">' + a.icon + '</div><div class="achievement-text"><strong>' + a.title + '</strong><span>' + a.desc + '</span></div>';
        g.appendChild(el);
    });
    const sum = $("achievementSummary"); if (sum) sum.textContent = unlocked.length + " of " + ACHIEVEMENTS.length + " unlocked";
}
function checkAchievements() {
    const newly = [];
    ACHIEVEMENTS.forEach(a => { if (!unlocked.includes(a.id) && a.check(stats)) { unlocked.push(a.id); newly.push(a); } });
    if (newly.length) {
        save(KEYS.achievements, unlocked); renderAchievements();
        newly.forEach((a, i) => setTimeout(() => { toast("✦ Unlocked: " + a.title); playSound("achievement"); fireConfetti(50); }, i * 400));
    }
}
let confettiRaf = null;
function fireConfetti(count) {
    count = count || 80;
    const canvas = $("confettiCanvas"); if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.classList.add("active");
    const colors = ["#3ddc97","#24b47e","#e8b458","#4a9eff","#a78bfa","#ff6b81"];
    const parts = [];
    for (let i = 0; i < count; i++) parts.push({
        x: window.innerWidth/2 + (Math.random()-0.5)*240,
        y: window.innerHeight/2 - 50,
        vx: (Math.random()-0.5)*9, vy: Math.random()*-9 - 3,
        size: Math.random()*8 + 4,
        color: colors[Math.floor(Math.random()*colors.length)],
        rot: Math.random()*Math.PI, vrot: (Math.random()-0.5)*0.3,
        life: 0, max: 90 + Math.random()*40
    });
    const grav = 0.28;
    if (confettiRaf) cancelAnimationFrame(confettiRaf);
    function frame() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        let alive = 0;
        parts.forEach(p => {
            if (p.life > p.max) return;
            alive++; p.life++;
            p.x += p.vx; p.y += p.vy; p.vy += grav; p.vx *= 0.995; p.rot += p.vrot;
            const a = Math.max(0, 1 - p.life/p.max);
            ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.5); ctx.restore();
        });
        if (alive > 0) confettiRaf = requestAnimationFrame(frame);
        else { cancelAnimationFrame(confettiRaf); confettiRaf = null; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); canvas.classList.remove("active"); }
    }
    frame();
}

/* Session lifecycle */
function resetSession() {
    clearInterval(game.timer);
    clearTimeout(game.feedbackTimer);
    clearInterval(game.countdownTimer);
    game.timer = null;
    game.running = false; game.paused = false; game.completed = false;
    game.duration = Number($("durationSelect").value) || 60;
    game.timeLeft = game.duration;
    game.correct = 0; game.mistakes = 0; game.streak = 0; game.bestStreak = 0;
    game.lastTick = -1; game.reactionTimes = []; game.questionIndex = 0;
    game.adaptiveRecentSquares = [];
    game.dualStep = 0; game.dualTarget = null; game.autoSide = null;
    game.dailyActive = false; game.dailyPractice = false; game.dailySequence = []; game.dailyStart = 0;

    $("sessionStateText").textContent = "READY";
    $("topStatus").textContent = "READY";
    $("startBtnText").textContent = "Start session";
    $("pauseBtn").textContent = "Pause"; $("pauseBtn").disabled = true;
    $("pauseOverlay").classList.add("hidden");
    $("countdownOverlay").classList.add("hidden");
    $("resultsPanel").classList.add("hidden");
    $("dailyResultActions").classList.add("hidden");
    $("newRecord").classList.add("hidden");
    $("sessionCorrect").textContent = "00";
    $("sessionAccuracy").innerHTML = "100<small>%</small>";
    $("sessionAccuracy").style.color = "var(--green)";
    $("sessionStreak").textContent = "00";

    if (game.mode === "mindpalace") {
        $("mpPanel").classList.remove("hidden");
        $("targetPanel").classList.add("hidden");
        $("mpDifficultyBar").classList.remove("hidden");
        $("perspectiveBar").classList.add("hidden");
        updateMPPhaseUI("READY", "Ready when you are.");
        $("mpCountdown").classList.add("hidden");
        $("mpRebuildUI").classList.add("hidden");
        $("mpResults").classList.add("hidden");
        clearMPPieces();
        clearHighlights();
        enableBoard(false);
        updateMPProgress();
        updateMPLiveStats();
        const rn = $("mpRoundNumber"); if (rn) rn.textContent = `ROUND 00 / ${MP_SESSION_ROUNDS}`;
        const v = $("timerDisplay"); if (v) { v.textContent = "0"; v.style.color = "var(--gold)"; }
    } else {
        $("mpPanel").classList.add("hidden");
        $("targetPanel").classList.remove("hidden");
        $("mpDifficultyBar").classList.add("hidden");
        $("perspectiveBar").classList.remove("hidden");
        updateTimer(); updateProgress(); resetTarget(); enableBoard(false);
    }
}
function startSession() {
    if (game.running) { finishSession(); return; }
    if (game.mode === "mindpalace") { startMindPalaceSession(); return; }
    if (game.mode === "daily") { startDailySession(false); return; }

    resetSession();
    squareBag.reset();
    game.autoSide = null;
    if (game.mode === "blindfold") {
        document.body.setAttribute("data-labels", "false");
        document.body.setAttribute("data-coords", "hidden");
    } else {
        document.body.setAttribute("data-labels", load(KEYS.labels, false) ? "true" : "false");
        document.body.setAttribute("data-coords", load(KEYS.coords, true) !== false ? "visible" : "hidden");
    }
    if (isDualMode() || isAutoMode()) setBoardFlip(false);
    else applyFlipForQuestion(true);
    if (game.piecesEnabled) generatePieces();

    $("countdownOverlay").classList.remove("hidden");
    let count = 3; $("countdownNumber").textContent = count; playSound("count");
    clearInterval(game.countdownTimer);
    game.countdownTimer = setInterval(() => {
        count--;
        if (count > 0) { $("countdownNumber").textContent = count; playSound("count"); }
        else { clearInterval(game.countdownTimer); $("countdownOverlay").classList.add("hidden"); beginPlay(); }
    }, 800);
}
function beginPlay() {
    game.duration = Number($("durationSelect").value) || 60;
    game.timeLeft = game.duration;
    game.running = true; game.paused = false;
    $("sessionStateText").textContent = "LIVE";
    $("topStatus").textContent = "TRAINING LIVE";
    $("startBtnText").textContent = "End session";
    $("pauseBtn").disabled = false;
    enableBoard(game.mode !== "coordinate" && game.mode !== "reverse" && game.mode !== "color");
    genTarget(); updateLive(); updateTimer(); playSound("start");
    clearInterval(game.timer); game.timer = setInterval(tick, 1000);
    if (music.panelOpen && !isMusicPlaying()) {
        if (music.source === "stream" && music.ytReady) playStream();
        else if (music.source === "local" && music.localTracks.length) {
            if (!music.audioEl.src) playLocalIdx(music.localIndex);
            else music.audioEl.play().catch(() => {});
        }
    }
}
function startDailySession(practice) {
            if (game.running) { toast("Finish the current challenge first."); return; }
            const dateKey = dailyDateKey();
            dailyStateFor(dateKey);
            resetSession();
            game.mode = "daily";
            game.dailyActive = true;
            game.dailyPractice = !!practice;
            game.dailySequence = buildDailySequence(dateKey);
            game.dailyStart = 0;
            game.duration = 0;
            document.body.setAttribute("data-labels", "false");
            document.body.setAttribute("data-coords", "visible");
            setView("training");
            document.querySelectorAll(".mode-btn").forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            $("trainingTitle").textContent = "ChessVision Daily";
            $("trainingSub").textContent = practice ? "Practice replay · does not replace your official result." : "Official daily challenge · 20 seeded questions.";
            $("adaptiveStatus").classList.add("hidden");
            $("perspectiveBar").classList.add("hidden");
            $("mpDifficultyBar").classList.add("hidden");
            $("targetPanel").classList.remove("hidden");
            $("mpPanel").classList.add("hidden");
            $("countdownOverlay").classList.remove("hidden");
            let count = 3;
            $("countdownNumber").textContent = count;
            playSound("count");
            clearInterval(game.countdownTimer);
            game.countdownTimer = setInterval(() => {
                count--;
                if (count > 0) { $("countdownNumber").textContent = count; playSound("count"); }
                else {
                    clearInterval(game.countdownTimer);
                    $("countdownOverlay").classList.add("hidden");
                    beginDailyPlay();
                }
            }, 800);
        }
function beginDailyPlay() {
            game.running = true;
            game.paused = false;
            game.dailyStart = Date.now();
            $("sessionStateText").textContent = game.dailyPractice ? "PRACTICE" : "OFFICIAL";
            $("topStatus").textContent = game.dailyPractice ? "DAILY PRACTICE" : "DAILY LIVE";
            $("startBtnText").textContent = "End challenge";
            $("pauseBtn").disabled = true;
            enableBoard(true);
            genTarget();
            updateLive();
            updateDailyTimer();
            clearInterval(game.timer);
            game.timer = setInterval(updateDailyTimer, 1000);
            playSound("start");
        }
function updateDailyTimer() {
            const el = $("timerDisplay");
            if (!el || !game.dailyActive || !game.dailyStart) return;
            el.textContent = fmtTime(Math.floor((Date.now() - game.dailyStart) / 1000));
            el.style.color = "var(--gold)";
}
function tick() {
    if (!game.running || game.paused) return;
    game.timeLeft = Math.max(0, game.timeLeft - 1);
    updateTimer(); updateProgress();
    if (game.ticks && game.timeLeft <= 10 && game.timeLeft > 0 && game.timeLeft !== game.lastTick) {
        game.lastTick = game.timeLeft; playSound("tick");
    }
    if (game.timeLeft === 0) finishSession();
}
function togglePause() {
    if (!game.running) return;
    if (game.mode === "mindpalace" || game.dailyActive) { toast("Pause is not available in this challenge."); return; }
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
    if (game.mode === "mindpalace") { endMindPalaceSession(); return; }
    if (game.dailyActive) { finishDailyChallenge(); return; }

    game.running = false; game.paused = false; game.completed = true;
    clearInterval(game.timer); clearTimeout(game.feedbackTimer); game.timer = null;
    $("sessionStateText").textContent = "COMPLETE";
    $("topStatus").textContent = "SESSION COMPLETE";
    $("startBtnText").textContent = "Train again";
    $("pauseBtn").disabled = true; $("pauseBtn").textContent = "Pause";
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
    if (isDualMode()) gained += Math.round(gained * 0.15);
    if (isAutoMode()) gained += Math.round(gained * 0.10);
    addXp(gained);

    const avgRt = game.reactionTimes.length ? Math.round(game.reactionTimes.reduce((a,b)=>a+b,0)/game.reactionTimes.length) : 0;
    const result = {
        correct: game.correct, mistakes: game.mistakes, accuracy: acc,
        bestStreak: game.bestStreak, duration: game.duration, mode: game.mode,
        perspective: game.perspective, xp: gained, avgReaction: avgRt,
        date: new Date().toISOString()
    };
    const ratingUpdate = updateVisionRating();
    result.rating = visionRating.current;
    result.ratingDelta = ratingUpdate.delta;
    result.ratingPerformance = ratingUpdate.performance;
    history.unshift(result); history = history.slice(0, 50);
    save(KEYS.stats, stats); save(KEYS.history, history);
    updateDashboard(); renderHistory(); renderAnalytics(); updateLevelUI();
    checkAchievements(); showResults(newRecord, gained);
    playSound("finish");
    if (newRecord && game.correct > 0) fireConfetti(140);
    else if (game.correct >= 20) fireConfetti(80);
    $("resultsPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function finishDailyChallenge() {
    if (!game.running) return;
    if (game.questionIndex < game.dailySequence.length) {
        toast("Complete all 20 daily questions before finishing.");
        return;
    }
    game.running = false;
    clearInterval(game.timer);
    clearTimeout(game.feedbackTimer);
    game.timer = null;
    const dateKey = dailyDateKey();
    const state = dailyStateFor(dateKey);
    const completionTime = Math.max(0, Math.round((Date.now() - game.dailyStart) / 1000));
    const official = !game.dailyPractice && !dailyOfficialAttempt();
    const ratingUpdate = official ? updateVisionRating() : null;
    const attempt = {
        official,
        score: game.correct * 2,
        correct: game.correct,
        accuracy: Math.round(game.correct / game.dailySequence.length * 100),
        completionTime,
        streak: game.bestStreak,
        ratingDelta: ratingUpdate ? ratingUpdate.delta : 0,
        completedAt: new Date().toISOString()
    };
    state.attempts.push(attempt);
    if (official) {
        const previousDate = state.lastCompletedDate;
        const yesterday = new Date(Date.parse(dateKey + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
        state.streak = previousDate === yesterday ? (state.streak || 0) + 1 : 1;
        state.lastCompletedDate = dateKey;
    }
    attempt.dailyStreak = state.streak || 0;
    state.attempts = state.attempts.slice(-20);
    save(KEYS.dailyChallenge, state);

    stats.totalSessions++;
    stats.totalTime = (stats.totalTime || 0) + completionTime;
    stats.totalQuestions = (stats.totalQuestions || 0) + game.dailySequence.length;
    stats.personalBest = Math.max(stats.personalBest || 0, game.correct);
    const gained = game.correct * 4 + (official ? 20 : 0);
    addXp(gained);
    const result = {
        correct: game.correct, mistakes: game.mistakes, accuracy: attempt.accuracy,
        bestStreak: game.bestStreak, duration: completionTime, mode: "daily",
        perspective: "white", xp: gained, score: attempt.score,
        official, dailyNumber: dailyChallengeNumber(dateKey), ratingDelta: attempt.ratingDelta,
        date: attempt.completedAt
    };
    history.unshift(result);
    history = history.slice(0, 50);
    save(KEYS.stats, stats);
    save(KEYS.history, history);
    $("sessionStateText").textContent = "COMPLETE";
    $("topStatus").textContent = official ? "DAILY COMPLETE" : "PRACTICE COMPLETE";
    $("startBtnText").textContent = "Play again";
    $("pauseBtn").disabled = true;
    enableBoard(false);
    $("targetPanel").classList.remove("correct", "wrong");
    $("targetHint").textContent = official ? "Official result saved for today." : "Practice result saved separately.";
    clearHighlights();
    showDailyResults(attempt, gained, dailyChallengeNumber(dateKey));
    updateDashboard();
    updateDailyUI();
    renderHistory();
    renderAnalytics();
    updateLevelUI();
    playSound("finish");
    if (official && game.correct >= 15) fireConfetti(100);
}
function showDailyResults(attempt, gained, challengeNumber) {
    $("resultPrimaryLabel").textContent = "SCORE";
    $("resultTitle").textContent = attempt.official ? "Daily challenge complete!" : "Practice replay complete";
    $("resultDescription").textContent = attempt.official
        ? "Vision Rating " + (attempt.ratingDelta >= 0 ? "+" : "") + attempt.ratingDelta + " · Your official first attempt is locked for today."
        : "This replay does not replace your official daily result.";
    $("resultCorrect").textContent = attempt.score + "/40";
    $("resultAccuracy").textContent = attempt.accuracy + "%";
    $("resultStreak").textContent = attempt.dailyStreak;
    $("resultXp").textContent = "+" + gained;
    $("newRecord").classList.toggle("hidden", !attempt.official);
    $("resultRestart").classList.add("hidden");
    $("resultsPanel").classList.remove("hidden");
    $("dailyResultActions").classList.remove("hidden");
    $("dailyReplayBtn").textContent = attempt.official ? "Replay as practice" : "Replay again";
    $("dailyShareBtn").dataset.shareText =
        "ChessVision Daily #" + challengeNumber + "\n" +
        attempt.score + "/40\n" + attempt.accuracy + "% accuracy\n" +
        "Completion time " + fmtTime(attempt.completionTime) + "\n" +
        "Daily streak " + attempt.dailyStreak + "\n" +
        (attempt.official
            ? "Vision Rating " + (attempt.ratingDelta >= 0 ? "+" : "") + attempt.ratingDelta
            : "Practice replay · no official result or rating change");
}
function showResults(newRecord, gained) {
    $("resultPrimaryLabel").textContent = "CORRECT";
    $("resultCorrect").textContent = game.correct;
    $("resultAccuracy").textContent = accuracy() + "%";
    $("resultStreak").textContent = game.bestStreak;
    $("resultXp").textContent = "+" + gained;
    if (game.correct >= 30) { $("resultTitle").textContent = "Outstanding vision!"; $("resultDescription").textContent = "Elite performance. Keep challenging yourself."; }
    else if (game.correct >= 20) { $("resultTitle").textContent = "Excellent session!"; $("resultDescription").textContent = "Your recognition speed is sharpening fast."; }
    else if (game.correct >= 10) { $("resultTitle").textContent = "Good progress!"; $("resultDescription").textContent = "You are building reliable board vision."; }
    else if (game.correct > 0) { $("resultTitle").textContent = "Well played!"; $("resultDescription").textContent = "Every correct answer strengthens your vision."; }
    else { $("resultTitle").textContent = "Every session counts!"; $("resultDescription").textContent = "Review the file and rank layout, then try again."; }
    $("newRecord").classList.toggle("hidden", !newRecord);
    $("dailyResultActions").classList.add("hidden");
    $("resultRestart").classList.remove("hidden");
    $("resultsPanel").classList.remove("hidden");
}

/* View routing */
const VIEW_TITLES = {
    dashboard: ["Home","Dashboard"], training: ["Workspace","Training"],
    mindpalace: ["Signature","Mind Palace"], daily: ["Challenge","Daily Challenge"], analytics: ["Workspace","Analytics"],
    achievements: ["Workspace","Achievements"], settings: ["Workspace","Settings"]
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
    if (name === "mindpalace") updateMindPalaceUI();
    if (name === "daily") renderDailyChallenge();
}
function setupNav() {
    document.querySelectorAll("[data-nav]").forEach(el => {
        el.addEventListener("click", e => { e.preventDefault(); setView(el.dataset.nav); });
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
    $("dailyChallengeBtn").addEventListener("click", () => {
        const official = !dailyOfficialAttempt();
        setView(official ? "daily" : "training");
        setTimeout(() => startDailySession(!official), 320);
    });
    document.querySelectorAll(".mode-card").forEach(el => {
        el.addEventListener("click", () => {
            if (el.dataset.nav) { setView(el.dataset.nav); return; }
            setMode(el.dataset.mode);
            setView("training");
            setTimeout(() => startSession(), 320);
        });
    });
}
function setMode(mode) {
    if (!MODE_INFO[mode]) return;
    if (game.running) { toast("Finish the current session to change mode."); return; }
    game.mode = mode;
    updateAdaptiveUI();
    document.querySelectorAll(".mode-btn").forEach(b => {
        const on = b.dataset.mode === mode;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("trainingTitle").textContent = MODE_INFO[mode].label;
    $("trainingSub").textContent = MODE_INFO[mode].sub;

    if (mode === "mindpalace") {
        $("mpDifficultyBar").classList.remove("hidden");
        $("perspectiveBar").classList.add("hidden");
        $("targetPanel").classList.add("hidden");
        $("mpPanel").classList.remove("hidden");
        updateMPDifficultyUI();
    } else if (mode === "daily") {
        $("mpDifficultyBar").classList.add("hidden");
        $("perspectiveBar").classList.add("hidden");
        $("targetPanel").classList.remove("hidden");
        $("mpPanel").classList.add("hidden");
    } else {
        abortMindPalaceSession();
        $("mpDifficultyBar").classList.add("hidden");
        $("perspectiveBar").classList.remove("hidden");
        $("targetPanel").classList.remove("hidden");
        $("mpPanel").classList.add("hidden");
    }
    renderMission();
    resetSession();
}
function renderMission() {
    const steps = MISSION_STEPS[game.mode];
    const c = $("missionSteps"); if (!c) return; c.innerHTML = "";
    steps.forEach((s, i) => {
        const el = document.createElement("div");
        el.className = "mission-step";
        el.innerHTML = '<span class="step-number">' + String(i+1).padStart(2,"0") + '</span><div><strong>' + s.title + '</strong><p>' + s.text + '</p></div>';
        c.appendChild(el);
    });
    $("missionTitle").textContent = MODE_INFO[game.mode].label;
}

/* Theme / settings */
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
function setLabels(on) { document.body.dataset.labels = on ? "true" : "false"; $("labelsToggle").checked = on; save(KEYS.labels, on); }
function setCoords(on) { document.body.dataset.coords = on ? "visible" : "hidden"; $("coordsToggle").checked = on; save(KEYS.coords, on); }
function setBoardSize(pct) {
    const w = $("boardWrapper"); if (w) w.style.maxWidth = (660 * pct/100) + "px";
    $("boardSize").value = pct; save(KEYS.boardSize, pct);
}
function setupSettings() {
    $("appearanceTheme").addEventListener("change", e => { setTheme(e.target.value); toast("Theme: " + e.target.options[e.target.selectedIndex].text); });
    $("boardTheme").addEventListener("change", e => { setBoardTheme(e.target.value); toast("Board theme updated."); });
    $("boardSize").addEventListener("input", e => setBoardSize(Number(e.target.value)));
    $("labelsToggle").addEventListener("change", e => { setLabels(e.target.checked); toast(e.target.checked ? "Labels shown." : "Labels hidden."); });
    $("coordsToggle").addEventListener("change", e => { setCoords(e.target.checked); toast(e.target.checked ? "Coordinates shown." : "Coordinates hidden."); });
    $("piecesToggle").addEventListener("change", e => { setPiecesEnabled(e.target.checked); toast(e.target.checked ? "Pieces shown." : "Pieces hidden."); });
    $("flipToggle").addEventListener("change", e => {
        const on = e.target.checked;
        if (game.running) { e.target.checked = document.body.dataset.flip === "true"; toast("Finish the current session first."); return; }
        if (game.perspective === "mixed" || game.perspective === "both" || game.perspective === "auto") {
            e.target.checked = document.body.dataset.flip === "true"; toast("Flip is controlled by Board View."); return;
        }
        setPerspective(on ? "black" : "white");
        toast(on ? "Black view." : "White view.");
    });
    $("soundToggle").addEventListener("change", e => { game.sound = e.target.checked; save(KEYS.sound, game.sound); if (game.sound) playSound("correct"); toast(game.sound ? "Sound on." : "Sound off."); });
    $("volumeRange").addEventListener("input", e => { game.volume = Number(e.target.value)/100; save(KEYS.volume, game.volume); });
    $("ticksToggle").addEventListener("change", e => { game.ticks = e.target.checked; save(KEYS.ticks, game.ticks); toast(game.ticks ? "Ticks on." : "Ticks off."); });
    $("adaptiveToggle").addEventListener("change", e => {
        adaptiveEnabled = e.target.checked;
        save(KEYS.adaptive, adaptiveEnabled);
        updateAdaptiveUI();
        if (adaptiveEnabled) squareBag.reset();
        toast(adaptiveEnabled ? "Adaptive Training on." : "Adaptive Training off.");
    });
}
function updateAdaptiveUI() {
    const toggle = $("adaptiveToggle");
    if (toggle) toggle.checked = adaptiveEnabled;
    const status = $("adaptiveStatus");
    if (status) status.classList.toggle("hidden", !adaptiveEnabled || game.mode === "mindpalace");
}
function renderAnalytics() {
    const total = stats.totalCorrect || 0;
    const totalAtt = total + (stats.totalMistakes || 0);
    const acc = totalAtt > 0 ? Math.round(total/totalAtt*100) : 0;
    $("anTotal").textContent = total;
    $("anAccuracy").textContent = totalAtt > 0 ? acc + "%" : "—";
    const validRts = history.filter(h => h.avgReaction > 0);
    const avgRt = validRts.length ? Math.round(validRts.reduce((a,h)=>a+h.avgReaction,0)/validRts.length) : 0;
    $("anReaction").textContent = avgRt > 0 ? (avgRt/1000).toFixed(2) + "s" : "—";
    const totalMin = Math.round((stats.totalTime || 0)/60);
    $("anTime").textContent = totalMin >= 60 ? Math.floor(totalMin/60) + "h " + (totalMin%60) + "m" : totalMin + "m";
    renderChartBars("chartCorrect", history.slice(0,12).reverse().map(h => h.correct));
    renderChartBars("chartAccuracy", history.slice(0,12).reverse().map(h => h.accuracy), 100);
    const modeCounts = {};
    history.forEach(h => { modeCounts[h.mode] = (modeCounts[h.mode] || 0) + h.correct; });
    const modeArr = Object.entries(modeCounts).map(([k,v]) => ({ label: k.slice(0,4), val: v }));
    renderModeChart("chartModes", modeArr);
    renderActivityChart();
    renderIntelligence();
    renderVisionRating();
}
function calculateIntelligence() {
    const records = answerRecords.filter(r =>
        r && typeof r.targetSquare === "string" && FILES.includes(r.targetSquare[0]) &&
        RANKS.includes(Number(r.targetSquare[1])) && typeof r.correct === "boolean"
    );
    const aggregate = rows => {
        const total = rows.length, correct = rows.filter(r => r.correct).length;
        return { total, correct, accuracy: total ? Math.round(correct / total * 100) : null };
    };
    const byKey = (rows, keyFn) => {
        const groups = {};
        rows.forEach(r => { const key = keyFn(r); (groups[key] ||= []).push(r); });
        return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, {
            ...aggregate(values),
            averageReaction: values.length ? Math.round(values.reduce((sum, r) => sum + (Number(r.reactionTime) || 0), 0) / values.length) : null
        }]));
    };
    const recent = records.slice(-20);
    const squares = byKey(records, r => r.targetSquare);
    const files = byKey(records, r => r.targetSquare[0]);
    const ranks = byKey(records, r => r.targetSquare[1]);
    const colors = byKey(records, r => isLightSquare(r.targetSquare) ? "light" : "dark");
    const ranked = Object.entries(squares).filter(([, v]) => v.total >= 2)
        .map(([square, value]) => ({ square, ...value }))
        .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
    return { records, recent: aggregate(recent), longTerm: aggregate(records), squares, files, ranks, colors, weakest: ranked.slice(0, 5), strongest: ranked.slice(-5).reverse() };
}
function renderIntelligence() {
    const heatmap = $("weaknessHeatmap"), weakest = $("weakestSquares"), strongest = $("strongestSquares");
    if (!heatmap || !weakest || !strongest) return;
    const data = calculateIntelligence();
    const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
    const filesAxis = $("heatmapFiles"), ranksAxis = $("heatmapRanks");
    if (filesAxis) filesAxis.innerHTML = FILES.map(file => "<span>" + file + "</span>").join("");
    if (ranksAxis) ranksAxis.innerHTML = RANKS.map(rank => "<span>" + rank + "</span>").join("");
    set("intelligenceSample", data.records.length + (data.records.length === 1 ? " answer" : " answers"));
    if (!data.records.length) {
        set("intelligenceSummary", "No answer data yet.");
        setRecommendation("Complete at least a few answers to reveal square-specific patterns.");
    } else {
        const recent = data.recent.accuracy + "% recent";
        const longTerm = data.longTerm.accuracy + "% long-term";
        const light = data.colors.light && data.colors.light.accuracy !== null ? data.colors.light.accuracy + "% light squares" : "— light squares";
        const dark = data.colors.dark && data.colors.dark.accuracy !== null ? data.colors.dark.accuracy + "% dark squares" : "— dark squares";
        set("intelligenceSummary", recent + " · " + longTerm + " · " + light + " · " + dark);
        setRecommendation(buildRecommendation(data));
    }
    heatmap.innerHTML = "";
    for (const rank of RANKS) for (const file of FILES) {
        const square = file + rank, value = data.squares[square], cell = document.createElement("div");
        const accuracyValue = value ? value.accuracy : null;
        cell.className = "heatmap-cell " + (accuracyValue === null ? "no-data" : accuracyValue < 60 ? "weak" : accuracyValue < 80 ? "mid" : "strong");
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", square + (value ? ": " + accuracyValue + "% accuracy, " + value.total + " attempts" : ": no data"));
        cell.title = value ? square + " · " + accuracyValue + "% · " + value.total + " attempts · avg " + (value.averageReaction / 1000).toFixed(2) + "s" : square + " · No data";
        cell.textContent = accuracyValue === null ? "·" : accuracyValue + "%";
        if (value) {
            const count = document.createElement("small");
            count.textContent = value.total;
            cell.appendChild(count);
        }
        heatmap.appendChild(cell);
    }
    renderIntelligenceList(weakest, data.weakest, "Not enough repeated data yet.");
    renderIntelligenceList(strongest, data.strongest, "Not enough repeated data yet.");
}
function renderIntelligenceList(container, entries, emptyText) {
    container.innerHTML = "";
    if (!entries.length) { container.innerHTML = '<span class="intelligence-list-empty">' + emptyText + "</span>"; return; }
    entries.forEach(entry => {
        const chip = document.createElement("span");
        chip.className = "intelligence-chip";
        chip.innerHTML = entry.square.toUpperCase() + " <strong>" + entry.accuracy + "%</strong>";
        chip.title = entry.total + " attempts · average reaction " + (entry.averageReaction / 1000).toFixed(2) + "s";
        container.appendChild(chip);
    });
}
function setRecommendation(message) {
    const card = $("recommendationCard"); if (!card) return;
    card.innerHTML = "<strong>Recommended Training</strong><p>" + message + "</p>";
}
function buildRecommendation(data) {
    if (data.records.length < 8 || !data.weakest.length) return "Keep training across different squares. More recorded answers will make this recommendation specific.";
    const weak = data.weakest.map(item => item.square);
    const kingsideBack = weak.filter(s => ["g","h"].includes(s[0]) && ["7","8"].includes(s[1])).length;
    const queensideBack = weak.filter(s => ["a","b"].includes(s[0]) && ["7","8"].includes(s[1])).length;
    const center = weak.filter(s => ["d","e"].includes(s[0]) && ["4","5"].includes(s[1])).length;
    if (kingsideBack >= 2) return "Focus on kingside back-rank squares.";
    if (queensideBack >= 2) return "Focus on queenside back-rank squares.";
    if (center >= 2) return "Focus on central squares around d4, e4, d5, and e5.";
    const weakFiles = Object.entries(data.files).filter(([, v]) => v.accuracy !== null).sort((a, b) => a[1].accuracy - b[1].accuracy);
    if (weakFiles.length && weakFiles[0][1].accuracy < 70) return "Spend extra practice on the " + weakFiles[0][0].toUpperCase() + "-file.";
    return "Repeat your weakest highlighted squares in short, focused sessions.";
}
function renderChartBars(id, values, maxOverride) {
    const c = $(id); if (!c) return; c.innerHTML = "";
    if (!values.length) { c.innerHTML = '<div class="chart-empty">No sessions yet</div>'; return; }
    const max = maxOverride || Math.max(...values, 1);
    values.forEach((v, i) => {
        const bar = document.createElement("div"); bar.className = "chart-bar";
        bar.style.height = Math.max(6, (v/max)*100) + "%";
        const label = document.createElement("span"); label.textContent = v; bar.appendChild(label);
        bar.style.transitionDelay = (i*40) + "ms";
        c.appendChild(bar);
    });
}
function renderModeChart(id, arr) {
    const c = $(id); if (!c) return; c.innerHTML = "";
    if (!arr.length) { c.innerHTML = '<div class="chart-empty">No mode data yet</div>'; return; }
    const max = Math.max(...arr.map(a => a.val), 1);
    arr.forEach((a, i) => {
        const bar = document.createElement("div"); bar.className = "chart-bar mode-bar";
        bar.style.height = Math.max(6, (a.val/max)*100) + "%";
        const label = document.createElement("span"); label.textContent = a.label; bar.appendChild(label);
        bar.title = a.label + ": " + a.val;
        bar.style.transitionDelay = (i*40) + "ms";
        c.appendChild(bar);
    });
}
function renderActivityChart() {
    const c = $("chartActivity"); if (!c) return; c.innerHTML = "";
    const days = {};
    for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
        days[k] = 0;
    }
    history.forEach(h => {
        const d = new Date(h.date);
        const k = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
        if (k in days) days[k] += h.correct;
    });
    const entries = Object.entries(days);
    const max = Math.max(...entries.map(e => e[1]), 1);
    entries.forEach(([k, v], i) => {
        const bar = document.createElement("div"); bar.className = "chart-bar";
        bar.style.height = Math.max(5, (v/max)*100) + "%";
        const label = document.createElement("span"); label.textContent = k.slice(-2); bar.appendChild(label);
        bar.title = k + ": " + v + " correct";
        bar.style.transitionDelay = (i*30) + "ms";
        c.appendChild(bar);
    });
}
function renderHistory() {
    const list = $("historyList"), dash = $("dashboardHistory");
    if (list) list.innerHTML = ""; if (dash) dash.innerHTML = "";
    if (!history.length) {
        const empty = '<div class="empty-state"><span>♞</span><p>No sessions yet — start training to record your first one.</p></div>';
        if (list) list.innerHTML = empty; if (dash) dash.innerHTML = empty; return;
    }
    const perspNames = { white:"White", black:"Black", mixed:"Mixed", both:"Both", auto:"Auto" };
    history.slice(0, 10).forEach((s, i) => {
        const d = new Date(s.date);
        const dateTxt = d.toLocaleDateString(undefined, { month:"short", day:"numeric" });
        const timeTxt = d.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
        const modeLabel = MODE_INFO[s.mode] ? MODE_INFO[s.mode].label : "Training";
        const perspLabel = s.perspective && s.perspective !== "white" ? " · " + (perspNames[s.perspective] || s.perspective) : "";
        const scoreLabel = s.visionScore ? ` · VS ${s.visionScore}` : "";
        const html = '<div class="history-item-icon">♞</div>' +
            '<div class="history-item-info"><strong>' + modeLabel + perspLabel + '</strong><span>' + dateTxt + ' · ' + timeTxt + ' · ' + Math.round(s.duration/60) + 'm' + scoreLabel + '</span></div>' +
            '<div class="history-item-score"><strong>' + s.correct + '</strong><span>' + s.accuracy + '% accuracy</span></div>';
        const item1 = document.createElement("div"); item1.className = "history-item"; item1.innerHTML = html;
        if (list) list.appendChild(item1);
        if (i < 5 && dash) { const item2 = document.createElement("div"); item2.className = "history-item"; item2.innerHTML = html; dash.appendChild(item2); }
    });
}
function clearHistory() {
    if (!history.length) { toast("No history to clear."); return; }
    openConfirm("Clear session history?", "Your lifetime stats and personal best will remain.", () => {
        history = []; save(KEYS.history, history);
        renderHistory(); renderAnalytics();
        toast("Session history cleared.");
    });
}

/* Confirm modal */
let confirmCallback = null;
function openConfirm(title, msg, cb) {
    $("confirmTitle").textContent = title;
    $("confirmMessage").textContent = msg;
    confirmCallback = cb;
    $("confirmOverlay").classList.remove("hidden");
}
function closeConfirm() { $("confirmOverlay").classList.add("hidden"); confirmCallback = null; }

/* Export / Import / Reset */
function exportData() {
    const payload = {
        version: 3.9, exportedAt: new Date().toISOString(),
        stats, history, answerRecords, visionRating, xp, unlocked, daily, dailyChallenge,
        settings: {
            theme: document.body.dataset.theme, board: document.body.dataset.board,
            perspective: game.perspective, flip: document.body.dataset.flip === "true",
            labels: document.body.dataset.labels === "true", coords: document.body.dataset.coords !== "hidden",
            pieces: game.piecesEnabled, sound: game.sound, volume: game.volume, ticks: game.ticks,
            boardSize: Number($("boardSize").value),
            musicVolume: music.volume, musicTrack: music.streamIndex,
            musicSource: music.source, musicWidget: { x: drag.offsetX, y: drag.offsetY },
            mpDifficulty: mindPalace.difficultyId, adaptive: adaptiveEnabled
        }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cvt-backup-" + todayKey() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
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
            if (Array.isArray(data.history)) { history = data.history.slice(0,50); save(KEYS.history, history); }
            if (Array.isArray(data.answerRecords)) { answerRecords = data.answerRecords.slice(-5000); save(KEYS.answerRecords, answerRecords); }
            if (data.visionRating && typeof data.visionRating === "object") {
                visionRating = {
                    current: clamp(Math.round(Number(data.visionRating.current) || 1000), 400, 2400),
                    history: Array.isArray(data.visionRating.history) ? data.visionRating.history.slice(-100) : []
                };
                save(KEYS.rating, visionRating);
            }
            if (typeof data.xp === "number") { xp = data.xp; save(KEYS.xp, xp); }
            if (Array.isArray(data.unlocked)) { unlocked = data.unlocked; save(KEYS.achievements, unlocked); }
            if (data.daily && data.daily.date) { daily = data.daily; save(KEYS.daily, daily); }
            if (data.dailyChallenge && Array.isArray(data.dailyChallenge.attempts)) {
                dailyChallenge = {
                    date: String(data.dailyChallenge.date || dailyDateKey()),
                    attempts: data.dailyChallenge.attempts.slice(-20),
                    streak: Number(data.dailyChallenge.streak) || 0,
                    lastCompletedDate: data.dailyChallenge.lastCompletedDate || null
                };
                save(KEYS.dailyChallenge, dailyChallenge);
            }
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
                if (typeof s.volume === "number") { game.volume = s.volume; $("volumeRange").value = Math.round(s.volume*100); save(KEYS.volume, s.volume); }
                if (typeof s.ticks === "boolean") { game.ticks = s.ticks; $("ticksToggle").checked = s.ticks; save(KEYS.ticks, s.ticks); }
                if (typeof s.boardSize === "number") setBoardSize(s.boardSize);
                if (typeof s.musicVolume === "number") { setMusicVol(s.musicVolume); const el = $("musicVolume"); if (el) el.value = Math.round(s.musicVolume*100); }
                if (typeof s.musicTrack === "number") setStream(s.musicTrack, false);
                if (typeof s.musicSource === "string") switchSource(s.musicSource);
                if (s.musicWidget) { drag.offsetX = Number(s.musicWidget.x) || 0; drag.offsetY = Number(s.musicWidget.y) || 0; applyWidgetPos(); saveWidgetPos(); }
                if (typeof s.mpDifficulty === "string") setMindPalaceDifficulty(s.mpDifficulty);
                if (typeof s.adaptive === "boolean") { adaptiveEnabled = s.adaptive; save(KEYS.adaptive, adaptiveEnabled); }
            }
            updateAdaptiveUI();             updateDashboard(); updateLevelUI(); updateDailyUI(); renderDailyChallenge(); renderAchievements();
            renderHistory(); renderAnalytics(); resetSession();
            toast("Backup imported.");
        } catch (err) { console.warn(err); toast("Import failed — invalid file."); }
    };
    r.readAsText(file);
}
function resetProgress() {
    openConfirm("Reset all progress?", "This will permanently delete your stats, history, XP, and achievements.", () => {
        stats = { ...DEFAULT_STATS };
        visionRating = { current: 1000, history: [] };
        history = []; answerRecords = []; unlocked = []; xp = 0;
        daily = { date: todayKey(), count: 0 };
        dailyChallenge = { date: dailyDateKey(), attempts: [], streak: 0, lastCompletedDate: null };
        save(KEYS.stats, stats); save(KEYS.history, history); save(KEYS.answerRecords, answerRecords); save(KEYS.rating, visionRating);
        save(KEYS.achievements, unlocked); save(KEYS.xp, xp); save(KEYS.daily, daily); save(KEYS.dailyChallenge, dailyChallenge);
        updateDashboard(); updateLevelUI(); updateDailyUI();
        renderAchievements(); renderHistory(); renderAnalytics();
        toast("Progress reset.");
    });
}

/* Keyboard */
function setupKeyboard() {
    document.addEventListener("keydown", e => {
        const t = e.target;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
        const k = e.key.toLowerCase();

        // MP-specific shortcuts during rebuild phase
        if (mindPalace.running && mindPalace.phase === "rebuild") {
            if (k === "u") { e.preventDefault(); undoMindPalaceAction(); return; }
            if (k === "c") { e.preventDefault(); clearMindPalacePlayer(); return; }
            if (e.key === "Enter") { e.preventDefault(); checkMindPalacePosition(); return; }
            if (e.key === "Escape") { e.preventDefault(); endMindPalaceSession(); return; }
        }

        if (k === "r") {
            e.preventDefault();
            if (game.running) finishSession(); else startSession();
        } else if (e.code === "Space") {
            e.preventDefault();
            if (game.running) togglePause(); else startSession();
        } else if (k === "f") { e.preventDefault(); toggleFullscreen(); }
        else if (k === "m") { e.preventDefault(); togglePanel(); }
        else if (e.key === "Escape") {
            document.body.classList.remove("sidebar-open");
            if (game.paused) togglePause();
            else if (game.running && game.mode !== "mindpalace") togglePause();
        }
    });
}
async function toggleFullscreen() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
    catch { toast("Fullscreen unavailable."); }
}
function checkOnboarding() { if (!load(KEYS.onboarded, false)) $("onboarding").classList.remove("hidden"); }
function completeOnboarding() { save(KEYS.onboarded, true); $("onboarding").classList.add("hidden"); toast("Welcome! Choose a mode to begin."); }
function setTip() { const day = Math.floor(Date.now() / (1000*60*60*24)); const el = $("tipText"); if (el) el.textContent = TIPS[day % TIPS.length]; }

/* Init */
function init() {
    buildCoords();
    buildBoard();

    setTheme(load(KEYS.theme, "dark"));
    setBoardTheme(load(KEYS.board, "emerald"));
    setLabels(load(KEYS.labels, false));
    setCoords(load(KEYS.coords, true) !== false);
    setBoardSize(Number(load(KEYS.boardSize, 100)) || 100);

    game.piecesEnabled = load(KEYS.pieces, false) === true;
    const pt = $("piecesToggle"); if (pt) pt.checked = game.piecesEnabled;
    game.sound = load(KEYS.sound, true) !== false;
    $("soundToggle").checked = game.sound;
    game.volume = Number(load(KEYS.volume, 0.6));
    if (isNaN(game.volume)) game.volume = 0.6;
    $("volumeRange").value = Math.round(game.volume * 100);
    game.ticks = load(KEYS.ticks, true) !== false;
    $("ticksToggle").checked = game.ticks;
    updateAdaptiveUI();

    $("startBtn").addEventListener("click", startSession);
    $("pauseBtn").addEventListener("click", togglePause);
    $("resumeBtn").addEventListener("click", togglePause);
    $("resultRestart").addEventListener("click", () => {
        startSession();
        $("training").scrollIntoView({ behavior:"smooth", block:"start" });
    });
    $("dailyReplayBtn").addEventListener("click", () => startDailySession(true));
    $("dailyViewStartBtn").addEventListener("click", () => {
        if (!dailyOfficialAttempt()) startDailySession(false);
    });
    $("dailyViewReplayBtn").addEventListener("click", () => startDailySession(true));
    $("dailyShareBtn").addEventListener("click", async e => {
        const text = e.currentTarget.dataset.shareText || "";
        try {
            if (navigator.share) await navigator.share({ title: "ChessVision Daily", text });
            else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast("Result copied to clipboard."); }
            else toast("Sharing is unavailable in this browser.");
        } catch (err) {
            if (err && err.name !== "AbortError") toast("Could not share this result.");
        }
    });
    $("durationSelect").addEventListener("change", () => {
        if (game.running) { $("durationSelect").value = game.duration; toast("Finish the current session first."); return; }
        resetSession();
    });
    document.querySelectorAll(".mode-btn").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
    document.querySelectorAll(".perspective-btn").forEach(b => {
        if (!b.dataset.perspective) return;
        b.addEventListener("click", () => {
            if (game.running) { toast("Finish the current session to change view."); return; }
            setPerspective(b.dataset.perspective);
            const labels = { white:"White's view", black:"Black's view (board flips)", mixed:"Mixed view (flips randomly)", both:"Both views (find each square twice)", auto:"Auto view (display swaps sides)" };
            toast("Board view: " + labels[b.dataset.perspective]);
        });
    });
    setPerspective(load(KEYS.perspective, "white"));
    if (game.piecesEnabled) generatePieces();

    setupNav();
    setupSettings();
    setupKeyboard();
    initMindPalace();

    $("confirmCancel").addEventListener("click", closeConfirm);
    $("confirmOk").addEventListener("click", () => { const cb = confirmCallback; closeConfirm(); if (cb) cb(); });
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
    console.log("Chess Vision Trainer v3.8 — Mind Palace rebuild game ready.");
}
document.addEventListener("DOMContentLoaded", () => { init(); runPreloader(); });
