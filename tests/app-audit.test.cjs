'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Core=require('../book-core.js');
const CatalogueData=require('../catalogue-data.js');
const LibraryTools=require('../library-tools.js');
const BookShelf=require('../bookshelf.js');
const Appearance=require('../appearance.js');
const RoomRecommendations=require('../recommendations.js');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>\n([\s\S]*?)<\/script>/)[1];
const ID='seed:9788025359037';
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};

// Drive the delivered page's delegated handlers. This adapter verifies state,
// requests and persistence; browser QA separately verifies focus and layout.
function boot({storage={},failWrites=false,client={},libraryTools={},appearance=false}={}){
  const elements=new Map(),events={},windowEvents={},store={...storage},requests=[],writes=[],sceneUpdates=[];
  let blocked=failWrites;
  function listen(target,name,fn){(target[name]||(target[name]=[])).push(fn);}
  function dispatch(target,name,event){for(const fn of target[name]||[])fn(event);}
  function element(id='',attrs={}){
    const dataset={};
    Object.keys(attrs).filter(k=>k.startsWith('data-')).forEach(k=>{dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attrs[k];});
    const ownEvents={};let html='';
    const e={id,dataset,children:[],parentNode:null,className:'',value:'',style:{},open:false,hidden:false,
      getAttribute:k=>attrs[k]??null,setAttribute(k,v){attrs[k]=String(v);},closest(){return this;},matches(){return false;},
      appendChild(child){if(child.parentNode)child.parentNode.children.splice(child.parentNode.children.indexOf(child),1);child.parentNode=this;this.children.push(child);return child;},
      append(...children){children.forEach(child=>this.appendChild(child));},
      insertBefore(child,next){this.appendChild(child);this.children.splice(this.children.indexOf(child),1);this.children.splice(this.children.indexOf(next),0,child);},
      contains(node){return this===node||this.children.some(child=>child.contains(node));},
      addEventListener(type,fn){listen(ownEvents,type,fn);},
      focus(){document.activeElement=this;dispatch(events,'focusin',{target:this});},blur(){document.activeElement=null;},select(){},setSelectionRange(){},
      showModal(){this.open=true;},close(){this.open=false;},click(){dispatch(ownEvents,'click',{target:this});this.dispatch('click');},
      dispatch(type){dispatch(events,type,{target:this,key:'',preventDefault(){}});}};
    e.classList={add(name){this.toggle(name,true);},toggle(name,on){const names=new Set(e.className.split(' ').filter(Boolean));if(on)names.add(name);else names.delete(name);e.className=[...names].join(' ');},contains(name){return e.className.split(' ').includes(name);}};
    Object.defineProperty(e,'innerHTML',{configurable:true,get(){return html;},set(value){
      html=value;this.children.forEach(child=>{child.parentNode=null;});this.children=[];
      // Only model the replaced scene boundary and search input. The rest of the
      // delivered markup is asserted as output, not reimplemented as a browser.
      if(appearance&&id==='main'){
        if(/class="room-scene"/.test(value)){const stage=element();stage.className='room-scene';this.append(stage);}
        const search=value.match(/<input\b[^>]*\bid="herosearch"[^>]*>/);
        if(search){const input=element('herosearch');input.value=(search[0].match(/\bvalue="([^"]*)"/)||[])[1]||'';elements.set('herosearch',input);this.append(input);}
      }
    }});
    return e;
  }
  const body=element('body');
  function nodes(){const all=[];function visit(node){all.push(node);node.children.forEach(visit);}visit(body);return all;}
  const document={activeElement:null,body,readyState:'complete',
    getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},
    createElement(tag){const e=element();if(tag==='textarea')Object.defineProperty(e,'innerHTML',{set(v){this.value=v;},get(){return this.value;}});return e;},
    querySelectorAll(selector){return selector==='.appearance-picker'?nodes().filter(node=>node.classList.contains('appearance-picker')):[];},
    querySelector(selector){return ['.appearance-picker','.room-scene'].includes(selector)?nodes().find(node=>node.classList.contains(selector.slice(1)))||null:null;},
    addEventListener(name,fn){listen(events,name,fn);},dispatchEvent(event){dispatch(events,event.type,event);}};
  const localStorage={getItem:k=>store[k]??null,setItem(k,v){if(blocked)throw new Error('QuotaExceededError');store[k]=v;writes.push([k,v]);},removeItem(k){delete store[k];}};
  const location=new URL('https://zaobalkou.github.io/');
  const empty=()=>Promise.resolve({books:[],failed:0,total:1,issues:[]});
  const catalogue={featured:empty,search(q,f){requests.push({type:'search',query:q,filters:f});return empty();},
    tags(tags,f){requests.push({type:'tags',tags,filters:f});return empty();},detail:b=>Promise.resolve(b),getCachedRatings:b=>b,...client};
  const window={BookCore:Core,CatalogueData,LibraryTools:{...LibraryTools,...libraryTools},BookShelf,RoomRecommendations,CatalogueClient:catalogue,location,
    history:{pushState(_a,_b,url){location.href=new URL(url,location).href;}},
    scrollTo(){},matchMedia:()=>({matches:false}),addEventListener(name,fn){listen(windowEvents,name,fn);}};
  if(appearance){
    Object.assign(window,{document,localStorage,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},RealismScene:{sync(value){sceneUpdates.push(value);}}});
    const home=document.getElementById('appearanceHome'),trigger=document.getElementById('appearanceBtn');home.append(trigger);
    body.append(home,document.getElementById('roomNavigation'),document.getElementById('main'));
    window.Appearance=Appearance.create(window);window.Appearance.init();
  }
  const context=vm.createContext({window,document,localStorage,navigator:{},URL,Blob,Map,Set,Date,CSS:{escape:x=>x},console,setTimeout(){return 1;},clearTimeout(){}});
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'window.auditState=state;})();'),context,{filename:'index.html'});
  return {state:window.auditState,window,store,writes,requests,sceneUpdates,client:catalogue,document,nodes,
    main:()=>document.getElementById('main').innerHTML,
    blockWrites(){blocked=true;},
    click(action,data={}){element('',{'data-action':action,...data}).dispatch('click');},
    query(value){const input=document.getElementById('hsearch');input.value=value;input.dispatch('input');dispatch(events,'keydown',{target:input,key:'Enter'});},
    roomQuery(value){const input=document.getElementById('herosearch');input.value=value;input.dispatch('input');element('',{'data-action':'roomSubmit'}).dispatch('click');},
    filter(name,value){const input=element('',{'data-filter':name});input.value=value;input.dispatch('change');},
    field(type,action,value){const input=element('',{'data-action':action,'data-id':ID});input.value=value;input.dispatch(type);},
    storageEvent(key,newValue){dispatch(windowEvents,'storage',{key,newValue});},
    setHash(hash){location.hash=hash;dispatch(windowEvents,'hashchange',{});}};
}

