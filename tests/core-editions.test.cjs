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
