(function(g){'use strict';if(g.S17ConceptHost)return;
function keepScale(host){host.querySelectorAll('svg[viewBox]').forEach(svg=>{const width=svg.viewBox.baseVal.width;if(width>0){const requested=parseFloat(svg.style.minWidth)||0;svg.style.minWidth=Math.max(width,requested)+'px';svg.style.height='auto';svg.style.maxHeight='none';}});}
function mount(root){for(const [scene,definition]of Object.entries(g.S17Concepts||{})){if(!root.querySelector('[data-concept-scene="'+scene+'"]'))continue;definition.mount(root);root.querySelectorAll('[data-concept-scene="'+scene+'"]').forEach(host=>{keepScale(host);if(host.dataset.ctScaleBound)return;host.dataset.ctScaleBound='true';new MutationObserver(()=>keepScale(host)).observe(host,{childList:true,subtree:true});});}}
g.S17ConceptHost={mount};
})(globalThis);
