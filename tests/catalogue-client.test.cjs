'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../book-core.js');
const Client=require('../catalogue-client.js');
const json=value=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(value)});
function create(fetch,extra={}){return Client.create(Object.assign({core:Core,fetch,config:{},data:{books:[]},storage:null,requestGap:0,timeout:100},extra));}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const edition={id:'/books/OL100M',editionId:'/books/OL100M',olEditionId:'/books/OL100M',olWorkId:'/works/OL100W',workId:'/works/OL100W',title:'A Book',author:'An Author',language:'en',year:2025,yearKind:'edition',isbn:'9780000000001',pages:0,tags:['fantasy']};

test('Apple storefront is never treated as book language',()=>{
  const client=create(()=>json({}));
  assert.equal(client._test.mapApple({trackId:1,trackName:'Příběh',artistName:'Autor',country:'CZ',releaseDate:'2026-01-03T00:00:00Z'}).language,'');
  assert.equal(client._test.mapApple({trackId:2,trackName:'Story',artistName:'Author',languageCodesISO2A:['EN']}).language,'en');
  assert.equal(client._test.language(['eng','jpn']),'');
  assert.equal(client._test.language(['/languages/pol']),'pl');
});

test('Open Library work medians and work languages are not assigned to an edition',()=>{
  const client=create(()=>json({}));
  const work=client._test.mapOL({key:'/works/OL1W',title:'A Book',author_name:['An Author'],first_publish_year:2020,number_of_pages_median:392,language:['eng']})[0];
  assert.equal(work.pages,0);assert.equal(work.language,'');assert.equal(work.year,null);assert.equal(work.firstPublishYear,2020);
  const book=client._test.mapOL({key:'/works/OL1W',title:'A Book',author_name:['An Author'],first_publish_year:2020,number_of_pages_median:392,editions:{docs:[{key:'/books/OL2M',title:'Kniha',language:['cze'],publish_date:['2025'],number_of_pages:416,isbn:['9780000000002']}]}})[0];
  assert.equal(book.pages,416);assert.equal(book.language,'cs');assert.equal(book.year,2025);assert.equal(book.olEditionId,'/books/OL2M');
});

test('No-key Google is disabled, valid empty catalogues are successful',async()=>{
  const calls=[];const client=create(url=>{calls.push(url);return json(url.includes('search.json')?{docs:[]}:{results:[]});});
  const result=await client.search('Absent book',{language:'all'});
  assert.equal(result.failed,0);assert.equal(result.total,2);assert.deepEqual(result.books,[]);
  assert.ok(calls.every(url=>!url.includes('googleapis')));
});

test('Exact ISBN enrichment attaches pages only to its own edition',async()=>{
  const client=create(()=>json({'ISBN:9780000000001':{details:{key:'/books/OL100M',number_of_pages:416,publish_date:'June 2025',languages:[{key:'/languages/eng'}],isbn_13:['9780000000001']}}}));
  const books=await client._test.enrichBatch([edition,Object.assign({},edition,{id:'seed:cs',isbn:'9780000000002',language:'cs',pages:352})]);
  assert.equal(books[0].pages,416);assert.equal(books[0].language,'en');assert.equal(books[1].pages,352);assert.equal(books[1].language,'cs');
});

test('Network failures remain explicit and identical inflight requests coalesce',async()=>{
  let calls=0;const client=create(()=>{calls++;return Promise.resolve({ok:false,status:429,json:()=>Promise.resolve({})});});
  const results=await Promise.allSettled([client._test.request('https://openlibrary.org/x','Open Library'),client._test.request('https://openlibrary.org/x','Open Library')]);
  assert.equal(calls,1);assert.ok(results.every(r=>r.status==='rejected'));
  await assert.rejects(client._test.request('https://openlibrary.org/x','Open Library'));assert.equal(calls,1);
  client.clearCache();await assert.rejects(client._test.request('https://openlibrary.org/x','Open Library'));assert.equal(calls,2);
});

test('Search sends language and exact edition publication year to Open Library',async()=>{
  const calls=[];const client=create(url=>{calls.push(url);return json(url.includes('search.json')?{docs:[]}:{results:[]});});
  await client.search('A Book',{language:'en',year:2025});
  const q=new URL(calls.find(u=>u.includes('search.json'))).searchParams.get('q');
  assert.match(q,/language:eng/);assert.match(q,/publish_year:2025/);assert.doesNotMatch(q,/first_publish_year:2025/);
});

