import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {ROOT,REPORT,FOUR,RUNTIME,record,walk,read} from './four-exhibit-contract.mjs';
const python=`import sys,json,zipfile,hashlib,os
root,target=sys.argv[1:3]
items=json.load(sys.stdin)
assert len({a[1] for a in items})==len(items)
with zipfile.ZipFile(os.path.join(root,target),'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for source,entry in items:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,target)) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(x[1] for x in items)
 for source,entry in items:
  assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(items))
`;
const all=[FOUR[0],{id:'s17-mudgas-context'},...FOUR.slice(1)],packages=[];
function zip(out,items,scope){const count=Number(execFileSync('python',['-c',python,ROOT,out],{input:JSON.stringify(items),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members:count,scope,entries:items.map(([source,entry])=>({entry,...record(source)}))});}
for(const c of FOUR)zip('dist/'+c.id+'-1.7.1.zip',RUNTIME.map(p=>['dist/cases/'+c.id+'/'+p,c.id+'/'+p]),'Single5file original-portal import directory');
const runtime=all.flatMap(c=>RUNTIME.map(p=>['dist/cases/'+c.id+'/'+p,c.id+'/'+p]));zip('dist/s17-mudlogging-cases-only-1.7.1.zip',runtime,'Current5cases including unchangedm2 /25runtime files');
const review=[...runtime.map(([p])=>[p,p]),...FOUR.flatMap(c=>['knowledge.md','assets/prompts.json','assets/scroll-selected.jpg','assets/scroll-'+JSON.parse(read('case-src/'+c.scene+'/assets/prompts.json')).selected+'.png'].map(p=>['case-src/'+c.scene+'/'+p,'case-src/'+c.scene+'/'+p])),...walk(REPORT).filter(p=>!p.endsWith('/package-lock.json')).map(p=>[p,p]),['README.md','README.md']];
zip('dist/s17-four-exhibits-1.7.1-review.zip',review,'Fourknowledge manuscripts / selectedart and prompts / current5runtime / real screenshots and evidence');
fs.writeFileSync(path.join(ROOT,REPORT,'package-lock.json'),JSON.stringify({createdAt:new Date().toISOString(),crcAndMemberSHA256Verified:true,packages},null,2));console.log(JSON.stringify(packages.map(({path,bytes,members,sha256})=>({path,bytes,members,sha256})),null,2));
