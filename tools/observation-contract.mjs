import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,reportDir,fileRecord,walk} from './build-expansion.mjs';
export {root,reportDir,fileRecord,walk};
export const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export const write=(p,x)=>fs.writeFileSync(path.join(root,p),JSON.stringify(x,null,2)+'\n');
export const same=({path:p,bytes,sha256})=>assert.deepEqual(fileRecord(p),{path:p,bytes,sha256},'File changed: '+p);
export function evidence(){
 const suite=read('handoff/suite-build-lock.json'),build=read(reportDir+'/build-lock.json');
 assert.equal(suite.version,'1.6.0');assert.equal(suite.cases.length,5);assert.equal(build.actualCount,56);assert.equal(build.complete,true);assert.equal(build.invalid.length,0);
 const five=suite.cases.map(c=>({...c,output:'dist/cases/'+c.caseId})),all=[...five,...build.cases];assert.equal(new Set(all.map(c=>c.sceneId)).size,61);
 for(const c of all){assert.equal(walk(c.output).length,5);for(const f of c.files)same({...f,path:f.path.startsWith(c.output+'/')?f.path:c.output+'/'+f.path});for(const f of c.sourceFiles??[])same(f);}
 const previous=read('handoff/teaching-audit-2026-10-24/build-lock.json');let unchanged=0;
 for(const c of previous.cases)for(const f of c.files){same({...f,path:f.path.startsWith(c.output+'/')?f.path:c.output+'/'+f.path});unchanged++;}assert.equal(unchanged,280);
 const baseline=read('handoff/teaching-audit-2026-10-24/contract-before.json');baseline.files.forEach(same);
 const reports=['offline','native'].flatMap(phase=>five.map(c=>{const name='browser-'+phase+'-'+c.sceneId,r=read(reportDir+'/'+name+'.json');assert.equal(r.failed,0,name+': '+r.exception);assert.ok(!r.exception,name);assert.equal(r.errors.length,0);assert.equal(r.external.length,0);assert.ok(r.checks.length>=13,name);assert.equal(r.artifactHashesRecordedByNode.length,5);r.artifactHashesRecordedByNode.forEach(same);assert.equal(r.case.version,c.version);const download='output/playwright/observation-design-2026-10-24/'+c.sceneId+'-'+phase+'-evidence.json';const data=read(download);assert.ok(data.sources?.length>0&&data.claims?.length>0,download);return {name,path:reportDir+'/'+name+'.json',report:r,download};}));
 const compat=read(reportDir+'/browser-portal-compat.json');assert.equal(compat.failed,0);assert.equal(compat.errors.length,0);compat.artifactHashesRecordedByNode.forEach(same);
 const linkage=read(reportDir+'/browser-flow-linkage.json');assert.equal(linkage.failed,0);assert.equal(linkage.errors.length,0);assert.equal(linkage.artifactHashesRecordedByNode.length,25);linkage.artifactHashesRecordedByNode.forEach(same);
 const study=read(reportDir+'/study-calculations.json'),source=read(reportDir+'/source-verification.json'),calculation=read(reportDir+'/calculation-review.json');assert.equal(study.failed,0);assert.equal(source.failed,0);assert.equal(calculation.checksFailed,0);
 const visual=read(reportDir+'/visual-inspection.json');assert.equal(visual.inspectedScenes.length,5);visual.files.forEach(same);
 return {suite,build,five,all,unchanged,baseline,reports,compat,linkage,study,source,calculation,visual};
}
