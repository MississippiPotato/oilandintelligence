// Validate saved browser evidence against current files. This does not run a browser.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import vm from 'node:vm';import assert from 'node:assert/strict';
import {assistantJS,assistantCSS} from '../tools/assistant-bundle.mjs';
const root=path.resolve(import.meta.dirname,'..'),dir='handoff/illustrated-background-2026-10-24/',prior='handoff/expansion-2026-10-24/',read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=p=>hash(read(p));
const r={checkedAt:new Date().toISOString(),version:json('package.json').version,scope:'File locks and saved actual browser evidence for the illustrated-background revision',browserExecutedByThisCommand:false,checks:[]};
const ok=(name,value,detail)=>{assert.ok(value,name);r.checks.push({name,passed:true,detail});};
const original=json('handoff/original-lock.json');
for(const f of original.files)for(const folder of [original.source,'portal-original'])assert.equal(sha(folder+'/'+f.path),f.sha256);
for(const name of ['case-upload.js','case-demo-host.js','registry.js','admin.js'])assert.equal(sha('portal/assets/core/'+name),sha('portal-original/assets/core/'+name));
for(const name of ['welllog-layer.case.js','welllog-layer.demo.js'])assert.equal(sha('portal/assets/cases/'+name),sha('portal-original/assets/cases/'+name));
ok('teacher originals, readonly copy and native import contract are preserved',original.files.length===23,{originalAndCopyFiles:46,contractFiles:4,teacherSampleFiles:2});
const protectedFiles=json(prior+'protected-algorithms.json'),baseline=json(dir+'baseline.json');
for(const f of [...protectedFiles.priorFiveFiles,...protectedFiles.newEngineFiles,...baseline.frozen])assert.equal(sha(f.path),f.sha256,f.path);
ok('the change preserves all model/data bytes, 12 added packages and the compact assistant',true,{previousCommit:baseline.commit,modelAndDataFiles:27,frozenFiles:baseline.frozen.length});
const five=json('handoff/suite-build-lock.json'),extra=json(prior+'build-lock.json'),accepted=json(dir+'accepted-five-files.json');
for(const f of accepted.readingSources)assert.equal(sha(f.path),f.sha256,f.path);
for(const c of accepted.cases)for(const f of c.files)assert.equal(sha('dist/cases/'+c.caseId+'/'+f.path),f.sha256);
assert.equal(five.version,'1.4.1');assert.equal(five.caseCount,5);assert.equal(extra.actualCount,12);assert.equal(extra.complete,true);
for(const [suite,prefix,mandatory]of [[five,'dist/cases/',true],[extra,'dist/expansion-cases/',false]])for(const c of suite.cases){assert.equal(c.files.length,5);for(const f of c.files)assert.equal(sha(f.path.startsWith('dist/')?f.path:prefix+c.caseId+'/'+f.path),f.sha256);const js=read(prefix+c.caseId+'/demo/demo.js').toString(),css=read(prefix+c.caseId+'/demo/demo.css').toString();new vm.Script(js);assert.ok(js.endsWith(assistantJS()));assert.ok(css.endsWith(assistantCSS({readability:mandatory})));}
ok('85 runtime files match the current five plus unchanged twelve build locks',true,{mandatoryVersion:five.version,extraVersion:'1.0.0',selfAuthoredCases:17,totalBytes:five.totalBytes+extra.totalBytes});
const knowledgeFiles=['shared/mudlogging-diagrams.js','shared/mudlogging-knowledge.js'];
assert.equal(sha('portal/assets/s17-mudlogging-knowledge.js'),hash(Buffer.from(knowledgeFiles.map(p=>read(p).toString()).join('\n'))));
let figureCount=0;
for(const c of five.cases){const sections=json('dist/cases/'+c.caseId+'/case.json').tabs.background.sections;assert.equal(sections.length,4);assert.equal(sections[0].en,'FOUNDATION');assert.ok(sections.every(s=>s.html.includes('knowledge-text')));for(const s of sections.slice(0,3)){assert.ok(s.html.includes('data-knowledge-figure='));assert.ok(s.html.includes('读图：'));}figureCount+=sections.reduce((n,s)=>n+(s.html.match(/data-knowledge-figure=/g)||[]).length,0);}
ok('16 inline teaching figures are interleaved with explanations and read-the-figure captions',figureCount===16,{chaptersPerCase:4,figures:figureCount,sourceFiles:knowledgeFiles});
r.browserReports=['browser-standalone.json','browser-original.json','browser-enhanced.json','browser-legacy.json','browser-restart.json'].map(name=>{const file=dir+name,b=json(file);assert.equal(b.failed,0,file);for(const field of ['errors','external','http'])assert.equal(b[field]?.length??0,0,file);assert.ok(Date.parse(b.checkedAt)>=Date.parse(accepted.createdAt),file+' predates final mandatory build');return{file,scope:b.scope,passed:b.passed,checkedAt:b.checkedAt};});
ok('current actual-browser reports pass for offline, original import, enhanced reader, old package and restart',true,r.browserReports);
const current=json(dir+'browser-original.json'),restart=json(dir+'browser-restart.json'),standalone=json(dir+'browser-standalone.json');
assert.equal(current.persisted.count,17);assert.equal(restart.registered.length,17);
for(const c of five.cases)assert.ok(restart.registered.some(x=>x.id===c.caseId&&x.version===c.version));
ok('all 17 packages persist after real original UI import and whole browser restart',true,{originalStorageCharacters:current.persisted.storageCharacters,currentMandatoryVersion:five.version,extraVersion:'1.0.0'});
const previous=json('handoff/assistant-ui-2026-10-23/browser-original.json');
for(const report of [current,restart,standalone]){assert.equal(report.cases.length,5);for(const c of report.cases)assert.deepEqual(c.metrics,previous.cases.find(x=>x.id===c.id).metrics);}
ok('each mandatory case computes the same default metrics in all three current browser runs',true,{comparedRuns:15,baselineCaseVersion:'1.4.0'});
r.exports=[];
for(const c of [...five.cases,...extra.cases]){const file='output/exports/'+(c.version===five.version?'v1.4.1/':'v1.7/')+c.sceneId+'-original.json',e=json(file);assert.equal(e.caseId,c.caseId);assert.equal(e.caseVersion,c.version);assert.ok(e.schemaVersion&&e.datasetId&&e.runId&&e.runConfig);assert.ok(e.sources?.length&&Array.isArray(e.claims));for(const claim of e.claims)for(const ref of claim.sourceRefs??[]){assert.ok(e.sources.some(s=>s.sourceRecordId===ref.sourceRecordId&&s.sourceVersion===ref.sourceVersion));assert.ok(ref.selector&&typeof ref.selector==='object');}r.exports.push({file,caseId:e.caseId,caseVersion:e.caseVersion,sha256:sha(file),bytes:read(file).length});}
ok('current downloaded evidence retains identity, version and specific source references',r.exports.length===17,{currentFiveDownloads:5,unchangedExtraDownloads:12,validationKind:'Node checks actual downloaded bytes, not browser assertions'});
const oldPackage=json(dir+'previous-package-lock.json');r.previousArchives={verified:[],notIncludedInCheckoutOrTransport:[]};for(const a of oldPackage.archives){if(fs.existsSync(path.join(root,a.path))){assert.equal(sha(a.path),a.sha256);r.previousArchives.verified.push(a.path);}else r.previousArchives.notIncludedInCheckoutOrTransport.push(a.path);}
ok('available historical archives retain bytes; local-only transport archives are recorded separately',true,r.previousArchives);
r.previousReleaseBrowserEvidence={file:prior+'browser-summary.json',scope:'Earlier 1.7 release browser evidence; the twelve runtime packages remain byte-identical',rawChecks:json(prior+'browser-summary.json').browserPassed,countsAddedToCurrent:false};
r.runtimeFiles=[...five.cases.flatMap(c=>c.files.map(f=>({path:'dist/cases/'+c.caseId+'/'+f.path,sha256:f.sha256}))),...extra.cases.flatMap(c=>c.files.map(f=>({path:f.path,sha256:f.sha256})))];
r.newPaidModelCalls=0;r.unverified=['Other browser engines and physical mobile devices','Physical microphone and listening quality','Independent public redistribution permission for the Diana Live2D asset'];r.passed=r.checks.length;r.failed=0;
fs.writeFileSync(path.join(root,dir+'verification.json'),JSON.stringify(r,null,2));
console.log(JSON.stringify({version:r.version,fileAndEvidenceChecks:r.passed,runtimeFiles:r.runtimeFiles.length,inlineTeachingFigures:figureCount,browserReports:r.browserReports.map(x=>({file:x.file,passed:x.passed})),previousBrowserCountsAdded:false},null,2));
