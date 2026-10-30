import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const ROOT=path.resolve(import.meta.dirname,'..'),REPORT='handoff/site-upgrade-2026-10-30',SESSION='upgrade-variants';
const CONFIG={
  g3:{id:'s17x-g3-closure-spill',scene:'g3',lab:'lab',control:'[data-param="saddle"]',kind:'range',expected:65,param:'saddle',reset:'[data-action="reset"]',save:'[data-action="export"]',shot:'[data-lab-map]'},
  p1:{id:'s17x-p1-perforation-depth-correlation',scene:'p1',lab:'lab',control:'#scenario',kind:'select',value:'periodic',expected:'periodic',param:'scenario',reset:'#reset',save:'#export',shot:'#alignment'},
  c1:{id:'s17x-c1-cement-woc-strength',scene:'c1',lab:'demo',control:'[data-param="program"]',kind:'select',value:'constant',expected:'constant',param:'program',reset:'[data-reset]',save:'[data-export]',shot:'[data-panel="demo"] .vx-card'},
  co3:{id:'s17x-co3-completion-seal-test',scene:'co3',lab:'demo',control:'[data-param="drift"]',kind:'range',expected:3,param:'drift',reset:'[data-reset]',save:'[data-export]',shot:'[data-panel="demo"] .vx-card'}
};
const [scene,phase='desktop']=process.argv.slice(2),c=CONFIG[scene];
if(!c||!['desktop','mobile','offline','native'].includes(phase))throw Error('Pass scene g3/p1/c1/co3 and desktop/mobile/offline/native');
const cfg={...c,phase,root:ROOT.replaceAll('\\','/')+'/',base:'http://127.0.0.1:8755/',folder:'dist/expansion-cases/'+c.id,report:REPORT};
cfg.fileUrl=pathToFileURL(path.join(ROOT,cfg.folder,'demo/index.html')).href;
fs.mkdirSync(path.join(ROOT,REPORT),{recursive:true});
fs.mkdirSync(path.join(ROOT,'output/playwright'),{recursive:true});

