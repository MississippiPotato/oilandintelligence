async (page) => {
  const checks=[],pageErrors=[],externalRequests=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8755/'))externalRequests.push(r.url());});
  function check(name,actual){if(!actual)throw new Error(name);checks.push({name,status:'passed'});}
  const definitions=[{scene:'c1',id:'s17x-c1-cement-quality',score:0.9498812648418947,boundary:'noise'},{scene:'co1',id:'s17x-co1-completion-choice',score:2.8058105435190632,boundary:'budget'}],results=[];
  for(const d of definitions){
    const base='http://127.0.0.1:8755/dist/expansion-cases/'+d.id+'/demo/index.html';
    await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.waitForFunction(()=>!!window.CaseInspect);
    check(d.scene+' has 3 independent concept SVGs',await page.locator('#background-content .chapter svg').count()===3);
    await page.getByRole('button',{name:'案例流程',exact:true}).click();
    for(let i=0;i<5;i++){await page.locator('[data-step="'+i+'"]').click();check(d.scene+' step '+(i+1)+' has inputs, actions, outputs and own SVG',(await page.locator('#step-content svg').count())===1&&(await page.locator('#step-content .step-io b').count())===3);}
    await page.getByRole('button',{name:'可运行示范',exact:true}).click();await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const ordinary=await page.evaluate(()=>CaseInspect.snapshot()),score=d.scene==='c1'?ordinary.metrics.model.macroF1:ordinary.metrics.surrogateMAE;
    check(d.scene+' browser metric equals actual Node calculation',Math.abs(score-d.score)<1e-12);
    check(d.scene+' body text is at least 18px',Number(await page.evaluate(()=>parseFloat(getComputedStyle(document.body).fontSize)))>=18);
    check(d.scene+' current review status is exposed',Object.hasOwn(ordinary,'currentReviewCount'));
    await page.evaluate(()=>window.scrollTo(0,document.querySelector('#results').getBoundingClientRect().top+scrollY));
    await page.screenshot({path:'expansion-src/'+d.scene+'/browser-desktop.png',fullPage:false});
    await page.locator('#review-note').fill('浏览器复核：对照当前可见输入、邻井和原始预测，保留需补充资料的判断。');await page.locator('#review').click();
    check(d.scene+' manual note records current run',(await page.evaluate(()=>CaseInspect.snapshot())).currentReviewCount===1);
    const changed=d.scene==='c1'?'#noise':'#budget';await page.locator(changed).focus();await page.locator(changed).press('ArrowRight');
    const stale=await page.evaluate(()=>CaseInspect.snapshot());
    check(d.scene+' changing inputs invalidates current metrics and export',stale.status==='stale'&&stale.metrics===null&&await page.locator('#export').isDisabled());
    check(d.scene+' input change retains old note as history',stale.reviewCount===1&&stale.currentReviewCount===0&&(await page.locator('#review-history').textContent()).includes('历史意见'));
    await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const second=await page.evaluate(()=>CaseInspect.snapshot());check(d.scene+' rerun increments run ID and preserves history',second.runId===2&&second.reviewCount===1&&second.currentReviewCount===0);
    const promise=page.waitForEvent('download');await page.locator('#export').click();const download=await promise;await download.saveAs('expansion-src/'+d.scene+'/browser-evidence.json');
    check(d.scene+' actual JSON download completes',/\.json$/.test(download.suggestedFilename()));
    await page.locator('#preset').selectOption(d.boundary);check(d.scene+' boundary preset marks results stale',(await page.evaluate(()=>CaseInspect.snapshot())).status==='stale');
    await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const boundary=await page.evaluate(()=>CaseInspect.snapshot());
    check(d.scene+' boundary interaction changes actual result',d.scene==='c1'?Math.abs(boundary.metrics.model.macroF1-ordinary.metrics.model.macroF1)>1e-6:(await page.locator('#recommendation').textContent()).includes('没有可行候选'));
    await page.locator('#reset').click();await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const reset=await page.evaluate(()=>CaseInspect.snapshot()),resetScore=d.scene==='c1'?reset.metrics.model.macroF1:reset.metrics.surrogateMAE;
    check(d.scene+' reset restores default computation',Math.abs(resetScore-score)<1e-12);
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,document.querySelector('#results').getBoundingClientRect().top+scrollY));
    check(d.scene+' emulated mobile has no whole-page horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const canvas=d.scene==='c1'?'#logs':'#comparison';
    check(d.scene+' chart preserves readable CSS size with local scrolling',await page.locator(canvas).evaluate(c=>c.getBoundingClientRect().width>=700&&c.parentElement.scrollWidth>c.parentElement.clientWidth));
    await page.screenshot({path:'expansion-src/'+d.scene+'/browser-mobile.png',fullPage:false});
    await page.context().setOffline(true);
    await page.goto('file:///G:/可视化导论/5/dist/expansion-cases/'+d.id+'/demo/index.html');await page.getByRole('button',{name:'可运行示范',exact:true}).click();await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const offline=await page.evaluate(()=>CaseInspect.snapshot()),offlineScore=d.scene==='c1'?offline.metrics.model.macroF1:offline.metrics.surrogateMAE;
    check(d.scene+' standalone file works while browser network is offline',Math.abs(offlineScore-score)<1e-12);
    await page.context().setOffline(false);
    results.push({sceneId:d.scene,caseId:d.id,ordinary,second,boundary,reset,offline,download:'expansion-src/'+d.scene+'/browser-evidence.json'});
  }
  check('No JavaScript page exceptions',pageErrors.length===0);check('No external HTTP requests',externalRequests.length===0);
  return {kind:'Actual standalone browser interaction; does not claim teacher-portal import',checkedAt:new Date().toISOString(),checks,counts:{passed:checks.length,failed:0},pageErrors,externalRequests,results,notExecuted:['Teacher native add-case import and cumulative persistence','Actual physical mobile touch device','Firefox or WebKit']};
}
