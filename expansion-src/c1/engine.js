(function (g) {
  'use strict';
  const names = ['胶结响应较好', '过渡 / 部分胶结', '弱胶结响应'];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  function rng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
  function normal(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r()); }
  function generateWell(id, seed, opts) {
    const r = rng(seed), observations = [], labels = [], phase = Math.floor(r() * 3);
    const formation = 0.8 + 0.4 * r(), instrument = 0.9 + 0.2 * r();
    for (let i = 0; i < 48; i++) {
      const y = (Math.floor(i / 8) + phase) % 3;
      const micro = (i >= 12 && i < 20 ? opts.micro : 0) + (r() < 0.12 ? 0.38 : 0);
      const amp = clamp([0.19, 0.47, 0.83][y] + 0.12 * normal(r) + micro * 0.4 + opts.eccentric * Math.sin(i / 5) * 0.18, 0.05, 1.2) * instrument;
      const late = clamp([0.73, 0.44, 0.18][y] * formation + 0.08 * normal(r), 0.06, 1);
      const delay = 46 + Math.round(4 * Math.sin(i / 13) + 2 * formation);
      const waveform = Array.from({ length: 80 }, (_, t) => {
        const casing = amp * Math.sin((t - 16) * 0.94) * Math.exp(-Math.pow((t - 23) / 9, 2));
        const rock = late * Math.sin((t - delay) * (0.64 + formation * 0.08)) * Math.exp(-Math.pow((t - delay - 6) / 13, 2));
        return casing + rock + normal(r) * opts.noise;
      });
      observations.push({ wellId: id, sampleId: id + '-' + String(i + 1).padStart(2, '0'), depth: 1800 + i * 0.5, waveform });
      labels.push(y);
    }
    return { observations, evaluationTruth: labels };
  }
  function features(row) {
    const w = row.waveform, early = w.slice(10, 37), late = w.slice(42, 75);
    const rms = a => Math.sqrt(mean(a.map(v => v * v)));
    const e = rms(early), l = rms(late);
    const roughness = Math.sqrt(mean(late.slice(1).map((v, i) => Math.pow(v - late[i], 2))));
    return [e, l, l / Math.max(0.03, e), roughness];
  }
  function data(params = {}) {
    const p = { noise: 0.035, eccentric: 0, micro: 0, ...params };
    const pack = (prefix, count, offset, opts) => Array.from({ length: count }, (_, i) => generateWell(prefix + String(i + 1).padStart(2, '0'), 17000 + offset + i * 73, opts));
    const training = pack('TR-', 18, 0, { noise: 0.035, eccentric: 0.15, micro: 0.25 });
    const validation = pack('VA-', 6, 3000, { noise: 0.045, eccentric: 0.2, micro: 0.3 });
    const testing = pack('TE-', 4, 6000, p);
    const labeled = groups => groups.flatMap(w => w.observations.map((row, i) => ({ wellId: row.wellId, x: features(row), y: w.evaluationTruth[i] })));
    return { training: labeled(training), validation: labeled(validation), observations: testing.flatMap(w => w.observations), evaluationTruth: testing.flatMap(w => w.evaluationTruth), splits: { training: training.map(w => w.observations[0].wellId), validation: validation.map(w => w.observations[0].wellId), testing: testing.map(w => w.observations[0].wellId) } };
  }
  function fit(training, validation) {
    const mu = [0, 1, 2, 3].map(j => mean(training.map(d => d.x[j])));
    const sd = mu.map((m, j) => Math.max(1e-6, Math.sqrt(mean(training.map(d => Math.pow(d.x[j] - m, 2))))));
    const scale = x => x.map((v, j) => (v - mu[j]) / sd[j]);
    const bank = training.map((d, i) => ({ ...d, z: scale(d.x), index: i }));
    function neighbors(x, k) {
      const z = scale(x);
      return bank.map(d => ({ index: d.index, wellId: d.wellId, y: d.y, x: d.x, distance: Math.sqrt(z.reduce((s, v, j) => s + Math.pow(v - d.z[j], 2), 0)) })).sort((a, b) => a.distance - b.distance || a.index - b.index).slice(0, k);
    }
    function predictOne(x, k, reject = 0) {
      const near = neighbors(x, k), votes = [0, 0, 0];
      near.forEach(d => { votes[d.y] += 1 / Math.max(0.05, d.distance); });
      const support = Math.max(...votes) / votes.reduce((s, v) => s + v, 0), raw = votes.indexOf(Math.max(...votes));
      const distance = mean(near.map(d => d.distance));
      return { label: support < reject || distance > 4.5 ? -1 : raw, raw, support, distance, neighbors: near };
    }
    const validationScores = [3, 5, 9].map(k => ({ k, score: evaluate(validation.map(d => predictOne(d.x, k).label), validation.map(d => d.y)).macroF1 }));
    const k = validationScores.slice().sort((a, b) => b.score - a.score || a.k - b.k)[0].k;
    let baseline = { a: 0.2, b: 0.4, score: -1 };
    for (const a of [0.16, 0.2, 0.24, 0.28]) for (const b of [0.33, 0.37, 0.41, 0.45]) {
      if (a >= b) continue;
      const score = evaluate(validation.map(d => d.x[0] < a ? 0 : d.x[0] < b ? 1 : 2), validation.map(d => d.y)).macroF1;
      if (score > baseline.score) baseline = { a, b, score };
    }
    return { mu, sd, bank, k, baseline, validationScores, predict: x => predictOne(x, k), predictOne };
  }
  function evaluate(predicted, truth) {
    const confusion = Array.from({ length: 3 }, () => [0, 0, 0, 0]);
    predicted.forEach((p, i) => { confusion[truth[i]][p < 0 ? 3 : p]++; });
    const recalls = confusion.map((row, c) => row.reduce((s, v) => s + v, 0) ? row[c] / row.reduce((s, v) => s + v, 0) : null);
    const fs = confusion.map((row, c) => {
      const tp = row[c], fn = row.reduce((s, v) => s + v, 0) - tp;
      const fp = confusion.reduce((s, r, i) => s + (i === c ? 0 : r[c]), 0);
      return 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : 0;
    });
    const accepted = predicted.filter(p => p >= 0).length, correct = predicted.filter((p, i) => p >= 0 && p === truth[i]).length;
    return { total: truth.length, correct, accepted, rejected: truth.length - accepted, macroF1: truth.length ? mean(fs) : null, coverage: truth.length ? accepted / truth.length : null, acceptedError: accepted ? 1 - correct / accepted : null, recalls, confusion };
  }
  function infer(observations, model, params = {}) {
    const a = model.baseline.a + Number(params.thresholdShift || 0), b = model.baseline.b + Number(params.thresholdShift || 0);
    return observations.map(row => {
      const x = features(row), learned = model.predictOne(x, model.k, Number(params.reject ?? 0.6));
      return { sampleId: row.sampleId, x, ...learned, baseline: x[0] < a ? 0 : x[0] < b ? 1 : 2 };
    });
  }
  function run(params = {}) {
    const d = data(params), model = fit(d.training, d.validation), predictions = infer(d.observations, model, params);
    return { data: d, model, predictions, metrics: { model: evaluate(predictions.map(d => d.label), d.evaluationTruth), baseline: evaluate(predictions.map(d => d.baseline), d.evaluationTruth) } };
  }
  g.C1Engine = { names, data, features, fit, infer, evaluate, run };
})(globalThis);
