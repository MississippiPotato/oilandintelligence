(function (g) {
  'use strict';
  const scene = 'm1';
  // M1Core.segment(M1Core.calibrated(S17Images.sample(17, {}, 1).observations.white, calibration, true)).
  // These are connected-component pixel areas, not geological grain sizes or field measurements.
  const particles = [1453, 1054, 1054, 1138, 1503, 1662, 1257, 850, 1346, 967, 1130, 1168]
    .map((area, index) => ({ id: index + 1, area, diameter: Math.sqrt(4 * area / Math.PI) }));
  const totalArea = particles.reduce((sum, p) => sum + p.area, 0);
  const fmt = (v, digits = 1) => Number(v).toFixed(digits);
  function calculate(cutoff) {
    const kept = particles.filter(p => p.diameter >= cutoff), area = kept.reduce((sum, p) => sum + p.area, 0);
    return { cutoff_px: cutoff, retainedCount: kept.length, totalCount: particles.length, retainedPixels: area, totalPixels: totalArea,
      countFraction: kept.length / particles.length, areaFraction: area / totalArea, retainedIds: kept.map(p => p.id) };
  }
  function chart(cutoff) {
    const value = calculate(cutoff), x = v => 66 + (v - 30) / 18 * 526, y = v => 260 - 196 * v;
    const sorted = particles.slice().sort((a, b) => a.diameter - b.diameter);
    function steps(key) {
      let remaining = key === 'count' ? particles.length : totalArea, d = 'M66 ' + y(1);
      for (const p of sorted) {
        d += 'H' + x(p.diameter).toFixed(2); remaining -= key === 'count' ? 1 : p.area;
        d += 'V' + y(remaining / (key === 'count' ? particles.length : totalArea)).toFixed(2);
      }
      return d + 'H592';
    }
    return '<svg viewBox="0 0 660 370" role="img" aria-label="同一批检出轮廓在不同像素直径下限的累计保留数量与面积，金色虚线为当前下限" style="display:block;width:100%;min-width:660px;max-width:760px;height:auto">'
      + '<text x="66" y="24" font-size="18" fill="#343941">报告下限提高时，留下了多少？</text>'
      + [0, .25, .5, .75, 1].map(v => '<path d="M66 ' + y(v) + 'H592" stroke="#ded8cf"/><text x="12" y="' + (y(v) + 5) + '" font-size="16" fill="#62636a">' + fmt(v * 100, 0) + '%</text>').join('')
      + [30, 33, 36, 39, 42, 45, 48].map(v => '<text x="' + x(v) + '" y="285" text-anchor="middle" font-size="16" fill="#62636a">' + v + '</text>').join('')
      + '<path d="' + steps('area') + '" fill="none" stroke="#B8242A" stroke-width="3"/>'
      + '<path d="' + steps('count') + '" fill="none" stroke="#55768B" stroke-width="3" stroke-dasharray="7 4"/>'
      + '<path d="M' + x(cutoff).toFixed(2) + ' 48V326" stroke="#B08A4A" stroke-width="2" stroke-dasharray="4 4"/>'
      + '<circle cx="' + x(cutoff).toFixed(2) + '" cy="' + y(value.areaFraction).toFixed(2) + '" r="5" fill="#B8242A"/>'
      + '<circle cx="' + x(cutoff).toFixed(2) + '" cy="' + y(value.countFraction).toFixed(2) + '" r="5" fill="#55768B"/>'
      + sorted.map((p, i) => '<circle cx="' + x(p.diameter).toFixed(2) + '" cy="' + (i && p.diameter - sorted[i - 1].diameter < .35 ? 319 : 306) + '" r="' + (Math.sqrt(p.area) / 8).toFixed(2) + '" fill="' + (p.diameter >= cutoff ? '#B8242A' : '#b6b0a7') + '"><title>轮廓' + p.id + '：' + p.area + '像素，等效直径' + fmt(p.diameter, 2) + 'px</title></circle>').join('')
      + '<text x="66" y="340" font-size="16" fill="#343941">等效圆直径 / px　下方圆点：原12个检出轮廓</text>'
      + '<path d="M66 360h28" stroke="#B8242A" stroke-width="3"/><text x="103" y="365" font-size="16" fill="#343941">可见面积保留比例</text>'
      + '<path d="M340 360h28" stroke="#55768B" stroke-width="3" stroke-dasharray="7 4"/><text x="377" y="365" font-size="16" fill="#343941">颗粒数保留比例</text></svg>';
  }
  function readout(cutoff) {
    const v = calculate(cutoff);
    return '<strong>下限 ' + fmt(cutoff) + ' px：</strong>保留 ' + v.retainedCount + '/' + v.totalCount + ' 个轮廓（' + fmt(v.countFraction * 100) + '%），保留 ' + v.retainedPixels.toLocaleString('en-US') + '/' + v.totalPixels.toLocaleString('en-US') + ' 个可见像素（' + fmt(v.areaFraction * 100) + '%）。<br>'
      + (v.retainedCount === v.totalCount ? '所有原始轮廓均保留。' : v.retainedCount === 0 ? '没有轮廓达到下限；这里仍以原盘为分母，所以两种保留比例均为0。' : '较大轮廓贡献的像素更多，因此数量与面积留下的份额不同。')
      + ' 原盘分母始终为12个轮廓、14,582个可见像素；没有把被排除部分删掉再凑成100%。';
  }
  const style = '<style>[data-concept-scene="m1"]{font-size:18px;line-height:1.75;min-width:0}[data-concept-scene="m1"] .ct-chart{overflow-x:auto;max-width:100%}[data-concept-scene="m1"] .ct-controls{display:flex;align-items:center;flex-wrap:wrap;gap:16px}[data-concept-scene="m1"] label,[data-concept-scene="m1"] button,[data-concept-scene="m1"] figcaption{font-size:16px}[data-concept-scene="m1"] figure{margin:16px 0}[data-concept-scene="m1"] input{max-width:100%;accent-color:#B8242A}[data-concept-scene="m1"] .ct-readout{background:#F7F4EF;padding:14px;border-left:4px solid #B8242A}</style>';
  const backgroundHTML = '<section class="ct-widget" data-concept-scene="m1" data-concept-part="background">' + style
    + '<h3>小颗粒少报几粒，整盘就少了同样多的面积吗？</h3><p>把本例默认教学盘的12个实际检出轮廓固定下来，试设一个<strong>报告下限</strong>。每个轮廓的等效圆直径由它的可见面积计算：d＝2√(面积÷π)。面积按像素计，直径便以像素 px 计；缺少毫米标尺时，不能把它当作岩石内部砂粒的毫米粒度。</p>'
    + '<div class="ct-controls"><label>只保留等效直径至少 <output data-ct-cutoff-label>38.0 px</output> 的轮廓 <input disabled data-ct-cutoff type="range" min="30" max="48" step="0.5" value="38" aria-label="报告轮廓的等效直径下限，像素"></label><button disabled type="button" data-ct-reset>复位</button></div>'
    + '<figure><div class="ct-chart" data-ct-graphic>' + chart(38) + '</div><figcaption>两条线都除以原盘总量。蓝灰虚线每少一粒下降相同份额；朱红实线按该轮廓像素面积下降。拖到30 px可看全部保留，拖到48 px可看全部排除。</figcaption></figure><p class="ct-readout" data-ct-result>' + readout(38) + '</p>'
    + '<p style="font-size:16px">数据：既有合成教学盘 DEMO-017-P1，种子17、默认白光条件，经原 M1Core 校正与连通域分割所得面积。本单元只研究报告口径，不改变主演示。专业背景沿用 <a href="https://glossary.slb.com/terms/c/cuttings" target="_blank" rel="noopener">SLB cuttings</a> 对岩屑尺寸、外观与采样的说明；像素下限是本地教学计算。</p></section>';
  function mount(root) {
    root.querySelectorAll('[data-concept-scene="' + scene + '"]').forEach(host => {
      if (host.dataset.ctReady) return;
      host.dataset.ctReady = 'true';
      host.querySelectorAll('input,select,button').forEach(el => { el.disabled = false; });
      const slider = host.querySelector('[data-ct-cutoff]');
      function draw() {
        const cutoff = Number(slider.value);
        host.querySelector('[data-ct-cutoff-label]').textContent = fmt(cutoff) + ' px';
        host.querySelector('[data-ct-graphic]').innerHTML = chart(cutoff);
        host.querySelector('[data-ct-result]').innerHTML = readout(cutoff);
        host.dataset.ctState = JSON.stringify({ source: 'fixed_default_teaching_tray', input: { cutoff_px: cutoff }, ...calculate(cutoff) });
      }
      slider.addEventListener('input', draw); slider.addEventListener('change', draw);
      host.querySelector('[data-ct-reset]').addEventListener('click', () => { slider.value = 38; draw(); });
      draw();
    });
  }
  (g.S17Concepts || (g.S17Concepts = {}))[scene] = { backgroundAfter: 3, workflowAfter: 0, backgroundHTML, workflowHTML: '', mount };
})(globalThis);
