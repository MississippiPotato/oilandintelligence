import path from 'node:path';import {spawnSync}from'node:child_process';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:110000,windowsHide:true});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.error||r.status)throw r.error??Error(args.join(' ')+' failed');}
run(['tools/pw.mjs','five-refine','open','http://127.0.0.1:8755/portal/index.html','--config=checks/playwright-local-file.json']);
for(const mode of ['core','mobile','offline','import','portal','samples','home'])run(['tools/accept-five-refinement.mjs',mode]);
run(['checks/verify-refinement.mjs']);
