测井岩性识别：多道曲线与可解释近邻
s17x-w4-log-lithology / w4 / v1.0.2

数据与真实计算：固定种子独立生成 6 口训练井（720 点）、2 口验证井（240 点）和 2 口测试井（320 点）。每口测试井1500…1579.5m MD、0.5m采样。GR/API、Rt/Ωm、RHOB/g cm−3、NPHI/v/v 由岩性、孔隙、流体、井间偏移与噪声共同形成。数据和标签分开保存。
模型：Rt 取 log10，其余保留物理量；仅训练井拟合均值/标准差。标准化欧氏距离 kNN，在验证井按宏F1选k∈3/5/9/15；用户可显式改k。单GR基线的两个阈值同样由验证井选择。关闭密度或仅GR会同时改变训练、验证、测试特征，不保留隐藏通道。最近邻来源是真实训练井记录。
复核：投票支持度低于用户阈值，或最近距离超过验证95%分位×1.4（下限0.35）时拒判。该支持度是邻居票数比，未校准为概率。3×4混淆矩阵包含复核列，F1/召回始终以全部320点评价；接受集错误率与覆盖率同时保存；全拒判接受集错误率为null。
UI：深度向下的四道曲线与独立GR/模型/人工/真值色柱，GR—密度交会图，实际近邻表、两方法混淆矩阵、各类召回、通道消融、含气/噪声/域外预设。输入改变标 stale；人工复核不修改模型分数；JSON 导出保留模型原结果和人工历史。

专业来源（2026-10-24 阅读）：
SLB｜Gamma ray log
https://glossary.slb.com/terms/g/gamma_ray_log
SLB｜Neutron porosity
https://glossary.slb.com/terms/n/neutron_porosity
IODP｜Selecting Logging Tools
https://iodp.tamu.edu/tools/logging/selection.html
US EPA｜Gamma-Gamma Density Logging
https://www.epa.gov/environmental-geophysics/gamma-gamma-density-logging

验证状态：计算检查见 calculation-checks.json，是 Node 计算验证；原门户导入、刷新、离线文件与浏览器界面由主验收流程另行记录，未在此冒充已通过。

最终包结构：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js。开发源码 engine.js 与 app.js 由统一构建器串联为普通 IIFE demo.js。无 CDN、运行时 fetch、后端和远程模型要求。通过老师“添加案例”选择完整单例文件夹。

当前教学版：1.1.1。专业内容和已有图表沿用，增加逐例读图提示、默认计算与自动更新。
比较任务：只看GR：检查砂岩与灰岩等类别的混淆，并与多道输入对照。
含气砂岩情景：对照密度与中子响应变化，以及候选和支持度怎样改变。
