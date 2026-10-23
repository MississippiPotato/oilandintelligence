学号17扩展案例｜完井方式智能优选
caseId=s17x-co1-completion-choice；sceneId=co1；版本1.0.0

成品目录结构：case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js。
在老师原门户“＋ 添加案例”中一次选择本完整案例文件夹，校验并添加。不要选ZIP或多个案例总目录。
独立运行：双击demo/index.html。纯前端、默认离线、自包含；没有CDN、API Key或后端。

专业背景含三张独立概念SVG；案例流程五步，每步列出输入、动作、产物和图解；可运行示范实际计算模型、基线和指标。
默认数据为固定种子的教学合成。整井划分训练、验证和测试；测试真值仅进入评价，不进入预测输入。
修改实验条件后结果待重算，当前证据JSON只可在计算完成后下载。边界预设、恢复默认和独立人工复核均可操作。
来源链接见专业背景末尾。规则、生成器、学习器和评价逻辑在开发目录expansion-src/co1/engine.js。

源码计算检查：node expansion-src/co1/verify.mjs。
浏览器导入、刷新、离线与下载验收由总集成工作单独记录；源码检查不替代浏览器通过。
