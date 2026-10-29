import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),report='handoff/home-and-five-refinement-2026-10-29';
process.chdir(root);fs.mkdirSync(report+'/downloads',{recursive:true});
const mode=process.argv[2]??'core',file='checks/refinement/browser-'+mode+'.js';
if(!fs.existsSync(file))throw Error('Unknown browser protocol '+mode);
const previous=report+'/browser-'+mode+'.json';
if(fs.existsSync(previous)&&JSON.parse(fs.readFileSync(previous,'utf8')).failed){fs.mkdirSync(report+'/attempts',{recursive:true});fs.copyFileSync(previous,report+'/attempts/'+mode+'-'+Date.now()+'.json');}
const r=spawnSync(process.execPath,['tools/pw.mjs','five-refine','run-code',fs.readFileSync(file,'utf8')],{cwd:root,encoding:'utf8',timeout:95000,windowsHide:true});
const m=r.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);
if(!m)throw r.error??Error(r.stdout+'\n'+r.stderr);
const value=JSON.parse(m[1]);fs.writeFileSync(report+'/browser-'+mode+'.json',JSON.stringify(value,null,2));
console.log(JSON.stringify({...value,checks:undefined,screenshots:value.screenshots?.length,downloads:value.downloads?.length},null,2));
if(value.failed||r.status)process.exitCode=1;
