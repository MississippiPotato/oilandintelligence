射孔效果智能评估：把工况变化与效果分开

案例 ID：s17x-p4-perforation-effect
老师场景：p4

使用：通过老师原站“添加案例”选择完整案例目录；也可直接离线打开 demo/index.html。默认计算不需要网络、后端或模型密钥。

内容：专业背景解释概念与变量，案例流程逐环节讲输入输出，可运行示范读取当前输入真实计算、比较基线、显示图表和评价，输入修改后结果标记过期。

数据：固定随机种子的合成教学记录。引用资料用于专业概念，未将其描述为实测数据。模型只读取训练记录和观测，评价标签不传入预测入口。

算法：工况预期回归；对照：直接前后增量。
来源：
SLB：productivity index https://glossary.slb.com/en/Terms/p/productivity_index_pi.aspx
SLB：储层工程工作 https://www.slb.com/resource-library/oilfield-review/defining-series/defining-reservoir-engineering

验证边界：源文件生成不等于浏览器验收；实际浏览器记录由汇总交付另附。

当前教学版：1.1.0。专业内容和已有图表沿用，增加逐例读图提示、默认计算与自动更新。
比较任务：增加生产压差：比较原始产量增幅与工况校正后增量，分清压差贡献。
提高含水：对照产液与有效增油，查看校正怎样改变效果判断。
