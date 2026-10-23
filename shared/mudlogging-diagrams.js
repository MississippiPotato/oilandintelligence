(function(g){'use strict';
// Inline lesson illustrations. All numbers below are worked teaching examples,
// independent of observations, inference and evaluation in the runnable cases.
const C={ink:'#263d46',muted:'#617983',teal:'#19786e',pale:'#edf5f2',gold:'#bf8b43',sand:'#d6ae6b',mud:'#8495a1',lime:'#91b29e',blue:'#537eab',red:'#b65d50',line:'#d9e3e7'};
const e=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const rect=(x,y,w,h,fill='#fff',stroke=C.line,r=9)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'" stroke="'+stroke+'"/>';
const line=(x,y,X,Y,c=C.line,w=2,dash='')=>'<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" stroke="'+c+'" stroke-width="'+w+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const text=(x,y,s,size=18,c=C.ink,anchor='start',weight=400)=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+c+'" text-anchor="'+anchor+'" font-weight="'+weight+'">'+e(s)+'</text>';
const lines=(x,y,items,size=18,c=C.muted)=>items.map((s,i)=>text(x,y+i*27,s,size,c)).join('');
const circle=(x,y,r,fill,stroke='none',w=1)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+w+'"/>';
const path=(points,c=C.teal,w=3)=>'<polyline points="'+points.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linejoin="round" stroke-linecap="round"/>';
function arrow(x,y,X,Y,c=C.teal){const a=Math.atan2(Y-y,X-x),p=[X-9*Math.cos(a-.45),Y-9*Math.sin(a-.45)],q=[X-9*Math.cos(a+.45),Y-9*Math.sin(a+.45)];return line(x,y,X,Y,c,2)+'<path d="M'+p+' L'+X+','+Y+' L'+q+'" fill="none" stroke="'+c+'" stroke-width="2"/>';}
const d={};
function add(key,n,title,h,body,caption,kind='概念示意'){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 '+h+'" role="img" aria-label="'+e(title)+'" style="display:block;width:100%;height:auto;min-width:760px;max-width:920px;margin:auto"><g font-family="system-ui,Microsoft YaHei,sans-serif">'+body+'</g></svg>';
 d[key]={title,number:n,html:'<figure class="knowledge-figure" data-knowledge-figure="'+key+'" style="margin:24px 0;padding:20px;background:#f7faf9;border:1px solid #dbe6e5;border-radius:12px"><div class="knowledge-figure-title" style="display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;margin-bottom:14px"><span style="color:#19786e;font-size:15px">图 '+n+'</span><b style="font-size:19px">'+title+'</b><span style="font-size:14px;color:#617983">'+kind+'</span></div><div class="knowledge-figure-art" tabindex="0" aria-label="图示可横向滚动" style="max-width:100%;overflow-x:auto">'+svg+'</div><figcaption style="font-size:17px;line-height:1.85;margin-top:14px;color:#506871"><b style="color:#19786e">读图：</b>'+caption+'</figcaption></figure>'};
}
// m1 — collection, rock appearance, proportions and similarity.
{
 let b='';
 const cards=[['井底破岩','钻头切下岩石碎片'],['环空上返','钻井液携带岩屑'],['地面分离','振动筛分出固体'],['采样观察','清洗、编号、辨认']];
 cards.forEach((a,i)=>{const x=8+i*192;b+=rect(x,12,168,156,i===0?'#f7efdf':C.pale)+text(x+14,43,'0'+(i+1)+'  '+a[0],19,C.ink,'start',600)+text(x+14,139,a[1],16,C.muted);if(i<3)b+=arrow(x+174,88,x+187,88);});
 b+=rect(67,61,50,20,C.mud,C.mud,2)+line(92,49,92,61,C.ink,6)+path([[68,85],[78,96],[88,85],[98,96],[108,85],[117,96]],C.ink,3);
 [[60,107],[94,110],[121,107]].forEach(([x,y])=>b+=circle(x,y,4,C.sand));
 b+=arrow(246,112,246,67)+arrow(277,112,277,67)+arrow(308,112,308,67)+line(270,65,270,110,C.blue,6);
 b+=path([[416,78],[519,78],[505,99],[430,99],[416,78]],C.mud,3)+line(444,103,440,115,C.mud,3)+line(494,103,498,115,C.mud,3);
 [[449,69],[478,71],[498,65]].forEach(([x,y])=>b+=circle(x,y,5,C.sand));
 b+=rect(616,64,87,49,'#fff',C.mud,7);[[633,79],[653,97],[678,79],[690,97]].forEach(([x,y],i)=>b+=circle(x,y,6,i%2?C.mud:C.sand));
 b+=arrow(40,196,716,196,C.blue)+text(378,224,'地面收到样品的时刻，比井底破岩的时刻更晚',19,C.blue,'middle')+text(378,253,'按迟到归位到来源井段，再结合采样记录解释。',18,C.muted,'middle');
 add('m1-origin',1,'岩屑从井底到样品盘，经历了什么？',270,b,'顺着箭头看四步。样品盘对应的是更早产生的碎片，记录时要把采样时刻与来源井段联系起来。');
}
{
 let b='';const rocks=[['砂岩','看颗粒、粒度与胶结',C.sand],['泥岩 / 页岩','看细粒、层理与片状结构',C.mud],['灰岩','看晶粒、生物碎屑等结构',C.lime]];
 rocks.forEach((a,i)=>{const x=8+i*252;b+=rect(x,7,236,236,'#fff')+text(x+118,39,a[0],20,C.ink,'middle',600)+rect(x+20,56,196,119,i===0?'#efe0bf':i===1?'#dfe6eb':'#e0ece5','none',8);
 for(let j=0;j<32;j++){const xx=x+32+(j*47%170),yy=70+(j*31%90);if(i===0)b+=circle(xx,yy,3+j%3,'#b88c47');else if(i===1)b+=path([[xx,yy],[xx+21,yy-3],[Math.min(x+211,xx+40),yy]],'#728898',1.6);else b+='<path d="M'+xx+' '+yy+'l9 -6 9 6 -7 10 -11 -3Z" fill="none" stroke="#7b9c88" stroke-width="1.6"/>';}
 b+=text(x+118,205,a[1],16,C.muted,'middle');});
 add('m1-rocks',2,'先看结构，再把颜色放进来一起判断',255,b,'三格画的是典型外观线索。颜色相近时，颗粒感、层理和晶粒结构能提供额外信息；实际鉴定还会结合更多检验。','外观特征示意');
}
{
 let b=rect(8,16,270,222,'#fff')+text(143,49,'同一盘：6粒小颗粒 + 4粒大颗粒',16,C.ink,'middle');
 for(let i=0;i<6;i++)b+=circle(50+(i%3)*80,84+Math.floor(i/3)*40,10,C.sand);
 for(let i=0;i<4;i++)b+=circle(55+i*60,190,Math.sqrt(350),C.mud);
 b+=text(310,48,'按颗粒数：每粒计 1 次',20,C.ink,'start',600)+rect(310,67,410,32,'#e6edf0','none',5)+rect(310,67,246,32,C.sand,'none',5)+text(310,128,'砂岩外观颗粒：6 / 10 = 60%',19,C.gold);
 b+=text(310,172,'按面积：每个可见像素计 1 次',20,C.ink,'start',600)+rect(310,190,410,32,'#e6edf0','none',5)+rect(310,190,123,32,C.sand,'none',5)+text(310,254,'这些小颗粒的总面积约占 30%',19,C.gold);
 add('m1-proportion',3,'为什么同一盘样品会得到 60% 和 30%？',275,b,'金色的6粒都较小：数颗粒时占多数，按可见面积统计却占较少部分。先说明分母，再比较比例。','手算例子');
}
{
 let b=line(74,227,423,227,C.muted)+line(74,227,74,23,C.muted)+text(260,266,'颜色特征 →',18,C.muted,'middle')+text(19,21,'纹理',18,C.muted);
 const points=[[136,74],[166,82],[182,59],[154,108],[154,189],[185,201],[119,206],[330,142],[348,172],[310,187]];
 points.forEach(([x,y],i)=>b+=circle(x,y,7,i<4?C.sand:i<7?C.mud:C.lime));
 [[136,74],[166,82],[154,108]].forEach(([x,y])=>b+=line(195,104,x,y,C.gold,2,'4 4'));
 b+=circle(195,104,10,'#fff',C.ink,3)+text(215,111,'当前颗粒',17)+text(114,42,'砂岩训练颗粒',17,C.gold)+text(100,247,'泥岩',16,C.mud)+text(320,214,'灰岩',16,'#638c74');
 b+=rect(466,24,281,210,C.pale)+lines(486,57,['1  把外观转成数值','2  找距离近的训练颗粒','3  看近邻类别是否一致','4  给候选，或送人工复核'],18)+text(486,206,'点选近邻，可以回看具体样品。',16,C.teal);
 add('m1-neighbors',4,'颜色接近，还可以比较纹理与形状',282,b,'横轴相近的颗粒，纵轴仍可能不同。图中空心圆通过多种特征找到近邻；演示中可直接查看实际训练颗粒与距离。','特征空间示意');
}
// m2 — signal collection, operational context and cumulative pumped volume.
{
 let b='';const a=[['井底','气体进入返出液'],['环空','随循环输送到地面'],['脱气装置','从返出液中提取气体'],['检测仪器','记录总气和组分']];
 a.forEach((s,i)=>{const x=8+192*i;b+=rect(x,16,168,110,i===2?'#f8f0e1':C.pale)+text(x+14,49,s[0],21,C.ink,'start',600)+text(x+14,89,s[1],16,C.muted);if(i<3)b+=arrow(x+173,71,x+187,71);});
 b+=text(24,238,'背景水平',17,C.muted)+line(130,246,733,246,C.line,1,'5 4')+path([[130,247],[200,245],[280,247],[362,245],[420,240],[449,200],[470,159],[491,198],[520,241],[580,246],[660,245],[733,247]],C.teal);
 b+=text(493,181,'气峰',18,C.teal)+text(130,294,'时间 →',18,C.muted)+text(421,294,'先看变化，再联系来源井段与工况。',18,C.muted);
 add('m2-signal',1,'气测曲线怎样从井下信息变成地面记录？',316,b,'上面是信号形成的链条，下面是地面记录。曲线记录的是到达仪器后的响应，来源活动通常发生得更早。');
}
{
 let b='';const curve=y=>path([[260,y],[500,y],[552,y-4],[578,y-33],[599,y-52],[621,y-33],[646,y-3],[720,y]],C.teal,3);
 b+=text(16,28,'迟到对应的较早时段',17,C.muted)+text(549,28,'地面看到相近气峰',17,C.muted);
 [['接单根',C.gold,106],['起下钻',C.blue,237]].forEach(([name,color,y])=>{b+=rect(12,y-62,190,79,'#fff')+text(107,y-30,name,21,color,'middle',600)+text(107,y-5,'先核对操作日志',16,C.muted,'middle')+curve(y)+arrow(212,y-27,555,y-27,color)+text(379,y-39,'循环运输 / 迟到',17,color,'middle')+text(595,y+27,'检测时刻',16,C.muted,'middle');});
 add('m2-context',2,'峰形相似，为什么要查看更早的操作？',282,b,'两条气峰的形状相近，较早的操作却不同。把峰追溯到来源时段后，才知道该核对接单根还是起下钻等记录。');
}
{
 const X=t=>78+t*59,Y=v=>246-v*13.5;let b=rect(X(2),37,X(4)-X(2),209,'#faefd9','none',0)+text(X(3),28,'停泵2分钟',17,C.gold,'middle');
 for(const v of [0,3,6,9,12])b+=line(78,Y(v),711,Y(v),C.line,1)+text(65,Y(v)+6,v,16,C.muted,'end');
 for(const t of [0,2,4,6,8,10])b+=text(X(t),274,t,17,C.muted,'middle');
 b+=line(78,246,716,246,C.muted)+line(78,246,78,39,C.muted)+line(78,Y(12),716,Y(12),C.gold,2,'5 4');
 b+=path([[X(0),Y(0)],[X(8),Y(12)]],C.blue,3)+path([[X(0),Y(0)],[X(2),Y(3)],[X(4),Y(3)],[X(10),Y(12)]],C.teal,4);
 b+=circle(X(8),Y(12),6,C.blue)+circle(X(10),Y(12),6,C.teal)+text(X(8)-9,Y(12)-15,'8 min',18,C.blue,'end')+text(X(10)+9,Y(12)-15,'10 min',18,C.teal);
 b+=text(15,20,'累计泵量 / m³',17,C.muted)+text(707,302,'时间 / min',17,C.muted,'end')+text(375,217,'停泵段是水平线',17,C.gold);
 b+=line(98,322,124,322,C.blue,3)+text(133,328,'持续泵送',17,C.blue)+line(312,322,338,322,C.teal,4)+text(347,328,'中途停泵2分钟',17,C.teal);
 add('m2-volume',3,'同样输送12 m³，为什么会从8分钟变成10分钟？',343,b,'横轴是时间，纵轴是累计泵量。两条线都到12 m³时才完成这段运输；停泵段是水平线，因此来源时间要按累计体积回查。','12 m³ ÷ 0.025 m³/s 的教学例子');
}
// m3 — paired observations, clipped exposure and the area denominator.
{
 const grains=[[57,47,23,15],[124,39,27,17],[193,65,20,26],[83,109,30,18],[159,119,22,16]];
 let b='';[32,425].forEach((x,i)=>{b+=rect(x,38,299,157,i?'#202c3d':'#f1eadc',C.line,8)+text(x+149,24,i?'UV：观察发光位置':'白光：观察轮廓和纹理',19,C.ink,'middle',600);grains.forEach(([gx,gy,rx,ry],j)=>b+='<ellipse cx="'+(x+gx+25)+'" cy="'+(gy+45)+'" rx="'+rx+'" ry="'+ry+'" fill="'+(i?(j===1||j===3?'#efd867':'#475469'):(j%2?'#a99b80':'#d1bc8d'))+'" stroke="'+(i?'#a8bdcf':'#8c846e')+'" stroke-width="1.5"/>');});
 b+=arrow(340,112,415,112,C.muted)+text(378,91,'同一位置',16,C.muted,'middle')+text(378,233,'先在白光里找到岩屑，再在UV里核对同一位置。',19,C.teal,'middle');
 add('m3-pair',1,'为什么必须是同一样品、同一位置的白光与UV？',255,b,'两边的颗粒轮廓逐一对应，UV中有两处亮区。白光回答“岩屑在哪里”，UV回答“哪些位置发光”。','配对观察示意');
}
{
 const X=t=>85+t*166,Y=v=>244-v*.67;let b=rect(X(2.55),37,X(3.7)-X(2.55),207,'#faefd9','none',0);
 for(const v of [0,100,200,255])b+=line(85,Y(v),716,Y(v),C.line,1)+text(72,Y(v)+6,v,16,C.muted,'end');
 for(const t of [0,1,2,3])b+=text(X(t),272,t,17,C.muted,'middle');
 b+=line(85,244,716,244,C.muted)+line(85,244,85,35,C.muted);
 b+=path([[X(0),Y(0)],[X(2.55),Y(255)],[X(3.7),Y(255)]],C.blue,3)+path([[X(0),Y(0)],[X(255/140),Y(255)],[X(3.7),Y(255)]],C.gold,3);
 b+=text(12,22,'记录像素值',17,C.muted)+text(709,302,'相对曝光倍数 →',17,C.muted,'end')+text(505,45,'255：饱和上限',18,C.red)+text(479,133,'较高曝光时，两条线合到一起',17,C.gold);
 b+=line(105,321,131,321,C.blue,3)+text(140,327,'原强度100',17,C.blue)+line(330,321,356,321,C.gold,3)+text(365,327,'原强度140',17,C.gold);
 add('m3-exposure',2,'越拍越亮，为什么反而分不清强弱？',344,b,'两处原本不同的强度，在高曝光时都记录成255。正常段的差异可以比较，饱和平台上的差异已经丢失。','像素值 = min(255，原强度 × 曝光)');
}
{
 let b='';for(let j=0;j<80;j++){const col=j%10,row=Math.floor(j/10),rock=row<4,glow=rock&&[12,13,22,23].includes(j);b+=rect(18+col*24,31+row*24,21,21,glow?'#dfc65b':rock?'#9dadb6':'#edf1f3','none',2);}
 b+=text(18,22,'每格代表25个像素',17,C.muted)+text(292,56,'显示区：4格 = 100像素',20,C.gold,'start',600);
 b+=text(292,103,'按可见岩屑：100 / 1000 = 10%',19,C.teal)+rect(292,120,426,24,'#e3ebe8','none',4)+rect(292,120,42.6,24,C.gold,'none',4);
 b+=text(292,185,'按整张照片：100 / 2000 = 5%',19,C.muted)+rect(292,202,426,24,'#e7edf0','none',4)+rect(292,202,21.3,24,C.gold,'none',4);
 b+=rect(21,252,15,15,'#9dadb6','none',2)+text(46,266,'可见岩屑',17,C.muted)+rect(191,252,15,15,'#dfc65b','none',2)+text(216,266,'显示区',17,C.muted)+rect(335,252,15,15,'#edf1f3','none',2)+text(360,266,'照片背景',17,C.muted);
 add('m3-area',3,'显示面积占比，分母应该选谁？',288,b,'上半部40格是可见岩屑，其中4格为显示区。本例按可见岩屑计算10%；把照片背景也算入分母，会得到5%。','与正文100 / 1000手算例子对应');
}
// m4 — reciprocal units, aligned logs and the thin-layer trade-off.
{
 let b='';[['20分钟',30,2,38],['10分钟',60,1,158]].forEach(([duration,rop,dt,y])=>{b+=rect(10,y-22,212,96,'#fff')+text(116,y+7,'同样钻进10 m',20,C.ink,'middle',600)+text(116,y+42,'用时 '+duration,19,C.muted,'middle')+arrow(232,y+24,287,y+24)+rect(310,y+3,400,29,'#e3ebe8','none',5)+rect(310,y+3,rop/60*400,29,C.teal,'none',5)+text(310,y-7,'ROP '+rop+' m/h',19,C.teal)+text(310,y+65,'钻时 '+dt+' min/m',19,C.blue);});
 b+=text(378,284,'ROP = 60 ÷ 钻时     ｜     钻得越快，钻时越小',21,C.ink,'middle',600);
 add('m4-units',1,'同样钻10米，用时减半意味着什么？',307,b,'两次钻进长度相同，20分钟变成10分钟，ROP从30变成60 m/h；每米耗时则从2降为1 min/m。换算要针对同一有效钻进区间。','单位换算例子');
}
{
 const Y=d=>54+(d-1200)*2.7;let b=text(26,27,'井深 / m MD',17,C.muted)+text(204,27,'岩性记录',19,C.ink,'middle',600)+text(416,27,'WOB / kN',19,C.ink,'middle',600)+text(632,27,'ROP / m/h',19,C.ink,'middle',600);
 b+=rect(151,54,109,216,'#f1e1bc','none',0)+text(205,146,'同一岩性',17,C.gold,'middle')+text(347,48,'100',16,C.muted)+text(451,48,'150',16,C.muted)+text(569,48,'24',16,C.muted)+text(673,48,'36',16,C.muted);
 for(const z of [1200,1220,1240,1260,1280])b+=text(106,Y(z)+6,z,17,C.muted,'end')+line(116,Y(z),719,Y(z),C.line,1,z===1240?'4 4':'');
 b+=path([[363,Y(1200)],[363,Y(1240)],[468,Y(1240)],[468,Y(1280)]],C.blue,3)+path([[580,Y(1200)],[580,Y(1240)],[685,Y(1240)],[685,Y(1280)]],C.teal,3);
 b+=text(379,307,'1240 m：钻压调高，同时钻速升高',19,C.ink,'middle',600);
 add('m4-operation',2,'曲线出现台阶，一定是换了地层吗？',331,b,'从左到右在同一深度对齐观察：岩性保持相同，钻压与ROP同时阶跃。先核对工况，再判断是否还存在需要解释的地层响应。','共用深度轴的对照例子');
}
{
 let b='';const cols=[['原始响应',101],['短段保留',355],['强连续性',609]];
 cols.forEach(([title,x],k)=>{b+=text(x,29,title,20,C.ink,'middle',600);for(let j=0;j<16;j++)b+=rect(x-55,49+j*12,110,10,k<2&&j>=6&&j<10?C.gold:C.lime,'none',1);b+=text(x,275,k===2?'短区间可能被合并':'1 m薄响应层',17,k===2?C.muted:C.gold,'middle');});
 b+=arrow(173,147,279,147,C.teal)+arrow(428,147,534,147,C.muted)+text(224,112,'较小段长',17,C.teal,'middle')+text(483,112,'增大段长',17,C.muted,'middle')+text(377,311,'0.25 m / 点 × 4 点 = 1 m；最小8点对应2 m',18,C.muted,'middle');
 add('m4-thin',3,'分段更平滑，为什么也可能漏掉薄层？',333,b,'金色短区间只有4个采样点。提高连续性或最小段长能减少零碎边界，也可能把短响应层并入相邻区间。','采样间隔与段长的关系');
}
// m5 — provenance, negation and the actual local text-processing stages.
{
 let b=rect(8,25,230,201,'#fff')+rect(265,25,230,201,C.pale)+rect(522,25,230,201,'#fff');
 b+=text(23,58,'原始观察',20,C.blue,'start',600)+lines(23,96,['样品记录 R-017','1200—1210 m','未见荧光。'],18)+text(23,201,'保留原文和来源身份',16,C.muted);
 b+=text(280,58,'事实字段',20,C.teal,'start',600)+lines(280,96,['井段：1200—1210 m','对象：荧光','否定：是'],18)+text(280,201,'范围与否定一起保存',16,C.muted);
 b+=text(537,58,'报告草稿',20,C.gold,'start',600)+lines(537,96,['1200—1210 m井段，','未见荧光显示。','〔来源 R-017〕'],18)+text(537,201,'点句子回到这条记录',16,C.muted);
 b+=arrow(241,128,260,128)+arrow(498,128,518,128)+text(379,270,'一句报告 → 具体字段 → 一条可以定位的原始记录',19,C.ink,'middle');
 add('m5-source',1,'一句报告，怎样连接到具体井段与观察？',292,b,'从左向右看整理过程，再从右向左回查依据。报告保留了原文的井段和否定含义，来源标记指向具体记录。','教学记录示例');
}
{
 let b=rect(10,23,357,155,'#fff')+rect(393,23,357,155,'#fff');
 b+=text(28,56,'原文',19,C.muted)+text(412,56,'漏掉一个字的改写',19,C.muted);
 b+=text(28,97,'1200—1210 m，',21)+rect(28,115,35,38,'#f4d9c7','none',4)+text(34,143,'未',25,C.red,'start',600)+text(67,143,'见荧光',25)+text(412,97,'1200—1210 m，',21)+text(412,143,'见荧光',25,C.gold,'start',600);
 b+=text(188,216,'观察：没有见到荧光',20,C.teal,'middle')+text(568,216,'观察：见到荧光',20,C.gold,'middle')+text(379,268,'两句都有“荧光”，但结论相反。',21,C.ink,'middle',600);
 add('m5-negation',2,'一个“未”字，怎样改变报告含义？',291,b,'先定位井段，再看否定词作用于哪个观察。分类找到“荧光”还不够，字段抽取与人工复核要把“未见”一起保留。');
}
{
 let b='';const stages=[['文本分类','字符朴素贝叶斯',['把子句分到','对应的记录类别']],['字段抽取','明确的抽取规则',['保留井段与单位','保留否定和范围']],['草稿组装','按已有字段组句',['每句带具体来源','可以回看原文']],['人工核对','核对当前修订',['保存核验意见','保留修订历史']]];
 stages.forEach((s,i)=>{const x=8+i*192;b+=rect(x,20,168,186,i===3?'#f8f0e1':C.pale)+text(x+14,55,s[0],21,C.ink,'start',600)+text(x+14,94,s[1],17,C.teal)+lines(x+14,135,s[2],16);if(i<3)b+=arrow(x+173,113,x+187,113);});
 b+=text(379,254,'点草稿看原文 → 修改一句话 → 重新核对含义',19,C.ink,'middle');
 add('m5-pipeline',3,'智能方法在哪些整理步骤中提供帮助？',278,b,'分类负责分流，抽取负责保留细节，组装负责形成有来源的草稿。到演示中，可以逐句查看实际分类分数、字段和原文。','本例采用的处理链');
}
g.S17MudDiagrams=d;
})(globalThis);
