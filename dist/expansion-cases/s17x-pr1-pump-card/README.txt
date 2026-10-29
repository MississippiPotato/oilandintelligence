抽油机井工况诊断：从井下泵功图读形状
caseId：s17x-pr1-pump-card
sceneId：pr1（第9阶段，采油）
版本：1.0.2 / 2026-10-24

使用方法
在老师门户选择“＋ 添加案例”，选择本成品文件夹（内含 case.json、README.txt 和 demo/），校验后添加。
也可双击 demo/index.html。背景、流程与演示均为纯前端、默认离线可运行，无CDN、后端或API依赖。
本目录是源码；统一构建器把 engine.js + app.js 合并成 demo/demo.js，把 demo.html 复制成 demo/index.html。

教学路线
1. 背景：柱塞泵循环、上/下冲程与两类阀；三种井下泵功图形状；面积比与可见形状特征。
2. 流程：按井划分→归一化特征→学习近邻与面积基线→同分母评价→人工复核和当前结果导出。
3. 示范：切换形状、增加噪声或载荷零点偏移，运行后拖动循环位置，同步观察曲线点和理想泵位置。
4. 看真实最近邻、混淆矩阵与待复核列；比较形状kNN和面积阈值。强噪声预设会真实改变曲线并触发拒判。

数据与算法
曲线为合成井下泵功图，一圈194点，载荷kN、位移m，闭合面积kN·m=kJ/循环。
地面示功图受杆柱弹性、摩擦和惯性等影响；本例直接生成井下图，未实施地面到井下换算。
训练18井162图、验证6井54图、测试8井72图，每类24张测试图；每井三类×三圈，井组共享潜在参数且变体不跨集合。
从实际观测提取8项：面积比、4个冲程位置的支间距、下支均值、最大平滑斜率、卸载过渡宽度。
标准化只用训练图拟合；k在3/5/7/9中按验证宏F1选择；预测用距离加权投票。
基线仅用面积比，两个阈值由验证集选择。模型与基线均在相同72张测试图上真实计算指标。
支持度为未校准的近邻投票占比；近邻分散、形状域外或强噪声转人工复核。
拒判仍在真实类别分母；同时显示宏F1、各类召回、覆盖率、接受集错误率，无接受样本时后者不适用。
预测只读观测曲线与训练参数，测试类别在推理完成后才供评价使用。

当前结果与证据
位相滑块只移动观察点；形状、噪声、零点或支持度改变使结果stale，重算后才可导出。
人工意见不改写原模型分数；新运行保留带runId的旧人工历史，当前确认重新开始。
JSON含协议字段、原始曲线与近邻来源、特征、数据分组、模型/基线指标、sourceRefs.selector及参考资料。

专业来源
SLB Rod Pump Systems：https://www.slb.com/resource-library/oilfield-review/defining-series/defining-rod-pumps
SLB Gas interference：https://glossary.slb.com/en/terms/g/gas_interference
SLB Dynamometer card：https://glossary.slb.com/Terms/d/dynamometer_card.aspx
Weatherford Downhole card calculation：https://hs.weatherford.com/knowledge/what-is-the-sucker-rod-pump-downhole-card-calculation-in-petrovisor
核对日期2026-10-24；图形为项目原创，三种曲线为概念驱动的合成形状。

验证记录
源码侧 node expansion-src/pr1/checks.mjs 执行12项计算检查：手算混淆、空集/全拒判、曲线面积、井组、重复性、元数据隔离、真值隔离、零点不变性、强噪声、实际近邻及同分母。
该脚本不执行浏览器。老师原站导入、刷新持久化、沙箱下载与窄屏操作由统一验收另行记录。

当前教学版：1.2.0。专业内容和已有图表沿用，增加逐例读图提示、默认计算与自动更新。
比较任务：查看混合形状：读近邻是否分散、支持度是否降低，保留需要补充资料的情况。
加入零点偏移：比较形状候选与仅面积判断，检查坐标平移的影响。
