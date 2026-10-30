# before homepage performance

Snapshot d2eced24811dd6949c7202e3775bccbad3ffa5825ca7e9cc36cb8e0695b75d9b frozen 2026-10-30T02:39:54.531Z. Five runs use exactly this cached content.

Real Chrome via tools/pw.mjs; 1440×1000; cold cache; 4,000,000 bit/s download (500,000 B/s), 100 ms CDP network latency, CPU 4×; local identity/no-store HTTP on 8766. The existing 8755 server is not used or modified.

| Run | LCP ms | DCL ms | Real title ready ms | Directory ready ms | Upper-right search ms | HTTP requests | Encoded / decoded body bytes | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 44628.0 | 45067.5 | 43726.9 | 43727.7 | null | 54 | 19160863 / 19160863 | FAILED |
| 2 | 41844.0 | 41728.2 | 40887.7 | 40888.3 | null | 54 | 19160863 / 19160863 | FAILED |
| 3 | 43384.0 | 41904.5 | 41158.8 | 41159.5 | null | 54 | 19160863 / 19160863 | FAILED |
| 4 | 41724.0 | 41719.9 | 40823.2 | 40823.6 | null | 54 | 19160863 / 19160863 | FAILED |
| 5 | 42556.0 | 42550.8 | 41609.8 | 41610.7 | null | 54 | 19160863 / 19160863 | FAILED |

LCP median 42556 ms; max 44628 ms. Raw referenced bootstrap JavaScript 18436693 bytes; entry HTML 5279 bytes.

Old upper-right search is null when absent. Ready timestamps require actual visible content; “正在加载” never satisfies the title. Directory functionality is exercised separately after the LCP observation window. JSON preserves every request, encoded/decoded bytes, failures, LCP candidates and long tasks. A failed run is retained and is not replaced by a sixth run.

Failures: [{"iteration":1,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":2,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":3,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":4,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"},{"iteration":5,"url":"https://jingjian-assistant-relay.richcreek513.chatgpt.site/api/assistant/status","error":"net::ERR_FAILED"}]

Lifecycle: {"session":"upgrade-perf","serverStarted":true,"browserOpened":true,"browserClosed":true,"serverClosed":true}

本阶段5/5轮均完整取得真实标题、目录、LCP和导航时间；但每轮旧助手status请求在8766测量来源下均出现CORS失败，因此全网络协议success为0/5，失败未被清除。原8755来源没有重测，不据此判断其生产可用性。右上搜索确实不存在，保持null。Chrome和临时8766服务均已关闭。

实际执行脚本SHA256：e199fc31a4ba97732fccc82a7fd09989cc1c41f07fb69f5f1de77bfbc133eb36；原样脚本保存在output/performance/before/measure-upgrade-perf.executed.mjs。旧freeze清单中的“你的案例.case.js”为HTML注释示例，未发起HTTP请求、字节按0计，不影响总量；实际本地请求均为200。

测量器首次尝试因CDP Page域未启用，预注入未生效，LCP/就绪时间为null；已在第3次后终止，并原样保存在performance-before-attempt-instrumentation.json。该无效协议不计入本次5轮基线；修复后先做最小注入探针，再顺序执行此处列出的全部5次，没有用第6次替换某个正式结果。
