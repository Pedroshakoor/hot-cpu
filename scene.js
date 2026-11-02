(()=>{'use strict';
const canvas=document.querySelector('#scene');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});
const W=canvas.width,H=canvas.height, BASE_X=364,BASE_Y=445;
ctx.imageSmoothingEnabled=false;
const img={};
const paths={couch:'couch.png',girl:'girl-poses.png',men:'men-tall.png',rub:'men-rub.png',wave:'men-wave.png'};
for(const [key,path] of Object.entries(paths)){
 const image=new Image();image.decoding='async';image.src='assets/'+path;img[key]=image;
}
function drawCouch(){
 const image=img.couch;if(!image?.complete || !image.naturalWidth)return;
 ctx.drawImage(image,75,202,1714,520,BASE_X,BASE_Y+941-520*1672/1714,1672,520*1672/1714);
}
function applyForegroundOccluder(t){
 ctx.save();ctx.globalCompositeOperation='destination-out';
 drawCouch();drawGirlSprite(t);ctx.restore();
}
// Full-body sprites share one sheet. Source rectangles include transparent gutters.
const spriteRects=[[119,294],[479,306],[854,281],[1212,294],[1584,300]];
const gestureRects={"rub":[[[7,23,189,487,101.5],[204,14,197,495,306.5],[411,28,200,482,512.0],[618,26,196,484,720.5],[827,16,194,494,927.5]],[[5,530,196,489,102.0],[204,524,200,494,306.5],[411,536,201,483,512.5],[617,535,197,484,720.5],[827,525,197,494,927.5]],[[6,1039,191,490,101.5],[205,1031,198,497,306.5],[413,1045,199,484,512.0],[619,1044,195,485,720.5],[831,1034,192,495,927.5]]],"wave":[[[12,24,180,488,102.5],[209,18,191,494,308.5],[411,36,191,476,508.5],[614,29,188,483,711.0],[828,24,193,488,932.5]],[[12,537,180,487,102.5],[207,530,193,494,308.5],[410,548,192,476,508.5],[614,542,188,482,711.0],[822,536,199,488,932.5]],[[13,1048,179,486,102.5],[210,1042,190,492,308.5],[414,1059,188,474,508.5],[614,1053,187,480,711.0],[831,1048,190,486,932.5]]]};
const girlRects=[[139,1,144,155,211.0,152],[513,1,143,156,200.5,153],[887,1,141,156,189.5,152],[1258,1,141,157,176.5,153],[143,176,144,156,215.0,153],[517,176,146,158,206.0,152],[889,176,142,158,192.0,155],[1259,176,142,157,178.0,154],[121,345,166,167,204.0,162],[505,346,151,164,196.5,160],[881,346,148,164,187.0,161],[1246,346,152,165,170.0,161],[141,527,146,155,214.0,152],[517,524,141,158,203.5,132],[887,524,143,158,190.5,135],[1259,524,142,158,178.0,131],[144,699,144,153,216.0,150],[518,703,143,148,205.5,145],[888,703,144,148,192.0,145],[1260,702,143,150,179.5,147],[142,859,142,145,213.0,142],[517,858,141,145,203.5,141],[888,859,141,144,190.5,141],[1257,858,142,145,176.0,141]];
const places=[
 {x:1610,side:1,s:1.43},
 {x:360,side:-1,s:1.50},
 {x:1270,side:1,s:1.58},
 {x:670,side:-1,s:1.47},
 {x:970,side:1,s:1.54},
];
const actors=places.map((p,i)=>({...p,index:i+1,progress:0,want:0,phase:i*1.33,arrived:false,gesture:"idle",gestureStart:0,gestureUntil:0,nextJoy:Infinity}));
const WIN=document.querySelector('#characterWindow');
const state={cpu:6,ram:6,mode:'max',native:false,pressure:6,targetCount:0,activeCount:0,lastCountChange:-1e9,start:performance.now(),demo:null,lastTime:0,emotional:0,scale:1,celebrateUntil:0,sideEyeUntil:0,sideEyeActor:-1,girlStage:0,girlFrame:0,girlGoal:0,girlVelocity:0,girlSpecial:null};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,n)=>{const v=clamp((n-a)/(b-a),0,1);return v*v*(3-2*v)};
const thresholds=[16,32,48,64,80];
function calcCount(n){return thresholds.filter(x=>n>=x).length;}
function pressureValue(){return state.mode==='cpu'?state.cpu:state.mode==='ram'?state.ram:Math.max(state.cpu,state.ram);}
function updateTarget(){state.pressure=pressureValue();const next=calcCount(state.pressure);
 const t=(performance.now()-state.start)/1000;
 if(state.targetCount>=3 && next<=1 && actors.some(a=>a.progress>.5))state.celebrateUntil=t+2;
 if(next>state.targetCount)state.celebrateUntil=0;
 state.targetCount=next;let v=document.querySelector('#pressureReadout');if(v)v.textContent=Math.round(state.pressure)+'%';let s=document.querySelector('#pressureSlider');if(s&&!state.native)s.value=Math.round(state.pressure);}
