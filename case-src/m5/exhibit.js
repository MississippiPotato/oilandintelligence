(function (g) {
  'use strict';
  const C = g.M5Core, D = g.M5Data;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, digits = 2) => n == null ? '未提供' : Number(n).toFixed(digits);
  const name = i => C.labels[i] || '待分类复核';
  const defaultFixture = D.fixture();
  let cachedLibrary;
  const library = () => cachedLibrary || (cachedLibrary = C.train());
  const defaultResult = () => C.infer(library().model, defaultFixture.text, {margin: library().chosen.margin, sourceVersion: 1});
  const styles = `<style>
  .fx-exhibit[data-scene="m5"] .m5-paper{background:#fffdfa;border:1px solid #e3dcd3;border-radius:18px;padding:22px;box-shadow:0 7px 24px #47362608}
  .fx-exhibit[data-scene="m5"] .m5-quote{font:inherit;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f4ef;border-radius:14px;padding:18px;border-left:4px solid #b8242a}
  .fx-exhibit[data-scene="m5"] .m5-small{font-size:16px;line-height:1.65;color:#5c6269}
  .fx-exhibit[data-scene="m5"] .m5-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}
  .fx-exhibit[data-scene="m5"] .m5-grid>*{min-width:0}
  .fx-exhibit[data-scene="m5"] .m5-record{display:grid;gap:10px}
  .fx-exhibit[data-scene="m5"] .m5-record-row{border:1px solid #e1dcd5;border-radius:14px;padding:12px 16px;background:#fff}
  .fx-exhibit[data-scene="m5"] .m5-record-row b{display:block;color:#8e2028}
  .fx-exhibit[data-scene="m5"] .m5-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0}
  .fx-exhibit[data-scene="m5"] .m5-field{padding:12px 15px;border:1px solid #e2ded7;border-radius:12px;background:#fffdfa;overflow-wrap:anywhere}
  .fx-exhibit[data-scene="m5"] .m5-field small{display:block;color:#616773;font-size:16px;margin-bottom:4px}
  .fx-exhibit[data-scene="m5"] mark{padding:1px 3px;border-radius:4px;color:inherit;background:#f5ddcd}
  .fx-exhibit[data-scene="m5"] mark[data-m5-field="range"]{background:#dde6ed}
  .fx-exhibit[data-scene="m5"] mark[data-m5-field="negative"]{background:#f5d5d6;color:#8e2028}
  .fx-exhibit[data-scene="m5"] .m5-selection{background:#f5d5d6;color:#742029;box-shadow:0 0 0 2px #b8242a24}
  .fx-exhibit[data-scene="m5"] .m5-context{background:#dde6ed;color:#344c61;box-shadow:0 0 0 2px #8ca2b624}
  .fx-exhibit[data-scene="m5"] .m5-label{display:inline-flex;border-radius:99px;padding:4px 12px;background:#efe9e2;color:#554e47;font-size:16px;line-height:1.5}
  .fx-exhibit[data-scene="m5"] .m5-label.is-selected{background:#f6dfe0;color:#962029}
  .fx-exhibit[data-scene="m5"] .m5-example-buttons,.fx-exhibit[data-scene="m5"] .m5-sentences{display:flex;flex-wrap:wrap;gap:10px}
  .fx-exhibit[data-scene="m5"] button[data-m5-select],.fx-exhibit[data-scene="m5"] button[data-m5-reading-select]{text-align:left;line-height:1.7}
  .fx-exhibit[data-scene="m5"] button[aria-pressed="true"]{border-color:#b8242a;background:#f7e5e5;color:#8e2028}
  .fx-exhibit[data-scene="m5"] textarea[data-m5-raw]{box-sizing:border-box;width:100%;min-height:300px;border:1px solid #cfc7bd;border-radius:14px;background:#fffdfa;padding:16px;font:inherit;font-size:18px;line-height:1.85;resize:vertical;color:#292b2f}
  .fx-exhibit[data-scene="m5"] .m5-report-list{display:grid;gap:10px;margin:16px 0}
  .fx-exhibit[data-scene="m5"] .m5-report-button{display:block;width:100%;box-sizing:border-box;padding:15px 18px;border-radius:14px;border:1px solid #ded7ce;background:#fffdfa;cursor:pointer;font:inherit;color:inherit}
  .fx-exhibit[data-scene="m5"] .m5-report-button span{display:block;margin-top:7px;font-size:16px;color:#68635e}
  .fx-exhibit[data-scene="m5"] .m5-stage-copy{min-height:60px;color:#61636b}
  .fx-exhibit[data-scene="m5"] .m5-source-preview{max-height:330px;overflow:auto;scrollbar-gutter:stable}
  .fx-exhibit[data-scene="m5"] .m5-score svg{width:100%;min-width:480px;height:auto;display:block}
  .fx-exhibit[data-scene="m5"] .m5-score{overflow-x:auto}
  .fx-exhibit[data-scene="m5"] .m5-check{display:flex;align-items:flex-start;gap:10px;padding:17px;border-radius:14px;background:#f7f4ef;line-height:1.8}
  .fx-exhibit[data-scene="m5"] .m5-check input{width:22px;height:22px;flex:0 0 22px;margin-top:5px;accent-color:#b8242a}
  .fx-exhibit[data-scene="m5"] .m5-flow-facts{display:grid;gap:12px;margin:16px 0}
  .fx-exhibit[data-scene="m5"] .m5-flow-facts p{margin:0;padding:14px 18px;border-radius:12px;background:#f7f4ef;overflow-wrap:anywhere}
  .fx-exhibit[data-scene="m5"] .m5-flow-facts b{color:#8e2028;margin-right:12px}
  .fx-exhibit[data-scene="m5"] .m5-source-rule{border-top:1px solid #ded7ce;padding-top:14px;color:#5a616c;font-size:16px}
  .fx-exhibit[data-scene="m5"] .m5-handover{display:grid;gap:16px;margin:20px 0;padding:20px;border:1px solid #d9dedf;border-radius:16px;background:#F7F4EF}
  .fx-exhibit[data-scene="m5"] .m5-handover h3,.fx-exhibit[data-scene="m5"] .m5-handover h4,.fx-exhibit[data-scene="m5"] .m5-handover p{margin:0}
  .fx-exhibit[data-scene="m5"] .m5-depths{display:flex;flex-wrap:wrap;gap:8px}
  .fx-exhibit[data-scene="m5"] .m5-depths button,.fx-exhibit[data-scene="m5"] .m5-perspectives button{padding:8px 12px;border:1px solid #bac5c3;border-radius:9px;background:#fff;color:#34433f;cursor:pointer;font:inherit}
  .fx-exhibit[data-scene="m5"] .m5-depths button[aria-pressed="true"],.fx-exhibit[data-scene="m5"] .m5-perspectives button[aria-pressed="true"]{border-color:#a82c35;background:#f4e1df;color:#84252b;box-shadow:inset 0 0 0 1px #a82c35}
  .fx-exhibit[data-scene="m5"] .m5-perspectives{display:flex;flex-wrap:wrap;gap:8px}
  .fx-exhibit[data-scene="m5"] .m5-track-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .fx-exhibit[data-scene="m5"] .m5-track{min-width:0;display:grid;align-content:start;gap:8px;padding:14px;border:1px solid #dde1dd;border-radius:11px;background:#fff;overflow-wrap:anywhere}
  .fx-exhibit[data-scene="m5"] .m5-track h4{color:#713131}
  .fx-exhibit[data-scene="m5"] .m5-track small{font-size:14px;line-height:1.5;color:#59666b}
  .fx-exhibit[data-scene="m5"] .m5-track button{cursor:pointer;text-align:left;font:inherit;line-height:1.6;color:#742029;border:1px solid #dac6c3;background:#fff8f5;border-radius:8px;padding:8px}
  .fx-exhibit[data-scene="m5"] .m5-coverage{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
  .fx-exhibit[data-scene="m5"] .m5-coverage span{padding:8px;border-left:3px solid #7d9b91;background:#fff;border-radius:5px;font-size:15px;overflow-wrap:anywhere}
  .fx-exhibit[data-scene="m5"] .m5-coverage .missing{border-color:#c2a084}
  .fx-exhibit[data-scene="m5"] .m5-handover ul{margin:0;padding-left:1.3em;line-height:1.7}
  .fx-exhibit[data-scene="m5"] .m5-sample-note{padding:12px;border-left:3px solid #a9855a;background:#fffaf1;border-radius:6px}
  .fx-exhibit[data-scene="m5"] .m5-sample-note summary{cursor:pointer;font-weight:700;color:#70422d}
  .fx-exhibit[data-scene="m5"] .m5-sample-note p{margin-top:10px}
  .fx-exhibit[data-scene="m5"] .m5-depth-chart{min-width:0;background:#fff;border:1px solid #dde1dd;border-radius:11px;padding:10px}
  .fx-exhibit[data-scene="m5"] .m5-depth-scroll{overflow-x:auto}
  .fx-exhibit[data-scene="m5"] .m5-depth-chart svg{display:block;width:100%;min-width:650px;height:auto}
  .fx-exhibit[data-scene="m5"] svg text{font-family:inherit}
  @media(max-width:700px){.fx-exhibit[data-scene="m5"] .m5-grid,.fx-exhibit[data-scene="m5"] .m5-track-grid,.fx-exhibit[data-scene="m5"] .m5-coverage{grid-template-columns:1fr}.fx-exhibit[data-scene="m5"] .m5-fields{grid-template-columns:1fr}.fx-exhibit[data-scene="m5"] .m5-paper{padding:16px}.fx-exhibit[data-scene="m5"] textarea[data-m5-raw]{min-height:330px}.fx-exhibit[data-scene="m5"] .m5-handover{padding:14px}}
  </style>`;

  function fieldMarkup(text) {
    const pattern = /(?:未见|未发现|未检出|未观察到|无)(?:明显)?(?:的)?(?:荧光|发光|亮斑)|\d+(?:\.\d+)?\s*[—–~\-至]\s*\d+(?:\.\d+)?\s*(?:m\s*MD|m|米|s|秒|min|分钟)|\d+(?:\.\d+)?\s*(?:归一化单位|ppmv|ppm|%)/gi;
    let out = '', at = 0;
    for (const hit of text.matchAll(pattern)) {
      const kind = /未|无/.test(hit[0]) ? 'negative' : /—|–|~|\-|至/.test(hit[0]) ? 'range' : 'value';
      out += esc(text.slice(at, hit.index)) + `<mark data-m5-field="${kind}">${esc(hit[0])}</mark>`;
      at = hit.index + hit[0].length;
    }
    return out + esc(text.slice(at));
  }

  function fieldItems(fact) {
    const f = fact.fields, items = [
      ['井段（沿井眼深度）', f.depthRangeMD_m ? f.depthRangeMD_m.join('—') + ' m MD' : '原文未提供'],
      ['时段', f.timeRange_s ? f.timeRange_s.join('—') + ' s' : '原文未提供'],
      ['数值与单位', f.gasValue != null ? f.gasValue + ' ' + (f.gasUnit || '（未给单位）') : '该句未给气测数值'],
      ['观察的肯定／否定', f.fluorescence || f.gasValue != null || /气测|总气|总烃/.test(fact.rawQuote) ? (f.negation ? '否定：未见／未检出' : fact.flags.some(v => /否定表达|否定作用域/.test(v)) ? '否定作用范围待核对' : /见(?:明显)?荧光/.test(fact.rawQuote) ? '肯定：见明显荧光' : '未抽出否定词') : '该句没有此类观察']
    ];
    if (f.rock) items.push(['岩性词', f.rock]);
    if (f.operation) items.push(['操作词', f.operation]);
    return `<div class="m5-fields">${items.map(([k, v]) => `<div class="m5-field"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>`;
  }

  function scorePlot(prediction) {
    const max = Math.max(...prediction.scores), min = Math.min(...prediction.scores), span = Math.max(1, max - min);
    const rows = prediction.scores.map((score, i) => ({i, score, delta: score - max}));
    const scale = 300 / span, zero = 430;
    return `<div class="m5-score"><svg viewBox="0 0 600 275" role="img" aria-label="当前子句六类相对对数分数，最高类为零，向左越长表示与最高类差距越大"><text x="18" y="22" fill="#5d6570" font-size="16">当前子句 · 相对最高类的对数分数</text><line x1="${zero}" y1="36" x2="${zero}" y2="244" stroke="#918a80"/>${rows.map((r, j) => {const y = 48 + j * 34, width = Math.max(0, -r.delta * scale); return `<text x="18" y="${y + 17}" fill="#343941" font-size="18">${esc(name(r.i))}</text><rect x="${zero - width}" y="${y}" width="${Math.max(2, width)}" height="23" rx="5" fill="${r.i === prediction.proposedLabel ? '#b8242a' : '#9aabb9'}"/><circle cx="${zero - width}" cy="${y + 11.5}" r="4" fill="${r.i === prediction.proposedLabel ? '#b8242a' : '#6a7e90'}"/><text x="446" y="${y + 17}" fill="#343941" font-size="17">${fmt(r.delta)}</text>`;}).join('')}<text x="${zero}" y="267" text-anchor="end" fill="#5d6570" font-size="16">0 = 最高类；其余为相对对数分差</text></svg></div>`;
  }

  function rangeSources(raw, fact) {
    const sentence = [...raw.matchAll(/[^。；;\n]+/g)].find(m => m.index <= fact.sourceSpanStart && m.index + m[0].length >= fact.sourceSpanEnd);
    const start = sentence ? sentence.index : fact.sourceSpanStart, end = sentence ? start + sentence[0].length : fact.sourceSpanEnd;
    const specs = [
      {field: 'depthRangeMD_m', name: '井段', regex: /(\d+(?:\.\d+)?)\s*[—–\-~至]\s*(\d+(?:\.\d+)?)\s*(m(?![a-zA-Z])|米)(?:\s*MD)?/gi, unit: 'm MD'},
      {field: 'timeRange_s', name: '时段', regex: /(\d+(?:\.\d+)?)\s*[—–\-~至]\s*(\d+(?:\.\d+)?)\s*(min|分钟|s|秒)/gi, unit: 's'}
    ];
    return specs.filter(spec => fact.fields[spec.field]).map(spec => {
      let provider = null;
      for (const clause of C.split(raw).filter(c => c.start >= start && c.start <= fact.sourceSpanStart && c.end <= end)) {
        const hits = [...clause.text.matchAll(spec.regex)];
        if (hits.length !== 1) continue;
        const hit = hits[0], scale = spec.field === 'timeRange_s' && /min|分钟/i.test(hit[3]) ? 60 : 1, values = [Number(hit[1]) * scale, Number(hit[2]) * scale];
        if (values[1] < values[0]) continue;
        provider = {field: spec.field, name: spec.name, unit: spec.unit, values, start: clause.start + hit.index, end: clause.start + hit.index + hit[0].length, quote: hit[0], inherited: clause.start !== fact.sourceSpanStart};
      }
      if (!provider || C.stable(provider.values) !== C.stable(fact.fields[spec.field])) return {field: spec.field, name: spec.name, missing: true};
      return provider;
    });
  }

  function linkFieldSources(raw, inference) {
    // The engine's generic conflict rule treats touching interval endpoints as
    // overlapping. For this handover, require a shared interval of positive length.
    const before = inference.conflicts.length;
    inference.conflicts = inference.conflicts.filter(v => {
      const a = inference.facts[v.left].fields.depthRangeMD_m, b = inference.facts[v.right].fields.depthRangeMD_m;
      return a && b && Math.max(a[0], b[0]) < Math.min(a[1], b[1]);
    });
    if (inference.conflicts.length !== before) {
      const conflictFacts = new Set(inference.conflicts.flatMap(v => [v.left, v.right]));
      inference.facts.forEach((f, i) => {
        f.flags = f.flags.filter(v => v !== '同范围来源存在冲突');
        if (conflictFacts.has(i)) f.flags.push('同范围来源存在冲突');
        const claim = inference.claims[i];
        claim.statement = claim.statement.replace(/【需复核：[^】]*】$/, '') + (f.flags.length ? '【需复核：' + f.flags.join('；') + '】' : '');
        claim.originalStatement = claim.statement;
        claim.supportStatus = conflictFacts.has(i) ? 'conflict' : f.flags.some(v => /否定表达|否定作用域/.test(v)) ? 'unchecked' : 'rule_checked';
      });
    }
    inference.facts.forEach((f, i) => {
      f.rangeSources = rangeSources(raw, f);
      const claim = inference.claims[i];
      for (const ref of f.rangeSources.filter(v => v.inherited && !v.missing)) {
        if (!claim.sourceRefs.some(v => v.selector.start === ref.start && v.selector.end === ref.end)) claim.sourceRefs.push({sourceRecordId: 's17-user-record', sourceVersion: claim.sourceRefs[0].sourceVersion, selector: {type: 'text_span', start: ref.start, end: ref.end}});
      }
      if (f.rangeSources.some(v => v.missing)) {f.flags.push('范围来源待核对'); claim.supportStatus = 'unchecked';}
    });
    return inference;
  }

  function sourcePreview(raw, fact) {
    if (!fact) return esc(raw);
    const spans = [{start: fact.sourceSpanStart, end: fact.sourceSpanEnd, selected: true}, ...(fact.rangeSources || []).filter(v => v.inherited && !v.missing).map(v => ({start: v.start, end: v.end, selected: false}))].sort((a, b) => a.start - b.start);
    let out = '', at = 0;
    for (const span of spans) {if (span.start < at) continue; out += esc(raw.slice(at, span.start)) + `<mark class="${span.selected ? 'm5-selection' : 'm5-context'}" ${span.selected ? 'data-m5-active-source' : 'data-m5-inherited-source'}>${esc(raw.slice(span.start, span.end))}</mark>`; at = span.end;}
    return out + esc(raw.slice(at));
  }

  function inheritanceNote(fact) {
    const sources = fact.rangeSources || [], inherited = sources.filter(v => v.inherited && !v.missing), missing = sources.filter(v => v.missing);
    return inherited.map(v => `<p class="fx-note">${v.name}沿用本句前半段的“${esc(v.quote)}”。蓝灰高亮保留范围来源，朱红高亮定位当前观察；报告同时引用这两处原文。</p>`).join('') + (missing.length ? `<p class="fx-note">${missing.map(v => v.name).join('、')}的来源范围待核对，请检查完整原句。</p>` : '');
  }

  function factIdentity(fact) {
    return C.stable({quote: fact.rawQuote, fields: fact.fields, ranges: (fact.rangeSources || []).map(v => ({field: v.field, quote: v.quote || null, missing: !!v.missing}))});
  }

  function historyMatches(previousRun, inference, text) {
    if (!previousRun) return new Map();
    const oldFacts = previousRun.inference.facts, oldKeys = oldFacts.map(factIdentity), newKeys = inference.facts.map(factIdentity), matches = new Map();
    newKeys.forEach((key, i) => {
      if (previousRun.text === text && oldKeys[i] === key && oldFacts[i].sourceSpanStart === inference.facts[i].sourceSpanStart) {matches.set(i, i); return;}
      const previousIndices = oldKeys.map((v, j) => v === key ? j : -1).filter(j => j >= 0);
      if (previousIndices.length === 1 && newKeys.filter(v => v === key).length === 1) matches.set(i, previousIndices[0]);
    });
    return matches;
  }

  function readingExample(negative) {
    const text = '1220—1230 m MD：' + (negative ? '未见' : '见') + '明显荧光。';
    const result = C.infer(library().model, text, {margin: library().chosen.margin});
    const f = result.facts[0];
    return `<div class="m5-grid"><div><p class="m5-small">原始观察</p><div class="m5-quote">${fieldMarkup(text)}</div></div><div><p class="m5-small">该句实际抽出的字段</p>${fieldItems(f)}</div></div><p class="fx-note">${negative ? '“未见”记录了这次观察的否定含义，报告中与“荧光”一起保留。' : '去掉“未”以后，观察变为肯定；分类仍可能归入“荧光”，但事实已经改变。'}</p>`;
  }

  // The default snapshots contain actual upstream results, but do not share every
  // depth/sample link. Keep model-derived reference positions separate from observations.
  const depthBins = [[1200, 1230], ...Array.from({length: 8}, (_, i) => [1200 + i * 10, 1210 + i * 10])];
  const upstream = id => (g.M5EvidenceSnapshots || []).find(e => e.caseId === id && e.wellId === 'DEMO-017' && e.datasetId === 's17-synthetic-v1');
  const sourceRef = s => s ? {sourceRecordId: s.sourceRecordId, sourceVersion: s.sourceVersion} : null;
  const finiteRange = r => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite) && r[0] <= r[1];
  const overlaps = (a, b) => finiteRange(a) && finiteRange(b) && (a[0] === a[1] ? a[0] >= b[0] && a[0] < b[1] : Math.max(a[0], b[0]) < Math.min(a[1], b[1]));
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

  function intervalData(inference, intervalIndex) {
    const index = Math.max(0, Math.min(depthBins.length - 1, Number(intervalIndex) || 0));
    const range = depthBins[index], facts = inference.facts || [];
    const selected = facts.map((f, i) => ({fact: f, index: i})).filter(({fact}) => {
      const missing = (fact.rangeSources || []).some(s => s.field === 'depthRangeMD_m' && s.missing);
      return !missing && overlaps(fact.fields.depthRangeMD_m, range);
    });
    const by = field => selected.filter(x => x.fact.fields[field] != null);
    const gas = upstream('s17-mudgas-context'), gasSource = gas && gas.sources[0];
    const gasResult = gasSource && gasSource.content && gasSource.content.modelResult;
    const gasFeatures = gasResult && gasResult.features, gasDepth = gasFeatures && gasFeatures.sourceDepthMD_m;
    const gasHere = Number.isFinite(gasDepth) && gasDepth >= range[0] && gasDepth < range[1];
    const drilling = upstream('s17-drilltime-boundaries'), drillingSource = drilling && drilling.sources[0];
    const drillingContent = drillingSource && drillingSource.content || {};
    const rows = (drillingContent.rows || []).filter(r => Number.isFinite(r.depthMD_m) && r.depthMD_m >= range[0] && (r.depthMD_m < range[1] || index === depthBins.length - 1 && r.depthMD_m === range[1]));
    const active = rows.filter(r => r.active && Number.isFinite(r.drillTime_min_m));
    const drillValues = active.map(r => r.drillTime_min_m), wobValues = active.map(r => r.WOB_kN).filter(Number.isFinite), rpmValues = active.map(r => r.RPM).filter(Number.isFinite);
    const boundaries = (drilling && drilling.claims || []).filter(c => c.sourceRefs.some(ref => ref.selector && ref.selector.type === 'depth_range' && overlaps(ref.selector.depthRangeMD_m, range)));
    const m1 = upstream('s17-cuttings-lithology'), m3 = upstream('s17-fluorescence-review');
    const s1 = m1 && m1.sources[0], s3 = m3 && m3.sources[0], id1 = s1 && s1.content.identity, id3 = s3 && s3.content.identity;
    const identityKeys = ['wellId', 'parentSampleId', 'sampleId', 'capturePairId'];
    const paired = !!(id1 && id3 && identityKeys.every(k => id1[k] && id1[k] === id3[k]));
    const differences = [];
    for (let i = 0; i < selected.length; i++) for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i].fact, b = selected[j].fact, ar = a.fields.depthRangeMD_m, br = b.fields.depthRangeMD_m;
      if (Math.max(ar[0], br[0], range[0]) >= Math.min(ar[1], br[1], range[1])) continue;
      if (a.fields.gasValue != null && b.fields.gasValue != null && a.fields.gasUnit && a.fields.gasUnit === b.fields.gasUnit && a.fields.gasValue !== b.fields.gasValue) differences.push({kind: 'gas', left: selected[i].index, right: selected[j].index, message: '重叠范围的气测读数不同；核对采样时段、单位和记录来源。'});
      if (a.fields.gasValue != null && b.fields.gasValue != null && a.fields.gasValue !== b.fields.gasValue && (!a.fields.gasUnit || !b.fields.gasUnit)) differences.push({kind: 'gas_unit_missing', left: selected[i].index, right: selected[j].index, message: '重叠范围的气测读数不同且单位不完整；先补全单位，再核对采样时段。'});
      if (a.fields.gasValue != null && b.fields.gasValue != null && a.fields.gasUnit && b.fields.gasUnit && a.fields.gasUnit !== b.fields.gasUnit) differences.push({kind: 'gas_unit_difference', left: selected[i].index, right: selected[j].index, message: '重叠范围的气测记录使用不同单位；先核对计量口径，再比较读数。'});
      if (a.fields.fluorescence && b.fields.fluorescence && a.fields.negation !== b.fields.negation) differences.push({kind: 'fluorescence', left: selected[i].index, right: selected[j].index, message: '重叠范围的荧光记录肯定／否定不同；核对样品、观察条件与时段。'});
    }
    const questions = [];
    if (!by('rock').length) questions.push('补充能归到本井段的岩屑观察，并核对采样与迟到记录。');
    if (!by('fluorescence').length) questions.push('补充本井段荧光观察，以及样品身份和观察条件。');
    if (!by('gasValue').length && !gasHere) questions.push('补充气测记录，并检查循环和气体迟到归位。');
    if (gasHere) questions.push('核对气峰回查所用泵量、来源时段与接单根记录；参考位置仍需复核。');
    if (differences.length) questions.push('把记录间的差异保留到交接，核对单位、时段和样品后再判断。');
    questions.push(active.length ? `将这段钻时与工况${boundaries.length ? '及候选界面' : ''}带给测井解释人员，沿深度对照伽马、电阻率等已有或后续曲线。` : '补充本井段钻时和工况，再与已有或后续测井曲线按深度对照。');
    return {index, range, selected, rocks: by('rock'), gasText: by('gasValue'), fluorescence: by('fluorescence'), gas, gasSource, gasResult, gasFeatures, gasHere, drilling, drillingSource, rows, active, drillValues, wobValues, rpmValues, boundaries, m1, m3, s1, s3, id1, id3, paired, differences, questions, unlocated: facts.filter(f => !finiteRange(f.fields.depthRangeMD_m)).length};
  }

  function intervalExport(inference, claims, intervalIndex) {
    const d = intervalData(inference, intervalIndex), gasClaim = d.gas && d.gas.claims[0];
    return {
      intervalMD_m: d.range, intervalConvention: '左闭右开；最后一段包含1280 m，文本范围需有正长度重叠；汇总范围中的记录各自保留自己的范围',
      textClaimIds: d.selected.map(v => claims[v.index] && claims[v.index].claimId).filter(Boolean),
      textRecordCount: d.selected.length, textWithoutDepthCount: d.unlocated,
      differences: d.differences,
      gasReference: d.gasHere && gasClaim ? {kind: 'model_inference', claimId: gasClaim.claimId, sourceRefs: [...gasClaim.sourceRefs, {...sourceRef(d.gasSource), selector: {type: 'time_range', timeRange_s: [d.gasFeatures.sourceTime_s, d.gasResult.event.time_s]}}], sourceTime_s: d.gasFeatures.sourceTime_s, sourceDepthMD_m: d.gasFeatures.sourceDepthMD_m, eventTimeRange_s: gasClaim.sourceRefs[0].selector.timeRange_s, method: d.gasResult.method, reviewStatus: gasClaim.reviewStatus} : null,
      drillingObservation: d.drillingSource && d.rows.length ? {sourceRef: {...sourceRef(d.drillingSource), selector: {type: 'depth_range', depthRangeMD_m: d.range}}, pointCount: d.rows.length, activePointCount: d.active.length, meanDrillTime_min_m: mean(d.drillValues), minDrillTime_min_m: d.drillValues.length ? Math.min(...d.drillValues) : null, maxDrillTime_min_m: d.drillValues.length ? Math.max(...d.drillValues) : null, meanWOB_kN: mean(d.wobValues), meanRPM: mean(d.rpmValues)} : null,
      drillingCandidates: d.boundaries.map(c => ({claimId: c.claimId, statement: c.statement, kind: c.kind, sourceRefs: c.sourceRefs, reviewStatus: c.reviewStatus})),
      samplePair: d.paired ? {identity: d.id1, sources: [sourceRef(d.s1), sourceRef(d.s3)], claims: [d.m1.claims[0], d.m3.claims[0]].map(c => ({claimId: c.claimId, statement: c.statement, kind: c.kind, value: c.value, unit: c.unit, sourceRefs: c.sourceRefs, reviewStatus: c.reviewStatus})), depthStatus: 'not_provided_in_snapshots'} : null,
      upstreamPackages: [d.m1, d.gas, d.m3, d.drilling].filter(Boolean).map(p => ({caseId: p.caseId, caseVersion: p.caseVersion, runId: p.runId, wellId: p.wellId, datasetId: p.datasetId, dataNature: p.dataNature, method: p.runConfig.method})),
      nextChecks: d.questions,
      status: 'teaching_handover_needs_review',
      provenance: '上游为构建期快照；文本与快照独立，样品深度和跨源对应未补造。'
    };
  }

  function intervalChart(inference, d) {
    const x = value => 160 + Math.max(0, Math.min(80, value - 1200)) * 9.5;
    const tracks = [{label:'岩屑文字', field:'rock', y:57, color:'#9d6950'}, {label:'气测文字', field:'gasValue', y:95, color:'#b98b3e'}, {label:'荧光文字', field:'fluorescence', y:133, color:'#8278a9'}];
    const bands = tracks.map(track => (inference.facts || []).filter(f => f.fields[track.field] != null && !(f.rangeSources || []).some(s => s.field === 'depthRangeMD_m' && s.missing) && overlaps(f.fields.depthRangeMD_m, [1200,1280])).map(f => {
      const r = f.fields.depthRangeMD_m;
      return `<rect x="${x(r[0])}" y="${track.y - 10}" width="${Math.max(2, x(r[1]) - x(r[0]))}" height="20" rx="4" fill="${track.color}" opacity=".9"><title>${esc(f.rawQuote)}</title></rect>`;
    }).join('')).join('');
    const points = (d.drillingSource && d.drillingSource.content.rows || []).filter(r => r.active && Number.isFinite(r.depthMD_m) && r.depthMD_m >= 1200 && r.depthMD_m <= 1280).map(r => `<circle cx="${x(r.depthMD_m)}" cy="171" r="1.6" fill="#567f78"/>`).join('');
    const candidates = (d.drilling && d.drilling.claims || []).filter(c => Number.isFinite(c.value) && c.value >= 1200 && c.value <= 1280).map(c => `<path d="M${x(c.value)-5},155 h10 l-5,9 z" fill="#a9232d"><title>${esc(c.statement)}</title></path>`).join('');
    const gasDepth = d.gasFeatures && d.gasFeatures.sourceDepthMD_m;
    const gasPoint = Number.isFinite(gasDepth) && gasDepth >= 1200 && gasDepth <= 1280 ? `<path d="M${x(gasDepth)},80 l6,6 -6,6 -6,-6 z" fill="#a9232d"><title>气峰回查参考深度 ${fmt(gasDepth)} m MD，模型候选</title></path>` : '';
    return `<div class="m5-depth-chart"><div class="m5-depth-scroll"><svg viewBox="0 0 960 225" role="img" aria-label="1200至1280米深度对照：文字范围、气峰回查参考点及钻时观测点和候选界面；背景高亮所选井段"><rect x="${x(d.range[0])}" y="28" width="${x(d.range[1])-x(d.range[0])}" height="156" fill="#edf4ed"/>${tracks.map(t=>`<text x="8" y="${t.y+6}" font-size="17" fill="#394b4a">${t.label}</text><line x1="160" x2="920" y1="${t.y}" y2="${t.y}" stroke="#d8dfdb"/>`).join('')}<text x="8" y="177" font-size="17" fill="#394b4a">钻时逐点</text><line x1="160" x2="920" y1="171" y2="171" stroke="#d8dfdb"/>${bands}${points}${candidates}${gasPoint}<line x1="160" x2="920" y1="194" y2="194" stroke="#6c7974"/>${Array.from({length:9},(_,i)=>`<line x1="${x(1200+i*10)}" x2="${x(1200+i*10)}" y1="194" y2="200" stroke="#6c7974"/><text x="${x(1200+i*10)}" y="218" text-anchor="middle" font-size="15" fill="#4c5e59">${1200+i*10}</text>`).join('')}</svg></div><p class="m5-small">横轴：m MD。彩色条是文字各自的范围；绿色小点是有效钻时记录；红色倒三角是 M4 界面候选，菱形是 M2 气峰回查参考点。浅绿背景随所选井段变化；图可横向滑动。</p></div>`;
  }

  function revealIntervalChart(panel, index) {
    const chart = panel.querySelector('.m5-depth-scroll'), svg = chart && chart.querySelector('svg'), range = depthBins[index];
    if (!svg || !range) return;
    const midpoint = (160 + ((range[0] + range[1]) / 2 - 1200) * 9.5) * svg.clientWidth / 960;
    chart.scrollLeft = index < 2 ? 0 : Math.max(0, midpoint - chart.clientWidth / 2);
  }

  function handoverHTML(inference, intervalIndex, perspective, clickable) {
    const d = intervalData(inference, intervalIndex), label = d.range.join('—') + ' m MD';
    const sourceLabel = s => s ? `${esc(s.sourceRecordId)} · 版本 ${esc(s.sourceVersion)}` : '快照来源未提供';
    const factList = list => list.length ? list.map(({fact, index}) => clickable ? `<button type="button" data-m5-handover-fact="${index}">${esc(fact.rawQuote)}<br><small>查看对应报告原文</small></button>` : `<p>${esc(fact.rawQuote)}</p>`).join('') : '<p>当前原文未提供该井段记录。</p>';
    const coverage = [
      ['岩屑文字', d.rocks.length ? d.rocks.length + '条有井段' : '本段缺记录', !!d.rocks.length],
      ['气测', d.gasText.length ? d.gasText.length + '条文字记录' : d.gasHere ? '有回查参考点' : '本段缺记录', !!(d.gasText.length || d.gasHere)],
      ['荧光文字', d.fluorescence.length ? d.fluorescence.length + '条有井段' : '本段缺记录', !!d.fluorescence.length],
      ['钻时／工况', d.rows.length ? d.active.length + '个有效点' : '本段缺记录', !!d.active.length]
    ];
    const drill = d.rows.length ? `<p>本段 ${d.rows.length} 个深度记录，其中有效钻进 ${d.active.length} 点。${d.active.length ? `钻时均值 ${fmt(mean(d.drillValues))} min/m（范围 ${fmt(Math.min(...d.drillValues))}—${fmt(Math.max(...d.drillValues))}）；钻压均值 ${fmt(mean(d.wobValues))} kN，转速均值 ${fmt(mean(d.rpmValues))} rev/min。` : '当前无可计算钻时的有效点。'}</p><small>${sourceLabel(d.drillingSource)} · 按实际深度行筛选；均值从这些行计算。</small>` : '<p>这份钻时快照没有所选井段的数据。</p>';
    const pair = d.paired ? `<details class="m5-sample-note"><summary>补充：前例白光与 UV 同样品对照</summary><p>M1 与 M3 快照的样品 ${esc(d.id1.sampleId)}、配对 ${esc(d.id1.capturePairId)} 相同；两份来源均未给出样品井段。</p><p>白光候选：${esc(d.m1.claims[0].statement)} UV 候选：${esc(d.m3.claims[0].statement)} 二者可按样品身份比较；需核对迟到与样品深度才能放到上面的井段。</p><small>${sourceLabel(d.s1)}；${sourceLabel(d.s3)}。两项均为构建期计算快照，待核对。</small></details>` : '<details class="m5-sample-note"><summary>补充：前例样品对照</summary><p>样品身份或配对关系尚未提供，先核对样品记录。</p></details>';
    const issues = d.differences.length ? `<p><b>记录差异：</b>${d.differences.map(v => esc(v.message)).join(' ')}</p>` : '<p>当前所选文字中没有检出同范围、同单位数值或荧光肯定／否定差异。</p>';
    let detail;
    if (perspective === 'interpret') {
      const gas = d.gasHere && d.gasResult ? `<p>气峰在地面 ${esc(d.gasResult.event.start_s)}—${esc(d.gasResult.event.end_s)} s 被记录；按累计有效泵量回查，来源时刻约 ${fmt(d.gasFeatures.sourceTime_s, 0)} s，参考深度 ${fmt(d.gasFeatures.sourceDepthMD_m)} m MD。候选：${esc(d.gas.claims[0].statement)}</p><small>${sourceLabel(d.gasSource)} · 这是上游模型结果，当前井段由参考点匹配，待核查。</small>` : '<p>气峰快照的回查参考点不在所选井段，或参考位置未提供。</p>';
      const boundaries = d.boundaries.length ? d.boundaries.map(c => `<p>${esc(c.statement)}</p>`).join('') + `<small>${sourceLabel(d.drillingSource)} · 按候选的来源深度范围匹配。</small>` : '<p>这份快照在本段没有来源范围与之重叠的候选界面。</p>';
      detail = `<div class="m5-track-grid"><div class="m5-track"><h4>气峰的候选解释</h4>${gas}</div><div class="m5-track"><h4>钻时的候选界面</h4>${boundaries}</div></div>${issues}<div class="m5-track"><h4>交给下一步核查</h4><ul>${d.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></div>`;
    } else {
      detail = `<div class="m5-track-grid"><div class="m5-track"><h4>岩屑文字</h4>${factList(d.rocks)}<small>来源：当前录井原文，按抽出的井段筛选。</small></div><div class="m5-track"><h4>气测文字</h4>${factList(d.gasText)}<small>来源：当前录井原文，数值与单位一起保留。</small></div><div class="m5-track"><h4>荧光文字</h4>${factList(d.fluorescence)}<small>来源：当前录井原文，肯定与否定按原话保留。</small></div><div class="m5-track"><h4>钻时与工况</h4>${drill}</div></div>${issues}`;
    }
    return `<section class="m5-handover" aria-label="井段综合对照"><h3>选择井段，汇集和比较观察</h3><p>先从 1200—1230 m 的三条文字观察和前例记录读起，再选择较小井段，看看每种资料在哪一部分出现。</p>${intervalChart(inference, d)}<div class="m5-depths" aria-label="选择教学井段">${depthBins.map((r, i) => `<button type="button" data-m5-interval="${i}" aria-pressed="${i === d.index}">${i === 0 ? '汇总 ' : ''}${r[0]}—${r[1]}</button>`).join('')}</div><p class="m5-small">当前 ${esc(label)}。各条记录保留自己的具体范围；范围仅端点相接不算重叠。逐深度点按左闭右开筛选，最后一段包含 1280 m。</p><div class="m5-coverage">${coverage.map(([k, v, present]) => `<span class="${present ? '' : 'missing'}"><b>${esc(k)}</b><br>${esc(v)}</span>`).join('')}</div><div class="m5-perspectives" aria-label="选择阅读视角"><button type="button" data-m5-perspective="observe" aria-pressed="${perspective !== 'interpret'}">观察与覆盖</button><button type="button" data-m5-perspective="interpret" aria-pressed="${perspective === 'interpret'}">候选与下一步</button></div>${detail}${pair}<p class="m5-small">当前原文另有 ${d.unlocated} 条未给深度的记录，保留在原文中。前例使用构建期快照，文字记录与快照保留各自来源。</p></section>`;
  }

  const reference = linkFieldSources(defaultFixture.text, defaultResult());
  const chapters = [
    {id: 'records', title: '一段井，怎样汇集不同观察', en: 'INTERVAL HANDOVER', html: styles + `<p>钻头把岩石钻成碎屑，钻井液把岩屑和部分气体带回地面。录井人员看岩屑与紫外荧光、检测气体，并记录钻时及操作。综合解释先把观察放回它各自有依据的井段或时段，再把候选和待核查问题交给下一环节。</p><p><b>岩性</b>描述岩石类别与特征；<b>气测</b>是地面气体读数；<b>荧光</b>记录样品受光后发光；<b>工况</b>是钻进、停泵等操作状态。岩屑和气到达地面的时间晚于井底活动，需要查采样与迟到记录。</p><p><b>测井</b>用井中仪器采集地层物理响应，并沿深度绘成曲线。自然伽马曲线记录地层天然放射性，帮助辨认岩性变化；电阻率曲线记录地层阻碍电流的程度，为流体解释提供线索。把这些曲线与录井观察按深度对照，就能继续核查候选井段。</p><div data-m5-reading-handover>${handoverHTML(reference, 0, 'observe', false)}</div><p class="fx-note">试着选 1200—1210、1210—1220 和 1220—1230 m，比较每段有哪些记录；再选“候选与下一步”，看能提出什么问题。报告会保留这些观察的来处，也将缺项交给后续核查。</p><p class="m5-source-rule">专业依据：<a href="https://www.slb.com/resource-library/oilfield-review/defining-series/defining-mud-logging" target="_blank" rel="noreferrer">SLB · Mud Logging</a>；<a href="https://glossary.slb.com/en/terms/g/gas_show" target="_blank" rel="noreferrer">SLB · Gas show</a>；<a href="https://www.slb.com/zh-cn/resource-library/oilfield-review/defining-series/defining-log-interpretation" target="_blank" rel="noreferrer">SLB · 测井解释</a>。本图使用教学文字及前例的构建期快照。测井可以是已有的随钻资料，也可以是随后取得的资料。</p>`},
    {id: 'qualifiers', title: '一个“未”字，也是一项必须保留的事实', en: 'MEANING', html: `<p>“未见明显荧光”和“见明显荧光”含义相反。报告不仅要留下“荧光”这个主题，还要留下否定、范围和单位。<b>字段</b>就是从句子中单独保留的信息项。</p><p>例子里的 <b>m MD</b> 表示以米计的沿井眼深度：顺着井眼量的长度。斜井的MD与垂直深度不同。“归一化单位”表示本例气测读数采用统一的教学数值尺度。</p><div class="m5-example-buttons"><button type="button" data-m5-negation="negative" aria-pressed="true">原句：未见明显荧光</button><button type="button" data-m5-negation="positive" aria-pressed="false">删去“未”：见明显荧光</button></div><div data-m5-reading-negation>${readingExample(true)}</div><p class="m5-small">看哪里：蓝灰标井段，朱红标否定，数字与单位始终一起读。上方按钮实际重新抽取这条短句。</p><p class="m5-source-rule">术语依据：<a href="https://glossary.slb.com/en/terms/m/measured_depth" target="_blank" rel="noreferrer">SLB · Measured depth</a>。字段切分和否定处理由本例现有规则实际计算。</p>`},
    {id: 'routing', title: '分类找栏目，抽取保留原话里的事实', en: 'TWO TASKS', html: `<p>面对一条原始记录，有两个不同的问题：<b>它该放进报告的哪一栏？它具体说了什么？</b>本例用文本分类协助回答前一个问题，用字段规则处理后一个问题。</p><div class="m5-grid"><div class="m5-paper"><h3>同一条原文</h3><div class="m5-quote">${fieldMarkup(reference.facts[1].rawQuote)}</div><h3>抽取出的事实</h3>${fieldItems(reference.facts[1])}</div><div class="m5-paper"><h3>六个栏目，比较文字线索</h3>${scorePlot(reference.facts[1].prediction)}<p class="m5-small">当前候选：${esc(name(reference.facts[1].category))}；关键词基线：${esc(name(reference.facts[1].baseline))}。</p></div></div><p><b>朴素贝叶斯</b>先在已分类的训练句子里统计文字片段，再为新子句比较各栏目的分数。本例使用单字与相邻双字；图上的0表示最高类，其余值是与最高类的分差。数值越接近0，越接近当前最高分。</p><p class="fx-note">栏目回答“放在哪里”，字段回答“具体说什么”：把“1210—1220 m MD、3.2、归一化单位”逐项对照原文。</p><p class="m5-source-rule">方法依据：<a href="https://nlp.stanford.edu/IR-book/html/htmledition/naive-bayes-text-classification-1.html" target="_blank" rel="noreferrer">Manning 等 · Naive Bayes text classification</a>。分数来自当前引擎固定训练库的实际计算。</p>`},
    {id: 'trace', title: '报告里的每句话，都能回到它的原文', en: 'BACK TO SOURCE', html: `<p>整理后的报告应保留观察原意。本例把栏目、井段和原文引述组装成报告句子，同时保存来源版本与原文范围。点击一句报告，就能回到生成它的那段文字。</p><div class="m5-grid"><div class="m5-paper"><h3>原始记录</h3><div class="m5-quote">${fieldMarkup(reference.facts[2].rawQuote)}</div><p class="m5-small">这次观察：1220—1230 m MD；未见明显荧光。</p></div><div class="m5-paper"><h3>整理到报告</h3><div class="m5-quote">${esc(reference.claims[2].statement)}</div><p class="m5-small">范围与否定一起保留。点击可运行示范中的句子，可定位真实原文字符范围。</p></div></div><p><b>来源定位</b>回答“这句话从哪里来”；逐句核对还要回答“这句话是否保留了原意”。原文改了以后，会形成新的修订，原来的确认也要重新检查。</p><p class="fx-note">接下来试一次：先核对荧光句，再将“未见”改为“见”。观察报告和字段怎样变化，以及旧核对为什么撤销。</p><p class="m5-source-rule">来源关系参考：<a href="https://www.w3.org/TR/prov-dm/" target="_blank" rel="noreferrer">W3C · PROV-DM</a> 中的引述与修订概念；保存接口沿用本项目证据格式。</p>`}
  ];

  const steps = [
    {name: '对齐井段与检查覆盖', input: '当前原文井段和已有前例快照。', action: '按实际范围筛选观察，单列未归段样品和模型回查参考点。', output: '选定井段的覆盖、缺项和来源。'},
    {name: '分句与字段抽取', input: '当前原文中的实际字符。', action: '按标点切成子句，抽取范围、数值、单位和否定。', output: '有起止字符位置的子句及实际字段。'},
    {name: '文本分类分流', input: '当前子句中的单字和相邻双字片段。', action: '用固定训练库的朴素贝叶斯计算六类分数，同时运行关键词基线。', output: '栏目候选、六类分数与基线栏目。'},
    {name: '组装有来源的报告', input: '当前子句的栏目、范围和原文。', action: '用引述模板组装句子，并绑定来源版本与文字范围。', output: '可点击回查原文的报告句子。'},
    {name: '逐句核查与交接', input: '当前报告句子、原文与选定井段。', action: '核对范围、数值、单位和否定，保留缺项并提出测井对照问题。', output: '当前核对状态、选段交接与待核查问题。'}
  ];

  const labHTML = styles + `<div class="fx-card"><h2>综合井段资料，生成可回查报告</h2><p>先在下方选择井段，对照现有资料与缺项；再选择一条原文，看它怎样进入报告。改动原文后，井段覆盖和报告会一起更新。</p><nav class="fx-stage-nav m5-sentences" aria-label="报告演示阶段"><button type="button" data-m5-stage="0" aria-pressed="true">读原文</button><button type="button" data-m5-stage="1" aria-pressed="false">看字段与分流</button><button type="button" data-m5-stage="2" aria-pressed="false">核对报告</button></nav><p class="m5-stage-copy" data-m5-stage-copy></p><div class="m5-example-buttons"><button type="button" data-m5-example="negation">改“未见／见”</button><button type="button" data-m5-example="value">改总气3.2／5.1</button><button type="button" data-m5-example="range">改荧光井段</button></div><p class="m5-small" data-m5-input-note>点示例按钮只改一处。修改后自动重新计算。</p></div><div data-m5-lab-handover></div><div class="m5-grid"><section class="fx-card"><h3><label for="m5-exhibit-raw">原始录井记录</label></h3><textarea id="m5-exhibit-raw" data-m5-raw spellcheck="false" aria-describedby="m5-raw-description"></textarea><p id="m5-raw-description" class="m5-small">保留这一个编辑区。井段写为“起点—终点 m MD”；气测数值连同单位输入。</p><div class="m5-sentences" data-m5-clause-list aria-label="选择当前子句"></div><div data-m5-source-card></div></section><section class="fx-card"><div data-m5-stage-panel="0"><h3>先把一条观察读完整</h3><div data-m5-observation></div></div><div data-m5-stage-panel="1" hidden><h3>同一子句的两个产物</h3><div data-m5-fields></div><div data-m5-scores></div><div data-m5-contributions></div></div><div data-m5-stage-panel="2" hidden><h3>报告草稿 · 点击句子回查</h3><div data-m5-report></div><label class="m5-check"><input type="checkbox" data-m5-confirm><span>我已对照原文，核对当前句子的范围、数值、单位和否定。</span></label><p class="m5-small" data-m5-review-note></p></div></section></div>`;

  function mount(host) {
    host.innerHTML = labHTML;
    const $ = selector => host.querySelector(selector), $$ = selector => [...host.querySelectorAll(selector)];
    const raw = $('[data-m5-raw]'), store = C.sourceStore();
    const state = {id: 's17-evidence-report', version: '1.9.0', status: 'not_run', revision: 1, count: 0, selected: 2, stage: 0, intervalIndex: 0, perspective: 'observe', inputMode: 'builtin', run: null, reportHistory: [], pendingHistory: null, exampleChange: null, notice: ''};
    let timer = null;
    raw.value = defaultFixture.text;
    const notify = text => {state.notice = text; if (g.S17Exhibit && typeof g.S17Exhibit.notify === 'function') g.S17Exhibit.notify(text);};
    const changed = () => {if (g.S17Exhibit && typeof g.S17Exhibit.changed === 'function') g.S17Exhibit.changed();};
    const current = () => state.run && state.run.inference.facts[state.selected];
    const currentClaim = () => state.run && state.run.claims[state.selected];
    const labelReview = c => c.reviewStatus === 'confirmed' ? '已核对当前句子' : c.reviewStatus === 'needs_review' ? '当前修订待重新核对' : '待核对';

    function setStage(index) {
      state.stage = Math.max(0, Math.min(2, Number(index) || 0));
      $$('[data-m5-stage]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.m5Stage) === state.stage)));
      $$('[data-m5-stage-panel]').forEach(panel => panel.hidden = Number(panel.dataset.m5StagePanel) !== state.stage);
      $('[data-m5-stage-copy]').textContent = [
        '读完整的一条观察：看它说的是哪一段井、哪一种现象，原文有没有给单位和否定。',
        '上方字段保留事实，下方分数协助找栏目。两部分都对应左侧高亮的同一条原文。',
        '点击任何报告句子，左侧会高亮它的原文。核对后改一个字，再看当前确认怎样撤销。'
      ][state.stage];
    }

    function render() {
      const r = state.run, f = current(), c = currentClaim();
      if (!r || !f || !c) return;
      $('[data-m5-lab-handover]').innerHTML = handoverHTML(r.inference, state.intervalIndex, state.perspective, true);
      $('[data-m5-clause-list]').innerHTML = r.inference.facts.map((v, i) => `<button type="button" data-m5-select="${i}" aria-pressed="${i === state.selected}">${i + 1} · ${esc(name(v.category))}</button>`).join('');
      const change = state.exampleChange && state.exampleChange.runId === r.runId && state.exampleChange.factIndex === state.selected ? `<p class="fx-note" data-m5-change-feedback>${esc(state.exampleChange.message)}</p>` : '';
      $('[data-m5-source-card]').innerHTML = `<h3>当前句子的原文位置</h3><div class="m5-quote m5-source-preview" data-m5-source-preview>${sourcePreview(r.text, f)}</div><p class="m5-small">原文第${f.sourceSpanStart + 1}—${f.sourceSpanEnd}个字符 · 当前来源修订 ${r.revision}</p>${inheritanceNote(f)}${change}`;
      const focus = $('[data-m5-active-source]');
      if (focus && focus.parentElement) focus.parentElement.scrollTop = Math.max(0, focus.offsetTop - focus.parentElement.offsetTop - 50);
      $('[data-m5-observation]').innerHTML = `<div class="m5-quote">${fieldMarkup(f.rawQuote)}</div>${fieldItems(f)}<p class="fx-note">${f.fields.fluorescence ? (f.fields.negation ? '这句保存的是“未见”这一观察。把它只写成“有荧光”会改变原意。' : '逐字查看荧光描述，读出这次观察的肯定或否定语义。') : f.fields.gasValue != null ? '读数与单位、井段一起保留。一起比较数值、单位和适用井段。' : f.fields.operation ? '这句描述的是现场操作。保留操作时段，再结合深度记录辅助解释观测。' : '先核对范围，再读观察词。没有写出的信息保持“原文未提供”。'}</p>`;
      $('[data-m5-fields]').innerHTML = `<p class="m5-small">字段抽取：从高亮原文里留下的事实</p>${fieldItems(f)}${f.flags.length ? `<p class="fx-note">需要核查：${esc(f.flags.join('；'))}</p>` : ''}`;
      $('[data-m5-scores]').innerHTML = `<h3>这句话先放在哪个栏目？</h3>${scorePlot(f.prediction)}<p><span class="m5-label is-selected">贝叶斯候选：${esc(name(f.category))}</span> <span class="m5-label">关键词基线：${esc(name(f.baseline))}</span></p><p class="m5-small">${f.prediction.reasons.length ? esc(f.prediction.reasons.join('；')) + '。' : ''}分数由当前原文重新计算；最高类为0，其余数值表示与最高类的对数分差。关键词基线只按一组固定关键词归类，供同句比较。</p>`;
      const ranking = f.prediction.scores.map((v, i) => ({v, i})).sort((a, b) => b.v - a.v);
      $('[data-m5-contributions]').innerHTML = `<h3>哪些文字影响了这次分流？</h3><p class="m5-small">实际字符片段对“${esc(name(ranking[0].i))}”相对“${esc(name(ranking[1].i))}”的贡献；正值支持前者，负值支持后者。</p><div class="m5-fields">${f.prediction.contributions.slice(0, 4).map(v => `<div class="m5-field"><small>“${esc(v.token)}” × ${v.count}</small><b>${v.contribution >= 0 ? '+' : ''}${fmt(v.contribution)}</b></div>`).join('')}</div>`;
      $('[data-m5-report]').innerHTML = `<p class="m5-small">${r.claims.length}句 · 已核对${r.claims.filter(v => v.reviewStatus === 'confirmed').length}句</p><div class="m5-report-list">${r.claims.map((v, i) => `<button type="button" class="m5-report-button" data-m5-report-select="${i}" aria-pressed="${i === state.selected}">${esc(v.statement)}<span>${esc(labelReview(v))} · 点击定位原文</span></button>`).join('')}</div>`;
      $('[data-m5-confirm]').checked = c.reviewStatus === 'confirmed';
      $('[data-m5-confirm]').disabled = state.status !== 'ready';
      $('[data-m5-review-note]').textContent = labelReview(c) + (c.reviewHistory.length ? '。本句保留了' + c.reviewHistory.length + '次可明确对应的核对／修改历史。' : '。修改原文后，需要重新核对新报告。') + (state.reportHistory.length ? ' 此前' + state.reportHistory.length + '份报告的核对记录已随原报告保存。' : '');
      setStage(state.stage);
    }

    function invalidate(reason) {
      if (state.run && state.status !== 'stale' && !state.pendingHistory) {
        state.pendingHistory = {runId: state.run.runId, revision: state.run.revision, rawText: state.run.text, claims: JSON.parse(JSON.stringify(state.run.claims))};
        state.run.claims.forEach(c => C.invalidateClaim(c, reason));
      }
      state.status = 'stale';
      $('[data-m5-confirm]').checked = false;
      $('[data-m5-confirm]').disabled = true;
      notify('原文已修改，正在更新字段与报告；旧核对已撤销。');
    }

    function recalculate() {
      if (timer) {clearTimeout(timer); timer = null;}
      const text = raw.value;
      if (!text.trim() || text.length > 30000) {
        state.status = 'error';
        notify(!text.trim() ? '请先输入一条录井记录。' : '请将这段教学记录控制在30000个字符以内。');
        changed();
        return snapshot();
      }
      const wasStale = state.status === 'stale';
      state.status = 'running';
      const previousRun = state.run, prior = previousRun ? JSON.parse(JSON.stringify(previousRun.claims)) : [], lib = library();
      if (state.run && state.run.text !== text && !wasStale && !state.pendingHistory) prior.forEach(c => C.invalidateClaim(c, '原文修改后重算'));
      state.revision = state.count ? state.revision + 1 : 1;
      const inference = linkFieldSources(text, C.infer(lib.model, text, {margin: lib.chosen.margin, method: 'model', sourceVersion: state.revision}));
      if (!inference.facts.length) {
        state.status = 'error';
        notify('这段输入没有可处理的子句，请补充一条观察记录。');
        changed();
        return snapshot();
      }
      store.add({sourceRecordId: 's17-user-record', sourceVersion: state.revision, sourceType: 'text_record', content: {kind: 'observation', rawText: text, dataNature: 'synthetic_teaching', inputMode: state.inputMode}});
      const matches = historyMatches(previousRun, inference, text);
      if (previousRun && !state.reportHistory.some(v => v.runId === previousRun.runId)) state.reportHistory.push(state.pendingHistory || {runId: previousRun.runId, revision: previousRun.revision, rawText: previousRun.text, claims: JSON.parse(JSON.stringify(previousRun.claims))});
      state.pendingHistory = null;
      const claims = inference.claims.map((c, i) => {
        const old = matches.has(i) ? prior[matches.get(i)] : null;
        return {...c, revision: state.revision, reviewStatus: previousRun ? 'needs_review' : 'unreviewed', reviewHistory: old ? [...(old.reviewHistory || []), ...(old.reviewStatus === 'confirmed' ? [{revision: old.revision, statement: old.statement, reviewStatus: old.reviewStatus, sourceRefs: old.sourceRefs, trigger: '重新计算当前报告'}] : [])] : []};
      });
      const gold = state.inputMode === 'builtin' && text === defaultFixture.text;
      const metricValue = gold ? {...lib.metrics, fields: C.evaluateFields(inference, defaultFixture.evaluationTruth), grounding: C.evaluateGrounding(inference, defaultFixture.evaluationTruth, text), expectedConflicts: 0, detectedConflicts: inference.conflicts.length} : null;
      state.count += 1;
      state.run = {text, library: lib, inference, claims, revision: state.revision, runId: 's17-evidence-report-r' + state.count + '-v' + state.revision, config: {method: 'model', alpha: lib.chosen.alpha, margin: lib.chosen.margin, sourceMode: gold ? 'built_in_gold' : 'free_no_gold', trainingCorrections: {}}, metrics: metricValue, method: 'character_multinomial_NB + rule_extraction + constrained_quote_template', seed: 17, split: lib.groups, dataVersion: 's17-text-v1', reportEdited: false, upstream: []};
      const selectedMatch = [...matches].find(([, oldIndex]) => oldIndex === state.selected);
      state.selected = selectedMatch ? selectedMatch[0] : Math.min(state.selected, inference.facts.length - 1);
      state.status = 'ready';
      $('[data-m5-input-note]').textContent = state.inputMode === 'builtin' ? '当前为固定教学记录。试着只改一处，再观察对应字段和报告。' : '当前原文已改写，字段、分类和报告均已重新计算。';
      render();
      notify('已更新：' + inference.facts.length + '条子句、' + claims.length + '句报告。');
      changed();
      return snapshot();
    }

    function reset() {
      state.inputMode = 'builtin'; state.selected = 2; state.stage = 0; state.intervalIndex = 0; state.perspective = 'observe'; state.exampleChange = null;
      raw.value = defaultFixture.text;
      if (state.run) invalidate('复位原始记录');
      recalculate(); state.selected = 2; render(); changed(); return snapshot();
    }

    function snapshot() {
      const r = state.run;
      return {id: state.id, status: state.status, revision: state.revision, selected: state.selected, selectedClaim: r ? r.claims[state.selected].claimId : null, stage: state.stage, intervalIndex: state.intervalIndex, perspective: state.perspective, handover: r ? intervalExport(r.inference, r.claims, state.intervalIndex) : null, rawText: raw.value, inputMode: state.inputMode, run: r ? {runId: r.runId, config: r.config, metrics: r.metrics, method: r.method, counts: {clauses: r.inference.clauses.length, claims: r.claims.length, confirmed: r.claims.filter(c => c.reviewStatus === 'confirmed').length, conflicts: r.inference.conflicts.length}, summary: {selectedSection: name(r.inference.facts[state.selected].category), selectedQuote: r.inference.facts[state.selected].rawQuote}, stepCount: 5} : null, facts: r ? JSON.parse(JSON.stringify(r.inference.facts)) : [], claims: r ? JSON.parse(JSON.stringify(r.claims)) : [], reviews: r ? r.claims.map(c => ({claimId: c.claimId, reviewStatus: c.reviewStatus, reviewHistory: JSON.parse(JSON.stringify(c.reviewHistory))})) : [], reportRevisionHistory: JSON.parse(JSON.stringify(state.reportHistory)), sourceOffsets: r ? r.inference.facts.map(f => ({start: f.sourceSpanStart, end: f.sourceSpanEnd, quote: r.text.slice(f.sourceSpanStart, f.sourceSpanEnd), rangeSources: f.rangeSources})) : [], fields: current() ? JSON.parse(JSON.stringify(current().fields)) : null, exampleChange: state.exampleChange, notice: state.notice};
    }

    function evidence() {
      if (state.status !== 'ready' || !state.run) throw Error('请等待当前原文计算完成后再保存。');
      const r = state.run;
      for (const id of ['s17-cuttings-lithology', 's17-mudgas-context', 's17-fluorescence-review', 's17-drilltime-boundaries']) {
        const item = upstream(id);
        if (item) {C.validateEvidence(item); item.sources.forEach(s => store.add(s));}
      }
      const content = {sources: store.list(), claims: r.claims.map(c => ({...c, originalStatement: undefined})), facts: r.inference.facts, handover: intervalExport(r.inference, r.claims, state.intervalIndex), reportRevisionHistory: state.reportHistory, metrics: r.metrics, metricScope: 'original automatic pipeline only; free text has no gold metrics', reportStatus: r.claims.some(c => c.reviewStatus !== 'confirmed') ? 'draft_needs_review' : 'human_reviewed_current_revision', reportStatusScope: '仅指当前文本报告的逐句核对，不覆盖交接中的前例快照与候选解释', limitations: ['本包保存当前教学记录、实际文本计算、井段交接和核对状态。', '前例资料是构建期快照，不是本页重跑；同样品但缺井段的白光／UV材料未分配井段。', 'NB归类、规则抽取和原文引述分别保存；来源定位与语义核对分别记录。', '自由改写没有评价金标，metrics为null。']};
      const e = g.S17UI && typeof g.S17UI.envelope === 'function' ? g.S17UI.envelope(state.id, '1.9.0', r, content) : {schemaVersion: '1.0', caseId: state.id, caseVersion: '1.9.0', runId: r.runId, datasetId: 's17-synthetic-v1', wellId: 'DEMO-017', dataNature: 'synthetic_teaching', runConfig: {seed: 17, dataVersion: r.dataVersion, splitDescription: r.split, method: r.method, parameters: r.config, inputRevision: r.revision}, ...content};
      return C.validateEvidence(e);
    }

    function flowHTML(index) {
      const i = Math.max(0, Math.min(4, Number(index) || 0)), r = state.run, f = current(), c = currentClaim(), step = steps[i];
      if (!r || !f) return `<p>当前还没有可处理的原文。</p>`;
      const h = intervalData(r.inference, state.intervalIndex), interval = h.range.join('—') + ' m MD';
      const actual = [
        [`所选 ${interval}，当前原文与前例构建期快照。`, '按文字范围与逐深度数据筛选；气峰只按已保存的模型参考点定位，缺深度样品不归段。', `<p>该段 ${h.selected.length} 条文字记录；岩屑 ${h.rocks.length} 条，气测 ${h.gasText.length} 条，荧光 ${h.fluorescence.length} 条；钻时有 ${h.active.length} 个有效点。</p><p>气峰参考点${h.gasHere ? '位于本段' : '不在本段或未提供'}；M1/M3样品${h.paired ? '身份相同但没有井段' : '配对信息待补'}。</p>${h.differences.length ? '<p>记录差异：' + h.differences.map(v => esc(v.message)).join(' ') + '</p>' : ''}`],
        [`选中子句：${f.rawQuote}`, '按原文位置切分，规则识别该子句的范围、数值、单位与否定。', `<div class="m5-quote">${sourcePreview(r.text, f)}</div>${inheritanceNote(f)}${fieldItems(f)}<p class="m5-small">当前观察位于原文第${f.sourceSpanStart + 1}—${f.sourceSpanEnd}个字符，已在图中高亮。</p>`],
        [`同一子句：${f.rawQuote}`, `取 ${C.tokens(f.rawQuote).length} 个单字／相邻双字片段，运行固定训练库NB与关键词基线。`, `${scorePlot(f.prediction)}<p>当前候选：${esc(name(f.category))}；关键词基线：${esc(name(f.baseline))}。</p>`],
        [`当前栏目“${name(f.category)}”与原文字段。`, '保留原文引述，将当前句子绑定到当前来源版本及文字位置。', `<div class="m5-quote">${esc(c.statement)}</div><p class="m5-small">对应原文：${esc(r.text.slice(f.sourceSpanStart, f.sourceSpanEnd))}</p>${inheritanceNote(f)}`],
        [`当前报告第 ${state.selected + 1} 句及 ${interval} 的资料。`, '逐项核对范围、数值、单位与否定，保留选段缺项和下一步问题。', `<p><b>${esc(labelReview(c))}</b> · 当前修订 ${c.revision}</p><div class="m5-quote">${esc(c.statement)}</div><p class="m5-small">本句 ${c.reviewHistory.length} 条历史；本次报告已核对 ${r.claims.filter(v => v.reviewStatus === 'confirmed').length}/${r.claims.length} 句。</p><h4>下一步核查</h4><ul>${h.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>`]
      ][i];
      return `<div class="m5-flow-facts" data-m5-flow="${i}"><p><b>当前输入</b>${esc(actual[0])}</p><p><b>实际动作</b>${esc(actual[1])}</p><div class="m5-paper"><h3>${esc(step.name)}的实际产物</h3>${actual[2]}</div></div>`;
    }

    raw.addEventListener('input', () => {
      state.inputMode = 'free'; state.exampleChange = null; invalidate('原始记录、否定、数值或范围改变');
      if (timer) clearTimeout(timer);
      timer = setTimeout(recalculate, 180);
      changed();
    });
    host.addEventListener('click', event => {
      const target = event.target.closest('[data-m5-stage],[data-m5-select],[data-m5-report-select],[data-m5-example],[data-m5-interval],[data-m5-perspective],[data-m5-handover-fact]');
      if (!target || !host.contains(target)) return;
      if (target.hasAttribute('data-m5-interval')) {state.intervalIndex = Number(target.dataset.m5Interval); render(); revealIntervalChart(host, state.intervalIndex); host.querySelector(`[data-m5-interval="${state.intervalIndex}"]`).focus({preventScroll: true}); changed(); return;}
      if (target.hasAttribute('data-m5-perspective')) {state.perspective = target.dataset.m5Perspective === 'interpret' ? 'interpret' : 'observe'; render(); revealIntervalChart(host, state.intervalIndex); host.querySelector(`[data-m5-perspective="${state.perspective}"]`).focus({preventScroll: true}); changed(); return;}
      if (target.hasAttribute('data-m5-handover-fact')) {state.selected = Number(target.dataset.m5HandoverFact); state.stage = 0; render(); changed(); $('[data-m5-source-card]').scrollIntoView({block: 'nearest'}); return;}
      if (target.hasAttribute('data-m5-stage')) {setStage(target.dataset.m5Stage); changed(); return;}
      if (target.hasAttribute('data-m5-select') || target.hasAttribute('data-m5-report-select')) {
        state.selected = Number(target.dataset.m5Select == null ? target.dataset.m5ReportSelect : target.dataset.m5Select);
        render(); changed(); return;
      }
      if (target.hasAttribute('data-m5-example')) {
        let text = raw.value, next = text;
        if (target.dataset.m5Example === 'negation') next = text.includes('未见明显荧光') ? text.replace('未见明显荧光', '见明显荧光') : text.replace('见明显荧光', '未见明显荧光');
        if (target.dataset.m5Example === 'value') next = text.replace(/(气测总气升高至)(3\.2|5\.1)/, (_, before, value) => before + (value === '3.2' ? '5.1' : '3.2'));
        if (target.dataset.m5Example === 'range') next = text.replace(/(1220|1230)[—–\-](1230|1240)(\s*m\s*MD[^。\n]*荧光)/, (_, a, b, tail) => (a === '1220' ? '1230—1240' : '1220—1230') + tail);
        if (next === text) {notify('这条示例在当前原文中已被改写；可直接编辑，或点击复位恢复示例。'); return;}
        let difference = 0;
        while (difference < text.length && difference < next.length && text[difference] === next[difference]) difference++;
        const beforeFact = state.run.inference.facts.find(f => f.sourceSpanStart <= difference && f.sourceSpanEnd >= difference);
        raw.value = next; state.inputMode = 'free'; state.exampleChange = null; invalidate('示例按钮修改原文'); recalculate();
        const targetIndex = state.run.inference.facts.findIndex(f => f.sourceSpanStart <= difference && f.sourceSpanEnd >= difference);
        if (targetIndex >= 0) state.selected = targetIndex;
        const afterFact = current();
        if (beforeFact && afterFact) {
          const before = beforeFact.fields, after = afterFact.fields, rangeLabel = v => v ? v.join('—') + ' m MD' : '原文未给出的井段';
          let message = '';
          if (target.dataset.m5Example === 'negation') message = '同一井段的荧光观察由“' + (before.negation ? '未见' : '见') + '”变为“' + (after.negation ? '未见' : '见') + '”；栏目仍可同为荧光，报告随之保存改变后的观察含义。';
          if (target.dataset.m5Example === 'value') message = '在同一井段、同一教学单位下，气测读数由' + before.gasValue + '变为' + after.gasValue + ' ' + (after.gasUnit || '（未提供单位）') + '。报告保存的是改变后的读数；井段和单位保持一致，可逐项对照本次读数变化。';
          if (target.dataset.m5Example === 'range') message = '观察仍是“' + (after.negation ? '未见明显荧光' : '见明显荧光') + '”，适用井段由' + rangeLabel(before.depthRangeMD_m) + '变为' + rangeLabel(after.depthRangeMD_m) + '。它应归入新井段；其他记录的范围保持原样。';
          state.exampleChange = {kind: target.dataset.m5Example, runId: state.run.runId, factIndex: state.selected, before: JSON.parse(JSON.stringify(before)), after: JSON.parse(JSON.stringify(after)), message};
          $('[data-m5-input-note]').textContent = message;
        }
        render(); changed();
      }
    });
    $('[data-m5-confirm]').addEventListener('change', event => {
      const c = currentClaim();
      if (state.status !== 'ready' || !c) return;
      const confirmed = event.target.checked;
      c.reviewHistory.push({revision: c.revision, statement: c.statement, reviewStatus: confirmed ? 'confirmed' : 'needs_review', sourceVersions: c.sourceRefs.map(ref => ref.sourceVersion), trigger: confirmed ? '逐句核对范围、数值、单位和否定' : '撤销当前核对'});
      c.reviewStatus = confirmed ? 'confirmed' : 'needs_review'; c.traceabilityStatus = 'linked'; c.supportStatus = confirmed ? 'human_verified' : 'unchecked';
      render(); notify(confirmed ? '已保存当前句子与当前原文的核对。' : '当前句子已恢复为待核对。'); changed();
    });

    const api = {recalculate, reset, snapshot, evidence, flowHTML};
    recalculate();
    return api;
  }

  function readingMount(root) {
    root.querySelectorAll('[data-m5-reading-handover]').forEach(panel => {
      let intervalIndex = 0, perspective = 'observe';
      panel.addEventListener('click', event => {
        const button = event.target.closest('[data-m5-interval],[data-m5-perspective]');
        if (!button || !panel.contains(button)) return;
        if (button.hasAttribute('data-m5-interval')) intervalIndex = Number(button.dataset.m5Interval);
        if (button.hasAttribute('data-m5-perspective')) perspective = button.dataset.m5Perspective === 'interpret' ? 'interpret' : 'observe';
        panel.innerHTML = handoverHTML(reference, intervalIndex, perspective, false);
        revealIntervalChart(panel, intervalIndex);
        const next = button.hasAttribute('data-m5-interval') ? panel.querySelector(`[data-m5-interval="${intervalIndex}"]`) : panel.querySelector(`[data-m5-perspective="${perspective}"]`);
        if (next) next.focus({preventScroll: true});
      });
    });
    root.querySelectorAll('[data-m5-negation]').forEach(button => {
      button.addEventListener('click', () => {
        const negative = button.dataset.m5Negation === 'negative';
        const unit = button.closest('article,section') || root, panel = unit.querySelector('[data-m5-reading-negation]') || root.querySelector('[data-m5-reading-negation]');
        if (panel) panel.innerHTML = readingExample(negative);
        unit.querySelectorAll('[data-m5-negation]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      });
    });
  }

  g.M5Exhibit = {title: '综合录井解释与井段交接', lede: '沿井段对照岩屑、气测、荧光和钻时，生成有来处的录井报告与核查问题。', chapters, steps, labHTML, mount, readingMount};
})(globalThis);
