import {spawnSync} from 'node:child_process';
function run(args,env={}){const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,timeout:180000,env:{...process.env,...env}});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status)throw Error(args.join(' '));}
run(['tools/pw.mjs','teacher-update-accept','open','about:blank','--config=checks/playwright-local-file.json']);
for(const name of ['home','stage','archive','methods','compatibility','collection'])run(['tools/run-teacher-update.mjs',name],{S17_BROWSER_SESSION:'teacher-update-accept'});
run(['tools/pw.mjs','teacher-update-accept','close']);
