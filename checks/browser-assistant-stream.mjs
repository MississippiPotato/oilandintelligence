import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const phase=process.argv[2]??'online',report='handoff/assistant-stream-2026-10-30';
const code=fs.readFileSync(`checks/assistant-stream-${phase}.browser.txt`,'utf8');
const r=spawnSync(process.execPath,['tools/pw.mjs',process.env.S17_BROWSER_SESSION??'jingjian-stream','run-code',code],{encoding:'utf8',windowsHide:true,timeout:95000});
const match=r.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);if(!match)throw Error(r.stdout+r.stderr);
const data=JSON.parse(match[1]);fs.mkdirSync(report,{recursive:true});fs.writeFileSync(`${report}/browser-${phase}.json`,JSON.stringify(data,null,2));
console.log(JSON.stringify({phase,checks:data.checks,exception:data.exception},null,2));if(data.exception||data.checks.some(c=>!c.passed))process.exitCode=1;
