async page=>{
 const BASE='http://127.0.0.1:8755/',ROOT='G:/可视化导论/5/',OUT=ROOT+'handoff/home-and-five-refinement-2026-10-29/';
 const cases=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m5','s17-evidence-report']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_enhanced_portal_three_five_cases_and_original_sample',checks:[],errors:[],screenshots:[]};
 page.on('pageerror',e=>r.errors.push({url:page.url(),message:e.message}));page.on('dialog',d=>d.accept());
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const [scene,id]of cases){try{
  await page.goto(BASE+'portal/index.html');await page.evaluate(()=>CaseImport.ready);
  if(await page.evaluate(id=>!!Cases.get(id)&&Cases.get(id).version!=='1.8.0',id))await page.evaluate(id=>CaseImport.remove(id),id);
  if(!await page.evaluate(id=>Cases.get(id)?.version==='1.8.0',id)){
   await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+'dist/cases/'+id);
   await page.waitForFunction(id=>document.getElementById('imp-id').value===id,id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.locator('#import-modal').waitFor({state:'hidden'});
  }
  await page.goto(BASE+'portal/index.html#/scene/'+scene+'?case='+id+'&tab=bg');await page.locator('[data-scroll-scene]').waitFor();
  const figure=page.locator('[data-scroll-scene]');await figure.locator('.scroll-menu [data-scroll-select="2"]').click();
  ok(scene+' enhanced portal binds current scene navigation',await figure.getAttribute('data-scroll-current')==='2');
  await figure.locator('[data-scroll-read]').click();ok(scene+' enhanced reading reaches knowledge text',await page.locator('#'+scene+'-knowledge-2').boundingBox().then(b=>b.y>=0&&b.y<500));
  await page.locator('#tabs [data-tab=flow]').click();ok(scene+' enhanced flow shows full actual default products',await page.locator('.lesson-method-step').count()===(scene==='m5'?5:6));
  await page.locator('#tabs [data-tab=demo]').click();const frame=page.frameLocator('#case-demo-root iframe');
  await frame.locator('#export').waitFor({state:'attached',timeout:20000});
  await frame.locator('#export').evaluate(el=>new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if((globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready'){clearInterval(timer);resolve(true);}else if(++n>1000){clearInterval(timer);reject(Error('case not ready'));}},20);}));
  ok(scene+' enhanced sandbox loads current version and actual result',await frame.locator('body').evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot().status==='ready'&&S17Page.caseVersion==='1.8.0'));
  await page.screenshot({path:OUT+scene+'-portal-demo.png'});r.screenshots.push(scene+'-portal-demo.png');
 }catch(e){r.checks.push({name:scene+' completed enhanced portal protocol',passed:false,detail:e.message});}}
 try{
  await page.goto(BASE+'portal/index.html');await page.evaluate(()=>CaseImport.ready);
  if(!await page.evaluate(()=>Cases.get('firstbreak-stalta')?.imported)){
   await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+'portal-original/firstbreak-pick-case');
   await page.waitForFunction(()=>document.getElementById('imp-id').value==='firstbreak-stalta');await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.locator('#import-modal').waitFor({state:'hidden'});
  }
  await page.goto(BASE+'portal/index.html#/scene/s3?case=firstbreak-stalta&tab=demo');const f=page.frameLocator('#case-demo-root iframe');await f.locator('#th').fill('5');
  ok('Unmodified teacher firstbreak sample imports and computes in enhanced portal',await f.locator('#out-th').innerText()==='5.0'&&await f.locator('#ratio path').count()>0);
 }catch(e){r.checks.push({name:'Original sample compatibility',passed:false,detail:e.message});}
 ok('No uncaught enhanced portal errors',r.errors.length===0,r.errors);r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
