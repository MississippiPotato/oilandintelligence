async page=>{
 const BASE='http://127.0.0.1:8755/portal/index.html';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_search',checks:[],pageErrors:[]};
 const err=e=>r.pageErrors.push(e.message);page.on('pageerror',err);
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 const ready=async id=>page.waitForFunction(id=>document.querySelector('#view main')?.dataset.s17CaseId===id&&document.querySelector('#view main')?.dataset.s17CaseReady==='true',id);
 try{
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(BASE);await page.waitForFunction(()=>S17HomeReady());
  const initial=await page.evaluate(()=>({heavy:performance.getEntriesByType('resource').filter(e=>/case-content|mudlogging-3d|pixi|cubism|live2d-data|welllog-layer\.(case|demo)/.test(e.name)).map(e=>e.name),iframes:document.querySelectorAll('iframe').length,authored:S17CaseCatalog.cases.length,teacher:S17CaseCatalog.teacherCases.length}));
  ok('Untouched homepage has no heavy body/avatar/3D request or iframe',initial.heavy.length===0&&initial.iframes===0,initial);
  ok('65 authored cases and one teacher sample are separate',initial.authored===65&&initial.teacher===1);
  await page.locator('#s17-search-open').click();await page.locator('#s17-search-input').fill('迟到');
  ok('Search returns case and knowledge without loading bodies',await page.locator('[data-section-id="s17-mudgas-context:bg:1"]').count()===1&&await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('case-content')).length)===0);
  await page.keyboard.press('ArrowDown');ok('ArrowDown selects next result',await page.evaluate(()=>S17Search.snapshot().activeIndex)===1);
  await page.keyboard.press('Escape');ok('Esc restores focus to search launcher',await page.evaluate(()=>!S17Search.snapshot().open&&document.activeElement.id==='s17-search-open'));
  await page.keyboard.press('Control+k');await page.locator('#s17-search-input').fill('迟到');await page.locator('[data-section-id="s17-mudgas-context:bg:1"]').click();await ready('s17-mudgas-context');
  await page.waitForFunction(()=>S17Search.snapshot().lastNavigation?.status==='focused');
  ok('Knowledge deep link focuses the actual chapter heading',await page.evaluate(()=>document.getElementById('learn-s17-mudgas-context-bg-1').contains(document.activeElement)&&document.activeElement.matches('h2')));
  await page.reload();await ready('s17-mudgas-context');await page.waitForFunction(()=>S17Search.snapshot().lastNavigation?.status==='focused');
  ok('Refreshing a deep link restores heading focus',await page.evaluate(()=>document.getElementById('learn-s17-mudgas-context-bg-1').contains(document.activeElement)));
  await page.locator('#tabs [data-tab=flow]').click();ok('Existing workflow tab still navigates',page.url().includes('tab=flow'));
  await page.evaluate(()=>location.hash='#/scene/g1?case=s17x-g1-remote-lithology&tab=bg');await ready('s17x-g1-remote-lithology');await page.goBack();await ready('s17-mudgas-context');
  ok('Back preserves case and selected workflow tab',page.url().includes('tab=flow'));
  await page.goForward();await ready('s17x-g1-remote-lithology');ok('Forward restores next case route',page.url().includes('/scene/g1'));
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Control+k');await page.locator('#s17-search-input').fill('验封');
  ok('390px header and modal fit without horizontal page scrolling',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.ss-dialog').getBoundingClientRect().right<=innerWidth));
  await page.screenshot({path:'G:/可视化导论/5/output/playwright/site-upgrade-search-mobile.png'});await page.keyboard.press('Escape');
  ok('No uncaught search/navigation errors',r.pageErrors.length===0,r.pageErrors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Search protocol completed',passed:false,detail:e.stack});}
 finally{page.removeListener('pageerror',err);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
