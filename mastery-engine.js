/* Chess Vision Mastery Engine — deterministic, local-first learning intelligence.
 * Uses only recorded answers. No paid API, generated statistics, or random recommendations.
 */
(function(root){
 "use strict";
 const DAY=86400000;
 const INTERVALS=Object.freeze([1,2,4,7,14,30]);
 const MODES=Object.freeze({
  square:{label:"Square Vision",nav:"training"},
  coordinate:{label:"Coordinate Trainer",nav:"training"},
  reverse:{label:"Reverse Coordinates",nav:"training"},
  knight:{label:"Knight Vision",nav:"training"},
  blindfold:{label:"Blindfold Training",nav:"training"},
  color:{label:"Color Recognition",nav:"training"},
  custom:{label:"Custom Practice",nav:"training"},
  daily:{label:"Daily Challenge",nav:"training"},
  mindpalace:{label:"Mind Palace",nav:"mindpalace"}
 });
 const validSquare=s=>typeof s==="string"&&/^[a-h][1-8]$/.test(s);
 function recordKey(r){
  return [r.sessionId||"legacy",r.attempt??"",r.timestamp||"",r.targetSquare||"",r.mode||""].join("|");
 }
 function validRecords(records){
  return (Array.isArray(records)?records:[]).filter(r=>r&&typeof r.correct==="boolean"&&validSquare(r.targetSquare)&&
   Number.isFinite(Number(r.reactionTime))&&Number(r.reactionTime)>=0&&Number.isFinite(Date.parse(r.timestamp||"")));
 }
 function summarize(records,options={}){
  const all=validRecords(records),sampleSize=Math.max(5,Math.min(500,Number(options.sampleSize)||120));
  const recent=all.slice(-sampleSize),previous=all.slice(-sampleSize*2,-sampleSize);
  const correct=recent.filter(r=>r.correct).length;
  const avgReaction=recent.length?Math.round(recent.reduce((s,r)=>s+Number(r.reactionTime),0)/recent.length):null;
  const modeMap={};const squareMap={};
  recent.forEach(r=>{
   const mode=MODES[r.mode]?r.mode:"custom";
   modeMap[mode]||={mode,seen:0,correct:0,wrong:0,reactionTotal:0};
   const m=modeMap[mode];m.seen++;if(r.correct)m.correct++;else m.wrong++;m.reactionTotal+=Number(r.reactionTime);
   const sq=r.targetSquare;squareMap[sq]||={square:sq,seen:0,wrong:0,lastSeen:r.timestamp};
   squareMap[sq].seen++;if(!r.correct)squareMap[sq].wrong++;squareMap[sq].lastSeen=r.timestamp;
  });
  const modes=Object.values(modeMap).map(m=>({...m,accuracy:Math.round(m.correct/m.seen*100),avgReaction:Math.round(m.reactionTotal/m.seen)}));
  const weakModes=modes.filter(m=>m.seen>=5&&m.accuracy<80).sort((a,b)=>a.accuracy-b.accuracy||b.seen-a.seen);
  const weakSquares=Object.values(squareMap).filter(s=>s.seen>=3&&s.wrong>=2)
   .map(s=>({...s,missRate:s.wrong/s.seen})).filter(s=>s.missRate>=.34)
   .sort((a,b)=>b.missRate-a.missRate||b.wrong-a.wrong||a.square.localeCompare(b.square)).slice(0,8);
  const prevAccuracy=previous.length?Math.round(previous.filter(r=>r.correct).length/previous.length*100):null;
  const accuracy=recent.length?Math.round(correct/recent.length*100):null;
  return {sample:recent.length,correct,wrong:recent.length-correct,accuracy,avgReaction,
   previousSample:previous.length,previousAccuracy,
   trend:accuracy===null||prevAccuracy===null?null:accuracy-prevAccuracy,
   modes,weakModes,weakSquares};
 }
 function recommendations(summary){
  if(!summary||summary.sample<5)return [{id:"baseline-square",mode:"square",title:"Build your baseline",reason:"There are not yet five valid recorded answers. Complete a short Square Vision session so recommendations can use real results.",priority:1}];
  const out=[];
  summary.weakSquares.slice(0,2).forEach(s=>out.push({
   id:"square-"+s.square,mode:"square",targetSquare:s.square,title:"Revisit "+s.square,
   reason:s.wrong+" incorrect answers from "+s.seen+" recorded attempts ("+Math.round(s.missRate*100)+"% missed).",
   priority:100+Math.round(s.missRate*100)
  }));
  summary.weakModes.slice(0,3).forEach(m=>out.push({
   id:"mode-"+m.mode,mode:m.mode,title:"Strengthen "+(MODES[m.mode]?.label||m.mode),
   reason:m.correct+" correct from "+m.seen+" recorded answers ("+m.accuracy+"% accuracy); aim for 80% before increasing difficulty.",
   priority:90+(80-m.accuracy)
  }));
  if(!out.length){
   const slow=summary.modes.filter(m=>m.seen>=5).sort((a,b)=>b.avgReaction-a.avgReaction)[0];
   if(slow&&slow.accuracy>=80)out.push({id:"speed-"+slow.mode,mode:slow.mode,title:"Build fluent recognition",
    reason:"Accuracy is "+slow.accuracy+"%, while average response time is "+(slow.avgReaction/1000).toFixed(1)+" seconds across "+slow.seen+" answers. Maintain accuracy while gradually improving recall speed.",priority:50});
   else out.push({id:"maintain-variety",mode:"coordinate",title:"Maintain a balanced routine",
    reason:"No skill has enough evidence to flag as weak. Continue varied practice and collect more answers.",priority:10});
  }
  return out.sort((a,b)=>b.priority-a.priority).slice(0,3);
 }
 function normalizeReviewState(value){
  if(!value||typeof value!=="object"||Array.isArray(value)||value.version!==1||!value.items||typeof value.items!=="object"||Array.isArray(value.items))return {version:1,items:{},processed:[]};
  const items={};
  Object.entries(value.items).forEach(([square,item])=>{
   if(!validSquare(square)||!item||typeof item!=="object")return;
   const box=Number(item.box),repetitions=Number(item.repetitions),lapses=Number(item.lapses),due=Date.parse(item.dueAt),last=Date.parse(item.lastReviewedAt);
   if(!Number.isInteger(box)||box<0||box>=INTERVALS.length||!Number.isInteger(repetitions)||repetitions<0||!Number.isInteger(lapses)||lapses<0||!Number.isFinite(due)||!Number.isFinite(last))return;
   items[square]={box,repetitions,lapses,dueAt:new Date(due).toISOString(),lastReviewedAt:new Date(last).toISOString()};
  });
  const processed=Array.isArray(value.processed)?value.processed.filter(x=>typeof x==="string").slice(-5000):[];
  return {version:1,items,processed};
 }
 function applyRecord(state,record,now=Date.now()){
  const next=normalizeReviewState(state);
  if(!record||!validSquare(record.targetSquare)||typeof record.correct!=="boolean")return next;
  const key=recordKey(record);if(next.processed.includes(key))return next;
  const square=record.targetSquare,old=next.items[square]||{box:0,repetitions:0,lapses:0};
  const box=record.correct?Math.min(INTERVALS.length-1,old.box+1):0;
  const repetitions=record.correct?old.repetitions+1:0;
  const lapses=record.correct?old.lapses:old.lapses+1;
  const dueAt=record.correct?now+INTERVALS[box]*DAY:now;
  next.items[square]={box,repetitions,lapses,dueAt:new Date(dueAt).toISOString(),lastReviewedAt:new Date(now).toISOString()};
  next.processed.push(key);if(next.processed.length>5000)next.processed=next.processed.slice(-5000);
  return next;
 }
 function applyRecords(state,records,now=Date.now()){
  let next=normalizeReviewState(state);
  validRecords(records).forEach(r=>{next=applyRecord(next,r,now);});
  return next;
 }
 function dueReviews(state,now=Date.now(),limit=12){
  const next=normalizeReviewState(state);
  return Object.entries(next.items).filter(([,v])=>Date.parse(v.dueAt)<=now)
   .map(([square,v])=>({square,box:v.box,repetitions:v.repetitions,lapses:v.lapses,dueAt:v.dueAt}))
   .sort((a,b)=>Date.parse(a.dueAt)-Date.parse(b.dueAt)||a.square.localeCompare(b.square)).slice(0,Math.max(0,Math.min(64,limit)));
 }
 function markReview(state,square,correct,now=Date.now()){
  if(!validSquare(square))return normalizeReviewState(state);
  const synthetic={targetSquare:square,correct:!!correct,reactionTime:0,mode:"square",sessionId:"review-"+now,attempt:1,timestamp:new Date(now).toISOString()};
  return applyRecord(state,synthetic,now);
 }
 const api={INTERVALS,MODES,validRecords,summarize,recommendations,normalizeReviewState,applyRecord,applyRecords,dueReviews,markReview,recordKey};
 root.CVTMasteryEngine=api;
 if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
