const assert=require('node:assert/strict');
const Gag=require('./shirt-gag.js');
const inputs={pressure:100,ready:true,ownerReady:true,girlReady:true};
function step(s,seconds,input=inputs){for(let n=0;n<Math.ceil(seconds*60);n++)Gag.update(s,input,1/60);}
const s=Gag.create();step(s,.1,{...inputs,ready:false});assert.equal(s.phase,'dressed');
step(s,.1,{...inputs,ownerReady:false});assert.equal(s.phase,'dressed');
step(s,.1,{...inputs,girlReady:false});assert.equal(s.phase,'prepare');assert(Gag.pinned(s));
step(s,.1,{...inputs,pressure:0});assert.equal(s.phase,'dressed');
step(s,.1);step(s,1.5);assert(Gag.swim(s));step(s,2);assert.equal(s.phase,'covered');assert.equal(Gag.location(s),'owner-head');
step(s,20,{...inputs,pressure:70});assert.equal(s.phase,'covered','Shirt must stay on same head above return threshold');
step(s,.1,{...inputs,pressure:0,girlReady:false});assert.equal(s.phase,'prepareReturn');
step(s,.1,{...inputs,pressure:100});assert.equal(s.phase,'covered','Before flight, an interrupted return can remain on the head');
step(s,1);step(s,.1,{...inputs,pressure:0});assert.equal(s.phase,'returning');
step(s,.2,{...inputs,pressure:100});assert.equal(s.phase,'returning','Do not restart a committed handoff');
step(s,3.8,{...inputs,pressure:100});assert.equal(s.phase,'dressed');assert(!Gag.swim(s));assert(!Gag.pinned(s));assert(s.cooldown>0);
const phases=new Set();let x=Gag.create();
for(let n=0;n<30000;n++){
 const pressure=n<1200?100:n%600<300?100:0;
 Gag.update(x,{...inputs,pressure},1/60);phases.add(x.phase);
 assert(['woman','woman-hand','air-out','owner-head','air-return','owner-hand'].includes(Gag.location(x)));
 assert.equal(Gag.pinned(x),x.phase!=='dressed');
 if(['covered','prepareReturn','returning'].includes(x.phase))assert(Gag.swim(x),'All continuing poses must use the same outfit');
}
step(x,20,{...inputs,pressure:0});assert.equal(x.phase,'dressed');
for(const phase of ['prepare','changing','throwing','covered','prepareReturn','returning','dressing','dressed'])assert(phases.has(phase),phase);
console.log('PASS: asset readiness, owner lease, both thresholds, abort before change, consistent costume, persistent head shirt, atomic return, cooldown, 30,000 jitter updates, and full recovery.');

const boundary=Gag.create();step(boundary,.1,{...inputs,pressure:74});assert.equal(boundary.phase,'dressed');
step(boundary,.1,{...inputs,pressure:75,girlReady:false});assert.equal(boundary.phase,'prepare','The gag must trigger at exactly 75%');
console.log('PASS: 74% stays dressed, exactly 75% starts the shirt gag.');

const rounded=Gag.create();step(rounded,.1,{...inputs,pressure:74.49});assert.equal(rounded.phase,'dressed');
step(rounded,.1,{...inputs,pressure:74.5,girlReady:false});assert.equal(rounded.phase,'prepare','Trigger must match the displayed rounded 75%');
