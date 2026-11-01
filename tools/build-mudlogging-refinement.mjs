import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildFour} from './build-four-exhibits.mjs';
import {buildM2} from './build-m2-exhibit.mjs';
import {buildLazyPortal} from './build-lazy-portal.mjs';
const root=path.resolve(import.meta.dirname,'..'), reportDir='handoff/mudlogging-refinement-2026-10-30';
const ids=new Set(['s17-cuttings-lithology','s17-mudgas-context','s17-fluorescence-review','s17-drilltime-boundaries','s17-evidence-report']);
fs.mkdirSync(path.join(root,reportDir),{recursive:true});
const options={version:'1.9.0',reportDir,updated:'2026-10-30'};
buildFour(options);buildM2({...options,emitPortalKnowledge:false});
if(!process.argv.includes('--allow-stale-preview')){
 const written=[];
 const summary=buildLazyPortal({write:false,expectedCount:65,onOutput:output=>{
   if(ids.has(output.caseId)||output.path==='portal/assets/s17-case-catalog.js'){
    const target=path.join(root,output.path);if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output.content){fs.writeFileSync(target,output.content);written.push(output.path);}
   }
 }});
 fs.writeFileSync(path.join(root,reportDir,'lazy-portal-build.json'),JSON.stringify({...summary,scope:'Five mudlogging content shards and catalogue only; other case bodies preserved',written},null,2)+'\n');
 const before=JSON.parse(fs.readFileSync(path.join(root,'handoff/site-upgrade-2026-10-30/before.json'),'utf8'));
 const approvedPaths=['case-src/m4/engine.js','case-src/m5/engine.js','case-src/m5/fixtures.js'];
 const overrides=approvedPaths.map(p=>{const prior=before.protectedFiles.find(f=>f.path===p);if(!prior)throw Error('Missing original fingerprint: '+p);return {path:p,previousSha256:prior.sha256,currentSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')};});
 fs.writeFileSync(path.join(root,reportDir,'protected-overrides.json'),JSON.stringify({scope:'Explicitly authorized M4 gap correction, M5 extraction correction and refreshed M4 snapshot',overrides},null,2)+'\n');
 console.log(JSON.stringify({scope:'five cases and enhanced portal',written}));
}
