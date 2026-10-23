"""Authoring helper only. Not included in the distributable case folder."""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).parent


def text(x, y, s, extra=''):
    return f'<text x="{x}" y="{y}" {extra}>{s}</text>'


def box(x, y, w, h, label, fill='#e2eee9'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" fill="{fill}"/>' + text(x + 16, y + h / 2 + 6, label)


def line(x1, y1, x2, y2, color='#7d9b94', extra=''):
    return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color}" stroke-width="3" {extra}/>'


def svg(label, body, h=320):
    return f'<div class="figure-scroll" tabindex="0" aria-label="图形可横向滚动"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 {h}" role="img" aria-label="{label}" style="width:100%;display:block"><rect width="900" height="{h}" rx="14" fill="#f0f5f1"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="18" fill="#29494d">{body}</g></svg></div>'


def fig(label, body, caption, h=320):
    return f'<figure><h3>{label}</h3>{svg(label, body, h)}<figcaption>{caption}</figcaption></figure>'


sources = [
    ('SLB · Perforating Fundamentals', 'https://www.slb.com/resource-library/oilfield-review/defining-series/defining-perforating'),
    ('SLB · Perforation phasing', 'https://glossary.slb.com/Terms/p/perforation_phasing.aspx'),
    ('SLB · Perforation penetration', 'https://glossary.slb.com/Terms/p/perforation_penetration.aspx'),
]

b1 = f'''<circle cx="205" cy="158" r="120" fill="#e0cfac"/><circle cx="205" cy="158" r="83" fill="#f3e6cd" stroke="#bd9a59" stroke-width="2" stroke-dasharray="6 5"/><circle cx="205" cy="158" r="43" fill="#c5d5d3"/><circle cx="205" cy="158" r="31" fill="#f5f8f4" stroke="#486a71" stroke-width="5"/>
<path d="M239 153h114v12H239z" fill="#207f77"/><path d="M286 144l-19 14 19 14" fill="none" stroke="#e7bd68" stroke-width="3"/>
{line(247, 115, 353, 115, '#a3783b')}{line(247, 108, 247, 122)}{line(353, 108, 353, 122)}{text(262, 101, '穿深 L / cm')}
{text(44, 302, '井筒 → 套管 / 水泥环 → 损伤带 → 储层')}
{text(455, 57, '储层与井筒之间，需要可连通的通道', 'font-size="22" font-weight="600"')}
{text(455, 103, '射孔穿过套管和水泥环，进入地层。')}{text(455, 143, '近井带可能受钻完井作业影响而受损。')}
{text(455, 183, '穿深决定通道能否伸到损伤带之外。')}{text(455, 238, '本例：单一储层；孔口直径保持不变。')}{text(455, 279, '绿色为流动通道，箭头表示流入井筒。')}'''

b2 = text(30, 37, '相位：相邻射孔方位的夹角 / °', 'font-size="22" font-weight="600"')
for cx, phase in [(160, 60), (430, 120), (700, 180)]:
    b2 += f'<circle cx="{cx}" cy="154" r="38" fill="#d8e5e0" stroke="#4d6e72" stroke-width="4"/>'
    n = 360 // math.gcd(360, phase)
    for j in range(n):
        a = phase * j * math.pi / 180
        b2 += line(round(cx + 42 * math.cos(a), 1), round(154 + 42 * math.sin(a), 1), round(cx + 95 * math.cos(a), 1), round(154 + 95 * math.sin(a), 1), '#1a7e76', 'stroke-linecap="round"')
    b2 += text(cx, 284, f'{phase}°：{n} 个方向后重复', 'text-anchor="middle"')
b2 += text(30, 329, '孔密是沿井长度的孔数，单位孔/m；相位描述角向分布，两者并不相同。')

