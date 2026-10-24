from pathlib import Path
import json, re, html

ROOT=Path(r'G:\可视化导论\5\expansion-src')
IDS=['wo1','wo2','wo3','wo4','wo5','e1','e2','e3','e4','e5']
def write(p,s): p.write_text(s,encoding='utf-8',newline='\n')
def svg(body,label='教学对象关系示意图',height=250):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 {height}" role="img" aria-label="{label}"><rect width="720" height="{height}" rx="12" fill="#f0f5f4"/><g fill="#254755" font-family="system-ui,Microsoft YaHei" font-size="17">{body}</g></svg>'
def text(x,y,s): return f'<text x="{x}" y="{y}">{html.escape(s)}</text>'
def figure(body,caption): return '<figure>'+svg(body)+f'<figcaption>{caption}</figcaption></figure>'

TASKS={
'wo1':'先运行默认查询并打开最近历史井原文，指出支持当前候选的一个观测和一个词项。再选择“冲突”预设，检查为什么必须先核查管柱完整性；最后删去两项观测重算，说明“待补证”怎样改变覆盖率。当前自由查询没有金标，20口测试井的准确率不能当作该查询的准确率。',
'wo2':'保持外径65mm、内径40mm、拉力90kN，先用通径125mm运行，再改为100mm：逐项核算 O1 的100+4>100，以及 S2 的92+4≤100。随后把拉力改为160kN，解释为何不能用“抓得住”抵消“拉不动”。恢复默认后再比较单尺寸基线漏掉了哪些条件。',
'wo3':'先固定缺陷幅度3mm，把仪器偏心从0调到5mm，比较两幅展开图和IoU：正常方位条带为何不应算局部腐蚀？再将缺陷幅度设为0、噪声0.9mm、阈值0.2mm，检查误报格数。点选或键盘选择格子读取相对深度、方位和mm数值；0°和360°是展开切口的同一方向。',
'wo4':'先将异常附加载荷设为0、速度系数1.8，比较原阈值与残差法的事件外报警分钟。再恢复速度1、异常20kN，查看持续3点规则是否带来2分钟延迟；最后用无异常+漂移12kN说明“持续残差”也可能是传感器问题。没有事件时召回应为不适用。',
'wo5':'固定负荷70%、含砂1.2g/L，将历史停机从0改为8次，记录查询估计下降多少天；留出32台设备的MAE不应随查询改变。再口述一个右删失例子：检修A后180天仍未检修，只知道间隔>180天，不能把180当完整标签。预测以检修A为起点，三个输入均来自A之前半年。',
'e1':'先运行默认，记录可行点数和最佳J；将成本权重改为0，比较“最高增油”和“最佳J”的设计。再选资源紧张预设，点击一个×读取哪条约束失败；最后选无可行点预设，解释为什么不应强行推荐。保持同一储层输入比较，90天增油与压力均是代理预测。',
'e2':'固定应力差5MPa、约束0.5，将液量由300改到1200m³，分别记录L、H和πLH。再固定液量700m³，把约束从0.1升至0.9，比较长高比。图中横纵同尺，极端参数也应完整显示；面积变大只说明几何投影变化，不能据此宣布产量同比增加。',
'e3':'保持盐度30g/L，分别用预算5与6元/L运行，在三元图读出圈中配方的A/B/C比例、成本和预测指数。点选固定方块(0.30/0.30/0.40)，核算0.3×9+0.3×6+0.4×1.5=5.10元/L，说明预算5时为何超限。再固定预算6、盐度改70，观察最优点移动而单价不变。',
'e4':'保持初温45°C、蒸汽上限1500t，将成本系数0.02改为0.12，记录最佳蒸汽量、焖井天数与J的变化。读取周期各边界天数，核算总周期=蒸汽量/200+焖井+90。再把上限改600t：固定1200t方案必须显示不可行，目标改善为不适用；各候选仍统一比较90天生产量。',
'e5':'保持温度45°C、k=7，盐度由25改到90g/L，比较当前活性与单温度基线：为什么基线对两次查询相同？再固定环境、k由3改15，观察响应面平滑与留出MAE的变化。用训练空心点识别稀疏区域，并写明“培养活性高”还缺哪些驱替试验证据才能支持增油。'
}

