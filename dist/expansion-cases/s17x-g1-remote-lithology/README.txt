地质剖面遥感解译：从多波段像素读懂地表单元
caseId: s17x-g1-remote-lithology
sceneId: g1 / 地质勘察
版本: 1.0.2

使用成品
将本例构建后的完整文件夹通过老师门户“添加案例”选择文件夹导入。
也可直接双击成品 demo/index.html；默认计算、SVG、地图和指标均不需要网络。
本源码目录由统一扩展构建器构建，demo.html 是最终 demo/index.html 的来源；engine.js 与 app.js 拼接为 demo/demo.js。
compose.py 仅维护自绘图、教学文案和manifest；checks.mjs/check-results.json 是开发计算证据，不放入成品。

三部分
专业背景：露头与遥感像素、波段反射、颜色与多信息分类，共3幅独立概念SVG。
案例流程：整图分组、6维特征、近邻库、验证选参、地图比较与复核，共5步、5幅图。
可运行示范：3幅可点选联动栅格图、像素光谱、实际训练近邻、各类IoU/F1、混淆矩阵、人工意见和JSON导出。

实际计算
三类教学露头（砂岩、泥岩、灰岩）及植被覆盖，72×48像素，30 m/像素。
3波段反射率数值与影像为自行生成的教学合成数据，不是实测光谱库。
6幅训练图按网格取576像素；2幅验证图选择 k=3/5/7，单红光基线也由验证图选择阈值偏移；默认测试图幅-2027。
训练组拟合均值/标准差，距离加权kNN真实推理。可做仅红光的特征消融。
infer只接收观测、训练模型和固定配置，不接收评价真值。evaluate单独接收参考标签。
各类F1=2TP/(2TP+FP+FN)，IoU=TP/(TP+FP+FN)，待复核仍计对应类别FN；无适用分母显示不适用。

建议演示
1. 打开“可运行示范”，点击“运行分类与比较”。
2. 选“单红光基线”或“误分与待复核”，点选同一像素，看实际光谱与近邻来源。
3. 点击“强阴影+高噪声”，结果变为待重算，再运行看真实错误变化。
4. 改用“仅红光”消融，保持相同来源划分比较。
5. 保存一个像素的人工意见；再修改输入，当前意见撤销，历史保留；重算后可导出。
6. 恢复默认。地图支持方向键选点，数字坐标可用键盘操作；窄屏概念图在图内横向滚动。

导出
仅ready可导出当前结果。JSON含07协议的caseVersion、datasetId、wellId:null、areaId、runConfig、sources与claims。
source保留本次真实波段数组；claim绑定选中像素坐标、sourceVersion、特征和邻居。人工意见独立留存，不自动变成金标。
window.CaseInspect.snapshot()返回当前状态、参数、runId和真实指标；evidence()只在ready返回与导出一致的对象。

专业来源
USGS EROS: https://eros.usgs.gov/earthshots/introduction-remote-sensing
Servicio Geologico Mexicano: https://www.sgm.gob.mx/Gobmx/en/About_SGM/Remote_sensing.html
本README给出成品所需数据性质与来源链接；项目扩展源码目录的 sources.json 保存进一步记录。

验证
执行 node expansion-src/g1/checks.mjs，计算与源码契约记录见 check-results.json。
作者未执行浏览器/教师门户接入验收；由主任务对统一构建产物实际执行并另记证据。
