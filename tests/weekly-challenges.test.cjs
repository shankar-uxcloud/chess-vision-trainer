"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const core=require("../weekly-challenges.js");

test("week keys are stable and follow ISO week numbering",()=>{
 assert.equal(core.weekKey(new Date(2026,9,26)),"2026-W44");
 assert.equal(core.weekKey(new Date(2026,0,1)),"2026-W01");
 assert.equal(core.weekKey(new Date(2025,11,31)),"2026-W01");
});
test("season bounds span Monday to the following Monday",()=>{
 const {start,end}=core.seasonBounds(new Date(2026,9,26,15,30));
 assert.equal(start.getDay(),1);assert.equal(start.getHours(),0);
 assert.equal(end-start,7*24*60*60*1000);
});
test("score formula rewards correct answers, high accuracy and streaks",()=>{
 assert.equal(core.scoreSession({correct:10,accuracy:80,bestStreak:4}),108);
 assert.equal(core.scoreSession({correct:10,accuracy:95,bestStreak:4}),133);
 assert.equal(core.scoreSession({correct:10,accuracy:100,bestStreak:40}),200);
 assert.equal(core.scoreSession(null),0);
});
test("season validation resets wrong versions and clamps invalid counters",()=>{
 assert.equal(core.validateSeason({version:9,week:"2026-W44"}, "2026-W44").points,0);
 const valid=core.validateSeason({version:1,week:"2026-W44",points:-5,sessions:4,correct:12,sessionIds:["x","x",2],bonusClaimed:true},"2026-W44");
 assert.equal(valid.points,0);assert.equal(valid.sessions,4);assert.deepEqual(valid.sessionIds,["x"]);assert.equal(valid.bonusClaimed,true);
});
test("a session contributes once and duplicate session IDs do not inflate scores",()=>{
 const first=core.addSession(core.emptySeason("2026-W44"),{sessionId:"session-1",correct:8,accuracy:100,bestStreak:5},"2026-W44");
 assert.equal(first.sessions,1);assert.equal(first.correct,8);assert.equal(first.points,140);
 const duplicate=core.addSession(first,{sessionId:"session-1",correct:99,accuracy:100,bestStreak:99},"2026-W44");
 assert.deepEqual(duplicate,first);
});
test("leaderboard ranking is deterministic and ignores invalid rows",()=>{
 const rows=core.rankRows([
  {user_id:"b",display_name:"Bee",points:100,correct:5,sessions:2},
  {user_id:"a",display_name:"Aye",points:100,correct:8,sessions:1},
  {user_id:"c",display_name:"Crow",points:50,sessions:1},
  {user_id:"bad",display_name:"",points:-1}
 ]);
 assert.deepEqual(rows.map(r=>r.user_id),["a","b","c"]);
});

test("new weekly sessions retain a bounded pending server-submission record",()=>{
 const first=core.addSession(core.emptySeason("2026-W44"),{
  sessionId:"server-session-1",correct:8,mistakes:2,accuracy:80,bestStreak:4,
  duration:60,mode:"square",date:"2026-10-26T12:00:00.000Z"
 },"2026-W44",[
  {sessionId:"server-session-1",mode:"square",targetSquare:"e4",correct:true,reactionTime:400,timestamp:"2026-10-26T12:00:00.000Z"},
  {sessionId:"server-session-1",mode:"square",targetSquare:"d4",correct:false,reactionTime:600,timestamp:"2026-10-26T12:00:01.000Z"}
 ]);
 assert.equal(first.pendingSessions.length,1);
 assert.deepEqual(first.pendingSessions[0],{
  sessionId:"server-session-1",mode:"square",answers:[
   {sessionId:"server-session-1",mode:"square",targetSquare:"e4",correct:true,reactionTime:400,timestamp:"2026-10-26T12:00:00.000Z"},
   {sessionId:"server-session-1",mode:"square",targetSquare:"d4",correct:false,reactionTime:600,timestamp:"2026-10-26T12:00:01.000Z"}
  ],completedAt:"2026-10-26T12:00:00.000Z"
 });
});

test("legacy weekly local data remains readable without pending session details",()=>{
 const legacy=core.validateSeason({
  version:1,week:"2026-W44",points:120,sessions:2,correct:10,sessionIds:["old-1"]
 },"2026-W44");
 assert.equal(legacy.points,120);
 assert.deepEqual(legacy.pendingSessions,[]);
});

test("duplicate local session identifiers do not create duplicate pending server records",()=>{
 const first=core.addSession(core.emptySeason("2026-W44"),{
  sessionId:"repeat-id",correct:4,accuracy:80,bestStreak:2,mode:"knight",duration:30
 },"2026-W44",[
  {sessionId:"repeat-id",mode:"knight",targetSquare:"c3",correct:true,reactionTime:300,timestamp:"2026-10-26T12:00:00.000Z"}
 ]);
 const duplicate=core.addSession(first,{
  sessionId:"repeat-id",correct:40,accuracy:100,bestStreak:40,mode:"knight",duration:30
 },"2026-W44",[
  {sessionId:"repeat-id",mode:"knight",targetSquare:"c3",correct:true,reactionTime:300,timestamp:"2026-10-26T12:00:00.000Z"}
 ]);
 assert.equal(duplicate.pendingSessions.length,1);
 assert.equal(duplicate.pendingSessions[0].answers.length,1);
});
