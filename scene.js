(()=>{'use strict';
const canvas=document.querySelector('#scene');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:true});
const W=canvas.width,H=canvas.height, BASE_X=364,BASE_Y=445;
ctx.imageSmoothingEnabled=false;
const img={};
const paths={base:'scene-base.png',head:'girl-head.png',torso:'girl-torso.png'};
paths.men='men-tall.png';
for(let mood=0;mood<5;mood++)for(let gaze=0;gaze<5;gaze++)paths[`face-${mood}-${gaze}`]=`expressions/face-${mood}-${gaze}.png`;
for(const [key,path] of Object.entries(paths)){
 const image=new Image();image.decoding='async';image.src='assets/'+path;img[key]=image;
}
function applyForegroundOccluder(){
 // Use the actual foreground silhouette: extending column heights cuts off hands beside the couch.
 ctx.save();
 ctx.globalCompositeOperation='destination-out';
 draw('base',BASE_X,BASE_Y);
 draw('head',BASE_X,BASE_Y);
 draw('torso',BASE_X,BASE_Y);
 ctx.restore();
}
// Full-body sprites share one sheet. Source rectangles include transparent gutters.
const spriteRects=[[119,294],[479,306],[854,281],[1212,294],[1584,300]];
const places=[
 {x:1610,side:1,s:1.43},
 {x:360,side:-1,s:1.50},
 {x:1270,side:1,s:1.58},
 {x:670,side:-1,s:1.47},
 {x:970,side:1,s:1.54},
];
const actors=places.map((p,i)=>({...p,index:i+1,progress:0,want:0,phase:i*1.33,startedAt:0}));
const WIN=document.querySelector('#characterWindow');
const state={cpu:6,ram:6,mode:'max',native:false,pressure:6,targetCount:0,activeCount:0,lastCountChange:-1e9,start:performance.now(),demo:null,lastTime:0,emotional:0,scale:1,eyeX:0,eyeY:0,focused:-1,focusUntil:0};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,n)=>{const v=clamp((n-a)/(b-a),0,1);return v*v*(3-2*v)};
const thresholds=[16,32,48,64,80];
function calcCount(n){return thresholds.filter(x=>n>=x).length;}
function pressureValue(){return state.mode==='cpu'?state.cpu:state.mode==='ram'?state.ram:Math.max(state.cpu,state.ram);}
function updateTarget(){state.pressure=pressureValue();state.targetCount=calcCount(state.pressure);let v=document.querySelector('#pressureReadout');if(v)v.textContent=Math.round(state.pressure)+'%';let s=document.querySelector('#pressureSlider');if(s&&!state.native)s.value=Math.round(state.pressure);}
function setPressure(v){state.cpu=state.ram=clamp(Number(v)||0,0,100);updateTarget();}
function setMode(m){if(!['cpu','ram','max'].includes(m))return;state.mode=m;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m));updateTarget();}
function setScale(v){const s=clamp(Number(v)||100,25,160);state.scale=s/100;if(WIN)WIN.style.transform=state.native?'none':`scale(${state.scale})`;let i=document.querySelector('#sizeSlider');if(i&&!state.native)i.value=s;let r=document.querySelector('#sizeReadout');if(r)r.textContent=Math.round(s)+'%';}
function setNativeMetrics(cpu,ram){state.cpu=clamp(Number(cpu)||0,0,100);state.ram=clamp(Number(ram)||0,0,100);updateTarget();}
window.setSimulatedPressure=setPressure;window.setNativeMetrics=setNativeMetrics;window.setMode=setMode;window.setCompanionScale=setScale;
window.setNative=()=>{state.native=true;document.documentElement.classList.add('native');if(WIN)WIN.style.transform='none';stopDemo();};
function advance(t,dt){
 const now=t*1000;
 const stepMs=1800;
 if(state.activeCount!==state.targetCount && now-state.lastCountChange>=stepMs){
  const up=state.targetCount>state.activeCount;
  state.activeCount+=up?1:-1;
  state.lastCountChange=now;
  const entrant=actors[up?state.activeCount-1:state.activeCount];
  if(entrant){state.focused=entrant.index-1;state.focusUntil=now+2400;entrant.startedAt=now;}
 }
 actors.forEach((a,i)=>{
  a.want=i<state.activeCount?1:0;
  // The character moves from fully OUTSIDE the screen, not an opacity fade.
  a.progress+=(a.want-a.progress)*(1-Math.exp(-(a.want?2.55:2.5)*dt));
  if(Math.abs(a.progress-a.want)<0.0004)a.progress=a.want;
 });
 state.emotional+=(state.activeCount/5-state.emotional)*(1-Math.exp(-3.5*dt));
 const num=document.querySelector('#charactersReadout');if(num)num.textContent=String(state.activeCount);
 const reaction=document.querySelector('#reactionReadout');if(reaction)reaction.textContent=['Smiling','Curious','Grinning','Giggling','Laughing','Cackling'][state.activeCount];
}
function draw(key,x,y,w,h){const i=img[key];if(i?.complete&&i?.naturalWidth)ctx.drawImage(i,x,y,w||i.width,h||i.height);}
function actorX(a){const width=spriteRects[a.index-1][1]*a.s;
 const off=a.side===1?W+width*.12:-width-70;
 const p=smooth(0,1,a.progress);
 return off+(a.x-off)*p;
}
function actorHead(a){return {x:actorX(a)+spriteRects[a.index-1][1]*a.s*.5,y:1350-793*a.s+100*a.s};}
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
 const y=1350-ih+step;
 ctx.save();ctx.translate(x+iw*.5,y+ih);
 ctx.rotate(pitch);
 // Walk cycle: translate from outside the frame with rhythmic footfall bounce,
 // body lean and slight whole-sprite sway. Keep the original sprite uncut.
 ctx.drawImage(im,sx,0,sw,im.height,-iw*.5,-ih,iw,ih);
 ctx.restore();
}
function selectGaze(t){
 const now=t*1000;
 let target;
 if(state.focused>=0 && now<state.focusUntil){target=actors[state.focused];}
 else{
  target=actors.filter(a=>a.progress>.55).sort((a,b)=>b.progress-a.progress)[0];
 }
 if(!target)return 0;
 const h=actorHead(target);
 return clamp((h.x-(BASE_X+845))/300,-1,1);
}
function paintGirl(t,dt){
 const cx=BASE_X+842,cy=BASE_Y+351;
 const breathing=Math.sin(t*2.1)*.010;
 ctx.save();ctx.translate(cx,BASE_Y+532);ctx.scale(1+Math.sin(t*1.3)*.002,1+breathing);ctx.translate(-cx,-(BASE_Y+532));draw('torso',BASE_X,BASE_Y);ctx.restore();
 const idleTilt=Math.sin(t*.82)*.010;
 const joy=state.emotional;
 // Weird, delighted laugh: separate little chuckle beats, never constant high-frequency shaking.
 const chuckle=state.activeCount>=2?Math.pow(Math.max(0,Math.sin(t*7.7)),3)*(0.006+joy*.012):0;
 const sway=joy*.017*Math.sin(t*1.12);
 const lean=idleTilt+sway+chuckle;
 const bob=2*Math.sin(t*1.9)+joy*5*Math.max(0,Math.sin(t*7.7));
 ctx.save();ctx.translate(cx,cy);ctx.rotate(lean);ctx.translate(Math.sin(t*.7)*1.5,bob);ctx.translate(-cx,-cy);
 draw('head',BASE_X,BASE_Y);
 // Keep face pixel-perfect, use an atlas generated from the ORIGINAL face.
 let mood=Math.min(4,state.activeCount);
 if(mood>=2){const laugh=Math.sin(t*4.3);if(laugh<-.38)mood=Math.max(1,mood-1);}
 const gazeTarget=selectGaze(t);
 state.eyeX+= (gazeTarget-state.eyeX)*(1-Math.exp(-12*dt));
 const gaze=Math.round(clamp(state.eyeX,-1,1)*2)+2;
 const face=img[`face-${mood}-${gaze}`];
 if(state.activeCount>0 && face?.complete&&face?.naturalWidth)ctx.drawImage(face,BASE_X+770,BASE_Y+192,147,104);
 // Natural blink, small pixel lids ON correct eye positions.
 const blink=(t+1.4)%5.1;
 if(blink<.10 || (blink>.17&&blink<.24)){
  ctx.fillStyle='#efa987';ctx.fillRect(BASE_X+793,BASE_Y+238,39,18);ctx.fillRect(BASE_X+859,BASE_Y+226,29,14);
  ctx.fillStyle='#2e1e22';ctx.fillRect(BASE_X+796,BASE_Y+244,35,3);ctx.fillRect(BASE_X+862,BASE_Y+230,25,3);
 }
 ctx.restore();
 // A few sparkle pixels when she laughs. Not sweat, not anxiety.
 if(state.activeCount>=3){
  for(let i=0;i<4;i++){
   const v=(t*.44+i*.26)%1,x=cx-100+i*70+Math.sin(t+i)*8,y=BASE_Y+175-v*60;
   ctx.globalAlpha=(1-v)*(.3+state.emotional*.4);ctx.fillStyle=i%2?'#faffc8':'#ffd1de';ctx.fillRect(x,y,7,7);
  }
  ctx.globalAlpha=1;
 }
}
function render(now){
 if(state.lastTime && now-state.lastTime<1000/30){requestAnimationFrame(render);return;}
 const t=(now-state.start)/1000,dt=state.lastTime?Math.min(.060,(now-state.lastTime)/1000):.016;state.lastTime=now;
 advance(t,dt);
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
 // Draw the men first, then erase anything that should sit behind the couch/girl silhouette.
 for(const a of actors)paintActor(a,t);
 applyForegroundOccluder();
 draw('base',BASE_X,BASE_Y);
 paintGirl(t,dt);
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
