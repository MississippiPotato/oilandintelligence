(function(g){'use strict';
 const c=g.S17Lesson;let timer=null,busy=false,task=-1,computations=0,lastRun=null;
 const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const snapshot=()=>{try{const s=g.CaseInspect?.snapshot?.();if(!s)return null;const status=s.status||(typeof s.state==='string'?s.state:null)||(s.computed?(s.stale?'stale':'ready'):null);return{...s,status:status==='computed'?'ready':status,params:s.params||s.currentParams||s.options||s.result?.params||null};}catch{return null;}};
 const ready=()=>['ready','done','complete','completed'].includes(snapshot()?.status)&&!!$('export')&&!$('export').disabled;
 function readable(root,selector,kind){root.querySelectorAll(selector).forEach(el=>{if(el.parentElement?.classList.contains(kind))return;const box=document.createElement('div');box.className=kind;el.before(box);box.append(el);const hint=document.createElement('span');hint.className='xl-diagram-hint';hint.textContent='左右滑动查看完整坐标与标注';box.append(hint);});}
 function mountReading(root){
  readable(root,'.xl-knowledge svg,.xl-method-step svg','xl-diagram');
  root.querySelectorAll('[data-xl-chapter]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();root.querySelector('#xl-chapter-'+a.dataset.xlChapter)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}));
  const buttons=[...root.querySelectorAll('[data-xl-step]')],panels=[...root.querySelectorAll('[data-xl-panel]')];
  function step(i){buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});panels.forEach((p,j)=>p.hidden=j!==i);}
  buttons.forEach((b,i)=>{b.onclick=()=>step(i);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;step(j);buttons[j].focus();};});if(buttons.length)step(0);
  if(!c)root.querySelectorAll('[data-xl-tab]').forEach(b=>b.onclick=()=>root.querySelector('#tabs [data-tab="'+({workflow:'flow',lab:'demo'}[b.dataset.xlTab]||'bg')+'"]')?.click());
 }
 function setTab(tab){if(!['background','workflow','lab'].includes(tab))return;['background','workflow','lab'].forEach(id=>{if($(id))$(id).hidden=id!==tab;});document.querySelectorAll('nav [data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});if(location.hash!=='#'+tab){try{history.replaceState(null,'','#'+tab);}catch{location.hash=tab;}}}
 function update(){
  const s=snapshot(),out=$('xl-update');if(!out)return;
  if(ready()){lastRun={at:new Date().toISOString(),params:s.params||s.currentParams||null,runId:s.runId||null};out.textContent='当前条件已计算 · 图表可点选，修改条件后自动更新';if($('status'))$('status').textContent='计算完成。图表和对照来自当前输入；修改教学条件后会自动重新计算。';if(innerWidth<760)readable(document,'#lab canvas,#lab svg','xl-data-plot');}
  else if(s?.status==='error'){out.textContent='当前计算未完成，请查看下方状态。';}
 }
 function recalculate(){clearTimeout(timer);if(busy)return;computations++;$('run')?.click();update();setTimeout(update,150);}
 function schedule(){clearTimeout(timer);const out=$('xl-update');if(out)out.textContent='条件已改变 · 正在更新当前计算…';timer=setTimeout(recalculate,300);}
 function fold(el,label){if(!el||el.closest('.xl-fold'))return;const details=document.createElement('details'),summary=document.createElement('summary');details.className='xl-fold';summary.textContent=label;el.before(details);details.append(summary,el);}
 function start(){
  document.body.classList.add('xl-lesson');
  if($('background'))$('background').innerHTML=c.background;
  if($('workflow'))$('workflow').innerHTML=c.workflow;
  mountReading(document);
  document.querySelectorAll('nav [data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
  document.querySelectorAll('[data-xl-tab]').forEach(b=>b.onclick=()=>{const tab=b.dataset.xlTab;document.querySelector('nav [data-tab="'+tab+'"]')?.click();setTab(tab);window.scrollTo({top:0,behavior:'instant'});});
  const lab=$('lab');if(!lab)return;
  const guide=document.createElement('aside');guide.className='xl-lab-guide';guide.innerHTML='<span class="xl-kicker">动手比较 · '+safe(c.object)+'</span><h2>'+safe(c.insight)+'</h2><p>先读默认结果，再选择一个比较。每个按钮都从默认条件开始，修改已有输入并重新计算。</p><div class="xl-task-actions">'+c.tasks.map((t,i)=>'<button type="button" data-xl-task="'+i+'" aria-pressed="false">'+safe(t.label)+'</button>').join('')+'<button type="button" data-xl-restore>回到默认</button></div><p class="xl-task-look" id="xl-look">'+safe(c.reading[2])+'</p><span class="xl-update" id="xl-update" role="status" aria-live="polite"></span>';
  lab.prepend(guide);
  const ids=[...new Set([...c.parameters,...c.tasks.flatMap(t=>Object.keys(t.values))])],defaults={};
  ids.forEach(id=>{const el=$(id);if(el){defaults[id]=el.type==='checkbox'?el.checked:el.value;el.addEventListener('input',schedule);el.addEventListener('change',schedule);}});
  function restore(){busy=true;clearTimeout(timer);$('reset')?.click();busy=false;task=-1;guide.querySelectorAll('[data-xl-task]').forEach(b=>b.setAttribute('aria-pressed','false'));$('xl-look').textContent=c.reading[2];}
  guide.querySelector('[data-xl-restore]').onclick=()=>{restore();recalculate();};
  guide.querySelectorAll('[data-xl-task]').forEach(b=>b.onclick=()=>{
   restore();busy=true;task=+b.dataset.xlTask;const t=c.tasks[task];
   for(const [id,value]of Object.entries(t.values)){const el=$(id);if(!el)continue;if(el.type==='checkbox')el.checked=!!value;else el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
   busy=false;clearTimeout(timer);guide.querySelectorAll('[data-xl-task]').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));$('xl-look').textContent=t.look;recalculate();
  });
  $('run')?.addEventListener('click',()=>{clearTimeout(timer);setTimeout(update,50);});
  $('reset')?.addEventListener('click',()=>{if(!busy){task=-1;guide.querySelectorAll('[data-xl-task]').forEach(b=>b.setAttribute('aria-pressed','false'));$('xl-look').textContent=c.reading[2];schedule();}});
  // Existing observers and event listeners remain attached when a node is moved.
  const result=$('results'),metrics=$('metrics');
  if(result&&metrics&&metrics.parentElement?.parentElement===result&&metrics.parentElement.classList.contains('card')){
   const card=metrics.parentElement;result.append(card);fold(card,'展开数值比较与评价分母');
  }
  for(const [id,label]of [['learning','训练选择与计算依据'],['learning-summary','数据划分与方法依据'],['coefficients','拟合系数'],['weights','拟合权重'],['provenance','数据来源与划分'],['table','展开计算明细']])fold($(id),label);
  const reviews=new Set([...lab.querySelectorAll('.review,.review-row')]);reviews.forEach(el=>fold(el,'记录自己的核查意见'));
  const save=$('export');if(save){const row=document.createElement('div');row.className='xl-save';save.classList.remove('primary');save.textContent='保存当前计算 JSON ↓';row.append(save);lab.append(row);}
  new MutationObserver(()=>{if(innerWidth<760)readable(document,'#lab canvas,#lab svg','xl-data-plot');}).observe(lab,{childList:true,subtree:true});
  g.addEventListener('resize',()=>{if(innerWidth<760)readable(document,'#lab canvas,#lab svg','xl-data-plot');});
  // Keep real observations in the charts; reference layers stay under their existing switches.
  if(!ready())recalculate();else update();
  setTab(['background','workflow','lab'].includes(location.hash.slice(1))?location.hash.slice(1):'background');
  g.LessonInspect={snapshot:()=>({sceneId:c.sceneId,version:c.version,task,computations,lastRun,defaults,current:snapshot()}),tasks:c.tasks};
 }
 g.ExpansionReading={mount:mountReading};if(!c)return;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
