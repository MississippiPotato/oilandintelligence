构造图闭合与溢出点识别：一条剖面会漏掉什么
案例ID：s17x-g3-closure-spill
绑定原场景：g3（构造图件的空间要素）
版本：1.0.0，2026-10-30

先看什么
本例把一张储层顶面深度图变成可以核查的闭合范围。深度向下为正；局部浅点不一定能封闭，侧向出口可能使一条剖面高估闭合。默认北侧通道顶面在无噪声时：顶部1000 m、二维溢出1034 m、东西单剖面估计1074.608 m。所有数据均为确定性的教学合成面。

三部分与建议操作
1. 专业背景：改变北侧通道高度和充填比例，看地图、剖面接触面与体积怎样一起变化。图旁链接支持储层、盖层和闭合的专业含义。
2. 案例流程：逐步加深接触面，观察连通范围何时第一次到达开放边界；可点击“读入本次观测”复制可运行示范的实际采样，再检查同一幅图。
3. 可运行示范：条件改变会自动重新计算。先固定其它条件，将基线从东西改为南北，二维预测应保持不变，单剖面估计会变化；再比较50 m与200 m采样。选择整体倾斜图幅、无噪声时保留零闭合与参考体积为0的NA。地图可点选起点，所有条件可恢复默认，可保存完整计算JSON。

数据与计算边界
49×41格，每格50 m×50 m，图幅外缘2.45 km×2.05 km，格心跨度2.4 km×2.0 km。采样50/100/200 m只改变观测密度；推断仅由采样双线性重建。8邻域、开放外边界、完整封盖、静水和单候选高点都是显式教学约定。几何体积未乘孔隙度、含油饱和度或采收率，不能称为可采储量。

观测与评价分离
generate返回独立observations与evaluationTruth；infer只接收observations及用户参数，二维与单剖面都不读取参考。evaluate在推断之后，用完整无噪声教学面计算深度误差、范围交并比（IoU）与体积误差。评价分母为2009格；两掩膜都空时IoU=1并标明无闭合；参考体积为0时相对体积误差为NA。评价用于比较采样密度和深度误差对几何闭合的影响。

源码与打包约定（供维护者）
knowledge.md是先行知识稿，列明断言及直接专业来源。
engine.js是普通脚本，暴露globalThis.VariantEngine，含generate、infer、evaluate、run等独立函数，无DOM与网络依赖。
concept.js注册S17Concepts['s17x-g3-closure-spill']，提供完整默认backgroundHTML/workflowHTML、mount(root)和实际数组生成的图形。静态控件disabled；mount后启用并维护data-ct-state及复位。
app.js在window.VariantManifest已经注入后运行，绘制独立三部分页面，提供window.CaseInspect.snapshot()/evidence()/run()/reset()。
demo.html只引用demo.js、demo.css；demo.js由根构建依次合并engine.js、concept.js、window.VariantManifest=<case.json>、app.js。此源码目录没有预先复制构建输出；请打开根构建生成的demo/index.html，或将同样脚本顺序组装到本目录进行临时源码预览。
原门户五文件包由根构建生成：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js；sceneId沿用g3，新caseId独立导入，两个g3案例保留各自记录。
case.json的workflow.steps[].html供独立页面使用；兼容旧门户的完整流程静态交互另放在workflow.metrics.html。背景静态图直接在对应知识单元内。

核验
在此目录运行node checks.mjs。它使用独立的逐深度阈值连通搜索核对minimax出口，同时检查手工体积、侧向通道、零闭合、噪声/采样重建、基线方向、观测与参考分离、充填守恒和概念控件状态。结果写checks-results.json。该检查属于源码与数值核验，不等同于浏览器、导入或file://验收。
最终统一构建、原站导入与浏览器验收由根任务记录，不能以本文件的说明代替实际验收结果。

直接专业来源
Open University，An introduction to geology，3.7 It’s a trap!：
https://www.open.edu/openlearn/mod/oucontent/view.php?id=101227&section=_unit3.8
SLB Energy Glossary，closure：
https://glossary.slb.com/terms/c/closure
Nilsen等（2015），Spill-point analysis and structural trapping capacity in saline aquifers using MRST-co2lab，Computers & Geosciences 75，33–43；§2、§2.1：
https://doi.org/10.1016/j.cageo.2014.11.002
https://andreas.folk.ntnu.no/papers/co2lab-1.pdf
论文对象为CO2盐水层封存，本例只借用顶面几何连通的认识；不复现论文完整多级圈闭合并，不继承其现场容量结果。链接由读者主动打开，全部教学计算离线完成。
