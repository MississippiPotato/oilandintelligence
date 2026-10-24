window.S17Page={"sceneId":"d1","caseId":"s17x-d1-rop-optimization","name":"钻速预测与参数优化","title":"钻速预测与参数优化：从响应面到可行候选","summary":"从多口教学井学习钻速响应，比较单钻压经验基线，再在钻压、转速、流量、泵压与扭矩边界内搜索参数。你可以收紧约束、放大噪声，或进入更硬地层的迁移情景。","directory":"expansion-cases","caseVersion":"1.0.2","portalHref":"../../../../portal/index.html","referenceHref":"../../../../portal/reference/fluorescence.html"};
(function (g) {
  'use strict';
  const SCENE = 'd1', ID = 's17x-d1-rop-optimization';
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gaussian(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r()); }
  function features(o) {
    const w = o.wob / 100, r = o.rpm / 120, q = o.flow / 26, h = o.ucs / 60;
    return [w, r, q, h, w*w, r*r, q*q, w*r, w*h, q*h];
  }
  const featureNames = ['钻压 WOB', '转速 RPM', '流量 Q', '岩石强度 UCS', 'WOB²', 'RPM²', 'Q²', 'WOB × RPM', 'WOB × UCS', 'Q × UCS'];
  function response(o, offset = 0, wear = 0) {
    const [w,r,q,h] = features(o);
    return Math.max(2, 10 + 28*w + 24*r + 12*q - 10*w*w - 8*r*r - 6*q*q + 9*w*r - 12*h - 6*w*h + 5*q*h + offset - wear);
  }
  function dataset(split, options = {}) {
    const config = {train:[8,64,101], validation:[3,64,5001], test:[2,64,12001]}[split];
    if (!config) throw new Error('未知数据集合');
    const observations = [], rop = [], groups = [];
    for (let w = 0; w < config[0]; w++) {
      const r = rng(config[2] + w*997), wellId = 'ROP-' + split.toUpperCase() + '-' + (w+1), offset = gaussian(r)*.8;
      groups.push(wellId);
      for (let i=0;i<config[1];i++) {
        const domain = split === 'test' && options.preset === 'domain';
        const o = {wellId, depth:1800+i*.5, wob:40+r()*100, rpm:60+r()*120, flow:18+r()*16, ucs:35+r()*50};
        if (domain) { o.wob += 28; o.rpm += 25; o.ucs += 28; }
        observations.push(o);
        const noise = split === 'test' ? Number(options.noise ?? 2) : 1.8;
        rop.push(Math.max(1, response(o, offset, domain ? 15 : 0) + gaussian(r)*noise));
      }
    }
    return {observations, evaluationTruth:{rop}, groups, split};
  }
  function fitScale(xs) {
    const mu=xs[0].map((_,j)=>mean(xs.map(x=>x[j]))), sd=mu.map((m,j)=>Math.sqrt(mean(xs.map(x=>(x[j]-m)**2))) || 1);
    return {mean:mu, sd};
  }
  function scale(x,s) { return x.map((v,j)=>(v-s.mean[j])/s.sd[j]); }
  function solve(a,b) {
    const m=a.map((r,i)=>r.concat(b[i])), n=b.length;
    for(let c=0;c<n;c++) {
      let p=c; for(let r=c+1;r<n;r++) if(Math.abs(m[r][c])>Math.abs(m[p][c])) p=r;
      [m[c],m[p]]=[m[p],m[c]];
      if(Math.abs(m[c][c])<1e-10) throw new Error('回归矩阵不可解');
      const d=m[c][c]; for(let j=c;j<=n;j++)m[c][j]/=d;
      for(let r=0;r<n;r++)if(r!==c){const f=m[r][c];for(let j=c;j<=n;j++)m[r][j]-=f*m[c][j];}
    }
    return m.map(r=>r[n]);
  }
  function fitRidge(xs, ys, lambda, scaler) {
    const rows=xs.map(x=>[1,...scale(x,scaler)]), n=rows[0].length, a=Array.from({length:n},()=>Array(n).fill(0)), b=Array(n).fill(0);
    rows.forEach((x,i)=>{for(let j=0;j<n;j++){b[j]+=x[j]*ys[i];for(let k=0;k<n;k++)a[j][k]+=x[j]*x[k];}});
    for(let j=1;j<n;j++)a[j][j]+=lambda;
    return {coef:solve(a,b),scaler,lambda};
  }
  function predictRidge(m, x) { return m.coef[0]+scale(x,m.scaler).reduce((s,v,j)=>s+v*m.coef[j+1],0); }
  function regression(pred, truth) {
    if(pred.length!==truth.length)throw new Error('预测与真值长度不同');
    if(!pred.length)return {n:0,mae:null,rmse:null,bias:null};
    const errors=pred.map((p,i)=>p-truth[i]);
    return {n:pred.length,mae:mean(errors.map(Math.abs)),rmse:Math.sqrt(mean(errors.map(v=>v*v))),bias:mean(errors)};
  }
  function train() {
    const tr=dataset('train'), va=dataset('validation'), xs=tr.observations.map(features), scaler=fitScale(xs), trials=[];
    let model=null, best=Infinity;
    for(const lambda of [.01,.1,1,10]) {
      const candidate=fitRidge(xs,tr.evaluationTruth.rop,lambda,scaler);
      const score=regression(va.observations.map(o=>predictRidge(candidate,features(o))),va.evaluationTruth.rop);
      trials.push({lambda,rmse:score.rmse});
      if(score.rmse<best){best=score.rmse;model=candidate;}
    }
    const mx=mean(tr.observations.map(o=>o.wob)),my=mean(tr.evaluationTruth.rop);
    const slope=tr.observations.reduce((s,o,i)=>s+(o.wob-mx)*(tr.evaluationTruth.rop[i]-my),0)/tr.observations.reduce((s,o)=>s+(o.wob-mx)**2,0);
    const ranges={}; for(const k of ['wob','rpm','flow','ucs'])ranges[k]=[Math.min(...tr.observations.map(o=>o[k])),Math.max(...tr.observations.map(o=>o[k]))];
    return {model,baseline:{intercept:my-slope*mx,slope},trials,validationRMSE:best,ranges,groups:{train:tr.groups,validation:va.groups},counts:{train:tr.observations.length,validation:va.observations.length}};
  }
  function domainReasons(trained,o) {return Object.keys(trained.ranges).filter(k=>o[k]<trained.ranges[k][0]||o[k]>trained.ranges[k][1]);}
  function infer(trained, observations) {
    return observations.map(o=>({wellId:o.wellId,depth:o.depth,model:predictRidge(trained.model,features(o)),baseline:trained.baseline.intercept+trained.baseline.slope*o.wob,outside:domainReasons(trained,o)}));
  }
  function mechanical(o) {return {pressure:3+.016*o.flow**2+.000015*o.wob*o.rpm,torque:.035*o.wob*(o.ucs/60)+.00018*o.wob*o.rpm};}
  function constraintReasons(o,p) {
    const m=mechanical(o), reasons=[];
    if(o.wob>p.maxWob)reasons.push('钻压上限'); if(o.rpm>p.maxRpm)reasons.push('转速上限'); if(o.flow>p.maxFlow)reasons.push('流量上限');
    if(m.pressure>p.maxPressure)reasons.push('泵压上限'); if(m.torque>p.maxTorque)reasons.push('扭矩上限');
    return reasons;
  }
  function search(trained,p) {
    const candidates=[];
    for(let wob=40;wob<=160;wob+=10)for(let rpm=60;rpm<=200;rpm+=10)for(let flow=18;flow<=38;flow+=2){
      const o={wob,rpm,flow,ucs:p.ucs},reasons=constraintReasons(o,p),estimate=predictRidge(trained.model,features(o));
      candidates.push({...o,estimate,reasons,feasible:!reasons.length,admitted:!p.constrain||!reasons.length,outside:domainReasons(trained,o),...mechanical(o)});
    }
    const admitted=candidates.filter(c=>c.admitted).sort((a,b)=>b.estimate-a.estimate);
    return {candidates,recommended:admitted[0]||null,feasibleCount:candidates.filter(c=>c.feasible).length,admittedCount:admitted.length,total:candidates.length};
  }
  function evaluate(predictions,evaluationTruth) {
    return {model:regression(predictions.map(p=>p.model),evaluationTruth.rop),baseline:regression(predictions.map(p=>p.baseline),evaluationTruth.rop),outsideCount:predictions.filter(p=>p.outside.length).length};
  }
  function validate(p) {
    const bounds={wob:[40,160],rpm:[60,200],flow:[18,38],ucs:[35,115],noise:[0,10],maxWob:[40,160],maxRpm:[60,200],maxFlow:[18,38],maxPressure:[8,30],maxTorque:[4,20]};
    for(const [k,[a,b]] of Object.entries(bounds))if(!Number.isFinite(p[k])||p[k]<a||p[k]>b)throw new Error(k+' 超出输入范围 '+a+'–'+b);
  }
  function run(p) {
    validate(p); const trained=train(),test=dataset('test',p), predictions=infer(trained,test.observations), metrics=evaluate(predictions,test.evaluationTruth), grid=search(trained,p);
    const current={wob:p.wob,rpm:p.rpm,flow:p.flow,ucs:p.ucs},fixed={wob:90,rpm:120,flow:26,ucs:p.ucs},wear=p.preset==='domain'?15:0;
    const summarize=o=>({...o,...mechanical(o),reasons:constraintReasons(o,p),outside:domainReasons(trained,o),estimate:predictRidge(trained.model,features(o)),simulatedROP:response(o,0,wear)});
    const recommendation=grid.recommended?summarize(grid.recommended):null;
    return {sceneId:SCENE,caseId:ID,trained,test,predictions,metrics,grid,current:summarize(current),fixed:summarize(fixed),recommendation,params:{...p},dataVersion:'ROP-SYNTH-2026-10-24-v1',featureNames};
  }
  g.D1Engine={SCENE,ID,features,featureNames,response,dataset,fitScale,fitRidge,predictRidge,regression,train,infer,evaluate,mechanical,constraintReasons,search,run};
})(globalThis);

