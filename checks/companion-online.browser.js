async page=>{
 const BASE='https://mississippipotato.github.io/oilandintelligence/portal/index.html?ui=20261101';
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_published_companion',checks:[],errors:[]};
 const error=e=>r.errors.push(e.message);page.on('pageerror',error);page.setDefaultTimeout(25000);
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 try{
  await page.setViewportSize({width:1440,height:1000});await page.goto(BASE,{timeout:45000});
  await page.waitForFunction(()=>globalThis.S17Assistant?.snapshot().version==='0.8.0'&&globalThis.S17Live2D?.state==='ready');
  ok('Published character starts before opening the dialogue',await page.evaluate(()=>!S17Assistant.snapshot().open&&S17Live2D.state==='ready'));
  ok('Published character has its enlarged entry',await page.locator('#s17-agent-launcher').evaluate(n=>n.getBoundingClientRect().width===174));
  ok('Published invitation card is absent',await page.locator('#s17-agent-invite').count()===0);
  await page.locator('#s17-agent-launcher').click();ok('Published initial dialogue has no introduction bubble',await page.locator('#s17-agent-reply').isHidden());
  await page.locator('#s17-assistant').screenshot({path:'G:/可视化导论/5/output/playwright/companion-ui-online-panel.png'});await page.locator('#s17-agent-close').click();
  await page.goto(BASE+'#/scene/g1?case=s17x-g1-remote-lithology&tab=demo');const f=page.frameLocator('iframe');await f.locator('[data-s17-embedded-lab]').waitFor();
  await page.waitForFunction(()=>document.querySelector('iframe')?.dataset.s17Embedded==='ready');
  const detail=await f.locator('body').evaluate(()=>({mode:S17EmbeddedDemo.snapshot(),nav:[...document.querySelectorAll('nav [data-tab]')].filter(n=>n.getBoundingClientRect().height>0).length,js:[...document.scripts].map(n=>n.src).filter(Boolean)}));
  ok('Published demonstration goes straight to its experiment',detail.mode.enabled&&detail.nav===0,detail);
  ok('Published demonstration uses the new cache version',detail.js.some(url=>url.includes('demo.js?v=20261101-companion')),detail.js);
  const before=await f.locator('body').evaluate(()=>CaseInspect.snapshot().runId);await f.locator('#shadow').fill('0.5');
  await f.locator('body').evaluate(n=>new Promise((resolve,reject)=>{const start=Date.now(),t=setInterval(()=>{const s=CaseInspect.snapshot();if(s.status==='ready'&&s.runId!==n){clearInterval(t);resolve(true);}else if(Date.now()-start>20000){clearInterval(t);reject(Error('published recalculation timeout'));}},30);}),before);
  ok('Published experiment actually recalculates',await f.locator('body').evaluate(()=>CaseInspect.snapshot().params.shadow===.5));
  ok('No uncaught errors in the published interaction',r.errors.length===0,r.errors);
 }catch(e){r.failure=e.message;r.checks.push({name:'Published companion protocol completed',passed:false,detail:e.message});}
 finally{page.removeListener('pageerror',error);}
 r.passed=r.checks.filter(c=>c.passed).length;r.failed=r.checks.filter(c=>!c.passed).length;return r;
}
