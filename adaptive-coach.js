/* Adaptive Training Coach — local-first recommendations from answer history. */
(function(root){
 "use strict";
 const STORAGE_KEY="cvt-answer-records-v1";
 const MODES={
  square:{label:"Square Vision",nav:"training",reason:"Practise spotting target squares quickly."},
  coordinate:{label:"Coordinate Trainer",nav:"training",reason:"Strengthen the link between square names and board locations."},
  knight:{label:"Knight Vision",nav:"training",reason:"Reinforce L-shaped movement and square relationships."},
  mindpalace:{label:"Mind Palace",nav:"mindpalace",reason:"Train visual memory with short recall-and-rebuild rounds."}
 };
 function summarize(records){
  const valid=(Array.isArray(records)?records:[]).filter(r=>r&&typeof r.correct==="boolean").slice(-120);
  const correct=valid.filter(r=>r.correct).length, accuracy=valid.length?Math.round(correct/valid.length*100):null;
  const bySquare={};valid.forEach(r=>{const sq=typeof r.targetSquare==="string"?r.targetSquare:null;if(!sq)return;bySquare[sq]||={seen:0,wrong:0};bySquare[sq].seen++;if(!r.correct)bySquare[sq].wrong++;});
  const weakSquares=Object.entries(bySquare).filter(([,v])=>v.seen>=2).map(([square,v])=>({square,seen:v.seen,wrong:v.wrong,rate:v.wrong/v.seen})).sort((a,b)=>b.rate-a.rate||b.wrong-a.wrong||a.square.localeCompare(b.square)).slice(0,3);
  const misses=valid.filter(r=>!r.correct), modes={};
  misses.forEach(r=>{const raw=String(r.mode||r.trainingMode||"").toLowerCase();const mode=raw.includes("knight")?"knight":raw.includes("coordinate")?"coordinate":raw.includes("mind")?"mindpalace":"square";modes[mode]=(modes[mode]||0)+1;});
  const topMode=Object.entries(modes).sort((a,b)=>b[1]-a[1])[0]?.[0]||"square";
  const focus=weakSquares.length&&weakSquares[0].rate>=.34?"square":topMode;
  return {sample:valid.length,correct,accuracy,weakSquares,misses:misses.length,focus,mode:MODES[focus]||MODES.square};
 }
 function makePlan(summary){
  if(!summary.sample)return [{title:"Complete a short baseline",detail:"Play one 5-minute training session so the coach can learn from real answers."},{title:"Focus on accuracy",detail:"Pause briefly before answering; speed comes after recognition."},{title:"Return for a review",detail:"Your next plan updates as more answers are saved."}];
  const square=summary.weakSquares[0]?.square;
  return [
   {title:"Warm up · 2 minutes",detail:square?"Review "+square+" and nearby squares from both board perspectives.":"Start with a relaxed round of coordinate recognition."},
   {title:"Main drill · "+summary.mode.label,detail:summary.mode.reason},
   {title:"Review · 1 minute",detail:"Aim for careful answers first. Refresh this page after the session to see your updated accuracy."}
  ];
 }
 function readRecords(){try{const data=JSON.parse(root.localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(data)?data:[];}catch(_){return [];}}
 function readStored(key){try{return JSON.parse(root.localStorage.getItem(key)||"null");}catch(_){return null;}}
 function el(id){return root.document?.getElementById(id);}
 function render(){
  if(!root.document)return;
  const records=readRecords();
  const summary=summarize(records),plan=makePlan(summary);
  const mastery=root.CVTMasteryEngine;
  const reviewState=mastery?mastery.normalizeReviewState(readStored("cvt-mastery-reviews-v1")):null;
  const due=mastery?mastery.dueReviews(reviewState,Date.now(),12):[];
  const evidence=mastery?mastery.summarize(records):null;
  const smartRecommendations=mastery?mastery.recommendations(evidence):[];
  const put=(id,value)=>{const node=el(id);if(node)node.textContent=value;};
  put("coachHeadline",summary.sample?(summary.accuracy<75?"Let's build accuracy first.":"Keep the momentum going."):"Build your board vision.");
  put("coachSummary",summary.sample?summary.correct+" correct answers from your latest "+summary.sample+" recorded answers. Your next step is "+summary.mode.label+".":"Finish a training session and your coach will suggest a focused next step.");
  put("coachAccuracy",summary.accuracy===null?"—":summary.accuracy+"%");
  put("coachSample",summary.sample?summary.sample+" recent answers reviewed":"No saved answer history yet");
  put("coachFocus",summary.sample?summary.mode.label:"Discovering");
  put("coachDuration",summary.sample>=30?"8 min":"5 min");
  const planNode=el("coachPlan");if(planNode)planNode.replaceChildren(...plan.map((item,i)=>{const card=root.document.createElement("article");card.className="coach-plan-step";const number=root.document.createElement("span");number.className="coach-step-number";number.textContent=String(i+1).padStart(2,"0");const content=root.document.createElement("div");const title=root.document.createElement("strong");title.textContent=item.title;const detail=root.document.createElement("p");detail.textContent=item.detail;content.append(title,detail);card.append(number,content);return card;}));
  const insights=el("coachInsights");if(insights){insights.replaceChildren();const rows=[];rows.push(summary.sample?"Accuracy across recent answers: "+summary.accuracy+"%.":"No answer data available yet.");rows.push(summary.sample?summary.misses+" incorrect answers in this sample.":"Your first session establishes a baseline.");rows.push(summary.weakSquares.length?"Squares to revisit: "+summary.weakSquares.map(s=>s.square+" ("+s.wrong+"/"+s.seen+" missed)").join(", "):"More repeated square attempts will help reveal specific weak spots.");smartRecommendations.forEach(item=>rows.push("Recommendation: "+item.title+" — "+item.reason));rows.forEach(text=>{const p=root.document.createElement("p");p.textContent=text;insights.append(p);});}
  const reviewNode=el("masteryReviewQueue"),reviewSummary=el("masteryReviewSummary");
  if(reviewSummary)reviewSummary.textContent=due.length?due.length+" squares are due for review now.":"No reviews are due now. New mistakes and difficult squares will be scheduled automatically.";
  if(reviewNode){reviewNode.replaceChildren();if(!due.length){const p=root.document.createElement("p");p.textContent=reviewState&&Object.keys(reviewState.items).length?"All caught up. Your next review is scheduled for a later date.":"Complete a few answers to build your review schedule.";reviewNode.append(p);}else due.forEach(item=>{const card=root.document.createElement("div");card.className="mastery-review-item";const sq=root.document.createElement("strong");sq.textContent=item.square;const meta=root.document.createElement("small");meta.textContent=item.lapses?item.lapses+" lapses":"Review due";card.append(sq,meta);reviewNode.append(card);});}
  const reviewButton=el("masteryStartReviews");if(reviewButton){reviewButton.disabled=!due.length;reviewButton.textContent=due.length?"Start "+due.length+" due reviews →":"No reviews due";}}
  const start=el("coachStartBtn");if(start)start.dataset.coachMode=summary.focus;
  return summary;
 }
 function start(){const s=el("coachStartBtn");const mode=s?.dataset.coachMode||"square";if(mode==="mindpalace"&&typeof root.setView==="function"){root.setView("mindpalace");return;}if(typeof root.setView==="function")root.setView("training");else root.location.hash="#cvt-training";const buttons=root.document.querySelectorAll(".mode-btn");const desired=mode==="knight"?"knight":mode==="coordinate"?"coordinate":"square";const btn=[...buttons].find(b=>b.dataset.mode===desired);if(btn)btn.click();}
 root.CVTAdaptiveCoach={summarize,makePlan,render};
 if(typeof module==="object"&&module.exports)module.exports={summarize,makePlan};
 if(root.document){root.document.addEventListener("DOMContentLoaded",()=>{render();el("coachRefreshBtn")?.addEventListener("click",render);el("coachStartBtn")?.addEventListener("click",start);el("masteryStartReviews")?.addEventListener("click",()=>{const due=root.CVTMasteryEngine?.dueReviews(readStored("cvt-mastery-reviews-v1"),Date.now(),64)||[];if(!due.length)return;root.localStorage.setItem("cvt-mastery-review-mode-v1","true");if(typeof root.setView==="function")root.setView("training");const btn=[...root.document.querySelectorAll(".mode-btn")].find(b=>b.dataset.mode==="square");btn?.click();el("startBtn")?.click();});root.document.addEventListener("click",e=>{if(e.target.closest?.("[data-nav='coach']"))render();});root.addEventListener("storage",e=>{if([STORAGE_KEY,"cvt-mastery-reviews-v1"].includes(e.key))render();});});}
})(typeof window!=="undefined"?window:globalThis);
