import fs from 'node:fs';import vm from 'node:vm';import {execFileSync}from'node:child_process';import {ROOT,read,write,walk,record}from'./teaching-map-contract.mjs';
process.chdir(ROOT);const report='handoff/dynamic-ai-2026-11-03',build=JSON.parse(read(report+'/build.json'));
for(const name of ['numeric-scope','browser']){const r=JSON.parse(read(report+'/'+name+'.json'));if(r.failed||!r.passed)throw Error(name+' validation missing or failed');}
for(const c of build.cases)for(const f of c.files)if(record('dist/cases/'+c.caseId+'/'+f.path).sha256!==f.sha256)throw Error('Changed since build: '+c.caseId+'/'+f.path);
const script=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];pairs=json.loads(sys.stdin.buffer.read().decode('utf8'))
assert len({e for _,e in pairs})==len(pairs)
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for source,entry in pairs:z.write(os.path.join(root,source),entry)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for source,entry in pairs:assert hashlib.sha256(z.read(entry)).digest()==hashlib.sha256(open(os.path.join(root,source),'rb').read()).digest()
print(len(pairs))`;
const packages=[];function zip(out,pairs,scope){const members=Number(execFileSync('python',['-X','utf8','-c',script,ROOT,out],{input:JSON.stringify(pairs),encoding:'utf8',windowsHide:true}));packages.push({...record(out),members,scope,allMemberHashesAndCRCVerified:true});}
const entries=c=>c.files.map(f=>['dist/cases/'+c.caseId+'/'+f.path,c.caseId+'/'+f.path]);for(const c of build.cases)zip('dist/'+c.caseId+'-1.12.0.zip',entries(c),'Self-contained five-file case');zip('dist/s17-mudlogging-five-1.12.0.zip',build.cases.flatMap(entries),'Five cases, 25 contract files');
const box={};box.window=box;vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),box);const chunks=new Set([...box.S17CaseCatalog.cases,...box.S17CaseCatalog.teacherCases].map(c=>'portal/'+c.contentURL));
const skip=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/')||(p.includes('/case-content/')&&!chunks.has(p));
write(report+'/离线使用.txt','解压后打开 index.html。录井五例自动载入并分析示例；输入、处理摘要、结果连续显示。M2提供实际加权kNN近邻、距离、票重及支持度。可更换文件并保存当前结果。\n老师原站添加案例请选择解压后的完整单例目录，各例仍为5文件；ZIP须先解压。\n在线问答需要模型服务，计算与本地导航不依赖在线模型。完整网站含共享Live2D资源；单例五文件不重复嵌入模型，缺少共享模型时显示备用头像。\n本轮实际浏览器验证与未验收边界见 实施与验收.md；没有用源码检查替代浏览器通过。\n');
const files=['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!skip(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...walk('dist/cases'),...walk('dist/expansion-cases'),...['m1','m2','m3','m4','m5'].map(s=>'case-src/'+s+'/knowledge.md'),...walk(report).filter(p=>!p.endsWith('package-lock.json')&&!p.includes('publication')),...walk('output/playwright/dynamic-ai-2026-11-03').filter(p=>p.endsWith('.jpg'))];
zip('dist/s17-site-1.14.0-mudlogging-1.12.0-offline.zip',[...new Set(files)].map(p=>[p,p]).concat([[report+'/离线使用.txt','使用说明.txt']]),'Complete current static site with shared local assets');write(report+'/package-lock.json',{at:new Date().toISOString(),packages});console.log(JSON.stringify(packages.map(p=>({path:p.path,bytes:p.bytes,members:p.members})),null,2));
