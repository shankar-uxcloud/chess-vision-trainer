/* Shared, testable sizing rules for Chess Vision Trainer settings. */
(function(root){
 "use strict";
 const PRESETS=Object.freeze({small:70,medium:85,large:100,"extra-large":115,maximum:130});
 const PROFILES=Object.freeze({
  balanced:Object.freeze({size:100,theme:"emerald",labels:false,coords:true,pieces:false,sound:true,ticks:true,animations:true,interfaceTheme:"light"}),
  focus:Object.freeze({size:115,theme:"midnight",labels:false,coords:true,pieces:false,sound:false,ticks:false,animations:false,interfaceTheme:"dark"}),
  performance:Object.freeze({size:130,theme:"classic",labels:false,coords:true,pieces:false,sound:false,ticks:false,animations:false,interfaceTheme:"dark"})
 });
 function clampPercent(value){const n=Number(value);if(!Number.isFinite(n))return 100;return Math.max(60,Math.min(130,Math.round(n/5)*5));}
 function computeTarget(availableWidth,percent,fit=false){const available=Math.max(160,Math.floor(Number(availableWidth)||160));if(fit)return available;return Math.max(160,Math.min(available,Math.round(available*.78*clampPercent(percent)/100)));}
 function validatePreferences(value){
  const v=value&&typeof value==="object"?value:{};
  const themes=["dark","light","neon","heavy"], boards=["emerald","walnut","ice","rose","midnight","classic"];
  return {size:clampPercent(v.size),profile:["balanced","focus","performance","custom"].includes(v.profile)?v.profile:"balanced",
   interfaceTheme:themes.includes(v.interfaceTheme)?v.interfaceTheme:"light",boardTheme:boards.includes(v.boardTheme)?v.boardTheme:"emerald",
   labels:v.labels===true,coords:v.coords!==false,pieces:v.pieces===true,sound:v.sound!==false,ticks:v.ticks!==false,animations:v.animations!==false};
 }
 const api={PRESETS,PROFILES,clampPercent,computeTarget,validatePreferences};
 root.CVTBoardSettingsCore=api;
 if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
