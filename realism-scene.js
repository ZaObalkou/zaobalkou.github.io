/* Optional photographic room atmosphere. All books and controls remain real DOM.
 * Engine is local and lazy: Three.js 0.180.0 (MIT, vendor/three.LICENSE.txt). */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RealismScene=api;
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';
  var WOODS=['oak','spruce','birch','cherry','acacia'];
  var VIEWS=['home','search','library','detail'];
  function settings(value){var v=value||{},a=v.appearance||{};return{view:VIEWS.includes(v.view)?v.view:'home',realism:a.realism===true,wood:WOODS.includes(a.wood)?a.wood:'oak',theme:a.theme==='dark'?'dark':'light'};}
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function createController(options){
    var o=options||{},win=o.window||root,doc=o.document||(win&&win.document),load=o.loadEngine||function(){return import('./vendor/three.module.min.js');},build=o.buildScene||buildAtmosphere;
    var current=settings(),room=null,host=null,stage=null,loading=null,engine=null,serial=0,frame=0,lastTime=0,elapsed=0,lost=false,failed=false,listening=false,resizeObserver=null,intersectionObserver=null,inView=true;
    var target={x:0,y:0},pointer={x:0,y:0};
    var motion=win&&win.matchMedia?win.matchMedia('(prefers-reduced-motion: reduce)'):null;
    var fine=win&&win.matchMedia?win.matchMedia('(pointer: fine)'):null;
    // Moving the photographic room is independent of GPU availability.
    function active(){return current.realism&&stage&&stage.isConnected!==false&&!doc.hidden&&inView;}
    function clearLook(element){if(!element)return;['--room-look-x','--room-look-y','--room-look-shift-x','--room-look-shift-y'].forEach(function(name){element.style.removeProperty(name);});}
    function observeStage(){
      if(resizeObserver){resizeObserver.disconnect();if(stage)resizeObserver.observe(stage);}
      if(intersectionObserver){intersectionObserver.disconnect();if(stage)intersectionObserver.observe(stage);}
    }
    function mount(){
      var next=doc.querySelector('.room-scene, [data-realism-stage]');
      if(!next)return false;
      var moved=stage!==next;
      if(moved){clearLook(stage);stage=next;target.x=target.y=pointer.x=pointer.y=0;inView=true;}
      host=host||doc.getElementById('realism-scene');
      if(!host){host=doc.createElement('div');host.id='realism-scene';}
      host.setAttribute('aria-hidden','true');host.setAttribute('role','presentation');
      host.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;border-radius:inherit';
      if(host.parentNode!==stage)stage.appendChild(host);
      host.hidden=false;host.dataset.view=current.view;
      if(moved){observeStage();resize();}
      return true;
    }
    function stop(){if(frame){win.cancelAnimationFrame(frame);frame=0;}lastTime=0;}
    function request(){if(active()&&!frame)frame=win.requestAnimationFrame(draw);}
    function draw(time){
      frame=0;if(!active())return;
      var dt=lastTime?Math.min(64,time-lastTime):16;lastTime=time;
      var reduced=!!(motion&&motion.matches),blend=reduced?1:1-Math.exp(-dt/185);
      pointer.x+=(target.x-pointer.x)*blend;pointer.y+=(target.y-pointer.y)*blend;
      // One parent moves the image, canvas and every aligned physical control.
      // Never translate just the backdrop or move a camera behind fixed labels.
      stage.style.setProperty('--room-look-x',(pointer.x*.8).toFixed(4)+'deg');
      stage.style.setProperty('--room-look-y',(-pointer.y*.42).toFixed(4)+'deg');
      stage.style.setProperty('--room-look-shift-x',(-pointer.x*4).toFixed(3)+'px');
      stage.style.setProperty('--room-look-shift-y',(-pointer.y*2.5).toFixed(3)+'px');
      if(!reduced)elapsed+=dt/1000;
      try{if(room&&!lost){room.render({x:pointer.x,y:pointer.y,time:elapsed,reducedMotion:reduced});host.dataset.ready='1';delete host.dataset.fallback;delete host.dataset.error;}}
      catch(error){fallback(error);return;}
      if(!reduced&&room&&!lost&&room.animated!==false||Math.abs(target.x-pointer.x)+Math.abs(target.y-pointer.y)>.0005)request();else lastTime=0;
    }
    function resize(){if(!stage)return;if(room&&!lost){var bounds=stage.getBoundingClientRect(),width=Math.max(1,Math.round(bounds.width||win.innerWidth)),height=Math.max(1,Math.round(bounds.height||win.innerHeight));try{room.resize(width,height,Math.min(win.devicePixelRatio||1,2));}catch(error){fallback(error);return;}}request();}
    function move(event){if(!active()||motion&&motion.matches||fine&&!fine.matches||event.pointerType&&event.pointerType!=='mouse')return;var b=stage.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom){center();return;}target.x=clamp((event.clientX-b.left)/(b.width||1)*2-1,-1,1);target.y=clamp((event.clientY-b.top)/(b.height||1)*2-1,-1,1);request();}
    function center(){target.x=0;target.y=0;request();}
    function visibility(){if(doc.hidden)stop();else{lastTime=0;request();}}
    function motionChanged(){target.x=target.y=0;if(motion&&motion.matches){pointer.x=pointer.y=0;}request();}
    function contextLost(event){event.preventDefault();lost=true;stop();if(host){delete host.dataset.ready;host.dataset.fallback='1';host.dataset.error='WebGL context lost';}request();}
    function contextRestored(){if(!room||!current.realism)return;lost=false;room.update(current);resize();request();}
    function listen(){
      if(listening)return;listening=true;
      win.addEventListener('resize',resize,{passive:true});win.addEventListener('pointermove',move,{passive:true});doc.addEventListener('pointerleave',center,{passive:true});doc.addEventListener('visibilitychange',visibility);
      if(motion&&motion.addEventListener)motion.addEventListener('change',motionChanged);
      if(fine&&fine.addEventListener)fine.addEventListener('change',motionChanged);
      if(win.ResizeObserver)resizeObserver=new win.ResizeObserver(resize);
      if(win.IntersectionObserver)intersectionObserver=new win.IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.target!==stage)return;inView=entry.isIntersecting;if(inView)request();else stop();});},{rootMargin:'120px'});
      observeStage();
    }
    function unlisten(){
      if(!listening)return;listening=false;
      win.removeEventListener('resize',resize);win.removeEventListener('pointermove',move);doc.removeEventListener('pointerleave',center);doc.removeEventListener('visibilitychange',visibility);
      if(motion&&motion.removeEventListener)motion.removeEventListener('change',motionChanged);
      if(fine&&fine.removeEventListener)fine.removeEventListener('change',motionChanged);
      if(resizeObserver){resizeObserver.disconnect();resizeObserver=null;}
      if(intersectionObserver){intersectionObserver.disconnect();intersectionObserver=null;}
    }
    function releaseGraphics(){
      lost=false;
      if(room){var old=room;room=null;old.canvas.removeEventListener('webglcontextlost',contextLost);old.canvas.removeEventListener('webglcontextrestored',contextRestored);try{old.dispose();}catch(error){if(o.onError)o.onError(error);}finally{if(old.canvas.parentNode)old.canvas.remove();}}
      if(host)delete host.dataset.ready;
    }
    function release(){
      stop();unlisten();releaseGraphics();clearLook(stage);target.x=target.y=pointer.x=pointer.y=0;
    }
    function fallback(error){stop();releaseGraphics();failed=true;if(host){host.dataset.fallback='1';host.dataset.error=String(error&&error.message||'Graphics unavailable').slice(0,240);delete host.dataset.ready;}if(current.realism&&stage){listen();request();}if(o.onError)o.onError(error);}
    function start(ticket){
      if(!engine||ticket!==serial||!current.realism||!mount())return;
      try{
        room=build(engine,{document:doc,invalidate:request,settings:current});
        room.canvas.setAttribute('aria-hidden','true');room.canvas.setAttribute('role','presentation');room.canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none';
        host.appendChild(room.canvas);room.canvas.addEventListener('webglcontextlost',contextLost);room.canvas.addEventListener('webglcontextrestored',contextRestored);
        listen();room.update(current);resize();request();
      }catch(error){fallback(error);}
    }
    function sync(value){
      if(!doc||!win)return Promise.resolve(false);
      var next=settings(value),changed=next.view!==current.view||next.wood!==current.wood||next.theme!==current.theme,wasEnabled=current.realism;current=next;
      if(!next.realism){serial++;failed=false;release();if(host){host.hidden=true;delete host.dataset.fallback;delete host.dataset.error;}return Promise.resolve(false);}
      if(!mount()){release();stage=null;inView=false;if(host)host.hidden=true;return Promise.resolve(false);}
      listen();request();
      if(room){if(changed){room.update(current);center();}resize();request();return Promise.resolve(true);}
      if(failed&&wasEnabled)return Promise.resolve(false);
      if(loading)return loading;
      var ticket=++serial;failed=false;
      loading=Promise.resolve().then(function(){return engine||load();}).then(function(THREE){engine=THREE;start(ticket);return !!room;}).catch(function(error){if(ticket===serial&&current.realism)fallback(error);return false;}).finally(function(){loading=null;if(current.realism&&!room&&!failed&&ticket!==serial)sync({view:current.view,appearance:current});});
      return loading;
    }
    function destroy(){serial++;current.realism=false;release();if(host){host.hidden=true;delete host.dataset.fallback;delete host.dataset.error;}failed=false;}
    function status(){return{enabled:current.realism,ready:!!room&&!lost,loading:!!loading,fallback:failed||lost,animating:!!frame};}
    return{sync:sync,destroy:destroy,status:status};
  }

  function buildAtmosphere(T,options){
    var dead=false;
    // A transparent, genuine perspective layer complements the photographed
    // architecture. It deliberately cannot substitute generic mesh furniture.
    var renderer=new T.WebGLRenderer({antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance',stencil:false,depth:true});
    renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
    var scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.1,20);camera.position.z=4;
    var uniforms={uTime:{value:0},uDark:{value:0},uPixelRatio:{value:1}};
    var seed=3971;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
    var count=180,positions=new Float32Array(count*3),sizes=new Float32Array(count),phases=new Float32Array(count);
    for(var i=0;i<count;i++){
      // Most motes occupy the window light; a few nearer the viewer provide
      // actual depth and soft bokeh, without turning the room into snowfall.
      positions[i*3]=(random()-.58)*3.2;
      positions[i*3+1]=(random()-.43)*2.4;
      positions[i*3+2]=(random()-.55)*1.5;
      sizes[i]=.55+random()*1.1;phases[i]=random()*Math.PI*2;
    }
    var particlesGeometry=new T.BufferGeometry();particlesGeometry.setAttribute('position',new T.BufferAttribute(positions,3));particlesGeometry.setAttribute('aSize',new T.BufferAttribute(sizes,1));particlesGeometry.setAttribute('aPhase',new T.BufferAttribute(phases,1));
    var particlesMaterial=new T.ShaderMaterial({uniforms:uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:[
      'uniform float uTime; uniform float uPixelRatio;',
      'attribute float aSize; attribute float aPhase;',
      'varying float vAlpha;',
      'void main(){',
      'vec3 p=position;',
      'p.x+=sin(uTime*.072+aPhase)*.045;',
      'p.y+=sin(uTime*.052+aPhase*2.)*.065;',
      'p.z+=cos(uTime*.055+aPhase)*.035;',
      'vec4 mv=modelViewMatrix*vec4(p,1.);',
      'gl_Position=projectionMatrix*mv;',
      'gl_PointSize=clamp(aSize*uPixelRatio*4./max(1.,-mv.z),.6,4.5*uPixelRatio);',
      'vAlpha=.075+.10*(sin(aPhase+uTime*.12)*.5+.5);',
      '}'
    ].join('\n'),fragmentShader:[
      'uniform float uDark; varying float vAlpha;',
      'void main(){float r=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-r*r),2.5)*vAlpha;',
      'gl_FragColor=vec4(1.,.87,.64,a*mix(1.,.20,uDark));}'
    ].join('\n')});
    var particles=new T.Points(particlesGeometry,particlesMaterial);particles.frustumCulled=false;scene.add(particles);
    // The beam is projected at the photograph plane. Coordinates correspond
    // to its left-hand window, so lighting stays attached when the room moves.
    var beamGeometry=new T.PlaneGeometry(1,1),beamUniforms={uDark:{value:0},uTime:{value:0}};
    var beamMaterial=new T.ShaderMaterial({uniforms:beamUniforms,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:[
      'varying vec2 vUv; uniform float uDark; uniform float uTime;',
      'void main(){',
      'vec2 p=vUv;float down=1.-p.y;',
      'float center=.205+down*.36;',
      'float beam=exp(-pow((p.x-center)/(.018+down*.07),2.));',
      'float soft=exp(-pow((p.x-(center+.105))/(.025+down*.095),2.))*.52;',
      'float mask=smoothstep(.03,.18,p.y)*(1.-smoothstep(.87,1.,p.y));',
      'float breathing=.975+sin(uTime*.09)*.025;',
      'float alpha=(beam+soft)*mask*.023*breathing*mix(1.,.10,uDark);',
      'gl_FragColor=vec4(1.,.85,.61,alpha);',
      '}'
    ].join('\n')});
    var beam=new T.Mesh(beamGeometry,beamMaterial);beam.position.z=-.8;beam.renderOrder=-1;scene.add(beam);
    function update(value){var dark=value.theme==='dark'?1:0;uniforms.uDark.value=dark;beamUniforms.uDark.value=dark;}
    function resize(w,h,pixelRatio){renderer.setPixelRatio(pixelRatio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();var vh=2*Math.tan(camera.fov*Math.PI/360)*(camera.position.z-beam.position.z);beam.scale.set(vh*camera.aspect,vh,1);uniforms.uPixelRatio.value=pixelRatio;}
    function render(state){if(dead)return;uniforms.uTime.value=state.reducedMotion?0:state.time;beamUniforms.uTime.value=uniforms.uTime.value;renderer.render(scene,camera);}
    function dispose(){if(dead)return;dead=true;particlesGeometry.dispose();particlesMaterial.dispose();beamGeometry.dispose();beamMaterial.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();}
    return{canvas:renderer.domElement,animated:true,update:update,resize:resize,render:render,dispose:dispose};
  }
  var controller=root?createController():null;
  return{sync:function(value){return controller?controller.sync(value):Promise.resolve(false);},destroy:function(){if(controller)controller.destroy();},status:function(){return controller?controller.status():{enabled:false,ready:false,loading:false,fallback:false,animating:false};},createController:createController,settings:settings};
});
