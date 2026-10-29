async page=>{
 const BASE='http://127.0.0.1:8755/',ROOT='G:/可视化导论/5/',OUT=ROOT+'handoff/interactive-teaching-2026-10-30/';
 const cases=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review'],['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_original_teacher_directory_import_all_five',checks:[],errors:[],downloads:[],screenshots:[]};
 page.on('pageerror',e=>r.errors.push({url:page.url(),message:e.message}));
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const [scene,id]of cases){try{
  await page.goto(BASE+'portal-original/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(ROOT+'dist/cases/'+id);
  await page.waitForFunction(id=>document.getElementById('imp-id').value===id,id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();
  await page.waitForFunction(id=>Cases.get(id)?.version==='1.9.0',id);
  ok(scene+' original teacher directory importer accepts current five-file case',true);
  await page.locator('#tabs [data-tab=bg]').click();ok(scene+' original background includes scene and four knowledge units',await page.locator('[data-scroll-scene]').count()===1);
  await page.locator('#tabs [data-tab=flow]').click();ok(scene+' original flow includes each calculated preview',await page.locator('.lesson-method-step').count()===(scene==='m5'?5:6));
  await page.locator('#tabs [data-tab=demo]').click();let frame=page.frameLocator('#case-demo-root iframe');
  await frame.locator('#export').evaluate(el=>new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if((globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready'){clearInterval(timer);resolve(true);}else if(++n>1000){clearInterval(timer);reject(Error('case not ready'));}},20);}));
  const a=await frame.locator('body').evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot());
  await frame.locator('#run').click();const b=await frame.locator('body').evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot());
  ok(scene+' original sandbox runs actual computation again',(a.run?.runId??a.runId)!==(b.run?.runId??b.runId));
  await page.reload();frame=page.frameLocator('#case-demo-root iframe');
  await frame.locator('#export').evaluate(el=>new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if((globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready'){clearInterval(timer);resolve(true);}else if(++n>1000){clearInterval(timer);reject(Error('refresh not ready'));}},20);}));
  await frame.locator('#run').click();const c=await frame.locator('body').evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot());
  ok(scene+' imported case persists on refresh and reruns',c.status==='ready'&&await page.evaluate(id=>Cases.get(id)?.version==='1.9.0',id));
  const d=page.waitForEvent('download');await frame.locator('#export').click();const f=await d;await f.saveAs(OUT+'downloads/'+scene+'-teacher-refresh.json');r.downloads.push('downloads/'+scene+'-teacher-refresh.json');
  await page.screenshot({path:OUT+scene+'-teacher-refresh.png'});r.screenshots.push(scene+'-teacher-refresh.png');
 }catch(e){r.checks.push({name:scene+' completed original import protocol',passed:false,detail:e.message});}}
 ok('No uncaught original import browser errors',r.errors.length===0,r.errors);r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
