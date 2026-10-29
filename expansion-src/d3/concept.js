(function(g){
  'use strict';
  const scene='d3';

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
    const angles=[0,p.first,p.second],points=[[0,0]],segments=[];
    angles.forEach((a,i)=>{const dx=100*Math.sin(a*Math.PI/180),dz=100*Math.cos(a*Math.PI/180),last=points[points.length-1];points.push([last[0]+dx,last[1]+dz]);segments.push({md:100,inclination:a,dx,dz,doglegPer30m:i?Math.abs(a-angles[i-1])*.3:0});});
    const end=points[3],x=v=>90+v*.9,y=v=>55+v*.78;
    let b=text(65,25,'每一段沿井眼100 m，按井斜分解成横向与垂向增量');
    [0,100,200,300].forEach(v=>{b+=line(90,y(v),610,y(v))+text(76,y(v)+5,v,C.ink,'end');});
    [0,100,200,300,400,500].forEach(v=>b+=text(x(v),315,v,C.ink,'middle'));
    points.slice(1).forEach((v,i)=>{const a=points[i];b+=line(x(a[0]),y(a[1]),x(v[0]),y(a[1]),C.gold,'5 4')+line(x(v[0]),y(a[1]),x(v[0]),y(v[1]),C.blue,'5 4')+text(x(v[0])+10,y(v[1])-10,(i+1)*100+' m MD',C.red);});
    b+=path(points.map(a=>[x(a[0]),y(a[1])]),C.red,4)+points.map(a=>dot(x(a[0]),y(a[1]),5,C.red)).join('');
    b+=line(x(end[0]),y(end[1]),x(0),y(end[1]),C.blue,'5 4')+text(95,345,'横向位移 / m；纵向为真垂深TVD，向下增加');
    b+=text(380,65,'金虚线：Δx；蓝虚线：ΔTVD',C.blue);
    return{graphic:svg('三段井眼长度与垂深分解',b,370),readout:'总 MD = <strong>300 m</strong>；TVD = 100 + '+fmt(segments[1].dz)+' + '+fmt(segments[2].dz)+' = <strong>'+fmt(end[1])+' m</strong>；横向位移 '+fmt(end[0])+' m。第二到第三段的二维狗腿度为 |'+p.second+'−'+p.first+'|° ÷100 m ×30 m = <strong>'+fmt(segments[2].doglegPer30m)+' °/30m</strong>。两个井斜设成一样时，这个局部转角为0，但MD仍大于TVD。',source:'沿用 d3/knowledge.md 的 MD/TVD 定义与 engine.js 的 Δx=ΔMD·sinθ、ΔTVD=ΔMD·cosθ；此处放大为三段100 m以便量测。二维转角只作教学近似。',state:{part:'background',inputs:p,segments,totalMD:300,tvd:end[1],horizontal:end[0],mdMinusTvd:300-end[1]}};
  }
  function plan(gain,target,limit){
    let x=0,z=0,angle=0;const points=[[0,0]],commands=[];
    for(let i=0;i<60;i++){const desired=Math.atan2(target.x-x,Math.max(20,target.z-z)),u=clamp((desired-angle)/Math.max(.1,gain),-limit,limit);commands.push(u);angle+=gain*u;x+=10*Math.sin(angle);z+=10*Math.cos(angle);points.push([x,z]);}
    return{points,commands};
  }
  function execute(gain,commands,limit){
    let x=0,z=0,a=0,violations=0;const points=[[0,0]];
    commands.forEach(u=>{a+=gain*u;if(Math.abs(gain*u)>limit*1.01)violations++;x+=10*Math.sin(a);z+=10*Math.cos(a);points.push([x,z]);});
    return{points,violations};
  }
  function workflow(p,e){
    const gain=e&&e.training&&Number.isFinite(e.training.gain)?e.training.gain:.6895356253303119,target={x:e&&e.params?e.params.targetX:180,z:e&&e.params?e.params.targetZ:550},limit=p.limit*Math.PI/180/3;
    const candidates=[];
    for(let aim=-40;aim<=40;aim+=4){const a=plan(gain,{x:target.x+aim,z:target.z},limit),end=a.points[60];candidates.push({aim,error:Math.hypot(end[0]-target.x,end[1]-target.z),plan:a});}
    candidates.sort((a,b)=>a.error-b.error);const selected=candidates[0],actual=execute(p.future,selected.plan.commands,limit),end=actual.points[60],error=Math.hypot(end[0]-target.x,end[1]-target.z);
    const x=v=>80+v*.75,y=v=>55+v*.4;
    let b=text(65,25,'先冻结计划动作，再改变未来增益执行这60个动作')+text(65,48,'TVD / m；蓝灰=标定增益下的计划，朱红=实际执行');
    [0,150,300,450,600].forEach(v=>{b+=line(80,y(v),620,y(v))+text(67,y(v)+5,v,C.ink,'end');});
    [0,150,300,450,600].forEach(v=>b+=text(x(v),318,v,C.ink,'middle'));
    b+=path(selected.plan.points.map(v=>[x(v[0]),y(v[1])]),C.blue,3)+path(actual.points.map(v=>[x(v[0]),y(v[1])]),C.red,3)+dot(x(target.x),y(target.z),8,C.gold,C.ink)+line(x(end[0]),y(end[1]),x(target.x),y(target.z),C.red,'5 4')+text(x(target.x)+13,y(target.z)+5,'目标',C.ink)+text(370,347,'横向位移 / m；总MD固定600 m',C.ink,'middle');
    return{graphic:svg('标定增益规划与未来增益执行的井眼路径比较',b,370),readout:'标定增益 <strong>'+fmt(gain,3)+'</strong>；21个横向补偿中选 '+selected.aim+' m，计划端点偏差 '+fmt(selected.error)+' m。执行阶段只把增益换成 '+fmt(p.future,2)+'，末端变为 ('+fmt(end[0])+', '+fmt(end[1])+') m，距原目标 <strong>'+fmt(error)+' m</strong>，实际转角超限 '+actual.violations+'/60 步。每步指令上限 '+fmt(p.limit/3)+'°；改变未来增益不会重新挑选一套对未来“知情”的动作。',source:e?'读取当前 CaseInspect 的 training.gain 与目标位置；本单元按原引擎21候选、60×10m、逐段限幅重算。':'局部复算：增益0.6895356253来自原引擎80条标定试验；目标(180,550)m，未使用未来执行误差选计划。',state:{part:'workflow',inputs:p,learnedGain:gain,target,md:600,candidateCount:21,selectedAim:selected.aim,plannedError:selected.error,actualEnd:end,actualError:error,violations:actual.violations,commands:selected.plan.commands,path:actual.points}};
  }
  const backgroundHTML=widget('background','亲手分解测深、垂深和横向位移','井斜角从竖直方向量起。改变后两段井斜，同一300 m测深会投影到不同垂深；虚线给出每一段可核对的三角分解。',range('first','第二段井斜 / °',0,60,5,30)+range('second','第三段井斜 / °',0,75,5,50),background({first:30,second:50}));
  const workflowHTML=widget('workflow','为什么学对响应还要检验未来执行','比较计划与执行两条路径。转角上限进入计划搜索；未来增益仅进入动作执行。原目标来自当前示范，读取后保持同一评价目标。',range('future','未来转向增益 / 无量纲',.35,1.3,.05,.75)+range('limit','指令狗腿度上限 / °·(30m)⁻¹',2,12,.5,7),workflow({future:.75,limit:7},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:0,workflowAfter:1,backgroundHTML,workflowHTML,mount};
})(globalThis);
