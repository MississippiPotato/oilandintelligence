(function(g){'use strict';
 const c=g.S17Lesson;let timer=null,busy=false,task=-1,computations=0,lastRun=null;
 const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const snapshot=()=>{try{const s=g.CaseInspect?.snapshot?.();if(!s)return null;const status=s.status||(typeof s.state==='string'?s.state:null)||(s.computed?(s.stale?'stale':'ready'):null);return{...s,status:status==='computed'?'ready':status,params:s.params||s.currentParams||s.options||s.result?.params||null};}catch{return null;}};
 const ready=()=>['ready','done','complete','completed'].includes(snapshot()?.status)&&!!$('export')&&!$('export').disabled;
 function readable(root,selector,kind){root.querySelectorAll(selector).forEach(el=>{if(el.parentElement?.classList.contains(kind))return;const box=document.createElement('div');box.className=kind;el.before(box);box.append(el);const hint=document.createElement('span');hint.className='xl-diagram-hint';hint.textContent='左右滑动查看完整坐标与标注';box.append(hint);});}
 function mountReading(root){
  g.S17ConceptHost?.mount(root);
  readable(root,'.xl-knowledge svg,.xl-method-step svg','xl-diagram');
  root.querySelectorAll('[data-xl-chapter]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();root.querySelector('#xl-chapter-'+a.dataset.xlChapter)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}));
  const buttons=[...root.querySelectorAll('[data-xl-step]')],panels=[...root.querySelectorAll('[data-xl-panel]')];
  function step(i){buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});panels.forEach((p,j)=>p.hidden=j!==i);}
  buttons.forEach((b,i)=>{b.onclick=()=>step(i);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;step(j);buttons[j].focus();};});if(buttons.length)step(0);
  if(!c)root.querySelectorAll('[data-xl-tab]').forEach(b=>b.onclick=()=>root.querySelector('#tabs [data-tab="'+({workflow:'flow',lab:'demo'}[b.dataset.xlTab]||'bg')+'"]')?.click());
 }
 function setTab(tab){if(!['background','workflow','lab'].includes(tab))return;['background','workflow','lab'].forEach(id=>{if($(id))$(id).hidden=id!==tab;});document.querySelectorAll('nav [data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});if(location.hash!=='#'+tab){try{history.replaceState(null,'','#'+tab);}catch{location.hash=tab;}}}
 // View-only narration mapping: result objects, engine values and JSON exports stay intact.
 const narrativeCopy={"d2":[["教学事件时点固定，附加项为0时是无可见先兆的负对照；","附加项为0时，比较没有可见先兆的负对照；"],["窗口分类真值仅145—164","窗口分类参考区间为145—164 min"]],"d4":[["训练用已知标签，测试标签只在评分函数内使用。","从训练标签学习后，先预测90个留出窗，再统一评分。"]],"d5":[["本例优化塑性黏度，不把它混同于密度或静切力。","本页围绕塑性黏度比较流变斜率。"],["成本是无量纲教学相对代价，不是货币报价。","成本采用无量纲的教学相对代价。"]],"e2":[["L/H只在训练拟合与留出评价读取。","L/H用于训练目标与留出评价。"],["固定中心椭圆用于比较尺度；这里不推断复杂分叉与三维连通性。","固定中心椭圆按预测半长与半高绘制，用来比较二维尺度。"]],"e3":[["性能是无量纲教学指数（可低于自定零点），不是采收率百分点。","性能采用无量纲教学指数，自定零点两侧的值均保留。"]],"e4":[["这是质量汽油比，不含蒸汽品质/焓值，不能当能量效率；固定90d累计量不是每日产量。","质量汽油比=蒸汽质量÷90天累计产油质量，单位为t汽/t油。"]],"e5":[["高活性还须代谢物和岩心驱替验证才能支持增油。","培养活性可结合代谢产物与岩心驱替观察，继续讨论采油过程。"],["当前k为探索参数，留出MAE不是调参后独立的最终验收。","改变k时，对照当前留出MAE与邻居组成。"]],"g3":[["自绘 16×16 图例符号，经平移与像素翻转产生独立教学图块；不代表真实扫描图准确率。","数据为自绘16×16图例符号，经平移与像素翻转生成独立教学图块。"]],"p2":[["另外 3 批次 84 条只用于评价。","另外3批次84条留出评价。"],["输入不包含试验目标。","输入为材料强度、孔隙度与围压。"]],"p3":[["数值是无量纲教学属性，不对应真实型号或作业参数。","数值为虚构目录的无量纲教学属性。"],["推理规则公开，不声称训练了神经网络；","按公开规则逐项推理；"]],"p4":[["当前交互中的“设定效果”只进入观测生成器，不传入校正函数。模型读取前后压差、含水和观测产量，不读取效果标签。","设定效果用于生成教学观测；校正读取前后压差、含水与观测产量。"],["这是工况校正筛查，作业因果归因还需要更多设计与证据。","将剩余响应作为筛查线索，继续回查井史与其他干预。"]],"pr2":[["未来真实产量只在预测完成后用于画线和评价。","整段预测冻结后，再与未来观测并列评价。"],["当前滞后模型没有胜过简单方法，应保留这个结果。","比较两种误差，再回看这段历史是否较平缓。"],["而不是偷读未来实测滞后。","逐日向前滚动。"]],"pr3":[["界面不求解真实地下流场。","本页按三条拟合响应曲线比较同日配额。"]],"pr4":[["训练没有故障标签，推理只读取负荷、电流、温度；事件时段仅交给评价函数。","正常记录拟合温度关系，当前负荷、电流与温度用于残差筛查，事件时段在预测后用于评价。"]],"pr5":[["联合输入没有自动保证更好的留出结果。","对照两条路线的误报、漏报与分数分布。"]],"r1":[["固定种子教学合成工况；非现场标定","固定种子合成教学工况"]],"s3":[["参考初至仅供评价","预测完成后对照参考初至"]],"w1":[["（不是已证明的最小层厚）","（用于相邻候选去重）"]],"w2":[["测试 120 点，没有用于拟合。","120个独立点用于留出评价。"]],"w3":[["测试96×72=6912像素，不参与拟合。","留出图像96×72，共6912像素。"],["未给每像素米数，不估计倾角。","纵轴以像素行为尺度。"],["为归一教学响应，不是Ω·m。","按归一教学电性响应显示。"]],"w5":[["推断输入没有缺口的 RHOB。","缺口估计读取当前启用的可见辅助曲线。"],["这是假定尺度，没有在测试井拟合标准差。","按本页预设尺度比较距离。"],["灰线是独立评价原值，仅用于展示和计算分数。","灰线为封存密度原值，在修复完成后打开对照。"]],"wo2":[["只属教学规则。","为本页教学筛选条件。"],["目录不是现场产品规格。","目录采用虚构教学规格。"]],"wo3":[["truth掩膜仅由score评价读取。","预测完成后与独立参考掩膜评价。"],["结果不是套管外壁或剩余壁厚。","结果展示内半径正残差形成的局部凹坑。"]],"wo4":[["事件时间只在评价层使用。","报警形成后再与参考事件时间对照。"]],"wo5":[["（非用测试拟合的均值/方差）","（按预设工程范围）"],["这里未学习右删失或当前设备剩余寿命。","查询输出以检修A为起点的完整间隔估计。"]]};
 function polishNarrative(root){
  const pairs=narrativeCopy[c?.sceneId];if(!pairs?.length||!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   const parent=node.parentElement;
   if(!parent||parent.closest('script,style,pre,code,textarea,select,option,button,#status,#xl-update,[role="status"]'))continue;
   let value=node.nodeValue;for(const [before,after]of pairs)value=value.split(before).join(after);
   if(value!==node.nodeValue)node.nodeValue=value;
  }
 }
 function update(){
  polishNarrative(document);
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
  new MutationObserver(()=>{polishNarrative(lab);if(innerWidth<760)readable(document,'#lab canvas,#lab svg','xl-data-plot');}).observe(lab,{childList:true,subtree:true});
  g.addEventListener('resize',()=>{if(innerWidth<760)readable(document,'#lab canvas,#lab svg','xl-data-plot');});
  // Keep real observations in the charts; reference layers stay under their existing switches.
  if(!ready())recalculate();else update();
  setTab(['background','workflow','lab'].includes(location.hash.slice(1))?location.hash.slice(1):'background');
  g.LessonInspect={snapshot:()=>({sceneId:c.sceneId,version:c.version,task,computations,lastRun,defaults,current:snapshot()}),tasks:c.tasks};
 }
 g.ExpansionReading={mount:mountReading};if(!c)return;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
