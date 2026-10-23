# G0 原门户兼容契约审计

审计日期：2026-10-23。范围：学号末两位 17 → `((17−1)%13)+1=4` → 录井 `mudlogging`。本轮只做 G0 / G1 与 m2；不将工程探针、参数预设、m1/m4/m5 风险原型计为完整案例。

原始输入为 `石油勘探开发智能化案例集/`。保留其全部 23 个文件，复制到 `portal-original/`（文件设为只读）及 `portal/`（兼容验收用工作副本）。`handoff/original-lock.json` 逐文件记录 SHA-256 与字节数；计算检查核对三个目录。**本轮没有改门户核心代码，portal 不是已经建成的增强首页。**

从实际执行的 `assets/data.js` 提取到 13 阶段、61 场景，完整清单为 `coverage.json`。必做保留 m1 / m2 / m3 / m4 / m5，方法键依次 cv / ts / cv / ts / nlp。m2 的成品 ID 固定为 `s17-mudgas-context`。

## 实际加载与字段

`index.html` 加载本地 tokens/layout/ui 样式、data.js、registry.js、kit.js、内置案例脚本、case-demo-host.js、case-upload.js、admin.js、shell.js。导入恢复在 shell 渲染前执行。firstbreak 为目录中的独立待导入示例，不因存在文件就认定已注册。

| 接口 | 源码事实 | 实施落点 |
| --- | --- | --- |
| 导入入口 | `case-upload.js` 读取完整文件夹；找到 case.json；不是 ZIP 解压入口 | `dist/cases/s17-mudgas-context/` 一次选齐 |
| ID / 分类 | ID 必须为小写字母数字连字符；已存在 ID 校验报错；场景与方法键必须注册 | m2 / ts；更新时通过案例库移除自己的旧导入再重导 |
| 字段映射 | `toCase()` 白名单映射背景 sections、流程 steps / metrics / fails，忽略额外 visual 等字段；清理 `_` 开头键 | 不依赖开发任务卡中的扩展字段 |
| 背景 | sections 的 html 直接用于背景内容 | 3 张完整 SVG + 第4段数据/边界/来源 |
| 流程 | steps 的文字经渲染转义；metrics.html 可放图解 | 6 个文字步骤引用 S1–S6；metrics.html 放6张逐步图册 |
| 整页宿主 | 相对 script / link 转内联；普通脚本；未引用 JS/CSS 追加执行 | 成品只含 demo.js / demo.css，没有测试/构建脚本 |
| 资源 | 素材可变 data URL；脚本内相对 fetch 不自动改写；basename 兜底 | 数据与生成器打入 demo.js；无 fetch/CDN/API |
| 隔离 | `sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"`，没有 allow-same-origin | 不访问 parent 私有对象与 localStorage；浏览器验收通过 Playwright 外部检查 frame |
| 持久化 | `atlas.casepack.v2` 存完整清单与文件文本/数据；写入失败可能只本次有效 | 导入后测序列化占用、刷新、关闭重开，再点击运行 |
| 大小 | 源码硬上限 6×1024² bytes，1.6×1024² 附近警告 | 成品约83 KB；不是累计配额保证 |
| 同场景多例 | 实际 registry 按导入注册顺序列出；默认选择第一个，shell 支持 `?case=` 与顶部切换器 | **与旧说明“后传自动覆盖展示”的说法有差异**；并存探针时须选择 m2 标题，或使用 `?case=s17-mudgas-context` |
| 切标签后的刷新 | shell 的 setHashQuiet 仅保留 tab，丢失所选 case 参数 | 同场景多例时刷新需重新选择；最终原站验收清理了工程探针，仅保留m2，不修改原版源码 |
| ready | 导入器自动设 ready | 只代表注册状态；不替代本轮实际验收记录 |

## 参考仓库边界

实际复核了 `saphirv3-main/case-002/index.html` 的概念图卡，以及 `assets/v3-case-demo.js` 的归档值展示说明。借鉴“先解释术语、数据站、逐步产物、来源/复核、控制变量”的教学组织，重新实现 SVG、数据、模型和交互。没有迁移试井业务、六标签结构、归档成绩、字体或大块代码。副本附 `REFERENCE_ONLY.txt`。

## 四项风险原型与限缩

`prototypes/index.html` 可以直接运行。计算验证见 `calculation-checks.json`。

| 原型 | 实际执行 | 本轮边界 |
| --- | --- | --- |
| m1 | 读取 RGBA，阈值前景 + 四邻域连通域；两块可见像素面积为25/30，改变像素后结果改变 | 简单不重叠前景；尚无岩性模型/完整案例 |
| m2 | 恒流 V/Q 一致；停泵累计量平台、复泵继续；不足无解；MD 在源时刻插值 | 已进入 m2 完整实现；模型仍是有效体积教学近似 |
| m4 | 在独立同岩性合成标定上拟合一因素 WOB–ROP 响应；工况阶跃校正后不产生边界，固定工况薄层响应保留 | 仅验证混淆风险；还没有计划中的 log 岭回归、多因素与 k-means 全案例，不改称已完成分层 |
| m5 | 按子句保留“未”、深度范围，缺单位不补造；来源同ID/版本不同内容报冲突，改来源使三种核验状态失效 | 简单表达范围；尚无六类 NB / 完整报告工作台；复杂自由文本仍需人工 |

## 共同数据与证据

`schemas/scenario-core.json` 锁定 DEMO-017、1200–1280 m MD 教学井段、秒时基、流量/气体单位、8组父样品/白光UV配对身份与整组切分。图像身份为后续保留，不能当作已有真实样品照片。

`schemas/evidence-v1.json` 保留启动包07协议，版本化为1.0并明确本轮实现子集。m2 导出包括 runConfig、来源ID/不可变版本、自包含曲线与工况/MD片段、模型推断、人工意见、状态、指标和限制。来源可定位不等于语义受支持；未经人工核对的模型推断为 `unchecked`，人工意见冲突则保留 `conflict`。输入或重算使旧确认撤销；历史保留。m1/m3/m4/m5 独立默认 fixture 方案在 scenario-core 中标记未来状态，不要求其他案例先导入。

## 验收口径

源码契约、计算验证、实际浏览器操作分别记录。前两者通过不等于浏览器通过；截图也不代替模型计算证据。最终执行结果、遇到并修复的问题和未执行项见 `acceptance.md`。
