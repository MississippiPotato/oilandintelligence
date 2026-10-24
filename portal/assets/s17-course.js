(function(g){'use strict';
const cases=[
 {scene:'m1',id:'s17-cuttings-lithology',name:'岩屑',question:'这一盘颗粒，哪些像砂岩，哪些该复核？',method:'像素分割 · 纹理与形状 · kNN',action:'改变照明或泥浆附着，点颗粒追到近邻',scope:'识别教学外观，分别统计颗粒数与可见面积',icon:'grains',visualTitle:'滑动对照与像素放大'},
 {scene:'m2',id:'s17-mudgas-context',name:'气测',question:'同样的气峰，为什么解释不同？',method:'累计泵量迟到 · 工况特征 · kNN',action:'固定气峰，切换接单根与起下钻工况',scope:'提供气峰与工况的关联解释候选，保留证据不足',icon:'gas',visualTitle:'框选气测曲线'},
 {scene:'m3',id:'s17-fluorescence-review',name:'荧光',question:'发光的地方，就一定是油气吗？',method:'白光/UV配对 · 校正 · 逻辑回归',action:'对照同一样品，调曝光看显示与信息损失',scope:'分割可见荧光显示，来源需复核，面积不是含油饱和度',icon:'glow',visualTitle:'白光/UV滑动对照'},
 {scene:'m4',id:'s17-drilltime-boundaries',name:'钻时',question:'钻速变了，是工况，还是候选层段？',method:'独立工况标定 · 聚类 · 连续分段',action:'固定地层改变工况，再看平滑如何吞掉薄层',scope:'输出候选响应分段，簇编号不直接等于真实岩性',icon:'depth',visualTitle:'联动查看钻时曲线'},
 {scene:'m5',id:'s17-evidence-report',name:'报告',question:'这句话的数值、否定和范围，依据在哪里？',method:'字符NB · 字段抽取 · 逐句证据',action:'点报告回到来源，改一个字看核验状态撤销',scope:'生成带具体来源的教学草稿，保留冲突与人工核验',icon:'report',visualTitle:'报告证据关系图'}
];
function href(c,tab='background'){return g.Cases?.get(c.id)?.version==='1.5.3'?'#/scene/'+c.scene+'?case='+c.id+'&tab='+({background:'bg',workflow:'flow',demo:'demo',lab:'demo'}[tab]??'bg'):'../dist/cases/'+c.id+'/demo/index.html#'+(tab==='demo'?'lab':tab);}
g.S17Course={cases,byScene:id=>cases.find(c=>c.scene===id),href};
})(window);
