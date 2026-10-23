(function (g) {
  'use strict';
  const labels = ['砂岩露头', '泥岩露头', '灰岩露头', '植被覆盖'];
  const colors = ['#c99655', '#718597', '#ded3ae', '#418b70'];
  const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function rng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
  function generate(seed, params = {}) {
    const p = { noise: .045, shadow: .26, cover: .16, ...params }, w = 72, h = 48, random = rng(seed);
    const spectra = [[.34, .39, .53], [.22, .28, .31], [.46, .49, .35], [.12, .61, .23]];
    const shift = random() * 1.7, angle = random() * .25 - .125, labelsOut = [], bands = [[], [], []];
    const offsets = spectra.map(() => [random(), random(), random()].map(x => (x - .5) * .025));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const band = (y / h + angle * x / w + .08 * Math.sin(x / 12 + shift) + shift * .11 + 2) % 1;
      let c = band < .34 ? 0 : band < .67 ? 1 : 2;
      const canopy = .5 + .23 * Math.sin(x * .21 + shift * 3) + .2 * Math.cos(y * .28 - shift) + .12 * Math.sin((x + y) * .17);
      if (canopy > 1 - p.cover * 1.1) c = 3;
      labelsOut.push(c);
      const shadeShape = Math.exp(-((x / w - .38) ** 2 / .07 + (y / h - .5) ** 2 / .18));
      const illumination = 1 - p.shadow * shadeShape;
      const texture = c === 0 ? .022 * Math.sin(x * 2.1 + y * 1.8) : c === 1 ? .016 * Math.sin(y * 2.4) : c === 2 ? .018 * Math.sin(x * .56) * Math.cos(y * .7) : .025 * (random() - .5);
      for (let b = 0; b < 3; b++) bands[b].push(clamp((spectra[c][b] + offsets[c][b] + texture) * illumination + (random() - .5) * p.noise * 2, .01, .95));
    }
    return { observations: { w, h, bands, groupId: '图幅-' + seed, pixelSize_m: 30, wavelengths_um: [.65, .86, 2.2] }, evaluationTruth: { labels: labelsOut, groupId: '图幅-' + seed } };
  }
  function features(obs, mode = 'full') {
    const { w, h, bands } = obs;
    return bands[0].map((red, i) => {
      if (mode === 'red') return [red];
      const n = bands[1][i], s = bands[2][i], x = i % w, y = Math.floor(i / w), local = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) local.push(bands[0][clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)]);
      const m = mean(local);
      return [red, n, s, (n - red) / (n + red + .01), (s - n) / (s + n + .01), Math.sqrt(mean(local.map(v => (v - m) ** 2)))];
    });
  }
  function fit(samples) {
    const dims = samples[0].x.length, mu = Array.from({ length: dims }, (_, j) => mean(samples.map(s => s.x[j])));
    const sd = mu.map((m, j) => Math.max(.001, Math.sqrt(mean(samples.map(s => (s.x[j] - m) ** 2)))));
    return { mu, sd, samples: samples.map(s => ({ ...s, z: s.x.map((v, j) => (v - mu[j]) / sd[j]) })) };
  }
  function nearest(model, x, k = 5) {
    const z = x.map((v, j) => (v - model.mu[j]) / model.sd[j]);
    const best = [];
    model.samples.forEach((s, index) => {
      const distance = Math.sqrt(mean(z.map((v, j) => (v - s.z[j]) ** 2)));
      if (best.length >= k && distance >= best[best.length - 1].distance) return;
      best.push({ index, label: s.label, distance, groupId: s.groupId, pixel: s.pixel });
      best.sort((a, b) => a.distance - b.distance || a.index - b.index);
      if (best.length > k) best.pop();
    });
    return best;
  }
  function vote(neighbors, supportThreshold = .5) {
    const votes = [0, 0, 0, 0];
    neighbors.forEach(n => { votes[n.label] += 1 / Math.max(.08, n.distance); });
    const proposed = votes.indexOf(Math.max(...votes)), support = votes[proposed] / votes.reduce((s, x) => s + x, 0);
    return { label: support >= supportThreshold ? proposed : 4, proposed, support, votes };
  }
  function infer(observations, model, config) {
    const vectors = features(observations, config.featureMode);
    const scores = vectors.map(x => vote(nearest(model, x, config.k), config.support));
    return { labels: scores.map(s => s.label), scores, features: vectors };
  }
  function evaluate(predicted, truth) {
    const matrix = Array.from({ length: 4 }, () => [0, 0, 0, 0, 0]);
    truth.labels.forEach((t, i) => { matrix[t][predicted[i]]++; });
    const perClass = matrix.map((row, c) => {
      const tp = row[c], fn = row.reduce((s, v) => s + v, 0) - tp, fp = matrix.reduce((s, r, j) => s + (j === c ? 0 : r[c]), 0);
      return { label: labels[c], tp, fp, fn, support: tp + fn, f1: 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : null, iou: tp + fp + fn ? tp / (tp + fp + fn) : null };
    });
    const validF = perClass.map(r => r.f1).filter(v => v != null), validI = perClass.map(r => r.iou).filter(v => v != null);
    const accepted = predicted.filter(c => c < 4).length, correct = truth.labels.filter((c, i) => predicted[i] === c).length;
    return { matrix, perClass, macroF1: validF.length ? mean(validF) : null, meanIoU: validI.length ? mean(validI) : null, total: truth.labels.length, accepted, coverage: truth.labels.length ? accepted / truth.labels.length : null, correct, acceptedError: accepted ? (accepted - correct) / accepted : null };
  }
  function baseline(observations, rule) { return observations.bands[0].map(v => rule.order[v < rule.thresholds[0] ? 0 : v < rule.thresholds[1] ? 1 : v < rule.thresholds[2] ? 2 : 3]); }
  const cached = {};
  function train(featureMode = 'full') {
    if (cached[featureMode]) return cached[featureMode];
    const trainIds = [111, 127, 143, 159, 175, 191], validationIds = [503, 557], samples = [], trainMeans = Array.from({ length: 4 }, () => []);
    trainIds.forEach((seed, group) => {
      const data = generate(seed, { noise: .035 + group * .007, shadow: .12 + group * .075, cover: .18 + (group % 3) * .07 });
      const xs = features(data.observations, featureMode);
      for (let y = 2; y < data.observations.h; y += 6) for (let x = 2; x < data.observations.w; x += 6) {
        const i = y * data.observations.w + x, label = data.evaluationTruth.labels[i];
        samples.push({ x: xs[i], label, groupId: data.observations.groupId, pixel: i });
        trainMeans[label].push(data.observations.bands[0][i]);
      }
    });
    const model = fit(samples), validation = validationIds.map((seed, i) => generate(seed, { noise: .055, shadow: .3 + i * .15, cover: .22 }));
    let selectedK = 3, bestF = -1, validationRows = [];
    const validationNeighbors = validation.map(d => features(d.observations, featureMode).map((x, i) => i % 4 === 0 ? { i, neighbors: nearest(model, x, 7) } : null).filter(Boolean));
    [3, 5, 7].forEach(k => {
      const predictions = [], gold = [];
      validation.forEach((d, n) => validationNeighbors[n].forEach(row => { predictions.push(vote(row.neighbors.slice(0, k), .5).label); gold.push(d.evaluationTruth.labels[row.i]); }));
      const f1 = evaluate(predictions, { labels: gold }).macroF1;
      validationRows.push({ k, macroF1: f1, pixels: gold.length });
      if (f1 > bestF) { bestF = f1; selectedK = k; }
    });
    const order = trainMeans.map((a, label) => ({ label, mean: mean(a) })).sort((a, b) => a.mean - b.mean);
    let baselineRule, baselineBest = -1;
    [-.02, -.01, 0, .01, .02].forEach(offset => {
      const rule = { order: order.map(r => r.label), thresholds: order.slice(0, 3).map((r, i) => (r.mean + order[i + 1].mean) / 2 + offset), offset };
      const gold = [], predicted = [];
      validation.forEach(d => { gold.push(...d.evaluationTruth.labels); predicted.push(...baseline(d.observations, rule)); });
      const f1 = evaluate(predicted, { labels: gold }).macroF1;
      if (f1 > baselineBest) { baselineBest = f1; baselineRule = rule; }
    });
    return cached[featureMode] = { model, k: selectedK, baselineRule, training: { groupIds: trainIds.map(s => '图幅-' + s), pixels: samples.length, featureCount: model.mu.length }, validation: { groupIds: validationIds.map(s => '图幅-' + s), candidates: validationRows, selectedK, baselineMacroF1: baselineBest, selectionMetric: '宏F1；缺席类别不纳入宏平均' } };
  }
  function run(params = {}) {
    const p = { noise: .045, shadow: .26, cover: .16, featureMode: 'full', support: .5, seed: 2027, ...params };
    const training = train(p.featureMode), data = generate(p.seed, p);
    const prediction = infer(data.observations, training.model, { featureMode: p.featureMode, k: training.k, support: p.support });
    const base = baseline(data.observations, training.baselineRule);
    return { params: p, ...data, prediction, baseline: base, metrics: { model: evaluate(prediction.labels, data.evaluationTruth), baseline: evaluate(base, data.evaluationTruth) }, training };
  }
  g.G1Core = { labels, colors, rng, generate, features, fit, nearest, vote, infer, evaluate, baseline, train, run };
})(globalThis);
