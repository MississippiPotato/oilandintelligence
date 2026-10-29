(function(g){
  'use strict';
  const scene='d1';

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

  // Local response and explicit constraint proxies are identical to engine.js.
  const feature=o=>{const w=o.wob/100,r=o.rpm/120,q=o.flow/26,h=o.ucs/60;return[w,r,q,h,w*w,r*r,q*q,w*r,w*h,q*h];};
  function response(o){const a=feature(o),w=a[0],r=a[1],q=a[2],h=a[3];return Math.max(2,10+28*w+24*r+12*q-10*w*w-8*r*r-6*q*q+9*w*r-12*h-6*w*h+5*q*h);}
  const mechanics=o=>({pressure:3+.016*o.flow*o.flow+.000015*o.wob*o.rpm,torque:.035*o.wob*(o.ucs/60)+.00018*o.wob*o.rpm});
  function background(p){
    const x=w=>70+(w-40)/120*580,y=v=>280-v/70*220,o={wob:p.wob,rpm:p.rpm,flow:p.flow,ucs:p.ucs},rop=response(o),m=mechanics(o);
    let b=text(70,25,'工况响应：同一钻压，在不同岩石强度下的钻速');
    [0,20,40,60].forEach(v=>{b+=line(70,y(v),650,y(v))+text(58,y(v)+5,v,C.ink,'end');});
    [40,80,120,160].forEach(v=>{b+=line(x(v),60,x(v),280)+text(x(v),305,v,C.ink,'middle');});
    const a=Array.from({length:61},(_,i)=>({wob:40+i*2,rpm:p.rpm,flow:p.flow,ucs:p.ucs}));
    b+=path(a.map(o=>[x(o.wob),y(response(o))]),C.red)+path(a.map(o=>[x(o.wob),y(response({...o,ucs:100}))]),C.blue,2);
    b+=line(x(p.wob),280,x(p.wob),y(rop),C.red,'5 4')+dot(x(p.wob),y(rop),6,C.red);
    b+=text(70,47,'ROP / m·h⁻¹')+text(360,335,'钻压 WOB / kN',C.ink,'middle')+text(400,47,'朱红：当前UCS；蓝灰：100 MPa',C.blue);
    return{graphic:svg('钻压、转速、排量和岩石强度共同改变教学钻速响应',b),readout:'当前教学响应 <strong>'+fmt(rop)+' m/h</strong>；有效钻进30 min对应进尺 <strong>'+fmt(rop*.5)+' m</strong>。同点压力代理 '+fmt(m.pressure)+' MPa、扭矩代理 '+fmt(m.torque)+' kN·m。改变钻压时先读曲线斜率，再看更高钻压是否仍带来同样增益。',state:{part:'background',inputs:p,rop,advance30min:rop*.5,...m,hardRockROP:response({...o,ucs:100})},source:'沿用 d1/engine.js 的 response 与 mechanical 显式教学式；曲线是局部工况响应，不是留出井误差。'};
  }
  function workflow(p,e){
    const train=e&&e.training,params=e&&e.params||{},ucs=Number.isFinite(params.ucs)?params.ucs:60,maxWob=params.maxWob||125,maxRpm=params.maxRpm||170;
    const predict=o=>train&&train.coef&&train.scaler?train.coef[0]+feature(o).reduce((s,v,j)=>s+(v-train.scaler.mean[j])/train.scaler.sd[j]*train.coef[j+1],0):response(o);
    const rows=[];
    for(let w=40;w<=160;w+=10)for(let r=60;r<=200;r+=10){const o={wob:w,rpm:r,flow:p.flow,ucs},m=mechanics(o),reasons=[];if(w>maxWob)reasons.push('钻压');if(r>maxRpm)reasons.push('转速');if(p.flow>(params.maxFlow||32))reasons.push('排量');if(m.pressure>p.pressure)reasons.push('泵压');if(m.torque>p.torque)reasons.push('扭矩');rows.push({...o,...m,estimate:predict(o),reasons});}
    const ok=rows.filter(o=>!o.reasons.length),best=ok.slice().sort((a,b)=>b.estimate-a.estimate)[0]||null;
    const x=v=>85+(v-40)/120*550,y=v=>275-(v-60)/140*205,min=Math.min(...rows.map(o=>o.estimate)),max=Math.max(...rows.map(o=>o.estimate));
    let b=text(70,25,'先预测，再筛查：固定排量切片中哪些点还可选？')+text(70,48,'RPM / r·min⁻¹');
    [60,100,140,180,200].forEach(v=>{b+=line(85,y(v),635,y(v))+text(72,y(v)+5,v,C.ink,'end');});
    [40,80,120,160].forEach(v=>b+=text(x(v),303,v,C.ink,'middle'));
    rows.forEach(o=>{const f=(o.estimate-min)/(max-min||1),c=o.reasons.length?'#C9C2BA':'rgb('+Math.round(235-51*f)+','+Math.round(187-151*f)+','+Math.round(165-123*f)+')';b+=dot(x(o.wob),y(o.rpm),7,c);if(o.reasons.length)b+=line(x(o.wob)-4,y(o.rpm)-4,x(o.wob)+4,y(o.rpm)+4,'#8B8176');});
    if(best)b+=dot(x(best.wob),y(best.rpm),11,'none',C.red);
    b+=text(370,335,'钻压 WOB / kN；朱红深浅表示预测钻速',C.ink,'middle');
    return{graphic:svg('固定排量下钻压转速候选点与可行集合',b),readout:'本切片 '+rows.length+' 点，符合5项上限的有 <strong>'+ok.length+' 点</strong>。'+(best?'其中最高预测为 '+fmt(best.estimate)+' m/h：WOB '+best.wob+' kN、RPM '+best.rpm+' r/min，压力 '+fmt(best.pressure)+' MPa、扭矩 '+fmt(best.torque)+' kN·m。到当前泵压上限的余量 '+fmt(p.pressure-best.pressure)+' MPa，到扭矩上限的余量 '+fmt(p.torque-best.torque)+' kN·m。':'当前切片没有可行点；先指出是哪一项上限排除了候选。')+' 当前泵压/扭矩上限为 '+fmt(p.pressure,1)+' MPa / '+fmt(p.torque,1)+' kN·m。灰叉仅表示越界，保留它们才能解释可行域怎样缩小。',source:train&&train.coef?'读取当前 CaseInspect 的冻结标准化器和岭回归系数；UCS '+ucs+' MPa；这是195点切片，原示范仍搜索2145点。':'局部教学响应式与同一5项约束；未连接当前训练代理。此195点切片用于讲清筛查动作。',state:{part:'workflow',inputs:p,ucs,maxWob,maxRpm,total:rows.length,feasible:ok.length,best,margin:best?{pressure:p.pressure-best.pressure,torque:p.torque-best.torque}:null,source:train&&train.coef?'CaseInspect.training':'local response',rejectedByPressure:rows.filter(o=>o.pressure>p.pressure).length,rejectedByTorque:rows.filter(o=>o.torque>p.torque).length}};
  }
  const bgDefaults={wob:90,rpm:120,flow:26,ucs:60},wfDefaults={flow:26,pressure:19.5,torque:9};
  const backgroundHTML=widget('background','改变钻头工况，读出钻速响应','先固定排量与转速，沿钻压轴比较当前地层和硬地层。所有滑块都进入同一教学响应式；曲线斜率回答“再加一点钻压有多大作用”。',range('wob','钻压 / kN',40,160,5,90)+range('rpm','转速 / r·min⁻¹',60,200,10,120)+range('flow','排量 / L·s⁻¹',18,38,2,26)+range('ucs','岩石强度 UCS / MPa',35,115,5,60),background(bgDefaults));
  const workflowHTML=widget('workflow','把最高钻速点放回可行集合','调低泵压或扭矩上限，观察具体候选怎样被排除。此处固定排量，只展开 WOB×RPM 切片；候选排序只用代理预测。',range('flow','本切片排量 / L·s⁻¹',18,38,2,26)+range('pressure','泵压上限 / MPa',8,30,.5,19.5)+range('torque','扭矩上限 / kN·m',4,20,.5,9),workflow(wfDefaults,null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:0,workflowAfter:3,backgroundHTML,workflowHTML,mount};
})(globalThis);
