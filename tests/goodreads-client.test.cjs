const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Goodreads=require('../goodreads-client.js');

const epoch=Date.parse('2026-09-13T03:00:00Z');
const row=(id='61431922',extra={})=>({rating:4.56,count:3955143,title:'Fourth Wing',url:'https://www.goodreads.com/book/show/'+id,...extra});
const book=(id='61431922',extra={})=>({id:'edition:'+id,grId:id,title:'Čtvrté křídlo',author:'Rebecca Yarros',...extra});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function storage(initial={}){
  const values=new Map(Object.entries(initial));
  return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k),key:i=>Array.from(values.keys())[i]||null,get length(){return values.size;}};
}
function cached(value){return storage({'za_goodreads_v1:61431922':JSON.stringify(value)});}

test('live widget average preserves edition metadata and is immediately cached',async()=>{
  let calls=0;const client=Goodreads.create({now:()=>epoch,requestGap:0,transport:async id=>{calls++;return row(id);}});
  const original=book('61431922',{editions:[{id:'other'}],pages:536,language:'cs',olRating:4.3,olCount:38});
  const rated=await client.rating(original);
  assert.equal(rated.grRating,4.56);assert.equal(rated.grCount,3955143);assert.equal(rated.grCheckedAt,new Date(epoch).toISOString());
  assert.equal(rated.grSnapshot,false);assert.equal(rated.grScope,'work');assert.equal(rated.pages,536);assert.equal(rated.language,'cs');assert.equal(rated.editions,original.editions);
  assert.equal(client.getCached(original).grCount,3955143);await client.rating(original);assert.equal(calls,1);assert.equal(original.grRating,undefined);
});

test('same Goodreads ID coalesces concurrent requests without sharing edition objects',async()=>{
  let calls=0,finish;const client=Goodreads.create({requestGap:0,transport:id=>{calls++;return new Promise(resolve=>finish=()=>resolve(row(id)));}});
  const a=client.rating(book('61431922',{language:'cs'})),b=client.rating(book('61431922',{language:'en',pages:528}));
  await tick();assert.equal(calls,1);finish();const [cs,en]=await Promise.all([a,b]);
  assert.equal(cs.language,'cs');assert.equal(en.language,'en');assert.equal(en.pages,528);assert.notEqual(cs,en);
});

test('a canonical Goodreads source link works without inventing an edition ID',async()=>{
  let received;const client=Goodreads.create({requestGap:0,transport:async id=>{received=id;return row(id);}});
  const original={title:'Fourth Wing',grUrl:'https://www.goodreads.com/book/show/61431922-fourth-wing?from_search=true'};
  const result=await client.rating(original);assert.equal(received,'61431922');assert.equal(result.grRating,4.56);assert.equal(result.grId,undefined);
});

test('invalid identifiers and hostile URLs never load a widget',async()=>{
  let calls=0;const client=Goodreads.create({transport:async()=>{calls++;return row();}});
  for(const value of [{grId:'123<script>'},{grId:'0'},{grId:-1},{grUrl:'https://goodreads.com.evil.test/book/show/61431922'},{grUrl:'https://goodreads.com@evil.test/book/show/61431922'},{grUrl:'http://www.goodreads.com/book/show/61431922'},{grUrl:'https://www.goodreads.com/review/show/61431922'},{grUrl:'https://www.goodreads.com:444/book/show/61431922'}])assert.equal(await client.rating(value),value);
  assert.equal(calls,0);
});

test('stale cache appears synchronously and successful revalidation replaces it',async()=>{
  let finish;const old=row('61431922',{count:100,checkedAt:new Date(epoch-7*3600000).toISOString()});
  const client=Goodreads.create({now:()=>epoch,requestGap:0,storage:cached(old),transport:id=>new Promise(resolve=>finish=()=>resolve(row(id)))});
  const saved=client.getCached(book());assert.equal(saved.grCount,100);assert.equal(saved.grSnapshot,true);
  const promise=client.rating(book());await tick();assert.equal(client.getCached(book()).grCount,100);finish();
  const updated=await promise;assert.equal(updated.grCount,3955143);assert.equal(updated.grSnapshot,false);
});

