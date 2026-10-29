import fs from 'node:fs';import path from 'node:path';import {spawnSync}from'node:child_process';
import {ROOT,REPORT}from'./interactive-course-contract.mjs';
process.chdir(ROOT);const mode=process.argv[2]??'core',session=process.argv[3]??'course-interactive',file='checks/interactive/browser-'+mode+'.js';
if(process.argv.includes('--open')){const open=spawnSync(process.execPath,['tools/pw.mjs',session,'open','http://127.0.0.1:8755/portal/index.html','--config=checks/playwright-local-file.json'],{cwd:ROOT,encoding:'utf8',timeout:95000,windowsHide:true});if(open.status||open.error)throw open.error??Error(open.stdout+open.stderr);}
fs.mkdirSync(REPORT+'/downloads',{recursive:true});if(!fs.existsSync(file))throw Error('Unknown browser protocol '+mode);
const previous=REPORT+'/browser-'+mode+'.json';if(fs.existsSync(previous)&&JSON.parse(fs.readFileSync(previous,'utf8')).failed){fs.mkdirSync(REPORT+'/attempts',{recursive:true});fs.copyFileSync(previous,REPORT+'/attempts/'+mode+'-'+Date.now()+'.json');}
const r=spawnSync(process.execPath,['tools/pw.mjs',session,'run-code',fs.readFileSync(file,'utf8')],{cwd:ROOT,encoding:'utf8',timeout:95000,windowsHide:true}),m=r.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);if(!m)throw r.error??Error(r.stdout+'\n'+r.stderr);
const value=JSON.parse(m[1]);fs.writeFileSync(previous,JSON.stringify(value,null,2));console.log(JSON.stringify({...value,checks:undefined,screenshots:value.screenshots?.length,downloads:value.downloads?.length},null,2));if(value.failed||r.status)process.exitCode=1;
