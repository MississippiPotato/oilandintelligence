射孔深度校正：用 GR–CCL 对准目标层
caseId / case.json.id：s17x-p1-perforation-depth-correlation
sceneId：p1（原ATLAS的“射孔参数优化”场景，新增第二案例）
版本：1.0.0 / 2026-10-30

目录性质与接线
本目录是新增案例源码，不是已经打包的原站导入目录。仅修改本目录；没有修改公共脚本、原门户、dist或构建器。
主构建器应生成五文件成品：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js。
demo.html复制为demo/index.html；demo.css复制到demo/。
demo.js按如下顺序拼接普通脚本：
1. window.VariantManifest = <case.json完整对象>;
2. engine.js
3. concept.js
4. app.js
demo.html只引用demo.js和demo.css，无父页、CDN、网络API或模块加载依赖。

清单已包含完整默认静态图和初始disabled的知识控件，原站可直接阅读。
背景控件位于tabs.background.sections[1].html；流程控件位于tabs.workflow.steps[2].visualHTML，同时存在于workflow.metrics.html的图S3中，供原站逐步图解读取。
独立页逐步显示steps[].visualHTML；原站只需使用其现有metrics.html路径。
不要在清单上再次注入同样的concept HTML，以免重复。
S17Concepts的注册键和data-concept-scene均为完整caseId，避免与p1首例碰撞。

先读什么
1. 背景第一节解释GR（自然伽马）、CCL（套管接箍定位）、目标层、工具记录深度和参考深度。
2. 手动平移两条深度尺，观察GR相关系数与接箍对应同时变化。正δ表示参考深度＝工具记录深度＋δ。
3. 流程按资料核对→成对波瓣检出→接箍对应→独立峰与歧义→独立评价展开，每步有实际输入与产物。
4. 主示范默认自动计算；改变观测、噪声、目标厚度、搜索范围、CCL阈值或样例编号后自动重算。
5. 记录人工意见并下载本次JSON。条件改变后，当前意见撤销，原运行的历史记录保留。

新手可复核的操作
A. 背景：把手动δ从0移到3.4 m，曲线形态与整组接箍会更接近；工具记录目标区间从1040–1042 m变为1036.6–1038.6 m。
B. 背景：目标厚度从2 m改成0.5 m，目标色带及区间端点改变，归一化互相关（NCC）不因目标厚度改变。
C. 流程：把κ从2.3提高到3.8，默认接箍检出数由10降到0，返回资料不足。复位后恢复10个。
D. 流程：切换“GR与接箍间距重复”，会出现多个通过接箍核对的独立峰，状态为存在歧义；不会给出确定校正量。
E. 主示范：搜索范围从±12 m缩到±2 m，实际3.37 m偏移不在范围内，当前不接受校正候选，模型误差留空。
F. 主示范：选择“漏掉一个接箍信号”，当前检出9个而非10个，其余接箍仍能支持候选；“相似干扰”会保留未匹配点。
G. 主示范改为样例18或不同噪声后，到流程第3步按“读取主示范当前观测”；图的observationId、输入信号与计数采用主示范当前已完成的运行。本图仍按自己的阈值/范围重新计算。
H. 重复形态、平坦GR、超高阈值和范围不足都应保留其非接受状态，不改写为成功。

真实计算与数据边界
全部是教学合成信号，数据版本gr-ccl-synthetic-1.0.0，没有现场数据或现场精度声明。
参考985–1095 m、当前记录1000–1080 m；0.1 m网格。GR为相对读数，CCL为相对感应幅值。
GR归一化互相关扫描有限偏移；CCL动态阈值检出相邻正负波瓣，一对一对应套管丈量表；匹配数量/比例/残差、独立峰差共同决定接受、歧义或资料不足。
公开固定门槛与局限见knowledge.md和engine.js的POLICY；算法无训练环节。
makeObservation分别返回observation与evaluationTruth；infer只接收observation和搜索设置。当前和独立记录先完成预测，随后才读取实际偏移评价。
基线δ=0，即沿用原记录深度。评价：深度绝对误差m、实际落点覆盖率、目标区间IoU；未接受候选的模型指标为空。
模型与基线的误差比较使用同一接受组，并另外报告全体12条基线、接受率、歧义数和资料不足数。

默认数值（Node实际计算，非浏览器验收）
课堂样例17：δ预测3.4 m，实际偏移3.37 m，绝对误差0.030 m；GR NCC 0.982605；检出/对应10/10。
实际目标覆盖率98.5%，IoU约97.0443%；零偏移误差3.370 m。
12个完整独立记录（种子1001–1012）：接受9、歧义2、资料不足1。
同一接受组9条：校正MAE约0.031778 m，零偏移基线MAE约4.496444 m。
这些是默认合成条件的数值；调整条件会真实改变结果，不保证每种条件都优于基线。

本目录已做检查
engine.js / concept.js / app.js均通过node --check。
20项Node/清单检查通过：数值公式、真值隔离、手动相关变化、漏检/干扰、歧义/平坦、窄范围、高阈值、目标厚度隔离、噪声、确定性、12记录完整保留、共同分母、原场景绑定、静态单元位置、离线脚本与SVG字号/最小宽度。
最初的离线检查曾把SVG标准xmlns地址误判为网络资源；检查已改为检测实际网络调用和远程脚本，SVG命名空间保留。
浏览器、390px实际文字尺寸与页面宽度、下载、原站导入、主示范同步按钮由主会话统一验收；此处不把源码检查写成浏览器通过。

检查接口
window.VariantEngine：makeObservation / infer / evaluate / run / benchmark，以及correlationAt、detectCollars、matchCollars。
window.S17Concepts[caseId]：backgroundHTML / workflowHTML / mount(root)，并提供本例SVG绘图函数。
window.CaseInspect.snapshot()：state、ready、runId、inputRevision、params、observation、prediction、evaluation、benchmark、metrics、review等。
window.CaseInspect.evidence()：当前ready结果的schemaVersion "1.0" JSON；pending/running/error时返回null，下载也暂停。
window.CaseInspect.setParameters({...}) / run() / reset() / setTab('background'|'workflow'|'lab') / setStep(0..4)。
结果状态state为ready；专业判断prediction.status为accepted / ambiguous / insufficient，两者含义不同。
知识单元每次重绘更新data-ct-state，含实际输入、NCC、匹配数、状态和区间；两处均有独立复位。

视觉与离线
朱红#B8242A、暖白#F7F4EF、蓝灰#55768B、赭金#B08A4A。正文18px，图注/图字至少16px，操作控件至少44px。
SVG最小宽度900px、height:auto；窄屏在各图自己的区域横向滚动，页面容器不靠压小文字容纳图形。
全部图由本例代码绘制，无新增AI图片、图片资源或依赖。

专业直接来源
https://glossary.slb.com/terms/p/perforating_depth_control_log
https://arxiv.org/html/2509.00608v3
资料使用方式、合成数据与真实计算边界详见knowledge.md。
