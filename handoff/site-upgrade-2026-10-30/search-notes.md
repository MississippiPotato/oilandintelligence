# 全站检索组件交接

本次只新增 `portal/assets/s17-search.js` 与 `portal/assets/s17-search.css`。门户引用、构建、浏览器接线和首绘性能验收由根代理负责。本文件记录源组件与 Node VM 验证边界，未把它们当作最终浏览器通过证据。

## 引用与数据

将 CSS 放在门户样式之后、普通 JS 放在 `Cases` / 轻目录数据可用之后。组件也监听 `s17catalogready`，因此支持目录稍后就绪。无新依赖、网络请求、正文加载器调用或查询持久化；已有内置案例从 `S17CaseCatalog` 的元数据建索引。没有轻目录时可回退到当前 `Cases`，仅有 `ATLAS` 时仍能检索阶段和方法。

每次打开以及 `caseimportready` 时合并当前 `Cases.list()` 导入对象，同 ID 导入版替换目录中的标题、摘要、方法与知识小节。安全纯文本扫描只读取已在内存中的导入 `tabs` 字段，跳过脚本、样式、SVG、iframe 等内容，不创建资源元素。搜索输入使用建好的索引，不重复提取导入 HTML。不同 `caseId` 即使 `sceneId` 相同也独立保留；阶段和方法的案例计数按 `caseId` 去重。

老师样例消费独立的 `teacherCases` / `teacherSections`，与 `cases` / `sections` 合并检索，保留 `teacherSample:true` 标记；不会读取老师懒加载 stub 的空 tabs 来覆盖真实轻章节。当前目录分母为 65 个自制案例、313 个自制小节，另有 1 个老师样例、5 个老师小节。案例范围、案例/小节结果、包含老师的阶段/方法结果分别标出老师样例；快照的 `catalogAuthoredCount` 保留目录自制分母，`authoredCaseCount` / `teacherCaseCount` / `extraImportedCaseCount` 是当前可见数。

隐藏名单通过实际 `CaseImport.blockedList()` API 读取，所有目录案例、导入覆盖、章节、阶段/方法 caseIds 均先过滤隐藏 ID，名单签名参与索引缓存有效性判断。现有导入模块的 remove 实际发送 `hashchange`，restore 实际重载页面；搜索在 hashchange 时失效缓存，若弹层打开则立即更新范围与结果，恢复后按当前名单重新索引。等待定位的案例若已被隐藏/移除，`lastNavigation.status` 记为 hidden 并结束等待。没有修改导入模块或其事件协议。

排序使用标题、案例编号、章节名、terms、方法与摘要的不同权重，并支持中文分词和常见中英文方法同义词。环空、迟到、荧光、UV、kNN、nearest neighbor、ridge regression 与案例编号均纳入验证。结果按阶段、案例、知识小节、方法分组；可先选案例，再限定该案例的知识小节。

## 固定测试接口

| 位置 | 选择器 |
| --- | --- |
| 页头按钮 | `#s17-search-open` / `[data-s17-search-open]` |
| 弹层 | `#s17-search-dialog` |
| 输入框 | `#s17-search-input` |
| 结果区 | `#s17-search-results` |
| 单个结果 | `[data-s17-search-result]` |
| 计数状态 | `#s17-search-count` |
| 案例范围 | `#s17-search-case` |
| 知识范围 | `#s17-search-section` |
| 关闭按钮 | `[data-s17-search-close]` |

`S17Search.open()` 打开并将焦点放到输入框；`close()` 清除查询与隐藏结果并返回原焦点。Ctrl / Command + K 打开、Esc 关闭、上下箭头选择、输入框 Enter 打开结果，Tab 焦点限定在弹层。原生选择器保留自己的箭头行为。

`S17Search.search(query, {caseId, sectionId, kind})` 返回 `{query,tokens,groups,counts,total,computeMs}`，只计算结果，不打开弹层，也不将调用参数写为 UI 的 `lastQuery`。省略 options 可进行全站查询；kind 为 `all/stages/cases/sections/methods`。

`S17Search.snapshot()` 返回 `open,lastQuery,renderMs,computeMs,indexMs,resultCount,totalMatches,caseCount,authoredCaseCount,teacherCaseCount,extraImportedCaseCount,catalogAuthoredCount,blockedCount,sectionCount,importedCount,caseId,sectionId,kind,activeIndex,inputCount,indexBuilds,extractedHTMLChars,groups,lastNavigation`。`resultCount` 是当前已写入 DOM 的条数，`totalMatches` 是全部匹配数。结果区同时提供 `data-result-count` 与 `data-render-ms`。

