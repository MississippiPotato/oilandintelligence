(function(g){
  'use strict';
  const scene='wo3';
  const DATA={"source":"wo3 engine seed 1503; no evaluation mask read by concept"};

  const P={red:'#B8242A',paper:'#F7F4EF',blue:'#55768B',gold:'#B08A4A',ink:'#283039',grid:'#D8D1C6'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const f=(v,d=1)=>v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v).toFixed(d):'不适用';
  const txt=(x,y,value,attr='')=>'<text x="'+x+'" y="'+y+'" '+attr+'>'+esc(value)+'</text>';
  const ln=(x1,y1,x2,y2,color=P.grid,width=1,dash='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
  const line=(points,color=P.red,width=3,dash='')=>points.length?'<polyline points="'+points.map(q=>q.map(v=>Number(v).toFixed(3)).join(',')).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>':'';
  const svg=(content,w=760,h=450,label='')=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'" style="display:block;width:100%;min-width:720px;height:auto"><rect width="'+w+'" height="'+h+'" fill="'+P.paper+'"/><g font-family="system-ui,Microsoft YaHei,sans-serif" font-size="16" fill="'+P.ink+'">'+content+'</g></svg>';
  function axes(o){const x=v=>o.x+(v-o.xmin)/(o.xmax-o.xmin)*o.w,y=v=>o.y+o.h-(v-o.ymin)/(o.ymax-o.ymin)*o.h;let s='';o.xticks.forEach(v=>{s+=ln(x(v),o.y,x(v),o.y+o.h)+txt(x(v),o.y+o.h+27,v,'text-anchor="middle"');});o.yticks.forEach(v=>{s+=ln(o.x,y(v),o.x+o.w,y(v))+txt(o.x-14,y(v)+6,v,'text-anchor="end"');});return s+ln(o.x,o.y,o.x,o.y+o.h,P.ink,1.5)+ln(o.x,o.y+o.h,o.x+o.w,o.y+o.h,P.ink,1.5)+txt(o.x+o.w/2,o.y+o.h+57,o.xlabel,'text-anchor="middle"')+txt(o.x,o.y-22,o.ylabel);}
  function sequential(value,a,b){const t=Math.max(0,Math.min(1,(value-a)/(b-a))),lo=[247,244,239],hi=[184,36,42];return 'rgb('+lo.map((v,i)=>Math.round(v+(hi[i]-v)*t)).join(',')+')';}
  function diverging(value,max){const t=Math.max(0,Math.min(1,Math.abs(value)/max)),lo=[247,244,239],hi=value<0?[85,118,139]:[184,36,42];return 'rgb('+lo.map((v,i)=>Math.round(v+(hi[i]-v)*t)).join(',')+')';}
  function colorbar(a,b,x,y,w,label){let s=txt(x,y-12,label);for(let i=0;i<30;i++)s+='<rect x="'+(x+i*w/30)+'" y="'+y+'" width="'+(w/30+.5)+'" height="16" fill="'+sequential(a+(b-a)*i/29,a,b)+'"/>';return s+txt(x,y+40,a)+txt(x+w,y+40,b,'text-anchor="end"');}
  const legend=(labels,colors,x,y,step)=>labels.map((v,i)=>'<circle cx="'+(x+i*step)+'" cy="'+(y-5)+'" r="5" fill="'+colors[i]+'"/>'+txt(x+12+i*step,y,v)).join('');
  const range=(name,label,value,min,max,step)=>'<label><span>'+esc(label)+' <output data-ct-output="'+name+'">'+esc(value)+'</output></span><input data-ct-control="'+name+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" disabled></label>';
  const sel=(name,label,value,options)=>'<label><span>'+esc(label)+'</span><select data-ct-control="'+name+'" disabled>'+options.map(q=>'<option value="'+esc(q[0])+'"'+(String(q[0])===String(value)?' selected':'')+'>'+esc(q[1])+'</option>').join('')+'</select></label>';
  const readParams=keys=>(snap,p)=>{const q=snap.params||{};let count=0;keys.forEach(k=>{if(Number.isFinite(Number(q[k]))&&q[k]!==null){p[k]=Number(q[k]);count++;}});return '已读取示范当前完成运行的 '+count+' 项输入；其余条件按图注固定。';};
  function register(backgroundAfter,workflowAfter){
    const css='<style>[data-concept-scene="'+scene+'"]{box-sizing:border-box;min-width:0;margin:24px 0;padding:22px;border:1px solid #D8D1C6;border-left:5px solid #B8242A;border-radius:12px;background:#F7F4EF;color:#283039;font-size:18px;line-height:1.7}[data-concept-scene="'+scene+'"] *{box-sizing:border-box}[data-concept-scene="'+scene+'"] h3{font-size:23px;line-height:1.45;margin:0 0 12px}[data-concept-scene="'+scene+'"] p{font-size:18px;margin:10px 0}[data-concept-scene="'+scene+'"] .ct-controls{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0;align-items:end}[data-concept-scene="'+scene+'"] label{display:flex;flex:1 1 220px;min-width:0;max-width:100%;flex-direction:column;font-size:18px;gap:8px}[data-concept-scene="'+scene+'"] input,[data-concept-scene="'+scene+'"] select,[data-concept-scene="'+scene+'"] button{font:inherit;max-width:100%;min-height:44px}[data-concept-scene="'+scene+'"] input[type=range]{width:100%;accent-color:#B8242A}[data-concept-scene="'+scene+'"] output{font-weight:700;color:#B8242A;white-space:nowrap}[data-concept-scene="'+scene+'"] button{border:1px solid #B8242A;border-radius:7px;padding:7px 15px;background:#FFFDF9;color:#B8242A;cursor:pointer}[data-concept-scene="'+scene+'"] button:disabled{opacity:.65;cursor:default}[data-concept-scene="'+scene+'"] .ct-chart{max-width:100%;overflow-x:auto;border-radius:8px}[data-concept-scene="'+scene+'"] figure{max-width:100%;min-width:0;margin:16px 0}[data-concept-scene="'+scene+'"] figcaption{font-size:16px;line-height:1.65;margin-top:12px;color:#525963}[data-concept-scene="'+scene+'"] .ct-readout{padding:14px;border-left:3px solid #B08A4A;background:#FFFDF9;overflow-wrap:anywhere}[data-concept-scene="'+scene+'"] [data-ct-message]{font-size:16px;color:#55768B}@media(max-width:600px){[data-concept-scene="'+scene+'"]{padding:15px 12px}[data-concept-scene="'+scene+'"] .ct-controls{display:grid;grid-template-columns:minmax(0,1fr)}[data-concept-scene="'+scene+'"] label{width:100%}}</style>';
    function html(part){const q=specs[part],out=q.render({...q.defaults},{});return css+'<section class="ct-widget" data-concept-scene="'+scene+'" data-concept-part="'+part+'"><h3>'+esc(q.title)+'</h3><p>'+esc(q.intro)+'</p><div class="ct-controls">'+q.controls(q.defaults)+'<button type="button" data-ct-action="reset" disabled>复位本单元</button>'+(q.read?'<button type="button" data-ct-action="read" disabled>读取示范当前输入</button>':'')+'</div><figure><div class="ct-chart" data-ct-graphic tabindex="0" aria-label="图表区域，可横向滚动">'+out.graphic+'</div><figcaption>'+esc(q.caption)+'</figcaption></figure><p class="ct-readout" data-ct-result aria-live="polite">'+esc(out.result)+'</p><p data-ct-message>默认图可直接阅读；进入可运行页面后启用控件。</p></section>';}
    function mount(root){root.querySelectorAll('[data-concept-scene="'+scene+'"]').forEach(host=>{if(host.dataset.ctReady)return;host.dataset.ctReady='true';const part=host.dataset.conceptPart,spec=specs[part];let p={...spec.defaults},env={};const inputs=[...host.querySelectorAll('[data-ct-control]')];host.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);
      function setControls(){let adjusted=false;inputs.forEach(el=>{const k=el.dataset.ctControl;if(el.type==='range'){const v=Math.max(Number(el.min),Math.min(Number(el.max),Number(p[k])));el.value=String(v);if(Number(el.value)!==p[k])adjusted=true;p[k]=Number(el.value);}else{el.value=String(p[k]);p[k]=typeof spec.defaults[k]==='number'?Number(el.value):el.value;}});return adjusted;}
      function draw(){inputs.forEach(el=>{const out=host.querySelector('[data-ct-output="'+el.dataset.ctControl+'"]');if(out)out.textContent=String(p[el.dataset.ctControl]);});const out=spec.render(p,env);host.querySelector('[data-ct-graphic]').innerHTML=out.graphic;host.querySelector('[data-ct-result]').textContent=out.result;host.dataset.ctState=JSON.stringify({scene,part,inputs:{...p},...out.state,source:env.source||'原案例数据与本单元明确输入'});}
      const change=e=>{const el=e.target.closest('[data-ct-control]');if(!el||!host.contains(el))return;const k=el.dataset.ctControl;p[k]=typeof spec.defaults[k]==='number'?Number(el.value):el.value;draw();};host.addEventListener('input',change);host.addEventListener('change',change);
      host.addEventListener('click',e=>{const b=e.target.closest('[data-ct-action]');if(!b||!host.contains(b))return;const message=host.querySelector('[data-ct-message]');if(b.dataset.ctAction==='reset'){p={...spec.defaults};env={};setControls();message.textContent='已恢复本单元默认输入。';draw();return;}if(b.dataset.ctAction==='read'){let snap;try{snap=g.CaseInspect?.snapshot?.();}catch(err){snap=null;}if(!snap||snap.sceneId!==scene||snap.status!=='completed'){message.textContent='请先在本案例可运行示范完成一次计算；当前继续使用本单元输入。';return;}message.textContent=spec.read(snap,p,env);env.source='CaseInspect 当前完成运行'+(snap.runId?' '+snap.runId:'');if(setControls())message.textContent+=' 超出本单元范围或步长的数值已按控件范围调整，当前输入见上方。';draw();}});
      setControls();draw();host.querySelector('[data-ct-message]').textContent='控件已启用；操作会立即重算本图与读数。';
    });}
    (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter,workflowAfter,backgroundHTML:html('background'),workflowHTML:html('workflow'),mount};
  }

  function matrix(p){let seed=1503;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),raw=[];for(let z=0;z<36;z++){raw[z]=[];for(let a=0;a<36;a++)raw[z][a]=p.ecc*Math.cos(a/36*2*Math.PI)+.4*p.ecc*Math.sin(a/36*2*Math.PI)+(z>=13&&z<=21&&a>=12&&a<=19?3:0)+(random()-.5)*.4;}const bg=Array.from({length:36},(_,a)=>{const v=raw.map(r=>r[a]).sort((a,b)=>a-b);return(v[17]+v[18])/2;});return {raw,bg,res:raw.map(r=>r.map((v,a)=>v-bg[a]))};}
  function heat(values,p,mask){
    const ox=90,oy=60,cell=8,groups=Array.from({length:13},()=>[]);let s='';
    values.forEach((row,z)=>row.forEach((v,a)=>{const b=Math.max(0,Math.min(12,Math.floor((v+5)/10*13)));groups[b].push('M'+(ox+a*cell)+' '+(oy+z*cell)+'h8v8h-8z');}));
    groups.forEach((d,i)=>{s+='<path d="'+d.join('')+'" fill="'+diverging(i/12*10-5,5)+'"/>';});
    if(mask){let d='';values.forEach((row,z)=>row.forEach((v,a)=>{if(v>p.threshold)d+='M'+(ox+a*cell)+' '+(oy+z*cell)+'h8v8h-8z';}));s+='<path d="'+d+'" fill="none" stroke="'+P.red+'" stroke-width="1.2"/>';}
    s+='<rect x="'+(ox+Number(p.angle)/10*cell)+'" y="'+(oy+Number(p.z)*10*cell)+'" width="8" height="8" fill="none" stroke="#151A1C" stroke-width="3"/>';
    [0,90,180,270,360].forEach(a=>s+=txt(ox+a/360*288,375,a+'°','text-anchor="middle"'));
    [0,1,2,3.5].forEach(z=>s+=txt(ox-12,oy+z/3.6*288+6,f(z,1),'text-anchor="end"'));
    s+=txt(85,408,'方位角 →（0° / 360°切口相邻）');s+=txt(26,32,'相对深度 m，向下增加');
    return s;
  }
  function render(p,workflow){const m=matrix(p),a=Math.round(p.angle/10)%36,z=Math.round(p.z*10),values=workflow?m.res:m.raw;
    let s=heat(values,p,workflow),xx=v=>465+v/35*250,yy=v=>310-(v+5)/10*220;
    s+=txt(452,34,workflow?'选中方位的深度曲线':'选中深度的圆周响应');
    if(workflow){
      const x=v=>465+(v+5)/10*250,y=v=>65+v/35*280;
      [-5,0,5].forEach(v=>{s+=ln(x(v),65,x(v),345,P.grid,1)+txt(x(v),375,v,'text-anchor="middle"');});
      s+=line(m.raw.map((r,i)=>[x(r[a]),y(i)]),P.blue,2)+line(m.res.map((r,i)=>[x(r[a]),y(i)]),P.red,3)+ln(x(p.threshold),65,x(p.threshold),345,P.gold,2,'5 4');
      s+=txt(453,408,'半径偏差 / 残差 mm →');
      s+=legend(['原始','去背景','阈值'],[P.blue,P.red,P.gold],452,448,95);
    }else{
      [-5,0,5].forEach(v=>s+=ln(465,yy(v),715,yy(v),P.grid,1)+txt(452,yy(v)+5,v,'text-anchor="end"'));
      s+=line(m.raw[z].map((v,i)=>[xx(i),yy(v)]),P.blue,3)+line(m.bg.map((v,i)=>[xx(i),yy(v)]),P.gold,2,'6 4');
      s+=ln(xx(a),65,xx(a),310,P.red,2)+txt(452,350,'0°                         350°');
      s+=txt(452,392,'纵轴：内半径偏差 mm');s+=legend(['该深度原始值','跨深度中位背景'],[P.blue,P.gold],452,445,170);
    }
    s+=txt(95,431,workflow?'颜色：残差 mm':'颜色：原始内半径偏差 mm');
    for(let i=0;i<30;i++)s+='<rect x="'+(95+i*9)+'" y="441" width="9.5" height="12" fill="'+diverging(-5+10*i/29,5)+'"/>';
    s+=txt(95,476,'−5')+txt(230,476,'0','text-anchor="middle"')+txt(365,476,'+5','text-anchor="end"');
    const raw=m.raw[z][a],bg=m.bg[a],res=m.res[z][a],count=m.res.flat().filter(v=>v>p.threshold).length;
    return {graphic:svg(s,760,480,workflow?'残差展开图及所选方位随深度的原始和去背景曲线':'套管圆周展开图与所选深度的圆周响应'),result:'选中 '+f(z/10,1)+' m、'+(a*10)+'°：原始 '+f(raw,3)+' − 方位背景 '+f(bg,3)+' = 残差 '+f(res,3)+' mm。'+(workflow?'全图超过 '+f(p.threshold,1)+' mm 的格子 '+count+' / 1296。':'金虚线由同一方位36个深度取中位数得到。'),state:{selected:{relativeDepth_m:z/10,azimuth_deg:a*10,raw_mm:raw,background_mm:bg,residual_mm:res},aboveThreshold:count,grid:[36,36],threshold_mm:p.threshold}};
  }
  const specs={
    background:{title:'展开图的一格，对应井筒的哪个深度与方向？',intro:'选择相对深度与方位，在共同坐标中读原始半径偏差。右图沿一整圈展开，金色背景跨多个深度估计；切口两边在实际圆周上相邻。',defaults:{ecc:2,z:1.7,angle:150,threshold:.9},controls:p=>range('z','相对深度 m',p.z,0,3.5,.1)+range('angle','方位角 °',p.angle,0,350,10)+range('ecc','仪器偏心 mm',p.ecc,0,5,.2),render:p=>render(p,false),caption:'来源：wo3/engine.js 相同种子1503、36×36采样与0.2 mm噪声，局部径向幅度固定3 mm。颜色范围固定−5至+5 mm；这是内半径偏差，不是剩余壁厚。'},
    workflow:{title:'按方位减去中位背景，局部异常还剩多少？',intro:'调整阈值后，红色格边立即显示实际分割；移动方位查看纵深剖面，蓝色是输入，红色是扣背景后的残差，金线是判定门槛。分割不读取参考掩膜。',defaults:{ecc:2,z:1.7,angle:150,threshold:.9},controls:p=>range('angle','方位角 °',p.angle,0,350,10)+range('ecc','仪器偏心 mm',p.ecc,0,5,.2)+range('threshold','残差阈值 mm',p.threshold,.2,2.5,.1),render:p=>render(p,true),read:readParams(['ecc','threshold']),caption:'对应流程第2–3步，原始值减该方位36点中位数后逐格阈值。为比较背景扣除，本单元保持缺陷幅度3 mm、噪声0.2 mm；完整示范保留其独立设置及IoU评价。'}
  };
  register(0,2);
})(globalThis);
