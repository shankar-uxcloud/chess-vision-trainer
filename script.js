/* =========================================================
   VISION CHESS — COMPLETE TRAINING ENGINE
========================================================= */

"use strict";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEYS = {
    stats: "cvt-stats",
    history: "cvt-history",
    theme: "cvt-theme",
    board: "cvt-board-theme",
    sound: "cvt-sound"
};

function loadStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.warn("Storage read failed:", error);
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("Storage write failed:", error);
    }
}


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
    running: false,
    completed: false,

    timer: null,
    toastTimer: null,
    feedbackTimer: null,

    duration: 60,
    timeLeft: 60,

    correct: 0,
    mistakes: 0,

    streak: 0,
    bestSessionStreak: 0,

    target: null,
    lastCorrectSquare: null,
    lastWrongSquare: null,

    soundEnabled: true
};


let stats = loadStorage(STORAGE_KEYS.stats, {
    totalCorrect: 0,
    bestStreak: 0,
    personalBest: 0,
    totalSessions: 0
});

let history = loadStorage(STORAGE_KEYS.history, []);


/* Validate stored values */

if (!stats || typeof stats !== "object") {
    stats = {
        totalCorrect: 0,
        bestStreak: 0,
        personalBest: 0,
        totalSessions: 0
    };
}

if (!Array.isArray(history)) {
    history = [];
}


/* =========================================================
   BOARD CONFIGURATION
========================================================= */

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const BOARD_SIZE = 8;

const TIPS = [
    "Accuracy first, speed second. Smooth recognition becomes fast recognition.",
    "Learn the files from a to h. Knowing the board structure builds confidence.",
    "The center of the board is your reference point. Practice visualizing each square.",
    "Do not rush every answer. Build a reliable connection between files and ranks.",
    "Short daily practice sessions can help develop faster coordinate recognition.",
    "Try to recognize a square instantly instead of counting every file and rank.",
    "Look at the board as a complete grid. Train your eyes to move naturally.",
    "Consistency is the secret. A few focused minutes can build a lasting habit."
];


/* =========================================================
   SOUND ENGINE
========================================================= */

let audioContext = null;

function playSound(type = "correct") {
    if (!state.soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === "correct") {
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(660, now);
            oscillator.frequency.setValueAtTime(880, now + 0.07);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.13, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

            oscillator.start(now);
            oscillator.stop(now + 0.2);

        } else if (type === "wrong") {
            oscillator.type = "triangle";
            oscillator.frequency.setValueAtTime(220, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

            oscillator.start(now);
            oscillator.stop(now + 0.18);

        } else if (type === "finish") {
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(523, now);
            oscillator.frequency.setValueAtTime(659, now + 0.1);
            oscillator.frequency.setValueAtTime(784, now + 0.2);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

            oscillator.start(now);
            oscillator.stop(now + 0.4);
        }

    } catch (error) {
        console.warn("Audio unavailable:", error);
    }
}


/* =========================================================
   TOAST NOTIFICATIONS
========================================================= */

function showToast(message) {
    const toast = $("toast");

    $("toastMessage").textContent = message;

    toast.classList.add("show");

    clearTimeout(state.toastTimer);

    state.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}


/* =========================================================
   BOARD CREATION
========================================================= */

function createCoordinates() {
    $("topCoordinates").innerHTML = "";
    $("bottomCoordinates").innerHTML = "";
    $("leftCoordinates").innerHTML = "";
    $("rightCoordinates").innerHTML = "";

    FILES.forEach(file => {
        const top = document.createElement("span");
        const bottom = document.createElement("span");

        top.textContent = file;
        bottom.textContent = file;

        $("topCoordinates").appendChild(top);
        $("bottomCoordinates").appendChild(bottom);
    });

    RANKS.forEach(rank => {
        const left = document.createElement("span");
        const right = document.createElement("span");

        left.textContent = rank;
        right.textContent = rank;

        $("leftCoordinates").appendChild(left);
        $("rightCoordinates").appendChild(right);
    });
}


function createBoard() {
    const board = $("chessboard");

    board.innerHTML = "";

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {

            const square = document.createElement("button");

            const file = FILES[col];
            const rank = RANKS[row];

            const coordinate = `${file}${rank}`;

            const isLight = (row + col) % 2 === 0;

            square.type = "button";
            square.className = `square ${isLight ? "light" : "dark"}`;

            square.dataset.square = coordinate;

            square.setAttribute("role", "gridcell");
            square.setAttribute(
                "aria-label",
                `Square ${coordinate}`
            );

            square.setAttribute("aria-pressed", "false");

            square.disabled = true;

            square.addEventListener("click", () => {
                handleSquareClick(coordinate, square);
            });

            board.appendChild(square);
        }
    }
}


