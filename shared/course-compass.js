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
  const extensions={
    's17x-g3-closure-spill':{problem:'一条剖面可能遗漏侧向出口，怎样在整张构造图上找到闭合边界？',point:'对二维顶面网格执行优先队列连通分析，找出溢出点、闭合区域与几何体积。',diff:'中',diffWhy:'需要处理二维连通、边界出口和网格分辨率；剖面判断必须与整图结果对照。',refs:['优先队列连通分析','地形连通与溢出点','网格体积积分'],data:[['储层顶面深度网格','覆盖目标构造及开放边界，保留网格间距与深度单位','核对井震标定、缺测与边界条件'],['构造高点与解释边界','一个待分析高点及其周围完整图幅','人工确认分析对象和开放出口'],['对照剖面与网格检查','同一顶面的交叉剖面、不同网格尺度','独立核查闭合边界与溢出位置']]},
    's17x-c1-cement-woc-strength':{problem:'同样等待一天，不同温度历史下的水泥试样是否都达到目标强度？',point:'累计温度历史形成等效龄期，用拟合的单调强度关系估计目标强度的达到时刻。',diff:'中',diffWhy:'温度历史、配方与试样批次共同影响强度，需要按完整批次校准和验证。',refs:['等效龄期','单调回归','达到目标时间估计'],data:[['养护温度历史','覆盖拌浆至观察结束的连续时间序列','时间同步并保留温度变化'],['同配方试样强度','多个独立批次、多个龄期的强度读数','记录试验条件、配方和批次身份'],['目标强度与观察窗口','带单位的课程或实验目标及截止时刻','核对目标来源；保留未达到目标的试样']]},
    's17x-co3-completion-seal-test':{problem:'保压期间压力下降，是温度变化还是受试段存在流失？',point:'用独立校准估计温度响应，补偿压力后拟合保压斜率，比较漏率区间与目标门槛。',diff:'中',diffWhy:'温漂与流失可同时出现，需要独立校准、明确的闭阀窗口和不确定性检查。',refs:['温度补偿','回归与残差','压力测试判读'],data:[['压力与温度记录','覆盖闭阀前后及完整保压窗口','同步时间戳，标记缺测和阀门动作'],['独立温漂校准','多次无漏温度变化试验','保留试验身份和校准范围'],['加液量与增压记录','受试容积的多组配对读数','记录体积与压力单位及试验门槛']]},
    's17x-p1-perforation-depth-correlation':{problem:'射孔工具的深度尺与参考测井不一致，怎样把目标层对准？',point:'用GR互相关和CCL接箍有序匹配估计深度偏移，并检查漏检和多候选。',diff:'中',diffWhy:'需要统一两把深度尺，并识别重复曲线、接箍漏检与多个匹配候选。',refs:['互相关匹配','有序序列匹配','深度校正'],data:[['参考GR与目标层','覆盖目标层上下的连续测井及目标井段','统一深度基准、采样间距和单位'],['工具GR与CCL','同趟下入的GR曲线和接箍位置','保留测量深度、漏检与噪声信息'],['参考接箍位置','覆盖匹配区间的套管接箍记录','核对接箍顺序与参考深度']]}
  };
  const techniques={m1:'连通域分割 · 16维特征 · 加权kNN',m2:'峰检测 · 累计体积归位 · 加权kNN',m3:'曝光校正 · 像素逻辑回归',m4:'对数工况回归 · k均值 · 连续分段',m5:'字符朴素贝叶斯 · 字段规则抽取',d1:'十项多项式岭回归 · 约束网格搜索','s17x-g3-closure-spill':'二维优先队列连通分析 · 网格体积积分','s17x-c1-cement-woc-strength':'等效龄期 · 单调强度关系拟合','s17x-co3-completion-seal-test':'独立温漂校准 · 补偿后回归','s17x-p1-perforation-depth-correlation':'GR互相关 · CCL有序匹配'};
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
    var own=!manifest.imported&&extensions[manifest.id],actual=Object.assign({},sc,own||{}),methodKeys=manifest.methods&&manifest.methods.length?manifest.methods:sc.methods;
    return {
      actualMethod:techniques[manifest.id]||techniques[sc.id]||(manifest.tabs?.workflow?.steps||[]).map(x=>x.name).slice(1,3).join(' · '),
      brief:{problem:actual.problem,point:own?own.point:(manifest.tabs?.background?.lede||manifest.lede||actual.point),data:actual.data||[],methods:methodKeys.slice()},
      scene:{id:sc.id, name:sc.name, stageId:sc.stageId, stageName:sc.stageName || stage && stage.name || '', diff:actual.diff || '', diffWhy:actual.diffWhy || '', refs:(actual.refs || []).slice()},
      current:{id:manifest.id || '', title:manifest.title || sc.name, version:manifest.version || ''},
      methods:(methodKeys || []).map(function (key) { var m = atlas.methods[key]; return {id:key, name:m && m.name || key, abbr:m && m.abbr || key.toUpperCase()}; }),
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
  function brief(m,options){
    if(m.current.id==='welllog-layer')return '';
    return '<section class="tb-brief" data-course-brief="'+esc(m.current.id)+'" aria-label="场景速览"><div><span>这次解决什么</span><p>'+esc(m.brief.problem)+'</p></div><div><span>本例实际方法</span><p>'+esc(m.actualMethod||m.methods.map(x=>x.name).join(' · '))+'</p><p>'+esc(m.brief.point)+'</p></div><div><span>输入资料与用途</span><p>'+esc(m.brief.data.map(x=>x[0]).join('、'))+'</p><small>沿原始观测理解计算输出，再把结果放回作业判断。</small></div>'+(/^m[1-5]$/.test(m.scene.id)?'<a class="tb-field-link" href="'+esc(portalHref('#/stage/mudlogging?focus='+m.scene.id,options||{}))+'">在3D井场中定位 '+esc(m.scene.id.toUpperCase())+' ↗</a>':'')+'</section>';
  }
  function preparation(m){
    if(m.current.id==='welllog-layer')return '';
    return '<section class="tb-preparation" data-course-preparation="'+esc(m.current.id)+'"><header><div><small>开展这个方向</small><h2>你需要准备什么</h2></div><output>0 / '+m.brief.data.length+'</output></header><p>以下是研究与应用的数据准备建议；本页演示使用的观测与样本另随计算保存。</p>'+m.brief.data.map((row,i)=>'<label><input type="checkbox" data-course-check="'+i+'"><span><b>'+esc(row[0])+'</b><span>规模与规格：'+esc(row[1])+'</span><span>标注与质量：'+esc(row[2])+'</span></span></label>').join('')+'</section>';
  }
  function render(m, options) {
    options = options || {};
    var includeDifficulty = options.includeDifficulty !== false;
    var sameStage = '<ul class="course-links">' + m.sameStage.map(function (s) { return '<li><a href="' + esc(sceneHref(s, m, options)) + '"><span>' + esc(s.name) + '</span><small>' + esc(s.id.toUpperCase()) + ' →</small></a></li>'; }).join('') + '</ul>';
    var cross = m.crossStages.length ? '<div class="course-cross"><h3>原地图标注的交叉环节</h3><div class="course-pills">' + m.crossStages.map(function (s) { return s.id ? '<a class="course-pill" href="' + esc(portalHref('#/stage/' + encodeURIComponent(s.id), options)) + '">' + esc(s.name) + (s.sameStage ? ' · 本环节' : ' →') + '</a>' : '<span class="course-pill">' + esc(s.name) + '</span>'; }).join('') + '</div></div>' : '';
    return preparation(m)+'<section class="course-context" data-course-context="' + esc(m.scene.id) + '" data-course-mode="' + esc(options.mode || 'standalone') + '"' + (m.authoredNext ? ' data-course-next-scene="' + esc(m.next && m.next.id || '') + '" data-course-next-label="' + esc(m.nextLabel) + '"' : '') + ' aria-labelledby="course-context-' + esc(m.scene.id) + '"><header><span class="course-eyebrow">放回作业链，继续看场景</span><h2 id="course-context-' + esc(m.scene.id) + '">' + (includeDifficulty ? '技术难度与参考方向' : '继续阅读场景与案例') + '</h2></header>' +
      (includeDifficulty ? '<div class="course-context-grid"><div class="course-context-cell"><div class="course-difficulty-line"><span class="course-difficulty" data-difficulty="' + esc(m.scene.diff) + '">技术难度 · ' + esc(m.scene.diff || '未标注') + '</span><span class="course-difficulty-caption">'+(extensions[m.current.id]?'本例的技术判断':'原场景的技术判断')+'</span></div>' + (m.scene.diffWhy ? '<p>' + esc(m.scene.diffWhy) + '</p>' : '') + '</div><div class="course-context-cell"><h3>可以继续查阅的方法方向</h3><div class="course-pills">' + m.scene.refs.map(function (ref) { var key=/OCR|文本|抽取|语言|报告生成/.test(ref)?'nlp':/优化|控制|强化学习|规划|Pareto/.test(ref)?'opt':/图谱|规则推理|本体/.test(ref)?'kg':/图像|视觉|像素|分割|细粒度|裂缝/.test(ref)?'cv':/时序|序列|预测|回归|变点/.test(ref)?'ts':m.methods[0]?.id||'opt';return '<a class="course-pill" href="'+esc(portalHref('#/method/'+key,options))+'">' + esc(ref) + ' ↗</a>'; }).join('') + '</div><div class="course-method-links">' + m.methods.map(function (method) { return '<a href="' + esc(portalHref('#/method/' + encodeURIComponent(method.id), options)) + '">' + esc(method.abbr) + ' · ' + esc(method.name) + '方法索引 →</a>'; }).join('') + '</div></div></div>' : '') +
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
    var prior = background.querySelectorAll('[data-course-context],[data-course-preparation]');
    prior.forEach(function (el) { el.remove(); });
    var existingDifficulty = Array.from(background.querySelectorAll('h2,h3')).some(function (heading) { return heading.textContent.trim() === '技术难度与参考方向'; });
    var m = model(sc, current, g.ATLAS, runtimeCatalog(), continuation), options = {mode:'portal', includeDifficulty:!existingDifficulty};
    background.insertAdjacentHTML('beforeend', render(m, options));
    if(!background.querySelector('[data-course-brief]'))background.insertAdjacentHTML('afterbegin',brief(m,options));
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
  g.S17Compass = {model:model, render:render, brief:brief, navigation:navigation, sameSceneHTML:sameSceneHTML, configure:configure, mount:mount};
  if (!d) return;
  if (g.S17CompassPage) configure(g.S17CompassPage);
  d.addEventListener('change',function(e){if(!e.target.matches('[data-course-check]'))return;var host=e.target.closest('[data-course-preparation]');host.querySelector('output').textContent=host.querySelectorAll('input:checked').length+' / '+host.querySelectorAll('input').length;});
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
