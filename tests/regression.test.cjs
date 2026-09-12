const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../book-core.js');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const book = (id,title,year,extra={}) => ({id,title,year,author:'Autor',tags:[],...extra});
const flush = async () => {for(let i=0;i<40;i++) await Promise.resolve();};
// Minimal DOM adapter for logic/HTML checks. This does not replace visual browser QA.
function boot({fetcher=()=>Promise.resolve({ok:false,status:503,json:async()=>({})}), storage={}, failWrites=false}={}){
  const elements = new Map(); const events={}; const timers=new Map();let timerId=0;
  const doc={activeElement:null,body:{classList:{toggle(){},contains(){return false;}}},
    getElementById(id){if(!elements.has(id))elements.set(id,{id,innerHTML:'',value:'',focus(){doc.activeElement=this;},setSelectionRange(){}});return elements.get(id);},
    createElement(){return {set innerHTML(x){this.value=x;},click(){}};},
    querySelectorAll(){return [];},addEventListener(name,fn){events[name]=fn;}};
  const store={...storage};
  const localStorage={getItem:k=>store[k]??null,setItem(k,v){if(failWrites)throw new Error('QuotaExceededError');store[k]=v;},removeItem(k){delete store[k];}};
  const window={BookCore:Core,MZR_CONFIG:{},scrollTo(){},matchMedia:()=>({matches:false}),addEventListener(){},console};
  const context=vm.createContext({window,document:doc,localStorage,fetch:fetcher,AbortController,URL,Blob,Map,Set,Date,CSS:{escape:x=>x},console,
    setTimeout(fn,ms){let id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
  // Expose lexical bindings only in this test copy, never in the delivered page.
  const instrument=script.replace(/\}\)\(\);\s*$/,`window.testAPI={state,runSearch,onQuery,applyQuery,goHome,goLibrary,openBook,setStatus,setPage,setTotal,removeFromLib,undoRemove,importLibrary,refreshFeatured,localSearch,searchBooks,searchCombo,loadFeatured,buildRatings,fetchDetail,loadMore,renderMain,mapOL,mapGoogle,mapApple,attr,EMBEDDED};})();`);
  vm.runInContext(instrument,context,{filename:'index.html'});
  return {api:window.testAPI,store,timers,events,doc,main:()=>doc.getElementById('main').innerHTML,
    click(action,data={}){events.click({target:{closest:()=>({getAttribute:k=>k==='data-action'?action:(data[k]??null)})}});},
    change(filter,value){events.change({target:{id:'',value,dataset:{filter},getAttribute:()=>null}});}};
}
function response(data){return {ok:true,json:async()=>data};}
function mockBooks(q){return response({totalItems:2,items:[{id:q,volumeInfo:{title:q,authors:['Autor'],publishedDate:'2025',categories:['Young Adult Fiction'],language:'cs'}},{id:q+'2',volumeInfo:{title:q+' pokračování',authors:['Autor'],publishedDate:'2026'}}]});}
function providerMock(url){
  const u=new URL(url);
  if(u.hostname==='www.googleapis.com')return Promise.resolve(mockBooks(u.searchParams.get('q')));
  if(u.hostname==='openlibrary.org')return Promise.resolve(response({docs:[]}));
  return Promise.resolve(response({results:[]}));
}

test('diacritics, punctuation and Unicode remain searchable',()=>{
 assert.equal(Core.norm(' ČTVRTÉ křídlo! '),'ctvrte kridlo');
 assert.notEqual(Core.key(book('1','日本',2020)),Core.key(book('2','한국',2020)));
 assert.equal(Core.relevance(book('1','Čtvrté křídlo',2023),'ctvrte kridlo'),6);
});
test('exact classic title beats a recent partial match',()=>{
 const old=book('1','Hobit',1937),recent=book('2','Hobit: průvodce',2025,{tags:['young adult']});
 assert.equal(Core.rank([recent,old],{query:'hobit',now:2026})[0].id,'1');
});
test('recent unrated books beat old highly rated books for discovery',()=>{
 const old=book('1','Staré',1950,{olRating:4.9,olCount:10000}),recent=book('2','Nové',2025,{tags:['young adult']});
 assert.equal(Core.rank([old,recent],{now:2026})[0].id,'2');
});
test('original year prevents a reprinted classic being a new release',()=>{
 const reprint=book('1','Klasika',2026,{firstPublishYear:1937});
 assert.equal(Core.rank([reprint],{era:'recent',now:2026}).length,0);
 assert.equal(Core.rank([book('2','Neznámý rok',null)],{era:'modern',now:2026}).length,0);
});
test('confirmed Czech language only, ISBN and diacritic-safe deduplication',()=>{
 const a=book('a','Křídlo',2024,{isbn:'9781234567890',language:'cs',gRating:4.1,gCount:9});
 const b=book('b','Kridlo',2024,{olRating:4.4,olCount:100,firstPublishYear:2023});
 const merged=Core.merge([[a],[b],null]);
 assert.equal(merged.length,1);assert.equal(merged[0].olRating,4.4);assert.equal(merged[0].firstPublishYear,2023);
 assert.equal(Core.rank([a,book('x','Unknown',2025)],{language:'cs'}).length,1);
 assert.equal(Core.merge([[book('a','A',2024,{isbn:'9781234567890'})],[book('b','B',2024,{isbn:'9781234567890'})]]).length,1);
});
test('ratings reject zero, strings, NaN and impossible values',()=>{
 for(const x of [0,-1,6,'4.5',NaN,Infinity])assert.equal(Core.validRating(x),false);
 assert.equal(Core.rating({gRating:4.2,gCount:4}).source,'Google Books');
 const a=boot();assert.equal(a.api.buildRatings({gRating:4.2,gCount:9,bmRating:5,isbnRating:5,olEditRating:5}).length,1);
});
test('snapshot keeps ISBN and rejects unsafe URLs and invalid numeric data',()=>{
 const b=Core.snapshot(book('x','X','2025',{pages:Infinity,link:'javascript:alert(1)',isbn:'978-1234567890',coverUrl:'https://example.org/a.jpg'}));
 assert.equal(b.link,'');assert.equal(b.pages,0);assert.equal(b.isbn,'9781234567890');assert.equal(b.year,2025);
});
test('invalid imports and prototype keys are rejected; valid progress is bounded',()=>{
 for(const input of [null,[],{a:{}},JSON.parse('{"__proto__":{}}')])assert.throws(()=>Core.validateLibrary(input));
 const good=Core.validateLibrary({x:{book:book('x','X',2025),status:'reading',pages:100,page:900}});
 assert.equal(good.x.page,100);assert.equal(Object.getPrototypeOf(good),null);
});
test('startup still shows modern recommendations when all APIs fail',async()=>{
 const a=boot();await flush();assert.equal(a.api.state.featuredLoading,false);assert.equal(a.api.state.offlineFeatured,true);
 assert(a.api.state.featured.some(b=>b.title==='Úsvit sklizně'));assert(a.api.state.featured.every(b=>b.year>=2016));
 assert.match(a.main(),/Online katalogy se nepodařilo načíst/);assert.doesNotMatch(a.main(),/BookMoth/);
});
test('offline search finds Czech titles without accents and English aliases',async()=>{
 const a=boot();await flush();a.api.state.view='search';a.api.state.query='ctvrte kridlo';a.api.runSearch();await flush();
 assert.equal(a.api.state.results[0].title,'Čtvrté křídlo');assert.equal(a.api.state.offlineSearch,true);
 assert.equal(a.api.localSearch('Fourth Wing',[])[0].title,'Čtvrté křídlo');
});
test('online results include Google after an Apple outage, with partial status',async()=>{
 const a=boot({fetcher:url=>url.includes('itunes')?Promise.reject(new Error('offline')):providerMock(url)});await flush();
 a.api.state.view='search';a.api.state.query='Dračí akademie';a.api.runSearch();await flush();
 assert.equal(a.api.state.results[0].title,'Dračí akademie');assert.equal(a.api.state.offlineSearch,false);assert.equal(a.api.state.searchFailed,1);
 assert.match(a.main(),/Část katalogů/);
});
test('successful empty API responses are not treated as offline',async()=>{
 const a=boot({fetcher:url=>Promise.resolve(response(url.includes('googleapis')?{totalItems:0}:url.includes('openlibrary')?{docs:[]}:{results:[]}))});await flush();
 a.api.state.view='search';a.api.state.query='zzzz-neexistuje';a.api.runSearch();await flush();
 assert.equal(a.api.state.results.length,0);assert.equal(a.api.state.offlineSearch,false);assert.match(a.main(),/Nic jsme nenašli/);
});
test('malformed provider payload degrades to partial failure, not a crashed home',async()=>{
 const a=boot({fetcher:url=>Promise.resolve(response(url.includes('itunes')?{results:[{trackId:1,trackName:'x',genres:9}]}:url.includes('googleapis')?{items:[null]}:{docs:[]}))});await flush();
 assert.equal(a.api.state.featuredLoading,false);assert(a.main().includes('Úsvit sklizně'));
});
test('a pending search cannot replace results while a newer query is debouncing',async()=>{
 const pending=[];
 const a=boot({fetcher:url=>new Promise(resolve=>pending.push({url,resolve}))});
 a.api.state.view='search';a.api.state.query='Old';a.api.runSearch();
 a.api.onQuery('New');
 pending.forEach(p=>p.resolve(response(p.url.includes('googleapis')?{items:[{id:'old',volumeInfo:{title:'Old'}}]}:p.url.includes('openlibrary')?{docs:[]}:{results:[]})));
 await flush();assert.equal(a.api.state.query,'New');assert.equal(a.api.state.results.length,0);
});
test('going home cancels the pending debounce and search UI',async()=>{
 const a=boot();await flush();a.api.onQuery('Rozpracováno');a.api.goHome();
 assert.equal(a.api.state.view,'home');assert.equal([...a.timers.values()].filter(t=>t.ms===350).length,0);
});
test('library status, page boundaries, reload, duplicate source and undo',async()=>{
 const a=boot();await flush();a.api.setStatus('e:rivals','reading');a.api.setTotal('e:rivals','368');a.api.setPage('e:rivals','9999');
 assert.equal(a.api.state.lib['e:rivals'].page,368);a.api.setPage('e:rivals','42');
 const b=boot({storage:a.store});await flush();assert.equal(b.api.state.lib['e:rivals'].page,42);
 b.api.state.results=[{...b.api.state.lib['e:rivals'].book,id:'g:other'}];b.api.setStatus('g:other','want');
 assert.equal(Object.keys(b.api.state.lib).length,1);
 b.api.removeFromLib('e:rivals');assert.equal(Object.keys(b.api.state.lib).length,0);b.api.undoRemove();assert.equal(b.api.state.lib['e:rivals'].page,42);
});
test('zero page total is not silently replaced by provider metadata',async()=>{
 const a=boot();await flush();a.api.setStatus('e:hobit','reading');a.api.setTotal('e:hobit','0');a.api.setStatus('e:hobit','want');
 assert.equal(a.api.state.lib['e:hobit'].pages,0);
});
test('corrupted storage is preserved and does not break rendering',async()=>{
 const a=boot({storage:{mzr_lib_v2:'[broken'}});await flush();a.api.setStatus('e:rivals','reading');
 assert.equal(a.store.mzr_lib_v2,'[broken');assert.match(a.main(),/Původní data zůstala zachována/);
});
test('storage quota failure is visible and never reported as persisted',async()=>{
 const a=boot({failWrites:true});await flush();a.api.setStatus('e:rivals','reading');
 assert.match(a.main(),/Změny se nepodařilo uložit/);assert.match(a.api.state.toast,/jen v paměti/);
});
test('import adds missing books while preserving existing reading progress',async()=>{
 const a=boot();await flush();a.api.setStatus('e:rivals','reading');a.api.setPage('e:rivals',42);
 const original=a.api.state.lib['e:rivals'];
 a.api.importLibrary({size:500,text:async()=>JSON.stringify({format:'meziradky',version:1,library:{'e:rivals':{...original,page:1},x:{book:book('x','Import',2025),status:'want',pages:200,page:0}}})});await flush();
 assert.equal(a.api.state.lib['e:rivals'].page,42);assert.equal(a.api.state.lib.x.book.title,'Import');
 const before=a.store.mzr_lib_v2;a.api.importLibrary({size:1,text:async()=>'{oops'});await flush();assert.equal(a.store.mzr_lib_v2,before);
});
test('detail back button returns to library, not stale search',async()=>{
 const a=boot();await flush();a.api.setStatus('e:rivals','want');a.api.state.query='starý dotaz';a.api.goLibrary();a.api.openBook('e:rivals');await flush();a.click('back');
 assert.equal(a.api.state.view,'library');assert.match(a.main(),/Stáhnout zálohu/);
});
test('filters render and empty filtered results can be reset',async()=>{
 const a=boot();await flush();a.api.state.view='search';a.api.state.query='Hobit';a.api.runSearch();await flush();
 a.change('era','recent');assert.equal(a.api.state.results.length,0);assert.match(a.main(),/neodpovídají filtrům/);
 a.click('resetFilters');assert(a.api.state.results.some(b=>b.title==='Hobit'));
});
test('pagination loads all available candidates without dropping final records',async()=>{
 const a=boot();await flush();a.api.state.view='search';a.api.state.results=Array.from({length:81},(_,i)=>book('x'+i,'Kniha '+i,2025));a.api.renderMain();
 assert.equal((a.main().match(/class="book-card"/g)||[]).length,24);a.click('more');a.click('more');a.click('more');
 assert.equal(a.api.state.shown,81);assert.equal((a.main().match(/class="book-card"/g)||[]).length,81);assert.doesNotMatch(a.main(),/Načíst další/);
});
test('catalogue text escapes HTML attribute syntax and no fake ratings remain',()=>{
 const a=boot();assert.equal(a.api.attr('" onclick="x &'),'&quot; onclick=&quot;x &amp;');
 assert(a.api.EMBEDDED.every(b=>!b.ratings));
 const unsafe=Core.snapshot(book('x','<script>x</script>',2025,{link:'javascript:alert(1)'}));
 a.api.state.featured=[unsafe];a.api.state.featuredLoading=false;a.api.renderMain();assert(a.main().includes('&lt;script&gt;'));assert(!a.main().includes('<script>x'));
});
test('multi-mood search uses explicit AND with subjects',async()=>{
 const seen=[];const a=boot({fetcher:url=>{seen.push(url);return providerMock(url);}});await flush();await a.api.searchCombo(['dragons','romance']);
 const url=seen.find(u=>u.includes('openlibrary')&&decodeURIComponent(u).includes('subject:"dragons"'));
 assert(new URL(url).searchParams.get('q').includes('subject:"dragons" AND subject:"romance"'));
 const books=a.api.localSearch('', ['dragons','romance']);assert(books.length>0);assert(books.every(b=>b.tags.includes('drak')&&b.tags.includes('romantika')));
});
test('young adult recommendations exclude adult romantasy seeds',async()=>{
 const a=boot();await flush();a.click('discover',{'data-mode':'ya'});await flush();
 assert(a.api.state.featured.length>0);assert(a.api.state.featured.every(b=>b.tags.includes('young adult')));assert(!a.api.state.featured.some(b=>b.title==='Čtvrté křídlo'));
});
