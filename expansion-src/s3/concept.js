(function (g) {
  'use strict';
  const scene = 's3', C = { red: '#B8242A', paper: '#F7F4EF', blue: '#55768B', gold: '#B08A4A', ink: '#263D48' };
  const f = (v, n = 3) => Number(v).toFixed(n), mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const path = (a, X, Y) => a.map((v, i) => (i ? 'L' : 'M') + f(X(i), 1) + ',' + f(Y(v), 1)).join('');
  function rng(s) { return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  // Same forward observation as S3Core.gather. Reference onset is used only for teaching/evaluation.
  function gather(weak = .55, noise = .14, seed = 2209) {
    const r = rng(seed), traces = [], reference = [];
    for (let j = 0; j < 18; j++) { const onset = 34 + j * 2 + Math.round(r() * 4), a = []; reference.push(onset);
      for (let t = 0; t < 180; t++) { const u = t - onset, signal = u >= 0 ? (1 - Math.exp(-u / 4)) * Math.sin(u * .6) * Math.exp(-u / 65) * (j % 6 === 0 ? weak : 1) : 0; a.push(signal + noise * (r() + r() + r() - 1.5) + (j === 8 && t === 22 ? noise * 4 : 0)); }
      traces.push(a);
    } return { traces, reference, dtMs: 2, traceSpacingM: 15, params: { weak, noise, seed, threshold: .55 } };
  }
  // Coefficients copied from the current existing engine's real 7-gather, 5040-window fit.
  const fit = { w: [1.37722475236881, -.7928854697026779, 1.240502183411478, .4289461180659533, 1.487257710621586], mu: [.13664064257261765, .09705301854565258, .16342067473531469, .09420256822439571], sd: [.9230335944705936, .09796105663262857, .1332619979240025, .09014107970687624] };
  function attributes(traces, j, t) {
    const a = traces[j], power = (lo, hi) => { let s = 0, n = 0; for (let k = Math.max(0, lo); k <= Math.min(a.length - 1, hi); k++) { s += a[k] * a[k]; n++; } return s / n; };
    const future = power(t, t + 8), past = power(t - 16, t - 1); let neighbor = 0;
    for (let q = Math.max(0, j - 1); q <= Math.min(traces.length - 1, j + 1); q++) for (let k = t; k <= t + 6; k++) neighbor += traces[q][k] * traces[q][k] / 21;
    return [Math.log((future + .002) / (past + .002)), future, Math.abs(a[t] - a[t - 1]), neighbor];
  }
  function score(traces, model) { return traces.map((a, j) => a.map((_, t) => { if (t < 16 || t > 164) return 0; const x = attributes(traces, j, t), z = model.w[0] + x.reduce((s, v, k) => s + (v - model.mu[k]) / model.sd[k] * model.w[k + 1], 0); return 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, z)))); })); }
  function pick(scores, threshold) { return scores.map(a => { for (let t = 16; t < 145; t++) if (a[t] >= threshold && a[t + 1] >= threshold && a[t + 2] >= threshold) return t; return null; }); }
  function baseline(traces) { return traces.map(a => { for (let t = 18; t < 160; t++) if (mean(a.slice(t, t + 6).map(v => v * v)) / (mean(a.slice(t - 18, t).map(v => v * v)) + .001) > 4) return t; return null; }); }
  const defaultData = gather(); defaultData.scores = score(defaultData.traces, fit); defaultData.baselinePicks = baseline(defaultData.traces);
  function svg(body, label, h = 410) { return '<div class="ct-chart" style="overflow-x:auto"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="display:block;width:100%;height:auto;min-width:760px;background:' + C.paper + ';font:16px system-ui,Microsoft YaHei,sans-serif"><g fill="' + C.ink + '">' + body + '</g></svg></div>'; }
  function control(label, name, min, max, step, value) { return '<label>' + label + '<input disabled type="range" data-ct-input="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const reset = '<button disabled type="button" data-ct-action="reset">复位本图</button>';
  function backgroundCalc(trace, weak) {
    const data = gather(weak), a = data.traces[trace], peak = a.reduce((i, v, t) => Math.abs(v) > Math.abs(a[i]) ? t : i, 0);
    return { data, trace, weak, peak, onset: data.reference[trace], maxAmplitude: a[peak] };
  }
  function backgroundChart(v) {
    const Y = t => 53 + t / 179 * 260, WX = t => 445 + t / 179 * 275, lim = Math.max(1, ...v.data.traces[v.trace].map(Math.abs)), WY = a => 182 - a / lim * 112;
    let b = '<text x="58" y="27" font-size="18">炮集：18条记录按道号排列</text><text x="445" y="27" font-size="18">同一条道，展开时间轴</text>';
    v.data.traces.forEach((a, j) => { const x = 62 + j * 18, X = t => x + a[t] * 9; b += '<path d="' + a.map((_, t) => (t ? 'L' : 'M') + f(X(t), 1) + ',' + f(Y(t), 1)).join('') + '" fill="none" stroke="' + (j === v.trace ? C.red : C.blue) + '" stroke-width="' + (j === v.trace ? 2.5 : 1) + '" opacity="' + (j === v.trace ? 1 : .5) + '"/>'; if (j % 3 === 0 || j === v.trace) b += '<text x="' + (x - 5) + '" y="340" fill="' + (j === v.trace ? C.red : C.ink) + '">' + (j + 1) + '</text>'; });
    b += '<circle cx="' + (62 + v.trace * 18) + '" cy="' + Y(v.onset) + '" r="6" fill="' + C.gold + '"/><path d="M445 55V302H720M445 182H720" fill="none" stroke="#A6B0B0"/><path d="' + path(v.data.traces[v.trace], WX, WY) + '" fill="none" stroke="' + C.blue + '" stroke-width="2.5"/>';
    b += '<path d="M' + WX(v.onset) + ' 55V302" stroke="' + C.gold + '" stroke-width="3" stroke-dasharray="6 5"/><circle cx="' + WX(v.peak) + '" cy="' + WY(v.maxAmplitude) + '" r="6" fill="' + C.red + '"/>';
    [0, 90, 179].forEach(t => { b += '<text x="12" y="' + (Y(t) + 5) + '">' + t * 2 + '</text><text x="' + (WX(t) - 10) + '" y="330">' + t * 2 + '</text>'; });
    b += '<text x="76" y="369">道号 →；时间 / ms 向下</text><text x="506" y="362">记录时间 / ms →</text><text x="58" y="400" fill="' + C.gold + '">金色：生成器参考起点</text><text x="418" y="400" fill="' + C.red + '">朱红点：全道最大绝对振幅位置</text>';
    return svg(b, '选中道在18道炮集和单道时间轴上同时定位，对照初至参考和最大波峰');
  }
  function backgroundRead(v) { return '第' + (v.trace + 1) + '道，距第一道' + v.trace * 15 + ' m；生成器参考起点' + v.onset * 2 + ' ms，最大绝对振幅位于' + v.peak * 2 + ' ms（振幅' + f(v.maxAmplitude) + '），相差' + (v.peak - v.onset) * 2 + ' ms。第1、7、13道的有效信号乘数为' + f(v.weak, 2) + '。初至寻找可辨认的到达起点，最大振幅的位置回答另一个问题。'; }
  function workflowCalc(data, trace, threshold) {
    const picks = pick(data.scores, threshold), t = picks[trace], base = data.baselinePicks[trace], ref = data.reference[trace], valid = picks.filter(p => p !== null).length;
    const errors = picks.map((p, j) => p === null ? null : (p - data.reference[j]) * 2), hit = errors.filter(e => e !== null && Math.abs(e) <= 10).length;
    return { trace, threshold, pickSample: t, pickMs: t === null ? null : t * 2, confirmedAtMs: t === null ? null : (t + 2) * 2, triple: t === null ? [] : data.scores[trace].slice(t, t + 3), baselineMs: base === null ? null : base * 2, referenceMs: ref * 2, errorMs: t === null ? null : (t - ref) * 2, missed: 18 - valid, hits: hit, total: 18, maeMs: valid ? mean(errors.filter(e => e !== null).map(Math.abs)) : null, picks };
  }
  function workflowChart(data, v) {
    const a = data.traces[v.trace], scores = data.scores[v.trace], X = t => 78 + t / 179 * 641, lim = Math.max(1, ...a.map(Math.abs)), Y = a => 111 - a / lim * 63, P = p => 345 - p * 135;
    let b = '<text x="78" y="27" font-size="18">第' + (v.trace + 1) + '道振幅；先看起跳与尖峰</text><path d="M78 43V179H719M78 111H719M78 210V345H719" fill="none" stroke="#A6B0B0"/><path d="' + path(a, X, Y) + '" fill="none" stroke="' + C.blue + '" stroke-width="2.5"/>';
    b += '<text x="78" y="203" font-size="18">学习支持度：找首个连续3点达到阈值</text><path d="' + path(scores, X, P) + '" fill="none" stroke="' + C.red + '" stroke-width="2.5"/><path d="M78 ' + P(v.threshold) + 'H719" stroke="' + C.gold + '" stroke-width="2" stroke-dasharray="6 4"/>';
    b += '<text x="10" y="218">1.0</text><text x="10" y="350">0.0</text><text x="650" y="' + (P(v.threshold) + (v.threshold > .8 ? 22 : -8)) + '">' + f(v.threshold, 2) + '</text>';
    b += '<path d="M' + X(v.referenceMs / 2) + ' 43V179" stroke="' + C.gold + '" stroke-width="2" stroke-dasharray="5 4"/>';
    if (v.baselineMs !== null) b += '<path d="M' + X(v.baselineMs / 2) + ' 46V176" stroke="#80748C" stroke-width="2" stroke-dasharray="3 4"/>';
    if (v.pickSample !== null) { b += '<path d="M' + X(v.pickSample) + ' 43V345" stroke="' + C.red + '" stroke-width="2"/>'; v.triple.forEach((p, k) => { b += '<circle cx="' + X(v.pickSample + k) + '" cy="' + P(p) + '" r="5" fill="' + C.gold + '" stroke="' + C.red + '"/>'; }); }
    [0, 45, 90, 135, 179].forEach(t => { b += '<text x="' + (X(t) - 11) + '" y="372">' + t * 2 + '</text>'; });
    b += '<text x="555" y="399">共同时间轴 / ms →</text><text x="78" y="399" fill="' + C.red + '">朱红竖线：候选第1点</text><text x="312" y="399" fill="' + C.gold + '">3个圆点：连续确认</text>';
    return svg(b, '波形与支持度共用时间轴，阈值改变首个连续三点触发位置');
  }
  function workflowRead(v, source) { return source + '；第' + (v.trace + 1) + '道，阈值' + f(v.threshold, 2) + '。' + (v.pickMs === null ? '搜索区间内没有连续3点达到阈值，保留漏拾。' : '候选定位于' + v.pickMs + ' ms，读到' + v.confirmedAtMs + ' ms时确认；这3点支持度为[' + v.triple.map(p => f(p)).join('，') + ']。') + '独立参考' + v.referenceMs + ' ms；原STA/LTA为' + (v.baselineMs === null ? '漏拾' : v.baselineMs + ' ms') + '。当前阈值下±10 ms命中' + v.hits + '/18，漏拾' + v.missed + '/18；MAE=' + (v.maeMs === null ? '不适用' : f(v.maeMs, 2) + ' ms') + '（仅已拾取道）。'; }
  const bg = backgroundCalc(0, .55), wf = workflowCalc(defaultData, 8, .55);
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="s3" data-concept-part="background" style="font-size:18px"><h3>同一条地震道，初至与最大波峰相隔多久？</h3><p>左图18道炮集的时间向下；选择一条道，右图把它放到水平时间轴。采样2 ms、道间距15 m。拖弱道振幅时，同一生成起点保持不变，能够看清的波形却会改变。</p><div class="ct-controls">' + control('选择道号', 'trace', 1, 18, 1, 1) + control('每6道中的弱道有效信号乘数', 'weak', .1, 1, .05, .55) + reset + '</div><div data-ct-graphic>' + backgroundChart(bg) + '</div><p class="ct-readout" data-ct-result>' + backgroundRead(bg) + '</p><p style="font-size:16px">沿用SEG First breaks的初至概念；金色点是教学生成器保留的参考起点，并非幅度阈值的自动输出。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="s3" data-concept-part="workflow" style="font-size:18px"><h3>把“连续3点触发”放回真实波形上</h3><p>默认第9道在44 ms附近含噪声脉冲。改变阈值，观察单个尖峰是否触发、首个连续段在哪里、弱道是否漏拾。前向特征和连续确认读取未来采样，这是一段离线拾取计算。</p><div class="ct-controls">' + control('选择道号', 'trace', 1, 18, 1, 9) + control('学习支持度阈值', 'threshold', .05, .95, .01, .55) + '<button disabled type="button" data-ct-action="sync">读取当前示范炮集</button>' + reset + '</div><div data-ct-graphic>' + workflowChart(defaultData, wf) + '</div><p class="ct-readout" data-ct-result>' + workflowRead(wf, '默认炮集2209') + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
      const q = name => host.querySelector('[data-ct-input="' + name + '"]'); let data = defaultData, source = '默认炮集2209';
      function draw() {
        if (host.dataset.conceptPart === 'background') { const v = backgroundCalc(+q('trace').value - 1, +q('weak').value); host.querySelector('[data-ct-graphic]').innerHTML = backgroundChart(v); host.querySelector('[data-ct-result]').textContent = backgroundRead(v); host.dataset.ctState = JSON.stringify({ trace: v.trace + 1, weak: v.weak, onsetMs: v.onset * 2, maxAbsAmplitudeMs: v.peak * 2, maxAmplitude: v.maxAmplitude, distanceM: v.trace * 15, selectedWaveform: v.data.traces[v.trace] }); }
        else { const v = workflowCalc(data, +q('trace').value - 1, +q('threshold').value); host.querySelector('[data-ct-graphic]').innerHTML = workflowChart(data, v); host.querySelector('[data-ct-result]').textContent = workflowRead(v, source); host.dataset.ctState = JSON.stringify({ source, ...v }); }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw); host.addEventListener('click', e => {
        const action = e.target.closest('[data-ct-action]'); if (!action) return;
        if (action.dataset.ctAction === 'reset') { if (q('weak')) { q('trace').value = 1; q('weak').value = .55; } else { data = defaultData; source = '默认炮集2209'; q('trace').value = 9; q('threshold').value = .55; } }
        else { const snap = g.CaseInspect && g.CaseInspect.snapshot(); if (snap && snap.sceneId === scene && snap.status === 'ready' && snap.result && snap.result.scores) { data = snap.result; q('trace').value = Number(snap.selected || 0) + 1; q('threshold').value = data.params.threshold; source = '当前示范炮集' + data.params.seed; } else source = '当前示范尚无有效结果，保留本图炮集'; }
        draw();
      }); draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 0, workflowAfter: 2, backgroundHTML, workflowHTML, mount };
})(globalThis);