RENDERS={
'wo2':r'''d.rows.forEach((r,i)=>{let y=48+i*43;b+=T(18,y,r.name)+'<rect x="190" y="'+(y-17)+'" width="'+r.cap*1.9+'" height="23" fill="'+(r.legal?'#3a8e86':'#c4cac7')+'"/>'+T(200+r.cap*1.9,y,r.cap+' kN');});for(let v=0;v<=200;v+=50)b+=T(185+v*1.9,316,v);b+=T(190,340,'目录承载 kN；青=满足全部条件，灰=有排除理由');''',
'wo3':r'''[d.raw,d.res].forEach((M,j)=>{const ox=44+j*352;b+=T(ox,24,j?'去方位背景残差 mm':'原始内半径偏差 mm');M.forEach((row,z)=>row.forEach((v,a)=>{let x=ox+a*8.1,y=44+z*6.4;const label='相对深度'+(z*.1).toFixed(1)+'m，方位'+a*10+'度，偏差'+v.toFixed(2)+'mm';b+='<rect tabindex="0" role="button" aria-label="'+label+'" data-cell="'+z+','+a+','+v.toFixed(2)+'" x="'+x+'" y="'+y+'" width="8.1" height="6.4" fill="'+color((v+8)/22)+'"'+(j&&d.mask[z][a]?' stroke="#652b16" stroke-width="1"':'')+'><title>'+label+'</title></rect>';}));[0,90,180,270,360].forEach(a=>b+=T(ox+a/360*291-8,291,a+'°'));[0,1,2,3,3.5].forEach(z=>b+=T(ox-34,49+z/.1*6.4,z.toFixed(1)));});for(let i=0;i<110;i++)b+='<rect x="'+(210+i*2.5)+'" y="313" width="2.6" height="10" fill="'+color(i/109)+'"/>';b+=T(15,312,'相对深度 m ↓')+T(180,326,'−8')+T(490,326,'14 mm')+T(20,350,'同一固定色标；棕描边=预测；格子可点选/键盘读取，360°回到0°。');''',
'wo4':r'''const vals=d.rows.flatMap(r=>[r.y,r.pred]),lo=Math.floor((Math.min(...vals)-4)/10)*10,hi=Math.ceil((Math.max(...vals)+4)/10)*10,x=t=>65+t/119*590,y=v=>250-(v-lo)/(hi-lo)*195;for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4;b+=P([[65,y(v)],[655,y(v)]],'#d7e2df')+T(12,y(v)+4,v.toFixed(0));}b+=P(d.rows.map(r=>[x(r.t),y(r.y)]))+P(d.rows.map(r=>[x(r.t),y(r.pred)]),'#bc8d59');d.rows.forEach((r,i)=>{if(d.alarm[i])b+='<rect x="'+x(r.t)+'" y="275" width="5" height="16" fill="#ae6040"/>';});[0,30,60,90,119].forEach(t=>b+=T(x(t)-9,310,t));b+=T(20,25,'钩载 kN：青=实测；棕=正常关系预测')+T(435,335,'时间 min →')+T(20,355,'底带=连续3点残差报警；阈值 '+d.threshold+' kN，首次允许报警为第3点。');''',
'wo5':r'''let vals=d.rows.flatMap(r=>[r.truth,r.pred,r.base]),lo=Math.floor((Math.min(...vals)-15)/50)*50,hi=Math.ceil((Math.max(...vals)+15)/50)*50,x=v=>70+(v-lo)/(hi-lo)*555,y=v=>280-(v-lo)/(hi-lo)*220;b+=P([[70,60],[70,280],[625,280]],'#9faead')+P([[70,280],[625,60]],'#bbb');d.rows.forEach(r=>b+=dot(x(r.truth),y(r.pred),'#247e85')+dot(x(r.truth),y(r.base),'#bc8d59',2.5));for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4;b+=T(x(v)-12,302,v.toFixed(0))+T(22,y(v)+4,v.toFixed(0));}b+=T(20,25,'预测间隔 d；青=岭回归；棕=训练中位数；斜线=预测等于参考')+T(490,328,'参考间隔 d →')+T(55,350,'当前查询 '+d.value.toFixed(1)+' d；固定中位数 '+d.baseline.toFixed(1)+' d；点为32台留出设备。');''',
'e2':r'''const extX=Math.max(200,Math.ceil(Math.max(d.L,d.baseL)/50)*50),extY=Math.max(50,Math.ceil(Math.max(d.H,d.baseH)/25)*25),scale=Math.min(290/extX,110/extY),cx=355,cy=175;for(let v=-extX;v<=extX;v+=extX/2)b+=P([[cx+v*scale,cy-110],[cx+v*scale,cy+110]],'#d9e3df')+T(cx+v*scale-10,315,v.toFixed(0));for(let v=-extY;v<=extY;v+=extY)b+=T(12,cy-v*scale+4,v.toFixed(0));b+=P([[cx-290,cy],[cx+290,cy]],'#879c9d')+P([[cx,cy-110],[cx,cy+110]],'#879c9d')+'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+d.baseL*scale+'" ry="'+d.baseH*scale+'" fill="none" stroke="#b78b58" stroke-dasharray="6 4" stroke-width="3"/><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+d.L*scale+'" ry="'+d.H*scale+'" fill="#7fb8b3" fill-opacity=".45" stroke="#247e85" stroke-width="3"/>'+dot(cx,cy,'#264b59',5)+T(20,25,'相对高度 m；青=当前预测；棕虚线=训练平均')+T(485,338,'水平距离 m →')+T(25,355,'L='+d.L.toFixed(1)+'m，H='+d.H.toFixed(1)+'m；横纵同尺，1像素='+(1/scale).toFixed(2)+'m。');''',
'e3':r'''const xy=r=>[80+r.b*520+r.a*260,285-r.a*225];for(let q=.2;q<1;q+=.2){for(const pair of [[{a:q,b:0},{a:q,b:1-q}],[{a:0,b:q},{a:1-q,b:q}],[{a:0,b:1-q},{a:1-q,b:0}]])b+=P(pair.map(xy),'#c6d8d1');b+=T(65+260*q,292-225*q,(q*100).toFixed(0)+'% A');}b+=P([[80,285],[340,60],[600,285],[80,285]],'#9aafa9');const lo=0,hi=80;d.candidates.forEach((r,i)=>{let[x,y]=xy(r),label='A '+r.a.toFixed(2)+' B '+r.b.toFixed(2)+' C '+r.c.toFixed(2)+'，成本 '+r.cost.toFixed(2)+'元/L，预测 '+r.pred.toFixed(2)+'，'+(r.legal?'可行':'超预算');b+='<circle role="button" tabindex="0" aria-label="'+label+'" data-mixture="'+i+'" cx="'+x+'" cy="'+y+'" r="4.8" fill="'+(r.legal?color((r.pred-lo)/(hi-lo)):'#c8ceca')+'"><title>'+label+'</title></circle>';});if(d.best){let[x,y]=xy(d.best);b+='<circle cx="'+x+'" cy="'+y+'" r="10" fill="none" pointer-events="none" stroke="#a45630" stroke-width="3"/>';}let[x,y]=xy(d.fixed);b+='<rect x="'+(x-6)+'" y="'+(y-6)+'" width="12" height="12" fill="none" stroke="#203e61" stroke-width="3" pointer-events="none"/>'+T(308,38,'A=100%')+T(25,309,'C=100%')+T(600,309,'B=100%')+T(20,333,'a=上升比例，b=向右比例，c=1−a−b；网格间距20%')+T(20,355,'灰=超预算，圈=最优，方=固定；点选读取比例/性能/成本。');for(let i=0;i<=80;i++)b+='<rect x="657" y="'+(270-i*2.4)+'" width="12" height="2.5" fill="'+color(i/80)+'"/>';b+=T(675,272,'0')+T(675,80,'80')+T(615,57,'预测指数');''',
'e4':r'''let best=d.best,inj=best.steam/200,total=inj+best.soak+90,x=v=>55+v/total*590;const sections=[[0,inj,'#cc9b5e'],[inj,inj+best.soak,'#9cbab2'],[inj+best.soak,total,'#418a8a']];sections.forEach(([a,z,col])=>b+='<rect x="'+x(a)+'" y="45" width="'+(x(z)-x(a))+'" height="28" fill="'+col+'"/>');[0,inj,inj+best.soak,total].forEach((v,i)=>b+=T(x(v)-8,90+(i===1?16:0),v.toFixed(1)));b+=T(20,25,'周期天数：注汽 '+inj.toFixed(1)+'d / 焖井 '+best.soak+'d / 生产90d');const vals=d.candidates.map(r=>r.J),lo=Math.floor((Math.min(...vals)-10)/50)*50,hi=Math.ceil((Math.max(...vals)+10)/50)*50,px=v=>70+(v-600)/1600*555,py=v=>281-(v-lo)/(hi-lo)*130;[lo,(lo+hi)/2,hi].forEach(v=>b+=P([[70,py(v)],[625,py(v)]],'#d3dfd9')+T(15,py(v)+4,v.toFixed(0)));d.candidates.forEach(r=>b+=dot(px(r.steam),py(r.J),r.legal?'#4b9090':'#d0d3cf',3));b+=dot(px(best.steam),py(best.J),'#a95430',7);if(d.fixed.legal)b+='<rect x="'+(px(d.fixed.steam)-5)+'" y="'+(py(d.fixed.J)-5)+'" width="10" height="10" fill="#203f5a"/>';[600,1000,1400,1800,2200].forEach(v=>b+=T(px(v)-14,304,v));b+=T(15,137,'折算目标 J / t油；每一列含8档焖井天数')+T(470,327,'蒸汽量 t →')+T(20,350,'青=可行，灰=超限，棕圈=最佳J，方=可行固定方案；无逐日产油模型。');''',
'e5':r'''const x=v=>70+(v-25)/45*530,y=v=>275-(v-5)/85*215;d.surface.forEach(r=>{let a=Math.max(70,x(r.t)-14.73),z=Math.min(600,x(r.t)+14.73),top=Math.max(60,y(r.s)-5.98),bottom=Math.min(275,y(r.s)+5.98);b+='<rect x="'+a+'" y="'+top+'" width="'+(z-a)+'" height="'+(bottom-top)+'" fill="'+color(r.pred/100)+'"><title>'+r.t.toFixed(1)+'°C，'+r.s.toFixed(1)+'g/L，活性'+r.pred.toFixed(1)+'</title></rect>';});d.train.forEach(r=>b+='<circle cx="'+x(r.x[0])+'" cy="'+y(r.x[1])+'" r="2.6" fill="none" stroke="#fff" stroke-width="1.2"/>');b+='<circle cx="'+x(d.query[0])+'" cy="'+y(d.query[1])+'" r="8" fill="none" stroke="#182e50" stroke-width="3"/>';[25,35,45,55,65,70].forEach(v=>b+=T(x(v)-7,300,v));[5,25,45,65,90].forEach(v=>b+=T(30,y(v)+4,v));for(let i=0;i<=100;i++)b+='<rect x="635" y="'+(275-i*2.15)+'" width="14" height="2.3" fill="'+color(i/100)+'"/>';b+=T(20,25,'盐度 g/L；空心白点=训练批，深蓝圈=查询')+T(658,66,'100')+T(658,279,'0')+T(625,42,'活性')+T(450,326,'温度 °C →')+T(20,350,'色标固定0–100；当前预测 '+d.value.toFixed(1)+'；培养活性不能换算为增油量。');'''
}