function setPressure(v){state.cpu=state.ram=clamp(Number(v)||0,0,100);updateTarget();}
function setMode(m){if(!['cpu','ram','max'].includes(m))return;state.mode=m;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m));updateTarget();}
function setScale(v){const s=clamp(Number(v)||100,25,160);state.scale=s/100;if(WIN)WIN.style.transform=state.native?'none':`scale(${state.scale})`;let i=document.querySelector('#sizeSlider');if(i&&!state.native)i.value=s;let r=document.querySelector('#sizeReadout');if(r)r.textContent=Math.round(s)+'%';}
function setNativeMetrics(cpu,ram){state.cpu=clamp(Number(cpu)||0,0,100);state.ram=clamp(Number(ram)||0,0,100);updateTarget();}
window.setSimulatedPressure=setPressure;window.setNativeMetrics=setNativeMetrics;window.setMode=setMode;window.setCompanionScale=setScale;
window.setNative=()=>{state.native=true;document.documentElement.classList.add('native');if(WIN)WIN.style.transform='none';stopDemo();};
function beginGesture(a,gesture,t,duration){
 a.gesture=gesture;a.gestureStart=t;a.gestureUntil=t+duration;
}
function updateGesture(a,t){
 if(!a.want){a.arrived=false;a.gesture='idle';a.nextJoy=Infinity;return;}
 if(a.progress<.985)return;
 if(!a.arrived){a.arrived=true;beginGesture(a,'wave',t,.9);return;}
 if(t<state.celebrateUntil)return;
 if(a.gesture==='wave' && t>=a.gestureUntil){beginGesture(a,'rub',t,2.2);return;}
 if(a.gesture==='rub' && t>=a.gestureUntil){a.gesture='idle';a.nextJoy=t+11+a.index*2.7;}
 if(a.gesture==='idle' && t>=a.nextJoy && state.pressure>=32 &&
    !actors.some(other=>other!==a && other.gesture!=='idle' && t<other.gestureUntil)){
  beginGesture(a,'rub',t,1.8);
  state.sideEyeActor=a.index-1;state.sideEyeUntil=t+1.4;
 }
}
function gestureFrame(a,t){
 const gesture=t<state.celebrateUntil && a.progress>.5?'cheer':a.gesture;
 if(gesture==='idle')return null;
 const key=gesture==='rub'?'rub':'wave';
 const start=gesture==='cheer'?state.celebrateUntil-2:a.gestureStart;
 const phase=Math.floor(Math.max(0,t-start)*(key==='rub'?9:7))%4;
 return {key,row:[0,1,2,1][phase],gesture};
}
function advance(t,dt){
 const now=t*1000;
 const stepMs=1800;
 if(t>=state.celebrateUntil && state.activeCount!==state.targetCount && now-state.lastCountChange>=stepMs){
  const up=state.targetCount>state.activeCount;
  state.activeCount+=up?1:-1;
  state.lastCountChange=now;
 }
 actors.forEach((a,i)=>{
  a.want=i<state.activeCount?1:0;
  // The character moves from fully OUTSIDE the screen, not an opacity fade.
  a.progress+=(a.want-a.progress)*(1-Math.exp(-(a.want?2.55:2.5)*dt));
  if(Math.abs(a.progress-a.want)<0.0004)a.progress=a.want;
  updateGesture(a,t);
 });
 state.emotional+=(state.activeCount/5-state.emotional)*(1-Math.exp(-3.5*dt));
 const num=document.querySelector('#charactersReadout');if(num)num.textContent=String(state.activeCount);
 const reaction=document.querySelector('#reactionReadout');if(reaction)reaction.textContent=['Relaxed','Hair-fix','Wink & wave','Sideways','Stretching','Celebrating'][state.girlStage];
}
function actorX(a){const width=spriteRects[a.index-1][1]*a.s;
 const off=a.side===1?W+width*.12:-width-70;
 const p=smooth(0,1,a.progress);
 return off+(a.x-off)*p;
}
function paintActor(a,t){
 const im=img.men;if(!im?.complete||!im?.naturalWidth)return;
 const [sx,sw]=spriteRects[a.index-1];
 const iw=sw*a.s,ih=im.height*a.s;
 const x=actorX(a);
 if(x+iw<-60||x>W+60)return;
 const moving=Math.abs(a.want-a.progress)>0.015;
 const stride=t*12.2+a.phase;
 const step=moving?Math.abs(Math.sin(stride))*11:Math.sin(t*1.8+a.phase)*1.8;
 const pitch=moving?Math.sin(stride)*.019:Math.sin(t*1.2+a.phase)*.004;
 const pose=gestureFrame(a,t);
 const cheer=pose?.gesture==='cheer'?Math.abs(Math.sin((t+a.phase)*8))*17:0;
 const y=1350-ih+step-cheer;
 ctx.save();ctx.translate(x+iw*.5,y+ih);
 ctx.rotate(pitch);
 // Walk cycle: translate from outside the frame with rhythmic footfall bounce,
 // body lean and slight whole-sprite sway. Keep the original sprite uncut.
 const atlas=pose && img[pose.key];
 if(atlas?.complete && atlas.naturalWidth){
  const [px,py,pw,ph,foot]=gestureRects[pose.key][pose.row][a.index-1];
  const scale=753*a.s/ph;
  ctx.drawImage(atlas,px,py,pw,ph,-(foot-px)*scale,-20*a.s-ph*scale,pw*scale,ph*scale);
 }else ctx.drawImage(im,sx,0,sw,im.height,-iw*.5,-ih,iw,ih);
 ctx.restore();
}
const girlAnchors=[0,3,6,10,14,18];
const girlThresholds=[20,40,60,80,95];
const girlIdleFrames=[[0],[2,3],[4,5,6,7],[8,9,10,11],[13,14,15,16],[17,18,19,18]];
function updateGirlPose(t,dt){
 while(state.girlStage<5 && state.pressure>=girlThresholds[state.girlStage])state.girlStage++;
 while(state.girlStage>0 && state.pressure<girlThresholds[state.girlStage-1]-3)state.girlStage--;
 state.girlSpecial=t<state.celebrateUntil?'cheer':t<state.sideEyeUntil?'wink':null;
 let goal=state.girlSpecial==='cheer'?18:state.girlSpecial==='wink'?6:girlAnchors[state.girlStage];
 // Use the authored recovery frames at the end of the sheet after high-load poses.
 if(goal===0 && state.girlFrame>=15)goal=24;
 state.girlGoal=goal;
 const difference=goal-state.girlFrame;
 const velocity=Math.sign(difference)*Math.min(10,Math.abs(difference)*6);
 state.girlVelocity+=(velocity-state.girlVelocity)*(1-Math.exp(-12*dt));
 const step=state.girlVelocity*dt;
 if(Math.abs(difference)<.03 || (Math.sign(step)===Math.sign(difference) && Math.abs(step)>=Math.abs(difference))){state.girlFrame=goal;state.girlVelocity=0;}
 else state.girlFrame=clamp(state.girlFrame+step,0,24);
 if(state.girlFrame===24){state.girlFrame=0;state.girlGoal=0;}
 const label=document.querySelector('#reactionReadout');
 if(label)label.textContent=state.girlSpecial==='cheer'?'Group cheer':state.girlSpecial==='wink'?'Playful wink':['Relaxed','Hair-fix','Wink & wave','Sideways','Stretching','Celebrating'][state.girlStage];
}
function girlFrameIndex(t){
 if(Math.abs(state.girlFrame-state.girlGoal)>.03)return Math.min(23,Math.round(state.girlFrame));
 const frames=state.girlSpecial==='cheer'?girlIdleFrames[5]:state.girlSpecial==='wink'?[6]:girlIdleFrames[state.girlStage];
 const speed=state.girlStage===2?6:state.girlStage===5 || state.girlSpecial==='cheer'?5:1.6;
 return frames[Math.floor(t*speed)%frames.length];
}
function drawGirlSprite(t){
 const image=img.girl;if(!image?.complete || !image.naturalWidth)return;
 const [sx,sy,sw,sh,anchor,bodyHeight]=girlRects[girlFrameIndex(t)];
 const localX=sx%384;
 // Normalize the seated body height, leaving extra space for raised arms.
 const scale=4.25*152/bodyHeight;
 const breathing=Math.sin(t*2)*1.2;
 ctx.drawImage(image,sx,sy,sw,sh,BASE_X+836+(localX-anchor)*scale,BASE_Y+780-sh*scale+breathing,sw*scale,sh*scale);
}
function paintGirl(t){
 drawGirlSprite(t);
 if(state.activeCount>=3){
  for(let i=0;i<4;i++){
   const v=(t*.44+i*.26)%1;
   ctx.globalAlpha=(1-v)*(.3+state.emotional*.4);ctx.fillStyle=i%2?'#faffc8':'#ffd1de';
   ctx.fillRect(BASE_X+742+i*70+Math.sin(t+i)*8,BASE_Y+175-v*60,7,7);
  }
  ctx.globalAlpha=1;
 }
}
function render(now){
 if(state.lastTime && now-state.lastTime<1000/30){requestAnimationFrame(render);return;}
 const t=(now-state.start)/1000,dt=state.lastTime?Math.min(.060,(now-state.lastTime)/1000):.016;state.lastTime=now;
 advance(t,dt);updateGirlPose(t,dt);
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
 // Draw the men first, then erase anything that should sit behind the couch/girl silhouette.
 for(const a of actors)paintActor(a,t);
 applyForegroundOccluder(t);
 drawCouch();
 paintGirl(t);
 requestAnimationFrame(render);
}
const slider=document.querySelector('#pressureSlider'),sz=document.querySelector('#sizeSlider'),demoBtn=document.querySelector('#demoBtn');
function stopDemo(){if(state.demo){clearInterval(state.demo);state.demo=null;}if(demoBtn)demoBtn.textContent='▶ Run stress demo';}
function runDemo(){stopDemo();let tick=0;const sequence=[6,20,37,54,71,92,100,100,100,78,57,39,22,6,6,6];state.demo=setInterval(()=>{setPressure(sequence[tick]??6);if(++tick>=sequence.length)stopDemo();},1900);if(demoBtn)demoBtn.textContent='■ Stop demo';}
slider?.addEventListener('input',e=>{stopDemo();setPressure(e.target.value)});
sz?.addEventListener('input',e=>setScale(e.target.value));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
demoBtn?.addEventListener('click',()=>state.demo?stopDemo():runDemo());
document.querySelector('#resetBtn')?.addEventListener('click',()=>{stopDemo();setPressure(6);setScale(100)});
updateTarget();setScale(100);requestAnimationFrame(render);
})();
