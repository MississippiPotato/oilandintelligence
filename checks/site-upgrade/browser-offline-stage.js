async page=>{
 const FILE='file:///G:/可视化导论/5/portal/index.html';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_offline_portal_3D_search_and_forced_WebGL_fallback',checks:[],errors:[],httpRequests:[],backgroundVisibility:null};
 const err=e=>r.errors.push(e.message),request=req=>{if(/^https?:/.test(req.url()))r.httpRequests.push(req.url());};
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 page.on('pageerror',err);page.on('request',request);let fallback;
 try{
  await page.context().setOffline(true);await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(FILE+'#/stage/mudlogging');await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready');
  ok('Local ordinary-script 3D renders with network offline',await page.evaluate(()=>location.protocol==='file:'&&S17MudStage.snapshot().scene.revision==='180'));
  await page.locator('select[data-ms-scenario]').selectOption('pause');await page.locator('[data-ms-seek]').fill('450');
  ok('Offline time chart and transport use the same cumulative calculation',await page.evaluate(()=>{const s=S17MudStage.snapshot();return s.cumulativeVolume_m3===7.5&&s.transportProgress===.375&&s.arrivalTime_s===780;}));
  await page.screenshot({path:'G:/可视化导论/5/output/playwright/site-upgrade-offline-3d.png'});
  await page.locator('select[data-ms-scenario]').selectOption('normal');await page.locator('[data-ms-play]').click();
  fallback=await page.context().newPage();await fallback.goto('about:blank');await fallback.bringToFront();await page.waitForTimeout(200);
  const back=await page.evaluate(()=>({hidden:document.hidden,state:S17MudStage.snapshot()}));r.backgroundVisibility={hidden:back.hidden,playing:back.state.playing,raf:back.state.rafScheduled};
  if(back.hidden)ok('Background browser tab stops animation',!back.state.rafScheduled&&!back.state.playing);else r.backgroundVisibility.note='Headless browser keeps this page visible; actual background-tab acceptance remains unexercised, separate from the passed offscreen check.';
  await fallback.setViewportSize({width:390,height:844});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/i.test(type))return null;return original.call(this,type,...args);};});
  await fallback.goto(FILE+'?fallback-check=1#/stage/mudlogging');await fallback.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await fallback.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='fallback');
  const two=await fallback.evaluate(()=>S17MudStage.snapshot());
  ok('Forced unavailable WebGL gives an interactive two-dimensional fallback',two.view==='2d'&&two.fallbackReason==='webgl-unavailable'&&await fallback.locator('[data-ms-diagram] svg').count()===1,two.fallbackReason);
  await fallback.locator('select[data-ms-scenario]').selectOption('pause');await fallback.locator('[data-ms-seek]').fill('450');
  ok('Fallback controls still compute stopped-pump progress',await fallback.evaluate(()=>S17MudStage.snapshot().transportProgress===.375));
  await fallback.screenshot({path:'G:/可视化导论/5/output/playwright/site-upgrade-2d-fallback-mobile.png'});await fallback.close();fallback=null;await page.bringToFront();
  await page.keyboard.press('Control+k');await page.locator('#s17-search-input').fill('迟到');await page.locator('[data-section-id="s17-mudgas-context:bg:1"]').click();await page.waitForFunction(()=>S17Search.snapshot().lastNavigation?.status==='focused');
  ok('Offline search loads only the chosen case and focuses its chapter',await page.evaluate(()=>document.getElementById('learn-s17-mudgas-context-bg-1').contains(document.activeElement)&&S17CaseLoader.snapshot().filter(s=>s.status==='ready'&&s.id!=='welllog-layer').length===1));
  ok('Offline portal makes zero HTTP requests',r.httpRequests.length===0,r.httpRequests);ok('No uncaught main-page offline errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Offline and fallback protocol completed',passed:false,detail:e.stack});}
 finally{if(fallback)await fallback.close();await page.context().setOffline(false);page.removeListener('pageerror',err);page.removeListener('request',request);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
