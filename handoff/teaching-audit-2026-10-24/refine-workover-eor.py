from pathlib import Path
import json,re,html
R=Path(r'G:\可视化导论\5\expansion-src')
def w(p,s):p.write_text(s,encoding='utf-8',newline='\n')
def t(x,y,s,size=17):return f'<text x="{x}" y="{y}" font-size="{size}">{html.escape(s)}</text>'
def fig(b,caption):return '<figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" role="img" aria-label="'+html.escape(caption)+'"><rect width="760" height="300" rx="14" fill="#f0f5f4"/><g font-family="system-ui,Microsoft YaHei" font-size="17" fill="#254755">'+b+'</g></svg><figcaption>'+caption+'</figcaption></figure>'
def replace_figure(id,index,new):
 p=R/id;c=json.loads((p/'case.json').read_text(encoding='utf-8'));d=(p/'demo.html').read_text(encoding='utf-8');s=c['tabs']['background']['sections'][index];m=re.search(r'<figure[\s\S]*?</figure>',s['html']);assert m,id
 old=m[0];s['html']=s['html'].replace(old,new);d=d.replace(old,new)
 # The two flagship standalone versions include heading inside figures, unlike the portal HTML.
 if old not in (p/'demo.html').read_text(encoding='utf-8'):
  bg=re.search(r'<section id="background">([\s\S]*?)</section>',d);figs=list(re.finditer(r'<figure[\s\S]*?</figure>',bg[1]));fm=figs[index];base=bg.start(1);d=d[:base+fm.start()]+new+d[base+fm.end():]
 w(p/'case.json',json.dumps(c,ensure_ascii=False,indent=2)+'\n');w(p/'demo.html',d)

# Physical dimensions belong to distinct objects and are compared explicitly.
b=''
for x,title in [(30,'内捞：对照落鱼内径'),(390,'外捞：对照落鱼外径')]:
 b+=t(x,30,title)+f'<path d="M{x+25} 60V210M{x+265} 60V210" stroke="#72939b" stroke-width="8"/>'
 b+=f'<rect x="{x+100}" y="110" width="90" height="105" fill="#b7a185"/><rect x="{x+126}" y="110" width="38" height="105" fill="#fff"/>'
 if x==30:b+=f'<path d="M{x+145} 55V165" stroke="#cb8a49" stroke-width="15"/>'+t(x+5,245,'内径40mm → S2抓持35–65mm',16)
 else:b+=f'<path d="M{x+91} 70V157M{x+199} 70V157M{x+91} 70H{x+199}" stroke="#cb8a49" stroke-width="12" fill="none"/>'+t(x+5,245,'外径65mm → O1抓持40–75mm',16)
b+=t(28,282,'默认通径125mm：S2本体92+4≤125；O1本体100+4≤125（均为直径）。',16)
replace_figure('wo2',0,fig(b,'灰蓝=井筒限制，棕=落鱼，橙=抓持工具。位置示意不按比例；尺寸须看数值。'))

# Explain the circular seam and the sign of an inner-wall radius measurement.
b='<circle cx="125" cy="132" r="75" fill="none" stroke="#8da7ae" stroke-width="18"/><path d="M125 132H200" stroke="#bf8150" stroke-width="3"/>'+t(73,135,'内腔')+t(207,137,'0°/360°切口')+t(60,240,'半径增大：内壁凹坑')
b+='<path d="M335 60H720M335 60V235" stroke="#809fa6" fill="none"/>'
for a in [0,90,180,270,360]:
 x=335+a/360*360;b+=t(x-10,45,str(a)+'°',15)+f'<path d="M{x} 60V235" stroke="#cfdbd6"/>'
for z in [0,1,2,3,3.5]:
 y=60+z/3.5*175;b+=t(295,y+5,str(z),15)+f'<path d="M335 {y}H695" stroke="#cfdbd6"/>'
b+='<rect x="455" y="125" width="80" height="45" fill="#bd7949"/>'+t(365,266,'展开后：相对深度m向下；方位向右',16)+t(335,287,'棕块示意局部正半径偏差；实算色标见演示',15)
replace_figure('wo3',0,fig(b,'圆周切开成为深度×方位图；切口左右实际相邻，不能当成两个井壁。'))

