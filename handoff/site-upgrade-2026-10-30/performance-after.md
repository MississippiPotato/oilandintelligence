# after homepage performance

Snapshot 1a3a88d000cba2505a2cc96e0367ee5e776477b0b437223fe4a87e9dfb426b60 frozen 2026-10-30T03:24:09.008Z. Five runs use exactly this cached content.

Real Chrome via tools/pw.mjs; 1440×1000; cold cache; 4,000,000 bit/s download (500,000 B/s), 100 ms CDP network latency, CPU 4×; local identity/no-store HTTP on 8766. The existing 8755 server is not used or modified.

| Run | LCP ms | DCL ms | Real title ready ms | Directory ready ms | Upper-right search ms | HTTP requests | Encoded / decoded body bytes | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 3656.0 | 3442.2 | 3222.1 | 3222.8 | 227.4 | 55 | 1499113 / 1499113 | complete |
| 2 | 2448.0 | 2444.9 | 2385.3 | 2386.0 | 49.6 | 55 | 1499113 / 1499113 | complete |
| 3 | 2472.0 | 2467.3 | 2406.4 | 2406.6 | 51.1 | 55 | 1499113 / 1499113 | complete |
| 4 | 2472.0 | 2461.2 | 2414.9 | 2415.3 | 37.1 | 55 | 1499113 / 1499113 | complete |
| 5 | 2488.0 | 2456.4 | 2408.0 | 2408.6 | 57.2 | 55 | 1499113 / 1499113 | complete |

LCP median 2472 ms; max 3656 ms. Raw referenced bootstrap JavaScript 625831 bytes; entry HTML 5723 bytes.

Old upper-right search is null when absent. Ready timestamps require actual visible content; “正在加载” never satisfies the title. Directory functionality is exercised separately after the LCP observation window. JSON preserves every request, encoded/decoded bytes, failures, LCP candidates and long tasks. A failed run is retained and is not replaced by a sixth run.

After targets: {"fiveMeasurementsComplete":true,"lcpMedianAtMost2500":true,"lcpMaxAtMost3500":false,"zeroFirstScreenBody3DLive2DRequests":true,"bootstrapJSAtMost650KiB":true,"observedJSAtMost650KiB":true,"indexAtMost256KiB":true,"searchAtMost50ms":false}

Failures: []

Lifecycle: {"session":"upgrade-perf","serverStarted":true,"browserOpened":true,"browserClosed":true,"serverClosed":true}


后续收束：用户接受当前性能，停止继续深度优化与第二组五轮；LCP最大值与input→结果rAF两项目标仍未达。CSS合并发生在本快照冻结之后，当前版本仅做1次功能sanity，未称为同SHA正式benchmark。完整结论见performance-conclusion.md；原始5轮与分母不变。
