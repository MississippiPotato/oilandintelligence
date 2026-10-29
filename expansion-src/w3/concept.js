(function(g){
  'use strict';
  const scene='w3';

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
    const row=a=>36+p.amplitude*Math.sin((a+p.phase)*Math.PI/180),x=a=>75+a/360*570,y=r=>60+r/72*240,curve=Array.from({length:97},(_,i)=>[i*360/96,row(i*360/96)]),upper=curve.map(v=>[x(v[0]),y(v[1]-1.1)]),lower=curve.slice().reverse().map(v=>[x(v[0]),y(v[1]+1.1)]);
    let b=text(65,24,'倾斜交线在井周展开坐标中形成周期轨迹')+text(65,47,'相对深度 / 像素行；没有米/像素标尺，不能换算倾角');
    [0,18,36,54,72].forEach(r=>{b+=line(75,y(r),645,y(r))+text(63,y(r)+5,r,C.ink,'end');});
    [0,90,180,270,360].forEach(a=>{b+=line(x(a),60,x(a),300)+text(x(a),326,a,C.ink,'middle');});
    b+='<polygon points="'+upper.concat(lower).map(v=>v.join(',')).join(' ')+'" fill="'+C.gold+'" opacity=".5"/>'+path(curve.map(v=>[x(v[0]),y(v[1])]),C.red,3)+line(x(p.azimuth),60,x(p.azimuth),300,C.blue,'4 4')+dot(x(p.azimuth),y(row(p.azimuth)),6,C.red)+text(360,356,'井周方位 / °；0°和360°是同一条展开缝',C.ink,'middle');
    const at=row(p.azimuth);
    return{graphic:svg('可调振幅相位的井壁展开周期曲线及像素带',b,380),readout:'当前曲线：行号 = 36 + '+p.amplitude+'·sin(方位+'+p.phase+'°)。方位 '+p.azimuth+'° 对应 <strong>'+fmt(at,2)+' 行</strong>；最高与最低行号分别为 '+fmt(36-p.amplitude,1)+' 和 '+fmt(36+p.amplitude,1)+'。0°与360°均为 '+fmt(row(0),2)+' 行，证明两端在圆周上连续。金色像素带按 |行号−中心|<1.1 选出。',source:'圆柱井壁展开后，中心线在0°与360°处相接；振幅以像素行为单位，表示图上偏移大小。',state:{part:'background',inputs:p,rowAtAzimuth:at,rowAt0:row(0),rowAt360:row(360),periodicSeamDifference:row(360)-row(0),minimumRow:36-p.amplitude,maximumRow:36+p.amplitude,bandHalfWidth:1.1}};
  }
  function rng(s){return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
  function image(){const r=rng(551),w=96,h=72,pixels=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const center=32+551%7+(10+551%8)*Math.sin(2*Math.PI*x/w+(551%11)/11*2*Math.PI),narrow=Math.abs(y-center)<1.1,band=x>20+551%40&&x<25+551%40,bg=.66+.08*Math.sin(y/5);pixels.push(clamp(bg-(narrow?.4:0)-(band?.27:0)+.28*(r()-.5),0,1));}return{w,h,pixels};}
  const localImage=image(),frozen=[-2.7252029174174104,-.5684784144491513,1.2881819110954784,-.2915478666473558];
  function feat(im,x,y){const at=(a,b)=>im.pixels[clamp(b,0,im.h-1)*im.w+((a+im.w)%im.w)];return[1,1-at(x,y),((at(x,y-3)+at(x,y+3))/2-at(x,y))*4,Math.abs(at(x-2,y)-at(x+2,y))*2];}
  function maskRows(mask,w,h,x0,y0,scale){
    let out='';for(let y=0;y<h;y++){let start=-1;for(let x=0;x<=w;x++){const on=x<w&&mask[y*w+x];if(on&&start<0)start=x;if(!on&&start>=0){out+=rect(x0+start*scale,y0+y*scale,(x-start)*scale,scale+.02,C.red);start=-1;}}}return out;
  }
  function workflow(p,e){
    const view=e&&e.views&&e.views.find(v=>v.kind==='image'),im=view&&Array.isArray(view.pixels)?{w:view.w,h:view.h,pixels:view.pixels}:localImage,m=view&&e.training&&e.training.coefficients?e.training.coefficients:frozen,x=clamp(Math.round(p.column),0,im.w-1),y=clamp(Math.round(p.row),0,im.h-1),f=feat(im,x,y),terms=f.map((v,i)=>v*m[i]),logit=terms.reduce((s,v)=>s+v,0),selectedScore=1/(1+Math.exp(-logit)),scores=im.pixels.map((_,i)=>{const v=feat(im,i%im.w,Math.floor(i/im.w));return 1/(1+Math.exp(-v.reduce((s,a,j)=>s+a*m[j],0)));}),mask=scores.map(v=>v>p.threshold),scale=2.75,x0=70,x1=380,y0=75;
    let b=text(65,24,'在一个像素上展开局部特征，再看它进入哪一张掩膜')+text(x0,50,'原始响应（2×2均值预览）')+text(x1,50,'模型掩膜（全部像素判断）');
    for(let yy=0;yy<im.h;yy+=2)for(let xx=0;xx<im.w;xx+=2){const values=[];for(let dy=0;dy<2&&yy+dy<im.h;dy++)for(let dx=0;dx<2&&xx+dx<im.w;dx++)values.push(im.pixels[(yy+dy)*im.w+xx+dx]);const gray=Math.round(mean(values)*255);b+=rect(x0+xx*scale,y0+yy*scale,2*scale+.02,2*scale+.02,'rgb('+gray+','+gray+','+gray+')');}
    b+=rect(x1,y0,im.w*scale,im.h*scale,'#E7DED2')+maskRows(mask,im.w,im.h,x1,y0,scale);
    [x0,x1].forEach(start=>{const px=start+(x+.5)*scale,py=y0+(y+.5)*scale;b+=line(px-10,py,px+10,py,C.gold)+line(px,py-10,px,py+10,C.gold)+dot(px,py,8,'none',C.gold)+text(start,300,'0°')+text(start+im.w*scale/2,300,'180°',C.ink,'middle')+text(start+im.w*scale,300,'360°',C.ink,'end');});
    [0,36,71].forEach(v=>b+=text(58,y0+(v+.5)*scale+5,v,C.ink,'end'));
    b+=text(70,332,'行号向下；金色十字是同一个被检查像素')+text(70,360,'像素('+x+','+y+')：暗度 '+fmt(f[1],3)+'；上下反差 '+fmt(f[2],3)+'；横向差分 '+fmt(f[3],3));
    return{graphic:svg('井壁响应预览与全分辨率掩膜以及局部像素十字定位',b,385),readout:'像素('+x+','+y+')的输入 [1, '+f.slice(1).map(v=>fmt(v,4)).join(', ')+']；冻结点积 z = '+terms.map(v=>fmt(v,3)).join(' + ')+' = '+fmt(logit,4)+'；得分 <strong>'+fmt(selectedScore,4)+'</strong>，在门槛 '+fmt(p.threshold,3)+' 下'+(selectedScore>p.threshold?'选中':'未选中')+'。全图选中 <strong>'+mask.filter(Boolean).length+'/'+mask.length+' 像素</strong>。将十字移到宽纵条带，比较暗度与上下反差为何给出不同信息；阈值改变不重画原始响应。',source:view?'根据当前归一化图像与训练得到的系数，重新计算四项特征和每个像素的分数。':'当前TEST-551教学图像使用4幅训练图像得到的系数，逐像素计算特征和分数。',state:{part:'workflow',inputs:p,image:{width:im.w,height:im.h},selectedPixel:{column:x,row:y,value:im.pixels[y*im.w+x],features:f,terms,score:selectedScore,selected:selectedScore>p.threshold},selectedCount:mask.filter(Boolean).length,pixelCount:mask.length,coefficients:m,source:view?'CaseInspect raw pixels':'local TEST-551'}};
  }
  const backgroundHTML=widget('background','改变展开曲线，量出方位与行号','用方位和相对深度建立可计算坐标。改变振幅、相位与检查方位，观察同一周期曲线和窄像素带的几何关系。',range('amplitude','起伏振幅 / 像素行',4,24,1,16)+range('phase','曲线相位 / °',0,360,15,30)+range('azimuth','检查方位 / °',0,360,15,90),background({amplitude:16,phase:30,azimuth:90}));
  const workflowHTML=widget('workflow','从灰度邻域走到一个像素的判断','十字在原始响应和掩膜上共同定位。原图预览合并2×2像素以便浏览，模型仍逐一计算全部96×72个像素；上下邻域和横向差分均沿用原方法。',range('column','检查列号 / 像素',0,95,1,48)+range('row','检查行号 / 像素',0,71,1,28)+range('threshold','像素得分门槛',.05,.6,.025,.2),workflow({column:48,row:28,threshold:.2},null));

  (g.S17Concepts||(g.S17Concepts={}))[scene]={backgroundAfter:1,workflowAfter:1,backgroundHTML,workflowHTML,mount};
})(globalThis);