;
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

(function(){function startFlow(){var area=document.getElementById("workflow");if(area&&!area.querySelector(".case-flow-overview"))area.insertAdjacentHTML("afterbegin","<figure class=\"case-flow-overview case-flow-compact study-workflow-overview\" data-flow-scene=\"d1\" style=\"margin:18px 0 24px;padding:12px 14px;background:#fafbf9;border:1px solid #e0e6e0;border-radius:8px;min-width:0;max-width:100%;box-sizing:border-box\"><style>.case-flow-compact h3{font-size:19px!important;line-height:1.6!important;color:#355a50;margin:0 0 5px!important}.case-flow-compact .case-flow-scroll{overflow-x:auto;max-width:1000px;margin:0 auto;overscroll-behavior-x:contain}.case-flow-compact svg{display:block;width:100%;min-width:940px;height:auto;font-family:system-ui,Microsoft YaHei,sans-serif}.case-flow-compact .case-flow-title{font-size:19px;font-weight:600;fill:#355a50}.case-flow-compact .case-flow-detail{font-size:14px;fill:#6b8078}.case-flow-compact .case-flow-edge{font-size:13px;fill:#70877d;paint-order:stroke;stroke:#fafbf9;stroke-width:4px}.case-flow-compact .case-flow-node rect,.case-flow-compact .case-flow-node polygon{stroke:#b7c8bc;stroke-width:1}.case-flow-compact .case-flow-node[role=button]{cursor:pointer;outline:none}.case-flow-compact .case-flow-node[aria-current=true] rect,.case-flow-compact .case-flow-node[aria-current=true] polygon,.case-flow-compact .case-flow-node:focus rect,.case-flow-compact .case-flow-node:focus polygon{stroke:#347a65;stroke-width:2}.case-flow-compact svg text{pointer-events:none}.case-flow-compact figcaption{font-size:14px!important;line-height:1.7!important;color:#75877b;margin:4px 0 0!important}</style><h3>本例方法概览</h3><div class=\"case-flow-scroll\" tabindex=\"0\" aria-label=\"流程概览，可横向滚动\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1100 250\" role=\"group\" aria-label=\"钻速预测与可行工况\"><defs><marker id=\"cf-d1\" markerWidth=\"7\" markerHeight=\"6\" refX=\"6\" refY=\"3\" orient=\"auto\"><path d=\"M0 0L6 3L0 6Z\" fill=\"#78958b\"/></marker></defs>\n <path d=\"M210 65H230\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><path d=\"M420 65H440\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><path d=\"M630 65H670\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><path d=\"M800 65H880\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><text x=\"840\" y=\"53\" text-anchor=\"middle\" class=\"case-flow-edge\">可继续</text><path d=\"M735 110V140\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><text x=\"775\" y=\"130\" text-anchor=\"middle\" class=\"case-flow-edge\">需核查</text><path d=\"M325 95V170H440\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><text x=\"380\" y=\"159\" text-anchor=\"middle\" class=\"case-flow-edge\">同一观测</text><path d=\"M860 170H870V120H975V95\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\" stroke-dasharray=\"5 4\" marker-end=\"url(#cf-d1)\"/><text x=\"927\" y=\"132\" text-anchor=\"middle\" class=\"case-flow-edge\">确认后</text><path d=\"M975 95V140\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><path d=\"M535 195V222H975V195\" fill=\"none\" stroke=\"#78958b\" stroke-width=\"1.8\"  marker-end=\"url(#cf-d1)\"/><text x=\"750\" y=\"239\" text-anchor=\"middle\" class=\"case-flow-edge\">同条件对照</text>\n <g class=\"case-flow-node\" data-flow-step=\"0\" data-flow-node=\"input\" transform=\"translate(20 30)\"><rect width=\"190\" height=\"65\" rx=\"9\" fill=\"#eef2ed\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">整井工况与钻速</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">观测输入</text></g><g class=\"case-flow-node\" data-flow-step=\"1\" data-flow-node=\"prepare\" transform=\"translate(230 30)\"><rect width=\"190\" height=\"65\" rx=\"9\" fill=\"#eff3f5\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">训练尺度与特征</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">整理与处理</text></g><g class=\"case-flow-node\" data-flow-step=\"2\" data-flow-node=\"model\" transform=\"translate(440 30)\"><rect width=\"190\" height=\"65\" rx=\"9\" fill=\"#e4f0e7\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">多项式岭回归</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">智能方法</text></g><g class=\"case-flow-node\" data-flow-step=\"2\" data-flow-node=\"baseline\" transform=\"translate(440 140)\"><rect width=\"190\" height=\"55\" rx=\"9\" fill=\"#f4efe4\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">单钻压线性回归</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">对照路线</text></g>\n <g class=\"case-flow-node\" data-flow-node=\"gate\" data-flow-step=\"4\"><polygon points=\"735,20 800,65 735,110 670,65\" fill=\"#fbf0d9\"/><text x=\"735\" y=\"71\" text-anchor=\"middle\" class=\"case-flow-title\">泵压扭矩是否越界？候选是否超训练范围？</text></g>\n <g class=\"case-flow-node\" data-flow-step=\"4\" data-flow-node=\"review\" transform=\"translate(670 140)\"><rect width=\"190\" height=\"55\" rx=\"9\" fill=\"#f6eade\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">核对越界与代理偏差</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">人工核查</text></g><g class=\"case-flow-node\" data-flow-step=\"4\" data-flow-node=\"output\" transform=\"translate(880 30)\"><rect width=\"190\" height=\"65\" rx=\"9\" fill=\"#e4f0e7\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">候选工况与复核依据</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">候选与来源</text></g><g class=\"case-flow-node\" data-flow-step=\"4\" data-flow-node=\"compare\" transform=\"translate(880 140)\"><rect width=\"190\" height=\"55\" rx=\"9\" fill=\"#eff3f5\"/><text x=\"95\" y=\"26\" text-anchor=\"middle\" class=\"case-flow-title\">留出误差与可行域</text><text x=\"95\" y=\"47\" text-anchor=\"middle\" class=\"case-flow-detail\">独立参考 · 同分母</text></g>\n </svg></div><figcaption>详细原理、数据图表与计算见下方各步骤。<span data-flow-instruction></span></figcaption></figure>");S17Flow.mount(area||document);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startFlow,{once:true});else startFlow();})();


