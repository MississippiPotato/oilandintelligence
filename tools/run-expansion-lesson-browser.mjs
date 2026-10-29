import {spawnSync}from'node:child_process';import{ROOT}from'./expansion-lesson-contract.mjs';
function run(file,args=[]){const r=spawnSync(process.execPath,[file,...args],{cwd:ROOT,stdio:'inherit',windowsHide:true});if(r.error||r.status)throw r.error||Error(file+' failed');}
if(!process.argv.includes('--batches-only')){run('tools/pw.mjs',['expansionlessons','close']);run('tools/pw.mjs',['expansionlessons','open','about:blank','--config=checks/playwright-local-file.json']);}
for(let i=Number(process.argv.find(x=>x.startsWith('--from='))?.split('=')[1]||0);i<8;i++)run('checks/browser-expansion-lessons.mjs',['--batch='+i]);
if(!process.argv.includes('--batches-only'))for(const phase of ['offline','original','portal'])run('checks/browser-expansion-paths.mjs',['--phase='+phase]);
