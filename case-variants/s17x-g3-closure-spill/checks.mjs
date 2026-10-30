import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url)), checks = [], context = vm.createContext({});
const record = (name, fn) => { try { const evidence = fn(); checks.push({ name, passed: true, evidence: evidence ?? null }); } catch (error) { checks.push({ name, passed: false, error: error.stack }); } };
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}, tolerance ${tolerance}`);
for (const name of ['engine.js', 'concept.js', 'app.js']) record('syntax:' + name, () => { new vm.Script(fs.readFileSync(path.join(dir, name), 'utf8'), { filename: name }); });
for (const name of ['engine.js', 'concept.js']) vm.runInContext(fs.readFileSync(path.join(dir, name), 'utf8'), context, { filename: name });
const E = context.VariantEngine, C = context.S17Concepts['s17x-g3-closure-spill'];
const grid = (w, h, values, cellSize_m = 50) => ({ w, h, cellSize_m, depths: values });

// Independent oracle: enumerate observed depth levels, then ordinary threshold BFS.
// It has no heap, minimax recurrence, localApex, or engine connectivity calls.
function thresholdOracle(g, start) {
  const levels = [...new Set(g.depths)].sort((a, b) => a - b);
  for (const level of levels) {
    if (g.depths[start] > level) continue;
    const queue = [start], seen = new Set(queue);
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k], x = i % g.w, y = Math.floor(i / g.w);
      if (x === 0 || x === g.w - 1 || y === 0 || y === g.h - 1) return level;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy, j = yy * g.w + xx;
        if ((dx || dy) && xx >= 0 && xx < g.w && yy >= 0 && yy < g.h && !seen.has(j) && g.depths[j] <= level) { seen.add(j); queue.push(j); }
      }
    }
  }
  throw Error('No threshold reaches an open boundary');
}
record('manual 3×3: area, height and geometric volume', () => {
  const g = grid(3, 3, [3, 3, 3, 3, 1, 3, 3, 3, 3]), a = E.analyzeGrid(g, { candidateX: 1, candidateY: 1 });
  near(a.prediction.spillDepth_m, 3); near(a.prediction.closureHeight_m, 2); near(a.prediction.area_m2, 2500); near(a.prediction.volume_m3, 5000); assert.equal(a.prediction.count, 1); assert.equal(a.prediction.touchesBoundary, false);
  return { spill_m: a.prediction.spillDepth_m, area_m2: a.prediction.area_m2, volume_m3: a.prediction.volume_m3 };
});
record('manual north gate: independent threshold oracle and section baseline', () => {
  const values = Array(25).fill(20); values[12] = 0; values[7] = 3; values[2] = 2;
  const g = grid(5, 5, values), a = E.analyzeGrid(g, { candidateX: 2, candidateY: 2 }), ns = E.sectionBaseline(g, a.prediction.apex, 'ns');
  near(a.prediction.spillDepth_m, thresholdOracle(g, 12)); near(a.prediction.spillDepth_m, 3); near(a.baseline.spillDepth_m, 20); near(ns.spillDepth_m, 3); near(a.prediction.volume_m3, 7500);
  return { model_m: 3, ew_m: a.baseline.spillDepth_m, ns_m: ns.spillDepth_m };
});
record('plateau and open boundary keep zero closure', () => {
  for (const values of [Array(25).fill(5), Array.from({ length: 25 }, (_, i) => Math.floor(i / 5) + i % 5 / 10)]) {
    const a = E.analyzeGrid(grid(5, 5, values), { candidateX: 2, candidateY: 2 });
    near(a.prediction.spillDepth_m, thresholdOracle(a.grid, a.prediction.apex.index)); near(a.prediction.closureHeight_m, 0); near(a.prediction.area_m2, 0); near(a.prediction.volume_m3, 0);
  }
});
record('independent oracle: 120 seeded small grids and arbitrary starts', () => {
  let seed = 17; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let t = 0; t < 120; t++) {
    const w = 5 + t % 4, h = 5 + (t >> 1) % 4, g = grid(w, h, Array.from({ length: w * h }, () => Math.floor(random() * 30)));
    const start = Math.floor(random() * w * h), a = E.minimax(g, { index: start }); near(a.spillDepth_m, thresholdOracle(g, start));
  }
  return { grids: 120, connectivity: '8-neighbor', oracle: 'enumerated threshold BFS' };
});
record('noiseless side gate and closed dome have independently expected depths', () => {
  const side = E.run({ noise: 0 }), closed = E.run({ scenario: 'closed', noise: 0 });
  near(side.prediction.apex.depth_m, 1000); near(side.prediction.spillDepth_m, 1034); near(closed.prediction.spillDepth_m, 1000 + 76 * (1 - Math.exp(-4))); near(side.baseline.spillDepth_m, closed.prediction.spillDepth_m); assert.equal(side.baseline.touchesBoundary, true);
  for (const r of [side, closed]) { near(r.evaluation.model.spillAbsoluteError_m, 0); near(r.evaluation.model.maskIoU, 1); near(r.evaluation.model.volumeRelativeError, 0); near(r.prediction.area_m2, r.prediction.count * 2500); }
  return { side: side.prediction.spillDepth_m, closed: closed.prediction.spillDepth_m, sideVolume_m3: side.prediction.volume_m3 };
});
record('axis changes baseline, keeps observation and 2D prediction fixed', () => {
  const ew = E.run({ noise: 0, axis: 'ew' }), ns = E.run({ noise: 0, axis: 'ns' });
  assert.equal(JSON.stringify(ew.observations), JSON.stringify(ns.observations)); assert.equal(JSON.stringify(ew.prediction), JSON.stringify(ns.prediction)); near(ns.baseline.spillDepth_m, 1034); assert.ok(ew.baseline.spillDepth_m > ns.baseline.spillDepth_m + 40);
});
record('50/100/200 m sampling: exact sample reproduction and shared coordinate noise', () => {
  const counts = [2009, 525, 143], all = E.generate({ sampleStep: 1 }).observations;
  for (const [k, step] of [1, 2, 4].entries()) {
    const o = E.generate({ sampleStep: step }).observations, g = E.reconstruct(o); assert.equal(o.samples.length, counts[k]);
    for (const s of o.samples) { near(g.depths[s.y * o.w + s.x], s.depth_m); near(s.depth_m, all.samples[s.y * o.w + s.x].depth_m); }
  }
  return { samples: counts, reconstructedCells: 2009 };
});
record('inference reads only observations; poisoned truth is never accessed', () => {
  const pair = E.generate({ sampleStep: 4, noise: 3 }), o = pair.observations;
  Object.defineProperty(o, 'evaluationTruth', { get() { throw Error('truth leaked into inference'); } });
  const a = E.infer(o, E.defaults), b = E.infer(JSON.parse(JSON.stringify(o)), E.defaults); assert.equal(JSON.stringify(a), JSON.stringify(b));
  pair.evaluationTruth.depths.fill(-999); const again = E.infer(o, E.defaults); assert.equal(JSON.stringify(a), JSON.stringify(again));
});
record('open slope: zero reference, empty IoU=1, relative volume error=NA', () => {
  const r = E.run({ scenario: 'open', noise: 0 }); near(r.prediction.volume_m3, 0); near(r.prediction.area_m2, 0); assert.equal(r.evaluation.model.referenceEmpty, true); assert.equal(r.evaluation.model.volumeRelativeError, null); near(r.evaluation.model.maskIoU, 1); near(r.fill.retained_m3, 0); near(r.fill.excess_m3, 0);
  return r.evaluation.model;
});
record('fill volume conservation, monotone contact, cap and excess', () => {
  const r = E.run({ noise: 0 }); let previous = -Infinity;
  for (const fraction of [0, .1, .65, 1, 1.5]) {
    const q = E.fillAt(r.grid, r.prediction, fraction); near(q.input_m3, q.retained_m3 + q.excess_m3, 1e-6); near(q.retained_m3, Math.min(fraction, 1) * r.prediction.volume_m3, 1e-6); near(q.volume_m3, q.retained_m3, .01); assert.ok(q.contactDepth_m >= previous); assert.ok(q.contactDepth_m <= r.prediction.spillDepth_m + 1e-8); previous = q.contactDepth_m;
    if (fraction === 0) { assert.equal(q.count, 0); near(q.volume_m3, 0); }
  }
});
record('noise and coarse sampling produce finite actual metrics, preserve denominators', () => {
  const runs = []; for (const scenario of ['closed', 'side', 'open']) for (const sampleStep of [1, 2, 4]) for (const noise of [0, 6]) {
    const r = E.run({ scenario, sampleStep, noise, tilt: -15 });
    for (const m of [r.evaluation.model, r.evaluation.baseline]) { assert.equal(m.evaluatedCells, 2009); assert.ok(Number.isFinite(m.spillAbsoluteError_m)); assert.ok(m.maskIoU >= 0 && m.maskIoU <= 1); assert.ok(m.volumeRelativeError === null || Number.isFinite(m.volumeRelativeError)); }
    near(r.prediction.spillDepth_m, thresholdOracle(r.grid, r.prediction.apex.index)); runs.push({ scenario, sampleStep, noise, modelSpillError_m: r.evaluation.model.spillAbsoluteError_m });
  }
  return { runs: runs.length, extrema: [Math.min(...runs.map(r => r.modelSpillError_m)), Math.max(...runs.map(r => r.modelSpillError_m))] };
});
function host(part, fields) {
  const controls = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value, disabled: true }]));
  const elements = { '[data-v-graphic]': { innerHTML: '' }, '[data-ct-result]': { textContent: '' }, '[data-v-note]': { textContent: '' } };
  return { dataset: { conceptPart: part }, events: {}, controls, elements,
    querySelector: s => s.startsWith('[data-v-key=') ? controls[s.match(/"([^"]+)"/)[1]] : elements[s], querySelectorAll: () => Object.values(controls), addEventListener(type, fn) { this.events[type] = fn; },
    action(value) { this.events.click({ target: { closest: () => ({ dataset: { vAction: value } }) } }); } };
}
record('concept mount: real graph/state changes, threshold boundary, reset and actual observation read', () => {
  const bg = host('background', { saddle: 34, fill: 65 }), wf = host('workflow', { progress: 75 }); C.mount({ querySelectorAll: () => [bg, wf] });
  assert.ok(Object.values(bg.controls).every(c => !c.disabled)); const initial = bg.dataset.ctState, graphic = bg.elements['[data-v-graphic]'].innerHTML;
  bg.controls.saddle.value = 20; bg.events.input({}); assert.notEqual(bg.dataset.ctState, initial); assert.notEqual(bg.elements['[data-v-graphic]'].innerHTML, graphic); near(JSON.parse(bg.dataset.ctState).spillDepth_m, 1020); bg.action('reset'); assert.equal(bg.dataset.ctState, initial);
  const wfInitial = wf.dataset.ctState; assert.equal(JSON.parse(wfInitial).touchesBoundary, false); wf.controls.progress.value = 100; wf.events.input({}); assert.equal(JSON.parse(wf.dataset.ctState).touchesBoundary, true); wf.action('reset'); assert.equal(wf.dataset.ctState, wfInitial);
  const live = E.run({ noise: 4, sampleStep: 4, saddle: 50 }); context.CaseInspect = { snapshot: () => ({ status: 'ready' }), evidence: () => live }; wf.action('read'); const read = JSON.parse(wf.dataset.ctState); assert.equal(read.source, '已读入当前示范采样'); near(read.observedChecksum, E.reconstruct(live.observations).depths.reduce((a, b) => a + b, 0)); assert.notEqual(wf.dataset.ctState, wfInitial); wf.action('reset'); assert.equal(wf.dataset.ctState, wfInitial);
  return { sourceRuntime: 'Node VM / minimal event host; not a browser acceptance', backgroundChanges: true, workflowChanges: true, reset: true, observedRead: true };
});
record('manifest and static default visuals are original-scene compatible', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'case.json'), 'utf8')); assert.equal(m.id, 's17x-g3-closure-spill'); assert.equal(m.sceneId, 'g3'); assert.equal(m.version, '1.0.0'); assert.equal(m.tabs.background.sections.length, 3); assert.equal(m.tabs.workflow.steps.length, 5); assert.equal(m.tabs.workflow.metrics.title.length > 0, true);
  for (const html of [C.backgroundHTML, C.workflowHTML]) { assert.match(html, /<svg/); assert.match(html, /viewBox="0 0 760 435"/); assert.match(html, /min-width:760px/); assert.match(html, /font:16px/); assert.match(html, /input disabled/); assert.match(html, /data-concept-scene="s17x-g3-closure-spill"/); assert.doesNotMatch(html, /NaN|undefined|Infinity/); }
  const demo = fs.readFileSync(path.join(dir, 'demo.html'), 'utf8'); assert.deepEqual([...demo.matchAll(/(?:src|href)="([^"]+)"/g)].map(a => a[1]), ['demo.css', 'demo.js']);
});
const result = { caseId: 's17x-g3-closure-spill', type: 'source_and_numerical_checks', browserAcceptanceClaimed: false, passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length, checks };
fs.writeFileSync(path.join(dir, 'checks-results.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2)); if (result.failed) process.exitCode = 1;
