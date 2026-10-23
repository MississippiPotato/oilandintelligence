# 十二阶段扩展覆盖

范围：保留原录井五例，其他十二阶段各完成一例。本表由真实存在且源码齐全的成品构建生成；构建数量不代表浏览器验收数量。

| 阶段 | 场景 | 案例 ID | 版本 | 成品字节 | 状态 |
| --- | --- | --- | --- | ---: | --- |
| 地质勘察 | g1 · 地质剖面遥感解译 | s17x-g1-remote-lithology | 1.0.0 | 133948 | built_unverified |
| 物探 | s1 · 地震断层自动解释 | s17x-s1-seismic-fault | 1.0.0 | 141806 | built_unverified |
| 钻井 | d1 · 钻速预测与参数优化 | s17x-d1-rop-optimization | 1.0.0 | 147001 | built_unverified |
| 测井 | w4 · 岩性识别 | s17x-w4-log-lithology | 1.0.0 | 135012 | built_unverified |
| 固井 | c1 · 固井质量智能评价 | s17x-c1-cement-quality | 1.0.0 | 149005 | built_unverified |
| 完井 | co1 · 完井方式智能优选 | s17x-co1-completion-choice | 1.0.0 | 139826 | built_unverified |
| 射孔 | p1 · 射孔参数优化 | s17x-p1-perforation-design | 1.0.0 | 151273 | built_unverified |
| 采油 | pr1 · 抽油机井工况诊断 | s17x-pr1-pump-card | 1.0.0 | 147707 | built_unverified |
| 修井 | wo1 · 修井作业方案智能推荐 | s17x-wo1-workover-retrieval | 1.0.0 | 128459 | built_unverified |
| 增采 | e1 · 压裂参数智能优化 | s17x-e1-fracture-optimization | 1.0.0 | 141187 | built_unverified |
| 运输 | t1 · 管道泄漏智能检测 | s17x-t1-pipeline-leak | 1.0.0 | 139868 | built_unverified |
| 加工 | r5 · 产品质量在线软测量 | s17x-r5-quality-softsensor | 1.0.0 | 141491 | built_unverified |

实际齐全并构建：12/12；累计 1696583 字节。

每例上传目录只有 case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js 五个文件。源码、来源清单及检查脚本留在开发目录。

构建不访问网络，不调用模型服务。默认计算、图形和基础助手可离线运行；可选在线对话需用户在当前页面配置。

未由构建验收：原站真实文件夹导入、沙箱执行、刷新、关闭重开、离线交互、窄屏与实际下载。这些只能引用后续真实浏览器记录。

增强门户通过原 Cases.register 契约内置注册，不写 localStorage。原站重复 ID 检查仍有效；若要在增强站手动导入同名内置案例，先通过原案例库功能隐藏该插件。未修改的老师原站没有这些内置 ID。
