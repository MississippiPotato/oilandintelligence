# 首页升级：同条件五次性能对照

旧版完成 5/5 次有效采集；新版完成 5/5。两阶段条件完全相同：true。计时单位均为ms；均从各自导航起点计时，标题必须是实际#ov-title内容，加载提示不能满足条件。

条件：真实Chrome，1440×1000，CDP每次禁用并清空缓存、清空来源存储；4,000,000 bit/s下载（500,000 B/s），100ms网络latency，CPU 4×。8766只读快照服务使用identity/no-store传输，与项目8755静态服务一致；不是CDN压缩或生产托管测试。

| 指标 | 旧版中位数 | 新版中位数 | 旧版最大 | 新版最大 |
|---|---:|---:|---:|---:|
| LCP | 42556.0 | 2472.0 | 44628.0 | 3656.0 |
| DOMContentLoaded | 41904.5 | 2461.2 | 45067.5 | 3442.2 |
| 真实主标题可用 | 41158.8 | 2408.0 | 43726.9 | 3222.1 |
| 目录入口可用 | 41159.5 | 2408.6 | 43727.7 | 3222.8 |
| 右上检索入口可用 | null | 2538.3 | null | 4458.6 |

| 资源 | 旧版 | 新版 |
|---|---:|---:|
| 首页HTML原始字节 | 5279 | 5723 |
| 引用bootstrap JS原始字节 | 18436693 | 625831 |
| 首屏HTTP请求数中位数 | 54 | 55 |
| encodedBodySize中位数 | 19160863 | 1499113 |
| decodedBodySize中位数 | 19160863 | 1499113 |
| 首屏body/3D/Live2D请求（逐次） | 9, 9, 9, 9, 9 | 0, 0, 0, 0, 0 |

旧版首屏没有右上搜索，记录为null。新版真实input到首个包含已改变匹配结果的rAF：中位 51.1，最大 227.4；应用自身记录的input→DOM写完中位 22.4，最大 29.3。首次打开搜索（包含建索引）中位 320.2，最大 1149.9，单独列出，不混入稳定输入耗时。

## 固定验收目标

- fiveMeasurementsComplete: **PASS**
- lcpMedianAtMost2500: **PASS**
- lcpMaxAtMost3500: **FAIL / pending**
- zeroFirstScreenBody3DLive2DRequests: **PASS**
- bootstrapJSAtMost650KiB: **PASS**
- observedJSAtMost650KiB: **PASS**
- indexAtMost256KiB: **PASS**
- searchAtMost50ms: **FAIL / pending**

目标针对五次完整测量；网络请求失败及未捕获页面错误另列，不能因为指标完成就称全站没有错误。

旧版请求/协议失败：[{"iteration":1,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":2,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":3,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":4,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":5,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"}]。

新版请求/协议失败：[]。

首屏采样截止于load后固定2000ms，随后才点击目录与搜索；所有逐请求encoded/decoded字节、LCP候选、长任务和原始失败见performance-before.json与performance-after.json。每阶段固定快照SHA分别为 d2eced24811dd6949c7202e3775bccbad3ffa5825ca7e9cc36cb8e0695b75d9b / 1a3a88d000cba2505a2cc96e0367ee5e776477b0b437223fe4a87e9dfb426b60。无效测量器首次尝试另存performance-before-attempt-instrumentation.json，未混入正式5次。


后续收束：用户接受当前性能，停止继续深度优化与第二组五轮；LCP最大值与input→结果rAF两项目标仍未达。CSS合并发生在本快照冻结之后，当前版本仅做1次功能sanity，未称为同SHA正式benchmark。完整结论见performance-conclusion.md；原始5轮与分母不变。
