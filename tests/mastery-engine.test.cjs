"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const M=require("../mastery-engine.js");
const now=Date.parse("2026-10-31T12:00:00.000Z");
function rec(square,correct,mode="square",i=0,rt=700){
 return {targetSquare:square,correct,reactionTime:rt,mode,perspectiveSide:"white",sessionId:"session-"+i,attempt:i+1,timestamp:new Date(now+i*1000).toISOString(),difficulty:"standard"};
}

test("summary uses only valid answer records and calculates accuracy and reaction time",()=>{
 const rows=[rec("a1",true,"square",0,500),rec("b2",false,"square",1,900),{targetSquare:"z9",correct:false,reactionTime:20,timestamp:"bad"}];
 const s=M.summarize(rows);
 assert.equal(s.sample,2);assert.equal(s.accuracy,50);assert.equal(s.avgReaction,700);
});

test("weak squares require repeated evidence and are ordered by miss rate",()=>{
 const rows=[rec("g6",false,"square",0),rec("g6",false,"square",1),rec("g6",true,"square",2),rec("a1",false,"square",3),rec("a1",false,"square",4),rec("a1",false,"square",5)];
 const s=M.summarize(rows);
 assert.equal(s.weakSquares[0].square,"a1");
 assert.equal(s.weakSquares[0].missRate,1);
 assert.equal(s.weakSquares.some(x=>x.square==="g6"),true);
});

test("mode weakness requires five answers and returns evidence-based recommendations",()=>{
 const rows=Array.from({length:6},(_,i)=>rec("c3",i===0,"knight",i));
 const s=M.summarize(rows);
 assert.equal(s.weakModes[0].mode,"knight");
 const r=M.recommendations(s);
 assert.ok(r.some(x=>x.mode==="knight"));
 assert.ok(r.every(x=>x.reason.length>10&&x.id));
});

test("insufficient history produces a baseline plan without invented metrics",()=>{
 const r=M.recommendations(M.summarize([rec("a1",true)]));
 assert.equal(r[0].id,"baseline-square");
 assert.match(r[0].reason,/five valid recorded answers/);
});

test("review scheduler uses fixed Leitner intervals and correct answers advance the box",()=>{
 let state=M.normalizeReviewState(null);
 state=M.applyRecord(state,rec("g6",true,"square",1),now);
 assert.equal(state.items.g6.box,1);
 assert.equal(Date.parse(state.items.g6.dueAt),now+1*86400000);
 state=M.applyRecord(state,rec("g6",true,"square",2),now+1000);
 assert.equal(state.items.g6.box,2);
 assert.equal(Date.parse(state.items.g6.dueAt),now+1000+2*86400000);
});

test("incorrect review resets the interval and schedules immediate repetition",()=>{
 let state=M.applyRecord(null,rec("g6",true,"square",1),now);
 state=M.applyRecord(state,rec("g6",false,"square",2),now+1000);
 assert.equal(state.items.g6.box,0);
 assert.equal(state.items.g6.repetitions,0);
 assert.equal(state.items.g6.lapses,1);
 assert.equal(Date.parse(state.items.g6.dueAt),now+1000);
});

test("duplicate answer events do not change review scheduling twice",()=>{
 const row=rec("g6",true,"square",1);
 let state=M.applyRecord(null,row,now);
 const once=JSON.stringify(state);
 state=M.applyRecord(state,row,now+5000);
 assert.equal(JSON.stringify(state),once);
});

test("due queue is deterministic and persists through normalization",()=>{
 let state=M.applyRecord(null,rec("g6",false,"square",1),now);
 state=M.applyRecord(state,rec("a1",false,"square",2),now+2000);
 const due=M.dueReviews(state,now+3000);
 assert.deepEqual(due.map(x=>x.square),["g6","a1"]);
 assert.deepEqual(M.dueReviews(M.normalizeReviewState(state),now+3000).map(x=>x.square),["g6","a1"]);
});

test("review history remains bounded and rejects malformed squares",()=>{
 let state=M.normalizeReviewState(null);
 for(let i=0;i<5100;i++)state=M.applyRecord(state,{...rec("g6",true,"square",i),sessionId:"s"+i},now+i);
 assert.equal(state.processed.length,5000);
 assert.equal(M.applyRecord(state,{...rec("z9",true),sessionId:"bad"},now).items.g6.repetitions,5100);
});
