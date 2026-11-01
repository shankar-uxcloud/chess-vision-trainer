const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

function functionSource(name, nextName) {
  const start = app.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Missing " + name + "()");
  const end = nextName ? app.indexOf("function " + nextName + "(", start + 1) : -1;
  return app.slice(start, end === -1 ? app.length : end);
}

test("board coordinate cue is transient and clears itself after the flash window", () => {
  assert.match(app, /const BOARD_TARGET_CUE_DURATION = 1500/);
  assert.match(app, /function showBoardTargetCue\(coord\)/);
  assert.match(app, /board\.dataset\.targetCue = target/);
  assert.match(functionSource("showBoardTargetCue", "genTarget"), /BOARD_TARGET_CUE_DURATION/);
  assert.match(functionSource("showBoardTargetCue", "genTarget"), /boardCueToken/);
  assert.match(app, /board\.removeAttribute\("data-target-cue"\)/);
});

test("coordinate prompts are placed on the board for square, knight, and color targets", () => {
  assert.match(functionSource("genSquareTarget", "genNameTarget"), /showBoardTargetCue\(coord\)/);
  assert.match(functionSource("genKnightTarget", "genColorTarget"), /showBoardTargetCue\(src\)/);
  assert.match(functionSource("genColorTarget", "resetTarget"), /showBoardTargetCue\(coord\)/);
});

test("board cue never blocks square clicks and disappears after an attempted board answer", () => {
  const handler = functionSource("handleSquare", "correctDual");
  assert.match(handler, /clearBoardTargetCue\(true\)/);
  assert.match(css, /#chessboard::after[\s\S]*?pointer-events:\s*none/);
});

test("prompt card keeps an accessible target while its duplicate visual coordinate is hidden", () => {
  assert.match(css, /#targetPanel\.board-cue-mode #targetCoordinate/);
  assert.match(css, /clip-path:\s*inset\(50%\)/);
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /id="targetCoordinate" aria-live="polite" aria-atomic="true"/);
});

test("resuming a paused coordinate exercise flashes the active target again", () => {
  assert.match(functionSource("togglePause", "finishSession"), /showBoardTargetCue\(game\.mode === "knight" \? game\.knightSource : game\.target\)/);
});

test("color target selection also dismisses the board cue", () => {
  assert.match(functionSource("handleColorChoice", "onCorrectBase"), /clearBoardTargetCue\(true\)/);
});

test("cue timer handles are separate and stale callbacks are generation-guarded", () => {
  assert.match(app, /boardCueFadeTimer: null, boardCueToken: 0/);
  assert.match(functionSource("clearBoardTargetCue", "showBoardTargetCue"), /clearTimeout\(game\.boardCueFadeTimer\)/);
  assert.match(functionSource("showBoardTargetCue", "genTarget"), /token !== game\.boardCueToken/);
});

test("perspective rebuild restores the active target cue only for an active question", () => {
  const flip = functionSource("setBoardFlip", "isDualMode");
  assert.match(flip, /game\.questionStartTime > 0/);
  assert.match(flip, /if \(cueTarget\) showBoardTargetCue\(cueTarget\)/);
  assert.match(functionSource("genTarget", "updateQuestionNumber"), /game\.questionStartTime = 0/);
});

test("Knight Vision source square is not highlighted as a shortcut", () => {
  assert.doesNotMatch(functionSource("genKnightTarget", "genColorTarget"), /hl\(src, "knight-source"\)/);
});

test("cue sits near the board edge instead of covering central squares", () => {
  assert.match(css, /#chessboard::after[\s\S]*?top:\s*8%;[\s\S]*?right:\s*8%;/);
});
