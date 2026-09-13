'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Appearance=require('../appearance.js');

// A small tree adapter exercises the real module and registered UI handlers.
// Geometry, colours and the narrow-screen panel are checked in browser QA.
function environment({saved={},systemDark=false,unavailable=false}={}){
  const storage={...saved},writes=[],emitted=[],events={},windowEvents={};
  function listen(target,type,fn){(target[type]||(target[type]=[])).push(fn);}
  function dispatch(target,type,event){(target[type]||[]).forEach(fn=>fn(event));}
  let document;
  class Element{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this.hidden=false;this.events={};this.textContent='';this.className='';
      const self=this;this.classList={add(value){if(!self.className.split(' ').includes(value))self.className=(self.className+' '+value).trim();},toggle(value,on){const set=new Set(self.className.split(' ').filter(Boolean));if(on)set.add(value);else set.delete(value);self.className=[...set].join(' ');},contains(value){return self.className.split(' ').includes(value);}};
    }
    setAttribute(key,value){this.attributes[key]=String(value);}
    getAttribute(key){return this.attributes[key]??null;}
    append(...nodes){nodes.forEach(node=>{if(node.parentNode)node.parentNode.children.splice(node.parentNode.children.indexOf(node),1);node.parentNode=this;this.children.push(node);});}
    insertBefore(node,next){node.parentNode=this;this.children.splice(this.children.indexOf(next),0,node);}
    contains(node){return node===this||this.children.some(child=>child.contains(node));}
    addEventListener(type,fn){listen(this.events,type,fn);}
    click(){dispatch(this.events,'click',{target:this});}
    focus(){document.activeElement=this;dispatch(events,'focusin',{target:this});}
  }
  const body=new Element('body'),nav=new Element('nav'),trigger=new Element('button'),outside=new Element('input');trigger.id='appearanceBtn';nav.append(trigger);body.append(nav,outside);
  const all=()=>{const result=[];function visit(node){result.push(node);node.children.forEach(visit);}visit(body);return result;};
  document={body,readyState:'complete',activeElement:null,createElement:tag=>new Element(tag),getElementById:id=>all().find(node=>node.id===id)||null,querySelector:()=>null,
    addEventListener(type,fn){listen(events,type,fn);},dispatchEvent(event){emitted.push(event);dispatch(events,event.type,event);}};
  const media={matches:systemDark,events:{},addEventListener(type,fn){listen(this.events,type,fn);}};
  const root={document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},matchMedia:()=>media,
    localStorage:{getItem(key){if(unavailable)throw new Error('No storage');return storage[key]??null;},setItem(key,value){if(unavailable)throw new Error('No storage');storage[key]=value;writes.push([key,value]);}},
    addEventListener(type,fn){listen(windowEvents,type,fn);}};
  const api=Appearance.create(root);api.init();
  return {api,document,storage,writes,emitted,trigger,outside,media,
    find:predicate=>all().find(predicate),byId:id=>document.getElementById(id),
    choose(type,value){const item=all().find(node=>node.dataset['appearance'+type]===value);assert(item);item.click();return item;},
    escape(){let prevented=false;dispatch(events,'keydown',{key:'Escape',preventDefault(){prevented=true;},stopPropagation(){}});return prevented;},
    pointer(target){dispatch(events,'pointerdown',{target});},
    external(key,value){if(key===null)Object.keys(storage).forEach(key=>delete storage[key]);else if(value===null)delete storage[key];else storage[key]=value;dispatch(windowEvents,'storage',{key,newValue:value});},
    system(dark){media.matches=dark;dispatch(media.events,'change',{});}};
}

test('appearance reads legacy theme and palette while realism defaults off',()=>{
  const e=environment({saved:{mzr_theme:'dark',mzr_palette:'rose'}});
  assert.deepEqual(e.api.get(),{theme:'dark',palette:'rose',realism:false,wood:'oak'});
  assert(e.document.body.classList.contains('dark'));assert.equal(e.document.body.dataset.palette,'rose');
  assert.equal(e.document.body.dataset.realism,'false');assert.equal(e.writes.length,0);
  assert.equal(e.find(node=>node.getAttribute('aria-labelledby')==='appearancePaletteTitle').hidden,false);
  assert.equal(e.find(node=>node.getAttribute('aria-labelledby')==='appearanceWoodTitle').hidden,true);
});

test('theme, palette, realism and wood persist independently through actual controls and reload',()=>{
  const e=environment({saved:{mzr_palette:'lavender'}});
  e.choose('Theme','dark');e.byId('appearanceRealism').click();e.choose('Wood','cherry');
  assert.equal(e.api.get().palette,'lavender');assert.equal(e.document.body.dataset.wood,'cherry');
  assert.equal(e.find(node=>node.getAttribute('aria-labelledby')==='appearancePaletteTitle').hidden,true);
  assert.equal(e.find(node=>node.getAttribute('aria-labelledby')==='appearanceWoodTitle').hidden,false);
  e.byId('appearanceRealism').click();e.choose('Palette','sky');
  assert.equal(e.api.get().wood,'cherry');assert.equal(e.api.get().realism,false);
  assert.deepEqual(e.storage,{mzr_theme:'dark',mzr_palette:'sky',za_realism:'false',za_wood:'cherry'});
  const restored=environment({saved:e.storage});assert.deepEqual(restored.api.get(),e.api.get());
});

