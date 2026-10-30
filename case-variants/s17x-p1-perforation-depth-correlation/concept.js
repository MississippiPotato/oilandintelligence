(function (g) {
  'use strict';
  const CASE = 's17x-p1-perforation-depth-correlation', E = g.VariantEngine;
  if (!E) throw Error('深度校正知识图需要先加载本例计算脚本');
  const red = '#B8242A', blue = '#55768B', gold = '#B08A4A', ink = '#382F2D';
  const f = (v, n) => v === null || v === undefined || !Number.isFinite(v) ? '—' : Number(v).toFixed(n === undefined ? 2 : n);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = v => f(v * 100, 1) + '%';
  function svg(height, title, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ' + height + '" role="img" aria-label="' + esc(title) + '" style="width:100%;min-width:900px;height:auto;max-height:none;display:block;box-sizing:content-box;border:0;padding:0"><rect width="900" height="' + height + '" fill="#FFFDFA"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="18" fill="' + ink + '">' + body + '</g></svg>'; }
  function path(points, color, width, dash) { return '<path d="' + points.map((p, i) => (i ? 'L' : 'M') + f(p[0], 2) + ',' + f(p[1], 2)).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="' + (width || 2.5) + '"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>'; }
  function text(x, y, value, attrs) { return '<text x="' + f(x, 2) + '" y="' + f(y, 2) + '" ' + (attrs || '') + '>' + esc(value) + '</text>'; }
  function alignmentGraphic(o, delta) {
    const y = z => 88 + (z - 1005) / 70 * 420, target = o.target.interval;
    let b = text(24, 30, '两条曲线用同一参考深度轴比较；校正量 δ = ' + f(delta, 1) + ' m', 'font-size="20" font-weight="650"');
    b += text(205, 64, '参考 GR', 'text-anchor="middle" fill="' + blue + '"') + text(486, 64, '当前 GR（已平移）', 'text-anchor="middle" fill="' + red + '"') + text(752, 64, 'CCL / 接箍表', 'text-anchor="middle"');
    b += '<rect x="82" y="' + f(y(target[0]), 2) + '" width="790" height="' + f(y(target[1]) - y(target[0]), 2) + '" fill="' + gold + '" opacity="0.22"/>';
    for (let z = 1008; z <= 1072; z += 8) b += '<path d="M82 ' + y(z) + 'H872" stroke="#E4DCD4"/>' + text(70, y(z) + 6, z, 'text-anchor="end" font-size="16"');
    b += text(24, 69, '深度/m', 'font-size="16"');
    for (const x of [95, 370]) {
      b += '<path d="M' + x + ' 508H' + (x + 220) + '" stroke="#91847C"/>';
      for (const value of [0, 70, 140]) b += text(x + value / 140 * 220, 533, value, 'text-anchor="middle" font-size="16"');
    }
    b += text(205, 558, 'GR / 相对读数', 'text-anchor="middle" font-size="16"') + text(480, 558, 'GR / 相对读数', 'text-anchor="middle" font-size="16"');
    b += path(o.reference.depth.map((z, i) => [95 + o.reference.gr[i] / 140 * 220, y(z)]).filter(p => p[1] >= 88 && p[1] <= 508), blue);
    b += path(o.measured.recordedDepth.map((d, i) => [370 + o.measured.gr[i] / 140 * 220, y(d + delta)]).filter(p => p[1] >= 88 && p[1] <= 508), red);
    b += '<path d="M728 88V508M822 88V508" stroke="#D5CAC0" stroke-dasharray="4 4"/>';
    b += path(o.measured.recordedDepth.map((d, i) => [728 + o.measured.ccl[i] * 24, y(d + delta)]).filter(p => p[1] >= 88 && p[1] <= 508), red, 1.8);
    o.reference.collarDepths.filter(z => z >= 1005 && z <= 1075).forEach(z => { b += '<path d="M808 ' + y(z) + 'H836" stroke="' + blue + '" stroke-width="4"/>'; });
    b += text(752, 533, '朱红：当前观测波形', 'text-anchor="middle" font-size="16" fill="' + red + '"') + text(752, 558, '蓝灰：已知接箍', 'text-anchor="middle" font-size="16" fill="' + blue + '"');
    b += text(24, 587, '赭金带为给定目标层 ' + f(target[0], 2) + '–' + f(target[1], 2) + ' m；纵轴是沿井位置，非孔道穿深。', 'font-size="16"');
    return svg(610, '参考GR、当前GR与接箍共同深度图', b);
  }
  function matchGraphic(o, detection, delta) {
    const m = E.matchCollars(o, detection, delta), x = z => 95 + (z - 1000) / 80 * 765;
    let b = text(24, 30, '接箍对应：参考深度 = 记录深度 + ' + f(delta, 1) + ' m', 'font-size="20" font-weight="650"');
    b += text(24, 65, '连线表示当前偏移δ下的一对一对应候选；未对应点保留为红色叉。', 'font-size="16"');
    b += '<rect x="' + x(o.target.interval[0]) + '" y="100" width="' + (x(o.target.interval[1]) - x(o.target.interval[0])) + '" height="164" fill="' + gold + '" opacity="0.18"/>';
    b += text(24, 99, '已知接箍表', 'fill="' + blue + '"') + text(24, 211, '检出点 + δ', 'fill="' + red + '"');
    b += '<path d="M95 125H860M95 240H860" stroke="#9A8E86"/>';
    o.reference.collarDepths.filter(z => z >= 1000 && z <= 1080).forEach(z => { b += '<path d="M' + x(z) + ' 114V136" stroke="' + blue + '" stroke-width="4"/>'; });
    m.matches.forEach(p => { if (p.referenceDepth >= 1000 && p.referenceDepth <= 1080 && p.recordedDepth + delta >= 1000 && p.recordedDepth + delta <= 1080) b += '<path d="M' + x(p.referenceDepth) + ' 140L' + x(p.recordedDepth + delta) + ' 226" stroke="' + blue + '" opacity="0.6" stroke-width="2"/>'; });
    detection.candidates.forEach(p => { const z = p.recordedDepth + delta; if (z >= 1000 && z <= 1080) b += '<circle cx="' + x(z) + '" cy="240" r="5" fill="' + red + '"/>'; });
    m.unmatched.forEach(p => { if (p.correctedDepth >= 1000 && p.correctedDepth <= 1080) { const a = x(p.correctedDepth); b += '<path d="M' + (a - 7) + ' 230L' + (a + 7) + ' 250M' + (a - 7) + ' 250L' + (a + 7) + ' 230" stroke="' + red + '" stroke-width="3"/>'; } });
    for (let z = 1000; z <= 1080; z += 10) b += text(x(z), 280, z, 'text-anchor="middle" font-size="16"');
    b += text(860, 307, '参考深度 / m', 'text-anchor="end" font-size="16"');
    b += text(24, 337, '对应 ' + m.matchedCount + ' / ' + m.detectedCount + ' 个检出点；深度残差中位数 ' + f(m.medianResidual, 2) + ' m；可能漏检 ' + m.possibleMissingCount + ' 个。', 'font-size="18"');
    b += text(24, 366, '相邻间距残差中位数 ' + f(m.medianSpacingResidual, 2) + ' m；“可能漏检”来自丈量表与当前检出数的核对。', 'font-size="16"');
    return svg(390, '接箍一对一对应与残差', b);
  }
  function scoreGraphic(p) {
    const x = d => 90 + (d + p.searchLimit) / (2 * p.searchLimit) * 760, y = v => 268 - (v + 1) / 2 * 185;
    let b = text(24, 30, '逐个尝试偏移：' + p.searchCount + ' 个候选，步长 0.1 m', 'font-size="20" font-weight="650"');
    b += text(24, 59, '朱红线：GR归一化互相关（NCC）；圆点：独立峰，蓝灰为接箍核对通过。', 'font-size="16"');
    for (const value of [-1, -0.5, 0, 0.5, 1]) b += '<path d="M90 ' + y(value) + 'H850" stroke="#E4DCD4"/>' + text(78, y(value) + 6, f(value, 1), 'text-anchor="end" font-size="16"');
    b += path(p.curve.filter(a => a.ncc !== null).map(a => [x(a.delta), y(a.ncc)]), red, 3);
    p.independentPeaks.forEach(a => { if (a.ncc !== null) b += '<circle cx="' + x(a.delta) + '" cy="' + y(a.ncc) + '" r="6" fill="' + (a.cclPass ? blue : gold) + '" stroke="#FFFDFA" stroke-width="2"/>'; });
    if (p.bestCandidate) b += '<path d="M' + x(p.bestCandidate.delta) + ' 80V280" stroke="' + blue + '" stroke-dasharray="5 5"/>';
    for (const d of [-p.searchLimit, -p.searchLimit / 2, 0, p.searchLimit / 2, p.searchLimit]) b += text(x(d), 305, f(d, 1), 'text-anchor="middle" font-size="16"');
    b += text(850, 337, '候选校正量 δ / m', 'text-anchor="end" font-size="16"') + text(24, 337, 'NCC 范围 −1 到 1；空曲线表示 GR 无可用变化。', 'font-size="16"');
    return svg(360, 'GR互相关随深度偏移变化', b);
  }
  function cclSignalGraphic(o, detection) {
    const lo = 1016, hi = 1052, x = d => 90 + (d - lo) / (hi - lo) * 760, y = value => 174 - value / 3.4 * 86;
    let b = text(24, 30, '图 S2｜动态阈值在局部窗口中寻找成对波瓣', 'font-size="20" font-weight="650"');
    b += text(24, 59, '朱红：CCL波形；赭金：上下阈值；蓝灰竖线：检出的接箍中心。', 'font-size="16"');
    for (const a of [-3, 0, 3]) b += '<path d="M90 ' + y(a) + 'H850" stroke="#E4DCD4"/>' + text(78, y(a) + 6, f(a, 0), 'text-anchor="end" font-size="16"');
    b += path(o.measured.recordedDepth.map((d, i) => [x(d), y(o.measured.ccl[i])]).filter(p => p[0] >= 90 && p[0] <= 850), red, 2.5);
    for (const side of ['upper', 'lower']) b += path(detection.thresholds.filter(p => p.depth >= lo && p.depth <= hi).map(p => [x(p.depth), y(p[side])]), gold, 1.8, true);
    detection.candidates.filter(p => p.recordedDepth >= lo && p.recordedDepth <= hi).forEach(p => { b += '<path d="M' + x(p.recordedDepth) + ' 82V266" stroke="' + blue + '" stroke-width="1.8" opacity="0.75"/>'; });
    for (let d = 1016; d <= 1052; d += 6) b += text(x(d), 298, d, 'text-anchor="middle" font-size="16"');
    b += text(850, 329, '工具记录深度 / m', 'text-anchor="end" font-size="16"') + text(24, 329, 'κ=' + f(detection.thresholdK, 1) + '；全段检出 ' + detection.candidates.length + ' 个候选。幅值为相对读数。', 'font-size="16"');
    return svg(352, 'CCL信号、动态阈值和检出位置', b);
  }
  function evaluationGraphic(evaluation) {
    const t = evaluation.targetInterval, intervals = [t, evaluation.baseline.actualInterval].concat(evaluation.model ? [evaluation.model.actualInterval] : []), lo = Math.floor(Math.min.apply(null, intervals.flat()) - 2), hi = Math.ceil(Math.max.apply(null, intervals.flat()) + 2), x = z => 250 + (z - lo) / (hi - lo) * 610;
    let b = text(24, 31, '实际落点与目标层：比较区间的交集与并集', 'font-size="20" font-weight="650"');
    const rows = [{ label: '给定目标层', interval: t, color: gold, y: 92 }, { label: '沿用原记录深度', interval: evaluation.baseline.actualInterval, color: blue, y: 158 }];
    if (evaluation.model) rows.push({ label: '接受的校正候选', interval: evaluation.model.actualInterval, color: red, y: 224 });
    rows.forEach(r => { b += text(24, r.y + 7, r.label) + '<path d="M250 ' + r.y + 'H860" stroke="#E4DCD4"/><rect x="' + x(r.interval[0]) + '" y="' + (r.y - 13) + '" width="' + (x(r.interval[1]) - x(r.interval[0])) + '" height="26" rx="3" fill="' + r.color + '" opacity="0.82"/>'; });
    if (!evaluation.model) b += text(24, 231, '当前未接受候选，不计算模型落点指标。', 'fill="' + red + '"');
    for (let i = 0; i <= 4; i++) { const z = lo + (hi - lo) * i / 4; b += text(x(z), 274, f(z, 1), 'text-anchor="middle" font-size="16"'); }
    b += text(860, 302, '实际参考深度 / m', 'text-anchor="end" font-size="16"');
    return svg(325, '目标层与实际落点区间对照', b);
  }
  const fresh = scenario => E.makeObservation(Object.assign({}, E.DEFAULTS, { scenario: scenario || 'standard' })).observation;
  const defaultObservation = fresh(), defaultPrediction = E.infer(defaultObservation, E.DEFAULTS), initialCorrelation = E.correlationAt(defaultObservation, 0);
  const chart = html => '<div class="ct-chart" tabindex="0" aria-label="图形可在本区域横向滚动" style="overflow-x:auto;max-width:100%;min-width:0">' + html + '</div>';
  const widgetStart = part => '<figure class="ct-widget" data-concept-scene="' + CASE + '" data-concept-part="' + part + '" style="margin:22px 0;padding:18px;border:1px solid #DDCEC2;border-radius:12px;background:#FFFDFA;font-size:18px;line-height:1.75;min-width:0;max-width:100%;box-sizing:border-box">';
  const scenarioOptions = '<option value="standard">形态清晰</option><option value="missing">漏掉一个接箍信号</option><option value="interference">混入相似干扰</option><option value="periodic">GR与接箍间距重复</option><option value="flat">GR近乎平坦</option>';
  const backgroundHTML = widgetStart('background') + '<h3>把两把深度尺放到同一坐标</h3><p>左侧GR是参考地层形态，中间GR来自当前工具记录。正校正量表示“参考深度＝工具记录深度＋δ”。目标层已经给定，拖动滑块是在校正沿井位置。归一化互相关（NCC）衡量两条GR的形态吻合程度，越接近1通常越相似。</p><div class="ct-controls"><label>手动校正量 δ / m <output data-out="delta">0.0</output><input disabled data-field="delta" type="range" min="-12" max="12" step="0.1" value="0"></label><label>目标层厚度 / m<select disabled data-field="thickness"><option value="0.5">0.5 m · 薄层</option><option value="2" selected>2.0 m</option><option value="4">4.0 m</option></select></label><button disabled type="button" data-action="reset">复位本图</button></div><div data-ct-graphic>' + chart(alignmentGraphic(defaultObservation, 0)) + '</div><figcaption data-ct-result style="font-size:16px">当前归一化互相关（NCC）=' + f(initialCorrelation.ncc, 3) + '；目标1040.00–1042.00 m，工具记录区间仍为1040.00–1042.00 m。两条曲线尚未对齐。</figcaption></figure>';
  const workflowHTML = widgetStart('workflow') + '<h3>图 S3｜用整组接箍核对候选位置</h3><p>动态阈值先找出成对波瓣，再把候选接箍与丈量表对应。改变阈值或信号情形，观察检出数、连线和独立峰怎样变化；重复资料可能仍有多个答案。</p><div class="ct-controls"><label>观测情形<select disabled data-field="scenario">' + scenarioOptions + '</select></label><label>动态阈值系数 κ <output data-out="threshold">2.3</output><input disabled data-field="threshold" type="range" min="1.6" max="3.8" step="0.1" value="2.3"></label><label>搜索范围 / ±m<select disabled data-field="limit"><option value="2">2 m</option><option value="6">6 m</option><option value="12" selected>12 m</option></select></label><button disabled type="button" data-action="sync">读取主示范当前观测</button><button disabled type="button" data-action="reset">复位本图</button></div><p data-ct-sync style="font-size:16px">本图默认使用种子17的课堂样例。</p><div data-ct-graphic>' + chart(matchGraphic(defaultObservation, defaultPrediction.detection, defaultPrediction.bestCandidate.delta)) + chart(scoreGraphic(defaultPrediction)) + '</div><figcaption data-ct-result style="font-size:16px">已接受3.4 m候选；10/10个检出点对应，深度残差中位数0.05 m。候选仍需人工复核。</figcaption></figure>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + CASE + '"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button').forEach(el => { el.disabled = false; });
      const part = host.dataset.conceptPart, field = name => host.querySelector('[data-field="' + name + '"]');
      let copiedObservation = null;
      function draw() {
        if (part === 'background') {
          const delta = Number(field('delta').value), thickness = Number(field('thickness').value), o = fresh();
          o.target = { center: 1041, thickness, interval: [1041 - thickness / 2, 1041 + thickness / 2] };
          const n = E.correlationAt(o, delta), m = E.matchCollars(o, E.detectCollars(o, 2.3), delta), command = o.target.interval.map(z => z - delta);
          host.querySelector('[data-out="delta"]').textContent = f(delta, 1);
          host.querySelector('[data-ct-graphic]').innerHTML = chart(alignmentGraphic(o, delta));
          host.querySelector('[data-ct-result]').textContent = '归一化互相关（NCC）=' + f(n.ncc, 3) + '；接箍对应 ' + m.matchedCount + '/' + m.detectedCount + '。给定目标层 ' + f(o.target.interval[0], 2) + '–' + f(o.target.interval[1], 2) + ' m，对应工具记录区间 ' + f(command[0], 2) + '–' + f(command[1], 2) + ' m。改变厚度只改设计区间，曲线匹配依据不变。';
          host.dataset.ctState = JSON.stringify({ part, delta, targetThickness: thickness, ncc: n.ncc, matchedCount: m.matchedCount, commandInterval: command });
        } else {
          const scenario = field('scenario').value, thresholdK = Number(field('threshold').value), searchLimit = Number(field('limit').value), o = copiedObservation || fresh(scenario), p = E.infer(o, { thresholdK, searchLimit }), displayDelta = p.bestCandidate ? p.bestCandidate.delta : 0;
          host.querySelector('[data-out="threshold"]').textContent = f(thresholdK, 1);
          host.querySelector('[data-ct-graphic]').innerHTML = chart(matchGraphic(o, p.detection, displayDelta)) + chart(scoreGraphic(p));
          const status = { accepted: '接受候选', ambiguous: '存在歧义', insufficient: '资料不足' }[p.status];
          host.querySelector('[data-ct-result]').textContent = status + '：' + (p.accepted ? f(p.delta, 1) + ' m。' : p.bestCandidate ? '仅展示最优待核对位置，未给出校正建议。' : '没有可用的GR形态峰，图中保留δ=0的原始坐标。') + '检出 ' + p.detection.candidates.length + ' 个接箍候选，' + (p.collarMatch ? '对应 ' + p.collarMatch.matchedCount + ' 个；残差中位数 ' + f(p.collarMatch.medianResidual, 2) + ' m。' : '暂无形态相关结果。') + p.reasons.join(' ');
          host.dataset.ctState = JSON.stringify({ part, scenario: o.description.scenario, observationId: o.id, synchronized: !!copiedObservation, thresholdK, searchLimit, detectedCount: p.detection.candidates.length, matchedCount: p.collarMatch ? p.collarMatch.matchedCount : 0, status: p.status, delta: p.delta, displayedDelta: displayDelta, ncc: p.bestCandidate ? p.bestCandidate.ncc : null, peakCount: p.independentPeaks.length });
        }
      }
      host.addEventListener('input', event => { if (event.target.matches('input')) draw(); });
      host.addEventListener('change', event => { if (event.target.matches('select')) { if (event.target === field('scenario')) { copiedObservation = null; host.querySelector('[data-ct-sync]').textContent = '本图使用种子17的课堂样例。'; } draw(); } });
      host.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]'); if (!button || !host.contains(button)) return;
        if (button.dataset.action === 'reset') {
          copiedObservation = null;
          if (part === 'background') { field('delta').value = '0'; field('thickness').value = '2'; }
          else { field('scenario').value = 'standard'; field('threshold').value = '2.3'; field('limit').value = '12'; host.querySelector('[data-ct-sync]').textContent = '本图默认使用种子17的课堂样例。'; }
          draw();
        }
        if (button.dataset.action === 'sync') {
          const s = g.CaseInspect && g.CaseInspect.snapshot(), o = s && s.ready && s.caseId === CASE && s.observation;
          if (!o) { host.querySelector('[data-ct-sync]').textContent = '当前没有本例可读取的观测。先运行主示范，再回到本图。'; return; }
          copiedObservation = JSON.parse(JSON.stringify(o)); field('scenario').value = o.description.scenario;
          host.querySelector('[data-ct-sync]').textContent = '已读取主示范 ' + s.runId + ' 的观测；本图按当前阈值与范围重新计算。'; draw();
        }
      });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[CASE] = { backgroundAfter: 1, workflowAfter: 2, backgroundHTML, workflowHTML, mount, graphics: { alignmentGraphic, matchGraphic, scoreGraphic, cclSignalGraphic, evaluationGraphic }, scenarioOptions };
})(globalThis);