/* =========================================================
   BOARD HELPERS
========================================================= */

function getSquareElement(coordinate) {
    return document.querySelector(
        `.square[data-square="${coordinate}"]`
    );
}


function clearSquareHighlights() {
    document.querySelectorAll(".square").forEach(square => {
        square.classList.remove(
            "target-highlight",
            "last-correct",
            "last-wrong"
        );

        square.setAttribute("aria-pressed", "false");
    });
}


function setBoardEnabled(enabled) {
    document.querySelectorAll(".square").forEach(square => {
        square.disabled = !enabled;
    });
}


function setBoardTheme(theme) {
    document.body.dataset.board = theme;

    $("boardTheme").value = theme;

    saveStorage(STORAGE_KEYS.board, theme);
}


function applyBoardTheme() {
    const savedTheme = loadStorage(
        STORAGE_KEYS.board,
        "classic"
    );

    const allowed = [
        "classic",
        "wood",
        "blue",
        "green",
        "purple",
        "pink"
    ];

    setBoardTheme(
        allowed.includes(savedTheme) ? savedTheme : "classic"
    );
}


/* =========================================================
   TARGET GENERATION
========================================================= */

function generateTarget() {
    let coordinate;

    do {
        const file = FILES[Math.floor(Math.random() * 8)];
        const rank = RANKS[Math.floor(Math.random() * 8)];

        coordinate = `${file}${rank}`;

    } while (coordinate === state.target);

    state.target = coordinate;

    $("targetCoordinate").textContent = coordinate;

    $("targetHint").textContent =
        "Locate the file and rank on the board";

    $("targetFeedback").textContent = "";

    clearSquareHighlights();
}


function resetTargetDisplay() {
    state.target = null;

    $("targetCoordinate").textContent = "—";

    $("targetHint").textContent =
        "Start your session to begin";

    $("targetFeedback").textContent = "";

    $("targetVisual").classList.remove("correct");

    clearSquareHighlights();
}


/* =========================================================
   SESSION TIMER
========================================================= */

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


function updateTimerDisplay() {
    $("timerDisplay").textContent = formatTime(state.timeLeft);

    if (state.timeLeft <= 10 && state.running) {
        $("timerDisplay").style.color = "var(--red)";
    } else {
        $("timerDisplay").style.color = "var(--accent)";
    }
}


function startTimer() {
    clearInterval(state.timer);

    state.timer = setInterval(() => {
        if (!state.running) return;

        state.timeLeft--;

        if (state.timeLeft < 0) {
            state.timeLeft = 0;
        }

        updateTimerDisplay();
        updateProgress();

        if (state.timeLeft <= 0) {
            finishTraining();
        }

    }, 1000);
}


/* =========================================================
   SESSION STATISTICS
========================================================= */

function getAccuracy() {
    const attempts = state.correct + state.mistakes;

    if (attempts === 0) {
        return 100;
    }

    return Math.round(
        (state.correct / attempts) * 100
    );
}


function updateSessionStats() {
    $("sessionCorrect").textContent =
        String(state.correct).padStart(2, "0");

    $("sessionAccuracy").innerHTML =
        `${getAccuracy()}<span>%</span>`;

    $("sessionStreak").textContent =
        String(state.streak).padStart(2, "0");

    $("sessionAccuracy").style.color =
        getAccuracy() >= 80
            ? "var(--green)"
            : "var(--orange)";

    $("sessionStreak").style.color =
        state.streak >= 5
            ? "var(--orange)"
            : "var(--text)";
}


function updateProgress() {
    const elapsed = state.duration - state.timeLeft;

    const progress = state.duration > 0
        ? Math.min(
            100,
            Math.max(0, (elapsed / state.duration) * 100)
        )
        : 0;

    $("progressFill").style.width = `${progress}%`;

    $("progressText").textContent =
        `${Math.round(progress)}%`;
}


