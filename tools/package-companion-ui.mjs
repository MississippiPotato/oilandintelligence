import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT,record,walk,read,write} from './site-upgrade-contract.mjs';
process.chdir(ROOT);
const report='handoff/companion-ui-2026-11-01';
for(const file of ['browser.json','compatibility.json','browser-scroll.json','source-checks.json'])if(JSON.parse(read(report+'/'+file)).failed)throw Error('A required record fails: '+file);
const build=JSON.parse(read(report+'/build.json'));
for(const c of build.cases)for(const f of c.files)if(record(f.path).sha256!==f.sha256)throw Error('Case changed after the recorded build: '+f.path);
const python=`import zipfile,sys,json,os,hashlib
root,out=sys.argv[1:3];pairs=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len({entry for _,entry in pairs})==len(pairs)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for source,entry in pairs:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for source,entry in pairs:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(pairs))`;
const packages=[];
function zip(out,entries){const members=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(entries),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members,crcAndAllMemberHashesVerified:true});}
zip('dist/s17-all-65-cases-2026-11-01.zip',build.cases.flatMap(c=>c.files.map(f=>[f.path,c.caseId+'/'+f.path.slice(c.path.length+1)])));
const unused=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/');
const screenshots=walk('output/playwright').filter(p=>/\/companion-ui-[^/]+\.png$/.test(p));
const files=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!unused(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...build.cases.flatMap(c=>c.files.map(f=>f.path)),...walk(report).filter(p=>!p.endsWith('/package-lock.json')&&!p.includes('/publication')),...screenshots];
write(report+'/离线使用.txt','解压后打开 index.html。网站、Live2D、背景、流程和计算默认均可离线运行。\n可运行示范在门户内只显示实验区，独立打开案例则保留三部分导航。\n模型对话需由读者在页面中自行连接；Key仅保存在当前页面内存。\n老师原站位于portal-original/index.html，五文件案例在dist/cases和dist/expansion-cases。\n');
zip('dist/s17-site-2026-11-01-offline.zip',[...new Set(files)].map(p=>[p,p]).concat([[report+'/离线使用.txt','使用说明.txt']]));
write(report+'/package-lock.json',{createdAt:new Date().toISOString(),packages});
console.log(JSON.stringify(packages.map(p=>({path:p.path,bytes:p.bytes,members:p.members})),null,2));
