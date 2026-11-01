async page=>{
 const base='file:///G:/可视化导论/5/dist/cases/',cases=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review'],['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report']],entries=[],failures=[],errors=[],network=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',q=>{if(/^https?:/.test(q.url()))network.push(q.url());});
 await page.context().setOffline(true);await page.setViewportSize({width:1280,height:800});
 for(const [scene,id] of cases){try{
  await page.goto(base+id+'/demo/index.html#lab');
  await page.waitForFunction(()=>globalThis.S17Inspect?.snapshot().status==='ready'||globalThis.M2Inspect?.snapshot().status==='ready',null,{timeout:60000});
  const state=await page.evaluate(()=>globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot());
  const summary=await page.locator(scene==='m1'?'#m1-result-summary':scene==='m2'?'#m2-result-summary':scene==='m3'?'[data-m3-result-summary]':scene==='m4'?'#m4-result-summary':'[data-m5-result-summary]').innerText();
  if(!summary||summary.includes('正在计算'))throw Error('default result missing');
  const before=state.run?.runId??state.runId;
  if(scene==='m1')await page.locator('#m1-light').fill('1.25');
  if(scene==='m2')await page.locator('#override').selectOption('connection');
  if(scene==='m3')await page.locator('[data-m3-exposure]').fill('2');
  if(scene==='m4')await page.locator('#m4-normalize').uncheck();
  if(scene==='m5')await page.locator('[data-m5-example="value"]').click();
  await page.waitForFunction(id=>{const s=globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot();return s?.status==='ready'&&(s.run?.runId??s.runId)!==id;},before,{timeout:30000});
  const after=await page.evaluate(()=>globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot());
  entries.push({scene,summary,recalculated:before!==(after.run?.runId??after.runId)});
  if(scene==='m3'){await page.locator('[data-fx-part="workflow"]').first().click();await page.locator('#m3-method-2').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/mudlogging-refinement-m3-flow-offline.png'});}
 }catch(e){failures.push({scene,error:String(e)});}}
 await page.context().setOffline(false);
 return {scope:'Chrome file:// standalone with browser offline; default calculation and one condition changed per case',entries,failures,pageErrors:errors,httpRequests:network};
}
