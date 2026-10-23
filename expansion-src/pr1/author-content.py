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


def svg(label, body, h=330):
    return f'<div class="figure-scroll" tabindex="0" aria-label="图形可横向滚动"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 {h}" role="img" aria-label="{label}" style="width:100%;display:block"><rect width="900" height="{h}" rx="14" fill="#f0f5f1"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="18" fill="#29494d">{body}</g></svg></div>'


def fig(label, body, caption, h=330):
    return f'<figure><h3>{label}</h3>{svg(label, body, h)}<figcaption>{caption}</figcaption></figure>'


sources = [
    ('SLB · Rod Pump Systems', 'https://www.slb.com/resource-library/oilfield-review/defining-series/defining-rod-pumps'),
    ('SLB · Gas interference', 'https://glossary.slb.com/en/terms/g/gas_interference'),
    ('SLB · Dynamometer card', 'https://glossary.slb.com/Terms/d/dynamometer_card.aspx'),
    ('Weatherford · Downhole card calculation', 'https://hs.weatherford.com/knowledge/what-is-the-sucker-rod-pump-downhole-card-calculation-in-petrovisor'),
]

b1 = text(31, 38, '上冲程：吸入泵筒；下冲程：流体通过游动阀', 'font-size="22" font-weight="600"')
for x, up in [(90, True), (390, False)]:
    yp = 94 if up else 176
    b1 += f'<rect x="{x}" y="68" width="96" height="208" rx="7" fill="#dfeae4" stroke="#5b7e7b" stroke-width="3"/><rect x="{x+13}" y="{yp}" width="70" height="25" rx="4" fill="#2e8075"/><path d="M{x+48} 54V{yp}" stroke="#8ca7a1" stroke-width="8"/><circle cx="{x+48}" cy="{yp+12}" r="8" fill="{"#6f8e93" if up else "#d2a654"}"/><path d="M{x+13} 260h70l-35 23z" fill="{"#d2a654" if up else "#6f8e93"}"/>'
    b1 += text(x - 5, 316, '上冲程：固定阀打开' if up else '下冲程：游动阀打开')
b1 += text(596, 88, '固定阀：泵筒底部') + text(596, 131, '游动阀：随柱塞移动') + text(596, 183, '金色：理想开启状态') + text(596, 227, '位移单位 m，载荷单位 kN') + text(596, 279, '这里讨论井下泵功图。')

b2 = text(30, 36, '三种教学形状：看“如何卸载”，也看围成面积', 'font-size="22" font-weight="600"')
for x0, kind, name, color in [(60, 0, '充满泵：近矩形', '#247f73'), (350, 1, '供液不足形：突然卸载', '#bf833b'), (640, 2, '气影响形：渐进卸载', '#5a74ab')]:
    width, height, y0 = 195, 150, 248
    if kind == 0:
        path = f'M{x0} {y0}V{y0-height}H{x0+width}V{y0}Z'
    elif kind == 1:
        path = f'M{x0} {y0}V{y0-height}H{x0+width}L{x0+width*.58} {y0-height}Q{x0+width*.52} {y0-height+8} {x0+width*.52} {y0-8}Q{x0+width*.5} {y0} {x0+width*.43} {y0}Z'
    else:
        path = f'M{x0} {y0}Q{x0+12} {y0-height} {x0+width*.16} {y0-height}H{x0+width}Q{x0+width*.58} {y0-5} {x0} {y0}Z'
    b2 += line(x0 - 10, y0 + 5, x0 + width + 7, y0 + 5) + line(x0 - 10, y0 + 5, x0 - 10, y0 - height - 15) + f'<path d="{path}" fill="{color}" fill-opacity=".1" stroke="{color}" stroke-width="4"/>' + text(x0 - 5, 70, name) + text(x0 + 60, 281, '位移 / m →')
b2 += text(30, 329, '载荷 / kN ↑；供液不足与气影响都可能降低充满程度，过渡形状有助于区分。')

b3 = text(30, 38, '先归一化，再计算可解释的形状特征', 'font-size="22" font-weight="600"')
b3 += '<path d="M58 244V97H378Q330 210 58 244Z" fill="#d5e9df" stroke="#227e74" stroke-width="4"/>'
for x, low in [(126, 236), (194, 214), (262, 180), (330, 128)]:
    b3 += line(x, 97, x, low, '#c18e43', 'stroke-dasharray="5 4"')
