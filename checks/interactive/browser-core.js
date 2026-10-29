async page=>{
 const BASE='http://127.0.0.1:8755/',OUT='G:/可视化导论/5/handoff/interactive-teaching-2026-10-30/';
 const cases=[['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['m3','s17-fluorescence-review'],['m4','s17-drilltime-boundaries'],['m5','s17-evidence-report']];
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_five_desktop_and_live_changes',checks:[],errors:[],screenshots:[],downloads:[]};
 page.on('pageerror',e=>r.errors.push({url:page.url(),message:e.message}));
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const snapshot=()=>page.evaluate(()=>(globalThis.S17Inspect??globalThis.M2Inspect).snapshot());
 const changeRange=async(selector,value)=>{await page.locator(selector).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));};
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [scene,id]of cases){try{
  await page.goto(BASE+'dist/cases/'+id+'/demo/index.html#background');await page.waitForFunction(()=>(globalThis.S17Inspect??globalThis.M2Inspect)?.snapshot().status==='ready');
  const before=await snapshot();ok(scene+' default real calculation',before.status==='ready'&&(before.run?.runId??before.runId),{runId:before.run?.runId??before.runId});
  const visible=await page.evaluate(()=>['background','workflow','lab'].map(id=>({id,hidden:document.getElementById(id).hidden,display:getComputedStyle(document.getElementById(id)).display})));
  ok(scene+' all three teaching sections readable continuously',visible.every(x=>!x.hidden&&x.display!=='none'),visible);
  if(scene!=='m5'){
   const host=page.locator('[data-concept-scene="'+scene+'"][data-concept-part="background"]');await host.scrollIntoViewIfNeeded();
   const state=await host.getAttribute('data-ct-state');ok(scene+' new background graph mounted',await host.getAttribute('data-ct-ready')==='true'&&!!state&&await host.locator('svg').count()>0);
   const control=host.locator('input[type="range"]').first();await control.focus();await page.keyboard.press('End');
   ok(scene+' new background control actually recalculates',await host.getAttribute('data-ct-state')!==state);
   await host.locator('[data-ct-reset]').click();ok(scene+' new background graph resets',await host.getAttribute('data-ct-state')===state);
  }
  const figure=page.locator('[data-scroll-scene]');await figure.scrollIntoViewIfNeeded();
  const y=await page.evaluate(()=>scrollY);const selected=figure.locator('.scroll-layer[data-scroll-layer="1"]');
  const from=await selected.evaluate(el=>getComputedStyle(el).transform);
  await figure.evaluate(el=>{window.__s17motion=[];el.addEventListener('click',()=>{const start=performance.now(),layer=el.querySelector('[data-scroll-layer="1"]');function frame(){window.__s17motion.push({time:performance.now()-start,transform:getComputedStyle(layer).transform});if(performance.now()-start<760)requestAnimationFrame(frame);}requestAnimationFrame(frame);},{once:true});});
  await figure.locator('.scroll-menu [data-scroll-select="1"]').click();await page.waitForTimeout(800);
  const motion=await figure.evaluate(el=>({current:el.dataset.scrollCurrent,selected:el.querySelectorAll('.scroll-layer.is-current').length,transform:getComputedStyle(el.querySelector('.scroll-layer.is-current')).transform,opacity:getComputedStyle(el.querySelector('.scroll-layer:not(.is-current)')).opacity,scrollY:scrollY,width:el.querySelector('.lesson-scroll').clientWidth,height:el.querySelector('.lesson-scroll').clientHeight}));
  const frames=await page.evaluate(()=>window.__s17motion),midway=frames.find(f=>f.transform!==from&&f.transform!==motion.transform);
  ok(scene+' clipped selected region visibly lifts with an intermediate animation',motion.current==='1'&&motion.selected===1&&!!midway&&Number(motion.opacity)<1,{from,midway,frames:frames.length,...motion});
  ok(scene+' selecting the scene stays in place',Math.abs(y-motion.scrollY)<3,{before:y,after:motion.scrollY});
  await figure.screenshot({path:OUT+scene+'-scroll-desktop.png'});r.screenshots.push(scene+'-scroll-desktop.png');
  await figure.locator('.scroll-menu [data-scroll-select="1"]').focus();await page.keyboard.press('ArrowRight');
  ok(scene+' keyboard changes the scene region',await figure.getAttribute('data-scroll-current')==='2');
  await figure.locator('[data-scroll-read]').click();await page.waitForFunction(scene=>{const a=document.getElementById(scene+'-knowledge-2');const el=a.closest('.m2-background-chapter')||a;return el.getBoundingClientRect().top>=70&&el.getBoundingClientRect().top<240;},scene);
  const anchor=await page.locator('#'+scene+'-knowledge-2').evaluate(el=>{const a=el.closest('.m2-background-chapter')??el;return {y:a.getBoundingClientRect().top,title:a.querySelector('h2,h3')?.textContent};});
  ok(scene+' reading entry keeps the heading below navigation',anchor.y>=70&&anchor.y<240,anchor);
  await page.locator('#workflow').evaluate(el=>el.scrollIntoView({block:'start'}));
  const steps=page.locator('#workflow .lesson-method-step');ok(scene+' all actual steps present without a button wall',await steps.count()===(scene==='m5'?5:6)&&await steps.evaluateAll(els=>els.every(el=>!el.hidden&&getComputedStyle(el).display!=='none')));
  await page.screenshot({path:OUT+scene+'-workflow-desktop.png'});r.screenshots.push(scene+'-workflow-desktop.png');
  if(scene==='m1'){
   await changeRange('#m1-light',.65);await page.waitForFunction(()=>S17Inspect.snapshot().status==='ready'&&S17Inspect.snapshot().run.config.light===.65);
   const a=await snapshot();ok('m1 changing illumination recalculates the selected location',a.run.runId!==before.run.runId&&a.anchor.x===before.anchor.x&&a.anchor.y===before.anchor.y,{light:a.run.config.light,anchor:a.anchor,tracking:a.tracking});
  }else if(scene==='m2'){
   await changeRange('[data-m2-bg-volume]',18);await page.waitForFunction(()=>M2Inspect.snapshot().status==='ready'&&M2Inspect.snapshot().settings.volume===18);
   const a=await snapshot();ok('m2 background volume drives the same live engine and changes source time',a.results[0].features.sourceTime_s!==before.results[0].features.sourceTime_s&&await page.locator('#volume').inputValue()==='18',{before:before.results[0].features.sourceTime_s,after:a.results[0].features.sourceTime_s});
   await page.locator('#override').selectOption('trip');await page.waitForFunction(()=>M2Inspect.snapshot().status==='ready'&&M2Inspect.snapshot().dataOptions.override==='trip');
   const b=await snapshot();ok('m2 context changes actual neighbors while retaining identical gas input',b.gasSignature===a.gasSignature&&JSON.stringify(b.results[0].prediction.neighbors)!==JSON.stringify(a.results[0].prediction.neighbors)&&b.metrics===null,{gasSignature:b.gasSignature,before:a.results[0].prediction.label,after:b.results[0].prediction.label});
  }else if(scene==='m3'){
   await changeRange('[data-m3-exposure]',2);await page.waitForFunction(()=>S17Inspect.snapshot().status==='ready'&&S17Inspect.snapshot().exposure===2);
   const a=await snapshot();ok('m3 same paired sample recalculates actual masks after exposure',a.identity.parentSampleId===before.identity.parentSampleId&&a.pixelCounts.M0.denominator===before.pixelCounts.M0.denominator&&JSON.stringify(a.pixelCounts)!==JSON.stringify(before.pixelCounts),{before:before.pixelCounts,after:a.pixelCounts});
  }else if(scene==='m4'){
   await page.locator('#m4-normalize').uncheck();const a=await snapshot();ok('m4 calibration changes response while raw ROP stays the same',a.normalize===false&&a.selectedrow.ROP_m_h===before.selectedrow.ROP_m_h&&JSON.stringify(a.selectedrow.responseFeatures)!==JSON.stringify(before.selectedrow.responseFeatures),{before:before.selectedrow,after:a.selectedrow});
  }else{
   await page.locator('[data-m5-example="value"]').click();await page.waitForFunction(()=>S17Inspect.snapshot().status==='ready'&&S17Inspect.snapshot().rawText.includes('5.1'));
   const a=await snapshot();ok('m5 edits are extracted again with exact source spans and no inherited accuracy',a.run.runId!==before.run.runId&&a.run.metrics===null&&a.sourceOffsets.every(s=>a.rawText.slice(s.start,s.end)===s.quote),{runId:a.run.runId,fields:a.fields});
   await page.locator('[data-m5-report-select]').first().click();ok('m5 report sentence selects its source',await page.locator('[data-m5-source-card] mark').count()>0);
  }
  const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;await file.saveAs(OUT+'downloads/'+scene+'-desktop.json');r.downloads.push('downloads/'+scene+'-desktop.json');
  ok(scene+' actual save produces JSON',file.suggestedFilename().endsWith('.json'));
 }catch(e){r.checks.push({name:scene+' completed desktop protocol',passed:false,detail:e.message});}}
 ok('No uncaught browser script errors',r.errors.length===0,r.errors);
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
