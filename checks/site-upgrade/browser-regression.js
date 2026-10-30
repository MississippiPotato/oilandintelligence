async page=>{
 const BASE='http://127.0.0.1:8755/portal/index.html?regression=1';
 const rows=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review'],['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report'],['g1','s17x-g1-remote-lithology'],['r5','s17x-r5-quality-softsensor']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_existing_five_plus_two_deferred_path_regression',checks:[],errors:[],cases:[]};
 const err=e=>r.errors.push(e.message);page.on('pageerror',err);
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 for(const [scene,id]of rows){try{
  await page.goto(BASE+'#/scene/'+scene+'?case='+id+'&tab=bg');await page.waitForFunction(id=>document.querySelector('#view main')?.dataset.s17CaseId===id&&document.querySelector('#view main')?.dataset.s17CaseReady==='true',id);
  ok(scene+' background has readable content and data figures',await page.locator('#tabs [data-tab]').count()===3&&await page.locator('[data-panel=bg] svg').count()>0);
  if(/^m[1-4]$/.test(scene)){
   const host=page.locator('[data-concept-scene="'+scene+'"][data-concept-part="background"]');const prior=await host.getAttribute('data-ct-state');
   await host.locator('input[type=range]').first().focus();await page.keyboard.press('End');
   ok(scene+' background control updates its calculated visual',!!prior&&await host.getAttribute('data-ct-state')!==prior);
  }
  await page.locator('#tabs [data-tab=flow]').click();ok(scene+' workflow remains illustrated',await page.locator('[data-panel=flow] svg').count()>0);
  ok(scene+' background and flow do not create iframe',await page.locator('iframe').count()===0);
  await page.locator('#tabs [data-tab=demo]').click();const f=page.frameLocator('#case-demo-root iframe');
  if(!/^m/.test(scene))await f.locator('button[data-tab=lab]').click();
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const t=setInterval(()=>{const s=(globalThis.S17Inspect??globalThis.M2Inspect??globalThis.CaseInspect)?.snapshot();if(['ready','complete'].includes(s?.status)){clearInterval(t);resolve(true);}},30);setTimeout(()=>{clearInterval(t);reject(Error('calculation not ready'));},18000);}));
  const before=await f.locator('body').evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect??globalThis.CaseInspect).snapshot());
  await f.locator('#run').click();
  await f.locator('body').evaluate(prior=>new Promise((resolve,reject)=>{let count=0;const timer=setInterval(()=>{const s=(globalThis.S17Inspect??globalThis.M2Inspect??globalThis.CaseInspect).snapshot();if(['ready','complete'].includes(s.status)&&(s.run?.runId??s.runId)!==prior){clearInterval(timer);resolve(true);}else if(++count>300){clearInterval(timer);reject(Error('rerun did not finish'));}},30);}),before.run?.runId??before.runId);
  const after=await f.locator('body').evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect??globalThis.CaseInspect).snapshot());
  ok(scene+' demo loads and actually reruns through the new deferred path',['ready','complete'].includes(after.status)&&(before.run?.runId??before.runId)!==(after.run?.runId??after.runId),{before:before.run?.runId??before.runId,after:after.run?.runId??after.runId});r.cases.push({scene,id,status:after.status});
 }catch(e){r.checks.push({name:scene+' full sampled regression',passed:false,detail:e.message});}}
 ok('No uncaught sampled case errors',r.errors.length===0,r.errors);page.removeListener('pageerror',err);r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}