`renderMs` 从真实 input 监听器接到事件，到同步结果 DOM、计数及 active descendant 写完为止；`computeMs` 仅为索引查询计算。真实 input→首绘的 50 ms 验收需在浏览器通过事件与绘制测量完成，不能仅凭该组件计时下结论。目录首次索引耗时单列 `indexMs`，不混入已打开状态的每次输入。

## 导航与 Reader 协议

知识结果使用 `#/scene/<scene>?case=<caseId>&tab=bg|flow&section=<sectionId>`。只有点击或 Enter 选择结果才修改门户 hash。导航保持明确的 caseId，不按 sceneId 猜另一实现。

组件监听 `hashchange`、`s17caseready` 和 `#view` 的内容/ready 属性变化；真实 `main[data-s17-case-id]` 必须与目标案例相同，且 `data-s17-case-ready="true"`。有明确 anchor 时，必须等该 anchor 真正在当前 #view 中出现；不会用旧 `sr-chapter-*` 或 `xl-chapter-*` 代替一个尚未挂载的目录 anchor。随后展开包含的 details，滚动到真实节点并聚焦其中标题。`lastNavigation` 记录 waiting / focused / not-found，未找到目标时在 15 秒后结束等待。

与 Reader 代理对齐的导入锚点为：

- 背景：sectionId `<caseId>:bg:<i>`，anchor `learn-<caseId>-bg-<i>`，对应当前导入 `background.sections[i]`。
- 流程：单一 sectionId `<caseId>:flow`，anchor `learn-<caseId>-flow`；步骤名、role、terms 用于检索，lead/do/effect/trap 提取为临时纯文本摘要。

页头按钮观察 `#view` 重建后注入 `.hdr-in`，同一区域只保留一个，并定位在添加案例按钮前。CSS 在窄屏使用品牌/检索/添加案例三列，导航另占可局部横滚的一行；弹层和结果区限制在视口内。

## 已完成的源组件检查

- `node --check portal/assets/s17-search.js` 通过。
- Node VM 轻目录/导入/legacy fixture：29 项通过。覆盖同 scene 不同 caseId、同 ID 导入覆盖、当前导入章节锚点、旧章节排除、安全纯文本、中英文词项、准确编号、URI 编码、导入/目录/案例 ready 生命周期与 legacy `Cases` / `ATLAS`。内置正文 getter 读取 0，网络调用 0；100 次查询仍只建索引 1 次。
- Node VM 导航协议 facade：10 项通过。未 ready、错误 caseId、缺少真实 canonical anchor、anchor 在当前 #view 之外时均不跳转；满足协议后恰好滚动并聚焦真实标题 1 次，`lastNavigation` 为 focused，保留正确 caseId、sectionId 和 anchor。此检查没有真实布局与浏览器焦点行为。
- 放大纯元数据：96 个案例、768 个章节、240 次查询。索引构建 87.19 ms；查询平均 6.87 ms、P95 11.03 ms、最大 15.34 ms；内置正文 getter 读取 0，网络调用 0，索引构建次数 1。此为 Node VM 计算测量，未包含 DOM 写入或真实浏览器首绘。
- 隐藏名单/老师轻索引后续修复：使用实际生成的 `s17-case-catalog.js` 在 Node VM 检查，32 项通过。确认 65 + 1 案例、313 + 5 小节，老师标记/阶段构成/真实锚点；GR–CCL 案例隐藏前 6 条案例+小节链接、隐藏后 0、恢复后 6；阶段/方法也排除其 caseId；老师可隐藏与恢复；同 ID 导入覆盖不能绕过名单；hashchange 后当前导入覆盖/删除得到更新。所有内置和老师 lazy tabs getter 读取 0、网络调用 0。

`browser-hidden-case.json` 中修复前“隐藏后仍返回 6 条”的真实浏览器失败证据由根代理保留，并由根代理补做此次修复后的浏览器复验。未改写或掩盖原失败，也未宣称上述 Node VM 检查已经完成浏览器复验。本轮后续修复没有继续修改性能外观，既有浏览器性能轮次与其失败边界保持原记录。

最终浏览器尚需根代理核对：门户实际引用、页头重建去重、390 px 无整页溢出、弹层局部滚动、真实输入→首绘、键盘/焦点环、内置与导入知识结果的当前 caseId/anchor 跳转。未启动浏览器，未修改共享源码、build/dist 或原教师门户。
