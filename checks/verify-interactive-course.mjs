import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import {ROOT,REPORT,FIVE_VERSION,EXPANSION_VERSION,freeze,record,walk}from'../tools/interactive-course-contract.mjs';
import{conceptFor}from'../tools/concept-content.mjs';import{profiles}from'../tools/expansion-lesson-profiles.mjs';
process.chdir(ROOT);const checks=[],ok=(name,value,detail)=>{checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
const before=freeze();for(const f of before.protectedFiles)ok('protected bytes '+f.path,record(f.path).sha256===f.sha256);
const required=['README.txt','case.json','demo/demo.css','demo/demo.js','demo/index.html'].sort(),cases=[];
for(const base of ['dist/cases','dist/expansion-cases'])for(const id of fs.readdirSync(base)){
 const folder=base+'/'+id,manifest=JSON.parse(fs.readFileSync(folder+'/case.json','utf8')),files=walk(folder),html=fs.readFileSync(folder+'/demo/index.html','utf8');
 ok(id+' five-file contract',JSON.stringify(files.map(p=>p.slice(folder.length+1)))===JSON.stringify(required));
 ok(id+' current version',manifest.version===(base==='dist/cases'?FIVE_VERSION:EXPANSION_VERSION));
 ok(id+' smaller than original 6MiB folder limit',files.reduce((n,p)=>n+fs.statSync(p).size,0)<6*1024*1024);
 ok(id+' original three-part manifest',!!manifest.tabs.background&&!!manifest.tabs.workflow&&!!manifest.tabs.demo);
 new vm.Script(fs.readFileSync(folder+'/demo/demo.js','utf8'),{filename:folder+'/demo/demo.js'});ok(id+' ordinary script syntax',true);
 ok(id+' no executable manifest HTML',!/<script\b|\bon\w+\s*=|javascript\s*:/i.test(JSON.stringify(manifest)));
 ok(id+' no remote auto-loaded HTML assets',!/<(?:script|link|img|source)\b[^>]+(?:src|href)\s*=\s*["']https?:/i.test(html));
 ok(id+' teacher technical context included',JSON.stringify(manifest.tabs.background).includes('course-context'));
 const css=fs.readFileSync(folder+'/demo/demo.css','utf8');ok(id+' red UI and uncapped knowledge plot geometry',css.includes('--course-red: #B8242A')&&css.includes('max-height:none!important'));
 cases.push({id,scene:manifest.sceneId,version:manifest.version,files:files.map(record)});
}
ok('61 unique scenes and 305 runtime files',cases.length===61&&new Set(cases.map(c=>c.scene)).size===61&&cases.flatMap(c=>c.files).length===305);
for(const scene of Object.keys(profiles)){
 const c=conceptFor(scene,{required:true});ok(scene+' professional background and method units',!!c.backgroundHTML&&!!c.workflowHTML);
 for(const part of ['background','workflow']){const html=c[part+'HTML'];ok(scene+'/'+part+' graphic, static default and disabled controls',html.includes('<svg')&&/\bdisabled\b/.test(html)&&html.includes('data-concept-part="'+part+'"'));}
}
for(const scene of ['m1','m2','m3','m4'])ok(scene+' new background interaction',!!conceptFor(scene,{required:true}).backgroundHTML);
const build=JSON.parse(fs.readFileSync(REPORT+'/build-lock.json','utf8'));ok('strict build with 56 authored pairs',!build.draft&&build.concepts.length===56&&build.concepts.every(c=>c.background&&c.workflow));
for(const f of build.runtime)ok('build fingerprint '+f.path,record(f.path).sha256===f.sha256);
const browser=[];if(!process.argv.includes('--source-only')){
 const names=['core','mobile','offline','import','portal','navigation','integrated-geology','integrated-seismic','integrated-drilling-welllog','integrated-cement-completion','integrated-perforation-production','integrated-workover-eor','integrated-transport','integrated-refining'];
 for(const name of names){const p=REPORT+'/browser-'+name+'.json',r=JSON.parse(fs.readFileSync(p,'utf8'));ok('actual saved Chrome protocol '+name,r.failed===0&&r.errors?.length===0&&!/(?:pending|await|provisional|pause)/i.test([r.status,r.validationStatus].filter(Boolean).join(' ')),{passed:r.passed,failed:r.failed});browser.push({name,passed:r.passed,failed:r.failed,path:p});}
 const tested=names.filter(n=>n.startsWith('integrated-')).flatMap(n=>JSON.parse(fs.readFileSync(REPORT+'/browser-'+n+'.json','utf8')).cases??[]);ok('56 built other-case pages operated',tested.length===56&&new Set(tested.map(c=>c.scene)).size===56&&tested.every(c=>c.completed));
 const downloads=walk(REPORT+'/downloads').filter(p=>p.endsWith('.json'));for(const p of downloads){const d=JSON.parse(fs.readFileSync(p,'utf8'));ok('real saved result '+p,d.schemaVersion==='1.0'&&d.caseVersion===FIVE_VERSION&&!!d.runId&&Array.isArray(d.sources)&&d.sources.length>0);if(d.caseId==='s17-evidence-report')ok('M5 saves the real interval handover '+p,!!d.handover?.intervalMD_m&&!!d.handover?.drillingObservation&&d.handover?.upstreamPackages?.length>0&&d.handover?.nextChecks?.length>0);}
 ok('all five actual saves on desktop, offline and teacher refresh',downloads.length===15);
}
const out={checkedAt:new Date().toISOString(),scope:process.argv.includes('--source-only')?'Source files, protected bytes and package contracts. No browser operated by this check.':'Source and saved actual Chrome records; primary5 full paths, other56 background/method pages with sampled mobile/current-input checks.',passed:checks.filter(x=>x.passed).length,failed:0,protectedFiles:before.protectedFiles.length,caseCount:61,runtimeFiles:305,newKnowledgeUnits:116,browser,browserPassed:browser.reduce((n,b)=>n+b.passed,0),all61AllPathsClaimed:false,checks,cases};
fs.writeFileSync(REPORT+(process.argv.includes('--source-only')?'/source-checks.json':'/verification.json'),JSON.stringify(out,null,2));if(!process.argv.includes('--source-only'))fs.writeFileSync(REPORT+'/runtime-lock.json',JSON.stringify({createdAt:new Date().toISOString(),cases,portal:['portal/index.html','portal/assets/s17-course.js','portal/assets/s17-home.js','portal/assets/s17-reader.js','portal/assets/s17-mudlogging-knowledge.js','portal/assets/s17-expansion-cases.js','shared/course-theme.css','shared/course-compass.css','shared/course-compass.js','shared/concept-host.js','shared/concept-interactions.css'].map(record)},null,2));console.log(JSON.stringify({...out,checks:undefined,cases:undefined},null,2));
