  const E=g.CO1Engine,dataset=E.dataset(),keys=['strength','sand','hetero','water','logK','temperature'];
  state.custom=false;state.queryX=dataset.observations[0].x.slice();
  $('#well').innerHTML=dataset.observations.map((d,i)=>`<option value="${i}">${d.wellId} · 留出井</option>`).join('')+'<option value="custom">自定义井 · 无参考真值</option>';
  function readParams(){return {budget:Number($('#budget').value),costWeight:Number($('#costWeight').value),queryId:state.custom?'CUSTOM':dataset.observations[Number($('#well').value)||0].wellId,queryX:state.queryX.slice()};}
  function outputs(){keys.forEach((k,j)=>$('#'+k+'-out').value=j===4?fmt(Math.pow(10,state.queryX[j]),0):fmt(state.queryX[j],j===5?0:2));$('#budget-out').value=$('#budget').value;$('#costWeight-out').value=fmt($('#costWeight').value,2);$('#query-note').textContent=state.custom?'当前为自定义井：仅显示条件、预测与排除依据；没有对应参考真值。下方评价固定使用32口留出井。':'当前选中固定留出井 '+readParams().queryId+'；滑块展示其条件。修改任一井况后将转为自定义井。';}
  function syncSliders(){keys.forEach((k,j)=>$('#'+k).value=state.queryX[j]);outputs();}
  keys.forEach((k,j)=>$('#'+k).oninput=()=>{state.custom=true;$('#well').value='custom';state.queryX[j]=Number($('#'+k).value);$('#preset').value='custom';outputs();stale();});
  ['budget','costWeight'].forEach(k=>$('#'+k).oninput=()=>{outputs();stale();});
  $('#well').onchange=()=>{if($('#well').value==='custom'){state.custom=true;}else{state.custom=false;state.queryX=dataset.observations[Number($('#well').value)].x.slice();}syncSliders();stale();};
  function selectedId(){return state.query?state.query.wellId:'未运行';}
  function selectedPrediction(){return state.query?(state.query.recommendation<0?'无可行方案':E.plans[state.query.recommendation].name):'未运行';}
  function reviewObservation(){return state.query?JSON.parse(JSON.stringify(state.query)):null;}
  function drawComparison(){
    const q=chart('comparison',760,335),p=state.query,xmin=Math.min(-20,Math.floor(Math.min(...p.candidates.map(c=>c.utility))/20)*20),xmax=Math.max(100,Math.ceil(Math.max(...p.candidates.map(c=>c.expectedResponse))/20)*20),x=v=>145+(v-xmin)/(xmax-xmin)*560;
    Array.from({length:7},(_,i)=>xmin+(xmax-xmin)*i/6).forEach(v=>{q.strokeStyle=v===0?'#9fb4af':'#dce5e0';q.beginPath();q.moveTo(x(v),38);q.lineTo(x(v),282);q.stroke();label(q,x(v),305,fmt(v,0),undefined,'center');});
    p.candidates.forEach((c,i)=>{const y=70+i*57;label(q,130,y,c.short,undefined,'right');q.globalAlpha=c.reasons.length?.45:1;q.fillStyle=c.color;q.fillRect(x(0),y-11,x(c.utility)-x(0),22);q.strokeStyle='#284c53';q.lineWidth=3;q.beginPath();q.moveTo(x(c.expectedResponse),y-18);q.lineTo(x(c.expectedResponse),y+18);q.stroke();q.globalAlpha=1;label(q,715,y,c.reasons.length?'╳':c.index===p.recommendation?'✓':'',c.reasons.length?'#a56a40':'#217f80');});
    label(q,150,18,'预测响应与效用 / 教学指数');
  }
  function drawNeighbors(){
    const q=chart('neighbors-plot',440,325),p=state.query,toX=v=>52+v*345,toY=v=>262-v*210;
    q.strokeStyle='#a9bfba';q.beginPath();q.moveTo(52,30);q.lineTo(52,262);q.lineTo(410,262);q.stroke();[0,.5,1].forEach(v=>{label(q,toX(v),283,v.toFixed(1),undefined,'center');label(q,40,toY(v),v.toFixed(1),undefined,'right');});
    dataset.train.forEach(d=>{q.fillStyle='#a8c0b9';q.beginPath();q.arc(toX(d.x[1]),toY(d.x[3]),3,0,Math.PI*2);q.fill();});
    p.neighbors.forEach(n=>{q.strokeStyle='#c6d4cd';q.beginPath();q.moveTo(toX(p.x[1]),toY(p.x[3]));q.lineTo(toX(n.x[1]),toY(n.x[3]));q.stroke();q.fillStyle='#bc8b50';q.beginPath();q.arc(toX(n.x[1]),toY(n.x[3]),5,0,Math.PI*2);q.fill();});
    const x=toX(p.x[1]),y=toY(p.x[3]);q.strokeStyle='#1b4a52';q.lineWidth=3;q.beginPath();q.moveTo(x-7,y-7);q.lineTo(x+7,y+7);q.moveTo(x-7,y+7);q.lineTo(x+7,y-7);q.stroke();label(q,55,16,'分层控水需求 ↑');label(q,408,310,'出砂风险 →',undefined,'right');
  }
  function renderQuery(){
    const p=state.query;drawComparison();drawNeighbors();
    $('#recommendation').innerHTML=p.recommendation<0?'<div class="notice"><b>当前条件没有可行候选。</b><br>逐条查看排除原因，补充条件或调整预算后重算。</div>':`<b>${esc(p.wellId)} · 当前排序第一：${E.plans[p.recommendation].name}</b><br>预测响应 ${fmt(p.candidates[p.recommendation].expectedResponse,1)}；费用罚项 ${fmt(readParams().costWeight*E.plans[p.recommendation].cost,1)}；效用 ${fmt(p.candidates[p.recommendation].utility,1)}${p.nearestDistance>2.5?'<br><span class="pill bad">最近邻距较大 · 建议补充相似井资料</span>':''}`;
    const ranked=p.candidates.filter(c=>!c.reasons.length).sort((a,b)=>b.utility-a.utility);$('#candidate-list').innerHTML=p.candidates.map(c=>`<div class="choice ${c.reasons.length?'excluded':c.index===p.recommendation?'winner':''}"><div class="choice-top"><h3>${c.name}</h3><span class="pill ${c.reasons.length?'bad':''}">${c.reasons.length?'条件不满足':'可行 · 第'+(ranked.findIndex(p=>p.index===c.index)+1)+'位'}</span></div><div class="small">费用 ${c.cost} · 温度额定 ${c.maxT} °C · 防砂 ${c.sand?'✓':'—'} · 分层隔离 ${c.isolation?'✓':'—'}</div><p>预测响应 <b>${fmt(c.expectedResponse,1)}</b> → 当前效用 <b>${fmt(c.utility,1)}</b></p>${c.reasons.length?'<ul>'+c.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>':'<div class="small">预算、井壁支撑、防砂、控水和温度条件均满足。</div>'}</div>`).join('');
    $('#neighbor-table').innerHTML=`<table><thead><tr><th>历史训练井</th><th class="num">6维距离</th><th class="num">权重</th></tr></thead><tbody>${p.neighbors.slice(0,6).map(n=>`<tr><td>${n.wellId}</td><td class="num">${fmt(n.distance,3)}</td><td class="num">${pct(n.weight)}</td></tr>`).join('')}</tbody></table><p class="small">展示最近6口；实际使用 ${p.neighbors.length} 口训练井。</p>`;
    const c=p.candidates[p.baselineRaw];$('#baseline-note').innerHTML=`<p>经验首选：<b>${c.name}</b><br>${p.baseline<0?'<span class="pill bad">经相同条件检查后排除</span><br>'+c.reasons.map(esc).join('；'):'<span class="pill">可行</span> · 效用 '+fmt(c.utility,1)}</p>`;
  }
  function renderMetrics(){
    const m=state.result.metrics,a=m.model,b=m.baseline;
    $('#metrics').innerHTML=`<div class="metrics-grid">${metric('四响应代理 MAE',fmt(m.surrogateMAE,2),'128 个留出方案响应')}${metric('模型推荐覆盖',pct(a.coverage),`${a.recommended} / ${m.total} 口井`)}${metric('模型排序一致率',pct(a.top1Agreement),`${a.matched} / ${a.recommended} 有推荐井`)}${metric('模型平均机会损失',fmt(a.regret,3),'在 '+a.recommended+' 口有推荐井上计算')}</div><div class="table-scroll"><table><thead><tr><th>同一留出井、同一可行域</th><th class="num">模型</th><th class="num">单条件经验</th><th>分母</th></tr></thead><tbody><tr><td>推荐覆盖率</td><td class="num">${pct(a.coverage)}</td><td class="num">${pct(b.coverage)}</td><td>${m.total} 口测试井</td></tr><tr><td>与参考最优候选一致</td><td class="num">${pct(a.top1Agreement)}</td><td class="num">${pct(b.top1Agreement)}</td><td>各自有推荐井：${a.recommended} / ${b.recommended}</td></tr><tr><td>平均机会损失 / 效用指数</td><td class="num">${fmt(a.regret,3)}</td><td class="num">${fmt(b.regret,3)}</td><td>各自有推荐井：${a.recommended} / ${b.recommended}</td></tr><tr><td>不满足约束的最终推荐</td><td class="num">${a.violations}</td><td class="num">${b.violations}</td><td>最终推荐数：${a.recommended} / ${b.recommended}</td></tr></tbody></table></div><p class="small">${m.feasibleWellCount} / ${m.total} 口井存在至少一个可行候选；其中经验首选被排除 ${b.excludedRaw} 口。机会损失 = 同一井参考可行最优效用 − 被选方案参考效用，只有评价模块读取参考响应。</p>`;
    const model=state.result.model;$('#learning-summary').innerHTML=`验证选择 k = <b>${model.k}</b>；验证响应 MAE：${model.validationScores.map(x=>'k'+x.k+' → '+fmt(x.mae,3)).join('；')}。每组按整井划分，不同方案不跨组。`;
  }
  async function calculate(){
    const params=readParams();status('running','正在学习历史井响应、应用公开约束并评价留出井…');$('#run').disabled=true;await new Promise(requestAnimationFrame);
    try{state.result=E.run(params);state.query=E.recommend({wellId:params.queryId,x:params.queryX},state.result.model,params);retireReviews('history');state.runId++;$('#results').classList.remove('stale-results');renderQuery();renderMetrics();if(JSON.stringify(params)!==JSON.stringify(readParams()))stale();else status('ready',`计算完成 · run ${state.runId} · ${state.query.wellId} · 32口留出井实际评价`);}catch(e){status('error','计算未完成：'+e.message);}finally{$('#run').disabled=false;}
  }
  $('#run').onclick=calculate;
  function setPreset(key){
    $('#budget').value=90;$('#costWeight').value=.22;
    if(key==='default'){state.custom=false;$('#well').value='0';state.queryX=dataset.observations[0].x.slice();}
    else {state.custom=true;$('#well').value='custom';state.queryX=key==='hot'?[.58,.85,.55,.35,2.6,192]:[.55,.9,.8,.9,2.4,120];if(key==='budget')$('#budget').value=30;}
    syncSliders();stale();
  }
  $('#preset').onchange=()=>setPreset($('#preset').value);$('#reset').onclick=()=>{$('#preset').value='default';setPreset('default');$('#review-note').value='';};
  function exportEvidence(){
    const p=state.query,params=readParams(),sourceRecordId=p.wellId+'-completion-conditions',sourceVersion='co1-input-v1:'+p.x.join(',')+':budget='+params.budget+':costWeight='+params.costWeight;
    const sources=[{sourceRecordId,sourceVersion,sourceType:'text_record',content:{wellId:p.wellId,conditions:{strengthIndex:p.x[0],sandRisk:p.x[1],heterogeneity:p.x[2],selectiveWaterControlNeed:p.x[3],permeability_mD:Math.pow(10,p.x[4]),temperature_C:p.x[5]},budget:params.budget,costPreference:params.costWeight,candidateDefinitions:E.plans},dataNature:'synthetic_teaching'}];
    const claims=[{claimId:p.wellId+'-completion-ranking',revision:state.runId,kind:'model_inference',statement:p.recommendation<0?'当前条件没有可行候选':'当前候选效用排序第一：'+E.plans[p.recommendation].name,sourceRefs:[{sourceRecordId,sourceVersion,selector:{type:'whole_record_for_single_fact'}}],reviewStatus:'needs_review',traceabilityStatus:'linked',supportStatus:'rule_checked',method:{name:'kNN multi-output response + explicit feasibility + utility ranking',k:state.result.model.k,candidates:p.candidates}}];
    state.reviews.forEach((r,i)=>{const id=CASE_ID+'-review-'+r.recordedAt+'-'+(i+1),immutable={...r};delete immutable.recordStatus;sources.push({sourceRecordId:id,sourceVersion:'1',sourceType:'review_note',content:immutable});claims.push({claimId:id+'-claim',revision:state.runId,kind:'reviewer_note',statement:r.opinion+'：'+r.note,sourceRefs:[{sourceRecordId:id,sourceVersion:'1',selector:{type:'whole_record_for_single_fact'}}],reviewStatus:r.recordStatus==='current'?'unreviewed':'needs_review',traceabilityStatus:r.recordStatus==='stale'?'stale':'linked',supportStatus:'unchecked'});});
    return {schemaVersion:'1.0',sceneId:SCENE_ID,caseId:CASE_ID,caseVersion:'1.0.2',runId:state.runId,datasetId:'co1-synthetic-history-v1',wellId:p.wellId,dataNature:'synthetic_teaching',runConfig:{seed:{training:17101,validation:27202,testing:37303},dataVersion:'co1-historical-responses-v1',splitDescription:'160 training / 40 validation / 32 test wells; 4 paired plan outcomes per well',method:'weighted kNN response regression + explicit constraints + utility ranking',parameters:params,inputRevision:state.inputRevision},sources,claims,limitations:['默认库为合成历史试验井，四方案响应配对生成。','费用、额定温度和综合表现使用本例公开的教学设定。','自定义井无参考真值，不进入留出井成绩。'],references:LESSON.sources,splits:state.result.data.splits,model:{k:state.result.model.k,mu:state.result.model.mu,sd:state.result.model.sd,validationScores:state.result.model.validationScores},candidateDefinitions:E.plans,query:p,queryHasReference:!state.custom,metrics:state.result.metrics,predictions:state.result.predictions,reviewHistory:state.reviews};
  }
  syncSliders();['comparison','neighbors-plot'].forEach((id,i)=>{const q=chart(id,[760,440][i],[335,325][i]);label(q,25,45,'运行计算后显示当前比较与依据');});
})(globalThis);
