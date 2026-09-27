
/* =====================================================
   CHESS VISION TRAINER — VERSION 2.0
   Complete JavaScript
   ===================================================== */

/* ── DOM ELEMENTS ── */

const boardEl = document.getElementById("chessboard");
const targetCoordEl = document.getElementById("target-coord");
const targetHintEl = document.getElementById("target-hint");
const targetWrapper = document.getElementById("target-wrapper");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const timerSelect = document.getElementById("timer-select");

const scoreCorrectEl = document.getElementById("score-correct");
const scoreErrorsEl = document.getElementById("score-errors");
const scoreAccEl = document.getElementById("score-accuracy");
const scoreTimeEl = document.getElementById("score-time");

const progressBar = document.getElementById("progress-bar");

const resultsPanel = document.getElementById("results-panel");
const resCorrectEl = document.getElementById("res-correct");
const resErrorsEl = document.getElementById("res-errors");
const resAccEl = document.getElementById("res-accuracy");
const resGradeEl = document.getElementById("result-grade");

const rankLabelsEl = document.getElementById("rank-labels");
const rankLabelsREl = document.getElementById("rank-labels-right");
const fileLabelsEl = document.getElementById("file-labels");


/* ── GAME STATE ── */

let correct = 0;
let errors = 0;

let timeLeft = 60;
let totalTime = 60;

let timerInterval = null;
let currentTarget = "";

let isTraining = false;


/* ── AUDIO SYSTEM ── */

const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

let audioCtx = null;

function getAudioCtx() {
    if (!AudioContextClass) return null;

    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    return audioCtx;
}

function playTone(
    frequency,
    type = "sine",
    duration = 0.12,
    volume = 0.12
) {
    try {
        const ctx = getAudioCtx();

        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(volume, ctx.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + duration
        );

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);

    } catch (error) {
        console.log("Audio unavailable.");
    }
}

function playCorrectSound() {
    playTone(880, "sine", 0.14, 0.12);
}

function playWrongSound() {
    playTone(220, "sawtooth", 0.18, 0.08);
}

function playEndSound() {
    playTone(660, "sine", 0.12, 0.1);

    setTimeout(() => {
        playTone(880, "sine", 0.16, 0.1);
    }, 150);
}


/* ── CREATE CHESSBOARD ── */

function createBoard() {

    boardEl.innerHTML = "";
    rankLabelsEl.innerHTML = "";
    rankLabelsREl.innerHTML = "";
    fileLabelsEl.innerHTML = "";

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    // Rank labels

    ranks.forEach(rank => {

        const label = document.createElement("span");

        label.className = "rank-label";
        label.textContent = rank;

        rankLabelsEl.appendChild(label);

        const rightLabel = label.cloneNode(true);

        rankLabelsREl.appendChild(rightLabel);

    });

    // Board squares

    ranks.forEach(rank => {

        files.forEach((file, index) => {

            const square = document.createElement("div");

            const fileNumber = index + 1;

            const isLight = (fileNumber + rank) % 2 === 0;

            square.className =
                `square ${isLight ? "light" : "dark"}`;

            square.dataset.square = `${file}${rank}`;

            square.setAttribute(
                "aria-label",
                `${file}${rank}`
            );

            square.addEventListener("click", () => {
                handleSquareClick(square);
            });

            boardEl.appendChild(square);

        });

    });

    // File labels

    files.forEach(file => {

        const label = document.createElement("span");

        label.className = "file-label";
        label.textContent = file;

        fileLabelsEl.appendChild(label);

    });

}


/* ── GENERATE RANDOM COORDINATE ── */

function generateRandomSquare() {

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const file =
        files[Math.floor(Math.random() * 8)];

    const rank =
        Math.floor(Math.random() * 8) + 1;

    return `${file}${rank}`;

}


/* ── DISPLAY TARGET COORDINATE ── */

function displayNewCoordinate() {

    if (!isTraining) return;

    let next = generateRandomSquare();

    // Avoid repeating the same square consecutively

    while (next === currentTarget) {
        next = generateRandomSquare();
    }

    currentTarget = next;

    const colors = [
        "#f2ead8",
        "#c8a96e",
        "#ffffff"
    ];

    targetCoordEl.style.color =
        colors[Math.floor(Math.random() * colors.length)];

    targetCoordEl.classList.add("fade-out");

    setTimeout(() => {

        if (!isTraining) return;

        targetCoordEl.textContent = next;

        targetCoordEl.classList.remove("fade-out");
        targetCoordEl.classList.add("fade-in");

        setTimeout(() => {
            targetCoordEl.classList.remove("fade-in");
        }, 250);

    }, 100);

}


/* ── START TRAINING ── */

function startTraining() {

    clearInterval(timerInterval);

    correct = 0;
    errors = 0;

    isTraining = true;

    totalTime = parseInt(timerSelect.value, 10) || 60;
    timeLeft = totalTime;

    // Reset scores

    updateScore();

    scoreTimeEl.textContent = formatTime(timeLeft);

    progressBar.style.width = "100%";
    progressBar.classList.remove("danger");

    // Reset results

    resultsPanel.classList.add("hidden");

    // Enable board

    boardEl.classList.remove("disabled");
    boardEl.classList.add("active");

    // Disable controls during training

    startBtn.disabled = true;
    timerSelect.disabled = true;

    targetHintEl.textContent =
        "Click the square on the board →";

    targetWrapper.style.borderColor = "";

    // Clear previous target

    currentTarget = "";

    // Start first question

    displayNewCoordinate();

    // Start countdown

    timerInterval = setInterval(updateTimer, 1000);

}


