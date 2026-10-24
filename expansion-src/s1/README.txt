地震断层自动解释：沿波形不连续性寻找错断
caseId: s17x-s1-seismic-fault
sceneId: s1 / 物探
版本: 1.0.1

使用成品
将统一构建后的完整案例文件夹通过老师门户“添加案例”选择文件夹导入。
可直接双击成品 demo/index.html，默认演示完全离线，使用普通HTML/CSS/IIFE JavaScript。
本源码目录的demo.html由统一构建器复制到成品；engine.js与app.js拼接为demo/demo.js。
compose.py维护自绘图、文案和manifest；checks.mjs/check-results.json为开发证据，不进入成品。

三部分
专业背景：地层错动与同相轴、局部波形相似性、断距/噪声/缺道，共3幅概念SVG。
案例流程：独立剖面分组、局部特征、真实逻辑回归、独立验证、迹线与复核，共5步5幅图。
可运行示范：反射振幅、真实模型支持度、基线/错误对照3幅联动图；局部左右道波形、真实特征贡献、训练损失与验证曲线。

实际计算
84道×72采样点的自行生成合成二维反射剖面，道间距25 m，采样4 ms，双程时间800–1084 ms。
教学断距表示反射轴时间位移；不直接换算成垂向地质断距米数。
8条独立训练剖面、2条验证剖面，默认独立测试剖面-2029；同剖面的patch不跨集合。
9维观测特征（局部相关不连续性、移位匹配、水平/垂向差异、能量、方向持续性与缺失比例）。
训练组标准化；正则逻辑回归真实执行240轮梯度下降。不是预训练深度网络。
两条验证剖面实算断层带F1后确定模型阈值；基线不连续性阈值也在相同验证组选择。
infer不接收参考断层坐标/真值掩码，逐行选择高于阈值的最大得分位置，不用参考迹线连接。
固定评价区第8–63行、第3–80道共4368像素。缺道拒判保留在分母，真实断层漏检计FN。
IoU=TP/(TP+FP+FN)，F1=2TP/(2TP+FP+FN)。迹线每行最多一候选，同时间行≤2道（50 m）匹配；空分母不适用。

建议演示
1. 可运行示范点击“运行断层识别与比较”，看同一评价区两方法的实际结果。
2. 点选候选附近，看左右相邻道的局部真实波形与9项模型贡献。
3. 载入“小断距+噪声+缺道”，重算后看灰色拒判区域和漏检。
4. 查看“无断层情景”，观察模型与基线的假线和无适用分母。
5. 保存人工复核点、应删除行或待核查点；意见与模型原输出分开。输入改变或新运行撤销当前意见，旧历史仍保留。
6. 运行后导出JSON，或恢复默认。图可用方向键、数值坐标选择；窄屏概念图局部滚动保留字大。

导出
仅ready导出当前结果。JSON含07协议的caseVersion、datasetId、wellId:null、areaId、runConfig、sources与claims。
source保留本次真实振幅/缺失数组；claim按当前点和窗口定位sourceVersion，声明model_inference。
模型得分不是经过概率校准的现场断层概率。人工意见保存原运行ID、局部观测、原候选和历史。
window.CaseInspect.snapshot()返回当前状态、参数、runId和真实指标；evidence()只在ready返回与导出一致对象。

专业来源
SEG tutorial: https://wiki.seg.org/wiki/Semblance,_coherence,_and_other_discontinuity_attributes
AAPG: https://www.aapg.org/news-and-media/explorer/is-it-a-subtle-fault-or-just-noise/
本README给出成品所需数据模型与来源链接；项目扩展源码目录的 sources.json 保存进一步记录。

验证
执行 node expansion-src/s1/checks.mjs，计算与源码契约结果见 check-results.json。
作者未执行浏览器/教师门户接入验收；由主任务对统一构建成品实际执行并另记证据。
