(function (g) {
  'use strict';
  const E = g.VariantEngine, ID = 's17x-c1-cement-woc-strength';
  const colors = ['#B8242A', '#55768B', '#B08A4A', '#5E7565'];
  const num = (x, n = 2) => x === null || x === undefined || !Number.isFinite(x) ? '未知' : x.toFixed(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  function chart(o) {
    const W = 880, H = o.height || 370, L = 90, R = 32, T = 36, B = 66, xMax = o.xMax, xMin = o.xMin || 0;
    const yMin = o.yMin === undefined ? 0 : o.yMin, yMax = o.yMax, x = v => L + (v - xMin) / (xMax - xMin) * (W - L - R), y = v => H - B - (v - yMin) / Math.max(.00001, yMax - yMin) * (H - T - B);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="min-width:${W}px;width:100%;height:auto;max-height:none" role="img" aria-label="${esc(o.label)}"><rect width="${W}" height="${H}" fill="#F7F4EF"/><g fill="#352F2D" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16">`;
    for (let i = 0; i <= 4; i++) {
      const yy = yMin + (yMax - yMin) * i / 4, xx = xMin + (xMax - xMin) * i / 4;
      s += `<path d="M${L} ${y(yy)}H${W - R}" stroke="#DDD5CB"/><text x="${L - 12}" y="${y(yy) + 6}" text-anchor="end">${num(yy, o.digits === undefined ? 1 : o.digits)}</text><text x="${x(xx)}" y="${H - B + 27}" text-anchor="middle">${num(xx, 0)}</text>`;
    }
    s += `<path d="M${L} ${T}V${H - B}H${W - R}" stroke="#6A5C55" fill="none"/><text x="${(W + L - R) / 2}" y="${H - 12}" text-anchor="middle">${esc(o.xLabel)}</text><text transform="translate(24 ${(H - B + T) / 2}) rotate(-90)" text-anchor="middle">${esc(o.yLabel)}</text>`;
    if (o.target !== undefined && o.target >= yMin && o.target <= yMax) s += `<path d="M${L} ${y(o.target)}H${W - R}" stroke="#B08A4A" stroke-width="2" stroke-dasharray="7 5"/>`;
    (o.series || []).forEach((a, j) => {
      const valid = a.values.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= xMin && p.x <= xMax);
      const col = a.color || colors[j % colors.length];
      if (a.scatter) s += valid.map(p => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="3.5" fill="${col}" opacity=".55"/>`).join('');
      else {
        let path = '', active = false;
        a.values.forEach(p => { if (!Number.isFinite(p.y) || p.x < xMin || p.x > xMax) { active = false; return; } path += `${active ? 'L' : 'M'}${x(p.x).toFixed(2)},${y(p.y).toFixed(2)} `; active = true; });
        s += `<path d="${path}" fill="none" stroke="${col}" stroke-width="3"${a.dash ? ' stroke-dasharray="8 5"' : ''}/>`;
      }
    });
    if (Number.isFinite(o.cursor)) s += `<path d="M${x(o.cursor)} ${T}V${H - B}" stroke="#594941" stroke-width="2" stroke-dasharray="3 4"/>`;
    return s + '</g></svg>';
  }
  function legend(items) { return '<div class="vx-legend">' + items.map((x, i) => `<span><i style="background:${colors[i % colors.length]}"></i>${esc(x)}</span>`).join('') + '</div>'; }
  function background(p) {
    const factor = E.rate(p.temperature, E.model.energy), age = p.elapsed * factor;
    const values = Array.from({length: 56}, (_, i) => ({x: 25 + i, y: E.rate(25 + i, E.model.energy)}));
    return {html: chart({label: '温度与水化相对速率，标记当前温度', xMin: 25, xMax: 80, yMax: Math.ceil(Math.max(...values.map(x => x.y))), xLabel: '养护温度 / °C', yLabel: '相对反应速率 / 50°C = 1', series: [{values}, {scatter: true, values: [{x: p.temperature, y: factor}]}], cursor: p.temperature}), readout: `在恒定 ${p.temperature}°C 放置 ${p.elapsed} h，相当于 50°C 的 ${num(age)} h；相对反应速率 ${num(factor)}。曲线使用训练/验证选定 Ea = ${E.model.energy} kJ/mol。`, state: {inputs: p, energyKJMol: E.model.energy, relativeRate: factor, equivalentAgeHours: age}};
  }
  function workflow(p) {
    const data = E.dataset, m = E.fitForEnergy(data.training, p.energy), errors = [];
    data.validation.forEach(e => { const ages = E.equivalentAge(e.observation.points, p.energy); e.samples.forEach(s => { const a = ages.find(v => v.time === s.time), v = E.predict(m.curve, a.equivalentAge); if (v !== null) errors.push(Math.abs(v - s.strength)); }); });
    const model = {...m, baselineCurve: E.model.baselineCurve}, prediction = E.infer(data.observations[3], model, {target: p.target});
    const maxX = m.curve[m.curve.length - 1].x;
    return {html: chart({label: '训练批次等效龄期强度散点与单调拟合', xMax: maxX, yMax: Math.max(26, p.target + 1), xLabel: '50°C等效龄期 / h', yLabel: '抗压强度 / MPa', target: p.target, series: [{scatter: true, values: m.samples.map(s => ({x: s.x, y: s.y})), color: '#B08A4A'}, {values: m.curve.map(s => ({x: s.x, y: s.y})), color: '#B8242A'}]}) + '<div class="vx-legend"><span><i style="background:#B8242A"></i>单调分段拟合</span><span><i style="background:#B08A4A"></i>12训练批次的108个合成压碎读数</span></div>', readout: `Ea = ${p.energy} kJ/mol；验证强度 MAE ${num(errors.reduce((a, b) => a + b, 0) / errors.length, 3)} MPa（${errors.length}/36点）。示例 WX04 在目标 ${p.target} MPa 时：${prediction.time === null ? '72 h 内未预测达到' : num(prediction.time) + ' h'}。当前调参是教学比较，正式评分仍冻结 Ea = ${E.model.energy}。`, state: {inputs: p, validationMAE: errors.reduce((a, b) => a + b, 0) / errors.length, validationN: errors.length, predictedTime: prediction.time, curvePoints: m.curve.length}};
  }
  const bgDefault = {temperature: 50, elapsed: 12}, wfDefault = {energy: E.model.energy, target: 10};
  function widget(part, title, body, controls, state) {
    return `<section class="ct-widget" data-concept-scene="${ID}" data-concept-part="${part}"><h3>${title}</h3><p>${body}</p><div class="ct-controls">${controls}<button disabled type="button" data-ct-reset>复位本图</button></div><div class="ct-chart" data-ct-graphic>${state.html}</div><p class="ct-readout" data-ct-result>${state.readout}</p></section>`;
  }
  const backgroundHTML = widget('background', '亲手比较：同样12小时，反应进度相同吗？', '温度影响水化反应进度；等效龄期把一段温度程序换成参考温度下的反应时间。表观活化能Ea描述反应速率对温度的敏感程度；Ea越大，升温带来的加速越明显。先用恒温小算例比较相同自然小时的硬化进度。', '<label>恒温 / °C<input disabled data-ct-key="temperature" type="range" min="25" max="80" step="1" value="50"></label><label>自然龄期 / h<input disabled data-ct-key="elapsed" type="range" min="0" max="36" step="1" value="12"></label>', background(bgDefault));
  const workflowHTML = widget('workflow', '用训练点拟合，用独立验证批次选温敏参数', '本例要求强度随反应进度不下降。把测量波动造成的相邻下降读数合并，按读数数量加权平均，反复合并直到不再下降；这称为相邻违序合并算法（PAVA）单调回归，再在相邻节点间线性插值。横坐标随Ea改变；下面用另外4批验证误差比较候选参数。', `<label>表观活化能 Ea / kJ·mol⁻¹<select disabled data-ct-key="energy">${[20, 25, 30, 35, 40, 45, 50].map(v => `<option${v === E.model.energy ? ' selected' : ''}>${v}</option>`).join('')}</select></label><label>目标强度 / MPa<input disabled data-ct-key="target" type="range" min="1" max="30" step="1" value="10"></label>`, workflow(wfDefault));
  function mount(root) {
    root.querySelectorAll(`[data-concept-scene="${ID}"]`).forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
      const isBg = host.dataset.conceptPart === 'background', defaults = isBg ? bgDefault : wfDefault;
      function draw() { const p = {}; host.querySelectorAll('[data-ct-key]').forEach(el => p[el.dataset.ctKey] = Number(el.value)); const r = (isBg ? background : workflow)(p); host.querySelector('[data-ct-graphic]').innerHTML = r.html; host.querySelector('[data-ct-result]').textContent = r.readout; host.dataset.ctState = JSON.stringify(r.state); }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { Object.keys(defaults).forEach(k => host.querySelector(`[data-ct-key="${k}"]`).value = defaults[k]); draw(); }); draw();
    });
  }
  g.VariantView = {chart, legend, num, esc};
  (g.S17Concepts || (g.S17Concepts = {}))[ID] = {backgroundAfter: 1, workflowAfter: 1, backgroundHTML, workflowHTML, mount};
})(globalThis);
