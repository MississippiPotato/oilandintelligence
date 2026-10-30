import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {FOUR} from './four-exhibit-contract.mjs';
import {caseFiles, loadFourContent} from './four-exhibit-content.mjs';
import {loadM2Content, m2ReadingRuntime} from './m2-exhibit-content.mjs';
import {flowRuntime} from './case-flowcharts.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const bytes = s => Buffer.byteLength(s);
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const nativeIds = new Set([...FOUR.map(c => c.id), 's17-mudgas-context']);
const termMap = {
  m1:['岩屑','岩性','颗粒','kNN'], m2:['气测','气峰','迟到','排量','泵量','kNN'],
  m3:['荧光','紫外','UV','曝光'], m4:['钻时','钻速','ROP','工况','分层'],
  m5:['报告','井段','交接','证据','信息抽取'], w1:['测井','分层','GR','自然伽马','变点'],
  g1:['遥感','多光谱','波段','像素'], s1:['地震','断层','剖面'],
  cv:['图像','视觉'], ts:['时序','曲线'], nlp:['文本','自然语言'], opt:['优化','约束'], kg:['知识图谱','规则']
};

function plain(html) {
  return String(html ?? '')
    .replace(/<(style|script|svg|canvas|table)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/data:[^\s"'<>]+/g, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|ensp|emsp);/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_,hex,dec) => String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10)))
    .replace(/\s+/g, ' ').trim();
}
function excerpt(html, length = 70) { return plain(html).slice(0, length); }
function terms(title, text, row) {
  const aliases = [...(termMap[row.sceneId] || []), ...(row.methods || []).flatMap(key => termMap[key] || [])];
  const english = (title + ' ' + text).match(/\b[A-Za-z][A-Za-z0-9.+-]{1,18}\b/g) || [];
  const chunks = title.split(/[\s：:，,、/｜|()（）·—]+/).filter(t => t.length >= 2 && t.length <= 12);
  return [...new Set([...chunks, ...aliases, ...english])].slice(0, 10);
}
function originalAtlas() {
  const context = vm.createContext({window:{}, localStorage:{getItem:()=>null, setItem:()=>{}}});
  vm.runInContext(read('portal-original/assets/data.js'), context, {filename:'original-data.js'});
  return context.window.ATLAS;
}
function runtimeFor(row) {
  const native = FOUR.find(c => c.id === row.id);
  if (native) return read('shared/concept-host.js') + '\n' + read('shared/scroll-exhibit.js') + '\n' +
    caseFiles(native).map(read).join('\n') + '\n' + read('shared/four-exhibits.js');
  if (row.id === 's17-mudgas-context') return m2ReadingRuntime();
  const variant = 'case-variants/' + row.id + '/concept.js';
  const concept = fs.existsSync(path.join(ROOT, variant)) ? variant : 'expansion-src/' + row.sceneId + '/concept.js';
  if (!row.primary && !fs.existsSync(path.join(ROOT, variant))) throw Error('Variant concept is missing: ' + variant);
  if (!fs.existsSync(path.join(ROOT, concept))) throw Error('Case concept is missing: ' + concept);
  const engine = 'case-variants/' + row.id + '/engine.js';
  if (!row.primary && !fs.existsSync(path.join(ROOT, engine))) throw Error('Variant engine is missing: ' + engine);
  // Variant concepts keep their own engine even after another implementation has loaded.
  const localConcept = row.primary ? read(concept) :
    '(function(caseScope){(function(window,globalThis){\n' + read(engine) + '\n' + read(concept) + '\n}).call(caseScope,caseScope,caseScope);})(Object.create(g));';
  return read('shared/concept-host.js') + '\n' + localConcept + '\n' +
    'if(!globalThis.S17Flow){' + flowRuntime + '\n}\n' +
    'if(!globalThis.ExpansionReading){' + read('shared/expansion-lessons.js') + '\n}';
}
function nativeReading(row, manifest) {
  const native = FOUR.find(c => c.id === row.id);
  if (native) {
    const content = loadFourContent(native, {mode:'portal', version:row.version});
    manifest.tabs.background = {...manifest.tabs.background, lede:content.lede, sections:content.sections};
    return {kind:'four', style:content.sections[0]?.html.match(/<style>[\s\S]*?<\/style>/)?.[0] || '',
      backgroundHTML:content.backgroundHTML, workflowHTML:content.workflowHTML};
  }
  if (row.id === 's17-mudgas-context') {
    const content = loadM2Content({mode:'portal', version:row.version});
    manifest.tabs.background = {...manifest.tabs.background, lede:content.lede, sections:content.sections};
    return {kind:'m2', style:content.sections[0]?.html.match(/<style>[\s\S]*?<\/style>/)?.[0] || '',
      chapterNav:content.chapterNav || '', workflowHTML:content.workflowHTML};
  }
  return null;
}
function caseSections(row, manifest) {
  const sections = (manifest.tabs.background?.sections || []).map((section, index) => {
    const title = plain(section.navTitle || section.title || '专业背景');
    const summary = excerpt(section.summary || section.html || section.body || '');
    return {id:row.id + ':bg:' + index, caseId:row.id, sceneId:row.sceneId, title, tab:'bg',
      terms:terms(title, summary, row), summary, anchor:'learn-' + row.id + '-bg-' + index};
  });
  if (manifest.tabs.workflow) {
    const workflow = manifest.tabs.workflow;
    const title = plain(workflow.title || '案例流程');
    const summary = excerpt([...(workflow.lead || []), ...(workflow.steps || []).map(step=>step.name)].join(' '));
    sections.push({id:row.id + ':flow', caseId:row.id, sceneId:row.sceneId, title, tab:'flow',
      terms:terms(title, summary, row), summary, anchor:'learn-' + row.id + '-flow'});
  }
  return sections;
}
function contentScript(row, manifest, reading) {
  const payload = {id:row.id, sceneId:row.sceneId, version:row.version,
    tabs:manifest.tabs, reading};
  return '/* Generated case body. Loaded only after this case is requested. */\n' +
    '(function(g){"use strict";var previous=g.S17Concepts;g.S17Concepts={};try{\n' + runtimeFor(row) +
    '\nvar conceptKey=g.S17Concepts[' + json(row.id) + ']?' + json(row.id) + ':' + json(row.sceneId) + ',found=g.S17Concepts[conceptKey];' +
    'if(found){(g.S17CaseConcepts||(g.S17CaseConcepts={}))[thisCaseId]=found;' +
    '(g.S17CaseConceptKeys||(g.S17CaseConceptKeys={}))[thisCaseId]=conceptKey;}\n' +
    'g.S17Concepts=previous||{};if(!g.S17CaseLoader)throw Error("Case loader is not ready");' +
    'g.S17CaseLoader.complete(' + json(payload) + ');' +
    '}catch(error){g.S17Concepts=previous||{};g.S17CaseLoader?.fail(thisCaseId,' + json(row.version) + ',error);throw error;}' +
    '}).call(null,globalThis);\n';
}
function teacherSample(atlas) {
  let definition;
  const context=vm.createContext({});context.window=context;
  context.Cases={register(value){definition=value;return value;}};
  vm.runInContext(read('portal/assets/core/kit.js'),context,{filename:'teacher-kit.js'});
  vm.runInContext(read('portal/assets/cases/welllog-layer.case.js'),context,{filename:'teacher-welllog.case.js'});
  if(definition?.id!=='welllog-layer'||definition.sceneId!=='w1')throw Error('Teacher sample identity changed');
  const scene=atlas.index.byScene[definition.sceneId];
  const row={id:definition.id,sceneId:definition.sceneId,title:definition.title,version:definition.version,
    updated:definition.updated,stageId:scene.stageId,stageName:scene.stageName,methods:definition.methods||scene.methods,
    summary:excerpt(definition.tabs.background.lede,80),directory:'teacher-sample',primary:false,teacherSample:true,demoMode:'module',
    href:'#/scene/w1?case=welllog-layer&tab=bg',standaloneHref:'../portal-original/index.html#/scene/w1?case=welllog-layer&tab=bg',
    contentURL:'assets/case-content/welllog-layer.'+definition.version+'.js'};
  const content='/* Enhanced-portal lazy wrapper. Original teacher sources remain unchanged. */\n'+
    '(function(g){"use strict";var definition=null,K=g.K,Cases={register:function(value){definition=value;return value;}};try{\n'+
    read('portal/assets/cases/welllog-layer.case.js')+'\n'+read('portal/assets/cases/welllog-layer.demo.js')+'\n'+
    'if(!definition||definition.id!=="welllog-layer")throw Error("Teacher sample did not declare its case");'+
    'g.S17CaseLoader.complete({id:definition.id,version:definition.version,tabs:definition.tabs,reading:null});'+
    '}catch(error){g.S17CaseLoader.fail("welllog-layer",'+json(definition.version)+',error);throw error;}})(window);\n';
  new vm.Script(content,{filename:row.contentURL});
  return {row,sections:caseSections(row,definition),output:{path:'portal/'+row.contentURL,content,caseId:row.id,teacherSample:true}};
}
function catalogScript(rows, sections, teacher) {
  return '/* Generated lightweight catalogue. No case HTML, engines, images or full text. */\n' +
    '(function(g){"use strict";var cases=' + json(rows) + ',sections=' + json(sections) + ';' +
    'var teacherCases='+json([teacher.row])+',teacherSections='+json(teacher.sections)+';'+
    'cases.forEach(function(c){c.sections=sections.filter(function(s){return s.caseId===c.id;});});' +
    'teacherCases.forEach(function(c){c.sections=teacherSections.filter(function(s){return s.caseId===c.id;});});'+
    'g.S17CaseCatalog={cases:cases,sections:sections,entries:cases,chapters:sections,teacherCases:teacherCases,teacherSections:teacherSections};' +
    'var extras=cases.filter(function(c){return c.directory==="expansion-cases";});' +
    'function bySceneAll(id){return extras.filter(function(c){return c.sceneId===id;}).sort(function(a,b){return Number(b.primary)-Number(a.primary);});}' +
    'function byCaseId(id){return extras.filter(function(c){return c.id===id;})[0]||null;}' +
    'function hrefByCaseId(id,tab){var c=byCaseId(id);if(!c)return null;tab=({background:"bg",workflow:"flow",lab:"demo"})[tab]||tab||"bg";' +
    'var saved=g.Cases&&g.Cases.get(c.id);if(saved&&saved.version!==c.version)return c.standaloneHref+"#"+({bg:"background",flow:"workflow",demo:"lab"}[tab]||"background");' +
    'return "#/scene/"+encodeURIComponent(c.sceneId)+"?case="+encodeURIComponent(c.id)+"&tab="+encodeURIComponent(tab);}' +
    'g.S17Expansion={cases:extras,builtCount:extras.length,expectedCount:extras.length,registration:"lazy-catalogue",bySceneAll:bySceneAll,byCaseId:byCaseId,' +
    'byScene:function(id){return bySceneAll(id)[0]||null;},hrefByCaseId:hrefByCaseId,href:function(scene,tab){var c=bySceneAll(scene)[0];return c?hrefByCaseId(c.id,tab):null;}};' +
    'if(g.S17CaseLoader)g.S17CaseLoader.registerCatalog();if(g.dispatchEvent&&g.Event)g.dispatchEvent(new g.Event("s17catalogready"));' +
    '})(window);\n';
}

/** Generate only enhanced-portal metadata and body shards; never rebuild case packages. */
export function buildLazyPortal({reportDir, expectedCount=65, write=true, onOutput}={}) {
  const atlas = originalAtlas(), rows = [], sections = [], outputs = [], ids = new Set();
  for (const directory of ['cases', 'expansion-cases']) {
    const base = path.join(ROOT, 'dist', directory);
    for (const folder of fs.readdirSync(base, {withFileTypes:true}).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) {
      const source = 'dist/' + directory + '/' + folder.name + '/case.json';
      if (!fs.existsSync(path.join(ROOT, source))) continue;
      const manifest = JSON.parse(read(source)), scene = atlas.index.byScene[manifest.sceneId];
      if (!scene) throw Error(source + ' has an unknown original sceneId');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.id) || !/^[\w.+-]+$/.test(manifest.version)) throw Error('Unsafe case id/version in ' + source);
      if (ids.has(manifest.id)) throw Error('Duplicate caseId: ' + manifest.id);
      ids.add(manifest.id);
      const primary = !fs.existsSync(path.join(ROOT, 'case-variants', manifest.id));
      const row = {id:manifest.id, sceneId:manifest.sceneId, title:manifest.title, version:manifest.version,
        stageId:scene.stageId, stageName:scene.stageName, methods:manifest.methods || scene.methods,
        summary:excerpt(manifest.tabs.background?.lede || scene.intro, 80), directory, primary,
        href:'#/scene/' + scene.id + '?case=' + encodeURIComponent(manifest.id) + '&tab=bg',
        standaloneHref:'../dist/' + directory + '/' + manifest.id + '/demo/index.html',
        contentURL:'assets/case-content/' + manifest.id + '.' + manifest.version + '.js'};
      const reading = nativeIds.has(row.id) ? nativeReading(row, manifest) : null;
      const searchable = caseSections(row, manifest);
      sections.push(...searchable); rows.push(row);
      let code = contentScript(row, manifest, reading);
      // The id lives inside this shard's private function, never as a shared global.
      code = code.replace('var previous=g.S17Concepts;', 'var thisCaseId=' + json(row.id) + ';var previous=g.S17Concepts;');
      new vm.Script(code, {filename:row.contentURL});
      outputs.push({path:'portal/' + row.contentURL, content:code, caseId:row.id});
    }
  }
  if (rows.length !== expectedCount) throw Error('Expected ' + expectedCount + ' case packages, found ' + rows.length);
  rows.sort((a,b)=>Number(b.primary)-Number(a.primary));
  const teacher=teacherSample(atlas);outputs.push(teacher.output);
  const catalogue = catalogScript(rows, sections, teacher);
  if (bytes(catalogue) > 256 * 1024) throw Error('Light catalogue exceeds256KiB: ' + bytes(catalogue));
  if (/<svg\b|data:image\//i.test(catalogue)) throw Error('Full case asset leaked into the light catalogue');
  new vm.Script(catalogue, {filename:'s17-case-catalog.js'});
  outputs.push({path:'portal/assets/s17-case-catalog.js', content:catalogue});
  if (onOutput) outputs.forEach(output=>onOutput(output));
  const summary = {builtAt:new Date().toISOString(),caseCount:rows.length,sceneCount:new Set(rows.map(c=>c.sceneId)).size,
    expansionCount:rows.filter(c=>c.directory==='expansion-cases').length,sectionCount:sections.length,
    teacherSampleCount:1,teacherSectionCount:teacher.sections.length,teacherBodyBytes:bytes(teacher.output.content),
    catalogueBytes:bytes(catalogue),bodyBytes:outputs.filter(x=>x.caseId&&!x.teacherSample).reduce((n,x)=>n+bytes(x.content),0),
    runtimeCasePackagesRebuilt:false,browserAcceptanceByBuild:false,
    files:outputs.map(o=>({path:o.path,bytes:bytes(o.content),sha256:sha(o.content),...(o.caseId?{caseId:o.caseId}:{}),...(o.teacherSample?{teacherSample:true}:{})}))};
  if (write) {
    fs.mkdirSync(path.join(ROOT,'portal/assets/case-content'),{recursive:true});
    for (const output of outputs) fs.writeFileSync(path.join(ROOT,output.path),output.content);
    if (reportDir) {fs.mkdirSync(path.resolve(ROOT,reportDir),{recursive:true});fs.writeFileSync(path.resolve(ROOT,reportDir,'lazy-portal-build.json'),JSON.stringify(summary,null,2)+'\n');}
  }
  return summary;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(buildLazyPortal({expectedCount:Number(process.argv.find(a=>a.startsWith('--expected='))?.split('=')[1] || 65),write:!process.argv.includes('--check-only')}),null,2));
}
