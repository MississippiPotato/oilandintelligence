window.S17Page={"sceneId":"g1","caseId":"s17x-g1-remote-lithology","name":"地质剖面遥感解译","title":"地质剖面遥感解译：从多波段像素读懂地表单元","summary":"地表岩性为什么不能只看颜色？把露头、卫星波段与像素分类连起来，找到值得地面核查的地质单元。","directory":"expansion-cases","caseVersion":"1.0.0","portalHref":"../../../../portal/index.html","referenceHref":"../../../../portal/reference/fluorescence.html"};
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

;
(function () {
  'use strict';
  const core = globalThis.G1Core, $ = id => document.getElementById(id), caseId = 's17x-g1-remote-lithology';
  const defaults = { noise: .045, shadow: .26, cover: .16, featureMode: 'full', support: .5, seed: 2027 };
  let result = null, status = 'idle', runId = 0, seed = defaults.seed, selected = { x: 36, y: 24 }, reviews = [], reviewHistory = [];
  const pct = v => v == null ? '不适用' : (v * 100).toFixed(1) + '%';
  const dec = (v, n = 3) => v == null ? '不适用' : Number(v).toFixed(n);
  function params() { return { noise: Number($('noise').value), shadow: Number($('shadow').value), cover: Number($('cover').value), featureMode: $('feature-mode').value, support: .5, seed }; }
  function sourceVersion() { return result ? 'g1-v1/' + JSON.stringify(result.params) : null; }
  function invalidateReviews(reason) {
    if (reviews.length) reviewHistory.push({ action: 'invalidate-current-review', reason, runId, sourceVersion: sourceVersion(), count: reviews.length });
    reviews = []; $('review-log').textContent = '当前尚无有效人工意见；旧运行意见保留在导出历史。';
  }
  function setStatus(value, message) {
    status = value; $('status').dataset.state = value; $('status').textContent = message;
    $('export').disabled = value !== 'ready'; $('review').disabled = value !== 'ready'; $('run').disabled = value === 'running';
    $('maps').dataset.stale = String(value === 'stale');
  }
  function outputs() { $('noise-value').value = Number($('noise').value).toFixed(3); $('shadow-value').value = pct(Number($('shadow').value)); $('cover-value').value = pct(Number($('cover').value)); }
  function stale() {
    invalidateReviews('input-changed');
    outputs(); setStatus('stale', '参数已改变，图上保留的是上一次结果。请重新运行，生成当前输入的分类与指标。');
    $('metrics').innerHTML = '<p class="empty">待重算：当前参数尚无评价结果。</p>';
    $('class-metrics').innerHTML = '<p class="empty">重算后更新各类指标。</p>';
    $('confusion').innerHTML = ''; $('provenance').innerHTML = '<p>当前参数待重算。</p>';
    $('pixel-info').innerHTML = '<p class="empty">重算后查看当前像素依据。</p>'; $('neighbors').innerHTML = ''; $('pixel-spectrum').innerHTML = '';
  }
  function openTab(name) {
    document.querySelectorAll('.pane').forEach(node => { node.hidden = node.id !== name; });
    document.querySelectorAll('nav[aria-label="案例内容"] [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  }
  document.querySelectorAll('nav[aria-label="案例内容"] [data-tab]').forEach((b, i, all) => {
    b.addEventListener('click', () => openTab(b.dataset.tab));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; next.focus(); openTab(next.dataset.tab); } });
  });
  function openStep(index) {
    document.querySelectorAll('[data-step-panel]').forEach(node => { node.hidden = Number(node.dataset.stepPanel) !== index; });
    document.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-selected', String(Number(b.dataset.step) === index)));
  }
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => openStep(Number(b.dataset.step))));
  document.querySelectorAll('[data-prev]').forEach(b => b.addEventListener('click', () => openStep(Math.max(0, Number(b.dataset.prev) - 1))));
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => Number(b.dataset.next) === 4 ? openTab('lab') : openStep(Number(b.dataset.next) + 1)));
  function table(headers, rows) { return '<table><thead><tr>' + headers.map(h => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map((v, i) => '<' + (i ? 'td' : 'th') + (i ? '' : ' scope="row"') + '>' + v + '</' + (i ? 'td' : 'th') + '>').join('') + '</tr>').join('') + '</tbody></table>'; }
  function mapColor(index, type) {
    const obs = result.observations, c = result.prediction.labels[index];
    if (type === 'observed') {
      const b = obs.bands, view = $('band-view').value;
      if (view === 'composite') return 'rgb(' + [b[2][index] * 350 + 22, b[1][index] * 350 + 22, b[0][index] * 350 + 22].map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ')';
      const band = view === 'red' ? 0 : view === 'nir' ? 1 : 2, v = Math.round(Math.min(255, obs.bands[band][index] * 430 + 20)); return 'rgb(' + [v, v, v].join(',') + ')';
    }
    if (type === 'prediction') return core.colors[c] || '#e9bb66';
    const view = $('error-view').value;
    if (view === 'truth') return core.colors[result.evaluationTruth.labels[index]];
    if (view === 'baseline') return core.colors[result.baseline[index]];
    return c === 4 ? '#e8b95d' : c === result.evaluationTruth.labels[index] ? '#e4eceb' : '#cf705d';
  }
  function drawMaps() {
    if (!result) return;
    const obs = result.observations;
    ['observed', 'prediction', 'comparison'].forEach(type => {
      const canvas = $(type + '-map'), ctx = canvas.getContext('2d'), sx = canvas.width / obs.w, sy = canvas.height / obs.h;
      for (let i = 0; i < obs.w * obs.h; i++) { ctx.fillStyle = mapColor(i, type); ctx.fillRect(i % obs.w * sx, Math.floor(i / obs.w) * sy, sx + .2, sy + .2); }
      if (type === 'prediction') reviews.forEach(r => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(r.x * sx - 1, r.y * sy - 1, sx + 2, sy + 2); });
      ctx.strokeStyle = '#173f50'; ctx.lineWidth = 5; ctx.strokeRect(selected.x * sx - 2, selected.y * sy - 2, sx + 4, sy + 4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(selected.x * sx - 2, selected.y * sy - 2, sx + 4, sy + 4);
    });
    const view = $('error-view').value;
    $('third-title').textContent = view === 'truth' ? '03　独立参考图' : view === 'baseline' ? '03　单红光基线' : '03　错误定位';
    $('third-caption').textContent = view === 'error' ? '浅灰：正确；珊瑚：错分；金黄：待复核' : view === 'truth' ? '参考标签只参与评价显示，不进入预测' : '同一图幅；使用训练/验证选定的红光阈值';
  }
  function inspect() {
    if (!result || status !== 'ready') return;
    const obs = result.observations, i = selected.y * obs.w + selected.x, p = result.prediction.scores[i], f = result.prediction.features[i], b = obs.bands.map(band => band[i]);
    $('px').value = selected.x; $('py').value = selected.y;
    const predictionLabel = core.labels[p.label] || '待复核';
    $('pixel-info').innerHTML = '<p><b>位置</b>：(' + selected.x + ', ' + selected.y + ')，地面相对位置约(' + (selected.x * 30) + ', ' + ((47 - selected.y) * 30) + ') m</p><p><b>模型</b>：' + predictionLabel + ' · 近邻支持度 ' + pct(p.support) + '</p><p><b>红光基线</b>：' + core.labels[result.baseline[i]] + ' · <b>参考</b>：' + core.labels[result.evaluationTruth.labels[i]] + '</p><p>红光 ' + dec(b[0]) + ' / 近红外 ' + dec(b[1]) + ' / 短波红外 ' + dec(b[2]) + (f.length > 1 ? '；局部纹理 ' + dec(f[5]) : '；当前消融仅使用红光') + '</p>';
    const xs = [100, 285, 470], bars = b.map((v, j) => '<rect x="' + (xs[j] - 33) + '" y="' + (160 - v * 180) + '" width="66" height="' + v * 180 + '" rx="5" fill="' + ['#c78869', '#5c9b80', '#819bc0'][j] + '"/><text x="' + xs[j] + '" y="' + (147 - v * 180) + '" text-anchor="middle">' + dec(v) + '</text><text x="' + xs[j] + '" y="190" text-anchor="middle">' + ['红光 0.65μm', '近红外 0.86μm', '短波红外 2.2μm'][j] + '</text>').join('');
    $('pixel-spectrum').innerHTML = '<svg viewBox="0 0 570 215" role="img" aria-label="选中像素的三个实测合成反射率" style="font:17px system-ui;fill:#183a45"><path d="M36 18v142h500" fill="none" stroke="#b7c9cf"/><text x="40" y="25">反射率</text>' + bars + '</svg>';
    const neighbors = core.nearest(result.training.model, f, result.training.k);
    $('neighbors').innerHTML = '<p>' + result.training.k + ' 个实际近邻；标准化特征的均方距离开根号。</p><div class="table-wrap">' + table(['类别', '距离', '来源', '像素'], neighbors.map(n => [core.labels[n.label], dec(n.distance), n.groupId, n.pixel])) + '</div>';
    drawMaps();
  }
  function metric(label, value, caption) { return '<div class="metric"><span>' + label + '</span><strong>' + value + '</strong><small>' + caption + '</small></div>'; }
  function render() {
    const m = result.metrics.model, b = result.metrics.baseline;
    $('metrics').innerHTML = metric('多波段近邻 · 宏F1', pct(m.macroF1), '各有分母类别的F1等权平均') + metric('单红光基线 · 宏F1', pct(b.macroF1), '同一3456像素测试图') + metric('多波段近邻 · 平均IoU', pct(m.meanIoU), '类别区域重叠') + metric('自动接受覆盖率', pct(m.coverage), m.accepted + ' / ' + m.total + ' 像素');
    $('class-metrics').innerHTML = table(['参考类别', '像素数', 'TP', 'FP', 'FN', 'IoU', 'F1', '基线F1'], m.perClass.map((r, i) => [r.label, r.support, r.tp, r.fp, r.fn, pct(r.iou), pct(r.f1), pct(b.perClass[i].f1)]));
    $('confusion').innerHTML = table(['参考↓ / 预测→', ...core.labels, '待复核'], m.matrix.map((row, i) => [core.labels[i], ...row]));
    const t = result.training;
    $('provenance').innerHTML = '<div class="split-strip"><span>训练：' + t.training.groupIds.join(' / ') + '</span><span>验证：' + t.validation.groupIds.join(' / ') + '</span><span>测试：' + result.observations.groupId + '</span></div><p>' + t.training.pixels + ' 个训练像素 · ' + t.training.featureCount + '维特征 · 选择 k=' + t.k + '。训练标准化、验证选参后，测试仅推理。</p><div class="table-wrap">' + table(['验证候选k', '宏F1', '验证像素'], t.validation.candidates.map(r => [r.k, pct(r.macroF1), r.pixels])) + '</div><p>单红光类别顺序：' + t.baselineRule.order.map(c => core.labels[c]).join(' → ') + '；阈值 ' + t.baselineRule.thresholds.map(v => dec(v)).join(' / ') + '。</p><p>整幅 ' + m.total + ' 像素，正确 ' + m.correct + '，待复核 ' + (m.total - m.accepted) + '。接受集错误率 ' + pct(m.acceptedError) + '（误分接受像素 / 全部接受像素）。近邻支持度阈值0.50；票重并非校准概率。</p>';
    $('review-log').textContent = '本次已保存 ' + reviews.length + ' 个像素的人工意见；原模型成绩保持独立。';
    inspect();
  }
  async function run() {
    if (status === 'running') return;
    invalidateReviews('new-run');
    setStatus('running', '正在从观测计算特征、选择验证参数并分类……');
    await new Promise(resolve => requestAnimationFrame(resolve));
    try { result = core.run(params()); runId++; reviews = []; setStatus('ready', '计算完成 · ' + result.observations.groupId + ' · ' + result.metrics.model.total + '像素 · k=' + result.training.k + '。点击地图可查看依据。'); render(); }
    catch (error) { setStatus('error', '本次计算未完成：' + error.message); console.error(error); }
  }
  ['noise', 'shadow', 'cover', 'feature-mode'].forEach(id => $(id).addEventListener(id === 'feature-mode' ? 'change' : 'input', stale));
  ['band-view', 'error-view'].forEach(id => $(id).addEventListener('change', drawMaps));
  $('run').addEventListener('click', run);
  $('reset').addEventListener('click', () => { seed = defaults.seed; ['noise', 'shadow', 'cover'].forEach(id => { $(id).value = defaults[id]; }); $('feature-mode').value = defaults.featureMode; $('band-view').value = 'composite'; $('error-view').value = 'error'; selected = { x: 36, y: 24 }; outputs(); run(); });
  $('preset-fail').addEventListener('click', () => { $('noise').value = .16; $('shadow').value = .7; $('cover').value = .28; stale(); });
  $('new-scene').addEventListener('click', () => { seed += 103; stale(); $('status').textContent = '已切换到新的独立测试图幅-' + seed + '，请重新运行。训练/验证来源保持固定。'; });
  function select(x, y) { selected = { x: Math.max(0, Math.min(71, Math.round(x))), y: Math.max(0, Math.min(47, Math.round(y))) }; inspect(); }
  ['observed-map', 'prediction-map', 'comparison-map'].forEach(id => {
    $(id).addEventListener('click', e => { if (status !== 'ready') return; const r = e.currentTarget.getBoundingClientRect(); select(Math.floor((e.clientX - r.left) / r.width * 72), Math.floor((e.clientY - r.top) / r.height * 48)); });
    $(id).addEventListener('keydown', e => { const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (delta && status === 'ready') { e.preventDefault(); select(selected.x + delta[0], selected.y + delta[1]); } });
  });
  ['px', 'py'].forEach(id => $(id).addEventListener('change', () => select(Number($('px').value), Number($('py').value))));
  $('review').addEventListener('click', () => {
    if (status !== 'ready') return;
    const index = selected.y * 72 + selected.x, row = { ...selected, index, label: Number($('review-label').value), originalPrediction: result.prediction.labels[index], runId, sourceVersion: sourceVersion(), source: '人工意见', observationFragment: { bands: result.observations.bands.map(b => b[index]), groupId: result.observations.groupId } };
    reviews = reviews.filter(r => r.index !== index); reviews.push(row); reviewHistory.push({ ...row, event: 'opinion-saved' });
    $('review-log').textContent = '已保存 (' + row.x + ', ' + row.y + ')：' + (core.labels[row.label] || '继续待复核') + '。本次共 ' + reviews.length + ' 点；模型原指标保持独立。'; drawMaps();
  });
  function evidence() {
    if (status !== 'ready') return null;
    const index = selected.y * 72 + selected.x, sourceId = 'g1:' + result.observations.groupId;
    return { schemaVersion: '1.0', sceneId: 'g1', caseId, caseVersion: '1.0.0', runId, datasetId: 's17x-g1-synthetic-v1', wellId: null, areaId: result.observations.groupId, dataNature: 'synthetic_teaching',
      runConfig: { seed, dataVersion: 'g1-synthetic-v1', splitDescription: '6 independent training images; 2 validation images; independent test image', method: result.params.featureMode === 'full' ? 'six-feature weighted kNN' : 'red-only weighted kNN ablation', parameters: result.params, inputRevision: runId },
      observations: result.observations, prediction: { labels: result.prediction.labels, support: result.prediction.scores.map(s => s.support) }, baseline: result.baseline, evaluationReference: result.evaluationTruth, metrics: result.metrics,
      training: { ...result.training.training, k: result.training.k, validation: result.training.validation, baselineRule: result.training.baselineRule, model: result.training.model },
      sources: [{ sourceRecordId: sourceId, sourceVersion: sourceVersion(), sourceType: 'image_region', content: result.observations, units: { pixelSize_m: 30, reflectance: 'unitless' } }],
      claims: [{ claimId: caseId + '-run-' + runId + '-pixel-' + index, revision: 1, kind: 'model_inference', statement: '当前像素候选为' + (core.labels[result.prediction.labels[index]] || '待复核'), sourceRefs: [{ sourceRecordId: sourceId, sourceVersion: sourceVersion(), selector: { type: 'image_region', x: selected.x, y: selected.y, width: 1, height: 1, pixelIndex: index } }], reviewStatus: result.prediction.labels[index] === 4 ? 'needs_review' : 'unreviewed', traceabilityStatus: 'linked', supportStatus: 'unchecked', evidence: { bands: result.observations.bands.map(b => b[index]), features: result.prediction.features[index], neighbors: core.nearest(result.training.model, result.prediction.features[index], result.training.k) } }],
      humanReview: reviews, humanReviewHistory: reviewHistory, limitations: ['合成光谱与影像，不是实测岩石光谱库', '输出描述可见地表单元', '近邻支持度未经概率校准'], references: ['https://eros.usgs.gov/earthshots/introduction-remote-sensing', 'https://www.sgm.gob.mx/Gobmx/en/About_SGM/Remote_sensing.html'] };
  }
  $('export').addEventListener('click', () => {
    const payload = evidence(); if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = caseId + '-run-' + runId + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('class-legend').innerHTML = core.labels.map((name, i) => '<span><i class="swatch" style="--sw:' + core.colors[i] + '"></i>' + name + '</span>').join('') + '<span><i class="swatch" style="--sw:#e9bb66"></i>待复核</span>';
  globalThis.CaseInspect = { snapshot: () => JSON.parse(JSON.stringify({ sceneId: 'g1', caseId, status, metrics: status === 'ready' ? result.metrics : null, runId, params: params(), selected, reviewCount: reviews.length, reviewHistoryCount: reviewHistory.length, prediction: status === 'ready' ? result.prediction.labels : null })), evidence: () => JSON.parse(JSON.stringify(evidence())) };
  outputs();
})();