/* ── HANDLE BOARD CLICK ── */

function handleSquareClick(square) {

    if (!isTraining) return;

    const clicked = square.dataset.square;

    if (clicked === currentTarget) {

        // Correct answer

        correct++;

        flashSquare(square, "correct");

        playCorrectSound();

        updateScore();

        displayNewCoordinate();

    } else {

        // Incorrect answer

        errors++;

        flashSquare(square, "wrong");

        playWrongSound();

        updateScore();

    }

}


/* ── SQUARE ANIMATION ── */

function flashSquare(square, type) {

    const className =
        type === "correct"
            ? "flash-correct"
            : "flash-wrong";

    square.classList.remove(
        "flash-correct",
        "flash-wrong"
    );

    // Restart animation

    void square.offsetWidth;

    square.classList.add(className);

    setTimeout(() => {

        square.classList.remove(className);

    }, 380);

}


/* ── UPDATE SCORE ── */

function updateScore() {

    scoreCorrectEl.textContent = correct;
    scoreErrorsEl.textContent = errors;

    const total = correct + errors;

    const accuracy =
        total > 0
            ? ((correct / total) * 100).toFixed(1)
            : null;

    scoreAccEl.textContent =
        accuracy !== null
            ? `${accuracy}%`
            : "—";

    pulseCard("card-correct");
    pulseCard("card-errors");
    pulseCard("card-accuracy");

}


/* ── SCORE CARD ANIMATION ── */

function pulseCard(id) {

    const element = document.getElementById(id);

    if (!element) return;

    element.classList.remove("pulse");

    void element.offsetWidth;

    element.classList.add("pulse");

}


/* ── TIMER ── */

function updateTimer() {

    if (!isTraining) return;

    timeLeft--;

    if (timeLeft < 0) {
        timeLeft = 0;
    }

    scoreTimeEl.textContent = formatTime(timeLeft);

    // Update progress bar

    const percentage =
        (timeLeft / totalTime) * 100;

    progressBar.style.width = `${percentage}%`;

    // Last 10 seconds warning

    if (timeLeft <= 10) {

        progressBar.classList.add("danger");

        targetWrapper.style.borderColor =
            "rgba(192, 57, 43, 0.7)";

    }

    // End session

    if (timeLeft <= 0) {
        endTraining();
    }

}


/* ── END TRAINING ── */

function endTraining() {

    if (!isTraining) return;

    clearInterval(timerInterval);

    isTraining = false;

    boardEl.classList.add("disabled");
    boardEl.classList.remove("active");

    startBtn.disabled = false;
    timerSelect.disabled = false;

    progressBar.style.width = "0%";

    targetCoordEl.textContent = "—";

    targetHintEl.textContent = "Session ended";

    targetWrapper.style.borderColor = "";

    currentTarget = "";

    playEndSound();

    showResults();

}


/* ── SHOW RESULTS ── */

function showResults() {

    const total = correct + errors;

    const accuracy =
        total > 0
            ? ((correct / total) * 100).toFixed(1)
            : "0.0";

    resCorrectEl.textContent = correct;
    resErrorsEl.textContent = errors;

    resAccEl.textContent = `${accuracy}%`;

    resGradeEl.textContent =
        getGradeMessage(parseFloat(accuracy));

    resultsPanel.classList.remove("hidden");

    resultsPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* ── PERFORMANCE MESSAGE ── */

function getGradeMessage(accuracy) {

    if (correct === 0) {
        return "The board awaits. Keep practicing!";
    }

    if (accuracy >= 95) {
        return "Grandmaster precision!";
    }

    if (accuracy >= 85) {
        return "Excellent board vision!";
    }

    if (accuracy >= 70) {
        return "Solid play. Keep training!";
    }

    if (accuracy >= 55) {
        return "Your board vision is improving!";
    }

    return "Every master was once a beginner.";

}


/* ── FORMAT TIMER ── */

function formatTime(seconds) {

    if (seconds <= 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;

}


/* ── EVENT LISTENERS ── */

// Start button

startBtn.addEventListener("click", () => {

    if (!isTraining) {
        startTraining();
    }

});

// Restart button

restartBtn.addEventListener("click", () => {

    startTraining();

});

// Keyboard shortcuts

document.addEventListener("keydown", event => {

    // Ignore shortcuts when typing in an input

    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT"
    ) {
        return;
    }

    // R = Restart

    if (
        event.key.toLowerCase() === "r" &&
        !isTraining
    ) {
        startTraining();
    }

    // Escape = Stop training

    if (event.key === "Escape" && isTraining) {
        endTraining();
    }

});


/* ── INITIALIZE GAME ── */

createBoard();

updateScore();

scoreTimeEl.textContent = formatTime(60);

targetCoordEl.textContent = "—";

targetHintEl.textContent =
    "Press Start Training to begin";

progressBar.style.width = "100%";

console.log("♟ Chess Vision Trainer initialized!");
