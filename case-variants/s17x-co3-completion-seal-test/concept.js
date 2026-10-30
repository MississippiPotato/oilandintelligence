(function (g) {
  'use strict';
  const E = g.VariantEngine, ID = 's17x-co3-completion-seal-test';
  const colors = ['#B8242A', '#55768B', '#B08A4A', '#5E7565'];
  const num = (x, n = 3) => x === null || x === undefined || !Number.isFinite(x) ? '未知' : x.toFixed(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  function chart(o) {
    const W = 880, H = o.height || 350, L = 100, R = 32, T = 32, B = 66, xMin = o.xMin || 0, xMax = o.xMax;
    const yMin = o.yMin, yMax = o.yMax, x = v => L + (v - xMin) / (xMax - xMin) * (W - L - R), y = v => H - B - (v - yMin) / Math.max(1e-9, yMax - yMin) * (H - T - B);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="min-width:${W}px;width:100%;height:auto;max-height:none" role="img" aria-label="${esc(o.label)}"><rect width="${W}" height="${H}" fill="#F7F4EF"/><g fill="#352F2D" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16">`;
    for (let i = 0; i <= 4; i++) {
      const yy = yMin + (yMax - yMin) * i / 4, xx = xMin + (xMax - xMin) * i / 4;
      s += `<path d="M${L} ${y(yy)}H${W - R}" stroke="#DDD5CB"/><text x="${L - 12}" y="${y(yy) + 6}" text-anchor="end">${num(yy, o.digits === undefined ? 2 : o.digits)}</text><text x="${x(xx)}" y="${H - B + 27}" text-anchor="middle">${num(xx, o.xDigits || 0)}</text>`;
    }
    s += `<path d="M${L} ${T}V${H - B}H${W - R}" stroke="#6A5C55" fill="none"/><text x="${(W + L - R) / 2}" y="${H - 12}" text-anchor="middle">${esc(o.xLabel)}</text><text transform="translate(25 ${(H - B + T) / 2}) rotate(-90)" text-anchor="middle">${esc(o.yLabel)}</text>`;
    if (o.zero && yMin <= 0 && yMax >= 0) s += `<path d="M${L} ${y(0)}H${W - R}" stroke="#B08A4A" stroke-dasharray="5 4"/>`;
    (o.series || []).forEach((a, j) => {
      if (a.scatter) s += a.values.filter(p => Number.isFinite(p.y)).map(p => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="3" fill="${a.color || colors[j]}"/>`).join('');
      else { let path = '', active = false; a.values.forEach(p => { if (!Number.isFinite(p.y)) {active = false; return;} path += `${active ? 'L' : 'M'}${x(p.x).toFixed(2)},${y(p.y).toFixed(2)} `; active = true; }); s += `<path d="${path}" fill="none" stroke="${a.color || colors[j]}" stroke-width="3"${a.dash ? ' stroke-dasharray="7 5"' : ''}/>`; }
    });
    if (Number.isFinite(o.cursor)) s += `<path d="M${x(o.cursor)} ${T}V${H - B}" stroke="#594941" stroke-width="2" stroke-dasharray="3 4"/>`;
    return s + '</g></svg>';
  }
  function legend(items) { return '<div class="vx-legend">' + items.map((x, i) => `<span><i style="background:${colors[i % colors.length]}"></i>${esc(x)}</span>`).join('') + '</div>'; }
  function background(p) {
    const C = .72, beta = E.dataset.calibration.beta;
    const points = Array.from({length: 61}, (_, i) => { const time = i / 2, temp = beta * p.drift * (1 - Math.exp(-time / 12)), leak = -p.leak / C * time; return {time, temp, leak, total: temp + leak}; });
    const ys = points.flatMap(v => [v.temp, v.leak, v.total]), last = points[points.length - 1];
    return {html: chart({label: '温漂与漏失对压力变化的分量叠加', xMax: 30, yMin: Math.min(0, ...ys) - .1, yMax: Math.max(0, ...ys) + .1, xLabel: '闭阀后时间 / min', yLabel: '相对起点压力变化 / MPa', zero: true, series: [{values: points.map(v => ({x: v.time, y: v.total}))}, {values: points.map(v => ({x: v.time, y: v.temp})), dash: true}, {values: points.map(v => ({x: v.time, y: v.leak})), dash: true}]}) + legend(['合计压力变化', '温漂分量 βΔT', '漏失分量 −Qt/C']), readout: `30 min实际温差 ${num(p.drift * (1 - Math.exp(-30 / 12)))} K（长期设定 ${num(p.drift)} K）；温漂 ${num(last.temp)} MPa，流失 ${num(last.leak)} MPa，合计 ${num(last.total)} MPa。Ceff = 0.720 L/MPa；β = ${num(beta)} MPa/K。即使压力上升，也可能同时存在漏流。三条曲线按相同时间逐点相加。`, state: {inputs: p, complianceLPerMPa: C, betaMPaPerK: beta, actualTemperatureChangeAt30MinK: p.drift * (1 - Math.exp(-30 / 12)), thermalMPa: last.temp, leakMPa: last.leak, totalMPa: last.total}};
  }
  function workflow(p) {
    const r = E.run({start: p.start, end: p.end}).inference;
    if (!r.valid) return {html: chart({label: '所选保压窗无有效残差，保留原始压力记录', xMax: 40, yMin: 8.5, yMax: 10.1, xLabel: '试验时间 / min', yLabel: '原始压力 / MPa', series: [{values: E.run().observation.points.map(v => ({x: v.time, y: v.pressure}))}]}), readout: `证据不足：${r.reasons.join('；')}。请将窗口起点移到闭阀后的5 min以后，并保留至少8点。`, state: {inputs: p, status: r.status, sampleCount: r.sampleCount, reasons: r.reasons}};
    const min = Math.min(...r.points.map(v => v.corrected)) - .02, max = Math.max(...r.points.map(v => v.corrected)) + .02;
    const residualMax = Math.max(.01, ...r.points.map(v => Math.abs(v.residual))) * 1.15;
    return {html: chart({label: '温度补偿压力与窗口最小二乘拟合', xMin: p.start, xMax: p.end, yMin: min, yMax: max, xLabel: '试验时间 / min', yLabel: '补偿压力 Pc / MPa', series: [{scatter: true, values: r.points.map(v => ({x: v.time, y: v.corrected}))}, {values: r.points.map(v => ({x: v.time, y: v.fitted}))}]}) + legend(['补偿压力观测', '窗口内线性拟合']) + chart({label: '同一窗口拟合残差', height: 280, xMin: p.start, xMax: p.end, yMin: -residualMax, yMax: residualMax, digits: 3, zero: true, xLabel: '试验时间 / min', yLabel: '残差 / MPa', series: [{scatter: true, values: r.points.map(v => ({x: v.time, y: v.residual})), color: '#55768B'}]}), readout: `闭阀窗 ${p.start}–${p.end} min，共 ${r.sampleCount} 点。b = ${num(r.line.slope, 5)} MPa/min；Ceff = ${num(r.C.value)} L/MPa；Q̂ = ${num(r.estimate, 5)} L/min，区间 [${num(r.low, 5)}, ${num(r.high, 5)}]。${r.status}。残差显示直线近似剩下多少结构。`, state: {inputs: p, status: r.status, sampleCount: r.sampleCount, slopeMPaPerMin: r.line.slope, complianceLPerMPa: r.C.value, estimateLPerMin: r.estimate, interval: [r.low, r.high], residualSDMPa: r.line.residualSD}};
  }
  const bgDefault = {drift: -1.5, leak: .006}, wfDefault = {start: 8, end: 32};
  function widget(part, title, body, controls, result) { return `<section class="ct-widget" data-concept-scene="${ID}" data-concept-part="${part}"><h3>${title}</h3><p>${body}</p><div class="ct-controls">${controls}<button disabled type="button" data-ct-reset>复位本图</button></div><div class="ct-chart" data-ct-graphic>${result.html}</div><p class="ct-readout" data-ct-result>${result.readout}</p></section>`; }
  const backgroundHTML = widget('background', '压力变化有两条同时作用的路径', '封闭液体降温会收缩，流失液体也会使压力下降；升温可抵消漏流造成的压降。先认识两个换算量：β表示每升温1 K引起多少MPa压力变化；Ceff表示增压1 MPa需要补入多少L液体。它们把温差和流失量换到同一MPa坐标，下面给定局部漏率分解两种作用。', '<label>长期温差设定 / K<input disabled data-ct-key="drift" type="range" min="-3" max="3" step="0.1" value="-1.5"></label><label>已知局部漏率 / L·min⁻¹<input disabled data-ct-key="leak" type="range" min="0" max="0.03" step="0.001" value="0.006"></label>', background(bgDefault));
  const workflowHTML = widget('workflow', '选择可解释的闭阀保压窗，再看拟合与残差', '先用独立无漏试验校准β，再用本次加液试验估计Ceff。拖动窗口会重新选择观测、补偿温漂、拟合斜率和传播误差；取到压测起始未闭阀阶段时保留“证据不足”。', '<label>窗口起点 / min<input disabled data-ct-key="start" type="range" min="0" max="20" step="1" value="8"></label><label>窗口终点 / min<input disabled data-ct-key="end" type="range" min="22" max="40" step="1" value="32"></label>', workflow(wfDefault));
  function mount(root) { root.querySelectorAll(`[data-concept-scene="${ID}"]`).forEach(host => {
    if (host.dataset.ctReady) return; host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
    const isBg = host.dataset.conceptPart === 'background', defaults = isBg ? bgDefault : wfDefault;
    function draw() { const p = {}; host.querySelectorAll('[data-ct-key]').forEach(el => p[el.dataset.ctKey] = Number(el.value)); const r = (isBg ? background : workflow)(p); host.querySelector('[data-ct-graphic]').innerHTML = r.html; host.querySelector('[data-ct-result]').textContent = r.readout; host.dataset.ctState = JSON.stringify(r.state); }
    host.addEventListener('input', draw); host.addEventListener('change', draw); host.querySelector('[data-ct-reset]').addEventListener('click', () => { Object.keys(defaults).forEach(k => host.querySelector(`[data-ct-key="${k}"]`).value = defaults[k]); draw(); }); draw();
  }); }
  g.VariantView = {chart, legend, num, esc};
  (g.S17Concepts || (g.S17Concepts = {}))[ID] = {backgroundAfter: 1, workflowAfter: 2, backgroundHTML, workflowHTML, mount};
})(globalThis);
