# 井见 · 石油智能化可视实验室

13个作业阶段，61个自制案例。当前录井m1–m5为 **1.9.0**，其他56例为 **1.2.0**，增强门户为 **1.11.0-preview**。本轮把专业背景与方法步骤中的知识图接成可操作的数值图，并将M5收束为综合录井解释与井段交接。

- [GitHub Pages网站](https://mississippipotato.github.io/oilandintelligence/) · [本地门户](http://127.0.0.1:8755/portal/index.html)
- [本轮实际截图与分层验收](handoff/interactive-teaching-2026-10-30/acceptance.html)
- [录井五例](dist/s17-mudlogging-five-1.9.0.zip) · [全部61例](dist/s17-all-61-interactive-2026-10-30.zip)
- [老师原站只读兼容副本](portal-original/index.html)

## 从问题读到方法

首页保留四个方向、五个录井入口和折叠目录。每例都有专业背景、案例流程和可运行示范，页面使用统一的朱红、暖白与深灰界面。曲线、岩性和方法对照保留各自有意义的色标。背景末尾列出老师原分类中的技术难度、参考技术、交叉环节与相关案例；同一场景有不同实现时可直接互换查看。

录井五例采用连续阅读，三部分导航用于定位。五幅不同的已有画卷保留裁切图层和抬升动画，选择时留在原位，再由正文入口继续阅读。知识图紧贴解释与操作。

| 案例 | 读者可以判断什么 |
| --- | --- |
| [m1 岩屑识别](dist/cases/s17-cuttings-lithology/demo/index.html#background) | 查看照片、实际轮廓与近邻；改变等效直径下限，比较保留颗粒数与可见面积怎样变化。 |
| [m2 气测解释](dist/cases/s17-mudgas-context/demo/index.html#background) | 沿同一气峰比较总气、C1–C3、背景增量、泵量回查与工况。 |
| [m3 荧光判读](dist/cases/s17-fluorescence-review/demo/index.html#background) | 对照白光与UV，观察像素得分分布、阈值、掩膜及共同面积分母。 |
| [m4 钻时分段](dist/cases/s17-drilltime-boundaries/demo/index.html#background) | 理解沿井眼深度与垂直深度，比较钻速、每米钻时和工况校正后的分段。 |
| [m5 综合解释与交接](dist/cases/s17-evidence-report/demo/index.html#background) | 在1200–1230m汇总及各十米井段中比较观察覆盖、实际钻时统计和候选问题；修改原文、逐句回查，再接着学习测井分层。 |

老师指定的M5仍是“录井报告自动生成”。当前用井段综合观察解释报告为什么要生成、记录哪些事实、怎样交给下一步核查。前例快照保留各自来源和范围；M5到W1是学习导航，两页使用各自的教学记录。

## 其他56例的背景与流程交互

每例新增一个背景单元和一个方法单元，共112个。图形按问题选择，包括共时间/深度轴曲线、三波段地图与光谱、协方差散点、像素掩膜、频谱、Hough响应、约束可行区域、Mohr圆、泵功环、守恒三角、三元配方和累计过程。参数改变后计算图形与读数，均可复位；方法单元可读取本例当前已经运行的观察或拟合结果。

内容源码在 `expansion-src/<场景>/concept.js`。分组稿说明每例讲什么、用什么公式、读者改什么，以及原引擎数值比较和真实浏览器操作的边界。各组报告见[本轮目录](handoff/interactive-teaching-2026-10-30/)。没有新增生成图像，也没有改变原引擎和观测数据。

## 运行与老师原站导入

运行 `npm run serve`，打开本地门户。每例也能直接双击 `demo/index.html` 离线运行，默认计算在浏览器内执行。

录井五例在 `dist/cases/`，其余56例在 `dist/expansion-cases/`。ZIP先解压，再从老师原站的“添加案例”选择完整的单例目录。每例仍只有 `case.json`、`README.txt`、`demo/index.html`、`demo/demo.css` 和 `demo/demo.js` 五个文件。老师原站显示清楚的静态背景/流程，完整交互在“可运行示范”内执行；增强门户直接支持背景/流程的知识图操作。

增强门户沿用IndexedDB，原站沿用原有localStorage和重复ID处理。已有同ID旧包时，先在当前浏览器移除旧记录，再导入新版。老师提供的firstbreak样例可原样导入。

## 构建、复验和交付

- `npm run build`：严格构建当前61例，写本轮独立记录，不覆盖历史验收。
- `npm run build:interactive:draft`：修改录井讲解后的初次构建。再在已打开Chrome会话设置 `S17_FLOW_SESSION=course-interactive`、执行 `npm run capture:four-flow`，最后严格构建。静态流程预览从实际默认计算采集。
- `npm test`：核对163个保护文件、61例305个运行文件、脚本语法、五文件契约和当前构建指纹。此项不操作浏览器。
- `npm run accept:browser`：串行执行录井五例的桌面、390px、断网file、原站导入/刷新/重跑/保存、增强门户及原firstbreak；再在其他56例实际操作背景和流程单元。需先启动本地服务。
- `npm run verify-delivery`：核对当前文件与已保存的本轮浏览器记录。
- `npm run package`：生成五例独立包、五例合集、61例合集、完整静态站点和审阅资料；检查ZIP CRC及每个成员的SHA-256。

实际通过数量和范围以[本轮验收记录](handoff/interactive-teaching-2026-10-30/acceptance.md)为准。其他56例覆盖了HTTP背景/方法交互，移动端和当前实验读取按组抽查；没有把它们全部声称为原站导入和断网全路径验收。

此前[首页与五例改进](handoff/home-and-five-refinement-2026-10-29/acceptance.html)、[56例轻量改进](handoff/expansion-lessons-2026-10-29/acceptance.html)、[四例重做](handoff/four-exhibits-2026-10-29/acceptance.html)和[m2讲解](handoff/m2-clarity-2026-10-28/acceptance.html)保留原日期、版本与证据。

助手的模型配置、Live2D与历史能力继续沿用，[独立记录](handoff/assistant-companion-2026-10-29/README.md)保留。关闭时收拢角落入口，便于阅读。照片与实测曲线出处见[资料审计](handoff/real-data-source-audit.md)、[岩芯/曲线署名](data/real/ATTRIBUTION.txt)和[白光/UV署名](data/real/CALCITE-ATTRIBUTION.txt)。
