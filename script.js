/**
 * ════════════════════════════════════════════
 *  CHESS VISION TRAINER — script.js
 *  Clean, modular Vanilla JS game logic
 * ════════════════════════════════════════════
 */

/* ── DOM REFERENCES ── */
const boardEl        = document.getElementById('chessboard');
const targetCoordEl  = document.getElementById('target-coord');
const targetHintEl   = document.getElementById('target-hint');
const targetWrapper  = document.getElementById('target-wrapper');
const startBtn       = document.getElementById('start-btn');
const timerSelect    = document.getElementById('timer-select');
const scoreCorrectEl = document.getElementById('score-correct');
const scoreErrorsEl  = document.getElementById('score-errors');
const scoreAccEl     = document.getElementById('score-accuracy');
const scoreTimeEl    = document.getElementById('score-time');
const progressBar    = document.getElementById('progress-bar');
const resultsPanel   = document.getElementById('results-panel');
const resCorrectEl   = document.getElementById('res-correct');
const resErrorsEl    = document.getElementById('res-errors');
const resAccEl       = document.getElementById('res-accuracy');
const resGradeEl     = document.getElementById('result-grade');
const restartBtn     = document.getElementById('restart-btn');
const rankLabelsEl   = document.getElementById('rank-labels');
const rankLabelsREl  = document.getElementById('rank-labels-right');
const fileLabelsEl   = document.getElementById('file-labels');

/* ── GAME STATE ── */
let correct       = 0;
let errors        = 0;
let timeLeft      = 60;
let totalTime     = 60;
let timerInterval = null;
let currentTarget = '';
let isTraining    = false;

/* ── AUDIO: Simple Web Audio tones ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

/**
 * playTone — plays a short beep
 * @param {number} freq   - frequency in Hz
 * @param {string} type   - oscillator type
 * @param {number} dur    - duration in seconds
 * @param {number} vol    - volume 0–1
 */
function playTone(freq, type = 'sine', dur = 0.12, vol = 0.15) {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type            = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (_) { /* audio not available */ }
}

function playCorrectSound() { playTone(880, 'sine',    0.14, 0.12); }
function playWrongSound()   { playTone(220, 'sawtooth', 0.18, 0.1);  }
function playEndSound() {
  playTone(660, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(880, 'sine', 0.15, 0.1), 120);
}

/* ══════════════════════════════════════════
   createBoard()
   Builds the 8×8 chessboard grid and labels.
   Board orientation: white perspective
     - a1 = bottom-left
     - h8 = top-right
   ══════════════════════════════════════════ */
function createBoard() {
  boardEl.innerHTML       = '';
  rankLabelsEl.innerHTML  = '';
  rankLabelsREl.innerHTML = '';
  fileLabelsEl.innerHTML  = '';

  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = [8,7,6,5,4,3,2,1]; // top row = rank 8, bottom = rank 1

  /* Rank labels (left side) — from 8 down to 1 */
  ranks.forEach(rank => {
    const span = document.createElement('span');
    span.className   = 'rank-label';
    span.textContent = rank;
    rankLabelsEl.appendChild(span);

    const spanR = span.cloneNode(true);
    rankLabelsREl.appendChild(spanR);
  });

  /* Board squares */
  ranks.forEach(rank => {
    files.forEach((file, fileIdx) => {
      const square = document.createElement('div');

      /* Determine color: a1 is light — light when (file+rank) is even */
      const fileNum   = fileIdx + 1; // a=1 … h=8
      const isLight   = (fileNum + rank) % 2 === 0;
      square.className    = `square ${isLight ? 'light' : 'dark'}`;
      square.dataset.square = `${file}${rank}`;

      square.addEventListener('click', () => handleSquareClick(square));
      boardEl.appendChild(square);
    });
  });

  /* File labels (bottom) — a through h */
  files.forEach(file => {
    const span = document.createElement('span');
    span.className   = 'file-label';
    span.textContent = file;
    fileLabelsEl.appendChild(span);
  });
}

/* ══════════════════════════════════════════
   generateRandomSquare()
   Returns a random chess coordinate, e.g. "e4"
   ══════════════════════════════════════════ */
function generateRandomSquare() {
  const files = ['a','b','c','d','e','f','g','h'];
  const file  = files[Math.floor(Math.random() * 8)];
  const rank  = Math.floor(Math.random() * 8) + 1;
  return `${file}${rank}`;
}

/* ══════════════════════════════════════════
   displayNewCoordinate()
   Animates out the old coord and shows a new one.
   Randomly colors coordinate white or "dark gold".
   ══════════════════════════════════════════ */
function displayNewCoordinate() {
  const next = generateRandomSquare();
  currentTarget = next;

  /* Color: alternates for visual variety */
  const colors = ['#f2ead8', '#c8a96e', '#ffffff'];
  targetCoordEl.style.color = colors[Math.floor(Math.random() * colors.length)];

  /* Fade-out → set text → fade-in */
  targetCoordEl.classList.add('fade-out');
  setTimeout(() => {
    targetCoordEl.textContent = next;
    targetCoordEl.classList.remove('fade-out');
    targetCoordEl.classList.add('fade-in');
    setTimeout(() => targetCoordEl.classList.remove('fade-in'), 250);
  }, 180);
}

