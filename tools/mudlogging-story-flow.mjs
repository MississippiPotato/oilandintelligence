// Five authored process drawings. These are navigation diagrams, not generated data plots.
const ink='#263b43',teal='#246e6b',blue='#466b91',ochre='#ba713a';
const text=(x,y,s,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${s}</text>`;
const path=(d,color=teal,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" ${extra}/>`;
const node=(i,x,title,body,detail,y=105)=>`<g class="story-node" data-flow-step="${i}" transform="translate(${x} ${y})"><ellipse class="story-focus" cx="0" cy="0" rx="62" ry="44"/>${body}${text(0,65,title,'story-title')}${text(0,88,detail,'story-detail')}</g>`;
const grain=(x,y,fill=ochre)=>`<path d="M${x-13} ${y}l7-10 17 3 5 12-14 8-13-5z" fill="${fill}" stroke="${ink}" stroke-width="1.2"/>`;
const paper=(x,y,w=65,h=55)=>`<path d="M${x} ${y}h${w-13}l13 13v${h-13}h-${w}z" fill="#fffefa" stroke="${ink}" stroke-width="1.5"/>`;
const dots=(x,y)=>[0,1,2].map((j)=>`<circle cx="${x+j*14}" cy="${y}" r="4" fill="${[teal,blue,ochre][j]}"/>`).join('');
const link=(d,color=teal,dashed=false)=>path(d,color,`${dashed?'stroke-dasharray="5 5"':''} marker-end="url(#story-arrow)"`);
function m1(){
 return path('M25 113C125 42 179 42 260 105S407 162 485 106S637 45 710 105S852 161 962 106','#d7e6df','stroke-width="20"')+
 node(0,80,'登记这盘样品',`<ellipse cy="12" rx="42" ry="20" fill="#eee4d3" stroke="${ochre}"/>${grain(-20,0)}${grain(11,16,blue)}${grain(26,-8,'#b8b6a2')}`,'编号＋来源井段')+
 node(1,240,'校正拍摄条件',`<rect x="-40" y="-27" width="80" height="52" rx="5" fill="#fff" stroke="${ink}"/><path d="M-40 9h80" stroke="${ink}"/>${[teal,'#bcbca9',ochre].map((c,j)=>`<rect x="${-32+j*24}" y="-19" width="19" height="19" fill="${c}"/>`).join('')}`,'画面内参考片')+
 node(2,405,'分开每一粒',`${grain(-24,-3)}${grain(20,12,blue)}<path d="M-42-21L-9-23 0 12-25 24zM4-8l33 3 9 30-34 6z" fill="none" stroke="${teal}" stroke-dasharray="4 3"/>`,'轮廓决定计数')+
 node(3,565,'读取颜色与纹理',`<g fill="${teal}">${[13,27,19,38].map((h,i)=>`<rect x="${-38+i*21}" y="${25-h}" width="13" height="${h}"/>`).join('')}</g>${text(0,-17,'RGB · 纹理','story-micro')}`,'变成可比的特征')+
 node(4,725,'寻找训练近邻',`${grain(-27,0)}${grain(7,-17)}${grain(28,17,blue)}${path('M-11-6L-3-13M-12 6l26 9',ochre)}`,'距离＋投票＋拒判')+
 node(5,900,'汇总并复核',`<path d="M-43 0h86M-43 23h86" stroke="#d8ded7" stroke-width="14"/><path d="M-43 0h54M-43 23h34" stroke="${teal}" stroke-width="14"/>${text(-57,5,'粒','story-micro')}${text(-57,28,'面','story-micro')}`,'颗粒数 ≠ 可见面积');
}
function m2(){
 return `<g class="story-micro">${text(170,28,'井下来源时钟')}${text(170,118,'地面检测时钟')}${path('M35 62H350','#bbcfc6')}${path('M35 140H350','#bbcfc6')}<rect x="87" y="47" width="78" height="28" rx="4" fill="#ead4b7"/>${text(126,66,'操作日志')}${path('M45 138h165q17 0 24-27t22 0q7 27 25 27h54',teal)}${link('M244 111Q244 85 165 64',ochre,true)}${text(281,89,'累计泵量回查')}</g>`+
 node(0,62,'统一记录',paper(-20,-27,45,55),'气体／泵量／MD',192)+
 node(1,270,'回到来源时段',`${path('M-44 0H44',ochre)}<circle cx="-26" r="9" fill="#ead4b7"/><circle cx="26" r="9" fill="${teal}"/>${text(0,-17,'∫ Q dt','story-title')}`,'停泵时体积不推进',192)+
 link('M360 138H400')+
 node(2,445,'圈出气峰窗',`${path('M-45 20h25q10 0 16-34t15 0q5 34 22 34h14')}<rect x="-10" y="-28" width="28" height="59" fill="${teal}" fill-opacity=".13"/>`,'开始／峰值／结束')+
 node(3,590,'建立比较尺度',`${dots(-28,-17)}${dots(-28,2)}${dots(-28,21)}${path('M23-24v48',blue)}`,'训练井事件特征')+
 node(4,735,'给出关联候选',`<circle r="28" fill="#e2eee7" stroke="${teal}"/>${dots(-14,0)}${path('M-45 0h16M29 0h16')}`,'组分＋峰形＋工况')+
 node(5,905,'回查与比较',paper(-34,-28)+`${path('M-23-10h35M-23 2h45M-23 14h25',blue)}<path d="M15 17l9 8 17-23" fill="none" stroke="${teal}" stroke-width="4"/>`,'检测与解释分开评价')+
 link('M493 105h33')+link('M638 105h33')+link('M785 105h51');
}
function m3(){
 return `<g class="story-micro">${text(190,25,'先确认同一样品、同一位置')}<path d="M95 55H345Q385 55 410 104M95 142H345Q385 142 410 104" fill="none" stroke="#cadbd4" stroke-width="10"/>${text(185,73,'白光：看轮廓')}${text(185,131,'UV：看显示')}</g>`+
 node(0,95,'确认配对',`<rect x="-31" y="-57" width="62" height="35" rx="5" fill="#eee5d6"/>${grain(0,-40)}<rect x="-31" y="22" width="62" height="35" rx="5" fill="#2e3c49"/>${grain(0,39,'#c9b15e')}`,'同编号、同位置')+
 node(1,280,'检查曝光',`<rect x="-29" y="-59" width="58" height="26" fill="#e6e7dd"/><rect x="-29" y="32" width="58" height="26" fill="#465a6d"/>${text(0,6,'参考片','story-title')}`,'饱和会丢失细节')+
 node(2,420,'像素特征',`${[-1,0,1].flatMap((x)=>[-1,0,1].map(y=>`<rect x="${x*17-7}" y="${y*17-7}" width="14" height="14" fill="${(x+y)%2?blue:teal}" opacity="${.35+(x+1)*.22}"/>`)).join('')}`,'颜色与局部对比')+
 node(3,555,'从标注学习',`${path('M-38-28v57h77','#9caea9')}${path('M-34-20q18 0 27 29t40 13',teal)}`,'逻辑回归权重')+
 node(4,690,'三路并排',`${[-1,0,1].map((v)=>`<rect x="${v*27-10}" y="-23" width="21" height="45" fill="#e2e5db"/><path d="M${v*27-7} 10l8-22 7 14v15h-15z" fill="${[ochre,blue,teal][v+1]}"/>`).join('')}`,'阈值／校正／模型')+
 node(5,820,'同分母计数',`<circle r="29" fill="#dce7df"/><path d="M0 0V-29A29 29 0 0 1 27 11z" fill="${teal}"/>`,'显示 ÷ 岩屑')+
 node(6,950,'核查来源',`<path d="M-18-28v20l-17 30q-5 10 5 10h48q10 0 5-10L7-8v-20" fill="#e8e7d7" stroke="${ink}"/>${path('M-8-17h19',ochre)}`,'矿物也会发光')+
 link('M460 105h50')+link('M595 105h51')+link('M729 105h46')+link('M859 105h47');
}
function m4(){
 return `<path d="M30 110H980" stroke="#d9e4dd" stroke-width="12"/>`+
 node(0,70,'对齐深度',`${path('M-29-29v60M-30-24l17 8-10 13 17 9-12 20',ochre)}${text(20,-15,'MD','story-micro')}${text(20,17,'↓','story-title')}`,'钻进有效区间')+
 node(1,220,'标定操作影响',`${path('M-40 15l25-31 20 17 30-23',blue)}${path('M-40 30H38','#a7bbb1')}${text(0,-28,'WOB / RPM','story-micro')}`,'独立标定记录')+
 node(2,370,'扣除工况项',`${path('M-40 17l20-25 20 11 20-28 20 6',ochre)}${path('M-40 28l20-1 20 3 20-2 20 1',teal)}`,'原曲线与相对响应')+
 node(3,520,'认识响应簇',`${[[-23,0],[-14,-15],[-5,9],[19,-12],[30,3],[17,17]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="6" fill="${i<3?teal:ochre}"/>`).join('')}`,'数值中心非岩性名')+
 node(4,670,'整理连续区间',`${[0,1,2,3,4,5,6].map(i=>`<rect x="${-42+i*12}" y="-25" width="10" height="22" fill="${i%2?ochre:teal}"/>`).join('')}<path d="M-42 18h38M-1 18h42" stroke="${teal}" stroke-width="16"/>`,'惩罚与薄层取舍')+
 node(5,820,'回到候选深度',`${path('M-32-29v60M25-29v60','#a6bab1')}${path('M-26-22l17 9-14 12 23 10-9 20',teal)}${path('M-42 6H44',ochre)}<circle cx="0" cy="6" r="5" fill="${ochre}"/>`,'多道准线联动')+
 node(6,955,'一对一核对',`<g fill="${teal}"><circle cx="-27" cy="-13" r="6"/><circle cx="-27" cy="16" r="6"/></g><g fill="${ochre}"><circle cx="29" cy="-4" r="6"/><circle cx="29" cy="20" r="6"/></g>${path('M-19-13L21-4M-19 16L21 20',blue)}`,'命中／漏检／多报');
}
function m5(){
 return link('M113 105H190')+link('M280 105H351')+link('M441 105H511')+link('M601 105H671')+link('M761 105H841')+
 node(0,70,'保留来源版本',paper(-35,-30,70,60)+`${path('M-24-12h48M-24 0h37M-24 12h44',blue)}${text(0,45,'R017 · v1','story-micro')}`,'这次观察有身份')+
 node(1,235,'分句不丢位置',`<path d="M-44-22h88M-44 22h88" stroke="#e4e8e0" stroke-width="22"/>${text(0,-16,'未见荧光','story-title')}${text(0,28,'气测升高','story-title')}`,'否定只跟随本子句')+
 node(2,395,'先分类分流',`<path d="M-39-24l35 24-35 24M-4 0H36M12 0l24-22M12 0l24 22" fill="none" stroke="${teal}" stroke-width="3"/>${dots(20,-22)}${dots(20,22)}`,'荧光类 ≠ 肯定显示')+
 node(3,555,'保留含义字段',`${text(0,-15,'1200–1210 m','story-micro')}<rect x="-39" y="-6" width="78" height="29" rx="5" fill="#f1d3ac"/>${text(0,15,'未见','story-title')}`,'深度／单位／否定')+
 node(4,715,'组装有引用的句子',paper(-48,-27,96,59)+`${path('M-35-11h67M-35 16h67',blue)}<path d="M-35 2h31" stroke="${ochre}" stroke-width="7"/>${text(10,7,'未见','story-micro')}`,'句子仍连着原文')+
 node(5,900,'核对当前修订',`<path d="M-35-25h70v50h-70z" fill="#e1eee7" stroke="${teal}"/>${path('M-23-4l12 11L10-15',teal)}${path('M3 16h23',ochre)}`,'改一个字就需重核');
}
const designs={m1,m2,m3,m4,m5};
const titles={m1:'同一盘岩屑，怎样一步步变成可复核的记录',m2:'两个时钟，一条回查路径：先对时，再解释气峰',m3:'两束光，一份样品：从配对观察到显示面积',m4:'沿井深，把操作影响与候选响应分开',m5:'让“未见”跟着证据走，而不是在报告里消失'};
const captions={m1:'路径跟踪样品身份；分割决定“有几粒”，近邻决定外观候选，最后比较两种分母。',m2:'气峰在地面出现，工况发生在更早的来源时段；累计泵量把两个时钟关联起来。',m3:'双路径先保留白光轮廓与UV显示，再汇合到特征、模型和同分母比较。',m4:'每一步围绕同一井段推进；聚类形成数值响应模式，边界需要回到原曲线核查。',m5:'原文、子句、字段与草稿保留同一引用；类别正确后，仍要核对否定和范围。'};
export function mudloggingStoryFlow(scene){if(!designs[scene])throw Error('Missing scene process drawing: '+scene);return `<figure class="case-flow-overview study-workflow-overview story-flow" data-flow-scene="${scene}" data-flow-design="${scene}"><style>.story-flow{margin:20px 0 26px;padding:18px 16px;background:#f8f6ef;border:1px solid #dce3dc;border-radius:10px;min-width:0}.story-flow h3{font-size:20px!important;line-height:1.55!important;margin:0 0 9px!important;color:${ink}}.story-flow .case-flow-scroll{max-width:1050px;margin:auto;overflow-x:auto}.story-flow svg{display:block;width:100%;min-width:900px;height:auto;max-height:260px}.story-flow svg text{font:17px system-ui,Microsoft YaHei,sans-serif;fill:${ink}}.story-flow .story-title{font-weight:650;font-size:18px}.story-flow .story-detail,.story-flow .story-micro{font-size:15px;fill:#59716f}.story-flow .story-node{cursor:pointer}.story-flow .story-focus{fill:#e0eee6;fill-opacity:0;stroke:${teal};stroke-opacity:0;stroke-width:2}.story-flow .story-node[aria-current=true] .story-focus{fill-opacity:.7;stroke-opacity:.9}.story-flow .story-node:hover .story-focus,.story-flow .story-node:focus .story-focus{fill-opacity:.5;stroke-opacity:1}.story-flow figcaption{font-size:15px;line-height:1.8;color:#526b68;margin:8px 0 0}.story-flow .story-note{font-size:13px;color:#7b8984}</style><h3>${titles[scene]}</h3><div class="case-flow-scroll" tabindex="0" aria-label="紧凑流程图，可左右滚动"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1030 ${scene==='m2'?315:215}" role="img" aria-label="${titles[scene]}"><defs><marker id="story-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5 0 7z" fill="${teal}"/></marker></defs>${designs[scene]()}</svg></div><figcaption>${captions[scene]}<span data-flow-instruction> 下方图解逐步说明；进入演示可点击对象定位。</span><br><span class="story-note">流程定位示意；具体观测与计算结果在下方逐步图解和交互实验中查看。</span></figcaption></figure>`;}
