(function(g){'use strict';
const families=[
['岩屑以{rock}为主','取样盘识别为{rock}外观','样品中的{rock}颗粒较多','本段可见{rock}碎屑','筛上岩样呈{rock}纹理','碎屑成分疑似{rock}','返出岩屑表现为{rock}','本次岩样观察到{rock}','样品外观接近{rock}','该井段记录的岩性候选为{rock}'],
['气测总气升高至{value}归一化单位','总烃读数出现增幅{value}归一化单位','C1组分与气测峰同步','总气曲线出现{value}归一化单位峰值','气体组分记录显示增气','返出气体的总气值为{value}归一化单位','气测通道总烃信号增强','检测到总气读数{value}归一化单位','地面气测记录总气升高至{value}归一化单位','C1与总气的变化值得对照'],
['紫外观察可见局部荧光','样品未见明显荧光','UV图像存在发光区域','荧光显示较弱需要复核','紫外激发下亮斑分布不均','岩屑表面出现荧光显示','本次UV观测未见荧光','发光区域在紫外图中可见','紫外图像可见亮斑','观察记录为未见明显荧光'],
['接单根时停止泥浆泵','起下钻期间暂缓循环','恢复开泵后继续钻进','操作记录为接单根停泵','钻压转速发生工况变化','本时段属于停钻接单根','泵状态由停止转为开启','起下钻结束后恢复循环','工况日志记录接单根停泵','操作人员记录复泵与钻进恢复'],
['建议复核当前解释候选','需要核查来源与单位','证据不足应补充观察','请人工确认这一判断','当前结论待进一步核验','建议对照原始记录再解释','仍需人工复核含义和范围','信息不足需要保留不确定性','请核对邻近资料再作判断','该项应保留待核查意见'],
['本班完成设备清点','交班记录已经整理','样品标签由值班员保管','班次信息为日班','资料已存入本地归档','记录表格采用统一编号','本班备注暂未补充','现场人员完成交接登记','今日班次记录已经归档','标签登记信息已交给下一班']
];
function corpus(){const sets={train:[],validation:[],test:[]};families.forEach((list,label)=>list.forEach((template,family)=>{const split=family<6?'train':family<8?'validation':'test',variants=split==='train'?7:3;for(let i=0;i<variants;i++){const text=template.replaceAll('{rock}',['砂岩','泥岩','灰岩'][i%3]).replaceAll('{value}',(2+i*.7).toFixed(1));sets[split].push({text,label,group:`category${label}-family${family}`,id:`${split}-${label}-${family}-${i}`});}}));return sets;}
function fixture(which='default'){
let lines=['1200—1210 m MD：岩屑以砂岩为主。','1210—1220 m MD：气测总气升高至3.2归一化单位。','1220—1230 m MD：未见明显荧光。','30—60 s：接单根停泵。','1230—1240 m MD：建议复核当前解释候选。','交班记录已经整理。'];let gold=[{category:0,depthRangeMD_m:[1200,1210],rock:'砂岩',negation:false},{category:1,depthRangeMD_m:[1210,1220],gasValue:3.2,gasUnit:'归一化单位',negation:false},{category:2,depthRangeMD_m:[1220,1230],fluorescence:'荧光',negation:true},{category:3,timeRange_s:[30,60],operation:'接单根',negation:false},{category:4,depthRangeMD_m:[1230,1240],negation:false},{category:5,negation:false}];
if(which==='negation'){lines[2]='未见荧光，但气测升高。';gold=[gold[0],gold[1],{category:2,fluorescence:'荧光',negation:true,depthRangeMD_m:null},{category:1,gasValue:null,gasUnit:null,negation:false,depthRangeMD_m:null},...gold.slice(3)];}
if(which==='conflict'){lines.splice(2,0,'1210—1220 m MD：气测总气升高至5.1归一化单位。');gold.splice(2,0,{category:1,depthRangeMD_m:[1210,1220],gasValue:5.1,gasUnit:'归一化单位',negation:false});}
return{text:lines.join('\n'),evaluationTruth:gold,expectedConflictPairs:which==='conflict'?1:0,fixtureId:which,sourceVersion:1};}
g.M5Data={families,corpus,fixture};})(globalThis);
