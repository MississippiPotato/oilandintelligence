(function (g) {
  'use strict';
  const scene = 'm4', lengthMD = 100, fmt = (v, n = 2) => Number(v).toFixed(n);
  function calculate(angle, rop) {
    const radians = angle * Math.PI / 180, vertical = lengthMD * Math.cos(radians), horizontal = lengthMD * Math.sin(radians);
    return { angleFromVertical_deg: angle, lengthMD_m: lengthMD, ROP_m_h: rop, TVDincrement_m: vertical,
      horizontalIncrement_m: horizontal, drillTime_min_per_mMD: 60 / rop, segmentTime_min: lengthMD / rop * 60,
      verticalSpeed_m_h: rop * Math.cos(radians), timePerVerticalMetre_min: 60 / (rop * Math.cos(radians)) };
  }
  function chart(angle, rop) {
    const v = calculate(angle, rop), x0 = 72, y0 = 64, scale = 2.2, ex = x0 + v.horizontalIncrement_m * scale, ey = y0 + v.TVDincrement_m * scale;
    const rx = r => 441 + (r - 5) / 55 * 245, ry = t => 284 - t / 12 * 220;
    const curve = Array.from({ length: 111 }, (_, i) => { const r = 5 + i * .5; return (i ? 'L' : 'M') + rx(r).toFixed(2) + ' ' + ry(60 / r).toFixed(2); }).join('');
    return '<svg viewBox="0 0 750 360" role="img" aria-label="理想直线井段沿轨迹长度与垂直进尺的投影，以及钻速与每米钻时的倒数关系" style="display:block;width:100%;min-width:750px;max-width:850px;height:auto">'
      + '<text x="72" y="25" font-size="18" fill="#343941">一段100 m MD的直线井段</text>'
      + [0, 25, 50, 75, 100].map(t => '<path d="M72 ' + (64 + t * scale) + 'H292M' + (72 + t * scale) + ' 64V284" stroke="#e1dbd3"/><text x="44" y="' + (69 + t * scale) + '" text-anchor="end" font-size="16" fill="#62636a">' + t + '</text><text x="' + (72 + t * scale) + '" y="309" text-anchor="middle" font-size="16" fill="#62636a">' + t + '</text>').join('')
      + '<path d="M72 64L' + ex.toFixed(2) + ' ' + ey.toFixed(2) + '" stroke="#B8242A" stroke-width="5"/>'
      + '<path d="M60 64V' + ey.toFixed(2) + '" stroke="#55768B" stroke-width="3"/>'
      + '<path d="M72 ' + ey.toFixed(2) + 'H' + ex.toFixed(2) + '" stroke="#B08A4A" stroke-width="3" stroke-dasharray="5 4"/>'
      + '<circle cx="' + ex.toFixed(2) + '" cy="' + ey.toFixed(2) + '" r="6" fill="#B8242A"/><text x="' + Math.min(280, ex + 10).toFixed(2) + '" y="' + Math.max(53, ey - 12).toFixed(2) + '" font-size="16" fill="#B8242A">井段末端</text>'
      + '<text x="72" y="48" font-size="16" fill="#343941">倾角 ' + angle + '°（从竖直方向量）</text>'
      + '<text x="130" y="338" font-size="16" fill="#62636a">水平位移 / m</text><text x="18" y="205" transform="rotate(-90 18 205)" font-size="16" fill="#55768B">垂直进尺 / m</text>'
      + '<text x="441" y="25" font-size="18" fill="#343941">沿MD推进1 m，需要多久？</text>'
      + [0, 3, 6, 9, 12].map(t => '<path d="M441 ' + ry(t) + 'H686" stroke="#e1dbd3"/><text x="428" y="' + (ry(t) + 5) + '" text-anchor="end" font-size="16" fill="#62636a">' + t + '</text>').join('')
      + [5, 20, 40, 60].map(r => '<text x="' + rx(r) + '" y="309" text-anchor="middle" font-size="16" fill="#62636a">' + r + '</text>').join('')
      + '<path d="' + curve + '" fill="none" stroke="#55768B" stroke-width="3"/>'
      + '<path d="M' + rx(rop).toFixed(2) + ' 284V' + ry(v.drillTime_min_per_mMD).toFixed(2) + 'H441" fill="none" stroke="#B8242A" stroke-dasharray="4 4"/>'
      + '<circle cx="' + rx(rop).toFixed(2) + '" cy="' + ry(v.drillTime_min_per_mMD).toFixed(2) + '" r="6" fill="#B8242A"/>'
      + '<text x="453" y="50" font-size="16" fill="#B8242A">当前：' + fmt(60 / rop) + ' min/m MD</text>'
      + '<text x="500" y="338" font-size="16" fill="#62636a">钻速 ROP / m/h</text><text x="390" y="215" transform="rotate(-90 390 215)" font-size="16" fill="#62636a">钻时 / min/m MD</text></svg>';
  }
  function readout(angle, rop) {
    const v = calculate(angle, rop);
    return '<strong>沿井眼推进100 m：</strong>垂直进尺 ' + fmt(v.TVDincrement_m) + ' m，水平位移 ' + fmt(v.horizontalIncrement_m) + ' m。以 ' + fmt(rop, 0) + ' m/h 连续钻进，需要 ' + fmt(v.segmentTime_min, 1) + ' min；每米MD钻时为 ' + fmt(v.drillTime_min_per_mMD) + ' min/m。<br>此时每小时增加垂深 ' + fmt(v.verticalSpeed_m_h) + ' m；若换成“每增加1 m垂深需要多久”，则为 ' + fmt(v.timePerVerticalMetre_min) + ' min。改变倾角后这两个“每米”可能差很多，必须读清分母。';
  }
  const style = '<style>[data-concept-scene="m4"]{font-size:18px;line-height:1.75;min-width:0}[data-concept-scene="m4"] .ct-controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap}[data-concept-scene="m4"] label,[data-concept-scene="m4"] button,[data-concept-scene="m4"] figcaption{font-size:16px}[data-concept-scene="m4"] .ct-chart{max-width:100%;overflow-x:auto}[data-concept-scene="m4"] figure{margin:16px 0}[data-concept-scene="m4"] input{accent-color:#B8242A;max-width:100%}[data-concept-scene="m4"] .ct-readout{background:#F7F4EF;padding:14px;border-left:4px solid #B8242A}</style>';
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="m4" data-concept-part="background">' + style
    + '<h3>斜着钻100米，向地下加深了多少？</h3><p><strong>MD</strong>沿井眼轨迹量取，<strong>TVD</strong>沿竖直方向量取。先拿一段理想直线井段做量尺：它的MD固定为100 m。倾角从竖直方向量，0°为竖直，角度越大越斜。垂直进尺＝100×cos(倾角)，水平位移＝100×sin(倾角)。</p>'
    + '<div class="ct-controls"><label>倾角 <output data-ct-angle-label>45°</output> <input disabled type="range" min="0" max="75" value="45" step="5" data-ct-angle aria-label="从竖直方向量取的井段倾角，度"></label><label>钻速 <output data-ct-rop-label>20 m/h</output> <input disabled type="range" min="5" max="60" step="1" value="20" data-ct-rop aria-label="沿MD的钻速，米每小时"></label><button disabled type="button" data-ct-reset>复位</button></div>'
    + '<figure><div class="ct-chart" data-ct-graphic>' + chart(45, 20) + '</div><figcaption>左图两轴使用同一米制比例：朱红为100 m沿井眼长度，蓝灰为垂直进尺，赭金虚线为水平位移。右图由钻时＝60÷ROP逐点计算；倾角变化时，给定ROP对应的“每米MD钻时”保持不变。</figcaption></figure><p class="ct-readout" data-ct-result>' + readout(45, 20) + '</p>'
    + '<p>试把倾角从0°调到60°，保持钻速20 m/h。沿井眼100 m仍需300分钟，垂直进尺却从100 m变为50 m。再只提高钻速，观察两种进尺的耗时如何一起缩短。</p>'
    + '<p style="font-size:16px">这是恒速、恒倾角、连续钻进的几何教学计算，表示相对井段起点的垂深增量，不是下方USROP井的实测轨迹或总井深；停钻不参与60÷ROP的有限值换算。术语沿用 <a href="https://glossary.slb.com/en/terms/m/measured_depth" target="_blank" rel="noopener">SLB measured depth</a> 与 <a href="https://glossary.slb.com/en/terms/r/rate_of_penetration" target="_blank" rel="noopener">SLB rate of penetration</a>。</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true'; host.querySelectorAll('input,select,button').forEach(el => { el.disabled = false; });
      const angle = host.querySelector('[data-ct-angle]'), rop = host.querySelector('[data-ct-rop]');
      function draw() {
        const a = Number(angle.value), r = Number(rop.value);
        host.querySelector('[data-ct-angle-label]').textContent = a + '°'; host.querySelector('[data-ct-rop-label]').textContent = r + ' m/h';
        host.querySelector('[data-ct-graphic]').innerHTML = chart(a, r); host.querySelector('[data-ct-result]').innerHTML = readout(a, r);
        host.dataset.ctState = JSON.stringify({ source: 'ideal_straight_segment_unit_calculation', input: { angleFromVertical_deg: a, ROP_m_h: r }, ...calculate(a, r) });
      }
      host.addEventListener('input', draw); host.addEventListener('change', draw);
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { angle.value = 45; rop.value = 20; draw(); }); draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 0, workflowAfter: 0, backgroundHTML, workflowHTML: '', mount };
})(globalThis);
