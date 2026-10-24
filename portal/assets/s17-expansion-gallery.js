(function(g){'use strict';
const esc=g.K.esc;
const groups=[
 {id:'geology',name:'从地表，看向地下',label:'地质勘察 / 物探',image:'geology',alt:'砂金色露头地层与灰蓝远山，地质勘察主题图',lead:'把岩石的颜色、纹理和反射波形，变成可以逐处核查的解释。',scenes:['g1','s1']},
 {id:'well',name:'把一口井，建得更明白',label:'钻井 / 测井 / 固井 / 完井 / 射孔',image:'well',alt:'开阔荒漠中的陆地钻机，井筒建造主题图',lead:'沿着井筒看曲线、波形与参数空间，理解一个选择怎样受条件约束。',scenes:['d1','w4','c1','co1','p1']},
 {id:'production',name:'从生产表现，寻找下一步',label:'采油 / 修井 / 增采',image:'production',alt:'夕照下沿道路排列的抽油机，生产增产主题图',lead:'读懂一个泵循环，回查一份井史，再把资源边界放进增产方案。',scenes:['pr1','wo1','e1']},
 {id:'refining',name:'让流动与品质，都看得见',label:'运输 / 加工',image:'refining',alt:'滨海炼厂的储罐与塔器，运输加工主题图',lead:'从连续传感器里寻找异常，也在化验到来之前估计产品质量。',scenes:['t1','r5']}
];
const details={
 g1:{question:'地表颜色相近，就属于同一种岩石吗？',method:'多波段与纹理 · kNN',visual:'波段合成 / 像素分类地图',action:'增加波段噪声，点选像素追到训练近邻。',shape:'map'},
 s1:{question:'层位哪里错开了，模型看到了什么？',method:'局部不连续性 · 逻辑回归',visual:'地震振幅剖面 / 断层迹线',action:'改变噪声与检测阈值，点选候选迹线复核。',shape:'seismic'},
 d1:{question:'钻得更快，还要满足哪些边界？',method:'岭回归代理 · 受约束搜索',visual:'响应面 / 可行域',action:'收紧泵压或扭矩上限，看推荐参数怎样改变。',shape:'heat'},
 w4:{question:'单看自然伽马，能分清三种岩性吗？',method:'整井留出 · 多道 kNN',visual:'深度多道曲线 / 交会图',action:'点击井深看近邻，比较多道识别与单 GR 规则。',shape:'tracks'},
 c1:{question:'声幅升高，是否就意味着胶结不好？',method:'波形特征 · 近邻与拒判',visual:'CBL / VDL 波列 / 深度分类',action:'加入微环空、偏心或噪声，定位需要复核的井段。',shape:'wave'},
 co1:{question:'同一口井，哪种完井方式更合适？',method:'历史近邻 · 条件筛选',visual:'完井结构 / 候选效用对照',action:'改变预算、防砂与控水要求，看候选如何进出。',shape:'rank'},
 p1:{question:'孔打得更多、更深，就一定更好吗？',method:'试验代理 · 受约束搜索',visual:'参数响应面 / 几何约束',action:'调整预算与越带余量，对照推荐和固定方案。',shape:'heat'},
 pr1:{question:'一个载荷—位移循环，藏着什么工况？',method:'功图形状特征 · kNN',visual:'闭合功图 / 训练近邻',action:'切换泵况、增加噪声，看形状、近邻和判断一起变化。',shape:'loop'},
 wo1:{question:'这份修井建议，来自哪一段井史？',method:'文本与观测相似度 · 检索',visual:'井史相似病例 / 条件核查',action:'改变本次观测或工单描述，追到候选的具体出处。',shape:'links'},
 e1:{question:'预算和用水都有限，压裂方案怎么选？',method:'响应代理 · 网格与 Pareto 比较',visual:'收益—代价散点 / Pareto 候选',action:'收紧预算、用水或压力上限，观察可行候选收缩。',shape:'scatter'},
 t1:{question:'流量变了，是调负荷，还是值得查的泄漏？',method:'正常关系学习 · 持续偏差检测',visual:'压力流量时序 / 事件时段',action:'切换负荷扰动与泄漏情景，对照固定阈值。',shape:'series'},
 r5:{question:'化验还没回来，当前品质怎样估计？',method:'时刻对齐 · 岭回归软测量',visual:'连续估计 / 化验到达时间线',action:'延长化验等待或加入工况漂移，比较三种估计。',shape:'steps'}
};
function complete(){return (g.S17Expansion?.cases||[]).filter(c=>g.Cases?.get(c.id));}
function glyph(kind){
 const shapes={
 map:'<path fill="#cbdcd3" d="M4 3h27v15H19v23H4z"/><path fill="#d4b888" d="M31 3h25v22H40v16H19V18h12z"/><path fill="#8babb2" d="M56 3h18v38H40V25h16z"/>',
 seismic:'<path d="M4 10h22l7 5h22l17 3M4 20h23l8 5h18l19 3M4 30h24l8 5h17l19 3"/><path d="M43 1l-8 14 1 11-9 18" stroke="#bd8c55" stroke-width="2.5"/>',
 heat:'<g fill="#d9e8e1"><rect x="6" y="4" width="14" height="11"/><rect x="6" y="18" width="14" height="11"/><rect x="6" y="32" width="14" height="11"/></g><g fill="#99beb1"><rect x="23" y="4" width="14" height="11"/><rect x="23" y="18" width="14" height="11"/><rect x="40" y="4" width="14" height="11"/></g><g fill="#548d83"><rect x="23" y="32" width="14" height="11"/><rect x="40" y="18" width="14" height="11"/><rect x="40" y="32" width="14" height="11"/></g><path d="M60 2v42M69 2v42" stroke="#c6d2d3"/><path d="M61 7l8 8m-8 0 8 8m-8 0 8 8m-8 0 8 8" stroke="#b49e80"/>',
 tracks:'<path d="M3 2v42m24-42v42M51 2v42M75 2v42" stroke="#d4dfe0"/><path d="M11 2l6 6-9 7 12 9-8 7 5 13M36 2l4 13-7 5 11 11-6 13"/><path d="M60 2v11h9v11h-9v20" stroke="#ba905c"/>',
 wave:'<path d="M3 2h70M3 43h70" stroke="#d5dfe0"/><path d="M7 22h10l3-14 5 28 5-26 5 23 6-20 5 16 6-13 6 11 5-8 7 3"/>',
 rank:'<path d="M4 5v36M4 41h68" stroke="#d3dfe0"/><path d="M9 12h56" stroke="#477e77" stroke-width="7"/><path d="M9 24h40" stroke="#92b2a7" stroke-width="7"/><path d="M9 36h24" stroke="#d6bc8e" stroke-width="7"/>',
 loop:'<path d="M9 8h48l10 5v23H20L9 30z" fill="#e5efe9"/><path d="M11 9l44 3 10 8-7 15-38-2-9-8z" stroke="#347b76" stroke-width="2.4"/>',
 links:'<path d="M12 9L38 23 65 7M12 37L38 23 65 39" stroke="#a4b9b8"/><g fill="#ecf2ee"><circle cx="12" cy="9" r="7"/><circle cx="12" cy="37" r="7"/><circle cx="65" cy="7" r="7"/><circle cx="65" cy="39" r="7"/></g><circle cx="38" cy="23" r="10" fill="#adcac0"/>',
 scatter:'<path d="M5 2v39h68" stroke="#c6d6d7"/><g fill="#9abaae" stroke="none"><circle cx="17" cy="32" r="3"/><circle cx="23" cy="24" r="3"/><circle cx="34" cy="31" r="3"/><circle cx="39" cy="19" r="3"/><circle cx="51" cy="22" r="3"/><circle cx="60" cy="13" r="3"/></g><path d="M16 18l15-5 16-5 19-4" stroke="#bc8f57"/><g fill="#bc8f57" stroke="none"><circle cx="16" cy="18" r="3"/><circle cx="31" cy="13" r="3"/><circle cx="47" cy="8" r="3"/><circle cx="66" cy="4" r="3"/></g>',
 series:'<path d="M3 31l8-1 6 2 7-10 7 1 6-3 8 2 6-13 9-2 7 2 6-1"/><path d="M4 24l10-1 8 2 9-1 8 2 10-2 8 1 17-1" stroke="#bd9563" stroke-dasharray="3 3"/>',
 steps:'<path d="M4 33l8-3 7 2 10-12 9 2 9-6 7 2 9-10 10 1"/><path d="M4 36h23V27h23V17h23" stroke="#ba905c"/>'};
 return '<svg viewBox="0 0 78 46" fill="none" stroke="#458077" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">'+(shapes[kind]||shapes.series)+'</svg>';
}
function card(c){const d=details[c.sceneId];if(!d)return '';return '<article class="sx-card" data-sx-scene="'+esc(c.sceneId)+'"><div class="sx-card-top"><span>'+esc(c.stageName)+' · '+esc(c.sceneId.toUpperCase())+'</span>'+glyph(d.shape)+'</div><h4>'+esc(c.name)+'</h4><p class="sx-question">'+esc(d.question)+'</p><div class="sx-visual"><span>阅读图形</span>'+esc(d.visual)+'</div><p class="sx-method">'+esc(d.method)+'</p><p class="sx-action"><b>动手改一处</b>'+esc(d.action)+'</p><div class="sx-card-links"><a href="'+esc(g.S17Expansion.href(c.sceneId,'bg'))+'">读背景与流程 →</a><a href="'+esc(g.S17Expansion.href(c.sceneId,'demo'))+'">运行演示 ↗</a></div></article>';}
function markup(){const cases=complete(),lookup=new Map(cases.map(c=>[c.sceneId,c]));if(!cases.length)return '';
 return '<section class="sx-gallery" id="s17-expansion" aria-labelledby="sx-title"><div class="s17-section-head"><div><div class="s17-kicker">其他阶段 · 精选起点与完整目录</div><h2 id="sx-title">沿作业链，继续探索</h2></div><p><b>'+cases.length+' 个跨阶段成品</b><br>背景概念、逐步方法、交互计算，都有各自的图形语言。</p></div><div class="sx-jumps" aria-label="跨阶段案例分组">'+groups.filter(group=>group.scenes.some(id=>lookup.has(id))).map(group=>'<a href="#sx-'+group.id+'" data-sx-jump>'+esc(group.label)+'</a>').join('')+'</div>'+groups.map((group,index)=>{const records=group.scenes.map(id=>lookup.get(id)).filter(Boolean);if(!records.length)return '';return '<section class="sx-group" id="sx-'+group.id+'" aria-labelledby="sx-'+group.id+'-title"><header class="sx-group-head"><figure><img src="assets/themes/theme-'+group.image+'-v1.webp" width="1280" height="'+(group.image==='geology'?'531':'640')+'" alt="'+esc(group.alt)+'" loading="lazy" decoding="async"><figcaption>井见主题图 · AI 绘制</figcaption></figure><div class="sx-group-copy"><span class="sx-group-no">0'+(index+1)+' / '+esc(group.label)+'</span><h3 id="sx-'+group.id+'-title">'+esc(group.name)+'</h3><p>'+esc(group.lead)+'</p><span class="sx-group-count">'+records.length+' 个交互案例</span></div></header><div class="sx-cards '+(records.length>2?'sx-cards-three':'')+'">'+records.map(card).join('')+'</div></section>';}).join('')+'<p class="sx-gallery-note">共 '+cases.length+' 例已接入；上方精选12例，下方场景目录可进入其余案例。使用老师原门户时，仍可从 <code>dist/expansion-cases/</code> 逐例选择目录添加。<a href="../handoff/teaching-audit-2026-10-24/acceptance.html">查看实际验收记录 →</a></p></section>';
}
g.S17ExpansionGallery={markup,count:()=>complete().length,groups:groups.map(({id,name,scenes})=>({id,name,scenes:scenes.slice()}))};
document.addEventListener('click',e=>{const a=e.target.closest('[data-sx-jump]');if(!a)return;const target=document.querySelector(a.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}});
})(window);
