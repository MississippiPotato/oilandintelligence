async page=>{
 const ROOT='G:/可视化导论/5/',OUT=ROOT+'handoff/interactive-teaching-2026-10-30/';
 const cases=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review'],['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_offline_file_all_five',checks:[],errors:[],downloads:[],screenshots:[]};
 page.on('pageerror',e=>r.errors.push({url:page.url(),message:e.message}));
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.context().setOffline(true);
 try{for(const [scene,id]of cases){try{
  await page.goto('file:///'+ROOT+'dist/cases/'+id+'/demo/index.html#lab');await page.waitForFunction(()=>(globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready');
  const a=await page.evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot());
  await page.locator('#run').click();const b=await page.evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot());
  ok(scene+' file with browser network offline calculates and runs again',a.status==='ready'&&b.status==='ready'&&(a.run?.runId??a.runId)!==(b.run?.runId??b.runId),{runId:b.run?.runId??b.runId});
  const d=page.waitForEvent('download');await page.locator('#export').click();const f=await d;await f.saveAs(OUT+'downloads/'+scene+'-offline.json');r.downloads.push('downloads/'+scene+'-offline.json');
  await page.reload();await page.waitForFunction(()=>(globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready');
  ok(scene+' file refresh calculates a new default without network',await page.locator('#export').isEnabled());
  if(['m1','m2','m5'].includes(scene)){await page.screenshot({path:OUT+scene+'-offline.png'});r.screenshots.push(scene+'-offline.png');}
 }catch(e){r.checks.push({name:scene+' completed offline protocol',passed:false,detail:e.message});}}}
 finally{await page.context().setOffline(false);}
 ok('No uncaught offline calculation errors',r.errors.length===0,r.errors);r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
