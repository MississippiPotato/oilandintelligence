# 专业背景、方法交互与M5井段交接

日期：2026-10-30。录井五例1.9.0，其他56例1.2.0，门户1.11.0-preview。

## 本轮完成

用户指定GPT-6.1 Terra Max独立审阅M5。老师原分类明确要求“录井报告自动生成”，本例保留ID、分类/抽取方法和原引擎，以综合观察、形成井段记录和交给测井核查串起教学目的。默认1200—1230m范围汇总三条各自有范围的文字与实际钻时行，再选择十米井段查看覆盖、统计、候选与待核查问题。M1/M3样品配对保留原身份，未给深度的记录保留自己的来源，不拼成全井段结论。修改原文后重新抽取并撤销旧核对；点击报告句子回到原文。

M5解释了测井、自然伽马与电阻率，底部可继续学习W1。该链接属于学习导航，M5和W1仍使用各自教学记录；没有自动把候选深度传入W1。详见[m5知识稿](../../case-src/m5/knowledge.md)、[Terra审阅](m5-terra.md)与[集成初检](m5-integrated-browser.md)。后者保留初检时间及当时尚未构建的边界，最终运行状态以本轮主协议及补充复验为准。

其他56例按八个专业分组分别完成背景、方法各一个交互，共112个。另给m1–m4各补一个背景交互。使用共同坐标曲线、频谱、掩膜、交会图、约束可行域、Mohr圆、泵功环、三角配额与三元配方等表达；每例参数、图形、读数和复位对应实际计算。原计算引擎与观测数据保持原字节。

全站界面统一朱红、暖白与深灰；数据类别保留语义色。提供课程/环节路径、三部分导航、原分类技术难度与参考技术、相关案例；同场景实现可互跳。门户同环节清单和老师原样例难度段落做了去重。角落助手关闭时收拢，保留现有对话/历史/模型配置。

## 验收分层

源码及文件检查 **1191项通过**：163份老师原站、导入核心、原引擎和观测材料指纹保持；61例305个运行文件、每例五文件格式、6MiB目录上限、普通脚本语法、静态预览无可执行代码、无远程自动素材及严格构建指纹通过。此项没有操作浏览器。

当前保存的真实Chrome主/分组协议 **851项通过、0项当前失败**：

| 浏览器范围 | 通过 | 记录 |
| --- | ---: | --- |
| 录井五例桌面/实际重算 | 60 | [JSON](browser-core.json) |
| 录井五例390px | 28 | [JSON](browser-mobile.json) |
| 录井五例断网file | 11 | [JSON](browser-offline.json) |
| 录井五例原站导入/刷新/重跑/保存 | 26 | [JSON](browser-import.json) |
| 增强门户与原firstbreak | 14 | [JSON](browser-portal.json) |
| 最终主题/导航与本地助手 | 22 | [JSON](browser-navigation.json) |
| 地质勘察4例 | 60 | [JSON](browser-integrated-geology.json) |
| 地震5例 | 76 | [JSON](browser-integrated-seismic.json) |
| 钻井/测井10例 | 120 | [JSON](browser-integrated-drilling-welllog.json) |
| 固井/完井8例 | 86 | [JSON](browser-integrated-cement-completion.json) |
| 射孔/采油9例 | 96 | [JSON](browser-integrated-perforation-production.json) |
| 修井/增产10例 | 112 | [JSON](browser-integrated-workover-eor.json) |
| 储运5例 | 75 | [JSON](browser-integrated-transport.json) |
| 炼化5例 | 65 | [JSON](browser-integrated-refining.json) |

录井五例分别完成桌面改变条件、390px、断网file、老师原站“添加案例”目录导入、刷新再次运行与实际保存，共15份JSON在downloads/。其他56例分别操作了背景和方法单元；每组另抽查两例的390px、真实当前实验读取、SVG实际坐标缩放和局部滚动。组内结果与来源数值比较见相应MD，未把源代码数值比较计作浏览器通过。

## 发现问题与修订

- 旧共享样式把知识SVG限制为240/280px高，造成图缩小、文字过小。已取消高度上限，并按viewBox宽度保持图内16px文字；窄屏局部滚动。最终组内截图与实际getScreenCTM检查复验。
- G1红光选项标签修正；W1长标题切换按钮改为换行；G1浅色导语改为深灰；去掉与章节避让重复的全局scroll-padding。
- 校正检查脚本只接受ready、实际页面可返回done/complete/completed的问题；对局部滚动检查使用真实滚动祖先。初次协议错误保留为尝试，未计入当前通过。
- 清理新增交互中面向读者的CaseInspect/CaseEngine和反复真值排除式说明，保留专业术语、单位、数据先后及计算来源。
- 多组并行Chrome曾遇资源压力和Live2D上下文异常，改为分批复验；未改vendor或吞异常。该次观察保存在组报告，独立助手冒烟与导航复验单列记录。

## 当前范围

56例已验证HTTP背景/方法操作及分组样本的窄屏/当前输入读取；没有逐例重做全部56例的老师原站导入、断网与下载。实体手机、在线模型、语音与多模态API未在本轮新测。M5当前提供随包前例快照与可编辑原文；不提供外部前例JSON自动导入或向W1实时传输。历史报告与未成功尝试保留，不扩大旧验收结论。

## 成品

- 五例独立包：dist/原案例ID-1.9.0.zip。
- [五例合集](../../dist/s17-mudlogging-five-1.9.0.zip)。
- [61例合集](../../dist/s17-all-61-interactive-2026-10-30.zip)。
- [完整静态站点](../../dist/s17-site-interactive-2026-10-30.zip)。
- [知识、审阅及验收资料](../../dist/s17-interactive-review-2026-10-30.zip)。

源码检查见source-checks.json，当前源/浏览器记录核对见verification.json，运行文件指纹见runtime-lock.json，ZIP逐成员验证见package-lock.json。
