import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const dir = path.dirname(fileURLToPath(import.meta.url)), checks = [];
function check(name, fn) { try { const details = fn(); checks.push({name, passed: true, details: details ?? null}); } catch (e) { checks.push({name, passed: false, error: e.message}); } }
const context = {}; vm.createContext(context);
for (const file of ['engine.js', 'concept.js', 'app.js']) check('syntax: ' + file, () => { new vm.Script(fs.readFileSync(path.join(dir, file), 'utf8'), {filename: file}); });
for (const file of ['engine.js', 'concept.js']) vm.runInContext(fs.readFileSync(path.join(dir, file), 'utf8'), context, {filename: file});
const E = context.VariantEngine, data = E.generate(), result = E.run();
check('independent calibration/test groups and observation schema', () => {
  assert.equal(data.calibration.runs.length, 6); assert.equal(data.observations.length, 12); assert.equal(new Set(data.observations.map(x => x.id)).size, 12);
  data.observations.forEach(o => { assert(!('leak' in o)); assert(!('truth' in o)); assert.equal(o.pulses.length, 4); o.points.forEach(p => assert(!('leak' in p))); });
  return {calibrationRuns: 6, testEpisodes: 12, pulsesPerEpisode: 4};
});
check('exact unit balance and zero-intercept compliance fit', () => {
  const C = .72, beta = .72, q = .006;
  const pulses = [.1, .2, .3, .4].map(v => ({injectedVolume: v, pressureIncrement: v / C}));
  const c = E.fitCompliance(pulses); assert(Math.abs(c.value - C) < 1e-12);
  const points = Array.from({length: 21}, (_, i) => { const time = i / 2, temperature = 40 - .1 * time; return {time, temperature, pressure: 10 + beta * (temperature - 40) - q / C * time, valveClosed: true}; });
  const prediction = E.infer({id: 'exact', pulses, points}, {beta, betaSD: 0}, {start: 0, end: 10, limit: .01});
  assert(Math.abs(prediction.estimate - q) < 1e-12); assert(Math.abs(prediction.baseline - (q + C * beta * .1)) < 1e-12);
  return {CeffLPerMPa: c.value, correctedLeakLPerMin: prediction.estimate, rawBaselineLPerMin: prediction.baseline};
});
check('inference cannot read hidden leak truth', () => {
  const obs = JSON.parse(JSON.stringify(data.observations[0])); Object.defineProperty(obs, 'truth', {get() { throw new Error('truth read'); }}); Object.defineProperty(obs, 'leak', {get() { throw new Error('hidden leak read'); }});
  const before = JSON.stringify(E.infer(obs, data.calibration, E.defaults)); data.evaluationTruth.forEach(t => t.curve.forEach(p => p.leak = 99));
  assert.equal(before, JSON.stringify(E.infer(obs, data.calibration, E.defaults))); return 'throwing accessors unread; evaluation truth perturbation leaves inference unchanged';
});
check('invalid windows, missing T and valve events are rejected', () => {
  const beforeClosed = E.run({start: 0}), reversed = E.run({start: 30, end: 10}), few = E.run({start: 29, end: 30}), valve = E.run({scenario: 'valve'}), missing = E.run({scenario: 'missing'});
  [beforeClosed, reversed, few, valve, missing].forEach(r => { assert.equal(r.inference.valid, false); assert.equal(r.inference.estimate, null); assert.equal(r.inference.status, '证据不足'); });
  assert.equal(reversed.evaluation.heldout.confusion.unknown.invalid, 12);
  assert.equal(E.run({scenario: 'valve', start: 22, end: 36}).inference.valid, true);
  return {beforeClosed: beforeClosed.inference.reasons, reversed: reversed.inference.reasons, few: few.inference.reasons, valve: valve.inference.reasons, missing: missing.inference.reasons};
});
check('negative estimates, review and denominator are preserved', () => {
  const m = result.evaluation.heldout; assert.equal(m.total, 12); assert.equal(m.valid, 10); assert.equal(m.invalid, 2); assert.equal(m.accepted + m.review + m.invalid, 12); assert.equal(m.maeN, m.valid);
  assert(m.rows.some(x => x.estimate < 0)); assert(m.review > 0); assert.equal(Object.values(m.confusion).flatMap(Object.values).reduce((a, b) => a + b), 12);
  return m;
});
check('determinism and broad finite-value parameter scan', () => {
  assert.equal(JSON.stringify(result), JSON.stringify(E.run())); let n = 0;
  for (const scenario of ['cool', 'warm', 'valve', 'missing']) for (const drift of [-3, 0, 3]) for (const volume of [600, 1200, 2400]) for (const [start, end] of [[0, 32], [8, 32], [22, 40], [30, 10]]) {
    const r = E.run({scenario, drift, volume, start, end}); function walk(x) { if (typeof x === 'number') assert(Number.isFinite(x)); else if (x && typeof x === 'object') Object.values(x).forEach(walk); } walk(r); n++;
  }
  return {combinations: n};
});
check('static manifest, identifiers, disabled controls and chart labels', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'case.json'), 'utf8')); assert.equal(m.id, E.id); assert.equal(m.sceneId, 'co3'); assert.equal(m.version, '1.0.0');
  for (const part of ['background', 'workflow']) { const html = context.S17Concepts[E.id][part + 'HTML']; assert(html.includes('<svg')); assert(html.includes('font-size="16"')); assert(html.includes('data-concept-scene="' + E.id + '"')); for (const tag of html.match(/<(?:input|select|button)\b[^>]*>/g)) assert(tag.includes('disabled')); assert(m.tabs[part].html.includes(html)); }
  const html = fs.readFileSync(path.join(dir, 'demo.html'), 'utf8'); assert.deepEqual([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]), ['demo.css', 'demo.js']);
  return {staticSVG: (m.tabs.background.html + m.tabs.workflow.html).match(/<svg/g).length};
});
const report = {caseId: E.id, scope: 'source and numerical checks; browser acceptance not run', passed: checks.filter(x => x.passed).length, failed: checks.filter(x => !x.passed).length, checks};
fs.writeFileSync(path.join(dir, 'verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({caseId: E.id, passed: report.passed, failed: report.failed, failures: checks.filter(x => !x.passed)})); if (report.failed) process.exitCode = 1;
