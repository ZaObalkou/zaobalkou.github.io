const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../book-core.js');

test('spaced and compact multiword tags select the same canonical theme',()=>{
 for(const input of ['#young adult','#youngadult','#YOUNG ADULT','#young\t adult']){
  assert.deepEqual(Core.parseSearchInput(input),{query:'',tags:['young adult'],unknownTags:[]});
 }
 assert.deepEqual(Core.parseSearchInput('#newadult #falesnyvztah #odrivalityklasce').tags,['new adult','falešný vztah','od rivality k lásce']);
 assert.deepEqual(Core.parseSearchInput('#FALEŠNÝ VZTAH #OD RIVALITY K LÁSCE').tags,['falešný vztah','od rivality k lásce']);
});

test('each hash starts a separate tag; spaces inside one phrase do not',()=>{
 assert.deepEqual(Core.parseSearchInput('Sarah J. Maas #young adult #fantasy'),{query:'Sarah J. Maas',tags:['young adult','fantasy'],unknownTags:[]});
 assert.deepEqual(Core.parseSearchInput('#young #adult'),{query:'',tags:[],unknownTags:['young','adult']});
 assert.deepEqual(Core.parseSearchInput('#fantasy romance').tags,['romantasy']);
 assert.deepEqual(Core.parseSearchInput('#fantasy #romance').tags,['fantasy','romantika']);
});

test('known aliases normalize without accepting extra unrelated words',()=>{
 assert.deepEqual(Core.parseSearchInput('#fake dating #enemiestolovers #sciencefiction #hockey #kralovstvi').tags,['falešný vztah','od rivality k lásce','sci-fi','hokej','království']);
 assert.deepEqual(Core.parseSearchInput('#fantasy nesmysl #young adult něco #romantika'),{query:'',tags:['romantika'],unknownTags:['fantasy nesmysl','young adult něco']});
});

test('unknown tags remain visible while repeated known themes are deduplicated',()=>{
 assert.deepEqual(Core.parseSearchInput('#youngadult #young adult #Želvy #zelvy #hokej #hockey'),{query:'',tags:['young adult','hokej'],unknownTags:['Želvy']});
 assert.deepEqual(Core.parseSearchInput('#constructor #__proto__ #!!!'),{query:'',tags:[],unknownTags:['constructor','__proto__','!!!']});
});

test('plain title or author queries remain intact and empty hashes are harmless',()=>{
 assert.deepEqual(Core.parseSearchInput('  Rod draků  '),{query:'Rod draků',tags:[],unknownTags:[]});
 assert.deepEqual(Core.parseSearchInput('young adult'),{query:'young adult',tags:[],unknownTags:[]});
 for(const input of ['',null,undefined,'# # ##'])assert.deepEqual(Core.parseSearchInput(input),{query:'',tags:[],unknownTags:[]});
});

test('canonical parsed tags retain AND filtering against real browsing metadata',()=>{
 const books=[
  {id:'a',title:'A',tags:['Young Adult Fiction / Fantasy']},
  {id:'b',title:'B',tags:['Young Adult Fiction / Romance']},
  {id:'c',title:'C',tags:['Fantasy']}
 ];
 const parsed=Core.parseSearchInput('#youngadult #fantasy');
 assert.deepEqual(books.filter(b=>Core.matchesTags(b,parsed.tags)).map(b=>b.id),['a']);
});