test('Verified local editions survive complete provider outage',async()=>{
  const cs=Object.assign({},edition,{id:'seed:cs',workId:'curated:book',title:'Kniha',aliases:['A Book'],language:'cs',pages:352,verified:true});
  const client=create(()=>Promise.reject(new Error('offline')),{data:{books:[cs]}});
  const result=await client.search('Kniha',{language:'cs',year:2025});
  assert.equal(result.failed,2);assert.equal(result.books.length,1);assert.equal(result.books[0].pages,352);
});

test('Newly discovered OL editions do not inherit publisher provenance or ISBN ratings',async()=>{
  const book=Object.assign({},edition,{pages:300,source:'Publisher',verified:true,verifiedAt:'2026-09-12',grRating:4.2,grCount:200,grUrl:'https://www.goodreads.com/book/show/123-book',grCheckedAt:'2026-09-12'});
  const client=create(url=>{
    if(url.includes('/editions.json'))return json({size:1,entries:[{key:'/books/OL101M',title:'Kniha',languages:[{key:'/languages/cze'}],number_of_pages:352,publish_date:'2026',isbn_13:['9780000000002']}]});
    return json({description:'A useful description.'});
  });
  const detailed=await client.detail(book),cs=detailed.editions.find(b=>b.id==='/books/OL101M');
  assert.ok(cs);assert.equal(cs.pages,352);assert.equal(cs.language,'cs');assert.equal(cs.source,'Open Library');assert.equal(cs.verified,false);assert.ok(!cs.grRating);assert.equal(cs.isbn,'9780000000002');
});

test('Hung requests terminate and do not silently become an empty result',async()=>{
  const client=create(()=>new Promise(()=>{}),{timeout:15});
  const result=await client.search('A Book',{language:'cs'});
  assert.equal(result.failed,2);assert.equal(result.issues.length,2);assert.match(result.issues[0].message,/neodpověděl/);
});

test('Canonical Czech browsing tags become useful English catalogue subjects',async()=>{
  const calls=[];const client=create(url=>{calls.push(url);return json({docs:[]});});
  await client.tags(['drak','království'],{});
  const query=new URL(calls.find(u=>u.includes('search.json'))).searchParams.get('q');
  assert.match(query,/subject:"dragons"/);assert.match(query,/subject:"royalty"/);assert.doesNotMatch(query,/first_publish_year:/);
});

test('Czech tag browsing includes older works, useful relevance pages and exact Czech editions',async()=>{
  const calls=[];
  function work(n){return {key:'/works/OL'+(1000+n)+'W',title:'Science book '+n,author_name:['Author '+n],first_publish_year:n===1?1965:2020,subject:['Science fiction'],editions:{docs:[{key:'/books/OL'+(1000+n)+'M',title:'Kniha '+n,language:[n===2?'eng':'cze'],publish_year:[2025],number_of_pages:320}]}};}
  const client=create(url=>{
    calls.push(url);const params=new URL(url).searchParams,offset=Number(params.get('offset'));
    const start=params.get('sort')==='new'?30:offset;
    return json({numFound:123,docs:Array.from({length:Math.min(60,123-start)},(_,i)=>work(start+i))});
  });
  const result=await client.tags(['sci-fi'],{language:'cs',year:'all'});
  assert.equal(result.failed,0);assert.equal(result.total,1);
  assert.equal(result.books.length,119,'two relevance pages are merged with the recent page, without duplicate works');
  assert.ok(result.books.some(b=>b.firstPublishYear===1965),'a recent translation of an old work remains discoverable');
  assert.ok(result.books.every(b=>b.language==='cs'),'language is taken only from the selected edition');
  assert.equal(calls.length,3,'paging is bounded even when more works are available');
  assert.ok(calls.some(url=>new URL(url).searchParams.get('offset')==='60'));
  calls.forEach(url=>{const q=new URL(url).searchParams.get('q');assert.match(q,/language:cze/);assert.match(q,/subject:"vědeckofantastické romány"/);assert.doesNotMatch(q,/first_publish_year:/);});
});

test('Tag browsing preserves explicit edition year and a working page when another request fails',async()=>{
  const calls=[],doc={key:'/works/OL1W',title:'A Book',author_name:['An Author'],first_publish_year:1965,subject:['Science fiction'],editions:{docs:[{key:'/books/OL1M',title:'Kniha',language:['cze'],publish_year:[2025],number_of_pages:320}]}};
  const client=create(url=>{calls.push(url);const params=new URL(url).searchParams;if(params.get('sort')==='new')return Promise.reject(new Error('offline'));return json({numFound:1,docs:[doc]});});
  const result=await client.tags(['sci-fi'],{language:'cs',year:2025});
  assert.equal(result.failed,0);assert.equal(result.books.length,1);assert.equal(calls.length,2);
  calls.forEach(url=>{const q=new URL(url).searchParams.get('q');assert.match(q,/publish_year:2025/);assert.doesNotMatch(q,/first_publish_year:/);});
  const failed=await create(()=>Promise.reject(new Error('offline'))).tags(['sci-fi'],{language:'cs'});
  assert.equal(failed.failed,1);assert.equal(failed.total,1);assert.equal(failed.issues.length,1);
});

