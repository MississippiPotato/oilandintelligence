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
  .fx-exhibit[data-scene="m5"] svg text{font-family:inherit}
  @media(max-width:700px){.fx-exhibit[data-scene="m5"] .m5-grid{grid-template-columns:1fr}.fx-exhibit[data-scene="m5"] .m5-fields{grid-template-columns:1fr}.fx-exhibit[data-scene="m5"] .m5-paper{padding:16px}.fx-exhibit[data-scene="m5"] textarea[data-m5-raw]{min-height:330px}}
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
    return `<div class="m5-score"><svg viewBox="0 0 600 275" role="img" aria-label="当前子句六类相对对数分数，最高类为零，向左越长表示与最高类差距越大"><text x="18" y="22" fill="#5d6570" font-size="16">当前子句 · 相对最高类的对数分数</text><line x1="${zero}" y1="36" x2="${zero}" y2="244" stroke="#918a80"/>${rows.map((r, j) => {const y = 48 + j * 34, width = Math.max(0, -r.delta * scale); return `<text x="18" y="${y + 17}" fill="#343941" font-size="18">${esc(name(r.i))}</text><rect x="${zero - width}" y="${y}" width="${Math.max(2, width)}" height="23" rx="5" fill="${r.i === prediction.proposedLabel ? '#b8242a' : '#9aabb9'}"/><circle cx="${zero - width}" cy="${y + 11.5}" r="4" fill="${r.i === prediction.proposedLabel ? '#b8242a' : '#6a7e90'}"/><text x="446" y="${y + 17}" fill="#343941" font-size="17">${fmt(r.delta)}</text>`;}).join('')}<text x="${zero}" y="267" text-anchor="end" fill="#5d6570" font-size="16">0 = 最高类；分数差不是概率</text></svg></div>`;
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
    return `<div class="m5-grid"><div><p class="m5-small">原始观察</p><div class="m5-quote">${fieldMarkup(text)}</div></div><div><p class="m5-small">该句实际抽出的字段</p>${fieldItems(f)}</div></div><p class="fx-note">${negative ? '“未见”限制这次观察：报告必须保留未见，不能只留下“荧光”。' : '去掉“未”以后，观察变为肯定；分类仍可能归入“荧光”，但事实已经改变。'}</p>`;
  }

  const reference = defaultResult();
  const chapters = [
    {id: 'records', title: '一段井，为什么会留下几种记录', en: 'OBSERVATIONS', html: styles + `<p>钻头把岩石钻成碎屑，钻井液把岩屑和部分气体带回地面。录井人员观察岩屑、检测气体，也会在紫外光下看岩样的荧光，同时记录钻井操作。<b>录井报告</b>把这些资料整理到一起，方便后来的人知道“在哪里、看到了什么、当时在做什么”。</p><div class="m5-grid"><div class="m5-paper"><h3>先读这三条井段记录</h3><div class="m5-record">${reference.facts.slice(0, 3).map(f => `<div class="m5-record-row"><b>${esc(f.fields.depthRangeMD_m.join('—'))} m MD · ${esc(name(f.category))}</b>${esc(f.rawQuote.split('：')[1] || f.rawQuote)}</div>`).join('')}</div></div><div><h3>每条观察，回答不同的问题</h3><p><b>岩性</b>是岩石的类别与特征，“岩屑以砂岩为主”描述返出样品。</p><p><b>气测</b>描述地面检测到的气体读数；<b>荧光</b>描述样品受光激发后的发光观察。</p><p><b>工况</b>是钻进、停泵等操作状态。操作可能按时间记录，例如“30—60 s：接单根停泵”，不能直接当成一个已知井段。</p></div></div><p class="fx-note">看左侧：三条记录属于三个井段。整理报告时，不能因为文字相邻就把它们合成“同一井段同时出现这些现象”。</p><p class="m5-source-rule">专业依据：<a href="https://www.slb.com/resource-library/oilfield-review/defining-series/defining-mud-logging" target="_blank" rel="noreferrer">SLB · Mud Logging</a>。图中短记录使用本例固定教学原文。</p>`},
    {id: 'qualifiers', title: '一个“未”字，也是一项必须保留的事实', en: 'MEANING', html: `<p>“未见明显荧光”和“见明显荧光”含义相反。报告不仅要留下“荧光”这个主题，还要留下否定、范围和单位。<b>字段</b>就是从句子中单独保留的信息项。</p><p>例子里的 <b>m MD</b> 表示以米计的沿井眼深度：顺着井眼量的长度。斜井的MD与垂直深度不同。“归一化单位”是本例气测教学读数的口径，不是可直接换算的现场浓度。</p><div class="m5-example-buttons"><button type="button" data-m5-negation="negative" aria-pressed="true">原句：未见明显荧光</button><button type="button" data-m5-negation="positive" aria-pressed="false">删去“未”：见明显荧光</button></div><div data-m5-reading-negation>${readingExample(true)}</div><p class="m5-small">看哪里：蓝灰标井段，朱红标否定，数字与单位始终一起读。上方按钮实际重新抽取这条短句。</p><p class="m5-source-rule">术语依据：<a href="https://glossary.slb.com/en/terms/m/measured_depth" target="_blank" rel="noreferrer">SLB · Measured depth</a>。字段切分和否定处理由本例现有规则实际计算。</p>`},
    {id: 'routing', title: '分类找栏目，抽取保留原话里的事实', en: 'TWO TASKS', html: `<p>面对一条原始记录，有两个不同的问题：<b>它该放进报告的哪一栏？它具体说了什么？</b>本例用文本分类协助回答前一个问题，用字段规则处理后一个问题。</p><div class="m5-grid"><div class="m5-paper"><h3>同一条原文</h3><div class="m5-quote">${fieldMarkup(reference.facts[1].rawQuote)}</div><h3>抽取出的事实</h3>${fieldItems(reference.facts[1])}</div><div class="m5-paper"><h3>六个栏目，比较文字线索</h3>${scorePlot(reference.facts[1].prediction)}<p class="m5-small">当前候选：${esc(name(reference.facts[1].category))}；关键词基线：${esc(name(reference.facts[1].baseline))}。</p></div></div><p><b>朴素贝叶斯</b>先在已分类的训练句子里统计文字片段，再为新子句比较各栏目的分数。本例使用单字与相邻双字；图上的0表示最高类，其余值是与最高类的分差。数值越接近0，越接近当前最高分。</p><p class="fx-note">看图时要分开检查：候选栏目是“气测”，并不能替代对“1210—1220 m MD、3.2、归一化单位”的核对。归类正确与事实完整是两个产物。</p><p class="m5-source-rule">方法依据：<a href="https://nlp.stanford.edu/IR-book/html/htmledition/naive-bayes-text-classification-1.html" target="_blank" rel="noreferrer">Manning 等 · Naive Bayes text classification</a>。分数来自当前引擎固定训练库的实际计算。</p>`},
    {id: 'trace', title: '报告里的每句话，都能回到它的原文', en: 'BACK TO SOURCE', html: `<p>整理后的报告应保留观察原意。本例把栏目、井段和原文引述组装成报告句子，同时保存来源版本与原文范围。点击一句报告，就能回到生成它的那段文字。</p><div class="m5-grid"><div class="m5-paper"><h3>原始记录</h3><div class="m5-quote">${fieldMarkup(reference.facts[2].rawQuote)}</div><p class="m5-small">这次观察：1220—1230 m MD；未见明显荧光。</p></div><div class="m5-paper"><h3>整理到报告</h3><div class="m5-quote">${esc(reference.claims[2].statement)}</div><p class="m5-small">范围与否定一起保留。点击可运行示范中的句子，可定位真实原文字符范围。</p></div></div><p><b>来源定位</b>回答“这句话从哪里来”；逐句核对还要回答“这句话是否保留了原意”。原文改了以后，会形成新的修订，原来的确认也要重新检查。</p><p class="fx-note">接下来试一次：先核对荧光句，再将“未见”改为“见”。观察报告和字段怎样变化，以及旧核对为什么撤销。</p><p class="m5-source-rule">来源关系参考：<a href="https://www.w3.org/TR/prov-dm/" target="_blank" rel="noreferrer">W3C · PROV-DM</a> 中的引述与修订概念；保存接口沿用本项目证据格式。</p>`}
  ];

  const steps = [
    {name: '收集原始记录', input: '当前编辑区中的短录井记录。', action: '保存原文内容与当前版本，保留井段、时段和观察词。', output: '一份可回查的原始文本。'},
    {name: '分句与字段抽取', input: '当前原文中的实际字符。', action: '按标点切成子句，抽取范围、数值、单位和否定。', output: '有起止字符位置的子句及实际字段。'},
    {name: '文本分类分流', input: '当前子句中的单字和相邻双字片段。', action: '用固定训练库的朴素贝叶斯计算六类分数，同时运行关键词基线。', output: '栏目候选、六类分数与基线栏目。'},
    {name: '组装有来源的报告', input: '当前子句的栏目、范围和原文。', action: '用引述模板组装句子，并绑定来源版本与文字范围。', output: '可点击回查原文的报告句子。'},
    {name: '逐句核查与修改', input: '当前报告句子与它引用的原文。', action: '核对范围、数值、单位和否定；修改原文后重算。', output: '当前核对状态；修改前的旧确认保留为历史。'}
  ];

  const labHTML = styles + `<div class="fx-card"><h2>从原始记录，走到一份能回查的报告</h2><p>下面已经用当前原文运行了分类与抽取。先选一条记录，再看它怎样进入报告；也可以直接改原文。</p><nav class="fx-stage-nav m5-sentences" aria-label="报告演示阶段"><button type="button" data-m5-stage="0" aria-pressed="true">读原文</button><button type="button" data-m5-stage="1" aria-pressed="false">看字段与分流</button><button type="button" data-m5-stage="2" aria-pressed="false">核对报告</button></nav><p class="m5-stage-copy" data-m5-stage-copy></p><div class="m5-example-buttons"><button type="button" data-m5-example="negation">改“未见／见”</button><button type="button" data-m5-example="value">改总气3.2／5.1</button><button type="button" data-m5-example="range">改荧光井段</button></div><p class="m5-small" data-m5-input-note>点示例按钮只改一处。修改后自动重新计算。</p></div><div class="m5-grid"><section class="fx-card"><h3><label for="m5-exhibit-raw">原始录井记录</label></h3><textarea id="m5-exhibit-raw" data-m5-raw spellcheck="false" aria-describedby="m5-raw-description"></textarea><p id="m5-raw-description" class="m5-small">保留这一个编辑区。井段写为“起点—终点 m MD”；气测数值连同单位输入。</p><div class="m5-sentences" data-m5-clause-list aria-label="选择当前子句"></div><div data-m5-source-card></div></section><section class="fx-card"><div data-m5-stage-panel="0"><h3>先把一条观察读完整</h3><div data-m5-observation></div></div><div data-m5-stage-panel="1" hidden><h3>同一子句的两个产物</h3><div data-m5-fields></div><div data-m5-scores></div><div data-m5-contributions></div></div><div data-m5-stage-panel="2" hidden><h3>报告草稿 · 点击句子回查</h3><div data-m5-report></div><label class="m5-check"><input type="checkbox" data-m5-confirm><span>我已对照原文，核对当前句子的范围、数值、单位和否定。</span></label><p class="m5-small" data-m5-review-note></p></div></section></div>`;

  function mount(host) {
    host.innerHTML = labHTML;
    const $ = selector => host.querySelector(selector), $$ = selector => [...host.querySelectorAll(selector)];
    const raw = $('[data-m5-raw]'), store = C.sourceStore();
    const state = {id: 's17-evidence-report', version: '1.7.1', status: 'not_run', revision: 1, count: 0, selected: 2, stage: 0, inputMode: 'builtin', run: null, reportHistory: [], pendingHistory: null, exampleChange: null, notice: ''};
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
      $('[data-m5-clause-list]').innerHTML = r.inference.facts.map((v, i) => `<button type="button" data-m5-select="${i}" aria-pressed="${i === state.selected}">${i + 1} · ${esc(name(v.category))}</button>`).join('');
      const change = state.exampleChange && state.exampleChange.runId === r.runId && state.exampleChange.factIndex === state.selected ? `<p class="fx-note" data-m5-change-feedback>${esc(state.exampleChange.message)}</p>` : '';
      $('[data-m5-source-card]').innerHTML = `<h3>当前句子的原文位置</h3><div class="m5-quote m5-source-preview" data-m5-source-preview>${sourcePreview(r.text, f)}</div><p class="m5-small">原文第${f.sourceSpanStart + 1}—${f.sourceSpanEnd}个字符 · 当前来源修订 ${r.revision}</p>${inheritanceNote(f)}${change}`;
      const focus = $('[data-m5-active-source]');
      if (focus && focus.parentElement) focus.parentElement.scrollTop = Math.max(0, focus.offsetTop - focus.parentElement.offsetTop - 50);
      $('[data-m5-observation]').innerHTML = `<div class="m5-quote">${fieldMarkup(f.rawQuote)}</div>${fieldItems(f)}<p class="fx-note">${f.fields.fluorescence ? (f.fields.negation ? '这句保存的是“未见”这一观察。把它只写成“有荧光”会改变原意。' : '这句没有抽出否定词。仍需结合原句核对它是否在肯定一项荧光观察。') : f.fields.gasValue != null ? '读数与单位、井段一起保留。只看数字会失去这条记录的范围和口径。' : f.fields.operation ? '这句描述的是现场操作。它的时段可以辅助解释观测，却不自动等于某一井段。' : '先核对范围，再读观察词。没有写出的信息保持“原文未提供”。'}</p>`;
      $('[data-m5-fields]').innerHTML = `<p class="m5-small">字段抽取：从高亮原文里留下的事实</p>${fieldItems(f)}${f.flags.length ? `<p class="fx-note">需要核查：${esc(f.flags.join('；'))}</p>` : ''}`;
      $('[data-m5-scores]').innerHTML = `<h3>这句话先放在哪个栏目？</h3>${scorePlot(f.prediction)}<p><span class="m5-label is-selected">贝叶斯候选：${esc(name(f.category))}</span> <span class="m5-label">关键词基线：${esc(name(f.baseline))}</span></p><p class="m5-small">${f.prediction.reasons.length ? esc(f.prediction.reasons.join('；')) + '。' : ''}分数由当前原文重新计算；最高类为0，分差不是概率。关键词基线只按一组固定关键词归类，供同句比较。</p>`;
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
      state.inputMode = 'builtin'; state.selected = 2; state.stage = 0; state.exampleChange = null;
      raw.value = defaultFixture.text;
      if (state.run) invalidate('复位原始记录');
      recalculate(); state.selected = 2; render(); changed(); return snapshot();
    }

    function snapshot() {
      const r = state.run;
      return {id: state.id, status: state.status, revision: state.revision, selected: state.selected, selectedClaim: r ? r.claims[state.selected].claimId : null, stage: state.stage, rawText: raw.value, inputMode: state.inputMode, run: r ? {runId: r.runId, config: r.config, metrics: r.metrics, method: r.method, counts: {clauses: r.inference.clauses.length, claims: r.claims.length, confirmed: r.claims.filter(c => c.reviewStatus === 'confirmed').length, conflicts: r.inference.conflicts.length}, summary: {selectedSection: name(r.inference.facts[state.selected].category), selectedQuote: r.inference.facts[state.selected].rawQuote}, stepCount: 5} : null, facts: r ? JSON.parse(JSON.stringify(r.inference.facts)) : [], claims: r ? JSON.parse(JSON.stringify(r.claims)) : [], reviews: r ? r.claims.map(c => ({claimId: c.claimId, reviewStatus: c.reviewStatus, reviewHistory: JSON.parse(JSON.stringify(c.reviewHistory))})) : [], reportRevisionHistory: JSON.parse(JSON.stringify(state.reportHistory)), sourceOffsets: r ? r.inference.facts.map(f => ({start: f.sourceSpanStart, end: f.sourceSpanEnd, quote: r.text.slice(f.sourceSpanStart, f.sourceSpanEnd), rangeSources: f.rangeSources})) : [], fields: current() ? JSON.parse(JSON.stringify(current().fields)) : null, exampleChange: state.exampleChange, notice: state.notice};
    }

    function evidence() {
      if (state.status !== 'ready' || !state.run) throw Error('请等待当前原文计算完成后再保存。');
      const r = state.run, content = {sources: store.list(), claims: r.claims.map(c => ({...c, originalStatement: undefined})), facts: r.inference.facts, reportRevisionHistory: state.reportHistory, metrics: r.metrics, metricScope: 'original automatic pipeline only; free text has no gold metrics', reportStatus: r.claims.some(c => c.reviewStatus !== 'confirmed') ? 'draft_needs_review' : 'human_reviewed_current_revision', limitations: ['本包保存当前教学记录、实际文本计算与核对状态。', 'NB归类、规则抽取和原文引述分别保存；来源定位与语义核对分别记录。', '自由改写没有评价金标，metrics为null。']};
      const e = g.S17UI && typeof g.S17UI.envelope === 'function' ? g.S17UI.envelope(state.id, '1.7.1', r, content) : {schemaVersion: '1.0', caseId: state.id, caseVersion: '1.7.1', runId: r.runId, datasetId: 's17-synthetic-v1', wellId: 'DEMO-017', dataNature: 'synthetic_teaching', runConfig: {seed: 17, dataVersion: r.dataVersion, splitDescription: r.split, method: r.method, parameters: r.config, inputRevision: r.revision}, ...content};
      return C.validateEvidence(e);
    }

    function flowHTML(index) {
      const i = Math.max(0, Math.min(4, Number(index) || 0)), r = state.run, f = current(), c = currentClaim(), step = steps[i];
      if (!r || !f) return `<p>当前还没有可处理的原文。</p>`;
      const actual = [
        [`当前版本的 ${r.text.length} 个字符。`, `保存来源修订 ${r.revision}，保持原文字符不变。`, `<div class="m5-quote">${esc(r.text)}</div>`],
        [`选中子句：${f.rawQuote}`, '按原文位置切分，规则识别该子句的范围、数值、单位与否定。', `<div class="m5-quote">${sourcePreview(r.text, f)}</div>${inheritanceNote(f)}${fieldItems(f)}<p class="m5-small">当前观察位于原文第${f.sourceSpanStart + 1}—${f.sourceSpanEnd}个字符，已在图中高亮。</p>`],
        [`同一子句：${f.rawQuote}`, `取 ${C.tokens(f.rawQuote).length} 个单字／相邻双字片段，运行固定训练库NB与关键词基线。`, `${scorePlot(f.prediction)}<p>当前候选：${esc(name(f.category))}；关键词基线：${esc(name(f.baseline))}。</p>`],
        [`当前栏目“${name(f.category)}”与原文字段。`, '保留原文引述，将当前句子绑定到当前来源版本及文字位置。', `<div class="m5-quote">${esc(c.statement)}</div><p class="m5-small">对应原文：${esc(r.text.slice(f.sourceSpanStart, f.sourceSpanEnd))}</p>${inheritanceNote(f)}`],
        [`当前报告第 ${state.selected + 1} 句及其原文。`, '逐项核对范围、数值、单位与否定。原文变化后，旧确认撤销。', `<p><b>${esc(labelReview(c))}</b> · 当前修订 ${c.revision}</p><div class="m5-quote">${esc(c.statement)}</div><p class="m5-small">本句 ${c.reviewHistory.length} 条历史；本次报告已核对 ${r.claims.filter(v => v.reviewStatus === 'confirmed').length}/${r.claims.length} 句。</p>`]
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
      const target = event.target.closest('[data-m5-stage],[data-m5-select],[data-m5-report-select],[data-m5-example]');
      if (!target || !host.contains(target)) return;
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
          if (target.dataset.m5Example === 'negation') message = '同一井段的荧光观察由“' + (before.negation ? '未见' : '见') + '”变为“' + (after.negation ? '未见' : '见') + '”；栏目仍可同为荧光，报告必须保存改变后的观察含义，不能由此直接判断油层。';
          if (target.dataset.m5Example === 'value') message = '在同一井段、同一教学单位下，气测读数由' + before.gasValue + '变为' + after.gasValue + ' ' + (after.gasUnit || '（未提供单位）') + '。报告保存的是改变后的读数；井段和单位未改，油气解释仍需结合其他观察。';
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
    root.querySelectorAll('[data-m5-negation]').forEach(button => {
      button.addEventListener('click', () => {
        const negative = button.dataset.m5Negation === 'negative';
        const unit = button.closest('article,section') || root, panel = unit.querySelector('[data-m5-reading-negation]') || root.querySelector('[data-m5-reading-negation]');
        if (panel) panel.innerHTML = readingExample(negative);
        unit.querySelectorAll('[data-m5-negation]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      });
    });
  }

  g.M5Exhibit = {title: '录井报告：让每句话都有来处', lede: '把井段、单位和否定一起留下，再让每句报告回到原始记录。', chapters, steps, labHTML, mount, readingMount};
})(globalThis);
