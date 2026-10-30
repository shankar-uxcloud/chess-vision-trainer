/* Weekly challenges: deterministic season keys, scoring, local persistence and Supabase leaderboard. */
(function(root){
 "use strict";
 const STORAGE_KEY="cvt-weekly-challenges-v1";
 const BOARD_TABLE="cvt_weekly_leaderboard";
 function weekKey(date=new Date()){
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-day);
  const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const week=Math.ceil((((d-yearStart)/86400000)+1)/7);
  return d.getUTCFullYear()+"-W"+String(week).padStart(2,"0");
 }
 function seasonBounds(date=new Date()){
  const day=(date.getDay()+6)%7; const start=new Date(date.getFullYear(),date.getMonth(),date.getDate()-day);
  start.setHours(0,0,0,0); const end=new Date(start); end.setDate(end.getDate()+7);
  return {start,end};
 }
 function scoreSession(session){
  if(!session||typeof session!=="object")return 0;
  const correct=Math.max(0,Math.min(10000,Math.floor(Number(session.correct)||0)));
  const accuracy=Math.max(0,Math.min(100,Number(session.accuracy)||0));
  const streak=Math.max(0,Math.min(10000,Math.floor(Number(session.bestStreak)||0)));
  return correct*10+(accuracy>=90?25:0)+(accuracy===100?25:0)+Math.min(streak,25)*2;
 }
 function emptySeason(key=weekKey()){
  return {version:1,week:key,points:0,sessions:0,correct:0,bonusClaimed:false,sessionIds:[],updatedAt:new Date().toISOString()};
 }
 function validateSeason(value,key=weekKey()){
  if(!value||typeof value!=="object"||Array.isArray(value)||value.version!==1||value.week!==key)return emptySeason(key);
  const n=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000?x:0;
  const sessionIds=Array.isArray(value.sessionIds)?[...new Set(value.sessionIds.filter(x=>typeof x==="string"&&x.length>0&&x.length<=128))].slice(-100):[];
  const pendingSessions=Array.isArray(value.pendingSessions)?value.pendingSessions.filter(x=>x&&typeof x==="object"&&typeof x.sessionId==="string"&&sessionIds.includes(x.sessionId)).slice(-100):[];
  return {version:1,week:key,points:n(value.points),sessions:n(value.sessions),correct:n(value.correct),bonusClaimed:value.bonusClaimed===true,
   sessionIds,pendingSessions,updatedAt:typeof value.updatedAt==="string"?value.updatedAt:new Date().toISOString()};
 }
 function addSession(season,session,key=weekKey(),answerEvents=[]){
  const current=validateSeason(season,key);
  const id=String(session?.sessionId||session?.id||session?.date||session?.completedAt||"");
  if(!session||!id||current.sessionIds.includes(id))return current;
  const points=scoreSession(session);
  current.points+=points;current.sessions++;current.correct+=Math.max(0,Math.floor(Number(session.correct)||0));
  current.sessionIds.push(id);current.sessionIds=current.sessionIds.slice(-100);
  const accuracy=Number(session.accuracy);
  const duration=Number(session.duration);
  const completedAt=session.date||session.completedAt||new Date().toISOString();
  const mode=["square","coordinate","reverse","knight","blindfold","color","custom","daily"].includes(session.mode)?session.mode:"custom";
  const answers=Array.isArray(answerEvents)?answerEvents.filter(event=>
   event&&typeof event==="object"&&event.sessionId===id&&event.mode===mode&&
   typeof event.correct==="boolean"&&typeof event.targetSquare==="string"&&/^[a-h][1-8]$/.test(event.targetSquare)&&
   Number.isFinite(Number(event.reactionTime))&&Number(event.reactionTime)>=0&&
   typeof event.timestamp==="string"&&Number.isFinite(Date.parse(event.timestamp))
  ).slice(-10000).map(event=>({
   sessionId:id,mode,targetSquare:event.targetSquare,correct:event.correct,
   reactionTime:Math.min(3600000,Math.round(Number(event.reactionTime))),timestamp:event.timestamp
  })):[];
  if(answers.length)current.pendingSessions.push({
   sessionId:id,mode,answers,completedAt:typeof completedAt==="string"?completedAt:new Date().toISOString()
  });
  current.pendingSessions=current.pendingSessions.slice(-100);
  current.updatedAt=new Date().toISOString();
  return current;
 }
 function rankRows(rows){
  return (Array.isArray(rows)?rows:[]).filter(r=>r&&typeof r.display_name==="string"&&r.display_name.trim()&&Number.isFinite(Number(r.points))&&Number(r.points)>=0)
   .map(r=>({user_id:typeof r.user_id==="string"?r.user_id:"",display_name:r.display_name.trim().slice(0,60),points:Math.floor(Number(r.points)),sessions:Math.max(0,Math.floor(Number(r.sessions)||0)),correct:Math.max(0,Math.floor(Number(r.correct)||0))}))
   .sort((a,b)=>b.points-a.points||b.correct-a.correct||a.display_name.localeCompare(b.display_name)).slice(0,100);
 }
 const api={weekKey,seasonBounds,scoreSession,emptySeason,validateSeason,addSession,rankRows};
 root.CVTWeeklyChallengeCore=api;
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(typeof document==="undefined")return;
 let userId=null,displayName="Chess Player",busy=false;
 function getLocal(key=weekKey()){
  try{return validateSeason(JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"),key);}catch(_){return emptySeason(key);}
 }
 function saveLocal(season){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(season));}catch(e){console.warn("Weekly challenge local save failed",e);}}
 function pointsId(){return "cvt-weekly-points-"+weekKey();}
 function $id(id){return document.getElementById(id);}
 function setText(id,value){const el=$id(id);if(el)el.textContent=String(value);}
 function render(){
  const season=getLocal(),bounds=seasonBounds(),remaining=Math.max(0,bounds.end-Date.now());
  const days=Math.floor(remaining/86400000),hours=Math.floor((remaining%86400000)/3600000);
  setText("weeklySeasonLabel","SEASON "+season.week);
  setText("weeklyTimeRemaining",days+"D "+hours+"H");
  setText("weeklyMyPoints",season.points.toLocaleString());
  setText("weeklyMySessions",season.sessions);
  setText("weeklyMissionProgressLabel",Math.min(5,season.sessions)+" / 5 sessions");
  setText("weeklyMissionPercent",Math.min(100,Math.round(season.sessions/5*100))+"%");
  const fill=$id("weeklyMissionProgressFill");if(fill)fill.style.width=Math.min(100,season.sessions/5*100)+"%";
  setText("weeklyMissionText",season.sessions>=5?"Mission complete! Your consistency bonus has been unlocked.":"Complete "+(5-season.sessions)+" more training session"+(5-season.sessions===1?"":"s")+" this week to unlock the consistency bonus.");
  setText("weeklyMissionReward",season.bonusClaimed?"CLAIMED · +250 PTS":"+250 PTS");
  setText("weeklyMyRank",userId?"—":"LOCAL");
  setText("weeklyRankCaption",userId?"Loading your season rank…":"Local score only");
  const scope=$id("weeklyLeaderboardScope");
  if(scope&&scope.value==="local")renderBoard([localRow(season)],"Showing this device's weekly score.");
  else if(!userId)renderBoard([],"Sign in to see the shared leaderboard. Your local score is saved here.");
 }
 function localRow(season=getLocal()){
  return {user_id:userId||"local-player",display_name:displayName||"Local Player",points:season.points,sessions:season.sessions,correct:season.correct};
 }
 function renderBoard(rows,message){
  const box=$id("weeklyLeaderboardList");if(!box)return;box.innerHTML="";
  if(!rows.length){const empty=document.createElement("div");empty.className="weekly-empty-state";const icon=document.createElement("span");icon.textContent="♟";const title=document.createElement("strong");title.textContent="No leaderboard entries yet";const p=document.createElement("p");p.textContent="Complete a training session and sync your score to appear here.";empty.append(icon,title,p);box.appendChild(empty);}
  rows.forEach((row,i)=>{const item=document.createElement("div");item.className="weekly-leader-row"+(row.user_id===userId?" is-you":"");const rank=document.createElement("span");rank.className="weekly-rank-number";rank.textContent=String(i+1).padStart(2,"0");const avatar=document.createElement("span");avatar.className="weekly-player-avatar";avatar.textContent=(row.display_name[0]||"♟").toUpperCase();const name=document.createElement("strong");name.textContent=row.display_name+(row.user_id===userId?" (you)":"");const meta=document.createElement("small");meta.textContent=row.sessions+" sessions · "+row.correct+" correct";const copy=document.createElement("div");copy.className="weekly-player-copy";copy.append(name,meta);const points=document.createElement("b");points.className="weekly-player-points";points.textContent=Number(row.points).toLocaleString()+" pts";item.append(rank,avatar,copy,points);box.appendChild(item);});
  setText("weeklyBoardFooter",message||"Rankings update when players sync their scores.");
  const me=rows.findIndex(row=>row.user_id===userId);setText("weeklyMyRank",me>=0?"#"+(me+1):userId?"Unranked":"LOCAL");
  setText("weeklyRankCaption",me>=0?"Your current season position":userId?"Sync a score to join":"Local score only");
 }
 async function refreshBoard(){
  const scope=$id("weeklyLeaderboardScope");
  if(scope&&scope.value==="local"){renderBoard([localRow()],"Showing this device's weekly score.");return;}
  const client=root.CVT_SUPABASE_CLIENT;
  if(!client||!userId){renderBoard([],"Sign in and apply the leaderboard migration to enable shared rankings.");return;}
  setText("weeklyBoardFooter","Loading current season rankings…");
  try{
   const {data,error}=await client.from(BOARD_TABLE).select("user_id,display_name,points,sessions,correct").eq("week_key",weekKey()).order("points",{ascending:false}).limit(100);
   if(error)throw error;
   renderBoard(api.rankRows(data),data?.length?"Weekly rankings · "+weekKey():"No scores synced for this season yet.");
  }catch(error){console.warn("Weekly leaderboard load failed",error);renderBoard([],"Cloud leaderboard unavailable. Apply supabase/migrations/20261026_weekly_leaderboard.sql and retry.");}
 }
 async function sync(){
  const client=root.CVT_SUPABASE_CLIENT;
  if(!client||!userId){setText("weeklyBoardFooter","Sign in to sync this score to the shared leaderboard.");if(typeof root.toast==="function")root.toast("Sign in to sync your weekly score.");return false;}
  if(busy)return false;busy=true;
  try{
   let season=getLocal();
   if(!season.pendingSessions.length){
    setText("weeklyBoardFooter","No new session records to sync. Complete a new training session first.");
    return false;
   }
   const pending=season.pendingSessions.slice(0,20);
   const {data,error}=await client.functions.invoke("weekly-challenge-submit",{
    body:{weekKey:season.week,sessions:pending}
   });
   if(error)throw error;
   if(!data?.ok)throw new Error(data?.message||"Weekly score submission was rejected.");
   season=getLocal();
   const synced=new Set(pending.map(item=>item.sessionId));
   season.pendingSessions=season.pendingSessions.filter(item=>!synced.has(item.sessionId));
   saveLocal(season);
   setText("weeklyBoardFooter","Server-calculated weekly scores synced · "+new Date().toLocaleTimeString());
   render();await refreshBoard();return true;
  }catch(error){console.warn("Weekly score sync failed",error);setText("weeklyBoardFooter","Sync failed. Your local score is safe; retry when available.");return false;}
  finally{busy=false;}
 }
 function recordSession(session,answerEvents=[]){
  const key=weekKey(),before=getLocal(key),after=addSession(before,session,key,answerEvents);
  if(after.sessions!==before.sessions){if(after.sessions>=5&&!after.bonusClaimed){after.points+=250;after.bonusClaimed=true;}saveLocal(after);render();if(userId)sync();}
 }
 root.renderWeeklyChallenges=render;
 root.refreshWeeklyLeaderboard=refreshBoard;
 root.syncWeeklyChallengeScore=sync;
 root.recordWeeklyChallengeSession=recordSession;
 root.addEventListener("cvt:auth-state",event=>{
  const user=event.detail?.user||null;userId=user&&typeof user.id==="string"?user.id:null;
  displayName=user?.display_name||user?.email?.split("@")[0]||"Chess Player";render();if(userId)refreshBoard();
 });
 document.addEventListener("click",event=>{
  const target=event.target.closest?.("[data-nav='weekly']");if(target)render();
 });
 $id("weeklyStartTraining")?.addEventListener("click",()=>{if(typeof root.setView==="function")root.setView("training");else location.hash="#cvt-training";});
 $id("weeklyRefreshBoard")?.addEventListener("click",()=>{void refreshBoard();});
 $id("weeklySyncNow")?.addEventListener("click",()=>{void sync();});
 $id("weeklyLeaderboardScope")?.addEventListener("change",()=>{if($id("weeklyLeaderboardScope").value==="local")renderBoard([localRow()],"Showing this device's weekly score.");else void refreshBoard();});
 render();
})(typeof window!=="undefined"?window:globalThis);
