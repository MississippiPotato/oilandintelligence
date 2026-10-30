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
check('fixed whole-batch splits and point counts', () => {
  assert.equal(data.training.length, 12); assert.equal(data.validation.length, 4); assert.equal(data.observations.length, 8);
  const ids = [...data.training.map(x => x.observation.id), ...data.validation.map(x => x.observation.id), ...data.observations.map(x => x.id)];
  assert.equal(new Set(ids).size, 24); assert.equal(data.training.flatMap(x => x.samples).length, 108); assert.equal(data.evaluationTruth.flatMap(x => x.samples).length, 72);
  data.observations.forEach(o => { assert(!('strength' in o)); assert(!('samples' in o)); o.points.forEach(p => assert(!('strength' in p))); });
  return {train: 12, validation: 4, test: 8, testStrengthPoints: 72};
});
check('Arrhenius reference and constant-temperature integration', () => {
  assert(Math.abs(E.rate(50, 30) - 1) < 1e-12);
  const points = Array.from({length: 21}, (_, i) => ({time: i / 2, temperature: 70}));
  const ages = E.equivalentAge(points, 30); assert(Math.abs(ages.at(-1).equivalentAge - 10 * E.rate(70, 30)) < 1e-10);
  assert(E.rate(25, 30) < 1 && E.rate(80, 30) > 1);
  return {rate50: E.rate(50, 30), rate25: E.rate(25, 30), rate80: E.rate(80, 30)};
});
check('all Ea candidate fits are monotone; grid selected only by validation', () => {
  for (const energy of [20, 25, 30, 35, 40, 45, 50]) { const m = E.fitForEnergy(data.training, energy); for (let i = 1; i < m.curve.length; i++) assert(m.curve[i].y >= m.curve[i - 1].y); }
  const chosen = E.fit(data.training, data.validation); assert.equal(chosen.energy, result.model.energy);
  const ranked = chosen.validation.slice().sort((a, b) => b.n - a.n || a.mae - b.mae || a.energy - b.energy); assert.equal(chosen.energy, ranked[0].energy);
  return chosen.validation;
});
check('inference does not read strength truth', () => {
  const obs = JSON.parse(JSON.stringify(data.observations[0]));
  Object.defineProperty(obs, 'truth', {get() { throw new Error('truth read'); }});
  Object.defineProperty(obs, 'strength', {get() { throw new Error('strength truth read'); }});
  const before = JSON.stringify(E.infer(obs, E.model, {target: 10}));
  data.evaluationTruth.forEach(t => t.curve.forEach(p => p.strength = 999));
  const after = JSON.stringify(E.infer(obs, E.model, {target: 10})); assert.equal(before, after);
  return 'throwing truth accessors were never read; altered evaluation truth leaves prediction unchanged';
});
check('unsupported temperature and unreachable target stay unknown/null', () => {
  const outside = E.run({temperature: 95}), high = E.run({target: 30});
  assert.equal(outside.inference.supported, false); assert.equal(outside.inference.time, null); assert(outside.inference.curve.every(p => p.strength === null));
  assert.equal(high.inference.time, null); assert.equal(high.evaluation.heldout.model.referenceNotAttained, 8); assert.equal(high.evaluation.heldout.model.pairedTimeN, 0); assert.equal(high.evaluation.heldout.model.timeMAE, null);
  return {outside: outside.inference.status, highTarget: high.inference.status, highTargetScores: high.evaluation.heldout.model};
});
check('fixed-seed determinism and paired denominators', () => {
  assert.equal(JSON.stringify(result), JSON.stringify(E.run())); const m = result.evaluation.heldout;
  assert.equal(m.model.strengthTotal, 72); assert.equal(m.model.strengthN, 72); assert.equal(m.baseline.strengthN, 72); assert.equal(m.model.totalBatches, 8);
  return {model: m.model, baseline: m.baseline};
});
check('parameter scan keeps JSON numbers finite and valid monotone curves', () => {
  let n = 0;
  for (const temperature of [25, 40, 50, 80, 95]) for (const program of ['constant', 'ramp', 'cool', 'delayed']) for (const target of [1, 10, 23, 30]) {
    const r = E.run({temperature, program, target});
    function walk(x) { if (typeof x === 'number') assert(Number.isFinite(x)); else if (x && typeof x === 'object') Object.values(x).forEach(walk); } walk(r);
    let previous = -1; r.inference.curve.forEach(p => { if (p.strength !== null) { assert(p.strength >= previous - 1e-10); previous = p.strength; } }); n++;
  }
  return {combinations: n};
});
check('static manifest, identifiers, initial disabled widgets and chart labels', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'case.json'), 'utf8')); assert.equal(m.id, E.id); assert.equal(m.sceneId, 'c1'); assert.equal(m.version, '1.0.0');
  for (const part of ['background', 'workflow']) { const html = context.S17Concepts[E.id][part + 'HTML']; assert(html.includes('<svg')); assert(html.includes('font-size="16"')); assert(html.includes('data-concept-scene="' + E.id + '"')); for (const tag of html.match(/<(?:input|select|button)\b[^>]*>/g)) assert(tag.includes('disabled')); assert(m.tabs[part].html.includes(html)); }
  const html = fs.readFileSync(path.join(dir, 'demo.html'), 'utf8'); assert.deepEqual([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]), ['demo.css', 'demo.js']);
  return {staticSVG: (m.tabs.background.html + m.tabs.workflow.html).match(/<svg/g).length};
});
const report = {caseId: E.id, scope: 'source and numerical checks; browser acceptance not run', passed: checks.filter(x => x.passed).length, failed: checks.filter(x => !x.passed).length, checks};
fs.writeFileSync(path.join(dir, 'verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({caseId: E.id, passed: report.passed, failed: report.failed, failures: checks.filter(x => !x.passed)})); if (report.failed) process.exitCode = 1;
