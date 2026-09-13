const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../book-core.js');
const book=(id,extra={})=>({id,title:'Dračí rod',author:'Autorka',year:2025,language:'cs',tags:[],...extra});

test('edition identity retains separate ISBNs and language versions',()=>{
 const cz=book('cz',{isbn:'9781234567890',workId:'dragon-house'});
 const en=book('en',{title:'Dragon House',isbn:'9781234567891',workId:'dragon-house',language:'en'});
 const paperback={...cz,id:'paper',isbn:'9781234567892'};
 assert.equal(Core.sameWork(cz,en),true);assert.equal(Core.sameBook(cz,en),false);
 assert.equal(Core.sameBook(cz,paperback),false);assert.equal(Core.sameBook(cz,{...cz,id:'other'}),true);
 assert.equal(Core.merge([[cz,en,paperback]]).length,3);
 assert.equal(Core.sameBook(book('a'),book('b',{language:'en'})),false);
});
test('known years keep unidentified editions separate',()=>{
 assert.equal(Core.sameBook(book('old',{year:2024}),book('new',{year:2025})),false);
 assert.equal(Core.sameWork(book('old',{year:2024}),book('new',{year:2025})),true);
});
test('grouping selects requested language/year but retains full edition choices',()=>{
 const cz=book('cz',{workId:'work:1',isbn:'9781234567890'});
 const en=book('en',{title:'Dragon House',workId:'work:1',language:'en',year:2024,isbn:'9781234567891',pages:301});
 const enNew={...en,id:'en-new',year:2026,isbn:'9781234567892',pages:315};
 const groups=Core.groupWorks([cz,en,enNew],{language:'en',year:'2026'});
 assert.equal(groups.length,1);assert.equal(groups[0].id,'en-new');assert.equal(groups[0].pages,315);
 assert.equal(groups[0].editions.length,3);assert(groups[0].editions.every(e=>!e.editions));
 assert.equal(Core.groupWorks([cz,en],{language:'de'}).length,0);
});
test('default representative prefers an identified edition over an unknown store record without transferring edition facts',()=>{
 const store=book('a:6477693290',{editionId:'a:6477693290',source:'Apple Books',title:'Book Lovers',author:'Emily Henry',year:2024,language:'',pages:0});
 const paperback=book('/books/OL34990822M',{editionId:'/books/OL34990822M',olEditionId:'/books/OL34990822M',title:'Book Lovers',author:'Emily Henry',year:2022,yearKind:'edition',language:'en',pages:384,isbn:'9780593334836'});
 const group=Core.groupWorks([store,paperback],{query:'Book Lovers'})[0];
 assert.equal(group.id,paperback.id);assert.equal(group.language,'en');assert.equal(group.pages,384);assert.equal(group.year,2022);assert.equal(group.isbn,paperback.isbn);
 const untouched=group.editions.find(b=>b.id===store.id);assert.equal(untouched.language,'');assert.equal(untouched.pages,0);assert.equal(untouched.year,2024);assert.equal(untouched.isbn,undefined);
 assert.equal(Core.groupWorks([store,paperback],{year:'2024'})[0].id,store.id);
 assert.equal(Core.groupWorks([store,paperback],{language:'en'})[0].id,paperback.id);
 assert.equal(Core.groupWorks([store,paperback],{language:'cs'}).length,0);
 assert.equal(Core.groupWorks([store,paperback],{sort:'newest'})[0].id,store.id);
 const isbnStore={...store,isbn:'9780241995341'};assert.equal(Core.groupWorks([isbnStore,paperback],{query:isbnStore.isbn})[0].id,store.id);
 // A selected language is meaningful even when that edition lacks its pages.
 assert.equal(Core.groupWorks([{...store,language:'cs'},paperback])[0].id,store.id);
});
test('work grouping shares Open Library work ratings but never edition-specific ratings',()=>{
 const cz=book('cz',{workId:'work:1',isbn:'9781234567890',verified:true});
 const en=book('en',{workId:'work:1',isbn:'9781234567891',language:'en',olRating:4.3,olCount:800,aRating:4.9,aCount:500,gRating:4.7,gCount:900});
 const group=Core.groupWorks([cz,en],{language:'cs'})[0];
 assert.equal(group.olRating,4.3);assert.equal(group.olCount,800);assert.equal(group.aRating,undefined);assert.equal(group.gRating,undefined);
 assert.equal(group.editions.find(e=>e.id==='cz').olRating,4.3);assert.equal(cz.olRating,undefined);
});
test('translation crosswalk joins real works without copying another edition pages/rating',()=>{
 const seeds=[book('seed',{aliases:['Dragon House'],author:'Suzanne Collinsová',authorAliases:['Suzanne Collins'],workId:'work:dragon',isbn:'9781234567890',pages:400,series:'Dračí rod',seriesNumber:2,tags:['fantasy','království'],gRating:4,gCount:200})];
 const en=book('en',{title:'Dragon House',author:'Suzanne Collins',language:'en',isbn:'9781234567891',year:2024,pages:0});
 const linked=Core.linkCatalogue([en],seeds)[0];
 assert.equal(linked.workId,'work:dragon');assert.equal(linked.seriesNumber,2);assert.equal(linked.pages,0);assert.equal(linked.gRating,undefined);
 assert(linked.aliases.includes('Dračí rod'));assert(Core.matchesTags(linked,['kingdoms']));
 assert.equal(Core.groupWorks([...seeds,linked]).length,1);
});
test('ambiguous identical titles from different authors never group',()=>{
 assert.equal(Core.sameWork(book('1'),book('2',{author:'Někdo jiný'})),false);
 assert.equal(Core.groupWorks([book('1'),book('2',{author:'Někdo jiný'})]).length,2);
});
test('translated alias with unknown language does not acquire Czech edition facts',()=>{
 const seed=book('seed',{title:'Rod draků',aliases:['House of Dragons'],isbn:'9781234567890',pages:432,verified:true,source:'Publisher'});
 const apple=book('apple',{title:'House of Dragons',language:'',pages:0});
 const linked=Core.linkCatalogue([apple],[seed])[0];
 assert.equal(linked.language,'');assert.equal(linked.pages,0);assert.equal(linked.isbn,undefined);assert.equal(linked.verified,undefined);
 assert(Core.sameWork(linked,seed));
 assert.equal(Core.sameBook(linked,seed),false);assert.equal(Core.merge([[linked,seed]]).length,2);
});
test('identical bilingual title with unknown language cannot inherit a Czech ISBN or page count',()=>{
 const seed=book('cs-seed',{title:'Rival Darling',author:'Alexandra Moody',year:2026,isbn:'9781234567890',pages:432});
 const apple=book('apple:1',{title:'Rival Darling',author:'Alexandra Moody',year:2026,language:'',pages:0});
 const linked=Core.linkCatalogue([apple],[seed])[0];
 assert.equal(Core.sameBook(apple,seed),false);assert.equal(linked.language,'');assert.equal(linked.pages,0);assert.equal(linked.isbn,undefined);
 assert.equal(Core.merge([[apple,seed]]).length,2);assert.equal(Core.groupWorks([apple,seed]).length,1);
 assert.equal(Core.sameBook(apple,{...seed,id:apple.id}),true);
 assert.equal(Core.sameBook({...apple,olEditionId:'OL123M'},{...seed,olEditionId:'OL123M'}),true);
 assert.equal(Core.merge([[{...apple,title:'Provider title',author:'Neznámý autor',olEditionId:'OL123M'},{...seed,olEditionId:'OL123M'}]]).length,1);
 assert.equal(Core.sameBook({...apple,isbn:seed.isbn},seed),true);
});
test('verified author and series match groups Apple translator credits without merging editions',()=>{
 const cs=book('seed-cs',{title:'Rival Darling',author:'Alexandra Moody',workId:'curated:rival-darling',verified:true,year:2026,isbn:'9788026742258',pages:352,series:'Darlingovic Ďáblové',seriesNumber:1});
 const en={...cs,id:'seed-en',language:'en',year:2025,isbn:'9780063457423',pages:416,series:'The Darling Devils'};
 const de=book('a:6744938843',{editionId:'a:6744938843',title:'Rival Darling',author:'Alexandra Moody & Stephanie Pannen',source:'Apple Books',year:2025,language:'',pages:0});
 const fr=book('a:2',{editionId:'a:2',title:'Rival Darling (Darling Devils - tome 1)',author:'Alexandra Moody & Laurence Assuid',source:'Apple Books',year:2026,language:'fr',pages:0});
 const editions=Core.linkCatalogue([de,fr],[cs,en]);
 assert.equal(Core.groupWorks([cs,en,...editions]).length,1);
 assert.equal(Core.groupWorks([cs,en,...editions])[0].editions.length,4);
 assert.equal(editions[0].author,de.author);assert.equal(editions[0].language,'');assert.equal(editions[0].pages,0);assert.equal(editions[0].isbn,undefined);
 assert.equal(editions[1].language,'fr');assert.equal(editions[1].pages,0);assert.equal(Core.sameBook(editions[0],en),false);
 const englishStore={...editions[0],language:'en'};assert.equal(Core.sameBook(englishStore,en),false);
 assert.equal(Core.sameBook({...englishStore,isbn:en.isbn},en),true);
 assert.equal(Core.sameBook({...englishStore,id:'another',editionId:'a:3'},englishStore),false);
});
test('contributor matching rejects ambiguous works, author prefixes, anthologies and other series volumes',()=>{
 const seed=book('seed',{title:'Rival Darling',author:'Alexandra Moody',workId:'curated:rival',verified:true,series:'The Darling Devils',seriesNumber:1});
 const store=book('a:1',{editionId:'a:1',source:'Apple Books',title:'Rival Darling',author:'Alexandra Moody & Stephanie Pannen',language:''});
 for(const changes of [{author:'Alexandra Moodyson & Stephanie Pannen'},{author:'Stephanie Pannen & Alexandra Moody'},{title:'Rival Darling (Darling Devils - tome 2)'},{title:'Rival Darling (Other Series - tome 1)'},{title:'Rival Darling / Truly Madly Deeply'},{source:'Unknown'}]){
   const linked=Core.linkCatalogue([{...store,...changes}],[seed])[0];assert.equal(linked.workId,undefined);
 }
 assert.equal(Core.linkCatalogue([store],[{...seed,verified:false}])[0].workId,undefined);
 assert.equal(Core.linkCatalogue([store],[seed,{...seed,id:'ambiguous',workId:'different-work'}])[0].workId,undefined);
 // Matching a translator credit never creates an unanchored author alias.
 assert.equal(Core.sameWork(store,seed),false);
});
test('a work-level original date never masquerades as a dated language edition',()=>{
 const work=book('olwork',{title:'House of Dragons',language:'',year:2020,yearKind:'original',workId:'dragon'});
 const edition=book('english',{title:'House of Dragons',language:'en',year:2022,yearKind:'edition',workId:'dragon',isbn:'9781234567891',pages:400});
 assert.equal(Core.sameBook(work,edition),false);assert.equal(Core.groupWorks([work,edition],{language:'en',year:'2022'})[0].id,'english');
});
test('OL work identifiers unify URL and provider identifier forms',()=>{
 assert.equal(Core.sameWork(book('1',{workId:'/works/OL123W'}),book('2',{title:'English title',workId:'ol:OL123W'})),true);
});
test('ISBN normalizes hyphenated values; metadata from matching edition merges',()=>{
 const merged=Core.merge([[book('1',{isbn:'978-1234567890',pages:0})],[book('2',{title:'DRACI ROD',isbn:'9781234567890',pages:320,pageSource:'Publisher',olRating:4.2,olCount:300})]]);
 assert.equal(merged.length,1);assert.equal(merged[0].pages,320);assert.equal(merged[0].pageSource,'Publisher');
});
test('specific publication year filters editions, original date still controls discovery freshness',()=>{
 const reprint=book('classic',{year:2026,firstPublishYear:1937});const recent=book('new',{year:2025,firstPublishYear:2025});
 assert.deepEqual(Core.rank([reprint,recent],{year:'2026'}).map(b=>b.id),['classic']);
 assert.equal(Core.rank([reprint,recent],{now:2026})[0].id,'new');
 assert.equal(Core.rank([reprint],{era:'modern',now:2026}).length,0);
});
test('normalized tags remove taxonomy duplication and retain supported themes',()=>{
 const rival=book('rival',{tags:['Young Adult Fiction / Romance / Contemporary','Young Adult Fiction / Social Themes','Young Adult Fiction / Sports & Recreation / Hockey','Young Adult Fiction / School & Education'],desc:'A fake dating hockey romance.'});
 const tags=Core.normalizeTags(rival);
 assert(tags.includes('romantika'));assert(tags.includes('hokej'));assert(tags.includes('falešný vztah'));assert.equal(tags.filter(t=>t==='young adult').length,1);
 assert(tags.every(t=>!t.includes('/')));assert.deepEqual(Core.normalizeTags({...rival,tags}),tags);
 assert(Core.matchesTags(rival,['hockey','romance']));assert.equal(Core.matchesTags(rival,['dragons']),false);
});
test('tag discovery recognizes modern kingdom and dragon synonyms with AND semantics',()=>{
 const modern=book('m',{tags:['Fantasy','Kings and rulers','Dragons'],firstPublishYear:2025});
 assert(Core.matchesTags(modern,['kingdoms','drak']));assert.equal(Core.matchesTags(modern,['kingdoms','hockey']),false);
 const plain=book('p',{desc:'An ordinary family eats a royal breakfast.'});assert.equal(Core.matchesTags(plain,['kingdoms']),false);
 assert.equal(Core.normalizeTags(book('children',{tags:['Juvenile fiction']})).includes('young adult'),false);
});
test('known adult audience wins over conflicting juvenile catalogue taxonomy',()=>{
 const tags=Core.normalizeTags(book('adult',{tags:['romantasy','new adult','Juvenile Fiction / Fantasy']}));
 assert(tags.includes('new adult'));assert(tags.includes('fantasy'));assert.equal(tags.includes('dětské'),false);
 assert(Core.normalizeTags(book('children',{tags:['Juvenile Fiction / Fantasy']})).includes('dětské'));
});
test('a combined science-fiction-and-fantasy category does not turn fantasy into sci-fi',()=>{
 for(const category of ['Science Fiction & Fantasy','Science Fiction, Fantasy, & Magic','Science fiction, fantasy, horror','Fantasy and Science Fiction']){
   const fantasy=book('fantasy',{tags:[category,'Fantasy'],desc:'A book from Science Fiction & Fantasy.'});
   assert.equal(Core.matchesTags(fantasy,['sci-fi']),false,category);
   assert.equal(Core.matchesTags({...fantasy,tags:[category,'Science fiction']},['sci-fi']),true);
 }
 assert.equal(Core.matchesTags(book('cs',{tags:['vědeckofantastické romány']}),['sci-fi']),true);
 assert.equal(Core.matchesTags(book('both',{tags:['sci-fi','fantasy']}),['sci-fi','fantasy']),true);
});
test('Goodreads wins only with usable rating, count and traceable checked source',()=>{
 const base={gRating:4.9,gCount:10000,grRating:4.1,grCount:20,grUrl:'https://www.goodreads.com/book/show/123-title',grCheckedAt:'2026-01-01'};
 assert.equal(Core.rating(base).source,'Goodreads');
 for(const extra of [{grCount:0},{grRating:0},{grRating:'4.1'},{grUrl:'https://goodreads.com.evil.example/book/show/123'},{grUrl:'https://evil.example/?url=https://goodreads.com/book/show/123'},{grUrl:'https://goodreads.com@evil.example/book/show/123'},{grUrl:'https://goodreads.com/review/show/123'},{grUrl:'http://goodreads.com/book/show/123'},{grCheckedAt:''},{grCheckedAt:'not a date'}])assert.equal(Core.rating({...base,...extra}).source,'Google Books');
 assert.equal(Core.snapshot(book('gr',base)).grRating,4.1);assert.equal(Core.snapshot(book('bad',{...base,grUrl:'https://evil.example'})).grRating,undefined);
});
test('snapshot preserves edition metadata, broad language codes and manual progress total',()=>{
 const b=book('x',{language:'deu',workId:'work',olWorkId:'OL1W',olEditionId:'OL2M',editionId:'ed2',series:'Série',seriesNumber:1.5,pageSource:'Publisher',metadataSources:[{source:'Publisher',url:'https://publisher.example/book',checkedAt:'2026-01-01'}],editions:[book('nested')]});
 const lib=Core.validateLibrary({x:{status:'reading',page:12,pages:0,pagesManual:true,book:b}});
 assert.equal(lib.x.pagesManual,true);assert.equal(lib.x.pages,0);assert.equal(lib.x.page,12);assert.equal(lib.x.book.language,'de');assert.equal(lib.x.book.olEditionId,'OL2M');assert.equal(lib.x.book.seriesNumber,1.5);assert.equal(lib.x.book.editions,undefined);
 assert.equal(lib.x.book.metadataSources[0].url,'https://publisher.example/book');
});
test('only explicitly work-scoped Goodreads ratings reach another language edition',()=>{
 const rating={grRating:4.56,grCount:3808364,grUrl:'https://www.goodreads.com/book/show/61431922-fourth-wing',grCheckedAt:'2026-09-13',grSnapshot:true};
 const cs=book('cs',{workId:'work:wing',isbn:'9781234567890',pages:536,olRating:4.1,olCount:38});
 const en=book('en',{workId:'work:wing',isbn:'9781234567891',language:'en',pages:498,...rating});
 assert.equal(Core.rating(Core.groupWorks([cs,en],{language:'cs'})[0]).source,'Open Library');
 const selected=Core.groupWorks([cs,{...en,grScope:'work'}],{language:'cs'})[0];
 assert.equal(Core.rating(selected).source,'Goodreads');assert.equal(selected.grScope,'work');assert.equal(selected.grSnapshot,true);
 assert.equal(selected.pages,536);assert.equal(selected.editions.find(e=>e.id==='en').pages,498);
 assert.equal(cs.grRating,undefined);
 const unrelated=book('unrelated',{title:'Another story',workId:'other',author:'Another author'});
 assert.equal(Core.groupWorks([unrelated,{...en,grScope:'work'}],{language:'cs'})[0].grRating,undefined);
});
test('saved Goodreads provenance survives snapshots and is replaced with newer metadata',()=>{
 const saved=book('saved',{grRating:4.56,grCount:3808364,grUrl:'https://www.goodreads.com/book/show/61431922-fourth-wing',grCheckedAt:'2026-09-12',grScope:'work',grSnapshot:true});
 const snapshot=Core.snapshot(saved);assert.equal(snapshot.grSnapshot,true);assert.equal(snapshot.grScope,'work');assert.equal(Core.rating(snapshot).snapshot,true);
 const newer={...saved,grRating:4.5,grCheckedAt:'2026-09-13',grScope:'edition',grSnapshot:false};
 const merged=Core.merge([[saved],[newer]])[0];assert.equal(merged.grSnapshot,false);assert.equal(merged.grScope,'edition');assert.equal(merged.grRating,4.5);
});
test('Goodreads identifiers survive without cached ratings and accept only positive numeric book IDs',()=>{
 for(const [value,expected] of [['61431922','61431922'],[61431922,'61431922'],[' 61431922 ','61431922'],['999999999999999','999999999999999']]){
  assert.equal(Core.goodreadsId(value),expected);
  const saved=Core.snapshot(book('gr-id',{grId:value}));
  assert.equal(saved.grId,expected);assert.equal(saved.grRating,undefined);assert.equal(saved.grScope,undefined);
 }
 for(const value of ['',0,-1,'0','01','1e3','1.5',1.5,Infinity,{},['123'],'1000000000000000','123/../1','https://www.goodreads.com/book/show/123','javascript:alert(1)']){
  assert.equal(Core.goodreadsId(value),'');assert.equal(Core.snapshot(book('bad-id',{grId:value})).grId,undefined);
 }
});
test('Goodreads identifiers merge only with the selected edition and never follow work ratings',()=>{
 const cs=book('cs',{workId:'work:wing',isbn:'9781234567890',grId:'111'});
 const en=book('en',{workId:'work:wing',isbn:'9781234567891',language:'en',grId:'222',grRating:4.56,grCount:3808364,grUrl:'https://www.goodreads.com/book/show/222',grCheckedAt:'2026-09-13',grScope:'work'});
 const merged=Core.merge([[{...cs,grId:undefined}],[{...cs,id:'cs-provider',grId:111}]])[0];
 assert.equal(merged.grId,'111');
 const grouped=Core.groupWorks([cs,en],{language:'cs'})[0];
 assert.equal(grouped.grId,'111');assert.equal(grouped.grRating,4.56);
 assert.equal(grouped.editions.find(e=>e.id==='en').grId,'222');
 assert.equal(Core.groupWorks([{...cs,grId:undefined},en],{language:'cs'})[0].grId,undefined);
 assert.equal(Core.linkCatalogue([{...cs,grId:undefined}],[en])[0].grId,undefined);
 assert.equal(Core.merge([[cs],[{...cs,id:'another-source',grId:'333'}]])[0].grId,'111');
});
test('Goodreads work candidates require an Open Library work anchor and remain bounded numeric IDs',()=>{
 const candidate=book('work-candidate',{olWorkId:'/works/OL123W',grWorkIds:['123',123,' 456 ',0,'0','https://goodreads.com/book/show/4','1000000000000000',...Array.from({length:15},(_,i)=>i+1000)]});
 const saved=Core.snapshot(candidate);
 assert.deepEqual(saved.grWorkIds,['123','456','1000','1001','1002','1003','1004','1005','1006','1007']);
 assert.equal(saved.grId,undefined);assert.equal(saved.grRating,undefined);
 for(const olWorkId of [undefined,'','curated:wing','https://evil.example/OL123W','/books/OL123M','/works/OL0W']){
  assert.equal(Core.snapshot({...candidate,olWorkId}).grWorkIds,undefined);
  assert.equal(Core.merge([[{...candidate,olWorkId}]])[0].grWorkIds,undefined);
 }
 for(const olWorkId of ['/works/OL123W','ol:OL123W','OL123W'])assert.deepEqual(Core.snapshot({...candidate,olWorkId,grWorkIds:[123]}).grWorkIds,['123']);
});
test('Goodreads work candidates merge only when their anchored Open Library works agree',()=>{
 const first=book('first',{isbn:'9781234567890',olWorkId:'/works/OL123W',grWorkIds:['111']});
 const matching={...first,id:'second',olWorkId:'OL123W',grWorkIds:['111','222']};
 assert.deepEqual(Core.merge([[first],[matching]])[0].grWorkIds,['111','222']);
 const conflicting={...matching,olWorkId:'/works/OL999W',grWorkIds:['999']};
 assert.deepEqual(Core.merge([[first],[conflicting]])[0].grWorkIds,['111']);
 const noAnchor={...first,olWorkId:undefined,grWorkIds:['555']};
 assert.deepEqual(Core.merge([[noAnchor],[matching]])[0].grWorkIds,['111','222']);
 const translation={...first,id:'translated',isbn:'9781234567891',language:'en',grWorkIds:undefined};
 assert.equal(Core.groupWorks([first,translation],{language:'en'})[0].grWorkIds,undefined);
 assert.equal(first.grWorkIds.length,1);
});
test('unsafe input cannot poison prototypes, URLs or persistence metadata',()=>{
 const poison=JSON.parse('{"id":"x","title":"X","author":"A","__proto__":{"polluted":true},"link":"javascript:alert(1)","metadataSources":[{"url":"data:text/html,hi"}],"aliases":["safe",{"bad":1}]}');
 const merged=Core.merge([[poison]])[0];assert.equal(merged.polluted,undefined);assert.equal({}.polluted,undefined);
 const b=Core.snapshot(poison);assert.equal(b.link,'');assert.deepEqual(b.aliases,['safe']);assert.deepEqual(b.metadataSources,[]);
 assert.throws(()=>Core.validateLibrary(JSON.parse('{"__proto__":{}}')));
 assert.equal(Core.safeURL('https://user:secret@example.com/book'),'');
});
test('author punctuation aliases still rank exact authors first',()=>{
 const b=book('maas',{author:'Sarah J. Maas',authorAliases:['Sarah Janet Maas']});
 assert.equal(Core.relevance(b,'Sarah J Maas'),5);assert.equal(Core.relevance(b,'Sarah Janet Maas'),5);
 assert.equal(Core.rank([book('other',{title:'Sarah J Maas: biography'}),b],{query:'Sarah J Maas'})[0].id,'maas');
});
test('same source id merges when author and other identifiers are unavailable',()=>{
 const a=book('source:123',{author:'Neznámý autor',pages:0}),b={...a,pages:234};
 assert.equal(Core.merge([[a],[b]]).length,1);assert.equal(Core.merge([[a],[b]])[0].pages,234);
});
test('plural YA taxonomy normalizes and verified editions receive a bounded ranking boost',()=>{
 assert(Core.normalizeTags(book('ya',{tags:['Fiction for Young Adults']})).includes('young adult'));
 const checked=book('checked',{year:2024,verified:true}),other=book('api',{year:2026,verified:false});
 assert.equal(Core.rank([other,checked],{query:'Dračí rod'})[0].id,'checked');
 const old=book('classic',{year:1850,verified:true});assert.equal(Core.rank([old,other])[0].id,'api');
});

