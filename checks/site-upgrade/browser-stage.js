async page=>{
 const BASE='http://127.0.0.1:8755/portal/index.html',ROOT='G:/可视化导论/5/';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_3D_transport_lifecycle',checks:[],pageErrors:[],states:{},screenshots:[]};
 const error=e=>r.pageErrors.push(e.message);page.on('pageerror',error);
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 const state=()=>page.evaluate(()=>S17MudStage.snapshot());
 try{
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(BASE+'#/stage/mudlogging');await page.locator('.ms-stage').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.S17MudStage?.snapshot().rendererStatus==='ready');
  ok('Local Three r180 scene renders in desktop Chrome',(await state()).scene?.revision==='180');
  await page.locator('select[data-ms-scenario]').selectOption('pause');
  await page.locator('[data-ms-seek]').fill('300');const a=await state();
  await page.locator('[data-ms-seek]').fill('450');const b=await state();r.states.pause300=a;r.states.pause450=b;
  ok('Pump stoppage advances time but preserves cumulative volume and transport progress',a.time_s===300&&b.time_s===450&&a.cumulativeVolume_m3===7.5&&a.cumulativeVolume_m3===b.cumulativeVolume_m3&&a.transportProgress===.375&&b.transportProgress===.375&&b.flow_m3_s===0);
  ok('Stopped-pump arrival is computed as 780 s',b.arrivalTime_s===780&&b.sourceReplay_s===120);
  await page.locator('select[data-ms-scenario]').selectOption('normal');ok('Normal circulation restores 600 s arrival',(await state()).arrivalTime_s===600);
  await page.locator('[data-ms-seek]').fill('300');await page.locator('[data-ms-play]').click();await page.waitForTimeout(250);const playing=await state();
  await page.locator('[data-ms-play]').click();const paused=await state();await page.waitForTimeout(200);const still=await state();
  ok('Playback pause freezes viewing time while pump flow remains 0.025 m³/s',playing.time_s>300&&paused.time_s===still.time_s&&still.flow_m3_s===.025&&!still.requestedPlaying);
  for(const camera of ['overview','return','surface','interpret']){await page.locator('[data-ms-camera="'+camera+'"]').click();await page.waitForTimeout(120);ok('Camera '+camera+' changes the actual scene state',(await state()).scene.camera===camera);}
  const beforeOrbit=(await state()).scene.cameraPosition;const canvas=page.locator('[data-ms-canvas] canvas');const box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.6,{steps:6});await page.mouse.up();await page.waitForTimeout(250);
  ok('Dragging changes the actual camera position',JSON.stringify(beforeOrbit)!==JSON.stringify((await state()).scene.cameraPosition));
  for(const id of ['m1','m2','m3','m4','m5']){await page.locator('[data-ms-object="'+id+'"]').click();ok('Object '+id+' focuses and links to its original case',(await state()).selectedObject===id&&(await page.locator('[data-ms-object-link]').getAttribute('href')).includes('/scene/'+id));}
  await page.locator('[data-ms-camera="overview"]').click();await page.locator('[data-ms-seek]').fill('450');await page.waitForTimeout(350);
  await page.locator('.ms-stage').scrollIntoViewIfNeeded();await page.screenshot({path:ROOT+'output/playwright/site-upgrade-3d-desktop.png'});r.screenshots.push('output/playwright/site-upgrade-3d-desktop.png');
  const canvasHeight=await page.locator('[data-ms-viewport]').evaluate(e=>e.getBoundingClientRect().height);ok('Desktop drawing stays within the 380–420px plan',canvasHeight>=380&&canvasHeight<=420,canvasHeight);
  await page.locator('[data-ms-view]').click();ok('Explicit two-dimensional view retains computed transport',(await state()).view==='2d'&&(await state()).time_s===450&&await page.locator('[data-ms-diagram] svg').count()===1);
  await page.locator('[data-ms-view]').click();await page.locator('[data-ms-play]').click();await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(250);const offscreen=await state();await page.waitForTimeout(200);const offscreenLater=await state();
  ok('Offscreen scene stops RAF, time and frame accumulation',!offscreen.inViewport&&!offscreen.rafScheduled&&offscreen.time_s===offscreenLater.time_s&&offscreen.scene.frameCount===offscreenLater.scene.frameCount);
  await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForTimeout(150);await page.locator('[data-ms-play]').click();
  await page.setViewportSize({width:390,height:844});await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForTimeout(180);
  ok('390px scene is 300px tall with no full-page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&Math.abs(document.querySelector('[data-ms-viewport]').getBoundingClientRect().height-300)<3));
  await page.screenshot({path:ROOT+'output/playwright/site-upgrade-3d-mobile.png'});r.screenshots.push('output/playwright/site-upgrade-3d-mobile.png');
  await page.evaluate(()=>location.hash='#/');await page.waitForFunction(()=>!S17MudStage.snapshot().mounted);const released=await state();r.states.released=released;
  ok('Leaving route releases the renderer and geometries',released.lifecycle.liveScenes===0&&released.lifecycle.scenesDisposed>=1&&released.lifecycle.lastDisposedScene?.resourceDisposals.renderer===true&&released.lifecycle.lastDisposedScene?.resourceDisposals.contextLost===true,released.lifecycle);
  await page.evaluate(()=>location.hash='#/stage/mudlogging');await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready');
  const reentered=await state();
  ok('Re-entering creates exactly one new live scene',reentered.lifecycle.liveScenes===1&&reentered.lifecycle.mounts===released.lifecycle.mounts+1&&reentered.lifecycle.scenesCreated===released.lifecycle.scenesCreated+1,reentered.lifecycle);
  ok('No uncaught page errors in 3D interactions',r.pageErrors.length===0,r.pageErrors);
 }catch(e){r.failure=e.message;r.checks.push({name:'3D protocol completes',passed:false,detail:e.stack});}
 finally{page.removeListener('pageerror',error);}
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}