/* S17_OPTIONAL_ASSISTANT_START: isolated from case inference and evaluation */
(function(){function startAssistant(){
(function(g){'use strict';
// Shared local guide and optional model client; never persists credentials.
if(g.S17Assistant)return;
const pageInfo=g.S17Page??{},standalone=!!pageInfo.sceneId,framed=g!==g.parent;
const catalog=[
{id:'m1',caseId:'s17-cuttings-lithology',name:'岩屑岩性',terms:['岩屑','岩性','颗粒'],intro:'观察一盘岩屑的外观，点击颗粒看近邻，切换照明、泥浆附着和计数/面积。默认是教学合成图；真实岩芯对照另行标明。'},
{id:'m2',caseId:'s17-mudgas-context',name:'气测异常',terms:['气测','气峰','迟到','停泵'],intro:'看地面气峰怎样结合累计泵量和工况解释。可以改体积、停泵或上下文，比较候选解释。气峰不直接代表油气层。'},
{id:'m3',caseId:'s17-fluorescence-review',name:'荧光判读',terms:['荧光','紫外','uv','曝光'],intro:'对比同一样品的白光/UV教学图，改变曝光并查看显示区域。荧光存在与油气来源是两个判断；矿物也会发光。'},
{id:'m4',caseId:'s17-drilltime-boundaries',name:'钻时分段',terms:['钻时','钻速','分层','分段','工况'],intro:'对比工况变化与响应变化，观察平滑怎样吞掉薄层。曲线上标记的是候选响应界面；公开钻进数据没有地层真值精度。'},
{id:'m5',caseId:'s17-evidence-report',name:'证据报告',terms:['报告','证据','导出','否定'],intro:'查看短记录怎样变成有来源的报告。点击句子回到证据，改写后重新复核，也能下载工作区、报告HTML和证据JSON。'}];
for(const c of g.S17Expansion?.cases??[])catalog.push({id:c.sceneId,caseId:c.id,name:c.name,terms:[c.name,c.stageName,c.sceneId],intro:c.summary,directory:'expansion-cases'});
if(standalone&&!catalog.some(c=>c.id===pageInfo.sceneId))catalog.push({id:pageInfo.sceneId,caseId:pageInfo.caseId,name:pageInfo.name??pageInfo.title??document.title,terms:[pageInfo.sceneId,pageInfo.name??''],intro:pageInfo.summary??'这里可以依次查看专业背景、逐步流程与交互演示。',directory:pageInfo.directory??'cases'});
const root=document.createElement('aside');root.id='s17-assistant';root.dataset.speaking='false';
const icons={chat:'<path d="M5 5h14v10H9l-4 4V5Z"/><path d="M9 9h6M9 12h4"/>',plus:'<path d="M12 5v14M5 12h14"/>',expand:'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',send:'<path d="M12 19V5m-6 6 6-6 6 6"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 4H6a2 2 0 0 0-2 2v9"/>',stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>'};
Object.assign(icons,{attach:'<path d="m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',book:'<path d="M4 5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v14h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4V5Z"/><path d="M12 6v14"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>'});
const icon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
const avatar='<div class="s17-agent-avatar" aria-hidden="true"><svg viewBox="0 0 100 100"><rect x="7" y="7" width="86" height="86" rx="28" fill="#eaf3f2"/><path d="M31 25h38v38H48L31 78V25Z" fill="none" stroke="#247d76" stroke-width="5" stroke-linejoin="round"/><path d="M41 39h18M41 49h12" stroke="#247d76" stroke-width="5" stroke-linecap="round"/></svg></div>';
root.dataset.view='chat';root.dataset.empty='true';root.dataset.surface=standalone?'standalone':'portal';
root.innerHTML=`<button id="s17-agent-launcher" aria-label="打开井见助手" aria-expanded="false" aria-controls="s17-agent-panel">${avatar}<span><strong>井见助手</strong><small id="s17-agent-badge">聊聊你正在看的案例</small></span></button>
<section id="s17-agent-panel" class="s17-agent-panel" role="dialog" aria-modal="false" aria-label="井见智能助手" aria-labelledby="s17-agent-title" hidden>
<header class="s17-agent-head"><div class="s17-agent-identity"><span class="s17-agent-mark">${icon('chat')}</span><div><h2 id="s17-agent-title">井见 <span>助手</span></h2><p id="s17-agent-mode">本地导览</p></div></div><div class="s17-agent-head-actions"><button id="s17-agent-new" type="button" title="新对话" aria-label="新对话">${icon('plus')}</button><button id="s17-agent-expand" type="button" title="展开对话面板" aria-label="展开对话面板" aria-pressed="false">${icon('expand')}</button><button id="s17-agent-settings" type="button" title="模型与语音设置" aria-label="模型与语音设置" aria-pressed="false">${icon('settings')}</button><button id="s17-agent-close" type="button" title="收起助手" aria-label="收起助手">${icon('close')}</button></div></header>
<div id="s17-agent-context" class="s17-agent-context"></div><div id="s17-agent-log" class="s17-agent-log" role="log" aria-label="对话记录" aria-live="polite" aria-relevant="additions"></div>
<div id="s17-agent-pending" class="s17-agent-pending" role="status" hidden><span class="s17-thinking-dot"></span><span>正在思考</span><button id="s17-agent-cancel" type="button">${icon('stop')}停止生成</button></div>
<form id="s17-agent-form" class="s17-agent-form"><div class="s17-agent-composer"><textarea id="s17-agent-input" rows="3" maxlength="4000" aria-label="向井见提问" placeholder="给井见发送消息"></textarea><div class="s17-agent-form-bottom"><div class="s17-agent-quick"><button type="button" data-ag-query="解释当前页">${icon('book')}读懂本页</button><button type="button" data-ag-query="从哪里开始">${icon('compass')}案例导航</button></div><div class="s17-composer-tools"><div id="s17-agent-attachments"><button id="s17-agent-attach" type="button" aria-label="添加图片或音频" title="添加图片或音频" aria-expanded="false" aria-controls="s17-agent-attachment-menu">${icon('attach')}</button><div id="s17-agent-attachment-menu" role="menu" hidden></div></div><span id="s17-agent-microphone"></span><button id="s17-agent-send" type="submit" aria-label="发送消息" title="发送消息">${icon('send')}</button></div></div></div><p class="s17-agent-input-hint">Enter 发送 · Shift + Enter 换行</p></form>
<details class="s17-agent-options"><summary>返回对话</summary><div class="s17-agent-settings-intro"><h3>模型与语音</h3><p>设置你自己的模型连接。</p></div><p id="s17-agent-model-status">本地导览已就绪。</p><div class="s17-speech-controls"><button type="button" id="s17-agent-read">朗读上一条</button><button type="button" id="s17-agent-stop">停止朗读</button></div><p class="s17-agent-data-note">对话与 Key 只在当前页面内存中使用。朗读使用浏览器或系统语音。</p></details><div id="s17-agent-toast" class="s17-agent-toast" role="status" hidden></div></section>`;
document.body.append(root);const $=id=>document.getElementById(id),log=$('s17-agent-log');let adapter=null,busy=false,controller=null,lastReply='',requestCount=0,successfulCalls=0,ownerIsParent=false;const history=[];
const caseById=id=>catalog.find(c=>c.id===id);
function pageContext(){const q=new URLSearchParams(location.hash.split('?')[1]??''),parts=location.hash.replace(/^#\/?/,'').split('?')[0].split('/'),scene=g.ATLAS?.index?.byScene?.[parts[1]],current=standalone?caseById(pageInfo.sceneId):null,section=standalone?(document.querySelector('nav[aria-label="案例内容"] [aria-pressed="true"]')?.dataset.tab??location.hash.slice(1)):q.get('tab');return{hash:location.hash||'#/',title:document.querySelector('#view main h1,body>main h1')?.textContent??document.title,sceneId:current?.id??(parts[0]==='scene'?parts[1]:null),tab:({background:'bg',workflow:'flow',lab:'demo'}[section]??section)||'bg',sceneName:current?.name??scene?.name??null,surface:standalone?'standalone':'portal'};}
function updateContext(){const c=pageContext(),section={bg:'专业背景',flow:'案例流程',demo:'可运行示范'}[c.tab];$('s17-agent-context').textContent='正在看 · '+(c.sceneName?c.sceneName+' / '+section:c.title);}
function portalURL(hash){if(standalone&&framed)return new URL('../portal/index.html'+hash,document.baseURI).href;return standalone||pageInfo.portalHref?(pageInfo.portalHref??'../../../../portal/index.html')+hash:hash;}
function destination(action){
if(!action||typeof action!=='object')throw Error('导航参数无效');
const inTeacherFrame=standalone&&framed&&location.href==='about:srcdoc';
if(action.target==='fluorescence_reference')return{label:'真实白光 / UV 对照',href:inTeacherFrame?new URL('../portal/reference/fluorescence.html',document.baseURI).href:pageInfo.referenceHref??'reference/fluorescence.html',newTab:true};
if(action.target==='home')return{label:'网站首页',href:portalURL('#/'),newTab:standalone&&framed};
if(action.target==='chain')return{label:'13阶段作业链',href:portalURL('#/chain'),newTab:standalone&&framed};
if(action.target==='mudlogging')return{label:'录井五个场景',href:portalURL('#/stage/mudlogging'),newTab:standalone&&framed};
const c=caseById(action.target);
if(c){const tab=['bg','flow','demo'].includes(action.tab)?action.tab:'demo',localTab={bg:'background',flow:'workflow',demo:'lab'}[tab],saved=!!g.Cases?.get(c.caseId),directory=c.directory??'cases';
if(standalone&&c.id===pageInfo.sceneId)return{label:{bg:'专业背景',flow:'案例流程',demo:'可运行示范'}[tab]+' · '+c.name,href:'#'+localTab,localTab};
const path=directory+'/'+c.caseId+'/demo/index.html#'+localTab,href=saved?'#/scene/'+c.id+'?case='+c.caseId+'&tab='+tab:inTeacherFrame?new URL('../dist/'+path,document.baseURI).href:(standalone?'../../../':pageInfo.distHref??'../dist/')+path;
return{label:c.name+' · '+({bg:'专业背景',flow:'案例流程',demo:'交互演示'}[tab]),href,newTab:!saved,caseId:c.caseId,sceneId:c.id};}
throw Error('只支持本站已声明的导航目标');}
function welcome(){root.dataset.empty='true';log.replaceChildren();const node=document.createElement('div');node.className='s17-agent-welcome';node.innerHTML='<span class="s17-welcome-mark">'+icon('chat')+'</span><h3>今天想了解哪一步？</h3>';log.append(node);}
function syncComposer(){const input=$('s17-agent-input'),hasFiles=!!g.S17Media?.snapshot().files.length;$('s17-agent-send').disabled=busy||(!input.value.trim()&&!hasFiles);}
function attachmentMenu(value){$('s17-agent-attachment-menu').hidden=!value;$('s17-agent-attach').setAttribute('aria-expanded',String(value));}
function richText(container,text){for(const line of String(text).split('\n')){if(!line.trim()){container.append(document.createElement('br'));continue;}const p=document.createElement('p');if(/^\s*[-*]\s+/.test(line))p.className='s17-chat-bullet';const clean=line.replace(/^\s*[-*]\s+/,'');for(const token of clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)){const el=token.startsWith('**')&&token.endsWith('**')?document.createElement('strong'):token.startsWith('`')&&token.endsWith('`')?document.createElement('code'):document.createTextNode(token);if(el.nodeType===1)el.textContent=token.startsWith('**')?token.slice(2,-2):token.slice(1,-1);p.append(el);}container.append(p);}}
function toast(text){const node=$('s17-agent-toast');node.textContent=text;node.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.hidden=true,2400);}
function append(role,text,actions=[],origin='井见 · 本地导览'){root.dataset.empty='false';log.querySelector('.s17-agent-welcome')?.remove();const wrap=document.createElement('article');wrap.className='s17-agent-message';wrap.dataset.role=role;const label=document.createElement('small');label.className='s17-message-origin';label.textContent=role==='user'?'你':origin;const content=document.createElement('div');content.className='s17-message-content';richText(content,text);wrap.append(label,content);if(actions.length){const row=document.createElement('div');row.className='s17-agent-actions';for(const action of actions.slice(0,6)){try{const d=destination(action),a=document.createElement('a');a.textContent=d.label;a.href=d.href;if(d.localTab)a.dataset.agTab=d.localTab;if(d.newTab){a.target='_blank';a.rel='noopener';}row.append(a);}catch{}}wrap.append(row);}if(role==='assistant'){const copy=document.createElement('button');copy.type='button';copy.className='s17-message-copy';copy.innerHTML=icon('copy')+'<span>复制</span>';copy.setAttribute('aria-label','复制这条回复');copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);toast('回复已复制');}catch{toast('可选中文字，使用系统复制');}};wrap.append(copy);lastReply=text;}log.append(wrap);log.scrollTop=log.scrollHeight;history.push({role,content:text});if(history.length>24)history.splice(0,history.length-24);}
function guide(text){const t=text.toLowerCase().trim();if(/从哪里|如何开始|怎么开始|五个|全部案例|导览/.test(t))return{text:'可以按“岩屑 → 气测 → 荧光 → 钻时 → 报告”看，也可以直接选一例。每例都有背景、流程和交互演示。首页还收录其他12个阶段的新增案例。已载入的案例进入门户对应页，其余可直接打开独立演示。',actions:[...catalog.filter(c=>/^m[1-5]$/.test(c.id)).map(c=>({target:c.id})),{target:'home'}]};if(/真实.*荧光|真实.*配对|白光.*对照|方解石/.test(t))return{text:'这组真实照片展示同组方解石在可见光、短波UV和长波UV下的外观，用来理解矿物发光与油气解释的区别；不是含油岩屑训练数据。',actions:[{target:'fluorescence_reference'}]};if(/首页|回去|返回主页/.test(t))return{text:'点这里回到网站首页。',actions:[{target:'home'}]};if(/13|作业链|全部阶段/.test(t))return{text:'点这里查看原门户保留的作业链导航。',actions:[{target:'chain'}]};if(/录井阶段|进入录井/.test(t))return{text:'录井阶段包含五个必做子场景。',actions:[{target:'mudlogging'}]};if(/当前页|这个页面/.test(t)){const p=pageContext(),c=caseById(p.sceneId);return{text:c?c.intro:'当前是“'+p.title+'”。可以从首页选择案例，或通过13阶段导航浏览场景。',actions:c?[{target:c.id,tab:'bg'},{target:c.id,tab:'flow'},{target:c.id,tab:'demo'}]:[{target:'mudlogging'}]};}const c=catalog.find(c=>new RegExp('(?:^|[^a-z0-9])'+c.id+'(?:$|[^a-z0-9])','i').test(t)||c.terms.some(w=>t.includes(w)));if(c&&(!adapter||/打开|带我|进入|跳到|去看|看看/.test(t)||/^(m[1-5]|气测|岩屑|荧光|钻时|报告)$/.test(t))){let tab=/背景|概念/.test(t)?'bg':/流程|步骤/.test(t)?'flow':'demo';return{text:c.intro+'\n可以从这里进入对应内容。',actions:[{target:c.id,tab}]};}if(!adapter&&/模型|api|live2d|数字人|语音/.test(t))return{text:'角色状态：'+(g.S17Live2D?.state??'准备中')+'。本地导航与固定导学可用；开放式大模型问答可在右上角设置中连接火山方舟。浏览器朗读可手动开启。',actions:[]};return null;}
const tools=[{name:'navigate_page',description:'提供本站页面导航，仅使用允许的target，不执行JS或任意URL。',parameters:{type:'object',properties:{target:{type:'string',enum:['home','chain','mudlogging',...catalog.map(c=>c.id),'fluorescence_reference']},tab:{type:'string',enum:['bg','flow','demo']}},required:['target']}}];
async function ask(text){const media=g.S17Media;if(busy)return;if(media?.snapshot().processing||media?.snapshot().recording){media.notice('请先结束录音或等待附件准备完成。');return;}const parts=media?.parts()??[];if(!text.trim()&&!parts.length)return;if(parts.length&&!adapter){append('assistant','附件已在本地准备好。请先在右上角设置里连接模型，再发送附件。',[],'连接状态');return;}const question=text.trim()||(parts.some(p=>p.type==='input_audio')?'请听取录音并回答其中的问题。':'请解释这张图片中可见的内容。'),names=media?.snapshot().files.map(f=>f.name)??[];append('user',question+(names.length?'\n[本轮附件：'+names.join('、')+'；后续轮次未自动重传]':''));$('s17-agent-input').value='';$('s17-agent-input').style.height='';const local=parts.length?null:guide(question);if(local){append('assistant',local.text,local.actions);syncComposer();return;}if(!adapter){append('assistant','可以先让我介绍当前案例、解释步骤，或者带你定位页面。连接大模型后，我们还可以继续讨论具体问题。',catalog.slice(0,5).map(c=>({target:c.id})));syncComposer();return;}const model=adapter,messages=history.map(m=>({...m}));if(parts.length)messages[messages.length-1].content=[{type:'input_text',text:question},...parts];busy=true;media?.setBusy(true);$('s17-agent-send').disabled=true;$('s17-agent-new').disabled=true;$('s17-agent-pending').hidden=false;$('s17-agent-mode').textContent='正在请求 '+model.name;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);try{requestCount++;const result=await model.reply({messages,context:{page:pageContext(),cases:catalog,scope:'静态教学演示；仅用户本轮明确附上的图片/录音作为多模态输入；不声称读取了iframe内结果或现场真值。'},tools,signal:controller.signal});if(model!==adapter)return;if(!result||typeof result.text!=='string'||!result.text.trim())throw Error('模型未返回可显示的文本');successfulCalls++;append('assistant',result.text,(Array.isArray(result.actions)?result.actions:[]),model.name+' · 模型回复');media?.clear();$('s17-agent-badge').textContent='模型已调用 · 本页连接';if($('s17-agent-autoread')?.checked&&!$('s17-agent-panel').hidden)readReply();}catch(e){append('assistant','本次模型请求未完成：'+(e.name==='AbortError'?'已取消或超时':e.message)+ '。页面导航仍可使用；未成功发送的附件可重试。',[],'连接状态');}finally{clearTimeout(timeout);controller=null;busy=false;media?.setBusy(false);syncComposer();$('s17-agent-new').disabled=false;$('s17-agent-pending').hidden=true;$('s17-agent-mode').textContent=adapter?adapter.name:'本地导览';}}
function open(){if(ownerIsParent)return;root.dataset.open='true';const panel=$('s17-agent-panel');panel.hidden=false;g.S17Live2D?.greet?.();$('s17-agent-launcher').setAttribute('aria-expanded','true');updateContext();if(!log.children.length)welcome();if(!options.open)$('s17-agent-input').focus();}
function close(){attachmentMenu(false);root.dataset.open='false';if(controller)controller.abort();g.S17Media?.cancelRecording();if(g.speechSynthesis)g.speechSynthesis.cancel();root.dataset.speaking='false';$('s17-agent-panel').hidden=true;$('s17-agent-launcher').setAttribute('aria-expanded','false');$('s17-agent-launcher').focus();}
const compact=document.createElement('button');compact.id='s17-agent-compact';compact.type='button';let compactChosen=false;function setCompact(value){root.dataset.compact=String(value);compact.textContent=value?'展开角色':'收起角色';compact.setAttribute('aria-pressed',String(value));}root.prepend(compact);setCompact(standalone||matchMedia('(max-width:650px)').matches);compact.onclick=()=>{compactChosen=true;setCompact(root.dataset.compact!=='true');};addEventListener('resize',()=>{if(!compactChosen)setCompact(standalone||matchMedia('(max-width:650px)').matches);});
$('s17-agent-launcher').onclick=()=>{$('s17-agent-panel').hidden?open():close();};$('s17-agent-close').onclick=close;$('s17-agent-form').onsubmit=e=>{e.preventDefault();ask($('s17-agent-input').value);};$('s17-agent-input').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();ask(e.currentTarget.value);}};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('s17-agent-panel').hidden)close();});document.addEventListener('click',e=>{const local=e.target.closest('[data-ag-tab]');if(local){e.preventDefault();document.querySelector('nav[aria-label="案例内容"] [data-tab="'+local.dataset.agTab+'"]')?.click();updateContext();return;}const b=e.target.closest('[data-s17-assistant],[data-ag-query]');if(!b)return;open();if(b.dataset.agQuery)ask(b.dataset.agQuery);});g.addEventListener('hashchange',updateContext);document.addEventListener('click',e=>{if(e.target.closest('nav[aria-label="案例内容"] [data-tab]'))updateContext();});
const options=root.querySelector('.s17-agent-options');
function showSettings(value){options.open=value;root.dataset.view=value?'settings':'chat';$('s17-agent-settings').setAttribute('aria-pressed',String(value));if(value)options.scrollTop=0;}
$('s17-agent-settings').onclick=()=>showSettings(!options.open);options.addEventListener('toggle',()=>{root.dataset.view=options.open?'settings':'chat';$('s17-agent-settings').setAttribute('aria-pressed',String(options.open));});
$('s17-agent-expand').onclick=()=>{const value=root.dataset.expanded!=='true';root.dataset.expanded=String(value);$('s17-agent-expand').setAttribute('aria-pressed',String(value));$('s17-agent-expand').setAttribute('aria-label',value?'还原对话面板':'展开对话面板');};
$('s17-agent-new').onclick=()=>{if(busy)return;history.length=0;lastReply='';g.S17Media?.clear();$('s17-agent-input').value='';showSettings(false);welcome();syncComposer();$('s17-agent-input').focus();};
$('s17-agent-attach').onclick=()=>attachmentMenu($('s17-agent-attachment-menu').hidden);document.addEventListener('click',e=>{if(!e.target.closest('#s17-agent-attachments'))attachmentMenu(false);if(e.target.closest('#s17-agent-attachment-menu button'))attachmentMenu(false);});
$('s17-agent-cancel').onclick=()=>controller?.abort();$('s17-agent-input').oninput=e=>{e.target.style.height='auto';e.target.style.height=Math.min(160,Math.max(86,e.target.scrollHeight))+'px';syncComposer();};
// Only an ownership flag crosses sandbox boundaries; no data or credentials.
g.addEventListener('message',e=>{if(e.data?.type==='s17-assistant-probe'&&[...document.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))e.source.postMessage({type:'s17-assistant-host',present:true},'*');if(g!==g.parent&&e.source===g.parent&&e.data?.type==='s17-assistant-host'&&e.data.present===true){ownerIsParent=true;root.hidden=true;controller?.abort();g.S17Media?.cancelRecording();}});if(g!==g.parent)g.parent.postMessage({type:'s17-assistant-probe'},'*');
function readReply(){if(!g.speechSynthesis||!g.SpeechSynthesisUtterance){append('assistant','当前浏览器未提供系统朗读。');return;}if(!lastReply)return;g.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(lastReply);speech.lang='zh-CN';const voice=g.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('zh'));if(voice)speech.voice=voice;speech.onstart=()=>{root.dataset.speaking='true';};speech.onend=speech.onerror=()=>{root.dataset.speaking='false';};g.speechSynthesis.speak(speech);}$('s17-agent-read').onclick=readReply;$('s17-agent-stop').onclick=()=>{g.speechSynthesis?.cancel();root.dataset.speaking='false';};
g.S17Assistant={open,close,updateComposer:syncComposer,resolve:destination,context:pageContext,tools,catalog:catalog.map(c=>({...c})),configure:model=>{if(busy)throw Error('请等待当前请求结束或先收起取消');if(!model||typeof model.name!=='string'||typeof model.reply!=='function')throw Error('需要已实现的模型适配器name与reply');adapter=model;successfulCalls=0;$('s17-agent-badge').textContent='模型已配置 · 待调用';$('s17-agent-mode').textContent=model.name;$('s17-agent-model-status').textContent='已提供模型适配器：'+model.name+'。可发送文字、图片、录音；接通状态由实际请求决定。';},disconnect:()=>{if(controller)controller.abort();adapter=null;successfulCalls=0;$('s17-agent-badge').textContent='本地导览 · 模型待接';$('s17-agent-mode').textContent='本地导览';},snapshot:()=>({version:'0.5.0-preview',avatar:g.S17Live2D?.state==='ready'?'Live2D '+g.S17Live2D.model:root.dataset.avatar??'svg_fallback',model:adapter?.name??null,requestCount,successfulCalls,open:!$('s17-agent-panel').hidden,busy,parentOwned:ownerIsParent,media:g.S17Media?.snapshot()??null,context:pageContext(),history:history.map(v=>({...v}))})};updateContext();syncComposer();
})(window);

