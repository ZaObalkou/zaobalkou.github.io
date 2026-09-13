/* One appearance control; existing theme and palette choices remain compatible. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports={create:factory};
  else{root.Appearance=factory(root);root.Appearance.init();}
})(typeof window!=='undefined'?window:this,function(root){
  'use strict';
  var document=root.document;
  var keys={theme:'mzr_theme',palette:'mzr_palette',realism:'za_realism',wood:'za_wood'};
  var palettes=[{id:'peach',label:'Broskvová'},{id:'lavender',label:'Levandulová'},{id:'sage',label:'Šalvějová'},{id:'rose',label:'Růžová'},{id:'sky',label:'Nebeská'}];
  var woods=[{id:'oak',label:'Dub'},{id:'spruce',label:'Smrk'},{id:'birch',label:'Bříza'},{id:'cherry',label:'Třešeň'},{id:'acacia',label:'Akácie'}];
  var state={theme:'light',palette:'peach',realism:false,wood:'oak'};
  var mounted=false,themeExplicit=false,media,host,trigger,panel,status,realismSwitch,paletteGroup,woodGroup;
  var themeButtons=[],paletteButtons=[],woodButtons=[];
  var icon='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--card)"/><circle cx="15" cy="17" r="3" fill="var(--card)"/></svg>';
  var check='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  function has(options,id){return options.some(function(option){return option.id===id;});}
  function read(key){try{return root.localStorage.getItem(key);}catch(_){return null;}}
  function systemTheme(){return media&&media.matches?'dark':'light';}
  function readState(){
    var theme=read(keys.theme),palette=read(keys.palette),wood=read(keys.wood);
    themeExplicit=theme==='light'||theme==='dark';
    return {theme:themeExplicit?theme:systemTheme(),palette:has(palettes,palette)?palette:'peach',realism:read(keys.realism)==='true',wood:has(woods,wood)?wood:'oak'};
  }
  function get(){return {theme:state.theme,palette:state.palette,realism:state.realism,wood:state.wood};}
  function announce(){document.dispatchEvent(new root.CustomEvent('za:appearance',{detail:get()}));}
  function refresh(){
    if(!trigger)return;
    themeButtons.forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.appearanceTheme===state.theme));});
    paletteButtons.forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.appearancePalette===state.palette));});
    woodButtons.forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.appearanceWood===state.wood));});
    realismSwitch.setAttribute('aria-checked',String(state.realism));
    var hiddenFocus=state.realism?paletteGroup.contains(document.activeElement):woodGroup.contains(document.activeElement);
    paletteGroup.hidden=state.realism;woodGroup.hidden=!state.realism;
    if(hiddenFocus&&!panel.hidden)realismSwitch.focus();
  }
  function apply(){
    if(document.body){document.body.classList.toggle('dark',state.theme==='dark');document.body.dataset.palette=state.palette;document.body.dataset.realism=String(state.realism);document.body.dataset.wood=state.wood;}
    refresh();announce();
  }
  function set(changes,options){
    if(!changes||typeof changes!=='object')return false;
    var names=Object.keys(changes);
    if(names.some(function(key){return !Object.prototype.hasOwnProperty.call(keys,key)||
      (key==='theme'&&changes[key]!=='light'&&changes[key]!=='dark')||
      (key==='palette'&&!has(palettes,changes[key]))||(key==='wood'&&!has(woods,changes[key]))||
      (key==='realism'&&typeof changes[key]!=='boolean');}))return false;
    var changed=names.some(function(key){return state[key]!==changes[key];}),persist=!options||options.persist!==false,stored=true;
    names.forEach(function(key){state[key]=changes[key];if(persist){try{root.localStorage.setItem(keys[key],String(changes[key]));}catch(_){stored=false;}if(key==='theme')themeExplicit=true;}});
    if(changed)apply();else refresh();
    if(status)status.textContent=!stored?'Vzhled se změnil pro tuto návštěvu. Prohlížeč ho neuložil.':changed?'Vzhled uložen.':'';
    return true;
  }
  function close(restoreFocus){
    if(!panel||panel.hidden)return;
    panel.hidden=true;trigger.setAttribute('aria-expanded','false');
    if(restoreFocus)trigger.focus();
  }
  function open(){
    if(!mounted)init();if(!panel)return;
    panel.hidden=false;trigger.setAttribute('aria-expanded','true');
    themeButtons.filter(function(button){return button.dataset.appearanceTheme===state.theme;})[0].focus();
  }
  function node(tag,className,text){var result=document.createElement(tag);if(className)result.className=className;if(text)result.textContent=text;return result;}
  function button(className,label){var result=node('button',className,label);result.type='button';return result;}
  function choices(options,key){
    var group=node('div','appearance-choices appearance-'+key+'-choices');
    return {element:group,buttons:options.map(function(option){
      var item=button('appearance-choice',''),swatch=node('span','appearance-swatch');
      item.dataset[key==='wood'?'appearanceWood':'appearancePalette']=option.id;
      item.setAttribute('aria-pressed','false');swatch.setAttribute('aria-hidden','true');swatch.innerHTML=check;
      item.append(swatch,node('span','appearance-choice-label',option.label));
      item.addEventListener('click',function(){var patch={};patch[key]=option.id;set(patch);});group.append(item);return item;
    })};
  }
  function init(){
    if(mounted)return;
    if(!document.body||!document.getElementById('appearanceBtn')){
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});return;
    }
    mounted=true;trigger=document.getElementById('appearanceBtn');
    media=root.matchMedia?root.matchMedia('(prefers-color-scheme: dark)'):null;state=readState();
    host=node('div','appearance-picker');trigger.parentNode.insertBefore(host,trigger);host.append(trigger);
    trigger.type='button';trigger.classList.add('appearance-toggle');trigger.innerHTML=icon+'<span>Vzhled</span>';
    trigger.setAttribute('aria-label','Vzhled stránky');trigger.setAttribute('title','Vzhled stránky');
    trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','appearancePanel');
    panel=node('div','appearance-panel');panel.id='appearancePanel';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','appearanceTitle');
    var head=node('div','appearance-head'),title=node('h2','','Vzhled stránky'),closeButton=button('appearance-close','');
    title.id='appearanceTitle';closeButton.setAttribute('aria-label','Zavřít vzhled');
    closeButton.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    closeButton.addEventListener('click',function(){close(true);});head.append(title,closeButton);panel.append(head);
    var modes=node('div','appearance-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Světlý nebo tmavý motiv');
    themeButtons=[{id:'light',label:'Světlý'},{id:'dark',label:'Tmavý'}].map(function(mode){
      var item=button('appearance-mode',mode.label);item.dataset.appearanceTheme=mode.id;item.setAttribute('aria-pressed','false');
      item.addEventListener('click',function(){set({theme:mode.id});});modes.append(item);return item;
    });panel.append(modes);
    var realism=node('div','appearance-realism'),copy=node('div','appearance-realism-copy'),label=node('span','appearance-section-label','Realistická knihovna'),hint=node('p','appearance-help','Dřevěné poličky a světlo jako doma.');
    label.id='appearanceRealismLabel';hint.id='appearanceRealismHint';copy.append(label,hint);
    realismSwitch=button('appearance-switch','');realismSwitch.id='appearanceRealism';
    realismSwitch.setAttribute('role','switch');realismSwitch.setAttribute('aria-checked','false');
    realismSwitch.setAttribute('aria-labelledby',label.id);realismSwitch.setAttribute('aria-describedby',hint.id);
    realismSwitch.append(node('span','appearance-switch-knob'));realismSwitch.addEventListener('click',function(){set({realism:!state.realism});});
    realism.append(copy,realismSwitch);panel.append(realism);
    paletteGroup=node('section','appearance-selection');woodGroup=node('section','appearance-selection');
    var paletteTitle=node('h3','appearance-section-label','Pastelové barvy'),woodTitle=node('h3','appearance-section-label','Dřevo knihovny');
    paletteTitle.id='appearancePaletteTitle';woodTitle.id='appearanceWoodTitle';
    paletteGroup.setAttribute('aria-labelledby',paletteTitle.id);woodGroup.setAttribute('aria-labelledby',woodTitle.id);
    var paletteChoices=choices(palettes,'palette'),woodChoices=choices(woods,'wood');paletteButtons=paletteChoices.buttons;woodButtons=woodChoices.buttons;
    paletteGroup.append(paletteTitle,paletteChoices.element);woodGroup.append(woodTitle,woodChoices.element);
    status=node('span','appearance-sr-only');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    panel.append(paletteGroup,woodGroup,status);host.append(panel);
    trigger.addEventListener('click',function(){if(panel.hidden)open();else close(false);});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();close(true);}});
    document.addEventListener('pointerdown',function(event){if(!host.contains(event.target))close(true);});
    document.addEventListener('focusin',function(event){if(!host.contains(event.target))close(false);});
    root.addEventListener('storage',function(event){if(event.key===null||Object.keys(keys).some(function(key){return keys[key]===event.key;})){state=readState();apply();}});
    var onSystemChange=function(){if(!themeExplicit){state.theme=systemTheme();apply();}};
    if(media&&media.addEventListener)media.addEventListener('change',onSystemChange);else if(media&&media.addListener)media.addListener(onSystemChange);
    var libraryButton=document.querySelector('.hdr-in .nav-lib');
    if(libraryButton){libraryButton.setAttribute('aria-label','Knihovna');libraryButton.setAttribute('title','Knihovna');}
    apply();
  }
  return Object.freeze({init:init,get:get,set:set,open:open,close:close});
});
