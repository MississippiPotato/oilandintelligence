import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assistantJS} from './assistant-bundle.mjs';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const base='e538d911ec2269f9286c2090b16ab42fb95b3b3c',report='handoff/assistant-companion-2026-10-29';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
fs.mkdirSync(report,{recursive:true});
const oldCSS=execFileSync('git',['show',base+':portal/assets/s17-assistant.css'],{encoding:'utf8'}),css=read('portal/assets/s17-assistant.css').replace(/^\uFEFF/,'');
const variants=[oldCSS,oldCSS.replace(/\r?\n/g,'\n'),oldCSS.replace(/\r?\n/g,'\r\n')];
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const protectedPaths=[...walk('portal-original'),...walk('石油勘探开发智能化案例集'),...walk('case-src'),...walk('expansion-src')];
const beforeProtected=Object.fromEntries(protectedPaths.map(p=>[p,sha(fs.readFileSync(p))]));
const previous=fs.existsSync(report+'/runtime-lock.json')?JSON.parse(read(report+'/runtime-lock.json')):null;
const initial=fs.existsSync(report+'/initial-runtime-lock.json')?JSON.parse(read(report+'/initial-runtime-lock.json')):previous;
const legacyTail="\n/* Fit the bubble inside the character stage, including useful navigation. */\n#s17-assistant #s17-agent-excerpt{-webkit-line-clamp:4}\n#s17-assistant .s17-agent-reply:has(.s17-agent-actions a) #s17-agent-excerpt{-webkit-line-clamp:2}\n@media(max-width:760px){#s17-assistant #s17-agent-excerpt{-webkit-line-clamp:3}#s17-assistant .s17-agent-reply:has(.s17-agent-actions a) #s17-agent-excerpt{-webkit-line-clamp:1}}\n";
const records=[];
for(const dir of ['dist/cases','dist/expansion-cases'])for(const folder of fs.readdirSync(dir)){
 const dest=dir+'/'+folder;if(!fs.statSync(dest).isDirectory())continue;
 const jsPath=dest+'/demo/demo.js',cssPath=dest+'/demo/demo.css';if(!fs.existsSync(jsPath))continue;
 const beforeStaticFiles=Object.fromEntries(['case.json','README.txt','demo/index.html'].map(p=>[p,sha(fs.readFileSync(dest+'/'+p))]));
 const beforeJS=read(jsPath),beforeCSS=read(cssPath),marker=beforeJS.indexOf('/* S17_OPTIONAL_ASSISTANT_START');if(marker<0)throw Error(dest+' assistant boundary missing');
 const jsPrefix=beforeJS.slice(0,marker),newJS=jsPrefix+assistantJS().trimStart();let start,end;
 const tagged=beforeCSS.indexOf('/* S17_ASSISTANT_CSS_START');
 if(tagged>=0){start=tagged;end=beforeCSS.indexOf('/* S17_ASSISTANT_CSS_END */',start)+'/* S17_ASSISTANT_CSS_END */'.length;}
 else{const match=variants.find(v=>beforeCSS.includes(v));if(!match)throw Error(dest+' old CSS boundary missing');start=beforeCSS.indexOf(match);end=start+match.length;}
 if(tagged>=0){let tail=beforeCSS.slice(end),space=tail.match(/^\s*/)[0].length;while(tail.slice(space).startsWith(legacyTail.trim())){end+=space+legacyTail.trim().length;tail=beforeCSS.slice(end);space=tail.match(/^\s*/)[0].length;}}
 const cssRest=beforeCSS.slice(0,start)+'__ASSISTANT_CSS__'+beforeCSS.slice(end),newCSS=beforeCSS.slice(0,start)+css.trimEnd()+beforeCSS.slice(end);
 if(read(jsPath)!==beforeJS||read(cssPath)!==beforeCSS)throw Error('Case changed during assistant sync; retry without overwriting parallel work: '+dest);
 fs.writeFileSync(jsPath,newJS);fs.writeFileSync(cssPath,newCSS);
 const oldRecord=previous?.cases.find(c=>c.path===dest);
 records.push({path:dest,id:JSON.parse(read(dest+'/case.json')).id,assistantRevision:'0.6.0',calculationPrefixSHA256:sha(jsPrefix),nonAssistantCSSSHA256:sha(cssRest),beforeStaticFiles,calculationPreservedBySync:newJS.slice(0,newJS.indexOf('/* S17_OPTIONAL_ASSISTANT_START'))===jsPrefix,changedSincePreviousLock:!!oldRecord&&oldRecord.calculationPrefixSHA256!==sha(jsPrefix),files:walk(dest).map(p=>({path:p.slice(dest.length+1),bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))}))});
 if(records.at(-1).files.reduce((n,f)=>n+f.bytes,0)>6*1024*1024)throw Error(dest+' exceeds original 6 MiB limit');
}
const concurrentSourceChangesDuringSync=[];for(const p of protectedPaths)if(beforeProtected[p]!==sha(fs.readFileSync(p))){if(p.startsWith('portal-original/')||p.startsWith('石油勘探开发智能化案例集/'))throw Error('Protected teacher original changed: '+p);concurrentSourceChangesDuringSync.push(p);}
const concurrentSourceChanges=initial?Object.keys(beforeProtected).filter(p=>initial.protectedContent[p]&&initial.protectedContent[p]!==beforeProtected[p]):[];
const concurrentRuntimeChanges=initial?records.filter(c=>initial.cases.find(v=>v.path===c.path)?.calculationPrefixSHA256!==c.calculationPrefixSHA256).map(c=>c.path):[];
const lock={assistantRevision:'0.6.0',baseCommit:base,builtAt:new Date().toISOString(),cases:records,protectedContent:beforeProtected,concurrentSourceChanges,concurrentRuntimeChanges,concurrentSourceChangesDuringSync,full61AlgorithmAcceptanceClaimed:false};
fs.writeFileSync(report+'/runtime-lock.json',JSON.stringify(lock,null,2));
console.log(JSON.stringify({cases:records.length,runtimeFiles:records.length*5,protectedFiles:protectedPaths.length,calculationPreservedBySync:records.every(r=>r.calculationPreservedBySync),concurrentSourceChanges:concurrentSourceChanges.length,concurrentRuntimeChanges:concurrentRuntimeChanges.length,report},null,2));
