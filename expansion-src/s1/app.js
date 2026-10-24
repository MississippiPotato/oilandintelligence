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
    return { schemaVersion: '1.0', sceneId: 's1', caseId, caseVersion: '1.0.2', runId, datasetId: 's17x-s1-synthetic-v1', wellId: null, areaId: obs.groupId, dataNature: 'synthetic_teaching',
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
