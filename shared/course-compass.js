/* Original ATLAS metadata in a small, offline course compass. No model or data mutation. */
(function (g) {
  'use strict';
  if (g.S17Compass) {
    if (g.S17CompassPage) g.S17Compass.configure(g.S17CompassPage);
    return;
  }
  var d = g.document, config = null, timer = null, observer = null;
  var parts = [{id:'background', tab:'bg', no:'01', name:'专业背景'}, {id:'workflow', tab:'flow', no:'02', name:'案例流程'}, {id:'lab', tab:'demo', no:'03', name:'可运行示范'}];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]; }); }
  function byId(atlas, id) { return atlas && atlas.index && atlas.index.byScene && atlas.index.byScene[id] || null; }
  function stages(atlas) { return atlas && atlas.stages || []; }
  function catalogRows(catalog) { return Array.isArray(catalog) ? catalog : catalog && catalog.cases || []; }
  function unique(rows) { var seen = {}; return rows.filter(function (r) { if (!r || !r.id || seen[r.id]) return false; seen[r.id] = true; return true; }); }
  function normalCase(row) { return {id:row.id, sceneId:row.sceneId || row.scene, title:row.title || row.name || row.id, version:row.version || '', directory:row.directory || '', origin:row.origin || ''}; }
  function sceneRow(sc, catalog) {
    var found = catalog.filter(function (c) { return c.sceneId === sc.id && c.directory; })[0];
    return {id:sc.id, name:sc.name, stageId:sc.stageId, stageName:sc.stageName, caseId:found && found.id || '', directory:found && found.directory || ''};
  }
  function model(scene, manifest, atlas, catalog, options) {
    options = options || {}; manifest = manifest || {};
    var sc = typeof scene === 'string' ? byId(atlas, scene) : scene;
    if (!sc || !sc.id) throw new Error('Unknown course scene: ' + String(scene));
    var rows = unique(catalogRows(catalog).map(normalCase));
    if (manifest.id) {
      var existing = rows.filter(function (r) { return r.id === manifest.id; })[0];
      var current = normalCase(Object.assign({}, existing || {}, manifest, {sceneId:sc.id}));
      rows = rows.filter(function (r) { return r.id !== current.id; });
      rows.unshift(current);
    }
    var stage = stages(atlas).filter(function (s) { return s.id === sc.stageId; })[0];
    var siblings = stage ? stage.scenes : (atlas.allScenes || []).filter(function (s) { return s.stageId === sc.stageId; });
    var sameStage = siblings.filter(function (s) { return s.id !== sc.id; }).map(function (s) { return sceneRow(s, rows); });
    var index = siblings.findIndex(function (s) { return s.id === sc.id; });
    var next = options.nextScene === null ? null : byId(atlas, options.nextScene) || siblings[index + 1] || siblings[0];
    if (next && next.id === sc.id) next = null;
    var cross = (sc.cross || []).map(function (name) {
      var target = stages(atlas).filter(function (s) { return s.name === name || s.id === name; })[0];
      return target ? {id:target.id, name:target.name, sameStage:target.id === sc.stageId} : {id:'', name:name};
    });
    return {
      scene:{id:sc.id, name:sc.name, stageId:sc.stageId, stageName:sc.stageName || stage && stage.name || '', diff:sc.diff || '', diffWhy:sc.diffWhy || '', refs:(sc.refs || []).slice()},
      current:{id:manifest.id || '', title:manifest.title || sc.name, version:manifest.version || ''},
      methods:(sc.methods || []).map(function (key) { var m = atlas.methods[key]; return {id:key, name:m && m.name || key, abbr:m && m.abbr || key.toUpperCase()}; }),
      sameScene:rows.filter(function (r) { return r.sceneId === sc.id; }), sameStage:sameStage,
      crossStages:cross, next:next ? sceneRow(next, rows) : null,
      authoredNext:Object.prototype.hasOwnProperty.call(options, 'nextScene'),
      nextLabel:options.nextLabel || (next && next.stageId === sc.stageId ? '同环节继续读' : '继续阅读相关场景'),
      provenance:'老师原始场景地图 · 技术难度、难度原因、参考方向与交叉环节'
    };
  }
  function portalHref(route, options) { return options.mode === 'portal' ? route : (options.portalHref || '../../../../portal/index.html') + route; }
  function caseHref(row, m, options) {
    if (options.mode === 'portal') return '#/scene/' + encodeURIComponent(row.sceneId || row.id) + (row.sceneId ? '?case=' + encodeURIComponent(row.id) + '&tab=bg' : '');
    if (row.id === m.current.id && row.sceneId === m.scene.id) return '#background';
    if (row.directory === 'cases' || row.directory === 'expansion-cases') return (options.collectionPrefix || '../../../') + row.directory + '/' + encodeURIComponent(row.id) + '/demo/index.html#background';
    return portalHref('#/scene/' + encodeURIComponent(row.sceneId || row.id) + (row.sceneId ? '?case=' + encodeURIComponent(row.id) + '&tab=bg' : ''), options);
  }
  function sceneHref(row, m, options) { return row.caseId ? caseHref({id:row.caseId, sceneId:row.id, directory:row.directory}, m, options) : portalHref('#/scene/' + encodeURIComponent(row.id), options); }
  function partHref(part, m, options) { return options.mode === 'portal' ? '#/scene/' + encodeURIComponent(m.scene.id) + (m.current.id ? '?case=' + encodeURIComponent(m.current.id) + '&tab=' : '?tab=') + part.tab : '#' + part.id; }
  function navigation(m, options) {
    options = options || {};
    var breadcrumb = '<nav class="course-wayfinding" aria-label="课程位置"><a href="' + esc(portalHref('#/', options)) + '">← 课程总览</a><span aria-hidden="true">/</span><a href="' + esc(portalHref('#/stage/' + encodeURIComponent(m.scene.stageId), options)) + '">' + esc(m.scene.stageName) + '环节</a><span class="course-current">' + esc(m.scene.id.toUpperCase()) + ' · ' + esc(m.scene.name) + '</span></nav>';
    if (!options.includeReading) return breadcrumb;
    return breadcrumb + '<nav class="course-reading-route" aria-label="阅读路径"><span>阅读路径</span>' + parts.map(function (p, i) { return (i ? '<span class="course-route-arrow" aria-hidden="true">→</span>' : '') + '<a href="' + esc(partHref(p, m, options)) + '" data-course-part="' + p.id + '"' + (!i ? ' aria-current="step"' : '') + '><small>' + p.no + '</small>' + p.name + '</a>'; }).join('') + '</nav>';
  }
  function sameSceneHTML(m, options) {
    if (!m.sameScene.length) return '<p>本场景的案例可从门户进入。</p>';
    return '<ul class="course-links">' + m.sameScene.map(function (row) {
      var current = row.id === m.current.id;
      return '<li><a href="' + esc(caseHref(row, m, options)) + '"' + (current ? ' aria-current="page"' : '') + '><span>' + esc(row.title) + (current ? '<span class="course-current-tag">当前</span>' : '') + '</span><small>' + esc(row.origin || (row.version ? 'v' + row.version : '查看')) + (current ? '' : ' →') + '</small></a></li>';
    }).join('') + '</ul>';
  }
  function render(m, options) {
    options = options || {};
    var includeDifficulty = options.includeDifficulty !== false;
    var sameStage = '<ul class="course-links">' + m.sameStage.map(function (s) { return '<li><a href="' + esc(sceneHref(s, m, options)) + '"><span>' + esc(s.name) + '</span><small>' + esc(s.id.toUpperCase()) + ' →</small></a></li>'; }).join('') + '</ul>';
    var cross = m.crossStages.length ? '<div class="course-cross"><h3>原地图标注的交叉环节</h3><div class="course-pills">' + m.crossStages.map(function (s) { return s.id ? '<a class="course-pill" href="' + esc(portalHref('#/stage/' + encodeURIComponent(s.id), options)) + '">' + esc(s.name) + (s.sameStage ? ' · 本环节' : ' →') + '</a>' : '<span class="course-pill">' + esc(s.name) + '</span>'; }).join('') + '</div></div>' : '';
    return '<section class="course-context" data-course-context="' + esc(m.scene.id) + '" data-course-mode="' + esc(options.mode || 'standalone') + '"' + (m.authoredNext ? ' data-course-next-scene="' + esc(m.next && m.next.id || '') + '" data-course-next-label="' + esc(m.nextLabel) + '"' : '') + ' aria-labelledby="course-context-' + esc(m.scene.id) + '"><header><span class="course-eyebrow">放回作业链，继续看场景</span><h2 id="course-context-' + esc(m.scene.id) + '">' + (includeDifficulty ? '技术难度与参考方向' : '继续阅读场景与案例') + '</h2></header>' +
      (includeDifficulty ? '<div class="course-context-grid"><div class="course-context-cell"><div class="course-difficulty-line"><span class="course-difficulty" data-difficulty="' + esc(m.scene.diff) + '">技术难度 · ' + esc(m.scene.diff || '未标注') + '</span><span class="course-difficulty-caption">原场景的技术判断</span></div>' + (m.scene.diffWhy ? '<p>' + esc(m.scene.diffWhy) + '</p>' : '') + '</div><div class="course-context-cell"><h3>可以继续查阅的方法方向</h3><div class="course-pills">' + m.scene.refs.map(function (ref) { return '<span class="course-pill">' + esc(ref) + '</span>'; }).join('') + '</div><div class="course-method-links">' + m.methods.map(function (method) { return '<a href="' + esc(portalHref('#/method/' + encodeURIComponent(method.id), options)) + '">' + esc(method.abbr) + ' · ' + esc(method.name) + '方法索引 →</a>'; }).join('') + '</div></div></div>' : '') +
      '<div class="course-related"><div class="course-context-cell course-same-scene"><h3>同场景的案例' + (m.sameScene.length > 1 ? ' · ' + m.sameScene.length + '种实现' : '') + '</h3><div data-course-same-scene>' + sameSceneHTML(m, options) + '</div></div>' + (options.mode === 'portal' ? '' : '<div class="course-context-cell course-same-stage"><h3>同环节的其他场景 · ' + esc(m.scene.stageName) + '</h3>' + sameStage + '</div>') + cross + '</div>' +
      '<div class="course-next">' + (m.next ? '<a href="' + esc(sceneHref(m.next, m, options)) + '">' + esc(m.nextLabel) + '：' + esc(m.next.name) + ' →</a>' : '') + '<a href="' + esc(portalHref('#/stage/' + encodeURIComponent(m.scene.stageId), options)) + '">查看整个' + esc(m.scene.stageName) + '环节</a><a href="' + esc(portalHref('#/', options)) + '">返回课程总览</a></div><p class="course-provenance">' + esc(m.provenance) + '</p></section>';
  }
  function activePart() { if (!g.location) return 'background'; var match = g.location.hash.match(/[?&]tab=(bg|flow|demo)/); return match ? {bg:'background', flow:'workflow', demo:'lab'}[match[1]] : parts.some(function (p) { return '#' + p.id === g.location.hash; }) ? g.location.hash.slice(1) : 'background'; }
  function updatePath() { if (!d) return; var part = activePart(); d.querySelectorAll('[data-course-part]').forEach(function (a) { if (a.dataset.coursePart === part) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }); }
  function runtimeCatalog() {
    var rows = [], course = g.S17Course && g.S17Course.cases || [], expansion = g.S17Expansion && g.S17Expansion.cases || [];
    course.forEach(function (row) { rows.push(Object.assign({}, row, {sceneId:row.sceneId || row.scene, directory:'cases'})); });
    expansion.forEach(function (row) { rows.push(Object.assign({}, row, {directory:'expansion-cases'})); });
    return (g.Cases && g.Cases.list ? g.Cases.list() : []).map(function (row) { var known = rows.filter(function (r) { return r.id === row.id; })[0] || {}; return Object.assign({}, known, row, {origin:row.id === 'welllog-layer' ? '老师原样例' : ''}); });
  }
  function portalMount() {
    if (!d || !g.ATLAS || !g.Cases || !g.location) return false;
    var match = g.location.hash.match(/^#\/scene\/([^?&/]+)/);
    if (!match) return false;
    var sc = byId(g.ATLAS, decodeURIComponent(match[1])), main = d.querySelector('#view main');
    if (!sc || !main) return false;
    var entries = g.Cases.bySceneAll(sc.id), search = g.location.hash.indexOf('?') >= 0 ? new URLSearchParams(g.location.hash.split('?')[1]) : null;
    var current = entries.filter(function (c) { return search && c.id === search.get('case'); })[0] || entries[0];
    var background = main.querySelector('[data-panel="bg"]');
    if (!current || !background) return false;
    var stamp = sc.id + '|' + current.id + '|' + entries.map(function (c) { return c.id + ':' + c.version + ':' + c.title; }).join('|');
    if (main.__courseCompassStamp === stamp && background.querySelector('[data-course-context]')) return true;
    main.__courseCompassStamp = stamp;
    var authored = background.querySelector('[data-course-next-scene]');
    var continuation = authored ? {nextScene:authored.dataset.courseNextScene || null, nextLabel:authored.dataset.courseNextLabel} : g.S17CompassContinuations && g.S17CompassContinuations[sc.id] || {};
    var prior = background.querySelectorAll('[data-course-context]');
    prior.forEach(function (el) { el.remove(); });
    var existingDifficulty = Array.from(background.querySelectorAll('h2,h3')).some(function (heading) { return heading.textContent.trim() === '技术难度与参考方向'; });
    var m = model(sc, current, g.ATLAS, runtimeCatalog(), continuation), options = {mode:'portal', includeDifficulty:!existingDifficulty};
    background.insertAdjacentHTML('beforeend', render(m, options));
    updatePath();
    return true;
  }
  function standaloneMount() {
    if (!d || !config || !config.model) return;
    var m = config.model, opts = config.options || {mode:'standalone'};
    var background = d.getElementById('background');
    if (background && !background.querySelector('[data-course-context]')) background.insertAdjacentHTML('beforeend', render(m, opts));
    if (!d.querySelector('.course-wayfinding')) {
      var host = d.querySelector('.fx-main') || d.querySelector('.m2-exhibit main') || d.querySelector('body.xl-lesson>header') || d.querySelector('body>header') || d.querySelector('main');
      var nativeNavigation = d.querySelector('.fx-parts [data-fx-part], .m2-tabs [data-part], nav [data-tab="background"]');
      if (host) host.insertAdjacentHTML('afterbegin', navigation(m, Object.assign({}, opts, {includeReading:!nativeNavigation})));
    }
    updatePath();
  }
  function mount() { if (!d) return; if (!portalMount()) standaloneMount(); }
  function schedule() { if (timer) g.clearTimeout(timer); timer = g.setTimeout(function () { timer = null; mount(); }, 35); }
  function configure(value) { config = value; if (d) schedule(); }
  g.S17Compass = {model:model, render:render, navigation:navigation, sameSceneHTML:sameSceneHTML, configure:configure, mount:mount};
  if (!d) return;
  if (g.S17CompassPage) configure(g.S17CompassPage);
  d.addEventListener('click', function (event) {
    var link = event.target.closest('[data-course-part]');
    if (!link || portalMount()) return;
    var part = link.dataset.coursePart;
    var native = d.querySelector('[data-fx-part="' + part + '"]') || d.querySelector('[data-part="' + part + '"]') || d.querySelector('nav [data-tab="' + part + '"]');
    if (native) { event.preventDefault(); native.click(); }
    else { var target = d.getElementById(part); if (target) { target.hidden = false; target.scrollIntoView({block:'start'}); } }
    updatePath();
  });
  g.addEventListener('hashchange', schedule);
  function ready() {
    mount();
    var view = d.getElementById('view');
    if (view && g.MutationObserver) { observer = new g.MutationObserver(schedule); observer.observe(view, {childList:true, subtree:true}); }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready, {once:true}); else ready();
})(typeof window !== 'undefined' ? window : globalThis);