async function browserProtocol(page,c){
  const r={checkedAt:new Date().toISOString(),caseId:c.id,scene:c.scene,phase:c.phase,kind:'actual_Chrome_variant_paths',checks:[],errors:[],externalRequests:[],downloads:[],screenshots:[]};
  const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
  const onError=e=>r.errors.push(e.message),onRequest=req=>{const u=req.url();if(/^https?:/.test(u)&&!u.startsWith(c.base))r.externalRequests.push(u);};
  page.on('pageerror',onError);page.on('request',onRequest);page.setDefaultTimeout(16000);
  const ready=async f=>f.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const started=Date.now(),tick=()=>{let s;try{s=globalThis.CaseInspect?.snapshot?.();}catch{}if(s&&(s.ready===true||['ready','complete','done','completed'].includes(s.status))){resolve(true);return true;}if(Date.now()-started>22000){reject(Error('CaseInspect did not become ready'));return true;}return false;};if(tick())return;const timer=setInterval(()=>{if(tick())clearInterval(timer);},30);}));
  const summary=async f=>f.locator('body').evaluate(()=>{
    const s=CaseInspect.snapshot(),e=CaseInspect.evidence(),a=e.result||e,hash=x=>{const z=JSON.stringify(x);let h=2166136261;for(let i=0;i<z.length;i++)h=Math.imul(h^z.charCodeAt(i),16777619);return(h>>>0).toString(16);};
    const area=document.querySelector('#lab')||document.querySelector('[data-panel="demo"]')||document.body;
    return{caseId:s.caseId||e.caseId,status:s.status||s.state,params:s.params||a.params||a.config,inferenceHash:hash(a.prediction||a.inference||s.prediction),graphicHash:hash([...area.querySelectorAll('svg,canvas')].map(n=>n.outerHTML)),svgCount:area.querySelectorAll('svg,canvas').length,finite:!(/NaN|Infinity/.test(area.innerHTML))};
  });
  const openLab=async f=>{await f.locator('nav [data-tab="'+c.lab+'"]').click();await ready(f);};
  const download=async(f,suffix)=>{const pending=page.waitForEvent('download');await f.locator(c.save).click();const d=await pending,name=c.report+'/browser-variants-'+c.scene+'-'+suffix+'-download.json';await d.saveAs(name);r.downloads.push({path:name,suggestedFilename:d.suggestedFilename()});ok(suffix+' actual download saved',!!d.suggestedFilename(),name);};
  const exercise=async(f,label,save=true)=>{
    await openLab(f);const before=await summary(f);ok(label+' default ready with computed graphic',before.caseId===c.id&&before.svgCount>0&&before.finite,before);
    const control=f.locator(c.control);if(c.kind==='select')await control.selectOption(c.value);else{await control.focus();await control.press('End');}
    await f.locator('body').evaluate(({key,value,prior})=>new Promise((resolve,reject)=>{const started=Date.now(),t=setInterval(()=>{try{const s=CaseInspect.snapshot(),e=CaseInspect.evidence(),p=s.params||e.params||e.config;if(p?.[key]===value&&['ready','complete','done','completed'].includes(s.status||s.state)){clearInterval(t);resolve(true);}else if(Date.now()-started>22000){clearInterval(t);reject(Error('auto recomputation did not reflect '+key));}}catch(e){if(Date.now()-started>22000){clearInterval(t);reject(e);}}},35);}),{key:c.param,value:c.expected,prior:before.inferenceHash});
    const changed=await summary(f);ok(label+' real control auto recalculates input and inference',changed.params[c.param]===c.expected&&changed.inferenceHash!==before.inferenceHash,{before,changed});ok(label+' actual graph changes and remains finite',changed.graphicHash!==before.graphicHash&&changed.finite,{before:before.graphicHash,after:changed.graphicHash});
    if(save)await download(f,label);
    await f.locator(c.reset).click();await ready(f);const restored=await summary(f);ok(label+' reset restores actual default inference',restored.inferenceHash===before.inferenceHash&&JSON.stringify(restored.params)===JSON.stringify(before.params),{restored});return{before,changed,restored};
  };
  try{
    await page.setViewportSize({width:c.phase==='mobile'?390:1440,height:c.phase==='mobile'?844:1000});await page.emulateMedia({reducedMotion:'reduce'});
    let f=page;
    if(c.phase==='native'){
      await page.goto(c.base+'portal-original/index.html#/cases');await page.waitForFunction(id=>!globalThis.CaseImport?.list().some(x=>x.id===id),c.id);r.setupActions=['For a repeated protocol run, the previous import of only this case is removed using the actual case-library UI and its confirmation before the current package is imported.'];
      await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles(c.root+c.folder);await page.waitForFunction(id=>document.getElementById('imp-id')?.value===id,c.id);await page.getByRole('button',{name:'校验并添加',exact:true}).click();
      await page.waitForFunction(id=>globalThis.CaseImport?.list().some(x=>x.id===id),c.id);ok('teacher original directory import persisted',true);
      await page.locator('#tabs [data-tab="bg"]').click();ok('teacher imported professional background is substantive',(await page.locator('[data-panel="bg"]').innerText()).length>500);
      await page.locator('#tabs [data-tab="flow"]').click();const nativeFlow=page.locator('[data-panel="flow"]');ok('teacher imported workflow preserves explanatory text',(await nativeFlow.innerText()).length>500);
      const products=await nativeFlow.locator('.pstep').evaluateAll(nodes=>nodes.map(n=>({name:n.querySelector('h4')?.innerText,action:n.querySelector('.pdo')?.innerText||'',product:n.querySelector('.peff')?.innerText||''})));ok('teacher imported every step retains action and product',products.length>=4&&products.every(s=>s.action.length>8&&s.product.length>8),products);r.nativeWorkflow=products;
      await page.locator('#tabs [data-tab="demo"]').click();f=page.frameLocator('iframe');await ready(f);r.nativeFirst=await exercise(f,'native');
      await page.reload();await page.locator('#tabs [data-tab="demo"]').click();f=page.frameLocator('iframe');await ready(f);r.nativeRefresh=await exercise(f,'native-refresh');ok('teacher imported package survives refresh and reruns',true);
    }else{
      if(c.phase==='offline')await page.context().setOffline(true);
      await page.goto(c.phase==='offline'?c.fileUrl:c.base+c.folder+'/demo/index.html');await ready(f);
      ok(c.phase+' actual URL',c.phase==='offline'?page.url().startsWith('file:'):page.url().startsWith(c.base),page.url());
      await f.locator('nav [data-tab="background"]').click();const bodyText=await f.locator('body').innerText();ok('professional background renders substantive source content',bodyText.length>500,{characters:bodyText.length});
      await f.locator('nav [data-tab="workflow"]').click();ok('workflow has readable input and product content',(await f.locator('body').innerText()).length>500);
      r.run=await exercise(f,c.phase);
    }
    if(c.phase==='mobile'){
      const geometry=await f.locator('body').evaluate(()=>({viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,scrollables:[...document.querySelectorAll('div')].map((n,index)=>({n,index})).filter(({n})=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+1&&/auto|scroll/.test(getComputedStyle(n).overflowX)&&n.getBoundingClientRect().height>0).map(({n,index})=>({index,className:n.className,width:n.clientWidth,scrollWidth:n.scrollWidth})),svgs:[...document.querySelectorAll('svg')].filter(n=>n.getBoundingClientRect().width>0&&n.querySelector('text')).map(n=>{const b=n.getBoundingClientRect(),fontPixels=[...n.querySelectorAll('text')].map(t=>{const m=t.getScreenCTM();return parseFloat(getComputedStyle(t).fontSize)*Math.hypot(m?m.a:1,m?m.b:0);});return{width:b.width,height:b.height,viewBox:n.getAttribute('viewBox'),minActualTextPx:Math.min(...fontPixels),maxActualTextPx:Math.max(...fontPixels)};})}));
      if(geometry.scrollables.length){const node=f.locator('div').nth(geometry.scrollables[0].index),before=await node.evaluate(n=>n.scrollLeft);await node.hover();await page.mouse.wheel(400,0);const after=await node.evaluate((n,b)=>new Promise(resolve=>{const start=Date.now(),timer=setInterval(()=>{if(n.scrollLeft!==b||Date.now()-start>2000){clearInterval(timer);resolve(n.scrollLeft);}},30);}),before);geometry.actualScroll={before,after,moved:after!==before};await page.mouse.wheel(-10000,0);await node.evaluate(n=>new Promise(resolve=>{const start=Date.now(),timer=setInterval(()=>{if(n.scrollLeft===0||Date.now()-start>2000){clearInterval(timer);resolve(n.scrollLeft);}},30);}));}
      ok('390px entire page does not overflow horizontally',geometry.docWidth<=391&&geometry.bodyWidth<=391,geometry);ok('390px data diagrams retain actual local horizontal scrolling',geometry.scrollables.length>0&&geometry.actualScroll?.moved,geometry);r.geometry=geometry;
    }
    const minimize=f.getByRole('button',{name:'最小化井见助手',exact:true});if(await minimize.isVisible())await minimize.click();
    const plot=f.locator(c.shot);const target=['c1','co3'].includes(c.scene)?plot.nth(1):plot;await target.scrollIntoViewIfNeeded();const shot='output/playwright/site-upgrade-variants-'+c.scene+'-'+c.phase+'.png';await target.screenshot({path:shot});r.screenshots.push(shot);
    ok('no uncaught JavaScript error',r.errors.length===0,r.errors);ok('no automatic external runtime request',r.externalRequests.length===0,r.externalRequests);
  }catch(e){r.exception=e.message;r.checks.push({name:'complete '+c.scene+'/'+c.phase+' path',passed:false,detail:e.message});try{const shot='output/playwright/site-upgrade-variants-'+c.scene+'-'+c.phase+'-failure.png';await page.screenshot({path:shot,fullPage:false});r.screenshots.push(shot);}catch{}}
  finally{await page.context().setOffline(false);page.removeListener('pageerror',onError);page.removeListener('request',onRequest);}
  r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}

