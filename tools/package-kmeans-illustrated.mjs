import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const report='handoff/kmeans-illustrated-2026-11-03',runtime=['case.json','README.txt','demo/index.html','demo/demo.css','demo/demo.js'];
const five=['s17-cuttings-lithology','s17-mudgas-context','s17-fluorescence-review','s17-drilltime-boundaries','s17-evidence-report'];
const entries=id=>runtime.map(p=>['dist/cases/'+id+'/'+p,id+'/'+p]),packages=[];
function zip(target,pairs){
 const py="import sys,json,zipfile\npairs=json.loads(sys.stdin.buffer.read().decode('utf8'))\nwith zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:\n for a,b in pairs:z.write(a,b)\nwith zipfile.ZipFile(sys.argv[1]) as z:assert z.testzip() is None";
 execFileSync('python',['-X','utf8','-c',py,target],{input:JSON.stringify(pairs),windowsHide:true});
 packages.push({path:target,members:pairs.length,bytes:fs.statSync(target).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')});
}
for(const id of [five[0],five[3]])zip('dist/'+id+'-1.13.1.zip',entries(id));
zip('dist/s17-mudlogging-five-2026-11-03-kmeans-illustrated.zip',five.flatMap(entries));
fs.writeFileSync(report+'/packages.json',JSON.stringify({at:new Date().toISOString(),packages,scope:'M1/M4 1.13.1; M2 1.13.0; M3/M5 1.12.0 unchanged'},null,2));
console.log(JSON.stringify(packages,null,2));
