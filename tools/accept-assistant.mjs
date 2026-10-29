import {execFileSync}from'node:child_process';import path from'node:path';
const root=path.resolve(import.meta.dirname,'..'),run=(p,args=[])=>execFileSync(process.execPath,[p,...args],{cwd:root,stdio:'inherit',windowsHide:true});
run('tools/sync-assistant.mjs');
run('tools/pw.mjs',['assistantcompact','open','about:blank','--config=checks/playwright-local-file.json']);
for(const phase of ['core','paths','media'])run('checks/browser-assistant-companion.mjs',['--phase='+phase]);
run('checks/verify-assistant-companion.mjs');
