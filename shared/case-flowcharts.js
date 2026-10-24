(function(g){'use strict';
function mount(root=document){root.querySelectorAll('.case-flow-overview').forEach(chart=>{
 if(chart.dataset.flowMounted)return;chart.dataset.flowMounted='true';
 const area=chart.closest('#workflow')||chart.closest('main')||root;
 const targets=()=>[...area.querySelectorAll('[data-sr-step],[data-step]')].filter(e=>!e.closest('.case-flow-overview'));
 const chapters=()=>area.querySelectorAll('#workflow-content>article,.flow-step,.workflow-step');
 const select=n=>{chart.querySelectorAll('[data-flow-step]').forEach(el=>el.setAttribute('aria-current',String(+el.dataset.flowStep===n)));};
 const go=el=>{const n=+el.dataset.flowStep,b=targets().find(b=>+(b.dataset.srStep??b.dataset.step)===n);if(b)b.click();else chapters()[n]?.scrollIntoView({block:'start',behavior:'auto'});select(n);};
 chart.querySelectorAll('[data-flow-step]').forEach(el=>{el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label','查看步骤 '+(+el.dataset.flowStep+1)+'：'+el.textContent.trim());});
 chart.querySelector('[data-flow-instruction]').textContent=' 点击图中节点，可查看对应步骤。';
 chart.addEventListener('click',e=>{const el=e.target.closest('[data-flow-step]');if(el)go(el);});
 chart.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-flow-step]')){e.preventDefault();go(e.target);}});
 area.addEventListener('click',e=>{const b=e.target.closest('[data-sr-step],[data-step]');if(b)select(+(b.dataset.srStep??b.dataset.step));});
 const current=targets().find(b=>b.matches('[aria-selected=true],[aria-pressed=true],.active'));select(+(current?.dataset.srStep??current?.dataset.step??0));
 });}
g.S17Flow={mount};
})(globalThis);
