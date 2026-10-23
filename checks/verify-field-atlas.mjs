import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..'),folder='handoff/field-atlas-2026-10-23';
const read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),hash=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const report={createdAt:new Date().toISOString(),portalVersion:json('package.json').version,caseVersion:json('handoff/suite-build-lock.json').version,checks:[],scope:'File checks are separate from actual browser UI checks; no model result or industrial accuracy claim.'};
function check(name,passed,detail){report.checks.push({name,passed,detail});if(!passed)throw Error(name);}
const original=json('handoff/original-lock.json');let originals=0;
for(const f of original.files)for(const dir of [original.source,'portal-original']){if(hash(dir+'/'+f.path)!==f.sha256)throw Error('Teacher original mismatch '+dir+'/'+f.path);originals++;}
check('both teacher trees match the locked original',originals===46,{files:originals,readOnlyCopyFilesConfirmedByPowerShell:23});
const modules=['case-upload.js','case-demo-host.js','registry.js','admin.js'];
check('enhanced portal retains all four teacher compatibility modules byte for byte',modules.every(n=>hash('portal/assets/core/'+n)===hash('portal-original/assets/core/'+n)),modules);
const suite=json('handoff/suite-build-lock.json');let builds=0;
for(const c of suite.cases)for(const f of c.files){if(hash('dist/cases/'+c.caseId+'/'+f.path)!==f.sha256)throw Error('Case changed '+c.caseId+'/'+f.path);builds++;}
check('all five case build files retain version 1.2.0 and locked hashes',builds===25&&suite.version==='1.2.0',{files:builds});
const before=json(folder+'/before/package-lock.json');
const archives=before.archives.filter(a=>a.path.includes('cases-only')||a.path.includes('1.4.0-preview'));
check('previous complete and five-case archives are preserved',archives.length===2&&archives.every(a=>hash(a.path)===a.sha256),archives.map(a=>({path:a.path,sha256:a.sha256})));
for(const p of ['portal/assets/s17-field-atlas.js','portal/assets/s17-home.js'])new vm.Script(read(p).toString(),{filename:p});
check('new homepage JavaScript syntax parses',true);
const browser=json(folder+'/browser.json');check('actual browser report completed without failed checks',browser.failed===0&&browser.passed>=35&&browser.errors.length===0,{passed:browser.passed,failed:browser.failed,checkedAt:browser.checkedAt,report:folder+'/browser.json'});
check('m2 actual refreshed calculation contains metrics and model scores',!!browser.rerunMetrics?.model&&Object.keys(browser.rerunMetrics.model).length>0,browser.rerunMetrics);
report.files=['portal/index.html','portal/assets/s17-home.js','portal/assets/s17-field-atlas.js','portal/assets/s17-field-atlas.css'].map(p=>({path:p,bytes:read(p).length,sha256:hash(p)}));
report.unverified=['No field validation of the ideal fluid transport illustration','No physical mobile device or additional browser engine tested','No new cloud model or speech call performed','Existing Live2D public redistribution permission remains unverified'];
report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.filter(c=>!c.passed).length;
fs.writeFileSync(path.join(root,folder,'verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
