'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../book-core.js');
const Client=require('../catalogue-client.js');
const json=value=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(value)});
function create(fetch,extra={}){return Client.create(Object.assign({core:Core,fetch,config:{},data:{books:[]},storage:null,requestGap:0,timeout:100},extra));}
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
  assert.match(query,/subject:"dragons"/);assert.match(query,/subject:"royalty"/);assert.match(query,/first_publish_year:\[/);
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
