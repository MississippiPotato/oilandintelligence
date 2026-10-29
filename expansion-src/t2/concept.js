(function (g) {
  'use strict';
  const scene = 't2', red = '#B8242A', blue = '#55768B', gold = '#B08A4A';
  const fmt = (x, n = 2) => Number(x).toFixed(n);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const style = '<style>[data-concept-scene="t2"]{font-size:18px;line-height:1.65;min-width:0}[data-concept-scene="t2"] .ct-chart{overflow-x:auto;max-width:100%}[data-concept-scene="t2"] svg{display:block;width:100%;min-width:760px}[data-concept-scene="t2"] figcaption,[data-concept-scene="t2"] label{font-size:16px}[data-concept-scene="t2"] input,[data-concept-scene="t2"] button{min-height:42px}</style>';
  const fittedStyle = "<style>[data-concept-scene=\"t2\"].ct-widget p{font-size:18px}[data-concept-scene=\"t2\"].ct-widget .ct-controls :is(input,select,button){min-height:44px}[data-concept-scene=\"t2\"].ct-widget .ct-controls input[type=range]{height:44px}[data-concept-scene=\"t2\"].ct-widget .ct-chart>svg{display:block;width:100%;min-width:760px;max-width:none;max-height:none;height:auto;margin:0}</style>";
  const wrap = (h, height, label) => '<div class="ct-chart"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + height + '" role="img" aria-label="' + esc(label) + '"><rect width="760" height="' + height + '" fill="#F7F4EF"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16" fill="#383431">' + h + '</g></svg></div>';
  function fixture(shift = 7) {
    const xs = [108, 120, 134, 151, 166, 184, 196], ds = [1.5, 2.7, 1.8, 3.4, 2.2, 4.1, 2.5], grows = [.2, .5, .35, .4, .15, .8, .3];
    const first = xs.map((x, i) => ({x, depth: ds[i], angle: i * 43, len: 45 + i * 7}));
    const second = first.map((r, i) => ({x: r.x + shift + [.08, -.06, .02, -.03, .05, -.08, .04][i], depth: r.depth + grows[i], angle: r.angle + (i % 2 ? 1 : -1), len: r.len + (i % 2 ? 2 : -2)})).reverse();
    return {first, second, anchors: [100, 125, 150, 175, 200].map((x, i) => ({old: x, now: x + shift + [.2, -.1, .05, .1, -.05][i]})), years: 3, source: '本例7处缺陷、5处焊缝的局部数值教学'};
  }
  function registration(shift, correction) {
    const d = fixture(shift), offset = median(d.anchors.map(a => a.now - a.old));
    return {...d, shift, correction, estimatedOffset: offset, weldResiduals: d.anchors.map(a => a.now - correction - a.old)};
  }
  function registrationChart(d) {
    const x = v => 64 + (v - 95) / 120 * 660, y = v => 264 - v / 6 * 192;
    let h = '<text x="64" y="28">同一沿线里程坐标 · 金属损失 mm（信号峰由固定缺陷形状绘制）</text>';
    [0, 2, 4, 6].forEach(v => { h += '<path d="M64 ' + y(v) + 'H724" stroke="#DDD6CC"/><text x="54" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>'; });
    const curve = (records, shift) => Array.from({length: 481}, (_, i) => { const at = 95 + i / 4; return {x: at, value: records.reduce((s, r) => s + r.depth * Math.exp(-.5 * ((at - (r.x - shift)) / 1.4) ** 2), 0)}; });
    [[d.first, 0, blue, ''], [d.second, 0, gold, '6 5'], [d.second, d.correction, red, '']].forEach(([records, c, color, dash]) => { h += '<path d="' + curve(records, c).map((r, i) => (i ? 'L' : 'M') + fmt(x(r.x), 1) + ' ' + fmt(y(r.value), 1)).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-dasharray="' + dash + '"/>'; });
    h += '<text x="64" y="307">焊缝是共同坐标的锚点</text><text x="14" y="340">首次</text><text x="14" y="377">二次减 c</text>';
    d.anchors.forEach(a => { h += '<path d="M' + x(a.old) + ' 321V345" stroke="' + blue + '" stroke-width="3"/><path d="M' + x(a.now - d.correction) + ' 358V382" stroke="' + red + '" stroke-width="3"/><path d="M' + x(a.old) + ' 346L' + x(a.now - d.correction) + ' 357" stroke="#BEB4A6"/>'; });
    [100, 125, 150, 175, 200].forEach(v => { h += '<text x="' + x(v) + '" y="412" text-anchor="middle">' + v + '</text>'; });
    h += '<text x="395" y="444" text-anchor="middle">沿线里程 m；二次校正坐标 = 二次原始里程 − c</text>';
    return wrap(h, 468, '首次、二次原始及二次校正的同里程曲线和焊缝坐标');
  }
  function registrationText(d) {
    return '五处焊缝的二次−首次差中位数为 ' + fmt(d.estimatedOffset) + ' m；当前减去 c=' + fmt(d.correction) + ' m。校正后焊缝中位残差 ' + fmt(median(d.weldResiduals)) + ' m、最大绝对残差 ' + fmt(Math.max(...d.weldResiduals.map(Math.abs))) + ' m。平移改变的是对应位置；两次测深值保持原样，尚不能把相邻峰的高度差直接当成增长。';
  }
  function match(d, adjustment, years, error, selected) {
    const estimated = median(d.anchors.map(a => a.now - a.old)), correction = estimated + adjustment, used = new Set();
    const rows = d.first.map((r, i) => {
      let best = null;
      d.second.forEach((q, j) => {
        if (used.has(j)) return;
        const angle = Math.abs(((q.angle - r.angle) % 360 + 360) % 360), dx = Math.abs(q.x - correction - r.x), cost = dx + .12 * Math.min(angle, 360 - angle) + .03 * Math.abs(q.len - r.len);
        if (!best || cost < best.cost) best = {j, cost, dx};
      });
      used.add(best.j);
      const q = d.second[best.j], rate = (q.depth - r.depth) / years, bound = 2 * error / years;
      return {index: i + 1, firstX: r.x, secondX: q.x, correctedX: q.x - correction, firstDepth: r.depth, secondDepth: q.depth, cost: best.cost, coordinateResidual: q.x - correction - r.x, rate, lower: rate - bound, upper: rate + bound, yearsTo6: rate > 0 ? Math.max(0, (6 - q.depth) / rate) : null};
    });
    return {source: d.source, adjustment, years, error, selected: Math.max(1, Math.min(rows.length, selected)), estimatedOffset: estimated, correction, rows};
  }
  function growthChart(d) {
    const loX = Math.min(...d.rows.map(r => r.firstX)) - 5, hiX = Math.max(...d.rows.map(r => r.firstX)) + 5;
    const extent = Math.max(.25, ...d.rows.flatMap(r => [Math.abs(r.lower), Math.abs(r.upper)])) * 1.12;
    const x = v => 75 + (v - loX) / (hiX - loX) * 642, y = v => 190 - v / extent * 120;
    let h = '<text x="75" y="29">配准与观测特征匹配后 · 有符号增长率及测深误差范围</text>';
    [-extent, 0, extent].forEach(v => { h += '<path d="M75 ' + y(v) + 'H717" stroke="' + (v === 0 ? '#AAA092' : '#DDD6CC') + '"/><text x="64" y="' + (y(v) + 5) + '" text-anchor="end">' + fmt(v) + '</text>'; });
    d.rows.forEach(r => {
      const color = r.index === d.selected ? red : blue, cx = x(r.firstX);
      h += '<path d="M' + cx + ' ' + y(r.lower) + 'V' + y(r.upper) + 'M' + (cx - 5) + ' ' + y(r.lower) + 'H' + (cx + 5) + 'M' + (cx - 5) + ' ' + y(r.upper) + 'H' + (cx + 5) + '" stroke="' + color + '" stroke-width="2"/><circle cx="' + cx + '" cy="' + y(r.rate) + '" r="' + (r.index === d.selected ? 6 : 4) + '" fill="' + color + '"><title>缺陷' + r.index + '，增长率' + fmt(r.rate, 3) + ' mm/年</title></circle>';
    });
    [0, 1, 2, 3, 4].forEach(i => { const v = loX + (hiX - loX) * i / 4; h += '<text x="' + x(v) + '" y="344" text-anchor="middle">' + fmt(v, 0) + '</text>'; });
    const s = d.rows[d.selected - 1];
    h += '<text x="395" y="376" text-anchor="middle">首次沿线里程 m；纵轴 mm/年，误差棒是最坏界限，不是置信区间</text><text x="75" y="418">选中缺陷 ' + s.index + '：' + fmt(s.firstDepth, 3) + ' → ' + fmt(s.secondDepth, 3) + ' mm，间隔 ' + d.years + ' 年</text>';
    return wrap(h, 444, '各匹配缺陷在共同首次里程坐标中的年化增长率和测深误差界限');
  }
  function growthText(d) {
    const s = d.rows[d.selected - 1];
    return '缺陷 ' + s.index + '：二次校正里程 ' + fmt(s.correctedX) + ' m，距首次 ' + fmt(s.coordinateResidual, 3) + ' m。增长率=(' + fmt(s.secondDepth, 3) + '−' + fmt(s.firstDepth, 3) + ')/' + d.years + '=' + fmt(s.rate, 3) + ' mm/年。每次测深各可误差 ±' + fmt(d.error) + ' mm，差值年化范围 [' + fmt(s.lower, 3) + ', ' + fmt(s.upper, 3) + '] mm/年。' + (s.yearsTo6 === null ? '非正增长，不作到6 mm的线性外推。' : '按点估计线性外推至本例6 mm触发线约 ' + fmt(s.yearsTo6, 1) + ' 年。') + '当前只核算观测与误差，不读取参考对应索引。数据：' + d.source + '。';
  }
  function field(n, label, min, max, step, value) { return '<label>' + label + ' <output data-ct-value="' + n + '">' + value + '</output><input disabled name="' + n + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const b0 = registration(7, 7.05), w0 = match(fixture(), 0, 3, .25, 5);
  const backgroundHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t2" data-concept-part="background"><h3>同一个峰错开7米，还能直接相减吗？</h3><p>缺陷深度画在共同里程上，焊缝给出独立的坐标锚点。拖动原始里程偏移，再调整校正值；观察峰的位置与高度分别改变什么。局部夹具固定7处缺陷和5处焊缝，名义壁厚仍为10 mm。</p><div class="ct-controls">' + field('shift', '二次原始里程整体偏移（m）', 0, 14, .5, 7) + field('correction', '从二次里程减去 c（m）', 0, 14.25, .05, 7.05) + '<button disabled type="button" data-ct-align>采用焊缝差中位数</button><button disabled type="button" data-ct-reset>恢复默认</button></div><figure><div data-ct-graphic>' + registrationChart(b0) + '</div><figcaption>蓝灰：首次；赭金虚线：二次原始；朱红：二次减去c。峰形仅用于呈现已给定缺陷记录的位置与深度，不能替代原始检测信号。</figcaption></figure><p class="ct-readout" data-ct-result>' + registrationText(b0) + '</p></section>';
  const workflowHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t2" data-concept-part="workflow"><h3>匹配以后，测深误差怎样进入年增长率？</h3><p>沿用本例的里程、周向角、长度加权代价，按首次顺序完成一对一贪心匹配。误差棒按两次独立有界测深误差的最坏差值 ±2e/年数绘制。修改年数是在同一组已测深度上重算年化；先读出每个毫米差值，再解释增长。</p><div class="ct-controls">' + field('adjustment', '在焊缝偏移上追加校正（m）', -5, 5, .25, 0) + field('years', '检测间隔（年）', 1, 8, .5, 3) + field('error', '每次测深误差界限 e（mm）', 0, .75, .05, .25) + field('selected', '核查首次缺陷序号', 1, 7, 1, 5) + '<button disabled type="button" data-ct-import>读取本轮示范观测</button><button disabled type="button" data-ct-reset>恢复默认</button></div><p data-ct-source class="ct-readout">当前使用本例7处缺陷的局部数值教学；主示范完成计算后可读取24处观测。</p><figure><div data-ct-graphic>' + growthChart(w0) + '</div><figcaption>点为有符号增长率，朱红为当前核查记录。误差范围穿过0时，这两次测量尚不能排除无增长；本图不把负值截成0，也不报告匹配正确率。</figcaption></figure><p class="ct-readout" data-ct-result>' + growthText(w0) + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="t2"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true';
      host.querySelectorAll('input,button').forEach(el => { el.disabled = false; });
      let data = fixture();
      const get = n => Number(host.querySelector('[name="' + n + '"]').value);
      function draw() {
        host.querySelectorAll('[data-ct-value]').forEach(out => { out.textContent = host.querySelector('[name="' + out.dataset.ctValue + '"]').value; });
        const background = host.dataset.conceptPart === 'background', d = background ? registration(get('shift'), get('correction')) : match(data, get('adjustment'), get('years'), get('error'), get('selected'));
        host.querySelector('[data-ct-graphic]').innerHTML = background ? registrationChart(d) : growthChart(d);
        host.querySelector('[data-ct-result]').textContent = background ? registrationText(d) : growthText(d);
        host.dataset.ctState = JSON.stringify({part: host.dataset.conceptPart, ...d});
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      const align = host.querySelector('[data-ct-align]');
      if (align) align.addEventListener('click', () => { host.querySelector('[name="correction"]').value = fmt(get('shift') + .05); draw(); });
      const button = host.querySelector('[data-ct-import]');
      if (button) button.addEventListener('click', () => {
        let s; try { s = g.CaseInspect && g.CaseInspect.snapshot(); } catch (_) {}
        const r = s && s.result, obs = r && r.observations;
        if (!s || !['computed', 'ready'].includes(s.status) || !obs || !Array.isArray(obs.first) || !obs.first.length || !Array.isArray(obs.second) || obs.second.length < obs.first.length || !Array.isArray(r.anchors) || !r.anchors.length) { host.querySelector('[data-ct-source]').textContent = '尚无已计算的本轮观测；保留当前局部数据。请先在可运行示范中计算，再读取。'; return; }
        data = {first: obs.first.map(x => ({x: x.x, depth: x.depth, angle: x.angle, len: x.len})), second: obs.second.map(x => ({x: x.x, depth: x.depth, angle: x.angle, len: x.len})), anchors: r.anchors.map(a => ({old: a.old, now: a.now})), source: 'CaseInspect本轮缺陷观测与焊缝（' + obs.first.length + '处）'};
        host.querySelector('[name="selected"]').max = String(data.first.length);
        if (s.params && Number.isFinite(s.params.years)) host.querySelector('[name="years"]').value = s.params.years;
        host.querySelector('[data-ct-source]').textContent = '已读取本轮首次/二次观测与5处焊缝；未读取evaluationTruth。当前控件在这组冻结观测上重算。';
        draw();
      });
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { data = fixture(); host.querySelectorAll('input').forEach(el => { el.value = el.defaultValue; }); const selected = host.querySelector('[name="selected"]'); if (selected) { selected.max = '7'; host.querySelector('[data-ct-source]').textContent = '已恢复本例7处缺陷的局部数值教学。'; } draw(); });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = {backgroundAfter: 1, workflowAfter: 2, backgroundHTML, workflowHTML, mount};
})(globalThis);
