(()=>{'use strict';
const canvas=document.querySelector('#scene');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});
const W=canvas.width,H=canvas.height, BASE_X=364,BASE_Y=445;
ctx.imageSmoothingEnabled=false;
const img={};
const paths={couch:'couch.png',girl:'girl-poses.png',men:'men-tall.png',rub:'men-rub.png',wave:'men-wave.png',swim:'girl-swim-poses.png',shirt:'shirt-props.png',returnMan:'men-return.png'};
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
const swimRects=[[138,1,147,156,211.5,153],[513,1,144,157,201.0,154],[886,1,144,157,190.0,154],[1258,2,143,157,177.5,154],[142,175,146,158,215.0,155],[516,176,147,158,205.5,155],[887,176,145,159,191.5,156],[1258,176,144,158,178.0,155],[121,345,167,167,204.5,164],[505,345,153,167,197.5,163],[881,346,150,166,188.0,163],[1245,345,155,167,170.5,164],[140,527,148,155,214.0,152],[516,524,143,158,203.5,131],[887,525,145,157,191.5,137],[1258,525,144,157,178.0,136],[142,698,148,155,216.0,152],[516,702,146,150,205.0,146],[887,702,147,151,192.5,148],[1259,701,146,152,180.0,149],[141,858,145,148,213.5,145],[516,857,144,148,204.0,145],[887,858,144,147,191.0,144],[1256,857,146,148,177.0,145]];
const shirtRects=[[88,150,783,606,479.5],[976,113,708,671,443.0]];
const returnRects=[[138,14,176,336,232.5,323],[528,21,201,329,648.0,326],[950,21,193,329,1062.5,325],[1377,21,182,329,1477.0,325],[153,363,161,305,233.0,301],[507,363,222,305,648.0,301],[883,363,260,305,1062.5,301],[1295,363,263,305,1477.0,301],[134,676,174,268,232.5,265],[565,676,156,268,647.5,265],[993,675,144,269,1064.5,265],[1405,675,147,269,1478.0,265]];
const places=[
 {x:1610,side:1,s:1.43},
 {x:360,side:-1,s:1.50},
 {x:1270,side:1,s:1.58},
 {x:670,side:-1,s:1.47},
 {x:970,side:1,s:1.54},
];
const actors=places.map((p,i)=>({...p,index:i+1,progress:0,want:0,phase:i*1.33,arrived:false,gesture:"idle",gestureStart:0,gestureUntil:0,nextJoy:Infinity}));
const costume=window.ShirtGag.create();
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
 if(a.index===1 && window.ShirtGag.pinned(costume)){a.gesture='idle';return;}
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
  a.want=i<state.activeCount || i===0 && window.ShirtGag.pinned(costume)?1:0;
  // The character moves from fully OUTSIDE the screen, not an opacity fade.
  a.progress+=(a.want-a.progress)*(1-Math.exp(-(a.want?2.55:2.5)*dt));
  if(Math.abs(a.progress-a.want)<0.0004)a.progress=a.want;
  updateGesture(a,t);
 });
 state.emotional+=(state.activeCount/5-state.emotional)*(1-Math.exp(-3.5*dt));
 const num=document.querySelector('#charactersReadout');if(num)num.textContent=String(actors.filter(a=>a.want).length);
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
 const owner=a.index===1 && window.ShirtGag.pinned(costume);
 const pose=owner?null:gestureFrame(a,t);
 const cheer=pose?.gesture==='cheer'?Math.abs(Math.sin((t+a.phase)*8))*17:0;
 const y=1350-ih+step-cheer;
 ctx.save();ctx.translate(x+iw*.5,y+ih);
 ctx.rotate(pitch);
 // Walk cycle: translate from outside the frame with rhythmic footfall bounce,
 // body lean and slight whole-sprite sway. Keep the original sprite uncut.
 const passing=owner && ['returning','dressing'].includes(costume.phase);
 const atlas=passing?img.returnMan:pose && img[pose.key];
 if(atlas?.complete && atlas.naturalWidth){
  const passFrame=costume.phase==='dressing'?8+Math.min(3,Math.floor(costume.time/1.2*4)):Math.min(7,Math.floor(smooth(0,.95,costume.time)*7));
  const [px,py,pw,ph,foot,bodyHeight]=passing?returnRects[passFrame]:gestureRects[pose.key][pose.row][a.index-1];
  const scale=753*a.s/(bodyHeight||ph);
  ctx.drawImage(atlas,px,py,pw,ph,-(foot-px)*scale,-20*a.s-ph*scale,pw*scale,ph*scale);
 }else ctx.drawImage(im,sx,0,sw,im.height,-iw*.5,-ih,iw,ih);
 if(owner && window.ShirtGag.location(costume)==='owner-head'){
  const width=iw*.78,height=width*shirtRects[1][3]/shirtRects[1][2];
  drawShirtRect(-width/2,-ih+7*a.s,width,height);
 }
 ctx.restore();
}
const girlAnchors=[0,3,6,10,14,18];
const girlThresholds=[20,40,60,80,95];
const girlIdleFrames=[[0],[2,3],[4,5,6,7],[8,9,10,11],[13,14,15,16],[17,18,19,18]];
function updateGirlPose(t,dt){
 while(state.girlStage<5 && state.pressure>=girlThresholds[state.girlStage])state.girlStage++;
 while(state.girlStage>0 && state.pressure<girlThresholds[state.girlStage-1]-3)state.girlStage--;
 const busy=window.ShirtGag.pinned(costume) && costume.phase!=='covered';
 state.girlSpecial=busy?null:t<state.celebrateUntil?'cheer':t<state.sideEyeUntil?'wink':null;
 let goal=busy?0:state.girlSpecial==='cheer'?18:state.girlSpecial==='wink'?6:girlAnchors[state.girlStage];
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
 if(['changing','throwing','returning','dressing'].includes(costume.phase)){
  if(costume.phase==='changing')return [0,2,3,4,5,6][Math.min(5,Math.floor(costume.time/1.2*6))];
  if(costume.phase==='throwing')return [6,5,4,20,21,23,0][Math.min(6,Math.floor(costume.time*7))];
  if(costume.phase==='dressing')return [6,5,4,3,2,0][Math.min(5,Math.floor(costume.time/1.2*6))];
  return costume.time<1.6?0:[4,5,6][Math.min(2,Math.floor((costume.time-1.6)*6))];
 }

 if(Math.abs(state.girlFrame-state.girlGoal)>.03)return Math.min(23,Math.round(state.girlFrame));
 const frames=state.girlSpecial==='cheer'?girlIdleFrames[5]:state.girlSpecial==='wink'?[6]:girlIdleFrames[state.girlStage];
 const speed=state.girlStage===2?6:state.girlStage===5 || state.girlSpecial==='cheer'?5:1.6;
 return frames[Math.floor(t*speed)%frames.length];
}
function drawGirlSprite(t){
 const swimming=window.ShirtGag.swim(costume);
 const image=swimming?img.swim:img.girl;if(!image?.complete || !image.naturalWidth)return;
 const [sx,sy,sw,sh,anchor,bodyHeight]=(swimming?swimRects:girlRects)[girlFrameIndex(t)];
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
function drawShirtRect(x,y,width,height){
 const image=img.shirt;if(!image?.complete || !image.naturalWidth)return;
 const [sx,sy,sw,sh]=shirtRects[1];ctx.drawImage(image,sx,sy,sw,sh,x,y,width,height);
}
function ownerShirtAnchor(t){
 const a=actors[0],iw=spriteRects[0][1]*a.s,ih=793*a.s;
 const pitch=Math.sin(t*1.2+a.phase)*.004;
 const step=Math.sin(t*1.8+a.phase)*1.8;
 const width=iw*.78,height=width*shirtRects[1][3]/shirtRects[1][2];
 const localY=-ih+7*a.s+height*.4;
 return {x:actorX(a)+iw*.5-Math.sin(pitch)*localY,y:1350+step+Math.cos(pitch)*localY,width,pitch};
}
function ownerPalmAnchor(t){
 const a=actors[0],im=img.returnMan;
 const [sx,sy,sw,sh,foot,bodyHeight]=returnRects[7];
 const scale=753*a.s/(bodyHeight||sh);
 const lx=(sx+sw*.13-foot)*scale;
 const ly=-20*a.s-sh*scale+sh*.33*scale;
 const iw=spriteRects[0][1]*a.s,pitch=Math.sin(t*1.2+a.phase)*.004;
 const step=Math.sin(t*1.8+a.phase)*1.8;
 return {x:actorX(a)+iw*.5+Math.cos(pitch)*lx-Math.sin(pitch)*ly,y:1350+step+Math.sin(pitch)*lx+Math.cos(pitch)*ly};
}
function carriedShirtPoint(t,time){
 const owner=ownerShirtAnchor(t),palm=ownerPalmAnchor(t),u=smooth(.2,.95,time);
 return {x:owner.x+(palm.x-owner.x)*u,y:owner.y+(palm.y-owner.y)*u+Math.sin(Math.PI*u)*25};
}
function paintCostumeFront(t){
 const location=window.ShirtGag.location(costume);
 const hand={x:BASE_X+1036,y:BASE_Y+385};
 const owner=ownerShirtAnchor(t);
 let point=null,width=140,angle=-.25;
 if(location==='woman-hand'){
  let u=costume.phase==='changing'?smooth(.6,1.2,costume.time):1;
  point={x:BASE_X+836+(hand.x-BASE_X-836)*u,y:BASE_Y+500+(hand.y-BASE_Y-500)*u};
 }else if(location==='owner-hand'){
  const u=smooth(.2,.95,costume.time);point=carriedShirtPoint(t,costume.time);width=owner.width+(140-owner.width)*u;angle=owner.pitch*(1-u)-.25*u;
 }else if(location==='air-out'||location==='air-return'){
  const out=location==='air-out';
  const u=clamp(out?costume.time:costume.time-.95,0,1),v=smooth(0,1,u);
  const start=out?hand:ownerPalmAnchor(t),end=out?owner:hand;
  point={x:start.x+(end.x-start.x)*v,y:start.y+(end.y-start.y)*v-Math.sin(Math.PI*u)*170};
  width=out?140+(owner.width-140)*smooth(.45,1,u):140;
  angle=out?owner.pitch*u-.25*(1-u)+Math.sin(Math.PI*u)*Math.PI*2:-.25-Math.sin(Math.PI*u)*Math.PI*2;
 }
 if(point){
  const height=width*shirtRects[1][3]/shirtRects[1][2];
  ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);drawShirtRect(-width/2,-height*.4,width,height);ctx.restore();
 }
 if(costume.phase==='changing'||costume.phase==='dressing'){
  const envelope=Math.pow(Math.sin(Math.PI*clamp(costume.time/1.2,0,1)),2);
  ctx.save();ctx.globalAlpha=envelope;
  for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9+t*.4;
   ctx.fillStyle=i%2?'#fff7e6':'#ffffff';ctx.beginPath();
   ctx.arc(BASE_X+836+Math.cos(a)*145*envelope,BASE_Y+470+Math.sin(a)*100*envelope,75*envelope,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
}
function render(now){
 if(state.lastTime && now-state.lastTime<1000/30){requestAnimationFrame(render);return;}
 const t=(now-state.start)/1000,dt=state.lastTime?Math.min(.060,(now-state.lastTime)/1000):.016;state.lastTime=now;
 advance(t,dt);
 window.ShirtGag.update(costume,{pressure:state.pressure,
  ready:Object.values(img).every(i=>i.complete && i.naturalWidth),
  ownerReady:actors[0].want===1 && actors[0].progress>=.995,
  girlReady:state.girlFrame===0 && state.girlVelocity===0},dt);
 updateGirlPose(t,dt);
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
 // Draw the men first, then erase anything that should sit behind the couch/girl silhouette.
 for(const a of actors)paintActor(a,t);
 applyForegroundOccluder(t);
 drawCouch();
 paintGirl(t);paintCostumeFront(t);
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
