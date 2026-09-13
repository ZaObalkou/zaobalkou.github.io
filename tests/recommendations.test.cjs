'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../book-core.js');
const Recommendations=require('../recommendations.js');
const year=new Date().getFullYear()-1;
function book(i,extra={}){return {id:'test:'+i,workId:'work:'+i,title:'Story '+i,author:'Author '+i,year,firstPublishYear:year,language:'cs',tags:['fantasy'],...extra};}
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function ids(books){return books.map(book=>book.id);}
function deepFreeze(value){Object.freeze(value);Object.values(value).forEach(child=>{if(child&&typeof child==='object'&&!Object.isFrozen(child))deepFreeze(child);});return value;}

test('profile counts distinct saved works, shares translation language votes and ignores transient metadata',()=>{
  const cs=book(1,{tags:['fantasy','romance'],pages:200}),en={...cs,id:'edition:en',language:'en',title:'English title',tags:['fantasy','romance']};
  const original=Recommendations.profile([cs,en]);
  assert.equal(original.works.length,1);assert.equal(original.topicWeights.fantasy,1);
  assert.equal(original.languageWeights.cs,.5);assert.equal(original.languageWeights.en,.5);
  assert.equal(original.key,Recommendations.profile([{...en,pages:900,grCount:999,grRating:4.8},{...cs,page:30,year:year-1}]).key);
  assert.notEqual(original.key,Recommendations.profile([cs,book(2,{tags:['thriller']})]).key);
  const available={...cs,editions:[en]};assert.equal(Recommendations.profile([available]).languageWeights.en,undefined);
  const noIdCs={...cs,workId:'',aliases:['English title']},noIdEn={...en,workId:'',aliases:[cs.title]};
  assert.equal(Recommendations.profile([noIdCs,noIdEn]).key,Recommendations.profile([{...noIdCs,pages:0},{...noIdEn,olRating:4.8,olCount:999999}]).key);
});

test('recommendations deduplicate translated works, exclude every owned translation and remain clickable records',()=>{
  const owned=book(0),translation={...owned,id:'translated:0',title:'Jiný název',language:'en'};
  const candidates=[translation,...Array.from({length:30},(_,i)=>book(i+1)),{...book(8),id:'translated:8',language:'en'}];
  const picked=Recommendations.pick(candidates,{profile:Recommendations.profile([owned]),random:rng(5)});
  assert.equal(picked.length,6);assert(!picked.some(value=>Core.sameWork(value,owned)));
  picked.forEach((value,i)=>{assert(value.id);assert(value.editions.length);assert(!picked.slice(i+1).some(other=>Core.sameWork(value,other)));});
});

test('the full live candidate pool participates rather than only the original eighteen suggestions',()=>{
  const candidates=Array.from({length:60},(_,i)=>book(i));
  const picked=Recommendations.pick(candidates,{random:()=>.999999});
  assert.equal(picked.length,6);assert(picked.some(value=>!ids(Core.groupWorks(candidates).slice(0,18)).includes(value.id)));
});

test('new presses prefer unseen works and cannot repeat the previous row when alternatives exist',()=>{
  const candidates=Array.from({length:30},(_,i)=>book(i)),random=rng(23);
  const first=Recommendations.pick(candidates,{random}),second=Recommendations.pick(candidates,{previous:first,history:first,random});
  assert.equal(second.length,6);assert(!second.some(value=>first.some(prior=>Core.sameWork(prior,value))));
  const unseen=candidates.filter(value=>!first.concat(second).some(prior=>Core.sameWork(prior,value)));
  const third=Recommendations.pick(candidates,{previous:second,history:first.concat(second),random});
  assert(third.every(value=>unseen.some(fresh=>Core.sameWork(fresh,value))));
  const exhausted=Recommendations.pick(candidates,{previous:third,history:candidates,random});
  assert.equal(exhausted.length,6);assert(!exhausted.some(value=>third.some(prior=>Core.sameWork(prior,value))));
});

