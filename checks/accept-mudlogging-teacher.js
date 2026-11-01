async page=>{
 const base='http://127.0.0.1:8755/',root='G:/可视化导论/5/',cases=[['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report'],['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review']],entries=[],failures=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));await page.setViewportSize({width:1440,height:900});
 for(const [scene,id] of cases){try{
  await page.goto(base+'portal-original/index.html');
  await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();
  await page.locator('#imp-dir').setInputFiles(root+'dist/cases/'+id);
  await page.waitForFunction(id=>document.getElementById('imp-id')?.value===id,id,{timeout:30000});
  await page.getByRole('button',{name:'校验并添加',exact:true}).click();
  await page.waitForFunction(id=>globalThis.Cases?.get(id)?.imported,id,{timeout:30000});
  await page.waitForFunction(scene=>location.hash.startsWith('#/scene/'+scene),scene,{timeout:30000});
  await page.locator('#tabs [data-tab="flow"]').click();
  const stepCount=await page.locator(scene==='m2'?'[data-panel="flow"] .m2-flow-panel':'[data-panel="flow"] [data-fx-step-panel]').count();
  if(stepCount!==(scene==='m5'?5:6))throw Error('teacher workflow steps '+stepCount);
  await page.locator('#tabs [data-tab="demo"]').click();
  let f=page.frameLocator('#case-demo-root iframe');
  await f.locator('body').waitFor();
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{const s=globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot();if(s?.status==='ready'){clearInterval(t);resolve();}else if(++n>1200){clearInterval(t);reject(Error('demo timeout'));}},25);}));
  let first=await f.locator('body').evaluate(()=>globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot());
  const firstId=first.run?.runId??first.runId;
  await page.reload();f=page.frameLocator('#case-demo-root iframe');await f.locator('body').waitFor();
  await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{const s=globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot();if(s?.status==='ready'){clearInterval(t);resolve();}else if(++n>1200){clearInterval(t);reject(Error('refresh timeout'));}},25);}));
  const after=await f.locator('body').evaluate(()=>globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot());
  if(after.status!=='ready'||(scene!=='m2'&&after.id!==id))throw Error('refresh did not restore case');
  if(scene==='m2')await f.locator('#override').selectOption('connection');
  else if(scene==='m1')await f.locator('#m1-light').fill('1.25');
  else if(scene==='m3')await f.locator('[data-m3-exposure]').fill('2');
  else if(scene==='m4')await f.locator('#m4-normalize').uncheck();
  else await f.locator('[data-m5-example="value"]').click();
  await f.locator('body').evaluate(old=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{const s=globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot();if(s?.status==='ready'&&(s.run?.runId??s.runId)!==old){clearInterval(t);resolve();}else if(++n>1200){clearInterval(t);reject(Error('rerun timeout'));}},25);}),after.run?.runId??after.runId);
  entries.push({scene,imported:true,workflowSteps:stepCount,refresh:true,recalculatedAfterRefresh:true,defaultRun:firstId});
 }catch(e){failures.push({scene,error:String(e)});}}
 return {scope:'Original teacher portal directory import, all workflow steps, refresh and change input after refresh',entries,failures,pageErrors:errors};
}