function updateDashboardStats() {
    $("totalCorrect").textContent =
        stats.totalCorrect || 0;

    $("bestStreak").textContent =
        stats.bestStreak || 0;

    $("personalBest").textContent =
        stats.personalBest || 0;

    $("sidebarBest").textContent =
        stats.personalBest || 0;

    $("totalSessions").textContent =
        stats.totalSessions || 0;
}


/* =========================================================
   SESSION RESET
========================================================= */

function resetSession() {
    clearInterval(state.timer);
    clearTimeout(state.feedbackTimer);

    state.running = false;
    state.completed = false;

    state.duration = Number($("durationSelect").value);
    state.timeLeft = state.duration;

    state.correct = 0;
    state.mistakes = 0;

    state.streak = 0;
    state.bestSessionStreak = 0;

    state.target = null;

    state.lastCorrectSquare = null;
    state.lastWrongSquare = null;

    updateTimerDisplay();
    updateSessionStats();
    updateProgress();

    $("progressFill").style.width = "0%";

    $("sessionState").classList.remove("running");
    $("sessionStateText").textContent = "READY";

    $("startBtnText").textContent = "Start training";

    $("resultsPanel").classList.add("hidden");
    $("newRecord").classList.add("hidden");

    resetTargetDisplay();

    setBoardEnabled(false);
}


/* =========================================================
   START TRAINING
========================================================= */

function startTraining() {
    if (state.running) {
        finishTraining();
        return;
    }

    resetSession();

    state.duration = Number($("durationSelect").value);
    state.timeLeft = state.duration;

    state.running = true;
    state.completed = false;

    $("sessionState").classList.add("running");
    $("sessionStateText").textContent = "LIVE";

    $("startBtnText").textContent = "End session";

    $("targetHint").textContent =
        "Find the coordinate and click its square";

    $("resultsPanel").classList.add("hidden");

    setBoardEnabled(true);

    generateTarget();

    updateTimerDisplay();
    updateSessionStats();

    startTimer();

    showToast("Training session started!");

    playSound("correct");
}


/* =========================================================
   HANDLE SQUARE CLICK
========================================================= */

function handleSquareClick(coordinate, square) {
    if (!state.running) {
        showToast("Start a session first!");
        return;
    }

    if (!state.target) return;

    if (coordinate === state.target) {
        handleCorrectAnswer(square);
    } else {
        handleWrongAnswer(square);
    }
}


/* =========================================================
   CORRECT ANSWER
========================================================= */

function handleCorrectAnswer(square) {
    state.correct++;

    state.streak++;

    state.bestSessionStreak = Math.max(
        state.bestSessionStreak,
        state.streak
    );

    stats.totalCorrect++;

    stats.bestStreak = Math.max(
        stats.bestStreak,
        state.streak
    );

    state.lastCorrectSquare = state.target;

    clearSquareHighlights();

    square.classList.add("last-correct");

    square.setAttribute("aria-pressed", "true");

    $("targetPanel").classList.remove("wrong");
    $("targetPanel").classList.add("correct");

    $("targetFeedback").textContent = "✓ CORRECT";

    $("targetFeedback").style.color = "var(--green)";

    $("targetHint").textContent =
        "Great recognition! Next coordinate coming...";

    $("targetCoordinate").style.color = "var(--green)";

    updateSessionStats();
    updateDashboardStats();

    saveStorage(STORAGE_KEYS.stats, stats);

    playSound("correct");

    if (state.streak > 0 && state.streak % 5 === 0) {
        showToast(`${state.streak} in a row! Excellent!`);
    }

    clearTimeout(state.feedbackTimer);

    state.feedbackTimer = setTimeout(() => {
        if (!state.running) return;

        $("targetPanel").classList.remove("correct");

        $("targetCoordinate").style.color = "";

        generateTarget();

    }, 220);
}


/* =========================================================
   WRONG ANSWER
========================================================= */

function handleWrongAnswer(square) {
    state.mistakes++;

    state.streak = 0;

    state.lastWrongSquare = square.dataset.square;

    clearSquareHighlights();

    square.classList.add("last-wrong");

    square.setAttribute("aria-pressed", "true");

    $("targetPanel").classList.remove("correct");
    $("targetPanel").classList.add("wrong");

    $("targetFeedback").textContent = "✕ TRY AGAIN";

    $("targetFeedback").style.color = "var(--red)";

    $("targetHint").textContent =
        `That was ${square.dataset.square}. Find ${state.target}.`;

    $("targetCoordinate").style.color = "var(--red)";

    updateSessionStats();

    playSound("wrong");

    clearTimeout(state.feedbackTimer);

    state.feedbackTimer = setTimeout(() => {
        $("targetPanel").classList.remove("wrong");

        $("targetCoordinate").style.color = "";

        $("targetFeedback").textContent = "";

        $("targetHint").textContent =
            "Try again — find the correct square";

        clearSquareHighlights();

    }, 450);
}


