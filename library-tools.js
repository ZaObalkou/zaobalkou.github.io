/* Local library transfer, book links and OOXML export. No account or server required. */
(function(root, factory){
  if(typeof module === 'object' && module.exports) module.exports = factory(require('./book-core.js'), require('./qrcodegen.js'));
  else root.LibraryTools = factory(root.BookCore, root.qrcodegen);
})(typeof window !== 'undefined' ? window : this, function(Core, QR){
  'use strict';
  var MAX_LINK = 60000, MAX_RAW = 2000000, MAX_BOOK_LINK = 2070, MAX_QR = 1800;
  var encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal:true});
  var bookFields = ['id','title','author','isbn','language','year','pages','series','seriesNumber','workId','olEditionId','coverUrl','firstPublishYear','yearKind','tags','aRating','aCount','olRating','olCount','gRating','gCount','grRating','grCount','grUrl','grCheckedAt','pageSource'];
  function fail(message){ throw new Error(message); }
  function baseURL(base){
    var url;
    try { url = new URL(base || 'https://zaobalkou.github.io/'); } catch(e){ fail('Adresa stránky není platná.'); }
    if(url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) fail('Odkaz musí používat bezpečnou adresu stránky.');
    url.hash = ''; url.search = ''; url.username = ''; url.password = '';
    return url.href;
  }
  function toBase64(bytes){
    var text = '';
    for(var i=0;i<bytes.length;i+=8192) text += String.fromCharCode.apply(null, bytes.subarray(i,i+8192));
    return btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function fromBase64(text, limit){
    if(typeof text !== 'string' || !text || text.length > limit || !/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) fail('Odkaz je neplatný nebo příliš dlouhý.');
    try {
      var binary = atob(text.replace(/-/g,'+').replace(/_/g,'/'));
      return Uint8Array.from(binary, function(c){return c.charCodeAt(0);});
    } catch(e){ fail('Odkaz se nepodařilo přečíst.'); }
  }
  function safeSnapshot(book){
    if(!book || typeof book !== 'object' || typeof book.id !== 'string' || !book.id || typeof book.title !== 'string' || !book.title.trim() || ['__proto__','prototype','constructor'].includes(book.id)) fail('Kniha nemá platné údaje.');
    return Core.snapshot(book);
  }
  function packedBook(book, withCover){
    var clean = safeSnapshot(book);
    return bookFields.map(function(field){
      if(field === 'coverUrl' && !withCover) return null;
      var value = clean[field];
      return value === undefined || value === '' || value === 0 ? null : value;
    });
  }
  function unpackBook(packed){
    if(!Array.isArray(packed) || packed.length > bookFields.length) fail('Odkaz obsahuje neplatné údaje knihy.');
    var book = {};
    bookFields.forEach(function(field,i){ if(packed[i] !== null && packed[i] !== undefined) book[field] = packed[i]; });
    return safeSnapshot(book);
  }
  function bookLink(book, base){
    var prefix = baseURL(base) + '#book=', values = packedBook(book,true).slice(0,15);
    function result(){ return prefix + toBase64(encoder.encode(JSON.stringify({v:1,b:values}))); }
    var url = result();
    if(url.length > MAX_BOOK_LINK){values[11] = null; values = values.slice(0,14); url = result();}
    if(url.length > MAX_BOOK_LINK){
      // Long display titles remain complete in Excel; a link only needs enough identity to reopen the edition.
      values[1] = String(values[1]).slice(0,100); values[2] = String(values[2] || '').slice(0,80);
      values[7] = null; values[8] = null; url = result();
    }
    if(url.length > MAX_BOOK_LINK) fail('Pro tuto knihu se nepodařilo vytvořit krátký odkaz.');
    return url;
  }
  function parseBookFragment(hash){
    if(typeof hash !== 'string' || !hash.startsWith('#book=')) return null;
    if(hash.length > 8192) fail('Odkaz na knihu je příliš dlouhý.');
    try {
      var data = JSON.parse(decoder.decode(fromBase64(hash.slice(6),8192)));
      if(!data || data.v !== 1) fail('Tato verze odkazu na knihu není podporována.');
      var book = unpackBook(data.b);
      // A public URL is untrusted input; source assertions and ratings must come
      // from the catalogue again, even if the link includes a plausible timestamp.
      ['a','ol','g','gr'].forEach(function(prefix){delete book[prefix+'Rating'];delete book[prefix+'Count'];});
      ['grUrl','grCheckedAt','verified','verifiedAt','source','pageSource'].forEach(function(field){delete book[field];});
      return book;
    } catch(e){ fail('Odkaz na knihu se nepodařilo přečíst.'); }
  }
  async function readBounded(stream, max){
    var reader = stream.getReader(), chunks = [], size = 0;
    try {
      for(;;){
        var chunk = await reader.read(); if(chunk.done) break;
        size += chunk.value.byteLength;
        if(size > max){ await reader.cancel(); fail('Knihovna v odkazu je příliš velká.'); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    var result = new Uint8Array(size), offset = 0;
    chunks.forEach(function(chunk){result.set(chunk,offset); offset += chunk.length;});
    return result;
  }
  function libraryPayload(library){
    var valid = Core.validateLibrary(library);
    return {v:1,k:'zaobalkou-library',b:Object.keys(valid).map(function(id){
      var entry = valid[id];
      return [packedBook(entry.book,true),entry.status,entry.page,entry.pages,!!entry.pagesManual];
    })};
  }
  async function transferLink(library, base){
    var payload = libraryPayload(library), bytes = encoder.encode(JSON.stringify(payload));
    if(!payload.b.length) fail('Nejdřív si přidej do knihovny alespoň jednu knihu.');
    if(bytes.length > MAX_RAW) fail('Knihovna je pro přenos odkazem příliš velká. Použij prosím zálohu do souboru.');
    var kind = 'u';
    if(typeof CompressionStream !== 'undefined'){
      var compressed = await readBounded(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),MAX_RAW);
      if(compressed.length < bytes.length){bytes = compressed; kind = 'g';}
    }
    var url = baseURL(base) + '#library=' + kind + toBase64(bytes);
    if(url.length > MAX_LINK) fail('Knihovna je pro přenos odkazem příliš velká. Použij prosím zálohu do souboru.');
    return {url:url,count:payload.b.length,qrSvg:qrSVG(url)};
  }
  async function parseLibraryFragment(hash){
    if(typeof hash !== 'string' || !hash.startsWith('#library=')) return null;
    if(hash.length > MAX_LINK) fail('Odkaz na knihovnu je příliš dlouhý.');
    var kind = hash.charAt(9), bytes = fromBase64(hash.slice(10),MAX_LINK);
    if(kind === 'g'){
      if(typeof DecompressionStream === 'undefined') fail('Pro otevření tohoto odkazu použij aktuální Chrome, Safari, Firefox nebo Edge.');
      try { bytes = await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),MAX_RAW); }
      catch(e){ fail(e.message === 'Knihovna v odkazu je příliš velká.' ? e.message : 'Odkaz na knihovnu je poškozený nebo neúplný.'); }
    } else if(kind !== 'u') fail('Tato verze odkazu na knihovnu není podporována.');
    if(bytes.length > MAX_RAW) fail('Knihovna v odkazu je příliš velká.');
    var payload;
    try { payload = JSON.parse(decoder.decode(bytes)); } catch(e){ fail('Odkaz na knihovnu je poškozený nebo neúplný.'); }
    if(!payload || payload.v !== 1 || payload.k !== 'zaobalkou-library' || !Array.isArray(payload.b) || payload.b.length > 5000) fail('Odkaz neobsahuje platnou knihovnu.');
    var library = Object.create(null);
    payload.b.forEach(function(row){
      if(!Array.isArray(row) || (row.length !== 4 && row.length !== 5)) fail('Odkaz obsahuje neplatnou položku knihovny.');
      var book = unpackBook(row[0]);
      if(Object.prototype.hasOwnProperty.call(library,book.id)) fail('Odkaz obsahuje opakované identifikátory knih.');
      library[book.id] = {book:book,status:row[1],page:row[2],pages:row[3],pagesManual:row[4]===true};
    });
    return Core.validateLibrary(library);
  }
  function qrSVG(text){
    if(!QR || typeof text !== 'string' || encoder.encode(text).length > MAX_QR) return null;
    try {
      var code = QR.QrCode.encodeSegments(QR.QrSegment.makeSegments(text),QR.QrCode.Ecc.MEDIUM,1,32);
      var border = 4, size = code.size + border * 2, path = [];
      for(var y=0;y<code.size;y++) for(var x=0;x<code.size;x++) if(code.getModule(x,y)) path.push('M'+(x+border)+','+(y+border)+'h1v1h-1z');
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="QR kód pro přenos knihovny" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="'+path.join('')+'" fill="#171717"/></svg>';
    } catch(e){return null;}
  }
  function xml(text){
    return String(text == null ? '' : text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }
  function textCell(ref,text,style){return '<c r="'+ref+'" t="inlineStr"'+(style?' s="'+style+'"':'')+'><is><t xml:space="preserve">'+xml(text)+'</t></is></c>';}
  var crcTable;
  function crc32(bytes){
    if(!crcTable){crcTable = new Uint32Array(256); for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;crcTable[n]=c;}}
    var crc = 0xFFFFFFFF; for(var i=0;i<bytes.length;i++) crc = crcTable[(crc^bytes[i])&255]^(crc>>>8);
    return (crc^0xFFFFFFFF)>>>0;
  }
  function zip(files){
    var chunks=[],central=[],offset=0,centralSize=0;
    function block(size){var bytes=new Uint8Array(size);return {bytes:bytes,view:new DataView(bytes.buffer)};}
    files.forEach(function(file){
      var name=encoder.encode(file[0]),data=encoder.encode(file[1]),crc=crc32(data),header=block(30+name.length),view=header.view;
      view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);view.setUint16(12,0x0021,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);header.bytes.set(name,30);
      chunks.push(header.bytes,data);
      var record=block(46+name.length),cv=record.view;
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(14,0x0021,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);record.bytes.set(name,46);central.push(record.bytes);centralSize+=record.bytes.length;offset+=header.bytes.length+data.length;
    });
    var end=block(22),ev=end.view;ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
    var result=new Uint8Array(offset+centralSize+22),position=0;
    chunks.concat(central,[end.bytes]).forEach(function(chunk){result.set(chunk,position);position+=chunk.length;});
    return result;
  }
  function seriesLabel(book){
    var name = typeof book.series === 'string' ? book.series : '';
    if(!name) return '';
    var number = book.seriesNumber;
    return name + (number !== null && number !== undefined && number !== '' ? ' · '+number+'. díl' : '');
  }
  function exportXlsx(library, base){
    var valid = Core.validateLibrary(library), entries = Object.keys(valid).map(function(id){return valid[id];});
    var mainNS='http://schemas.openxmlformats.org/spreadsheetml/2006/main',relNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships',pkgNS='http://schemas.openxmlformats.org/package/2006/relationships';
    var declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    var rows=['<row r="1" ht="24" customHeight="1">'+['Název knihy','Autor','Rok vydání','Série a díl'].map(function(label,i){return textCell('ABCD'[i]+'1',label,1);}).join('')+'</row>'],links=[],relations=[];
    entries.forEach(function(entry,i){
      var book=entry.book,r=i+2,url=bookLink(Object.assign({},book,{pages:entry.pages}),base),yr=Core.year(book.year);
      rows.push('<row r="'+r+'">'+textCell('A'+r,book.title,2)+textCell('B'+r,book.author)+(yr?'<c r="C'+r+'" t="n"><v>'+yr+'</v></c>':textCell('C'+r,''))+textCell('D'+r,seriesLabel(book))+'</row>');
      links.push('<hyperlink ref="A'+r+'" r:id="link'+r+'" tooltip="Otevřít knihu na Za obálkou"/>');
      relations.push('<Relationship Id="link'+r+'" Type="'+relNS+'/hyperlink" Target="'+xml(url)+'" TargetMode="External"/>');
    });
    var last=Math.max(1,entries.length+1);
    var files=[
      ['[Content_Types].xml',declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels',declaration+'<Relationships xmlns="'+pkgNS+'"><Relationship Id="rId1" Type="'+relNS+'/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml',declaration+'<workbook xmlns="'+mainNS+'" xmlns:r="'+relNS+'"><sheets><sheet name="Moje knihovna" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels',declaration+'<Relationships xmlns="'+pkgNS+'"><Relationship Id="rId1" Type="'+relNS+'/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="'+relNS+'/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml',declaration+'<styleSheet xmlns="'+mainNS+'"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><u/><sz val="11"/><color rgb="FF2457A7"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF743B31"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
      ['xl/worksheets/sheet1.xml',declaration+'<worksheet xmlns="'+mainNS+'" xmlns:r="'+relNS+'"><dimension ref="A1:D'+last+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/><cols><col min="1" max="1" width="52" customWidth="1"/><col min="2" max="2" width="30" customWidth="1"/><col min="3" max="3" width="15" customWidth="1"/><col min="4" max="4" width="40" customWidth="1"/></cols><sheetData>'+rows.join('')+'</sheetData><autoFilter ref="A1:D'+last+'"/>'+(links.length?'<hyperlinks>'+links.join('')+'</hyperlinks>':'')+'</worksheet>'],
      ['xl/worksheets/_rels/sheet1.xml.rels',declaration+'<Relationships xmlns="'+pkgNS+'">'+relations.join('')+'</Relationships>']
    ];
    return zip(files);
  }
  return {bookLink:bookLink,parseBookFragment:parseBookFragment,transferLink:transferLink,parseLibraryFragment:parseLibraryFragment,qrSVG:qrSVG,exportXlsx:exportXlsx,seriesLabel:seriesLabel,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',limits:{transferURL:MAX_LINK,qrBytes:MAX_QR}};
});
