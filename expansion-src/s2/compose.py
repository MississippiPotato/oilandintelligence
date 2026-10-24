import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]

def svg(body, label, height=190):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 {height}" role="img" aria-label="{label}"><rect width="720" height="{height}" rx="10" fill="#f3f7f6"/><g font-family="system-ui,Microsoft YaHei,sans-serif" fill="#28463f" font-size="17">{body}</g></svg>'

def wave(label,mode):
    import math
    lines=''
    for k in range(4):
        pts=[]
        for x in range(36,325,3):
            yy=49+k*30+10*math.sin(x*.07+k*.05)
            if mode=='dip': yy+=x*.16
            if mode=='chaos': yy+=12*math.sin(x*.13+k*1.9)
            pts.append(f'{x},{yy:.1f}')
        lines+=f'<polyline points="{" ".join(pts)}" fill="none" stroke="#3c7781" stroke-width="2"/>'
    return svg(lines+f'<text x="365" y="65" font-size="21">{label}</text><text x="365" y="100">横轴：地震道（位置）</text><text x="365" y="132">纵轴：双程传播时间 ↓</text>',label)

def flow_svg(labels,detail):
    body=''
    for i,t in enumerate(labels):
        x=20+i*178
        body+=f'<rect x="{x}" y="35" width="155" height="63" rx="8" fill="{["#e0efea","#e1ebf4","#f1e6cc","#e0efea"][i]}" stroke="#b5c9c1"/><text x="{x+77}" y="72" text-anchor="middle">{t}</text>'
        if i<3: body+=f'<path d="M{x+155} 67h20l-6-4m6 4l-6 4" fill="none" stroke="#668b7c"/>'
    return svg(body+f'<text x="22" y="139">{detail}</text>',' → '.join(labels),165)

COMMON_CSS='''*{box-sizing:border-box}body{margin:0;background:#f4f7f5;color:#223b38;font-family:Inter,"Microsoft YaHei",system-ui,sans-serif;font-size:18px;line-height:1.85}header,main,.case-nav{max-width:1160px;margin:auto}header{padding:48px 30px 22px}header .eyebrow,.kicker{font-size:13px;letter-spacing:.14em;color:#6c8c81}h1{font-size:clamp(27px,3.5vw,40px);line-height:1.4;margin:9px 0}header p{max-width:850px;color:#526e63}h2{font-size:25px;line-height:1.5}h3{font-size:20px;margin:8px 0}p{margin:10px 0 18px}.case-nav{display:flex;gap:8px;padding:12px 30px;position:sticky;top:0;background:#f4f7f5ed;z-index:2;border-bottom:1px solid #d9e3dc}button,select,input{font:inherit}button,select{border:1px solid #b8cec0;border-radius:8px;padding:9px 15px;background:white;color:#285b47}button{cursor:pointer}button[aria-selected=true],button.primary{background:#2a7057;color:white;border-color:#2a7057}main{padding:20px 30px 60px}section[hidden]{display:none}article.lesson,.panel,.step-card{background:white;border:1px solid #dfe7df;border-radius:12px;padding:25px;margin:18px 0}article.lesson{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:28px;align-items:center}figure{margin:14px 0}figure svg{width:100%;display:block;max-height:210px}figcaption,.caption{font-size:15px;color:#657d72;line-height:1.8;margin-top:7px}.concept{padding:12px 16px;border-left:3px solid #d3ae6b;background:#faf6ed}.sources{font-size:15px;line-height:1.8;color:#61766b}.sources a,a{color:#246e60}.controls{display:flex;gap:22px;align-items:end;flex-wrap:wrap;padding:20px;border:1px solid #c9ded2;background:#eaf3ed;border-radius:12px}.controls label{display:flex;flex-direction:column;gap:4px;font-size:16px}input[type=range]{width:180px;accent-color:#286e56}.metrics{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.metric{flex:1;min-width:170px;background:#e9f2ed;padding:15px 20px;border-radius:9px}.metric b{display:block;font-size:26px}.metric small{font-size:14px;color:#5e7869}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.chart svg{width:100%;height:auto;max-height:440px}.chart text{font-size:13px;fill:#466259}table{border-collapse:collapse;width:100%;font-size:16px}td,th{padding:10px;border-bottom:1px solid #dde7df;text-align:left}th{font-weight:600;background:#f1f6f2}#status{font-size:15px;color:#567263;margin:10px 0}#selectedInfo{padding:12px 16px;background:#faf6e9;border-radius:8px;font-size:16px}.swatch{display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:2px}.note{font-size:16px;color:#6d7765}.step-card figure{max-width:760px}.step-card h3{color:#2f6957}.evidence{background:#f9f6ed;padding:15px;border-radius:8px;font-size:16px}footer{font-size:14px;color:#6e8076;margin-top:22px}button:focus-visible,select:focus-visible{outline:3px solid #dbb85b;outline-offset:2px}.chart [data-sample]{cursor:pointer}.chart [data-sample]:hover{stroke:#d59138;stroke-width:3}@media(max-width:760px){header{padding:26px 20px 10px}main{padding:12px 16px 42px}.case-nav{padding:10px 16px;gap:5px}.case-nav button{padding:8px 10px;font-size:16px}article.lesson,.grid{grid-template-columns:1fr}article.lesson{padding:20px;gap:4px}.controls{gap:12px}.metric{min-width:130px}h2{font-size:23px}.panel{padding:17px}body{font-size:17px}}'''

