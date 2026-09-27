/* =========================================================
   CHESS VISION TRAINER — COMPLETE FIXED SCRIPT
   Version 4.0
   Features:
   - Correct 8x8 chessboard
   - File coordinates on TOP and BOTTOM
   - Rank coordinates on LEFT and RIGHT
   - 30s, 45s, 1m, 1m30s, 1m45s, 2m timers
   - Dark, Light, Neon themes
   - Live score, accuracy, streak and results
   - Responsive board and keyboard shortcuts
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ========================================================
  // 1. GET HTML ELEMENTS
  // ========================================================

  const $ = (id) => document.getElementById(id);

  const board = $("chessboard");
  const boardStage = board?.parentElement;

  const ranksLeft = $("rank-labels");
  const ranksRight = $("rank-labels-right");
  const fileLabels = $("file-labels");

  const targetCoord = $("target-coord");
  const targetHint = $("target-hint");
  const targetWrapper = $("target-wrapper");

  const timerSelect = $("timer-select");
  const startBtn = $("start-btn");
  const restartBtn = $("restart-btn");
  const themeToggle = $("theme-toggle");

  const status = $("session-status");
  const progressBar = $("progress-bar");
  const progressTime = $("progress-time");

  const correctDisplay = $("score-correct");
  const errorsDisplay = $("score-errors");
  const accuracyDisplay = $("score-accuracy");
  const timeDisplay = $("score-time");

  const resultsPanel = $("results-panel");
  const resCorrect = $("res-correct");
  const resErrors = $("res-errors");
  const resAccuracy = $("res-accuracy");
  const resultGrade = $("result-grade");

  const personalBest = $("personal-best");
  const resStreak = $("res-streak");

  // Verify required HTML elements.

  if (
    !board ||
    !ranksLeft ||
    !ranksRight ||
    !fileLabels ||
    !timerSelect ||
    !startBtn ||
    !targetCoord
  ) {
    console.error(
      "Chess Vision Trainer: Required HTML elements missing. " +
      "Check your index.html IDs."
    );
    return;
  }

  // ========================================================
  // 2. SETTINGS AND SESSION STATE
  // ========================================================

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  const durations = [
    [30, "30 seconds"],
    [45, "45 seconds"],
    [60, "1 minute"],
    [90, "1 minute 30 seconds"],
    [105, "1 minute 45 seconds"],
    [120, "2 minutes"]
  ];

  const themes = ["dark", "light", "neon"];

  const tips = [
    "Visualize the file first, then the rank. Avoid searching square by square.",
    "Keep your eyes near the center of the board and use your peripheral vision.",
    "Accuracy first, speed second. Smooth recognition becomes fast recognition.",
    "Imagine each file as a vertical street and each rank as a horizontal street.",
    "Try to picture the target square before moving your eyes to it."
  ];

  let duration = 60;
  let timeLeft = 60;

  let correct = 0;
  let mistakes = 0;

  let streak = 0;
  let bestStreak = 0;

  let target = null;
  let lastTarget = null;

  let running = false;
  let answered = false;

  let timerInterval = null;
  let answerTimeout = null;

  let endTime = 0;
  let currentTheme = "dark";

  // ========================================================
  // 3. TIMER OPTIONS
  // ========================================================

  function setupTimerOptions() {
    timerSelect.innerHTML = "";

    durations.forEach(([value, label]) => {
      const option = document.createElement("option");

      option.value = String(value);
      option.textContent = label;

      if (value === 60) {
        option.selected = true;
      }

      timerSelect.appendChild(option);
    });

    duration = 60;
    timeLeft = 60;
  }

  // ========================================================
  // 4. BUILD COORDINATE LABELS
  // ========================================================

  function createFileLabels(container) {
    if (!container) return;

    container.innerHTML = "";

    files.forEach((file) => {
      const label = document.createElement("span");

      label.textContent = file;
      label.className = "file-coordinate";

      label.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        width: 100%;
        text-align: center;
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        line-height: 1;
        color: var(--accent, #d6b66e);
        user-select: none;
      `;

      container.appendChild(label);
    });

    // Force the labels into exactly eight equal columns.

    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(8, minmax(0, 1fr))";
    container.style.width = "100%";
    container.style.boxSizing = "border-box";
    container.style.margin = "0";
    container.style.padding = "0";
    container.style.gap = "0";
  }

  function setupCoordinateLayout() {
    /*
      IMPORTANT:
      Keep the rank labels outside the board wrapper.
      The board and its top/bottom labels share the
      exact same width and eight-column grid.
    */

    const stage = board.parentElement;

    if (!stage) return;

    let wrapper = $("cv-board-coordinate-wrapper");

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "cv-board-coordinate-wrapper";
      wrapper.className = "cv-board-coordinate-wrapper";

      wrapper.style.cssText = `
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr) auto;
        min-width: 0;
        width: 100%;
        align-self: stretch;
        box-sizing: border-box;
        gap: 0;
      `;

      // Insert wrapper where the original board was.

      stage.insertBefore(wrapper, board);
      wrapper.appendChild(board);
    }

    // Board is now the central item in the wrapper.

    board.style.gridColumn = "1";
    board.style.gridRow = "2";
    board.style.display = "grid";
    board.style.gridTemplateColumns = "repeat(8, minmax(0, 1fr))";
    board.style.gridTemplateRows = "repeat(8, minmax(0, 1fr))";
    board.style.aspectRatio = "1 / 1";
    board.style.width = "100%";
    board.style.height = "auto";
    board.style.minWidth = "0";
    board.style.boxSizing = "border-box";

    // TOP FILE LABELS.

    let topLabels = $("file-labels-top");

    if (!topLabels) {
      topLabels = document.createElement("div");
      topLabels.id = "file-labels-top";
      topLabels.className = "file-labels file-labels-top";

      wrapper.insertBefore(topLabels, board);
    } else {
      wrapper.insertBefore(topLabels, board);
    }

    topLabels.style.gridRow = "1";
    topLabels.style.gridColumn = "1";
    topLabels.style.marginBottom = "8px";
    topLabels.style.marginTop = "0";
    topLabels.style.padding = "0";
    topLabels.style.width = "100%";

    createFileLabels(topLabels);

    // BOTTOM FILE LABELS.

    wrapper.appendChild(fileLabels);

    fileLabels.classList.add("file-labels", "file-labels-bottom");

    fileLabels.style.gridRow = "3";
    fileLabels.style.gridColumn = "1";
    fileLabels.style.marginTop = "8px";
    fileLabels.style.marginBottom = "0";
    fileLabels.style.padding = "0";
    fileLabels.style.width = "100%";

    createFileLabels(fileLabels);

    // LEFT AND RIGHT RANK LABELS.

    [ranksLeft, ranksRight].forEach((container) => {
      container.innerHTML = "";

      container.style.display = "grid";
      container.style.gridTemplateRows = "repeat(8, minmax(0, 1fr))";
      container.style.alignItems = "center";
      container.style.justifyItems = "center";
      container.style.alignSelf = "stretch";
      container.style.minHeight = "0";
      container.style.gap = "0";

      ranks.forEach((rank) => {
        const label = document.createElement("span");

        label.textContent = rank;
        label.className = "rank-coordinate";

        label.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          line-height: 1;
          color: var(--accent, #d6b66e);
          user-select: none;
        `;

        container.appendChild(label);
      });
    });

    /*
      Preserve the existing board-stage structure:
      left ranks | board wrapper | right ranks.
    */

    stage.style.display = "grid";
    stage.style.gridTemplateColumns =
      "minmax(16px, 28px) minmax(0, 1fr) minmax(16px, 28px)";
    stage.style.alignItems = "stretch";
    stage.style.gap = "6px";
    stage.style.width = "100%";
    stage.style.minWidth = "0";

    ranksLeft.style.gridColumn = "1";
    ranksLeft.style.gridRow = "1";

    wrapper.style.gridColumn = "2";
    wrapper.style.gridRow = "1";

    ranksRight.style.gridColumn = "3";
    ranksRight.style.gridRow = "1";
  }

  // ========================================================
  // 5. BUILD THE 64-SQUARE CHESSBOARD
  // ========================================================

  function buildBoard() {
    board.innerHTML = "";

    setupCoordinateLayout();

    for (let rank = 8; rank >= 1; rank--) {
      for (let file = 0; file < 8; file++) {
        const coordinate = files[file] + rank;

        const square = document.createElement("button");

        square.type = "button";

        const isLight = (rank + file) % 2 === 0;

        square.className =
          "square " + (isLight ? "light" : "dark");

        square.dataset.coordinate = coordinate;

        square.setAttribute(
          "aria-label",
          "Chess square " + coordinate
        );

        square.setAttribute("title", coordinate.toUpperCase());

        square.style.minWidth = "0";
        square.style.minHeight = "0";
        square.style.width = "100%";
        square.style.height = "100%";
        square.style.aspectRatio = "1 / 1";
        square.style.padding = "0";
        square.style.margin = "0";
        square.style.borderRadius = "0";
        square.style.boxSizing = "border-box";
        square.style.cursor = "pointer";
        square.style.position = "relative";

        square.addEventListener("click", () => {
          handleSquareClick(coordinate, square);
        });

        board.appendChild(square);
      }
    }

    console.log(
      "Chess Vision Trainer: Created " +
      board.children.length +
      " squares and all board coordinates."
    );
  }

  // ========================================================
  // 6. FORMAT TIME
  // ========================================================

  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return minutes + ":" + String(remaining).padStart(2, "0");
  }

  function formatTimeLong(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    if (minutes === 0) {
      return remaining + " seconds";
    }

    if (remaining === 0) {
      return minutes + (minutes === 1 ? " minute" : " minutes");
    }

    return (
      minutes +
      (minutes === 1 ? " minute " : " minutes ") +
      remaining +
      " seconds"
    );
  }

  // ========================================================
  // 7. UPDATE LIVE STATISTICS
  // ========================================================

  function updateStats() {
    if (correctDisplay) {
      correctDisplay.textContent = correct;
    }

    if (errorsDisplay) {
      errorsDisplay.textContent = mistakes;
    }

    const total = correct + mistakes;

    const accuracy =
      total === 0
        ? null
        : Math.round((correct / total) * 100);

    if (accuracyDisplay) {
      accuracyDisplay.textContent =
        accuracy === null ? "—" : accuracy + "%";
    }

    if (timeDisplay) {
      timeDisplay.textContent = formatTime(timeLeft);
    }

    if (progressTime) {
      progressTime.textContent = formatTime(timeLeft);
    }

    const percentage =
      duration > 0 ? (timeLeft / duration) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = percentage + "%";

      const track = progressBar.parentElement;

      if (track) {
        track.setAttribute(
          "aria-valuenow",
          String(Math.round(percentage))
        );
      }

      progressBar.classList.toggle("danger", timeLeft <= 10 && running);
    }
  }

  // ========================================================
  // 8. SESSION STATUS
  // ========================================================

  function setStatus(message) {
    if (!status) return;

    status.innerHTML = "";

    const dot = document.createElement("i");

    status.appendChild(dot);
    status.appendChild(document.createTextNode(" " + message));
  }

  // ========================================================
  // 9. GENERATE A RANDOM TARGET
  // ========================================================

  function generateTarget() {
    let next;

    do {
      const randomFile = files[Math.floor(Math.random() * 8)];
      const randomRank = Math.floor(Math.random() * 8) + 1;

      next = randomFile + randomRank;
    } while (next === lastTarget);

    lastTarget = next;
    target = next;

    targetCoord.textContent = target.toUpperCase();

    targetCoord.classList.remove("pop");

    void targetCoord.offsetWidth;

    targetCoord.classList.add("pop");

    if (targetHint) {
      targetHint.textContent =
        "Find " + target.toUpperCase() + " on the board.";
    }

    if (targetWrapper) {
      targetWrapper.setAttribute(
        "aria-label",
        "Find square " + target.toUpperCase()
      );
    }

    answered = false;
  }

  // ========================================================
  // 10. CLEAR SQUARE FEEDBACK
  // ========================================================

  function clearSquareFeedback() {
    board.querySelectorAll(".square").forEach((square) => {
      square.classList.remove(
        "target-correct",
        "target-wrong",
        "correct",
        "wrong"
      );
    });
  }

  // ========================================================
  // 11. START OR RESTART TRAINING
  // ========================================================

  function startTraining() {
    clearInterval(timerInterval);
    clearTimeout(answerTimeout);

    duration = Number(timerSelect.value) || 60;
    timeLeft = duration;

    correct = 0;
    mistakes = 0;

    streak = 0;
    bestStreak = 0;

    target = null;
    lastTarget = null;

    answered = false;
    running = true;

    clearSquareFeedback();

    if (resultsPanel) {
      resultsPanel.classList.add("hidden");
    }

    startBtn.disabled = true;

    const btnText = startBtn.querySelector(".btn-text");

    if (btnText) {
      btnText.textContent = "Training...";
    } else {
      startBtn.textContent = "Training...";
    }

    timerSelect.disabled = true;

    setStatus("TRAINING");

    generateTarget();
    updateStats();

    endTime = Date.now() + duration * 1000;

    timerInterval = setInterval(() => {
      if (!running) return;

      const remainingMs = endTime - Date.now();

      timeLeft = Math.max(0, Math.ceil(remainingMs / 1000));

      updateStats();

      if (remainingMs <= 0) {
        finishTraining();
      }
    }, 100);
  }

  // ========================================================
  // 12. HANDLE BOARD SQUARE CLICKS
  // ========================================================

  function handleSquareClick(coordinate, square) {
    if (!running || !target || answered) return;

    // Correct square.

    if (coordinate === target) {
      answered = true;

      correct++;
      streak++;

      bestStreak = Math.max(bestStreak, streak);

      square.classList.remove("target-wrong", "wrong");
      square.classList.add("target-correct", "correct");

      if (targetHint) {
        targetHint.textContent = "Correct! Find the next square.";
      }

      updateStats();

      answerTimeout = setTimeout(() => {
        square.classList.remove("target-correct", "correct");

        if (running) {
          generateTarget();
        }
      }, 180);

    } else {
      // Incorrect square.

      mistakes++;
      streak = 0;

      square.classList.remove("target-correct", "correct");
      square.classList.add("target-wrong", "wrong");

      if (targetHint) {
        targetHint.textContent =
          "Not quite! Find " +
          target.toUpperCase() +
          " and try again.";
      }

      updateStats();

      setTimeout(() => {
        square.classList.remove("target-wrong", "wrong");
      }, 350);
    }
  }

  // ========================================================
  // 13. FINISH TRAINING
  // ========================================================

  function finishTraining() {
    if (!running) return;

    running = false;

    clearInterval(timerInterval);
    clearTimeout(answerTimeout);

    timerInterval = null;
    answerTimeout = null;

    timeLeft = 0;

    updateStats();

    setStatus("COMPLETE");

    startBtn.disabled = false;
    timerSelect.disabled = false;

    const btnText = startBtn.querySelector(".btn-text");

    if (btnText) {
      btnText.textContent = "Start training";
    } else {
      startBtn.textContent = "Start training";
    }

    targetCoord.textContent = "♛";
    targetCoord.classList.remove("pop");

    if (targetHint) {
      targetHint.textContent =
        "Session completed! Review your results below.";
    }

    const total = correct + mistakes;

    const accuracy =
      total === 0
        ? 0
        : Math.round((correct / total) * 100);

    if (resCorrect) {
      resCorrect.textContent = correct;
    }

    if (resErrors) {
      resErrors.textContent = mistakes;
    }

    if (resAccuracy) {
      resAccuracy.textContent = accuracy + "%";
    }

    if (resStreak) {
      resStreak.textContent = bestStreak;
    }

    // Save personal best locally.

    const oldBest = Number(
      localStorage.getItem("cvt-best") || 0
    );

    const newBest = Math.max(oldBest, correct);

    localStorage.setItem("cvt-best", String(newBest));

    if (personalBest) {
      personalBest.textContent = newBest;
    }

    // Results message.

    if (resultGrade) {
      if (total === 0) {
        resultGrade.textContent =
          "Ready for your first training round?";
      } else if (accuracy >= 90) {
        resultGrade.textContent =
          "Outstanding board vision! Keep it up.";
      } else if (accuracy >= 75) {
        resultGrade.textContent =
          "Excellent progress. Your accuracy is improving!";
      } else if (accuracy >= 50) {
        resultGrade.textContent =
          "Good effort! Keep practicing your coordinates.";
      } else {
        resultGrade.textContent =
          "Every move is progress. Try another round!";
      }
    }

    if (resultsPanel) {
      resultsPanel.classList.remove("hidden");

      setTimeout(() => {
        resultsPanel.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 100);
    }
  }

  // ========================================================
  // 14. DARK / LIGHT / NEON THEME SWITCHER
  // ========================================================

  function applyTheme(theme) {
    if (!themes.includes(theme)) {
      theme = "dark";
    }

    currentTheme = theme;

    document.body.classList.remove(
      "theme-dark",
      "theme-light",
      "theme-neon"
    );

    document.body.classList.add("theme-" + theme);

    document.body.dataset.theme = theme;
    document.documentElement.dataset.theme = theme;

    localStorage.setItem("cvt-theme", theme);

    const metaTheme = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (metaTheme) {
      const colors = {
        dark: "#0b0d12",
        light: "#f2f0eb",
        neon: "#080713"
      };

      metaTheme.content = colors[theme];
    }

    if (themeToggle) {
      if (theme === "dark") {
        themeToggle.textContent = "☼";
        themeToggle.title = "Switch to light theme";
        themeToggle.setAttribute(
          "aria-label",
          "Switch to light theme"
        );
      } else if (theme === "light") {
        themeToggle.textContent = "☾";
        themeToggle.title = "Switch to neon theme";
        themeToggle.setAttribute(
          "aria-label",
          "Switch to neon theme"
        );
      } else {
        themeToggle.textContent = "⚡";
        themeToggle.title = "Switch to dark theme";
        themeToggle.setAttribute(
          "aria-label",
          "Switch to dark theme"
        );
      }
    }
  }

  function cycleTheme() {
    const currentIndex = themes.indexOf(currentTheme);

    const nextIndex = (currentIndex + 1) % themes.length;

    applyTheme(themes[nextIndex]);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", cycleTheme);
  }

  // ========================================================
  // 15. BUTTON AND TIMER EVENTS
  // ========================================================

  startBtn.addEventListener("click", startTraining);

  if (restartBtn) {
    restartBtn.addEventListener("click", startTraining);
  }

  timerSelect.addEventListener("change", () => {
    if (running) return;

    duration = Number(timerSelect.value) || 60;
    timeLeft = duration;

    updateStats();

    if (targetHint) {
      targetHint.textContent =
        "Ready for a " + formatTimeLong(duration) + " session.";
    }
  });

  // ========================================================
  // 16. KEYBOARD SHORTCUTS
  // ========================================================

  document.addEventListener("keydown", (event) => {
    const activeTag =
      document.activeElement?.tagName || "";

    const isTyping = [
      "INPUT",
      "SELECT",
      "TEXTAREA"
    ].includes(activeTag);

    if (isTyping || event.repeat) return;

    // R = start or restart training.

    if (event.key.toLowerCase() === "r") {
      startTraining();
    }

    // T = cycle themes.

    if (event.key.toLowerCase() === "t") {
      cycleTheme();
    }

    // Escape = finish current session.

    if (event.key === "Escape" && running) {
      finishTraining();
    }
  });

  // ========================================================
  // 17. INITIALIZE APPLICATION
  // ========================================================

  setupTimerOptions();

  buildBoard();

  const savedTheme = localStorage.getItem("cvt-theme") || "dark";

  applyTheme(savedTheme);

  updateStats();

  setStatus("READY");

  targetCoord.textContent = "—";

  if (targetHint) {
    targetHint.textContent =
      "Start a session to reveal your first square.";
  }

  if (personalBest) {
    personalBest.textContent =
      Number(localStorage.getItem("cvt-best") || 0);
  }

  const trainingTip = $("training-tip");

  if (trainingTip) {
    trainingTip.textContent =
      tips[Math.floor(Math.random() * tips.length)];
  }

  console.log(
    "Chess Vision Trainer initialized successfully."
  );
});
