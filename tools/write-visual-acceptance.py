from pathlib import Path
import json,base64,html,datetime
R=Path(__file__).resolve().parent.parent;D=R/'handoff/interactive-views-2026-10-23'
J=lambda p:json.loads(p.read_text(encoding='utf-8'))
V=J(D/'verification.json');S=J(R/'handoff/suite-build-lock.json')
assert V['failed']==0
reports=V['browserReports']
for r in reports:assert J(R/r['file'])['failed']==0
names=['岩屑外观','气测解释','荧光判读','钻时分段','证据报告']
types=['图像滑动对照、同步像素放大；直方图、训练特征散点、混淆热图','总览框选、多通道共同时间轴、同步游标与气峰定位','同身份白光/UV滑动对照、像素放大、得分热图与训练损失','深度轨道、局部区间与多曲线联动、候选界面定位','按句数计算的证据关系带、状态筛选、逐句来源回查、分类混淆热图']
colors=[('#193e45','标题与坐标文字'),('#287c78','主响应、计算结果'),('#bf8d48','原始对照、候选位置'),('#8765a1','荧光/模型候选'),('#637fa3','工况/观察记录'),('#b85d51','误判/驳回')]
def fig(file,caption,full=False):
 p=R/'output/playwright/interactive-views'/file
 return '<figure'+(' class="full"' if full else '')+'><img loading="lazy" src="data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()+'" alt="'+html.escape(caption)+'"><figcaption>'+caption+'</figcaption></figure>'
