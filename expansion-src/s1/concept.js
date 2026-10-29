(function (g) {
  'use strict';
  const scene = 's1', C = { red: '#B8242A', paper: '#F7F4EF', blue: '#55768B', gold: '#B08A4A', ink: '#263D48' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const f = (v, n = 3) => Number(v).toFixed(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const path = (a, X, Y) => a.map((v, i) => (i ? 'L' : 'M') + f(X(i), 1) + ',' + f(Y(v), 1)).join('');
  function corr(a, b) {
    const ma = mean(a), mb = mean(b); let n = 0, aa = 0, bb = 0;
    a.forEach((v, i) => { const x = v - ma, y = b[i] - mb; n += x * y; aa += x * x; bb += y * y; });
    return aa * bb > 1e-9 ? clamp(n / Math.sqrt(aa * bb), -1, 1) : 0;
  }
  function svg(body, label, h = 370) {
    return '<div class="ct-chart" style="overflow-x:auto"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + esc(label) + '" style="display:block;width:100%;height:auto;min-width:760px;background:' + C.paper + ';font:16px system-ui,Microsoft YaHei,sans-serif;color:' + C.ink + '"><g fill="' + C.ink + '">' + body + '</g></svg></div>';
  }
  function reset() { return '<button disabled type="button" data-ct-action="reset">复位本图</button>'; }
  function control(label, name, min, max, step, value) { return '<label>' + label + '<input disabled type="range" data-ct-input="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  function backgroundCalc(shift, noise) {
    const wave = t => { const u = (t - 14) / 1.3; return (1 - 2 * u * u) * Math.exp(-u * u); };
    const left = Array.from({ length: 37 }, (_, t) => wave(t) + noise * Math.sin(t * 2.91 + .3));
    const right = Array.from({ length: 37 }, (_, t) => wave(t - shift) + noise * Math.sin(t * 2.13 + 1.4));
    const a = left.slice(10, 19), c0 = corr(a, right.slice(10, 19));
    const curve = Array.from({ length: 17 }, (_, i) => ({ lag: i - 8, value: corr(a, Array.from({ length: 9 }, (_, k) => right[10 + k + i - 8])) }));
    const best = curve.reduce((p, v) => v.value > p.value ? v : p);
    return { shiftSamples: shift, shiftMs: shift * 4, noise, left, right, correlation: c0, discontinuity: (1 - c0) / 2, curve, bestLagMs: best.lag * 4, bestCorrelation: best.value };
  }
  function backgroundChart(v) {
    const X = i => 64 + i / 36 * 400, Y = a => 156 - a * 80, Xc = i => 535 + i / 16 * 185, Yc = a => 244 - (a + 1) / 2 * 183;
    let b = '<text x="64" y="27" font-size="18">同一时间轴：先看峰谷是否对齐</text><text x="535" y="27" font-size="18">试移位后的相关</text>';
    b += '<rect x="' + X(10) + '" y="52" width="' + (X(18) - X(10)) + '" height="205" fill="' + C.gold + '" opacity=".13"/><path d="M64 52V257H464M535 61V244H720" fill="none" stroke="#8A969B"/>';
    [-1, 0, 1].forEach(t => { b += '<text x="24" y="' + (Y(t) + 5) + '">' + t + '</text><path d="M64 ' + Y(t) + 'H464" stroke="#DAD9D3"/>'; });
    b += '<path d="' + path(v.left, X, Y) + '" fill="none" stroke="' + C.blue + '" stroke-width="3"/><path d="' + path(v.right, X, Y) + '" fill="none" stroke="' + C.red + '" stroke-width="3"/>';
    b += '<path d="' + path(v.curve.map(p => p.value), Xc, Yc) + '" fill="none" stroke="' + C.gold + '" stroke-width="3"/>';
    const k = v.curve.findIndex(p => p.lag * 4 === v.bestLagMs);
    b += '<circle cx="' + Xc(k) + '" cy="' + Yc(v.bestCorrelation) + '" r="6" fill="' + C.red + '"/>';
    [0, 72, 144].forEach(t => { b += '<text x="' + (X(t / 4) - 12) + '" y="280">' + t + '</text>'; });
    [-32, 0, 32].forEach(t => { b += '<text x="' + (Xc((t + 32) / 4) - 14) + '" y="270">' + t + '</text>'; });
    b += '<text x="180" y="307">相对时间 / ms</text><text x="552" y="301">右道取样移位 / ms</text><text x="64" y="340" fill="' + C.blue + '">蓝灰：左侧波形</text><text x="256" y="340" fill="' + C.red + '">朱红：右侧波形</text><text x="500" y="340">金色窗：9个采样点</text>';
    return svg(b, '反射时间位移改变左右道波形相关，右侧展示实际移位相关曲线');
  }
  function backgroundRead(v) { return '右侧反射延后 ' + v.shiftMs + ' ms（' + v.shiftSamples + ' 个采样点）；9点窗零移位相关 r=' + f(v.correlation) + '，不连续性 D=(1−r)/2=' + f(v.discontinuity) + '。尝试移位后，最大相关 ' + f(v.bestCorrelation) + ' 出现在 ' + v.bestLagMs + ' ms。位移用双程时间表达，不能直接作为地层垂直断距。'; }
  // Exact observation generator from this case's S1Core.generate; evaluation labels are deliberately absent.
  function observations(seed = 2029) {
    let s = seed >>> 0; const r = () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
    const w = 84, h = 72, phase = r() * 6.28, slope = (r() - .5) * .4, center = w * (.43 + r() * .15), tilt = (r() - .5) * .24;
    const reflectors = Array.from({ length: 8 }, (_, i) => ({ y: 4 + i * 9 + r() * 3, amp: (r() < .5 ? -1 : 1) * (.65 + r() * .45) })), amplitude = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0; reflectors.forEach((q, i) => { const u = (y - (q.y + .035 * slope * x + 1.7 * Math.sin(x / 20 + phase + i * .13) + (x > center + tilt * (y - h / 2) ? 6 : 0))) / 1.3; v += q.amp * (1 - 2 * u * u) * Math.exp(-u * u); });
      amplitude.push(v + (r() + r() + r() - 1.5) * .1 * 1.6);
    }
    return { w, h, amplitude, missing: Array(w * h).fill(0), sampleInterval_ms: 4, startTime_ms: 800, traceSpacing_m: 25, groupId: '剖面-2029' };
  }
  const defaultObs = observations();
  function local(obs, x, y) {
    const at = (xx, yy) => obs.amplitude[clamp(yy, 0, obs.h - 1) * obs.w + clamp(xx, 0, obs.w - 1)];
    const left = Array.from({ length: 9 }, (_, k) => at(x - 2, y + k - 4)), right = Array.from({ length: 9 }, (_, k) => at(x + 2, y + k - 4));
    const correlation = corr(left, right), lags = [-4, -2, 2, 4].map(lag => ({ lag, value: corr(left, Array.from({ length: 9 }, (_, k) => at(x + 2, y + k - 4 + lag))) }));
    const best = lags.reduce((a, b) => a.value > b.value ? a : b); let missing = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) missing += obs.missing[clamp(y + dy, 0, obs.h - 1) * obs.w + clamp(x + dx, 0, obs.w - 1)];
    return { x, y, centerIndex: y * obs.w + x, timeMs: obs.startTime_ms + y * obs.sampleInterval_ms, distanceM: x * obs.traceSpacing_m, leftTrace: x - 2, rightTrace: x + 2, left, right, correlation, discontinuity: (1 - correlation) / 2, bestLagMs: best.lag * obs.sampleInterval_ms, correlationGain: Math.max(0, best.value - correlation), missingFraction: missing / 25 };
  }
  function workflowChart(obs, v) {
    const px = 65, py = 48, ww = 365, hh = 265, X = x => px + x / obs.w * ww, Y = y => py + y / obs.h * hh;
    let b = '<text x="65" y="26" font-size="18">实际振幅剖面：' + esc(obs.groupId) + '</text><text x="490" y="26" font-size="18">选中位置的左右9点波形</text>';
    for (let y = 0; y < obs.h; y++) for (let x = 0; x < obs.w; x++) { const i = y * obs.w + x, grey = Math.round(244 - clamp((obs.amplitude[i] + 1.3) / 2.6, 0, 1) * 195); b += '<rect x="' + f(X(x), 1) + '" y="' + f(Y(y), 1) + '" width="' + f(ww / obs.w + .1, 1) + '" height="' + f(hh / obs.h + .1, 1) + '" fill="' + (obs.missing[i] ? '#B5B5B5' : 'rgb(' + grey + ',' + grey + ',' + grey + ')') + '"/>'; }
    b += '<path d="M' + X(v.x - 2) + ' ' + Y(v.y - 4) + 'V' + Y(v.y + 5) + 'M' + X(v.x + 2) + ' ' + Y(v.y - 4) + 'V' + Y(v.y + 5) + '" stroke="' + C.red + '" stroke-width="3"/><rect x="' + X(v.x - 2) + '" y="' + Y(v.y - 4) + '" width="' + (X(v.x + 3) - X(v.x - 2)) + '" height="' + (Y(v.y + 5) - Y(v.y - 4)) + '" fill="none" stroke="' + C.gold + '" stroke-width="2"/>';
    [0, 40, 80].forEach(x => { b += '<text x="' + (X(x) - 12) + '" y="337">' + x * 25 + '</text>'; });
    [0, 36, 71].forEach(y => { b += '<text x="10" y="' + (Y(y) + 6) + '">' + (800 + y * 4) + '</text>'; });
    const scale = Math.max(.3, ...v.left.concat(v.right).map(Math.abs)), WX = i => 492 + i / 8 * 227, WY = a => 170 - a / scale * 101;
    b += '<path d="M492 58V274H719M492 170H719" fill="none" stroke="#A7AEAE"/><path d="' + path(v.left, WX, WY) + '" fill="none" stroke="' + C.blue + '" stroke-width="3"/><path d="' + path(v.right, WX, WY) + '" fill="none" stroke="' + C.red + '" stroke-width="3"/>';
    [0, 4, 8].forEach(k => { b += '<text x="' + (WX(k) - 18) + '" y="300">' + (v.timeMs + (k - 4) * 4) + '</text>'; });
    b += '<text x="170" y="364">相对距离 / m</text><text x="525" y="330">双程时间 / ms</text><text x="490" y="362" fill="' + C.blue + '">蓝灰 第' + v.leftTrace + '道</text><text x="633" y="362" fill="' + C.red + '">朱红 第' + v.rightTrace + '道</text>';
    return svg(b, '当前振幅剖面与选中位置的9点左右道波形，同一选区用于计算相关', 390);
  }
  function workflowRead(obs, v, source) { return source + '；零基道号 ' + v.x + '（' + v.distanceM + ' m），' + v.timeMs + ' ms。r=' + f(v.correlation) + '，D=' + f(v.discontinuity) + '；±2/±4点移位的最大相关改善=' + f(v.correlationGain) + '。5×5邻域缺测 ' + f(v.missingFraction * 100, 0) + '%。' + (v.missingFraction ? '该位置含缺测，相关值只能作为待复核线索。' : '同样的差异也可能由噪声或地层变化造成，请与剖面层位一起读。'); }
  const bg = backgroundCalc(6, .06), wf = local(defaultObs, 44, 36);
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="s1" data-concept-part="background" style="font-size:18px"><h3>拖动时间错动，观察“同相轴不连续”怎样变成数</h3><p>每点4 ms；蓝灰和朱红曲线是同一个Ricker型反射脉冲的两侧记录。金色9点窗固定，右道发生时间位移；右图实际扫描移位相关。这里是局部教学计算，未换算地层米数。</p><div class="ct-controls">' + control('右侧时间位移（采样点）', 'shift', 0, 8, 1, 6) + control('波形扰动幅度（相对振幅）', 'noise', 0, .3, .01, .06) + reset() + '</div><div data-ct-graphic>' + backgroundChart(bg) + '</div><p class="ct-readout" data-ct-result>' + backgroundRead(bg) + '</p><p style="font-size:16px">沿用本例SEG不连续性属性的解释：D突出差异，不能单凭D确认差异的地质原因。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="s1" data-concept-part="workflow" style="font-size:18px"><h3>在振幅剖面上移动9点窗，再计算一个特征</h3><p>左图选择真实道和时间，右图显示同一选区左右各隔2道的9个振幅。可读取当前主示范的观测与缺测掩码；没有已运行结果时，使用默认独立剖面2029。道号沿用引擎的零基编号。</p><div class="ct-controls">' + control('中心道号', 'trace', 3, 80, 1, 44) + control('时间采样行（800 ms起，每行4 ms）', 'row', 8, 63, 1, 36) + '<button disabled type="button" data-ct-action="sync">读取当前示范观测</button>' + reset() + '</div><div data-ct-graphic>' + workflowChart(defaultObs, wf) + '</div><p class="ct-readout" data-ct-result>' + workflowRead(defaultObs, wf, '默认合成剖面2029') + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
      const q = name => host.querySelector('[data-ct-input="' + name + '"]'); let obs = defaultObs, source = '默认合成剖面2029';
      function draw() {
        if (host.dataset.conceptPart === 'background') { const v = backgroundCalc(+q('shift').value, +q('noise').value); host.querySelector('[data-ct-graphic]').innerHTML = backgroundChart(v); host.querySelector('[data-ct-result]').textContent = backgroundRead(v); host.dataset.ctState = JSON.stringify(v); }
        else { const v = local(obs, +q('trace').value, +q('row').value); host.querySelector('[data-ct-graphic]').innerHTML = workflowChart(obs, v); host.querySelector('[data-ct-result]').textContent = workflowRead(obs, v, source); host.dataset.ctState = JSON.stringify({ source, groupId: obs.groupId, shape: [obs.h, obs.w], ...v }); }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.addEventListener('click', e => {
        const action = e.target.closest('[data-ct-action]'); if (!action) return;
        if (action.dataset.ctAction === 'reset') { if (q('shift')) { q('shift').value = 6; q('noise').value = .06; } else { obs = defaultObs; source = '默认合成剖面2029'; q('trace').value = 44; q('row').value = 36; } }
        else if (action.dataset.ctAction === 'sync') {
          const ev = g.CaseInspect && typeof g.CaseInspect.evidence === 'function' ? g.CaseInspect.evidence() : null;
          if (ev && ev.sceneId === scene && ev.observations && ev.observations.w === 84 && ev.observations.h === 72) { obs = ev.observations; source = '当前示范 runId=' + ev.runId; const s = g.CaseInspect.snapshot().selected; if (s) { q('trace').value = clamp(s.x, 3, 80); q('row').value = clamp(s.y, 8, 63); } }
          else { source = '当前示范尚无可读观测，保留' + (obs === defaultObs ? '默认剖面2029' : obs.groupId); }
        }
        draw();
      }); draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 1, workflowAfter: 1, backgroundHTML, workflowHTML, mount };
})(globalThis);
