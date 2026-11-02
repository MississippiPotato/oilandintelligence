import {execFileSync} from 'node:child_process';import vm from 'node:vm';
import {ROOT,read,write,walk,record} from './teaching-map-contract.mjs';
process.chdir(ROOT);const REPORT='handoff/teacher-update-2026-11-02',runtime=JSON.parse(read(REPORT+'/runtime-lock.json'));
for(const name of ['home','stage','archive','methods','compatibility','collection'])if(JSON.parse(read(REPORT+'/browser-'+name+'.json')).failed)throw Error('Browser checks failed: '+name);
if(JSON.parse(read(REPORT+'/source-checks.json')).failed)throw Error('Source checks failed');
for(const c of runtime.cases)for(const f of c.files)if(record(f.path).sha256!==f.sha256)throw Error('Case changed after verification: '+f.path);
const python=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];pairs=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len({e for _,e in pairs})==len(pairs)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for source,entry in pairs:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for source,entry in pairs:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(pairs))`;
const packages=[];function zip(out,pairs,scope){const members=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(pairs),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members,scope,crcAndAllMemberHashesVerified:true});}
zip('dist/s17-all-65-cases-1.13.1.zip',runtime.cases.flatMap(c=>c.files.map(f=>[f.path,c.id+'/'+f.path.slice(c.folder.length+1)])),'65 authored cases;325 unchanged-contract files');
const box={};box.window=box;vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),box);
const chunks=new Set([...box.S17CaseCatalog.cases,...box.S17CaseCatalog.teacherCases].map(c=>'portal/'+c.contentURL));
const unused=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/')||(p.includes('/case-content/')&&!chunks.has(p));
write(REPORT+'/离线使用.txt','解压后打开index.html。首页13阶段自动循环播放；录井专题默认三维井场。\n添加案例支持ZIP、文件夹和文件；ZIP合集可逐例选择、校验并保存，单例解压后上限6 MiB。\n65个案例的可运行示范包含实际方法、原理和结果对照提示。\n老师原站兼容副本位于portal-original，仍保留原有文件和目录导入。\n完整记录位于handoff/teacher-update-2026-11-02。默认演示使用本地资源。\n');
const files=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!unused(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...runtime.cases.flatMap(c=>c.files.map(f=>f.path)),...walk(REPORT).filter(p=>!p.includes('/attempts/')&&!p.includes('/fixtures/')&&!p.includes('publication')&&!p.endsWith('/package-lock.json')),...walk('output/playwright').filter(p=>/\/teacher-update-[^/]+\.png$/.test(p))];
zip('dist/s17-site-1.13.1-offline.zip',[...new Set(files)].map(p=>[p,p]).concat([[REPORT+'/离线使用.txt','使用说明.txt']]),'Current offline site,65 cases,teacher original and scoped evidence');
write(REPORT+'/package-lock.json',{createdAt:new Date().toISOString(),packages});console.log(JSON.stringify(packages,null,2));
