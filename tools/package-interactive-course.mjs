import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{execFileSync}from'node:child_process';import{ROOT,REPORT,walk,record}from'./interactive-course-contract.mjs';
process.chdir(ROOT);const lock=JSON.parse(fs.readFileSync(REPORT+'/runtime-lock.json','utf8')),packages=[];
const python=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];items=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len({e for _,e in items})==len(items)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for source,entry in items:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(items)
 for source,entry in items:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(items))`;
function zip(out,items,scope){const members=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members,scope,crcAndEveryMemberSHA256Verified:true});}
const entries=c=>c.files.map(f=>[f.path,c.id+'/'+f.path.slice(f.path.indexOf(c.id)+c.id.length+1)]),five=lock.cases.filter(c=>/^m[1-5]$/.test(c.scene));
for(const c of five)zip('dist/'+c.id+'-1.9.0.zip',entries(c),'One original-contract five-file directory');
zip('dist/s17-mudlogging-five-1.9.0.zip',five.flatMap(entries),'Five current mudlogging directories');
zip('dist/s17-all-61-interactive-2026-10-30.zip',lock.cases.flatMap(entries),'61 current directories: mudlogging1.9.0, other56 at1.2.0');
const shared=['shared/course-theme.css','shared/course-compass.css','shared/course-compass.js','shared/concept-interactions.css','shared/lesson-assistant-entry.css'];
zip('dist/s17-site-interactive-2026-10-30.zip',['index.html','.nojekyll',...shared,...walk('portal'),...walk('portal-original'),...walk('data/real'),...lock.cases.flatMap(c=>c.files.map(f=>f.path))].map(p=>[p,p]),'Complete static portal, local assets, all61 and read-only teacher portal');
const review=[...walk(REPORT).filter(p=>!p.endsWith('/package-lock.json')&&!p.endsWith('.log')),...['m1','m2','m3','m4','m5'].map(s=>'case-src/'+s+'/knowledge.md'),...walk('expansion-src').filter(p=>p.endsWith('/knowledge.md')||p.endsWith('/concept.js')),...walk('output/playwright').filter(p=>/\/(?:navigation-|m5-integrated-)[^/]+\.png$/.test(p)),'README.md'];
zip('dist/s17-interactive-review-2026-10-30.zip',review.map(p=>[p,p]),'Knowledge, group reviews, actual Chrome evidence, failure attempts and source/package records');
fs.writeFileSync(REPORT+'/package-lock.json',JSON.stringify({createdAt:new Date().toISOString(),packages},null,2));console.log(JSON.stringify(packages,null,2));