b3 += text(58, 285, '不同冲程位置，上 / 下冲程的载荷间距') + text(470, 96, '面积比 = 闭合面积 / (冲程 × 载荷跨度)') + text(470, 142, '循环功 W = |∮ F dx|；kN·m = kJ') + text(470, 188, '还读取卸载宽度、斜率和下支均值。') + text(470, 234, '平移载荷零点，不应改变归一化形状。') + text(470, 280, '循环功不能直接等同产液量。')

sections = [
    {'no': 1, 'en': 'PUMP CYCLE', 'title': '图 B1｜地面抽动杆柱，井下柱塞完成泵循环', 'html': '<p>抽油机通过杆柱带动井下柱塞往复。理想上冲程时游动阀关闭、固定阀打开，泵筒吸入流体；下冲程时固定阀关闭、游动阀打开，流体转移到柱塞上方。把位移与载荷同步记录，便得到一圈示功图。</p>' + fig('理想柱塞泵循环与阀门', b1, '金色表示理想开启阀。循环概念依据 SLB Rod Pump Systems；图形为项目原创。', 350)},
    {'no': 2, 'en': 'DOWNHOLE CARD', 'title': '图 B2｜理想井下泵图近矩形，异常常改变卸载过程', 'html': '<p>充满泵的理想井下图接近矩形。供液不足时，柱塞可能先穿过低压气体，再突然接触液体，形成快速卸载特征；气影响常呈现较缓的气体压缩与阀门开启过程。演示把这些差别转为可观察的曲线形状，而非用类别名称直接决定预测结果。</p>' + fig('充满、供液不足、气影响三种井下教学形状', b2, '三幅图统一单位，仅为形状概念图。供液不足及气影响的过程依据 SLB 官方说明和 gas interference 词条。', 365) + '<p><b>地面图与井下图要区分：</b>地面测得的载荷还受杆柱弹性、摩擦及惯性影响。现场需要结合杆柱、泵速、流体等参数进行井下图换算。本演示直接生成井下泵功图，不实施地面到井下的波动方程换算。</p>'},
    {'no': 3, 'en': 'VISIBLE FEATURES', 'title': '图 B3｜面积很相似，形状仍可能不同', 'html': '<p>只看面积会把不同的卸载方式混在一起。模型读取实际测点，计算闭合面积比、四个冲程位置的载荷间距、下支均值、最大平滑斜率和过渡宽度。所有特征先用训练集均值与标准差缩放，再查找训练图中的近邻。</p>' + fig('从实际曲线提取八项可见形状特征', b3, '面积由闭合多边形真实计算；原图面积以 kJ/循环显示，归一化面积比没有单位。')},
    {'no': 4, 'en': 'MODEL & EVIDENCE', 'title': '让相似案例帮助解释，让独立井组检验结果', 'html': '<p>训练 18 口合成井、162 张图，验证 6 井、54 图，测试 8 井、72 图。每口井共享冲程、载荷尺度与基本形状参数，其循环变体全部留在同一集合。k 由验证集选择；模型与面积阈值基线共用 72 张测试图。拒判留在混淆矩阵的“待复核”列中，同时报告覆盖率和接受集错误率。</p><div class="sources"><p>专业概念核对于 2026-10-24：</p><ul>' + ''.join(f'<li><a href="{url}" target="_blank" rel="noopener">{label}</a></li>' for label, url in sources) + '</ul><p>曲线是本例生成的三类教学形状。图形、模型、指标和导出均在浏览器本地完成。</p></div>'},
]

