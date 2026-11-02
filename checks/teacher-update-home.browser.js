async page=>{
 const base='http://127.0.0.1:8755/portal/index.html',r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_automatic_miniatures',checks:[]};
 const ok=(name,v,detail)=>{r.checks.push({name,passed:!!v,detail});if(!v)throw Error(name);};
 try{
 await page.goto(base);await page.waitForSelector('[data-stage-motion]');
 const card=page.locator('[data-stage-motion=geology]');await card.scrollIntoViewIfNeeded();
 const read=()=>card.evaluate(el=>({playing:el.classList.contains('is-playing'),visible:el.classList.contains('is-visible'),animations:el.getAnimations({subtree:true}).map(a=>({time:a.currentTime,iterations:a.effect.getTiming().iterations,state:a.playState}))}));
 await page.waitForTimeout(500);const a=await read();await page.waitForTimeout(4700);const b=await read();
 ok('Miniature automatically continues beyond first four-second cycle',b.playing&&b.visible&&b.animations.some(x=>x.time>4000&&x.iterations===Infinity),{before:a,after:b});
 ok('All thirteen stages have independent SVG scenes',await page.locator('[data-stage-motion] svg').count()===13);
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForFunction(()=>!document.querySelector('[data-stage-motion=geology]').classList.contains('is-visible'));ok('Offscreen miniature pauses',await card.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused')));
 await page.emulateMedia({reducedMotion:'reduce'});ok('Reduced-motion keeps readable static miniatures',await card.evaluate(el=>getComputedStyle(el).animationName==='none'));await page.emulateMedia({reducedMotion:'no-preference'});
 await page.screenshot({path:'output/playwright/teacher-update-home.png',fullPage:false,timeout:20000,animations:'disabled'});
 }catch(e){r.failure=e.stack;r.checks.push({name:'Interface protocol completed',passed:false,detail:e.message});}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