test('removing the last hashtag keeps the author query and search results',async()=>{
  const a=boot();await settle();a.query('Sarah J Maas #romantasy');await settle();
  a.click('removeTag',{'data-i':'0'});await settle();
  assert.equal(a.state.view,'search');assert.equal(a.state.query,'Sarah J Maas');
  assert.equal(a.document.getElementById('hsearch').value,'Sarah J Maas');
  assert.equal(a.state.activeTags.length,0);assert(a.state.results.length>=7);
});

test('a book detail hashtag starts browsing even when that hashtag was already active',async()=>{
  const a=boot();await settle();a.query('#fantasy');await settle();
  a.click('open',{'data-id':ID});await settle();
  assert.equal(a.state.view,'detail');
  a.click('tag-raw',{'data-term':'fantasy','data-label':'#fantasy'});await settle();
  assert.equal(a.state.view,'search');assert.equal(a.state.query,'');
  assert.deepEqual(Array.from(a.state.activeTags,t=>t.term),['fantasy']);
  assert(a.state.results.length>0);assert.equal(a.window.location.hash,'');
});

test('adding a mood on search results preserves the author and previous tags',async()=>{
  const a=boot();await settle();a.query('Sarah J Maas #fantasy');await settle();
  a.click('mood',{'data-mood':'1'});await settle();
  assert.equal(a.state.query,'Sarah J Maas');
  assert.deepEqual(Array.from(a.state.activeTags,t=>t.term),['fantasy','romantasy']);
  assert(a.state.results.length>0);
  assert(a.state.results.every(b=>Core.relevance(b,'Sarah J Maas')>0&&Core.matchesTags(b,['fantasy','romantasy'])));
});

