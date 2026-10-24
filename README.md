# 井见 · 石油智能化可视实验室

当前门户 **1.8.2-preview**，录井五例 **1.5.2**。学号末两位17对应第4阶段录井，m1–m5均有专业背景、案例流程与可交互示范。另按已确认范围保留其他12个阶段各1例，共17个自制案例；老师测井样例单独保留，剩余44个候选场景未扩展。

- [首页](portal/index.html) · [本轮实际截图与验收](handoff/case-sources-2026-10-24/acceptance.html)
- [老师原站只读副本](portal-original/index.html) · [跨阶段12例覆盖](handoff/expansion-2026-10-24/coverage.md)
- [录井五例轻量包1.5.2](dist/s17-mudlogging-cases-only-1.5.2.zip) · [跨阶段12例包1.0.1](dist/s17-expansion-12-cases-1.0.1.zip)
- 完整交付包由 `npm run package` 生成：`dist/s17-petroleum-17-cases-1.8.2-preview.zip`。完整ZIP保留在本地，源码、静态成品、轻量案例包与验收资料在仓库中。

本轮修正：五例各用一张与本例资料来源有关的小型配图，桌面约240×160像素，以薄边线和8.5%不透明度框选关注范围。没有图内编号、粗箭头、悬浮牌或跨环节切换。配图与说明并列，手机先读文字再看小图；方法总览压缩为约230像素高的连接关系图。页面主体继续由专业知识、真实观测、数据图表和交互计算组成。

## 五例怎样讲清楚

这次按“观察材料 → 理解变量关系 → 看懂智能方法 → 回查采集来源”重写录井专业背景。图片和图表围绕具体学习问题组织，原有额外示意图仍放在补充材料中。

| 案例 | 专业背景与可交互观察 | 完整实验 |
| --- | --- | --- |
| [m1 岩屑岩性](dist/cases/s17-cuttings-lithology/demo/index.html#background) | 6张真实岩芯照片；照片选择联动真实像素的亮度、纹理和直方图 | 可控岩屑盘分割、kNN近邻、颜色规则对比、计数/面积与复核 |
| [m2 气测异常](dist/cases/s17-mudgas-context/demo/index.html#background) | 62条真实甲烷/乙烷记录；浓度坐标与阈值；教学气测/泵量/操作同轴与来源回查 | 峰检测、迟到、工况近邻、同峰异因与停泵实验 |
| [m3 荧光判读](dist/cases/s17-fluorescence-review/demo/index.html#background) | 同组真实方解石白光/短波/长波UV；教学像素曝光/阈值、掩膜、面积与直方图 | 参考校正、逻辑回归、三方法对照、得分图与人工笔刷 |
| [m4 钻时分段](dist/cases/s17-drilltime-boundaries/demo/index.html#background) | 480条真实USROP观测，ROP/WOB/RPM共井深；源行联动与散点 | 独立工况标定、原始/校正响应、连续分段、薄层与误差 |
| [m5 录井报告](dist/cases/s17-evidence-report/demo/index.html#background) | 编辑原文重算NB分数；高亮井段、否定与字段；草稿删词可见冲突 | 多记录分类/抽取、来源定位、证据导入、修订核验、JSON/HTML导出 |

每例末尾的小配图分别说明岩屑取样、气体采集、白光/UV成像、参数记录和来源报告。它们由内置 imagegen 生成，只承担采集与资料组织的辅助解释；所有说明放在图外。真实照片、公开观测与可控实验的职责继续分别保留。[五张插画的提示词](data/study/case-source-prompts.json) · [最终资产与来源记录](data/study/case-source-assets.json)。

真实岩芯适合认识岩性外观，顶空气体适合认识浓度与采样，馆藏方解石适合认识矿物荧光。完整算法实验继续使用可控教学资料，保留真实模型计算、规则基线和独立评价。模型计算与数据保持；其余12例的源码和运行产物与上一版逐字节相同。

## 启动与添加案例

```powershell
npm run serve
```

打开 `http://127.0.0.1:8755/portal/index.html`。单个案例也能直接双击自己的 `demo/index.html` 离线运行。

老师原站：打开 `portal-original/index.html`，点“添加案例”，选择解压后的单个完整案例文件夹。例如 `dist/cases/s17-cuttings-lithology/`，内含 `case.json`、`README.txt` 和 `demo/`。先试跑，再校验并添加。不要选择ZIP或cases总目录。添加后进入三个标签，运行、刷新，再运行。

五例保持每例5个文件的结构。照片、图和讲解数据都在运行包内，默认无需后端与网络。增强门户还会为已保存的旧录井包显示本次新版阅读材料，原包运行版本保持。

首页已有17例入口、作业链与资料图；右下角助手保持410×700窄面板和18px对话。在线模型与附件/语音是可选功能，API Key在页面本地会话填写，不写入交付包。本轮没有新调用火山模型或测试真实麦克风。

## 验证与来源

```powershell
npm run build
npm test
npm run verify-delivery
npm run package
```

`build`生成成品与锁定记录。仅修改讲解时可用 `node tools/build.mjs --reading-only`，沿用现有实际上游快照。`test`核对算法、数据、来源、包结构与阅读小实验公式。`verify-delivery`对照保存的实际浏览器证据与当前文件哈希，**本身不执行浏览器**。

本轮Chrome实测包含：五例file离线阅读与交互、小图占比、半透明框选、紧凑流程、老师原站文件夹上传与沙箱计算、实际JSON下载、刷新重算、17例累计保存、关闭重开后再算、增强阅读与旧包兼容、390px/768px视口。截图和逐项结果见本轮验收页。五例默认计算结果与上一版保持一致。

未验收真实手机设备、Firefox/WebKit、新的语音/在线模型连接。现场标注性能不从这些公开观察资料推断。

原始数据及许可：[公开实测审计](handoff/real-data-source-audit.md)、[岩芯与曲线署名](data/real/ATTRIBUTION.txt)、[白光UV署名](data/real/CALCITE-ATTRIBUTION.txt)。历史验收保留在各日期目录中；旧版通过项不累计计为本轮通过项。

## 其余十二例

g1遥感岩性、s1地震断层、d1钻速优化、w4测井岩性、c1固井质量、co1完井方案、p1射孔设计、pr1泵功图、wo1修井检索、e1压裂优化、t1管线泄漏、r5质量软测量。各例独立5文件、无默认网络请求，其源码在 `expansion-src/`，成品在 `dist/expansion-cases/`。这十二例均增加连接实际业务输入、模型、基线、条件判断与输出的流程图；节点可打开对应的步骤讲解。
