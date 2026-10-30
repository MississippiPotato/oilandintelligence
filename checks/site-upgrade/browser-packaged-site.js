async page=>{
 const FILE='__PACKAGED_FILE__';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_extracted_offline_site_smoke',url:FILE,checks:[],errors:[],httpRequests:[]};
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const error=e=>r.errors.push(e.message),request=q=>{if(/^https?:/.test(q.url()))r.httpRequests.push(q.url());};
 page.on('pageerror',error);page.on('request',request);
 try{
  await page.context().setOffline(true);await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('about:blank');await page.goto(FILE+'#/stage/mudlogging');await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready');
  ok('Extracted offline archive renders its local Three.js r180 scene',await page.evaluate(()=>S17MudStage.snapshot().scene.revision==='180'));
  ok('Packaged scene contains five illustrated material-flow frames',await page.locator('.ms-frame-picture').count()===5);
  await page.locator('[data-ms-phase="3"]').click();ok('Packaged storyboard changes the actual camera and time',await page.evaluate(()=>{const s=S17MudStage.snapshot();return s.time_s===680&&s.camera==='surface';}),await page.evaluate(()=>S17MudStage.snapshot()));
  await page.locator('select[data-ms-scenario]').selectOption('pause');await page.locator('[data-ms-seek]').fill('450');
  ok('Packaged stopped-pump calculation retains cumulative volume and transport',await page.evaluate(()=>{const s=S17MudStage.snapshot();return s.cumulativeVolume_m3===7.5&&s.transportProgress===.375&&s.arrivalTime_s===780;}));
  await page.keyboard.press('Control+k');await page.locator('#s17-search-input').fill('构造图闭合');
  await page.locator('[data-case-id="s17x-g3-closure-spill"]').first().click();await page.waitForFunction(()=>document.querySelector('[data-s17-case-id="s17x-g3-closure-spill"][data-s17-case-ready="true"]'));
  ok('Packaged search loads a new case body through relative file paths',await page.evaluate(()=>location.hash.includes('case=s17x-g3-closure-spill')));
  await page.locator('#tabs [data-tab="demo"]').click();const f=page.frameLocator('iframe');await f.locator('nav [data-tab="lab"]').click();
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(globalThis.CaseInspect?.snapshot?.().status==='ready'){clearInterval(timer);resolve(true);}else if(Date.now()-start>16000){clearInterval(timer);reject(Error('Packaged case did not become ready'));}},30);}));
  const before=await f.locator('body').evaluate(()=>CaseInspect.evidence());await f.locator('[data-param="saddle"]').focus();await f.locator('[data-param="saddle"]').press('End');
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{const s=CaseInspect.snapshot();if(s.params?.saddle===65&&s.status==='ready'){clearInterval(timer);resolve(true);}else if(Date.now()-start>16000){clearInterval(timer);reject(Error('Packaged change did not recalculate'));}},30);}));
  const after=await f.locator('body').evaluate(()=>CaseInspect.evidence());ok('Packaged new-case control performs real recalculation',JSON.stringify(before)!==JSON.stringify(after)&&after.caseId==='s17x-g3-closure-spill');
  await page.reload();await page.locator('#tabs [data-tab="demo"]').click();await page.frameLocator('iframe').locator('nav [data-tab="lab"]').click();
  ok('Packaged case reloads its runnable demonstration offline',await page.frameLocator('iframe').locator('[data-param="saddle"]').count()===1);
  ok('Extracted package requests zero HTTP resources',r.httpRequests.length===0,r.httpRequests);ok('Extracted package has zero uncaught script errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Extracted archive smoke completed',passed:false,detail:e.message});}
 finally{await page.context().setOffline(false);page.removeListener('pageerror',error);page.removeListener('request',request);}
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
