import fs from 'node:fs';import path from 'node:path';
process.chdir(path.resolve(import.meta.dirname,'..'));const dir='handoff/home-and-five-refinement-2026-10-29',v=JSON.parse(fs.readFileSync(dir+'/verification.json','utf8')),source=JSON.parse(fs.readFileSync(dir+'/source-checks.json','utf8'));
const labels={core:'录井五例 · 桌面与实际重算',mobile:'录井五例 · 390px窄屏',offline:'录井五例 · 断网file://',import:'录井五例 · 原站导入／刷新／重跑／保存',portal:'增强门户三例与原firstbreak样例',samples:'其他56例中的g3、pr4、t3、t4',home:'首页导航、目录、搜索及窄屏'};
const md=`# 首页与录井五例改进验收

完成日期：2026-10-30（Asia/Singapore）。工作始于10月29日，保留该日创建的独立交付目录。当前五个录井案例1.8.0，其余56例1.1.1，门户1.10.0-preview。

## 本轮实际完成

- 首页收敛为四个方向、五个录井入口和折叠目录。移除首页中脱离阅读上下文的井底时钟、共同井深等长篇预览，保留其案例内教学内容。
- 按用户指定调用GPT-6.1 Sol Max与GPT-6.1 Terra Max。Sol沿61例及门户的有效渲染入口审阅；Terra审阅叙事，并实际操作Saphir讲义、演示及练习。两份原始审阅见[Sol](sol-audit.md)、[Terra](terra-narrative.md)。
- Sol记录1530条定位记录，包含重复副本，不代表1530个独立问题。其中五例45条首批修改和12条补充均已落地；另同步独立荧光页的动态图注。56例修改进入当前构建。
- 五例改为连续阅读，三部分导航定位并随滚动更新。旧流程大按钮墙替换为各例自己的分流／汇合图与连续计算步骤。
- 使用原有五幅不同画卷，代码划定区域、柔化裁切边缘并拆成图层。选中区抬升、投影与清晰度变化；其他区保持原位并弱化。选择不立即跳走，另设正文入口。没有生成新图。
- m1流程显示实际样品、参考片RGB、轮廓、特征、邻居和两种比例；m2背景控件同步主计算；m3流程显示当前配对像素、得分、掩膜与共同分母；m4显示当前深度的钻速与标定响应；m5原文、字段、分类分流和报告回查连续呈现。
- 文案改为正向解释观察对象、单位、分母和计算动作。修正g3图块分类与图例字段、s2杂乱类、pr2持续值基线、pr4温度残差、t3空可行集和t4参考划分等描述。

## 验收分层

源码／文件检查：${source.passed}项通过。61例305个运行文件齐全，每例保持原5文件目录且小于6MiB；脚本语法、当前版本和被点名的文案检查通过。${v.protectedOriginalAndDataFiles}份原站／观测材料与${v.calculationFilesCompared}份计算／数据文件哈希与原快照相同；老师原导入核心和旧日期验收记录没有改动。

实际Chrome检查：**${v.browserPassed}项通过，0项失败**。下表数字只统计真实浏览器协议。

| 实际浏览器范围 | 通过 | 记录 |
| --- | ---: | --- |
${v.browser.map(b=>`| ${labels[b.name]} | ${b.passed} | [JSON](browser-${b.name}.json) |`).join('\n')}

每个录井案例分别完成桌面条件重算、断网file重新计算、老师原站文件夹导入及刷新后重跑，并实际保存JSON。共保存15份结果，位于[downloads](downloads/)。39张当前截图位于本目录；静态预览另由Chrome实际计算采集，其身份记录在各例flow-preview.json。

画卷动画以浏览器逐帧变换值验收；选择不改变页面滚动位置。鼠标、方向键、正文定位均操作过。390px下四入口、完整纵向分支图和关闭状态的助手入口检查通过。手机验收使用桌面Chrome窄视口。

## 修订与复验

首轮发现m5流程中的评分图撑宽窄屏，已限制容器并复验。此前发现的m2正文定位被导航遮住、m1／m4标定图字号过小、手机流程图横向截断、关闭状态助手遮挡，均已修正并在当前协议中重跑。早期失败记录留在[attempts](attempts/)，最终通过记录在上表。

## 当前范围之外

其余56例本轮完成源内容审阅和重建，浏览器抽查4例；其余52例未重新执行本轮浏览器全路径。在线模型服务、实体手机、麦克风和扬声器没有在本轮新测。现有助手配置与独立记录保留。

默认计算仍沿用已有引擎和数据；预测读取观测，评价在预测完成后单独使用。下载JSON保留原schemaVersion1.0、来源和计算记录。历史报告按原日期保留，不将源码检查写为浏览器通过。

## 交付

- 五例独立包：dist/<原案例ID>-1.8.0.zip。
- 五例合集：dist/s17-mudlogging-five-1.8.0.zip。
- 61例合集：dist/s17-all-61-refined-2026-10-30.zip。
- 完整静态站点：dist/s17-site-refined-2026-10-30.zip。
- 知识稿、截图与审阅记录：dist/s17-refinement-review-2026-10-30.zip。

包在创建后检查CRC及逐成员SHA256；清单见package-lock.json。核对当前文件见[verification.json](verification.json)，运行文件指纹见[runtime-lock.json](runtime-lock.json)。
`;
fs.writeFileSync(dir+'/acceptance.md',md);
const scenes=['m1','m2','m3','m4','m5'];
const gallery=[['首页','home-desktop.png'],...scenes.map(s=>[s+' · 区域选择',s+'-scroll-desktop.png']),...scenes.map(s=>[s+' · 连续流程',s+'-workflow-desktop.png']),['首页 · 390px','home-mobile.png'],...scenes.map(s=>[s+' · 390px流程',s+'-workflow-mobile.png'])];
fs.writeFileSync(dir+'/acceptance.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>首页与录井五例 · 当前验收</title><style>body{margin:0;background:#f7f4ef;color:#302d2a;font:18px/1.8 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:38px 24px 80px}a{color:#a7252c}h1{font-size:34px;line-height:1.4}h2{font-size:25px;margin-top:44px}.facts{display:flex;gap:18px;flex-wrap:wrap}.facts>div{padding:20px 25px;border:1px solid #ded4c9;border-radius:18px;background:#fffcf8}.facts b{font-size:30px;color:#a7252c;display:block}table{width:100%;border-collapse:collapse}td,th{text-align:left;border-bottom:1px solid #e3d9ce;padding:12px 10px}figure{margin:0;padding:15px;border:1px solid #e1d7cd;border-radius:18px;background:#fffdfa}img{width:100%;display:block;border-radius:10px}figcaption{font-size:16px;padding-top:9px}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.wide{grid-column:1/-1}@media(max-width:700px){main{padding:25px 15px}.gallery{grid-template-columns:1fr}h1{font-size:28px}}</style><main><p>井见 / 2026-10-30</p><h1>首页收敛、连续教学与立体画卷</h1><p>当前录井五例1.8.0，其他56例1.1.1。<a href="../../portal/index.html">打开网站</a> · <a href="acceptance.md">详细验收</a> · <a href="sol-audit.md">Sol审阅</a> · <a href="terra-narrative.md">Terra叙事审阅</a></p><div class="facts"><div><b>61</b>源内容审阅与成品构建</div><div><b>${source.passed}</b>源码／文件检查</div><div><b>${v.browserPassed}</b>实际Chrome检查</div><div><b>15</b>实际保存的结果JSON</div></div><h2>浏览器范围</h2><table><tr><th>协议</th><th>通过</th><th>记录</th></tr>${v.browser.map(b=>`<tr><td>${labels[b.name]}</td><td>${b.passed}</td><td><a href="browser-${b.name}.json">JSON</a></td></tr>`).join('')}</table><p>五例分别在1440px、390px、断网file和老师原站导入／刷新／重跑中操作。其余56例浏览器抽查4例，另外52例未重新跑本轮全路径。原站与观测材料、计算与数据文件的字节核对见<a href="verification.json">分层校验</a>。</p><p><a href="../../dist/s17-mudlogging-five-1.8.0.zip">五例合集</a> · <a href="../../dist/s17-all-61-refined-2026-10-30.zip">61例合集</a> · <a href="../../dist/s17-site-refined-2026-10-30.zip">完整静态站点</a> · <a href="../../dist/s17-refinement-review-2026-10-30.zip">知识稿与审阅记录</a></p><h2>当前浏览器截图</h2><div class="gallery">${gallery.map(([title,file],i)=>`<figure class="${i===0?'wide':''}"><a href="${file}"><img src="${file}" loading="lazy" alt="${title}"></a><figcaption>${title} · 点击查看原图</figcaption></figure>`).join('')}</div></main></html>`);
console.log(JSON.stringify({report:dir,sourceChecks:source.passed,browserChecks:v.browserPassed,screenshots:v.screenshots.length}));
