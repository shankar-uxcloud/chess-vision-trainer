"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const core=require("../board-settings-core.js");
test("board slider values are clamped and quantized safely",()=>{
 assert.equal(core.clampPercent(77),75);
 assert.equal(core.clampPercent(500),130);
 assert.equal(core.clampPercent(-4),60);
 assert.equal(core.clampPercent("nope"),100);
});
test("board targets scale with requested size but never exceed available width",()=>{
 assert.equal(core.computeTarget(600,100),468);
 assert.equal(core.computeTarget(600,115),538);
 assert.equal(core.computeTarget(600,130),600);
 assert.equal(core.computeTarget(350,130),350);
 assert.equal(core.computeTarget(600,70),328);
});
test("fit-to-screen selects full measured available width",()=>{assert.equal(core.computeTarget(612,100,true),612);});
test("all recommended profiles define real compatible preferences",()=>{
 for(const name of ["balanced","focus","performance"]){const p=core.PROFILES[name];assert.ok(p);assert.ok(p.size>=60&&p.size<=130);assert.ok(["dark","light","neon","heavy"].includes(p.interfaceTheme));assert.ok(["emerald","walnut","ice","rose","midnight","classic"].includes(p.theme));}
 assert.equal(core.PROFILES.focus.animations,false);assert.equal(core.PROFILES.performance.sound,false);
});
test("saved setting validation rejects invalid names and preserves safe defaults",()=>{
 const p=core.validatePreferences({size:999,profile:"hacker",interfaceTheme:"bad",boardTheme:"bad",coords:false,sound:false});
 assert.equal(p.size,130);assert.equal(p.profile,"balanced");assert.equal(p.interfaceTheme,"light");assert.equal(p.boardTheme,"emerald");assert.equal(p.coords,false);assert.equal(p.sound,false);
});

test("production board sizing uses the winning CSS variable instead of inline width overrides",()=>{
 const fs=require("node:fs");
 const path=require("node:path");
 const app=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","board-settings.css"),"utf8");
 const mainCss=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 assert.match(app,/function applyBoardSize\(pct, options = \{\}\)/);
 assert.match(app,/document\.documentElement\.style\.setProperty\("\-\-cvt-board-target", target \+ "px"\)/);
 assert.match(app,/board\.style\.removeProperty\("width"\)/);
 assert.match(app,/board\.style\.removeProperty\("height"\)/);
 assert.ok(mainCss.includes("BOARD SIZE CONTROL CASCADE OVERRIDE"));
 assert.ok(mainCss.includes("width: var(--cvt-board-target, 420px) !important"));
 assert.ok(mainCss.includes("width: calc(var(--cvt-board-target, 420px) + 56px) !important"));
 assert.match(css,/training-board-panel #chessboard[^\n]*width:var\(--cvt-board-target/);
});

test("presets map to visibly increasing target widths on the same available column",()=>{
 const available=640;
 const sizes=[70,85,100,115,130].map(p=>Math.min(available,Math.round(available*p/100)));
 assert.deepEqual(sizes,[448,544,640,640,640]);
 assert.ok(sizes[1]>sizes[0]);
 assert.ok(sizes[2]>sizes[1]);
});
test("recommended balanced and focus sizes differ and performance uses fit",()=>{
 const fs=require("node:fs");
 const app=fs.readFileSync(require("node:path").join(__dirname,"..","script.js"),"utf8");
 assert.match(app,/balanced: \{ size: 85/);
 assert.match(app,/focus: \{ size: 115/);
 assert.match(app,/applyBoardSize\(chosenSize, \{ fit: name === "performance"/);
 assert.match(app,/load\("cvt-board-fit-v1", false\) === true/);
});

test("training view activation re-measures the board after a previously hidden layout becomes visible",()=>{
 const fs=require("node:fs");
 const app=fs.readFileSync(require("node:path").join(__dirname,"..","script.js"),"utf8");
 assert.match(app,/if \(name === "training"\) requestAnimationFrame\(\(\) => applyBoardSize\(/);
});

test("render-size correction is based on actual layout measurements and live board column", () => {
 const fs = require("node:fs");
 const path = require("node:path");
 const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
 const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
 assert.match(app, /board\?\.getBoundingClientRect\(\)\.width/);
 assert.match(app, /board\.style\.setProperty\("width", target \+ "px", "important"\)/);
 assert.match(app, /const middle = board\?\.closest\("\.board-middle"\)/);
 assert.match(css, /BOARD SIZE CASCADE FIX v2/);
 assert.match(css, /\.gameplay-stage \.training-board-panel \.chessboard \{\s*width: var\(--cvt-board-target/);
});
test("fit mode has a distinct persisted mode bit and presets do not overwrite training history", () => {
 const fs = require("node:fs");
 const path = require("node:path");
 const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
 assert.match(app, /save\("cvt-board-fit-v1", true\)/);
 assert.match(app, /save\(KEYS\.boardSize, requested\)/);
 assert.match(app, /markSettingsCustomized\(\)/);
});
