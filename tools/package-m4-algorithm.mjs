import fs from 'node:fs';import {execFileSync}from'node:child_process';import crypto from 'node:crypto';import vm from 'node:vm';
const report='handoff/m4-algorithm-m1-materials-2026-11-03',build=JSON.parse(fs.readFileSync(report+'/build.json','utf8')),walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const py=`import sys,json,zipfile,os,hashlib
target=sys.argv[1];pairs=json.loads(sys.stdin.buffer.read().decode('utf8'))
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for source,entry in pairs:z.write(source,entry)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
print(len(pairs))`;
const packages=[];function zip(p,pairs,scope){const members=Number(execFileSync('python',['-X','utf8','-c',py,p],{input:JSON.stringify(pairs),encoding:'utf8',windowsHide:true}));packages.push({path:p,bytes:fs.statSync(p).size,members,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),scope,CRCVerified:true});}
const runtime=['case.json','README.txt','demo/index.html','demo/demo.css','demo/demo.js'],entry=id=>runtime.map(p=>['dist/cases/'+id+'/'+p,id+'/'+p]);
for(const c of build.cases)zip('dist/'+c.caseId+'-1.13.0.zip',entry(c.caseId),'Updated independent five-file case');
const five=['s17-cuttings-lithology','s17-mudgas-context','s17-fluorescence-review','s17-drilltime-boundaries','s17-evidence-report'];zip('dist/s17-mudlogging-five-2026-11-03-m4-algorithm.zip',five.flatMap(entry),'M1 M2 M4 1.13.0; M3 M5 unchanged1.12.0');
const box={};box.window=box;vm.runInNewContext(fs.readFileSync('portal/assets/s17-case-catalog.js','utf8'),box);const chunks=new Set([...box.S17CaseCatalog.cases,...box.S17CaseCatalog.teacherCases].map(c=>'portal/'+c.contentURL)),skip=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/')||(p.includes('/case-content/')&&!chunks.has(p));
const files=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!skip(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...walk('dist/cases'),...walk('dist/expansion-cases'),...['m1','m2','m3','m4','m5'].map(s=>'case-src/'+s+'/knowledge.md'),...walk(report).filter(p=>!p.includes('package-lock')&&!p.includes('publication')),...walk('output/playwright/m4-algorithm-2026-11-03')];
zip('dist/s17-site-1.14.1-m4-algorithm-offline.zip',[...new Set(files)].filter(p=>fs.existsSync(p)).map(p=>[p,p]),'Current full static website; no new all-case browser validation');
fs.writeFileSync(report+'/package-lock.json',JSON.stringify({at:new Date().toISOString(),packages},null,2));console.log(JSON.stringify(packages.map(p=>({path:p.path,bytes:p.bytes,members:p.members})),null,2));
