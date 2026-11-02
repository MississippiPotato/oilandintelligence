import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const name=process.argv[2]||'home',source=fs.readFileSync('checks/teacher-update-'+name+'.browser.js','utf8');
const r=spawnSync(process.execPath,['tools/pw.mjs',process.env.S17_BROWSER_SESSION||'additions','run-code',source],{encoding:'utf8',windowsHide:true,timeout:150000}),match=r.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);
if(!match)throw Error(r.stdout+r.stderr);
const result=JSON.parse(match[1]),out='handoff/teacher-update-2026-11-02/browser-'+name+'.json';
if(fs.existsSync(out)){const prior=JSON.parse(fs.readFileSync(out,'utf8'));fs.mkdirSync('handoff/teacher-update-2026-11-02/attempts',{recursive:true});fs.copyFileSync(out,'handoff/teacher-update-2026-11-02/attempts/'+name+'-'+prior.checkedAt.replace(/[:.]/g,'-')+'.json');}
fs.writeFileSync(out,JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
