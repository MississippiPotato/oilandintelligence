import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),dir='handoff/home-and-five-refinement-2026-10-29';process.chdir(root);
const read=p=>fs.readFileSync(p,'utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),record=p=>({path:p,bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))});
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]).sort();
const checks=[],ok=(name,value,detail)=>{checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
const before=JSON.parse(read('handoff/expansion-lessons-2026-10-29/before.json'));
const frozen=JSON.parse(read('handoff/four-exhibits-2026-10-29/before.json'));
const protectedRecords=[...new Map([...before.protectedFiles,...frozen.protectedFiles,...frozen.sourceDataFiles].filter(f=>f.path.startsWith('portal-original/')||f.path.startsWith('石油勘探开发智能化案例集/')||f.path.startsWith('data/real/')).map(f=>[f.path,f])).values()];
for(const f of protectedRecords)ok('original/material '+f.path,sha(fs.readFileSync(f.path))===f.sha256);
const engines=[...before.engineFiles.filter(f=>f.path.endsWith('/engine.js')),...frozen.engineFiles,...frozen.sourceDataFiles.filter(f=>f.path.startsWith('case-src/'))];
for(const f of new Map(engines.map(f=>[f.path,f])).values())ok('unchanged computation/data '+f.path,sha(fs.readFileSync(f.path))===f.sha256);
const changed=execFileSync('git',['diff','--name-only','e538d91','--','portal/assets/core','portal-original','石油勘探开发智能化案例集','handoff/four-exhibits-2026-10-29','handoff/m2-clarity-2026-10-28','handoff/expansion-lessons-2026-10-29'],{encoding:'utf8'}).trim();
ok('Original upload contract and historical acceptance files unchanged',changed==='',{changed});
const mandatory=['case.json','README.txt','demo/demo.css','demo/demo.js','demo/index.html'].sort(),outputs=[];
for(const base of ['dist/cases','dist/expansion-cases'])for(const id of fs.readdirSync(base)){
 const folder=base+'/'+id,m=JSON.parse(read(folder+'/case.json')),files=walk(folder);outputs.push({id,scene:m.sceneId,version:m.version,files:files.map(record)});
 ok(id+' exact original five-file directory',JSON.stringify(files.map(p=>p.slice(folder.length+1)))===JSON.stringify(mandatory));
 ok(id+' current version',m.version===(base==='dist/cases'?'1.8.0':'1.1.1'));
 ok(id+' upload limit and three sections',files.reduce((n,p)=>n+fs.statSync(p).size,0)<6*1024*1024&&['background','workflow','demo'].every(k=>m.tabs[k]));
 new vm.Script(read(folder+'/demo/demo.js'),{filename:folder+'/demo/demo.js'});ok(id+' ordinary script parses',true);
 ok(id+' manifest has no executable code',!/<script\b|\bon\w+\s*=|javascript\s*:/i.test(JSON.stringify(m)));
 ok(id+' specified defensive prose removed',!['未知图例保留复核参考仅用于评价','这里用真实照片认识观察线索，主演示使用单独生成的教学岩屑图像','新轮廓与旧区域相交，也不能据此认定是原来那一粒','照片没有测到隐藏部分、厚度和密度，直接保留这两个口径'].some(t=>JSON.stringify(m).includes(t)));
 const html=read(folder+'/demo/index.html');ok(id+' no remote auto-loaded HTML resources',!/<(?:script|link|img|source)\b[^>]+(?:src|href)\s*=\s*["']https?:/i.test(html));
}
ok('61 unique scenes and 305 runtime files',outputs.length===61&&new Set(outputs.map(c=>c.scene)).size===61&&outputs.flatMap(c=>c.files).length===305);
for(const f of JSON.parse(read(dir+'/five-runtime-lock.json')).files)ok('five runtime lock '+f.path,sha(fs.readFileSync(f.path))===f.sha256);
const browserNames=['core','mobile','offline','import','portal','samples','home'],browser=[];
for(const n of process.argv.includes('--source-only')?[]:browserNames){const p=dir+'/browser-'+n+'.json';if(!fs.existsSync(p))throw Error('Missing actual browser evidence '+p);const r=JSON.parse(read(p));ok('actual browser protocol '+n,r.failed===0&&r.errors.length===0,{passed:r.passed,failed:r.failed});browser.push({name:n,passed:r.passed,failed:r.failed,report:p});}
const downloads=walk(dir+'/downloads').filter(p=>p.endsWith('.json'));
for(const p of process.argv.includes('--source-only')?[]:downloads){const r=JSON.parse(read(p));ok('actual JSON download '+p,r.schemaVersion==='1.0'&&r.caseVersion==='1.8.0'&&!!r.runId&&Array.isArray(r.sources)&&r.sources.length>0);}
if(!process.argv.includes('--source-only'))ok('Five cases each actually saved on desktop, offline and original portal refresh',downloads.length===15);
const screenshots=walk(dir).filter(p=>p.endsWith('.png')&&!p.includes('/attempts/'));
const out={checkedAt:new Date().toISOString(),scope:process.argv.includes('--source-only')?'Source syntax, protected-byte and five-file package checks only; no browser operations.':'Current source, protected-byte, package-contract and saved actual browser evidence checks. Not a rerun of all 61 browser paths.',passed:checks.filter(c=>c.passed).length,failed:0,cases:outputs.length,runtimeFiles:305,protectedOriginalAndDataFiles:protectedRecords.length,calculationFilesCompared:new Set(engines.map(f=>f.path)).size,browserPassed:browser.reduce((n,b)=>n+b.passed,0),browser,downloadFiles:downloads.map(record),screenshots:screenshots.map(record),full61BrowserAcceptanceClaimed:false,checks,casesFiles:outputs};
fs.writeFileSync(dir+(process.argv.includes('--source-only')?'/source-checks.json':'/verification.json'),JSON.stringify(out,null,2));if(!process.argv.includes('--source-only'))fs.writeFileSync(dir+'/runtime-lock.json',JSON.stringify({builtAt:new Date().toISOString(),cases:outputs,portalSources:['portal/index.html','portal/assets/s17-home.js','portal/assets/s17-overview.css','portal/assets/s17-catalog.js','portal/assets/s17-course.js','portal/assets/s17-reader.js','portal/assets/s17-mudlogging-knowledge.js','portal/assets/s17-expansion-cases.js'].map(record)},null,2));
console.log(JSON.stringify({...out,checks:undefined,casesFiles:undefined,downloadFiles:out.downloadFiles.length,screenshots:out.screenshots.length},null,2));
