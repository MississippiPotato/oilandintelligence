(function (g) {
  'use strict';
  const plans = [
    { id: 'open', name: '裸眼完井', short: '裸眼', cost: 24, sand: false, isolation: false, maxT: 200, color: '#367c80' },
    { id: 'perforated', name: '套管射孔', short: '射孔', cost: 47, sand: false, isolation: true, maxT: 200, color: '#5778a8' },
    { id: 'screen', name: '裸眼筛管防砂', short: '筛管', cost: 56, sand: true, isolation: false, maxT: 165, color: '#bd884c' },
    { id: 'gravel', name: '套管射孔 + 砾石充填', short: '射孔+防砂', cost: 79, sand: true, isolation: true, maxT: 185, color: '#986e96' }
  ];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  function rng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
  function observation(id, r) {
    return { wellId: id, x: [0.12 + 0.83 * r(), 0.05 + 0.9 * r(), 0.05 + 0.9 * r(), 0.03 + 0.92 * r(), 1.4 + 1.8 * r(), 65 + 125 * r()] };
  }
  function generateOutcomes(x, r) {
    const [strength, sand, heterogeneity, water, logK, temperature] = x;
    return plans.map((p, j) => {
      const contact = [1.0, 0.9, 0.92, 0.84][j];
      const inflow = 48 + 17 * (logK - 1.4) + 12 * strength + 5 * Math.sin(logK * 1.7);
      const sandLoss = (p.sand ? 3 + 4 * (1 - strength) : 38 * sand * (1.12 - strength)) * (0.8 + 0.3 * heterogeneity);
      const waterLoss = (p.isolation ? 5 * water : 26 * water * heterogeneity);
      const thermal = Math.max(0, temperature - 140) * (j === 2 ? 0.11 : 0.025);
      const completionGain = p.sand ? 9 * sand * (1 - strength) : 0;
      return inflow * contact - sandLoss - waterLoss - thermal + completionGain + (r() - 0.5) * 2.4;
    });
  }
  function dataset() {
    const make = (prefix, n, seed) => {
      const r = rng(seed);
      return Array.from({ length: n }, (_, i) => { const d = observation(prefix + String(i + 1).padStart(3, '0'), r); return { ...d, outcomes: generateOutcomes(d.x, r) }; });
    };
    const train = make('TR-', 160, 17101), validation = make('VA-', 40, 27202), test = make('TE-', 32, 37303);
    return { train, validation, observations: test.map(d => ({ wellId: d.wellId, x: d.x.slice() })), evaluationTruth: test.map(d => d.outcomes.slice()), splits: { training: train.map(d => d.wellId), validation: validation.map(d => d.wellId), testing: test.map(d => d.wellId) } };
  }
  function fit(training, validation) {
    const mu = Array.from({ length: 6 }, (_, j) => mean(training.map(d => d.x[j])));
    const sd = mu.map((m, j) => Math.max(1e-9, Math.sqrt(mean(training.map(d => Math.pow(d.x[j] - m, 2))))));
    const scale = x => x.map((v, j) => (v - mu[j]) / sd[j]);
    const bank = training.map(d => ({ ...d, z: scale(d.x) }));
    function predictOne(x, k) {
      const z = scale(x), near = bank.map(d => ({ ...d, distance: Math.sqrt(d.z.reduce((s, v, j) => s + Math.pow(v - z[j], 2), 0)) })).sort((a, b) => a.distance - b.distance).slice(0, k);
      const weights = near.map(d => 1 / Math.max(0.08, d.distance)), denom = weights.reduce((s, v) => s + v, 0);
      return { outcomes: plans.map((_, j) => near.reduce((s, d, i) => s + weights[i] * d.outcomes[j], 0) / denom), neighbors: near.map((d, i) => ({ wellId: d.wellId, x: d.x, outcomes: d.outcomes, distance: d.distance, weight: weights[i] / denom })), nearestDistance: near[0].distance };
    }
    const validationScores = [3, 5, 9, 15].map(k => ({ k, mae: mean(validation.flatMap(d => predictOne(d.x, k).outcomes.map((v, j) => Math.abs(v - d.outcomes[j])))) }));
    const k = validationScores.slice().sort((a, b) => a.mae - b.mae || a.k - b.k)[0].k;
    return { k, mu, sd, validationScores, predict: x => predictOne(x, k) };
  }
  function reasons(x, plan, budget) {
    const [strength, sand, , water, , temperature] = x, r = [];
    if (plan.cost > budget) r.push('费用 ' + plan.cost + ' > 预算 ' + budget);
    if (strength < 0.28 && !plan.isolation) r.push('低强度井壁需套管支撑');
    if (sand > 0.65 && !plan.sand) r.push('高出砂风险需防砂配置');
    if (water > 0.68 && !plan.isolation) r.push('高分层控水需求需可选择性隔离');
    if (temperature > plan.maxT) r.push('温度超过该教学设备额定值 ' + plan.maxT + ' °C');
    return r;
  }
  function baseline(x) { return x[1] > 0.55 ? 2 : x[3] > 0.6 ? 1 : 0; }
  function recommend(observation, model, params = {}) {
    if (!observation || !Array.isArray(observation.x) || observation.x.length !== 6 || observation.x.some(v => !Number.isFinite(v))) throw new Error('六项井况必须完整且为有限数值；请补充缺失资料后再选择。');
    const budget = Number(params.budget ?? 90), costWeight = Number(params.costWeight ?? 0.22), p = model.predict(observation.x);
    const candidates = plans.map((plan, j) => ({ index: j, ...plan, expectedResponse: p.outcomes[j], utility: p.outcomes[j] - costWeight * plan.cost, reasons: reasons(observation.x, plan, budget) }));
    const feasible = candidates.filter(p => p.reasons.length === 0).sort((a, b) => b.utility - a.utility || a.index - b.index);
    const baseRaw = baseline(observation.x), base = candidates[baseRaw].reasons.length ? -1 : baseRaw;
    return { wellId: observation.wellId, x: observation.x.slice(), candidates, recommendation: feasible.length ? feasible[0].index : -1, baselineRaw: baseRaw, baseline: base, neighbors: p.neighbors, nearestDistance: p.nearestDistance };
  }
  function infer(observations, model, params) { return observations.map(d => recommend(d, model, params)); }
  function evaluate(predictions, truth, params = {}) {
    const costWeight = Number(params.costWeight ?? 0.22), total = predictions.length;
    let absoluteError = 0, errorN = 0;
    const result = { total, feasibleWellCount: 0, model: { recommended: 0, matched: 0, violations: 0, regrets: [] }, baseline: { recommended: 0, matched: 0, violations: 0, regrets: [], excludedRaw: 0 } };
    predictions.forEach((p, i) => {
      p.candidates.forEach((c, j) => { absoluteError += Math.abs(c.expectedResponse - truth[i][j]); errorN++; });
      const allowed = p.candidates.filter(c => c.reasons.length === 0);
      if (!allowed.length) return;
      result.feasibleWellCount++;
      const actual = j => truth[i][j] - costWeight * plans[j].cost;
      const ordered = allowed.slice().sort((a, b) => actual(b.index) - actual(a.index) || a.index - b.index), best = ordered[0].index;
      [['model', p.recommendation], ['baseline', p.baseline]].forEach(([key, choice]) => {
        const t = result[key];
        if (choice >= 0) { t.recommended++; t.matched += choice === best ? 1 : 0; t.violations += p.candidates[choice].reasons.length ? 1 : 0; t.regrets.push(Math.max(0, actual(best) - actual(choice))); }
      });
      if (p.baseline < 0) result.baseline.excludedRaw++;
    });
    for (const key of ['model', 'baseline']) {
      const t = result[key];
      t.coverage = total ? t.recommended / total : null;
      t.top1Agreement = t.recommended ? t.matched / t.recommended : null;
      t.regret = mean(t.regrets);
      t.regretTotal = t.regrets.reduce((s, v) => s + v, 0);
      delete t.regrets;
    }
    return { ...result, surrogateMAE: errorN ? absoluteError / errorN : null, surrogateDenominator: errorN };
  }
  function run(params = {}) {
    const data = dataset(), model = fit(data.train, data.validation), predictions = infer(data.observations, model, params);
    return { data, model, predictions, metrics: evaluate(predictions, data.evaluationTruth, params) };
  }
  g.CO1Engine = { plans, dataset, fit, reasons, baseline, recommend, infer, evaluate, run, clamp };
})(globalThis);
