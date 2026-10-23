(function(g){
'use strict';
const C=g.M2Core;
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function generate(seed=17,options={},wellId='DEMO-017'){
const r=rng(seed),duration=14400,dt=10,physicalVolume=12;const specs=Array.from({length:8},(_,i)=>({source:1100+i*1550,label:wellId==='DEMO-017'?i%4:Math.floor(r()*4),sigma:45+r()*80,amp:1.5+r()*3}));
if(options.overlap)specs[3].source=specs[2].source+170;
const operations=[];specs.forEach(s=>{if(s.label<2)operations.push({type:s.label===0?'connection':'trip',start_s:s.source-40,end_s:s.source+50});});
// Operations without gas ensure that the presence of an operation does not imply an event.
operations.push({type:'connection',start_s:5200,end_s:5270},{type:'trip',start_s:13000,end_s:13100});
if(options.pause)operations.push({type:'connection',start_s:1250,end_s:1610});
let md=1200;const rows=Array.from({length:duration/dt+1},(_,i)=>{const t=i*dt,paused=operations.some(o=>t>=o.start_s&&t<o.end_s),flow=paused?0:.025*(options.variableFlow?1+.25*Math.sin(t/700):1),rop=paused?0:(.0054+.0007*Math.sin(t/1800));if(i)md+=rop*dt;return {time_s:t,flow,depthMD_m:md,gas:1,c1:.7,c2:.15,c3:.06,qualityFlags:[]};});
const truth=[];specs.forEach((s,i)=>{const arrival=C.arrivalAt(rows,s.source,physicalVolume);const center=s.label===3?arrival:arrival;const sigma=s.sigma*(s.label===2?1.35:1);truth.push({eventId:`${wellId}-E${i+1}`,time_s:center,label:s.label,sourceTime_s:s.label===2?s.source:null,sourceDepthMD_m:s.label===2?C.at(rows,s.source,'depthMD_m'):null});
rows.forEach(row=>{const h=s.amp*Math.exp(-.5*((row.time_s-center)/sigma)**2);row.gas+=h;row.c1+=.68*h;row.c2+=(s.label===3?.012:.14)*h;row.c3+=(s.label===3?.003:.065)*h;});});
rows.forEach(row=>{const noise=(r()-.5)*2*(options.noise??.12);row.gas=Math.max(0,row.gas+noise);row.c1=Math.max(0,row.c1+noise*.3);row.c2=Math.max(0,row.c2+(r()-.5)*.03);row.c3=Math.max(0,row.c3+(r()-.5)*.015);});
if(options.noise>.7)rows.forEach(row=>{row.gas+=.9*Math.exp(-.5*((row.time_s-7300)/25)**2);});
let visibleOps=options.missing?[]:operations;
if(options.override&&options.override!=='original'){visibleOps=operations.filter(o=>Math.abs((o.start_s+o.end_s)/2-specs[0].source)>150);if(options.override!=='drilling')visibleOps.push({type:options.override,start_s:specs[0].source-40,end_s:specs[0].source+50});}
return {observations:{rows,operations:visibleOps,contextMissing:!!options.missing,wellId,datasetId:'s17-synthetic-v1',sourceVersion:1,dataNature:'synthetic_teaching'},evaluationTruth:options.override&&options.override!=='original'?null:truth,metadata:{seed,physicalVolume,dt_s:dt,options,wellId,truthDefinition:'causal teaching scenario annotation; depth only for sustained event class',counterfactual:!!(options.override&&options.override!=='original')}};
}
function training(cfg){let train=[],valid=[],groups={train:[],validation:[],test:['DEMO-017']};
for(const [split,count,base] of [['train',28,1000],['validation',8,9000]])for(let i=0;i<count;i++){const id=(split==='train'?'TRAIN':'VALID')+'-'+String(i+1).padStart(3,'0'),d=generate(base+i*31,{noise:.08+(i%4)*.04,variableFlow:i%3===0},id),det=C.detect(d.observations.rows,cfg.detectorThreshold),pairs=C.match(det,d.evaluationTruth);groups[split].push(id);pairs.forEach(p=>{const e=det[p.pred],f=C.features(d.observations,e,{...cfg,volume:12,correctLag:true});(split==='train'?train:valid).push({x:f.x,label:d.evaluationTruth[p.truth].label,group:id,trace:f.trace,context:{connectionDistance_s:f.connectionDistance_s,tripDistance_s:f.tripDistance_s}});});}
const model=C.fit(train);let chosen={k:5,support:.65},best=-Infinity,selection=[];
for(const k of [3,5,7])for(const support of [.55,.65,.75]){const predictions=valid.map(v=>C.predict(model,{x:v.x,sourceTime_s:1,contextMissing:false,connectionDistance_s:1800,tripDistance_s:1800,peaks:1},{...cfg,k,support,maxDistance:10}).label);const metrics=C.classification(valid.map(v=>v.label),predictions);selection.push({k,support,macroF1:metrics.macroF1});if(metrics.macroF1>best){best=metrics.macroF1;chosen={k,support};}}
const distances=valid.map(v=>C.predict(model,{x:v.x,sourceTime_s:1,connectionDistance_s:1800,tripDistance_s:1800,peaks:1},{...cfg,k:chosen.k,support:0,maxDistance:10}).neighbors[0].distance);const maxDistance=Math.max(1.2,C.quantile(distances,.95)*1.4);
return {model,chosen:{...chosen,maxDistance},groups,trainCount:train.length,validCount:valid.length,selection,validationF1:best};
}
g.M2Data={rng,generate,training};
})(globalThis);
