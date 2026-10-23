import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const original=path.join(root,'石油勘探开发智能化案例集');
for(const dir of ['portal-original','portal']) {
  const dst=path.join(root,dir);
  if(!fs.existsSync(dst)) fs.cpSync(original,dst,{recursive:true,errorOnExist:true});
}
for(const dir of ['handoff','schemas','checks','output/playwright','case-src/m2','prototypes','dist/cases']) fs.mkdirSync(path.join(root,dir),{recursive:true});
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name)):[path.join(dir,d.name)]);}
const manifest=files(original).map(p=>({path:path.relative(original,p).replaceAll('\\','/'),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));
fs.writeFileSync(path.join(root,'handoff/original-lock.json'),JSON.stringify({source:'石油勘探开发智能化案例集',copiedTo:['portal-original','portal'],date:'2026-10-23',files:manifest},null,2));
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(original,'assets/data.js'),'utf8'),ctx);
const stages=ctx.window.ATLAS.stages;
const ids={m1:'s17-cuttings-lithology',m2:'s17-mudgas-context',m3:'s17-fluorescence-review',m4:'s17-drilltime-boundaries',m5:'s17-evidence-report'};
const coverage=stages.map(s=>({stageId:s.id,stageName:s.name,scenes:s.scenes.map(c=>({sceneId:c.id,title:c.name,methods:c.methods,mandatory:Object.hasOwn(ids,c.id),caseId:ids[c.id]??null,implementation:c.id==='m2'?'see acceptance record':'not_implemented_this_round'}))}));
fs.writeFileSync(path.join(root,'handoff/coverage.json'),JSON.stringify({studentSuffix:17,stageCount:stages.length,sceneCount:stages.flatMap(s=>s.scenes).length,scope:'G0/G1; m2 only; prototypes are not cases',stages:coverage},null,2));
const protocol=JSON.parse(fs.readFileSync(path.join(root,'s17_development_kit/07_证据交换与数据协议.json'),'utf8'));
protocol.schemaVersion='1.0';protocol.documentRole='implemented_subset_with_explicit_limits';protocol.implemented=true;
protocol.implementationScope='m2 exports ready evidence; G0 m5 invalidation/conflict prototype only; m1/m3/m4/m5 full cases not implemented';
fs.writeFileSync(path.join(root,'schemas/evidence-v1.json'),JSON.stringify(protocol,null,2));
const scenario={schemaVersion:'1.0',datasetId:'s17-synthetic-v1',dataNature:'synthetic_teaching',wellId:'DEMO-017',timeOrigin:'relative 0 s',depthRangeMD_m:[1200,1280],units:{time:'s',depth:'m MD',flow:'m3/s',effectiveVolume:'m3',ROP:'m/h',drillTime:'min/m',gas:'normalized instrument unit (not volume fraction)'},samples:Array.from({length:8},(_,i)=>({parentSampleId:`DEMO-017-P${i+1}`,sampleId:`DEMO-017-S${i+1}`,capturePairId:`DEMO-017-WLUV${i+1}`,splitGroupId:`DEMO-017-P${i+1}`,depthRangeMD_m:[1200+i*10,1210+i*10],modalities:['white_light','UV'],status:'identity_reserved_no_full_image_case'})),split:{train:'TRAIN-001..028',validation:'VALID-001..008',test:'DEMO-017',rule:'whole wells; every event/paired image variant stays in its parent group'},independence:{m1:'future embedded paired pixel fixture',m2:'embedded deterministic generator + independent training/validation wells',m3:'future embedded WL/UV fixture sharing parent identity with m1',m4:'future embedded curves/calibration; prototype only',m5:'future embedded source snapshots; invalidation prototype only'}};
fs.writeFileSync(path.join(root,'schemas/scenario-core.json'),JSON.stringify(scenario,null,2));
fs.writeFileSync(path.join(root,'saphirv3-main/REFERENCE_ONLY.txt'),'仅供教学组织和交互参考。未迁移业务、模型、归档指标和字体。原源码不参与构建。2026-10-23\n');
console.log(JSON.stringify({preservedFiles:manifest.length,stages:stages.length,scenes:stages.flatMap(s=>s.scenes).length}));