/* S17_OPTIONAL_ASSISTANT_START: isolated from case inference and evaluation */
(function(){function startAssistant(){
(function(g){'use strict';
// Shared local guide and optional model client; never persists credentials.
if(g.S17Assistant)return;
const pageInfo=g.S17Page??{},standalone=!!pageInfo.sceneId,framed=g!==g.parent;
const catalog=[
{id:'m1',caseId:'s17-cuttings-lithology',name:'岩屑岩性',terms:['岩屑','岩性','颗粒'],intro:'观察一盘岩屑的外观，点击颗粒看近邻，切换照明、泥浆附着和计数/面积。默认是教学合成图；真实岩芯对照另行标明。'},
{id:'m2',caseId:'s17-mudgas-context',name:'气测异常',terms:['气测','气峰','迟到','停泵'],intro:'看地面气峰怎样结合累计泵量和工况解释。可以改体积、停泵或上下文，比较候选解释。气峰不直接代表油气层。'},
{id:'m3',caseId:'s17-fluorescence-review',name:'荧光判读',terms:['荧光','紫外','uv','曝光'],intro:'对比同一样品的白光/UV教学图，改变曝光并查看显示区域。荧光存在与油气来源是两个判断；矿物也会发光。'},
{id:'m4',caseId:'s17-drilltime-boundaries',name:'钻时分段',terms:['钻时','钻速','分层','分段','工况'],intro:'对比工况变化与响应变化，观察平滑怎样吞掉薄层。曲线上标记的是候选响应界面；公开钻进数据没有地层真值精度。'},
{id:'m5',caseId:'s17-evidence-report',name:'证据报告',terms:['报告','证据','导出','否定'],intro:'查看短记录怎样变成有来源的报告。点击句子回到证据，改写后重新复核，也能下载工作区、报告HTML和证据JSON。'}];
for(const c of g.S17Expansion?.cases??[])catalog.push({id:c.sceneId,caseId:c.id,name:c.name,terms:[c.name,c.stageName,c.sceneId],intro:c.summary,directory:'expansion-cases'});
if(standalone&&!catalog.some(c=>c.id===pageInfo.sceneId))catalog.push({id:pageInfo.sceneId,caseId:pageInfo.caseId,name:pageInfo.name??pageInfo.title??document.title,terms:[pageInfo.sceneId,pageInfo.name??''],intro:pageInfo.summary??'这里可以依次查看专业背景、逐步流程与交互演示。',directory:pageInfo.directory??'cases'});
const root=document.createElement('aside');root.id='s17-assistant';root.dataset.speaking='false';
const icons={chat:'<path d="M5 5h14v10H9l-4 4V5Z"/><path d="M9 9h6M9 12h4"/>',plus:'<path d="M12 5v14M5 12h14"/>',expand:'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',send:'<path d="M12 19V5m-6 6 6-6 6 6"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 4H6a2 2 0 0 0-2 2v9"/>',stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>'};
Object.assign(icons,{attach:'<path d="m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',book:'<path d="M4 5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v14h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4V5Z"/><path d="M12 6v14"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>'});
const icon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
const avatar='<div class="s17-agent-avatar" aria-hidden="true"><svg viewBox="0 0 100 100"><rect x="7" y="7" width="86" height="86" rx="28" fill="#eaf3f2"/><path d="M31 25h38v38H48L31 78V25Z" fill="none" stroke="#247d76" stroke-width="5" stroke-linejoin="round"/><path d="M41 39h18M41 49h12" stroke="#247d76" stroke-width="5" stroke-linecap="round"/></svg></div>';
root.dataset.view='chat';root.dataset.empty='true';root.dataset.surface=standalone?'standalone':'portal';
root.innerHTML=`<button id="s17-agent-launcher" aria-label="打开井见助手" aria-expanded="false" aria-controls="s17-agent-panel">${avatar}<span><strong>井见助手</strong><small id="s17-agent-badge">聊聊你正在看的案例</small></span></button>
<section id="s17-agent-panel" class="s17-agent-panel" role="dialog" aria-modal="false" aria-label="井见智能助手" aria-labelledby="s17-agent-title" hidden>
<header class="s17-agent-head"><div class="s17-agent-identity"><span class="s17-agent-mark">${icon('chat')}</span><div><h2 id="s17-agent-title">井见 <span>助手</span></h2><p id="s17-agent-mode">本地导览</p></div></div><div class="s17-agent-head-actions"><button id="s17-agent-new" type="button" title="新对话" aria-label="新对话">${icon('plus')}</button><button id="s17-agent-expand" type="button" title="展开对话面板" aria-label="展开对话面板" aria-pressed="false">${icon('expand')}</button><button id="s17-agent-settings" type="button" title="模型与语音设置" aria-label="模型与语音设置" aria-pressed="false">${icon('settings')}</button><button id="s17-agent-close" type="button" title="收起助手" aria-label="收起助手">${icon('close')}</button></div></header>
<div id="s17-agent-context" class="s17-agent-context"></div><div id="s17-agent-log" class="s17-agent-log" role="log" aria-label="对话记录" aria-live="polite" aria-relevant="additions"></div>
<div id="s17-agent-pending" class="s17-agent-pending" role="status" hidden><span class="s17-thinking-dot"></span><span>正在思考</span><button id="s17-agent-cancel" type="button">${icon('stop')}停止生成</button></div>
<form id="s17-agent-form" class="s17-agent-form"><div class="s17-agent-composer"><textarea id="s17-agent-input" rows="3" maxlength="4000" aria-label="向井见提问" placeholder="给井见发送消息"></textarea><div class="s17-agent-form-bottom"><div class="s17-agent-quick"><button type="button" data-ag-query="解释当前页">${icon('book')}读懂本页</button><button type="button" data-ag-query="从哪里开始">${icon('compass')}案例导航</button></div><div class="s17-composer-tools"><div id="s17-agent-attachments"><button id="s17-agent-attach" type="button" aria-label="添加图片或音频" title="添加图片或音频" aria-expanded="false" aria-controls="s17-agent-attachment-menu">${icon('attach')}</button><div id="s17-agent-attachment-menu" role="menu" hidden></div></div><span id="s17-agent-microphone"></span><button id="s17-agent-send" type="submit" aria-label="发送消息" title="发送消息">${icon('send')}</button></div></div></div><p class="s17-agent-input-hint">Enter 发送 · Shift + Enter 换行</p></form>
<details class="s17-agent-options"><summary>返回对话</summary><div class="s17-agent-settings-intro"><h3>模型与语音</h3><p>设置你自己的模型连接。</p></div><p id="s17-agent-model-status">本地导览已就绪。</p><div class="s17-speech-controls"><button type="button" id="s17-agent-read">朗读上一条</button><button type="button" id="s17-agent-stop">停止朗读</button></div><p class="s17-agent-data-note">对话与 Key 只在当前页面内存中使用。朗读使用浏览器或系统语音。</p></details><div id="s17-agent-toast" class="s17-agent-toast" role="status" hidden></div></section>`;
document.body.append(root);const $=id=>document.getElementById(id),log=$('s17-agent-log');let adapter=null,busy=false,controller=null,lastReply='',requestCount=0,successfulCalls=0,ownerIsParent=false;const history=[];
const caseById=id=>catalog.find(c=>c.id===id);
function pageContext(){const q=new URLSearchParams(location.hash.split('?')[1]??''),parts=location.hash.replace(/^#\/?/,'').split('?')[0].split('/'),scene=g.ATLAS?.index?.byScene?.[parts[1]],current=standalone?caseById(pageInfo.sceneId):null,section=standalone?(document.querySelector('nav[aria-label="案例内容"] [aria-pressed="true"]')?.dataset.tab??location.hash.slice(1)):q.get('tab');return{hash:location.hash||'#/',title:document.querySelector('#view main h1,body>main h1')?.textContent??document.title,sceneId:current?.id??(parts[0]==='scene'?parts[1]:null),tab:({background:'bg',workflow:'flow',lab:'demo'}[section]??section)||'bg',sceneName:current?.name??scene?.name??null,surface:standalone?'standalone':'portal'};}
function updateContext(){const c=pageContext(),section={bg:'专业背景',flow:'案例流程',demo:'可运行示范'}[c.tab];$('s17-agent-context').textContent='正在看 · '+(c.sceneName?c.sceneName+' / '+section:c.title);}
function portalURL(hash){if(standalone&&framed)return new URL('../portal/index.html'+hash,document.baseURI).href;return standalone||pageInfo.portalHref?(pageInfo.portalHref??'../../../../portal/index.html')+hash:hash;}
function destination(action){
if(!action||typeof action!=='object')throw Error('导航参数无效');
const inTeacherFrame=standalone&&framed&&location.href==='about:srcdoc';
if(action.target==='fluorescence_reference')return{label:'真实白光 / UV 对照',href:inTeacherFrame?new URL('../portal/reference/fluorescence.html',document.baseURI).href:pageInfo.referenceHref??'reference/fluorescence.html',newTab:true};
if(action.target==='home')return{label:'网站首页',href:portalURL('#/'),newTab:standalone&&framed};
if(action.target==='chain')return{label:'13阶段作业链',href:portalURL('#/chain'),newTab:standalone&&framed};
if(action.target==='mudlogging')return{label:'录井五个场景',href:portalURL('#/stage/mudlogging'),newTab:standalone&&framed};
const c=caseById(action.target);
if(c){const tab=['bg','flow','demo'].includes(action.tab)?action.tab:'demo',localTab={bg:'background',flow:'workflow',demo:'lab'}[tab],saved=!!g.Cases?.get(c.caseId),directory=c.directory??'cases';
if(standalone&&c.id===pageInfo.sceneId)return{label:{bg:'专业背景',flow:'案例流程',demo:'可运行示范'}[tab]+' · '+c.name,href:'#'+localTab,localTab};
const path=directory+'/'+c.caseId+'/demo/index.html#'+localTab,href=saved?'#/scene/'+c.id+'?case='+c.caseId+'&tab='+tab:inTeacherFrame?new URL('../dist/'+path,document.baseURI).href:(standalone?'../../../':pageInfo.distHref??'../dist/')+path;
return{label:c.name+' · '+({bg:'专业背景',flow:'案例流程',demo:'交互演示'}[tab]),href,newTab:!saved,caseId:c.caseId,sceneId:c.id};}
throw Error('只支持本站已声明的导航目标');}
function welcome(){root.dataset.empty='true';log.replaceChildren();const node=document.createElement('div');node.className='s17-agent-welcome';node.innerHTML='<span class="s17-welcome-mark">'+icon('chat')+'</span><h3>今天想了解哪一步？</h3>';log.append(node);}
function syncComposer(){const input=$('s17-agent-input'),hasFiles=!!g.S17Media?.snapshot().files.length;$('s17-agent-send').disabled=busy||(!input.value.trim()&&!hasFiles);}
function attachmentMenu(value){$('s17-agent-attachment-menu').hidden=!value;$('s17-agent-attach').setAttribute('aria-expanded',String(value));}
function richText(container,text){for(const line of String(text).split('\n')){if(!line.trim()){container.append(document.createElement('br'));continue;}const p=document.createElement('p');if(/^\s*[-*]\s+/.test(line))p.className='s17-chat-bullet';const clean=line.replace(/^\s*[-*]\s+/,'');for(const token of clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)){const el=token.startsWith('**')&&token.endsWith('**')?document.createElement('strong'):token.startsWith('`')&&token.endsWith('`')?document.createElement('code'):document.createTextNode(token);if(el.nodeType===1)el.textContent=token.startsWith('**')?token.slice(2,-2):token.slice(1,-1);p.append(el);}container.append(p);}}
function toast(text){const node=$('s17-agent-toast');node.textContent=text;node.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.hidden=true,2400);}
function append(role,text,actions=[],origin='井见 · 本地导览'){root.dataset.empty='false';log.querySelector('.s17-agent-welcome')?.remove();const wrap=document.createElement('article');wrap.className='s17-agent-message';wrap.dataset.role=role;const label=document.createElement('small');label.className='s17-message-origin';label.textContent=role==='user'?'你':origin;const content=document.createElement('div');content.className='s17-message-content';richText(content,text);wrap.append(label,content);if(actions.length){const row=document.createElement('div');row.className='s17-agent-actions';for(const action of actions.slice(0,6)){try{const d=destination(action),a=document.createElement('a');a.textContent=d.label;a.href=d.href;if(d.localTab)a.dataset.agTab=d.localTab;if(d.newTab){a.target='_blank';a.rel='noopener';}row.append(a);}catch{}}wrap.append(row);}if(role==='assistant'){const copy=document.createElement('button');copy.type='button';copy.className='s17-message-copy';copy.innerHTML=icon('copy')+'<span>复制</span>';copy.setAttribute('aria-label','复制这条回复');copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);toast('回复已复制');}catch{toast('可选中文字，使用系统复制');}};wrap.append(copy);lastReply=text;}log.append(wrap);log.scrollTop=log.scrollHeight;history.push({role,content:text});if(history.length>24)history.splice(0,history.length-24);}
function guide(text){const t=text.toLowerCase().trim();if(/从哪里|如何开始|怎么开始|五个|全部案例|导览/.test(t))return{text:'可以按“岩屑 → 气测 → 荧光 → 钻时 → 报告”看，也可以直接选一例。每例都有背景、流程和交互演示。首页还收录其他12个阶段的新增案例。已载入的案例进入门户对应页，其余可直接打开独立演示。',actions:[...catalog.filter(c=>/^m[1-5]$/.test(c.id)).map(c=>({target:c.id})),{target:'home'}]};if(/真实.*荧光|真实.*配对|白光.*对照|方解石/.test(t))return{text:'这组真实照片展示同组方解石在可见光、短波UV和长波UV下的外观，用来理解矿物发光与油气解释的区别；不是含油岩屑训练数据。',actions:[{target:'fluorescence_reference'}]};if(/首页|回去|返回主页/.test(t))return{text:'点这里回到网站首页。',actions:[{target:'home'}]};if(/13|作业链|全部阶段/.test(t))return{text:'点这里查看原门户保留的作业链导航。',actions:[{target:'chain'}]};if(/录井阶段|进入录井/.test(t))return{text:'录井阶段包含五个必做子场景。',actions:[{target:'mudlogging'}]};if(/当前页|这个页面/.test(t)){const p=pageContext(),c=caseById(p.sceneId);return{text:c?c.intro:'当前是“'+p.title+'”。可以从首页选择案例，或通过13阶段导航浏览场景。',actions:c?[{target:c.id,tab:'bg'},{target:c.id,tab:'flow'},{target:c.id,tab:'demo'}]:[{target:'mudlogging'}]};}const c=catalog.find(c=>new RegExp('(?:^|[^a-z0-9])'+c.id+'(?:$|[^a-z0-9])','i').test(t)||c.terms.some(w=>t.includes(w)));if(c&&(!adapter||/打开|带我|进入|跳到|去看|看看/.test(t)||/^(m[1-5]|气测|岩屑|荧光|钻时|报告)$/.test(t))){let tab=/背景|概念/.test(t)?'bg':/流程|步骤/.test(t)?'flow':'demo';return{text:c.intro+'\n可以从这里进入对应内容。',actions:[{target:c.id,tab}]};}if(!adapter&&/模型|api|live2d|数字人|语音/.test(t))return{text:'角色状态：'+(g.S17Live2D?.state??'准备中')+'。本地导航与固定导学可用；开放式大模型问答可在右上角设置中连接火山方舟。浏览器朗读可手动开启。',actions:[]};return null;}
const tools=[{name:'navigate_page',description:'提供本站页面导航，仅使用允许的target，不执行JS或任意URL。',parameters:{type:'object',properties:{target:{type:'string',enum:['home','chain','mudlogging',...catalog.map(c=>c.id),'fluorescence_reference']},tab:{type:'string',enum:['bg','flow','demo']}},required:['target']}}];
async function ask(text){const media=g.S17Media;if(busy)return;if(media?.snapshot().processing||media?.snapshot().recording){media.notice('请先结束录音或等待附件准备完成。');return;}const parts=media?.parts()??[];if(!text.trim()&&!parts.length)return;if(parts.length&&!adapter){append('assistant','附件已在本地准备好。请先在右上角设置里连接模型，再发送附件。',[],'连接状态');return;}const question=text.trim()||(parts.some(p=>p.type==='input_audio')?'请听取录音并回答其中的问题。':'请解释这张图片中可见的内容。'),names=media?.snapshot().files.map(f=>f.name)??[];append('user',question+(names.length?'\n[本轮附件：'+names.join('、')+'；后续轮次未自动重传]':''));$('s17-agent-input').value='';$('s17-agent-input').style.height='';const local=parts.length?null:guide(question);if(local){append('assistant',local.text,local.actions);syncComposer();return;}if(!adapter){append('assistant','可以先让我介绍当前案例、解释步骤，或者带你定位页面。连接大模型后，我们还可以继续讨论具体问题。',catalog.slice(0,5).map(c=>({target:c.id})));syncComposer();return;}const model=adapter,messages=history.map(m=>({...m}));if(parts.length)messages[messages.length-1].content=[{type:'input_text',text:question},...parts];busy=true;media?.setBusy(true);$('s17-agent-send').disabled=true;$('s17-agent-new').disabled=true;$('s17-agent-pending').hidden=false;$('s17-agent-mode').textContent='正在请求 '+model.name;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);try{requestCount++;const result=await model.reply({messages,context:{page:pageContext(),cases:catalog,scope:'静态教学演示；仅用户本轮明确附上的图片/录音作为多模态输入；不声称读取了iframe内结果或现场真值。'},tools,signal:controller.signal});if(model!==adapter)return;if(!result||typeof result.text!=='string'||!result.text.trim())throw Error('模型未返回可显示的文本');successfulCalls++;append('assistant',result.text,(Array.isArray(result.actions)?result.actions:[]),model.name+' · 模型回复');media?.clear();$('s17-agent-badge').textContent='模型已调用 · 本页连接';if($('s17-agent-autoread')?.checked&&!$('s17-agent-panel').hidden)readReply();}catch(e){append('assistant','本次模型请求未完成：'+(e.name==='AbortError'?'已取消或超时':e.message)+ '。页面导航仍可使用；未成功发送的附件可重试。',[],'连接状态');}finally{clearTimeout(timeout);controller=null;busy=false;media?.setBusy(false);syncComposer();$('s17-agent-new').disabled=false;$('s17-agent-pending').hidden=true;$('s17-agent-mode').textContent=adapter?adapter.name:'本地导览';}}
function open(){if(ownerIsParent)return;root.dataset.open='true';const panel=$('s17-agent-panel');panel.hidden=false;g.S17Live2D?.greet?.();$('s17-agent-launcher').setAttribute('aria-expanded','true');updateContext();if(!log.children.length)welcome();if(!options.open)$('s17-agent-input').focus();}
function close(){attachmentMenu(false);root.dataset.open='false';if(controller)controller.abort();g.S17Media?.cancelRecording();if(g.speechSynthesis)g.speechSynthesis.cancel();root.dataset.speaking='false';$('s17-agent-panel').hidden=true;$('s17-agent-launcher').setAttribute('aria-expanded','false');$('s17-agent-launcher').focus();}
const compact=document.createElement('button');compact.id='s17-agent-compact';compact.type='button';let compactChosen=false;function setCompact(value){root.dataset.compact=String(value);compact.textContent=value?'展开角色':'收起角色';compact.setAttribute('aria-pressed',String(value));}root.prepend(compact);setCompact(standalone||matchMedia('(max-width:650px)').matches);compact.onclick=()=>{compactChosen=true;setCompact(root.dataset.compact!=='true');};addEventListener('resize',()=>{if(!compactChosen)setCompact(standalone||matchMedia('(max-width:650px)').matches);});
$('s17-agent-launcher').onclick=()=>{$('s17-agent-panel').hidden?open():close();};$('s17-agent-close').onclick=close;$('s17-agent-form').onsubmit=e=>{e.preventDefault();ask($('s17-agent-input').value);};$('s17-agent-input').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();ask(e.currentTarget.value);}};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('s17-agent-panel').hidden)close();});document.addEventListener('click',e=>{const local=e.target.closest('[data-ag-tab]');if(local){e.preventDefault();document.querySelector('nav[aria-label="案例内容"] [data-tab="'+local.dataset.agTab+'"]')?.click();updateContext();return;}const b=e.target.closest('[data-s17-assistant],[data-ag-query]');if(!b)return;open();if(b.dataset.agQuery)ask(b.dataset.agQuery);});g.addEventListener('hashchange',updateContext);document.addEventListener('click',e=>{if(e.target.closest('nav[aria-label="案例内容"] [data-tab]'))updateContext();});
const options=root.querySelector('.s17-agent-options');
function showSettings(value){options.open=value;root.dataset.view=value?'settings':'chat';$('s17-agent-settings').setAttribute('aria-pressed',String(value));if(value)options.scrollTop=0;}
$('s17-agent-settings').onclick=()=>showSettings(!options.open);options.addEventListener('toggle',()=>{root.dataset.view=options.open?'settings':'chat';$('s17-agent-settings').setAttribute('aria-pressed',String(options.open));});
$('s17-agent-expand').onclick=()=>{const value=root.dataset.expanded!=='true';root.dataset.expanded=String(value);$('s17-agent-expand').setAttribute('aria-pressed',String(value));$('s17-agent-expand').setAttribute('aria-label',value?'还原对话面板':'展开对话面板');};
$('s17-agent-new').onclick=()=>{if(busy)return;history.length=0;lastReply='';g.S17Media?.clear();$('s17-agent-input').value='';showSettings(false);welcome();syncComposer();$('s17-agent-input').focus();};
$('s17-agent-attach').onclick=()=>attachmentMenu($('s17-agent-attachment-menu').hidden);document.addEventListener('click',e=>{if(!e.target.closest('#s17-agent-attachments'))attachmentMenu(false);if(e.target.closest('#s17-agent-attachment-menu button'))attachmentMenu(false);});
$('s17-agent-cancel').onclick=()=>controller?.abort();$('s17-agent-input').oninput=e=>{e.target.style.height='auto';e.target.style.height=Math.min(160,Math.max(86,e.target.scrollHeight))+'px';syncComposer();};
// Only an ownership flag crosses sandbox boundaries; no data or credentials.
g.addEventListener('message',e=>{if(e.data?.type==='s17-assistant-probe'&&[...document.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))e.source.postMessage({type:'s17-assistant-host',present:true},'*');if(g!==g.parent&&e.source===g.parent&&e.data?.type==='s17-assistant-host'&&e.data.present===true){ownerIsParent=true;root.hidden=true;controller?.abort();g.S17Media?.cancelRecording();}});if(g!==g.parent)g.parent.postMessage({type:'s17-assistant-probe'},'*');
function readReply(){if(!g.speechSynthesis||!g.SpeechSynthesisUtterance){append('assistant','当前浏览器未提供系统朗读。');return;}if(!lastReply)return;g.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(lastReply);speech.lang='zh-CN';const voice=g.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('zh'));if(voice)speech.voice=voice;speech.onstart=()=>{root.dataset.speaking='true';};speech.onend=speech.onerror=()=>{root.dataset.speaking='false';};g.speechSynthesis.speak(speech);}$('s17-agent-read').onclick=readReply;$('s17-agent-stop').onclick=()=>{g.speechSynthesis?.cancel();root.dataset.speaking='false';};
g.S17Assistant={open,close,updateComposer:syncComposer,resolve:destination,context:pageContext,tools,catalog:catalog.map(c=>({...c})),configure:model=>{if(busy)throw Error('请等待当前请求结束或先收起取消');if(!model||typeof model.name!=='string'||typeof model.reply!=='function')throw Error('需要已实现的模型适配器name与reply');adapter=model;successfulCalls=0;$('s17-agent-badge').textContent='模型已配置 · 待调用';$('s17-agent-mode').textContent=model.name;$('s17-agent-model-status').textContent='已提供模型适配器：'+model.name+'。可发送文字、图片、录音；接通状态由实际请求决定。';},disconnect:()=>{if(controller)controller.abort();adapter=null;successfulCalls=0;$('s17-agent-badge').textContent='本地导览 · 模型待接';$('s17-agent-mode').textContent='本地导览';},snapshot:()=>({version:'0.5.0-preview',avatar:g.S17Live2D?.state==='ready'?'Live2D '+g.S17Live2D.model:root.dataset.avatar??'svg_fallback',model:adapter?.name??null,requestCount,successfulCalls,open:!$('s17-agent-panel').hidden,busy,parentOwned:ownerIsParent,media:g.S17Media?.snapshot()??null,context:pageContext(),history:history.map(v=>({...v}))})};updateContext();syncComposer();
})(window);

