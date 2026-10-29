(function(g){
  'use strict';
  const scene='w4';

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

  const labels=['砂岩','泥岩','灰岩'],colors=[C.gold,'#8B969D',C.blue];
  function sample(label,phi,j){
    const g=[31,112,22][label]+7*Math.sin(j*1.9),lr=[1.30,.62,1.75][label]+.13*Math.cos(j*1.3),matrix=[2.65,2.73,2.71][label],rho=matrix*(1-phi)+phi*1.05+.012*Math.sin(j),np=phi+[-.015,.09,.015][label]+.01*Math.cos(j*1.1);
    return{raw:[g,lr,rho,np],label,wellId:'LOCAL-TRAIN-'+(label+1),depth:1500+j*.5};
  }
  const localSamples=Array.from({length:90},(_,j)=>{const label=Math.floor(j/30),phi=[.14,.21,.07][label]+(j%30)/29*[.12,.10,.12][label];return sample(label,phi,j);});
  function background(p){
    const references=localSamples.filter((_,i)=>i%2===0),base=[31,1.3,2.65*(1-p.phi)+p.phi*1.05,p.phi-.015],query=[base[0],base[1]+.7*p.gas,base[2]-.09*p.gas,base[3]-.09*p.gas],xg=v=>75+v/140*245,yr=v=>280-(v-.2)/2.5*210,xd=v=>410+(v-2.05)/.65*240,yn=v=>280-(v+.05)/.5*210;
    let b=text(65,25,'同一砂岩教学对象：孔隙与含气扰动会移动哪些测井响应？')+text(75,48,'logRt 对 GR')+text(410,48,'NPHI 对 RHOB');
    [0,50,100].forEach(v=>b+=text(xg(v),309,v,C.ink,'middle'));[2.1,2.3,2.5,2.7].forEach(v=>b+=text(xd(v),309,fmt(v,1),C.ink,'middle'));
    [0,.2,.4].forEach(v=>{b+=line(410,yn(v),650,yn(v))+text(398,yn(v)+5,fmt(v,1),C.ink,'end');});
    [.5,1.5,2.5].forEach(v=>{b+=line(75,yr(v),320,yr(v))+text(63,yr(v)+5,fmt(v,1),C.ink,'end');});
    references.forEach(o=>b+=dot(xg(o.raw[0]),yr(o.raw[1]),3.8,colors[o.label])+dot(xd(o.raw[2]),yn(o.raw[3]),3.8,colors[o.label]));
    b+=line(xg(base[0]),yr(base[1]),xg(query[0]),yr(query[1]),C.red)+dot(xg(base[0]),yr(base[1]),7,'none',C.red)+dot(xg(query[0]),yr(query[1]),7,C.red)+line(xd(base[2]),yn(base[3]),xd(query[2]),yn(query[3]),C.red)+dot(xd(base[2]),yn(base[3]),7,'none',C.red)+dot(xd(query[2]),yn(query[3]),7,C.red);
    b+=text(195,340,'GR / API',C.ink,'middle')+text(530,340,'RHOB / g·cm⁻³',C.ink,'middle')+text(70,369,'参考点：金=砂岩；灰=泥岩；蓝灰=灰岩；红空心=扰动前，实心=扰动后');
    return{graphic:svg('双交会图中孔隙度和含气响应扰动的可计算位移',b,395),readout:'同一对象GR固定 <strong>'+fmt(query[0],1)+' API</strong>；logRt由 '+fmt(base[1],2)+' 变 '+fmt(query[1],2)+'（Rt '+fmt(10**query[1],2)+' Ω·m），RHOB '+fmt(base[2],3)+'→'+fmt(query[2],3)+' g/cm³，NPHI '+fmt(base[3],3)+'→'+fmt(query[3],3)+' v/v。低GR本身未指明砂岩或灰岩；其他道也受孔隙与流体改变，分类还需查看训练依据。',source:'局部参考点沿用 w4/engine.js 三类响应均值、骨架/流体混合与孔隙范围；含气项严格为logRt+0.7、RHOB−0.09、NPHI−0.09的可调教学扰动。参考云不是实测岩性边界。',state:{part:'background',inputs:p,before:base,after:query,resistivity:10**query[1],delta:{gr:query[0]-base[0],logRt:query[1]-base[1],rhob:query[2]-base[2],nphi:query[3]-base[3]},referenceCount:references.length}};
  }
  function local(index){
    const j=index%90,label=Math.floor(j/30),q=sample(label,[.18,.25,.13][label]+.025*Math.sin(index),index+101),channels=[0,1,2,3],mu=channels.map(k=>mean(localSamples.map(s=>s.raw[k]))),sd=channels.map((k,i)=>Math.sqrt(mean(localSamples.map(s=>(s.raw[k]-mu[i])**2)))||1);
    const validation=Array.from({length:60},(_,v)=>{const c=Math.floor(v/20),phi=[.14,.21,.07][c]+(v%20)/19*[.12,.10,.12][c];return sample(c,phi,v+301);}),distances=validation.map(v=>Math.min(...localSamples.map(s=>Math.sqrt(mean(channels.map((k,i)=>((s.raw[k]-v.raw[k])/sd[i])**2)))))).sort((a,b)=>a-b),distanceLimit=Math.max(.35,distances[Math.floor((distances.length-1)*.95)]*1.4);
    return{raw:q.raw,observation:{wellId:'LOCAL-QUERY',depth:1500+index*.5},channels,scaler:{mean:mu,sd},distanceLimit,neighbors:localSamples.map(s=>({...s,x:s.raw,distance:Math.sqrt(mean(channels.map((k,i)=>((s.raw[k]-q.raw[k])/sd[i])**2)))})).sort((a,b)=>a.distance-b.distance).slice(0,15)};
  }
  function workflow(p,e,host){
    const index=clamp(Math.round(p.index),0,e&&e.observations?e.observations.length-1:319),live=e&&e.predictions&&e.predictions[index]&&Array.isArray(e.predictions[index].neighbors),o=live?e.observations[index]:null,t=live?e.training:null,ctx=live?{raw:[o.gr,Math.log10(Math.max(.01,o.rt)),o.rhob,o.nphi],observation:o,channels:t.channels,scaler:t.scaler,distanceLimit:t.distanceLimit,neighbors:e.predictions[index].neighbors}:local(index),channels=ctx.channels,available=ctx.neighbors.length,k=clamp(Math.round(p.neighbors),1,available);
    if(host){const control=host.querySelector('[data-ct-input="neighbors"]');if(control){control.max=available;control.value=k;p.neighbors=k;}}
    const neighbors=ctx.neighbors.slice(0,k).map(n=>({...n,distance:Math.sqrt(mean(channels.map((j,i)=>((n.x[j]-ctx.raw[j])/ctx.scaler.sd[i])**2)))})),votes=[0,0,0],sums=[0,0,0];
    neighbors.forEach(n=>{votes[n.label]++;sums[n.label]+=n.distance;});const ranking=[0,1,2].sort((a,b)=>votes[b]-votes[a]||sums[a]-sums[b]),proposed=ranking[0],support=votes[proposed]/k,reasons=[];if(support<p.support)reasons.push('近邻分歧');if(neighbors[0].distance>ctx.distanceLimit)reasons.push('远离训练样本');
    const z=raw=>channels.map((j,i)=>(raw[j]-ctx.scaler.mean[i])/ctx.scaler.sd[i]),queryZ=z(ctx.raw),neighborZ=neighbors.map(n=>z(n.x)),extent=Math.ceil(Math.max(2,...queryZ.map(Math.abs),...neighborZ.flat().map(Math.abs))),x=i=>channels.length===1?360:100+i/(channels.length-1)*510,y=v=>280-(v+extent)/(2*extent)*210,names=['GR','logRt','RHOB','NPHI'];
    let b=text(65,25,'用训练均值与标准差比较通道，再计算近邻距离与票数')+text(65,48,'标准化值 z；朱红=查询点，细线=训练近邻');
    [-extent,0,extent].forEach(v=>{b+=line(85,y(v),640,y(v))+text(72,y(v)+5,fmt(v,0),C.ink,'end');});
    channels.forEach((j,i)=>{b+=line(x(i),70,x(i),280)+text(x(i),309,names[j],C.ink,'middle');});
    neighborZ.forEach((zz,i)=>{b+=path(zz.map((v,j)=>[x(j),y(v)]),colors[neighbors[i].label],1.5)+zz.map((v,j)=>dot(x(j),y(v),3,colors[neighbors[i].label])).join('');});
    b+=path(queryZ.map((v,i)=>[x(i),y(v)]),C.red,4)+queryZ.map((v,i)=>dot(x(i),y(v),6,C.red)).join('')+text(70,340,'d = √mean[(z训练−z查询)²]；只在当前保留的 '+channels.length+' 个通道上求距离');
    const table='<details><summary>展开这 '+k+' 个近邻的来源与重算距离</summary><div class="ct-chart"><table><thead><tr><th>近邻来源</th><th>深度 / m</th><th>训练岩性</th><th>距离</th></tr></thead><tbody>'+neighbors.map(n=>'<tr><td>'+esc(n.wellId)+'</td><td>'+fmt(n.depth,1)+'</td><td>'+labels[n.label]+'</td><td>'+fmt(n.distance,5)+'</td></tr>').join('')+'</tbody></table></div></details>';
    return{graphic:svg('训练尺度下查询点与近邻的标准化平行坐标',b,365),readout:esc(ctx.observation.wellId)+'，'+fmt(ctx.observation.depth,1)+' m：砂/泥/灰票数 = '+votes.join(' / ')+'，提议“'+labels[proposed]+'”，支持度 '+votes[proposed]+'/'+k+' = <strong>'+fmt(support*100,1)+'%</strong>。最近距离 '+fmt(neighbors[0].distance,4)+'，训练距离上限 '+fmt(ctx.distanceLimit,4)+'；本单元门槛 '+fmt(p.support*100,0)+'%，结果为 <strong>'+(reasons.length?'待复核（'+reasons.join('、')+'）':labels[proposed])+'</strong>。同票时按同类近邻距离和打破平局。'+table,source:live?'读取当前 CaseInspect 的测试曲线、训练标准化器和已返回近邻；可检查的近邻上限为当前冻结k='+available+'。本单元重新计票，不改写原判定。':'局部90个训练参考、60个验证点与独立查询；距离门槛按验证最近距离95%分位×1.4、至少0.35计算，票数与双拒判条件沿用原引擎。不是原320点评价。',state:{part:'workflow',inputs:p,index,channels,query:ctx.raw,queryZ,availableNeighbors:available,k,votes,proposed,support,nearestDistance:neighbors[0].distance,distanceLimit:ctx.distanceLimit,reasons,result:reasons.length?-1:proposed,neighbors:neighbors.map(n=>({wellId:n.wellId,depth:n.depth,label:n.label,distance:n.distance}))}};
  }
  const backgroundHTML=widget('background','同一低GR对象，其他道为何还会移动','先在两个交会图中读四道观测。孔隙度控制骨架—流体混合，含气教学扰动改变电阻率、密度与中子响应；红色查询点的位置由公式直接计算。',range('phi','教学砂岩孔隙度 / v·v⁻¹',.10,.30,.01,.20)+range('gas','含气教学扰动比例',0,1,.1,0),background({phi:.2,gas:0}));
  const workflowHTML=widget('workflow','一票从哪里来，为什么有时仍要复核','选择留出点，展开当前训练近邻在各保留通道上的标准化响应。再改变计票邻居数和支持门槛，核对多数票、距离与拒判理由。',range('index','两口留出井合并点序号',0,319,1,80)+range('neighbors','用于本单元计票的近邻数',1,15,1,9)+range('support','本单元支持门槛',.3,1,.05,.6),workflow({index:80,neighbors:9,support:.6},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:3,backgroundHTML,workflowHTML,mount};
})(globalThis);
