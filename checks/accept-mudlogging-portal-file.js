async page=>{
 const result=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.context().setOffline(true);
 for(const [scene,id] of [['m2','s17-mudgas-context'],['m3','s17-fluorescence-review']]){
  try{await page.goto('file:///G:/可视化导论/5/portal/index.html#/scene/'+scene+'?case='+id+'&tab=demo');await page.waitForSelector('#case-demo-root iframe',{timeout:30000});const f=page.frameLocator('#case-demo-root iframe');await f.locator('body').evaluate(()=>new Promise((res,rej)=>{let n=0;const t=setInterval(()=>{const s=globalThis.S17Inspect?.snapshot()??globalThis.M2Inspect?.snapshot();if(s?.status==='ready'){clearInterval(t);res();}else if(++n>1200){clearInterval(t);rej(Error('ready timeout'));}},25);}));result.push({scene,ready:true,src:await page.locator('#case-demo-root iframe').getAttribute('src')});}catch(e){result.push({scene,ready:false,error:String(e)});}
 }
 await page.context().setOffline(false);return {scope:'sampled enhanced portal file:// offline (m2,m3)',result,errors};
}
