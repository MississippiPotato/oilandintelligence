/* Enhanced-portal lazy wrapper. Original teacher sources remain unchanged. */
(function(g){"use strict";var definition=null,K=g.K,Cases={register:function(value){definition=value;return value;}};try{
/* =========================================================
   案例 01 · 测井曲线智能分层
   ---------------------------------------------------------
   这是一个"案例插件"的完整示例：
   · 只依赖 Cases 注册表与 K 工具箱，不引用任何外壳内部变量
   · 三块内容（background / workflow / demo）都是可替换的
   · 删掉这个文件 + index.html 里对应的一行 script，系统照常运行，
     只是 w1 场景会回到"待接入"状态
   ========================================================= */

(function () {

  var esc = K.esc;

  /* =========================================================
     插图：用 JS 生成，避免手写几百行 path
     ========================================================= */

  /* 一条带噪声的阶梯曲线，模拟测井响应 */
  function grPolyline(xL, xW, yT, yH, layers, seed) {
    var rnd = seed || 1;
    function r() { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; }
    var pts = [];
    var n = 260;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var y = yT + t * yH;
      // 找到当前所在层
      var acc = 0, v = layers[0].v;
      for (var j = 0; j < layers.length; j++) {
        if (t >= layers[j].from) v = layers[j].v;
      }
      // 层内缓变 + 噪声
      var local = (r() - 0.5) * 0.055;
      pts.push((xL + (v + local) * xW).toFixed(1) + ',' + y.toFixed(1));
    }
    return pts.join(' ');
  }

  function figManual() {
    var xL = 118, xW = 210, yT = 30, yH = 230;
    var layers = [
      { from: 0, v: 0.52 },
      { from: 0.26, v: 0.20 },
      { from: 0.46, v: 0.66 },
      { from: 0.62, v: 0.36 },
      { from: 0.70, v: 0.58 },
      { from: 0.90, v: 0.30 }
    ];
    var s = '';
    s += '<svg viewBox="0 0 620 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="人工卡层误差示意">';

    // 深度刻度
    for (var d = 0; d <= 100; d += 20) {
      var y = yT + d / 100 * yH;
      s += '<line x1="96" y1="' + y + '" x2="' + (xL + xW + 6) + '" y2="' + y + '" stroke="#e9e4d8" stroke-width="1" stroke-dasharray="2 4"/>';
      s += '<text x="88" y="' + (y + 3.5) + '" text-anchor="end" font-size="9" font-family="monospace" fill="#9ba3a9">' + (1000 + d * 3) + '</text>';
    }

    // 真实界面
    var truth = [26, 46, 62, 70, 90];
    truth.forEach(function (p) {
      var y = yT + p / 100 * yH;
      s += '<line x1="' + xL + '" y1="' + y + '" x2="' + (xL + xW + 30) + '" y2="' + y + '" stroke="#2f7d6b" stroke-width="1.4" stroke-dasharray="5 3"/>';
    });

    // 曲线
    s += '<polyline points="' + grPolyline(xL, xW, yT, yH, layers, 7) + '" fill="none" stroke="#31393d" stroke-width="1.3" stroke-linejoin="round"/>';
    s += '<line x1="' + (xL + xW + 2) + '" y1="' + yT + '" x2="' + (xL + xW + 2) + '" y2="' + (yT + yH) + '" stroke="#c9c2b0" stroke-width="1"/>';

    // 人工界面（橙色，偏移）
    var manual = [30, 49, 62, 90];
    manual.forEach(function (p, i) {
      var y = yT + p / 100 * yH;
      s += '<line x1="' + (xL - 12) + '" y1="' + y + '" x2="' + (xL + xW + 18) + '" y2="' + y + '" stroke="#b26a39" stroke-width="1.6"/>';
      s += '<circle cx="' + (xL - 12) + '" cy="' + y + '" r="2.6" fill="#b26a39"/>';
    });

    // 薄层（真实存在，人工漏卡）
    var yb1 = yT + 0.70 * yH, yb2 = yT + 0.745 * yH;
    s += '<rect x="' + xL + '" y="' + yb1 + '" width="' + (xW + 4) + '" height="' + (yb2 - yb1) + '" fill="#f2d98a" opacity=".5" rx="2"/>';
    s += '<line x1="' + (xL + xW + 34) + '" y1="' + ((yb1 + yb2) / 2) + '" x2="' + (xL + xW + 62) + '" y2="' + ((yb1 + yb2) / 2) + '" stroke="#b26a39" stroke-width="1"/>';
    s += '<text x="' + (xL + xW + 66) + '" y="' + ((yb1 + yb2) / 2 + 3.5) + '" font-size="10" fill="#b26a39">0.8 m 薄层 · 漏卡</text>';

    // 标注
    s += '<text x="' + (xL + xW + 30) + '" y="' + (yT + 0.26 * yH - 7) + '" font-size="9.5" fill="#2f7d6b">真实界面</text>';
    s += '<text x="' + (xL - 14) + '" y="' + (yT + 0.30 * yH - 7) + '" font-size="9.5" fill="#b26a39" text-anchor="end">人工卡层</text>';

    // 偏差标注
    var y1 = yT + 0.26 * yH, y2 = yT + 0.30 * yH;
    s += '<line x1="' + (xL + xW - 20) + '" y1="' + y1 + '" x2="' + (xL + xW - 20) + '" y2="' + y2 + '" stroke="#b26a39" stroke-width="1"/>';
    s += '<line x1="' + (xL + xW - 24) + '" y1="' + y1 + '" x2="' + (xL + xW - 16) + '" y2="' + y1 + '" stroke="#b26a39" stroke-width="1"/>';
    s += '<line x1="' + (xL + xW - 24) + '" y1="' + y2 + '" x2="' + (xL + xW - 16) + '" y2="' + y2 + '" stroke="#b26a39" stroke-width="1"/>';
    s += '<text x="' + (xL + xW + 62) + '" y="' + ((y1 + y2) / 2 + 3) + '" font-size="9.5" fill="#b26a39">偏移 1.2 m</text>';

    s += '<text x="' + xL + '" y="16" font-size="9.5" font-family="monospace" fill="#9ba3a9" letter-spacing="1">GR (API)</text>';
    s += '<text x="' + (xL + xW + 2) + '" y="' + (yT + yH + 18) + '" text-anchor="end" font-size="9.5" font-family="monospace" fill="#9ba3a9">深度 / m</text>';
    s += '</svg>';
    return s;
  }

  function figAI() {
    var steps = [
      ['原始曲线', '多井 GR / SP / RT', '#e6f1ec', '#2f7d6b'],
      ['滑窗特征', '均值差 · 方差比 · 斜率', '#e7eef9', '#41699b'],
      ['最优分段', '动态规划 + 惩罚项', '#efe9f4', '#7e5a8d'],
      ['规则后处理', '最小层厚 · 层序一致', '#f8ecdf', '#b26a39'],
      ['候选界面', '人工只做确认', '#f1f1dd', '#767a2e']
    ];
    var s = '<svg viewBox="0 0 620 132" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI 介入点流程">';
    var w = 108, gap = 17, x = 8, y = 26;
    steps.forEach(function (st, i) {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="72" rx="8" fill="' + st[2] + '" stroke="' + st[3] + '" stroke-opacity=".28"/>';
      s += '<rect x="' + x + '" y="' + y + '" width="3" height="72" rx="1.5" fill="' + st[3] + '"/>';
      s += '<text x="' + (x + 13) + '" y="' + (y + 23) + '" font-size="11.5" font-weight="600" fill="#242b2e">' + st[0] + '</text>';
      st[1].split(' · ').forEach(function (line, k) {
        s += '<text x="' + (x + 13) + '" y="' + (y + 43 + k * 14) + '" font-size="9" fill="#5d666d">' + line + '</text>';
      });
      s += '<text x="' + (x + w - 11) + '" y="' + (y + 66) + '" text-anchor="end" font-size="8.5" font-family="monospace" fill="' + st[3] + '">0' + (i + 1) + '</text>';
      if (i < steps.length - 1) {
        s += '<path d="M' + (x + w + 3) + ' ' + (y + 36) + 'h9m-3.5-3.4 3.6 3.4-3.6 3.4" stroke="#c9c2b0" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
      }
      x += w + gap;
    });
    // 人工边界说明
    s += '<text x="8" y="16" font-size="9.5" font-family="monospace" fill="#9ba3a9" letter-spacing="1">ALGORITHM</text>';
    s += '<text x="' + (8 + w + gap * 3) + '" y="16" font-size="9.5" font-family="monospace" fill="#b26a39" letter-spacing="1">HUMAN CORE</text>';
    s += '<line x1="8" y1="112" x2="' + (8 + w + gap * 2 + w) + '" y2="112" stroke="#2f7d6b" stroke-width="1.4"/>';
    s += '<text x="' + (8 + w + gap * 2 + w / 2) + '" y="126" text-anchor="middle" font-size="9.5" fill="#2f7d6b">算法负责把上千米曲线压缩成几十个候选</text>';
    s += '<line x1="' + (8 + w + gap * 3) + '" y1="112" x2="' + (8 + w * 5 + gap * 4) + '" y2="112" stroke="#b26a39" stroke-width="1.4"/>';
    s += '<text x="' + (8 + w * 4 + gap * 3.5) + '" y="126" text-anchor="middle" font-size="9.5" fill="#b26a39">人负责地质合理性</text>';
    s += '</svg>';
    return s;
  }

  function figTolerance() {
    var s = '<svg viewBox="0 0 620 186" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="容差匹配示意">';
    var cols = [
      { x: 8, tag: 'TP · 命中', color: '#2f7d6b', bg: '#e6f1ec', det: 0.62, truth: 0.60, note: '落在 ±1 m 内' },
      { x: 214, tag: 'FP · 多检', color: '#b26a39', bg: '#f8ecdf', det: 0.30, truth: 0.68, note: '容差内没有真界面' },
      { x: 420, tag: 'FN · 漏检', color: '#b05a51', bg: '#f9e9e5', det: null, truth: 0.44, note: '真界面没被检出' }
    ];
    cols.forEach(function (c) {
      var w = 192, yT = 34, yH = 108;
      s += '<rect x="' + c.x + '" y="10" width="' + w + '" height="' + (yH + 42) + '" rx="9" fill="#fdfcf9" stroke="#e9e4d8"/>';
      s += '<text x="' + (c.x + 12) + '" y="26" font-size="9.5" font-family="monospace" fill="' + c.color + '" letter-spacing=".8">' + c.tag + '</text>';

      // 曲线轴
      var ax = c.x + 26, aw = w - 52;
      s += '<line x1="' + ax + '" y1="' + yT + '" x2="' + ax + '" y2="' + (yT + yH) + '" stroke="#ddd7c8"/>';
      s += '<line x1="' + (ax + aw) + '" y1="' + yT + '" x2="' + (ax + aw) + '" y2="' + (yT + yH) + '" stroke="#ddd7c8"/>';

      // 容差带
      var ty = yT + c.truth * yH;
      s += '<rect x="' + ax + '" y="' + (ty - 11) + '" width="' + aw + '" height="22" fill="' + c.bg + '"/>';
      s += '<line x1="' + ax + '" y1="' + ty + '" x2="' + (ax + aw) + '" y2="' + ty + '" stroke="#2f7d6b" stroke-width="1.2" stroke-dasharray="4 3"/>';
      s += '<text x="' + (ax + aw + 4) + '" y="' + (ty + 3.5) + '" font-size="8" font-family="monospace" fill="#2f7d6b">真</text>';

      // 检测线
      if (c.det !== null) {
        var dy = yT + c.det * yH;
        s += '<line x1="' + ax + '" y1="' + dy + '" x2="' + (ax + aw) + '" y2="' + dy + '" stroke="' + c.color + '" stroke-width="2"/>';
        s += '<circle cx="' + ax + '" cy="' + dy + '" r="3" fill="' + c.color + '"/>';
        s += '<text x="' + (ax + aw + 4) + '" y="' + (dy + 3.5) + '" font-size="8" font-family="monospace" fill="' + c.color + '">测</text>';
        if (c.det !== c.truth) {
          s += '<line x1="' + (ax + 14) + '" y1="' + ty + '" x2="' + (ax + 14) + '" y2="' + dy + '" stroke="#c9c2b0" stroke-width="1" stroke-dasharray="2 2"/>';
        }
      }
      s += '<text x="' + (c.x + 12) + '" y="' + (yT + yH + 26) + '" font-size="9.5" fill="#79828a">' + c.note + '</text>';
    });
    s += '</svg>';
    return s;
  }

  /* =========================================================
     注册
     ========================================================= */
  Cases.register({
    id: 'welllog-layer',
    sceneId: 'w1',
    title: '测井曲线智能分层',
    status: 'ready',
    version: '1.0.0',
    updated: '2026-10-22',

    tabs: {

      /* ---------- ① 专业背景 ---------- */
      background: {
        label: '专业背景',

        judge: [
          { label: '任务类型', value: '序列分割 / 变点检测', desc: '不是逐点分类，而是找"位置"', html: '<span style="color:var(--c-ts)">序列分割</span>' },
          { label: '数据门槛', value: '30—50 口井', desc: '需要人工分层表作标签' },
          { label: '收益', value: '3.5 h → 15 min', desc: '单井卡层工时（仅复核）', html: '<b style="color:var(--jade-d);font-family:var(--mono)">3.5h → 15min</b>' },
          { label: '难度', value: '中', desc: '标签粒度不一致是主要障碍', html: K.dtag('中') }
        ],

        lede: '测井曲线是井筒内连续测量的岩石物理响应。分层（卡层）是把一条连续曲线切成地质单元的第一步 —— 后面的储层解释、射孔选段、压裂分段，全都以这套界面为底图。所以它错一点，下游全都要返工。',

        sections: [
          {
            no: 1, en: 'PROBLEM', title: '当前做法与问题',
            html: '<p>一口井常规三四条曲线、上千米井段。解释员要对照邻井逐段卡层，单井 2—4 小时。<b>薄互层段界线模糊</b>，不同人卡的位置能差 0.5—1 m，而这 1 m 直接决定射孔段和压裂分段的位置。</p>' +
              '<p>更麻烦的是「对错」本身就没有唯一答案：同一口井，两位解释员交上来的层数可能相差两层。这决定了后面所有的评测方式 —— <b>不能用"逐点准确率"，只能用"界面是否落在容差内"</b>。</p>' +
              K.figure(figManual(), 1, '同一段曲线的三种典型误差：界面系统性偏移（左上）、薄层漏卡（右下）、以及不同解释员之间不重合的判定区间。这些是"人工目视 + 经验"的固有代价，也是算法要替代的部分。')
          },
          {
            no: 2, en: 'INTERVENTION', title: 'AI 能做什么',
            html: '<p>把分层建模成<b>曲线序列上的变点检测</b>：先算滑窗统计特征（均值差、方差比、斜率），再用最优分段或 1D 分割网络给出候选界面，最后用地质规则过滤。</p>' +
              '<p>注意这里替换的是<b>工序中的一步</b>，不是整个岗位。算法负责把上千米曲线压缩成几十个候选界面，解释员仍然负责地质合理性判断 —— 既有提速，也保留了责任边界。</p>' +
              K.figure(figAI(), 2, '从原始曲线到分层表的五步。真正决定效果的不是网络有多深，而是第 4 步的规则：**最小层厚**与**邻井层序一致性**能把大量"数学上成立、地质上荒谬"的界面直接过滤掉。')
          },
          {
            no: 3, en: 'DATA', title: '你需要准备什么',
            html: '<p style="margin-bottom:14px">立项前先对着这张清单打勾。<b>勾不满不代表不能做</b>，但每一项空缺都会在后期变成返工。清单可点击，勾选状态只在本页有效。</p>' +
              K.checklist([
                ['常规测井曲线', 'GR / SP / RT / DEN，0.125 m 采样，单井 5000—20000 点', '30—50 口井的人工分层表'],
                ['邻井分层与岩性', '同区块 20 口以上', '作为一致性约束'],
                ['地质分层方案', '油田统一的分层标准', '定义层序与命名'],
                ['井位与构造图', '区块级', '判断层序是否可信'],
                ['历史解释成果', '已有解释报告', '用于交叉验证']
              ]) +
              '<p style="margin-top:18px"><span class="kicker plain" style="color:var(--ink-4)">可参考的公开数据集</span></p>' +
              K.refs(['FORCE 2020 岩性竞赛数据（井曲线 + 岩性标签）', 'Kansas Geological Survey 公开测井库'], null)
          },
          {
            no: 4, en: 'DIFFICULTY', title: '技术难度与参考方向',
            html: '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:2px">' +
              K.dtag('中') + '<span class="small muted">单井数据易得、任务定义清晰；难点在标签粒度不一致与薄层漏检。</span></div>' +
              K.meter('中') +
              '<p>难度按三档标注：<b>低</b> = 数据现成、任务边界清晰、错了代价小；<b>中</b> = 需要一个月量级的标注与清洗，效果依赖后处理规则；<b>高</b> = 标签稀缺或安全约束硬，通常要先做小范围可行性验证再立项。</p>' +
              '<p style="margin-top:18px"><span class="kicker plain" style="color:var(--ink-4)">可借鉴的通用技术</span></p>' +
              K.refs(['变点检测', '序列分割', '1D 卷积网络', '地质规则后处理'], '#/method/ts') +
              '<p style="margin-top:18px" class="small muted">交叉环节：<a href="#/stage/mudlog" style="color:var(--jade-d);font-weight:600">录井</a> · <a href="#/stage/geophys" style="color:var(--jade-d);font-weight:600">物探</a></p>'
          }
        ]
      },

      /* ---------- ② 案例流程 ---------- */
      workflow: {
        label: '案例流程',
        title: '案例：A 区块 42 口井的自动卡层',
        lead: [
          'A 区块有 42 口开发井，常规曲线齐全，解释组按油田统一分层方案手工卡出 8 个标志层界面。目标不是"做出一个模型"，而是**把单井卡层工时从 3.5 小时压到 15 分钟（仅复核）**，同时把界面偏差控制在 0.5 m 以内。',
          '下面五步是这个案例的真实流程。注意第 2 步和第 4 步：它们不涉及任何模型，却决定了最终能不能用。'
        ],
        stats: [
          ['样本井', '42', true], ['单井采样点', '8000', true],
          ['标志层', '8', true], ['界面目标偏差', '≤0.5 m'],
          ['人工工时', '3.5 h / 井'], ['辅助后工时', '15 min / 井']
        ],
        steps: [
          {
            name: '数据准备与对齐', role: '工程环节',
            do: '把 42 口井的曲线统一到 0.125 m 采样，深度归位，并按**井**划分训练 / 验证集（不能按样本随机划分，否则同井信息泄漏）。',
            effect: '同一口井的曲线只出现在一个集合里',
            trap: '样本量看着很大，实际独立样本只有几十口井'
          },
          {
            name: '标签规范化', role: '工程环节',
            do: '把不同解释员的层号映射到同一套地层方案，界面深度取中位数，层数不一致的井标注置信度。',
            effect: '标签从"每人一套"变成"一套 + 置信度"',
            trap: '层数定义不统一会让模型学成"平均解释员"'
          },
          {
            name: '候选界面生成', role: '算法核心',
            do: '滑窗统计特征（均值差、方差比、斜率）+ 变点检测，或用 1D U-Net 做序列分割，输出界面概率。',
            effect: '召回优先：宁可多给候选，也不漏真界面',
            trap: '直接追求高精度会把薄层全部滤掉'
          },
          {
            name: '规则后处理', role: '效果关键',
            do: '最小层厚 1 m、层序与邻井一致、界面不得穿过明显曲线趋势，逐条过滤不合理候选。',
            effect: '把"数学界面"变成"地质界面"',
            trap: '规则过严会连带删掉真实的薄互层'
          },
          {
            name: '人工确认与回流', role: '闭环',
            do: '解释员在候选界面上做增删改，修正结果自动回到训练集，形成闭环。',
            effect: '每口新井都在提升下一口井的效果',
            trap: '没有回流机制，模型三个月后就过期'
          }
        ],
        metrics: {
          title: '怎么算"分对了"',
          html: '<p>分层不是逐点分类，而是<b>界面匹配</b>问题：一个界面只要落在真实界面 ±1 m 容差内就算命中。这决定了指标的计算方式，也解释了为什么"准确率 99%"在这里毫无意义 —— 界面点只占全井段的千分之一，全判成"不是界面"也有 99.9%。</p>' +
            K.figure(figTolerance(), 3, '按容差匹配后统计 TP / FP / FN，再算精确率与召回率。**漏检（FN）比误检（FP）代价更高**：漏掉一个界面意味着人工要重新扫一遍整段曲线，而多一个候选界面只需点一下删除。') +
            K.dtable(['指标', '定义', '本例取值'], [
              ['精确率 P', 'TP / (TP + FP)，给出的候选里有多少是对的', '0.82'],
              ['召回率 R', 'TP / (TP + FN)，真实界面里找回了多少', '0.91'],
              ['F1', '2PR / (P + R)', '0.86'],
              ['平均偏差', '命中界面的绝对深度误差均值（m）', '0.34 m']
            ])
        },
        fails: [
          { name: '薄层漏检', why: '厚度小于最小层厚（本例 1 m）的层在惩罚项下会被合并。解决方向是分层建模：先粗分大层，再在小层内单独检测薄层。' },
          { name: '渐变过渡带', why: '岩性渐变时曲线没有突变点，算法倾向把过渡带整体归入一侧。可用斜率特征或软分割概率代替硬界面。' },
          { name: '曲线缺失段', why: '某条曲线在井段内缺失时，多通道模型会被"补零"误导。应先做缺失标记，让模型显式知道哪一通道不可用。' },
          { name: '层序冲突', why: '算法可能给出与区域地层方案矛盾的层序（如标志层倒置）。必须加层序约束或人工审核规则。' }
        ]
      },

      /* ---------- ③ 可运行示范 ---------- */
      demo: {
        label: '可运行示范',
        mount: function (root, ctx) {
          if (typeof window.WelllogLayerDemo !== 'function') {
            root.innerHTML = '<div class="callout warn"><span class="ci">缺失</span>' +
              '<span>示范脚本未加载：请确认 index.html 中 <b>assets/cases/welllog-layer.demo.js</b> 在 shell.js 之前引入。</span></div>';
            return;
          }
          window.WelllogLayerDemo(root, ctx);
        },
        unmount: function () {
          if (window.WelllogLayerDemoCleanup) window.WelllogLayerDemoCleanup();
        }
      }
    }
  });

})();

/* =========================================================
   案例 01 的可运行示范 · 测井曲线智能分层
   ---------------------------------------------------------
   纯前端，无依赖：
     合成井曲线（已知真实界面）→ 最优分段（DP + 惩罚项）→ 容差匹配打分
   对外只暴露 window.WelllogLayerDemo(root, ctx)
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  var N = 640;          // 采样点数
  var STEP = 0.125;     // m / 点
  var TOP = 2000;       // 井段顶深 m
  var MINSEG = 8;       // 最小层厚 1 m = 8 点
  var TOL = 8;          // 容差 ±1 m = 8 点

  /* 浅色配色：所有色值与 tokens.css 保持一致 */
  var C = {
    curve: '#2f3a3f',
    grid: '#eeeae0',
    gridSoft: '#f4f1e9',
    text: '#79828a',
    textDim: '#9ba3a9',
    truth: '#2f7d6b',
    det: '#b26a39',
    hover: '#b9c0c5',
    thin: '#f0dfa4'
  };

  var LITH = [
    { max: 45, name: '砂岩', color: '#c99a56' },
    { max: 70, name: '粉砂岩', color: '#a3855f' },
    { max: 100, name: '泥岩', color: '#6b89a3' },
    { max: 999, name: '富有机质泥岩', color: '#8878ab' }
  ];
  function lithOf(v) {
    for (var i = 0; i < LITH.length; i++) if (v < LITH[i].max) return LITH[i];
    return LITH[3];
  }

  /* ---------- 随机数 ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- 合成井 ---------- */
  function makeWell(seed, nLayers, noise) {
    var rnd = mulberry32(seed);
    var gauss = function () {
      var u = 0, v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    var raw = [], i, sum = 0;
    for (i = 0; i < nLayers; i++) { var w = 0.7 + rnd() * 1.5; raw.push(w); sum += w; }
    var th = [], remaining = N;
    for (i = 0; i < nLayers; i++) {
      var v;
      if (i === nLayers - 1) { v = remaining; }
      else {
        var maxAllowed = remaining - 30 * (nLayers - i - 1);
        v = Math.round(raw[i] / sum * N);
        v = Math.min(Math.max(v, 30), Math.max(30, maxAllowed));
      }
      th.push(v); remaining -= v;
    }

    // 埋一个 0.6—0.9 m 的薄层：厚度从邻层借，层数不变
    if (nLayers >= 7 && rnd() < 0.8) {
      var j0 = 1 + Math.floor(rnd() * (nLayers - 3));
      for (var t2 = 0; t2 < nLayers; t2++) {
        var c2 = 1 + ((j0 - 1 + t2) % (nLayers - 2));
        if (th[c2] >= 46) {
          var thin = 5 + Math.floor(rnd() * 3);
          var move = th[c2] - thin;
          th[c2] = thin;
          th[c2 - 1] += move;
          break;
        }
      }
    }

    var valsByLayer = [], prev = 60 + rnd() * 40;
    for (i = 0; i < nLayers; i++) {
      var vv = 24 + rnd() * 106;
      if (Math.abs(vv - prev) < 10) vv = prev + (vv > prev ? 1 : -1) * (10 + rnd() * 8);
      vv = Math.min(136, Math.max(20, vv));
      valsByLayer.push(vv); prev = vv;
    }

    var cut = [], acc = 0;
    for (i = 0; i < nLayers; i++) { cut.push(acc); acc += th[i]; }
    var step = new Float64Array(N);
    for (i = 0; i < N; i++) {
      var li = 0;
      for (var j = 0; j < nLayers; j++) if (i >= cut[j]) li = j;
      step[i] = valsByLayer[li];
    }

    // 仪器响应：3 点核平滑，制造约 2 个采样点的过渡带
    var sm = new Float64Array(N);
    for (i = 0; i < N; i++) {
      var s = 0, wsum = 0;
      for (var q = -1; q <= 1; q++) {
        var idx = i + q;
        if (idx >= 0 && idx < N) { s += step[idx] * (2 - Math.abs(q)); wsum += (2 - Math.abs(q)); }
      }
      sm[i] = s / wsum;
    }
    step = sm;

    var x = new Float64Array(N);
    for (i = 0; i < N; i++) x[i] = step[i] + gauss() * noise;

    return { x: x, cut: cut.slice(1), layers: th, vals: valsByLayer };
  }

  /* ---------- 最优分段（动态规划 + 惩罚项）---------- */
  function segment(x, beta) {
    var n = x.length, i, t, s;
    var cs = new Float64Array(n + 1), cs2 = new Float64Array(n + 1);
    for (i = 0; i < n; i++) { cs[i + 1] = cs[i] + x[i]; cs2[i + 1] = cs2[i] + x[i] * x[i]; }
    function cost(a, b) {
      var m = b - a; if (m <= 0) return 0;
      var sum = cs[b] - cs[a];
      return cs2[b] - cs2[a] - sum * sum / m;
    }
    var F = new Float64Array(n + 1), prev = new Int32Array(n + 1);
    F[0] = 0; prev[0] = 0;
    for (t = 1; t <= n; t++) {
      var best = cost(0, t), bp = 0;
      if (t > MINSEG * 2) {
        for (s = MINSEG; s <= t - MINSEG; s++) {
          var v = F[s] + cost(s, t) + beta;
          if (v < best) { best = v; bp = s; }
        }
      }
      F[t] = best; prev[t] = bp;
    }
    var bounds = [], cur = n;
    while (cur > 0) {
      var p = prev[cur];
      if (p <= 0) break;
      bounds.push(p); cur = p;
    }
    return bounds.reverse();
  }

  /* ---------- 稳健噪声估计 ---------- */
  function sigmaHat(x) {
    var d = [], i;
    for (i = 1; i < x.length; i++) d.push(Math.abs(x[i] - x[i - 1]));
    d.sort(function (a, b) { return a - b; });
    var med = d[Math.floor(d.length / 2)];
    return Math.max(0.8, med / 0.6745 / Math.SQRT2);
  }

  /* ---------- 容差匹配打分 ---------- */
  function score(det, tru) {
    var used = tru.map(function () { return false; });
    var tp = 0, errSum = 0;
    det.forEach(function (d) {
      var bi = -1, bd = 1e9;
      tru.forEach(function (t, i) {
        if (!used[i]) { var df = Math.abs(t - d); if (df < bd) { bd = df; bi = i; } }
      });
      if (bi >= 0 && bd <= TOL) { used[bi] = true; tp++; errSum += bd; }
    });
    var fp = det.length - tp;
    var fn = tru.filter(function (t, i) { return !used[i]; }).length;
    var p = tp + fp ? tp / (tp + fp) : 0;
    var r = tp + fn ? tp / (tp + fn) : 0;
    var f1 = (p + r) ? 2 * p * r / (p + r) : 0;
    return { tp: tp, fp: fp, fn: fn, p: p, r: r, f1: f1, mae: tp ? errSum * STEP / tp : 0, matchedTrue: used };
  }

  function mean(a, b, x) { var s = 0; for (var i = a; i < b; i++) s += x[i]; return s / (b - a); }

  /* =========================================================
     主渲染
     ========================================================= */
  function WelllogLayerDemo(root) {
    var state = { seed: 20261022, layers: 10, noise: 8, beta: 3, showTrue: true };
    var well, sig, det, sc, fitData = [];

    root.innerHTML = '' +
      '<div class="demo">' +
      '<div class="demo-head">' +
      '<div><span class="kicker">INTERACTIVE · 最优分段</span>' +
      '<h3 style="margin-top:8px">把一条 GR 曲线切成地质单元</h3>' +
      '<p>这是一口程序合成的井：真实层界面已知，所以能给算法精确打分。拖动 β 改变"每增加一个界面要付出的代价"，看它怎么从过分割滑到欠分割。</p></div>' +
      '<button class="btn primary" data-act="new">换一口井 ↻</button>' +
      '</div>' +

      '<div class="demo-ctl">' +
      '<div class="ctl"><label>噪声 σ</label><input type="range" min="2" max="24" step="1" value="8" id="c-noise"><span class="val" id="v-noise">8</span></div>' +
      '<div class="ctl"><label>真实层数</label><input type="range" min="5" max="14" step="1" value="10" id="c-layers"><span class="val" id="v-layers">10</span></div>' +
      '<div class="ctl"><label>惩罚 β</label><input type="range" min="0.2" max="12" step="0.1" value="3" id="c-beta"><span class="val" id="v-beta">3.0</span></div>' +
      '<label class="ctl tog on" id="c-true"><i></i>显示真实界面</label>' +
      '</div>' +

      '<div class="demo-grid">' +
      '<div class="track-wrap"><div class="track">' +
      '<svg id="logsvg" viewBox="0 0 462 620" role="img" aria-label="GR 曲线与分层结果"></svg>' +
      '<div class="readout" id="readout">把鼠标移到曲线上</div></div>' +
      '<div class="track-legend">' +
      '<span><i style="background:' + C.curve + '"></i>GR 曲线</span>' +
      '<span><i style="background:' + C.det + '"></i>检出界面</span>' +
      '<span><i class="dash"></i>真实界面</span>' +
      '<span><i style="background:' + C.thin + ';height:8px;width:11px;border-radius:2px"></i>薄层告警</span>' +
      '</div></div>' +

      '<div class="demo-side">' +
      '<div class="metrics" id="metrics"></div>' +
      '<div class="verdict" id="verdict"></div>' +
      '<div class="fitbox"><div class="ft"><span>F1 vs 惩罚系数 β</span><span id="fit-note"></span></div>' +
      '<svg id="fitsvg" viewBox="0 0 360 120"></svg></div>' +
      '<div class="hintbox"><b>过分割 / 欠分割：</b>β 太小，噪声波动会被当成层界面；β 太大，真实薄层会被合并。' +
      '<b>可用区间通常在曲线平台段的左端</b>——这也是实践里"先调 β 再调规则"的原因。</div>' +
      '</div></div>' +

      '<div class="ltable-wrap"><table class="ltable" id="ltable"></table></div>' +
      '</div>';

    var svg = root.querySelector('#logsvg');
    var fitSvg = root.querySelector('#fitsvg');
    var readout = root.querySelector('#readout');
    var metricsEl = root.querySelector('#metrics');
    var verdictEl = root.querySelector('#verdict');
    var tableEl = root.querySelector('#ltable');

    /* ------- 几何 ------- */
    var W = 462, H = 620, padL = 58, padT = 24, padB = 26, pw = 330, ph = H - padT - padB, GRMAX = 150;
    function X(v) { return padL + Math.min(v, GRMAX) / GRMAX * pw; }
    function Y(i) { return padT + i / (N - 1) * ph; }
    function depthAt(i) { return (TOP + i * STEP).toFixed(2); }

    /* ------- 真实层区间（含厚度），用于薄层告警 ------- */
    function trueLayers() {
      var edges = [0].concat(well.cut).concat([N]);
      var out = [];
      for (var i = 0; i < edges.length - 1; i++) {
        out.push({ a: edges[i], b: edges[i + 1], thick: (edges[i + 1] - edges[i]) * STEP });
      }
      return out;
    }

    /* ------- 计算 ------- */
    function recompute(full) {
      well = makeWell(state.seed, state.layers, state.noise);
      sig = sigmaHat(well.x);
      det = segment(well.x, state.beta * sig * sig * Math.log(N));
      sc = score(det, well.cut);
      if (full) buildFit();
    }

    function betaOf(k) { return k * sig * sig * Math.log(N); }

    function buildFit() {
      fitData = [];
      for (var k = 0.2; k <= 12.01; k += 0.4) {
        var b = segment(well.x, betaOf(k));
        fitData.push({ k: k, f1: score(b, well.cut).f1 });
      }
    }

    /* ------- 主图 ------- */
    function drawTrack() {
      var s = '';
      s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#ffffff"/>';

      for (var d = 0; d <= 80; d += 10) {
        var yy = padT + d / 80 * ph;
        s += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (padL + pw) + '" y2="' + yy + '" stroke="' + C.grid + '"/>';
        s += '<text x="' + (padL - 10) + '" y="' + (yy + 3.5) + '" fill="' + C.textDim + '" font-size="9" font-family="monospace" text-anchor="end">' + (TOP + d) + '</text>';
      }
      [0, 50, 100, 150].forEach(function (v) {
        var xx = X(v);
        s += '<line x1="' + xx + '" y1="' + padT + '" x2="' + xx + '" y2="' + (padT + ph) + '" stroke="' + C.gridSoft + '"/>';
        s += '<text x="' + xx + '" y="' + (padT + ph + 15) + '" fill="' + C.textDim + '" font-size="9" font-family="monospace" text-anchor="middle">' + v + '</text>';
      });
      s += '<text x="' + (padL + pw) + '" y="' + (padT + ph + 15) + '" fill="' + C.textDim + '" font-size="8.5" font-family="monospace" text-anchor="end">API</text>';
      s += '<text x="6" y="' + (padT - 10) + '" fill="' + C.text + '" font-size="9" font-family="monospace">深度(m)</text>';

      // 检出层段：底色 + 左色条
      var starts = [0].concat(det).concat([N]);
      for (var i = 0; i < starts.length - 1; i++) {
        var a = starts[i], b = starts[i + 1];
        var m = mean(a, b, well.x), li = lithOf(m);
        var y0 = Y(a), y1 = Y(b - 1) + (Y(1) - Y(0));
        s += '<rect x="' + padL + '" y="' + y0.toFixed(1) + '" width="' + pw + '" height="' + Math.max(1, y1 - y0).toFixed(1) + '" fill="' + li.color + '" opacity="0.10"/>';
        s += '<rect x="45" y="' + y0.toFixed(1) + '" width="3" height="' + Math.max(1, y1 - y0).toFixed(1) + '" rx="1.5" fill="' + li.color + '" opacity="0.75"/>';
      }

      // 薄层告警：真实厚度 < 1 m 且未被检出
      trueLayers().forEach(function (L) {
        if (L.thick >= 1.0) return;
        var hit = det.some(function (dpos) { return dpos > L.a - TOL && dpos < L.b + TOL + 1 && dpos > L.a; });
        if (hit) return;
        var y0 = Y(L.a), y1 = Y(L.b - 1) + (Y(1) - Y(0));
        s += '<rect x="' + padL + '" y="' + y0.toFixed(1) + '" width="' + pw + '" height="' + Math.max(2, y1 - y0).toFixed(1) + '" fill="' + C.thin + '" opacity=".55"/>';
        s += '<line x1="' + (padL + pw + 6) + '" y1="' + ((y0 + y1) / 2) + '" x2="' + (padL + pw + 16) + '" y2="' + ((y0 + y1) / 2) + '" stroke="' + C.det + '" stroke-width="1"/>';
        s += '<text x="' + (padL + pw + 19) + '" y="' + ((y0 + y1) / 2 + 3) + '" fill="' + C.det + '" font-size="8" font-family="monospace">' + L.thick.toFixed(1) + 'm 漏检</text>';
      });

      // 真实界面
      if (state.showTrue) {
        well.cut.forEach(function (c) {
          s += '<line x1="' + padL + '" y1="' + Y(c) + '" x2="' + (padL + pw) + '" y2="' + Y(c) + '" stroke="' + C.truth + '" stroke-width="1" stroke-dasharray="4 5" opacity="0.65"/>';
          s += '<text x="' + (padL + pw - 2) + '" y="' + (Y(c) - 3) + '" fill="' + C.truth + '" font-size="8" font-family="monospace" text-anchor="end" opacity="0.8">真 ' + (TOP + c * STEP).toFixed(1) + '</text>';
        });
      }

      // 曲线
      var path = '';
      for (var p = 0; p < N; p++) path += (p ? 'L' : 'M') + X(well.x[p]).toFixed(1) + ' ' + Y(p).toFixed(1);
      s += '<path d="' + path + '" fill="none" stroke="' + C.curve + '" stroke-width="1.15" stroke-linejoin="round"/>';

      // 检出界面
      det.forEach(function (c) {
        var yy = Y(c);
        s += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (padL + pw + 4) + '" y2="' + yy + '" stroke="' + C.det + '" stroke-width="1.2"/>';
        s += '<path d="M' + (padL + pw + 4) + ' ' + yy + ' l5 -3 l0 6 z" fill="' + C.det + '"/>';
        s += '<text x="' + (padL + pw + 12) + '" y="' + (yy + 3) + '" fill="' + C.det + '" font-size="8.5" font-family="monospace">' + (TOP + c * STEP).toFixed(1) + '</text>';
      });

      s += '<line id="xh" x1="' + padL + '" y1="0" x2="' + (padL + pw) + '" y2="0" stroke="' + C.hover + '" stroke-dasharray="3 3" style="display:none"/>';
      s += '<rect id="hit" x="' + padL + '" y="' + padT + '" width="' + pw + '" height="' + ph + '" fill="transparent" style="cursor:crosshair"/>';

      svg.innerHTML = s;

      var hit = svg.querySelector('#hit'), xh = svg.querySelector('#xh');
      hit.addEventListener('mousemove', function (e) {
        var r = svg.getBoundingClientRect();
        var sy = (e.clientY - r.top) / r.height * H;
        var idx = Math.round((sy - padT) / ph * (N - 1));
        if (idx < 0 || idx >= N) { xh.style.display = 'none'; return; }
        var yy = Y(idx);
        xh.setAttribute('y1', yy); xh.setAttribute('y2', yy);
        xh.style.display = '';
        var s2 = [0].concat(det).concat([N]), li2 = 0;
        for (var q = 0; q < s2.length - 1; q++) if (idx >= s2[q] && idx < s2[q + 1]) li2 = q;
        var lito = lithOf(mean(s2[li2], s2[li2 + 1], well.x));
        readout.innerHTML = (TOP + idx * STEP).toFixed(2) + ' m · GR ' + well.x[idx].toFixed(0) +
          ' · <span style="color:' + lito.color + ';font-weight:600">' + lito.name + '</span>';
      });
      hit.addEventListener('mouseleave', function () {
        xh.style.display = 'none';
        readout.textContent = '把鼠标移到曲线上';
      });
    }

    /* ------- 指标 ------- */
    function drawMetrics() {
      var f = sc.f1, cls = f >= 0.85 ? 'good' : f >= 0.6 ? 'warn' : 'bad';
      metricsEl.innerHTML =
        '<div class="metric ' + cls + '"><div class="l">F1</div><div class="v">' + f.toFixed(2) + '</div></div>' +
        '<div class="metric"><div class="l">召回 R</div><div class="v">' + sc.r.toFixed(2) + '<small>' + sc.tp + '/' + (sc.tp + sc.fn) + '</small></div></div>' +
        '<div class="metric"><div class="l">精确 P</div><div class="v">' + sc.p.toFixed(2) + '<small>' + sc.tp + '/' + (sc.tp + sc.fp) + '</small></div></div>' +
        '<div class="metric"><div class="l">平均偏差</div><div class="v">' + sc.mae.toFixed(2) + '<small>m</small></div></div>';

      var nn = det.length + 1, nt = well.cut.length + 1;
      var msg;
      if (sc.f1 >= 0.85) msg = '界面基本对齐：层数 ' + nn + ' vs 真实 ' + nt + '，可以直接进入人工复核。';
      else if (nn > nt + 1) msg = '当前 <b>过分割</b>：切出 ' + nn + ' 个层，真实只有 ' + nt + ' 个。β 偏小，噪声波动被当成了界面。';
      else if (nn < nt - 1) msg = '当前 <b>欠分割</b>：只切出 ' + nn + ' 个层，真实有 ' + nt + ' 个。β 偏大或噪声过大，相邻层被合并了。';
      else msg = '层数接近但位置有偏差：共 ' + nn + ' 层，命中 ' + sc.tp + ' 个界面。';
      if (sc.fn) msg += ' 漏检 ' + sc.fn + ' 处、多检 ' + sc.fp + ' 处。';
      var thinMiss = trueLayers().filter(function (L) { return L.thick < 1.0; }).length;
      if (sc.fn && thinMiss) msg += ' 漏掉的多半是图中标黄的 <b>&lt;1 m 薄层</b>——被最小层厚规则挡在门外。';
      verdictEl.innerHTML = msg;
    }

    /* ------- 调参曲线 ------- */
    function drawFit() {
      var w = 360, h = 120, m = { l: 26, r: 8, t: 10, b: 18 };
      var f1s = fitData.map(function (d) { return d.f1; });
      var ymax = 1, ymin = Math.max(0, Math.min.apply(null, f1s) - 0.08);
      function fx(k) { return m.l + (k - 0.2) / 11.8 * (w - m.l - m.r); }
      function fy(v) { return m.t + (1 - (v - ymin) / (ymax - ymin)) * (h - m.t - m.b); }

      var s = '';
      [ymin, (ymin + ymax) / 2, ymax].forEach(function (v) {
        s += '<line x1="' + m.l + '" y1="' + fy(v) + '" x2="' + (w - m.r) + '" y2="' + fy(v) + '" stroke="' + C.grid + '"/>';
        s += '<text x="' + (m.l - 5) + '" y="' + (fy(v) + 3) + '" fill="' + C.textDim + '" font-size="8" font-family="monospace" text-anchor="end">' + v.toFixed(1) + '</text>';
      });
      var pts = fitData.map(function (d) { return fx(d.k).toFixed(1) + ',' + fy(d.f1).toFixed(1); }).join(' ');
      s += '<polyline points="' + pts + '" fill="none" stroke="' + C.truth + '" stroke-width="1.5" opacity="0.85"/>';

      var best = fitData.reduce(function (a, b) { return b.f1 > a.f1 ? b : a; }, fitData[0]);
      s += '<circle cx="' + fx(best.k) + '" cy="' + fy(best.f1) + '" r="2.6" fill="' + C.truth + '"/>';
      s += '<text x="' + (fx(best.k) + 5) + '" y="' + (fy(best.f1) - 5) + '" fill="' + C.truth + '" font-size="8" font-family="monospace">best β=' + best.k.toFixed(1) + '</text>';

      var cx = fx(state.beta);
      s += '<line x1="' + cx + '" y1="' + m.t + '" x2="' + cx + '" y2="' + (h - m.b) + '" stroke="' + C.det + '" stroke-width="1" stroke-dasharray="3 3"/>';
      s += '<circle cx="' + cx + '" cy="' + fy(sc.f1) + '" r="3.2" fill="' + C.det + '"/>';

      s += '<text x="' + m.l + '" y="' + (h - 4) + '" fill="' + C.textDim + '" font-size="8" font-family="monospace">β 0.2</text>';
      s += '<text x="' + (w - m.r) + '" y="' + (h - 4) + '" fill="' + C.textDim + '" font-size="8" font-family="monospace" text-anchor="end">12.0</text>';
      fitSvg.innerHTML = s;
      root.querySelector('#fit-note').textContent = fitData.length + ' 次重算 · 当前 β=' + state.beta.toFixed(1);
    }

    /* ------- 分层表 ------- */
    function drawTable() {
      var starts = [0].concat(det).concat([N]);
      var rows = '';
      for (var i = 0; i < starts.length - 1; i++) {
        var a = starts[i], b = starts[i + 1];
        var m = mean(a, b, well.x), li = lithOf(m);
        var top = TOP + a * STEP, bot = TOP + b * STEP;
        var judge = '—', cls = '';
        if (i === 0) { judge = '井段顶'; }
        else {
          var matched = false;
          well.cut.forEach(function (c, ci) { if (sc.matchedTrue[ci] && Math.abs(c - a) <= TOL) matched = true; });
          judge = matched ? '✓ 命中' : '✗ 多余界面';
          cls = matched ? 'ok' : 'extra';
        }
        rows += '<tr><td>' + (i + 1) + '</td>' +
          '<td>' + top.toFixed(2) + '</td>' +
          '<td>' + bot.toFixed(2) + '</td>' +
          '<td>' + (bot - top).toFixed(2) + '</td>' +
          '<td>' + m.toFixed(0) + '</td>' +
          '<td class="lith"><span class="swatch" style="background:' + li.color + '"></span>' + li.name + '</td>' +
          '<td class="' + cls + '">' + judge + '</td></tr>';
      }
      tableEl.innerHTML = '<thead><tr><th>层</th><th>顶深 (m)</th><th>底深 (m)</th><th>厚度 (m)</th><th>平均 GR</th><th>岩性推断</th><th>判定</th></tr></thead><tbody>' + rows + '</tbody>';
    }

    function paint() { drawTrack(); drawMetrics(); drawFit(); drawTable(); }

    /* ------- 事件 ------- */
    root.querySelector('[data-act="new"]').addEventListener('click', function () {
      state.seed = Math.floor(Math.random() * 1e9);
      recompute(true); paint();
    });

    root.querySelector('#c-noise').addEventListener('input', function () {
      state.noise = +this.value;
      root.querySelector('#v-noise').textContent = this.value;
      recompute(true); paint();
    });

    root.querySelector('#c-layers').addEventListener('input', function () {
      state.layers = +this.value;
      root.querySelector('#v-layers').textContent = this.value;
      recompute(true); paint();
    });

    root.querySelector('#c-beta').addEventListener('input', function () {
      state.beta = +this.value;
      root.querySelector('#v-beta').textContent = (+this.value).toFixed(1);
      det = segment(well.x, betaOf(state.beta));
      sc = score(det, well.cut);
      paint();
    });

    var tog = root.querySelector('#c-true');
    tog.addEventListener('click', function () {
      state.showTrue = !state.showTrue;
      tog.classList.toggle('on', state.showTrue);
      drawTrack();
    });

    /* ------- 初始化 ------- */
    recompute(true);
    paint();
  }

  window.WelllogLayerDemo = WelllogLayerDemo;
  window.WelllogLayerDemoCleanup = function () { /* 本示范未使用定时器，DOM 销毁即释放 */ };
})();

if(!definition||definition.id!=="welllog-layer")throw Error("Teacher sample did not declare its case");g.S17CaseLoader.complete({id:definition.id,version:definition.version,tabs:definition.tabs,reading:null});}catch(error){g.S17CaseLoader.fail("welllog-layer","1.0.0",error);throw error;}})(window);
