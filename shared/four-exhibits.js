(function(g){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentAPI=null,refreshFlow=null;
function notify(message){const n=document.getElementById('status');if(n)n.textContent=message;}
function changed(){refreshFlow?.();const b=document.getElementById('export');if(b&&currentAPI)b.disabled=currentAPI.snapshot().status!=='ready';}
function readingMount(root){root.querySelectorAll('[data-fx-scene]').forEach(box=>{
 if(box.dataset.fxMounted)return;box.dataset.fxMounted='true';
 const scene=box.dataset.fxScene,L=g[scene.toUpperCase()+'Exhibit'];
 box.querySelectorAll('[data-fx-map]').forEach(b=>{b.disabled=false;b.addEventListener('click',()=>{
  const i=Number(b.dataset.fxMap);box.querySelectorAll('[data-fx-region]').forEach(r=>r.classList.toggle('is-current',Number(r.dataset.fxRegion)===i));box.querySelectorAll('[data-fx-map]').forEach(x=>{if(!x.classList.contains('fx-hotspot'))x.setAttribute('aria-pressed',String(Number(x.dataset.fxMap)===i));});
  const t=box.querySelector('#'+scene+'-knowledge-'+i);t?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 });});L?.readingMount?.(box);
 });
 g.S17Scroll?.bind(root);root.querySelectorAll('[data-lesson-step]').forEach(n=>{n.tabIndex=0;n.setAttribute('aria-disabled','false');});
 root.querySelectorAll('[data-fx-flow-root]').forEach(box=>box.querySelectorAll('[data-fx-step-panel]').forEach(p=>p.hidden=false));
 if(!root.dataset.fxLocateBound){root.dataset.fxLocateBound='true';const locate=e=>{const b=e.target.closest('[data-lesson-step]');if(!b||e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();const scene=b.dataset.lessonScene,i=b.dataset.lessonStep;const target=root.querySelector('#'+scene+'-method-'+i+',#'+scene+'-flow-'+i);target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});};root.addEventListener('click',locate);root.addEventListener('keydown',locate);}
}
function start(scene){document.body.classList.add('s17-lesson-reading');const L=g[scene.toUpperCase()+'Exhibit'];if(!L)throw Error('Missing case lesson '+scene);let api=null,part='background',step=0;const root=document.querySelector('.fx-exhibit');
 const selectPart=name=>{part=['background','workflow','lab'].includes(name)?name:'background';document.querySelectorAll('[data-fx-part-panel]').forEach(p=>p.hidden=false);document.querySelectorAll('[data-fx-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fxPart===part)));if(['http:','https:','file:'].includes(location.protocol))history.replaceState(null,'','#'+part);};
 function drawFlow(){if(!api)return;document.getElementById('fx-flow-current').innerHTML=L.steps.map((s,i)=>'<section class="lesson-method-step" id="'+scene+'-method-'+i+'"><header><span class="lesson-step-number">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(s.name)+'</h3><p>'+esc(s.action)+'</p></div></header>'+api.flowHTML(i)+'</section>').join('');}
 refreshFlow=drawFlow;
 document.querySelectorAll('[data-fx-part]').forEach(b=>b.onclick=()=>{selectPart(b.dataset.fxPart);document.getElementById(part)?.scrollIntoView({block:'start'});});document.querySelectorAll('[data-fx-live-step]').forEach(b=>b.onclick=()=>{step=Number(b.dataset.fxLiveStep);drawFlow();});
 root.addEventListener('click',e=>{const b=e.target.closest('[data-m1-stage],[data-m5-stage]');if(!b)return;const key=scene==='m1'?'data-m1-panel':'data-m5-stage-panel',value=b.dataset.m1Stage??b.dataset.m5Stage;requestAnimationFrame(()=>root.querySelector('['+key+'="'+value+'"]')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'}));});
 readingMount(root);selectPart(location.hash.slice(1)||'background');g.S17Scroll.trackSections('data-fx-part');
 const status=document.getElementById('status');status.textContent='正在准备当前样品并执行计算…';document.getElementById('export').disabled=true;
 // Paint the lesson before the existing training calculation starts.
 setTimeout(()=>{try{api=L.mount(document.getElementById('lab-root'));currentAPI=api;g.S17Inspect=api;g[scene.toUpperCase()+'Inspect']=api;changed();drawFlow();document.getElementById('run').onclick=()=>{api.recalculate();changed();};document.getElementById('reset').onclick=()=>{api.reset();changed();};document.getElementById('export').onclick=()=>{try{const value=api.evidence();g.S17UI.download('s17-'+scene+'-'+value.runId+'.json',value);document.getElementById('save-tip').textContent='已保存当前输入和计算结果。';}catch(e){document.getElementById('save-tip').textContent=e.message;}};if(part!=='background')document.getElementById(part)?.scrollIntoView({block:'start'});if(status.textContent.includes('正在准备'))notify('当前结果已计算，可改变一个条件观察变化。');}catch(e){notify('计算失败：'+e.message);console.error(e);}},30);
 g.addEventListener('hashchange',()=>{selectPart(location.hash.slice(1));document.getElementById(part)?.scrollIntoView({block:'start'});});
}
g.S17Exhibit={notify,changed,readingMount,start};
})(globalThis);
