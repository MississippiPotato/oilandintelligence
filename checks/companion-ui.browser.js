async page=>{
 const BASE='http://127.0.0.1:8755/portal/index.html';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_companion_and_reading_navigation',checks:[],errors:[],cases:[],screenshots:[]};
 const error=e=>r.errors.push(e.message);page.on('pageerror',error);page.setDefaultTimeout(15000);
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const settled=()=>page.waitForFunction(()=>globalThis.S17ReadingPosition&&!S17ReadingPosition.snapshot().pending);
 const shot=async name=>{const p='G:/可视化导论/5/output/playwright/companion-ui-'+name+'.png';await page.screenshot({path:p});r.screenshots.push(p);};
 try{
  await page.setViewportSize({width:1440,height:1000});await page.goto(BASE+'?accept=companion');
  await page.waitForFunction(()=>globalThis.S17Live2D?.state==='ready');
  const first=await page.evaluate(()=>({state:S17Assistant.snapshot(),entry:document.getElementById('s17-agent-launcher').getBoundingClientRect().toJSON(),loaded:performance.getEntriesByType('resource').filter(e=>/pixi|cubismcore|s17-live2d-data/.test(e.name)).length}));
  ok('Live2D is already ready before opening the assistant',!first.state.open&&first.state.avatar==='Live2D Diana'&&first.loaded===4,first);
  ok('Desktop character entry is larger than the previous 62px icon',first.entry.width>=170&&first.entry.height>=180);
  ok('Invitation card is absent',await page.locator('#s17-agent-invite').count()===0);
  await shot('closed-desktop');await page.locator('#s17-agent-launcher').click();
  ok('Opening an empty conversation shows no introductory reply card',await page.locator('#s17-agent-reply').isHidden());
  const box=await page.locator('#s17-agent-panel').boundingBox();ok('Compact dialogue is 352px wide and under 210px high when empty',box.width<=354&&box.height<210,box);await shot('open-desktop');
  await page.locator('[data-ag-query="解释当前页"]').click();
  ok('An actual guide reply appears inside the same conversation panel',await page.locator('#s17-agent-panel #s17-agent-reply').isVisible()&&(await page.locator('#s17-agent-excerpt').innerText()).length>10);
  await page.locator('#s17-agent-history').click();ok('History opens without creating a second large chat window',await page.locator('#s17-agent-history-panel').isVisible()&&(await page.locator('#s17-agent-history-panel').boundingBox()).width<=354);
  await page.locator('#s17-agent-sheet-close').click();await page.locator('#s17-agent-badge').click();
  ok('Model connection controls remain accessible',await page.locator('.s17-agent-options[open]').isVisible()&&await page.locator('.s17-agent-options input[type="password"]').count()===1);
  await page.keyboard.press('Escape');await page.locator('#s17-agent-new').click();
  await page.setViewportSize({width:390,height:844});await shot('open-mobile');
  const mobile=await page.locator('#s17-assistant').boundingBox();ok('390px companion stays inside the viewport',mobile.x>=0&&mobile.x+mobile.width<=391&&mobile.y>=0,mobile);
  await page.locator('#s17-agent-close').click();const small=await page.locator('#s17-agent-launcher').boundingBox();ok('Phone character is also larger than the previous icon',small.width>=130&&small.height>=140,small);await shot('closed-mobile');
  await page.locator('#s17-agent-compact').click();ok('Explicit minimize still leaves a 44px control',Math.abs((await page.locator('#s17-assistant').boundingBox()).width-44)<1);await page.locator('#s17-agent-compact').click();await page.locator('#s17-agent-close').click();
  await page.setViewportSize({width:1440,height:1000});
  for(const [scene,id]of [['g1','s17x-g1-remote-lithology'],['m1','s17-cuttings-lithology'],['m2','s17-mudgas-context'],['co3','s17x-co3-completion-seal-test']]){
   await page.goto(BASE+'?accept=companion#/scene/'+scene+'?case='+id+'&tab=demo');
   const frame=page.frameLocator('#case-demo-root iframe');await frame.locator('[data-s17-embedded-lab]').waitFor();
   await frame.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{const api=globalThis.S17Inspect||globalThis.M2Inspect||globalThis.CaseInspect;const s=api?.snapshot?.();if(['ready','complete'].includes(s?.status)){clearInterval(timer);resolve(true);}else if(Date.now()-start>20000){clearInterval(timer);reject(Error('embedded calculation not ready'));}},30);}));
   await page.waitForFunction(()=>document.querySelector('iframe')?.dataset.s17Embedded==='ready');
   await frame.locator('body').evaluate(()=>new Promise(resolve=>setTimeout(resolve,180)));
   const detail=await frame.locator('body').evaluate(()=>({mode:S17EmbeddedDemo.snapshot(),nav:[...document.querySelectorAll('nav [data-tab],nav [data-fx-part],nav [data-part]')].filter(n=>n.getBoundingClientRect().height>0).map(n=>n.textContent),innerHeight,docHeight:document.documentElement.scrollHeight,assistantVisible:!!document.getElementById('s17-assistant')?.getBoundingClientRect().height,avatarResources:performance.getEntriesByType('resource').filter(e=>/pixi|cubismcore|s17-live2d-data/.test(e.name)).length,api:(globalThis.S17Inspect||globalThis.M2Inspect||globalThis.CaseInspect).snapshot().status}));
   ok(scene+' embedded demo shows the experiment without a second three-part navigation',detail.mode.enabled&&detail.nav.length===0,detail);
   ok(scene+' iframe expands to its content instead of an inner vertical scrollbar',detail.innerHeight>=detail.docHeight-2,detail);
   ok(scene+' embedded case has no duplicate assistant or avatar download',!detail.assistantVisible&&detail.avatarResources===0,detail);
   ok(scene+' reading page retains the enlarged character',(await page.locator('#s17-agent-launcher').boundingBox()).width>=170);
   r.cases.push({scene,id,...detail});
   if(scene==='g1'){
    await page.locator('#tabs [data-tab="bg"]').click();await settled();ok('First background visit starts at page top',await page.evaluate(()=>scrollY<3));
    await page.mouse.wheel(0,780);await page.waitForFunction(()=>scrollY>600);const bgY=await page.evaluate(()=>scrollY);
    await page.locator('#tabs [data-tab="flow"]').click();await settled();ok('First workflow visit starts at page top',await page.evaluate(()=>scrollY<3));
    await page.mouse.wheel(0,560);await page.waitForFunction(()=>scrollY>400);const flowY=await page.evaluate(()=>scrollY);
    await page.locator('#tabs [data-tab="bg"]').click();await settled();ok('Returning to background restores its previous reading position',await page.evaluate(y=>Math.abs(scrollY-y)<8,bgY),{expected:bgY,actual:await page.evaluate(()=>scrollY)});
    await page.locator('#tabs [data-tab="flow"]').click();await settled();ok('Returning to workflow restores its separate previous position',await page.evaluate(y=>Math.abs(scrollY-y)<8,flowY),{expected:flowY,actual:await page.evaluate(()=>scrollY)});
    await page.locator('#tabs [data-tab="demo"]').click();await settled();await page.locator('#case-demo-root').scrollIntoViewIfNeeded();await shot('g1-experiment');
    await frame.locator('[data-s17-embedded-lab]').click({position:{x:20,y:20}});await page.keyboard.press('Control+k');ok('Search shortcut from inside the experiment reaches the portal',await page.locator('#s17-search-input').isVisible());await page.keyboard.press('Escape');
   }
  }
  await page.keyboard.press('Control+k');await page.locator('#s17-search-input').fill('迟到');await page.locator('[data-section-id="s17-mudgas-context:bg:1"]').click();await page.waitForFunction(()=>S17Search.snapshot().lastNavigation?.status==='focused');
  ok('Chapter deep links keep their focused heading instead of being reset to top',await page.evaluate(()=>document.getElementById('learn-s17-mudgas-context-bg-1').contains(document.activeElement)));
  await page.setViewportSize({width:390,height:844});await page.locator('#tabs [data-tab="demo"]').click();await settled();await page.frameLocator('iframe').locator('[data-s17-embedded-lab]').waitFor();await page.locator('#case-demo-root').scrollIntoViewIfNeeded();await shot('m2-experiment-mobile');
  ok('Phone experiment retains a 136px character',(await page.locator('#s17-agent-launcher').boundingBox()).width>=130);
  ok('390px experiment keeps the outer page within viewport width',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  ok('No uncaught browser script errors',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Companion interaction protocol completed',passed:false,detail:e.message});}
 finally{page.removeListener('pageerror',error);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
