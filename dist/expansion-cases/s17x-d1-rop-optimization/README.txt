钻速预测与参数优化：从响应面到可行候选
s17x-d1-rop-optimization / d1 / v1.0.2

数据与真实计算：固定种子生成 8 口训练井（512 点）、3 口验证井（192 点）和 2 口测试井（128 点）。工况特征为 WOB/100、RPM/120、Q/26、UCS/60、三个平方项及 WOB×RPM、WOB×UCS、Q×UCS；标准化仅拟合训练井，λ 在 0.01/0.1/1/10 中由验证 RMSE 选择。基线在同一训练数据拟合单 WOB 线性趋势。测试真值只进入 evaluate；infer 和 search 只收观测、训练模型及约束。
教学响应：w=WOB/100, r=RPM/120, q=Q/26, h=UCS/60；ROP=max(2,10+28w+24r+12q−10w²−8r²−6q²+9wr−12h−6wh+5qh+井间偏移−磨损损失)，并加入指定测量噪声。生成公式只用来构造数据，模型实际从训练样本拟合参数。
搜索：WOB=40…160 步长10 kN，RPM=60…200 步长10 r/min，Q=18…38 步长2 L/s，共2145点。泵压与扭矩教学代理在界面和引擎列出。推荐只根据代理预测排序，冻结推荐后才读取教学模拟实现值；未使用真实响应穷举最优点。没有可行点时 recommended=null，不补造推荐。
UI：响应面、可行域、留出散点、最大误差条图、学习记录、约束余量；预设改变实际输入/噪声/迁移。输入变化标 stale；恢复默认后重算；人工复核与模型成绩分开；JSON 导出携带当前参数、分组、模型、预测、分母及复核。

专业来源（2026-10-24 阅读）：
SLB｜Rate of penetration
https://glossary.slb.com/terms/r/rate_of_penetration
SLB｜Bottomhole assembly
https://glossary.slb.com/terms/b/bha
SLB｜Optimizing Drilling Rate of Penetration
https://investorcenter.slb.com/static-files/41a10f14-81ca-442f-83f6-05dae85b6f67

验证状态：计算检查见 calculation-checks.json，是 Node 计算验证；原门户导入、刷新、离线文件与浏览器界面由主验收流程另行记录，未在此冒充已通过。

最终包结构：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js。开发源码 engine.js 与 app.js 由统一构建器串联为普通 IIFE demo.js。无 CDN、运行时 fetch、后端和远程模型要求。通过老师“添加案例”选择完整单例文件夹。

当前教学版：1.1.0。专业内容和已有图表沿用，增加逐例读图提示、默认计算与自动更新。
比较任务：收紧泵压上限：查看可行点和推荐参数怎样改变，同时检查约束余量。
提高岩石强度：对照当前预测与留出误差，留意输入是否进入外推区域。
