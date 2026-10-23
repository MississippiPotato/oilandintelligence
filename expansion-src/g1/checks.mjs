import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
require('./engine.js');
const C = globalThis.G1Core, checks = [];
function check(name, fn) { fn(); checks.push({ name, passed: true }); }
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
check('手算混淆矩阵、拒判、宏F1和IoU分母', () => {
  const m = C.evaluate([0, 1, 1, 4], { labels: [0, 0, 1, 1] });
  assert.deepEqual(m.matrix[0], [1, 1, 0, 0, 0]);
  assert.deepEqual(m.matrix[1], [0, 1, 0, 0, 1]);
  near(m.macroF1, (2 / 3 + .5) / 2); near(m.meanIoU, (.5 + 1 / 3) / 2); near(m.coverage, .75); near(m.acceptedError, 1 / 3);
});
check('没有适用类别时显示空指标', () => {
  const m = C.evaluate([], { labels: [] }); assert.equal(m.macroF1, null); assert.equal(m.meanIoU, null); assert.equal(m.coverage, null);
});
check('真实近邻及其训练来源', () => {
  const m = C.fit([{ x: [0], label: 0, groupId: 'a', pixel: 1 }, { x: [10], label: 1, groupId: 'b', pixel: 2 }]);
  const n = C.nearest(m, [.1], 1); assert.equal(n[0].groupId, 'a'); assert.equal(C.vote(n).label, 0);
});
let r;
check('独立图幅划分且标准化仅拟合训练样本', () => {
  r = C.run(); const t = r.training;
  const ids = [...t.training.groupIds, ...t.validation.groupIds, r.observations.groupId]; assert.equal(new Set(ids).size, ids.length);
  near(t.model.mu[0], t.model.samples.reduce((s, row) => s + row.x[0], 0) / t.model.samples.length);
  assert.equal(t.training.pixels, 576); assert.equal(r.metrics.model.total, 3456); assert.equal(r.metrics.baseline.total, 3456);
});
check('评价真值变化不改变推理，但会改变评价', () => {
  const obs = r.observations;
  Object.defineProperty(obs, 'evaluationTruth', { get() { throw Error('forbidden truth read'); } });
  const a = C.infer(obs, r.training.model, { featureMode: 'full', k: r.training.k, support: .5 });
  const flipped = { labels: r.evaluationTruth.labels.map(x => (x + 1) % 4) };
  const b = C.infer(obs, r.training.model, { featureMode: 'full', k: r.training.k, support: .5 });
  assert.deepEqual(a.labels, b.labels); assert.notEqual(C.evaluate(a.labels, flipped).macroF1, r.metrics.model.macroF1);
});
check('同种子复现及真实输入干扰', () => {
  const a = C.run(), b = C.run({ noise: .16, shadow: .7 });
  assert.deepEqual(a.prediction.labels, r.prediction.labels);
  assert.notDeepEqual(a.observations.bands, b.observations.bands); assert.notDeepEqual(a.prediction.labels, b.prediction.labels);
  assert.notEqual(a.metrics.model.macroF1, b.metrics.model.macroF1);
});
check('红光消融真实减少特征，未更换分组', () => {
  const t = C.train('red'); assert.equal(t.model.mu.length, 1); assert.deepEqual(t.training.groupIds, r.training.training.groupIds); assert.deepEqual(t.validation.groupIds, r.training.validation.groupIds);
});
check('三图背景、五步图册和教师入口字段齐备', () => {
  const m = JSON.parse(readFileSync(new URL('./case.json', import.meta.url), 'utf8'));
  assert.equal(m.sceneId, 'g1'); assert.equal(m.tabs.background.sections.length, 3); assert.equal(m.tabs.workflow.steps.length, 5);
  assert.equal((m.tabs.background.sections.map(s => s.html).join('').match(/<svg\b/g) || []).length, 3);
  assert.equal((m.tabs.workflow.metrics.html.match(/<svg\b/g) || []).length, 5);
  assert.equal(m.tabs.demo.html, 'demo/index.html');
});
const failure = C.run({ noise: .16, shadow: .7, cover: .28 });
const report = { sceneId: 'g1', caseId: 's17x-g1-remote-lithology', checkType: 'Node calculation and source contract checks; not browser acceptance', checkedAt: new Date().toISOString(), passed: checks.length, failed: 0, checks, defaultMetrics: r.metrics, failureMetrics: failure.metrics, browser: 'not_executed_by_case_author' };
writeFileSync(new URL('./check-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ sceneId: 'g1', passed: checks.length, failed: 0, macroF1: r.metrics.model.macroF1, baselineMacroF1: r.metrics.baseline.macroF1, failureMacroF1: failure.metrics.model.macroF1 }));
