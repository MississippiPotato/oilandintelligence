import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {CASE_VERSION} from './assistant-bundle.mjs';import {buildM2} from './build-m2-exhibit.mjs';
import {buildFour} from './build-four-exhibits.mjs';import {portalKnowledgeBundle} from './mudlogging-content.mjs';
const root=path.resolve(import.meta.dirname,'..');
if(process.argv.includes('--m2-only'))buildM2();
else {buildFour();fs.writeFileSync(path.join(root,'portal/assets/s17-mudlogging-knowledge.js'),portalKnowledgeBundle());}
const ids=['s17-cuttings-lithology','s17-mudgas-context','s17-fluorescence-review','s17-drilltime-boundaries','s17-evidence-report'];
const cases=ids.map(id=>{const dir=path.join(root,'dist/cases',id),m=JSON.parse(fs.readFileSync(path.join(dir,'case.json'),'utf8'));const files=['case.json','README.txt','demo/index.html','demo/demo.css','demo/demo.js'].map(p=>{const b=fs.readFileSync(path.join(dir,p));return {path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});return {caseId:id,sceneId:m.sceneId,version:m.version,bytes:files.reduce((s,f)=>s+f.bytes,0),files};});
fs.writeFileSync(path.join(root,'handoff/suite-build-lock.json'),JSON.stringify({createdAt:new Date().toISOString(),version:'1.7.1',caseVersions:Object.fromEntries(cases.map(c=>[c.sceneId,c.version])),cases,totalBytes:cases.reduce((s,c)=>s+c.bytes,0),caseCount:5,fileCount:25},null,2));
