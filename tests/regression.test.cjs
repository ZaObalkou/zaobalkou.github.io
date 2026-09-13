'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../book-core.js');
const CatalogueClient = require('../catalogue-client.js');
const CatalogueData = require('../catalogue-data.js');
const LibraryTools = require('../library-tools.js');
const BookShelf = require('../bookshelf.js');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const book = (id,title,year,extra={}) => ({id,title,year,author:'Autor',tags:[],...extra});
const CS_DRAGONS='seed:9788025359037', EN_DRAGONS='seed:9780525648154';
const flush = async () => {for(let i=0;i<6;i++){for(let j=0;j<40;j++)await Promise.resolve();await new Promise(setImmediate);}};
const waitUntil = async predicate => {for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.fail('Asynchronous UI condition did not complete.');};
// Lightweight DOM adapter dispatches the actual registered event handlers. It is
// intentionally not a layout engine and does not replace real-browser input QA.
function boot({fetcher=()=>Promise.resolve({ok:false,status:503,json:async()=>({})}),storage={},failWrites=false,hash='',config={}}={}){
  const elements=new Map(),events={},windowEvents={},timers=new Map(),downloads=[];let timerId=0;
  function element(id='',attributes={}){
    const data={};Object.keys(attributes).filter(k=>k.startsWith('data-')).forEach(k=>data[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attributes[k]);
    return {id,dataset:data,innerHTML:'',value:'',open:false,style:{},
      getAttribute:k=>attributes[k]??null,setAttribute(k,v){attributes[k]=v;},closest(){return this;},
      matches(selector){return (attributes['data-action']==='page'||attributes['data-action']==='total')&&selector.includes('data-action');},
      focus(){doc.activeElement=this;},setSelectionRange(){},select(){},showModal(){this.open=true;},close(){this.open=false;},
      click(){downloads.push({href:this.href,download:this.download});},
      dispatch(type){if(events[type])events[type]({target:this,key:'',preventDefault(){}});}};
  }
  const doc={activeElement:null,body:{classList:{toggle(){},contains(){return false;}}},
    getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},
    createElement(tag){const e=element();if(tag==='textarea')Object.defineProperty(e,'innerHTML',{set(value){this.value=value;},get(){return this.value;}});return e;},
    querySelectorAll(){return [];},querySelector(){return null;},addEventListener(name,fn){events[name]=fn;}};
  const store={...storage};
  const localStorage={getItem:k=>store[k]??null,setItem(k,v){if(failWrites)throw new Error('QuotaExceededError');store[k]=v;},removeItem(k){delete store[k];}};
  const location=new URL('https://zaobalkou.github.io/'+hash);
  const window={BookCore:Core,CatalogueData,LibraryTools,BookShelf,MZR_CONFIG:config,location,history:{pushState(_a,_b,url){location.href=new URL(url,location).href;}},scrollTo(){},matchMedia:()=>({matches:false}),addEventListener(name,fn){windowEvents[name]=fn;},console};
  window.CatalogueClient=CatalogueClient.create({core:Core,data:CatalogueData,config,fetch:fetcher,storage:localStorage,requestGap:0,timeout:500,origin:location.origin});
  const context=vm.createContext({window,document:doc,localStorage,navigator:{},fetch:fetcher,AbortController,URL,Blob,Map,Set,Date,CSS:{escape:x=>x},console,
    setTimeout(fn,ms){let id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
  // Expose lexical bindings only in this test copy, never in the delivered page.
  const instrument=script.replace(/\}\)\(\);\s*$/,`window.testAPI={state,runSearch,onQuery,applyQuery,goHome,goLibrary,openBook,setStatus,removeFromLib,undoRemove,refreshFeatured,localSearch,searchBooks,searchCombo,loadFeatured,buildRatings,fetchDetail,loadMore,renderMain,applyFilters,routeFromHash,spineImageHTML,attr,EMBEDDED};})();`);
  vm.runInContext(instrument,context,{filename:'index.html'});
  return {api:window.testAPI,store,timers,events,windowEvents,doc,window,downloads,main:()=>doc.getElementById('main').innerHTML,dialog:()=>doc.getElementById('readerDialog').innerHTML,
    click(action,data={}){element('',{'data-action':action,...data}).dispatch('click');},
    change(filter,value){const target=element('',{'data-filter':filter});target.value=value;target.dispatch('change');},
    field(type,action,id,value){const target=element('',{'data-action':action,'data-id':id});target.value=value;target.dispatch(type);return target;},
    query(value){const target=doc.getElementById('hsearch');target.value=value;target.dispatch('input');events.keydown({target,key:'Enter'});},
    setHash(value){location.hash=value;windowEvents.hashchange();}};
}
function response(data){return {ok:true,json:async()=>data};}
function emptyProvider(url){return Promise.resolve(response(url.includes('googleapis')?{totalItems:0}:url.includes('/search.json')?{docs:[]}:url.includes('itunes')?{results:[]}:{}));}
function providerMock(url){
  const u=new URL(url);
  if(u.hostname==='www.googleapis.com'){const q=u.searchParams.get('q');return Promise.resolve(response({totalItems:2,items:[{id:q,volumeInfo:{title:q,authors:['Autor'],publishedDate:'2025',categories:['Young Adult Fiction'],language:'cs'}},{id:q+'2',volumeInfo:{title:q+' pokračování',authors:['Autor'],publishedDate:'2026',language:'cs'}}]}));}
  return emptyProvider(url);
}

test('diacritics, punctuation and Unicode remain searchable',()=>{
  assert.equal(Core.norm(' ČTVRTÉ křídlo! '),'ctvrte kridlo');
  assert.notEqual(Core.key(book('1','日本',2020)),Core.key(book('2','한국',2020)));
  assert.equal(Core.relevance(book('1','Čtvrté křídlo',2023),'ctvrte kridlo'),6);
});
test('exact classic title beats a recent partial match and modern discovery prefers recent works',()=>{
  const old=book('1','Hobit',1937),recent=book('2','Hobit: průvodce',2025,{tags:['young adult']});
  assert.equal(Core.rank([recent,old],{query:'hobit',now:2026})[0].id,'1');
  assert.equal(Core.rank([book('3','Staré',1950,{olRating:4.9,olCount:10000}),recent],{now:2026})[0].id,'2');
});
test('publication-year filtering selects an edition while discovery still considers the original work year',()=>{
  const reprint=book('1','Klasika',2026,{firstPublishYear:1937,yearKind:'edition'});
  assert.equal(Core.rank([reprint],{year:'2026',now:2026}).length,1);
  assert.equal(Core.rank([reprint],{year:'2025',now:2026}).length,0);
  assert.equal(Core.rank([reprint],{era:'recent',now:2026}).length,0);
});
test('work grouping preserves separately selectable English and Czech editions',()=>{
  const a=book('a','Rod draků',2022,{language:'cs',workId:'fixture:dragons',isbn:'9788025359037'});
  const b=book('b','House of Dragons',2020,{language:'en',workId:'fixture:dragons',isbn:'9780525648154'});
  assert.equal(Core.sameBook(a,b),false);assert.equal(Core.sameWork(a,b),true);
  assert.equal(Core.merge([[a],[b]]).length,2);
  const grouped=Core.groupWorks([a,b],{});assert.equal(grouped.length,1);assert.equal(grouped[0].editions.length,2);
  assert.equal(Core.groupWorks([a,b],{language:'en'})[0].id,'b');
});
test('ratings reject invalid values and no fabricated rating source appears',()=>{
  for(const x of [0,-1,6,'4.5',NaN,Infinity])assert.equal(Core.validRating(x),false);
  const a=boot();assert.equal(a.api.buildRatings({gRating:4.2,gCount:9,bmRating:5,isbnRating:5,olEditRating:5}).length,1);
});
test('snapshot sanitizes URLs and imports reject prototype keys and clamp progress',()=>{
  const b=Core.snapshot(book('x','X','2025',{pages:Infinity,link:'javascript:alert(1)',isbn:'978-1234567890'}));
  assert.equal(b.link,'');assert.equal(b.pages,0);assert.equal(b.isbn,'9781234567890');assert.equal(b.year,2025);
  for(const input of [null,[],{a:{}},JSON.parse('{"__proto__":{}}')])assert.throws(()=>Core.validateLibrary(input));
  const good=Core.validateLibrary({x:{book:book('x','X',2025),status:'reading',pages:100,page:900}});
  assert.equal(good.x.page,100);assert.equal(Object.getPrototypeOf(good),null);
});
test('startup shows modern recommendations when online sources are unavailable',async()=>{
  const a=boot();await flush();assert.equal(a.api.state.featuredLoading,false);assert.equal(a.api.state.offlineFeatured,true);
  assert(a.api.state.featured.some(b=>b.title==='Úsvit sklizně'));assert(a.api.state.featured.every(b=>(b.firstPublishYear||b.year)>=2016));
  assert.match(a.main(),/Online katalogy se nepodařilo načíst/);assert.doesNotMatch(a.main(),/BookMoth/);
});
test('Rod Draků search finds the book without accents and with real Czech page metadata',async()=>{
  const a=boot();await flush();a.query('Rod Draku');await flush();
  assert.equal(a.api.state.results[0].title,'Rod draků');assert.equal(a.api.state.results[0].pages,400);
  assert.equal(a.api.state.results.filter(b=>Core.sameWork(b,a.api.state.results[0])).length,1);
  assert.equal(a.api.state.offlineSearch,true);assert.match(a.main(),/400 stran/);
  assert(a.api.localSearch('Fourth Wing',[]).some(b=>b.title==='Čtvrté křídlo'));
});
test('Sarah J Maas search returns several works, each with grouped language editions',async()=>{
  const a=boot();await flush();a.query('Sarah J Maas');await flush();
  assert(a.api.state.results.length>=7);
  const works=a.api.state.results.map(b=>b.workId);assert.equal(new Set(works).size,works.length);
  assert(a.api.state.results.some(b=>b.editions.some(e=>e.language==='cs')&&b.editions.some(e=>e.language==='en')));
});
test('working catalogues remain usable after an Apple outage and Google is opt-in',async()=>{
  const seen=[];
  const a=boot({config:{googleBooksApiKey:'test-key'},fetcher:url=>{seen.push(url);return url.includes('itunes')?Promise.reject(new Error('offline')):providerMock(url);}});await flush();
  a.query('Dračí akademie');await flush();
  assert.equal(a.api.state.results[0].title,'Dračí akademie');assert.equal(a.api.state.offlineSearch,false);assert.equal(a.api.state.searchFailed,1);
  assert.match(a.main(),/Dostupnost katalogů/);assert.doesNotMatch(a.main(),/Část katalogů se nepodařilo/);
  const noKey=[];const b=boot({fetcher:url=>{noKey.push(url);return emptyProvider(url);}});await flush();b.query('Zkouška');await flush();
  assert(!noKey.some(url=>url.includes('googleapis')));assert.equal(b.api.state.searchFailed,0);
});
test('successful empty responses are empty results, not an offline error',async()=>{
  const a=boot({fetcher:emptyProvider});await flush();a.query('zzzz-neexistuje');await flush();
  assert.equal(a.api.state.results.length,0);assert.equal(a.api.state.offlineSearch,false);assert.match(a.main(),/Nic jsme nenašli/);
});
test('malformed provider payload cannot crash the home page',async()=>{
  const a=boot({fetcher:url=>Promise.resolve(response(url.includes('itunes')?{results:[null]}:url.includes('/search.json')?{docs:[]}:{items:[null]}))});await flush();
  assert.equal(a.api.state.featuredLoading,false);assert(a.main().includes('Úsvit sklizně'));
});
test('a stale search cannot replace results while a new query is debouncing',async()=>{
  let gate=false;const pending=[];
  const a=boot({fetcher:url=>gate?new Promise(resolve=>pending.push({url,resolve})):emptyProvider(url)});await flush();gate=true;
  a.query('zz-old-query');await flush();
  const input=a.doc.getElementById('hsearch');input.value='zz-new-query';input.dispatch('input');
  pending.splice(0).forEach(p=>p.resolve(response(p.url.includes('itunes')?{results:[{trackId:1,trackName:'zz-old-query',artistName:'Autor'}]}:{docs:[]})));
  await flush();assert.equal(a.api.state.query,'zz-new-query');assert.equal(a.api.state.results.length,0);
});
test('going home cancels the pending debounce',async()=>{
  const a=boot();await flush();const input=a.doc.getElementById('hsearch');input.value='Rozpracováno';input.dispatch('input');a.click('home');
  assert.equal(a.api.state.view,'home');assert.equal([...a.timers.values()].filter(t=>t.ms===350).length,0);
});
test('page and total input events persist immediately before change or blur',async()=>{
  const a=boot();await flush();a.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});
  a.field('input','total',CS_DRAGONS,'500');a.field('input','page',CS_DRAGONS,'47');
  const saved=JSON.parse(a.store.mzr_lib_v2)[CS_DRAGONS];assert.equal(saved.pages,500);assert.equal(saved.page,47);assert.equal(saved.pagesManual,true);
  const b=boot({storage:a.store});await flush();assert.equal(b.api.state.lib[CS_DRAGONS].page,47);assert.equal(b.api.state.lib[CS_DRAGONS].pages,500);
  b.field('input','page',CS_DRAGONS,'9999');assert.equal(JSON.parse(b.store.mzr_lib_v2)[CS_DRAGONS].page,500);
});
test('manual zero total survives reload and subsequent metadata loading',async()=>{
  const a=boot();await flush();a.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});a.field('input','total',CS_DRAGONS,'0');
  const b=boot({storage:a.store});await flush();b.click('open',{'data-id':CS_DRAGONS});await flush();
  assert.equal(b.api.state.lib[CS_DRAGONS].pages,0);assert.equal(b.api.state.lib[CS_DRAGONS].pagesManual,true);
});
test('edition selector opens and adds English separately from the Czech edition',async()=>{
  const a=boot();await flush();a.query('Rod Draků');await flush();a.click('open',{'data-id':CS_DRAGONS});await flush();
  assert.match(a.main(),/data-action="edition"/);
  a.field('change','edition','',EN_DRAGONS);await flush();assert.equal(a.api.state.detail.id,EN_DRAGONS);assert.equal(a.api.state.detail.language,'en');
  a.click('status',{'data-id':EN_DRAGONS,'data-status':'want'});a.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});
  assert.equal(Object.keys(a.api.state.lib).length,2);assert.equal(a.api.state.lib[EN_DRAGONS].book.pages,448);assert.equal(a.api.state.lib[CS_DRAGONS].book.pages,400);
});
test('removal and undo preserve progress and source aliases do not add another same edition',async()=>{
  const a=boot();await flush();a.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});a.field('input','page',CS_DRAGONS,'42');
  a.api.state.results=[{...a.api.state.lib[CS_DRAGONS].book,id:'g:other'}];a.click('status',{'data-id':'g:other','data-status':'want'});assert.equal(Object.keys(a.api.state.lib).length,1);
  a.click('remove',{'data-id':CS_DRAGONS});assert.equal(Object.keys(a.api.state.lib).length,0);a.click('undo');assert.equal(a.api.state.lib[CS_DRAGONS].page,42);
});
test('corrupted storage is retained and storage quota errors are visible',async()=>{
  const a=boot({storage:{mzr_lib_v2:'[broken'}});await flush();a.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});
  assert.equal(a.store.mzr_lib_v2,'[broken');assert.match(a.main(),/Původní data zůstala zachována/);
  const b=boot({failWrites:true});await flush();b.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});
  assert.match(b.main(),/Změny se nepodařilo uložit/);assert.match(b.api.state.toast,/jen v paměti/);
});
test('shelf and overview show the same saved edition and preserve reading progress',async()=>{
  const a=boot();await flush();a.click('status',{'data-id':CS_DRAGONS,'data-status':'reading'});a.field('input','page',CS_DRAGONS,42);a.click('library');
  const before=a.store.mzr_lib_v2;
  assert.match(a.main(),/shelf-spine/);assert.match(a.main(),/42 \/ 400 stran/);assert.doesNotMatch(a.main(),/Další možnosti uložení|backupImport/);
  a.click('libraryView',{'data-mode':'overview'});assert.match(a.main(),/data-action="slider"/);
  a.click('libraryView',{'data-mode':'shelf'});assert.match(a.main(),/shelf-spine/);assert.equal(a.store.mzr_lib_v2,before);
});
test('transfer hash displays a preview without automatic import, then merges only after a click',async()=>{
  const incoming={x:{book:book('x','Přenesená kniha',2025,{language:'en'}),status:'reading',pages:200,page:36,pagesManual:true}};
  const transfer=await LibraryTools.transferLink(incoming);
  const a=boot({hash:new URL(transfer.url).hash});await flush();await waitUntil(()=>a.doc.getElementById('readerDialog').open);
  assert.equal(Object.keys(a.api.state.lib).length,0);assert.equal(a.store.mzr_lib_v2,undefined);assert.match(a.dialog(),/Přenesená kniha/);
  a.click('applyTransfer');assert.equal(a.api.state.lib.x.page,36);assert.equal(a.api.state.lib.x.pagesManual,true);assert.equal(a.api.state.view,'library');
});
test('transfer conflicts keep current progress by default and permit explicit replacement',async()=>{
  const original={x:{book:book('x','Kniha',2025,{language:'en'}),status:'reading',page:80,pages:200}};
  const transfer=await LibraryTools.transferLink({x:{...original.x,page:20}});
  const a=boot({storage:{mzr_lib_v2:JSON.stringify(original)},hash:new URL(transfer.url).hash});await flush();await waitUntil(()=>a.doc.getElementById('readerDialog').open);a.click('applyTransfer');assert.equal(a.api.state.lib.x.page,80);
  a.setHash(new URL(transfer.url).hash);await flush();await waitUntil(()=>a.doc.getElementById('readerDialog').open);a.doc.getElementById('transferConflict').value='incoming';a.click('applyTransfer');assert.equal(a.api.state.lib.x.page,20);
});
test('malformed book or library fragments cannot overwrite existing saved books',async()=>{
  const stored=JSON.stringify({x:{book:book('x','Moje kniha',2025),status:'want',page:0,pages:0}});
  for(const hash of ['#library=gYWJj','#book=not-valid!']){
    const a=boot({storage:{mzr_lib_v2:stored},hash});await flush();await waitUntil(()=>a.doc.getElementById('readerDialog').open);assert.equal(a.store.mzr_lib_v2,stored);assert.equal(Object.keys(a.api.state.lib).length,1);assert.match(a.dialog(),/Odkaz nejde načíst/);
  }
});
test('a book deep link opens its specific language edition without adding it to the library',async()=>{
  const b=CatalogueData.books.find(b=>b.id===EN_DRAGONS),url=LibraryTools.bookLink(b);
  const a=boot({hash:new URL(url).hash});await flush();assert.equal(a.api.state.view,'detail');assert.equal(a.api.state.detail.language,'en');assert.equal(Object.keys(a.api.state.lib).length,0);
});
test('detail back returns to library and export actions are available',async()=>{
  const a=boot();await flush();a.click('status',{'data-id':CS_DRAGONS,'data-status':'want'});a.click('library');a.click('open',{'data-id':CS_DRAGONS});await flush();a.click('back');
  assert.equal(a.api.state.view,'library');assert.match(a.main(),/Přenést knihovnu/);assert.match(a.main(),/Stáhnout tabulku Excel/);
  assert.doesNotMatch(a.main(),/Další možnosti uložení|backupImport/);a.click('excel');assert.equal(a.downloads.at(-1).download,'za-obalkou-knihovna.xlsx');
});
test('year and language select events filter the edition and reset restores all available versions',async()=>{
  const a=boot();await flush();a.query('Rod draků');await flush();a.change('year','2020');await flush();a.change('language','en');await flush();
  assert.equal(a.api.state.results.length,1);assert.equal(a.api.state.results[0].id,EN_DRAGONS);
  a.change('year','2026');await flush();assert.equal(a.api.state.results.length,0);assert.match(a.main(),/neodpovídají filtrům/);
  a.click('resetFilters');await flush();assert.equal(a.api.state.results[0].title,'Rod draků');assert.equal(a.api.state.results.filter(b=>Core.sameWork(b,a.api.state.results[0])).length,1);assert.equal(a.api.state.results[0].editions.length,2);
});
test('pagination includes final records without duplicating cards',async()=>{
  const a=boot();await flush();a.api.state.view='search';a.api.state.results=Array.from({length:81},(_,i)=>book('x'+i,'Kniha '+i,2025));a.api.renderMain();
  assert.equal((a.main().match(/class="book-card"/g)||[]).length,24);a.click('more');a.click('more');a.click('more');
  assert.equal(a.api.state.shown,81);assert.equal((a.main().match(/class="book-card"/g)||[]).length,81);assert.doesNotMatch(a.main(),/Načíst další/);
});
test('untrusted catalogue text remains escaped in visible content and attributes',async()=>{
  const a=boot();await flush();assert.equal(a.api.attr('" onclick="x &'),'&quot; onclick=&quot;x &amp;');
  a.api.state.featured=[Core.snapshot(book('x','<script>x</script>',2025,{link:'javascript:alert(1)'}))];a.api.state.featuredLoading=false;a.api.renderMain();
  assert(a.main().includes('&lt;script&gt;'));assert(!a.main().includes('<script>x'));
});
test('Rival Darling has browseable romance and hockey tags, and combination search keeps AND behavior',async()=>{
  const a=boot();await flush();a.query('Rival Darling');await flush();
  const rival=a.api.state.results[0];assert(rival.tags.includes('romantika'));assert(rival.tags.includes('hokej'));
  assert(rival.tags.filter(t=>t.includes('young adult')).length<=1);
  const books=a.api.localSearch('',['dragons','romance']);assert(books.length>0);assert(books.every(b=>Core.matchesTags(b,['dragons','romance'])));
});
test('young-adult mode excludes adult romantasy seeds',async()=>{
  const a=boot();await flush();a.click('discover',{'data-mode':'ya'});await flush();
  assert(a.api.state.featured.length>0);assert(a.api.state.featured.every(b=>Core.matchesTags(b,['young adult'])));assert(!a.api.state.featured.some(b=>b.title==='Čtvrté křídlo'));
});

