(function (g) {
  'use strict';
  const scene = 't4', red = '#B8242A', blue = '#55768B', gold = '#B08A4A';
  const fmt = (x, n = 2) => Number(x).toFixed(n);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const style = '<style>[data-concept-scene="t4"]{font-size:18px;line-height:1.65;min-width:0}[data-concept-scene="t4"] .ct-chart{overflow-x:auto;max-width:100%}[data-concept-scene="t4"] svg{display:block;width:100%;min-width:760px}[data-concept-scene="t4"] figcaption,[data-concept-scene="t4"] label{font-size:16px}[data-concept-scene="t4"] input,[data-concept-scene="t4"] button{min-height:42px}</style>';
  const fittedStyle = "<style>[data-concept-scene=\"t4\"].ct-widget p{font-size:18px}[data-concept-scene=\"t4\"].ct-widget .ct-controls :is(input,select,button){min-height:44px}[data-concept-scene=\"t4\"].ct-widget .ct-controls input[type=range]{height:44px}[data-concept-scene=\"t4\"].ct-widget .ct-chart>svg{display:block;width:100%;min-width:760px;max-width:none;max-height:none;height:auto;margin:0}</style>";
  const wrap = (h, height, label) => '<div class="ct-chart"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + height + '" role="img" aria-label="' + esc(label) + '"><rect width="760" height="' + height + '" fill="#F7F4EF"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16" fill="#383431">' + h + '</g></svg></div>';
  function random(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
  function fit(cal) {
    const xm = mean(cal.map(r => r.meter)), ym = mean(cal.map(r => r.reference)), b = cal.reduce((s, r) => s + (r.meter - xm) * (r.reference - ym), 0) / (cal.reduce((s, r) => s + (r.meter - xm) ** 2, 0) || 1);
    return {a: ym - b * xm, b, delta: mean(cal.map(r => r.reference - r.meter))};
  }
  function fixture(gain = 6, noise = 2) {
    const R = random(424), calibration = Array.from({length: 24}, (_, i) => { const reference = 40 + i * 5; return {reference, meter: reference * (1 + gain / 100) + 2 + (R() - .5) * noise * 2}; });
    const references = Array.from({length: 60}, (_, i) => 80 + 35 * Math.sin(i / 8) + i * .6), meter = references.map(v => v * (1 + gain / 100) + 2 + (R() - .5) * noise * 2);
    return {calibration, meter, references, source: '沿用本例种子424、24个标定点与60个运行区间'};
  }
  function calibration(gain, noise) { const d = fixture(gain, noise); return {gain, noise, calibration: d.calibration, model: fit(d.calibration)}; }
  function calibrationChart(d) {
    const x = v => 76 + (v - 30) / 155 * 640, y = v => 286 - (v - 30) / 155 * 225, ry = v => 420 - v / 28 * 77;
    let h = '<text x="76" y="28">24个标定配对 · 横轴被检表读数，纵轴参考装置（同为m³/h）</text>';
    [40, 80, 120, 160].forEach(v => { h += '<path d="M76 ' + y(v) + 'H716" stroke="#DDD6CC"/><text x="65" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text><text x="' + x(v) + '" y="313" text-anchor="middle">' + v + '</text>'; });
    h += '<path d="M' + x(30) + ' ' + y(30) + 'L' + x(185) + ' ' + y(185) + '" stroke="' + gold + '" stroke-width="2" stroke-dasharray="6 5"/><path d="M' + x(30) + ' ' + y(d.model.a + d.model.b * 30) + 'L' + x(185) + ' ' + y(d.model.a + d.model.b * 185) + '" stroke="' + red + '" stroke-width="3"/>';
    d.calibration.forEach(r => { h += '<circle cx="' + x(r.meter) + '" cy="' + y(r.reference) + '" r="4.5" fill="' + blue + '"><title>读数' + fmt(r.meter) + '，参考' + fmt(r.reference) + ' m³/h</title></circle>'; });
    h += '<text x="76" y="351">同一标定横轴上的残差：输出 − 标定参考（m³/h）</text>';
    [-20, 0, 20].forEach(v => { h += '<path d="M76 ' + ry(v) + 'H716" stroke="' + (v === 0 ? '#AAA092' : '#DDD6CC') + '"/><text x="65" y="' + (ry(v) + 5) + '" text-anchor="end">' + v + '</text>'; });
    d.calibration.forEach(r => { h += '<circle cx="' + x(r.meter) + '" cy="' + ry(r.meter - r.reference) + '" r="3.4" fill="' + gold + '"/><circle cx="' + x(r.meter) + '" cy="' + ry(d.model.a + d.model.b * r.meter - r.reference) + '" r="3.4" fill="' + red + '"/>'; });
    h += '<text x="396" y="521" text-anchor="middle">被检表读数 m³/h；上方拟合线与下方残差来自同24个标定点</text>';
    return wrap(h, 545, '标定配对散点、比例校正线及标定内原始和校正残差');
  }
  function calibrationText(d) {
    return '由24个标定配对拟合 Q校正=' + fmt(d.model.a, 3) + '+' + fmt(d.model.b, 5) + '×Q读数；固定差基线加 ' + fmt(d.model.delta, 3) + ' m³/h。参考流量覆盖40～155 m³/h。比例偏差改变斜率，固定加2 m³/h改变零点；增大噪声会使配对和残差更分散。图中是拟合内检查，后续运行评价另算。';
  }
  function operating(data, drift, minutes) {
    const model = fit(data.calibration), count = Math.min(data.meter.length, minutes), meter = data.meter.slice(0, count).map(v => v * (1 + drift / 100));
    // Prediction accepts meter observations and the frozen calibration only.
    const corrected = meter.map(v => model.a + model.b * v), baseline = meter.map(v => v + model.delta);
    // Independent operating references enter only after both predictions exist.
    const refs = data.references.slice(0, count), residual = corrected.map((v, i) => v - refs[i]), baseResidual = baseline.map((v, i) => v - refs[i]), rawResidual = meter.map((v, i) => v - refs[i]);
    const cumulative = a => { let sum = 0; return a.map(v => (sum += v / 60)); }, volume = a => a.reduce((s, v) => s + v / 60, 0), referenceVolume = volume(refs);
    return {source: data.source, drift, minutes: count, calibrationCount: data.calibration.length, model, meter, corrected, baseline, residual, baseResidual, rawResidual, cumulative: cumulative(residual), baseCumulative: cumulative(baseResidual), rawVolume: volume(meter), correctedVolume: volume(corrected), baselineVolume: volume(baseline), referenceVolume, mae: mean(residual.map(Math.abs)), baseMae: mean(baseResidual.map(Math.abs)), relativeBias: 100 * (volume(corrected) - referenceVolume) / referenceVolume};
  }
  function operatingChart(d) {
    const x = i => 76 + i / 60 * 640, maxR = Math.max(5, ...d.rawResidual.map(Math.abs), ...d.residual.map(Math.abs), ...d.baseResidual.map(Math.abs)) * 1.15, maxV = Math.max(1, ...d.cumulative.map(Math.abs), ...d.baseCumulative.map(Math.abs)) * 1.15, y = v => 165 - v / maxR * 96, vy = v => 433 - v / maxV * 90;
    let h = '<text x="76" y="28">运行残差 m³/h（只在预测后与独立运行参考比较）</text>';
    [-maxR, 0, maxR].forEach(v => { h += '<path d="M76 ' + y(v) + 'H716" stroke="' + (v === 0 ? '#AAA092' : '#DDD6CC') + '"/><text x="65" y="' + (y(v) + 5) + '" text-anchor="end">' + fmt(v, 1) + '</text>'; });
    const line = (a, sy, color, dash, ends) => '<path d="' + a.map((v, i) => (i ? 'L' : 'M') + fmt(x(i + (ends ? 1 : 0)), 1) + ' ' + fmt(sy(v), 1)).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.7" stroke-dasharray="' + (dash || '') + '"/>';
    h += line(d.rawResidual, y, gold, '6 5') + line(d.residual, y, red) + line(d.baseResidual, y, blue, '3 4');
    h += '<text x="76" y="315">残差的累计体积差 m³：每个一分钟区间残差 ÷ 60</text>';
    [-maxV, 0, maxV].forEach(v => { h += '<path d="M76 ' + vy(v) + 'H716" stroke="' + (v === 0 ? '#AAA092' : '#DDD6CC') + '"/><text x="65" y="' + (vy(v) + 5) + '" text-anchor="end">' + fmt(v, 1) + '</text>'; });
    h += line([0, ...d.cumulative], vy, red, '', false) + line([0, ...d.baseCumulative], vy, blue, '3 4', false);
    [0, 10, 20, 30, 40, 50, 60].forEach(i => { h += '<text x="' + x(i) + '" y="555" text-anchor="middle">' + i + '</text>'; });
    h += '<text x="396" y="587" text-anchor="middle">时间 min；上图点位为区间起点，下图点位为累计到区间终点</text>';
    return wrap(h, 610, '冻结旧标定后运行残差随新增增益漂移变化及其累计体积偏差');
  }
  function operatingText(d) {
    return '固定旧标定：a=' + fmt(d.model.a, 3) + '，b=' + fmt(d.model.b, 5) + '（' + d.calibrationCount + '点）。在原运行读数上再乘1+' + fmt(d.drift, 1) + '%后，用同一系数校正' + d.minutes + '个一分钟区间：回归MAE ' + fmt(d.mae) + ' m³/h，固定差基线MAE ' + fmt(d.baseMae) + ' m³/h；参考累计 ' + fmt(d.referenceVolume) + ' m³，回归累计 ' + fmt(d.correctedVolume) + ' m³，累计相对偏差 ' + fmt(d.relativeBias) + '%。漂移控件不改变标定点或系数。数据：' + d.source + '。';
  }
  function field(n, label, min, max, step, value) { return '<label>' + label + ' <output data-ct-value="' + n + '">' + value + '</output><input disabled name="' + n + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const b0 = calibration(6, 2), w0 = operating(fixture(), 0, 60);
  const backgroundHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t4" data-concept-part="background"><h3>多报6%，与固定多报2 m³/h，图上有什么不同？</h3><p>标定需要在同一温压参考状态下成对观察被检表与参考装置。沿用本例24个标定点的生成关系：读数=参考×(1+比例偏差)+2+噪声。拖动比例偏差与噪声，看y=x、拟合线和残差的关系。</p><div class="ct-controls">' + field('gain', '仪表比例偏差（%）', 0, 12, 1, 6) + field('noise', '有界读数噪声幅度（±m³/h）', 0, 6, .5, 2) + '<button disabled type="button" data-ct-reset>恢复默认</button></div><figure><div data-ct-graphic>' + calibrationChart(b0) + '</div><figcaption>上图：蓝灰点为标定配对，朱红为最小二乘线，赭金虚线为y=x；下图：赭金为原始残差，朱红为回归后的标定残差。标定参考只用于拟合与拟合内检查。</figcaption></figure><p class="ct-readout" data-ct-result>' + calibrationText(b0) + '</p></section>';
  const workflowHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t4" data-concept-part="workflow"><h3>把旧系数冻结，新增漂移会留下怎样的残差？</h3><p>先只用标定配对拟合系数，再把运行读数交给校正器，最后才与运行参考比较。本局部实验把冻结的原运行读数整体再乘(1+d/100)，用于观察后续仪表增益变化；它与主示范直接追加参考流量比例偏差的生成方式略有区别。</p><div class="ct-controls">' + field('drift', '原运行读数再增加的增益漂移 d（%）', -5, 8, .5, 0) + field('minutes', '纳入累计的连续区间（min）', 10, 60, 5, 60) + '<button disabled type="button" data-ct-import>读取本轮标定与运行</button><button disabled type="button" data-ct-reset>恢复默认</button></div><p data-ct-source class="ct-readout">当前使用本例种子424的默认标定与运行数据。</p><figure><div data-ct-graphic>' + operatingChart(w0) + '</div><figcaption>朱红为回归校正；蓝灰点虚线为标定平均差基线；上图赭金为原始读数残差。累计体积差保留正负，不把单点MAE代替累计交接量偏差。</figcaption></figure><p class="ct-readout" data-ct-result>' + operatingText(w0) + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="t4"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true'; host.querySelectorAll('input,button').forEach(el => { el.disabled = false; });
      let data = fixture(); const get = n => Number(host.querySelector('[name="' + n + '"]').value);
      function draw() {
        host.querySelectorAll('[data-ct-value]').forEach(out => { out.textContent = host.querySelector('[name="' + out.dataset.ctValue + '"]').value; });
        const background = host.dataset.conceptPart === 'background', d = background ? calibration(get('gain'), get('noise')) : operating(data, get('drift'), get('minutes'));
        host.querySelector('[data-ct-graphic]').innerHTML = background ? calibrationChart(d) : operatingChart(d); host.querySelector('[data-ct-result]').textContent = background ? calibrationText(d) : operatingText(d);
        host.dataset.ctState = JSON.stringify({part: host.dataset.conceptPart, ...d});
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      const button = host.querySelector('[data-ct-import]');
      if (button) button.addEventListener('click', () => {
        let s; try { s = g.CaseInspect && g.CaseInspect.snapshot(); } catch (_) {}
        const r = s && s.result, chart = r && r.charts && r.charts.find(c => c.series && c.series.some(z => z.name === '原始仪表') && c.series.some(z => z.name === '独立参考'));
        if (!s || !['computed', 'ready'].includes(s.status) || !r || !Array.isArray(r.calibration) || r.calibration.length < 2 || !chart) { host.querySelector('[data-ct-source]').textContent = '尚无已计算的标定与运行数据；保留当前数据。请先在可运行示范中计算。'; return; }
        const meter = chart.series.find(z => z.name === '原始仪表').y, references = chart.series.find(z => z.name === '独立参考').y;
        if (!Array.isArray(meter) || !Array.isArray(references) || meter.length !== references.length || !meter.length) return;
        data = {calibration: r.calibration.map(z => ({reference: z.reference, meter: z.meter})), meter: meter.slice(), references: references.slice(), source: 'CaseInspect本轮标定配对与运行序列；运行参考仅供预测后评价'};
        host.querySelector('[name="drift"]').value = '0'; host.querySelector('[name="minutes"]').max = String(meter.length); host.querySelector('[name="minutes"]').value = String(meter.length);
        host.querySelector('[data-ct-source]').textContent = '已冻结本轮标定与运行序列。新增漂移从0开始；校正器仅接收仪表读数，运行参考只在预测后进入残差和积分。'; draw();
      });
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { data = fixture(); host.querySelectorAll('input').forEach(el => { el.value = el.defaultValue; }); const note = host.querySelector('[data-ct-source]'); if (note) { host.querySelector('[name="minutes"]').max = '60'; note.textContent = '已恢复本例种子424的默认标定与运行数据。'; } draw(); });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = {backgroundAfter: 1, workflowAfter: 3, backgroundHTML, workflowHTML, mount};
})(globalThis);