steps = [
    {'name': '按井组织完整循环', 'role': '图 S1', 'do': '输入：一圈有序的位移与载荷点；动作：按独立井组划分训练、验证与测试，每井的全部循环变体放在同一集合。', 'effect': '18 / 6 / 8 个独立井组，194 点一圈，单位为 m 与 kN。', 'trap': '先明确井下泵功图类型；地面图不能直接套用这里的形状说明。'},
    {'name': '归一化与提取形状', 'role': '图 S2', 'do': '输入：实际曲线点；动作：按自身位移和载荷跨度归一化，计算面积、支间距、卸载斜率等八项特征，再用训练统计量标准化。', 'effect': '可见的归一化曲线、面积比、循环功和八项特征。', 'trap': '零点平移不该变成工况特征；面积小也可能由多种机制引起。'},
    {'name': '学习近邻与面积基线', 'role': '图 S3', 'do': '输入：162 张训练图的特征与类别；动作：学习特征尺度，验证选择 k=3/5/7/9，同时验证选择两个面积阈值。', 'effect': '冻结近邻库、k、域范围和阈值；每次展示真实最近邻。', 'trap': '按源井整体留出，测试图不改变训练尺度；支持度是投票占比。'},
    {'name': '分类、拒判与同分母评价', 'role': '图 S4', 'do': '输入：72 张测试图可见点；动作：分别运行 kNN 与面积规则；近邻分散、形状距离过大或噪声过强时转复核。', 'effect': '带待复核列的混淆矩阵、宏 F1、各类召回、覆盖率和接受集错误率。', 'trap': '拒判仍保留在真值类别分母；全拒判时接受集错误率显示不适用。'},
    {'name': '沿循环复核与导出', 'role': '图 S5', 'do': '输入：当前曲线、同步泵循环、近邻形状和模型结果；动作：拖动循环点，记录人工意见，导出当前 JSON。', 'effect': '观测、模型、评价与人工记录分开保存，带数据版本和来源。', 'trap': '改变输入撤销当前确认并使结果过期；人工意见不覆盖模型分数。'},
]

s1 = text(30, 38, '按井留出，保留每口井内部的循环相似性', 'font-size="22" font-weight="600"')
for x, n, cards, label, color in [(36, 18, 162, '训练', '#d5e8df'), (330, 6, 54, '验证', '#dce5ed'), (624, 8, 72, '测试', '#f0e3cb')]:
    s1 += box(x, 81, 240, 130, f'{label}：{n} 井 / {cards} 图', color) + text(x + 16, 190, '每井三类 × 三圈')
s1 += text(35, 263, '同井共享冲程、载荷尺度、形状参数；整井分组，变体不跨集合。') + text(35, 304, '一圈 194 个实际采样点：上冲程 97 点 + 下冲程 97 点。')
s2 = text(30, 38, '从可见载荷—位移曲线计算，不读取类别', 'font-size="22" font-weight="600"')
s2 += '<path d="M48 248V90H286Q242 224 48 248Z" fill="#cfe5da" stroke="#267e73" stroke-width="4"/>' + text(47, 285, '原始单位：m、kN') + box(355, 103, 220, 82, '面积比 + 7 项形状') + box(635, 103, 226, 82, '训练均值 / 标准差') + line(295, 144, 343, 144) + line(583, 144, 621, 144)
s2 += text(354, 236, 'zⱼ = (xⱼ − μ训练,ⱼ) / σ训练,ⱼ') + text(354, 282, '当前图仅变换，不重新拟合 μ 与 σ。')
s3 = text(30, 38, '最近的训练图，给出可检查的相似依据', 'font-size="22" font-weight="600"')
for x, y, color in [(118, 100, '#238577'), (194, 130, '#238577'), (125, 187, '#238577'), (315, 190, '#c18a3d'), (355, 230, '#c18a3d'), (260, 90, '#5b76ac')]:
    s3 += f'<circle cx="{x}" cy="{y}" r="10" fill="{color}"/>'
s3 += '<circle cx="177" cy="163" r="8" fill="#e9b758" stroke="#3d5356" stroke-width="2"/><circle cx="177" cy="163" r="68" stroke="#668c85" fill="none" stroke-dasharray="5 5"/>'
s3 += text(40, 299, '二维特征空间投影（概念图）') + text(453, 100, '实际距离使用全部 8 个训练标准化特征。') + text(453, 149, '近邻权重 w = 1 / (距离 + 0.08)') + text(453, 198, '支持度 = 获胜类权重 / 全部近邻权重') + text(453, 254, '用验证宏 F1 选 k；面积基线独立选阈值。')
s4 = text(30, 38, '推理先完成，评价真值之后才进入指标', 'font-size="22" font-weight="600"')
for i, label in enumerate(['充满', '供液不足', '气影响', '待复核']):
    s4 += text(93 + i * 84, 95, label, 'font-size="16"')
    for j in range(3):
        s4 += f'<rect x="{80+i*84}" y="{110+j*49}" width="78" height="43" rx="4" fill="{"#d2b77c" if i==3 else "#d0e4d9" if i==j else "#e2ebe4"}"/>'
