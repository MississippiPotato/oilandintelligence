import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// CLI browser acceptance. The browser receives only observations/actions; this
// driver reads manifests and verifies files after genuine browser downloads.
const root = path.resolve(import.meta.dirname, '..');
const session = 's17-expansion-contract';
const evidenceDir = path.join(root, 'handoff/expansion-2026-10-24');
const exportDir = path.join(root, 'output/exports/v1.7');
const screenshotDir = path.join(root, 'output/playwright/expansion-2026-10-24');
for (const p of [evidenceDir, exportDir, screenshotDir]) fs.mkdirSync(p, { recursive: true });
const extras = ['g1', 's1', 'd1', 'w4', 'c1', 'co1', 'p1', 'pr1', 'wo1', 'e1', 't1', 'r5'].map(scene => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'expansion-src', scene, 'case.json'), 'utf8'));
  return { scene, id: manifest.id, version: manifest.version, directory: 'expansion-cases', title: manifest.title };
});
const required = [
  ['m1', 's17-cuttings-lithology'], ['m2', 's17-mudgas-context'], ['m3', 's17-fluorescence-review'],
  ['m4', 's17-drilltime-boundaries'], ['m5', 's17-evidence-report']
].map(([scene, id]) => ({ scene, id, version: '1.4.0', directory: 'cases' }));
const all = [...extras, ...required];
const [phase, ...selection] = process.argv.slice(2);
const selected = selection.length ? all.filter(c => selection.includes(c.scene)) : extras;
const browserRoot = root.replaceAll('\\', '/') + '/';
const base = 'http://127.0.0.1:8755/portal-original/index.html';