test('author plus hashtag searches the author online and applies every tag locally',async()=>{
  const expected={id:'fixture:rare',title:'Rare fantasy',author:'AuthorRare',year:2025,language:'en',tags:['fantasy']};
  const unrelated={...expected,id:'fixture:plain',title:'Unrelated memoir',tags:['historie']};
  const a=boot({client:{search(q){a.requests.push({type:'search',query:q});return Promise.resolve({books:[expected,unrelated],failed:0,total:1,issues:[]});}}});
  await settle();a.query('AuthorRare #fantasy');await settle();
  assert(a.requests.some(r=>r.type==='search'&&r.query==='AuthorRare'));
  assert.equal(a.state.results.length,1);assert.equal(a.state.results[0].id,expected.id);
});

test('a detail hashtag starts a fresh topic without retaining an unrelated author',async()=>{
  const a=boot();await settle();a.query('Sarah J Maas #fantasy');await settle();
  a.click('open',{'data-id':a.state.results[0].id});await settle();
  a.click('tag-raw',{'data-term':'romantika','data-label':'#romantika'});await settle();
  assert.equal(a.state.view,'search');assert.equal(a.state.query,'');
  assert.deepEqual(Array.from(a.state.activeTags,t=>t.term),['romantika']);
});

test('library removal in another tab clears memory and cannot resurrect books on the next edit',async()=>{
  const a=boot();await settle();a.click('status',{'data-id':ID,'data-status':'reading'});
  assert.equal(Object.keys(a.state.lib).length,1);
  delete a.store.mzr_lib_v2;a.storageEvent('mzr_lib_v2',null);
  assert.equal(Object.keys(a.state.lib).length,0);
  const next='seed:9780525648154';a.click('status',{'data-id':next,'data-status':'want'});
  assert.deepEqual(Object.keys(JSON.parse(a.store.mzr_lib_v2)),[next]);
});

test('a corrupt library stays unchanged and blocks status writes',async()=>{
  const raw='{"unfinished":';const a=boot({storage:{mzr_lib_v2:raw}});await settle();
  a.click('status',{'data-id':ID,'data-status':'reading'});
  assert.equal(a.store.mzr_lib_v2,raw);assert.equal(Object.keys(a.state.lib).length,0);
  assert.match(a.main(),/Původní data|Původní knihovna|původní data/);
});

test('a failed progress write is visible immediately before blur',async()=>{
  const a=boot();await settle();a.click('status',{'data-id':ID,'data-status':'reading'});
  a.click('open',{'data-id':ID});await settle();
  const saved=a.store.mzr_lib_v2;a.blockWrites();a.field('input','page','42');
  assert.equal(a.store.mzr_lib_v2,saved);
  assert.match(a.main()+a.document.getElementById('toastHost').innerHTML,/nepodařilo uložit|jen v paměti|neuložil|neuložen/i);
});

test('a failed removal does not claim a permanently saved removal',async()=>{
  const a=boot();await settle();a.click('status',{'data-id':ID,'data-status':'reading'});
  const saved=a.store.mzr_lib_v2;a.blockWrites();a.click('remove',{'data-id':ID});
  assert.equal(a.store.mzr_lib_v2,saved);
  assert.match(a.main(),/nepodařilo uložit|jen v paměti|neuložil|neuložen/i);
  assert.notEqual(a.state.toast,'Odebráno z knihovny');
});

test('back from a book resumes an interrupted online search despite local results',async()=>{
  let calls=0,finishFirst;
  const remote={id:'fixture:remote',title:'Rod slavíků',author:'Jiný autor',year:2025,language:'cs',tags:['fantasy']};
  const a=boot({client:{search(){calls++;return calls===1?new Promise(resolve=>{finishFirst=resolve;}):Promise.resolve({books:[remote],failed:0,total:1,issues:[]});}}});
  await settle();a.query('Rod');assert(a.state.results.length>0);assert.equal(a.state.searchLoading,true);
  a.click('open',{'data-id':ID});await settle();a.click('back');await settle();
  assert.equal(a.state.view,'search');assert(calls>=2,'Returning should resume the interrupted request.');
  assert(a.state.results.some(b=>b.id===remote.id));
  finishFirst({books:[],failed:0,total:1,issues:[]});await settle();
  assert(a.state.results.some(b=>b.id===remote.id),'The superseded request must not replace resumed results.');
});

