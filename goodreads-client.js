/* Goodreads' public average-rating widget runs in an opaque, sandboxed frame.
 * Its script never executes in the page that holds the reader's library. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(null);
  else root.GoodreadsClient=factory(root);
})(typeof window!=='undefined'?window:this,function(root){
  'use strict';
  var PREFIX='za_goodreads_v1:', HOUR=3600000, MAX_COUNT=1000000000;
  function id(value){var s=typeof value==='string'||typeof value==='number'?String(value).trim():'';return /^[1-9]\d{0,14}$/.test(s)?s:'';}
  function urlID(value){
    try{var u=new URL(value),m=u.pathname.match(/^\/book\/show\/([1-9]\d{0,14})(?:[.-][^/]*)?\/?$/);return u.protocol==='https:'&&/^(?:www\.)?goodreads\.com$/.test(u.hostname)&&!u.port&&!u.username&&!u.password&&m?m[1]:'';}catch(e){return '';}
  }
  function bookID(book){return book&&(id(book.grId)||urlID(book.grUrl))||'';}
  function valid(row,grId){return !!(row&&typeof row.rating==='number'&&Number.isFinite(row.rating)&&row.rating>0&&row.rating<=5&&Number.isSafeInteger(row.count)&&row.count>0&&row.count<=MAX_COUNT&&urlID(row.url)===grId);}
  function titleKey(value){
    if(typeof value!=='string')return '';
    // Goodreads appends series positions to some titles. Preserve subtitles,
    // edition descriptions and other parentheses: they can identify another book.
    return value.replace(/\s*\([^()]*?(?:#\s*|(?:book|volume|vol\.?|díl|dil|kniha)\s+)\d+(?:[.,]\d+)?\s*\)\s*$/i,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  }
  function matchesTitle(book,row){
    if(book.grMatchTitle!==true)return true;
    var actual=titleKey(row&&row.title);if(!actual)return false;
    return [book.title].concat(Array.isArray(book.aliases)?book.aliases:[]).some(function(title){return titleKey(title)===actual;});
  }
  function create(options){
    var o=options||{},host=o.window||root,doc=o.document||(host&&host.document),storage=o.storage;
    if(storage===undefined)try{storage=host&&host.localStorage;}catch(e){}
    var now=o.now||Date.now,ttl=o.ttl==null?6*HOUR:o.ttl,negativeTTL=o.negativeTTL==null?60000:o.negativeTTL;
    var timeout=o.timeout==null?8000:o.timeout,gap=o.requestGap==null?1000:o.requestGap;
    var records=new Map(),negative=new Map(),pending=new Map(),queue=[],active=0,nextStart=0,queueTimer=null;
    var transport=o.transport||widget;
    function read(grId){
      var row=records.get(grId);
      if(!row&&storage)try{row=JSON.parse(storage.getItem(PREFIX+grId));}catch(e){}
      if(!valid(row,grId)||!Number.isFinite(Date.parse(row.checkedAt))||Date.parse(row.checkedAt)>now()+60000)return null;
      records.set(grId,row);return row;
    }
    function write(grId,row){
      records.delete(grId);records.set(grId,row);
      if(records.size>200)records.delete(records.keys().next().value);
      if(storage)try{
        var keys=[];for(var n=0;n<storage.length;n++){var k=storage.key(n);if(k&&k.indexOf(PREFIX)===0)keys.push(k);}
        if(keys.length>=200&&keys.indexOf(PREFIX+grId)<0)storage.removeItem(keys[0]);
        storage.setItem(PREFIX+grId,JSON.stringify(row));
      }catch(e){}
    }
    function apply(book,row,grId){
      if(!row||!matchesTitle(book,row))return book;
      // A newer rating carried by a saved edition must survive an older cache.
      if(urlID(book.grUrl)===grId&&Number.isFinite(Date.parse(book.grCheckedAt))&&Date.parse(book.grCheckedAt)>Date.parse(row.checkedAt)&&valid({rating:book.grRating,count:book.grCount,url:book.grUrl},grId))return book;
      return Object.assign({},book,{grRating:row.rating,grCount:row.count,grUrl:row.url,grCheckedAt:row.checkedAt,grScope:'work',grSnapshot:now()-Date.parse(row.checkedAt)>=ttl});
    }
    function getCached(book){var grId=bookID(book);return grId?apply(book,read(grId),grId):book;}
    function nonce(){
      var crypto=o.crypto||(host&&host.crypto);if(!crypto||typeof crypto.getRandomValues!=='function')throw new Error('Secure widget channel unavailable');
      return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(function(v){return v.toString(16).padStart(2,'0');}).join('');
    }
    function widget(grId,context){
      return new Promise(function(resolve,reject){
        if(!host||!doc||!doc.body||!host.addEventListener){reject(new Error('Goodreads widget unavailable'));return;}
        var frame,token,finished=false;
        function finish(error,row){if(finished)return;finished=true;host.removeEventListener('message',message);if(context.signal)context.signal.removeEventListener('abort',abort);if(frame)frame.remove();if(error)reject(error);else resolve(row);}
        function abort(){finish(new Error('Goodreads widget timed out'));}
        function message(event){
          var payload=event.data;
          if(!frame||event.source!==frame.contentWindow||event.origin!=='null'||!payload||payload.type!=='za-goodreads-rating'||payload.nonce!==token||payload.grId!==grId)return;
          if(payload.error){finish(new Error('Goodreads rating unavailable'));return;}
          if(!valid(payload,grId)||typeof payload.title!=='string'||!payload.title.trim())return;
          finish(null,payload);
        }
        try{
          token=nonce();var bridge=new URL('goodreads-bridge.html',host.location.href);
          if(!/^https?:$/.test(bridge.protocol)||bridge.origin!==host.location.origin)throw new Error('Invalid Goodreads bridge origin');
          bridge.search='v=1&grId='+grId+'&nonce='+token;
          frame=doc.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('aria-hidden','true');frame.setAttribute('tabindex','-1');frame.setAttribute('title','Goodreads rating');frame.setAttribute('referrerpolicy','no-referrer');frame.hidden=true;
          frame.addEventListener('error',function(){finish(new Error('Goodreads widget failed to load'));},{once:true});
          host.addEventListener('message',message);
          if(context.signal){if(context.signal.aborted){abort();return;}context.signal.addEventListener('abort',abort,{once:true});}
          frame.src=bridge.href;doc.body.appendChild(frame);
        }catch(error){finish(error);}
      });
    }
    function run(grId){
      return new Promise(function(resolve,reject){
        var controller=typeof AbortController!=='undefined'?new AbortController():null,finished=false;
        var timer=setTimeout(function(){finished=true;if(controller)controller.abort();reject(new Error('Goodreads widget timed out'));},timeout);
        Promise.resolve().then(function(){return transport(grId,{signal:controller&&controller.signal,timeout:timeout});}).then(function(row){
          if(finished)return;
          if(!valid(row,grId))throw new Error('Invalid Goodreads widget response');
          var result={rating:row.rating,count:row.count,title:String(row.title||'').slice(0,500),url:'https://www.goodreads.com/book/show/'+grId,checkedAt:new Date(now()).toISOString()};
          finished=true;write(grId,result);negative.delete(grId);resolve(result);
        }).catch(function(error){finished=true;reject(error);}).finally(function(){clearTimeout(timer);});
      });
    }
    function drain(){
      if(queueTimer||!queue.length||active>=2)return;
      var wait=Math.max(0,nextStart-now());if(wait){queueTimer=setTimeout(function(){queueTimer=null;drain();},wait);return;}
      var task=queue.shift();clearTimeout(task.expiry);active++;nextStart=now()+gap;
      run(task.grId).then(task.resolve,task.reject).finally(function(){active--;drain();});drain();
    }
    function schedule(grId,priority){
      return new Promise(function(resolve,reject){
        function queueError(message){var error=new Error(message);error.queue=true;return error;}
        if(queue.length>=12&&priority){
          var disposable=-1;for(var n=queue.length-1;n>=0;n--)if(!queue[n].priority){disposable=n;break;}
          if(disposable>=0){var displaced=queue.splice(disposable,1)[0];clearTimeout(displaced.expiry);displaced.reject(queueError('Goodreads background request postponed'));}
        }
        if(queue.length>=12){reject(queueError('Goodreads widget queue is full'));return;}
        var task={grId:grId,priority:priority,resolve:resolve,reject:reject};
        task.expiry=setTimeout(function(){var i=queue.indexOf(task);if(i>=0){queue.splice(i,1);reject(queueError('Goodreads widget queue timed out'));}},timeout);
        var before=priority?queue.findIndex(function(other){return !other.priority;}):-1;
        if(before<0)queue.push(task);else queue.splice(before,0,task);drain();
      });
    }
    function rating(book,settings){
      var grId=bookID(book);if(!grId)return Promise.resolve(book);
      var priority=!settings||settings.priority!==false;
      var saved=read(grId);if(saved&&now()-Date.parse(saved.checkedAt)<ttl)return Promise.resolve(apply(book,saved,grId));
      if((negative.get(grId)||0)>now())return Promise.resolve(apply(book,saved,grId));
      if(!pending.has(grId)){
        var promise=schedule(grId,priority).catch(function(error){if(!error.queue)negative.set(grId,now()+negativeTTL);return read(grId);}).finally(function(){pending.delete(grId);});
        pending.set(grId,promise);
      }else if(priority){
        var index=queue.findIndex(function(task){return task.grId===grId;});
        if(index>=0&&!queue[index].priority){var task=queue.splice(index,1)[0];task.priority=true;var before=queue.findIndex(function(other){return !other.priority;});if(before<0)queue.push(task);else queue.splice(before,0,task);}
      }
      return pending.get(grId).then(function(row){return apply(book,row,grId);});
    }
    return {getCached:getCached,rating:rating};
  }
  var client=root?create():{};client.create=create;return client;
});
