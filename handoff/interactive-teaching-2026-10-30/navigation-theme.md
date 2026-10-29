# 课程主题、场景导航与原始参考信息

本轮提供共享主题与课程位置组件，接线由主任务负责。本文件记录本组件的内容来源、接入方式和验证边界。没有修改 `portal-original/`、`石油勘探开发智能化案例集/`、原始观测或任何计算引擎，也没有构建 `dist/`。

## 新增源码

- `shared/course-theme.css`：统一朱红 `#B8242A`、暖白 `#F7F4EF`、字体、按钮、门户导航反馈、章节序号和旧阅读侧栏。
- `shared/course-compass.css`：课程位置、可选阅读路径、技术难度及相关场景面板的独立样式。
- `shared/course-compass.js`：不依赖网络的普通脚本。独立页补课程位置；增强门户从 `ATLAS` 和 `Cases.bySceneAll()` 恢复场景上下文。
- `tools/course-compass.mjs`：读取老师原始元数据、现有案例清单，生成静态 HTML 和普通运行脚本；此模块本身不写文件、不构建。

## 内容来源与区分

技术难度、难度原因、参考方向、交叉环节均来自只读 `portal-original/assets/data.js` 的 `diff`、`diffWhy`、`refs`、`cross`。参考方向以原有词条显示；对应方法索引单独提供，避免把方向词条冒充外部论文或文献链接。

“同场景的案例”按相同 `sceneId` 分组。当前源码包括 61 个新案例和老师的 `welllog-layer` 样例，所以 `w1` 有两个真实实现：`s17x-w1-log-boundaries`、`welllog-layer`。增强门户的运行时以实际 `Cases.bySceneAll()` 返回值显示案例，包括已接入的其他实现。

“同环节的其他场景”只列同一个 `stageId` 下的其他场景，不混入当前场景，也不称为同场景。“原地图标注的交叉环节”仅恢复 `cross` 中实际列出的环节；未从环节名称擅自推断具体场景关系。

默认继续阅读入口依照本环节的场景顺序，末例回到本环节首例，标签明确为“同环节继续读”。显式后续关系可传 `nextScene`、`nextLabel`。例如 M5 → W1 是主任务明确提供的课程阅读关系；原地图 M5 的 `cross: ['地质勘察']` 仍保留原样。

## 接口与接线

```js
import {
  courseContext,
  courseStyles,
  courseThemeCSS,
  courseCompassCSS,
  courseCompassRuntime,
  appendCourseContext
} from './course-compass.mjs';

const standalone = courseContext(sceneId, manifest, {
  mode: 'standalone',
  portalHref: '../../../../portal/index.html',
  collectionPrefix: '../../../',
  ...(sceneId === 'm5' ? {
    nextScene: 'w1',
    nextLabel: '接着看测井分层'
  } : {})
});
// standalone.html 放入 #background 末尾。
// standalone.runtime 追加到已组装的 demo.js 末尾。
// courseStyles() 追加到所有原样式之后。
// standalone.navigation 仅包含 breadcrumb，可供静态插入；runtime 会去重。

const portal = courseContext(sceneId, manifest, {mode:'portal'});
const background = appendCourseContext(manifest.tabs.background, portal);
// 在末节中追加面板，保留现有四节结构，不伪造第五个专业章节。
```

独立页默认目录结构为 `dist/cases/<id>/demo/index.html` 或 `dist/expansion-cases/<id>/demo/index.html`。回门户使用四层相对路径；跨成品目录使用三层相对路径。老师样例没有单独成品目录，因此独立页中的该入口指向门户真实样例路由。单独移走一个五文件案例包时，该包的图表、方法、计算和背景仍可离线运行；跨包与回门户入口需要保留完整课程目录结构。

运行时检测 `.fx-parts [data-fx-part]`、`.m2-tabs [data-part]`、`nav [data-tab="background"]`。已有三部分导航时，只补“课程总览 / 所属环节 / 当前场景”的课程位置；缺少原生三部分导航才补阅读路径。`courseContext().navigation` 默认也只返回课程位置；若确实需要完整阅读路径，可显式传 `includeReading: true`。

增强门户在既有样式之后加载两个 CSS，在 `shell.js` 之后加载共享 JS：

```html
<link rel="stylesheet" href="../shared/course-theme.css">
<link rel="stylesheet" href="../shared/course-compass.css">
<script src="../shared/course-compass.js"></script>
```

增强门户运行时只处理 `#/scene/...` 中实际存在的 `[data-panel="bg"]`。场景已有静态上下文时会将其替换为门户路由版本；同场景多个实现取自当前 `Cases` 注册表。门户上下文不再重复同环节清单，直接沿用原有 `relatedHTML()` 的同环节和同方法入口；独立页仍列完整同环节场景。老师 W1 样例原来已有“技术难度与参考方向”时，保留其原段落，新面板只补相关案例与交叉环节，避免重复。普通待接入页保留原壳的 `pendingHTML()`。观察器仅更新课程上下文，不写注册表、导入数据或计算状态。

显式 `nextScene` 会写入 `data-course-next-scene` / `data-course-next-label`，门户自动刷新面板时沿用。若门户没有静态上下文，可在共享 JS 前提供明确阅读关系：

```js
window.S17CompassContinuations = {
  m5: {nextScene:'w1', nextLabel:'接着看测井分层'}
};
```

## 色彩边界

`--jade` 是原门户的主要 UI 令牌，本轮将其映射到朱红；另对旧页面写死的绿色导航表面逐项覆盖。未重新定义 `--c-cv`、`--c-ts`、`--c-nlp`、`--c-opt`、`--c-kg`、`--ok`、`--warn`、`--bad`、`--teal`，也未更改 SVG 的地层填色、类别颜色、曲线、预测或真值标记。低/中/高难度、成功/待更新/失败状态保持绿色/金色/红色的语义区别。

窄屏同场景切换按钮允许标题换行，不用 `overflow-x:hidden` 掩盖溢出。独立扩展页原深色页头留下的浅色导语改为深灰，确保白底可读。没有设置全局 `scroll-padding-top`；章节避让继续由各例自己的 `scroll-margin-top` 负责，避免与五例原有 160px 章节边距相加。

门户 `index.html` 的原 favicon 内嵌图标仍需由主任务将品牌绿色 `#276e52` 改为朱红；本组件没有修改门户源。

## 已执行验证与尚未验收

2026-10-30 已执行普通脚本与模块语法检查，及 61 场景 × 独立页/门户两种模式的静态生成检查：

- 122 种生成均可编译。
- 61 场景的 `diffWhy`、`refs`、`cross` 均与老师原始数据逐字一致。
- 最初 1,190 个上下文链接已检查；浏览器发现同环节列表重复后去重，目前静态生成 962 个链接，其中门户 367 个、独立页 595 个。门户均为 `#/` 路由，独立页链接按成品真实位置解析后文件均存在。
- 同场景清单只含同 `sceneId`，同环节清单只含同 `stageId` 并排除当前场景；W1 的两个实现正确分组。
- M5 → W1 显式后续关系及静态属性正确保留。
- 静态 `navigation` 不含重复三部分导航；语义色令牌没有重定义。

这些数字是源码、生成和路径检查。后续实际 Chrome HTTP 抽查单独记录在 `navigation-browser.json` 与 `navigation-browser.md`；没有把静态生成数字算成浏览器覆盖，也没有声称本轮测试了 `file://` 或老师原站导入。