test('offline lookup retains last good score and negative cache prevents repeated failed calls',async()=>{
  let clock=epoch,calls=0;const client=Goodreads.create({now:()=>clock,requestGap:0,negativeTTL:1000,storage:cached(row('61431922',{count:500,checkedAt:new Date(epoch-7*3600000).toISOString()})),transport:async()=>{calls++;throw new Error('offline');}});
  assert.equal((await client.rating(book())).grCount,500);assert.equal((await client.rating(book())).grCount,500);assert.equal(calls,1);
  clock+=1001;await client.rating(book());assert.equal(calls,2);
});

test('fresh rating carried by the book survives an older persistent cache',async()=>{
  const client=Goodreads.create({now:()=>epoch,storage:cached(row('61431922',{checkedAt:new Date(epoch-10000).toISOString()}))});
  const original=book('61431922',{grRating:4.57,grCount:4000000,grUrl:row().url,grCheckedAt:new Date(epoch).toISOString(),grScope:'work'});
  assert.equal(client.getCached(original),original);assert.equal(await client.rating(original),original);
});

test('old live ratings carried by a library transfer are labelled saved during an outage',async()=>{
  const client=Goodreads.create({now:()=>epoch,requestGap:0,transport:async()=>{throw new Error('offline');}});
  const original=book('61431922',{grRating:4.56,grCount:3808364,grUrl:row().url,grCheckedAt:new Date(epoch-7*3600000).toISOString(),grSnapshot:false});
  assert.equal(client.getCached(original).grSnapshot,true);const retained=await client.rating(original);
  assert.equal(retained.grSnapshot,true);assert.equal(retained.grRating,4.56);assert.equal(retained.grCount,3808364);assert.equal(original.grSnapshot,false);
});

test('corrupt, mismatched and future-dated stored values cannot masquerade as live ratings',async()=>{
  for(const saved of [row('999',{checkedAt:new Date(epoch).toISOString()}),row('61431922',{rating:7,checkedAt:new Date(epoch).toISOString()}),row('61431922',{count:1.2,checkedAt:new Date(epoch).toISOString()}),row('61431922',{checkedAt:new Date(epoch+2*3600000).toISOString()}),row('61431922',{checkedAt:'invalid'})]){
    let calls=0;const client=Goodreads.create({now:()=>epoch,storage:cached(saved),requestGap:0,transport:async id=>{calls++;return row(id);}});
    assert.equal(client.getCached(book()).grRating,undefined);assert.equal((await client.rating(book())).grCount,3955143);assert.equal(calls,1);
  }
});

test('wrong ID, impossible averages and review-like counts preserve fallback rating',async()=>{
  for(const invalid of [row('999'),row('61431922',{rating:0}),row('61431922',{rating:5.01}),row('61431922',{rating:'4.56'}),row('61431922',{count:-1}),row('61431922',{count:0}),row('61431922',{count:1.5}),row('61431922',{count:1000000001})]){
    const client=Goodreads.create({requestGap:0,transport:async()=>invalid});const original=book('61431922',{olRating:4.2,olCount:38});
    assert.equal(await client.rating(original),original);assert.equal(client.getCached(original),original);
  }
});

test('work-level candidates require an exact normalized title or known translation alias',async()=>{
  for(const [title,aliases,actual] of [
    ['Čtvrté křídlo',['Fourth Wing'],'Fourth Wing'],
    ['čtvrté křídlo',[],'CTVRTÉ KRIDLO'],
    ['Fourth Wing',[],'Fourth Wing (The Empyrean, #1)'],
    ['Fourth Wing',[],'Fourth Wing (The Empyrean Book 1)'],
    ['Sci-fi: Nová éra',[],'SCI FI — nova era']
  ]){
    const client=Goodreads.create({requestGap:0,transport:async id=>row(id,{title:actual})});
    const candidate=book('61431922',{title,aliases,grMatchTitle:true});assert.equal((await client.rating(candidate)).grRating,4.56);
  }
});

test('work-level candidates reject coloring books, subtitles and unverified translations',async()=>{
  for(const actual of ['Fourth Wing Coloring Book','Fourth Wing: A Summary','Fourth Wing (Coloring Book)','Fourth Wing (Special Edition)','Fourth Wing Workbook','Čtvrté křídlo','','Iron Flame']){
    const client=Goodreads.create({requestGap:0,transport:async id=>row(id,{title:actual})});
    const candidate=book('61431922',{title:'Fourth Wing',grMatchTitle:true});assert.equal(await client.rating(candidate),candidate);assert.equal(client.getCached(candidate),candidate);
  }
});

