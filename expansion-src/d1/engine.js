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
