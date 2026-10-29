# 井见 · 石油智能化可视实验室

现有13阶段、61个自制案例。当前录井m1–m5为1.8.0，其余56例为1.1.1；门户版本1.10.0-preview。本轮完成首页收敛、全站文案审阅和五个录井案例的连续阅读与分层画卷交互。

- [GitHub Pages网站](https://mississippipotato.github.io/oilandintelligence/) · [本地网站](http://127.0.0.1:8755/portal/index.html)
- [当前截图与分层验收](handoff/home-and-five-refinement-2026-10-29/acceptance.html)
- [五个录井案例合集](dist/s17-mudlogging-five-1.8.0.zip) · [全部61例合集](dist/s17-all-61-refined-2026-10-30.zip)
- [老师原站只读兼容副本](portal-original/index.html)

## 当前阅读方式

首页依次呈现四个方向、五个录井入门案例和默认折叠的完整目录。四个方向分别覆盖地质勘探、建井与测量、生产与增采、储运与加工；点击后进入相应目录，支持阶段筛选、搜索与展开全部61例。

五个录井案例改为连续章节，三部分导航用于定位并随滚动更新。五幅已有画卷按各自场景划定区域，选中区域通过裁切图层、阴影和位移动画抬升；选择时画卷留在当前位置，另有“阅读这一节”入口。桌面保留完整空间关系，390px窄屏提供四个文字入口。

案例流程展示数据的分流与汇合，并依次呈现当前对象的计算产物。它们分别使用自己的样品、图像、曲线和原文：

| 案例 | 专业知识与实际观察 |
| --- | --- |
| [m1 岩屑识别](dist/cases/s17-cuttings-lithology/demo/index.html#background) | 从真实岩石外观讲到像素轮廓；参考片RGB、16维特征、近邻图片和颗粒数／面积统计相互对应。 |
| [m2 气测解释](dist/cases/s17-mudgas-context/demo/index.html#background) | 沿同一气峰连接组分、累计泵量、来源时段和工况；背景控件与主计算联动。 |
| [m3 荧光判读](dist/cases/s17-fluorescence-review/demo/index.html#background) | 白光和UV对应同一样品，比较曝光、三种掩膜及共同分母下的实际像素计数。 |
| [m4 钻时分段](dist/cases/s17-drilltime-boundaries/demo/index.html#background) | 对齐原始钻速、工况、校正响应和连续井段；查看当前深度的实际标定值。 |
| [m5 录井报告](dist/cases/s17-evidence-report/demo/index.html#background) | 原文分成事实抽取和栏目分类两条路线，修改数值、否定或范围后重算，并逐句回查来源。 |

其余56例保留已有专业图表、计算引擎及逐例比较任务。Sol Max沿61例与门户的有效渲染入口审阅，删除反复制作自证式文案，并修正g3图件整理、pr2预测基线、pr4温度残差等讲解与实现不一致的描述。Terra Max审阅教学叙事，并实际操作[Saphir讲义与演示](https://cinger007.github.io/saphirv3/case-003/index.html#lecture)，据此强化对象、关系与计算产物的对应。

## 运行与原站导入

执行`npm run serve`，打开本地网站。服务只提供静态文件，各案例计算在浏览器中执行；每例也可双击其`demo/index.html`离线运行。

录井五例位于`dist/cases/`，其他56例位于`dist/expansion-cases/`。ZIP先解压，再通过老师原站的“添加案例”选择一个完整案例目录。每例均为`case.json`、`README.txt`、`demo/index.html`、`demo/demo.css`、`demo/demo.js`五个文件。原站显示静态背景和流程预览，完整交互在“可运行示范”内执行；增强门户支持画卷和讲解导航。

增强门户沿用IndexedDB，原站沿用原有localStorage与重复ID处理。已有旧版手动导入时，先从当前浏览器移除旧记录，再导入新版；首页入口也按单例版本判断。老师提供的firstbreak样例保持原文件格式。

## 构建和验收

- `npm run build`：构建当前五例与其余56例，写入本轮独立目录，不覆盖此前日期的验收。
- `npm run build:five:draft`：修改录井讲解代码后的首次构建。随后在Chrome会话设置`S17_FLOW_SESSION=five-refine`并执行`npm run capture:four-flow`，重新采集四例实际默认流程产物；最后运行`npm run build`做严格构建。
- `npm test`：当前源码、61例五文件契约、63份原站／观测材料和67份计算／数据文件的哈希检查。此项不操作浏览器。
- `npm run accept:browser`：在专用Chrome会话运行五例桌面、390px窄屏、断网file、原站目录导入／刷新／重跑／下载，再检查三例增强门户、四例扩展样本、原firstbreak样例和首页。
- `npm run verify-delivery`：核对当前文件与已经保存的真实浏览器记录。
- `npm run package`：生成五例独立包、五例合集、61例合集、完整静态站点及审阅记录包；检查ZIP CRC和逐成员SHA256。

当前验收范围见[验收记录](handoff/home-and-five-refinement-2026-10-29/acceptance.md)。61例源内容审阅、源码／文件检查和浏览器路径分别记录；其余56例本轮抽查4例，没有重新执行全部56例的浏览器全路径。

此前[56例轻量改进](handoff/expansion-lessons-2026-10-29/acceptance.html)、[四例重做](handoff/four-exhibits-2026-10-29/acceptance.html)、[m2讲解](handoff/m2-clarity-2026-10-28/acceptance.html)和[61例教学审阅](handoff/teaching-audit-2026-10-24/acceptance.html)保留各自原日期及版本。`build:previous-lessons`、`test:previous-lessons`等入口对应历史范围。

现有共享助手的独立交付记录见[助手记录](handoff/assistant-companion-2026-10-29/README.md)。本轮保留其模型配置、Live2D和历史能力；阅读时收拢关闭状态的入口，打开后继续使用原伴随界面。

照片和实测曲线出处见[公开资料审计](handoff/real-data-source-audit.md)、[岩芯与曲线署名](data/real/ATTRIBUTION.txt)、[白光／UV署名](data/real/CALCITE-ATTRIBUTION.txt)。模型预测读取观测，评价答案在预测后独立使用；证据交换接口与原格式保留。