/* ══════════════════════════════════════════
   startTraining()
   Resets score, starts the timer & game loop.
   ══════════════════════════════════════════ */
function startTraining() {
  /* Reset state */
  correct = 0;
  errors  = 0;
  isTraining = true;
  totalTime  = parseInt(timerSelect.value, 10);
  timeLeft   = totalTime;

  /* Reset UI */
  updateScore();
  scoreTimeEl.textContent = formatTime(timeLeft);
  progressBar.style.width = '100%';
  progressBar.classList.remove('danger');
  resultsPanel.classList.add('hidden');
  boardEl.classList.remove('disabled');
  boardEl.classList.add('active');
  startBtn.disabled = true;
  timerSelect.disabled = true;
  targetHintEl.textContent = 'Click the square on the board →';
  targetCoordEl.style.color = '#f2ead8';

  /* Show first coordinate */
  displayNewCoordinate();

  /* Start countdown */
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

/* ══════════════════════════════════════════
   handleSquareClick(square)
   Processes user click on a board square.
   ══════════════════════════════════════════ */
function handleSquareClick(square) {
  if (!isTraining) return;

  const clicked = square.dataset.square;

  if (clicked === currentTarget) {
    /* ── CORRECT ── */
    correct++;
    flashSquare(square, 'correct');
    playCorrectSound();
    updateScore();
    displayNewCoordinate();
  } else {
    /* ── WRONG ── */
    errors++;
    flashSquare(square, 'wrong');
    playWrongSound();
    updateScore();
  }
}

/* ══════════════════════════════════════════
   flashSquare(square, type)
   Applies and removes a color-flash animation.
   ══════════════════════════════════════════ */
function flashSquare(square, type) {
  const cls = type === 'correct' ? 'flash-correct' : 'flash-wrong';
  square.classList.remove('flash-correct', 'flash-wrong');
  /* Force reflow so animation restarts if same square clicked twice */
  void square.offsetWidth;
  square.classList.add(cls);
  setTimeout(() => square.classList.remove(cls), 380);
}

/* ══════════════════════════════════════════
   updateScore()
   Refreshes live score display.
   ══════════════════════════════════════════ */
function updateScore() {
  scoreCorrectEl.textContent = correct;
  scoreErrorsEl.textContent  = errors;

  const total = correct + errors;
  const acc   = total > 0 ? ((correct / total) * 100).toFixed(2) : '—';
  scoreAccEl.textContent = total > 0 ? acc + '%' : '—';

  /* Pulse animation on each card update */
  pulseCard('card-correct');
  pulseCard('card-errors');
  pulseCard('card-accuracy');
}

function pulseCard(id) {
  const el = document.getElementById(id);
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

/* ══════════════════════════════════════════
   updateTimer()
   Called every second. Decrements timer,
   updates progress bar, and ends on zero.
   ══════════════════════════════════════════ */
function updateTimer() {
  timeLeft--;
  scoreTimeEl.textContent = formatTime(timeLeft);

  /* Progress bar */
  const pct = (timeLeft / totalTime) * 100;
  progressBar.style.width = pct + '%';

  /* Danger styling when ≤ 10 seconds left */
  if (timeLeft <= 10) {
    progressBar.classList.add('danger');
    targetWrapper.style.borderColor = 'rgba(192,57,43,0.4)';
  }

  if (timeLeft <= 0) endTraining();
}

/* ══════════════════════════════════════════
   endTraining()
   Stops the session and shows results.
   ══════════════════════════════════════════ */
function endTraining() {
  clearInterval(timerInterval);
  isTraining = false;

  boardEl.classList.add('disabled');
  boardEl.classList.remove('active');
  startBtn.disabled    = false;
  timerSelect.disabled = false;
  progressBar.style.width = '0%';

  targetCoordEl.textContent = '—';
  targetHintEl.textContent  = 'Session ended';
  targetWrapper.style.borderColor = '';

  playEndSound();
  showResults();
}

/* ══════════════════════════════════════════
   showResults()
   Populates and reveals the results panel.
   ══════════════════════════════════════════ */
function showResults() {
  const total = correct + errors;
  const acc   = total > 0 ? ((correct / total) * 100).toFixed(2) : '0.00';

  resCorrectEl.textContent = correct;
  resErrorsEl.textContent  = errors;
  resAccEl.textContent     = acc + '%';
  resGradeEl.textContent   = getGradeMessage(parseFloat(acc));

  resultsPanel.classList.remove('hidden');
  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ══════════════════════════════════════════
   getGradeMessage(accuracy)
   Returns a flavourful performance comment.
   ══════════════════════════════════════════ */
function getGradeMessage(acc) {
  if (correct === 0) return 'No moves made. The board awaits.';
  if (acc >= 95)  return '"Grandmaster precision."';
  if (acc >= 85)  return '"Expert-level board vision."';
  if (acc >= 70)  return '"Solid play. Keep training."';
  if (acc >= 55)  return '"The pattern is forming."';
  return '"Every master was once a beginner."';
}

/* ── Utility: format seconds as MM:SS ── */
function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ── EVENT LISTENERS ── */
startBtn.addEventListener('click',   startTraining);
restartBtn.addEventListener('click', startTraining);

/* Keyboard shortcut: R = restart */
document.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') {
    if (!isTraining) startTraining();
  }
});

/* ── INIT ── */
createBoard();
