(function(g){'use strict';
const esc=g.K.esc,A=g.ATLAS,C=g.S17Course,pageSize=12;
let stage='',method='',query='',group=[],groupName='',limit=pageSize,refresh=null;
function entries(){
 const base=g.S17CaseCatalog?.cases??[...(C?.cases??[]).map(c=>({...c,sceneId:c.scene,title:c.name,primary:true})),...(g.S17Expansion?.cases??[])];
 const map=new Map(base.map(c=>[c.id,c]));
 for(const c of g.Cases?.list()??[]){if(!c.imported)continue;const sc=A.index.byScene[c.sceneId];if(!sc)continue;map.set(c.id,{...(map.get(c.id)??{}),...c,summary:c.tabs?.background?.lede??'',stageId:sc.stageId,stageName:sc.stageName,origin:'本机导入'});}
 const hidden=new Set(g.CaseImport?.blockedList?.()??[]);
 return [...map.values()].filter(c=>A.index.byScene[c.sceneId]&&!hidden.has(c.id));
}
function href(c){if(g.Cases?.get(c.id)?.imported)return '#/scene/'+c.sceneId+'?case='+encodeURIComponent(c.id)+'&tab=bg';return c.href??('#/scene/'+c.sceneId+'?case='+encodeURIComponent(c.id)+'&tab=bg');}
function count(stageId){return entries().filter(c=>!stageId||c.stageId===stageId).length;}
function markup(){return `<section class="sc-catalog" id="s17-catalog" aria-label="案例目录"><div class="sc-browser"><aside class="sc-stages" aria-label="按作业阶段筛选"><button type="button" data-sc-stage="">全部阶段 <b>${count()}</b></button>${A.stages.map(s=>`<button type="button" data-sc-stage="${esc(s.id)}"><small>${g.K.pad(s.idx)}</small><span>${esc(s.name)}</span><b>${count(s.id)}例</b></button>`).join('')}</aside><div class="sc-main"><div class="sc-tools"><label for="sc-query">搜索案例<input type="search" id="sc-query" placeholder="输入名称或问题，如：气测、断层" autocomplete="off"></label><button type="button" class="sc-reset" data-sc-reset>清除筛选</button></div><details class="sc-advanced"><summary>按智能方法筛选</summary><div class="sc-methods" role="group" aria-label="按智能方法筛选"><button type="button" data-sc-method="">全部方法</button>${Object.entries(A.methods).map(([k,v])=>`<button type="button" data-sc-method="${esc(k)}">${esc(v.name)}</button>`).join('')}</div></details><div class="sc-result-head"><h3 id="sc-stage-title"></h3><span id="sc-result-count" role="status" aria-live="polite"></span></div><div id="sc-results"></div><button type="button" class="sc-more" id="sc-more" hidden>显示更多场景</button><p class="sc-original-sample">老师原样例：<a href="#/scene/w1?case=welllog-layer&tab=bg">测井曲线智能分层 →</a></p></div></div></section>`;}
function reset(){stage='';method='';query='';group=[];groupName='';limit=pageSize;refresh?.();}
function selectGroup(stages,name){stage='';method='';query='';group=stages.slice();groupName=name;limit=pageSize;refresh?.();}
function init(){
 const root=document.getElementById('s17-catalog');if(!root)return;
 const input=root.querySelector('#sc-query');
 function draw(){
  input.value=query;const all=entries(),needle=query.toLocaleLowerCase();
  const groups=A.allScenes.filter(s=>(!stage||s.stageId===stage)&&(!group.length||group.includes(s.stageId))).map(s=>{
   const sceneText=[s.name,s.problem,s.intro,s.id,s.stageName].join(' ').toLocaleLowerCase();
   const cases=all.filter(c=>c.sceneId===s.id&&(!method||(c.methods??s.methods).includes(method))&&(!needle||sceneText.includes(needle)||[c.id,c.title,c.summary,(c.methods??[]).map(m=>A.methods[m]?.name).join(' ')].join(' ').toLocaleLowerCase().includes(needle)));
   return {scene:s,cases};
  }).filter(row=>row.cases.length);
  const found=groups.reduce((n,row)=>n+row.cases.length,0),st=A.index.byStage[stage];
  root.querySelectorAll('[data-sc-stage]').forEach(b=>b.setAttribute('aria-pressed',String(!group.length&&b.dataset.scStage===stage)));
  root.querySelectorAll('[data-sc-method]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scMethod===method)));
  root.querySelector('#sc-stage-title').textContent=st?st.name:groupName||'全部案例';
  root.querySelector('#sc-result-count').textContent=`${groups.length} 个场景 · ${found} 个案例${groups.length>limit?' · 先显示 '+limit+' 个场景':''}`;
  root.querySelector('#sc-results').innerHTML=groups.length?groups.slice(0,limit).map(({scene:s,cases})=>`<article class="sc-result${cases.length>1?' sc-result-multiple':''}"><div class="sc-result-meta"><span>${esc(s.stageName)}</span><span>${esc(s.id.toUpperCase())}${cases.length>1?' · '+cases.length+' 个案例':''}</span></div><h4 class="sc-scene-name">${esc(s.name)}</h4><div class="sc-case-choices">${cases.map(c=>{
   const own=C?.cases?.find(row=>row.id===c.id),summary=own?.question??c.summary??s.problem??s.intro;
   return `<a href="${esc(href(c))}" data-sc-case-id="${esc(c.id)}"><h5>${esc(c.title??s.name)}${c.primary===false?'<span class="sc-case-badge">拓展案例</span>':''}</h5><p>${esc(summary)}</p><span class="sc-result-link">进入案例 <span aria-hidden="true">→</span></span></a>`;
  }).join('')}</div></article>`).join(''):'<div class="sc-empty"><h4>没有找到相符的案例</h4><p>可以缩短关键词，或清除筛选后再试。</p><button type="button" data-sc-reset>清除筛选</button></div>';
  const more=root.querySelector('#sc-more');more.hidden=limit>=groups.length;more.textContent=`再显示 ${Math.max(0,Math.min(pageSize,groups.length-limit))} 个场景`;
  root.dataset.resultCount=found;root.dataset.sceneCount=groups.length;root.dataset.visibleCount=Math.min(limit,groups.length);
 }
 root.addEventListener('click',e=>{const sb=e.target.closest('[data-sc-stage]'),mb=e.target.closest('[data-sc-method]');if(sb){stage=sb.dataset.scStage;group=[];groupName='';limit=pageSize;draw();root.querySelector('.sc-tools').scrollIntoView({block:'start',behavior:'auto'});}else if(mb){method=mb.dataset.scMethod;limit=pageSize;draw();}else if(e.target.closest('[data-sc-reset]'))reset();else if(e.target.closest('#sc-more')){const old=limit;limit+=pageSize;draw();const next=root.querySelectorAll('.sc-result')[old]?.querySelector('a');next?.focus({preventScroll:true});next?.scrollIntoView({block:'nearest',behavior:'auto'});}});
 input.addEventListener('input',()=>{query=input.value.trim();limit=pageSize;draw();});refresh=draw;draw();
}
g.S17Catalog={markup,init,selectGroup,reset,count,entries};
})(window);
