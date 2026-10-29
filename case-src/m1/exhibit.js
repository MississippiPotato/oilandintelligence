(function (g) {
  'use strict';
  const C = g.M1Core;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(digits);
  const pct = value => value == null ? '—' : fmt(100 * value, 1) + '%';
  const names = ['砂岩教学外观', '泥岩教学外观', '灰岩教学外观', '待复核'];
  const colors = ['#B8242A', '#687F94', '#B78B45', '#AAA7A3'];
  const shortNames = ['砂岩外观', '泥岩外观', '灰岩外观', '待复核'];
  const sourceLink = (label, url) => '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>';
  const sourceNote = '<p class="fx-note">专业依据：' + sourceLink('SLB 岩屑与录井介绍', 'https://www.slb.com/resource-library/oilfield-review/defining-series/defining-mud-logging') + '。本例将观察线索、图像判断与样品统计逐层连接。</p>';

  function photoCards() {
    const rows = g.M1RealData?.images ?? [];
    return [['sandstone','砂岩','砂岩是砂粒等被天然胶结物固结起来的岩石。这组照片呈灰绿、细粒的外观，先比较颗粒感、纹理与颜色的组合。'], ['shale','页岩','页岩是细粒、常沿薄层劈开的沉积岩。这组照片能看到明暗带与暗裂隙；一起比较明暗带、裂隙与薄层结构。'], ['limestone','灰岩','灰岩主要由方解石构成；方解石是一种碳酸钙矿物。两张照片明暗差别明显，比较细密底子、浅色团块与表面纹理。']].map(([key, title, text]) => {
      const pair = rows.filter(row => row.label === key);
      if (!pair.length) return '<article class="fx-card"><h3>' + title + '</h3><p>' + text + '</p></article>';
      return '<figure class="fx-card m1-real-photo" data-m1-photo="' + key + '"><img src="' + pair[0].dataURL + '" alt="' + title + '真实岩芯照片一，原图块2×2厘米" width="280" height="280" style="width:100%;height:230px;object-fit:contain;background:#F0ECE5;border-radius:14px"><figcaption><h3>' + title + '</h3><p>' + text + '</p><div class="fx-toolbar">' + pair.map((p, i) => '<button type="button" data-m1-photo-src="' + p.dataURL + '" data-m1-photo-label="' + title + '真实岩芯照片' + (i + 1) + '，原图块2×2厘米" aria-pressed="' + String(i === 0) + '">照片' + (i + 1) + '</button>').join('') + '</div></figcaption></figure>';
    }).join('');
  }

  function staticFeatureFigure() {
    if (!C || !g.S17Images) return '';
    const sample = g.S17Images.sample(17, {}, 1).observations;
    const im = C.calibrated(sample.white, sample.calibration, true);
    const component = C.segment(im).components[0];
    const [x0,y0,x1,y1] = component.bbox;
    const cy = Math.floor((y0+y1)/2), inside=new Set(component.indices), xs = Array.from({length:x1-x0}, (_, i) => x0+i);
    const values = xs.map(x => inside.has(cy*im.width+x)?(im.pixels[(cy*im.width+x)*4]+im.pixels[(cy*im.width+x)*4+1]+im.pixels[(cy*im.width+x)*4+2])/3:null);
    const runs=[];let run=[];values.forEach((value,i)=>{if(value==null){if(run.length)runs.push(run);run=[];}else run.push({x:xs[i],value});});if(run.length)runs.push(run);
    const palette=new Map();
    for(let y=y0;y<y1;y++){let x=x0;while(x<x1){const start=x,offset=(y*im.width+x)*4,rgb=[...im.pixels.slice(offset,offset+3)].join(',');x++;while(x<x1&&[...im.pixels.slice((y*im.width+x)*4,(y*im.width+x)*4+3)].join(',')===rgb)x++;palette.set(rgb,(palette.get(rgb)??'')+'M'+(start-x0)+' '+(y-y0)+'h'+(x-start)+'v1h-'+(x-start)+'Z');}}
    const sourcePixels=[...palette].map(([rgb,path])=>'<path d="'+path+'" fill="rgb('+rgb+')"/>').join('');
    const profile=runs.map(points=>'<polyline points="'+points.map(p=>(300+(p.x-x0)/Math.max(1,x1-x0-1)*510).toFixed(2)+','+(200-p.value/255*155).toFixed(2)).join(' ')+'" fill="none" stroke="#B8242A" stroke-width="2.5"/>').join('');
    const scan=runs.map(points=>'<path d="M'+(points[0].x-x0)+' '+(cy-y0+.5)+'h'+(points.at(-1).x-points[0].x+1)+'"/>').join('');
    return '<figure class="fx-chart" data-m1-scan-valid="'+values.filter(v=>v!=null).length+'" data-m1-scan-background="'+values.filter(v=>v==null).length+'"><div style="overflow-x:auto"><svg viewBox="0 0 860 260" style="width:100%;min-width:860px" role="img" aria-label="左侧为实际颗粒局部及红色扫描线，右侧只画扫描行中属于轮廓的像素亮度，背景位置断开"><g transform="translate(28 55) scale(3.2)" shape-rendering="crispEdges">'+sourcePixels+'<g stroke="#B8242A" stroke-width="0.55" fill="none">'+scan+'</g></g><path d="M300 38V200H820" fill="none" stroke="#BAC0C5"/><path d="M300 122H820" stroke="#DDD8D0" stroke-dasharray="4 5"/>'+profile+'<g fill="#4A535A" font-family="system-ui,Microsoft YaHei" font-size="16"><text x="28" y="30">实际图像局部</text><text x="28" y="225">红线：y='+cy+'</text><text x="260" y="48">255</text><text x="276" y="204">0</text><text x="300" y="225">x='+x0+'</text><text x="750" y="225">x='+(x1-1)+'</text><text x="420" y="253">横轴：图像中的像素位置</text></g></svg></div><figcaption>沿左图红线逐个像素取值，只把轮廓内的 '+values.filter(v=>v!=null).length+' 个像素画为亮度曲线；'+values.filter(v=>v==null).length+' 个轮廓外背景位置不连线。观察曲线内部的相邻点起伏，理解纹理怎样变成数值。</figcaption></figure>';
  }

  function exampleProportions() {
    return '<figure class="fx-chart"><div class="m1-example"><p><b>同一份材料</b>：1粒大颗粒（200像素）＋4粒小颗粒（每粒20像素）</p><p>按颗粒数：大颗粒 <b>1 ÷ 5 = 20%</b></p><div style="display:flex;height:22px;border-radius:9px;overflow:hidden"><span style="width:20%;background:#B8242A"></span><span style="width:80%;background:#687F94"></span></div><p>按可见面积：大颗粒 <b>200 ÷ 280 ≈ 71.4%</b></p><div style="display:flex;height:22px;border-radius:9px;overflow:hidden"><span style="width:71.4286%;background:#B8242A"></span><span style="width:28.5714%;background:#687F94"></span></div></div><figcaption>红色为大颗粒，蓝灰色为四粒小颗粒。材料没有改变，改变的是每粒的权重与整盘分母。主演示的每个比例由当前检出轮廓重新累加。</figcaption></figure>';
  }

  const chapters = [
    {id:'m1-origin', en:'FROM THE BIT', title:'先知道：这一盘岩屑从哪里来', html:'<p>钻头钻碎地下岩石，产生的碎片叫<b>岩屑</b>。钻井液从钻杆内向下流出，再沿钻杆外侧的井眼空间返到地面，把碎片带回。地面的<b>振动筛</b>分开碎片与液体，录井人员整理样品、适当清洗，再用放大观察辨认岩石。</p><p><b>岩性</b>就是对岩石类型的描述。记录一盘样品中的岩性及其变化，可以帮助了解钻过了什么地层。样品从井底走到地面需要时间，因此地面照片还要保留样品身份，才能连回较早的来源井段。</p><div class="fx-note"><b>这例要解决的问题</b><p>面对一盘颜色相近的碎片，机器怎样逐粒给出可检查的候选？把它们汇总为一盘比例时，应该怎样计算？先看真实岩石，再进入可控的像素实验。</p></div>'+sourceNote},
    {id:'m1-rocks', en:'READ THE ROCK', title:'看真实岩芯，认识颜色之外的线索', html:'<p><b>岩芯</b>是取出的较完整岩石，能保留结构；岩屑经过破碎和搬运，结构常不完整。下面六张照片来自公开岩芯数据，每张原图块覆盖2×2厘米。先在同类两张之间比较，再比较不同类型。</p><div class="fx-grid m1-photo-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px">'+photoCards()+'</div><p>照片沿用原数据标签：砂岩、页岩和灰岩。<b>页岩</b>常沿薄层劈开；演示中的“泥岩教学外观”指合成盘里的细粒层状纹理分组。观察时，把颗粒、纹理与结构放在一起比较。</p><p class="fx-note">照片：Fatimah Alzubaidi (2021)，岩芯托盘来自 Geological Survey of South Australia；'+sourceLink('Lithology dataset V1','https://data.mendeley.com/datasets/b6rj29mrss/1')+'，CC BY 4.0。</p>'},
    {id:'m1-pixels', en:'OUTLINE AND TEXTURE', title:'先找到轮廓，再把外观变成可比较的数值', html:'<p><b>分割</b>是找出属于岩屑的像素；相邻的前景像素连成一块，称为<b>连通域</b>，本例把它作为一个检出颗粒。两粒靠拢、泥浆遮盖或严重过曝，都会影响轮廓，因此先检查“圈到了什么”，再问“它像什么”。</p><p><b>RGB</b>表示红、绿、蓝三个颜色通道，每个像素的通道值为0–255。轮廓内的颜色均值、明暗差异、纹理和形状，称为<b>特征</b>。已知颜色的参考片帮助校正照明影响；被遮住或过曝截断的信息仍会丢失。下图在实际局部标出扫描位置，再把轮廓内像素的亮度展开。</p>'+staticFeatureFigure()+'<p><b>k近邻</b>把当前颗粒的特征与有标注的参考颗粒比较；k是选取的参考颗粒个数。<b>距离越小，表示这些特征越相似</b>，再用距离加权形成候选。特征尺度由训练组确定。支持度表示近邻投票中支持这个候选的份额。</p><p>本例16维分类特征包含颜色、纹理和形状；<b>绝对像素面积用于整盘汇总，不进入16维分类距离</b>。演示将实际近邻图片、距离与颜色规则基线放在一起，便于回查依据。</p><p class="fx-note">先在同一盘内调照明和附着，观察选中位置的轮廓与近邻怎样变化；再切换摆盘，比较相同坐标的轮廓形状与交叠。</p>'},
    {id:'m1-summary', en:'TWO DENOMINATORS', title:'最后说明：你统计的是颗粒数，还是可见面积', html:'<p>按<b>颗粒数</b>统计，每个检出颗粒都是一票；按<b>可见面积</b>统计，每个像素都是一票。一粒大岩屑与几粒小岩屑，因此会得到不同的占比。</p>'+exampleProportions()+'<p>主演示同时显示两个分母：全部检出轮廓的数量、这些轮廓覆盖的可见像素之和。<b>待复核仍保留在分母里</b>。轮廓合并时，计数可能减少；可见像素受遮盖时，面积也会改变。</p><p class="fx-note">两条比例带分别回答：这一盘里各类颗粒有多少、各占多大可见面积。读数时连同分子和分母一起比较。</p>'}
  ];
  const steps = [
    {name:'样品登记', input:'当前白光图像与样品身份', action:'把图像连接到样品和拍摄记录', output:'身份键、实际像素与当前研究位置'},
    {name:'参考片校正', input:'原图灰片像素和已知目标颜色', action:'逐通道计算参考均值并校正', output:'参考片RGB、校正图及质控提示'},
    {name:'颗粒分割', input:'校正后的白光像素', action:'前景比较与四邻域连通', output:'检出轮廓、像素面积与对象跟踪状态'},
    {name:'特征描述', input:'当前轮廓内的可见像素', action:'计算颜色、纹理和形状共16维', output:'与当前局部图像对应的特征值'},
    {name:'近邻与基线比较', input:'当前特征与独立训练库', action:'按标准化距离投票，同轮廓运行颜色规则', output:'真实近邻、距离、支持度和两种候选'},
    {name:'双口径汇总', input:'全部检出轮廓及候选', action:'分别累加颗粒数与可见像素', output:'两个分母、各类分子和待复核份额'}
  ];

  const labHTML = '<style>.fx-exhibit[data-scene="m1"] .m1-conditions{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px}.fx-exhibit[data-scene="m1"] .m1-conditions label{display:grid;gap:9px;font-size:16px}.fx-exhibit[data-scene="m1"] input[type=range]{width:100%;accent-color:#B8242A}.fx-exhibit[data-scene="m1"] .m1-canvases{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.fx-exhibit[data-scene="m1"] .m1-canvases canvas{width:100%;height:auto;border:1px solid #DDD5CA;border-radius:14px;background:#F3F0EB;image-rendering:auto}.fx-exhibit[data-scene="m1"] .m1-grains{display:flex;gap:8px;flex-wrap:wrap}.fx-exhibit[data-scene="m1"] .m1-grains button[aria-pressed=true]{background:#B8242A;color:white;border-color:#B8242A}.fx-exhibit[data-scene="m1"] .m1-feature-layout{display:grid;grid-template-columns:minmax(180px,.7fr) minmax(0,1.3fr);gap:24px;align-items:start}.fx-exhibit[data-scene="m1"] .m1-selected-patch{width:100%;max-width:280px;image-rendering:pixelated;border-radius:14px;border:1px solid #DDD5CA}.fx-exhibit[data-scene="m1"] .m1-neighbors{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.fx-exhibit[data-scene="m1"] .m1-neighbor canvas{width:100%;height:105px;object-fit:contain;image-rendering:pixelated;background:#F0ECE5;border-radius:12px}.fx-exhibit[data-scene="m1"] .m1-neighbor p{font-size:16px;line-height:1.65;overflow-wrap:anywhere}.fx-exhibit[data-scene="m1"] .m1-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.fx-exhibit[data-scene="m1"] .m1-stack{display:flex;height:28px;border-radius:9px;overflow:hidden;background:#E9E4DC}.fx-exhibit[data-scene="m1"] .m1-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px;font-size:16px}.fx-exhibit[data-scene="m1"] .m1-dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:7px}.fx-exhibit[data-scene="m1"] table{width:100%;border-collapse:collapse;font-size:16px}.fx-exhibit[data-scene="m1"] td,.fx-exhibit[data-scene="m1"] th{padding:10px 8px;border-bottom:1px solid #E8E0D5;text-align:left}.fx-exhibit[data-scene="m1"] .m1-state{padding:16px 20px;border-left:4px solid #B8242A;background:#FBF1EC;border-radius:0 14px 14px 0;margin:18px 0}.fx-exhibit[data-scene="m1"] [data-m1-panel][hidden]{display:none}.fx-exhibit[data-scene="m1"] .m1-readout{font-variant-numeric:tabular-nums;font-weight:650}.fx-exhibit[data-scene="m1"] button:focus-visible,.fx-exhibit[data-scene="m1"] canvas:focus-visible{outline:3px solid #B78B45;outline-offset:3px}.fx-exhibit[data-scene="m1"] .m1-photo-grid h3{margin-top:12px}@media(max-width:650px){.fx-exhibit[data-scene="m1"] .m1-canvases,.fx-exhibit[data-scene="m1"] .m1-feature-layout,.fx-exhibit[data-scene="m1"] .m1-comparison{grid-template-columns:1fr}.fx-exhibit[data-scene="m1"] .m1-neighbors{gap:8px}.fx-exhibit[data-scene="m1"] .m1-neighbor p{font-size:16px}.fx-exhibit[data-scene="m1"] .m1-legend{grid-template-columns:1fr}.fx-exhibit[data-scene="m1"] .m1-canvases figure{margin:0}}</style>' +
    '<p>先看轮廓，再看依据，最后说明整盘比例。调节照明和附着，比较选中位置；切换“重排教学盘”，再比较同一坐标的摆盘差异。</p>' +
    '<div class="fx-card m1-conditions"><label>照明增益 <output id="m1-light-value" class="m1-readout">1.00倍</output><input id="m1-light" type="range" min="0.4" max="2.2" step="0.05" value="1"></label><label>泥浆附着（教学覆盖强度）<output id="m1-coating-value" class="m1-readout">0%</output><input id="m1-coating" type="range" min="0" max="1" step="0.05" value="0"></label><label>教学盘情景<select id="m1-preset"><option value="default">原始教学盘：正常分散</option><option value="merged">重排教学盘：中排靠拢</option><option value="occluded">原盘局部遮盖</option></select></label></div>' +
    '<nav class="fx-stage-nav fx-toolbar" aria-label="岩屑演示的三个观察阶段"><button type="button" data-m1-stage="0" aria-pressed="true">观察样品</button><button type="button" data-m1-stage="1" aria-pressed="false">轮廓与特征</button><button type="button" data-m1-stage="2" aria-pressed="false">近邻与整盘统计</button></nav>' +
    '<div id="m1-tracking" class="m1-state" aria-live="polite">正在计算默认样品…</div>' +
    '<section data-m1-panel="0"><h3>先看：参考片和岩屑处于同一张图</h3><p>左图是当前观测；右图的轮廓由校正后的实际像素计算。灰片位于左上角。RGB是红绿蓝三个通道，每个通道值为0–255。点击右图中的颗粒，或使用下面的颗粒按钮。</p><div class="m1-canvases"><figure><canvas id="m1-raw" aria-label="当前原始白光样品，包含左上角参考片"></canvas><figcaption>当前白光像素</figcaption></figure><figure><canvas id="m1-outlines" aria-label="校正后的岩屑与计算轮廓，可点击选粒" tabindex="0"></canvas><figcaption>轮廓跟随像素；红色为选中位置的当前轮廓，蓝灰色为其他轮廓</figcaption></figure></div><div id="m1-reference" class="fx-note"></div><h4>选择当前教学盘中的区域</h4><div id="m1-grains" class="m1-grains"></div><p class="fx-note">试一试：先选原盘中排左侧相邻区域，再切换“重排教学盘”，比较相同坐标的新轮廓与原轮廓的空间交叠。照明升到2.2倍时，可观察原位置失去轮廓；降低照明后再回到这个位置。</p></section>' +
    '<section data-m1-panel="1" hidden><h3>当前区域，是怎样被描述的</h3><p>局部图对应当前轮廓，旁边数值只从轮廓内像素计算。泥浆附着会盖住纹理；照明过曝会把不同颜色截断到相同上限。</p><div id="m1-features"></div></section>' +
    '<section data-m1-panel="2" hidden><h3>先查近邻，再读整盘结果</h3><div id="m1-methods"></div><h4>来自实际训练库的前三个近邻</h4><div id="m1-neighbors" class="m1-neighbors"></div><p class="fx-note">距离在标准化后的16维特征空间计算，越小表示这些特征越相似。k是参与投票的参考颗粒数；支持度是距离加权投票的份额，帮助识别近邻分歧。</p><h3>一盘样品，两种口径</h3><p>两条带使用同一组模型候选；颜色规则基线也对同一批轮廓汇总。待复核留在分母中。</p><div id="m1-proportions"></div></section>';

  let trainingLibrary = null;
  function mount(host) {
    const $ = id => host.querySelector('#' + id);
    const doc = host.ownerDocument;
    const state = {id:'s17-cuttings-lithology',version:'1.9.0',status:'not_run',revision:1,count:0,stage:0,selected:null,anchor:null,tracking:null,run:null};
    let pending = null;
    const getOptions = () => ({light:Number($('m1-light').value),coating:Number($('m1-coating').value),yellow:0,merge:$('m1-preset').value==='merged',occlude:$('m1-preset').value==='occluded'});
    function setStatus(status,message) {
      state.status = status;
      const node = doc.getElementById('status');
      if (node) {node.textContent=message;node.className='status '+status;}
      const exportButton=doc.getElementById('export');if(exportButton)exportButton.disabled=status!=='ready';
      const runButton=doc.getElementById('run');if(runButton)runButton.disabled=status==='running';
    }
    function imageToCanvas(canvas,image) {
      canvas.width=image.width;canvas.height=image.height;
      canvas.getContext('2d',{willReadFrequently:true}).putImageData(new ImageData(new Uint8ClampedArray(image.pixels),image.width,image.height),0,0);
    }
    function cropped(image,bbox,padding=4) {
      const x0=Math.max(0,bbox[0]-padding),y0=Math.max(0,bbox[1]-padding),x1=Math.min(image.width,bbox[2]+padding),y1=Math.min(image.height,bbox[3]+padding),width=x1-x0,height=y1-y0,pixels=new Uint8ClampedArray(width*height*4);
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)pixels.set(image.pixels.subarray((y*image.width+x)*4,(y*image.width+x)*4+4),((y-y0)*width+x-x0)*4);
      return {width,height,pixels};
    }
    function setAnchor(index,point) {
      const result=state.run?.inference.results[index];if(!result)return;
      const b=result.component.bbox,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
      let p=point?point[1]*320+point[0]:result.component.indices.reduce((best,q)=>((q%320-cx)**2+(Math.floor(q/320)-cy)**2)<((best%320-cx)**2+(Math.floor(best/320)-cy)**2)?q:best,result.component.indices[0]);
      if(!result.component.indices.includes(p))p=result.component.indices[0];
      state.anchor={x:p%320,y:Math.floor(p/320),pixel:p,originalBBox:[...b],originalIndices:[...result.component.indices],referenceComponents:state.run.inference.results.map(r=>new Set(r.component.indices)),selectionRevision:state.revision,arrangement:state.run.config.arrangement};
      track();
    }
    function track() {
      const inf=state.run?.inference;if(!inf||!state.anchor)return;
      const index=inf.results.findIndex(r=>r.component.indices.includes(state.anchor.pixel));state.selected=index>=0?index:null;
      const identityStatus=state.anchor.arrangement===state.run.config.arrangement?'same_layout_observation':'unconfirmed_after_rearrangement';
      if(index<0){state.tracking={state:'missing',identityStatus,contributors:0,retainedPixels:0,referenceArea:state.anchor.originalIndices.length};return;}
      const indices=new Set(inf.results[index].component.indices),contributors=state.anchor.referenceComponents.reduce((n,set)=>{let overlap=0;for(const p of indices)if(set.has(p))overlap++;return n+(overlap>=35?1:0);},0),retained=state.anchor.originalIndices.reduce((n,p)=>n+Number(indices.has(p)),0);
      state.tracking={state:contributors>1?'merged':'present',identityStatus,contributors,retainedPixels:retained,referenceArea:state.anchor.originalIndices.length};
    }
    const selected = () => state.selected==null?null:state.run?.inference.results[state.selected];
    function trackingText() {
      if(!state.run||!state.anchor)return '正在准备当前样品…';
      const pos='固定图像位置 ('+state.anchor.x+', '+state.anchor.y+')';
      if(state.tracking.identityStatus==='unconfirmed_after_rearrangement'){const r=selected();return '<b>教学盘已重排 · 比较当前位置</b> · '+pos+'。'+(r?'这个位置当前检出区域 '+(state.selected+1)+'，面积 '+r.component.area+' 像素。'+(state.tracking.contributors>1?'新轮廓与原盘 '+state.tracking.contributors+' 个检出区域的位置相交；查看新旧轮廓在此处的交叠。':'下方显示的是新盘当前位置的特征与近邻。'):'新盘在这个位置没有轮廓，原锚点保留。');}
      if(state.tracking.state==='missing')return '<b>原位置的轮廓消失</b> · '+pos+'。图上用虚线保留观察位置。降低照明或恢复摆盘条件后，再检查原位置。';
      const r=selected();
      if(state.tracking.state==='merged')return '<b>原位置仍在，但轮廓合并了</b> · '+pos+'。当前连通域覆盖先前 '+state.tracking.contributors+' 个检出区域，合计 '+r.component.area+' 像素；这里描述的是合并后的区域。';
      return '<b>当前教学盘的区域 '+(state.selected+1)+'</b> · '+pos+' · 轮廓内 '+r.component.area+' 像素。三个视角始终跟随这个位置；照明和附着可在本盘内比较。';
    }
    function drawImages() {
      const run=state.run;if(!run)return;
      imageToCanvas($('m1-raw'),run.data.observations.white);imageToCanvas($('m1-outlines'),run.inference.image);
      const canvas=$('m1-outlines'),ctx=canvas.getContext('2d'),mask=run.inference.segmentation.mask;
      for(const r of run.inference.results){const chosen=r.index===state.selected;ctx.fillStyle=chosen?'rgba(184,36,42,.78)':'rgba(104,127,148,.62)';for(const p of r.component.indices){const x=p%320,y=Math.floor(p/320);if(x===0||x===319||y===0||y===239||!mask[p-1]||!mask[p+1]||!mask[p-320]||!mask[p+320])ctx.fillRect(x,y,1,1);}const b=r.component.bbox;ctx.font='bold 10px system-ui';ctx.fillStyle=chosen?'#B8242A':'#384958';ctx.fillText(String(r.index+1),b[0],Math.max(12,b[1]-3));}
      if(state.anchor){ctx.strokeStyle='#B8242A';ctx.lineWidth=1.5;ctx.setLineDash(state.selected==null?[4,3]:[]);const b=state.selected==null?state.anchor.originalBBox:selected().component.bbox;ctx.strokeRect(b[0]-2,b[1]-2,b[2]-b[0]+4,b[3]-b[1]+4);ctx.setLineDash([]);ctx.beginPath();ctx.arc(state.anchor.x,state.anchor.y,3,0,Math.PI*2);ctx.stroke();}
    }
    function table(head,rows) {return '<div style="overflow-x:auto"><table><thead><tr>'+head.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
    function featureRows(r) {return [['平均红 / 绿 / 蓝',r.x.slice(0,3).map(v=>fmt(v,3)).join(' / '),'颜色：通道值除以255'],['水平 / 垂直明暗变化',fmt(r.x[6],3)+' / '+fmt(r.x[7],3),'纹理：相邻像素亮度差'],['紧致度',fmt(r.x[10],3),'形状：面积与轮廓长度的关系'],['可见面积（汇总量）',r.component.area+' 像素','用于整盘比例，不进入16维分类距离']];}
    function proportionsHTML(key='model') {
      const results=state.run.inference.results,count=C.proportions(results,key,'count'),area=C.proportions(results,key,'area');
      return '<article class="fx-card"><h4>'+(key==='model'?'多特征近邻':'颜色规则')+'</h4>'+[[count,'颗粒数', '粒'],[area,'可见面积','像素']].map(([p,label,unit])=>'<p><b>'+label+'</b> · 分母 '+p.denominator+' '+unit+'</p><div class="m1-stack" role="img" aria-label="'+label+'，分母'+p.denominator+unit+'；'+shortNames.map((n,i)=>n+p.weights[i]+unit).join('，')+'">'+p.fractions.map((v,i)=>'<span style="width:'+((v??0)*100)+'%;background:'+colors[i]+'" title="'+names[i]+' '+p.weights[i]+'/'+p.denominator+' '+unit+'，'+pct(v)+'"></span>').join('')+'</div><div class="m1-legend">'+shortNames.map((n,i)=>'<span><i class="m1-dot" style="background:'+colors[i]+'"></i>'+n+' <b>'+p.weights[i]+'/'+p.denominator+'</b> '+pct(p.fractions[i])+'</span>').join('')+'</div>').join('')+'</article>';
    }
    function render() {
      if(!state.run)return;
      const run=state.run,r=selected();drawImages();
      $('m1-light-value').textContent=fmt(getOptions().light)+'倍';$('m1-coating-value').textContent=pct(getOptions().coating);
      $('m1-tracking').innerHTML=trackingText();
      $('m1-reference').innerHTML='<b>当前参考片：</b>原始 RGB 均值 '+run.inference.image.reference.map(v=>fmt(v,1)).join(' / ')+'，目标为 210 / 210 / 210。'+(run.inference.image.quality.length?'<strong>'+esc(run.inference.image.quality.join('；'))+'。</strong>':'按三通道增益校正后再分割。')+'当前检出 '+run.inference.results.length+' 个轮廓。';
      $('m1-grains').innerHTML=run.inference.results.length?run.inference.results.map((v,i)=>'<button type="button" data-m1-grain="'+i+'" aria-pressed="'+String(i===state.selected)+'" aria-label="选择颗粒'+(i+1)+'，'+v.component.area+'像素">'+(i+1)+' · '+v.component.area+'像素</button>').join(''):'<p>当前没有检出轮廓。原锚点保留，降低照明后继续观察。</p>';
      if(r){$('m1-features').innerHTML='<div class="m1-feature-layout"><figure><canvas class="m1-selected-patch" id="m1-selected-patch" aria-label="当前选中轮廓的实际图像局部"></canvas><figcaption>当前轮廓的像素局部，放大只为观察</figcaption></figure><div>'+table(['观察维度','当前值','怎样读取'],featureRows(r))+'<p class="fx-note">颜色、纹理和形状进入16维近邻比较；绝对像素面积单列用于整盘汇总。</p></div></div>';imageToCanvas($('m1-selected-patch'),cropped(run.inference.image,r.component.bbox));
        $('m1-methods').innerHTML='<div class="m1-comparison"><article class="fx-card"><h4>只看颜色的规则</h4><p><b>'+names[r.baseline]+'</b></p><p>当前红蓝差 <b>'+fmt(r.x[0]-r.x[2],3)+'</b>，平均亮度 <b>'+fmt((r.x[0]+r.x[1]+r.x[2])/3,3)+'</b>。</p><p>规则：红蓝差大于 '+fmt(run.config.rules.red,3)+' → 砂岩外观；否则亮度大于 '+fmt(run.config.rules.light,2)+' → 灰岩外观；其余 → 泥岩外观。界限由验证组确定。</p></article><article class="fx-card"><h4>颜色＋纹理＋形状近邻</h4><p><b>'+names[r.prediction.label]+'</b> · 支持度 '+pct(r.prediction.support)+'</p><p>k='+run.config.k+'，即 '+run.config.k+' 个参考颗粒参与投票。'+esc(r.prediction.reasons.join('；')||'当前近邻满足支持度与距离条件')+'。距离越小表示特征越相似。</p></article></div>';
        const near=r.prediction.neighbors.slice(0,3);$('m1-neighbors').innerHTML=near.map((n,i)=>'<article class="m1-neighbor"><canvas id="m1-neighbor-'+i+'" aria-label="第'+(i+1)+'近邻的实际训练颗粒局部"></canvas><p><b>'+names[n.label]+'</b><br>距离 '+fmt(n.distance,3)+'<br>训练托盘 '+esc(run.library.model.samples[n.index].group.replace('IMG-TRAIN-',''))+'</p></article>').join('');near.forEach((n,i)=>{const q=run.library.model.samples[n.index];imageToCanvas($('m1-neighbor-'+i),cropped(q.image,q.bbox));});
      }else{$('m1-features').innerHTML='<p class="fx-note">原锚点当前没有检出轮廓，因此这次没有该对象的特征。观察画布上的虚线位置，恢复条件后可继续。</p>';$('m1-methods').innerHTML='<p class="fx-note">原位置没有轮廓，暂停该对象的分类比较。</p>';$('m1-neighbors').innerHTML='<p>没有为原位置计算近邻。</p>';}
      $('m1-proportions').innerHTML='<div class="m1-comparison">'+proportionsHTML('model')+proportionsHTML('baseline')+'</div>'+(r?'<p class="fx-note">当前教学盘的选中区域在颗粒数口径中占 <b>1/'+run.inference.results.length+'</b>；在可见面积口径中占 <b>'+r.component.area+'/'+C.proportions(run.inference.results).denominator+'</b> 像素。'+(state.tracking.state==='merged'?'当前计数把这团相连区域算作一粒，因此要先核查轮廓。':'')+'</p>':'');
    }
    function recalculate() {
      if(pending){clearTimeout(pending);pending=null;}
      setStatus('running','正在从当前像素计算轮廓、特征与近邻…');
      try {
        if(!trainingLibrary)trainingLibrary=C.train('full');
        const options=getOptions(),data=g.S17Images.sample(17,options,1),config={...trainingLibrary.chosen,rules:trainingLibrary.rules,mode:'full',calibrate:true,light:options.light,coating:options.coating,preset:$('m1-preset').value,arrangement:options.merge?'rearranged_teaching_tray':'original_teaching_tray'};
        // Prediction receives observations only. Evaluation is a separate call after inference.
        const inference=C.infer(data.observations,trainingLibrary.model,config),metrics=C.evaluate(inference,data.evaluationTruth);
        state.run={runId:state.id+'-r'+(++state.count)+'-v'+state.revision,revision:state.revision,seed:17,dataVersion:'s17-paired-images-v1',method:'visible_pixel_components + standardized_weighted_kNN',split:trainingLibrary.groups,data,library:trainingLibrary,inference,metrics,config,counts:{detected:inference.results.length,train:trainingLibrary.trainCount,validation:trainingLibrary.validationCount,visiblePixels:C.proportions(inference.results).denominator}};
        if(!state.anchor&&inference.results.length){const disagreement=inference.results.findIndex(v=>v.prediction.label!==v.baseline);setAnchor(disagreement>=0?disagreement:0);}else track();
        state.status='ready';render();setStatus('ready','当前教学盘已更新 · '+inference.results.length+' 个检出轮廓 · 继续检查选中图像位置。');g.S17Exhibit?.changed?.();return snapshot();
      }catch(error){setStatus('error','计算未完成：'+error.message);throw error;}
    }
    function snapshot() {
      const r=state.run;return {id:state.id,status:state.status,revision:state.revision,selected:state.selected,stage:state.stage,anchor:state.anchor?{x:state.anchor.x,y:state.anchor.y,pixel:state.anchor.pixel,originalBBox:state.anchor.originalBBox,selectionRevision:state.anchor.selectionRevision,arrangement:state.anchor.arrangement}:null,tracking:state.tracking,run:r?{runId:r.runId,config:r.config,metrics:r.metrics,method:r.method,counts:r.counts,stepCount:6,summary:{count:C.proportions(r.inference.results,'model','count'),area:C.proportions(r.inference.results),baselineCount:C.proportions(r.inference.results,'baseline','count'),baselineArea:C.proportions(r.inference.results,'baseline','area')},selectedResult:selected()?{index:state.selected,label:selected().prediction.label,baseline:selected().baseline,support:selected().prediction.support,area:selected().component.area,features:[...selected().x],neighbors:selected().prediction.neighbors.slice(0,3).map(n=>({group:r.library.model.samples[n.index].group,label:n.label,distance:n.distance}))}:null}:null,reviews:[]};
    }
    function evidence() {
      if(state.status!=='ready')throw Error('当前输入还在计算，请完成后保存');
      const r=state.run,U=g.S17UI,id=r.data.observations.identity.parentSampleId;
      const source=U.source(id+'-white',r.revision,'image_region',{kind:'observation',...r.data.observations.identity,imageDataURL:$('m1-raw').toDataURL(),width:320,height:240,dataNature:'synthetic_teaching',capture:r.data.observations.capture,teachingScenario:{arrangement:r.config.arrangement,preset:r.config.preset}});
      const claims=r.inference.results.map((v,i)=>U.claim(id+'-grain-'+i,'颗粒'+(i+1)+'外观候选：'+names[v.prediction.label]+'。',source.sourceRecordId,r.revision,{type:'image_region',bbox:v.component.bbox},{value:v.prediction.label,unit:'teaching_class',method:{name:r.method,support:v.prediction.support,neighbors:v.prediction.neighbors.map(n=>({group:r.library.model.samples[n.index].group,label:n.label,distance:n.distance}))},reviewHistory:[]}));
      return U.envelope(state.id,state.version,r,{sources:[source],claims,metrics:r.metrics,summary:{count:C.proportions(r.inference.results,'model','count'),area:C.proportions(r.inference.results)},reviewHistory:[],selection:{anchor:snapshot().anchor,tracking:state.tracking},limitations:['教学合成外观，不是矿物成分测量。','可见二维面积/计数不等于地层质量、体积或组成。','分类在匹配颗粒上评价，分割漏检/合并单独保留。','人工修订不回写模型指标。']});
    }
    function outlineSVG() {
      const results=state.run.inference.results;
      return '<svg viewBox="0 0 340 260" role="img" aria-label="当前实际检出轮廓的包围范围"><rect x="10" y="10" width="320" height="240" rx="10" fill="#F1ECE4"/>'+results.map((r,i)=>{const b=r.component.bbox;return '<rect x="'+(b[0]+10)+'" y="'+(b[1]+10)+'" width="'+(b[2]-b[0])+'" height="'+(b[3]-b[1])+'" rx="3" fill="'+(i===state.selected?'rgba(184,36,42,.18)':'rgba(104,127,148,.1)')+'" stroke="'+(i===state.selected?'#B8242A':'#687F94')+'"/><text x="'+(b[0]+13)+'" y="'+(b[1]+24)+'" font-family="system-ui" font-size="12" fill="#39434A">'+(i+1)+'</text>';}).join('')+'</svg>';
    }
    function flowHTML(stepIndex) {
      if(!state.run)return '<p>默认样品正在计算，完成后这里显示同一盘的实际输入和产物。</p>';
      const r=state.run,p=selected();
      const canvasFigure=(id,caption,width=210)=>{const canvas=$(id);return canvas?'<figure style="margin:8px 0;max-width:'+width+'px"><img src="'+canvas.toDataURL('image/png')+'" alt="'+esc(caption)+'" style="display:block;width:100%;height:auto;border:1px solid #ddd5ca;border-radius:10px;image-rendering:pixelated"><figcaption>'+esc(caption)+'</figcaption></figure>':'';};
      const reference=r.inference.image.reference, target=r.data.observations.calibration.referenceRGB, channels=['R','G','B'],channelColors=['#b85a55','#718b68','#627f9a'];
      const referenceChart='<div data-m1-reference-chart role="group" aria-label="参考片三个通道的当前均值、目标值和校正增益" style="max-width:520px;font-size:16px;line-height:1.5;color:#343941;font-variant-numeric:tabular-nums">'+reference.map((v,i)=>{const w=Math.max(0,Math.min(255,v))/255*100,x=Math.max(0,Math.min(255,target[i]))/255*100,gain=target[i]/Math.max(1,v);return '<div style="display:grid;grid-template-columns:24px minmax(64px,1fr) auto;align-items:center;gap:8px;margin:10px 0"><strong>'+channels[i]+'</strong><span aria-hidden="true" style="display:block;position:relative;height:20px;border-radius:4px;background:#eee8e0"><span style="display:block;width:'+w.toFixed(2)+'%;height:100%;border-radius:4px;background:'+channelColors[i]+'"></span><span style="position:absolute;left:'+x.toFixed(2)+'%;top:-3px;height:26px;width:2px;background:#343941"></span></span><span style="font-size:16px;white-space:nowrap" aria-label="当前均值 '+fmt(v,1)+'，目标 '+fmt(target[i],0)+'，增益 '+fmt(gain,3)+'">'+fmt(v,1)+' → '+fmt(target[i],0)+' · ×'+fmt(gain,3)+'</span></div>';}).join('')+'<div style="font-size:16px;color:#62636a">量程 0–255 · 竖线为目标</div></div>';
      const neighborCards=()=>p?p.prediction.neighbors.slice(0,3).map((n,i)=>{const sample=r.library.model.samples[n.index],caption='第'+(i+1)+'近邻 · '+names[n.label]+' · 距离 '+fmt(n.distance,3)+' · 训练托盘 '+sample.group.replace('IMG-TRAIN-','');return canvasFigure('m1-neighbor-'+i,caption,132);}).join(''):'';
      const actual=[
        ()=>'<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">'+canvasFigure('m1-raw','当前白光样品与左上角参考片',190)+'<p>样品 <b>'+esc(r.data.observations.identity.parentSampleId)+'</b> · 拍摄 '+esc(r.data.observations.identity.capturePairId)+'<br>'+(r.config.arrangement==='rearranged_teaching_tray'?'重排教学盘':'原始教学盘')+' · 320×240 像素<br>照明 '+fmt(r.config.light)+' 倍 · 附着 '+pct(r.config.coating)+'。</p></div>',
        ()=>'<p>参考片当前 RGB 均值与目标值逐通道对应，增益由目标值除以当前均值计算。</p>'+referenceChart+'<p>'+esc(r.inference.image.quality.join('；')||'当前参考片读数已用于校正。')+'</p>',
        ()=>'<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">'+canvasFigure('m1-outlines','当前校正图上的实际轮廓',210)+'<p>当前检出 <b>'+r.inference.results.length+'</b> 个连通域，总可见面积 <b>'+C.proportions(r.inference.results).denominator+'</b> 像素。<br>'+trackingText()+'</p></div>',
        ()=>p?'<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">'+canvasFigure('m1-selected-patch','当前选中轮廓的像素局部',150)+'<div style="flex:1 1 320px">'+table(['当前对象的特征','数值','对应认识'],featureRows(p))+'</div></div>':'<p>原锚点没有检出轮廓，本步不产生该对象的特征。</p>',
        ()=>p?'<p>颜色规则 <b>'+names[p.baseline]+'</b>；多特征近邻 <b>'+names[p.prediction.label]+'</b>，支持度 '+pct(p.prediction.support)+'。k='+r.config.k+'；以下展示实际训练库中的前三个近邻。</p><div style="display:flex;gap:12px;flex-wrap:wrap">'+neighborCards()+'</div>':'<p>原锚点没有轮廓，恢复照明或摆盘条件后可继续查看近邻。</p>',
        ()=>proportionsHTML('model')
      ];
      return '<div data-m1-flow="'+stepIndex+'" data-flow-run="'+esc(r.runId)+'">'+actual[Math.max(0,Math.min(5,Number(stepIndex)||0))]()+'</div>';
    }
    function changeStage(stage) {state.stage=stage;host.querySelectorAll('[data-m1-stage]').forEach(button=>{const active=Number(button.dataset.m1Stage)===stage;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});host.querySelectorAll('[data-m1-panel]').forEach(panel=>panel.hidden=Number(panel.dataset.m1Panel)!==stage);}
    function reset() {if(pending)clearTimeout(pending);$('m1-light').value=1;$('m1-coating').value=0;$('m1-preset').value='default';state.revision++;state.anchor=null;state.selected=null;changeStage(0);return recalculate();}
    host.addEventListener('click',event=>{const stageButton=event.target.closest('[data-m1-stage]');if(stageButton){changeStage(Number(stageButton.dataset.m1Stage));return;}const grain=event.target.closest('[data-m1-grain]');if(grain&&state.status==='ready'){setAnchor(Number(grain.dataset.m1Grain));render();g.S17Exhibit?.changed?.();}});
    $('m1-outlines').addEventListener('click',event=>{if(state.status!=='ready')return;const rect=event.currentTarget.getBoundingClientRect(),x=Math.min(319,Math.max(0,Math.floor((event.clientX-rect.left)/rect.width*320))),y=Math.min(239,Math.max(0,Math.floor((event.clientY-rect.top)/rect.height*240))),p=y*320+x,index=state.run.inference.results.findIndex(r=>r.component.indices.includes(p));if(index>=0){setAnchor(index,[x,y]);render();g.S17Exhibit?.changed?.();}});
    for(const id of ['m1-light','m1-coating','m1-preset'])$(id).addEventListener('input',()=>{state.revision++;setStatus('stale','条件已改变，正在更新同一位置的观察结果…');$('m1-light-value').textContent=fmt(getOptions().light)+'倍';$('m1-coating-value').textContent=pct(getOptions().coating);if(pending)clearTimeout(pending);pending=setTimeout(recalculate,80);});
    const api={recalculate,reset,snapshot,evidence,flowHTML};
    // Let the default view paint before constructing the unchanged training library.
    pending=setTimeout(recalculate,20);
    return api;
  }

  function readingMount(root) {
    if(root.dataset.m1ReadingMounted==='1')return;root.dataset.m1ReadingMounted='1';
    root.addEventListener('click',event=>{const button=event.target.closest('[data-m1-photo-src]');if(!button||!root.contains(button))return;const figure=button.closest('[data-m1-photo]'),image=figure.querySelector('img');image.src=button.dataset.m1PhotoSrc;image.alt=button.dataset.m1PhotoLabel;figure.querySelectorAll('[data-m1-photo-src]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
  }
  g.M1Exhibit={title:'岩屑识别：先看清一粒，再说清一盘',lede:'岩性候选应当能回到可见的颗粒和相似样品；统计一盘岩屑时，还必须说清分母。',chapters,steps,labHTML,mount,readingMount};
})(globalThis);
