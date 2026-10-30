import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ROOT,REPORT,record,read,write} from './site-upgrade-contract.mjs';

process.chdir(ROOT);
const archive='dist/s17-site-1.12.0-offline.zip';
const extraction='output/site-upgrade-offline-check-'+Date.now();
execFileSync('python',['-X','utf8','-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',archive,extraction],{cwd:ROOT,windowsHide:true});
const session='upgrade-package';
function run(args){
 const r=spawnSync(process.execPath,['tools/pw.mjs',session,...args],{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:90000});
 if(r.error||r.status||/### Error|Session closed/.test(r.stdout+r.stderr))throw r.error||Error(r.stdout+'\n'+r.stderr);
 return r.stdout;
}
try{
 run(['open','about:blank','--config=checks/playwright-local-file.json']);
 const url=pathToFileURL(path.join(ROOT,extraction,'portal/index.html')).href;
 const code=read('checks/site-upgrade/browser-packaged-site.js').replace('__PACKAGED_FILE__',url);
 const output=run(['run-code',code]),match=output.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);
 if(!match)throw Error(output);
 const result=JSON.parse(match[1]);
 result.testedArchive=record(archive);
 const loader=extraction+'/portal/assets/s17-case-loader.js';
 result.extractedLoaderSHA256=crypto.createHash('sha256').update(fs.readFileSync(loader)).digest('hex');
 result.currentLoaderMatches=result.extractedLoaderSHA256===record('portal/assets/s17-case-loader.js').sha256;
 write(REPORT+'/browser-packaged-site.json',result);
 if(result.failed||!result.currentLoaderMatches)throw Error('Packaged browser smoke failed: '+result.failure);
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,testedArchive:result.testedArchive,currentLoaderMatches:result.currentLoaderMatches}));
}finally{try{run(['close']);}catch{}}
