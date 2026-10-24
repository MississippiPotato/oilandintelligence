(function(g){
  'use strict';
  const SCENE='w4',ID='s17x-w4-log-lithology',labels=['砂岩','泥岩','灰岩'],names=['GR / API','log₁₀(Rt / 1 Ω·m)','RHOB / g·cm⁻³','NPHI / v/v'];
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
  function normal(r){return Math.sqrt(-2*Math.log(Math.max(1e-9,r())))*Math.cos(2*Math.PI*r());}
  function dataset(split,options={}){
    const conf={train:[6,120,417],validation:[2,120,8417],test:[2,160,18417]}[split];
    if(!conf)throw new Error('未知集合');
    const observations=[],labelsTruth=[],groups=[];
    for(let w=0;w<conf[0];w++){
      const r=rng(conf[2]+w*131),wellId='LOG-'+split.toUpperCase()+'-'+(w+1),grShift=normal(r)*4,fluidShift=normal(r)*.12;
      groups.push(wellId); let label=w%3,remaining=0,phi=.2;
      for(let i=0;i<conf[1];i++){
        if(remaining<=0){label=(label+1+(r()>.8?1:0))%3;remaining=9+Math.floor(r()*18);phi=label===0?.14+r()*.12:label===1?.21+r()*.1:.07+r()*.12;}
        remaining--;const n=split==='test'?Number(options.noise??1):1;
        let gr=[31,112,22][label]+grShift+normal(r)*9*n;
        let logrt=[1.30,.62,1.75][label]+fluidShift+normal(r)*.18*n;
        const matrix=[2.65,2.73,2.71][label];
        let rhob=(1-phi)*matrix+phi*1.05+normal(r)*.025*n;
        let nphi=phi+[ -.015,.09,.015][label]+normal(r)*.018*n;
        if(split==='test'&&options.preset==='gas'&&label===0){logrt+=.7;nphi-=.09;rhob-=.09;}
        if(split==='test'&&options.preset==='domain'){
          if(label===2){gr+=65;rhob-=.16;nphi+=.10;}
          if(i>55&&i<115){rhob-=.18;nphi+=.08;}
        }
        const depth=1500+i*.5;
        observations.push({wellId,depth,gr:Math.max(0,gr),rt:10**logrt,rhob:Math.max(1.7,rhob),nphi:Math.max(-.05,nphi)});
        labelsTruth.push(label);
      }
    }
    return {observations,evaluationTruth:{labels:labelsTruth},groups,split};
  }
  function feature(o){return[o.gr,Math.log10(Math.max(.01,o.rt)),o.rhob,o.nphi];}
  function indices(mode){return mode==='gr'?[0]:mode==='no-density'?[0,1,3]:[0,1,2,3];}
  function fitScale(xs){const mu=xs[0].map((_,j)=>mean(xs.map(x=>x[j]))),sd=mu.map((m,j)=>Math.sqrt(mean(xs.map(x=>(x[j]-m)**2)))||1);return{mean:mu,sd};}
  function scaled(x,s){return x.map((v,j)=>(v-s.mean[j])/s.sd[j]);}
  function nearest(model,observation,k){
    const x=scaled(model.channels.map(j=>feature(observation)[j]),model.scaler);
    return model.samples.map(s=>({wellId:s.wellId,depth:s.depth,label:s.label,x:s.raw,distance:Math.sqrt(s.x.reduce((a,v,j)=>a+(v-x[j])**2,0)/x.length)})).sort((a,b)=>a.distance-b.distance).slice(0,k);
  }
  function classify(model,observation,k,reject=true,support=.6){
    const neighbors=nearest(model,observation,k),votes=[0,0,0],distanceSums=[0,0,0];
    neighbors.forEach(n=>{votes[n.label]++;distanceSums[n.label]+=n.distance;});
    const ranking=[0,1,2].sort((a,b)=>votes[b]-votes[a]||distanceSums[a]-distanceSums[b]);
    const proposed=ranking[0],strength=votes[proposed]/neighbors.length,reasons=[];
    if(strength<support)reasons.push('近邻分歧');if(neighbors[0].distance>model.distanceLimit)reasons.push('远离训练样本');
    return {proposed,label:reject&&reasons.length?-1:proposed,support:strength,nearestDistance:neighbors[0].distance,reasons,neighbors};
  }
  function classification(truth,pred){
    if(truth.length!==pred.length)throw new Error('预测与评价数量不同');
    const confusion=Array.from({length:3},()=>Array(4).fill(0));
    truth.forEach((t,i)=>{if(t<0||t>2)throw new Error('未知评价标签');confusion[t][pred[i]<0?3:pred[i]]++;});
    const details=labels.map((name,c)=>{const tp=confusion[c][c],fn=confusion[c].reduce((a,v)=>a+v,0)-tp,fp=confusion.reduce((a,row,i)=>a+(i!==c?row[c]:0),0);return{name,tp,fn,fp,recall:tp+fn?tp/(tp+fn):null,precision:tp+fp?tp/(tp+fp):null,f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null};});
    const accepted=pred.filter(p=>p>=0).length,correct=truth.reduce((s,t,i)=>s+(t===pred[i]?1:0),0);
    const fs=details.map(d=>d.f1).filter(v=>v!==null);
    return {n:truth.length,accuracy:truth.length?correct/truth.length:null,macroF1:fs.length?mean(fs):null,coverage:truth.length?accepted/truth.length:null,accepted,acceptedError:accepted?(accepted-correct)/accepted:null,confusion,perClass:details};
  }
  function baseline(o,rules){return o.gr>=rules.shale?1:o.gr>=rules.sand?0:2;}
  function train(mode='all',requestedK='auto'){
    const tr=dataset('train'),va=dataset('validation'),channels=indices(mode),raw=tr.observations.map(o=>channels.map(j=>feature(o)[j])),scaler=fitScale(raw);
    const model={channels,scaler,samples:raw.map((x,i)=>({x:scaled(x,scaler),raw:feature(tr.observations[i]),label:tr.evaluationTruth.labels[i],wellId:tr.observations[i].wellId,depth:tr.observations[i].depth})),distanceLimit:Infinity};
    const trials=[];let k=3,best=-1;
    for(const kk of [3,5,9,15]){const score=classification(va.evaluationTruth.labels,va.observations.map(o=>classify(model,o,kk,false).label));trials.push({k:kk,macroF1:score.macroF1});if(score.macroF1>best){best=score.macroF1;k=kk;}}
    if(requestedK!=='auto'){k=Number(requestedK);if(![3,5,9,15].includes(k))throw new Error('k 不在允许范围');}
    const ds=va.observations.map(o=>nearest(model,o,1)[0].distance).sort((a,b)=>a-b);
    model.distanceLimit=Math.max(.35,ds[Math.floor((ds.length-1)*.95)]*1.4);
    let rules={sand:27,shale:75},baseBest=-1;
    for(const sand of [18,22,26,30,34,38,42])for(const shale of [65,75,85,95]){const f=classification(va.evaluationTruth.labels,va.observations.map(o=>baseline(o,{sand,shale}))).macroF1;if(f>baseBest){baseBest=f;rules={sand,shale};}}
    return {model,k,trials,rules,validationF1:best,baselineValidationF1:baseBest,groups:{train:tr.groups,validation:va.groups},counts:{train:tr.observations.length,validation:va.observations.length},mode};
  }
  function infer(trained,observations,settings={}){return observations.map(o=>({...classify(trained.model,o,trained.k,settings.reject??true,settings.support??.6),baseline:baseline(o,trained.rules)}));}
  function evaluate(pred,evaluationTruth){return{model:classification(evaluationTruth.labels,pred.map(p=>p.label)),baseline:classification(evaluationTruth.labels,pred.map(p=>p.baseline))};}
  function run(p){if(!Number.isFinite(p.noise)||p.noise<.5||p.noise>3||!Number.isFinite(p.support)||p.support<0||p.support>1)throw new Error('噪声或支持度超出范围');const trained=train(p.mode,p.k),test=dataset('test',p),predictions=infer(trained,test.observations,p);return{sceneId:SCENE,caseId:ID,trained,test,predictions,metrics:evaluate(predictions,test.evaluationTruth),params:{...p},dataVersion:'LOG-SYNTH-2026-10-24-v1'};}
  g.W4Engine={SCENE,ID,labels,names,feature,indices,dataset,fitScale,nearest,classify,classification,baseline,train,infer,evaluate,run};
})(globalThis);
