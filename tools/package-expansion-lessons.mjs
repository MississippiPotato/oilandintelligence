import fs from 'node:fs';import{execFileSync}from'node:child_process';import{ROOT,REPORT,read,write,record,walk}from'./expansion-lesson-contract.mjs';
const lock=JSON.parse(read(REPORT+'/build-lock.json')),packages=[],runtime=lock.cases.flatMap(c=>c.files.map(f=>[f.path,c.caseId+'/'+f.relative]));
const python=`import sys,json,zipfile,hashlib,os
root,target=sys.argv[1:3];items=json.load(sys.stdin)
assert len({e for _,e in items})==len(items)
with zipfile.ZipFile(os.path.join(root,target),'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for source,entry in items:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,target)) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(e for _,e in items)
 for source,entry in items:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(items))`;
function zip(out,items,scope){const n=Number(execFileSync('python',['-c',python,ROOT,out],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members:n,scope,entries:items.map(([source,entry])=>({entry,...record(source)}))});}
zip('dist/s17-expansion-56-lessons-1.1.0.zip',runtime,'Updated56 five-file directories; unzip then import one directory through the original teacher Add Case');
const five=walk('dist/cases').map(p=>[p,p.slice('dist/cases/'.length)]);zip('dist/s17-all-61-lessons-2026-10-29.zip',[...runtime,...five],'Current61 cases:56 at1.1.0 plus byte-identical mudlogging5 at1.7.1');
const review=[...lock.cases.flatMap(c=>[c.source+'/knowledge.md']),...walk(REPORT).filter(p=>!p.includes('/attempts/')&&!p.endsWith('/package-lock.json')&&!p.endsWith('/delivery-verification.json')),'tools/expansion-lesson-profiles.mjs','README.md'].map(p=>[p,p]);zip('dist/s17-expansion-lessons-2026-10-29-review.zip',review,'56knowledge manuscripts, editorial profiles, screenshots and separated actual acceptance evidence');
write(REPORT+'/package-lock.json',{createdAt:new Date().toISOString(),crcAndEveryMemberSHA256Verified:true,packages});console.log(JSON.stringify(packages.map(({path,bytes,members,sha256})=>({path,bytes,members,sha256})),null,2));
