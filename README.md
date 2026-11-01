# 井见 · 石油智能化可视实验室

13个作业阶段、61个老师原场景、65个自制案例，老师自带样例单独统计。当前门户 **1.13.0**；录井M1—M5 **1.10.0**、D1 **1.3.0**、其余55个普通案例 **1.2.1**、四个拓展案例 **1.0.1**。

- [线上网站](https://mississippipotato.github.io/oilandintelligence/portal/index.html) · [录井3D现场](https://mississippipotato.github.io/oilandintelligence/portal/index.html#/stage/mudlogging?focus=m2)
- [完整离线网站](dist/s17-site-1.13.0-offline.zip) · [65例合集](dist/s17-all-65-cases-1.13.0.zip)
- [本轮修改与实际验收](handoff/teaching-map-2026-11-01/验收记录.md) · [老师原站兼容副本](portal-original/index.html)

## 怎么学习

首页用十三幅动态SVG微缩场景串起作业链，分为勘探与建井、完井与生产、储运与加工。阶段编号、原场景数和案例数分别保留。下方直接进入五类方法，也可以通过阶段、方法、难度与关键词组合查找案例。右上检索支持Ctrl/Cmd+K，命中知识小节后进入对应栏目并定位标题。

每例保留专业背景、案例流程、可运行示范。场景速览说明业务问题、实际方法、输入与用途；数据准备清单提供研究应用建议。实际演示的数据另随计算保存。背景末尾提供难度理由、参考方法链接、同场景案例与相关环节。四个拓展案例使用自己的准备条件及方法说明。

## 录井3D与六例教学深化

录井专题只维护一份3D井场。五个对象连接岩屑、气测、荧光、钻参和报告；选择对象后可以读背景或直接进入示范。案例里的“在3D井场中定位”返回同一对象，并恢复当前会话的泵送情景、回放时刻与镜头。M1—M3是材料检测支路，M4是直接记录支路，最后汇入M5。

停泵300—480秒时，累计体积和运输进度保持平台，时钟继续推进；正常到达600秒，停泵后到达780秒。暂停播放只停止回放。计算复用原M2Core；Three.js r180随站点打包，支持离屏暂停、路由释放和二维回退。

| 案例 | 本轮重点 |
| --- | --- |
| [D1 钻速](dist/expansion-cases/s17x-d1-rop-optimization/demo/index.html#workflow) | 一组输入的十项特征、训练标准化、系数贡献与当前预测；约束域及推荐点。 |
| [M1 岩屑](dist/cases/s17-cuttings-lithology/demo/index.html#workflow) | 同一颗粒的像素、16维特征、最近邻距离及加权投票；颗粒数和面积比例。 |
| [M2 气测](dist/cases/s17-mudgas-context/demo/index.html#workflow) | 同一气峰的运输归位、特征尺度和实际近邻；工况变化保持气测输入不变。 |
| [M3 荧光](dist/cases/s17-fluorescence-review/demo/index.html#workflow) | 同一像素的特征贡献、得分、阈值和掩膜；同范围三方法像素计数。 |
| [M4 钻时](dist/cases/s17-drilltime-boundaries/demo/index.html#workflow) | 同一深度的工况回归、实际钻速与校正响应；分组和连续分段。 |
| [M5 报告](dist/cases/s17-evidence-report/demo/index.html#workflow) | 原文中的否定、数值、单位和范围；分类贡献、字段抽取与逐句回查。 |

六例流程完整连续显示，核心智能方法详细展开。默认已完成计算，改变条件后自动重算，保留复位和保存。全部计算引擎与原始数据保持本轮前的指纹；新图读取现有计算输出。

## 离线、兼容与构建

解压离线包后双击index.html。每例独立目录仍只有case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js，单例不超过老师原站6MiB限制。老师原站支持通过“添加案例”选择完整目录；ZIP须先解压。原站背景与流程为静态预览，完整交互在可运行示范中执行。

案例正文与3D重资源按需加载。Live2D按当前要求进站自动加载；门户实验只嵌入实验区，避免重复三部分导航。三个栏目保留各自阅读位置。反馈链接打开预填页面地址的GitHub问题页面，由读者自行提交。

```sh
npm ci
npm run build
npm test
npm run serve
npm run package
```

构建入口为tools/build-teaching-map.mjs，验证入口为checks/verify-teaching-map.mjs。六例流程静态预览来自真实Chrome的默认计算；修改四例展示源码后，先用`node tools/build-teaching-map.mjs --allow-stale-preview`构建，再运行`npm run capture:four-flow`捕获，最后正常构建。历史报告及原站副本保留原内容；本轮证据在handoff/teaching-map-2026-11-01。

默认计算、图表及资料不需要在线模型。现有助手保留本地角色和紧凑对话；可选联网连接由读者自行配置，API Key只保存在当前页面内存。
