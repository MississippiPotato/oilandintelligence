(function(g){
  'use strict';
  const scene='w1';

  const C={red:'#B8242A',blue:'#55768B',gold:'#B08A4A',ink:'#283D45',warm:'#F7F4EF',grid:'#DDD5CA'};
  const fmt=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'—';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mean=a=>a.reduce((s,v)=>s+v,0)/(a.length||1);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(x,y,t,color=C.ink,anchor='start')=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" text-anchor="'+anchor+'" font-size="16">'+esc(t)+'</text>';
  const line=(x1,y1,x2,y2,c=C.grid,dash='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+c+'" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
  const path=(pts,c,width=3)=>'<polyline points="'+pts.map(p=>p.map(v=>fmt(v,2)).join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="'+width+'" stroke-linejoin="round"/>';
  const dot=(x,y,r,c,stroke='none')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" stroke="'+stroke+'" stroke-width="2"/>';
  const rect=(x,y,w,h,c,opacity=1)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'" opacity="'+opacity+'"/>';
  const svg=(title,body,h=350)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 '+h+'" role="img" aria-label="'+esc(title)+'"><rect width="720" height="'+h+'" fill="'+C.warm+'"/>'+body+'</svg>';
  function range(key,label,min,max,step,value){return '<label>'+label+' <output data-ct-out="'+key+'">'+value+'</output><input disabled data-ct-input="'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';}
  function select(key,label,options,value){return '<label>'+label+'<select disabled data-ct-input="'+key+'" data-ct-default="'+value+'">'+options.map(o=>'<option value="'+o[0]+'"'+(o[0]===value?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></label>';}
  const css='<style>[data-concept-scene="'+scene+'"]{background:#F7F4EF;color:#283D45;font-size:18px;line-height:1.65;padding:22px;border:1px solid #DDD5CA;border-radius:14px;margin:22px 0;min-width:0;max-width:100%;box-sizing:border-box}[data-concept-scene="'+scene+'"] h3{font-size:22px;line-height:1.45;margin:0 0 12px;color:#B8242A}[data-concept-scene="'+scene+'"] p{font-size:18px}[data-concept-scene="'+scene+'"] .ct-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px 20px;margin:16px 0}[data-concept-scene="'+scene+'"] label{display:flex;flex-direction:column;font-size:16px;gap:5px;min-width:0}[data-concept-scene="'+scene+'"] output{font-size:18px;color:#B8242A;font-weight:700}[data-concept-scene="'+scene+'"] input,[data-concept-scene="'+scene+'"] select{width:100%;max-width:100%;accent-color:#B8242A;font-size:18px}[data-concept-scene="'+scene+'"] .ct-chart{overflow-x:auto;max-width:100%;margin:16px 0}[data-concept-scene="'+scene+'"] .ct-chart svg{display:block;width:100%;min-width:720px;height:auto}[data-concept-scene="'+scene+'"] .ct-chart text{font-family:system-ui,sans-serif;font-size:16px}[data-concept-scene="'+scene+'"] .ct-note{font-size:16px;color:#55768B}[data-concept-scene="'+scene+'"] .ct-readout{padding:12px 16px;border-left:4px solid #B8242A;background:#fffaf3}[data-concept-scene="'+scene+'"] button{font-size:16px;border:1px solid #B8242A;background:#fffaf3;color:#B8242A;padding:8px 14px;border-radius:6px;margin:5px 10px 5px 0;cursor:pointer}[data-concept-scene="'+scene+'"] table{border-collapse:collapse;font-size:16px;width:100%;min-width:570px}[data-concept-scene="'+scene+'"] th,[data-concept-scene="'+scene+'"] td{border-bottom:1px solid #DDD5CA;padding:6px 9px;text-align:right}[data-concept-scene="'+scene+'"] th:first-child,[data-concept-scene="'+scene+'"] td:first-child{text-align:left}</style>';
  function widget(part,title,description,controls,initial){return css+'<section class="ct-widget" data-concept-scene="'+scene+'" data-concept-part="'+part+'" data-ct-state="'+esc(JSON.stringify(initial.state))+'"><h3>'+title+'</h3><p>'+description+'</p><div class="ct-controls">'+controls+'</div><div class="ct-chart" data-ct-graphic>'+initial.graphic+'</div><div class="ct-readout" data-ct-result aria-live="polite">'+initial.readout+'</div><p class="ct-note" data-ct-source>'+esc(initial.source||'局部教学计算；沿用本例知识与引擎中的关系。')+'</p><button disabled type="button" data-ct-reset>恢复本单元默认</button>'+(part==='workflow'?'<button disabled type="button" data-ct-refresh>读取当前示范数据</button>':'')+'</section>';}
  function current(){try{const s=g.CaseInspect&&g.CaseInspect.snapshot();return s&&s.sceneId===scene&&s.status==='ready'?g.CaseInspect.evidence():null;}catch(_){return null;}}
  function mount(root){
    root.querySelectorAll('[data-concept-scene="'+scene+'"]').forEach(host=>{
      if(host.dataset.ctReady)return;host.dataset.ctReady='true';
      host.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);
      function draw(){
        const p={};host.querySelectorAll('[data-ct-input]').forEach(el=>{p[el.dataset.ctInput]=el.tagName==='SELECT'?el.value:Number(el.value);});
        const r=host.dataset.conceptPart==='background'?background(p):workflow(p,current(),host);
        host.querySelector('[data-ct-graphic]').innerHTML=r.graphic;
        host.querySelector('[data-ct-result]').innerHTML=r.readout;
        host.querySelector('[data-ct-source]').textContent=r.source||'局部教学计算；沿用本例知识与引擎中的关系。';
        host.querySelectorAll('[data-ct-out]').forEach(el=>{el.textContent=p[el.dataset.ctOut];});
        host.dataset.ctState=JSON.stringify(r.state);
      }
      host.addEventListener('input',draw);host.addEventListener('change',draw);
      host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!host.contains(b))return;if(b.hasAttribute('data-ct-reset')){host.querySelectorAll('[data-ct-input]').forEach(el=>{el.value=el.tagName==='SELECT'?el.dataset.ctDefault:el.defaultValue;});draw();}else if(b.hasAttribute('data-ct-refresh'))draw();});
      draw();
    });
  }

  function localRows(n=180){return Array.from({length:n},(_,i)=>{const layer=[44,88,140].filter(j=>i>=j).length;return{depth:1200+i*.5,gr:[32,105,48,122][layer]+5*Math.sin(i*2.3),lr:[1.6,.5,1.35,.7][layer]+.05*Math.cos(i*1.7)};});}
  function background(p){
    const rows=Array.from({length:81},(_,i)=>{const depth=1200+i*.5,lower=depth>=p.boundary;return{depth,gr:(lower?105:32)+(i===20?p.spike:0)+2*Math.sin(i*1.2),lr:(lower?.5:1.6)+.015*Math.sin(i*1.6)};});
    const y=d=>60+(d-1200)/40*250,xgr=v=>145+v/160*195,xlr=v=>435+v/2*190;
    let b=text(65,24,'共同深度：单点尖峰只改变一小段，层间改变会持续')+text(145,47,'GR / API',C.gold)+text(435,47,'log₁₀(Rt / 1 Ω·m)',C.blue);
    [1200,1210,1220,1230,1240].forEach(d=>{b+=line(125,y(d),650,y(d))+text(113,y(d)+5,fmt(d,0),C.ink,'end');});
    b+=line(365,60,365,310)+path(rows.map(o=>[xgr(o.gr),y(o.depth)]),C.gold)+path(rows.map(o=>[xlr(o.lr),y(o.depth)]),C.blue);
    b+=line(125,y(p.boundary),650,y(p.boundary),C.red,'5 4')+text(650,y(p.boundary)-8,'持续改变 '+fmt(p.boundary,1)+' m',C.red,'end');
    b+=dot(xgr(rows[20].gr),y(1210),5,C.red)+[0,80,160].map(v=>text(xgr(v),337,v,C.ink,'middle')).join('')+[0,1,2].map(v=>text(xlr(v),337,fmt(v,1),C.ink,'middle')).join('')+text(70,365,'MD / m（向下增加）；两道曲线在同一行对应同一井段');
    const k=rows.findIndex(o=>o.depth>=p.boundary),left=rows.slice(k-4,k),right=rows.slice(k,k+4),deltaGR=mean(right.map(o=>o.gr))-mean(left.map(o=>o.gr)),deltaLR=mean(right.map(o=>o.lr))-mean(left.map(o=>o.lr));
    return{graphic:svg('深度对齐的GR与对数电阻率及可移动持续界面',b,390),readout:'当前持续改变位于 <strong>'+fmt(p.boundary,1)+' m MD</strong>。每侧2 m内，GR均值差 '+fmt(deltaGR)+' API，logRt均值差 '+fmt(deltaLR)+'；1210 m的单点GR尖峰额外增加 '+p.spike+' API，Rt没有同步阶跃。把尖峰增大，比较它在一个采样点和一段邻域上的不同影响。',source:'局部教学曲线每0.5 m采样；GR与logRt反映不同物理响应，两者持续改变可为界面提供线索，再结合岩屑核查岩性。',state:{part:'background',inputs:p,samplingMetres:.5,boundary:p.boundary,spikeDepth:1210,leftMeanGR:mean(left.map(o=>o.gr)),rightMeanGR:mean(right.map(o=>o.gr)),deltaGR,deltaLogRt:deltaLR}};
  }
  function workflow(p,e){
    const live=e&&Array.isArray(e.observations)&&e.observations[0]&&Number.isFinite(e.observations[0].gr),rows=live?e.observations:localRows(),i=clamp(Math.round(p.index),p.window,rows.length-p.window-1),l=rows.slice(i-p.window,i),r=rows.slice(i,i+p.window),lg=mean(l.map(o=>o.gr)),rg=mean(r.map(o=>o.gr)),ll=mean(l.map(o=>o.lr)),rl=mean(r.map(o=>o.lr)),features=[1,Math.abs(lg-rg)/70,Math.abs(ll-rl)];
    const a=Math.max(0,i-18),z=Math.min(rows.length-1,i+18),min=rows[a].depth,max=rows[z].depth,y=d=>70+(d-min)/(max-min||1)*240,xg=v=>145+v/155*185,xr=v=>435+v/2*190;
    let b=text(65,25,'候选深度两侧各取 '+p.window+' 点：把曲线变成两项差异')+text(145,48,'GR / API',C.gold)+text(435,48,'log₁₀(Rt / 1 Ω·m)',C.blue);
    const y1=y(l[0].depth),y2=y(rows[i].depth),y3=y(r[r.length-1].depth+.5);
    b+=rect(125,y1,525,y2-y1,C.blue,.12)+rect(125,y2,525,y3-y2,C.red,.10);
    rows.slice(a,z+1).forEach((o,j,part)=>{if(j){const prev=part[j-1];b+=line(xg(prev.gr),y(prev.depth),xg(o.gr),y(o.depth),C.gold)+line(xr(prev.lr),y(prev.depth),xr(o.lr),y(o.depth),C.blue);}});
    [min,rows[i].depth,max].forEach(d=>b+=line(125,y(d),650,y(d),d===rows[i].depth?C.red:C.grid,d===rows[i].depth?'5 4':'')+text(112,y(d)+5,fmt(d,1),C.ink,'end'));
    b+=line(xg(lg),y1,xg(lg),y2,C.ink)+line(xg(rg),y2,xg(rg),y3,C.red)+line(xr(ll),y1,xr(ll),y2,C.ink)+line(xr(rl),y2,xr(rl),y3,C.red)+text(145,338,'黑=上侧均值；红=下侧均值')+text(70,365,'蓝灰阴影=候选上侧；浅红=下侧；MD向下增加');
    return{graphic:svg('两侧深度滑窗与GR及logRt的真实均值差',b,390),readout:'候选 '+fmt(rows[i].depth,1)+' m：GR上侧均值 '+fmt(lg)+'、下侧 '+fmt(rg)+' API，因此 |ΔGR|/70 = <strong>'+fmt(features[1],4)+'</strong>；logRt两侧均值 '+fmt(ll,3)+' 与 '+fmt(rl,3)+'，|ΔlogRt| = <strong>'+fmt(features[2],4)+'</strong>。交给原分类器的输入是 [1, '+fmt(features[1],4)+', '+fmt(features[2],4)+']。每侧实际覆盖 '+fmt(p.window*.5,1)+' m；移动候选深度看持续改变的两侧均值怎样分离。',source:live?'根据当前自然伽马（GR）与对数电阻率（logRt）曲线，比较候选位置上下两侧的平均响应；阈值与最小间距可在主流程查看。':'局部教学井有180个深度点；比较上下两侧均值差，GR差按70 API缩放形成一项特征。',state:{part:'workflow',inputs:p,index:i,depth:rows[i].depth,above:{count:l.length,from:l[0].depth,to:l[l.length-1].depth,gr:lg,logRt:ll},below:{count:r.length,from:r[0].depth,to:r[r.length-1].depth,gr:rg,logRt:rl},features,source:live?'CaseInspect.observations':'local rows'}};
  }
  const backgroundHTML=widget('background','沿同一深度轴看见“持续改变”','拖动界面位置会同时移动两道曲线的阶跃；尖峰只落在1210 m的一个GR采样点上。先判断改变占据多长井段，再谈候选边界。',range('boundary','持续改变位置 / m MD',1214,1228,.5,1222)+range('spike','1210 m单点GR增量 / API',0,90,5,60),background({boundary:1222,spike:60}));
  const workflowHTML=widget('workflow','滑窗究竟比较了哪些数据','把候选位置和每侧窗口长度展开到共同深度轴上。上下侧均值线与输入特征同时更新，可从原始曲线逐项核对。',range('index','候选采样序号（1200+0.5i m）',12,167,1,44)+range('window','每侧窗口 / 点',2,12,1,5),workflow({index:44,window:5},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:0,workflowAfter:0,backgroundHTML,workflowHTML,mount};
})(globalThis);
