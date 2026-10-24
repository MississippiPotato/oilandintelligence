import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { assistantJS, assistantCSS } from './assistant-bundle.mjs';
import { flowOverview, flowRuntime } from './case-flowcharts.mjs';

export const root = path.resolve(import.meta.dirname, '..');
export const reportDir = 'handoff/expansion-2026-10-24';
export const targets = [
  ['g1', 'geology'], ['s1', 'seismic'], ['d1', 'drilling'],
  ['w4', 'welllog'], ['c1', 'cementing'], ['co1', 'completion'],
  ['p1', 'perforation'], ['pr1', 'production'], ['wo1', 'workover'],
  ['e1', 'eor'], ['t1', 'transport'], ['r5', 'refining']
].map(([sceneId, stageId]) => ({ sceneId, stageId }));
export const sourceNames = ['case.json', 'engine.js', 'app.js', 'demo.html', 'demo.css', 'README.txt'];
export const packageNames = ['case.json', 'README.txt', 'demo/index.html', 'demo/demo.css', 'demo/demo.js'];
export const contractNames = ['case-upload.js', 'case-demo-host.js', 'registry.js', 'admin.js'];
export const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
export function fileRecord(p) {
  const b = fs.readFileSync(path.join(root, p));
  return { path: p.replaceAll('\\', '/'), bytes: b.length, sha256: sha(b) };
}
export function walk(p) {
  if (!fs.existsSync(path.join(root, p))) return [];
  return fs.readdirSync(path.join(root, p), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walk(p + '/' + e.name) : [p + '/' + e.name]).sort();
}
export function teacherAtlas() {
  const context = vm.createContext({ window: {}, localStorage: { getItem: () => null, setItem: () => {} } });
  vm.runInContext(read('portal-original/assets/data.js'), context, { filename: 'original-data.js' });
  return context.window.ATLAS;
}

