结蜡 / 结垢预测：先把结蜡机理讲清楚

案例 ID：s17x-pr5-wax-risk
老师场景：pr5

使用：通过老师原站“添加案例”选择完整案例目录；也可直接离线打开 demo/index.html。默认计算不需要网络、后端或模型密钥。

内容：专业背景解释概念与变量，案例流程逐环节讲输入输出，可运行示范读取当前输入真实计算、比较基线、显示图表和评价，输入修改后结果标记过期。

数据：固定随机种子的合成教学记录。引用资料用于专业概念，未将其描述为实测数据。模型只读取训练记录和观测，评价标签不传入预测入口。

算法：逻辑回归分数；对照：仅按温差阈值。
来源：
SLB：Olga wax 机理说明 https://www.slb.com/products-and-services/delivering-digital-at-scale/software/olga/olga-solids-management/olga-wax
SLB：流体成分与析蜡温度测试 https://www.slb.com/products-and-services/innovating-in-oil-and-gas/reservoir-characterization/rock-and-fluid-analysis/fluid-analysis/composition-analysis

验证边界：源文件生成不等于浏览器验收；实际浏览器记录由汇总交付另附。

当前教学版：1.1.1。专业内容和已有图表沿用，增加逐例读图提示、默认计算与自动更新。
比较任务：降低管壁温度：对照温差与风险分数，查看温度基线和联合方法是否一致。
减少含蜡量：保持其他条件，比较单温度规则与联合候选的差异。
