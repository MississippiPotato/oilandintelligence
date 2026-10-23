"""Author the self-contained lesson text and native teacher manifest for g1."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def svg(label, content, height=310):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 {height}" role="img" aria-label="{label}"><rect width="760" height="{height}" fill="#f9fbfb" rx="18"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="19" fill="#183a45">{content}</g></svg>'


def figure(label, content, caption, height=310):
    return '<figure>' + svg(label, content, height) + f'<figcaption>{caption}</figcaption></figure>'


B1 = figure('露头岩层、卫星和遥感像素的对应关系', '''
<path d="M46 204L122 122l95 42 82-58 91 98z" fill="#d4af78" stroke="#b48b54" stroke-width="2"/>
<path d="M46 204h344v47H46z" fill="#c99655"/><path d="M46 225h344v28H46z" fill="#718597"/><path d="M46 251h344v25H46z" fill="#ded3ae"/>
<path d="M230 37l30-17 42 23-31 20z" fill="#a9bec8"/><path d="M195 29l36 9-11 29-36-9zm90 26l38 10-12 29-37-10z" fill="#416e8b"/>
<path d="M251 74L122 149m138-69l42 46" stroke="#67a19b" stroke-width="2" stroke-dasharray="7 5"/>
<text x="42" y="40">地面露头 → 反射光 → 传感器</text><text x="42" y="300">地表分布是勘察线索，剖面构造还需地面验证</text>
<rect x="443" y="45" width="263" height="188" rx="8" fill="#edf3f0" stroke="#9bbab1"/>
<path d="M443 94h263M443 141h263M443 188h263M495 45v188M548 45v188M601 45v188M654 45v188" stroke="#c3d5cf"/>
<path d="M444 46h261v47H444zM444 94h104v46H444z" fill="#c99655" opacity=".9"/>
<path d="M549 94h156v46H549zM444 141h210v46H444z" fill="#718597" opacity=".9"/>
<path d="M655 141h50v46h-50zM444 188h261v44H444z" fill="#ded3ae"/>
<rect x="549" y="94" width="52" height="47" fill="none" stroke="#083f59" stroke-width="4"/>
<text x="442" y="270">一个像素 = 一块地表的平均响应</text>''', '遥感先描述可见地表单元，再为填图与露头核查提供候选区域。示意图不按空间比例绘制。')

B2 = figure('四种教学地表类别在红光、近红外和短波红外的响应', '''
<path d="M80 40v204h610" fill="none" stroke="#8aa2ad" stroke-width="2"/>
<path d="M80 90h610M80 140h610M80 190h610" stroke="#e0e8eb"/><g font-size="16"><text x="24" y="48">反射率</text><text x="33" y="94">0.6</text><text x="33" y="144">0.4</text><text x="33" y="194">0.2</text><text x="70" y="270">0.65 μm</text><text x="330" y="270">0.86 μm</text><text x="615" y="270">2.2 μm</text><text x="82" y="294">红光</text><text x="337" y="294">近红外</text><text x="620" y="294">短波红外</text></g>
<path d="M108 159L372 146L665 109" fill="none" stroke="#c99655" stroke-width="5"/>
<path d="M108 191L372 174L665 166" fill="none" stroke="#718597" stroke-width="5" stroke-dasharray="10 4"/>
<path d="M108 125L372 117L665 155" fill="none" stroke="#b4a478" stroke-width="5"/>
<path d="M108 218L372 85L665 188" fill="none" stroke="#418b70" stroke-width="5" stroke-dasharray="3 5"/>
<g font-size="16"><text x="440" y="36" fill="#c99655">砂岩露头 ━</text><text x="585" y="36" fill="#718597">泥岩露头 ┄</text><text x="440" y="61" fill="#9b8755">灰岩露头 ━</text><text x="585" y="61" fill="#418b70">植被覆盖 ···</text></g>''', '曲线数值由本案例合成器设定，用于练习多波段差异；阴影会使多个通道一起变暗。真实岩石光谱受矿物、风化、含水和传感器波段影响。', 320)

B3 = figure('单一波段阈值与多波段近邻分类的区别', '''
<text x="28" y="37" font-size="21" font-weight="700">同样暗的像素，来源可能不同</text>
<rect x="32" y="69" width="108" height="87" rx="9" fill="#676e63"/><rect x="169" y="69" width="108" height="87" rx="9" fill="#657465"/>
<text x="34" y="187">阴影中的砂岩</text><text x="176" y="214">植被覆盖</text><text x="52" y="134" fill="white">红光相近</text><text x="191" y="134" fill="white">红光相近</text>
<path d="M307 114h70" stroke="#527a88" stroke-width="3"/><path d="M368 107l11 7-11 7" fill="none" stroke="#527a88" stroke-width="3"/>
<rect x="405" y="55" width="315" height="195" rx="15" fill="#e9f3f1"/>
<text x="429" y="91" font-weight="700">把每个像素放到特征空间</text><text x="429" y="128">① 红光 / 近红外 / 短波红外</text><text x="429" y="164">② 归一化波段差异</text><text x="429" y="200">③ 3 × 3 邻域纹理</text><text x="32" y="279">输出：三类露头 + 植被覆盖 + 待复核；植被不是一种岩性。</text>''', '分类器比较来自其他图幅的已标注像素。覆盖区先归为植被，不从绿色区域直接推断下方岩性。')

steps = [
    dict(name='按图幅划分，先看数据', role='数据', do='输入：3个反射率波段与整幅地表类别标注。动作：以图幅ID分组，6幅训练、2幅验证、1幅独立测试。图 S1 显示划分。', effect='产物：576个训练像素、独立验证像素和完整72×48测试图；同图相邻像素不跨集合。', trap='同一图幅的裁块混到训练和测试，会把空间相似性误算成泛化能力。'),
    dict(name='从观测波段提取6维特征', role='特征', do='输入：实际波段数组。动作：逐像素计算3个通道、2个归一化差异和3×3红光标准差，图 S2 对应可见特征。', effect='产物：每个像素的6维向量；仅训练样本拟合均值与标准差。', trap='合成器的类别标签只用于训练标注与后续评价，不进入测试特征。'),
    dict(name='建立有来源的近邻库', role='学习', do='输入：训练特征和训练类别。动作：训练组标准化后，按欧氏距离寻找近邻并做距离加权投票，见图 S3。', effect='产物：可点开查看的实际训练邻居、距离和近邻支持度。', trap='近邻投票的支持度是相对票重，不能当作已经校准的概率。'),
    dict(name='用验证图选择k与阈值', role='验证', do='输入：两幅独立验证图。动作：实算 k=3、5、7 的宏F1；红光基线也在同一验证图上选择阈值偏移，见图 S4。', effect='产物：锁定的k、单波段阈值和验证记录；测试滑杆改动属于探索。', trap='测试结果不能反向参与参数选择；特征消融会重新使用同一训练和验证划分。'),
    dict(name='比较地图、定位错误并复核', role='解释', do='输入：同一幅测试图的观测。动作：分别运行基线与kNN，计算含拒判列的混淆矩阵；点选像素后填写人工意见，见图 S5。', effect='产物：分类图、宏F1、各类IoU、人工意见和可下载JSON；原模型指标保持独立。', trap='先修改输入再重算；导出只对应当前已经完成的一次运行。')
]

S = [
    figure('独立整图训练验证测试的划分', '''<text x="32" y="44" font-weight="700">整幅来源分组，而不是随机打散像素</text><rect x="34" y="78" width="330" height="82" rx="12" fill="#dcece7"/><rect x="382" y="78" width="148" height="82" rx="12" fill="#e5edf7"/><rect x="548" y="78" width="176" height="82" rx="12" fill="#f6e9d4"/><text x="65" y="112">训练 6幅</text><text x="65" y="143">每幅按网格取样</text><text x="400" y="112">验证 2幅</text><text x="400" y="143">选择 k</text><text x="565" y="112">测试 1幅</text><text x="565" y="143">3456像素</text><text x="34" y="214">反射率数组与参考标签分开保存；预测入口只接收观测。</text>''', '输入：独立图幅；动作：分组留出；产物：互不重叠的来源ID。', 250),
    figure('六维多波段与纹理特征', '''<g><rect x="28" y="42" width="125" height="115" rx="9" fill="#c99655"/><rect x="54" y="64" width="125" height="115" rx="9" fill="#7ba385"/><rect x="80" y="86" width="125" height="115" rx="9" fill="#8f9ab1"/></g><text x="34" y="240">3个波段</text><path d="M230 127h70" stroke="#648b96" stroke-width="3"/><text x="333" y="64">红光 / 近红外 / 短波红外</text><text x="333" y="104">(NIR−R)/(NIR+R+0.01)</text><text x="333" y="144">(SWIR−NIR)/(SWIR+NIR+0.01)</text><text x="333" y="184">局部纹理 = 3×3 红光标准差</text><text x="333" y="235">标准化只拟合训练组</text>''', '输入：实际波段；动作：计算波段差异与纹理；产物：6维向量。', 280),
    figure('近邻投票与每个训练像素的来源', '''<path d="M70 210V45m0 165h620" stroke="#9bb0b8" fill="none"/><circle cx="283" cy="128" r="13" fill="#fff" stroke="#183a45" stroke-width="4"/><g fill="#c99655"><circle cx="213" cy="91" r="11"/><circle cx="250" cy="71" r="11"/><circle cx="344" cy="102" r="11"/></g><g fill="#718597"><circle cx="465" cy="161" r="11"/><circle cx="516" cy="128" r="11"/></g><path d="M283 128l-70-37m70 37l-33-57m33 57l61-26" stroke="#aac1c5" stroke-width="2" stroke-dasharray="6 4"/><text x="84" y="250">○ 测试像素　● 带来源的训练像素　距离越近，票重越高</text><text x="410" y="62">二维示意；实算使用全部特征</text>''', '输入：训练库与当前像素；动作：按实际距离投票；产物：候选类别与可追溯邻居。', 285),
    figure('验证只选择参数测试独立保留', '''<rect x="35" y="41" width="205" height="152" rx="13" fill="#e5edf7"/><text x="57" y="78">验证图幅</text><text x="57" y="118">k = 3 / 5 / 7</text><text x="57" y="157">实算宏F1后选一项</text><path d="M260 116h80" stroke="#648b96" stroke-width="3"/><rect x="360" y="41" width="155" height="152" rx="13" fill="#dcece7"/><text x="380" y="87">锁定参数</text><text x="380" y="139">含红光基线</text><path d="M535 116h38" stroke="#648b96" stroke-width="3"/><rect x="590" y="41" width="140" height="152" rx="13" fill="#f6e9d4"/><text x="609" y="87">测试图幅</text><text x="609" y="139">仅预测评价</text><text x="35" y="243">结果页展开“数据划分与实算记录”，可查看本次真实选择结果。</text>''', '输入：验证观测与标注；动作：比较参数；产物：在测试前确定的配置。', 280),
    figure('预测结果评价与人工意见分开留存', '''<rect x="30" y="46" width="205" height="116" rx="13" fill="#dcece7"/><text x="50" y="85">模型原始分类图</text><text x="50" y="126">不可被复核覆盖</text><path d="M255 104h65" stroke="#648b96" stroke-width="3"/><rect x="340" y="46" width="180" height="116" rx="13" fill="#e5edf7"/><text x="360" y="85">独立参考标签</text><text x="360" y="126">实算 F1 / IoU</text><rect x="540" y="46" width="190" height="116" rx="13" fill="#f6e9d4"/><text x="559" y="85">人工意见层</text><text x="559" y="126">保留坐标与原判</text><text x="30" y="223">F1 = 2TP/(2TP+FP+FN)　IoU = TP/(TP+FP+FN)</text>''', '输入：同图预测与参考；动作：逐像素统计、独立复核；产物：带分母的结果JSON。', 265)
]

manifest = {
    'id': 's17x-g1-remote-lithology', 'sceneId': 'g1', 'methods': ['cv'],
    'title': '地质剖面遥感解译：从多波段像素读懂地表单元', 'version': '1.0.0', 'updated': '2026-10-24',
    'tabs': {
        'background': {'label': '专业背景', 'lede': '地表岩性为什么不能只看颜色？把露头、卫星波段与像素分类连起来，找到值得地面核查的地质单元。', 'judge': [
            {'label': '专业任务', 'value': '地表单元分区', 'desc': '三类露头与植被覆盖'},
            {'label': '实际方法', 'value': '6维特征 + kNN', 'desc': '单红光阈值作同图基线'},
            {'label': '默认数据', 'value': '独立合成图幅', 'desc': '72×48像素，30 m/像素'},
            {'label': '人工工作', 'value': '核查边界与遮挡', 'desc': '逐像素查看邻居和复核意见'}
        ], 'sections': [
            {'no': 1, 'en': 'SURFACE', 'title': '图 B1｜从地质露头，到一个遥感像素', 'html': '<p>地质勘察需要识别地表岩性单元及其接触关系。卫星把地表反射光记录为栅格，帮助安排填图和露头核查路线。</p>' + B1},
            {'no': 2, 'en': 'SPECTRUM', 'title': '图 B2｜换一个波段，看到另一种差异', 'html': '<p>红光、近红外和短波红外记录不同波长的响应。组合波段能增加识别线索；阴影、风化与植被也会改变观测。</p>' + B2},
            {'no': 3, 'en': 'INTERPRETATION', 'title': '图 B3｜把颜色，变成带证据的候选判断', 'html': '<p>模型学习的是当前标注体系下的表面外观。三类露头与植被覆盖使用不同标签；点选像素能查看来自训练图幅的真实邻居。</p>' + B3}
        ]},
        'workflow': {'label': '案例流程', 'title': '让每一块地表分类都有输入、方法与出处', 'lead': ['按图幅留出、训练组标准化、验证选参，然后在独立测试图上比较单波段规则和多波段近邻。'], 'stats': [['训练图幅', '6'], ['验证图幅', '2'], ['测试像素', '3456']], 'steps': steps, 'metrics': {'title': '逐步图册与评价口径', 'html': ''.join(f'<h3>图 S{i+1}｜{steps[i]["name"]}</h3>{f}' for i, f in enumerate(S)) + '<p>混淆矩阵行是真值，列是预测；拒判留在第5列并计入FN。各类F1与IoU按整幅3456像素计算，宏平均仅排除无适用分母的类别。</p>'}, 'fails': [{'name': '强阴影与噪声', 'why': '观测变暗且波段间差异被噪声掩盖，模型也会发生错分。'}, {'name': '植被覆盖', 'why': '先输出覆盖类别，不能把植被颜色直接译成下方岩性。'}]},
        'demo': {'mode': 'page', 'html': 'demo/index.html', 'js': 'demo/demo.js', 'label': '可运行示范', 'height': 1100, 'intro': '改变阴影、噪声与覆盖，实际运行分类；点选像素看波段、邻居与人工意见。'}
    }
}
ROOT.joinpath('case.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

background = ''.join(f'<article class="lesson"><div><div class="no">B0{i+1} / CONCEPT</div><h2>{s["title"].split("｜",1)[1]}</h2>{s["html"].split("<figure>")[0]}</div><div>{s["html"][s["html"].index("<figure>"):]}</div></article>' for i, s in enumerate(manifest['tabs']['background']['sections']))
workflow = '<div class="workflow-layout"><nav class="step-nav" aria-label="流程步骤">' + ''.join(f'<button type="button" data-step="{i}" aria-selected="{str(i == 0).lower()}">{i+1:02d}　{s["name"]}</button>' for i, s in enumerate(steps)) + '</nav><div>'
for i, s in enumerate(steps):
    workflow += f'<article class="step-body" data-step-panel="{i}"{(" hidden" if i else "")}><div class="eyebrow" style="color:#087f83">STEP {i+1:02d} / {s["role"]}</div><h2>{s["name"]}</h2><dl class="io-list"><dt>输入·动作</dt><dd>{s["do"]}</dd><dt>产物</dt><dd>{s["effect"]}</dd><dt>关键点</dt><dd>{s["trap"]}</dd></dl><div class="step-figure">{S[i]}</div><div class="step-controls"><button data-prev="{i}" type="button"{(" disabled" if i == 0 else "")}>← 上一步</button><button data-next="{i}" type="button">{("去运行示范 →" if i == 4 else "下一步 →")}</button></div></article>'
workflow += '</div></div>'
lab = '''
<div class="intro"><h2>让同一幅地表影像接受两种解释</h2><p>先看多波段如何改变判断，再亲手增加阴影和噪声。三类露头与植被覆盖，都在同一整幅参考图上评价。</p></div>
<p class="data-note">教学合成图幅 · 72 × 48 像素 · 30 m / 像素 · 3个波段 · 默认测试来源“图幅-2027”</p>
<div class="controls">
<label class="control" for="noise">波段噪声幅度 <output id="noise-value">0.045</output><input id="noise" type="range" min="0" max="0.2" step="0.005" value="0.045"></label>
<label class="control" for="shadow">阴影强度 <output id="shadow-value">26%</output><input id="shadow" type="range" min="0" max="0.85" step="0.01" value="0.26"></label>
<label class="control" for="cover">植被覆盖控制 <output id="cover-value">16%</output><input id="cover" type="range" min="0" max="0.5" step="0.01" value="0.16"></label>
<label class="control" for="feature-mode">比较使用的信息<select id="feature-mode"><option value="full">3波段 + 波段差异 + 纹理</option><option value="red">仅红光特征（消融）</option></select></label>
</div>
<div class="action-row"><button id="run" class="primary" type="button">运行分类与比较</button><button id="reset" type="button">恢复默认</button><button id="preset-fail" type="button">试试强阴影 + 高噪声</button><button id="new-scene" type="button">换一幅独立测试图</button><button id="export" type="button" disabled>导出本次JSON</button></div>
<p id="status" class="status" role="status" aria-live="polite" data-state="idle">点击运行，建立训练库、选择参数并计算当前图幅。</p>
<div class="view-tools"><label>观测显示 <select id="band-view"><option value="composite">假彩色：SWIR / NIR / 红光</option><option value="red">红光灰度</option><option value="nir">近红外灰度</option><option value="swir">短波红外灰度</option></select></label><label>第三幅图 <select id="error-view"><option value="error">误分与待复核</option><option value="truth">参考类别图</option><option value="baseline">单红光基线</option></select></label></div>
<div class="maps" id="maps"><figure class="map"><h3>01　卫星观测</h3><canvas id="observed-map" width="720" height="480" tabindex="0" role="img" aria-label="可点选的合成多波段地表影像"></canvas><figcaption>东向 → 0–2160 m；北向 ↑；像素边长30 m</figcaption></figure><figure class="map"><h3>02　近邻分类</h3><canvas id="prediction-map" width="720" height="480" tabindex="0" role="img" aria-label="近邻分类与人工复核位置"></canvas><figcaption>点任意图，同步选择相同位置；白框为选中像素</figcaption></figure><figure class="map"><h3 id="third-title">03　错误定位</h3><canvas id="comparison-map" width="720" height="480" tabindex="0" role="img" aria-label="评价误分图或参考图"></canvas><figcaption id="third-caption">浅灰：正确；珊瑚：错分；金黄：待复核</figcaption></figure></div>
<div class="legend" id="class-legend"></div>
<div id="metrics" class="metrics"><p class="empty">运行后显示同一测试图的实算指标。</p></div>
<div class="analysis"><div><h3>点选像素，读它的光谱</h3><div class="coord"><label>列 x <input id="px" type="number" min="0" max="71" value="36"></label><label>行 y <input id="py" type="number" min="0" max="47" value="24"></label></div><div id="pixel-info"><p class="empty">当前像素的波段、纹理与判别依据会显示在这里。</p></div><div id="pixel-spectrum"></div></div><div><h3>来自哪些训练图幅？</h3><div id="neighbors"><p class="empty">近邻列表来自本次真实距离计算。</p></div><div class="review-row"><select id="review-label" aria-label="人工意见类别"><option value="0">砂岩露头</option><option value="1">泥岩露头</option><option value="2">灰岩露头</option><option value="3">植被覆盖</option><option value="4">继续待复核</option></select><button id="review" type="button" disabled>保存此点意见</button></div><p id="review-log" class="review-log">人工意见作为独立图层保存。</p></div></div>
<h3 class="section-heading">每一类分得怎么样？</h3><div id="class-metrics" class="table-wrap"><p class="empty">运行后显示各类TP、FP、FN、IoU与F1。</p></div>
<p class="explain">IoU = TP / (TP + FP + FN)，F1 = 2TP / (2TP + FP + FN)。整幅3456像素参与评价，待复核仍计入对应类别FN；缺席且无误报的类别显示“不适用”。人工意见不覆盖模型原始结果。</p>
<details><summary>数据划分、验证选择与混淆矩阵</summary><div id="provenance"><p>训练图幅、验证候选与参数将随本次计算显示。</p></div><div id="confusion" class="table-wrap"></div></details>
'''
html = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{manifest['title']}</title><link rel="stylesheet" href="demo.css"></head><body>
<header><div class="eyebrow">GEOLOGY / G1 / 地质勘察</div><h1>从多波段像素，读懂地表单元</h1><p>一幅影像，三种岩石外观，一片植被。让每个候选解释都能回到观测与训练证据。</p></header>
<nav class="case-nav" aria-label="案例内容"><button type="button" data-tab="background" aria-selected="true">专业背景</button><button type="button" data-tab="workflow" aria-selected="false">案例流程</button><button type="button" data-tab="lab" aria-selected="false">可运行示范</button></nav>
<main><section id="background" class="pane"><div class="intro"><h2>先理解：地质信息怎样成为影像？</h2><p>把露头、反射波段和分类地图连成一条证据链。</p></div>{background}<div class="sources"><b>专业依据</b>：<a href="https://eros.usgs.gov/earthshots/introduction-remote-sensing" target="_blank" rel="noopener">USGS：遥感与波段</a>；<a href="https://www.sgm.gob.mx/Gobmx/en/About_SGM/Remote_sensing.html" target="_blank" rel="noopener">墨西哥地质调查局：地质遥感填图</a>。图形为本案例自绘；光谱数值与图幅均为教学合成。</div></section>
<section id="workflow" class="pane" hidden><div class="intro"><h2>五步，把影像变成可复核的解释</h2><p>每一步都能在演示中找到对应输入或中间产物。</p></div>{workflow}</section>
<section id="lab" class="pane" hidden>{lab}</section><footer>井见 · 地质勘察案例　|　纯前端本地计算　|　同一测试图比较基线与学习方法</footer></main><script src="demo.js"></script></body></html>'''
ROOT.joinpath('demo.html').write_text(html, encoding='utf-8')

sources = {'sceneId': 'g1', 'checked': '2026-10-24', 'data': {'nature': 'procedural teaching synthetic', 'spatialResolution_m': 30, 'shape': [48, 72], 'bandCenters_um': [.65, .86, 2.2], 'spectra': 'Authored teaching contrasts, not measured USGS spectra', 'labels': ['sandstone outcrop', 'mudstone outcrop', 'limestone outcrop', 'vegetation cover'], 'split': {'train': [111,127,143,159,175,191], 'validation': [503,557], 'defaultTest': 2027}}, 'sources': [{'url': 'https://eros.usgs.gov/earthshots/introduction-remote-sensing', 'organization': 'USGS EROS', 'supports': 'Reflected solar energy, spectral bands and false-color composites.'}, {'url': 'https://www.sgm.gob.mx/Gobmx/en/About_SGM/Remote_sensing.html', 'organization': 'Servicio Geologico Mexicano', 'supports': 'Remote sensing supports lithologic/structural mapping and spectral composites.'}], 'artwork': 'Original inline SVG and generated pixel arrays; no copied website images.'}
ROOT.joinpath('sources.json').write_text(json.dumps(sources, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
