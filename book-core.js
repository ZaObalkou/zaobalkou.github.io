/* Pure catalogue and persistence rules. Browser + Node, no dependencies. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.BookCore=factory();
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var BAD_KEYS=['__proto__','constructor','prototype'];
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
  function integer(v,max){var n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(max||100000,Math.floor(n))):0;}
  function year(v){var n=integer(v,9999);return n>=1000&&n<=new Date().getFullYear()?n:null;}
  function safeURL(v){try{var u=new URL(String(v));return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=4096?u.href:'';}catch(e){return '';}}
  function goodreadsURL(v){var url=safeURL(v);if(!url)return '';var u=new URL(url);return /^(www\.)?goodreads\.com$/.test(u.hostname)&&/^\/book\/show\/\d+(?:[./\-]|$)/.test(u.pathname)?url:'';}
  function checkedAt(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v))return '';var t=Date.parse(v);return Number.isFinite(t)&&t<=Date.now()+86400000?new Date(t).toISOString():'';}
  function language(v){
    var n=String(v||'').toLowerCase().trim(),codes={eng:'en',cze:'cs',ces:'cs',slo:'sk',slk:'sk',ger:'de',deu:'de',fre:'fr',fra:'fr',spa:'es',ita:'it',pol:'pl',por:'pt',dut:'nl',nld:'nl',rus:'ru',ukr:'uk',swe:'sv',dan:'da',nor:'no',fin:'fi',hun:'hu',rum:'ro',ron:'ro',jpn:'ja',kor:'ko',chi:'zh',zho:'zh',ara:'ar',heb:'he',tur:'tr',gre:'el',ell:'el',hrv:'hr',srp:'sr',bul:'bg',slv:'sl',vie:'vi',tha:'th',ind:'id'};
    return /^[a-z]{2}$/.test(n)?n:codes[n]||'';
  }
  function list(v,max,len){return(Array.isArray(v)?v:[]).filter(function(x){return typeof x==='string'&&x.trim();}).slice(0,max||20).map(function(x){return x.trim().slice(0,len||500);});}
  function unique(v){return Array.from(new Set(v.filter(Boolean)));}
  function authorKey(v){return norm(v).replace(/ova\b/g,'').replace(/\s/g,'');}
  function key(b){return norm(b.title)+'|'+authorKey(b.author);}
  function isbn(v){var n=String(v||'').replace(/[\s-]/g,'').toUpperCase();return /^(?:\d{9}[\dX]|\d{13})$/.test(n)?n:'';}
  function workKey(b){var v=String(b.workId||b.olWorkId||'');if(!v&&/^ol:(?:\/works\/)?OL\d+W$/i.test(b.id||''))v=b.id;var ol=v.match(/(?:^|[:/])(OL\d+W)$/i);return ol?'ol:'+ol[1].toUpperCase():v.slice(0,200);}
  function titleKeys(b){return unique([b.title].concat(list(b.aliases)).map(norm));}
  function authorKeys(b){return unique([b.author].concat(list(b.authorAliases)).map(authorKey)).filter(function(v){return v&&v!==authorKey('Neznámý autor');});}
  function intersects(a,b){return a.some(function(v){return b.includes(v);});}
  function sameWork(a,b){return !!(a&&b&&((isbn(a.isbn)&&isbn(a.isbn)===isbn(b.isbn))||(workKey(a)&&workKey(a)===workKey(b))||(intersects(titleKeys(a),titleKeys(b))&&intersects(authorKeys(a),authorKeys(b)))));}
  function sameBook(a,b){
    if(!a||!b)return false;var ia=isbn(a.isbn),ib=isbn(b.isbn);if(ia&&ib)return ia===ib;
    if(a.id&&a.id===b.id)return true;
    if((a.olEditionId&&a.olEditionId===b.olEditionId)||(a.editionId&&a.editionId===b.editionId))return true;
    var la=language(a.language),lb=language(b.language);if(la!==lb)return false;
    if(!sameWork(a,b))return false;
    if((!la||!lb)&&norm(a.title)!==norm(b.title))return false;
    if((a.yearKind==='original')!==(b.yearKind==='original'))return false;
    if(a.yearKind!=='original'&&b.yearKind!=='original'&&year(a.year)&&year(b.year)&&year(a.year)!==year(b.year))return false;return true;
  }
  // Borrow images only from the same edition, never from another translation.
  function coverCandidates(b, books, big){
    var matches=(books||[]).filter(function(other){return sameBook(b,other);});
    var urls=[];[b].concat(matches).forEach(function(other){
      urls.push(big?other.coverUrlL:other.coverUrl,big?other.coverUrl:other.coverUrlL);
    });
    var number=isbn(b.isbn);
    if(number)urls.push('https://covers.openlibrary.org/b/isbn/'+number+(big?'-L':'-M')+'.jpg?default=false');
    return unique(urls.map(safeURL)).slice(0,6);
  }
  function validRating(v){return typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=5;}
  function hasGoodreads(b){return validRating(b.grRating)&&integer(b.grCount,1000000000)>0&&!!goodreadsURL(b.grUrl)&&!!checkedAt(b.grCheckedAt);}
  function rating(b){
    if(hasGoodreads(b))return{value:b.grRating,count:integer(b.grCount,1000000000),source:'Goodreads',url:goodreadsURL(b.grUrl),checkedAt:checkedAt(b.grCheckedAt)};
    var choices=['a','ol','g'].filter(function(p){return validRating(b[p+'Rating']);});choices.sort(function(a,c){return integer(b[c+'Count'],1000000000)-integer(b[a+'Count'],1000000000);});
    var p=choices[0];return p?{value:b[p+'Rating'],count:integer(b[p+'Count'],1000000000),source:{a:'Apple Books',ol:'Open Library',g:'Google Books'}[p]}:null;
  }
  // Stable browsing themes, not raw publisher taxonomy. Description matches use explicit phrases.
  var TAG_RULES=[
    ['romantika',/\b(romance|romantic|romantika|romanticke|romanticky|romantasy|love stories)\b/,/\b(romance|romantic|romantick\p{L}*|zamilov\p{L}*)\b/u],
    ['hokej',/\b(hockey|ice hockey|hokej\p{L}*)\b/u,/\b(hockey|hokej\p{L}*)\b/u],
    ['falešný vztah',/\b(fake dating|fake relationship|pretend relationship|falesny vztah|predstiran\p{L}* vztah)\b/u,/\b(fake dating|fake relationship|pretend relationship|falesny vztah|predstiran\p{L}* vztah)\b/u],
    ['od rivality k lásce',/\b(enemies to lovers|rivals to lovers|od rivality k lasce|od nenavisti k lasce)\b/,/\b(enemies to lovers|rivals to lovers|od nenavisti k lasce)\b/],
    ['romantasy',/\b(romantasy|romantic fantasy|fantasy romance)\b/,/\bromantasy\b/],
    ['fantasy',/\b(fantasy|fantastika|romantasy)\b/,/\b(fantasy|romantasy)\b/],
    ['drak',/\b(dragon\p{L}*|drak|draci|draku|draky|dracich)\b/u,/\b(dragon\p{L}*|draci|draku|draky|dracich|dracimi|drakem|drak)\b/u],
    ['království',/\b(kingdom\p{L}*|royalty|kings|queens|princes|princesses|kralovstvi|kralovske|panovnici|court intrigue)\b/u,/\b(kingdom\p{L}*|royal court|throne|kralovstv\p{L}*|kralovsk\p{L}* dvur|trunu|princezna|princ|kralovna)\b/u],
    ['magie',/\b(magic\p{L}*|magie|kouzla|kouzelni\p{L}*|sorcery|wizards)\b/u,/\b(magic\p{L}*|magie|magii|kouzel\p{L}*|kouzla|carodej\p{L}*)\b/u],
    ['víly',/\b(fairies|faeries|fae|vily|elfove|elves)\b/,/\b(fairies|faeries|fae|vily|vilami|vilich|vili|elfove)\b/],
    ['čarodějnice',/\b(witches|witchcraft|carodejnice)\b/,/\b(witches|witchcraft|carodejnic\p{L}*)\b/u],
    ['upíři',/\b(vampir\p{L}*|upir\p{L}*)\b/u,/\b(vampir\p{L}*|upir\p{L}*)\b/u],
    ['vlkodlaci',/\b(werewolves|werewolf|vlkodla\p{L}*)\b/u,/\b(werewolves|werewolf|vlkodla\p{L}*)\b/u],
    ['sci-fi',/\b(science fiction|sci fi|vedeckofantastick\p{L}*)\b/u,/\b(science fiction|sci fi)\b/],
    ['dystopie',/\b(dystopi\p{L}*|post apocalyp\p{L}*)\b/u,/\b(dystopi\p{L}*|post apocalyp\p{L}*)\b/u],
    ['dobrodružství',/\b(adventure|dobrodruz\p{L}*)\b/u,/\bdobrodruz\p{L}*\b/u],
    ['detektivka',/\b(detective|detektiv\p{L}*|mystery|mysteries|crime fiction)\b/u,/\b(detektiv\p{L}*|murder mystery)\b/u],
    ['thriller',/\b(thrillers?|napinave)\b/,/\bthrillers?\b/],
    ['horor',/\b(horror|horor\p{L}*)\b/u,/\b(horror|horor\p{L}*)\b/u],
    ['historie',/\b(historical fiction|historick\p{L}*|historie)\b/u,/\bhistorick\p{L}* roman\b/u],
    ['pohádky',/\b(fairy tales|fairytales|pohadk\p{L}*|retellings?)\b/u,/\b(fairy tale retelling|pohadk\p{L}*)\b/u],
    ['les',/\b(forests?|woodlands?|les|lesy|lesa)\b/,/\b(forest|woodland|hvozdu|lesa|lese|lesni)\b/],
    ['zima',/\b(winter|zima|zimni|snow)\b/,/\b(winter|zimni|zasnezen\p{L}*)\b/u],
    ['hvězdy',/\b(stars|hvezdy)\b/],
    ['škola',/\b(school|schools|high school|boarding school|college|university|skola|skoly|akademie)\b/,/\b(high school|boarding school|college|university|stredni skole|internat\p{L}*|akademi\p{L}*)\b/u],
    ['sport',/\b(sports?|sportovni|athletes)\b/],
    ['young adult',/\b(young adults?|ya fiction|literatura pro mladez|pro dospivajici)\b/],
    ['new adult',/\b(new adult|college romance)\b/],
    ['dětské',/\b(juvenile|children|kids|detske|pro deti)\b/]
  ];
  function canonicalTag(v){var n=norm(v),i;for(i=0;i<TAG_RULES.length;i++)if(norm(TAG_RULES[i][0])===n)return TAG_RULES[i][0];for(i=0;i<TAG_RULES.length;i++)if(TAG_RULES[i][1].test(n))return TAG_RULES[i][0];return '';}
  function normalizeTags(b){
    var raw=norm(list(b.tags,100,200).concat(list(b.subjects,100,200)).join(' | ')),desc=norm(String(b.desc||'').replace(/<[^>]*>/g,' ').slice(0,20000));
    var found=TAG_RULES.filter(function(r){return r[1].test(raw)||(r[2]&&r[2].test(desc));}).map(function(r){return r[0];});
    if(found.includes('romantasy')){if(!found.includes('romantika'))found.unshift('romantika');if(!found.includes('fantasy'))found.push('fantasy');}
    if(found.includes('young adult'))found=found.filter(function(t){return t!=='dětské';});
    if(found.includes('hokej'))found=found.filter(function(t){return t!=='sport';});return unique(found).slice(0,12);
  }
  function matchesTags(b,terms){var tags=normalizeTags(b);return(terms||[]).every(function(t){var tag=canonicalTag(t);if(norm(t)==='romantasy')return tags.includes('romantasy')||(tags.includes('fantasy')&&tags.includes('romantika'));return !!tag&&tags.includes(tag);});}
  function copyBook(b){var out={};Object.keys(b).forEach(function(k){if(!BAD_KEYS.includes(k)&&k!=='editions')out[k]=b[k];});return out;}
  function mergePair(target,b){
    ['pages','pageSource','coverUrl','coverUrlL','desc','link','isbn','language','firstPublishYear','year','yearKind','workId','olWorkId','olEditionId','series','seriesNumber','publisher','editionId','format','metadataSource'].forEach(function(k){if(!target[k]&&b[k])target[k]=b[k];});
    ['a','ol','g'].forEach(function(p){if(validRating(b[p+'Rating'])&&(!validRating(target[p+'Rating'])||integer(b[p+'Count'],1000000000)>integer(target[p+'Count'],1000000000))){target[p+'Rating']=b[p+'Rating'];target[p+'Count']=b[p+'Count'];}});
    if(hasGoodreads(b)&&(!hasGoodreads(target)||Date.parse(b.grCheckedAt)>Date.parse(target.grCheckedAt)))['grRating','grCount','grUrl','grCheckedAt'].forEach(function(k){target[k]=b[k];});
    target.tags=unique(list(target.tags,100,200).concat(list(b.tags,100,200))).slice(0,100);
    target.aliases=unique(list(target.aliases).concat(list(b.aliases))).slice(0,20);target.authorAliases=unique(list(target.authorAliases).concat(list(b.authorAliases))).slice(0,20);
    target.metadataSources=(Array.isArray(target.metadataSources)?target.metadataSources:[]).concat(Array.isArray(b.metadataSources)?b.metadataSources:[]).slice(0,20);return target;
  }
  function signatures(b){var out=[];if(b.id)out.push('id:'+String(b.id));if(b.olEditionId)out.push('ole:'+String(b.olEditionId));if(b.editionId)out.push('edition:'+String(b.editionId));if(isbn(b.isbn))out.push('i:'+isbn(b.isbn));if(workKey(b))out.push('w:'+workKey(b));titleKeys(b).forEach(function(t){authorKeys(b).forEach(function(a){out.push('t:'+t+'|'+a);});});return out;}
  function merge(lists){
    var out=[],index=new Map();(lists||[]).forEach(function(books){(books||[]).forEach(function(b){
      if(!b||typeof b.id!=='string'||!b.title)return;var sig=signatures(b),candidates=[];sig.forEach(function(s){candidates=candidates.concat(index.get(s)||[]);});
      var match=unique(candidates).find(function(existing){return sameBook(existing,b);});if(match)mergePair(match,b);else{match=copyBook(b);out.push(match);}
      signatures(match).concat(sig).forEach(function(s){var bucket=index.get(s)||[];if(!bucket.includes(match))bucket.push(match);index.set(s,bucket);});
    });});return out;
  }
  function linkCatalogue(books,seeds){
    return(books||[]).map(function(b){var out=copyBook(b);(seeds||[]).forEach(function(seed){
      if(!sameWork(out,seed))return;out.workId=seed.workId||out.workId||seed.id;
      out.aliases=unique([].concat(list(out.aliases),seed.title,list(seed.aliases))).filter(function(t){return t!==out.title;}).slice(0,20);
      out.authorAliases=unique([].concat(list(out.authorAliases),seed.author,list(seed.authorAliases))).filter(function(a){return a!==out.author;}).slice(0,20);
      out.tags=unique(list(seed.tags,100,200).concat(list(out.tags,100,200))).slice(0,100);
      ['firstPublishYear','series','seriesNumber'].forEach(function(k){if(!out[k]&&seed[k])out[k]=seed[k];});
      var exactISBN=isbn(out.isbn)&&isbn(out.isbn)===isbn(seed.isbn);
      var exactTitle=norm(out.title)&&norm(out.title)===norm(seed.title);
      // An untranslated work match does not identify an edition. Never fill Czech
      // page counts or language onto an English title simply because it is an alias.
      if(sameBook(out,seed)&&(exactISBN||(exactTitle&&out.yearKind!=='original'&&seed.yearKind!=='original')))mergePair(out,seed);
    });out.tags=normalizeTags(out);return out;});
  }
  function relevance(b,query){
    var q=norm(query);if(!q)return 0;if(isbn(b.isbn)&&isbn(query)===isbn(b.isbn))return 6;
    var titles=titleKeys(b),authors=[b.author].concat(list(b.authorAliases)).map(norm);if(titles.includes(q))return 6;
    if(authors.some(function(a){return a===q||authorKey(a)===authorKey(q);}))return 5;
    if(titles.some(function(t){return t.startsWith(q);}))return 4;if(titles.some(function(t){return t.includes(q);})||authors.some(function(a){return a.includes(q);}))return 3;
    var text=titles.concat(authors).join(' ');if(q.split(' ').every(function(t){return text.includes(t);}))return 2;
    if(matchesTags(b,[query])||q.split(' ').every(function(t){return(text+' '+norm(normalizeTags(b).join(' '))).includes(t);}))return 1;return 0;
  }
  function rank(books,options){
    var o=options||{},now=o.now||new Date().getFullYear();function date(b){return year(b.firstPublishYear)||year(b.year)||0;}function editionDate(b){return year(b.year)||0;}
    function score(b){var y=date(b),age=y?now-y:100,tags=normalizeTags(b),recent=age<=3?30:age<=7?22:age<=12?12:0,audience=tags.includes('young adult')?12:tags.some(function(t){return['romantasy','romantika','fantasy'].includes(t);})?7:0,r=rating(b),popularity=r?Math.min(6,Math.log10(r.count+1)*2):0;return recent+audience+(language(b.language)==='cs'?8:0)+(b.verified===true?12:0)+popularity;}
    return(books||[]).filter(function(b){var y=date(b);if(o.era==='recent'&&(!y||y<now-5))return false;if(o.era==='modern'&&(!y||y<now-10))return false;if(o.language&&o.language!=='all'&&language(b.language)!==language(o.language))return false;if(o.year&&o.year!=='all'&&editionDate(b)!==Number(o.year))return false;if(o.tags&&!matchesTags(b,o.tags))return false;return true;}).slice().sort(function(a,b){
      if(o.sort==='newest')return editionDate(b)-editionDate(a)||relevance(b,o.query)-relevance(a,o.query)||key(a).localeCompare(key(b));
      if(o.sort==='rating'){var ra=rating(a),rb=rating(b);return((rb?(rb.value*rb.count+35)/(rb.count+10):0)-(ra?(ra.value*ra.count+35)/(ra.count+10):0))||score(b)-score(a);}
      return relevance(b,o.query)-relevance(a,o.query)||score(b)-score(a)||key(a).localeCompare(key(b));
    });
  }
  function groupWorks(books,options){
    var groups=[],index=new Map(),editions=merge([books]);editions.forEach(function(b){
      var sig=signatures(b),found=[];sig.forEach(function(s){var g=index.get(s);if(g&&!found.includes(g))found.push(g);});found=found.filter(function(g){return g.some(function(other){return sameWork(other,b);});});
      var group=found[0];if(!group){group=[];groups.push(group);}found.slice(1).forEach(function(other){other.forEach(function(item){group.push(item);signatures(item).forEach(function(s){index.set(s,group);});});groups.splice(groups.indexOf(other),1);});group.push(b);sig.forEach(function(s){index.set(s,group);});
    });
    var representatives=groups.map(function(group){
      var filtered=rank(group,options);if(!filtered.length)return null;
      // Open Library rates the work, while Apple and Google rate specific records.
      var workRating=group.filter(function(b){return validRating(b.olRating);}).sort(function(a,b){return integer(b.olCount,1000000000)-integer(a.olCount,1000000000);})[0];
      function editionCopy(b){var edition=copyBook(b);edition.tags=normalizeTags(edition);if(workRating){edition.olRating=workRating.olRating;edition.olCount=integer(workRating.olCount,1000000000);}return edition;}
      var selected=editionCopy(filtered[0]);selected.editions=rank(group,{query:options&&options.query}).map(editionCopy);return selected;
    }).filter(Boolean);return rank(representatives,options);
  }
  function snapshot(b){
    b=b||{};var out={id:String(b.id||'').slice(0,200),title:String(b.title||'').slice(0,500),author:String(b.author||'Neznámý autor').slice(0,500)};
    out.pages=integer(b.pages);out.year=year(b.year);out.firstPublishYear=year(b.firstPublishYear);out.yearKind=b.yearKind==='original'?'original':'edition';out.language=language(b.language);
    out.tags=normalizeTags(b);out.aliases=list(b.aliases,20,500);out.authorAliases=list(b.authorAliases,20,500);out.desc=String(b.desc||'').slice(0,20000);out.isbn=isbn(b.isbn);
    ['coverUrl','coverUrlL','link'].forEach(function(k){out[k]=safeURL(b[k]);});
    ['workId','olWorkId','olEditionId','editionId','pageSource','publisher','format','metadataSource'].forEach(function(k){if(typeof b[k]==='string')out[k]=b[k].slice(0,k==='pageSource'?500:200);});
    if(typeof b.source==='string')out.source=b.source.slice(0,100);if(typeof b.verified==='boolean')out.verified=b.verified;if(checkedAt(b.verifiedAt))out.verifiedAt=checkedAt(b.verifiedAt);
    if(typeof b.series==='string')out.series=b.series.slice(0,500);if(typeof b.seriesNumber==='number'&&Number.isFinite(b.seriesNumber)&&b.seriesNumber>=0&&b.seriesNumber<10000)out.seriesNumber=b.seriesNumber;else if(typeof b.seriesNumber==='string'&&/^\d{1,4}(?:[.,]\d{1,2})?$/.test(b.seriesNumber))out.seriesNumber=b.seriesNumber;
    out.metadataSources=(Array.isArray(b.metadataSources)?b.metadataSources:[]).slice(0,20).map(function(source){if(typeof source==='string')return safeURL(source);if(!source||typeof source!=='object'||!safeURL(source.url))return null;return{source:String(source.source||source.name||'').slice(0,100),url:safeURL(source.url),checkedAt:checkedAt(source.checkedAt)};}).filter(Boolean);
    ['a','ol','g'].forEach(function(p){out[p+'Rating']=validRating(b[p+'Rating'])?b[p+'Rating']:null;out[p+'Count']=integer(b[p+'Count'],1000000000);});
    if(hasGoodreads(b)){out.grRating=b.grRating;out.grCount=integer(b.grCount,1000000000);out.grUrl=goodreadsURL(b.grUrl);out.grCheckedAt=checkedAt(b.grCheckedAt);}return out;
  }
  function validateLibrary(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Neplatný formát knihovny.');var out=Object.create(null),ids=Object.keys(raw);if(ids.length>5000)throw new Error('Knihovna je příliš velká (maximum 5 000 knih).');
    ids.forEach(function(id){var e=raw[id];if(BAD_KEYS.includes(id)||!e||!['want','reading','read'].includes(e.status)||!e.book||typeof e.book.title!=='string'||!e.book.title.trim()||e.book.id!==id||!id||id.length>200)throw new Error('Záloha obsahuje neplatnou knihu.');var book=snapshot(e.book),pages=integer(e.pages==null?book.pages:e.pages),page=integer(e.page);if(pages)page=Math.min(page,pages);out[id]={status:e.status,page:e.status==='read'&&pages?pages:page,pages:pages,book:book};if(typeof e.pagesManual==='boolean')out[id].pagesManual=e.pagesManual;if(checkedAt(e.updatedAt))out[id].updatedAt=checkedAt(e.updatedAt);});return out;
  }
  return{coverCandidates:coverCandidates,norm:norm,integer:integer,year:year,safeURL:safeURL,goodreadsURL:goodreadsURL,language:language,key:key,sameBook:sameBook,sameWork:sameWork,validRating:validRating,rating:rating,merge:merge,linkCatalogue:linkCatalogue,groupWorks:groupWorks,normalizeTags:normalizeTags,matchesTags:matchesTags,relevance:relevance,rank:rank,snapshot:snapshot,validateLibrary:validateLibrary};
});
