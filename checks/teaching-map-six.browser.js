async page=>{
 const c=__CFG__,BASE='http://127.0.0.1:8755/',OUT='handoff/teaching-map-2026-11-01/',r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_six_case_paths',scene:c.scene,caseId:c.id,checks:[],downloads:[],screenshots:[],errors:[]};
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name)},err=e=>r.errors.push(e.message);page.on('pageerror',err);page.setDefaultTimeout(18000);
 const snapshot=async f=>f.locator('body').evaluate(()=>{const s=(globalThis.S17Inspect||globalThis.M2Inspect||globalThis.CaseInspect).snapshot();return s;});
 const ready=async f=>f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{const s=(globalThis.S17Inspect||globalThis.M2Inspect||globalThis.CaseInspect)?.snapshot();if(s?.status==='ready'&&!document.querySelector('#export')?.disabled){clearInterval(timer);resolve(true);}else if(n++>1000){clearInterval(timer);reject(Error('ready timeout'));}},30);}));
 const runid=s=>s.run?.runId||s.runId;
 const lab=async f=>{if(c.scene==='m2')await f.locator('.m2-tabs [data-part=lab]').click();else if(c.scene==='d1')await f.locator('nav [data-tab=lab]').click();else await f.locator('.fx-parts [data-fx-part=lab]').click();};
 const after=async(f,action)=>{const old=await snapshot(f);await action();await f.locator('body').evaluate(id=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{const s=(globalThis.S17Inspect||globalThis.M2Inspect||globalThis.CaseInspect).snapshot();if(s.status==='ready'&&(s.run?.runId||s.runId)!==id){clearInterval(t);resolve(true);}else if(n++>1000){clearInterval(t);reject(Error('condition did not recalculate'));}},30);}),runid(old));return {old,current:await snapshot(f)};};
 async function change(f){
  await lab(f);let v;
  if(c.scene==='m1'){await f.locator('[data-m1-stage="0"]').click();v=await after(f,()=>f.locator('#m1-light').fill('0.65'));ok('Illumination changes current pixels/features',v.current.run.config.light===.65&&JSON.stringify(v.old.run.selectedResult.features)!==JSON.stringify(v.current.run.selectedResult.features));}
  if(c.scene==='m2'){v=await after(f,()=>f.locator('#volume').fill('14'));ok('Transport volume changes source, preserves gas',v.old.results[0].features.sourceTime_s!==v.current.results[0].features.sourceTime_s&&v.old.gasSignature===v.current.gasSignature);const gas=v.current.gasSignature;v=await after(f,()=>f.locator('#override').selectOption('trip'));ok('Context switch preserves gas and recalculates neighbors',gas===v.current.gasSignature&&JSON.stringify(v.old.results[0].prediction.neighbors)!==JSON.stringify(v.current.results[0].prediction.neighbors));}
  if(c.scene==='m3'){await f.locator('[data-m3-stage="1"]').click();v=await after(f,()=>f.locator('[data-m3-exposure]').fill('2'));ok('Exposure changes actual pixel result with same pair',v.current.exposure===2&&v.old.identity.capturePairId===v.current.identity.capturePairId&&JSON.stringify(v.old.pixelCounts)!==JSON.stringify(v.current.pixelCounts));}
  if(c.scene==='m4'){await f.locator('[data-m4-stage="1"]').click();v=await after(f,()=>f.locator('#m4-normalize').uncheck());ok('Correction changes response, preserves raw ROP',v.old.selectedrow.ROP_m_h===v.current.selectedrow.ROP_m_h&&v.old.selectedrow.relativeResponse!==v.current.selectedrow.relativeResponse);}
  if(c.scene==='m5'){await f.locator('[data-m5-stage="0"]').click();v=await after(f,()=>f.locator('[data-m5-example=value]').click());ok('Edited numeric fact is really extracted',v.current.facts.some(x=>x.fields.gasValue===5.1)&&v.current.run.metrics===null);}
  if(c.scene==='d1'){v=await after(f,()=>f.locator('#maxPressure').fill('15'));ok('Pressure constraint changes feasible count',v.current.params.maxPressure===15&&v.old.optimization.feasible!==v.current.optimization.feasible);}
  r.checks.push({name:'Actual run changed',passed:runid(v.old)!==runid(v.current),detail:{before:runid(v.old),after:runid(v.current)}});
 }
 async function save(f,name){await f.locator('#export').scrollIntoViewIfNeeded();const promise=page.waitForEvent('download',{timeout:12000});await f.locator('#export').click();const d=await promise;const path=OUT+c.scene+'-'+name+'.json';await d.saveAs(path);r.downloads.push(path);ok(name+' downloaded',!!d.suggestedFilename());}
 async function shot(name){const path='output/playwright/teaching-map-'+c.scene+'-'+name+'.png';await page.screenshot({path});r.screenshots.push(path);}
 try{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1000});await page.context().setOffline(true);
  if(!c.phase||c.phase==='offline'){
  await page.goto('file:///G:/可视化导论/5/'+c.folder+'/demo/index.html#lab');await ready(page);r.default=await snapshot(page);ok('Offline default result computed',r.default.status==='ready');
  const flowSelector=c.scene==='d1'?'.xl-method-step':c.scene==='m2'?'#workflow-content [data-m2-flow-step]':'#fx-flow-current .lesson-method-step';
  const count=c.scene==='m2'?await page.locator('#workflow-content').evaluate(el=>el.querySelectorAll('.m2-flow-panel').length):await page.locator(flowSelector).count();
  ok('All workflow steps present',count===c.steps,{count,expected:c.steps});
  if(c.scene==='m1'){const shown=Number(await page.locator('[data-teach-distance]').getAttribute('data-teach-distance'));ok('Shown distance equals actual nearest neighbor',Math.abs(shown-r.default.run.selectedResult.neighbors[0].distance)<1e-10);}
  if(c.scene==='d1'){const sum=Number(await page.locator('#d1-current-calculation [data-teach-sum]').getAttribute('data-teach-sum'));ok('Shown contribution sum equals current model result',Number.isFinite(sum));}
  await change(page);await shot('desktop-result');await save(page,'offline-result');
  await page.setViewportSize({width:390,height:844});await lab(page);ok('390px no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('mobile-result');}
  await page.context().setOffline(false);await page.setViewportSize({width:1440,height:1000});if(!c.phase||c.phase==='portal'){await page.goto(BASE+'portal/index.html#/scene/'+c.scene+'?case='+c.id+'&tab=bg');await page.waitForFunction(id=>document.querySelector('main')?.dataset.s17CaseId===id&&document.querySelector('main')?.dataset.s17CaseReady==='true',c.id);
  ok('Portal overview and data checklist',await page.locator('[data-course-brief]').count()===1&&await page.locator('[data-course-preparation]').count()===1);await page.locator('[data-course-check]').first().check();ok('Checklist is interactive',(await page.locator('.tb-preparation output').innerText()).startsWith('1 /'));
  await page.locator('#tabs [data-tab=flow]').click();ok('Portal continuous workflow visible',await page.locator('[data-panel=flow]').locator(c.scene==='d1'?'.xl-method-step':c.scene==='m2'?'.m2-flow-panel':'.lesson-method-step').count()===c.steps);await shot('portal-workflow');
  await page.locator('#tabs [data-tab=demo]').click();let f=page.frameLocator('#case-demo-root iframe');await ready(f);ok('Portal embeds only lab',await f.locator('body').evaluate(()=>globalThis.S17EmbeddedDemo?.snapshot().enabled===true));}
  if(!c.phase||c.phase==='native'){await page.goto(BASE+'portal-original/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles('G:/可视化导论/5/'+c.folder);await page.waitForFunction(id=>document.getElementById('imp-id')?.value===id,c.id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.waitForFunction(id=>CaseImport.list().some(c=>c.id===id),c.id);ok('Teacher Add Case accepts folder',true);
  await page.locator('#tabs [data-tab=flow]').click();ok('Teacher workflow is substantial',(await page.locator('[data-panel=flow]').innerText()).length>500);
  await page.locator('#tabs [data-tab=demo]').click();let f=page.frameLocator('#case-demo-root iframe');await ready(f);await change(f);await save(f,'teacher-before-refresh');await page.reload();f=page.frameLocator('#case-demo-root iframe');await ready(f);await change(f);await save(f,'teacher-after-refresh');await shot('teacher-refreshed');ok('Teacher import survived refresh and runs again',true);}
  ok('No uncaught JavaScript errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.stack;r.checks.push({name:'Case protocol completed',passed:false,detail:e.message});}
 finally{await page.context().setOffline(false);page.removeListener('pageerror',err);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
