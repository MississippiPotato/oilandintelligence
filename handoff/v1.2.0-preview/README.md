# 学号17 · 井见录井可视实验室

## 当前门户：Live2D助手预览版

门户为 **1.2.0-preview**，五个独立案例保持 **v1.1.0**。本轮按用户补充要求调整为静态教学页面：不再把额外重训练、跨井/跨设备研究测试、等级模型和复杂工程能力列作必补项，已有真实前端计算继续用于交互展示。范围记录见[scope-update.json](handoff/scope-update.json)。

首页“和井见向导一起看”现在有真正的 **Live2D 桃濑日和（Hiyori Momose）**，模型来自Live2D官方示例，运行库/模型/纹理/三个待机动作均在本地。署名和分立许可见[Live2D说明](portal/assets/live2d/ATTRIBUTION.txt)；没有把这些资源统一宣称为MIT或本作业原创角色。

可以输入“带我看气测”“打开m3流程”“进入录井阶段”“解释当前页”。已导入的案例跳到门户对应页，未导入的案例提供独立成品入口。还可打开[真实白光/UV矿物观察对照页](portal/reference/fluorescence.html)，切换同组方解石在不同灯源下的原始照片。

开放式问答客户端已按火山方舟Responses接口准备，**真实Key调用尚未验证**。展开助手底部“角色、语音与模型状态”，填写自己的Model ID和Key，点“启用本页模型”，再提一个开放式问题。预设为`doubao-seed-2-0-mini-260428`、关闭深度思考、最多700输出token；Key只保留在本页内存，刷新需重新填写。官方地址的无凭据CORS预检已返回允许本机HTTP来源；实际鉴权、账号开通、生成回复仍需真实Key验证。已有代理时也可填代理的Responses地址。公开站共享Key需要由代理保存。

角色、导航和五例仍可离线使用；大模型问答需联网。朗读按钮使用浏览器/系统语音，未接语音大模型，也没有启用麦克风或图片上传。按2026-10-23官方常规在线价格，Mini在≤32K输入档为输入0.20元/百万非音频token、输出2.00元/百万token；以实际调用和账单为准。

新增入口： [带助手的总预览包](dist/s17-mudlogging-with-assistant-1.2.0-preview.zip) · [新增页面核对记录](handoff/assistant-delivery-verification.json)。此前五例完整交付与历史浏览器记录保留；本轮仅增加必要UI检查与接口模拟联调，不把它们写成真实API已接通或模型性能测试。

必做 **m1–m5五个完整案例**已实现，G0–G4教学MVP基础上完成 **v1.1.0：细化教学展示、可选交互增强、三类有署名的公开实测对照**。默认纯前端、自包含、断网可运行；模型、基线、训练和指标实际计算，推理不接收评价真值。默认可评价实验仍用明示的合成数据，公开实测附加区单独标识身份、单位与许可。其他56例没有扩展，G5没有启动。

## 直接打开

- [增强门户](portal/index.html)：学号17五例导航、真实注册状态，保留13阶段61候选场景与原添加入口。
- [老师原门户只读兼容副本](portal-original/index.html)：验收以这个未修改门户的“＋ 添加案例”为准。
- [五例完整传输ZIP v1.1.0](dist/s17-mudlogging-five-cases-1.1.0.zip)：含门户、五例成品/源码、公开数据原始文件/摘录/许可、开发启动包、计算与浏览器证据；不含浏览器profile及saphir无关业务。各例另有单独ZIP，位于dist/；v1.0 ZIP保留为历史版本。
- [v1.1实际验收与限制](handoff/acceptance-v1.1.md)、[机器核对](handoff/suite-delivery-verification.json)、[真实数据来源审计](handoff/real-data-source-audit.md)、[方法与来源](handoff/sources.md)、[答辩路线](handoff/demo-route.md)。

| 必做 | 独立离线演示 | 添加时选择的目录 | 实际方法 |
| --- | --- | --- | --- |
| m1 岩屑岩性自动识别 | [打开](dist/cases/s17-cuttings-lithology/demo/index.html) | dist/cases/s17-cuttings-lithology | 像素连通域、颜色/纹理/形状、加权kNN |
| m2 气测异常智能解释 | [打开](dist/cases/s17-mudgas-context/demo/index.html) | dist/cases/s17-mudgas-context | 累计泵量迟到、事件特征、工况kNN |
| m3 荧光图像智能判读 | [打开](dist/cases/s17-fluorescence-review/demo/index.html) | dist/cases/s17-fluorescence-review | 白光/UV配对、参考校正、像素逻辑回归 |
| m4 钻时曲线地层划分 | [打开](dist/cases/s17-drilltime-boundaries/demo/index.html) | dist/cases/s17-drilltime-boundaries | 独立岭回归标定、k-means、连续分段 |
| m5 录井报告自动生成 | [打开](dist/cases/s17-evidence-report/demo/index.html) | dist/cases/s17-evidence-report | 六类字符NB、字段抽取、约束引述模板与逐句复核 |

先解压传输ZIP。老师门户中点“＋ 添加案例”，**一次选择一个完整案例文件夹**，待标题与ID填入，再“校验并添加”。每例只有case.json、README.txt、demo/index.html、demo/demo.css、demo/demo.js五个文件。不要选cases总目录、源码或ZIP，不要分批上传。三标签依次查看，点击运行，刷新后再次运行。

原站同ID不能直接覆盖：从案例库移除自己的旧包后重导。保存属于当前浏览器和地址，换浏览器/路径或清存储需要重导。原站同场景默认选择首次导入包，原始外壳切标签丢失case参数；工作门户仅修正后者，原站副本保留原行为。