def replace_chart(s,body):
    start=s.index('function chart(d)')
    end=s.index('function settings()',start)
    return s[:start]+"function chart(d){let b='';"+body+"return S(b);}\n"+s[end:]

for id in IDS:
    p=ROOT/id;c=json.loads((p/'case.json').read_text(encoding='utf-8'));demo=(p/'demo.html').read_text(encoding='utf-8');app=(p/'app.js').read_text(encoding='utf-8')
    # Keep the teaching task in both the original portal background and standalone lab.
    task='<aside class="learning-task"><h3>动手前先提出判断</h3><p>'+TASKS[id]+'</p></aside>'
    c['tabs']['background']['sections'].append({'no':len(c['tabs']['background']['sections'])+1,'en':'LEARNING_TASK','title':'课堂实验：一次只改变一个条件','html':task})
    demo=demo.replace('<section id="lab" hidden>','<section id="lab" hidden>'+task,1)
    if id in RENDERS:
        app=replace_chart(app,RENDERS[id])
        app=app.replace("location.hash=b.dataset.tab;","try{location.hash=b.dataset.tab;}catch(e){/* opaque iframe may reject history writes; local tab stays usable */}")
        # One delegated event surface covers both matrices; all data cells also support keyboard.
        a=app.index("$('#results [data-cell]')")
        z=app.index("if(r.chart.kind==='tools')",a)
        app=app[:a]+"""const inspect=e=>{const el=e.target.closest('[data-cell],[data-mixture]');if(!el)return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;if(e.type==='keydown')e.preventDefault();if(el.dataset.cell){const[z,a,v]=el.dataset.cell.split(',');$('#cell-info').textContent='相对深度 '+(Number(z)*.1).toFixed(1)+'m；方位 '+Number(a)*10+'°；'+(Number(el.getAttribute('x'))>380?'去背景残差 ':'原始内半径偏差 ')+v+'mm';}else{const q=r.chart.candidates[Number(el.dataset.mixture)];$('#cell-info').textContent='A '+q.a.toFixed(2)+' / B '+q.b.toFixed(2)+' / C '+q.c.toFixed(2)+'；成本 '+q.cost.toFixed(2)+' 元/L；预测性能指数 '+q.pred.toFixed(2)+'；'+(q.legal?'满足预算':'超出预算');}};$('#results').addEventListener('click',inspect);$('#results').addEventListener('keydown',inspect);"""+app[z:]
        # Replace accumulating delegated handlers whenever results are rerun.
        app=app.replace("$('#results').addEventListener('click',inspect);$('#results').addEventListener('keydown',inspect);","$('#results').onclick=inspect;$('#results').onkeydown=inspect;")
        css=(p/'demo.css').read_text(encoding='utf-8')+'\n.learning-task{padding:18px 22px;background:#e9f2ed;border-left:4px solid #247e85;border-radius:8px;margin:18px 0}.computed-chart [role=button]:focus{outline:none;stroke:#172e50;stroke-width:3}figure{overflow-x:auto}figure svg{min-width:620px;max-height:none!important;height:auto}\n'
        write(p/'demo.css',css)
    write(p/'case.json',json.dumps(c,ensure_ascii=False,indent=2)+'\n');write(p/'demo.html',demo);write(p/'app.js',app)

