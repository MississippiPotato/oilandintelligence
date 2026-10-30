import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {ROOT,REPORT,VARIANTS,PACKAGE_FILES,caseFolders,record,read,write,walk} from '../tools/site-upgrade-contract.mjs';
import {courseAtlas} from '../tools/course-compass.mjs';

process.chdir(ROOT);const checks=[];
function ok(name,value,detail){checks.push({name,passed:!!value,...(detail===undefined?{}:{detail})});if(!value)throw Error(name);}
const before=JSON.parse(read(REPORT+'/before.json'));
for(const f of before.protectedFiles)ok('Protected original/data/calculation bytes: '+f.path,record(f.path).sha256===f.sha256);
const atlas=courseAtlas(),catalogContext={window:{},console};catalogContext.window=catalogContext;
vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),catalogContext,{filename:'s17-case-catalog.js'});
const catalog=catalogContext.S17CaseCatalog;
ok('Light catalog exists',!!catalog&&Array.isArray(catalog.cases)&&Array.isArray(catalog.sections));
ok('65 independent authored case IDs',catalog.cases.length===65&&new Set(catalog.cases.map(c=>c.id)).size===65);
ok('61 original scenario IDs remain the coverage denominator',new Set(catalog.cases.map(c=>c.sceneId)).size===61&&catalog.cases.every(c=>atlas.index.byScene[c.sceneId]));
ok('Knowledge index <=256 KiB',record('portal/assets/s17-case-catalog.js').bytes<=256*1024);
for(const stage of atlas.stages)ok(stage.name+' has at least five authored implementations',catalog.cases.filter(c=>c.stageId===stage.id).length>=5);
for(const row of VARIANTS){const c=catalog.cases.find(c=>c.id===row.caseId);ok(row.caseId+' keeps its original scene and secondary role',c?.sceneId===row.sceneId&&c?.primary===false);}
const folders=caseFolders(),cases=[];
for(const folder of folders){
 const p=JSON.parse(read(folder+'/case.json')),files=walk(folder),relative=files.map(p=>p.slice(folder.length+1));
 ok(p.id+' original five-file layout',JSON.stringify(relative)===JSON.stringify(PACKAGE_FILES));
 ok(p.id+' original 6 MiB limit',files.reduce((n,p)=>n+record(p).bytes,0)<=6*1024*1024);
 ok(p.id+' retains original ATLAS binding',!!atlas.index.byScene[p.sceneId]);
 ok(p.id+' has all three teaching parts',['background','workflow','demo'].every(k=>p.tabs?.[k]));
 ok(p.id+' original workflow lead shape',p.tabs.workflow.lead==null||Array.isArray(p.tabs.workflow.lead));
 ok(p.id+' manifest has non-executable HTML',!/<script\b|\bon\w+\s*=|javascript\s*:/i.test(JSON.stringify(p)));
 const html=read(folder+'/demo/index.html'),js=read(folder+'/demo/demo.js');
 ok(p.id+' ordinary offline entry',!/type\s*=\s*["']module["']|<(?:script|link|img|source)\b[^>]+(?:src|href)\s*=\s*["']https?:/i.test(html));
 new vm.Script(js,{filename:folder+'/demo/demo.js'});ok(p.id+' bundled script syntax',true);
 const meta=catalog.cases.find(c=>c.id===p.id);ok(p.id+' searchable case and knowledge chapters',!!meta&&catalog.sections.some(s=>s.caseId===p.id&&s.tab==='bg')&&catalog.sections.some(s=>s.caseId===p.id&&s.tab==='flow'));
 const contentURL=meta.contentURL??meta.contentUrl;
 ok(p.id+' has an existing deferred body chunk',typeof contentURL==='string'&&fs.existsSync(path.join('portal',contentURL.split('?')[0])));
 new vm.Script(read('portal/'+contentURL.split('?')[0]),{filename:contentURL});
 cases.push({id:p.id,scene:p.sceneId,version:p.version,files:files.map(record)});
}
ok('325 files and 65 case folders',folders.length===65&&cases.flatMap(c=>c.files).length===325);
const html=read('portal/index.html').replace(/<!--[\s\S]*?-->/g,''),scriptTags=[...html.matchAll(/<script\b([^>]*\bsrc=["']([^"']+)["'][^>]*)>/gi)];
ok('Bootstrap keeps dependency order with defer',scriptTags.every(m=>/\bdefer\b/.test(m[1])));
ok('Catalog registers before original importer',html.indexOf('s17-case-catalog.js')<html.indexOf('s17-case-import.min.js'));
const heavy=['s17-expansion-cases.js','s17-mudlogging-knowledge.js','welllog-layer.case.js','welllog-layer.demo.js','s17-welllog-demo.min.js','pixi-6.5.10.min.js','live2dcubismcore.min.js','pixi-live2d-0.4.0.min.js','s17-live2d-data.js','s17-mudlogging-3d.js'];
ok('Homepage contains no eager case/3D/avatar scripts',scriptTags.every(m=>!heavy.some(p=>m[2].split('?')[0].endsWith('/'+p))));
const bootstrap=scriptTags.map(m=>path.posix.normalize('portal/'+m[2].split('?')[0])).map(record);
ok('Bootstrap JS <=650 KiB',bootstrap.reduce((n,p)=>n+p.bytes,0)<=650*1024,{bytes:bootstrap.reduce((n,p)=>n+p.bytes,0)});
for(const p of bootstrap)new vm.Script(read(p.path),{filename:p.path});
const build=JSON.parse(read(REPORT+'/build-lock.json'));
for(const c of build.cases)for(const f of c.files)ok('Current build fingerprint '+f.path,record(f.path).sha256===f.sha256);
ok('Three.js r180 MIT attribution is local',read('portal/assets/vendor/three-r180/LICENSE').includes('The MIT License')&&read('portal/assets/vendor/three-r180/three.module.js').includes('REVISION'));
ok('3D output is an ordinary locally bundled script',fs.existsSync('portal/assets/s17-mudlogging-3d.js')&&!/^\s*(?:import|export)\s/m.test(read('portal/assets/s17-mudlogging-3d.js')));
ok('No new official scene IDs',JSON.stringify(atlas.stages.map(s=>s.scenes.map(c=>c.id))).includes('g1')&&atlas.allScenes.length===61);
const out={checkedAt:new Date().toISOString(),scope:'Source bytes, executable syntax, ordinary offline entry, import contracts, directory/index and build fingerprints. This command does not operate a browser.',passed:checks.length,failed:0,caseCount:65,sceneCount:61,runtimeFiles:325,protectedFiles:before.protectedFiles.length,bootstrapJSBytes:bootstrap.reduce((n,p)=>n+p.bytes,0),all65BrowserAllPathsClaimed:false,cases,checks};
write(REPORT+'/source-checks.json',out);write(REPORT+'/runtime-lock.json',{createdAt:new Date().toISOString(),cases});
console.log(JSON.stringify({...out,cases:undefined,checks:undefined},null,2));
