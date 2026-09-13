(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.BookShelf=factory();
}(typeof self!=='undefined'?self:this,function(){
  'use strict';
  function escapeText(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function positiveNumber(value){var n=Number(value);return Number.isFinite(n)&&n>0?Math.floor(n):0;}
  function render(books,options){
    options=options||{};
    var esc=options.esc||escapeText,attr=options.attr||escapeText;
    var status=options.status||'',labels={reading:'Rozečtené',want:'Chci přečíst',read:'Přečtené'};
    var items=(Array.isArray(books)?books:[]).filter(function(b){return b&&b.id;}).map(function(book,index){
      var pages=positiveNumber(book.pages),page=positiveNumber(book.page);
      // Readability sets a minimum width; square-root growth keeps long books manageable.
      var width=pages?Math.max(40,Math.min(92,Math.round(28+1.8*Math.sqrt(pages)))):54;
      var height=pages&&pages<200?192+Math.round(pages*.16):240;
      var title=book.title||'Kniha bez názvu',author=book.author||'Autor neuveden';
      var spineImage=typeof options.spineImageHTML==='function'?options.spineImageHTML(book):'';
      var meta=[];
      if(book.language)meta.push(String(book.language).toUpperCase());
      if(pages)meta.push(pages+' stran');
      var progress=status==='reading'?(pages?Math.min(page,pages)+' / '+pages+' stran':(page?page+' přečtených stran':'Rozečteno')):'';
      var cover=typeof options.coverHTML==='function'?options.coverHTML(book,{}):'<div class="cover"><div class="c-title">'+esc(title)+'</div><div class="c-author">'+esc(author)+'</div></div>';
      return '<li class="shelf-book" style="--spine-width:'+width+'px;--spine-height:'+height+'px">'
        +'<button type="button" class="shelf-spine" data-action="open" data-id="'+attr(book.id)+'" aria-label="'+attr('Otevřít knihu: '+title)+'">'
        +(spineImage?'<span class="shelf-spine-art" aria-hidden="true">'+spineImage+'</span>':'')
        +'<span class="shelf-spine-copy" aria-hidden="true"><span class="shelf-spine-title">'+esc(title)+'</span><span class="shelf-spine-author">'+esc(author)+'</span></span>'
        +(book.language?'<span class="shelf-spine-language" aria-hidden="true">'+esc(String(book.language).toUpperCase())+'</span>':'')+'</button>'
        +'<div class="shelf-preview" aria-hidden="true"><div class="shelf-preview-cover" aria-hidden="true">'+cover+'</div>'
        +'<div class="shelf-preview-caption"><div class="shelf-preview-title">'+esc(title)+'</div>'
        +'<div class="shelf-preview-author">'+esc(author)+'</div>'
        +(progress?'<div class="shelf-preview-meta">'+esc(progress)+'</div>':(meta.length?'<div class="shelf-preview-meta">'+esc(meta.join(' · '))+'</div>':''))
        +'</div></div></li>';
    }).join('');
    return '<div class="bookshelf" tabindex="0" role="region" aria-label="'+attr('Knižní polička'+(labels[status]?': '+labels[status]:''))+'"><ul class="bookshelf-track" role="list">'+items+'</ul></div>';
  }
  return {render:render};
}));
