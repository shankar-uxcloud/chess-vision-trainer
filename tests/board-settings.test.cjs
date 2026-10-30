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

test("production board sizing uses the single CSS sizing source for the live grid",()=>{
 const fs=require("node:fs");
 const path=require("node:path");
 const app=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
 const mainCss=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","board-settings.css"),"utf8");
 assert.match(app,/function applyBoardSize\(pct, options = \{\}\)/);
 assert.match(app,/style\.setProperty\("--cvt-board-target", target \+ "px"\)/);
 assert.match(app,/const renderedWidth = rect \? Math\.round\(rect\.width\) : 0/);
 assert.match(app,/const renderedHeight = rect \? Math\.round\(rect\.height\) : 0/);
 assert.match(mainCss,/SINGLE SOURCE OF TRUTH: RESPONSIVE TRAINING BOARD DIMENSIONS/);
 assert.match(mainCss,/width: var\(--cvt-board-target, 420px\) !important/);
 assert.match(mainCss,/height: var\(--cvt-board-target, 420px\) !important/);
 assert.doesNotMatch(mainCss,/BOARD SIZE CASCADE FIX v2/);
 assert.doesNotMatch(css,/training-board-panel #chessboard[^\n]*width:100% !important/);
});
test("presets map to visibly increasing target widths on the same available column",()=>{
 const available=640;
 const sizes=[70,85,100,115,130].map(p=>Math.min(available,Math.round(available*p/100)));
 assert.deepEqual(sizes,[448,544,640,640,640]);
 assert.ok(sizes[1]>sizes[0]);
 assert.ok(sizes[2]>sizes[1]);
});
test("recommended profiles apply their settings and persist fit mode separately",()=>{
 const fs=require("node:fs");
 const app=fs.readFileSync(require("node:path").join(__dirname,"..","script.js"),"utf8");
 assert.match(app,/balanced: \{ size: 85/);
 assert.match(app,/focus: \{ size: 115/);
 assert.match(app,/const shouldFitBoard = name === "performance"/);
 assert.match(app,/applyBoardSize\(chosenSize, \{ fit: shouldFitBoard/);
 assert.match(app,/save\("cvt-board-fit-v1", shouldFitBoard\)/);
});
test("training view activation waits for layout visibility before measuring the board",()=>{
 const fs=require("node:fs");
 const app=fs.readFileSync(require("node:path").join(__dirname,"..","script.js"),"utf8");
 assert.match(app,/if \(name === "training"\) requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => applyBoardSize\(/);
});
test("render verification reads the actual board rectangle and publishes measured dimensions", () => {
 const fs=require("node:fs");
 const path=require("node:path");
 const app=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
 assert.match(app,/const rect = board\?\.getBoundingClientRect\(\)/);
 assert.match(app,/renderedWidth/);
 assert.match(app,/renderedHeight/);
 assert.match(app,/new CustomEvent\("cvt:board-size-applied"/);
});
test("fit mode has a distinct persisted mode bit and presets do not overwrite training history", () => {
 const fs = require("node:fs");
 const path = require("node:path");
 const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
 assert.match(app, /save\("cvt-board-fit-v1", true\)/);
 assert.match(app, /save\(KEYS\.boardSize, requested\)/);
 assert.match(app, /markSettingsCustomized\(\)/);
});

test("available size is measured from the stable board section instead of the self-sizing wrapper", () => {
 const fs = require("node:fs");
 const path = require("node:path");
 const app = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
 const measure = app.slice(app.indexOf("function measureBoardMax"), app.indexOf("function applyBoardSize"));
 assert.match(measure, /section\?\.getBoundingClientRect\(\)/);
 assert.doesNotMatch(measure, /middleRect\?\.width/);
 assert.match(app, /save\("cvt-board-fit-v1", shouldFitBoard\)/);
});

test("board sizing calculation reserves coordinate columns and always constrains the square to available viewport",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const app=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 const measure=app.slice(app.indexOf("function measureBoardMax"),app.indexOf("function applyBoardSize"));
 assert.match(measure,/panel\?\.getBoundingClientRect\(\)/);
 assert.match(measure,/const gutters = 22 \+ 22 \+ 12/);
 assert.match(app,/renderedWidth/);
 assert.match(app,/renderedHeight/);
 assert.match(app,/new CustomEvent\("cvt:board-size-applied"/);
 assert.match(css,/SINGLE SOURCE OF TRUTH: RESPONSIVE TRAINING BOARD DIMENSIONS/);
 assert.match(css,/min-width: var\(--cvt-board-target, 420px\) !important/);
});
