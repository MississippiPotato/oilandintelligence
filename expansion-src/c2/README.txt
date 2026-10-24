注水泥参数优化
场景：c2；案例 ID：s17x-c2-cement-displacement
打开 demo/index.html，无需网络或后端。通过老师“添加案例”选择包含 case.json、README.txt 和 demo/ 三文件的完整文件夹。
把置换效率和环空压力放在同一张候选图上，观察压力上限怎样改变可选排量与浆体密度。
方法：双输出岭回归 + 约束网格搜索。各输入、计算步骤和评价分母在页面中说明。
专业概念参考：https://www.slb.com/resource-library/oilfield-review/defining-series/defining-cementing
数据：固定种子的教学合成；真实数值算法在浏览器执行。导出 JSON 保存当前参数及实际结果。修改输入会清除旧结果，需重新运行。
验收：本文件不宣称浏览器通过；实际浏览器结果由整站验收报告单独记录。
