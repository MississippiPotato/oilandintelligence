# 录井3D、检索与四例补齐 · 2026-10-30

当前门户1.12.0-preview：保留13阶段、61个原场景及其名称/ID，65个自制案例，另计老师样例1例。原录井五例1.9.0、其他56例1.2.0；新增四例1.0.0。

## 已完成

- 录井专题共用一套本地Three.js r180井场，四镜头、拖动旋转、对象聚焦、五个原案例入口、播放/暂停/复位、分镜与来源/到达时间图。正常600s到达，300–480s停泵后780s到达；停泵300/450s累计量同为7.5m³，进度同为0.375。
- 全局检索覆盖65例和313条自制章节，另含老师样例及5章。快捷键、上下选择、Esc焦点返回、深链刷新、真实标题定位、同ID导入、隐藏/恢复已实际操作。
- 首页只载入轻目录；正文按caseId加载，演示iframe在点击示范后创建，重资源首次打开助手再请求；老师原模块示范仍是模块。
- 四个新例：构造闭合与溢出、候凝强度与等待时间、验封与温漂、GR–CCL射孔深度校正，分别绑定g3/c1/co3/p1，保留原默认案例。

## 证据分层

| 类别 | 结果 | 范围 |
|---|---:|---|
| 源码/文件契约 | 1167/0 | 163保护文件、65例325文件、五文件/6MiB、目录/索引/普通脚本 |
| 四例实际Chrome | 216/0 | 4×桌面/390/file断网/老师导入刷新，20份实际JSON核对20/20 |
| UI-01实际复验 | 7/0 | 只重验c1手机图例与44px助手入口，其他16个包文件不变 |
| actual_Chrome_search | 12/0 | browser-search.json |
| actual_Chrome_loader_races_retry_and_teacher_module | 8/0 | browser-loader.json |
| actual_Chrome_existing_five_plus_two_deferred_path_regression | 33/0 | browser-regression.json |
| actual_Chrome_3D_transport_lifecycle | 22/0 | browser-stage.json |
| actual_Chrome_offline_portal_3D_search_and_forced_WebGL_fallback | 7/0 | browser-offline-stage.json |
| actual_Chrome_five_SVG_storyboard | 9/0 | browser-storyboard.json |
| actual_Chrome_extracted_offline_site_smoke | 9/0 | browser-packaged-site.json |
| 上传覆盖/隐藏恢复 | 8/0 | 实际添加目录、确认移除、刷新和检索重建 |

四例独立新手审阅的8项主问题均已修，详见[novice-review.md](novice-review.md)。数值检查使用各源码中的verify/checks脚本，真实预测与独立评价分别执行。

## 性能记录与验收边界

原冻结入口JS18,436,693B；当前源码启动JS634244B（619.4KiB）。固定4Mbps/100ms/CPU4倍降速的五次实验：LCP中位42,556→2,472ms，最大44,628→3,656ms；首屏正文/3D/实际Live2D请求每次9→0。搜索结果帧中位51.1ms、最大227.4ms，应用DOM写入中位22.4ms，二者分别记录。最慢LCP≤3500ms、所有搜索帧≤50ms两项未达原目标；用户随后明确放宽性能门槛，未追加替换轮。最终CSS合并、隐藏过滤和小界面修复发生在冻结后，未将冻结时序冒充最终版本重测。

- No full 65-case browser all-path claim: four new cases received 16 paths; old five and two other cases received targeted enhanced-portal regression.
- Source checks, numerical checks, original-portal import, offline file tests and timing measurements are separate evidence.
- The two originally strict timing thresholds remain not met in the frozen five-run experiment. The user explicitly relaxed timing requirements.
- In this automation environment document.hidden stayed false even with a second headed tab. Inactive-tab frame/time values stopped in Chrome, but the visibilitychange branch was not exercised; offscreen stopping and route disposal passed actual browser checks.
- Forced WebGL-unavailable fallback was checked by an explicit getContext failure injection, separate from normal working 3D.

后台标签页的额外记录见browser-background-tab.json和browser-background-focus-disabled.json；其document.hidden预期未满足，保留为未触发条件，不计入“通过”汇总。实际inactive期间时间/帧数保持相同。离屏停止、返回恢复、路由释放、再次进入只有一个场景已实际通过。

历史错误保留：原站lead.map真实报错与修复复验、隐藏检索真实错误及复验、回退模式修复；其余*-attempt-selector/inner-navigation/async-read属于浏览器协议选择器或读取时机修订，不能据此称原页面曾通过。CLI延迟请求回调最初错误使用沙盒不存在的Node setTimeout，改为page.waitForTimeout后已通过；会话中断不是网站脚本错误。

## 入口与交付

- [录井3D](../../portal/index.html#/stage/mudlogging) · [全部65例](../../portal/index.html#/cases) · [老师原站](../../portal-original/index.html)
- [四例浏览器详情](browser-variants.md) · [性能对照](performance-comparison.md) · [当前文件契约](source-checks.json)
- 运行npm run build、npm test、npm run test:numeric、npm run accept:upgrade、npm run package。accept操作Chrome；test只做源码检查；verify-delivery核对保存的验收，不替代重新浏览器操作。
- 四例知识稿在case-variants/<caseId>/knowledge.md；离线整站、65例合集、四个独立包与审阅包清单由package-lock.json记录。

## 解压后的整站

额外把离线ZIP解压到新目录，用Chrome断网检查3D、五幅分镜、检索跳转、新例嵌入演示、修改重算和刷新。原先Chrome拦截了沙盒内的本地CSS/JS；增强层现仅对随站目录中的内置案例、仅在file协议下允许同源读取。HTTP嵌入与老师上传沙盒不变。真实失败和修复记录见browser-packaged-site-attempt-local-frame.json及browser-packaged-site.json，选择器拼写错误另存为attempt-selector，不作为页面错误。

