'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Scene=require('../realism-scene.js');

function events(target={}){
  target.listeners=new Map();
  target.addEventListener=function(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);};
  target.removeEventListener=function(type,fn){this.listeners.get(type)?.delete(fn);};
  target.emit=function(type,value={}){for(const fn of this.listeners.get(type)||[])fn(value);};
  target.listenerCount=function(){return [...this.listeners.values()].reduce((n,s)=>n+s.size,0);};
  return target;
}
function element(){
  const e=events({dataset:{},hidden:false,parentNode:null,children:[],attrs:{}}),values=new Map();
  e.style={setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k),getPropertyValue:k=>values.get(k)||''};
  e.setAttribute=(k,v)=>{e.attrs[k]=v;};
  e.appendChild=child=>{child.remove();e.children.push(child);child.parentNode=e;};
  e.remove=()=>{if(e.parentNode){e.parentNode.children=e.parentNode.children.filter(v=>v!==e);e.parentNode=null;}};
  e.getBoundingClientRect=()=>({left:100,top:50,right:1100,bottom:675,width:1000,height:625});
  return e;
}
function fixture(options={}){
  const stage=element(),doc=events({hidden:false,stage}),frames=new Map(),rooms=[],resizes=[],intersections=[];
  const motion=events({matches:!!options.reduced}),fine=events({matches:options.fine!==false});
  let frameId=0,loads=0,builds=0,now=0;
  doc.createElement=element;doc.querySelector=()=>doc.stage;doc.getElementById=()=>null;
  const win=events({document:doc,innerWidth:1366,innerHeight:900,devicePixelRatio:3});
  win.matchMedia=query=>query.includes('reduced-motion')?motion:fine;
  win.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};win.cancelAnimationFrame=id=>frames.delete(id);
  win.ResizeObserver=class{constructor(fn){this.fn=fn;this.targets=[];resizes.push(this);}observe(t){this.targets.push(t);}disconnect(){this.targets=[];}};
  win.IntersectionObserver=class{constructor(fn){this.fn=fn;this.targets=[];intersections.push(this);}observe(t){this.targets.push(t);}disconnect(){this.targets=[];}};
  const errors=[];
  const controller=Scene.createController({window:win,document:doc,onError:error=>errors.push(error),
    loadEngine:()=>{loads++;return options.loadEngine?options.loadEngine():Promise.resolve({engine:true});},
    buildScene:(engine,opts)=>{builds++;if(options.buildError)throw new Error('No WebGL');const room={canvas:element(),animated:options.animated!==false,updates:[],sizes:[],renders:[],disposed:0,
      update(v){this.updates.push(v);},resize(...args){this.sizes.push(args);if(options.resizeError)throw new Error('Resize failed');},render(v){this.renders.push({...v});if(options.renderError)throw new Error('Context failed');},dispose(){this.disposed++;}};rooms.push(room);return room;}
  });
  return{controller,win,doc,stage,motion,fine,frames,rooms,resizes,intersections,errors,get loads(){return loads;},get builds(){return builds;},
    draw(time){now=time===undefined?now+16:time;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(now);},
    settle(){let draws=0;while(frames.size&&draws<180){this.draw();draws++;}assert.equal(frames.size,0,'CSS fallback must stop after the camera settles');return draws;},
    enable(value={}){return controller.sync({view:value.view||'home',appearance:{realism:true,wood:value.wood||'oak',theme:value.theme||'light'}});}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('only explicit realism activates; appearance values are allowlisted',()=>{
  assert.deepEqual(Scene.settings({view:'<script>',appearance:{realism:'true',wood:'../../foo',theme:'bad'}}),{view:'home',realism:false,wood:'oak',theme:'light'});
  assert.deepEqual(Scene.settings({view:'library',appearance:{realism:true,wood:'cherry',theme:'dark'}}),{view:'library',realism:true,wood:'cherry',theme:'dark'});
});

test('normal mode never loads an engine, mounts a host, or registers a frame or listener',async()=>{
  const f=fixture();assert.equal(await f.controller.sync({appearance:{realism:false}}),false);
  assert.equal(f.loads,0);assert.equal(f.builds,0);assert.equal(f.stage.children.length,0);assert.equal(f.frames.size,0);assert.equal(f.win.listenerCount(),0);assert.equal(f.doc.listenerCount(),0);
});

test('mount waits for a real photographic stage, never creates a fixed background',async()=>{
  const f=fixture();f.doc.stage=null;assert.equal(await f.enable(),false);assert.equal(f.loads,0);
  f.doc.stage=f.stage;assert.equal(await f.enable(),true);assert.equal(f.loads,1);assert.equal(f.stage.children[0].id,'realism-scene');
  assert.match(f.stage.children[0].style.cssText,/position:absolute/);assert.match(f.stage.children[0].style.cssText,/pointer-events:none/);
  f.controller.destroy();
});

test('one lazy engine and room serve repeated syncs; quality DPR is bounded at two',async()=>{
  const f=fixture();await Promise.all([f.enable(),f.enable(),f.enable()]);
  assert.equal(f.loads,1);assert.equal(f.builds,1);assert.equal(f.rooms[0].canvas.parentNode.parentNode,f.stage);
  assert.deepEqual(f.rooms[0].sizes.at(-1),[1000,625,2]);f.draw();assert.equal(f.stage.children[0].dataset.ready,'1');
  await f.enable({wood:'birch',theme:'dark',view:'detail'});assert.equal(f.builds,1);assert.equal(f.rooms[0].updates.at(-1).wood,'birch');assert.equal(f.rooms[0].updates.at(-1).view,'detail');f.controller.destroy();
});

test('disabling while the engine downloads cannot create an obsolete renderer',async()=>{
  let resolve;const f=fixture({loadEngine:()=>new Promise(r=>resolve=r)});const pending=f.enable();await flush();
  await f.controller.sync({appearance:{realism:false}});resolve({});assert.equal(await pending,false);
  assert.equal(f.builds,0);assert.equal(f.frames.size,0);assert.equal(f.win.listenerCount(),0);assert.equal(f.stage.children[0].hidden,true);
});

test('rapid on/off/on reuses the pending download and starts exactly the latest view',async()=>{
  let resolve;const f=fixture({loadEngine:()=>new Promise(r=>resolve=r)});const pending=f.enable();await flush();
  await f.controller.sync({appearance:{realism:false}});f.enable({view:'library',wood:'acacia'});resolve({});await pending;await flush();
  assert.equal(f.loads,1);assert.equal(f.builds,1);assert.equal(f.rooms[0].updates.at(-1).wood,'acacia');assert.equal(f.rooms[0].updates.at(-1).view,'library');f.controller.destroy();
});

test('normal-mode switch cancels animation and removes listeners, observers and GPU canvas',async()=>{
  const f=fixture();await f.enable();f.win.emit('pointermove',{clientX:1080,clientY:600,pointerType:'mouse'});f.draw();const room=f.rooms[0];
  assert.ok(f.stage.style.getPropertyValue('--room-look-x'));await f.controller.sync({appearance:{realism:false}});
  assert.equal(room.disposed,1);assert.equal(room.canvas.parentNode,null);assert.equal(room.canvas.listenerCount(),0);assert.equal(f.frames.size,0);assert.equal(f.win.listenerCount(),0);assert.equal(f.doc.listenerCount(),0);assert.equal(f.motion.listenerCount(),0);assert.equal(f.fine.listenerCount(),0);
  assert.equal(f.resizes[0].targets.length,0);assert.equal(f.intersections[0].targets.length,0);assert.equal(f.stage.style.getPropertyValue('--room-look-x'),'');
  await f.enable();assert.equal(f.loads,1);assert.equal(f.builds,2);f.controller.destroy();
});

test('a rerender reattaches the same canvas to the new whole room, not to a stale photo',async()=>{
  const f=fixture();await f.enable();f.win.emit('pointermove',{clientX:1000,clientY:400,pointerType:'mouse'});f.draw();
  const next=element();f.doc.stage=next;await f.enable({view:'search'});
  assert.equal(f.builds,1);assert.equal(f.rooms[0].canvas.parentNode.parentNode,next);assert.equal(f.stage.children.length,0);assert.equal(f.stage.style.getPropertyValue('--room-look-x'),'');assert.deepEqual(f.resizes[0].targets,[next]);assert.deepEqual(f.intersections[0].targets,[next]);f.controller.destroy();
});

test('leaving scenic content releases GPU resources even if preference remains enabled',async()=>{
  const f=fixture();await f.enable();f.doc.stage=null;await f.enable();
  assert.equal(f.rooms[0].disposed,1);assert.equal(f.controller.status().ready,false);assert.equal(f.frames.size,0);f.win.emit('pointermove',{clientX:500,clientY:200});assert.equal(f.frames.size,0);
});

test('parallax updates only the common parent, never transforms canvas or individual controls',async()=>{
  const f=fixture();await f.enable();f.win.emit('pointermove',{clientX:1050,clientY:640,pointerType:'mouse'});f.draw();
  assert.ok(parseFloat(f.stage.style.getPropertyValue('--room-look-x'))>0);assert.ok(parseFloat(f.stage.style.getPropertyValue('--room-look-y'))<0);
  assert.equal(f.rooms[0].canvas.style.getPropertyValue('--room-look-x'),'');assert.equal(f.rooms[0].canvas.style.transform,undefined);
  f.controller.destroy();
});

test('touch/coarse pointers never move the camera or consume pointer input',async()=>{
  for(const opts of [{fine:false},{}]){const f=fixture(opts);await f.enable();f.win.emit('pointermove',{clientX:1080,clientY:600,pointerType:opts.fine===false?'mouse':'touch',preventDefault(){assert.fail('pointer input must not be intercepted');}});f.draw();assert.equal(f.rooms[0].renders.at(-1).x,0);assert.equal(f.rooms[0].renders.at(-1).y,0);f.controller.destroy();}
});

test('reduced motion draws one still atmosphere, with no persistent animation or pointer movement',async()=>{
  const f=fixture({reduced:true});await f.enable();f.win.emit('pointermove',{clientX:1050,clientY:640,pointerType:'mouse'});f.draw();
  assert.equal(f.frames.size,0);assert.deepEqual(f.rooms[0].renders[0],{x:0,y:0,time:0,reducedMotion:true});
  f.motion.matches=false;f.motion.emit('change');f.draw(32);assert.equal(f.frames.size,1);
  f.motion.matches=true;f.motion.emit('change');f.draw(48);assert.equal(f.frames.size,0);assert.equal(f.rooms[0].renders.at(-1).x,0);f.controller.destroy();
});

test('hidden tabs and offscreen rooms stop drawing; visibility resumes without a large time jump',async()=>{
  const f=fixture();await f.enable();f.draw();const before=f.rooms[0].renders.at(-1).time;
  f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.frames.size,0);
  f.doc.hidden=false;f.doc.emit('visibilitychange');f.draw(100000);assert.ok(f.rooms[0].renders.at(-1).time-before<.1);
  f.intersections[0].fn([{target:f.stage,isIntersecting:false}]);assert.equal(f.frames.size,0);
  f.intersections[0].fn([{target:f.stage,isIntersecting:true}]);assert.equal(f.frames.size,1);f.controller.destroy();
});

