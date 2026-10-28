import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { root, reportDir, targets, packageNames, fileRecord, walk, teacherAtlas, inspectSource } from '../tools/build-expansion.mjs';
import { assistantCSS, assistantJS } from '../tools/assistant-bundle.mjs';

const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const lockPath = reportDir + '/build-lock.json';
if (!fs.existsSync(path.join(root, lockPath))) throw new Error('Run node tools/build-expansion.mjs first');
const lock = JSON.parse(read(lockPath)), baseline = JSON.parse(read(reportDir + '/contract-before.json'));
const results = [], check = (name, action) => { try { const detail = action(); results.push({ name, passed: true, detail }); }
  catch (e) { results.push({ name, passed: false, error: e.message }); } };

check('protected teacher originals and public observation bytes preserved during teaching revisions', () => {
  for (const before of baseline.files) assert.deepEqual(fileRecord(before.path), before);
  return { files: baseline.files.length, browserEvidence: false };
});
check('build count equals actual complete packages, no planned case registered', () => {
  const scan = targets.map(t => inspectSource(t));
  assert.equal(lock.invalid.length, 0, JSON.stringify(lock.invalid.map(c => ({ sceneId: c.sceneId, errors: c.errors }))));
  assert.equal(lock.actualCount, lock.cases.length);
  assert.equal(lock.actualCount, scan.filter(s => s.status === 'source_valid').length);
  assert.equal(new Set(lock.cases.map(c => c.sceneId)).size, lock.actualCount);
  assert.equal(new Set(lock.cases.map(c => c.caseId)).size, lock.actualCount);
  assert.equal(lock.expectedCount, targets.length);
  if (process.argv.includes('--require-all')) assert.equal(lock.actualCount, targets.length);
  return { actual: lock.actualCount, missing: lock.missing.map(c => c.sceneId), invalid: lock.invalid.map(c => c.sceneId) };
});
check('each built folder has exactly five required runtime files with locked bytes', () => {
  for (const c of lock.cases) {
    assert.deepEqual(walk(c.output).map(f => f.slice(c.output.length + 1)).sort(), packageNames.slice().sort());
    for (const f of c.files) { const { relative, ...before } = f; assert.deepEqual(fileRecord(f.path), before); }
    for (const f of c.sourceFiles) assert.deepEqual(fileRecord(f.path), f);
    assert.ok(c.bytes <= 6 * 1024 * 1024);
    const p = JSON.parse(read(c.output + '/case.json'));
    assert.equal(p.id, c.caseId); assert.equal(p.sceneId, c.sceneId);
    assert.equal(p.tabs.demo.mode, 'page'); assert.equal(p.tabs.demo.html, 'demo/index.html');
    new vm.Script(read(c.output + '/demo/demo.js'), { filename: c.caseId });
  }
  return { files: lock.cases.length * 5, cumulativeBytes: lock.totalBytes, singleFolderLimit: 6 * 1024 * 1024 };
});
check('assistant included from current shared source, per-page context remains case-specific', () => {
  assert.equal(lock.assistantReadabilityIncluded, false);
  assert.equal(assistantCSS(), '\n' + read('shared/readability.css') + '\n' + read('shared/mudlogging-study.css') + '\n' + read('portal/assets/s17-assistant.css'), 'mandatory-case CSS includes current reading styles');
  assert.equal(assistantCSS({ readability: false }), '\n' + read('portal/assets/s17-assistant.css'));
  for (const f of lock.assistantSources) assert.deepEqual(fileRecord(f.path), f);
  for (const c of lock.cases) {
    const script = read(c.output + '/demo/demo.js'), css = read(c.output + '/demo/demo.css');
    const match = script.match(/^window\.S17Page=(.+);\n/);
    assert.ok(match, 'missing page context');
    const context = JSON.parse(match[1]);
    assert.equal(context.sceneId, c.sceneId); assert.equal(context.caseId, c.caseId); assert.equal(context.caseVersion, c.version);
    assert.equal(context.portalHref, '../../../../portal/index.html');
    assert.equal(context.directory, 'expansion-cases'); assert.equal(typeof context.summary, 'string');
    for (const source of ['portal/assets/s17-assistant.js', 'portal/assets/s17-media.js', 'portal/assets/s17-volcengine.js']) assert.ok(script.includes(read(source)), 'stale assistant source: ' + source);
    assert.ok(script.endsWith(assistantJS()), 'stale assistant assembly or DOM readiness wrapper');
    assert.ok(css.includes(read('portal/assets/s17-assistant.css')));
    assert.equal(css, read(c.source + '/demo.css') + '\n' + assistantCSS({ readability: false }));
    assert.ok(!css.includes(read('shared/readability.css')), 'new cases must retain their own typography instead of legacy global overrides');
  }
  return { currentAssistant: true, contextCount: lock.actualCount, legacyReadabilityExcluded: true,
    mandatoryReadingStylesMatchCurrent: true, modelServiceCalled: false };
});
check('optional assistant can be inlined in head without accessing body before DOM readiness', () => {
  const events = [];
  const document = { readyState: 'loading',
    addEventListener(type, callback, options) { events.push({ type, callback, options }); },
    get body() { throw new Error('assistant accessed document.body before DOMContentLoaded'); } };
  const context = vm.createContext({ window: {}, document });
  new vm.Script(assistantJS(), { filename: 'current-shared-assistant-bundle.js' }).runInContext(context);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'DOMContentLoaded');
  assert.equal(typeof events[0].callback, 'function');
  assert.equal(events[0].options.once, true);
  return { loadingDocumentExecuted: true, bodyAccessBeforeDOMContentLoaded: false,
    executionKind: 'Node VM bootstrap check; post-event browser startup remains a browser check' };
});
check('plugin uses real teacher Cases.register and retains all background/workflow content', () => {
  assert.deepEqual(fileRecord(lock.plugin.path), lock.plugin);
  const window = { ATLAS: teacherAtlas() }, sandbox = { window, document: { createElement: () => ({ style: {}, attributes: {}, removed: false,
    setAttribute(k, v) { this.attributes[k] = v; }, remove() { this.removed = true; } }) } };
  vm.createContext(sandbox);
  vm.runInContext(read('portal-original/assets/core/registry.js'), sandbox);
  vm.runInContext(read(lock.plugin.path), sandbox);
  const catalog = window.S17Expansion;
  assert.equal(catalog.expectedCount, targets.length); assert.equal(catalog.builtCount, lock.actualCount);
  assert.equal(window.Cases.list().length, lock.actualCount);
  assert.deepEqual(JSON.parse(JSON.stringify(window.Cases.problems())), []);
  for (const row of lock.cases) {
    const c = window.Cases.get(row.caseId), p = JSON.parse(read(row.output + '/case.json'));
    assert.equal(c.imported, false); assert.equal(c.builtIn, true);
    assert.deepEqual(JSON.parse(JSON.stringify(c.tabs.background)), p.tabs.background);
    assert.deepEqual(JSON.parse(JSON.stringify(c.tabs.workflow)), p.tabs.workflow);
    const issues = window.Cases.validate(c).filter(r => r.level === 'error');
    assert.equal(issues.length, 0, JSON.stringify(issues));
    const container = { replaceChildren(frame) { this.child = frame; } };
    c.tabs.demo.mount(container, {});
    assert.equal(container.child.src, '../dist/expansion-cases/' + row.caseId + '/demo/index.html');
    assert.ok(container.child.attributes.sandbox.includes('allow-scripts'));
    assert.ok(container.child.attributes.sandbox.includes('allow-downloads'));
    assert.ok(!container.child.attributes.sandbox.includes('allow-same-origin'));
    c.tabs.demo.unmount(); assert.equal(container.child.removed, true);
    assert.equal(catalog.byScene(row.sceneId).id, row.caseId);
    assert.equal(catalog.byScene(row.sceneId).directory, 'expansion-cases');
    assert.equal(catalog.byScene(row.sceneId).summary, p.tabs.background.lede || '');
    assert.ok(catalog.href(row.sceneId, 'demo').endsWith('&tab=demo'));
  }
  return { cases: lock.actualCount, registryErrors: 0, iframeUsesOpaqueOrigin: true, executionKind: 'Node VM contract check; not a real browser' };
});
check('unmodified teacher manifest validator and page host can resolve and inline every package', () => {
  const window = { ATLAS: teacherAtlas(), localStorage: { getItem: () => null, setItem: () => {} } };
  const sandbox = { window, document: { addEventListener() {} } };
  vm.createContext(sandbox);
  for (const source of ['registry.js', 'case-demo-host.js', 'case-upload.js']) {
    vm.runInContext(read('portal-original/assets/core/' + source), sandbox);
  }
  const rows = [];
  for (const c of lock.cases) {
    const p = JSON.parse(read(c.output + '/case.json'));
    const validation = window.CaseImport.check(p, { id: p.id, sceneId: p.sceneId, title: p.title, methods: p.methods,
      version: p.version, updated: p.updated });
    assert.equal(validation.filter(v => v.level === 'error').length, 0, JSON.stringify(validation));
    const files = c.files.filter(f => f.relative !== 'case.json').map(f => ({ name: f.relative, size: f.bytes,
      enc: 'text', data: read(f.path), mime: f.relative.endsWith('.js') ? 'application/javascript' :
        f.relative.endsWith('.css') ? 'text/css' : f.relative.endsWith('.html') ? 'text/html' : 'text/plain' }));
    const pkg = { files, demo: p.tabs.demo };
    assert.equal(window.CaseDemoHost.resolveMode(pkg), 'page');
    const html = window.CaseDemoHost.buildPageDoc(pkg, 'source-contract-only');
    assert.ok(html.includes('<style data-src="demo.css">'));
    assert.ok(html.includes('<script data-src="demo.js">'));
    assert.ok(!/<script\b[^>]*\s+src\s*=/i.test(html), 'unresolved script reference');
    assert.ok(!/<link\b[^>]*\bhref\s*=\s*["']demo\.css["']/i.test(html), 'unresolved stylesheet reference');
    const scripts = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi), m => m[1]);
    assert.ok(scripts.length >= 2);
    scripts.forEach((code, i) => new vm.Script(code, { filename: c.caseId + '-teacher-inline-' + i }));
    rows.push({ caseId: c.caseId, manifestErrors: 0, resolvedMode: 'page', parsedInlineScripts: scripts.length });
  }
  return { packages: rows, executionKind: 'Unmodified teacher source evaluated in Node VM; browser rendering not executed',
    manifestCheckUsesPublicAPIWithoutLoadedFileState: true };
});

const report = { checkedAt: new Date().toISOString(), kind: 'source_and_build_contract_checks',
  browserExecuted: false, expectedCases: targets.length, actualBuiltCases: lock.actualCount,
  passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, results,
  notVerified: ['real browser original Add Case directory import', 'sandbox rendering and model interactions',
    'refresh and whole browser reopen persistence', 'offline default interactions', 'actual download', 'narrow screen and keyboard behavior',
    'scientific correctness and inference/evaluation separation require per-case engine checks and review'] };
if(!process.argv.includes('--no-write'))fs.writeFileSync(path.join(root, reportDir, 'source-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