test('the one Vzhled button opens a labelled dialog and Escape restores its focus',()=>{
  const e=environment({saved:{mzr_theme:'dark'}});e.trigger.click();
  const panel=e.byId('appearancePanel');assert.equal(panel.hidden,false);assert.equal(panel.getAttribute('role'),'dialog');
  assert.equal(panel.getAttribute('aria-labelledby'),'appearanceTitle');assert.equal(e.trigger.getAttribute('aria-expanded'),'true');
  assert.equal(e.document.activeElement.dataset.appearanceTheme,'dark');
  assert(e.escape());assert.equal(panel.hidden,true);assert.equal(e.document.activeElement,e.trigger);assert.equal(e.trigger.getAttribute('aria-expanded'),'false');
});

test('outside pointer closes with focus return, while Tab focus can leave normally',()=>{
  const e=environment();e.api.open();e.pointer(e.outside);
  assert.equal(e.byId('appearancePanel').hidden,true);assert.equal(e.document.activeElement,e.trigger);
  e.api.open();e.outside.focus();assert.equal(e.byId('appearancePanel').hidden,true);assert.equal(e.document.activeElement,e.outside);
});

test('scene notifications contain complete independent state and selection ARIA updates',()=>{
  const e=environment();const before=e.emitted.length;e.byId('appearanceRealism').click();e.choose('Wood','acacia');
  const event=e.emitted.at(-1);assert.equal(event.type,'za:appearance');assert.deepEqual(event.detail,{theme:'light',palette:'peach',realism:true,wood:'acacia'});
  assert.equal(e.byId('appearanceRealism').getAttribute('aria-checked'),'true');
  assert.equal(e.find(node=>node.dataset.appearanceWood==='acacia').getAttribute('aria-pressed'),'true');
  assert.equal(e.find(node=>node.dataset.appearanceWood==='oak').getAttribute('aria-pressed'),'false');
  assert.equal(e.emitted.length,before+2);event.detail.wood='invalid';assert.equal(e.api.get().wood,'acacia');
});

test('invalid saved options use safe defaults and invalid updates cannot change state',()=>{
  const e=environment({saved:{mzr_theme:'unknown',mzr_palette:'magenta',za_realism:'yes',za_wood:'plastic'}});
  assert.deepEqual(e.api.get(),{theme:'light',palette:'peach',realism:false,wood:'oak'});
  const before=e.emitted.length;
  for(const patch of [{theme:'system'},{palette:'<script>'},{wood:'plastic'},{realism:'false'},{unexpected:true}])assert.equal(e.api.set(patch),false);
  assert.equal(e.emitted.length,before);assert.equal(e.writes.length,0);
});

test('blocked storage still lets the visitor change appearance and reports session-only persistence',()=>{
  const e=environment({unavailable:true});e.choose('Theme','dark');e.byId('appearanceRealism').click();
  assert.equal(e.api.get().theme,'dark');assert.equal(e.api.get().realism,true);assert.equal(e.writes.length,0);
  const status=e.find(node=>node.getAttribute('role')==='status');assert.match(status.textContent,/Prohlížeč ho neuložil/);
});

test('storage events restore each preference and move focus off a newly hidden choice group',()=>{
  const e=environment();e.api.open();const selected=e.choose('Palette','sage');selected.focus();
  e.external('za_realism','true');assert.equal(e.api.get().realism,true);assert.equal(e.document.activeElement,e.byId('appearanceRealism'));
  e.external('za_wood','birch');assert.equal(e.api.get().wood,'birch');
  e.external('mzr_theme','dark');assert(e.document.body.classList.contains('dark'));
  e.external(null,null);assert.deepEqual(e.api.get(),{theme:'light',palette:'peach',realism:false,wood:'oak'});
});

test('system theme is followed only until the user explicitly chooses a theme',()=>{
  const e=environment({systemDark:true});assert.equal(e.api.get().theme,'dark');
  e.system(false);assert.equal(e.api.get().theme,'light');
  e.choose('Theme','light');e.system(true);assert.equal(e.api.get().theme,'light');
  e.external('mzr_theme',null);assert.equal(e.api.get().theme,'dark');
});

test('initialization is idempotent and does not add a second menu',()=>{
  const e=environment();const panel=e.byId('appearancePanel'),events=e.emitted.length;e.api.init();
  assert.equal(e.byId('appearancePanel'),panel);assert.equal(e.emitted.length,events);
});
