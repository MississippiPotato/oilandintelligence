完井隔离段验封与温漂辨识 v1.0.0
caseId: s17x-co3-completion-seal-test
sceneId: co3（原“完井管柱受力智能分析”场景的第二案例）

教学目标
从封隔器和阀门圈定的受试系统开始，理解温度变化、系统顺应性和流失量如何共同改变压力。本例判断一次隔离段测试，不从压力曲线定位具体漏点；原co3仍处理温压载荷和管柱应力。

数据与计算
固定种子合成单相液体实验；6次独立无漏温漂校准，12次固定留出试验，每次4组加液校准。压力MPa，温度°C，温差K，时间min，体积L，漏率L/min。
温漂校准拟合β（MPa/K），加液采用过原点最小二乘估计Ceff（L/MPa）。在完整闭阀窗计算Pc=P−βΔT，拟合Pc=a+bt，再计算Qhat=−Ceff b。
区间传播斜率残差、β批次离散度和Ceff校准误差。区间跨门槛则待复核；未闭阀、缺测或样本不足则证据不足，负估计保留。
独立生成环境用随压差平方根变化的小孔流量，不采用推断的常漏率公式。评价参考由同窗口实际漏率积分得到。原始首尾压降基线使用相同Ceff、窗口与门槛。
门槛是课程输入，不是设备验收标准。详细来源与冻结协议见knowledge.md，背景页集中给出机构与论文链接。

交互
专业背景：改变已知局部漏率与温差，分解合计压力变化。
计算流程：拖动闭阀窗口，重新补偿压力、拟合斜率并画残差。
交互示范：切换观测记录、温差、受试体积、窗口、课程门槛与查看时刻，自动重算；可揭示独立参考、复位与导出schemaVersion 1.0 JSON。
固定12次评分保留明确判断、待复核、无效窗、覆盖与误差有效分母。

源码与封装入口
case.json为原门户导入清单；demo.html只引用demo.css与demo.js。
主构建将window.VariantManifest注入demo.js，再顺序合并engine.js、concept.js、app.js。无网络请求、第三方依赖或新增图片。
五文件包结构：case.json、demo/index.html、demo/demo.js、demo/demo.css、README.txt。
打开包内demo/index.html可离线运行，也可将case.json与同包文件导入原门户。源码目录的demo.html须等主构建生成demo.js后使用。
engine.js暴露VariantEngine；concept.js注册S17Concepts[caseId]；app.js暴露CaseInspect.snapshot()/evidence()。

本目录核查
执行：node verify.mjs
verification.json记录语法、量纲平衡、精确已知算例、观测与真值隔离、无效窗/缺测/阀门拒判、确定性、144组参数扫描等检查。
novice-review.md为实现者按无背景读者路径审阅，不代表真实学生参与。
本任务未启动Chrome；最终五文件包、原站导入、390px布局及图中文字由主会话统一浏览器验收。源码数值通过不能替代浏览器通过。
