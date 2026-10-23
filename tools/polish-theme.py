from pathlib import Path
import json, hashlib, shutil
R=Path(__file__).resolve().parent.parent
log=[]
def edit(name,pairs):
 p=R/name
 s=p.read_text(encoding='utf-8')
 for old,new in pairs:
  assert old in s,(name,old)
  log.append({'path':name,'before':old,'after':new})
  s=s.replace(old,new)
 p.write_text(s,encoding='utf-8',newline='\n')
edit('shared/lab.js',[
 ('指标按当前运行实算；未经现场验证。','当前结果已更新。'),
 ("function matrix(m,names,method='model'){return table(['真值↓ / 预测→',...names,'拒判','召回'],m.matrix.map((row,c)=>[esc(names[c]),...row.map((n,j)=>`<button data-cell=\"${method},${c},${j}\">${n}</button>`),pct(m.perClass[c].recall)]));}","function matrix(m,names,method='model'){return '<div class=\"matrix heat-matrix\">'+table(['真值↓ / 预测→',...names,'拒判','召回'],m.matrix.map((row,c)=>{const total=row.reduce((a,b)=>a+b,0);return[esc(names[c]),...row.map((n,j)=>{const alpha=total?n/total:0,hue=j===c?'40,124,120':j===names.length?'105,117,130':'184,93,81';return `<button data-cell=\"${method},${c},${j}\" style=\"background:rgba(${hue},${.06+.64*alpha});color:#163b3d\" title=\"${esc(names[c])} → ${esc(names[j]??'拒判')}：${n} / ${total}\" aria-label=\"${esc(names[c])}预测为${esc(names[j]??'拒判')} ${n}例\">${n}</button>`;}),pct(m.perClass[c].recall)];}))+'<p class=\"fine\">颜色深浅表示该真值行中的占比；青色为对角线、赭红为误判、灰色为拒判。点击格子回查样本。</p></div>';}")])
edit('shared/teaching-view.js',[
 ('二维可见面积不代表地层体积；教学外观不能替代矿物鉴定。','切换颗粒数与二维可见面积，看大颗粒怎样影响外观比例。'),
 ('反事实工况没有金标，隐藏性能；关联候选不能直接宣布油气层。','把地面峰位与更早的工况对齐，比较各个解释的近邻依据。'),
 ('荧光显示不等于油气来源；校正无法恢复已饱和的信息。','对照白光轮廓与UV显示，再观察高曝光下饱和区域的变化。'),
 ('输出候选响应段；聚类中心不能直接命名为真实岩性。','切换原始与校正曲线，找出工况阶跃附近的候选界面。'),
 ('NB与关键词在内置测试上成绩相同；本例重点是来源、否定与人工复核。','核对否定、单位与深度；改写一句话，观察核验状态如何变化。'),
 ('<b>判断边界</b>','<b>接着核对</b>'),
 ('仅生成可见图像，不读取掩膜真值，不运行分类。两张图来自同一父样品 DEMO-017-P1，位置一致。','同一教学样品 DEMO-017-P1 的白光与UV，位置一致；调整曝光观察亮度与饱和变化。'),
 ('用当前曝光运行真实分割','用当前曝光进行分割')])
edit('case-src/m1/enhance.js',[
 ('这是主动复核排序，不会把当前测试样品偷偷加入训练，也不覆盖原模型指标。','复核顺序按当前候选排序；人工意见另存，模型评价保留原结果。'),
 ('显示与计算使用未改动的原始JPEG；不生成虚假UV。','显示与计算使用原始JPEG。')])
edit('case-src/m3/enhance.js',[
 ('此处回放真实保存的参数，不插值伪造迭代。主表与导出保留最终模型，快照仅供理解学习过程。','滑块读取保存的训练权重；主结果与导出使用最终模型。'),
 ('只记录观察变化，不由可溶性自动推出地层原油；不提供化学操作教程。','观察变化本身不足以确定地层原油来源。')])
edit('case-src/m3/lesson.js',[
 ('显示训练过程，不使用预存结果冒充运行','逐轮显示当前训练样本的损失与权重变化'),
 ('矿物发光仍算显示正类；不能为提高成绩改成负类。','评价对象为荧光显示，矿物发光也计为正类。')])
edit('case-src/m5/enhance.js',[
 ('恢复后真实重算，并把所有旧确认标为待复核；不会继承过期确认，不使用父站私有存储。','恢复后按保存参数重新计算，历史确认保留为待复核。'),
 ('没有词项匹配；可尝试原文词语、ID或数值。没有为自由输入编造Recall/F1。','没有词项匹配；可尝试原文词语、ID或数值。')])
