import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ROOT,REPORT,VARIANTS,read,write,walk,record} from './site-upgrade-contract.mjs';
process.chdir(ROOT);
const lock=JSON.parse(read(REPORT+'/runtime-lock.json')),accept=JSON.parse(read(REPORT+'/acceptance.json'));
if(accept.browser.failed)throw Error('Required browser acceptance is failing');
for(const c of lock.cases)for(const f of c.files)if(record(f.path).sha256!==f.sha256)throw Error('Changed after source verification: '+f.path);
const packages=[];
const python=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];items=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len(set(e for _,e in items))==len(items)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for source,entry in items:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for source,entry in items:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(items))`;
function zip(out,items,scope){const members=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true,maxBuffer:1024*1024}).trim());packages.push({...record(out),members,scope,crcAndEveryMemberSHA256Verified:true});}
const entries=c=>c.files.map(f=>[f.path,c.id+'/'+f.path.slice(f.path.indexOf(c.id)+c.id.length+1)]);
for(const v of VARIANTS){const c=lock.cases.find(c=>c.id===v.caseId);zip('dist/'+c.id+'-'+c.version+'.zip',entries(c),'One five-file original-scene variant');}
zip('dist/s17-all-65-cases-1.12.0.zip',lock.cases.flatMap(entries),'65 authored implementations; 325 five-contract files; teacher sample separate');
const unused=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/');
const screens=walk('output/playwright').filter(p=>/\/site-upgrade-[^/]+\.png$/.test(p));
const runtime=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!unused(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...lock.cases.flatMap(c=>c.files.map(f=>f.path)),...VARIANTS.map(v=>v.source+'/knowledge.md'),...walk(REPORT).filter(p=>!p.endsWith('/package-lock.json')&&!p.endsWith('/publication.json')),...screens];
zip('dist/s17-site-1.12.0-offline.zip',[...new Set(runtime)].map(p=>[p,p]).concat([[REPORT+'/OFFLINE_README.txt','使用说明.txt']]),'Complete self-contained static site with original portal and current acceptance evidence; no CDN required for teaching');
const review=[...walk(REPORT).filter(p=>!p.endsWith('/package-lock.json')&&!p.endsWith('/publication.json')),...walk('case-variants'),...walk('case-src/mudlogging-stage'),...walk('checks/site-upgrade'),...walk('output/playwright').filter(p=>/\/site-upgrade-[^/]+\.png$/.test(p)),'tools/site-upgrade-contract.mjs','tools/build-site-upgrade.mjs','tools/build-lazy-portal.mjs','tools/build-mudlogging-3d.mjs','tools/build-case-variants.mjs','tools/measure-upgrade-perf.mjs','README.md'];
review.push('tools/check-packaged-site.mjs');
zip('dist/s17-site-upgrade-1.12.0-review.zip',[...new Set(review)].map(p=>[p,p]),'Four knowledge manuscripts, reproducible source/numerical/browser checks, real screenshots and timing records');
write(REPORT+'/package-lock.json',{createdAt:new Date().toISOString(),packages});
console.log(JSON.stringify(packages.map(p=>({path:p.path,bytes:p.bytes,members:p.members})),null,2));
