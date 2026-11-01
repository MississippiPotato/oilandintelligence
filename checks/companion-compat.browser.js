async page=>{
 const ROOT='G:/可视化导论/5/',URL='http://127.0.0.1:8755/',r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_offline_and_teacher_import',checks:[],errors:[],external:[],downloads:[]};
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const err=e=>r.errors.push(e.message),request=q=>{if(/^https?:/.test(q.url())&&!q.url().startsWith(URL))r.external.push(q.url());};page.on('pageerror',err);page.on('request',request);page.setDefaultTimeout(20000);
 const ready=async f=>f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const start=Date.now(),t=setInterval(()=>{if(globalThis.CaseInspect?.snapshot?.().status==='ready'){clearInterval(t);resolve(true);}else if(Date.now()-start>20000){clearInterval(t);reject(Error('case not ready'));}},30);}));
 try{
  await page.context().setOffline(true);await page.setViewportSize({width:1440,height:1000});
  await page.goto('about:blank');await page.goto('file:///'+ROOT+'dist/expansion-cases/s17x-g1-remote-lithology/demo/index.html');await page.waitForFunction(()=>globalThis.S17Live2D?.state==='ready');
  ok('Standalone file loads Live2D automatically with networking offline',await page.evaluate(()=>!S17Assistant.snapshot().open&&S17Live2D.state==='ready'&&!globalThis.S17EmbeddedDemo));
  ok('Standalone case retains its three-part navigation',await page.locator('nav [data-tab]').count()===3);
  await page.locator('nav [data-tab="lab"]').click();await ready(page);const before=await page.evaluate(()=>CaseInspect.snapshot().runId);
  await page.locator('#shadow').fill('0.5');await page.waitForFunction(n=>CaseInspect.snapshot().status==='ready'&&CaseInspect.snapshot().runId!==n,before);
  ok('Offline standalone input still actually recalculates',await page.evaluate(()=>CaseInspect.snapshot().params.shadow===.5));
  const wait=page.waitForEvent('download');await page.locator('#export').click();const download=await wait;const saved='handoff/companion-ui-2026-11-01/offline-g1-result.json';await download.saveAs(saved);r.downloads.push(saved);ok('Offline result is actually downloaded',!!download.suggestedFilename());
  await page.goto('file:///'+ROOT+'portal/index.html#/scene/m2?case=s17-mudgas-context&tab=demo');const embedded=page.frameLocator('iframe');await embedded.locator('[data-s17-embedded-lab]').waitFor();
  ok('Offline enhanced portal opens the lab without a nested navigation',await embedded.locator('body').evaluate(()=>S17EmbeddedDemo.snapshot().enabled&&[...document.querySelectorAll('nav [data-part]')].every(n=>!n.getBoundingClientRect().height)));
  const flowLink=embedded.locator('[data-part="workflow"]').filter({hasText:'六步'});await flowLink.click();await page.waitForFunction(()=>location.hash.includes('tab=flow'));
  ok('Experiment link opens the outer workflow instead of a hidden inner page',await page.locator('#tabs [data-tab="flow"]').evaluate(n=>n.classList.contains('on')));
  await page.context().setOffline(false);await page.goto(URL+'portal-original/index.html#/cases');
  await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+'dist/expansion-cases/s17x-g1-remote-lithology');
  await page.waitForFunction(()=>document.getElementById('imp-id')?.value==='s17x-g1-remote-lithology');await page.getByRole('button',{name:'校验并添加',exact:true}).click();
  await page.waitForFunction(()=>globalThis.CaseImport?.list().some(c=>c.id==='s17x-g1-remote-lithology'));
  ok('Original teacher portal accepts the unchanged five-file contract',true);
  await page.locator('#tabs [data-tab="flow"]').click();ok('Original portal still renders workflow content',(await page.locator('[data-panel="flow"]').innerText()).length>300);
  await page.locator('#tabs [data-tab="demo"]').click();let f=page.frameLocator('iframe');await f.locator('nav [data-tab="lab"]').click();await ready(f);
  ok('Teacher-hosted original demonstration still runs',await f.locator('body').evaluate(()=>CaseInspect.snapshot().status==='ready'&&!S17EmbeddedDemo.snapshot().enabled));
  await page.reload();f=page.frameLocator('iframe');await f.locator('nav [data-tab="lab"]').click();await ready(f);const prior=await f.locator('body').evaluate(()=>CaseInspect.snapshot().runId);
  await f.locator('#shadow').fill('0.5');await f.locator('body').evaluate(n=>new Promise((resolve,reject)=>{const start=Date.now(),t=setInterval(()=>{const s=CaseInspect.snapshot();if(s.status==='ready'&&s.runId!==n){clearInterval(t);resolve(true);}else if(Date.now()-start>20000){clearInterval(t);reject(Error('teacher rerun timeout'));}},30);}),prior);
  ok('Original import survives refresh and recalculates after an input change',await f.locator('body').evaluate(()=>CaseInspect.snapshot().params.shadow===.5));
  ok('No external network dependency was requested',r.external.length===0,r.external);ok('No uncaught offline or import errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Compatibility path completed',passed:false,detail:e.message});}
 finally{await page.context().setOffline(false);page.removeListener('pageerror',err);page.removeListener('request',request);}
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