test('cached work-level candidates also validate title, including missing cached titles',async()=>{
  for(const title of ['Fourth Wing: A Summary','',undefined]){
    const old=row('61431922',{title,checkedAt:new Date(epoch).toISOString()}),client=Goodreads.create({now:()=>epoch,storage:cached(old),requestGap:0});
    const candidate=book('61431922',{title:'Fourth Wing',grMatchTitle:true});assert.equal(client.getCached(candidate),candidate);assert.equal(await client.rating(candidate),candidate);
  }
  const client=Goodreads.create({now:()=>epoch,storage:cached(row('61431922',{title:'Fourth Wing (The Empyrean, #1)',checkedAt:new Date(epoch).toISOString()}))});
  const candidate=book('61431922',{title:'Čtvrté křídlo',aliases:['Fourth Wing'],grMatchTitle:true});assert.equal(client.getCached(candidate).grCount,3955143);
});

test('coalesced work candidates validate each caller independently',async()=>{
  let calls=0;const client=Goodreads.create({requestGap:0,transport:async id=>{calls++;return row(id);}});
  const wrong=book('61431922',{title:'Iron Flame',grMatchTitle:true}),correct=book('61431922',{title:'Fourth Wing',grMatchTitle:true});
  const [rejected,accepted]=await Promise.all([client.rating(wrong),client.rating(correct)]);assert.equal(rejected,wrong);assert.equal(accepted.grRating,4.56);assert.equal(calls,1);
});

test('an exact edition ID remains usable when the widget names another translation',async()=>{
  const client=Goodreads.create({requestGap:0,transport:async id=>row(id,{title:'Fourth Wing'})});
  assert.equal((await client.rating(book('61431922',{title:'Čtvrté křídlo'}))).grRating,4.56);
});

test('timeout bounds a stalled widget and ignores a late response',async()=>{
  let finish,signal;const client=Goodreads.create({timeout:20,requestGap:0,transport:(id,context)=>{signal=context.signal;return new Promise(resolve=>finish=()=>resolve(row(id)));}});
  const original=book();assert.equal(await client.rating(original),original);assert.equal(signal.aborted,true);
  finish();await tick();assert.equal(client.getCached(original),original);
});

test('storage denial does not prevent in-memory caching',async()=>{
  let calls=0;const client=Goodreads.create({storage:{getItem(){throw new Error('denied');},setItem(){throw new Error('full');}},requestGap:0,transport:async id=>{calls++;return row(id);}});
  await client.rating(book());assert.equal(client.getCached(book()).grRating,4.56);await client.rating(book());assert.equal(calls,1);
});

test('detail requests jump ahead of queued background cards and concurrency stays at two',async()=>{
  const started=[],finish=new Map();let active=0,maximum=0;
  const client=Goodreads.create({requestGap:0,timeout:1000,transport:id=>{started.push(id);active++;maximum=Math.max(maximum,active);return new Promise(resolve=>finish.set(id,()=>{active--;resolve(row(id));}));}});
  const promises=['1','2','3','4'].map(id=>client.rating(book(id),{priority:false}));await tick();assert.deepEqual(started,['1','2']);
  const detail=client.rating(book('4'));finish.get('1')();await tick();assert.deepEqual(started,['1','2','4']);
  finish.get('2')();await tick();assert.deepEqual(started,['1','2','4','3']);finish.get('4')();finish.get('3')();
  await Promise.all(promises.concat(detail));assert.equal(maximum,2);
});

test('a full background queue cannot suppress the next detail through negative caching',async()=>{
  const started=[],finish=new Map();
  const client=Goodreads.create({requestGap:0,timeout:1000,transport:id=>{started.push(id);return new Promise(resolve=>finish.set(id,()=>{finish.delete(id);resolve(row(id));}));}});
  const background=Array.from({length:14},(_,i)=>client.rating(book(String(i+1)),{priority:false}));await tick();assert.deepEqual(started,['1','2']);
  const detail=client.rating(book('15'));assert.equal((await background[13]).grRating,undefined);
  finish.get('1')();await tick();assert.deepEqual(started,['1','2','15']);
  // The displaced card remains eligible when explicitly opened immediately.
  const displacedDetail=client.rating(book('14'));finish.get('2')();await tick();assert.deepEqual(started,['1','2','15','14']);
  while(finish.size){for(const resolve of Array.from(finish.values()))resolve();await tick();}
  await Promise.all(background.concat(detail,displacedDetail));assert.equal((await displacedDetail).grRating,4.56);
});