五例均可独立运行，不要求先跑其他例。m5显式接收其他四例下载的证据JSON，也自带由真实算法在构建期产生的快照；界面明确说明快照未在m5页面重新运行上游模型。

## 本次可直接操作的新增内容

| 案例 | 教学展示与可选增强 | 真实数据的使用位置 |
| --- | --- | --- |
| m1 | 同一前景的亮度直方图、可切轴的训练特征散点、拒判/低支持度优先复核 | “真实岩芯外观对照”：六张原始JPEG，实际解码并计算16维整块图像特征；可导出带来源图片的证据 |
| m2 | 15组体积×阈值敏感性，固定已训练模型，点击格子回到主实验 | “公开实测对照”：62条顶空甲烷/乙烷记录，切换通道、对数轴、样品游标和中位数倍数阈值 |
| m3 | 实际梯度权重与掩膜回放、六档曝光实验、明示的虚拟补充观察 | 未伪造真实白光/UV配对；当前配对荧光实验仍是合成教学数据 |
| m4 | 独立标定散点与拟合线、实际聚类中心迭代、原始簇与连续分段对照 | “真实钻进参数探索”：480行USROP实测参数，深度块训练/留出、无监督响应候选及失真，无地层F1 |
| m5 | 实算BM25与词项贡献、来源版本定位、报告逐句差异、工作区JSON保存/恢复 | 显式导入上述公开证据；不同井及不同深度基准分别保存，不拼成同一井；混合报告标为mixed |

真实数据分别来自[USROP](https://github.com/AndrzejTunkiel/USROP)、[PANGAEA](https://doi.org/10.1594/PANGAEA.975497)、[Mendeley Data](https://data.mendeley.com/datasets/b6rj29mrss/1)。USROP为CC BY-NC-SA 4.0，其摘录及派生数据结果保留非商业/相同方式共享许可；另两项CC BY 4.0。详细署名、转换和哈希见[data/real/ATTRIBUTION.txt](data/real/ATTRIBUTION.txt)。

顶空气体来自回收沉积物样品，不能当作地面录井气测时间序列；岩芯图片不是岩屑颗粒盘；实测钻井子集没有独立地层界面真值。这三个区不输出分类准确率或地层F1。m3没有找到本轮可核验且满足原配对条件的真实WL/UV数据，保留合成对照。

## 开发

Node.js，无生产依赖，不需要npm install。在本目录执行：

```powershell
npm run build
npm test
npm run verify-delivery
npm run verify-guide
npm run package
npm run serve
```

build生成五个成品目录、重新计算上游快照并锁定全部25文件；只使用本地已准备数据，不联网。test保留37项既有计算/分组/泄漏/分母/来源/单位/构建检查，**不是浏览器通过**，本轮未新增科学性能实验。verify-delivery核对冻结五例与既有验收；verify-guide核对本轮助手、原门户与五例未改、资源哈希及最少UI记录。package生成带助手的1.2预览总包，保留原1.1总包；单例包仍为1.1。serve绑定127.0.0.1:8755，用Ctrl+C停止；双击案例与门户本地导览不需要服务。浏览器操作流在checks/browser-*.txt；实际日志/截图在output/playwright；v1.1公开数据下载证据在output/exports/v1.1。prepare-*.mjs是开发期素材准备脚本，默认构建不执行联网下载。

| 目录 | 职责 |
| --- | --- |
| 石油勘探开发智能化案例集 / portal-original | 老师原文件 / 只读兼容副本，23文件SHA256锁定 |
| portal | 工作门户，首页增强与切标签保留case参数；旧包与原导航保留 |
| case-src/m1…m5 | 各例算法/数据/教学图/UI；m1/m3共用同源像素 |
| shared | 重复实现后提取的小型数学、状态、表格、下载工具 |
| data/real / research/real-data | 署名、精简数据及原始JPEG；原CSV/顶空文本与上游README用于追溯 |
| dist/cases | 五个可独立上传的完整目录 |
| schemas / prototypes | 共同身份单位/证据协议；G0风险原型，不计完整案例 |
| handoff | 审计、来源、计算和浏览器记录、哈希与未验收范围 |
| saphirv3-main | 教学组织参考，没有迁移无关业务和预存预测 |

## 边界

教学外观、二维显示面积、候选响应界面和引述草稿不能直接认作真实岩性、含油饱和度、储量或油层发现。弱荧光漏检、黏连、域外工况和薄层吞并均保留失败结果。NB与公平关键词基线在36条冻结测试句上同为宏F1=1.0，没有宣称NB更优。

来源版本默认是本页输入修订号。m5现在可下载工作区JSON，刷新后显式加载，恢复输入、草稿、已导入来源、历史与版本下限；恢复后的当前确认仍须重新复核。没有中心化的长期版本服务；同ID/版本内容或来源类型不同，m5拒绝。公开实测探索已经运行，现场预测性能、多浏览器、任意外部曲线导入与任意改写的自动语义评判仍未验收。

早期Chrome原站沙箱连续下载第二个文件曾受多文件下载限制。v1.1报告HTML现在同时嵌入图片、可复核来源与完整证据JSON下载链接；先下载一份HTML，再在打开的离线HTML中提取同一份JSON，已通过原站沙箱实际验证。JSON单独导出入口也保留。首轮G0/G1保存在handoff/g0-g1，v1.0报告在handoff/v1.0.0；当前结论以acceptance-v1.1和suite-delivery-verification为准。

G5在开发方案中指可选增加案例：第一批w4岩性识别、w5测井数据修复、pr1抽油机井工况诊断，使5例变8例；第二批t1管道泄漏智能检测、pr2产量智能预测、d1钻速预测与参数优化，使8例变11例。每新增一例须独立验收。本轮没有实施这些额外场景。
