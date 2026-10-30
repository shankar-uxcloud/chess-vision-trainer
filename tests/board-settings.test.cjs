"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../board-settings-core.js");

test("slider values are clamped and quantized to supported 5% steps", () => {
  assert.equal(core.clampPercent(77), 75);
  assert.equal(core.clampPercent(500), 130);
  assert.equal(core.clampPercent(-4), 60);
  assert.equal(core.clampPercent("nope"), 100);
});

test("all five presets produce strictly increasing targets when space is available", () => {
  const available = 640;
  const values = Object.values(core.PRESETS).map(value => core.computeTarget(available, value));
  assert.deepEqual(values, [349, 424, 499, 574, 640]);
  assert.ok(values.every((value, index) => index === 0 || value > values[index - 1]));
});

test("every preset clamps to physical space without exceeding it", () => {
  for (const value of Object.values(core.PRESETS)) {
    assert.ok(core.computeTarget(220, value) <= 220);
    assert.ok(core.computeTarget(220, value) >= 160);
  }
});

test("Fit to Screen uses all available board width", () => {
  assert.equal(core.computeTarget(612, 70, true), 612);
});

test("Fit to Screen is independent of the selected slider percentage", () => {
  for (const value of [60, 70, 85, 100, 115, 130]) {
    assert.equal(core.computeTarget(500, value, true), 500);
  }
});

test("recommended profiles are a single shared definition with real settings", () => {
  assert.deepEqual(Object.keys(core.PROFILES), ["balanced", "focus", "performance"]);
  assert.equal(core.PROFILES.balanced.size, 85);
  assert.equal(core.PROFILES.focus.size, 115);
  assert.equal(core.PROFILES.performance.size, 130);
  assert.equal(core.PROFILES.performance.fit, true);
  assert.equal(core.PROFILES.focus.animations, false);
  assert.equal(core.PROFILES.performance.sound, false);
});

test("saved preferences are normalized to known profile, theme and board values", () => {
  const value = core.validatePreferences({
    size: 999, profile: "hacker", interfaceTheme: "bad", boardTheme: "bad",
    coords: false, sound: false
  });
  assert.equal(value.size, 130);
  assert.equal(value.profile, "balanced");
  assert.equal(value.interfaceTheme, "light");
  assert.equal(value.boardTheme, "emerald");
  assert.equal(value.coords, false);
  assert.equal(value.sound, false);
});

test("production app delegates target sizing and profile definitions to the core", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  assert.match(app, /const BOARD_SETTINGS_CORE = window\.CVTBoardSettingsCore/);
  assert.match(app, /const BOARD_SIZE_PRESETS = BOARD_SETTINGS_CORE\.PRESETS/);
  assert.match(app, /const BOARD_PROFILES = BOARD_SETTINGS_CORE\.PROFILES/);
  assert.match(app, /BOARD_SETTINGS_CORE\.computeTarget\(available, requested, fit\)/);
  assert.doesNotMatch(app, /const BOARD_PROFILES = \{/);
});

test("render verification requires the measured board to match its requested target", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  assert.match(app, /Math\.abs\(renderedWidth - target\) <= 1/);
  assert.match(app, /Math\.abs\(renderedHeight - target\) <= 1/);
  assert.match(app, /renderedWidth === renderedHeight/);
  assert.match(app, /new CustomEvent\("cvt:board-size-applied"/);
});

test("board resize is rebound once and preserves Fit to Screen preference", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  assert.match(app, /if \(settingsResizeHandlerBound\) return/);
  assert.match(app, /fit: load\("cvt-board-fit-v1", false\) === true/);
  assert.match(app, /window\.addEventListener\("orientationchange"/);
});

test("the board CSS keeps a square target and reserves coordinate gutters", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
  const boardCss = fs.readFileSync(path.join(__dirname, "..", "board-settings.css"), "utf8");
  assert.match(css, /aspect-ratio: 1 \/ 1 !important/);
  assert.match(css, /grid-template-columns: repeat\(8, minmax\(0, 1fr\)\)/);
  assert.match(boardCss, /grid-template-columns:\\s*22px\\s+minmax\\(0,\\s*1fr\\)\\s+22px/);
});

test("backup export includes board fit, recommended profile and animation preferences", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const exportBlock = app.slice(app.indexOf("function exportData"), app.indexOf("function importData"));
  assert.match(exportBlock, /boardFit:/);
  assert.match(exportBlock, /settingsProfile:/);
  assert.match(exportBlock, /animations:/);
});

test("backup import applies optional board preferences without requiring them in older backups", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  assert.match(app, /if \(settings\.boardFit !== undefined\)/);
  assert.match(app, /if \(settings\.settingsProfile !== undefined\)/);
  assert.match(app, /if \(settings\.animations !== undefined\)/);
});
