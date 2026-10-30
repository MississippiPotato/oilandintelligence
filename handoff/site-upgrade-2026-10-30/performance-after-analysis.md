# 首次新版五轮：瓶颈分析与保留结果

这五轮全部保留，快照SHA256为 1a3a88d000cba2505a2cc96e0367ee5e776477b0b437223fe4a87e9dfb426b60。LCP中位数2472ms达到2500ms目标，最大3656ms未达到3500ms目标。真实input到包含匹配结果的首个rAF中位数51.1ms、最大227.4ms，未达到每轮50ms目标。应用input到DOM写入中位数22.4ms、最大29.3ms；它是独立指标，不能替换先前声明的可见结果帧标准。

## 响应体积

五轮每轮相同：55个HTTP请求，identity响应1499113字节。按Resource Timing逐请求encodedBodySize/decodedBodySize求和；请求没有缓存命中、正文/3D/实际Live2D重包请求0、失败0。

| 类型 | 请求数 | decoded字节 | 总响应占比 |
|---|---:|---:|---:|
| HTML | 1 | 5723 | 0.4% |
| CSS | 21 | 193109 | 12.9% |
| WebP | 5 | 674450 | 45.0% |
| JavaScript | 28 | 625831 | 41.7% |

Hero为125870字节。四个方向卡合568580字节，占总响应37.9%；虽然标为lazy，Chrome仍在模板生成后请求全部四张。well URL出现两次实际HTTP传输，分别由link预加载和img发起；不能因URL相同就把第二次删出分母。CSS共193109字节，其中ui.css 48137、assistant.css 19654、overview.css 12304。建议保留hero优先，方向卡使用尺寸合适的既有图衍生资源；视口内内容仍须及时显示。

## 长任务的证据边界

正式首轮长任务4个，总2116ms，最长985ms：758.2–943.2、2403.2–3250.2、3257.2–3356.2、3438.4–4423.4ms。Long Tasks API只返回self/unknown，没有可指认函数的栈，不能凭此把985ms全部归给某一脚本。

额外的独立冷启动Profiler/Timeline只用于诊断，未混入五轮。录制会显著放大耗时；数据位于output/performance/after-diagnostic-raw.json。该诊断确认：shell执行后、home执行前先发生UpdateLayoutTree与大Layout；home随后再次替换main并产生另一轮Layout。冻结源码也确认原shell先生成作业链、方法、矩阵、系统说明，home再replaceChildren。首次尝试完整trace返回超过CLI子进程stdout缓冲而ENOBUFS；其浏览器和服务在finally关闭，之后只返回显著事件的诊断成功。

## 最值得实施的两项优化

1. 升级首页跳过原shell首页正文的临时生成和布局，先提供可供新版填充的main骨架。这样直接删除一次没有最终用途的布局；原页面的独立兼容副本仍按项目边界保留。
2. 搜索弹窗去除背景blur，按实际布局加contain/稳定结果区域，目录或导入发生变化时再失效索引。五轮应用计算与DOM写入已小于30ms；诊断在真实input处理后还有Layout，冻结CSS又明确存在backdrop-filter:blur(5px)，因此应先减少布局与合成工作。

这些是基于当前证据的优化建议；具体收益必须由有实质代码变化的after-final独立五轮验证。没有追加第六轮替换超标首轮。诊断结束Chrome与8766已关闭，8755没有修改。