function cli(args, reportName) {
  const reportPath = reportName ? path.join(evidenceDir, reportName) : undefined;
  const env = { ...process.env };
  if (reportPath) env.S17_REPORT = reportPath;
  const out = spawnSync(process.execPath, ['tools/pw.mjs', session, ...args], { cwd: root, env, encoding: 'utf8', timeout: 95000, windowsHide: true });
  if (args[0] !== 'run-code') process.stdout.write(out.stdout ?? '');
  process.stderr.write(out.stderr ?? '');
  if (out.error) throw out.error;
  if (out.status || /### Error/.test(out.stdout ?? '')) {process.stdout.write(out.stdout??'');throw Error('Browser CLI failed: ' + args[0]);}
  if (reportPath && fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const c=all.find(x=>x.scene===report.scene);
    if(c){const p=path.join(root,'dist',c.directory,c.id),files=[];const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,ent.name);if(ent.isDirectory())walk(f);else{const b=fs.readFileSync(f);files.push({path:path.relative(p,f).replaceAll('\\','/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}}};walk(p);const manifestCanonicalSha256=crypto.createHash('sha256').update(JSON.stringify(JSON.parse(fs.readFileSync(path.join(p,'case.json'),'utf8')))).digest('hex');report.nodeArtifactProvenance={scope:'File hashes recorded by Node beside this browser run; not browser assertions',directory:path.relative(root,p).replaceAll('\\','/'),files,manifestCanonicalSha256,storedPackageMatchesDisk:report.browserPackageHashes?report.browserPackageHashes.every(f=>f.path==='case.json#canonical'?f.sha256===manifestCanonicalSha256:files.some(d=>d.path===f.path&&d.sha256===f.sha256)):null};fs.writeFileSync(reportPath,JSON.stringify(report,null,2));}
    console.log(JSON.stringify({report:reportName,scene:report.scene,passed:report.passed,failed:report.failed,exception:report.exception,storedCharacters:report.saved?.storedCharacters}));
    if (report.failed) process.exitCode = 1;
    return report;
  }
}

const common = `
const ROOT=${JSON.stringify(browserRoot)}, BASE=${JSON.stringify(base)}, ALL=${JSON.stringify(all)}, c=CASE,
 r={scope:SCOPE,scene:c?.scene,caseId:c?.id,checks:[],errors:[],errorDetails:[],requests:[],startedAt:new Date().toISOString()},
 ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,...(detail===undefined?{}:{detail})});if(!v)throw Error(name)},
 finish=()=>{r.checkedAt=new Date().toISOString();r.passed=r.checks.filter(x=>x.passed).length;r.failed=Math.max(r.checks.filter(x=>!x.passed).length,r.exception?1:0);return r;};
page.removeAllListeners('pageerror');page.removeAllListeners('request');
page.on('pageerror',e=>{r.errors.push(e.message);r.errorDetails.push(e.stack);});
page.on('request',q=>{if(/^https?:/.test(q.url()))r.requests.push(q.url());});
await page.keyboard.press('Escape');await page.mouse.up();await page.keyboard.up('Enter');await page.keyboard.up('Space');
const ready=async target=>{await target.waitForFunction(()=>{const s=globalThis.CaseInspect?.snapshot().status;return ['ready','complete','completed','done'].includes(s)},undefined,{timeout:30000});return target.evaluate(()=>CaseInspect.snapshot());};
const targetFrame=async()=>{await page.frameLocator('iframe').locator('#run').waitFor({state:'attached'});const f=page.frames().find(f=>f!==page.mainFrame());if(!f)throw Error('demo iframe not found');await f.waitForLoadState('load');if(c?.directory==='expansion-cases')await f.waitForFunction(scene=>globalThis.CaseInspect?.snapshot().sceneId===scene&&!!globalThis.S17Assistant,c.scene);else await f.waitForFunction(()=>!!(globalThis.S17Inspect??globalThis.M2Inspect)&&!!globalThis.S17Assistant);return f;};
const storedHashes=async(id)=>page.evaluate(async id=>{const rec=JSON.parse(localStorage.getItem('atlas.casepack.v2')??'[]').find(x=>x.meta.id===id);if(!rec)return null;const out=[],items=[{name:'case.json#canonical',enc:'text',data:JSON.stringify(rec.pkg)},...rec.files];for(const f of items){if(f.enc!=='text')continue;const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(f.data));out.push({path:f.name,sha256:[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join(''),bytes:new TextEncoder().encode(f.data).length});}return out;},id);
const openCase=async(tab='demo')=>{await page.goto(BASE+'#/scene/'+c.scene+'?case='+c.id+'&tab='+tab);await page.waitForFunction(id=>!!globalThis.Cases?.get(id)&&document.querySelector('.detail-head .badge-ready')?.textContent.includes(id),c.id);r.browserPackageHashes=await storedHashes(c.id);};
const activate=async(target,selector)=>{const b=target.locator(selector).first();await b.focus();await b.press('Enter');await page.keyboard.up('Enter');};
const selectTab=async(target,tab)=>{await page.keyboard.press('Escape');await page.mouse.up();await activate(target,'nav[aria-label="案例内容"] [data-tab="'+tab+'"]');await target.locator('#'+tab).waitFor({state:'visible'});};
const run=async target=>{await selectTab(target,'lab');await activate(target,'#run');return ready(target);};
const inspect=async target=>target.evaluate(()=>CaseInspect.snapshot());
const genericInspect=async target=>target.evaluate(()=>globalThis.CaseInspect?.snapshot()??globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot());
const hasReview=async target=>{const s=await target.evaluate(()=>globalThis.CaseInspect.evidence?.()??globalThis.CaseInspect.exportPayload?.()??null);if(s)return {present:!!(s.humanReview?.length||s.humanReviewHistory?.length||s.reviewHistory?.length||s.reviews?.length||s.review),keys:Object.keys(s)};return null;};
`;

function script(c, scope, body) {
  return 'async page=>{\n' + common.replace('CASE', JSON.stringify(c ?? null)).replace('SCOPE', JSON.stringify(scope)) + '\ntry{\n' + body + '\n}catch(e){r.exception=e.message;r.finalFrameStates=[];for(const f of page.frames()){try{r.finalFrameStates.push(await f.evaluate(()=>({url:location.href,statusText:document.querySelector("#status")?.textContent,state:globalThis.CaseInspect?.snapshot()})));}catch{}}}return finish();\n}';
}

if (phase === 'open') {
  cli(['open', base, '--persistent', '--profile=.playwright-cli/profile-expansion-contract', '--config=checks/playwright-local-file.json']);
  cli(['snapshot']);
} else if (phase === 'initialize') {
  cli(['run-code', script(null, 'Initialize this dedicated acceptance profile; reset only teacher import key before genuine UI imports', `
await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(BASE);
await page.evaluate(()=>{localStorage.removeItem('atlas.casepack.v2');localStorage.removeItem('atlas.casepack.blocked.v1');});await page.reload();
ok('dedicated acceptance profile starts with no imported packages',await page.evaluate(()=>CaseImport.list().length===0));
`)], 'browser-initialize.json');
} else if (phase === 'import') {
  for (const c of selected) cli(['run-code', script(c, 'Actual unmodified teacher folder import; no injected package storage', `
await page.context().setOffline(false);await page.goto(BASE);await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();
await page.locator('#imp-dir').setInputFiles(ROOT+'dist/'+c.directory+'/'+c.id);await page.waitForFunction(id=>document.getElementById('imp-id').value===id,c.id);
ok('folder manifest loaded with correct scene',await page.locator('#imp-scene').inputValue()===c.scene);
await page.getByRole('button',{name:'校验并添加',exact:true}).click();
await page.waitForFunction(scene=>location.hash==='#/scene/'+scene,c.scene); // commit routes after 620 ms
ok('actual teacher importer registers expected version',await page.evaluate(c=>Cases.get(c.id)?.version===c.version,c));
r.toast=await page.locator('#imp-toast').innerText();ok('teacher reports persistent storage rather than session-only import',!r.toast.includes('仅本次有效'),r.toast);
r.saved=await page.evaluate(()=>({items:CaseImport.list(),storedCharacters:localStorage.getItem('atlas.casepack.v2')?.length??0}));
r.browserPackageHashes=await storedHashes(c.id);
ok('genuine imported ID appears in saved package list',r.saved.items.some(x=>x.id===c.id&&x.sceneId===c.scene));
await page.reload();ok('package survives page refresh',await page.evaluate(c=>Cases.get(c.id)?.version===c.version,c));
ok('no browser JavaScript exceptions',r.errors.length===0,r.errors);
`)], 'browser-import-' + c.scene + '.json');
} else if (phase === 'interact') {
  for (const c of selected.filter(c => c.directory === 'expansion-cases')) cli(['run-code', script(c, 'Teacher original imported case: conceptual graphics, workflow, actual model calculation, changed input, reset, human review and actual download', `
await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});await openCase('bg');
ok('original background contains at least three concept SVGs',await page.locator('[data-panel=bg] svg').count()>=3,{svg:await page.locator('[data-panel=bg] svg').count()});
await page.locator('#tabs [data-tab=flow]').click();
ok('original workflow renders at least four named steps and graphics',await page.locator('[data-panel=flow] svg').count()>=4,{svg:await page.locator('[data-panel=flow] svg').count()});
await page.locator('#tabs [data-tab=demo]').click();const f=await targetFrame();
await selectTab(f,'background');ok('standalone background has at least three actual SVGs',await f.locator('#background svg').count()>=3);
await selectTab(f,'workflow');
const buttons=f.locator('#workflow [data-step]'),stepCount=await buttons.count();r.workflow={stepControls:stepCount};
if(stepCount){for(let i=0;i<stepCount;i++){await buttons.nth(i).click();const n=await buttons.nth(i).getAttribute('aria-selected')??await buttons.nth(i).getAttribute('aria-pressed');ok('workflow step '+(i+1)+' becomes selected',n==='true');}}
else {const figs=f.locator('#workflow svg');r.workflow.figures=await figs.count();for(let i=0;i<await figs.count();i++){await figs.nth(i).scrollIntoViewIfNeeded();ok('workflow graphic '+(i+1)+' is actually displayable',await figs.nth(i).isVisible());}}
const initial=await run(f);ok('calculation reaches completed status with real metrics',initial.sceneId===c.scene&&initial.caseId===c.id&&initial.metrics&&Object.keys(initial.metrics).length>0,initial.status);r.default={status:initial.status,metrics:initial.metrics,params:initial.params,runId:initial.runId};
const param=f.locator('#lab input[type=range]').first();
if(await param.count()) {await param.focus();await param.press('ArrowRight');await param.dispatchEvent('change');}
else {const p=f.locator('#lab input[type=number]').first();const v=Number(await p.inputValue()),step=Number(await p.getAttribute('step'))||1;await p.fill(String(v+step));await p.dispatchEvent('input');await p.dispatchEvent('change');}
const stale=await inspect(f);ok('changing a calculation input invalidates export and marks stale',stale.status==='stale'&&await f.locator('#export').isDisabled(),{status:stale.status,exportDisabled:await f.locator('#export').isDisabled()});
const changed=await run(f);ok('changed input recomputes a new run',String(changed.runId)!==String(initial.runId));
await f.locator('#reset').click();let reset=await inspect(f);if(!['ready','complete','completed','done'].includes(reset.status))reset=await run(f);else reset=await ready(f);
ok('reset restores default model metrics',JSON.stringify(reset.metrics)===JSON.stringify(initial.metrics));
const note=f.locator('#review-note');if(await note.count())await note.fill('浏览器验收：已核对当前曲线、参数和候选证据，保留原模型结果。');
const confirm=f.locator('#review-confirm');if(await confirm.count())await confirm.check();
const reviewChoice=f.locator('#review-choice, #review-label, #review-kind').first();if(await reviewChoice.count()){const n=await reviewChoice.locator('option').count();if(n>1)await reviewChoice.selectOption({index:1});}
const review=f.locator('#review, #review-save').first();if(await review.count()){await review.click();r.reviewSnapshot=await inspect(f);r.review=await hasReview(f);const containers=f.locator('#review-log, #review-status, #review-state, #review-message, #review-history, #reviews');r.reviewVisibleText=await containers.allTextContents();ok('human opinion is recorded without altering model metrics',JSON.stringify(r.reviewSnapshot.metrics)===JSON.stringify(reset.metrics)&&((r.review?.present)||r.reviewSnapshot.reviewCount>0||r.reviewSnapshot.reviews>0||r.reviewSnapshot.review||r.reviewVisibleText.some(t=>/已保存|已记录|已确认|复核意见已记录|已登记/.test(t))),{snapshot:r.reviewSnapshot,review:r.review,text:r.reviewVisibleText});}
const downloadPromise=page.waitForEvent('download');await f.locator('#export').click();const download=await downloadPromise;
r.download={suggestedFilename:download.suggestedFilename(),relativePath:'output/exports/v1.7/'+c.scene+'-original.json'};
await download.saveAs(ROOT+r.download.relativePath);ok('actual browser creates JSON evidence download',download.suggestedFilename().endsWith('.json'));
if(['g1','d1','pr1','t1'].includes(c.scene)){await f.locator('#run').scrollIntoViewIfNeeded();await page.screenshot({path:ROOT+'output/playwright/expansion-2026-10-24/'+c.scene+'-original.png'});}
await page.reload();const fresh=await targetFrame(),recomputed=await run(fresh);
ok('page refresh and repeat calculation preserve default metrics',JSON.stringify(recomputed.metrics)===JSON.stringify(initial.metrics));
ok('browser calculations use no external HTTP services',r.requests.every(u=>u.startsWith('http://127.0.0.1:8755/')));ok('no JavaScript exceptions during interaction',r.errors.length===0,r.errors);
`)], 'browser-interaction-' + c.scene + '.json');
} else if (phase === 'mandatory') {
  for (const c of selected.filter(c => c.directory === 'cases')) cli(['run-code', script(c, 'Original five required cases remain runnable among all imported packages', `
await page.context().setOffline(false);await openCase();const f=await targetFrame();await selectTab(f,'lab');await f.locator('#run').click();
await f.locator('#status').filter({hasText:'计算完成'}).waitFor({timeout:25000});const state=await genericInspect(f);r.metrics=state.run?.metrics??state.metrics;
ok('required case runs with evaluation metrics',r.metrics&&Object.keys(r.metrics).length>0);r.runId=state.run?.id??state.runId;
const dp=page.waitForEvent('download');await f.locator('#export').click();const d=await dp;r.download='output/exports/v1.7/'+c.scene+'-original.json';await d.saveAs(ROOT+r.download);
ok('required case downloads actual JSON',d.suggestedFilename().endsWith('.json'));await page.reload();const ff=await targetFrame();await selectTab(ff,'lab');await ff.locator('#run').click();await ff.locator('#status').filter({hasText:'计算完成'}).waitFor({timeout:25000});const after=await genericInspect(ff);
ok('required case reruns after refresh with same metrics',JSON.stringify(after.run?.metrics??after.metrics)===JSON.stringify(r.metrics));ok('no JavaScript exceptions',r.errors.length===0,r.errors);
`)], 'browser-mandatory-' + c.scene + '.json');
} else if (phase === 'offline') {
  for (const c of selected.filter(c => c.directory === 'expansion-cases')) cli(['run-code', script(c, 'Standalone file URL with browser network disabled, real local calculation and assistant workflow navigation; mobile readability', `
await page.context().setOffline(true);await page.setViewportSize({width:1440,height:1000});await page.goto('file:///'+ROOT+'dist/'+c.directory+'/'+c.id+'/demo/index.html');
await selectTab(page,'background');ok('offline background graphics render',await page.locator('#background svg').count()>=3);
await selectTab(page,'workflow');const wb=page.locator('#workflow [data-step]'),wn=await wb.count();if(wn)await wb.nth(wn-1).click();r.workflow={stepControls:wn,visibleSvg:await page.locator('#workflow svg:visible').count()};ok('offline workflow graphics render in selected step or static gallery',wn>=4?r.workflow.visibleSvg>=1:await page.locator('#workflow svg').count()>=4,r.workflow);
const initial=await run(page);ok('offline local model produces metrics',initial.sceneId===c.scene&&initial.metrics&&Object.keys(initial.metrics).length>0);r.metrics=initial.metrics;
await page.locator('#s17-agent-launcher').click();await page.locator('#s17-agent-input').fill('解释当前页');await page.locator('#s17-agent-send').click();
r.assistant=await page.locator('#s17-agent-panel').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));ok('standalone assistant defaults to the requested compact phone panel',r.assistant.width>=350&&r.assistant.width<=420&&r.assistant.height<=720,r.assistant);
await page.locator('[data-ag-tab=workflow]').last().click();ok('offline assistant navigates to real workflow',await page.locator('#workflow').isVisible());await page.locator('#s17-agent-close').click();
await page.setViewportSize({width:390,height:844});await selectTab(page,'background');
r.mobile=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,font:parseFloat(getComputedStyle(document.body).fontSize),paragraphs:[...document.querySelectorAll('#background p')].slice(0,5).map(p=>({font:parseFloat(getComputedStyle(p).fontSize),class:p.className})),mainParagraphs:[...document.querySelectorAll('#background p')].filter(p=>!p.closest('aside')&&!p.matches('.eyebrow,.note,.kicker')&&p.textContent.trim().length>35).slice(0,5).map(p=>parseFloat(getComputedStyle(p).fontSize))}));
ok('390px viewport has no whole-page horizontal overflow',r.mobile.document<=r.mobile.viewport+1&&r.mobile.body<=r.mobile.viewport+1,r.mobile);
ok('body and main explanatory paragraphs are at least 17px',r.mobile.font>=17&&r.mobile.mainParagraphs.every(n=>n>=17),r.mobile);
await selectTab(page,'lab');await page.locator('#run').scrollIntoViewIfNeeded();ok('mobile run and reset controls are reachable',await page.locator('#run').isVisible()&&await page.locator('#reset').isVisible());
if(['g1','pr1'].includes(c.scene))await page.screenshot({path:ROOT+'output/playwright/expansion-2026-10-24/'+c.scene+'-offline-mobile.png'});
await page.locator('#s17-agent-launcher').click();r.mobileAssistant=await page.locator('#s17-agent-panel').evaluate(el=>{const b=el.getBoundingClientRect(),send=document.querySelector('#s17-agent-send').getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,inputFont:parseFloat(getComputedStyle(document.querySelector('#s17-agent-input')).fontSize),send:{left:send.left,right:send.right,top:send.top,bottom:send.bottom}};});ok('mobile assistant composer and send control fit viewport with 18px input',r.mobileAssistant.left>=0&&r.mobileAssistant.right<=390&&r.mobileAssistant.top>=0&&r.mobileAssistant.bottom<=844&&r.mobileAssistant.inputFont>=18&&r.mobileAssistant.send.right<=390&&r.mobileAssistant.send.bottom<=844,r.mobileAssistant);if(c.scene==='pr1')await page.screenshot({path:ROOT+'output/playwright/expansion-2026-10-24/pr1-offline-mobile-assistant.png'});await page.locator('#s17-agent-close').click();
ok('file offline path makes zero HTTP requests',r.requests.length===0,r.requests);ok('no JavaScript exceptions offline',r.errors.length===0,r.errors);await page.context().setOffline(false);
`)], 'browser-offline-' + c.scene + '.json');
} else if (phase === 'persistence') {
  cli(['run-code', script(null, 'Persistence audit after real CLI close/open of the dedicated browser profile', `
await page.context().setOffline(false);await page.goto(BASE);r.saved=await page.evaluate(()=>({items:CaseImport.list(),storedCharacters:localStorage.getItem('atlas.casepack.v2')?.length??0}));
for(const c of ALL)ok(c.scene+' package remains registered after browser restart',await page.evaluate(c=>Cases.get(c.id)?.version===c.version,c));
ok('all 17 self-made packages survived browser restart',r.saved.items.filter(x=>ALL.some(c=>c.id===x.id)).length===17,{count:r.saved.items.length,storedCharacters:r.saved.storedCharacters});
r.savedPackageHashes=[];for(const c of ALL)r.savedPackageHashes.push({scene:c.scene,id:c.id,files:await storedHashes(c.id)});
`)], 'browser-persistence.json');
} else if(phase==='restart-run'){
  for(const c of selected){const prior=JSON.parse(fs.readFileSync(path.join(evidenceDir,(c.directory==='cases'?'browser-mandatory-':'browser-interaction-')+c.scene+'.json'),'utf8')),expected=prior.default?.metrics??prior.metrics;cli(['run-code',script(c,'Repeat actual calculation after CLI browser close/open; compare with earlier computed default metrics',`
await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});await openCase();const f=await targetFrame();let state;
r.interactionMode='Native keyboard Enter for iframe tabs/run; Escape and released input state before activation. No evaluate-click and no direct run invocation.';
if(c.directory==='expansion-cases')state=await run(f);else{await selectTab(f,'lab');await activate(f,'#run');await f.locator('#status').filter({hasText:'计算完成'}).waitFor({timeout:25000});state=await genericInspect(f);}
r.metrics=state.run?.metrics??state.metrics;ok('real computation completes after browser restart',!!r.metrics);r.metricsSha256=await page.evaluate(async metrics=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(metrics)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');},r.metrics);ok('restart calculation matches earlier computed default',r.metricsSha256===${JSON.stringify(crypto.createHash('sha256').update(JSON.stringify(expected)).digest('hex'))});
ok('standalone assistant initializes in original sandbox after restart',await f.locator('#s17-agent-launcher').count()===1);await activate(f,'#s17-agent-launcher');r.assistant=await f.locator('#s17-agent-panel').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,inputFont:parseFloat(getComputedStyle(document.querySelector('#s17-agent-input')).fontSize)}));ok('current imported assistant opens as compact phone panel with 18px input',r.assistant.width>=350&&r.assistant.width<=420&&r.assistant.height<=720&&r.assistant.inputFont>=18,r.assistant);
await f.locator('#s17-agent-input').fill('解释当前页');await activate(f,'#s17-agent-send');await activate(f,'[data-ag-tab=workflow]');ok('original sandbox local assistant navigates to actual workflow',await f.locator('#workflow').isVisible());await activate(f,'#s17-agent-close');await selectTab(f,'lab');const preserved=await genericInspect(f);ok('assistant workflow navigation preserves completed calculation',JSON.stringify(preserved.run?.metrics??preserved.metrics)===JSON.stringify(r.metrics));ok('no JavaScript exceptions after restart',r.errors.length===0,r.errors);
`)],'browser-restart-run-'+c.scene+'.json');}
} else if(phase==='visual'){
  for(const c of selected)cli(['run-code',script(c,'Representative screenshot of actual computed visualization in teacher original iframe',`
await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});await openCase();const f=await targetFrame();const s=await run(f);
const selector=({g1:'#observed-map',d1:'#surface',pr1:'#card',t1:'#flow-chart'})[c.scene];if(!selector)throw Error('No representative chart selector for this scene');await f.locator(selector).scrollIntoViewIfNeeded();ok('actual chart is visible after completed calculation',await f.locator(selector).isVisible()&&!!s.metrics);
r.screenshot='output/playwright/expansion-2026-10-24/'+c.scene+'-visualization.png';await page.screenshot({path:ROOT+r.screenshot});ok('no JavaScript exceptions',r.errors.length===0,r.errors);
`)],'browser-visual-'+c.scene+'.json');
} else if (phase === 'firstbreak') {
  const sample = { scene: 's3', id: 'firstbreak-stalta', version: '1.0.0' };
  cli(['run-code', script(sample, 'Teacher supplied firstbreak example still imports and reacts to controls alongside 17 self-made cases', `
await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});await page.goto(BASE);
await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+'portal-original/firstbreak-pick-case');
await page.waitForFunction(id=>document.getElementById('imp-id').value===id,c.id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.waitForFunction(()=>location.hash==='#/scene/s3');
ok('teacher example imported through its unchanged entry',await page.evaluate(id=>!!Cases.get(id),c.id));await page.locator('#tabs [data-tab=demo]').click();const f=page.frameLocator('iframe');await f.locator('#trace').waitFor();
r.before=await f.locator('#trace').innerHTML();const noise=f.locator('#noise');await noise.focus();await noise.press('ArrowRight');await noise.dispatchEvent('change');r.after=await f.locator('#trace').innerHTML();
ok('teacher firstbreak visual responds to changed noise control',r.before!==r.after);r.saved=await page.evaluate(()=>CaseImport.list());ok('all self-made packages stay present after teacher sample import',ALL.every(c=>r.saved.some(x=>x.id===c.id)));
ok('no JavaScript exceptions in teacher sample',r.errors.length===0,r.errors);
`)], 'browser-firstbreak.json');
} else if (phase === 'close') {
  cli(['close']);
} else if (phase === 'verify-exports') {
  const report={scope:'Node verification of files genuinely downloaded by browser; not a browser pass',checkedAt:new Date().toISOString(),cases:[],checks:[]};
  const metrics=j=>j.metrics??j.run?.metrics??j.evaluation?.metrics;
  for(const c of all){
    const p=path.join(exportDir,c.scene+'-original.json');
    if(!fs.existsSync(p)){report.checks.push({scene:c.scene,passed:false,name:'actual download exists'});continue;}
    const bytes=fs.readFileSync(p),j=JSON.parse(bytes),claims=j.claims??j.evidence?.claims??[],sources=j.sources??j.evidence?.sources??[];
    const humanReview=j.humanReview??j.manualReview??j.reviews??j.reviewHistory??j.review??null;
    const entry={scene:c.scene,caseId:j.caseId,caseVersion:j.caseVersion,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),keys:Object.keys(j),claimCount:claims.length,sourceCount:sources.length,metrics:metrics(j),humanReview};
    report.cases.push(entry);
    report.checks.push({scene:c.scene,name:'download case ID/version',passed:j.caseId===c.id&&j.caseVersion===c.version});
    if(c.directory==='expansion-cases'){
      report.checks.push({scene:c.scene,name:'run identity, observation sources and evidence claims',passed:!!j.runId&&!!j.runConfig&&sources.length>0&&claims.length>0});
      report.checks.push({scene:c.scene,name:'claims reference existing versioned sources',passed:claims.every(cl=>(cl.sourceRefs??[]).length>0&&(cl.sourceRefs??[]).every(ref=>sources.some(s=>s.sourceRecordId===ref.sourceRecordId&&s.sourceVersion===ref.sourceVersion)))});
      report.checks.push({scene:c.scene,name:'actual human review is included in downloaded evidence',passed:Array.isArray(humanReview)?humanReview.length>0:!!(humanReview?.note||humanReview?.history?.length||(humanReview?.choice&&humanReview.choice!=='pending'))});
    }else{
      const prior=path.join(root,'output/exports/v1.4/original-http-'+c.scene+'.json');
      if(fs.existsSync(prior)){const b=fs.readFileSync(prior),old=JSON.parse(b);entry.previousActualDownload={path:path.relative(root,prior).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(b).digest('hex')};report.checks.push({scene:c.scene,name:'new knowledge presentation preserves metrics from prior actual browser export',passed:JSON.stringify(metrics(j))===JSON.stringify(metrics(old))});}
    }
  }
  report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.length-report.passed;fs.writeFileSync(path.join(evidenceDir,'browser-download-file-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failed:report.failed,cases:report.cases.length}));if(report.failed)process.exitCode=1;
} else if(phase==='summarize'){
  const load=name=>{const p=path.join(evidenceDir,name);return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;};
  const groups={imports:all.map(c=>load('browser-import-'+c.scene+'.json')),interactions:extras.map(c=>load('browser-interaction-'+c.scene+'.json')),offline:extras.map(c=>load('browser-offline-'+c.scene+'.json')),mandatory:required.map(c=>load('browser-mandatory-'+c.scene+'.json')),persistence:[load('browser-persistence.json')],restartRuns:all.map(c=>load('browser-restart-run-'+c.scene+'.json')),firstbreak:[load('browser-firstbreak.json')]};
  const report={scope:'Actual isolated Chrome CLI execution on teacher original and standalone file pages',browserExecuted:true,checkedAt:new Date().toISOString(),groups:{},browserPassed:0,browserFailed:0,missingReports:0};
  const prefix={imports:'browser-import-',interactions:'browser-interaction-',offline:'browser-offline-',mandatory:'browser-mandatory-',restartRuns:'browser-restart-run-'};
  for(const[k,rs]of Object.entries(groups)){
    report.groups[k]={expected:rs.length,executed:rs.filter(Boolean).length,complete:rs.filter(x=>x&&x.failed===0).length,reports:rs.map(x=>x?{path:'handoff/expansion-2026-10-24/'+(prefix[k]?prefix[k]+x.scene:'browser-'+k)+'.json',scene:x.scene,passed:x.passed,failed:x.failed,checkedAt:x.checkedAt,exception:x.exception,requests:x.requests?.length,errors:x.errors,interactionMode:x.interactionMode}:null)};
    for(const r of rs){if(!r){report.missingReports++;continue;}report.browserPassed+=r.passed??0;report.browserFailed+=r.failed??0;}
  }
  const persist=load('browser-persistence.json');report.storage=persist?.saved;
  const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
  report.nodeCurrentPackageVerification={scope:'Node compares browser-read actual stored package hashes with current disk files, not additional browser assertions',cases:[]};
  for(const c of all){const r=load('browser-import-'+c.scene+'.json'),stored=persist?.savedPackageHashes?.find(x=>x.id===c.id)?.files,folder=path.join(root,'dist',c.directory,c.id),match=files=>!!files?.length&&files.every(f=>f.path==='case.json#canonical'?f.sha256===hash(JSON.stringify(JSON.parse(fs.readFileSync(path.join(folder,'case.json'),'utf8')))):fs.existsSync(path.join(folder,f.path))&&f.sha256===hash(fs.readFileSync(path.join(folder,f.path))));report.nodeCurrentPackageVerification.cases.push({scene:c.scene,caseId:c.id,importedPackageMatchesCurrentDisk:match(r?.browserPackageHashes),restartedStoredPackageMatchesCurrentDisk:match(stored)});}
  report.nodeCurrentPackageVerification.passed=report.nodeCurrentPackageVerification.cases.filter(x=>x.importedPackageMatchesCurrentDisk&&x.restartedStoredPackageMatchesCurrentDisk).length;report.nodeCurrentPackageVerification.failed=17-report.nodeCurrentPackageVerification.passed;
  const downloads=load('browser-download-file-verification.json');report.nodeDownloadedFileVerification={path:'handoff/expansion-2026-10-24/browser-download-file-verification.json',passed:downloads?.passed,failed:downloads?.failed,actualDownloads:downloads?.cases.length};report.buildLock=load('build-lock.json')?.createdAt;report.historicalAttemptsExcluded=['browser-import-before-readability-fix.json','browser-harness-selector-attempt.json','browser-offline-harness-criteria-attempt.json','browser-runtime-before-startup-and-input-fixes.json','browser-restart-harness-attempt.json','browser-restart-input-delivery-attempt.json'];
  fs.writeFileSync(path.join(evidenceDir,'browser-summary.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({browserPassed:report.browserPassed,browserFailed:report.browserFailed,missingReports:report.missingReports,currentPackages:report.nodeCurrentPackageVerification.passed,groups:Object.fromEntries(Object.entries(report.groups).map(([k,v])=>[k,{expected:v.expected,executed:v.executed,complete:v.complete}]))}));if(report.browserFailed||report.missingReports||report.nodeCurrentPackageVerification.failed||downloads?.failed)process.exitCode=1;
} else {
  console.log('Usage: node checks/browser-expansion-suite.mjs open|initialize|import|interact|mandatory|offline|persistence|firstbreak|close|verify-exports|summarize [scene ...]');
}