/* =========================================================
   FINISH TRAINING
========================================================= */

function finishTraining() {
    if (!state.running) return;

    state.running = false;
    state.completed = true;

    clearInterval(state.timer);
    clearTimeout(state.feedbackTimer);

    state.timer = null;

    $("sessionState").classList.remove("running");
    $("sessionStateText").textContent = "COMPLETE";

    $("startBtnText").textContent = "Train again";

    setBoardEnabled(false);

    $("targetPanel").classList.remove("correct", "wrong");

    $("targetCoordinate").style.color = "";

    $("targetHint").textContent =
        "Session completed! Review your results below.";

    $("targetFeedback").textContent = "";

    clearSquareHighlights();

    stats.totalSessions++;

    const previousBest = stats.personalBest || 0;

    const isNewRecord = state.correct > previousBest;

    stats.personalBest = Math.max(
        previousBest,
        state.correct
    );

    saveStorage(STORAGE_KEYS.stats, stats);

    const accuracy = getAccuracy();

    const sessionResult = {
        correct: state.correct,
        mistakes: state.mistakes,
        accuracy,
        bestStreak: state.bestSessionStreak,
        duration: state.duration,
        date: new Date().toISOString()
    };

    history.unshift(sessionResult);

    history = history.slice(0, 8);

    saveStorage(STORAGE_KEYS.history, history);

    updateDashboardStats();

    renderHistory();

    showResults(isNewRecord);

    playSound("finish");

    $("resultsPanel").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================================================
   RESULTS SCREEN
========================================================= */

function showResults(isNewRecord) {
    $("resultCorrect").textContent = state.correct;

    $("resultAccuracy").textContent =
        `${getAccuracy()}%`;

    $("resultStreak").textContent =
        state.bestSessionStreak;

    if (state.correct >= 30) {
        $("resultTitle").textContent = "Outstanding vision!";

        $("resultDescription").textContent =
            "Incredible work! Keep challenging yourself and maintain that accuracy.";

    } else if (state.correct >= 15) {
        $("resultTitle").textContent = "Excellent progress!";

        $("resultDescription").textContent =
            "You're building strong coordinate recognition. Keep practicing consistently.";

    } else if (state.correct > 0) {
        $("resultTitle").textContent = "Well played!";

        $("resultDescription").textContent =
            "Every correct answer counts. Continue training to improve your board vision.";

    } else {
        $("resultTitle").textContent = "Every session counts!";

        $("resultDescription").textContent =
            "Keep practicing the files and ranks. Your next session is another opportunity to improve.";
    }

    if (isNewRecord) {
        $("newRecord").classList.remove("hidden");
    } else {
        $("newRecord").classList.add("hidden");
    }

    $("resultsPanel").classList.remove("hidden");
}


/* =========================================================
   SESSION HISTORY
========================================================= */

function renderHistory() {
    const container = $("historyList");

    container.innerHTML = "";

    if (history.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-history";

        empty.innerHTML = `
            <span>♞</span>
            <p>Your completed sessions will appear here.</p>
        `;

        container.appendChild(empty);

        return;
    }

    history.forEach((session, index) => {
        const item = document.createElement("div");

        item.className = "history-item";

        const date = new Date(session.date);

        const dateLabel = date.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );

        const timeLabel = date.toLocaleTimeString(
            undefined,
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

        item.innerHTML = `
            <div class="history-item-icon">♞</div>

            <div class="history-item-info">
                <strong>Session ${history.length - index}</strong>
                <span>${dateLabel} · ${timeLabel}</span>
            </div>

            <div class="history-item-score">
                <strong>${session.correct}</strong>
                <span>${session.accuracy}% accuracy</span>
            </div>
        `;

        container.appendChild(item);
    });
}


/* =========================================================
   CLEAR HISTORY
========================================================= */

function clearHistory() {
    if (history.length === 0) {
        showToast("No training history to clear.");
        return;
    }

    const confirmed = confirm(
        "Clear all recent session history? Your personal best and lifetime statistics will remain."
    );

    if (!confirmed) return;

    history = [];

    saveStorage(STORAGE_KEYS.history, history);

    renderHistory();

    showToast("Session history cleared.");
}


/* =========================================================
   APPEARANCE THEMES
========================================================= */

function setAppearanceTheme(theme) {
    const allowed = [
        "dark",
        "light",
        "neon"
    ];

    if (!allowed.includes(theme)) {
        theme = "dark";
    }

    document.body.dataset.theme = theme;

    $("appearanceTheme").value = theme;

    saveStorage(STORAGE_KEYS.theme, theme);
}


function applyAppearanceTheme() {
    const savedTheme = loadStorage(
        STORAGE_KEYS.theme,
        "dark"
    );

    setAppearanceTheme(savedTheme);
}


/* =========================================================
   SOUND SETTING
========================================================= */

function applySoundSetting() {
    const saved = loadStorage(
        STORAGE_KEYS.sound,
        true
    );

    state.soundEnabled = saved !== false;

    $("soundToggle").checked = state.soundEnabled;
}


function toggleSound() {
    state.soundEnabled = $("soundToggle").checked;

    saveStorage(
        STORAGE_KEYS.sound,
        state.soundEnabled
    );

    if (state.soundEnabled) {
        playSound("correct");
        showToast("Sound effects enabled.");
    } else {
        showToast("Sound effects disabled.");
    }
}


/* =========================================================
   FULLSCREEN
========================================================= */

async function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();

            $("fullscreenBtn").textContent = "⛶";

        } else {
            await document.exitFullscreen();

            $("fullscreenBtn").textContent = "⛶";
        }

    } catch (error) {
        showToast("Fullscreen is not available in this browser.");
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(nav => {
                nav.classList.remove("active");
            });

            item.classList.add("active");
        });
    });
}


