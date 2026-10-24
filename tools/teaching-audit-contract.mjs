import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,reportDir,fileRecord,walk} from './build-expansion.mjs';
export const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export const write=(p,x)=>fs.writeFileSync(path.join(root,p),JSON.stringify(x,null,2)+'\n');
export const sampleScenes=['s5','w3','c4','pr2','pr4','e3','t5','r5','m5'];
export const offlineScenes=['w3','e3','m5'];
export const groupNames=['geology-seismic','drilling-welllog','cement-completion','perforation-production','workover-eor','transport-refining','mudlogging'];
export function same(record){const {path:p,bytes,sha256}=record;assert.deepEqual(fileRecord(p),{path:p,bytes,sha256},'Changed file: '+p);}
export function currentEvidence(){
 const build=read(reportDir+'/build-lock.json'),suite=read('handoff/suite-build-lock.json');
 assert.equal(build.actualCount,56);assert.equal(build.complete,true);assert.equal(build.invalid.length,0);assert.equal(suite.caseCount,5);
 const all=[...build.cases,...suite.cases.map(c=>({...c,output:'dist/cases/'+c.caseId}))];
 assert.equal(new Set(all.map(c=>c.sceneId)).size,61);
 for(const c of all){assert.equal(walk(c.output).length,5);for(const f of c.files)same({...f,path:f.path.startsWith(c.output+'/')?f.path:c.output+'/'+f.path});for(const f of c.sourceFiles??[])same(f);}
 const baseline=read(reportDir+'/contract-before.json');baseline.files.forEach(same);
 const groups=groupNames.map(name=>({name,path:reportDir+'/'+name+'.json',report:read(reportDir+'/'+name+'.json')}));
 const reviewed=groups.flatMap(g=>g.report.cases.map(c=>c.sceneId??c.scene_id??c.scene));
 assert.equal(reviewed.length,61);assert.deepEqual([...new Set(reviewed)].sort(),all.map(c=>c.sceneId).sort());
 const summary=read(reportDir+'/review-summary.json');assert.equal(summary.scope.uniqueSceneIds,61);assert.equal(summary.scope.new44,44);
 for(const g of summary.groups)assert.equal(g.sha256,fileRecord(reportDir+'/'+g.report).sha256);
 const source=read(reportDir+'/source-verification.json'),calculation=read(reportDir+'/calculation-review.json'),fields=read(reportDir+'/mudlogging-field-fixtures.result.json');
 assert.equal(source.failed,0);assert.equal(source.actualBuiltCases,56);assert.equal(calculation.checksFailed,0);assert.equal(calculation.records.length,44);assert.equal(fields.status,'passed');
 const reports=[...sampleScenes.map(s=>'browser-'+s),...offlineScenes.map(s=>'browser-offline-'+s)].map(name=>({name,path:reportDir+'/'+name+'.json',report:read(reportDir+'/'+name+'.json')}));
 for(const {name,report:r} of reports){assert.equal(r.failed,0,name+': '+r.exception);assert.ok(!r.exception,name);assert.ok(r.checks.length>=6,name);assert.equal(r.errors.length,0);assert.equal(r.external.length,0);assert.equal(r.artifactHashesRecordedByNode.length,5);r.artifactHashesRecordedByNode.forEach(same);assert.equal(r.case.version,all.find(c=>c.sceneId===r.case.scene).version);}
 return {build,suite,all,baseline,groups,summary,source,calculation,fields,reports};
}
