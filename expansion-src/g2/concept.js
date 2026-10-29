(function (g) {
  'use strict';
  const scene = 'g2', red = '#B8242A', blue = '#55768B', gold = '#B08A4A', ink = '#283D45';
  const f = (v, n = 3) => Number(v).toFixed(n), mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  function inverse(a) {
    const n = a.length, m = a.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => +(i === j))));
    for (let i = 0; i < n; i++) {
      let k = i; for (let j = i + 1; j < n; j++) if (Math.abs(m[j][i]) > Math.abs(m[k][i])) k = j;
      [m[i], m[k]] = [m[k], m[i]]; const d = m[i][i] || 1e-9;
      for (let j = 0; j < 2 * n; j++) m[i][j] /= d;
      for (let k = 0; k < n; k++) if (k !== i) { const v = m[k][i]; for (let j = 0; j < 2 * n; j++) m[k][j] -= v * m[i][j]; }
    }
    return m.map(row => row.slice(n));
  }
  // Original G2Core synthetic sampling, kept pure for the static default chart.
  function samples(seed, n, organic, test) {
    let s = seed; const random = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296), rows = [];
    for (let i = 0; i < n; i++) {
      const x = random() * 10, y = random() * 8, z = random() + random() + random() - 1.5, soil = random() * organic;
      const anomaly = test && Math.hypot(x - 6.2, y - 4) < 1.65;
      const c1 = 2 + z * .4 + soil + (anomaly ? 1.3 : 0) + random() * .1;
      const c2 = .35 + z * .08 + (anomaly ? .32 : 0) + random() * .05;
      const c3 = .12 + z * .035 + (anomaly ? .16 : 0) + random() * .02;
      rows.push({ id: i, x, y, values: [c1, c2, c3] });
    }
    return rows;
  }
  function background(organic = 1.8) {
    const rows = samples(101, 260, organic, false), mu = [0, 1, 2].map(j => mean(rows.map(r => r.values[j])));
    const covariance = mu.map((_, j) => mu.map((_, k) => mean(rows.map(r => (r.values[j] - mu[j]) * (r.values[k] - mu[k]))) + (j === k ? .0001 : 0)));
    return { rows, mu, covariance, precision: inverse(covariance), sd: Math.sqrt(covariance[0][0]) };
  }
  function distance(values, mu, precision) { const d = values.map((v, j) => v - mu[j]); return Math.sqrt(Math.max(0, d.reduce((s, v, j) => s + v * precision[j].reduce((a, q, k) => a + q * d[k], 0), 0))); }
  const bg = background();
  function fixture() {
    return { rows: samples(733, 180, 1.8, true).map(r => ({ ...r, score: distance(r.values, bg.mu, bg.precision), baselineScore: (r.values[0] - bg.mu[0]) / bg.sd })), params: { seed: 733, organic: 1.8 }, threshold: 3.3 };
  }
  const defaultResult = fixture();
  function svg(body, h, label) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="min-width:700px;width:100%;font:16px system-ui,Microsoft YaHei,sans-serif;fill:' + ink + '">' + body + '</svg>'; }
  function probe(angle, radius) {
    const a = angle * Math.PI / 180, cov2 = bg.covariance.slice(0, 2).map(row => row.slice(0, 2)), sd = [Math.sqrt(cov2[0][0]), Math.sqrt(cov2[1][1])];
    const values = [bg.mu[0] + radius * sd[0] * Math.cos(a), bg.mu[1] + radius * sd[1] * Math.sin(a)];
    return { angle, radius, values, d2: distance(values, bg.mu.slice(0, 2), inverse(cov2)), z1: (values[0] - bg.mu[0]) / sd[0], correlation: cov2[0][1] / sd[0] / sd[1], sd, cov2 };
  }
  function ellipseChart(p) {
    const lower = [Math.min(.2, p.values[0] - .3), Math.min(.05, p.values[1] - .04)], upper = [Math.max(5.2, p.values[0] + .4), Math.max(.62, p.values[1] + .05)];
    const px = v => 68 + (v - lower[0]) / (upper[0] - lower[0]) * 436, py = v => 290 - (v - lower[1]) / (upper[1] - lower[1]) * 237;
    let a = '<rect width="760" height="365" fill="#F7F4EF"/><text x="32" y="28">C1–C2 的背景关系：260个独立背景点</text>';
    for (let t = 0; t <= 4; t++) {
      const x = lower[0] + t / 4 * (upper[0] - lower[0]), y = lower[1] + t / 4 * (upper[1] - lower[1]);
      a += '<path d="M' + px(x) + ' 53v237M68 ' + py(y) + 'h436" stroke="#DED8CF"/><text x="' + (px(x) - 15) + '" y="314">' + f(x, 1) + '</text><text x="15" y="' + (py(y) + 5) + '">' + f(y, 2) + '</text>';
    }
    [3, 2, 1].forEach(r => {
      const points = Array.from({ length: 97 }, (_, j) => {
        const a = j / 96 * Math.PI * 2, c = p.cov2[0][1] / p.sd[0], x = bg.mu[0] + r * p.sd[0] * Math.cos(a), y = bg.mu[1] + r * (c * Math.cos(a) + Math.sqrt(p.cov2[1][1] - c * c) * Math.sin(a));
        return px(x) + ',' + py(y);
      }).join(' ');
      a += '<polygon points="' + points + '" fill="' + blue + '" fill-opacity=".035" stroke="' + blue + '" stroke-width="1.5" stroke-dasharray="' + (r === 3 ? '6 4' : '0') + '"/>';
    });
    bg.rows.forEach(r => { a += '<circle cx="' + px(r.values[0]) + '" cy="' + py(r.values[1]) + '" r="2.5" fill="' + blue + '" opacity=".45"/>'; });
    a += '<path d="M' + px(bg.mu[0]) + ' ' + py(bg.mu[1]) + 'L' + px(p.values[0]) + ' ' + py(p.values[1]) + '" stroke="' + red + '" stroke-width="3"/><circle cx="' + px(bg.mu[0]) + '" cy="' + py(bg.mu[1]) + '" r="5" fill="' + gold + '"/><circle cx="' + px(p.values[0]) + '" cy="' + py(p.values[1]) + '" r="7" fill="' + red + '"/>';
    a += '<text x="536" y="68">● 红点是可移动探针</text><text x="536" y="103">边际标准化半径 ' + f(p.radius, 1) + '</text><text x="536" y="138">二维联合距离 ' + f(p.d2) + '</text><text x="536" y="173">C1 单指标 z = ' + f(p.z1) + '</text><text x="536" y="208">背景相关系数 ' + f(p.correlation) + '</text><text x="536" y="250">椭圆距离：1、2、3</text><text x="70" y="344">C1 / ppm →；C2 / ppm ↑。本图只解释两个组分；原方法还使用 C3。</text>';
    return svg(a, 365, '真实教学背景点、二维协方差椭圆和可移动浓度探针');
  }
  function thresholdChart(result, threshold, selected) {
    const rows = result.rows, order = rows.map((r, i) => ({ ...r, index: i })).sort((a, b) => a.score - b.score), maximum = Math.max(8, Math.ceil(Math.max(...rows.map(r => r.score)))), q = rows[selected];
    const mx = v => 48 + v / 10 * 294, my = v => 280 - v / 8 * 220, sx = i => 417 + i / Math.max(1, rows.length - 1) * 294, sy = v => 280 - v / maximum * 220;
    let a = '<rect width="760" height="375" fill="#F7F4EF"/><text x="33" y="29">候选回到采样位置</text><text x="402" y="29">同一批距离，从小到大排列</text><path d="M48 53v227h294M417 53v227h294" fill="none" stroke="' + ink + '"/>';
    rows.forEach((r, i) => { a += '<circle data-ct-point="' + i + '" cx="' + mx(r.x) + '" cy="' + my(r.y) + '" r="' + (i === selected ? 7 : 3.4) + '" fill="' + (r.score > threshold ? red : blue) + '" opacity=".8"' + (i === selected ? ' stroke="' + gold + '" stroke-width="4"' : '') + '/>'; });
    a += '<polyline points="' + order.map((r, i) => sx(i) + ',' + sy(r.score)).join(' ') + '" fill="none" stroke="' + blue + '" stroke-width="2.5"/><path d="M417 ' + sy(threshold) + 'h294" stroke="' + red + '" stroke-width="2" stroke-dasharray="7 5"/><text x="422" y="' + (sy(threshold) - 8) + '" fill="' + red + '">阈值 ' + f(threshold, 1) + '</text>';
    const rank = order.findIndex(r => r.index === selected);
    a += '<circle cx="' + sx(rank) + '" cy="' + sy(q.score) + '" r="7" fill="' + gold + '" stroke="#fff" stroke-width="2"/>';
    [0, .5, 1].forEach(t => { a += '<text x="' + (mx(t * 10) - 6) + '" y="306">' + t * 10 + '</text><text x="' + (sx(t * (rows.length - 1)) - 6) + '" y="306">' + Math.round(1 + t * (rows.length - 1)) + '</text><text x="376" y="' + (sy(t * maximum) + 5) + '">' + f(t * maximum, 0) + '</text><text x="15" y="' + (my(t * 8) + 5) + '">' + t * 8 + '</text>'; });
    a += '<text x="47" y="337">东向 / km →；北向 / km ↑</text><text x="416" y="337">排序名次 →；三组分联合距离 ↑</text><text x="32" y="365">朱红：距离 &gt; 阈值；蓝灰：其余点；金圈：同一选中样品。点击空间点可选中。</text>';
    return svg(a, 380, '同一批180个样品的空间候选与排序距离阈值');
  }
  const styles = '<style>[data-concept-scene="g2"]{font-size:18px}[data-concept-scene="g2"] .ct-chart{overflow-x:auto}[data-concept-scene="g2"] label{display:inline-flex;flex-direction:column;gap:6px;margin:8px 18px 8px 0}[data-concept-scene="g2"] input,[data-concept-scene="g2"] button{font:inherit;min-height:40px}[data-concept-scene="g2"] [data-ct-point]{cursor:pointer}[data-concept-scene="g2"] .ct-readout{line-height:1.7}</style>';
  const p0 = probe(45, 2), count0 = defaultResult.rows.filter(r => r.score > 3.3).length;
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="g2" data-concept-part="background">' + styles + '<h3>相同的标准化步幅，沿背景方向与横穿背景为何不同？</h3><p>这里先拿 C1 与 C2 两个组分练习“共同变化”。探针以各组分背景标准差为尺，保持半径时只转方向；观察它离背景椭圆有多远。椭圆与散点来自本例260个背景标定点，二维距离只用于解释协方差。</p><div class="ct-controls"><label>探针方向（标准化坐标，°）<input disabled data-ct-key="angle" type="range" min="0" max="180" step="5" value="45"></label><label>边际标准化半径<input disabled data-ct-key="radius" type="range" min="0" max="4" step="0.1" value="2"></label><button disabled data-ct-action="reset" type="button">复位</button></div><div class="ct-chart" data-ct-graphic>' + ellipseChart(p0) + '</div><p class="ct-readout" data-ct-result>默认探针：C1 ' + f(p0.values[0]) + ' ppm、C2 ' + f(p0.values[1]) + ' ppm；二维联合距离 ' + f(p0.d2) + '。转到135°并保持半径2，比较横穿共同变化关系时的距离。</p><p>原三组分方法与本二维示教分别计算；二维图不能替代 C1–C3 的联合分数。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="g2" data-concept-part="workflow"><h3>只移动阈值，会改变浓度、距离，还是候选清单？</h3><p>保持这180个样品的浓度与背景模型，直接沿已算好的距离移动阈值。左图定位，右图数出越过门槛的样品。选中同一编号，核对 C3 也确实进入原三维评分。</p><div class="ct-controls"><label>联合距离阈值<input disabled data-ct-key="threshold" type="range" min="0.8" max="8" step="0.1" value="3.3"></label><label>样品编号（1–180）<input disabled data-ct-key="point" type="range" min="1" max="180" value="1"></label><button disabled data-ct-action="read" type="button">读取当前演示结果</button><button disabled data-ct-action="reset" type="button">复位</button></div><div class="ct-chart" data-ct-graphic>' + thresholdChart(defaultResult, 3.3, 0) + '</div><p class="ct-readout" data-ct-result>固定种子733的180个教学样品，阈值3.3时有 ' + count0 + ' 个候选；样品1三组分浓度为 [' + defaultResult.rows[0].values.map(v => f(v)).join(', ') + '] ppm，联合距离 ' + f(defaultResult.rows[0].score) + '。</p><p data-ct-note>来源：原 G2Core，260个独立背景点与180个独立测试点。这里只重筛候选，不计算或暗示来源判定及新的F1。</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="g2"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button,textarea').forEach(el => { el.disabled = false; });
      const workflow = host.dataset.conceptPart === 'workflow', key = n => host.querySelector('[data-ct-key="' + n + '"]');
      let current = defaultResult, source = '固定种子733、甲烷背景波动1.8的教学样品';
      function draw() {
        if (!workflow) {
          const p = probe(+key('angle').value, +key('radius').value);
          host.querySelector('[data-ct-graphic]').innerHTML = ellipseChart(p);
          host.querySelector('[data-ct-result]').textContent = '方向 ' + p.angle + '°，边际标准化半径 ' + f(p.radius, 1) + '。探针 C1 ' + f(p.values[0]) + ' ppm、C2 ' + f(p.values[1]) + ' ppm；二维联合距离 ' + f(p.d2) + '，C1 单指标 z 为 ' + f(p.z1) + '；背景相关系数 ' + f(p.correlation) + '。沿椭圆长轴的变化获得较小的联合距离。';
          host.dataset.ctState = JSON.stringify({ angle: p.angle, radius: p.radius, concentrations_ppm: p.values, jointDistance2D: p.d2, C1z: p.z1, correlation: p.correlation, backgroundCount: 260 });
        } else {
          const threshold = +key('threshold').value, selected = Math.min(current.rows.length - 1, Math.max(0, +key('point').value - 1)), q = current.rows[selected], candidates = current.rows.filter(r => r.score > threshold).length;
          host.querySelector('[data-ct-graphic]').innerHTML = thresholdChart(current, threshold, selected);
          host.querySelector('[data-ct-result]').textContent = source + '。样品 ' + (selected + 1) + ' 位于 (' + f(q.x, 2) + ', ' + f(q.y, 2) + ') km；C1 / C2 / C3 = ' + q.values.map(v => f(v)).join(' / ') + ' ppm；三维联合距离 ' + f(q.score) + '，C1 z = ' + f(q.baselineScore) + '。阈值 ' + f(threshold, 1) + '，候选 ' + candidates + ' / ' + current.rows.length + '；当前样品' + (q.score > threshold ? '入选' : '未入选') + '。';
          host.dataset.ctState = JSON.stringify({ threshold, selected: selected + 1, source, coordinates_km: [q.x, q.y], concentrations_ppm: q.values, jointDistance3D: q.score, C1z: q.baselineScore, selectedIsCandidate: q.score > threshold, candidates, denominator: current.rows.length, scoresChecksum: current.rows.reduce((s, r) => s + r.score, 0) });
        }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.addEventListener('click', event => {
        const point = event.target.closest('[data-ct-point]');
        if (workflow && point) { key('point').value = Number(point.dataset.ctPoint) + 1; draw(); }
        const action = event.target.closest('[data-ct-action]')?.dataset.ctAction;
        if (action === 'reset') {
          if (workflow) { current = defaultResult; source = '固定种子733、甲烷背景波动1.8的教学样品'; key('threshold').value = 3.3; key('point').value = 1; }
          else { key('angle').value = 45; key('radius').value = 2; }
          draw();
        }
        if (workflow && action === 'read') {
          const s = g.CaseInspect?.snapshot?.(), r = s?.result;
          if (!s || !['ready', 'computed'].includes(s.status || s.state) || !r?.rows?.length) { host.querySelector('[data-ct-note]').textContent = '请先运行原演示；当前接口需提供已完成的样品数组。'; return; }
          current = { rows: r.rows.map(q => ({ id: q.id, x: q.x, y: q.y, values: q.values.slice(), score: q.score, baselineScore: q.baselineScore })) };
          source = '已读取当前演示：种子' + r.params.seed + '、背景波动' + r.params.organic;
          key('point').max = current.rows.length; key('point').value = Number(s.selected || 0) + 1; key('threshold').value = r.threshold;
          host.querySelector('[data-ct-note]').textContent = '已读取当前三维评分及浓度；本控件只改变候选阈值，不修改演示结果和评价。'; draw();
        }
      });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 1, workflowAfter: 2, backgroundHTML, workflowHTML, mount };
})(globalThis);
