(function (g) {
  'use strict';
  const ID = 's17x-c1-cement-woc-strength';
  const DEFAULTS = {temperature: 50, program: 'ramp', target: 10, cursor: 24};
  const AGES = [4, 8, 12, 18, 24, 36, 48, 60, 72];
  const GRID = [20, 25, 30, 35, 40, 45, 50];
  const clone = x => JSON.parse(JSON.stringify(x));
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function rng(seed) { let x = seed >>> 0; return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; }; }
  function normal(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-10, r()))) * Math.cos(2 * Math.PI * r()); }
  function rate(T, energy) { return Math.exp(-energy * 1000 / 8.314462618 * (1 / (T + 273.15) - 1 / 323.15)); }
  function temperature(t, target, program) {
    if (program === 'constant') return target;
    if (program === 'cool') return target + (25 - target) * Math.exp(-t / 2.5) - Math.max(0, t - 24) / 48 * Math.min(12, target - 25);
    if (program === 'delayed') return 25 + (target - 25) * (1 - Math.exp(-Math.max(0, t - 8) / 2));
    return 25 + (target - 25) * (1 - Math.exp(-t / 2));
  }
  function interpolate(points, x, key) {
    if (x <= points[0].time) return points[0][key];
    for (let i = 1; i < points.length; i++) if (x <= points[i].time) {
      const a = points[i - 1], b = points[i], f = (x - a.time) / (b.time - a.time);
      if (f === 1) return b[key];
      if (f === 0) return a[key];
      return a[key] === null || b[key] === null ? null : a[key] + f * (b[key] - a[key]);
    }
    return points[points.length - 1][key];
  }
  function equivalentAge(points, energy) {
    let age = 0;
    return points.map((p, i) => {
      if (i) { const a = points[i - 1]; age += (p.time - a.time) * (rate(a.temperature, energy) + rate(p.temperature, energy)) / 2; }
      return {time: p.time, temperature: p.temperature, equivalentAge: age};
    });
  }
  function makeEpisode(id, target, program, random) {
    const capacity = 24 + normal(random) * 1.1, energy = 33 + normal(random) * 1.4;
    const tau = 18 + normal(random) * 1.1, induction = 3 + normal(random) * .25;
    const fine = []; let age = 0;
    for (let i = 0; i <= 720; i++) {
      const t = i / 10, T = temperature(t, target, program);
      if (i) age += .1 * (rate(T, energy) + rate(temperature(t - .1, target, program), energy)) / 2;
      const a = Math.max(0, age - induction);
      const strength = capacity * (.8 * Math.pow(1 - Math.exp(-a / tau), 1.3) + .2 * (1 - Math.exp(-a / (3 * tau))));
      fine.push({time: t, strength});
    }
    const observation = {id, program, temperatureSetpoint: target, points: Array.from({length: 145}, (_, i) => ({time: i / 2, temperature: temperature(i / 2, target, program)}))};
    const samples = AGES.map(time => ({time, strength: Math.max(0, interpolate(fine, time, 'strength') + .12 * normal(random))}));
    return {observation, truth: {id, curve: fine, samples}};
  }
  function generate() {
    const tr = rng(41201), va = rng(51201), te = rng(61201);
    const training = Array.from({length: 12}, (_, i) => {
      const e = makeEpisode('WT' + String(i + 1).padStart(2, '0'), [30, 40, 50, 60, 70, 80][i % 6], 'ramp', tr);
      return {observation: e.observation, samples: e.truth.samples};
    });
    const validation = [35, 45, 55, 75].map((T, i) => { const e = makeEpisode('WV0' + (i + 1), T, i % 2 ? 'cool' : 'delayed', va); return {observation: e.observation, samples: e.truth.samples}; });
    const tests = [25, 35, 45, 55, 65, 75, 40, 70].map((T, i) => makeEpisode('WX0' + (i + 1), T, ['constant', 'ramp', 'cool', 'delayed'][i % 4], te));
    return {training, validation, observations: tests.map(e => e.observation), evaluationTruth: tests.map(e => e.truth)};
  }
  function isotonic(samples) {
    const sorted = samples.slice().sort((a, b) => a.x - b.x), groups = [];
    sorted.forEach(p => { const last = groups[groups.length - 1]; if (last && Math.abs(last.x - p.x) < 1e-8) { last.sum += p.y; last.weight++; } else groups.push({x: p.x, sum: p.y, weight: 1}); });
    const blocks = [];
    groups.forEach((p, i) => {
      blocks.push({start: i, end: i, sum: p.sum, weight: p.weight});
      while (blocks.length > 1) {
        const a = blocks[blocks.length - 2], b = blocks[blocks.length - 1];
        if (a.sum / a.weight <= b.sum / b.weight) break;
        blocks.splice(-2, 2, {start: a.start, end: b.end, sum: a.sum + b.sum, weight: a.weight + b.weight});
      }
    });
    const curve = []; blocks.forEach(b => { for (let i = b.start; i <= b.end; i++) curve.push({x: groups[i].x, y: Math.max(0, b.sum / b.weight)}); });
    if (curve[0].x > 0) curve.unshift({x: 0, y: 0});
    return curve;
  }
  function predict(curve, x) {
    if (x < 0 || x > curve[curve.length - 1].x) return null;
    for (let i = 1; i < curve.length; i++) if (x <= curve[i].x) {
      const a = curve[i - 1], b = curve[i]; return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
    }
    return curve[curve.length - 1].y;
  }
  function fitForEnergy(training, energy) {
    const samples = [];
    training.forEach(e => { const ages = equivalentAge(e.observation.points, energy); e.samples.forEach(s => samples.push({x: interpolate(ages, s.time, 'equivalentAge'), y: s.strength, id: e.observation.id})); });
    return {energy, curve: isotonic(samples), samples};
  }
  function fit(training, validation) {
    const candidates = GRID.map(energy => {
      const model = fitForEnergy(training, energy), errors = [];
      validation.forEach(e => { const ages = equivalentAge(e.observation.points, energy); e.samples.forEach(s => { const p = predict(model.curve, interpolate(ages, s.time, 'equivalentAge')); if (p !== null) errors.push(Math.abs(p - s.strength)); }); });
      return {energy, mae: mean(errors), n: errors.length};
    });
    candidates.sort((a, b) => b.n - a.n || a.mae - b.mae || a.energy - b.energy);
    const model = fitForEnergy(training, candidates[0].energy);
    model.validation = candidates.slice().sort((a, b) => a.energy - b.energy);
    model.selection = {rule: 'validation coverage then MAE; no test labels', selectedEnergy: model.energy, trainBatches: training.length, validationBatches: validation.length};
    model.baselineCurve = isotonic(training.filter(e => e.observation.temperatureSetpoint === 50).flatMap(e => e.samples.map(s => ({x: s.time, y: s.strength}))));
    return model;
  }
  function crossing(curve, target, key) {
    for (let i = 0; i < curve.length; i++) if (curve[i][key] !== null && curve[i][key] >= target) {
      if (!i || curve[i - 1][key] === null) return curve[i].time;
      const a = curve[i - 1], b = curve[i]; return a.time + (b.time - a.time) * (target - a[key]) / Math.max(1e-12, b[key] - a[key]);
    }
    return null;
  }
  function infer(observation, model, options) {
    const target = Number(options.target), supported = observation.points.every(p => Number.isFinite(p.temperature) && p.temperature >= 25 && p.temperature <= 80);
    const ages = equivalentAge(observation.points, model.energy);
    const curve = ages.map(p => ({...p, strength: supported ? predict(model.curve, p.equivalentAge) : null, baseline: predict(model.baselineCurve, p.time)}));
    const time = supported ? crossing(curve, target, 'strength') : null;
    return {id: observation.id, target, supported, status: !supported ? '超出温度校准域，未知' : time === null ? '72 h内未预测达到目标' : '预测达到目标', time, baselineTime: crossing(curve, target, 'baseline'), curve};
  }
  function evaluate(predictions, truths, target) {
    function score(key, timeKey) {
      const strengthErrors = [], timeErrors = []; let early = 0, falseAttained = 0, missed = 0, referenceNotAttained = 0;
      const rows = predictions.map((p, i) => {
        const t = truths[i], referenceTime = crossing(t.curve, target, 'strength'), predictedTime = p[timeKey];
        t.samples.forEach(s => { const v = interpolate(p.curve, s.time, key); if (v !== null && Number.isFinite(v)) strengthErrors.push(Math.abs(v - s.strength)); });
        if (referenceTime === null) referenceNotAttained++;
        if (referenceTime !== null && predictedTime !== null) { timeErrors.push(Math.abs(predictedTime - referenceTime)); if (predictedTime < referenceTime - 1) early++; }
        if (referenceTime === null && predictedTime !== null) falseAttained++;
        if (referenceTime !== null && predictedTime === null) missed++;
        return {id: p.id, predictedTime, referenceTime};
      });
      return {strengthMAE: mean(strengthErrors), strengthN: strengthErrors.length, strengthTotal: truths.length * AGES.length, timeMAE: mean(timeErrors), pairedTimeN: timeErrors.length, earlyByOver1h: early, falseAttained, missedAttained: missed, referenceNotAttained, totalBatches: truths.length, rows};
    }
    return {model: score('strength', 'time'), baseline: score('baseline', 'baselineTime')};
  }
  const fixed = generate(), fitted = fit(fixed.training, fixed.validation);
  function run(input) {
    const params = {...DEFAULTS, ...input}; params.temperature = Number(params.temperature); params.target = Number(params.target); params.cursor = Number(params.cursor);
    const episode = makeEpisode('WQ01', params.temperature, params.program, rng(81201));
    const prediction = infer(episode.observation, fitted, params);
    const testPredictions = fixed.observations.map(o => infer(o, fitted, params));
    return {schemaVersion: '1.0', caseId: ID, sceneId: 'c1', version: '1.0.0', params, dataPolicy: 'fixed-seed synthetic laboratory teaching data', protocol: {seeds: {training: 41201, validation: 51201, test: 61201, query: 81201}, splitUnit: 'whole independent batch', trainBatches: 12, validationBatches: 4, testBatches: 8, pointsPerTestBatch: 9, calibrationTemperatureC: [25, 80]}, model: clone(fitted), observation: episode.observation, inference: prediction, evaluation: {current: {referenceTime: crossing(episode.truth.curve, params.target, 'strength'), samples: episode.truth.samples, curve: episode.truth.curve}, heldout: evaluate(testPredictions, fixed.evaluationTruth, params.target)}};
  }
  g.VariantEngine = {id: ID, defaults: clone(DEFAULTS), generate, infer, evaluate, fit, fitForEnergy, equivalentAge, predict, crossing, rate, temperature, run, model: clone(fitted), dataset: clone(fixed)};
})(globalThis);