test('a stale transfer failure cannot reopen a dialog after navigation away',async()=>{
  let rejectTransfer;
  const a=boot({libraryTools:{parseLibraryFragment(){return new Promise((_resolve,reject)=>{rejectTransfer=reject;});}}});
  await settle();a.setHash('#library=fixture');a.click('home');
  rejectTransfer(new Error('Starý odkaz'));await settle();
  assert.equal(a.state.view,'home');assert.equal(a.document.getElementById('readerDialog').open,false);
});

test('a later detail failure preserves ratings already shown by a progress update',async()=>{
  let progress,rejectDetail;
  const a=boot({client:{detail(_book,onProgress){progress=onProgress;return new Promise((_resolve,reject)=>{rejectDetail=reject;});}}});
  await settle();a.click('open',{'data-id':ID});
  progress({...a.state.detail,grRating:4.2,grCount:12345,grUrl:'https://www.goodreads.com/book/show/123-fixture',grCheckedAt:'2026-09-13',grScope:'work',grSnapshot:true});
  assert.equal(Core.rating(a.state.detail).source,'Goodreads');
  rejectDetail(new Error('Metadata outage'));await settle();
  assert.equal(a.state.detailLoading,false);assert.equal(Core.rating(a.state.detail)?.source,'Goodreads');
});

function roomBookIds(app){
  return Array.from(app.main().matchAll(/<button\b[^>]*class="room-book"[^>]*data-action="open"[^>]*data-id="([^"]+)"/g),match=>match[1]);
}
function appearanceNode(app,id){const node=app.nodes().find(node=>node.id===id);assert(node,'Appearance control must stay connected: '+id);return node;}

test('realism switching through the actual appearance control preserves library data and progress',async()=>{
  const a=boot({appearance:true});await settle();
  a.click('status',{'data-id':ID,'data-status':'reading'});a.field('input','page','42');a.click('library');
  const library=a.state.lib,saved=a.store.mzr_lib_v2,contents=JSON.stringify(library);
  const libraryWrites=()=>a.writes.filter(([key])=>key==='mzr_lib_v2').length;
  const before=libraryWrites();
  for(const expected of [true,false,true,false]){
    appearanceNode(a,'appearanceRealism').click();await settle();
    assert.equal(a.window.Appearance.get().realism,expected);assert.equal(a.state.view,'library');
    assert.equal(a.state.lib,library,'A visual mode change must not rebuild the reading library.');
    assert.equal(JSON.stringify(a.state.lib),contents);assert.equal(a.store.mzr_lib_v2,saved);
    assert.equal(a.state.lib[ID].page,42);assert.equal(libraryWrites(),before);
    assert.equal(a.sceneUpdates.at(-1).appearance.realism,expected);
  }
});