edit('case-src/m5/lesson.js',[
 ('分数不是校准概率；不伪造训练损失','对数分数用于类别比较；产物为词频、先验与词表'),
 ('未知版本/缺引用不能假装成功。','未知版本或缺失引用进入导入问题列表。'),
 ('内置上游快照由实际算法构建时生成，页面明确标记为快照，不冒称本页重新运行了上游模型。','内置m1–m4计算快照；也可导入你刚导出的JSON，更新当前来源。'),
 ('每例自带默认证据快照；导入JSON是显式交换，不依赖父站状态。','内置上游计算快照；选择JSON可导入本次运行的新证据。')])
edit('case-src/m5/ui.js',[
 ('没有虚构损失曲线。',''),
 ('这些是原始文本管线的金标评价','NB与关键词在内置测试上的宏F1相同，比较重点还包括分数依据和逐句核验。这些是原始文本管线的金标评价')])
edit('tools/build-cases.mjs',[
 ('所有内容可独立离线运行，不访问父站私有状态。','数据来源与评价范围分别列示。'),
 ('数据站与适用边界','数据与适用范围'),
 (' · 纯前端自包含 · 仅供教学解释</footer>','</footer>')])
edit('portal/assets/s17-home.js',[
 ('本案例实现范围 · ','这次要解决的问题 · '),
 ('。原地图的场景目标保留供理解方向。','。'),
 ('预测、基线与指标实际计算；公开实测对照另行署名，不与教学成绩混用。','比较预测与规则基线，回查每个结果的来源；公开实测对照附有独立出处。'),
 ('<div class="s17-hero"><div>','<div class="s17-hero"><figure class="s17-theme"><img src="assets/petroleum-dawn-v1.png" width="1942" height="809" alt="清晨的陆地钻井井场与层状岩石，墨青和砂金色主题插画"><figcaption>井场晨光 · 原创主题插画</figcaption></figure><div class="s17-hero-copy">'),
 ('<div class="s17-story">\'+story()+\'</div>','')])
edit('shared/visual-explorers.js',[
 ('来自本次实际计算 · 观察、预测与人工意见分开','本次运行已更新 · 可交互探索'),
 ('交互设计参考与数据边界','图形参考与数据说明'),
 ('本站以本地SVG / Canvas自行实现，运行不依赖参考站。图形读取当前观测和预测，不读取评价真值；这里的浏览操作不改变模型或指标。','图形使用当前观测与预测；浏览不改变计算结果。参考链接供延伸阅读，离线运行使用网站本地资源。'),
 ('放大只帮助观察；显示差异不直接代表分类正确或油气来源。','同一坐标读取两幅原图；黄色小框标出当前像素。'),
 ('断线表示缺测，不跨缺测插值；局部视图只改变阅读区间。候选线来自模型输出，不代表确认的地层或成因。','断线表示缺测；选区改变阅读范围，虚线标出本次模型的候选位置。'),
 ('这个筛选下没有句子，未生成虚构的关系带。','这个筛选下没有句子。'),
 ("colors=['#3f8669','#ae8650','#7c91a0','#9e8f9c','#8d9b55']","colors=['#287c78','#bf8d48','#637fa3','#8765a1','#a96050'],sourceOrder=[...new Set(o.claims.map(c=>c.source))],colorFor=(label,k)=>k===0?colors[sourceOrder.indexOf(label)%colors.length]:k===1?({观察记录:'#637fa3',模型候选:'#8765a1',人工意见:'#287c78'}[label]??'#697582'):({已人工确认:'#287c78',已驳回:'#b85d51',需重新核验:'#bf8d48',尚未核验:'#697582'}[label]??'#697582')"),
 ('color=colors[columns[k].indexOf(n)%colors.length]','color=colorFor(n.label,k)'),
 ("${selected?'#b57844':color}","${selected?'#bd7539':color}"),
 ('${selected?.85:.28}','${selected?.88:.38}'),
 ('${colors[i%colors.length]}','${colorFor(n.label,k)}')])
edit('shared/teaching.js',[("const palette=['#22745f','#ae693f','#6d6d94','#9b8437'];","const palette=['#287c78','#bf8d48','#8765a1','#637fa3'];"),("const rockColors=['#b58a54','#557665','#8b8c79','#bc824a'];","const rockColors=['#c29a58','#557b76','#8e92a0','#b56a51'];")])
for n in ['case-src/m2/ui.js','case-src/m4/ui.js']:
 edit(n,[('#3f8469','#287c78'),('#ad8450','#bf8d48'),('#7d92a1','#637fa3')])
theme=R/'portal/assets/petroleum-dawn-v1.png'
shutil.copyfile(Path('C:/Users/123/.codex/generated_images/01a16776-db87-7843-b1df-a6b9663b9c04/exec-2c8ac3b9-fa11-4488-bcf6-872e494e2071.png'),theme)
(R/'handoff/interactive-views-2026-10-23/wording-changes.json').write_text(json.dumps(log,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'replacements':len(log),'themeBytes':theme.stat().st_size,'themeSHA256':hashlib.sha256(theme.read_bytes()).hexdigest()}))
