// Run from any directory: node <this-directory>/verify.mjs
// Aggregate runner: import { verify } from './verify.mjs'; verify({ write: false });
// These checks exercise engine.js; they do not implement a second matching algorithm.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const caseId = 's17x-p1-perforation-depth-correlation';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const close = (actual, expected, tolerance = 1e-10) => assert(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

export function verify({ write = true } = {}) {
  const checks = [];
  const check = (name, fn) => {
    try { checks.push({ name, passed: true, details: fn() ?? null }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  const source = fs.readFileSync(path.join(dir, 'engine.js'), 'utf8');
  const engineSHA256 = digest(source);
  let E;
  check('load the actual case engine', () => {
    const context = vm.createContext({});
    vm.runInContext(source, context, { filename: 'engine.js', timeout: 5000 });
    E = context.VariantEngine;
    assert.equal(E.VERSION, '1.0.0');
    assert.equal(typeof E.infer, 'function');
    assert.equal(typeof E.evaluate, 'function');
    return { engineVersion: E.VERSION, datasetVersion: E.DATA_VERSION, engineSHA256 };
  });

  if (E) {
    let result;
    check('default correction and analytical placement fixture', () => {
      result = E.run();
      assert.equal(result.prediction.status, 'accepted');
      close(result.prediction.delta, 3.4);
      close(result.evaluationTruth.actualDelta, 3.37);
      close(result.evaluation.model.absoluteError, 0.03);
      close(result.evaluation.model.targetCoverage, 0.985);
      close(result.evaluation.model.IoU, 1.97 / 2.03);
      assert.deepEqual(plain(result.prediction.commandInterval), [1036.6, 1038.6]);
      return { delta: result.prediction.delta, actualDelta: result.evaluationTruth.actualDelta, absoluteError: result.evaluation.model.absoluteError, IoU: result.evaluation.model.IoU };
    });

    check('inference cannot read truth fields and survives truth poisoning', () => {
      const pair = E.makeObservation(), observation = plain(pair.observation);
      function inspect(value) {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) {
          assert(!['actualDelta', 'evaluationTruth', 'trueCollarsRecorded'].includes(key), `truth field in observation: ${key}`);
          inspect(child);
        }
      }
      inspect(observation);
      const before = JSON.stringify(E.infer(observation));
      for (const key of ['actualDelta', 'evaluationTruth', 'trueCollarsRecorded']) {
        Object.defineProperty(observation, key, { get() { throw Error(`inference read ${key}`); } });
      }
      pair.evaluationTruth.actualDelta = 999;
      const prediction = E.infer(observation);
      assert.equal(JSON.stringify(prediction), before);
      assert(E.evaluate(prediction, pair.evaluationTruth).model.absoluteError > 100);
      return 'throwing truth getters were untouched; changing separate evaluation truth changes only the later score';
    });

    check('flat reference and constant measured GR stay unscored', () => {
      const flat = E.makeObservation({ scenario: 'flat' });
      const constantMeasured = E.makeObservation();
      constantMeasured.observation.measured.gr.fill(60);
      return [flat, constantMeasured].map(pair => {
        const p = E.infer(pair.observation), score = E.evaluate(p, pair.evaluationTruth);
        assert.equal(p.status, 'insufficient');
        assert.equal(p.delta, null); assert.equal(p.commandInterval, null);
        assert.equal(score.model, null);
        assert(Number.isFinite(score.baseline.absoluteError));
        return { status: p.status, delta: p.delta, model: score.model, baselineError: score.baseline.absoluteError };
      });
    });

    check('periodic GR and collar sequences retain multiple candidates', () => {
      const pair = E.makeObservation({ scenario: 'periodic' }), p = E.infer(pair.observation);
      const candidates = p.independentPeaks.filter(peak => peak.cclPass);
      assert.equal(p.status, 'ambiguous'); assert.equal(p.accepted, false);
      assert.equal(p.delta, null); assert.equal(p.commandInterval, null);
      assert(candidates.length >= 2);
      assert(p.candidateGap < E.POLICY.ambiguityGap);
      assert.equal(E.evaluate(p, pair.evaluationTruth).model, null);
      return { status: p.status, candidateDeltas: candidates.map(peak => peak.delta), candidateGap: p.candidateGap };
    });

    check('similar CCL interference remains visible as unmatched evidence', () => {
      const p = E.infer(E.makeObservation({ scenario: 'interference' }).observation);
      assert.equal(p.status, 'accepted');
      assert(p.collarMatch.unmatched.length > 0);
      assert(p.collarMatch.matchedCount < p.collarMatch.detectedCount);
      return { detected: p.collarMatch.detectedCount, matched: p.collarMatch.matchedCount, unmatched: plain(p.collarMatch.unmatched) };
    });

    check('a wrong collar reference rejects a strong GR-only match', () => {
      const pair = E.makeObservation();
      pair.observation.reference.collarDepths = pair.observation.reference.collarDepths.map(z => z + 1.5);
      assert(E.correlationAt(pair.observation, 3.4).ncc > 0.9);
      const p = E.infer(pair.observation);
      assert.equal(p.status, 'insufficient'); assert.equal(p.delta, null);
      assert.equal(E.evaluate(p, pair.evaluationTruth).model, null);
      return { status: p.status, bestNCC: p.bestCandidate?.ncc ?? null, matchedCount: p.collarMatch?.matchedCount ?? 0 };
    });

    check('a missing collar is reported rather than supplied from truth', () => {
      const p = E.infer(E.makeObservation({ scenario: 'missing' }).observation);
      assert.equal(p.status, 'accepted'); close(p.delta, 3.4);
      assert.equal(p.detection.candidates.length, 9);
      assert.equal(p.collarMatch.possibleMissingCount, 1);
      return { detected: p.detection.candidates.length, possibleMissing: p.collarMatch.possibleMissingCount, delta: p.delta };
    });

    check('zero correction is the unchanged-depth baseline', () => {
      assert(result, 'default result unavailable');
      const p = result.prediction, baseline = result.evaluation.baseline;
      assert.equal(p.baseline.delta, 0);
      assert.deepEqual(plain(p.baseline.commandInterval), plain(p.targetInterval));
      close(baseline.absoluteError, 3.37);
      assert.deepEqual(plain(baseline.actualInterval), [1043.37, 1045.37]);
      assert.equal(baseline.targetCoverage, 0); assert.equal(baseline.IoU, 0);
      return plain(baseline);
    });

    check('insufficient search range and lost CCL detections produce null results', () => {
      const pair = E.makeObservation();
      return [{ searchLimit: 2 }, { thresholdK: 3.8 }].map(settings => {
        const p = E.infer(pair.observation, settings), score = E.evaluate(p, pair.evaluationTruth);
        assert.equal(p.status, 'insufficient'); assert.equal(p.delta, null);
        assert.equal(p.commandInterval, null); assert.equal(score.model, null);
        assert(Number.isFinite(score.baseline.absoluteError));
        return { settings, status: p.status, detected: p.detection.candidates.length, searchCount: p.searchCount, model: score.model };
      });
    });

    check('target thickness changes overlap, not the inferred correction', () => {
      const a = E.makeObservation({ targetThickness: 0.5 }), b = E.makeObservation({ targetThickness: 4 });
      const pa = E.infer(a.observation), pb = E.infer(b.observation);
      close(pa.delta, pb.delta);
      const ea = E.evaluate(pa, a.evaluationTruth), eb = E.evaluate(pb, b.evaluationTruth);
      close(ea.model.absoluteError, eb.model.absoluteError);
      assert(ea.model.IoU < eb.model.IoU);
      return { delta: pa.delta, thinIoU: ea.model.IoU, thickIoU: eb.model.IoU };
    });

    check('all independent outcomes and paired evaluation denominators are retained', () => {
      assert(result, 'default result unavailable');
      const b = result.benchmark, rows = b.rows, accepted = rows.filter(row => row.evaluation.model);
      assert.equal(rows.length, 12); assert.equal(new Set(rows.map(row => row.seed)).size, 12);
      assert(rows.every(row => row.seed !== E.DEFAULTS.seed));
      assert.equal(b.acceptedCount, 9); assert.equal(b.ambiguousCount, 2); assert.equal(b.insufficientCount, 1);
      assert.equal(b.acceptedCount + b.ambiguousCount + b.insufficientCount, rows.length);
      assert.equal(b.modelAccepted.count, accepted.length);
      assert.equal(b.baselineSameAccepted.count, accepted.length);
      assert.equal(b.baselineAll.count, rows.length);
      close(b.acceptanceRate, accepted.length / rows.length);
      close(b.modelAccepted.MAE, accepted.reduce((sum, row) => sum + row.evaluation.model.absoluteError, 0) / accepted.length);
      close(b.baselineSameAccepted.MAE, accepted.reduce((sum, row) => sum + row.evaluation.baseline.absoluteError, 0) / accepted.length);
      for (const row of rows.filter(row => row.prediction.status !== 'accepted')) {
        assert.equal(row.prediction.delta, null); assert.equal(row.evaluation.model, null);
      }
      return { accepted: b.acceptedCount, ambiguous: b.ambiguousCount, insufficient: b.insufficientCount, modelAccepted: plain(b.modelAccepted), baselineSameAccepted: plain(b.baselineSameAccepted), baselineAll: plain(b.baselineAll), unscoredRecords: rows.filter(row => !row.evaluation.model).map(row => row.id) };
    });

    check('results serialize without nonfinite scores and the engine source is unchanged', () => {
      assert(result, 'default result unavailable');
      function inspect(value) {
        if (typeof value === 'number') assert(Number.isFinite(value), 'nonfinite numeric output');
        else if (value && typeof value === 'object') Object.values(value).forEach(inspect);
      }
      inspect(result);
      assert.deepEqual(plain(E.makeObservation()), plain(E.makeObservation()));
      assert.equal(digest(fs.readFileSync(path.join(dir, 'engine.js'), 'utf8')), engineSHA256);
      return { deterministicDefaultObservation: true, finiteOutputs: true, engineUnchanged: true };
    });
  }

  const report = { caseId, scope: 'reproducible numerical checks using engine.js; no browser assertions', dataNature: 'synthetic_teaching', generatedAt: new Date().toISOString(), engineSHA256, passed: checks.filter(item => item.passed).length, failed: checks.filter(item => !item.passed).length, checks };
  if (write) fs.writeFileSync(path.join(dir, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

export default verify;
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const report = verify();
  console.log(JSON.stringify({ caseId, passed: report.passed, failed: report.failed, failures: report.checks.filter(item => !item.passed) }));
  if (report.failed) process.exitCode = 1;
}
