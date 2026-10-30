import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { CONFIG, PHASES, createTransport, sampleRoute } from './transport.js';

const directory = dirname(fileURLToPath(import.meta.url)), root = resolve(directory, '../..');
const engine = await readFile(resolve(root, 'case-src/m2/engine.js'), 'utf8');
const scope = {}; vm.createContext(scope); vm.runInContext(engine, scope);
const core = scope.M2Core, normal = createTransport(core, 'normal'), pause = createTransport(core, 'pause');
const checks = [];
function test(name, fn) { fn(); checks.push({ name, passed: true }); }
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('continuous flow: arrival600, source120, lag480, end795', () => {
  assert.equal(normal.arrivalTime_s, 600); assert.equal(normal.sourceReplay_s, 120); assert.equal(normal.endTime_s, 795);
  assert.equal(normal.at(500).lag_s, 480); close(normal.sourceVolume_m3, 3); close(normal.sourceDepthMD_m, 1200.72);
});
test('pump stop300..480: arrival780, lag660, end975', () => {
  assert.equal(pause.arrivalTime_s, 780); assert.equal(pause.sourceReplay_s, 120); assert.equal(pause.endTime_s, 975);
  assert.equal(pause.at(500).lag_s, 660); assert.equal(pause.arrivalTime_s - normal.arrivalTime_s, 180);
});
test('during pump stop: elapsed time changes, volume/progress/depth remain constant', () => {
  const a = pause.at(300), b = pause.at(450);
  assert.notEqual(a.time_s, b.time_s); assert.equal(a.flow_m3_s, 0); assert.equal(b.flow_m3_s, 0);
  assert.equal(a.cumulativeVolume_m3, b.cumulativeVolume_m3); assert.equal(a.transportProgress, b.transportProgress);
  close(a.cumulativeVolume_m3, 7.5); close(a.transportedVolume_m3, 4.5); close(a.transportProgress, .375);
  assert.equal(a.currentDepthMD_m, b.currentDepthMD_m); assert.equal(a.materialStopped, true); assert.equal(b.materialStopped, true);
});
test('left-interval integration: recovery at480 changes Q; advance follows afterward', () => {
  const a = pause.at(480), b = pause.at(490);
  assert.equal(a.flow_m3_s, .025); close(a.transportProgress, .375);
  close(b.transportedVolume_m3 - a.transportedVolume_m3, .25); assert.ok(b.transportProgress > a.transportProgress);
});
test('normal and stopped scenarios differ at the same absolute clock', () => {
  close(normal.at(600).transportProgress, 1); close(pause.at(600).transportProgress, .625);
  assert.equal(normal.at(600).phase, 'sieve'); assert.equal(pause.at(600).phase, 'annulus');
});
test('five stages and post-detection record semantics follow explicit boundaries', () => {
  assert.deepEqual([normal.at(90), normal.at(400), normal.at(620), normal.at(680), normal.at(760)].map(v => v.phase), PHASES.map(p => p.id));
  assert.equal(sampleRoute(normal.at(680)).kind, 'material'); assert.equal(sampleRoute(normal.at(760)).kind, 'record');
  assert.equal(normal.at(645).phase, 'observe'); assert.equal(normal.at(735).phase, 'record'); assert.equal(normal.at(795).complete, true);
});
test('all continuous half-second states stay finite and conserve the12m3 transport domain', () => {
  for (const model of [normal, pause]) for (let t = 0; t <= model.endTime_s; t += .5) {
    const v = model.at(t); for (const key of ['time_s', 'cumulativeVolume_m3', 'transportedVolume_m3', 'transportProgress', 'phaseProgress']) assert.ok(Number.isFinite(v[key]));
    assert.ok(v.transportProgress >= 0 && v.transportProgress <= 1); close(v.transportedVolume_m3 + v.remainingVolume_m3, CONFIG.effectiveVolume_m3);
  }
});
test('original M2Core negative evidence and earliest-plateau inversion are preserved', () => {
  assert.equal(core.sourceAt(pause.rows, 100, 12), null);
  const arrival = core.arrivalAt(pause.rows, 340, 12); assert.equal(core.sourceAt(pause.rows, arrival, 12), 300);
});

const report = { createdAt: new Date().toISOString(), passed: checks.length, failed: 0, checks,
  engineSHA256: createHash('sha256').update(engine).digest('hex'),
  transportSHA256: createHash('sha256').update(await readFile(resolve(directory, 'transport.js'))).digest('hex'),
  normal: { arrivalTime_s: normal.arrivalTime_s, sourceReplay_s: normal.sourceReplay_s, state300: normal.at(300) },
  pause: { arrivalTime_s: pause.arrivalTime_s, sourceReplay_s: pause.sourceReplay_s, state300: pause.at(300), state450: pause.at(450), state600: pause.at(600) },
  browserAcceptanceClaimed: false };
await writeFile(resolve(directory, 'numerical-checks.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ passed: report.passed, failed: 0, normalArrival_s: normal.arrivalTime_s, stoppedArrival_s: pause.arrivalTime_s, browserAcceptanceClaimed: false }));
