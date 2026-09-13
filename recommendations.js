/* Local taste and random discovery. Library contents stay in this browser;
 * the caller may use the small topic/author list to grow its catalogue pool. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./book-core.js'));
  else root.RoomRecommendations=factory(root.BookCore);
})(typeof window!=='undefined'?window:this,function(Core){
  'use strict';
  function unique(values){return Array.from(new Set(values.filter(Boolean)));}
  function valid(books){return (Array.isArray(books)?books:[]).filter(function(b){return b&&typeof b.id==='string'&&typeof b.title==='string'&&b.title.trim();});}
  function authorKey(author){return Core.norm(author).replace(/ova\b/g,'').replace(/\s/g,'');}
  function authorKeys(book){return unique([book.author].concat(book.authorAliases||[]).map(authorKey)).filter(function(key){return key!=='neznamyautor'&&key!=='unknownauthor';});}
  function sameAuthor(a,b){return authorKeys(a).some(function(key){return authorKeys(b).includes(key);});}
  function flatten(books){return valid(books).flatMap(function(book){return [book].concat(valid(book.editions));});}
  function ordered(weights){return Object.keys(weights).sort(function(a,b){return weights[b]-weights[a]||a.localeCompare(b);});}
  function profile(libraryBooks){
    // Only the editions actually saved in the library count as language votes.
    // A detail's available translations do not imply a reader's preference.
    var saved=valid(libraryBooks),works=Core.groupWorks(saved),topics=Object.create(null),languages=Object.create(null),authors=[],descriptors=[];
    works.forEach(function(work){
      var editions=saved.filter(function(book){return Core.sameWork(book,work);}),tags=unique(editions.flatMap(function(book){return Core.normalizeTags(book);})).sort();
      var keys=unique(editions.flatMap(authorKeys)).sort(),langs=unique(editions.map(function(book){return Core.language(book.language);})).sort();
      tags.forEach(function(tag){topics[tag]=(topics[tag]||0)+1;});
      langs.forEach(function(language){languages[language]=(languages[language]||0)+1/langs.length;});
      if(keys.length){
        var existing=authors.find(function(author){return author.keys.some(function(key){return keys.includes(key);});});
        if(existing){existing.weight++;existing.keys=unique(existing.keys.concat(keys)).sort();}
        else authors.push({name:String(work.author||(work.authorAliases||[])[0]||''),keys:keys,weight:1});
      }
      // Ratings, progress and page-count enrichment cannot invalidate discovery.
      var identities=unique(editions.map(function(book){return book.workId||book.olWorkId||Core.key(book);})).sort();
      descriptors.push(JSON.stringify({works:identities,authors:keys,languages:langs,tags:tags}));
    });
    authors.sort(function(a,b){return b.weight-a.weight||a.name.localeCompare(b.name);});
    return {key:descriptors.sort().join('\n'),topics:ordered(topics).slice(0,3),authors:authors.slice(0,2).map(function(author){return author.name;}),
      works:works,topicWeights:topics,authorWeights:authors,languageWeights:languages};
  }
  function randomValue(random){var value=Number(random());return Number.isFinite(value)?Math.max(0,Math.min(0.9999999999999999,value)):0.5;}
  function pick(candidates,options){
    var o=options||{},taste=o.profile||profile([]),count=Math.max(0,Math.min(24,Math.floor(o.count==null?6:o.count)||0));
    var random=typeof o.random==='function'?o.random:Math.random,previous=valid(o.previous),history=valid(o.history),owned=valid(taste.works),mode=o.mode||'modern';
    var settings={era:'modern'},now=new Date().getFullYear();
    if(mode==='ya')settings.tags=['young adult'];
    else if(mode==='romantasy')settings.tags=['romantasy'];
    var groups=Core.groupWorks(flatten(candidates),settings).filter(function(book){return !owned.some(function(saved){return Core.sameWork(saved,book);});});
    var languageWeights=taste.languageWeights||{},topicWeights=taste.topicWeights||{},authorWeights=taste.authorWeights||[],workCount=Math.max(1,owned.length);
    var pool=groups.map(function(group){
      var editions=Core.rank(group.editions||[group],{era:'modern'}),selected=group,best=languageWeights[Core.language(group.language)]||0;
      editions.forEach(function(edition){var weight=languageWeights[Core.language(edition.language)]||0;if(weight>best){selected=edition;best=weight;}});
      // Keep the chosen edition's ISBN, pages, cover and publication year intact.
      var book=Object.assign({},selected,{editions:group.editions||editions}),tags=Core.normalizeTags(group),genre=0;
      tags.forEach(function(tag){genre+=(topicWeights[tag]||0)/workCount;});
      genre=Math.min(3,genre);
      var author=authorWeights.reduce(function(value,item){return authorKeys(book).some(function(key){return item.keys.includes(key);})?Math.max(value,item.weight/workCount):value;},0);
      var year=Core.year(book.firstPublishYear)||Core.year(book.year)||0,age=Math.max(0,now-year),recent=age<=3?0.8:age<=7?0.4:0;
      var weight=1+genre*4+author*5+(languageWeights[Core.language(book.language)]||0)/workCount*2+recent+(book.coverUrl||book.coverUrlL?0.3:0);
      var last=-1;for(var i=history.length-1;i>=0;i--)if(Core.sameWork(book,history[i])){last=i;break;}
      var wasPrevious=previous.some(function(seen){return Core.sameWork(book,seen);});
      // Older suggestions regain more chance after unseen titles run out. Keep
      // chance non-zero so repeated presses never turn into fixed pagination.
      if(last>=0)weight*=1+4*(history.length-last)/Math.max(1,history.length);
      return {book:book,weight:weight,tier:wasPrevious?2:last<0?0:1};
    });
    var picked=[];
    while(picked.length<count&&pool.length){
      var tier=Math.min.apply(null,pool.map(function(item){return item.tier;})),choices=pool.filter(function(item){return item.tier===tier;});
      // Variety is a preference, never a reason to repeat the preceding row or
      // leave an empty shelf when the catalogue still has eligible books.
      var diverse=choices.filter(function(item){return picked.filter(function(book){return sameAuthor(book,item.book);}).length<2;});
      if(diverse.length)choices=diverse;
      var sum=choices.reduce(function(value,item){return value+item.weight;},0),target=randomValue(random)*sum,chosen=choices[choices.length-1];
      for(var j=0;j<choices.length;j++){target-=choices[j].weight;if(target<0){chosen=choices[j];break;}}
      picked.push(chosen.book);pool.splice(pool.indexOf(chosen),1);
    }
    return picked;
  }
  return {profile:profile,pick:pick};
});
