# 录井专题：从井底到地面的共享场景

本组件只挂在增强门户 `#/stage/mudlogging`，插入原专题 main 的 `.page-head` 后、原筛选和案例列表前。它不替换 m1–m5，也不修改任何既有案例引擎或老师原门户。

## 接线与单独构建

门户 index 由主会话增加两条普通静态引用，轻量脚本放在 shell 与 S17Course 可用之后：

```html
<link rel="stylesheet" href="assets/s17-mudlogging-stage.css?v=20261030-stage">
<script src="assets/s17-mudlogging-stage.js?v=20261030-stage"></script>
```

不需要在 index 引用三维重包或vendor模块。轻量层捕获 `document.currentScript.src`，据此生成 `s17-mudlogging-3d.js` 的同目录绝对URL并保留查询参数。接近视口的 IntersectionObserver 发出信号之后，才插入普通 script 加载重包；重包是自包含IIFE，不在运行时发起ESM import，适用于 `file://`。

只构建本组件：

```powershell
node tools/build-mudlogging-3d.mjs
node case-src/mudlogging-stage/verify.mjs
```

供新站构建入口导入：

```js
import { buildMudlogging3D } from './build-mudlogging-3d.mjs';
const report = await buildMudlogging3D({ reportDir: 'handoff/site-upgrade-2026-10-30' });
```

导入构建模块不自动执行。函数返回构建报告，并在指定 reportDir 写 `mudlogging-3d-build.json`。输出只包括本组件的轻量JS、场景IIFE、CSS与MIT许可副本，没有触发全站构建。轻量脚本约39KB，重包约550KB，具体字节数和SHA-256以该报告为准。

## 源文件及边界

| 文件 | 作用 |
|---|---|
| `transport.js` | 无DOM的教学运移模型，复用传入的原M2Core体积累计／来源／到达函数 |
| `source.js` | 只在录井路由挂载、控件、二维剖面、双时钟、惰性加载、可见性与生命周期 |
| `scene.js` | Three.js ESM源，自行编写的地层切面、井筒、钻架、管线和五类地面对象 |
| `stage.css` | 作用域限定于 `.ms-stage` 的朱红／暖白样式与窄屏局部滚动 |
| `verify.mjs` | 原引擎下的独立数字检查，输出本目录 `numerical-checks.json` |

Three.js为root提供的官方原样r180：`portal/assets/vendor/three-r180/three.module.js` 与 `three.core.js`。scene命名导入该模块，由esbuild@0.27.3打包；不依赖npm three，不运行时请求CDN，不使用外部模型、纹理或生成图片。交互旋转、捏合和缩放控制自行实现，仅绑定本canvas。MIT原许可复制到 `portal/assets/vendor/THREE-LICENSE.txt`。

构建时在轻量IIFE前原样拼入 `case-src/m2/engine.js`，并检查原源全文仍在输出内。没有改写或裁剪M2Core的累计泵量与平台反查规则。既有M2Core原文件本身保持不变。

## 五个阶段与两只时钟

一份教学观察 `TEACHING-T17` 从井底、环空、筛分、检测到整理记录。前三段用金色样品标记；岩屑在地面走白光／UV观察，气体另走脱气与组分检测，钻参是直接记录支路。进入记录阶段后，岩屑留在观察台，移动的朱红方块明确代表资料流转。

运输仅作理想随流体模型，位置按有效推进体积映射到示意路径。实际岩屑有滑移、气体有混合与额外输气延迟，设备与地层尺寸没有实测比例。不能把该场景用于精确地层定位。

| 参数 | 数值与单位 |
|---|---|
| 固定来源 | 120 s；教学MD约1200.72 m |
| 有效运移体积 | 12 m³ |
| 正常排量 | 0.025 m³/s，即25 L/s |
| 停泵情景 | 300≤t＜480 s置Q＝0，随后恢复 |
| 正常到达 | 600 s；迟到600−120＝480 s |
| 停泵后到达 | 780 s；迟到780−120＝660 s |
| 地面分镜时长 | 筛分45 s、观察90 s、整理60 s，均为教学安排 |

