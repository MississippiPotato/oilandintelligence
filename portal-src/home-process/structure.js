export const layerBoundary=(x,i)=>[0,-.8,-2.1,-3.8,-5.2,-6.65][i]+(i?Math.exp(-(((x-4)/10)**2))*(.12+i*.3)+Math.sin(x*.19)*.13:0);
export const reservoirY=x=>(layerBoundary(x,3)+layerBoundary(x,4))/2;
export const perforationLevels=x=>[-.24,0,.24].map(d=>reservoirY(x)+d);
export const wellRadii={cementOuter:.37,casingOuter:.265,tubing:.085};
export function carriesFlow(selected,pathStage){if(!selected)return true;if(['drilling','mudlogging'].includes(selected))return ['drilling','mudlogging'].includes(pathStage);if(selected==='eor')return ['eor','production'].includes(pathStage);if(selected==='transport')return ['transport','production'].includes(pathStage);if(selected==='completion')return ['completion','perforation'].includes(pathStage);return selected===pathStage;}
