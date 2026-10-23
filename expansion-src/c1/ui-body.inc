  const E = g.C1Engine, colors = ['#367f79','#bc985c','#a76058'], defaults={noise:0.035,eccentric:0,micro:0,reject:0.6,thresholdShift:0};
  const name = y => y < 0 ? '待复核' : E.names[y];
  state.selected=16;
  function readParams() {return Object.fromEntries(Object.keys(defaults).map(k=>[k,Number($('#'+k).value)]));}
  function outputs() {for(const k of Object.keys(defaults))$('#'+k+'-out').value=Number($('#'+k).value).toFixed(k==='noise'?3:2);}
  Object.keys(defaults).forEach(k=>$('#'+k).oninput=()=>{outputs();stale();});
  function selectedId() {return state.result?state.result.data.observations[state.selected].sampleId:'未运行';}
  function selectedPrediction() {return state.result?name(state.result.predictions[state.selected].label):'未运行';}
  function reviewObservation(){const s=selected();return s?JSON.parse(JSON.stringify(s)):null;}
  function selected() {return state.result?{row:state.result.data.observations[state.selected],prediction:state.result.predictions[state.selected]}:null;}
  function choose() {state.selected=Number($('#well').value)*48+Number($('#depth').value);if(state.result)renderSelected();}
  $('#well').onchange=choose;$('#depth').oninput=choose;$('#show-truth').onchange=()=>state.result&&drawLogs();
  $('#logs').onclick=e=>{if(!state.result)return;const c=e.currentTarget, y=(e.clientY-c.getBoundingClientRect().top)/c.getBoundingClientRect().height*720;$('#depth').value=Math.max(0,Math.min(47,Math.round((y-78)/12)));choose();};
  function drawLogs() {
    const q=chart('logs',760,720),r=state.result,well=Number($('#well').value),start=well*48,truth=$('#show-truth').checked;
    label(q,14,27,'MD / m');label(q,170,27,'早到 RMS',undefined,'center');label(q,442,27,'VDL · 传播时间 →',undefined,'center');label(q,596,27,'模型',undefined,'center');label(q,642,27,'阈值',undefined,'center');if(truth)label(q,697,27,'参考',undefined,'center');
    [0,0.25,0.5,0.75].forEach(a=>label(q,105+a/0.75*155,54,a.toFixed(2),undefined,'center'));
    q.strokeStyle='#d7e0dd';q.beginPath();q.moveTo(92,65);q.lineTo(92,662);q.stroke();
    for(let i=0;i<48;i++){
      const row=r.data.observations[start+i],p=r.predictions[start+i],y=78+i*12;
      if(i%8===0){label(q,78,y,row.depth.toFixed(0),undefined,'right');q.strokeStyle='#dce5e1';q.beginPath();q.moveTo(94,y);q.lineTo(725,y);q.stroke();}
      row.waveform.forEach((a,t)=>{const v=Math.max(-1,Math.min(1,a)),c=Math.round(145+v*95);q.fillStyle=`rgb(${c-18},${c+6},${c+8})`;q.fillRect(325+t*2.9,y-6,3.1,12);});
      [p.label,p.baseline,truth?r.data.evaluationTruth[start+i]:null].forEach((c,j)=>{if(c===null)return;q.fillStyle=c<0?'#adb7b9':colors[c];q.fillRect(579+j*47,y-5.5,31,11);if(c<0){q.strokeStyle='#eff3f0';q.beginPath();q.moveTo(579+j*47,y+4);q.lineTo(605+j*47,y-4);q.stroke();}});
    }
    q.beginPath();for(let i=0;i<48;i++){const x=105+Math.min(.75,r.predictions[start+i].x[0])/.75*155,y=78+i*12;i?q.lineTo(x,y):q.moveTo(x,y);}q.strokeStyle='#276f73';q.lineWidth=2.6;q.stroke();
    const selectedY=78+(state.selected%48)*12;q.strokeStyle='#1b3d47';q.lineWidth=1.7;q.setLineDash([5,4]);q.beginPath();q.moveTo(93,selectedY);q.lineTo(725,selectedY);q.stroke();q.setLineDash([]);
    label(q,325,684,'0');label(q,557,684,'1200 μs',undefined,'right');label(q,103,706,'单幅度曲线',undefined);label(q,325,706,'完整声波按深度排列',undefined);label(q,580,706,'三类 / 复核',undefined);
  }
  function drawWave() {
    const {row}=selected(),q=chart('wave',440,235),x=t=>35+t/79*375,y=a=>112-a*69;
    q.fillStyle='#f0e5d1';q.fillRect(x(10),35,x(36)-x(10),155);q.fillStyle='#dbece5';q.fillRect(x(42),35,x(74)-x(42),155);
    label(q,75,19,'早到波窗');label(q,270,19,'后到波窗');q.strokeStyle='#b7c9c2';q.beginPath();q.moveTo(30,112);q.lineTo(415,112);q.stroke();
    q.strokeStyle='#276f73';q.lineWidth=2;q.beginPath();row.waveform.forEach((a,t)=>t?q.lineTo(x(t),y(a)):q.moveTo(x(t),y(a)));q.stroke();label(q,35,211,'0');label(q,407,211,'1200 μs →',undefined,'right');
  }
  function drawScatter() {
    const {prediction:p}=selected(),q=chart('scatter',440,280),toX=v=>45+v/.7*345,toY=v=>225-v/.6*180;
    q.strokeStyle='#afc2bf';q.beginPath();q.moveTo(45,25);q.lineTo(45,225);q.lineTo(415,225);q.stroke();
    state.result.model.bank.filter((_,i)=>i%3===0).forEach(d=>{q.globalAlpha=.45;q.fillStyle=colors[d.y];q.beginPath();q.arc(toX(d.x[0]),toY(d.x[1]),3,0,Math.PI*2);q.fill();});q.globalAlpha=1;
    p.neighbors.forEach(d=>{q.strokeStyle='#b4c5c2';q.beginPath();q.moveTo(toX(p.x[0]),toY(p.x[1]));q.lineTo(toX(d.x[0]),toY(d.x[1]));q.stroke();q.fillStyle=colors[d.y];q.beginPath();q.arc(toX(d.x[0]),toY(d.x[1]),5,0,Math.PI*2);q.fill();});
    q.strokeStyle='#183b44';q.lineWidth=3;q.beginPath();q.moveTo(toX(p.x[0])-7,toY(p.x[1])-7);q.lineTo(toX(p.x[0])+7,toY(p.x[1])+7);q.moveTo(toX(p.x[0])-7,toY(p.x[1])+7);q.lineTo(toX(p.x[0])+7,toY(p.x[1])-7);q.stroke();label(q,48,18,'后到 RMS ↑');label(q,405,255,'早到 RMS →',undefined,'right');
  }
  function renderSelected() {
    const {row,prediction:p}=selected();drawLogs();drawWave();drawScatter();
    $('#selected-info').innerHTML=`<b>${esc(row.sampleId)} · ${fmt(row.depth,1)} m MD</b><br>模型：<b>${name(p.label)}</b> · 投票支持度 ${pct(p.support)} · 平均邻距 ${fmt(p.distance)}<br>声幅阈值：${name(p.baseline)}${$('#show-truth').checked?' · 参考：'+name(state.result.data.evaluationTruth[state.selected]):''}`;
    $('#feature-table').innerHTML=`<table><tbody>${['早到 RMS','后到 RMS','后 / 早 RMS 比','后到差分 RMS'].map((n,j)=>`<tr><td>${n}</td><td class="num">${fmt(p.x[j],3)}</td></tr>`).join('')}</tbody></table>`;
    $('#neighbors').innerHTML=`<table><thead><tr><th>训练井</th><th>类别</th><th class="num">4维距离</th></tr></thead><tbody>${p.neighbors.slice(0,5).map(n=>`<tr><td>${n.wellId}</td><td>${name(n.y)}</td><td class="num">${fmt(n.distance,3)}</td></tr>`).join('')}</tbody></table><p class="small">展示最近5条；实际投票使用 ${p.neighbors.length} 条训练观测。</p>`;
  }
  function renderMetrics() {
    const m=state.result.metrics.model,b=state.result.metrics.baseline;
    $('#metrics').innerHTML=`<div class="metrics-grid">${metric('模型宏 F1',fmt(m.macroF1,3),'阈值基线 '+fmt(b.macroF1,3))}${metric('模型自动覆盖',pct(m.coverage),`${m.accepted} / ${m.total} 点；待复核 ${m.rejected} 点`)}${metric('接受集错误率',pct(m.acceptedError),`${m.accepted-m.correct} 错 / ${m.accepted} 接受点`)}${metric('基线错误率',pct(b.acceptedError),`${b.total-b.correct} 错 / ${b.total} 点`)}</div><div class="table-scroll"><table><thead><tr><th>独立参考类别</th><th class="num">模型召回</th><th class="num">基线召回</th><th class="num">参考点数</th></tr></thead><tbody>${E.names.map((n,i)=>`<tr><td>${n}</td><td class="num">${pct(m.recalls[i])}</td><td class="num">${pct(b.recalls[i])}</td><td class="num">${m.confusion[i].reduce((s,v)=>s+v,0)}</td></tr>`).join('')}</tbody></table></div><details style="margin-top:22px"><summary>查看模型混淆矩阵 · 行为参考，列为预测</summary><div class="table-scroll"><table><thead><tr><th>参考 / 预测</th>${['较好','过渡','弱胶结','待复核'].map(n=>`<th class="num">${n}</th>`).join('')}</tr></thead><tbody>${m.confusion.map((row,i)=>`<tr><td>${E.names[i]}</td>${row.map(v=>`<td class="num">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
    const model=state.result.model;$('#learning-summary').innerHTML=`验证选择 k = <b>${model.k}</b>（${model.validationScores.map(x=>'k'+x.k+': F1 '+fmt(x.score,3)).join('；')}）；声幅基线阈值 ${fmt(model.baseline.a,3)} / ${fmt(model.baseline.b,3)}。当前平移 ${fmt(readParams().thresholdShift,2)}。`;
  }
  async function calculate() {
    const params=readParams();status('running','正在提取声波特征、选择验证参数并计算近邻与指标…');$('#run').disabled=true;
    await new Promise(requestAnimationFrame);
    try {state.result=E.run(params);retireReviews('history');state.runId++;$('#results').classList.remove('stale-results');renderSelected();renderMetrics();if(JSON.stringify(params)!==JSON.stringify(readParams()))stale();else status('ready',`计算完成 · run ${state.runId} · 192 点 · 当前结果可复核与导出`);} catch(e) {status('error','计算未完成：'+e.message);}finally{$('#run').disabled=false;}
  }
  $('#run').onclick=calculate;
  function setValues(p){for(const k of Object.keys(defaults))$('#'+k).value=p[k]??defaults[k];outputs();stale();}
  $('#preset').onchange=()=>{const presets={default:defaults,micro:{...defaults,micro:1.2},eccentric:{...defaults,eccentric:1.8},noise:{...defaults,noise:.22},reject:{...defaults,reject:1}};setValues(presets[$('#preset').value]);};
  $('#reset').onclick=()=>{$('#preset').value='default';$('#well').value='0';$('#depth').value='16';$('#show-truth').checked=false;state.selected=16;setValues(defaults);$('#review-note').value='';};
  function exportEvidence(){
    const {row,prediction:p}=selected(),params=readParams(),sourceRecordId=row.sampleId+'-waveform',sourceVersion='c1-wave-v1:'+JSON.stringify({noise:params.noise,eccentric:params.eccentric,micro:params.micro});
    const sourceRef={sourceRecordId,sourceVersion,selector:{type:'whole_record_for_single_fact'}};
    const sources=[{sourceRecordId,sourceVersion,sourceType:'series_segment',content:{wellId:row.wellId,sampleId:row.sampleId,depthMD_m:row.depth,propagationTime_us:row.waveform.map((_,i)=>i/79*1200),amplitudeRelativeUnit:row.waveform},dataNature:'synthetic_teaching'}];
    const claims=[{claimId:row.sampleId+'-response',revision:state.runId,kind:'model_inference',statement:name(p.label),value:p.label,sourceRefs:[sourceRef],reviewStatus:p.label<0?'needs_review':'unreviewed',traceabilityStatus:'linked',supportStatus:'unchecked',depthScope:{from_m:row.depth,to_m:row.depth},method:{name:'four-feature weighted kNN',k:state.result.model.k,support:p.support,meanNeighborDistance:p.distance}}];
    state.reviews.forEach((r,i)=>{const id=CASE_ID+'-review-'+r.recordedAt+'-'+(i+1),immutable={...r};delete immutable.recordStatus;sources.push({sourceRecordId:id,sourceVersion:'1',sourceType:'review_note',content:immutable});claims.push({claimId:id+'-claim',revision:state.runId,kind:'reviewer_note',statement:r.opinion+'：'+r.note,sourceRefs:[{sourceRecordId:id,sourceVersion:'1',selector:{type:'whole_record_for_single_fact'}}],reviewStatus:r.recordStatus==='current'?'unreviewed':'needs_review',traceabilityStatus:r.recordStatus==='stale'?'stale':'linked',supportStatus:'unchecked'});});
    return {schemaVersion:'1.0',sceneId:SCENE_ID,caseId:CASE_ID,caseVersion:'1.0.0',runId:state.runId,datasetId:'c1-synthetic-wells-v1',wellId:row.wellId,dataNature:'synthetic_teaching',runConfig:{seed:17000,dataVersion:'c1-waves-v1',splitDescription:'18 training wells / 6 validation wells / 4 test wells; 48 depths each',method:'four-feature weighted kNN vs validated early-RMS thresholds',parameters:params,inputRevision:state.inputRevision},sources,claims,limitations:['默认观测为教学合成声波。','响应类别与现场完整性结论分别处理；投票支持度未作现场概率校准。'],references:LESSON.sources,splits:state.result.data.splits,training:{k:state.result.model.k,mu:state.result.model.mu,sd:state.result.model.sd,baseline:state.result.model.baseline,validationScores:state.result.model.validationScores},metrics:state.result.metrics,predictions:state.result.predictions.map(p=>({sampleId:p.sampleId,label:p.label,baseline:p.baseline,support:p.support,distance:p.distance,features:p.x})),selected:{observation:row,prediction:p},reviewHistory:state.reviews};
  }
  outputs();['logs','wave','scatter'].forEach((id,i)=>{const q=chart(id,[760,440,440][i],[720,235,280][i]);label(q,25,45,'运行计算后显示当前声学证据');});
})(globalThis);
