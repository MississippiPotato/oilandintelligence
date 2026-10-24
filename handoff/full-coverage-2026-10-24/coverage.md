# 全部场景覆盖与精简验证

已有录井5例，其他阶段56例；本轮新增44例。老师原样例单独保留，不计入61个自制案例。

新增44例均离线实跑、原站分批目录导入，并在增强门户实际关闭重开后逐例沙箱实跑。原站刷新及实际下载抽查每批代表例，共6例；其余12例运行目录保留，重新通过增强门户导入。

| 阶段 | 场景 | 案例 | 本轮范围 |
| --- | --- | --- | --- |
| 地质勘察 | g1 · 地质剖面遥感解译 | s17x-g1-remote-lithology | existing_runtime_preserved_and_imported |
| 地质勘察 | g2 · 油气地球化学异常识别 | s17x-g2-geochemical-anomaly | browser_verified_light |
| 地质勘察 | g3 · 地质图件要素智能提取 | s17x-g3-map-elements | browser_verified_light |
| 地质勘察 | g4 · 露头裂缝自动统计 | s17x-g4-fracture-survey | browser_verified_light |
| 物探 | s1 · 地震断层自动解释 | s17x-s1-seismic-fault | existing_runtime_preserved_and_imported |
| 物探 | s2 · 地震相智能分类 | s17x-s2-seismic-facies | browser_verified_light |
| 物探 | s3 · 初至波自动拾取 | s17x-s3-first-arrival | browser_verified_light |
| 物探 | s4 · 储层参数反演 | s17x-s4-reservoir-inversion | browser_verified_light |
| 物探 | s5 · 地震资料噪声压制 | s17x-s5-seismic-denoise | browser_verified_light |
| 钻井 | d1 · 钻速预测与参数优化 | s17x-d1-rop-optimization | existing_runtime_preserved_and_imported |
| 钻井 | d2 · 井下复杂事故前兆预警 | s17x-d2-drilling-precursor | browser_verified_light |
| 钻井 | d3 · 井眼轨迹智能控制 | s17x-d3-trajectory-control | browser_verified_light |
| 钻井 | d4 · 钻具失效预测 | s17x-d4-tool-condition | browser_verified_light |
| 钻井 | d5 · 钻井液性能智能调控 | s17x-d5-mud-rheology | browser_verified_light |
| 测井 | w1 · 测井曲线智能分层 | s17x-w1-log-boundaries | browser_verified_light |
| 测井 | w2 · 储层参数智能解释 | s17x-w2-porosity-calibration | browser_verified_light |
| 测井 | w3 · 成像测井裂缝识别 | s17x-w3-borehole-fractures | browser_verified_light |
| 测井 | w4 · 岩性识别 | s17x-w4-log-lithology | existing_runtime_preserved_and_imported |
| 测井 | w5 · 测井数据修复 | s17x-w5-curve-repair | browser_verified_light |
| 固井 | c1 · 固井质量智能评价 | s17x-c1-cement-quality | existing_runtime_preserved_and_imported |
| 固井 | c2 · 注水泥参数优化 | s17x-c2-cement-displacement | browser_verified_light |
| 固井 | c3 · 固井漏失风险预测 | s17x-c3-cement-loss-risk | browser_verified_light |
| 固井 | c4 · 套管居中度智能评估 | s17x-c4-casing-standoff | browser_verified_light |
| 完井 | co1 · 完井方式智能优选 | s17x-co1-completion-choice | existing_runtime_preserved_and_imported |
| 完井 | co2 · 射孔参数智能设计 | s17x-co2-completion-zone-design | browser_verified_light |
| 完井 | co3 · 完井管柱受力智能分析 | s17x-co3-tubing-stress | browser_verified_light |
| 完井 | co4 · 智能完井滑套控制策略 | s17x-co4-sliding-sleeve-control | browser_verified_light |
| 射孔 | p1 · 射孔参数优化 | s17x-p1-perforation-design | existing_runtime_preserved_and_imported |
| 射孔 | p2 · 射孔孔道形态预测 | s17x-p2-perforation-shape | browser_verified_light |
| 射孔 | p3 · 射孔弹型智能选型 | s17x-p3-perforation-catalog | browser_verified_light |
| 射孔 | p4 · 射孔效果智能评估 | s17x-p4-perforation-effect | browser_verified_light |
| 采油 | pr1 · 抽油机井工况诊断 | s17x-pr1-pump-card | existing_runtime_preserved_and_imported |
| 采油 | pr2 · 产量智能预测 | s17x-pr2-production-forecast | browser_verified_light |
| 采油 | pr3 · 智能注水调配 | s17x-pr3-water-allocation | browser_verified_light |
| 采油 | pr4 · 电潜泵故障预警 | s17x-pr4-esp-warning | browser_verified_light |
| 采油 | pr5 · 结蜡 / 结垢预测 | s17x-pr5-wax-risk | browser_verified_light |
| 修井 | wo1 · 修井作业方案智能推荐 | s17x-wo1-workover-retrieval | existing_runtime_preserved_and_imported |
| 修井 | wo2 · 落物打捞工具智能选型 | s17x-wo2-fishing-tools | browser_verified_light |
| 修井 | wo3 · 套管损伤智能识别 | s17x-wo3-casing-damage | browser_verified_light |
| 修井 | wo4 · 修井作业风险预警 | s17x-wo4-workover-warning | browser_verified_light |
| 修井 | wo5 · 修井周期预测 | s17x-wo5-maintenance-interval | browser_verified_light |
| 增采 | e1 · 压裂参数智能优化 | s17x-e1-fracture-optimization | existing_runtime_preserved_and_imported |
| 增采 | e2 · 压裂裂缝形态预测 | s17x-e2-fracture-geometry | browser_verified_light |
| 增采 | e3 · 化学驱配方智能筛选 | s17x-e3-chemical-mixture | browser_verified_light |
| 增采 | e4 · 蒸汽吞吐注采参数优化 | s17x-e4-steam-cycle | browser_verified_light |
| 增采 | e5 · 微生物采油菌群活性预测 | s17x-e5-microbial-activity | browser_verified_light |
| 运输 | t1 · 管道泄漏智能检测 | s17x-t1-pipeline-leak | existing_runtime_preserved_and_imported |
| 运输 | t2 · 管道腐蚀智能评估 | s17x-t2-corrosion-growth | browser_verified_light |
| 运输 | t3 · 集输系统工况优化 | s17x-t3-gathering-pump-optimization | browser_verified_light |
| 运输 | t4 · 油气计量智能校正 | s17x-t4-meter-drift-calibration | browser_verified_light |
| 运输 | t5 · 储罐液位与泄漏智能监控 | s17x-t5-tank-level-crosscheck | browser_verified_light |
| 加工 | r1 · 常减压装置操作优化 | s17x-r1-distillation-optimization | browser_verified_light |
| 加工 | r2 · 催化裂化产物预测 | s17x-r2-fcc-product-yields | browser_verified_light |
| 加工 | r3 · 炼化设备预测性维护 | s17x-r3-maintenance-trend | browser_verified_light |
| 加工 | r4 · 化验数据智能审核 | s17x-r4-lab-audit | browser_verified_light |
| 加工 | r5 · 产品质量在线软测量 | s17x-r5-quality-softsensor | existing_runtime_preserved_and_imported |

[实际截图与完整范围](acceptance.html) · [逐例报告入口](coverage.json) · [独立源码及计算审阅](review-source.json)

构建与Node检查不能替代浏览器操作。老师原站61例同时累计保存未声明通过；增强门户实际累计保存61例。
