/* Per-case classic-script hydration. Teacher core and uploaded packages keep their contracts. */
(function(g){
 'use strict';
 if(g.S17CaseLoader)return;
 var states=Object.create(null),handles=Object.create(null),viewTimer=null;
 var script=g.document&&g.document.currentScript;
 var base=script&&script.src?new URL('../',script.src).href:g.document&&new URL('./',g.document.baseURI).href;
 function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function rows(){var catalog=g.S17CaseCatalog;return catalog?(catalog.teacherCases||[]).concat(catalog.cases||[]):[];}
 function metadata(id){return rows().filter(function(c){return c.id===id;})[0]||null;}
 function blocked(id){return !!(g.CaseImport&&g.CaseImport.blockedList&&g.CaseImport.blockedList().indexOf(id)>=0);}
 function selected(){
  if(!g.location)return null;var match=g.location.hash.match(/^#\/scene\/([^?&/]+)/);if(!match)return null;
  var scene=decodeURIComponent(match[1]),query=new URLSearchParams(g.location.hash.split('?')[1]||''),all=g.Cases.bySceneAll(scene);
  return all.filter(function(c){return c.id===query.get('case');})[0]||all[0]||null;
 }
 function redraw(id){
  if(!g.document||!g.setTimeout)return;var active=selected();if(!active||active.id!==id||active.imported||blocked(id))return;if(viewTimer)g.clearTimeout(viewTimer);
  viewTimer=g.setTimeout(function(){viewTimer=null;var current=selected();if(current&&current.id===id&&!current.imported&&!blocked(id))g.dispatchEvent(new g.Event('hashchange'));},0);
 }
 function state(id){var row=metadata(id);if(!row)return null;return states[id]||(states[id]={id:id,version:row.version,status:'idle',attempts:0,error:null,promise:null,node:null});}
 function placeholder(c,part){
  var s=state(c.id),failed=s&&s.status==='error';
  return '<div class="s17-lazy-panel" role="status" aria-live="polite"><span class="s17-lazy-kicker">'+esc(c.title)+'</span><h2>'+ (failed?'本案例暂时未能载入':'正在载入'+(part==='flow'?'案例流程':'专业背景'))+'</h2><p>'+(failed?'请重试，或打开随课程提供的独立成品。': '正在读取本案例的背景、流程与交互内容。')+'</p>'+(failed?'<p class="s17-lazy-error">'+esc(s.error)+'</p><button type="button" data-case-retry="'+esc(c.id)+'">重新载入</button>':'<span class="s17-lazy-progress" aria-hidden="true"></span>')+(failed&&metadata(c.id)?'<a href="'+esc(metadata(c.id).standaloneHref)+'">打开独立成品 →</a>':'')+'</div>';
 }
 function demo(row,definition){
  var frame=null,config=definition||{},pendingRoot=null;
  return {label:config.label||'可运行示范',intro:config.intro||row.summary,mode:'bundled-page',
   mount:function(root,ctx){
    pendingRoot=root;var handle=handles[row.id];
    if(!handle.bodyReady){root.innerHTML=placeholder(handle,'demo');ensure(row.id).catch(function(){});return;}
    if(row.demoMode==='module'){if(handle.tabs.demo!==this)handle.tabs.demo.mount(root,ctx);return;}
    if(frame)frame.remove();frame=g.document.createElement('iframe');frame.title=row.title+' · 交互演示';
    // These URLs come only from the shipped catalogue. Chrome otherwise blocks
    // local CSS/JS inside an opaque-origin file iframe; uploaded packages retain
    // the teacher importer's separate sandbox and are not handled here.
    frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-popups allow-downloads'+(g.location.protocol==='file:'?' allow-same-origin':''));
    frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('loading','eager');
    frame.src=row.standaloneHref;frame.style.cssText='display:block;width:100%;border:0;border-radius:16px;background:#f7f4ef;min-height:'+Math.max(620,Math.min(2600,Number(config.height)||1100))+'px';root.replaceChildren(frame);
   },unmount:function(){pendingRoot=null;if(frame){frame.remove();frame=null;}}
  };
 }
 function registerCatalog(){
  if(!g.Cases)return;
  rows().forEach(function(row){
   if(handles[row.id])return;
   var current=g.Cases.get(row.id),handle={id:row.id,sceneId:row.sceneId,title:row.title,methods:row.methods.slice(),version:row.version,
    status:'ready',updated:row.updated,builtIn:true,imported:false,teacherSample:!!row.teacherSample,expansion:row.directory==='expansion-cases',lazy:true,bodyReady:false,
    tabs:{background:{label:'专业背景',lede:row.summary,sections:[]},workflow:{label:'案例流程',title:row.title,steps:[]},demo:null}};
   handle.tabs.demo=demo(row);handles[row.id]=handle;state(row.id);
   if(!current&&!blocked(row.id))g.Cases.register(handle);
  });
 }
 function fail(id,version,error){
  var s=state(id);if(!s||s.version!==version||s.status==='ready')return;
  s.status='error';s.error=error&&error.message||String(error||'读取失败');
  if(s.timer)g.clearTimeout(s.timer);s.timer=null;
  if(s.node){s.node.remove();s.node=null;}
  var reject=s.reject;s.resolve=null;s.reject=null;s.promise=null;if(reject)reject(Error(s.error));redraw(id);
 }
 function complete(payload){
  var row=metadata(payload&&payload.id),handle=row&&handles[row.id],s=row&&state(row.id);
  if(!row||!handle||payload.version!==row.version)throw Error('Case body version does not match its catalogue');
  // Hydrate the stable built-in handle; an imported override remains the registered object.
  handle.tabs={background:payload.tabs.background,workflow:payload.tabs.workflow,demo:row.demoMode==='module'?payload.tabs.demo:demo(row,payload.tabs.demo)};
  handle.lazyReading=payload.reading||null;handle.bodyReady=true;s.status='ready';s.error=null;
  if(s.timer)g.clearTimeout(s.timer);s.timer=null;
  var resolve=s.resolve;s.resolve=null;s.reject=null;s.promise=Promise.resolve(handle);if(resolve)resolve(handle);
  if(g.dispatchEvent&&g.CustomEvent)g.dispatchEvent(new g.CustomEvent('s17casebodyready',{detail:{caseId:row.id,version:row.version}}));
  redraw(row.id);
 }
 function ensure(id){
  registerCatalog();var current=g.Cases&&g.Cases.get(id),row=metadata(id);
  if(current&&current.imported)return Promise.resolve(current);
  if(!row)return current?Promise.resolve(current):Promise.reject(Error('Unknown case: '+id));
  if(blocked(id))return Promise.reject(Error('This case is hidden in this browser'));
  var s=state(id),handle=handles[id];if(handle.bodyReady)return Promise.resolve(handle);if(s.promise)return s.promise;if(s.status==='error')return Promise.reject(Error(s.error));
  s.status='loading';s.error=null;s.attempts++;
  s.promise=new Promise(function(resolve,reject){
   s.resolve=resolve;s.reject=reject;
   var node=g.document.createElement('script');s.node=node;node.src=new URL(row.contentURL,base).href;node.async=true;
   node.onload=function(){if(s.status!=='ready')fail(id,row.version,Error('Case script loaded without completing its body'));};
   node.onerror=function(){fail(id,row.version,Error('无法读取本案例文件，请确认课程目录完整后重试。'));};
   s.timer=g.setTimeout(function(){fail(id,row.version,Error('本案例载入超时，请重试。'));},25000);
   g.document.head.appendChild(node);
  });return s.promise;
 }
 function retry(id){var s=state(id);if(s&&s.status==='loading')return s.promise;if(s&&s.status!=='ready'){s.status='idle';s.promise=null;s.error=null;}redraw(id);return ensure(id);}
 function isReady(c){var current=typeof c==='string'?g.Cases&&g.Cases.get(c):c;return !!current&&(!current.lazy||current.bodyReady===true);}
 g.S17CaseLoader={ensure:ensure,complete:complete,fail:fail,retry:retry,isReady:isReady,placeholder:placeholder,registerCatalog:registerCatalog,
  snapshot:function(){return rows().map(function(row){var s=state(row.id);return {id:row.id,version:row.version,status:s.status,attempts:s.attempts,error:s.error,registered:g.Cases&&g.Cases.get(row.id)===handles[row.id]};});}};
 if(g.Cases){
  var validate=g.Cases.validate;
  g.Cases.validateAll=function(){var out={};g.Cases.list().forEach(function(c){out[c.id]=c.lazy&&!c.bodyReady?[{level:'warn',label:'正文尚未载入',detail:'目录已就绪；完整内容将在进入案例时读取，此处不声明正文校验通过。'}]:validate(c);});return out;};
 }
 registerCatalog();
 if(g.document)g.document.addEventListener('click',function(event){var button=event.target.closest('[data-case-retry]');if(button){event.preventDefault();retry(button.dataset.caseRetry).catch(function(){});}});
 if(g.addEventListener)g.addEventListener('s17catalogready',registerCatalog);
})(window);
