候凝强度预测与等待时间评估 v1.0.0
caseId: s17x-c1-cement-woc-strength
sceneId: c1（原“固井质量智能评价”场景的第二案例）

教学目标
先分清材料抗压强度与井下胶结证据，再解释自然龄期、温度历史、等效龄期与目标交点的关系。它不替代原c1的CBL/VDL判读。

数据与计算
所有数值是固定种子的教学合成试验。12训练批次/4验证批次/8留出批次，整批隔离；每批9个压碎强度点。温度用°C展示、K计算，龄期h，强度MPa。
主方法以Arrhenius梯形积分得到50°C等效龄期，再由训练点进行PAVA单调回归和分段插值。Ea由验证集选择，测试真值不参与。基线沿用训练中50°C养护程序的自然龄期曲线。
独立生成环境使用批次变化的双时间尺度强度发展；评价使用72个留出强度读数以及合成环境连续曲线的参考达到时间。未达标、提前判断、未知与分母全部保留。
默认目标10 MPa用于课程比较，不是通用现场作业标准。详细来源、假设与冻结协议见knowledge.md，页面背景集中展示来源链接。

交互
专业背景：恒温与自然龄期改变反应速率和等效龄期。
计算流程：改变Ea和目标，重排训练点、拟合单调线并计算独立验证误差。
交互示范：改变养护程序、温度、目标、查看时刻后自动重算；可以揭示独立参考、复位与导出schemaVersion 1.0 JSON。
超过25–80°C校准域输出未知；72 h内没有交点保留未达到。

源码与封装入口
case.json是原门户导入清单；demo.html只引用demo.css与demo.js。
主构建将window.VariantManifest注入demo.js，再顺序合并engine.js、concept.js、app.js。无网络请求、第三方依赖或新增图片。
五文件包结构：case.json、demo/index.html、demo/demo.js、demo/demo.css、README.txt。
浏览时打开包内demo/index.html即可离线运行；也可将case.json与同包文件导入原门户。源码目录的demo.html要在主构建生成demo.js后使用。
engine.js暴露VariantEngine；concept.js注册S17Concepts[caseId]；app.js暴露CaseInspect.snapshot()和CaseInspect.evidence()。

本目录核查
在本目录执行：node verify.mjs
verification.json记录语法、单位公式、整批划分、真值访问隔离、确定性、80组参数扫描与未知/未达标等检查。
novice-review.md是实现者按无石油背景读者路径进行的源码审阅，不是招募学生试用。
当前未在本任务启动Chrome，最终五文件包、原站导入、390px图中文字与局部滚动由主会话统一验收。源码数值通过不能替代浏览器通过。