/* =========================================================
   DAILY TRAINING TIP
========================================================= */

function setDailyTip() {
    const day = new Date().getDate();

    const tipIndex = day % TIPS.length;

    $("tipText").textContent = TIPS[tipIndex];
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    $("startBtn").addEventListener("click", () => {
        startTraining();
    });


    $("resultRestart").addEventListener("click", () => {
        resetSession();
        startTraining();

        $("training").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });


    $("durationSelect").addEventListener("change", () => {
        if (state.running) {
            showToast("End the current session to change duration.");
            $("durationSelect").value = state.duration;
            return;
        }

        resetSession();
    });


    $("boardTheme").addEventListener("change", event => {
        setBoardTheme(event.target.value);

        showToast("Board theme updated.");
    });


    $("appearanceTheme").addEventListener("change", event => {
        setAppearanceTheme(event.target.value);

        showToast("Appearance updated.");
    });


    $("soundToggle").addEventListener("change", () => {
        toggleSound();
    });


    $("fullscreenBtn").addEventListener("click", () => {
        toggleFullscreen();
    });


    $("clearHistoryBtn").addEventListener("click", () => {
        clearHistory();
    });


    document.addEventListener("fullscreenchange", () => {
        $("fullscreenBtn").textContent =
            document.fullscreenElement ? "⛶" : "⛶";
    });


    /* Keyboard shortcuts */

    document.addEventListener("keydown", event => {

        const target = event.target;

        const isTyping =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT";

        if (isTyping) return;

        if (event.key.toLowerCase() === "r") {
            event.preventDefault();

            if (state.running) {
                finishTraining();
            } else {
                resetSession();
                startTraining();
            }
        }

        if (event.key.toLowerCase() === "t") {
            event.preventDefault();

            toggleFullscreen();
        }

        if (event.key === "Escape" && state.running) {
            finishTraining();
        }
    });
}


/* =========================================================
   INITIALIZATION
========================================================= */

function init() {

    createCoordinates();

    createBoard();

    applyAppearanceTheme();

    applyBoardTheme();

    applySoundSetting();

    updateDashboardStats();

    renderHistory();

    setDailyTip();

    setupEventListeners();

    setupNavigation();

    resetSession();

    updateDashboardStats();

    console.log(
        "%c♞ VISION CHESS",
        "color:#b99aff;font-size:20px;font-weight:bold;"
    );

    console.log(
        "%cChess Vision Trainer initialized successfully.",
        "color:#5be1b1;font-size:12px;"
    );
}


/* Start the app */

document.addEventListener("DOMContentLoaded", init);
