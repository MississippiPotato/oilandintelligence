(function(g){
  'use strict';
  const scene='d4';

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
  function signal(seed,wear,load,noise){const r=rng(seed);return Array.from({length:128},(_,i)=>load*Math.sin(2*Math.PI*5*i/128)+wear*.7*Math.sin(2*Math.PI*25*i/128)+noise*.4*(r()-.5));}
  function spectrum(s){return Array.from({length:41},(_,f)=>{let re=0,im=0;s.forEach((v,i)=>{re+=v*Math.cos(2*Math.PI*f*i/128);im+=v*Math.sin(2*Math.PI*f*i/128);});return{f,amplitude:2*Math.hypot(re,im)/128,power:(re*re+im*im)/(128*128)};});}
  function features(s,sp){const rms=Math.sqrt(mean(s.map(v=>v*v))),ratio=sp[25].power/(sp[5].power+.02),peak=Math.max(...s.map(Math.abs))/(rms||1);return[1,rms,ratio,peak];}
  function signalChart(s,sp,title){
    const timeMax=Math.max(1,...s.map(Math.abs)),x=t=>75+t*1140,yt=v=>115-v/timeMax*45,xf=f=>75+f/40*570,max=Math.max(1,...sp.map(o=>o.amplitude)),yf=v=>305-v/max*115;
    let b=text(65,24,title)+text(65,47,'加速度 / g；上图只画前0.5 s，下图投影使用完整1 s');
    [-timeMax,0,timeMax].forEach(v=>{b+=line(75,yt(v),645,yt(v))+text(63,yt(v)+5,fmt(v,1),C.ink,'end');});
    b+=path(s.slice(0,65).map((v,i)=>[x(i/128),yt(v)]),C.blue,1.8)+text(650,151,'0.5 s',C.ink,'end')+text(65,184,'DFT单边幅值 / g；频率间隔1 Hz');
    sp.forEach(o=>{b+=line(xf(o.f),305,xf(o.f),yf(o.amplitude),(o.f===5?C.gold:o.f===25?C.red:C.blue));});
    [0,5,10,20,25,30,40].forEach(f=>b+=text(xf(f),329,f,C.ink,'middle'));
    b+=text(360,356,'频率 / Hz；金=5 Hz负荷，朱红=25 Hz教学退化成分',C.ink,'middle');
    return svg(title,b,380);
  }
  function background(p){
    const s=Array.from({length:128},(_,i)=>p.load*Math.sin(2*Math.PI*5*i/128)+p.high*Math.sin(2*Math.PI*25*i/128)),sp=spectrum(s),f=features(s,sp),hfFraction=sp[25].power/(sp[5].power+sp[25].power||1);
    return{graphic:signalChart(s,sp,'合成两种频率，再用128点DFT把它们分开'),readout:'RMS = <strong>'+fmt(f[1],3)+' g</strong>；5 Hz幅值 '+fmt(sp[5].amplitude,3)+' g，25 Hz幅值 '+fmt(sp[25].amplitude,3)+' g；这两条频率的高频能量占比 <strong>'+fmt(hfFraction*100,1)+'%</strong>。把两个振幅对调，RMS保持相同，谱峰位置和高频占比会改变。',source:'本例以5 Hz表示负荷变化、25 Hz表示教学退化频带，按128 Hz采样并以128点成窗；去掉噪声便于观察频率投影。25 Hz是本例的教学设定。',state:{part:'background',inputs:p,rms:f[1],spectrum:sp,hfFraction,energySum:mean(s.map(v=>v*v))}};
  }
  const frozen=[-.9209605462155437,.831805355001334,3.113289527548455,-.541803706567627];
  function workflow(p,e){
    const live=e&&Array.isArray(e.observations)&&Array.isArray(e.observations[0]),n=live?e.observations.length:90,index=clamp(Math.round(p.cursor),0,n-1),s=live?e.observations[index]:signal(900+index,index<50?.2:1.4,1.1,1),sp=spectrum(s),f=features(s,sp),m=live&&e.training&&e.training.model?e.training.model:frozen,terms=m.map((v,i)=>v*f[i]),logit=terms.reduce((a,v)=>a+v,0),probability=1/(1+Math.exp(-logit)),label=probability>p.threshold;
    return{graphic:signalChart(s,sp,'当前窗口 '+index+'：从同一波形算出三个输入特征'),readout:'RMS = √mean(a²) = <strong>'+fmt(f[1],4)+' g</strong>；25 Hz/5 Hz功率比（分母另加0.02 g²）= <strong>'+fmt(f[2],4)+'</strong>；峰值因子 max|a|/RMS = <strong>'+fmt(f[3],4)+'</strong>。冻结系数点积 z='+terms.map(v=>fmt(v,3)).join(' + ')+' = '+fmt(logit,3)+'，sigmoid(z) = <strong>'+fmt(probability,4)+'</strong>，在门槛 '+fmt(p.threshold,2)+' 下输出“'+(label?'退化候选':'正常候选')+'”。此分数未做概率校准。',source:live?'根据当前振动窗口的加速度重新计算特征，并与训练模型比较。':'局部教学信号按窗口生成；模型系数来自160个训练窗口。',state:{part:'workflow',inputs:p,window:index,nSamples:s.length,features:{rms:f[1],hfLfRatio:f[2],crestFactor:f[3]},frequency5:sp[5],frequency25:sp[25],coefficients:m,terms,logit,score:probability,threshold:p.threshold,predictedDegraded:label}};
  }
  const backgroundHTML=widget('background','相同总体强度，可以有不同频率组成','分别调节负荷主频与教学退化频带的振幅。时域相加、频域投影、RMS和频带能量均由这128个采样点直接计算。',range('load','5 Hz负荷振幅 / g',.2,2.3,.1,1.1)+range('high','25 Hz成分振幅 / g',0,1.6,.1,.7),background({load:1.1,high:.7}));
  const workflowHTML=widget('workflow','把一个窗口真正变成模型输入','切换窗口后，先核对频谱，再看RMS、频带功率比和峰值因子怎样进入同一冻结分类器。门槛只改变判定，不会重写波形或模型。',range('cursor','测试窗口序号',0,89,1,63)+range('threshold','未校准分数门槛',.1,.9,.05,.5),workflow({cursor:63,threshold:.5},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:0,backgroundHTML,workflowHTML,mount};
})(globalThis);
