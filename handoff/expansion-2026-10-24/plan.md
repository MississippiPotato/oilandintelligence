# 十二阶段扩展实施与验收计划

本轮按用户确认：在原录井 m1–m5 五例之外，为其他十二个阶段各增加一例，共新增十二例。其余四十四个候选场景不在本轮范围内。原老师样例不计入本人完成数量。

| 阶段 | 目标场景 | 源码目录 |
| --- | --- | --- |
| 地质勘察 | g1 地质剖面遥感解译 | expansion-src/g1 |
| 物探 | s1 地震断层自动解释 | expansion-src/s1 |
| 钻井 | d1 钻速预测与参数优化 | expansion-src/d1 |
| 测井 | w4 岩性识别 | expansion-src/w4 |
| 固井 | c1 固井质量智能评价 | expansion-src/c1 |
| 完井 | co1 完井方式智能优选 | expansion-src/co1 |
| 射孔 | p1 射孔参数优化 | expansion-src/p1 |
| 采油 | pr1 抽油机井工况诊断 | expansion-src/pr1 |
| 修井 | wo1 修井作业方案智能推荐 | expansion-src/wo1 |
| 增采 | e1 压裂参数智能优化 | expansion-src/e1 |
| 运输 | t1 管道泄漏智能检测 | expansion-src/t1 |
| 加工 | r5 产品质量在线软测量 | expansion-src/r5 |

上表名称以老师 `portal-original/assets/data.js` 实际 taxonomy 为准；自动生成的 coverage.json 记录其原始名称，避免以设计标题替代场景绑定。

每例由普通脚本 engine.js、app.js 和自包含 HTML/CSS 构成；case.json 只使用原站认识的字段。专业背景解释石油概念，流程的每个步骤有输入、动作、输出与图解，演示通过实际计算比较方法与基线，并提供交互、当前状态与结果导出。评价真值仅用于评价，不能成为预测输入。

构建命令：

```text
node tools/build-expansion.mjs
node checks/verify-expansion-source.mjs
```

开发中允许部分案例先齐全。构建只收录实际存在且通过源码结构检查的案例，在 build-lock.json 中记录 actualCount、missing、invalid。准备最终交付时加 `--require-all`，不足十二例会返回非零退出码：

```text
node tools/build-expansion.mjs --require-all
node checks/verify-expansion-source.mjs --require-all
```

每个可导入成品目录只有五文件：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js。README 和来源记录在源码中保留。助手直接读取构建时最新的共享助手源码；独立演示和门户都能提供相同的本地导览，并按实际案例绑定页面上下文。默认计算不需要在线模型。

扩展案例保留各自字号与布局。构建使用 `assistantCSS({ readability: false })`，只追加助手自身作用域内的样式；旧五例调用 `assistantCSS()` 的默认输出保持一致。2026-10-24 作者实际浏览器发现旧全局 readability.css 在新案例尾部覆盖大字号，修复过程见 font-bundle-correction.json；修复前锁与源码检查保留为 before-font-fix，修复后的真实字号需继续由浏览器测量。

老师原宿主会将示范脚本内联，原 HTML 上的 defer 属性因此不能作为启动保障。共享助手由主线统一在 DOM 就绪后启动；检查工具会在正文不可访问的 loading 文档中执行真实助手 bundle，确认不会提前读取 body。原站运行中发现与修正的记录见 assistant-startup-correction.json；该 VM 检查不替代内联沙箱的实际运行。

增强站插件 `portal/assets/s17-expansion-cases.js` 调用原 `Cases.register`，注册真实内置案例，不写本机导入存储，不把内置状态写成“用户已导入”。`window.S17Expansion.cases` 提供 sceneId/id/name/title/stageId/stageName/methods/summary/directory/href/standaloneHref；其中 directory 固定为 expansion-cases。`byScene(sceneId)` 和 `href(sceneId, tab)` 可供首页和助手使用。演示挂载为原生 sandbox iframe，不授予 allow-same-origin，切换页面时移除旧 iframe。

需由真实浏览器逐例记录：独立双击离线运行；老师原站通过“添加案例”选择本完整目录，三个标签、计算与导出均可用；原站累计十二例后刷新和关闭重开，再逐例运行；增强站插件中的演示可运行；原样 firstbreak 可导入增强站；窄屏与键盘可操作，无运行异常。构建、语法或 Node VM 检查不填写为浏览器通过。

老师原站的重复 ID 检查保持原样。在增强站手动导入同名内置案例前，可通过原案例库隐藏对应插件；未修改的老师原站没有这些内置 ID，因此导入互不冲突。累计存储是否成功只能由真实浏览器验证，不能仅凭单包小于 6 MiB 推断。

contract-before.json 保存老师两个兼容副本、四个导入契约文件和原五例源码的实施前散列。源码检查验证这些字节未被扩展构建改动。助手 UI 的共享更新会按当前构建源注入演示，另列来源散列。