function fakeBrowser(){
  const events=new Map(),frames=[];
  const host={location:new URL('https://zaobalkou.github.io/?release=test'),crypto:{getRandomValues:a=>a.fill(17)},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name,fn)=>{if(events.get(name)===fn)events.delete(name);}};
  const doc={body:{appendChild:frame=>frames.push(frame)},createElement:()=>({attributes:{},contentWindow:{},setAttribute(name,value){this.attributes[name]=value;},addEventListener(){},remove(){this.removed=true;}})};
  return {host,doc,frames,events,send(data,source,origin='null'){const fn=events.get('message');if(fn)fn({data,source,origin});}};
}

test('frame sandbox forbids parent access and messages require exact source, nonce, origin and ID',async()=>{
  const env=fakeBrowser(),client=Goodreads.create({window:env.host,document:env.doc,requestGap:0,timeout:200});
  const promise=client.rating(book());await tick();const frame=env.frames[0],query=new URL(frame.src).searchParams;
  assert.equal(frame.attributes.sandbox,'allow-scripts');assert.equal(frame.hidden,true);assert.equal(frame.attributes.referrerpolicy,'no-referrer');
  assert.equal(new URL(frame.src).origin,'https://zaobalkou.github.io');assert.equal(query.get('grId'),'61431922');
  const payload={...row(),type:'za-goodreads-rating',nonce:query.get('nonce'),grId:'61431922'};
  env.send(payload,{});env.send({...payload,nonce:'wrong'},frame.contentWindow);env.send({...payload,grId:'123'},frame.contentWindow);env.send(payload,frame.contentWindow,'https://www.goodreads.com');
  assert.equal(frame.removed,undefined);env.send(payload,frame.contentWindow);const result=await promise;
  assert.equal(result.grCount,3955143);assert.equal(frame.removed,true);assert.equal(env.events.has('message'),false);
});

test('failed or timed-out frame is removed and listeners do not accumulate',async()=>{
  for(const explicitError of [true,false]){
    const env=fakeBrowser(),client=Goodreads.create({window:env.host,document:env.doc,requestGap:0,timeout:20});
    const original=book(),promise=client.rating(original);await tick();const frame=env.frames[0],query=new URL(frame.src).searchParams;
    if(explicitError)env.send({type:'za-goodreads-rating',grId:'61431922',nonce:query.get('nonce'),error:'unavailable'},frame.contentWindow);
    assert.equal(await promise,original);assert.equal(frame.removed,true);assert.equal(env.events.has('message'),false);
  }
});

// Execute only our own bridge parser against representative written markup;
// Goodreads' external JavaScript is never evaluated in the test process.
test('bridge extracts the aggregate and ignores individual-review or script-source numbers',()=>{
  const html=fs.readFileSync(require.resolve('../goodreads-bridge.html'),'utf8'),scripts=Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g)).map(m=>m[1]);
  assert.equal(scripts.length,2);assert.match(html,/default-src 'none'/);assert.match(html,/script-src 'unsafe-inline' https:\/\/www.goodreads.com/);assert.match(html,/img-src https:\/\/i.gr-assets.com https:\/\/s.gr-assets.com/);
  function parse(text,href='https://www.goodreads.com/book/show/61431922-fourth-wing?x=1'){
    let sent;const parent={postMessage:payload=>sent=payload};
    const context={URL,URLSearchParams,location:{search:'?grId=61431922&nonce='+'a'.repeat(32)},window:{parent},document:{querySelectorAll:()=>[{href,textContent:'Fourth Wing',getAttribute:()=> 'Fourth Wing (The Empyrean, #1)'}],body:{childNodes:[{nodeName:'DIV',textContent:text},{nodeName:'SCRIPT',textContent:'Goodreads rating: 5 (99 ratings)'}]}}};
    vm.runInNewContext(scripts[1],context);return sent;
  }
  const result=parse('Fourth Wing Goodreads rating: 4.56 (3,955,143 ratings)');assert.equal(result.rating,4.56);assert.equal(result.count,3955143);assert.equal(result.title,'Fourth Wing');
  assert.equal(parse('5 stars · 99 individual reviews').error,'unavailable');assert.equal(parse('Goodreads rating: 0 (0 ratings)').error,'unavailable');assert.equal(parse('Goodreads rating: 4.56 (3955143 ratings)','https://evil.test/book/show/61431922').error,'unavailable');assert.equal(parse('Goodreads rating: 4.56 (3955143 ratings)','https://www.goodreads.com/book/show/614319229-other').error,'unavailable');
});
