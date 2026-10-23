import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={};vm.createContext(context);
const base=path.resolve(import.meta.dirname,'..'),checks=[];
for(const scene of ['c1','co1']){
  vm.runInContext(fs.readFileSync(path.join(base,scene,'engine.js'),'utf8'),context);
  const file=path.join(base,scene,'browser-evidence.json'),e=JSON.parse(fs.readFileSync(file,'utf8'));
  const check=(name,fn)=>{fn();checks.push({sceneId:scene,name,status:'passed'});};
  check('Actual downloaded JSON carries required envelope and matching case version',()=>{for(const k of ['schemaVersion','caseId','caseVersion','runId','datasetId','wellId','dataNature','runConfig','sources','claims','limitations'])assert.ok(Object.hasOwn(e,k),k);assert.equal(e.caseVersion,'1.0.0');assert.equal(e.runId,2);});
  check('Every downloaded claim source reference resolves to exact included ID/version',()=>{for(const c of e.claims){for(const k of ['claimId','revision','kind','statement','sourceRefs','reviewStatus','traceabilityStatus','supportStatus'])assert.ok(Object.hasOwn(c,k),k);for(const r of c.sourceRefs){assert.ok(e.sources.some(s=>s.sourceRecordId===r.sourceRecordId&&s.sourceVersion===r.sourceVersion));assert.ok(r.selector.type);}}});
  check('History retains original observation and is not silently inherited as current review',()=>{assert.equal(e.reviewHistory.length,1);const r=e.reviewHistory[0];assert.equal(r.runId,1);assert.equal(r.recordStatus,'stale');assert.ok(r.sourceSnapshot);const note=e.sources.find(s=>s.sourceType==='review_note');assert.ok(note);assert.equal(note.content.note,r.note);assert.ok(!Object.hasOwn(note.content,'recordStatus'));});
  if(scene==='c1'){
    check('Downloaded wave source reproduces all four selected model features',()=>{const x=context.C1Engine.features({waveform:e.sources[0].content.amplitudeRelativeUnit});x.forEach((v,i)=>assert.ok(Math.abs(v-e.selected.prediction.x[i])<1e-12));assert.equal(e.sources[0].content.propagationTime_us.length,80);});
    check('Waveform version and run parameters correspond to actual downloaded input',()=>{assert.equal(e.runConfig.parameters.noise,.04);assert.ok(e.sources[0].sourceVersion.includes('0.04'));assert.equal(e.selected.observation.depth,e.sources[0].content.depthMD_m);});
  }else{
    check('Downloaded condition source reproduces query and has budget in version',()=>{const s=e.sources[0].content,x=e.query.x;assert.equal(s.conditions.strengthIndex,x[0]);assert.equal(s.conditions.sandRisk,x[1]);assert.equal(s.conditions.temperature_C,x[5]);assert.ok(Math.abs(Math.log10(s.conditions.permeability_mD)-x[4])<1e-12);assert.equal(s.budget,91);assert.ok(e.sources[0].sourceVersion.includes('budget=91'));});
    check('Downloaded final ranking respects the exported constraints and preference',()=>{const p=e.query,params=e.runConfig.parameters;for(const c of p.candidates){assert.equal(JSON.stringify(c.reasons),JSON.stringify(context.CO1Engine.reasons(p.x,c,params.budget)));assert.ok(Math.abs(c.utility-(c.expectedResponse-params.costWeight*c.cost))<1e-12);}const best=p.candidates.filter(c=>!c.reasons.length).sort((a,b)=>b.utility-a.utility)[0];assert.equal(p.recommendation,best.index);});
  }
}
const report={kind:'Checks of bytes actually downloaded through the browser',checkedAt:new Date().toISOString(),checks,counts:{passed:checks.length,failed:0}};
fs.writeFileSync(path.join(import.meta.dirname,'browser-evidence-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
