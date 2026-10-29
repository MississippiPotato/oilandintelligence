async page=>{
 const BASE='http://127.0.0.1:8755/',OUT='G:/可视化导论/5/handoff/home-and-five-refinement-2026-10-29/';
 const cases=[['g3','s17x-g3-map-elements'],['pr4','s17x-pr4-esp-warning'],['t3','s17x-t3-gathering-pump-optimization'],['t4','s17x-t4-meter-drift-calibration']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_four_of_56_audit_samples',checks:[],errors:[],screenshots:[]};
 page.on('pageerror',e=>r.errors.push({url:page.url(),message:e.message}));
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const ready=()=>page.waitForFunction(()=>globalThis.LessonInspect&&['ready','done','completed','complete'].includes(LessonInspect.snapshot().current?.status)&&!document.getElementById('export').disabled);
 const state=()=>page.evaluate(()=>{const a=LessonInspect.snapshot();return{status:a.current.status,params:a.current.params??a.current.currentParams,computations:a.computations,charts:[...document.querySelectorAll('#lab canvas,#lab svg,#lab .bar,#lab table')].map(el=>el.tagName.toLowerCase()==='canvas'?el.toDataURL():el.outerHTML).join('')};});
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const [scene,id]of cases){try{
  await page.goto(BASE+'dist/expansion-cases/'+id+'/demo/index.html#background');await ready();const a=await state();
  ok(scene+' rebuilt case computes default with existing engine',a.status&&a.charts.length>100);
  const text=await page.locator('body').innerText();ok(scene+' audited defensive and misleading sentences removed',!text.includes('未知图例保留复核参考仅用于评价')&&!text.includes('没有可行点时仍给出推荐')&&!text.includes('把后续参考值加入拟合'));
  await page.locator('nav [data-tab=workflow]').first().click();ok(scene+' source-matched flow renders',await page.locator('#workflow .case-flow-overview').count()===1);
  await page.screenshot({path:OUT+scene+'-audited-flow.png'});r.screenshots.push(scene+'-audited-flow.png');
  await page.locator('nav [data-tab=lab]').first().click();await page.locator('[data-xl-task]').first().click();await ready();await page.waitForTimeout(400);const b=await state();
  ok(scene+' comparison task reaches real controls and changes calculated data',b.computations>a.computations&&b.charts!==a.charts,{before:a.params,after:b.params});
 }catch(e){r.checks.push({name:scene+' completed sampled case protocol',passed:false,detail:e.message});}}
 await page.goto(BASE+'portal/index.html#/scene/g3?case=s17x-g3-map-elements&tab=bg');await page.locator('.xl-opening').first().waitFor();
 ok('Enhanced portal recognizes newly rebuilt 1.1.1 lessons',await page.evaluate(()=>Cases.get('s17x-g3-map-elements').version==='1.1.1')&&await page.locator('.xl-read').count()===3);
 ok('No uncaught sampled-case errors',r.errors.length===0,r.errors);r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