s4 += text(48, 304, '混淆矩阵保留待复核列（无预填成绩）') + text(466, 105, '72 张测试图，两种方法用相同分母。') + text(466, 155, '覆盖率 = 自动接受 / 72') + text(466, 205, '接受集错误率 = 错误接受 / 自动接受') + text(466, 267, '无接受样本 → 错误率不适用')
s5 = text(30, 38, '曲线上的点，对应泵循环中的位置', 'font-size="22" font-weight="600"')
s5 += '<path d="M55 240V87H325Q280 221 55 240Z" fill="#d4e8dd" stroke="#237f73" stroke-width="4"/><circle cx="222" cy="180" r="9" fill="#e5b25a" stroke="#3d5356" stroke-width="2"/>'
s5 += line(336, 164, 402, 164) + box(418, 120, 210, 82, '人工意见 · 独立记录', '#e1e6d7') + line(639, 164, 682, 164) + box(694, 120, 168, 82, '当前 JSON')
s5 += text(46, 293, '位置滑块只移动观察点；噪声、零点、阈值变化则使结果过期。')

metrics_html = ''.join(fig(f'图 S{i+1}｜{step["name"]}', drawing, f'输入与动作：{step["do"]} 输出：{step["effect"]}') for i, (step, drawing) in enumerate(zip(steps, [s1, s2, s3, s4, s5])))
manifest = {
    'id': 's17x-pr1-pump-card', 'sceneId': 'pr1', 'title': '抽油机井工况诊断：从井下泵功图读形状', 'version': '1.0.0', 'updated': '2026-10-24', 'methods': ['cv'],
    'tabs': {
        'background': {'label': '专业背景', 'lede': '抽油机井把一个泵循环压缩成载荷—位移闭合图。理解理想循环与不同卸载形状后，再用可解释特征和训练近邻辅助复核。', 'judge': [{'label': '业务对象', 'value': '抽油机井', 'desc': '井下泵循环的形状判断'}, {'label': '数据形态', 'value': '井下泵功图', 'desc': '载荷 kN × 位移 m'}, {'label': '智能方法', 'value': '形状 kNN', 'desc': '实际特征与真实近邻'}, {'label': '观察重点', 'value': '卸载形状', 'desc': '全分母评价与待复核'}], 'sections': sections},
        'workflow': {'label': '案例流程', 'title': '从原始循环到可检查的形状判断', 'lead': ['按井留出，先提取可见形状，再比较近邻与面积基线；模型原始结果和人工复核分开保存。'], 'stats': [['训练', '18 井 / 162 图'], ['验证', '6 井 / 54 图'], ['测试', '8 井 / 72 图']], 'steps': steps, 'metrics': {'title': '逐步骤图解与指标口径', 'html': metrics_html}, 'fails': [{'name': '噪声淹没卸载特征', 'why': '高噪声改变面积与斜率，质量门槛将图转人工复核。'}, {'name': '面积近似、机制不同', 'why': '供液不足与气影响形可能面积重叠，需要卸载宽度及实际曲线。'}]},
        'demo': {'mode': 'page', 'html': 'demo/index.html', 'js': 'demo/demo.js', 'label': '可运行示范', 'intro': '切换教学工况，拖动泵循环、增加噪声或零点偏移，查看真实特征、训练近邻和 72 张独立测试图的评价。', 'height': 1200}
    }
}
(ROOT / 'case.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lesson = dict(manifest)
lesson['sources'] = [{'label': label, 'url': url, 'checked': '2026-10-24'} for label, url in sources]
app = (ROOT / 'app.js').read_text(encoding='utf-8')
app = re.sub(r'/\* LESSON_START \*/.*?/\* LESSON_END \*/', lambda _: '/* LESSON_START */ const LESSON = ' + json.dumps(lesson, ensure_ascii=False, separators=(',', ':')) + '; /* LESSON_END */', app, flags=re.S)
(ROOT / 'app.js').write_text(app, encoding='utf-8')
print('pr1 content authored:', len(sections), 'background sections,', len(steps), 'workflow figures')