test('A failed optional next page keeps the first catalogue page',async()=>{
  const client=create(url=>{const params=new URL(url).searchParams;if(Number(params.get('offset')))return Promise.reject(new Error('offline'));return json({numFound:1000,docs:Array.from({length:60},(_,n)=>({key:'/works/OL'+(1000+n)+'W',title:'Book '+n,subject:['science fiction'],author_name:['Author '+n],editions:{docs:[{key:'/books/OL'+(1000+n)+'M',title:'Book '+n,language:['eng'],publish_year:[2025],number_of_pages:320}]}}))});});
  const result=await client.tags(['sci-fi'],{language:'en'});
  assert.equal(result.failed,0);assert.equal(result.books.length,60);
});

test('Configured Goodreads feed is preferred only with verifiable source identity',async()=>{
  const seed=Object.assign({},edition,{pages:320,aRating:4.9,aCount:700});
  const client=create(url=>{
    if(url.endsWith('/ratings.json'))return json({ratings:[{isbn:seed.isbn,rating:4.1,count:200,url:'https://www.goodreads.com/book/show/123-book',checkedAt:'2026-09-12'}]});
    return json(url.includes('search.json')?{docs:[]}:{results:[]});
  },{origin:'https://zaobalkou.github.io',config:{goodreadsRatingsUrl:'/ratings.json'},data:{books:[seed]}});
  const result=await client.search('A Book',{language:'en'});
  assert.equal(Core.rating(result.books[0]).source,'Goodreads');assert.equal(Core.rating(result.books[0]).value,4.1);
});

test('Goodreads feed prefers the exact ISBN and preserves explicit work and snapshot provenance',async()=>{
  const seed=Object.assign({},edition,{pages:320});
  const rows=[{workId:seed.workId,scope:'work',rating:4.3,count:4000000,url:'https://www.goodreads.com/book/show/123-book',checkedAt:'2026-09-12',snapshot:true},{isbn:seed.isbn,rating:4.1,count:200,url:'https://www.goodreads.com/book/show/456-edition',checkedAt:'2026-09-12',snapshot:'true'}];
  function feedClient(feed){return create(url=>json(url.endsWith('/ratings.json')?{ratings:feed}:url.includes('search.json')?{docs:[]}:{results:[]}),{origin:'https://zaobalkou.github.io',config:{goodreadsRatingsUrl:'/ratings.json'},data:{books:[seed]}});}
  const exact=(await feedClient(rows).search('A Book',{})).books[0];
  assert.equal(exact.grRating,4.1);assert.equal(exact.grScope,'edition');assert.equal(exact.grSnapshot,false);
  const work=(await feedClient([rows[0]]).search('A Book',{})).books[0];
  assert.equal(work.grRating,4.3);assert.equal(work.grCount,4000000);assert.equal(work.grScope,'work');assert.equal(work.grSnapshot,true);
  const unrelated=(await feedClient([Object.assign({},rows[0],{scope:'edition',isbn:'9780000000099'})]).search('A Book',{})).books[0];
  assert.ok(!unrelated.grRating,'an explicitly edition-specific rating cannot match a different ISBN through workId');
});

test('Ratings feed cannot send catalogue requests to an arbitrary configured origin',async()=>{
  const calls=[],seed=Object.assign({},edition,{pages:320,aRating:4.9,aCount:700});
  const client=create(url=>{calls.push(url);return json(url.includes('search.json')?{docs:[]}:{results:[]});},{origin:'https://zaobalkou.github.io',config:{goodreadsRatingsUrl:'https://example.com/ratings.json'},data:{books:[seed]}});
  const result=await client.search('A Book',{});assert.equal(Core.rating(result.books[0]).source,'Apple Books');assert.ok(calls.every(u=>!u.includes('example.com')));
});

