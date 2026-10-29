(function (g) {
  'use strict';
  const scene = 't1', red = '#B8242A', blue = '#55768B', gold = '#B08A4A';
  const fmt = (x, n = 2) => Number(x).toFixed(n);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const path = (a, x, y) => a.map((v, i) => (i ? 'L' : 'M') + fmt(x(i), 1) + ' ' + fmt(y(v), 1)).join(' ');
  const style = '<style>[data-concept-scene="t1"]{font-size:18px;line-height:1.65;min-width:0}[data-concept-scene="t1"] .ct-chart{overflow-x:auto;max-width:100%}[data-concept-scene="t1"] svg{display:block;width:100%;min-width:760px}[data-concept-scene="t1"] figcaption,[data-concept-scene="t1"] label{font-size:16px}[data-concept-scene="t1"] input,[data-concept-scene="t1"] select,[data-concept-scene="t1"] button{min-height:42px}[data-concept-scene="t1"] .ct-key{font-size:16px}</style>';
  const fittedStyle = '<style>[data-concept-scene="t1"].ct-widget p{font-size:18px}[data-concept-scene="t1"].ct-widget .ct-controls :is(input,select,button){min-height:44px}[data-concept-scene="t1"].ct-widget .ct-controls input[type=range]{height:44px}[data-concept-scene="t1"].ct-widget .ct-chart>svg{display:block;width:100%;min-width:760px;max-width:none;max-height:none;height:auto;margin:0}</style>';
  const wrap = (body, height, label) => '<div class="ct-chart"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + height + '" role="img" aria-label="' + esc(label) + '"><rect width="760" height="' + height + '" fill="#F7F4EF"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16" fill="#383431">' + body + '</g></svg></div>';
  function panel(y0, height, lo, hi, title, ticks) {
    const x = i => 72 + i / 39 * 650, y = v => y0 + height - (v - lo) / (hi - lo) * height;
    let html = '<text x="72" y="' + (y0 - 14) + '">' + title + '</text>';
    ticks.forEach(v => { html += '<path d="M72 ' + y(v) + 'H722" stroke="#DDD6CC"/><text x="62" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>'; });
    [0, 8, 16, 24, 32, 39].forEach(i => { html += '<path d="M' + x(i) + ' ' + y0 + 'V' + (y0 + height) + '" stroke="#E6E0D7"/>'; });
    return {x, y, html};
  }
  function balance(step, loss) {
    const rows = Array.from({length: 40}, (_, t) => ({t, qi: 170 + 8 * Math.sin(t / 7) + (t >= 8 && t < 16 ? step : 0)}));
    rows.forEach((r, i) => { r.dq = i ? r.qi - rows[i - 1].qi : 0; r.expected = r.qi - .46 * r.dq; r.qo = r.expected - (i >= 23 && i < 33 ? loss : 0); r.raw = r.qi - r.qo; r.residual = r.expected - r.qo; r.pressure = .018 * r.residual; });
    return {step, loss, rows, storagePeak: Math.max(...rows.map(r => Math.abs(.46 * r.dq))), residualVolume: rows.reduce((s, r) => s + r.residual / 60, 0)};
  }
  function balanceChart(d) {
    const a = panel(52, 130, 140, 225, '同一时间轴 · 流量 m³/h', [140, 180, 220]);
    const b = panel(245, 100, -16, 20, '流量差与库存补偿后残差 m³/h', [-15, 0, 15]);
    const c = panel(408, 88, 0, .24, '另一条测量链 · 出口压力正向残差 MPa', [0, .12, .24]);
    let html = a.html + b.html + c.html;
    const line = (p, key, color, dash) => '<path d="' + path(d.rows.map(r => r[key]), p.x, p.y) + '" fill="none" stroke="' + color + '" stroke-width="3"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
    html += line(a, 'qi', blue) + line(a, 'expected', gold, '7 5') + line(a, 'qo', red);
    html += line(b, 'raw', gold, '7 5') + line(b, 'residual', red) + line(c, 'pressure', blue);
    [8, 23].forEach((t, i) => { html += '<path d="M' + a.x(t) + ' 42V496" stroke="' + (i ? red : blue) + '" opacity=".45" stroke-dasharray="3 5"/>'; });
    [0, 8, 16, 24, 32, 39].forEach(t => { html += '<text x="' + a.x(t) + '" y="520" text-anchor="middle">' + t + '</text>'; });
    html += '<text x="400" y="549" text-anchor="middle">两端已对时 · min；t=8 加负荷，t=23–32 施加教学损失</text>';
    return wrap(html, 570, '同一时间轴上的进出口流量、库存补偿流量残差和压力残差');
  }
  function balanceText(d) {
    return '负荷阶跃 ' + fmt(d.step, 0) + ' m³/h；短时库存项最大 ' + fmt(d.storagePeak) + ' m³/h。补偿后，设定损失段的流量残差为 ' + fmt(d.loss) + ' m³/h，压力残差为 ' + fmt(.018 * d.loss, 3) + ' MPa；40 个一分钟区间的正残差积分为 ' + fmt(d.residualVolume) + ' m³。这里积分的是教学残差，仍需核查仪表与工况。';
  }
  function confirmation(threshold, window, hold) {
    const q = Array.from({length: 32}, (_, i) => .12 * Math.sin(i * 1.7) + (i === 5 ? 4 : 0) + (i >= 15 && i < 24 ? 3.4 + .2 * Math.sin(i) : 0));
    const p = q.map((_, i) => .002 * Math.cos(i) + (i >= 15 && i < 24 ? .060 : 0));
    const raw = q.map((v, i) => Math.hypot(Math.max(0, v / .35), Math.max(0, p[i] / .012)));
    const score = raw.map((_, i) => mean(raw.slice(Math.max(0, i - window + 1), i + 1)));
    const flags = score.map(v => v >= threshold), events = [];
    let start = -1;
    for (let i = 0; i <= flags.length; i++) {
      if (flags[i]) { if (start < 0) start = i; }
      else if (start >= 0) { if (i - start >= hold) events.push({firstCross: start, confirmedAt: start + hold - 1, endExclusive: i, exceedances: i - start}); start = -1; }
    }
    return {threshold, window, hold, raw, score, flags, events, residualQ: q, residualP: p};
  }
  function confirmationChart(d) {
    const x = i => 72 + i / 31 * 650, y = v => 252 - v / 16 * 192;
    let h = '<text x="72" y="30">由观测残差得到的无量纲分数</text>';
    [0, 4, 8, 12, 16].forEach(v => { h += '<path d="M72 ' + y(v) + 'H722" stroke="#DDD6CC"/><text x="60" y="' + (y(v) + 5) + '" text-anchor="end">' + v + '</text>'; });
    h += '<path d="' + path(d.raw, x, y) + '" fill="none" stroke="' + blue + '" stroke-width="2" stroke-dasharray="4 4"/><path d="' + path(d.score, x, y) + '" fill="none" stroke="' + red + '" stroke-width="3"/>';
    h += '<path d="M72 ' + y(d.threshold) + 'H722" stroke="' + gold + '" stroke-width="2" stroke-dasharray="8 5"/><text x="728" y="' + (y(d.threshold) + 5) + '">' + d.threshold + '</text>';
    h += '<text x="72" y="298">超阈点与确认时间</text>';
    d.flags.forEach((flag, i) => { h += '<circle cx="' + x(i) + '" cy="326" r="4" fill="' + (flag ? red : '#CEC6BA') + '"/>'; });
    d.events.forEach(e => { h += '<rect x="' + x(e.confirmedAt) + '" y="347" width="' + Math.max(5, x(e.endExclusive - 1) - x(e.confirmedAt) + 8) + '" height="21" fill="' + red + '"/><text x="' + x(e.confirmedAt) + '" y="393" text-anchor="middle">' + e.confirmedAt + ' min确认</text>'; });
    [0, 5, 10, 15, 20, 25, 31].forEach(i => { h += '<text x="' + x(i) + '" y="280" text-anchor="middle">' + i + '</text>'; });
    h += '<text x="400" y="427" text-anchor="middle">观测片段时间 min；确认时刻 = 首次超阈 + 连续点数 − 1</text>';
    return wrap(h, 448, '因果平滑与持续点数如何把超阈点合成为待核查事件');
  }
  function confirmationText(d) {
    return '因果 ' + d.window + ' 点均值，阈值 ' + fmt(d.threshold, 1) + '，连续 ' + d.hold + ' 点确认：' + d.flags.filter(Boolean).length + ' 个超阈点，形成 ' + d.events.length + ' 段待核查事件。' + (d.events.length ? d.events.map(e => '首次超阈 ' + e.firstCross + ' min → ' + e.confirmedAt + ' min 确认，结束边界 ' + e.endExclusive + ' min').join('；') + '。' : '当前规则下没有完成持续确认的时段。') + '这个操作不计算事件准确率，也不访问独立参考窗。';
  }
  function field(name, label, min, max, step, value) { return '<label>' + label + ' <output data-ct-value="' + name + '">' + value + '</output><input disabled name="' + name + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>'; }
  const b0 = balance(20, 7), w0 = confirmation(6, 3, 3);
  const backgroundHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t1" data-concept-part="background"><h3>入口调大以后，进出口流量差是否就等于泄漏？</h3><p>把两端流量放在同一参考状态和一分钟时间格上。局部数值沿用本例的正常关系：预期出口 = 入口 − 0.46×入口变化量；短时库存项随调节出现正负响应。出口压力残差单列在相同时间轴，保留 MPa 单位。</p><div class="ct-controls">' + field('step', '入口负荷阶跃（m³/h）', 0, 30, 1, 20) + field('loss', '教学损失幅度（m³/h）', 0, 12, .5, 7) + '<button disabled type="button" data-ct-reset>恢复默认</button></div><figure><div data-ct-graphic>' + balanceChart(b0) + '</div><figcaption>蓝灰：入口或压力残差；朱红：出口实测或库存补偿残差；赭金虚线：正常预期或未补偿流量差。数值是本例关系的局部教学片段，不是现场泄漏定位结果。</figcaption></figure><p class="ct-readout" data-ct-result>' + balanceText(b0) + '</p></section>';
  const workflowHTML = style + fittedStyle + '<section class="ct-widget" data-concept-scene="t1" data-concept-part="workflow"><h3>一次偏差点，怎样成为一段需要核查的事件？</h3><p>固定32个观测残差：包含一次流量短脉冲与一段双通道持续偏离。分数由正向流量残差/0.35 m³/h、压力残差/0.012 MPa 的平方和开方得到。改变平滑与持续确认，检查短脉冲和持续偏离的不同命运。</p><div class="ct-controls">' + field('threshold', '分数阈值（无量纲）', 2, 14, .5, 6) + '<label>因果均值窗口（点）<select disabled name="window"><option value="1">1</option><option value="3" selected>3</option><option value="5">5</option></select></label>' + field('hold', '连续超阈才确认（点）', 1, 5, 1, 3) + '<button disabled type="button" data-ct-reset>恢复默认</button></div><figure><div data-ct-graphic>' + confirmationChart(w0) + '</div><figcaption>蓝灰虚线为逐点分数，朱红为当前因果均值，赭金为阈值；下方朱红带从完成持续确认的时刻开始。主示范固定采用3点平滑、3点确认，此处改变规则帮助理解该步骤。</figcaption></figure><p class="ct-readout" data-ct-result>' + confirmationText(w0) + '</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="t1"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button').forEach(el => { el.disabled = false; });
      function draw() {
        const get = n => Number(host.querySelector('[name="' + n + '"]').value);
        host.querySelectorAll('[data-ct-value]').forEach(out => { out.textContent = host.querySelector('[name="' + out.dataset.ctValue + '"]').value; });
        const background = host.dataset.conceptPart === 'background', d = background ? balance(get('step'), get('loss')) : confirmation(get('threshold'), get('window'), get('hold'));
        host.querySelector('[data-ct-graphic]').innerHTML = background ? balanceChart(d) : confirmationChart(d);
        host.querySelector('[data-ct-result]').textContent = background ? balanceText(d) : confirmationText(d);
        host.dataset.ctState = JSON.stringify({source: '本例局部数值教学', part: host.dataset.conceptPart, ...d});
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { host.querySelectorAll('input,select').forEach(el => { el.value = el.tagName === 'SELECT' ? '3' : el.defaultValue; }); draw(); });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = {backgroundAfter: 0, workflowAfter: 3, backgroundHTML, workflowHTML, mount};
})(globalThis);
