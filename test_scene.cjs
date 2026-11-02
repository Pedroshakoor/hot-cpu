const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
const drawnSprites = new Set();
const context = new Proxy({}, {get: (_, name) => {
  if (name === 'lineTo') return () => {throw Error('Column masks must not crop hands');};
  if (name === 'drawImage') return (image,...args) => {
    if (args.length !== 8) return;
    const [sx,sy,sw,sh,dx,dy,dw,dh] = args;
    assert(sx>=0 && sy>=0 && sx+sw<=image.width && sy+sh<=image.height, 'Sprite must fit source sheet');
    assert(dw/dh<0.5, 'Full-body actors must remain tall and slender');
    drawnSprites.add(sx);
  };
  return () => {};
}});
function element(id) {
  if (!elements.has(id)) elements.set(id, {width:2400,height:1400,style:{},classList:{add(){},toggle(){}},listeners:{},getContext:()=>context,addEventListener(type, fn){this.listeners[type]=fn;}});
  return elements.get(id);
}
let frame, now=0, frameCount=0, interval, cleared=0;
const sandbox = {console, window:{}, document:{querySelector:element,querySelectorAll:()=>[],documentElement:element('html'),createElement:()=>element('offscreen')},performance:{now:()=>0},Image:class {complete=true;set src(value){const bytes=fs.readFileSync(value);this.width=this.naturalWidth=bytes.readUInt32BE(16);this.height=this.naturalHeight=bytes.readUInt32BE(20);}},requestAnimationFrame:fn=>frame=fn,setInterval:fn=>(interval=fn,1),clearInterval:()=>{interval=null;cleared++;}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('scene.js','utf8'),sandbox);
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
