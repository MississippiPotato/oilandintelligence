async page=>{
 const BASE='https://mississippipotato.github.io/oilandintelligence/';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_published_GitHub_Pages_smoke',base:BASE,checks:[],errors:[],failedResponses:[]};
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const error=e=>r.errors.push(e.message),response=q=>{if(q.url().startsWith(BASE)&&q.status()>=400)r.failedResponses.push({url:q.url(),status:q.status()});};
 page.on('pageerror',error);page.on('response',response);page.setDefaultTimeout(20000);
 try{
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(BASE+'?release=1c0cbe3',{timeout:45000});await page.waitForFunction(()=>globalThis.S17HomeReady?.());
  const home=await page.evaluate(()=>({url:location.href,cases:S17CaseCatalog.cases.length,teacher:S17CaseCatalog.teacherCases.length,heavy:performance.getEntriesByType('resource').filter(e=>/case-content|mudlogging-3d|pixi|cubism|live2d-data/.test(e.name)).map(e=>e.name)}));
  ok('Public root enters the deployed portal with 65 authored cases',home.url.includes('/portal/index.html')&&home.cases===65&&home.teacher===1,home);
  ok('Public untouched homepage requests no body, 3D or avatar heavy script',home.heavy.length===0,home.heavy);
  await page.goto(BASE+'portal/index.html?release=1c0cbe3#/stage/mudlogging');await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready');
  ok('Public local r180 bundle creates the shared 3D scene',await page.evaluate(()=>S17MudStage.snapshot().scene.revision==='180'));
  await page.locator('[data-ms-phase="1"]').click();ok('Published illustrated phase changes the real camera',await page.evaluate(()=>S17MudStage.snapshot().camera==='return'&&S17MudStage.snapshot().time_s===336));
  await page.locator('select[data-ms-scenario]').selectOption('pause');await page.locator('[data-ms-seek]').fill('450');
  ok('Published stopped-pump calculation preserves transport pause',await page.evaluate(()=>{const s=S17MudStage.snapshot();return s.cumulativeVolume_m3===7.5&&s.transportProgress===.375&&s.arrivalTime_s===780;}));
  await page.screenshot({path:'G:/可视化导论/5/output/playwright/site-upgrade-published-desktop.png'});
  await page.keyboard.press('Control+k');await page.locator('#s17-search-input').fill('温漂');
  await page.locator('[data-case-id="s17x-co3-completion-seal-test"][data-section-id]:not([data-section-id=""])').first().click();await page.waitForFunction(()=>S17Search.snapshot().lastNavigation?.status==='focused');
  ok('Public search loads and focuses the selected new-case chapter',await page.evaluate(()=>location.hash.includes('case=s17x-co3-completion-seal-test')&&location.hash.includes('section=')&&document.activeElement.matches('h2,h3')));
  await page.reload();await page.waitForFunction(()=>S17Search.snapshot().lastNavigation?.status==='focused');ok('Public chapter deep link survives refresh',await page.evaluate(()=>document.activeElement.matches('h2,h3')));
  await page.locator('#tabs [data-tab="demo"]').click();const f=page.frameLocator('iframe');await f.locator('nav [data-tab="demo"]').click();
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(globalThis.CaseInspect?.snapshot?.().status==='ready'){clearInterval(timer);resolve(true);}else if(Date.now()-start>16000){clearInterval(timer);reject(Error('Published demonstration not ready'));}},30);}));
  const before=await f.locator('body').evaluate(()=>JSON.stringify(CaseInspect.evidence().inference));
  await f.locator('[data-param="drift"]').focus();await f.locator('[data-param="drift"]').press('End');
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{const s=CaseInspect.snapshot();if(s.status==='ready'&&s.params?.drift===3){clearInterval(timer);resolve(true);}else if(Date.now()-start>16000){clearInterval(timer);reject(Error('Published input did not recalculate'));}},30);}));
  const after=await f.locator('body').evaluate(()=>JSON.stringify(CaseInspect.evidence().inference));ok('Published new-case demo changes its actual inference',before!==after,{sandbox:await page.locator('iframe').getAttribute('sandbox')});
  await page.setViewportSize({width:390,height:844});await page.locator('#s17-search-open').click();await page.locator('#s17-search-input').fill('候凝');
  ok('Public 390px header and search modal fit the viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.ss-dialog').getBoundingClientRect().right<=innerWidth));
  ok('Public paths return no failing site resources',r.failedResponses.length===0,r.failedResponses);ok('Published interactions have no uncaught script errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Published-site smoke completed',passed:false,detail:e.message});}
 finally{page.removeListener('pageerror',error);page.removeListener('response',response);}
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
