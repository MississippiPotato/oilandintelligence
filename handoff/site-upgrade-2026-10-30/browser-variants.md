# 四个新增案例的实际 Chrome 验证

当前功能协议 216 项通过、0 项失败，当前路径未捕获未处理 JavaScript 错误或自动外部请求。四例各有桌面、390px、file://断网、老师原站导入与刷新四条路径。另核对了 20 份实际保存 JSON，其案例、改变后的输入及预测/推断产物均与同次 Chrome 状态一致（20/20）。

UI-01 已由局部CSS修复，并在c1的390px原遮挡位置定点复验7/0：44px圆入口与换行后的图例无相交，可实际展开助手，真实局部横滚保持可用。原216项和20份下载继续保留，未重跑。详见 browser-variants-ui01.md。

| 案例 | 桌面1440 | 390px | file://断网 | 原站导入＋刷新 | 实际保存 |
|---|---:|---:|---:|---:|---:|
| g3 构造闭合与溢出 | 11/0 | 13/0 | 11/0 | 19/0 | 5份 |
| p1 GR–CCL深度相关 | 11/0 | 13/0 | 11/0 | 19/0 | 5份 |
| c1 固井水泥强度与等待时间 | 11/0 | 13/0 | 11/0 | 19/0 | 5份 |
| co3 验封温漂与漏率 | 11/0 | 13/0 | 11/0 | 19/0 | 5份 |

每格为“通过/失败”项数。原站19项包含：目录导入、背景正文、流程解释、每步骤操作与产物、两次实际改参/图形变化/复位/保存（第二次在刷新后），以及保存文件解析。

## 实际操作与产物

- g3：北侧通道闭合高度由34 m调至65 m。实际产物：{"spillDepth_m":1062.2505632138914,"closureHeight_m":62.88350294857378,"area_m2":1452500,"volume_m3":33333425.070510954}。
- p1：观测情形改为重复形态 periodic。实际产物：{"status":"ambiguous","accepted":false,"delta":null,"candidateGap":4.085620730620576e-14,"searchCount":241}。
- c1：温度程序由逐渐升温改为全程恒温。实际产物：{"status":"预测达到目标","target_MPa":10,"time_h":18.063866294352334,"baselineTime_h":19.57453880907903}。
- co3：长期温差设定由−1.5 K调至+3 K。实际产物：{"status":"未检出超限漏率","estimate_L_per_min":0.007415156660072248,"low":0.006965008098460202,"high":0.007865305221684294,"baseline_L_per_min":-0.02131922765427685}。

每次操作均从真实控件发出输入，不点击重新计算按钮，等待参数和预测/推断变化，核对 SVG 变化且无 NaN/Infinity，再实际点击下载并复位。复位后参数与预测/推断哈希回到默认；改图验证采用 SVG 内容哈希，排除只依赖修订号变化。

## 窄屏与图文目视

| 案例 | 整页宽 | 局部视口/内容宽 | SVG实际最小字 | 横向滚动 |
|---|---:|---|---:|---|
| g3 | 390/390 px | 330/760 px | 16 px | 0→400 px |
| p1 | 390/390 px | 356/900 px | 16 px | 0→400 px |
| c1 | 390/390 px | 332/880 px | 16 px | 0→400 px |
| co3 | 390/390 px | 332/880 px | 16 px | 0→400 px |

图形保留专业坐标和16px及以上实际文字，通过图内横向滚动查看右侧内容；整页未横向溢出。滚动来自实际鼠标横向滚轮，随后滚回左端截图。

- g3：地图上北侧出口路径、东西剖面和深度向下坐标对应；二维溢出1034.2 m与单剖面1074.5 m明确区分，金色充填面有文字图例。读者能看出一条东西剖面为什么漏掉北侧出口。 [桌面代表图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-g3-desktop.png>)；[390px图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-g3-mobile.png>)。
- p1：参考GR、当前平移GR、CCL与接箍表共用沿井深度坐标；默认δ=3.4 m与1040–1042 m目标带对应，GR标为相对读数。重复形态经实际计算保留多个候选，不把最高相关强行当唯一答案。 [桌面代表图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-p1-desktop.png>)；[390px图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-p1-mobile.png>)。
- c1：温度与抗压强度图同用自然龄期/h，朱红模型、蓝灰50°C基线、金色目标线和查看时刻竖线各有说明。默认10 MPa交点与19.52 h读数对应；改变完整温度程序后重新求交点，读者可以把温度历史与等待时间联系起来。 [桌面代表图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-c1-desktop.png>)；[390px图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-c1-mobile.png>)。
- co3：压力/MPa和温度/°C共享试验时间/min；红色原始压力与蓝灰温漂补偿压力区分，闭阀5 min与查看20 min写进读数。漏率以L/min及区间列出；默认原始压降基线疑似失密，而温漂补偿未检出超限，图文能够解释判断差别。 [桌面代表图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-co3-desktop.png>)；[390px图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-co3-mobile.png>)。

四例代表截图和四例窄屏截图均已用 view_image 打开逐张查看；固井与验封重建后原站图也已打开。原站元素截图带有老师站固定导航覆盖层，因此图文对应的目视判断使用独立页代表图；原站导入、刷新及保存由实际操作协议另外取证。

## 修复与历史尝试

- 实际缺陷：c1 原站导入后报 `(w.lead || []).map is not a function`。作者把 c1/co3 的 workflow.lead 改为数组，把步骤映射到原站保留的 name/role/do/effect/trap，并将完整流程图文放入 metrics.html。主会话统一重建后，两例重新目录导入、全部步骤正文和两次主演示操作均通过。旧错误留在 attempts。
- 协议问题：对已经上传的同 id 包重复添加，原站按设计拒绝。脚本已先通过本会话案例库移除该案例的旧上传副本，单独处理确认对话框，再选择当前目录。磁盘包及其他会话未改。一次 CLI 在确认对话框处提前返回 Modal state 的过程保留在 actions.log；该过程不计入最终通过项。

## 证据与范围

- [机器可读总报告](<G:/可视化导论/5/handoff/site-upgrade-2026-10-30/browser-variants.json>)：当前 cases/passed/failed/errors、16条路径、20份下载的字节数与SHA-256、输入和产物一致性、当前五文件构建指纹及旧尝试。
- [可复跑协议](<G:/可视化导论/5/checks/site-upgrade-variants-browser.js>)；命令为 node checks/site-upgrade-variants-browser.js g3 desktop（scene可选g3/p1/c1/co3，phase可选desktop/mobile/offline/native）。
- [源内容新手审阅](<G:/可视化导论/5/handoff/site-upgrade-2026-10-30/novice-review.md>)单独记录术语、因果链、专业单位和叙述修订；没有拿源码审阅替代浏览器验证。
- 只验证这4个新增案例；不扩称为原61例全路径验收。c1/co3此次兼容修复只影响manifest，主app/engine未变；独立页既有三路径结果继续有效，原站路径使用重建后包重新测。
- 浏览器为独立 upgrade-variants 会话、真实 Chrome channel（HeadlessChrome 155），最后仅1页；file路径在context offline=true下操作并下载。127.0.0.1:8755服务保留。
- 已执行并确认仅关闭 upgrade-variants，返回：Browser 'upgrade-variants' closed。没有 close-all、没有改原站/共享层、没有发布或Git提交。
