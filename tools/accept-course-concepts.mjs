import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {ROOT,REPORT} from './interactive-course-contract.mjs';import {conceptFor} from './concept-content.mjs';
const scenes=(process.argv[2]||'').split(',').filter(Boolean),session=process.argv[3]||'course-concepts',name=process.argv[4]||session;
if(!scenes.length)throw Error('Pass comma-separated expansion scenes, a unique browser session and report name');
process.chdir(ROOT);fs.mkdirSync(REPORT,{recursive:true});
function cli(args){const r=spawnSync(process.execPath,['tools/pw.mjs',session,...args],{cwd:ROOT,encoding:'utf8',timeout:95000,windowsHide:true});if(r.error||r.status)throw r.error??Error(r.stdout+r.stderr);return r.stdout;}
cli(['open','http://127.0.0.1:8755/portal/index.html','--config=checks/playwright-local-file.json']);
const cases=scenes.map(scene=>({scene,id:JSON.parse(fs.readFileSync('expansion-src/'+scene+'/case.json','utf8')).id,step:conceptFor(scene,{required:true}).workflowAfter}));
const report={checkedAt:new Date().toISOString(),kind:'actual_Chrome_built_expansion_background_and_method',session,cases:[],checks:[],errors:[],screenshots:[]};
for(let start=0;start<cases.length;start+=3){const batch=cases.slice(start,start+3);const code=`async page=>{
 const cases=${JSON.stringify(batch)},r={cases:[],checks:[],errors:[]};page.setDefaultTimeout(12000);await page.setViewportSize({width:1440,height:1000});
 const caught=[];const error=e=>caught.push(e.message);page.on('pageerror',error);
 const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
 const inspect=async host=>host.evaluate(el=>{const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return(n>>>0).toString(16);};return{ready:el.dataset.ctReady,state:el.dataset.ctState,graphic:hash(Array.from(el.querySelectorAll('svg,canvas')).map(x=>x.outerHTML).join('')),text:hash(el.innerText),svg:el.querySelectorAll('svg,canvas').length};});
 for(const c of cases){try{const begin=caught.length;await page.goto('http://127.0.0.1:8755/dist/expansion-cases/'+c.id+'/demo/index.html#background');await page.waitForFunction(()=>['ready','done','complete','completed'].includes(globalThis.LessonInspect?.snapshot().current?.status),null,{timeout:15000});
 const version=await page.evaluate(()=>S17Lesson.version);ok(c.scene+' current built version',version==='1.2.0',version);
 for(const part of ['background','workflow']){if(part==='workflow'){await page.locator('nav [data-tab="workflow"]').click();await page.locator('[data-xl-step="'+c.step+'"]').click();}
 const host=page.locator('[data-concept-scene="'+c.scene+'"][data-concept-part="'+part+'"]');await host.scrollIntoViewIfNeeded();const before=await inspect(host);
 ok(c.scene+'/'+part+' mounted complete graphic',before.ready==='true'&&!!before.state&&before.svg>0,{svg:before.svg,state:JSON.parse(before.state)});
 const controls=host.locator('input:not(:disabled),select:not(:disabled)');let change=null;
 for(let i=0;i<await controls.count();i++){const el=controls.nth(i),kind=await el.evaluate(e=>({tag:e.tagName,type:e.type,value:e.value,min:e.min,max:e.max}));
 if(kind.tag==='SELECT'){const opts=await el.locator('option').evaluateAll(a=>a.map(x=>x.value));const value=opts.find(x=>x!==kind.value);if(value!==undefined)await el.selectOption(value);else continue;}
 else if(kind.type==='range'){await el.focus();await page.keyboard.press(kind.value===kind.max?'Home':'End');}
 else if(kind.type==='number'){const v=kind.value===kind.max?kind.min:kind.max;await el.fill(v||String(Number(kind.value)+1));await el.press('Tab');}
 else if(kind.type==='checkbox'){await el.setChecked(!(await el.isChecked()));}else continue;
 const after=await inspect(host);if(after.state!==before.state&&(after.graphic!==before.graphic||after.text!==before.text)){change={kind,beforeGraphic:before.graphic,afterGraphic:after.graphic,afterState:JSON.parse(after.state),graphChanged:after.graphic!==before.graphic,textChanged:after.text!==before.text};break;}
 }
 ok(c.scene+'/'+part+' control changes actual computed state and visible result',!!change,change);
 const reset=host.locator('[data-ct-reset]');if(await reset.count())await reset.click();else await host.getByRole('button',{name:/复位|重置/}).first().click();const restored=await inspect(host);ok(c.scene+'/'+part+' reset restores state',restored.state===before.state,{graphicRestored:restored.graphic===before.graphic});
 }
 ok(c.scene+' one technical context and no duplicate reading route',await page.locator('.course-context').count()===1&&await page.locator('.course-reading-route').count()===0);
 ok(c.scene+' no uncaught built-page error',caught.length===begin,caught.slice(begin));r.cases.push({scene:c.scene,id:c.id,version,completed:true});
 }catch(e){r.checks.push({name:c.scene+' full built-page protocol',passed:false,detail:e.message});r.cases.push({scene:c.scene,id:c.id,completed:false});}}
 page.removeListener('pageerror',error);r.errors=caught;return r;
}`;
 const output=cli(['run-code',code]),match=output.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);if(!match)throw Error(output);const current=JSON.parse(match[1]);for(const k of ['cases','checks','errors'])report[k].push(...current[k]);
 fs.writeFileSync(path.join(REPORT,'browser-'+name+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({batch:batch.map(c=>c.scene),passed:current.checks.filter(x=>x.passed).length,failed:current.checks.filter(x=>!x.passed).length}));
}
report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.filter(c=>!c.passed).length;fs.writeFileSync(path.join(REPORT,'browser-'+name+'.json'),JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
