async (page) => {
  const checks=[],measurements=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  const check=(name,value)=>{if(!value)throw Error(name);checks.push({name,status:'passed'});};
  for(const [scene,id] of [['c1','s17x-c1-cement-quality'],['co1','s17x-co1-completion-choice']]){
    await page.context().setOffline(false);await page.setViewportSize({width:390,height:844});
    await page.goto('http://127.0.0.1:8755/dist/expansion-cases/'+id+'/demo/index.html');
    const background=await page.locator('#background-content .diagram').first().evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,svg:el.querySelector('svg').getBoundingClientRect().width}));
    check(scene+' concept diagrams preserve 880px original size with local scrolling',background.svg>=880&&background.scroll>background.width);
    await page.getByRole('button',{name:'案例流程',exact:true}).click();
    const flow=await page.locator('#step-content .diagram').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,svg:el.querySelector('svg').getBoundingClientRect().width}));
    check(scene+' workflow preserves original text size without page overflow',flow.svg>=880&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.getByRole('button',{name:'可运行示范',exact:true}).click();await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const canvas=await page.locator(scene==='c1'?'#logs':'#comparison').evaluate(c=>({width:c.getBoundingClientRect().width,parentWidth:c.parentElement.clientWidth,parentScroll:c.parentElement.scrollWidth}));
    check(scene+' full-size 760px Canvas stays inside its own scroll area',canvas.width===760&&canvas.parentScroll>canvas.parentWidth&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.getByRole('button',{name:'打开井见助手',exact:true}).click();
    await page.locator('#s17-agent-panel').waitFor({state:'visible'});const assistantBox=await page.locator('#s17-agent-panel').boundingBox();
    check(scene+' latest assistant actually opens and fits the narrow viewport',assistantBox.width<=390&&assistantBox.x>=0&&assistantBox.height<=844);
    await page.getByRole('button',{name:'收起助手',exact:true}).click();
    check(scene+' closing assistant preserves current calculation',await page.locator('#s17-agent-panel').isHidden()&&(await page.evaluate(()=>CaseInspect.snapshot())).status==='ready');
    await page.evaluate(()=>window.scrollTo(0,document.querySelector('#results').getBoundingClientRect().top+scrollY));await page.screenshot({path:'expansion-src/'+scene+'/browser-mobile.png',fullPage:false});
    await page.setViewportSize({width:1440,height:1000});const font=await page.evaluate(()=>parseFloat(getComputedStyle(document.body).fontSize));check(scene+' final desktop body stays 18px',font===18);
    await page.evaluate(()=>window.scrollTo(0,document.querySelector('#results').getBoundingClientRect().top+scrollY));await page.screenshot({path:'expansion-src/'+scene+'/browser-desktop.png',fullPage:false});
    const http=await page.evaluate(()=>CaseInspect.snapshot());
    await page.context().setOffline(true);await page.goto('file:///G:/可视化导论/5/dist/expansion-cases/'+id+'/demo/index.html');await page.getByRole('button',{name:'可运行示范',exact:true}).click();await page.locator('#run').click();await page.waitForFunction(()=>CaseInspect.snapshot().status==='ready');
    const file=await page.evaluate(()=>CaseInspect.snapshot());check(scene+' latest assistant bundle preserves offline file computation',JSON.stringify(file.metrics)===JSON.stringify(http.metrics));
    measurements.push({sceneId:scene,background,flow,canvas,desktopFontSize:font,httpMetrics:http.metrics,offlineMetrics:file.metrics});
  }
  await page.context().setOffline(false);check('Latest build has no JavaScript page exceptions',errors.length===0);
  return {kind:'Targeted real-browser verification of final BUILD_READY_3 display and assistant-bundle changes',checkedAt:new Date().toISOString(),checks,counts:{passed:checks.length,failed:0},measurements,pageErrors:errors};
}
