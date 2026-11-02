async page=>{
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_default_3D_loading_refresh_fallback',checks:[]},ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 try{
 let release;const held=new Promise(resolve=>release=resolve);
 await page.goto('about:blank');
 await page.route('**/s17-mudlogging-3d.js*',async route=>{await held;await route.continue();});
 await page.goto('http://127.0.0.1:8755/portal/index.html#/stage/mudlogging',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-ms-loading]:visible');ok('During 3D loading the 2D preview remains hidden',await page.locator('[data-ms-diagram]').isHidden());
 release();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready',{},{timeout:20000});
 ok('Default view is real Three.js 3D',await page.evaluate(()=>S17MudStage.snapshot().scene?.revision==='180'&&S17MudStage.snapshot().view==='3d'&&document.querySelector('[data-ms-diagram]').hidden));
 await page.unroute('**/s17-mudlogging-3d.js*');await page.reload();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='ready',{},{timeout:20000});ok('Refresh returns to 3D',await page.locator('[data-ms-diagram]').isHidden());
 await page.locator('[data-ms-play]').click();await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/teacher-update-stage-3d.png',timeout:15000});
 await page.locator('[data-ms-view]').click();ok('Explicit 2D view is still available',await page.locator('[data-ms-diagram]').isVisible());await page.locator('[data-ms-view]').click();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-ms-viewport]').scrollIntoViewIfNeeded();ok('390px 3D fits viewport',await page.evaluate(()=>document.querySelector('[data-ms-canvas]').clientWidth>150&&document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'output/playwright/teacher-update-stage-mobile.png',timeout:15000});
 await page.setViewportSize({width:1440,height:1000});
 // Exercise a genuine missing-bundle fallback in a fresh document.
 await page.route('**/s17-mudlogging-3d.js*',route=>route.abort());await page.reload();await page.waitForFunction(()=>S17MudStage.snapshot().rendererStatus==='fallback',{},{timeout:10000});ok('Failed 3D request enables a working 2D fallback',await page.locator('[data-ms-diagram]').isVisible());await page.unroute('**/s17-mudlogging-3d.js*');
 }catch(e){r.failure=e.stack;r.checks.push({name:'3D protocol completed',passed:false,detail:e.message});}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
