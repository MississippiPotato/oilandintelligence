window.S17Page={"sceneId":"s1","caseId":"s17x-s1-seismic-fault","name":"地震断层自动解释","title":"地震断层自动解释：沿波形不连续性寻找错断","summary":"地震剖面上的层位为什么会错开？把地质错动、反射波形和局部不连续性连起来，再理解模型如何为解释提供候选。","directory":"expansion-cases","caseVersion":"1.0.1","portalHref":"../../../../portal/index.html","referenceHref":"../../../../portal/reference/fluorescence.html"};
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

;
(function () {
  'use strict';
  const core = globalThis.S1Core, $ = id => document.getElementById(id), caseId = 's17x-s1-seismic-fault';
  const defaults = { noise: .1, throwSamples: 6, gap: 0, thresholdShift: 0, seed: 2029 };
  const featureNames = ['左右道不连续性', '移位匹配改善', '水平振幅差异', '垂向振幅差异', '局部波形能量', '归一化水平差异', '邻域缺失比例', '纵向持续性', '纵横持续性差'];
  let result = null, status = 'idle', runId = 0, seed = defaults.seed, selected = { x: 44, y: 36 }, reviews = [], reviewHistory = [];
  const pct = v => v == null ? '不适用' : (v * 100).toFixed(1) + '%';
  const dec = (v, n = 3) => v == null ? '不适用' : Number(v).toFixed(n);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function params() { return { noise: Number($('noise').value), throwSamples: Number($('throw').value), gap: Number($('gap').value), thresholdShift: Number($('threshold').value), seed }; }
  function sourceVersion() { return result ? 's1-v1/' + JSON.stringify(result.params) : null; }
  function invalidateReviews(reason) {
    if (reviews.length) reviewHistory.push({ action: 'invalidate-current-review', reason, runId, sourceVersion: sourceVersion(), count: reviews.length });
    reviews = []; $('review-log').textContent = '当前尚无有效人工意见；旧运行的意见保留在导出历史。';
  }
  function setStatus(value, text) {
    status = value; $('status').dataset.state = value; $('status').textContent = text;
    $('export').disabled = value !== 'ready'; $('review').disabled = value !== 'ready'; $('run').disabled = value === 'running'; $('maps').dataset.stale = String(value === 'stale');
  }
  function outputs() {
    $('throw-value').value = Number($('throw').value) * 4 + ' ms'; $('noise-value').value = Number($('noise').value).toFixed(2); $('gap-value').value = pct(Number($('gap').value));
    const shift = Number($('threshold').value); $('threshold-value').value = (shift >= 0 ? '+' : '') + shift.toFixed(2);
  }
  function stale() {
    invalidateReviews('input-changed'); outputs(); setStatus('stale', '输入已改变，图上保留上一次结果。重新运行后生成当前剖面的得分、迹线和指标。');
    $('metrics').innerHTML = '<p class="empty">待重算：当前输入没有评价结果。</p>';
    $('comparison-table').innerHTML = '<p class="empty">重新运行后更新比较表。</p>';
    ['provenance', 'weights', 'loss-chart', 'validation-chart', 'pixel-info', 'feature-chart', 'waveform'].forEach(id => { $(id).innerHTML = ''; });
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
    document.querySelectorAll('[data-step-panel]').forEach(n => { n.hidden = Number(n.dataset.stepPanel) !== index; });
    document.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-selected', String(Number(b.dataset.step) === index)));
  }
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => openStep(Number(b.dataset.step))));
  document.querySelectorAll('[data-prev]').forEach(b => b.addEventListener('click', () => openStep(Math.max(0, Number(b.dataset.prev) - 1))));
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => Number(b.dataset.next) === 4 ? openTab('lab') : openStep(Number(b.dataset.next) + 1)));
  function table(headers, rows) { return '<table><thead><tr>' + headers.map(h => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map((v, i) => '<' + (i ? 'td' : 'th') + (i ? '' : ' scope="row"') + '>' + v + '</' + (i ? 'td' : 'th') + '>').join('') + '</tr>').join('') + '</tbody></table>'; }
  function seismicColor(value) {
    const v = clamp(value / 1.25, -1, 1), mix = Math.abs(v), base = v >= 0 ? [179, 83, 66] : [52, 99, 148];
    return 'rgb(' + base.map(c => Math.round(247 + (c - 247) * mix)).join(',') + ')';
  }
  function heat(value) {
    const a = value < .5 ? [33, 73, 112] : [59, 157, 151], b = value < .5 ? [59, 157, 151] : [242, 206, 113], t = value < .5 ? value * 2 : (value - .5) * 2;
    return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  }
  function trace(ctx, points, sx, sy, color, dashed) {
    if (!points.length) return;
    function path() { ctx.beginPath(); points.forEach((p, i) => { const x = (p.x + .5) * sx, y = (p.y + .5) * sy; if (i === 0 || p.y - points[i - 1].y > 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); }
    ctx.lineWidth = dashed ? 3 : 5; ctx.strokeStyle = '#fff'; ctx.setLineDash(dashed ? [10, 6] : []); path(); ctx.stroke();
    ctx.lineWidth = dashed ? 3 : 3; ctx.strokeStyle = color; path(); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawMaps() {
    if (!result) return;
    const obs = result.observations, view = $('comparison-view').value;
    ['seismic', 'score', 'comparison'].forEach(type => {
      const canvas = $(type + '-map'), ctx = canvas.getContext('2d'), sx = canvas.width / obs.w, sy = canvas.height / obs.h;
      for (let i = 0; i < obs.w * obs.h; i++) {
        let color;
        if (obs.missing[i]) color = '#d6dddf';
        else if (type === 'seismic') color = seismicColor(obs.amplitude[i]);
        else if (type === 'score') color = heat(result.prediction.scores[i]);
        else if (view === 'reference') color = result.evaluationTruth.labels[i] ? '#c99655' : '#e7edef';
        else if (view === 'baseline') color = result.baseline.labels[i] === 1 ? '#ba9c82' : seismicColor(obs.amplitude[i] * .3);
        else { const p = result.prediction.labels[i], t = result.evaluationTruth.labels[i]; color = p === 1 && t ? '#5b9b8c' : p !== t ? '#c1644d' : '#e7edef'; }
        ctx.fillStyle = color; ctx.fillRect(i % obs.w * sx, Math.floor(i / obs.w) * sy, sx + .2, sy + .2);
      }
      const line = type === 'comparison' && view === 'baseline' ? result.baseline.line : result.prediction.line;
      trace(ctx, line, sx, sy, '#087f83', false);
      if ($('show-truth').checked) trace(ctx, result.evaluationTruth.line, sx, sy, '#c99655', true);
      reviews.forEach(r => {
        const x = (r.x + .5) * sx, y = (r.y + .5) * sy; ctx.strokeStyle = r.action === 'remove-row' ? '#b64228' : '#9a651c'; ctx.lineWidth = 3;
        if (r.action === 'remove-row') { ctx.beginPath(); ctx.moveTo(x - 7, y - 7); ctx.lineTo(x + 7, y + 7); ctx.moveTo(x + 7, y - 7); ctx.lineTo(x - 7, y + 7); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
      });
      ctx.strokeStyle = '#183a45'; ctx.lineWidth = 4; ctx.strokeRect(selected.x * sx - 3, selected.y * sy - 3, sx + 6, sy + 6);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(selected.x * sx - 3, selected.y * sy - 3, sx + 6, sy + 6);
    });
    $('third-title').textContent = view === 'baseline' ? '03　不连续性阈值基线' : view === 'reference' ? '03　独立参考断层带' : '03　模型错误定位';
    $('third-caption').textContent = view === 'error' ? '青绿：正确检出；珊瑚：误报或漏检；灰色：缺失' : view === 'reference' ? '参考断层带与迹线只用于评价和显示' : '同一剖面；实线候选，金色虚线参考';
  }
  function inspect() {
    if (!result || status !== 'ready') return;
    const obs = result.observations, i = selected.y * obs.w + selected.x, x = selected.x, y = selected.y, f = result.prediction.features[i], s = result.prediction.scores[i], time = obs.startTime_ms + y * obs.sampleInterval_ms;
    $('px').value = x; $('py').value = y;
    $('pixel-info').innerHTML = '<p><b>位置</b>：第' + x + '道 / ' + x * 25 + ' m，双程时间 ' + time + ' ms。</p><p><b>模型支持度</b>：' + (s == null ? '缺失，拒判' : dec(s)) + ' · 当前阈值 ' + dec(result.threshold, 2) + '</p><p><b>局部不连续性 D</b>：' + dec(f[0]) + ' · <b>邻域缺失</b>：' + pct(f[6]) + '</p><p><b>参考</b>：' + (result.evaluationTruth.labels[i] ? '断层带像素' : '背景像素') + '；仅用于评价对照。</p>';
    const ys = Array.from({ length: 17 }, (_, j) => y - 8 + j), values = ys.flatMap(row => [obs.amplitude[row * obs.w + x - 2], obs.amplitude[row * obs.w + x + 2]]), scale = Math.max(.4, ...values.map(Math.abs));
    function path(column) {
      let d = '', previous = false;
      ys.forEach((row, j) => { const index = row * obs.w + column; if (obs.missing[index]) { previous = false; return; } const px = 48 + j * 29, py = 125 - obs.amplitude[index] / scale * 77; d += (previous ? 'L' : 'M') + px + ',' + py; previous = true; }); return d;
    }
    $('waveform').innerHTML = '<svg viewBox="0 0 565 250" role="img" aria-label="选中位置左右相邻道的真实局部振幅" style="font:17px system-ui;fill:#183a45"><path d="M48 35v177h470M48 125h470" fill="none" stroke="#b7c9cf"/><text x="6" y="28">振幅</text><path d="' + path(x - 2) + '" fill="none" stroke="#2c63ae" stroke-width="3"/><path d="' + path(x + 2) + '" fill="none" stroke="#087f83" stroke-width="3" stroke-dasharray="7 4"/><path d="M280 36v175" stroke="#c99655" stroke-dasharray="4 4"/><text x="49" y="236">' + (time - 32) + ' ms</text><text x="252" y="236">' + time + '</text><text x="455" y="236">' + (time + 32) + ' ms</text><text x="93" y="22" fill="#2c63ae">左侧第' + (x - 2) + '道 ━</text><text x="306" y="22" fill="#087f83">右侧第' + (x + 2) + '道 ┄</text></svg>';
    const model = result.training.model, contributions = f.map((v, j) => (v - model.mu[j]) / model.sd[j] * model.weights[j + 1]), max = Math.max(.5, ...contributions.map(Math.abs));
    const bars = contributions.map((v, j) => { const width = Math.abs(v) / max * 112, bx = v < 0 ? 359 - width : 359; return '<text x="5" y="' + (31 + j * 30) + '">' + featureNames[j] + '</text><rect x="' + bx + '" y="' + (13 + j * 30) + '" width="' + width + '" height="20" rx="3" fill="' + (v < 0 ? '#819bc0' : '#3a9687') + '"/><text x="500" y="' + (31 + j * 30) + '" text-anchor="end">' + (v >= 0 ? '+' : '') + dec(v, 2) + '</text>'; }).join('');
    $('feature-chart').innerHTML = '<p class="small-chart-title">实际标准化特征 × 学习系数；右侧推动分数上升，左侧推动下降。</p><svg viewBox="0 0 520 295" role="img" aria-label="九项特征对当前逻辑回归得分的实际贡献" style="font:17px system-ui;fill:#183a45"><path d="M359 8v272" stroke="#afc1c7"/>' + bars + '</svg><p>截距 ' + dec(model.weights[0]) + '；得分来自截距与各项贡献之和的sigmoid变换。</p>';
    drawMaps();
  }
  function chart(rows, xKey, yKey, options) {
    const xmin = Math.min(...rows.map(r => r[xKey])), xmax = Math.max(...rows.map(r => r[xKey])), ymax = Math.max(.001, ...rows.map(r => r[yKey])) * 1.08;
    const points = rows.map(r => [55 + (r[xKey] - xmin) / Math.max(.001, xmax - xmin) * 430, 185 - r[yKey] / ymax * 140]);
    return '<svg viewBox="0 0 530 250" role="img" aria-label="' + options.label + '" style="font:17px system-ui;fill:#183a45"><path d="M55 30v155h435" fill="none" stroke="#b7c9cf"/><path d="' + points.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join('') + '" fill="none" stroke="#087f83" stroke-width="3"/>' + points.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#087f83"/>').join('') + '<text x="8" y="28">' + options.y + '</text><text x="12" y="55">' + ymax.toFixed(2) + '</text><text x="29" y="190">0</text><text x="50" y="213">' + dec(xmin, options.digits) + '</text><text x="459" y="213">' + dec(xmax, options.digits) + '</text><text x="243" y="242">' + options.x + '</text></svg>';
  }
  function metric(label, value, caption) { return '<div class="metric"><span>' + label + '</span><strong>' + value + '</strong><small>' + caption + '</small></div>'; }
  function render() {
    const m = result.metrics.model, b = result.metrics.baseline, t = result.training;
    $('metrics').innerHTML = metric('学习模型 · 断层带IoU', pct(m.iou), '真实像素重叠') + metric('学习模型 · 断层带F1', pct(m.f1), '包含误报与漏检') + metric('阈值基线 · 断层带F1', pct(b.f1), '同一固定评价区') + metric('学习模型 · 迹线F1', pct(m.lineF1), '同一时间行 ±2道容差');
    $('comparison-table').innerHTML = table(['方法', 'TP', 'FP', 'FN', '拒判像素', '覆盖率', '带IoU', '带F1', '迹线匹配/候选/参考'], [[ '9维逻辑回归', m.tp, m.fp, m.fn, m.abstained, pct(m.coverage), pct(m.iou), pct(m.f1), m.lineMatched + '/' + m.predictedRows + '/' + m.truthRows ], ['不连续性阈值', b.tp, b.fp, b.fn, b.abstained, pct(b.coverage), pct(b.iou), pct(b.f1), b.lineMatched + '/' + b.predictedRows + '/' + b.truthRows ]]);
    $('provenance').innerHTML = '<div class="split-strip"><span>训练：' + t.training.groupIds.join(' / ') + '</span><span>验证：' + t.validation.groupIds.join(' / ') + '</span><span>测试：' + result.observations.groupId + '</span></div><p>训练采样 ' + t.training.pixels + ' 像素，其中断层带 ' + t.training.positive + ' 像素；9维特征，240轮梯度更新。默认模型阈值 ' + dec(t.threshold, 2) + '，基线阈值 ' + dec(t.baselineThreshold, 2) + '；当前探索阈值 ' + dec(result.threshold, 2) + '。</p><p>当前评价 ' + m.total + ' 像素，缺失拒判 ' + m.abstained + '；参考迹线 ' + m.truthRows + ' 行，模型输出 ' + m.predictedRows + ' 行。</p>';
    $('loss-chart').innerHTML = chart(t.model.loss, 'epoch', 'loss', { label: '真实240轮训练交叉熵变化', x: '训练轮次', y: '交叉熵', digits: 0 });
    $('validation-chart').innerHTML = chart(t.validation.candidates, 'threshold', 'f1', { label: '独立验证剖面的阈值与真实断层带F1', x: '得分阈值', y: '验证F1', digits: 2 }) + '<p>选取验证F1最高阈值；测试数据不参与该选择。</p>';
    $('weights').innerHTML = table(['特征', '训练均值', '训练标准差', '学习系数'], featureNames.map((name, i) => [name, dec(t.model.mu[i]), dec(t.model.sd[i]), dec(t.model.weights[i + 1])]));
    inspect();
  }
  async function run() {
    if (status === 'running') return;
    invalidateReviews('new-run'); setStatus('running', '正在从振幅计算特征、拟合逻辑回归并解释当前剖面……');
    await new Promise(resolve => requestAnimationFrame(resolve));
    try { result = core.run(params()); runId++; setStatus('ready', '计算完成 · ' + result.observations.groupId + ' · ' + result.metrics.model.total + '评价像素 · ' + result.prediction.line.length + '行候选迹线。点击任意图查看依据。'); render(); }
    catch (error) { setStatus('error', '本次计算未完成：' + error.message); console.error(error); }
  }
  ['noise', 'throw', 'gap', 'threshold'].forEach(id => $(id).addEventListener('input', stale));
  ['show-truth', 'comparison-view'].forEach(id => $(id).addEventListener('change', drawMaps));
  $('run').addEventListener('click', run);
  $('reset').addEventListener('click', () => { seed = defaults.seed; $('noise').value = defaults.noise; $('throw').value = defaults.throwSamples; $('gap').value = defaults.gap; $('threshold').value = 0; $('comparison-view').value = 'baseline'; $('show-truth').checked = true; selected = { x: 44, y: 36 }; outputs(); run(); });
  $('preset-fail').addEventListener('click', () => { $('throw').value = 2; $('noise').value = .16; $('gap').value = .18; $('threshold').value = 0; stale(); });
  $('preset-none').addEventListener('click', () => { $('throw').value = 0; $('noise').value = .1; $('gap').value = 0; $('threshold').value = 0; stale(); });
  $('new-scene').addEventListener('click', () => { seed += 107; stale(); $('status').textContent = '已切换到新测试剖面-' + seed + '，请运行。训练与验证剖面保持固定。'; });
  function select(x, y) { selected = { x: clamp(Math.round(x), 3, 80), y: clamp(Math.round(y), 8, 63) }; inspect(); }
  ['seismic-map', 'score-map', 'comparison-map'].forEach(id => {
    $(id).addEventListener('click', e => { if (status !== 'ready') return; const r = e.currentTarget.getBoundingClientRect(); select(Math.floor((e.clientX - r.left) / r.width * 84), Math.floor((e.clientY - r.top) / r.height * 72)); });
    $(id).addEventListener('keydown', e => { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (d && status === 'ready') { e.preventDefault(); select(selected.x + d[0], selected.y + d[1]); } });
  });
  ['px', 'py'].forEach(id => $(id).addEventListener('change', () => select(Number($('px').value), Number($('py').value))));
  $('review').addEventListener('click', () => {
    if (status !== 'ready') return;
    const fragment = []; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = selected.x + dx, y = selected.y + dy, i = y * result.observations.w + x; fragment.push({ x, y, amplitude: result.observations.amplitude[i], missing: result.observations.missing[i] }); }
    const row = { ...selected, action: $('review-kind').value, runId, sourceVersion: sourceVersion(), originalRowPoint: result.prediction.line.find(p => p.y === selected.y) || null, source: '人工意见', observationFragment: fragment };
    reviews = reviews.filter(r => !(r.x === row.x && r.y === row.y)); reviews.push(row); reviewHistory.push({ ...row, event: 'opinion-saved' });
    $('review-log').textContent = '本次 ' + reviews.length + ' 处意见；已保存第' + row.x + '道 / ' + (800 + row.y * 4) + ' ms 的复核记录。原模型输出和指标保持独立。'; drawMaps();
  });
  function evidence() {
    if (status !== 'ready') return null;
    const obs = result.observations, sourceId = 's1:' + obs.groupId, index = selected.y * obs.w + selected.x;
    return { schemaVersion: '1.0', sceneId: 's1', caseId, caseVersion: '1.0.1', runId, datasetId: 's17x-s1-synthetic-v1', wellId: null, areaId: obs.groupId, dataNature: 'synthetic_teaching',
      runConfig: { seed, dataVersion: 's1-synthetic-v1', splitDescription: '8 independent training sections; 2 validation sections; independent test section', method: 'nine-feature regularized logistic regression', parameters: result.params, inputRevision: runId },
      observations: obs, prediction: { labels: result.prediction.labels, scores: result.prediction.scores, line: result.prediction.line }, baseline: result.baseline, evaluationReference: result.evaluationTruth, metrics: result.metrics, training: { ...result.training.training, validation: result.training.validation, model: result.training.model, threshold: result.threshold },
      sources: [{ sourceRecordId: sourceId, sourceVersion: sourceVersion(), sourceType: 'image_region', content: obs, units: { traceSpacing_m: 25, sampleInterval_ms: 4 } }],
      claims: [{ claimId: caseId + '-run-' + runId + '-pixel-' + index, revision: 1, kind: 'model_inference', statement: '当前点的模型支持度为' + dec(result.prediction.scores[index]), sourceRefs: [{ sourceRecordId: sourceId, sourceVersion: sourceVersion(), selector: { type: 'image_region', x: selected.x - 2, y: selected.y - 8, width: 5, height: 17, centerPixelIndex: index } }], reviewStatus: 'needs_review', traceabilityStatus: 'linked', supportStatus: 'unchecked', evidence: { features: result.prediction.features[index], threshold: result.threshold } }],
      humanReview: reviews, humanReviewHistory: reviewHistory, limitations: ['合成二维反射剖面', '断距以双程时间位移表达', '平衡采样训练后的得分未经概率校准'], references: ['https://wiki.seg.org/wiki/Semblance,_coherence,_and_other_discontinuity_attributes', 'https://www.aapg.org/news-and-media/explorer/is-it-a-subtle-fault-or-just-noise/'] };
  }
  $('export').addEventListener('click', () => {
    const payload = evidence(); if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = caseId + '-run-' + runId + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  globalThis.CaseInspect = { snapshot: () => JSON.parse(JSON.stringify({ sceneId: 's1', caseId, status, metrics: status === 'ready' ? result.metrics : null, runId, params: params(), selected, reviewCount: reviews.length, reviewHistoryCount: reviewHistory.length, prediction: status === 'ready' ? result.prediction.labels : null })), evidence: () => JSON.parse(JSON.stringify(evidence())) };
  outputs();
})();

(function(g){'use strict';
function mount(root=document){root.querySelectorAll('.case-flow-overview').forEach(chart=>{
 if(chart.dataset.flowMounted)return;chart.dataset.flowMounted='true';
 const area=chart.closest('#workflow')||chart.closest('main')||root;
 const targets=()=>[...area.querySelectorAll('[data-sr-step],[data-step]')].filter(e=>!e.closest('.case-flow-overview'));
 const chapters=()=>area.querySelectorAll('#workflow-content>article,.flow-step,.workflow-step');
 const select=n=>{chart.querySelectorAll('[data-flow-step]').forEach(el=>el.setAttribute('aria-current',String(+el.dataset.flowStep===n)));};
 const go=el=>{const n=+el.dataset.flowStep,b=targets().find(b=>+(b.dataset.srStep??b.dataset.step)===n);if(b)b.click();else chapters()[n]?.scrollIntoView({block:'start',behavior:'auto'});select(n);};
 chart.querySelectorAll('[data-flow-step]').forEach(el=>{el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label','查看步骤 '+(+el.dataset.flowStep+1)+'：'+el.textContent.trim());});
 chart.querySelector('[data-flow-instruction]').textContent=' 点击图中节点，可查看对应步骤。';
 chart.addEventListener('click',e=>{const el=e.target.closest('[data-flow-step]');if(el)go(el);});
 chart.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-flow-step]')){e.preventDefault();go(e.target);}});
 area.addEventListener('click',e=>{const b=e.target.closest('[data-sr-step],[data-step]');if(b)select(+(b.dataset.srStep??b.dataset.step));});
 const current=targets().find(b=>b.matches('[aria-selected=true],[aria-pressed=true],.active'));select(+(current?.dataset.srStep??current?.dataset.step??0));
 });}
g.S17Flow={mount};
})(globalThis);

(function(){function startFlow(){var area=document.getElementById("workflow");if(area&&!area.querySelector(".case-flow-overview"))area.insertAdjacentHTML("afterbegin","<figure class=\"case-flow-overview study-workflow-overview\" data-flow-scene=\"s1\" style=\"margin:24px 0 34px;padding:20px 18px;background:#fbfcfa;border:1px solid #dce5df;border-radius:14px;min-width:0;max-width:100%;box-sizing:border-box\"><style>.case-flow-overview h3{font-size:23px!important;line-height:1.6!important;margin:0 0 9px!important;color:#244b48}.case-flow-overview p,.case-flow-overview figcaption{font-size:16px!important;line-height:1.8!important;color:#5c726e}.case-flow-scroll{overflow-x:auto;max-width:100%;overscroll-behavior-x:contain}.case-flow-overview svg{display:block;width:100%;min-width:940px;height:auto;max-width:none;font-family:system-ui,Microsoft YaHei,sans-serif;color:#254c48}.case-flow-title{font-size:19px;font-weight:650;fill:#244b48}.case-flow-detail{font-size:15px;fill:#536b65}.case-flow-edge{font-size:15px;fill:#647a73;paint-order:stroke;stroke:#fbfcfa;stroke-width:5px;stroke-linejoin:round}.case-flow-node rect,.case-flow-node polygon{stroke:#a6bbb3;stroke-width:1.5}.case-flow-node[role=button]{cursor:pointer;outline:none}.case-flow-node[aria-current=true] rect,.case-flow-node[aria-current=true] polygon,.case-flow-node:focus rect,.case-flow-node:focus polygon{stroke:#246f63;stroke-width:3.5}.case-flow-node:hover rect{filter:brightness(.97)}.case-flow-overview figcaption{margin:12px 0 0!important}.case-flow-overview svg text{pointer-events:none}</style><h3>从地震振幅，到可核查的断层迹线</h3><p>沿箭头阅读资料怎样流转；上下两条路线使用相同观测，判断分支将待核查情况单独保留。<span data-flow-instruction></span></p><div class=\"case-flow-scroll\" tabindex=\"0\" aria-label=\"流程图可横向滚动\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1100 640\" role=\"group\" aria-label=\"从地震振幅，到可核查的断层迹线：观测、处理、模型与基线、判断、复核、输出和对照\"><defs><marker id=\"cf-s1\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"3\" orient=\"auto-start-reverse\"><path d=\"M0 0L7 3L0 6Z\" fill=\"#527c77\"/></marker></defs>\n <path d=\"M250 124H285\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"268\" y=\"90\" class=\"case-flow-edge\" text-anchor=\"middle\">原始观测</text><path d=\"M515 124H550\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"532\" y=\"90\" class=\"case-flow-edge\" text-anchor=\"middle\">特征</text><path d=\"M400 168V300H550\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"466\" y=\"285\" class=\"case-flow-edge\" text-anchor=\"middle\">同一输入</text><path d=\"M780 124H848V182\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"820\" y=\"102\" class=\"case-flow-edge\" text-anchor=\"middle\">候选</text><path d=\"M848 310V350\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"890\" y=\"333\" class=\"case-flow-edge\" text-anchor=\"middle\">待核查</text>\n <g class=\"case-flow-node\" data-flow-step=\"0\" data-flow-node=\"input\" transform=\"translate(20 80)\"><rect width=\"230\" height=\"88\" rx=\"25\" fill=\"#eaf1ee\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">独立地震剖面</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">振幅矩阵 · 缺失掩码</text></g><g class=\"case-flow-node\" data-flow-step=\"1\" data-flow-node=\"prepare\" transform=\"translate(285 80)\"><rect width=\"230\" height=\"88\" rx=\"12\" fill=\"#edf2f6\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">波形与方向特征</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">局部不连续性 → 9维特征</text></g><g class=\"case-flow-node\" data-flow-step=\"2\" data-flow-node=\"model\" transform=\"translate(550 80)\"><rect width=\"230\" height=\"88\" rx=\"12\" fill=\"#dcefe7\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">逻辑回归得分</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">训练损失 → 逐像素概率</text></g><g class=\"case-flow-node\" data-flow-step=\"3\" data-flow-node=\"baseline\" transform=\"translate(550 300)\"><rect width=\"230\" height=\"88\" rx=\"12\" fill=\"#f3eddf\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">振幅差异规则</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">验证剖面锁定检测阈值</text></g>\n <g class=\"case-flow-node\" data-flow-node=\"gate\" data-flow-step=\"4\"><polygon points=\"848,182 963,246 848,310 733,246\" fill=\"#fff2d7\"/><text x=\"848\" y=\"238\" text-anchor=\"middle\" class=\"case-flow-title\">有效观测与</text><text x=\"848\" y=\"265\" text-anchor=\"middle\" class=\"case-flow-title\">得分达标？</text></g>\n <g class=\"case-flow-node\" data-flow-step=\"4\" data-flow-node=\"review\" transform=\"translate(835 350)\"><rect width=\"230\" height=\"88\" rx=\"12\" fill=\"#f6e6db\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">检查波形不连续</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">噪声、缺失与层位变化</text></g><g class=\"case-flow-node\" data-flow-step=\"4\" data-flow-node=\"output\" transform=\"translate(835 470)\"><rect width=\"230\" height=\"88\" rx=\"25\" fill=\"#dcefe7\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">候选断层迹线</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">提取连通位置 · 点选证据</text></g><g><rect x=\"20\" y=\"470\" width=\"230\" height=\"88\" rx=\"12\" fill=\"#eef0f0\" stroke=\"#bcc7c5\"/><text x=\"135\" y=\"503\" text-anchor=\"middle\" class=\"case-flow-title\">留出评价资料</text><text x=\"135\" y=\"532\" text-anchor=\"middle\" class=\"case-flow-detail\">仅在对照环节读取</text></g><g class=\"case-flow-node\" data-flow-step=\"4\" data-flow-node=\"compare\" transform=\"translate(550 470)\"><rect width=\"230\" height=\"88\" rx=\"12\" fill=\"#edf2f6\"/><text x=\"115\" y=\"33\" text-anchor=\"middle\" class=\"case-flow-title\">独立参考剖面对照</text><text x=\"115\" y=\"62\" text-anchor=\"middle\" class=\"case-flow-detail\">迹线、误检位置与人工意见</text></g>\n <path d=\"M950 438V470\" fill=\"none\" stroke=\"#a6764b\" stroke-width=\"2.4\" stroke-dasharray=\"7 5\" marker-end=\"url(#cf-s1)\"/><text x=\"1006\" y=\"458\" class=\"case-flow-edge\" text-anchor=\"middle\">确认后</text><path d=\"M963 246H1080V514H1065\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"1035\" y=\"231\" class=\"case-flow-edge\" text-anchor=\"middle\">可继续</text><path d=\"M250 514H550\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"397\" y=\"500\" class=\"case-flow-edge\" text-anchor=\"middle\">独立参考</text><path d=\"M835 514H780\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"808\" y=\"500\" class=\"case-flow-edge\" text-anchor=\"middle\">输出</text><path d=\"M665 388V470\" fill=\"none\" stroke=\"#527c77\" stroke-width=\"2.4\"  marker-end=\"url(#cf-s1)\"/><text x=\"710\" y=\"435\" class=\"case-flow-edge\" text-anchor=\"middle\">同分母</text>\n </svg></div><figcaption>实线箭头连接计算与输出，虚线表示人工核查后的衔接。模型与基线的结果进入同条件对照；评价资料仅在评价环节使用。窄屏可左右滑动查看完整关系。</figcaption></figure>");S17Flow.mount(area||document);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startFlow,{once:true});else startFlow();})();


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
