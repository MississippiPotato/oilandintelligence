射孔参数优化：从试验响应到受约束候选
caseId：s17x-p1-perforation-design
sceneId：p1（第8阶段，射孔）
版本：1.0.1 / 2026-10-24

使用方法
在老师门户选择“＋ 添加案例”，选择本成品文件夹（内含 case.json、README.txt 和 demo/），校验后添加。
也可双击 demo/index.html。默认三部分与全部计算均为纯前端、离线可运行；不需要服务器、CDN或API。
本目录是源码；主构建器将 engine.js 与 app.js 顺序合并为 demo/demo.js，把 demo.html 复制为 demo/index.html。

教学路线
1. 背景：井筒—损伤带—射孔通道；孔密、穿深与相位；学习代理与受约束净目标。
2. 流程：试验分组→岭回归代理→可行域→候选搜索→独立评价与人工记录，五步各有图解。
3. 示范：调整储层条件、预算和成本权重后运行。切换相位热图；点击格子同步查看几何与约束。
4. 用“紧预算”预设观察实际无解；“域外”预设观察外推标记。记录人工意见并导出当前JSON。

真实计算
合成试验：训练14组840条、验证4组160条、测试6组240条；储层组及孔密参数区块不跨集合。
模型：14项可见参数特征的岭回归，λ从0.001/0.01/0.1/1/10中按验证RMSE选择。
搜索：11孔密×10穿深×4相位=440个候选；先核对预算、越带余量与拥挤上限，再选代理净目标最大者。
损伤带厚度从套管外缘径向量到损伤带外边界；穿深也从套管外缘算，因此L−损伤带厚度为越带余量（cm）。
回归基线：训练响应均值，在与代理相同的240条测试记录上计算RMSE/MAE。
设计基线：12孔/m、35cm、120°固定方案；仅在其可行时报告推荐方案相对净增量。
预测不读取测试响应；推荐冻结后才调用合成响应函数，计算净增量与评价网格目标差。
成本点、响应指数与拥挤指数均为公开的教学定义；不把它们写成某口真实井的成本或日产量。

当前结果与证据
输入改变后标记stale，导出与复核按钮暂停，重算恢复。
JSON含schemaVersion/caseVersion/datasetId/runConfig、实际来源、sourceRefs.selector、模型系数、完整指标分母、参考资料及人工历史。
旧人工记录保留runId；新输入撤销当前意见，模型原始评价不受人工意见影响。

来源
SLB Perforating Fundamentals：https://www.slb.com/resource-library/oilfield-review/defining-series/defining-perforating
SLB Perforation phasing：https://glossary.slb.com/Terms/p/perforation_phasing.aspx
SLB Perforation penetration：https://glossary.slb.com/Terms/p/perforation_penetration.aspx
核对日期2026-10-24。专业图形为本项目原创SVG；试验生成规则为本例教学假设。

验证记录
源码侧 node expansion-src/p1/checks.mjs 执行12项有意义计算检查，包括分组、真值隔离、手算误差、真实学习、约束最优与失败预设。
该脚本不执行浏览器。老师原站导入、刷新持久化、沙箱下载、窄屏操作由统一验收另行记录。
