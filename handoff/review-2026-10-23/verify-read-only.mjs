import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const records=[],mismatches=[];
function verify(file,expected,group){
  const b=fs.readFileSync(path.join(root,file));
  const actual=hash(b),ok=actual===expected;
  records.push({path:file,group,bytes:b.length,sha256:actual,matchesPreReviewLock:ok});
  if(!ok)mismatches.push({path:file,expected,actual});
}
for(const c of read('handoff/suite-build-lock.json').cases)for(const f of c.files)verify(`dist/cases/${c.caseId}/${f.path}`,f.sha256,'five case build');
const original=read('handoff/original-lock.json');
for(const dir of ['portal-original','石油勘探开发智能化案例集'])for(const f of original.files)verify(`${dir}/${f.path}`,f.sha256,'teacher originals');
for(const f of read('handoff/assistant-delivery-verification.json').files)verify(f.path,f.sha256,'portal recorded files');
for(const f of read('handoff/assistant-assets-lock.json').records)verify(f.path,f.sha256,'local avatar dependencies');
for(const file of ['assets/core/case-upload.js','assets/core/case-demo-host.js','assets/core/registry.js','assets/core/admin.js'])verify(`portal/${file}`,original.files.find(f=>f.path===file).sha256,'working portal original contract');
const teacher='石油勘探开发的智能化可能性地图-全网站设计.txt';
verify(teacher,read('handoff/review-2026-10-23/input-snapshot.json').teacherRequirementSha256,'teacher requirement');
const summary={checkedAt:new Date().toISOString(),scope:'Source and build SHA256 reconciliation against locks written before this review; not browser acceptance',productEditsThisReview:0,checkedFiles:records.length,mismatches,records};
fs.writeFileSync(path.join(import.meta.dirname,'post-review-integrity.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({checkedFiles:records.length,mismatches:mismatches.length,productEditsThisReview:0},null,2));
if(mismatches.length)process.exitCode=1;
