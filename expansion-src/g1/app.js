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
    return { schemaVersion: '1.0', sceneId: 'g1', caseId, caseVersion: '1.0.1', runId, datasetId: 's17x-g1-synthetic-v1', wellId: null, areaId: result.observations.groupId, dataNature: 'synthetic_teaching',
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
