(function(g){
  'use strict';
  const scene='d2';

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

  function background(p){
    const rows=Array.from({length:61},(_,i)=>{const q=25+(i>=20?p.flowStep:0),expected=4+.18*q+.012*100,extra=i>=40?p.extra:0;return{t:i,q,expected,measured:expected+extra,residual:extra};});
    const x=t=>75+t/60*570,yq=q=>130-(q-20)/15*75,yp=v=>300-(v-8)/6*110;
    let b=text(70,24,'同一时间轴：流量变化能解释多少压力变化？')+text(70,48,'Q / L·s⁻¹；20 min改变排量，40 min加入附加压力');
    [20,25,30,35].forEach(v=>{b+=line(75,yq(v),645,yq(v))+text(63,yq(v)+5,v,C.ink,'end');});
    b+=path(rows.map(o=>[x(o.t),yq(o.q)]),C.gold)+text(70,172,'P / MPa；蓝灰=正常关系，朱红=测得压力');
    [8,10,12,14].forEach(v=>{b+=line(75,yp(v),645,yp(v))+text(63,yp(v)+5,v,C.ink,'end');});
    b+=path(rows.map(o=>[x(o.t),yp(o.expected)]),C.blue)+path(rows.map(o=>[x(o.t),yp(o.measured)]),C.red);
    [20,40].forEach(t=>b+=line(x(t),55,x(t),300,C.ink,'4 5'));
    [0,20,40,60].forEach(t=>b+=text(x(t),325,t,C.ink,'middle'));
    b+=text(360,355,'时间 / min',C.ink,'middle');
    const a=rows[60];
    return{graphic:svg('流量阶跃与附加压力在共同时间轴上的响应',b,375),readout:'排量改变 '+fmt(p.flowStep,1)+' L/s，正常压力随之改变 <strong>'+fmt(.18*p.flowStep)+' MPa</strong>；40 min后测得 '+fmt(a.measured)+' MPa，正常关系预测 '+fmt(a.expected)+' MPa，残差仍为 <strong>'+fmt(a.residual)+' MPa</strong>。把附加压力调为0，检验“泵压上升”是否足以形成偏离线索。',state:{part:'background',inputs:p,normalPressure:a.expected,measuredPressure:a.measured,residual:a.residual,flowPressureChange:.18*p.flowStep},source:'沿用 d2/engine.js 中 P=4+0.18Q+0.012RPM；为便于分辨因果，本单元去掉噪声、固定RPM=100。附加压力只表示未被正常关系解释的部分。'};
  }
  function local(){
    const rows=Array.from({length:210},(_,i)=>{const q=25+2*Math.sin(i/17),rpm=100+15*Math.sin(i/25),expected=4+.18*q+.012*rpm,extra=i>=125&&i<165?1.4*(i-124)/40:0;return{minute:i,q,rpm,pressure:expected+extra+.04*Math.sin(i*2.4)+(i===70?.65:0),expected};});
    return{observations:rows,expected:rows.map(o=>o.expected)};
  }
  function workflow(p,e){
    const source=e&&Array.isArray(e.observations)&&Array.isArray(e.expected)?e:local(),rows=source.observations,expected=source.expected,res=rows.map((o,i)=>o.pressure-expected[i]),avg=res.map((_,i)=>mean(res.slice(Math.max(0,i-p.window+1),i+1))),alerts=avg.map(v=>v>p.threshold),first=alerts.findIndex(Boolean),firstEvent=alerts.findIndex((v,i)=>v&&rows[i].minute>=125&&rows[i].minute<165),normalAlerts=alerts.filter((v,i)=>v&&(rows[i].minute<125||rows[i].minute>=165)).length;
    const x=i=>75+i/(rows.length-1)*570,max=Math.max(1.6,p.threshold+.15,...res),min=Math.min(-.15,...res),y=v=>280-(v-min)/(max-min)*210;
    let b=text(70,25,'从逐窗作差到仅看过去的滑动平均')+text(70,48,'残差 / MPa；浅蓝=瞬时，朱红=尾随均值，金线=门槛');
    [0,.5,1,1.5].forEach(v=>{b+=line(75,y(v),645,y(v))+text(63,y(v)+5,fmt(v,1),C.ink,'end');});
    b+=path(res.map((v,i)=>[x(i),y(v)]),'#A9B9C3',1.5)+path(avg.map((v,i)=>[x(i),y(v)]),C.red)+line(75,y(p.threshold),645,y(p.threshold),C.gold,'6 4');
    if(first>=0)b+=dot(x(first),y(avg[first]),6,C.red)+text(x(first),Math.max(68,y(avg[first])-12),'首个越阈',C.red,'middle');
    [0,50,100,150,209].filter(i=>i<rows.length).forEach(i=>b+=text(x(i),309,rows[i].minute,C.ink,'middle'));
    b+=text(360,340,'时间 / min；均值只包含当前和前 '+(p.window-1)+' 窗',C.ink,'middle');
    const cursor=Math.min(rows.length-1,Math.max(0,(firstEvent>=0?firstEvent:140))),from=Math.max(0,cursor-p.window+1),sum=res.slice(from,cursor+1).reduce((a,v)=>a+v,0);
    return{graphic:svg('真实残差序列与可调尾随平均',b,365),readout:'示例在 '+rows[cursor].minute+' min：'+(cursor-from+1)+' 个已到达窗口的残差和 '+fmt(sum)+' MPa ÷ '+(cursor-from+1)+' = <strong>'+fmt(avg[cursor])+' MPa</strong>。全序列越阈 '+alerts.filter(Boolean).length+' 窗；125—164 min内'+(firstEvent>=0?'首次越阈 '+rows[firstEvent].minute+' min，对145 min参考时点为 '+(145-rows[firstEvent].minute)+' min。':'没有越阈。')+' 正常区段越阈 '+normalAlerts+'/170 窗。改变窗口宽度会改变尖峰压低程度，也可能延迟持续变化的显露。',source:source===e?'读取当前 CaseInspect.observations 与 expected；只用可见压力和已冻结正常预测计算。':'局部210窗教学序列，包含70 min孤立尖峰与125—164 min持续附加项；不是当前演示的正式评价。',state:{part:'workflow',inputs:p,source:source===e?'CaseInspect':'local teaching series',residual:res,averaged:avg,firstThresholdMinute:first<0?null:rows[first].minute,firstInInjectedInterval:firstEvent<0?null:rows[firstEvent].minute,normalAlerts,normalDenominator:170,example:{minute:rows[cursor].minute,from:rows[from].minute,sum,count:cursor-from+1,average:avg[cursor]}}};
  }
  const backgroundHTML=widget('background','泵压上升，先扣掉工况的正常贡献','把排量阶跃和附加压力分开调节。两条压力曲线之间的竖直距离就是残差；排量增加会同时移动正常预测和测得压力。',range('flowStep','20 min后排量增量 / L·s⁻¹',-4,8,1,3)+range('extra','40 min后附加压力 / MPa',0,2.4,.1,.8),background({flowStep:3,extra:.8}));
  const workflowHTML=widget('workflow','亲自组成每一个尾随残差窗口','在同一段压力记录上改变窗口长度与门槛。首个越阈点、持续变化区间和正常段越阈数都重新计算；平均绝不读取未来窗口。',range('window','尾随平均长度 / 窗',1,15,1,5)+range('threshold','均值越阈门槛 / MPa',.1,1.5,.05,.45),workflow({window:5,threshold:.45},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:0,workflowAfter:1,backgroundHTML,workflowHTML,mount};
})(globalThis);
