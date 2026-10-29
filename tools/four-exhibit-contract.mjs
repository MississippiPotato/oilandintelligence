import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const ROOT=path.resolve(import.meta.dirname,'..');
export const REPORT='handoff/four-exhibits-2026-10-29';
export const VERSION='1.7.1';
export const FOUR=[
 {scene:'m1',id:'s17-cuttings-lithology',method:'cv',global:'M1Exhibit',name:'岩屑识别',mapLabels:['岩屑从哪里来','观察岩石线索','校正与识别','数量与面积'],regions:[[6,18,37,61],[46,33,16,40],[61,24,11,42],[72,36,21,39]],files:['shared/math.js','case-src/m1/images.js','case-src/m1/engine.js','case-src/m1/real-data.js','shared/lab.js']},
 {scene:'m3',id:'s17-fluorescence-review',method:'cv',global:'M3Exhibit',name:'荧光判读',mapLabels:['同一样品','白光与紫外','曝光与参照','显示面积'],regions:[[6,36,20,43],[28,29,25,48],[55,31,20,44],[77,35,17,42]],files:['shared/math.js','case-src/m1/images.js','case-src/m1/engine.js','case-src/m3/engine.js','shared/lab.js']},
 {scene:'m4',id:'s17-drilltime-boundaries',method:'ts',global:'M4Exhibit',name:'钻时分段',mapLabels:['沿井眼记录','钻进与工况','共同深度对照','候选井段'],regions:[[7,27,24,53],[33,31,20,44],[55,37,20,39],[78,32,16,44]],files:['shared/math.js','case-src/m4/engine.js','case-src/m4/real-data.js','shared/lab.js']},
 {scene:'m5',id:'s17-evidence-report',method:'nlp',global:'M5Exhibit',name:'录井报告',mapLabels:['保存观察','抽取字段','分类与组装','逐句回查'],regions:[[6,32,21,46],[29,32,21,46],[53,32,22,46],[77,32,17,46]],files:['shared/math.js','case-src/m5/data.js','case-src/m5/engine.js','case-src/m5/enhance-core.js','case-src/m5/fixtures.js','shared/lab.js']}
];
export const RUNTIME=['case.json','README.txt','demo/index.html','demo/demo.css','demo/demo.js'];
export const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
export const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
export function record(p){return{path:p,bytes:fs.statSync(path.join(ROOT,p)).size,sha256:sha(p)};}
export function walk(p){return fs.readdirSync(path.join(ROOT,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);}