(function(g){'use strict';
// Files and recordings remain in this page's memory until the user presses Send.
const form=document.getElementById('s17-agent-form');if(!form)return;
const box=document.createElement('div');box.className='s17-agent-media';
box.innerHTML='<div class="s17-media-buttons"><button type="button" id="s17-media-image">＋ 图片</button><button type="button" id="s17-media-audio">＋ 音频</button><button type="button" id="s17-media-record" aria-pressed="false">录音</button><input id="s17-media-image-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><input id="s17-media-audio-file" type="file" accept=".wav,.mp3,.m4a,.aac,.webm,.ogg" hidden></div><div id="s17-media-preview"></div><p id="s17-media-notice" role="status"></p>';
form.prepend(box);document.getElementById('s17-agent-attachment-menu')?.append(box.querySelector('.s17-media-buttons'));document.getElementById('s17-agent-microphone')?.append(document.getElementById('s17-media-record'));const $=id=>document.getElementById(id),preview=$('s17-media-preview'),recordButton=$('s17-media-record'),pending=new Map();let processing=0,locked=false,recorder=null,stream=null,timer=null,recording=false,stopping=false,cancelled=false,epoch=0;
const auto=document.createElement('label');auto.className='s17-auto-read';auto.innerHTML='<input id="s17-agent-autoread" type="checkbox"> 自动朗读模型回复（浏览器/系统语音）';document.querySelector('.s17-agent-options').insertBefore(auto,document.querySelector('.s17-speech-controls'));
function notice(text){$('s17-media-notice').textContent=text;}
function render(){preview.replaceChildren();for(const f of pending.values()){const row=document.createElement('div');row.className='s17-media-item';if(f.kind==='image'){const image=document.createElement('img');image.src=f.url;image.alt='待发送图片预览';row.append(image);}else{const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=f.url;row.append(audio);}const title=document.createElement('span');title.textContent=f.name+(f.seconds?' · '+f.seconds.toFixed(1)+'秒':'');const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.setAttribute('aria-label','移除'+f.name);remove.disabled=locked;remove.onclick=()=>{URL.revokeObjectURL(f.url);pending.delete(f.kind);render();notice('附件已移除，不会发送该文件。');};row.append(title,remove);preview.append(row);}for(const id of ['s17-media-image','s17-media-audio','s17-media-image-file','s17-media-audio-file'])$(id).disabled=locked||!!processing||recording;recordButton.disabled=locked||!!processing||stopping;recordButton.setAttribute('aria-pressed',String(recording));if(!recording){recordButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';recordButton.setAttribute('aria-label','麦克风录音');recordButton.title='麦克风录音';}g.S17Assistant?.updateComposer();}
const dataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('文件读取失败'));reader.readAsDataURL(blob);});
async function wav(blob){const Context=g.AudioContext||g.webkitAudioContext;if(!Context||!g.OfflineAudioContext)throw Error('此浏览器无法解码音频，请换用桌面Chrome或Edge');const ctx=new Context();let decoded;try{decoded=await ctx.decodeAudioData(await blob.arrayBuffer());}finally{await ctx.close();}if(!decoded.duration||decoded.duration>60)throw Error('演示仅接受60秒以内的录音');const offline=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const mono=(await offline.startRendering()).getChannelData(0),buffer=new ArrayBuffer(44+mono.length*2),view=new DataView(buffer),put=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i));};put(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);put(8,'WAVE');put(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);put(36,'data');view.setUint32(40,mono.length*2,true);for(let i=0;i<mono.length;i++){const v=Math.max(-1,Math.min(1,mono[i]));view.setInt16(44+i*2,v<0?v*32768:v*32767,true);}return{blob:new Blob([buffer],{type:'audio/wav'}),seconds:decoded.duration};}
async function prepare(file,kind){if(locked||processing)return;const token=epoch;processing++;render();notice('正在本地准备附件，尚未上传…');try{if(!file.size||file.size>(kind==='image'?5:8)*1024*1024)throw Error(kind==='image'?'图片需小于5MB':'录音文件需小于8MB、60秒以内');let blob=file,seconds=null,name=file.name;if(kind==='image'){const ext=name.split('.').pop().toLowerCase(),mime={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];if(!mime)throw Error('图片支持JPG、PNG或WebP');blob=new Blob([file],{type:mime});const bitmap=await createImageBitmap(blob);if(bitmap.width*bitmap.height>16000000){bitmap.close();throw Error('图片像素超过1600万，请先缩小');}bitmap.close();}else{const audio=await wav(file);blob=audio.blob;seconds=audio.seconds;name=name.replace(/\.[^.]*$/,'')+'.wav';}const data=await dataURL(blob);if(token!==epoch)return;const old=pending.get(kind);if(old)URL.revokeObjectURL(old.url);pending.set(kind,{kind,name,seconds,data,url:URL.createObjectURL(blob)});notice('附件已准备好，尚未上传。可预览、移除，或点击发送。');}catch(e){if(token===epoch)notice(e.message);}finally{processing--;render();}}
for(const kind of ['image','audio']){$('s17-media-'+kind).onclick=()=>$('s17-media-'+kind+'-file').click();$('s17-media-'+kind+'-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)await prepare(f,kind);};}
function release(){clearInterval(timer);timer=null;stream?.getTracks().forEach(t=>t.stop());stream=null;}
function stop(cancel=false){const active=recorder?.state==='recording';cancelled=cancelled||cancel||!active;if(!active)epoch++;stopping=active;if(active)recorder.stop();release();recording=false;render();}
recordButton.onclick=async()=>{if(recording){stop();return;}if(!g.isSecureContext||!navigator.mediaDevices?.getUserMedia||!g.MediaRecorder){notice('录音需要HTTPS或本机localhost环境及浏览器麦克风支持。也可上传现有录音文件。');return;}const token=++epoch;recording=true;cancelled=false;render();recordButton.textContent='取消录音';notice('等待麦克风授权…');try{const acquired=await navigator.mediaDevices.getUserMedia({audio:true});if(token!==epoch||cancelled){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;const chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{const wasCancelled=cancelled,mime=recorder.mimeType;recorder=null;stopping=false;release();recording=false;render();if(wasCancelled){notice('录音已停止并丢弃，没有上传。');return;}await prepare(new File(chunks,'麦克风录音.webm',{type:mime}),'audio');};recorder.onerror=()=>{cancelled=true;stop(true);notice('录音未完成，请检查麦克风权限或上传已有文件。');};recorder.start();const start=Date.now();recordButton.textContent='停止录音 · 0秒';notice('正在本地录音，最长60秒；停止后可试听，再点击发送。');timer=setInterval(()=>{const seconds=Math.floor((Date.now()-start)/1000);recordButton.textContent='停止录音 · '+seconds+'秒';if(seconds>=60)stop();},250);}catch(e){if(token!==epoch)return;release();recording=false;render();notice(e.name==='NotAllowedError'?'未获得麦克风授权。可上传已有录音文件。':'无法开始录音，请检查麦克风或上传已有文件。');}};
function clear(){epoch++;for(const f of pending.values())URL.revokeObjectURL(f.url);pending.clear();render();notice('');}
g.S17Media={parts:()=>[...pending.values()].map(f=>f.kind==='image'?{type:'input_image',image_url:f.data}:{type:'input_audio',audio_url:f.data}),snapshot:()=>({files:[...pending.values()].map(({kind,name,seconds})=>({kind,name,seconds})),processing:!!processing||stopping,recording}),notice,clear,setBusy:value=>{locked=value;render();},cancelRecording:()=>{epoch++;if(recording||stream)stop(true);}};
g.addEventListener('pagehide',()=>{stop(true);clear();});render();
})(window);

(function(g){'use strict';const host=document.querySelector('#s17-assistant .s17-agent-options');if(!host)return;
const box=document.createElement('div');box.className='s17-model-config';box.innerHTML='<h3>火山方舟</h3><label>Model ID<input id="s17-ark-model" value="doubao-seed-2-0-mini-260428" spellcheck="false" autocomplete="off"></label><label>API Key<input id="s17-ark-key" type="password" autocomplete="off" placeholder="输入你的 API Key"></label><label>调用地址<input id="s17-ark-url" value="https://ark.cn-beijing.volces.com/api/v3/responses" spellcheck="false" autocomplete="off"></label><button id="s17-ark-connect" type="button">连接模型</button><button id="s17-ark-disconnect" type="button">断开连接</button><p id="s17-ark-status">填写连接信息后，点击“连接模型”。如使用自己的代理，可填写兼容 Responses API 的地址。</p><p>支持文字、图片和录音输入，回复显示为文字，可选系统朗读。<a href="https://docs.volcengine.com/docs/ark/model-pricing?lang=zh" target="_blank" rel="noopener">官方价格</a> · <a href="https://docs.volcengine.com/docs/ark/create-model-responses-api?lang=en" target="_blank" rel="noopener">接口文档</a></p>';
host.insertBefore(box,document.getElementById('s17-agent-model-status'));const $=id=>document.getElementById(id);let credential='',calls=0,lastUsage=null;
function payload(messages,context,tools,model){const instructions='你是井见录井教学网站的讲解和导航助手。用自然、简洁的中文。重点解释业务概念与页面操作，不扩展研究训练或现场建议。以下context是静态页面元数据，不是现场测量或iframe里的实时结果。可听取本轮input_audio并理解本轮input_image；历史中的附件名称不代表再次提供了原文件，缺少内容时请用户重新附上。不要声称看到了未提供的图像、指标或用户文件。描述图片时区分可见外观与推断，不凭外观判定油气。需要导航时调用navigate_page，仅支持已声明目标；语音中的导航请求同样可调用。回复文字即可，语音播放由页面系统朗读完成。不要生成JavaScript或未知URL，不自动运行训练/上传/删除。你可参考以下案例说明：'+JSON.stringify(context);return{model,input:[{role:'system',content:instructions},...messages.slice(-10).map(m=>({role:m.role,content:m.content}))],tools:tools.map(t=>({type:'function',name:t.name,description:t.description,parameters:t.parameters})),tool_choice:'auto',thinking:{type:'disabled'},max_output_tokens:700,store:false,stream:false};}
function parse(result){const messages=(result.output??[]).filter(v=>v.type==='message').flatMap(v=>v.content??[]).filter(v=>v.type==='output_text').map(v=>v.text).join('\n'),actions=[];for(const item of result.output??[]){if(item.type!=='function_call'||item.name!=='navigate_page')continue;try{const a=JSON.parse(item.arguments);g.S17Assistant.resolve(a);actions.push(a);}catch{}}if(!messages&&!actions.length)throw Error(result.error?.message??'服务未返回文字或有效导航动作');return{text:messages||(actions.length?'我找到对应页面，点击下面进入。':''),actions};}
$('s17-ark-connect').onclick=()=>{try{const model=$('s17-ark-model').value.trim(),value=$('s17-ark-key').value.trim(),url=new URL($('s17-ark-url').value.trim(),location.href);if(!/^[a-zA-Z0-9._-]{3,120}$/.test(model))throw Error('请填写控制台的Model ID或推理接入点ID');if(!value)throw Error('请在自己的浏览器填写API Key');if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('调用地址需HTTPS或本机HTTP代理');const endpoint=url.href;g.S17Assistant.configure({name:'火山方舟 · '+model,reply:async({messages,context,tools,signal})=>{const activeKey=credential;if(!activeKey)throw Error('模型已断开，请重新配置');calls++;let r;try{r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+activeKey},body:JSON.stringify(payload(messages,context,tools,model)),signal});}catch(e){if(e.name==='AbortError')throw e;throw Error('无法连接接口；请检查网络、地址与CORS，或使用允许跨域的接口代理');}const body=await r.json().catch(()=>({}));if(!r.ok||body.error)throw Error(('HTTP '+r.status+'：'+(body.error?.message??'模型服务拒绝请求')).replaceAll(activeKey,'[redacted]'));lastUsage=body.usage??null;return parse(body);}});credential=value;$('s17-ark-key').value='';$('s17-ark-status').textContent='已在本页内存配置，尚未验证调用。下一次开放式提问将实际请求 '+url.host+'；导航快捷命令仍在本地处理。';}catch(e){$('s17-ark-status').textContent=e.message;}};
$('s17-ark-disconnect').onclick=()=>{credential='';$('s17-ark-key').value='';g.S17Assistant.disconnect();$('s17-ark-status').textContent='已清空本页Key并断开模型；没有写入浏览器持久存储。';};g.S17Ark={snapshot:()=>({configured:!!credential,calls,lastUsage,liveCallVerified:g.S17Assistant.snapshot().successfulCalls>0}),makePayload:payload,parseResponse:parse};
})(window);

}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startAssistant,{once:true});else startAssistant();})();
