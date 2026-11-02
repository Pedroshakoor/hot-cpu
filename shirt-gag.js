(function(root){'use strict';
const durations={changing:1.2,throwing:1,returning:2.1,dressing:1.2};
function create(){return {phase:'dressed',time:0,cooldown:0};}
function enter(s,phase){s.phase=phase;s.time=0;}
function pinned(s){return s.phase!=='dressed';}
function swim(s){return !['dressed','prepare'].includes(s.phase) &&
 (s.phase!=='changing'||s.time>=.6) && (s.phase!=='dressing'||s.time<.6);}
function location(s){
 if(s.phase==='dressed'||s.phase==='prepare'||s.phase==='changing'&&s.time<.6||s.phase==='dressing'&&s.time>=.6)return 'woman';
 if(s.phase==='changing')return 'woman-hand';
 if(s.phase==='throwing')return 'air-out';
 if(s.phase==='covered'||s.phase==='prepareReturn'||s.phase==='returning'&&s.time<.2)return 'owner-head';
 if(s.phase==='returning')return s.time<.95?'owner-hand':s.time<1.95?'air-return':'woman-hand';
 return 'woman-hand';
}
function update(s,input,dt){
 dt=Math.max(0,Math.min(.1,Number(dt)||0));
 s.cooldown=Math.max(0,s.cooldown-dt);
 const pressure=Math.round(Number(input.pressure)||0);
 if(s.phase==='dressed'){
  if(input.ready && input.ownerReady && pressure>=75 && !s.cooldown)enter(s,'prepare');
  return;
 }
 s.time+=dt;
 if(s.phase==='prepare'){
  if(pressure<65)enter(s,'dressed');
  else if(input.girlReady)enter(s,'changing');
 }else if(s.phase==='changing'&&s.time>=durations.changing)enter(s,'throwing');
 else if(s.phase==='throwing'&&s.time>=durations.throwing)enter(s,'covered');
 else if(s.phase==='covered'&&s.time>=.8&&pressure<65)enter(s,'prepareReturn');
 else if(s.phase==='prepareReturn'){
  if(pressure>=75)enter(s,'covered');
  else if(input.girlReady)enter(s,'returning');
 }else if(s.phase==='returning'&&s.time>=durations.returning)enter(s,'dressing');
 else if(s.phase==='dressing'&&s.time>=durations.dressing){enter(s,'dressed');s.cooldown=4;}
}
const api={create,update,pinned,swim,location,durations};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ShirtGag=api;
})(typeof window==='object'?window:globalThis);
