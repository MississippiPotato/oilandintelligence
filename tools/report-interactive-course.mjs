import fs from'node:fs';import{ROOT,REPORT}from'./interactive-course-contract.mjs';process.chdir(ROOT);
const v=JSON.parse(fs.readFileSync(REPORT+'/verification.json','utf8')),s=JSON.parse(fs.readFileSync(REPORT+'/source-checks.json','utf8'));
const labels={core:'录井五例桌面/实际重算',mobile:'录井五例390px',offline:'录井五例断网file',import:'录井五例原站导入/刷新/重跑/保存',portal:'增强门户与原firstbreak',navigation:'最终主题/导航与本地助手','integrated-geology':'地质勘察4例','integrated-seismic':'地震5例','integrated-drilling-welllog':'钻井/测井10例','integrated-cement-completion':'固井/完井8例','integrated-perforation-production':'射孔/采油9例','integrated-workover-eor':'修井/增产10例','integrated-transport':'储运5例','integrated-refining':'炼化5例'};
const md=`# 专业背景、方法交互与M5井段交接

日期：2026-10-30。录井五例1.9.0，其他56例1.2.0，门户1.11.0-preview。

## 本轮完成

用户指定GPT-6.1 Terra Max独立审阅M5。老师原分类明确要求“录井报告自动生成”，本例保留ID、分类/抽取方法和原引擎，以综合观察、形成井段记录和交给测井核查串起教学目的。默认1200—1230m范围汇总三条各自有范围的文字与实际钻时行，再选择十米井段查看覆盖、统计、候选与待核查问题。M1/M3样品配对保留原身份，未给深度的记录保留自己的来源，不拼成全井段结论。修改原文后重新抽取并撤销旧核对；点击报告句子回到原文。

M5解释了测井、自然伽马与电阻率，底部可继续学习W1。该链接属于学习导航，M5和W1仍使用各自教学记录；没有自动把候选深度传入W1。详见[m5知识稿](../../case-src/m5/knowledge.md)、[Terra审阅](m5-terra.md)与[集成初检](m5-integrated-browser.md)。后者保留初检时间及当时尚未构建的边界，最终运行状态以本轮主协议及补充复验为准。

其他56例按八个专业分组分别完成背景、方法各一个交互，共112个。另给m1–m4各补一个背景交互。使用共同坐标曲线、频谱、掩膜、交会图、约束可行域、Mohr圆、泵功环、三角配额与三元配方等表达；每例参数、图形、读数和复位对应实际计算。原计算引擎与观测数据保持原字节。

全站界面统一朱红、暖白与深灰；数据类别保留语义色。提供课程/环节路径、三部分导航、原分类技术难度与参考技术、相关案例；同场景实现可互跳。门户同环节清单和老师原样例难度段落做了去重。角落助手关闭时收拢，保留现有对话/历史/模型配置。

## 验收分层

源码及文件检查 **${s.passed}项通过**：${v.protectedFiles}份老师原站、导入核心、原引擎和观测材料指纹保持；61例305个运行文件、每例五文件格式、6MiB目录上限、普通脚本语法、静态预览无可执行代码、无远程自动素材及严格构建指纹通过。此项没有操作浏览器。

当前保存的真实Chrome主/分组协议 **${v.browserPassed}项通过、0项当前失败**：

| 浏览器范围 | 通过 | 记录 |
| --- | ---: | --- |
${v.browser.map(b=>`| ${labels[b.name]??b.name} | ${b.passed} | [JSON](browser-${b.name}.json) |`).join('\n')}

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
`;
fs.writeFileSync(REPORT+'/acceptance.md',md);
const gallery=[['M5 · 井段交接流程','m5-workflow-desktop.png'],['M5 · 窄屏','m5-workflow-mobile.png'],['共同深度滑窗','w1-mobile-integrated-workflow.png'],['三元配方','e3-390-caseinspect.png'],['同深度应力','integrated-cement-co3-390.png'],['钻时流程','m4-workflow-desktop.png']].filter(([,p])=>fs.existsSync(REPORT+'/'+p));
fs.writeFileSync(REPORT+'/acceptance.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>知识交互与井段交接 · 验收</title><style>body{margin:0;background:#f7f4ef;color:#302d2a;font:18px/1.8 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:38px 24px 80px}a{color:#b8242a}h1{font-size:34px;line-height:1.4}.facts{display:flex;gap:18px;flex-wrap:wrap}.facts>div{padding:20px;border:1px solid #ded4c9;border-radius:18px;background:#fffdfa}.facts b{font-size:30px;color:#b8242a;display:block}table{width:100%;border-collapse:collapse}td,th{text-align:left;border-bottom:1px solid #e3d9ce;padding:12px}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;padding:15px;border:1px solid #e1d7cd;border-radius:18px;background:#fffdfa}img{width:100%;height:auto;display:block}figcaption{font-size:16px} @media(max-width:700px){main{padding:25px 15px}.gallery{grid-template-columns:1fr}}</style><main><p>井见 / 2026-10-30</p><h1>从观察对象，到交互图，再到下一步判断</h1><p><a href="../../portal/index.html">打开网站</a> · <a href="acceptance.md">完整验收</a> · <a href="m5-terra.md">M5 Terra审阅</a></p><div class="facts"><div><b>61</b>当前案例</div><div><b>112</b>其他56例新增背景/方法单元</div><div><b>${s.passed}</b>源码/文件检查</div><div><b>${v.browserPassed}</b>真实Chrome检查</div></div><p>M5按井段汇集岩屑、气测、荧光和钻时，再将可回查记录及核查问题交给下一步。全站保持原导入契约和离线运行，界面统一朱红与暖白。</p><h2>真实浏览器范围</h2><table><tr><th>范围</th><th>通过</th><th>记录</th></tr>${v.browser.map(b=>`<tr><td>${labels[b.name]??b.name}</td><td>${b.passed}</td><td><a href="browser-${b.name}.json">JSON</a></td></tr>`).join('')}</table><p>其他56例全体覆盖HTTP背景/方法，移动端与当前输入读取按组抽样；全56例的原站/断网全路径未重跑。旧失败与初检边界保留在组报告/attempts，当前状态见<a href="verification.json">verification.json</a>。</p><h2>当前实际截图</h2><div class="gallery">${gallery.map(([t,p])=>`<figure><a href="${p}"><img src="${p}" alt="${t}" loading="lazy"></a><figcaption>${t}</figcaption></figure>`).join('')}</div></main></html>`);
console.log(JSON.stringify({report:REPORT,source:s.passed,browser:v.browserPassed}));
