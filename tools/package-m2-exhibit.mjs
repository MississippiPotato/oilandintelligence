import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),dir='handoff/m2-exhibit-2026-10-28',id='s17-mudgas-context',out='dist/'+id+'-1.7.0.zip',walk=p=>fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(p+'/'+d.name):[p+'/'+d.name]);
const python=`import sys,json,zipfile,hashlib,os
root,target=sys.argv[1:3]
items=json.load(sys.stdin)
with zipfile.ZipFile(os.path.join(root,target),'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for source,entry in items:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,target)) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(v[1] for v in items)
 for source,entry in items:
  assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(items))
`;
const runtime=walk('dist/cases/'+id).map(p=>[p,p.slice('dist/cases/'.length)]);if(runtime.length!==5)throw Error('Expected exactly five original-portal files');execFileSync('python',['-c',python,root,out],{input:JSON.stringify(runtime),encoding:'utf8',windowsHide:true});
const review='dist/s17-m2-exhibit-1.7.0-review.zip',items=[...runtime.map(([p])=>[p,p]),...walk(dir).filter(p=>!p.endsWith('/package-lock.json')).map(p=>[p,p]),...['case-src/m2/knowledge.md','case-src/m2/assets/prompts.json','case-src/m2/assets/scroll-a.png','case-src/m2/assets/scroll-b.png','case-src/m2/assets/scroll-selected.jpg'].map(p=>[p,p])];execFileSync('python',['-c',python,root,review],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true});
const files=[out,review].map(p=>{const b=fs.readFileSync(path.join(root,p));return {path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});fs.writeFileSync(path.join(root,dir,'package-lock.json'),JSON.stringify({createdAt:new Date().toISOString(),runtimeFiles:5,crcAndMemberHashesVerified:true,files},null,2));console.log(JSON.stringify({files},null,2));
