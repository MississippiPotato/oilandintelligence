import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
require('./engine.js');
const C = globalThis.S1Core, checks = [];
function check(name, fn) { fn(); checks.push({ name, passed: true }); }
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
check('局部波形相关系数手算', () => { near(C.correlation([1, 2, 3], [1, 2, 3]), 1); near(C.correlation([1, 2, 3], [3, 2, 1]), -1); near(C.correlation([0, 0], [0, 0]), 0); });
check('断层带F1/IoU与逐行一对一迹线F1', () => {
  const labels = Array(20).fill(0), pred = Array(20).fill(0); labels[3] = 1; labels[13] = 1; pred[3] = 1; pred[6] = 1;
  const m = C.evaluate({ labels: pred, line: [{ x: 3, y: 0 }, { x: 6, y: 1 }] }, { labels, line: [{ x: 3, y: 0 }, { x: 3, y: 1 }] }, { w: 10, analysisRows: [0, 2], traceSpacing_m: 25 });
  assert.equal(m.tp, 1); assert.equal(m.fp, 1); assert.equal(m.fn, 1); assert.equal(m.total, 8); near(m.iou, 1 / 3); near(m.f1, .5); near(m.lineF1, .5);
});
check('无参考且无预测时空分母为不适用', () => {
  const m = C.evaluate({ labels: Array(20).fill(0), line: [] }, { labels: Array(20).fill(0), line: [] }, { w: 10, analysisRows: [0, 2], traceSpacing_m: 25 });
  assert.equal(m.f1, null); assert.equal(m.iou, null); assert.equal(m.lineF1, null);
});
check('重复候选不能重复匹配同一参考点', () => {
  const m = C.evaluate({ labels: Array(20).fill(0), line: [{ x: 3, y: 0 }, { x: 4, y: 0 }] }, { labels: Array(20).fill(0), line: [{ x: 3, y: 0 }] }, { w: 10, analysisRows: [0, 2], traceSpacing_m: 25 });
  assert.equal(m.lineMatched, 1); near(m.lineF1, 2 / 3);
});
let r;
check('真实梯度下降及独立剖面分组', () => {
  r = C.run(); const t = r.training, ids = [...t.training.groupIds, ...t.validation.groupIds, r.observations.groupId]; assert.equal(new Set(ids).size, ids.length);
  assert.ok(t.model.loss.at(-1).loss < t.model.loss[0].loss); assert.equal(t.model.loss.at(-1).epoch, 239);
  assert.ok(t.model.weights.some(v => v !== 0)); assert.equal(t.model.mu.length, 9); assert.equal(r.metrics.model.total, 4368); assert.equal(r.metrics.baseline.total, 4368);
});
check('评价参考变化不改变模型推理', () => {
  const obs = r.observations;
  Object.defineProperty(obs, 'evaluationTruth', { get() { throw Error('forbidden truth read'); } });
  const a = C.infer(obs, r.training.model, r.threshold), changedTruth = { labels: r.evaluationTruth.labels.map(v => 1 - v), line: [] };
  const b = C.infer(obs, r.training.model, r.threshold); assert.deepEqual(a.labels, b.labels); assert.deepEqual(a.line, b.line);
  assert.notEqual(C.evaluate(a, changedTruth, obs).f1, r.metrics.model.f1);
});
let failure;
check('缺失观测拒判，评价分母不缩小', () => {
  failure = C.run({ throwSamples: 2, noise: .16, gap: .18 }); const obs = failure.observations;
  assert.ok(obs.missing.some(Boolean)); obs.missing.forEach((v, i) => { if (v) assert.equal(failure.prediction.labels[i], -1); });
  assert.equal(failure.metrics.model.total, 4368); assert.ok(failure.metrics.model.abstained > 0); assert.ok(failure.metrics.model.coverage < 1); assert.ok(failure.metrics.model.fn > 0);
});
check('同种子复现，噪声与断距真正改变观测和输出', () => {
  const again = C.run(); assert.deepEqual(again.prediction.labels, r.prediction.labels); assert.deepEqual(again.prediction.line, r.prediction.line);
  assert.notDeepEqual(failure.observations.amplitude, r.observations.amplitude); assert.notDeepEqual(failure.prediction.labels, r.prediction.labels);
});
check('无断层场景真实删除评价迹线', () => { const empty = C.run({ throwSamples: 0 }); assert.equal(empty.evaluationTruth.line.length, 0); assert.equal(empty.metrics.model.truthRows, 0); assert.equal(empty.evaluationTruth.labels.filter(Boolean).length, 0); });
check('三概念图、五步图解和教师manifest字段', () => {
  const m = JSON.parse(readFileSync(new URL('./case.json', import.meta.url), 'utf8')); assert.equal(m.sceneId, 's1'); assert.equal(m.tabs.background.sections.length, 3); assert.equal(m.tabs.workflow.steps.length, 5);
  assert.equal((m.tabs.background.sections.map(s => s.html).join('').match(/<svg\b/g) || []).length, 3); assert.equal((m.tabs.workflow.metrics.html.match(/<svg\b/g) || []).length, 5); assert.equal(m.tabs.demo.html, 'demo/index.html');
});
const report = { sceneId: 's1', caseId: 's17x-s1-seismic-fault', checkType: 'Node calculation and source contract checks; not browser acceptance', checkedAt: new Date().toISOString(), passed: checks.length, failed: 0, checks, defaultMetrics: r.metrics, failureMetrics: failure.metrics, trainingLoss: r.training.model.loss, browser: 'not_executed_by_case_author' };
writeFileSync(new URL('./check-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ sceneId: 's1', passed: checks.length, failed: 0, f1: r.metrics.model.f1, baselineF1: r.metrics.baseline.f1, failureF1: failure.metrics.model.f1 }));
