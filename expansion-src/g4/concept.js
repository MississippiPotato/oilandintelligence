(function (g) {
  'use strict';
  const scene = 'g4', red = '#B8242A', blue = '#55768B', gold = '#B08A4A', ink = '#283D45', W = 120, H = 80, scale = .1;
  const f = (v, n = 3) => Number(v).toFixed(n), geometry = [{ theta: 25, rho: 43 }, { theta: 25, rho: 72 }, { theta: 110, rho: 14 }, { theta: 110, rho: 38 }];
  function clip(theta, rho) {
    const t = theta * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), a = [];
    for (const x of [0, W - 1]) if (Math.abs(s) > .001) { const y = (rho - x * c) / s; if (y >= 0 && y < H) a.push([x, y]); }
    for (const y of [0, H - 1]) if (Math.abs(c) > .001) { const x = (rho - y * s) / c; if (x >= 0 && x < W) a.push([x, y]); }
    return a.length >= 2 ? [a[0], a[a.length - 1]] : null;
  }
  const idealLines = geometry.map((l, i) => ({ ...l, id: 'L' + (i + 1), ends: clip(l.theta, l.rho).map(p => p.map(v => v * scale)) }));
  function cropSegment(ends, xmin, xmax) {
    const [a, b] = ends, dx = b[0] - a[0], dy = b[1] - a[1]; let lo = 0, hi = 1;
    for (const [p, q] of [[-dx, a[0] - xmin], [dx, xmax - a[0]], [-dy, a[1]], [dy, 8 - a[1]]]) {
      if (Math.abs(p) < 1e-12) { if (q < 0) return null; }
      else if (p < 0) lo = Math.max(lo, q / p); else hi = Math.min(hi, q / p);
      if (lo > hi) return null;
    }
    return [[a[0] + lo * dx, a[1] + lo * dy], [a[0] + hi * dx, a[1] + hi * dy]];
  }
  function windowStats(width, scan) {
    const xmin = (12 - width) / 2, xmax = xmin + width;
    const lines = idealLines.map(l => ({ ...l, cropped: cropSegment(l.ends, xmin, xmax) })).filter(l => l.cropped).map(l => {
      const [a, b] = l.cropped, length = Math.hypot(b[0] - a[0], b[1] - a[1]), crosses = (a[1] - scan) * (b[1] - scan) <= 0;
      return { ...l, length, crosses, intersection: crosses ? a[0] + (scan - a[1]) / (b[1] - a[1]) * (b[0] - a[0]) : null };
    });
    const length = lines.reduce((s, l) => s + l.length, 0), crossings = lines.filter(l => l.crosses).length;
    return { width, scan, xmin, xmax, lines, totalLength_m: length, area_m2: width * 8, crossings, P21: length / (width * 8), P10: crossings / width };
  }
  function svg(body, h, label) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="min-width:700px;width:100%;font:16px system-ui,Microsoft YaHei,sans-serif;fill:' + ink + '">' + body + '</svg>'; }
  function windowChart(s) {
    const px = x => 45 + x * 35, py = y => 56 + y * 35;
    let a = '<rect width="760" height="418" fill="#F7F4EF"/><text x="30" y="28">沿用原例四条固定迹线，重新量测窗口内部分</text><rect x="45" y="56" width="420" height="280" fill="#E2DACD"/>';
    for (let x = 0; x <= 12; x += 2) a += '<path d="M' + px(x) + ' 56v280" stroke="#CBC2B7"/><text x="' + (px(x) - 8) + '" y="362">' + x + '</text>';
    for (let y = 0; y <= 8; y += 2) a += '<path d="M45 ' + py(y) + 'h420" stroke="#CBC2B7"/><text x="17" y="' + (py(y) + 5) + '">' + y + '</text>';
    a += '<rect x="' + px(s.xmin) + '" y="56" width="' + s.width * 35 + '" height="280" fill="#fff" fill-opacity=".65" stroke="' + red + '" stroke-width="2"/>';
    idealLines.forEach(l => { a += '<path d="M' + px(l.ends[0][0]) + ' ' + py(l.ends[0][1]) + 'L' + px(l.ends[1][0]) + ' ' + py(l.ends[1][1]) + '" stroke="' + blue + '" stroke-width="2" opacity=".45"/>'; });
    s.lines.forEach(l => {
      const [a0, b0] = l.cropped;
      a += '<path d="M' + px(a0[0]) + ' ' + py(a0[1]) + 'L' + px(b0[0]) + ' ' + py(b0[1]) + '" stroke="' + red + '" stroke-width="3.5"/><text x="' + (px((a0[0] + b0[0]) / 2) + 5) + '" y="' + (py((a0[1] + b0[1]) / 2) - 8) + '">' + l.id + '</text>';
    });
    a += '<path d="M' + px(s.xmin) + ' ' + py(s.scan) + 'H' + px(s.xmax) + '" stroke="' + gold + '" stroke-width="3" stroke-dasharray="9 5"/>';
    s.lines.filter(l => l.crosses).forEach(l => { a += '<circle cx="' + px(l.intersection) + '" cy="' + py(s.scan) + '" r="6" fill="' + gold + '" stroke="#fff" stroke-width="2"/>'; });
    a += '<text x="500" y="80">P10：沿一条扫描线取样</text><text x="500" y="115">' + s.crossings + ' 个交点 / ' + f(s.width, 1) + ' m</text><text x="500" y="150" fill="' + red + '">= ' + f(s.P10) + ' 个/m</text><text x="500" y="207">P21：在整个窗口取样</text><text x="500" y="242">' + f(s.totalLength_m, 2) + ' m / ' + f(s.area_m2, 1) + ' m²</text><text x="500" y="277" fill="' + red + '">= ' + f(s.P21) + ' m⁻¹</text><text x="500" y="326">金圈逐一计入交点数</text><text x="45" y="392">水平距离 / m →；距照片顶边 / m ↓。框外迹线不计入当前窗口。</text>';
    return svg(a, 420, '可调整观察窗口、扫描线及对应P10和P21的实际分子分母');
  }
  function observation() {
    let s = 1704; const random = () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
    const pixels = Array(W * H).fill(0).map(() => .72 + (random() - .5) * .12);
    geometry.forEach(l => { const t = l.theta * Math.PI / 180; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.abs(x * Math.cos(t) + y * Math.sin(t) - l.rho) < .65) pixels[y * W + x] = Math.max(0, .72 - .5 + (random() - .5) * .12); });
    return { pixels, w: W, h: H, metresPerPixel: scale };
  }
  function accumulator(mask, theta) {
    const t = theta * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), bins = new Map();
    mask.forEach((on, i) => { if (on) { const rho = Math.round(((i % W) * c + Math.floor(i / W) * s) / 2) * 2; bins.set(rho, (bins.get(rho) || 0) + 1); } });
    return bins;
  }
  function predict(o, threshold, minVotes) {
    const mask = o.pixels.map(v => v < threshold), candidates = [];
    for (let theta = 0; theta < 180; theta += 5) for (const [rho, votes] of accumulator(mask, theta)) if (votes >= minVotes && clip(theta, rho)) candidates.push({ theta, rho, votes });
    candidates.sort((a, b) => b.votes - a.votes); const lines = [];
    for (const l of candidates) {
      if (lines.some(v => Math.abs(v.theta - l.theta) < 11 && Math.abs(v.rho - l.rho) < 6)) continue;
      const ends = clip(l.theta, l.rho); lines.push({ ...l, ends, length: Math.hypot(ends[0][0] - ends[1][0], ends[0][1] - ends[1][1]) * scale }); if (lines.length >= 8) break;
    }
    return { mask, lines };
  }
  function hough(o, threshold, minVotes, theta) {
    const prediction = predict(o, threshold, minVotes), bins = accumulator(prediction.mask, theta), entries = Array.from(bins.entries()).sort((a, b) => b[1] - a[1]);
    return { ...prediction, bins, peakRho: entries.length ? entries[0][0] : null, peakVotes: entries.length ? entries[0][1] : 0, theta, threshold, minVotes, maskPixels: prediction.mask.filter(Boolean).length };
  }
  function houghChart(o, s, view) {
    const sx = 2.8, ox = 31, oy = 56, paths = Array(16).fill('');
    if (view === 'gray') {
      // 2×2 mean display; calculations always use all 9,600 original pixels.
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
        const i = y * W + x, value = [i, i + 1, i + W, i + W + 1].reduce((v, j) => v + o.pixels[j], 0) / 4;
        paths[Math.max(0, Math.min(15, Math.round(value * 15)))] += 'M' + (ox + x * sx) + ' ' + (oy + y * sx) + 'h5.6v5.6h-5.6z';
      }
    } else s.mask.forEach((on, i) => { if (on) paths[2] += 'M' + (ox + i % W * sx) + ' ' + (oy + Math.floor(i / W) * sx) + 'h2.8v2.8h-2.8z'; });
    let a = '<rect width="760" height="400" fill="#F7F4EF"/><text x="30" y="28">' + (view === 'gray' ? '原始灰度与本次提取线' : '阈值入选像素与本次提取线') + '</text><rect x="31" y="56" width="336" height="224" fill="#fff"/>';
    paths.forEach((path, j) => { if (path) a += '<path d="' + path + '" fill="rgb(' + [j * 17, j * 17, j * 17].join(',') + ')"/>'; });
    s.lines.forEach(l => { a += '<path d="M' + (ox + l.ends[0][0] * sx) + ' ' + (oy + l.ends[0][1] * sx) + 'L' + (ox + l.ends[1][0] * sx) + ' ' + (oy + l.ends[1][1] * sx) + '" stroke="' + blue + '" stroke-width="2.5"/>'; });
    const peakLine = s.peakRho == null ? null : clip(s.theta, s.peakRho);
    if (peakLine) a += '<path d="M' + (ox + peakLine[0][0] * sx) + ' ' + (oy + peakLine[0][1] * sx) + 'L' + (ox + peakLine[1][0] * sx) + ' ' + (oy + peakLine[1][1] * sx) + '" stroke="' + gold + '" stroke-width="4" stroke-dasharray="7 4"/>';
    const max = Math.max(100, s.peakVotes + 10, s.minVotes + 10), px = rho => 433 + (rho + 120) / 266 * 282, py = v => 280 - v / max * 224, points = [];
    for (let rho = -120; rho <= 146; rho += 2) points.push([px(rho), py(s.bins.get(rho) || 0)]);
    a += '<text x="420" y="28">固定法向角 θ = ' + s.theta + '° 的投票切片</text><path d="M433 56v224h282" fill="none" stroke="' + ink + '"/><path d="M433 280L' + points.map(p => p.join(' ')).join('L') + 'L715 280Z" fill="' + blue + '" fill-opacity=".2"/><polyline points="' + points.map(p => p.join(',')).join(' ') + '" fill="none" stroke="' + blue + '" stroke-width="2"/><path d="M433 ' + py(s.minVotes) + 'h282" stroke="' + red + '" stroke-width="2" stroke-dasharray="6 4"/><text x="437" y="' + (py(s.minVotes) - 8) + '" fill="' + red + '">最低 ' + s.minVotes + ' 票</text>';
    if (s.peakRho != null) a += '<circle cx="' + px(s.peakRho) + '" cy="' + py(s.peakVotes) + '" r="6" fill="' + gold + '"/>';
    [-120, 0, 140].forEach(rho => { a += '<text x="' + (px(rho) - 12) + '" y="306">' + f(rho * .1, 0) + '</text>'; });
    [0, .5, 1].forEach(t => { a += '<text x="390" y="' + (py(t * max) + 5) + '">' + Math.round(t * max) + '</text>'; });
    a += '<text x="31" y="310">12 m × 8 m；蓝线为全角度提取结果</text><text x="430" y="337">法向距离 ρ / m →；票数 / 像素 ↑</text><text x="31" y="365">金色虚线对应当前角度的最高票箱。θ 从图像向右轴顺时针量；ρ 每0.2 m分箱。</text><text x="31" y="391">灰度图显示2×2均值；掩膜、投票与直线提取始终使用全部9,600个原始像素。</text>';
    return svg(a, 405, '真实阈值掩膜、提取直线以及选定法向角的Hough票数分布');
  }
  const defaultObs = observation(), defaultStats = windowStats(12, 4), defaultHough = hough(defaultObs, .4, 35, 25);
  const intensitySource = '<p class="ct-source">专业出处：<a href="https://se.copernicus.org/articles/10/487/2019/se-10-487-2019.html" target="_blank" rel="noopener noreferrer">Andrews等（2019），Solid Earth，第2节</a>将P10定义为扫描线上的裂缝数/线长，将P21定义为迹线长度/面积。本图对矩形窗口内的迹线直接求和；数值来自原例固定几何。</p>';
  const style = '<style>[data-concept-scene="g4"]{font-size:18px}[data-concept-scene="g4"] .ct-chart{overflow-x:auto}[data-concept-scene="g4"] label{display:inline-flex;flex-direction:column;gap:6px;margin:8px 16px 8px 0}[data-concept-scene="g4"] input,[data-concept-scene="g4"] select,[data-concept-scene="g4"] button{font:inherit;min-height:40px}[data-concept-scene="g4"] .ct-readout{line-height:1.7}</style>';
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="g4" data-concept-part="background">' + style + '<h3>同一组裂缝，扫描一条线和统计一个面会得到什么？</h3><p>四条迹线沿用原例固定几何，用来练习分母。金色扫描线只数与当前窗口内迹线的交点，P10除以扫描长度；P21把当前窗口内迹线总长除以面积。先移动扫描线，再缩窄观察窗口，分别检查两种取样。</p><div class="ct-controls"><label>观察窗口宽度（m）<input disabled data-ct-key="width" type="range" min="4" max="12" step="0.5" value="12"></label><label>扫描线距顶边（m）<input disabled data-ct-key="scan" type="range" min="0.1" max="7.8" step="0.1" value="4"></label><button disabled type="button" data-ct-action="reset">复位</button></div><div class="ct-chart" data-ct-graphic>' + windowChart(defaultStats) + '</div><p class="ct-readout" data-ct-result>默认窗口12×8 = 96 m²，迹线总长 ' + f(defaultStats.totalLength_m, 2) + ' m，P21 = ' + f(defaultStats.P21) + ' m⁻¹；扫描线交点 ' + defaultStats.crossings + ' / 12 m，P10 = ' + f(defaultStats.P10) + ' 个/m。</p><p>依据原 G4Core 的四条固定几何；线段端点沿用像素0–119、0–79的裁剪，原例名义窗口分母仍为12 m×8 m。这里不是新的裂缝识别评价。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="g4" data-concept-part="workflow"><h3>固定一个法向角，暗像素怎样累积成票峰？</h3><p>每个入选像素按 ρ = x cos θ + y sin θ 投到一个距离箱。改变 θ，散开的投影可能聚集；改变灰度阈值，参与投票的像素集合会变。全角度仍按原例5°扫描、0.2 m分箱与去重规则提取最多8条线。</p><div class="ct-controls"><label>暗像素灰度阈值<input disabled data-ct-key="threshold" type="range" min="0.1" max="0.75" step="0.01" value="0.4"></label><label>法向角 θ（°）<input disabled data-ct-key="theta" type="range" min="0" max="175" step="5" value="25"></label><label>最低票数<input disabled data-ct-key="votes" type="range" min="20" max="100" value="35"></label><label>像素层<select disabled data-ct-key="view"><option value="mask">实际阈值掩膜</option><option value="gray">原始灰度</option></select></label><button disabled type="button" data-ct-action="read">读取当前演示灰度</button><button disabled type="button" data-ct-action="reset">复位</button></div><div class="ct-chart" data-ct-graphic>' + houghChart(defaultObs, defaultHough, 'mask') + '</div><p class="ct-readout" data-ct-result>默认9600个原像素中 ' + defaultHough.maskPixels + ' 个进入投票；θ=25°最高票箱 ρ=' + f(defaultHough.peakRho * .1, 1) + ' m，' + defaultHough.peakVotes + ' 票；全角度去重后提取 ' + defaultHough.lines.length + ' 条线。</p><p data-ct-note>来源：原 G4Core 的固定种子1704灰度观测与Hough算法。图上票峰和直线实算，不读取参考裂缝来作预测，不新增F1。</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="g4"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button,textarea').forEach(el => { el.disabled = false; });
      const key = n => host.querySelector('[data-ct-key="' + n + '"]'), workflow = host.dataset.conceptPart === 'workflow';
      let current = defaultObs, source = '固定种子1704的原例教学灰度';
      function draw() {
        if (!workflow) {
          const s = windowStats(+key('width').value, +key('scan').value);
          host.querySelector('[data-ct-graphic]').innerHTML = windowChart(s);
          host.querySelector('[data-ct-result]').textContent = '窗口宽 ' + f(s.width, 1) + ' m、高8 m；面积 ' + f(s.area_m2, 1) + ' m²。窗口内各迹线长度：' + s.lines.map(l => l.id + ' ' + f(l.length, 2) + ' m').join('，') + '；总长 ' + f(s.totalLength_m, 2) + ' m，P21=' + f(s.P21) + ' m⁻¹。扫描线距顶 ' + f(s.scan, 1) + ' m，交点 ' + s.crossings + ' 个，P10=' + f(s.P10) + ' 个/m。仅移动扫描线时，P21和逐线长度保持。';
          host.dataset.ctState = JSON.stringify({ width_m: s.width, scan_m: s.scan, area_m2: s.area_m2, totalLength_m: s.totalLength_m, crossings: s.crossings, P10: s.P10, P21: s.P21, traceLengths_m: s.lines.map(l => ({ id: l.id, length: l.length, crosses: l.crosses })) });
        } else {
          const s = hough(current, +key('threshold').value, +key('votes').value, +key('theta').value);
          host.querySelector('[data-ct-graphic]').innerHTML = houghChart(current, s, key('view').value);
          host.querySelector('[data-ct-result]').textContent = source + '。阈值 ' + f(s.threshold, 2) + '：入选 ' + s.maskPixels + ' / 9600 像素；θ=' + s.theta + '°，' + (s.peakRho == null ? '当前无票峰' : '最高票箱 ρ=' + f(s.peakRho * .1, 1) + ' m，' + s.peakVotes + ' 票，' + (s.peakVotes >= s.minVotes ? '达到' : '未达') + '最低' + s.minVotes + '票') + '。全36个角度完成去重后 ' + s.lines.length + ' 条线；长度总计 ' + f(s.lines.reduce((v, l) => v + l.length, 0), 2) + ' m。';
          host.dataset.ctState = JSON.stringify({ source, threshold: s.threshold, theta: s.theta, minVotes: s.minVotes, view: key('view').value, maskPixels: s.maskPixels, denominator: 9600, peakRho_px: s.peakRho, peakVotes: s.peakVotes, selectedLineCount: s.lines.length, lines: s.lines.map(l => ({ theta: l.theta, rho: l.rho, votes: l.votes, length_m: l.length })), observationChecksum: current.pixels.reduce((v, p) => v + p, 0) });
        }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.addEventListener('click', event => {
        const action = event.target.closest('[data-ct-action]')?.dataset.ctAction;
        if (action === 'reset') {
          if (workflow) { current = defaultObs; source = '固定种子1704的原例教学灰度'; key('threshold').value = .4; key('theta').value = 25; key('votes').value = 35; key('view').value = 'mask'; }
          else { key('width').value = 12; key('scan').value = 4; } draw();
        }
        if (workflow && action === 'read') {
          const s = g.CaseInspect?.snapshot?.(), r = s?.result, o = r?.observations;
          if (!s || !['ready', 'computed'].includes(s.status || s.state) || o?.w !== W || o?.h !== H) { host.querySelector('[data-ct-note]').textContent = '请先运行原演示，再读取完整120×80灰度观测。'; return; }
          current = { ...o, pixels: o.pixels.slice() }; source = '已读取当前演示灰度（噪声' + r.params.noise + '、对比度' + r.params.contrast + '）'; key('threshold').value = r.params.threshold; key('votes').value = r.params.minVotes;
          host.querySelector('[data-ct-note]').textContent = '已复制当前9600个灰度值；本单元只重新阈值化和投票，不生成新图或改写原演示。'; draw();
        }
      });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 1, workflowAfter: 1, backgroundHTML: backgroundHTML.replace('</section>', intensitySource + '</section>'), workflowHTML, mount };
})(globalThis);
