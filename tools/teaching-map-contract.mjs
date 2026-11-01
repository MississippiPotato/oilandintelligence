import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const ROOT=path.resolve(import.meta.dirname,'..'), REPORT='handoff/teaching-map-2026-11-01';
export const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
export const write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(ROOT,p)),{recursive:true});fs.writeFileSync(path.join(ROOT,p),typeof v==='string'?v:JSON.stringify(v,null,2));};
export const walk=p=>fs.existsSync(path.join(ROOT,p))?fs.readdirSync(path.join(ROOT,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]).sort():[];
export const record=p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};};
export function freeze(){if(fs.existsSync(path.join(ROOT,REPORT,'before.json')))return;const protectedFiles=[...walk('portal-original'),...walk('石油勘探开发智能化案例集'),...walk('data'),...['case-src','expansion-src','case-variants','shared'].flatMap(walk).filter(p=>/\/(?:engine|fixtures|exhibit-data|data|math|metrics|evidence)(?:[^/]*)\.(?:js|json)$/.test(p))];write(REPORT+'/before.json',{capturedAt:new Date().toISOString(),meaning:'Current pre-revision engines, observations, original portal and original assignment copy. Display sources may change.',protectedFiles:[...new Set(protectedFiles)].map(record)});}
export function protectedCheck(){return JSON.parse(read(REPORT+'/before.json')).protectedFiles.filter(f=>record(f.path).sha256!==f.sha256);}
