async page=>{
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_five_SVG_storyboard',checks:[],states:[],errors:[]};
 const err=e=>r.errors.push(e.message);page.on('pageerror',err);
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 try{
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:8755/portal/index.html?storyboard='+Date.now()+'#/stage/mudlogging');
  await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready');
  ok('Five distinct illustrated frames supplement the 3D scene',await page.locator('button[data-ms-phase] .ms-frame-picture').count()===5);
  for(let i=0;i<5;i++){const b=page.locator('button[data-ms-phase="'+i+'"]');await b.click();const s=await page.evaluate(()=>S17MudStage.snapshot());r.states.push({phase:i,time_s:s.time_s,phaseIndex:s.phaseIndex,camera:s.camera,title:await b.innerText()});ok('Frame '+(i+1)+' changes real time, stage and camera',s.phaseIndex===i&&(await b.getAttribute('aria-pressed'))==='true'&&await page.locator('button[data-ms-phase][aria-pressed=true]').count()===1);}
  await page.locator('.ms-phases').screenshot({path:'G:/可视化导论/5/output/playwright/site-upgrade-storyboard-desktop.png'});
  await page.locator('button[data-ms-phase="1"]').focus();await page.keyboard.press('Enter');ok('A storyboard frame works from the keyboard',await page.evaluate(()=>S17MudStage.snapshot().phaseIndex===1));
  await page.setViewportSize({width:390,height:844});const strip=page.locator('.ms-story-scroll');await strip.scrollIntoViewIfNeeded();await strip.evaluate(e=>e.scrollLeft=0);await strip.hover();await page.mouse.wheel(400,0);await page.waitForFunction(()=>document.querySelector('.ms-story-scroll').scrollLeft>0);
  const layout=await page.evaluate(()=>{const e=document.querySelector('.ms-story-scroll');return {page:document.documentElement.scrollWidth,width:innerWidth,local:e.clientWidth,content:e.scrollWidth,scrollLeft:e.scrollLeft,canvasHeight:document.querySelector('[data-ms-viewport]').getBoundingClientRect().height};});
  ok('390px strip actually scrolls locally without stretching the page',layout.page<=layout.width&&layout.content>layout.local&&layout.scrollLeft>0&&layout.canvasHeight===300,layout);
  await page.screenshot({path:'G:/可视化导论/5/output/playwright/site-upgrade-storyboard-mobile.png'});ok('No uncaught storyboard errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Storyboard protocol completes',passed:false,detail:e.stack});}
 finally{page.removeListener('pageerror',err);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}