def create(scene,id,title,lede,sections,steps,lab,methods):
    d=ROOT/'expansion-src'/scene
    d.mkdir(parents=True,exist_ok=True)
    m={'id':id,'sceneId':scene,'methods':methods,'title':title,'version':'1.0.1','updated':'2026-10-24','tabs':{'background':{'label':'专业背景','lede':lede,'sections':[]},'workflow':{'label':'案例流程','title':title.split('：')[0]+'的计算路径','lead':['从观测和井资料出发，分别训练、预测、评价，保留人工核查入口。'],'steps':[],'metrics':{'html':''}},'demo':{'label':'可运行示范','intro':lede,'height':1500}}}
    bg=''
    for i,(name,text,graphic,caption) in enumerate(sections):
        html=f'<p>{text}</p><figure>{graphic}<figcaption>{caption}</figcaption></figure>'
        m['tabs']['background']['sections'].append({'title':name,'html':html})
        bg+=f'<article class="lesson"><div><span class="kicker">{scene.upper()} / KNOWLEDGE {i+1}</span><h2>{name}</h2><p>{text}</p></div><figure>{graphic}<figcaption>{caption}</figcaption></figure></article>'
    wf=''
    for i,(name,do,effect,trap,graphic) in enumerate(steps):
        m['tabs']['workflow']['steps'].append({'name':name,'do':do,'effect':effect,'trap':trap})
        block=f'<article class="step-card workflow-step"><h3>{name}</h3><p>{do}</p><figure>{graphic}</figure><p><b>本步得到：</b>{effect}</p><p class="note"><b>核查要点：</b>{trap}</p></article>'
        wf+=block
        m['tabs']['workflow']['metrics']['html']+=block
    source='<p class="sources">专业资料：<a href="https://wiki.aapg.org/Facies_analysis" target="_blank" rel="noopener">AAPG · 地震相分析</a>；<a href="https://wiki.seg.org/wiki/Dictionary%3AAttribute%2C_seismic" target="_blank" rel="noopener">SEG · 地震属性</a>；<a href="https://www.syxb-cps.com.cn/EN/10.7623/syxb200604014" target="_blank" rel="noopener">石油学报 · 地震数据孔隙度与饱和度反演</a>。本页图形自行绘制，计算数据为固定随机种子的教学数据；可离线运行。</p>'
    m['tabs']['background']['sections'].append({'title':'数据与阅读来源','html':source})
    html=f'<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><link rel="stylesheet" href="demo.css"></head><body><header><span class="eyebrow">SEISMIC / {scene.upper()} / 物探</span><h1>{title}</h1><p>{lede}</p></header><nav class="case-nav" aria-label="案例内容"><button data-tab="background" aria-selected="true">专业背景</button><button data-tab="workflow" aria-selected="false">案例流程</button><button data-tab="lab" aria-selected="false">可运行示范</button></nav><main><section id="background">{bg}{source}</section><section id="workflow" hidden>{wf}</section><section id="lab" hidden>{lab}</section></main><script src="demo.js"></script></body></html>'
    (d/'case.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (d/'demo.html').write_text(html,encoding='utf-8')
    (d/'demo.css').write_text(COMMON_CSS,encoding='utf-8')
    (d/'README.txt').write_text(f'{title}\n场景 {scene}；版本 1.0.1；纯前端五文件案例包。\n\n通过老师门户“添加案例”选择包含 case.json、README.txt 和 demo 目录的案例文件夹。也可双击 demo/index.html 直接离线运行。\n\n本例包括专业背景、案例流程、可运行示范。所有默认计算在浏览器中进行，不请求网络。数据为代码内固定种子教学生成；不是实测工区精度。背景资料与链接已列在页面末尾，图形自行绘制。\n训练与测试来源种子固定分开，训练集计算标准化参数，预测函数只接收输入特征；测试标签仅在预测结束后计算指标和显示参考对照。调整参数后标记旧结果，点击运行更新图表。\n数据来源、算法细节、训练测试分组和单位见各教学段落及演示结果。\n',encoding='utf-8')

s2sec=[
('地震相是什么，为什么与储层有关？','地震波遇到声阻抗变化的界面会发生反射。把相邻位置的反射波形排在一起，就是地震剖面。解释人员依据反射的连续性、倾角、振幅和内部结构，把外观相似的一片划为“地震相”。地震相提供沉积环境的线索，仍需井资料、岩心与地层框架标定，不能直接把某种颜色等同于含油砂岩。',wave('平行反射：层状、连续','flat'),'左图是地震同相轴的概念表达。横轴表示位置，纵轴表示波从地面到界面再返回的双程时间；并非地下岩层的直接照片。'),
('先看结构，再看振幅','本演示区分三种教学反射样式：平行连续、倾斜反射、杂乱反射。平行与倾斜可以具有相近振幅，却有不同的空间结构；杂乱反射的邻道相似性较低。它们是用于学习属性分类的反射样式标签，实际沉积相的名称需要地质解释。',wave('倾斜反射：振幅相近，结构不同','dip'),'倾斜层系可能与沉积前积、构造倾斜等因素有关；单凭小窗口不能唯一判断成因。对比演示中的反射小窗与模型特征。'),
('把“像不像”变成四个可计算属性','RMS振幅表示反射能量；横向差异反映连续性，横纵梯度乘积反映反射的局部方向；纵向差异记录波形变化。先从每个24×24振幅小窗计算四个数，再按训练集的均值和标准差统一尺度。k近邻比较四维结构，基线只比较RMS振幅，两者使用完全相同的测试小窗。',flow_svg(['振幅小窗','四个属性','近邻投票','相样式候选'],'同一振幅并不意味着同一反射结构；特征需要由观测计算。'),'本例是特征驱动的图像分类。横纵梯度乘积不是以角度表示的地层倾角，只作为局部方向特征；页面保留原始小窗便于回查。'),
('分类图要怎样阅读？','模型对每个小窗给出类别和邻居投票占比。投票占比说明邻居是否一致，不是经过标定的地质概率。误分可能来自噪声、窗口跨越相带边界或训练样式不足。先看混淆矩阵里哪些类别容易混，再点选样本回看波形，才知道这个结果是否支持地质解释。',wave('杂乱反射：需要看局部证据','chaos'),'演示中可以逐个点选60个留出小窗；改变噪声会重新生成观测但不改变参考类别，直观看到可靠性下降。')]
s2steps=[
('建立独立反射小窗','用固定种子生成120个训练小窗和60个测试小窗，每类数量相等。各小窗独立生成相位、振幅和局部结构，训练噪声固定0.20。','训练与测试分开；测试噪声由读者控制。','切勿把同一原始剖面的高度重叠小窗随机拆到两侧。这里每个小窗独立生成。',flow_svg(['反射样式','训练120窗','测试60窗','固定种子'],'训练标签用于学习；留出标签仅在预测完成后用于评价。')),
('由原始振幅计算属性','遍历24×24小窗计算RMS、横向差异/RMS、纵向差异/RMS、横纵梯度乘积/RMS²。标准化的均值和尺度仅从训练集计算。','每个小窗变为四维观测向量。','不能从测试参考类别构造属性；不同单位不统一会让大数值特征主导距离。',flow_svg(['24×24振幅','空间差异','能量归一','训练尺度'],'噪声也会增大空间差异，因此需要回到小窗查看。')),
('在四维空间寻找近邻','对每个测试向量与120个训练向量计算标准化欧氏距离，选择k个最近邻投票。训练集中每类RMS均值构成单属性基线。','得到kNN类别、投票占比和RMS基线类别。','k不是越大越好；投票占比不能当作已校准概率。',flow_svg(['测试属性','训练距离','k邻居投票','类别候选'],'RMS基线与四属性模型共用同一测试集。')),
('按同一分母比较结果','先完成60个预测，再用隔离的参考标签计算准确率、宏F1与混淆矩阵。混淆矩阵行表示参考，列表示预测。','得到同一60小窗上的两条方法结果。','测试集用于观察结果，不用于自动调k后宣称最优精度。',flow_svg(['锁定预测','对照参考','混淆矩阵','准确率 / F1'],'宏F1逐类计算后平均；分母始终是60个测试小窗。')),
('回看被误分的小窗','点选预测地图或选择样本，比较原始波形、四属性数值、邻居投票和单属性结果。调整噪声后重新运行，观察误分类型。','形成可回查的反射样式候选，而不只是一个颜色。','真实沉积相解释还要与井点、层序和构造背景核对。',flow_svg(['误分类别','回看振幅','核查相带','井震解释'],'保留原始小窗，让分类结果有可见观测依据。'))]
s2lab='''<h2>同样的反射强度，模型能分清结构吗？</h2><p>先运行，再调高噪声。点选下方任意样本，查看相样式、原始振幅与四维属性之间的关系。</p><div class="controls"><label>测试噪声幅度 <output id="noiseValue">0.25</output><input id="noise" type="range" min="0" max="1.2" step="0.05" value="0.25"></label><label>近邻数 k<select id="k"><option>3</option><option selected>7</option><option>15</option><option>31</option></select></label><button class="primary" id="run">计算分类与对照</button><button id="edge">高噪声场景</button><button id="export">导出本次结果</button></div><p id="status" role="status"></p><div id="results"><div class="metrics" id="metrics"></div><div class="grid"><article class="panel"><h3>60个留出小窗的分类候选</h3><div id="map" class="chart"></div><p class="caption">每格是一个独立生成的小窗；格子颜色表示预测类别，红色边框表示与参考不一致。点击一格查看振幅。</p></article><article class="panel"><h3>选中小窗的原始振幅</h3><div id="patch" class="chart"></div><div id="selectedInfo"></div></article></div><div class="grid"><article class="panel"><h3>属性空间：强度与结构</h3><div id="scatter" class="chart"></div><p class="caption">横轴RMS振幅，纵轴横向差异/RMS；颜色为预测。振幅重叠时，结构特征仍可能分开。</p></article><article class="panel"><h3>混淆矩阵与方法对照</h3><div id="matrix"></div></article></div><p class="evidence">教学数据：训练120窗、测试60窗；24×24采样/窗。训练固定噪声0.20，测试噪声可调。不同种子独立生成；输入特征不含参考类别。这里的“相”指三种反射结构样式，地质沉积相需井资料标定。</p></div>'''
create('s2','s17x-s2-seismic-facies','地震相智能分类：从反射纹理认识沉积线索','振幅相似的地震小窗，为什么会属于不同的反射样式？用原始振幅、空间属性与近邻投票把判断依据展开。',s2sec,s2steps,s2lab,['cv'])

s4sec=[
('储层孔隙度是什么，地震又测到了什么？','孔隙度是岩石孔隙体积占总体积的比例，决定了单位体积岩石能容纳多少流体。地震仪并不直接测量孔隙度，而是记录反射波形。波形受声阻抗变化影响，声阻抗等于密度乘纵波速度。孔隙、岩性和流体都能改变这些量，所以从地震到孔隙度必须借助井资料与岩石物理关系。',svg('<rect x="38" y="36" width="154" height="110" fill="#d7be88" rx="8"/>'+''.join(f'<circle cx="{x}" cy="{y}" r="10" fill="#f8fbfb"/>' for x,y in [(68,65),(112,59),(155,74),(83,111),(137,119)])+'<text x="228" y="65">孔隙度 φ = 孔隙体积 / 岩石总体积</text><text x="228" y="101">声阻抗 Z = 密度 ρ × 纵波速度 Vp</text><text x="228" y="137">φ 与 Z 有联系，却不是一一对应</text>','孔隙度与声阻抗的区别'),'孔洞仅用于解释体积分数，形状不代表真实微观孔隙。演示输出孔隙度单位为%，误差单位为百分点。'),
('同一个阻抗，为何可能对应不同孔隙度？','泥质含量、压实和流体变化会与孔隙度产生混合影响。在本教学关系中，孔隙度增大使阻抗降低，泥质含量增加则使阻抗上升；二者可以相互抵消。只看一条阻抗会把泥质变化误当成孔隙变化。引入Vp/Vs比值作为第二属性，可以帮助区分这两种影响。',svg('<path d="M55 25v125h600" fill="none" stroke="#829b8d"/><path d="M85 46L335 136M250 45L500 136M410 45L650 132" stroke="#347f77" stroke-width="3"/><text x="82" y="28">同一泥质水平：φ↑ → Z↓</text><text x="444" y="58">泥质水平不同</text><text x="488" y="84">关系整体移动</text><path d="M365 45v93" stroke="#d4a650" stroke-dasharray="5 4"/><text x="52" y="178">纵轴：阻抗 Z；横轴：孔隙度 φ →　　虚线示意多解性</text>','泥质导致的阻抗孔隙度关系移动'),'线条示意混合影响；实际计算采用明确的教学前向关系，不把这套系数用于真实工区。'),
('用井震标定，学习从属性到参数的映射','井资料提供孔隙度解释值，地震提供附近同一层段的属性。将二者在同一层位和尺度上对齐，形成训练样本。本例用8口教学井拟合多属性岭回归，另4口井完全留出。岭回归学习属性组合与孔隙度的关系，正则强度限制过大的系数；单属性回归只使用声阻抗，构成对照。',flow_svg(['井孔隙度','层段对齐','多属性回归','留出井预测'],'本演示采样深度2200–2320m，8m/点；真实井震匹配还要考虑时间深度关系。'),'真实地震的垂向分辨率低于常规测井，不能把每个高分辨率井点都当成一个独立地震样本。本例为统一层段尺度的教学数据。'),
('看误差，也看它发生在哪里','RMSE概括留出井总体误差，井段曲线则告诉你偏差集中在哪个深度。观测与预测散点接近45°线表示接近参考值；偏离表示误差。更复杂的模型不一定在任何噪声下都更好，调高测试噪声、改变正则强度，可以观察单属性和多属性模型的差异。',svg('<path d="M55 25v125h610M55 150L245 30" stroke="#859a8d" fill="none"/><circle cx="90" cy="116" r="6" fill="#397e73"/><circle cx="127" cy="93" r="6" fill="#397e73"/><circle cx="175" cy="76" r="6" fill="#397e73"/><circle cx="212" cy="41" r="6" fill="#397e73"/><text x="305" y="61">预测与井参考值一致 → 靠近对角线</text><text x="305" y="100">误差 = 预测孔隙度 − 井参考孔隙度</text><text x="55" y="180">横轴：井参考 φ(%)；纵轴：预测 φ(%)</text>','预测参考交会图与误差的阅读'),'预测函数只接收地震属性，参考孔隙度在预测完成后用于绘图和评价。此页的井数据由固定种子生成。')]
s4steps=[
('建立井与属性的对应关系','按8m统一层段生成孔隙度、泥质含量和声阻抗、Vp/Vs属性。教学前向关系：Z=11.5−14φ+2.7Vsh+噪声；Vp/Vs=1.68+Vsh+0.15φ+噪声，其中φ与Vsh是0–1体积分数。','每个井段得到一对地震属性和一个井参考孔隙度。','系数仅定义本教学数据；不是经验通用公式。',flow_svg(['孔隙 / 泥质','声学响应','观测噪声','井段样本'],'Z单位：10⁶ kg·m⁻²·s⁻¹；Vp/Vs无量纲；孔隙度输出%。')),
('按整口井留出','前8口井共128个井段用于训练，另4口井共64个井段测试；不同种子生成。标准化参数仅来自训练井。','避免同一口井相邻深度同时进入训练和测试。','井段相关性会让随机拆点显得过于乐观；本演示按整井划分。',flow_svg(['12口教学井','训练8口','留出4口','固定分组'],'测试噪声可调，训练观测固定，便于比较输入质量变化。')),
('真实拟合两条回归','标准化属性后求解岭回归正规方程，截距不惩罚。多属性模型使用阻抗与Vp/Vs，基线只使用阻抗；两者使用相同训练样本和正则强度。','得到实际计算的系数，而不是预写预测曲线。','正则过强会压低系数，使预测收缩到训练均值附近。',flow_svg(['训练属性','标准化','求解系数','两条模型'],'求解 (XᵀX + λD)β = Xᵀy，D的截距位置为0。')),
('只用属性预测留出井','把64个留出井段的阻抗和Vp/Vs输入模型。参考孔隙度不进入预测函数。选择任意一口留出井，查看两条预测曲线。','得到每个留出井段的孔隙度估计。','超出训练属性范围时需要核查岩性和仪器条件，不能只看预测曲线平滑。',flow_svg(['留出井属性','固定模型','逐段预测','孔隙度曲线'],'预测不裁剪到真值区间，保留偏差以便观察。')),
('统一分母评价并复核','预测完成后调用参考值计算64个井段的MAE、RMSE和R²；并显示预测参考散点、逐井误差及系数。','同一64个井段上比较单属性与多属性。','MAE与RMSE单位是百分点；R²可能为负。4口教学井不代表工区泛化结论。',flow_svg(['预测完成','井参考值','误差统计','地质复核'],'误差不是流体识别证据；储量计算还需要厚度、面积及饱和度。'))]
s4lab='''<h2>阻抗相同，孔隙度就相同吗？</h2><p>对比“仅阻抗”与“阻抗 + Vp/Vs”。提高观测噪声或正则强度，看看多属性关系何时有帮助。</p><div class="controls"><label>测试属性噪声 <output id="noiseValue">0.25</output><input id="noise" type="range" min="0" max="2" step="0.05" value="0.25"></label><label>正则强度 λ<select id="lambda"><option value="0.1">0.1</option><option value="1" selected>1</option><option value="10">10</option><option value="100">100</option></select></label><button id="run" class="primary">拟合并预测留出井</button><button id="edge">高噪声场景</button><button id="export">导出本次结果</button></div><p id="status" role="status"></p><div id="results"><div class="metrics" id="metrics"></div><div class="grid"><article class="panel"><h3>井段曲线：预测偏差出现在什么深度？</h3><label>留出井 <select id="well"></select></label><div id="profile" class="chart"></div><p class="caption">绿线：多属性；金线：仅阻抗；深色虚线：井参考。纵轴深度向下增加，横轴孔隙度%。</p></article><article class="panel"><h3>同一64个井段的预测参考交会图</h3><div id="scatter" class="chart"></div><p class="caption">横轴井参考孔隙度，纵轴预测孔隙度；45°灰线表示完全一致。点选可定位到对应井。</p></article></div><article class="panel"><h3>逐井误差与实际拟合系数</h3><div id="table"></div><p id="coefficients" class="evidence"></p></article><p class="evidence">数据协议：训练8井×16点，测试4井×16点；井组完全分开。训练噪声固定0.22，测试噪声可调；固定种子教学前向生成。孔隙度误差单位为百分点，阻抗单位10⁶ kg·m⁻²·s⁻¹，Vp/Vs无量纲。</p></div>'''
create('s4','s17x-s4-reservoir-inversion','储层参数反演：用井震关系估计孔隙度','把“反射波形背后的属性”转换为储层参数，需要井资料标定，也需要辨别岩性与孔隙的混合影响。',s4sec,s4steps,s4lab,['cv','opt'])

for scene,labels in [('s2',['振幅小窗','四维纹理','k近邻分类','RMS基线','误分复核','相样式候选']),('s4',['井震样本','整井划分','多属性回归','单属性基线','误差复核','孔隙度估计'])]:
    # Field names align the authored overview consumed by the integration owner.
    def n(t,detail,step): return {'title':t,'detail':detail,'step':step}
    flow={'title':' → '.join(labels[:3]),'input':n(labels[0],'观测输入',0),'prepare':n(labels[1],'仅训练尺度',1),'model':n(labels[2],'实际拟合与预测',2),'baseline':n(labels[3],'同一测试样本',2),'gate':['结果与资料','是否一致？'],'review':n(labels[4],'回看原始观测',4),'output':n(labels[5],'保留候选与来源',3),'compare':n('留出资料评价','固定分母与误差',4)}
    (ROOT/'expansion-src'/scene/'flow.json').write_text(json.dumps(flow,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Generated s2/s4 manifest, standalone HTML, CSS, README and flow specs')
