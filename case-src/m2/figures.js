(function (g) {
  'use strict';

  const ink = '#302C2C', muted = '#746B65', grid = '#DDD5CE';
  const red = '#B8242A', blue = '#55768B', gold = '#AE7F30', slate = '#776A7A';
  const paper = '#FBF9F6', colors = [red, blue, gold, slate];
  const W = 900, L = 92, R = 860;
  let serial = 0;
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = (n, digits = 1) => finite(n) ? n.toFixed(digits) : '—';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const times = rows => Array.isArray(rows) ? rows.filter(r => finite(r?.time_s)) : [];
  const scale = (a, b, c, d) => v => c + (v - a) / Math.max(1e-9, b - a) * (d - c);
  const line = (x1, y1, x2, y2, color = grid, extra = '') => `<line x1="${f(x1, 2)}" y1="${f(y1, 2)}" x2="${f(x2, 2)}" y2="${f(y2, 2)}" stroke="${color}" ${extra}/>`;
  const text = (x, y, value, extra = '') => `<text x="${f(x, 2)}" y="${f(y, 2)}" ${extra}>${esc(value)}</text>`;
  function niceMax(value) {
    if (!(value > 0)) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const n = value / power;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power;
  }
  const compact = n => !finite(n) ? '—' : Math.abs(n) >= 100 ? f(n, 0) : Math.abs(n) >= 10 ? f(n, 1).replace(/\.0$/, '') : f(n, 2).replace(/\.?0+$/, '');
  function path(points, x, y) {
    let open = false;
    return points.map(p => {
      if (!p || !finite(p[0]) || !finite(p[1])) { open = false; return ''; }
      const cmd = open ? 'L' : 'M'; open = true;
      return cmd + f(x(p[0]), 2) + ',' + f(y(p[1]), 2);
    }).join(' ');
  }
  function svg(kind, height, title, description, body) {
    const id = `m2-${typeof document==='undefined'?'static':'live'}-${kind}-${++serial}`;
    return `<svg class="m2-data-figure m2-figure-${kind}" data-m2-figure="${kind}" viewBox="0 0 ${W} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title ${id}-desc" style="display:block;width:100%;min-width:900px;height:auto"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(description)}</desc><g fill="${ink}" font-family="system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif" font-size="16">${body}</g></svg>`;
  }
  const empty = (kind, title, message) => svg(kind, 124, title, message, `<rect x="1" y="1" width="898" height="122" rx="18" fill="${paper}" stroke="${grid}"/>${text(28, 49, title, 'font-size="19" font-weight="650"')}${text(28, 83, message, `fill="${muted}"`)}`);
  function timeAxis(domain, y, x) {
    const count = 5, decimals = domain[1] - domain[0] >= 3600 ? 0 : 1;
    let out = line(L, y, R, y, muted);
    for (let i = 0; i <= count; i++) {
      const t = domain[0] + (domain[1] - domain[0]) * i / count, xx = x(t);
      out += line(xx, y, xx, y + 5, muted) + text(xx, y + 25, f(t / 60, decimals), 'text-anchor="middle"');
    }
    return out + text(R, y + 50, '记录时间 / min', `text-anchor="end" fill="${muted}"`);
  }
  function domainFor(rows, event, wide) {
    const a = rows[0].time_s, b = rows.at(-1).time_s;
    if (wide || !event || !finite(event.time_s)) return [a, b > a ? b : a + 1];
    const start = finite(event.start_s) ? event.start_s : event.time_s;
    const end = finite(event.end_s) ? event.end_s : event.time_s;
    const padding = Math.max(120, (end - start) * .65);
    return [Math.max(a, start - padding), Math.min(b, end + padding)];
  }
  function selectedBand(event, domain, x, top, bottom) {
    if (!event || !finite(event.time_s)) return '';
    const start = clamp(finite(event.start_s) ? event.start_s : event.time_s, ...domain);
    const end = clamp(finite(event.end_s) ? event.end_s : event.time_s, ...domain);
    return `<rect x="${f(x(start), 2)}" y="${top}" width="${f(Math.max(1, x(end) - x(start)), 2)}" height="${bottom - top}" fill="${red}" fill-opacity=".075"/>` +
      (event.time_s >= domain[0] && event.time_s <= domain[1] ? line(x(event.time_s), top, x(event.time_s), bottom, red, 'stroke-width="1.7" stroke-dasharray="5 5"') : '');
  }
  function verticalGrid(domain, x, top, bottom) {
    return Array.from({ length: 6 }, (_, i) => line(x(domain[0] + (domain[1] - domain[0]) * i / 5), top, x(domain[0] + (domain[1] - domain[0]) * i / 5), bottom, grid, 'stroke-dasharray="3 6"')).join('');
  }
  function valueAxis(max, top, bottom, y, min = 0) {
    return [min, (min + max) / 2, max].map(v => line(L, y(v), R, y(v)) + text(L - 12, y(v) + 5, compact(v), `text-anchor="end" fill="${muted}"`)).join('');
  }

  function gas(input, event, { components = false, wide = false, detectionThreshold = null } = {}) {
    const rows = times(input);
    if (!rows.length) return empty('gas', '气峰与组分', '当前没有可绘制的时间记录。');
    const domain = domainFor(rows, event, wide), x = scale(...domain, L, R);
    const shown = rows.filter(r => r.time_s >= domain[0] && r.time_s <= domain[1]);
    const keys = components ? ['gas', 'c1', 'c2', 'c3'] : ['gas'];
    const names = { gas: '总气', c1: 'C1 · 甲烷', c2: 'C2 · 乙烷', c3: 'C3 · 丙烷' };
    const rowH = components ? 110 : 212, top = 78, height = top + rowH * keys.length + 69;
    const detecting = !components && finite(detectionThreshold);
    const smoothed = detecting ? rows.map((r,i)=>[r.time_s,g.M2Core.mean(rows.slice(Math.max(0,i-1),i+2).map(v=>v.gas))]) : [];
    let out = text(24, 28, components ? '总气与 C1–C3：沿同一时间窗读取' : detecting ? '为什么选中这一段：平滑、平时水平与检测线' : '选中的气峰：读数、范围与峰顶', 'font-size="19" font-weight="650"');
    out += text(24, 55, components ? '纵轴均为教学仪器读数；各行独立刻度，不直接比较线高。' : detecting ? '浅灰：原始读数；朱红：相邻3次平均；阴影：超过检测线的连续窗口。' : '阴影是检测窗口，竖线是选中峰顶；曲线来自当前可见记录。', `fill="${muted}"`);
    keys.forEach((key, j) => {
      const a = top + rowH * j + 22, b = top + rowH * (j + 1) - 12;
      const values = shown.map(r => r[key]).filter(finite), max = niceMax(Math.max(0, ...values)), y = scale(0, max, b, a);
      out += `<rect x="${L}" y="${a}" width="${R - L}" height="${b - a}" rx="5" fill="${paper}"/>`;
      out += verticalGrid(domain, x, a, b) + selectedBand(event, domain, x, a, b) + valueAxis(max, a, b, y);
      out += text(L, a - 8, names[key], `fill="${colors[j]}" font-weight="650"`);
      if (values.length) out += `<path d="${path(shown.map(r => [r.time_s, r[key]]), x, y)}" fill="none" stroke="${detecting?'#b5aba3':colors[j]}" stroke-width="${detecting?'1.5':'2.5'}" stroke-linecap="round" stroke-linejoin="round"/>`;
      else out += text((L + R) / 2, (a + b) / 2, '当前分量无可用记录', `text-anchor="middle" fill="${muted}"`);
      if (event && finite(event.time_s) && event.time_s >= domain[0] && event.time_s <= domain[1] && g.M2Core) {
        const v = detecting ? smoothed.find(p=>p[0]===event.time_s)?.[1] : rows.length > 1 ? g.M2Core.at(rows, event.time_s, key) : rows[0][key];
        if (finite(v)) out += `<circle cx="${f(x(event.time_s), 2)}" cy="${f(y(v), 2)}" r="4.5" fill="${colors[j]}" stroke="white" stroke-width="1.5"><title>${esc(names[key])} ${f(v, 3)}；${f(event.time_s / 60, 2)} min</title></circle>`;
      }
      if(detecting){const background=event.background,limit=background+detectionThreshold,curve=smoothed.filter(p=>p[0]>=domain[0]&&p[0]<=domain[1]);out+=`<path data-m2-smoothed d="${path(curve,x,y)}" fill="none" stroke="${red}" stroke-width="2.6"/>`;out+=line(L,y(background),R,y(background),blue,`data-m2-background-line data-value="${background}" stroke-dasharray="3 5" stroke-width="1.7"`)+line(L,y(limit),R,y(limit),gold,`data-m2-threshold-line data-value="${limit}" stroke-dasharray="7 4" stroke-width="1.7"`);out+=text(R-8,y(background)+20,`平时水平 ${f(background,2)}`,`text-anchor="end" fill="${blue}"`)+text(R-8,y(limit)-10,`检测线：平时水平 + ${f(detectionThreshold,2)}`,`text-anchor="end" fill="${gold}"`);}
    });
    out += timeAxis(domain, top + rowH * keys.length - 10, x);
    return svg('gas', height, components ? '同一时间窗内的总气及三个组分读数' : '当前选中气峰的实际读数', components ? '四行共用记录时间，各行纵轴分别按实际数据定标。红色阴影和竖线在所有行标出同一检测窗口及峰顶。' : '曲线为实际输入记录，阴影表示检测起止时间，竖线表示当前事件峰顶时间。', out);
  }

  function stopIntervals(rows) {
    let start = null;
    const stops = [];
    rows.forEach((r, i) => {
      if (finite(r.flow) && Math.max(0, r.flow) <= 1e-10) {
        if (start == null) start = r.time_s;
      } else if (start != null) { stops.push([start, r.time_s]); start = null; }
      if (start != null && i === rows.length - 1) stops.push([start, r.time_s]);
    });
    return stops;
  }
  function clocks(input, event, features, { volume = 12, correctLag = true, operations = [] } = {}) {
    const rows = times(input), C = g.M2Core;
    if (rows.length < 2 || !C?.cumulative || !event || !finite(event.time_s)) return empty('clocks', '到达与来源', '需要当前事件、泵量和至少两条时间记录。');
    const arrival = event.time_s, source = finite(features?.sourceTime_s) ? features.sourceTime_s : null;
    const a = rows[0].time_s, b = rows.at(-1).time_s;
    const left = source == null ? a : Math.min(source, finite(event.start_s) ? event.start_s : arrival);
    const right = Math.max(arrival, finite(event.end_s) ? event.end_s : arrival);
    const pad = Math.max(120, (right - left) * .18), domain = [Math.max(a, left - pad), Math.min(b, right + pad)];
    const x = scale(...domain, L, R), cumulative = C.cumulative(rows);
    const all = rows.map((r, i) => ({ ...r, cumulative: cumulative[i], flowLs: finite(r.flow) ? r.flow * 1000 : null }));
    const shown = all.filter(r => r.time_s >= domain[0] && r.time_s <= domain[1]);
    const cArrival = C.at(all, arrival, 'cumulative');
    const cSource = source == null ? null : C.at(all, source, 'cumulative');
    const stops = stopIntervals(rows).filter(s => s[1] > domain[0] && s[0] < domain[1]);
    const tracks = [{ key: 'gas', name: '地面总气 · 教学仪器读数', top: 117, bottom: 196, color: red }, { key: 'flowLs', name: '泵送流量 Q · L/s', top: 255, bottom: 321, color: gold }, { key: 'cumulative', name: '累计泵送体积 C(t) · m³（局部纵轴）', top: 382, bottom: 461, color: blue }];
    let out = text(24, 28, '地面到达时刻，与井下来源时刻', 'font-size="19" font-weight="650"');
    out += text(24, 57, `地面到达 tₐ = ${f(arrival / 60, 2)} min`, `fill="${red}" font-weight="650"`);
    out += text(24, 84, source == null ? '来源 tₛ：累计体积不足，当前记录内无解' : `来源 tₛ = ${f(source / 60, 2)} min${finite(features?.sourceDepthMD_m) ? ' · ' + f(features.sourceDepthMD_m, 2) + ' m MD' : ''}`, `fill="${source == null ? gold : blue}" font-weight="650"`);
    if (!correctLag) out += text(R, 57, '未校正：来源暂按到达时刻', `text-anchor="end" fill="${gold}"`);
    tracks.forEach(track => {
      const values = shown.map(r => r[track.key]).filter(finite);
      let min = 0, max = niceMax(Math.max(0, ...values));
      if (track.key === 'cumulative' && values.length) {
        const low = Math.min(...values), high = Math.max(...values), step = niceMax(Math.max(.01, (high - low) / 4));
        min = Math.max(0, Math.floor(low / step) * step);
        max = Math.max(min + step, Math.ceil(high / step) * step);
      }
      const y = scale(min, max, track.bottom, track.top);
      out += `<rect x="${L}" y="${track.top}" width="${R - L}" height="${track.bottom - track.top}" rx="5" fill="${paper}"/>`;
      stops.forEach(([s, e]) => out += `<rect x="${f(x(Math.max(s, domain[0])), 2)}" y="${track.top}" width="${f(Math.max(1, x(Math.min(e, domain[1])) - x(Math.max(s, domain[0]))), 2)}" height="${track.bottom - track.top}" fill="${gold}" fill-opacity=".11"/>`);
      out += verticalGrid(domain, x, track.top, track.bottom) + valueAxis(max, track.top, track.bottom, y, min) + text(L, track.top - 10, track.name, `fill="${track.color}" font-weight="650"`);
      out += `<path d="${path(shown.map(r => [r.time_s, r[track.key]]), x, y)}" fill="none" stroke="${track.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      out += line(x(arrival), track.top, x(arrival), track.bottom, red, 'stroke-width="1.7" stroke-dasharray="5 4"');
      if (source != null && source >= domain[0] && source <= domain[1]) out += line(x(source), track.top, x(source), track.bottom, blue, 'stroke-width="1.7" stroke-dasharray="2 4"');
      if (track.key === 'cumulative' && finite(cArrival) && finite(cSource)) {
        const xx = clamp(x(arrival) + 16, L + 20, R - 5), ys = y(cSource), ya = y(cArrival);
        out += line(x(source), ys, xx, ys, blue, 'stroke-dasharray="3 4"') + line(x(arrival), ya, xx, ya, red, 'stroke-dasharray="3 4"');
        out += line(xx, ys, xx, ya, red, 'stroke-width="2.2"') + line(xx - 5, ys, xx + 5, ys, red, 'stroke-width="2"') + line(xx - 5, ya, xx + 5, ya, red, 'stroke-width="2"');
        out += `<circle cx="${f(x(source), 2)}" cy="${f(ys, 2)}" r="4" fill="${blue}"/><circle cx="${f(x(arrival), 2)}" cy="${f(ya, 2)}" r="4" fill="${red}"/>`;
      }
    });
    if (stops.length) {
      const longest = stops.slice().sort((u, v) => (v[1] - v[0]) - (u[1] - u[0]))[0];
      out += text(R, 235, `赭金区：停泵 ${f(longest[0] / 60, 1)}–${f(longest[1] / 60, 1)} min${stops.length > 1 ? ' 等' : ''}`, `text-anchor="end" fill="${gold}"`);
    } else out += text(R, 235, '当前时间窗内无停泵区间', `text-anchor="end" fill="${muted}"`);
    out += text(L,493,'实际作业记录 · 与上方共用时间轴，蓝线为来源候选',`fill="${muted}"`);
    [['connection','接单根',516],['trip','起下钻',549]].forEach(([type,label,yy])=>{out+=text(L-12,yy+15,label,`text-anchor="end" fill="${muted}"`)+`<rect x="${L}" y="${yy}" width="${R-L}" height="21" rx="4" fill="${paper}"/>`;operations.filter(o=>o.type===type&&o.end_s>=domain[0]&&o.start_s<=domain[1]).forEach(o=>{const xx=x(Math.max(domain[0],o.start_s)),width=Math.max(2,x(Math.min(domain[1],o.end_s))-xx);out+=`<rect data-m2-operation="${type}" data-start-s="${o.start_s}" data-end-s="${o.end_s}" x="${f(xx,2)}" y="${yy}" width="${f(width,2)}" height="21" rx="3" fill="${type==='connection'?gold:blue}" fill-opacity=".55"><title>${esc(label)}：${f(o.start_s/60,2)}—${f(o.end_s/60,2)} min</title></rect>`;});if(source!=null)out+=line(x(source),yy-4,x(source),yy+25,blue,'stroke-width="2" stroke-dasharray="2 3"');out+=line(x(arrival),yy-4,x(arrival),yy+25,red,'stroke-width="1.5" stroke-dasharray="5 4"');});
    out += timeAxis(domain, 580, x);
    const delta = finite(cArrival) && finite(cSource) ? cArrival - cSource : null;
    out += text(24, 661, delta == null ? `当前有效体积 = ${f(volume, 2)} m³；起点前所需体积未包含在记录中。` : `C(tₐ) − C(tₛ) = ${f(delta, 2)} m³；当前有效体积 = ${f(volume, 2)} m³${correctLag ? '' : '（未执行体积回退）'}`, `fill="${delta == null || !correctLag ? gold : ink}" font-weight="600"`);
    return svg('clocks', 682, '用实际累计体积与作业日志回查气峰来源', '总气、泵送流量、累计泵送体积和实际作业区间共用时间轴。到达为朱红虚线，来源为蓝灰点线；作业色带来自可见操作日志。', out);
  }

  const featureNames = ['峰高', '峰宽', '峰面积 /100', '上升斜率 ×100', '下降斜率 ×100', '组分协同', '距接单根 /300', '距起下钻 /300', '泵量 ×40', 'ROP /20', '工况缺失'];
  function validTrace(trace) { return Array.isArray(trace) ? trace.filter(p => Array.isArray(p) && finite(p[0]) && finite(p[1])) : []; }
  function queryTrace(rows, event, features) {
    const provided = validTrace(features?.trace);
    if (provided.length) return provided;
    if (!event || !finite(event.time_s)) return [];
    return times(rows).filter(r => r.time_s >= event.start_s && r.time_s <= event.end_s && finite(r.gas)).map(r => [r.time_s - event.time_s, r.gas]);
  }
  function featureComparison(features, model, samples) {
    const query = Array.isArray(features?.x) ? features.x : [];
    const dims = Math.min(query.length, ...samples.map(s => s.sample.x?.length ?? 0));
    if (!dims) return empty('neighbors', '实际近邻对照', '当前样本未提供可比较的数值特征。');
    const standardized = Array.isArray(model?.mu) && Array.isArray(model?.sd) && query.slice(0, dims).every((_, j) => finite(model.mu[j]) && finite(model.sd[j]) && model.sd[j] > 0);
    const values = [query, ...samples.map(s => s.sample.x)];
    const z = values.map(v => v.slice(0, dims).map((n, j) => standardized ? (n - model.mu[j]) / model.sd[j] : n));
    const maxZ = niceMax(Math.max(1, ...z.flat().filter(finite).map(Math.abs)));
    const px = 250, pz = 860, top = 158, rowH = 31, height = top + dims * rowH + 81;
    const xCommon = scale(-maxZ, maxZ, px, pz);
    let out = text(24, 28, `实际输入特征，与 ${samples.length} 个最近邻比较`, 'font-size="19" font-weight="650"');
    out += text(24, 54, '训练样本未完整提供原始轨迹；这里只比较已保存的实际数值。', `fill="${muted}"`);
    const labels = ['当前所选事件', ...samples.map((s, i) => `近邻 ${i + 1} · ${s.sample.group || '井号未提供'} · d=${f(s.neighbor.distance, 3)}`)];
    labels.forEach((label, i) => {
      const xx = 28 + (i % 2) * 435, yy = 84 + Math.floor(i / 2) * 29;
      out += `<circle cx="${xx}" cy="${yy - 5}" r="4.5" fill="${colors[i]}"/>` + text(xx + 12, yy, label, `fill="${colors[i]}"`);
    });
    out += text(24, 141, standardized ? 'z =（实际特征 − 训练均值）/ 训练标准差；所有行共用 z 刻度' : '缺少训练标准化参数；各行独立刻度，点上提示显示实际数值', `fill="${muted}"`);
    for (let j = 0; j < dims; j++) {
      const yy = top + j * rowH + 14;
      const row = z.map(v => v[j]).filter(finite), a = Math.min(...row), b = Math.max(...row);
      const pad = Math.max(.01, (b - a) * .15), xx = standardized ? xCommon : scale(a - pad, b + pad, px, pz);
      out += text(24, yy + 5, featureNames[j] || `特征 ${j + 1}`) + line(px, yy, pz, yy, grid, 'stroke-width="2"');
      if (standardized) out += line(xCommon(0), yy - 13, xCommon(0), yy + 13, muted, 'stroke-dasharray="3 4"');
      else out += text(px - 10, yy + 5, compact(a - pad), `text-anchor="end" fill="${muted}"`);
      z.forEach((v, i) => {
        if (!finite(v[j])) return;
        out += `<circle cx="${f(xx(v[j]), 2)}" cy="${f(yy + (i - 1.5) * 3.5, 2)}" r="${i ? 4 : 5}" fill="${colors[i]}" stroke="white" stroke-width="1"><title>${esc(labels[i])}；${esc(featureNames[j] || `特征 ${j + 1}`)}：${f(values[i][j], 4)}${standardized ? '；z=' + f(v[j], 3) : ''}</title></circle>`;
      });
    }
    const bottom = top + dims * rowH + 10;
    if (standardized) [-maxZ, -maxZ / 2, 0, maxZ / 2, maxZ].forEach(v => out += text(xCommon(v), bottom + 15, compact(v), 'text-anchor="middle"'));
    out += text(24, bottom + 51, '距离 d 使用实际预测结果；井号只用于追溯，不参与特征计算。', `fill="${muted}"`);
    return svg('neighbors', height, '原始轨迹缺失时的真实特征对照', '显示当前事件与真实最近邻样本的保存特征；有训练均值和标准差时统一标准化，否则逐行按实际范围定标。不生成替代曲线。', out);
  }
  function neighbors(rows, event, features, model, prediction) {
    const ranked = Array.isArray(prediction?.neighbors) ? prediction.neighbors.slice(0, 3) : [];
    const samples = ranked.map(neighbor => ({ neighbor, sample: model?.samples?.[neighbor.index] })).filter(s => s.sample);
    if (!samples.length) return empty('neighbors', '实际近邻对照', ranked.length ? '预测返回的样本索引在当前模型中不可用。' : '当前没有近邻预测结果。');
    const current = queryTrace(rows, event, features), other = samples.map(s => validTrace(s.sample.trace));
    if (!current.length || other.some(trace => !trace.length)) return featureComparison(features, model, samples);
    const all = [current, ...other], points = all.flat();
    const minT = Math.min(0, ...points.map(p => p[0])), maxT = Math.max(0, ...points.map(p => p[0]));
    const domain = [minT, maxT > minT ? maxT : minT + 1], x = scale(...domain, L, R);
    const max = niceMax(Math.max(0, ...points.map(p => p[1]))), rowH = 105, top = 82, height = top + all.length * rowH + 73;
    let out = text(24, 28, `当前气峰，与实际 ${samples.length} 个最近邻对照`, 'font-size="19" font-weight="650"');
    out += text(24, 55, '共同横轴：距各自峰顶 / s；共同纵轴：总气教学仪器读数。朱红虚线是当前峰。', `fill="${muted}"`);
    all.forEach((trace, i) => {
      const yy = top + i * rowH, a = yy + 18, b = yy + 78, y = scale(0, max, b, a);
      const label = i === 0 ? `当前所选事件 · 地面峰顶 ${f(event?.time_s / 60, 2)} min` : `近邻 ${i} · ${samples[i - 1].sample.group || '井号未提供'} · ${g.M2Core?.labels?.[samples[i - 1].neighbor.label] || '类别未提供'} · d=${f(samples[i - 1].neighbor.distance, 3)}`;
      out += text(L, yy + 2, label, `fill="${i ? colors[i] : red}" font-weight="650"`);
      out += `<rect x="${L}" y="${a}" width="${R - L}" height="${b - a}" rx="5" fill="${paper}"/>`;
      out += line(L, y(0), R, y(0)) + line(L, y(max), R, y(max)) + text(L - 12, y(0) + 5, '0', `text-anchor="end" fill="${muted}"`) + text(L - 12, y(max) + 5, compact(max), `text-anchor="end" fill="${muted}"`);
      out += line(x(0), a, x(0), b, muted, 'stroke-dasharray="3 5"');
      if (i) out += `<path d="${path(current, x, y)}" fill="none" stroke="${red}" stroke-opacity=".5" stroke-width="1.9" stroke-dasharray="5 4"/>`;
      out += `<path d="${path(trace, x, y)}" fill="none" stroke="${colors[i]}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    const bottom = top + all.length * rowH - 24;
    out += line(L, bottom, R, bottom, muted);
    for (let i = 0; i <= 4; i++) {
      const t = domain[0] + (domain[1] - domain[0]) * i / 4;
      out += line(x(t), bottom, x(t), bottom + 5, muted) + text(x(t), bottom + 27, `${t > 0 ? '+' : ''}${f(t, 0)}`, 'text-anchor="middle"');
    }
    out += text(R, bottom + 54, '距各自峰顶 / s；对齐只平移时间，不缩放曲线。', `text-anchor="end" fill="${muted}"`);
    return svg('neighbors', height, '当前气峰和实际训练近邻的原始轨迹', '当前事件和预测返回的前三个训练邻居按各自峰顶对齐，使用相同的相对时间与总气读数刻度。近邻行叠加当前峰的朱红虚线；显示模型中实际训练井号、类别和距离，不读取评价真值。', out);
  }

  g.M2Figures = { gas, clocks, neighbors };
})(globalThis);
