(function (g) {
  'use strict';
  function rng(seed) { let s = seed >>> 0; return function () { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function solve(a, b) {
    const n = b.length, z = a.map((r, i) => r.slice().concat(b[i]));
    for (let j = 0; j < n; j++) {
      let p = j; for (let i = j + 1; i < n; i++) if (Math.abs(z[i][j]) > Math.abs(z[p][j])) p = i;
      [z[j], z[p]] = [z[p], z[j]]; const d = z[j][j]; if (Math.abs(d) < 1e-11) throw Error('设计矩阵退化');
      for (let k = j; k <= n; k++) z[j][k] /= d;
      for (let i = 0; i < n; i++) if (i !== j) { const f = z[i][j]; for (let k = j; k <= n; k++) z[i][k] -= f * z[j][k]; }
    }
    return z.map(r => r[n]);
  }
  function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
  function geometry(phase) {
    const count = 360 / gcd(360, phase), angles = Array.from({ length: count }, (_, i) => i * phase * Math.PI / 180);
    return { count, angles, uniformity: 1 - Math.hypot(mean(angles.map(a => Math.cos(2 * a))), mean(angles.map(a => Math.sin(2 * a)))) };
  }
  // This response produces synthetic observations and is used again only AFTER a design has been frozen.
  // The regression/predict/search functions below never call it.
  function teachingResponse(x) {
    const d = x.density / 12, p = x.penetration / 35, u = geometry(x.phase).uniformity;
    return 32 + 9 * Math.log(x.permeability / 50) + 25 * (1 - Math.exp(-x.density / 10)) + 28 * (1 - Math.exp(-x.penetration / 22))
      - 13 * x.damage / 20 * Math.exp(-x.penetration / 20) + 7 * u - 3 * (x.anisotropy - 1) * (1 - u)
      - 2.8 * d * d * p + 1.8 * Math.log(x.permeability / 50) * p;
  }
  const featureNames = ['常数', 'log(k/50)', '孔密/12', '穿深/35', '(孔密/12)²', '(穿深/35)²', '孔密×穿深', '损伤带厚度/20', '损伤×穿深', '损伤×穿深²', '径向均匀度', '各向异性×非均匀度', 'log(k)×孔密', 'log(k)×穿深'];
  function features(x) {
    const d = x.density / 12, p = x.penetration / 35, dam = x.damage / 20, lk = Math.log(x.permeability / 50), u = geometry(x.phase).uniformity;
    return [1, lk, d, p, d * d, p * p, d * p, dam, dam * p, dam * p * p, u, (x.anisotropy - 1) * (1 - u), lk * d, lk * p];
  }
  function makeDataset(seed = 17) {
    const r = rng(seed), train = [], validation = [], observations = [], evaluationTruth = [], groups = { train: [], validation: [], test: [] };
    const specs = [ ['train', 14, [4, 8, 12, 16, 20, 24], [15, 25, 35, 45, 55, 60], 60], ['validation', 4, [6, 10, 14, 18, 22], [20, 30, 40, 50, 60], 40], ['test', 6, [5, 9, 13, 17, 21, 23], [22, 32, 42, 52, 58], 40] ];
    specs.forEach(([split, n, densities, depths, count]) => {
      for (let j = 0; j < n; j++) {
        const groupId = split.toUpperCase() + '-ROCK-' + (j + 1), condition = { permeability: 20 + r() * 100, damage: 9 + r() * 17, anisotropy: 1 + r() * 1.8 }, offset = (r() - .5) * 1.5;
        groups[split].push(groupId);
        for (let i = 0; i < count; i++) {
          const density = densities[i % densities.length], penetration = depths[Math.floor(i / densities.length) % depths.length];
          // Cycle phases separately so every split contains the 180-degree geometry.
          const actualPhase = [60, 90, 120, 180][(i + j) % 4], x = { ...condition, density, penetration, phase: actualPhase };
          const row = { ...x, groupId, blockId: 'D' + density + '-P' + penetration + '-A' + actualPhase }, y = teachingResponse(x) + offset + (r() - .5) * 1.8;
          if (split === 'test') { observations.push(row); evaluationTruth.push(y); }
          else (split === 'train' ? train : validation).push({ ...row, response: y });
        }
      }
    });
    return { seed, train, validation, test: { observations, evaluationTruth }, groups, dataNature: 'synthetic_teaching', version: 'p1-rock-block-v1' };
  }
  function fit(rows, lambda) {
    const n = featureNames.length, a = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
    rows.forEach(row => { const x = features(row); for (let j = 0; j < n; j++) { b[j] += x[j] * row.response; for (let k = 0; k < n; k++) a[j][k] += x[j] * x[k]; } });
    for (let j = 1; j < n; j++) a[j][j] += lambda;
    return { beta: solve(a, b), lambda, featureNames: featureNames.slice(), trainingRows: rows.length };
  }
  function predict(x, model) { return features(x).reduce((s, v, j) => s + v * model.beta[j], 0); }
  function errors(predictions, targets) {
    if (predictions.length !== targets.length) throw Error('评价分母不一致');
    const n = targets.length; return { count: n, RMSE: n ? Math.sqrt(mean(predictions.map((p, i) => (p - targets[i]) ** 2))) : null, MAE: n ? mean(predictions.map((p, i) => Math.abs(p - targets[i]))) : null };
  }
  function train(data) {
    const grid = [.001, .01, .1, 1, 10].map(lambda => { const model = fit(data.train, lambda), score = errors(data.validation.map(x => predict(x, model)), data.validation.map(x => x.response)); return { lambda, RMSE: score.RMSE, model }; });
    const chosen = grid.slice().sort((a, b) => a.RMSE - b.RMSE)[0], baselineMean = mean(data.train.map(x => x.response));
    return { ...chosen.model, validationRows: data.validation.length, validationRMSE: chosen.RMSE, grid: grid.map(x => ({ lambda: x.lambda, RMSE: x.RMSE })), baselineMean,
      ranges: { permeability: [20, 120], damage: [9, 26], anisotropy: [1, 2.8] }, groups: { train: data.groups.train.slice(), validation: data.groups.validation.slice() } };
  }
  function costs(x) { return x.density * (.8 + (x.penetration / 25) ** 1.4) + geometry(x.phase).count * .3; }
  function crowding(x) { return x.density / 12 * x.penetration / 35; }
  function check(x, params) {
    const reasons = []; if (costs(x) > params.budget + 1e-9) reasons.push('成本点超过预算'); if (x.penetration < x.damage + params.clearance - 1e-9) reasons.push('未越过损伤带及余量'); if (crowding(x) > params.maxCrowding + 1e-9) reasons.push('拥挤指数超过上限');
    return { feasible: reasons.length === 0, reasons, cost: costs(x), crowding: crowding(x), clearance: x.penetration - x.damage };
  }
  const defaults = { permeability: 60, damage: 18, anisotropy: 1.8, budget: 60, clearance: 5, maxCrowding: 2.5, costWeight: .35 };
  function infer(params, model) {
    const rows = [], condition = { permeability: params.permeability, damage: params.damage, anisotropy: params.anisotropy };
    for (let density = 4; density <= 24; density += 2) for (let penetration = 15; penetration <= 60; penetration += 5) for (const phase of [60, 90, 120, 180]) {
      const x = { ...condition, density, penetration, phase }, quality = check(x, params), prediction = predict(x, model);
      rows.push({ ...x, ...quality, prediction, objective: prediction - params.costWeight * quality.cost });
    }
    const feasible = rows.filter(x => x.feasible), selected = feasible.slice().sort((a, b) => b.objective - a.objective || a.cost - b.cost)[0] || null;
    const baseX = { ...condition, density: 12, penetration: 35, phase: 120 }, quality = check(baseX, params), basePred = predict(baseX, model);
    const baseline = { ...baseX, ...quality, prediction: basePred, objective: basePred - params.costWeight * quality.cost };
    return { rows, selected, baseline, feasibleCount: feasible.length, candidateCount: rows.length, feasibleRate: feasible.length / rows.length,
      outOfDomain: Object.entries(model.ranges).filter(([key, range]) => params[key] < range[0] || params[key] > range[1]).map(([key]) => key), params: { ...params } };
  }
  function evaluate(pred, testObservations, evaluationTruth, model) {
    const predictions = testObservations.map(x => predict(x, model)), modelScore = errors(predictions, evaluationTruth), baselineScore = errors(testObservations.map(() => model.baselineMean), evaluationTruth);
    const real = x => { if (!x) return null; const response = teachingResponse(x); return { response, objective: response - pred.params.costWeight * x.cost }; };
    const selected = real(pred.selected), baseline = real(pred.baseline);
    // Oracle is evaluation-only: enumerate AFTER pred.selected is already fixed.
    const oracle = pred.rows.filter(x => x.feasible).map(x => ({ ...x, ...real(x) })).sort((a, b) => b.objective - a.objective)[0] || null;
    return { model: modelScore, regressionBaseline: baselineScore, predictions, targets: evaluationTruth.slice(), selected, fixedDesign: baseline, oracle,
      gainVsFeasibleFixed: selected && pred.baseline.feasible ? selected.objective - baseline.objective : null,
      objectiveGap: selected && oracle ? oracle.objective - selected.objective : null,
      testGroups: Array.from(new Set(testObservations.map(x => x.groupId))), nature: 'synthetic_teaching', truthRole: 'evaluation_only_after_selection' };
  }
  g.P1Core = { rng, mean, geometry, features, featureNames, makeDataset, fit, train, predict, infer, evaluate, check, costs, crowding, defaults, errors };
})(globalThis);
