(function (g) {
  'use strict';
  const scene = 'g3', red = '#B8242A', blue = '#55768B', gold = '#B08A4A', ink = '#283D45';
  const names = ['岩性接触线', '产状符号', '地层代号'];
  const f = (v, n = 2) => Number(v).toFixed(n);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function svg(body, h, label) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ' + h + '" role="img" aria-label="' + label + '" style="min-width:700px;width:100%;font:16px system-ui,Microsoft YaHei,sans-serif;fill:' + ink + '">' + body + '</svg>'; }
  function attitude(strike, dip) {
    const a = strike * Math.PI / 180, d = dip * Math.PI / 180;
    return { strike, dip, dipDirection: (strike + 90) % 360, strikeVector: [Math.sin(a), -Math.cos(a)], dipVector: [Math.cos(a), Math.sin(a)], horizontal_m: 4 * Math.cos(d), vertical_m: 4 * Math.sin(d) };
  }
  function attitudeChart(p) {
    const cx = 187, cy = 167, v = p.strikeVector, n = p.dipVector, start = [446, 94], end = [446 + p.horizontal_m * 54, 94 + p.vertical_m * 54];
    let a = '<rect width="760" height="400" fill="#F7F4EF"/><text x="35" y="30">平面：走向线与倾向短线</text><text x="414" y="30">沿倾向切开的竖直截面</text><circle cx="187" cy="167" r="104" fill="none" stroke="#D2C9BD"/><path d="M187 52v230M72 167h230" stroke="#DED8CF" stroke-dasharray="4 5"/><text x="180" y="48">北</text><text x="310" y="173">东</text><text x="180" y="303">南</text><text x="43" y="173">西</text>';
    a += '<path d="M' + (cx - v[0] * 90) + ' ' + (cy - v[1] * 90) + 'L' + (cx + v[0] * 90) + ' ' + (cy + v[1] * 90) + 'M' + cx + ' ' + cy + 'L' + (cx + n[0] * 57) + ' ' + (cy + n[1] * 57) + '" stroke="' + red + '" stroke-width="7" fill="none"/><text x="' + (cx + n[0] * 69 - 8) + '" y="' + (cy + n[1] * 69 + 6) + '">' + p.dip + '°</text>';
    for (let k = 0; k <= 4; k++) {
      a += '<path d="M' + (446 + k * 54) + ' 94v216M446 ' + (94 + k * 54) + 'h216" stroke="#E1DBD2"/><text x="' + (440 + k * 54) + '" y="337">' + k + '</text><text x="415" y="' + (99 + k * 54) + '">' + k + '</text>';
    }
    a += '<path d="M446 94h216M446 94v216" fill="none" stroke="' + blue + '" stroke-width="2"/><path d="M' + start.join(' ') + 'L' + end.join(' ') + 'L' + end[0] + ' 94Z" fill="' + gold + '" fill-opacity=".15"/><path d="M446 94L' + end.join(' ') + '" stroke="' + red + '" stroke-width="6"/><path d="M' + end.join(' ') + 'V94" stroke="' + gold + '" stroke-width="2" stroke-dasharray="5 4"/><circle cx="' + end[0] + '" cy="' + end[1] + '" r="5" fill="' + red + '"/>';
    const arcEnd = [446 + 48 * Math.cos(p.dip * Math.PI / 180), 94 + 48 * Math.sin(p.dip * Math.PI / 180)];
    a += '<path d="M494 94A48 48 0 0 1 ' + arcEnd.join(' ') + '" fill="none" stroke="' + blue + '" stroke-width="2"/><text x="502" y="127">' + p.dip + '°</text><text x="' + (end[0] + 9) + '" y="' + (end[1] + 8) + '">4 m</text><text x="445" y="365">沿倾向的水平距离 / m →</text><text x="414" y="389">深度 / m ↓；红线为同一4 m岩层线段</text><text x="34" y="344">走向 ' + p.strike + '°，从北顺时针量</text><text x="34" y="375">倾向 ' + p.dipDirection + '°；倾角 ' + p.dip + '°</text>';
    return svg(a, 405, '随走向和倾角改变的产状平面符号及沿倾向剖面');
  }
  // Exact 16×16 authored templates from the original G3Core.
  function symbol(c, shift = 0) {
    const a = Array(256).fill(0), put = (x, y) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) a[y * 16 + x] = 1; };
    if (c === 0) for (let x = 2; x < 14; x++) put(x, 7 + shift + Math.round(Math.sin(x * .55)));
    if (c === 1) { for (let x = 2; x < 14; x++) put(x, 6 + shift); for (let y = 6 + shift; y < 13 + shift; y++) put(8, y); }
    if (c === 2) { for (let y = 3 + shift; y < 13 + shift; y++) { put(3, y); put(8, y); put(12, y); } for (let x = 3; x < 9; x++) { put(x, 3 + shift); put(x, 12 + shift); } for (let x = 8; x < 13; x++) put(x, 7 + shift); }
    return a;
  }
  function tiles() {
    let s = 901; const random = () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }, a = [];
    for (let i = 0; i < 30; i++) { const c = Math.floor(random() * 3), shift = Math.floor(random() * 3) - 1; a.push(symbol(c, shift).map(v => random() < .04 ? 1 - v : v)); }
    return a;
  }
  function compare(observed, c, shift) {
    const template = symbol(c, shift), xor = observed.map((v, i) => +(v !== template[i]));
    const distances = names.flatMap((_, label) => [-1, 0, 1].map(rowShift => { const candidate = symbol(label, rowShift); return { label, shift: rowShift, mismatches: observed.reduce((s, v, i) => s + +(v !== candidate[i]), 0) }; }));
    const order = distances.slice().sort((a, b) => a.mismatches - b.mismatches), winner = order[0], runnerUp = order.find(r => r.label !== winner.label);
    return { observed, template, xor, mismatches: xor.reduce((a, b) => a + b, 0), distances, winner, margin: (runnerUp.mismatches - winner.mismatches) / 256 };
  }
  function matrixChart(c, editable = false) {
    let a = '<rect width="760" height="310" fill="#F7F4EF"/>';
    [c.observed, c.template, c.xor].forEach((arr, k) => {
      const ox = 24 + k * 251;
      a += '<text x="' + ox + '" y="29">' + ['当前观测（可点改像素）', '你选择的清洁模板', '逐像素差异 XOR'][k] + '</text>';
      arr.forEach((v, i) => {
        const attr = k === 0 ? ' data-ct-pixel="' + i + '" tabindex="' + (editable ? '0' : '-1') + '" role="button" aria-disabled="' + !editable + '" aria-label="翻转第' + (Math.floor(i / 16) + 1) + '行、第' + (i % 16 + 1) + '列像素，当前' + (v ? '黑' : '白') + '"' : '';
        a += '<rect' + attr + ' x="' + (ox + i % 16 * 12) + '" y="' + (52 + Math.floor(i / 16) * 12) + '" width="12" height="12" fill="' + (v ? (k === 2 ? red : ink) : '#fff') + '" stroke="#DAD4CA" stroke-width=".6"/>';
      });
    });
    a += '<text x="24" y="281">每图 16×16 = 256 像素；朱红格计入差异。差异比例 = ' + c.mismatches + ' ÷ 256 = ' + f(c.mismatches / 256 * 100, 1) + '%。</text>';
    return svg(a, 310, '可编辑二值图块、平移模板及逐像素差异掩膜');
  }
  function distanceTable(c) {
    return '<table><caption>9个模板的实际不同像素数 / 256（越小越接近）</caption><thead><tr><th scope="col">类别 / 行平移</th><th scope="col">−1</th><th scope="col">0</th><th scope="col">+1</th></tr></thead><tbody>' + names.map((n, label) => '<tr><th scope="row">' + n + '</th>' + [-1, 0, 1].map(shift => { const q = c.distances.find(r => r.label === label && r.shift === shift); return '<td' + (q === c.winner || (q.label === c.winner.label && q.shift === c.winner.shift) ? ' style="color:#B8242A;font-weight:700"' : '') + '>' + q.mismatches + ' / 256</td>'; }).join('') + '</tr>').join('') + '</tbody></table>';
  }
  const initialLegend = 'J2s：中侏罗统砂岩\nK1m：下白垩统泥岩\n未分隔文字需要核查';
  function parseLegend(text) { return text.split(/[\n；;]/).map(s => s.trim()).filter(Boolean).map(line => { const m = line.match(/^([A-Za-z][A-Za-z0-9]*)\s*[:：]\s*(.+)$/); return m ? { code: m[1], description: m[2], valid: true } : { code: '待复核', description: line, valid: false }; }); }
  function legendHTML(rows) { return '<table><caption>当前输入的图例字段（只适用于本图）</caption><thead><tr><th scope="col">代号</th><th scope="col">描述</th><th scope="col">字段状态</th></tr></thead><tbody>' + rows.map(r => '<tr><td>' + escape(r.code) + '</td><td>' + escape(r.description) + '</td><td>' + (r.valid ? '已按冒号分字段' : '待核查') + '</td></tr>').join('') + '</tbody></table>'; }
  const defaultTiles = tiles(), defaultComparison = compare(defaultTiles[0], 0, 0), p0 = attitude(35, 35);
  const attitudeSources = '<p class="ct-source">专业出处：<a href="https://www.colorado.edu/center/mortenson/sites/default/files/attached-files/strikedip_1.pdf" target="_blank" rel="noopener noreferrer">科罗拉多大学《Attitude of Geological Planes》，第2页图1</a>说明走向长线、倾向短线与倾角数字；<a href="https://hkss.cedd.gov.hk/hkss/en/publications-and-resources/educational-materials/hong-kong-geology/chapter-3/index.html" target="_blank" rel="noopener noreferrer">香港土木工程拓展署：Geological Symbols</a>解释走向与倾角的几何定义。</p>';
  const legendSource = '<p class="ct-source">专业出处：<a href="https://hkss.cedd.gov.hk/hkss/en/publications-and-resources/educational-materials/hong-kong-geology/chapter-3/index.html" target="_blank" rel="noopener noreferrer">香港土木工程拓展署：Map Legends</a>说明图例解释颜色、地层代号、岩性与地质符号。此处“代号：描述”是本例整理字段的输入约定。</p>';
  const style = '<style>[data-concept-scene="g3"]{font-size:18px}[data-concept-scene="g3"] .ct-chart{overflow-x:auto}[data-concept-scene="g3"] label{display:inline-flex;flex-direction:column;gap:6px;margin:8px 18px 8px 0}[data-concept-scene="g3"] input,[data-concept-scene="g3"] select,[data-concept-scene="g3"] button,[data-concept-scene="g3"] textarea{font:inherit;min-height:40px}[data-concept-scene="g3"] textarea{width:min(100%,680px);min-height:110px;box-sizing:border-box}[data-concept-scene="g3"] table{border-collapse:collapse;width:100%;font-size:18px}[data-concept-scene="g3"] th,[data-concept-scene="g3"] td{padding:9px;border-bottom:1px solid #DDD5CA;text-align:left}[data-concept-scene="g3"] caption{text-align:left;margin:12px 0;font-size:16px}[data-concept-scene="g3"] [data-ct-pixel]{cursor:crosshair}[data-concept-scene="g3"] [data-ct-pixel]:focus{outline:none;stroke:#B08A4A;stroke-width:3}[data-concept-scene="g3"] .ct-readout{line-height:1.7}</style>';
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="g3" data-concept-part="background">' + style + '<h3>改一组岩层产状，地图符号与剖面怎样对应？</h3><p>长线记录走向，短线指向下倾侧，数字记录倾角。走向以北为0°顺时针量；本单元固定采用走向右侧为倾向。右图沿倾向切开同一岩层，用4 m长的线段把倾角转成可量测的水平距离与深度。</p><div class="ct-controls"><label>走向方位（°）<input disabled data-ct-key="strike" type="range" min="0" max="175" step="5" value="35"></label><label>倾角（°）<input disabled data-ct-key="dip" type="range" min="5" max="85" step="5" value="35"></label><button disabled type="button" data-ct-action="reset">复位</button></div><div class="ct-chart" data-ct-graphic>' + attitudeChart(p0) + '</div><p class="ct-readout" data-ct-result>走向35°，倾向125°，倾角35°。沿层4 m对应水平 ' + f(p0.horizontal_m) + ' m、向下 ' + f(p0.vertical_m) + ' m。调走向只转动平面方位；调倾角改变截面几何。</p><p>依据原背景“长线示走向、短线示倾向”的约定制作几何练习；该图不把16×16分类模板解释为可反演的真实产状。</p></section>';
  const workflowHTML = '<section class="ct-widget" data-concept-scene="g3" data-concept-part="workflow"><h3>哪几个像素让图块更像某一类？</h3><p>选择模板类别和行平移，查看逐像素差异。可点击左图翻转像素，也可键盘聚焦后按回车或空格；9个模板距离和最邻近类别会重新计算。下方图例是另一份输入，修改文字只改变字段表。</p><div class="ct-controls"><label>图块编号<input disabled data-ct-key="tile" type="range" min="1" max="30" value="1"></label><label>对照模板<select disabled data-ct-key="class"><option value="0">岩性接触线</option><option value="1">产状符号</option><option value="2">地层代号</option></select></label><label>模板行平移<select disabled data-ct-key="shift"><option value="-1">−1 行</option><option value="0" selected>0 行</option><option value="1">+1 行</option></select></label><button disabled type="button" data-ct-action="read">读取当前演示图块</button><button disabled type="button" data-ct-action="reset">复位</button></div><div class="ct-chart" data-ct-graphic>' + matrixChart(defaultComparison) + '</div><div class="ct-chart" data-ct-distances>' + distanceTable(defaultComparison) + '</div><p class="ct-readout" data-ct-result>图块1与当前模板差 ' + defaultComparison.mismatches + ' / 256；9个模板中最接近 ' + names[defaultComparison.winner.label] + '，最小差异 ' + defaultComparison.winner.mismatches + ' / 256。</p><label style="display:flex">本图图例（每行“代号：描述”）<textarea disabled data-ct-key="legend">' + escape(initialLegend) + '</textarea></label><div class="ct-chart" data-ct-legend>' + legendHTML(parseLegend(initialLegend)) + '</div><p data-ct-note>来源：原 G3Core 的9个平移模板、种子901的30个教学图块及原始图例文字。本地改像素用于距离练习，不重报真实扫描图准确率。</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="g3"]').forEach(host => {
      if (host.dataset.ctReady) return; host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button,textarea').forEach(el => { el.disabled = false; });
      const key = n => host.querySelector('[data-ct-key="' + n + '"]'), workflow = host.dataset.conceptPart === 'workflow';
      let current = defaultTiles.map(a => a.slice()), source = '固定种子901的教学图块';
      function draw() {
        if (!workflow) {
          const p = attitude(+key('strike').value, +key('dip').value);
          host.querySelector('[data-ct-graphic]').innerHTML = attitudeChart(p);
          host.querySelector('[data-ct-result]').textContent = '走向 ' + p.strike + '°，倾向 ' + p.dipDirection + '°，倾角 ' + p.dip + '°。沿层4 m：水平投影 = 4 cos(' + p.dip + '°) = ' + f(p.horizontal_m) + ' m；向下投影 = 4 sin(' + p.dip + '°) = ' + f(p.vertical_m) + ' m。右图截面始终沿倾向，因此改变走向时深度保持。';
          host.dataset.ctState = JSON.stringify(p);
        } else {
          const selected = Math.min(current.length - 1, +key('tile').value - 1), c = compare(current[selected], +key('class').value, +key('shift').value), legend = (g.G3Core?.parseLegend || parseLegend)(key('legend').value);
          host.querySelector('[data-ct-graphic]').innerHTML = matrixChart(c, true); host.querySelector('[data-ct-distances]').innerHTML = distanceTable(c); host.querySelector('[data-ct-legend]').innerHTML = legendHTML(legend);
          host.querySelector('[data-ct-result]').textContent = source + '，图块 ' + (selected + 1) + '。与所选模板差 ' + c.mismatches + ' / 256 = ' + f(c.mismatches / 256 * 100, 1) + '%。9模板中最接近 ' + names[c.winner.label] + '（行平移 ' + c.winner.shift + '，差 ' + c.winner.mismatches + ' / 256）；第二类别距离差 ' + f(c.margin * 100, 1) + ' 个百分点。';
          host.dataset.ctState = JSON.stringify({ tile: selected + 1, source, templateClass: +key('class').value, shift: +key('shift').value, observation: current[selected], mismatches: c.mismatches, distance: c.mismatches / 256, distances: c.distances, prediction: c.winner.label, bestShift: c.winner.shift, bestDistance: c.winner.mismatches / 256, margin: c.margin, legend });
        }
      }
      function flip(target) { const pixel = target.closest('[data-ct-pixel]'); if (!workflow || !pixel) return; const i = +key('tile').value - 1, j = Number(pixel.dataset.ctPixel); current[i][j] = 1 - current[i][j]; draw(); const replacement = host.querySelector('[data-ct-pixel="' + j + '"]'); if (target === pixel && typeof replacement?.focus === 'function') replacement.focus({ preventScroll: true }); }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { const pixel = event.target.closest('[data-ct-pixel]'); if (pixel) { event.preventDefault(); flip(pixel); } } });
      host.addEventListener('click', event => {
        if (event.target.closest('[data-ct-pixel]')) { flip(event.target); return; }
        const action = event.target.closest('[data-ct-action]')?.dataset.ctAction;
        if (action === 'reset') {
          if (workflow) { current = defaultTiles.map(a => a.slice()); source = '固定种子901的教学图块'; key('tile').value = 1; key('class').value = 0; key('shift').value = 0; key('legend').value = initialLegend; }
          else { key('strike').value = 35; key('dip').value = 35; } draw();
        }
        if (workflow && action === 'read') {
          const s = g.CaseInspect?.snapshot?.(), r = s?.result;
          if (!s || !['ready', 'computed'].includes(s.status || s.state) || !r?.observations?.length) { host.querySelector('[data-ct-note]').textContent = '请先运行原演示，再读取已完成的图块数组。'; return; }
          current = r.observations.map(a => a.slice()); source = '已读取当前演示种子' + r.params.seed + '的图块'; key('tile').max = current.length; key('tile').value = 1;
          if (r.legend) key('legend').value = r.legend.map(row => row.valid ? row.code + '：' + row.description : row.description).join('\n');
          host.querySelector('[data-ct-note]').textContent = '已复制当前图块与图例字段；这里的像素翻转不回写原演示。'; draw();
        }
      });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 0, workflowAfter: 1, backgroundHTML: backgroundHTML.replace('</section>', attitudeSources + '</section>'), workflowHTML: workflowHTML.replace('</section>', legendSource + '</section>'), mount };
})(globalThis);
