# 学号17 · 井见录井可视实验室

当前门户 **1.4.0-preview**，五个独立案例 **1.2.0**。本轮按老师11条要求和四路审阅结果，完成四处提示修复、首页包装与五例教学可视化。仍为五个录井必做案例，其他56例和G5未扩展。模型、规则、数据划分与评价口径保持，默认结果已与修改前逐项核对一致。

- [打开增强首页](portal/index.html)：首屏展示录井5/5、真实导入数量、13阶段61候选；m2为主展示入口。
- [本轮图文验收](handoff/teaching-refresh-2026-10-23/acceptance.html)：改动、实际浏览器记录、截图、失败尝试与未验收范围。
- [五例轻量包 1.2.0](dist/s17-mudlogging-cases-only-1.2.0.zip)：只含五个完整案例目录，解压后逐例添加，不含数字人资源。
- [完整交付包 1.4.0-preview](dist/s17-mudlogging-with-assistant-1.4.0-preview.zip)：解压后双击门户或独立案例即可使用。
- [老师原站只读副本](portal-original/index.html)：与老师原文件23项SHA256一致，验收通过其原“添加案例”入口。
- [机器核对](handoff/teaching-delivery-verification.json)：文件一致性与实际浏览器证据分别记录。

## 添加和更新

在老师原站或增强门户点击“＋ 添加案例”，一次选择 `dist/cases/` 下的**一个完整案例文件夹**，待标题和ID填入后“校验并添加”。每例仍只有 `case.json`、`README.txt`、`demo/index.html`、`demo/demo.css`、`demo/demo.js` 五个文件。先解压ZIP，不选cases总目录，不选源码目录。

已有1.1旧包的浏览器不会自动覆盖原记录。首页会标记旧版，并把主入口指向新版独立成品。要在门户中更新，请在案例库移除**自己的旧包**，再用原入口导入1.2目录。注册状态属于当前浏览器和地址；换浏览器或清除存储需重新添加。

本轮实际通过原站连续导入五例、运行、下载JSON、刷新后重算；断网file模式也完成五例导入与刷新。增强门户接受原样firstbreak样例，滑块和刷新正常。原站深层控件的自动化点击曾落到父站标签，下载等待超时；最终采用键盘焦点完成离线HTML下载，失败记录没有删除。

## 五个案例怎么展示

| 案例 | 直接打开 | 本轮主要讲解改进 |
| --- | --- | --- |
| m1 岩屑 | [独立成品](dist/cases/s17-cuttings-lithology/demo/index.html) | 钻头破岩—环空上返—振动筛取样；岩性图例与占比色表统一；100%支持度不再被写成支持度低 |
| m2 气测 | [独立成品](dist/cases/s17-mudgas-context/demo/index.html) | 接单根停泵、起钻抽吸与迟到气峰的机制；固定气峰切工况，候选解释实际改变 |
| m3 荧光 | [独立成品](dist/cases/s17-fluorescence-review/demo/index.html) | 背景先看同一身份的实际白光/UV合成像素，调曝光后带入分割，保留饱和损失 |
| m4 钻时 | [独立成品](dist/cases/s17-drilltime-boundaries/demo/index.html) | 钻头、钻压WOB、转速RPM和泵量Q的作用位置；工况假界面、平滑吞薄层的实际取舍 |
| m5 报告 | [独立成品](dist/cases/s17-evidence-report/demo/index.html) | 实算NB分差、正负片段贡献、BM25分数；原文否定/范围高亮；句子—字段—来源图；改写后旧核验提示撤销 |

每例初访先进入专业背景，导读按钮能直接运行一个代表情景；三部分和逐步图册保留。图示支持局部横向阅读与放大，390px页面没有整页横向溢出。图内示意和实际计算分别标识。

约7分钟路线：说明学号17与录井5/5 → 原站添加m2并刷新 → 同峰异因 → m1颗粒与近邻 → m3曝光 → m4假界面与薄层 → m5回查和改写一句报告。数字人用于简短导学；可以收起角色，手机默认小入口。

## 前端与数据

默认演示是纯前端、自包含、普通IIFE脚本。直接双击案例或门户可离线使用；本地HTTP服务仅用于开发预览。五例独立运行，m5可显式导入前四例的证据JSON，也有标明来源的构建期计算快照。

默认评价使用明示教学合成数据，推理不接收评价真值。另有带署名和许可的公开岩芯、顶空气体、USROP钻进参数，以及[真实矿物白光/UV对照](portal/reference/fluorescence.html)。它们保留不同井、单位和深度基准，不冒充岩屑分类、油气来源或地层真值成绩。来源详见 [data/real/ATTRIBUTION.txt](data/real/ATTRIBUTION.txt) 和 [来源审计](handoff/real-data-source-audit.md)。

## 向导

沿用MoodDairy同款Q版嘉然Diana，本地资源、待机/微笑/抱抱动作与本地导航保留。角色可收起或展开；手机默认收起，减少遮挡。模型连接仍为可选火山方舟文字、图片、音频理解与文字输出，浏览器/系统TTS负责可选朗读。Key只在当前页面内存填写，刷新需重新输入。

本轮没有新增付费API请求。以前的真实调用证据见 [HTTP调用记录](handoff/ark-live-api.json) 和 [浏览器调用记录](handoff/ark-browser-live.json)，本轮只核对适配器/媒体代码未变并实测本地导航。未接入原生实时语音与视频入口。

角色作者木果阿木果和仓库来源已追溯，[署名说明](portal/assets/live2d/ATTRIBUTION.txt)保留；公开再分发许可仍未独立核验，所以完整包继续标为本地预览版。

## 开发与复核

Node.js，无生产依赖，无需npm install：

```powershell
npm run build
npm test
npm run verify-delivery
npm run verify-guide
npm run package
npm run serve
```

build重新构建五例及真实算法生成的上游快照；test运行37项既有计算/分组/来源/分母检查，**这些不是浏览器通过**。verify-delivery/verify-guide核对当前成品、实际持久包、默认指标与浏览器记录。package生成本次1.4预览包和五个1.2独立ZIP，保留旧版ZIP。serve只绑定127.0.0.1:8755。

当前浏览器专项记录：教学交互75项、首页15项、原站HTTP/firstbreak44项、file离线62项，另有角色收起和旧包升级提示记录。专项内容可能交叠，不累加为独立验收总数，也不换算教师评分。最终图文说明包含本轮限制、截图与失败尝试。

## 历史与边界

[原审阅报告](handoff/review-2026-10-23/index.html)是修改前快照；本轮修复映射以新验收页为准。修改前源码与机器记录在 `handoff/teaching-refresh-2026-10-23/before/`，旧1.1案例包和1.3.1门户包保留。`saphirv3-main/`仅作组织交互参考，未迁移无关业务。

未验收：其他浏览器、实体手机与真实麦克风/听感、本轮整个浏览器进程关闭重开后的持久性、现场预测性能、真实配对WL/UV评价。已有刷新验证不替代整进程重开。当前显示面积、候选响应段和报告草稿不能直接当作含油饱和度、真实岩性或正式现场报告。
