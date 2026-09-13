'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const BookShelf=require('../bookshelf.js');

function buttons(html){return [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match=>match[0]);}

test('each language edition opens directly from its only spine button',()=>{
 const books=[
  {id:'seed:9788025359037',title:'Rod draků',author:'Jessica Cluess',language:'cs',pages:400},
  {id:'seed:9780525648154',title:'House of Dragons',author:'Jessica Cluess',language:'en',pages:448}
 ];
 const html=BookShelf.render(books,{status:'want'}),controls=buttons(html);
 assert.equal(controls.length,books.length);
 books.forEach((book,index)=>{
  assert.match(controls[index],/class="shelf-spine"/);
  assert.match(controls[index],/data-action="open"/);
  assert(controls[index].includes('data-id="'+book.id+'"'));
 });
 assert.doesNotMatch(html,/data-action="shelf-preview"|class="shelf-open"|aria-expanded=/);
 const previews=[...html.matchAll(/<div\b[^>]*class="shelf-preview"[^>]*>/g)].map(match=>match[0]);
 assert.equal(previews.length,books.length);
 previews.forEach(preview=>assert.match(preview,/aria-hidden="true"/));
});

test('catalogue text and edition identifiers cannot introduce markup or another action',()=>{
 const id='isbn:" onfocus="alert(1)',title='<img src=x onerror=alert(1)> & "Kniha"',author='<script>alert(1)</script>';
 const html=BookShelf.render([{id,title,author,language:'cs"><svg onload=alert(1)>'}],{status:'want'});
 assert.equal(buttons(html).length,1);
 assert(html.includes('data-id="isbn:&quot; onfocus=&quot;alert(1)"'));
 assert(html.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;Kniha&quot;'));
 assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
 assert.doesNotMatch(html,/<(?:script|img|svg)\b/);
});

test('decorative previews retain page progress without an extra open control',()=>{
 const html=BookShelf.render([
  {id:'a',title:'Rozečtená',pages:536,page:123},
  {id:'b',title:'Dočtená',pages:100,page:900},
  {id:'c',title:'Bez počtu stran',pages:0,page:27}
 ],{status:'reading'});
 assert.match(html,/123 \/ 536 stran/);
 assert.match(html,/100 \/ 100 stran/);
 assert.match(html,/27 přečtených stran/);
 assert.equal(buttons(html).length,3);
});

test('spine artwork uses the supplied image renderer independently of the front preview',()=>{
 const seen=[],book={id:'edition:1',title:'Kniha',coverUrl:'https://example.org/cover.jpg'};
 const spine='<img src="https://example.org/cover.jpg" alt="" data-cover="1">';
 const front='<div class="cover"><img src="https://example.org/front.jpg" alt=""></div>';
 const html=BookShelf.render([book],{
  spineImageHTML(value){seen.push(value);return spine;},
  coverHTML(value){assert.equal(value,book);return front;}
 });
 assert.deepEqual(seen,[book]);
 assert(html.includes(spine));
 assert(html.includes(front));
 assert(buttons(html)[0].includes(spine));
});

test('books without artwork keep a readable spine and empty shelves render safely',()=>{
 for(const options of [{},{spineImageHTML:()=>''}]){
  const html=BookShelf.render([{id:'a',pages:0}],options);
  assert.match(html,/Kniha bez názvu/);
  assert.match(html,/Autor neuveden/);
  assert.equal(buttons(html).length,1);
  assert.doesNotMatch(html,/<img\b|undefined|NaN|Infinity/);
 }
 for(const value of [null,undefined,[],[null,{},false]]){
  const html=BookShelf.render(value);
  assert.equal(buttons(html).length,0);
  assert.doesNotMatch(html,/undefined|NaN|Infinity/);
 }
});

test('page counts give long books a wider spine and short books a lower height',()=>{
 const size=pages=>{const html=BookShelf.render([{id:'same',title:'Kniha',pages}]);return {width:Number(html.match(/--spine-width:(\d+)px/)[1]),height:Number(html.match(/--spine-height:(\d+)px/)[1])};};
 const short=size(100),long=size(800),unknown=size(0),huge=size(1000000);
 assert(long.width>short.width*1.5);assert(long.width<short.width*3);assert(short.height<long.height);
 assert(size(199).height<size(200).height);assert(unknown.width>=short.width&&unknown.width<long.width);assert(huge.width<=100);
 assert.deepEqual(size(NaN),unknown);assert.deepEqual(size(Infinity),unknown);
});
