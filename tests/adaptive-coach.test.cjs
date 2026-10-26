"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const coach=require("../adaptive-coach.js");
test("empty history returns a safe beginner plan",()=>{const s=coach.summarize([]);assert.equal(s.sample,0);assert.equal(s.accuracy,null);assert.equal(coach.makePlan(s).length,3);});
test("accuracy uses only valid recent answer records",()=>{const s=coach.summarize([{correct:true},{correct:false},{correct:"yes"},{correct:true}]);assert.equal(s.sample,3);assert.equal(s.correct,2);assert.equal(s.accuracy,67);});
test("weak squares require repeat attempts and rank by miss rate",()=>{const s=coach.summarize([{correct:false,targetSquare:"e4"},{correct:true,targetSquare:"e4"},{correct:false,targetSquare:"e4"},{correct:false,targetSquare:"a1"},{correct:false,targetSquare:"a1"}]);assert.equal(s.weakSquares[0].square,"a1");assert.equal(s.weakSquares[0].rate,1);});
test("recommendations are deterministic and have three steps",()=>{const s=coach.summarize([{correct:false,mode:"knight"},{correct:true,mode:"knight"},{correct:false,mode:"knight"}]);assert.equal(s.focus,"knight");assert.equal(coach.makePlan(s).length,3);});
