const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
const drawnSprites = new Set();
const swimFrames = new Set();
let lastTranslation;
const context = new Proxy({}, {get: (_, name) => {
  if(name==='translate')return(x,y)=>{lastTranslation=[x,y];};
  if (name === 'lineTo') return () => {throw Error('Column masks must not crop hands');};
  if (name === 'drawImage') return (image,...args) => {
    if (args.length !== 8) return;
    const [sx,sy,sw,sh,dx,dy,dw,dh] = args;
    assert(sx>=0 && sy>=0 && sx+sw<=image.width && sy+sh<=image.height, 'Sprite must fit source sheet');
    if(/men-(tall|rub|wave)/.test(image.path||''))assert(dw/dh<0.65, 'Full-body actors must remain tall and slender');
    if(image.path==='assets/men-tall.png')drawnSprites.add(sx);
    if(image.path==='assets/girl-swim-poses.png')swimFrames.add(sx+'/'+sy);
  };
  return () => {};
}});
function element(id) {
  if (!elements.has(id)) elements.set(id, {width:2400,height:1400,style:{},classList:{add(){},toggle(){}},listeners:{},getContext:()=>context,addEventListener(type, fn){this.listeners[type]=fn;}});
  return elements.get(id);
}
let frame, now=0, frameCount=0, interval, cleared=0;
const sandbox = {console, window:{}, document:{querySelector:element,querySelectorAll:()=>[],documentElement:element('html'),createElement:()=>element('offscreen')},performance:{now:()=>now},Image:class {complete=true;set src(value){this.path=value;const bytes=fs.readFileSync(value);this.width=this.naturalWidth=bytes.readUInt32BE(16);this.height=this.naturalHeight=bytes.readUInt32BE(20);}},requestAnimationFrame:fn=>frame=fn,setInterval:fn=>(interval=fn,1),clearInterval:()=>{interval=null;cleared++;}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('shirt-gag.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('scene.js','utf8').replace('updateTarget();setScale(100);requestAnimationFrame(render);', 'window.__test={actors,state,updateGesture,gestureFrame,updateGirlPose,girlFrameIndex,girlRects,costume,advance,drawGirlSprite,paintCostumeFront,ownerShirtAnchor,ownerPalmAnchor,carriedShirtPoint};updateTarget();setScale(100);requestAnimationFrame(render);'),sandbox);
const api=sandbox.window;
function frames(n){for(let i=0;i<n;i++){now+=1000/60;frameCount++;frame(now);}}
function count(n){assert.equal(element('#charactersReadout').textContent,String(n));}
frames(1);count(0);
for(const [pressure,n] of [[15,0],[16,1],[31,1],[32,2],[48,3],[64,4],[80,5],[100,5],[0,0]]){api.setSimulatedPressure(pressure);frames(700);count(n);}
for(const mode of ['cpu','ram','max']){api.setMode(mode);api.setNativeMetrics(99,0);frames(700);count(mode==='ram'?0:5);}
api.setMode('cpu');api.setMode('invalid');api.setNativeMetrics(-12,200);frames(700);count(0);
api.setMode('ram');frames(700);count(5);
for(const value of [NaN,Infinity,-100,1000,'bad',null,55]){api.setSimulatedPressure(value);frames(120);assert(!element('#pressureReadout').textContent.includes('NaN'));}
for(let i=0;i<10000;i++){api.setSimulatedPressure(i%2?100:0);frames(1);const n=Number(element('#charactersReadout').textContent);assert(n>=0&&n<=5);}
api.setSimulatedPressure(0);frames(1000);count(0);
for(const [value,expected] of [[25,'scale(0.25)'],[160,'scale(1.6)'],[-1,'scale(0.25)'],[1000,'scale(1.6)']]){api.setCompanionScale(value);assert.equal(element('#characterWindow').style.transform,expected);}
element('#demoBtn').listeners.click();assert(interval);interval();api.setNative();assert.equal(interval,null);assert(cleared);assert.equal(element('#characterWindow').style.transform,'none');
api.setCompanionScale(25);assert.equal(element('#characterWindow').style.transform,'none');
element('#resetBtn').listeners.click();frames(1000);count(0);
assert.equal(drawnSprites.size,5,'Every full-body sprite must render');
console.log(`PASS: thresholds, reverse exits, metric modes, invalid inputs, 10,000 rapid changes, resizing, demo cancellation, reset; ${frameCount} simulated frames.`);

const {actors,state,updateGesture,gestureFrame}=api.__test;
const a=actors[0];
Object.assign(a,{want:1,progress:1,arrived:false,gesture:'idle'});
state.celebrateUntil=0;
updateGesture(a,500);assert.equal(a.gesture,'wave');
updateGesture(a,501);assert.equal(a.gesture,'rub');
assert.equal(gestureFrame(a,501.12).key,'rub');
const rows=new Set([501,501.12,501.24].map(t=>gestureFrame(a,t).row));assert.equal(rows.size,3);
updateGesture(a,504);assert.equal(a.gesture,'idle');
state.pressure=90;
actors.slice(1).forEach(other=>other.gesture='idle');
updateGesture(a,a.nextJoy+.1);assert.equal(a.gesture,'rub');assert.equal(state.sideEyeActor,0);
assert(state.sideEyeUntil>a.gestureStart);
a.want=0;updateGesture(a,550);assert.equal(a.gesture,'idle');assert(!a.arrived);
a.want=1;updateGesture(a,551);assert.equal(a.gesture,'wave');
state.celebrateUntil=554;assert.equal(gestureFrame(a,552).gesture,'cheer');
assert.notEqual(gestureFrame(a,555).gesture,'cheer');
state.targetCount=5;api.setSimulatedPressure(0);assert(state.celebrateUntil>now/1000);
api.setSimulatedPressure(100);assert.equal(state.celebrateUntil,0);
console.log('PASS: arrival wave -> rubbing -> rest, all three rubbing frames, occasional joy, side-eye trigger, exit cancellation, re-entry, celebration, and interrupted celebration.');

const {updateGirlPose,girlFrameIndex,girlRects}=api.__test;
state.sideEyeUntil=0;state.celebrateUntil=0;
for(const [pressure,stage] of [[0,0],[20,1],[40,2],[60,3],[80,4],[100,5],[0,0]]){
 state.pressure=pressure;
 let previous=state.girlFrame;
 for(let n=0;n<300;n++){
  updateGirlPose(1000+n/30,1/30);
  assert(state.girlFrame>=0 && state.girlFrame<24);
  assert(Math.abs(state.girlFrame-previous)<.36 || previous>23.6,'Pose transitions must advance continuously, not snap');
  previous=state.girlFrame;
  const frame=girlFrameIndex(1000+n/30);assert(frame>=0 && frame<24);assert(girlRects[frame]);
 }
 assert.equal(state.girlStage,stage);
 assert.equal(state.girlFrame,stage===0?0:[0,3,6,10,14,18][stage]);
}
state.pressure=61;updateGirlPose(2000,.03);assert.equal(state.girlStage,3);
state.pressure=59;updateGirlPose(2000.03,.03);assert.equal(state.girlStage,3,'Minor pressure jitter must not flip poses');
for(let n=0;n<1000;n++){state.pressure=n%2?100:0;updateGirlPose(2100+n/30,1/30);assert(Number.isFinite(state.girlFrame));}
console.log('PASS: six pose stages, all transition frames in bounds, continuous advancement, authored recovery, hysteresis, rapid retargeting.');

state.pressure=95;updateGirlPose(3000,.03);assert.equal(state.girlStage,5,'Peak pose must be reachable without an exact 100% reading');
state.pressure=94;updateGirlPose(3000.03,.03);assert.equal(state.girlStage,5);
state.pressure=91;updateGirlPose(3000.06,.03);assert.equal(state.girlStage,4);

const gag=api.__test.costume;
Object.assign(gag,{phase:'covered',time:2,cooldown:0});
Object.assign(state,{activeCount:0,targetCount:0,celebrateUntil:0,lastCountChange:0});
api.__test.advance(4000,.016);
assert.equal(actors[0].want,1,'The shirt owner cannot leave before returning it');
assert.equal(actors.slice(1).filter(a=>a.want).length,0);
for(let frame=0;frame<24;frame++){
 state.girlFrame=frame;state.girlGoal=frame+.1;api.__test.drawGirlSprite(4000);
}
assert.equal(swimFrames.size,24,'All continuing poses must use the matching swim-top atlas');
Object.assign(gag,{phase:'changing',time:1.2});api.__test.paintCostumeFront(4000);const hand=lastTranslation;
Object.assign(gag,{phase:'throwing',time:0});api.__test.paintCostumeFront(4000);assert.deepEqual(lastTranslation,hand,'Throw must begin at the held shirt position');
Object.assign(gag,{phase:'throwing',time:1});api.__test.paintCostumeFront(4000);const head=api.__test.ownerShirtAnchor(4000);
assert(Math.hypot(lastTranslation[0]-head.x,lastTranslation[1]-head.y)<.001,'Landing must match attached head position');
Object.assign(gag,{phase:'returning',time:.2});api.__test.paintCostumeFront(4000);
assert(Math.hypot(lastTranslation[0]-head.x,lastTranslation[1]-head.y)<.001,'Lifting must begin at the same head anchor');
const palm=api.__test.ownerPalmAnchor(4000);
const carried=api.__test.carriedShirtPoint(4000,.95);
assert(Math.hypot(palm.x-carried.x,palm.y-carried.y)<.001);
Object.assign(gag,{phase:'returning',time:.95});api.__test.paintCostumeFront(4000);
assert(Math.hypot(lastTranslation[0]-palm.x,lastTranslation[1]-palm.y)<.001,'Return flight must begin in his extended hand');
Object.assign(gag,{phase:'returning',time:1.95});api.__test.paintCostumeFront(4000);assert.deepEqual(lastTranslation,hand,'Return must end in her hands');
console.log('PASS: same owner retained, all 24 outfit poses, and continuous held/throw/head/return attachment boundaries.');