test('room search submits the current text and retains edition filters through later searches and mode changes',async()=>{
  const good={id:'fixture:room-en',title:'AuthorRare fantasy',author:'AuthorRare',year:2025,language:'en',tags:['fantasy']};
  const wrongLanguage={...good,id:'fixture:room-cs',isbn:'9788025359037',title:'AuthorRare česká',language:'cs'};
  const wrongYear={...good,id:'fixture:room-old',title:'AuthorRare starší',year:2024};
  const a=boot({appearance:true,storage:{za_realism:'true'},client:{search(q,filters){
    a.requests.push({query:q,filters:{...filters}});return Promise.resolve({books:[good,wrongLanguage,wrongYear],failed:0,total:1,issues:[]});
  }}});
  await settle();a.roomQuery('AuthorRare');await settle();
  a.filter('language','en');a.filter('year','2025');await settle();
  a.roomQuery('AuthorRare #fantasy');await settle();
  assert.equal(a.state.view,'search');assert.equal(a.state.searchInput,'AuthorRare #fantasy');
  assert.equal(a.state.query,'AuthorRare');assert.equal(a.document.getElementById('herosearch').value,'AuthorRare #fantasy');
  assert.deepEqual(a.requests.at(-1),{query:'AuthorRare',filters:{year:'2025',language:'en',sort:'smart'}});
  assert.deepEqual(Array.from(a.state.results,book=>book.id),[good.id]);
  appearanceNode(a,'appearanceRealism').click();await settle();
  assert.equal(a.state.view,'search');assert.equal(a.document.getElementById('hsearch').value,'AuthorRare #fantasy');
  assert.equal(a.state.filters.language,'en');assert.equal(a.state.filters.year,'2025');
  appearanceNode(a,'appearanceRealism').click();await settle();
  assert.equal(a.document.getElementById('herosearch').value,'AuthorRare #fantasy');
  assert.deepEqual(Array.from(a.state.results,book=>book.id),[good.id]);
});

test('each of the six room recommendations opens the actual selected edition and survives returning home',async()=>{
  const a=boot({appearance:true,storage:{za_realism:'true'}});await settle();
  const visible=roomBookIds(a);assert.equal(visible.length,6);
  assert.deepEqual(visible,Array.from(a.state.roomBooks,book=>book.id));
  for(const id of visible){
    const expected=a.state.roomBooks.find(book=>book.id===id);assert(expected);
    a.click('open',{'data-id':id});await settle();
    assert.equal(a.state.view,'detail');assert.equal(a.state.detail.id,expected.id);
    assert.equal(a.state.detail.title,expected.title);assert.equal(a.state.detail.language,expected.language);
    a.click('home');await settle();
    assert.deepEqual(roomBookIds(a),visible);
  }
  assert.equal(Object.keys(a.state.lib).length,0,'Looking at a recommendation must not save it to the library.');
});

test('realism keeps all three physical shelves empty until books are added, while ordinary mode hides unused shelves',async()=>{
  const a=boot({appearance:true});await settle();a.click('library');
  const shelfLabels=()=>Array.from(a.main().matchAll(/aria-label="Knižní polička: ([^"]+)"/g),match=>match[1]);
  assert.deepEqual(shelfLabels(),[]);
  appearanceNode(a,'appearanceRealism').click();
  assert.deepEqual(shelfLabels(),['Rozečtené','Chci přečíst','Přečtené']);
  assert.equal((a.main().match(/class="shelf-section is-empty"/g)||[]).length,3);
  assert.equal((a.main().match(/class="shelf-book"/g)||[]).length,0);
  a.click('status',{'data-id':ID,'data-status':'reading'});
  assert.equal((a.main().match(/class="shelf-section is-empty"/g)||[]).length,2);
  assert.equal((a.main().match(/class="shelf-book"/g)||[]).length,1);
  appearanceNode(a,'appearanceRealism').click();
  assert.deepEqual(shelfLabels(),['Rozečtené']);assert.equal(a.state.lib[ID].status,'reading');
});

test('room Next draws six new works from the full live catalogue, beyond the ordinary eighteen cards',async()=>{
  let resolveFeatured;
  const remote=Array.from({length:50},(_,i)=>({id:'room:remote'+i,title:'New catalogue story '+i,author:'Writer '+i,year:2025,language:'en',tags:['fantasy']}));
  const a=boot({appearance:true,storage:{za_realism:'true'},client:{featured(){return new Promise(resolve=>{resolveFeatured=resolve;});}}});
  const first=roomBookIds(a);
  resolveFeatured({books:remote,failed:0,total:1,issues:[]});await settle();
  assert.deepEqual(roomBookIds(a),first,'Late catalogue data must not replace books under the pointer.');
  assert(a.state.featured.length<=18);assert(a.state.roomPool.length>=50);
  const ordinaryIds=new Set(a.state.featured.map(b=>b.id)),seen=new Set(first);let previous=first,outside;
  for(let draw=0;draw<5;draw++){
    a.click('roomNext');await settle();const row=roomBookIds(a);
    assert.equal(row.length,6);assert.equal(new Set(row).size,6);
    assert(row.every(id=>!previous.includes(id)),'Enough unseen works exist to replace the entire row.');
    row.forEach(id=>seen.add(id));previous=row;
    outside=outside||a.state.roomBooks.find(b=>remote.some(r=>r.id===b.id)&&!ordinaryIds.has(b.id));
  }
  assert(seen.size>18);assert(outside,'Recommendations outside the old fixed selection must be reachable.');
  a.click('open',{'data-id':outside.id});await settle();assert.equal(a.state.detail.id,outside.id);
  assert.equal(a.state.detail.title,outside.title);assert.equal(Object.keys(a.state.lib).length,0);
});

