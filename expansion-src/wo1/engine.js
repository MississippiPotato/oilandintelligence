(function (g) {
  'use strict';
  const names = ['结垢诊断与清理评估', '出砂与井筒清理评估', '举升系统检修评估', '管柱完整性检测评估'];
  const fields = ['pressureLoss_MPa', 'sand_g_L', 'currentVariation_pct', 'depositIndex', 'annulusPressure_MPa'];
  const centers = [[1.5,.15,5,.83,.12],[1.15,2.8,7,.18,.15],[1.8,.18,24,.2,.15],[1.4,.2,6,.15,1.55]];
  function rng(seed) { let x=seed>>>0; return () => ((x=Math.imul(1664525,x)+1013904223>>>0)/4294967296); }
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  const wordSets = [
    [['产量下降','压差增大','沉积附着'],['产能降低','流动受阻','管内结垢'],['堵塞线索','垢层增厚','矿物沉积'],['流道阻力增加','结晶附着','局部沉积']],
    [['产量波动','细砂增加','返出颗粒'],['出砂升高','携砂增多','井底沉砂'],['颗粒冲刷','砂样增多','砂堵线索'],['携出固体颗粒','细砂持续增加','井底颗粒堆积']],
    [['产量下降','电流波动','泵效降低'],['举升异常','负载振动','电机不稳'],['机组失效线索','电流不稳','举升效率降低'],['举升能力下降','电机负载摆动','泵效变差']],
    [['产量下降','环空带压','密封异常'],['环空压力升高','管柱泄漏线索','压力异常'],['密封失效线索','环空持续带压','完整性待查'],['管柱密封待查','环空压力持续增加','完整性记录异常']]
  ];
  function makeWell(seed, group, label, variant) {
    const r=rng(seed), v=centers[label].map((c,j)=>Math.max(0,c+(r()-.5)*[.7,1.3,10,.34,.65][j]));
    const phrases=wordSets[label][variant%4].slice();
    if (r()<.32) phrases.push(wordSets[(label+1)%4][variant%4][0]);
    const historical=seed%5===0?' 历史工单曾提及密封、环空、完整性及泄漏复查，本次未确认这些诊断。':'';
    const observation={wellId:group,text:phrases.join('；')+'。近三次工单未记录完整作业结果。'+historical,integrityStatus:label===3?'suspect':'verified'};
    fields.forEach((k,j)=>observation[k]=+v[j].toFixed(3));
    return {observation,evaluationTruth:{planCategory:label},group,templateFamily:'WORDING-'+(variant%4)};
  }
  function dataset() {
    const create=(n,prefix,start,variant)=>Array.from({length:n},(_,i)=>makeWell(start+i*17,prefix+String(i+1).padStart(3,'0'),i%4,variant===null?Math.floor(i/4)%2:variant));
    return {train:create(48,'WO-TRAIN-',110,null),validation:create(16,'WO-VALID-',2110,2),test:create(20,'WO-TEST-',4110,3),version:'wo-synthetic-history-v1',nature:'教学合成井史；每口井仅属于一个集合；措辞族0/1训练、2验证、3测试'};
  }
  const synonyms=[[/产能|产量/g,'产量'],[/下降|降低/g,'降低'],[/压差|流动受阻|堵塞/g,'阻力'],[/沉积附着|矿物沉积|垢层增厚|管内结垢/g,'结垢'],[/返出颗粒|携砂|砂样|颗粒冲刷|出砂|细砂|沉砂|砂堵/g,'砂粒'],[/举升效率|举升|泵效|机组/g,'泵效'],[/电流|电机|负载|振动/g,'电流'],[/环空压力|环空持续带压|环空带压|环空/g,'环空'],[/密封|管柱泄漏|完整性/g,'密封']];
  function tokenize(text) {
    let s=String(text||''); synonyms.forEach(([a,b])=>s=s.replace(a,b+' '));
    const words=s.match(/[\u4e00-\u9fff]{2,}|[a-z]+/gi)||[], out=[];
    words.forEach(w=>{for(let i=0;i<w.length-1;i++)out.push(w.slice(i,i+2));});
    return out;
  }
  function fitVectorizer(observations) {
    const sets=observations.map(o=>new Set(tokenize(o.text))), counts={};
    sets.forEach(s=>s.forEach(t=>counts[t]=(counts[t]||0)+1));
    const vocab=Object.keys(counts).sort(), idf=vocab.map(t=>Math.log((1+observations.length)/(1+counts[t]))+1);
    return {vocab,idf};
  }
  function vector(text,tf) {
    const counts={};tokenize(text).forEach(t=>counts[t]=(counts[t]||0)+1);
    const x=tf.vocab.map((t,i)=>(counts[t]?1+Math.log(counts[t]):0)*tf.idf[i]), norm=Math.hypot(...x)||1;
    return x.map(v=>v/norm);
  }
  function fitScaler(obs) {
    return fields.map(k=>{const a=obs.map(o=>o[k]);const m=mean(a),sd=Math.sqrt(mean(a.map(x=>(x-m)**2)))||1;return {key:k,mean:m,sd};});
  }
  function featureSimilarity(a,b,scaler) {
    const ds=scaler.filter(s=>Number.isFinite(a[s.key])&&Number.isFinite(b[s.key])).map(s=>((a[s.key]-b[s.key])/s.sd)**2);
    return ds.length?Math.exp(-mean(ds)/2):0;
  }
  function admissible(category,o) {
    const reasons=[];
    if(category!==3&&o.integrityStatus!=='verified')reasons.push('完整性状态尚未确认，先核查管柱');
    if(category===1&&!(Number.isFinite(o.sand_g_L)&&o.sand_g_L>=.4))reasons.push('缺少达到教学筛选线的含砂观测');
    if(category===2&&!(Number.isFinite(o.currentVariation_pct)&&o.currentVariation_pct>=10))reasons.push('缺少电流/负载异常证据');
    if(category===0&&!(Number.isFinite(o.depositIndex)&&o.depositIndex>=.35))reasons.push('缺少沉积证据');
    return reasons;
  }
  function predict(observation,model,config) {
    const c=config||model.config, q=vector(observation.text,model.tf), matched=tokenize(observation.text).filter(t=>model.tf.vocab.includes(t));
    const docs=model.records.map(d=>{const text=q.reduce((s,v,i)=>s+v*d.vector[i],0), feature=featureSimilarity(observation,d.observation,model.scaler);return {id:d.id,category:d.category,textScore:text,featureScore:feature,score:(1-c.featureWeight)*text+c.featureWeight*feature,observation:d.observation};}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    const near=docs.slice(0,c.k), votes=names.map((name,category)=>({name,category,score:near.filter(d=>d.category===category).reduce((s,d)=>s+d.score,0)/c.k,reasons:admissible(category,observation)}));
    votes.sort((a,b)=>b.score-a.score||a.category-b.category);
    const allowed=votes.filter(v=>!v.reasons.length), top=allowed[0]||null, recognized=matched.length>0;
    const missing=fields.filter(k=>!Number.isFinite(observation[k])), support=near[0]?.score||0;
    const accepted=!!top&&recognized&&missing.length<=1&&support>=c.threshold&&top.score>0;
    return {category:accepted?top.category:null,accepted,candidates:votes,eligible:allowed,neighbors:near,support,matchedTerms:[...new Set(matched)].sort(),missing,reason:!recognized?'描述没有命中训练词项':missing.length>1?'观测缺项超过1项':!allowed.length?'没有满足条件的候选':support<c.threshold?'与历史井的相似度不足':!top?.score?'没有可追溯近邻支持':'可进入候选复核',config:{...c}};
  }
  function baseline(observation) {
    const text=observation.text||'', patterns=[/垢|沉积|堵塞/g,/砂|颗粒/g,/泵|电流|电机|举升/g,/环空|密封|泄漏|完整性/g];
    const rank=patterns.map((p,category)=>({category,score:(text.match(p)||[]).length,reasons:admissible(category,observation)})).sort((a,b)=>b.score-a.score||a.category-b.category);
    const best=rank.find(r=>r.score>0&&!r.reasons.length);
    return {category:best?.category??null,accepted:!!best,rank};
  }
  function fit(data) {
    const obs=data.train.map(d=>d.observation),tf=fitVectorizer(obs),scaler=fitScaler(obs),records=data.train.map(d=>({id:d.group,observation:{...d.observation},category:d.evaluationTruth.planCategory,vector:vector(d.observation.text,tf)}));
    const m={tf,scaler,records,config:null,selection:[],groups:{train:data.train.map(d=>d.group),validation:data.validation.map(d=>d.group),test:data.test.map(d=>d.group)}};
    let best=-Infinity;
    for(const k of [3,5,7])for(const featureWeight of [.25,.45,.65])for(const threshold of [.35,.55,.75]){
      const config={k,featureWeight,threshold},pred=data.validation.map(d=>predict(d.observation,m,config)),correct=pred.filter((p,i)=>p.category===data.validation[i].evaluationTruth.planCategory).length,accepted=pred.filter(p=>p.accepted).length,wrong=accepted-correct,score=(correct-1.5*wrong)/pred.length;
      m.selection.push({...config,correct,accepted,denominator:pred.length,score});
      if(score>best){best=score;m.config=config;}
    }
    return m;
  }
  function perturb(observation,preset) {
    const o={...observation};
    if(preset==='missing'){o.text='产量有变化，原因待查。';o.sand_g_L=null;o.depositIndex=null;o.currentVariation_pct=null;}
    if(preset==='conflict'){o.text='电流波动，同时环空带压，沉积结垢线索并存。';o.integrityStatus='suspect';o.annulusPressure_MPa=1.7;}
    if(preset==='paraphrase')o.text=o.text.replace(/产量下降/g,'产能降低').replace(/细砂增加/g,'颗粒冲刷').replace(/电流波动/g,'负载振动').replace(/环空带压/g,'环空持续带压');
    return o;
  }
  function evaluate(pred,base,truth) {
    const n=truth.length,acc=pred.filter((p,i)=>p.category===truth[i].planCategory).length,accepted=pred.filter(p=>p.accepted).length;
    const recall3=pred.filter((p,i)=>p.eligible.filter(c=>c.score>0).slice(0,3).some(c=>c.category===truth[i].planCategory)).length;
    const bcorrect=base.filter((p,i)=>p.category===truth[i].planCategory).length,baccepted=base.filter(p=>p.accepted).length;
    return {denominator:n,model:{correct:acc,accuracy:n?acc/n:null,accepted,coverage:n?accepted/n:null,selectiveAccuracy:accepted?acc/accepted:null,recallAt3:n?recall3/n:null,recallAt3Count:recall3,evidenceCoverage:accepted?pred.filter(p=>p.accepted&&p.neighbors.some(d=>d.category===p.category)).length/accepted:null,constraintViolations:pred.filter(p=>p.accepted&&p.candidates.find(c=>c.category===p.category).reasons.length).length},baseline:{correct:bcorrect,accuracy:n?bcorrect/n:null,accepted:baccepted,coverage:n?baccepted/n:null,selectiveAccuracy:baccepted?bcorrect/baccepted:null,constraintViolations:base.filter(p=>p.accepted&&p.rank.find(c=>c.category===p.category).reasons.length).length},confusion:names.map((_,row)=>names.map((__,col)=>pred.filter((p,i)=>truth[i].planCategory===row&&p.category===col).length).concat(pred.filter((p,i)=>truth[i].planCategory===row&&p.category===null).length))};
  }
  let cache;
  function library(){if(!cache){const data=dataset();cache={data,model:fit(data)};}return cache;}
  function run(options) {
    const {data,model}=library(),preset=options?.preset||'standard',observations=data.test.map(d=>perturb(d.observation,preset)),predictions=observations.map(o=>predict(o,model)),bases=observations.map(baseline),query=options?.query||observations[0];
    const metrics=evaluate(predictions,bases,data.test.map(d=>d.evaluationTruth)),referenceApplicable=preset!=='conflict';
    metrics.referenceApplicable=referenceApplicable;metrics.referenceDenominator=referenceApplicable?data.test.length:0;
    if(!referenceApplicable){for(const key of ['model','baseline']){metrics[key].correct=null;metrics[key].accuracy=null;metrics[key].selectiveAccuracy=null;}metrics.model.recallAt3=null;metrics.model.recallAt3Count=null;metrics.confusion=null;}
    return {prediction:predict(query,model),baseline:baseline(query),query:{...query},metrics,cohort:observations.map((o,i)=>({observation:o,prediction:predictions[i],baseline:bases[i],reference:referenceApplicable?data.test[i].evaluationTruth.planCategory:null})),model:{config:model.config,vocabularySize:model.tf.vocab.length,trainCount:data.train.length,validationCount:data.validation.length,testCount:data.test.length,groups:model.groups,templateFamilies:{train:['WORDING-0','WORDING-1'],validation:['WORDING-2'],test:['WORDING-3']}},dataVersion:data.version,preset};
  }
  function evidence(result,info) {
    const runId=info.runId,queryId=runId+'-query',predictionId=runId+'-candidate',ref=(id,selector)=>({sourceRecordId:id,sourceVersion:1,selector}),whole={type:'whole_record_for_single_fact'};
    const sources=[{sourceRecordId:queryId,sourceVersion:1,sourceType:'text_record',content:{rawText:result.query.text,observation:{...result.query}}},{sourceRecordId:predictionId,sourceVersion:1,sourceType:'text_record',content:{kind:'model_inference',category:result.prediction.category,name:result.prediction.category===null?'待补证':names[result.prediction.category],accepted:result.prediction.accepted,reason:result.prediction.reason,support:result.prediction.support,method:'TF-IDF + observation similarity + nearest-neighbour vote + explicit constraints'}}];
    result.prediction.neighbors.forEach(n=>sources.push({sourceRecordId:n.id,sourceVersion:1,sourceType:'text_record',content:{kind:'synthetic_training_record',datasetId:result.dataVersion,rawText:n.observation.text,observation:{...n.observation},planCategory:n.category}}));
    const claims=[{claimId:runId+'-observation',revision:1,kind:'observation',statement:result.query.text,sourceRefs:[ref(queryId,{type:'text_span',start:0,end:result.query.text.length})],reviewStatus:'unreviewed',traceabilityStatus:'linked',supportStatus:'unchecked'},{claimId:runId+'-candidate-claim',revision:1,kind:'model_inference',statement:result.prediction.accepted?'本次检索得到候选类别：'+names[result.prediction.category]:'本次查询待补充证据，未接受方案类别。',sourceRefs:[ref(predictionId,whole),...result.prediction.neighbors.map(n=>ref(n.id,{type:'text_span',start:0,end:n.observation.text.length}))],reviewStatus:'needs_review',traceabilityStatus:'linked',supportStatus:'rule_checked',method:'training-only TF-IDF and nearest-neighbour retrieval; explicit admissibility checks'}];
    if(info.review){const id=info.review.sourceRecordId||runId+'-review-'+(info.reviewHistory?.length||1);sources.push({sourceRecordId:id,sourceVersion:1,sourceType:'review_note',content:{...info.review}});claims.push({claimId:id+'-claim',revision:1,kind:'reviewer_note',statement:info.review.note,sourceRefs:[ref(id,whole)],reviewStatus:'confirmed',traceabilityStatus:'linked',supportStatus:'unchecked'});}
    return {schemaVersion:'1.0',caseId:'s17x-wo1-workover-retrieval',caseVersion:'1.0.2',runId,datasetId:result.dataVersion,wellId:result.query.wellId,dataNature:'synthetic_teaching',runConfig:{seed:{train:110,validation:2110,test:4110},dataVersion:result.dataVersion,splitDescription:'48/16/20 independent well groups; wording families 0/1 train, 2 validation, 3 test',method:'TF-IDF + nearest-neighbour retrieval with observable features',parameters:info.params,inputRevision:info.inputRevision},sources,claims,limitations:['默认工单、观测和方案类别均为教学合成。','当前自由查询无适用参考标签；冲突反事实不计算准确率。','相似度为支持分，候选类别须结合来源和人工意见复核。'],metrics:result.metrics,result,manualReview:info.review?{...info.review,sourceRecordId:info.review.sourceRecordId||runId+'-review-'+(info.reviewHistory?.length||1),sourceVersion:1}:null,reviewHistory:(info.reviewHistory||[]).map((r,i)=>({...r,sourceRecordId:r.sourceRecordId||r.runId+'-review-'+(i+1),sourceVersion:1})),exportedAt:new Date().toISOString()};
  }
  g.WorkoverCore={names,fields,dataset,tokenize,fit,predict,baseline,perturb,evaluate,library,run,evidence};
})(globalThis);
