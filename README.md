# 井见 · 石油智能化可视实验室

门户保留 **13阶段、61场景**，门户版本保持 **1.9.2-preview**。学号17对应第4阶段录井，五个录井案例当前均为 **1.7.1**。

**2026-10-29本轮重做m1、m3、m4、m5**的专业背景、案例流程和可运行示范：先核对知识稿，分别组织照片、曲线、像素与原文交互，再做四幅不同的纸本微缩画卷。m2沿用已完成成品；首页、其他56例、老师原站和四例原有计算引擎／原始数据保持不变。老师firstbreak原样例单独保留，不计入61个自制案例。

- [本轮完成、截图与分层验收](handoff/four-exhibits-2026-10-29/acceptance.html)
- [打开门户](portal/index.html) · [老师原站只读副本](portal-original/index.html)
- [当前五例合集1.7.1](dist/s17-mudlogging-cases-only-1.7.1.zip)
- [知识稿、画卷、提示词及审阅记录交付包](dist/s17-four-exhibits-1.7.1-review.zip)
- [m2此前完整验收，保留原日期与范围](handoff/m2-clarity-2026-10-28/acceptance.html)
- [此前61例教学审阅](handoff/teaching-audit-2026-10-24/acceptance.html) · [其他56例原包](dist/s17-expansion-56-cases-1.9.2-preview.zip)

## 五例怎样讲

| 案例与直接入口 | 围绕的对象 | 主要图表和实际操作 |
| --- | --- | --- |
| [m1 岩屑](dist/cases/s17-cuttings-lithology/demo/index.html#background) | 一盘样品与选中的图像位置 | 真实岩芯照片、像素轮廓、实际近邻、计数和面积；调照明与附着，轮廓丢失时保留锚点。重排教学盘明确不确认原颗粒身份。 |
| [m2 气测](dist/cases/s17-mudgas-context/demo/index.html#background) | 同一个气峰 | 到达／来源双时钟、共时轴组分、真实近邻；累计体积归位后切换工况。当前运行文件原样保留。 |
| [m3 荧光](dist/cases/s17-fluorescence-review/demo/index.html#background) | 同一组白光／UV样品 | 真实方解石配对照片、参照校正、实际掩膜与像素计数；改曝光并比较原始阈值、校正阈值、学习方法。 |
| [m4 钻时](dist/cases/s17-drilltime-boundaries/demo/index.html#background) | 共同深度的观测与候选段 | USROP实测读图、钻速与操作共轴、校正响应和候选界面；切工况／薄层、调厚度与游标，显示真实采样点数。 |
| [m5 报告](dist/cases/s17-evidence-report/demo/index.html#background) | 一段原文与可逐句回查的报告 | 字段、分类分差、原文标记及来源；改“未见／见”、数值和井段，重算后撤销旧核对。继承的范围另有原文引用。 |

四例知识稿：[m1](case-src/m1/knowledge.md)、[m3](case-src/m3/knowledge.md)、[m4](case-src/m4/knowledge.md)、[m5](case-src/m5/knowledge.md)。每份包括三个学习结果、四个知识单元、图与操作、首次术语及专业来源。

四幅开场画卷桌面绘图区320–400px，区域半透明高亮、标签外置；窄屏保留完整画面和四个文字入口。正文18px、说明至少16px，以朱红、暖白、蓝灰与赭金组织。画卷只作场景定位，数据图来自实际观测与计算。每例两种构图和选择理由记录在各自assets/prompts.json，最终资产随包嵌入。

## 启动与导入

运行 `npm run serve`，打开 [本地门户](http://127.0.0.1:8755/portal/index.html)。这是静态文件服务，计算仍在浏览器内。四例也可直接双击各自demo/index.html离线运行。

录井五例在dist/cases/，其他56例在dist/expansion-cases/。ZIP先解压，通过老师原站“添加案例”一次选择一个完整案例目录，其中有case.json、README.txt以及demo/index.html、demo.css、demo.js，共5文件。合集应逐例导入。老师原站背景与流程提供静态预览，完整交互在“可运行示范”内；增强门户同时支持画卷章节导航和讲解交互。

增强门户用IndexedDB保存导入包，老师原站保留原localStorage逻辑。重复导入同ID时，按原入口提示先移除浏览器中的旧导入记录，磁盘成品不变。本轮通过原入口实际导入四例，并在刷新后再次操作、下载结果；增强门户另运行了m2回归和未修改的firstbreak原样例。

首页助手沿用现有窄面板和服务配置。本轮没有新接在线模型或语音服务，案例默认计算不依赖网络。

## 构建、验证与交付

- `npm run build`：构建本轮四例及门户讲解包，更新当前五例清单；不重新构建m2和其他56例。
- `npm test`：本轮源码、文件哈希、五文件结构和已有数值／协议检查；不会覆盖此前日期的验收记录。
- `npm run accept:four`：打开专用Chrome测试会话，实际运行四例离线、窄屏、增强门户、老师原站导入／刷新／重算／保存，然后做一次m2门户回归。
- `npm run accept`：核对实际浏览器报告与当前运行文件，生成本轮分层汇总；此命令本身不操作浏览器。
- `npm run verify-delivery`：核对交付哈希、保存结果协议和已有浏览器证据的一致性。
- `npm run package`：生成四个独立成品包、包含当前m2的五例合集，以及知识稿／画卷／提示词／截图／审阅记录包。逐成员SHA256与ZIP CRC另行检查。

修改讲解后若默认流程预览过期，先 `npm run build -- --allow-stale-preview` 生成开发稿；打开专用浏览器会话并运行 `npm run capture:four-flow`，从实际默认计算提取逐步产物，再正式构建和验收。正式构建会拒绝与源码哈希不匹配的静态预览。

本轮证据分开记录：**18项源码／内容／哈希检查、37项数值／协议检查、169项四例真实Chrome检查、5项m2与原样例门户回归**。四例共实际保存12份JSON，另经既有证据协议验证；每例有独立新手审阅和修订复核。截图、操作记录、失败尝试及当前成品哈希均在本轮验收目录内。

m2和其他56例合计57例、285个运行文件逐字节一致；63个原站／材料保护文件以及既有引擎、真实数据一致。历史m2与61例验收保留原日期和范围。本轮没有重新逐例运行其他56例，也未验证全部参数组合、实体手机、Firefox／WebKit或在线助手服务。

数据及许可：[公开资料审计](handoff/real-data-source-audit.md)、[岩芯与曲线署名](data/real/ATTRIBUTION.txt)、[白光／UV署名](data/real/CALCITE-ATTRIBUTION.txt)。真实照片和实测曲线用于专业观察；默认方法演示继续使用现有可控教学数据，预测只接收观测，评价答案单独使用。
