import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {ROOT,read,write,record,walk} from './teaching-map-contract.mjs';
process.chdir(ROOT);
const REPORT='handoff/mudlogging-workbench-2026-11-03';
for(const name of ['numeric','scope','browser']){const r=JSON.parse(read(REPORT+'/'+name+'.json'));if(r.failed||!r.passed)throw Error(name+' checks not completed or failed');}
const build=JSON.parse(read(REPORT+'/build.json'));
for(const c of build.cases)for(const f of c.files){const p='dist/cases/'+c.caseId+'/'+f.path;if(record(p).sha256!==f.sha256)throw Error('Artifact changed after build: '+p);}
const python=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];pairs=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len({e for _,e in pairs})==len(pairs)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for source,entry in pairs:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for source,entry in pairs:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(pairs))`;
const packages=[];
function zip(out,pairs,scope){const n=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(pairs),encoding:'utf8',windowsHide:true}).trim());packages.push({...record(out),members:n,scope,crcAndAllMemberHashesVerified:true});}
const caseEntries=c=>c.files.map(f=>['dist/cases/'+c.caseId+'/'+f.path,c.caseId+'/'+f.path]);
for(const c of build.cases)zip('dist/'+c.caseId+'-1.11.0.zip',caseEntries(c),'One self-contained five-file mudlogging case');
zip('dist/s17-mudlogging-five-1.11.0.zip',build.cases.flatMap(caseEntries),'Five cases,25 contract files');
const context={};context.window=context;vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),context);
const chunks=new Set([...context.S17CaseCatalog.cases,...context.S17CaseCatalog.teacherCases].map(c=>'portal/'+c.contentURL));
const unused=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/')||(p.includes('/case-content/')&&!chunks.has(p));
write(REPORT+'/离线使用.txt','解压后打开index.html。录井五例为1.11.0：先加载示例或导入配套文件，再运行处理并交互查看结果。下载的配套样本不含评价真值。\n五个独立目录仍各5文件；老师原站添加案例选择完整解压目录，ZIP请先解压。\n原站专业背景与流程为静态讲义，完整计算在可运行示范中运行。\n本轮未改首页、助手、其他60例和老师原站文件。\n浏览器已完成的项目与file://未验收边界，见同目录实施与验收.md。\n');
const files=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!unused(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...walk('dist/cases'),...walk('dist/expansion-cases'),...['m1','m2','m3','m4','m5'].map(s=>'case-src/'+s+'/knowledge.md'),...walk(REPORT).filter(p=>!p.endsWith('/package-lock.json')&&!p.includes('/publication')),...walk('output/playwright/mudlogging-workbench-2026-11-03').filter(p=>p.endsWith('.jpg'))];
zip('dist/s17-site-1.13.1-workbench-1.11.0-offline.zip',[...new Set(files)].map(p=>[p,p]).concat([[REPORT+'/离线使用.txt','使用说明.txt']]),'Complete current offline site; five cases upgraded, other60 retained');
write(REPORT+'/package-lock.json',{createdAt:new Date().toISOString(),packages});
console.log(JSON.stringify(packages.map(p=>({path:p.path,bytes:p.bytes,members:p.members})),null,2));