b3 = text(30, 38, '收益、成本与可行域，是三件不同的事', 'font-size="22" font-weight="600"')
b3 += line(70, 256, 420, 256) + line(70, 70, 70, 256)
b3 += '<path d="M73 232C160 112 280 93 413 106" stroke="#187e76" fill="none" stroke-width="5"/><path d="M73 245C160 224 280 165 413 80" stroke="#ba863d" fill="none" stroke-width="4"/>'
b3 += text(90, 91, '响应指数（概念曲线）') + text(296, 279, '孔密 / 孔·m⁻¹') + text(214, 121, '通道增益趋缓', 'fill="#187e76"') + text(247, 212, '教学成本增长', 'fill="#996b2e"')
b3 += text(474, 94, '净目标 S = 预测响应 − α × 成本点') + text(474, 139, '预算：C ≤ B') + text(474, 179, '越带余量：L − 损伤带厚度 ≥ 5 cm') + text(474, 219, '拥挤指数：(孔密/12) × (穿深/35)') + text(474, 279, 'α、成本点与拥挤上限是教学定义。')

sections = [
    {'no': 1, 'en': 'COMMUNICATION', 'title': '图 B1｜先把储层与井筒连起来', 'html': '<p>生产套管和水泥环把井筒与地层分隔开。射孔形成沟通通道，使地层流体能够流入井筒。对近井受损地层，通道伸到受损带之外有助于改善连通；是否有用还取决于孔眼清洁、流体和储层条件。</p>' + fig('井筒—损伤带—射孔通道', b1, '原理依据 SLB Perforating Fundamentals 与 penetration 词条；图形为本项目原创概念示意。')},
    {'no': 2, 'en': 'GEOMETRY', 'title': '图 B2｜孔密、相位和穿深各控制什么？', 'html': '<p><b>孔密</b>是每单位沿井长度上的孔数；<b>相位</b>是连续射孔在圆周上的方位间隔；<b>穿深</b>是可用通道进入地层的长度。一个参数不能概括这三种几何作用。演示在 4–24 孔/m、15–60 cm 与四种相位构成的网格中搜索。</p>' + fig('相位控制角向分布', b2, '三幅图固定井径，只改变相位；径向图不表示现场工具装药结构。相位概念来源：SLB Perforation phasing。', 365)},
    {'no': 3, 'en': 'LEARNING', 'title': '图 B3｜智能化的价值，是把试验变成可搜索的性能面', 'html': '<p>一组试验只覆盖有限的参数点。回归代理把渗透率、损伤带、各向异性及射孔几何映射为响应指数，再对未观测的候选组合预测。优化只在满足约束的网格里比较“预测响应 − 成本代价”，因此孔数最多、穿深最大的组合未必被选中。</p>' + fig('净目标与约束的关系', b3, '合成响应是本例公开的教学假设；响应指数、成本点与拥挤指数均不是某口真实井的实测评价。') + '<p>演示把方案先固定，再调用合成响应函数评价净增量和目标差；评价值不参与拟合测试数据或选择候选。</p>'},
    {'no': 4, 'en': 'PROTOCOL', 'title': '从哪学，和谁比？', 'html': '<p>训练集含 14 个独立储层组、840 条试验，验证集 4 组、160 条，测试集 6 组、240 条。三集合的孔密区块不同，整组保留。岭回归强度只按验证 RMSE 选取；代理与训练均值基线共用全部 240 条测试记录。设计优化另外与 12 孔/m、35 cm、120° 的固定方案比较。</p><div class="sources"><p>专业概念核对于 2026-10-24：</p><ul>' + ''.join(f'<li><a href="{url}" target="_blank" rel="noopener">{label}</a></li>' for label, url in sources) + '</ul><p>所有图形由项目绘制；合成试验、模型和指标都在浏览器本地计算。</p></div>'},
]

