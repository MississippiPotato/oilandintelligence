(function (g) {
  'use strict';
  const scene = 's4', C = { red: '#B8242A', paper: '#F7F4EF', blue: '#55768B', gold: '#B08A4A', ink: '#263D48' };
  const f = (v, n = 3) => Number(v).toFixed(n), mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const path = (a, X, Y) => a.map((v, i) => (i ? 'L' : 'M') + f(X(v, i), 1) + ',' + f(Y(v, i), 1)).join('');
  function svg(body, label, h = 420) { return '<div class="ct-chart" style="overflow-x:auto"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="display:block;width:100%;height:auto;min-width:760px;background:' + C.paper + ';font:16px system-ui,Microsoft YaHei,sans-serif"><g fill="' + C.ink + '">' + body + '</g></svg></div>'; }
  function control(label, name, min, max, step, value) { return '<label>' + label + '<input disabled type="range" data-ct-input="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const reset = '<button disabled type="button" data-ct-action="reset">复位本图</button>';
  function backgroundCalc(z, ratio) {
    const phi = (11.5 + 2.7 * (ratio - 1.68) - z) / 14.405, shale = ratio - 1.68 - .15 * phi;
    const examples = [.1, .15].map(phi => { const shale = (z - 11.5 + 14 * phi) / 2.7; return { phi, shale, ratio: 1.68 + shale + .15 * phi }; });
    return { impedance: z, vpVs: ratio, phi, shale, phiPct: phi * 100, shalePct: shale * 100, reproducedZ: 11.5 - 14 * phi + 2.7 * shale, reproducedRatio: 1.68 + shale + .15 * phi, inPlot: phi >= 0 && phi <= .35 && shale >= 0 && shale <= .6, examples };
  }
  function backgroundChart(v) {
    const X = p => 82 + p / .35 * 398, Y = s => 327 - s / .6 * 270;
    const locus = fn => Array.from({ length: 351 }, (_, i) => ({ p: i / 1000, s: fn(i / 1000) })).filter(q => q.s >= 0 && q.s <= .6);
    const za = locus(p => (v.impedance - 11.5 + 14 * p) / 2.7), ra = locus(p => v.vpVs - 1.68 - .15 * p);
    let b = '<text x="82" y="28" font-size="18">属性约束在同一孔隙度–泥质平面上相交</text><path d="M82 57V327H480" fill="none" stroke="#8D9DA2"/>';
    [0, 10, 20, 30].forEach(p => { b += '<text x="' + (X(p / 100) - 10) + '" y="352">' + p + '</text><path d="M' + X(p / 100) + ' 57V327" stroke="#DFDFD8"/>'; });
    [0, 20, 40, 60].forEach(s => { b += '<text x="40" y="' + (Y(s / 100) + 6) + '">' + s + '</text><path d="M82 ' + Y(s / 100) + 'H480" stroke="#DFDFD8"/>'; });
    b += '<path d="' + path(za, q => X(q.p), q => Y(q.s)) + '" fill="none" stroke="' + C.gold + '" stroke-width="4"/><path d="' + path(ra, q => X(q.p), q => Y(q.s)) + '" fill="none" stroke="' + C.blue + '" stroke-width="4"/>';
    v.examples.forEach((q, i) => { if (q.shale >= 0 && q.shale <= .6) b += '<circle cx="' + X(q.phi) + '" cy="' + Y(q.shale) + '" r="6" fill="' + C.paper + '" stroke="' + C.gold + '" stroke-width="2"/><text x="' + (X(q.phi) + 9) + '" y="' + (Y(q.shale) - 8) + '">' + (i ? 'B' : 'A') + '</text>'; });
    if (v.inPlot) b += '<circle cx="' + X(v.phi) + '" cy="' + Y(v.shale) + '" r="8" fill="' + C.red + '"/><path d="M82 ' + Y(v.shale) + 'H' + X(v.phi) + 'V327" fill="none" stroke="' + C.red + '" stroke-dasharray="4 4"/>';
    b += '<text x="192" y="385">孔隙度 φ / % →</text><text x="16" y="27">Vsh / %</text><text x="520" y="80" fill="' + C.gold + '" font-size="18">金线：固定声阻抗</text><text x="520" y="111">Z=' + f(v.impedance, 2) + '</text><text x="520" y="154" fill="' + C.blue + '" font-size="18">蓝线：固定Vp/Vs</text><text x="520" y="185">Vp/Vs=' + f(v.vpVs, 3) + '</text><text x="520" y="237" fill="' + C.red + '">交点 φ=' + f(v.phiPct, 2) + '%</text><text x="520" y="267" fill="' + C.red + '">Vsh=' + f(v.shalePct, 2) + '%</text><text x="520" y="319">A、B共享Z，</text><text x="520" y="348">各有不同Vp/Vs。</text><text x="82" y="414">教学前向关系、无噪声；交点越界时不在图中强行补点。</text>';
    return svg(b, '同一阻抗的一条解集合与第二属性约束相交，显示孔隙度多解性', 440);
  }
  function backgroundRead(v) {
    const examples = v.examples.filter(q => q.shale >= 0 && q.shale <= .6), exampleText = examples.length ? '金线上的对照点：' + examples.map(q => 'φ=' + f(q.phi * 100, 0) + '%、Vsh=' + f(q.shale * 100, 2) + '%、Vp/Vs=' + f(q.ratio)).join('；') + '。' : '当前Z下，φ=10%与15%的对照点落在本图泥质范围之外。';
    return '教学关系：Z=11.5−14φ+2.7Vsh；Vp/Vs=1.68+Vsh+0.15φ（φ、Vsh用0–1体积分数代入）。当前交点φ=' + f(v.phiPct, 2) + '%、Vsh=' + f(v.shalePct, 2) + '%。' + (v.inPlot ? '固定Z只限制在金线上；增加第二属性后，两条线共同确定交点。' : '该组合的交点超出当前绘图的体积分数范围，应检查属性与教学关系是否相容。') + exampleText + 'Z沿用本例教学属性数值，未赋予实际测区单位。';
  }
  function rng(s) { return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
  function wells(seed, n, noise) {
    const r = rng(seed), rows = []; for (let w = 0; w < n; w++) { r(); for (let j = 0; j < 16; j++) { const phi = .08 + .19 * r(), shale = .08 + .42 * r(), z = 11.5 - 14 * phi + 2.7 * shale + (r() - .5) * noise, ratio = 1.68 + shale + .15 * phi + (r() - .5) * noise * .07; rows.push({ well: 'W' + (seed + w), depth: 2200 + j * 8, attributes: [z, ratio], phi: phi * 100 }); } } return rows;
  }
  function solve(a, b) {
    a = a.map((r, i) => r.slice().concat(b[i])); for (let i = 0; i < b.length; i++) { let p = i; for (let k = i + 1; k < b.length; k++) if (Math.abs(a[k][i]) > Math.abs(a[p][i])) p = k; [a[i], a[p]] = [a[p], a[i]]; const z = a[i][i]; if (Math.abs(z) < 1e-12) throw Error('病态训练矩阵'); for (let j = i; j <= b.length; j++) a[i][j] /= z; for (let k = 0; k < b.length; k++) if (k !== i) { const t = a[k][i]; for (let j = i; j <= b.length; j++) a[k][j] -= t * a[i][j]; } } return a.map(r => r[b.length]);
  }
  function fit(train, lambda, dimensions) {
    const mu = Array.from({ length: dimensions }, (_, j) => mean(train.map(r => r.attributes[j]))), sd = mu.map((v, j) => Math.sqrt(mean(train.map(r => (r.attributes[j] - v) ** 2))) || 1), x = train.map(r => [1, ...mu.map((m, j) => (r.attributes[j] - m) / sd[j])]);
    const a = Array.from({ length: dimensions + 1 }, (_, i) => Array.from({ length: dimensions + 1 }, (_, j) => x.reduce((s, r) => s + r[i] * r[j], 0) + (i === j && i > 0 ? lambda : 0))), b = Array.from({ length: dimensions + 1 }, (_, j) => x.reduce((s, r, i) => s + r[j] * train[i].phi, 0));
    return { mu, sd, beta: solve(a, b) };
  }
  const predict = (model, attributes) => attributes.map(row => model.beta[0] + model.mu.reduce((s, m, j) => s + model.beta[j + 1] * (row[j] - m) / model.sd[j], 0));
  function run(noise, lambda) {
    const train = wells(2101, 8, .22), test = wells(7101, 4, noise), model = fit(train, lambda, 2), single = fit(train, lambda, 1);
    const predictions = predict(model, test.map(r => r.attributes)), baseline = predict(single, test.map(r => r.attributes));
    return { noise, lambda, test, model, predictions, baseline, rmse: Math.sqrt(mean(predictions.map((v, i) => (v - test[i].phi) ** 2))) };
  }
  function workflowCalc(noise, lambda, well, segment) {
    const data = run(noise, lambda), ids = data.test.map((r, i) => r.well === 'W' + (7101 + well) ? i : -1).filter(i => i >= 0), index = ids[segment], row = data.test[index], z = row.attributes.map((v, j) => (v - data.model.mu[j]) / data.model.sd[j]), contributions = z.map((v, j) => v * data.model.beta[j + 1]);
    return { data, ids, index, well, segment, depthM: row.depth, attributes: row.attributes, z, coefficients: data.model.beta, contributions, predictedPhiPct: data.predictions[index], baselinePhiPct: data.baseline[index], referencePhiPct: row.phi, errorPp: data.predictions[index] - row.phi };
  }
  function workflowChart(v) {
    const rows = v.ids.map(i => v.data.test[i]), Y = d => 61 + (d - 2200) / 120 * 284;
    const zlo = Math.min(7, ...rows.map(r => r.attributes[0])) - .1, zhi = Math.max(13, ...rows.map(r => r.attributes[0])) + .1, rlo = Math.min(1.65, ...rows.map(r => r.attributes[1])) - .01, rhi = Math.max(2.35, ...rows.map(r => r.attributes[1])) + .01;
    const vals = v.ids.flatMap(i => [v.data.predictions[i], v.data.baseline[i], v.data.test[i].phi]), plo = Math.min(0, ...vals) - 1, phi = Math.max(35, ...vals) + 1;
    const Z = a => 92 + (a - zlo) / (zhi - zlo) * 133, R = a => 295 + (a - rlo) / (rhi - rlo) * 133, P = a => 513 + (a - plo) / (phi - plo) * 205;
    let b = '<text x="92" y="27" font-size="18">声阻抗 Z</text><text x="295" y="27" font-size="18">速度比 Vp/Vs</text><text x="513" y="27" font-size="18">孔隙度 / %</text><rect x="75" y="' + (Y(v.depthM) - 8) + '" width="650" height="16" fill="' + C.gold + '" opacity=".15"/>';
    [[92, 225], [295, 428], [513, 718]].forEach(([a, b0]) => { b += '<path d="M' + a + ' 53V345H' + b0 + '" stroke="#A1AEAF" fill="none"/>'; });
    [2200, 2240, 2280, 2320].forEach(d => { b += '<text x="10" y="' + (Y(d) + 5) + '">' + d + '</text><path d="M75 ' + Y(d) + 'H725" stroke="#DCDCD5" stroke-dasharray="3 4"/>'; });
    b += '<path d="' + path(rows, r => Z(r.attributes[0]), r => Y(r.depth)) + '" stroke="' + C.blue + '" fill="none" stroke-width="3"/><path d="' + path(rows, r => R(r.attributes[1]), r => Y(r.depth)) + '" stroke="' + C.blue + '" fill="none" stroke-width="3"/>';
    [[v.data.predictions, C.red, ''], [v.data.baseline, C.blue, ''], [v.data.test.map(r => r.phi), C.gold, 'stroke-dasharray="6 4"']].forEach(([a, color, dash]) => { b += '<path d="' + path(v.ids, i => P(a[i]), i => Y(v.data.test[i].depth)) + '" fill="none" stroke="' + color + '" stroke-width="3" ' + dash + '/>'; });
    b += '<path d="M' + P(v.predictedPhiPct) + ' ' + Y(v.depthM) + 'H' + P(v.referencePhiPct) + '" stroke="' + C.ink + '" stroke-width="3"/>';
    [[Z(v.attributes[0]), C.red], [R(v.attributes[1]), C.red], [P(v.predictedPhiPct), C.red], [P(v.referencePhiPct), C.gold]].forEach(([x, color]) => { b += '<circle cx="' + x + '" cy="' + Y(v.depthM) + '" r="5" fill="' + color + '" stroke="white"/>'; });
    [[92, f(zlo, 1)], [201, f(zhi, 1)], [295, f(rlo, 2)], [400, f(rhi, 2)], [513, f(plo, 0)], [692, f(phi, 0)]].forEach(([x, t]) => { b += '<text x="' + x + '" y="371">' + t + '</text>'; });
    b += '<text x="12" y="27">深度 / m</text><text x="90" y="405">' + 'W' + (7101 + v.well) + '：同一水平线上的三条记录属于同一井段</text><text x="90" y="436" fill="' + C.red + '">朱红：多属性</text><text x="286" y="436" fill="' + C.blue + '">蓝灰：仅阻抗</text><text x="499" y="436" fill="' + C.gold + '">金色虚线：独立井参考</text>';
    return svg(b, '阻抗、速度比与两种孔隙度预测沿共同深度轴排列，选中同一井段', 460);
  }
  function workflowRead(v, source) { return source + '；W' + (7101 + v.well) + '第' + (v.segment + 1) + '段，深度' + v.depthM + ' m。Z=' + f(v.attributes[0]) + '，Vp/Vs=' + f(v.attributes[1]) + '。多属性预测=' + f(v.predictedPhiPct, 2) + '%，仅阻抗预测=' + f(v.baselinePhiPct, 2) + '%；独立井参考=' + f(v.referencePhiPct, 2) + '%，当前段误差=' + f(v.errorPp, 2) + '个百分点。当前λ=' + v.data.lambda + '；统一64段RMSE=' + f(v.data.rmse, 2) + '个百分点。'; }
  function details(v) { return '<p style="font-size:16px">本段预测的实际计算：' + f(v.coefficients[0]) + ' + (' + f(v.coefficients[1]) + ' × ' + f(v.z[0]) + ') + (' + f(v.coefficients[2]) + ' × ' + f(v.z[1]) + ') = ' + f(v.predictedPhiPct) + '%。括号依次为系数×训练尺度标准化后的Z、Vp/Vs；测试井参考值只在预测完成后参与误差计算。噪声参数为Z扰动幅度，Vp/Vs扰动幅度为其0.07倍。</p>'; }
  const bg = backgroundCalc(10.37, 1.795), wf = workflowCalc(.25, 1, 0, 7);
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="s4" data-concept-part="background" style="font-size:18px"><h3>一条阻抗只能画出一条解集合，第二属性怎样补约束？</h3><p>拖动阻抗与速度比，两条约束线在孔隙度—泥质坐标中移动。金线上的不同岩石组合都产生相同阻抗；蓝线提供第二条关系。该图直接求解本页已声明的教学前向关系，暂不加噪声。</p><div class="ct-controls">' + control('目标阻抗Z（本例教学属性值）', 'z', 8.5, 11.8, .01, 10.37) + control('目标Vp/Vs（无量纲）', 'ratio', 1.68, 2.3, .005, 1.795) + reset + '</div><div data-ct-graphic>' + backgroundChart(bg) + '</div><p class="ct-readout" data-ct-result>' + backgroundRead(bg) + '</p><p style="font-size:16px">专业概念沿用本例SEG地震属性与《石油学报》孔隙度反演来源；具体系数是本页教学设定。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="s4" data-concept-part="workflow" style="font-size:18px"><h3>把同一井段的属性、预测与误差沿深度对齐</h3><p>选一口完整留出井，再沿深度移动金色横带。输入属性在左，孔隙度在右；朱红与金色点之间的黑线就是该井段预测误差。改变λ会只用8口训练井重新拟合，然后预测这4口留出井。</p><div class="ct-controls"><label>留出井<select disabled data-ct-input="well"><option value="0">W7101</option><option value="1">W7102</option><option value="2">W7103</option><option value="3">W7104</option></select></label>' + control('井段序号（每段8 m）', 'segment', 1, 16, 1, 8) + '<label>岭回归λ<select disabled data-ct-input="lambda"><option value="0">0</option><option value="0.1">0.1</option><option selected value="1">1</option><option value="10">10</option><option value="100">100</option></select></label>' + control('测试阻抗噪声幅度', 'noise', 0, 2, .05, .25) + '<button disabled type="button" data-ct-action="sync">读取当前示范设置</button>' + reset + '</div><div data-ct-graphic>' + workflowChart(wf) + '</div><p class="ct-readout" data-ct-result>' + workflowRead(wf, '默认固定种子井组') + '</p><div data-ct-details>' + details(wf) + '</div></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
      const q = name => host.querySelector('[data-ct-input="' + name + '"]'); let source = '默认固定种子井组';
      function draw() {
        if (host.dataset.conceptPart === 'background') { const v = backgroundCalc(+q('z').value, +q('ratio').value); host.querySelector('[data-ct-graphic]').innerHTML = backgroundChart(v); host.querySelector('[data-ct-result]').textContent = backgroundRead(v); host.dataset.ctState = JSON.stringify(v); }
        else { const v = workflowCalc(+q('noise').value, +q('lambda').value, +q('well').value, +q('segment').value - 1); host.querySelector('[data-ct-graphic]').innerHTML = workflowChart(v); host.querySelector('[data-ct-result]').textContent = workflowRead(v, source); host.querySelector('[data-ct-details]').innerHTML = details(v); host.dataset.ctState = JSON.stringify({ source, noise: v.data.noise, lambda: v.data.lambda, wellId: 'W' + (7101 + v.well), segment: v.segment + 1, depthM: v.depthM, attributes: v.attributes, standardized: v.z, coefficients: v.coefficients, contributions: v.contributions, predictedPhiPct: v.predictedPhiPct, baselinePhiPct: v.baselinePhiPct, referencePhiPct: v.referencePhiPct, errorPp: v.errorPp, rmse64Pp: v.data.rmse, evaluationSegments: 64 }); }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw); host.addEventListener('click', e => {
        const action = e.target.closest('[data-ct-action]'); if (!action) return;
        if (action.dataset.ctAction === 'reset') { if (q('z')) { q('z').value = 10.37; q('ratio').value = 1.795; } else { q('well').value = 0; q('segment').value = 8; q('lambda').value = 1; q('noise').value = .25; source = '默认固定种子井组'; } }
        else { const snap = g.CaseInspect && g.CaseInspect.snapshot(); if (snap && snap.sceneId === scene && snap.computed && !snap.stale) { q('noise').value = snap.options.noise; q('lambda').value = snap.options.lambda; q('well').value = Math.max(0, Math.min(3, Number(String(snap.selectedWell || 'W7101').slice(1)) - 7101)); source = '当前示范设置，相同固定种子重算'; } else source = '主示范尚无当前有效结果，保留本图设置'; }
        draw();
      }); draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 1, workflowAfter: 3, backgroundHTML, workflowHTML, mount };
})(globalThis);
