import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

// This is a source and numerical review. It does not operate a browser.
const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const plan = JSON.parse(read('handoff/full-coverage-2026-10-24/implementation-plan.json'));
const atlasContext = vm.createContext({window: {}, localStorage: {getItem: () => null, setItem() {}}});
vm.runInContext(read('portal-original/assets/data.js'), atlasContext);
const atlas = atlasContext.window.ATLAS;
const sourceNames = ['case.json', 'engine.js', 'app.js', 'demo.html', 'demo.css', 'README.txt'];
const strip = html => String(html || '').replace(/<svg\b[\s\S]*?<\/svg>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
function defaultControls(html) {
  const params = {};
  for (const m of html.matchAll(/<input\b[^>]*>/gi)) {
    const attrs = Object.fromEntries([...m[0].matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(x => [x[1], x[2]]));
    if (attrs.id && attrs.value != null) params[attrs.id] = ['number', 'range'].includes(attrs.type) ? Number(attrs.value) : attrs.value;
  }
  for (const m of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
    const id = m[1].match(/\bid\s*=\s*["']([^"']+)/i)?.[1];
    const opts = [...m[2].matchAll(/<option\b([^>]*)>([^<]*)/gi)];
    const opt = opts.find(x => /\bselected\b/.test(x[1])) || opts[0];
    if (id && opt) params[id] = opt[1].match(/\bvalue\s*=\s*["']([^"']*)/)?.[1] ?? opt[2];
  }
  return params;
}
function nonfinite(value, prefix = '', out = [], seen = new Set()) {
  if (typeof value === 'number' && !Number.isFinite(value)) out.push(prefix);
  if (!value || typeof value !== 'object' || seen.has(value)) return out;
  seen.add(value);
  for (const [key, val] of Object.entries(value)) nonfinite(val, prefix ? prefix + '.' + key : key, out, seen);
  return out;
}
function compactResult(value) {
  const out = {};
  for (const [key, val] of Object.entries(value || {})) {
    if (/metric|protocol|split|count|dataNature|dataSource|method|closure/i.test(key) || (/^(model|baseline|raw)$/.test(key) && val && typeof val === 'object' && ['mae','rmse','f1','accuracy','hit','snr'].some(k => k in val))) out[key] = val;
  }
  return out;
}
const records = [];
for (const item of plan.cases) {
  const source = 'expansion-src/' + item.sceneId;
  const record = {sceneId: item.sceneId, stageId: item.stageId, source, checks: [], findings: [], files: []};
  const check = (name, passed, detail) => record.checks.push({name, passed: !!passed, ...(detail == null ? {} : {detail})});
  const missing = sourceNames.filter(name => !fs.existsSync(path.join(root, source, name)));
  check('complete_source_set', !missing.length, missing);
  if (missing.length) {record.status = 'awaiting_source_files'; records.push(record); continue;}
  try {
    const meta = JSON.parse(read(source + '/case.json'));
    const engine = read(source + '/engine.js'), app = read(source + '/app.js');
    const html = read(source + '/demo.html'), css = read(source + '/demo.css');
    record.caseId = meta.id;
    record.title = meta.title;
    record.files = sourceNames.map(name => ({name, sha256: sha(read(source + '/' + name))}));
    const scene = atlas.index.byScene[item.sceneId];
    check('teacher_scene_and_stage', meta.sceneId === item.sceneId && scene?.stageId === item.stageId);
    check('teacher_method_keys', Array.isArray(meta.methods) && meta.methods.length && meta.methods.every(m => atlas.methods[m]));
    check('three_sections', ['background', 'workflow', 'demo'].every(k => meta.tabs?.[k]));
    const sections = meta.tabs?.background?.sections || [];
    record.background = sections.map(s => ({title: s.title, proseCharacters: strip(s.html || s.body).length, diagrams: ((s.html || s.body || '').match(/<(?:svg|img|canvas)\b/g) || []).length}));
    check('explained_background', sections.length >= 3 && record.background.slice(0, 3).every(s => s.proseCharacters >= 60) && record.background.reduce((n, s) => n + s.proseCharacters, 0) >= 300);
    check('background_diagrams', record.background.reduce((n, s) => n + s.diagrams, 0) >= 2);
    check('workflow_explains_actions_effects_and_traps', (meta.tabs?.workflow?.steps || []).length >= 3 && meta.tabs.workflow.steps.every(s => s.name && s.do && s.effect && s.trap));
    const teachingCopy = strip(JSON.stringify(meta) + html);
    check('data_nature_stated', /教学|合成|公开|实测|现场数据/.test(teachingCopy));
    check('no_remote_runtime_script', !/<script\b[^>]*src\s*=\s*["'](?:https?:|\/\/)/i.test(html));
    check('no_remote_default_computation', !/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/.test(engine + app));
    check('no_css_remote_import', !/@import|url\(\s*["']?(?:https?:|\/\/)/i.test(css));
    check('has_runtime_visualization_code', /<svg|createElementNS|canvas|getContext|<circle|<path/.test(app));
    check('has_user_compute_action', /addEventListener\(['"](?:click|input|change)|oninput|onclick/.test(app));
    new vm.Script(engine, {filename: source + '/engine.js'});
    new vm.Script(app, {filename: source + '/app.js'});
    check('javascript_syntax', true);
    const ctx = vm.createContext({console: {log() {}, warn() {}}, Math, Date, JSON, setTimeout() {}, clearTimeout() {}});
    ctx.window = ctx;
    vm.runInContext(engine, ctx, {timeout: 30000, filename: source + '/engine.js'});
    const coreName = Object.keys(ctx).find(k => /Core$/.test(k) && typeof ctx[k]?.run === 'function') || Object.keys(ctx).find(k => typeof ctx[k]?.run === 'function');
    record.engineGlobal = coreName;
    if (coreName) {
      const contractPath = source + '/engine-contract.json';
      const contract = fs.existsSync(path.join(root, contractPath)) ? JSON.parse(read(contractPath)) : null;
      ctx.__reviewParams = {...(contract?.defaults || contract?.defaultParams || {}), ...defaultControls(html)};
      record.defaultControlParams = ctx.__reviewParams;
      vm.runInContext('__reviewResult = ' + coreName + '.run(__reviewParams)', ctx, {timeout: 30000});
      const bad = nonfinite(ctx.__reviewResult);
      check('default_engine_run_returns_object', ctx.__reviewResult && typeof ctx.__reviewResult === 'object');
      check('default_engine_numbers_finite', !bad.length, bad.slice(0, 30));
      record.numericalSummary = compactResult(ctx.__reviewResult);
    } else record.findings.push({severity: 'manual_review', message: 'No uniform run entry; calculation requires case-specific adapter, not treated as a failed model.'});
    record.truthIsolation = {status: 'requires_manual_predict_entry_review', candidates: [...engine.matchAll(/function\s+(predict\w*|infer\w*)\s*\(([^)]*)\)/g)].map(x => ({name: x[1], parameters: x[2]}))};
    record.status = record.checks.every(c => c.passed) ? 'source_and_default_computation_reviewed' : 'needs_review';
  } catch (e) {record.status = 'review_error'; record.findings.push({severity: 'error', message: e.stack || String(e)});}
  records.push(record);
}
const duplicateIds = records.map(r => r.caseId).filter((x, i, a) => x && a.indexOf(x) !== i);
const output = {createdAt: new Date().toISOString(), evidenceType: 'independent_source_and_vm_computation_review_not_browser', scope: {plannedNew: plan.cases.length, completeSource: records.filter(r => r.status !== 'awaiting_source_files').length, missingSource: records.filter(r => r.status === 'awaiting_source_files').length}, duplicateIds, checksPassed: records.flatMap(r => r.checks).filter(c => c.passed).length, checksFailed: records.flatMap(r => r.checks).filter(c => !c.passed).length, limitations: ['No browser is operated by this script.', 'Concept accuracy and truth isolation need a case-specific reading of the engine and displayed explanations.', 'Default numerical execution uses control values from demo.html, not an assumption that every API supports run().'], records};
const out = path.join(root, 'handoff/teaching-audit-2026-10-24/calculation-review.json');
fs.writeFileSync(out, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({report: out, ...output.scope, checksPassed: output.checksPassed, checksFailed: output.checksFailed, duplicateIds, attention: records.filter(r => r.status === 'needs_review' || r.status === 'review_error').map(r => ({sceneId: r.sceneId, failed: r.checks.filter(c => !c.passed), findings: r.findings}))}, null, 2));
if (process.argv.includes('--require-complete') && (output.scope.missingSource || output.checksFailed || duplicateIds.length)) process.exitCode = 1;
