(function(g){
  'use strict';
  const scene='w2';

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

  // Frozen all-channel ridge coefficients calculated by the original CAL-313 engine, 120 calibration points.
  const localCoef=[1.2041923829842258,-.4559435441904773,.24724292312037924,.02808795765956521];
  function background(p){
    const phi=(p.matrix-p.bulk)/(p.matrix-p.fluid),x=v=>80+v/.55*555,y=v=>285-(v-.8)/2.1*215;
    let b=text(65,25,'同一个体积密度，骨架和流体假设决定密度孔隙度')+text(65,48,'密度 / g·cm⁻³；直线为 ρb=(1−φ)ρma+φρf');
    [1,1.5,2,2.5].forEach(v=>{b+=line(80,y(v),635,y(v))+text(67,y(v)+5,fmt(v,1),C.ink,'end');});
    [0,.1,.2,.3,.4,.5].forEach(v=>b+=text(x(v),311,fmt(v*100,0),C.ink,'middle'));
    b+=path([[x(0),y(p.matrix)],[x(.55),y(.45*p.matrix+.55*p.fluid)]],C.blue)+line(80,y(p.bulk),635,y(p.bulk),C.gold,'5 4');
    if(phi>=0&&phi<=.55)b+=line(x(phi),285,x(phi),y(p.bulk),C.red,'5 4')+dot(x(phi),y(p.bulk),7,C.red)+text(x(phi)+10,y(p.bulk)-10,fmt(phi*100,1)+'%',C.red);
    b+=text(360,341,'孔隙度 φ / %；横虚线为测得RHOB',C.ink,'middle');
    return{graphic:svg('密度混合线和孔隙度反演交点随假设变化',b,365),readout:'φD = ('+fmt(p.matrix)+'−'+fmt(p.bulk)+') / ('+fmt(p.matrix)+'−'+fmt(p.fluid)+') = <strong>'+fmt(phi*100,2)+'%</strong>。'+(phi>=0&&phi<=1?'若岩石总体积1000 cm³，该假设对应孔隙体积 '+fmt(phi*1000,1)+' cm³、骨架体积 '+fmt((1-phi)*1000,1)+' cm³。':'结果超出0—100%，先复核密度与两端元假设。')+' 测得RHOB不变时，改变ρma仍会移动交点，这就是解释中的假设依赖。',source:'沿用 w2/knowledge.md 的密度混合式及原引擎固定端元2.65/1.03 g·cm⁻³；本单元开放端元用来检验假设，不给出岩性唯一结论。',state:{part:'background',inputs:p,densityPorosity:phi,poreVolumeFor1000cm3:phi*1000,solidVolumeFor1000cm3:(1-phi)*1000,withinPhysicalRange:phi>=0&&phi<=1}};
  }
  function rng(s){return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
  function localRows(){const r=rng(819);return Array.from({length:120},(_,i)=>{const sh=r(),phi=.06+.25*r(),rh=2.65*(1-phi)+1.03*phi+.12*sh+.025*(r()-.5),np=phi+.10*sh+.035*(r()-.5),gr=25+105*sh+8*(r()-.5);return{rh,np,gr,depth:1800+i*.5};});}
  const rowsLocal=localRows();
  function workflow(p,e){
    const live=e&&Array.isArray(e.observations)&&e.observations[0]&&Number.isFinite(e.observations[0].rh),rows=live?e.observations:rowsLocal,mode=live&&e.params&&e.params.mode==='density'?'density':'all',m=live&&e.training&&e.training.coefficients?e.training.coefficients:localCoef,i=clamp(Math.round(p.index),0,rows.length-1),raw=rows[i],o={...raw,gr:raw.gr+p.grChange,np:raw.np+p.neutronChange},feat=mode==='density'?[1,o.rh]:[1,o.rh,o.np,o.gr/100],terms=m.map((v,j)=>v*feat[j]),prediction=terms.reduce((s,v)=>s+v,0),density=(2.65-o.rh)/1.62;
    const x=v=>80+(v-2.1)/.65*550,y=v=>280-(v+.05)/.5*210,predict=(rh,gr)=>mode==='density'?m[0]+m[1]*rh:m[0]+m[1]*rh+m[2]*o.np+m[3]*gr/100;
    let b=text(65,25,'同一密度响应切片：其他可见通道怎样改变孔隙度解释？')+text(65,48,'预测孔隙度 / %；当前NPHI='+fmt(o.np,3)+' v/v');
    [0,.1,.2,.3,.4].forEach(v=>{b+=line(80,y(v),630,y(v))+text(67,y(v)+5,fmt(v*100,0),C.ink,'end');});
    [2.1,2.3,2.5,2.7].forEach(v=>b+=text(x(v),310,fmt(v,1),C.ink,'middle'));
    const rho=Array.from({length:66},(_,j)=>2.1+j*.01);
    b+=path(rho.map(v=>[x(v),y(predict(v,o.gr))]),C.red)+path(rho.map(v=>[x(v),y((2.65-v)/1.62)]),C.blue,2);
    if(mode==='all')b+=path(rho.map(v=>[x(v),y(predict(v,raw.gr))]),C.gold,2);
    b+=dot(x(o.rh),y(prediction),7,C.red)+dot(x(o.rh),y(density),5,C.blue)+line(x(o.rh),y(prediction),x(o.rh),y(density),C.ink,'4 4')+text(360,340,'RHOB / g·cm⁻³；朱红=学习解释，蓝灰=固定密度公式',C.ink,'middle');
    const names=mode==='density'?['截距','RHOB']:['截距','RHOB','NPHI','GR/100'];
    const table='<div class="ct-chart"><table><caption>同一点的系数乘输入，可逐项加回预测值</caption><thead><tr><th>项</th><th>输入</th><th>冻结系数</th><th>乘积 / v·v⁻¹</th></tr></thead><tbody>'+m.map((v,j)=>'<tr><td>'+names[j]+'</td><td>'+fmt(feat[j],4)+'</td><td>'+fmt(v,5)+'</td><td>'+fmt(terms[j],5)+'</td></tr>').join('')+'</tbody></table></div>';
    return{graphic:svg('冻结多道孔隙度解释对密度的响应切片',b,365),readout:'深度 '+fmt(o.depth,1)+' m；调整后的观测GR '+fmt(o.gr,1)+' API、NPHI '+fmt(o.np,3)+' v/v。'+(mode==='density'?'当前原示范只保留RHOB，GR和NPHI改动不会进入这个冻结模型。':'调整后的GR '+fmt(o.gr,1)+' API、NPHI '+fmt(o.np,3)+' v/v进入冻结模型。')+' 逐项求和得 <strong>'+fmt(prediction*100,2)+'%</strong>，固定密度公式为 '+fmt(density*100,2)+'%；两者差 '+fmt((prediction-density)*100,2)+' 个百分点。这里比较的是两种解释，未打开该点岩心参考值。'+table,source:live?'读取当前 CaseInspect.observations 与 training.coefficients，沿用当前模型保留通道；原岩心测试值未参与本单元。':'局部CAL-313冻结系数（120标定点）与TEST-819可见曲线；从原引擎复算后固定，未使用TEST孔隙度。',state:{part:'workflow',inputs:p,index:i,mode,observation:o,rawObservation:raw,features:feat,coefficients:m,terms,predictedPorosity:prediction,densityFormula:density,differencePercentagePoints:100*(prediction-density)}};
  }
  const backgroundHTML=widget('background','从体积密度反解孔隙度','测得RHOB是一个观测，骨架密度与流体密度是解释假设。拖动端元后，混合线和反解交点共同变化；图中保留实际单位。',range('bulk','测得RHOB / g·cm⁻³',2.1,2.7,.01,2.35)+range('matrix','假设骨架ρma / g·cm⁻³',2.5,2.85,.01,2.65)+range('fluid','假设流体ρf / g·cm⁻³',.8,1.2,.01,1.03),background({bulk:2.35,matrix:2.65,fluid:1.03}));
  const workflowHTML=widget('workflow','把可见曲线逐项送入冻结解释式','选择一个留出深度点，局部改变GR或中子响应，再核对系数乘输入和。改变仅用于观察模型响应，原示范数据与岩心值保持独立。',range('index','留出点序号（1800+0.5i m）',0,119,1,35)+range('grChange','GR局部改变量 / API',-20,40,5,0)+range('neutronChange','NPHI局部改变量 / v·v⁻¹',-.08,.08,.01,0),workflow({index:35,grChange:0,neutronChange:0},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:1,backgroundHTML,workflowHTML,mount};
})(globalThis);
