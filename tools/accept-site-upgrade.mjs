import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {ROOT,REPORT} from './site-upgrade-contract.mjs';

process.chdir(ROOT);
const session='upgrade-accept';
function run(args,env={}){
 const r=spawnSync(process.execPath,args,{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:120000,env:{...process.env,...env}});
 if(r.error||r.status||/### Error|Session closed/.test(r.stdout+r.stderr))throw r.error??Error(r.stdout+'\n'+r.stderr);
 return r.stdout;
}
try{
 run(['tools/pw.mjs',session,'open','about:blank','--config=checks/playwright-local-file.json']);
 for(const name of ['search','loader','regression','stage','offline-stage','storyboard']){
  run(['tools/pw.mjs',session,'run-code',fs.readFileSync('checks/site-upgrade/browser-'+name+'.js','utf8')],{S17_REPORT:REPORT+'/browser-'+name+'.json'});
  const r=JSON.parse(fs.readFileSync(REPORT+'/browser-'+name+'.json','utf8'));
  if(r.failed)throw Error(name+' browser checks failed: '+r.failure);
  console.log(JSON.stringify({scope:name,passed:r.passed,failed:r.failed}));
 }
}finally{try{run(['tools/pw.mjs',session,'close']);}catch{}}
if(!process.argv.includes('--portal-only')){
 try{
  run(['tools/pw.mjs','upgrade-variants','open','about:blank','--config=checks/playwright-local-file.json']);
  for(const scene of ['g3','p1','c1','co3'])for(const phase of ['desktop','mobile','offline','native'])console.log(run(['checks/site-upgrade-variants-browser.js',scene,phase]).trim());
 }finally{try{run(['tools/pw.mjs','upgrade-variants','close']);}catch{}}
 run(['checks/site-upgrade-variants-browser-summary.js']);
}
console.log('Actual Chrome protocols complete. Import override/hidden-list confirmation records and visibility limitations are documented in acceptance.md.');
