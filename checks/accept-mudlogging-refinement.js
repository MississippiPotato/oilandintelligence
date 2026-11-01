async page => {
 const failures=[], entries=[], errors=[];
 page.on('pageerror', e=>errors.push(String(e)));
 const cases=[['m1','s17-cuttings-lithology','m1-result-summary',6],['m2','s17-mudgas-context','m2-result-summary',6],['m3','s17-fluorescence-review','[data-m3-result-summary]',6],['m4','s17-drilltime-boundaries','m4-result-summary',6],['m5','s17-evidence-report','[data-m5-result-summary]',5]];
 const check=(value,message)=>{if(!value)throw Error(message);};
 for(const [scene,id,selector,steps] of cases){
  try{
   const base='http://127.0.0.1:8755/portal/index.html#/scene/'+scene+'?case='+id+'&tab=';
   await page.goto(base+'flow'); await page.waitForTimeout(300);
   await page.waitForSelector(scene==='m2'?'#m2-flow-panel-0':'[data-fx-step-panel="0"]',{timeout:20000});
   const count=await page.locator(scene==='m2'?'.m2-flow-panel':'[data-fx-step-panel]').count();check(count===steps,scene+' flow steps '+count);
   const diagrams=await page.locator(scene==='m2'?'.m2-flow-panel svg':'[data-fx-step-panel] svg').count();
   await page.goto(base+'demo');await page.waitForSelector('iframe',{timeout:20000});
   await page.waitForFunction(id=>Array.from(document.querySelectorAll('iframe')).some(x=>x.src.includes('/'+id+'/demo/')),id,{timeout:20000});
   const frame=page.frames().find(f=>f.url().includes('/'+id+'/demo/'));check(frame,scene+' frame missing');
   await frame.waitForFunction(()=>globalThis.S17Inspect?.snapshot().status==='ready'||globalThis.M2Inspect?.snapshot().status==='ready',null,{timeout:60000});
   const sel=selector.startsWith('[')?selector:'#'+selector,summary=frame.locator(sel);await summary.waitFor({state:'visible'});
   const first=await summary.innerText(),href=frame.url();check(href.endsWith('#lab'),scene+' iframe wrong fragment '+href);check(!first.includes('正在计算'),scene+' result still loading');
   const inspect=()=>frame.evaluate(()=>globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot());
   const before=await inspect();
   if(scene==='m1'){
    await frame.locator('#m1-result-summary button').click();check((await inspect()).stage===2,'m1 jump');
    await frame.locator('#m1-light').evaluate(el=>{el.value='1.25';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await frame.waitForFunction(()=>S17Inspect.snapshot().status==='ready'&&S17Inspect.snapshot().run.config.light===1.25,null,{timeout:30000});
   }
   if(scene==='m2'){
    await frame.locator('.m2-callout [data-stage="2"]').click();check((await inspect()).stage===2,'m2 jump');
    await frame.locator('#override').selectOption('connection');await frame.waitForFunction(id=>M2Inspect.snapshot().status==='ready'&&M2Inspect.snapshot().runId!==id,before.runId,{timeout:30000});
   }
   if(scene==='m3'){
    await frame.locator('.m3-quality [data-m3-stage="2"]').click();check((await inspect()).activeStage===2,'m3 jump');
    await frame.locator('[data-m3-exposure]').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await frame.waitForFunction(()=>S17Inspect.snapshot().status==='ready'&&S17Inspect.snapshot().exposure===2,null,{timeout:30000});
    const after=await inspect();check((await summary.innerText()).includes(String(after.pixelCounts.M0.count.toLocaleString())),'m3 summary count mismatch');
   }
   if(scene==='m4'){
    await frame.locator('button[data-m4-stage="2"]').first().click();check((await inspect()).stage===2,'m4 jump');
    await frame.locator('#m4-normalize').focus();await page.keyboard.press('Space');await frame.waitForFunction(()=>S17Inspect.snapshot().status==='ready'&&!S17Inspect.snapshot().normalize,null,{timeout:30000});
    const after=await inspect();check(Math.abs(before.selectedrow.responseFeatures[1]-after.selectedrow.responseFeatures[1])<1e-12,'m4 toggle changed torque');
   }
   if(scene==='m5'){
    await frame.locator('[data-m5-jump-report]').click();await frame.waitForFunction(()=>S17Inspect.snapshot().stage===1,null,{timeout:5000});
    const text='1200—1230 m MD：没有荧光显示；1200—1230 m MD：尚未排除荧光显示；1200—1230 m MD：气测总气从3.2归一化单位升至5.1归一化单位。';
    await frame.locator('[data-m5-raw]').fill(text);await frame.waitForFunction(t=>S17Inspect.snapshot().status==='ready'&&S17Inspect.snapshot().rawText===t,text,{timeout:30000});
    const after=await inspect();const neg=after.facts.find(v=>v.rawQuote.includes('没有荧光')), unknown=after.facts.find(v=>v.rawQuote.includes('尚未排除')),gas=after.facts.find(v=>v.rawQuote.includes('总气从'));
    check(neg?.fields.fluorescencePolarity==='negative','m5 negative extraction');check(unknown?.fields.fluorescencePolarity==='unknown','m5 unknown extraction');check(gas?.fields.gasChange?.start===3.2&&gas.fields.gasChange.end===5.1,'m5 gas change');check(after.handover.unresolvedTextClaimIds.length>=1,'m5 unresolved handover');
   }
   entries.push({scene,flowSteps:count,flowSvg:diagrams,iframe:href,summary:first,interaction:'passed'});
   if(['m3','m5'].includes(scene)){await page.setViewportSize({width:1280,height:800});await page.screenshot({path:'output/playwright/mudlogging-refinement-'+scene+'-desktop.png'});}
  }catch(e){failures.push({scene,error:String(e)});}
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8755/portal/index.html#/scene/m3?case=s17-fluorescence-review&tab=demo');await page.waitForSelector('iframe');await page.waitForTimeout(1800);await page.screenshot({path:'output/playwright/mudlogging-refinement-m3-mobile.png'});
 return {entries,failures,pageErrors:errors};
}
