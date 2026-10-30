import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);const report='handoff/assistant-stream-2026-10-30',lock=JSON.parse(fs.readFileSync(report+'/runtime-lock.json','utf8'));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const python=`import os,sys,json,zipfile,hashlib
root,out=sys.argv[1:3];items=json.loads(sys.stdin.buffer.read().decode('utf-8'))
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for source,entry in items:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(items)
 for source,entry in items:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(items))`;
const runtime=lock.cases.flatMap(c=>c.files.map(f=>[c.path+'/'+f.path,c.id+'/'+f.path])),site=['index.html','.nojekyll','data/real/CALCITE-ATTRIBUTION.txt',...walk('portal'),...walk('portal-original'),...lock.cases.flatMap(c=>c.files.map(f=>c.path+'/'+f.path))].map(p=>[p,p]);
const packages=[];for(const [out,items]of [['dist/s17-all-61-assistant-0.7.0.zip',runtime],['dist/s17-site-assistant-0.7.0.zip',site]]){const count=Number(execFileSync('python',['-X','utf8','-c',python,root,out],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true}).trim()),bytes=fs.readFileSync(out);packages.push({path:out,members:count,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),crcAndEveryMemberSHA256Verified:true});}
fs.writeFileSync(report+'/package-lock.json',JSON.stringify({createdAt:new Date().toISOString(),packages},null,2));console.log(JSON.stringify(packages,null,2));