test('Complete publisher detail resolves its ISBN work and recovers work ratings without copying edition ratings',async()=>{
  const calls=[];
  const book={id:'seed:9780000000002',workId:'curated:book',title:'Kniha',aliases:['A Book'],author:'An Author',isbn:'9780000000002',language:'cs',year:2026,yearKind:'edition',pages:352,verified:true,source:'Publisher',tags:['fantasy']};
  book.editions=[Object.assign({},edition,{id:'a:50',isbn:'9780000000001',workId:'curated:book',pages:416,aRating:4.9,aCount:1000,olRating:3.8,olCount:10})];
  const client=create(url=>{
    calls.push(url);
    if(url.includes('/api/books?'))return json({'ISBN:9780000000002':{details:{key:'/books/OL102M',works:[{key:'/works/OL100W'}],languages:[{key:'/languages/cze'}],number_of_pages:999,publish_date:'2000',isbn_13:['9780000000002']}}});
    if(url.includes('search.json'))return json({docs:[{key:'/works/OL100W',title:'A Book',author_name:['An Author'],ratings_average:4.2,ratings_count:99,editions:{docs:[{key:'/books/OL100M',title:'A Book',language:['eng'],isbn:['9780000000001'],publish_year:2025,number_of_pages:416}]}}]});
    if(url.includes('/editions.json'))return json({size:0,entries:[]});
    return json({description:'Work description.'});
  });
  const result=await client.detail(book);
  assert.ok(calls.some(u=>u.includes('/api/books?')),'metadata is resolved even though pages/year/language are already known');
  assert.equal(result.olWorkId,'/works/OL100W');assert.equal(result.pages,352);assert.equal(result.year,2026);
  assert.equal(result.olRating,3.8);assert.equal(result.olCount,10);
  assert.ok(!result.aRating);assert.ok(!result.gRating);assert.equal(Core.rating(result).source,'Open Library');
});

test('Deep-link detail without ratings uses exact ISBN search and shares returned OL work score',async()=>{
  const calls=[],book=Object.assign({},edition,{pages:416});delete book.olRating;delete book.olCount;
  const client=create(url=>{
    calls.push(url);
    if(url.includes('search.json'))return json({docs:[{key:'/works/OL100W',title:'A Book',author_name:['An Author'],ratings_average:4.3,ratings_count:120,editions:{docs:[{key:'/books/OL105M',title:'Kniha',language:['cze'],isbn:['9780000000005'],publish_year:2026,number_of_pages:352}]}}]});
    if(url.includes('/editions.json'))return json({size:0,entries:[]});
    return json({description:'Work description.'});
  });
  const result=await client.detail(book);
  assert.equal(new URL(calls.find(u=>u.includes('search.json'))).searchParams.get('q'),'isbn:9780000000001');
  assert.equal(result.olRating,4.3);assert.equal(result.olCount,120);assert.equal(result.pages,416);
  assert.ok(result.editions.every(b=>b.olRating===4.3));
});

test('Goodreads detail progress arrives before metadata and survives subsequent catalogue results',async()=>{
  const metadata=deferred(),work=deferred(),editions=deferred(),calls=[],updates=[];
  const row={workId:edition.workId,scope:'work',rating:4.6,count:4000000,url:'https://www.goodreads.com/book/show/123-book',checkedAt:'2026-09-12',snapshot:true};
  const client=create(url=>{
    calls.push(url);
    if(url.endsWith('/ratings.json'))return json({ratings:[row]});
    if(url.includes('/api/books?'))return metadata.promise.then(json);
    if(url.includes('search.json'))return json({docs:[{key:edition.olWorkId,title:edition.title,author_name:[edition.author],ratings_average:3.8,ratings_count:38}]});
    if(url.includes('/editions.json'))return editions.promise.then(json);
    return work.promise.then(json);
  },{timeout:1000,origin:'https://zaobalkou.github.io',config:{goodreadsRatingsUrl:'/ratings.json'}});
  let finished=false;const pending=client.detail(edition,b=>updates.push(b)).then(b=>{finished=true;return b;});
  await flush();
  assert.ok(calls[0].endsWith('/ratings.json'),'the ratings feed starts before any public metadata request');
  assert.equal(finished,false);assert.equal(updates.length,1);assert.equal(Core.rating(updates[0]).source,'Goodreads');assert.equal(updates[0].pages,0);
  metadata.resolve({'ISBN:9780000000001':{details:{key:edition.id,languages:[{key:'/languages/eng'}],number_of_pages:416,publish_date:'2025',works:[{key:edition.olWorkId}]}}});
  await flush();
  assert.equal(finished,false);assert.ok(updates.some(b=>b.olCount===38&&b.pages===416));
  assert.ok(updates.every(b=>b.id===edition.id&&b.language==='en'&&Core.rating(b).source==='Goodreads'),'later work ratings cannot replace early Goodreads or change the selected edition');
  work.resolve({description:'Description loaded later.'});editions.resolve({size:0,entries:[]});
  const result=await pending;
  assert.equal(result.grRating,4.6);assert.equal(result.grCount,4000000);assert.equal(result.pages,416);assert.equal(result.desc,'Description loaded later.');assert.equal(result.olCount,38);
});

