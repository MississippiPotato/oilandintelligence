import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';import {workbenchContext}from'../tools/workbench-workflow.mjs';
const report='handoff/m4-algorithm-m1-materials-2026-11-03',checks=[],check=(name,pass,observed)=>checks.push({name,pass:!!pass,observed}),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),close=(a,b)=>Math.abs(a-b)<1e-8;
const g=workbenchContext();vm.runInContext(fs.readFileSync('shared/m4-kmeans-explainer.js','utf8'),g);const D=g.S17WBData,V=g.S17WBViews;
for(const scene of ['m1','m2','m4']){
 const cfg=D.defaults(scene),data=D.builtin(scene,cfg),run=D.run(scene,data,cfg),f=D.sampleFile(scene,data),imported=D.parse(scene,f.text,f.name),second=D.run(scene,imported,cfg);
 check(scene+' round-trip actual model input',run.inputFingerprint===second.inputFingerprint);check(scene+' import does not inherit evaluation metrics',second.metrics===null);
 if(scene==='m1'){
  check('M1 default is real-photo texture composition',run.observations.capture.material==='photo_texture_composition');check('M1 twelve separated contours',run.inference.results.length===12,run.inference.results.length);
  check('M1 reference and observation source photographs disjoint',!run.library.groups.train.some(x=>run.library.groups.test.includes(x)));check('M1 no invented field-accuracy metric',run.metrics===null&&run.library.validationF1===null);
  check('M1 raw source photograph and crop are available',g.M1PhotoMaterial.card(run,{selected:1}).includes('原始岩芯图块 2×2 cm'));
  check('M1 imported raw pixels reach same predictions',same(run.inference.results.map(p=>p.prediction),second.inference.results.map(p=>p.prediction)));
  const changed={...data,evaluationTruth:{particles:[{label:99}]}};const independent=D.run(scene,{...changed,isBuiltin:false},cfg);check('M1 prediction ignores evaluation truth',same(run.inference.results.map(p=>p.prediction),independent.inference.results.map(p=>p.prediction)));
  for(const preset of ['merged','occluded']){const r=D.run(scene,D.builtin(scene,{...cfg,preset}),{...cfg,preset});check('M1 '+preset+' changes real contours',!same(run.inference.results.map(p=>p.component.bbox),r.inference.results.map(p=>p.component.bbox)));}
 }
 if(scene==='m2'){
  const r=D.run(scene,data,{...cfg,override:'trip'});check('M2 context preserves actual gas',r.gasSignature===run.gasSignature);check('M2 actual neighbors still change',!same(run.inference[0].prediction.neighbors,r.inference[0].prediction.neighbors));const empty=D.run(scene,data,{...cfg,detectorThreshold:8});check('M2 no-peak state keeps valid training library',empty.inference.length===0&&empty.library.trainCount>0);
 }
 if(scene==='m4'){
  const t=g.S17M4Explain.trace(run),model=run.library.models[run.config.k];check('M4 replay has all1896 training points',t.rows.length===run.library.trainRows&&t.rows.length===1896);
  check('M4 replay is exact training input, not an illustrative cloud',run.library.trainingView.every((r,i)=>same(g.S17Math.scale(r,model.scaler),t.rows[i*8].z)));
  for(let step=0;step<t.totalSteps;step++){const a=g.S17M4Explain.snapshot(run,{kmStep:step}),f=t.frames[a.iteration-1];check('M4 frame SSE '+step,close(a.SSE,model.history[a.iteration-1].SSE));check('M4 frame total assigned count '+step,a.counts.reduce((s,n)=>s+n,0)===t.rows.length);for(let j=0;j<model.centers.length;j++)for(let axis=0;axis<2;axis++)check('M4 actual mean '+step+'/'+j+'/'+axis,close(a.nextCenters[j][axis],a.sums[j][axis]/a.counts[j]));check('M4 distance decomposition '+step,a.distances.every(d=>close(d.distance*d.distance,d.dx*d.dx+d.dy*d.dy)));}
  check('M4 sorted final centers equal actual fitted model',same(t.frames.at(-1).next.slice().sort((a,b)=>a[0]-b[0]),model.centers));check('M4 SSE never increases',t.frames.every((f,i)=>!i||f.SSE<=t.frames[i-1].SSE+1e-8));
  const a=g.S17M4Explain.snapshot(run,{kmPoint:1}),b=g.S17M4Explain.snapshot(run,{kmPoint:1500});check('M4 selected actual point changes source and distances',a.row.wellId!==b.row.wellId&&!same(a.distances,b.distances));
  const plain=g.S17M4Explain.html(run,{kmStep:2});check('M4 execution shows sums, means and actual source',plain.includes('的新中心')&&plain.includes('RESP-TRAIN-0'));
  const uncorrected=D.run(scene,data,{...cfg,normalize:false});check('M4 correction changes actual feature vectors',!same(run.inference.norm,uncorrected.inference.norm));
 }
}
const before=JSON.parse(fs.readFileSync(report+'/before.json','utf8'));let other=0,teacher=0,shared=0;
for(const [p,old]of Object.entries(before.files)){
 if(before.ids.some(id=>p.startsWith('dist/cases/'+id+'/')))continue;
 if(p==='portal/index.html'){const strip=s=>s.replace(/(s17-(?:case-catalog|course)\.js\?v=)[^"']+/g,'$1CACHE');check('Homepage only case-catalog/course cache tokens changed',strip(fs.readFileSync(p,'utf8'))===strip((await import('node:child_process')).execFileSync('git',['show',before.commit+':'+p],{encoding:'utf8'})));continue;}
 if(p.startsWith('dist/'))other++;else if(p.startsWith('portal-original/')||p.startsWith('石油勘探开发智能化案例集/'))teacher++;else shared++;
 check('Protected exact bytes '+p,sha(fs.readFileSync(p))===old.sha256);
}
for(const p of ['case-src/m1/engine.js','case-src/m1/images.js','case-src/m2/engine.js','case-src/m2/data.js','case-src/m4/engine.js']){const old=(await import('node:child_process')).execFileSync('git',['show',before.commit+':'+p]);check('Existing core/generator unchanged '+p,sha(old)===sha(fs.readFileSync(p)));}
const m2=fs.readFileSync('dist/cases/s17-mudgas-context/demo/demo.js','utf8');check('M2 rejected explanatory panel absent from runtime',!m2.includes('function m2Trace')&&!m2.includes('V.m2Explain('));check('M2 compact neighbor and clock views retained',m2.includes("s.view==='how'?V.m2Candidates(r,s)")&&m2.includes("view:scene==='m4'?'how':'result'"));
const build=JSON.parse(fs.readFileSync(report+'/build.json','utf8'));for(const c of build.cases)check('Five-file contract and6MiB '+c.caseId,c.files.length===5&&c.bytes<6*1024*1024);
const out={at:new Date().toISOString(),evidenceType:'Actual numerical computation and source/hash checks. Not browser acceptance.',protectedRuntimeFiles:other,protectedTeacherFiles:teacher,protectedHomepageAssistantFiles:shared,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,checks};fs.writeFileSync(report+'/numeric-scope.json',JSON.stringify(out,null,2));console.log(JSON.stringify({...out,checks:checks.filter(c=>!c.pass)},null,2));if(out.failed)process.exitCode=1;
