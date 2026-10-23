(function (g) {
  'use strict';
  function rng(seed) { let s = seed >>> 0; return function () { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const names = ['充满泵', '供液不足形', '气影响形'], colors = ['#237f73', '#c18131', '#5b71b6'], mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  const sigmoid = x => 1 / (1 + Math.exp(-x));
  function makeCard(seed, kind, options = {}, groupId = 'DEMO-WELL') {
    const r = rng(seed), wr = rng(options.wellSeed ?? seed), stroke = 2.2 + wr() * 1.2, base = 8 + wr() * 10, amplitude = 28 + wr() * 23, knee = .31 + wr() * .34 + (r() - .5) * .04, corner = .012 + wr() * .023 + r() * .002, exponent = 1.1 + wr() * 1.45 + r() * .05, tilt = (wr() - .5) * .08;
    const noise = options.noise ?? .015, offset = options.offset ?? 0, points = [], n = 96;
    function load(s, branch) {
      const upper = 1 - Math.exp(-s / (kind === 2 ? .045 + corner : corner));
      const normal = Math.pow(s, 30 + corner * 500), pound = (sigmoid((s - knee) / corner) - sigmoid(-knee / corner)) / (sigmoid((1 - knee) / corner) - sigmoid(-knee / corner)), gas = Math.pow(s, exponent);
      const lower = kind === 0 ? normal : kind === 1 ? pound : kind === 2 ? gas : .55 * pound + .45 * gas;
      const raw = branch === 'up' ? upper : lower;
      return base + offset + amplitude * (raw + tilt * s + (r() - .5) * 2 * noise);
    }
    for (let i = 0; i <= n; i++) { const s = i / n; points.push({ displacement_m: .1 + stroke * s, load_kN: load(s, 'up'), branch: 'up', phase: i / (2 * n + 2) }); }
    for (let i = n; i >= 0; i--) { const s = i / n; points.push({ displacement_m: .1 + stroke * s, load_kN: load(s, 'down'), branch: 'down', phase: (2 * n + 1 - i) / (2 * n + 2) }); }
    return { points, groupId, cardId: groupId + '-C' + seed, type: 'synthetic_downhole_pump_card', units: { displacement: 'm', load: 'kN', area: 'kJ/cycle' } };
  }
  function polygonArea(points) { let a = 0; for (let i = 0; i < points.length; i++) { const p = points[i], q = points[(i + 1) % points.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  function extract(card) {
    const raw = card.points, xs = raw.map(p => p.displacement_m), ys = raw.map(p => p.load_kN), loX = Math.min(...xs), hiX = Math.max(...xs), loY = Math.min(...ys), hiY = Math.max(...ys), dx = hiX - loX, dy = hiY - loY;
    if (!(dx > 1e-8 && dy > 1e-8)) throw Error('曲线缺少有效位移或载荷跨度');
    const points = raw.map(p => [ (p.displacement_m - loX) / dx, (p.load_kN - loY) / dy ]), up = [], down = [];
    raw.forEach((p, i) => (p.branch === 'up' ? up : down).push(points[i])); up.sort((a, b) => a[0] - b[0]); down.sort((a, b) => a[0] - b[0]);
    if (!up.length || !down.length) throw Error('缺少上冲程或下冲程');
    const smooth = a => a.map((p, i) => [p[0], mean(a.slice(Math.max(0, i - 2), Math.min(a.length, i + 3)).map(q => q[1]))]), su = smooth(up), sd = smooth(down);
    const at = (a, x) => a.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, a[0])[1];
    const gap = [.2, .4, .6, .8].map(x => at(su, x) - at(sd, x)), area = polygonArea(points), lowerMean = mean(sd.map(p => p[1]));
    const slope = sd.slice(4).map((p, i) => (p[1] - sd[i][1]) / (p[0] - sd[i][0])), roughness = mean(down.slice(1, -1).map((p, i) => Math.abs(p[1] - (down[i][1] + down[i + 2][1]) / 2)));
    const below = v => sd.filter(p => p[1] >= v).length / sd.length;
    const transitionWidth = Math.max(0, below(.2) - below(.8));
    const values = [area, ...gap, lowerMean, Math.max(...slope), transitionWidth];
    return { values, areaRatio: area, work_kJ: polygonArea(raw.map(p => [p.displacement_m, p.load_kN])), transitionWidth, maxSlope: Math.max(...slope), roughness, stroke_m: dx, loadRange_kN: dy, points, up: su, down: sd };
  }
  function makeDataset(seed = 17, options = {}) {
    const groups = { train: [], validation: [], test: [] }, train = [], validation = [], observations = [], evaluationTruth = [];
    [ ['train', 18, 10000], ['validation', 6, 30000], ['test', 8, 50000] ].forEach(([split, count, start]) => {
      for (let w = 0; w < count; w++) {
        const groupId = split.toUpperCase() + '-WELL-' + (w + 1); groups[split].push(groupId);
        for (let kind = 0; kind < 3; kind++) for (let cycle = 0; cycle < 3; cycle++) {
          const wellSeed = seed + start + w * 107, cardSeed = wellSeed + kind * 401 + cycle * 19;
          const card = makeCard(cardSeed, kind, { ...(split === 'test' ? options : {}), wellSeed }, groupId);
          // Every well and every curve variant stays in exactly one split.
          if (split === 'test') { observations.push(card); evaluationTruth.push(kind); } else (split === 'train' ? train : validation).push({ card, label: kind });
        }
      }
    });
    return { seed, train, validation, test: { observations, evaluationTruth }, groups, dataNature: 'synthetic_teaching', version: 'pr1-downhole-card-v1' };
  }
  function scaleFit(rows) {
    const d = rows[0].length, center = Array.from({ length: d }, (_, j) => mean(rows.map(x => x[j]))), scale = center.map((m, j) => Math.sqrt(mean(rows.map(x => (x[j] - m) ** 2))) || 1);
    return { center, scale };
  }
  const transform = (x, scaler) => x.map((v, j) => (v - scaler.center[j]) / scaler.scale[j]);
  function nearest(x, model, k) {
    const z = transform(x, model.scaler); return model.rows.map(row => ({ distance: Math.sqrt(mean(row.z.map((v, j) => (v - z[j]) ** 2))), label: row.label, card: row.card })).sort((a, b) => a.distance - b.distance).slice(0, k);
  }
  function classify(card, model, supportThreshold = .6) {
    const feature = extract(card), neighbors = nearest(feature.values, model, model.k), votes = [0, 0, 0]; neighbors.forEach(n => votes[n.label] += 1 / (n.distance + .08));
    const label = votes.indexOf(Math.max(...votes)), support = votes[label] / votes.reduce((a, b) => a + b, 0), distance = neighbors[0].distance;
    const reasons = []; if (support < supportThreshold) reasons.push('近邻投票分散'); if (distance > model.domainDistance) reasons.push('形状超出验证近邻范围'); if (feature.roughness > model.roughnessLimit) reasons.push('载荷噪声过大');
    return { label: reasons.length ? null : label, candidate: label, support, distance, reasons, feature, neighbors: neighbors.map(n => ({ distance: n.distance, label: n.label, cardId: n.card.cardId, card: n.card })) };
  }
  function metrics(pred, truth) {
    if (pred.length !== truth.length) throw Error('预测与评价真值分母不一致');
    const matrix = Array.from({ length: 3 }, () => Array(4).fill(0)); truth.forEach((t, i) => matrix[t][pred[i] === null ? 3 : pred[i]]++);
    const recalls = matrix.map((row, i) => { const n = row.reduce((a, b) => a + b, 0); return n ? row[i] / n : null; });
    const perClass = matrix.map((row, i) => { const tp = row[i], actual = row.reduce((a, b) => a + b, 0), predicted = matrix.reduce((s, r) => s + r[i], 0); return { name: names[i], actual, predicted, TP: tp, recall: actual ? tp / actual : null, F1: actual + predicted ? 2 * tp / (actual + predicted) : null }; });
    const accepted = pred.filter(x => x !== null).length, correct = pred.reduce((n, p, i) => n + (p === truth[i] ? 1 : 0), 0), count = truth.length;
    const validF1s = perClass.filter(x => x.F1 !== null).map(x => x.F1);
    return { matrix, perClass, recalls, macroF1: validF1s.length ? mean(validF1s) : null, count, accepted, correct, rejected: count - accepted, coverage: count ? accepted / count : null, acceptedError: accepted ? (accepted - correct) / accepted : null, accuracy: count ? correct / count : null };
  }
  function baseline(card, model) { const area = extract(card).areaRatio; return area >= model.baseline.normal ? 0 : area < model.baseline.pound ? 1 : 2; }
  function train(data) {
    const raw = data.train.map(x => ({ ...x, feature: extract(x.card) })), scaler = scaleFit(raw.map(x => x.feature.values)), rows = raw.map(x => ({ card: x.card, label: x.label, z: transform(x.feature.values, scaler) }));
    const shell = { scaler, rows, domainDistance: Infinity, roughnessLimit: Infinity }, grid = [];
    for (const k of [3, 5, 7, 9]) { const model = { ...shell, k }, p = data.validation.map(x => classify(x.card, model, 0).label), m = metrics(p, data.validation.map(x => x.label)); grid.push({ k, macroF1: m.macroF1 }); }
    const k = grid.slice().sort((a, b) => b.macroF1 - a.macroF1 || a.k - b.k)[0].k;
    let best = { macroF1: -1, normal: .8, pound: .5 };
    for (const normal of [.73, .78, .83, .88]) for (const pound of [.4, .45, .5, .55, .6]) {
      const p = data.validation.map(x => { const a = extract(x.card).areaRatio; return a >= normal ? 0 : a < pound ? 1 : 2; }), m = metrics(p, data.validation.map(x => x.label));
      if (m.macroF1 > best.macroF1) best = { normal, pound, macroF1: m.macroF1 };
    }
    const distances = data.validation.map(x => nearest(extract(x.card).values, shell, 1)[0].distance).sort((a, b) => a - b), rough = raw.map(x => x.feature.roughness).sort((a, b) => a - b);
    return { ...shell, k, grid, baseline: best, domainDistance: distances[Math.floor((distances.length - 1) * .98)] * 1.65, roughnessLimit: rough[Math.floor((rough.length - 1) * .98)] * 1.8,
      trainingRows: data.train.length, validationRows: data.validation.length, groups: { train: data.groups.train.slice(), validation: data.groups.validation.slice() } };
  }
  function infer(observations, model, supportThreshold = .6) { return { results: observations.map(card => classify(card, model, supportThreshold)), baseline: observations.map(card => baseline(card, model)), supportThreshold }; }
  function evaluate(pred, truth) { return { model: metrics(pred.results.map(x => x.label), truth), baseline: metrics(pred.baseline, truth), nature: 'synthetic_teaching', truthRole: 'evaluation_only' }; }
  g.PR1Core = { rng, names, colors, mean, makeCard, polygonArea, extract, makeDataset, scaleFit, transform, nearest, classify, train, infer, evaluate, metrics, baseline };
})(globalThis);
