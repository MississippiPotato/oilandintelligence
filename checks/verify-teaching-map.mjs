import fs from 'node:fs';import vm from 'node:vm';
import {ROOT,REPORT,read,write,walk,record,protectedCheck} from '../tools/teaching-map-contract.mjs';
import {caseFolders,PACKAGE_FILES} from '../tools/site-upgrade-contract.mjs';
import {courseAtlas} from '../tools/course-compass.mjs';
process.chdir(ROOT);const checks=[];const ok=(name,value,detail)=>{checks.push({name,passed:!!value,detail});if(!value)throw Error(name)};
ok('Frozen original portal, engines and data unchanged',protectedCheck().length===0,protectedCheck());
const supplemental=JSON.parse(read(REPORT+'/protected-data-completion.json'));
ok('Additional image and real-data source fingerprints unchanged',supplemental.files.every(f=>f.gitBaselineBlob===f.gitCurrentBlob&&record(f.path).sha256===f.sha256),{files:supplemental.files.length});
const atlas=courseAtlas(),context={};context.window=context;vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),context);const catalog=context.S17CaseCatalog;
ok('65 authored cases in 61 original scenes',catalog.cases.length===65&&new Set(catalog.cases.map(x=>x.sceneId)).size===61);
const cases=[];
for(const folder of caseFolders()){
 const m=JSON.parse(read(folder+'/case.json')),files=walk(folder),cat=catalog.cases.find(x=>x.id===m.id);
 ok(m.id+' five-file contract',JSON.stringify(files.map(p=>p.slice(folder.length+1)))===JSON.stringify(PACKAGE_FILES));
 ok(m.id+' <=6MiB',files.reduce((s,p)=>s+record(p).bytes,0)<=6*1024*1024);
 const expected=/^m[1-5]$/.test(m.sceneId)?'1.10.0':m.sceneId==='d1'?'1.3.0':m.id.includes('closure-spill')||m.id.includes('cement-woc')||m.id.includes('completion-seal')||m.id.includes('perforation-depth')?'1.0.1':'1.2.1';
 ok(m.id+' release/index version',m.version===expected&&cat.version===expected);
 ok(m.id+' original scene and three parts',!!atlas.index.byScene[m.sceneId]&&['background','workflow','demo'].every(k=>m.tabs[k]));
 const html=m.tabs.background.sections.map(s=>s.html||s.body||'').join('');
 ok(m.id+' scene overview and preparation list',html.includes('data-course-brief')&&html.includes('data-course-check'));
 const demo=read(folder+'/demo/index.html');ok(m.id+' ordinary local resources',!/type=["']module|<(?:script|img|link)[^>]+(?:src|href)=["']https?:/i.test(demo));
 new vm.Script(read(folder+'/demo/demo.js'),{filename:folder+'/demo/demo.js'});
 new vm.Script(read('portal/'+cat.contentURL),{filename:cat.contentURL});
 ok(m.id+' indexed background and flow',catalog.sections.some(s=>s.caseId===m.id&&s.tab==='bg')&&catalog.sections.some(s=>s.caseId===m.id&&s.tab==='flow'));
 cases.push({id:m.id,scene:m.sceneId,version:m.version,files:files.map(record)});
}
ok('325 runtime files',cases.flatMap(x=>x.files).length===325);
for(const s of atlas.stages){const counts=['低','中','高'].map(d=>s.scenes.filter(x=>x.diff===d).length);ok(s.name+' difficulty sum',counts.reduce((a,b)=>a+b,0)===s.scenes.length,counts);}
ok('Mudlogging 0 low,4 middle,1 high',JSON.stringify(['低','中','高'].map(d=>atlas.index.byStage.mudlogging.scenes.filter(x=>x.diff===d).length))==='[0,4,1]');
const bootstrap=read('portal/index.html');ok('13-stage SVG component referenced',bootstrap.includes('s17-stage-motion.js'));
ok('Case/3D body remains lazy',!/<script[^>]+(?:case-content\/|s17-mudlogging-3d\.js)/.test(bootstrap));
ok('Eager avatar loader retained',read('portal/assets/s17-live2d-loader.js').includes('load'));
const c={};c.globalThis=c;for(const p of ['shared/teaching-figures.js','expansion-src/d1/engine.js'])vm.runInNewContext(read(p),c);
const params={preset:'default',constrain:true,wob:90,rpm:120,flow:26,ucs:60,noise:2,maxWob:125,maxRpm:170,maxFlow:32,maxPressure:19.5,maxTorque:9},r=c.D1Engine.run(params),h=c.S17TeachFigures.regression('check',c.D1Engine.featureNames,c.D1Engine.features(r.current),r.trained.model.scaler,r.trained.model.coef,'m/h'),sum=Number(h.match(/data-teach-sum="([^"]+)/)[1]);
ok('D1 displayed contribution sum equals actual prediction',Math.abs(sum-r.current.estimate)<1e-10,{sum,prediction:r.current.estimate});
write(REPORT+'/source-checks.json',{checkedAt:new Date().toISOString(),kind:'source_contract_and_numeric_check_not_browser_acceptance',passed:checks.length,failed:0,checks});
write(REPORT+'/runtime-lock.json',{createdAt:new Date().toISOString(),cases});
console.log(JSON.stringify({passed:checks.length,failed:0,caseCount:65,sceneCount:61,runtimeFiles:325,protectedFiles:JSON.parse(read(REPORT+'/before.json')).protectedFiles.length}));
