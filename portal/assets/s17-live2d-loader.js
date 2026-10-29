(function(g){'use strict';
// Reuse one site's local assets; standalone five-file exports need no external dependency.
if(!g.S17Page?.sceneId||g.S17Live2D||g.location.protocol==='about:'||g.location.protocol==='blob:')return;
setTimeout(async()=>{if(g.S17Assistant?.snapshot().parentOwned)return;try{const base=new URL('assets/',new URL(g.S17Page.portalHref,document.baseURI));
for(const file of ['vendor/pixi-6.5.10.min.js','vendor/live2dcubismcore.min.js','vendor/pixi-live2d-0.4.0.min.js','s17-live2d-data.js','s17-live2d.js']){if(g.S17Assistant?.snapshot().parentOwned)return;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL(file,base).href;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('local avatar assets absent'));};document.head.append(script);});}
}catch{const root=document.getElementById('s17-assistant');if(root)root.dataset.avatar='fallback';}},220);
})(window);
