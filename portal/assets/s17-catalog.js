(function(g){'use strict';
const esc=g.K.esc,A=g.ATLAS,C=g.S17Course,pageSize=12;
let stage='',method='',query='',group=[],groupName='',limit=pageSize,refresh=null;
function markup(){return `<section class="sc-catalog" id="s17-catalog" aria-label="案例目录">
 <div class="sc-browser"><aside class="sc-stages" aria-label="按作业阶段筛选"><button type="button" data-sc-stage="">全部阶段 <b>${A.allScenes.length}</b></button>${A.stages.map(s=>`<button type="button" data-sc-stage="${esc(s.id)}"><small>${g.K.pad(s.idx)}</small><span>${esc(s.name)}</span><b>${s.scenes.length}</b></button>`).join('')}</aside>
 <div class="sc-main"><div class="sc-tools"><label for="sc-query">搜索案例<input type="search" id="sc-query" placeholder="输入名称或问题，如：气测、断层" autocomplete="off"></label><button type="button" class="sc-reset" data-sc-reset>清除筛选</button></div>
 <details class="sc-advanced"><summary>按智能方法筛选</summary><div class="sc-methods" role="group" aria-label="按智能方法筛选"><button type="button" data-sc-method="">全部方法</button>${Object.entries(A.methods).map(([k,v])=>`<button type="button" data-sc-method="${esc(k)}">${esc(v.name)}</button>`).join('')}</div></details>
 <div class="sc-result-head"><h3 id="sc-stage-title"></h3><span id="sc-result-count" role="status" aria-live="polite"></span></div><div id="sc-results"></div><button type="button" class="sc-more" id="sc-more" hidden>显示更多案例</button>
 </div></div></section>`;}
function reset(){stage='';method='';query='';group=[];groupName='';limit=pageSize;refresh?.();}
function selectGroup(stages,name){stage='';method='';query='';group=stages.slice();groupName=name;limit=pageSize;refresh?.();}
function init(){
 const root=document.getElementById('s17-catalog');if(!root)return;
 const input=root.querySelector('#sc-query');
 function draw(){
  input.value=query;
  const candidates=A.allScenes.filter(s=>(!stage||s.stageId===stage)&&(!group.length||group.includes(s.stageId))&&(!method||s.methods.includes(method))&&(!query||[s.name,s.problem,s.intro,s.id,s.stageName].join(' ').toLowerCase().includes(query.toLowerCase()))),st=A.index.byStage[stage];
  root.querySelectorAll('[data-sc-stage]').forEach(b=>b.setAttribute('aria-pressed',String(!group.length&&b.dataset.scStage===stage)));
  root.querySelectorAll('[data-sc-method]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scMethod===method)));
  root.querySelector('#sc-stage-title').textContent=st?st.name:groupName||'全部案例';
  root.querySelector('#sc-result-count').textContent=`共 ${candidates.length} 个${candidates.length>limit?' · 先显示 '+limit+' 个':''}`;
  root.querySelector('#sc-results').innerHTML=candidates.length?candidates.slice(0,limit).map(s=>{
   const own=C.byScene(s.id),extra=g.S17Expansion?.byScene(s.id),registered=g.Cases.bySceneAll(s.id),native=registered.find(c=>c.id===extra?.id)||registered[0],url=own?C.href(own):extra?g.S17Expansion.href(s.id,'bg'):'#/scene/'+s.id+(native?'?case='+encodeURIComponent(native.id)+'&tab=bg':'');
   return `<article class="sc-result"><div class="sc-result-meta"><span>${esc(s.stageName)}</span><span>${esc(s.id.toUpperCase())}</span></div><a href="${url}"><h4>${esc(s.name)}</h4><p>${esc(own?own.question:extra?extra.summary:s.problem||s.intro)}</p><span class="sc-result-link">进入案例 <span aria-hidden="true">→</span></span></a></article>`;
  }).join(''):'<div class="sc-empty"><h4>没有找到相符的案例</h4><p>可以缩短关键词，或清除筛选后再试。</p><button type="button" data-sc-reset>清除筛选</button></div>';
  const more=root.querySelector('#sc-more');more.hidden=limit>=candidates.length;more.textContent=`再显示 ${Math.min(pageSize,candidates.length-limit)} 个案例`;
  root.dataset.resultCount=candidates.length;root.dataset.visibleCount=Math.min(limit,candidates.length);
 }
 root.addEventListener('click',e=>{
  const stageButton=e.target.closest('[data-sc-stage]'),methodButton=e.target.closest('[data-sc-method]');
  if(stageButton){stage=stageButton.dataset.scStage;group=[];groupName='';limit=pageSize;draw();root.querySelector('.sc-tools').scrollIntoView({block:'start',behavior:'auto'});}
  else if(methodButton){method=methodButton.dataset.scMethod;limit=pageSize;draw();}
  else if(e.target.closest('[data-sc-reset]'))reset();
  else if(e.target.closest('#sc-more')){const previous=limit;limit+=pageSize;draw();const next=root.querySelectorAll('.sc-result a')[previous];next?.focus({preventScroll:true});next?.scrollIntoView({block:'nearest',behavior:'auto'});}
 });
 input.addEventListener('input',()=>{query=input.value.trim();limit=pageSize;draw();});
 refresh=draw;draw();
}
g.S17Catalog={markup,init,selectGroup,reset};
})(window);
