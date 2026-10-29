import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),report='handoff/home-and-five-refinement-2026-10-29',version='1.8.0';
process.chdir(root);fs.mkdirSync(report,{recursive:true});
// Recompute captured previews after the first build; do not overwrite dated acceptance.
if(process.argv.includes('--draft')&&!process.argv.includes('--allow-stale-preview'))process.argv.push('--allow-stale-preview');
const {buildFour}=await import('./build-four-exhibits.mjs');
const {buildM2}=await import('./build-m2-exhibit.mjs');
const cases=buildFour({version,reportDir:report,updated:'2026-10-30',suppressLegacyLocks:true});
const m2=buildM2({version,reportDir:report,updated:'2026-10-30'});
const {portalKnowledgeBundle}=await import('./mudlogging-content.mjs');
fs.writeFileSync('portal/assets/s17-mudlogging-knowledge.js',portalKnowledgeBundle());
const files=[...cases.flatMap(c=>c.files.map(f=>'dist/cases/'+c.caseId+'/'+f.path)),...m2.files.map(f=>'dist/cases/s17-mudgas-context/'+f.path)];
fs.writeFileSync(report+'/five-runtime-lock.json',JSON.stringify({builtAt:new Date().toISOString(),version,files:files.map(p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};})},null,2));
console.log(JSON.stringify({scope:'five mudlogging lessons',version,files:files.length,draft:process.argv.includes('--draft')}));
if(process.argv.includes('--all')){
 const {buildExpansions}=await import('./build-expansion.mjs');
 const {profiles}=await import('./expansion-lesson-profiles.mjs');
 for(const scene of Object.keys(profiles)){
  const file='expansion-src/'+scene+'/case.json',text=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,text.replace(/("version"\s*:\s*")[^"]+(")/,(_,a,b)=>a+'1.1.1'+b).replace(/("updated"\s*:\s*")[^"]+(")/,(_,a,b)=>a+'2026-10-30'+b));
 }
 const {lock,failed}=buildExpansions({requireAll:true,destination:report+'/expansion',lessons:true});
 console.log(JSON.stringify({scope:'56 cases after source audit',version:'1.1.1',cases:lock.actualCount,invalid:lock.invalid.length}));
 if(failed)process.exitCode=1;
}
