import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),dir='handoff/full-coverage-2026-10-24',shots='output/playwright/full-coverage-2026-10-24/';
const plan=JSON.parse(fs.readFileSync(path.join(root,dir,'implementation-plan.json'),'utf8'));
const lock=JSON.parse(fs.readFileSync(path.join(root,dir,'build-lock.json'),'utf8'));
const extras=lock.cases.map(c=>({scene:c.sceneId,id:c.caseId,version:c.version,directory:'expansion-cases',batch:plan.cases.find(p=>p.sceneId===c.sceneId)?.batch??0}));
const suite=JSON.parse(fs.readFileSync(path.join(root,'handoff/suite-build-lock.json'),'utf8'));
const all=[...suite.cases.map(c=>({scene:c.sceneId,id:c.caseId,version:c.version,directory:'cases',batch:0})),...extras];
const browserRoot=root.replaceAll('\\','/')+'/',origin='http://127.0.0.1:8755/';
const phase=process.argv[2]??'smoke',session='full-'+phase;
const batchFilter=Number(process.argv.find(s=>s.startsWith('--batch='))?.split('=')[1]||0);
fs.mkdirSync(path.join(root,shots),{recursive:true});
function cli(args,name){
 const target=name?path.join(root,dir,name+'.json'):null;
 const r=spawnSync(process.execPath,['tools/pw.mjs',session,...args],{cwd:root,encoding:'utf8',timeout:95000,windowsHide:true,env:{...process.env,...(target?{S17_REPORT:target}:{})}});
 if(r.error||r.status||/### Error/.test(r.stdout??'')){process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');throw r.error??Error('Browser CLI failed '+args[0]);}
 if(!target)return;
 if(!fs.existsSync(target))throw Error('Browser did not return its report '+name);
 const report=JSON.parse(fs.readFileSync(target,'utf8'));
 const related=report.cases??[];
 report.artifactHashesRecordedByNode=related.flatMap(row=>{const c=all.find(x=>x.scene===row.scene);if(!c)return[];return ['case.json','demo/index.html','demo/demo.css','demo/demo.js','README.txt'].map(p=>{const file='dist/'+c.directory+'/'+c.id+'/'+p,b=fs.readFileSync(path.join(root,file));return{path:file,sha256:crypto.createHash('sha256').update(b).digest('hex')};});});
 fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({report:name,cases:related.map(c=>c.scene),passed:report.passed,failed:report.failed,exception:report.exception}));
 if(report.failed)process.exitCode=1;
 return report;
}
function script(cases,scope,body){return `async page=>{
const ROOT=${JSON.stringify(browserRoot)},ORIGIN=${JSON.stringify(origin)},SHOTS=${JSON.stringify(browserRoot+shots)},CASES=${JSON.stringify(cases)};
const r={scope:${JSON.stringify(scope)},checkedAt:new Date().toISOString(),checks:[],cases:[],errors:[],external:[]};
const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name)};
page.on('pageerror',e=>r.errors.push(e.message));page.on('request',q=>{if(/^https?:/.test(q.url())&&!q.url().startsWith(ORIGIN))r.external.push(q.url())});
const ready=async()=>page.evaluate(async()=>{if(window.CaseImport?.ready)await CaseImport.ready});
const frameReady=async()=>{const f=page.frameLocator('iframe');await f.locator('#run').waitFor({state:'attached',timeout:30000});const actual=page.frames().find(fr=>fr.parentFrame()===page.mainFrame());await actual.waitForLoadState('load',{timeout:30000});await actual.waitForFunction(()=>!!(globalThis.CaseInspect??globalThis.S17Inspect??globalThis.M2Inspect),null,{timeout:30000});return f;};
const run=async(f,c)=>{await f.locator('nav [data-tab=lab]').click();await f.locator('#run').click();await f.locator('#export').waitFor({state:'visible'});await f.locator('#export').evaluate(el=>el.disabled?new Promise((resolve,reject)=>{const end=Date.now()+30000;const timer=setInterval(()=>{if(!el.disabled){clearInterval(timer);resolve()}else if(Date.now()>end){clearInterval(timer);reject(Error('calculation never enabled export'))}},30)}):null);const x=await f.locator('body').evaluate(()=>{const a=globalThis.CaseInspect?.snapshot?.()??globalThis.M2Inspect?.snapshot?.()??globalThis.S17Inspect?.snapshot?.();return a?{sceneId:a.sceneId,status:a.status,resultPresent:!!(a.result||a.metrics||a.run),metrics:a.result?.metrics??a.metrics??a.run?.metrics??null}:null});ok(c.scene+' actually computes and enables current export',!!x&&await f.locator('#export').isEnabled(),x);return x;};
const add=async c=>{await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+(c.folder||'dist/'+c.directory+'/'+c.id));await page.waitForFunction(id=>document.getElementById('imp-id').value===id,c.id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.waitForFunction(id=>CaseImport.list().some(x=>x.id===id),c.id);await page.waitForFunction(scene=>location.hash.split('?')[0]==='#/scene/'+scene,c.scene);await page.waitForFunction(id=>document.querySelector('.detail-head .badge-ready')?.textContent.includes(id),c.id);ok(c.scene+' actual Add Case directory import registered and saved',await page.evaluate(id=>CaseImport.list().some(x=>x.id===id),c.id));};
try{await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});${body}
ok('no unexpected network dependency',r.external.length===0,r.external);ok('no browser JavaScript errors',r.errors.length===0,r.errors);
}catch(e){r.exception=e.message;r.failureDOM=[];for(const frame of page.frames()){try{r.failureDOM.push(await frame.evaluate(()=>({url:location.href,ready:document.readyState,hasRun:!!document.getElementById('run'),title:document.title,text:document.body?.innerText?.slice(0,600)})))}catch(err){r.failureDOM.push({error:err.message})}}await page.screenshot({path:SHOTS+'failure-'+(CASES[0]?.scene??'portal')+'.png'}).catch(()=>{});}finally{await page.context().setOffline(false)}r.passed=r.checks.filter(c=>c.passed).length;r.failed=Math.max(r.checks.filter(c=>!c.passed).length,r.exception?1:0);return r;
}`;}
function open(persistent=false){cli(['open',origin+'portal/index.html',...(persistent?['--persistent','--profile=.playwright-cli/profile-full-'+phase+'-final']:[]),'--config=checks/playwright-local-file.json']);}
if(phase==='smoke'){
 open();
 for(const b of plan.batches.filter(b=>!batchFilter||b.id===batchFilter)){const cases=extras.filter(c=>c.batch===b.id);cli(['run-code',script(cases,'Actual offline Chrome, new cases: three sections and one computed run per case; selected screenshots and mobile checks',`
await page.context().setOffline(true);
for(let index=0;index<CASES.length;index++){const c=CASES[index],startErrors=r.errors.length;try{
 await page.goto('file:///'+ROOT+'dist/'+c.directory+'/'+c.id+'/demo/index.html#background');
 await page.locator('nav [data-tab=background]').click();
 ok(c.scene+' has explained background and at least two rendered concept/data figures',await page.locator('#background').innerText().then(t=>t.length>400)&&await page.locator('#background svg,#background canvas,#background img').count()>=2);
 if(index===0)await page.locator('#background').screenshot({path:SHOTS+c.scene+'-background.png'});
 await page.locator('nav [data-tab=workflow]').click();const flow=page.locator('.case-flow-overview');
 ok(c.scene+' has one compact authored connected flow',await flow.count()===1&&await flow.locator('[data-flow-node]').count()===8&&await flow.locator('svg').boundingBox().then(b=>b.height<=270));
 await flow.locator('[data-flow-node=model]').click();ok(c.scene+' flow node responds',await flow.locator('[data-flow-node=model]').getAttribute('aria-current')==='true');
 const x=await run(page,c);ok(c.scene+' results visible and finite text',await page.locator('#results').isVisible()&&!/NaN|Infinity/.test(await page.locator('#results').innerText()));
 if(index===0){await page.locator('#results').screenshot({path:SHOTS+c.scene+'-lab.png'});await page.setViewportSize({width:390,height:844});ok(c.scene+' sampled mobile page contains charts internally',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.setViewportSize({width:1440,height:1000});}
 ok(c.scene+' no page-specific JavaScript exceptions',r.errors.length===startErrors,r.errors.slice(startErrors));r.cases.push({...c,standaloneRun:true,metrics:x?.metrics});
 }catch(e){r.checks.push({name:c.scene+' completes browser smoke',passed:false,error:e.message});r.cases.push({...c,standaloneRun:false,error:e.message});}}
`)],'browser-smoke-batch-'+b.id);}
 cli(['close']);
}else if(phase==='native'){
 open();
 for(const b of plan.batches.filter(b=>!batchFilter||b.id===batchFilter)){const cases=extras.filter(c=>c.batch===b.id);cli(['run-code',script(cases,'Unchanged teacher Add Case importer: every new folder imported in isolated stage batches; representative sandbox run, download and refresh rerun',`
 await page.goto(ORIGIN+'portal-original/index.html');await page.evaluate(()=>{localStorage.removeItem('atlas.casepack.v2');localStorage.removeItem('atlas.casepack.v1')});await page.reload();
 ok('isolated original batch begins empty',await page.evaluate(()=>CaseImport.list().length===0));
 for(const c of CASES){await add(c);r.cases.push({...c,nativeImported:true});}
 const c=CASES[0];await page.goto(ORIGIN+'portal-original/index.html#/scene/'+c.scene+'?case='+c.id+'&tab=bg');await page.waitForFunction(id=>document.querySelector('.detail-head .badge-ready')?.textContent.includes(id),c.id);await page.locator('#tabs [data-tab=demo]').click();await page.reload();let f=await frameReady();const first=await run(f,c);
 const downloadPromise=page.waitForEvent('download');await f.locator('#export').click();const download=await downloadPromise;await download.saveAs(SHOTS+c.scene+'-native.json');
 await page.reload();f=await frameReady();const second=await run(f,c);ok(c.scene+' representative refresh reruns same computed metrics',JSON.stringify(first.metrics)===JSON.stringify(second.metrics));
 ok('all stage-batch imports survive teacher refresh',await page.evaluate(n=>CaseImport.list().length===n,CASES.length));r.representative=c.scene;r.persistedCount=CASES.length;
`)],'browser-native-batch-'+b.id);}
 cli(['close']);
}else if(phase==='enhanced'){
 open(true);
 if(!process.argv.includes('--resume')){
 // This dedicated persistent browser profile belongs only to this acceptance run.
 cli(['run-code',script([], 'Fresh isolated enhanced acceptance profile initialization',`await ready();ok('fresh enhanced acceptance profile',await page.evaluate(()=>CaseImport.list().length===0));`)],'browser-enhanced-start');
 const batches=[all.slice(0,5),...plan.batches.map(b=>extras.filter(c=>c.batch===b.id)),extras.filter(c=>c.batch===0)];
 for(let i=0;i<batches.length;i++)cli(['run-code',script(batches[i],'Actual enhanced Add Case uploads, transaction committed before recorded success',`await page.goto(ORIGIN+'portal/index.html');await ready();for(const c of CASES){await add(c);r.cases.push({...c,enhancedImported:true});}r.persistedCount=await page.evaluate(()=>CaseImport.list().length);`)],'browser-enhanced-import-'+(i+1));
 cli(['run-code',script([], 'Enhanced full catalog persistence after reload, homepage count, original sample compatibility and optional assistant context',`
await page.goto(ORIGIN+'portal/index.html');await ready();await page.reload();await ready();r.storage=await page.evaluate(()=>({count:CaseImport.list().length,status:CaseImport.storageStatus(),ids:CaseImport.list().map(c=>c.id)}));ok('all 61 real case folders persist after reload',r.storage.count===61,r.storage.status);ok('homepage displays 61 authored cases',await page.locator('#s17-built-count').innerText()==='61');
await page.screenshot({path:SHOTS+'portal-61-cases.png',fullPage:false});
`)],'browser-enhanced-persist');
 }
 cli(['close']);open(true);
 for(const b of plan.batches){const reps=extras.filter(c=>c.batch===b.id);
 cli(['run-code',script(reps,'Actual dedicated Chrome close and reopen: all 61 imported packages retained; every new case runs in the enhanced opaque sandbox',`
await ready();ok('61 packages survive actual browser restart',await page.evaluate(()=>CaseImport.list().length===61));
for(const c of CASES){await page.goto(ORIGIN+'portal/index.html#/scene/'+c.scene+'?case='+c.id+'&tab=demo');await ready();const f=await frameReady();const x=await run(f,c);ok(c.scene+' imported assistant initializes with its case context',await f.locator('#s17-agent-launcher').count()===1);r.cases.push({...c,restartRun:true,metrics:x?.metrics});}
`)],'browser-enhanced-restart-batch-'+b.id);}
 cli(['close']);
}else if(phase==='interaction'){
 cli(['open',origin+'portal/index.html','--persistent','--profile=.playwright-cli/profile-full-enhanced-final','--config=checks/playwright-local-file.json']);
 const selected=extras.filter(c=>['s3','w5','e3','t5'].includes(c.scene));
 cli(['run-code',script(selected,'Four representative real keyboard parameter changes, stale result state and recomputation; actual full IndexedDB capacity',`
await ready();ok('interaction audit uses all 61 persisted production cases',await page.evaluate(()=>CaseImport.list().length===61));
r.storage=await page.evaluate(async()=>{const records=await new Promise((resolve,reject)=>{const q=indexedDB.open('atlas.casepack.enhanced.v1',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('catalog'),get=tx.objectStore('catalog').get('packages');tx.oncomplete=()=>{resolve(get.result);db.close()};tx.onerror=()=>reject(tx.error)}});return{count:records.length,characters:JSON.stringify(records).length,backend:CaseImport.storageStatus().backend}});ok('all 61 use the durable expanded store',r.storage.count===61&&r.storage.backend==='indexedDB',r.storage);
for(const c of CASES){await page.goto(ORIGIN+'portal/index.html#/scene/'+c.scene+'?case='+c.id+'&tab=demo');await ready();const f=await frameReady();await run(f,c);const before=await f.locator('#results').innerText(),control=f.locator('#lab input[type=range],#lab input[type=number]').first(),value=await control.inputValue();await control.focus();if(await control.getAttribute('type')==='range'){await control.press('End');if(await control.inputValue()===value)await control.press('Home');}else{const min=Number(await control.getAttribute('min')??0),max=Number(await control.getAttribute('max')??100),step=Number(await control.getAttribute('step')||1),candidate=Number(value)+step*5<=max?Number(value)+step*5:Math.max(min,Number(value)-step*5);await control.fill(String(Number(candidate.toFixed(8))));await control.press('Tab');}ok(c.scene+' actual input change invalidates previous export',await control.inputValue()!==value&&await f.locator('#export').isDisabled());await run(f,c);ok(c.scene+' changed input actually changes computed display',await f.locator('#results').innerText()!==before);if(c.scene==='w5')await f.locator('#results').screenshot({path:SHOTS+'w5-interactive-repair.png'});r.cases.push({...c,changedInput:true,recomputed:true});}
await page.goto(ORIGIN+'portal/index.html');await ready();await page.screenshot({path:SHOTS+'portal-61-cases.png',fullPage:false});
`)],'browser-interaction');
 cli(['close']);
}else if(phase==='compat'){
 open();
 const sample={scene:'s3',id:'firstbreak-stalta',folder:'portal-original/firstbreak-pick-case'};
 cli(['run-code',script([sample],'Unmodified teacher firstbreak package through enhanced actual Add Case UI and persistent storage',`
await ready();const c=CASES[0];await add(c);await page.locator('#tabs [data-tab=demo]').click();let f=page.frameLocator('iframe');await f.locator('#trace path').first().waitFor();const before=await f.locator('#trace').innerHTML();await f.locator('#noise').focus();await f.locator('#noise').press('ArrowRight');ok('unmodified firstbreak slider recomputes waveform',await f.locator('#trace').innerHTML()!==before);await page.reload();await ready();f=page.frameLocator('iframe');await f.locator('#trace path').first().waitFor();ok('unmodified firstbreak survives enhanced refresh',await page.evaluate(()=>CaseImport.list().some(x=>x.id==='firstbreak-stalta')));await page.screenshot({path:SHOTS+'firstbreak-compatible.png'});
`)],'browser-firstbreak-compat');
 cli(['close']);
}else throw Error('unknown phase '+phase);
