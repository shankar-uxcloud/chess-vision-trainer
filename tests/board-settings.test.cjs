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