test('WebGL context loss pauses GPU drawing while physical camera movement remains available',async()=>{
  const f=fixture();await f.enable();f.draw();let prevented=0;const room=f.rooms[0];room.canvas.emit('webglcontextlost',{preventDefault(){prevented++;}});
  assert.equal(prevented,1);f.settle();assert.equal(f.controller.status().fallback,true);assert.equal(f.stage.children[0].dataset.fallback,'1');
  const draws=room.renders.length;f.win.emit('pointermove',{clientX:1050,clientY:640,pointerType:'mouse'});f.settle();assert.ok(parseFloat(f.stage.style.getPropertyValue('--room-look-x'))>.65);assert.equal(room.renders.length,draws);assert.equal(room.disposed,0);
  room.canvas.emit('webglcontextrestored');assert.equal(f.controller.status().ready,true);assert.equal(f.frames.size,1);f.draw();assert.equal(f.stage.children[0].dataset.fallback,undefined);assert.equal(f.stage.children[0].dataset.error,undefined);assert.equal(room.renders.length,draws+1);
  await f.controller.sync({appearance:{realism:false}});room.canvas.emit('webglcontextrestored');assert.equal(f.frames.size,0);assert.equal(room.disposed,1);
});

test('engine rejection becomes a quiet photographic fallback and retries only after toggling',async()=>{
  let calls=0;const f=fixture({loadEngine:()=>++calls===1?Promise.reject(new Error('Offline')):Promise.resolve({})});
  assert.equal(await f.enable(),false);assert.equal(f.controller.status().fallback,true);assert.equal(f.errors.length,1);await f.enable();assert.equal(f.loads,1);
  await f.controller.sync({appearance:{realism:false}});assert.equal(await f.enable(),true);assert.equal(f.loads,2);f.controller.destroy();
});