test('a strong genre preference changes sampling while allowing discoveries outside it',()=>{
  const candidates=Array.from({length:40},(_,i)=>book(i,{tags:[i<20?'fantasy':'thriller']}));
  const fantasy=Recommendations.profile([book('owned-fantasy',{tags:['fantasy']})]),thriller=Recommendations.profile([book('owned-thriller',{tags:['thriller']})]);
  let fantasyCount=0,thrillerCount=0,exploredOther=0;
  for(let seed=1;seed<=300;seed++){
    const first=Recommendations.pick(candidates,{profile:fantasy,count:1,random:rng(seed*7919)});
    const second=Recommendations.pick(candidates,{profile:thriller,count:1,random:rng(seed*7919)});
    fantasyCount+=Core.matchesTags(first[0],['fantasy']);thrillerCount+=Core.matchesTags(second[0],['fantasy']);exploredOther+=Core.matchesTags(first[0],['thriller']);
  }
  assert(fantasyCount>thrillerCount+70);assert(exploredOther>0);
});

test('a favourite author raises probability and a row keeps author variety where available',()=>{
  const candidates=Array.from({length:36},(_,i)=>book(i,{author:i<18?'Shared Author':'Writer '+i}));
  const taste=Recommendations.profile([book('owned',{author:'Shared Author'})]);
  let withTaste=0,neutral=0;
  for(let seed=1;seed<=180;seed++){
    withTaste+=Recommendations.pick(candidates,{profile:taste,count:1,random:rng(seed*7919)})[0].author==='Shared Author';
    neutral+=Recommendations.pick(candidates,{count:1,random:rng(seed*7919)})[0].author==='Shared Author';
  }
  assert(withTaste>neutral+15);
  const row=Recommendations.pick(candidates,{profile:taste,random:()=>0});
  assert.equal(row.length,6);assert(row.filter(value=>value.author==='Shared Author').length<=2);
});

test('the preferred language selects that exact edition without borrowing metadata',()=>{
  const cs=book(1,{id:'cs:1',isbn:'9788025359037',pages:400,coverUrl:'https://example.com/cs.jpg'});
  const en={...cs,id:'en:1',title:'English Story',isbn:'9780593334836',pages:384,language:'en',year:year-1,coverUrl:'https://example.com/en.jpg'};
  const taste=Recommendations.profile([book('owned',{language:'en'})]);
  const selected=Recommendations.pick([{...cs,editions:[cs,en]}],{profile:taste})[0];
  assert.equal(selected.id,en.id);assert.equal(selected.language,'en');assert.equal(selected.isbn,en.isbn);
  assert.equal(selected.pages,384);assert.equal(selected.year,en.year);assert.equal(selected.coverUrl,en.coverUrl);assert.equal(selected.editions.length,2);
});

test('discovery modes and the modern publication floor remain in force',()=>{
  const recent=book(1),ya=book(2,{tags:['young adult','fantasy']}),romantasy=book(3,{tags:['fantasy','romantika']}),old=book(4,{firstPublishYear:year-30,year});
  const missing=book(5,{year:null,firstPublishYear:null}),all=[recent,ya,romantasy,old,missing];
  assert.deepEqual(new Set(ids(Recommendations.pick(all))),new Set([recent.id,ya.id,romantasy.id]));
  assert.deepEqual(ids(Recommendations.pick(all,{mode:'ya'})),[ya.id]);
  assert.deepEqual(ids(Recommendations.pick(all,{mode:'romantasy'})),[romantasy.id]);
});

test('offline, empty, exhausted and tiny pools have unique results without manufactured books',()=>{
  assert.deepEqual(Recommendations.pick([]),[]);assert.deepEqual(Recommendations.pick(null),[]);
  const candidates=[book(1),book(2),book(3)],history=[...candidates];
  const picked=Recommendations.pick(candidates,{previous:candidates,history,random:()=>0});
  assert.equal(picked.length,3);assert.equal(new Set(ids(picked)).size,3);
  assert.deepEqual(Recommendations.pick(candidates,{profile:Recommendations.profile(candidates)}),[]);
  assert.deepEqual(Recommendations.pick(candidates,{count:0}),[]);
});

test('selection and profile do not mutate catalogue records, saved library or history',()=>{
  const saved=deepFreeze([book('saved',{language:'en'})]),candidates=deepFreeze([book(1),book(2)]);
  const previous=deepFreeze([book(1)]),history=deepFreeze([book(2)]),before=JSON.stringify({saved,candidates,previous,history});
  const taste=deepFreeze(Recommendations.profile(saved));
  assert.equal(Recommendations.pick(candidates,{profile:taste,previous,history}).length,2);
  assert.equal(JSON.stringify({saved,candidates,previous,history}),before);
});