test('taste browsing is bounded and outages leave Next usable without writing the reading library',async()=>{
  const calls=[];
  const a=boot({appearance:true,client:{tags(tags){calls.push(['tags',...tags]);return Promise.reject(new Error('offline'));},search(author){calls.push(['author',author]);return Promise.reject(new Error('offline'));}}});
  await settle();a.click('status',{'data-id':ID,'data-status':'read'});
  const saved=a.store.mzr_lib_v2;
  appearanceNode(a,'appearanceRealism').click();await settle();await settle();
  assert(calls.some(c=>c[0]==='tags'));assert(calls.some(c=>c[0]==='author'));assert(calls.length<=3);
  const count=calls.length;
  for(let i=0;i<8;i++){a.click('roomNext');await settle();assert.equal(roomBookIds(a).length,6);assert(!a.state.roomBooks.some(b=>Core.sameWork(b,a.state.lib[ID].book)));}
  assert.equal(calls.length,count,'Next must reuse the catalogue batch, not issue requests every click.');
  assert.equal(a.store.mzr_lib_v2,saved);
});

test('a superseded taste request cannot change the new discovery pool or selected row',async()=>{
  let resolveOld,tagCalls=0;
  const a=boot({appearance:true,client:{tags(){if(++tagCalls===1)return new Promise(resolve=>{resolveOld=resolve;});return Promise.resolve({books:[]});}}});
  await settle();a.click('status',{'data-id':ID,'data-status':'read'});appearanceNode(a,'appearanceRealism').click();await settle();
  a.click('discover',{'data-mode':'ya'});await settle();const row=roomBookIds(a);
  resolveOld({books:[{id:'old:taste',title:'Stale request book',author:'Old query',year:2025,tags:['fantasy']}]});await settle();
  assert(!a.state.roomPool.some(b=>b.id==='old:taste'));assert.deepEqual(roomBookIds(a),row);
});

test('the same appearance picker and its working controls survive every scene replacement',async()=>{
  const a=boot({appearance:true});await settle();
  const picker=a.document.querySelector('.appearance-picker'),trigger=appearanceNode(a,'appearanceBtn'),panel=appearanceNode(a,'appearancePanel');
  const check=()=>{
    assert.equal(a.document.querySelectorAll('.appearance-picker').length,1);
    assert.equal(a.document.querySelector('.appearance-picker'),picker);
    assert.equal(appearanceNode(a,'appearanceBtn'),trigger);assert.equal(appearanceNode(a,'appearancePanel'),panel);
  };
  check();appearanceNode(a,'appearanceRealism').click();await settle();check();
  assert.equal(picker.parentNode,a.document.getElementById('roomNavigation'));
  assert.equal(picker.parentNode.parentNode,a.document.querySelector('.room-scene'));
  a.click('roomNext');check();a.roomQuery('Rod draků');await settle();check();
  a.click('open',{'data-id':ID});await settle();check();a.click('library');check();
  a.click('home');await settle();check();
  trigger.click();assert.equal(panel.hidden,false);assert.equal(trigger.getAttribute('aria-expanded'),'true');
  a.nodes().find(node=>node.dataset.appearanceWood==='birch').click();check();assert.equal(a.window.Appearance.get().wood,'birch');
  appearanceNode(a,'appearanceRealism').click();check();
  assert.equal(picker.parentNode,a.document.getElementById('appearanceHome'));
  a.nodes().find(node=>node.dataset.appearancePalette==='sage').click();assert.equal(a.window.Appearance.get().palette,'sage');
  trigger.click();assert.equal(panel.hidden,true);
});