test('renderer construction, resize and draw failures all preserve controls and stop GPU activity',async()=>{
  for(const options of [{buildError:true},{resizeError:true},{renderError:true}]){
    const f=fixture(options);await f.enable();f.settle();assert.equal(f.controller.status().fallback,true);assert.equal(f.controller.status().ready,false);assert.equal(f.frames.size,0);assert.equal(f.win.listenerCount(),2);assert.equal(f.stage.children[0].dataset.fallback,'1');assert.equal(f.stage.children[0].hidden,false);assert.equal(f.stage.children[0].attrs['aria-hidden'],'true');assert.ok(f.stage.children[0].dataset.error);if(f.rooms.length)assert.equal(f.rooms[0].disposed,1);f.controller.destroy();assert.equal(f.win.listenerCount(),0);
  }
});

test('without WebGL, pointer movement animates the complete room and stops after settling',async()=>{
  const f=fixture({buildError:true});await f.enable();f.settle();const host=f.stage.children[0];
  assert.equal(f.controller.status().animating,false);assert.equal(host.dataset.error,'No WebGL');
  f.win.emit('pointermove',{clientX:1050,clientY:640,pointerType:'mouse',preventDefault(){assert.fail('camera cannot intercept input');}});
  assert.equal(f.frames.size,1);assert.ok(f.settle()>1);assert.ok(parseFloat(f.stage.style.getPropertyValue('--room-look-x'))>.65);assert.ok(parseFloat(f.stage.style.getPropertyValue('--room-look-shift-x'))<-3);
  assert.equal(host.dataset.fallback,'1');assert.equal(host.dataset.error,'No WebGL');assert.equal(host.dataset.ready,undefined);assert.equal(f.controller.status().animating,false);
  f.doc.emit('pointerleave');f.settle();assert.ok(Math.abs(parseFloat(f.stage.style.getPropertyValue('--room-look-x')))<.001);
  await f.controller.sync({appearance:{realism:false}});assert.equal(f.win.listenerCount(),0);assert.equal(f.doc.listenerCount(),0);assert.equal(f.motion.listenerCount(),0);assert.equal(f.fine.listenerCount(),0);assert.equal(f.frames.size,0);assert.equal(f.resizes[0].targets.length,0);assert.equal(f.intersections[0].targets.length,0);assert.equal(f.stage.style.getPropertyValue('--room-look-x'),'');assert.equal(host.dataset.error,undefined);
});