test('Open Library score appears before editions; a later Goodreads response keeps enriched metadata',async()=>{
  const feed=deferred(),editions=deferred(),work=deferred(),updates=[];
  const client=create(url=>{
    if(url.endsWith('/ratings.json'))return feed.promise.then(json);
    if(url.includes('/api/books?'))return json({'ISBN:9780000000001':{details:{key:edition.id,number_of_pages:416,publish_date:'2025',languages:[{key:'/languages/eng'}]}}});
    if(url.includes('search.json'))return json({docs:[{key:edition.olWorkId,title:edition.title,author_name:[edition.author],ratings_average:4.2,ratings_count:100,editions:{docs:[{key:'/books/OL105M',title:'Kniha',language:['cze'],publish_year:[2026],number_of_pages:352}]}}]});
    if(url.includes('/editions.json'))return editions.promise.then(json);
    return work.promise.then(json);
  },{timeout:1000,origin:'https://zaobalkou.github.io',config:{goodreadsRatingsUrl:'/ratings.json'}});
  let finished=false;const pending=client.detail(edition,b=>updates.push(b)).then(b=>{finished=true;return b;});
  await flush();
  assert.equal(finished,false);assert.ok(updates.length);assert.equal(Core.rating(updates[0]).source,'Open Library');assert.equal(updates[0].pages,416);
  feed.resolve({ratings:[{isbn:edition.isbn,rating:4.7,count:900,url:'https://www.goodreads.com/book/show/123-book',checkedAt:'2026-09-12'}]});
  await flush();
  assert.equal(finished,false);assert.equal(Core.rating(updates.at(-1)).source,'Goodreads');assert.equal(updates.at(-1).pages,416);assert.ok(updates.every(b=>b.id===edition.id&&b.language==='en'));
  work.resolve({description:'Work description.'});editions.resolve({size:0,entries:[]});
  const result=await pending;
  assert.equal(result.grRating,4.7);assert.equal(result.pages,416);assert.equal(result.language,'en');assert.equal(result.olCount,100);
  assert.ok(!result.editions.find(b=>b.language==='cs').grRating,'an edition-specific Goodreads rating is not copied to its translation');
});

test('Cached ratings are synchronous, keep edition choices and require no additional request',async()=>{
  let calls=0;const client=create(()=>{calls++;return json({ratings:[{isbn:edition.isbn,rating:4.6,count:900,url:'https://www.goodreads.com/book/show/123-book',checkedAt:'2026-09-12'}]});},{origin:'https://zaobalkou.github.io',config:{goodreadsRatingsUrl:'/ratings.json'}});
  const book=Object.assign({},edition,{editions:[Object.assign({},edition,{id:'seed:cs',language:'cs',isbn:'9780000000002'})]});
  assert.equal(client.getCachedRatings(book),book);assert.equal(calls,0);
  await client._test.request('https://zaobalkou.github.io/ratings.json','Goodreads');
  const cached=client.getCachedRatings(book);
  assert.equal(cached.grRating,4.6);assert.equal(cached.id,book.id);assert.deepEqual(cached.editions,book.editions);assert.equal(calls,1);assert.ok(!book.grRating);
  client.clearCache();assert.equal(client.getCachedRatings(book),book);assert.equal(calls,1);
});

test('Default Open Library requests and queue expire at 25 seconds while other providers expire sooner',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const calls=[],client=Client.create({core:Core,storage:null,requestGap:0,fetch:url=>{calls.push(url);return new Promise(()=>{});}});
  const statuses=[];
  const jobs=['a','b','c'].map(name=>client._test.request('https://openlibrary.org/'+name,'Open Library').catch(e=>{statuses.push('OL:'+e.message);}));
  jobs.push(client._test.request('https://itunes.apple.com/book','Apple Books').catch(e=>{statuses.push('Apple:'+e.message);}));
  await flush();t.mock.timers.tick(8500);await flush();
  assert.equal(statuses.length,1);assert.match(statuses[0],/^Apple:/);assert.equal(calls.filter(url=>url.includes('openlibrary')).length,2);
  t.mock.timers.tick(16500);await flush();await Promise.all(jobs);
  assert.equal(statuses.filter(s=>s.startsWith('OL:')).length,3);assert.ok(statuses.some(s=>s.includes('čeká na dokončení')),'a waiting request has a bounded queue deadline');
});
