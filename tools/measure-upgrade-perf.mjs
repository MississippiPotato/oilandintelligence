import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {spawn} from 'node:child_process';
const ROOT=path.resolve(import.meta.dirname,'..');
const REPORT=path.join(ROOT,'handoff/site-upgrade-2026-10-30');
const CACHE=path.join(ROOT,'output/performance');
const phase=process.argv[2]||'before';
if(!['before','after','after-final'].includes(phase))throw Error('Usage: node tools/measure-upgrade-perf.mjs before|after|after-final [--freeze-only]');
const isAfter=phase!=='before';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function freeze(which){
 const dir=path.join(CACHE,which),manifestPath=path.join(dir,'manifest.json');
 if(fs.existsSync(manifestPath))return{...JSON.parse(fs.readFileSync(manifestPath,'utf8')),reused:true};
 fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(REPORT,{recursive:true});
 const files=[path.join(ROOT,'index.html'),path.join(ROOT,'portal/index.html'),...walk(path.join(ROOT,'portal')),...walk(path.join(ROOT,'shared'))];
 // Root and portal entry documents are copied before any dependency traversal.
 const seen=new Set(),records=[];
 for(const absolute of files){const rel=path.relative(ROOT,absolute).split(path.sep).join('/');if(seen.has(rel))continue;seen.add(rel);const before=fs.statSync(absolute),bytes=fs.readFileSync(absolute),after=fs.statSync(absolute);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw Error('Source changed while freezing: '+rel);const target=path.join(dir,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);records.push({path:rel,bytes:bytes.length,sha256:sha(bytes)});}
 const html=fs.readFileSync(path.join(dir,'portal/index.html'),'utf8'),scriptURLs=[...html.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]),bootstrapScripts=scriptURLs.filter(u=>!/^https?:|^data:/i.test(u)).map(u=>{const pathname=path.posix.normalize(path.posix.join('portal',u.split('?')[0]));return records.find(r=>r.path===pathname)||{path:pathname,missing:true};});
 const manifest={phase:which,frozenAt:new Date().toISOString(),root:dir,entry:'portal/index.html',entrySHA256:sha(Buffer.from(html)),files:records,bootstrapScripts,bootstrapRawJavaScriptBytes:bootstrapScripts.reduce((s,r)=>s+(r.bytes||0),0),totalFiles:records.length,totalBytes:records.reduce((s,r)=>s+r.bytes,0)};
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(REPORT,'performance-'+which+'-freeze.json'),JSON.stringify(manifest,null,2));
 return manifest;
}
const frozen=freeze(phase);
console.log(JSON.stringify({phase,frozenAt:frozen.frozenAt,reused:!!frozen.reused,entrySHA256:frozen.entrySHA256,files:frozen.totalFiles,bytes:frozen.totalBytes,bootstrapRawJavaScriptBytes:frozen.bootstrapRawJavaScriptBytes,cache:frozen.root}));
if(process.argv.includes('--freeze-only'))process.exit(0);
// Same single Chrome session and same static transport are used for both phases.
// Identity responses match tools/serve.mjs. No production CDN result is implied.
const SESSION='upgrade-perf',PORT=8766,ORIGIN='http://127.0.0.1:'+PORT;
const CONDITIONS={runs:5,viewport:{width:1440,height:1000},cache:'CDP disabled + clearBrowserCache and origin storage before every run',downloadBitsPerSecond:4000000,downloadBytesPerSecond:500000,uploadBytesPerSecond:500000,latencyMs:100,cpuSlowdown:4,contentEncoding:'identity',cacheControl:'no-store',sampleAfterLoadMs:2000,loadTimeoutMs:85000,browserConfig:'checks/playwright-local-file.json'};
const SELECTORS={
 before:{title:'#ov-title',directory:'[data-ov-directory]',directoryReady:'#s17-directory[open] #s17-catalog[data-visible-count]',search:null,searchResults:null,searchQuery:'钻速'},
 after:{title:'#ov-title',directory:'[data-ov-directory]',directoryReady:'#s17-directory[open]',searchOpen:'#s17-search-open',search:'#s17-search-input',searchResults:'#s17-search-results',searchQuery:'钻速'}
};
const selectors={...SELECTORS[isAfter?'after':'before'],...(process.env.S17_PERF_SELECTORS?JSON.parse(process.env.S17_PERF_SELECTORS):{})};
const reportFile=path.join(REPORT,'performance-'+phase+'.json'),mdFile=path.join(REPORT,'performance-'+phase+'.md');
const report={schemaVersion:1,phase,startedAt:new Date().toISOString(),entry:ORIGIN+'/portal/index.html',snapshot:{frozenAt:frozen.frozenAt,entrySHA256:frozen.entrySHA256,files:frozen.totalFiles,totalBytes:frozen.totalBytes,bootstrapRawJavaScriptBytes:frozen.bootstrapRawJavaScriptBytes,indexBytes:frozen.files.find(f=>f.path==='portal/index.html').bytes},conditions:CONDITIONS,selectors,runs:[],errors:[],server:{port:PORT,origin:ORIGIN,requests:[]},limitations:['LCP is the final candidate after the load event plus a fixed 2000 ms observation window, before any catalog or search input.','Usability timestamps are the first animation frame containing the real visible control with application prerequisites; functionality is independently exercised after the first-screen metrics are captured.','Local identity/no-store HTTP transport is matched across phases; these are not a CDN or production-host benchmark.','CDP wire encodedDataLength includes protocol headers; Resource Timing encodedBodySize and decodedBodySize are also recorded separately.']};
const executedSource=fs.readFileSync(import.meta.filename),executionHash=sha(executedSource),executionPath=path.join(frozen.root,'measure-upgrade-perf.'+executionHash.slice(0,12)+'.executed.mjs');
fs.writeFileSync(executionPath,executedSource);report.executionScript={path:'tools/measure-upgrade-perf.mjs',sha256:executionHash,archivedCopy:path.relative(ROOT,executionPath)};
report.completionMeaning='complete means five measurements captured real LCP, navigation and functional title/directory timings. success separately requires no observed network failure or page error.';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const resources=new Map(frozen.files.map(f=>[f.path,{...f,body:fs.readFileSync(path.join(frozen.root,f.path))}]));
let runTag=null,server;
function staticServer(){
 return http.createServer((req,res)=>{
  let rel;try{const u=new URL(req.url,ORIGIN);rel=decodeURIComponent(u.pathname).replace(/^\/+/,'');if(!rel||rel.endsWith('/'))rel+='index.html';rel=path.posix.normalize(rel);if(rel==='..'||rel.startsWith('../'))throw Error('Traversal');}catch{res.writeHead(400);res.end();return;}
  const item=resources.get(rel),status=item?200:404;report.server.requests.push({run:runTag,path:rel,status,at:new Date().toISOString()});
  res.writeHead(status,{'Content-Type':MIME[path.extname(rel)]||'application/octet-stream','Content-Length':item?item.body.length:9,'Cache-Control':'no-store','Content-Encoding':'identity','X-Performance-Snapshot':phase+'-'+frozen.entrySHA256.slice(0,12)});res.end(item?item.body:'Not found');
 });
}
function cli(args,timeout=95000){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['tools/pw.mjs',SESSION,...args],{cwd:ROOT,windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  const timer=setTimeout(()=>{child.kill();reject(Error('Chrome CLI timeout: '+args[0]));},timeout);
  child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);if(code||/### Error/.test(stdout))reject(Error(stdout+stderr));else resolve(stdout);});
 });
}
function result(output){const m=output.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);if(!m)throw Error('Missing CLI JSON result: '+output.slice(0,1500));return JSON.parse(m[1]);}
const MEASURE=async function(page){
 const c=CONFIG,started=Date.now(),requests=new Map(),pageErrors=[],consoleErrors=[],failures=[];let client,scriptId,metrics=null;
 const onPageError=e=>pageErrors.push(e.message),onConsole=m=>{if(m.type()==='error')consoleErrors.push(m.text());};
 page.on('pageerror',onPageError);page.on('console',onConsole);page.setDefaultTimeout(15000);
 function init(o){
  const p=window.__upgradePerf={ready:{title:null,directory:null,search:null},readyDetails:{},lcp:null,lcpEntries:[],longTasks:[],supported:PerformanceObserver.supportedEntryTypes,sampleStarted:performance.now()};
  const observers=[];
  try{const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){const item={startTime:e.startTime,renderTime:e.renderTime,loadTime:e.loadTime,size:e.size,url:e.url,element:e.element?{tag:e.element.tagName,id:e.element.id,className:String(e.element.className),text:e.element.textContent?.slice(0,120)}:null};p.lcp=item;p.lcpEntries.push(item);}});po.observe({type:'largest-contentful-paint',buffered:true});observers.push(po);}catch(e){p.lcpError=e.message;}
  try{const po=new PerformanceObserver(list=>{for(const e of list.getEntries())p.longTasks.push({startTime:e.startTime,duration:e.duration,name:e.name,attribution:e.attribution?.map(a=>({name:a.name,containerType:a.containerType,containerName:a.containerName,containerSrc:a.containerSrc}))});});po.observe({type:'longtask',buffered:true});observers.push(po);}catch(e){p.longTaskError=e.message;}
  const visible=el=>!!el&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none';
  const title=()=>{const el=document.querySelector(o.selectors.title),value=el?.textContent?.replace(/\s+/g,' ').trim()||'';return visible(el)&&value.length>4&&!/正在加载|加载中|loading/i.test(value)?{text:value}:null;};
  function probe(){
   if(p.done)return;
   const t=title();if(p.ready.title===null&&t){p.ready.title=performance.now();p.readyDetails.title=t;}
   const homeReady=o.phase!=='before'?window.S17HomeReady?.()===true:!!window.S17Catalog?.init;
   const d=document.querySelector(o.selectors.directory);if(p.ready.directory===null&&t&&visible(d)&&!d.disabled&&homeReady){p.ready.directory=performance.now();p.readyDetails.directory={text:d.textContent.trim(),prerequisite:o.phase!=='before'?'S17HomeReady() is true; final home title and directory control are visible':'S17Catalog.init is present; final home title is visible'};}
   const s=o.selectors.search?document.querySelector(o.selectors.searchOpen||o.selectors.search):null;if(p.ready.search===null&&visible(s)&&!s.disabled&&homeReady&&window.S17Search?.snapshot){p.ready.search=performance.now();p.readyDetails.search={tag:s.tagName,type:s.type,placeholder:s.placeholder,prerequisite:'S17HomeReady() is true; visible search button and S17Search.snapshot are present'};}
   if((p.ready.title===null||p.ready.directory===null||(o.selectors.search&&p.ready.search===null))&&performance.now()<90000)requestAnimationFrame(probe);
  }
  requestAnimationFrame(probe);p.stop=()=>{p.done=true;observers.forEach(x=>x.disconnect());};
 }
 function rows(){return Array.from(requests.values()).filter(x=>/^https?:/.test(x.url));}
 try{
  await page.goto('about:blank');await page.setViewportSize(c.conditions.viewport);client=await page.context().newCDPSession(page);
  await client.send('Page.enable');await client.send('Network.enable');await client.send('Network.setCacheDisabled',{cacheDisabled:true});await client.send('Network.clearBrowserCache');
  await client.send('Storage.clearDataForOrigin',{origin:c.origin,storageTypes:'all'});
  await client.send('Network.emulateNetworkConditions',{offline:false,downloadThroughput:c.conditions.downloadBytesPerSecond,uploadThroughput:c.conditions.uploadBytesPerSecond,latency:c.conditions.latencyMs,connectionType:'cellular4g'});
  await client.send('Emulation.setCPUThrottlingRate',{rate:c.conditions.cpuSlowdown});
  const version=await client.send('Browser.getVersion');
  client.on('Network.requestWillBeSent',e=>{requests.set(e.requestId,{requestId:e.requestId,url:e.request.url,method:e.request.method,type:e.type,initiator:e.initiator?.type,requestTime:e.timestamp,encodedWireBytes:0,decodedDataBytes:0,completed:false});});
  client.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{status:e.response.status,mimeType:e.response.mimeType,fromDiskCache:!!e.response.fromDiskCache,fromServiceWorker:!!e.response.fromServiceWorker,responseTime:e.timestamp,responseHeaders:e.response.headers});});
  client.on('Network.dataReceived',e=>{const r=requests.get(e.requestId);if(r)r.decodedDataBytes+=e.dataLength;});
  client.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{encodedWireBytes:e.encodedDataLength,completed:true,finishedTime:e.timestamp});});
  client.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{failed:true,error:e.errorText,canceled:!!e.canceled,blockedReason:e.blockedReason});});
  const installed=await client.send('Page.addScriptToEvaluateOnNewDocument',{source:'('+init.toString()+')('+JSON.stringify(c)+');'});scriptId=installed.identifier;
  let loadFailure=null;try{await page.goto(c.url,{waitUntil:'load',timeout:c.conditions.loadTimeoutMs});}catch(e){loadFailure=e.message;}
  if(!loadFailure)await page.waitForFunction(()=>window.__upgradePerf?.ready.title!==null&&window.__upgradePerf?.ready.directory!==null,null,{timeout:10000});
  if(!loadFailure)await page.waitForTimeout(c.conditions.sampleAfterLoadMs);
  const perf=await page.evaluate(()=>{const p=window.__upgradePerf;if(!p)return null;const nav=performance.getEntriesByType('navigation')[0]?.toJSON(),resources=performance.getEntriesByType('resource').map(e=>{const r=e.toJSON();if(r.name.startsWith('data:'))r.name='data:[inline URL omitted; '+r.name.length+' characters]';return r;});p.stop();return{ready:p.ready,readyDetails:p.readyDetails,lcp:p.lcp,lcpEntries:p.lcpEntries,longTasks:p.longTasks,supported:p.supported,navigation:nav,resources,sampledThroughMs:performance.now(),environment:{innerWidth,innerHeight,devicePixelRatio,language:navigator.language,hardwareConcurrency:navigator.hardwareConcurrency,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,title:document.title,bodyExcerpt:document.body.innerText.slice(0,200)}};});
  const network=rows().map(r=>({...r})),bad=network.filter(r=>r.failed||r.status>=400);failures.push(...bad.map(r=>({url:r.url,status:r.status,error:r.error||'HTTP error'})));if(loadFailure)failures.push({kind:'load',message:loadFailure});
  const allTiming=perf?[perf.navigation,...perf.resources].filter(Boolean):[],js=allTiming.filter(e=>/\.m?js(?:[?#]|$)/i.test(e.name));
  const heavy={
   body:network.filter(r=>/s17-(?:expansion-cases|mudlogging-knowledge)\.js|\/assets\/cases\/|\/(?:case|lesson|body)-content[^/]*\.(?:json|js)/i.test(r.url)).map(r=>r.url),
   threeD:network.filter(r=>/(?:three(?:\.min)?\.js|babylon|model-viewer|\.glb(?:[?#]|$)|\.gltf(?:[?#]|$)|\.fbx(?:[?#]|$))/i.test(r.url)).map(r=>r.url),
   live2d:network.filter(r=>/(?:live2d|pixi|cubism)/i.test(r.url)&&!/\/s17-live2d-loader\.js(?:[?#]|$)/i.test(r.url)).map(r=>r.url)
  },long=perf?.longTasks||[];
  metrics={iteration:c.iteration,phase:c.phase,startedAt:c.startedAt,success:false,browser:version,conditions:c.conditions,entrySHA256:c.entrySHA256,loadFailure,lcpMs:perf?.lcp?.startTime??null,domContentLoadedMs:perf?.navigation?.domContentLoadedEventEnd||null,loadEventMs:perf?.navigation?.loadEventEnd||null,titleUsableMs:perf?.ready?.title??null,directoryUsableMs:perf?.ready?.directory??null,headerSearchUsableMs:perf?.ready?.search??null,headerSearch:null,actualTitle:perf?.readyDetails?.title?.text??null,readyDetails:perf?.readyDetails,sampledThroughMs:perf?.sampledThroughMs,environment:perf?.environment,lcp:perf?.lcp,lcpEntries:perf?.lcpEntries,longTasks:{count:long.length,totalDurationMs:long.reduce((s,e)=>s+e.duration,0),maxDurationMs:long.length?Math.max(...long.map(e=>e.duration)):0,entries:long},network:{requestCount:network.length,encodedWireBytes:network.reduce((s,r)=>s+r.encodedWireBytes,0),decodedDataBytes:network.reduce((s,r)=>s+r.decodedDataBytes,0),encodedBodyBytes:allTiming.reduce((s,e)=>s+(e.encodedBodySize||0),0),decodedBodyBytes:allTiming.reduce((s,e)=>s+(e.decodedBodySize||0),0),transferSize:allTiming.reduce((s,e)=>s+(e.transferSize||0),0),encodedJSBodyBytes:js.reduce((s,e)=>s+(e.encodedBodySize||0),0),decodedJSBodyBytes:js.reduce((s,e)=>s+(e.decodedBodySize||0),0),cachedResponses:network.filter(r=>r.fromDiskCache||r.fromServiceWorker).length,pending:network.filter(r=>!r.completed&&!r.failed).map(r=>r.url),requests:network,resourceTiming:allTiming},heavyRequests:heavy,firstScreenHeavyRequestCount:new Set(Object.values(heavy).flat()).size,lightweightEntryRequests:network.filter(r=>/s17-(?:live2d-loader|case-loader|mudlogging-stage)\.js(?:[?#]|$)/i.test(r.url)).map(r=>({url:r.url,decodedDataBytes:r.decodedDataBytes})),pageErrors,consoleErrors,failures};
  // First-screen observers and byte accounting stop before these user actions.
  await page.locator(c.selectors.directory).first().click();
  await page.waitForFunction(selector=>{const el=document.querySelector(selector);return!!el&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;},c.selectors.directoryReady,{timeout:10000});
  metrics.directoryFunctionality={passed:true,checkedAfterFirstScreen:true,selector:c.selectors.directoryReady};
  if(c.selectors.search){
   if(c.selectors.searchOpen){
    await page.evaluate(({buttonSelector,inputSelector})=>{
     window.__upgradeSearchOpen={start:null,end:null,elapsedMs:null};
     document.querySelector(buttonSelector).addEventListener('click',()=>{const p=window.__upgradeSearchOpen;p.start=performance.now();const probe=()=>{const input=document.querySelector(inputSelector);if(input&&input.getBoundingClientRect().width>0&&input.getBoundingClientRect().height>0&&!input.disabled&&window.S17Search?.snapshot?.().open){p.end=performance.now();p.elapsedMs=p.end-p.start;return;}if(performance.now()-p.start<10000)requestAnimationFrame(probe);};requestAnimationFrame(probe);},{once:true,capture:true});
    },{buttonSelector:c.selectors.searchOpen,inputSelector:c.selectors.search});
    await page.locator(c.selectors.searchOpen).click();await page.waitForFunction(()=>window.__upgradeSearchOpen?.elapsedMs!==null,null,{timeout:12000});
    metrics.headerSearchOpen=await page.evaluate(()=>({...window.__upgradeSearchOpen,applicationSnapshot:window.S17Search?.snapshot?.()??null}));
   }
   const input=page.locator(c.selectors.search).first(),before=await page.locator(c.selectors.searchResults).first().textContent();
   await page.evaluate(({inputSelector,resultSelector,before,query})=>{
    const input=document.querySelector(inputSelector),root=document.querySelector(resultSelector);window.__upgradeSearch={start:null,end:null,elapsedMs:null,resultText:null,query};
    input.addEventListener('input',()=>{const p=window.__upgradeSearch;p.start=performance.now();const probe=()=>{const text=root.textContent.trim(),hidden=getComputedStyle(root).display==='none'||root.getBoundingClientRect().height===0;if(!hidden&&text!==before.trim()&&!/正在加载|加载中/.test(text)&&text.includes(query)){p.end=performance.now();p.elapsedMs=p.end-p.start;p.resultText=text.slice(0,1000);return;}if(performance.now()-p.start<10000)requestAnimationFrame(probe);};requestAnimationFrame(probe);},{once:true,capture:true});
   },{inputSelector:c.selectors.search,resultSelector:c.selectors.searchResults,before,query:c.selectors.searchQuery});
   await input.fill(c.selectors.searchQuery);await page.waitForFunction(()=>window.__upgradeSearch?.elapsedMs!==null,null,{timeout:12000});
   metrics.headerSearch=await page.evaluate(()=>({...window.__upgradeSearch,applicationSnapshot:window.S17Search?.snapshot?.()??null}));metrics.headerSearch.functionalityPassed=true;
  }else metrics.headerSearch={available:false,elapsedMs:null,reason:'The old homepage has no upper-right first-screen search. Search inside its closed directory is not counted as the same control.'};
  metrics.measurementComplete=metrics.lcpMs!==null&&metrics.domContentLoadedMs!==null&&metrics.titleUsableMs!==null&&metrics.directoryUsableMs!==null&&metrics.directoryFunctionality.passed;
  metrics.success=metrics.measurementComplete&&failures.length===0&&pageErrors.length===0;
 }catch(e){
  if(!metrics)metrics={iteration:c.iteration,phase:c.phase,startedAt:c.startedAt,entrySHA256:c.entrySHA256,success:false,failures:[],pageErrors,consoleErrors,network:{requests:rows()}};
  metrics.failures.push({kind:'measurement_or_functionality',message:e.message});metrics.success=false;
 }finally{
  if(client){if(scriptId)await client.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:scriptId}).catch(()=>{});await client.send('Emulation.setCPUThrottlingRate',{rate:1}).catch(()=>{});await client.send('Network.emulateNetworkConditions',{offline:false,downloadThroughput:-1,uploadThroughput:-1,latency:0}).catch(()=>{});await client.detach().catch(()=>{});}
  page.removeListener('pageerror',onPageError);page.removeListener('console',onConsole);
 }
 metrics.wallTimeMs=Date.now()-started;return metrics;
};
function median(a){const b=a.filter(Number.isFinite).slice().sort((a,b)=>a-b);return b.length?b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2:null;}
function summary(){
 const names=['lcpMs','domContentLoadedMs','titleUsableMs','directoryUsableMs','headerSearchUsableMs'];
 const out={completedRuns:report.runs.length,measurementCompleteRuns:report.runs.filter(r=>r.measurementComplete).length,successfulRuns:report.runs.filter(r=>r.success).length,entryHashes:[...new Set(report.runs.map(r=>r.entrySHA256))],metrics:Object.fromEntries(names.map(k=>{const a=report.runs.map(r=>r[k]).filter(Number.isFinite);return[k,{n:a.length,median:median(a),min:a.length?Math.min(...a):null,max:a.length?Math.max(...a):null,values:report.runs.map(r=>r[k]??null)}];}))};
 const search=report.runs.map(r=>r.headerSearch?.elapsedMs).filter(Number.isFinite);out.headerSearchLatencyMs={n:search.length,median:median(search),max:search.length?Math.max(...search):null,values:report.runs.map(r=>r.headerSearch?.elapsedMs??null)};
 const appRender=report.runs.map(r=>r.headerSearch?.applicationSnapshot?.renderMs).filter(Number.isFinite);out.headerSearchDOMRenderMs={n:appRender.length,median:median(appRender),max:appRender.length?Math.max(...appRender):null,values:report.runs.map(r=>r.headerSearch?.applicationSnapshot?.renderMs??null)};
 const opened=report.runs.map(r=>r.headerSearchOpen?.elapsedMs).filter(Number.isFinite);out.headerSearchOpenLatencyMs={n:opened.length,median:median(opened),max:opened.length?Math.max(...opened):null,values:report.runs.map(r=>r.headerSearchOpen?.elapsedMs??null)};
 out.network=Object.fromEntries(['requestCount','encodedWireBytes','encodedBodyBytes','decodedBodyBytes','decodedJSBodyBytes','cachedResponses'].map(k=>[k,{median:median(report.runs.map(r=>r.network?.[k])),values:report.runs.map(r=>r.network?.[k]??null)}]));
 out.failures=report.runs.flatMap(r=>(r.failures||[]).map(f=>({iteration:r.iteration,...f})));out.longTasks=report.runs.map(r=>({iteration:r.iteration,count:r.longTasks?.count??null,totalDurationMs:r.longTasks?.totalDurationMs??null,maxDurationMs:r.longTasks?.maxDurationMs??null}));
 if(isAfter)out.targets={fiveMeasurementsComplete:out.measurementCompleteRuns===5,lcpMedianAtMost2500:out.metrics.lcpMs.median!==null&&out.metrics.lcpMs.median<=2500,lcpMaxAtMost3500:out.metrics.lcpMs.max!==null&&out.metrics.lcpMs.max<=3500,zeroFirstScreenBody3DLive2DRequests:report.runs.length===5&&report.runs.every(r=>r.firstScreenHeavyRequestCount===0),bootstrapJSAtMost650KiB:frozen.bootstrapRawJavaScriptBytes<=650*1024,observedJSAtMost650KiB:report.runs.length===5&&report.runs.every(r=>r.network?.decodedJSBodyBytes<=650*1024),indexAtMost256KiB:report.snapshot.indexBytes<=256*1024,searchAtMost50ms:search.length===5&&search.every(v=>v<=50)};
 return out;
}
function writeReport(){
 report.summary=summary();report.complete=report.runs.length===5&&report.runs.every(r=>r.measurementComplete)&&report.errors.length===0;
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
 const s=report.summary,rows=report.runs.map(r=>'| '+r.iteration+' | '+(r.lcpMs?.toFixed(1)??'null')+' | '+(r.domContentLoadedMs?.toFixed(1)??'null')+' | '+(r.titleUsableMs?.toFixed(1)??'null')+' | '+(r.directoryUsableMs?.toFixed(1)??'null')+' | '+(r.headerSearch?.elapsedMs?.toFixed(1)??'null')+' | '+(r.network?.requestCount??'null')+' | '+(r.network?.encodedBodyBytes??'null')+' / '+(r.network?.decodedBodyBytes??'null')+' | '+(r.success?'complete':'FAILED')+' |').join('\n');
 const md='# '+phase+' homepage performance\n\nSnapshot '+report.snapshot.entrySHA256+' frozen '+report.snapshot.frozenAt+'. Five runs use exactly this cached content.\n\nReal Chrome via tools/pw.mjs; '+CONDITIONS.viewport.width+'×'+CONDITIONS.viewport.height+'; cold cache; 4,000,000 bit/s download (500,000 B/s), 100 ms CDP network latency, CPU 4×; local identity/no-store HTTP on 8766. The existing 8755 server is not used or modified.\n\n| Run | LCP ms | DCL ms | Real title ready ms | Directory ready ms | Upper-right search ms | HTTP requests | Encoded / decoded body bytes | Status |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n'+rows+'\n\nLCP median '+s.metrics.lcpMs.median+' ms; max '+s.metrics.lcpMs.max+' ms. Raw referenced bootstrap JavaScript '+frozen.bootstrapRawJavaScriptBytes+' bytes; entry HTML '+report.snapshot.indexBytes+' bytes.\n\nOld upper-right search is null when absent. Ready timestamps require actual visible content; “正在加载” never satisfies the title. Directory functionality is exercised separately after the LCP observation window. JSON preserves every request, encoded/decoded bytes, failures, LCP candidates and long tasks. A failed run is retained and is not replaced by a sixth run.\n\n'+(s.targets?'After targets: '+JSON.stringify(s.targets)+'\n\n':'')+'Failures: '+JSON.stringify(s.failures)+'\n\nLifecycle: '+JSON.stringify(report.lifecycle||{})+'\n';
 fs.writeFileSync(mdFile,md);
 if(isAfter&&fs.existsSync(path.join(REPORT,'performance-before.json'))){
  const comparisonBase=phase==='after-final'?'performance-comparison-final':'performance-comparison';
  const before=JSON.parse(fs.readFileSync(path.join(REPORT,'performance-before.json'),'utf8')),comparison={checkedAt:new Date().toISOString(),phase,conditionsMatched:JSON.stringify(before.conditions)===JSON.stringify(report.conditions),before:{complete:before.complete,snapshot:before.snapshot,summary:before.summary},after:{complete:report.complete,snapshot:report.snapshot,summary:report.summary},caveats:report.limitations};fs.writeFileSync(path.join(REPORT,comparisonBase+'.json'),JSON.stringify(comparison,null,2));
  const value=v=>Number.isFinite(v)?v.toFixed(1):'null',labels={lcpMs:'LCP',domContentLoadedMs:'DOMContentLoaded',titleUsableMs:'真实主标题可用',directoryUsableMs:'目录入口可用',headerSearchUsableMs:'右上检索入口可用'};
  const timingRows=Object.entries(labels).map(([k,label])=>'| '+label+' | '+value(before.summary.metrics[k].median)+' | '+value(report.summary.metrics[k].median)+' | '+value(before.summary.metrics[k].max)+' | '+value(report.summary.metrics[k].max)+' |').join('\n');
  const targets=Object.entries(report.summary.targets||{}).map(([k,v])=>'- '+k+': **'+(v?'PASS':'FAIL / pending')+'**').join('\n');
  const text='# 首页升级：同条件五次性能对照\n\n旧版完成 '+before.summary.measurementCompleteRuns+'/5 次有效采集；新版完成 '+report.summary.measurementCompleteRuns+'/5。两阶段条件完全相同：'+comparison.conditionsMatched+'。计时单位均为ms；均从各自导航起点计时，标题必须是实际#ov-title内容，加载提示不能满足条件。\n\n条件：真实Chrome，1440×1000，CDP每次禁用并清空缓存、清空来源存储；4,000,000 bit/s下载（500,000 B/s），100ms网络latency，CPU 4×。8766只读快照服务使用identity/no-store传输，与项目8755静态服务一致；不是CDN压缩或生产托管测试。\n\n| 指标 | 旧版中位数 | 新版中位数 | 旧版最大 | 新版最大 |\n|---|---:|---:|---:|---:|\n'+timingRows+'\n\n| 资源 | 旧版 | 新版 |\n|---|---:|---:|\n| 首页HTML原始字节 | '+before.snapshot.indexBytes+' | '+report.snapshot.indexBytes+' |\n| 引用bootstrap JS原始字节 | '+before.snapshot.bootstrapRawJavaScriptBytes+' | '+report.snapshot.bootstrapRawJavaScriptBytes+' |\n| 首屏HTTP请求数中位数 | '+before.summary.network.requestCount.median+' | '+report.summary.network.requestCount.median+' |\n| encodedBodySize中位数 | '+before.summary.network.encodedBodyBytes.median+' | '+report.summary.network.encodedBodyBytes.median+' |\n| decodedBodySize中位数 | '+before.summary.network.decodedBodyBytes.median+' | '+report.summary.network.decodedBodyBytes.median+' |\n| 首屏body/3D/Live2D请求（逐次） | '+before.runs.map(r=>r.firstScreenHeavyRequestCount).join(', ')+' | '+report.runs.map(r=>r.firstScreenHeavyRequestCount).join(', ')+' |\n\n旧版首屏没有右上搜索，记录为null。新版真实input到首个包含已改变匹配结果的rAF：中位 '+value(report.summary.headerSearchLatencyMs.median)+'，最大 '+value(report.summary.headerSearchLatencyMs.max)+'；应用自身记录的input→DOM写完中位 '+value(report.summary.headerSearchDOMRenderMs.median)+'，最大 '+value(report.summary.headerSearchDOMRenderMs.max)+'。首次打开搜索（包含建索引）中位 '+value(report.summary.headerSearchOpenLatencyMs.median)+'，最大 '+value(report.summary.headerSearchOpenLatencyMs.max)+'，单独列出，不混入稳定输入耗时。\n\n## 固定验收目标\n\n'+targets+'\n\n目标针对五次完整测量；网络请求失败及未捕获页面错误另列，不能因为指标完成就称全站没有错误。\n\n旧版请求/协议失败：'+JSON.stringify(before.summary.failures)+'。\n\n新版请求/协议失败：'+JSON.stringify(report.summary.failures)+'。\n\n首屏采样截止于load后固定2000ms，随后才点击目录与搜索；所有逐请求encoded/decoded字节、LCP候选、长任务和原始失败见performance-before.json与performance-after.json。每阶段固定快照SHA分别为 '+before.snapshot.entrySHA256+' / '+report.snapshot.entrySHA256+'。无效测量器首次尝试另存performance-before-attempt-instrumentation.json，未混入正式5次。\n';
  fs.writeFileSync(path.join(REPORT,comparisonBase+'.md'),text.replaceAll('performance-after.json','performance-'+phase+'.json'));
 }
}
try{
 server=staticServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve);});
 await cli(['open','about:blank','--config=checks/playwright-local-file.json']);
 report.lifecycle={session:SESSION,serverStarted:true,browserOpened:true};
 for(let i=1;i<=CONDITIONS.runs;i++){
  runTag=i;const config={phase,iteration:i,url:report.entry,origin:ORIGIN,entrySHA256:frozen.entrySHA256,conditions:CONDITIONS,selectors,startedAt:new Date().toISOString()};
  try{const code=MEASURE.toString().replace('CONFIG',JSON.stringify(config)),data=result(await cli(['run-code',code]));report.runs.push(data);}catch(e){report.runs.push({iteration:i,phase,entrySHA256:frozen.entrySHA256,success:false,failures:[{kind:'CLI',message:e.message}]});}
  writeReport();const latest=report.runs.at(-1);console.log(JSON.stringify({phase,iteration:i,success:latest.success,lcpMs:latest.lcpMs,dclMs:latest.domContentLoadedMs,titleMs:latest.titleUsableMs,directoryMs:latest.directoryUsableMs,searchMs:latest.headerSearch?.elapsedMs,requests:latest.network?.requestCount,failures:latest.failures}));
 }
}catch(e){report.errors.push(e.message);console.error(e.message);}
finally{
 let browserClosed=false;try{await cli(['close']);browserClosed=true;}catch(e){report.errors.push('Browser close: '+e.message);}
 if(server?.listening)await new Promise(resolve=>server.close(resolve));
 report.finishedAt=new Date().toISOString();report.lifecycle={...report.lifecycle,browserClosed,serverClosed:!server?.listening};writeReport();
 console.log(JSON.stringify({phase,complete:report.complete,summary:report.summary,lifecycle:report.lifecycle,report:path.relative(ROOT,reportFile)}));
}
if(!report.complete)process.exitCode=1;

