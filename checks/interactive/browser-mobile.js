async page=>{
 const BASE='http://127.0.0.1:8755/',OUT='G:/可视化导论/5/handoff/interactive-teaching-2026-10-30/';
 const cases=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review'],['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_five_390px',checks:[],errors:[],screenshots:[]};
 page.on('pageerror',e=>r.errors.push({url:page.url(),message:e.message}));
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 for(const [scene,id]of cases){try{
  await page.goto(BASE+'dist/cases/'+id+'/demo/index.html#background');await page.waitForFunction(()=>(globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready');
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,entries:[...document.querySelectorAll('.scroll-menu button')].map(el=>({width:el.getBoundingClientRect().width,font:parseFloat(getComputedStyle(el).fontSize)})),assistant:document.querySelector('#s17-assistant')?.getBoundingClientRect().width}));
  ok(scene+' mobile scene fits page and has four readable entries',layout.scroll<=390&&layout.entries.length===4&&layout.entries.every(el=>el.font>=16&&el.width>120),layout);
  ok(scene+' closed assistant stays a small entry',!layout.assistant||layout.assistant<=70,layout);
  const figure=page.locator('[data-scroll-scene]');await figure.scrollIntoViewIfNeeded();await figure.locator('.scroll-menu [data-scroll-select="3"]').click();
  ok(scene+' mobile selection changes the displayed layer',await figure.getAttribute('data-scroll-current')==='3');
  await figure.screenshot({path:OUT+scene+'-scroll-mobile.png'});r.screenshots.push(scene+'-scroll-mobile.png');
  await page.locator('#workflow').evaluate(el=>el.scrollIntoView({block:'start'}));
  const flow=page.locator('#workflow .lesson-flow-overview');ok(scene+' mobile flow uses a complete vertical branching layout',await flow.locator('.lesson-flow-mobile').isVisible()&&!await flow.locator('.lesson-flow-canvas').isVisible()&&await flow.locator('.lesson-flow-mobile-node').count()>=6);
  await page.screenshot({path:OUT+scene+'-workflow-mobile.png'});r.screenshots.push(scene+'-workflow-mobile.png');
  const nodes=flow.locator('.lesson-flow-mobile-node');await nodes.last().click();
  ok(scene+' mobile flow entry reaches the corresponding actual step',await page.locator('#workflow .lesson-method-step').last().boundingBox().then(b=>b.y>=70&&b.y<300));
  if(['m1','m4'].includes(scene)){
   const selector=scene==='m1'?'[data-m1-flow="1"]':'[data-m4-flow="1"]';
   const text=await page.locator(selector).innerText();ok(scene+' calibration values remain readable HTML',scene==='m1'?text.includes('210'):text.includes('29.73')&&text.includes('29.25'),text.slice(0,600));
  }
 }catch(e){r.checks.push({name:scene+' completed mobile protocol',passed:false,detail:e.message});}}
 ok('No uncaught mobile browser errors',r.errors.length===0,r.errors);
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
