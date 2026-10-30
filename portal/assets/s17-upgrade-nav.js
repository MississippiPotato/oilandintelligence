(function(g){'use strict';let queued=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(){
 const main=document.querySelector('#view main'),catalog=g.S17CaseCatalog;if(!main||!catalog)return;
 const m=location.hash.match(/^#\/stage\/([^?&/]+)/),stage=m&&g.ATLAS.index.byStage[m[1]];
 if(stage){const hidden=new Set(g.CaseImport?.blockedList?.()??[]),cases=catalog.cases.filter(c=>c.stageId===stage.id&&!hidden.has(c.id));if(!main.querySelector('.su-stage-count')){const p=document.createElement('p');p.className='su-stage-count';p.textContent=stage.scenes.length+' 个原场景 · '+cases.length+' 个自制案例';main.querySelector('.page-head')?.append(p);}
  if(cases.some(c=>c.primary===false)&&!main.querySelector('.su-stage-cases')){const section=document.createElement('section');section.className='su-stage-cases';section.setAttribute('aria-label',stage.name+'的五个案例');section.innerHTML='<h2>本环节的 '+cases.length+' 个案例</h2><p>从专业问题进入；同一场景的不同案例分别保留。</p><div>'+cases.map(c=>'<a href="'+esc(c.href)+'" data-su-case="'+esc(c.id)+'"><small>'+esc(c.sceneId.toUpperCase())+(c.primary===false?' · 拓展案例':'')+'</small><b>'+esc(c.title)+'</b><span>'+esc(c.summary)+'</span></a>').join('')+'</div>';main.querySelector('.page-head')?.after(section);}
 }
 const footer=main.parentElement?.querySelector('.s17-footer small');if(footer){const text='学号17 · 13个作业阶段 · 61个原场景 · '+catalog.cases.length+'个自制案例';if(footer.textContent!==text)footer.textContent=text;}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}
new MutationObserver(schedule).observe(document.getElementById('view'),{childList:true,subtree:true});addEventListener('hashchange',schedule);addEventListener('caseimportready',schedule);mount();
g.S17UpgradeNav={mount};
})(window);
