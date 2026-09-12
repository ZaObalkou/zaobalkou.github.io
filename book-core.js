/* Pure catalogue and persistence rules. Browser + Node, no dependencies. */
(function(root, factory){
  if(typeof module === 'object' && module.exports) module.exports = factory();
  else root.BookCore = factory();
})(typeof window !== 'undefined' ? window : this, function(){
  'use strict';
  function norm(value){
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }
  function integer(value, max){
    var n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(max || 100000, Math.floor(n))) : 0;
  }
  function year(value){
    var n = integer(value, 9999);
    return n >= 1000 && n <= new Date().getFullYear() ? n : null;
  }
  function safeURL(value){
    try { var u = new URL(String(value)); return u.protocol === 'https:' ? u.href : ''; } catch(e){ return ''; }
  }
  function authorKey(value){ return norm(value).replace(/ova\b/g, '').replace(/\s/g, ''); }
  function key(book){ return norm(book.title) + '|' + authorKey(book.author); }
  function sameBook(a, b){
    return !!(a && b && ((a.isbn && a.isbn === b.isbn) || (norm(a.title) && key(a) === key(b))));
  }
  function validRating(value){ return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 5; }
  function rating(book){
    var choices = ['a', 'ol', 'g'].filter(function(p){ return validRating(book[p + 'Rating']); });
    choices.sort(function(a, b){ return integer(book[b + 'Count']) - integer(book[a + 'Count']); });
    var p = choices[0];
    return p ? {value:book[p + 'Rating'], count:integer(book[p + 'Count']), source:{a:'Apple Books', ol:'Open Library', g:'Google Books'}[p]} : null;
  }
  function merge(lists){
    var out = [], byKey = new Map(), byISBN = new Map();
    lists.forEach(function(list){ (list || []).forEach(function(book){
      if(!book || typeof book.id !== 'string' || !book.title) return;
      var k = key(book), m = (book.isbn && byISBN.get(book.isbn)) || byKey.get(k);
      if(!m){ m = Object.assign({}, book); out.push(m); }
      else {
        ['pages','coverUrl','coverUrlL','desc','link','isbn','language','firstPublishYear','year','yearKind'].forEach(function(field){ if(!m[field] && book[field]) m[field] = book[field]; });
        ['a','ol','g'].forEach(function(p){
          if(validRating(book[p+'Rating']) && (!validRating(m[p+'Rating']) || integer(book[p+'Count']) > integer(m[p+'Count']))){ m[p+'Rating'] = book[p+'Rating']; m[p+'Count'] = book[p+'Count']; }
        });
        m.tags = Array.from(new Set((m.tags || []).concat(book.tags || []))).slice(0, 40);
        m.aliases = Array.from(new Set((m.aliases || []).concat(book.aliases || [])));
      }
      byKey.set(k, m); if(book.isbn) byISBN.set(book.isbn, m);
    }); });
    return out;
  }
  function relevance(book, query){
    var q = norm(query); if(!q) return 0;
    if(book.isbn && String(query).replace(/[-\s]/g,'') === book.isbn) return 6;
    var titles = [book.title].concat(book.aliases || []).map(norm), author = norm(book.author);
    if(titles.indexOf(q) >= 0) return 6;
    if(author === q) return 5;
    if(titles.some(function(t){ return t.startsWith(q); })) return 4;
    if(titles.some(function(t){ return t.includes(q); }) || author.includes(q)) return 3;
    var text = titles.join(' ') + ' ' + author;
    if(q.split(' ').every(function(t){ return text.includes(t); })) return 2;
    if(q.split(' ').every(function(t){ return (text + ' ' + norm((book.tags || []).join(' '))).includes(t); })) return 1;
    return 0;
  }
  function rank(books, options){
    var o = options || {}, now = o.now || new Date().getFullYear();
    function date(b){ return year(b.firstPublishYear) || year(b.year) || 0; }
    function score(b){
      var y = date(b), age = y ? now - y : 100, text = norm((b.tags || []).join(' '));
      var recent = age <= 3 ? 30 : age <= 7 ? 22 : age <= 12 ? 12 : 0;
      var audience = /young adult|juvenile fiction/.test(text) ? 12 : /romantasy|romance|fantasy/.test(text) ? 7 : 0;
      var r = rating(b), popularity = r ? Math.min(6, Math.log10(r.count + 1) * 2) : 0;
      return recent + audience + (b.language === 'cs' ? 8 : 0) + popularity;
    }
    return books.filter(function(b){
      var y = date(b);
      if(o.era === 'recent' && (!y || y < now - 5)) return false;
      if(o.era === 'modern' && (!y || y < now - 10)) return false;
      if(o.language && o.language !== 'all' && b.language !== o.language) return false;
      return true;
    }).slice().sort(function(a, b){
      if(o.sort === 'newest') return date(b) - date(a) || relevance(b,o.query) - relevance(a,o.query) || key(a).localeCompare(key(b));
      if(o.sort === 'rating'){
        var ra = rating(a), rb = rating(b);
        return ((rb ? (rb.value * rb.count + 35) / (rb.count + 10) : 0) - (ra ? (ra.value * ra.count + 35) / (ra.count + 10) : 0)) || score(b) - score(a);
      }
      return relevance(b, o.query) - relevance(a, o.query) || score(b) - score(a) || key(a).localeCompare(key(b));
    });
  }
  function snapshot(b){
    var out = {id:String(b.id).slice(0,200), title:String(b.title || '').slice(0,500), author:String(b.author || 'Neznámý autor').slice(0,500)};
    out.pages = integer(b.pages); out.year = year(b.year); out.firstPublishYear = year(b.firstPublishYear);
    out.yearKind = b.yearKind === 'original' ? 'original' : 'edition';
    out.language = ['cs','en','sk'].includes(b.language) ? b.language : '';
    out.tags = (Array.isArray(b.tags) ? b.tags : []).filter(function(t){return typeof t === 'string';}).slice(0,40).map(function(t){return t.slice(0,100);});
    out.aliases = (Array.isArray(b.aliases) ? b.aliases : []).filter(function(t){return typeof t === 'string';}).slice(0,10);
    out.desc = String(b.desc || '').slice(0,20000);
    out.isbn = /^[0-9Xx-]{10,17}$/.test(b.isbn || '') ? b.isbn.replace(/-/g,'') : '';
    ['coverUrl','coverUrlL','link'].forEach(function(k){out[k] = safeURL(b[k]);});
    ['a','ol','g'].forEach(function(p){out[p+'Rating'] = validRating(b[p+'Rating']) ? b[p+'Rating'] : null; out[p+'Count'] = integer(b[p+'Count'],100000000);});
    return out;
  }
  function validateLibrary(raw){
    if(!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Neplatný formát knihovny.');
    var out = Object.create(null), ids = Object.keys(raw);
    if(ids.length > 5000) throw new Error('Knihovna je příliš velká (maximum 5 000 knih).');
    ids.forEach(function(id){
      var e = raw[id];
      if(['__proto__','constructor','prototype'].includes(id) || !e || !['want','reading','read'].includes(e.status) || !e.book || typeof e.book.title !== 'string' || !e.book.title.trim() || e.book.id !== id || id.length > 200) throw new Error('Záloha obsahuje neplatnou knihu.');
      var book = snapshot(e.book), pages = integer(e.pages == null ? book.pages : e.pages), page = integer(e.page);
      if(pages) page = Math.min(page,pages);
      out[id] = {status:e.status, page:e.status === 'read' && pages ? pages : page, pages:pages, book:book};
    });
    return out;
  }
  return {norm:norm, integer:integer, year:year, safeURL:safeURL, key:key, sameBook:sameBook, validRating:validRating, rating:rating, merge:merge, relevance:relevance, rank:rank, snapshot:snapshot, validateLibrary:validateLibrary};
});
