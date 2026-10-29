import fs from 'node:fs';import path from 'node:path';
import {ROOT,REPORT,FIVE_VERSION,EXPANSION_VERSION,freeze,record,walk} from './interactive-course-contract.mjs';
import {profiles} from './expansion-lesson-profiles.mjs';import {conceptFor} from './concept-content.mjs';
process.chdir(ROOT);freeze();const draft=process.argv.includes('--draft');if(draft&&!process.argv.includes('--allow-stale-preview'))process.argv.push('--allow-stale-preview');
const scenes=Object.keys(profiles);for(const scene of scenes){const file='expansion-src/'+scene+'/case.json',s=fs.readFileSync(file,'utf8');fs.writeFileSync(file,s.replace(/("version"\s*:\s*")[^"]+("(?!:))/,(_,a,b)=>a+EXPANSION_VERSION+b).replace(/("updated"\s*:\s*")[^"]+("(?!:))/,(_,a,b)=>a+'2026-10-30'+b));}
const concepts=scenes.map(scene=>{const c=conceptFor(scene,{required:!draft});return{scene,ready:!!c,background:!!c?.backgroundHTML,workflow:!!c?.workflowHTML};});if(!draft&&concepts.some(c=>!c.background||!c.workflow))throw Error('Every expansion needs background and method interactions');
if(!process.argv.includes('--expansion-only')){
 for(const s of ['m1','m2','m3','m4'])conceptFor(s,{required:!draft});
 const {buildFour}=await import('./build-four-exhibits.mjs'),{buildM2}=await import('./build-m2-exhibit.mjs');buildFour({version:FIVE_VERSION,reportDir:REPORT,updated:'2026-10-30'});buildM2({version:FIVE_VERSION,reportDir:REPORT,updated:'2026-10-30'});
 const {portalKnowledgeBundle}=await import('./mudlogging-content.mjs');fs.writeFileSync('portal/assets/s17-mudlogging-knowledge.js',portalKnowledgeBundle());
}
const {buildExpansions}=await import('./build-expansion.mjs'),{lock,failed}=buildExpansions({requireAll:true,destination:REPORT+'/expansion',lessons:true});if(failed)throw Error('Invalid expansion source');
const runtime=[...walk('dist/cases'),...walk('dist/expansion-cases')].map(record);fs.writeFileSync(path.join(REPORT,'build-lock.json'),JSON.stringify({builtAt:new Date().toISOString(),draft,versions:{mudlogging:FIVE_VERSION,other:EXPANSION_VERSION},concepts,runtime,caseCount:61,sourceOnlyBuild:true},null,2));console.log(JSON.stringify({built:lock.actualCount,concepts:concepts.filter(c=>c.ready).length,draft,files:runtime.length}));
