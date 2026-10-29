import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);const dir='handoff/home-and-five-refinement-2026-10-29',lock=JSON.parse(fs.readFileSync(dir+'/runtime-lock.json','utf8'));
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
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
const packages=[],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function zip(out,items,scope){const members=Number(execFileSync('python',['-X','utf8','-c',python,root,out],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true}).trim());const bytes=fs.readFileSync(out);packages.push({path:out,bytes:bytes.length,sha256:sha(bytes),members,scope,crcAndEveryMemberSHA256Verified:true,entries:items.map(([source,entry])=>({source,entry,sha256:sha(fs.readFileSync(source))}))});}
const entries=c=>c.files.map(f=>[f.path,c.id+'/'+f.path.slice(f.path.indexOf(c.id)+c.id.length+1)]),five=lock.cases.filter(c=>c.version==='1.8.0'),all=lock.cases.flatMap(entries);
for(const c of five)zip('dist/'+c.id+'-1.8.0.zip',entries(c),'Single five-file directory; unzip and select this directory in original teacher Add Case');
zip('dist/s17-mudlogging-five-1.8.0.zip',five.flatMap(entries),'Five current mudlogging case directories');
zip('dist/s17-all-61-refined-2026-10-30.zip',all,'Current61 directories: mudlogging5 at1.8.0; others56 at1.1.1');
const runtime=lock.cases.flatMap(c=>c.files.map(f=>f.path));
zip('dist/s17-site-refined-2026-10-30.zip',['index.html','.nojekyll','shared/lesson-assistant-entry.css',...walk('portal'),...walk('portal-original'),...walk('data/real'),...runtime].map(p=>[p,p]),'Complete static portal, current61 cases, local assistant assets, public source material and readonly original portal');
const review=[...walk(dir).filter(p=>!p.includes('/attempts/')&&!p.endsWith('/package-lock.json')),...['m1','m2','m3','m4','m5'].map(s=>'case-src/'+s+'/knowledge.md'),...fs.readdirSync('expansion-src').filter(s=>fs.existsSync('expansion-src/'+s+'/knowledge.md')).map(s=>'expansion-src/'+s+'/knowledge.md'),'README.md'];
zip('dist/s17-refinement-review-2026-10-30.zip',review.map(p=>[p,p]),'Knowledge manuscripts, source audits, actual current screenshots and separate browser protocols');
fs.writeFileSync(dir+'/package-lock.json',JSON.stringify({createdAt:new Date().toISOString(),packages},null,2));console.log(JSON.stringify(packages.map(({path,bytes,members,sha256})=>({path,bytes,members,sha256})),null,2));
