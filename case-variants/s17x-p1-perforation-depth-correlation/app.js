(function (g) {
  'use strict';
  const M = g.VariantManifest, E = g.VariantEngine, CASE = 's17x-p1-perforation-depth-correlation';
  if (!M || M.id !== CASE || !E) throw Error('本例清单或计算脚本未正确加载');
  const K = g.S17Concepts[CASE], V = K.graphics, $ = id => document.getElementById(id);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = (v, n) => v === null || v === undefined || !Number.isFinite(v) ? '—' : Number(v).toFixed(n === undefined ? 2 : n);
  const pct = v => f(v * 100, 1) + '%', statusText = s => ({ accepted: '接受候选', ambiguous: '存在歧义', insufficient: '资料不足' }[s]);
  let active = null, state = 'initializing', serial = 0, inputRevision = 0, timer = null, activeTab = 'background', activeStep = 0, reviewHistory = [];
  function plot(html, label) { return '<div class="plot-scroll" tabindex="0" aria-label="' + esc(label || '图形可在本区域横向滚动') + '">' + html + '</div>'; }
  const stepFigures = M.tabs.workflow.steps.map(s => s.visualHTML || '');
  $('app').innerHTML = '<header class="case-head"><p class="eyebrow">井见 · 射孔 / 目标层与深度坐标</p><h1>' + esc(M.title) + '</h1><p class="intro">孔道打得够深，还需要位置对得准。把参考地层、接箍和工具记录放到同一深度坐标，再判断能否给出唯一校正量。</p></header><nav class="main-tabs" aria-label="案例内容"><button type="button" data-tab="background" aria-pressed="true">专业背景</button><button type="button" data-tab="workflow" aria-pressed="false">案例流程</button><button type="button" data-tab="lab" aria-pressed="false">可运行示范</button></nav><section id="background" class="reading" aria-label="专业背景"></section><section id="workflow" class="reading" aria-label="案例流程" hidden></section><section id="lab" aria-label="可运行示范" hidden><div class="lab-lead"><p class="eyebrow">从GR形态与接箍位置判断校正候选</p><h2>同一组资料，比较校正候选与沿用原深度</h2><p>改变观测和匹配设置后自动重算。沿曲线、接箍对应和独立峰，判断当前资料能否确定唯一位置。</p></div><div id="controls" class="controls"><label>观测情形<select id="scenario">' + K.scenarioOptions + '</select></label><label>GR噪声尺度 / 相对读数 <output id="o-noise">2.0</output><input id="noise" type="range" min="0" max="10" step="0.5" value="2"></label><label>给定目标层厚度 / m <output id="o-targetThickness">2.0</output><input id="targetThickness" type="range" min="0.5" max="4" step="0.5" value="2"></label><label>搜索上限 / ±m<select id="searchLimit"><option value="2">2 m · 较窄</option><option value="6">6 m</option><option value="12" selected>12 m</option></select></label><label>CCL动态阈值系数 κ <output id="o-thresholdK">2.3</output><input id="thresholdK" type="range" min="1.6" max="3.8" step="0.1" value="2.3"></label><label>课堂样例编号<select id="seed"><option value="17">17 · 默认</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option></select></label></div><div class="actions"><button type="button" id="run" class="primary">重新计算</button><button type="button" id="reset">恢复默认条件</button><button type="button" id="export" disabled>下载本次 JSON</button><span id="status" role="status" aria-live="polite">正在准备默认计算…</span></div><div id="results" hidden><p id="decision" class="decision"></p><div id="metrics" class="metrics"></div><article class="plot-card"><h2>01 / 先看GR与接箍是否能对齐</h2><p id="alignment-note" class="plot-note"></p><div id="alignment"></div></article><article class="plot-card"><h2>02 / 让整组接箍提供核对依据</h2><p class="plot-note">在当前δ下，将检出点与接箍表一对一核对；关注未匹配点和可能漏检的接箍。</p><div id="collars"></div><details><summary>展开CCL波形与动态阈值</summary><div id="ccl-signal"></div><p class="plot-note">阈值太高会漏掉波瓣，太低可能引入干扰；成对波瓣与间距核对仍然必要。</p></details></article><article class="plot-card"><h2>03 / 在整条搜索曲线上检查多解</h2><div id="scores"></div><div id="peaks" class="table-wrap"></div></article><article class="plot-card"><h2>04 / 比较目标层与实际落点</h2><p id="evaluation-note" class="plot-note"></p><div id="placement"></div><div id="current-comparison" class="table-wrap"></div><p class="plot-note">目标覆盖率＝交集长度÷目标厚度；交并比 IoU＝交集长度÷并集长度。</p></article><article class="plot-card"><h2>05 / 在完整独立记录上检查表现</h2><p id="benchmark-note"></p><div id="benchmark-summary" class="table-wrap"></div><details><summary>查看12个独立记录与未接受的原因类别</summary><div id="benchmark-rows" class="table-wrap"></div></details><p class="plot-note">比较误差的两行使用相同的接受样例；另列全体零偏移基线。</p></article><aside class="review"><h2>记录这次判断</h2><p>把匹配结果与资料质量一起复核。改变条件后，本次意见回到“尚未复核”，历史意见保留原运行编号。</p><label>本次意见<select id="review-choice"><option value="pending">尚未复核</option><option value="retain">保留为待核对候选</option><option value="recheck">补充参考资料后再判断</option><option value="reject">不采用当前候选</option></select></label><label>复核说明<textarea id="review-note" rows="2" maxlength="500" placeholder="例如：重复峰尚未排除，需要更长参考段。"></textarea></label><button type="button" id="review-save">记录意见</button><p id="review-status" role="status">暂无人工记录。</p></aside></div></section><footer>井见 · 射孔深度校正 · v' + esc(M.version) + '<br>沿井位置 · GR形态与接箍对应</footer>';
  function setTab(tab) {
    if (!['background', 'workflow', 'lab'].includes(tab)) return;
    activeTab = tab; document.querySelectorAll('.main-tabs [data-tab]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); });
    for (const key of ['background', 'workflow', 'lab']) $(key).hidden = key !== tab;
  }
  function renderStep(index) {
    activeStep = Math.max(0, Math.min(M.tabs.workflow.steps.length - 1, Number(index) || 0));
    document.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === activeStep)));
    const s = M.tabs.workflow.steps[activeStep];
    $('step-body').innerHTML = '<p class="eyebrow">STEP ' + (activeStep + 1) + ' / ' + M.tabs.workflow.steps.length + '</p><h2>' + esc(s.name) + '</h2><p>' + esc(s.do) + '</p>' + stepFigures[activeStep] + '<dl><dt>产物</dt><dd>' + esc(s.effect) + '</dd><dt>留意</dt><dd>' + esc(s.trap) + '</dd></dl><div class="step-navigation"><button type="button" id="step-prev" ' + (activeStep === 0 ? 'disabled' : '') + '>上一步</button><button type="button" id="step-next">' + (activeStep === M.tabs.workflow.steps.length - 1 ? '进入可运行示范' : '下一步') + '</button></div>';
    $('step-prev').addEventListener('click', () => renderStep(activeStep - 1));
    $('step-next').addEventListener('click', () => activeStep === M.tabs.workflow.steps.length - 1 ? setTab('lab') : renderStep(activeStep + 1));
    K.mount($('step-body'));
  }
  function renderReading() {
    const b = M.tabs.background, w = M.tabs.workflow;
    $('background').innerHTML = '<p class="lede">' + esc(b.lede) + '</p>' + b.sections.map(s => '<article class="chapter"><p class="eyebrow">' + esc(s.en || '') + '</p><h2>' + esc(s.title) + '</h2>' + s.html + '</article>').join('') + '<button type="button" id="to-workflow">接着看这些观测怎样进入方法 →</button>';
    $('workflow').innerHTML = '<p class="eyebrow">同一组资料的五步处理</p><h2>' + esc(w.title) + '</h2><p>' + esc(w.lead.join(' ')) + '</p><div class="step-tabs" role="group" aria-label="案例流程步骤">' + w.steps.map((s, i) => '<button type="button" data-step="' + i + '" aria-pressed="' + (i === 0) + '">' + (i + 1) + ' · ' + esc(s.name) + '</button>').join('') + '</div><article id="step-body" class="step-body"></article>';
    $('to-workflow').addEventListener('click', () => setTab('workflow'));
    document.querySelectorAll('[data-step]').forEach(bn => bn.addEventListener('click', () => renderStep(Number(bn.dataset.step))));
    K.mount($('background')); renderStep(0);
  }
  function parameters() { return E.normalizeConfig(Object.fromEntries(['scenario', 'noise', 'targetThickness', 'searchLimit', 'thresholdK', 'seed'].map(key => [key, $(key).value]))); }
  function outputs() { for (const key of ['noise', 'targetThickness', 'thresholdK']) $('o-' + key).textContent = f(Number($(key).value), 1); }
  function setStatus(next, message) { state = next; $('status').dataset.state = next; $('status').textContent = message; }
  function table(headers, rows) { return '<table><thead><tr>' + headers.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(v => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table>'; }
  function renderResult() {
    const r = active.result, p = r.prediction, ev = r.evaluation, bm = r.benchmark, delta = p.bestCandidate ? p.bestCandidate.delta : 0;
    $('decision').dataset.result = p.status;
    $('decision').textContent = statusText(p.status) + '。' + (p.accepted ? '校正量 δ=' + f(p.delta, 1) + ' m；给定目标层对应工具记录区间 ' + p.commandInterval.map(v => f(v, 2)).join('–') + ' m。' : p.bestCandidate ? '最优待核对位置仅用于查看依据，未转换为校正建议。' : '没有可用的GR形态峰，保留原始资料供复核。') + p.reasons.join(' ');
    const cards = [['当前深度绝对误差', ev.model ? f(ev.model.absoluteError, 3) + ' m' : '未接受', '校正量与实际偏移之差'], ['零偏移基线误差', f(ev.baseline.absoluteError, 3) + ' m', '与当前相同观测和目标'], ['当前目标层交并比', ev.model ? pct(ev.model.IoU) : '—', '实际落点与目标层 IoU'], ['独立记录接受率', bm.acceptedCount + ' / ' + bm.count, '歧义 ' + bm.ambiguousCount + '；资料不足 ' + bm.insufficientCount]];
    $('metrics').innerHTML = cards.map(c => '<div class="metric"><span>' + esc(c[0]) + '</span><b>' + esc(c[1]) + '</b><small>' + esc(c[2]) + '</small></div>').join('');
    $('alignment-note').textContent = (p.bestCandidate ? '当前展示 δ=' + f(delta, 1) + ' m 的对齐图。' + (p.accepted ? '该位置已通过本例公开门槛。' : '该候选仍需结合峰间差与接箍残差复核。') : '当前没有可用的GR形态峰；下图按δ=0保留原始坐标，供核对资料。') + '赭金带是已给定的目标层。';
    $('alignment').innerHTML = plot(V.alignmentGraphic(r.observation, delta));
    $('collars').innerHTML = plot(V.matchGraphic(r.observation, p.detection, delta));
    $('ccl-signal').innerHTML = plot(V.cclSignalGraphic(r.observation, p.detection));
    $('scores').innerHTML = plot(V.scoreGraphic(p));
    $('peaks').innerHTML = p.independentPeaks.length ? table(['独立峰偏移 / m', 'GR相关系数', '接箍核对', '对应数', '残差中位数 / m'], p.independentPeaks.slice(0, 5).map(q => [f(q.delta, 1), f(q.ncc, 3), q.cclPass ? '通过' : '未通过', q.matchedCount, f(q.medianResidual, 2)])) : '<p>没有可用的GR独立峰；保留资料不足状态。</p>';
    $('evaluation-note').textContent = '本次实际偏移为 ' + f(ev.baseline.actualDelta, 3) + ' m。' + (ev.model ? '接受候选的实际区间为 ' + ev.model.actualInterval.map(v => f(v, 3)).join('–') + ' m；其目标覆盖率 ' + pct(ev.model.targetCoverage) + '。' : '当前未接受校正候选；下表保留零偏移基线的误差与覆盖率。');
    $('placement').innerHTML = plot(V.evaluationGraphic(ev));
    $('current-comparison').innerHTML = table(['本次方法', '深度绝对误差 / m', '目标覆盖率', '交并比 IoU'], [['GR–CCL校正候选', ev.model ? f(ev.model.absoluteError, 3) : '未接受', ev.model ? pct(ev.model.targetCoverage) : '—', ev.model ? pct(ev.model.IoU) : '—'], ['零偏移基线', f(ev.baseline.absoluteError, 3), pct(ev.baseline.targetCoverage), pct(ev.baseline.IoU)]]);
    $('benchmark-note').textContent = '12个完整独立记录与当前课堂样例分开，使用相同噪声、目标厚度和匹配设置。接受 ' + bm.acceptedCount + ' 个，歧义 ' + bm.ambiguousCount + ' 个，资料不足 ' + bm.insufficientCount + ' 个。';
    $('benchmark-summary').innerHTML = table(['检查口径', '记录数', '平均绝对误差 / m', '平均目标交并比'], [['校正方法 · 接受组', bm.modelAccepted.count, f(bm.modelAccepted.MAE, 3), bm.modelAccepted.meanIoU === null ? '—' : pct(bm.modelAccepted.meanIoU)], ['零偏移 · 同一接受组', bm.baselineSameAccepted.count, f(bm.baselineSameAccepted.MAE, 3), bm.baselineSameAccepted.meanIoU === null ? '—' : pct(bm.baselineSameAccepted.meanIoU)], ['零偏移 · 全部记录', bm.baselineAll.count, f(bm.baselineAll.MAE, 3), pct(bm.baselineAll.meanIoU)]]);
    const names = { standard: '形态清晰', missing: '漏检情形', interference: '相似干扰', periodic: '重复形态', flat: '平坦GR' };
    $('benchmark-rows').innerHTML = table(['记录编号', '观测情形', '结果', '校正量 / m', '校正误差 / m', '基线误差 / m'], bm.rows.map(row => [row.id, names[row.scenario], statusText(row.prediction.status), f(row.prediction.delta, 1), row.evaluation.model ? f(row.evaluation.model.absoluteError, 3) : '—', f(row.evaluation.baseline.absoluteError, 3)]));
  }
  function run() {
    if (timer) { clearTimeout(timer); timer = null; }
    setStatus('running', '正在逐个匹配候选与独立记录…'); $('export').disabled = true; $('review-save').disabled = true;
    try {
      const config = parameters(), result = E.run(config);
      active = { result, runId: 'p1-depth-' + (++serial), inputRevision, review: { choice: 'pending', note: '', history: reviewHistory.slice() } };
      renderResult(); $('results').hidden = false; $('export').disabled = false; $('review-save').disabled = false; $('review-choice').value = 'pending'; $('review-note').value = '';
      $('review-status').textContent = '当前尚未复核；保留 ' + reviewHistory.length + ' 条历史意见。';
      setStatus('ready', '计算完成 · ' + active.runId + ' · 当前 ' + result.prediction.searchCount + ' 个偏移候选');
    } catch (error) { setStatus('error', '计算未完成：' + error.message); }
  }
  function schedule() {
    inputRevision++; outputs(); $('export').disabled = true; $('review-save').disabled = true;
    if (active) active.review.choice = 'pending';
    $('review-status').textContent = '条件已改变，正在重新计算；旧意见保留原运行编号。';
    setStatus('pending', '条件已改变，正在自动重算…'); if (timer) clearTimeout(timer); timer = setTimeout(run, 140);
  }
  function reset() { for (const key of Object.keys(E.DEFAULTS)) if ($(key)) $(key).value = String(E.DEFAULTS[key]); inputRevision++; outputs(); run(); }
  function snapshot() {
    if (!active) return { caseId: CASE, sceneId: 'p1', version: M.version, state, ready: false };
    const r = active.result;
    return { caseId: CASE, sceneId: 'p1', version: M.version, state, status: state, ready: state === 'ready', runId: active.runId, inputRevision: active.inputRevision, activeTab, activeStep, params: r.config, observation: r.observation, prediction: r.prediction, evaluation: r.evaluation, metrics: { currentAbsoluteError: r.evaluation.model ? r.evaluation.model.absoluteError : null, baselineAbsoluteError: r.evaluation.baseline.absoluteError, currentIoU: r.evaluation.model ? r.evaluation.model.IoU : null, acceptedCount: r.benchmark.acceptedCount, totalCount: r.benchmark.count, ambiguousCount: r.benchmark.ambiguousCount, insufficientCount: r.benchmark.insufficientCount, acceptedMAE: r.benchmark.modelAccepted.MAE, baselineSameAcceptedMAE: r.benchmark.baselineSameAccepted.MAE }, benchmark: r.benchmark, review: active.review };
  }
  function evidence() {
    if (!active || state !== 'ready') return null;
    const r = active.result, runId = active.runId, reviewStatus = { pending: 'unreviewed', retain: 'confirmed', recheck: 'needs_review', reject: 'rejected' }[active.review.choice];
    const sources = [{ sourceRecordId: runId + '-observation', sourceVersion: 1, sourceType: 'series_segment', content: r.observation }, { sourceRecordId: runId + '-prediction', sourceVersion: 1, sourceType: 'text_record', content: r.prediction }, { sourceRecordId: runId + '-evaluation', sourceVersion: 1, sourceType: 'text_record', content: { evaluationTruth: r.evaluationTruth, evaluation: r.evaluation, benchmark: r.benchmark } }];
    const ref = suffix => ({ sourceRecordId: runId + '-' + suffix, sourceVersion: 1, selector: { type: 'whole_record_for_single_fact' } });
    const claims = [{ claimId: runId + '-correction', revision: 1, kind: 'model_inference', statement: r.prediction.accepted ? '当前资料下接受深度校正候选 ' + f(r.prediction.delta, 1) + ' m。' : '当前资料下未接受唯一深度校正候选，状态为' + statusText(r.prediction.status) + '。', sourceRefs: [ref('observation'), ref('prediction')], reviewStatus, traceabilityStatus: 'linked', supportStatus: 'rule_checked', method: r.prediction.method, reviewHistory: active.review.history }, { claimId: runId + '-accepted-count', revision: 1, kind: 'observation', statement: '独立检查12个完整记录，接受' + r.benchmark.acceptedCount + '个，歧义' + r.benchmark.ambiguousCount + '个，资料不足' + r.benchmark.insufficientCount + '个。', value: r.benchmark.acceptedCount, denominator: r.benchmark.count, unit: 'record', sourceRefs: [ref('evaluation')], reviewStatus: 'unreviewed', traceabilityStatus: 'linked', supportStatus: 'rule_checked' }];
    return { schemaVersion: '1.0', caseId: CASE, sceneId: 'p1', caseVersion: M.version, version: M.version, runId, status: state, resultState: 'ready', datasetId: E.DATA_VERSION, datasetVersion: E.DATA_VERSION, dataNature: 'synthetic_teaching', wellId: r.observation.id, params: r.config, runConfig: { seed: r.config.seed, dataVersion: E.DATA_VERSION, method: r.prediction.method, parameters: r.config, inputRevision: active.inputRevision, splitDescription: r.benchmark.split, evaluationOrder: 'all_predictions_then_truth_evaluation' }, sources, claims, prediction: r.prediction, evaluation: r.evaluation, benchmark: r.benchmark, metrics: snapshot().metrics, review: active.review, provenance: { professionalSources: M.provenance.sources, syntheticData: true, limitations: ['local_constant_depth_shift', 'no_field_accuracy_claim', 'ambiguous_and_insufficient_results_retained'] } };
  }
  function setParameters(values) { for (const [key, value] of Object.entries(values || {})) if (Object.prototype.hasOwnProperty.call(E.DEFAULTS, key) && $(key)) $(key).value = String(value); inputRevision++; outputs(); run(); return snapshot(); }
  g.CaseInspect = { snapshot, evidence, run, reset, setParameters, setTab, setStep: renderStep };
  document.querySelectorAll('.main-tabs [data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('controls').addEventListener('input', event => { if (event.target.matches('input')) schedule(); });
  $('controls').addEventListener('change', event => { if (event.target.matches('select')) schedule(); });
  $('run').addEventListener('click', run); $('reset').addEventListener('click', reset);
  $('review-save').addEventListener('click', () => {
    if (!active || state !== 'ready') return;
    const record = { runId: active.runId, inputRevision: active.inputRevision, choice: $('review-choice').value, note: $('review-note').value.trim(), recordedAt: new Date().toISOString() };
    reviewHistory.push(record); active.review = { choice: record.choice, note: record.note, history: reviewHistory.slice() };
    $('review-status').textContent = '已记录 ' + active.runId + ' 的意见；共 ' + reviewHistory.length + ' 条历史记录。';
  });
  $('export').addEventListener('click', () => {
    const value = evidence(); if (!value) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' })), link = document.createElement('a');
    link.href = url; link.download = CASE + '-' + active.runId + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  renderReading(); outputs(); run();
})(globalThis);
