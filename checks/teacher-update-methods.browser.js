async page=>{
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_offline_method_explanations_and_recompute',checks:[]},ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 const cases=[['m1','s17-cuttings-lithology','cases'],['m2','s17-mudgas-context','cases'],['m3','s17-fluorescence-review','cases'],['m4','s17-drilltime-boundaries','cases'],['m5','s17-evidence-report','cases'],['d1','s17x-d1-rop-optimization','expansion-cases'],['g1','s17x-g1-remote-lithology','expansion-cases'],['s1','s17x-s1-seismic-fault','expansion-cases'],['r4','s17x-r4-lab-audit','expansion-cases'],['c1-extra','s17x-c1-cement-woc-strength','expansion-cases']];
 try{
 await page.context().setOffline(true);
 for(const [scene,id,dir]of cases){
   await page.goto('file:///G:/可视化导论/5/dist/'+dir+'/'+id+'/demo/index.html?embed=demo#lab');await page.waitForSelector('[data-method-role]');
   const role=page.locator('[data-method-role]');ok(scene+' has implemented method, causal explanation and result guide',await role.locator('strong').textContent().then(Boolean)&&await role.locator('p').count()===2);
   const defaultState=await page.evaluate(()=>{const x=(window.M2Inspect||window.S17Inspect||window.CaseInspect)?.snapshot?.();return x?{status:x.status,computed:x.computed,runId:x.runId||x.run?.runId||x.run?.id}:null;});
   ok(scene+' default computation is present',!!defaultState&&defaultState.status!=='error',defaultState);
   await role.scrollIntoViewIfNeeded();await role.getByText('对照当前结果 ↓').click();ok(scene+' result link moves focus to actual output area',await page.evaluate(()=>document.activeElement!==document.body&&document.activeElement.tagName!=='A'));
   if(scene==='m2'){const old=await page.evaluate(()=>M2Inspect.snapshot().results[0].features.sourceTime_s);await page.locator('#volume').fill('14');await page.waitForTimeout(650);ok('M2 same gas peak recalculates source time',await page.evaluate(old=>M2Inspect.snapshot().results[0].features.sourceTime_s!==old,old));}
   if(scene==='m5'){await page.locator('[data-m5-example=value]').click();await page.waitForTimeout(650);ok('M5 changed value reaches current extracted facts',await page.evaluate(()=>S17Inspect.snapshot().facts.some(x=>x.fields.gasValue===5.1)));}
   if(scene==='d1'){await page.locator('#maxPressure').fill('15');await page.waitForTimeout(650);ok('D1 constraint updates calculation',await page.evaluate(()=>CaseInspect.snapshot().params.maxPressure===15));}
   if(scene==='m1'||scene==='m2'||scene==='d1'){await role.scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/teacher-update-method-'+scene+'.png',timeout:20000,animations:'disabled'});}
 }
 await page.setViewportSize({width:390,height:844});await page.goto('file:///G:/可视化导论/5/dist/cases/s17-mudgas-context/demo/index.html?embed=demo#lab');await page.waitForSelector('[data-method-role]');await page.locator('[data-method-role]').scrollIntoViewIfNeeded();ok('390px explanation wraps within viewport',await page.locator('[data-method-role]').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1));await page.screenshot({path:'output/playwright/teacher-update-method-mobile.png',timeout:20000,animations:'disabled'});
 await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});
 }catch(e){await page.context().setOffline(false);r.failure=e.stack;r.checks.push({name:'Methods protocol completed',passed:false,detail:e.message});}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
