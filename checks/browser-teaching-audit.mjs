import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {reportDir,fileRecord} from '../tools/build-expansion.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const lock=read(reportDir+'/build-lock.json'),suite=read('handoff/suite-build-lock.json');
const all=[...lock.cases.map(c=>({scene:c.sceneId,id:c.caseId,version:c.version,output:c.output})),...suite.cases.map(c=>({scene:c.sceneId,id:c.caseId,version:c.version,output:'dist/cases/'+c.caseId}))];
const ids=['s5','w3','c4','pr2','pr4','e3','t5','r5','m5'],only=process.argv.find(a=>a.startsWith('--only='))?.split('=')[1],samples=ids.filter(id=>!only||id===only).map(id=>all.find(c=>c.scene===id));
const phase=process.argv[2]||'samples',session='teaching-'+phase+(only?'-'+only:''),base='http://127.0.0.1:8755/',shots='output/playwright/teaching-audit-2026-10-24/';
fs.mkdirSync(path.join(root,shots),{recursive:true});
function cli(args,name,cases=[]){const target=name?path.join(root,reportDir,name+'.json'):null;
 const p=spawnSync(process.execPath,['tools/pw.mjs',session,...args],{cwd:root,encoding:'utf8',timeout:95000,windowsHide:true,env:{...process.env,...(target?{S17_REPORT:target}:{})}});
 if(p.error||p.status||/### Error/.test(p.stdout??'')){process.stdout.write(p.stdout??'');process.stderr.write(p.stderr??'');throw p.error??Error('Browser command failed '+args[0]);}
 if(!target)return;
 const r=read(path.relative(root,target));r.artifactHashesRecordedByNode=cases.flatMap(c=>['case.json','README.txt','demo/index.html','demo/demo.css','demo/demo.js'].map(f=>fileRecord(c.output+'/'+f)));
 fs.writeFileSync(target,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({report:name,passed:r.passed,failed:r.failed,exception:r.exception}));if(r.failed)process.exitCode=1;return r;
}
function code(c,body,scope){return `async page=>{
const C=${JSON.stringify(c)},ROOT=${JSON.stringify(root.replaceAll('\\','/')+'/')},BASE=${JSON.stringify(base)},SHOTS=ROOT+${JSON.stringify(shots)};
const r={scope:${JSON.stringify(scope)},checkedAt:new Date().toISOString(),case:C,checks:[],errors:[],external:[]};
page.removeAllListeners('pageerror');page.removeAllListeners('request');page.on('pageerror',e=>r.errors.push(e.message));page.on('request',q=>{if(/^https?:/.test(q.url())&&!q.url().startsWith(BASE))r.external.push(q.url())});
const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name)};
const ready=async()=>page.evaluate(async()=>{if(window.CaseImport?.ready)await CaseImport.ready});
const frame=async()=>{const f=page.frameLocator('iframe');await f.locator('#run').waitFor({state:'attached',timeout:30000});const a=page.frames().find(x=>x.parentFrame()===page.mainFrame());await a.waitForLoadState('load');await a.waitForFunction(()=>!!(globalThis.CaseInspect??globalThis.S17Inspect??globalThis.M2Inspect));return f;};
const run=async(f)=>{await f.locator('nav [data-tab=lab]').click();await f.locator('#run').click();await f.locator('#export').evaluate(el=>!el.disabled?null:new Promise((res,rej)=>{const t=Date.now(),timer=setInterval(()=>{if(!el.disabled){clearInterval(timer);res()}else if(Date.now()-t>25000){clearInterval(timer);rej(Error('calculation not completed'))}},25)}),{timeout:30000});ok('actual calculation completes',await f.locator('#export').isEnabled());};
const finite=async f=>f.locator('body').evaluate(()=>!(/NaN|Infinity/.test((document.getElementById('results')||document.getElementById('outputs')||document.getElementById('lab')).innerHTML)));
const snap=async f=>f.locator('body').evaluate(()=>{const s=(globalThis.CaseInspect??globalThis.S17Inspect??globalThis.M2Inspect).snapshot();return s.result??s.results??s.run??s});
const change=async(f,id,target='end')=>{const x=f.locator('#'+id);await x.focus();if(await x.getAttribute('type')==='range')await x.press(target==='home'?'Home':'End');else{await x.fill(String(target));await x.press('Tab')}};
const chooseOther=async(f,id)=>{const x=f.locator('#'+id),v=await x.inputValue(),opts=await x.locator('option').evaluateAll(a=>a.map(x=>x.value));await x.selectOption(opts.find(a=>a!==v));};
try{await page.setViewportSize({width:1440,height:1050});await page.emulateMedia({reducedMotion:'reduce'});${body}
ok('no JavaScript exceptions',r.errors.length===0,r.errors);ok('no automatic external runtime dependency',r.external.length===0,r.external);
}catch(e){r.exception=e.message;r.frameStates=[];for(const f of page.frames()){try{r.frameStates.push(await f.evaluate(()=>({url:location.href,ready:document.readyState,status:document.getElementById('status')?.innerText,text:document.body?.innerText.slice(-900)})))}catch{}}}finally{await page.context().setOffline(false)}r.passed=r.checks.filter(x=>x.passed).length;r.failed=Math.max(r.checks.filter(x=>!x.passed).length,r.exception?1:0);return r;
}`;}
const actions={
 s5:`await chooseOther(f,'type');ok('noise type change invalidates export',await f.locator('#export').isDisabled());await run(f);ok('waveform and removed residual stay finite after noise switch',await finite(f));r.changedNoiseType=await f.locator('#type').inputValue();`,
 w3:`await change(f,'threshold');ok('segmentation threshold marks old results stale',await f.locator('#export').isDisabled());await run(f);ok('high-threshold mask still renders finite image coordinates',await finite(f));`,
 c4:`for(const id of ['ecc','load','spacing'])await change(f,id);await run(f);r.contactText=await f.locator('#results').innerText();ok('negative gap remains visible as contact diagnostic',/接触|越界|负/.test(r.contactText)&&/-4[.．]6/.test(r.contactText));ok('cross-section and gap curve remain finite',await finite(f));`,
 pr2:`const before=await snap(f);await chooseOther(f,'intervention');ok('future intervention requires new calculation',await f.locator('#export').isDisabled());await run(f);const after=await snap(f);ok('unknown intervention does not change recursive prediction or lag trace',JSON.stringify(before.prediction)===JSON.stringify(after.prediction)&&JSON.stringify(before.trace)===JSON.stringify(after.trace));ok('actual recursive trace has 21 forecast steps',after.trace?.length===21);r.traceExample=after.trace.slice(0,2);`,
 pr4:`const x=await snap(f);r.alertTimeline=x.alertTimeline;ok('three-point confirmation occurs at81, after segment start79',x.alertTimeline?.firstRunStart===79&&x.alertTimeline?.firstConfirmation===81);ok('time interpretation visible beside actual graph',/确认/.test(await f.locator('#results').innerText()));`,
 e3:`await change(f,'budget',6);ok('budget change makes old export stale',await f.locator('#export').isDisabled());await run(f);ok('proportion grid and fixed performance scale are visible',/成本|预算/.test(await f.locator('#results').innerText())&&await finite(f));r.resultText=(await f.locator('#results').innerText()).slice(0,650);`,
 t5:`const before=await snap(f);await change(f,'radarBias');await run(f);const after=await snap(f);ok('radar bias leaves actual pixels and visual height unchanged',JSON.stringify(before.pixels)===JSON.stringify(after.pixels)&&before.visualHeight===after.visualHeight);ok('radar measurement changes independently',before.radar!==after.radar);ok('detected row and boundary strength are shown',/边界|行/.test(await f.locator('#results').innerText()));r.vision={before:before.visualHeight,after:after.visualHeight,beforeRadar:before.radar,afterRadar:after.radar};`,
 r5:`await chooseOther(f,'scenario');await run(f);ok('softsensor scenario renders current delayed-lab comparison',await finite(f)&&/化验/.test(await f.locator('#outputs').innerText()));r.scenario=await f.locator('#scenario').inputValue();`,
 m5:`await f.locator('#rawtext').fill('1200–1210 m MD：未检出明显荧光，但气测总气升高至3.2 ppmv。');await run(f);const e=await f.locator('body').evaluate(()=>S17Inspect.evidence());const facts=e.facts??[];r.extractedFields=facts.map(a=>({rawQuote:a.rawQuote,fields:a.fields,flags:a.flags}));ok('UI run retains fluorescence negation',facts.some(a=>a.fields.negation===true&&a.fields.fluorescence==='荧光'));ok('UI run preserves full ppmv unit',facts.some(a=>a.fields.gasUnit==='ppmv'));ok('negation does not spill into parallel gas statement',facts.some(a=>a.fields.gasUnit==='ppmv'&&a.fields.negation===false));`
};
if(phase==='samples'){
 cli(['open',base+'portal-original/index.html','--config=checks/playwright-local-file.json']);
 for(const c of samples){cli(['run-code',code(c,`
await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+C.output);await page.waitForFunction(id=>document.getElementById('imp-id').value===id,C.id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.waitForFunction(scene=>location.hash.split('?')[0]==='#/scene/'+scene,C.scene);await page.waitForFunction(id=>document.querySelector('.detail-head .badge-ready')?.textContent.includes(id),C.id);ok('actual unchanged teacher folder import',await page.evaluate(id=>CaseImport.list().some(x=>x.id===id),C.id));
await page.locator('[data-panel=bg]').screenshot({path:SHOTS+C.scene+'-native-background.png'});await page.locator('#tabs [data-tab=flow]').click();ok('teacher workflow displays one compact connected overview',await page.locator('[data-panel=flow] .case-flow-overview').count()===1);await page.locator('#tabs [data-tab=demo]').click();let f=await frame();
if(C.scene==='m5'){await f.locator('nav [data-tab=background]').click();await f.locator('[data-study-widget=report] textarea').fill('1200–1210 m MD，未检出明显荧光');ok('background negation highlights and field agree',await f.locator('[data-study-widget=report] .study-numbers').innerText().then(t=>t.includes('true')));await f.locator('[data-study-widget=report] select').selectOption('remove');ok('draft experiment removes only target-related negative prefix',await f.locator('[data-study-widget=report] .study-draft p').innerText()==='1200–1210 m MD，见明显荧光');}
await f.locator('nav [data-tab=workflow]').click();const flow=f.locator('.case-flow-overview');ok('runtime overview remains compact',await flow.locator('svg').boundingBox().then(b=>b.height<=270));await run(f);${actions[c.scene]}
await f.locator(C.scene==='m5'?'#report':C.scene==='r5'?'#outputs':'#results').screenshot({path:SHOTS+C.scene+'-native-results.png'});
const pending=page.waitForEvent('download');await f.locator('#export').click();const download=await pending;await download.saveAs(SHOTS+C.scene+'-native.json');ok('actual current-result JSON downloaded',!!download.suggestedFilename());
if(['c4','pr4','m5'].includes(C.scene)){await page.reload();f=await frame();await run(f);ok('sample refresh restores package and recomputes',await f.locator('#export').isEnabled());}
`, 'Teacher original folder import, real sandbox computation and case-specific teaching interaction; sampled, not all61 browser acceptance')],'browser-'+c.scene,[c]);}
 cli(['close']);
}else if(phase==='offline'){
 cli(['open','file:///'+root.replaceAll('\\','/')+'/portal/index.html','--config=checks/playwright-local-file.json']);
 const selected=samples.filter(c=>['w3','e3','m5'].includes(c.scene));
 for(const c of selected)cli(['run-code',code(c,`await page.context().setOffline(true);await page.goto('file:///'+ROOT+C.output+'/demo/index.html#background');await page.locator('nav [data-tab=background]').click();ok('offline professional background renders',await page.locator('#background').innerText().then(t=>t.length>400));await run(page);ok('actual offline computation enables export',await page.locator('#export').isEnabled());ok('offline result contains no nonfinite display',C.scene==='m5'||await finite(page));if(C.scene==='w3'){await page.setViewportSize({width:390,height:844});ok('standalone390px layout keeps image comparison scroll inside chart',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:SHOTS+'w3-offline-mobile.png'});}`, 'Three selected standalone files opened with browser offline mode and actual calculation')],'browser-offline-'+c.scene,[c]);
 cli(['close']);
}else throw Error('unknown phase '+phase);
