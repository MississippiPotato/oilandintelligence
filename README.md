# 井见 · 石油智能化可视实验室

13个作业阶段、61个原场景、**65个自制案例**，老师自带样例另计。当前录井m1–m5为 **1.9.0**，原其他56例为 **1.2.0**，本轮新增四例为 **1.0.0**，增强门户为 **1.12.0-preview**。录井专题新增共用3D井场，门户加入知识检索与按案例加载；四个原来不足五例的阶段分别补到五例。

- [GitHub Pages网站](https://mississippipotato.github.io/oilandintelligence/) · [本地门户](http://127.0.0.1:8755/portal/index.html)
- [录井3D专题](portal/index.html#/stage/mudlogging) · [本轮实际截图与分层验收](handoff/site-upgrade-2026-10-30/acceptance.html)
- [录井五例](dist/s17-mudlogging-five-1.9.0.zip) · [全部65例](dist/s17-all-65-cases-1.12.0.zip) · [完整离线网站](dist/s17-site-1.12.0-offline.zip)
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

## 录井3D、检索与四个新例

进入录井专题，跟随一份返出资料走过井底、环空、筛分、检测与整理记录。四个镜头、对象聚焦、回放进度与五个案例入口相互对应。暂停回放与停泵是两种控制：停泵300–480s时钟仍前进，累计体积停在7.5m³，运输进度停在0.375；恢复泵送后继续推进，到达由600s延后至780s。运输数值直接调用原M2Core，场景使用本地Three.js r180，无需在线模型或外部纹理。

右上“检索”支持Ctrl/Cmd+K，按阶段、案例、专业术语、方法和知识小节查找。选择知识结果后等待对应正文，再聚焦实际标题。已导入案例参与检索；同ID上传优先，隐藏案例及其小节会同步移出检索，恢复后重新出现。首页不请求案例正文、3D重包或Live2D重包。

| 新例 | 绑定原场景 | 图与操作 | 独立包 |
|---|---|---|---|
| 构造图闭合与溢出点识别 | g3 | 地图/剖面/填充联动，比较侧向出口与单剖面 | [下载](dist/s17x-g3-closure-spill-1.0.0.zip) |
| 候凝强度预测与等待时间评估 | c1 | 同时间轴温度/强度，改变完整温度历史与目标强度 | [下载](dist/s17x-c1-cement-woc-strength-1.0.0.zip) |
| 隔离段验封与温漂辨识 | co3 | 原始压力/温度补偿/保压窗口，比较漏率与区间 | [下载](dist/s17x-co3-completion-seal-test-1.0.0.zip) |
| 射孔深度校正：GR–CCL对准目标层 | p1 | 两把深度尺/曲线/接箍/目标层，检查多候选 | [下载](dist/s17x-p1-perforation-depth-correlation-1.0.0.zip) |

四份知识稿在`case-variants/<caseId>/knowledge.md`。当前65例仍绑定原61场景；新增的是独立实现，没有新增或重命名老师的场景。同场景目录列出不同案例，原默认案例保留。

## 其他56例的背景与流程交互

每例新增一个背景单元和一个方法单元，共112个。图形按问题选择，包括共时间/深度轴曲线、三波段地图与光谱、协方差散点、像素掩膜、频谱、Hough响应、约束可行区域、Mohr圆、泵功环、守恒三角、三元配方和累计过程。参数改变后计算图形与读数，均可复位；方法单元可读取本例当前已经运行的观察或拟合结果。

内容源码在 `expansion-src/<场景>/concept.js`。分组稿说明每例讲什么、用什么公式、读者改什么，以及原引擎数值比较和真实浏览器操作的边界。各组报告见[本轮目录](handoff/interactive-teaching-2026-10-30/)。没有新增生成图像，也没有改变原引擎和观测数据。

## 运行与老师原站导入

运行 `npm run serve`，打开本地门户。每例也能直接双击 `demo/index.html` 离线运行，默认计算在浏览器内执行。

录井五例在 `dist/cases/`，其余60例在 `dist/expansion-cases/`。ZIP先解压，再从老师原站的“添加案例”选择完整的单例目录。每例仍只有 `case.json`、`README.txt`、`demo/index.html`、`demo/demo.css` 和 `demo/demo.js` 五个文件。老师原站显示清楚的静态背景/流程，完整交互在“可运行示范”内执行；增强门户直接支持背景/流程的知识图操作。

增强门户沿用IndexedDB，原站沿用原有localStorage和重复ID处理。已有同ID旧包时，先在当前浏览器移除旧记录，再导入新版。老师提供的firstbreak样例可原样导入。

## 构建、复验和交付

- `npm ci`：安装锁定的构建依赖esbuild 0.27.3；浏览离线成品无需安装。Three.js r180原文件及MIT许可已在本地vendor目录。
- `npm run build`：构建当前65例、轻目录/独立正文、共享3D及合并样式，写`handoff/site-upgrade-2026-10-30/`，不覆盖历史验收。
- `npm run build:interactive:draft`：修改录井讲解后的初次构建。再在已打开Chrome会话设置 `S17_FLOW_SESSION=course-interactive`、执行 `npm run capture:four-flow`，最后严格构建。静态流程预览从实际默认计算采集。
- `npm test`：核对163个保护文件、65例325个运行文件、普通脚本、五文件/6MiB契约、索引与当前构建指纹。此项不操作浏览器。
- `npm run test:numeric`：复跑新四例方法/基线/评价协议及原M2Core运输检查，保留负结果与真值隔离检查。
- `npm run accept:upgrade`（同`accept:browser`）：串行操作Chrome检查搜索/加载/七例抽查/3D/断网回退，以及四新例桌面/390/file/老师原站导入刷新保存。需先启动本地服务；`-- --portal-only`可只重跑门户范围。上传覆盖、隐藏恢复和后台标签可见性边界另见本轮验收记录。
- `npm run verify-delivery`：核对当前文件和已保存的本轮浏览器记录；不会冒充新一次浏览器验收。
- `npm run package`：生成四个新例独立包、65例合集、完整离线站点和审阅包；检查ZIP CRC及每个成员的SHA-256。
- `npm run accept:package`：把整站ZIP解压到新的临时目录，实际用Chrome断网检查3D、分镜、检索、嵌入演示、修改重算与刷新；输出单独的解压包浏览器记录。

实际通过数量和范围以[本轮验收记录](handoff/site-upgrade-2026-10-30/acceptance.md)为准。四个新例做了16条路径和20份实际下载；原五例与其他两例重点回归新加载路径，没有重复全65例的浏览器全路径操作。固定条件的五次性能测量、未达原目标项与用户放宽门槛见[性能结论](handoff/site-upgrade-2026-10-30/performance-conclusion.md)。

此前[61例交互教学](handoff/interactive-teaching-2026-10-30/acceptance.html)、[首页与五例改进](handoff/home-and-five-refinement-2026-10-29/acceptance.html)、[56例轻量改进](handoff/expansion-lessons-2026-10-29/acceptance.html)、[四例重做](handoff/four-exhibits-2026-10-29/acceptance.html)和[m2讲解](handoff/m2-clarity-2026-10-28/acceptance.html)保留原日期、版本与证据。

助手的模型配置、Live2D与历史能力继续沿用，[独立记录](handoff/assistant-companion-2026-10-29/README.md)保留。关闭时收拢角落入口，便于阅读。照片与实测曲线出处见[资料审计](handoff/real-data-source-audit.md)、[岩芯/曲线署名](data/real/ATTRIBUTION.txt)和[白光/UV署名](data/real/CALCITE-ATTRIBUTION.txt)。
