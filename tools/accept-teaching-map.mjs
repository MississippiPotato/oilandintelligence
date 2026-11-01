import {execFileSync} from 'node:child_process';
import {ROOT} from './teaching-map-contract.mjs';
const run=args=>execFileSync(process.execPath,args,{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:240000,maxBuffer:8*1024*1024});
const session='teaching-map',open=()=>{try{run(['tools/pw.mjs',session,'close']);}catch{}run(['tools/pw.mjs',session,'open','about:blank','--config=checks/playwright-local-file.json']);};
try{
 open();
 for(const [name,file]of [['global'],['search','checks/site-upgrade/browser-search.js'],['loader','checks/site-upgrade/browser-loader.js'],['stage','checks/site-upgrade/browser-stage.js'],['offline-stage','checks/site-upgrade/browser-offline-stage.js'],['samples'],['import']])process.stdout.write(run(['tools/run-teaching-browser.mjs',name,...(file?[file]:[])]));
 open();process.stdout.write(run(['tools/accept-teaching-map-six.mjs']));
}finally{try{run(['tools/pw.mjs',session,'close']);}catch{}}
