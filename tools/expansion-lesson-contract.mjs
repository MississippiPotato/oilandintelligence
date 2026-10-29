import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const ROOT=path.resolve(import.meta.dirname,'..');
export const REPORT='handoff/expansion-lessons-2026-10-29';
export const VERSION='1.1.0';
export const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
export const write=(p,x)=>{fs.mkdirSync(path.dirname(path.join(ROOT,p)),{recursive:true});fs.writeFileSync(path.join(ROOT,p),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');};
export const walk=p=>fs.readdirSync(path.join(ROOT,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
export const record=p=>({path:p,bytes:fs.statSync(path.join(ROOT,p)).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex')});
export function freeze(){
 const target=REPORT+'/before.json';if(fs.existsSync(path.join(ROOT,target)))return JSON.parse(read(target));
 const previous=JSON.parse(read('handoff/four-exhibits-2026-10-29/before.json'));
 const homepage=JSON.parse(read('handoff/four-exhibits-2026-10-29/homepage-files.json'));
 const sources=fs.readdirSync(path.join(ROOT,'expansion-src')).filter(s=>fs.statSync(path.join(ROOT,'expansion-src',s)).isDirectory());
 const protectedPaths=[...new Set([...previous.protectedFiles,...previous.sourceDataFiles,...homepage.files].map(f=>f.path))];
 const b={createdAt:new Date().toISOString(),scope:'Light teaching redesign of the other56 cases. Preserve current5 mudlogging runtime/source, all56 computation engines/controllers, teacher copies, original observations, homepage and historical reports.',
 protectedFiles:protectedPaths.map(record),mudloggingFiles:[...walk('dist/cases'),...['m1','m2','m3','m4','m5'].flatMap(s=>walk('case-src/'+s))].map(record),
 engineFiles:sources.flatMap(s=>['engine.js','app.js'].map(n=>record('expansion-src/'+s+'/'+n))),
 historicalFiles:['handoff/four-exhibits-2026-10-29','handoff/m2-exhibit-2026-10-28','handoff/observation-design-2026-10-24','handoff/teaching-audit-2026-10-24'].filter(p=>fs.existsSync(path.join(ROOT,p))).flatMap(walk).map(record),
 previousRuntime:walk('dist/expansion-cases').map(record)};
 write(target,b);return b;
}
if(process.argv.includes('--freeze')){const b=freeze();console.log(JSON.stringify({protected:b.protectedFiles.length,mudlogging:b.mudloggingFiles.length,enginesAndControllers:b.engineFiles.length,history:b.historicalFiles.length,previousRuntime:b.previousRuntime.length}));}
