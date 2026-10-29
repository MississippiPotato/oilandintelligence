# 本轮知识交互单元的接线约定

仅用于本轮现有56例补强，不改原计算引擎、数据、老师原站和五文件导入契约。不得生成新图片。

每例新增 `expansion-src/<scene>/concept.js`，普通脚本，结构如下。主会话统一构建与浏览器验证，不自行改共享脚本或dist。

```js
(function(g){
  'use strict';
  const scene='g1';
  function chart(value){ return '<svg viewBox="0 0 640 280">...</svg>'; }
  const backgroundHTML='<section class="ct-widget" data-concept-scene="g1" data-concept-part="background"><h3>先提出一个可观察的问题</h3><p>解释专业对象、坐标和操作。</p><label>有单位的参数<input disabled type="range" ...></label><div data-ct-graphic>'+chart(1)+'</div><p data-ct-result>默认值对应的实际数值。</p></section>';
  const workflowHTML='...相同结构，data-concept-part="workflow"...';
  function mount(root){
    root.querySelectorAll('[data-concept-scene="'+scene+'"]').forEach(host=>{
      if(host.dataset.ctReady)return;
      host.dataset.ctReady='true';
      host.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);
      // 只在本host内绑定，画图和结果来自真实数值计算。
      function draw(){
        // 更新实际图形、文字与计算状态；用于浏览器验收，不是占位计数。
        host.dataset.ctState=JSON.stringify({parameter:1,computedValue:2});
      }
      host.addEventListener('input',draw);host.addEventListener('change',draw);draw();
    });
  }
  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:2,backgroundHTML,workflowHTML,mount};
})(globalThis);
```

- `backgroundAfter`、`workflowAfter`为从0开始的原章节/步骤位置。将交互放在相应知识和动作旁，不悬空追加一个无关演示。
- `backgroundHTML`、`workflowHTML`初始就有可读的实际默认图与读数，原站无脚本静态预览可读。控件初始disabled，mount再启用。
- 脚本注册时可执行纯计算生成图；不要在mount之前读取document、CaseInspect或其他页面状态。主会话会在构建VM中读取两个HTML字段。
- HTML不写inline事件、script、远程自动资源；普通JS随demo.js打包，静态HTML进入case.json。数据来源和单位简洁明确。
- 知识图要表达对象间的关系、共同坐标或数量变化。交互应改变读者正在判断的东西，而不只是切换文字或图片。禁止装饰性的设备拼图、所有案例用同一种条形图/流程框。
- 每例至少一个背景交互、一个流程交互，题材与原案例方法对应。流程优先读取现有CaseInspect数据；无法读取时使用本例有明确数值的局部计算教清该步，保留原主引擎示范。
- 每组至少使用四种适合专业问题的视觉表达（如散点/地图、对齐曲线、频谱、掩膜、截面量测、集合/约束区域、来源对照），不为凑种类画图。
- 主色朱红#B8242A、暖白#F7F4EF、蓝灰#55768B、赭金#B08A4A；数据类别保留有意义的色标。正文18px，图注和标签至少16px。图表窄屏局部滚动，不撑宽整页。
- `.ct-widget`、`.ct-controls`、`.ct-chart`、`.ct-readout`由主会话提供基础样式。局部附加样式必须用 `[data-concept-scene="..."]` 或独立唯一类约束。
- 交互每次重绘都更新host的`data-ct-state`，包含实际输入和实际计算产物，便于自动验收。保留复位入口；用本host内事件，不改全局CaseInspect等接口。
- 不改engine.js、app.js、demo.html、原case.json及共享文件，避免并行冲突。需要接线变更先告知root。
- 报告写入本目录分组MD：每例讲清什么、读者改什么、图与计算如何变化、依据沿用哪条来源、尚未浏览器验证的内容。不能把源码语法检查写为浏览器通过。
