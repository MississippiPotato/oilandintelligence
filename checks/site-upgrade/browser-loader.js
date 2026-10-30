async page=>{
 const BASE='http://127.0.0.1:8755/portal/index.html';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_loader_races_retry_and_teacher_module',checks:[],errors:[]};
 const err=e=>r.errors.push(e.message);page.on('pageerror',err);
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 const ready=async id=>page.waitForFunction(id=>document.querySelector('#view main')?.dataset.s17CaseId===id&&document.querySelector('#view main')?.dataset.s17CaseReady==='true',id);
 try{
  await page.setViewportSize({width:1440,height:1000});await page.goto(BASE+'?protocol=loader&run='+Date.now()+'#/scene/w1?case=welllog-layer&tab=bg');await ready('welllog-layer');
  ok('Teacher sample hydrates its stable handle',await page.evaluate(()=>Cases.get('welllog-layer').bodyReady));
  await page.locator('#tabs [data-tab=demo]').click();await page.waitForSelector('#case-demo-root #logsvg');
  ok('Teacher original module SVG works without iframe conversion',await page.locator('#case-demo-root iframe').count()===0&&await page.locator('#logsvg path').count()>0);
  await page.goto(BASE+'#/stage/geology');await page.waitForSelector('.su-stage-cases');
  ok('Original g3 and its extra case are both reachable',await page.locator('.su-stage-cases [data-su-case="s17x-g3-closure-spill"]').count()===1&&await page.locator('.su-stage-cases [data-su-case="s17x-g3-map-elements"]').count()===1);
  await page.route('**/case-content/s17x-s4-reservoir-inversion.*.js',async route=>{await page.waitForTimeout(450);await route.continue();});
  await Promise.all([page.waitForRequest(req=>req.url().includes('/case-content/s17x-s4-reservoir-inversion.')),page.evaluate(()=>location.hash='#/scene/s4?case=s17x-s4-reservoir-inversion&tab=bg')]);
  await page.evaluate(()=>location.hash='#/scene/s5?case=s17x-s5-seismic-denoise&tab=bg');await ready('s17x-s5-seismic-denoise');
  await page.waitForFunction(()=>S17CaseLoader.snapshot().find(x=>x.id==='s17x-s4-reservoir-inversion').status==='ready');
  ok('Late A body cannot repaint currently selected B',await page.evaluate(()=>document.querySelector('#view main')?.dataset.s17CaseId==='s17x-s5-seismic-denoise'));
  await page.unroute('**/case-content/s17x-s4-reservoir-inversion.*.js');
  await page.route('**/case-content/s17x-t4-meter-drift-calibration.*.js',route=>route.abort('failed'));
  await page.evaluate(()=>location.hash='#/scene/t4?case=s17x-t4-meter-drift-calibration&tab=bg');await page.waitForSelector('[data-case-retry="s17x-t4-meter-drift-calibration"]:visible');
  ok('A failed request exposes retry',await page.locator('[data-case-retry="s17x-t4-meter-drift-calibration"]:visible').count()===1);
  await page.unroute('**/case-content/s17x-t4-meter-drift-calibration.*.js');await page.locator('[data-case-retry="s17x-t4-meter-drift-calibration"]:visible').click();await ready('s17x-t4-meter-drift-calibration');
  const retry=await page.evaluate(()=>S17CaseLoader.snapshot().find(x=>x.id==='s17x-t4-meter-drift-calibration'));
  ok('Retry succeeds on second actual attempt',retry.status==='ready'&&retry.attempts===2,retry);
  const one=await page.evaluate(async()=>{const id='s17x-r5-quality-softsensor';await Promise.all([S17CaseLoader.ensure(id),S17CaseLoader.ensure(id),S17CaseLoader.ensure(id)]);return {state:S17CaseLoader.snapshot().find(x=>x.id===id),requests:performance.getEntriesByType('resource').filter(e=>e.name.includes('/case-content/'+id+'.')).length};});
  ok('Three simultaneous ensures issue one request',one.state.attempts===1&&one.requests===1,one);
  ok('No uncaught loader errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Loader protocol completed',passed:false,detail:e.stack});}
 finally{await page.unroute('**/case-content/s17x-s4-reservoir-inversion.*.js').catch(()=>{});await page.unroute('**/case-content/s17x-t4-meter-drift-calibration.*.js').catch(()=>{});page.removeListener('pageerror',err);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}

