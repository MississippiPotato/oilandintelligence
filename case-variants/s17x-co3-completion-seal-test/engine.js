(function (g) {
  'use strict';
  const ID = 's17x-co3-completion-seal-test';
  const DEFAULTS = {scenario: 'cool', drift: -1.5, volume: 1200, start: 8, end: 32, limit: .01, cursor: 20};
  const clone = x => JSON.parse(JSON.stringify(x));
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function rng(seed) { let x = seed >>> 0; return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; }; }
  function normal(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-10, r()))) * Math.cos(2 * Math.PI * r()); }
  function regression(x, y) {
    const mx = mean(x), my = mean(y), sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0);
    if (x.length < 3 || sxx <= 0) return null;
    const slope = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / sxx, intercept = my - slope * mx;
    const residuals = y.map((v, i) => v - intercept - slope * x[i]);
    const residualSD = Math.sqrt(residuals.reduce((s, v) => s + v * v, 0) / (x.length - 2));
    return {slope, intercept, residuals, residualSD, slopeSE: residualSD / Math.sqrt(sxx), n: x.length};
  }
  function makeCalibration() {
    const r = rng(42101), runs = [];
    for (let j = 0; j < 6; j++) {
      const beta = .72 + .012 * normal(r), delta = (j % 2 ? 1 : -1) * (1 + j * .15);
      const points = Array.from({length: 41}, (_, i) => { const dT = delta * (1 - Math.exp(-i / 10)); return {temperature: 40 + dT + .006 * normal(r), pressure: 10 + beta * dT + .002 * normal(r)}; });
      const line = regression(points.map(p => p.temperature), points.map(p => p.pressure));
      runs.push({id: 'BC0' + (j + 1), knownLeakLMin: 0, points, beta: line.slope});
    }
    const beta = mean(runs.map(x => x.beta)), betaSD = Math.sqrt(runs.reduce((s, x) => s + (x.beta - beta) ** 2, 0) / (runs.length - 1));
    return {beta, betaSD, runs, count: runs.length};
  }
  function makeEpisode(id, spec, random) {
    const C = spec.volume * .0006 * (1 + .015 * normal(random)), beta = .72 + .012 * normal(random), q0 = spec.q0;
    let P = 10, previousT = 40; const fine = [];
    for (let i = 0; i <= 800; i++) {
      const time = i * .05, T = 40 + spec.drift * (1 - Math.exp(-time / 12));
      const q = q0 * Math.sqrt(Math.max(.05, P - 2) / 8);
      if (i) P += beta * (T - previousT) - q / C * .05;
      if (spec.valve && Math.abs(time - 18) < .001) P -= .25;
      fine.push({time, pressure: P, temperature: T, leak: q}); previousT = T;
    }
    const points = fine.filter((_, i) => i % 10 === 0).map(p => ({time: p.time, pressure: p.pressure + .003 * normal(random), temperature: spec.missing && p.time >= 12 && p.time <= 24 ? null : p.temperature + .008 * normal(random), valveClosed: p.time >= 5 && !(spec.valve && p.time >= 18 && p.time <= 20)}));
    const pulses = [.1, .2, .3, .4].map(volume => ({injectedVolume: volume, pressureIncrement: volume / C + .002 * normal(random)}));
    return {observation: {id, volume: spec.volume, points, pulses, valveEvents: [{time: 5, state: 'closed'}, ...(spec.valve ? [{time: 18, state: 'open'}, {time: 20.5, state: 'closed'}] : [])]}, truth: {id, curve: fine.map(p => ({time: p.time, leak: p.leak}))}};
  }
  function generate() {
    const r = rng(62101), calibration = makeCalibration();
    const specs = [
      {q0: 0, drift: -1.5}, {q0: 0, drift: 1.5}, {q0: 0, drift: -2}, {q0: 0, drift: 2},
      {q0: .006, drift: -1.5}, {q0: .006, drift: 1.5}, {q0: .0105, drift: -.7}, {q0: .0105, drift: .7},
      {q0: .024, drift: -1.5}, {q0: .024, drift: 1.5}, {q0: .006, drift: -1.5, valve: true}, {q0: .024, drift: 1.5, missing: true}
    ];
    const episodes = specs.map((s, i) => makeEpisode('SX' + String(i + 1).padStart(2, '0'), {...s, volume: 1100 + 100 * (i % 3)}, r));
    return {calibration, observations: episodes.map(e => e.observation), evaluationTruth: episodes.map(e => e.truth)};
  }
  function fitCompliance(pulses) {
    const sxx = pulses.reduce((s, p) => s + p.pressureIncrement ** 2, 0);
    const value = pulses.reduce((s, p) => s + p.pressureIncrement * p.injectedVolume, 0) / sxx;
    const variance = pulses.reduce((s, p) => s + (p.injectedVolume - value * p.pressureIncrement) ** 2, 0) / Math.max(1, pulses.length - 1);
    return {value, se: Math.sqrt(variance / sxx), n: pulses.length};
  }
  function decision(value, lo, hi, limit) { return lo > limit ? '疑似失密' : hi <= limit ? '未检出超限漏率' : '待复核'; }
  function infer(observation, calibration, options) {
    const start = Number(options.start), end = Number(options.end), limit = Number(options.limit);
    const all = observation.points.filter(p => p.time >= start && p.time <= end), reasons = [];
    if (!(end > start)) reasons.push('窗口终点须晚于起点');
    if (all.length < 8) reasons.push('窗口少于8个样本');
    if (all.some(p => !p.valveClosed)) reasons.push('窗口内存在未闭阀记录');
    if (all.some(p => !Number.isFinite(p.temperature) || !Number.isFinite(p.pressure))) reasons.push('窗口内温度或压力缺测');
    const C = fitCompliance(observation.pulses);
    if (!(C.value > 0 && Number.isFinite(C.value))) reasons.push('加液校准无效');
    if (reasons.length) return {id: observation.id, start, end, limit, status: '证据不足', reasons, valid: false, C, sampleCount: all.length, estimate: null, low: null, high: null, baseline: null, points: []};
    const T0 = all[0].temperature;
    const points = all.map(p => ({...p, corrected: p.pressure - calibration.beta * (p.temperature - T0)}));
    const line = regression(points.map(p => p.time), points.map(p => p.corrected));
    const thermalLine = regression(points.map(p => p.time), points.map(p => p.temperature));
    const estimate = -C.value * line.slope;
    const se = Math.sqrt(C.value ** 2 * (line.slopeSE ** 2 + thermalLine.slope ** 2 * calibration.betaSD ** 2) + line.slope ** 2 * C.se ** 2);
    const low = estimate - 1.96 * se, high = estimate + 1.96 * se;
    const baseline = -C.value * (all[all.length - 1].pressure - all[0].pressure) / (all[all.length - 1].time - all[0].time);
    points.forEach((p, i) => { p.fitted = line.intercept + line.slope * p.time; p.residual = line.residuals[i]; });
    return {id: observation.id, start, end, limit, valid: true, status: decision(estimate, low, high, limit), reasons: [], estimate, low, high, se, baseline, baselineStatus: baseline > limit ? '疑似失密' : '未检出超限漏率', C, line, thermalSlope: thermalLine.slope, sampleCount: all.length, points};
  }
  function reference(truth, start, end) {
    const rows = truth.curve.filter(p => p.time >= start - 1e-8 && p.time <= end + 1e-8);
    if (rows.length < 2) return null;
    let amount = 0;
    for (let i = 1; i < rows.length; i++) amount += (rows[i].time - rows[i - 1].time) * (rows[i].leak + rows[i - 1].leak) / 2;
    return amount / (rows[rows.length - 1].time - rows[0].time);
  }
  function evaluate(predictions, truths, options) {
    const errors = [], baselineErrors = [], confusion = {below: {clear: 0, leak: 0, review: 0, invalid: 0}, above: {clear: 0, leak: 0, review: 0, invalid: 0}, unknown: {clear: 0, leak: 0, review: 0, invalid: 0}}, rows = [];
    let valid = 0, accepted = 0, review = 0, invalid = 0, intervalCovered = 0;
    predictions.forEach((p, i) => {
      const q = reference(truths[i], Number(options.start), Number(options.end)), truthClass = q === null ? 'unknown' : q > Number(options.limit) ? 'above' : 'below';
      const predClass = !p.valid ? 'invalid' : p.status === '待复核' ? 'review' : p.status === '疑似失密' ? 'leak' : 'clear';
      confusion[truthClass][predClass]++;
      if (p.valid) { valid++; errors.push(Math.abs(p.estimate - q)); baselineErrors.push(Math.abs(p.baseline - q)); if (q >= p.low && q <= p.high) intervalCovered++; if (predClass === 'review') review++; else accepted++; } else invalid++;
      rows.push({id: p.id, reference: q, referenceClass: truthClass, predicted: p.status, estimate: p.estimate, baseline: p.baseline});
    });
    return {total: predictions.length, valid, accepted, review, invalid, decisionCoverage: accepted / predictions.length, mae: mean(errors), baselineMAE: mean(baselineErrors), maeN: errors.length, intervalCovered, intervalDenominator: valid, confusion, rows};
  }
  const fixed = generate();
  function run(input) {
    const params = {...DEFAULTS, ...input}; ['drift', 'volume', 'start', 'end', 'limit', 'cursor'].forEach(k => params[k] = Number(params[k]));
    const spec = {volume: params.volume, drift: params.drift, q0: params.scenario === 'warm' ? .024 : .006, valve: params.scenario === 'valve', missing: params.scenario === 'missing'};
    const episode = makeEpisode('SQ01', spec, rng(81203));
    const prediction = infer(episode.observation, fixed.calibration, params);
    const tests = fixed.observations.map(o => infer(o, fixed.calibration, params));
    return {schemaVersion: '1.0', caseId: ID, sceneId: 'co3', version: '1.0.0', params, dataPolicy: 'fixed-seed synthetic single-phase liquid teaching tests', protocol: {seeds: {calibration: 42101, test: 62101, query: 81203}, splitUnit: 'whole independent pressure-test episode', calibrationRuns: 6, testEpisodes: 12, units: {pressure: 'MPa', temperature: 'C', time: 'min', volume: 'L', leak: 'L/min'}}, calibration: clone(fixed.calibration), observation: episode.observation, inference: prediction, evaluation: {current: {referenceLeak: reference(episode.truth, params.start, params.end)}, heldout: evaluate(tests, fixed.evaluationTruth, params)}};
  }
  g.VariantEngine = {id: ID, defaults: clone(DEFAULTS), generate, infer, evaluate, regression, fitCompliance, reference, run, dataset: clone(fixed)};
})(globalThis);
