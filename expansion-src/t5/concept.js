(function (g) {
  'use strict';
  const scene = 't5', red = '#B8242A', blue = '#55768B', gold = '#B08A4A';
  const fmt = (x, n = 2) => Number(x).toFixed(n);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length, median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const style = '<style>[data-concept-scene="t5"]{font-size:18px;line-height:1.65;min-width:0}[data-concept-scene="t5"] .ct-chart{overflow-x:auto;max-width:100%}[data-concept-scene="t5"] svg{display:block;width:100%;min-width:760px}[data-concept-scene="t5"] figcaption,[data-concept-scene="t5"] label{font-size:16px}[data-concept-scene="t5"] input,[data-concept-scene="t5"] button{min-height:42px}</style>';
  const fittedStyle = "<style>[data-concept-scene=\"t5\"].ct-widget p{font-size:18px}[data-concept-scene=\"t5\"].ct-widget .ct-controls :is(input,select,button){min-height:44px}[data-concept-scene=\"t5\"].ct-widget .ct-controls input[type=range]{height:44px}[data-concept-scene=\"t5\"].ct-widget .ct-chart>svg{display:block;width:100%;min-width:760px;max-width:none;max-height:none;height:auto;margin:0}</style>";
  const wrap = (h, height, label) => '<div class="ct-chart"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + height + '" role="img" aria-label="' + esc(label) + '"><rect width="760" height="' + height + '" fill="#F7F4EF"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16" fill="#383431">' + h + '</g></svg></div>';
  function random(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
  function image(height, fog, seed, light) {
    const R = random(seed), edge = Math.round((1 - height / 10) * 99);
    return Array.from({length: 100}, (_, y) => Array.from({length: 32}, (_, x) => { const shade = x >= ((seed % 3) * 7 + 5) && x <= ((seed % 3) * 7 + 10) && y > 15 && y < 55 ? -80 : 0; return Math.max(0, Math.min(255, (y >= edge ? 62 : 173) + light + y * .18 + (R() - .5) * fog * 55 + shade)); }));
  }
  function predict(pixels) {
    const profile = pixels.map(median), gradient = profile.map((_, y) => y > 2 && y < 97 ? Math.abs(profile[y + 2] - profile[y - 2]) : 0), peak = gradient.indexOf(Math.max(...gradient)), near = gradient.map((v, i) => ({v, i})).filter(z => Math.abs(z.i - peak) <= 2), weight = near.reduce((s, z) => s + z.v, 0), row = near.reduce((s, z) => s + z.v * z.i, 0) / (weight || 1);
    return {profile, gradient, row, height: 10 * (1 - row / 99), strength: gradient[peak]};
  }
  function profileData(level, fog) { const pixels = image(level, fog, 525, 5); return {level, fog, pixels, ...predict(pixels)}; }
  function profileChart(d) {
    const yy = r => 70 + r / 99 * 330, px = v => 310 + v / 255 * 360;
    let h = '<text x="67" y="28">同一像素行坐标：灰度观察窗 → 行中位数 → 四行跨度梯度</text><text x="67" y="56">32列灰度窗</text><text x="310" y="56">灰度值 / 梯度强度（0–255）</text>';
    d.pixels.forEach((row, y) => { for (let k = 0; k < 4; k++) { const v = Math.round(mean(row.slice(k * 8, k * 8 + 8))); h += '<rect x="' + (67 + k * 32) + '" y="' + (70 + y * 3.3) + '" width="32" height="3.5" fill="rgb(' + v + ',' + v + ',' + v + ')"/>'; } });
    [0, 25, 50, 75, 99].forEach(r => { h += '<path d="M310 ' + yy(r) + 'H670" stroke="#DDD6CC"/><text x="230" y="' + (yy(r) + 5) + '" text-anchor="end">' + r + '</text><text x="682" y="' + (yy(r) + 5) + '">' + fmt(10 * (1 - r / 99), 1) + '</text>'; });
    [0, 64, 128, 192, 255].forEach(v => { h += '<path d="M' + px(v) + ' 70V400" stroke="#E3DDD3"/><text x="' + px(v) + '" y="428" text-anchor="middle">' + v + '</text>'; });
    const line = (a, color, dash) => '<path d="' + a.map((v, i) => (i ? 'L' : 'M') + fmt(px(v), 1) + ' ' + fmt(yy(i), 1)).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.7" stroke-dasharray="' + (dash || '') + '"/>';
    h += line(d.profile, blue) + line(d.gradient, gold, '4 3');
    h += '<path d="M60 ' + yy(d.row) + 'H719" stroke="' + red + '" stroke-width="2.5"/><text x="67" y="468">朱红检测行 y=' + fmt(d.row) + ' → h=10×(1−y/99)=' + fmt(d.height) + ' m</text><text x="67" y="503">左纵轴：像素行（向下增加）　右纵轴：高度m（向下减小）</text>';
    return wrap(h, 526, '真实灰度矩阵的聚合预览与同一像素行上的中位数梯度和米制高度');
  }
  function profileText(d) {
    return '当前场景高度设定 ' + fmt(d.level, 1) + ' m，成像噪声倍率 ' + fmt(d.fog, 1) + '；图像识别只接收32×100像素矩阵。行中位数的四行跨度梯度最大值 ' + fmt(d.strength, 1) + ' 灰度级，峰附近加权检测行 ' + fmt(d.row) + '，换算视觉高度 ' + fmt(d.height) + ' m。雾化控件在本例具体增加像素噪声，不代表完整光学雾模型。';
  }
  function fixture() {
    const pairs = Array.from({length: 18}, (_, i) => { const level = 2 + (i * 5 % 14) / 2; return {pixels: image(level, 1, 600 + i, (i % 5 - 2) * 18), radar: level + .04 * Math.sin(i * 1.3), label: '局部帧' + (i + 1)}; });
    return {pairs, source: '沿用本例image/predict计算；局部18帧高度覆盖2～8.5m，雷达链另加小幅扰动'};
  }
  function consistency(data, shift, tolerance, selected) {
    const rows = data.pairs.map((pair, i) => { const visual = predict(pair.pixels), radar = pair.radar + shift, difference = radar - visual.height; return {index: i + 1, label: pair.label, visual: visual.height, radar, difference, magnitude: Math.abs(difference), strength: visual.strength, row: visual.row, consistent: Math.abs(difference) <= tolerance}; });
    return {source: data.source, shift, tolerance, selected: Math.max(1, Math.min(rows.length, selected)), rows, consistentCount: rows.filter(r => r.consistent).length, inconsistentCount: rows.filter(r => !r.consistent).length};
  }
  function consistencyChart(d) {
    const lo = Math.min(0, Math.floor(Math.min(...d.rows.flatMap(r => [r.visual, r.radar])) - .5)), hi = Math.max(10, Math.ceil(Math.max(...d.rows.flatMap(r => [r.visual, r.radar])) + .5));
    const x = v => 75 + (v - lo) / (hi - lo) * 420, y = v => 388 - (v - lo) / (hi - lo) * 320;
    let h = '<text x="75" y="28">相同米制坐标上的两条测量链；蓝灰带是当前一致性窗口</text>';
    const polygon = [[lo, lo + d.tolerance], [hi - d.tolerance, hi], [hi, hi], [hi, hi - d.tolerance], [lo + d.tolerance, lo], [lo, lo]].map(p => x(p[0]) + ',' + y(p[1])).join(' ');
    h += '<polygon points="' + polygon + '" fill="' + blue + '" opacity=".16"/>';
    Array.from({length: 6}, (_, i) => lo + (hi - lo) * i / 5).forEach(v => { h += '<path d="M75 ' + y(v) + 'H495M' + x(v) + ' 68V388" stroke="#DDD6CC"/><text x="64" y="' + (y(v) + 5) + '" text-anchor="end">' + fmt(v, 1) + '</text><text x="' + x(v) + '" y="415" text-anchor="middle">' + fmt(v, 1) + '</text>'; });
    h += '<path d="M75 388L495 68" stroke="' + gold + '" stroke-width="2" stroke-dasharray="6 5"/><text x="75" y="57">雷达高度 m</text><text x="285" y="447" text-anchor="middle">视觉高度 m；虚线y=x</text>';
    d.rows.forEach(r => { h += '<circle cx="' + x(r.visual) + '" cy="' + y(r.radar) + '" r="' + (r.index === d.selected ? 7 : 4) + '" fill="' + (r.consistent ? blue : red) + '" stroke="' + (r.index === d.selected ? '#383431' : '#F7F4EF') + '" stroke-width="' + (r.index === d.selected ? 2 : 1) + '"><title>' + esc(r.label) + '，视觉' + fmt(r.visual) + 'm，雷达' + fmt(r.radar) + 'm</title></circle>'; });
    const selected = d.rows[d.selected - 1];
    h += '<text x="525" y="95">选中 ' + esc(selected.label) + '</text><text x="525" y="137">视觉 ' + fmt(selected.visual) + ' m</text><text x="525" y="177">雷达 ' + fmt(selected.radar) + ' m</text><text x="525" y="217">差值 ' + fmt(selected.difference) + ' m</text><text x="525" y="257">边界强度</text><text x="525" y="288">' + fmt(selected.strength, 1) + ' 灰度级</text><text x="525" y="340">' + (selected.consistent ? '窗口内：保持互核' : '窗口外：保留分歧') + '</text>';
    const maxD = Math.max(1, d.tolerance * 1.2, ...d.rows.map(r => r.magnitude)) * 1.08, dx = i => 75 + i / Math.max(1, d.rows.length - 1) * 630, dy = v => 567 - v / maxD * 66;
    h += '<text x="75" y="484">逐帧有符号差：雷达−视觉（m）</text><rect x="75" y="' + dy(d.tolerance) + '" width="630" height="' + (dy(-d.tolerance) - dy(d.tolerance)) + '" fill="' + blue + '" opacity=".13"/>';
    [-d.tolerance, 0, d.tolerance].forEach(v => { h += '<path d="M75 ' + dy(v) + 'H705" stroke="' + (v ? gold : '#AAA092') + '" stroke-dasharray="' + (v ? '5 4' : '') + '"/><text x="64" y="' + (dy(v) + 5) + '" text-anchor="end">' + fmt(v, 1) + '</text>'; });
    h += '<path d="' + d.rows.map((r, i) => (i ? 'L' : 'M') + dx(i) + ' ' + dy(r.difference)).join(' ') + '" fill="none" stroke="' + red + '" stroke-width="2"/>';
    d.rows.forEach((r, i) => { h += '<circle cx="' + dx(i) + '" cy="' + dy(r.difference) + '" r="' + (r.index === d.selected ? 5 : 3) + '" fill="' + (r.consistent ? blue : red) + '"/>'; });
    [0, Math.floor((d.rows.length - 1) / 2), d.rows.length - 1].filter((v, i, a) => a.indexOf(v) === i).forEach(i => { h += '<text x="' + dx(i) + '" y="663" text-anchor="middle">' + (i + 1) + '</text>'; });
    h += '<text x="390" y="695" text-anchor="middle">帧序号；两条读数接近表示一致，仍需各自的标定与精度证据</text>';
    return wrap(h, 718, '视觉雷达同高度散点的一致性带以及逐帧差值');
  }
  function consistencyText(d) {
    const r = d.rows[d.selected - 1];
    return '当前' + d.rows.length + '组同时刻观测中，' + d.consistentCount + '组在±' + fmt(d.tolerance, 1) + ' m窗口内，' + d.inconsistentCount + '组需交叉核查。' + r.label + '：视觉' + fmt(r.visual) + ' m，雷达' + fmt(r.radar) + ' m，雷达−视觉=' + fmt(r.difference) + ' m；最大四行跨度灰度差' + fmt(r.strength, 1) + '。追加雷达偏移' + fmt(d.shift, 1) + ' m只改变雷达链，视觉像素与高度保持固定。一致帧比例描述两条测量链的接近程度；结合图像边缘强度和雷达读数核查差异。数据：' + d.source.replace('CaseInspect本轮32×100像素与独立雷达读数', '本轮32×100像素与独立雷达读数').replace('沿用本例image/predict计算；', '') + '。';
  }
  function field(n, label, min, max, step, value) { return '<label>' + label + ' <output data-ct-value="' + n + '">' + value + '</output><input disabled name="' + n + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const b0 = profileData(6, 1), w0 = consistency(fixture(), 0, .6, 7);
  const backgroundHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t5" data-concept-part="background"><h3>把图像行号变成米，靠的是哪一条标尺？</h3><p>固定机位与0～10 m标尺给出 h=10×(1−y/99)。观察窗逐行求32列的中位数，再算 |中位数(y+2)−中位数(y−2)|，峰附近加权得检测行。上下共同的像素行坐标，让“像素→边界→高度”能逐步查回。</p><div class="ct-controls">' + field('level', '用于生成观察窗的场景高度（m）', 2, 9, .5, 6) + field('fog', '成像噪声倍率', 0, 4, .5, 1) + '<button disabled type="button" data-ct-reset>恢复默认</button></div><figure><div data-ct-graphic>' + profileChart(b0) + '</div><figcaption>左预览每块为8列×1行灰度均值；算法使用完整32×100矩阵。蓝灰：逐行中位数；赭金：四行跨度梯度；朱红：检测行。标尺映射沿用本例，不把像素行直接当成储罐容积。</figcaption></figure><p class="ct-readout" data-ct-result>' + profileText(b0) + '</p></section>';
  const workflowHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t5" data-concept-part="workflow"><h3>两条液位测量链不一致时，先保留差值</h3><p>视觉由像素独立提取高度，再与同一时刻雷达读数放到共同米制坐标。改变雷达偏移或一致性窗口，观察哪些帧跨出窗口；边界强度作为图像证据并列显示，不自动裁定哪条链正确。主示范当前帧可以作为一组真实输入读入此步骤。</p><div class="ct-controls">' + field('shift', '向冻结雷达读数追加偏移（m）', -2, 2, .1, 0) + field('tolerance', '两链一致性窗口（±m）', .2, 1.2, .1, .6) + field('selected', '核查帧序号', 1, 18, 1, 7) + '<button disabled type="button" data-ct-import>读取本轮像素与雷达</button><button disabled type="button" data-ct-reset>恢复默认</button></div><p data-ct-source class="ct-readout">当前使用局部18帧成对观测；一致性比较视觉测高与雷达读数。</p><figure><div data-ct-graphic>' + consistencyChart(w0) + '</div><figcaption>蓝灰点在窗口内，朱红点在窗口外；黑边点是当前核查帧。两条测量链可能同时受到共同偏差；读数接近时，也要结合图像边缘强度检查。</figcaption></figure><p class="ct-readout" data-ct-result>' + consistencyText(w0) + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="t5"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true'; host.querySelectorAll('input,button').forEach(el => { el.disabled = false; });
      let data = fixture(); const get = n => Number(host.querySelector('[name="' + n + '"]').value);
      function draw() {
        host.querySelectorAll('[data-ct-value]').forEach(out => { out.textContent = host.querySelector('[name="' + out.dataset.ctValue + '"]').value; });
        const background = host.dataset.conceptPart === 'background', d = background ? profileData(get('level'), get('fog')) : consistency(data, get('shift'), get('tolerance'), get('selected'));
        host.querySelector('[data-ct-graphic]').innerHTML = background ? profileChart(d) : consistencyChart(d); host.querySelector('[data-ct-result]').textContent = background ? profileText(d) : consistencyText(d);
        host.dataset.ctState = JSON.stringify({part: host.dataset.conceptPart, ...d});
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      const button = host.querySelector('[data-ct-import]');
      if (button) button.addEventListener('click', () => {
        let s; try { s = g.CaseInspect && g.CaseInspect.snapshot(); } catch (_) {}
        const r = s && s.result;
        if (!s || !['computed', 'ready'].includes(s.status) || !r || !Array.isArray(r.pixels) || r.pixels.length !== 100 || !r.pixels.every(row => Array.isArray(row) && row.length === 32 && row.every(Number.isFinite)) || !Number.isFinite(r.radar)) { host.querySelector('[data-ct-source]').textContent = '尚无已计算的当前像素与雷达；保留局部片段。请先在可运行示范中计算。'; return; }
        data = {pairs: [{pixels: r.pixels.map(row => row.slice()), radar: r.radar, label: '主示范当前帧'}], source: 'CaseInspect本轮32×100像素与独立雷达读数'};
        host.querySelector('[name="shift"]').value = '0'; host.querySelector('[name="selected"]').max = '1'; host.querySelector('[name="selected"]').value = '1';
        host.querySelector('[data-ct-source]').textContent = '已载入当前帧图像和雷达读数；从图像重新计算视觉测高，再对照雷达高度。'; draw();
      });
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { data = fixture(); const selected = host.querySelector('[name="selected"]'); if (selected) selected.max = '18'; host.querySelectorAll('input').forEach(el => { el.value = el.defaultValue; }); const note = host.querySelector('[data-ct-source]'); if (note) note.textContent = '已恢复局部18帧成对观测；一致性比较视觉测高与雷达读数。'; draw(); });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = {backgroundAfter: 0, workflowAfter: 2, backgroundHTML, workflowHTML, mount};
})(globalThis);