# Concept-specific revisions go into case.json and the same standalone HTML.
def edit(id,old,new):
    p=ROOT/id;c=json.loads((p/'case.json').read_text(encoding='utf-8'));d=(p/'demo.html').read_text(encoding='utf-8')
    def walk(x):
        if isinstance(x,str):return x.replace(old,new)
        if isinstance(x,list):return [walk(v) for v in x]
        if isinstance(x,dict):return {k:walk(v) for k,v in x.items()}
        return x
    write(p/'case.json',json.dumps(walk(c),ensure_ascii=False,indent=2)+'\n');write(p/'demo.html',d.replace(old,new))

edit('wo2','本体外径加4mm教学余量是否小于通径','本体外径加4mm教学直径余量是否不大于通径')
edit('wo2','尺寸以毫米、拉力以千牛记录。','尺寸以毫米、拉力以千牛记录。4mm是直径余量（单侧2mm），是本例自定筛选条件，不是通用施工标准。')
edit('wo3','横轴是方位角0–360°，纵轴是深度。','横轴是方位角0–360°，纵轴是相对深度0–3.5m（向下增加）。0°与360°是同一方向，切口两侧在井筒上相邻。')
edit('wo3','颜色表示相对名义内半径的偏差，不是照片颜色。','颜色表示相对名义内半径的偏差，单位mm。正值表示内腔半径变大，可能对应内壁金属损失；负值可能来自结垢或变形。本演示只检测正残差局部凹坑，不能据此求剩余壁厚或检测外壁腐蚀。')
edit('wo3','以每一方位跨深度的中位数拟合该背景','以每一方位跨深度的中位数估计该背景（未拟合谐波系数）')
edit('wo3','局部异常在扣除背景后仍形成连片正残差。','局部异常在扣除背景后仍形成连片正残差。它假定每个方位多数深度完好；长段连续损伤会被背景吸收，这种方法会漏检。')
edit('wo5','检修前已知的平均负荷、含砂与停机次数','检修A时已知的、A之前半年平均负荷、含砂与停机次数')
edit('wo5','负荷、含砂、停机均取自下一次检修前可见历史','预测时点固定在检修A，负荷、含砂、停机仅取A之前半年历史；目标为之后A至B的完整间隔')
edit('wo5','80台训练设备拟合标准化岭回归','80台训练设备拟合按预先工程范围缩放的岭回归')
edit('wo5','另显示留出误差范围','另显示32台留出设备的MAE')
edit('wo5','标准化输入带截距的岭回归','按固定工程尺度缩放后输入带截距的岭回归')
edit('e2','面积变大与形状拉长是不同变化。','面积πLH变大与形状拉长是不同变化。几何扩大可能增加与储层的接触，但产能还取决于裂缝导流能力（渗透率×宽度）、支撑剂分布和储层渗透性；本例没有这些量，也没有产量模型，不能从面积直接换算增油。')
edit('e2','二维接触投影面积','二维几何投影面积')
edit('e3','颜色与最优点。','颜色与最优点；色标固定0–80，便于跨盐度比较。三元图上顶A、左下C、右下B，20%网格用于读比例，单点步长5%。')
edit('e4','界面用时间带对齐阶段，用产油曲线说明产出来自生产段。','界面以时间带对齐阶段，以候选散点比较固定90天生产窗的累计产油折算目标；本例没有逐日产油曲线。蒸汽加热可降低稠油黏度，焖井促进热量传递，随后同井开采；这里的初温只是代理输入，没有模拟热传导或蒸汽品质。')
edit('e5','本例活性是0–100的相对培养响应','本例固定同一教学菌群与培养时长，活性是0–100的相对培养响应（无量纲，非菌数、代谢速率或真实实验检测值）')
edit('e5','这些机制能否带来增油，需要另外的相容性与驱替试验。','这些机制能否带来增油，需要另做代谢产物测定、油水界面性质、储层相容性及岩心驱替试验；培养条件下活跃也可能无法在孔隙中存活或运移。')
edit('e1','图中尺寸不对应现场设计。','图中尺寸不对应现场设计。较大接触范围只提供流动机会，裂缝导流还取决于支撑通道的宽度和渗透性。本例增油由合成试验响应学习，不是用图上裂缝长度换算；固定90天统计窗也不等于最终采收率。')

