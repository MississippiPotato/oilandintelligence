(function(g){
  'use strict';
  const inputs=['fluid_m3','proppant_t','rate_m3_min','permeability_mD','brittleness'];
  const ranges=[[400,1200],[40,160],[4,10],[.5,5],[.3,.85]];
  function rng(seed){let x=seed>>>0;return()=>((x=Math.imul(1664525,x)+1013904223>>>0)/4294967296);}
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  function cost(x){return 14+.018*x.fluid_m3+.12*x.proppant_t+1.2*x.rate_m3_min;}
  // The response generator is used to create independent labelled experiments only.
  // infer() and search() receive a fitted model and observable settings, never this function.
  function experiment(x,offset,noise){
    const f=(x.fluid_m3-800)/400,s=(x.proppant_t-100)/60,q=(x.rate_m3_min-7)/3,k=(x.permeability_mD-2.75)/2.25,b=(x.brittleness-.575)/.275;
    const oil=150+24*f+19*s+8*q+15*k+17*b+12*f*b+8*s*k-20*f*f-17*s*s-11*q*q-7*f*s+offset+noise;
    const pressure=28+3.5*q+2.4*f+1.3*s-2.2*k+1.6*b+.9*q*q+.7*f*q+.18*offset+.08*noise;
    return {oil90_t:oil,pressure_MPa:pressure};
  }
  function makeGroups(prefix,count,seed){
    const r=rng(seed),rows=[];
    for(let j=0;j<count;j++){
      const group=prefix+String(j+1).padStart(2,'0'),k=.5+4.5*r(),b=.3+.55*r(),offset=(r()-.5)*8;
      for(let i=0;i<24;i++){
        const observation={fluid_m3:400+800*r(),proppant_t:40+120*r(),rate_m3_min:4+6*r(),permeability_mD:k,brittleness:b};
        const target=experiment(observation,offset,(r()-.5)*4);
        rows.push({group,id:group+'-E'+(i+1),observation,evaluationTruth:target});
      }
    }
    return rows;
  }
  function dataset(){return {train:makeGroups('FR-TRAIN-',12,1301),validation:makeGroups('FR-VALID-',4,2301),test:makeGroups('FR-TEST-',4,3301),version:'fracture-independent-reservoirs-v1',nature:'教学合成压裂试验；按储层组留出'};}
  function fitScaler(rows){return inputs.map(key=>{const a=rows.map(r=>r.observation[key]),m=mean(a),sd=Math.sqrt(mean(a.map(v=>(v-m)**2)))||1;return {key,mean:m,sd};});}
  function design(o,scaler){const z=scaler.map(s=>(o[s.key]-s.mean)/s.sd),a=[1,...z];for(let i=0;i<z.length;i++)for(let j=i;j<z.length;j++)a.push(z[i]*z[j]);return a;}
  function solve(a,b){const n=b.length,m=a.map((row,i)=>row.slice().concat(b[i]));for(let j=0;j<n;j++){let p=j;for(let i=j+1;i<n;i++)if(Math.abs(m[i][j])>Math.abs(m[p][j]))p=i;[m[p],m[j]]=[m[j],m[p]];if(Math.abs(m[j][j])<1e-12)throw Error('回归矩阵退化');const v=m[j][j];for(let k=j;k<=n;k++)m[j][k]/=v;for(let i=0;i<n;i++)if(i!==j){const f=m[i][j];for(let k=j;k<=n;k++)m[i][k]-=f*m[j][k];}}return m.map(r=>r[n]);}
  function fit(rows,lambda){const scaler=fitScaler(rows),X=rows.map(r=>design(r.observation,scaler)),n=X[0].length,A=Array.from({length:n},()=>Array(n).fill(0));X.forEach(x=>x.forEach((v,j)=>x.forEach((w,k)=>A[j][k]+=v*w)));for(let j=1;j<n;j++)A[j][j]+=lambda;
    const targets=['oil90_t','pressure_MPa'],beta={};targets.forEach(key=>{const b=Array(n).fill(0);X.forEach((x,i)=>x.forEach((v,j)=>b[j]+=v*rows[i].evaluationTruth[key]));beta[key]=solve(A,b);});
    return {scaler,beta,lambda,trainGroups:[...new Set(rows.map(r=>r.group))],trainRows:rows.length};
  }
  function infer(observation,model){const x=design(observation,model.scaler),out={};Object.entries(model.beta).forEach(([k,b])=>out[k]=x.reduce((s,v,i)=>s+v*b[i],0));return out;}
  function evaluate(predictions,truth){const keys=['oil90_t','pressure_MPa'],out={denominator:truth.length};keys.forEach(k=>{const e=predictions.map((p,i)=>p[k]-truth[i][k]);out[k]={MAE:mean(e.map(Math.abs)),RMSE:e.length?Math.sqrt(mean(e.map(v=>v*v))):null,bias:mean(e)};});return out;}
  let cached;
  function library(){if(cached)return cached;const data=dataset(),selection=[];let selected,loss=Infinity;for(const lambda of [.01,.1,1,10]){const m=fit(data.train,lambda),p=data.validation.map(r=>infer(r.observation,m)),metrics=evaluate(p,data.validation.map(r=>r.evaluationTruth)),s=metrics.oil90_t.MAE;selection.push({lambda,validationMAE_t:s});if(s<loss){loss=s;selected=m;}}
    const trainMean={oil90_t:mean(data.train.map(r=>r.evaluationTruth.oil90_t)),pressure_MPa:mean(data.train.map(r=>r.evaluationTruth.pressure_MPa))};
    cached={data,model:selected,selection,trainMean};return cached;
  }
  function constraints(observation,prediction,settings){const issues=[];if(observation.fluid_m3>settings.waterMax_m3)issues.push('用水超限');if(observation.proppant_t>settings.sandMax_t)issues.push('支撑剂超限');if(cost(observation)>settings.budget_10k)issues.push('成本超限');if(prediction.pressure_MPa>settings.pressureMax_MPa)issues.push('代理压力超限');return issues;}
  function search(settings,model){const candidates=[];for(let f=400;f<=1200;f+=100)for(let s=40;s<=160;s+=20)for(let q=4;q<=10;q+=1){const observation={fluid_m3:f,proppant_t:s,rate_m3_min:q,permeability_mD:settings.permeability_mD,brittleness:settings.brittleness},prediction=infer(observation,model),issues=constraints(observation,prediction,settings),cost_10k=cost(observation);candidates.push({observation,prediction,issues,cost_10k,objective:prediction.oil90_t-settings.costWeight_t_per_10k*cost_10k});}
    const feasible=candidates.filter(c=>!c.issues.length).sort((a,b)=>b.objective-a.objective||a.cost_10k-b.cost_10k),pareto=feasible.filter(a=>!feasible.some(b=>b!==a&&b.cost_10k<=a.cost_10k&&b.prediction.oil90_t>=a.prediction.oil90_t&&(b.cost_10k<a.cost_10k||b.prediction.oil90_t>a.prediction.oil90_t)));
    const observation={fluid_m3:800,proppant_t:100,rate_m3_min:7,permeability_mD:settings.permeability_mD,brittleness:settings.brittleness},prediction=infer(observation,model),cost_10k=cost(observation),baseline={observation,prediction,cost_10k,issues:constraints(observation,prediction,settings),objective:prediction.oil90_t-settings.costWeight_t_per_10k*cost_10k};
    return {candidates,feasible,pareto,best:feasible[0]||null,baseline};
  }
  const defaults={permeability_mD:2.5,brittleness:.62,budget_10k:54,pressureMax_MPa:33,waterMax_m3:1100,sandMax_t:140,costWeight_t_per_10k:1.3};
  function run(options){const settings={...defaults,...options},lib=library(),pred=lib.data.test.map(r=>infer(r.observation,lib.model)),modelMetrics=evaluate(pred,lib.data.test.map(r=>r.evaluationTruth)),baselineMetrics=evaluate(lib.data.test.map(()=>({...lib.trainMean})),lib.data.test.map(r=>r.evaluationTruth)),result=search(settings,lib.model),outOfDomain=!(settings.permeability_mD>=.5&&settings.permeability_mD<=5&&settings.brittleness>=.3&&settings.brittleness<=.85);
    return {...result,settings,outOfDomain,metrics:{surrogate:modelMetrics,meanBaseline:baselineMetrics,gridCount:result.candidates.length,feasibleCount:result.feasible.length,feasibleRate:result.feasible.length/result.candidates.length,objectiveGain:result.best&&!result.baseline.issues.length?result.best.objective-result.baseline.objective:null,oilGain_t:result.best&&!result.baseline.issues.length?result.best.prediction.oil90_t-result.baseline.prediction.oil90_t:null},model:{lambda:lib.model.lambda,featureCount:lib.model.beta.oil90_t.length,selection:lib.selection,trainRows:lib.data.train.length,validationRows:lib.data.validation.length,testRows:lib.data.test.length,groups:{train:[...new Set(lib.data.train.map(r=>r.group))],validation:[...new Set(lib.data.validation.map(r=>r.group))],test:[...new Set(lib.data.test.map(r=>r.group))]}},testRows:lib.data.test.map((r,i)=>({id:r.id,group:r.group,observation:r.observation,prediction:pred[i],reference:r.evaluationTruth})),dataVersion:lib.data.version};}
  function evidence(result,info){const runId=info.runId,settingsId=runId+'-settings',predictionId=runId+'-prediction-'+(info.selected?[info.selected.observation.fluid_m3,info.selected.observation.proppant_t,info.selected.observation.rate_m3_min].join('-'):'best'),errorId=runId+'-heldout-error',ref=id=>({sourceRecordId:id,sourceVersion:1,selector:{type:'whole_record_for_single_fact'}}),selected=info.selected||result.best;
    const sources=[{sourceRecordId:settingsId,sourceVersion:1,sourceType:'text_record',content:{kind:'observable_design_and_constraints',settings:{...result.settings}}},{sourceRecordId:predictionId,sourceVersion:1,sourceType:'text_record',content:{kind:'model_inference',candidate:selected,method:'frozen quadratic ridge surrogate',lambda:result.model.lambda}},{sourceRecordId:errorId,sourceVersion:1,sourceType:'text_record',content:{kind:'heldout_evaluation',datasetId:result.dataVersion,groups:result.model.groups.test,metrics:result.metrics.surrogate}}];
    const claims=[{claimId:predictionId+'-claim',revision:1,kind:'model_inference',statement:selected?'所选设计的90天增油代理预测为'+selected.prediction.oil90_t.toFixed(2)+' t。':'当前441个设计点没有满足全部显式约束的可行点。',value:selected?.prediction.oil90_t??null,unit:'t',sourceRefs:[ref(predictionId),ref(settingsId)],reviewStatus:'needs_review',traceabilityStatus:'linked',supportStatus:'rule_checked',method:'quadratic ridge surrogate + constrained grid search'},{claimId:runId+'-error-claim',revision:1,kind:'observation',statement:'96个独立留出试验点的增油预测MAE为'+result.metrics.surrogate.oil90_t.MAE.toFixed(3)+' t。',value:result.metrics.surrogate.oil90_t.MAE,unit:'t',sourceRefs:[ref(errorId)],reviewStatus:'unreviewed',traceabilityStatus:'linked',supportStatus:'rule_checked'}];
    if(info.review){const id=info.review.sourceRecordId||runId+'-review-'+(info.reviewHistory?.length||1);sources.push({sourceRecordId:id,sourceVersion:1,sourceType:'review_note',content:{...info.review}});claims.push({claimId:id+'-claim',revision:1,kind:'reviewer_note',statement:info.review.note,sourceRefs:[ref(id)],reviewStatus:'confirmed',traceabilityStatus:'linked',supportStatus:'unchecked'});}
    return {schemaVersion:'1.0',caseId:'s17x-e1-fracture-optimization',caseVersion:'1.0.2',runId,datasetId:result.dataVersion,wellId:'FR-QUERY',dataNature:'synthetic_teaching',runConfig:{seed:{train:1301,validation:2301,test:3301},dataVersion:result.dataVersion,splitDescription:'12/4/4 independent reservoir groups; 24 experiments per group',method:'dual quadratic ridge + explicit constrained 441-point grid',parameters:info.params,inputRevision:info.inputRevision},sources,claims,limitations:['全部压裂试验与90天增油响应为教学合成。','候选收益和压力是冻结代理的预测；留出误差仅描述原测试域。',result.outOfDomain?'当前地层输入超出训练覆盖。':'当前地层输入处于教学定义的覆盖范围。'],metrics:result.metrics,result,selectedCandidate:selected,manualReview:info.review?{...info.review,sourceRecordId:info.review.sourceRecordId||runId+'-review-'+(info.reviewHistory?.length||1),sourceVersion:1}:null,reviewHistory:(info.reviewHistory||[]).map((r,i)=>({...r,sourceRecordId:r.sourceRecordId||r.runId+'-review-'+(i+1),sourceVersion:1})),exportedAt:new Date().toISOString()};
  }
  g.FractureCore={inputs,ranges,rng,cost,dataset,fitScaler,design,solve,fit,infer,evaluate,library,constraints,search,defaults,run,evidence};
})(globalThis);
