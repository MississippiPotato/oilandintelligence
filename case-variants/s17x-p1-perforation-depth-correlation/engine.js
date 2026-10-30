(function (g) {
  'use strict';
  const VERSION = '1.0.0', DATA_VERSION = 'gr-ccl-synthetic-1.0.0';
  const DEFAULTS = Object.freeze({ scenario: 'standard', noise: 2, targetThickness: 2, searchLimit: 12, thresholdK: 2.3, seed: 17 });
  const POLICY = Object.freeze({ step: 0.1, minNCC: 0.65, minMatches: 4, minMatchRatio: 0.60, maxMedianResidual: 0.20, matchTolerance: 0.35, ambiguityGap: 0.035, peakSeparation: 2, minReferenceSD: 0.5 });
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const median = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; };
  const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  const round = (v, d) => Math.round(v * 10 ** (d === undefined ? 6 : d)) / 10 ** (d === undefined ? 6 : d);
  function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normalizeConfig(config) {
    const c = Object.assign({}, DEFAULTS, config || {});
    c.scenario = ['standard', 'missing', 'interference', 'periodic', 'flat'].includes(c.scenario) ? c.scenario : 'standard';
    for (const [key, lo, hi] of [['noise', 0, 10], ['targetThickness', 0.5, 4], ['searchLimit', 2, 12], ['thresholdK', 1.6, 3.8], ['seed', 1, 99999]]) {
      const v = Number(c[key]); c[key] = Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : DEFAULTS[key]));
    }
    c.seed = Math.round(c.seed); return c;
  }
  function grid(a, b, step) { return Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => round(a + i * step, 4)); }
  function interpolate(axis, values, x) {
    const u = (x - axis[0]) / (axis[1] - axis[0]), i = Math.floor(u), f = u - i;
    if (i < 0 || i >= values.length - 1) return Math.abs(x - axis[axis.length - 1]) < 1e-7 ? values[values.length - 1] : null;
    return values[i] * (1 - f) + values[i + 1] * f;
  }
  function makeObservation(config) {
    const c = normalizeConfig(config), random = rng(c.seed), phase = (c.seed % 11) * 0.11;
    const actualDelta = c.seed === 17 ? 3.37 : round(-7.8 + random() * 16.8, 3);
    const refDepth = grid(985, 1095, 0.1), recordedDepth = grid(1000, 1080, 0.1);
    function lithology(z) {
      if (c.scenario === 'flat') return 60;
      if (c.scenario === 'periodic') return 60 + 18 * Math.sin(2 * Math.PI * (z - 1000) / 8);
      return 64 + 12 * Math.sin((z - 1000) / 7.3 + phase) + 8 * Math.cos((z - 1000) / 2.1 + phase) + 20 * Math.exp(-(((z - 1037 - phase) / 2.3) ** 2) / 2) - 22 * Math.exp(-(((z - 1051) / 3.8) ** 2) / 2);
    }
    const referenceGR = refDepth.map(z => round(lithology(z), 5));
    const measuredGR = recordedDepth.map(d => round(1.12 * lithology(d + actualDelta) + 7 + (random() + random() + random() - 1.5) * c.noise * 2, 5));
    const collarDepths = c.scenario === 'periodic' || c.scenario === 'flat' ? grid(992, 1088, 8) : [992, 1000, 1008, 1016, 1024, 1030, 1039, 1047, 1055, 1063, 1071, 1079, 1087];
    const absent = c.scenario === 'missing' ? 1039 : null;
    function bipolar(d, center, amplitude) { const q = (d - center) / 0.14; return amplitude * q * Math.exp((1 - q * q) / 2); }
    const measuredCCL = recordedDepth.map(d => {
      let value = (random() + random() - 1) * (0.014 + c.noise * 0.004);
      collarDepths.forEach(z => { if (z !== absent) value += bipolar(d, z - actualDelta, 1 + 0.08 * Math.sin(z)); });
      if (c.scenario === 'interference') value += bipolar(d, 1042.2, 2.4) + 1.8 * Math.exp(-(((d - 1028.4) / 0.12) ** 2) / 2);
      return round(value, 6);
    });
    return {
      observation: { id: 'GRCCL-' + c.seed + '-' + c.scenario, datasetVersion: DATA_VERSION, dataNature: 'synthetic_teaching', reference: { depth: refDepth, gr: referenceGR, collarDepths }, measured: { recordedDepth, gr: measuredGR, ccl: measuredCCL }, target: { center: 1041, thickness: c.targetThickness, interval: [1041 - c.targetThickness / 2, 1041 + c.targetThickness / 2] }, units: { depth: 'm', gr: 'relative_teaching_reading', ccl: 'relative_induced_amplitude' }, description: { scenario: c.scenario, noise: c.noise, samplingStep: 0.1 } },
      evaluationTruth: { actualDelta, trueCollarsRecorded: collarDepths.filter(z => z !== absent).map(z => round(z - actualDelta, 6)), targetInterval: [1041 - c.targetThickness / 2, 1041 + c.targetThickness / 2] }
    };
  }
  function correlationAt(observation, delta) {
    const a = [], b = [], { reference: r, measured: m } = observation;
    for (let i = 0; i < m.recordedDepth.length; i++) {
      const d = m.recordedDepth[i]; if (d < 1012 || d > 1068) continue;
      const value = interpolate(r.depth, r.gr, d + delta); if (value === null) continue;
      a.push(value); b.push(m.gr[i]);
    }
    const ma = mean(a), mb = mean(b); let ab = 0, aa = 0, bb = 0;
    for (let i = 0; i < a.length; i++) { const x = a[i] - ma, y = b[i] - mb; ab += x * y; aa += x * x; bb += y * y; }
    return { ncc: aa > 1e-10 && bb > 1e-10 ? ab / Math.sqrt(aa * bb) : null, count: a.length, referenceSD: Math.sqrt(aa / Math.max(1, a.length)) };
  }
  function detectCollars(observation, thresholdK) {
    const { recordedDepth: d, ccl: x } = observation.measured, positive = [], negative = [], thresholds = [];
    const k = Math.max(1.6, Math.min(3.8, Number(thresholdK) || DEFAULTS.thresholdK));
    for (let i = 0; i < x.length; i++) {
      const window = x.slice(Math.max(0, i - 20), Math.min(x.length, i + 21)), m = mean(window), s = Math.max(0.005, sd(window));
      thresholds.push({ depth: d[i], upper: m + k * s, lower: m - k * s });
      if (i < 1 || i >= x.length - 1) continue;
      if (x[i] > x[i - 1] && x[i] >= x[i + 1] && x[i] > m + k * s) positive.push(i);
      if (x[i] < x[i - 1] && x[i] <= x[i + 1] && x[i] < m - k * s) negative.push(i);
    }
    const raw = [];
    positive.forEach(p => {
      const n = negative.filter(i => i < p && d[p] - d[i] <= 0.6).pop();
      if (n === undefined) return;
      const depth = (d[p] + d[n]) / 2; if (depth < 1002 || depth > 1078) return;
      raw.push({ recordedDepth: round(depth, 6), amplitude: Math.abs(x[p]) + Math.abs(x[n]), negativeIndex: n, positiveIndex: p });
    });
    const candidates = [];
    raw.slice().sort((a, b) => b.amplitude - a.amplitude).forEach(item => { if (candidates.every(c => Math.abs(c.recordedDepth - item.recordedDepth) >= 2.5)) candidates.push(item); });
    candidates.sort((a, b) => a.recordedDepth - b.recordedDepth);
    return { candidates, thresholds, thresholdK: k, positivePeaks: positive.length, negativePeaks: negative.length };
  }
  function matchCollars(observation, detections, delta) {
    const reference = observation.reference.collarDepths, used = new Set(), matches = [], unmatched = [];
    detections.candidates.forEach((item, index) => {
      let best = null;
      reference.forEach((z, j) => { const residual = item.recordedDepth + delta - z; if (!used.has(j) && Math.abs(residual) <= POLICY.matchTolerance + 1e-8 && (!best || Math.abs(residual) < Math.abs(best.residual))) best = { candidateIndex: index, referenceIndex: j, recordedDepth: item.recordedDepth, referenceDepth: z, residual: round(residual, 6) }; });
      if (best) { used.add(best.referenceIndex); matches.push(best); } else unmatched.push({ candidateIndex: index, recordedDepth: item.recordedDepth, correctedDepth: round(item.recordedDepth + delta, 6) });
    });
    const residuals = matches.map(m => Math.abs(m.residual)), spacingResiduals = [];
    for (let i = 1; i < matches.length; i++) spacingResiduals.push(round((matches[i].recordedDepth - matches[i - 1].recordedDepth) - (matches[i].referenceDepth - matches[i - 1].referenceDepth), 6));
    const medianResidual = median(residuals), matchRatio = matches.length / Math.max(1, detections.candidates.length);
    const expectedCount = reference.filter(z => z - delta >= 1002 && z - delta <= 1078).length;
    const pass = matches.length >= POLICY.minMatches && matchRatio >= POLICY.minMatchRatio && medianResidual !== null && medianResidual <= POLICY.maxMedianResidual + 1e-8;
    return { matches, unmatched, matchedCount: matches.length, detectedCount: detections.candidates.length, expectedCount, possibleMissingCount: Math.max(0, expectedCount - matches.length), matchRatio, medianResidual, spacingResiduals, medianSpacingResidual: median(spacingResiduals.map(Math.abs)), pass };
  }
  function infer(observation, settings) {
    if (!observation || !observation.reference || !observation.measured) throw Error('缺少参考资料或当前观测');
    const c = normalizeConfig(settings), detection = detectCollars(observation, c.thresholdK), shifts = grid(-c.searchLimit, c.searchLimit, POLICY.step);
    const curve = shifts.map(delta => { const n = correlationAt(observation, delta), m = matchCollars(observation, detection, delta); return { delta, ncc: n.ncc, referenceSD: n.referenceSD, matchedCount: m.matchedCount, matchRatio: m.matchRatio, medianResidual: m.medianResidual, cclPass: m.pass }; });
    const localPeaks = curve.filter((p, i) => p.ncc !== null && (i === 0 || curve[i - 1].ncc === null || p.ncc >= curve[i - 1].ncc) && (i === curve.length - 1 || curve[i + 1].ncc === null || p.ncc >= curve[i + 1].ncc));
    const peaks = [];
    localPeaks.sort((a, b) => b.ncc - a.ncc || a.delta - b.delta).forEach(p => { if (peaks.every(q => Math.abs(p.delta - q.delta) >= POLICY.peakSeparation)) peaks.push(p); });
    const verified = peaks.filter(p => p.cclPass), best = verified[0] || peaks[0] || null, second = verified[1] || null;
    const gap = best && second ? best.ncc - second.ncc : null, reasons = [];
    let status = 'accepted';
    if (!best || best.referenceSD < POLICY.minReferenceSD) { status = 'insufficient'; reasons.push('参考GR变化太小，无法形成稳定的形态参照。'); }
    if (!best || !best.cclPass) { status = 'insufficient'; reasons.push('没有候选同时通过接箍数量、匹配比例与残差核对。'); }
    if (best && best.ncc < POLICY.minNCC) { status = 'insufficient'; reasons.push('最优形态相关不足。'); }
    if (best && Math.abs(best.delta) >= c.searchLimit - 1e-8) { status = 'insufficient'; reasons.push('最优点在搜索边界，应先核对搜索范围。'); }
    if (status === 'accepted' && gap !== null && gap < POLICY.ambiguityGap) { status = 'ambiguous'; reasons.push('两个独立位置的形态和接箍都能对应，现有资料不能唯一定位。'); }
    if (status === 'accepted') reasons.push('当前候选通过GR形态与接箍对应核对，仍需人工复核。');
    const delta = status === 'accepted' ? best.delta : null, target = observation.target.interval.slice();
    return { method: 'gr_ncc_with_ccl_consistency', observationId: observation.id, status, accepted: status === 'accepted', delta, bestCandidate: best, independentPeaks: peaks.slice(0, 8), candidateGap: gap, searchCount: curve.length, searchLimit: c.searchLimit, thresholdK: c.thresholdK, curve, detection, collarMatch: best ? matchCollars(observation, detection, best.delta) : null, reasons, targetInterval: target, commandInterval: delta === null ? null : target.map(z => round(z - delta, 6)), baseline: { method: 'zero_depth_correction', delta: 0, commandInterval: target.slice() }, policy: Object.assign({}, POLICY) };
  }
  function intervalMetrics(target, placed) {
    const intersection = Math.max(0, Math.min(target[1], placed[1]) - Math.max(target[0], placed[0])), union = Math.max(target[1], placed[1]) - Math.min(target[0], placed[0]);
    return { targetCoverage: intersection / (target[1] - target[0]), IoU: union > 0 ? intersection / union : 0, intersectionLength: intersection };
  }
  function evaluate(prediction, evaluationTruth) {
    function score(delta) {
      const actualInterval = prediction.targetInterval.map(z => round(z - delta + evaluationTruth.actualDelta, 6));
      return Object.assign({ delta, actualDelta: evaluationTruth.actualDelta, absoluteError: Math.abs(delta - evaluationTruth.actualDelta), actualInterval }, intervalMetrics(prediction.targetInterval, actualInterval));
    }
    return { model: prediction.accepted ? score(prediction.delta) : null, baseline: score(0), status: prediction.status, targetInterval: prediction.targetInterval.slice(), evaluationStage: 'after_prediction_frozen' };
  }
  function benchmark(config) {
    const c = normalizeConfig(config), scenarios = ['standard', 'missing', 'interference', 'standard', 'periodic', 'flat', 'missing', 'interference', 'standard', 'periodic', 'standard', 'interference'];
    const records = scenarios.map((scenario, i) => { const pair = makeObservation(Object.assign({}, c, { seed: 1001 + i, scenario })); return { pair, prediction: infer(pair.observation, c), seed: 1001 + i, scenario }; });
    const rows = records.map(r => ({ id: r.pair.observation.id, seed: r.seed, scenario: r.scenario, prediction: { status: r.prediction.status, delta: r.prediction.delta, bestCandidate: r.prediction.bestCandidate, searchCount: r.prediction.searchCount }, evaluation: evaluate(r.prediction, r.pair.evaluationTruth) }));
    const accepted = rows.filter(r => r.evaluation.model), agg = (items, which) => ({ count: items.length, MAE: items.length ? mean(items.map(r => r.evaluation[which].absoluteError)) : null, meanIoU: items.length ? mean(items.map(r => r.evaluation[which].IoU)) : null, meanTargetCoverage: items.length ? mean(items.map(r => r.evaluation[which].targetCoverage)) : null });
    return { datasetVersion: DATA_VERSION, split: '12_complete_independent_records_seeds_1001_to_1012', count: rows.length, acceptedCount: accepted.length, acceptanceRate: accepted.length / rows.length, ambiguousCount: rows.filter(r => r.prediction.status === 'ambiguous').length, insufficientCount: rows.filter(r => r.prediction.status === 'insufficient').length, modelAccepted: agg(accepted, 'model'), baselineSameAccepted: agg(accepted, 'baseline'), baselineAll: agg(rows, 'baseline'), rows };
  }
  function run(config) {
    const c = normalizeConfig(config), pair = makeObservation(c), prediction = infer(pair.observation, c), independent = benchmark(c);
    const evaluation = evaluate(prediction, pair.evaluationTruth);
    return { version: VERSION, datasetVersion: DATA_VERSION, config: c, observation: pair.observation, prediction, evaluation, benchmark: independent, evaluationTruth: pair.evaluationTruth };
  }
  g.VariantEngine = { VERSION, DATA_VERSION, DEFAULTS, POLICY, normalizeConfig, makeObservation, correlationAt, detectCollars, matchCollars, infer, evaluate, benchmark, run, intervalMetrics };
})(globalThis);
