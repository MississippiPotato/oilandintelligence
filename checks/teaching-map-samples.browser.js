async page=>{
 const base='http://127.0.0.1:8755/portal/index.html',r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_two_other_stage_samples',checks:[],errors:[]},ok=(name,v)=>{r.checks.push({name,passed:!!v});if(!v)throw Error(name)},err=e=>r.errors.push(e.message);page.on('pageerror',err);
 try{
 await page.setViewportSize({width:1440,height:1000});
 for(const [scene,id,input,value]of [['g1','s17x-g1-remote-lithology','#shadow','0.5'],['r5','s17x-r5-quality-softsensor','#delay','40']]){
 await page.goto(base+'#/scene/'+scene+'?case='+id+'&tab=bg');await page.waitForFunction(id=>document.querySelector('main')?.dataset.s17CaseReady==='true'&&document.querySelector('main')?.dataset.s17CaseId===id,id);
 ok(scene+' background has scene overview, concept visual and preparation',await page.locator('[data-course-brief]').count()===1&&await page.locator('[data-panel=bg] svg').count()>0&&await page.locator('[data-course-preparation]').count()===1);
 await page.locator('#tabs [data-tab=flow]').click();ok(scene+' flow has diagrams and no iframe',await page.locator('[data-panel=flow] svg').count()>0&&await page.locator('iframe').count()===0);
 await page.locator('#tabs [data-tab=demo]').click();const f=page.frameLocator('iframe');await f.locator('#export').waitFor();await f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(['ready','complete'].includes(CaseInspect?.snapshot().status)){clearInterval(t);resolve(true);}else if(n++>600){clearInterval(t);reject(Error('ready timeout'));}},30);}));const old=await f.locator('body').evaluate(()=>CaseInspect.snapshot().runId);await f.locator(input).fill(value);await f.locator('body').evaluate(old=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{const s=CaseInspect.snapshot();if(['ready','complete'].includes(s.status)&&s.runId!==old){clearInterval(t);resolve(true);}else if(n++>600){clearInterval(t);reject(Error('rerun timeout'));}},30);}),old);ok(scene+' actual changed-input recalculation and lab-only embedding',await f.locator('body').evaluate(()=>S17EmbeddedDemo.snapshot().enabled));
 }
 ok('No uncaught sampled case errors',r.errors.length===0);
 }catch(e){r.failure=e.stack;r.checks.push({name:'Sample paths complete',passed:false,detail:e.message});}finally{page.removeListener('pageerror',err);}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