# Replace misleading illustrative response plots with explicitly schematic labels.
for id in ['wo1','e1']:
    p=ROOT/id;c=json.loads((p/'case.json').read_text(encoding='utf-8'));d=(p/'demo.html').read_text(encoding='utf-8')
    # Static pedagogic sketches must not pretend to be measured numeric charts.
    for section in c['tabs']['background']['sections']:
        if '<svg' in section['html'] and id=='e1':
            old=section['html'];section['html']=old.replace('</figcaption>','（背景概念草图，无数值刻度；当前实算刻度见演示图。）</figcaption>');d=d.replace(old,section['html'])
    write(p/'case.json',json.dumps(c,ensure_ascii=False,indent=2)+'\n');write(p/'demo.html',d)

# Update computed explanations without altering any prediction or baseline model.
updates={
'wo2':("每个候选均保留抓持区间、本体尺寸、承载和排除理由。工具目录为教学虚构规格。","当前外径 '+p.fish+'mm、内径 '+p.bore+'mm，内捞/外捞分别读取不同尺寸；本体外径+4mm≤'+p.clearance+'mm，容量≥'+p.pull+'kN。4mm为直径余量（单侧2mm），只属教学规则。每个候选附排除理由，目录不是现场产品规格。"),
'wo5':("输入只含负荷、含砂和历史停机。","预测锚点为检修A，三个输入均取A之前半年。按预声明工程常数缩放（非用测试拟合的均值/方差）。当前负荷 '+p.load+'%、含砂 '+p.sand+'g/L、历史停机 '+p.stops+'次；历史中位数 '+median.toFixed(1)+'d不随查询变化。"),
'e2':("二维接触投影面积 ","二维几何投影面积 "),
'e3':("固定配方成本5.10元/L，超预算时不作为可行对照。","当前盐度 '+p.salinity+'g/L、预算 '+p.budget.toFixed(2)+'元/L；固定配方预测 '+fixed.pred.toFixed(2)+'，成本 '+fixed.cost.toFixed(2)+'元/L，'+(fixed.cost<=p.budget?'满足预算':'超预算，不可行')+'。当前最优预测 '+(best?best.pred.toFixed(2):'不适用')+'；性能是无量纲教学指数，不是采收率百分点。"),
'e4':("不能将不同窗口累计量混比。","总周期 '+(best.steam/200+best.soak+90).toFixed(1)+'d；汽油比 '+(best.steam/best.oil).toFixed(2)+'t汽/t油。固定1200t/4d：预测产油 '+fixed.oil.toFixed(1)+'t、J='+fixed.J.toFixed(1)+'t油，'+(fixed.legal?'满足蒸汽上限':'超蒸汽上限，不可行')+'。这是质量汽油比，不含蒸汽品质/焓值，不能当能量效率；固定90d累计量不是每日产量。"),
'e5':("指数并非增油量。","当前 '+p.temperature+'°C、'+p.salinity+'g/L、k='+k+'；单温度基线 '+base(query).toFixed(1)+'不使用盐度。活性为固定培养条件的无量纲相对响应；高活性还须代谢物和岩心驱替验证才能支持增油。当前k为探索参数，留出MAE不是调参后独立的最终验收。")
}
for id,(old,new) in updates.items():
    p=ROOT/id/'engine.js';s=p.read_text(encoding='utf-8');assert old in s,(id,old);write(p,s.replace(old,new))

print('Updated source teaching content, charts, explanations and tasks for '+', '.join(IDS))