来源时刻累计量为3 m³，再推进12 m³即到达。两条时间轴连接固定来源和较晚地面到达；下方泵量曲线由实际原M2Core累计显示，停泵形成平台。选择停泵情景不等于暂停观看。暂停回放只固定当前观看时刻，不修改情景中的Q(t)。默认普通运动偏好在可见时播放，减少动态效果偏好默认静态；播放速度为每实际秒24个教学秒。

四个镜头为全景、携屑返出、地面检测、记录解释。阶段定位可以跟随镜头；用户拖动、手选镜头或定位对象后，取消自动跟随。五对象定位轻微抬升，并用材质与缓动镜头聚焦，未添加红框或覆盖模型的文字标签。m1–m5入口优先沿用 `S17Course.href`，缺失时回退到相应 `#/scene/m*`。

## 状态与可验收API

```js
S17MudStage.snapshot();
S17MudStage.setScenario('pause');
S17MudStage.seek(300);
S17MudStage.seek(450);
S17MudStage.setCamera('overview'); // return / surface / interpret
S17MudStage.selectObject('m3');
S17MudStage.play();
S17MudStage.pause();
S17MudStage.reset();
S17MudStage.setView('2d');        // 或3d
S17MudStage.dispose();
S17MudStage.mount(document);     // 仍要求当前为录井路由
```

`snapshot().transport`包含实际 `time_s`、`flow_m3_s`、`cumulativeVolume_m3`、`transportedVolume_m3`、`transportProgress`、`arrivalTime_s`、`sourceReplay_s`、阶段及标记语义。顶层还保留这些数值，附加选择对象、相机、请求播放与实际播放、可见性、reduced motion、渲染模式和资源生命周期计数。

host的 `data-ms-state` 保存最近一次实际绘制状态，同时提供 `data-ms-time/phase/scenario/flow/transport-progress/renderer/visible/playing/raf`。`snapshot().scene`显示实际相机位置、标记坐标、帧数、绘制调用、GPU几何／纹理计数和释放计数。无自制图片纹理，但阴影会分配GPU纹理，接口没有把它们报成0。

## 回退与释放

WebGL不可用、上下文丢失或重包未能载入时，保留相同阶段、对象、时间轴和体积计算的二维剖面。局部时间图与二维剖面可横向滚动。桌面渲染窗口400px高，≤700px窄屏300px高。

源层只有一个requestAnimationFrame链；场景本身没有独立循环。离屏、后台或卸载会取消帧请求，重新可见时重置帧时间，避免补跳。暂停时只为尚未结束的镜头或抬升缓动申请短期帧。背景阴影不每帧重算，只在初始化与对象抬升时更新。像素比上限1.5。

路由移除时断开两个IntersectionObserver、媒体与可见性监听，取消帧，释放场景；场景释放所有自有几何、材质、阴影map、ResizeObserver、pointer/wheel/keyboard监听、renderer及WebGL上下文，移除canvas。创建中途失败也走同样清理。重包只缓存一份代码，路由反复进入会新建场景，不积累旧GPU上下文。Live2D使用独立canvas和自己的API，本组件不读写PIXI或Live2D全局状态。

手动 `dispose()` 暂停本路由的自动重挂载，直到下一次hash变化或显式mount。正常路由离开自动释放，回到专题自动重建。

## 已核查与待验收

源码语法、Three r180命名导入、普通IIFE构建和原M2Core全文保留已核查；8项数字检查通过，包括600/780 s到达、300与450 s同体积7.5 m³且同进度0.375、480 s恢复后的左区间积分、五阶段、守恒、负累计量返回null以及平台反查取最早时刻。数值检查不是浏览器验收。

桌面视觉、390px、四镜头、点击／拖动／捏合、真实播放暂停、减少动态效果、强制无WebGL、断网file、离屏／后台、往返路由及Live2D同时开启的浏览器检查由root统一调度。本分工未将这些路径标记通过。构建报告的 `browserAcceptanceClaimed` 固定为false，待主会话另记浏览器证据。
