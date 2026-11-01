import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import {ROOT,REPORT,read,write} from './teaching-map-contract.mjs';
const selected=process.argv[2],phase=process.argv[3],ids={m1:'s17-cuttings-lithology',m2:'s17-mudgas-context',m3:'s17-fluorescence-review',m4:'s17-drilltime-boundaries',m5:'s17-evidence-report',d1:'s17x-d1-rop-optimization'};
for(const [scene,id]of Object.entries(ids).filter(([s])=>!selected||s===selected)){
 const cfg={scene,id,phase,folder:'dist/'+(scene==='d1'?'expansion-cases':'cases')+'/'+id,steps:scene==='m5'||scene==='d1'?5:6};
 const code=read('checks/teaching-map-six.browser.js').replace('__CFG__',JSON.stringify(cfg));
 const x=spawnSync(process.execPath,['tools/pw.mjs','teaching-map','run-code',code],{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:100000});
 const match=x.stdout?.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);if(!match)throw Error(x.stdout+x.stderr);
 const doc=JSON.parse(match[1]);write(REPORT+'/browser-'+scene+(phase?'-'+phase:'')+'.json',doc);console.log(JSON.stringify({scene,passed:doc.passed,failed:doc.failed,failure:doc.failure}));if(doc.failed){process.exitCode=1;break;}
}
