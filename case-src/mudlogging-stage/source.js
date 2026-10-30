import { CONFIG, PHASES, OBJECTS, createTransport, sampleRoute } from './transport.js';

(function (g) {
  'use strict';
  const document = g.document;
  const sourceURL = document.currentScript && document.currentScript.src || new URL('assets/s17-mudlogging-stage.js', document.baseURI).href;
  const heavyLocation = new URL('s17-mudlogging-3d.js', sourceURL);
  heavyLocation.search = new URL(sourceURL).search;
  const heavyURL = heavyLocation.href;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (value, n = 1) => Number(value).toFixed(n);
  const reduce = g.matchMedia ? g.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const totals = { mounts: 0, disposals: 0, scriptsRequested: 0, scenesCreated: 0, scenesDisposed: 0, lastDisposedScene: null };
  let active = null, loadPromise = null, observer = null, reconcileQueued = false, manuallyDisposed = false;

  function courseHref(id) {
    const course = g.S17Course, item = course && course.byScene && course.byScene(id);
    return item && course.href ? course.href(item, 'background') : '#/scene/' + id;
  }
  function onRoute() { return /^#\/stage\/mudlogging(?:\?|$)/.test(g.location.hash); }
  function requestBundle() {
    if (g.S17MudStage3D) return Promise.resolve(g.S17MudStage3D);
    if (loadPromise) return loadPromise;
    totals.scriptsRequested++;
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = heavyURL; script.async = true; script.dataset.s17MudStageBundle = 'true';
      script.onload = () => {
        if (g.S17MudStage3D && typeof g.S17MudStage3D.create === 'function') resolve(g.S17MudStage3D);
        else { script.remove(); loadPromise = null; reject(new Error('3D scene entry unavailable')); }
      };
      script.onerror = () => { script.remove(); loadPromise = null; reject(new Error('3D scene could not be loaded')); };
      document.head.append(script);
    });
    return loadPromise;
  }

  function linePoint(points, fraction) {
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    let remaining = Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lengths.length; i++) {
      if (remaining <= lengths[i] || i === lengths.length - 1) {
        const a = points[i], b = points[i + 1], ratio = lengths[i] ? remaining / lengths[i] : 0;
        return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];
      }
      remaining -= lengths[i];
    }
    return points[0];
  }
  function diagram(state, selection) {
    const route = sampleRoute(state), points = {
      bottom: [[160, 268], [160, 268]], return: [[160, 268], [175, 268], [175, 94], [333, 94]],
      sieve: [[333, 94], [348, 128]], observe: [[348, 128], [490, 128]], record: [[490, 128], [632, 122]]
    };
    const p = linePoint(points[route.segment], route.fraction);
    const marker = route.kind === 'record' ? '<rect x="' + fmt(p[0] - 5) + '" y="' + fmt(p[1] - 5) + '" width="10" height="10" rx="2" fill="#B8242A"/>' : '<circle cx="' + fmt(p[0]) + '" cy="' + fmt(p[1]) + '" r="6" fill="#E8B85F" stroke="#8A642D" stroke-width="1.5"/>';
    const focus = id => ' data-ms-diagram-object="' + id + '" data-active="' + (selection === id) + '"';
    return '<svg viewBox="0 0 720 300" role="img" aria-label="二维录井剖面：钻柱内下行、环空上返、振动筛、分开的气体与岩屑观察支路、钻参与报告记录">'
      + '<rect width="720" height="300" fill="#F7F4EF"/><path d="M48 101H270V285H48Z" fill="#DBCCB1"/>'
      + '<path d="M48 148Q152 137 270 153V193Q151 176 48 189Z" fill="#B9C5B5"/><path d="M48 227Q152 214 270 230V285H48Z" fill="#C6AA88"/>'
      + '<path d="M154 100V275H181V100" fill="#F7F4EF" stroke="#998D7E" stroke-width="2"/>'
      + '<path d="M128 89L148 18H169L190 89M139 51h40m-47 22h53m-41-37h31M134 81l42-45m-33 0l42 45" fill="none" stroke="#956B64" stroke-width="3"/>'
      + '<path d="M87 88H160V265" fill="none" stroke="#467969" stroke-width="5"/><path d="M175 265V94H333" fill="none" stroke="#B08A4A" stroke-width="5"/>'
      + '<path d="M159 165l-5-9h10z" fill="#467969"/><path d="M174 187l-5 9h10z" fill="#B08A4A"/>'
      + '<path d="M153 263l7 13 8-13" fill="#9B8170"/>'
      + '<text x="48" y="122" font-size="16" fill="#665B50">示意地层</text><text x="49" y="207" font-size="16" fill="#467969">钻柱内下行</text><text x="194" y="225" font-size="16" fill="#8A642D">环空上返</text>'
      + '<g' + focus('m1') + '><path d="M309 87h70l-7 17h-58z" fill="#75858D"/><path d="M316 108v17m51-17v17" stroke="#7D7B74" stroke-width="3"/><rect x="328" y="121" width="39" height="15" rx="3" fill="#D8C2A1"/><circle cx="338" cy="126" r="3" fill="#B08A4A"/><circle cx="350" cy="129" r="3" fill="#8D8172"/><text x="302" y="61" font-size="16" fill="#5B5B5F">m1 振动筛 / 岩屑盘</text></g>'
      + '<path d="M299 94V30H432V51" fill="none" stroke="#55768B" stroke-width="3"/>'
      + '<g' + focus('m2') + '><rect x="413" y="43" width="28" height="40" rx="7" fill="#A7B7BC"/><rect x="452" y="43" width="54" height="40" rx="5" fill="#C2CBCD"/><rect x="462" y="51" width="31" height="14" fill="#55768B"/><path d="M441 63h11" stroke="#55768B" stroke-width="3"/><text x="407" y="20" font-size="16" fill="#55768B">m2 脱气 / 气测</text></g>'
      + '<path d="M367 128H470" fill="none" stroke="#9E8B7B" stroke-width="2" stroke-dasharray="5 4"/>'
      + '<g' + focus('m3') + '><path d="M469 102h57v39h-57z" fill="#57515E"/><path d="M476 111h43v23h-43z" fill="#9B83AE"/><text x="439" y="172" font-size="16" fill="#806482">m3 白光 / UV</text></g>'
      + '<g' + focus('m4') + '><rect x="217" y="26" width="61" height="39" rx="5" fill="#8B9F96"/><rect x="225" y="33" width="45" height="22" fill="#E5EEE8"/><path d="M224 81h47m-23-15v15" stroke="#6C8276" stroke-width="3"/><text x="211" y="17" font-size="16" fill="#467969">m4 钻参</text></g>'
      + '<path d="M274 51H578V108M509 69H585M525 128H588" fill="none" stroke="#8A9CA7" stroke-width="2" stroke-dasharray="5 5"/>'
      + '<g' + focus('m5') + '><rect x="586" y="83" width="91" height="61" rx="6" fill="#EAE0D1"/><path d="M604 91h53v37h-53z" fill="#FCFAF6"/><path d="M612 101h37m-37 9h28m-28 9h34" stroke="#9F8F7C" stroke-width="2"/><text x="576" y="173" font-size="16" fill="#B8242A">m5 解释 / 记录</text></g>'
      + (route.kind === 'record' ? '<circle cx="490" cy="128" r="5" fill="#E8B85F" stroke="#8A642D"/>' : '') + marker
      + '<text x="302" y="213" font-size="16" fill="#665B50">金色圆点：教学样品；红色方块：检测后的资料</text>'
      + '<text x="302" y="242" font-size="16" fill="#665B50">气体与岩屑分支观察，钻参走直接记录路径</text>'
      + '<text x="302" y="274" font-size="16" fill="#665B50">剖面与设备均为示意，不表示真实井深比例</text></svg>';
  }

  function timeChart(model, state) {
    const x = t => 146 + t / 1000 * 664, y = v => 285 - v / 25 * 72;
    const currentX = x(state.time_s), sourceX = x(state.sourceTime_s), arrivalX = x(state.arrivalTime_s);
    const curve = model.rows.filter(v => v.time_s <= 1000).map((row, i) => (i ? 'L' : 'M') + x(row.time_s).toFixed(2) + ' ' + y(model.volumes[i]).toFixed(2)).join('');
    return '<svg viewBox="0 0 860 335" role="img" aria-label="井底来源与地面观察的两条时间轴，以及原M2Core累计的实际泵送体积；停泵段表现为平台">'
      + '<text x="12" y="72" font-size="18" fill="#55768B">井底来源</text><text x="12" y="148" font-size="18" fill="#8A642D">地面观察</text>'
      + '<path d="M146 67H810M146 143H810" stroke="#CFC6BA" stroke-width="2"/>'
      + '<path d="M' + sourceX + ' 78C' + (sourceX + 40) + ' 107 ' + (arrivalX - 40) + ' 103 ' + arrivalX + ' 130" fill="none" stroke="#B08A4A" stroke-width="2"/>'
      + '<circle cx="' + sourceX + '" cy="67" r="6" fill="#55768B"/><text x="' + sourceX + '" y="47" font-size="16" text-anchor="middle" fill="#55768B">来源120 s</text>'
      + '<circle cx="' + arrivalX + '" cy="143" r="6" fill="#B08A4A"/><text x="' + arrivalX + '" y="175" text-anchor="middle" font-size="16" fill="#8A642D">到达' + fmt(state.arrivalTime_s, 0) + ' s</text>'
      + '<text x="' + ((sourceX + arrivalX) / 2) + '" y="106" text-anchor="middle" font-size="16" fill="#8A642D">迟到 ' + fmt(state.lag_s, 0) + ' s</text>'
      + '<rect x="' + arrivalX + '" y="136" width="' + (x(model.observeStart_s) - arrivalX) + '" height="14" fill="#B08A4A" opacity=".3"/>'
      + '<rect x="' + x(model.observeStart_s) + '" y="136" width="' + (x(model.recordStart_s) - x(model.observeStart_s)) + '" height="14" fill="#806482" opacity=".25"/>'
      + '<rect x="' + x(model.recordStart_s) + '" y="136" width="' + (x(model.endTime_s) - x(model.recordStart_s)) + '" height="14" fill="#B8242A" opacity=".2"/>'
      + '<text x="12" y="244" font-size="18" fill="#343941">累计泵量</text><text x="12" y="269" font-size="16" fill="#665B50">m³</text>'
      + [0, 15, 25].map(v => '<path d="M146 ' + y(v) + 'H810" stroke="#E3DCD2"/><text x="132" y="' + (y(v) + 5) + '" font-size="16" text-anchor="end" fill="#71685E">' + v + '</text>').join('')
      + (model.mode === 'pause' ? '<rect x="' + x(300) + '" y="206" width="' + (x(480) - x(300)) + '" height="79" fill="#B08A4A" opacity=".12"/><text x="' + x(390) + '" y="200" text-anchor="middle" font-size="16" fill="#8A642D">停泵：300–480 s</text>' : '')
      + '<path d="' + curve + '" fill="none" stroke="#467969" stroke-width="3"/>'
      + '<path d="M' + currentX.toFixed(2) + ' 31V289" stroke="#B8242A" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="' + currentX.toFixed(2) + '" cy="' + y(state.cumulativeVolume_m3).toFixed(2) + '" r="5" fill="#B8242A"/>'
      + '<text x="' + Math.max(192, Math.min(754, currentX)).toFixed(2) + '" y="21" text-anchor="middle" font-size="16" fill="#B8242A">回放时刻 ' + fmt(state.time_s, 0) + ' s</text>'
      + [0, 200, 400, 600, 800, 1000].map(t => '<text x="' + x(t) + '" y="312" text-anchor="middle" font-size="16" fill="#71685E">' + t + '</text>').join('')
      + '<text x="810" y="333" text-anchor="end" font-size="16" fill="#71685E">统一时间 / s</text></svg>';
  }

  const FRAME_PRODUCTS = ['岩屑与含气泥浆', '携样返出物', '分出的岩屑样品', '岩屑观察＋气体组分', '同井段观察记录'];
  function storyFrame(index) {
    const frames = [
      '<path d="M13 48H171V77H13Z" fill="#DDCBAE"/><path d="M13 59H171M13 70H171" stroke="#BBA383" stroke-width="2"/><path d="M82 6V38h20V6" fill="#E8E1D6" stroke="#887D70" stroke-width="2"/><path d="M78 36h28l-5 13H83Z" fill="#8B7C6C"/><path d="M85 48l-4 7m11-6v8m7-9 5 7" stroke="#A4712D" stroke-width="2"/><path d="M64 57l-7 4 3 8 9-2zM109 58l7-3 6 7-7 6zM85 67l7-4 6 8-10 4z" fill="#B08A4A" stroke="#8A642D"/><circle cx="133" cy="45" r="5" fill="#E0EAF0" stroke="#55768B" stroke-width="2"/><circle cx="141" cy="31" r="4" fill="#E0EAF0" stroke="#55768B" stroke-width="2"/><path d="M124 54Q151 44 154 16m-5 6 5-7 4 7" fill="none" stroke="#55768B" stroke-width="2.5"/>',
      '<path d="M33 6H64V78H33ZM117 6h33v72h-33Z" fill="#DDCBAE"/><path d="M64 7V77M117 7V77" stroke="#AA9478" stroke-width="2"/><path d="M83 4V79h16V4" fill="#E6E2DA" stroke="#8B8174" stroke-width="2"/><path d="M91 14v48m-5-6 5 7 5-7" fill="none" stroke="#467969" stroke-width="3"/><path d="M109 69V17h48m-6-5 7 5-7 5" fill="none" stroke="#A4712D" stroke-width="3"/><path d="M106 52l6-3 4 6-6 4zM105 29l5-3 5 6-6 3z" fill="#B08A4A"/><circle cx="73" cy="48" r="4" fill="#DFEAF0" stroke="#55768B" stroke-width="1.5"/><circle cx="74" cy="27" r="3" fill="#DFEAF0" stroke="#55768B" stroke-width="1.5"/>',
      '<path d="M9 21h34m-6-5 7 5-7 5" fill="none" stroke="#A4712D" stroke-width="3"/><path d="M48 23h89l-13 18H57Z" fill="#B5BDBB" stroke="#768281" stroke-width="2"/><path d="M61 26l8 12m8-12 8 12m8-12 8 12m8-12 8 12M55 32h76" stroke="#788381" stroke-width="1.5"/><path d="M68 44v15m-4-5 4 6 4-6" fill="none" stroke="#A4712D" stroke-width="2"/><path d="M45 64h66l-4 12H49Z" fill="#E3D1B3" stroke="#A08A6E" stroke-width="1.5"/><path d="M57 66l5-3 5 6-6 3zM76 68l6-4 5 7-7 2zM95 65l5 1-1 6-7-2z" fill="#B08A4A"/><path d="M123 42v12h37m-6-4 6 4-6 4" fill="none" stroke="#55768B" stroke-width="2.5"/><circle cx="144" cy="62" r="3" fill="#DFEAF0" stroke="#55768B"/><circle cx="154" cy="69" r="2.5" fill="#DFEAF0" stroke="#55768B"/>',
      '<path d="M10 34h23v16H10Z" fill="#DCCAAE" stroke="#A08A6E"/><path d="M16 39l4-2 5 6-5 3z" fill="#B08A4A"/><path d="M34 42h16V20h19m-6-4 6 4-6 4M50 42v22h19m-6-4 6 4-6 4" fill="none" stroke="#7B8A8E" stroke-width="2"/><rect x="73" y="7" width="43" height="28" rx="4" fill="#F4EEDF" stroke="#A99F8E"/><rect x="122" y="7" width="43" height="28" rx="4" fill="#DCD0E7" stroke="#967CA4"/><path d="M83 22l5-6 9 2 4 8-12 3z" fill="#B8996E"/><path d="M133 22l5-6 9 2 4 8-12 3z" fill="#A58ABD"/><circle cx="141" cy="21" r="3" fill="#DDE8AA"/><path d="M83 52h19v25H83Z" fill="#CAD8DC" stroke="#55768B" stroke-width="1.5"/><circle cx="92" cy="61" r="3" fill="#F7F4EF" stroke="#55768B"/><circle cx="94" cy="69" r="2" fill="#F7F4EF" stroke="#55768B"/><path d="M103 65h19m-5-4 6 4-6 4" fill="none" stroke="#55768B" stroke-width="2"/><rect x="128" y="49" width="38" height="28" rx="4" fill="#DCE5E9" stroke="#55768B"/><circle cx="137" cy="63" r="3" fill="#55768B"/><circle cx="147" cy="63" r="3" fill="#7799AB"/><circle cx="157" cy="63" r="3" fill="#B2C7D0"/>',
      '<rect x="10" y="9" width="31" height="25" rx="3" fill="#E8D8BC" stroke="#B9A384"/><path d="M20 17l6-2 6 7-8 5z" fill="#B08A4A"/><rect x="10" y="49" width="31" height="25" rx="3" fill="#E3D9EB" stroke="#AA95B9"/><circle cx="25" cy="61" r="6" fill="#A58ABD"/><circle cx="27" cy="59" r="2.5" fill="#DDE8AA"/><rect x="48" y="30" width="28" height="25" rx="3" fill="#DCE5E9" stroke="#8BA5B3"/><circle cx="57" cy="42" r="3" fill="#55768B"/><circle cx="67" cy="42" r="3" fill="#97B1C0"/><path d="M42 21h9v9M42 62h9v-7M77 42h18m-6-4 7 4-7 4" fill="none" stroke="#8A9CA7" stroke-width="2"/><rect x="103" y="6" width="70" height="72" rx="4" fill="#FFFDF9" stroke="#B8A896" stroke-width="2"/><path d="M117 13v58M112 19h5m-5 15h5m-5 15h5m-5 15h5" stroke="#8A7766" stroke-width="1.5"/><path d="M119 33h49v20h-49Z" fill="#F0E4D0"/><path d="M127 36l4-2 5 6-5 4z" fill="#B08A4A"/><circle cx="145" cy="42" r="4" fill="#A58ABD"/><circle cx="159" cy="42" r="3" fill="#55768B"/><path d="M126 20h33M126 64h33" stroke="#D0C7BA" stroke-width="2"/>'
    ];
    return '<svg class="ms-frame-picture" viewBox="0 0 184 84" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">' + frames[index] + '</svg>';
  }

  function markup(model, state) {
    return '<section id="s17-mudlogging-stage" class="ms-stage" aria-labelledby="ms-title" data-ms-version="1.0.0">'
      + '<header class="ms-heading"><div><span class="ms-kicker">录井 · 同一份观察的旅程</span><h2 id="ms-title">地面的记录，来自更早的井底。</h2></div><p>先跟随一份教学样品，再进入五种观察。井下与地面共用时钟，发生时刻却不同。</p></header>'
      + '<div class="ms-camera-bar" role="group" aria-label="选择观察镜头">' + [['overview', '全景'], ['return', '携屑返出'], ['surface', '地面检测'], ['interpret', '记录解释']].map(([id, name]) => '<button type="button" data-ms-camera="' + id + '" aria-pressed="' + (id === 'overview') + '">' + name + '</button>').join('')
      + '<label class="ms-follow"><input type="checkbox" data-ms-follow checked>随阶段切镜头</label><button type="button" data-ms-view="2d" class="ms-mode">使用二维剖面</button></div>'
      + '<div class="ms-theater"><div class="ms-visual"><div class="ms-viewport" data-ms-viewport><div class="ms-scene" data-ms-canvas hidden></div><div class="ms-diagram" data-ms-diagram tabindex="0" aria-label="二维剖面，可横向滚动">' + diagram(state, 'm2') + '</div></div>'
      + '<p class="ms-view-help" data-ms-view-help>图中位置按累计泵量映射。三维视图接近屏幕时准备；二维剖面可直接操作。</p><div class="ms-legend"><span><i style="background:#467969"></i>钻柱内下行</span><span><i style="background:#B08A4A"></i>携样上返</span><span><i style="background:#55768B"></i>检测 / 记录支路</span></div></div>'
      + '<aside class="ms-aside"><div class="ms-phase-copy"><span class="ms-eyebrow" data-ms-phase-index>01 / 05</span><h3 data-ms-phase-title></h3><p data-ms-phase-lead></p><p class="ms-small" data-ms-phase-detail></p></div><div class="ms-object-copy"><span class="ms-eyebrow">当前对象</span><h3 data-ms-object-title></h3><p data-ms-object-copy></p><a data-ms-object-link>进入对应案例 →</a></div></aside></div>'
      + '<p class="ms-story-heading"><strong>资料形成分镜</strong><span>物质上返 → 两种检测 → 同井段记录</span></p><div class="ms-story-scroll" tabindex="0" aria-label="资料形成分镜，可横向滚动"><nav class="ms-phases" aria-label="点击分镜，把旅程定位到一个阶段">' + PHASES.map((p, i) => '<button type="button" class="ms-story-frame" data-ms-phase="' + i + '" aria-pressed="' + (state.phaseIndex === i) + '" aria-label="' + p.name + '，产物：' + FRAME_PRODUCTS[i] + '，定位到此阶段">' + storyFrame(i) + '<span class="ms-frame-title">' + p.name + '</span><small class="ms-frame-product">' + FRAME_PRODUCTS[i] + '</small>' + (i < PHASES.length - 1 ? '<svg class="ms-frame-arrow" viewBox="0 0 20 14" aria-hidden="true" focusable="false"><path d="M2 7h15m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + '</button>').join('') + '</nav></div>'
      + '<div class="ms-playback"><button type="button" class="ms-play" data-ms-play>播放旅程</button><label class="ms-seek">回放时刻 <output data-ms-time-label>120 s</output><input type="range" data-ms-seek min="0" max="' + model.endTime_s + '" step="1" value="120" aria-label="回放时刻，秒"></label><button type="button" data-ms-reset>复位</button><label>泵送情景<select data-ms-scenario aria-label="泵送情景"><option value="normal">持续泵送</option><option value="pause">300–480 s停泵后恢复</option></select></label></div>'
      + '<p class="ms-play-note">“暂停回放”只暂停观看。选择停泵情景，才会使井场排量Q＝0：时间继续走，运移进度保持不变。</p>'
      + '<div class="ms-metrics" data-ms-metrics></div><figure class="ms-time-figure"><div class="ms-time-scroll" data-ms-time-chart tabindex="0" aria-label="井底与地面时间图，可横向滚动">' + timeChart(model, state) + '</div><figcaption data-ms-time-caption></figcaption></figure>'
      + '<div class="ms-case-head"><h3>五个对象，接到五个案例</h3><p>点“定位”聚焦设备，点案例入口继续观察与计算。</p></div><div class="ms-cases">' + OBJECTS.map((o, i) => '<article class="ms-case" data-ms-case="' + o.id + '"><button type="button" data-ms-object="' + o.id + '" aria-pressed="' + (o.id === 'm2') + '"><span>' + o.id.toUpperCase() + ' · 定位</span><b>' + o.short + '</b><small>' + o.place + '</small></button><a href="' + esc(courseHref(o.id)) + '">进入' + o.short + '案例 <span aria-hidden="true">↗</span></a></article>').join('') + '</div>'
      + '<details class="ms-boundary"><summary>这个模型计算了什么？</summary><p>教学假设：来源时刻120 s，有效运移体积12 m³，正常排量0.025 m³/s；停泵情景只把300–480 s的排量置0。程序沿用m2的累计泵量与来源／到达反查函数。筛分45 s、观察90 s、整理60 s是为了分镜阅读设定的演示时长，不是现场设备测得的延迟。</p><p>上返标记代表理想随流体运移的信息包。真实岩屑有滑移，气体可能混合且输气支路有额外延迟，不能把这幅示意直接用于地层定位。检测阶段，岩屑走白光／UV观察，气体独立检测；记录阶段方块代表资料，岩屑仍留在观察台。几何尺寸与地层配色均为自行编写的教学示意，没有使用实测井轨迹或物性。</p><p>专业背景沿用<a href="https://www.slb.com/resource-library/oilfield-review/defining-series/defining-mud-logging" target="_blank" rel="noopener">SLB录井介绍</a>；具体计算可继续进入<a href="' + esc(courseHref('m2')) + '">气测与迟到案例</a>。三维引擎<a href="assets/vendor/THREE-LICENSE.txt" target="_blank" rel="noopener">Three.js r180 · MIT许可</a>。</p></details>'
      + '<p class="ms-sr" data-ms-announcement aria-live="polite"></p></section>';
  }

  function create(main, options = {}) {
    const model = createTransport(g.M2Core, 'normal'), initial = model.at(CONFIG.sourceTime_s);
    const template = document.createElement('template'); template.innerHTML = markup(model, initial);
    const host = template.content.firstElementChild;
    const pageHead = main.querySelector('.page-head');
    if (pageHead) pageHead.after(host); else main.prepend(host);
    const $ = selector => host.querySelector(selector);
    const state = { model, time: CONFIG.sourceTime_s, selected: 'm2', focusObject: null, camera: 'overview', follow: true,
      requestedPlaying: options.autoPlay === false ? false : !reduce.matches, visible: false, near: false,
      mode: options.force2D ? '2d' : '3d', rendererStatus: options.force2D ? '2d' : 'waiting', fallbackReason: null,
      disposed: false, scene: null, raf: 0, lastFrame: 0, lastUI: 0, reducedMotion: reduce.matches, lastPhase: initial.phaseIndex };
    const cleanups = [];
    totals.mounts++;
    function listen(target, name, callback, opts) { target.addEventListener(name, callback, opts); cleanups.push(() => target.removeEventListener(name, callback, opts)); }
    function snapshot() {
      const transport = state.model.at(state.time);
      return { mounted: !state.disposed, ...transport, transport: { ...transport, route: sampleRoute(transport) }, route: sampleRoute(transport), selectedObject: state.selected, focusObject: state.focusObject, camera: state.camera,
        followCamera: state.follow, requestedPlaying: state.requestedPlaying,
        playing: state.requestedPlaying && state.visible && !document.hidden && !transport.complete,
        inViewport: state.visible, nearViewport: state.near, documentHidden: document.hidden, reducedMotion: state.reducedMotion,
        view: state.mode, rendererStatus: state.rendererStatus, fallbackReason: state.fallbackReason, rafScheduled: !!state.raf,
        scene: state.scene ? state.scene.snapshot() : null, lifecycle: { ...totals, liveComponents: state.disposed ? 0 : 1, liveScenes: state.scene ? 1 : 0 } };
    }
    function say(message) { $('[data-ms-announcement]').textContent = message; }
    function paint(force = false) {
      if (state.disposed) return;
      const value = state.model.at(state.time), phase = PHASES[value.phaseIndex], object = OBJECTS.find(o => o.id === state.selected);
      $('[data-ms-seek]').max = state.model.endTime_s; $('[data-ms-seek]').value = value.time_s;
      $('[data-ms-time-label]').textContent = fmt(value.time_s, 0) + ' s';
      $('[data-ms-play]').textContent = state.requestedPlaying ? '暂停回放' : value.complete ? '重新播放' : '播放旅程';
      $('[data-ms-follow]').checked = state.follow; $('[data-ms-scenario]').value = state.model.mode;
      host.querySelectorAll('[data-ms-phase]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.msPhase) === value.phaseIndex)));
      host.querySelectorAll('[data-ms-camera]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.msCamera === state.camera)));
      host.querySelectorAll('[data-ms-object]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.msObject === state.selected)));
      $('[data-ms-phase-index]').textContent = '0' + (value.phaseIndex + 1) + ' / 05'; $('[data-ms-phase-title]').textContent = phase.name;
      $('[data-ms-phase-lead]').textContent = value.materialStopped ? '井场正在停泵，样品停在环空，时钟仍在向前。' : phase.lead;
      $('[data-ms-phase-detail]').textContent = phase.detail;
      $('[data-ms-object-title]').textContent = object.short + ' · ' + object.place; $('[data-ms-object-copy]').textContent = object.copy;
      $('[data-ms-object-link]').href = courseHref(object.id); $('[data-ms-object-link]').textContent = '进入' + object.short + '案例 →';
      $('[data-ms-metrics]').innerHTML = [
        ['当前排量 Q', fmt(value.flow_m3_s, 3) + ' m³/s', value.pumpStopped ? '井场停泵；累计体积不增加' : '0.025 m³/s＝25 L/s'],
        ['这份观察的上返进度', fmt(value.transportedVolume_m3, 2) + ' / 12 m³', fmt(value.transportProgress * 100, 1) + '%，位置按此进度映射'],
        ['井底来源时刻', '120 s', fmt(value.sourceDepthMD_m, 2) + ' m MD · 教学来源位置'],
        ['地面到达时刻', fmt(value.arrivalTime_s, 0) + ' s', '与来源相差' + fmt(value.lag_s, 0) + ' s']
      ].map(([name, result, detail]) => '<div><span>' + name + '</span><b>' + result + '</b><small>' + detail + '</small></div>').join('');
      $('[data-ms-time-chart]').innerHTML = timeChart(state.model, value);
      $('[data-ms-time-caption]').textContent = '来源时刻已累计泵送3 m³；再推进12 m³后抵达地面。' + (state.model.mode === 'pause' ? '停泵平台使到达从600 s推迟至780 s，增加的180 s恰为本情景停泵时长。' : '连续泵送：12÷0.025＝480 s，上返迟到不是到达时刻600 s本身。') + '两条时间轴都保留同一份观察的身份。';
      const use3D = state.mode === '3d' && state.rendererStatus === 'ready';
      $('[data-ms-canvas]').hidden = !use3D; $('[data-ms-diagram]').hidden = use3D;
      if (!use3D || force) $('[data-ms-diagram]').innerHTML = diagram(value, state.selected);
      const unavailable3D = ['webgl-unavailable', 'webgl-context-lost', 'intersection-observer-unavailable'].includes(state.fallbackReason);
      $('[data-ms-view]').dataset.msView = state.mode === '3d' ? '2d' : '3d';
      $('[data-ms-view]').disabled = unavailable3D;
      $('[data-ms-view]').textContent = unavailable3D ? '二维剖面 · 当前可用' : state.mode === '3d' ? '使用二维剖面' : '使用三维视图';
      $('[data-ms-view-help]').textContent = use3D ? '拖动旋转，滚轮或双指缩放；点设备聚焦。键盘方向键旋转，＋／－缩放，Home回全景。' : state.rendererStatus === 'loading' ? '正在准备三维场景；二维剖面和时间计算可继续使用。' : state.fallbackReason ? '当前使用二维剖面，五阶段、时间轴和泵量计算保持可用。' : '二维剖面与三维视图使用同一份运移计算；金色圆点代表教学样品。';
      host.dataset.msTime = fmt(value.time_s, 3); host.dataset.msPhase = value.phase; host.dataset.msScenario = value.mode;
      host.dataset.msFlow = String(value.flow_m3_s); host.dataset.msTransportProgress = fmt(value.transportProgress, 8);
      host.dataset.msRenderer = state.rendererStatus; host.dataset.msVisible = String(state.visible);
      host.dataset.msPlaying = String(state.requestedPlaying && state.visible && !document.hidden && !value.complete);
      host.dataset.msState = JSON.stringify(snapshot());
      if (state.scene) state.scene.update(value);
    }
    function stopFrame() { if (state.raf) g.cancelAnimationFrame(state.raf); state.raf = 0; state.lastFrame = 0; host.dataset.msRaf = 'false'; }
    function schedule() {
      if (state.disposed || !state.visible || document.hidden || state.raf) return;
      state.raf = g.requestAnimationFrame(frame); host.dataset.msRaf = 'true';
    }
    function frame(timestamp) {
      state.raf = 0; host.dataset.msRaf = 'false';
      if (state.disposed || !state.visible || document.hidden) return;
      const dt = state.lastFrame ? Math.min(.08, (timestamp - state.lastFrame) / 1000) : 0; state.lastFrame = timestamp;
      if (state.requestedPlaying) {
        state.time = Math.min(state.model.endTime_s, state.time + dt * 24);
        const value = state.model.at(state.time);
        if (value.phaseIndex !== state.lastPhase) {
          state.lastPhase = value.phaseIndex;
          if (state.follow) setCamera(PHASES[value.phaseIndex].camera, false);
        }
        if (value.complete) state.requestedPlaying = false;
      }
      const value = state.model.at(state.time);
      let moving = false;
      if (state.scene && state.mode === '3d') { state.scene.update(value); moving = state.scene.frame(dt); }
      if (timestamp - state.lastUI > 110 || !state.requestedPlaying) { state.lastUI = timestamp; paint(); }
      if (state.requestedPlaying || moving) schedule(); else state.lastFrame = 0;
    }
    function setCamera(id, manual = true) {
      if (!['overview', 'return', 'surface', 'interpret'].includes(id)) return;
      state.camera = id; state.focusObject = null; if (manual) state.follow = false;
      if (state.scene) state.scene.setCamera(id, { immediate: state.reducedMotion });
      if (manual && !state.visible) $('[data-ms-viewport]').scrollIntoView({ block: 'center', behavior: state.reducedMotion ? 'auto' : 'smooth' });
      paint(); schedule(); return snapshot();
    }
    function selectObject(id) {
      const object = OBJECTS.find(o => o.id === id); if (!object) return;
      state.selected = id; state.focusObject = id; state.camera = object.camera; state.follow = false;
      if (state.scene) state.scene.selectObject(id, { focus: true, immediate: state.reducedMotion });
      if (!state.visible) $('[data-ms-viewport]').scrollIntoView({ block: 'center', behavior: state.reducedMotion ? 'auto' : 'smooth' });
      paint(true); schedule(); say('已定位' + object.place + '，可继续进入' + object.short + '案例。'); return snapshot();
    }
    function seek(time) {
      const number = Number(time); if (!Number.isFinite(number)) return snapshot();
      state.time = Math.max(0, Math.min(state.model.endTime_s, number)); state.requestedPlaying = false;
      state.lastPhase = state.model.at(state.time).phaseIndex;
      if (state.follow) setCamera(PHASES[state.lastPhase].camera, false);
      paint(true); schedule(); return snapshot();
    }
    function setScenario(mode) {
      state.model = createTransport(g.M2Core, mode); state.time = Math.min(state.time, state.model.endTime_s);
      state.requestedPlaying = false; state.lastFrame = 0; state.lastPhase = state.model.at(state.time).phaseIndex;
      paint(true); schedule(); say(mode === 'pause' ? '已选择300至480秒停泵后恢复情景，到达时刻780秒。' : '已选择持续泵送情景，到达时刻600秒。'); return snapshot();
    }
    function releaseScene() {
      if (!state.scene) return;
      const scene = state.scene; state.scene = null; scene.dispose(); totals.scenesDisposed++; totals.lastDisposedScene = scene.snapshot();
    }
    function fallback(reason) {
      releaseScene(); state.mode = '2d'; state.rendererStatus = 'fallback'; state.fallbackReason = reason;
      paint(true); schedule();
    }
    async function ensure3D() {
      // No eager fetch: only an IntersectionObserver near-viewport signal may enter this branch.
      if (state.disposed || !state.near || state.mode !== '3d' || state.scene || state.rendererStatus === 'loading') return;
      if (state.fallbackReason === 'webgl-unavailable' || state.fallbackReason === 'webgl-context-lost') return;
      state.rendererStatus = 'loading'; paint();
      try {
        const module = await requestBundle();
        if (state.disposed) return;
        if (!state.visible || state.mode !== '3d') { state.rendererStatus = 'loaded'; paint(); return; }
        $('[data-ms-canvas]').hidden = false;
        state.scene = module.create($('[data-ms-canvas]'), {
          reducedMotion: state.reducedMotion, onSelect: selectObject,
          onOrbit: () => { state.follow = false; state.focusObject = null; $('[data-ms-follow]').checked = false; if (state.scene) state.camera = state.scene.snapshot().camera; host.querySelectorAll('[data-ms-camera]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.msCamera === state.camera))); },
          requestFrame: schedule, onContextLost: () => fallback('webgl-context-lost')
        });
        totals.scenesCreated++; state.rendererStatus = 'ready'; state.fallbackReason = null;
        state.scene.setActive(state.visible && !document.hidden); state.scene.setCamera(state.camera, { immediate: true });
        state.scene.selectObject(state.selected, { focus: state.focusObject === state.selected, immediate: true });
        paint(true); schedule();
      } catch (error) { if (!state.disposed) fallback(error && error.code === 'WEBGL_UNAVAILABLE' ? 'webgl-unavailable' : 'bundle-unavailable'); }
    }
    function setView(view) {
      state.mode = view === '2d' ? '2d' : '3d';
      if (state.scene) state.scene.setActive(state.mode === '3d' && state.visible && !document.hidden);
      paint(true); if (state.mode === '3d') ensure3D(); schedule(); return snapshot();
    }
    function reset() {
      state.model = createTransport(g.M2Core, 'normal'); state.time = CONFIG.sourceTime_s; state.requestedPlaying = false;
      state.selected = 'm2'; state.focusObject = null; state.follow = true; state.lastPhase = 1; state.lastFrame = 0;
      state.camera = 'overview';
      if (state.scene) { state.scene.setCamera('overview', { immediate: state.reducedMotion }); state.scene.selectObject('m2', { focus: false, immediate: state.reducedMotion }); }
      paint(true); schedule(); say('已复位：来源120秒，持续泵送，到达600秒。'); return snapshot();
    }
    function play() { if (state.time >= state.model.endTime_s) state.time = 0; state.requestedPlaying = true; state.lastFrame = 0; paint(); schedule(); return snapshot(); }
    function pause() { state.requestedPlaying = false; state.lastFrame = 0; paint(); return snapshot(); }
    listen(host, 'click', event => {
      const button = event.target.closest('button');
      if (button && host.contains(button)) {
        if (button.hasAttribute('data-ms-camera')) setCamera(button.dataset.msCamera);
        else if (button.hasAttribute('data-ms-object')) selectObject(button.dataset.msObject);
        else if (button.hasAttribute('data-ms-phase')) seek(state.model.phaseTime(Number(button.dataset.msPhase)));
        else if (button.hasAttribute('data-ms-reset')) reset();
        else if (button.hasAttribute('data-ms-play')) state.requestedPlaying ? pause() : play();
        else if (button.hasAttribute('data-ms-view')) setView(button.dataset.msView);
      } else {
        const diagramObject = event.target.closest('[data-ms-diagram-object]'); if (diagramObject) selectObject(diagramObject.dataset.msDiagramObject);
      }
    });
    listen($('[data-ms-seek]'), 'input', event => seek(event.target.value));
    listen($('[data-ms-scenario]'), 'change', event => setScenario(event.target.value));
    listen($('[data-ms-follow]'), 'change', event => { state.follow = event.target.checked; if (state.follow) setCamera(PHASES[state.model.at(state.time).phaseIndex].camera, false); paint(); });
    listen(document, 'visibilitychange', () => {
      const allowed = state.visible && !document.hidden && state.mode === '3d';
      if (state.scene) state.scene.setActive(allowed);
      if (document.hidden) stopFrame(); else { state.lastFrame = 0; schedule(); }
      paint();
    });
    if (reduce.addEventListener) listen(reduce, 'change', event => {
      state.reducedMotion = event.matches;
      if (event.matches) pause();
      if (state.scene) state.scene.setReducedMotion(event.matches);
      paint();
    });
    if (g.IntersectionObserver) {
      const viewport = $('[data-ms-viewport]');
      const nearObserver = new g.IntersectionObserver(entries => {
        if (state.disposed) return;
        for (const entry of entries) if (entry.isIntersecting) { state.near = true; ensure3D(); nearObserver.disconnect(); }
      }, { rootMargin: '240px 0px', threshold: 0 });
      const visibleObserver = new g.IntersectionObserver(entries => {
        if (state.disposed) return;
        for (const entry of entries) {
          state.visible = entry.isIntersecting && entry.intersectionRatio > 0;
          if (state.scene) state.scene.setActive(state.visible && !document.hidden && state.mode === '3d');
          if (state.visible) { state.lastFrame = 0; ensure3D(); schedule(); } else stopFrame();
          paint();
        }
      }, { threshold: [0, .01] });
      nearObserver.observe(viewport); visibleObserver.observe(viewport);
      cleanups.push(() => nearObserver.disconnect(), () => visibleObserver.disconnect());
    } else {
      state.rendererStatus = 'fallback'; state.fallbackReason = 'intersection-observer-unavailable'; state.requestedPlaying = false;
    }
    paint(true);
    return { host, main, snapshot, seek, setScenario, setCamera, selectObject, play, pause, reset, setView,
      dispose() {
        if (state.disposed) return;
        state.disposed = true; stopFrame(); cleanups.splice(0).forEach(cleanup => cleanup()); releaseScene();
        totals.disposals++; host.remove();
      } };
  }

  function disposeCurrent() { if (active) { const old = active; active = null; old.dispose(); } }
  function reconcile() {
    reconcileQueued = false;
    if (!onRoute()) { disposeCurrent(); return; }
    if (active && !active.host.isConnected) disposeCurrent();
    if (active || manuallyDisposed) return;
    const main = document.querySelector('#view main') || document.querySelector('main');
    if (main) active = create(main);
  }
  function queueReconcile() { if (reconcileQueued) return; reconcileQueued = true; Promise.resolve().then(reconcile); }
  function install() {
    const view = document.getElementById('view') || document.body;
    observer = new g.MutationObserver(records => {
      if (active && active.host.isConnected && records.every(record => active.host.contains(record.target))) return;
      queueReconcile();
    });
    observer.observe(view, { childList: true, subtree: true });
    g.addEventListener('hashchange', () => { manuallyDisposed = false; queueReconcile(); });
    queueReconcile();
  }
  g.S17MudStage = {
    version: '1.0.0',
    mount(root = document, options = {}) {
      if (!onRoute()) return null;
      manuallyDisposed = false;
      if (active && !active.host.isConnected) disposeCurrent();
      if (active) return active;
      const main = root.matches && root.matches('main') ? root : root.querySelector('main');
      if (!main) return null;
      active = create(main, options); return active;
    },
    dispose() { manuallyDisposed = true; disposeCurrent(); },
    snapshot() { return active ? active.snapshot() : { mounted: false, lifecycle: { ...totals, liveComponents: 0, liveScenes: 0 } }; },
    seek(time) { return active && active.seek(time); }, setScenario(mode) { return active && active.setScenario(mode); },
    setCamera(id) { return active && active.setCamera(id); }, selectObject(id) { return active && active.selectObject(id); },
    setView(view) { return active && active.setView(view); }, play() { return active && active.play(); }, pause() { return active && active.pause(); }, reset() { return active && active.reset(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})(window);
