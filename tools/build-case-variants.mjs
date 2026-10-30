import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import {ROOT,REPORT,VARIANTS,PACKAGE_FILES,read,write,record} from './site-upgrade-contract.mjs';
import {courseAtlas,courseContext,courseStyles} from './course-compass.mjs';
import {conceptCSS,conceptHostRuntime} from './concept-content.mjs';
import {assistantJS,assistantCSS} from './assistant-bundle.mjs';

/** Additional implementations stay within teacher scene IDs; originals keep their IDs and data. */
export function buildCaseVariants({reportDir=REPORT}={}) {
  const atlas=courseAtlas(), records=[];
  for(const entry of VARIANTS) {
    const source=entry.source, manifest=JSON.parse(read(source+'/case.json'));
    if(manifest.id!==entry.caseId||manifest.sceneId!==entry.sceneId)throw Error('Variant identity mismatch: '+source);
    if(atlas.index.byScene[entry.sceneId]?.stageId!==entry.stageId)throw Error('Variant is outside the original taxonomy: '+entry.caseId);
    for(const part of ['background','workflow','demo'])if(!manifest.tabs?.[part])throw Error('Missing '+part+': '+entry.caseId);
    for(const m of manifest.methods??[])if(!atlas.methods[m])throw Error('Unknown method '+m);
    for(const file of ['engine.js','concept.js','app.js'])new vm.Script(read(source+'/'+file),{filename:source+'/'+file});
    if(/<script\b|\bon\w+\s*=|javascript\s*:/i.test(JSON.stringify(manifest)))throw Error('Executable manifest HTML '+entry.caseId);
    const lessonContext=courseContext(entry.sceneId,manifest,{mode:'standalone'});
    const portalContext=courseContext(entry.sceneId,manifest,{mode:'portal'});
    const built=structuredClone(manifest);
    const last=built.tabs.background.sections.at(-1);
    last.html=(last.html??last.body??'')+portalContext.html;
    Object.assign(built.tabs.demo,{mode:'page',html:'demo/index.html',js:'demo/demo.js'});
    const standalone=structuredClone(manifest);
    standalone.tabs.background.sections.at(-1).html=(standalone.tabs.background.sections.at(-1).html??'')+lessonContext.html;
    const js='window.VariantManifest='+JSON.stringify(standalone).replace(/</g,'\\u003c')+';\nwindow.S17Page='+JSON.stringify({sceneId:entry.sceneId,caseId:entry.caseId,caseVersion:manifest.version,portalHref:'../../../../portal/index.html',referenceHref:'../../../../portal/reference/fluorescence.html'})+';\n'+read(source+'/engine.js')+'\n;\n'+read(source+'/concept.js')+'\n;\n'+conceptHostRuntime()+'\n'+read(source+'/app.js')+'\n;\n'+lessonContext.runtime+'\n'+assistantJS();
    new vm.Script(js,{filename:entry.caseId+'/demo/demo.js'});
    const out='dist/expansion-cases/'+entry.caseId;
    const html=read(source+'/demo.html');
    if(/type\s*=\s*["']module/i.test(html)||/<(?:script|link|img|source)\b[^>]+(?:src|href)=["']https?:/i.test(html))throw Error('Variant must be ordinary offline HTML '+entry.caseId);
    const files={'case.json':JSON.stringify(built,null,2),'README.txt':read(source+'/README.txt'),'demo/index.html':html,'demo/demo.css':read(source+'/demo.css')+'\n'+conceptCSS()+'\n'+courseStyles()+'\n'+assistantCSS({readability:false})+'\n'+read('shared/variant-reading-entry.css'),'demo/demo.js':js};
    for(const [p,contents] of Object.entries(files))write(out+'/'+p,contents);
    const output=PACKAGE_FILES.map(p=>record(out+'/'+p));
    const bytes=output.reduce((n,f)=>n+f.bytes,0);if(bytes>6*1024*1024)throw Error('Original import limit exceeded '+entry.caseId);
    records.push({...entry,version:manifest.version,title:manifest.title,output:out,bytes,files:output});
  }
  write(reportDir+'/variants-build.json',{createdAt:new Date().toISOString(),sourceOnlyBuild:true,cases:records});
  console.log(JSON.stringify({additionalCases:records.length,files:records.length*5,allWithinOriginalSceneIDs:true}));
  return records;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)buildCaseVariants();
