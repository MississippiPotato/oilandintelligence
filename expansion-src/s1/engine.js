(function (g) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  function rng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
  function generate(seed, params = {}) {
    const p = { noise: .1, throwSamples: 6, gap: 0, ...params }, w = 84, h = 72, random = rng(seed), phase = random() * 6.28, slope = (random() - .5) * .4;
    const faultCenter = w * (.43 + random() * .15), faultTilt = (random() - .5) * .24;
    const reflectors = Array.from({ length: 8 }, (_, i) => ({ y: 4 + i * 9 + random() * 3, amp: (random() < .5 ? -1 : 1) * (.65 + random() * .45) }));
    const amplitude = [], missing = [], labels = [], line = [], fault = y => faultCenter + faultTilt * (y - h / 2);
    const gapWidth = Math.round(w * p.gap), gapX = Math.round(faultCenter - gapWidth * .55);
    for (let y = 0; y < h; y++) {
      if (p.throwSamples > 0 && y >= 8 && y < h - 8) line.push({ x: fault(y), y });
      for (let x = 0; x < w; x++) {
        const rightBlock = x > fault(y), shift = rightBlock ? p.throwSamples : 0;
        let value = 0;
        reflectors.forEach((r, i) => {
          const center = r.y + .035 * slope * x + 1.7 * Math.sin(x / 20 + phase + i * .13) + shift;
          const a = (y - center) / 1.3;
          value += r.amp * (1 - 2 * a * a) * Math.exp(-a * a);
        });
        value += (random() + random() + random() - 1.5) * p.noise * 1.6;
        const absent = gapWidth > 0 && x >= gapX && x < gapX + gapWidth && y >= 23 && y < 57;
        amplitude.push(absent ? 0 : value); missing.push(absent ? 1 : 0);
        labels.push(p.throwSamples > 0 && y >= 8 && y < h - 8 && Math.abs(x - fault(y)) <= 1.5 ? 1 : 0);
      }
    }
    return { observations: { w, h, amplitude, missing, groupId: '剖面-' + seed, traceSpacing_m: 25, sampleInterval_ms: 4, startTime_ms: 800, analysisRows: [8, h - 8] }, evaluationTruth: { labels, line, groupId: '剖面-' + seed } };
  }
  function correlation(a, b) {
    const ma = mean(a), mb = mean(b); let sum = 0, va = 0, vb = 0;
    a.forEach((v, i) => { const da = v - ma, db = b[i] - mb; sum += da * db; va += da * da; vb += db * db; });
    return va * vb > 1e-9 ? clamp(sum / Math.sqrt(va * vb), -1, 1) : 0;
  }
  function features(obs) {
    const { w, h, amplitude: a, missing } = obs, first = [];
    const at = (x, y) => a[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const left = [], right = [];
      for (let dy = -4; dy <= 4; dy++) { left.push(at(x - 2, y + dy)); right.push(at(x + 2, y + dy)); }
      const discontinuity = (1 - correlation(left, right)) / 2;
      let best = -1;
      [-4, -2, 2, 4].forEach(lag => { best = Math.max(best, correlation(left, left.map((_, i) => at(x + 2, y + i - 4 + lag)))); });
      const gx = mean(left.map((v, i) => Math.abs(v - right[i]))), gy = Math.abs(at(x, y - 1) - at(x, y + 1));
      const energy = Math.sqrt(mean(left.concat(right).map(v => v * v)));
      let absent = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) absent += missing[clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)];
      first.push([discontinuity, Math.max(0, best - correlation(left, right)), gx, gy, energy, gx / (energy + .1), absent / 25]);
    }
    return first.map((f, i) => {
      const x = i % w, y = Math.floor(i / w), vertical = [], horizontal = [];
      for (let d = -6; d <= 6; d += 2) { vertical.push(first[clamp(y + d, 0, h - 1) * w + x][0]); horizontal.push(first[y * w + clamp(x + d, 0, w - 1)][0]); }
      return [...f, mean(vertical), mean(vertical) - mean(horizontal)];
    });
  }
  function fit(samples, iterations = 240) {
    const dims = samples[0].x.length, mu = Array.from({ length: dims }, (_, j) => mean(samples.map(s => s.x[j])));
    const sd = mu.map((m, j) => Math.max(.01, Math.sqrt(mean(samples.map(s => (s.x[j] - m) ** 2)))));
    const x = samples.map(s => [1, ...s.x.map((v, j) => (v - mu[j]) / sd[j])]), weights = Array(dims + 1).fill(0), loss = [];
    for (let epoch = 0; epoch < iterations; epoch++) {
      const grad = weights.map(() => 0); let nll = 0;
      x.forEach((row, i) => {
        const z = row.reduce((s, v, j) => s + v * weights[j], 0), p = 1 / (1 + Math.exp(-clamp(z, -30, 30))), y = samples[i].label;
        row.forEach((v, j) => { grad[j] += (p - y) * v; });
        nll -= y * Math.log(Math.max(1e-9, p)) + (1 - y) * Math.log(Math.max(1e-9, 1 - p));
      });
      weights.forEach((v, j) => { weights[j] -= .14 * (grad[j] / samples.length + (j ? .012 * v : 0)); });
      if (epoch % 20 === 0 || epoch === iterations - 1) loss.push({ epoch, loss: nll / samples.length });
    }
    return { mu, sd, weights, loss, trainingCount: samples.length };
  }
  function score(model, x) {
    const z = model.weights[0] + x.reduce((s, v, j) => s + ((v - model.mu[j]) / model.sd[j]) * model.weights[j + 1], 0);
    return 1 / (1 + Math.exp(-clamp(z, -30, 30)));
  }
  function infer(observations, model, threshold) {
    const vectors = features(observations), scores = vectors.map((x, i) => observations.missing[i] ? null : score(model, x));
    const labels = scores.map((s, i) => observations.missing[i] ? -1 : s >= threshold ? 1 : 0);
    const line = [], { w, h } = observations;
    for (let y = observations.analysisRows[0]; y < observations.analysisRows[1]; y++) {
      let best = -1, bx = -1;
      for (let x = 3; x < w - 3; x++) { const s = scores[y * w + x]; if (s != null && s > best) { best = s; bx = x; } }
      if (best >= threshold) line.push({ x: bx, y, score: best });
    }
    return { labels, scores, line, features: vectors };
  }
  function evaluate(predicted, truth, obs) {
    let tp = 0, fp = 0, fn = 0, tn = 0, abstained = 0, total = 0;
    const [start, end] = obs.analysisRows;
    for (let y = start; y < end; y++) for (let x = 3; x < obs.w - 3; x++) {
      const i = y * obs.w + x, p = predicted.labels[i], t = truth.labels[i]; total++;
      if (p === -1) abstained++;
      if (p === 1 && t) tp++; else if (p === 1) fp++; else if (t) fn++; else if (p === 0) tn++;
    }
    let matched = 0;
    const usedTruth = new Set();
    predicted.line.forEach(p => {
      const index = truth.line.findIndex((t, i) => !usedTruth.has(i) && t.y === p.y && Math.abs(t.x - p.x) <= 2);
      if (index >= 0) { usedTruth.add(index); matched++; }
    });
    const pc = predicted.line.length, tc = truth.line.length;
    return { tp, fp, fn, tn, abstained, total, coverage: total ? 1 - abstained / total : null, iou: tp + fp + fn ? tp / (tp + fp + fn) : null, f1: 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : null, lineF1: pc + tc ? 2 * matched / (pc + tc) : null, lineMatched: matched, predictedRows: pc, truthRows: tc, traceTolerance: 2, tolerance_m: 2 * obs.traceSpacing_m };
  }
  function baseline(observations, vectors, threshold) {
    const { w } = observations, scores = vectors.map((f, i) => observations.missing[i] ? null : f[0]), labels = scores.map((s, i) => observations.missing[i] ? -1 : s >= threshold ? 1 : 0), line = [];
    for (let y = observations.analysisRows[0]; y < observations.analysisRows[1]; y++) {
      let best = -1, bx = -1;
      for (let x = 3; x < w - 3; x++) if (scores[y * w + x] != null && scores[y * w + x] > best) { best = scores[y * w + x]; bx = x; }
      if (best >= threshold) line.push({ x: bx, y, score: best });
    }
    return { labels, scores, line };
  }
  let cached;
  function train() {
    if (cached) return cached;
    const trainingSeeds = [131, 173, 211, 257, 293, 337, 379, 419], validationSeeds = [701, 751], samples = [];
    trainingSeeds.forEach((seed, n) => {
      const data = generate(seed, { noise: .025 + (n % 4) * .055, throwSamples: n === 7 ? 0 : 3 + (n % 5), gap: n === 5 ? .08 : 0 }), vectors = features(data.observations), pos = [], neg = [];
      for (let y = 8; y < 64; y += 2) for (let x = 3; x < 81; x++) {
        const i = y * 84 + x;
        if (data.observations.missing[i]) continue;
        (data.evaluationTruth.labels[i] ? pos : neg).push(i);
      }
      [pos, neg].forEach((pool, labelIndex) => {
        const count = Math.min(96, pool.length);
        for (let i = 0; i < count; i++) { const pixel = pool[Math.floor(i * pool.length / count)]; samples.push({ x: vectors[pixel], label: labelIndex === 0 ? 1 : 0, groupId: data.observations.groupId, pixel }); }
      });
    });
    const model = fit(samples), validation = validationSeeds.map((seed, i) => generate(seed, { noise: .085 + .045 * i, throwSamples: 4 + i * 3, gap: i ? .06 : 0 }));
    const rows = validation.map(data => ({ data, prediction: infer(data.observations, model, .5) }));
    let threshold = .5, best = -1, baselineThreshold = .5, baseBest = -1;
    const candidates = [];
    for (let t = .25; t <= .9001; t += .05) {
      let tp = 0, fp = 0, fn = 0;
      rows.forEach(({ data, prediction }) => { const p = { ...prediction, labels: prediction.scores.map((s, i) => data.observations.missing[i] ? -1 : s >= t ? 1 : 0) }, m = evaluate(p, data.evaluationTruth, data.observations); tp += m.tp; fp += m.fp; fn += m.fn; });
      const f1 = 2 * tp / Math.max(1, 2 * tp + fp + fn); candidates.push({ threshold: Number(t.toFixed(2)), f1 });
      if (f1 > best) { best = f1; threshold = Number(t.toFixed(2)); }
    }
    for (let t = .05; t <= .9501; t += .05) {
      let tp = 0, fp = 0, fn = 0;
      rows.forEach(({ data, prediction }) => { const b = baseline(data.observations, prediction.features, t), m = evaluate(b, data.evaluationTruth, data.observations); tp += m.tp; fp += m.fp; fn += m.fn; });
      const f1 = 2 * tp / Math.max(1, 2 * tp + fp + fn);
      if (f1 > baseBest) { baseBest = f1; baselineThreshold = Number(t.toFixed(2)); }
    }
    return cached = { model, threshold, baselineThreshold, training: { groupIds: trainingSeeds.map(s => '剖面-' + s), pixels: samples.length, featureCount: model.mu.length, positive: samples.filter(s => s.label).length }, validation: { groupIds: validationSeeds.map(s => '剖面-' + s), candidates, selectedThreshold: threshold, f1: best, baselineF1: baseBest, baselineThreshold } };
  }
  function run(params = {}) {
    const p = { noise: .1, throwSamples: 6, gap: 0, thresholdShift: 0, seed: 2029, ...params }, training = train(), data = generate(p.seed, p);
    const threshold = clamp(training.threshold + p.thresholdShift, .05, .98), prediction = infer(data.observations, training.model, threshold), base = baseline(data.observations, prediction.features, training.baselineThreshold);
    return { params: p, ...data, threshold, prediction, baseline: base, training, metrics: { model: evaluate(prediction, data.evaluationTruth, data.observations), baseline: evaluate(base, data.evaluationTruth, data.observations) } };
  }
  g.S1Core = { rng, generate, correlation, features, fit, score, infer, evaluate, baseline, train, run };
})(globalThis);
