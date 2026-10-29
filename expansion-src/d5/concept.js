(function(g){
  'use strict';
  const scene='d5';

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

  const feature=o=>[1,o.solid/10,o.polymer,o.temp/100,(o.solid/10)**2,o.polymer*o.temp/100];
  const response=o=>7+1.2*o.solid+9*o.polymer-.07*(o.temp-25)+.09*o.solid**2+.045*o.polymer*o.temp;
  function background(p){
    const pv=response(p),yp=8,stress=g=>yp+pv*.001*g,x=g=>75+g/1000*570,max=Math.max(65,stress(1000)*1.1),y=v=>285-v/max*220;
    let b=text(65,25,'把配方和温度换成一条真正可量斜率的流变线')+text(65,48,'剪切应力 τ / Pa；固定教学屈服应力 YP=8 Pa');
    [0,20,40,60].filter(v=>v<=max).forEach(v=>{b+=line(75,y(v),645,y(v))+text(63,y(v)+5,v,C.ink,'end');});
    [0,200,400,600,800,1000].forEach(v=>b+=text(x(v),310,v,C.ink,'middle'));
    b+=path([[x(0),y(stress(0))],[x(1000),y(stress(1000))]],C.red,4)+line(x(200),y(stress(200)),x(800),y(stress(200)),C.gold,'5 4')+line(x(800),y(stress(200)),x(800),y(stress(800)),C.blue,'5 4')+dot(x(200),y(stress(200)),5,C.red)+dot(x(800),y(stress(800)),5,C.red)+text(x(800)+10,(y(stress(200))+y(stress(800)))/2,'Δτ',C.blue)+text(360,340,'剪切速率 γ̇ / s⁻¹；虚线三角形跨600 s⁻¹',C.ink,'middle');
    return{graphic:svg('配方温度决定PV并改变宾汉流变曲线斜率',b,365),readout:'当前配方教学PV = <strong>'+fmt(pv)+' mPa·s</strong> = '+fmt(pv*.001,5)+' Pa·s。γ̇从200增至800 s⁻¹，应力增加 '+fmt(stress(800)-stress(200))+' Pa；Δτ/Δγ̇ = '+fmt((stress(800)-stress(200))/600,5)+' Pa·s。τ(0)=8 Pa是截距，<strong>不是PV</strong>。',source:'沿用 d5/engine.js 的配方—温度 response 与 knowledge.md 的宾汉关系；YP固定8 Pa只用于量测斜率，未推断实际携屑能力。',state:{part:'background',inputs:p,pvMilliPascalSecond:pv,pvPascalSecond:pv*.001,yp,stressAt200:stress(200),stressAt800:stress(800),deltaStress:stress(800)-stress(200),slope:(stress(800)-stress(200))/600}};
  }
  function workflow(p,e){
    const coef=e&&e.training&&e.training.coefficients,predict=o=>coef?feature(o).reduce((s,v,i)=>s+v*coef[i],0):response(o),rows=[];
    for(let si=0;si<=24;si++)for(let ai=1;ai<=15;ai++){const o={solid:2+si*.5,polymer:ai/10,temp:p.temp},pv=predict(o),cost=.3*o.solid+4*o.polymer;rows.push({...o,pv,cost,feasible:pv>=p.min&&pv<=p.max,objective:Math.abs(pv-p.target)+.4*cost});}
    const feasible=rows.filter(o=>o.feasible).sort((a,b)=>a.objective-b.objective),best=feasible[0]||null,x=v=>85+(v-2)/12*550,y=v=>280-(v-.1)/1.4*210;
    let b=text(65,25,'在配方平面上先保留PV合格的点，再比较目标与代价')+text(65,48,'聚合物质量/体积浓度 / g·(100mL)⁻¹');
    [.1,.5,.9,1.3,1.5].forEach(v=>{b+=line(85,y(v),635,y(v))+text(72,y(v)+5,fmt(v,1),C.ink,'end');});
    [2,5,8,11,14].forEach(v=>b+=text(x(v),309,v,C.ink,'middle'));
    rows.forEach(o=>{b+=dot(x(o.solid),y(o.polymer),4.8,o.feasible?C.red:'#CEC7BD');});
    if(best)b+=dot(x(best.solid),y(best.polymer),9,'none',C.gold);
    b+=text(360,340,'固相体积分数 / %；朱红=PV区间内，金圈=当前排序第一',C.ink,'middle');
    return{graphic:svg('配方网格可行集合随温度与PV上下限变化',b,365),readout:'可行 <strong>'+feasible.length+'/'+rows.length+' 点</strong>；'+(best?'首选固相 '+fmt(best.solid,1)+'%、聚合物 '+fmt(best.polymer,1)+' g/100mL，预测PV '+fmt(best.pv)+' mPa·s。目标偏差 '+fmt(Math.abs(best.pv-p.target))+' +0.4×相对代价 '+fmt(best.cost)+'，合成排序值 '+fmt(best.objective)+'。':'没有候选满足 '+p.min+'≤PV≤'+p.max+'；若下限高于上限，这是空约束集合。')+' 该代价由0.3×固相+4×聚合物计算，为无量纲教学值。',source:coef?'读取当前 CaseInspect.training.coefficients，按原引擎6项特征预测375个配方；目标与成本权重沿用原式。':'局部教学响应式用于375点可行域演练；未连接当前训练系数，不把此排序当作实际配方建议。',state:{part:'workflow',inputs:p,source:coef?'CaseInspect.training.coefficients':'local response',total:rows.length,feasible:feasible.length,best,minimumPV:Math.min(...rows.map(o=>o.pv)),maximumPV:Math.max(...rows.map(o=>o.pv))}};
  }
  const backgroundHTML=widget('background','用一条流变线量出塑性黏度','改变固相、聚合物和温度，先计算PV，再把mPa·s换成Pa·s进入τ=YP+PV·γ̇。高剪切区的斜率三角形随配方一起变化。',range('solid','固相体积分数 / %',2,14,.5,6)+range('polymer','聚合物 / g·(100mL)⁻¹',.1,1.5,.1,.7)+range('temp','温度 / ℃',25,125,5,75),background({solid:6,polymer:.7,temp:75}));
  const workflowHTML=widget('workflow','可行配方是筛出来的集合','逐点按当前温度预测PV，先应用上下限，再按目标偏差与相对代价排序。把下限调到高于上限，观察空集合由什么产生。',range('temp','搜索温度 / ℃',25,125,5,75)+range('min','PV下限 / mPa·s',5,60,1,15)+range('max','PV上限 / mPa·s',10,80,1,45)+range('target','目标PV / mPa·s',10,60,1,30),workflow({temp:75,min:15,max:45,target:30},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:2,backgroundHTML,workflowHTML,mount};
})(globalThis);
