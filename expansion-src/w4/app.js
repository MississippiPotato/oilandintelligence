(function(g){
  'use strict';
  const E=g.W4Engine,$=id=>document.getElementById(id),colors=['#c7954d','#8f9ca6','#648bb0'],fmt=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'不适用',pct=v=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'不适用';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const name=c=>c<0?'待复核':E.labels[c],color=c=>c<0?'#e4d5c2':colors[c];
  const state={status:'initializing',result:null,sequence:0,runId:null,reviews:[],cursor:80,well:null,session:Date.now().toString(36)};
  function params(){return{preset:$('preset').value,noise:Number($('noise').value),support:Number($('support').value),mode:$('mode').value,k:$('k').value,reject:$('reject').checked};}
  function outputs(){$('noise-out').textContent=$('noise').value;$('support-out').textContent=$('support').value;}
  function text(x,y,s,size=16,more=''){return `<text x="${x}" y="${y}" font-size="${size}" ${more}>${esc(s)}</text>`;}
  function svg(title,b,w,h){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">${b}</svg>`;}
  function markStale(){outputs();if(!state.result)return;state.status='stale';$('status').className='status stale';$('status').textContent='输入已改变，图表保留上次计算。运行识别后更新预测、评价和复核位置。';$('export').disabled=true;$('review').disabled=true;$('results').classList.add('result-stale');reviewHistory();}
  function wellIndices(){return state.result.test.observations.flatMap((o,i)=>o.wellId===state.well?[i]:[]);}
  function selectedIndex(){const ids=wellIndices();return ids[Math.min(state.cursor,ids.length-1)];}
  function logs(){
    const r=state.result,ids=wellIndices(),obs=ids.map(i=>r.test.observations[i]),height=480,top=92,n=ids.length,dy=height/n,y=i=>top+(i+.5)*dy;
    const tracks=[{label:'GR',unit:'API',x:100,w:125,min:0,max:180,key:'gr',c:'#b2873e'},{label:'Rt',unit:'Ω·m · log',x:250,w:125,min:-.2,max:3.5,key:'rt',c:'#107d76',log:true},{label:'RHOB',unit:'g·cm⁻³',x:400,w:125,min:1.85,max:2.85,key:'rhob',c:'#648bb0'},{label:'NPHI',unit:'v/v',x:550,w:125,min:-.1,max:.6,key:'nphi',c:'#c05e49'}];
    let b='<defs><pattern id="review-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#a58c72" stroke-width="1"/></pattern></defs>';
    tracks.forEach(tr=>{
      b+=`<rect x="${tr.x}" y="${top}" width="${tr.w}" height="${height}" fill="#fbfcf8" stroke="#c5d7cb"/>`+text(tr.x+tr.w/2,29,tr.label,19,'text-anchor="middle"')+text(tr.x+tr.w/2,54,tr.unit,15,'text-anchor="middle"');
      const endpoint=v=>tr.log?fmt(10**v,1):fmt(v,tr.key==='rhob'?2:tr.key==='nphi'?1:0);
      b+=text(tr.x,79,endpoint(tr.min),14)+text(tr.x+tr.w,79,endpoint(tr.max),14,'text-anchor="end"');
      for(let q=1;q<4;q++)b+=`<path d="M${tr.x+tr.w*q/4} ${top}V${top+height}" stroke="#e3ece5"/>`;
      const xx=o=>tr.x+Math.max(0,Math.min(1,((tr.log?Math.log10(o[tr.key]):o[tr.key])-tr.min)/(tr.max-tr.min)))*tr.w;
      b+=`<path d="${obs.map((o,j)=>(j?'L':'M')+xx(o)+','+y(j)).join('')}" fill="none" stroke="${tr.c}" stroke-width="2.1"/>`;
    });
    const stripeDefs=[{x:710,label:'GR',value:i=>r.predictions[i].baseline},{x:754,label:'模型',value:i=>r.predictions[i].label},{x:798,label:'人工',value:i=>{const o=r.test.observations[i],review=state.reviews.filter(v=>v.runId===state.runId&&v.wellId===o.wellId&&v.depth===o.depth).at(-1);return review?.label??null;}},{x:842,label:'真值',value:i=>$('show-truth').checked?r.test.evaluationTruth.labels[i]:null}];
    stripeDefs.forEach(s=>{b+=text(s.x+15,36,s.label,16,'text-anchor="middle"');ids.forEach((id,j)=>{const v=s.value(id);b+=`<rect x="${s.x}" y="${top+j*dy}" width="30" height="${dy+.2}" fill="${v===null?'#f3f5ef':color(v)}"/>${v===-1?`<rect x="${s.x}" y="${top+j*dy}" width="30" height="${dy+.2}" fill="url(#review-hatch)"/>`:''}`;});b+=`<rect x="${s.x}" y="${top}" width="30" height="${height}" fill="none" stroke="#c5d7cb"/>`;});
    for(let d=1500;d<=1580;d+=10){const yy=top+(d-1500)/80*height;b+=`<path d="M85 ${yy}H878" stroke="#d5e2d9" stroke-dasharray="3 5"/>`+text(76,yy+5,d,16,'text-anchor="end"');}
    const yy=y(state.cursor);b+=`<path d="M85 ${yy}H878" stroke="#17343f" stroke-width="2"/><circle cx="92" cy="${yy}" r="5" fill="#17343f"/>`+text(3,28,'MD / m ↓',16);
    b+='<rect x="85" y="92" width="793" height="480" fill="transparent" data-log-cursor="true" role="presentation"/>';
    $('logs').innerHTML=svg('深度向下的四道测井曲线和分开的岩性解释色柱',b,920,598);
    const o=r.test.observations[selectedIndex()];$('depth-out').textContent=o.depth.toFixed(1);$('depth').value=o.depth;
  }
  function crossplot(){
    const r=state.result,o=r.test.observations[selectedIndex()],x=v=>75+Math.max(0,Math.min(1,v/200))*490,y=v=>335-Math.max(0,Math.min(1,(v-1.85)/1))*270;
    let b=`<path d="M75 48V335H595" fill="none" stroke="#9eb7a9" stroke-width="2"/>`;
    for(let v=0;v<=200;v+=50)b+=text(x(v),363,v,16,'text-anchor="middle"')+`<path d="M${x(v)} 55V335" stroke="#e3ebe4"/>`;
    for(let v=2;v<=2.8;v+=.2)b+=text(62,y(v)+5,v.toFixed(1),16,'text-anchor="end"')+`<path d="M75 ${y(v)}H580" stroke="#e3ebe4"/>`;
    r.trained.model.samples.filter((_,i)=>i%3===0).forEach(s=>{b+=`<circle cx="${x(s.raw[0])}" cy="${y(s.raw[2])}" r="3.5" fill="${colors[s.label]}" opacity=".55"/>`;});
    b+=`<circle cx="${x(o.gr)}" cy="${y(o.rhob)}" r="10" fill="white" stroke="#17343f" stroke-width="3"/><path d="M${x(o.gr)-6} ${y(o.rhob)}H${x(o.gr)+6}M${x(o.gr)} ${y(o.rhob)-6}V${y(o.rhob)+6}" stroke="#17343f" stroke-width="2"/>`+text(70,27,'RHOB / g·cm⁻³',18)+text(260,402,'GR / API',18);
    $('crossplot').innerHTML=svg('训练井 GR 与密度交会图及当前测试点位置',b,650,420);
    $('feature-badges').innerHTML=r.trained.model.channels.map(i=>`<span>模型输入：${esc(E.names[i])}</span>`).join('');
  }
  function point(){
    const r=state.result,i=selectedIndex(),o=r.test.observations[i],p=r.predictions[i];
    $('point-detail').innerHTML=`<p><b>${esc(o.wellId)} · ${fmt(o.depth,1)} m MD</b></p><div class="feature-badges"><span>GR ${fmt(o.gr,1)} API</span><span>Rt ${fmt(o.rt)} Ω·m</span><span>RHOB ${fmt(o.rhob)} g·cm⁻³</span><span>NPHI ${fmt(o.nphi,3)} v/v</span></div><div class="callout ${p.label<0?'warn':''}"><strong>${name(p.label)}</strong><p>原始提议 ${name(p.proposed)} · ${Math.round(p.support*r.trained.k)} / ${r.trained.k} 票支持（${pct(p.support)}）${p.reasons.length?'；'+esc(p.reasons.join('、')):''}</p></div><div class="kv"><span>单 GR 规则</span><strong>${name(p.baseline)}</strong></div><div class="kv"><span>最近距离 / 验证阈值</span><strong>${fmt(p.nearestDistance,3)} / ${fmt(r.trained.model.distanceLimit,3)}</strong></div>${$('show-truth').checked?`<div class="kv"><span>独立教学真值</span><strong>${name(r.test.evaluationTruth.labels[i])}</strong></div>`:''}`;
    $('neighbors').innerHTML=`<h3>真实训练近邻</h3><p class="sub">显示最近 ${Math.min(6,p.neighbors.length)} 个，共 k=${r.trained.k} 个参与投票。</p><div class="table-scroll"><table><thead><tr><th>训练井 / 深度</th><th>标签</th><th>距离</th></tr></thead><tbody>${p.neighbors.slice(0,6).map(n=>`<tr><td>${esc(n.wellId)}<br>${fmt(n.depth,1)} m</td><td><i class="swatch" style="background:${colors[n.label]}"></i>${name(n.label)}</td><td>${fmt(n.distance,3)}</td></tr>`).join('')}</tbody></table></div>`;
    $('review-location').textContent=`${o.wellId} · ${o.depth.toFixed(1)} m MD · ${state.runId}。人工标签独立保存，模型原结果与测试成绩保持可追溯。`;
  }
  function matrix(title,m){
    const max=Math.max(1,...m.confusion.flat());
    return `<h3>${title} · 宏 F1 ${fmt(m.macroF1,3)}</h3><div class="table-scroll"><table class="matrix"><thead><tr><th>真值 ↓ / 预测 →</th><th>砂岩</th><th>泥岩</th><th>灰岩</th><th>复核</th></tr></thead><tbody>${m.confusion.map((row,i)=>`<tr><th>${E.labels[i]}</th>${row.map(v=>`<td style="background:rgba(16,125,118,${.04+.5*v/max});color:#17343f">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="sub">各类召回：${m.perClass.map(v=>`${v.name} ${pct(v.recall)}`).join('；')}。覆盖 ${m.accepted}/${m.n}；接受集错误率 ${pct(m.acceptedError)}。</p>`;
  }
  function learning(){
    const r=state.result,tr=r.trained;
    $('learning').innerHTML=`<div class="kv"><span>整井训练 / 验证 / 测试</span><strong>6 / 2 / 2 口</strong></div><div class="kv"><span>记录数</span><strong>720 / 240 / 320</strong></div><div class="kv"><span>本次 k</span><strong>${tr.k}${r.params.k==='auto'?' · 验证选择':' · 用户探索'}</strong></div><div class="kv"><span>GR 双阈值 / API</span><strong>${tr.rules.sand} / ${tr.rules.shale}</strong></div><p class="sub">GR ≥ ${tr.rules.shale} 判泥岩；${tr.rules.sand} ≤ GR &lt; ${tr.rules.shale} 判砂岩；更低判灰岩。多道 kNN 使用训练井尺度下的邻居投票。</p><table><thead><tr><th>候选 k</th><th>验证宏 F1</th></tr></thead><tbody>${tr.trials.map(v=>`<tr><td>${v.k}${v.k===tr.k?' ✓':''}</td><td>${fmt(v.macroF1,3)}</td></tr>`).join('')}</tbody></table><p class="minor">${esc(r.dataVersion)} · 通道改变时重新拟合训练尺度与近邻库。</p>`;
  }
  function reviewHistory(){
    $('review-history').innerHTML=state.reviews.length?state.reviews.slice().reverse().map(v=>`<div class="review-record"><b>${esc(v.wellId)} · ${fmt(v.depth,1)} m · ${name(v.label)}</b><p>${esc(v.note)}</p><span class="minor">${esc(v.runId)} · ${v.runId===state.runId&&state.status==='ready'?'当前参数下的复核':'历史复核，当前计算未沿用'}</span></div>`).join(''):'<p class="sub">先点选深度，写下曲线依据，再保存人工意见。色柱中“人工”一列只显示当前计算的复核。</p>';
  }
  function cursor(){logs();crossplot();point();}
  function render(){
    const r=state.result,m=r.metrics,metric=(label,v,note)=>`<div class="metric"><span>${label}</span><strong>${v}</strong><small>${note}</small></div>`;
    $('metrics').innerHTML=metric('多道 kNN 宏 F1',fmt(m.model.macroF1,3),`准确率 ${pct(m.model.accuracy)}`)+metric('单 GR 规则宏 F1',fmt(m.baseline.macroF1,3),`准确率 ${pct(m.baseline.accuracy)}`)+metric('自动接受覆盖率',pct(m.model.coverage),`${m.model.accepted} / ${m.model.n} 点；其余进入复核`)+metric('全部测试点',String(m.model.n),'2 口井 · 0.5 m 采样');
    const wells=r.test.groups;if(!wells.includes(state.well))state.well=wells[0];$('well').innerHTML=wells.map(id=>`<option>${esc(id)}</option>`).join('');$('well').value=state.well;
    cursor();$('confusion').innerHTML=matrix('多道 kNN',m.model)+matrix('单 GR 规则',m.baseline);learning();reviewHistory();
  }
  function run(){
    $('run').disabled=true;$('status').className='status';$('status').textContent='正在标准化、验证 k 并识别测试井…';
    try{state.result=E.run(params());state.runId='w4-'+state.session+'-'+String(++state.sequence).padStart(4,'0');state.status='ready';$('results').classList.remove('result-stale');render();$('status').textContent=`计算完成 · ${state.runId} · 两口测试井共 320 点，复核点保留在评价分母。`;$('review').disabled=false;$('export').disabled=false;}
    catch(err){state.status='error';$('status').className='status error';$('status').textContent='输入需要调整：'+err.message;$('review').disabled=true;$('export').disabled=true;}
    finally{$('run').disabled=false;}
  }
  function reset(){for(const [k,v]of Object.entries({preset:'default',mode:'all',k:'auto',noise:1,support:.6}))$(k).value=v;$('reject').checked=true;markStale();}
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{const tab=b.dataset.tab;for(const id of ['background','workflow','lab'])$(id).hidden=id!==tab;document.querySelectorAll('nav [data-tab]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.tab===tab)));}));
  document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-step]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));document.querySelectorAll('[data-step-panel]').forEach(n=>n.hidden=n.dataset.stepPanel!==b.dataset.step);}));
  for(const k of ['noise','support'])$(k).addEventListener('input',markStale);for(const k of ['mode','k','reject'])$(k).addEventListener('change',markStale);
  $('preset').addEventListener('change',()=>{const v=$('preset').value;reset();$('preset').value=v;if(v==='noise')$('noise').value=2.6;markStale();});
  $('run').addEventListener('click',run);$('reset').addEventListener('click',reset);
  $('well').addEventListener('change',()=>{state.well=$('well').value;cursor();});
  $('depth').addEventListener('input',()=>{state.cursor=Math.round((Number($('depth').value)-1500)/.5);cursor();});
  $('show-truth').addEventListener('change',()=>{logs();point();});
  $('logs').addEventListener('click',e=>{const el=e.target.closest('svg');if(!el||state.status!=='ready')return;const point=el.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const p=point.matrixTransform(el.getScreenCTM().inverse());state.cursor=Math.max(0,Math.min(159,Math.floor((p.y-92)/480*160)));cursor();});
  $('review').addEventListener('click',()=>{if(state.status!=='ready')return;const note=$('review-note').value.trim();if(!note){$('review-note').focus();return;}const o=state.result.test.observations[selectedIndex()];state.reviews.push({runId:state.runId,wellId:o.wellId,depth:o.depth,label:Number($('review-label').value),note,params:{...state.result.params}});$('review-note').value='';reviewHistory();logs();});
  function evidence(){
    const r=state.result,i=selectedIndex(),o=r.test.observations[i],p=r.predictions[i],version=r.dataVersion+'-'+state.runId,obsId=E.ID+'-observations',predId=E.ID+'-predictions',metricId=E.ID+'-macro-f1',pointId=E.ID+'-selected-'+o.wellId+'-'+o.depth.toFixed(1);
    const source=(sourceRecordId,sourceType,content)=>({sourceRecordId,sourceVersion:version,sourceType,content}),ref=sourceRecordId=>({sourceRecordId,sourceVersion:version,selector:{type:'whole_record_for_single_fact'}});
    return {schemaVersion:'1.0',caseVersion:'1.0.2',sceneId:E.SCENE,caseId:E.ID,runId:state.runId,status:'ready',datasetId:r.dataVersion,wellId:state.well,wellIds:r.test.groups,dataNature:'synthetic_teaching',runConfig:{seed:{train:417,validation:8417,test:18417},dataVersion:r.dataVersion,splitDescription:'6/2/2 whole wells; 720/240/320 samples',method:'training-standardized kNN; validation-selected GR baseline',parameters:r.params,inputRevision:state.sequence},params:r.params,metrics:r.metrics,groups:{...r.trained.groups,test:r.test.groups},training:{channels:r.trained.model.channels,scaler:r.trained.model.scaler,k:r.trained.k,distanceLimit:r.trained.model.distanceLimit,baselineRules:r.trained.rules,validation:r.trained.trials},observations:r.test.observations,predictions:r.predictions,evaluationTruth:r.test.evaluationTruth,sources:[source(obsId,'series_segment',{kind:'observation',unitMap:{depth:'m MD',gr:'API',rt:'ohm m',rhob:'g cm-3',nphi:'v/v'},observations:r.test.observations}),source(predId,'series_segment',{kind:'model_output',method:'kNN',predictions:r.predictions}),source(metricId,'text_record',{kind:'evaluation',metric:'macro_f1',value:r.metrics.model.macroF1,n:r.metrics.model.n,confusion:r.metrics.model.confusion,evaluationTruth:r.test.evaluationTruth.labels,predictedLabels:r.predictions.map(p=>p.label)}),source(pointId,'series_segment',{kind:'model_output',observation:o,prediction:p,depthRangeMD_m:[o.depth,o.depth],method:'kNN',k:r.trained.k,trainingChannels:r.trained.model.channels})],claims:[{claimId:E.ID+'-test-macro-f1',revision:state.sequence,kind:'model_inference',statement:`两口教学测试井共 ${r.metrics.model.n} 点，模型宏 F1 为 ${fmt(r.metrics.model.macroF1,3)}。`,value:r.metrics.model.macroF1,unit:'fraction',sourceRefs:[ref(metricId)],reviewStatus:'unreviewed',traceabilityStatus:'linked',supportStatus:'unchecked'},{claimId:pointId+'-claim',revision:state.sequence,kind:'model_inference',statement:`${o.wellId} 的 ${fmt(o.depth,1)} m MD，模型输出 ${name(p.label)}，原始提议 ${name(p.proposed)}，近邻支持 ${pct(p.support)}。`,depthScope:{wellId:o.wellId,depthRangeMD_m:[o.depth,o.depth]},sourceRefs:[{sourceRecordId:pointId,sourceVersion:version,selector:{type:'depth_range',wellId:o.wellId,depthRangeMD_m:[o.depth,o.depth]}}],reviewStatus:'needs_review',traceabilityStatus:'linked',supportStatus:'unchecked'}],reviews:state.reviews,limitations:['固定种子教学合成层序，评价分母包含全部 320 点和拒判点。','近邻支持度为票数占比，测试扰动不参与训练和验证选择。','模型、单 GR 基线和人工意见独立保存。']};
  }
  $('export').addEventListener('click',()=>{if(state.status!=='ready')return;const url=URL.createObjectURL(new Blob([JSON.stringify(evidence(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=E.ID+'-'+state.runId+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  g.CaseInspect={snapshot:()=>JSON.parse(JSON.stringify({sceneId:E.SCENE,caseId:E.ID,status:state.status,metrics:state.status==='ready'?state.result.metrics:null,runId:state.runId,params:params(),selected:state.result?{wellId:state.well,depth:1500+state.cursor*.5}:null,reviews:state.reviews.length})),evidence:()=>state.status==='ready'?evidence():null};
  outputs();run();
})(globalThis);
