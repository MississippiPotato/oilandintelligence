# 最终 17 例原站与离线验收

最终机器可读报告为 `browser-summary.json`。它只聚合当前通过的单例报告，历史失败、调试尝试、源代码检查和下载后的文件验证都没有累加为浏览器通过数。

| 实际浏览器范围 | 完成数量 | 通过断言 |
| --- | ---: | ---: |
| 老师未修改原站，真实添加当前 17 个案例并逐例刷新 | 17 / 17 | 102 |
| 新 12 例背景、流程、计算、改参、重置、复核、下载、刷新重算 | 12 / 12 | 206 |
| 新 12 例独立 file 禁网、390 × 844、助手本地导航和紧凑 UI | 12 / 12 | 132 |
| 原 5 例新知识讲解包重新计算、下载、刷新再运行 | 5 / 5 | 20 |
| 真正关闭 CLI 浏览器并使用同一 profile 重开，确认持久注册 | 17 / 17 | 18 |
| 关闭重开后，17 例逐例实际计算、指标比较及助手导航 | 17 / 17 | 119 |
| 老师 firstbreak 样例真实添加、控件改变与重绘 | 1 / 1 | 4 |
| 合计 | | 601 |

最终浏览器失败为 0，缺失报告为 0。12 例 file 禁网运行的 HTTP 请求为 0；各组均记录了实际 JavaScript 异常列表，最终列表为空。老师原站请求不存在的 favicon 返回过 404，这与页面脚本异常分开记录。

17 个自制包加老师 firstbreak 样例在同一 profile 中保存；关闭重开后 `atlas.casepack.v2` 长度为 **2,859,158 字符**。没有出现“仅本次有效”的导入提示。

最终导入报告与重开后的报告都通过浏览器读取真实已存包，计算 manifest 的规范 JSON SHA-256 和 4 个文件的 SHA-256。Node 把这些浏览器读取结果与当前磁盘比较，17 / 17 全部一致；此文件比较在总报告的 `nodeCurrentPackageVerification` 中独立呈现。

17 个真实下载为 `output/exports/v1.7/{scene}-original.json`。下载后的 Node 检查 **58 项通过、0 失败**，包含案例身份/版本、运行标识、来源声明引用、人工意见记录，以及原 5 例与此前实际浏览器下载的指标一致。该 58 项没有计入上方 601 项。

重开后的原站 opaque iframe 有坐标投递差异，最终 tabs/run 采用真实键盘 Enter 激活。wo1/r5 的助手按钮也通过真实键盘激活；清除残留输入状态后完成流程导航和返回实验，计算结果保持。未调用页面 run 方法，未使用 evaluate-click 代替交互。此前未收到 click 的失败保存在 `browser-restart-input-delivery-attempt.json`。

本轮实际发现并修复的两个网站问题，以及更早的测试选择器尝试，都保留独立证据：

- `browser-runtime-before-startup-and-input-fixes.json`：助手在 head 内联执行时 body 不存在；wo1 默认 number 值与 step 不匹配。
- `browser-harness-selector-attempt.json`：测试误用原站容器及流程 tab 名称。
- `browser-offline-harness-criteria-attempt.json`：测试把交互步骤的一幅当前图误当成完整静态图册，并把眉题字号当作正文。
- `browser-restart-harness-attempt.json`：大体积指标 JSON 超过 Windows 命令行长度，改为比较实际计算后的 SHA-256。

已查看的实际截图包括 `output/playwright/expansion-2026-10-24/g1-visualization.png`、`d1-visualization.png`、`pr1-visualization.png`、`t1-visualization.png`，以及 `pr1-offline-mobile-assistant.png`。桌面独立助手实测 410 × 700，输入字号 18 px；窄屏输入及发送按钮位于视口内。

本会话验收覆盖老师原站和自包含独立案例。增强门户首页、首页主题图与原 5 例文章视觉的整体验收由父智能体另一个 profile 完成。窄屏使用真实 Chrome 视口模拟；本轮未执行付费模型请求或实体手机操作。
