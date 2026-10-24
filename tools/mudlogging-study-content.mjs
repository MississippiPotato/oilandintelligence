import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {flowOverview,flowRuntime} from './case-flowcharts.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const context=vm.createContext({});
for(const p of ['shared/math.js','shared/mudlogging-study.js','case-src/m1/images.js','case-src/m1/engine.js','case-src/m3/engine.js','case-src/m2/engine.js','case-src/m2/data.js','case-src/m5/engine.js','case-src/m5/data.js'])vm.runInContext(read(p),context);
const uri=(p,mime='image/jpeg')=>'data:'+mime+';base64,'+fs.readFileSync(path.join(root,p)).toString('base64');
// Encode observation pixels directly as PNG, without opening or transforming a source photograph.
function png(im){const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});const chunk=(name,data)=>{const b=Buffer.from(name),c=Buffer.concat([b,data]);let crc=0xffffffff;for(const v of c)crc=table[(crc^v)&255]^(crc>>>8);const h=Buffer.alloc(4),t=Buffer.alloc(4);h.writeUInt32BE(data.length);t.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([h,c,t]);};const ih=Buffer.alloc(13);ih.writeUInt32BE(im.width);ih.writeUInt32BE(im.height,4);ih[8]=8;ih[9]=6;const stride=im.width*4,raw=Buffer.alloc((stride+1)*im.height);for(let y=0;y<im.height;y++)Buffer.from(im.pixels.slice(y*stride,(y+1)*stride)).copy(raw,y*(stride+1)+1);return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64');}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=s=>'<p>'+s+'</p>',H=s=>'<h4>'+s+'</h4>',A=(s,u)=>'<a href="'+u+'" target="_blank" rel="noopener">'+s+'</a>';
const note=(a,b)=>'<aside class="knowledge-example"><b>'+a+'</b>'+P(b)+'</aside>';
const select=(key,label,opts,value)=>'<label>'+label+' <select disabled data-study-key="'+key+'">'+opts.map(([k,v])=>'<option value="'+k+'" '+(k===value?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
const range=(key,label,min,max,value,step=1)=>'<label>'+label+' <input disabled data-study-key="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';
function widget(type,data,controls,title){const meta=JSON.stringify(data,(key,value)=>['url','white','uv'].includes(key)?undefined:value);return '<figure class="study-widget" data-study-widget="'+type+'" data-study="'+encodeURIComponent(meta)+'"><div class="study-widget-head"><span>观察与计算</span><h4>'+title+'</h4></div><div class="study-controls">'+controls+'</div><div data-study-output>'+context.S17Study.views[type](data,data.initial??{})+'</div></figure>';}
const core=json('data/study/core-features.json');core.forEach(r=>r.url=uri(r.path));
const head=json('data/real/pangaea-headspace.json'),sorted=head.rows.map(r=>r.CH4_ppmv).sort((a,b)=>a-b),median=(sorted[30]+sorted[31])/2;
const usrop=json('data/real/usrop-f15-subset.json');
const calcite=json('data/real/calcite-visible-uv.json');calcite.images.forEach(r=>r.url=uri('data/study/calcite-'+r.key+'.jpg'));
const observed=context.M2Data.generate(17,{pause:true}).observations,rows=observed.rows.filter(r=>r.time_s<=3600).map(r=>[r.time_s,r.gas,r.flow,r.depthMD_m]);
const peak=rows.reduce((best,r,i)=>r[1]>rows[best][1]?i:best,0),gasData={rows,operations:observed.operations.filter(r=>r.start_s<3600),peak,initial:{row:peak,volume:12}};
const pair=context.S17Images.sample(17,{},1).observations,mask=context.M3Core.prepare(pair).roi,runs=[];for(let i=0;i<mask.length;i++)if(mask[i]){const start=i;while(i+1<mask.length&&mask[i+1])i++;runs.push([start,i-start+1]);}
const nb=context.M5Core.train(context.M5Data);
const names={m1:'岩屑岩性识别',m2:'气测异常解释',m3:'荧光图像判读',m4:'钻时响应分段',m5:'录井报告整理'};
const stages=[['井底破岩','钻头破碎岩石，钻井液从钻杆内流出。记录钻压、转速与钻速，形成钻进参数。'],['环空返出','钻井液沿钻杆外侧与井壁之间上返，携带岩屑与气体。地面接收的信息对应更早的井下活动。'],['筛分与取样','振动筛分离固体，清洗并登记岩样；拍摄外观，记录采样身份与归位井段。'],['检测与对照','返出液提取气体形成气测曲线；岩样做白光与紫外观察。各记录的单位、时间和样品身份要能对应。'],['解释与记录','把图像、曲线和日志联系起来，提出有依据的候选，逐项核对后整理报告。']];
const field=scene=>widget('field',{scene,url:uri('data/study/mudlogging-circulation.webp','image/webp'),stages:stages.map((v,j)=>j!==3?v:[v[0],{m1:'清洗后的岩屑在地面工作台拍摄白光照片；用样品编号把轮廓、特征和岩性候选连回同一份样品。',m2:'地面脱气器从返出液提取气体，检测总气与组分。将气测曲线、泵量和工况放在同一时间轴上，再回查来源。',m3:'同一份岩样在地面工作台进行白光与紫外观察；配对身份、曝光和参考片决定两幅图是否可以逐像素比较。',m4:'地面记录系统保存钻压、转速、钻速与井深；把这些参数对齐，再检查操作条件变化对钻时响应的影响。',m5:v[1]}[scene]]),initial:{stage:{m1:2,m2:3,m3:3,m4:0,m5:4}[scene]}},'','地上与地下：'+names[scene]+'的资料从哪里来');
const creditCore=P('照片：Fatimah Alzubaidi (2021)，原岩芯托盘来自 Geological Survey of South Australia，'+A('Mendeley Lithology dataset V1','https://data.mendeley.com/datasets/b6rj29mrss/1')+'，CC BY 4.0。六张原 JPEG 保留在离线包，图块实际覆盖 2×2 cm。');
const creditGas=P('实测来源：Strasser, Michael et al. (2025)，'+A('PANGAEA · IODP386-M0091D','https://doi.org/10.1594/PANGAEA.975497')+'，CC BY 4.0。保留全部 62 条及平行记录。这里是回收沉积物的顶空气体，先认识浓度、组分和采样身份；下一节才讨论循环气测的时间对应。');
const creditUV=P('照片：Herbert Art Gallery and Museum, Coventry，经 Wikimedia Commons 发布，'+A('可见光','https://commons.wikimedia.org/wiki/File:Calcite_HAGAM.jpg')+' / '+A('短波 UV','https://commons.wikimedia.org/wiki/File:Calcite_ShortwaveUV_HAGAM.jpg')+' / '+A('长波 UV','https://commons.wikimedia.org/wiki/File:Calcite_LongWaveUV_HAGAM.jpg')+'，CC BY-SA 3.0。此处缩小显示，原始照片与署名保存在离线包中。');
const contents={
m1:[
 ['先看真实岩石：同一种岩性，外观也会变化',
 P('钻头破碎地下岩石，钻井液把碎片带回地面，筛分、清洗后得到<b>岩屑</b>。录井人员观察它们的颜色、颗粒、层理与结构，记录钻过的岩石类型及变化。<b>岩性识别</b>首先是在回答“这是什么岩石”。')+
 P('先看下面的真实岩芯图块：砂岩常能看到颗粒结构，页岩可见细粒或层状外观，灰岩则有不同的碳酸盐结构。照片保留了完整岩石表面的纹理，适合认识这些线索；实际岩屑是更小的碎片，还会遇到混样、泥浆遮盖和颗粒黏连。')+
 widget('core',{rows:core,initial:{row:2,mode:'scatter'}},core.map((r,i)=>'<button disabled class="study-photo-button" type="button" data-study-row="'+i+'">'+`<img src="${r.url}" alt="${{limestone:'灰岩',sandstone:'砂岩',shale:'页岩'}[r.label]}真实照片 ${i%2+1}">`+'<span>'+({limestone:'灰岩',sandstone:'砂岩',shale:'页岩'}[r.label])+' '+(i%2+1)+'</span></button>').join('')+select('mode','观察方式',[['scatter','亮度 × 纹理特征'],['hist','当前照片亮度分布']],'scatter'),'点一张照片，看它在特征图中的位置')+creditCore],
 ['把肉眼线索变成数值，才可以比较相似样品',
 P('颜色相近的两种岩石可能有不同纹理；同一种岩石也会因为光照不同而看起来变色。因此，先分别描述颜色和纹理，再把它们合起来比较。上图的平均亮度由全部像素计算；纹理指标取水平方向相邻像素的亮度差，变化频繁时数值通常更大。')+
 P('散点图中每个点对应一张照片，横坐标表示亮度，纵坐标表示纹理指标。切换直方图，还能看到同样平均亮度背后，是均匀的灰色还是明暗混合。这里展示两个可解释维度；完整实验会先标准化多维特征，再计算近邻距离。')+
 note('从整块岩石过渡到一盘岩屑','整块照片适合认识外观；逐粒识别还需要先确定颗粒轮廓。若两粒黏成一团，后续特征和颗粒数量都会改变。先检查分割，再解释分类。')],
 ['智能方法的价值：逐粒找依据，再汇总一盘样品',
 P('交互实验先从白光像素中找颗粒，计算颜色、纹理和形状特征，再用 <b>kNN 近邻分类</b>查找已有训练样品。选中一粒岩屑后，能回看它的轮廓、具体近邻图片和实际距离，从而判断机器的依据是否合理。')+
 P('试验中保留一条只看颜色的规则作对照。先改变照明或增加泥浆附着，再比较多特征方法是否有帮助；陌生纹理和互相矛盾的近邻会进入复核。')+
 note('接着在交互实验验证三件事','① 泥浆是否让轮廓合并；② 原颗粒与近邻是否相似；③ 同一盘按颗粒数、按可见面积统计，比例为何不同。两种比例分别使用颗粒数和像素面积作分母。')],
 ['沿着采集流程，找回样品来自哪里',
 P('在筛上取到样品时，钻头已经继续钻进。样品身份把照片连回采样记录，迟到归位再把它对应到较早的来源井段。岩性解释需要同时保留这两条线索。')+field('m1')]
],
m2:[
 ['先认识气体记录：浓度、组分与采样位置',
 P('气测录井从返出钻井液中提取气体，连续记录总气和甲烷 C1、乙烷 C2 等组分。总气升高说明地面检测到了变化；要解释其原因，还需要知道它来自哪个时段、当时在做什么。')+
 P('先从一组公开实测资料认识单位与组分。下图按沉积深度排列甲烷浓度，纵轴向下加深。滑动记录，可以同时读到甲烷、乙烷与对应样品身份；切换对数坐标，观察低值和高值如何同时展开。')+
 widget('gas',{rows:head.rows,median,initial:{row:0,mult:2,scale:'log'}},range('row','选中样品记录',0,61,0)+select('scale','浓度坐标',[['log','对数'],['linear','线性']],'log')+range('mult','高值阈值 / 中位数倍数',1,5,2,.25),'同一深度轴上的真实气体浓度')+creditGas],
 ['气峰出现在地面，原因要回查更早的井下活动',
 P('<b>迟到</b>是井下信息随循环到达地面所需的时间。接单根常伴随停泵和短时钻柱移动，起下钻也会改变井内流动条件；与这些操作相关的气体，可能在恢复循环后才出现地面峰。单看峰高难以分清来源。')+
 P('下面使用本例教学井的实际生成观测，气体、泵量和操作日志共用时间轴。回查来源用累计泵量扣除有效体积；停泵时累计量停止增长。选择一个地面时刻，观察其来源位置是否落在较早的操作日志中。')+
 widget('lag',gasData,range('row','地面观测记录',0,rows.length-1,peak)+range('volume','有效运移体积 / m³',6,18,12,.5),'先对齐时钟，再判断气峰与工况的关系')],
 ['智能方法怎样把连续曲线整理成解释候选',
 P('先检测相对背景升高的连续窗口，再计算峰高、峰宽、组分及来源工况特征。学习方法用这些特征寻找训练井中的相似事件；规则基线则按固定条件给候选。它们使用同一批检测窗口，便于比较上下文带来的作用。')+
 note('最有用的交互：固定曲线，只换工况','在“同峰异因”情景中保持气测曲线不变，切换首峰来源工况，观察近邻和候选解释如何变化。随后去“停泵再开”情景改有效体积，看来源时段如何移动。')+
 P('点选事件后一起看气峰、来源日志和近邻依据。教学井有独立评价记录；修改工况后的反事实主要用于看解释变化。')],
 ['从井底到气测房，逐环节核对资料',
 P('总气和组分曲线记录检测结果，泵量控制这里的运移对应，操作日志提供解释上下文。三者连接起来，才能把“发现一个峰”推进到“给出可回查的候选”。')+field('m2')]
],
m3:[
 ['先看真实照片：发光的物质不只有油气',
 P('<b>荧光</b>是物质吸收激发光后发出可见光的现象。录井中，白光帮助辨认岩屑的轮廓和普通外观，紫外光帮助观察显示颜色、强弱和分布。解释时要先认识“哪里发光”，再检查“为什么发光”。')+
 P('下面是同一组真实方解石标本。切换短波与长波紫外光，比较相同位置的外观。矿物也能产生明显显示，所以亮区本身还需要结合样品背景、添加物及进一步检验来解释。')+
 widget('mineral',{images:calcite.images,initial:{light:'shortwave'}},select('light','紫外光条件',[['shortwave','短波 UV'],['longwave','长波 UV']],'shortwave'),'同标本白光 / 紫外对照')+creditUV],
 ['把“看着亮”变成可以重复核对的面积',
 P('图像分析先用白光确定可见岩屑范围，再在相应 UV 图上圈出显示区域。显示面积比例 = 显示像素数 ÷ 可见岩屑像素数。曝光和阈值都会改变结果，需要同时观察原像素、掩膜和分母。')+
 widget('pixel',{white:png(pair.white),uv:png(pair.uv),roi:runs,initial:{exposure:1,threshold:45}},range('exposure','固定像素的曝光倍率',.4,5,1,.1)+range('threshold','原始亮度阈值 / 0–255',10,220,45,1),'调节曝光与阈值，查看区域和直方图')+
 P('本小实验对同一基础教学图像做倍率与 255 截断，白光分割范围保持固定。高曝光时饱和像素增加，原本不同的亮度会变成相同上限；降低阈值则会圈进更多弱显示与背景。')],
 ['学习方法增加了什么：从一个亮度阈值到多特征判断',
 P('单一亮度阈值容易受拍摄条件影响。完整实验同时比较原始阈值、参考片校正阈值与<b>逻辑回归</b>：后者从已标注像素学习颜色、色差和局部对比的组合权重，再逐像素预测显示区域。')+
 note('在交互实验中核对','先看白光与 UV 身份是否一致，再比较三条路线的掩膜；调高曝光，检查饱和损失与面积变化。最后点看模型得分与实际训练损失，理解学习得到的权重怎样参与判断。')+
 P('图像分割解决的是显示区域量化。关于油气来源的解释，继续回到岩样、矿物与其他专业证据。')],
 ['从采样到紫外观察，保留同一份样品身份',
 P('白光与 UV 要能对应到同一样品与同一位置。采样井段、灯源、曝光和配对身份共同决定两幅图是否可以比较。真实馆藏照片用于认识现象，可控教学图用于逐像素运算。')+field('m3')]
],
m4:[
 ['先读真实钻进记录：沿同一井深比较三个量',
 P('<b>机械钻速 ROP</b>以 m/h 表示单位时间的进尺；<b>钻时</b>以 min/m 表示单位进尺耗时。有效钻进时 ROP = 60 ÷ 钻时，例如 30 m/h 对应 2 min/m。读钻时还要看钻压 WOB、转速 RPM 等操作条件。')+
 P('下图来自 USROP 的 15/9-F-15 井。三个轨道共用向下加深的井深轴，选中一条记录，就能同时核对它的钻速、钻压与转速。曲线断开的地方保留了采样间隙。')+
 widget('drill',{rows:usrop.rows,initial:{row:120,mode:'tracks'}},range('row','选中原始记录',0,479,120)+select('mode','观察方式',[['tracks','井深对齐的三轨曲线'],['scatter','钻压与钻速散点图']],'tracks'),'同深度、多参数联动观察')+
 P('来源：Andrzej Tunkiel 与 USROP 贡献者，底层 Volve / Equinor，'+A('USROP A 数据','https://github.com/AndrzejTunkiel/USROP')+'，CC BY-NC-SA 4.0。保留 480 条记录及原 CSV 行号；钻压换算为 kN，未补造岩性或界面标签。')],
 ['曲线出现台阶，先问操作条件有没有变化',
 P('钻头加压、转速调整、井底清洁和钻头磨损都可能改变钻速。若钻速变化与钻压变化在同一深度出现，应先核对工况；持续响应变化还需要岩屑等资料解释。')+
 note('用两种图回答不同的问题','三轨曲线帮助定位“变化发生在哪里”；散点图帮助观察“两个量怎样一起变化”。散点上的关联提供检查线索，仍要回到井深轴与操作记录核对。')+
 P('公开数据用于学习真实曲线的读法；工况阶跃实验使用已知条件的教学井，便于单独改变操作因素并比较校正效果。')],
 ['智能方法怎样减少逐点扫描的工作',
 P('完整实验先用独立标定记录学习工况项，比较原始与校正响应；再从训练井学习数值响应中心，最后通过连续性约束将零散点整理为少量候选段。')+
 note('在交互实验里做一次有取舍的分段','先运行“工况阶跃”，对照原始阈值与校正后候选；再运行薄层情景，逐渐增加最小段长。观察边界数量变少时，短区间是否也被合并。')+
 P('模型的价值是整理响应和定位复核区间。候选段需要接着核对原曲线、工况及地质证据；比较方法时同时看命中、漏检与多报。')],
 ['钻进参数在井底形成，在地面记录与解释',
 P('岩屑和气测需要随循环返出，钻进参数则记录钻头和施工的响应。把它们按井段对应后，可以检查多个观察是否支持同一解释。')+field('m4')]
],
m5:[
 ['一份报告怎样把不同观察联系到同一井段',
 P('录井报告将采样描述、连续曲线和操作日志按井段与时间整理，让下一位读者知道钻到了哪里、观察到了什么、解释依据是什么。深度范围、数值单位和否定词共同决定一句话的含义。')+
 P('下方直接使用可编辑的教学原文。模型按字符片段计算类别分数，随后保留深度与否定字段，再形成引用式草稿。把“未见”从草稿中漏掉，观察来源与表述如何发生冲突。')+
 widget('report',{model:nb.model,labels:context.M5Core.labels,text:'1200–1210 m MD，未见荧光',initial:{text:'1200–1210 m MD，未见荧光',draft:'keep'}},'<label class="study-text-label">来源记录 <textarea disabled data-study-key="text" rows="2" maxlength="500">1200–1210 m MD，未见荧光</textarea></label>'+select('draft','草稿处理',[['keep','保留原文含义'],['remove','试着漏掉否定词']],'keep'),'原文 → 分类分数 → 字段 → 草稿')],
 ['分类分流和事实保留，分别解决什么问题',
 P('<b>字符朴素贝叶斯</b>从训练句子学习哪些字符片段更常见于岩性、气测、荧光或工况记录。分类解决资料分流；“见荧光”和“未见荧光”都可能归入荧光类，区别则由否定字段保留。')+
 P('因此，看懂类别柱状图之后，还要回看原文字段。页上 log 分差由实际训练计数计算；改写来源文字时分数会重算。图中深度和否定高亮，用来帮助逐处核对。')+
 note('一个很小的词，也能改变解释','对照固定来源与草稿。来源没变，删掉草稿里的“未”，含义就会反转。分类正确并不自动保证整理出的事实正确。')],
 ['把机器整理的结果，交到可以逐句核查的流程里',
 P('完整实验对多条原始记录分句、分类、抽字段，再组装带来源定位的报告。点选一句草稿，可以回看原文字符范围、实际类别分数、片段贡献及导入的图像或曲线证据。')+
 note('到交互实验完成一次复核','运行默认草稿，选择一句话，核对否定、单位与井段后确认；再改动句子，查看确认状态如何更新。最后下载带来源的 JSON 或 HTML，打开检查同一条引用。')+
 P('智能方法帮助整理、定位和发现冲突；人工核对当前句子与当前来源的含义。记录修改前后的版本，下一位读者才能知道依据如何变化。')],
 ['报告位于流程末端，证据来自前面的每一环',
 P('报告中的岩性、气测和荧光观察各有采样与检测来源。回到这张地上地下流程图，可以逐处追问：这条记录在哪里形成、通过什么方式测得、对应哪个样品或井段。')+field('m5')]
]};
export function decorateKnowledge(scene,k){k.workflowOverview=flowOverview(scene);k.sections=contents[scene].map(([title,html],i)=>({title,navTitle:['先观察材料','理解关系','看懂智能方法','沿流程回查'][i],en:['OBSERVE','UNDERSTAND','METHOD','TRACE'][i],html:(i===0?'<style>'+read('shared/mudlogging-study.css')+'</style>':'')+'<div class="knowledge-text study-lesson" style="font-size:18px;line-height:1.95" data-study-lesson="3">'+html+'</div>'}));return k;}
export const studyRuntime=read('shared/mudlogging-study.js')+'\n'+flowRuntime;