steps = [
    {'name': '组织试验与分组留出', 'role': '图 S1', 'do': '输入：储层条件、射孔几何和合成响应观测；动作：按完整储层组和不同孔密区块划分训练、验证、测试。', 'effect': '14 / 4 / 6 个互不重叠的储层组，测试观测与评价值分开保存。', 'trap': '同一储层的参数变体全部留在同一集合；不能随机拆散同源试验。'},
    {'name': '学习可解释代理', 'role': '图 S2', 'do': '输入：训练观测及响应；动作：构造归一化几何、损伤与交互项，拟合 14 项岭回归；用验证 RMSE 选择正则强度。', 'effect': '冻结系数、λ 与验证曲线；可查看每一项的系数。', 'trap': '测试响应只参与后续评价；指数不是实际日产量。'},
    {'name': '画出受约束的候选域', 'role': '图 S3', 'do': '输入：当前储层、预算、拥挤上限和 5 cm 越带余量；动作：枚举 440 个几何组合，逐项核对三条约束。', 'effect': '可行候选数、比例、热图及被排除的具体原因。', 'trap': '无可行候选时先调整定义和约束，不输出一个越界的“最优”方案。'},
    {'name': '在代理面上比较方案', 'role': '图 S4', 'do': '输入：可行候选和冻结代理；动作：计算每个组合的预测净目标，选择最大者，与固定方案并排比较。', 'effect': '候选几何、成本散点、相位切片和当前推荐点。', 'trap': '搜索只能读取代理预测。储层条件超出训练范围时应标为外推。'},
    {'name': '独立评价并人工复核', 'role': '图 S5', 'do': '输入：已冻结候选、固定方案及独立评价响应；动作：计算测试 RMSE、净增量与目标差，记录人工意见。', 'effect': '当前运行版本的 JSON，包含分组、系数、约束、模型结果及人工记录。', 'trap': '固定方案不可行时不报告可行方案对它的净增量；输入变化后必须重算才能导出。'},
]

s1 = text(30, 38, '同源试验一起划分，避免参数变体泄漏', 'font-size="22" font-weight="600"')
for x, name, count, rows, color in [(36, '训练', 14, 840, '#d4e9e0'), (330, '验证', 4, 160, '#dce5ee'), (624, '测试', 6, 240, '#f0e3cb')]:
    s1 += box(x, 73, 240, 140, f'{name}：{count} 个储层组', color) + text(x + 16, 192, f'{rows} 条不同参数试验')
s1 += text(35, 263, '整组标识互不重复；孔密：训练 4/8/12/16/20/24，验证 6/10/14/18/22。') + text(35, 300, '测试使用独立储层组及 5/9/13/17/21/23 孔/m 的独立参数区块。')
s2 = text(30, 40, '用少量基函数构造可解释的响应面', 'font-size="22" font-weight="600"')
s2 += box(36, 84, 230, 75, '可见输入 k、D、L、φ') + box(331, 84, 234, 75, '14 项特征 · 岭回归') + box(631, 84, 234, 75, '预测响应 R̂', '#e4e9ce') + line(273, 121, 318, 121) + line(571, 121, 617, 121)
s2 += text(40, 216, 'min Σ(Rᵢ − xᵢβ)² + λΣβⱼ²；λ ∈ {0.001, 0.01, 0.1, 1, 10}') + text(40, 268, '验证选择 λ → 冻结系数 → 测试只预测；页面显示真实拟合系数。')
s3 = text(30, 39, '候选先过约束，再比较目标', 'font-size="22" font-weight="600"')
s3 += '<path d="M50 254V72H407V254Z" fill="#dbece3"/><path d="M50 72H407V124H50Z" fill="#e5e6de"/><path d="M320 124H407V254H320Z" fill="#e5e6de"/>' + line(50, 254, 430, 254) + line(50, 254, 50, 60)
s3 += text(70, 107, '未越过损伤带') + text(84, 203, '可行域') + text(330, 209, '预算外', 'font-size="16"') + text(196, 287, '穿深 / cm →') + text(36, 54, '孔密 / 孔·m⁻¹')
s3 += text(485, 102, 'C = D[0.8 + (L/25)¹·⁴] + 0.3Nφ') + text(485, 148, 'C ≤ 预算 B；L ≥ 损伤带厚度 + 5 cm') + text(485, 194, 'H = (D/12) × (L/35) ≤ 上限') + text(485, 257, '灰色候选保留排除原因，不能入选。')
s4 = text(30, 39, '把性能和代价放在同一张图里', 'font-size="22" font-weight="600"')
for iy in range(5):
    for ix in range(7):
        color = f'hsl(168 32% {91 - ((ix + 2 * iy) % 7) * 6}%)'
        s4 += f'<rect x="{47 + ix * 47}" y="{75 + iy * 34}" width="43" height="30" rx="3" fill="{color}"/>'