# One nonduplicated fracture sketch makes the flow path legible.
b='<rect x="35" y="65" width="435" height="180" fill="#dfceb2"/><path d="M35 105H470M35 158H470M35 210H470" stroke="#baab8c"/><path d="M70 35V180H435" stroke="#284c61" stroke-width="15" fill="none"/>'
for x in [160,270,375]:
 b+=f'<path d="M{x} 180l-20 -75M{x} 180l22 58" stroke="#258c96" stroke-width="9"/>'
 for y in [135,155,207]:b+=f'<circle cx="{x+(y-180)*.27}" cy="{y}" r="4" fill="#ce8c43"/>'
b+=t(490,78,'深蓝：井筒')+t(490,122,'青：压裂液形成通道')+t(490,166,'橙点：支撑剂维持开度')+t(490,215,'岩层性质影响响应',16)+t(42,280,'接触范围与通道导流共同影响流动；图不按比例，不能由图形长度直接算增油。',16)
replace_figure('e1',0,fig(b,'液体形成裂缝、支撑剂维持流道；增油模型学习合成试验，图形用于解释对象。'))

# A2/A3 sketches are explicitly schematic, while runtime plots carry real scales.
for id in ['wo1','e1']:
 p=R/id;c=json.loads((p/'case.json').read_text(encoding='utf-8'));d=(p/'demo.html').read_text(encoding='utf-8')
 if id=='wo1':
  extra='<p><b>先读变量：</b>压损MPa是当前流路压差线索，不能单独定位堵塞；含砂g/L是液样单位体积的固体质量；电流波动%为相对平均电流变化；沉积指数0–1是本例自定观察量，非行业统一量表；环空压力MPa对应油管/套管间空间压力。完整性状态“已核查/可疑”来自人工记录，是候选约束，不是模型推断。</p>'
  c['tabs']['background']['sections'][0]['html']+=extra;d=d.replace('</section><section id="workflow"',extra+'</section><section id="workflow"',1)
 w(p/'case.json',json.dumps(c,ensure_ascii=False,indent=2)+'\n');w(p/'demo.html',d)

# wo4: separate explanatory normal load from the residual used to trigger alarms.
p=R/'wo4'/'engine.js';s=p.read_text(encoding='utf-8').replace('rows.push({t,y,pred,event});','rows.push({t,y,pred,event,speed,stage});');w(p,s)
p=R/'wo4'/'app.js';s=p.read_text(encoding='utf-8');start=s.index('function chart(d)');end=s.index('function settings()',start)
chart=r'''function chart(d){let b='',x=t=>70+t/119*590;const vals=d.rows.flatMap(r=>[r.y,r.pred,108]),lo=Math.floor((Math.min(...vals)-3)/10)*10,hi=Math.ceil((Math.max(...vals)+3)/10)*10,y=v=>190-(v-lo)/(hi-lo)*140,res=d.rows.map(r=>r.y-r.pred),rlo=Math.floor((Math.min(...res,0)-2)/5)*5,rhi=Math.ceil((Math.max(...res,d.threshold)+2)/5)*5,ry=v=>350-(v-rlo)/(rhi-rlo)*105;
// Reference shading is display/evaluation only; model predictions were computed before it.
if(d.rows.some(r=>r.event))b+='<rect x="'+x(65)+'" y="42" width="'+(x(80)-x(65))+'" height="315" fill="#dba15d" opacity=".14"/>';
[0,35,96].forEach((v,i)=>{const end=[35,96,120][i];b+='<rect x="'+x(v)+'" y="212" width="'+(x(end)-x(v))+'" height="13" fill="'+(i===1?'#9cbdb1':'#c9d8d4')+'"/>';});
for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4;b+=P([[70,y(v)],[660,y(v)]],'#d7e2df')+T(18,y(v)+4,v.toFixed(0));}
b+=P(d.rows.map(r=>[x(r.t),y(r.y)]))+P(d.rows.map(r=>[x(r.t),y(r.pred)]),'#bc8d59')+'<path d="M70 '+y(108)+'H660" stroke="#8b6f81" stroke-dasharray="5 4"/>';
[rlo,0,d.threshold,rhi].filter((v,i,a)=>a.indexOf(v)===i).forEach(v=>b+=T(15,ry(v)+4,v.toFixed(0)));
b+=P(d.rows.map(r=>[x(r.t),ry(r.y-r.pred)]))+'<path d="M70 '+ry(d.threshold)+'H660" stroke="#a84e31" stroke-dasharray="5 4"/>';
d.alarm.forEach((a,i)=>{if(a)b+='<rect x="'+x(i)+'" y="360" width="5" height="10" fill="#a84e31"/>';});
[0,30,60,90,119].forEach(v=>b+=T(x(v)-8,390,v));b+=T(18,24,'钩载 kN：青=实测；棕=正常预测；虚线=108kN基线')+T(76,207,'阶段0 / 阶段1（教学+8kN项） / 阶段0')+T(18,243,'残差 kN：实测−预测；虚线阈值 '+d.threshold+'kN')+T(430,410,'时间 min →')+T(18,433,'橙阴影=65–79min评价事件（若有）；底带=持续3点报警；漂移也可越阈值。');return S(b);}
'''
s=s[:start]+chart+s[end:];s=s.replace('viewBox="0 0 720 360"','viewBox="0 0 720 450"').replace('<rect width="720" height="360"','<rect width="720" height="450"');w(p,s)

