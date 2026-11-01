const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

function functionSource(name, nextName) {
  const start = app.indexOf(\`function \${name}(\`);
  assert.notEqual(start, -1, \`Missing \${name}()\`);
  const end = nextName ? app.indexOf(\`function \${nextName}(\`, start + 1) : -1;
  return app.slice(start, end === -1 ? app.length : end);
}

test("board coordinate cue is transient and clears itself after the flash window", () => {
  assert.match(app, /const BOARD_TARGET_CUE_DURATION = 1500/);
  assert.match(app, /function showBoardTargetCue\(coord\)/);
  assert.match(app, /board\.dataset\.targetCue = target/);
  assert.match(app, /setTimeout\(\(\) => clearBoardTargetCue\(false\), BOARD_TARGET_CUE_DURATION\)/);
  assert.match(app, /board\.removeAttribute\("data-target-cue"\)/);
});

test("coordinate prompts are placed on the board for square, knight, and color targets", () => {
  assert.match(functionSource("genSquareTarget", "genNameTarget"), /showBoardTargetCue\(coord\)/);
  assert.match(functionSource("genKnightTarget", "genColorTarget"), /showBoardTargetCue\(src\)/);
  assert.match(functionSource("genColorTarget", "resetTarget"), /showBoardTargetCue\(coord\)/);
});

test("board cue never blocks square clicks and disappears after an attempted board answer", () => {
  const handler = functionSource("handleSquare", "correctDual");
  assert.match(handler, /clearBoardTargetCue\(false\)/);
  assert.match(css, /#chessboard::after[\s\S]*?pointer-events:\s*none/);
});

test("prompt card keeps an accessible target while its duplicate visual coordinate is hidden", () => {
  assert.match(css, /#targetPanel\.board-cue-mode #targetCoordinate/);
  assert.match(css, /clip-path:\s*inset\(50%\)/);
});

test("color target selection also dismisses the board cue", () => {
  assert.match(functionSource("handleColorChoice", "onCorrectBase"), /clearBoardTargetCue\(false\)/);
});
