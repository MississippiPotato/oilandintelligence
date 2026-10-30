(function(g){'use strict';
// The SVG entry is available immediately. Local avatar assets are requested on first open.
if(g.S17EnsureAvatar)return;
const source=document.currentScript?.src;
let loading=null,rootObserver=null,documentObserver=null;
function parentOwns(){return !!g.S17Assistant?.snapshot().parentOwned;}
function assetBase(){
 if(g.S17Page?.portalHref)return new URL('assets/',new URL(g.S17Page.portalHref,document.baseURI));
 return source?new URL('./',source):new URL('assets/',document.baseURI);
}
const files=[
 ['vendor/pixi-6.5.10.min.js',()=>!!g.PIXI],
 ['vendor/live2dcubismcore.min.js',()=>!!g.Live2DCubismCore],
 ['vendor/pixi-live2d-0.4.0.min.js',()=>!!g.PIXI?.live2d],
 ['s17-live2d-data.js',()=>!!g.S17AvatarData],
 ['s17-live2d.js',()=>!!g.S17Live2D]
];
function load(url){return new Promise((resolve,reject)=>{
 const node=document.createElement('script');node.src=url.href;node.async=true;
 node.onload=resolve;node.onerror=()=>{node.remove();reject(Error('local avatar assets absent'));};document.head.append(node);
});}
function ensure(){
 if(g.S17Live2D)return Promise.resolve(g.S17Live2D);
 if(parentOwns()||['about:','blob:'].includes(g.location.protocol))return Promise.resolve(null);
 if(loading)return loading;
 loading=(async()=>{
  const base=assetBase(),root=document.getElementById('s17-assistant');
  if(root)root.dataset.avatar='loading';
  try{
   for(const [file,present]of files){if(parentOwns())return null;if(!present())await load(new URL(file,base));}
   return g.S17Live2D||null;
  }catch(error){if(root&&!parentOwns())root.dataset.avatar='fallback';loading=null;return null;}
 })();return loading;
}
g.S17EnsureAvatar=ensure;
function observeRoot(){
 const root=document.getElementById('s17-assistant');if(!root||rootObserver)return false;
 documentObserver?.disconnect();
 rootObserver=new MutationObserver(()=>{if(root.dataset.open==='true')ensure();});
 rootObserver.observe(root,{attributes:true,attributeFilter:['data-open']});
 if(root.dataset.open==='true')ensure();return true;
}
document.addEventListener('click',event=>{
 if(event.target.closest?.('#s17-agent-launcher,#s17-agent-invite,#s17-agent-full,[data-s17-assistant]'))ensure();
},true);
if(!observeRoot()){
 documentObserver=new MutationObserver(observeRoot);documentObserver.observe(document.documentElement,{childList:true,subtree:true});
}
})(window);
