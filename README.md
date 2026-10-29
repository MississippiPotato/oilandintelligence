# 井见 · 石油智能化可视实验室

现有13阶段、61个自制案例。本轮按录井试点的教学原则，**轻量改进其余56例**，案例包版本统一为1.1.0；录井m1–m5继续使用1.7.1成品。门户包版本仍为1.9.2-preview，首页内容与样式保持原样。

- [打开门户](portal/index.html) · [本地服务入口](http://127.0.0.1:8755/portal/index.html)
- [本轮实际截图与分层验收](handoff/expansion-lessons-2026-10-29/acceptance.html)
- [56例成品目录合集](dist/s17-expansion-56-lessons-1.1.0.zip)
- [包含当前录井五例的61例合集](dist/s17-all-61-lessons-2026-10-29.zip)
- [56份知识稿、逐例提示、截图与验收记录](dist/s17-expansion-lessons-2026-10-29-review.zip)
- [老师原站只读兼容副本](portal-original/index.html)

## 这轮怎样改

专业背景沿用各例已有的知识、来源和图，补充一句核心认识与三条具体读图提示；从专业对象讲到观测，再联系方法。地震去噪看反射是否被保留，腐蚀评估看两次检测是否对齐，化验审核分开单位与跨指标关系，没有把56例换成同一幅流程画卷。

案例流程保留每例自己的分支流程、步骤图或手算表，逐步显示输入、动作与产物。演示默认完成真实计算，每例提供两个与现有控件直接相连的比较任务，共112项；相关条件变化后自动重算，复位可恢复默认结果。图表、近邻、约束和基线继续来自原引擎。原计算源码与控制器保留，组装时只同步发布版本字段。

界面采用朱红与暖白、18px正文、圆角和留白，保留原图、物性及类别的色标。窄屏在图内横向滚动，避免将坐标与标注缩成小字。本轮没有生成新图片，也没有增加在线模型或聊天系统。

| 示例 | 专业问题与实际比较 |
| --- | --- |
| [g2 地球化学异常](dist/expansion-cases/s17x-g2-geochemical-anomaly/demo/index.html#background) | 地图位置与组分关系互相对应；调整联合阈值和背景波动，查看候选与误报。 |
| [s5 地震去噪](dist/expansion-cases/s17x-s5-seismic-denoise/demo/index.html#background) | 同一条道看带噪、处理后与移除量；改相干干扰，检查反射保真。 |
| [w3 成像测井](dist/expansion-cases/s17x-w3-borehole-fractures/demo/index.html#background) | 从井壁展开图理解曲线；调对比度和阈值，对照实际掩膜。 |
| [c4 套管居中度](dist/expansion-cases/s17x-c4-casing-standoff/demo/index.html#background) | 将截面窄侧间隙与跨距曲线联系；改支撑间距和载荷，看最差位置。 |
| [t2 腐蚀评估](dist/expansion-cases/s17x-t2-corrosion-growth/demo/index.html#background) | 两次内检测先对齐，再算增长；查看里程错位和测量噪声。 |
| [r4 化验审核](dist/expansion-cases/s17x-r4-lab-audit/demo/index.html#background) | 从带单位的原始化验行回查规则与关系；可编辑文本并实际重算。 |

全部逐例知识稿位于`expansion-src/<场景ID>/knowledge.md`，读图与操作说明集中记录在[逐例编辑清单](handoff/expansion-lessons-2026-10-29/editorial-index.json)。知识稿沿用已有来源，本轮未进行新的外部专家审稿。

## 运行与老师原站导入

执行`npm run serve`后打开本地门户。服务只提供静态文件，计算在浏览器内执行；各例也可以直接双击`demo/index.html`离线运行。录井五例在`dist/cases/`，其他56例在`dist/expansion-cases/`。

ZIP先解压，点击老师原站“添加案例”，**一次选择一个完整案例目录**：`case.json`、`README.txt`、`demo/index.html`、`demo/demo.css`、`demo/demo.js`，共5个文件。合集需逐例导入。老师原站显示静态背景和流程预览，完整交互在可运行示范内；增强门户支持讲解导航与步骤切换。

增强门户沿用IndexedDB，原站保留原localStorage与重复ID逻辑。浏览器已有旧导入时，按原入口提示移除旧记录后导入新包；增强门户案例入口也按单例版本判断。其他同学的案例和原firstbreak样例沿用原导入契约。

## 构建和验证

- `npm run build`：只构建本轮56例和门户注册包，不重建录井五例，不覆盖旧日期验收目录。
- `npm test`：源码、知识组织、控件范围／步长、哈希及老师原导入契约检查；不算浏览器验收。
- `npm run accept:browser`：专用Chrome会话，运行56例桌面轻量检查，再抽样检查离线、窄屏、原站导入／刷新／保存、增强门户，并回归m2和原firstbreak样例。
- `npm run accept`：将实际浏览器报告与当前文件核对，生成本轮汇总；这个命令本身不操作浏览器。
- `npm run package`：生成56例合集、当前61例合集和知识／截图记录包，校验ZIP CRC及逐成员SHA256。
- `npm run verify-delivery`：核对最终文件、包和已保存浏览器证据的一致性。

此前录井构建入口保留为`build:four`和`build:m2`。历史验收工具绑定各自日期的文件快照；本轮默认命令使用新的56例范围。

本轮逐例检查桌面默认计算、两项任务、流程键盘切换与复位；完整离线／原站／窄屏路径采用抽样，不写成全56例全路径通过。具体结果、下载文件与未验收范围见本轮记录。当前录井25个运行文件及对应源码、原站、公共观测、首页和原计算源码均有哈希保护。

## 已完成的录井五例

[m1岩屑](dist/cases/s17-cuttings-lithology/demo/index.html#background)、[m2气测](dist/cases/s17-mudgas-context/demo/index.html#background)、[m3荧光](dist/cases/s17-fluorescence-review/demo/index.html#background)、[m4钻时](dist/cases/s17-drilltime-boundaries/demo/index.html#background)、[m5报告](dist/cases/s17-evidence-report/demo/index.html#background)保持1.7.1。

此前[四例重做记录](handoff/four-exhibits-2026-10-29/acceptance.html)、[m2讲解记录](handoff/m2-clarity-2026-10-28/acceptance.html)、[61例教学审阅](handoff/teaching-audit-2026-10-24/acceptance.html)保留原日期和原范围，记录当时版本的验收。

真实照片与曲线署名见[公开资料审计](handoff/real-data-source-audit.md)、[岩芯与曲线署名](data/real/ATTRIBUTION.txt)、[白光／UV署名](data/real/CALCITE-ATTRIBUTION.txt)。默认方法演示继续使用可控教学数据，预测只接收观测，评价答案单独使用。
