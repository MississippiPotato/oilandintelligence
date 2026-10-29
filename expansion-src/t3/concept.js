(function (g) {
  'use strict';
  const scene = 't3', red = '#B8242A', blue = '#55768B', gold = '#B08A4A';
  const fmt = (x, n = 2) => Number(x).toFixed(n);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style = '<style>[data-concept-scene="t3"]{font-size:18px;line-height:1.65;min-width:0}[data-concept-scene="t3"] .ct-chart{overflow-x:auto;max-width:100%}[data-concept-scene="t3"] svg{display:block;width:100%;min-width:760px}[data-concept-scene="t3"] figcaption,[data-concept-scene="t3"] label{font-size:16px}[data-concept-scene="t3"] input,[data-concept-scene="t3"] select,[data-concept-scene="t3"] button{min-height:42px}</style>';
  const fittedStyle = "<style>[data-concept-scene=\"t3\"].ct-widget p{font-size:18px}[data-concept-scene=\"t3\"].ct-widget .ct-controls :is(input,select,button){min-height:44px}[data-concept-scene=\"t3\"].ct-widget .ct-controls input[type=range]{height:44px}[data-concept-scene=\"t3\"].ct-widget .ct-chart>svg{display:block;width:100%;min-width:760px;max-width:none;max-height:none;height:auto;margin:0}</style>";
  const wrap = (h, height, label) => '<div class="ct-chart"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + height + '" role="img" aria-label="' + esc(label) + '"><rect width="760" height="' + height + '" fill="#F7F4EF"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16" fill="#383431">' + h + '</g></svg></div>';
  function calc(demand, head, n, s) {
    const q = demand / n, H = 70 * s * s - .0008 * q * q, eta = Math.max(.38, .82 - .000018 * (q - 125 * s) ** 2 - .12 * (s - 1) ** 2), flowOK = q >= 55 * s && q <= 230 * s, headOK = H >= head;
    return {n, s, q, H, eta, power: 850 * 9.81 * (demand / 3600) * Math.max(0, H) / eta / 1000, flowOK, headOK, feasible: flowOK && headOK};
  }
  function pump(demand, head, n, speed) { return {demand, head, n, speed, ...calc(demand, head, n, speed), minFlow: n * 55 * speed, maxFlow: n * 230 * speed}; }
  function pumpChart(d) {
    const x = q => 72 + q / 800 * 650, y = h => 320 - h / 100 * 260;
    let h = '<text x="72" y="27">泵组供给曲线与可用范围 · 总流量 Q（并联后相加）</text>';
    h += '<rect x="' + x(d.minFlow) + '" y="' + y(100) + '" width="' + (x(d.maxFlow) - x(d.minFlow)) + '" height="' + (y(d.head) - y(100)) + '" fill="' + blue + '" opacity=".12"/>';
    [0, 20, 40, 60, 80, 100].forEach(v => { h += '<path d="M72 ' + y(v) + 'H722" stroke="#DDD6CC"/><text x="61" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>'; });
    [0, 200, 400, 600, 800].forEach(v => { h += '<path d="M' + x(v) + ' 60V320" stroke="#E6E0D7"/><text x="' + x(v) + '" y="347" text-anchor="middle">' + v + '</text>'; });
    const ps = Array.from({length: 161}, (_, i) => ({q: i * 5, h: 70 * d.speed ** 2 - .0008 * (i * 5 / d.n) ** 2})).filter(p => p.h >= 0);
    h += '<path d="' + ps.map((p, i) => (i ? 'L' : 'M') + fmt(x(p.q), 1) + ' ' + fmt(y(p.h), 1)).join(' ') + '" fill="none" stroke="' + red + '" stroke-width="3.5"/>';
    h += '<path d="M72 ' + y(d.head) + 'H722" stroke="' + gold + '" stroke-width="2" stroke-dasharray="7 5"/><path d="M' + x(d.demand) + ' 60V320" stroke="' + blue + '" stroke-width="2" stroke-dasharray="4 5"/>';
    h += '<circle cx="' + x(d.demand) + '" cy="' + y(Math.max(0, d.H)) + '" r="7" fill="' + (d.feasible ? red : '#F7F4EF') + '" stroke="' + red + '" stroke-width="3"/>';
    h += '<text x="80" y="389">蓝灰区域：' + fmt(d.minFlow, 1) + '≤Q≤' + fmt(d.maxFlow, 1) + ' m³/h 且 H≥' + d.head + ' m</text><text x="80" y="423">扬程 H（m）；朱红点为空心时至少违反一项约束</text>';
    return wrap(h, 446, '并联台数、转速和需求如何改变泵曲线、可用流量区间及最低扬程约束');
  }
  function pumpText(d) {
    return d.n + ' 台并联，每台 q=' + fmt(d.q, 1) + ' m³/h；转速比 ' + fmt(d.speed) + '，产生扬程 ' + fmt(d.H, 1) + ' m。流量区间' + (d.flowOK ? '满足' : '不满足') + '，最低扬程' + (d.headOK ? '满足' : '不满足') + '，' + (d.feasible ? '该需求点可行' : '该需求点不可行') + '。总效率 ' + fmt(d.eta * 100, 1) + '%，曲线对应电功率 ' + fmt(d.power, 1) + ' kW' + (d.H <= 0 ? '（负扬程部分按0截断，仅为公式输出，不能作为可运行方案）' : '') + '。多余扬程在本例由阀门节流消耗。';
  }
  function search(demand, head, price, source) {
    const candidates = [];
    for (let n = 1; n <= 3; n++) for (let k = 65; k <= 115; k++) candidates.push(calc(demand, head, n, k / 100));
    const feasible = candidates.filter(c => c.feasible).sort((a, b) => a.power - b.power), bases = [1, 2, 3].map(n => calc(demand, head, n, 1)).filter(c => c.feasible).sort((a, b) => a.power - b.power), best = feasible[0] || null, base = bases[0] || null;
    return {source, demand, head, price, candidates, feasibleCount: feasible.length, best, base, dailyCost: best ? best.power * 24 * price : null, baselineDailyCost: base ? base.power * 24 * price : null, savingPercent: best && base ? 100 * (base.power - best.power) / base.power : null};
  }
  function symbol(c, x, y, size, color, fill) {
    const attrs = ' fill="' + (fill || color) + '" stroke="' + color + '" stroke-width="1.3"';
    if (c.n === 1) return '<circle cx="' + x + '" cy="' + y + '" r="' + size + '"' + attrs + '/>';
    if (c.n === 2) return '<rect x="' + (x - size) + '" y="' + (y - size) + '" width="' + (size * 2) + '" height="' + (size * 2) + '"' + attrs + '/>';
    return '<path d="M' + x + ' ' + (y - size * 1.3) + 'L' + (x + size * 1.3) + ' ' + y + 'L' + x + ' ' + (y + size * 1.3) + 'L' + (x - size * 1.3) + ' ' + y + 'Z"' + attrs + '/>';
  }
  function searchChart(d) {
    const maxH = 100, maxP = Math.max(80, ...d.candidates.map(c => c.power)) * 1.07, x = v => 75 + v / maxH * 643, y = v => 327 - v / maxP * 265;
    let h = '<text x="75" y="28">同一输量下枚举153个泵组方案 · 功率 kW</text><rect x="' + x(d.head) + '" y="62" width="' + (x(100) - x(d.head)) + '" height="265" fill="' + blue + '" opacity=".09"/>';
    [0, 1, 2, 3, 4].forEach(i => { const v = maxP * i / 4; h += '<path d="M75 ' + y(v) + 'H718" stroke="#DDD6CC"/><text x="64" y="' + (y(v) + 5) + '" text-anchor="end">' + fmt(v, 0) + '</text>'; });
    [0, 20, 40, 60, 80, 100].forEach(v => { h += '<text x="' + x(v) + '" y="353" text-anchor="middle">' + v + '</text>'; });
    d.candidates.forEach(c => { const cx = x(Math.max(0, c.H)), cy = y(c.power); h += c.feasible ? symbol(c, cx, cy, 3.4, [red, blue, gold][c.n - 1]) : '<path d="M' + (cx - 2.5) + ' ' + (cy - 2.5) + 'l5 5m0 -5l-5 5" stroke="#BEB5A9" stroke-width="1.2"/>'; });
    h += '<path d="M' + x(d.head) + ' 56V327" stroke="' + gold + '" stroke-width="2" stroke-dasharray="6 5"/>';
    if (d.base) h += '<circle cx="' + x(d.base.H) + '" cy="' + y(d.base.power) + '" r="9" fill="none" stroke="#393431" stroke-width="2" stroke-dasharray="4 3"/>';
    if (d.best) h += '<circle cx="' + x(d.best.H) + '" cy="' + y(d.best.power) + '" r="10" fill="none" stroke="' + red + '" stroke-width="3"/>';
    h += '<text x="396" y="387" text-anchor="middle">产生扬程 H（m）；H&lt;0的不可行点压在横轴0处</text><text x="75" y="423">圆：1台　方：2台　菱：3台　灰叉：不可行</text><text x="75" y="455">朱红外圈：最低功率　黑色虚圈：固定额定转速基线</text>';
    return wrap(h, 478, '扬程功率共同坐标中先排除不可行方案再寻找最低功率');
  }
  function searchText(d) {
    if (!d.best) return '153 个候选中有 ' + d.feasibleCount + ' 个可行点；没有可行方案，不能给出最优费用或节能百分比。请回查最低扬程与单泵流量能力。数据：' + d.source + '。';
    return '可行 ' + d.feasibleCount + '/153；最低功率方案 ' + d.best.n + ' 台、转速 ' + fmt(d.best.s) + '、H=' + fmt(d.best.H, 1) + ' m、P=' + fmt(d.best.power, 1) + ' kW，日费用 ' + fmt(d.dailyCost, 0) + ' 元。' + (d.base ? '相同约束下额定基线 ' + d.base.n + ' 台、' + fmt(d.base.power, 1) + ' kW（' + fmt(d.baselineDailyCost, 0) + ' 元/日），功率降低 ' + fmt(d.savingPercent, 1) + '%。' : '额定转速基线无可行解，不报告节能百分比。') + '电价对全部方案相同且为正，只缩放费用，不改变最低功率的方案。数据：' + d.source + '。';
  }
  function field(n, label, min, max, step, value) { return '<label>' + label + ' <output data-ct-value="' + n + '">' + value + '</output><input disabled name="' + n + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const b0 = pump(280, 38, 2, .9), w0 = search(280, 38, .7, '沿用本例泵曲线、效率和约束的局部枚举');
  const backgroundHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t3" data-concept-part="background"><h3>多开一台泵，与把转速调高，是同一回事吗？</h3><p>并联后总流量Q相加，但每台仍在 q=Q/n 的工况上。沿用 H=70s²−0.0008q²、55s≤q≤230s；蓝灰区域给出同时满足单泵可用流量和最低扬程的范围。只看扬程够不够，会漏掉流量约束。</p><div class="ct-controls"><label>并联泵数（台）<select disabled name="n"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option></select></label>' + field('speed', '相对额定转速 s', .65, 1.15, .01, .9) + field('demand', '计划总流量（m³/h）', 140, 420, 10, 280) + field('head', '最低所需扬程（m）', 20, 65, 1, 38) + '<button disabled type="button" data-ct-reset>恢复默认</button></div><figure><div data-ct-graphic>' + pumpChart(b0) + '</div><figcaption>朱红曲线：当前泵数与转速的供给；蓝灰竖虚线：需求流量；赭金横虚线：最低扬程。背景仅为本例教学曲线，不是具体泵厂的性能保证。</figcaption></figure><p class="ct-readout" data-ct-result>' + pumpText(b0) + '</p></section>';
  const workflowHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t3" data-concept-part="workflow"><h3>先把不可行点划掉，再在同一任务里比较功率</h3><p>枚举1～3台泵与0.65～1.15的51档转速。每个点都先检查扬程和单泵流量，随后按本例总效率计算 P=850×9.81×(Q/3600)×H/η/1000。流量先换成m³/s，功率再从W换成kW。</p><div class="ct-controls">' + field('demand', '计划总流量（m³/h）', 140, 420, 10, 280) + field('head', '最低所需扬程（m）', 20, 65, 1, 38) + field('price', '电价（元/kWh）', .3, 1.5, .05, .7) + '<button disabled type="button" data-ct-import>读取本轮示范需求</button><button disabled type="button" data-ct-reset>恢复默认</button></div><p data-ct-source class="ct-readout">当前按默认需求重新枚举；可读取主示范已计算的任务参数。</p><figure><div data-ct-graphic>' + searchChart(w0) + '</div><figcaption>扬程右侧的点仍可能违反单泵流量约束；只有彩色点进入寻优。基线与调速方案接受完全相同的需求和约束。</figcaption></figure><p class="ct-readout" data-ct-result>' + searchText(w0) + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="t3"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => { el.disabled = false; });
      let source = '沿用本例泵曲线、效率和约束的局部枚举';
      const get = n => Number(host.querySelector('[name="' + n + '"]').value);
      function draw() {
        host.querySelectorAll('[data-ct-value]').forEach(out => { out.textContent = host.querySelector('[name="' + out.dataset.ctValue + '"]').value; });
        const background = host.dataset.conceptPart === 'background', d = background ? pump(get('demand'), get('head'), get('n'), get('speed')) : search(get('demand'), get('head'), get('price'), source);
        host.querySelector('[data-ct-graphic]').innerHTML = background ? pumpChart(d) : searchChart(d); host.querySelector('[data-ct-result]').textContent = background ? pumpText(d) : searchText(d);
        host.dataset.ctState = JSON.stringify({part: host.dataset.conceptPart, ...d});
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      const button = host.querySelector('[data-ct-import]');
      if (button) button.addEventListener('click', () => {
        let s; try { s = g.CaseInspect && g.CaseInspect.snapshot(); } catch (_) {}
        if (!s || !['computed', 'ready'].includes(s.status) || !s.result || !Array.isArray(s.result.candidates) || !s.params || !['demand', 'head', 'price'].every(k => Number.isFinite(s.params[k]))) { host.querySelector('[data-ct-source]').textContent = '尚无已计算的本轮需求；保留当前枚举。请先在可运行示范中计算。'; return; }
        ['demand', 'head', 'price'].forEach(n => { host.querySelector('[name="' + n + '"]').value = s.params[n]; });
        source = 'CaseInspect本轮任务参数；按原公式重新枚举153候选'; host.querySelector('[data-ct-source]').textContent = '已读取本轮输量、最低扬程与电价；当前点集由相同公式重新计算。'; draw();
      });
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { source = '沿用本例泵曲线、效率和约束的局部枚举'; host.querySelectorAll('input,select').forEach(el => { el.value = el.tagName === 'SELECT' ? '2' : el.defaultValue; }); const note = host.querySelector('[data-ct-source]'); if (note) note.textContent = '已恢复默认需求的局部枚举。'; draw(); });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = {backgroundAfter: 1, workflowAfter: 2, backgroundHTML, workflowHTML, mount};
})(globalThis);
