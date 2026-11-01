import {execFileSync} from 'node:child_process';
import {ROOT,REPORT,read,write,record} from './teaching-map-contract.mjs';
const runtime=JSON.parse(read(REPORT+'/runtime-lock.json'));
const cfg={assets:['index.html','portal/index.html','portal/assets/s17-stage-motion.js','portal/assets/s17-case-catalog.js','portal/assets/s17-shell.min.js','portal/assets/s17-portal.min.css','portal/assets/s17-mudlogging-stage.js','portal/assets/s17-mudlogging-3d.js','shared/course-compass.js',...runtime.cases.filter(c=>/^m[1-5]$/.test(c.scene)||c.scene==='d1').map(c=>c.files.find(f=>f.path.endsWith('demo.js')).path)].map(record),archives:['dist/s17-all-65-cases-1.13.0.zip','dist/s17-site-1.13.0-offline.zip'].map(record)};
async function protocol(page,cfg){
 return page.evaluate(async cfg=>{
  const base='https://mississippipotato.github.io/oilandintelligence/';
  const assets=await Promise.all(cfg.assets.map(async f=>{const r=await fetch(base+f.path+'?verify=1.13.0',{cache:'no-store'}),b=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');return {path:f.path,status:r.status,bytes:b.byteLength,sha256:hash,match:r.ok&&hash===f.sha256};}));
  const archives=await Promise.all(cfg.archives.map(async f=>{const r=await fetch(base+f.path,{method:'HEAD',cache:'no-store'});return {path:f.path,status:r.status,contentLength:Number(r.headers.get('content-length')),expected:f.bytes,available:r.ok};}));
  return {checkedAt:new Date().toISOString(),assets,archives,failed:assets.filter(x=>!x.match).length+archives.filter(x=>!x.available).length};
 },cfg);
}
const code='async page=>('+protocol.toString()+')(page,'+JSON.stringify(cfg)+')',x=execFileSync(process.execPath,['tools/pw.mjs','teaching-online','run-code',code],{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:100000,maxBuffer:4*1024*1024}),m=x.match(/### Result\s*\n([\s\S]*?)(?:\n###|$)/);
if(!m)throw Error(x);const r=JSON.parse(m[1]);write(REPORT+'/online-assets.json',r);console.log(JSON.stringify({assets:r.assets.length,matched:r.assets.filter(x=>x.match).length,archives:r.archives,failed:r.failed}));if(r.failed)process.exitCode=1;
