(function(g){
  'use strict';
  const scene='w5';

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

  function rng(s){return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
  function data(seed,n){const r=rng(seed);return Array.from({length:n},(_,i)=>{const shale=i<55||i>118?.12:.78,phi=.18+.045*Math.sin(i/15+seed%13/3)+.025*(r()-.5),gr=25+100*shale+8*(r()-.5),lr=1.7-1.05*shale+1.1*phi+.12*(r()-.5),rhob=2.67-1.62*phi+.14*shale+.025*(r()-.5);return{depth:1500+i*.5,gr,lr,rhob};});}
  const train=data(1721,320),test=data(8801,180);
  function background(p){
    const a=Math.round(p.start),b=Math.min(177,a+Math.round(p.length)-1),obs=test.map((o,i)=>({...o,rhob:i>=a&&i<=b?null:o.rhob})),left=obs[a-1],right=obs[b+1],interp=i=>left.rhob+(right.rhob-left.rhob)*(i-a+1)/(b-a+2),y=d=>65+(d-1500)/89.5*250,xg=v=>155+v/140*125,xr=v=>335+(v-.5)/1.7*125,xd=v=>515+(v-2.1)/.6*125;
    let chart=text(65,24,'把缺口放回同一深度：辅助曲线还能看见内部变化')+text(155,48,'GR / API',C.gold)+text(335,48,'logRt',C.blue)+text(515,48,'RHOB / g·cm⁻³',C.red);
    chart+=rect(135,y(test[a].depth),525,y(test[b].depth+.5)-y(test[a].depth),C.gold,.13);
    [1500,1520,1540,1560,1580].forEach(d=>chart+=line(135,y(d),660,y(d))+text(123,y(d)+5,d,C.ink,'end'));
    chart+=path(obs.map(o=>[xg(o.gr),y(o.depth)]),C.gold,2)+path(obs.map(o=>[xr(o.lr),y(o.depth)]),C.blue,2);
    const pieces=[obs.slice(0,a),obs.slice(b+1)];pieces.forEach(rows=>chart+=path(rows.map(o=>[xd(o.rhob),y(o.depth)]),C.red,2.5));
    chart+=line(xd(left.rhob),y(left.depth),xd(right.rhob),y(right.depth),C.blue,'5 4')+dot(xd(left.rhob),y(left.depth),5,C.red)+dot(xd(right.rhob),y(right.depth),5,C.red)+[0,70,140].map(v=>text(xg(v),342,v,C.ink,'middle')).join('')+[.5,1.3,2.2].map(v=>text(xr(v),342,fmt(v,1),C.ink,'middle')).join('')+[2.1,2.4,2.7].map(v=>text(xd(v),342,fmt(v,1),C.ink,'middle')).join('')+text(70,372,'MD / m向下；金色阴影=遮蔽区，密度蓝虚线仅连接两端');
    const mid=Math.floor((a+b)/2);
    return{graphic:svg('GR电阻率密度共深度曲线与可移动密度缺口及端点插值',chart,400),readout:'遮蔽 '+fmt(obs[a].depth,1)+'—'+fmt(obs[b].depth,1)+' m，共 <strong>'+(b-a+1)+' 点</strong>。仅用可见端点 ('+fmt(left.depth,1)+' m, '+fmt(left.rhob,4)+') 与 ('+fmt(right.depth,1)+' m, '+fmt(right.rhob,4)+')，在 '+fmt(obs[mid].depth,1)+' m插值得 <strong>'+fmt(interp(mid),4)+' g/cm³</strong>。若辅助GR和Rt在阴影内转向，直线仍只知道两个端点。',source:'局部曲线逐项沿用 w5/engine.js 的TRAIN-1721与TEST-8801生成关系；密度先置空后计算插值，本单元未展示或使用缺口内原密度。',state:{part:'background',inputs:p,selected:[a,b],count:b-a+1,from:obs[a].depth,to:obs[b].depth,endpoints:[left,right],interpolationAt:{index:mid,depth:obs[mid].depth,value:interp(mid)},hiddenRHOBAreNull:obs.slice(a,b+1).every(o=>o.rhob===null)}};
  }
  function localObs(){return test.map((o,i)=>({...o,rhob:i>=100&&i<=137?null:o.rhob}));}
  function nearest(o,k,mode){const input=o=>mode==='gr'?[o.gr/100]:[o.gr/100,o.lr],q=input(o);return train.map((r,i)=>({i,depth:r.depth,gr:r.gr,lr:r.lr,rhob:r.rhob,distance:Math.sqrt(input(r).reduce((s,v,j)=>s+(v-q[j])**2,0))})).sort((a,b)=>a.distance-b.distance).slice(0,k);}
  function workflow(p,e,host){
    const live=e&&Array.isArray(e.observations)&&e.observations[0]&&'rhob'in e.observations[0],obs=live?e.observations:localObs(),missing=obs.flatMap((o,i)=>o.rhob===null?[i]:[]),relative=clamp(Math.round(p.point),0,Math.max(0,missing.length-1)),index=missing.length?missing[relative]:0,o=obs[index],near=nearest(o,p.k,p.mode),estimate=mean(near.map(n=>n.rhob)),a=missing[0],b=missing[missing.length-1],left=obs[a-1],right=obs[b+1],interpolation=left&&right&&Number.isFinite(left.rhob)&&Number.isFinite(right.rhob)?left.rhob+(right.rhob-left.rhob)*(index-a+1)/(b-a+2):null;
    if(host){const control=host.querySelector('[data-ct-input="point"]');if(control){control.max=Math.max(0,missing.length-1);control.value=relative;p.point=relative;}}
    const x=v=>80+(v-.2)/1.05*550,y=v=>280-(v-.45)/1.9*210,min=Math.min(...train.map(o=>o.rhob)),max=Math.max(...train.map(o=>o.rhob)),color=v=>{const f=clamp((v-min)/(max-min),0,1);return 'rgb('+Math.round(85+99*f)+','+Math.round(118-82*f)+','+Math.round(139-97*f)+')';};
    let chart=text(65,24,'从仍可见的辅助曲线检索独立训练井的相似点')+text(65,48,'log₁₀(Rt / 1 Ω·m)；颜色表示训练RHOB，朱红圈为选中近邻');
    [.5,1,1.5,2].forEach(v=>{chart+=line(80,y(v),630,y(v))+text(67,y(v)+5,fmt(v,1),C.ink,'end');});
    [.25,.5,.75,1,1.25].forEach(v=>chart+=text(x(v),310,fmt(v,2),C.ink,'middle'));
    train.forEach(t=>chart+=dot(x(t.gr/100),y(t.lr),3,color(t.rhob)));
    near.forEach(n=>chart+=dot(x(n.gr/100),y(n.lr),6.5,'none',C.red));
    chart+=line(x(o.gr/100)-10,y(o.lr),x(o.gr/100)+10,y(o.lr),C.gold)+line(x(o.gr/100),y(o.lr)-10,x(o.gr/100),y(o.lr)+10,C.gold)+dot(x(o.gr/100),y(o.lr),10,'none',C.gold);
    chart+=text(360,341,'GR / 100 API；金圈=缺测查询点',C.ink,'middle')+text(70,371,p.mode==='gr'?'本次仅按GR横向距离排序；图中Rt仍显示以便检查信息被舍弃的后果。':'本次按图中两个固定尺度坐标的欧氏距离排序。',C.blue);
    chart+=text(70,403,'训练RHOB / g·cm⁻³');for(let j=0;j<24;j++)chart+=rect(290+j*11,389,11.1,16,color(min+(max-min)*j/23));chart+=text(280,403,fmt(min,3),C.ink,'end')+text(565,403,fmt(max,3));
    const table='<details><summary>展开 '+near.length+' 个邻居的密度平均</summary><div class="ct-chart"><table><thead><tr><th>TRAIN-1721 点号</th><th>GR/100</th><th>logRt</th><th>距离</th><th>RHOB / g·cm⁻³</th></tr></thead><tbody>'+near.map(n=>'<tr><td>'+n.i+'</td><td>'+fmt(n.gr/100,4)+'</td><td>'+fmt(n.lr,4)+'</td><td>'+fmt(n.distance,5)+'</td><td>'+fmt(n.rhob,5)+'</td></tr>').join('')+'</tbody></table></div></details>';
    return{graphic:svg('辅助曲线特征空间中的密度修复查询点与实际近邻',chart,430),readout:'缺口内第 '+(relative+1)+'/'+missing.length+' 点，'+fmt(o.depth,1)+' m：GR='+fmt(o.gr,2)+' API，logRt='+fmt(o.lr,4)+'，查询RHOB='+String(o.rhob)+'。'+near.length+' 个训练邻居密度和 '+fmt(near.reduce((s,n)=>s+n.rhob,0),5)+' ÷ '+near.length+' = <strong>'+fmt(estimate,5)+' g/cm³</strong>；同深度端点插值为 '+fmt(interpolation,5)+' g/cm³。这里只展示两种估计，尚未解封缺口原密度评分。'+table,source:live?'读取当前 CaseInspect.observations 中带缺口曲线；独立训练库按原引擎TRAIN-1721固定种子重建320点，目标井缺口RHOB没有进入距离。':'局部TEST-8801的100—137号密度先置空；固定TRAIN-1721库320点。距离与k近邻平均严格沿用原引擎，不访问遮蔽区原值。',state:{part:'workflow',inputs:p,index,depth:o.depth,missingCount:missing.length,query:{gr:o.gr,grScaled:o.gr/100,logRt:o.lr,rhob:o.rhob},trainingCount:train.length,selectedIndices:near.map(n=>n.i),neighbors:near,estimatedRHOB:estimate,interpolation,hiddenTargetExcluded:o.rhob===null}};
  }
  const backgroundHTML=widget('background','端点直线忽略了缺口内的什么','移动缺口并改变长度，把两个密度端点与整段可见GR、Rt放在同一深度坐标。密度缺失区保持空白，蓝虚线只是可核对的端点运算。',range('start','缺口起点 / 采样序号',2,130,1,100)+range('length','缺口长度 / 点（0.5m采样）',4,45,1,38),background({start:100,length:38}));
  const workflowHTML=widget('workflow','不用缺口密度，也能明确列出修复依据','选择缺口中的一个查询点，改变k或移除Rt通道，观察被圈出的训练近邻怎样更换。修复值就是这些独立训练点的RHOB算术均值。',range('point','缺口内相对点序号',0,37,1,20)+range('k','近邻数量 k / 点',3,25,2,9)+select('mode','距离保留通道',[['all','GR/100 + logRt'],['gr','仅GR/100']],'all'),workflow({point:20,k:9,mode:'all'},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:1,backgroundHTML,workflowHTML,mount};
})(globalThis);
