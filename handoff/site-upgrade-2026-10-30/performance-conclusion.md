# 首页性能测量结论

已完成旧版5次与新版5次正式真实Chrome采集，两阶段各自固定快照、条件完全相同。用户随后接受当前性能，不再要求继续深度优化，因此停止Profiler和第二组五轮。两项原目标未达仍原样记录，没有改成通过，没有用第六次替换首轮。

条件：1440×1000，CDP每轮禁用并清空浏览器缓存、清空来源存储；下载4Mbps（500000B/s）、latency100ms、CPU4×；本地8766只读快照，identity/no-store，与现有8755静态传输方式一致。

| 指标 | before | after | 说明 |
|---|---:|---:|---|
| 有效完整采集 | 5/5 | 5/5 | 请求失败另记 |
| 全网络干净success | 0/5 | 5/5 | 旧版助手status跨来源失败保留 |
| LCP中位数 | 42556ms | 2472ms | 减少94.2% |
| LCP最大值 | 44628ms | 3656ms | 新版原目标3500ms未达 |
| DOMContentLoaded中位数 | 41904.5ms | 2461.2ms | 实际导航时间 |
| 真实主标题可用中位数 | 41158.8ms | 2408.0ms | 排除加载提示 |
| 目录入口可用中位数 | 41159.5ms | 2408.6ms | 新版要求S17HomeReady=true，且随后实点打开 |
| 右上搜索入口可用中位数 | null | 2538.3ms | 旧版无此入口 |
| 搜索input→首个结果rAF中位数 / 最大 | null | 51.1 / 227.4ms | 原每轮≤50ms目标未达 |
| 搜索input→DOM写入中位数 / 最大 | null | 22.4 / 29.3ms | 独立指标，不替换rAF标准 |
| bootstrap JS原始字节 | 18436693 | 625831 | 减少96.6%，650KiB=665600B |
| 首页HTML字节 | 5279 | 5723 | 均小于256KiB |
| encoded/decoded响应体字节 | 19160863 | 1499113 | identity，减少92.2% |
| 首屏HTTP请求数 | 54 | 55 | 每轮相同 |
| 正文/3D/实际Live2D重资源请求 | 9 | 0 | 每轮相同；轻量加载入口仍计入JS |
| 缓存响应数 | 0 | 0 | 每轮相同 |

新版LCP逐次为3656、2448、2472、2472、2488ms。所有目标如下：

- fiveMeasurementsComplete：PASS
- lcpMedianAtMost2500：PASS
- lcpMaxAtMost3500：未达原目标
- zeroFirstScreenBody3DLive2DRequests：PASS
- bootstrapJSAtMost650KiB：PASS
- observedJSAtMost650KiB：PASS
- indexAtMost256KiB：PASS
- searchAtMost50ms：未达原目标

当前站点随后把21个CSS请求合并为一个普通本地文件（181756B）。这发生在after冻结以后：实测after首页SHA为1a3a88d000cba2505a2cc96e0367ee5e776477b0b437223fe4a87e9dfb426b60，当前首页SHA为a66d4e2e1b1dd703131b2df7b124cb31023130ea28c443ad2a279c3c663a6949。因此正式性能结论只覆盖冻结的after，不能把它写成最终当前版本的同SHA正式测量，也不宣称合并CSS带来的额外耗时收益。

当前8755首页仅做过1次未限速功能sanity，未计入benchmark：真实标题与S17HomeReady通过，自制65例/注册含老师样例66例/61原场景；iframe0，目录点击成功（61场景、65案例、先显示12场景）；真实输入“钻速”显示14条结果、总匹配15条；首屏正文/3D/实际Live2D重资源请求0，失败0，页面异常0。完整结果为performance-final-sanity.json。

旧版助手/status在8766来源下每轮CORS失败，但五轮真实页面指标都完整；未重测原8755来源，不据此推断其生产可用性。LCP使用load后固定2000ms观测窗口，用户点击目录/搜索在首屏采集之后。首次无效测量器尝试、正式五轮、附加有开销的Profiler诊断各自保留并分开；不混淆为同一分母。

测量工具为tools/measure-upgrade-perf.mjs。正式每阶段的原样执行脚本与SHA已保存在output/performance下；before/after JSON保留逐请求字节、失败、候选LCP、长任务及真实控件结果。详见performance-before.json、performance-after.json、performance-comparison.md和performance-after-analysis.md。当前所有本任务Chrome会话已关闭，8766已关闭，8755未修改。