if(phase==='native'){
  const prepare='async page=>{await page.goto('+JSON.stringify(cfg.base+'portal-original/index.html#/cases')+');const b=page.locator('+JSON.stringify('[data-remove-case="'+c.id+'"]')+');if(await b.count())await b.click();return {prepared:true};}';
  const before=spawnSync(process.execPath,['tools/pw.mjs',SESSION,'run-code',prepare],{cwd:ROOT,encoding:'utf8',timeout:95000,windowsHide:true});
  if(before.stdout?.includes('confirm" dialog')){const confirm=spawnSync(process.execPath,['tools/pw.mjs',SESSION,'dialog-accept'],{cwd:ROOT,encoding:'utf8',timeout:95000,windowsHide:true});if(confirm.status)throw Error(confirm.stdout+'\n'+confirm.stderr);}
  else if(before.status)throw Error(before.stdout+'\n'+before.stderr);
}
const code='async page => ('+browserProtocol.toString()+')(page,'+JSON.stringify(cfg)+')';
const run=spawnSync(process.execPath,['tools/pw.mjs',SESSION,'run-code',code],{cwd:ROOT,encoding:'utf8',timeout:95000,windowsHide:true});
const match=run.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);
if(!match)throw run.error||Error(run.stdout+'\n'+run.stderr);
const report=JSON.parse(match[1]);
for(const d of report.downloads){const p=path.join(ROOT,d.path),bytes=fs.readFileSync(p),value=JSON.parse(bytes.toString('utf8'));d.bytes=bytes.length;d.sha256=crypto.createHash('sha256').update(bytes).digest('hex');d.caseId=value.caseId;const valid=value.caseId===c.id;report.checks.push({name:'saved JSON belongs to actual '+c.id,passed:valid,detail:{path:d.path,caseId:value.caseId,bytes:d.bytes}});}
report.passed=report.checks.filter(x=>x.passed).length;report.failed=report.checks.filter(x=>!x.passed).length;
const destination=path.join(ROOT,REPORT,'browser-variants-'+scene+'-'+phase+'.json');if(fs.existsSync(destination)){const old=JSON.parse(fs.readFileSync(destination,'utf8'));if(old.failed)fs.copyFileSync(destination,path.join(ROOT,REPORT,'browser-variants-'+scene+'-'+phase+'-attempt-'+Date.now()+'.json'));}
fs.writeFileSync(destination,JSON.stringify(report,null,2));
console.log(JSON.stringify({scene,phase,passed:report.passed,failed:report.failed,errors:report.errors,exception:report.exception,downloads:report.downloads.map(d=>({path:d.path,bytes:d.bytes,caseId:d.caseId})),screenshots:report.screenshots},null,2));
if(report.failed)process.exitCode=1;