table=''.join('<tr><td>m'+str(i+1)+' · '+names[i]+'</td><td>'+types[i]+'</td><td><a href="../../dist/cases/'+c['caseId']+'/demo/index.html#lab">打开实验</a></td></tr>' for i,c in enumerate(S['cases']))
counts=''.join('<tr><td><a href="'+Path(r['file']).name+'">'+Path(r['file']).name+'</a></td><td>'+str(r['passed'])+' / 0</td><td>'+html.escape(r['scope'])+'</td></tr>' for r in reports)
palette=''.join('<span class="swatch"><i style="background:'+c+'"></i>'+n+' <code>'+c+'</code></span>' for c,n in colors)
doc='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>井见 1.5 · 图形、主题与实际验收</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f4eb;color:#193e45;font:15px/1.9 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1180px;margin:auto;padding:44px 24px}h1{font-size:36px;line-height:1.4}h2{font-size:24px;margin-top:40px}a{color:#246d69}p{max-width:1000px}.links{display:flex;gap:18px;flex-wrap:wrap}.tag{font-size:12px;color:#52746c}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0 0 18px;padding:12px;background:#fffdf6;border:1px solid #d5ded7;border-radius:10px;min-width:0}figure img{width:100%;height:auto;display:block}figcaption{font-size:12px;color:#5d756b;padding:8px}.full{grid-column:1/-1}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #d4dfd9;padding:11px;text-align:left;vertical-align:top}th{background:#e9eee6}.scroll{overflow:auto}.swatch{display:inline-flex;align-items:center;gap:8px;margin:8px 18px 8px 0;font-size:12px}.swatch i{width:25px;height:25px;border-radius:5px}.callout{padding:18px;background:#e7efea;border-radius:10px}.mobile{max-width:390px}code{font-size:12px}li{margin:5px 0}@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding:25px 16px}h1{font-size:27px}table{min-width:650px}}</style><main>
<p class="tag">学号17 · 第4阶段录井 · 2026-10-23 · 门户1.5.0-preview / 五例1.3.0</p><h1>让井场、数据与判断，都有看得见的依据</h1>
<p>本轮在既有五例上加入三组交互视图、首页石油主题画面、语义配色与混淆热图，并按子Agent审阅调整展示文案。老师原站及添加案例契约保留。其他56例和G5未扩展。</p>
<div class="links"><a href="../../portal/index.html">增强首页</a><a href="../../portal-original/index.html">老师原站</a><a href="../../dist/s17-mudlogging-cases-only-1.3.0.zip">五例轻量包</a><a href="../../dist/s17-mudlogging-with-assistant-1.5.0-preview.zip">完整预览包</a></div>
<h2>首页主题与色彩</h2><p>「井场晨光」用陆地钻井井场、沉积地貌和层状岩石形成主题。图片本地保存，断网可显示。主题画面为本次内置image_gen原创生成；生成提示词、尺寸与SHA256见<a href="../../portal/assets/petroleum-dawn-v1.txt">资源说明</a>。</p>'''
doc+=fig('home-desktop.png','最终首页 · 1440px桌面浏览器实际截图，完成数与本浏览器导入数分别显示。',True)
doc+='<div>'+palette+'</div><p>同一图内保持颜色对应，数量由位置、长度或带宽表示，颜色用于区分类别。重要数值仍有文字与单位；分类格子同时用数字和位置表达，避免只依赖颜色。报告筛选保留来源、性质的固定颜色。</p>'
doc+='<h2>五例图形与交互</h2><div class="scroll"><table><tr><th>案例</th><th>可视化用途</th><th>入口</th></tr>'+table+'</table></div><p>实际调研记录见<a href="research.md">应用调研与转化</a>。参考Knight Lab Juxtapose、D3 Focus + Context / Sankey、UNESCO Dive；从小红书寻找案例，再回原作者示例核对。新图使用本地JS/SVG/Canvas，无新增CDN或生产依赖。</p><div class="grid">'
for i in range(1,6):doc+=fig(f'm{i}-desktop.png',f'm{i} · {names[i-1]} · 当前计算后的真实交互视图。')
doc+=fig('m5-heatmap.png','m5 · 独立测试分类混淆热图。按真值行占比着色，点击非空格子后已定位测试样本。')
doc+='</div><h2>展示措辞审查与修改</h2><p>子Agent只读检查门户、五例源文件、公共视图和构建产物，提出19项可改建议及14类应保留的来源/评价事实。随后根Agent在源码中改写并重建：运行状态报告当前变化；首屏“判断边界”改为“接着核对”；删除“偷偷、伪造、冒充”等自证语句；工程存储说明退出学生实验页面。NB与关键词同分的事实保留在评价区，并根据当前结果显示。</p><p><a href="wording-audit.md">子Agent审阅原报告</a> · <a href="wording-changes.json">原文与替换记录</a>。修改记录亦包含主题和配色替换；不是55个独立问题或55项验收。教学合成、公开实测、无金标、虚拟补充观察等事实继续明确标记。</p>'
doc+='<h2>实际浏览器验收</h2><p class="callout">五例均从老师原站“添加案例”选择完整目录导入，运行计算并下载当前JSON，随后刷新并重新计算。五例默认指标与上一版1.2.0完全相同；此次改动未改变模型核心和冻结数据。</p><div class="scroll"><table><tr><th>实际浏览器记录</th><th>通过 / 失败</th><th>范围</th></tr>'+counts+'</table></div><p>报告之间有重叠步骤，以上逐报告列数，不合计为独立功能数。Chrome实际操作包括指针拖动、键盘范围控制、图像像素核对、曲线区间/游标同步、证据筛选/定位、热图样本回查、输入变化禁用旧视图及重算恢复。</p><p>原firstbreak样例未经修改，已在增强门户添加，改变噪声/阈值重绘并刷新再运行。原站file离线模式下五例累计导入、计算、交互及刷新均完成；离线验证导出按钮可用，本轮实际五份下载发生在原站HTTP页面。没有把源码检查写成浏览器通过。</p><p>本轮浏览器无JavaScript异常、断网测试无HTTP请求。自动化历史控制台另有原缺失favicon.ico的404，非脚本异常。390×844为视口模拟，未替代实体手机和触屏验证。</p>'
doc+='<div class="grid">'+fig('home-mobile.png','390px首页：主题图、5/5、浏览器导入数与原添加入口均可见。')+fig('m3-mobile.png','390px荧光实验：同步对照与像素观察窗仍可操作。')+'</div>'
doc+='<h2>文件与计算核对</h2><p><a href="verification.json">机器核对结果</a>单独记录'+str(V['passed'])+'项一致性检查：五个包25文件（'+str(S['totalBytes'])+'字节）；老师原文件及只读副本46项哈希相同；工作门户4个导入/宿主/注册/管理员契约模块不变；13个模型核心与冻结数据文件与改动前字节相同；5份实际下载JSON通过协议与指标核对。已有37项计算检查通过。这些是文件/计算核对，浏览器证据见上表。</p>'
doc+='<h2>保留的过程记录与未验收范围</h2><p>首次检查曾发现无语义变化的CRLF规范化，已恢复12个核心/数据文件的原字节，见<a href="line-ending-reconciliation.json">恢复记录</a>。指针目标超出视口、折叠控件未展开、SVG文本读取方法及离线焦点等自动化尝试单独保留，修正测试操作后再执行最终脚本；没有用失败尝试作为通过证据。前一主题版本的浏览器记录保存在pre-theme/。</p><p>本轮未重新调用云模型或语音服务，未评价现场预测能力、真实成对白光/UV泛化、其他浏览器和实体移动设备。现有Diana角色公开再分发许可仍按原记录待核，故带助手完整包标为preview；课程五例轻量包不包含角色资源。</p><p><a href="../teaching-refresh-2026-10-23/acceptance.html">之前的五例教学验收</a> · <a href="../field-atlas-2026-10-23/acceptance.html">之前的井场剖面验收</a> · <a href="../../README.md">完整使用说明</a></p></main></html>'
(D/'acceptance.html').write_text(doc,encoding='utf-8')
p=R/'handoff/execution-status.json';state=J(p)
state.update(portalVersion='1.5.0-preview',caseVersion='1.3.0',currentPhase='five_case_teaching_complete_with_theme_and_interactive_views',currentDelivery='interactive-views-2026-10-23/acceptance.html',currentVerification='interactive-views-2026-10-23/verification.json')
state['interactiveViews']={'portalVersion':'1.5.0-preview','caseVersion':'1.3.0','theme':'local generated petroleum dawn illustration','wordingAgentAudit':'interactive-views-2026-10-23/wording-audit.md','wordingRecommendations':19,'actualBrowserReports':reports,'modelCoreAndDataByteIdentical':13,'defaultMetricsEqualToPrevious':True,'other56Cases':False,'G5':False,'newCloudCalls':0}
p.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'acceptanceBytes':(D/'acceptance.html').stat().st_size,'reports':len(reports),'caseBytes':S['totalBytes']},ensure_ascii=False))
