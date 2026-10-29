(function (g) {
  'use strict';
  const scene = 'g1', ink = '#283D45', red = '#B8242A', blue = '#55768B', gold = '#B08A4A';
  const names = ['红光', '近红外', '短波红外', '近红外−红光 / 和', '短波红外−近红外 / 和', '3×3红光标准差'];
  const labels = ['砂岩露头', '泥岩露头', '灰岩露头', '植被覆盖'];
  const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const f = (v, n = 3) => Number(v).toFixed(n);
  // Same observation-only generator as G1Core.generate. No evaluation labels enter these widgets.
  function observation(shadow = .26, seed = 2027, noise = .045, cover = .16) {
    let s = seed >>> 0;
    const random = () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
    const spectra = [[.34, .39, .53], [.22, .28, .31], [.46, .49, .35], [.12, .61, .23]];
    const shift = random() * 1.7, angle = random() * .25 - .125, bands = [[], [], []], w = 72, h = 48;
    const offsets = spectra.map(() => [random(), random(), random()].map(x => (x - .5) * .025));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const b = (y / h + angle * x / w + .08 * Math.sin(x / 12 + shift) + shift * .11 + 2) % 1;
      let c = b < .34 ? 0 : b < .67 ? 1 : 2;
      if (.5 + .23 * Math.sin(x * .21 + shift * 3) + .2 * Math.cos(y * .28 - shift) + .12 * Math.sin((x + y) * .17) > 1 - cover * 1.1) c = 3;
      const illumination = 1 - shadow * Math.exp(-((x / w - .38) ** 2 / .07 + (y / h - .5) ** 2 / .18));
      const texture = c === 0 ? .022 * Math.sin(x * 2.1 + y * 1.8) : c === 1 ? .016 * Math.sin(y * 2.4) : c === 2 ? .018 * Math.sin(x * .56) * Math.cos(y * .7) : .025 * (random() - .5);
      for (let j = 0; j < 3; j++) bands[j].push(clamp((spectra[c][j] + offsets[c][j] + texture) * illumination + (random() - .5) * noise * 2, .01, .95));
    }
    return { w, h, bands, pixelSize_m: 30, wavelengths_um: [.65, .86, 2.2], groupId: '图幅-' + seed };
  }
  function vector(o, i, mode) {
    const r = o.bands[0][i]; if (mode === 'red') return [r];
    const n = o.bands[1][i], s = o.bands[2][i], x = i % o.w, y = Math.floor(i / o.w), local = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) local.push(o.bands[0][clamp(y + dy, 0, o.h - 1) * o.w + clamp(x + dx, 0, o.w - 1)]);
    const m = mean(local);
    return [r, n, s, (n - r) / (n + r + .01), (s - n) / (s + n + .01), Math.sqrt(mean(local.map(v => (v - m) ** 2)))];
  }
  const libraries = {};
  function library(mode) {
    if (libraries[mode]) return libraries[mode];
    const samples = [];
    [111, 127, 143, 159, 175, 191].forEach((seed, group) => {
      const o = observation(.12 + group * .075, seed, .035 + group * .007, .18 + (group % 3) * .07);
      // Sample labels follow the same authored surface-generation rule, solely for neighbor provenance.
      let s = seed >>> 0; s = (1664525 * s + 1013904223) >>> 0; const shift = s / 4294967296 * 1.7;
      s = (1664525 * s + 1013904223) >>> 0; const angle = s / 4294967296 * .25 - .125;
      for (let y = 2; y < 48; y += 6) for (let x = 2; x < 72; x += 6) {
        const b = (y / 48 + angle * x / 72 + .08 * Math.sin(x / 12 + shift) + shift * .11 + 2) % 1;
        let c = b < .34 ? 0 : b < .67 ? 1 : 2;
        if (.5 + .23 * Math.sin(x * .21 + shift * 3) + .2 * Math.cos(y * .28 - shift) + .12 * Math.sin((x + y) * .17) > 1 - (.18 + (group % 3) * .07) * 1.1) c = 3;
        samples.push({ x: vector(o, y * 72 + x, mode), label: c, pixel: y * 72 + x, groupId: o.groupId });
      }
    });
    const mu = samples[0].x.map((_, j) => mean(samples.map(s => s.x[j])));
    const sd = mu.map((m, j) => Math.max(.001, Math.sqrt(mean(samples.map(s => (s.x[j] - m) ** 2)))));
    return libraries[mode] = { mu, sd, samples: samples.map(s => ({ ...s, z: s.x.map((v, j) => (v - mu[j]) / sd[j]) })) };
  }
  function nearest(o, index, mode, rank) {
    const model = library(mode), raw = vector(o, index, mode), z = raw.map((v, j) => (v - model.mu[j]) / model.sd[j]);
    const best = model.samples.map((s, index) => ({ ...s, index, distance: Math.sqrt(mean(z.map((v, j) => (v - s.z[j]) ** 2))) })).sort((a, b) => a.distance - b.distance || a.index - b.index).slice(0, 5);
    const chosen = best[rank - 1], squared = z.map((v, j) => (v - chosen.z[j]) ** 2);
    return { raw, z, chosen, squared, best, sampleCount: model.samples.length };
  }
  function svg(body, h, label) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="min-width:700px;width:100%;font:16px system-ui,Microsoft YaHei,sans-serif;fill:' + ink + '">' + body + '</svg>'; }
  function spectralChart(o, x, y, view) {
    let a = '<rect width="760" height="340" fill="#F7F4EF"/><text x="38" y="30">同一幅地表观测</text><text x="410" y="30">选中位置的三波段响应</text>';
    for (let yy = 0; yy < o.h; yy += 2) for (let xx = 0; xx < o.w; xx += 2) {
      const b = o.bands.map(band => mean([0, 1, o.w, o.w + 1].map(d => band[yy * o.w + xx + d])));
      const rgb = view === 'composite' ? [b[2], b[1], b[0]].map(v => Math.round(clamp(v * 350 + 22, 0, 255))) : Array(3).fill(Math.round(clamp(b[Number(view)] * 430 + 20, 0, 255)));
      a += '<rect x="' + (38 + xx * 4) + '" y="' + (54 + yy * 4) + '" width="8" height="8" fill="rgb(' + rgb.join(',') + ')"/>';
    }
    a += '<rect x="' + (36 + x * 4) + '" y="' + (52 + y * 4) + '" width="8" height="8" fill="none" stroke="#fff" stroke-width="3"/><path d="M38 252h288M38 54v192" stroke="' + ink + '"/><text x="38" y="275">0</text><text x="250" y="275">东向 2.16 km</text><text x="38" y="302">北向 ↑；每像素 30 m</text>';
    const px = v => 414 + (v - .5) / 1.8 * 300, py = v => 246 - v / .8 * 190;
    [0, .2, .4, .6, .8].forEach(v => { a += '<path d="M410 ' + py(v) + 'h310" stroke="#D9D6D0"/><text x="374" y="' + (py(v) + 5) + '">' + v.toFixed(1) + '</text>'; });
    const values = o.bands.map(b => b[y * o.w + x]);
    a += '<polyline points="' + [.65, .86, 2.2].map((w, j) => px(w) + ',' + py(values[j])).join(' ') + '" fill="none" stroke="' + red + '" stroke-width="3"/>';
    [.65, .86, 2.2].forEach((w, j) => { a += '<circle cx="' + px(w) + '" cy="' + py(values[j]) + '" r="6" fill="' + red + '"/><text x="' + (px(w) - 18) + '" y="' + (py(values[j]) - 13 - (j === 1 ? 12 : 0)) + '">' + f(values[j]) + '</text><text x="' + (px(w) - 19) + '" y="274">' + w + '</text>'; });
    a += '<text x="410" y="301">波长 / μm →；反射率（无量纲）↑</text><text x="38" y="331">地图每格为 2×2 像素均值；十字位置读取原始单像素</text>';
    return svg(a, 345, '地表像素地图与同一位置的三波段反射率');
  }
  function neighborChart(n) {
    const count = n.z.length, h = Math.max(260, 112 + count * 44), bound = Math.max(3, Math.ceil(Math.max(...n.z.map(Math.abs), ...n.chosen.z.map(Math.abs))));
    const px = v => 472 + v / bound * 220;
    let a = '<rect width="760" height="' + h + '" fill="#F7F4EF"/><text x="28" y="30">训练均值为 0；横坐标为标准差单位 z</text>';
    [-bound, 0, bound].forEach(t => { a += '<path d="M' + px(t) + ' 44v' + (count * 44 + 5) + '" stroke="' + (t ? '#DDD7CE' : gold) + '" stroke-dasharray="5 5"/><text x="' + (px(t) - 10) + '" y="' + (count * 44 + 78) + '">' + t + '</text>'; });
    n.z.forEach((v, j) => {
      const y = 66 + j * 44;
      a += '<text x="28" y="' + (y + 5) + '">' + names[j] + '</text><line x1="' + px(v) + '" y1="' + y + '" x2="' + px(n.chosen.z[j]) + '" y2="' + y + '" stroke="#B6AAA0" stroke-width="3"/><circle cx="' + px(v) + '" cy="' + y + '" r="6" fill="' + red + '"/><circle cx="' + px(n.chosen.z[j]) + '" cy="' + y + '" r="5" fill="' + blue + '"/><text x="704" y="' + (y + 5) + '">' + f(n.squared[j], 2) + '</text>';
    });
    a += '<text x="28" y="' + (h - 18) + '" fill="' + red + '">● 当前像素</text><text x="185" y="' + (h - 18) + '" fill="' + blue + '">● 所选训练邻居</text><text x="493" y="' + (h - 18) + '">最右列：各维差的平方</text>';
    return svg(a, h, '当前像素与真实训练近邻的标准化特征对照');
  }
  const style = '<style>[data-concept-scene="g1"]{font-size:18px}[data-concept-scene="g1"] .ct-chart{overflow-x:auto}[data-concept-scene="g1"] label{display:inline-flex;flex-direction:column;gap:6px;margin:8px 16px 8px 0}[data-concept-scene="g1"] input,[data-concept-scene="g1"] select,[data-concept-scene="g1"] button{font:inherit;min-height:40px}[data-concept-scene="g1"] .ct-readout{line-height:1.7}</style>';
  const defaultObs = observation(), defaultNeighbor = nearest(defaultObs, 24 * 72 + 36, 'full', 1);
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="g1" data-concept-part="background">' + style + '<h3>在同一地表位置换波段，颜色为什么会变？</h3><p>把地图位置与反射率曲线一起读。伪彩色将短波红外、近红外、红光依次放入屏幕的红、绿、蓝；像素的颜色是测量组合。移动坐标或加深阴影，观察同一个位置的三项观测。</p><div class="ct-controls"><label>横向像素 x（0–71）<input disabled data-ct-key="x" type="range" min="0" max="71" value="36"></label><label>向下像素 y（0–47）<input disabled data-ct-key="y" type="range" min="0" max="47" value="24"></label><label>阴影强度<input disabled data-ct-key="shadow" type="range" min="0" max="0.75" step="0.01" value="0.26"></label><label>地图显示<select disabled data-ct-key="view"><option value="composite">SWIR / NIR / 红光伪彩色</option><option value="0">红光灰度</option><option value="1">近红外灰度</option><option value="2">短波红外灰度</option></select></label><button disabled type="button" data-ct-action="reset">复位</button></div><div class="ct-chart" data-ct-graphic>' + spectralChart(defaultObs, 36, 24, 'composite') + '</div><p class="ct-readout" data-ct-result>图幅-2027，像素 (36, 24)：红光 ' + f(defaultObs.bands[0][1764]) + '，近红外 ' + f(defaultObs.bands[1][1764]) + '，短波红外 ' + f(defaultObs.bands[2][1764]) + '。这是本例确定性教学观测，不是实测光谱。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="g1" data-concept-part="workflow"><h3>六种量纲不同的观测，怎样成为可比的距离？</h3><p>从当前像素算出特征，再用576个训练像素的均值与标准差转换为 z 值。图中每行比较当前像素和一个真实训练邻居；各维差的平方取平均后开根号，就是本例的近邻距离。这里只检查前5个邻居的依据，不重新报告整图指标。</p><div class="ct-controls"><label>x 像素<input disabled data-ct-key="x" type="range" min="0" max="71" value="36"></label><label>y 像素<input disabled data-ct-key="y" type="range" min="0" max="47" value="24"></label><label>比较信息<select disabled data-ct-key="mode"><option value="full">完整六维特征</option><option value="red">只留红光</option></select></label><label>近邻名次<input disabled data-ct-key="rank" type="range" min="1" max="5" value="1"></label><button disabled type="button" data-ct-action="read">读取当前演示观测</button><button disabled type="button" data-ct-action="reset">复位</button></div><div class="ct-chart" data-ct-graphic>' + neighborChart(defaultNeighbor) + '</div><p class="ct-readout" data-ct-result>默认图幅-2027，最近训练邻居来自 ' + defaultNeighbor.chosen.groupId + '、像素 ' + defaultNeighbor.chosen.pixel + '（' + labels[defaultNeighbor.chosen.label] + '），距离 ' + f(defaultNeighbor.chosen.distance) + '；训练分母576个像素。</p><p data-ct-note>来源：原 G1Core 的图幅生成、六维特征与训练划分；归一化差异的分母均含原式的 +0.01。背景光谱为自编教学对比。</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="g1"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button,textarea').forEach(el => { el.disabled = false; });
      const key = n => host.querySelector('[data-ct-key="' + n + '"]'), workflow = host.dataset.conceptPart === 'workflow';
      let imported = null, source = '固定教学图幅-2027';
      function draw() {
        const x = +key('x').value, y = +key('y').value, i = y * 72 + x;
        if (!workflow) {
          const shadow = +key('shadow').value, o = g.G1Core?.generate ? g.G1Core.generate(2027, { shadow, noise: .045, cover: .16 }).observations : observation(shadow), values = o.bands.map(b => b[i]);
          host.querySelector('[data-ct-graphic]').innerHTML = spectralChart(o, x, y, key('view').value);
          host.querySelector('[data-ct-result]').textContent = '像素 (' + x + ', ' + y + ')；相对地面位置约 (' + x * 30 + ', ' + (47 - y) * 30 + ') m。三波段反射率：' + values.map((v, j) => names[j] + ' ' + f(v)).join('；') + '。阴影强度 ' + f(shadow, 2) + '；测量与颜色同时更新，地表单元分区规则保持。';
          host.dataset.ctState = JSON.stringify({ x, y, shadow, view: key('view').value, bands: values, ground_m: [x * 30, (47 - y) * 30] });
        } else {
          const mode = key('mode').value, rank = +key('rank').value, o = imported || defaultObs, n = nearest(o, i, mode, rank);
          host.querySelector('[data-ct-graphic]').innerHTML = neighborChart(n);
          host.querySelector('[data-ct-result]').textContent = source + '，像素 (' + x + ', ' + y + ')；原始特征 [' + n.raw.map(v => f(v)).join(', ') + ']。第 ' + rank + ' 近邻：' + n.chosen.groupId + ' / 像素 ' + n.chosen.pixel + ' / ' + labels[n.chosen.label] + '。距离 = √(' + f(n.squared.reduce((a, b) => a + b, 0)) + ' ÷ ' + n.z.length + ') = ' + f(n.chosen.distance) + '；训练样本576个。';
          host.dataset.ctState = JSON.stringify({ x, y, mode, rank, source, features: n.raw, z: n.z, neighbor: { groupId: n.chosen.groupId, pixel: n.chosen.pixel, label: n.chosen.label }, squaredDifferences: n.squared, distance: n.chosen.distance, trainingPixels: n.sampleCount });
        }
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.addEventListener('click', event => {
        const action = event.target.closest('[data-ct-action]')?.dataset.ctAction;
        if (action === 'reset') {
          key('x').value = 36; key('y').value = 24; imported = null; source = '固定教学图幅-2027';
          if (workflow) { key('mode').value = 'full'; key('rank').value = 1; } else { key('shadow').value = .26; key('view').value = 'composite'; }
          draw();
        }
        if (action === 'read' && workflow) {
          try {
            const snapshot = g.CaseInspect?.snapshot?.();
            if (!snapshot || !['ready', 'computed'].includes(snapshot.status || snapshot.state)) throw Error('请先在原演示中运行计算，再读取观测。');
            const evidence = g.CaseInspect.evidence?.(), o = evidence?.observations || snapshot.result?.observations;
            if (!o || o.w !== 72 || o.h !== 48 || !o.bands) throw Error('当前接口未提供完整72×48三波段观测。');
            imported = o; source = '已读取 ' + o.groupId + ' 的当前演示观测';
            if (snapshot.selected) { key('x').value = snapshot.selected.x; key('y').value = snapshot.selected.y; }
            host.querySelector('[data-ct-note]').textContent = '根据当前观测和所选位置，从训练图幅的576个参考样本中寻找相近样本。';
            draw();
          } catch (error) { host.querySelector('[data-ct-note]').textContent = error.message; }
        }
      });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 1, workflowAfter: 1, backgroundHTML, workflowHTML, mount };
})(globalThis);
