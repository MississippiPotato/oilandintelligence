(function(g){'use strict';
const pack=g.M1PhotoTextures,M=g.S17Math,C=g.M1Core,clamp=v=>Math.min(255,Math.max(0,Math.round(v))),decoded=new Map();
const pixels=im=>{if(!decoded.has(im.key))decoded.set(im.key,Uint8Array.from(im.rgbHex.match(/../g),v=>parseInt(v,16)));return decoded.get(im.key);};
function sample(seed=17,options={},partition='observation'){
 const w=320,h=240,r=M.rng(seed),white=new Uint8ClampedArray(w*h*4),regions=[];
 for(let p=0;p<w*h;p++)white.set([30,63,108,255],p*4);
 for(let i=0;i<12;i++){
  const label=i%3,photo=pack.images.find(p=>p.label===label&&p.partition===partition),rgb=pixels(photo),cx=51+i%4*74+(r()-.5)*6-(options.merge&&i===6?43:0),cy=54+Math.floor(i/4)*68+(r()-.5)*4,rx=17+r()*10,ry=15+r()*8,phase=r()*Math.PI*2,sourceBox=[Math.floor(r()*60),Math.floor(r()*60),64,64],box=[Math.floor(cx-rx*1.2),Math.floor(cy-ry*1.2),Math.ceil(cx+rx*1.2),Math.ceil(cy+ry*1.2)];
  for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){
   const dx=(x-cx)/rx,dy=(y-cy)/ry,a=Math.atan2(dy,dx),rad=Math.hypot(dx,dy),boundary=1+.12*Math.sin(5*a+phase)+.07*Math.sin(9*a+phase);
   if(rad>boundary||x<0||y<0||x>=w||y>=h)continue;
   const sx=Math.min(127,sourceBox[0]+Math.floor((dx/2.4+.5)*64)),sy=Math.min(127,sourceBox[1]+Math.floor((dy/2.4+.5)*64)),p=y*w+x,q=(sy*128+sx)*3;
   for(let c=0;c<3;c++){let v=rgb[q+c];if(r()<(options.coating??0))v=.25*v+.75*[131,113,86][c];white[p*4+c]=clamp(v);}white[p*4+3]=255;
  }
  regions.push({photoKey:photo.key,bbox:box,sourceBox,cx,cy});
 }
 if(options.occlude)for(let y=84;y<112;y++)for(let x=22;x<150;x++)white.set([30,63,108,255],(y*w+x)*4);
 const gain=options.light??1;for(let i=0;i<white.length;i++)if(i%4!==3)white[i]=clamp(white[i]*gain);
 for(let y=5;y<17;y++)for(let x=6;x<19;x++)white.set([clamp(210*gain),clamp(210*gain),clamp(210*gain),255],(y*w+x)*4);
 return{observations:{white:{width:w,height:h,pixels:white},calibration:{referenceBox:[6,5,19,17],referenceRGB:[210,210,210]},identity:{wellId:'PHOTO-COMPOSITION',sampleId:'PHOTO-'+seed,parentSampleId:'PHOTO-'+seed,capturePairId:'WHITE-PHOTO-'+seed,splitGroupId:partition},capture:{dataNature:'mixed_teaching_and_public',material:'photo_texture_composition',photoRegions:regions}},evaluationTruth:null,metadata:{seed,partition,options,source:pack.source,license:pack.license,material:'Real core photo textures in constructed particle silhouettes; not a photographed cuttings tray.'}};
}
let libraryCache;
function library(){if(libraryCache)return libraryCache;const samples=[];
 for(let i=0;i<9;i++){const data=sample(1000+i*13,{light:.85+(i%4)*.1},'reference'),image=C.calibrated(data.observations.white,data.observations.calibration),seg=C.segment(image);for(const component of seg.components){const [x0,y0,x1,y1]=component.bbox,cx=(x0+x1)/2,cy=(y0+y1)/2,region=data.observations.capture.photoRegions.reduce((a,b)=>Math.hypot(cx-a.cx,cy-a.cy)<Math.hypot(cx-b.cx,cy-b.cy)?a:b),photo=pack.images.find(p=>p.key===region.photoKey);samples.push({x:C.feature(image,component),label:photo.label,group:photo.sourceFilename,bbox:component.bbox,image,component});}}
 const model={samples,scaler:M.fitScale(samples.map(s=>s.x))};
 // Fixed teaching settings, no test-photo tuning and no field-accuracy estimate.
 libraryCache={model,chosen:{k:5,support:.55,distance:5},rules:{red:.055,light:.52},grid:[],trainCount:samples.length,validationCount:0,validationF1:null,groups:{train:pack.images.filter(p=>p.partition==='reference').map(p=>p.sourceFilename),validation:[],test:pack.images.filter(p=>p.partition==='observation').map(p=>p.sourceFilename)},material:'photo_texture_composition',source:pack.source};return libraryCache;
}
function regionFor(run,s){const p=g.S17WBViews.selected('m1',run,s),regions=run.observations.capture?.photoRegions;if(!p||!Array.isArray(regions)||!regions.length||!regions.every(r=>Number.isFinite(r.cx)&&Number.isFinite(r.cy)&&Array.isArray(r.sourceBox)&&r.sourceBox.length===4&&r.sourceBox.every(Number.isFinite)&&pack.images.some(p=>p.key===r.photoKey)))return null;const b=p.component.bbox,x=(b[0]+b[2])/2,y=(b[1]+b[3])/2;return regions.reduce((a,b)=>Math.hypot(x-a.cx,y-a.cy)<Math.hypot(x-b.cx,y-b.cy)?a:b);}
function card(run,s){const region=regionFor(run,s);if(!region)return '';const p=pack.images.find(p=>p.key===region.photoKey),original=g.M1RealData.images.find(x=>x.sourceFilename===p.sourceFilename),V=g.S17WBViews;return `<div class="m1-material-card"><div><span class="wb-eyebrow">观察材料 / 真实纹理，可回看原图</span><h4>先看石头，再读特征</h4><p>选中轮廓的纹理取自这张真实岩芯照片；框内是所用局部。拼盘的颗粒外形与位置由程序构造，便于只改一个观察条件。</p><p>照片原标签：<b>${['砂岩','页岩','灰岩'][p.label]}</b>；模型候选见相邻结果。照片标签不进入当前预测。</p></div><figure><div class="m1-source-image"><img src="${original.dataURL}" alt="${['砂岩','页岩','灰岩'][p.label]}原始岩芯照片，原图块2×2厘米"><i style="left:${region.sourceBox[0]/128*100}%;top:${region.sourceBox[1]/128*100}%;width:50%;height:50%" aria-label="拼盘中所用纹理区域"></i></div><figcaption>原始岩芯图块 2×2 cm · 框为纹理来源，非岩屑实测尺寸</figcaption></figure></div>`;}
g.M1PhotoMaterial={sample,library,regionFor,card};
})(globalThis);
