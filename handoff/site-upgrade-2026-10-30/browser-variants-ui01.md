# UI-01 固井390px图例入口定点复验

结果：已修并实测通过，7项通过、0项失败，errors=[]。仅复验c1在390×844视口的原遮挡位置；原216项功能协议与20份实际下载记录保留，没有重跑。

图例刻意滚到y≈740px，蓝色“50°C龄期基线”文字位于x57–157、y790.89–811.89；圆入口位于x336–380、y788–832。两者垂直位置重合，但横向完全分开，全部图例文本矩形与入口的交集数为0。52px右留白使三个图例条目自然换行。

实际检查：

- rebuilt c1 reaches actual ready state：通过。
- minimized entry is an accessible 44px circular icon：通过。
- real horizontal wheel still scrolls the local chart：通过。
- legend remains readable beside the icon at the original hazardous scroll position：通过。
- 390px entire page still has no horizontal overflow：通过。
- actual circular entry click expands the assistant panel：通过。
- no uncaught JavaScript error during the targeted path：通过。

实际鼠标横向滚轮使局部图从0滚到400px，再滚回左端；整页document/body宽仍为390px。圆入口实测44×44px，aria-label为“展开井见助手”。真实点击后助手面板可见，data-open=true、data-compact=false；没有发送聊天消息。

两张新截图均已打开目视：圆入口与蓝色基线文字无覆盖，点击后的助手正常展开。

- [原问题位置修复截图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-c1-mobile-ui01-fixed.png>)
- [实际展开助手截图](<G:/可视化导论/5/output/playwright/site-upgrade-variants-c1-mobile-ui01-expanded.png>)

## 构建指纹差异

对比上次216项报告保存的20个五文件指纹：仅以下4份demo.css改变，各增加591字节；其余16份case.json、README.txt、demo/index.html、demo/demo.js的SHA-256逐字节相同。原主计算与engine字节未变；当前CSS定点验证另外记录。

| 案例 | 原CSS SHA-256前12位 | 当前CSS SHA-256前12位 | 字节变化 |
|---|---|---|---:|
| s17x-g3-closure-spill | bbb9753fbaa0 | d33cf1822236 | 42708→43299 |
| s17x-p1-perforation-depth-correlation | 66b92089a9b3 | 6db1d8f73987 | 45636→46227 |
| s17x-c1-cement-woc-strength | aca741bf5472 | 177b1ccc5797 | 42913→43504 |
| s17x-co3-completion-seal-test | aca741bf5472 | 177b1ccc5797 | 42913→43504 |

完整前后SHA-256、几何读数、7条实际检查和测试过程已存入 [browser-variants-ui01.json](<G:/可视化导论/5/handoff/site-upgrade-2026-10-30/browser-variants-ui01.json>)。

测试脚本曾先后误用ready布尔字段、过早读取滚轮结果；已改用实际snapshot().status及scrollLeft条件等待，三次测试设置尝试保留在UI-01报告的attempts，不计入最终7项，也没有当成产品缺陷。

总报告已把UI-01标为fixed_and_retested，整体status=passed；216/0功能结果和20/20下载一致性分母保持。已仅关闭upgrade-variants，会话返回成功；8755服务保持。没有修改任何案例源、共享CSS、构建产物或原站。
