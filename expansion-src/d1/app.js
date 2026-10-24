(function(g){
  'use strict';
  const E=g.D1Engine,$=id=>document.getElementById(id),fmt=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'不适用';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state={status:'initializing',result:null,runId:null,sequence:0,reviews:[],selected:0,session:Date.now().toString(36)};
  const fields=['wob','rpm','flow','ucs','noise','maxWob','maxRpm','maxFlow','maxPressure','maxTorque'];
  function params(){const p={preset:$('preset').value,constrain:$('constrain').checked};fields.forEach(k=>p[k]=Number($(k).value));return p;}
  function outputs(){for(const k of fields)if($(k+'-out'))$(k+'-out').textContent=$(k).value;}
  function text(x,y,s,size=16,more=''){return `<text x="${x}" y="${y}" font-size="${size}" ${more}>${esc(s)}</text>`;}
  function svg(title,body,w=800,h=450){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">${body}</svg>`;}
  function markStale(){outputs();if(!state.result)return;state.status='stale';$('status').className='status stale';$('status').textContent='参数已改变，当前图表保留上次结果。请运行预测与寻优。';$('export').disabled=true;$('review').disabled=true;$('adopt').disabled=true;$('results').classList.add('result-stale');reviewHistory();}
  function heatColor(v,a,b){const f=Math.max(0,Math.min(1,(v-a)/(b-a||1))),start=[222,239,225],end=[14,111,104];return '#'+start.map((s,j)=>Math.round(s+(end[j]-s)*f).toString(16).padStart(2,'0')).join('');}
  function surface(){
    const r=state.result,p=r.params,cells=r.grid.candidates.filter(c=>c.flow===p.flow),lo=Math.min(...cells.map(c=>c.estimate)),hi=Math.max(...cells.map(c=>c.estimate));
    const x=w=>90+(w-40)/10*46,y=rpm=>55+(200-rpm)/10*24,plane=cells.filter(c=>c.admitted).sort((a,b)=>b.estimate-a.estimate)[0];
    let b='<defs><pattern id="excluded" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M0 9L9 0M7 11L11 7" stroke="#17343f" stroke-width="1" opacity=".25"/></pattern></defs>';
    cells.forEach(c=>{const xx=x(c.wob),yy=y(c.rpm);b+=`<g data-wob="${c.wob}" data-rpm="${c.rpm}" role="button" tabindex="0" aria-label="钻压 ${c.wob} kN，转速 ${c.rpm}，预测 ${fmt(c.estimate)} m/h，${c.feasible?'满足约束':c.reasons.join('、')}"><rect x="${xx}" y="${yy}" width="44" height="22" rx="3" fill="${heatColor(c.estimate,lo,hi)}"/>${!c.feasible?`<rect x="${xx}" y="${yy}" width="44" height="22" fill="url(#excluded)"/>`:''}<title>${esc(c.reasons.join('、')||'满足约束')} · ${fmt(c.estimate)} m/h</title></g>`;});
    for(let w=40;w<=160;w+=20)b+=text(x(w)+22,440,w,16,'text-anchor="middle"');
    for(let rpm=60;rpm<=200;rpm+=20)b+=text(74,y(rpm)+17,rpm,16,'text-anchor="end"');
    b+=text(82,28,'RPM / r·min⁻¹',17)+text(335,480,'WOB / kN',18)+text(735,90,'ROP',17,'text-anchor="middle"');
    for(let i=0;i<8;i++){const v=lo+(hi-lo)*i/7;b+=`<rect x="710" y="${350-i*30}" width="29" height="30" fill="${heatColor(v,lo,hi)}"/>`;if(i%2===0||i===7)b+=text(746,372-i*30,fmt(v,0),15);}
    b+=text(717,402,'m/h',15);
    const cx=x(p.wob)+22,cy=y(p.rpm)+11;b+=`<path d="M${cx} ${cy-10}L${cx+10} ${cy}L${cx} ${cy+10}L${cx-10} ${cy}Z" stroke="white" stroke-width="2" fill="#17343f"/>`;
    if(plane)b+=`<circle cx="${x(plane.wob)+22}" cy="${y(plane.rpm)+11}" r="13" stroke="#f3ca7b" stroke-width="4" fill="none"/>`;
    $('surface').innerHTML=svg('钻压和转速响应面，阴影表示约束排除',b,800,495);
    $('grid-note').textContent=`当前流量切片 Q=${p.flow} L/s；全网格 ${r.grid.total} 点中 ${r.grid.feasibleCount} 点满足全部约束。${p.constrain?'仅可行点参与推荐。':'约束已关闭，违反项仍保留。'}${plane?` 当前切片最优预测 ${fmt(plane.estimate)} m/h。`:' 当前流量切片没有可行候选。'}`;
  }
  function margins(o,p){
    const rows=[['WOB',o.wob,p.maxWob,'kN'],['RPM',o.rpm,p.maxRpm,'r/min'],['流量',o.flow,p.maxFlow,'L/s'],['泵压',o.pressure,p.maxPressure,'MPa'],['扭矩',o.torque,p.maxTorque,'kN·m']];
    let b='';rows.forEach(([name,v,limit,unit],i)=>{const y=35+i*48,ratio=v/limit;b+=text(0,y,name,16)+`<rect x="70" y="${y-16}" width="175" height="16" rx="7" fill="#e6eee7"/><rect x="70" y="${y-16}" width="${Math.min(205,175*ratio)}" height="16" rx="7" fill="${ratio>1?'#cc654f':'#107d76'}"/><path d="M245 ${y-21}V${y+5}" stroke="#17343f" stroke-width="2"/>`+text(270,y,`${fmt(v,1)} / ${limit} ${unit}`,15);});
    $('margins').innerHTML=svg('推荐点参数使用量与上限',b,440,265);
  }
  function recommendation(){
    const r=state.result,o=r.recommendation;
    if(!o){$('recommendation').innerHTML='<div class="callout warn"><strong>当前没有可行候选</strong><p>放宽一项约束，再看可行域如何重新出现。</p></div>';$('margins').innerHTML='';$('adopt').disabled=true;return;}
    const gain=o.simulatedROP-r.fixed.simulatedROP;
    $('recommendation').innerHTML=`<div class="callout ${o.reasons.length?'warn':''}"><strong>${o.wob} kN · ${o.rpm} r/min · ${o.flow} L/s</strong><p>代理预测 <b>${fmt(o.estimate)} m/h</b>；固定推荐后，教学响应函数对照 <b>${fmt(o.simulatedROP)} m/h</b>。</p></div><div class="kv"><span>固定工况 90 / 120 / 26</span><strong>${fmt(r.fixed.simulatedROP)} m/h</strong></div><div class="kv"><span>相对固定工况的模拟变化</span><strong>${gain>=0?'+':''}${fmt(gain)} m/h</strong></div><div class="kv"><span>当前工况代理预测</span><strong>${fmt(r.current.estimate)} m/h</strong></div><p class="sub">候选按代理预测排序；“教学响应对照”在选点后计算。${o.outside.length?'该候选超出训练范围：'+o.outside.join('、')+'。':''}</p>${o.reasons.length?`<p class="tag bad">违反：${esc(o.reasons.join('、'))}</p>`:'<span class="tag">满足全部已声明约束</span>'}`;
    margins(o,r.params);$('adopt').disabled=false;
  }
  function scatter(){
    const r=state.result,truth=r.test.evaluationTruth.rop,max=Math.ceil(Math.max(...truth,...r.predictions.flatMap(p=>[p.model,p.baseline]))/10)*10,xx=v=>70+v/max*540,yy=v=>375-v/max*315;
    let b=`<path d="M70 45V375H620" fill="none" stroke="#9eb7ac" stroke-width="2"/><path d="M70 375L610 60" stroke="#81978f" stroke-width="2" stroke-dasharray="7 5"/>`;
    for(let v=0;v<=max;v+=20)b+=text(xx(v),403,v,16,'text-anchor="middle"')+text(55,yy(v)+5,v,16,'text-anchor="end"');
    r.predictions.forEach((p,i)=>{b+=`<circle cx="${xx(truth[i])}" cy="${yy(p.baseline)}" r="3.5" fill="#c7954d" opacity=".48"/><circle data-record="${i}" cx="${xx(truth[i])}" cy="${yy(p.model)}" r="${i===state.selected?7:4}" fill="#107d76" opacity=".76" stroke="${i===state.selected?'#17343f':'none'}"><title>测试记录 ${i+1} · 模型 ${fmt(p.model)} / 观测 ${fmt(truth[i])}</title></circle>`;});
    b+=text(66,25,'预测 ROP / m·h⁻¹',18)+text(290,441,'观测 ROP / m·h⁻¹',18)+text(430,26,'● 模型',16,'fill="#107d76"')+text(530,26,'● 基线',16,'fill="#c7954d"');
    $('prediction-chart').innerHTML=svg('两方法在相同测试记录上的预测与观测散点',b,700,460);
  }
  function residuals(){
    const r=state.result,t=r.test.evaluationTruth.rop,rows=r.predictions.map((p,i)=>({i,e:p.model-t[i],b:p.baseline-t[i]})).sort((a,b)=>Math.abs(b.e)-Math.abs(a.e)).slice(0,8),max=Math.max(4,...rows.flatMap(v=>[Math.abs(v.e),Math.abs(v.b)])),xx=v=>385+v/max*205;
    let b=`<path d="M385 30V330" stroke="#8fa79b" stroke-width="2"/>`;
    rows.forEach((row,j)=>{const y=57+j*34,o=r.test.observations[row.i];b+=text(0,y+5,`${row.i+1} · ${o.depth.toFixed(1)} m`,16)+`<path data-record="${row.i}" d="M385 ${y}H${xx(row.e)}" stroke="#107d76" stroke-width="13"/><circle cx="${xx(row.b)}" cy="${y}" r="5" fill="#c7954d"/>`+text(625,y+5,fmt(row.e),15);});
    b+=text(180,354,`−${fmt(max,1)}`,15)+text(382,354,'0',15)+text(560,354,`+${fmt(max,1)}`,15)+text(170,387,'预测 − 观测 / m·h⁻¹；绿条模型，橙点基线',17);
    $('residuals').innerHTML=svg('模型最大误差记录及基线误差对照',b,700,400);
  }
  function point(){
    const r=state.result,i=state.selected,o=r.test.observations[i],p=r.predictions[i];
    $('test-row').value=String(i);
    $('point-detail').innerHTML=`<p><b>${esc(o.wellId)} · ${fmt(o.depth,1)} m MD</b></p><div class="feature-badges"><span>WOB ${fmt(o.wob,1)} kN</span><span>RPM ${fmt(o.rpm,1)} r/min</span><span>Q ${fmt(o.flow,1)} L/s</span><span>UCS ${fmt(o.ucs,1)} MPa</span></div><div class="kv"><span>教学观测 ROP</span><strong>${fmt(r.test.evaluationTruth.rop[i])} m/h</strong></div><div class="kv"><span>多变量代理 / 单 WOB 基线</span><strong>${fmt(p.model)} / ${fmt(p.baseline)}</strong></div>${p.outside.length?`<p class="tag warn">训练范围之外：${esc(p.outside.join('、'))}</p>`:'<p class="sub">该点的四项输入均位于训练范围内。</p>'}`;
  }
  function learning(){
    const r=state.result,tr=r.trained,coef=tr.model.coef.slice(1).map((v,j)=>({v,name:E.featureNames[j]})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
    $('learning').innerHTML=`<div class="kv"><span>训练 / 验证 / 测试</span><strong>8 / 3 / 2 口井</strong></div><div class="kv"><span>记录数</span><strong>512 / 192 / 128</strong></div><div class="kv"><span>选定 λ</span><strong>${tr.model.lambda}</strong></div><table><thead><tr><th>验证候选 λ</th><th>实际 RMSE / m/h</th></tr></thead><tbody>${tr.trials.map(v=>`<tr><td>${v.lambda}${v.lambda===tr.model.lambda?' ✓':''}</td><td>${fmt(v.rmse,3)}</td></tr>`).join('')}</tbody></table><p class="sub">标准化系数绝对值最大的 4 项：${coef.slice(0,4).map(c=>`${esc(c.name)} ${c.v>=0?'+':''}${fmt(c.v)}`).join('；')}。这些是拟合参数，表达统计关系。</p><p class="minor">${esc(r.dataVersion)} · 所有划分使用独立整井 ID。</p>`;
  }
  function reviewHistory(){
    $('review-history').innerHTML=state.reviews.length?state.reviews.slice().reverse().map(v=>`<div class="review-record"><b>${esc(v.choice)}</b><p>${esc(v.note)}</p><span class="minor">${esc(v.runId)} · ${v.runId===state.runId&&state.status==='ready'?'当前计算':'历史计算，当前参数未沿用'}</span></div>`).join(''):'<p class="sub">保存的依据会绑定当次参数与运行编号。</p>';
  }
  function render(){
    const r=state.result,m=r.metrics;
    const metric=(label,value,unit,note)=>`<div class="metric"><span>${label}</span><strong>${value} <small style="display:inline">${unit}</small></strong><small>${note}</small></div>`;
    $('metrics').innerHTML=metric('多变量模型 RMSE',fmt(m.model.rmse),'m/h',`MAE ${fmt(m.model.mae)} m/h`)+metric('单 WOB 基线 RMSE',fmt(m.baseline.rmse),'m/h',`MAE ${fmt(m.baseline.mae)} m/h`)+metric('满足约束',String(r.grid.feasibleCount),`/ ${r.grid.total}`,'逐点真实计算，不隐去越界')+metric('测试记录',String(m.model.n),'点',`${m.outsideCount} 点输入超出训练范围`);
    $('test-row').innerHTML=r.test.observations.map((o,i)=>`<option value="${i}">${i+1} · ${esc(o.wellId)} · ${o.depth.toFixed(1)} m</option>`).join('');
    surface();recommendation();scatter();residuals();point();learning();reviewHistory();
  }
  function run(){
    $('run').disabled=true;$('status').className='status';$('status').textContent='正在拟合、验证并搜索参数…';
    try{const p=params(),result=E.run(p);state.result=result;state.runId='d1-'+state.session+'-'+String(++state.sequence).padStart(4,'0');state.status='ready';$('results').classList.remove('result-stale');render();$('status').textContent=`计算完成 · ${state.runId} · 同两口测试井比较，候选由代理预测排序。`;$('export').disabled=false;$('review').disabled=false;}
    catch(err){state.status='error';$('status').className='status error';$('status').textContent='输入需要调整：'+err.message;$('export').disabled=true;$('review').disabled=true;}
    finally{$('run').disabled=false;}
  }
  function reset(){const defaults={wob:90,rpm:120,flow:26,ucs:60,noise:2,maxWob:125,maxRpm:170,maxFlow:32,maxPressure:19.5,maxTorque:9};fields.forEach(k=>$(k).value=defaults[k]);$('preset').value='default';$('constrain').checked=true;markStale();}
  function preset(){reset();const choice=$('preset').dataset.next;if(choice)$('preset').value=choice;if(choice==='noise')$('noise').value=7;if(choice==='tight'){$('maxPressure').value=15;$('maxTorque').value=6;}if(choice==='domain'){$('ucs').value=105;$('wob').value=140;$('rpm').value=180;}markStale();}
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{const tab=b.dataset.tab;for(const id of ['background','workflow','lab'])$(id).hidden=id!==tab;document.querySelectorAll('nav [data-tab]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.tab===tab)));}));
  document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-step]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));document.querySelectorAll('[data-step-panel]').forEach(n=>n.hidden=n.dataset.stepPanel!==b.dataset.step);}));
  fields.forEach(k=>$(k).addEventListener('input',markStale));$('constrain').addEventListener('change',markStale);
  $('preset').addEventListener('change',()=>{$('preset').dataset.next=$('preset').value;preset();delete $('preset').dataset.next;});
  $('run').addEventListener('click',run);$('reset').addEventListener('click',reset);
  function choosePoint(e){const c=e.target.closest('[data-wob]');if(!c||state.status!=='ready')return;$('wob').value=c.dataset.wob;$('rpm').value=c.dataset.rpm;markStale();}
  $('surface').addEventListener('click',choosePoint);$('surface').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choosePoint(e);}});
  $('adopt').addEventListener('click',()=>{const p=state.result?.recommendation;if(state.status!=='ready'||!p)return;for(const k of ['wob','rpm','flow'])$(k).value=p[k];markStale();});
  $('test-row').addEventListener('change',()=>{state.selected=Number($('test-row').value);point();scatter();});
  ['prediction-chart','residuals'].forEach(id=>$(id).addEventListener('click',e=>{const n=e.target.closest('[data-record]');if(n){state.selected=Number(n.dataset.record);point();scatter();}}));
  $('review').addEventListener('click',()=>{if(state.status!=='ready')return;const note=$('review-note').value.trim();if(!note){$('review-note').focus();return;}state.reviews.push({runId:state.runId,choice:$('review-choice').value,note,params:{...state.result.params},recommendation:state.result.recommendation});$('review-note').value='';reviewHistory();});
  function evidence(){
    const r=state.result,version=r.dataVersion+'-'+state.runId,obsId=E.ID+'-test-observations',predId=E.ID+'-test-predictions',metricId=E.ID+'-rmse',planId=E.ID+'-candidate';
    const source=(sourceRecordId,sourceType,content)=>({sourceRecordId,sourceVersion:version,sourceType,content});
    const ref=sourceRecordId=>({sourceRecordId,sourceVersion:version,selector:{type:'whole_record_for_single_fact'}});
    const claim=(id,statement,sourceId,value,unit)=>({claimId:E.ID+'-'+id,revision:state.sequence,kind:'model_inference',statement,value,unit,sourceRefs:[ref(sourceId)],reviewStatus:'needs_review',traceabilityStatus:'linked',supportStatus:'unchecked'});
    const optimization={total:r.grid.total,feasible:r.grid.feasibleCount,admitted:r.grid.admittedCount,recommendation:r.recommendation,fixed:r.fixed,current:r.current,selectionUses:'surrogate_estimate_only',simulatedROP:'teaching_response_evaluated_after_selection'};
    return {schemaVersion:'1.0',caseVersion:'1.0.2',sceneId:E.SCENE,caseId:E.ID,runId:state.runId,status:'ready',datasetId:r.dataVersion,wellId:r.test.groups[0],wellIds:r.test.groups,dataNature:'synthetic_teaching',runConfig:{seed:{train:101,validation:5001,test:12001},dataVersion:r.dataVersion,splitDescription:'8/3/2 whole wells; 512/192/128 records',method:'training-standardized polynomial ridge + constrained grid search',parameters:r.params,inputRevision:state.sequence},params:r.params,metrics:r.metrics,groups:{...r.trained.groups,test:r.test.groups},training:{counts:r.trained.counts,lambda:r.trained.model.lambda,scaler:r.trained.model.scaler,coef:r.trained.model.coef,validation:r.trained.trials,baseline:r.trained.baseline},optimization,observations:r.test.observations,predictions:r.predictions,evaluationTruth:r.test.evaluationTruth,sources:[source(obsId,'series_segment',{kind:'observation',unitMap:{depth:'m MD',wob:'kN',rpm:'r/min',flow:'L/s',ucs:'MPa',rop:'m/h'},observations:r.test.observations}),source(predId,'series_segment',{kind:'model_output',method:'polynomial_ridge',predictions:r.predictions}),source(metricId,'text_record',{kind:'evaluation',value:r.metrics.model.rmse,unit:'m/h',n:r.metrics.model.n,predictions:r.predictions.map(p=>p.model),evaluationTruth:r.test.evaluationTruth.rop}),source(planId,'text_record',{kind:'model_output',parameters:r.params,...optimization})],claims:[claim('test-rmse',`两口教学测试井的模型 RMSE 为 ${fmt(r.metrics.model.rmse,3)} m/h，共 ${r.metrics.model.n} 点。`,metricId,r.metrics.model.rmse,'m/h'),claim('candidate',r.recommendation?`代理推荐 ${r.recommendation.wob} kN、${r.recommendation.rpm} r/min、${r.recommendation.flow} L/s，代理预测 ${fmt(r.recommendation.estimate)} m/h。`:'当前约束下没有可行候选。',planId,r.recommendation?.estimate??null,'m/h')],reviews:state.reviews,limitations:['固定种子教学合成数据，预测评估范围为两口留出井。','泵压和扭矩为显式教学代理；候选只在声明网格内搜索。','支持来源关联与数值计算，人工复核意见独立保存。']};
  }
  $('export').addEventListener('click',()=>{if(state.status!=='ready')return;const url=URL.createObjectURL(new Blob([JSON.stringify(evidence(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=E.ID+'-'+state.runId+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  g.CaseInspect={snapshot:()=>JSON.parse(JSON.stringify({sceneId:E.SCENE,caseId:E.ID,status:state.status,metrics:state.status==='ready'?state.result.metrics:null,runId:state.runId,params:params(),optimization:state.status==='ready'?{total:state.result.grid.total,feasible:state.result.grid.feasibleCount,recommended:state.result.recommendation}:null,reviews:state.reviews.length})),evidence:()=>state.status==='ready'?evidence():null};
  outputs();run();
})(globalThis);