# e4: connect each soak-time trajectory, distinguish optimum, keep fixed-cost comparator.
p=R/'e4'/'app.js';s=p.read_text(encoding='utf-8');needle="d.candidates.forEach(r=>b+=dot(px(r.steam),py(r.J),r.legal?'#4b9090':'#d0d3cf',3));";replacement="for(let soak=1;soak<=8;soak++){const line=d.candidates.filter(r=>r.soak===soak&&r.legal);b+=P(line.map(r=>[px(r.steam),py(r.J)]),soak===best.soak?'#a95430':'#a9c7c0');}"+needle;s=s.replace(needle,replacement).replace("'青=可行，灰=超限，棕圈=最佳J，方=可行固定方案；无逐日产油模型。'","'青=可行；棕线=最佳焖井'+best.soak+'d轨迹；棕圈=最佳J；方=可行固定。'");w(p,s)

# Keep portal workflow illustrations synchronized with actual standalone figures.
for id in ['wo2','wo3','wo4','wo5','e2','e3','e4','e5']:
 p=R/id;c=json.loads((p/'case.json').read_text(encoding='utf-8'));d=(p/'demo.html').read_text(encoding='utf-8')
 # Replace the repeated four-box flow with a focused one-step I/O diagram.
 matches=list(re.finditer(r'<article class="workflow-step"[\s\S]*?</article>',d));atlas=[]
 for i,(step,m) in enumerate(zip(c['tabs']['workflow']['steps'],matches)):
  name=step['name'];out=step['effect'];trap=step['trap'];b=t(28,36,'步骤 '+str(i+1)+'｜'+name,21)
  b+='<rect x="25" y="60" width="710" height="67" rx="10" fill="#dcebe7"/>'+t(42,89,'动作：'+step['do'][:34],16)
  if len(step['do'])>34:b+=t(42,113,step['do'][34:70],16)
  b+='<path d="M380 132V158" stroke="#247e85" stroke-width="3"/>'+t(360,151,'↓',19)+t(28,187,'产物：'+out,18)+t(28,235,'检查：'+trap[:36],16)
  new=fig(b,'图 F'+str(i+1)+'：'+name+'的动作、产物和检查点。')
  old=re.search(r'<figure[\s\S]*?</figure>',m[0])[0];d=d.replace(old,new,1);atlas.append('<h4>图 F'+str(i+1)+'｜'+name+'</h4>'+new)
 c['tabs']['workflow']['metrics']['html']=c['tabs']['workflow']['metrics']['html'].split('<h3>逐步图册')[0]+'<h3>逐步图册（与独立演示相同）</h3>'+''.join(atlas)
 w(p/'case.json',json.dumps(c,ensure_ascii=False,indent=2)+'\n');w(p/'demo.html',d)
print('Refined physical diagrams, load/residual plots, cycle trajectories, and synchronized workflow atlas.')
