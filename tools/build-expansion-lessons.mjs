import fs from 'node:fs';
import {ROOT,REPORT,VERSION,read,write,freeze,record} from './expansion-lesson-contract.mjs';
import {profiles} from './expansion-lesson-profiles.mjs';
import {knowledgeMarkdown} from './expansion-lesson-content.mjs';
import {buildExpansions} from './build-expansion.mjs';
freeze();
for(const [scene,p] of Object.entries(profiles)){
 const file='expansion-src/'+scene+'/case.json',m=JSON.parse(read(file));
 write('expansion-src/'+scene+'/knowledge.md',knowledgeMarkdown(m,p));
 const current=read(file);write(file,current.replace(/("version"\s*:\s*")[^"]+(")/,'$1'+VERSION+'$2').replace(/("updated"\s*:\s*")[^"]+(")/,'$12026-10-29$2'));
}
const {lock,failed}=buildExpansions({requireAll:true,destination:REPORT,lessons:true});
write(REPORT+'/editorial-index.json',{createdAt:new Date().toISOString(),scope:'56case-specific reading profiles, existing professional content/diagrams, two tasks per case. No new raster images or engine/controller edits.',cases:lock.cases.map(c=>({scene:c.sceneId,id:c.caseId,title:JSON.parse(read(c.source+'/case.json')).title,...profiles[c.sceneId],knowledge:record(c.source+'/knowledge.md')}))});
console.log(JSON.stringify({built:lock.actualCount,expected:56,bytes:lock.totalBytes,version:VERSION,newRasterImages:0,browserAcceptanceByBuild:false,invalid:lock.invalid.map(x=>({scene:x.sceneId,errors:x.errors}))},null,2));if(failed)process.exitCode=1;
