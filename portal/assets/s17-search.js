(function (g) {
  'use strict';
  if (g.S17Search) return;
  const d = g.document, GROUPS = ['stages', 'cases', 'sections', 'methods'];
  const LABELS = { stages: '阶段', cases: '案例', sections: '知识小节', methods: '方法' };
  const LIMITS = { stages: 3, cases: 6, sections: 8, methods: 4 };
  const ALIASES = [
    ['迟到', '迟到时间', '延迟', 'lag', 'lag time'], ['环空', '环空体积', 'annulus', 'annular'],
    ['荧光', '紫外', 'fluorescence', 'uv'], ['岩屑', 'cuttings'], ['初至', 'first break', 'first arrival'],
    ['岭回归', 'ridge', 'ridge regression'], ['近邻', 'k近邻', 'knn', 'k-nn', 'nearest neighbor'],
    ['逻辑回归', 'logistic', 'logistic regression'], ['随机森林', 'random forest'], ['卷积', 'cnn'],
    ['短长窗', 'sta/lta', 'sta lta'], ['孔隙度', 'porosity'], ['断层', 'fault'], ['去噪', 'denoise', 'denoising'],
    ['均方根误差', 'rmse'], ['平均绝对误差', 'mae'], ['饱和度', 'saturation'], ['声阻抗', 'impedance'],
    ['时序', 'time series', 'ts'], ['计算机视觉', 'computer vision', 'cv'], ['自然语言处理', 'nlp'],
    ['优化', 'optimization', 'opt'], ['知识图谱', 'knowledge graph', 'kg'], ['黏度', '粘度', 'viscosity']
  ];
  const WORDS = ['迟到', '环空', '荧光', '岩屑', '初至', '断层', '孔隙度', '声阻抗', '阻抗', '岭回归', '逻辑回归', '回归', '分类', '聚类', '近邻', '地震', '去噪', '相干', '钻时', '钻井', '测井', '录井', '固井', '完井', '修井', '射孔', '裂缝', '压裂', '采油', '注水', '配注', '含水', '泵效', '供液', '泵量', '排量', '体积', '工况', '曲线', '分层', '时序', '预测', '优化', '异常', '化验', '饱和度', '训练', '验证', '测试'];
  const now = () => g.performance && typeof g.performance.now === 'function' ? g.performance.now() : Date.now();
  const norm = x => String(x == null ? '' : x).normalize('NFKC').toLowerCase().replace(/[\s\u200b]+/g, ' ').trim();
  const compact = x => norm(x).replace(/\s+/g, '');
  const array = x => Array.isArray(x) ? x : x == null ? [] : [x];
  const string = x => typeof x === 'string' || typeof x === 'number' ? String(x) : '';
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const state = { open: false, query: '', caseId: '', sectionId: '', kind: 'all', active: -1, resultCount: 0, totalMatches: 0, renderMs: 0, computeMs: 0, indexMs: 0, lastInputAt: 0, inputCount: 0, indexBuilds: 0, importedCount: 0, extractedHTMLChars: 0, lastNavigation: null };
  let index = null, catalogRef = null, catalogSize = '', visibilityKey = '', knownBlocked = [], dirty = true, dialog = null, backdrop = null, opener = null, visible = [], lastSearch = null, composition = false, view = null, viewObserver = null, bodyRevision = 0, frame = 0, pending = null, navigationTimer = 0;

  // Read already-present imported text without parsing markup, executing code, or creating resource elements.
  function plainText(value, limit = 240) {
    const source = string(value).slice(0, 100000), lower = source.toLowerCase(); let out = '', i = 0;
    while (i < source.length && out.length < Math.max(limit * 6, 3000)) {
      if (source[i] !== '<') { out += source[i++]; continue; }
      const end = source.indexOf('>', i + 1); if (end < 0) { out += source[i++]; continue; }
      const tag = /^\s*\/?\s*([a-z0-9]+)/i.exec(source.slice(i + 1, Math.min(end, i + 80)));
      if (tag && !/^\s*\//.test(source.slice(i + 1, end)) && /^(script|style|svg|canvas|iframe|object|template|noscript)$/.test(tag[1].toLowerCase())) {
        const close = lower.indexOf('</' + tag[1].toLowerCase(), end + 1), closeEnd = close < 0 ? -1 : source.indexOf('>', close);
        i = closeEnd < 0 ? source.length : closeEnd + 1;
      } else i = end + 1;
      out += ' ';
    }
    return out.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, key) => {
      const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }, k = key.toLowerCase();
      if (map[k] !== undefined) return map[k];
      const n = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : ' ';
    }).replace(/\s+/g, ' ').trim().slice(0, limit);
  }
  function text(value, limit = 300) { return plainText(string(value), limit); }
  function termList(value) { return array(value).map(v => typeof v === 'object' && v ? string(v.name || v.title || v.key || v.id) : string(v)).filter(Boolean); }
  function atlasScene(id) { return g.ATLAS && g.ATLAS.index && (g.ATLAS.index.byScene || g.ATLAS.index.byId || {})[id] || null; }
  function atlasStage(id) { return g.ATLAS && g.ATLAS.index && g.ATLAS.index.byStage && g.ATLAS.index.byStage[id] || null; }
  function caseHref(c, tab = 'bg', sectionId) {
    if (!c || !c.sceneId) return '#/cases';
    const q = new URLSearchParams(); if (c.id) q.set('case', c.id); q.set('tab', tab === 'flow' ? 'flow' : 'bg'); if (sectionId) q.set('section', sectionId);
    return '#/scene/' + encodeURIComponent(c.sceneId) + '?' + q.toString();
  }
  function normalizeCase(raw, base) {
    const c = Object.assign({}, base || {}, raw || {}), sc = atlasScene(c.sceneId || c.scene), stageId = string(c.stageId || sc && sc.stageId), st = atlasStage(stageId);
    const currentSummary = raw && (raw.summary || raw.question || raw.tabs && raw.tabs.background && raw.tabs.background.lede);
    return { id: string(c.id), sceneId: string(c.sceneId || c.scene), title: text(c.title || c.name || c.id, 180), version: string(c.version), stageId, stageName: text(c.stageName || st && st.name || sc && sc.stageName || '其他阶段', 60), methods: termList(c.methods || sc && sc.methods), summary: text(currentSummary || c.summary || sc && (sc.problem || sc.intro), 260), terms: termList(c.imported ? raw && raw.terms : c.terms), directory: string(c.directory), primary: c.primary !== false, imported: !!c.imported, teacherSample: !!c.teacherSample, standaloneHref: string(c.standaloneHref), sections: array(c.sections) };
  }
  function normalizeSection(raw, c, order) {
    const tab = raw.tab === 'flow' || raw.tab === 'workflow' ? 'flow' : 'bg';
    return { id: string(raw.id || c.id + ':' + tab + ':' + order), caseId: c.id, sceneId: c.sceneId, title: text(raw.title || raw.name || '未命名小节', 180), tab, terms: termList(raw.terms), summary: text(raw.summary || raw.do || raw.body, 300), anchor: string(raw.anchor).replace(/^#/, ''), order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : order, imported: c.imported };
  }
  function importedSections(raw, c) {
    const tabs = raw.tabs || {}, out = [];
    array(tabs.background && tabs.background.sections).forEach((s, i) => {
      const html = string(s.html || s.body); state.extractedHTMLChars += Math.min(html.length, 100000);
      out.push(normalizeSection({ id: c.id + ':bg:' + i, title: s.title || s.navTitle, tab: 'bg', terms: [s.en || '', ...termList(s.terms)], summary: plainText(html, 900), anchor: 'learn-' + c.id + '-bg-' + i, order: i }, c, i));
    });
    const flow = tabs.workflow, steps = array(flow && flow.steps);
    if (flow) out.push(normalizeSection({ id: c.id + ':flow', title: flow.title || '案例流程', tab: 'flow', terms: steps.flatMap(s => [string(s.name || s.title), string(s.role), ...termList(s.terms)]).filter(Boolean), summary: [flow.lead, ...steps.flatMap(s => [s.do, s.effect, s.trap])].map(v => text(v, 300)).filter(Boolean).join(' '), anchor: 'learn-' + c.id + '-flow', order: 0 }, c, 0));
    return out;
  }
  function fields(def) { return Object.entries(def).map(([key, item]) => ({ key, value: compact(item.value), weight: item.weight })).filter(f => f.value); }
  function entry(kind, raw, def) { return Object.assign({ kind, _fields: fields(def) }, raw); }
  function currentCases() { try { return g.Cases && typeof g.Cases.list === 'function' ? g.Cases.list().filter(c => c && c.id) : []; } catch (_) { return []; } }
  function blockedCases() {
    try { knownBlocked = [...new Set(g.CaseImport && typeof g.CaseImport.blockedList === 'function' ? array(g.CaseImport.blockedList()).map(string).filter(Boolean) : [])].sort(); } catch (_) { /* Keep the last known hidden IDs if local storage is temporarily unavailable. */ }
    return knownBlocked;
  }
  function ensureIndex(force) {
    const cat = g.S17CaseCatalog, size = cat ? [array(cat.cases).length, array(cat.sections).length, array(cat.teacherCases).length, array(cat.teacherSections).length].join(':') : 'legacy', blockedIds = blockedCases(), hiddenKey = JSON.stringify(blockedIds), blocked = new Set(blockedIds);
    if (!force && index && !dirty && catalogRef === cat && catalogSize === size && visibilityKey === hiddenKey) return index;
    const begin = now(), byId = new Map(), sections = [], seen = new Set(), authoredCatalog = array(cat && cat.cases), teacherCatalog = array(cat && cat.teacherCases), rawCatalog = authoredCatalog.concat(teacherCatalog.map(c => Object.assign({}, c, { teacherSample: true, primary: false }))), authoredIds = new Set(authoredCatalog.map(c => c.id)), teacherIds = new Set(teacherCatalog.map(c => c.id));
    state.extractedHTMLChars = 0;
    rawCatalog.forEach(raw => { const c = normalizeCase(raw); if (c.id && c.sceneId && !blocked.has(c.id)) byId.set(c.id, c); });
    const registry = currentCases().filter(c => !blocked.has(c.id)), imported = registry.filter(c => c.imported);
    // A light catalog remains authoritative for built-ins. Only imports replace its same-ID item.
    const extras = rawCatalog.length ? registry.filter(c => c.imported || !byId.has(c.id)) : registry;
    const replaced = new Set();
    extras.forEach(raw => { const c = normalizeCase(raw, byId.get(raw.id)); if (!c.id || !c.sceneId) return; byId.set(c.id, c); replaced.add(c.id); });
    const addSection = (raw, fallbackCaseId, order) => { const c = byId.get(string(raw.caseId || fallbackCaseId)); if (!c || replaced.has(c.id)) return; const s = normalizeSection(raw, c, order), key = c.id + '\u0000' + s.id + '\u0000' + s.tab; if (!seen.has(key)) { seen.add(key); sections.push(s); } };
    array(cat && cat.sections).concat(array(cat && cat.teacherSections)).forEach((s, i) => { if (s && typeof s === 'object') addSection(s, '', i); });
    rawCatalog.forEach(raw => array(raw.sections).forEach((s, i) => { if (s && typeof s === 'object') addSection(s, raw.id, i); }));
    extras.forEach(raw => { const c = byId.get(raw.id); if (c) importedSections(raw, c).forEach(s => { const key = c.id + '\u0000' + s.id + '\u0000' + s.tab; if (!seen.has(key)) { seen.add(key); sections.push(s); } }); });
    const cases = [...byId.values()].sort((a, b) => a.stageName.localeCompare(b.stageName, 'zh-CN') || a.sceneId.localeCompare(b.sceneId, undefined, { numeric: true }) || Number(b.primary) - Number(a.primary) || a.title.localeCompare(b.title, 'zh-CN'));
    const composition = list => ({ authoredCount: list.filter(c => !c.teacherSample && (!c.imported || authoredIds.has(c.id))).length, teacherCount: list.filter(c => c.teacherSample).length, extraImportedCount: list.filter(c => c.imported && !authoredIds.has(c.id) && !teacherIds.has(c.id)).length });
    const groups = { stages: [], cases: [], sections: [], methods: [] }, stages = new Map(), methods = new Map();
    const caseSections = new Map(); sections.forEach(s => { if (!caseSections.has(s.caseId)) caseSections.set(s.caseId, []); caseSections.get(s.caseId).push(s); });
    cases.forEach(c => {
      const chapters = caseSections.get(c.id) || [], chapterTerms = chapters.flatMap(s => [s.title, ...s.terms]);
      groups.cases.push(entry('cases', { key: 'case:' + c.id, id: c.id, caseId: c.id, sceneId: c.sceneId, title: c.title, summary: c.summary, stageId: c.stageId, stageName: c.stageName, version: c.version, primary: c.primary, imported: c.imported, teacherSample: c.teacherSample, href: caseHref(c), caseIds: [c.id], methods: c.methods }, { title: { value: c.title, weight: 42 }, identifiers: { value: c.sceneId + ' ' + c.id, weight: 62 }, terms: { value: c.terms.join(' '), weight: 30 }, chapter: { value: chapterTerms.join(' '), weight: 24 }, methods: { value: c.methods.join(' '), weight: 22 }, summary: { value: c.summary, weight: 9 }, stage: { value: c.stageName, weight: 8 } }));
      if (!stages.has(c.stageId || c.stageName)) stages.set(c.stageId || c.stageName, { id: c.stageId, title: c.stageName, cases: [] }); stages.get(c.stageId || c.stageName).cases.push(c);
      c.methods.forEach(k => { const md = g.ATLAS && g.ATLAS.methods && g.ATLAS.methods[k], name = text(md && md.name || k, 90); if (!methods.has(k)) methods.set(k, { id: k, title: name, abbr: string(md && md.abbr), description: text(md && md.desc, 220), known: !!md, cases: [] }); methods.get(k).cases.push(c); });
    });
    if (!cases.length && g.ATLAS) {
      array(g.ATLAS.stages).forEach(s => stages.set(s.id, { id: s.id, title: s.name, cases: [], legacySummary: s.blurb }));
      Object.entries(g.ATLAS.methods || {}).forEach(([id, m]) => methods.set(id, { id, title: m.name, abbr: m.abbr, description: m.desc, known: true, cases: [] }));
    }
    sections.forEach(s => { const c = byId.get(s.caseId); groups.sections.push(entry('sections', { key: 'section:' + s.caseId + ':' + s.tab + ':' + s.id, id: s.id, sectionId: s.id, caseId: s.caseId, sceneId: s.sceneId, title: s.title, caseTitle: c.title, summary: s.summary, stageId: c.stageId, stageName: c.stageName, tab: s.tab, anchor: s.anchor, order: s.order, imported: c.imported, teacherSample: c.teacherSample, primary: c.primary, href: caseHref(c, s.tab, s.id), caseIds: [c.id] }, { chapter: { value: s.title, weight: 46 }, terms: { value: s.terms.join(' '), weight: 34 }, identifiers: { value: s.sceneId + ' ' + s.caseId, weight: 32 }, title: { value: c.title, weight: 15 }, summary: { value: s.summary, weight: 9 }, methods: { value: c.methods.join(' '), weight: 15 }, stage: { value: c.stageName, weight: 5 } })); });
    stages.forEach(st => { const actual = [...new Map(st.cases.map(c => [c.id, c])).values()], ids = actual.map(c => c.id), source = atlasStage(st.id); groups.stages.push(entry('stages', { key: 'stage:' + st.id, id: st.id, title: st.title, summary: text(source && source.blurb || st.legacySummary, 220), href: '#/stage/' + encodeURIComponent(st.id), caseIds: ids, count: ids.length, composition: composition(actual) }, { title: { value: st.title, weight: 42 }, identifiers: { value: st.id, weight: 52 }, terms: { value: actual.flatMap(c => [c.title, ...c.terms, ...(caseSections.get(c.id) || []).flatMap(s => s.terms)]).join(' '), weight: 14 }, summary: { value: source && source.blurb || st.legacySummary, weight: 8 } })); });
    methods.forEach(m => { const actual = [...new Map(m.cases.map(c => [c.id, c])).values()], ids = actual.map(c => c.id); groups.methods.push(entry('methods', { key: 'method:' + m.id, id: m.id, title: m.title, summary: m.description, abbr: m.abbr, href: m.known ? '#/method/' + encodeURIComponent(m.id) : caseHref(actual[0]), caseIds: ids, count: ids.length, composition: composition(actual) }, { title: { value: m.title, weight: 42 }, identifiers: { value: m.id + ' ' + m.abbr, weight: 58 }, terms: { value: actual.flatMap(c => [c.title, ...c.terms, ...(caseSections.get(c.id) || []).flatMap(s => s.terms)]).join(' '), weight: 14 }, summary: { value: m.description, weight: 9 } })); });
    const vocabulary = new Set(WORDS); ALIASES.flat().forEach(v => { if (/^[\u3400-\u9fff]{2,14}$/.test(v)) vocabulary.add(v); }); sections.forEach(s => s.terms.forEach(v => { if (/^[\u3400-\u9fff]{2,14}$/.test(v)) vocabulary.add(v); }));
    index = { cases, byId, sections, caseSections, groups, composition: composition(cases), catalogAuthoredCount: authoredCatalog.length, blockedCount: blocked.size, vocabulary: [...vocabulary].sort((a, b) => b.length - a.length) };
    catalogRef = cat; catalogSize = size; visibilityKey = hiddenKey; dirty = false; state.indexMs = now() - begin; state.indexBuilds++; state.importedCount = imported.filter(c => byId.has(c.id)).length; return index;
  }

  function tokens(query) {
    let normalized = norm(query);
    ALIASES.forEach(group => group.filter(v => /\s/.test(v)).sort((a, b) => b.length - a.length).forEach(phrase => { normalized = normalized.split(norm(phrase)).join(compact(group[0])); }));
    const pieces = normalized.match(/[\u3400-\u9fff]+|[a-z0-9]+(?:[._/-][a-z0-9]+)*/g) || [], out = [];
    pieces.forEach(piece => {
      if (!/^[\u3400-\u9fff]+$/.test(piece) || piece.length < 3) { out.push(piece); return; }
      let p = 0, unknown = ''; const flush = () => { if (unknown) out.push(unknown); unknown = ''; };
      while (p < piece.length) { const found = index.vocabulary.find(word => piece.startsWith(word, p)); if (found) { flush(); out.push(found); p += found.length; } else unknown += piece[p++]; } flush();
    }); return [...new Set(out)].slice(0, 12);
  }
  function variants(token) { const v = [token]; ALIASES.forEach(group => { if (group.some(x => compact(x) === compact(token))) v.push(...group.map(compact)); }); return [...new Set(v)]; }
  function rank(item, query, list) {
    if (!query) return item.kind === 'cases' ? (item.primary ? 2 : 1) : 1;
    const code = /^[a-z]{1,3}\d+$/i.test(query);
    if (code && item.sceneId && norm(item.sceneId) !== query && norm(item.caseId) !== query) return 0;
    let total = 0, hits = 0;
    for (const alternatives of list) { let best = 0;
      item._fields.forEach(field => alternatives.forEach((v, i) => { if (!v) return; const at = field.value.indexOf(v); if (at >= 0) best = Math.max(best, field.weight * (field.value === v ? 2.8 : at === 0 ? 1.35 : 1) * (i ? .7 : 1)); }));
      if (best) { hits++; total += best; }
    }
    if (!hits || hits < list.length) return 0;
    item._fields.forEach(field => { if (field.value === query) total += field.weight * 3; else if (field.value.includes(query)) total += field.weight * .7; });
    if (item.sceneId && norm(item.sceneId) === query) total += item.kind === 'cases' ? 260 : 120;
    return total;
  }
  function publicItem(item, score) { const out = Object.assign({}, item, { score }); delete out._fields; return out; }
  function compute(query, options) {
    const begin = now(), source = ensureIndex(false), opts = options || {}, q = compact(String(query == null ? '' : query).slice(0, 160)), list = tokens(query), alternatives = list.map(variants), groups = {}, counts = {};
    GROUPS.forEach(kind => {
      const filtered = source.groups[kind].filter(item => (!opts.caseId || item.caseIds.includes(opts.caseId)) && (!opts.sectionId || kind === 'sections' && item.sectionId === opts.sectionId && (!opts.caseId || item.caseId === opts.caseId)) && (!opts.kind || opts.kind === 'all' || opts.kind === kind));
      groups[kind] = filtered.map(item => ({ item, score: rank(item, q, alternatives) })).filter(row => row.score > 0).sort((a, b) => b.score - a.score || Number(b.item.imported) - Number(a.item.imported) || Number(b.item.primary) - Number(a.item.primary) || (a.item.order || 0) - (b.item.order || 0) || a.item.title.localeCompare(b.item.title, 'zh-CN')).map(row => publicItem(row.item, row.score)); counts[kind] = groups[kind].length;
    });
    return { query: String(query == null ? '' : query).slice(0, 160), tokens: list, groups, counts, total: Object.values(counts).reduce((a, b) => a + b, 0), computeMs: now() - begin };
  }
  function search(query, options) { const result = compute(query, options); state.computeMs = result.computeMs; return result; }
  function mark(value, query) {
    const textValue = String(value || ''), q = String(query || '').trim(); if (!q || q.length > 100) return esc(textValue);
    const at = norm(textValue).indexOf(norm(q)); if (at < 0) return esc(textValue);
    return esc(textValue.slice(0, at)) + '<mark>' + esc(textValue.slice(at, at + q.length)) + '</mark>' + esc(textValue.slice(at + q.length));
  }
  function statusText(row) {
    if (row.kind === 'sections') return (row.tab === 'flow' ? '案例流程' : '专业背景') + ' · ' + row.caseTitle + (row.teacherSample ? ' · 老师样例' : '');
    if (row.kind === 'cases') return row.sceneId.toUpperCase() + ' · ' + row.stageName + (row.teacherSample ? ' · 老师样例' : '') + (row.imported ? ' · 已导入' : '') + (row.version ? ' · v' + row.version : '');
    return row.caseIds.length + ' 个案例' + (row.composition && row.composition.teacherCount ? '（' + compositionText(row.composition) + '）' : '') + (row.abbr ? ' · ' + row.abbr : '');
  }
  function compositionText(c) { return [[c.authoredCount, '自制'], [c.teacherCount, '老师样例'], [c.extraImportedCount, '另行导入']].filter(([n]) => n).map(([n, label]) => n + ' ' + label).join(' + '); }
  function updateFilters() {
    const source = ensureIndex(false), cases = dialog.querySelector('#s17-search-case'), sections = dialog.querySelector('#s17-search-section');
    if (state.caseId && !source.byId.has(state.caseId)) { state.caseId = ''; state.sectionId = ''; }
    cases.innerHTML = '<option value="">全部案例（' + esc(compositionText(source.composition) || '0') + '）</option>' + source.cases.map(c => '<option value="' + esc(c.id) + '">' + esc(c.sceneId.toUpperCase() + ' · ' + c.title + (c.teacherSample ? ' · 老师样例' : '') + (c.imported ? ' · 已导入' : c.primary === false && !c.teacherSample ? ' · 另一实现' : '')) + '</option>').join(''); cases.value = state.caseId;
    const list = source.caseSections.get(state.caseId) || []; if (!list.some(s => s.id === state.sectionId)) state.sectionId = '';
    sections.innerHTML = '<option value="">' + (state.caseId ? '全部知识小节' : '先选案例，再选知识小节') + '</option>' + list.map(s => '<option value="' + esc(s.id) + '">' + esc((s.tab === 'flow' ? '流程 · ' : '背景 · ') + s.title) + '</option>').join(''); sections.value = state.sectionId; sections.disabled = !state.caseId || !list.length;
  }
  function render(inputAt) {
    if (!dialog || !state.open) return;
    const start = inputAt || now(), result = compute(state.query, { caseId: state.caseId, sectionId: state.sectionId, kind: state.kind }); lastSearch = result; visible = [];
    const root = dialog.querySelector('#s17-search-results');
    root.innerHTML = GROUPS.filter(k => result.groups[k].length).map(kind => {
      const limit = state.expanded && state.expanded[kind] || LIMITS[kind], rows = result.groups[kind].slice(0, limit);
      return '<section class="ss-group" role="group" aria-labelledby="s17-search-group-' + kind + '"><h3 id="s17-search-group-' + kind + '">' + LABELS[kind] + '<span>' + result.groups[kind].length + '</span></h3>' + rows.map(row => {
        const i = visible.length; visible.push(row);
        return '<a id="s17-search-result-' + i + '" class="ss-result" role="option" aria-selected="false" tabindex="-1" data-s17-search-result="' + i + '" data-case-id="' + esc(row.caseId || '') + '" data-section-id="' + esc(row.sectionId || '') + '" href="' + esc(row.href) + '"><span class="ss-result-type">' + LABELS[kind] + '</span><span class="ss-result-copy"><strong>' + mark(row.title, state.query) + '</strong><small>' + esc(statusText(row)) + '</small>' + (row.summary ? '<span>' + mark(row.summary.slice(0, 130), state.query) + '</span>' : '') + '</span><span class="ss-result-go" aria-hidden="true">↗</span></a>';
      }).join('') + (result.groups[kind].length > rows.length ? '<button type="button" class="ss-more" data-s17-search-more="' + kind + '">再显示' + LABELS[kind] + '结果</button>' : '') + '</section>';
    }).join('') || '<div class="ss-empty"><strong>没有找到相符内容</strong><p>试试案例编号、短一点的关键词，或清除案例范围。</p></div>';
    state.active = visible.length ? 0 : -1; state.resultCount = visible.length; state.totalMatches = result.total; state.computeMs = result.computeMs;
    dialog.querySelector('#s17-search-count').textContent = result.total ? '找到 ' + result.total + ' 条 · 显示 ' + visible.length + ' 条' : '没有匹配结果';
    dialog.querySelectorAll('[data-s17-search-kind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s17SearchKind === state.kind)));
    setActive(state.active, false); state.renderMs = now() - start; dialog.dataset.resultCount = String(visible.length); dialog.dataset.renderMs = state.renderMs.toFixed(2);
  }
  function setActive(i, scroll) {
    if (!dialog) return; state.active = visible.length ? (i + visible.length) % visible.length : -1;
    dialog.querySelectorAll('[data-s17-search-result]').forEach((a, j) => { a.classList.toggle('is-active', j === state.active); a.setAttribute('aria-selected', String(j === state.active)); if (scroll && j === state.active) a.scrollIntoView({ block: 'nearest' }); });
    const input = dialog.querySelector('#s17-search-input'); if (state.active >= 0) input.setAttribute('aria-activedescendant', 's17-search-result-' + state.active); else input.removeAttribute('aria-activedescendant');
  }

  function makeDialog() {
    if (dialog) return;
    dialog = d.createElement('dialog'); dialog.id = 's17-search-dialog'; dialog.className = 'ss-dialog'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 's17-search-title');
    dialog.innerHTML = '<div class="ss-heading"><div><span class="ss-eyebrow">井见 · 查找内容</span><h2 id="s17-search-title">全站检索</h2></div><button type="button" class="ss-close" data-s17-search-close aria-label="关闭检索">关闭 <kbd>Esc</kbd></button></div><div class="ss-query-row"><label class="ss-query-label" for="s17-search-input">案例、知识或方法</label><div class="ss-query-box"><input id="s17-search-input" type="search" maxlength="160" placeholder="试试：迟到、环空、荧光、S3、kNN" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="s17-search-results" aria-expanded="true" aria-describedby="s17-search-help"><button type="button" class="ss-clear" data-s17-search-clear aria-label="清空检索词">清空</button></div></div><div class="ss-filters"><label for="s17-search-case">案例范围<select id="s17-search-case"></select></label><label for="s17-search-section">知识小节<select id="s17-search-section" disabled></select></label></div><div class="ss-kinds" aria-label="检索内容类型"><button type="button" data-s17-search-kind="all" aria-pressed="true">全部</button>' + GROUPS.map(k => '<button type="button" data-s17-search-kind="' + k + '" aria-pressed="false">' + LABELS[k] + '</button>').join('') + '</div><div class="ss-result-heading"><span id="s17-search-count" role="status" aria-live="polite"></span><span id="s17-search-help">↑↓ 选择 · Enter 打开</span></div><div id="s17-search-results" class="ss-results" role="listbox" aria-label="检索结果"></div><div class="ss-footer">按 Ctrl / ⌘ K 打开 · 选择知识结果可直接进入小节</div>';
    d.body.append(dialog); const input = dialog.querySelector('#s17-search-input');
    input.addEventListener('compositionstart', () => composition = true); input.addEventListener('compositionend', () => { composition = false; state.query = input.value; state.inputCount++; state.lastInputAt = now(); state.expanded = {}; render(state.lastInputAt); });
    input.addEventListener('input', e => { if (composition || e.isComposing) return; state.query = input.value; state.inputCount++; state.lastInputAt = now(); state.expanded = {}; render(state.lastInputAt); });
    dialog.querySelector('#s17-search-case').addEventListener('change', e => { state.caseId = e.target.value; state.sectionId = ''; state.expanded = {}; updateFilters(); render(); });
    dialog.querySelector('#s17-search-section').addEventListener('change', e => { state.sectionId = e.target.value; state.kind = state.sectionId ? 'sections' : 'all'; state.expanded = {}; render(); });
    dialog.addEventListener('click', e => {
      if (e.target === dialog || e.target.closest('[data-s17-search-close]')) { close(); return; }
      const clear = e.target.closest('[data-s17-search-clear]'); if (clear) { input.value = ''; state.query = ''; state.expanded = {}; render(); input.focus(); return; }
      const kind = e.target.closest('[data-s17-search-kind]'); if (kind) { state.kind = kind.dataset.s17SearchKind; if (state.kind !== 'sections') state.sectionId = ''; updateFilters(); state.expanded = {}; render(); return; }
      const more = e.target.closest('[data-s17-search-more]'); if (more) { state.expanded = state.expanded || {}; const kind = more.dataset.s17SearchMore; state.expanded[kind] = (state.expanded[kind] || LIMITS[kind]) + 24; render(); input.focus(); return; }
      const result = e.target.closest('[data-s17-search-result]'); if (result) { e.preventDefault(); choose(Number(result.dataset.s17SearchResult)); }
    });
    dialog.addEventListener('pointermove', e => { const row = e.target.closest('[data-s17-search-result]'); if (row) setActive(Number(row.dataset.s17SearchResult), false); });
    dialog.addEventListener('cancel', e => { e.preventDefault(); close(); }); dialog.addEventListener('close', () => { if (state.open) close(); });
  }
  function open() {
    if (!d || !d.body) return false; if (state.open) { dialog.querySelector('#s17-search-input').focus(); return true; }
    opener = d.activeElement; ensureIndex(true); makeDialog(); state.open = true; state.query = ''; state.caseId = ''; state.sectionId = ''; state.kind = 'all'; state.expanded = {}; dialog.querySelector('#s17-search-input').value = ''; updateFilters();
    d.body.classList.add('s17-search-open');
    if (typeof dialog.showModal === 'function') { try { dialog.showModal(); } catch (_) { dialog.setAttribute('open', ''); } }
    else { dialog.setAttribute('open', ''); dialog.classList.add('ss-dialog-fallback'); if (!backdrop) { backdrop = d.createElement('div'); backdrop.className = 'ss-backdrop'; backdrop.addEventListener('click', () => close()); d.body.append(backdrop); } backdrop.hidden = false; }
    render(); dialog.querySelector('#s17-search-input').focus(); d.querySelectorAll('[data-s17-search-open]').forEach(b => b.setAttribute('aria-expanded', 'true')); return true;
  }
  function close(options) {
    if (!state.open) return false; const restore = !options || options.restoreFocus !== false; state.open = false;
    if (dialog && typeof dialog.close === 'function' && dialog.open) dialog.close(); else if (dialog) dialog.removeAttribute('open');
    if (backdrop) backdrop.hidden = true; d.body.classList.remove('s17-search-open'); d.querySelectorAll('[data-s17-search-open]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    state.query = ''; state.caseId = ''; state.sectionId = ''; state.active = -1; state.resultCount = 0; state.totalMatches = 0; visible = []; lastSearch = null; if (dialog) { dialog.querySelector('#s17-search-input').value = ''; dialog.querySelector('#s17-search-results').replaceChildren(); dialog.querySelector('#s17-search-count').textContent = ''; }
    if (restore) { const target = opener && opener.isConnected && !opener.disabled ? opener : d.querySelector('[data-s17-search-open]'); if (target) { try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); } } } return true;
  }
  function choose(i) {
    const row = visible[i]; if (!row) return; const href = row.href; if (!/^#\/(?:scene|stage|method|cases)(?:\/|\?|$)/.test(href)) return;
    close({ restoreFocus: false }); const same = g.location.hash === href;
    if (row.kind === 'sections') queueNavigation(href, row, !same); else pending = null;
    if (!same) g.location.hash = href; else { if (!pending && row.kind === 'cases') { const h = d.querySelector('#view main h1'); if (h) focusTarget(h); } scheduleView(); }
  }
  function parseRoute() {
    const hash = g.location && g.location.hash || '', m = /^#\/scene\/([^?]+)(?:\?(.*))?$/.exec(hash); if (!m) return null;
    try { const q = new URLSearchParams(m[2] || ''); return { hash, sceneId: decodeURIComponent(m[1]), caseId: q.get('case') || '', sectionId: q.get('section') || '', tab: q.get('tab') === 'flow' ? 'flow' : 'bg' }; } catch (_) { return null; }
  }
  function queueNavigation(hash, section, waitForChange) {
    clearTimeout(navigationTimer); pending = { hash, caseId: section.caseId, sceneId: section.sceneId, sectionId: section.sectionId || section.id, tab: section.tab || 'bg', anchor: section.anchor || '', order: section.order, started: now(), minRevision: bodyRevision + (waitForChange ? 1 : 0) };
    state.lastNavigation = { caseId: pending.caseId, sectionId: pending.sectionId, status: 'waiting', anchor: pending.anchor };
    navigationTimer = g.setTimeout(() => { if (pending) { state.lastNavigation = { caseId: pending.caseId, sectionId: pending.sectionId, anchor: pending.anchor, status: 'not-found', elapsedMs: now() - pending.started }; pending = null; } }, 15000); scheduleView();
  }
  function routeNavigation() {
    const route = parseRoute(); if (!route || !route.sectionId) { pending = null; return; }
    if (pending && pending.hash === route.hash) { scheduleView(); return; }
    const source = ensureIndex(false), s = source.groups.sections.find(s => s.caseId === route.caseId && s.sectionId === route.sectionId && s.tab === route.tab);
    if (s) queueNavigation(route.hash, s, false);
  }
  function readyForCase(id) {
    if (!view) return false;
    const marker = view.querySelector('main[data-s17-case-id]') || (view.matches('[data-s17-case-id]') ? view : view.querySelector('[data-s17-case-id]'));
    if (marker) return marker.getAttribute('data-s17-case-id') === id && marker.getAttribute('data-s17-case-ready') === 'true';
    if (view.querySelector('[aria-busy="true"],[data-s17-case-ready="false"]')) return false;
    const selected = view.querySelector('.case-switch [data-case][aria-selected="true"],.case-switch [data-case].on,.case-switch [data-case].active');
    return !selected || selected.getAttribute('data-case') === id;
  }
  function focusTarget(target) {
    const h = /^(H[1-6])$/.test(target.tagName) ? target : target.querySelector('h1,h2,h3,h4,h5,h6,[role="heading"]') || target;
    for (let p = target.parentElement; p && p !== view; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
    const xl = target.closest('[data-xl-panel]'), sr = target.closest('.sr-step');
    if (xl) { const n = xl.getAttribute('data-xl-panel'), b = [...view.querySelectorAll('[data-xl-step]')].find(b => b.getAttribute('data-xl-step') === n); if (b) b.click(); }
    if (sr) { const n = sr.id.replace('sr-step-', ''), b = [...view.querySelectorAll('[data-sr-step]')].find(b => b.getAttribute('data-sr-step') === n); if (b) b.click(); }
    const header = d.querySelector('.hdr'), margin = Math.ceil(header ? header.getBoundingClientRect().height : 72) + 18; target.style.scrollMarginTop = margin + 'px';
    h.setAttribute('tabindex', '-1'); h.classList.add('ss-destination'); target.scrollIntoView({ block: 'start', behavior: 'auto' }); try { h.focus({ preventScroll: true }); } catch (_) { h.focus(); }
  }
  function attemptNavigation() {
    if (!pending || !view || d.readyState === 'loading') return;
    if (g.location.hash !== pending.hash) { pending = null; return; }
    if (!ensureIndex(false).byId.has(pending.caseId)) { state.lastNavigation = { caseId: pending.caseId, sectionId: pending.sectionId, anchor: pending.anchor, status: 'hidden', elapsedMs: now() - pending.started }; pending = null; clearTimeout(navigationTimer); return; }
    if (bodyRevision < pending.minRevision || !readyForCase(pending.caseId)) return;
    let anchor = pending.anchor, target = anchor ? d.getElementById(anchor) : null;
    if (!target || !view.contains(target)) {
      const source = ensureIndex(false), row = source.groups.sections.find(s => s.caseId === pending.caseId && s.sectionId === pending.sectionId && s.tab === pending.tab); if (row && row.anchor) { anchor = row.anchor; target = d.getElementById(anchor); }
    }
    if ((!target || !view.contains(target)) && !pending.anchor && pending.order !== undefined) {
      const candidates = pending.tab === 'flow' ? ['sr-step-' + pending.order, 'xl-method-' + pending.order] : ['sr-chapter-' + pending.order, 'xl-chapter-' + pending.order];
      target = candidates.map(id => d.getElementById(id)).find(el => el && view.contains(el)); if (target) anchor = target.id;
    }
    if (!target || !view.contains(target)) return; focusTarget(target);
    state.lastNavigation = { caseId: pending.caseId, sectionId: pending.sectionId, anchor, status: 'focused', elapsedMs: now() - pending.started }; pending = null; clearTimeout(navigationTimer);
  }
  function injectHeader() {
    const header = view && view.querySelector('.hdr-in'); if (!header) return;
    header.classList.add('s17-search-header'); const old = [...header.querySelectorAll('[data-s17-search-open]')]; let button = old.shift(); old.forEach(b => b.remove());
    if (!button) { button = d.createElement('button'); button.id = 's17-search-open'; button.type = 'button'; button.className = 'ss-trigger'; button.setAttribute('data-s17-search-open', ''); button.setAttribute('aria-label', '全站检索，快捷键Ctrl或Command加K'); button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 's17-search-dialog'); button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><span>检索</span><kbd>⌘ K</kbd>'; button.addEventListener('click', () => open()); }
    button.setAttribute('aria-expanded', String(state.open)); const add = header.querySelector('.nav-add[data-import],button[data-import]'); if (add && button.nextElementSibling !== add) header.insertBefore(button, add); else if (!button.isConnected) header.append(button);
  }
  function scheduleView() {
    if (frame) return; const raf = g.requestAnimationFrame || (fn => g.setTimeout(fn, 16)); frame = raf(() => { frame = 0; bindView(); injectHeader(); attemptNavigation(); });
  }
  function bindView() {
    const current = d.getElementById('view'); if (current === view) return; if (viewObserver) viewObserver.disconnect(); view = current; if (!view || !g.MutationObserver) return;
    viewObserver = new g.MutationObserver(records => { if (records.some(r => !r.target.closest || !r.target.closest('.hdr'))) bodyRevision++; scheduleView(); }); viewObserver.observe(view, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-s17-case-ready', 'data-s17-case-id'] });
  }
  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); return; }
    if (!state.open || composition || e.isComposing) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      const focusables = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el => !el.hidden && el.getClientRects().length);
      const first = focusables[0], last = focusables[focusables.length - 1]; if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (d.activeElement === first || !dialog.contains(d.activeElement))) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && (d.activeElement === last || !dialog.contains(d.activeElement))) { e.preventDefault(); first.focus(); } return;
    }
    if (e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setActive(state.active + (e.key === 'ArrowDown' ? 1 : -1), true); }
    if (e.key === 'Enter' && e.target.id === 's17-search-input' && visible.length) { e.preventDefault(); choose(state.active < 0 ? 0 : state.active); }
  }
  function snapshot() {
    return { open: state.open, lastQuery: state.query, renderMs: state.renderMs, computeMs: state.computeMs, indexMs: state.indexMs, resultCount: state.resultCount, totalMatches: state.totalMatches, caseCount: index ? index.cases.length : 0, authoredCaseCount: index ? index.composition.authoredCount : 0, teacherCaseCount: index ? index.composition.teacherCount : 0, extraImportedCaseCount: index ? index.composition.extraImportedCount : 0, catalogAuthoredCount: index ? index.catalogAuthoredCount : 0, blockedCount: index ? index.blockedCount : 0, sectionCount: index ? index.sections.length : 0, importedCount: state.importedCount, caseId: state.caseId, sectionId: state.sectionId, kind: state.kind, activeIndex: state.active, inputCount: state.inputCount, indexBuilds: state.indexBuilds, extractedHTMLChars: state.extractedHTMLChars, groups: lastSearch ? Object.assign({}, lastSearch.counts) : null, lastNavigation: state.lastNavigation && Object.assign({}, state.lastNavigation) };
  }
  function start() { bindView(); injectHeader(); routeNavigation(); d.addEventListener('keydown', onKey); d.addEventListener('focusin', e => { if (state.open && dialog && !dialog.contains(e.target)) dialog.querySelector('#s17-search-input').focus(); }); }
  g.S17Search = { open, close, search, snapshot };
  // CaseImport.remove emits hashchange; restore reloads the page. Re-read visibility before reusing metadata.
  g.addEventListener('hashchange', () => { dirty = true; bindView(); if (state.open) { ensureIndex(false); updateFilters(); render(); } routeNavigation(); scheduleView(); });
  g.addEventListener('caseimportready', () => { dirty = true; if (state.open) { ensureIndex(true); updateFilters(); render(); } routeNavigation(); scheduleView(); });
  g.addEventListener('s17caseready', e => { if (!pending || !e.detail || !e.detail.caseId || e.detail.caseId === pending.caseId) { routeNavigation(); scheduleView(); } });
  g.addEventListener('s17catalogready', () => { dirty = true; if (state.open) { ensureIndex(true); updateFilters(); render(); } routeNavigation(); scheduleView(); });
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})(window);
