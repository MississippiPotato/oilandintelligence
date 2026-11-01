import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {ROOT,FOUR,RUNTIME} from '../tools/four-exhibit-contract.mjs';
import {sourceIdentity} from '../tools/four-exhibit-content.mjs';
import {buildLazyPortal} from '../tools/build-lazy-portal.mjs';
const read=p=>fs.readFileSync(path.join(ROOT,p)), sha=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const ids=new Set([...FOUR.map(c=>c.id),'s17-mudgas-context']);
for(const c of FOUR){const preview=JSON.parse(read('case-src/'+c.scene+'/flow-preview.json'));assert.deepEqual(preview.sources,sourceIdentity(c));assert.equal(preview.steps.length,c.scene==='m5'?5:6);assert.equal(preview.snapshot.status,'ready');}
const rows=[];
for(const id of ids){const base='dist/cases/'+id, dir=path.join(ROOT,base), files=fs.readdirSync(dir).filter(x=>x!=='demo');assert.deepEqual(files.sort(),['README.txt','case.json']);assert.deepEqual(fs.readdirSync(path.join(dir,'demo')).sort(),['demo.css','demo.js','index.html']);const manifest=JSON.parse(read(base+'/case.json'));assert.equal(manifest.tabs.workflow.steps.length,manifest.sceneId==='m5'?5:6);new vm.Script(read(base+'/demo/demo.js').toString());const bytes=RUNTIME.reduce((s,p)=>s+read(base+'/'+p).length,0);assert(bytes<6*1024*1024);rows.push({scene:manifest.sceneId,files:5,bytes});}
let checked=0;buildLazyPortal({write:false,expectedCount:65,onOutput:o=>{if(ids.has(o.caseId)||o.path==='portal/assets/s17-case-catalog.js'){assert.equal(read(o.path).toString(),o.content,'Stale portal output: '+o.path);checked++;}}});assert.equal(checked,6);
const lock=JSON.parse(read('handoff/original-lock.json'));for(const f of lock.files)for(const dir of ['portal-original','石油勘探开发智能化案例集'])assert.equal(sha(dir+'/'+f.path),f.sha256,'Original changed: '+dir+'/'+f.path);
const out={scope:'Current five build artifacts, captured default previews, enhanced portal shards and two original copies',cases:rows,portalOutputs:checked,originalLockFiles:lock.files.length,passed:true};
fs.writeFileSync(path.join(ROOT,'handoff/mudlogging-refinement-2026-10-30/artifact-verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
