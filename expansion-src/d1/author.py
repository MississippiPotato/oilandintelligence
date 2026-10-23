"""Author the two owned, self-contained case sources. No repository-wide writes."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PAL = {'ink':'#17343f','teal':'#107d76','sand':'#c7954d','blue':'#648bb0','coral':'#cc654f','pale':'#edf5f1'}
def svg(title, body, height=300):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 {height}" role="img" aria-label="{title}"><rect width="900" height="{height}" rx="18" fill="#f1f6f2"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="20" fill="#17343f">{body}</g></svg>'
def t(x,y,s,size=20,fill='#17343f'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}">{s}</text>'
def box(x,y,w,label,fill='#d7eae2'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="60" rx="10" fill="{fill}"/>{t(x+16,y+37,label)}'
def line(x1,y1,x2,y2,color='#107d76',dash=''):
    return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}"/>'
def step(name,inp,action,out,trap,body):
    return dict(name=name,input=inp,action=action,output=out,trap=trap,svg=svg(name,body))

d1_bg=[
    ('先看钻头：三种可调参数共同作用',
     '钻压是钻头受到的轴向载荷；转速决定旋转频率；流量影响循环。岩石强度也是输入条件，所以同一组参数不会在所有井段产生相同钻速。',
     svg('钻头、钻压、转速与钻井液循环',
         '<path d="M390 32V185H510V32M390 185L425 220H475L510 185" fill="#d8e7e1" stroke="#17343f" stroke-width="5"/>'
         '<path d="M417 30V165M483 165V30" stroke="#648bb0" stroke-width="7"/><path d="M350 240H550" stroke="#c7954d" stroke-width="18"/>'
         +t(40,60,'WOB · 钻压 / kN',24)+line(230,65,385,130)+t(582,65,'RPM · 转速 / r/min',24)+line(578,85,510,125)
         +t(45,190,'Q · 流量 / L/s',24)+line(220,185,410,145)+t(570,200,'UCS · 岩石强度 / MPa',24)+line(565,215,515,240)
         +t(280,284,'输入参数 → 破岩响应 → ROP / m·h⁻¹'))),
    ('钻速用什么单位？从深度—时间图理解',
     '机械钻速 ROP 是有效钻进时段内的进尺速度：30 分钟钻进 15 m，对应 30 m/h。停钻和接单根时间单独记录；这里展示同一工况下的教学稳态响应。',
     svg('深度随时间增加与钻速斜率',
         line(100,55,100,248,'#17343f')+line(100,248,790,248,'#17343f')
         +'<path d="M100 240L370 160L510 160L760 75" stroke="#107d76" stroke-width="6" fill="none"/>'
         +t(25,40,'进尺 / m')+t(685,285,'时间 / min')+t(145,215,'斜率 = ROP',24)+t(380,140,'停钻段',22,'#cc654f')
         +t(555,55,'15 m ÷ 0.5 h = 30 m/h',24)+line(370,160,510,160,'#cc654f','6 5'))),
    ('寻找快的区域，同时看到边界',
     '学习代理把多组历史工况映射成钻速曲面。搜索只在声明的参数网格内进行；泵压、扭矩采用页面列出的透明教学代理计算。推荐点与越界点一起显示，避免只盯住最高值。',
     svg('钻压转速响应面与受约束搜索',
         ''.join(f'<rect x="{90+i*53}" y="{55+j*31}" width="50" height="28" rx="3" fill="{["#d9e9df","#a3d0ba","#63b29b","#238b7e","#12635f"][min(4,(i+j)//3)]}" opacity="{.35 if i>8 or j<1 else 1}"/>' for i in range(12) for j in range(6))
         +line(560,45,560,253,'#cc654f','7 5')+t(590,44,'钻压上限',22,'#cc654f')
         +'<circle cx="534" cy="194" r="15" fill="none" stroke="#17343f" stroke-width="5"/>'
         +t(100,281,'WOB →')+t(23,82,'RPM')+t(662,235,'○ 可行候选',23)+t(662,270,'浅色：约束排除',20))),
]
d1_steps=[
    step('按整井分开数据','13 口教学井的工况与钻速','8 口训练、3 口验证、2 口测试；保留整井身份','512 / 192 / 128 条记录','随机拆散同井样本会低估迁移难度。',
         box(40,55,245,'8 口训练井 · 512 点')+box(325,55,245,'3 口验证井 · 192 点')+box(610,55,245,'2 口测试井 · 128 点')
         +''.join(f'<path d="M{x} 150V225" stroke="{c}" stroke-width="8"/>' for x,c in [(100,'#107d76'),(145,'#107d76'),(190,'#107d76'),(390,'#c7954d'),(440,'#c7954d'),(680,'#648bb0'),(735,'#648bb0')])
         +t(42,275,'同一口井的记录只属于一个集合；测试井不参与拟合与选择。')),
    step('拟合一个可解释的钻速代理','训练井 WOB、RPM、Q、UCS 和 ROP','训练集标准化，使用一次项、平方项和交互项拟合岭回归','冻结标准化参数与回归系数','系数说明统计关系，不能直接当作因果效应。',
         line(80,220,600,220,'#17343f')+line(80,220,80,55,'#17343f')
         +'<path d="M90 210Q310 45 590 85" stroke="#107d76" stroke-width="5" fill="none"/>'
         +''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="#c7954d"/>' for x,y in [(130,180),(200,151),(270,112),(340,99),(430,83),(510,76)])
         +t(640,95,'10 个输入特征',24)+t(640,140,'β 从训练井学习',22)+t(640,185,'惩罚过大的系数',22)+t(90,275,'真实求解 β；没有预存预测表。')),
    step('用验证井选择正则强度','4 个候选 λ 与同一验证集','分别计算验证 RMSE，保留误差最小的模型','λ、4 个验证分数和基线系数','测试指标只报告，不反过来自动选择模型。',
         ''.join(box(40+i*210,55,190,f'λ = {v}') for i,v in enumerate(['0.01','0.1','1','10']))
         +''.join(f'<rect x="{87+i*210}" y="{215-h}" width="95" height="{h}" rx="7" fill="{c}"/>' for i,(h,c) in enumerate([(80,'#107d76'),(83,'#78aa95'),(101,'#78aa95'),(128,'#78aa95')]))
         +t(50,277,'图中高度示意比较方式；演示下方显示本次实际 RMSE。')),
    step('在可行域内搜索参数','冻结代理 + WOB/RPM/Q 网格与 5 项约束','逐点预测 ROP；计算泵压、扭矩；排序合格点','2,145 点、可行点计数与候选设置','关闭约束后仍显示违反项；不能隐藏代价。',
         box(35,40,245,'2,145 个参数点')+box(330,40,245,'约束逐项检查')+box(625,40,245,'按预测 ROP 排序')
         +'<path d="M80 190H790" stroke="#17343f" stroke-width="3"/><path d="M500 125V245" stroke="#cc654f" stroke-dasharray="8 6" stroke-width="3"/>'
         +''.join(f'<circle cx="{90+i*45}" cy="{190-(i%4)*13}" r="9" fill="{ "#107d76" if i<9 else "#cc654f"}"/>' for i in range(16))
         +t(55,278,'左侧合格点进入排序；被排除点保留具体原因。')),
    step('比较留出误差，留下复核依据','两口测试井与冻结推荐点','同数据比较多变量模型与单 WOB 基线；推荐冻结后再计算教学实现值','RMSE、MAE、误差位置、约束余量与人工记录','代理高估的点要检查；模拟实现值与代理预测分列。',
         box(40,40,250,'模型 / 单 WOB 基线')+box(330,40,250,'同 128 点计算误差')+box(620,40,240,'人工复核另存')
         +line(80,210,820,210,'#17343f')+''.join(f'<path d="M{x} 210V{y}" stroke="{c}" stroke-width="16"/>' for x,y,c in [(170,150,'#107d76'),(260,100,'#c7954d'),(440,170,'#107d76'),(530,130,'#c7954d')])
         +t(90,278,'输入改变 → 结果待重算；重算完成 → 才能导出当前结果。')),
]

w4_bg=[
    ('测井是沿井深连续测量，不是一盘岩屑照片',
     '仪器沿井眼记录地层响应，得到深度对齐的曲线。自然伽马 GR、深电阻率 Rt、体积密度 RHOB、中子孔隙度 NPHI 共同提供线索；本例每 0.5 m 一个观测点，深度向下增加。',
     svg('仪器地层响应与多道深度曲线',
         ''.join(f'<rect x="40" y="{35+i*63}" width="210" height="63" fill="{c}"/>' for i,c in enumerate(['#e4c68a','#afbac2','#e9e2cd']))
         +'<rect x="125" y="30" width="37" height="200" rx="12" fill="#17343f"/><circle cx="143" cy="112" r="11" fill="#107d76"/>'
         +''.join(line(x,40,x,220,'#aec8bc') for x in [340,470,600,730])
         +''.join(f'<path d="M{x} 45L{x+22} 85L{x-10} 128L{x+34} 170L{x+12} 219" stroke="{c}" stroke-width="4" fill="none"/>' for x,c in [(340,'#c7954d'),(470,'#107d76'),(600,'#648bb0'),(730,'#cc654f')])
         +t(320,265,'GR / API')+t(450,265,'Rt / Ω·m')+t(575,265,'RHOB')+t(723,265,'NPHI')+t(43,281,'MD ↓'))),
    ('一条 GR 曲线为何不够？',
     '泥质岩通常具有较高自然放射性，但洁净砂岩与碳酸盐岩都可能低 GR；富含放射性矿物的岩石又可能偏高。交会图把一个数变成多个观测的组合，帮助解释同 GR、不同岩性的点。',
     svg('同伽马不同密度的交会关系',
         line(100,238,790,238,'#17343f')+line(100,238,100,45,'#17343f')+t(700,278,'GR / API')+t(26,30,'RHOB / g·cm⁻³')
         +''.join(f'<circle cx="{x}" cy="{y}" r="10" fill="{c}" opacity=".85"/>' for x,y,c in [(200,187,'#c7954d'),(240,175,'#c7954d'),(265,202,'#c7954d'),(200,95,'#648bb0'),(240,105,'#648bb0'),(285,85,'#648bb0'),(660,142,'#8f9ca6'),(700,118,'#8f9ca6'),(650,95,'#8f9ca6')])
         +line(235,48,235,238,'#cc654f','6 5')+t(285,60,'同 GR，密度与孔隙响应不同',22)+t(355,115,'● 灰岩',23,'#648bb0')+t(355,200,'● 砂岩',23,'#a97832')+t(580,205,'● 泥岩',23,'#667681'))),
    ('曲线也受流体、井眼和仪器条件影响',
     '电阻率包含孔隙流体的信息；密度与中子曲线也受孔隙、气体和井眼影响。因而“像训练样本”只是分类依据。近邻距离过大或邻居意见分散时进入复核，不能把支持票数称作现场概率。',
     svg('干扰因素、近邻支持与复核',
         box(35,45,245,'气体 / 井眼 / 噪声')+box(330,45,245,'四道观测共同改变')+box(625,45,240,'近邻 + 距离检查')
         +''.join(f'<circle cx="{x}" cy="{y}" r="11" fill="{c}"/>' for x,y,c in [(340,175,'#c7954d'),(385,190,'#c7954d'),(420,160,'#648bb0'),(465,180,'#648bb0'),(540,212,'#cc654f')])
         +'<circle cx="400" cy="180" r="60" fill="none" stroke="#107d76" stroke-dasharray="8 5" stroke-width="3"/>'
         +t(55,230,'观测变了，结论也要重算',22)+t(590,197,'邻居分歧 / 远离样本',22)+t(590,239,'→ 待复核',25,'#cc654f'))),
]
w4_steps=[
    step('按整口井留出','10 口教学井及每点岩性标签','6 口训练、2 口验证、2 口测试，保留深度顺序','720 / 240 / 320 点与完整井身份','同井相邻点不能分散到训练和测试两边。',
         ''.join(box(35+i*290,45,260,s) for i,s in enumerate(['训练井 × 6','验证井 × 2','测试井 × 2']))
         +''.join(f'<path d="M{x} 145V230" stroke="{c}" stroke-width="10"/>' for x,c in [(85,'#107d76'),(130,'#107d76'),(175,'#107d76'),(370,'#c7954d'),(420,'#c7954d'),(665,'#648bb0'),(715,'#648bb0')])
         +t(40,278,'测试曲线与测试真值分开保存；分类函数只读取曲线。')),
    step('统一通道和量纲','GR、Rt、RHOB、NPHI；用户选择保留通道','Rt 取 log₁₀，均值与标准差只在训练井拟合','标准化特征及冻结参数','关闭通道时，训练、验证、测试都要使用相同子集。',
         box(35,45,260,'API / Ω·m / g·cm⁻³')+box(330,45,245,'训练均值 μ、标准差 σ')+box(620,45,245,'z = (x − μ) / σ')
         +''.join(f'<rect x="{90+i*180}" y="{235-h}" width="70" height="{h}" rx="7" fill="{c}"/>' for i,(h,c) in enumerate([(115,'#c7954d'),(40,'#107d76'),(74,'#648bb0'),(55,'#cc654f')]))
         +t(40,279,'避免 API 数值天然较大而压过小数孔隙度。')),
    step('在验证井选择 k 和 GR 规则','k ∈ {3,5,9,15}；一组 GR 双阈值','比较验证宏 F1，冻结 k 与单 GR 基线阈值','k、验证分数、距离阈值、GR 规则','交互改 k 属于探索，原验证记录仍可查看。',
         ''.join(box(35+i*215,50,195,f'k = {k}') for i,k in enumerate([3,5,9,15]))
         +line(80,195,800,195,'#17343f')+''.join(f'<circle cx="{x}" cy="195" r="12" fill="#107d76"/>' for x in [140,330,520,710])
         +t(60,260,'近邻数改变 → 边界敏感性与平滑程度改变；分数由当前验证井计算。')),
    step('逐点分类并显示依据','测试井四道观测与冻结近邻库','训练尺度下计算距离，邻居投票；支持低或距离大则拒判','岩性色柱、原始提议、支持票数、近邻来源','支持度是邻居票数占比，没有概率校准。',
         ''.join(f'<circle cx="{x}" cy="{y}" r="13" fill="{c}"/>' for x,y,c in [(180,145,'#c7954d'),(230,100,'#c7954d'),(270,175,'#c7954d'),(360,130,'#648bb0'),(420,190,'#648bb0')])
         +'<circle cx="255" cy="145" r="72" stroke="#107d76" stroke-width="3" fill="none" stroke-dasharray="8 6"/><path d="M245 135L265 155M245 155L265 135" stroke="#17343f" stroke-width="5"/>'
         +t(500,100,'× 当前测试点',23)+t(500,150,'● 真实训练近邻',23)+t(500,205,'输出：提议类别 + 复核原因',23)),
    step('沿深度复核并计算评价','全部 320 点预测与独立测试标签','与单 GR 基线同分母比较；错误、拒判点可定位；人工意见另存','宏 F1、各类召回、覆盖率和 3×4 混淆矩阵','拒判点仍计入召回/F1，不能通过删难点提高成绩。',
         ''.join(f'<rect x="{80+j*65}" y="{55+i*50}" width="60" height="45" rx="4" fill="{ "#107d76" if i==j else "#d7e5df"}"/>' for i in range(3) for j in range(4))
         +t(85,245,'砂岩  泥岩  灰岩  复核',20)+t(450,100,'模型原结果保留',24)+t(450,151,'人工标签与依据另存',24)+t(450,204,'输入变化 → 当前复核失效',24)),
]

CSS='''
:root{color-scheme:light;--ink:#17343f;--muted:#536c73;--teal:#107d76;--sand:#c7954d;--blue:#648bb0;--coral:#c05e49;--line:#d6e2dc;--paper:#fbfcf8;--pale:#edf5f1;--shadow:0 16px 44px #17343f0a}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:18px/1.75 system-ui,"Microsoft YaHei","PingFang SC",sans-serif}button,input,select,textarea{font:inherit}button,select,input,textarea{border:1px solid #bdcfc7;border-radius:12px;background:#fff;color:var(--ink)}button{padding:10px 19px;cursor:pointer;font-weight:650;transition:background .15s,box-shadow .15s}button:hover{background:#e8f2ec}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #5998bb;outline-offset:3px}button:disabled{opacity:.45;cursor:not-allowed}.primary{background:var(--teal);border-color:var(--teal);color:#fff}.primary:hover{background:#08645e}select,input[type=number]{padding:8px 12px;min-height:48px;max-width:100%}input[type=range]{width:100%;accent-color:var(--teal)}input[type=checkbox]{width:20px;height:20px;accent-color:var(--teal);vertical-align:middle;margin-right:8px}textarea{display:block;width:100%;padding:12px;resize:vertical}a{color:#086c69}header{max-width:1320px;margin:auto;padding:24px 28px 18px;display:flex;justify-content:space-between;align-items:center;gap:20px}.brand{font-size:26px;letter-spacing:.05em;font-weight:800}.brand small{font-size:16px;letter-spacing:0;font-weight:500;margin-left:16px;color:var(--muted)}.stage{font-size:16px;color:var(--muted)}main{max-width:1320px;margin:auto;padding:0 28px 60px}.hero{position:relative;overflow:hidden;border-radius:26px;padding:32px 42px;background:#153c43;color:white;box-shadow:var(--shadow)}.hero:after{content:"";position:absolute;width:400px;height:400px;border:1px solid #ffffff22;border-radius:50%;right:-100px;top:-200px;box-shadow:0 0 0 40px #ffffff06,0 0 0 80px #ffffff05}.eyebrow{font-size:16px;letter-spacing:.12em;color:#b2d9cd;margin-bottom:8px}h1{font-size:clamp(30px,3.2vw,43px);line-height:1.35;margin:0 0 14px;max-width:1000px;letter-spacing:-.02em}h2{font-size:25px;line-height:1.45;margin:0 0 14px}h3{font-size:21px;margin:12px 0}.hero p{font-size:19px;max-width:950px;line-height:1.8;margin:0;color:#dfede6}.facts{display:flex;gap:24px;flex-wrap:wrap;margin-top:22px;font-size:16px;color:#c5e0d6}.facts span:before{content:"•";margin-right:8px;color:#d7b374}nav[aria-label="案例内容"]{display:flex;gap:9px;border-bottom:1px solid var(--line);padding:23px 0 16px;margin-bottom:25px}nav[aria-label="案例内容"] button{border:0;background:none;border-radius:10px;padding:11px 25px;font-size:20px;color:#58716e}nav[aria-label="案例内容"] button[aria-pressed=true]{background:#dfeee6;color:#095e59}section[hidden],article[hidden],div[hidden],figure[hidden]{display:none!important}.chapter{padding:22px 0 30px;border-bottom:1px solid var(--line);margin-bottom:16px}.chapter p{max-width:1080px;font-size:19px}.chapter figure{margin:22px 0 0}.chapter figcaption{font-size:16px;color:var(--muted);margin-top:8px}.diagram{overflow-x:auto;border-radius:18px;max-width:100%}.diagram svg{display:block;width:100%;min-width:650px;height:auto}.stepnav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}.stepnav button{font-size:17px}.stepnav button[aria-pressed=true]{background:#153c43;color:#fff;border-color:#153c43}.step-details{display:grid;grid-template-columns:1fr 1.35fr;gap:24px;align-items:start}.step-details dl{margin:0}.step-details dt{font-size:15px;color:var(--muted);letter-spacing:.08em;margin-top:10px}.step-details dd{margin:3px 0 16px;font-size:19px}.step-trap{border-left:4px solid var(--sand);padding:9px 16px;background:#faf4e8}.toolbar{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:20px}.toolbar label{min-width:270px;flex:1}.control-label{display:block;font-size:16px;color:var(--muted);margin-bottom:5px}.status{border-radius:12px;background:#edf4ef;border:1px solid #d3e4d9;padding:12px 18px;margin:16px 0 20px;font-size:17px}.status.stale{background:#fff4df;border-color:#e9cd8b;color:#845e18}.status.error{background:#fceee9;color:#9b3828;border-color:#d5a699}.strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:24px 0 30px}.metric{padding:17px 19px;border-right:1px solid var(--line)}.metric:last-child{border:0}.metric strong{font-size:30px;display:block;font-weight:760;line-height:1.45}.metric span,.metric small{display:block;color:var(--muted);font-size:15px}.metric small{margin-top:4px}.split{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr);gap:26px;align-items:start}.equal{grid-template-columns:repeat(2,minmax(0,1fr))}.panel{min-width:0;margin-bottom:26px;padding:24px;border:1px solid var(--line);border-radius:20px;background:white;box-shadow:var(--shadow)}.panel.plain{box-shadow:none}.panel p{margin:8px 0 16px}.panel .sub,.sub{color:var(--muted);font-size:16px;line-height:1.65}.controls{box-shadow:none;padding:19px 23px;background:#f3f7f2}.controls summary{font-size:18px;font-weight:650;cursor:pointer}.controlgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px 24px;margin-top:18px}.controlgrid label{display:block;min-width:0}.controlgrid output{float:right;color:var(--teal);font-weight:700}summary{cursor:pointer}label{font-size:17px}label>select{width:100%}.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.row>*{min-width:0}.chart-shell{overflow-x:auto;max-width:100%;min-width:0}.chart-shell svg{display:block;width:100%;min-width:620px;height:auto}.chart-shell.logs svg{min-width:880px}.chart-shell svg text{font-family:system-ui,"Microsoft YaHei",sans-serif;fill:var(--ink)}.legend{display:flex;gap:18px;flex-wrap:wrap;color:var(--muted);font-size:15px;margin:12px 0}.swatch{width:13px;height:13px;border-radius:3px;display:inline-block;margin-right:7px;vertical-align:middle}.callout{background:#edf5f1;border-radius:14px;padding:16px 18px;margin:16px 0}.callout strong{font-size:22px}.callout.warn{background:#fff3df}.kv{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-top:1px solid var(--line);padding:10px 0}.kv strong{text-align:right}.kv span{color:var(--muted)}table{width:100%;border-collapse:collapse;font-size:16px;text-align:left}td,th{padding:10px 9px;border-bottom:1px solid var(--line);font-weight:450;vertical-align:top}th{font-size:15px;color:var(--muted);font-weight:650;background:#f4f7f2}.table-scroll{max-width:100%;overflow:auto}.tag{display:inline-block;font-size:15px;border-radius:20px;padding:3px 11px;background:#e8f2ec;margin:2px}.tag.warn{background:#fff0da;color:#855815}.tag.bad{background:#f9e7df;color:#9d4231}.minor{font-size:15px;color:var(--muted)}.review-record{padding:13px 0;border-bottom:1px solid var(--line)}.review-record b{font-size:17px}.review-record p{font-size:16px;white-space:pre-wrap}.empty{padding:25px;color:var(--muted);background:#f7f9f5;border-radius:12px}.sources{font-size:16px;line-height:1.8;padding-top:22px;border-top:1px solid var(--line)}footer{padding:25px 28px 35px;max-width:1320px;margin:auto;font-size:15px;color:var(--muted);border-top:1px solid var(--line)}.bottom-actions{margin-top:22px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}.matrix td{text-align:center;font-size:18px;font-variant-numeric:tabular-nums}.matrix th{white-space:nowrap}.result-stale{opacity:.62}.result-stale button{pointer-events:none}.neighbor-bar{height:8px;background:#e1ece5;border-radius:10px;overflow:hidden;margin-top:5px}.neighbor-bar i{display:block;height:100%;background:var(--teal)}.cursor-summary{border-top:2px solid var(--teal);padding-top:14px}.feature-badges{display:flex;gap:8px;flex-wrap:wrap}.feature-badges span{background:#eff5f0;padding:4px 10px;border-radius:8px;font-size:15px}.flow-footer{margin-top:24px;display:flex;gap:12px;align-items:center}.grid-message{font-size:16px;margin-top:12px;color:var(--muted)}@media(max-width:950px){.split,.step-details{grid-template-columns:minmax(0,1fr)}.controlgrid{grid-template-columns:repeat(2,minmax(0,1fr))}.equal{grid-template-columns:1fr}.hero{padding:27px}.strip{grid-template-columns:repeat(2,minmax(0,1fr))}.metric:nth-child(2){border-right:0}.metric:nth-child(-n+2){border-bottom:1px solid var(--line)}}@media(max-width:560px){body{font-size:18px}header{padding:18px 18px 12px}.brand{font-size:23px}.brand small{display:block;font-size:15px;margin:0}.stage{font-size:14px;max-width:130px;text-align:right}main{padding:0 16px 36px}.hero{border-radius:20px;padding:23px 22px}.hero p{font-size:18px}.facts{gap:8px 16px;font-size:14px}.eyebrow{font-size:14px}nav[aria-label="案例内容"]{gap:4px;justify-content:space-between;padding:16px 0 13px}nav[aria-label="案例内容"] button{font-size:17px;padding:9px 9px}.panel{padding:18px;border-radius:16px}.toolbar label{min-width:100%}.toolbar button{flex:1}.controlgrid{gap:16px 14px}.controlgrid label{font-size:16px}.strip{margin:18px 0 22px}.metric{padding:14px}.metric strong{font-size:26px}.metric small,.metric span{font-size:14px}h2{font-size:23px}h3{font-size:20px}.chapter p{font-size:18px}.stepnav button{font-size:16px;padding:8px 12px}.diagram svg{min-width:650px}.kv{font-size:16px}.bottom-actions button{width:100%}.flow-footer{flex-wrap:wrap}.sources{font-size:16px}button{min-height:45px}.row>label{width:100%}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
'''

D1_LAB='''
<div class="toolbar"><label><span class="control-label">教学情景</span><select id="preset"><option value="default">常规井段 · 域内比较</option><option value="noise">测量波动 · 放大噪声</option><option value="tight">收紧泵压和扭矩约束</option><option value="domain">迁移挑战 · 更硬地层与钻头磨损</option></select></label><button id="run" class="primary">运行预测与寻优</button><button id="reset">恢复默认</button></div>
<details class="panel controls" open><summary>当前工况与搜索约束</summary><div class="controlgrid">
<label>钻压 / kN <output for="wob" id="wob-out">90</output><input id="wob" type="range" min="40" max="160" step="10" value="90"></label>
<label>转速 / r/min <output for="rpm" id="rpm-out">120</output><input id="rpm" type="range" min="60" max="200" step="10" value="120"></label>
<label>流量 / L/s <output for="flow" id="flow-out">26</output><input id="flow" type="range" min="18" max="38" step="2" value="26"></label>
<label>岩石强度 / MPa <output for="ucs" id="ucs-out">60</output><input id="ucs" type="range" min="35" max="115" step="5" value="60"></label>
<label>WOB 上限 / kN<input id="maxWob" type="number" min="40" max="160" step="5" value="125"></label><label>RPM 上限 / r/min<input id="maxRpm" type="number" min="60" max="200" step="5" value="170"></label>
<label>Q 上限 / L/s<input id="maxFlow" type="number" min="18" max="38" step="2" value="32"></label><label>泵压上限 / MPa<input id="maxPressure" type="number" min="8" max="30" step=".5" value="19.5"></label>
<label>扭矩上限 / kN·m<input id="maxTorque" type="number" min="4" max="20" step=".5" value="9"></label><label>测试噪声 / m/h <output for="noise" id="noise-out">2</output><input id="noise" type="range" min="0" max="10" step=".5" value="2"></label>
<label class="row"><input id="constrain" type="checkbox" checked>搜索时启用全部约束</label></div></details>
<div id="status" class="status" role="status" aria-live="polite">准备计算</div><div id="metrics" class="strip"></div>
<div id="results"><div class="split"><article class="panel"><h2>钻速响应面：最高值在哪，边界又在哪？</h2><p class="sub">横轴钻压、纵轴转速；颜色是学习代理的 ROP。点击格点可改变当前工况，重算后更新候选。</p><div id="surface" class="chart-shell"></div><div class="legend"><span>◆ 当前工况</span><span>○ 当前流量片最优</span><span>╱ 约束排除</span></div><p id="grid-note" class="grid-message"></p></article><article class="panel"><h2>推荐点与约束余量</h2><div id="recommendation"></div><div id="margins"></div><button id="adopt" disabled>采用候选参数，再重算</button></article></div>
<div class="split equal"><article class="panel"><h2>同两口留出井，谁预测得更准？</h2><p class="sub">每点是一条测试记录；虚线是预测=观测。两个方法使用完全相同的 128 个评价点。</p><div id="prediction-chart" class="chart-shell"></div></article><article class="panel"><h2>误差最大的记录，回到真实输入</h2><div id="residuals" class="chart-shell"></div><label>选中测试记录<select id="test-row"></select></label><div id="point-detail" class="cursor-summary"></div></article></div>
<div class="split equal"><article class="panel"><h2>学习过程与数据分工</h2><div id="learning"></div><details><summary>透明的教学响应与机械约束</summary><p class="sub">训练数据来自同一固定合成生成器，测试井有独立随机种子和井间偏移；“迁移挑战”额外改变测试强度域并加入磨损损失。页面的回归函数和搜索不读取测试真值。</p><p class="sub">泵压代理 P = 3 + 0.016Q² + 0.000015·WOB·RPM（MPa）；扭矩代理 T = 0.035·WOB·UCS/60 + 0.00018·WOB·RPM（kN·m）。它们用于解释显式约束与可行域。</p></details></article>
<article class="panel"><h2>人工复核：为何接受或保留这个候选？</h2><label>复核结论<select id="review-choice"><option>保留为待验证候选</option><option>参数越界，需要收紧约束</option><option>代理外推，需要补充标定</option><option>检查测试误差后再决策</option></select></label><label>依据<textarea id="review-note" rows="3" maxlength="600" placeholder="例如：推荐点接近转速上限，先看该域的测试残差。"></textarea></label><button id="review" disabled>保存本次复核</button><div id="review-history"></div></article></div></div>
<div class="bottom-actions"><button id="export" disabled class="primary">导出当前计算 JSON</button><span class="minor">教学合成数据 · 模型、经验基线、模拟实现值和人工意见分别保存</span></div>
'''

W4_LAB='''
<div class="toolbar"><label><span class="control-label">教学情景</span><select id="preset"><option value="default">常规层序 · 多道互补</option><option value="noise">仪器噪声升高</option><option value="gas">含气砂岩 · 孔隙响应改变</option><option value="domain">迁移挑战 · 高 GR 灰岩与井眼扰动</option></select></label><button id="run" class="primary">运行岩性识别</button><button id="reset">恢复默认</button></div>
<details class="panel controls" open><summary>观察通道与复核条件</summary><div class="controlgrid"><label>输入通道<select id="mode"><option value="all">GR + Rt + 密度 + 中子</option><option value="no-density">关闭密度通道</option><option value="gr">仅 GR（通道消融）</option></select></label><label>近邻数 k<select id="k"><option value="auto">验证井选择</option><option value="3">3</option><option value="5">5</option><option value="9">9</option><option value="15">15</option></select></label>
<label>测试噪声倍数 <output for="noise" id="noise-out">1</output><input id="noise" type="range" min=".5" max="3" step=".1" value="1"></label><label>最低近邻支持 <output for="support" id="support-out">0.6</output><input id="support" type="range" min="0" max="1" step=".05" value=".6"></label><label class="row"><input id="reject" type="checkbox" checked>低支持 / 远距离转复核</label></div></details>
<div id="status" class="status" role="status" aria-live="polite">准备计算</div><div id="metrics" class="strip"></div>
<div id="results"><article class="panel"><div class="row" style="justify-content:space-between"><h2>沿井深看曲线、模型和疑点</h2><label>显示测试井<select id="well"></select></label><label><input id="show-truth" type="checkbox">显示独立教学真值列</label></div><p class="sub">深度向下增加；电阻率使用对数坐标。点击任意曲线位置，右下方同步显示该深度的观测和实际近邻。</p><div id="logs" class="chart-shell logs"></div><label>深度游标 / m MD <output id="depth-out">1540</output><input id="depth" type="range" min="1500" max="1579.5" step=".5" value="1540"></label><div class="legend"><span><i class="swatch" style="background:#c7954d"></i>砂岩</span><span><i class="swatch" style="background:#8f9ca6"></i>泥岩</span><span><i class="swatch" style="background:#648bb0"></i>灰岩</span><span><i class="swatch" style="background:#e4d5c2"></i>复核</span><span>GR 基线 / 模型 / 人工 / 真值分列</span></div></article>
<div class="split equal"><article class="panel"><h2>交会图：同一个 GR，看到更多信息</h2><p class="sub">背景点来自训练井；大圆环定位当前测试点。横轴 GR，纵轴密度；模型根据当前所选通道进行计算。</p><div id="crossplot" class="chart-shell"></div><div class="feature-badges" id="feature-badges"></div></article><article class="panel"><h2>这个深度的判断依据</h2><div id="point-detail"></div><div id="neighbors"></div></article></div>
<div class="split equal"><article class="panel"><h2>全部测试点的真实混淆矩阵</h2><p class="sub">行是真值，列是预测。复核列保留在总分母，颜色深浅之外同时显示计数。</p><div id="confusion"></div></article><article class="panel"><h2>训练与验证没有使用测试井</h2><div id="learning"></div><details><summary>查看数据性质与通道变化</summary><p class="sub">固定种子的教学合成层序包含砂岩、泥岩和灰岩。GR、Rt、密度与中子曲线随岩性、孔隙、井间偏移和噪声共同变化。含气情景改变砂岩的电阻率、中子和密度；迁移情景改变灰岩 GR 并加入井眼扰动。</p><p class="sub">训练标签用于建立近邻库；测试标签只在评价函数中读取。支持度是 k 个邻居的投票比例，距离阈值由验证井最近邻距离的 95% 分位数 × 1.4 确定。</p></details></article></div>
<article class="panel"><h2>当前深度人工复核</h2><p id="review-location" class="sub"></p><div class="split equal"><div><label>人工判读<select id="review-label"><option value="0">砂岩</option><option value="1">泥岩</option><option value="2">灰岩</option><option value="-1">继续待复核</option></select></label><label>复核依据<textarea id="review-note" rows="3" maxlength="600" placeholder="记录使用了哪条曲线、是否需要岩心或井眼资料。"></textarea></label><button id="review" disabled>保存该深度的人工意见</button></div><div id="review-history"></div></div></article></div>
<div class="bottom-actions"><button id="export" class="primary" disabled>导出当前识别 JSON</button><span class="minor">教学合成数据 · 320 点总分母 · 人工结果保留独立版本</span></div>
'''

def author(scene,caseid,title,headline,summary,bg,steps,lab,methods,sources,readme):
    background=[]
    for i,(name,caption,figure) in enumerate(bg):
        background.append({'no':i+1,'en':'CONCEPT','title':f'图 B{i+1}｜{name}','html':f'<p>{caption}</p><figure><div class="diagram" style="max-width:100%;overflow-x:auto">{figure}</div><figcaption>图 B{i+1} · {name}</figcaption></figure>'})
    refs='<p>专业依据：'+ '；'.join(f'<a href="{url}" target="_blank" rel="noopener">{name}</a>' for name,url in sources) +'。图示与默认数值由本案例重新构造。</p>'
    background[-1]['html']+=refs
    manifest={'id':caseid,'sceneId':scene,'methods':methods,'title':title,'version':'1.0.0','updated':'2026-10-24','tabs':{'background':{'label':'专业背景','lede':summary,'judge':[{'label':'输入','value':'工况参数' if scene=='d1' else '多道测井曲线','desc':'单位、深度和数据来源一起显示'},{'label':'默认数据','value':'教学合成','desc':'整井训练 / 验证 / 测试分开'},{'label':'智能方法','value':'岭回归 + 约束搜索' if scene=='d1' else '多变量 kNN','desc':'前端真实拟合、推理和评价'}],'sections':background},'workflow':{'label':'案例流程','title':headline,'lead':[summary],'stats':[['步骤',str(len(steps))],['测试井','2 口'],['运行','纯前端离线']],'steps':[{'name':s['name'],'role':f'图 S{i+1}','do':f"输入：{s['input']}；动作：{s['action']}。见图 S{i+1}。",'effect':s['output'],'trap':s['trap']} for i,s in enumerate(steps)],'metrics':{'title':'逐步骤图册与结果口径','html':''.join(f'<figure><h3>图 S{i+1}｜{s["name"]}</h3><div style="max-width:100%;overflow-x:auto">{s["svg"]}</div><figcaption>输入：{s["input"]}；动作：{s["action"]}；产物：{s["output"]}。{s["trap"]}</figcaption></figure>' for i,s in enumerate(steps))}},'demo':{'mode':'page','html':'demo/index.html','js':'demo/demo.js','label':'可运行示范','height':1100,'intro':summary}}}
    background_html=''.join(f'<article class="chapter"><div class="eyebrow" style="color:#107d76">CONCEPT {i+1:02d}</div><h2>{b["title"]}</h2>{b["html"]}</article>' for i,b in enumerate(background))
    workflow_html='<div class="stepnav" aria-label="流程步骤">'+''.join(f'<button data-step="{i}" aria-pressed="{str(i==0).lower()}">{i+1:02d} {s["name"]}</button>' for i,s in enumerate(steps))+'</div>'
    workflow_html+=''.join(f'<article data-step-panel="{i}" '+('hidden' if i else '')+f'><h2>图 S{i+1}｜{s["name"]}</h2><div class="step-details"><div><dl><dt>输入</dt><dd>{s["input"]}</dd><dt>动作</dt><dd>{s["action"]}</dd><dt>产物</dt><dd>{s["output"]}</dd></dl><p class="step-trap">{s["trap"]}</p></div><figure style="margin:0"><div class="diagram">{s["svg"]}</div></figure></div></article>' for i,s in enumerate(steps))
    workflow_html+='<div class="flow-footer"><button data-tab="lab" class="primary">在交互实验中查看实际产物 →</button></div>'
    html=f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>井见 · {title}</title><link rel="stylesheet" href="demo.css"></head><body><header><div class="brand">井见<small>石油智能化可视实验室</small></div><span class="stage">扩展案例 · {scene.upper()} · {"钻井" if scene=="d1" else "测井"}</span></header><main><div class="hero"><div class="eyebrow">PETROLEUM × INTELLIGENCE</div><h1>{headline}</h1><p>{summary}</p><div class="facts"><span>多口独立教学井</span><span>{"回归 → 约束 → 候选" if scene=="d1" else "多道观测 → 近邻 → 复核"}</span><span>前端真实计算 · 离线可运行</span></div></div><nav aria-label="案例内容"><button data-tab="background" aria-pressed="false">01 专业背景</button><button data-tab="workflow" aria-pressed="false">02 案例流程</button><button data-tab="lab" aria-pressed="true">03 可运行示范</button></nav><section id="background" hidden>{background_html}<button data-tab="lab" class="primary">用实验验证这些概念 →</button></section><section id="workflow" hidden>{workflow_html}</section><section id="lab">{lab}</section></main><footer>{caseid} · v1.0.0 · {"ROP" if scene=="d1" else "LOG"}-SYNTH-2026-10-24-v1</footer><script src="demo.js"></script></body></html>'
    out=ROOT/scene;out.mkdir(exist_ok=True)
    (out/'case.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'demo.html').write_text(html,encoding='utf-8')
    (out/'demo.css').write_text(CSS,encoding='utf-8')
    (out/'README.txt').write_text(f'{title}\n{caseid} / {scene} / v1.0.0\n\n{readme}\n\n专业来源（2026-10-24 阅读）：\n'+ '\n'.join(f'{name}\n{url}' for name,url in sources)+'\n\n验证状态：计算检查见 calculation-checks.json，是 Node 计算验证；原门户导入、刷新、离线文件与浏览器界面由主验收流程另行记录，未在此冒充已通过。\n\n最终包结构：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js。开发源码 engine.js 与 app.js 由统一构建器串联为普通 IIFE demo.js。无 CDN、运行时 fetch、后端和远程模型要求。通过老师“添加案例”选择完整单例文件夹。\n',encoding='utf-8')

author('d1','s17x-d1-rop-optimization','钻速预测与参数优化：从响应面到可行候选','钻得更快，也要留在约束内。','从多口教学井学习钻速响应，比较单钻压经验基线，再在钻压、转速、流量、泵压与扭矩边界内搜索参数。你可以收紧约束、放大噪声，或进入更硬地层的迁移情景。',d1_bg,d1_steps,D1_LAB,['ts','opt'],[
    ('SLB｜Rate of penetration','https://glossary.slb.com/terms/r/rate_of_penetration'),
    ('SLB｜Bottomhole assembly','https://glossary.slb.com/terms/b/bha'),
    ('SLB｜Optimizing Drilling Rate of Penetration','https://investorcenter.slb.com/static-files/41a10f14-81ca-442f-83f6-05dae85b6f67'),
],'''数据与真实计算：固定种子生成 8 口训练井（512 点）、3 口验证井（192 点）和 2 口测试井（128 点）。工况特征为 WOB/100、RPM/120、Q/26、UCS/60、三个平方项及 WOB×RPM、WOB×UCS、Q×UCS；标准化仅拟合训练井，λ 在 0.01/0.1/1/10 中由验证 RMSE 选择。基线在同一训练数据拟合单 WOB 线性趋势。测试真值只进入 evaluate；infer 和 search 只收观测、训练模型及约束。
教学响应：w=WOB/100, r=RPM/120, q=Q/26, h=UCS/60；ROP=max(2,10+28w+24r+12q−10w²−8r²−6q²+9wr−12h−6wh+5qh+井间偏移−磨损损失)，并加入指定测量噪声。生成公式只用来构造数据，模型实际从训练样本拟合参数。
搜索：WOB=40…160 步长10 kN，RPM=60…200 步长10 r/min，Q=18…38 步长2 L/s，共2145点。泵压与扭矩教学代理在界面和引擎列出。推荐只根据代理预测排序，冻结推荐后才读取教学模拟实现值；未使用真实响应穷举最优点。没有可行点时 recommended=null，不补造推荐。
UI：响应面、可行域、留出散点、最大误差条图、学习记录、约束余量；预设改变实际输入/噪声/迁移。输入变化标 stale；恢复默认后重算；人工复核与模型成绩分开；JSON 导出携带当前参数、分组、模型、预测、分母及复核。''')
author('w4','s17x-w4-log-lithology','测井岩性识别：多道曲线与可解释近邻','把多道曲线，读成可复核的岩性线索。','沿井深同时查看自然伽马、电阻率、密度和中子响应。用整口井留出的 kNN 与单 GR 规则比较，定位砂岩、泥岩和灰岩的混淆；点击深度，查看真实训练近邻和人工复核依据。',w4_bg,w4_steps,W4_LAB,['ts'],[
    ('SLB｜Gamma ray log','https://glossary.slb.com/terms/g/gamma_ray_log'),
    ('SLB｜Neutron porosity','https://glossary.slb.com/terms/n/neutron_porosity'),
    ('IODP｜Selecting Logging Tools','https://iodp.tamu.edu/tools/logging/selection.html'),
    ('US EPA｜Gamma-Gamma Density Logging','https://www.epa.gov/environmental-geophysics/gamma-gamma-density-logging'),
],'''数据与真实计算：固定种子独立生成 6 口训练井（720 点）、2 口验证井（240 点）和 2 口测试井（320 点）。每口测试井1500…1579.5m MD、0.5m采样。GR/API、Rt/Ωm、RHOB/g cm−3、NPHI/v/v 由岩性、孔隙、流体、井间偏移与噪声共同形成。数据和标签分开保存。
模型：Rt 取 log10，其余保留物理量；仅训练井拟合均值/标准差。标准化欧氏距离 kNN，在验证井按宏F1选k∈3/5/9/15；用户可显式改k。单GR基线的两个阈值同样由验证井选择。关闭密度或仅GR会同时改变训练、验证、测试特征，不保留隐藏通道。最近邻来源是真实训练井记录。
复核：投票支持度低于用户阈值，或最近距离超过验证95%分位×1.4（下限0.35）时拒判。该支持度是邻居票数比，未校准为概率。3×4混淆矩阵包含复核列，F1/召回始终以全部320点评价；接受集错误率与覆盖率同时保存；全拒判接受集错误率为null。
UI：深度向下的四道曲线与独立GR/模型/人工/真值色柱，GR—密度交会图，实际近邻表、两方法混淆矩阵、各类召回、通道消融、含气/噪声/域外预设。输入改变标 stale；人工复核不修改模型分数；JSON 导出保留模型原结果和人工历史。''')
print('Wrote d1/w4 manifests, teaching HTML, CSS and readmes.')