test('cover fallback uses exact editions and keeps translations separate',()=>{
 const cz=book('cz',{isbn:'9788025366882',workId:'fourth-wing'});
 const exact={...cz,id:'publisher',coverUrl:'https://example.com/cs.jpg'};
 const en={...cz,id:'en',isbn:'9781649374042',language:'en',title:'Fourth Wing',coverUrl:'https://example.com/en.jpg'};
 const urls=Core.coverCandidates(cz,[exact,en],false);
 assert.deepEqual(urls,['https://example.com/cs.jpg','https://covers.openlibrary.org/b/isbn/9788025366882-M.jpg?default=false']);
 assert.equal(cz.coverUrl,undefined);
 assert.equal(Core.coverCandidates({...cz,isbn:'',id:'unknown'},[en],false).length,0);
});
test('cover fallback sanitizes URLs, removes duplicates and prefers requested size',()=>{
 const b=book('cover',{coverUrl:'https://example.com/small.jpg',coverUrlL:'https://example.com/large.jpg'});
 assert.deepEqual(Core.coverCandidates(b,[b],true),[b.coverUrlL,b.coverUrl]);
 assert.deepEqual(Core.coverCandidates({...b,coverUrl:'javascript:alert(1)',coverUrlL:'http://example.com/image'},[],false),[]);
});
test('verified Czech Fourth Wing has edition-specific publisher artwork',()=>{
 const b=require('../catalogue-data.js').books.find(b=>b.isbn==='9788025366882');
 assert.equal(b.language,'cs');assert.equal(b.pages,536);
 assert.equal(b.coverUrl,'https://cdn.albatrosmedia.cz/Images/Product/89562509/?width=300&height=450');
});