test('photographic fallback follows rerenders without retrying a failed engine or idle animation',async()=>{
  const f=fixture({loadEngine:()=>Promise.reject(new Error('Offline'))});await f.enable();f.settle();
  for(let i=0;i<4;i++){await f.enable({wood:'birch',view:'search'});f.settle();}assert.equal(f.loads,1);
  const next=element();f.doc.stage=next;await f.enable({view:'library'});f.settle();assert.equal(f.loads,1);assert.equal(f.builds,0);assert.equal(f.stage.children.length,0);assert.equal(next.children[0].dataset.error,'Offline');assert.deepEqual(f.resizes[0].targets,[next]);
  f.win.emit('pointermove',{clientX:1050,clientY:640,pointerType:'mouse'});f.settle();assert.ok(parseFloat(next.style.getPropertyValue('--room-look-x'))>.65);
  f.doc.hidden=true;f.doc.emit('visibilitychange');f.win.emit('pointermove',{clientX:110,clientY:80,pointerType:'mouse'});assert.equal(f.frames.size,0);
  f.doc.hidden=false;f.doc.emit('visibilitychange');f.settle();f.motion.matches=true;f.motion.emit('change');f.settle();assert.equal(parseFloat(next.style.getPropertyValue('--room-look-x')),0);
  f.win.emit('pointermove',{clientX:1050,clientY:640,pointerType:'mouse'});assert.equal(f.frames.size,0);f.controller.destroy();
});

test('destroy is idempotent and cancels an unresolved activation',async()=>{
  const f=fixture();await f.enable();f.controller.destroy();f.controller.destroy();assert.equal(f.rooms[0].disposed,1);assert.equal(f.controller.status().enabled,false);
  let resolve;const pendingFixture=fixture({loadEngine:()=>new Promise(r=>resolve=r)});const pending=pendingFixture.enable();await flush();pendingFixture.controller.destroy();resolve({});await pending;assert.equal(pendingFixture.builds,0);
});
