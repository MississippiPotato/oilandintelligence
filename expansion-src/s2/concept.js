(function (g) {
  'use strict';
  const scene = 's2', C = { red: '#B8242A', paper: '#F7F4EF', blue: '#55768B', gold: '#B08A4A', ink: '#263D48' }, colors = [C.blue, C.gold, '#80748C'], names = ['平行连续', '倾斜反射', '杂乱反射'];
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length, f = (v, n = 3) => Number(v).toFixed(n);
  function rng(s) { return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
  // Same 24×24 observation generator and four attributes as the existing engine.
  function patch(type, seed, noise) {
    const r = rng(seed), phase = r() * 6.28, amp = .65 + r() * .65, freq = .38 + r() * .08, slope = type === 1 ? .35 + r() * .18 : .012;
    return Array.from({ length: 24 }, (_, y) => Array.from({ length: 24 }, (_, x) => {
      const shift = type === 2 ? 3 * Math.sin(x * .9 + phase) + 2 * Math.sin(x * 1.9) : slope * x;
      let a = amp * Math.sin(freq * (y - shift) + phase); if (type === 2) a += .55 * Math.sin(x * 1.7 + y * .7 + phase);
      return a + (r() - .5) * 2 * noise;
    }));
  }
  function features(a) {
    const rms = Math.sqrt(mean(a.flat().map(v => v * v))), dx = [], dy = [], cross = [];
    for (let y = 1; y < 24; y++) for (let x = 1; x < 24; x++) {
      dx.push(Math.abs(a[y][x] - a[y][x - 1])); dy.push(Math.abs(a[y][x] - a[y - 1][x]));
      if (y < 23 && x < 23) cross.push((a[y][x + 1] - a[y][x - 1]) * (a[y + 1][x] - a[y - 1][x]));
    }
    return [rms, mean(dx) / (rms + .001), mean(dy) / (rms + .001), mean(cross) / (rms * rms + .001)];
  }
  function make(seed, count, noise) { return Array.from({ length: count }, (_, i) => { const amplitudes = patch(i % 3, seed + i * 173, noise); return { id: seed + '-' + i, amplitudes, x: features(amplitudes), label: i % 3 }; }); }
  const train = make(1201, 120, .2), defaults = make(8101, 60, .25);
  const mu = [0, 1, 2, 3].map(j => mean(train.map(r => r.x[j]))), sd = mu.map((m, j) => Math.sqrt(mean(train.map(r => (r.x[j] - m) ** 2))) || 1);
  const standard = x => x.map((v, j) => (v - mu[j]) / sd[j]);
  function infer(x, k) {
    const z = standard(x), near = train.map((r, index) => ({ index, id: r.id, label: r.label, z: standard(r.x), distanceSquared: standard(r.x).reduce((s, v, j) => s + (v - z[j]) ** 2, 0) })).sort((a, b) => a.distanceSquared - b.distanceSquared).slice(0, k);
    const votes = [0, 0, 0]; near.forEach(r => votes[r.label]++); const label = votes.indexOf(Math.max(...votes));
    const centers = names.map((_, j) => mean(train.filter(r => r.label === j).map(r => r.x[0]))), distances = centers.map(c => Math.abs(c - x[0])), baseline = distances.indexOf(Math.min(...distances));
    return { z, near, votes, label, support: votes[label] / k, baseline };
  }
  function svg(body, label, h = 400) { return '<div class="ct-chart" style="overflow-x:auto"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="display:block;width:100%;height:auto;min-width:760px;background:' + C.paper + ';font:16px system-ui,Microsoft YaHei,sans-serif"><g fill="' + C.ink + '">' + body + '</g></svg></div>'; }
  function control(label, name, min, max, step, value) { return '<label>' + label + '<input disabled type="range" data-ct-input="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const reset = '<button disabled type="button" data-ct-action="reset">复位本图</button>';
  function tile(a, x, y, size, scale) {
    let b = ''; a.forEach((row, j) => row.forEach((v, i) => { const t = Math.max(-1, Math.min(1, v / scale)), p = Math.abs(t), base = t >= 0 ? [184, 36, 42] : [85, 118, 139], rgb = base.map(q => Math.round(247 * (1 - p) + q * p)); b += '<rect x="' + f(x + i * size / 24, 1) + '" y="' + f(y + j * size / 24, 1) + '" width="' + f(size / 24 + .15, 1) + '" height="' + f(size / 24 + .15, 1) + '" fill="rgb(' + rgb.join(',') + ')"/>'; })); return b;
  }
  function backgroundCalc(ia, ib, match) {
    const a = defaults[ia], rawB = defaults[ib], gain = match ? a.x[0] / rawB.x[0] : 1, b = rawB.amplitudes.map(row => row.map(v => v * gain)), bx = features(b);
    return { a, b, ia, ib, match, gain, bx, scale: Math.max(...a.amplitudes.flat().concat(b.flat()).map(Math.abs)) };
  }
  function backgroundChart(v) {
    let b = '<text x="51" y="27" font-size="18">A：测试窗 ' + (v.ia + 1) + '</text><text x="291" y="27" font-size="18">B：测试窗 ' + (v.ib + 1) + '</text><text x="534" y="27" font-size="18">同一属性坐标</text>';
    b += tile(v.a.amplitudes, 51, 48, 205, v.scale) + tile(v.b, 291, 48, 205, v.scale);
    const X = x => 540 + (x - .3) / 1.05 * 177, Y = y => 255 - y / 1.2 * 207;
    b += '<path d="M540 48V255H717" fill="none" stroke="#8B9BA1"/>';
    defaults.forEach(r => { b += '<circle cx="' + X(r.x[0]) + '" cy="' + Y(r.x[1]) + '" r="3" fill="#8F9A9F" opacity=".5"/>'; });
    b += '<path d="M' + X(v.a.x[0]) + ' ' + Y(v.a.x[1]) + 'L' + X(v.bx[0]) + ' ' + Y(v.bx[1]) + '" stroke="' + C.gold + '" stroke-width="2" stroke-dasharray="5 4"/>';
    [[v.a.x, 'A', C.blue], [v.bx, 'B', C.red]].forEach(([a, label, color]) => { b += '<circle cx="' + X(a[0]) + '" cy="' + Y(a[1]) + '" r="7" fill="' + color + '"/><text x="' + (X(a[0]) + 9) + '" y="' + (Y(a[1]) - 7) + '" fill="' + color + '">' + label + '</text>'; });
    [0, .6, 1.2].forEach(t => { b += '<text x="508" y="' + (Y(t) + 5) + '">' + f(t, 1) + '</text>'; });
    b += '<text x="532" y="277">0.3</text><text x="682" y="277">1.35</text><text x="590" y="303">RMS振幅 →</text><text x="532" y="328">纵轴：横向差异 / RMS</text><text x="51" y="280">道号 0 → 23</text><text x="291" y="280">道号 0 → 23</text><text x="51" y="308">采样号 0 → 23 向下增加</text><text x="51" y="350" fill="' + C.blue + '">蓝灰：负振幅</text><text x="242" y="350" fill="' + C.red + '">朱红：正振幅</text><text x="51" y="378">两窗共用色标 ±' + f(v.scale, 2) + '；灰点为原始60窗。</text>';
    return svg(b, '两个真实24乘24振幅小窗使用共同色标，并在RMS与横向差异坐标中定位');
  }
  function backgroundRead(v) { return 'A的RMS=' + f(v.a.x[0]) + '，横向差异/RMS=' + f(v.a.x[1]) + '；B的RMS=' + f(v.bx[0]) + '，横向差异/RMS=' + f(v.bx[1]) + '。B振幅乘数=' + f(v.gain) + '。' + (v.match ? '两窗能量已匹配，仍可从同相轴的方向与连续性区分结构；B的缩放只用于这张对照图。' : '此时同时存在能量和结构差异；勾选RMS匹配后再判断结构。'); }
  function workflowCalc(rows, index, k) { const row = rows[index], prediction = infer(row.x, k); return { index, id: row.id, amplitudes: row.amplitudes, features: row.x, k, ...prediction }; }
  function workflowChart(v) {
    const X = z => 61 + (z + 2.2) / 5.8 * 390, Y = z => 296 - (z + 2.2) / 5.8 * 244;
    let b = '<text x="61" y="27" font-size="18">训练属性空间的二维投影</text><text x="503" y="27" font-size="18">当前测试窗 ' + (v.index + 1) + '</text><path d="M61 52V296H451" fill="none" stroke="#8B9BA1"/>';
    [-2, 0, 2].forEach(t => { b += '<text x="' + (X(t) - 10) + '" y="321">' + t + '</text><text x="27" y="' + (Y(t) + 6) + '">' + t + '</text>'; });
    train.forEach(r => { const z = standard(r.x); b += '<circle cx="' + X(z[0]) + '" cy="' + Y(z[1]) + '" r="4" fill="' + colors[r.label] + '" opacity=".5"/>'; });
    v.near.forEach(r => { b += '<path d="M' + X(v.z[0]) + ' ' + Y(v.z[1]) + 'L' + X(r.z[0]) + ' ' + Y(r.z[1]) + '" stroke="' + colors[r.label] + '" opacity=".65"/><circle cx="' + X(r.z[0]) + '" cy="' + Y(r.z[1]) + '" r="6" fill="none" stroke="' + colors[r.label] + '" stroke-width="2"/>'; });
    b += '<path d="M' + X(v.z[0]) + ' ' + (Y(v.z[1]) - 9) + 'l9 9-9 9-9-9z" fill="' + C.red + '" stroke="white" stroke-width="2"/>';
    const scale = Math.max(...v.amplitudes.flat().map(Math.abs)); b += tile(v.amplitudes, 503, 52, 214, scale);
    b += '<text x="503" y="290">道号0–23；采样向下</text><text x="503" y="321">统一距离实际使用4属性</text><text x="61" y="352">横轴：标准化RMS；纵轴：标准化横向差异</text><text x="61" y="380" fill="' + C.blue + '">● 平行连续</text><text x="242" y="380" fill="' + C.gold + '">● 倾斜反射</text><text x="421" y="380" fill="' + colors[2] + '">● 杂乱反射</text><text x="590" y="380" fill="' + C.red + '">◆ 测试窗</text>';
    return svg(b, '所选测试小窗、标准化训练点和实际四维最近邻的二维投影');
  }
  function workflowRead(v, source) { return source + '；样本ID ' + v.id + '。四属性=[' + v.features.map(n => f(n)).join('，') + ']。最近' + v.k + '个训练邻居投票：平行' + v.votes[0] + '、倾斜' + v.votes[1] + '、杂乱' + v.votes[2] + '；预测为' + names[v.label] + '，投票占比' + f(v.support * 100, 1) + '%；仅RMS基线为' + names[v.baseline] + '。邻居在完整四维中排序，投影距离不能替代四维距离。'; }
  function neighborTable(v) { return '<table style="font-size:16px"><caption>最近5个训练邻居（最多显示5行；距离使用训练组尺度）</caption><thead><tr><th>顺序</th><th>训练ID</th><th>训练类别</th><th>四维欧氏距离</th></tr></thead><tbody>' + v.near.slice(0, 5).map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + r.id + '</td><td>' + names[r.label] + '</td><td>' + f(Math.sqrt(r.distanceSquared)) + '</td></tr>').join('') + '</tbody></table>'; }
  const bg = backgroundCalc(0, 1, true), wf = workflowCalc(defaults, 1, 7);
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="s2" data-concept-part="background" style="font-size:18px"><h3>把两窗能量调成相同，再看地震相结构</h3><p>每窗24道×24采样；这里选择默认测试集中的两个真实小窗。让B的RMS与A相同后，同相轴是否仍有不同方向或连续性？两图共用振幅色标，不能依靠各自自动增强来判断强弱。</p><div class="ct-controls">' + control('A测试窗编号', 'a', 1, 60, 1, 1) + control('B测试窗编号', 'b', 1, 60, 1, 2) + '<label><input disabled type="checkbox" data-ct-input="match" checked>将B的RMS匹配到A</label>' + reset + '</div><div data-ct-graphic>' + backgroundChart(bg) + '</div><p class="ct-readout" data-ct-result>' + backgroundRead(bg) + '</p><p style="font-size:16px">沿用AAPG地震相与SEG地震属性资料；标签描述反射样式，沉积含义仍需井资料与层序标定。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="s2" data-concept-part="workflow" style="font-size:18px"><h3>一个小窗怎样在四属性空间获得分类？</h3><p>选择一个测试窗，图上用朱红菱形定位它，并连到真正参与投票的训练窗。改变k会重新排序和投票。支持读取主示范的噪声、k与所选窗，再按相同种子重算当前观测；预测只接收四个属性。</p><div class="ct-controls">' + control('测试窗编号', 'sample', 1, 60, 1, 2) + control('近邻数k', 'k', 1, 31, 2, 7) + '<button disabled type="button" data-ct-action="sync">读取当前示范设置</button>' + reset + '</div><div data-ct-graphic>' + workflowChart(wf) + '</div><p class="ct-readout" data-ct-result>' + workflowRead(wf, '默认噪声0.25') + '</p><div data-ct-neighbors style="overflow-x:auto">' + neighborTable(wf) + '</div></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
      const q = name => host.querySelector('[data-ct-input="' + name + '"]'); let rows = defaults, noise = .25, source = '默认噪声0.25';
      function draw() {
        if (host.dataset.conceptPart === 'background') { const v = backgroundCalc(+q('a').value - 1, +q('b').value - 1, q('match').checked); host.querySelector('[data-ct-graphic]').innerHTML = backgroundChart(v); host.querySelector('[data-ct-result]').textContent = backgroundRead(v); host.dataset.ctState = JSON.stringify({ sampleA: v.a.id, sampleB: defaults[v.ib].id, matchRms: v.match, gainB: v.gain, featuresA: v.a.x, featuresB: v.bx, commonColorLimit: v.scale }); }
        else { const v = workflowCalc(rows, +q('sample').value - 1, +q('k').value); host.querySelector('[data-ct-graphic]').innerHTML = workflowChart(v); host.querySelector('[data-ct-result]').textContent = workflowRead(v, source); host.querySelector('[data-ct-neighbors]').innerHTML = neighborTable(v); host.dataset.ctState = JSON.stringify({ source, noise, sampleId: v.id, index: v.index, k: v.k, features: v.features, standardized: v.z, neighbors: v.near.map(r => ({ id: r.id, label: r.label, distanceSquared: r.distanceSquared })), votes: v.votes, predictedClass: v.label, voteShare: v.support, baselineClass: v.baseline }); }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw); host.addEventListener('click', e => {
        const action = e.target.closest('[data-ct-action]'); if (!action) return;
        if (action.dataset.ctAction === 'reset') { if (q('a')) { q('a').value = 1; q('b').value = 2; q('match').checked = true; } else { rows = defaults; noise = .25; source = '默认噪声0.25'; q('sample').value = 2; q('k').value = 7; } }
        else { const snap = g.CaseInspect && g.CaseInspect.snapshot(); if (snap && snap.sceneId === scene && snap.computed && !snap.stale) { noise = +snap.options.noise; rows = make(8101, 60, noise); q('k').value = snap.options.k; q('sample').value = Number(snap.selected || 0) + 1; source = '当前示范噪声' + f(noise, 2) + '，相同固定种子重算'; } else source = '主示范尚无当前有效结果，保留本图观测'; }
        draw();
      }); draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 1, workflowAfter: 2, backgroundHTML, workflowHTML, mount };
})(globalThis);
