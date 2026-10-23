# 数据、来源与实施差异

本轮日期：2026-10-23。全为重新编写的纯 JavaScript、HTML、CSS、SVG，运行不加载第三方库、远程模型、字体或网络服务。专业链接用于阅读，不是运行依赖。

| 来源 | 用途与限制 |
| --- | --- |
| 用户提供原门户：assets/data.js、registry.js、case-upload.js、case-demo-host.js、shell.js、docs/如何添加新案例.md、firstbreak-pick-case | 以实际源码和浏览器行为确定13阶段61场景、字段与导入契约；原目录及只读副本保留。旧文档的“后传自动覆盖”不作为事实使用 |
| s17_development_kit 的00/01/02/04/06/07 | 范围、m2完整规格、门槛与证据协议；规划状态不覆盖成实施记录，执行结果另存 handoff |
| saphirv3-main/case-002/index.html 与 assets/v3-case-demo.js | 仅借鉴概念图卡、数据站、步骤产物、复核与控制变量组织；其归档显示不作为本项目实算证据 |
| [SLB gas show](https://glossary.slb.com/terms/g/gas_show) | 本轮在线核对；支持地面气测有循环迟到、不能直接归到当前钻头深度 |
| [SLB connection gas](https://glossary.slb.com/terms/c/connection_gas) | 本轮在线核对；接单根停泵/短程运动与迟到气峰概念 |
| [SLB trip gas](https://glossary.slb.com/terms/t/trip_gas) | 本轮在线核对；起下钻与停循环等背景 |
| [scikit-learn Nearest Neighbors](https://scikit-learn.org/stable/modules/neighbors.html) | 本轮在线核对近邻分类原理；本项目自己以JS计算，没有Python/scikit-learn运行后端，也不是该库数值一致性复现 |

数据版本 `s17-synthetic-v1`，随机数使用确定性 Mulberry32。训练井 seed=1000+i×31，28口；验证 seed=9000+i×31，8口；演示井 seed=17。每井完整8事件，不把相邻点随机拆分。每条曲线1441行、间隔10s、总时长14400s。气体是仪器归一化单位，非体积分数；MD为测量深度。形状参数在类别间重叠，另有无气峰的工况事件，不将工况存在等同峰存在。测量异常嫌疑使用可见的组分协同弱化来形成线索；这只是教学合成假设。

迟到采用左区间积分 C(t)=ΣQᵢΔt 与线性插值反查源时刻；累计量平台采用首次达到目标累计量的时刻作为约定，停泵期间不能由单个累计量唯一辨认释放时刻。本例不声称模拟了所有气体释放、混合、溶解和仪器过程。只有持续增气事件定义了适用的来源深度金标；工况相关与测量异常不强加该分母。

模型将训练均值/标准差用于事件特征，使用标准化欧氏距离除以√维数（不改变同维条件下邻居排序）。权重1/max(0.05,d)。k与支持度在验证网格中选；最大近邻距离为验证最近邻距离95分位×1.4，最低1.2；这些是透明教学选择。阈值/参数在测试界面的反复调整均标为探索，不宣称盲测。

候选检测三点平滑，背景为总气25分位，默认超过背景0.65且至少3点的连续窗口。基线公开规则：无来源/缺工况拒判；接/起下同时接近拒判；来源时刻距某操作<90s则给关联；其余峰宽>230s给持续，反之给测量嫌疑。kNN与规则共享同一候选。

评价匹配按170s峰时容差最大匹配、最小总时间误差。宏F1平均固定四类，缺失类别F1按0；每类召回无真值时显示不适用。解释评价仅匹配集合，漏检/多余另报；拒判保留第五列。接受集错误率空集不适用。界面另报全部候选覆盖率，避免把未匹配候选隐去。

首轮的规格限缩记录保存在g0-g1/sources.md。本轮已完成m1/m3/m4/m5：m4采用独立多因素岭回归与训练井聚类，m5实际训练朴素贝叶斯；不再以风险原型冒充成品。m2仍不提供任意用户曲线导入，m5显式接收四例证据JSON；它们不需要联网、聊天系统或大型平台。

基础版本高分只说明固定合成例的结果，不能外推到现场或真实油气解释。v1.1另外增加了带许可的公开观测区，见本文末节；没有使用现场评价标签或参考仓库的预存预测。

## G2–G4新增方法与来源

本轮还在线核对了 [SLB cavings](https://glossary.slb.com/terms/c/cavings)、[SLB drilling rate](https://glossary.slb.com/terms/d/drilling_rate)、[Energistics WITSML Fluorescence](https://docs.energistics.org/WITSML/WITSML_TOPICS/WITSML-000-070-0-C-sv2000.html)。用于区分井壁掉块与钻头岩屑、明确ROP速度单位、提醒矿物/添加剂也可产生荧光。这里只转述概念，没有把专业词典当成模型或教学参数的实证依据。

**m1/m3像素。** 320×240 RGBA，默认seed17；样品n使用seed17+(n−1)×101。几何与父样品ID由同一个S17Images生成，白光/UV配对；观测像素与评价实例/荧光掩膜分开。颜色、颗粒层理/细粒/云状纹理属于明确合成设计，不是天然岩石统计模型。m1用可见参考片校正、前景连通域、16维颜色/纹理/形状特征；标准化只拟合24盘288颗训练实例，8盘96颗验证，DEMO-017独立测试。k与支持度验证选择；距离阈值验证95分位×1.3，最低1.15。颜色规则网格也用验证集选择，不刻意压低基线。实例按IoU≥0.2匹配，分类限匹配实例；漏检、合并、多余与前景IoU另列。未知保留在面积/颗粒数分母，二维面积不是地层质量或体积比。

**m3学习与分级。** 12个完整配对训练样品，固定间隔抽样4970像素；4个独立验证样品选择阈值0.35。5维可见校正UV特征，经训练集标准化后进行100轮真实逻辑回归梯度迭代，交叉熵从0.693降至约0.185。B0原始强度阈值45，B1校正强度阈值45，M0校正+学习，区分校正与学习的贡献。固定65,100像素评价域包括预测ROI遗漏；矿物发光仍是显示正类，来源未知不改成油气标签。等级规则：面积<5%为0；否则面积<25%或强度<40为1；其余2。该规则公开、透明，但不是行业标准或训练分级器。固定激发、曝光饱和不可恢复，人工笔刷与原模型指标分开。

**m4工况标定。** 独立固定响应下160行工况标定，logROP对log(WOB/20)、log(RPM/120)、log(Q/0.025)岭回归，非截距正则0.01。标定域WOB10–30kN、RPM70–170、流量0.015–0.035m³/s，域外另报。6口训练井1896有效行拟合标准化与k-means，3口验证井选择k、切换惩罚和原始曲线窗口阈值；默认k3、惩罚0.2、最小段长2。动态规划做连续性，短段显式后合并，保留吞薄层的代价；簇不命名岩性。测试321点、316有效，非钻进和非正工况排除；有效ROP×钻时=60。边界按1m容差最大一对一匹配、最小总距离；无真值/无预测F1不适用。m4是独立受控教学作业，与m2共享井身份/MD范围和单位，不声称完整物理重建。

**m5文本。** 六类，60个表达族；前36族训练252句，中12族验证36句，后12族测试36句，数字/岩性替换不跨族。字符1–2gram多项式NB，数字在分类表示中归一化，但原文和字段抽取保留数值。Laplace α和分差阈值由验证选；未知词表覆盖不足拒判。类别log分数与片段贡献实际计算；用户修订训练标签会重新计数。关键词基线公开且覆盖紫外、发光、操作等同义表达，最终36句两者均宏F1=1.0。字段由规则保留否定、单位、范围和原文字符偏移；多范围不强行绑定、冲突不求平均。报告用约束原文引述模板，不是LLM。关键事实覆盖要求类别及全部比较字段正确；无依据断言计数只核对冻结金标字段+原文模板，不能替代任意句子的语义判断。自由输入没有金标，隐藏性能数字。

上游四例内置快照由tools/build-evidence-fixtures.mjs执行实际算法生成，含原图PNG/曲线/方法/参数和模型推断标记。浏览器实际证据交换则使用原站沙箱下载的JSON，二者记录分开。m5遇同ID/版本内容不同报冲突；句子、来源或模型变化后撤销确认与语义支持，保留历史。版本只在本页修订范围内递增，没有跨会话长期版本服务。

## v1.1公开数据与增强

实际下载、检查了[USROP A版钻井参数](https://github.com/AndrzejTunkiel/USROP)、[PANGAEA顶空气测](https://doi.org/10.1594/PANGAEA.975497)、[Mendeley岩芯图块](https://data.mendeley.com/datasets/b6rj29mrss/1)。锁定提交、原文件SHA、筛选和单位转换见real-data-source-audit.md与real-data-lock.json；许可随data/real/ATTRIBUTION.txt保留。三者分别480行、62记录（31个平行样品位置）、6张原JPEG；均在各自实际身份下展示，不并入DEMO-017同一口井，不把不同深度基准当成MD。

公开区做整块像素特征、气体数值/比值和logROP/logtorque无监督探索，没有现场金标F1。默认合成实验的训练/测试边界未改变。m3配对图仍是合成数据，新增补充观察明示virtual/reviewer_note。逐迭代权重和聚类中心来自实际优化历史；敏感性表重复执行算法；BM25得分按本页来源词项统计计算，分数不代表语义正确率或地质支持概率。

m5工作区JSON显式携带草稿、原始来源、历史与版本下限，加载时重算并撤销当前确认，没有中心化版本服务。混合导入明确标mixed_teaching_and_public/MULTI-SOURCE；文本评价只针对原文字协议。离线HTML包含同一份完整证据JSON，已经下载、打开并提取逐字段比较。

## 首页助手与教学范围更新

用户随后明确以纯前端静态演示为交付，不继续将重训练、研究测试、等级学习模型及复杂工程列为必补项；新增首页Live2D+可选模型问答与导航。范围以scope-update.json为准，保留开发启动包原始规划作为历史来源。

1.3历史版Live2D角色曾换为[官方Jin Natori示例](https://www.live2d.com/en/learn/sample/natori-jin/)（西装与长裤，原角色记录保存在1.2历史版），源于CubismWebSamples固定4-r.5提交。角色遵循Free Material License和Sample Data Terms；Core是专有许可下可再分发运行库，PixiJS和pixi-live2d-display各自MIT。独立署名/许可见portal/assets/live2d/ATTRIBUTION.txt及vendor目录，没有将收集站中的角色统一当作开源资源。

火山方舟客户端按[Responses API官方文档](https://docs.volcengine.com/docs/ark/create-model-responses-api?lang=en)实现。推荐Mini260428及价格来自[模型列表](https://docs.volcengine.com/docs/ark/model-list?lang=zh)与[常规在线价格](https://docs.volcengine.com/docs/ark/model-pricing?lang=zh)，2026-10-23核对：≤32K非音频输入0.20元、音频输入3.00元、文字输出2.00元/百万token。2026-10-23已获准用真实Key做4次小请求：单独文本/WAV/JPEG各一次，实际浏览器图片＋音频一次，均HTTP 200；脱敏记录分别为ark-live-api.json、ark-browser-live.json。Key仅在运行内存，不随记录保存。

另下载三张博物馆同组方解石可见光/短波UV/长波UV原图，CC BY-SA 3.0，用于静态教学观察页。它们是矿物对照，不是含油岩屑标签或工业等级数据，来源见real-data-source-audit.md补充节。


Mini260428的input_audio/input_image结构按上述Responses官方文档实现；录音在浏览器内转PCM16 WAV后以data URL随显式发送请求提交。原生实时语音是另一个服务，开通及凭据见[火山端到端语音文档](https://docs.volcengine.com/docs/real_time_communication/Accessend-to-endreal-timespeechlargemodel?lang=zh)，本轮未开通或冒充已接。浏览器录音流程用Chromium模拟音源检验，不代表实体麦克风/播放音质验收。


最新1.3.1按用户指定的MoodDairy仓库，使用其默认Q版嘉然Diana。源提交872a11c256375b517e9341b6c12e490c8257470e，选用MOC3、纹理、物理、待机/微笑/抱抱动作，全部Git blob及SHA256核对。没有迁移Android/Kotlin、日记、后端、账号或聊天业务。原画/Live2D作者为木果阿木果：[原作者发布页](https://www.bilibili.com/video/BV1FZ4y1F7HH/)，署名也见journey-ad原发布脚本说明。公开网站再分发许可未独立核验，不把脚本GPL误当模型许可。来源审计见mood-avatar-source-audit.json。