test('typed hashtag aliases run the same search, repeated Enter preserves filters, and invalid fragments are explained',async()=>{
 const a=boot();await flush();a.query('#youngadult #fantasy');await flush();
 assert.deepEqual(Array.from(a.api.state.activeTags,t=>t.term),['young adult','fantasy']);
 assert(a.api.state.results.length>0);assert(a.api.state.results.every(b=>Core.matchesTags(b,['young adult','fantasy'])));
 const ids=Array.from(a.api.state.results,b=>b.id);a.events.keydown({target:a.doc.getElementById('hsearch'),key:'Enter'});await flush();assert.deepEqual(Array.from(a.api.state.results,b=>b.id),ids);
 a.query('#young adult #fantasy');await flush();assert.deepEqual(Array.from(a.api.state.results,b=>b.id),ids);
 a.query('#young #adult');await flush();assert.equal(a.api.state.results.length,0);assert.match(a.main(),/Neznámé štítky/);
 a.query('Rod draků');await flush();assert.equal(a.api.state.results[0].title,'Rod draků');assert.equal(a.api.state.unknownTags.length,0);
});
test('typed author plus hashtags respects both the query and every tag',async()=>{
 const a=boot();await flush();a.query('Sarah J. Maas #romantasy');await flush();
 assert(a.api.state.results.length>0);assert(a.api.state.results.every(b=>Core.relevance(b,'Sarah J. Maas')>0&&Core.matchesTags(b,['romantasy'])));
});

test('actual spine artwork wins for the edition and falls back to a safe cover list',async()=>{
 const a=boot();await flush();const b={id:'photo',title:'Kniha',language:'cs',isbn:'9788025359037',spineUrl:'https://example.org/spine.jpg',coverUrl:'https://example.org/cover.jpg'};
 const image=a.api.spineImageHTML(b);assert.match(image,/src="https:\/\/example.org\/spine.jpg"/);assert.match(image,/data-spine-original/);assert.match(image,/https:\/\/example.org\/cover.jpg/);
 assert.doesNotMatch(a.api.spineImageHTML({...b,spineUrl:'javascript:alert(1)'}),/data-spine-original|javascript:/);
 const sanitized=Core.snapshot(b);assert.equal(sanitized.spineUrl,b.spineUrl);
 const transferred=await LibraryTools.transferLink({photo:{book:b,status:'want',page:0,pages:200}});const restored=await LibraryTools.parseLibraryFragment(new URL(transferred.url).hash);assert.equal(restored.photo.book.spineUrl,b.spineUrl);
});
