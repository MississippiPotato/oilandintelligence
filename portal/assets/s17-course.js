(function(g){'use strict';
const cases=[
 {scene:'m1',id:'s17-cuttings-lithology',name:'岩屑',question:'这一盘颗粒，哪些像砂岩，哪些该复核？',method:'像素分割 · 纹理与形状 · kNN',action:'改变照明或泥浆附着，点颗粒追到近邻',scope:'识别教学外观，分别统计颗粒数与可见面积',icon:'grains',visualTitle:'滑动对照与像素放大'},
 {scene:'m2',id:'s17-mudgas-context',name:'气测',question:'同样的气峰，为什么解释不同？',method:'累计泵量迟到 · 工况特征 · kNN',action:'固定气峰，切换接单根与起下钻工况',scope:'结合来源时段、组分与工况提出关联解释',icon:'gas',visualTitle:'框选气测曲线'},
 {scene:'m3',id:'s17-fluorescence-review',name:'荧光',question:'发光的地方，就一定是油气吗？',method:'白光/UV配对 · 校正 · 逻辑回归',action:'对照同一样品，调曝光看显示与信息损失',scope:'对照显示掩膜，计算可见荧光的二维面积',icon:'glow',visualTitle:'白光/UV滑动对照'},
 {scene:'m4',id:'s17-drilltime-boundaries',name:'钻时',question:'钻速变了，是工况，还是候选层段？',method:'独立工况标定 · 聚类 · 连续分段',action:'固定地层改变工况，再看平滑如何吞掉薄层',scope:'沿共同深度轴比较相似响应分组与连续井段',icon:'depth',visualTitle:'联动查看钻时曲线'},
 {scene:'m5',id:'s17-evidence-report',name:'录井报告自动生成',question:'把这些观察放回井段，下一步需要核查什么？',method:'字符NB · 字段抽取 · 井段交接',action:'选井段看资料覆盖，核对记录后交给测井',scope:'汇集岩屑、气测、荧光和钻时，形成有来源的井段记录',icon:'report',visualTitle:'井段观察与交接图'}
];
function expectedVersion(c){return '1.9.0';}
function href(c,tab='background'){return g.Cases?.get(c.id)?.version===expectedVersion(c)?'#/scene/'+c.scene+'?case='+c.id+'&tab='+({background:'bg',workflow:'flow',demo:'demo',lab:'demo'}[tab]??'bg'):'../dist/cases/'+c.id+'/demo/index.html#'+(tab==='demo'?'lab':tab);}
g.S17Course={cases,byScene:id=>cases.find(c=>c.scene===id),expectedVersion,href};
})(window);
