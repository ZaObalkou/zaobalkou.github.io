'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const zlib = require('node:zlib');
const Tools = require('../library-tools.js');
function example(id, language='cs'){
  return {id,title:'Rod draků & tajemství <příběhu>',author:'Čtenář Žluťoučký',year:2024,pages:384,language,isbn:language==='cs'?'9788027724282':'9780000000002',series:'Království & křídla',seriesNumber:2,workId:'OL12345W'};
}
function library(){return {'cs-edition':{book:example('cs-edition'),status:'reading',page:47,pages:384,pagesManual:true},'en-edition':{book:example('en-edition','en'),status:'want',page:0,pages:384}};}
function envelope(payload, compressed=false){
  const bytes=Buffer.from(JSON.stringify(payload));
  return '#library='+(compressed?'g':'u')+(compressed?zlib.gzipSync(bytes):bytes).toString('base64url');
}
test('book links preserve Unicode, metadata, and selected language; unrelated fragments are ignored',()=>{
  const url=Tools.bookLink(example('en-edition','en'));
  assert.ok(url.startsWith('https://zaobalkou.github.io/#book='));
  const book=Tools.parseBookFragment(new URL(url).hash);
  assert.equal(book.title,example('en-edition').title);
  assert.equal(book.language,'en');
  assert.equal(book.pages,384);
  assert.equal(book.isbn,'9780000000002');
  assert.equal(Tools.parseBookFragment('#other'),null);
});
test('public book URLs cannot assert fabricated provider ratings or source verification',()=>{
  const payload={v:1,b:['fake','Kniha','Autor',null,'en',2025,200,null,null,null,null,null,2025,'edition',[],4.8,10,4.7,20,4.6,30,4.9,100,'https://www.goodreads.com/book/show/123','2026-09-10','Invented publisher']};
  const book=Tools.parseBookFragment('#book='+Buffer.from(JSON.stringify(payload)).toString('base64url'));
  for(const field of ['aRating','aCount','olRating','olCount','gRating','gCount','grRating','grCount','grUrl','grCheckedAt','verified','verifiedAt','source','pageSource'])assert.equal(field in book,false);
  const original=example('real');Object.assign(original,{gRating:4.5,gCount:25});
  const url=Tools.bookLink(original);const packed=JSON.parse(Buffer.from(new URL(url).hash.slice(6),'base64url').toString());
  assert.equal(packed.b.length,15);
});
test('book links reject hostile protocols, malformed data, and oversized links',()=>{
  assert.throws(()=>Tools.bookLink(example('one'),'javascript:alert(1)'));
  assert.throws(()=>Tools.parseBookFragment('#book=abc!'));
  assert.throws(()=>Tools.parseBookFragment('#book='+'a'.repeat(8192)));
  assert.throws(()=>Tools.parseBookFragment('#book='+Buffer.from('{"v":1,"b":["__proto__","Title"]}').toString('base64url')));
  const withSecret=Tools.bookLink(example('one'),'https://name:secret@zaobalkou.github.io/?token=abc');
  assert.ok(!withSecret.includes('secret') && !withSecret.includes('token='));
});
test('transfer round-trips reading progress and distinct language editions without any network',async()=>{
  const transfer=await Tools.transferLink(library());
  assert.equal(transfer.count,2);
  assert.ok(transfer.qrSvg.startsWith('<svg'));
  const restored=await Tools.parseLibraryFragment(new URL(transfer.url).hash);
  assert.equal(Object.keys(restored).length,2);
  assert.equal(restored['cs-edition'].page,47);
  assert.equal(restored['cs-edition'].pagesManual,true);
  assert.equal(restored['cs-edition'].book.series,'Království & křídla');
  assert.equal(String(restored['cs-edition'].book.seriesNumber),'2');
  assert.equal(restored['en-edition'].book.language,'en');
  assert.equal(restored['en-edition'].book.title,example('en-edition').title);
  assert.equal(await Tools.parseLibraryFragment('#book=anything'),null);
});
test('link creation falls back to uncompressed data on browsers without CompressionStream',async()=>{
  const original=globalThis.CompressionStream;
  try {
    globalThis.CompressionStream=undefined;
    const transfer=await Tools.transferLink(library());
    assert.ok(transfer.url.includes('#library=u'));
    assert.equal(Object.keys(await Tools.parseLibraryFragment(new URL(transfer.url).hash)).length,2);
  } finally {globalThis.CompressionStream=original;}
});
test('library transfer retains the complete Goodreads source metadata needed by validation',async()=>{
  const input=library();Object.assign(input['cs-edition'].book,{grRating:4.2,grCount:123,grUrl:'https://www.goodreads.com/book/show/123',grCheckedAt:'2026-09-10'});
  const transfer=await Tools.transferLink(input);const restored=await Tools.parseLibraryFragment(new URL(transfer.url).hash);
  assert.equal(restored['cs-edition'].book.grRating,4.2);
  assert.equal(restored['cs-edition'].book.grCheckedAt,'2026-09-10T00:00:00.000Z');
});
test('uncompressed links also import and completed progress is clamped',async()=>{
  const raw={v:1,k:'zaobalkou-library',b:[[['one','Kniha','Autor',null,'en',2025,200],'read',900,200]]};
  const restored=await Tools.parseLibraryFragment(envelope(raw));
  assert.equal(restored.one.page,200);
});
test('malformed transfer entries, duplicates, prototype keys and truncated streams fail safely',async()=>{
  await assert.rejects(()=>Tools.parseLibraryFragment('#library=u'+'a'.repeat(60000)));
  await assert.rejects(()=>Tools.parseLibraryFragment('#library=gYWJj'));
  await assert.rejects(()=>Tools.parseLibraryFragment(envelope({v:2,k:'zaobalkou-library',b:[]})));
  const row=[['one','Kniha','Autor'],'reading',10,100];
  await assert.rejects(()=>Tools.parseLibraryFragment(envelope({v:1,k:'zaobalkou-library',b:[row,row]})));
  await assert.rejects(()=>Tools.parseLibraryFragment(envelope({v:1,k:'zaobalkou-library',b:[[['__proto__','Kniha','Autor'],'want',0,100]]})));
  await assert.rejects(()=>Tools.transferLink({}));
});
test('decompression limits prevent a small compressed link expanding without bound',async()=>{
  const bytes=zlib.gzipSync(Buffer.alloc(2000001,32));
  await assert.rejects(()=>Tools.parseLibraryFragment('#library=g'+bytes.toString('base64url')),/příliš velká/);
});
test('large QR payload returns null without truncating the transfer link',async()=>{
  assert.equal(Tools.qrSVG('a'.repeat(1801)),null);
  const many={};
  for(let i=0;i<60;i++){const book=example('book-'+i);book.title=Array.from({length:100},(_,j)=>String.fromCharCode(33+(i*31+j*7)%80)).join('');many[book.id]={book,status:'want',page:0,pages:384};}
  const transfer=await Tools.transferLink(many);
  assert.equal(transfer.count,60);
  assert.equal(Object.keys(await Tools.parseLibraryFragment(new URL(transfer.url).hash)).length,60);
});
test('XLSX is a valid ZIP workbook, has four columns, native hyperlinks and no executable cell formulas',()=>{
  const books=library();books['cs-edition'].book.title='=HYPERLINK("https://evil.example", "text") & <tag>';
  const bytes=Tools.exportXlsx(books);
  assert.ok(bytes instanceof Uint8Array);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zaobalkou-xlsx-'));
  const file=path.join(dir,'library.xlsx');fs.writeFileSync(file,bytes);
  try {
    const result=spawnSync('python',['-c',`
import sys, zipfile, xml.etree.ElementTree as ET
from openpyxl import load_workbook
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None
 for name in z.namelist(): ET.fromstring(z.read(name))
w=load_workbook(p)
s=w.active
assert s.max_column == 4 and s.max_row == 3
assert s['A2'].data_type == 's' and s['A2'].value.startswith('=HYPERLINK')
assert s['A2'].hyperlink.target.startswith('https://zaobalkou.github.io/#book=')
assert s['B2'].value == 'Čtenář Žluťoučký'
assert s['C2'].value == 2024
assert s['D2'].value == 'Království & křídla · 2. díl'
assert s.freeze_panes == 'A2'
assert s.auto_filter.ref == 'A1:D3'
print('Valid workbook: Unicode, ZIP CRC, four columns, native hyperlinks and typed strings.')
`,file],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