(function(g){'use strict';
// Files and recordings remain in this page's memory until the user presses Send.
const form=document.getElementById('s17-agent-form');if(!form)return;
const box=document.createElement('div');box.className='s17-agent-media';
box.innerHTML='<div class="s17-media-buttons"><button type="button" id="s17-media-image">＋ 图片</button><button type="button" id="s17-media-audio">＋ 音频</button><button type="button" id="s17-media-record" aria-pressed="false">录音</button><input id="s17-media-image-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><input id="s17-media-audio-file" type="file" accept=".wav,.mp3,.m4a,.aac,.webm,.ogg" hidden></div><div id="s17-media-preview"></div><p id="s17-media-notice" role="status"></p>';
form.prepend(box);document.getElementById('s17-agent-attachment-menu')?.append(box.querySelector('.s17-media-buttons'));document.getElementById('s17-agent-microphone')?.append(document.getElementById('s17-media-record'));const $=id=>document.getElementById(id),preview=$('s17-media-preview'),recordButton=$('s17-media-record'),pending=new Map();let processing=0,locked=false,recorder=null,stream=null,timer=null,recording=false,stopping=false,cancelled=false,epoch=0;
const auto=document.createElement('label');auto.className='s17-auto-read';auto.innerHTML='<input id="s17-agent-autoread" type="checkbox"> 自动朗读模型回复（浏览器/系统语音）';document.querySelector('.s17-agent-options').insertBefore(auto,document.querySelector('.s17-speech-controls'));
function notice(text){$('s17-media-notice').textContent=text;}
function render(){preview.replaceChildren();for(const f of pending.values()){const row=document.createElement('div');row.className='s17-media-item';if(f.kind==='image'){const image=document.createElement('img');image.src=f.url;image.alt='待发送图片预览';row.append(image);}else{const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=f.url;row.append(audio);}const title=document.createElement('span');title.textContent=f.name+(f.seconds?' · '+f.seconds.toFixed(1)+'秒':'');const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.setAttribute('aria-label','移除'+f.name);remove.disabled=locked;remove.onclick=()=>{URL.revokeObjectURL(f.url);pending.delete(f.kind);render();notice('附件已移除，不会发送该文件。');};row.append(title,remove);preview.append(row);}for(const id of ['s17-media-image','s17-media-audio','s17-media-image-file','s17-media-audio-file'])$(id).disabled=locked||!!processing||recording;recordButton.disabled=locked||!!processing||stopping;recordButton.setAttribute('aria-pressed',String(recording));if(!recording){recordButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';recordButton.setAttribute('aria-label','麦克风录音');recordButton.title='麦克风录音';}g.S17Assistant?.updateComposer();}
const dataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('文件读取失败'));reader.readAsDataURL(blob);});
async function wav(blob){const Context=g.AudioContext||g.webkitAudioContext;if(!Context||!g.OfflineAudioContext)throw Error('此浏览器无法解码音频，请换用桌面Chrome或Edge');const ctx=new Context();let decoded;try{decoded=await ctx.decodeAudioData(await blob.arrayBuffer());}finally{await ctx.close();}if(!decoded.duration||decoded.duration>60)throw Error('演示仅接受60秒以内的录音');const offline=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const mono=(await offline.startRendering()).getChannelData(0),buffer=new ArrayBuffer(44+mono.length*2),view=new DataView(buffer),put=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i));};put(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);put(8,'WAVE');put(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);put(36,'data');view.setUint32(40,mono.length*2,true);for(let i=0;i<mono.length;i++){const v=Math.max(-1,Math.min(1,mono[i]));view.setInt16(44+i*2,v<0?v*32768:v*32767,true);}return{blob:new Blob([buffer],{type:'audio/wav'}),seconds:decoded.duration};}
async function prepare(file,kind){if(locked||processing)return;const token=epoch;processing++;render();notice('正在本地准备附件，尚未上传…');try{if(!file.size||file.size>(kind==='image'?5:8)*1024*1024)throw Error(kind==='image'?'图片需小于5MB':'录音文件需小于8MB、60秒以内');let blob=file,seconds=null,name=file.name;if(kind==='image'){const ext=name.split('.').pop().toLowerCase(),mime={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];if(!mime)throw Error('图片支持JPG、PNG或WebP');blob=new Blob([file],{type:mime});const bitmap=await createImageBitmap(blob);if(bitmap.width*bitmap.height>16000000){bitmap.close();throw Error('图片像素超过1600万，请先缩小');}bitmap.close();}else{const audio=await wav(file);blob=audio.blob;seconds=audio.seconds;name=name.replace(/\.[^.]*$/,'')+'.wav';}const data=await dataURL(blob);if(token!==epoch)return;const old=pending.get(kind);if(old)URL.revokeObjectURL(old.url);pending.set(kind,{kind,name,seconds,data,url:URL.createObjectURL(blob)});notice('附件已准备好，尚未上传。可预览、移除，或点击发送。');}catch(e){if(token===epoch)notice(e.message);}finally{processing--;render();}}
for(const kind of ['image','audio']){$('s17-media-'+kind).onclick=()=>$('s17-media-'+kind+'-file').click();$('s17-media-'+kind+'-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)await prepare(f,kind);};}
function release(){clearInterval(timer);timer=null;stream?.getTracks().forEach(t=>t.stop());stream=null;}
function stop(cancel=false){const active=recorder?.state==='recording';cancelled=cancelled||cancel||!active;if(!active)epoch++;stopping=active;if(active)recorder.stop();release();recording=false;render();}
recordButton.onclick=async()=>{if(recording){stop();return;}if(!g.isSecureContext||!navigator.mediaDevices?.getUserMedia||!g.MediaRecorder){notice('录音需要HTTPS或本机localhost环境及浏览器麦克风支持。也可上传现有录音文件。');return;}const token=++epoch;recording=true;cancelled=false;render();recordButton.textContent='取消录音';notice('等待麦克风授权…');try{const acquired=await navigator.mediaDevices.getUserMedia({audio:true});if(token!==epoch||cancelled){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;const chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{const wasCancelled=cancelled,mime=recorder.mimeType;recorder=null;stopping=false;release();recording=false;render();if(wasCancelled){notice('录音已停止并丢弃，没有上传。');return;}await prepare(new File(chunks,'麦克风录音.webm',{type:mime}),'audio');};recorder.onerror=()=>{cancelled=true;stop(true);notice('录音未完成，请检查麦克风权限或上传已有文件。');};recorder.start();const start=Date.now();recordButton.textContent='停止录音 · 0秒';notice('正在本地录音，最长60秒；停止后可试听，再点击发送。');timer=setInterval(()=>{const seconds=Math.floor((Date.now()-start)/1000);recordButton.textContent='停止录音 · '+seconds+'秒';if(seconds>=60)stop();},250);}catch(e){if(token!==epoch)return;release();recording=false;render();notice(e.name==='NotAllowedError'?'未获得麦克风授权。可上传已有录音文件。':'无法开始录音，请检查麦克风或上传已有文件。');}};
function clear(){epoch++;for(const f of pending.values())URL.revokeObjectURL(f.url);pending.clear();render();notice('');}
g.S17Media={parts:()=>[...pending.values()].map(f=>f.kind==='image'?{type:'input_image',image_url:f.data}:{type:'input_audio',audio_url:f.data}),snapshot:()=>({files:[...pending.values()].map(({kind,name,seconds})=>({kind,name,seconds})),processing:!!processing||stopping,recording}),notice,clear,setBusy:value=>{locked=value;render();},cancelRecording:()=>{epoch++;if(recording||stream)stop(true);}};
g.addEventListener('pagehide',()=>{stop(true);clear();});render();
})(window);

(function(g){'use strict';const host=document.querySelector('#s17-assistant .s17-agent-options');if(!host)return;
const box=document.createElement('div');box.className='s17-model-config';box.innerHTML='<h3>火山方舟</h3><label>Model ID<input id="s17-ark-model" value="doubao-seed-2-0-mini-260428" spellcheck="false" autocomplete="off"></label><label>API Key<input id="s17-ark-key" type="password" autocomplete="off" placeholder="输入你的 API Key"></label><label>调用地址<input id="s17-ark-url" value="https://ark.cn-beijing.volces.com/api/v3/responses" spellcheck="false" autocomplete="off"></label><button id="s17-ark-connect" type="button">连接模型</button><button id="s17-ark-disconnect" type="button">断开连接</button><p id="s17-ark-status">填写连接信息后，点击“连接模型”。如使用自己的代理，可填写兼容 Responses API 的地址。</p><p>支持文字、图片和录音输入，回复显示为文字，可选系统朗读。<a href="https://docs.volcengine.com/docs/ark/model-pricing?lang=zh" target="_blank" rel="noopener">官方价格</a> · <a href="https://docs.volcengine.com/docs/ark/create-model-responses-api?lang=en" target="_blank" rel="noopener">接口文档</a></p>';
host.insertBefore(box,document.getElementById('s17-agent-model-status'));const $=id=>document.getElementById(id);let credential='',calls=0,lastUsage=null;
function payload(messages,context,tools,model){const instructions='你是井见录井教学网站的讲解和导航助手。用自然、简洁的中文。重点解释业务概念与页面操作，不扩展研究训练或现场建议。以下context是静态页面元数据，不是现场测量或iframe里的实时结果。可听取本轮input_audio并理解本轮input_image；历史中的附件名称不代表再次提供了原文件，缺少内容时请用户重新附上。不要声称看到了未提供的图像、指标或用户文件。描述图片时区分可见外观与推断，不凭外观判定油气。需要导航时调用navigate_page，仅支持已声明目标；语音中的导航请求同样可调用。回复文字即可，语音播放由页面系统朗读完成。不要生成JavaScript或未知URL，不自动运行训练/上传/删除。你可参考以下案例说明：'+JSON.stringify(context);return{model,input:[{role:'system',content:instructions},...messages.slice(-10).map(m=>({role:m.role,content:m.content}))],tools:tools.map(t=>({type:'function',name:t.name,description:t.description,parameters:t.parameters})),tool_choice:'auto',thinking:{type:'disabled'},max_output_tokens:700,store:false,stream:false};}
function parse(result){const messages=(result.output??[]).filter(v=>v.type==='message').flatMap(v=>v.content??[]).filter(v=>v.type==='output_text').map(v=>v.text).join('\n'),actions=[];for(const item of result.output??[]){if(item.type!=='function_call'||item.name!=='navigate_page')continue;try{const a=JSON.parse(item.arguments);g.S17Assistant.resolve(a);actions.push(a);}catch{}}if(!messages&&!actions.length)throw Error(result.error?.message??'服务未返回文字或有效导航动作');return{text:messages||(actions.length?'我找到对应页面，点击下面进入。':''),actions};}
$('s17-ark-connect').onclick=()=>{try{const model=$('s17-ark-model').value.trim(),value=$('s17-ark-key').value.trim(),url=new URL($('s17-ark-url').value.trim(),location.href);if(!/^[a-zA-Z0-9._-]{3,120}$/.test(model))throw Error('请填写控制台的Model ID或推理接入点ID');if(!value)throw Error('请在自己的浏览器填写API Key');if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('调用地址需HTTPS或本机HTTP代理');const endpoint=url.href;g.S17Assistant.configure({name:'火山方舟 · '+model,reply:async({messages,context,tools,signal})=>{const activeKey=credential;if(!activeKey)throw Error('模型已断开，请重新配置');calls++;let r;try{r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+activeKey},body:JSON.stringify(payload(messages,context,tools,model)),signal});}catch(e){if(e.name==='AbortError')throw e;throw Error('无法连接接口；请检查网络、地址与CORS，或使用允许跨域的接口代理');}const body=await r.json().catch(()=>({}));if(!r.ok||body.error)throw Error(('HTTP '+r.status+'：'+(body.error?.message??'模型服务拒绝请求')).replaceAll(activeKey,'[redacted]'));lastUsage=body.usage??null;return parse(body);}});credential=value;$('s17-ark-key').value='';$('s17-ark-status').textContent='已在本页内存配置，尚未验证调用。下一次开放式提问将实际请求 '+url.host+'；导航快捷命令仍在本地处理。';}catch(e){$('s17-ark-status').textContent=e.message;}};
$('s17-ark-disconnect').onclick=()=>{credential='';$('s17-ark-key').value='';g.S17Assistant.disconnect();$('s17-ark-status').textContent='已清空本页Key并断开模型；没有写入浏览器持久存储。';};g.S17Ark={snapshot:()=>({configured:!!credential,calls,lastUsage,liveCallVerified:g.S17Assistant.snapshot().successfulCalls>0}),makePayload:payload,parseResponse:parse};
})(window);

}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startAssistant,{once:true});else startAssistant();})();
