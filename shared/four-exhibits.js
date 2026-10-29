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
 root.querySelectorAll('[data-fx-flow-root]').forEach(box=>{if(box.dataset.fxFlowMounted)return;box.dataset.fxFlowMounted='true';const bs=[...box.querySelectorAll('[data-fx-step]')],ps=[...box.querySelectorAll('[data-fx-step-panel]')];function show(i){bs.forEach((b,j)=>b.setAttribute('aria-selected',String(i===j)));ps.forEach((p,j)=>p.hidden=i!==j);}
 bs.forEach((b,i)=>{b.disabled=false;b.onclick=()=>show(i);b.onkeydown=e=>{const keys=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'];if(!keys.includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+bs.length)%bs.length;show(j);bs[j].focus();};});if(bs.length)show(0);
 });
}
function start(scene){const L=g[scene.toUpperCase()+'Exhibit'];if(!L)throw Error('Missing case lesson '+scene);let api=null,part='background',step=0;const root=document.querySelector('.fx-exhibit');
 const selectPart=name=>{part=['background','workflow','lab'].includes(name)?name:'background';document.querySelectorAll('[data-fx-part-panel]').forEach(p=>p.hidden=p.dataset.fxPartPanel!==part);document.querySelectorAll('[data-fx-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fxPart===part)));if(part==='workflow')drawFlow();if(['http:','https:','file:'].includes(location.protocol))history.replaceState(null,'','#'+part);};
 function drawFlow(){if(!api)return;const s=L.steps[step];document.getElementById('fx-flow-current').innerHTML='<span class="fx-kicker">STEP '+String(step+1).padStart(2,'0')+' / '+L.steps.length+'</span><h3>'+esc(s.name)+'</h3><div class="fx-flow-facts"><div><b>具体输入</b><p>'+esc(s.input)+'</p></div><div><b>实际动作</b><p>'+esc(s.action)+'</p></div><div><b>计算产物</b><p>'+esc(s.output)+'</p></div></div>'+api.flowHTML(step);document.querySelectorAll('#fx-live-step-nav [data-fx-live-step]').forEach((b,i)=>b.setAttribute('aria-selected',String(i===step)));}
 refreshFlow=drawFlow;
 document.querySelectorAll('[data-fx-part]').forEach(b=>b.onclick=()=>{selectPart(b.dataset.fxPart);document.getElementById(part)?.scrollIntoView({block:'start'});});document.querySelectorAll('[data-fx-live-step]').forEach(b=>b.onclick=()=>{step=Number(b.dataset.fxLiveStep);drawFlow();});
 readingMount(root);selectPart(location.hash.slice(1)||'background');
 const status=document.getElementById('status');status.textContent='正在准备当前样品并执行计算…';document.getElementById('export').disabled=true;
 // Paint the lesson before the existing training calculation starts.
 setTimeout(()=>{try{api=L.mount(document.getElementById('lab-root'));currentAPI=api;g.S17Inspect=api;g[scene.toUpperCase()+'Inspect']=api;changed();drawFlow();document.getElementById('run').onclick=()=>{api.recalculate();changed();};document.getElementById('reset').onclick=()=>{api.reset();changed();};document.getElementById('export').onclick=()=>{try{const value=api.evidence();g.S17UI.download('s17-'+scene+'-'+value.runId+'.json',value);document.getElementById('save-tip').textContent='已保存当前输入和计算结果。';}catch(e){document.getElementById('save-tip').textContent=e.message;}};if(status.textContent.includes('正在准备'))notify('当前结果已计算，可改变一个条件观察变化。');}catch(e){notify('计算失败：'+e.message);console.error(e);}},30);
 g.addEventListener('hashchange',()=>selectPart(location.hash.slice(1)));
}
g.S17Exhibit={notify,changed,readingMount,start};
})(globalThis);
