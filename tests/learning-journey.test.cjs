"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const journey=require("../learning-journey.js");
test("journey contains eight units with three lessons each",()=>{assert.equal(journey.units.length,8);assert.ok(journey.units.every(u=>u.lessons.length===3));});
test("fresh progress unlocks only the first unit",()=>{const s=journey.normalize(null);assert.equal(journey.completedCount(s),0);assert.equal(journey.unlocked(s,0),true);assert.equal(journey.unlocked(s,1),false);});
test("progress normalizes completed lesson keys and ignores invalid data",()=>{const s=journey.normalize({version:1,completed:{"0-0":true,"0-9":true,"bad":true,"1-0":"yes"}});assert.equal(journey.completedCount(s),1);assert.equal(journey.stars(s,0),1);});
test("next unit unlocks only after every previous lesson is completed",()=>{const s=journey.normalize({version:1,completed:{"0-0":true,"0-1":true,"0-2":true}});assert.equal(journey.unlocked(s,1),true);assert.equal(journey.unlocked(s,2),false);});