s4 += '<circle cx="210" cy="158" r="10" fill="#e5b157" stroke="#3c5b5c" stroke-width="3"/>' + text(47, 282, '穿深 / cm →；色深为净目标，金点为候选（示意）')
s4 += text(482, 98, 'S = R̂ − αC') + text(482, 143, '搜索 11 孔密 × 10 穿深 × 4 相位') + text(482, 190, '= 440 个实际候选') + text(482, 246, '点击热图格子 → 几何与约束同步更新')
s5 = text(30, 40, '评价只能出现在候选冻结之后', 'font-size="22" font-weight="600"')
s5 += box(32, 79, 239, 64, '模型预测 → 候选冻结') + box(334, 79, 236, 64, '合成响应独立评价', '#eee6d3') + box(633, 79, 234, 64, '人工意见 → JSON') + line(278, 112, 321, 112) + line(578, 112, 620, 112)
s5 += text(37, 203, '同一测试集：代理 RMSE vs 训练均值 RMSE') + text(37, 246, '当前设计：固定方案可行才比较净增量；另计算评价网格目标差') + text(37, 290, '修改输入 → 结果过期 → 重算 → 才可导出当前结果')

metric_html = ''.join(fig(f'图 S{i + 1}｜{step["name"]}', drawing, f'输入与动作：{step["do"]} 输出：{step["effect"]}') for i, (step, drawing) in enumerate(zip(steps, [s1, s2, s3, s4, s5])))

manifest = {
    'id': 's17x-p1-perforation-design', 'sceneId': 'p1', 'title': '射孔参数优化：从试验响应到受约束候选', 'version': '1.0.0', 'updated': '2026-10-24', 'methods': ['opt'],
    'tabs': {
        'background': {'label': '专业背景', 'lede': '射孔几何决定储层与井筒如何沟通。本例把有限的合成试验变为可解释代理，并在预算、越带余量和拥挤约束内搜索候选。', 'judge': [{'label': '业务对象', 'value': '单段储层', 'desc': '局部射孔参数组合'}, {'label': '数据形态', 'value': '合成试验表', 'desc': '储层条件 × 几何 × 响应'}, {'label': '智能方法', 'value': '回归代理', 'desc': '真实拟合、约束搜索'}, {'label': '观察重点', 'value': '可行与收益', 'desc': '固定方案与候选并排对照'}], 'sections': sections},
        'workflow': {'label': '案例流程', 'title': '从试验点到可复核的射孔候选', 'lead': ['先学习响应，再显式筛除不可行参数；候选固定后才评价真实的合成响应。'], 'stats': [['训练', '14 组 / 840 条'], ['验证', '4 组 / 160 条'], ['测试', '6 组 / 240 条']], 'steps': steps, 'metrics': {'title': '逐步骤图解与评价口径', 'html': metric_html}, 'fails': [{'name': '预算紧到无解', 'why': '越带约束需要较大穿深，但预算无法覆盖最小孔密方案。'}, {'name': '储层域外外推', 'why': '渗透率、损伤带或各向异性超出试验范围，代理误差需额外核对。'}]},
        'demo': {'mode': 'page', 'html': 'demo/index.html', 'js': 'demo/demo.js', 'label': '可运行示范', 'intro': '调整储层与约束，真实拟合代理、搜索 440 个组合；查看性能面、候选几何、独立测试误差与人工复核。', 'height': 1200}
    }
}
(ROOT / 'case.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lesson = dict(manifest)
lesson['sources'] = [{'label': label, 'url': url, 'checked': '2026-10-24'} for label, url in sources]
app = (ROOT / 'app.js').read_text(encoding='utf-8')
app = re.sub(r'/\* LESSON_START \*/.*?/\* LESSON_END \*/', lambda _: '/* LESSON_START */ const LESSON = ' + json.dumps(lesson, ensure_ascii=False, separators=(',', ':')) + '; /* LESSON_END */', app, flags=re.S)
(ROOT / 'app.js').write_text(app, encoding='utf-8')
print('p1 content authored:', len(sections), 'background sections,', len(steps), 'workflow figures')
