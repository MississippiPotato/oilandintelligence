import {execFileSync} from 'node:child_process';
import {ROOT,REPORT,read,write,record,walk} from './teaching-map-contract.mjs';
process.chdir(ROOT);
const runtime=JSON.parse(read(REPORT+'/runtime-lock.json')),checks=JSON.parse(read(REPORT+'/source-checks.json'));
if(checks.failed)throw Error('Source checks failed');
for(const name of ['m1','m2','m3','m4','m5','d1','global','search','loader','offline-stage','stage','samples','import'])if(JSON.parse(read(REPORT+'/browser-'+name+'.json')).failed)throw Error('Browser check fails: '+name);
for(const c of runtime.cases)for(const f of c.files)if(record(f.path).sha256!==f.sha256)throw Error('Changed after source check: '+f.path);
const packages=[],python=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];pairs=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len({e for _,e in pairs})==len(pairs)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for source,entry in pairs:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for source,entry in pairs:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(pairs))`;
function zip(out,pairs,scope){const n=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(pairs),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members:n,scope,crcAndAllMemberHashesVerified:true});}
const caseEntries=c=>c.files.map(f=>[f.path,c.id+'/'+f.path.slice(f.path.indexOf(c.id)+c.id.length+1)]);
for(const c of runtime.cases.filter(c=>/^m[1-5]$/.test(c.scene)||c.scene==='d1'))zip('dist/'+c.id+'-'+c.version+'.zip',caseEntries(c),'One five-file case');
zip('dist/s17-all-65-cases-1.13.0.zip',runtime.cases.flatMap(caseEntries),'65 authored cases,325 contract files');
const catalog={};catalog.window=catalog;const {default:vm}=await import('node:vm');vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),catalog);
const chunks=new Set([...catalog.S17CaseCatalog.cases,...catalog.S17CaseCatalog.teacherCases].map(c=>'portal/'+c.contentURL));
const unused=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/')||(p.includes('/case-content/')&&!chunks.has(p));
const files=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!unused(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...runtime.cases.flatMap(c=>c.files.map(f=>f.path)),...['m1','m2','m3','m4','m5'].map(s=>'case-src/'+s+'/knowledge.md'),'expansion-src/d1/knowledge.md',...walk(REPORT).filter(p=>!p.includes('/attempts/')&&!p.endsWith('/package-lock.json')&&!p.includes('/publication')),...walk('output/playwright').filter(p=>/\/teaching-map-[^/]+\.png$/.test(p))];
write(REPORT+'/离线使用.txt','解压后打开 index.html。十三阶段、65例、录井3D、知识检索与Live2D均使用本地资源。\n独立案例位于dist/cases与dist/expansion-cases，每例保留五文件；老师原站在portal-original/index.html。\n教师原站添加案例时选择解压后的单例完整目录；按例导入和刷新验收，未声称原站能同时保存65例。\n默认教学无需网络。在线对话沿用现有可选连接，Key只在当前页面内存中填写。\n本轮验收与截图在handoff/teaching-map-2026-11-01。\n');
zip('dist/s17-site-1.13.0-offline.zip',[...new Set(files)].map(p=>[p,p]).concat([[REPORT+'/离线使用.txt','使用说明.txt']]),'Complete current offline site and evidence; obsolete chunks excluded');
write(REPORT+'/package-lock.json',{createdAt:new Date().toISOString(),packages});console.log(JSON.stringify(packages.map(p=>({path:p.path,bytes:p.bytes,members:p.members})),null,2));
