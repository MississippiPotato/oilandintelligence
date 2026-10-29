(function (g) {
  'use strict';
  const scene = 's5', C = { red: '#B8242A', paper: '#F7F4EF', blue: '#55768B', gold: '#B08A4A', ink: '#263D48' }, types = { random: '随机噪声', coherent: '相干干扰', spikes: '脉冲尖峰' };
  const f = (v, n = 3) => Number(v).toFixed(n), mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const path = (a, X, Y) => a.map((v, i) => (i ? 'L' : 'M') + f(X(i), 1) + ',' + f(Y(v), 1)).join('');
  function rng(s) { return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  // Same fixed-seed observation generator as S5Core; separate spike RNG keeps clean signals identical across noise types.
  function gather(noise, type, seed = 1901) {
    const r = rng(seed), spike = rng(seed + 99991), reference = [], noisy = [];
    for (let j = 0; j < 12; j++) { const clean = [], a = [];
      for (let t = 0; t < 160; t++) { let v = 0; for (let z = 0; z < 3; z++) { const u = (t - (35 + z * 37 + j * .6 + (r() - .5) * .08)) / 3.5; v += (1 - 2 * u * u) * Math.exp(-u * u) * (1 - .15 * z); }
        let n = noise * (r() + r() + r() - 1.5); if (type === 'coherent') n += noise * .7 * Math.sin(t * .18 + j * .08); if (type === 'spikes' && spike() < .015) n += noise * 6 * (spike() > .5 ? 1 : -1); clean.push(v); a.push(v + n);
      } reference.push(clean); noisy.push(a);
    } return { noisy, reference, params: { noise, type, seed }, dtMs: 4 };
  }
  // Actual coefficients from this case's current 6-gather, 5616-window ridge fit (lambda 0.4).
  const weights = [-.0005884954850198275, .004165853610408561, .18667954744830043, .22368706186741022, .18493022661281766, .006126930266463545, .2112085426918092, .20795316173473916];
  function predict(noisy) { return noisy.map((a, j) => a.map((_, t) => { const x = [1, ...[-2, -1, 0, 1, 2].map(k => a[Math.max(0, Math.min(159, t + k))]), noisy[Math.max(0, j - 1)][t], noisy[Math.min(11, j + 1)][t]]; return x.reduce((s, v, k) => s + v * weights[k], 0); })); }
  function run(noise, type) { const d = gather(noise, type); d.prediction = predict(d.noisy); d.baselineTraces = d.noisy.map(a => a.map((_, t) => mean(a.slice(Math.max(0, t - 2), Math.min(160, t + 3))))); return d; }
  function corr(a, b) { const ma = mean(a), mb = mean(b); let n = 0, aa = 0, bb = 0; a.forEach((v, i) => { const x = v - ma, y = b[i] - mb; n += x * y; aa += x * x; bb += y * y; }); return aa * bb > 1e-12 ? n / Math.sqrt(aa * bb) : null; }
  function spectrum(a) { return Array.from({ length: 81 }, (_, k) => { let re = 0, im = 0; a.forEach((v, t) => { re += v * Math.cos(2 * Math.PI * k * t / 160); im -= v * Math.sin(2 * Math.PI * k * t / 160); }); return Math.hypot(re, im) / 160 * (k === 0 || k === 80 ? 1 : 2); }); }
  function svg(body, label, h = 410) { return '<div class="ct-chart" style="overflow-x:auto"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="display:block;width:100%;height:auto;min-width:760px;background:' + C.paper + ';font:16px system-ui,Microsoft YaHei,sans-serif"><g fill="' + C.ink + '">' + body + '</g></svg></div>'; }
  function control(label, name, min, max, step, value) { return '<label>' + label + '<input disabled type="range" data-ct-input="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const reset = '<button disabled type="button" data-ct-action="reset">复位本图</button>';
  function backgroundCalc(trace, noise, type) {
    const data = gather(noise, type), disturbance = data.noisy.map((a, j) => a.map((v, t) => v - data.reference[j][t])), neighbor = trace === 11 ? 10 : trace + 1, sSignal = spectrum(data.reference[trace]), sNoise = spectrum(disturbance[trace]), peak = sNoise.reduce((p, v, i) => v > sNoise[p] ? i : p, 0);
    return { data, trace, noise, type, disturbance, neighbor, sSignal, sNoise, noisePeakHz: noise > 0 ? peak / .64 : null, noiseRms: Math.sqrt(mean(disturbance[trace].map(v => v * v))), adjacentNoiseCorrelation: corr(disturbance[trace], disturbance[neighbor]) };
  }
  function backgroundChart(v) {
    const raw = v.data.noisy[v.trace], ref = v.data.reference[v.trace], noise = v.disturbance[v.trace], lim = Math.max(1.1, ...raw.concat(ref, noise).map(Math.abs)), X = t => 65 + t / 159 * 376, Y = a => 176 - a / lim * 116, SX = k => 509 + k / 80 * 210, peak = Math.max(.01, ...v.sSignal, ...v.sNoise), SY = a => 292 - a / peak * 232;
    let b = '<text x="65" y="27" font-size="18">同一道：记录 = 反射 + 干扰</text><text x="509" y="27" font-size="18">实际离散振幅谱</text><path d="M65 60V292H441M65 176H441M509 60V292H719" fill="none" stroke="#A1ADAF"/>';
    [[raw, C.red], [ref, C.blue], [noise, C.gold]].forEach(([a, color]) => { b += '<path d="' + path(a, X, Y) + '" fill="none" stroke="' + color + '" stroke-width="2.2"/>'; });
    [[v.sSignal, C.blue], [v.sNoise, C.gold]].forEach(([a, color]) => { b += '<path d="' + path(a, SX, SY) + '" fill="none" stroke="' + color + '" stroke-width="3"/>'; });
    b += '<text x="13" y="65">+' + f(lim, 1) + '</text><text x="13" y="181">0</text><text x="13" y="292">−' + f(lim, 1) + '</text><text x="451" y="65">' + f(peak, 3) + '</text><text x="478" y="296">0</text>';
    [0, 80, 159].forEach(t => { b += '<text x="' + (X(t) - 10) + '" y="321">' + t * 4 + '</text>'; });
    [0, 40, 80].forEach(k => { b += '<text x="' + (SX(k) - 13) + '" y="321">' + k / .64 + '</text>'; });
    b += '<text x="178" y="350">记录时间 / ms →</text><text x="561" y="350">频率 / Hz →</text><text x="65" y="385" fill="' + C.red + '">朱红：带噪记录</text><text x="285" y="385" fill="' + C.blue + '">蓝灰：干净教学反射</text><text x="543" y="385" fill="' + C.gold + '">赭金：叠加干扰</text>';
    return svg(b, '同一真实合成地震道的反射、噪声和相加记录，以及由相同数组计算的频谱');
  }
  function backgroundRead(v) { return types[v.type] + '，幅度参数' + f(v.noise, 2) + '，第' + (v.trace + 1) + '道干扰RMS=' + f(v.noiseRms) + '。干扰谱最高离散频点=' + (v.noisePeakHz === null ? '不适用' : f(v.noisePeakHz, 2) + ' Hz') + '；它与第' + (v.neighbor + 1) + '道干扰的零移位相关=' + (v.adjacentNoiseCorrelation === null ? '不适用（无干扰能量）' : f(v.adjacentNoiseCorrelation)) + '。频谱由160点、4 ms间隔的完整记录直接DFT得到，频点间距1.5625 Hz。切换干扰类型时干净反射数组相同。'; }
  const defaultData = run(.25, 'random');
  function workflowCalc(data, trace, center, method) {
    const all = method === 'ridge' ? data.prediction : data.baselineTraces, processed = all[trace], raw = data.noisy[trace], ref = data.reference[trace], removed = raw.map((v, t) => v - processed[t]), start = Math.max(0, center - 16), end = Math.min(159, center + 16), r = removed.slice(start, end + 1), target = ref.slice(start, end + 1), errors = processed.slice(start, end + 1).map((v, i) => v - target[i]);
    let totalError = 0; all.forEach((a, j) => a.forEach((v, t) => totalError += (v - data.reference[j][t]) ** 2));
    return { trace, center, method, raw, processed, ref, removed, start, end, windowCount: end - start + 1, windowRmse: Math.sqrt(mean(errors.map(v => v * v))), removedReferenceCorrelation: corr(r, target), removedRms: Math.sqrt(mean(r.map(v => v * v))), totalRmse: Math.sqrt(totalError / 1920), totalCount: 1920, centerValues: { raw: raw[center], processed: processed[center], removed: removed[center], reference: ref[center] } };
  }
  function workflowChart(v) {
    const raw = v.raw.slice(v.start, v.end + 1), proc = v.processed.slice(v.start, v.end + 1), ref = v.ref.slice(v.start, v.end + 1), rem = v.removed.slice(v.start, v.end + 1), lim = Math.max(.25, ...raw.concat(proc, ref, rem).map(Math.abs)) * 1.06, X = k => 78 + k / (v.end - v.start) * 642, Y = a => 111 - a / lim * 63, R = a => 292 - a / lim * 63;
    let b = '<text x="78" y="27" font-size="18">第' + (v.trace + 1) + '道：同窗输入、处理结果与参考</text><path d="M78 45V178H720M78 111H720M78 225V358H720M78 292H720" fill="none" stroke="#A1ADAF"/>';
    [[raw, '#8E9697', ''], [proc, C.red, ''], [ref, C.gold, 'stroke-dasharray="6 4"']].forEach(([a, color, dash]) => { b += '<path d="' + path(a, X, Y) + '" fill="none" stroke="' + color + '" stroke-width="3" ' + dash + '/>'; });
    b += '<text x="78" y="212" font-size="18">移除分量 = 输入 − 处理；与干净反射共用振幅范围</text><path d="' + path(rem, X, R) + '" fill="none" stroke="' + C.red + '" stroke-width="3"/><path d="' + path(ref, X, R) + '" fill="none" stroke="' + C.gold + '" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M' + X(v.center - v.start) + ' 45V358" stroke="' + C.blue + '" stroke-width="2" stroke-dasharray="3 4"/>';
    [0, Math.floor((v.end - v.start) / 2), v.end - v.start].forEach(k => { b += '<text x="' + (X(k) - 16) + '" y="385">' + (v.start + k) * 4 + '</text>'; });
    b += '<text x="11" y="54">+' + f(lim, 1) + '</text><text x="11" y="176">−' + f(lim, 1) + '</text><text x="11" y="235">+' + f(lim, 1) + '</text><text x="11" y="357">−' + f(lim, 1) + '</text><text x="78" y="419" fill="' + C.gold + '">金色虚线：独立干净参考</text><text x="450" y="419">共同记录时间 / ms →</text>';
    return svg(b, '选择真实道与时间窗，输入处理结果移除分量和独立参考沿同一时间坐标对比', 440);
  }
  function workflowRead(data, v, source) { const n = v.centerValues; return source + '；' + types[data.params.type] + '，第' + (v.trace + 1) + '道，' + v.start * 4 + '–' + v.end * 4 + ' ms，共' + v.windowCount + '点。' + (v.method === 'ridge' ? '训练好的邻域岭回归' : '5点滑动平均') + '在中心' + v.center * 4 + ' ms的实际分解：' + f(n.raw) + ' = ' + f(n.processed) + ' + ' + f(n.removed) + '。本窗RMSE=' + f(v.windowRmse) + '；移除分量与参考相关=' + (v.removedReferenceCorrelation === null ? '不适用' : f(v.removedReferenceCorrelation)) + '。完整12×160点RMSE=' + f(v.totalRmse) + '。相关只帮助定位需检查的波瓣，仍需同时观察上下两图。'; }
  const bg = backgroundCalc(5, .25, 'random'), wf = workflowCalc(defaultData, 5, 75, 'ridge');
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="s5" data-concept-part="background" style="font-size:18px"><h3>改变的是反射，还是叠加干扰的频率与道间关系？</h3><p>选择同一道，切换随机、相干或尖峰干扰。左图的三条数组严格满足“记录=反射+干扰”；右图从同一批数组计算离散频谱，帮助识别干扰是散布在频带中，还是集中在少数频点。</p><div class="ct-controls"><label>叠加干扰<select disabled data-ct-input="type"><option value="random">随机噪声</option><option value="coherent">相干干扰</option><option value="spikes">脉冲尖峰</option></select></label>' + control('干扰幅度参数', 'noise', 0, .6, .01, .25) + control('选择道号', 'trace', 1, 12, 1, 6) + reset + '</div><div data-ct-graphic>' + backgroundChart(bg) + '</div><p class="ct-readout" data-ct-result>' + backgroundRead(bg) + '</p><p style="font-size:16px">沿用本例SLB Seismic processing来源与三种教学噪声定义；频谱由本地数组计算，不引入现场频率或新测区数据。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="s5" data-concept-part="workflow" style="font-size:18px"><h3>移除量里是否还留着一整个反射波瓣？</h3><p>选道并移动局部时间窗，上图检查处理后反射，下图检查被移除部分。两图使用相同的时间和振幅比例。切换岭回归与5点平均，直接比较同一段反射的削弱程度；参考只在结果生成后用于检查。</p><div class="ct-controls">' + control('选择道号', 'trace', 1, 12, 1, 6) + control('时间窗中心 / ms（每点4 ms）', 'time', 64, 572, 4, 300) + '<label>处理方法<select disabled data-ct-input="method"><option value="ridge">邻域岭回归</option><option value="mean">5点滑动平均</option></select></label><button disabled type="button" data-ct-action="sync">读取当前示范炮集</button>' + reset + '</div><div data-ct-graphic>' + workflowChart(wf) + '</div><p class="ct-readout" data-ct-result>' + workflowRead(defaultData, wf, '默认炮集1901') + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
      const q = name => host.querySelector('[data-ct-input="' + name + '"]'); let data = defaultData, source = '默认炮集1901';
      function draw() {
        if (host.dataset.conceptPart === 'background') { const v = backgroundCalc(+q('trace').value - 1, +q('noise').value, q('type').value); host.querySelector('[data-ct-graphic]').innerHTML = backgroundChart(v); host.querySelector('[data-ct-result]').textContent = backgroundRead(v); host.dataset.ctState = JSON.stringify({ trace: v.trace + 1, noise: v.noise, type: v.type, noiseRms: v.noiseRms, noisePeakHz: v.noisePeakHz, neighborTrace: v.neighbor + 1, adjacentNoiseCorrelation: v.adjacentNoiseCorrelation, frequencyStepHz: 1.5625, signalSpectrum: v.sSignal, noiseSpectrum: v.sNoise }); }
        else { const v = workflowCalc(data, +q('trace').value - 1, Math.round(+q('time').value / 4), q('method').value); host.querySelector('[data-ct-graphic]').innerHTML = workflowChart(v); host.querySelector('[data-ct-result]').textContent = workflowRead(data, v, source); host.dataset.ctState = JSON.stringify({ source, params: data.params, trace: v.trace + 1, centerMs: v.center * 4, method: v.method, windowStartMs: v.start * 4, windowEndMs: v.end * 4, windowCount: v.windowCount, centerValues: v.centerValues, windowRmse: v.windowRmse, removedReferenceCorrelation: v.removedReferenceCorrelation, removedRms: v.removedRms, totalRmse: v.totalRmse, totalCount: v.totalCount, removedWindow: v.removed.slice(v.start, v.end + 1), processedWindow: v.processed.slice(v.start, v.end + 1) }); }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw); host.addEventListener('click', e => {
        const action = e.target.closest('[data-ct-action]'); if (!action) return;
        if (action.dataset.ctAction === 'reset') { if (q('type')) { q('type').value = 'random'; q('noise').value = .25; q('trace').value = 6; } else { data = defaultData; source = '默认炮集1901'; q('trace').value = 6; q('time').value = 300; q('method').value = 'ridge'; } }
        else { const snap = g.CaseInspect && g.CaseInspect.snapshot(); if (snap && snap.sceneId === scene && snap.status === 'ready' && snap.result && snap.result.prediction) { data = snap.result; q('trace').value = Number(snap.selected || 0) + 1; source = '当前示范炮集' + data.params.seed; } else source = '当前示范尚无有效结果，保留本图炮集'; }
        draw();
      }); draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 0, workflowAfter: 2, backgroundHTML, workflowHTML, mount };
})(globalThis);
