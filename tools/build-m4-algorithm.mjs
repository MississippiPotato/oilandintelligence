import fs from 'node:fs';import path from 'node:path';
import {buildFour}from'./build-four-exhibits.mjs';import {buildM2}from'./build-m2-exhibit.mjs';import {buildLazyPortal}from'./build-lazy-portal.mjs';
process.chdir(path.resolve(import.meta.dirname,'..'));
const reportDir='handoff/m4-algorithm-m1-materials-2026-11-03',version='1.13.0',ids=new Set(['s17-cuttings-lithology','s17-mudgas-context','s17-drilltime-boundaries']);fs.mkdirSync(reportDir,{recursive:true});
const options={version,reportDir,updated:'2026-11-03'},cases=[...buildFour({...options,onlyScenes:['m1','m4']}),buildM2({...options,emitPortalKnowledge:false})],written=[];
buildLazyPortal({write:false,expectedCount:65,onOutput:o=>{if(ids.has(o.caseId)||o.path==='portal/assets/s17-case-catalog.js'){fs.writeFileSync(o.path,o.content);written.push(o.path);}}});
let course=fs.readFileSync('portal/assets/s17-course.js','utf8');course=course.replace(/function expectedVersion\(c\)\{[^\n]*\}/,"function expectedVersion(c){return ['m1','m2','m4'].includes(c.scene)?'1.13.0':'1.12.0';}");fs.writeFileSync('portal/assets/s17-course.js',course);
// Only cache tokens change in the homepage. No homepage, avatar or assistant rebuild.
let html=fs.readFileSync('portal/index.html','utf8');html=html.replace(/(s17-(?:case-catalog|course)\.js\?v=)[^"']+/g,'$1'+'20261103-m4-algorithm');fs.writeFileSync('portal/index.html',html);
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.version='1.14.1';pkg.scripts['build:m4-algorithm']='node tools/build-m4-algorithm.mjs';pkg.scripts['test:m4-algorithm']='node checks/verify-m4-algorithm.mjs';pkg.scripts.build=pkg.scripts['build:m4-algorithm'];pkg.scripts.test=pkg.scripts['test:m4-algorithm'];pkg.scripts['verify-delivery']=pkg.scripts.test;pkg.scripts.package='node tools/package-m4-algorithm.mjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
fs.writeFileSync(reportDir+'/build.json',JSON.stringify({at:new Date().toISOString(),version,portalVersion:pkg.version,cases,portalFiles:written,scope:'M2 explanatory-diagram rollback, M4 actual k-means playback, M1 real-photo-texture material. Other62 cases protected.'},null,2));
console.log(JSON.stringify({version,cases:cases.map(c=>({id:c.caseId,bytes:c.bytes})),portalFiles:written},null,2));
