import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ROOT,REPORT,record,read,write,VARIANTS} from './site-upgrade-contract.mjs';

process.chdir(ROOT);
const browser=JSON.parse(read(REPORT+'/browser-publication.json'));
if(browser.failed)throw Error('Published browser protocol has failures');
const base='https://mississippipotato.github.io/oilandintelligence/';
const runtimeCommit=execFileSync('git',['log','-1','--format=%H','--','portal/index.html'],{encoding:'utf8',windowsHide:true}).trim();
const pages=JSON.parse(execFileSync('gh',['api','repos/MississippiPotato/oilandintelligence/pages/builds/latest'],{encoding:'utf8',windowsHide:true}));
if(pages.status!=='built')throw Error('GitHub Pages build is not ready: '+pages.status);
const paths=['index.html','portal/index.html','portal/assets/s17-case-catalog.js','portal/assets/s17-case-loader.js','portal/assets/s17-portal.min.css','portal/assets/s17-mudlogging-stage.js','portal/assets/s17-mudlogging-3d.js',...VARIANTS.flatMap(v=>['dist/expansion-cases/'+v.caseId+'/demo/demo.js','portal/assets/case-content/'+v.caseId+'.1.0.0.js'])];
const results=await Promise.allSettled(paths.map(async p=>{
 const expected=record(p),response=await fetch(base+p+'?sha='+runtimeCommit.slice(0,12),{cache:'no-store',signal:AbortSignal.timeout(45000)});
 const bytes=Buffer.from(await response.arrayBuffer()),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 return {path:p,status:response.status,bytes:bytes.length,sha256,matchesLocal:response.ok&&sha256===expected.sha256};
}));
const assets=results.map((r,i)=>r.status==='fulfilled'?r.value:{path:paths[i],error:String(r.reason),matchesLocal:false});
const report={checkedAt:new Date().toISOString(),url:base,runtimeCommit,pages:{status:pages.status,commit:pages.commit,updatedAt:pages.updated_at},browser:{file:REPORT+'/browser-publication.json',passed:browser.passed,failed:browser.failed},assets,passed:assets.every(r=>r.matchesLocal)&&!browser.failed,offlinePackage:JSON.parse(read(REPORT+'/browser-packaged-site.json')).testedArchive};
write(REPORT+'/publication.json',report);
write(REPORT+'/publication.md',`# 线上发布记录\n\n入口：[井见](${base}) · [录井3D](${base}portal/index.html#/stage/mudlogging)。\n\n运行版本提交：\`${runtimeCommit}\`。GitHub Pages状态：${pages.status}。实际Chrome线上${browser.passed}/${browser.failed}；${assets.filter(a=>a.matchesLocal).length}/${assets.length}个关键入口、分包、演示脚本及样式的在线SHA-256与本地一致。\n\n本记录是线上部署后的抽查，与四例桌面、手机、老师导入、离线验收分别保存；完整范围见acceptance.md。离线整站ZIP另经过新目录解压、断网Chrome9/0检查，包SHA-256为\`${report.offlinePackage.sha256}\`。\n`);
console.log(JSON.stringify({passed:report.passed,runtimeCommit,pages:report.pages,matchedAssets:assets.filter(a=>a.matchesLocal).length,totalAssets:assets.length,browser:report.browser}));
if(!report.passed)process.exitCode=1;