export function inspectSource(target, atlas = teacherAtlas()) {
  const source = 'expansion-src/' + target.sceneId;
  const missing = sourceNames.filter(p => !fs.existsSync(path.join(root, source, p)));
  if (missing.length) return { ...target, source, status: 'missing', missing };
  const errors = [], warnings = [];
  let manifest;
  try { manifest = JSON.parse(read(source + '/case.json')); }
  catch (e) { return { ...target, source, status: 'invalid', errors: ['case.json: ' + e.message] }; }
  const p = manifest, scene = atlas.index.byScene[target.sceneId];
  if (!/^s17x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id || '')) errors.push('id must be unique s17x- kebab-case');
  if (p.sceneId !== target.sceneId) errors.push('sceneId differs from assigned scene');
  if (!scene || scene.stageId !== target.stageId) errors.push('scene/stage does not match teacher taxonomy');
  if (!p.title || typeof p.title !== 'string') errors.push('title required');
  if (!p.version || !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(p.version)) errors.push('semantic version required');
  if (/<script\b/i.test(JSON.stringify(p))) errors.push('case.json must not contain script tags');
  if (!Array.isArray(p.methods) || !p.methods.length || p.methods.some(k => !atlas.methods[k])) errors.push('methods must use teacher method keys');
  const background = p.tabs?.background, workflow = p.tabs?.workflow, demo = p.tabs?.demo;
  if (!background || !Array.isArray(background.sections) || background.sections.length < 3) errors.push('background requires at least three explained sections');
  if (!workflow || !Array.isArray(workflow.steps) || workflow.steps.length < 3) errors.push('workflow requires at least three steps');
  if (!demo) errors.push('demo tab required');
  if (background?.sections?.some(s => !s.title || !(s.html || s.body))) errors.push('background section title/content required');
  if (workflow?.steps?.some(s => !s.name || !s.do || !s.effect || !s.trap)) errors.push('every workflow step needs name/do/effect/trap');
  const backgroundHTML = (background?.sections || []).map(s => s.html || s.body || '').join('');
  const workflowHTML = workflow?.metrics?.html || '';
  if ((backgroundHTML.match(/<svg\b/gi) || []).length < 2) errors.push('background needs at least two inline concept diagrams');
  if ((workflowHTML.match(/<svg\b/gi) || []).length < (workflow?.steps?.length || 0)) warnings.push('manually check every workflow step has its own diagram');
  if (/<script\b|\bon[a-z]+\s*=|javascript\s*:/i.test(backgroundHTML + workflowHTML)) errors.push('manifest HTML must not contain executable scripts or handlers');
  if (/<(?:img|image|iframe)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:|\/\/)/i.test(backgroundHTML + workflowHTML)) errors.push('manifest diagrams must be bundled, not remote images');
  for (const name of ['engine.js', 'app.js']) {
    const code = read(source + '/' + name);
    try { new vm.Script(code, { filename: source + '/' + name }); } catch (e) { errors.push(name + ': ' + e.message); }
    if (/^\s*(?:import\s|export\s)/m.test(code)) errors.push(name + ' must be ordinary script, not module');
    if (/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/.test(code)) errors.push(name + ' default computation must be offline');
    if (/\b(?:parent|top)\s*\.\s*(?:localStorage|document|CaseImport|Cases|S17Assistant)\b/.test(code)) errors.push(name + ' must not depend on parent private APIs');
  }
  const html = read(source + '/demo.html'), css = read(source + '/demo.css');
  if (!/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(html)) errors.push('viewport meta required');
  if (/type\s*=\s*["']module["']/i.test(html)) errors.push('demo HTML cannot use module script');
  // Citation anchors are ordinary optional navigation; only auto-loaded resources must be bundled.
  const refs = Array.from(html.matchAll(/<(?:script|link|img|image|iframe|source|video|audio|use)\b[^>]*>/gi))
    .flatMap(tag => Array.from(tag[0].matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi), m => m[1]));
  for (const ref of refs) if (!/^(?:#|data:)/i.test(ref) && !['demo.js', 'demo.css'].includes(ref)) errors.push('demo HTML has unbundled reference: ' + ref);
  if (!refs.includes('demo.js') || !refs.includes('demo.css')) errors.push('demo.html must link demo.js and demo.css');
  for (const match of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    if (!/^(?:data:|#)/i.test(match[2])) errors.push('CSS resource URLs must be embedded data URLs');
  }
  if (/@import\b/i.test(css)) errors.push('CSS imports must be bundled into demo.css');
  return { ...target, source, status: errors.length ? 'invalid' : 'source_valid', manifest, sceneName: scene?.name, stageName: scene?.stageName, errors, warnings,
    sourceFiles: sourceNames.map(n => fileRecord(source + '/' + n)) };
}

function preserveBaseline() {
  const target = reportDir + '/contract-before.json';
  if (fs.existsSync(path.join(root, target))) return;
  const files = [
    ...walk('portal-original'), ...walk('石油勘探开发智能化案例集'),
    ...contractNames.map(n => 'portal/assets/core/' + n), ...walk('case-src')
  ];
  fs.writeFileSync(path.join(root, target), JSON.stringify({ createdAt: new Date().toISOString(),
    meaning: 'Pre-expansion original teacher copies, four import contract files, and original five-case source bytes. Optional assistant bundle is built from shared current source.',
    files: files.map(fileRecord) }, null, 2));
}

export function pluginSource(records) {
  const payload = records.map(r => ({ sceneId: r.sceneId, stageId: r.stageId, stageName: r.stageName,
    sceneName: r.sceneName, manifest: r.manifest, bytes: r.bytes }));
  return `/* Generated by node tools/build-expansion.mjs. Actual complete packages only. */
(function (g) {
  'use strict';
  var packages = ${JSON.stringify(payload)};
  var catalog = [];
  packages.forEach(function (entry) {
    var p = entry.manifest, frame = null;
    var page = '../dist/expansion-cases/' + p.id + '/demo/index.html';
    var tabs = { background: p.tabs.background, workflow: p.tabs.workflow, demo: {
      label: p.tabs.demo.label || '可运行示范', intro: p.tabs.demo.intro || '', mode: 'bundled-page',
      mount: function (root) {
        if (frame) frame.remove();
        frame = document.createElement('iframe');
        frame.setAttribute('title', p.title + ' · 交互演示');
        frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups allow-downloads');
        frame.setAttribute('loading', 'eager');
        frame.setAttribute('referrerpolicy', 'no-referrer');
        frame.src = page;
        frame.style.cssText = 'display:block;width:100%;border:0;border-radius:16px;background:#f6f8fa;min-height:' + Math.max(620, Math.min(2600, Number(p.tabs.demo.height) || 1100)) + 'px';
        root.replaceChildren(frame);
      },
      unmount: function () { if (frame) { frame.remove(); frame = null; } }
    } };
    var c = { id: p.id, sceneId: p.sceneId, title: p.title, methods: p.methods.slice(), version: p.version,
      updated: p.updated, status: 'ready', imported: false, builtIn: true, expansion: true, tabs: tabs };
    if (g.Cases) g.Cases.register(c);
    catalog.push({ sceneId: p.sceneId, id: p.id, name: entry.sceneName, title: p.title,
      version: p.version, stageId: entry.stageId, stageName: entry.stageName, methods: p.methods.slice(),
      summary: p.tabs.background.lede || '', directory: 'expansion-cases',
      href: '#/scene/' + p.sceneId + '?case=' + encodeURIComponent(p.id) + '&tab=bg',
      standaloneHref: page, builtIn: true, imported: false, bytes: entry.bytes });
  });
  g.S17Expansion = { cases: catalog, builtCount: catalog.length, expectedCount: 12,
    registration: 'builtin-plugin', browserAcceptance: 'see handoff/expansion-2026-10-24',
    byScene: function (id) { return catalog.filter(function (c) { return c.sceneId === id; })[0] || null; },
    href: function (id, tab) { var c = this.byScene(id); return c ? '#/scene/' + c.sceneId + '?case=' + encodeURIComponent(c.id) + '&tab=' + (tab || 'bg') : null; } };
})(window);
`;
}

export function buildExpansions({ requireAll = false } = {}) {
  fs.mkdirSync(path.join(root, reportDir), { recursive: true });
  preserveBaseline();
  const atlas = teacherAtlas(), scan = targets.map(t => inspectSource(t, atlas)), records = [], ids = new Set();
  const jsAssistant = assistantJS(), cssAssistant = assistantCSS({ readability: false });
  const assistantSources = ['portal/assets/s17-assistant.js', 'portal/assets/s17-assistant.css', 'portal/assets/s17-media.js',
    'portal/assets/s17-volcengine.js', 'tools/assistant-bundle.mjs'].map(fileRecord);
  for (const item of scan) {
    if (item.status !== 'source_valid') continue;
    const p = item.manifest;
    if (ids.has(p.id)) { item.status = 'invalid'; item.errors.push('duplicate package id'); continue; }
    ids.add(p.id);
    const out = 'dist/expansion-cases/' + p.id;
    fs.mkdirSync(path.join(root, out, 'demo'), { recursive: true });
    const config = 'window.S17Page=' + JSON.stringify({ sceneId: p.sceneId, caseId: p.id, name: item.sceneName,
      title: p.title, summary: p.tabs.background.lede || '', directory: 'expansion-cases',
      caseVersion: p.version, portalHref: '../../../../portal/index.html',
      referenceHref: '../../../../portal/reference/fluorescence.html' }) + ';\n';
    const builtManifest = JSON.parse(JSON.stringify(p));
    Object.assign(builtManifest.tabs.demo, { mode: 'page', html: 'demo/index.html', js: 'demo/demo.js' });
    const chart = flowOverview(p.sceneId);
    builtManifest.tabs.workflow.metrics.html = chart + builtManifest.tabs.workflow.metrics.html;
    const chartMount = '\n' + flowRuntime + '\n(function(){function startFlow(){var area=document.getElementById("workflow");if(area&&!area.querySelector(".case-flow-overview"))area.insertAdjacentHTML("afterbegin",'+JSON.stringify(chart)+');S17Flow.mount(area||document);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startFlow,{once:true});else startFlow();})();\n';
    const files = {
      'case.json': JSON.stringify(builtManifest, null, 2) + '\n',
      'README.txt': read(item.source + '/README.txt'),
      'demo/index.html': read(item.source + '/demo.html'),
      'demo/demo.css': read(item.source + '/demo.css') + '\n' + cssAssistant,
      'demo/demo.js': config + read(item.source + '/engine.js') + '\n;\n' + read(item.source + '/app.js') + chartMount + '\n' + jsAssistant
    };
    new vm.Script(files['demo/demo.js'], { filename: out + '/demo/demo.js' });
    for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(root, out, name), content);
    const outputs = packageNames.map(n => ({ ...fileRecord(out + '/' + n), relative: n }));
    const bytes = outputs.reduce((sum, f) => sum + f.bytes, 0);
    if (bytes > 6 * 1024 * 1024) throw new Error(p.id + ' exceeds original 6 MiB folder limit');
    item.status = 'built_unverified';
    records.push({ ...item, manifest: builtManifest, output: out, caseId: p.id, version: p.version, bytes, files: outputs });
  }
  const plugin = 'portal/assets/s17-expansion-cases.js';
  fs.writeFileSync(path.join(root, plugin), pluginSource(records));
  const lock = { schemaVersion: 1, createdAt: new Date().toISOString(), expectedCount: targets.length,
    actualCount: records.length, complete: records.length === targets.length, totalBytes: records.reduce((sum, r) => sum + r.bytes, 0),
    browserVerifiedByThisBuild: false, assistantReadabilityIncluded: false, assistantSources,
    cases: records.map(({ manifest, ...record }) => record),
    missing: scan.filter(s => s.status === 'missing'), invalid: scan.filter(s => s.status === 'invalid'), plugin: fileRecord(plugin) };
  fs.writeFileSync(path.join(root, reportDir, 'build-lock.json'), JSON.stringify(lock, null, 2) + '\n');
  const coverage = targets.map(t => {
    const row = scan.find(s => s.sceneId === t.sceneId), c = records.find(r => r.sceneId === t.sceneId), sc = atlas.index.byScene[t.sceneId];
    return { ...t, stageName: sc.stageName, sceneName: sc.name, status: row.status, caseId: c?.caseId || row.manifest?.id || null,
      version: c?.version || null, bytes: c?.bytes || null, source: row.source, output: c?.output || null,
      sourceErrors: row.errors || [], missing: row.missing || [], browserAcceptance: 'not_recorded_by_build' };
  });
  fs.writeFileSync(path.join(root, reportDir, 'coverage.json'), JSON.stringify({ updatedAt: lock.createdAt,
    scope: '其他12阶段各1例，原录井5例保持独立，其他44个候选场景未在本轮实现', expectedCount: 12,
    actualBuiltCount: records.length, browserAcceptanceCount: null, cases: coverage }, null, 2) + '\n');
  const md = ['# 十二阶段扩展覆盖', '', '范围：保留原录井五例，其他十二阶段各完成一例。本表由真实存在且源码齐全的成品构建生成；构建数量不代表浏览器验收数量。', '',
    '| 阶段 | 场景 | 案例 ID | 版本 | 成品字节 | 状态 |', '| --- | --- | --- | --- | ---: | --- |',
    ...coverage.map(c => `| ${c.stageName} | ${c.sceneId} · ${c.sceneName} | ${c.caseId || '—'} | ${c.version || '—'} | ${c.bytes ?? '—'} | ${c.status} |`), '',
    `实际齐全并构建：${records.length}/12；累计 ${lock.totalBytes} 字节。`, '',
    '每例上传目录只有 case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js 五个文件。源码、来源清单及检查脚本留在开发目录。', '',
    '构建不访问网络，不调用模型服务。默认计算、图形和基础助手可离线运行；可选在线对话需用户在当前页面配置。', '',
    '未由构建验收：原站真实文件夹导入、沙箱执行、刷新、关闭重开、离线交互、窄屏与实际下载。这些只能引用后续真实浏览器记录。', '',
    '增强门户通过原 Cases.register 契约内置注册，不写 localStorage。原站重复 ID 检查仍有效；若要在增强站手动导入同名内置案例，先通过原案例库功能隐藏该插件。未修改的老师原站没有这些内置 ID。', ''];
  fs.writeFileSync(path.join(root, reportDir, 'coverage.md'), md.join('\n'));
  const failed = lock.invalid.length > 0 || (requireAll && !lock.complete);
  return { lock, failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { lock, failed } = buildExpansions({ requireAll: process.argv.includes('--require-all') });
  console.log(JSON.stringify({ expected: lock.expectedCount, built: lock.actualCount, bytes: lock.totalBytes,
    missing: lock.missing.map(c => c.sceneId), invalid: lock.invalid.map(c => ({ sceneId: c.sceneId, errors: c.errors })),
    plugin: lock.plugin.path, browserVerifiedByThisBuild: false }, null, 2));
  if (failed) process.exitCode = 1;
}
