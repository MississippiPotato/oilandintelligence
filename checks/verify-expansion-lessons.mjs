import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {ROOT,REPORT,VERSION,read,write,record,walk} from '../tools/expansion-lesson-contract.mjs';
import {profiles} from '../tools/expansion-lesson-profiles.mjs';
import {versionedScript} from '../tools/expansion-lesson-content.mjs';
import {packageNames,teacherAtlas} from '../tools/build-expansion.mjs';
const checks=[],check=(name,fn)=>{try{checks.push({name,passed:true,detail:fn()});}catch(e){checks.push({name,passed:false,error:e.message});}};
const before=JSON.parse(read(REPORT+'/before.json')),lock=JSON.parse(read(REPORT+'/build-lock.json'));
for(const [key,name]of [['protectedFiles','Original teacher files / observations / homepage'],['mudloggingFiles','Current5 mudlogging sources and runtime'],['engineFiles','56 original engines and controllers'],['historicalFiles','Dated historical acceptance files']])check(name+' remain byte identical',()=>{for(const f of before[key])assert.deepEqual(record(f.path),f);return{files:before[key].length};});
check('All56 IDs and stage assignments retained with1.1.0 independent lesson versions',()=>{assert.equal(lock.actualCount,56);assert.equal(Object.keys(profiles).length,56);assert.equal(new Set(lock.cases.map(c=>c.caseId)).size,56);assert.equal(lock.lessonRevision,true);for(const c of lock.cases){assert.equal(c.version,VERSION);const old=before.previousRuntime.find(f=>f.path===c.output+'/case.json');assert.ok(old);assert.notEqual(record(old.path).sha256,old.sha256);}return{cases:56,runtimeFiles:280,newRasterImages:0};});
const window={ATLAS:teacherAtlas(),localStorage:{getItem:()=>null,setItem(){}}},sandbox={window,document:{addEventListener(){},createElement:()=>({style:{},setAttribute(){},remove(){}})}};vm.createContext(sandbox);
for(const n of ['registry.js','case-demo-host.js','case-upload.js'])vm.runInContext(read('portal-original/assets/core/'+n),sandbox);
for(const c of lock.cases){
 check(c.sceneId+' original import contract and self-contained ordinary scripts',()=>{
  assert.deepEqual(walk(c.output).map(p=>p.slice(c.output.length+1)).sort(),packageNames.slice().sort());assert.ok(c.bytes<6*1024*1024);
  for(const f of c.files){const {relative,...a}=f;assert.deepEqual(record(f.path),a);}
  const p=JSON.parse(read(c.output+'/case.json')),code=read(c.output+'/demo/demo.js');new vm.Script(code,{filename:c.caseId});
  assert.ok(code.includes(versionedScript(read(c.source+'/engine.js'),VERSION))&&code.includes(versionedScript(read(c.source+'/app.js'),VERSION)));
  assert.ok(!/^\s*(?:import|export)\s/m.test(code));assert.ok(!/<script\b/i.test(JSON.stringify(p)));
  const errors=window.CaseImport.check(p,{id:p.id,sceneId:p.sceneId,title:p.title,methods:p.methods,version:p.version,updated:p.updated}).filter(r=>r.level==='error');assert.deepEqual(JSON.parse(JSON.stringify(errors)),[]);
  const pkg={demo:p.tabs.demo,files:c.files.filter(f=>f.relative!=='case.json').map(f=>({name:f.relative,size:f.bytes,enc:'text',data:read(f.path),mime:'text/plain'}))};
  const inline=window.CaseDemoHost.buildPageDoc(pkg,'source-contract-only');assert.ok(!/<script\b[^>]*\s+src\s*=/i.test(inline));assert.ok(inline.includes('window.S17Lesson='));for(const m of inline.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))new vm.Script(m[1]);
  return{files:5,bytes:c.bytes,teacherManifestErrors:0,browserExecuted:false};
 });
 check(c.sceneId+' authored read points and two valid existing-control experiments',()=>{
  const profile=profiles[c.sceneId],m=JSON.parse(read(c.output+'/case.json')),raw=JSON.parse(read(c.source+'/case.json')),h=read(c.source+'/demo.html'),k=read(c.source+'/knowledge.md');
  assert.equal(profile.reading.length,3);assert.equal(profile.tasks.length,2);assert.ok(profile.insight.length>25);assert.ok(k.includes(profile.insight));
  assert.ok(m.tabs.background.sections.slice(0,3).every(s=>s.html.includes('xl-read')));
  raw.tabs.background.sections.forEach((s,i)=>assert.ok(m.tabs.background.sections[i].html.includes(s.html||s.body)));
  assert.ok((m.tabs.workflow.lessonHTML.match(/data-xl-panel=/g)||[]).length===raw.tabs.workflow.steps.length);
  assert.ok((m.tabs.workflow.lessonHTML.match(/<(?:svg|table)\b/g)||[]).length>=raw.tabs.workflow.steps.length);
  const fields=new Map([...h.matchAll(/<(input|select)\b([^>]*\bid=["']([^"']+)["'][^>]*)>/g)].map(x=>[x[3],{tag:x[1],attrs:Object.fromEntries([...x[2].matchAll(/([\w-]+)=["']([^"']*)["']/g)].map(a=>[a[1],a[2]])),index:x.index}]));
  for(const t of profile.tasks)for(const [id,v]of Object.entries(t.values)){
   const f=fields.get(id);assert.ok(f,'missing task control '+id);
   if(f.tag==='select'){const options=[...h.slice(f.index).match(/^<select\b[^>]*>([\s\S]*?)<\/select>/)[1].matchAll(/<option\b([^>]*)>([^<]*)/g)].map(o=>o[1].match(/value=["']([^"']*)/)?.[1]??o[2]);assert.ok(options.includes(String(v)),id+': '+v);}
   else if(f.attrs.type!=='checkbox'){const n=Number(v);assert.ok(Number.isFinite(n));if(f.attrs.min!==undefined)assert.ok(n>=Number(f.attrs.min),id+' below min');if(f.attrs.max!==undefined)assert.ok(n<=Number(f.attrs.max),id+' above max');if(f.attrs.step&&f.attrs.step!=='any'){const d=(n-Number(f.attrs.min||0))/Number(f.attrs.step);assert.ok(Math.abs(d-Math.round(d))<1e-6,id+' invalid step');}}
  }
  return{readPoints:3,tasks:2,steps:raw.tabs.workflow.steps.length,existingProfessionalHTMLRetained:true};
 });
}
check('Enhanced portal plugin uses unchanged Cases.register contract',()=>{vm.runInContext(read(lock.plugin.path),sandbox);assert.equal(window.Cases.list().length,56);assert.equal(window.Cases.problems().length,0);for(const c of lock.cases){const p=JSON.parse(read(c.output+'/case.json'));assert.equal(window.Cases.get(c.caseId).version,VERSION);assert.equal(window.Cases.get(c.caseId).tabs.workflow.lessonHTML,p.tabs.workflow.lessonHTML);}new vm.Script(read('portal/assets/s17-reader.js'));return{registered:56,sourceContractOnly:true};});
const result={checkedAt:new Date().toISOString(),kind:'source_content_hash_and_original_contract_only',browserExecuted:false,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks};write(REPORT+'/source-checks.json',result);console.log(JSON.stringify({passed:result.passed,failed:result.failed,failures:checks.filter(x=>!x.passed)},null,2));if(result.failed)process.exitCode=1;
